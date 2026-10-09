// packages/core-ai/debateArenaAiTurn.test.ts — Ghim hành vi SINH LƯỢT AI THẬT của Đấu trường
// Tranh biện (sửa 2026-08-23).
//
// VÌ SAO CÓ FILE NÀY: trước đây `generateAiTurn` trả về 1 trong 3 đoạn tiếng Anh CỨNG, bỏ qua
// cả chủ đề lẫn lập luận người học, trong khi UI ghi "Debater AI". Test cũ vẫn xanh vì nó chỉ
// kiểm `content.length > 20` — tức bộ test KHÔNG hề phát hiện được sự giả mạo. Các ca dưới đây
// ghim đúng thứ test cũ bỏ lọt: có gọi provider không, prompt có mang chủ đề + lời người học
// không, và khi không gọi được thì có NÓI THẬT (cờ isFallback) không.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const callGroqMock = vi.fn()
vi.mock('./chatProviders.js', () => ({
  callGroqChatWithKeyPool: (...args: unknown[]) => callGroqMock(...args),
}))
// Không để phần đo token chạm DB thật trong test.
vi.mock('./aiTokenUsage.js', () => ({
  recordAiTokenUsage: vi.fn(),
  parseAnthropicUsage: () => null,
}))

import { DebateArenaService } from './debateArenaService.js'

const USER = '11111111-1111-4111-8111-111111111111'
const MOTION = 'Universal Basic Income is essential in an automated economy.'

function makeSession() {
  return DebateArenaService.createDebateSession(USER, {
    topicId: 'ubi',
    motion: MOTION,
    category: 'economics',
    userStance: 'support',
    difficulty: 'advanced_c1',
    maxRounds: 3,
  })
}

describe('generateAiTurn — gọi AI thật', () => {
  beforeEach(() => {
    callGroqMock.mockReset()
    process.env.GROQ_API_KEY = 'test-key'
  })
  afterEach(() => {
    delete process.env.GROQ_API_KEY
  })

  it('dùng NGUYÊN VĂN câu trả lời của model, không phải mẫu cứng', async () => {
    callGroqMock.mockResolvedValue({
      kind: 'success',
      text: 'Your reliance on automation forecasts ignores labour-market elasticity.',
      latencyMs: 12,
      usage: null,
      model: 'openai/gpt-oss-120b',
    })

    const turn = await DebateArenaService.generateAiTurn(makeSession(), 'negative')

    expect(turn.content).toBe(
      'Your reliance on automation forecasts ignores labour-market elasticity.',
    )
    expect(turn.isFallback).toBeUndefined()
    // Không được dính bất kỳ mẫu cứng cũ nào
    expect(turn.content).not.toContain('unintended consequences')
  })

  it('prompt mang CHỦ ĐỀ thật và LỜI NGƯỜI HỌC vừa nói (đây là thứ bản giả bỏ qua)', async () => {
    callGroqMock.mockResolvedValue({
      kind: 'success',
      text: 'Rebuttal.',
      latencyMs: 5,
      usage: null,
      model: 'm',
    })

    const session = makeSession()
    session.turns.push({
      id: 't-u',
      speakerId: USER,
      speakerName: 'Người học',
      speakerRole: 'user',
      content: 'Automation will displace 40% of clerical jobs by 2035.',
      detectedFallacy: 'none',
      advancedVocabulary: [],
      logicScore: 80,
      persuasionScore: 80,
      timestamp: new Date().toISOString(),
    })

    await DebateArenaService.generateAiTurn(session, 'negative')

    const [, system, messages] = callGroqMock.mock.calls[0] as [
      string,
      string,
      { content: string }[],
    ]
    expect(system).toContain(MOTION)
    expect(system).toContain('PHẢN ĐỐI')
    expect(messages[0]?.content).toContain('40% of clerical jobs')
  })

  it('model trả rỗng → rơi về mẫu cứng VÀ gắn cờ isFallback (nói thật, không giả vờ là AI)', async () => {
    callGroqMock.mockResolvedValue({
      kind: 'success',
      text: '   ',
      latencyMs: 5,
      usage: null,
      model: 'm',
    })

    const turn = await DebateArenaService.generateAiTurn(makeSession(), 'negative')
    expect(turn.isFallback).toBe(true)
  })

  it('provider lỗi mạng → fallback có cờ, KHÔNG ném lỗi ra ngoài', async () => {
    callGroqMock.mockResolvedValue({ kind: 'network_error', message: 'ECONNRESET', latencyMs: 1 })

    const turn = await DebateArenaService.generateAiTurn(makeSession(), 'negative')
    expect(turn.isFallback).toBe(true)
    expect(turn.content.length).toBeGreaterThan(20)
  })

  it('KHÔNG có key nào → không gọi provider, trả mẫu cứng có cờ', async () => {
    delete process.env.GROQ_API_KEY
    const turn = await DebateArenaService.generateAiTurn(makeSession(), 'affirmative')
    expect(callGroqMock).not.toHaveBeenCalled()
    expect(turn.isFallback).toBe(true)
  })
})
