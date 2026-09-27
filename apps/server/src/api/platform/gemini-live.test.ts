// api/gemini-live.test.ts — Tests cho REST handler gemini-live
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import handler from './gemini-live.js'
import {
  _resetGeminiLiveServiceStateForTests,
  createGeminiLiveSession,
  getGeminiLiveSession,
  GeminiLiveSession,
} from '@dhcb/core-ai/geminiLiveService'
import { _resetGeminiLiveAdmissionForTests } from '@dhcb/core-ai/geminiLiveAdmission'
import { checkAndConsumeUsage, refundUsage } from '@dhcb/core-billing/usage'

// Mock validateAuth
// Handler mới trừ 1 lượt 'speaking' mỗi phiên (vá N1) — mock cho qua, không đụng Postgres
vi.mock('@dhcb/core-billing/usage', () => ({
  checkAndConsumeUsage: vi.fn(async () => ({ ok: true, day: '2026-08-23' })),
  refundUsage: vi.fn(async () => {}),
}))

vi.mock('@dhcb/core-auth/security', () => ({
  validateAuth: vi.fn(async (req: Request) => {
    const authHeader = req.headers.get('Authorization')
    if (authHeader && authHeader.includes('valid-token')) {
      return { userId: 'user-live-123', email: 'live@example.com' }
    }
    return null
  }),
  getCorsHeaders: vi.fn().mockReturnValue({}),
  // Handler mới thêm rate limit + log (vá N1 2026-08-23) — mock cho qua
  checkRateLimit: vi.fn(async () => true),
  logSecurityEvent: vi.fn(),
}))

describe('api/gemini-live', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('GEMINI_API_KEY', '')
    _resetGeminiLiveServiceStateForTests()
    _resetGeminiLiveAdmissionForTests()
  })
  afterEach(() => {
    _resetGeminiLiveServiceStateForTests()
    _resetGeminiLiveAdmissionForTests()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('should return 401 if unauthenticated', async () => {
    const req = new Request('http://localhost/api/gemini-live', {
      method: 'GET',
    })
    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  it('should create a session via POST and get state via GET', async () => {
    // 1. Create session
    const createReq = new Request('http://localhost/api/gemini-live', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        voiceName: 'Aoede',
      }),
    })
    const createRes = await handler(createReq)
    expect(createRes.status).toBe(201)
    const createData = await createRes.json()
    expect(createData.success).toBe(true)
    const sessionId = createData.sessionId

    // 2. Get session
    const getReq = new Request(`http://localhost/api/gemini-live?sessionId=${sessionId}`, {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    })
    const getRes = await handler(getReq)
    expect(getRes.status).toBe(200)
    const getData = await getRes.json()
    expect(getData.sessionId).toBe(sessionId)

    // 3. Delete session
    const delReq = new Request(`http://localhost/api/gemini-live?sessionId=${sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer valid-token' },
    })
    const delRes = await handler(delReq)
    expect(delRes.status).toBe(200)
  })

  it('handles OPTIONS preflight', async () => {
    const req = new Request('http://localhost/api/gemini-live', { method: 'OPTIONS' })
    const res = await handler(req)
    expect(res.status).toBe(204)
  })

  it('rejects unsupported method', async () => {
    const req = new Request('http://localhost/api/gemini-live', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer valid-token' },
    })
    const res = await handler(req)
    expect(res.status).toBe(405)
  })

  it('rejects GET without sessionId', async () => {
    const req = new Request('http://localhost/api/gemini-live', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
  })

  it('404s GET for unknown sessionId', async () => {
    const req = new Request('http://localhost/api/gemini-live?sessionId=does-not-exist', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    })
    const res = await handler(req)
    expect(res.status).toBe(404)
  })

  it('rejects DELETE without sessionId', async () => {
    const req = new Request('http://localhost/api/gemini-live', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer valid-token' },
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
  })

  it('rejects invalid POST configuration', async () => {
    const req = new Request('http://localhost/api/gemini-live', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ voiceName: 12345 }),
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
    expect(checkAndConsumeUsage).not.toHaveBeenCalled()
  })

  it.each(['GET', 'DELETE'])(
    '%s không đọc hoặc đóng phiên người khác kể cả prefix giống nhau',
    async (method) => {
      const session = createGeminiLiveSession({
        sessionId: 'victim-session',
        personId: 'user-live-123-other',
      })
      const response = await handler(
        new Request('http://localhost/api/gemini-live?sessionId=victim-session', {
          method,
          headers: { Authorization: 'Bearer valid-token' },
        }),
      )
      expect(response.status).toBe(404)
      expect(getGeminiLiveSession('victim-session')).toBe(session)
      expect(session.getStatus()).toBe('idle')
    },
  )

  it('ID ngẫu nhiên server và config cho phép không bị client ghi đè', async () => {
    const victim = createGeminiLiveSession({ sessionId: 'victim-session', personId: 'victim' })
    const response = await handler(
      new Request('http://localhost/api/gemini-live', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'victim-session',
          personId: 'victim',
          model: 'expensive',
          sampleRate: 999999,
          systemInstruction: 'override',
          voiceName: 'Puck',
        }),
      }),
    )
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.sessionId).toMatch(/^live-[0-9a-f-]{36}$/)
    expect(body.config).toMatchObject({
      personId: 'user-live-123',
      voiceName: 'Puck',
      maxDurationSeconds: 600,
      sampleRate: 24000,
    })
    expect(body.config.model).not.toBe('expensive')
    expect(body.config.systemInstruction).toBeUndefined()
    expect(getGeminiLiveSession('victim-session')).toBe(victim)
  })

  it('từ chối kéo dài quá 600 giây trước khi trừ ngân sách', async () => {
    const response = await handler(
      new Request('http://localhost/api/gemini-live', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxDurationSeconds: 1800 }),
      }),
    )
    expect(response.status).toBe(400)
    expect(checkAndConsumeUsage).not.toHaveBeenCalled()
    expect(refundUsage).not.toHaveBeenCalled()
  })

  it('hai POST đồng thời chỉ tạo một phiên và tiêu thụ một lượt', async () => {
    const request = () =>
      new Request('http://localhost/api/gemini-live', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        body: '{}',
      })
    const responses = await Promise.all([handler(request()), handler(request())])
    expect(responses.map((r) => r.status).sort()).toEqual([201, 429])
    expect(checkAndConsumeUsage).toHaveBeenCalledExactlyOnceWith('user-live-123', 'speaking')
  })

  it('start đóng đồng bộ không báo 201 hoặc để interval revalidate mồ côi', async () => {
    vi.spyOn(GeminiLiveSession.prototype, 'start').mockImplementationOnce(function (
      this: GeminiLiveSession,
    ) {
      this.close('Startup failed')
    })
    const interval = vi.spyOn(globalThis, 'setInterval')
    const response = await handler(
      new Request('http://localhost/api/gemini-live', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
        body: '{}',
      }),
    )
    expect(response.status).toBe(503)
    expect(interval).not.toHaveBeenCalled()
    expect(refundUsage).toHaveBeenCalledExactlyOnceWith('user-live-123', 'speaking', '2026-08-23')
  })
})
