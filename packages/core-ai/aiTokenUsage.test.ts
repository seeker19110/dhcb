import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock pool — không cần Postgres thật; kiểm SQL/tham số + hành vi nuốt lỗi.
const queryMock = vi.fn()
vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: () => ({ query: queryMock }) }))

import {
  parseGroqUsage,
  parseAnthropicUsage,
  parseGeminiUsage,
  recordAiTokenUsage,
  getDailyBudgetUsd,
  getDailyCostUsd,
  resetBudgetAlertState,
} from './aiTokenUsage.js'

describe('parse usage của 3 nhà cung cấp', () => {
  it('Groq: đọc prompt_tokens/completion_tokens', () => {
    expect(parseGroqUsage({ usage: { prompt_tokens: 120, completion_tokens: 45 } })).toEqual({
      promptTokens: 120,
      completionTokens: 45,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    })
  })

  it('Anthropic: CỘNG cache read/write vào input_tokens (Anthropic báo tách riêng)', () => {
    expect(
      parseAnthropicUsage({
        usage: {
          input_tokens: 100,
          output_tokens: 60,
          cache_read_input_tokens: 900,
          cache_creation_input_tokens: 10,
        },
      }),
    ).toEqual({
      promptTokens: 1010,
      completionTokens: 60,
      cacheReadTokens: 900,
      cacheWriteTokens: 10,
    })
  })

  it('Gemini: đọc usageMetadata', () => {
    expect(
      parseGeminiUsage({ usageMetadata: { promptTokenCount: 30, candidatesTokenCount: 12 } }),
    ).toEqual({
      promptTokens: 30,
      completionTokens: 12,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    })
  })

  it('thiếu/rỗng/số rác → null (không ghi dòng 0 token làm loãng số liệu)', () => {
    expect(parseGroqUsage(null)).toBeNull()
    expect(parseGroqUsage({})).toBeNull()
    expect(parseGroqUsage({ usage: {} })).toBeNull()
    expect(parseGroqUsage({ usage: { prompt_tokens: -5, completion_tokens: NaN } })).toBeNull()
    expect(parseGeminiUsage({ usageMetadata: { promptTokenCount: 'nhiều' } })).toBeNull()
  })

  it('số lẻ/âm bị làm sạch chứ không làm hỏng lượt gọi', () => {
    expect(parseGroqUsage({ usage: { prompt_tokens: 10.7, completion_tokens: -3 } })).toEqual({
      promptTokens: 10,
      completionTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    })
  })
})

