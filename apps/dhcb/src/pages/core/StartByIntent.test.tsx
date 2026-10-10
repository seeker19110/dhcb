// StartByIntent.test.tsx — cổng canh S05-1: AC-4 (≤ 5 màn, bỏ qua được, bỏ hết vẫn có một việc),
// AC-5 (không mặc định tiếng Anh, `?mon=` chỉ nhận id hợp lệ), AC-10 (đã có ý định thì không hỏi
// lại) và bất biến T6 (màn gợi ý không lộ token `lv_*`/điểm/bậc).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import StartByIntent from './StartByIntent'
import { findIntentForbiddenLanguage } from '../../lib/intent/intentForbidden'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const authState = vi.hoisted(() => ({
  user: { id: 'guest_x', name: 'Khách', plan: 'free', isGuest: true } as {
    id: string
    name: string
    plan: string
    isGuest: boolean
  },
}))
vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({ user: authState.user, isGuest: authState.user.isGuest }),
}))
vi.mock('../../lib/analytics', () => ({ track: () => {} }))
// Cây mục lục thật cần tải dữ liệu chương trình học — ở test dựng cây rỗng để đo ĐÚNG phần
// luồng hỏi/đáp; luật chọn lá đã được `pickStartAction.test.ts` quét toàn bộ tổ hợp.
vi.mock('../../lib/intent/buildIntentOutlines', () => ({
  buildIntentOutlines: async () => new Map(),
}))

function chu(el: HTMLElement): string {
  return el.textContent ?? ''
}

