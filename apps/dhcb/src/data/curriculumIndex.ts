// Khuôn của `public/data/curriculum-index.json` — bản TÓM TẮT các vòng từ vựng (changelog 0601).
//
// Vì sao có: `curriculum.json` nặng ~3,6 MB thô (~1 MB nén), phần lớn là nghĩa + câu ví dụ +
// phiên âm. Trang chủ, trang môn Anh, trang cấp CEFR… chỉ cần tên vòng và danh sách TỪ để đếm
// "đã thuộc x/N", nên tải bản tóm tắt (~50 KB nén). Đo Slow 4G trước khi tách: trang cấp B1 chờ
// file đầy đủ 6,3–7,3 s mới hiện nội dung.
//
// Sinh lại: `npm run gen:curriculum-index` (đọc `curriculum.json` đã có). Test
// `curriculumIndex.test.ts` đỏ khi hai file lệch nhau.
import type { Circle, CircleSummary } from './curriculumTypes'

/** Rút một vòng đầy đủ về bản tóm tắt — nguồn DUY NHẤT của khuôn chỉ mục. */
export function toCircleSummary(circle: Circle): CircleSummary {
  return {
    id: circle.id,
    titleVi: circle.titleVi,
    titleEn: circle.titleEn,
    emoji: circle.emoji,
    words: circle.words.map((w) => ({ word: w.word })),
    ...(circle.notForKids ? { notForKids: true } : {}),
  }
}

/** Nội dung file chỉ mục, sinh từ danh sách vòng đầy đủ (giữ nguyên thứ tự). */
export function buildCurriculumIndex(circles: readonly Circle[]): CircleSummary[] {
  return circles.map(toCircleSummary)
}
