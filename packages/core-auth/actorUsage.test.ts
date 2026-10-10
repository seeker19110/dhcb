// actorUsage.test.ts — Cờ `guestTrialExhausted` chỉ bật khi khách HẾT LƯỢT thật (audit 2026-10-10,
// E1.9): Redis không đếm được thì vẫn chặn nhưng không mời đăng ký như thể đã dùng hết lượt.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const guestGate = vi.fn()
vi.mock('./guestTrial.js', () => ({
  checkAndConsumeGuestTrial: guestGate,
  refundGuestTrial: vi.fn(),
}))
vi.mock('@dhcb/core-billing/usage', () => ({
  checkAndConsumeUsage: vi.fn(),
  refundUsage: vi.fn(),
}))

const { checkAndConsumeActorUsage } = await import('./actorUsage.js')
const GUEST = { kind: 'guest', guestKey: 'guest_a' } as const

beforeEach(() => guestGate.mockReset())

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
