// chatFallback.test.ts — Chuỗi dự phòng Anthropic → Groq → Gemini của generateChatText().
// Không gọi mạng: mock cả ba provider + recordAiTokenUsage. Điều cần canh là THỨ TỰ thử,
// điều kiện "coi là thành công" của từng provider, model Claude theo NHIỆM VỤ, và ghi token
// đúng provider đã trả lời.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { AnthropicTextResult } from './anthropicClient.js'
import { arr, obj, str } from './jsonSchema.js'

const mocks = vi.hoisted(() => ({
  callGroqChatWithKeyPool: vi.fn(),
  callAnthropicText: vi.fn<(p: { route: { model: string } }) => Promise<AnthropicTextResult>>(),
  callGemini: vi.fn(),
  recordAiTokenUsage: vi.fn<(p: { provider: string; usage: unknown }) => Promise<void>>(
    async () => {},
  ),
}))

vi.mock('./chatProviders.js', () => ({
  callGroqChatWithKeyPool: mocks.callGroqChatWithKeyPool,
}))
vi.mock('./anthropicClient.js', () => ({ callAnthropicText: mocks.callAnthropicText }))
vi.mock('./geminiApi.js', () => ({ callGemini: mocks.callGemini }))
vi.mock('./aiTokenUsage.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./aiTokenUsage.js')>()
  return { ...actual, recordAiTokenUsage: mocks.recordAiTokenUsage }
})

import { generateChatText } from './chatFallback.js'

const PARAMS = {
  system: 'sys',
  userMessage: 'hi',
  maxTokens: 64,
  mode: 'debate',
  task: 'debate' as const,
}
const KEYS = [
  'GROQ_API_KEY',
  'ANTHROPIC_API_KEY',
  'GEMINI_API_KEY',
  'ANTHROPIC_FAST_MODEL',
  'ANTHROPIC_SMART_MODEL',
] as const
const saved: Partial<Record<(typeof KEYS)[number], string | undefined>> = {}

const USAGE = { promptTokens: 5, completionTokens: 7, cacheReadTokens: 0, cacheWriteTokens: 0 }

function anthropicOk(text: string, model = 'claude-haiku-5-5'): AnthropicTextResult {
  return { kind: 'success', text, model, usage: USAGE, latencyMs: 1 }
}

const groqOk = (text: string) => ({
  kind: 'success',
  text,
  latencyMs: 1,
  usage: { promptTokens: 1, completionTokens: 2 },
  model: 'llama-x',
})

beforeEach(() => {
  for (const k of KEYS) {
    saved[k] = process.env[k]
    delete process.env[k]
  }
  vi.clearAllMocks()
})
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

