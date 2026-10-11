// Loader "tổng quan CEFR" — `cefr.json` + bản TÓM TẮT các vòng từ vựng, gom lại thành dạng mà các
// trang tổng quan cần (danh sách cấp + tra vòng theo id).
//
// Vì sao có file này (changelog 0602): trang cấp CEFR, EnglishHome và RoadmapTab từng tự viết
// `Promise.all([loadCefr(), loadFoundationIndex()]).then(...)` KHÔNG có nhánh lỗi — mạng chập một
// nhịp là trang kẹt khung xương mãi (hoặc thẻ "Học tiếp" biến mất im lặng) kèm unhandled
// rejection. Một hàm cấp module dùng chung để cả ba đưa thẳng vào `useAsyncLoad` (cần tham chiếu
// ổn định) và có trạng thái lỗi + Thử lại.
import type { CefrLevel } from './cefr'
import type { CircleSummary } from './curriculum'
import { loadCefr } from './cefrLoader'
import { loadFoundationIndex } from './curriculumLoader'

export type CefrOverview = {
  levels: CefrLevel[]
  circleById: Record<string, CircleSummary>
}

/** Hai loader con tự nhớ promise và tự quên khi lỗi → gọi lại (Thử lại) là tải lại thật. */
export async function loadCefrOverview(): Promise<CefrOverview> {
  const [levels, circles] = await Promise.all([loadCefr(), loadFoundationIndex()])
  return { levels, circleById: Object.fromEntries(circles.map((c) => [c.id, c])) }
}
