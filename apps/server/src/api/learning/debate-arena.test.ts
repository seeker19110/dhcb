// api/debate-arena.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './debate-arena.js'
import * as security from '@dhcb/core-auth/security'
import * as usage from '@dhcb/core-billing/usage'
import { generateChatText } from '@dhcb/core-ai/chatFallback'

// Không gọi provider thật, kể cả khi môi trường máy chạy có cấu hình AI.
vi.mock('@dhcb/core-ai/chatFallback', () => ({ generateChatText: vi.fn() }))

// Handler đã chuyển state sang platform.feature_state — mock bằng Map in-memory (hành vi giống
// hệt Map cấp module cũ: state sống suốt file test), theo đúng khuôn pvp-arena.test.ts.
const featureStore = new Map<string, unknown>()
vi.mock('@dhcb/core-db/featureState', () => ({
  getFeatureState: vi.fn(async (u: string, f: string) => featureStore.get(u + '|' + f) ?? null),
  setFeatureState: vi.fn(async (u: string, f: string, st: unknown) => {
    featureStore.set(u + '|' + f, st)
  }),
}))

describe('Debate Arena API Handler (/api/debate-arena)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    featureStore.clear()
    vi.spyOn(usage, 'checkAndConsumeUsage').mockResolvedValue({ ok: true, day: '2026-09-27' })
    vi.spyOn(usage, 'refundUsage').mockResolvedValue(undefined)
    vi.mocked(generateChatText)
      .mockReset()
      .mockResolvedValue('Audits need clear evidence because their impact depends on enforcement.')
  })

  it('rejects unauthorized requests with 401', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/debate-arena', {
      method: 'GET',
    })

    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  it('returns sample topics on GET with 200', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    const req = new Request('http://localhost/api/debate-arena', {
      method: 'GET',
    })

    const res = await handler(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.topics.length).toBeGreaterThan(0)
  })

  it('creates debate session and submits user turn on POST', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    // 1. Create session
    const createReq = new Request('http://localhost/api/debate-arena?action=create_session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          topicId: 'ai-ethics',
          motion: 'AI systems must undergo mandatory ethical auditing.',
          category: 'technology',
          userStance: 'support',
          difficulty: 'advanced_c1',
          maxRounds: 4,
        },
      }),
    })

    const createRes = await handler(createReq)
    expect(createRes.status).toBe(200)
    const sessionData = await createRes.json()
    expect(sessionData.success).toBe(true)
    const sessionId = sessionData.session.id

    // 2. Submit turn
    const turnReq = new Request('http://localhost/api/debate-arena?action=submit_turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        content:
          'It is paramount to mandate audits because unaligned systems pose existential risks. Therefore, accountability is indispensable.',
      }),
    })

    const turnRes = await handler(turnReq)
    expect(turnRes.status).toBe(200)
    const turnData = await turnRes.json()
    expect(turnData.success).toBe(true)
    expect(turnData.userTurn).toBeDefined()
    expect(turnData.aiTurn).toBeDefined()
    expect(turnData.session.turns.length).toBeGreaterThanOrEqual(2)
    expect(usage.checkAndConsumeUsage).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      'chat',
    )
    expect(generateChatText).toHaveBeenCalledOnce()
    expect(usage.refundUsage).not.toHaveBeenCalled()
  })

  it('handles OPTIONS request with 204', async () => {
    const res = await handler(
      new Request('http://localhost/api/debate-arena', { method: 'OPTIONS' }),
    )
    expect(res.status).toBe(204)
  })

  it('handles GET specific sessionId (found and not found)', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    // Not found
    const notFoundRes = await handler(
      new Request('http://localhost/api/debate-arena?sessionId=non-existent', { method: 'GET' }),
    )
    expect(notFoundRes.status).toBe(404)

    // Create session first
    const createReq = new Request('http://localhost/api/debate-arena?action=create_session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          topicId: 'ubi',
          motion: 'UBI is essential',
          category: 'economics',
          userStance: 'support',
          difficulty: 'advanced_c1',
          maxRounds: 1,
        },
      }),
    })
    const createRes = await handler(createReq)
    const { session } = await createRes.json()

    // Found
    const foundRes = await handler(
      new Request(`http://localhost/api/debate-arena?sessionId=${session.id}`, { method: 'GET' }),
    )
    expect(foundRes.status).toBe(200)
  })

  it('validates invalid actions and missing parameters in POST', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    // Missing config
    const badConfigRes = await handler(
      new Request('http://localhost/api/debate-arena?action=create_session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )
    expect(badConfigRes.status).toBe(400)

    // Missing content in submit_turn
    const badTurnRes = await handler(
      new Request('http://localhost/api/debate-arena?action=submit_turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 's1' }),
      }),
    )
    expect(badTurnRes.status).toBe(400)

    // Submit turn with fallback session creation
    const fallbackRes = await handler(
      new Request('http://localhost/api/debate-arena?action=submit_turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'fallback-session-123', content: 'Arguments' }),
      }),
    )
    expect(fallbackRes.status).toBe(200)

    // Evaluate match not found vs found
    const notFoundEval = await handler(
      new Request('http://localhost/api/debate-arena?action=evaluate_match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'nonexistent' }),
      }),
    )
    expect(notFoundEval.status).toBe(404)

    const foundEval = await handler(
      new Request('http://localhost/api/debate-arena?action=evaluate_match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'fallback-session-123' }),
      }),
    )
    expect(foundEval.status).toBe(200)

    // Invalid action
    const invalidActionRes = await handler(
      new Request('http://localhost/api/debate-arena?action=unknown_action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )
    expect(invalidActionRes.status).toBe(400)

    // Invalid method
    const methodNotAllowed = await handler(
      new Request('http://localhost/api/debate-arena', { method: 'DELETE' }),
    )
    expect(methodNotAllowed.status).toBe(405)
  })

  it('trả 429 khi vượt rate limit', async () => {
    vi.spyOn(security, 'checkRateLimit').mockResolvedValueOnce(false)
    const res = await handler(new Request('http://localhost/api/debate-arena', { method: 'GET' }))
    expect(res.status).toBe(429)
  })

  it('trả 400 khi body POST không phải JSON hợp lệ', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const res = await handler(
      new Request('http://localhost/api/debate-arena?action=create_session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid-json',
      }),
    )
    expect(res.status).toBe(400)
  })

  it('kết thúc trận đấu và chấm điểm khi vượt số round tối đa (maxRounds=0)', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    const createReq = new Request('http://localhost/api/debate-arena?action=create_session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          topicId: 'ai-ethics',
          motion: 'Motion kết thúc ngay',
          category: 'technology',
          userStance: 'support',
          difficulty: 'advanced_c1',
          maxRounds: 0,
        },
      }),
    })
    const createRes = await handler(createReq)
    const { session } = await createRes.json()

    const turnReq = new Request('http://localhost/api/debate-arena?action=submit_turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id, content: 'Lập luận kết thúc trận' }),
    })
    const turnRes = await handler(turnReq)
    expect(turnRes.status).toBe(200)
    const turnData = await turnRes.json()
    expect(turnData.session.status).toBe('completed')
    expect(turnData.session.finalRubric).toBeDefined()
  })

  it('trả 429 khi hết lượt dùng chat (usage gate) lúc submit_turn', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    vi.spyOn(usage, 'checkAndConsumeUsage').mockResolvedValueOnce({
      ok: false,
      message: 'Hết lượt chat hôm nay',
    })

    const createReq = new Request('http://localhost/api/debate-arena?action=create_session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          topicId: 'ai-ethics',
          motion: 'Motion hết lượt',
          category: 'technology',
          userStance: 'support',
          difficulty: 'advanced_c1',
          maxRounds: 4,
        },
      }),
    })
    const createRes = await handler(createReq)
    const { session } = await createRes.json()

    const turnRes = await handler(
      new Request('http://localhost/api/debate-arena?action=submit_turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, content: 'Lập luận' }),
      }),
    )
    expect(turnRes.status).toBe(429)
    expect(generateChatText).not.toHaveBeenCalled()
    expect(usage.refundUsage).not.toHaveBeenCalled()
  })

  it('hoàn đúng lượt đã trừ khi provider không trả được câu trả lời', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    vi.mocked(generateChatText).mockResolvedValueOnce(null)

    const response = await handler(
      new Request('http://localhost/api/debate-arena?action=submit_turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'provider-unavailable', content: 'Lập luận' }),
      }),
    )

    expect(response.status).toBe(200)
    expect((await response.json()).aiTurn.isFallback).toBe(true)
    expect(usage.refundUsage).toHaveBeenCalledExactlyOnceWith(
      '11111111-1111-4111-8111-111111111111',
      'chat',
      '2026-09-27',
    )
  })

  it('sinh câu hỏi socratic moderator khi đủ 4 lượt trong vòng', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    const createReq = new Request('http://localhost/api/debate-arena?action=create_session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          topicId: 'ai-ethics',
          motion: 'Motion nhiều vòng',
          category: 'technology',
          userStance: 'support',
          difficulty: 'advanced_c1',
          maxRounds: 10,
        },
      }),
    })
    const createRes = await handler(createReq)
    const { session } = await createRes.json()

    // Mỗi submit_turn thêm 2 lượt (user + AI) — lượt thứ 2 (tổng 4 lượt) sẽ kích hoạt moderator.
    await handler(
      new Request('http://localhost/api/debate-arena?action=submit_turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, content: 'Lập luận vòng 1' }),
      }),
    )
    const secondTurnRes = await handler(
      new Request('http://localhost/api/debate-arena?action=submit_turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, content: 'Lập luận vòng 2' }),
      }),
    )
    expect(secondTurnRes.status).toBe(200)
    const data = await secondTurnRes.json()
    expect(data.session.turns.length).toBeGreaterThanOrEqual(4)
    expect(data.session.currentRound).toBeGreaterThanOrEqual(2)
  })

  it("cắt bớt phiên khi có bản ghi thiếu updatedAt (nhánh fallback ?? '')", async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const USER = '11111111-1111-4111-8111-111111111111'
    // Cấy sẵn 20 phiên KHÔNG có updatedAt để buộc nhánh `?? ''` trong comparator sort chạy khi
    // trim — dữ liệu cũ/hỏng trong thực tế có thể thiếu trường này.
    const seeded: Record<string, unknown> = {}
    for (let i = 0; i < 20; i++) {
      seeded[`legacy-${i}`] = { id: `legacy-${i}` }
    }
    featureStore.set(USER + '|debate_arena', seeded)

    const res = await handler(
      new Request('http://localhost/api/debate-arena?action=create_session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            topicId: 'ai-ethics',
            motion: 'Motion vượt trần',
            category: 'technology',
            userStance: 'support',
            difficulty: 'advanced_c1',
            maxRounds: 4,
          },
        }),
      }),
    )
    expect(res.status).toBe(200)
  })

  it('evaluate_match không truyền sessionId → 404 (nhánh sessionId falsy)', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const res = await handler(
      new Request('http://localhost/api/debate-arena?action=evaluate_match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )
    expect(res.status).toBe(404)
  })

  it('submit_turn với userStance "oppose" → đối thủ AI đứng vai affirmative', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const createReq = new Request('http://localhost/api/debate-arena?action=create_session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          topicId: 'ai-ethics',
          motion: 'Motion phản đối',
          category: 'technology',
          userStance: 'oppose',
          difficulty: 'advanced_c1',
          maxRounds: 4,
        },
      }),
    })
    const createRes = await handler(createReq)
    const { session } = await createRes.json()

    const turnRes = await handler(
      new Request('http://localhost/api/debate-arena?action=submit_turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, content: 'Lập luận phản đối' }),
      }),
    )
    expect(turnRes.status).toBe(200)
  })

  it('cắt bớt phiên cũ nhất khi vượt trần MAX_SESSIONS (20 phiên/người)', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    // Fake timer để mỗi phiên có updatedAt phân biệt rõ ràng (tránh localeCompare hoà khi trùng ms).
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))

    let firstSessionId = ''
    try {
      for (let i = 0; i < 21; i++) {
        const res = await handler(
          new Request('http://localhost/api/debate-arena?action=create_session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              config: {
                topicId: `topic-${i}`,
                motion: `Motion số ${i}`,
                category: 'technology',
                userStance: 'support',
                difficulty: 'advanced_c1',
                maxRounds: 4,
              },
            }),
          }),
        )
        const data = await res.json()
        if (i === 0) firstSessionId = data.session.id
        vi.setSystemTime(new Date(Date.now() + 1000))
      }
    } finally {
      vi.useRealTimers()
    }

    const notFoundRes = await handler(
      new Request(`http://localhost/api/debate-arena?sessionId=${firstSessionId}`, {
        method: 'GET',
      }),
    )
    expect(notFoundRes.status).toBe(404)
  })
})
