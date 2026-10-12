// Bảng route Claude theo nhiệm vụ — canh các nhiệm vụ NỀN (không client nào xin được) dùng đúng
// bậc model rẻ và hạn chót dừng trước mốc 60 giây của Nginx.
import { describe, it, expect, afterEach } from 'vitest'
import {
  getAnthropicRoute,
  isClientAiTask,
  DEFAULT_ANTHROPIC_FAST_MODEL,
  DEFAULT_ANTHROPIC_SMART_MODEL,
} from './aiConfig.js'

const ORIGINAL_FAST = process.env.ANTHROPIC_FAST_MODEL

afterEach(() => {
  if (ORIGINAL_FAST === undefined) delete process.env.ANTHROPIC_FAST_MODEL
  else process.env.ANTHROPIC_FAST_MODEL = ORIGINAL_FAST
})

describe('getAnthropicRoute — memory_reflect (GĐ2b)', () => {
  it('dùng Haiku, nghĩ ít, trần token đủ cho JSON phản tỉnh, dừng trước 60 giây', () => {
    delete process.env.ANTHROPIC_FAST_MODEL
    const route = getAnthropicRoute('memory_reflect')
    expect(route.model).toBe(DEFAULT_ANTHROPIC_FAST_MODEL)
    expect(route.model).not.toBe(DEFAULT_ANTHROPIC_SMART_MODEL)
    expect(route.effort).toBe('low')
    expect(route.maxTokens).toBeGreaterThanOrEqual(2048)
    expect(route.timeoutMs).toBeLessThan(60_000)
  })

  it('đổi model qua ANTHROPIC_FAST_MODEL không cần sửa code', () => {
    process.env.ANTHROPIC_FAST_MODEL = 'claude-haiku-test'
    expect(getAnthropicRoute('memory_reflect').model).toBe('claude-haiku-test')
  })

  it('client KHÔNG xin được nhiệm vụ nền memory_reflect qua /api/agent', () => {
    expect(isClientAiTask('memory_reflect')).toBe(false)
  })
})

describe('getAnthropicRoute — intent_route (GĐ3)', () => {
  it('dùng Haiku, nghĩ ít, hạn chót ngắn vì chạy trên đường nóng', () => {
    delete process.env.ANTHROPIC_FAST_MODEL
    const route = getAnthropicRoute('intent_route')
    expect(route.model).toBe(DEFAULT_ANTHROPIC_FAST_MODEL)
    expect(route.effort).toBe('low')
    expect(route.timeoutMs).toBeLessThanOrEqual(8_000)
  })

  it('client KHÔNG xin được nhiệm vụ nền intent_route qua /api/agent', () => {
    expect(isClientAiTask('intent_route')).toBe(false)
  })
})
