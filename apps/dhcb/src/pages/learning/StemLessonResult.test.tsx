// [S09a] Cổng tích hợp màn kết quả STEM trong trang bài thật — AC05/AC06 của
// docs/specs/2026-09-23-uiux-s09-s12-trai-nghiem-va-nghiem-thu.md §2.5.
//
// Vì sao phải dựng cả trang: các lỗi canh ở đây nằm ở KHE giữa caller và màn kết quả — câu trả
// lời hiện ra lấy từ nháp đang sửa thay vì lượt đã nộp, response về muộn của người/bài cũ đè
// lên người/bài mới. Test hàm thuần hay component riêng lẻ không nhìn thấy khe đó.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useNavigate, type NavigateFunction } from 'react-router-dom'
import { PHYSICS_LOADER } from '@dhcb/subject-physics/lessonsLoader'
import type { StemLessonLike } from '@dhcb/core-contracts/stemLesson'
import StemLessonView from './StemLessonView'
import { duongDanBaiHoc } from '../../lib/stemLessonRoutes'
import { AuthContext } from '../../context/authContext'
import { __resetSessionMemory } from '../../lib/learningSession'
import type { User } from '../../types'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)

vi.mock('../../components/Layout', () => ({ default: () => null }))

const BAI_ID = 'ly10-c2-b10'
const BAI_KHAC_ID = 'ly10-c2-b11'

const NGUOI_A: User = { id: 'u-42', email: 'a@b.c', name: 'A', plan: 'free', onboarded: true }
const NGUOI_B: User = { id: 'u-99', email: 'b@b.c', name: 'B', plan: 'free', onboarded: true }

let navigate: NavigateFunction
function DieuHuong() {
  const go = useNavigate()
  useEffect(() => {
    navigate = go
  }, [go])
  return null
}

/** Một POST đang treo: test tự quyết lúc nào server "trả lời". */
interface PostTreo {
  body: { attemptId: string; answers: { questionIndex: number; raw: string }[] }
  traLoi: (body: unknown) => void
}

