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

const twoFactor = vi.hoisted(() => ({ getTwoFactorStatus: vi.fn(), hasStepUp: vi.fn() }))
vi.mock('@dhcb/core-auth/twoFactor', () => twoFactor)

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: () => ({}) }))

const getOrCreatePerson = vi.fn()
vi.mock('@dhcb/core-personal/personService', () => ({
  getOrCreatePerson: (...a: unknown[]) => getOrCreatePerson(...a),
}))

const runtime = vi.hoisted(() => ({
  executeCompanionTurn: vi.fn(),
  streamCompanionTurn: vi.fn(),
}))

vi.mock('@dhcb/core-personal/companionRuntime', () => ({
  executeCompanionTurn: (...a: unknown[]) => runtime.executeCompanionTurn(...a),
  streamCompanionTurn: (...a: unknown[]) => runtime.streamCompanionTurn(...a),
}))

const messageService = vi.hoisted(() => ({
  listRecentCompanionMessages: vi.fn(),
}))

// Đếm lượt: mock để khẳng định được đường GET (đọc lịch sử) KHÔNG tiêu hạn mức của người dùng.
const usageMock = vi.hoisted(() => ({
  checkAndConsumeUsage: vi.fn(),
  refundUsage: vi.fn(),
}))

vi.mock('@dhcb/core-billing/usage', () => ({
  checkAndConsumeUsage: (...a: unknown[]) => usageMock.checkAndConsumeUsage(...a),
  refundUsage: (...a: unknown[]) => usageMock.refundUsage(...a),
}))

vi.mock('@dhcb/core-personal/companionMessageService', () => ({
  listRecentCompanionMessages: (...a: unknown[]) =>
    messageService.listRecentCompanionMessages(...a),
  COMPANION_HISTORY_PAGE_SIZE: 50,
}))

import handler from './companion.js'

const PERSON = '11111111-1111-4111-8111-111111111111'
const CTX_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

function req(method: string, body?: unknown) {
  return new Request('http://localhost/api/companion', {
    method,
    ...(body === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  twoFactor.getTwoFactorStatus.mockResolvedValue({ enabled: false })
  twoFactor.hasStepUp.mockResolvedValue(false)
  authState.user = { userId: 'user-1' }
  rateLimitOk = true
  usageMock.checkAndConsumeUsage.mockResolvedValue({ ok: true, day: '2026-08-25' })
  usageMock.refundUsage.mockResolvedValue(undefined)
  getOrCreatePerson.mockResolvedValue({ id: PERSON })
  runtime.executeCompanionTurn.mockResolvedValue({
    reply: 'Xin chào!',
    intent: 'general_conversation',
    targetDomain: 'learning',
    contextPackage: {
      id: CTX_ID,
      personId: PERSON,
      requestId: 'req-1',
      items: [],
      tokenBudget: 2000,
      tokenUsed: 0,
      createdAt: new Date().toISOString(),
      schemaVersion: 1,
    },
    proposedActions: [],
    executionSummary: {
      plannedSteps: 0,
      executedSteps: 0,
      pendingConfirmationSteps: 0,
      rejectedSteps: 0,
    },
    isFallback: false,
  })
})

describe('auth, rate limit and validation for /api/companion', () => {
  it('OPTIONS -> 204', async () => {
    const res = await handler(req('OPTIONS'))
    expect(res.status).toBe(204)
  })

  it('rejects unsupported methods with 405', async () => {
    // GET nay là đường đọc lịch sử hội thoại (hợp lệ) — dùng PUT để kiểm nhánh 405.
    const res = await handler(req('PUT'))
    expect(res.status).toBe(405)
  })

  it('rate limit exceeded -> 429', async () => {
    rateLimitOk = false
    const res = await handler(req('POST', { message: 'hi' }))
    expect(res.status).toBe(429)
  })

  it('unauthenticated -> 401', async () => {
    authState.user = null
    const res = await handler(req('POST', { message: 'hi' }))
    expect(res.status).toBe(401)
  })

  it('rejects empty message with 400', async () => {
    const res = await handler(req('POST', { message: '' }))
    expect(res.status).toBe(400)
  })
})

describe('POST /api/companion execution', () => {
  it('successfully processes companion turn', async () => {
    const res = await handler(
      req('POST', {
        message: 'Tôi muốn học từ vựng IELTS',
        intent: 'set_learning_goal',
        domain: 'learning',
        tokenBudget: 3000,
      }),
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.reply).toBe('Xin chào!')
    expect(runtime.executeCompanionTurn).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        personId: PERSON,
        userMessage: 'Tôi muốn học từ vựng IELTS',
        intent: 'set_learning_goal',
        targetDomain: 'learning',
        tokenBudget: 3000,
      }),
    )
  })
})

