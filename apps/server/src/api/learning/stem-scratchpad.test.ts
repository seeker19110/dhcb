// api/stem-scratchpad.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './stem-scratchpad.js'
import * as security from '@dhcb/core-auth/security'
import { getFeatureState } from '@dhcb/core-db/featureState'
import {
  StemBankQuestionPublicSchema,
  StemMicroHintSchema,
  SubmitSolutionResultSchema,
} from '@dhcb/core-contracts/stemScratchpad'
import { buildStemQuestionBank } from '@dhcb/core-ai/stemQuestionBank'
import { MATH_LESSONS } from '@dhcb/subject-math/lessons'
import { PHYSICS_LESSONS } from '@dhcb/subject-physics/lessons'
import { CHEM_LESSONS } from '@dhcb/subject-chemistry/lessons'

// Handler đã chuyển state sang platform.feature_state — mock bằng Map in-memory (hành vi giống
// hệt Map cấp module cũ: state sống suốt file test), theo đúng khuôn pvp-arena.test.ts.
const featureStore = new Map<string, unknown>()
vi.mock('@dhcb/core-db/featureState', () => ({
  getFeatureState: vi.fn(async (u: string, f: string) => featureStore.get(u + '|' + f) ?? null),
  setFeatureState: vi.fn(async (u: string, f: string, st: unknown) => {
    featureStore.set(u + '|' + f, st)
  }),
}))

