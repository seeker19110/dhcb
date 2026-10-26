// actorUsage.test.ts — Cờ `guestTrialExhausted` chỉ bật khi khách HẾT LƯỢT thật (audit 2026-10-10,
// E1.9): Redis không đếm được thì vẫn chặn nhưng không mời đăng ký như thể đã dùng hết lượt.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const guestGate = vi.fn()
vi.mock('./guestTrial.js', () => ({
  checkAndConsumeGuestTrial: guestGate,
  refundGuestTrial: vi.fn(),
}))
const breaker = vi.fn()
vi.mock('@dhcb/core-billing/usage', () => ({
  checkAndConsumeUsage: vi.fn(),
  refundUsage: vi.fn(),
  checkAiCircuitBreaker: breaker,
}))

const { checkAndConsumeActorUsage } = await import('./actorUsage.js')
const GUEST = { kind: 'guest', guestKey: 'guest_a' } as const

beforeEach(() => {
  guestGate.mockReset()
  breaker.mockReset().mockResolvedValue({ ok: true })
})

describe('checkAndConsumeActorUsage — khách', () => {
  it('còn lượt → ok, day rỗng', async () => {
    guestGate.mockResolvedValue({ ok: true })
    expect(await checkAndConsumeActorUsage(GUEST, 'chat', '1.2.3.4')).toEqual({ ok: true, day: '' })
  })

  it('hết lượt thật → guestTrialExhausted: true', async () => {
    guestGate.mockResolvedValue({ ok: false, message: 'hết lượt' })
    expect(await checkAndConsumeActorUsage(GUEST, 'chat', '1.2.3.4')).toEqual({
      ok: false,
      message: 'hết lượt',
      guestTrialExhausted: true,
    })
  })

  it('không đếm được (Redis) → chặn nhưng guestTrialExhausted: false', async () => {
    guestGate.mockResolvedValue({ ok: false, message: 'bận', unavailable: true })
    expect(await checkAndConsumeActorUsage(GUEST, 'chat', '1.2.3.4')).toEqual({
      ok: false,
      message: 'bận',
      guestTrialExhausted: false,
    })
  })
})

// Audit 2026-10-26, AUD-CFG-001: cầu dao AI từng chỉ được kiểm ở nhánh TÀI KHOẢN — khách vẫn gọi
// chat/STT tới provider khi admin đã bật cầu dao. Cầu dao phải chặn TRƯỚC khi trừ lượt dùng thử.
describe('checkAndConsumeActorUsage — khách tôn trọng cầu dao AI', () => {
  it('cầu dao BẬT → chặn, KHÔNG trừ lượt thử, không mời đăng ký', async () => {
    breaker.mockResolvedValue({ ok: false, message: 'bảo trì' })
    guestGate.mockResolvedValue({ ok: true })
    expect(await checkAndConsumeActorUsage(GUEST, 'stt', '1.2.3.4')).toEqual({
      ok: false,
      message: 'bảo trì',
      guestTrialExhausted: false,
    })
    expect(guestGate).not.toHaveBeenCalled()
  })

  it('cầu dao TẮT → đi tiếp tới hạn mức dùng thử như cũ', async () => {
    guestGate.mockResolvedValue({ ok: true })
    expect(await checkAndConsumeActorUsage(GUEST, 'chat', '1.2.3.4')).toEqual({ ok: true, day: '' })
    expect(breaker).toHaveBeenCalledTimes(1)
    expect(guestGate).toHaveBeenCalledWith('guest_a', '1.2.3.4')
  })
})

// Audit 2026-10-20, D-1/D-2: nhánh HOÀN LƯỢT chưa từng được phủ — đây là chỗ tiền/lượt đi
// ngược lại khi AI lỗi, sai một nhánh là người dùng mất lượt oan (hoặc khách được hoàn vô hạn).
const usageMod = await import('@dhcb/core-billing/usage')
const guestMod = await import('./guestTrial.js')
const { refundActorUsage } = await import('./actorUsage.js')
const USER = { kind: 'user', userId: 'u-1' } as const

describe('refundActorUsage — hoàn lượt đúng kênh', () => {
  beforeEach(() => {
    vi.mocked(usageMod.refundUsage).mockReset()
    vi.mocked(guestMod.refundGuestTrial).mockReset()
  })

  it('tài khoản thật, có day → hoàn đúng dòng daily_usage của ngày đó', async () => {
    await refundActorUsage(USER, 'chat', '2026-10-20', '1.2.3.4')
    expect(usageMod.refundUsage).toHaveBeenCalledWith('u-1', 'chat', '2026-10-20')
    expect(guestMod.refundGuestTrial).not.toHaveBeenCalled()
  })

  it('tài khoản thật, day RỖNG (gate không trả ngày) → truyền undefined, không truyền chuỗi rỗng', async () => {
    await refundActorUsage(USER, 'speaking', '', '1.2.3.4')
    expect(usageMod.refundUsage).toHaveBeenCalledWith('u-1', 'speaking', undefined)
  })

  it('khách → hoàn lượt dùng thử theo guestKey + IP, KHÔNG đụng daily_usage', async () => {
    await refundActorUsage(GUEST, 'chat', '', '1.2.3.4')
    expect(guestMod.refundGuestTrial).toHaveBeenCalledWith('guest_a', '1.2.3.4')
    expect(usageMod.refundUsage).not.toHaveBeenCalled()
  })
})

describe('checkAndConsumeActorUsage — tài khoản thật', () => {
  it('gate ok → trả nguyên gate (kèm day) để hoàn đúng dòng về sau', async () => {
    vi.mocked(usageMod.checkAndConsumeUsage).mockResolvedValue({ ok: true, day: '2026-10-20' })
    expect(await checkAndConsumeActorUsage(USER, 'chat', '1.2.3.4')).toEqual({
      ok: true,
      day: '2026-10-20',
    })
  })

  it('gate chặn → guestTrialExhausted luôn false (không mời đăng ký người đã đăng nhập)', async () => {
    vi.mocked(usageMod.checkAndConsumeUsage).mockResolvedValue({ ok: false, message: 'Hết lượt' })
    expect(await checkAndConsumeActorUsage(USER, 'chat', '1.2.3.4')).toEqual({
      ok: false,
      message: 'Hết lượt',
      guestTrialExhausted: false,
    })
  })

  it('khách chặn nhưng gate không có message → message rỗng, không undefined', async () => {
    guestGate.mockResolvedValue({ ok: false })
    expect(await checkAndConsumeActorUsage(GUEST, 'chat', '1.2.3.4')).toEqual({
      ok: false,
      message: '',
      guestTrialExhausted: true,
    })
  })
})