describe('recordAiTokenUsage', () => {
  beforeEach(() => {
    queryMock.mockReset()
    resetBudgetAlertState()
    delete process.env.AI_DAILY_BUDGET_USD
  })

  it('upsert cộng dồn đúng khoá (ngày, provider, model, mode)', async () => {
    queryMock.mockResolvedValue({ rows: [] })
    await recordAiTokenUsage({
      provider: 'groq',
      model: 'gpt-4o-mini',
      mode: 'chat',
      usage: { promptTokens: 1000, completionTokens: 500, cacheReadTokens: 0, cacheWriteTokens: 0 },
      day: '2026-08-23',
    })
    const [sql, params] = queryMock.mock.calls[0] ?? []
    expect(sql).toContain('insert into platform.ai_token_usage_daily')
    expect(sql).toContain('on conflict (day, provider, model, mode) do update')
    expect(sql).toContain('calls              = platform.ai_token_usage_daily.calls + 1')
    // gpt-4o-mini: 0.15 USD/1M vào + 0.6 USD/1M ra → 1000*0.15/1e6 + 500*0.6/1e6 = 0.00045
    expect(params?.slice(0, 4)).toEqual(['2026-08-23', 'groq', 'gpt-4o-mini', 'chat'])
    expect(params?.[8]).toBeCloseTo(0.00045, 8)
  })

  it('usage = null → KHÔNG chạm DB', async () => {
    await recordAiTokenUsage({ provider: 'gemini', model: 'x', mode: 'chat', usage: null })
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('DB lỗi → nuốt lỗi, KHÔNG ném ra ngoài (đo đạc không được làm hỏng lượt trả lời)', async () => {
    queryMock.mockRejectedValue(new Error('relation does not exist'))
    await expect(
      recordAiTokenUsage({
        provider: 'anthropic',
        model: 'claude-haiku-4-5-20251001',
        mode: 'writing',
        usage: {
          promptTokens: 10,
          completionTokens: 10,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
        },
      }),
    ).resolves.toBeUndefined()
  })

  it('model lạ vẫn ghi được (dùng bảng giá dự phòng, không bỏ số liệu)', async () => {
    queryMock.mockResolvedValue({ rows: [] })
    await recordAiTokenUsage({
      provider: 'groq',
      model: 'model-chua-co-trong-bang-gia',
      mode: 'chat',
      usage: {
        promptTokens: 1_000_000,
        completionTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      },
      day: '2026-08-23',
    })
    expect(queryMock.mock.calls[0]?.[1]?.[8]).toBeCloseTo(0.5, 6) // DEFAULT_FALLBACK_PRICING
  })
})

describe('cảnh báo vượt ngân sách ngày', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    queryMock.mockReset()
    resetBudgetAlertState()
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    errorSpy.mockRestore()
    delete process.env.AI_DAILY_BUDGET_USD
  })

  it('chưa đặt AI_DAILY_BUDGET_USD → không truy vấn tổng, không cảnh báo', async () => {
    queryMock.mockResolvedValue({ rows: [] })
    await recordAiTokenUsage({
      provider: 'groq',
      model: 'gpt-4o-mini',
      mode: 'chat',
      usage: { promptTokens: 10, completionTokens: 10, cacheReadTokens: 0, cacheWriteTokens: 0 },
      day: '2026-08-23',
    })
    expect(queryMock).toHaveBeenCalledTimes(1) // chỉ upsert, không có truy vấn tổng
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('ngưỡng rác/≤ 0 → coi như chưa đặt', () => {
    process.env.AI_DAILY_BUDGET_USD = 'nhiều tiền'
    expect(getDailyBudgetUsd()).toBeNull()
    process.env.AI_DAILY_BUDGET_USD = '0'
    expect(getDailyBudgetUsd()).toBeNull()
    process.env.AI_DAILY_BUDGET_USD = '2.5'
    expect(getDailyBudgetUsd()).toBe(2.5)
  })

  it('vượt ngưỡng → cảnh báo MỘT lần cho cả ngày (không spam mỗi lượt)', async () => {
    process.env.AI_DAILY_BUDGET_USD = '1'
    queryMock.mockResolvedValue({ rows: [{ total: '3.5' }] })
    const call = () =>
      recordAiTokenUsage({
        provider: 'groq',
        model: 'gpt-4o-mini',
        mode: 'chat',
        usage: { promptTokens: 10, completionTokens: 10, cacheReadTokens: 0, cacheWriteTokens: 0 },
        day: '2026-08-23',
      })
    await call()
    await call()
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(String(errorSpy.mock.calls[0]?.[0])).toContain('NGÂN SÁCH AI VƯỢT NGƯỠNG')
  })

  it('chưa vượt ngưỡng → im lặng', async () => {
    process.env.AI_DAILY_BUDGET_USD = '10'
    queryMock.mockResolvedValue({ rows: [{ total: '0.2' }] })
    await recordAiTokenUsage({
      provider: 'groq',
      model: 'gpt-4o-mini',
      mode: 'chat',
      usage: { promptTokens: 10, completionTokens: 10, cacheReadTokens: 0, cacheWriteTokens: 0 },
      day: '2026-08-23',
    })
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('getDailyCostUsd: bảng rỗng (sum trả null) → 0', async () => {
    queryMock.mockResolvedValue({ rows: [{ total: null }] })
    expect(await getDailyCostUsd('2026-08-23')).toBe(0)
  })
})
