// finalAnswer.ts — chấm ĐÁP SỐ CUỐI dạng chữ tự do (bảng nháp STEM) so với đáp án viết bằng LaTeX.
//
// VÌ SAO CÓ FILE NÀY (changelog 0539): hành động `submit_solution` của `/api/stem-scratchpad` từng
// so CHUỖI CON — `finalAnswer.includes(solutionLatex.slice(0, 10))` — nên "15" khớp đáp án "5",
// "S_{2} = 0 sai bét" cũng "giải xong", còn "2,5" lại trượt "2.5". File này KHÔNG viết bộ so thứ
// hai: nó chỉ (1) bóc vế phải của dòng "x = …" ở cả hai phía và gỡ vỏ LaTeX đơn giản, (2) dựng một
// `AnswerSpec` từ đáp án, rồi giao cho `gradeAnswer` — engine chấm dùng chung (chuẩn hoá dấu thập
// phân `,`/`.`, khoảng trắng, dung sai, đơn vị/thứ nguyên đã có sẵn và đã có test).
import { gradeAnswer } from './index.js'
import { evaluateNumeric } from './expression.js'
import { splitValueUnit, toSI } from './units.js'
import type { GradeResult, Tolerance } from './types.js'

/**
 * Dung sai cho đáp số số học: lệch tương đối 0,1% — đủ hấp thụ làm tròn trung gian (4,9999 cho đáp
 * án 5) mà không cho qua đáp số sai thật. Đáp án bằng 0 thì engine tự lùi về so tuyệt đối.
 */
const FINAL_ANSWER_TOLERANCE: Tolerance = { mode: 'relative', pct: 0.1 }

/** Gỡ vỏ LaTeX hay gặp trong đáp án/bài làm: `\text{m/s}` → `m/s`, `\,` → khoảng trắng, `$…$`. */
function stripLatex(text: string): string {
  return text
    .replace(/\$/g, '')
    .replace(/\\(?:text|mathrm|operatorname)\s*\{([^{}]*)\}/g, '$1')
    .replace(/\\[,;:!]|~/g, ' ')
    .replace(/\\cdot|\\times/g, '*')
    .replace(/\\left|\\right/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Vế phải của MỆNH ĐỀ CUỐI: "2x = 10 \implies x = 5" → "5"; "x = 5" → "5"; "5" → "5".
 * Học sinh hay viết lại tên ẩn trước đáp số ("x = 5"), đáp án ngân hàng đề cũng vậy ("S_{2} = 0")
 * — so phải bỏ phần đó ở CẢ hai phía, nếu không "x = 5" và "5" thành hai chuỗi khác nhau.
 */
export function finalValueText(raw: string): string {
  const lastClause =
    stripLatex(raw)
      .split(/\\implies|\\Rightarrow|=>|⟹|⇒/)
      .pop() ?? ''
  return (lastClause.split('=').pop() ?? '').trim()
}

/**
 * Chấm đáp số cuối của học sinh so với đáp án (chuỗi LaTeX của ngân hàng đề).
 *
 * - Đáp án là SỐ (có/không đơn vị): so theo giá trị với dung sai nhỏ; đáp án có đơn vị thì học
 *   sinh PHẢI ghi đơn vị cùng thứ nguyên (thiếu → `MISSING_UNIT`, sai → `WRONG_UNIT`/
 *   `WRONG_DIMENSION`); khác đơn vị cùng thứ nguyên (km/h ↔ m/s) được quy đổi trước khi so.
 * - Đáp án KHÔNG phải số (biểu thức): so tương đương biểu thức (`expressionsEqual`).
 * - Đáp án rỗng/hỏng: luôn sai — không bao giờ "giải xong" nhờ một đáp án không đọc được.
 */
export function gradeFinalAnswer(studentRaw: string, expectedLatex: string): GradeResult {
  const student = finalValueText(studentRaw)
  const expected = finalValueText(expectedLatex)
  if (expected === '') return { correct: false, reason: 'PARSE_ERROR' }

  const { value: expectedValueText, unit } = splitValueUnit(expected)
  const expectedNumber = evaluateNumeric(expectedValueText)

  if (expectedNumber !== null) {
    const valueSI = unit === null ? expectedNumber : toSI(expectedNumber, unit)
    if (valueSI === null) return { correct: false, reason: 'PARSE_ERROR' }
    return gradeAnswer(student, {
      kind: 'numeric',
      value: valueSI,
      ...(unit === null ? {} : { unit }),
      tolerance: FINAL_ANSWER_TOLERANCE,
    })
  }

  return gradeAnswer(student, { kind: 'expression', expr: expected })
}
