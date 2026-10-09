// Test handler /api/agent (api/ai.ts) — tập trung "đường đi của tiền" ở nhánh Groq:
// mọi nhánh lỗi sau khi ĐÃ TRỪ lượt (checkAndConsumeUsage) phải HOÀN lượt (refundUsage),
// kể cả khi Groq trả HTTP 200 nhưng body hỏng (không phải JSON / thiếu field) —
// trước đây các nhánh body-hỏng quên hoàn, người dùng mất lượt mà không có câu trả lời.
//
// Mock toàn bộ lớp ngoài (security/usage/fetch) để test OFFLINE, không cần DB/provider thật.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => true,
  validateAuth: async () => ({ userId: 'user-test' }),
  validateContentType: () => true,
  logSecurityEvent: () => {},
}))
vi.mock('@dhcb/core-billing/usage', () => ({
  checkAndConsumeUsage: vi.fn(async () => ({ ok: true as const, day: '2026-08-12' })),
  refundUsage: vi.fn(async () => {}),
}))
vi.mock('@dhcb/core-http/fetchTimeout', () => ({ fetchWithTimeout: vi.fn() }))
vi.mock('./geminiApi.js', () => ({ callGemini: vi.fn() }))
// Lớp gọi Claude test riêng ở anthropicClient.test.ts — ở đây chỉ canh handler đọc 4 dạng kết
// quả của nó để quyết fallback/hoàn lượt/status.
vi.mock('./anthropicClient.js', () => ({ callAnthropicText: vi.fn() }))

import handler from './ai.js'
import { refundUsage } from '@dhcb/core-billing/usage'
import { fetchWithTimeout } from '@dhcb/core-http/fetchTimeout'
import { callGemini } from './geminiApi.js'
import { callAnthropicText, type AnthropicTextResult } from './anthropicClient.js'
import { getGradingSchema } from './gradingSchemas.js'
import { SYSTEM_GUARDRAIL } from './aiConfig.js'

const mockedFetch = vi.mocked(fetchWithTimeout)
const mockedRefund = vi.mocked(refundUsage)
const mockedGemini = vi.mocked(callGemini)
const mockedAnthropic = vi.mocked(callAnthropicText)

const ANTHROPIC_OK: AnthropicTextResult = {
  kind: 'success',
  text: 'Hi from Claude',
  model: 'claude-haiku-5-5',
  usage: { promptTokens: 10, completionTokens: 5, cacheReadTokens: 0, cacheWriteTokens: 0 },
  latencyMs: 1,
}
const ANTHROPIC_DOWN: AnthropicTextResult = {
  kind: 'network_error',
  message: 'Hết thời gian chờ Anthropic',
  latencyMs: 1,
}
const GROQ_OK = () =>
  new Response(JSON.stringify({ choices: [{ message: { content: 'Từ Groq' } }] }), { status: 200 })

// Model handler đã yêu cầu ở lượt gọi Claude gần nhất.
function lastAnthropicModel(): string | undefined {
  return mockedAnthropic.mock.calls.at(-1)?.[0].route.model
}

// Request hợp lệ tối thiểu cho /api/agent — cho phép ghi đè body để test validate/sanitize.
function makeRequest(body?: object): Request {
  return new Request('http://localhost/api/agent', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: 'Bearer x' },
    body: JSON.stringify(body ?? { messages: [{ role: 'user', content: 'Hello' }], mode: 'chat' }),
  })
}

// Đọc lại body JSON handler gửi cho Groq (mockedFetch.mock.calls[0] = [url, options]).
function lastGroqRequestBody(): { max_tokens: number; messages: { content?: unknown }[] } {
  const options = mockedFetch.mock.calls[0]?.[1] as { body: string }
  return JSON.parse(options.body)
}

// Ép handler đi nhánh Groq: chỉ có GROQ_API_KEY, không có Gemini/Anthropic.
const ENV_KEYS = ['GEMINI_API_KEY', 'GROQ_API_KEY', 'ANTHROPIC_API_KEY'] as const
let savedEnv: Record<string, string | undefined>

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]))
  delete process.env.GEMINI_API_KEY
  delete process.env.ANTHROPIC_API_KEY
  process.env.GROQ_API_KEY = 'groq-test-key'
  mockedFetch.mockReset()
  mockedRefund.mockClear()
  mockedGemini.mockReset()
  mockedAnthropic.mockReset()
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k]
    else process.env[k] = savedEnv[k]
  }
})

