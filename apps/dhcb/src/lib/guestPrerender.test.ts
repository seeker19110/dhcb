// guestPrerender.test.ts — Luật bật/gỡ bản HTML dựng sẵn của trang chủ khách + các phép biến đổi
// index.html mà plugin Vite dùng. Cơ chế: lib/guestPrerender.ts.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  PRERENDER_ATTR,
  PRERENDER_CONTAINER_ID,
  PRERENDER_STYLE,
  buildPrerenderGateScript,
  deferBootScriptsWhilePrerendered,
  injectGuestPrerender,
  loadBootScripts,
  releaseGuestPrerender,
  shouldShowGuestPrerender,
} from './guestPrerender'
import { getStoredToken, setStoredToken } from '@core/authHeader'
import { getUiLang } from './uiLang'
import { DESKTOP_VIEWPORT_QUERY } from './useIsDesktopViewport'

function storageOf(entries: Record<string, string>): Pick<Storage, 'getItem'> {
  return { getItem: (k: string) => entries[k] ?? null }
}

describe('shouldShowGuestPrerender', () => {
  beforeEach(() => localStorage.clear())

  it('bật cho khách lần đầu mở / trên màn hẹp', () => {
    expect(shouldShowGuestPrerender('/', storageOf({}), false)).toBe(true)
  })

  it('tắt khi không phải /, khi màn desktop', () => {
    expect(shouldShowGuestPrerender('/goc-hoc-tap', storageOf({}), false)).toBe(false)
    expect(shouldShowGuestPrerender('/', storageOf({}), true)).toBe(false)
  })

  it('tắt khi máy có cờ phiên đăng nhập — đúng khoá mà @core/authHeader ghi', () => {
    setStoredToken()
    expect(shouldShowGuestPrerender('/', localStorage, false)).toBe(false)
  })

  it('tắt khi máy còn token đời cũ — đúng khoá mà getStoredToken() nhận', () => {
    localStorage.setItem('gsa_session_token_v1', 'legacy')
    expect(shouldShowGuestPrerender('/', localStorage, false)).toBe(false)
    expect(getStoredToken()).not.toBeNull()
  })

  it('khớp getUiLang(): chỉ bật khi giao diện là tiếng Việt', () => {
    const cases: Array<Record<string, string>> = [
      {},
      { ui_lang: 'vi' },
      { ui_lang: 'en' },
      { et_direction: 'B' },
      { et_direction: 'A' },
      { ui_lang: 'vi', et_direction: 'B' },
      { ui_lang: 'en', et_direction: 'A' },
    ]
    for (const entries of cases) {
      localStorage.clear()
      for (const [k, v] of Object.entries(entries)) localStorage.setItem(k, v)
      const shown = shouldShowGuestPrerender('/', storageOf(entries), false)
      expect(shown, JSON.stringify(entries)).toBe(getUiLang() === 'vi')
    }
  })

  it('đọc localStorage lỗi (bị chặn) → tắt, không ném', () => {
    const broken = {
      getItem: () => {
        throw new Error('SecurityError')
      },
    }
    expect(shouldShowGuestPrerender('/', broken, false)).toBe(false)
  })
})

describe('buildPrerenderGateScript — script inline tự đủ, chạy được ngoài module', () => {
  function runGate(opts: {
    pathname: string
    storage: Pick<Storage, 'getItem'>
    desktop: boolean
  }) {
    const html = document.createElement('html')
    const queries: string[] = []
    const matchMedia = (q: string) => {
      queries.push(q)
      return { matches: opts.desktop }
    }
    // Chạy đúng chuỗi sẽ nằm trong <head>, với các biến toàn cục giả — chứng minh hàm nhúng
    // không dựa vào biến nào ngoài thân nó.
    new Function(
      'location',
      'localStorage',
      'matchMedia',
      'document',
      buildPrerenderGateScript(DESKTOP_VIEWPORT_QUERY),
    )({ pathname: opts.pathname }, opts.storage, matchMedia, { documentElement: html })
    return { shown: html.hasAttribute(PRERENDER_ATTR), queries }
  }

  it('bật cờ trên <html> đúng khi luật cho phép, hỏi đúng ngưỡng desktop', () => {
    const r = runGate({ pathname: '/', storage: storageOf({}), desktop: false })
    expect(r.shown).toBe(true)
    expect(r.queries).toEqual([DESKTOP_VIEWPORT_QUERY])
  })

  it('không bật cờ khi luật không cho phép', () => {
    expect(runGate({ pathname: '/', storage: storageOf({}), desktop: true }).shown).toBe(false)
    expect(
      runGate({
        pathname: '/',
        storage: storageOf({ gsa_session_present_v1: 'session:x' }),
        desktop: false,
      }).shown,
    ).toBe(false)
  })
})

