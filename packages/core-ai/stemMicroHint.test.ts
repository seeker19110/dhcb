// packages/core-ai/stemMicroHint.test.ts — gợi ý Socratic của bảng nháp STEM (changelog 0551).
//
// BẤT BIẾN CHÍNH: mọi gợi ý cho bộ đề mẫu KHÔNG chứa nghiệm/đáp số/hệ số đã giải. Nghiệm KHÔNG
// viết tay trong test mà lấy bằng CHÍNH bộ kiểm (`checkMathStep`, `checkChemStep`) — nên nếu ai
// đổi đề mẫu, test tự tính lại nghiệm mới để canh.
import { describe, expect, it } from 'vitest'
import { checkMathStep } from '@dhcb/core-grading/stepCheckMath'
import { checkChemStep } from '@dhcb/core-grading/stepCheckChem'
import type { StemProblemState, StemSubjectType } from '@dhcb/core-contracts/stemScratchpad'
import { MATH_LESSONS } from '@dhcb/subject-math/lessons'
import { PHYSICS_LESSONS } from '@dhcb/subject-physics/lessons'
import { CHEM_LESSONS } from '@dhcb/subject-chemistry/lessons'
import { generateSocraticHint } from './stemMicroHint.js'
import { buildStemQuestionBank } from './stemQuestionBank.js'

const NGAY = '2026-10-09T00:00:00.000Z'

function deBai(
  subject: StemSubjectType,
  problemLatex: string | undefined,
  steps: readonly string[],
): StemProblemState {
  return {
    id: 'prob-test',
    personId: '11111111-1111-4111-8111-111111111111',
    subject,
    title: 'Đề mẫu',
    problemStatement: 'Đề mẫu',
    ...(problemLatex === undefined ? {} : { problemLatex }),
    steps: steps.map((latexInput, i) => ({ stepNumber: i + 1, latexInput, createdAt: NGAY })),
    isSolved: false,
    hintsUsed: 0,
    wrongSubmits: 0,
    createdAt: NGAY,
    updatedAt: NGAY,
  }
}

// ── Lấy nghiệm bằng chính bộ kiểm ──────────────────────────────────────────

/** Ứng viên hữu tỉ p/q, |p| ≤ 40, q ≤ 4 — đủ phủ nghiệm của bộ đề mẫu. */
function ungVien(): Array<{ text: string; value: number; forms: string[] }> {
  const out: Array<{ text: string; value: number; forms: string[] }> = []
  const seen = new Set<number>()
  for (let q = 1; q <= 4; q++)
    for (let p = -40; p <= 40; p++) {
      const value = p / q
      if (seen.has(value)) continue
      seen.add(value)
      const text = q === 1 ? `${p}` : `\\frac{${p}}{${q}}`
      const forms =
        q === 1 ? [`${p}`] : [`${p}/${q}`, text, `${value}`, `${value}`.replace('.', ',')]
      out.push({ text, value, forms })
    }
  return out
}

/** Nghiệm thực của đề: r là nghiệm ⇔ bước `x = r` KHÔNG thêm nghiệm lạ so với đề. */
function nghiemCuaDe(de: string): Array<{ value: number; forms: string[] }> {
  return ungVien().filter((c) => {
    const kq = checkMathStep(`x = ${c.text}`, de)
    return kq.verdict === 'equivalent' || (kq.verdict === 'changed' && !kq.extra)
  })
}

/** Bộ hệ số tối giản cân bằng phương trình đề — tìm bằng `checkChemStep` (vét hệ số 1..6). */
function heSoCanBang(de: string): string[] {
  const [trai = '', phai = ''] = de.split('->').map((v) => v.trim())
  const chat = [...trai.split('+'), ...phai.split('+')].map((c) => c.trim())
  const soTrai = trai.split('+').length
  const heSo = chat.map(() => 1)
  const dung = (): string => {
    const viet = chat.map((c, i) => `${heSo[i] === 1 ? '' : heSo[i]}${c}`)
    return `${viet.slice(0, soTrai).join(' + ')} -> ${viet.slice(soTrai).join(' + ')}`
  }
  const vet = (i: number): string | null => {
    if (i === chat.length) {
      const pt = dung()
      const kq = checkChemStep(pt, de)
      return kq.verdict === 'balanced' && kq.simplified ? pt : null
    }
    for (let k = 1; k <= 6; k++) {
      heSo[i] = k
      const r = vet(i + 1)
      if (r !== null) return r
    }
    return null
  }
  const pt = vet(0)
  if (pt === null) throw new Error(`không cân bằng được ${de}`)
  // Các mảnh "hệ số + chất" có hệ số > 1, vd "2H_2O", "4Al".
  return [pt, ...chat.map((c, i) => `${heSo[i]}${c}`).filter((_, i) => (heSo[i] ?? 1) > 1)]
}

