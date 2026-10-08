// [S09b] Mục "Trong bài" của trang bài STEM — contract §2.3 và AC01–AC03, AC07 của
// docs/specs/2026-09-23-uiux-s09-s12-trai-nghiem-va-nghiem-thu.md.
//
// Dựng CẢ trang thật (router + loader thật) vì các lỗi cần canh nằm ở khe giữa panel và trang:
// panel đóng xong trả focus về nút mở đè lên đích vừa chọn, bấm lại cùng đích sinh history thừa,
// nhảy mục làm mất nháp hoặc bắn request nộp bài.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
  type Location,
  type NavigateFunction,
} from 'react-router-dom'
import { PHYSICS_LOADER } from '@dhcb/subject-physics/lessonsLoader'
import StemLessonView from './StemLessonView'
import { AuthContext } from '../../context/authContext'
import { __resetSessionMemory } from '../../lib/learningSession'
import type { User } from '../../types'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)

vi.mock('../../components/Layout', () => ({ default: () => null }))

// Bài dài có hoạt ảnh (ba câu) và bài ngắn không hoạt ảnh (hai câu) — hai hình dạng section.
const BAI_DAI = '/goc-hoc-tap/physics/bai-hoc/ly10-c2-b10--su-roi-tu-do'
const BAI_NGAN = '/goc-hoc-tap/physics/bai-hoc/ly10-c1-b1'
const NGUOI: User = { id: 'u-42', email: 'a@b.c', name: 'A', plan: 'free', onboarded: true }

let navigate: NavigateFunction
let viTri: Location
function DieuHuong() {
  const go = useNavigate()
  const loc = useLocation()
  useEffect(() => {
    navigate = go
    viTri = loc
  }, [go, loc])
  return null
}

/** Giả lập bề rộng: `useIsDesktopViewport` đọc `(min-width: 1024px)` qua matchMedia. */
function datManHinh(desktop: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: desktop && query.includes('min-width: 1024px'),
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  )
}

