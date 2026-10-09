// packages/core-ai/stemQuestionBank.physicsVariables.test.ts — Bảng thứ nguyên biến của câu Vật lí
// trong ngân hàng đề bảng nháp STEM (changelog 0560,
// docs/specs/2026-10-09-bang-bien-vat-li-ngan-hang-de.md).
//
// Bảng khai SAI nguy hiểm hơn bảng thiếu: thiếu → "chưa tự kiểm được"; sai → báo ✗ oan người học
// làm đúng. Nên file này canh:
//   (1) PHỦ: mọi câu Vật lí của ngân hàng hoặc có bảng, hoặc nằm trong danh sách bỏ qua có lý do;
//   (2) ĐỌC ĐƯỢC: mọi khoá của mọi bảng được bộ kiểm hiểu đúng là MỘT ký hiệu, đúng thứ nguyên
//       của đơn vị khai (không rơi vào "bảng hỏng" làm tắt kiểm cả câu);
//   (3) KHÔNG ✗ OAN: các bước ĐÚNG chép từ lời giải (`explain`) của chính câu đó không bao giờ bị
//       báo lệch thứ nguyên (kể cả "lệch có điều kiện"), và bước công thức đầu tiên phải KHỚP;
//   (4) CÓ TÁC DỤNG: bước sai thứ nguyên rõ ràng bị bắt (`mismatch`).
import { describe, expect, it } from 'vitest'
import { checkPhysicsStep } from '@dhcb/core-grading/stepCheckPhysics'
import { formatDimension, parseUnitExpression } from '@dhcb/core-grading/dimension'
import { StemVariableTableSchema } from '@dhcb/core-contracts/stemScratchpad'
import { PHYSICS_LESSONS } from '@dhcb/subject-physics/lessons'
import { buildStemQuestionBank } from './stemQuestionBank.js'

const DE_LI = buildStemQuestionBank([{ subject: 'physics', lessons: PHYSICS_LESSONS }])

/** Câu cố ý KHÔNG khai bảng — kèm lý do (ghi ở changelog 0560). */
const BO_QUA: Readonly<Record<string, string>> = {
  'ly12-c2-b11-q2': 'tra hằng số (22,4 lít/mol) — không có bước tính để kiểm',
  'ly12-c4-b20-q2': 'đọc số proton từ kí hiệu hạt nhân — số đếm, không có thứ nguyên',
  'ly12-c4-b22-q2': 'bảo toàn số khối — phép cộng số đếm, không có thứ nguyên',
}

/**
 * Bước ĐÚNG viết theo lời giải của chính câu (cách học sinh gõ: LaTeX hoặc gõ thường). Phần tử
 * ĐẦU là công thức thuần ký hiệu → phải `consistent`; các phần tử sau (có thay số, đơn vị gõ
 * thường, `V1` không gạch dưới…) chỉ cần KHÔNG bị báo lệch.
 */
