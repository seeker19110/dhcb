// packages/core-ai/stemQuestionBank.mathEquation.test.ts — Phương trình MỐC của câu Toán trong ngân
// hàng đề bảng nháp STEM (changelog 0612, docs/specs/2026-10-11-moc-de-ngan-hang-toan.md).
//
// Mốc khai SAI nguy hiểm: bước 1 đúng bị ✗ oan, hoặc mốc là phương trình TỰ LẬP thì lộ cách giải.
// Luật soạn ở `MathCheckQuestionSchema.equation`; file này canh cho MỌI câu có khai:
//   (1) bộ kiểm ĐỌC ĐƯỢC mốc (nếu không, khai cũng vô ích);
//   (2) mốc có mặt NGUYÊN VĂN trong đề sau khi chuẩn hoá cách viết (², −, khoảng trắng) — nên
//       không thể là phương trình tự lập.
import { describe, expect, it } from 'vitest'
import { readsAsMathStatement } from '@dhcb/core-grading/stepCheckMath'
import { MathCheckQuestionSchema } from '@dhcb/subject-math/lessonTypes'
import { MATH_LESSONS } from '@dhcb/subject-math/lessons'
import { buildStemQuestionBank, toPublicStemQuestion } from './stemQuestionBank.js'

const DE_TOAN = buildStemQuestionBank([{ subject: 'math', lessons: MATH_LESSONS }])
const CO_MOC = DE_TOAN.filter((q) => q.problemLatex !== undefined)

const MU: Readonly<Record<string, string>> = { '²': '^2', '³': '^3', '⁴': '^4' }

/** Đưa đề (chữ thường) và mốc (LaTeX phẳng) về cùng cách viết để so nguyên văn. */
function chuanHoa(s: string): string {
  return s
    .replace(/[²³⁴]/g, (c) => MU[c] ?? c)
    .replace(/[−–]/g, '-')
    .replace(/\\le(?![a-zA-Z])/g, '≤')
    .replace(/\\ge(?![a-zA-Z])/g, '≥')
    .replace(/\s+/g, '')
}

describe('Mốc phương trình của câu Toán ngân hàng (changelog 0612)', () => {
  it('có ít nhất một câu khai mốc (đường ống không rỗng)', () => {
    expect(CO_MOC.map((q) => q.id)).toContain('toan10-c6-b2-q3')
  })

  for (const q of CO_MOC) {
    it(`${q.id}: bộ kiểm đọc được và mốc nằm nguyên văn trong đề`, () => {
      const moc = q.problemLatex ?? ''
      expect(readsAsMathStatement(moc), `bộ kiểm không đọc được "${moc}"`).toBe(true)
      expect(chuanHoa(q.problemStatement), `"${moc}" không có nguyên văn trong đề`).toContain(
        chuanHoa(moc),
      )
    })
  }

  it('luật canh có tác dụng: phương trình tự lập không khớp nguyên văn đề', () => {
    const de = 'Tam thức f(x) = x² + 2x + m luôn dương với mọi x thực khi m > k.'
    expect(chuanHoa(de)).not.toContain(chuanHoa('4 - 4m < 0'))
    expect(chuanHoa('Bất phương trình x² + 1 < 0 có')).toContain(chuanHoa('x^2 + 1 < 0'))
  })

  it('mốc không ra bản công khai của danh sách đề', () => {
    for (const q of CO_MOC) expect(toPublicStemQuestion(q)).not.toHaveProperty('problemLatex')
  })

  it("schema bài học từ chối mốc trên câu 'choice'", () => {
    const r = MathCheckQuestionSchema.safeParse({
      prompt: 'Chọn đáp án đúng',
      choices: [{ id: 'a', label: 'A' }],
      answer: { kind: 'choice', correctIds: ['a'] },
      explain: 'Vì…',
      equation: 'x = 1',
    })
    expect(r.success).toBe(false)
  })
})