describe('[S09b] Trong bài — trang bài STEM', { timeout: 20_000 }, () => {
  // Mỗi ca DỰNG CẢ TRANG THẬT (router + loader thật) rồi thao tác nhiều bước, React bản dev +
  // happy-dom: lỗi cần canh nằm ở khe panel ↔ trang, nên không cắt bớt được. Đo 2026-10-08
  // (changelog 0532), ca nặng nhất: 0,71 s chạy riêng · 0,74 s dưới đo coverage V8 · 1,80 s
  // coverage + máy tải ~25. Trong `test:coverage` toàn bộ trên máy tải 14–23 các ca này chạm
  // ngưỡng 5 s mặc định (mỗi lần một ca khác) → nới 20 s cho riêng describe này. Bài học nạp
  // MỘT lần ở `beforeAll` (loader vốn cache theo chương — đặt trong `beforeEach` chỉ là chờ
  // thừa mỗi ca).
  let container: HTMLDivElement
  let root: Root
  let posts: number

  beforeAll(async () => {
    await PHYSICS_LOADER.loadLesson('ly10-c2-b10')
    await PHYSICS_LOADER.loadLesson('ly10-c1-b1')
  })

  beforeEach(() => {
    localStorage.clear()
    __resetSessionMemory()
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {})
    posts = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => {
        if (init?.method === 'POST') posts += 1
        return new Response('{}', { status: 404 })
      }),
    )
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  async function mo(duongDan: string, desktop: boolean) {
    datManHinh(desktop)
    await act(async () => {
      root.render(
        <AuthContext.Provider
          value={{
            user: NGUOI,
            loading: false,
            isGuest: false,
            refresh: async () => {},
            refreshVerified: async () => {
              throw new Error('Không dùng trong fixture này')
            },
          }}
        >
          <MemoryRouter initialEntries={[duongDan]}>
            <DieuHuong />
            <Routes>
              <Route
                path="/goc-hoc-tap/:subjectId/bai-hoc/:lessonSlug"
                element={<StemLessonView />}
              />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>,
      )
    })
  }

  const nav = () => container.querySelector<HTMLElement>('nav[aria-label="Trong bài"]')
  const linkMuc = (nhan: string) =>
    [...(nav()?.querySelectorAll<HTMLAnchorElement>('a') ?? [])].find(
      (a) => a.textContent?.trim() === nhan,
    )!
  const nutTrongBai = () =>
    [...container.querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => b.textContent?.trim() === 'Trong bài',
    )!
  const bam = async (el: HTMLElement) => {
    await act(async () => el.click())
  }

  it('desktop: danh sách hiện sẵn ở đầu nội dung, đúng thứ tự, có hoạt ảnh', async () => {
    await mo(BAI_DAI, true)
    expect(nav()).toBeTruthy()
    expect(nutTrongBai()).toBeUndefined()
    const nhan = [...nav()!.querySelectorAll('a')].map((a) => a.textContent?.trim())
    expect(nhan).toEqual([
      'Đầu bài',
      'Lý thuyết',
      'Hoạt ảnh minh hoạ',
      'Ví dụ mẫu',
      'Tự kiểm tra',
      'Kết quả',
      'Thẻ ôn tập',
    ])
    // Mỗi link trỏ đúng neo cố định, và đích tồn tại, focus được bằng mã lệnh.
    for (const a of nav()!.querySelectorAll('a')) {
      const id = a.getAttribute('href')!.slice(1)
      const dich = document.getElementById(id)
      expect(dich, id).toBeTruthy()
      expect(dich!.getAttribute('tabindex')).toBe('-1')
      expect(/^H[12]$/.test(dich!.tagName)).toBe(true)
    }
    // Nhãn "Trong bài" khác hẳn mục lục môn.
    expect(nav()!.getAttribute('aria-label')).not.toBe('Mục lục môn học')
  })

  it('bài không có hoạt ảnh thì không có mục Hoạt ảnh, #hoat-anh về tiêu đề bài', async () => {
    await mo(`${BAI_NGAN}#hoat-anh`, true)
    expect(linkMuc('Hoạt ảnh minh hoạ')).toBeUndefined()
    expect(document.getElementById('hoat-anh')).toBeNull()
    expect(document.activeElement?.tagName).toBe('H1')
  })

  it('chọn đích khác thêm ĐÚNG MỘT history entry, chọn lại cùng đích không thêm; Back về đầu bài', async () => {
    await mo(`${BAI_DAI}?tu=so-loi`, true)
    expect(document.activeElement).toBe(document.body) // mở bình thường: giữ hành vi cũ

    await bam(linkMuc('Lý thuyết'))
    expect(document.activeElement?.id).toBe('ly-thuyet')
    expect(viTri.pathname).toBe('/goc-hoc-tap/physics/bai-hoc/ly10-c2-b10--su-roi-tu-do')
    expect(viTri.search).toBe('?tu=so-loi')
    expect(viTri.hash).toBe('#ly-thuyet')

    // Bấm lại CÙNG đích: vẫn đưa focus về đích (người dùng đã cuộn đi chỗ khác)…
    ;(document.activeElement as HTMLElement).blur()
    await bam(linkMuc('Lý thuyết'))
    expect(document.activeElement?.id).toBe('ly-thuyet')

    // …nhưng không có entry thừa: một lần Back là về đúng entry đầu bài.
    await act(async () => navigate(-1))
    expect(viTri.hash).toBe('')
    expect(viTri.search).toBe('?tu=so-loi')
    expect(document.activeElement?.tagName).toBe('H1')

    // Forward không ghi thêm entry và vẫn đưa về đích.
    await act(async () => navigate(1))
    expect(viTri.hash).toBe('#ly-thuyet')
    expect(document.activeElement?.id).toBe('ly-thuyet')
  })

  it('mobile: nút Trong bài mở danh sách; Escape và nút đóng trả focus về nút mở', async () => {
    await mo(BAI_DAI, false)
    const nut = nutTrongBai()
    expect(nut.getAttribute('aria-expanded')).toBe('false')
    expect(nav()).toBeNull() // nội dung đóng không nhận focus: không nằm trong DOM

    await bam(nut)
    expect(nut.getAttribute('aria-expanded')).toBe('true')
    expect(nav()).toBeTruthy()
    expect(nut.getAttribute('aria-controls')).toBe(nav()!.id)
    expect(document.activeElement?.textContent?.trim()).toBe('Đầu bài')

    await act(async () => {
      document.activeElement!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      )
    })
    expect(nav()).toBeNull()
    expect(document.activeElement).toBe(nut)

    await bam(nut)
    const dong = [...nav()!.querySelectorAll('button')].find((b) => b.textContent === 'Đóng')!
    await bam(dong)
    expect(nav()).toBeNull()
    expect(document.activeElement).toBe(nut)
  })

  it('mobile: chọn đích thì đóng danh sách rồi focus ĐÍCH, không bị trả về nút mở', async () => {
    await mo(BAI_DAI, false)
    await bam(nutTrongBai())
    await bam(linkMuc('Kết quả'))
    expect(nav()).toBeNull()
    expect(document.activeElement?.id).toBe('ket-qua')
    expect(viTri.hash).toBe('#ket-qua')
  })

  it('#ket-qua luôn có: trước khi nộp báo chưa có kết quả, không giả điểm, link về Tự kiểm tra', async () => {
    await mo(`${BAI_DAI}#ket-qua`, true)
    const h = document.getElementById('ket-qua')!
    expect(document.activeElement).toBe(h)
    expect(h.textContent).toBe('Kết quả')
    const vung = h.parentElement!.textContent ?? ''
    expect(vung).toContain('Chưa có kết quả lượt nộp trong lần mở bài này')
    expect(container.querySelector('section[aria-label="Kết quả lượt nộp"]')).toBeNull()
    expect(vung).not.toMatch(/\d+\s*\/\s*\d+/) // không có điểm giả kiểu 0/3

    const veTuKiem = [...container.querySelectorAll<HTMLAnchorElement>('a[href="#tu-kiem"]')].find(
      (a) => !nav()?.contains(a),
    )!
    await bam(veTuKiem)
    expect(document.activeElement?.id).toBe('tu-kiem')
    expect(viTri.hash).toBe('#tu-kiem')
  })

  it('nhảy mục không đổi nháp, không gửi request nộp/chấm nào', async () => {
    await mo(BAI_DAI, true)
    const lua = container.querySelector('#cau-1')!.parentElement!.querySelector('button')!
    await bam(lua)
    expect(lua.getAttribute('aria-pressed')).toBe('true')

    for (const nhan of ['Lý thuyết', 'Kết quả', 'Tự kiểm tra', 'Thẻ ôn tập']) {
      await bam(linkMuc(nhan))
    }
    await act(async () => navigate(-1))
    expect(lua.getAttribute('aria-pressed')).toBe('true')
    expect(posts).toBe(0)
    // Không có màn kết quả nào tự dựng ra từ nháp.
    expect(container.querySelector('section[aria-label="Kết quả lượt nộp"]')).toBeNull()
  })

  // Bắt được thật ở E2E 1440px: bấm "Kết quả" hai lần liên tiếp trước khi React kịp render
  // location mới → lần hai so với hash CŨ và đẩy thêm một entry trùng. Hai cú bấm trong CÙNG
  // một `act` tái hiện đúng khe đó (React chưa render lại giữa hai cú).
  it('bấm cùng đích hai lần liên tiếp trước khi trang kịp render lại vẫn chỉ một entry', async () => {
    await mo(BAI_DAI, true)
    const link = linkMuc('Kết quả')
    await act(async () => {
      link.click()
      link.click()
    })
    expect(viTri.hash).toBe('#ket-qua')
    expect(document.activeElement?.id).toBe('ket-qua')
    await act(async () => navigate(-1))
    expect(viTri.hash).toBe('')
  })

  it('chuyển sang bài khác kèm hash: focus nằm trong bài MỚI, không phải DOM bài cũ', async () => {
    await mo(`${BAI_DAI}#ly-thuyet`, true)
    expect(document.activeElement?.id).toBe('ly-thuyet')
    await act(async () => navigate(`${BAI_NGAN}#vi-du`))
    expect(document.activeElement?.id).toBe('vi-du')
    expect(container.querySelector('h1')?.textContent).toContain('Làm quen với Vật lí')
    // Bài ngắn không có câu 3 → về tiêu đề bài mới.
    await act(async () => navigate(`${BAI_NGAN}#cau-3`))
    expect(document.activeElement?.tagName).toBe('H1')
    expect(document.activeElement?.textContent).toContain('Làm quen với Vật lí')
  })
})
