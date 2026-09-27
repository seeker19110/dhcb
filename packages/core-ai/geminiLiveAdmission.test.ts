import { describe, it, expect, beforeEach, vi } from 'vitest'
import { reserveGeminiLiveUsage, _resetGeminiLiveAdmissionForTests } from './geminiLiveAdmission.js'
import { checkAndConsumeUsage, refundUsage } from '@dhcb/core-billing/usage'
import { checkRateLimit } from '@dhcb/core-auth/security'
vi.mock('@dhcb/core-billing/usage', () => ({ checkAndConsumeUsage: vi.fn(), refundUsage: vi.fn() }))
vi.mock('@dhcb/core-auth/security', () => ({ checkRateLimit: vi.fn() }))
beforeEach(() => {
  vi.resetAllMocks()
  _resetGeminiLiveAdmissionForTests()
  vi.mocked(checkRateLimit).mockResolvedValue(true)
  vi.mocked(checkAndConsumeUsage).mockResolvedValue({ ok: true, day: '2026-09-26' })
  vi.mocked(refundUsage).mockResolvedValue(undefined)
})
describe('Gemini Live admission — nguyên tử và hoàn lượt', () => {
  it('giữ slot cả trong khi đang đợi DB; khác user vẫn được mở', async () => {
    let allow!: (gate: { ok: true; day: string }) => void
    vi.mocked(checkAndConsumeUsage).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          allow = resolve
        }),
    )
    const pending = reserveGeminiLiveUsage('u1')
    await Promise.resolve()
    expect((await reserveGeminiLiveUsage('u1')).ok).toBe(false)
    expect((await reserveGeminiLiveUsage('u2')).ok).toBe(true)
    allow({ ok: true, day: '2026-09-26' })
    expect((await pending).ok).toBe(true)
  })
  it('ba luồng cleanup đồng thời chỉ hoàn một lần vào đúng ngày gốc', async () => {
    const result = await reserveGeminiLiveUsage('u1')
    if (!result.ok) throw new Error('Unexpected denial')
    await Promise.all(Array.from({ length: 3 }, () => result.admission.refundBeforeStart()))
    expect(refundUsage).toHaveBeenCalledExactlyOnceWith('u1', 'speaking', '2026-09-26')
    result.admission.release()
    result.admission.release()
    expect((await reserveGeminiLiveUsage('u1')).ok).toBe(true)
  })
  it('không hoàn sau khi upstream bắt đầu', async () => {
    const result = await reserveGeminiLiveUsage('u1')
    if (!result.ok) throw new Error('Unexpected denial')
    result.admission.markStarted()
    await result.admission.refundBeforeStart()
    expect(refundUsage).not.toHaveBeenCalled()
  })
  it('lỗi DB hoặc bị gate từ chối đều trả slot lại', async () => {
    vi.mocked(checkAndConsumeUsage).mockRejectedValueOnce(new Error('DB down'))
    expect(await reserveGeminiLiveUsage('u1')).toMatchObject({ ok: false, status: 503 })
    vi.mocked(checkAndConsumeUsage).mockResolvedValueOnce({ ok: false, message: 'Hết lượt' })
    expect(await reserveGeminiLiveUsage('u1')).toMatchObject({ ok: false, status: 429 })
    expect((await reserveGeminiLiveUsage('u1')).ok).toBe(true)
    expect(refundUsage).not.toHaveBeenCalled()
  })
})
