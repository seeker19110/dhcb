// S09c — hội thoại mẫu English: URL `?lesson=N#luot-M`, fallback, lỗi tải/Thử lại, history,
// focus, huỷ audio/đóng vai khi điều hướng, `#ket-qua`. Contract: spec 2026-09-23 §2.7.
// Chạy trên DỮ LIỆU THẬT (`apps/dhcb/public/data/lessons/*.json`) qua fetch giả lập; audio, micro,
// STT và AI đều MOCK — không gọi nhà cung cấp trả phí.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useNavigationType,
  type Location,
  type NavigateFunction,
} from 'react-router-dom'
import Lessons from './Lessons'
import { speak, stopSpeaking } from '../../../lib/tts'
import { startRecording } from '../../../lib/sttServer'
import { callClaude } from '../../../lib/ai'
import { incrementUsage } from '../../../lib/storage'
import { markViewed } from '../../../lib/viewedTracking'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)

// Layout giả: chỉ dựng nút Back khi trang truyền `onBack` — nhãn lấy từ đốt cha cuối của
// `crumbs`, như Layout thật (khuôn mobile chi tiết bài dùng nó để về danh sách, 2026-10-02).
vi.mock('../../../components/Layout', () => ({
  default: ({
    onBack,
    crumbs,
  }: {
    onBack?: () => void
    crumbs?: readonly { label: string; to: string }[]
  }) =>
    onBack ? (
      <button type="button" onClick={onBack}>
        {crumbs?.[crumbs.length - 2]?.label ?? 'Back'}
      </button>
    ) : null,
}))

const auth = vi.hoisted(() => ({ user: { id: 'u1', plan: 'vip' } as { id: string; plan: string } }))
vi.mock('../../../context/useAuth', () => ({
  useAuth: () => ({ user: auth.user, loading: false }),
}))

const vp = vi.hoisted(() => ({ desktop: false }))
vi.mock('../../../lib/useIsDesktopViewport', () => ({ useIsDesktopViewport: () => vp.desktop }))

vi.mock('../../../lib/tts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../lib/tts')>()),
  speak: vi.fn(async () => 0),
  stopSpeaking: vi.fn(),
  prefetchSpeech: vi.fn(async () => undefined),
  unlockAudio: vi.fn(),
  pauseCurrentAudio: vi.fn(),
  resumeCurrentAudio: vi.fn(),
}))
vi.mock('../../../lib/sttServer', () => ({
  isRecordingSupported: () => true,
  startRecording: vi.fn(),
}))
vi.mock('../../../lib/ai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../lib/ai')>()),
  callClaude: vi.fn(),
}))
vi.mock('../../../lib/storage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../lib/storage')>()),
  incrementUsage: vi.fn(),
}))
vi.mock('../../../lib/viewedTracking', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../../lib/viewedTracking')>()
  return { ...orig, markViewed: vi.fn(orig.markViewed) }
})

const DATA_DIR = resolve('apps/dhcb/public/data/lessons')
const readData = (f: string): string => readFileSync(resolve(DATA_DIR, f), 'utf8')
const ROUTE = '/goc-hoc-tap/english/bai-hoc'

// Bộ phục vụ fetch: mặc định trả file thật; test ghi đè từng URL (trì hoãn / HTTP lỗi).
type Handler = () => Promise<Response>
const overrides = new Map<string, Handler>()
const fetchCalls: string[] = []
function okJson(body: string): Response {
  return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } })
}
async function fakeFetch(input: RequestInfo | URL): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  fetchCalls.push(url)
  const name = url.split('/').pop() ?? ''
  const o = overrides.get(name)
  if (o) return o()
  return okJson(readData(name))
}

function deferred<T>() {
  let res!: (v: T) => void
  const promise = new Promise<T>((r) => (res = r))
  return { promise, resolve: res }
}

let navigate: NavigateFunction
const locations: Location[] = []
const navTypes: string[] = []
function Spy() {
  const loc = useLocation()
  const type = useNavigationType()
  const go = useNavigate()
  useEffect(() => {
    navigate = go
  }, [go])
  useEffect(() => {
    locations.push(loc)
    navTypes.push(type)
  }, [loc, type])
  return null
}
const current = () => locations[locations.length - 1]!

