// Cổng cho PHIÊN HỌC của trang bài Lập trình (slice S08-2).
// Đặc tả: docs/specs/2026-09-15-learning-ux-s08-khung-phien-resume.md (AC-11…AC-14).
//
// Bốn bất biến canh ở đây — mỗi cái đã từng là một cách hỏng thật:
//   1. Reload giữa chừng: về ĐÚNG bước + ĐÚNG code đã gõ (AC-11), nhưng KẾT QUẢ CHẤM thì
//      không khôi phục — kết quả phải chấm lại bằng máy chấm thật, không tin số trên máy.
//   2. Đổi bài không dính nháp bài cũ; quay lại bài cũ thì nháp còn (AC-12).
//   3. Bài đổi nội dung → HỎI trước khi đổ nháp cũ, không tự prefill (AC-13).
//   4. Nháp KHÔNG tạo completion: mở lại bài dở không hề gọi `saveLessonProgress('completed')`;
//      ngược lại đạt hết test thì nháp bị XOÁ (AC-14).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, useEffect, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  MemoryRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
  useNavigationType,
  type NavigateFunction,
} from 'react-router-dom'
import type { ProgrammingLesson } from '@dhcb/subject-programming/lessonTypes'
import { buildSlugSegment } from '@core/slug'
import { LEARNING_SESSION_PREFIX, __resetSessionMemory } from '../../../lib/learningSession'
import ProgrammingLessonPage from './ProgrammingLessonPage'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// --- Bài học giả: đủ hình dạng thật, đủ nhỏ để test chạy trong mili-giây -------------------
function taoBai(patch: Partial<ProgrammingLesson['make']> = {}): ProgrammingLesson {
  return {
    id: 'p1-u4-l1',
    unitId: 'p1-u4',
    language: 'python',
    title: 'Bài thử',
    hook: 'Móc thực tế',
    theory: 'Lý thuyết',
    workedExample: { code: 'print(1)', stdinLines: [] },
    predict: {
      code: 'print(1)',
      question: 'In ra gì?',
      choices: ['1', '2'],
      answerIndex: 0,
      explain: 'Vì thế',
    },
    parsons: { prompt: 'Xếp đi', lines: ['a = 1', 'b = 2', 'print(a + b)'] },
    make: {
      prompt: 'Tự viết đi',
      starterCode: '# viết ở đây',
      testCases: [
        { stdinLines: [], expected: 'xong', match: 'contains', hidden: false, label: 'ca 1' },
      ],
      hints: ['gợi ý 1'],
      sampleSolution: 'print("xong")',
      ...patch,
    },
    homework: 'Về nhà làm',
  }
}

const baiHienTai: { lesson: ProgrammingLesson } = { lesson: taoBai() }

const hoatHoa: NonNullable<ProgrammingLesson['animation']> = {
  title: 'Dữ liệu đi qua bước xử lý',
  description: 'Dữ liệu từ đầu vào đi qua bước xử lý để tạo kết quả đầu ra.',
  viewBoxWidth: 320,
  viewBoxHeight: 120,
  durationMs: 2000,
  loop: false,
  shapes: [
    {
      kind: 'circle',
      id: 'du-lieu',
      cx: 30,
      cy: 60,
      r: 10,
      fill: 'accent',
      keyframes: [
        { atMs: 0, dx: 0 },
        { atMs: 1000, dx: 130 },
        { atMs: 2000, dx: 260 },
      ],
    },
  ],
  captions: [
    { atMs: 0, text: 'Nhận dữ liệu đầu vào.' },
    { atMs: 1000, text: 'Xử lý dữ liệu.' },
    { atMs: 2000, text: 'Trả kết quả đầu ra.' },
  ],
}

