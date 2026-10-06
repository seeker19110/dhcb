// EnglishHome.test.tsx — cổng canh slice 02 (spec §④ AC-1, AC-8): trang tổng quan môn Tiếng Anh
// tại /goc-hoc-tap/english là MỘT MÔN (tiêu đề "Tiếng Anh", không còn "Không Gian"), và đủ 5
// công cụ của ENGLISH_CHILDREN (navTree.ts) có nút ở trang này.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import EnglishHome from './EnglishHome'
import { ENGLISH_CHILDREN } from '../../../lib/navTree'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const layoutProps = vi.hoisted(() => ({ last: {} as Record<string, unknown> }))
vi.mock('../../../components/Layout.js', () => ({
  default: (props: Record<string, unknown>) => {
    layoutProps.last = props
    return null
  },
}))
vi.mock('../../../components/PricePromoBanner.js', () => ({ default: () => null }))
vi.mock('../../../components/RewardTipBanner.js', () => ({ default: () => null }))
vi.mock('../../../context/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'An', onboarded: true, plan: 'free' },
    isGuest: false,
  }),
}))
vi.mock('../../../lib/useCloudSync', () => ({ useCloudSync: () => ({ synced: true }) }))
vi.mock('../../../data/cefrLoader', () => ({ loadCefr: async () => [] }))
vi.mock('../../../data/curriculumLoader', () => ({ loadFoundation: async () => [] }))

describe('EnglishHome — trang tổng quan môn Tiếng Anh', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    localStorage.clear()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  async function hien() {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/goc-hoc-tap/english']}>
          <Routes>
            <Route path="/goc-hoc-tap/english" element={<EnglishHome />} />
          </Routes>
        </MemoryRouter>,
      )
    })
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
  }

  it('tiêu đề là tên MÔN, không còn "Không Gian Tiếng Anh"/"English Studio"', async () => {
    await hien()
    expect(layoutProps.last.title).toBe('Tiếng Anh')
    expect(container.textContent).not.toContain('Không Gian')
    expect(container.textContent).not.toContain('English Studio')
  })

  it('đủ 12 công cụ của ENGLISH_CHILDREN + Cài đặt môn có nút bấm trên trang (AC-8 / 03 AC-3.6)', async () => {
    await hien()
    const buttons = Array.from(container.querySelectorAll('button')).map((b) => b.textContent ?? '')
    const expected: Record<string, RegExp> = {
      '/goc-hoc-tap/english/lo-trinh': /Lộ trình|CEFR/i,
      '/goc-hoc-tap/english/bai-hoc': /Ngữ Pháp|Bài học/i,
      '/goc-hoc-tap/english/tro-truyen': /Trò chuyện|Chat/i,
      '/goc-hoc-tap/english/luyen-noi': /Luyện nói|Speaking/i,
      '/goc-hoc-tap/english/luyen-viet': /Luyện viết|Writing/i,
      '/goc-hoc-tap/english/luyen-nghe': /Luyện nghe|Listening/i,
      '/goc-hoc-tap/english/tu-dien': /Từ điển|Dictionary/i,
      '/goc-hoc-tap/english/cau-thong-dung': /Câu thông dụng|Mẫu câu/i,
      '/goc-hoc-tap/english/truyen': /Truyện/i,
      '/goc-hoc-tap/english/so-tay-loi-sai': /Lỗi sai|Sổ Lỗi/i,
      '/goc-hoc-tap/english/on-thi': /Ôn thi/i,
      '/goc-hoc-tap/english/thu-thach': /Thử thách|Challenge/i,
    }
    for (const child of ENGLISH_CHILDREN) {
      const re = expected[child.to ?? '']
      expect(re, `chưa khai kỳ vọng cho ${child.to}`).toBeDefined()
      expect(
        buttons.some((t) => re!.test(t)),
        `thiếu nút tới ${child.to}`,
      ).toBe(true)
    }
  })

  // [U9b, audit 2026-09-30 M19] Người chọn "10 phút" ở onboarding thấy "0 / 10", không "0 / 50".
  it('mục tiêu từ vựng trong ngày theo tốc độ đã chọn, không theo trần 5 lượt', async () => {
    localStorage.setItem('et_speed_u1', '10')
    await hien()
    const text = container.textContent ?? ''
    expect(text).toMatch(/Mục tiêu hôm nay:\s*0\s*\/\s*10 từ vựng/)
    expect(text).not.toMatch(/\/\s*50 từ vựng/)
  })
})