describe('POST /api/companion — câu mẫu dự phòng (mọi nhà cung cấp AI lỗi)', () => {
  it('AI trả lời thật → KHÔNG hoàn lượt', async () => {
    const res = await handler(req('POST', { message: 'hi' }))
    expect(res.status).toBe(200)
    expect(usageMock.refundUsage).not.toHaveBeenCalled()
  })

  it('isFallback → vẫn 200 nhưng HOÀN lượt đúng ngày đã trừ', async () => {
    const base = (await runtime.executeCompanionTurn()) as Record<string, unknown>
    runtime.executeCompanionTurn.mockResolvedValueOnce({ ...base, isFallback: true })
    const res = await handler(req('POST', { message: 'hi' }))
    expect(res.status).toBe(200)
    expect(usageMock.refundUsage).toHaveBeenCalledTimes(1)
    expect(usageMock.refundUsage).toHaveBeenCalledWith('user-1', 'chat', '2026-08-25')
  })

  it('stream: sự kiện done mang isFallback → hoàn lượt ĐÚNG MỘT lần', async () => {
    const base = (await runtime.executeCompanionTurn()) as Record<string, unknown>
    runtime.streamCompanionTurn.mockImplementationOnce(async function* () {
      yield { type: 'done', data: { ...base, isFallback: true } }
    })
    const res = await handler(req('POST', { message: 'hi', stream: true }))
    await res.text()
    expect(usageMock.refundUsage).toHaveBeenCalledTimes(1)
  })

  it('stream lỗi không phải AppError → client KHÔNG nhận thông điệp nội bộ', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    runtime.streamCompanionTurn.mockImplementationOnce(async function* () {
      yield* []
      throw new Error('connect ECONNREFUSED 10.0.0.5:5432')
    })
    const res = await handler(req('POST', { message: 'hi', stream: true }))
    const body = await res.text()
    expect(body).toContain('event: error')
    expect(body).not.toContain('ECONNREFUSED')
    expect(usageMock.refundUsage).toHaveBeenCalledTimes(1)
    error.mockRestore()
  })
})

describe('GET /api/companion — lịch sử hội thoại', () => {
  it('trả về các tin nhắn đã lưu', async () => {
    messageService.listRecentCompanionMessages.mockResolvedValue([
      { id: 'm1', role: 'user', content: 'Tôi là Kẻ Tìm Kiếm', createdAt: '2026-08-25T10:00:00Z' },
    ])

    const res = await handler(req('GET'))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { messages: Array<{ content: string }> }
    expect(body.messages).toHaveLength(1)
    expect(body.messages[0]?.content).toBe('Tôi là Kẻ Tìm Kiếm')
  })

  it('KHÔNG đếm lượt — đọc lịch sử không gọi model AI nên không được tốn hạn mức', async () => {
    messageService.listRecentCompanionMessages.mockResolvedValue([])
    await handler(req('GET'))
    expect(usageMock.checkAndConsumeUsage).not.toHaveBeenCalled()
  })

  it('chưa đăng nhập → 401, không đọc dữ liệu của ai cả', async () => {
    authState.user = null
    const res = await handler(req('GET'))
    expect(res.status).toBe(401)
    expect(messageService.listRecentCompanionMessages).not.toHaveBeenCalled()
  })

  it('lỗi DB → 500, không trả mảng rỗng giả vờ "chưa có hội thoại"', async () => {
    messageService.listRecentCompanionMessages.mockRejectedValue(new Error('DB sập'))
    const res = await handler(req('GET'))
    expect(res.status).toBe(500)
  })
})