vi.mock('../../../components/Layout', () => ({ default: () => null }))
vi.mock('../../../components/programming/LivePreview', () => ({ default: () => null }))
vi.mock('../../../components/programming/AiHelpPanel', () => ({ default: () => null }))
// CodeEditor thật là CodeMirror (không chạy được trong jsdom) → thay bằng textarea cùng hợp đồng.
vi.mock('../../../components/CodeEditor', () => ({
  default: ({
    value,
    onChange,
    ariaLabel,
  }: {
    value: string
    onChange: (v: string) => void
    ariaLabel: string
  }) => (
    <textarea
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
    />
  ),
}))
vi.mock('../../../lib/useProgrammingLesson', () => ({
  useProgrammingLesson: () => ({ status: 'ready', lesson: baiHienTai.lesson }),
}))
// Máy chạy code giả. Mặc định: code có chữ "xong" thì coi như in ra "xong" (đủ để đạt
// test-case). Test S09d thay `mayChay.impl` để giữ một ca "đang chạy" (chấm dở/chấm chậm).
type KetQuaChay = { output: string; error: string | undefined }
const mayChayMacDinh = (_lang: string, code: string): Promise<KetQuaChay> =>
  Promise.resolve({ output: code.includes('xong') ? 'xong' : 'chưa', error: undefined })
const mayChay: { impl: typeof mayChayMacDinh; soLan: number } = {
  impl: mayChayMacDinh,
  soLan: 0,
}
vi.mock('../../../lib/codeRunner', () => ({
  runLessonCode: (lang: string, code: string) => {
    mayChay.soLan += 1
    return mayChay.impl(lang, code)
  },
  resetLessonRunners: () => {},
  laBaiDongLenh: () => false,
}))
const luuTienDo = vi.fn()
vi.mock('../../../lib/programmingProgress', async () => {
  const thuc = await vi.importActual<typeof import('../../../lib/programmingProgress')>(
    '../../../lib/programmingProgress',
  )
  return {
    ...thuc,
    saveLessonProgress: (...args: unknown[]) => {
      luuTienDo(...args)
      return Promise.resolve()
    },
    fetchProgress: () => Promise.resolve([]),
    fetchProgressWithState: () => Promise.resolve({ lessons: [], state: 'ready' as const }),
  }
})
const themSrs = vi.fn()
vi.mock('../../../lib/programmingSrs', () => ({
  addLessonCardsToSrs: (...args: unknown[]) => themSrs(...args),
}))
// PHẢI trả về CÙNG MỘT object mỗi lần gọi: `useProgrammingOutlineCtx` có effect phụ thuộc
// `[user]`, mock trả object mới mỗi lượt render là vòng lặp render vô tận (đã dính thật).
// Test S09d đổi `dangNhap.ctx` sang object KHÁC (một lần) để giả đổi owner giữa chừng.
function taoCtx(id: string) {
  return {
    user: { id, plan: 'free', isGuest: false, email: '', name: 'U', onboarded: true },
    loading: false,
  }
}
const dangNhap = { ctx: taoCtx('u1') }
vi.mock('../../../context/useAuth', () => ({ useAuth: () => dangNhap.ctx }))

let container: HTMLDivElement
let root: Root

// Theo dõi router: vị trí hiện tại + số entry đã PUSH (đếm history entry mới) + hàm navigate
// để giả Back/Forward.
const dinhTuyen: {
  nav: NavigateFunction | null
  loc: { pathname: string; search: string; hash: string; key: string } | null
  soPush: number
} = { nav: null, loc: null, soPush: 0 }
function DoViTri() {
  const loc = useLocation()
  const kieu = useNavigationType()
  const nav = useNavigate()
  const keyTruoc = useRef<string | null>(null)
  useEffect(() => {
    dinhTuyen.nav = nav
    dinhTuyen.loc = loc
    if (keyTruoc.current !== loc.key && kieu === 'PUSH') dinhTuyen.soPush += 1
    keyTruoc.current = loc.key
  })
  return null
}