describe('[S09a] màn kết quả STEM trong trang bài', () => {
  let container: HTMLDivElement
  let root: Root
  let bai: StemLessonLike
  let baiKhac: StemLessonLike
  let posts: PostTreo[]

  beforeEach(async () => {
    localStorage.clear()
    sessionStorage.clear()
    window.history.replaceState(null, '', '/')
    __resetSessionMemory()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    bai = (await PHYSICS_LOADER.loadLesson(BAI_ID))!
    baiKhac = (await PHYSICS_LOADER.loadLesson(BAI_KHAC_ID))!
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {})
    posts = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (String(url).startsWith('/api/learning/evidence') && init?.method === 'POST') {
          return new Promise<Response>((resolve) => {
            posts.push({
              body: JSON.parse(String(init.body)) as PostTreo['body'],
              traLoi: (b) =>
                resolve(
                  new Response(JSON.stringify(b), {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                  }),
                ),
            })
          })
        }
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

  function cay(nguoi: User, duongDan: string) {
    return (
      <AuthContext.Provider
        value={{
          user: nguoi,
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
      </AuthContext.Provider>
    )
  }

  async function moBai(nguoi: User = NGUOI_A) {
    await act(async () => {
      root.render(cay(nguoi, duongDanBaiHoc('physics', bai.id, bai.title)))
    })
  }

  /** Nút lựa chọn thứ `thuTu` (0-based) của câu `i` (0-based) trong phần Tự kiểm tra. */
  function nutLuaChon(i: number, thuTu: number) {
    const cau = container.querySelector(`#cau-${i + 1}`)!.parentElement!
    return cau.querySelectorAll('ul button')[thuTu] as HTMLButtonElement
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

  /** Câu 1 chọn đúng, câu 2 gõ đúng, câu 3 chọn SAI (lựa chọn đầu là "Bi sắt"). */
  function traLoiTron() {
    act(() => nutLuaChon(0, 0).click())
    go(1, '20 m/s')
    act(() => nutLuaChon(2, 0).click())
  }

  async function bamNop() {
    const nut = [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Nộp bài tự kiểm tra'),
    )!
    const truoc = posts.length
    await act(async () => {
      nut.click()
      // `nop()` await import() lười phần chấm điểm trước khi gọi fetch — lần đầu trong một tiến
      // trình test có thể mất vài vòng macrotask. Chờ tới khi POST thật sự rời trang.
      for (let i = 0; i < 200 && posts.length === truoc; i += 1) {
        await new Promise((r) => setTimeout(r, 5))
      }
    })
  }

  async function serverTraLoi(post: PostTreo, ownerId = NGUOI_A.id, dat = false) {
    await act(async () => {
      post.traLoi({
        schemaVersion: 1,
        subjectId: 'physics',
        contentId: BAI_ID,
        activityKind: 'stem_lesson_check',
        attemptId: post.body.attemptId,
        clientAt: '2026-09-24T00:00:00.000Z',
        ownerId,
        evidenceKind: 'server_graded',
        correct: dat ? 3 : 2,
        total: 3,
        ratio: dat ? 1 : 2 / 3,
        passed: dat,
        serverAt: '2026-09-24T00:00:01.000Z',
        items: [
          { questionIndex: 0, correct: true, reason: 'CORRECT' },
          { questionIndex: 1, correct: true, reason: 'CORRECT' },
          dat
            ? { questionIndex: 2, correct: true, reason: 'CORRECT' }
            : { questionIndex: 2, correct: false, reason: 'WRONG_CHOICE' },
        ],
      })
      await new Promise((r) => setTimeout(r, 0))
    })
  }

  function khungKetQua() {
    return container.querySelector('section[aria-label="Kết quả lượt nộp"]')
  }

  const hopThoai = () => document.body.querySelectorAll('[role="dialog"]')

  it('[P1-6] lượt nộp ĐẠT → đúng MỘT màn kết SessionDone kể số câu đúng; đóng thì về màn kết quả', async () => {
    await moBai()
    traLoiTron()
    await bamNop()
    await serverTraLoi(posts[0]!, NGUOI_A.id, true)
    expect(hopThoai()).toHaveLength(1)
    expect(hopThoai()[0]!.textContent).toContain('đúng 3/3 câu')
    expect(window.location.search).toBe('?xong=1')
    const nut = [...hopThoai()[0]!.querySelectorAll('button')].find(
      (b) => b.textContent === 'Xem kết quả',
    )!
    act(() => nut.click())
    expect(hopThoai()).toHaveLength(0)
    expect(window.location.search).toBe('')
    expect(khungKetQua()).not.toBeNull()
  })

  it('[P1-6] lượt nộp CHƯA ĐẠT → không màn kết (chỉ mừng thành tựu thật)', async () => {
    await moBai()
    traLoiTron()
    await bamNop()
    await serverTraLoi(posts[0]!)
    expect(khungKetQua()).not.toBeNull()
    expect(hopThoai()).toHaveLength(0)
  })

  it('AC05: sửa nháp TRONG LÚC CHỜ và SAU khi có kết quả không đổi câu đã trả lời của lượt nộp', async () => {
    await moBai()
    traLoiTron()
    await bamNop()
    expect(posts).toHaveLength(1)

    // Đang chờ server: người học đổi câu 1 sang lựa chọn thứ hai.
    act(() => nutLuaChon(0, 1).click())
    await serverTraLoi(posts[0]!)

    const nhanDaNop = bai.checkQuestions[0]!.choices![0]!.label
    const nhanNhapSau = bai.checkQuestions[0]!.choices![1]!.label
    // Nhãn của lựa chọn sửa SAU khi nộp không được lọt vào kết quả của lượt đã nộp.
    expect(khungKetQua()!.textContent).not.toContain(nhanNhapSau)
    const hang1 = khungKetQua()!.querySelector('#ket-qua-cau-1')!
    expect(hang1.textContent).toContain(`Bạn trả lời: ${nhanDaNop}`)
    expect(hang1.textContent).not.toContain(nhanNhapSau)

    // Có kết quả rồi: sửa tiếp câu 3 cũng không ghép vào kết quả cũ.
    act(() => nutLuaChon(2, 1).click())
    const hang3 = khungKetQua()!.querySelector('#ket-qua-cau-3')!
    expect(hang3.textContent).toContain(`Bạn trả lời: ${bai.checkQuestions[2]!.choices![0]!.label}`)
    // Câu sai đứng đầu danh sách, mang số câu GỐC.
    expect(khungKetQua()!.querySelector('ol > li')!.id).toBe('ket-qua-cau-3')
  })

  it('AC05: đổi người dùng khi response còn treo → người mới KHÔNG nhận kết quả của người cũ', async () => {
    await moBai(NGUOI_A)
    traLoiTron()
    await bamNop()
    await act(async () => {
      root.render(cay(NGUOI_B, duongDanBaiHoc('physics', bai.id, bai.title)))
    })
    await serverTraLoi(posts[0]!)
    expect(khungKetQua()).toBeNull()
  })

  it('AC05: đổi người dùng SAU khi đã có kết quả → kết quả của người cũ biến mất', async () => {
    await moBai(NGUOI_A)
    traLoiTron()
    await bamNop()
    await serverTraLoi(posts[0]!)
    expect(khungKetQua()).not.toBeNull()
    await act(async () => {
      root.render(cay(NGUOI_B, duongDanBaiHoc('physics', bai.id, bai.title)))
    })
    expect(khungKetQua()).toBeNull()
  })

  it('AC05: chuyển bài khi response còn treo → bài mới KHÔNG nhận kết quả của bài cũ', async () => {
    await moBai()
    traLoiTron()
    await bamNop()
    await act(async () => {
      navigate(duongDanBaiHoc('physics', baiKhac.id, baiKhac.title))
      await new Promise((r) => setTimeout(r, 0))
    })
    expect(container.querySelector('h1')!.textContent).toBe(baiKhac.title)
    await serverTraLoi(posts[0]!)
    expect(khungKetQua()).toBeNull()
  })

  it('AC05: mở lời giải và "Xem câu N" chỉ điều hướng — không sinh thêm lượt nộp nào', async () => {
    await moBai()
    traLoiTron()
    await bamNop()
    await serverTraLoi(posts[0]!)

    const nutGiai = [...khungKetQua()!.querySelectorAll('button')].find(
      (b) => b.textContent === 'Xem giải thích câu 3',
    )!
    act(() => nutGiai.click())
    expect(nutGiai.getAttribute('aria-expanded')).toBe('true')

    const xemCau = khungKetQua()!.querySelector<HTMLAnchorElement>('#ket-qua-cau-3 a')!
    await act(async () => {
      xemCau.click()
      await new Promise((r) => setTimeout(r, 0))
    })
    expect(document.activeElement?.id).toBe('cau-3')
    // Bấm lại cùng đích (hash không đổi) vẫn đưa focus về câu.
    ;(document.activeElement as HTMLElement).blur()
    await act(async () => {
      xemCau.click()
      await new Promise((r) => setTimeout(r, 0))
    })
    expect(document.activeElement?.id).toBe('cau-3')
    expect(posts).toHaveLength(1)
    expect(khungKetQua()).not.toBeNull()
  })

  it('AC06: "Làm lại" giữ nguyên nháp; lượt nộp sau dùng attemptId MỚI', async () => {
    await moBai()
    traLoiTron()
    await bamNop()
    await serverTraLoi(posts[0]!)

    const lamLai = [...khungKetQua()!.querySelectorAll('button')].find(
      (b) => b.textContent === 'Làm lại',
    )!
    act(() => lamLai.click())
    expect(khungKetQua()).toBeNull()
    // Nháp còn nguyên: lựa chọn đã bấm vẫn đang được chọn, chữ đã gõ vẫn còn.
    expect(nutLuaChon(0, 0).getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelector<HTMLInputElement>('#tra-loi-2')!.value).toBe('20 m/s')

    await bamNop()
    expect(posts).toHaveLength(2)
    expect(posts[1]!.body.attemptId).not.toBe(posts[0]!.body.attemptId)
    await serverTraLoi(posts[1]!)
    expect(khungKetQua()).not.toBeNull()
  })
})
