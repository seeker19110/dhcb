// Loader cho dữ liệu từ vựng nền tảng — tải từ /public/data/*.json bằng fetch().
//
// HAI bản (changelog 0601):
//  - `loadFoundation()` — vòng ĐẦY ĐỦ (nghĩa, câu ví dụ, phiên âm; ~1 MB nén). Chỉ dùng khi thật
//    sự học từ: thẻ từ vựng, lộ trình học, từ điển.
//  - `loadFoundationIndex()` — bản TÓM TẮT (tên vòng + danh sách từ; ~50 KB nén). Đủ để vẽ tên
//    vòng và đếm tiến độ — dùng ở mọi trang chỉ hiển thị tiến độ.

export type { Circle, CircleSummary } from './curriculum'
import type { Circle, CircleSummary } from './curriculum'

/**
 * Tải JSON một lần, nhớ promise; lỗi thì quên promise để lần gọi sau thử lại.
 * Lỗi HTTP ném `<nhãn> HTTP <mã>` (cùng khuôn `dialoguesLoader`) để `friendlyError` dịch sang câu
 * đúng ngôn ngữ giao diện — câu tiếng Việt cố định sẽ hiện nguyên văn cả ở chiều B (changelog 0602).
 */
function memoFetchJson<T>(url: string, label: string): () => Promise<T> {
  let cached: Promise<T> | null = null
  return () => {
    if (!cached) {
      const promise = fetch(url).then((response) => {
        if (!response.ok) throw new Error(`${label} HTTP ${response.status}`)
        return response.json() as Promise<T>
      })
      cached = promise
      void promise.catch(() => {
        if (cached === promise) cached = null
      })
    }
    return cached
  }
}

export const loadFoundation: () => Promise<Circle[]> = memoFetchJson(
  '/data/curriculum.json',
  'Curriculum',
)

export const loadFoundationIndex: () => Promise<CircleSummary[]> = memoFetchJson(
  '/data/curriculum-index.json',
  'Curriculum index',
)
