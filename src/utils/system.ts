import type { SystemType } from '@/types'

export const normalizeSystem = (s: string): SystemType | null => {
  const v = (s || '').trim().toLowerCase()
  if (!v) return null
  if (/(^|\b)win(dows)?(\b|\d)/.test(v)) return 'Windows'
  if (/linux|ubuntu|debian|fedora|arch|manjaro/.test(v)) return 'Linux'
  if (/android|安卓/.test(v)) return 'Android'
  if (/ios|iphone|ipad|ipados/.test(v)) return 'iOS'
  if (/harmonyos|鸿蒙/.test(v)) return 'HarmonyOS'
  return null
}

export const inferSupportedSystemsFromText = (text: string): SystemType[] => {
  const candidates = new Set<SystemType>()
  const t = (text || '').toLowerCase()
  if (/\bwindows\b|\bwin10\b|\bwin11\b/.test(t)) candidates.add('Windows')
  if (/\blinux\b|ubuntu|debian|fedora|arch|manjaro/.test(t)) candidates.add('Linux')
  if (/android|安卓|apk|google\s?play|play\s?store/.test(t)) candidates.add('Android')
  if (/ios|iphone|ipad|app\s?store|testflight|ipados/.test(t)) candidates.add('iOS')
  if (/harmonyos|鸿蒙|appgallery|华为应用市场/.test(t)) candidates.add('HarmonyOS')
  return Array.from(candidates)
}

export const inferFromWebsite = (url?: string): SystemType[] => {
  if (!url) return []
  const u = url.toLowerCase()
  const found = new Set<SystemType>()
  if (u.includes('play.google.com')) found.add('Android')
  if (u.includes('apps.apple.com') || u.includes('itunes.apple.com')) found.add('iOS')
  if (u.includes('appgallery.huawei.com') || u.includes('appgallery')) found.add('HarmonyOS')
  if (u.includes('snapcraft.io') || u.includes('flathub.org') || u.includes('gnu.org')) found.add('Linux')
  if (u.includes('microsoft.com') && (u.includes('/store') || u.includes('apps'))) found.add('Windows')
  return Array.from(found)
}


