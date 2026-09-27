import { Pool, Client } from 'pg'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NeuralCurriculumStateSchema } from '@dhcb/core-contracts/neuralCurriculum'
vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
vi.mock('@dhcb/core-auth/security', () => ({ validateAuth: vi.fn(), getCorsHeaders: () => ({}) }))
import { getPgPool } from '@dhcb/core-db/pgPool'
import { validateAuth } from '@dhcb/core-auth/security'
import handler from './neural-curriculum.js'

const USER = '11111111-1111-4111-8111-111111111111'
const store = new Map<string, unknown>()
let failWrite = false
let lockTail: Promise<void>
const request = (action?: string, body?: unknown) =>
  new Request(
    `http://localhost/api/neural-curriculum${action ? `?action=${action}` : ''}`,
    body === undefined
      ? {}
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
  )
async function loadState() {
  const response = await handler(request())
  expect(response.status).toBe(200)
  return NeuralCurriculumStateSchema.parse((await response.json()).state)
}
async function submission(correct = true) {
  const state = await loadState()
  const module = state.modules[0]!
  return {
    moduleId: module.moduleId,
    answers: module.drills.map((drill) => ({
      drillId: drill.id,
      answer: correct
        ? drill.correctAnswer
        : drill.options.find((option) => option !== drill.correctAnswer)!,
    })),
  }
}

beforeEach(() => {
  store.clear()
  failWrite = false
  lockTail = Promise.resolve()
  vi.mocked(validateAuth).mockResolvedValue({ userId: USER })
  const connect = vi.fn(async () => {
    let staged: unknown
    let key = ''
    let unlock: (() => void) | undefined
    const query = vi.fn(async (sql: string, params?: unknown[]) => {
      if (sql.startsWith('insert into')) {
        const previous = lockTail
        lockTail = new Promise<void>((resolve) => {
          unlock = resolve
        })
        await previous
        key = `${params?.[0]}|${params?.[1]}`
        staged = structuredClone(store.get(key) ?? JSON.parse(String(params?.[2])))
      } else if (sql.startsWith('select state')) {
        expect(sql).toContain('for update')
        return { rows: [{ state: staged }] }
      } else if (sql.startsWith('update platform')) {
        if (failWrite) {
          failWrite = false
          throw new Error('write failure')
        }
        staged = JSON.parse(String(params?.[2]))
      } else if (sql === 'commit') {
        store.set(key, structuredClone(staged))
        unlock?.()
      } else if (sql === 'rollback') unlock?.()
      return { rows: [] }
    })
    return Object.assign(new Client(), { query, release: vi.fn() })
  })
  vi.mocked(getPgPool).mockReturnValue(Object.assign(new Pool(), { connect }))
})

describe('Neural curriculum — máy chủ sở hữu điểm và câu hỏi', () => {
  it('yêu cầu xác thực, hỗ trợ OPTIONS và từ chối method khác', async () => {
    expect(
      (await handler(new Request('http://localhost/api/neural-curriculum', { method: 'OPTIONS' })))
        .status,
    ).toBe(204)
    expect(
      (await handler(new Request('http://localhost/api/neural-curriculum', { method: 'DELETE' })))
        .status,
    ).toBe(405)
    vi.mocked(validateAuth).mockResolvedValueOnce(null)
    expect((await handler(request())).status).toBe(401)
  })
  it('bỏ qua namespace cũ có điểm/đáp án từng cho client ghi', async () => {
    store.set(`${USER}|neural_curriculum`, {
      masteryScore: 100,
      modules: [{ correctAnswer: 'hacked' }],
    })
    const state = await loadState()
    expect(state.masteryScore).toBe(0)
    expect(state.modules[0]?.drills[0]?.correctAnswer).toBe('bridge')
  })
  it('từ chối toàn state và isCorrect do client tự khai', async () => {
    expect((await handler(request('', { masteryScore: 100, modules: [] }))).status).toBe(400)
    expect(
      (await handler(request('complete_drill', { isCorrect: true, previousInterval: 20 }))).status,
    ).toBe(400)
  })
  it('generate validate domain/CEFR và tạo bài riêng bằng UUID', async () => {
    expect((await handler(request('generate_module', { targetDomain: 'admin' }))).status).toBe(400)
    const response = await handler(
      request('generate_module', { topicOrKeyword: 'Thuyết Trình', targetDomain: 'career' }),
    )
    expect(response.status).toBe(200)
    expect((await response.json()).module.title).toContain('Thuyết Trình')
  })
  it('chấm đáp án sai, không dùng kết quả Boolean của client', async () => {
    const response = await handler(request('complete_drill', await submission(false)))
    const data = await response.json()
    expect(data.review.correctCount).toBe(0)
    expect(data.state.masteryScore).toBe(0)
  })
  it('từ chối thiếu câu, ID trùng, ID lạ, lựa chọn lạ và module ngoài tài khoản', async () => {
    const body = await submission()
    for (const invalid of [
      { ...body, answers: body.answers.slice(1) },
      { ...body, answers: body.answers.map(() => body.answers[0]) },
      { ...body, answers: body.answers.map((answer) => ({ ...answer, drillId: USER })) },
      { ...body, answers: body.answers.map((answer) => ({ ...answer, answer: 'injected' })) },
    ])
      expect((await handler(request('complete_drill', invalid))).status).toBe(400)
    expect(
      (
        await handler(
          request('complete_drill', { ...body, moduleId: '22222222-2222-4222-8222-222222222222' }),
        )
      ).status,
    ).toBe(404)
  })
  it('hai lần nộp đồng thời + retry chỉ ghi tiến bộ một lần, vẫn ôn lại được', async () => {
    const body = await submission()
    const responses = await Promise.all([
      handler(request('complete_drill', body)),
      handler(request('complete_drill', body)),
    ])
    const results = await Promise.all(responses.map((response) => response.json()))
    expect(results.map((result) => result.review.masteryDelta).sort()).toEqual([0, 15])
    expect((await loadState()).masteryScore).toBe(15)
    const repeated = await (await handler(request('complete_drill', body))).json()
    expect(repeated.review.correctCount).toBe(3)
    expect(repeated.review.recorded).toBe(false)
    expect(repeated.review.masteryDelta).toBe(0)
  })
  it('lỗi ghi rollback, nộp lại còn ghi tiến bộ được', async () => {
    const body = await submission()
    failWrite = true
    expect((await handler(request('complete_drill', body))).status).toBe(503)
    expect((await loadState()).masteryScore).toBe(0)
    const retry = await (await handler(request('complete_drill', body))).json()
    expect(retry.review.masteryDelta).toBe(15)
  })
  it('tạo module mới có cùng câu hỏi không cộng điểm lặp', async () => {
    await handler(request('complete_drill', await submission()))
    await handler(request('generate_module', { topicOrKeyword: 'Chủ đề khác' }))
    const repeated = await (await handler(request('complete_drill', await submission()))).json()
    expect(repeated.review.masteryDelta).toBe(0)
    expect(repeated.state.masteryScore).toBe(15)
  })
})
