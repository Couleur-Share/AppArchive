import logger from '../utils/logger'

interface CacheEntry {
  url: string
  timestamp: number
  blob: Blob
  mime?: string
  size?: number
}

const DB_NAME = 'app-archive-image-cache'
const STORE_NAME = 'images'
const DB_VERSION = 1
const CACHE_TTL = Number(import.meta.env?.VITE_IMAGE_CACHE_TTL ?? 7 * 24 * 60 * 60 * 1000) // 默认 7 天
const MAX_ENTRIES = Number(import.meta.env?.VITE_IMAGE_CACHE_MAX ?? 120)

const objectUrlCache = new Map<string, string>()

const isBrowser = typeof window !== 'undefined' && typeof indexedDB !== 'undefined'

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

const waitForTx = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })

const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (!isBrowser) {
      reject(new Error('indexedDB 不可用'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' })
        store.createIndex('timestamp', 'timestamp')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

const buildObjectUrl = (url: string, blob: Blob) => {
  const prev = objectUrlCache.get(url)
  if (prev) {
    URL.revokeObjectURL(prev)
  }
  const objUrl = URL.createObjectURL(blob)
  objectUrlCache.set(url, objUrl)
  return objUrl
}

const pruneCache = async () => {
  if (!isBrowser) return
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  const index = store.index('timestamp')
  const now = Date.now()
  let kept = 0

  await new Promise<void>((resolve, reject) => {
    const cursorReq = index.openCursor(null, 'prev') // 最新的在前
    cursorReq.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
      if (!cursor) {
        resolve()
        return
      }
      const value = cursor.value as CacheEntry
      const expired = now - value.timestamp >= CACHE_TTL
      if (expired || kept >= MAX_ENTRIES) {
        cursor.delete()
      } else {
        kept += 1
      }
      cursor.continue()
    }
    cursorReq.onerror = () => reject(cursorReq.error)
  })

  await waitForTx(tx)
  db.close()
}

// 初始化缓存：清理过期数据与过量数据
export const initImageCache = async () => {
  if (!isBrowser) return
  try {
    await pruneCache()
  } catch (error) {
    logger.error('初始化图片缓存失败:', error)
  }
}

const readEntry = async (url: string): Promise<CacheEntry | undefined> => {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const entry = await requestToPromise(store.get(url))
  await waitForTx(tx)
  db.close()
  return entry
}

const saveEntry = async (entry: CacheEntry) => {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.put(entry)
  await waitForTx(tx)
  db.close()
}

// 获取缓存的图片，返回 object URL（供 <img> 直接使用）
export const getCachedImage = async (url: string): Promise<string | null> => {
  if (!isBrowser) return url
  try {
    const now = Date.now()
    const cached = await readEntry(url)
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return buildObjectUrl(url, cached.blob)
    }

    const response = await fetch(url)
    if (!response.ok) throw new Error(`获取图片失败: ${response.status}`)
    const blob = await response.blob()
    const entry: CacheEntry = {
      url,
      timestamp: now,
      blob,
      mime: blob.type,
      size: blob.size
    }
    await saveEntry(entry)
    await pruneCache()
    return buildObjectUrl(url, blob)
  } catch (error) {
    logger.error('获取图片失败:', error)
    return null
  }
}

// 清除过期缓存并控制容量
export const clearExpiredCache = async () => {
  await pruneCache()
}

// 清除所有缓存（含内存中的 object URL）
export const clearAllCache = async () => {
  objectUrlCache.forEach((value) => URL.revokeObjectURL(value))
  objectUrlCache.clear()
  if (!isBrowser) return
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).clear()
  await waitForTx(tx)
  db.close()
}