// ExamPlan.loadError.test.tsx — trang Ôn thi: lỗi tải KHÔNG được giả làm "chưa có kế hoạch"
// (hiện form tạo mới + đặt lại mức nhớ FSRS) — changelog 0525.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import ExamPlanPage from './ExamPlan'
import { LangProvider } from '../../context/LangProvider'
import type { ExamPlan } from '@dhcb/core-contracts/examPlan'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const fetchExamPlan = vi.fn<() => Promise<ExamPlan | null>>()
const endExamPlan = vi.fn<(id: string) => Promise<boolean>>()
const setExamRetention = vi.fn()
const toastError = vi.fn()

vi.mock('../../lib/examPlan', () => ({
  fetchExamPlan: () => fetchExamPlan(),
  createExamPlan: vi.fn(),
  endExamPlan: (id: string) => endExamPlan(id),
  computeTodayPlan: () => ({
    examDate: '2026-12-01',
    daysLeft: 30,
    masteredItems: 1,
    scopeItems: 10,
    feasibility: 'ok',
    suggestedScopeCut: null,
    requestRetention: 0.93,
    phase: 'learn',
    todayNewItems: 0,
    todayReviewItems: 0,
  }),
  getExamScopeWords: () => [],
  suggestedDailyCap: () => 10,
  examKindForDirection: () => 'vao10',
}))
vi.mock('../../lib/srs', () => ({ setExamRetention: (...a: unknown[]) => setExamRetention(...a) }))
vi.mock('../../components/Layout', () => ({ default: () => null }))
vi.mock('../../context/useAuth', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }))
vi.mock('@core/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: toastError, info: vi.fn() }),
}))

let container: HTMLDivElement
let root: Root

async function flush() {
  await act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve()
  })
}

async function render() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <LangProvider>
        <MemoryRouter>
          <ExamPlanPage />
        </MemoryRouter>
      </LangProvider>,
    ),
  )
  await flush()
}

const button = (text: string) =>
  [...container.querySelectorAll('button')].find((b) => b.textContent?.includes(text)) as
    HTMLButtonElement | undefined

beforeEach(() => {
  fetchExamPlan.mockReset()
  endExamPlan.mockReset()
  setExamRetention.mockReset()
  toastError.mockReset()
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

describe('ExamPlan — lỗi tải', () => {
  it('lỗi → khối lỗi + Thử lại, KHÔNG hiện form tạo mới, KHÔNG đặt lại mức nhớ FSRS', async () => {
    fetchExamPlan.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await render()
    const alert = container.querySelector('[role="alert"]')
    expect(alert?.textContent).toContain('Không kết nối được máy chủ')
    expect(alert?.textContent).toContain('Kế hoạch ôn thi của bạn vẫn còn nguyên')
    expect(container.querySelector('input[type="date"]')).toBeNull()
    expect(setExamRetention).not.toHaveBeenCalled()

    fetchExamPlan.mockResolvedValueOnce(null)
    await act(async () => button('Thử lại')?.click())
    await flush()
    expect(container.querySelector('[role="alert"]')).toBeNull()
    // Thật sự chưa có kế hoạch → lúc này mới hiện form và trả mức nhớ về mặc định.
    expect(container.querySelector('input[type="date"]')).not.toBeNull()
    expect(setExamRetention).toHaveBeenCalledWith('u1', null)
  })

  it('kết thúc kế hoạch thất bại → báo lỗi, kế hoạch vẫn hiện', async () => {
    fetchExamPlan.mockResolvedValue({ id: 'p1', targetLabel: null } as unknown as ExamPlan)
    endExamPlan.mockResolvedValue(false)
    await render()
    await act(async () => button('Kết thúc kế hoạch này')?.click())
    await flush()
    expect(toastError).toHaveBeenCalledWith(
      'Chưa kết thúc được kế hoạch — kiểm tra kết nối rồi thử lại.',
    )
    expect(button('Kết thúc kế hoạch này')).toBeDefined()
  })
})
