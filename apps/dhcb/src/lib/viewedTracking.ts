// Theo dõi "đã xem" cho các danh sách duyệt tuần tự (bài học, chủ đề câu) — dùng
// để gợi ý "Tiếp tục bài N" ở Lessons.tsx/CommonPhrases.tsx. CHỈ lưu localStorage
// (nhẹ, chỉ ảnh hưởng gợi ý UI, không phải tiến độ học thật nên không đồng bộ
// Supabase — mẫu readSet/writeSet giống lib/cefrProgress.ts).
function readSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return new Set(Array.isArray(arr) ? (arr as string[]) : [])
  } catch {
    return new Set()
  }
}

function writeSet(key: string, set: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]))
  } catch {
    /* localStorage đầy/bị chặn — bỏ qua, chỉ ảnh hưởng gợi ý "đã xem" */
  }
}

const KEY = (namespace: string, uid: string) => `et_viewed_${namespace}_${uid}`

export function getViewedIds(namespace: string, uid: string): Set<string> {
  return readSet(KEY(namespace, uid))
}

export function markViewed(namespace: string, uid: string, id: string): void {
  const set = getViewedIds(namespace, uid)
  if (set.has(id)) return
  set.add(id)
  writeSet(KEY(namespace, uid), set)
}

// [U9b, 2026-10-05] Mục MỞ GẦN NHẤT của một danh sách — "bài đang học". Trước đây gợi ý "Tiếp tục"
// ở Lessons.tsx trỏ "mục đầu tiên CHƯA XEM", nên vừa mở Bài 1 (chưa học xong) là "Tiếp tục" nhảy
// sang Bài 2 (audit 2026-09-30 M19). App không có tín hiệu "đã học xong" cho bài hội thoại (nợ
// S11-1), nên "đang học" trung thực nhất là bài mở gần nhất.
const LAST_KEY = (namespace: string, uid: string) => `et_last_opened_${namespace}_${uid}`

export function markLastOpened(namespace: string, uid: string, id: string): void {
  try {
    localStorage.setItem(LAST_KEY(namespace, uid), id)
  } catch {
    /* localStorage đầy/bị chặn — chỉ mất gợi ý "Tiếp tục" */
  }
}

export function getLastOpened(namespace: string, uid: string): string | null {
  try {
    return localStorage.getItem(LAST_KEY(namespace, uid))
  } catch {
    return null
  }
}