describe('handler /api/agent — cổng vào (method/key/body)', () => {
  it('OPTIONS (preflight CORS) → 204', async () => {
    const res = await handler(new Request('http://localhost/api/agent', { method: 'OPTIONS' }))
    expect(res.status).toBe(204)
  })

  it('GET → 405 Method not allowed', async () => {
    const res = await handler(new Request('http://localhost/api/agent', { method: 'GET' }))
    expect(res.status).toBe(405)
  })

  it('Chưa cấu hình key AI nào → 500 kèm thông điệp rõ', async () => {
    delete process.env.GROQ_API_KEY
    const res = await handler(makeRequest())
    expect(res.status).toBe(500)
    const data = (await res.json()) as { error: { message: string } }
    expect(data.error.message).toMatch(/GEMINI_API_KEY|GROQ_API_KEY|ANTHROPIC_API_KEY/)
  })

  it('Vượt rate limit → 429', async () => {
    const security = await import('@dhcb/core-auth/security')
    vi.spyOn(security, 'checkRateLimit').mockResolvedValueOnce(false)
    const res = await handler(makeRequest())
    expect(res.status).toBe(429)
  })

  it('Chưa đăng nhập (validateAuth trả null) → 401', async () => {
    const security = await import('@dhcb/core-auth/security')
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce(null)
    const res = await handler(makeRequest())
    expect(res.status).toBe(401)
  })

  it('Body quá lớn (> 64KB) → 413', async () => {
    const res = await handler(
      makeRequest({
        messages: [{ role: 'user', content: 'a'.repeat(70 * 1024) }],
        mode: 'chat',
      }),
    )
    expect(res.status).toBe(413)
  })

  it('Body không phải JSON → 400', async () => {
    const res = await handler(
      new Request('http://localhost/api/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: 'Bearer x' },
        body: 'không phải json',
      }),
    )
    expect(res.status).toBe(400)
  })
})

describe('handler /api/agent — nhánh Groq và hoàn lượt', () => {
  it('Hết lượt dùng (usage gate) → 429, KHÔNG gọi provider AI nào', async () => {
    const { checkAndConsumeUsage } = await import('@dhcb/core-billing/usage')
    vi.mocked(checkAndConsumeUsage).mockResolvedValueOnce({
      ok: false,
      message: 'Hết lượt hôm nay',
    })
    const res = await handler(makeRequest())
    expect(res.status).toBe(429)
    expect(mockedFetch).not.toHaveBeenCalled()
  })

  it('Groq trả lời hợp lệ → 200, KHÔNG hoàn lượt', async () => {
    mockedFetch.mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'Hi there!' } }] }), {
        status: 200,
      }),
    )
    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
    const data = (await res.json()) as { content: Array<{ text: string }> }
    expect(data.content[0]?.text).toBe('Hi there!')
    expect(mockedRefund).not.toHaveBeenCalled()
  })

  it('Groq 200 nhưng cấu trúc JSON sai (thiếu choices) → 500 + HOÀN lượt', async () => {
    mockedFetch.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))
    const res = await handler(makeRequest())
    expect(res.status).toBe(500)
    expect(mockedRefund).toHaveBeenCalledTimes(1)
    expect(mockedRefund).toHaveBeenCalledWith('user-test', 'chat', '2026-08-12')
  })

  it('Groq 200 nhưng body KHÔNG phải JSON → 500 + HOÀN lượt', async () => {
    mockedFetch.mockResolvedValue(new Response('<html>gateway error</html>', { status: 200 }))
    const res = await handler(makeRequest())
    expect(res.status).toBe(500)
    expect(mockedRefund).toHaveBeenCalledTimes(1)
  })

  it('Groq 200 nhưng content không phải string → 500 + HOÀN lượt', async () => {
    mockedFetch.mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 42 } }] }), { status: 200 }),
    )
    const res = await handler(makeRequest())
    expect(res.status).toBe(500)
    expect(mockedRefund).toHaveBeenCalledTimes(1)
  })

  it('Groq trả HTTP lỗi (500) → giữ status + HOÀN lượt', async () => {
    mockedFetch.mockResolvedValue(new Response('boom', { status: 500 }))
    const res = await handler(makeRequest())
    expect(res.status).toBe(500)
    expect(mockedRefund).toHaveBeenCalledTimes(1)
  })

  it('Groq timeout/lỗi mạng (fetch ném lỗi) → 504 + HOÀN lượt', async () => {
    mockedFetch.mockRejectedValue(new Error('Hết thời gian chờ (quá 30s)'))
    const res = await handler(makeRequest())
    expect(res.status).toBe(504)
    expect(mockedRefund).toHaveBeenCalledTimes(1)
  })
})