/** Gợi ý có chứa con số `n` như một số đứng riêng (không phải một phần của số khác) không. */
function chuaSo(text: string, form: string): boolean {
  const thoat = form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?<![\\d.,/])${thoat}(?![\\d.,/])`).test(text)
}

// ── Bộ đề mẫu: phương trình + chuỗi bước (đúng, sai, lẫn lộn) ──────────────

const DE_TOAN: ReadonlyArray<{ de: string; chuoi: readonly string[][] }> = [
  {
    de: '2x + 5 = 15',
    chuoi: [
      [],
      ['2x = 15 + 5'],
      ['2x = 10'],
      ['2x = 10', 'x = 10 - 2'],
      ['2x + 5 - 5 = 15 - 5'],
      ['x = 5'],
      ['x = 10/0'],
      ['\\sqrt{x} = 5'],
    ],
  },
  {
    de: '3(x - 2) = 2x + 1',
    chuoi: [[], ['3x - 6 = 2x + 1'], ['3x - 2x = 1 + 6'], ['x = 1 + 6'], ['3x - 6 = 2x - 1']],
  },
  {
    de: '4x - 7 = 2x + 9',
    chuoi: [[], ['4x - 2x = 9 + 7'], ['2x = 16'], ['2x = 2']],
  },
  {
    de: 'x^2 - 5x + 6 = 0',
    chuoi: [[], ['x^2 - 5x = -6'], ['(x - 2)(x - 3) = 0'], ['x = 2'], ['x - 2 = 0']],
  },
  {
    de: '\\frac{x + 1}{x - 1} = 2',
    chuoi: [
      [],
      ['x + 1 = 2(x - 1)'],
      ['x + 1 = 2x - 2'],
      ['x = 1'],
      ['\\frac{x + 1}{x - 1} - 2 = 0'],
    ],
  },
  {
    de: '\\frac{x}{3} + 2 = 4',
    chuoi: [[], ['\\frac{x}{3} = 2'], ['\\frac{x}{3} = 6']],
  },
]

const DE_HOA: ReadonlyArray<{ de: string; chuoi: readonly string[][] }> = [
  {
    de: 'H_2 + O_2 -> H_2O',
    chuoi: [
      [],
      ['H_2 + O_2 -> H_2O'],
      ['H_2 + O_2 -> H_2O_2'],
      ['4H_2 + 2O_2 -> 4H_2O'],
      ['2H_2 + O_2 -> 2H_2O'],
    ],
  },
  {
    de: 'Al + O_2 -> Al_2O_3',
    chuoi: [[], ['2Al + O_2 -> Al_2O_3'], ['4Al + 3O_2 -> 2Al_2O_3'], ['8Al + 6O_2 -> 4Al_2O_3']],
  },
  {
    de: 'Fe + Cl_2 -> FeCl_3',
    chuoi: [[], ['Fe + Cl_2 -> FeCl_2'], ['2Fe + 3Cl_2 -> 2FeCl_3']],
  },
]

describe('generateSocraticHint — bất biến: KHÔNG lộ nghiệm/đáp số', () => {
  for (const { de, chuoi } of DE_TOAN) {
    it(`Toán ${de}: mọi gợi ý không chứa nghiệm (nghiệm lấy bằng bộ kiểm)`, () => {
      const nghiem = nghiemCuaDe(de)
      expect(nghiem.length, 'bộ kiểm phải tìm được nghiệm của đề mẫu').toBeGreaterThan(0)
      for (const buoc of chuoi) {
        for (const coDe of [true, false]) {
          // coDe = false: đề lời văn — người học tự viết phương trình làm bước 1.
          const steps = coDe ? buoc : [de, ...buoc]
          const { hintText, level } = generateSocraticHint(
            deBai('math', coDe ? de : undefined, steps),
          )
          expect(hintText, `gợi ý phải là câu hỏi: ${hintText}`).toContain('?')
          expect([1, 2, 3]).toContain(level)
          for (const n of nghiem) {
            for (const form of n.forms) {
              expect(chuaSo(hintText, form), `"${hintText}" lộ nghiệm ${form}`).toBe(false)
            }
            expect(hintText).not.toMatch(new RegExp(`x\\s*=\\s*${n.forms[0]}`))
          }
          // Không đưa phép tính thay người học ("chia cho 2", "= 5"…).
          expect(hintText).not.toMatch(/\\frac|chia cho \d|=\s*-?\d/)
        }
      }
    })
  }

  for (const { de, chuoi } of DE_HOA) {
    it(`Hoá ${de}: mọi gợi ý không chứa bộ hệ số cân bằng (tìm bằng bộ kiểm)`, () => {
      const loiGiai = heSoCanBang(de)
      for (const buoc of chuoi) {
        const { hintText } = generateSocraticHint(deBai('chemistry', de, buoc))
        expect(hintText).toContain('?')
        for (const manh of loiGiai) expect(hintText, `lộ "${manh}"`).not.toContain(manh)
        // Không có chữ số nào: gợi ý hoá chỉ nói nguyên tố và khái niệm.
        expect(hintText).not.toMatch(/\d/)
      }
    })
  }

  it('đề THẬT của ngân hàng: gợi ý mở đầu không chứa đáp số của câu đó', () => {
    const bank = buildStemQuestionBank([
      { subject: 'math', lessons: MATH_LESSONS },
      { subject: 'physics', lessons: PHYSICS_LESSONS },
      { subject: 'chemistry', lessons: CHEM_LESSONS },
    ])
    for (const q of bank) {
      const { hintText } = generateSocraticHint(deBai(q.subject, undefined, []))
      const dapSo =
        q.answer.kind === 'numeric'
          ? [`${q.answer.value}`]
          : q.answer.kind === 'fraction'
            ? [`${q.answer.num}/${q.answer.den}`]
            : q.answer.kind === 'chemFormula'
              ? [q.answer.formula]
              : []
      for (const d of dapSo) expect(chuaSo(hintText, d), `${q.id} lộ ${d}`).toBe(false)
    }
  })
})

describe('generateSocraticHint — đúng loại bước/lỗi', () => {
  const goiY = (de: string | undefined, steps: string[], subject: StemSubjectType = 'math') =>
    generateSocraticHint(deBai(subject, de, steps))

  it('chưa có bước → bậc 1 (khái niệm); đề có phương trình → hỏi về ẩn', () => {
    expect(goiY('2x + 5 = 15', [])).toMatchObject({ level: 1 })
    expect(goiY('2x + 5 = 15', []).hintText).toContain('Ẩn cần tìm')
    expect(goiY(undefined, []).hintText).toContain('gọi đại lượng đó là một ẩn')
    expect(goiY('H_2 + O_2 -> H_2O', [], 'chemistry').hintText).toContain('nguyên tố')
    expect(goiY(undefined, [], 'physics').hintText).toContain('đơn vị')
    expect(goiY(undefined, [], 'biology').level).toBe(1)
  })

  it('bước SAI → bậc 3, câu hỏi theo đúng loại lỗi của bộ kiểm', () => {
    // Chuyển vế sai dấu: vừa mất vừa thêm nghiệm.
    expect(goiY('2x + 5 = 15', ['2x = 15 + 5'])).toMatchObject({ level: 3 })
    expect(goiY('2x + 5 = 15', ['2x = 15 + 5']).hintText).toContain('dấu')
    // Mất nghiệm: chia cho biểu thức chứa ẩn.
    expect(goiY('x^2 = x', ['x = 1']).hintText).toContain('chia hai vế cho một biểu thức chứa ẩn')
    // Mất ĐKXĐ → hỏi về điều kiện xác định.
    const dkxd = goiY('\\frac{x^2 - 1}{x - 1} = 0', ['x^2 - 1 = 0'])
    expect(dkxd.level).toBe(3)
    expect(dkxd.hintText).toContain('Điều kiện xác định')
    // Nghiệm lạ không do mẫu → hỏi nhân/bình phương.
    expect(goiY('x = 3', ['x^2 = 9']).hintText).toContain('bình phương')
    // Chia cho 0.
    expect(goiY('2x + 5 = 15', ['x = 10/0']).hintText).toContain('mẫu số nào đang bằng 0')
    // Lỗi mang từ bước trước.
    expect(goiY('2x + 5 = 15', ['2x = 20', 'x = 10']).hintText).toContain('ĐẦU TIÊN')
  })

  it('bước HỢP LỆ → bậc 2, hỏi về cấu trúc của chính bước đó', () => {
    const h = (steps: string[], de = '2x + 5 = 15') => goiY(de, steps)
    expect(h(['2x + 5 - 5 = 15 - 5'])).toMatchObject({ level: 2 })
    expect(h(['2x + 5 - 5 = 15 - 5']).hintText).toContain('gộp được')
    expect(h(['2x = 10']).hintText).toContain('hệ số khác 1')
    expect(h(['x = 5']).hintText).toContain('dạng đáp số')
    expect(h(['3x - 6 = 2x + 1'], '3(x - 2) = 2x + 1').hintText).toContain('cả hai vế')
    expect(h(['3(x - 2) = 2x + 1'], '3(x - 2) = 2x + 1').hintText).toContain('Phá ngoặc')
    expect(h(['x^2 - 5x + 6 = 0'], 'x^2 - 5x + 6 = 0').hintText).toContain('nhân tử')
    expect(h(['2x + 5 = 15']).hintText).toContain('số hạng tự do')
    expect(h(['\\frac{x + 1}{x - 1} = 2'], '\\frac{x + 1}{x - 1} = 2').hintText).toContain(
      'điều kiện xác định',
    )
  })

  it('đề lời văn: bước 1 là mốc — gợi ý chỉ xét hình dạng, bước sau so với bước 1', () => {
    expect(goiY(undefined, ['2x = 10']).hintText).toContain('hệ số khác 1')
    expect(goiY(undefined, ['2x = 10', 'x = 50']).level).toBe(3)
  })

  it('bước ngoài phạm vi → nói thật là chưa đọc được, hỏi cách viết lại', () => {
    const r = goiY('2x + 5 = 15', ['\\sqrt{x} = 5'])
    expect(r.level).toBe(1)
    expect(r.hintText).toContain('MỘT ẩn')
    expect(goiY(undefined, ['x + y = 5']).hintText).toContain('MỘT ẩn')
    expect(goiY(undefined, ['abc'], 'chemistry').hintText).toContain('định luật')
    expect(goiY(undefined, ['v = 10'], 'physics').hintText).toContain('đơn vị')
  })

  it('Hoá: theo kết luận của checkChemStep', () => {
    const lech = goiY('H_2 + O_2 -> H_2O', ['H_2 + O_2 -> H_2O'], 'chemistry')
    expect(lech.level).toBe(3)
    expect(lech.hintText).toContain('Nguyên tố O')
    expect(goiY('H_2 + O_2 -> H_2O', ['H_2 + O_2 -> H_2O_2'], 'chemistry').hintText).toContain(
      'chỉ số',
    )
    expect(goiY(undefined, ['Fe^{3+} + 2e^- -> Fe^{2+}'], 'chemistry').hintText).toContain(
      'điện tích',
    )
    expect(goiY('H_2 + O_2 -> H_2O', ['4H_2 + 2O_2 -> 4H_2O'], 'chemistry').hintText).toContain(
      'ước',
    )
    expect(goiY('H_2 + O_2 -> H_2O', ['2H_2 + O_2 -> 2H_2O'], 'chemistry').hintText).toContain(
      'nộp lời giải',
    )
  })
})

describe('generateSocraticHint — Vật lí theo checkPhysicsStep (gộp 0551 + 0552)', () => {
  /** Đề mẫu có bảng biến (`v = a·t`) — cùng bảng mà validateStep dùng. */
  const DE_LI = 'v = a \\cdot t'
  const goiYLi = (steps: string[], variables?: Record<string, string>) =>
    generateSocraticHint({
      ...deBai('physics', DE_LI, steps),
      ...(variables === undefined ? {} : { variables }),
    })

  it('lệch thứ nguyên (vế) → bậc 3, nêu thứ nguyên hai phần, hỏi thừa số thiếu/thừa', () => {
    const h = goiYLi(['v = a t^2'])
    expect(h.level).toBe(3)
    expect(h.hintText).toContain('đang được đặt bằng nhau')
    expect(h.hintText).toContain('m·s⁻¹')
    expect(h.hintText).toMatch(/\?$/)
    // Không đưa công thức: không có dấu "=", không có tích ký hiệu của đề (`a t`, `a·t`, `\cdot`).
    // (`(?<![\p{L}])` để "của từng" không bị nhầm thành `a t`.)
    expect(h.hintText).not.toMatch(/=|\\cdot|(?<!\p{L})a\s*[·*]?\s*t(?!\p{L})/u)
  })

  it('lệch thứ nguyên ở đối số hàm → bậc 3, hỏi về đối số không đơn vị', () => {
    const h = goiYLi(['x = A \\cos(t)'], { x: 'm', A: 'm', t: 's' })
    expect(h.level).toBe(3)
    expect(h.hintText).toContain('không đơn vị')
  })

  it('khớp thứ nguyên → bậc 2, KHÔNG khen đúng (điều kiện cần, không đủ)', () => {
    const h = goiYLi(['v = a t'])
    expect(h.level).toBe(2)
    expect(h.hintText).toContain('chưa chắc là đúng')
  })

  it('lệch có điều kiện (số trần) → bậc 2, hỏi ghi đơn vị cho số', () => {
    const h = goiYLi(['v = 2t'])
    expect(h.level).toBe(2)
    expect(h.hintText).toContain('chưa kèm đơn vị')
  })

  it('chia cho 0 → bậc 3', () => {
    expect(goiYLi(['v = \\frac{a}{0}']).level).toBe(3)
  })

  it('đề không có bảng biến (đề ngân hàng) → bậc 1, câu hỏi chung về đơn vị, không đoán', () => {
    const h = generateSocraticHint(deBai('physics', undefined, ['v = a t^2']))
    expect(h.level).toBe(1)
    expect(h.hintText).toContain('Đơn vị ở hai vế')
  })
})
