// selfGrade.ts — CỔNG TỰ CHẤM cho nội dung bài học: đáp án khai trong bài có ĐÚNG không.
//
// VÌ SAO CÓ FILE NÀY (audit 2026-09-14,
// `docs/audit/2026-09-14-tinh-chinh-xac-cong-thuc-va-ket-qua.md`):
//
// `types.ts` chốt: `NumericSpec.value` LUÔN ở đơn vị SI cơ sở, `unit` chỉ để biết thứ nguyên và
// để hiển thị. Chín câu môn Lí đã khai `value` ở ĐƠN VỊ HIỂN THỊ (`{ value: 8.66, unit: 'cm' }`
// cho đáp án "8,66 cm"), nên học sinh gõ đúng vẫn bị chấm `WRONG_VALUE`.
//
// Cổng cũ ở `lessons.test.ts` từng dựng bài làm bằng `(value - offset) / factor`. Cách đó ĐÚNG
// theo hợp đồng, nhưng **mù**: nó suy đầu vào ra TỪ CHÍNH `value`, nên `value` sai hệ quy chiếu
// thì đầu vào cũng sai y hệt và hai cái sai triệt tiêu nhau — cổng không bao giờ đỏ được.
// Nạp thẳng `${value} ${unit}` cũng KHÔNG dùng được: nó mù theo chiều ngược lại, báo đỏ oan
// đúng những bài khai chuẩn SI.
//
// Lối ra: phải có NGUỒN ĐỐI CHIẾU ĐỘC LẬP với `value`. Nguồn đó là lời giải (`explain`) — do
// tác giả viết bằng tay, bằng đơn vị hiển thị. Vậy cổng gồm hai lớp:
//   1. Tự chấm: đáp án suy từ `value` phải được engine chấm đúng (giữ nguyên hợp đồng).
//   2. Đối chiếu độc lập: với đơn vị có hệ số/độ lệch ≠ đơn vị SI, con số hiển thị suy từ
//      `value` phải THẬT SỰ xuất hiện trong lời giải. Bài khai nhầm hệ quy chiếu sẽ lệch đúng
//      bằng hệ số đổi đơn vị nên trượt lớp 2 này.
import { gradeAnswer } from './index.js'
import { UNITS } from './units.js'
import type { AnswerSpec } from './types.js'

export interface CauHoiTuCham {
  prompt: string
  answer: AnswerSpec
  /** Lời giải do tác giả viết — nguồn đối chiếu ĐỘC LẬP với `value`. */
  explain: string
}

export interface BaiCoCauHoi {
  id: string
  checkQuestions: readonly CauHoiTuCham[]
}

export interface LoiTuCham {
  lessonId: string
  prompt: string
  /** 'TU_CHAM' = engine chấm sai; 'LECH_LOI_GIAI' = số hiển thị không có trong lời giải. */
  loai: 'TU_CHAM' | 'LECH_LOI_GIAI'
  chiTiet: string
}

/** Con số hiển thị tương ứng với `value` (SI) — thứ tác giả viết trong lời giải. */
export function soHienThi(value: number, unit: string | undefined): number {
  const def = unit ? UNITS[unit] : undefined
  if (!def) return value
  return (value - (def.offset ?? 0)) / def.factor
}

/** Chuỗi mà học sinh làm đúng sẽ gõ, suy từ đáp án đã khai theo đúng hợp đồng SI. */
export function chuoiHocSinhGoDung(spec: AnswerSpec): string {
  switch (spec.kind) {
    case 'numeric':
      return spec.unit ? `${soHienThi(spec.value, spec.unit)} ${spec.unit}` : `${spec.value}`
    case 'fraction':
      return `${spec.num}/${spec.den}`
    case 'expression':
      return spec.expr
    case 'choice':
      return spec.correctIds.join(',')
    case 'chemFormula':
      return spec.formula
    case 'chemEquation':
      return `${spec.reactants.join(' + ')} -> ${spec.products.join(' + ')}`
  }
}

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'