// Gemini lỗi (vd hết quota free) nhưng vẫn còn Groq dự phòng → phải tự chuyển sang Groq
// thay vì báo lỗi ngay cho người dùng, KHÔNG hoàn lượt 2 lần (chỉ hoàn khi cả hai đều fail).
// Thứ tự ưu tiên (đổi 2026-08-06): Groq → Anthropic → Gemini (Gemini xuống cuối, xem
// PROGRESS.md). Nhánh nào lỗi mà còn provider dự phòng thì tự rơi xuống nhánh kế tiếp.
describe('handler /api/agent — Groq lỗi tự chuyển sang Gemini dự phòng', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'gemini-test-key'
    // GROQ_API_KEY đã set 'groq-test-key' ở beforeEach ngoài cùng — Groq vẫn được thử TRƯỚC.
  })

  it('Groq lỗi mạng (fetch ném lỗi), còn Gemini dự phòng → 200 từ Gemini, KHÔNG hoàn lượt', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('network down'))
    mockedGemini.mockResolvedValueOnce('Từ Gemini')
    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
    const data = (await res.json()) as { content: Array<{ text: string }> }
    expect(data.content[0]?.text).toBe('Từ Gemini')
    expect(mockedRefund).not.toHaveBeenCalled()
  })

  it('Groq lỗi HTTP (500), Gemini trả lời hợp lệ → 200 từ Gemini, KHÔNG hoàn lượt', async () => {
    mockedFetch.mockResolvedValueOnce(new Response('boom', { status: 500 }))
    mockedGemini.mockResolvedValueOnce('Từ Gemini')
    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
    const data = (await res.json()) as { content: Array<{ text: string }> }
    expect(data.content[0]?.text).toBe('Từ Gemini')
    expect(mockedGemini).toHaveBeenCalledTimes(1)
    expect(mockedRefund).not.toHaveBeenCalled()
  })

  it('Groq lỗi VÀ Gemini cũng lỗi → hoàn lượt đúng 1 lần (không double refund)', async () => {
    mockedFetch.mockResolvedValueOnce(new Response('boom', { status: 500 }))
    mockedGemini.mockRejectedValueOnce(new Error('Gemini API error (429): quota exceeded'))
    const res = await handler(makeRequest())
    expect(res.status).toBe(502)
    const data = (await res.json()) as { error: { message: string } }
    expect(data.error.message).toMatch(/Gemini lỗi/)
    expect(mockedRefund).toHaveBeenCalledTimes(1)
  })

  it('Groq 200 nhưng body hỏng (thiếu choices), Gemini fallback thành công → 200', async () => {
    mockedFetch.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
    mockedGemini.mockResolvedValueOnce('Từ Gemini')
    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
    const data = (await res.json()) as { content: Array<{ text: string }> }
    expect(data.content[0]?.text).toBe('Từ Gemini')
    expect(mockedRefund).not.toHaveBeenCalled()
  })

  it('Anthropic lỗi, Groq cũng lỗi, Gemini fallback cuối cùng thành công → 200', async () => {
    process.env.ANTHROPIC_API_KEY = 'anthropic-test-key'
    mockedAnthropic.mockResolvedValueOnce({
      kind: 'api_error',
      status: 500,
      message: 'boom',
      latencyMs: 1,
    })
    mockedFetch.mockResolvedValueOnce(new Response('boom', { status: 500 })) // Groq
    mockedGemini.mockResolvedValueOnce('Từ Gemini')
    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
    const data = (await res.json()) as { content: Array<{ text: string }> }
    expect(data.content[0]?.text).toBe('Từ Gemini')
    expect(mockedAnthropic).toHaveBeenCalledTimes(1)
    expect(mockedFetch).toHaveBeenCalledTimes(1)
    expect(mockedRefund).not.toHaveBeenCalled()
  })
})

