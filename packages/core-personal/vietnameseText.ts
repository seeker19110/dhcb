// packages/core-personal/vietnameseText.ts — tiện ích chữ tiếng Việt dùng chung (bỏ dấu).
//
// Trước đây `stripVietnameseDiacritics` nằm trong safetyGuard.ts; tách ra vì truy xuất ký ức
// (memoryRetrieval.ts) cũng cần bỏ dấu câu hỏi cho khớp cột `search_tsv` (Postgres `unaccent`).
// Hai bên PHẢI bỏ dấu giống nhau: NFD + xoá dấu kết hợp + đ→d — khớp từ điển unaccent mặc định.

/** Bỏ dấu tiếng Việt: "học tiếng Anh" → "hoc tieng Anh"; "đ"/"Đ" → "d"/"D". */
export function stripVietnameseDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
}