describe('injectGuestPrerender', () => {
  const html = readFileSync(join(__dirname, '..', '..', 'index.html'), 'utf8')
  const out = injectGuestPrerender(html, '\n<main>xin chào</main>\n', DESKTOP_VIEWPORT_QUERY)

  it('chèn khối dựng sẵn NGAY TRƯỚC #root của index.html thật', () => {
    expect(out).toContain(
      `<div id="${PRERENDER_CONTAINER_ID}"><main>xin chào</main></div><div id="root"></div>`,
    )
    expect(out.match(/id="root"/g)).toHaveLength(1)
  })

  it('CSS + script quyết định đứng ngay sau <meta charset>, trước mọi stylesheet', () => {
    const style = out.indexOf(`<style>${PRERENDER_STYLE}</style>`)
    const gate = out.indexOf(`<script>${buildPrerenderGateScript(DESKTOP_VIEWPORT_QUERY)}</script>`)
    expect(style).toBeGreaterThan(out.indexOf('<meta charset'))
    expect(gate).toBeGreaterThan(style)
    const firstStylesheet = out.indexOf('rel="stylesheet"')
    if (firstStylesheet !== -1) expect(gate).toBeLessThan(firstStylesheet)
    // charset vẫn trong 1024 byte đầu (HTML spec: trình duyệt chỉ dò charset trong đoạn này).
    expect(out.indexOf('<meta charset')).toBeLessThan(1024)
  })

  it('ném lỗi khi thiếu mốc — build đỏ thay vì âm thầm mất bản dựng sẵn', () => {
    expect(() => injectGuestPrerender('<div id="root">x</div>', '<p/>', '')).toThrow(/root/)
    expect(() => injectGuestPrerender('<div id="root"></div>', '<p/>', '')).toThrow(/charset/)
  })
})

describe('deferBootScriptsWhilePrerendered', () => {
  const built =
    '<head><meta charset="UTF-8" /><script>/* theme */</script>' +
    '<script type="module" crossorigin src="/js/index-abc.js"></script>\n' +
    '    <link rel="modulepreload" crossorigin href="/js/vendor-a.js">\n' +
    '    <link rel="modulepreload" crossorigin href="/js/vendor-b.js">\n' +
    '    <link rel="stylesheet" crossorigin href="/assets/index.css">\n' +
    '</head><body><script type="application/ld+json">{}</script></body>'
  const out = deferBootScriptsWhilePrerendered(built)

  it('bỏ thẻ script module + modulepreload tĩnh, thay bằng MỘT script nạp đặt trước stylesheet', () => {
    expect(out).not.toContain('<script type="module"')
    expect(out).not.toContain('rel="modulepreload"')
    const loader = out.indexOf('<script>(')
    expect(loader).toBeGreaterThan(out.indexOf('/* theme */'))
    expect(loader).toBeLessThan(out.indexOf('rel="stylesheet"'))
    expect(out).toContain('"/js/index-abc.js",["/js/vendor-a.js","/js/vendor-b.js"]')
  })

  it('không đụng stylesheet và script khác', () => {
    expect(out).toContain('<link rel="stylesheet" crossorigin href="/assets/index.css">')
    expect(out).toContain('<script>/* theme */</script>')
    expect(out).toContain('<script type="application/ld+json">{}</script>')
  })

  it('ném lỗi khi không thấy đúng 1 script module — Vite đổi khuôn thì build đỏ', () => {
    expect(() => deferBootScriptsWhilePrerendered('<head></head>')).toThrow(/thấy 0/)
  })
})

