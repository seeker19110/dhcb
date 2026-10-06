// Test render khối "Học tiếp" của môn STEM (changelog 0505) — năm trạng thái người học thấy:
// đang tải · chưa học gì · đang học dở · đã học xong · lỗi tải.
//
// Luật số 1 cần canh: ĐANG TẢI không được nói "chưa học" (không đoán tên bài); LỖI TẢI coi như
// chưa có bằng chứng (gợi ý bài đầu, không khẳng định đã học gì).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import type { StemSubject } from '../../lib/stemLessonRoutes'
import type { StemCompletionCtx } from '../../lib/useStemCompletionState'
import StemContinueBlock from './StemContinueBlock'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// Tiến độ do từng ca đặt; hook thật cần AuthProvider + mạng nên thay bằng giá trị cố định.
let tienDo: Pick<StemCompletionCtx, 'state' | 'stateStatus'>
vi.mock('../../lib/useStemCompletionState', () => ({
  useStemCompletionState: () => tienDo,
}))

const BAI_LOP_10 = [
  { id: 'm10-1', title: 'Mệnh đề' },
  { id: 'm10-2', title: 'Tập hợp' },
]
const BAI_LOP_11 = [{ id: 'm11-1', title: 'Hàm số lượng giác' }]

// Môn giả: khối này chỉ gọi `listCoreByGrade`.
const MON_TOAN = {
  id: 'mathematics',
  label: 'Toán',
  grades: ['10', '11'],
  loader: {
    listCoreByGrade: (g: string) => (g === '10' ? BAI_LOP_10 : g === '11' ? BAI_LOP_11 : []),
  },
} as unknown as StemSubject

const MON_RONG = {
  ...MON_TOAN,
  loader: { listCoreByGrade: () => [] },
} as unknown as StemSubject

const dong = (status: 'completed' | 'in_progress', updatedAt: string) =>
  ({ status, updatedAt }) as never

function ViTri() {
  return <span data-testid="path">{useLocation().pathname}</span>
}

describe('StemContinueBlock', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  function hien(subject: StemSubject = MON_TOAN) {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/goc-hoc-tap/mathematics']}>
          <Routes>
            <Route
              path="*"
              element={
                <>
                  <StemContinueBlock subject={subject} />
                  <ViTri />
                </>
              }
            />
          </Routes>
        </MemoryRouter>,
      )
    })
    return {
      nut: container.querySelector('button'),
      duong: () => container.querySelector('[data-testid="path"]')?.textContent,
    }
  }

  it('đang tải: nhãn "Học tiếp", nút khoá, KHÔNG đoán tên bài', () => {
    tienDo = { state: new Map(), stateStatus: 'loading' }
    const { nut, duong } = hien()
    expect(container.textContent).toContain('Học tiếp')
    expect(container.querySelector('h2, h3')).toBeNull()
    expect(container.textContent).not.toContain('Mệnh đề')
    expect(container.textContent).not.toContain('Bắt đầu')
    expect(nut?.disabled).toBe(true)
    act(() => nut?.click())
    expect(duong()).toBe('/goc-hoc-tap/mathematics')
  })

  it('chưa học gì: nhãn "Bắt đầu", bài đầu của lớp thấp nhất, bấm thì vào bài', () => {
    tienDo = { state: new Map(), stateStatus: 'ready' }
    const { nut, duong } = hien()
    expect(container.textContent).toContain('Bắt đầu')
    expect(container.querySelector('h2')?.textContent).toBe('Mệnh đề')
    expect(container.textContent).toContain('Lớp 10')
    expect(nut?.textContent).toBe('Bắt đầu học')
    expect(nut?.querySelector('svg.lucide-play')).not.toBeNull()
    act(() => nut?.click())
    expect(duong()).toMatch(/^\/goc-hoc-tap\/mathematics\/bai-hoc\/m10-1/)
  })

  it('đang học dở: nhãn "Đang học dở", đúng bài dở, nút "Học tiếp"', () => {
    tienDo = {
      state: new Map([
        ['m10-1', dong('completed', '2026-10-01T00:00:00Z')],
        ['m10-2', dong('in_progress', '2026-10-02T00:00:00Z')],
      ]),
      stateStatus: 'ready',
    }
    const { nut, duong } = hien()
    expect(container.textContent).toContain('Đang học dở')
    expect(container.querySelector('h2')?.textContent).toBe('Tập hợp')
    expect(nut?.textContent).toBe('Học tiếp')
    act(() => nut?.click())
    expect(duong()).toMatch(/\/bai-hoc\/m10-2/)
  })

  it('đã học xong mọi bài: thông báo hoàn thành, nút về danh sách bài', () => {
    tienDo = {
      state: new Map(
        ['m10-1', 'm10-2', 'm11-1'].map((id) => [id, dong('completed', '2026-10-01T00:00:00Z')]),
      ),
      stateStatus: 'ready',
    }
    const { nut, duong } = hien()
    expect(container.textContent).toContain('Đã học xong')
    expect(container.querySelector('h2')?.textContent).toBe(
      'Bạn đã hoàn thành mọi bài chuẩn môn Toán',
    )
    expect(nut?.textContent).toBe('Xem lại danh sách bài')
    // Biểu tượng danh sách, không phải ▷ (lucide-play) vốn hợp với "bắt đầu".
    expect(nut?.querySelector('svg.lucide-list-checks')).not.toBeNull()
    expect(nut?.querySelector('svg.lucide-play')).toBeNull()
    act(() => nut?.click())
    expect(duong()).toBe('/goc-hoc-tap/mathematics/bai-hoc')
  })

  it('lỗi tải: coi như chưa có bằng chứng, gợi ý bài đầu, không khẳng định đã học gì', () => {
    tienDo = { state: new Map(), stateStatus: 'error' }
    const { nut } = hien()
    expect(container.textContent).toContain('Bắt đầu')
    expect(container.querySelector('h2')?.textContent).toBe('Mệnh đề')
    expect(container.textContent).not.toContain('Đã học xong')
    expect(container.textContent).not.toContain('Đang học dở')
    expect(nut?.disabled).toBe(false)
    // Phải có dòng báo lỗi (role=status) để không lẫn với "chưa học".
    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      'Chưa tải được tiến độ — đang gợi ý bài đầu tiên.',
    )
  })

  it('không báo lỗi khi tải xong bình thường', () => {
    tienDo = { state: new Map(), stateStatus: 'ready' }
    hien()
    expect(container.querySelector('[role="status"]')).toBeNull()
  })

  it('môn chưa có bài chuẩn: không dựng gì', () => {
    tienDo = { state: new Map(), stateStatus: 'ready' }
    hien(MON_RONG)
    expect(container.querySelector('section, button')).toBeNull()
  })
})