describe('generateChatText — chuỗi dự phòng', () => {
  it('không có key nào → null, không gọi provider nào', async () => {
    expect(await generateChatText(PARAMS)).toBeNull()
    expect(mocks.callGroqChatWithKeyPool).not.toHaveBeenCalled()
    expect(mocks.callAnthropicText).not.toHaveBeenCalled()
    expect(mocks.callGemini).not.toHaveBeenCalled()
  })

  it('Anthropic thành công → trả text, ghi token với model THẬT, KHÔNG gọi Groq dù có key', async () => {
    process.env.GROQ_API_KEY = 'g'
    process.env.ANTHROPIC_API_KEY = 'a'
    mocks.callAnthropicText.mockResolvedValue(anthropicOk('xin chào', 'claude-opus-5-5'))
    expect(await generateChatText(PARAMS)).toBe('xin chào')
    expect(mocks.recordAiTokenUsage).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'anthropic', model: 'claude-opus-5-5', mode: 'debate' }),
    )
    expect(mocks.callGroqChatWithKeyPool).not.toHaveBeenCalled()
  })

  it.each([
    ['debate', 'claude-haiku-5-5'],
    ['code_feedback', 'claude-sonnet-5-5'],
    ['action_canvas', 'claude-sonnet-5-5'],
  ] as const)('nhiệm vụ %s → model %s', async (task, model) => {
    process.env.ANTHROPIC_API_KEY = 'a'
    mocks.callAnthropicText.mockResolvedValue(anthropicOk('ok'))
    await generateChatText({ ...PARAMS, task })
    expect(mocks.callAnthropicText.mock.calls[0]?.[0].route.model).toBe(model)
  })

  it('outputSchema chuyển nguyên cho Claude; không truyền thì không ép format', async () => {
    process.env.ANTHROPIC_API_KEY = 'a'
    mocks.callAnthropicText.mockResolvedValue(anthropicOk('{}'))
    const outputSchema = obj({ steps: arr(str()) })
    await generateChatText({ ...PARAMS, outputSchema })
    await generateChatText(PARAMS)
    const calls = mocks.callAnthropicText.mock.calls as unknown as Array<
      [{ outputSchema?: unknown }]
    >
    expect(calls[0]?.[0].outputSchema).toEqual(outputSchema)
    expect(calls[1]?.[0].outputSchema).toBeUndefined()
  })

  it('Anthropic lỗi mạng / lỗi HTTP / bị cắt / bị từ chối → sang Groq', async () => {
    process.env.GROQ_API_KEY = 'g'
    process.env.ANTHROPIC_API_KEY = 'a'
    mocks.callGroqChatWithKeyPool.mockResolvedValue(groqOk('  từ groq  '))
    const failures: AnthropicTextResult[] = [
      { kind: 'network_error', message: 'ECONNRESET', latencyMs: 1 },
      { kind: 'api_error', status: 529, message: 'busy', latencyMs: 1 },
      {
        kind: 'unusable',
        reason: 'max_tokens',
        detail: '',
        model: 'claude-haiku-5-5',
        usage: USAGE,
        latencyMs: 1,
      },
      {
        kind: 'unusable',
        reason: 'refusal',
        detail: 'cyber',
        model: 'claude-haiku-5-5',
        usage: null,
        latencyMs: 1,
      },
    ]
    for (const f of failures) {
      mocks.callAnthropicText.mockResolvedValueOnce(f)
      expect(await generateChatText(PARAMS)).toBe('từ groq')
    }
    // Lượt bị cắt (max_tokens) VẪN tốn tiền → phải ghi token anthropic; lỗi mạng/HTTP thì không.
    const providers = mocks.recordAiTokenUsage.mock.calls.map((c) => c[0].provider)
    expect(providers).toEqual(['groq', 'groq', 'anthropic', 'groq', 'anthropic', 'groq'])
  })

  it('Groq trả text rỗng / lỗi http / ném lỗi → sang Gemini', async () => {
    process.env.GROQ_API_KEY = 'g'
    process.env.GEMINI_API_KEY = 'k'
    mocks.callGemini.mockResolvedValue('từ gemini')

    mocks.callGroqChatWithKeyPool.mockResolvedValueOnce(groqOk('   '))
    expect(await generateChatText(PARAMS)).toBe('từ gemini')

    mocks.callGroqChatWithKeyPool.mockResolvedValueOnce({
      kind: 'http_error',
      status: 429,
      bodyText: '',
      latencyMs: 1,
    })
    expect(await generateChatText(PARAMS)).toBe('từ gemini')

    mocks.callGroqChatWithKeyPool.mockRejectedValueOnce(new Error('timeout'))
    expect(await generateChatText(PARAMS)).toBe('từ gemini')
  })

  it('Anthropic lỗi, không có Groq → Gemini', async () => {
    process.env.ANTHROPIC_API_KEY = 'a'
    process.env.GEMINI_API_KEY = 'k'
    mocks.callAnthropicText.mockResolvedValue({ kind: 'network_error', message: 'x', latencyMs: 1 })
    mocks.callGemini.mockResolvedValue('từ gemini')
    expect(await generateChatText(PARAMS)).toBe('từ gemini')
  })

  it('Gemini: ghi token TRƯỚC khi kiểm text (đã tính tiền dù text rỗng) → text rỗng thì null', async () => {
    process.env.GEMINI_API_KEY = 'k'
    mocks.callGemini.mockImplementation(
      async (
        _k: string,
        _m: string,
        _s: string,
        _msgs: unknown,
        _max: number,
        _opt: unknown,
        onUsage: (u: { promptTokens: number; completionTokens: number }) => void,
      ) => {
        onUsage({ promptTokens: 3, completionTokens: 0 })
        return '   '
      },
    )
    expect(await generateChatText(PARAMS)).toBeNull()
    expect(mocks.recordAiTokenUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'gemini',
        usage: { promptTokens: 3, completionTokens: 0 },
      }),
    )
  })

  it('Gemini trả text → trim; Gemini ném lỗi → null (hết provider)', async () => {
    process.env.GEMINI_API_KEY = 'k'
    mocks.callGemini.mockResolvedValueOnce(' đáp ')
    expect(await generateChatText(PARAMS)).toBe('đáp')
    mocks.callGemini.mockRejectedValueOnce(new Error('quota'))
    expect(await generateChatText(PARAMS)).toBeNull()
  })
})