const BUOC_DUNG: Readonly<Record<string, readonly string[]>> = {
  'ly10-c2-b5-q2': ['v_{13} = v_{12} + v_{23}', 'v = 2 + 0,5 = 2,5 m/s'],
  'ly10-c2-b6-q2': ['v = s / t', 'v = \\frac{s}{t} = \\frac{0,5}{0,2} = 2,5'],
  'ly10-c2-b8-q1': [
    'a = (v_t - v_o) / t',
    'a = \\frac{v_t - v_0}{t} = \\frac{5 - 20}{3} = -5 m/s^2',
  ],
  'ly10-c2-b9-q2': ['d = v_o t + 0,5 a t^2', 'd = v_0 t + \\frac{1}{2} a t^2 = 25 m'],
  'ly10-c2-b10-q2': ['v = g t', 'v = gt = 10 \\cdot 2 = 20 m/s'],
  'ly10-c2-b12-q2': ['t = \\sqrt{\\frac{2h}{g}}', 'L = v_o t = 50 \\cdot 4 = 200 m'],
  'ly10-c3-b13-q1': ['F = \\sqrt{F_1^2 + F_2^2}', 'F = \\sqrt{3^2 + 4^2} = 5 N'],
  'ly10-c3-b15-q2': ['F = m a', 'F = ma = 1000 \\cdot 2,5 = 2500 N'],
  'ly10-c3-b18-q2': ['F_{mst} = μ_t N', 'F_{ms} = \\mu_t N = 0,3 \\cdot 100 = 30'],
  'ly10-c3-b20-q1': ['m a = m g \\sin α', 'a = g \\sin 30^\\circ = 10 \\cdot 0,5 = 5'],
  'ly10-c3-b22-q2': ['F_{max} = F_1 + F_2', 'F_{max} = 3 + 4 = 7 N'],
  'ly10-c4-b23-q2': [
    'A = F_{ms} s \\cos α',
    'A = F s \\cos(180°) = 20 \\cdot 5 \\cdot (-1) = -100',
  ],
  'ly10-c4-b24-q2': ['A = P t', 'A = P \\cdot t = 3000 \\cdot 10 = 30000 J'],
  'ly10-c4-b25-q2': ['W_t = m g h', 'W_t = mgh = 2 \\cdot 10 \\cdot 5 = 100 J'],
  'ly10-c4-b26-q2': ['W_{đ} = W - W_t', 'W_d = W - W_t = 100 - 40 = 60 J'],
  'ly10-c4-b27-q2': ['H = \\frac{W_{ci}}{W_{tp}}', 'H = \\frac{400}{500} \\cdot 100\\% = 80\\%'],
  'ly10-c5-b28-q2': ['Δp = F Δt', '\\Delta p = F \\Delta t = 50 \\cdot 0,2 = 10 kg.m/s'],
  'ly10-c5-b29-q2': ["v' = \\frac{m_A v_A}{m_A + m_B}", "m_A v_A = (m_A + m_B) v'"],
  'ly10-c5-b29-q3': ['p = p_A + p_B', 'p_A = m_A v_A = 2 \\cdot 3 = 6', 'p = m_A v_A + m_B v_B'],
  'ly10-c5-b30-q2': ['p = m_1 v_1', 'p = m_1 v_1 = (m_1 + m_2) v'],
  'ly10-c6-b31-q2': ['v = \\omega r', 'v = ω r = 20 \\cdot 0,5 = 10 m/s'],
  'ly10-c6-b32-q2': ['F_{ht} = \\frac{m v^2}{r}', 'F_{ht} = \\frac{2 \\cdot 5^2}{0,5} = 100 N'],
  'ly10-c7-b33-q2': ['F_{đh} = k \\Delta l', 'F = k Δl = 200 \\cdot 0,02 = 4 N'],
  'ly10-c7-b34-q2': ['F_A = \\rho g V', 'F_A = ρ g V = 1000 \\cdot 10 \\cdot 0,002 = 20 N'],
  'ly11-c1-b1-q2': ['T = \\frac{2\\pi}{\\omega}', 'f = \\frac{1}{T}', 'ω = 2π f'],
  'ly11-c1-b1-q3': ['S = 4A', 'S = 4 A = 4 \\cdot 5 = 20 cm'],
  'ly11-c1-b2-q2': ['A = R', 'A = R = 0,1 m'],
  'ly11-c1-b3-q2': ['v_{max} = \\omega A', 'v_{max} = ω A = 10 \\cdot 0,1 = 1 m/s'],
  'ly11-c1-b4-q2': ['v = \\omega A', 'v = \\omega \\sqrt{A^2 - x^2}'],
  'ly11-c1-b5-q2': ['W_{đ} = W - W_t', 'W_d = W - 0,75 W = 0,25 W'],
  'ly11-c1-b7-q2': ['x = A \\frac{\\sqrt{3}}{2}', 'W_t = 3 W_d'],
  'ly11-c2-b8-q2': ['λ = \\frac{v}{f}', '\\lambda = v T'],
  'ly11-c2-b10-q2': ['f = \\frac{1}{T}', 'f = 1 / T = 1 / 0,0025 = 400 Hz'],
  'ly11-c2-b11-q2': [
    'λ = \\frac{c}{f}',
    'λ = 3 \\cdot 10^8 / (5 \\cdot 10^{14}) = 6 \\cdot 10^{-7} m',
  ],
  'ly11-c2-b12-q2': [
    'd_2 - d_1 = 1,5 \\lambda',
    '\\frac{d_2 - d_1}{\\lambda} = 1,5',
    'd_2 - d_1 = 16 - 10 = 6 cm',
  ],
  'ly11-c2-b13-q2': ['L = \\frac{k \\lambda}{2}', '1,5 = \\frac{3 λ}{2}'],
  'ly11-c2-b14-q1': ['λ = v / f', 'λ = \\frac{v}{f} = \\frac{350}{500} = 0,7 m'],
  'ly11-c2-b14-q2': ['L = k \\frac{\\lambda}{2}', '0,6 = k \\cdot 0,2'],
  'ly11-c2-b15-q2': ['v = λ f', 'v = \\lambda f = 0,34 \\cdot 1000 = 340 m/s'],
  'ly11-c3-b16-q2': ['F = k \\frac{q_1 q_2}{r^2}', 'F = \\frac{k q_1 q_2}{r^2}'],
  'ly11-c3-b17-q2': ['E = \\frac{F}{q}', 'E = F / q = 5000 V/m'],
  'ly11-c3-b18-q2': ['E = \\frac{U}{d}', 'E = U / d = 50 / 0,01 = 5000 V/m'],
  'ly11-c3-b19-q2': ['A = q E d', 'A = qEd'],
  'ly11-c3-b20-q2': ['U_{AB} = V_A - V_B', 'A_{AB} = q U_{AB}', 'U_{AB} = 100 - 40 = 60 V'],
  'ly11-c3-b21-q2': ['W = \\frac{1}{2} C U^2', 'W = \\frac{C U^2}{2}'],
  'ly11-c4-b22-q2': ['q = I t', 'q = It = 0,2 \\cdot 10 = 2 C'],
  'ly11-c4-b23-q2': ['I = \\frac{U}{R}', 'I = U / R = 5 / 10 = 0,5 A'],
  'ly11-c4-b24-q2': ['I = \\frac{E}{R + r}', 'I = \\frac{12}{10 + 2} = 1 A'],
  'ly11-c4-b25-q2': ['P = R I^2', 'P = I^2 R = 20 \\cdot 4 = 80 W'],
  'ly11-c4-b26-q2': ['U = E - I r', '1,3 = 1,5 - 0,5 r'],
  'ly12-c1-b2-q2': ['ΔU = A + Q', '\\Delta U = -200 + 500 = 300 J'],
  'ly12-c1-b3-q2': ['T = t + 273,15', 'T = 25 + 273,15 = 298,15 K'],
  'ly12-c1-b4-q2': ['Q = m c Δt', 'Q = m c \\Delta t = 0,5 \\cdot 4200 \\cdot 10 = 21000 J'],
  'ly12-c1-b5-q2': ['Q = λ m', 'm = \\frac{Q}{\\lambda}'],
  'ly12-c1-b6-q2': ['Q = L m', 'L = \\frac{Q}{m} = 2 \\cdot 10^6 J/kg'],
  'ly12-c1-b7-q2': [
    'm_1 c (t_1 - θ) = m_2 c (θ - t_2)',
    '2 (90 - θ) = 1 (θ - 30)',
    'Q_{toả} = Q_{thu}',
  ],
  'ly12-c2-b8-q2': ['\\frac{V_1}{T_1} = \\frac{V_2}{T_2}', 'T2 = T1 * V2 / V1', 'V1/T1 = V_2/T_2'],
  'ly12-c2-b9-q2': ['\\frac{p_1 V_1}{T_1} = \\frac{p_2 V_2}{T_2}', 'p2 = p1 * (V1/V2) * (T2/T1)'],
  'ly12-c2-b11-q1': ['p1*V1/T1 = p2*V2/T2', 'T_1 = t_1 + 273 = 300 K'],
  'ly12-c3-b13-q2': ['F = B I l \\sin α', 'F = B I L \\sin \\theta = 0'],
  'ly12-c3-b15-q2': ['F = q v B \\sin α', 'F = |q| v B \\sin θ'],
  'ly12-c3-b16-q2': ['e_{tc} = L \\frac{Δi}{Δt}', 'e_{tc} = L \\frac{\\Delta i}{\\Delta t}'],
  'ly12-c3-b19-q1': ['e_{tc} = L \\frac{Δi}{Δt}', 'e_{tc} = 0,1 \\cdot 20 = 2 V'],
  'ly12-c3-b19-q2': ['\\frac{U_2}{U_1} = \\frac{N_2}{N_1}', 'U2 = U1 * (N2 / N1)'],
  'ly12-c4-b21-q2': ['Δm = 2 m_p + 2 m_n - m_{He}', 'Δm = 0,03038 amu'],
  'ly12-c4-b23-q2': [
    'm = m_0 \\cdot 2^{-t/T}',
    '\\frac{N}{N_0} = 2^{-t/T}',
    '\\frac{t}{T} = \\frac{15}{5} = 3',
  ],
  'ly12-c4-b25-q1': ['λ = \\frac{\\ln 2}{T}', '\\lambda = \\ln(2) / T'],
  'ly12-c4-b25-q2': ['E_{thu} = (m_{sau} - m_{truoc}) c^2', 'E = Δm c^2'],
  'ly10-c91-b1-q1': ['a = \\frac{m_B g}{m_A + m_B}', 'a = m_B·g/(m_A + m_B) = 10/5 = 2'],
  'ly10-c91-b1-q2': ['T = m_A a', 'm_B g - T = m_B a'],
  'ly10-c91-b2-q1': ['\\tan α = \\frac{a_0}{g}', '\\tan \\alpha = a_0 / g = 4/10 = 0,4'],
  'ly10-c91-b2-q2': ['g_{hd} = g + a_0', 'N = m g_{hd}'],
  'ly10-c91-b3-q1': [
    'm g h = \\frac{1}{2} m v_1^2 + \\frac{1}{2} M v_2^2',
    'm v_1 = M v_2',
    'v = \\sqrt{2gh}',
  ],
  'ly10-c91-b3-q2': ['p = m v_1 + M v_2', 'p = 1 \\cdot 3 + 3 \\cdot (-1) = 0'],
  'ly11-c92-b1-q1': ['k_{td} = k_1 + k_2', 'k_{td} = 30 + 60 = 90 N/m'],
  'ly11-c92-b1-q2': [
    '\\frac{1}{k_{td}} = \\frac{1}{k_1} + \\frac{1}{k_2}',
    'k_{td} = \\frac{k_1 k_2}{k_1 + k_2}',
  ],
  'ly11-c92-b2-q1': ['g_{hd} = g + a_0', 'g_{hd} = 10 + 2 = 12 m/s^2'],
  'ly11-c92-b2-q2': ['T = 2\\pi \\sqrt{\\frac{l}{g_{hd}}}', 'T_0 = 2π \\sqrt{l/g}'],
  'ly11-c92-b3-q1': ['A_{max} = \\frac{\\mu g}{\\omega^2}', 'm ω^2 A = μ m g'],
  'ly11-c92-b3-q2': ["M v = (M + m) v'", "A' = \\frac{v'}{\\omega'}"],
  'ly12-c93-b1-q1': [
    "A' = p ΔV",
    "A' = p \\Delta V = 2 \\cdot 10^5 \\cdot 3 \\cdot 10^{-3} = 600 J",
  ],
  'ly12-c93-b1-q2': ["A' = Δp ΔV", "A' = \\Delta p \\cdot \\Delta V"],
  'ly12-c93-b2-q1': ['Q = ΔU', 'ΔU = 1,5 (p_2 V_2 - p_1 V_1)'],
  'ly12-c93-b2-q2': ["H = \\frac{A'}{Q_{thu}}", "H = A'/Q_{thu} = 600/2850"],
  'ly12-c93-b3-q1': ['F = \\frac{B^2 l^2 v}{R}', 'v_{gh} = \\frac{F R}{B^2 l^2}'],
  'ly12-c93-b3-q2': [
    'τ = \\frac{m R}{B^2 l^2}',
    '\\tau = \\frac{0,2 \\cdot 0,5}{1^2 \\cdot 1^2} = 0,1 s',
  ],
}

