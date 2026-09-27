// apps/dhcb/src/components/TwoFactorSection.test.tsx — Unit test cho khối 2FA ở trang Hồ sơ.
// Render tĩnh (renderToStaticMarkup) như các component test khác trong repo: đủ để chốt phần
// NGÔN NGỮ và CẤU TRÚC hiển thị lúc đầu — hai thứ dễ vỡ nhất khi sửa về sau.

import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'

vi.mock('@core/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))
// Trạng thái nạp qua fetch trong useEffect — render tĩnh không chạy effect nên luôn là null.
vi.mock('../lib/twoFactorApi', () => ({
  fetchTwoFactorStatus: vi.fn(),
  startTwoFactorSetup: vi.fn(),
  confirmTwoFactorSetup: vi.fn(),
  disableTwoFactor: vi.fn(),
  regenerateRecoveryCodes: vi.fn(),
  verifyTwoFactor: vi.fn(),
}))
vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn() } }))

import TwoFactorSection from './TwoFactorSection'

const render = (isA: boolean) =>
  renderToStaticMarkup(React.createElement(TwoFactorSection, { isA }))

describe('TwoFactorSection', () => {
  it('mặc định thu gọn — không đẩy nội dung 2FA vào mặt người dùng', () => {
    const html = render(true)
    expect(html).toContain('aria-expanded="false"')
    // Nội dung chi tiết chỉ render sau khi mở.
    expect(html).not.toContain('Bật xác thực hai bước')
  })

  it('nói rõ 2FA là TUỲ CHỌN — không doạ người chưa bật', () => {
    const html = render(true)
    expect(html).toContain('tuỳ chọn, không bắt buộc')
    // Không có ngôn ngữ cảnh báo/khiếm khuyết ở trạng thái chưa bật.
    for (const word of ['nguy hiểm', 'không an toàn', 'cảnh báo', 'bắt buộc bật']) {
      expect(html).not.toContain(word)
    }
  })

  it('song ngữ theo chiều học', () => {
    expect(render(true)).toContain('Xác thực hai bước')
    expect(render(false)).toContain('Two-factor authentication')
    expect(render(false)).toContain('optional, not required')
  })

  it('nút mở/đóng đạt vùng chạm 44px (CLAUDE.md mục 4.7)', () => {
    expect(render(true)).toContain('tap-44')
  })
})
