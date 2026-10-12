// MemoryConsentCard.test.tsx — thanh ký ức gọn: mời bật khi công tắc tắt, công tắc phiên tạm
// role="switch", mô tả đổi khi đang bật (GĐ2a).
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import MemoryConsentCard, { COMPANION_MEMORY_PATH } from './MemoryConsentCard'

function html(over: Partial<React.ComponentProps<typeof MemoryConsentCard>> = {}) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <MemoryConsentCard
        settings={{ rememberMemories: false, useHistory: false, suggestMemories: false }}
        ephemeral={false}
        onEphemeralChange={vi.fn()}
        onEnableMemory={vi.fn(async () => {})}
        {...over}
      />
    </MemoryRouter>,
  )
}

describe('MemoryConsentCard', () => {
  it('công tắc tắt → mời bật ký ức + nút; có switch phiên tạm và link trang ký ức', () => {
    const out = html()
    expect(out).toContain('Chưa nhớ gì giữa các lần trò chuyện')
    expect(out).toContain('Bật ký ức')
    expect(out).toContain('role="switch"')
    expect(out).toContain('aria-checked="false"')
    expect(out).toContain(`href="${COMPANION_MEMORY_PATH}"`)
  })

  it('đang bật phiên tạm → mô tả cảnh báo hiện rõ, KHÔNG mời bật ký ức', () => {
    const out = html({ ephemeral: true })
    expect(out).toContain('aria-checked="true"')
    expect(out).toContain('Đang bật: lượt này không đọc ký ức')
    expect(out).not.toContain('Bật ký ức')
  })

  it('ký ức đã bật hoặc chưa tải được cài đặt → không mời; đang bật → nút "Đang bật…" bị khoá', () => {
    expect(
      html({ settings: { rememberMemories: true, useHistory: true, suggestMemories: false } }),
    ).not.toContain('Bật ký ức')
    expect(html({ settings: null })).not.toContain('Bật ký ức')
    const busy = html({ enabling: true })
    expect(busy).toContain('Đang bật…')
    expect(busy).toContain('disabled=""')
  })
})