/** Mọi con số đọc được trong một đoạn lời giải, đã chuẩn hoá cách viết của người Việt. */
export function cacSoTrongLoiGiai(text: string): number[] {
  const chuan = text
    .replace(/(\d)\s*,\s*(\d)/g, '$1.$2') // dấu phẩy thập phân
    .replace(/[−–]/g, '-') // dấu trừ Unicode
    // luỹ thừa mũ trên: 10⁻⁷ / 10⁸ / 10²³. KHÔNG viết dải `[⁰-⁹]`: ¹ ² ³ nằm ở khối Latin-1
    // (U+00B9/B2/B3), ngoài dải U+2070–2079, nên dải đó bỏ sót mọi số mũ chứa 1/2/3 (10⁻¹⁹,
    // 6,02·10²³ bị đọc thành [6.02, 10]) — bug tìm ra 2026-10-08, changelog 0522.
    .replace(/10\s*[⁻-]\s*([⁰¹²³⁴-⁹]+)/g, (_m, d: string) => '1e-' + soMuTren(d))
    .replace(/10\s*([⁰¹²³⁴-⁹]+)/g, (_m, d: string) => '1e' + soMuTren(d))
    // "a * 10^b" viết liền thành một số
    .replace(/([\d.]+)\s*[*×·]\s*1e(-?\d+)/g, (_m, a: string, b: string) =>
      String(Number(a) * Math.pow(10, Number(b))),
    )
  // `e[+-]?`: tích ở bước trên ≥ 1e21 được String() viết thành "6.02e+23" — thiếu `+` ở đây
  // thì con số bị cắt đôi thành [6.02, 23] (bug tìm ra cùng đợt, changelog 0522).
  return [...chuan.matchAll(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)]
    .map((m) => Number(m[0]))
    .filter((n) => Number.isFinite(n))
}

function soMuTren(d: string): string {
  return [...d].map((c) => (SUP.indexOf(c) >= 0 ? String(SUP.indexOf(c)) : c)).join('')
}

/** Đơn vị này có khác đơn vị SI cơ sở không (hệ số ≠ 1 hoặc có độ lệch). */
function lechSI(unit: string | undefined): boolean {
  const def = unit ? UNITS[unit] : undefined
  return def !== undefined && (def.factor !== 1 || (def.offset ?? 0) !== 0)
}

/** Mọi câu hỏi có đáp án khai sai. Rỗng = đạt. */
export function timLoiTuCham(lessons: readonly BaiCoCauHoi[]): LoiTuCham[] {
  const loi: LoiTuCham[] = []
  for (const lesson of lessons) {
    for (const q of lesson.checkQuestions) {
      // Lớp 1 — tự chấm.
      const input = chuoiHocSinhGoDung(q.answer)
      const kq = gradeAnswer(input, q.answer)
      if (!kq.correct) {
        loi.push({
          lessonId: lesson.id,
          prompt: q.prompt,
          loai: 'TU_CHAM',
          chiTiet: `gõ "${input}" → ${kq.reason}`,
        })
        continue
      }
      // Lớp 2 — đối chiếu độc lập với lời giải. Chỉ áp cho đơn vị lệch SI: đó là chỗ duy nhất
      // khai nhầm hệ quy chiếu tạo ra sai số, và cũng để tránh báo oan câu đúng/sai (0 / 1)
      // có lời giải thuần văn xuôi.
      if (q.answer.kind !== 'numeric' || !lechSI(q.answer.unit)) continue
      const hienThi = soHienThi(q.answer.value, q.answer.unit)
      const dungSai = Math.max(Math.abs(hienThi) * 1e-2, 1e-9)
      const co = cacSoTrongLoiGiai(q.explain).some((n) => Math.abs(n - hienThi) <= dungSai)
      if (!co) {
        loi.push({
          lessonId: lesson.id,
          prompt: q.prompt,
          loai: 'LECH_LOI_GIAI',
          chiTiet:
            `value=${q.answer.value} (SI) ⇒ hiển thị ${hienThi} ${q.answer.unit}, ` +
            `nhưng lời giải không có con số đó — nhiều khả năng value đang khai ở ĐƠN VỊ HIỂN ` +
            `THỊ thay vì SI. Lời giải: "${q.explain.slice(0, 100)}"`,
        })
      }
    }
  }
  return loi
}

/** Mô tả lỗi gọn cho thông báo test. */
export function moTaLoiTuCham(loi: readonly LoiTuCham[]): string {
  return loi.map((l) => `  [${l.loai}] ${l.lessonId}: ${l.chiTiet}`).join('\n')
}