// Đợt 3 rollout Zod (api/ai.ts) — schema CHỈ định hình lại logic lenient cũ (cắt bớt/mặc định),
// KHÔNG được siết chặt thêm: input sai kiểu/thiếu field vẫn phải trả 200 như trước, không phải
// 400 mới. Duy nhất hành vi từ chối giữ nguyên là 413 khi tổng nội dung quá lớn.
describe('handler /api/agent — validate/sanitize (Zod, đợt 3)', () => {
  beforeEach(() => {
    mockedFetch.mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), {
        status: 200,
      }),
    )
  })

  it('messages rỗng → vẫn 200 (không bị từ chối)', async () => {
    const res = await handler(makeRequest({ messages: [], mode: 'chat' }))
    expect(res.status).toBe(200)
  })

  it('messages không phải mảng → coi như rỗng, vẫn 200 (không regress về 400)', async () => {
    const res = await handler(makeRequest({ messages: 'không phải mảng', mode: 'chat' }))
    expect(res.status).toBe(200)
  })

  it('1 phần tử messages không phải object → giữ nguyên, vẫn 200', async () => {
    const res = await handler(makeRequest({ messages: [42], mode: 'chat' }))
    expect(res.status).toBe(200)
  })

  it('thiếu max_tokens → mặc định 1024 (forward đúng cho Groq)', async () => {
    const res = await handler(
      makeRequest({ messages: [{ role: 'user', content: 'Hi' }], mode: 'chat' }),
    )
    expect(res.status).toBe(200)
    expect(lastGroqRequestBody().max_tokens).toBe(1024)
  })

  it('tin nhắn dài hơn 2000 ký tự → cắt đúng còn 2000 ký tự khi forward cho Groq', async () => {
    const longContent = 'a'.repeat(3000)
    const res = await handler(
      makeRequest({ messages: [{ role: 'user', content: longContent }], mode: 'chat' }),
    )
    expect(res.status).toBe(200)
    const forwarded = lastGroqRequestBody().messages
    const userMsg = forwarded.find((m) => m.content === 'a'.repeat(2000))
    expect(userMsg).toBeDefined()
  })

  it('tổng nội dung vượt 40000 ký tự → 413, KHÔNG hoàn lượt (chưa trừ lượt)', async () => {
    // 21 tin × 2000 ký tự (đã bị cắt còn 2000/tin) = 42000 > 40000, dưới 64KB body-guard.
    const messages = Array.from({ length: 21 }, () => ({
      role: 'user' as const,
      content: 'a'.repeat(2000),
    }))
    const res = await handler(makeRequest({ messages, mode: 'chat' }))
    expect(res.status).toBe(413)
    expect(mockedRefund).not.toHaveBeenCalled()
    expect(mockedFetch).not.toHaveBeenCalled()
  })
})

// Chặn lỗ hổng: /api/agent CHỈ được đếm vào chat/writing/speaking — mode 'stt'/'pronounce'
// là của /api/stt và /api/pronounce-assess, đếm nhầm vào đây sẽ giúp client né giới hạn chat
// bằng cách rút quota của mode khác (xem ghi chú CHAT_ENDPOINT_MODES ở api/ai.ts).
describe('handler /api/agent — mode lạ (không phải chat/writing/speaking) → coi như "chat"', () => {
  beforeEach(() => {
    mockedFetch.mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), {
        status: 200,
      }),
    )
  })

  it.each(['stt', 'pronounce', 'hack', 123, null])(
    'mode=%p → checkAndConsumeUsage("chat")',
    async (mode) => {
      const { checkAndConsumeUsage } = await import('@dhcb/core-billing/usage')
      const mockedConsume = vi.mocked(checkAndConsumeUsage)
      mockedConsume.mockClear()
      await handler(makeRequest({ messages: [{ role: 'user', content: 'Hi' }], mode }))
      expect(mockedConsume).toHaveBeenCalledWith('user-test', 'chat')
    },
  )
})

