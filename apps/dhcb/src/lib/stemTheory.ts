// stemTheory — tách phần LÝ THUYẾT của bài STEM (chuỗi thô trong `packages/subject-*/lessons`)
// thành khối có cấu trúc để trang bài dựng đúng thẻ HTML.
//
// VÌ SAO (audit UI/UX 2026-09-30 M15, đo lại 2026-10-01): lý thuyết in thẳng bằng
// `whitespace-pre-line`, nên 573 dòng "ĐỊNH NGHĨA SỰ RƠI TỰ DO:" (Lý 225 · Hoá 136 · Sinh 212) chỉ
// là chữ thường viết hoa giữa đoạn — không phải tiêu đề (WCAG 1.3.1), trình đọc màn hình không
// nhảy theo mục được, mắt không thấy chỗ một mục bắt đầu. Ký hiệu chỉ số dưới viết thô `v_tb`,
// `t_1` (~2.000 chỗ) đọc như lỗi gõ.
//
// CỐ Ý KHÔNG đổi chữ hoa → chữ thường. Đổi tự động sẽ sai tên riêng (Newton, Le Chatelier),
// viết tắt (ADN, CAM, MRI) và cả từ tiếng Việt một chữ cái ("Y học") — đó là việc sửa NỘI DUNG,
// phải làm ở dữ liệu nguồn có người duyệt, không để giao diện đoán. File này chỉ đổi CẤU TRÚC.
//
// Toàn HÀM THUẦN, không đụng React — test chạy được trên toàn bộ dữ liệu thật.

export type TheoryBlock = { kind: 'heading'; text: string } | { kind: 'para'; text: string }

export type InlinePart = { kind: 'text'; text: string } | { kind: 'sub'; base: string; sub: string }

/** Dòng mở đầu bằng dấu gạch/số thứ tự là MỤC trong danh sách, không phải tiêu đề. */
const MO_DAU_MUC = /^(?:[—–\-•]|\d+[.)])/u
/** Tiêu đề dài hơn mức này gần như chắc chắn là một câu viết hoa để nhấn mạnh. */
const TIEU_DE_DAI_TOI_DA = 160
const SO_CHU_CAI_TOI_THIEU = 3

/** Có phải chữ cái (có dạng hoa/thường) không — đúng cho cả chữ có dấu tiếng Việt. */
function laChuCai(c: string): boolean {
  return c.toLowerCase() !== c.toUpperCase()
}

/**
 * Một dòng là TIÊU ĐỀ MỤC khi: kết thúc bằng dấu hai chấm, không phải mục danh sách, và phần chữ
 * NGOÀI ngoặc đơn toàn chữ hoa. Phần trong ngoặc được phép viết thường — đó là chú thích
 * ("GIA TỐC RƠI TỰ DO (g):", "QUÁ TRÌNH HÌNH THÀNH LOÀI (Speciation):").
 */
export function laTieuDeLyThuyet(line: string): boolean {
  const s = line.trim()
  if (!s.endsWith(':') || s.length > TIEU_DE_DAI_TOI_DA || MO_DAU_MUC.test(s)) return false
  const ngoaiNgoac = s.slice(0, -1).replace(/\([^()]*\)/gu, '')
  const chuCai = [...ngoaiNgoac].filter(laChuCai)
  return chuCai.length >= SO_CHU_CAI_TOI_THIEU && chuCai.every((c) => c === c.toUpperCase())
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
      khoi.push({ kind: 'heading', text: line.trim().slice(0, -1).trimEnd() })
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