/** Bước SAI thứ nguyên rõ ràng (lỗi học sinh hay mắc) → bộ kiểm phải CHỨNG MINH được lệch. */
const BUOC_SAI: Readonly<Record<string, string>> = {
  'ly10-c2-b9-q2': 'd = v_o t + a t',
  'ly10-c3-b15-q2': 'F = \\frac{m}{a}',
  'ly10-c6-b32-q2': 'F_{ht} = \\frac{m v}{r}',
  'ly10-c7-b33-q2': 'F_{đh} = \\frac{k}{\\Delta l}',
  'ly11-c2-b8-q2': 'λ = v f',
  'ly11-c3-b16-q2': 'F = k \\frac{q_1 q_2}{r}',
  'ly11-c4-b23-q2': 'I = U R',
  'ly11-c4-b24-q2': 'I = \\frac{E}{R} + r',
  'ly12-c1-b4-q2': 'Q = m \\Delta t',
  'ly12-c2-b8-q2': '\\frac{V_1}{T_1} = V_2 T_2',
  // `2\\pi\\sqrt{g/l}` lệch chỉ CÓ ĐIỀU KIỆN (số trần 2π) — dùng bản không số trần.
  'ly11-c92-b2-q2': 'T^2 = \\frac{g_{hd}}{l}',
  'ly12-c93-b3-q2': 'τ = \\frac{m R}{B l}',
}

