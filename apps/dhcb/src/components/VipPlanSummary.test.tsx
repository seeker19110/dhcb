// Test khối "Gói của bạn" ở /nang-cap cho VIP (audit M8, đợt U5): hạn dùng thật, lượt AI hôm nay
// đọc từ server (có trạng thái tải/lỗi/thử lại, không bịa số) và quyền lợi gói.
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WeeklyCreditInfo } from '../lib/weeklyCredit'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const mocks = vi.hoisted(() => ({
  fetchWeeklyCredit: vi.fn<() => Promise<WeeklyCreditInfo | null>>(),
}))
vi.mock('../lib/weeklyCredit', () => ({ fetchWeeklyCredit: mocks.fetchWeeklyCredit }))
// Chưa nạp nội dung gói từ server → PlanFeatureCard dùng nội dung mặc định trong mã.
vi.mock('../lib/planMarketing', () => ({ getPlanMarketing: () => null }))

import VipPlanSummary from './VipPlanSummary'

let container: HTMLDivElement
let root: Root

async function render(planExpiresAt: string | null | undefined, isA = true) {
  await act(async () => {
    root.render(
      <MemoryRouter>
        <VipPlanSummary isA={isA} planExpiresAt={planExpiresAt} />
      </MemoryRouter>,
    )
  })
}

beforeEach(() => {
  mocks.fetchWeeklyCredit.mockReset()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('VipPlanSummary', () => {
  it('VIP vĩnh viễn: nói rõ "Vĩnh viễn", hiện lượt đã dùng x/300 và quyền lợi gói', async () => {
    mocks.fetchWeeklyCredit.mockResolvedValue({
      plan: 'vip',
      freeWeeklyCredit: 288,
      freeWeeklyCap: 300,
    })
    await render(null)
    const text = container.textContent ?? ''
    expect(text).toContain('Gói của bạn: VIP')
    expect(text).toContain('Vĩnh viễn')
    expect(text).toContain('Đã dùng 12/300 lượt — còn 288 lượt')
    expect(text).toContain('Quyền lợi của gói')
    expect(text).toContain('Đang dùng')
    expect(text).not.toMatch(/undefined|NaN|Invalid Date/)
  })

  it('VIP có hạn: hiện ngày hết hạn theo giờ Việt Nam', async () => {
    mocks.fetchWeeklyCredit.mockResolvedValue({
      plan: 'vip',
      freeWeeklyCredit: 300,
      freeWeeklyCap: 300,
    })
    await render('2026-12-31T16:00:00.000Z')
    expect(container.textContent).toContain('Còn hạn đến hết ngày 31/12/2026.')
    expect(container.textContent).not.toContain('Vĩnh viễn')
  })

  it('phiên thiếu trường planExpiresAt → nói trung tính, KHÔNG hứa vĩnh viễn', async () => {
    mocks.fetchWeeklyCredit.mockResolvedValue({
      plan: 'vip',
      freeWeeklyCredit: 1,
      freeWeeklyCap: 300,
    })
    await render(undefined)
    expect(container.textContent).toContain('Đang có hiệu lực.')
    expect(container.textContent).not.toContain('Vĩnh viễn')
  })

  it('đang tải: nói bằng chữ, không hiện số giả', async () => {
    mocks.fetchWeeklyCredit.mockReturnValue(new Promise(() => {}))
    await render(null)
    expect(container.textContent).toContain('Đang tải lượt AI…')
    expect(container.textContent).not.toMatch(/Đã dùng/)
  })

  it('lỗi tải lượt: báo lỗi thật (không bịa số), Thử lại gọi lại server', async () => {
    mocks.fetchWeeklyCredit.mockResolvedValueOnce(null).mockResolvedValueOnce({
      plan: 'vip',
      freeWeeklyCredit: 100,
      freeWeeklyCap: 300,
    })
    await render(null)
    expect(container.textContent).toContain('Chưa tải được lượt AI hôm nay.')
    expect(container.textContent).not.toMatch(/Đã dùng/)
    const retry = [...container.querySelectorAll('button')].find((b) =>
      /Thử lại/.test(b.textContent ?? ''),
    )
    expect(retry).toBeDefined()
    await act(async () => retry!.click())
    expect(mocks.fetchWeeklyCredit).toHaveBeenCalledTimes(2)
    expect(container.textContent).toContain('Đã dùng 200/300 lượt')
  })

  it('tiếng Anh khi giao diện là tiếng Anh', async () => {
    mocks.fetchWeeklyCredit.mockResolvedValue({
      plan: 'vip',
      freeWeeklyCredit: 290,
      freeWeeklyCap: 300,
    })
    await render(null, false)
    expect(container.textContent).toContain('Your plan: VIP')
    expect(container.textContent).toContain('Lifetime')
    expect(container.textContent).toContain('Used 10/300')
  })
})
