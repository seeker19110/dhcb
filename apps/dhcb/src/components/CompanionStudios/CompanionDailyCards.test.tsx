// CompanionDailyCards.test.tsx — "Thẻ hôm nay" (GĐ4a, changelog 0629): đủ ba trạng thái
// tải/lỗi/rỗng, thẻ "Đã xong", 👍/👎 có aria-pressed + câu xác nhận, lỗi lưu thì hoàn tác.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import type { CompanionDailyCard } from '@dhcb/core-contracts/companionDailyCards'
import CompanionDailyCards from './CompanionDailyCards'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const api = vi.hoisted(() => ({
  fetchCompanionDailyCards: vi.fn(),
  sendCompanionCardFeedback: vi.fn(),
}))
vi.mock('../../lib/companionCardsApi', () => api)

const OPEN: CompanionDailyCard = {
  id: '33333333-3333-4333-8333-333333333333',
  kind: 'review_due',
  title: 'Ôn thẻ đến hạn',
  body: 'Có 5 thẻ đã đến hạn ôn hôm nay.',
  route: '/goc-hoc-tap/on-tap',
  actionLabel: 'Ôn ngay',
  status: 'open',
  feedback: null,
}
const DONE: CompanionDailyCard = {
  ...OPEN,
  id: '44444444-4444-4444-8444-444444444444',
  kind: 'due_tasks',
  title: 'Việc đến hạn trong Ghi chú',
  body: 'Không còn việc nào đến hạn hôm nay.',
  route: '/ghi-chu',
  actionLabel: 'Mở Ghi chú',
  status: 'done',
  feedback: 'up',
}

describe('CompanionDailyCards', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    api.fetchCompanionDailyCards.mockReset()
    api.sendCompanionCardFeedback.mockReset()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })
  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  async function flush() {
    await act(async () => {
      for (let i = 0; i < 6; i++) await Promise.resolve()
    })
  }
  async function render() {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <CompanionDailyCards />
        </MemoryRouter>,
      )
    })
    await flush()
  }
  const text = () => container.textContent ?? ''
  const button = (name: string, card = OPEN) =>
    [
      ...(container
        .querySelector(`[data-kind="${card.kind}"]`)
        ?.querySelectorAll<HTMLButtonElement>('button') ?? []),
    ].find((b) => b.textContent?.trim() === name)

  it('đang tải → khung chờ aria-busy', async () => {
    api.fetchCompanionDailyCards.mockReturnValue(new Promise(() => {}))
    await render()
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it('lỗi → câu báo + Thử lại tải lại được', async () => {
    api.fetchCompanionDailyCards.mockRejectedValueOnce(new Error('Lỗi tải thẻ hôm nay: 500'))
    await render()
    expect(text()).toContain('Không tải được dữ liệu')
    api.fetchCompanionDailyCards.mockResolvedValueOnce({ day: '2026-10-12', cards: [OPEN] })
    const retry = [...container.querySelectorAll('button')].find((b) =>
      /Thử lại/.test(b.textContent ?? ''),
    )
    expect(retry).toBeTruthy()
    await act(async () => retry?.click())
    await flush()
    expect(text()).toContain('Có 5 thẻ đã đến hạn ôn hôm nay.')
  })

  it('rỗng → nói thật là hôm nay chưa có thẻ, không bịa', async () => {
    api.fetchCompanionDailyCards.mockResolvedValue({ day: '2026-10-12', cards: [] })
    await render()
    expect(text()).toContain('Hôm nay chưa có thẻ nào')
    expect(container.querySelectorAll('[data-testid="daily-card"]')).toHaveLength(0)
  })

  it('thẻ đã xong có nhãn "Đã xong"; phản hồi cũ hiện đúng aria-pressed', async () => {
    api.fetchCompanionDailyCards.mockResolvedValue({ day: '2026-10-12', cards: [OPEN, DONE] })
    await render()
    const done = container.querySelector('[data-kind="due_tasks"]')
    expect(done?.textContent).toContain('Đã xong')
    expect(container.querySelector('[data-kind="review_due"]')?.textContent).not.toContain(
      'Đã xong',
    )
    expect(button('Hữu ích', DONE)?.getAttribute('aria-pressed')).toBe('true')
    const link = container.querySelector<HTMLAnchorElement>('[data-kind="review_due"] a')
    expect(link?.getAttribute('href')).toBe('/goc-hoc-tap/on-tap')
  })

  it('👎 → aria-pressed + câu "7 ngày tới…", gọi API đúng thẻ', async () => {
    api.fetchCompanionDailyCards.mockResolvedValue({ day: '2026-10-12', cards: [OPEN] })
    api.sendCompanionCardFeedback.mockResolvedValue({ cardId: OPEN.id, feedback: 'down' })
    await render()
    await act(async () => button('Không hữu ích')?.click())
    await flush()
    expect(api.sendCompanionCardFeedback).toHaveBeenCalledWith(OPEN.id, 'down')
    expect(button('Không hữu ích')?.getAttribute('aria-pressed')).toBe('true')
    expect(text()).toContain('7 ngày tới mình sẽ không gợi ý loại thẻ này')
  })

  it('lưu phản hồi lỗi → hoàn tác lựa chọn + báo lỗi', async () => {
    api.fetchCompanionDailyCards.mockResolvedValue({ day: '2026-10-12', cards: [OPEN] })
    api.sendCompanionCardFeedback.mockRejectedValue(new Error('500'))
    await render()
    await act(async () => button('Hữu ích')?.click())
    await flush()
    expect(button('Hữu ích')?.getAttribute('aria-pressed')).toBe('false')
    expect(text()).toContain('Chưa lưu được phản hồi')
  })
})