// Đợt bổ sung 2026-08-03: nhánh Gemini thành công (trước đây chưa test đường "happy path"),
// và nhánh Anthropic (chỉ có ANTHROPIC_API_KEY, không có Gemini/Groq).
describe('handler /api/agent — nhánh Gemini thành công', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'gemini-test-key'
    delete process.env.GROQ_API_KEY
  })

  it('Gemini trả lời hợp lệ → 200, chuẩn hoá về format Anthropic, KHÔNG hoàn lượt', async () => {
    mockedGemini.mockResolvedValueOnce('Xin chào từ Gemini')
    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
    const data = (await res.json()) as { content: Array<{ text: string }> }
    expect(data.content[0]?.text).toBe('Xin chào từ Gemini')
    expect(mockedFetch).not.toHaveBeenCalled()
    expect(mockedRefund).not.toHaveBeenCalled()
  })
})

describe('handler /api/agent — nhánh Anthropic (không có Gemini/Groq)', () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY
    delete process.env.GROQ_API_KEY
    delete process.env.ANTHROPIC_FAST_MODEL
    delete process.env.ANTHROPIC_SMART_MODEL
    process.env.ANTHROPIC_API_KEY = 'anthropic-test-key'
  })

  it('thành công → 200 dạng { content: [{ type: text }] } frontend đọc được, KHÔNG hoàn lượt', async () => {
    mockedAnthropic.mockResolvedValueOnce(ANTHROPIC_OK)
    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
    const data = (await res.json()) as { content: Array<{ type: string; text: string }> }
    expect(data.content).toEqual([{ type: 'text', text: 'Hi from Claude' }])
    expect(mockedRefund).not.toHaveBeenCalled()
    expect(mockedFetch).not.toHaveBeenCalled()
  })

  it('system gửi Claude có guardrail server ở ĐẦU (client không gỡ được)', async () => {
    mockedAnthropic.mockResolvedValueOnce(ANTHROPIC_OK)
    await handler(makeRequest({ messages: [{ role: 'user', content: 'Hi' }], system: 'PROMPT' }))
    const system = mockedAnthropic.mock.calls[0]?.[0].system ?? ''
    expect(system.startsWith(SYSTEM_GUARDRAIL)).toBe(true)
    expect(system.endsWith('PROMPT')).toBe(true)
  })

  it('chat thường (không gửi task) → model NHANH (Haiku 5.5)', async () => {
    mockedAnthropic.mockResolvedValueOnce(ANTHROPIC_OK)
    await handler(makeRequest())
    expect(lastAnthropicModel()).toBe('claude-haiku-5-5')
  })

  it('mode writing (không gửi task) → suy ra chấm bài → model MẠNH (Sonnet 5.5)', async () => {
    mockedAnthropic.mockResolvedValueOnce(ANTHROPIC_OK)
    await handler(makeRequest({ messages: [{ role: 'user', content: 'essay' }], mode: 'writing' }))
    expect(lastAnthropicModel()).toBe('claude-sonnet-5-5')
  })

  it('task grade → Sonnet 5.5; vẫn đếm lượt vào đúng cột của mode', async () => {
    const { checkAndConsumeUsage } = await import('@dhcb/core-billing/usage')
    vi.mocked(checkAndConsumeUsage).mockClear()
    mockedAnthropic.mockResolvedValueOnce(ANTHROPIC_OK)
    await handler(makeRequest({ messages: [], mode: 'speaking', task: 'grade' }))
    expect(lastAnthropicModel()).toBe('claude-sonnet-5-5')
    expect(vi.mocked(checkAndConsumeUsage)).toHaveBeenCalledWith('user-test', 'speaking')
  })

  it.each(['companion', 'code_feedback', 'opus', 42, null])(
    'task lạ/chỉ-server (%p) → bỏ qua, dùng model trò chuyện (không leo thang model)',
    async (task) => {
      mockedAnthropic.mockResolvedValueOnce(ANTHROPIC_OK)
      await handler(
        makeRequest({ messages: [{ role: 'user', content: 'Hi' }], mode: 'chat', task }),
      )
      expect(lastAnthropicModel()).toBe('claude-haiku-5-5')
    },
  )

  it('body thiếu hẳn `mode` và `task` → vẫn 200 (lenient), đếm lượt chat, model trò chuyện', async () => {
    const { checkAndConsumeUsage } = await import('@dhcb/core-billing/usage')
    vi.mocked(checkAndConsumeUsage).mockClear()
    mockedAnthropic.mockResolvedValueOnce(ANTHROPIC_OK)
    const res = await handler(makeRequest({ messages: [{ role: 'user', content: 'Hi' }] }))
    expect(res.status).toBe(200)
    expect(vi.mocked(checkAndConsumeUsage)).toHaveBeenCalledWith('user-test', 'chat')
    expect(lastAnthropicModel()).toBe('claude-haiku-5-5')
  })

  it('output_schema hợp lệ → gửi Claude ĐÚNG schema của server; thiếu task vẫn suy ra chấm bài', async () => {
    mockedAnthropic.mockResolvedValueOnce(ANTHROPIC_OK)
    await handler(makeRequest({ messages: [], mode: 'chat', output_schema: 'chat_eval' }))
    const call = mockedAnthropic.mock.calls[0]?.[0]
    expect(call?.outputSchema).toEqual(getGradingSchema('chat_eval'))
    expect(lastAnthropicModel()).toBe('claude-sonnet-5-5')
  })

  it.each([{ type: 'object', properties: {} }, 'evil_schema', '__proto__', 42])(
    'output_schema lạ/schema thô (%p) → BỎ QUA, không ép format (client không gửi được schema tuỳ ý)',
    async (output_schema) => {
      mockedAnthropic.mockResolvedValueOnce(ANTHROPIC_OK)
      const res = await handler(makeRequest({ messages: [], mode: 'chat', output_schema }))
      expect(res.status).toBe(200)
      expect(mockedAnthropic.mock.calls[0]?.[0].outputSchema).toBeUndefined()
      expect(lastAnthropicModel()).toBe('claude-haiku-5-5')
    },
  )

  it('không gửi output_schema → không ép format (lượt trò chuyện giữ text tự do)', async () => {
    mockedAnthropic.mockResolvedValueOnce(ANTHROPIC_OK)
    await handler(makeRequest())
    expect(mockedAnthropic.mock.calls[0]?.[0].outputSchema).toBeUndefined()
  })

  it('client gửi `model` → server BỎ QUA, vẫn dùng model theo nhiệm vụ', async () => {
    mockedAnthropic.mockResolvedValueOnce(ANTHROPIC_OK)
    await handler(makeRequest({ messages: [], model: 'claude-fable-5-1' }))
    expect(lastAnthropicModel()).toBe('claude-haiku-5-5')
  })

  it('ANTHROPIC_FAST_MODEL ghi đè được model trò chuyện qua .env', async () => {
    process.env.ANTHROPIC_FAST_MODEL = 'claude-haiku-x'
    mockedAnthropic.mockResolvedValueOnce(ANTHROPIC_OK)
    await handler(makeRequest())
    expect(lastAnthropicModel()).toBe('claude-haiku-x')
  })

  it('lỗi HTTP → 502 + thông điệp bận song ngữ + HOÀN lượt', async () => {
    mockedAnthropic.mockResolvedValueOnce({
      kind: 'api_error',
      status: 529,
      message: 'overloaded',
      latencyMs: 1,
    })
    const res = await handler(makeRequest())
    expect(res.status).toBe(502)
    const data = (await res.json()) as { error: { message: string } }
    expect(data.error.message).toMatch(/thử lại/)
    expect(data.error.message).not.toMatch(/overloaded/) // không lộ lỗi kỹ thuật cho người học
    expect(mockedRefund).toHaveBeenCalledWith('user-test', 'chat', '2026-08-12')
  })

  it('timeout/lỗi mạng → 504 + HOÀN lượt đúng 1 lần', async () => {
    mockedAnthropic.mockResolvedValueOnce(ANTHROPIC_DOWN)
    const res = await handler(makeRequest())
    expect(res.status).toBe(504)
    expect(mockedRefund).toHaveBeenCalledTimes(1)
  })

  it('bị từ chối (refusal) → 422 + lời mời diễn đạt lại + HOÀN lượt', async () => {
    mockedAnthropic.mockResolvedValueOnce({
      kind: 'unusable',
      reason: 'refusal',
      detail: 'general_harms',
      model: 'claude-haiku-5-5',
      usage: null,
      latencyMs: 1,
    })
    const res = await handler(makeRequest())
    expect(res.status).toBe(422)
    const data = (await res.json()) as { error: { message: string } }
    expect(data.error.message).toMatch(/diễn đạt lại/)
    expect(mockedRefund).toHaveBeenCalledTimes(1)
  })

  it('bị cắt vì chạm trần token (max_tokens) → 502 + HOÀN lượt (không trả câu dở dang)', async () => {
    mockedAnthropic.mockResolvedValueOnce({
      kind: 'unusable',
      reason: 'max_tokens',
      detail: 'chạm trần',
      model: 'claude-sonnet-5-5',
      usage: null,
      latencyMs: 1,
    })
    const res = await handler(makeRequest())
    expect(res.status).toBe(502)
    expect(mockedRefund).toHaveBeenCalledTimes(1)
  })
})