describe('cổng dữ liệu T2 Companion', () => {
  it('chưa bật 2FA vẫn chat, chỉ nạp context tối đa personal', async () => {
    expect((await handler(req('POST', { message: 'hello' }))).status).toBe(200)
    expect(runtime.executeCompanionTurn).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ maxSensitivity: 'personal' }),
    )
  })
  it('đã bật nhưng phiên hết hạn vẫn chỉ nạp personal', async () => {
    twoFactor.getTwoFactorStatus.mockResolvedValue({ enabled: true })
    await handler(req('POST', { message: 'hello' }))
    expect(runtime.executeCompanionTurn).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ maxSensitivity: 'personal' }),
    )
  })
  it('phiên 2FA còn hiệu lực được nạp sensitive', async () => {
    twoFactor.getTwoFactorStatus.mockResolvedValue({ enabled: true })
    twoFactor.hasStepUp.mockResolvedValue(true)
    await handler(req('POST', { message: 'hello' }))
    expect(runtime.executeCompanionTurn).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ maxSensitivity: 'sensitive' }),
    )
  })
  it('người gọi không thể tự nâng maxSensitivity từ request', async () => {
    const response = await handler(req('POST', { message: 'hello', maxSensitivity: 'restricted' }))
    expect(response.status).toBe(400)
    expect(runtime.executeCompanionTurn).not.toHaveBeenCalled()
  })
  it('GET lịch sử lọc T2 ở service khi chưa step-up', async () => {
    messageService.listRecentCompanionMessages.mockResolvedValue([])
    await handler(req('GET'))
    expect(messageService.listRecentCompanionMessages).toHaveBeenCalledWith(
      expect.anything(),
      PERSON,
      50,
      undefined,
      'personal',
    )
  })
  it('GET lịch sử sau step-up cho đọc mọi sensitivity của chính chủ', async () => {
    twoFactor.getTwoFactorStatus.mockResolvedValue({ enabled: true })
    twoFactor.hasStepUp.mockResolvedValue(true)
    messageService.listRecentCompanionMessages.mockResolvedValue([])
    await handler(req('GET'))
    expect(messageService.listRecentCompanionMessages).toHaveBeenCalledWith(
      expect.anything(),
      PERSON,
      50,
      undefined,
      'restricted',
    )
  })
  it('JSON không trả raw context dù runtime có dữ liệu T2', async () => {
    runtime.executeCompanionTurn.mockResolvedValue({
      reply: 'hi',
      contextPackage: { items: [{ content: 'PRIVATE_CONTEXT' }], tokenUsed: 4 },
    })
    const response = await handler(req('POST', { message: 'hello' }))
    expect(await response.text()).not.toContain('PRIVATE_CONTEXT')
  })
  it('SSE meta không trả raw context', async () => {
    runtime.streamCompanionTurn.mockImplementation(async function* () {
      yield {
        type: 'meta',
        data: {
          intent: 'general',
          targetDomain: 'learning',
          contextPackage: { items: [{ content: 'PRIVATE_CONTEXT' }], tokenUsed: 4 },
        },
      }
      yield { type: 'reply_delta', data: { text: 'hello' } }
    })
    const response = await handler(req('POST', { message: 'hello', stream: true }))
    const text = await response.text()
    expect(text).toContain('event: meta')
    expect(text).toContain('hello')
    expect(text).not.toContain('PRIVATE_CONTEXT')
  })
})