describe('S09c — trang Bài hội thoại mẫu', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(fakeFetch))
    overrides.clear()
    fetchCalls.length = 0
    locations.length = 0
    navTypes.length = 0
    vp.desktop = false
    auth.user = { id: 'u1', plan: 'vip' }
    localStorage.clear()
    vi.mocked(speak).mockClear()
    vi.mocked(stopSpeaking).mockClear()
    vi.mocked(markViewed).mockClear()
    vi.mocked(incrementUsage).mockClear()
    vi.mocked(callClaude).mockReset()
    vi.mocked(startRecording).mockReset()
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => undefined)
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  async function tick(n = 4) {
    for (let i = 0; i < n; i++) {
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0))
      })
    }
  }

  async function waitUntil(cond: () => boolean, label: string, ms = 2000) {
    const start = Date.now()
    while (!cond()) {
      if (Date.now() - start > ms) throw new Error(`Hết giờ chờ: ${label}`)
      await tick(1)
    }
  }

  async function open(url: string) {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[url]}>
          <Spy />
          <Routes>
            <Route path={ROUTE} element={<Lessons />} />
          </Routes>
        </MemoryRouter>,
      )
    })
    await tick()
  }

  const byId = (id: string) => container.querySelector<HTMLElement>(`[id="${id}"]`)
  const buttonByText = (re: RegExp) =>
    [...container.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      re.test(b.textContent ?? ''),
    )

  // ── S09-EN-AC01 ────────────────────────────────────────────────────────────
  it('AC01: direct ?lesson=1#luot-20 → focus lượt 20 có nhãn "Lượt 20 — Tom"', async () => {
    await open(`${ROUTE}?lesson=1#luot-20`)
    await waitUntil(() => byId('luot-20') !== null, 'lượt 20 render')
    const el = document.activeElement as HTMLElement
    expect(el.id).toBe('luot-20')
    expect(el.tabIndex).toBe(-1)
    expect(el.getAttribute('aria-label')).toBe('Lượt 20 — Tom')
    expect(markViewed).toHaveBeenCalledTimes(1)
  })

  it('AC01 chiều B: nhãn tiếng Anh, vẫn đúng lượt', async () => {
    localStorage.setItem('et_direction', 'B')
    await open(`${ROUTE}?lesson=1#luot-3`)
    await waitUntil(() => byId('luot-3') !== null, 'lượt 3 render')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Turn 3 — Lan')
  })

  it('AC01: Trong bài → Lượt 20 trong ≤2 kích hoạt, chọn lại cùng đích không push', async () => {
    await open(`${ROUTE}?lesson=1`)
    await waitUntil(() => byId('dau-bai') !== null, 'bài 1 render')
    const trigger = buttonByText(/Trong bài/)!
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    act(() => trigger.click()) // kích hoạt 1
    const link = container.querySelector<HTMLAnchorElement>('a[href="#luot-20"]')!
    expect(link.getAttribute('aria-label')).toBe('Lượt 20 — Tom')
    act(() => link.click()) // kích hoạt 2
    await tick()
    expect(current().hash).toBe('#luot-20')
    expect(current().search).toBe('?lesson=1')
    expect(document.activeElement?.id).toBe('luot-20')
    const pushes = navTypes.filter((t) => t === 'PUSH').length
    // Chọn lại CÙNG đích: chỉ focus lại, không thêm entry.
    act(() => buttonByText(/Trong bài/)!.click())
    act(() => container.querySelector<HTMLAnchorElement>('a[href="#luot-20"]')!.click())
    await tick()
    expect(navTypes.filter((t) => t === 'PUSH').length).toBe(pushes)
    expect(document.activeElement?.id).toBe('luot-20')
    // Escape khi chưa chọn → trả focus về nút mở.
    act(() => buttonByText(/Trong bài/)!.click())
    const first = container.querySelector<HTMLAnchorElement>('a[href="#dau-bai"]')!
    act(() => {
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(document.activeElement).toBe(buttonByText(/Trong bài/))
    // Đổi hash không chạy lại markViewed.
    expect(markViewed).toHaveBeenCalledTimes(1)
  })

  it('AC01: Back/Forward đọc URL và focus đúng đích', async () => {
    await open(`${ROUTE}?lesson=1#luot-2`)
    await waitUntil(() => byId('luot-2') !== null, 'render')
    await act(async () => navigate('?lesson=1#luot-5'))
    await tick()
    expect(document.activeElement?.id).toBe('luot-5')
    await act(async () => navigate(-1))
    await tick()
    expect(document.activeElement?.id).toBe('luot-2')
  })

  // ── S09-EN-AC04 ────────────────────────────────────────────────────────────
  for (const q of ['lesson=0', 'lesson=abc', 'lesson=', 'lesson=1&lesson=2', 'lesson=9999']) {
    it(`AC04: ?${q} → báo tại danh sách, focus heading, không mở bài nào`, async () => {
      await open(`${ROUTE}?${q}`)
      await waitUntil(() => byId('bai-khong-mo-duoc') !== null, 'thông báo')
      expect(document.activeElement?.id).toBe('bai-khong-mo-duoc')
      expect(byId('dau-bai')).toBeNull()
      expect(markViewed).not.toHaveBeenCalled()
      // Không nạp chunk nào: không mở nhầm bài.
      expect(fetchCalls.some((u) => u.includes('chunk-'))).toBe(false)
    })
  }

  for (const h of ['#luot-0', '#luot-21', '#luot-01', '#abc', '#%22%3E']) {
    it(`AC04: bài 1 ${h} → về tiêu đề bài, không kẹp sang lượt cuối`, async () => {
      await open(`${ROUTE}?lesson=1${h}`)
      await waitUntil(() => byId('dau-bai') !== null, 'render')
      expect(document.activeElement?.id).toBe('dau-bai')
    })
  }

  // ── S09-EN-AC03 ────────────────────────────────────────────────────────────
  it('AC03: bài 11 tải chậm, chuyển sang bài 1 → không nhận response cũ, không focus cũ', async () => {
    const slow = deferred<Response>()
    overrides.set('chunk-001.json', () => slow.promise)
    await open(`${ROUTE}?lesson=11#luot-4`)
    await act(async () => navigate('?lesson=1#luot-2'))
    await waitUntil(() => byId('luot-2') !== null, 'bài 1')
    expect(document.activeElement?.id).toBe('luot-2')
    await act(async () => slow.resolve(okJson(readData('chunk-001.json'))))
    await tick()
    expect(byId('dau-bai')?.textContent).toContain('Giới thiệu bản thân')
    expect(document.activeElement?.id).toBe('luot-2')
  })

  it('AC03: HTTP 503 → báo lỗi tải có Thử lại (không phải "không tìm thấy"); Thử lại mở được bài', async () => {
    let fail = true
    overrides.set('chunk-001.json', async () =>
      fail ? new Response('', { status: 503 }) : okJson(readData('chunk-001.json')),
    )
    // Chunk-001 có thể đã được cache bởi test trước — dùng module loader mới cho ca này.
    vi.resetModules()
    const { default: FreshLessons } = await import('./Lessons')
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[`${ROUTE}?lesson=11`]}>
          <Spy />
          <Routes>
            <Route path={ROUTE} element={<FreshLessons />} />
          </Routes>
        </MemoryRouter>,
      )
    })
    await waitUntil(() => buttonByText(/Thử lại/) !== undefined, 'nút thử lại')
    expect(byId('bai-khong-mo-duoc')).toBeNull()
    expect(container.textContent).toContain('Không tải được')
    fail = false
    act(() => buttonByText(/Thử lại/)!.click())
    await waitUntil(() => byId('dau-bai') !== null, 'bài 11 sau thử lại')
    expect(byId('dau-bai')?.textContent).toContain('Trả phòng khách sạn')
  })

  it('AC03: lỗi tải CHỈ MỤC có Thử lại riêng', async () => {
    let fail = true
    overrides.set('index.json', async () => {
      if (fail) throw new TypeError('Failed to fetch')
      return okJson(readData('index.json'))
    })
    // Module loader có thể đã cache chỉ mục từ test trước — dùng module mới cho ca này.
    vi.resetModules()
    const { default: FreshLessons } = await import('./Lessons')
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[`${ROUTE}?lesson=1`]}>
          <Spy />
          <Routes>
            <Route path={ROUTE} element={<FreshLessons />} />
          </Routes>
        </MemoryRouter>,
      )
    })
    await waitUntil(() => buttonByText(/Thử lại/) !== undefined, 'thử lại chỉ mục')
    expect(byId('bai-khong-mo-duoc')).toBeNull()
    fail = false
    act(() => buttonByText(/Thử lại/)!.click())
    await waitUntil(() => byId('dau-bai') !== null, 'bài 1 sau thử lại')
  })

  // ── History / Danh sách (nút Back của header ở khuôn mobile) ───────────────
  it('"Danh sách" bỏ lesson + hash, giữ query khác, focus lại thẻ bài vừa mở', async () => {
    await open(`${ROUTE}?from=home&lesson=1#luot-3`)
    await waitUntil(() => byId('luot-3') !== null, 'render')
    act(() => buttonByText(/Danh sách/)!.click())
    await waitUntil(() => byId('lesson-card-1') !== null, 'danh sách')
    expect(current().search).toBe('?from=home')
    expect(current().hash).toBe('')
    expect(navTypes[navTypes.length - 1]).toBe('PUSH')
    expect(document.activeElement?.id).toBe('lesson-card-1')
  })

  // ── Thanh công cụ mobile gọn một hàng (2026-10-02) ────────────────────────
  it('mobile: tốc độ / chế độ nghe / cài đặt giọng nằm sau nút "Tuỳ chọn nghe"; desktop hiện thẳng', async () => {
    await open(`${ROUTE}?lesson=1`)
    await waitUntil(() => byId('dau-bai') !== null, 'bài 1')
    const nutTuyChon = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Tuỳ chọn nghe"]',
    )!
    expect(nutTuyChon.getAttribute('aria-expanded')).toBe('false')
    // Đóng thì không trỏ aria-controls vào phần tử không có trong DOM.
    expect(nutTuyChon.hasAttribute('aria-controls')).toBe(false)
    expect(buttonByText(/Cài đặt giọng/)).toBeUndefined()
    expect(buttonByText(/^EN\+VI$/)).toBeUndefined()
    // Nút về danh sách KHÔNG còn trong thanh công cụ — nút Back của header làm việc đó.
    expect(buttonByText(/← Danh sách/)).toBeUndefined()

    act(() => nutTuyChon.click())
    expect(nutTuyChon.getAttribute('aria-expanded')).toBe('true')
    const bang = byId(nutTuyChon.getAttribute('aria-controls')!)
    expect(bang).not.toBeNull()
    expect(bang!.textContent).toContain('Cài đặt giọng')
    expect(bang!.textContent).toContain('EN+VI')

    // Desktop: không có nút Tuỳ chọn, mọi điều khiển hiện thẳng trên thanh.
    act(() => root.unmount())
    root = createRoot(container)
    vp.desktop = true
    await open(`${ROUTE}?lesson=1`)
    await waitUntil(() => byId('dau-bai') !== null, 'bài 1 desktop')
    expect(container.querySelector('button[aria-label="Tuỳ chọn nghe"]')).toBeNull()
    expect(buttonByText(/Cài đặt giọng/)).toBeDefined()
  })

  it('chọn bài trong danh sách push đúng một entry, không hash', async () => {
    await open(`${ROUTE}?from=home`)
    await waitUntil(() => byId('lesson-card-2') !== null, 'danh sách')
    const before = navTypes.length
    act(() => byId('lesson-card-2')!.click())
    await waitUntil(() => byId('dau-bai') !== null, 'bài 2')
    expect(navTypes.slice(before)).toEqual(['PUSH'])
    expect(current().search).toBe('?from=home&lesson=2')
  })

  // ── S09-EN-AC05 ────────────────────────────────────────────────────────────
  it('AC05: #ket-qua khi chưa chấm → thông báo rỗng, không điểm giả, không gọi chấm', async () => {
    await open(`${ROUTE}?lesson=1#ket-qua`)
    await waitUntil(() => byId('ket-qua') !== null, 'render')
    expect(document.activeElement?.id).toBe('ket-qua')
    expect(container.textContent).toContain('Chưa có kết quả trong lần mở bài này')
    expect(callClaude).not.toHaveBeenCalled()
  })

  // ── S09-EN-AC02 — audio ─────────────────────────────────────────────────────
  it('AC02: đang "Phát tất cả" mà đổi bài → dừng, không phát tiếp lượt nào của bài cũ', async () => {
    const hold = deferred<number>()
    vi.mocked(speak).mockImplementationOnce(() => hold.promise)
    await open(`${ROUTE}?lesson=1`)
    await waitUntil(() => byId('dau-bai') !== null, 'render')
    act(() => buttonByText(/Phát tất cả/)!.click())
    await tick()
    expect(speak).toHaveBeenCalledTimes(1)
    await act(async () => navigate('?lesson=2'))
    await waitUntil(() => byId('dau-bai')?.textContent?.includes('Một ngày') === true, 'bài 2')
    expect(stopSpeaking).toHaveBeenCalled()
    await act(async () => hold.resolve(0))
    await tick(8)
    // Chuỗi cũ không được phát lượt 2 sau khi lời đọc lượt 1 trả về.
    expect(speak).toHaveBeenCalledTimes(1)
  })

  it('AC02: nhảy hash trong lúc phát → dừng phát, không tự phát lại', async () => {
    const hold = deferred<number>()
    vi.mocked(speak).mockImplementationOnce(() => hold.promise)
    await open(`${ROUTE}?lesson=1`)
    await waitUntil(() => byId('dau-bai') !== null, 'render')
    act(() => buttonByText(/Phát tất cả/)!.click())
    await tick()
    await act(async () => navigate('?lesson=1#luot-10'))
    await tick()
    await act(async () => hold.resolve(0))
    await tick(8)
    expect(speak).toHaveBeenCalledTimes(1)
    expect(buttonByText(/Phát tất cả/)).toBeDefined()
  })
})

