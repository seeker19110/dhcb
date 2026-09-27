// apps/dhcb/src/components/QuestsPanel.test.tsx — Canh 2 nhánh khi `fetchQuestsStatus` trả
// `null` (audit UI/UX P1-2): CHƯA đăng nhập → câu mời đăng nhập; ĐÃ đăng nhập mà API lỗi →
// khối lỗi chuẩn `LoadError`, không phải câu mời đăng nhập sai ngữ cảnh.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import QuestsPanel from './QuestsPanel'

const fetchQuestsStatus = vi.fn()
const getStoredToken = vi.fn()

vi.mock('../lib/quests', () => ({
  fetchQuestsStatus: () => fetchQuestsStatus(),
  claimStreakQuest: vi.fn(),
  claimCefrExamQuest: vi.fn(),
}))
vi.mock('@core/authHeader', () => ({
  getStoredToken: () => getStoredToken(),
}))
vi.mock('@core/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))
vi.mock('../lib/storage', () => ({ getStreak: () => 0 }))
vi.mock('../lib/vocab', () => ({ getLearnedCount: () => 0 }))

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

async function render(props: Parameters<typeof QuestsPanel>[0]) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root.render(<QuestsPanel {...props} />)
  })
  return container
}

describe('QuestsPanel — phân biệt chưa đăng nhập với lỗi tải', () => {
  beforeEach(() => {
    fetchQuestsStatus.mockReset()
    getStoredToken.mockReset()
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  it('chưa đăng nhập (không có token): hiện câu mời đăng nhập, không phải khối lỗi', async () => {
    fetchQuestsStatus.mockResolvedValue(null)
    getStoredToken.mockReturnValue(null) // khách — không có Authorization
    const el = await render({ isA: true })
    expect(el.textContent).toContain('Đăng nhập để xem nhiệm vụ nhé.')
    expect(el.textContent).not.toContain('Không tải được nhiệm vụ')
  })

  it('đã đăng nhập mà API lỗi: hiện khối lỗi chuẩn + nút Thử lại, không phải câu mời đăng nhập', async () => {
    fetchQuestsStatus.mockResolvedValue(null)
    getStoredToken.mockReturnValue('session:fixture')
    const el = await render({ isA: true })
    expect(el.textContent).toContain('Không tải được nhiệm vụ')
    expect(el.textContent).toContain('Nhiệm vụ và thưởng của bạn vẫn còn nguyên')
    expect(el.textContent).not.toContain('Đăng nhập để xem nhiệm vụ nhé.')
    const retryBtn = [...el.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Thử lại'),
    )
    expect(retryBtn).toBeDefined()
  })

  it('bấm Thử lại gọi lại fetchQuestsStatus', async () => {
    fetchQuestsStatus.mockResolvedValue(null)
    getStoredToken.mockReturnValue('session:fixture')
    const el = await render({ isA: true })
    expect(fetchQuestsStatus).toHaveBeenCalledTimes(1)
    const retryBtn = [...el.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Thử lại'),
    ) as HTMLButtonElement
    await act(async () => retryBtn.click())
    expect(fetchQuestsStatus).toHaveBeenCalledTimes(2)
  })

  it('payout bị tắt: giữ streak/chia sẻ, không hứa VIP hoặc hiện nút nhận thưởng', async () => {
    fetchQuestsStatus.mockResolvedValue({
      share: { cooldownDays: 7, rewardDays: 0, canClaim: false },
      streak: { current: 8, required: 5, rewardDays: 0, cooldownDays: 7, canClaim: false },
      cefrExams: [],
    })
    getStoredToken.mockReturnValue('session:fixture')
    const el = await render({ isA: true })
    expect(el.textContent).toContain('Chuỗi ngày học của bạn: 8 ngày.')
    expect(el.textContent).toContain('Mục này hiện không có thưởng VIP.')
    expect(el.textContent).not.toContain('Nhận thưởng')
    expect(el.textContent).not.toContain('+0 ngày')
    expect(el.textContent).toContain('Chia sẻ kết quả')
  })
})
