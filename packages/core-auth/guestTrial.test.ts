// guestTrial.test.ts — Hạn mức dùng thử của khách vãng lai.
//
// Bất biến canh ở đây (đặc tả §⑤):
//   - Hạn mức khách PHẢI thấp hơn hẳn hạn mức Free đã đăng nhập (30/ngày).
//   - Hết lượt là CHẶN, không fail-open.
//   - Bị chặn ở tầng IP thì lượt đã trừ ở tầng id phải được HOÀN — nếu không, người dùng thật
//     ngồi sau NAT đông người sẽ bị đốt sạch quota của chính mình mà chẳng dùng được gì.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const consume = vi.fn()
const release = vi.fn()
vi.mock('./security.js', async (importOriginal) => ({
  // Bản THẬT của hàm chuẩn hoá khoá — test dưới cần thấy IPv6 được gom theo /64.
  rateLimitSubject: (await importOriginal<typeof import('./security.js')>()).rateLimitSubject,
  consumeDailyCounter: consume,
  releaseDailyCounter: release,
}))

const { checkAndConsumeGuestTrial, refundGuestTrial, GUEST_DAILY_TRIAL, GUEST_IP_DAILY_TRIAL } =
  await import('./guestTrial.js')

beforeEach(() => {
  consume.mockReset()
  release.mockReset()
  consume.mockResolvedValue(true)
  release.mockResolvedValue(undefined)
})

describe('hằng số hạn mức', () => {
  it('khách ít hơn hẳn gói Free đã đăng nhập (30 lượt/ngày)', () => {
    expect(GUEST_DAILY_TRIAL).toBeGreaterThan(0)
    expect(GUEST_DAILY_TRIAL).toBeLessThan(30)
  })

  it('trần theo IP rộng hơn trần theo trình duyệt (nhiều người sau một NAT)', () => {
    expect(GUEST_IP_DAILY_TRIAL).toBeGreaterThan(GUEST_DAILY_TRIAL)
  })
})

describe('checkAndConsumeGuestTrial', () => {
  it('còn lượt → cho qua, trừ ở CẢ hai tầng', async () => {
    const gate = await checkAndConsumeGuestTrial('guest_a', '1.2.3.4')
    expect(gate.ok).toBe(true)
    expect(consume).toHaveBeenCalledTimes(2)
    expect(consume).toHaveBeenNthCalledWith(1, 'guest-trial:id:guest_a', GUEST_DAILY_TRIAL)
    expect(consume).toHaveBeenNthCalledWith(2, 'guest-trial:ip:1.2.3.4', GUEST_IP_DAILY_TRIAL)
  })

  it('hết lượt theo id → chặn NGAY, không đụng tới bộ đếm IP', async () => {
    consume.mockResolvedValueOnce(false)
    const gate = await checkAndConsumeGuestTrial('guest_a', '1.2.3.4')
    expect(gate.ok).toBe(false)
    expect(gate.message).toContain('Đăng ký')
    expect(consume).toHaveBeenCalledTimes(1)
  })

  it('hết lượt theo IP → chặn VÀ hoàn lại lượt vừa trừ ở tầng id', async () => {
    consume.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    const gate = await checkAndConsumeGuestTrial('guest_a', '1.2.3.4')
    expect(gate.ok).toBe(false)
    expect(release).toHaveBeenCalledExactlyOnceWith('guest-trial:id:guest_a')
  })

  it('không xác định được IP → vẫn chặn được theo id, bỏ qua tầng IP', async () => {
    const gate = await checkAndConsumeGuestTrial('guest_a', '')
    expect(gate.ok).toBe(true)
    expect(consume).toHaveBeenCalledTimes(1)
  })
})

describe('refundGuestTrial', () => {
  it('hoàn cả hai tầng', async () => {
    await refundGuestTrial('guest_a', '1.2.3.4')
    expect(release).toHaveBeenCalledWith('guest-trial:id:guest_a')
    expect(release).toHaveBeenCalledWith('guest-trial:ip:1.2.3.4')
  })

  it('IP rỗng → chỉ hoàn tầng id', async () => {
    await refundGuestTrial('guest_a', '')
    expect(release).toHaveBeenCalledExactlyOnceWith('guest-trial:id:guest_a')
  })
})

describe('khoá IP gom IPv6 theo /64 (vá 2026-09-27)', () => {
  it('hai địa chỉ khác nhau trong CÙNG dải /64 dùng CHUNG bộ đếm IP', async () => {
    await checkAndConsumeGuestTrial('guest_aaaaaaaaaa', '2001:db8:1:2::1')
    await checkAndConsumeGuestTrial('guest_bbbbbbbbbb', '2001:db8:1:2:ffff:ffff:ffff:fffe')
    const ipKeys = consume.mock.calls
      .map(([key]) => String(key))
      .filter((key) => key.startsWith('guest-trial:ip:'))
    expect(ipKeys).toEqual(['guest-trial:ip:2001:db8:1:2::/64', 'guest-trial:ip:2001:db8:1:2::/64'])
  })
})
