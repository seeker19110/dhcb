// Bất biến dữ liệu các bước dự án trục chặng P1 — kèm KIỂM SỐ HỌC đối chiếu độc lập
// (bài học từ lessons.test.ts: test số học đã bắt được lỗi tính tay khi soạn).
import { describe, expect, it } from 'vitest'
import {
  P1_PROJECT_STEPS,
  P2_PROJECT_STEPS,
  PROJECT_STAGES,
  ProjectStepSchema,
  getProjectStep,
  getStepFiles,
  getStepMainFile,
  PROJECT_STARTER_CODE,
  PROJECT_MAIN_FILE,
} from './projectSteps.js'
import { P4_PROJECT_STEPS } from './projectStepsP4.js'
import { PROGRAMMING_LEVELS } from './curriculum.js'

const P1_UNIT_IDS = new Set(PROGRAMMING_LEVELS.find((l) => l.id === 'p1')!.units.map((u) => u.id))
const P2_UNIT_IDS = new Set(PROGRAMMING_LEVELS.find((l) => l.id === 'p2')!.units.map((u) => u.id))
const P4_UNIT_IDS = new Set(PROGRAMMING_LEVELS.find((l) => l.id === 'p4')!.units.map((u) => u.id))
const GIA = [5000, 15000, 10000]
const thanhToan = (tong: number) =>
  tong >= 100_000 ? Math.floor(tong * 0.8) : tong >= 50_000 ? Math.floor(tong * 0.9) : tong

describe('P1 project steps', () => {
  it('đúng khuôn schema, id tuần tự p1-s1..s5, unit tồn tại, bước cuối là milestone', () => {
    expect(P1_PROJECT_STEPS.map((s) => s.id)).toEqual(['p1-s1', 'p1-s2', 'p1-s3', 'p1-s4', 'p1-s5'])
    for (const step of P1_PROJECT_STEPS) {
      expect(ProjectStepSchema.safeParse(step).success).toBe(true)
      expect(P1_UNIT_IDS.has(step.unitId)).toBe(true)
      expect(step.checks.some((c) => !c.hidden)).toBe(true) // luôn có ca hiện để học viên đối chiếu
    }
    expect(P1_PROJECT_STEPS.at(-1)!.isMilestone).toBe(true)
    expect(P1_PROJECT_STEPS.slice(0, -1).every((s) => !s.isMilestone)).toBe(true)
  })

  it('số học các ca chấm khớp luật đề (giá món, giảm giá bậc, doanh thu)', () => {
    // s2: Tong = gia[mon-1] * so_luong
    for (const c of getProjectStep('p1-s2')!.checks) {
      const [, mon, sl] = c.stdinLines.map(Number)
      expect(c.expected).toBe(`Tong: ${GIA[mon! - 1]! * sl!}`)
    }
    // s3: các ca "Thanh toan" khớp luật bậc
    for (const c of getProjectStep('p1-s3')!.checks.filter((c) => c.expected.startsWith('Thanh'))) {
      const [, mon, sl] = c.stdinLines.map(Number)
      expect(c.expected).toBe(`Thanh toan: ${thanhToan(GIA[mon! - 1]! * sl!)}`)
    }
    // s4: doanh thu = tổng thanh toán các đơn
    const s4 = getProjectStep('p1-s4')!.checks[0]!
    // ['Lan','2', '2','3', '1','2'] → cam×3 + trà×2
    expect(s4.expected).toBe(`Doanh thu: ${thanhToan(15000 * 3) + thanhToan(5000 * 2)}`)
    // s5: thối lại = tiền đưa − thanh toán
    const s5 = getProjectStep('p1-s5')!.checks[0]!
    expect(s5.expected).toBe(`Thoi lai: ${50000 - thanhToan(15000 * 3)}`)
  })

  it('starter code và file chính hợp lệ; tra bước lạ trả undefined', () => {
    expect(PROJECT_MAIN_FILE).toBe('cua_hang.py')
    expect(PROJECT_STARTER_CODE).toContain('cua_hang.py')
    expect(getProjectStep('p1-s9')).toBeUndefined()
  })
})

describe('P2 project steps (PR-L6b)', () => {
  it('đúng khuôn schema, id tuần tự p2-s1..s5, unit P2 tồn tại, bước cuối là milestone', () => {
    expect(P2_PROJECT_STEPS.map((s) => s.id)).toEqual(['p2-s1', 'p2-s2', 'p2-s3', 'p2-s4', 'p2-s5'])
    for (const step of P2_PROJECT_STEPS) {
      expect(ProjectStepSchema.safeParse(step).success, `sai khuôn: ${step.id}`).toBe(true)
      expect(P2_UNIT_IDS.has(step.unitId), `unit lạ ở ${step.id}`).toBe(true)
      expect(step.checks.some((c) => !c.hidden)).toBe(true)
    }
    expect(P2_PROJECT_STEPS.at(-1)!.isMilestone).toBe(true)
    expect(P2_PROJECT_STEPS.slice(0, -1).every((s) => !s.isMilestone)).toBe(true)
  })

  it('bước tách file: khai đủ file, file chính đứng đầu, và CÓ probe import module', () => {
    const s5 = getProjectStep('p2-s5')!
    expect(getStepFiles(s5)).toEqual(['cua_hang.py', 'logic.py', 'luu_tru.py'])
    expect(getStepMainFile(s5)).toBe('cua_hang.py')
    // Mọi file PHỤ phải có code mẫu kèm theo, nếu không "phao" sẽ nạp thiếu file.
    expect(Object.keys(s5.referenceFiles ?? {}).sort()).toEqual(['logic.py', 'luu_tru.py'])
    // Không có probe thì code gộp một file vẫn qua được — bước tách vai trò thành hình thức.
    expect(s5.probeCode).toBeDefined()
    expect(s5.probeCode).toContain('from logic import')
    expect(s5.probeCode).toContain('from luu_tru import')
  })

  it('các bước KHÔNG tách file thì chỉ dùng file chính của chặng', () => {
    for (const step of P2_PROJECT_STEPS.slice(0, -1)) {
      expect(getStepFiles(step)).toEqual([PROJECT_MAIN_FILE])
      expect(step.probeCode).toBeUndefined()
    }
  })
})