describe('loadBootScripts', () => {
  const ENTRY = '/js/index-abc.js'
  const PRELOADS = ['/js/vendor-a.js']

  // Ghi lại thẻ được gắn vào <head> thay vì gắn thật — happy-dom sẽ cố tải file JS giả.
  let appended: Element[] = []
  function bootTags() {
    return {
      scripts: appended
        .filter((el) => el.tagName === 'SCRIPT' && el.getAttribute('type') === 'module')
        .map((el) => el.getAttribute('src')),
      preloads: appended
        .filter((el) => el.tagName === 'LINK' && el.getAttribute('rel') === 'modulepreload')
        .map((el) => el.getAttribute('href')),
    }
  }

  beforeEach(() => {
    vi.useFakeTimers()
    appended = []
    vi.spyOn(document.head, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
      appended.push(node as unknown as Element)
      return node
    })
    document.documentElement.removeAttribute(PRERENDER_ATTR)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    document.documentElement.removeAttribute(PRERENDER_ATTR)
  })

  it('không hiện bản dựng sẵn → nạp NGAY, script chính đứng đầu hàng như thẻ tĩnh cũ', () => {
    loadBootScripts(ENTRY, PRELOADS, PRERENDER_ATTR, 2000)
    expect(bootTags()).toEqual({ scripts: [ENTRY], preloads: PRELOADS })
    expect(appended[0]?.tagName).toBe('SCRIPT')
  })

  // PerformanceObserver giả: giữ callback để test tự "bắn" sự kiện vẽ.
  function stubPaintObserver() {
    const observers: FakePO[] = []
    class FakePO {
      static supportedEntryTypes = ['paint']
      disconnected = false
      constructor(readonly cb: PerformanceObserverCallback) {
        observers.push(this)
      }
      observe() {}
      disconnect() {
        this.disconnected = true
      }
    }
    vi.stubGlobal('PerformanceObserver', FakePO)
    const paint = (name: string) => {
      for (const o of observers.filter((x) => !x.disconnected)) {
        const list = {
          getEntriesByName: (n: string) => (n === name ? [{ name }] : []),
        } as unknown as PerformanceObserverEntryList
        o.cb(list, o as unknown as PerformanceObserver)
      }
    }
    return { paint }
  }

  it('đang hiện bản dựng sẵn → chỉ nạp SAU first-contentful-paint, và chỉ MỘT lần', () => {
    const { paint } = stubPaintObserver()
    document.documentElement.setAttribute(PRERENDER_ATTR, '')

    loadBootScripts(ENTRY, PRELOADS, PRERENDER_ATTR, 2000)
    paint('first-paint') // khung hình chưa có chữ — chưa nạp
    vi.advanceTimersByTime(0)
    expect(bootTags().scripts).toEqual([])

    paint('first-contentful-paint')
    vi.advanceTimersByTime(0)
    expect(bootTags()).toEqual({ scripts: [ENTRY], preloads: PRELOADS })

    vi.advanceTimersByTime(5000) // hẹn giờ dự phòng tới hạn — không nạp lần hai
    expect(bootTags().scripts).toEqual([ENTRY])
    vi.unstubAllGlobals()
  })

  it('trình duyệt không có paint timing → nạp sau khung hình đầu (requestAnimationFrame)', () => {
    vi.stubGlobal('PerformanceObserver', undefined)
    const frames: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      frames.push(cb)
      return frames.length
    })
    document.documentElement.setAttribute(PRERENDER_ATTR, '')
    loadBootScripts(ENTRY, PRELOADS, PRERENDER_ATTR, 2000)
    expect(bootTags().scripts).toEqual([])
    frames.forEach((cb) => cb(0))
    vi.advanceTimersByTime(0)
    expect(bootTags().scripts).toEqual([ENTRY])
    vi.unstubAllGlobals()
  })

  it('tab nền (không vẽ gì) → hẹn giờ dự phòng vẫn nạp', () => {
    stubPaintObserver()
    document.documentElement.setAttribute(PRERENDER_ATTR, '')
    loadBootScripts(ENTRY, PRELOADS, PRERENDER_ATTR, 2000)
    vi.advanceTimersByTime(1999)
    expect(bootTags().scripts).toEqual([])
    vi.advanceTimersByTime(1)
    expect(bootTags().scripts).toEqual([ENTRY])
    vi.unstubAllGlobals()
  })
})

describe('releaseGuestPrerender', () => {
  it('gỡ khối dựng sẵn + cờ trên <html>; gọi lại là no-op', () => {
    document.documentElement.setAttribute(PRERENDER_ATTR, '')
    const box = document.createElement('div')
    box.id = PRERENDER_CONTAINER_ID
    document.body.appendChild(box)

    releaseGuestPrerender()
    expect(document.getElementById(PRERENDER_CONTAINER_ID)).toBeNull()
    expect(document.documentElement.hasAttribute(PRERENDER_ATTR)).toBe(false)
    expect(() => releaseGuestPrerender()).not.toThrow()
  })

  it('CSS ẩn #root khi cờ bật và ẩn bản dựng sẵn khi cờ tắt', () => {
    expect(PRERENDER_STYLE).toContain(`html[${PRERENDER_ATTR}] #root{display:none}`)
    expect(PRERENDER_STYLE).toContain(
      `html:not([${PRERENDER_ATTR}]) #${PRERENDER_CONTAINER_ID}{display:none}`,
    )
  })
})
