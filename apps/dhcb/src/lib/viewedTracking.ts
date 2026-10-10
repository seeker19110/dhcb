// Theo dõi "đã xem" cho các danh sách duyệt tuần tự (bài học, chủ đề câu) — dùng
// để gợi ý "Tiếp tục bài N" ở Lessons.tsx/CommonPhrases.tsx. CHỈ lưu localStorage
// (nhẹ, chỉ ảnh hưởng gợi ý UI, không phải tiến độ học thật nên không đồng bộ
// Supabase — mẫu readSet/writeSet giống lib/cefrProgress.ts).
import { readLocalArray } from './localJson'

function readSet(key: string): Set<string> {
  return new Set(readLocalArray<string>(key))
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

/** Gợi ý đầu danh sách: mục nào, và gọi là "Tiếp tục" hay "Bắt đầu". */
export interface ContinueSuggestion<T> {
  item: T
  /** `continue` khi đã từng mở/xem mục nào đó trong danh sách; `start` với người mới. */
  kind: 'continue' | 'start'
}

/**
 * MỘT luật gợi ý "Tiếp tục" cho mọi danh sách duyệt tuần tự (bài hội thoại, câu thông dụng, mẫu
 * câu luyện nghe) — trước đây mỗi trang tự chép "mục đầu tiên chưa xem", nên vừa mở mục 1 quay ra
 * đã thấy "Tiếp tục: mục 2" (audit 2026-09-30 M19). Thứ tự:
 *  1. mục MỞ GẦN NHẤT còn trong danh sách → "Tiếp tục" chính mục đó (mục đang học);
 *  2. không có → mục đầu tiên chưa xem; nhãn "Bắt đầu" nếu chưa xem mục nào, ngược lại "Tiếp tục"
 *     (người đã xem trước khi có khoá "mở gần nhất");
 *  3. đã xem hết, không có mục mở gần nhất → không gợi ý.
 */
export function suggestContinue<T>(
  namespace: string,
  uid: string,
  items: readonly T[],
  keyOf: (item: T) => string,
): ContinueSuggestion<T> | null {
  if (!uid || items.length === 0) return null
  const moGanNhat = getLastOpened(namespace, uid)
  if (moGanNhat !== null) {
    const dangHoc = items.find((it) => keyOf(it) === moGanNhat)
    if (dangHoc !== undefined) return { item: dangHoc, kind: 'continue' }
  }
  const viewed = getViewedIds(namespace, uid)
  const dauTien = items.find((it) => !viewed.has(keyOf(it)))
  if (dauTien === undefined) return null
  return { item: dauTien, kind: viewed.size === 0 ? 'start' : 'continue' }
}