describe('StartByIntent', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    localStorage.clear()
    authState.user = { id: 'guest_x', name: 'Khách', plan: 'free', isGuest: true }
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ intent: null }), { status: 200 })),
    )
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  })

  async function hien(url = '/bat-dau') {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[url]}>
          <StartByIntent />
        </MemoryRouter>,
      )
    })
    await act(async () => {})
  }

  function nut(ten: string): HTMLButtonElement | undefined {
    return [...container.querySelectorAll('button')].find((b) =>
      (b.textContent ?? '').includes(ten),
    ) as HTMLButtonElement | undefined
  }

  async function bam(el: Element | undefined) {
    await act(async () => {
      ;(el as HTMLButtonElement).click()
    })
  }

  it('AC-5 — mở ra KHÔNG ô môn nào được chọn sẵn (không mặc định tiếng Anh)', async () => {
    await hien()
    const oMon = [...container.querySelectorAll('[aria-pressed]')]
    expect(oMon.length).toBeGreaterThan(0)
    expect(oMon.every((o) => o.getAttribute('aria-pressed') === 'false')).toBe(true)
    expect(chu(container)).not.toContain('Bắt đầu: ')
  })

  it('AC-5 — `?mon=programming` tiền điền đúng một ô', async () => {
    await hien('/bat-dau?mon=programming')
    const chon = [...container.querySelectorAll('[aria-pressed="true"]')]
    expect(chon).toHaveLength(1)
    expect(chu(chon[0] as HTMLElement)).toContain('Lập trình')
  })

  it('AC-5 — `?mon=english-abc` / `?mon=` bị bỏ qua, không lỗi', async () => {
    for (const url of ['/bat-dau?mon=english-abc', '/bat-dau?mon=']) {
      await hien(url)
      expect(container.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0)
      act(() => root.unmount())
      container.remove()
      container = document.createElement('div')
      document.body.appendChild(container)
      root = createRoot(container)
    }
  })

  it('AC-4 — chấm chỉ VỊ TRÍ ("Bước x trên y"), không có "câu 3/10", không thanh điểm', async () => {
    await hien()
    const ol = container.querySelector('ol')
    expect(ol?.getAttribute('aria-label')).toMatch(/^Bước \d+ trên \d+$/)
    expect(chu(container)).not.toMatch(/\d+\s*\/\s*\d+/)
  })

  it('AC-4 — bỏ HẾT vẫn có đúng một nút "Bắt đầu" dẫn về danh mục môn', async () => {
    await hien()
    await bam(nut('Bỏ qua'))
    expect(chu(container)).toContain('Bắt đầu')
    const link = nut('Bắt đầu')
    expect(link).toBeTruthy()
    // Không lưu bản rỗng.
    expect(localStorage.getItem('dhcb_intent_guest_x')).toBeNull()
  })

  it('AC-4 — bước "lớp" chỉ hiện khi chọn môn STEM (4 bước với Lập trình, 5 với Toán)', async () => {
    await hien('/bat-dau?mon=programming')
    expect(container.querySelector('ol')?.getAttribute('aria-label')).toBe('Bước 1 trên 4')
    act(() => root.unmount())
    container.remove()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await hien('/bat-dau?mon=mathematics')
    expect(container.querySelector('ol')?.getAttribute('aria-label')).toBe('Bước 1 trên 5')
  })

  async function denBuocLop(mon: string) {
    await hien(`/bat-dau?mon=${mon}`)
    await bam(nut('Tiếp'))
    await bam(nut('Vì thích'))
    await bam(nut('10 phút'))
    await bam(nut('Mới bắt đầu'))
  }

  function cacLop(): string[] {
    return [...container.querySelectorAll('fieldset button')]
      .map((b) => b.textContent ?? '')
      .filter((t) => t.startsWith('Lớp'))
  }

  it('bước "lớp" có Lớp 6–9 khi chọn Toán, lưu được lớp THCS', async () => {
    await denBuocLop('mathematics,physics')
    expect(cacLop()).toEqual(['Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12'])
    await bam(nut('Lớp 8'))
    expect(JSON.parse(localStorage.getItem('dhcb_intent_guest_x') ?? '{}')).toMatchObject({
      subjectIds: ['mathematics', 'physics'],
      grade: '8',
    })
  })

  it('bước "lớp" KHÔNG có Lớp 6–9 khi chỉ chọn Lí/Hoá/Sinh (chưa có bài THCS)', async () => {
    await denBuocLop('physics')
    expect(cacLop()).toEqual(['Lớp 10', 'Lớp 11', 'Lớp 12'])
  })

  it('khách trả lời xong → lưu localStorage, KHÔNG gọi /api/learner-intent [AC-8/AC-11]', async () => {
    await hien('/bat-dau?mon=programming')
    await bam(nut('Tiếp'))
    await bam(nut('Vì thích'))
    await bam(nut('10 phút'))
    await bam(nut('Mới bắt đầu'))

    const luu = localStorage.getItem('dhcb_intent_guest_x')
    expect(luu).toBeTruthy()
    expect(JSON.parse(luu ?? '{}')).toMatchObject({
      subjectIds: ['programming'],
      purpose: 'so_thich',
      timeBudget: 10,
      level: 'lv_new',
    })
    const f = globalThis.fetch as unknown as { mock: { calls: unknown[][] } }
    expect(f.mock.calls.filter((c) => String(c[0]).includes('/api/'))).toHaveLength(0)
  })

  it('T6 — màn gợi ý KHÔNG lộ token lv_*, không "trình độ", không %, không x/100', async () => {
    await hien('/bat-dau?mon=programming')
    await bam(nut('Tiếp'))
    await bam(nut('Để thi cử'))
    await bam(nut('30 phút'))
    await bam(nut('Đã học khá lâu'))

    const text = chu(container)
    expect(text).not.toMatch(/lv_(new|some|solid)/)
    expect(findIntentForbiddenLanguage([text])).toEqual([])
  })

  it('AC-10 — đã có ý định thì vào thẳng màn gợi ý, có nút "Đổi ý định" mở lại 5 câu', async () => {
    localStorage.setItem(
      'dhcb_intent_guest_x',
      JSON.stringify({
        schemaVersion: 1,
        subjectIds: ['programming'],
        createdAt: 1_700_000_000_000,
        updatedAt: 1_700_000_000_000,
      }),
    )
    await hien()
    expect(chu(container)).toContain('Mình gợi ý bắt đầu từ đây nhé?')
    expect(container.querySelector('ol')).toBeNull()

    await bam(nut('Đổi ý định'))
    expect(container.querySelector('ol')).not.toBeNull()
    // Giá trị cũ điền sẵn.
    expect(container.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1)
  })

  it('AC-10 — TÀI KHOẢN: chỉ MỘT lượt GET /api/learner-intent khi mở trang', async () => {
    authState.user = { id: 'u-1', name: 'An', plan: 'free', isGuest: false }
    await hien()
    const f = globalThis.fetch as unknown as { mock: { calls: unknown[][] } }
    const gets = f.mock.calls.filter((c) => String(c[0]).includes('/api/learner-intent'))
    expect(gets).toHaveLength(1)
  })
})