describe('handler /api/agent — Anthropic là AI CHÍNH, Groq/Gemini dự phòng', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'anthropic-test-key'
    process.env.GROQ_API_KEY = 'groq-test-key'
  })

  it('có cả Anthropic + Groq, Anthropic trả lời → KHÔNG gọi Groq', async () => {
    mockedAnthropic.mockResolvedValueOnce(ANTHROPIC_OK)
    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
    expect(mockedFetch).not.toHaveBeenCalled()
  })

  it('Anthropic lỗi mạng → Groq trả lời → 200 từ Groq, KHÔNG hoàn lượt', async () => {
    mockedAnthropic.mockResolvedValueOnce(ANTHROPIC_DOWN)
    mockedFetch.mockResolvedValueOnce(GROQ_OK())
    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
    const data = (await res.json()) as { content: Array<{ text: string }> }
    expect(data.content[0]?.text).toBe('Từ Groq')
    expect(mockedRefund).not.toHaveBeenCalled()
  })

  it('Anthropic bị từ chối → Groq dự phòng vẫn được thử (không bỏ cuộc sớm)', async () => {
    mockedAnthropic.mockResolvedValueOnce({
      kind: 'unusable',
      reason: 'refusal',
      detail: 'cyber',
      model: 'claude-haiku-5-5',
      usage: null,
      latencyMs: 1,
    })
    mockedFetch.mockResolvedValueOnce(GROQ_OK())
    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
    expect(mockedRefund).not.toHaveBeenCalled()
  })

  it('Anthropic lỗi + Groq lỗi + không có Gemini → giữ status Groq + HOÀN lượt đúng 1 lần', async () => {
    mockedAnthropic.mockResolvedValueOnce(ANTHROPIC_DOWN)
    mockedFetch.mockResolvedValueOnce(new Response('boom', { status: 500 }))
    const res = await handler(makeRequest())
    expect(res.status).toBe(500)
    expect(mockedRefund).toHaveBeenCalledTimes(1)
  })
})

describe('handler /api/agent — Anthropic lỗi tự chuyển sang Gemini dự phòng (không có Groq)', () => {
  beforeEach(() => {
    delete process.env.GROQ_API_KEY
    process.env.ANTHROPIC_API_KEY = 'anthropic-test-key'
    process.env.GEMINI_API_KEY = 'gemini-test-key'
  })

  it('Anthropic lỗi mạng, Gemini fallback thành công → 200, KHÔNG hoàn lượt', async () => {
    mockedAnthropic.mockResolvedValueOnce(ANTHROPIC_DOWN)
    mockedGemini.mockResolvedValueOnce('Từ Gemini')
    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
    const data = (await res.json()) as { content: Array<{ text: string }> }
    expect(data.content[0]?.text).toBe('Từ Gemini')
    expect(mockedRefund).not.toHaveBeenCalled()
  })
})
