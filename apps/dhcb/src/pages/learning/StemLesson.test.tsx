// Cổng cho hai trang bài học dùng chung của bốn môn STEM.
//
// Chạy trên DỮ LIỆU THẬT (registry của môn), không dựng dữ liệu giả: điều đáng canh ở đây là
// trang và nội dung còn khớp nhau hay không, mà dữ liệu giả thì không nói lên điều đó.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { PHYSICS_LOADER } from '@dhcb/subject-physics/lessonsLoader'
import { MATH_LOADER } from '@dhcb/subject-math/lessonsLoader'
import StemLessonList from './StemLessonList'
import StemLessonView from './StemLessonView'
import { duongDanBaiHoc } from '../../lib/stemLessonRoutes'
import { AuthContext } from '../../context/authContext'
import { __resetSessionMemory, LEARNING_SESSION_PREFIX } from '../../lib/learningSession'
import type { User } from '../../types'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('../../components/Layout', () => ({ default: () => null }))

describe('trang bài học STEM', () => {
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

  function hien(duongDan: string, khuon: string, trang: React.ReactNode) {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={[duongDan]}>
          <Routes>
            <Route path={khuon} element={trang} />
          </Routes>
        </MemoryRouter>,
      )
    })
  }

  it('danh sách in số bài lấy từ registry thật, không phải con số gõ tay', () => {
    hien('/goc-hoc-tap/physics/bai-hoc', '/goc-hoc-tap/:subjectId/bai-hoc', <StemLessonList />)
    expect(container.textContent).toContain(`${PHYSICS_LOADER.index.length} bài`)
    expect(container.textContent).toContain('Bài học môn Vật lí')
  })

  it('danh sách gom bài theo chương và đánh dấu bài có hoạt ảnh', () => {
    hien('/goc-hoc-tap/physics/bai-hoc', '/goc-hoc-tap/:subjectId/bai-hoc', <StemLessonList />)
    const baiLop10 = PHYSICS_LOADER.listCoreByGrade('10')
    expect(container.textContent).toContain(`Chương ${baiLop10[0]!.chapterNumber}`)
    expect(container.querySelectorAll('a').length).toBe(baiLop10.length)
    // [S07-2] Danh sách nay là `OutlineTree`: dấu "có hoạt ảnh" chuyển từ biểu tượng + chữ
    // ẩn sang chữ phụ hiện thẳng trên dòng bài — vẫn là CHỮ, vẫn đếm được.
    const soHoatAnh = baiLop10.filter((b) => b.hasAnimation).length
    expect(container.textContent?.split('Có hoạt ảnh').length).toBe(soHoatAnh + 1)
  })

  it('chuyển sang nhánh học sinh giỏi thì hiện chuyên đề kèm cấp', () => {
    hien('/goc-hoc-tap/physics/bai-hoc', '/goc-hoc-tap/:subjectId/bai-hoc', <StemLessonList />)
    const nut = [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Bồi dưỡng học sinh giỏi'),
    )!
    act(() => nut.click())
    expect(container.textContent).toContain('Cấp trường')
    expect(container.querySelectorAll('a').length).toBe(PHYSICS_LOADER.listAdvanced().length)
  })

  it('đổi lớp thì danh sách đổi theo', () => {
    hien('/goc-hoc-tap/physics/bai-hoc', '/goc-hoc-tap/:subjectId/bai-hoc', <StemLessonList />)
    const nut = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Lớp 12')!
    act(() => nut.click())
    expect(container.querySelectorAll('a').length).toBe(PHYSICS_LOADER.listCoreByGrade('12').length)
  })

  it('`?lop=9` (link sâu từ thanh điều hướng) mở sẵn tab Lớp 9 của Toán', () => {
    hien(
      '/goc-hoc-tap/mathematics/bai-hoc?lop=9',
      '/goc-hoc-tap/:subjectId/bai-hoc',
      <StemLessonList />,
    )
    const lop9 = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Lớp 9')!
    expect(lop9.getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelectorAll('a').length).toBe(MATH_LOADER.listCoreByGrade('9').length)
  })

  it('`?lop=` lạ hoặc lớp môn không có bài → về lớp mặc định, không danh sách trống', () => {
    for (const url of [
      '/goc-hoc-tap/physics/bai-hoc?lop=8',
      '/goc-hoc-tap/physics/bai-hoc?lop=x',
    ]) {
      hien(url, '/goc-hoc-tap/:subjectId/bai-hoc', <StemLessonList />)
      const lop10 = [...container.querySelectorAll('button')].find(
        (b) => b.textContent === 'Lớp 10',
      )!
      expect(lop10.getAttribute('aria-pressed'), url).toBe('true')
    }
  })

  it('bấm tab lớp thì URL ghi lại `?lop=` — tải lại trang vẫn đúng tab', () => {
    let search = ''
    function DoUrl() {
      search = useLocation().search
      return null
    }
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/goc-hoc-tap/mathematics/bai-hoc']}>
          <Routes>
            <Route
              path="/goc-hoc-tap/:subjectId/bai-hoc"
              element={
                <>
                  <StemLessonList />
                  <DoUrl />
                </>
              }
            />
          </Routes>
        </MemoryRouter>,
      )
    })
    expect(search).toBe('')
    const lop7 = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Lớp 7')!
    act(() => lop7.click())
    expect(search).toBe('?lop=7')
    expect(container.querySelectorAll('a').length).toBe(MATH_LOADER.listCoreByGrade('7').length)
  })

  it('mã môn lạ thì chuyển hướng chứ không dựng trang rỗng', () => {
    hien('/goc-hoc-tap/khong-co/bai-hoc', '/goc-hoc-tap/:subjectId/bai-hoc', <StemLessonList />)
    expect(container.textContent).not.toContain('Bài học môn')
  })

  it('trang bài nạp lười xong hiện đủ lý thuyết, ví dụ mẫu và thẻ ôn', async () => {
    const bai = (await PHYSICS_LOADER.loadLesson('ly10-c2-b10'))!
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[duongDanBaiHoc('physics', bai.id, bai.title)]}>
          <Routes>
            <Route
              path="/goc-hoc-tap/:subjectId/bai-hoc/:lessonSlug"
              element={<StemLessonView />}
            />
          </Routes>
        </MemoryRouter>,
      )
    })
    const chu = container.textContent ?? ''
    expect(chu).toContain(bai.title)
    expect(chu).toContain('Lý thuyết')
    expect(chu).toContain('Ví dụ mẫu')
    expect(chu).toContain(bai.workedExample.answer)
    expect(chu).toContain('Thẻ ôn tập')
    // Bài này có hoạt ảnh — mô tả bằng lời phải hiện cùng.
    expect(chu).toContain(bai.animation!.description)
  })

  it('bài chưa duyệt chuyên môn thì trang bài NÓI RA điều đó', async () => {
    // Audit 2026-09-14 (F1): 294/294 bài STEM là `draft` mà không màn nào hé lộ. Test này canh
    // để cảnh báo không biến mất im lặng khi ai đó sửa lại trang.
    const bai = (await PHYSICS_LOADER.loadLesson('ly10-c2-b10'))!
    expect(bai.reviewStatus, 'ca test mất nghĩa nếu bài mẫu đã được duyệt').toBe('draft')
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[duongDanBaiHoc('physics', bai.id, bai.title)]}>
          <Routes>
            <Route
              path="/goc-hoc-tap/:subjectId/bai-hoc/:lessonSlug"
              element={<StemLessonView />}
            />
          </Routes>
        </MemoryRouter>,
      )
    })
    expect(container.textContent ?? '').toContain('chưa duyệt chuyên môn')
  })

  it('danh sách bài cũng nói rõ còn bao nhiêu bản nháp', () => {
    const tong = PHYSICS_LOADER.listCoreByGrade('10').length
    const nhap = PHYSICS_LOADER.listCoreByGrade('10').filter(
      (b) => b.reviewStatus === 'draft',
    ).length
    expect(nhap, 'ca test mất nghĩa nếu không còn bản nháp nào').toBeGreaterThan(0)
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/goc-hoc-tap/physics/bai-hoc']}>
          <Routes>
            <Route path="/goc-hoc-tap/:subjectId/bai-hoc" element={<StemLessonList />} />
          </Routes>
        </MemoryRouter>,
      )
    })
    const chu = container.textContent ?? ''
    expect(chu).toContain('chưa duyệt chuyên môn')
    expect(chu).toContain(nhap === tong ? 'Toàn bộ' : `${nhap}/${tong}`)
  })

  it('chấm câu trắc nghiệm ngay tại chỗ và giải thích khi sai', async () => {
    const bai = (await PHYSICS_LOADER.loadLesson('ly10-c2-b10'))!
    const cau = bai.checkQuestions.find((q) => q.answer.kind === 'choice')!
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[duongDanBaiHoc('physics', bai.id, bai.title)]}>
          <Routes>
            <Route
              path="/goc-hoc-tap/:subjectId/bai-hoc/:lessonSlug"
              element={<StemLessonView />}
            />
          </Routes>
        </MemoryRouter>,
      )
    })

    const dapAnDung = cau.answer.kind === 'choice' ? cau.answer.correctIds[0] : ''
    const nutSai = cau.choices!.find((c) => c.id !== dapAnDung)!
    const nut = [...container.querySelectorAll('button')].find(
      (b) => b.textContent === nutSai.label,
    )!
    act(() => nut.click())

    expect(container.textContent).toContain('Chưa đúng.')
    expect(container.textContent).toContain(cau.explain)
  })

  // ——— [S08-3] Nháp phần "Tự kiểm tra" sống qua reload (cùng thiết bị) ———
  //
  // Ba ca dưới đây canh đúng hợp đồng của đặc tả S08 §3.4: nháp CHỈ chứa chữ người học gõ +
  // danh sách câu đã bấm chấm; kết quả đúng/sai được TÍNH LẠI bằng `gradeAnswer`, không lưu.

  const NGUOI_HOC: User = {
    id: 'u-42',
    email: 'a@b.c',
    name: 'Học viên',
    plan: 'free',
    onboarded: true,
  }

  function boc(nguoi: User | null, duongDan: string, isGuest = false) {
    return (
      <AuthContext.Provider
        value={{
          user: nguoi,
          loading: false,
          isGuest,
          refresh: async () => {},
          refreshVerified: async () => {
            throw new Error('Không dùng trong fixture này')
          },
        }}
      >
        <MemoryRouter initialEntries={[duongDan]}>
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

  async function moBai(nguoi: User | null, duongDan: string, isGuest = false) {
    await act(async () => {
      root.render(boc(nguoi, duongDan, isGuest))
    })
  }

  /** Ghi xuống storage NGAY, không chờ hết debounce 500 ms — đúng đường `pagehide` của hook. */
  function roiTrang() {
    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })
  }

  it('đáp án tự kiểm tra sống qua reload, kết quả đúng/sai được tính lại', async () => {
    localStorage.clear()
    __resetSessionMemory()
    const bai = (await PHYSICS_LOADER.loadLesson('ly10-c2-b10'))!
    const chiSoTracNghiem = bai.checkQuestions.findIndex((q) => q.answer.kind === 'choice')
    const cau = bai.checkQuestions[chiSoTracNghiem]!
    const dapAnDung = cau.answer.kind === 'choice' ? cau.answer.correctIds[0] : ''
    const duongDan = duongDanBaiHoc('physics', bai.id, bai.title)

    await moBai(NGUOI_HOC, duongDan)
    const nut = [...container.querySelectorAll('button')].find(
      (b) => b.textContent === cau.choices!.find((c) => c.id === dapAnDung)!.label,
    )!
    act(() => nut.click())
    expect(container.textContent).toContain('Đúng rồi.')
    roiTrang()

    // "Reload" = dựng lại trang từ đầu trên cùng storage.
    await act(async () => root.unmount())
    root = createRoot(container)
    await moBai(NGUOI_HOC, duongDan)

    const nutSauReload = [...container.querySelectorAll('button')].find(
      (b) => b.textContent === cau.choices!.find((c) => c.id === dapAnDung)!.label,
    )!
    expect(nutSauReload.getAttribute('aria-pressed')).toBe('true')
    expect(container.textContent).toContain('Đúng rồi.')
    // Đúng MỘT khoá NHÁP, và MỞ BÀI KHÔNG SINH BẰNG CHỨNG NÀO (S08 AC-17 + S11 §⑤).
    //
    // [S11-3] Trước đây ca này chốt `khoa).toHaveLength(1)`. Từ khi mục lục đọc trạng thái
    // hoàn thành (AC-15), trang có một lượt GET `/api/learning/evidence` lúc mở — mà tầng
    // `getAuthHeader` thì đúc danh tính khách (`dhcb_guest_id_v1`) cho mọi request không có
    // token, kể cả ở test này. Đếm TỔNG số khoá vì thế trở thành phép đo sai chỗ: nó bắt cả
    // hạ tầng gửi request, không phải điều cần canh. Điều CẦN canh — không có khoá bằng chứng
    // nào ra đời khi chỉ mở bài — được viết thẳng ra dưới đây.
    const khoa = Object.keys(localStorage)
    expect(khoa.filter((k) => k.startsWith(LEARNING_SESSION_PREFIX))).toHaveLength(1)
    expect(khoa.filter((k) => k.startsWith('dhcb_evidence_'))).toHaveLength(0)
  })

  it('câu tự luận giữ chữ đã gõ nhưng CHƯA chấm cho tới khi bấm Kiểm tra', async () => {
    localStorage.clear()
    __resetSessionMemory()
    const bai = (await PHYSICS_LOADER.loadLesson('ly10-c2-b10'))!
    expect(
      bai.checkQuestions.some((q) => !q.choices),
      'ca test mất nghĩa nếu bài mẫu không còn câu tự luận',
    ).toBe(true)
    const duongDan = duongDanBaiHoc('physics', bai.id, bai.title)

    await moBai(NGUOI_HOC, duongDan)
    const o = container.querySelector<HTMLInputElement>('input[id^="tra-loi-"]')!
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      )!.set!
      setter.call(o, '20 m/s')
      o.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(container.querySelector<HTMLInputElement>('input[id^="tra-loi-"]')!.value).toBe('20 m/s')
    roiTrang()

    await act(async () => root.unmount())
    root = createRoot(container)
    await moBai(NGUOI_HOC, duongDan)

    expect(container.querySelector<HTMLInputElement>('input[id^="tra-loi-"]')!.value).toBe('20 m/s')
    // Chưa bấm "Kiểm tra" thì không có phán đúng/sai nào — kể cả sau khi khôi phục nháp.
    expect(container.textContent).not.toContain('Đúng rồi.')
    expect(container.textContent).not.toContain('Chưa đúng.')
  })

  it('người khác mở cùng bài trên cùng máy thì không thấy dấu vết nháp của người trước', async () => {
    localStorage.clear()
    __resetSessionMemory()
    const bai = (await PHYSICS_LOADER.loadLesson('ly10-c2-b10'))!
    const cau = bai.checkQuestions.find((q) => q.answer.kind === 'choice')!
    const duongDan = duongDanBaiHoc('physics', bai.id, bai.title)

    await moBai(NGUOI_HOC, duongDan)
    const nut = [...container.querySelectorAll('button')].find(
      (b) => b.textContent === cau.choices![0]!.label,
    )!
    act(() => nut.click())
    roiTrang()

    await act(async () => root.unmount())
    root = createRoot(container)
    await moBai({ ...NGUOI_HOC, id: 'u-99' }, duongDan)

    const nutCuaNguoiKhac = [...container.querySelectorAll('button')].filter(
      (b) => b.getAttribute('aria-pressed') === 'true',
    )
    expect(nutCuaNguoiKhac).toHaveLength(0)
    expect(container.textContent).not.toContain('Đúng rồi.')
    expect(container.textContent).not.toContain('Chưa đúng.')
  })

  it('trình duyệt chặn lưu nháp thì trang NÓI RA, không im lặng mất bài', async () => {
    localStorage.clear()
    __resetSessionMemory()
    // Safari chế độ riêng tư cho ĐỌC nhưng ném lúc GHI — đúng ca mà probe của khung phiên dò.
    const chan = vi.spyOn(globalThis.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError: storage bị chặn')
    })
    try {
      const bai = (await PHYSICS_LOADER.loadLesson('ly10-c2-b10'))!
      await moBai(NGUOI_HOC, duongDanBaiHoc('physics', bai.id, bai.title))
      expect(container.textContent).toContain('Trình duyệt đang chặn lưu nháp')
    } finally {
      chan.mockRestore()
    }
  })

  // ——— [S11-2] Nộp bài tự kiểm tra: SERVER là người nói "đã hoàn thành" ———

  /** Trả lời TẤT CẢ các câu: trắc nghiệm bấm lựa chọn đầu, tự luận gõ một chuỗi bất kỳ. */
  function traLoiHetCauHoi() {
    const khoi = [...container.querySelectorAll('h2 + ul > li')]
    for (const li of khoi) {
      const o = li.querySelector<HTMLInputElement>('input[id^="tra-loi-"]')
      if (o) {
        act(() => {
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value',
          )!.set!
          setter.call(o, '20 m/s')
          o.dispatchEvent(new Event('input', { bubbles: true }))
        })
        continue
      }
      const nut = li.querySelector('button')
      if (nut) act(() => nut.click())
    }
  }

  function nutNop() {
    return [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Nộp bài tự kiểm tra'),
    )
  }

  // Bấm Nộp rồi CHỜ ĐỦ: `nop()` await `submitStemEvidence`, hàm này giờ `await import()`
  // lười phần chấm điểm (lib/stemEvidence.ts, 2026-09-16) trước khi gọi máy chấm — thêm một
  // bước microtask/macrotask mà `act(async () => click())` một lượt không flush hết, vì
  // `onClick={() => void nop()}` không trả promise cho act() theo. Đợi thêm một macrotask
  // (setTimeout 0) sau click để chắc chắn `import()` đã giải quyết xong trước khi assert.
  async function napBaiVaCho() {
    await act(async () => {
      nutNop()!.click()
      await new Promise((r) => setTimeout(r, 0))
    })
  }

  /**
   * Số lượt NỘP đã rời trình duyệt.
   *
   * Chỉ đếm POST: từ S11-3 trang còn GỌI GET `/api/learning/evidence` để đọc trạng thái hoàn
   * thành cho mục lục (AC-15) — đọc thì không tạo ra bằng chứng nào. Bất biến của §⑤ là "mở
   * bài / click / AI KHÔNG SINH evidence", và evidence chỉ sinh ra bởi POST.
   */
  function soLuotNop(f: { mock: { calls: unknown[][] } }): number {
    return f.mock.calls.filter(
      (c) =>
        String(c[0]).includes('/api/learning/evidence') &&
        (c[1] as { method?: string } | undefined)?.method === 'POST',
    ).length
  }

  /** Giả server: mọi lời gọi `/api/learning/evidence` trả `phanHoi`; các đường khác 404. */
  function gaServer(status: number, body?: unknown) {
    const f = vi.fn(async (url: string) =>
      String(url).startsWith('/api/learning/evidence')
        ? new Response(body === undefined ? null : JSON.stringify(body), {
            status,
            headers: { 'content-type': 'application/json' },
          })
        : new Response('{}', { status: 404 }),
    )
    vi.stubGlobal('fetch', f)
    return f
  }

  function phanHoi(passed: boolean, correct: number, total: number) {
    return {
      schemaVersion: 1,
      subjectId: 'physics',
      contentId: 'ly10-c2-b10',
      activityKind: 'stem_lesson_check',
      attemptId: 'attempt-0123456789abcd',
      clientAt: '2026-09-16T00:00:00.000Z',
      ownerId: 'u-42',
      evidenceKind: 'server_graded',
      correct,
      total,
      ratio: correct / total,
      passed,
      serverAt: '2026-09-16T00:00:01.000Z',
      items: [],
    }
  }

  it('mở bài KHÔNG gửi bằng chứng nào, và nút Nộp khoá tới khi trả lời đủ', async () => {
    localStorage.clear()
    __resetSessionMemory()
    const f = gaServer(200, phanHoi(true, 2, 2))
    try {
      const bai = (await PHYSICS_LOADER.loadLesson('ly10-c2-b10'))!
      await moBai(NGUOI_HOC, duongDanBaiHoc('physics', bai.id, bai.title))

      expect(soLuotNop(f)).toBe(0)
      expect(nutNop()!.hasAttribute('disabled')).toBe(true)
      expect(container.textContent).toContain(`Trả lời đủ ${bai.checkQuestions.length} câu`)

      traLoiHetCauHoi()
      expect(nutNop()!.hasAttribute('disabled')).toBe(false)
      // Trả lời/chấm tại chỗ vẫn KHÔNG phải là bằng chứng — chưa bấm Nộp thì chưa nộp gì.
      expect(soLuotNop(f)).toBe(0)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('server trả passed:true → mới hiện "Đã hoàn thành"', async () => {
    localStorage.clear()
    __resetSessionMemory()
    gaServer(200, phanHoi(true, 2, 2))
    try {
      const bai = (await PHYSICS_LOADER.loadLesson('ly10-c2-b10'))!
      await moBai(NGUOI_HOC, duongDanBaiHoc('physics', bai.id, bai.title))
      traLoiHetCauHoi()
      await napBaiVaCho()

      expect(container.textContent).toContain('Đã hoàn thành bài này')
      expect(container.textContent).toContain('Đúng 2/2 câu')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('server trả passed:false → KHÔNG có chữ "hoàn thành", vẫn thấy đúng/sai từng câu', async () => {
    localStorage.clear()
    __resetSessionMemory()
    gaServer(200, phanHoi(false, 1, 4))
    try {
      const bai = (await PHYSICS_LOADER.loadLesson('ly10-c2-b10'))!
      await moBai(NGUOI_HOC, duongDanBaiHoc('physics', bai.id, bai.title))
      traLoiHetCauHoi()
      await napBaiVaCho()

      expect(container.textContent).not.toContain('hoàn thành')
      expect(container.textContent).toContain('Chưa đạt')
      // Con số hiện ra là con số của SERVER (1/4), không phải bản chấm ở máy.
      expect(container.textContent).toContain('Đúng 1/4 câu')
      expect(container.textContent).toMatch(/Đúng rồi\.|Chưa đúng\./)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('server lỗi → giữ bài làm trên máy và NÓI RA, đúng/sai từng câu vẫn xem được', async () => {
    localStorage.clear()
    __resetSessionMemory()
    gaServer(503, { error: 'bận' })
    try {
      const bai = (await PHYSICS_LOADER.loadLesson('ly10-c2-b10'))!
      await moBai(NGUOI_HOC, duongDanBaiHoc('physics', bai.id, bai.title))
      traLoiHetCauHoi()
      await napBaiVaCho()

      expect(container.textContent).toContain('Đã lưu trên máy này, sẽ gửi lại')
      expect(container.textContent).not.toContain('Đã hoàn thành')
      expect(container.textContent).toMatch(/Đúng rồi\.|Chưa đúng\./)
      expect(localStorage.getItem('dhcb_evidence_pending_u-42')).not.toBeNull()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('khách nộp thì KHÔNG gọi server và kết quả ghi rõ là cục bộ', async () => {
    localStorage.clear()
    __resetSessionMemory()
    const f = gaServer(200, phanHoi(true, 2, 2))
    try {
      const bai = (await PHYSICS_LOADER.loadLesson('ly10-c2-b10'))!
      await moBai(
        { ...NGUOI_HOC, id: 'guest_abc-123' },
        duongDanBaiHoc('physics', bai.id, bai.title),
        true,
      )
      traLoiHetCauHoi()
      await napBaiVaCho()

      expect(soLuotNop(f)).toBe(0)
      expect(container.textContent).toContain('trên máy này')
      expect(localStorage.getItem('dhcb_evidence_guest_abc-123')).not.toBeNull()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('[S11-3] màn kết quả dùng chung: chỉ rõ từng câu, lý do sai và lối đi tiếp', async () => {
    localStorage.clear()
    __resetSessionMemory()
    const bai = (await PHYSICS_LOADER.loadLesson('ly10-c2-b10'))!
    gaServer(200, {
      ...phanHoi(false, 1, bai.checkQuestions.length),
      items: bai.checkQuestions.map((_, i) => ({
        questionIndex: i,
        correct: i === 0,
        reason: i === 0 ? 'CORRECT' : 'MISSING_UNIT',
      })),
    })
    try {
      await moBai(NGUOI_HOC, duongDanBaiHoc('physics', bai.id, bai.title))
      traLoiHetCauHoi()
      await napBaiVaCho()

      const khung = container.querySelector('section[aria-label="Kết quả lượt nộp"]')!
      const chu = khung.textContent ?? ''
      expect(chu).toContain('Chưa đạt')
      expect(chu).toContain('Cần đúng từ 80% số câu trở lên')
      // Lý do sai nói bằng tiếng Việt, lấy từ engine chấm — KHÔNG gọi AI.
      expect(chu).toContain('Thiếu đơn vị')
      expect(chu).toContain(bai.checkQuestions[1]!.prompt)
      // "Làm lại" dọn màn kết quả để lượt sau sinh attemptId MỚI.
      const lamLai = [...khung.querySelectorAll('button')].find((b) => b.textContent === 'Làm lại')!
      act(() => lamLai.click())
      expect(container.querySelector('section[aria-label="Kết quả lượt nộp"]')).toBeNull()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('bài không tồn tại thì nói rõ và mời quay lại danh sách', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/goc-hoc-tap/physics/bai-hoc/ly10-c99-b99--khong-co']}>
          <Routes>
            <Route
              path="/goc-hoc-tap/:subjectId/bai-hoc/:lessonSlug"
              element={<StemLessonView />}
            />
          </Routes>
        </MemoryRouter>,
      )
    })
    expect(container.textContent).toContain('Không tìm thấy bài học này')
  })
})