describe('P4 project steps (PR-L17)', () => {
  it('đúng khuôn schema, id tuần tự p4-s1..s6, unit P4 tồn tại, bước cuối là milestone', () => {
    expect(P4_PROJECT_STEPS.map((s) => s.id)).toEqual([
      'p4-s1',
      'p4-s2',
      'p4-s3',
      'p4-s4',
      'p4-s5',
      'p4-s6',
    ])
    for (const step of P4_PROJECT_STEPS) {
      expect(ProjectStepSchema.safeParse(step).success, `sai khuôn: ${step.id}`).toBe(true)
      expect(P4_UNIT_IDS.has(step.unitId), `unit lạ ở ${step.id}`).toBe(true)
      expect(step.checks.some((c) => !c.hidden)).toBe(true)
    }
    expect(P4_PROJECT_STEPS.at(-1)!.isMilestone).toBe(true)
    expect(P4_PROJECT_STEPS.slice(0, -1).every((s) => !s.isMilestone)).toBe(true)
  })

  it('đi qua đủ ba làn Python của bậc (python thuần → pytest → apisim)', () => {
    // Bậc P4 là chỗ dự án mọc xương sống: lõi OOP, rồi test canh lõi, rồi API mở lõi ra
    // ngoài. Thiếu một làn nghĩa là milestone "full-stack mini" chỉ còn là lời hứa.
    const lanes = P4_PROJECT_STEPS.map((s) => s.language ?? 'python')
    expect(lanes).toEqual(['python', 'python', 'python', 'pytest', 'apisim', 'apisim'])
    // probeCode chỉ hợp lệ với Python thuần (schema chặn) — không bước nào ở đây cần nó.
    expect(P4_PROJECT_STEPS.every((s) => s.probeCode === undefined)).toBe(true)
  })

  it('số học các ca chấm khớp luật tiền của quán (giá món × số lượng, giảm giá bậc)', () => {
    // 2 tra da + 3 nuoc cam = 55.000 → qua mốc 50.000 nên giảm 10%.
    const tong = GIA[0]! * 2 + GIA[1]! * 3
    expect(tong).toBe(55000)
    const s2 = P4_PROJECT_STEPS[1]!
    expect(s2.checks.some((c) => c.expected === `Tong cong: ${tong}`)).toBe(true)
    expect(s2.checks.some((c) => c.expected === `Thanh toan: ${thanhToan(tong)}`)).toBe(true)
    // Milestone dùng đúng bộ số đó qua API — lệch nhau là dự án nói hai giọng.
    const s6 = P4_PROJECT_STEPS.at(-1)!
    expect(s6.checks.some((c) => c.expected === `TONG: ${tong}`)).toBe(true)
    expect(s6.checks.some((c) => c.expected === `THANH TOAN: ${thanhToan(tong)}`)).toBe(true)
  })
})

describe('PROJECT_STAGES', () => {
  it('liệt kê đúng các chặng đã mở, id bước không trùng nhau giữa các chặng', () => {
    // Chặng P3 thêm ở PR-L8 (nội dung + cổng riêng: projectStepsP3.test.ts); chặng P4 thêm ở
    // PR-L17 (chạy qua cổng python3 chung: lessonsPython.test.ts, gồm cả làn pytest/apisim).
    expect(PROJECT_STAGES.map((s) => s.level)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5'])
    expect(PROJECT_STAGES[0]!.steps).toBe(P1_PROJECT_STEPS)
    expect(PROJECT_STAGES[1]!.steps).toBe(P2_PROJECT_STEPS)
    const ids = PROJECT_STAGES.flatMap((s) => s.steps).map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('getProjectStep tra được bước của MỌI chặng (không chỉ P1)', () => {
    expect(getProjectStep('p2-s5')?.isMilestone).toBe(true)
  })
})

it('mọi language project hiện có từ chối Git assertions', () => {
  const original = P1_PROJECT_STEPS[0]!
  for (const language of ['python', 'pytest', 'apisim', 'html', 'dom', 'sql', 'fetch']) {
    expect(
      ProjectStepSchema.safeParse({
        ...original,
        language,
        checks: [{ ...original.checks[0]!, gitAssertions: [{ type: 'headAbsent', path: '.env' }] }],
      }).success,
    ).toBe(false)
  }
})