// ── Đóng vai: dùng bài tổng hợp 2 lượt để không phải chờ 20 lượt thật ───────────
describe('S09c — huỷ đóng vai/chấm khi điều hướng (AC02, AC05, AC06)', () => {
  let container: HTMLDivElement
  let root: Root

  const INDEX = [
    {
      id: 1,
      title: 'Bài thử một',
      situation: 's',
      turnCount: 2,
      speakerAGender: 'female',
      speakerBGender: 'male',
      chunk: 0,
      idx: 0,
    },
    {
      id: 2,
      title: 'Bài thử hai',
      situation: 's',
      turnCount: 2,
      speakerAGender: 'female',
      speakerBGender: 'male',
      chunk: 0,
      idx: 1,
    },
  ]
  const mk = (id: number) => ({
    id,
    title: `Bài thử ${id === 1 ? 'một' : 'hai'}`,
    situation: 's',
    speakerAGender: 'female',
    speakerBGender: 'male',
    speakerAName: { vi: 'Lan', en: 'Lan' },
    speakerBName: { vi: 'Tom', en: 'Tom' },
    turns: [
      { speaker: 'A', en: 'Hi Tom', vi: 'Chào Tom' },
      { speaker: 'B', en: 'Hi Lan', vi: 'Chào Lan' },
    ],
  })
  const EVAL = {
    scores: { fluency: 6, lexical: 6, grammar: 6, overall: 6 },
    errors: [
      {
        original: 'Hi Lan',
        corrected: 'Hi, Lan',
        explanation: 'Giải thích dài '.repeat(40),
      },
      { original: 'Hi Lan', corrected: 'Hello, Lan', explanation: 'Một cách khác.' },
    ],
    strengths: ['Rõ ràng'],
    suggestions: ['Luyện thêm'],
    encouragement: 'Cố lên nhé!',
  }

  let navigate2: NavigateFunction
  function Nav() {
    const go = useNavigate()
    useEffect(() => {
      navigate2 = go
    }, [go])
    return null
  }

  beforeEach(async () => {
    vi.resetModules()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        const body = url.endsWith('index.json') ? INDEX : [mk(1), mk(2)]
        return new Response(JSON.stringify(body), { status: 200 })
      }),
    )
    auth.user = { id: 'u1', plan: 'vip' }
    vp.desktop = false
    localStorage.clear()
    vi.mocked(speak).mockReset()
    vi.mocked(speak).mockImplementation(async () => 0)
    vi.mocked(callClaude).mockReset()
    vi.mocked(incrementUsage).mockClear()
    vi.mocked(startRecording).mockReset()
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => undefined)
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  async function tick(n = 4) {
    for (let i = 0; i < n; i++) {
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0))
      })
    }
  }
  async function waitUntil(cond: () => boolean, label: string, ms = 3000) {
    const start = Date.now()
    while (!cond()) {
      if (Date.now() - start > ms) throw new Error(`Hết giờ chờ: ${label}`)
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20))
      })
    }
  }
  const byId = (id: string) => container.querySelector<HTMLElement>(`[id="${id}"]`)
  const btn = (re: RegExp) =>
    [...container.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      re.test(b.textContent ?? ''),
    )

  async function openFresh(url: string) {
    const { default: L } = await import('./Lessons')
    // Sau `vi.resetModules()` phải lấy ToastProvider CÙNG bản module với trang vừa import.
    const { ToastProvider } = await import('@core/ToastProvider')
    await act(async () => {
      root.render(
        <ToastProvider>
          <MemoryRouter initialEntries={[url]}>
            <Nav />
            <Routes>
              <Route path={ROUTE} element={<L />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>,
      )
    })
    await waitUntil(() => byId('dau-bai') !== null, 'bài render')
  }

  // Đóng vai B: lượt 1 (A) do AI đọc → lượt 2 tới người dùng → ghi âm → dừng ghi.
  async function roleplayToFinish(stt: Promise<string>) {
    vi.mocked(startRecording).mockResolvedValue({ stop: () => stt, cancel: vi.fn() })
    act(() => btn(/Đóng vai/)!.click())
    act(() => btn(/^Tom$/)!.click())
    await waitUntil(() => btn(/Bấm để nói câu này/) !== undefined, 'tới lượt người dùng')
    await act(async () => btn(/Bấm để nói câu này/)!.click())
    await tick()
    act(() => btn(/Dừng ghi âm/)!.click())
    await tick()
  }

  it('AC02: điều hướng khi STT đang chờ → không nhận transcript, không tới bước chấm', async () => {
    const stt = deferred<string>()
    await openFresh(`${ROUTE}?lesson=1`)
    await roleplayToFinish(stt.promise)
    await act(async () => navigate2('?lesson=1#luot-1'))
    await tick()
    await act(async () => stt.resolve('hi lan'))
    await tick(8)
    expect(btn(/Kết thúc & chấm điểm/)).toBeUndefined()
    expect(callClaude).not.toHaveBeenCalled()
    expect(btn(/Đóng vai/)).toBeDefined()
  })

  it('AC02: đổi bài khi đang chấm → bỏ response cũ, không cộng lượt, bài mới không lộ kết quả', async () => {
    const grade = deferred<string>()
    vi.mocked(callClaude).mockReturnValue(grade.promise)
    await openFresh(`${ROUTE}?lesson=1`)
    await roleplayToFinish(Promise.resolve('hi lan'))
    await waitUntil(() => btn(/Kết thúc & chấm điểm/) !== undefined, 'thanh chấm')
    act(() => btn(/Kết thúc & chấm điểm/)!.click())
    await tick()
    expect(callClaude).toHaveBeenCalledTimes(1)
    await act(async () => navigate2('?lesson=2#ket-qua'))
    await waitUntil(() => byId('dau-bai')?.textContent?.includes('hai') === true, 'bài 2')
    await act(async () => grade.resolve(JSON.stringify(EVAL)))
    await tick(8)
    expect(incrementUsage).not.toHaveBeenCalled()
    expect(container.textContent).toContain('Chưa có kết quả trong lần mở bài này')
    expect(container.textContent).not.toContain('Cố lên nhé!')
  })

  it('AC06: chấm xong → tới #ket-qua; summary + original/corrected đều thấy, không gắn lượt', async () => {
    vi.mocked(callClaude).mockResolvedValue(JSON.stringify(EVAL))
    await openFresh(`${ROUTE}?lesson=1`)
    await roleplayToFinish(Promise.resolve('hi lan'))
    await waitUntil(() => btn(/Kết thúc & chấm điểm/) !== undefined, 'thanh chấm')
    act(() => btn(/Kết thúc & chấm điểm/)!.click())
    await waitUntil(() => container.textContent?.includes('Cố lên nhé!') === true, 'kết quả')
    expect(incrementUsage).toHaveBeenCalledTimes(1)
    expect(document.activeElement?.id).toBe('ket-qua')
    const ketQua = byId('ket-qua')!.parentElement!
    expect(ketQua.textContent).toContain('→ Hi, Lan')
    expect(ketQua.textContent).toContain('→ Hello, Lan')
    // Không suy định danh lượt từ vị trí lỗi: không có link nào từ kết quả về #luot-N.
    expect(ketQua.querySelector('a[href^="#luot-"]')).toBeNull()
    // Kết quả KHÔNG dựng landmark <main> thứ hai bên trong trang.
    expect(ketQua.querySelector('main')).toBeNull()
    // Hội thoại vẫn còn trên trang (không bị màn kết quả thay thế).
    expect(byId('luot-2')).not.toBeNull()
    // Đóng kết quả → về #hoi-thoai, focus heading, kết quả biến mất.
    act(() => btn(/Tiếp tục hội thoại/)!.click())
    await tick()
    expect(document.activeElement?.id).toBe('hoi-thoai')
    expect(container.textContent).toContain('Chưa có kết quả trong lần mở bài này')
  })

  it('AC05: kết quả trong bộ nhớ không lộ sang owner khác', async () => {
    vi.mocked(callClaude).mockResolvedValue(JSON.stringify(EVAL))
    await openFresh(`${ROUTE}?lesson=1`)
    await roleplayToFinish(Promise.resolve('hi lan'))
    await waitUntil(() => btn(/Kết thúc & chấm điểm/) !== undefined, 'thanh chấm')
    act(() => btn(/Kết thúc & chấm điểm/)!.click())
    await waitUntil(() => container.textContent?.includes('Cố lên nhé!') === true, 'kết quả')
    auth.user = { id: 'u2', plan: 'vip' }
    const { default: L } = await import('./Lessons')
    // Sau `vi.resetModules()` phải lấy ToastProvider CÙNG bản module với trang vừa import.
    const { ToastProvider } = await import('@core/ToastProvider')
    await act(async () => {
      root.render(
        <ToastProvider>
          <MemoryRouter initialEntries={[`${ROUTE}?lesson=1#ket-qua`]}>
            <Nav />
            <Routes>
              <Route path={ROUTE} element={<L />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>,
      )
    })
    await tick()
    expect(container.textContent).not.toContain('Cố lên nhé!')
  })

  it('AC05: kết quả trong bộ nhớ không lộ sang chiều học khác', async () => {
    vi.mocked(callClaude).mockResolvedValue(JSON.stringify(EVAL))
    await openFresh(`${ROUTE}?lesson=1`)
    await roleplayToFinish(Promise.resolve('hi lan'))
    await waitUntil(() => btn(/Kết thúc & chấm điểm/) !== undefined, 'thanh chấm')
    act(() => btn(/Kết thúc & chấm điểm/)!.click())
    await waitUntil(() => container.textContent?.includes('Cố lên nhé!') === true, 'kết quả')
    localStorage.setItem('et_direction', 'B')
    const { default: L } = await import('./Lessons')
    // Sau `vi.resetModules()` phải lấy ToastProvider CÙNG bản module với trang vừa import.
    const { ToastProvider } = await import('@core/ToastProvider')
    await act(async () => {
      root.render(
        <ToastProvider>
          <MemoryRouter initialEntries={[`${ROUTE}?lesson=1#ket-qua`]}>
            <Nav />
            <Routes>
              <Route path={ROUTE} element={<L />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>,
      )
    })
    await tick()
    expect(container.textContent).toContain('No result yet in this visit to the lesson.')
    expect(container.textContent).not.toContain('Cố lên nhé!')
  })
})
