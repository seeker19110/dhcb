// [S11b] Tự thử lại câu STEM sai — docs/specs/2026-09-23-uiux-s09-s12-trai-nghiem-va-nghiem-thu.md §4.1.
//
// Lỗi canh: mở câu sai từ Sổ lỗi trên cùng máy thì đáp án cũ + lời giải hiện NGAY, người học
// không có lượt tự thử sạch. Dựng cả trang thật (nháp, router state, nút nộp) vì lỗi nằm ở khe
// giữa Sổ lỗi → history state → nháp của trang bài.
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
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
import type { StemLessonLike } from '@dhcb/core-contracts/stemLesson'
import StemLessonView from './StemLessonView'
import { duongDanBaiHoc } from '../../lib/stemLessonRoutes'
import { stateTuThuLai } from '../../lib/stemRetry'
import { AuthContext } from '../../context/authContext'
import { __resetSessionMemory } from '../../lib/learningSession'
import type { User } from '../../types'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)

vi.mock('../../components/Layout', () => ({ default: () => null }))

const BAI_ID = 'ly10-c2-b10'
const BAI_KHAC_ID = 'ly10-c2-b11'
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

describe('[S11b] tự thử lại câu STEM sai', { timeout: 20_000 }, () => {
  // Mỗi ca DỰNG CẢ TRANG THẬT 2–3 lần (mở → làm sai → mở lại kèm cờ), React bản dev +
  // happy-dom: đó là cách duy nhất bắt lỗi ở khe Sổ lỗi → history state → nháp, nên không cắt
  // bớt được. Đo 2026-10-08 (changelog 0532), ca nặng nhất: 0,64 s chạy riêng · 1,27 s dưới đo
  // coverage V8 · 2,18 s coverage + máy tải ~25. Trong `test:coverage` toàn bộ trên máy tải
  // 14–23 các ca này chạm ngưỡng 5 s mặc định (mỗi lần một ca khác) → nới 20 s cho riêng
  // describe này. Bài học nạp MỘT lần ở `beforeAll` (loader vốn cache theo chương — đặt trong
  // `beforeEach` chỉ là chờ thừa mỗi ca).
  let container: HTMLDivElement
  let root: Root
  let bai: StemLessonLike
  let baiKhac: StemLessonLike

  beforeAll(async () => {
    bai = (await PHYSICS_LOADER.loadLesson(BAI_ID))!
    baiKhac = (await PHYSICS_LOADER.loadLesson(BAI_KHAC_ID))!
  })

  beforeEach(() => {
    localStorage.clear()
    __resetSessionMemory()
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 404 })),
    )
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  async function mo(duongDan: { pathname: string; hash?: string; state?: unknown }) {
    act(() => root.unmount())
    root = createRoot(container)
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

  const duongDan = (b: StemLessonLike) => duongDanBaiHoc('physics', b.id, b.title)

  function khoiCau(i: number): HTMLElement {
    return container.querySelector(`#cau-${i + 1}`)!.parentElement!
  }
  function nutLuaChon(i: number, thuTu: number) {
    return khoiCau(i).querySelectorAll('ul button')[thuTu] as HTMLButtonElement
  }
  function nutTheoChu(chu: string, trong: ParentNode = container) {
    return [...trong.querySelectorAll('button')].find((b) => b.textContent?.includes(chu))
  }
  function go(i: number, giaTri: string) {
    const o = container.querySelector<HTMLInputElement>(`#tra-loi-${i + 1}`)!
    act(() => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(
        o,
        giaTri,
      )
      o.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }

  /** Lượt trước trên CÙNG máy: câu 1, 2 đúng, câu 3 chọn SAI ("Bi sắt"). */
  async function lamSaiCau3() {
    await mo({ pathname: duongDan(bai) })
    act(() => nutLuaChon(0, 0).click())
    go(1, '20 m/s')
    act(() => nutLuaChon(2, 0).click())
    expect(khoiCau(2).textContent).toContain('Chưa đúng.')
  }

  it('vào từ Sổ lỗi: ẩn đáp án cũ + lời giải, có nút xem lại; nháp không bị xoá', async () => {
    await lamSaiCau3()
    await mo({ pathname: duongDan(bai), hash: '#cau-3', state: stateTuThuLai(2) })

    const cau = khoiCau(2)
    expect(cau.textContent).toContain('câu trả lời lần trước đang được ẩn')
    expect(cau.textContent).not.toContain('Chưa đúng.')
    expect(cau.textContent).not.toContain(bai.checkQuestions[2]!.explain)
    expect(
      [...cau.querySelectorAll('ul button')].map((b) => b.getAttribute('aria-pressed')),
    ).toEqual(['false', 'false', 'false'])
    // Câu khác KHÔNG bị ảnh hưởng.
    expect(nutLuaChon(0, 0).getAttribute('aria-pressed')).toBe('true')

    act(() => nutTheoChu('Xem câu trả lời lần trước', cau)!.click())
    expect(nutLuaChon(2, 0).getAttribute('aria-pressed')).toBe('true')
    expect(khoiCau(2).textContent).toContain('Chưa đúng.')
  })

  it('đang tự thử: không nộp lặng lẽ đáp án cũ; trả lời lại thì chấm lượt mới', async () => {
    await lamSaiCau3()
    await mo({ pathname: duongDan(bai), hash: '#cau-3', state: stateTuThuLai(2) })

    expect(nutTheoChu('Nộp bài tự kiểm tra')!.disabled).toBe(true)
    act(() => nutLuaChon(2, 1).click()) // "cung_luc" — đáp án đúng
    expect(khoiCau(2).textContent).not.toContain('đang được ẩn')
    expect(khoiCau(2).textContent).toContain('Đúng rồi.')
    expect(nutTheoChu('Nộp bài tự kiểm tra')!.disabled).toBe(false)
  })

  it('cờ bị xoá khỏi history ngay khi mở (tải lại trang không bật lại), giữ nguyên hash', async () => {
    await lamSaiCau3()
    await mo({ pathname: duongDan(bai), hash: '#cau-3', state: stateTuThuLai(2) })
    expect(viTri.state).toBeNull()
    expect(viTri.hash).toBe('#cau-3')
    // Vẫn đang tự thử — cờ đã được CHỤP lúc mở, xoá history không thoát chế độ.
    expect(khoiCau(2).textContent).toContain('đang được ẩn')
  })

  it('không có đáp án cũ (máy khác/không nháp) → không hiện dòng tự thử thừa', async () => {
    await mo({ pathname: duongDan(bai), hash: '#cau-3', state: stateTuThuLai(2) })
    expect(khoiCau(2).textContent).not.toContain('đang được ẩn')
  })

  it('chỉ số câu lệch (bài đã bớt câu) → bỏ qua cờ, không vỡ trang', async () => {
    await lamSaiCau3()
    await mo({ pathname: duongDan(bai), state: stateTuThuLai(99) })
    expect(container.textContent).not.toContain('đang được ẩn')
    expect(khoiCau(2).textContent).toContain('Chưa đúng.')
  })

  it('chuyển sang bài khác trong mục lục: cờ tự thử KHÔNG đi theo', async () => {
    // Nháp bài khác có câu 1 đã trả lời — nếu cờ đi theo, câu 1 bài khác sẽ bị ẩn.
    await mo({ pathname: duongDan(baiKhac) })
    const dau = khoiCau(0).querySelector('ul button') as HTMLButtonElement | null
    if (dau) act(() => dau.click())
    else go(0, '1')
    await mo({ pathname: duongDan(bai), state: stateTuThuLai(0) })
    await act(async () => navigate(duongDan(baiKhac)))
    expect(container.textContent).not.toContain('đang được ẩn')
  })

  it('"Thử lại câu này" chỉ ở câu sai; bấm thì xoá đáp án + lời giải của RIÊNG câu đó và focus đề', async () => {
    await lamSaiCau3()
    expect(nutTheoChu('Thử lại câu này', khoiCau(0))).toBeUndefined()
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })
    act(() => nutTheoChu('Thử lại câu này', khoiCau(2))!.click())
    raf.mockRestore()
    expect(khoiCau(2).textContent).not.toContain('Chưa đúng.')
    expect(khoiCau(2).textContent).not.toContain(bai.checkQuestions[2]!.explain)
    expect(nutLuaChon(2, 0).getAttribute('aria-pressed')).toBe('false')
    expect(document.activeElement?.id).toBe('cau-3')
    // Câu 1 giữ nguyên.
    expect(nutLuaChon(0, 0).getAttribute('aria-pressed')).toBe('true')
    expect(nutTheoChu('Nộp bài tự kiểm tra')!.disabled).toBe(true)
  })
})
