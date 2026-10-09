// api/stem-scratchpad.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './stem-scratchpad.js'
import * as security from '@dhcb/core-auth/security'
import { getFeatureState } from '@dhcb/core-db/featureState'

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

  it('returns sample problems on GET with 200', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    const req = new Request('http://localhost/api/stem-scratchpad', {
      method: 'GET',
    })

    const res = await handler(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.problems.length).toBeGreaterThan(0)
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
    expect(sai.validation.status).toBe('unverified')

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

  it('get_questions lọc theo ngân hàng câu hỏi nâng cao', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const res = await handler(
      new Request(
        'http://localhost/api/stem-scratchpad?action=get_questions&subject=math&grade=12&difficulty=easy&limit=5',
        { method: 'GET' },
      ),
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.questions)).toBe(true)
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

  it('submit_solution: đã isSolved sẵn thì trả isSolved true', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    // Tạo bài rồi giải đúng bằng validate_step để isSolved=true
    const createRes = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=create_problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'math',
          title: 'Phương trình',
          problemStatement: '2x + 5 = 15',
          // Đề mẫu có đáp số đã biết — chỉ đề như vậy mới "giải xong" được (changelog 0473).
          problemLatex: '2x + 5 = 15',
        }),
      }),
    )
    const { problem } = await createRes.json()

    await handler(
      new Request('http://localhost/api/stem-scratchpad?action=validate_step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: problem.id, latexInput: 'x = 5' }),
      }),
    )

    const submitRes = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=submit_solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: problem.id, finalAnswer: 'x=5' }),
      }),
    )
    expect(submitRes.status).toBe(200)
    const submitData = await submitRes.json()
    expect(submitData.success).toBe(true)
    expect(submitData.isSolved).toBe(true)
  })

  it('submit_solution: chưa giải và không khớp câu hỏi trong ngân hàng → isSolved false', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const createRes = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=create_problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'math',
          title: 'Phương trình chưa giải',
          problemStatement: '3x = 9',
        }),
      }),
    )
    const { problem } = await createRes.json()

    const submitRes = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=submit_solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: problem.id, finalAnswer: 'chưa chắc' }),
      }),
    )
    expect(submitRes.status).toBe(200)
    const submitData = await submitRes.json()
    expect(submitData.isSolved).toBe(false)
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

  it('submit_solution: khớp câu trả lời với ngân hàng câu hỏi (question tồn tại, đáp án đúng)', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    // Gán problemId trùng với id thật trong ngân hàng câu hỏi qua validate_step (fallback tạo bài
    // rồi ép prob.id = problemId truyền vào) để submit_solution tìm thấy question tương ứng.
    await handler(
      new Request('http://localhost/api/stem-scratchpad?action=validate_step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: 'math-10-1', latexInput: 'chưa xong' }),
      }),
    )

    const res = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=submit_solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Đáp án ngân hàng là "S_{2} = 0"; học sinh viết "x = 0" — so theo đáp số, không theo chữ.
        body: JSON.stringify({ problemId: 'math-10-1', finalAnswer: 'x = 0' }),
      }),
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.isSolved).toBe(true)
    expect(data.solutionPreview).toBeDefined()
  })

  it('submit_solution: so ĐÁP SỐ, không so chuỗi con (changelog 0539)', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    // math-10-3 có đáp án "S_{4} = 20".
    await handler(
      new Request('http://localhost/api/stem-scratchpad?action=validate_step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: 'math-10-3', latexInput: 'chưa xong' }),
      }),
    )
    const submit = async (finalAnswer: unknown) => {
      const res = await handler(
        new Request('http://localhost/api/stem-scratchpad?action=submit_solution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problemId: 'math-10-3', finalAnswer }),
        }),
      )
      return { status: res.status, data: await res.json() }
    }
    // Chuỗi con cũ: "S_{4} = 20 sai" chứa nguyên 10 ký tự đầu đáp án → từng được tính là đúng.
    expect((await submit('S_{4} = 20 sai')).data.isSolved).toBe(false)
    expect((await submit('120')).data.isSolved).toBe(false)
    expect((await submit(20)).status).toBe(400)
    // "20,0" (dấu phẩy thập phân) đúng về giá trị → giải xong.
    expect((await submit('x = 20,0')).data.isSolved).toBe(true)
  })

  it('submit_solution: khớp ngân hàng câu hỏi nhưng đáp án SAI → isSolved false', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    await handler(
      new Request('http://localhost/api/stem-scratchpad?action=validate_step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: 'math-10-2', latexInput: 'chưa xong' }),
      }),
    )

    const res = await handler(
      new Request('http://localhost/api/stem-scratchpad?action=submit_solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: 'math-10-2', finalAnswer: 'đáp án hoàn toàn sai' }),
      }),
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.isSolved).toBe(false)
    // Nộp sai KHÔNG được nhận lời giải — nếu không, nộp bừa là cách xem đáp án.
    expect(data).not.toHaveProperty('solutionPreview')
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
})
