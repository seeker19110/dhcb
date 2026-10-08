import { beforeEach, describe, expect, it, vi } from 'vitest'

const authState: { user: { userId: string } | null } = {
  user: { userId: 'user-1' },
}
let rateLimitOk = true

vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => rateLimitOk,
  validateAuth: async () => authState.user,
  logSecurityEvent: () => {},
}))

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: () => ({}) }))

const getOrCreatePerson = vi.fn()
vi.mock('@dhcb/core-personal/personService', () => ({
  getOrCreatePerson: (...a: unknown[]) => getOrCreatePerson(...a),
}))

import handler from './scenario-holodeck.js'

const PERSON = '11111111-1111-4111-8111-111111111111'

function req(method: string, body?: unknown, searchParams?: string) {
  const url = searchParams
    ? `http://localhost/api/scenario-holodeck?${searchParams}`
    : 'http://localhost/api/scenario-holodeck'
  return new Request(url, {
    method,
    ...(body === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  })
}

describe('api/scenario-holodeck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.user = { userId: 'user-1' }
    rateLimitOk = true
    getOrCreatePerson.mockResolvedValue({ id: PERSON })
  })

  it('handles GET list of scenarios', async () => {
    const res = await handler(req('GET'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.scenarios).toBeDefined()
    expect(data.scenarios.length).toBeGreaterThan(0)
  })

  it('handles POST start, turn and finalize', async () => {
    // 1. Start session
    const startRes = await handler(
      req('POST', { action: 'start', scenarioId: 'bigtech_panel_interview' }),
    )
    expect(startRes.status).toBe(201)
    const startData = await startRes.json()
    const sessionId = startData.session.sessionId

    // 2. Process turn
    const turnRes = await handler(
      req('POST', {
        action: 'turn',
        sessionId,
        utterance: 'We migrated the database with zero downtime using dual writes.',
      }),
    )
    expect(turnRes.status).toBe(200)
    const turnData = await turnRes.json()
    expect(turnData.personaReplyTurn).toBeDefined()

    // 3. Finalize session
    const finalRes = await handler(req('POST', { action: 'finalize', sessionId }))
    expect(finalRes.status).toBe(200)
    const finalData = await finalRes.json()
    expect(finalData.session.status).toBe('completed')
    expect(finalData.session.finalRubric).toBeDefined()
  })

  it('returns 401 when unauthorized', async () => {
    authState.user = null
    const res = await handler(req('GET'))
    expect(res.status).toBe(401)
  })

  it('handles OPTIONS (204) and rate limiting (429)', async () => {
    const resOpt = await handler(req('OPTIONS'))
    expect(resOpt.status).toBe(204)

    rateLimitOk = false
    const resRate = await handler(req('GET'))
    expect(resRate.status).toBe(429)
  })

  it('handles GET specific sessionId (found vs 404)', async () => {
    // Start session first
    const startRes = await handler(req('POST', { action: 'start', scenarioId: 'silicon_vc_pitch' }))
    const sessionId = (await startRes.json()).session.sessionId

    // Found
    const resFound = await handler(req('GET', undefined, `sessionId=${sessionId}`))
    expect(resFound.status).toBe(200)

    // Not found
    const resNotFound = await handler(req('GET', undefined, 'sessionId=non-existent-session'))
    expect(resNotFound.status).toBe(404)
  })

  it('handles bad json, validation errors and method not allowed', async () => {
    // Bad JSON
    const resBadJson = await handler(
      new Request('http://localhost/api/scenario-holodeck', {
        method: 'POST',
        body: 'invalid-json',
      }),
    )
    expect(resBadJson.status).toBe(400)

    // Missing scenarioId in start
    const resStartBad = await handler(req('POST', { action: 'start' }))
    expect(resStartBad.status).toBe(400)

    // Missing utterance in turn
    const resTurnBad = await handler(req('POST', { action: 'turn', sessionId: 's1' }))
    expect(resTurnBad.status).toBe(400)

    // Missing sessionId in finalize
    const resFinBad = await handler(req('POST', { action: 'finalize' }))
    expect(resFinBad.status).toBe(400)

    // Invalid action
    const resActionBad = await handler(req('POST', { action: 'unknown' }))
    expect(resActionBad.status).toBe(400)

    // Method not allowed
    const resDel = await handler(req('DELETE'))
    expect(resDel.status).toBe(405)
  })

  // ── Kiểm soát truy cập (audit 2026-10-08): phiên chỉ thuộc về người đã tạo nó ──
  describe('user B không đọc/ghi/kết thúc được phiên của user A', () => {
    const PERSON_B = '22222222-2222-4222-8222-222222222222'

    async function startAsA(): Promise<string> {
      const res = await handler(req('POST', { action: 'start', scenarioId: 'silicon_vc_pitch' }))
      return ((await res.json()) as { session: { sessionId: string } }).session.sessionId
    }

    it('GET sessionId của A bằng tài khoản B → 404, không lộ hội thoại', async () => {
      const sessionId = await startAsA()
      getOrCreatePerson.mockResolvedValueOnce({ id: PERSON_B })
      const res = await handler(req('GET', undefined, `sessionId=${sessionId}`))
      expect(res.status).toBe(404)
      const body = (await res.json()) as Record<string, unknown>
      expect(body.session).toBeUndefined()
    })

    it('POST turn vào phiên của A bằng tài khoản B → 404, phiên A không đổi', async () => {
      const sessionId = await startAsA()
      getOrCreatePerson.mockResolvedValueOnce({ id: PERSON_B })
      const res = await handler(
        req('POST', { action: 'turn', sessionId, utterance: 'Chen ngang phiên người khác' }),
      )
      expect(res.status).toBe(404)
      const own = await handler(req('GET', undefined, `sessionId=${sessionId}`))
      const data = (await own.json()) as { session: { turns: unknown[] } }
      expect(data.session.turns).toHaveLength(1)
    })

    it('POST finalize phiên của A bằng tài khoản B → 404, phiên A vẫn active', async () => {
      const sessionId = await startAsA()
      getOrCreatePerson.mockResolvedValueOnce({ id: PERSON_B })
      const res = await handler(req('POST', { action: 'finalize', sessionId }))
      expect(res.status).toBe(404)
      const own = await handler(req('GET', undefined, `sessionId=${sessionId}`))
      const data = (await own.json()) as { session: { status: string } }
      expect(data.session.status).toBe('active')
    })
  })
})