const coBang = DE_LI.filter((q) => q.variables !== undefined)

describe('Ngân hàng đề Vật lí — bảng thứ nguyên biến (0560)', () => {
  it('mọi câu Vật lí của ngân hàng hoặc có bảng, hoặc nằm trong danh sách bỏ qua có lý do', () => {
    const thieu = DE_LI.filter((q) => q.variables === undefined).map((q) => q.id)
    expect(thieu.sort()).toEqual(Object.keys(BO_QUA).sort())
    // Số liệu ghi ở changelog 0560 — đổi ngân hàng thì cập nhật cả changelog/đặc tả.
    expect(DE_LI.length).toBe(89)
    expect(coBang.length).toBe(86)
  })

  it('mọi bảng hợp lệ theo hợp đồng StemVariableTableSchema', () => {
    for (const q of coBang) {
      expect(StemVariableTableSchema.safeParse(q.variables).success, q.id).toBe(true)
    }
  })

  it('mọi khoá đọc được là MỘT ký hiệu, đúng thứ nguyên của đơn vị khai', () => {
    for (const q of coBang) {
      for (const [key, unit] of Object.entries(q.variables ?? {})) {
        const r = checkPhysicsStep(`${key} = ${key}`, q.variables)
        expect(r.verdict, `${q.id} · ${key}: ${JSON.stringify(r)}`).toBe('consistent')
        const parsed = unit === '' ? null : parseUnitExpression(unit)
        if (parsed !== null && !parsed.ok) throw new Error(`${q.id} · ${key}: đơn vị lạ ${unit}`)
        const expected = parsed === null ? 'không thứ nguyên' : formatDimension(parsed.dim)
        if (r.verdict === 'consistent') expect(r.dimension, `${q.id} · ${key}`).toBe(expected)
      }
    }
  })

  it('mỗi câu có bảng đều có bước đúng mẫu (không câu nào khai bảng mà chưa thử)', () => {
    expect(Object.keys(BUOC_DUNG).sort()).toEqual(coBang.map((q) => q.id).sort())
  })

  it('bước ĐÚNG theo lời giải của chính câu KHÔNG BAO GIỜ bị báo lệch thứ nguyên', () => {
    const LECH = ['mismatch', 'conditional_mismatch', 'division_by_zero']
    for (const q of coBang) {
      const buoc = BUOC_DUNG[q.id] ?? []
      buoc.forEach((step, i) => {
        const r = checkPhysicsStep(step, q.variables)
        expect(LECH, `${q.id} · ${step}: ${JSON.stringify(r)}`).not.toContain(r.verdict)
        if (i === 0) expect(r.verdict, `${q.id} · ${step}: ${JSON.stringify(r)}`).toBe('consistent')
      })
    }
  })

  it('bước SAI thứ nguyên rõ ràng bị bắt (mismatch) nhờ bảng của câu', () => {
    for (const [id, step] of Object.entries(BUOC_SAI)) {
      const q = coBang.find((c) => c.id === id)
      expect(q, id).toBeDefined()
      const r = checkPhysicsStep(step, q?.variables)
      expect(r.verdict, `${id} · ${step}: ${JSON.stringify(r)}`).toBe('mismatch')
      // Không có bảng thì cùng bước đó KHÔNG được kết luận (không đoán thứ nguyên).
      expect(checkPhysicsStep(step, undefined).verdict).toBe('unsupported')
    }
  })

  it('ký hiệu mơ hồ được khai đúng NGHĨA của bài, không theo một nghĩa chung', () => {
    const bang = (id: string) => DE_LI.find((q) => q.id === id)?.variables ?? {}
    expect(bang('ly10-c7-b33-q2').k).toBe('N/m') // độ cứng lò xo
    expect(bang('ly11-c3-b16-q2').k).toBe('N·m^2/C^2') // hằng số Coulomb
    expect(bang('ly11-c2-b13-q2').k).toBe('') // số bó sóng
    expect(bang('ly12-c1-b4-q2').c).toBe('J/(kg·K)') // nhiệt dung riêng, thắng hằng c
    expect(bang('ly11-c4-b24-q2').E).toBe('V') // suất điện động
    expect(bang('ly11-c3-b17-q2').E).toBe('V/m') // cường độ điện trường
  })
})
