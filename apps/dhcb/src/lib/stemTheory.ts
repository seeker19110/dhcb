// stemTheory — tách phần LÝ THUYẾT của bài STEM (chuỗi thô trong `packages/subject-*/lessons`)
// thành khối có cấu trúc để trang bài dựng đúng thẻ HTML.
//
// VÌ SAO (audit UI/UX 2026-09-30 M15, đo lại 2026-10-01): lý thuyết từng in thẳng bằng
// `whitespace-pre-line`, nên 575 dòng "ĐỊNH NGHĨA SỰ RƠI TỰ DO:" (Lý · Hoá · Sinh) chỉ là chữ viết
// hoa giữa đoạn — không phải tiêu đề (WCAG 1.3.1), trình đọc màn hình không nhảy theo mục được,
// mắt không thấy chỗ một mục bắt đầu. Ký hiệu chỉ số dưới viết thô `v_tb`, `t_1` (~2.000 chỗ) đọc
// như lỗi gõ.
//
// QUY ƯỚC TIÊU ĐỀ MỤC (2026-10-01, đợt 0470): dòng mở đầu bằng `## ` — dấu RÕ RÀNG do người soạn
// đặt, kiểu Markdown. Trước đó tiêu đề được ĐOÁN từ "dòng toàn chữ hoa kết thúc bằng hai chấm";
// cách đoán đó buộc dữ liệu phải viết HOA toàn bộ (khó đọc, mất phân biệt `t`/`T`, Newton/newton),
// nên dữ liệu đã được chuyển sang viết hoa đầu câu + `## ` (giữ nguyên tên riêng/viết tắt, có bảng
// đối chiếu ở changelog 0470). Cổng `stemTheory.test.ts` chặn tiêu đề kiểu cũ quay lại.
//
// Toàn HÀM THUẦN, không đụng React — test chạy được trên toàn bộ dữ liệu thật.

export type TheoryBlock = { kind: 'heading'; text: string } | { kind: 'para'; text: string }

export type InlinePart = { kind: 'text'; text: string } | { kind: 'sub'; base: string; sub: string }

/** Dấu mở đầu dòng tiêu đề mục. */
export const DAU_TIEU_DE = '## '

/** Một dòng là TIÊU ĐỀ MỤC khi mở đầu bằng `## ` và còn chữ phía sau. */
export function laTieuDeLyThuyet(line: string): boolean {
  return line.startsWith(DAU_TIEU_DE) && line.slice(DAU_TIEU_DE.length).trim() !== ''
}

/**
 * Tách lý thuyết thành khối: tiêu đề mục, và đoạn văn (cắt ở dòng trống). Dòng trong một đoạn
 * GIỮ NGUYÊN xuống dòng — các mục "— …" và "1. …" vẫn hiện từng dòng như người soạn viết.
 */
export function phanTichLyThuyet(theory: string): TheoryBlock[] {
  const khoi: TheoryBlock[] = []
  let doan: string[] = []
  const dongDoan = () => {
    if (doan.length) khoi.push({ kind: 'para', text: doan.join('\n') })
    doan = []
  }
  for (const line of theory.split('\n')) {
    if (line.trim() === '') {
      dongDoan()
    } else if (laTieuDeLyThuyet(line)) {
      dongDoan()
      khoi.push({ kind: 'heading', text: line.slice(DAU_TIEU_DE.length).trim() })
    } else {
      doan.push(line)
    }
  }
  dongDoan()
  return khoi
}

/**
 * Ký hiệu chỉ số dưới viết thô `v_tb`, `t_1`, `W_đ`, `E°_pin` → phần gốc + phần chỉ số dưới.
 * Gốc là MỘT chữ cái (hoặc `°`) đứng ngay trước `_`; dấu `_` đứng đầu từ (ký hiệu hạt nhân
 * `_Z^A`) không phải chỉ số dưới nên giữ nguyên.
 */
const CHI_SO_DUOI = /([\p{L}°])_([\p{L}\p{N}]+)/gu

export function tachChiSoDuoi(text: string): InlinePart[] {
  const phan: InlinePart[] = []
  let viTri = 0
  for (const m of text.matchAll(CHI_SO_DUOI)) {
    const batDau = m.index ?? 0
    if (batDau > viTri) phan.push({ kind: 'text', text: text.slice(viTri, batDau) })
    phan.push({ kind: 'sub', base: m[1]!, sub: m[2]! })
    viTri = batDau + m[0].length
  }
  if (viTri < text.length) phan.push({ kind: 'text', text: text.slice(viTri) })
  return phan
}