/** Mở trang (như một lần TẢI TRANG mới: unmount rồi mount lại = reload). */
function mo(lesson: ProgrammingLesson = baiHienTai.lesson, duoi = '') {
  baiHienTai.lesson = lesson
  const doan = buildSlugSegment(lesson.id, lesson.title)
  act(() =>
    root.render(
      <MemoryRouter initialEntries={[`/lap-trinh/bai-hoc/${doan}${duoi}`]}>
        <Routes>
          <Route
            path="/lap-trinh/bai-hoc/:lessonId"
            element={
              <>
                <ProgrammingLessonPage />
                <DoViTri />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    ),
  )
}

function nut(ten: string): HTMLButtonElement {
  const found = [...document.body.querySelectorAll('button')].find(
    (b) => (b.textContent ?? '').trim() === ten,
  )
  if (!found) throw new Error(`Không thấy nút "${ten}"`)
  return found as HTMLButtonElement
}

function bam(ten: string) {
  act(() => nut(ten).click())
}

function oCode(): HTMLTextAreaElement {
  const el = document.body.querySelector('textarea')
  if (!el) throw new Error('Không thấy ô soạn code')
  return el
}

/** Gõ vào ô code như người thật (đi qua đúng onChange của React). */
function goCode(text: string) {
  const el = oCode()
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
  act(() => {
    setter?.call(el, text)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function chu(): string {
  return document.body.textContent ?? ''
}

beforeEach(() => {
  localStorage.clear()
  __resetSessionMemory()
  luuTienDo.mockClear()
  themSrs.mockClear()
  mayChay.impl = mayChayMacDinh
  mayChay.soLan = 0
  dangNhap.ctx = taoCtx('u1')
  dinhTuyen.nav = null
  dinhTuyen.loc = null
  dinhTuyen.soPush = 0
  baiHienTai.lesson = taoBai()
  vi.useFakeTimers()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

describe('ProgrammingLessonPage — hoạt họa tùy chọn', () => {
  it('bài thiếu hoạt họa không hiện khung rỗng hay nút phát/dừng', () => {
    mo()
    expect(container.querySelector('figure')).toBeNull()
    expect(chu()).not.toContain('Tạm dừng hoạt ảnh')
    expect(chu()).toContain('Lý thuyết')
  })

  it('hiện renderer thật sau lý thuyết ở Khái niệm, có mô tả và toàn bộ lời dẫn', () => {
    mo({ ...taoBai(), animation: hoatHoa })
    const concept = container.querySelector('section[aria-labelledby="concept"]')!
    const figure = concept.querySelector('figure')!
    expect(figure).not.toBeNull()
    expect(figure.previousElementSibling?.textContent).toBe('Lý thuyết')
    expect(figure.textContent).toContain(hoatHoa.title)
    expect(figure.textContent).toContain(hoatHoa.description)
    for (const caption of hoatHoa.captions!) expect(figure.textContent).toContain(caption.text)
    const descriptionId = figure.querySelector('svg')?.getAttribute('aria-describedby')
    expect(document.getElementById(descriptionId!)?.textContent).toBe(hoatHoa.description)
    expect(figure.querySelector('[data-animated="true"]')).not.toBeNull()

    bam('Ví dụ mẫu')
    expect(container.querySelector('figure')).toBeNull()
    bam('Khái niệm')
    expect(container.querySelector('figure')?.textContent).toContain(hoatHoa.description)
  })

  it('dừng/chạy hoạt họa không gọi máy chạy code, ghi hoàn thành hay tạo thẻ SRS', () => {
    mo({ ...taoBai(), animation: hoatHoa })
    const soLanLuuTruoc = luuTienDo.mock.calls.length
    bam('Tạm dừng hoạt ảnh')
    expect(container.querySelector('figure style')?.textContent).toContain(
      'animation-play-state: paused',
    )
    bam('Chạy hoạt ảnh')
    expect(container.querySelector('figure style')?.textContent).toContain(
      'animation-play-state: running',
    )
    expect(mayChay.soLan).toBe(0)
    expect(luuTienDo.mock.calls.length).toBe(soLanLuuTruoc)
    expect(luuTienDo.mock.calls.some((call) => call[2] === 'completed')).toBe(false)
    expect(themSrs).not.toHaveBeenCalled()
  })

  it('thêm hoạt họa vẫn khôi phục nháp code cũ, không đánh dấu bài đã đổi', () => {
    mo()
    bam('Tự viết')
    goCode('print("nhap truoc khi them hoat hoa")')
    act(() => vi.advanceTimersByTime(600))
    act(() => root.unmount())
    root = createRoot(container)
    mo({ ...taoBai(), animation: hoatHoa })

    expect(oCode().value).toBe('print("nhap truoc khi them hoat hoa")')
    expect(chu()).toContain('Đã khôi phục code bạn gõ')
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(luuTienDo.mock.calls.some((call) => call[2] === 'completed')).toBe(false)
    expect(themSrs).not.toHaveBeenCalled()
    bam('Khái niệm')
    expect(container.querySelector('figure')?.textContent).toContain(hoatHoa.title)
  })
})

describe('ProgrammingLessonPage — phiên học (S08-2)', () => {
  it('AC-11: reload giữa chừng về đúng bước "Tự viết" + đúng code đã gõ, kết quả chấm không khôi phục', () => {
    mo()
    bam('Tự viết')
    goCode('print("dang lam do")')
    act(() => vi.advanceTimersByTime(600))
    expect(chu()).toContain('Tự viết đi')

    // Tải lại trang
    act(() => root.unmount())
    root = createRoot(container)
    mo()

    expect(chu()).toContain('Tự viết đi') // vẫn ở bước Tự viết
    expect(oCode().value).toBe('print("dang lam do")')
    expect(chu()).not.toContain('Đạt toàn bộ test!')
    expect(chu()).toContain('Đã khôi phục code bạn gõ')
  })

  it('AC-12: đổi bài dùng starterCode của bài mới; quay lại bài cũ thì nháp còn', () => {
    mo()
    bam('Tự viết')
    goCode('code cua bai 1')
    act(() => vi.advanceTimersByTime(600))

    // Sang bài khác (trang dựng lại vì `key={lesson.id}`)
    const baiKhac: ProgrammingLesson = { ...taoBai(), id: 'p1-u4-l2' }
    act(() => root.unmount())
    root = createRoot(container)
    mo(baiKhac)
    bam('Tự viết')
    expect(oCode().value).toBe('# viết ở đây')

    // Quay lại bài cũ
    act(() => root.unmount())
    root = createRoot(container)
    mo(taoBai())
    expect(oCode().value).toBe('code cua bai 1')
  })

  it('AC-13: bài đổi nội dung → hộp hỏi, chưa bấm thì dùng starterCode mới; bấm "Dùng lại" mới đổ nháp', () => {
    mo()
    bam('Tự viết')
    goCode('code cu cua toi')
    act(() => vi.advanceTimersByTime(600))

    act(() => root.unmount())
    root = createRoot(container)
    mo(taoBai({ starterCode: '# đề bài đã đổi' }))

    expect(chu()).toContain('Bài này đã được cập nhật')
    bam('Tự viết')
    expect(oCode().value).toBe('# đề bài đã đổi') // KHÔNG tự prefill nháp cũ

    bam('Dùng lại code đã gõ')
    expect(oCode().value).toBe('code cu cua toi')
    expect(chu()).not.toContain('Bài này đã được cập nhật')
  })

  it('AC-13b: "Bắt đầu mới" xoá nháp cũ — lần tải sau không hỏi lại nữa', () => {
    mo()
    bam('Tự viết')
    goCode('code cu cua toi')
    act(() => vi.advanceTimersByTime(600))

    act(() => root.unmount())
    root = createRoot(container)
    mo(taoBai({ starterCode: '# đề bài đã đổi' }))
    bam('Bắt đầu mới')
    expect(chu()).not.toContain('Bài này đã được cập nhật')

    act(() => root.unmount())
    root = createRoot(container)
    mo(taoBai({ starterCode: '# đề bài đã đổi' }))
    expect(chu()).not.toContain('Bài này đã được cập nhật')
  })

  it('AC-14: chỉ reload thì KHÔNG hề ghi completed; đạt hết test mới ghi và nháp bị xoá', async () => {
    mo()
    bam('Tự viết')
    goCode('print("chua xong")')
    act(() => vi.advanceTimersByTime(600))
    act(() => root.unmount())
    root = createRoot(container)
    mo()

    expect(luuTienDo.mock.calls.some((c) => c[2] === 'completed')).toBe(false)

    // Bấm "Chấm bài" với code đạt → completed + nháp bị xoá.
    // Máy chấm là promise thật (không phải timer) nên phần này chạy với đồng hồ THẬT.
    goCode('print("xong")')
    vi.useRealTimers()
    act(() => {
      nut('Chấm bài').click()
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100))
    })
    expect(luuTienDo.mock.calls.some((c) => c[2] === 'completed')).toBe(true)
    const conKhoa = Object.keys(localStorage).filter((k) => k.startsWith(LEARNING_SESSION_PREFIX))
    expect(conKhoa).toEqual([])
  })
})

// ============================================================================================
// S09d — điều hướng sáu bước bằng URL
// (docs/specs/2026-09-23-uiux-s09-s12-trai-nghiem-va-nghiem-thu.md §2.8)
// ============================================================================================

/** Tải lại trang (unmount + mount) với phần đuôi URL (query/hash) tuỳ chọn. */
function taiLai(duoi = '', lesson: ProgrammingLesson = baiHienTai.lesson) {
  act(() => root.unmount())
  root = createRoot(container)
  mo(lesson, duoi)
}

/** Nhãn bước đang có `aria-current="step"` — phải có ĐÚNG MỘT trong DOM. */
function buocHienTai(): string {
  const cur = document.body.querySelectorAll('[aria-current="step"]')
  expect(cur).toHaveLength(1)
  return cur[0]!.getAttribute('aria-label') ?? ''
}

function lienKet(ten: string): HTMLAnchorElement {
  const found = [...document.body.querySelectorAll('a')].find(
    (a) => (a.textContent ?? '').trim() === ten,
  )
  if (!found) throw new Error(`Không thấy link "${ten}"`)
  return found
}

function idDangFocus(): string {
  return (document.activeElement as HTMLElement | null)?.id ?? ''
}

function quayLai(buoc: number) {
  act(() => {
    void dinhTuyen.nav?.(buoc)
  })
}

/** Để máy chấm giả (promise) chạy xong mà KHÔNG động tới timer giả. */
async function doiChamXong() {
  await act(async () => {
    for (let i = 0; i < 10; i += 1) await Promise.resolve()
  })
}

/** Lưu nháp: đang ở Tự viết, gõ code, chờ debounce ghi xuống storage. */
function luuNhapOMake(code: string) {
  mo()
  bam('Tự viết')
  goCode(code)
  act(() => vi.advanceTimersByTime(600))
}

describe('ProgrammingLessonPage — bước ↔ URL (S09d, §2.8)', () => {
  it('S09-P-AC01: sáu hash mở đúng bước + focus đúng heading, đúng một aria-current', () => {
    const mongDoi: Array<[string, string, string]> = [
      ['#concept', 'Khái niệm', 'Móc thực tế'],
      ['#example', 'Ví dụ mẫu', 'Chạy ví dụ'],
      ['#predict', 'Dự đoán', 'In ra gì?'],
      ['#parsons', 'Xếp code', 'Xếp đi'],
      ['#make', 'Tự viết', 'Tự viết đi'],
      ['#done', 'Về nhà', 'Về nhà làm'],
    ]
    mo()
    for (const [hash, nhan, chuTrongBuoc] of mongDoi) {
      taiLai(hash)
      expect(buocHienTai()).toContain(nhan)
      expect(chu()).toContain(chuTrongBuoc)
      expect(idDangFocus()).toBe(hash.slice(1))
    }
  })

  it('S09-P-AC02: resume Make + #predict → Predict, mọi trường nháp giữ nguyên', () => {
    luuNhapOMake('code dang go')
    // Thêm một trường nháp khác: mở 1 gợi ý.
    bam('Gợi ý (0/1)')
    act(() => vi.advanceTimersByTime(600))

    taiLai('#predict')
    expect(buocHienTai()).toContain('Dự đoán')
    expect(chu()).toContain('In ra gì?')

    bam('Tự viết')
    expect(oCode().value).toBe('code dang go')
    expect(chu()).toContain('gợi ý 1') // hintsShown vẫn là 1
  })

  it('mở bình thường không hash vẫn dùng bước resume (hành vi S08 giữ nguyên)', () => {
    luuNhapOMake('abc')
    taiLai()
    expect(buocHienTai()).toContain('Tự viết')
  })

  it('S09-P-AC04: hash lạ / step lưu 99 → Khái niệm + focus đầu bài, giữ nháp, không crash', () => {
    luuNhapOMake('nhap cua toi')
    taiLai('#khong-ton-tai')
    expect(buocHienTai()).toContain('Khái niệm')
    expect(idDangFocus()).toBe('dau-bai')
    bam('Tự viết')
    expect(oCode().value).toBe('nhap cua toi')
    act(() => vi.advanceTimersByTime(600))

    // Bước lưu ngoài phạm vi (sửa tay localStorage) → về bước 0, không đọc STEPS[99].
    const khoa = Object.keys(localStorage).find((k) => k.startsWith(LEARNING_SESSION_PREFIX))!
    const raw = JSON.parse(localStorage.getItem(khoa)!) as Record<string, unknown>
    localStorage.setItem(khoa, JSON.stringify({ ...raw, stepIndex: 99 }))
    taiLai()
    expect(buocHienTai()).toContain('Khái niệm')
    expect(mayChay.soLan).toBe(0)
  })

  it('hai cú bấm liền nhau trước khi trang kịp render lại (máy chậm): Back vẫn về đích thứ nhất', () => {
    // Bắt được trên CI (E2E S09-P-AC06, 2026-09-25): React Router v7 cập nhật location trong
    // `startTransition`, nên khi máy chậm cú bấm thứ hai chạy lúc trang CHƯA render lại, `loc`
    // trong handler vẫn là entry lúc mở bài (không hash, chưa ghi bước). `goTo` khi đó tưởng mình
    // còn ở entry đầu và `replace` ĐÈ MẤT entry `#example` vừa push, Back nhảy thẳng về đầu bài.
    // Hai cú bấm trong CÙNG một act() = React không render lại giữa chúng.
    mo()
    act(() => {
      nut('Ví dụ mẫu').click()
      lienKet('Kết quả chấm').click()
    })
    expect(dinhTuyen.loc?.hash).toBe('#ket-qua')
    quayLai(-1)
    expect(dinhTuyen.loc?.hash).toBe('#example')
    expect(buocHienTai()).toContain('Ví dụ mẫu')
    quayLai(-1)
    expect(dinhTuyen.loc?.hash).toBe('')
    expect(buocHienTai()).toContain('Khái niệm')
  })

  it('history: đích khác push MỘT entry, cùng đích chỉ focus; Back/Forward không push', () => {
    mo()
    expect(dinhTuyen.soPush).toBe(0)
    bam('Dự đoán')
    expect(dinhTuyen.loc?.hash).toBe('#predict')
    expect(dinhTuyen.soPush).toBe(1)
    expect(idDangFocus()).toBe('predict')

    // Cùng đích: không thêm entry, nhưng focus quay lại heading.
    act(() => (document.activeElement as HTMLElement | null)?.blur())
    bam('Dự đoán')
    expect(dinhTuyen.soPush).toBe(1)
    expect(idDangFocus()).toBe('predict')

    bam('Xếp code')
    expect(dinhTuyen.soPush).toBe(2)

    quayLai(-1)
    expect(buocHienTai()).toContain('Dự đoán')
    expect(idDangFocus()).toBe('predict')
    // Về entry đầu (không hash): dùng bước GHI trong entry (0), focus đầu bài.
    quayLai(-1)
    expect(dinhTuyen.loc?.hash).toBe('')
    expect(buocHienTai()).toContain('Khái niệm')
    expect(idDangFocus()).toBe('dau-bai')
    quayLai(1)
    expect(buocHienTai()).toContain('Dự đoán')
    expect(dinhTuyen.soPush).toBe(2)
  })

  it('Back về entry đầu KHÔNG lấy resume vừa bị đổi: dùng bước ghi lúc mở (Make)', () => {
    luuNhapOMake('x')
    taiLai() // mở bình thường → resume Make
    expect(buocHienTai()).toContain('Tự viết')
    bam('Dự đoán') // resume trên máy giờ là Dự đoán
    act(() => vi.advanceTimersByTime(600))
    quayLai(-1)
    expect(buocHienTai()).toContain('Tự viết')
  })

  it('giữ ?khoa= và query khác khi nhảy bước', () => {
    mo(taoBai(), '?khoa=git&x=1')
    bam('Xếp code')
    expect(dinhTuyen.loc?.search).toBe('?khoa=git&x=1')
    expect(dinhTuyen.loc?.hash).toBe('#parsons')
  })

  it('URL bare-id chuyển về URL chuẩn GIỮ query + hash', () => {
    baiHienTai.lesson = taoBai()
    act(() =>
      root.render(
        <MemoryRouter initialEntries={['/lap-trinh/bai-hoc/p1-u4-l1?khoa=git#predict']}>
          <Routes>
            <Route
              path="/lap-trinh/bai-hoc/:lessonId"
              element={
                <>
                  <ProgrammingLessonPage />
                  <DoViTri />
                </>
              }
            />
            <Route
              path="/goc-hoc-tap/programming/bai-hoc/:lessonId"
              element={
                <>
                  <ProgrammingLessonPage />
                  <DoViTri />
                </>
              }
            />
          </Routes>
        </MemoryRouter>,
      ),
    )
    expect(dinhTuyen.loc?.pathname).toBe(
      `/goc-hoc-tap/programming/bai-hoc/${buildSlugSegment('p1-u4-l1', 'Bài thử')}`,
    )
    expect(dinhTuyen.loc?.search).toBe('?khoa=git')
    expect(dinhTuyen.loc?.hash).toBe('#predict')
    expect(buocHienTai()).toContain('Dự đoán')
  })

  it('S09-P-AC03 adopt: stale + #predict — chưa quyết thì không ghi đè; "Dùng lại" nhận nháp rồi áp hash', () => {
    luuNhapOMake('code cu')
    taiLai('#predict', taoBai({ starterCode: '# đề mới' }))
    expect(chu()).toContain('Bài này đã được cập nhật')
    // Chưa quyết: nháp stale KHÔNG bị ghi đè trong storage bởi bước URL.
    const khoa = Object.keys(localStorage).find((k) => k.startsWith(LEARNING_SESSION_PREFIX))!
    const truoc = localStorage.getItem(khoa)
    act(() => vi.advanceTimersByTime(600))
    expect(localStorage.getItem(khoa)).toBe(truoc)

    bam('Dùng lại code đã gõ')
    expect(buocHienTai()).toContain('Dự đoán')
    expect(idDangFocus()).toBe('predict')
    bam('Tự viết')
    expect(oCode().value).toBe('code cu')
  })

  it('S09-P-AC03 discard: stale + #predict — "Bắt đầu mới" dùng nháp mới rồi áp hash', () => {
    luuNhapOMake('code cu')
    taiLai('#predict', taoBai({ starterCode: '# đề mới' }))
    // Có hai nút "Bắt đầu mới" (nút đóng modal + nút chính) — bấm nút chính (cuối).
    const nutMoi = [...document.body.querySelectorAll('button')].filter(
      (b) => (b.textContent ?? '').trim() === 'Bắt đầu mới',
    )
    act(() => nutMoi[nutMoi.length - 1]!.click())
    expect(buocHienTai()).toContain('Dự đoán')
    bam('Tự viết')
    expect(oCode().value).toBe('# đề mới')
  })

  it('S09-P-AC05 rỗng: shortcut "Kết quả chấm" 1 kích hoạt → Make + focus #ket-qua, nói rõ chưa có kết quả', () => {
    mo()
    act(() => lienKet('Kết quả chấm').click())
    expect(buocHienTai()).toContain('Tự viết')
    expect(dinhTuyen.loc?.hash).toBe('#ket-qua')
    expect(idDangFocus()).toBe('ket-qua')
    expect(chu()).toContain('Chưa có kết quả chấm trong lần mở bài này')
    expect(mayChay.soLan).toBe(0)
  })

  it('S09-P-AC05 dở dang: đang chấm, ca 1 đạt nhưng ca 2 chưa về → KHÔNG báo đạt toàn bài', async () => {
    const hai = taoBai({
      testCases: [
        { stdinLines: [], expected: 'xong', match: 'contains', hidden: false, label: 'ca 1' },
        { stdinLines: [], expected: 'xong', match: 'contains', hidden: false, label: 'ca 2' },
      ],
    })
    let thaCa2: (v: KetQuaChay) => void = () => {}
    mayChay.impl = () =>
      mayChay.soLan === 1
        ? Promise.resolve({ output: 'xong', error: undefined })
        : new Promise<KetQuaChay>((r) => {
            thaCa2 = r
          })
    mo(hai, '#make')
    goCode('print("xong")')
    act(() => nut('Chấm bài').click())
    await doiChamXong()
    expect(chu()).toContain('Đang chấm')
    expect(chu()).not.toContain('Đạt toàn bộ test!')
    expect(buocHienTai()).toContain('chưa đạt')

    thaCa2({ output: 'xong', error: undefined })
    await doiChamXong()
    expect(chu()).toContain('Đạt toàn bộ test!')
  })

  it('S09-P-AC05/AC07: nhảy bước giữ kết quả trong phiên; không chạy/chấm/lưu thêm vì jump', async () => {
    mo(taoBai(), '#make')
    goCode('print("chua")')
    act(() => nut('Chấm bài').click())
    await doiChamXong()
    expect(chu()).toContain('Đã chấm xong')
    const soChay = mayChay.soLan
    const soLuu = luuTienDo.mock.calls.length
    const soSrs = themSrs.mock.calls.length

    bam('Dự đoán')
    bam('Về nhà')
    act(() => lienKet('Kết quả chấm').click())
    quayLai(-1)
    quayLai(1)
    expect(idDangFocus()).toBe('ket-qua')
    expect(chu()).toContain('Đã chấm xong') // kết quả memory còn
    expect(mayChay.soLan).toBe(soChay)
    expect(luuTienDo.mock.calls.length).toBe(soLuu)
    expect(themSrs.mock.calls.length).toBe(soSrs)
  })

  it('S09-P-AC05 reload: kết quả KHÔNG được dựng lại từ nháp', async () => {
    mo(taoBai(), '#make')
    goCode('print("chua")')
    act(() => nut('Chấm bài').click())
    await doiChamXong()
    act(() => vi.advanceTimersByTime(600))
    taiLai('#ket-qua')
    expect(idDangFocus()).toBe('ket-qua')
    expect(chu()).toContain('Chưa có kết quả chấm trong lần mở bài này')
  })

  it('"Về nhà" không đồng nghĩa đã đạt bài', () => {
    mo(taoBai(), '#done')
    expect(chu()).not.toContain('Bài học đã hoàn thành')
  })

  it('S09-P-AC08: đổi owner giữa lúc chấm chậm → không hiện kết quả phiên cũ, không ghi completed', async () => {
    let tha: (v: KetQuaChay) => void = () => {}
    mayChay.impl = () =>
      new Promise<KetQuaChay>((r) => {
        tha = r
      })
    mo(taoBai(), '#make')
    goCode('print("xong")')
    act(() => nut('Chấm bài').click())
    await doiChamXong()
    expect(chu()).toContain('Đang chấm')

    dangNhap.ctx = taoCtx('u2')
    mo(taoBai(), '#make') // render lại cùng root: owner đổi, trang không remount
    tha({ output: 'xong', error: undefined })
    await doiChamXong()
    expect(chu()).not.toContain('Đạt toàn bộ test!')
    expect(chu()).not.toContain('Đang chấm')
    expect(luuTienDo.mock.calls.some((c) => c[2] === 'completed')).toBe(false)
  })

  it('S09-P-AC08: kết quả đã chấm của owner cũ không hiện cho owner mới', async () => {
    mo(taoBai(), '#make')
    goCode('print("chua")')
    act(() => nut('Chấm bài').click())
    await doiChamXong()
    expect(chu()).toContain('Đã chấm xong')
    dangNhap.ctx = taoCtx('u2')
    mo(taoBai(), '#make')
    expect(chu()).not.toContain('Đã chấm xong')
    expect(chu()).toContain('Chưa có kết quả chấm trong lần mở bài này')
  })

  it('S09-P-AC08: owner A → B → A giữa lúc chấm dở: A không bị kẹt "Đang chấm", chấm lại được', async () => {
    let tha: (v: KetQuaChay) => void = () => {}
    mayChay.impl = () =>
      new Promise<KetQuaChay>((r) => {
        tha = r
      })
    mo(taoBai(), '#make')
    goCode('print("chua")')
    act(() => nut('Chấm bài').click())
    await doiChamXong()
    expect(chu()).toContain('Đang chấm')

    dangNhap.ctx = taoCtx('u2')
    mo(taoBai(), '#make')
    dangNhap.ctx = taoCtx('u1')
    mo(taoBai(), '#make')
    tha({ output: 'chua', error: undefined }) // lượt cũ về muộn — phải bị bỏ
    await doiChamXong()
    expect(chu()).not.toContain('Đang chấm')
    expect(chu()).toContain('Chưa có kết quả chấm trong lần mở bài này')

    // Lượt chấm MỚI của chính A vẫn chạy được (không bị chặn bởi cờ `grading` cũ).
    mayChay.impl = mayChayMacDinh
    const truoc = mayChay.soLan
    act(() => nut('Chấm bài').click())
    await doiChamXong()
    expect(mayChay.soLan).toBeGreaterThan(truoc)
    expect(chu()).toContain('Đã chấm xong')
  })

  it('bấm lại đúng bước đang hiện (chưa có hash) không thêm history entry, chỉ focus', () => {
    mo()
    expect(buocHienTai()).toContain('Khái niệm')
    bam('Khái niệm')
    expect(dinhTuyen.soPush).toBe(0)
    expect(dinhTuyen.loc?.hash).toBe('')
    expect(idDangFocus()).toBe('concept')
  })
})
