export const normalizeList = (arr: any): string[] => {
  const list = Array.isArray(arr) ? arr : []
  const trimmed = list.map((s) => String(s || '').trim()).filter(Boolean)
  const norm = (s: string) => s.replace(/[\s\u3000]+/g, ' ').replace(/[。.!；;、,]$/u, '').toLowerCase()
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of trimmed) {
    const key = norm(s)
    if (!seen.has(key)) { seen.add(key); out.push(s) }
  }
  return out.slice(0, 8)
}

export const mergeUnique = (a: string[] = [], b: string[] = []) => {
  return normalizeList([...(a || []), ...(b || [])])
}

// 将英文逗号等常见英文标点替换为中文等价形式，并规整空格
// 仅做最小必要替换：, -> ， ; -> ； ! -> ！ ? -> ？
// 同时合并连续空格，并去掉中文标点前后的不当空格
export const normalizeChinesePunctuation = (input: string): string => {
  if (!input) return ''
  let text = String(input)
  // 英文标点替换为中文
  text = text
    .replace(/,/g, '，')
    .replace(/;/g, '；')
    .replace(/!/g, '！')
    .replace(/\?/g, '？')
  // 中文标点前去除多余空格
  text = text.replace(/\s+(?=[，。；！？])/g, '')
  // 中文标点后保留一个空格（句末除外）
  text = text.replace(/([，；！？])\s*/g, '$1')
  // 末尾标点后不加空格
  text = text.replace(/([。！？])\s+$/g, '$1')
  return text.trim()
}