describe('STEM Scratchpad API Handler (/api/stem-scratchpad)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects unauthorized requests with 401', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/stem-scratchpad', {
      method: 'GET',
    })

    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  it('GET không có action → 400 (3 "bài mẫu" viết cứng đã gỡ ở changelog 0551)', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const res = await handler(
      new Request('http://localhost/api/stem-scratchpad', { method: 'GET' }),
    )
    expect(res.status).toBe(400)
  })

  it('creates problem and validates algebraic step on POST', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    // 1. Create problem
    const createReq = new Request('http://localhost/api/stem-scratchpad?action=create_problem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'math',
        title: 'Linear equation test',
        problemStatement: 'Solve 2x + 5 = 15',
        problemLatex: '2x + 5 = 15',
      }),
    })

    const createRes = await handler(createReq)
    expect(createRes.status).toBe(200)
    const probData = await createRes.json()
    expect(probData.success).toBe(true)
    const problemId = probData.problem.id

    // 2. Validate step
    const stepReq = new Request('http://localhost/api/stem-scratchpad?action=validate_step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemId,
        latexInput: '2x = 10',
        explanation: 'Subtract 5 from both sides',
      }),
    })

    const stepRes = await handler(stepReq)
    expect(stepRes.status).toBe(200)
    const stepData = await stepRes.json()
    expect(stepData.success).toBe(true)
    expect(stepData.validation.isValid).toBe(true)
  })

  it('chỉ đánh dấu giải xong khi đáp số khớp NGUYÊN VẸN (không so chuỗi con)', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const post = (action: string, body: unknown) =>
      handler(
        new Request(`http://localhost/api/stem-scratchpad?action=${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      ).then((r) => r.json())

    const { problem } = await post('create_problem', {
      subject: 'math',
      title: 'Phương trình bậc nhất',
      problemStatement: 'Tìm giá trị của x: 2x + 5 = 15',
      problemLatex: '2x + 5 = 15',
    })

    const sai = await post('validate_step', { problemId: problem.id, latexInput: 'x = 50' })
    expect(sai.isSolved).toBe(false)
    // Từ changelog 0547 bộ kiểm so tập nghiệm với đề: x = 50 bị bắt là ĐỔI NGHIỆM.
    expect(sai.validation.status).toBe('invalid')
    expect(sai.validation.errorType).toBe('changed_solutions')

    // Bước GIỮA đúng (tương đương đề) → ✓ nhưng CHƯA "giải xong".
    const giua = await post('validate_step', { problemId: problem.id, latexInput: '2x = 10' })
    expect(giua.validation.status).toBe('valid')
    expect(giua.isSolved).toBe(false)

    const dung = await post('validate_step', { problemId: problem.id, latexInput: 'x = 5' })
    expect(dung.isSolved).toBe(true)
    expect(dung.validation.status).toBe('valid')
  })

  it('handles OPTIONS request with 204', async () => {
    const res = await handler(
      new Request('http://localhost/api/stem-scratchpad', { method: 'OPTIONS' }),
    )
    expect(res.status).toBe(204)
  })

  it('handles GET specific problemId (found and not found)', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    // Not found
    const notFoundRes = await handler(
      new Request('http://localhost/api/stem-scratchpad?problemId=nonexistent', { method: 'GET' }),
    )
    expect(notFoundRes.status).toBe(404)

    // Create problem
    const createReq = new Request('http://localhost/api/stem-scratchpad?action=create_problem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'math',
        title: 'Equation',
        problemStatement: '2x = 10',
      }),
    })
    const createRes = await handler(createReq)
    const { problem } = await createRes.json()

    // Found
    const foundRes = await handler(
      new Request(`http://localhost/api/stem-scratchpad?problemId=${problem.id}`, {
        method: 'GET',
      }),
    )
    expect(foundRes.status).toBe(200)
  })

  it('validates missing fields and actions on POST', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    // Missing create fields
    const badCreate = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=create_problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )
    expect(badCreate.status).toBe(400)

    // Missing latexInput in validate_step
    const badStep = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=validate_step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )
    expect(badStep.status).toBe(400)

    // Không có problemId → server tự dựng đề từ chính bước gửi lên. Đề đó KHÔNG có đáp số đã biết
    // nên không bao giờ "giải xong" (trước changelog 0473, chỉ cần chứa chuỗi 'x = 5' là xong).
    const fallbackStep = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=validate_step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latexInput: 'x = 5', explanation: 'Final answer' }),
      }),
    )
    expect(fallbackStep.status).toBe(200)
    const fallbackData = await fallbackStep.json()
    expect(fallbackData.isSolved).toBe(false)
    expect(fallbackData.validation.status).toBe('unverified')

    // Get hint (not found vs found)
    const notFoundHint = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=get_hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: 'ghost' }),
      }),
    )
    expect(notFoundHint.status).toBe(404)

    const foundHint = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=get_hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: fallbackData.problem.id }),
      }),
    )
    expect(foundHint.status).toBe(200)

    // Invalid action
    const badAction = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=fake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )
    expect(badAction.status).toBe(400)

    // Method not allowed
    const badMethod = await handler(
      new Request('http://localhost/api/stem-scratchpad', { method: 'PATCH' }),
    )
    expect(badMethod.status).toBe(405)
  })

  it('get_questions: lọc theo môn/lớp/nhánh, KHÔNG trả đáp án hay lời giải', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const res = await handler(
      new Request(
        'http://localhost/api/stem-scratchpad?action=get_questions&subject=math&grade=12&track=core&limit=5',
        { method: 'GET' },
      ),
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.questions.length).toBeGreaterThan(0)
    expect(data.questions.length).toBeLessThanOrEqual(5)
    expect(data.total).toBeGreaterThanOrEqual(data.questions.length)
    for (const q of data.questions) {
      expect(q.subject).toBe('math')
      expect(q.grade).toBe('12')
      expect(q.track).toBe('core')
      expect(q).not.toHaveProperty('answer')
      expect(q).not.toHaveProperty('explain')
      expect(StemBankQuestionPublicSchema.safeParse(q).success).toBe(true)
    }
  })

  it('get_questions: tham số lọc sai kiểu → 400 (không âm thầm bỏ qua)', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    for (const qs of ['subject=van', 'grade=13', 'track=de', 'limit=0', 'limit=abc']) {
      const res = await handler(
        new Request(`http://localhost/api/stem-scratchpad?action=get_questions&${qs}`, {
          method: 'GET',
        }),
      )
      expect(res.status, qs).toBe(400)
    }
  })

  it('submit_solution: problem not found trả 404', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const res = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=submit_solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: 'ghost', finalAnswer: 'x=5' }),
      }),
    )
    expect(res.status).toBe(404)
  })

  it('submit_solution: bài KHÔNG thuộc ngân hàng đề → 409 NO_ANSWER_KEY (không đoán đúng/sai)', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const createRes = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=create_problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'math',
          title: 'Phương trình tự nhập',
          problemStatement: '3x = 9',
        }),
      }),
    )
    const { problem } = await createRes.json()

    const submitRes = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=submit_solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: problem.id, finalAnswer: '3' }),
      }),
    )
    expect(submitRes.status).toBe(409)
    expect((await submitRes.json()).error).toBe('NO_ANSWER_KEY')
  })

  it("cắt bớt bài khi có bản ghi thiếu updatedAt (nhánh fallback ?? '')", async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const USER = '11111111-1111-4111-8111-111111111111'
    // Cấy sẵn 30 bài KHÔNG có updatedAt để buộc nhánh `?? ''` trong comparator sort chạy khi
    // trim — dữ liệu cũ/hỏng trong thực tế có thể thiếu trường này.
    const seeded: Record<string, unknown> = {}
    for (let i = 0; i < 30; i++) {
      seeded[`legacy-${i}`] = { id: `legacy-${i}` }
    }
    featureStore.set(USER + '|stem_scratchpad', seeded)

    const res = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=create_problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'math',
          title: 'Bài vượt trần',
          problemStatement: '2x = 4',
        }),
      }),
    )
    expect(res.status).toBe(200)
  })

  it('get_questions không truyền tham số lọc nào (dùng toàn bộ nhánh mặc định)', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const res = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=get_questions', { method: 'GET' }),
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.questions.length).toBeLessThanOrEqual(20)
  })

  it('get_hint không truyền problemId → problemId rỗng → 404 (nhánh problemId falsy)', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const res = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=get_hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )
    expect(res.status).toBe(404)
  })

  it('submit_solution không truyền problemId → problemId rỗng → 404 (nhánh problemId falsy)', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const res = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=submit_solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )
    expect(res.status).toBe(404)
  })

  describe('ngân hàng đề thật + submit_solution (changelog 0551)', () => {
    const BANK = buildStemQuestionBank([
      { subject: 'math', lessons: MATH_LESSONS },
      { subject: 'physics', lessons: PHYSICS_LESSONS },
      { subject: 'chemistry', lessons: CHEM_LESSONS },
    ])
    // Câu Toán đáp số nguyên ≥ 2, không đơn vị; câu Lí có đơn vị bắt buộc.
    const toan = BANK.find(
      (q) =>
        q.subject === 'math' &&
        q.answer.kind === 'numeric' &&
        q.answer.unit === undefined &&
        Number.isInteger(q.answer.value) &&
        q.answer.value >= 2,
    )
    const ly = BANK.find((q) => q.subject === 'physics' && q.needsUnit)
    const giaTri = toan?.answer.kind === 'numeric' ? toan.answer.value : Number.NaN

    const post = async (action: string, body: unknown) => {
      const res = await handler(
        new Request(`http://localhost/api/stem-scratchpad?action=${action}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      )
      return { status: res.status, data: await res.json() }
    }

    beforeEach(() => {
      vi.spyOn(security, 'validateAuth').mockResolvedValue({
        userId: '11111111-1111-4111-8111-111111111111',
      })
    })

    it('create_problem từ questionId: đề/môn do SERVER tra, gắn questionId', async () => {
      expect(toan).toBeDefined()
      const { status, data } = await post('create_problem', {
        questionId: toan?.id,
        // Client cố gửi đề khác — phải bị bỏ qua.
        problemStatement: 'đề giả',
        subject: 'physics',
      })
      expect(status).toBe(200)
      expect(data.problem.questionId).toBe(toan?.id)
      expect(data.problem.subject).toBe('math')
      expect(data.problem.problemStatement).toBe(toan?.problemStatement)
      expect(data.problem).not.toHaveProperty('problemLatex')

      expect((await post('create_problem', { questionId: 'khong-co' })).status).toBe(404)
      expect((await post('create_problem', { questionId: '' })).status).toBe(400)
      expect((await post('create_problem', { questionId: 42 })).status).toBe(400)
    })

    it('nộp ĐÚNG → isSolved + lời giải của bài học; so theo giá trị, không so chuỗi con', async () => {
      const { data } = await post('create_problem', { questionId: toan?.id })
      const id = data.problem.id

      // Chuỗi con: "1" + đáp số (vd "18" chứa "8") phải SAI.
      const sai = await post('submit_solution', { problemId: id, finalAnswer: `1${giaTri}` })
      expect(sai.status).toBe(200)
      expect(sai.data).toMatchObject({ isSolved: false, correct: false })
      expect(sai.data).not.toHaveProperty('explanation')

      expect((await post('submit_solution', { problemId: id, finalAnswer: giaTri })).status).toBe(
        400,
      )

      const dung = await post('submit_solution', { problemId: id, finalAnswer: `x = ${giaTri},0` })
      expect(dung.data).toMatchObject({ isSolved: true, correct: true })
      expect(dung.data.explanation).toBe(toan?.explain)
      expect(SubmitSolutionResultSchema.safeParse(dung.data).success).toBe(true)

      // Đã xong rồi, nộp sai lần nữa: bài vẫn xong, lần nộp này vẫn báo sai.
      const lai = await post('submit_solution', { problemId: id, finalAnswer: 'abc' })
      expect(lai.data).toMatchObject({ isSolved: true, correct: false })
    })

    it('Vật lí: thiếu đơn vị → chưa xong, có mã lý do', async () => {
      expect(ly).toBeDefined()
      const { data } = await post('create_problem', { questionId: ly?.id })
      const r = await post('submit_solution', { problemId: data.problem.id, finalAnswer: '123456' })
      expect(r.data.isSolved).toBe(false)
      expect(r.data.reason).toBe('MISSING_UNIT')
    })

    it('CHẶN HỒI QUY: đặt problemId = id câu ngân hàng qua validate_step KHÔNG tự chọn được câu để chấm', async () => {
      // Trước 0551 server tra câu theo problemId do client gửi — client đặt problemId trùng id câu
      // là "mượn" được đáp án câu đó để chấm.
      await post('validate_step', { problemId: toan?.id, latexInput: 'chưa xong' })
      const r = await post('submit_solution', { problemId: toan?.id, finalAnswer: `${giaTri}` })
      expect(r.status).toBe(409)
    })

    it('validate_step trên bài ngân hàng: bước đúng so với bước 1 KHÔNG làm bài "giải xong"', async () => {
      const { data } = await post('create_problem', { questionId: toan?.id })
      const id = data.problem.id
      await post('validate_step', { problemId: id, latexInput: `x = ${giaTri} + 0` })
      const r = await post('validate_step', { problemId: id, latexInput: `x = ${giaTri}` })
      expect(r.data.validation.status).toBe('valid')
      expect(r.data.validation.isFinalAnswer).toBe(false)
      expect(r.data.isSolved).toBe(false)
    })

    it('get_hint trên bài ngân hàng trả câu hỏi kèm bậc, đúng hợp đồng', async () => {
      const { data } = await post('create_problem', { questionId: toan?.id })
      const r = await post('get_hint', { problemId: data.problem.id })
      expect(r.status).toBe(200)
      expect(StemMicroHintSchema.safeParse(r.data.hint).success).toBe(true)
      expect(r.data.hintsUsed).toBe(1)
    })
  })

  it('cắt bớt bài cũ nhất khi vượt trần MAX_PROBLEMS (30 bài/người)', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    // Dùng fake timer, mỗi bài cách nhau 1 giây để updatedAt PHÂN BIỆT rõ ràng — tránh so sánh
    // chuỗi ISO trùng giờ (localeCompare hoà) khiến kết quả cắt bớt không ổn định giữa các lần chạy.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))

    let firstProblemId = ''
    try {
      for (let i = 0; i < 31; i++) {
        const res = await handler(
          new Request('http://localhost/api/stem-scratchpad?action=create_problem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: 'math',
              title: `Bài số ${i}`,
              problemStatement: `2x = ${i}`,
            }),
          }),
        )
        const data = await res.json()
        if (i === 0) firstProblemId = data.problem.id
        vi.setSystemTime(new Date(Date.now() + 1000))
      }
    } finally {
      vi.useRealTimers()
    }

    // Bài cũ nhất (tạo đầu tiên, updatedAt nhỏ nhất) đã bị cắt khỏi book vì vượt trần 30.
    const notFoundRes = await handler(
      new Request(`http://localhost/api/stem-scratchpad?problemId=${firstProblemId}`, {
        method: 'GET',
      }),
    )
    expect(notFoundRes.status).toBe(404)
  })

  it('trả 400 khi body POST không phải JSON hợp lệ (nhánh catch)', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const res = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=create_problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid-json',
      }),
    )
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid JSON payload')
  })

  it('CHẶN HỒI QUY 2026-10-08: CSDL lỗi → 500 có log, KHÔNG phải 400 "Invalid JSON payload" lộ lỗi pg', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(getFeatureState).mockRejectedValueOnce(
      new Error('connect ECONNREFUSED 10.0.0.5:5432'),
    )
    const res = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=get_hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: 'p-1' }),
      }),
    )
    expect(res.status).toBe(500)
    expect(await res.text()).not.toContain('ECONNREFUSED')
    expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('stem-scratchpad'))
  })

  it('đề Vật lí kèm bảng thứ nguyên biến: bước lệch thứ nguyên → ✗, bảng hỏng → 400 (changelog 0552)', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const tao = (variables: unknown) =>
      handler(
        new Request('http://localhost/api/stem-scratchpad?action=create_problem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: 'physics',
            title: 'Chuyển động biến đổi đều',
            problemStatement: 'Tính quãng đường',
            problemLatex: 's = v_0 t + \\frac{1}{2} a t^2',
            variables,
          }),
        }),
      )
    expect((await tao({ v: 42 })).status).toBe(400)
    const res = await tao({ s: 'm', v_0: 'm/s', a: 'm/s^2', t: 's' })
    expect(res.status).toBe(200)
    const { problem } = await res.json()
    expect(problem.variables).toEqual({ s: 'm', v_0: 'm/s', a: 'm/s^2', t: 's' })

    const kiem = async (latexInput: string) => {
      const r = await handler(
        new Request('http://localhost/api/stem-scratchpad?action=validate_step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problemId: problem.id, latexInput }),
        }),
      )
      return (await r.json()) as {
        validation: { status: string; errorType: string }
        isSolved: boolean
      }
    }
    const lech = await kiem('s = v_0 t + a t')
    expect(lech.validation.status).toBe('invalid')
    expect(lech.validation.errorType).toBe('dimension_mismatch')
    const khop = await kiem('s = v_0 t + \\frac{1}{2} a t^2')
    // Khớp thứ nguyên chỉ là điều kiện CẦN → không bao giờ ✓, không làm bài "giải xong".
    expect(khop.validation.status).toBe('unverified')
    expect(khop.isSolved).toBe(false)
  })
})
