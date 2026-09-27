import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'
import TwoFactorSection from './TwoFactorSection'
const mocks = vi.hoisted(() => ({ verify: vi.fn(), success: vi.fn(), error: vi.fn() }))
vi.mock('@core/ToastProvider', () => ({
  useToast: () => ({ success: mocks.success, error: mocks.error }),
}))
vi.mock('../lib/twoFactorApi', () => ({
  fetchTwoFactorStatus: async () => ({
    ok: true,
    data: { enabled: true, pending: false, recoveryCodesLeft: 10 },
  }),
  verifyTwoFactor: mocks.verify,
  startTwoFactorSetup: vi.fn(),
  confirmTwoFactorSetup: vi.fn(),
  disableTwoFactor: vi.fn(),
  regenerateRecoveryCodes: vi.fn(),
}))
vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn() } }))
describe('xác minh truy cập dữ liệu riêng tư', () => {
  it('nhập mã, báo lỗi có thể thử lại và chỉ báo thành công khi máy chủ xác minh', async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    try {
      await act(async () => root.render(<TwoFactorSection isA />))
      act(() => container.querySelector('button')!.click())
      const input = container.querySelector<HTMLInputElement>('#tfa-manage')!
      act(() => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(
          input,
          '123456',
        )
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })
      const button = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Xác minh truy cập'),
      )!
      mocks.verify.mockResolvedValueOnce({ ok: false, error: 'Mã chưa đúng' })
      await act(async () => button.click())
      expect(mocks.error).toHaveBeenCalledWith('Mã chưa đúng')
      expect(mocks.success).not.toHaveBeenCalled()
      mocks.verify.mockResolvedValueOnce({
        ok: true,
        data: { stepUpUntil: '2026-09-27T00:15:00Z', usedRecoveryCode: false },
      })
      await act(async () => button.click())
      expect(mocks.verify).toHaveBeenLastCalledWith('123456')
      expect(mocks.success).toHaveBeenCalledTimes(1)
      expect(input.value).toBe('')
    } finally {
      act(() => root.unmount())
      container.remove()
    }
  })
})
