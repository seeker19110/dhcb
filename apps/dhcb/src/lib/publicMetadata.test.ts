// Cổng canh siêu dữ liệu công khai + theme mặc định ở HTML tĩnh (audit 2026-09-30 M12 + M13).
//
// Mấy file này KHÔNG đi qua React nên không cổng E2E nào nhìn thấy lỗi của chúng: câu chữ cũ
// ("năm trụ", "gói Pro") nằm im trong kết quả tìm kiếm Google; theme-color lệch thì thanh trình
// duyệt + màn khởi động PWA màu tối dù mặc định là Blue sky. Đọc thẳng file là đủ và rẻ.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DEFAULT_THEME,
  DARK_PREFERRED_THEME,
  THEMES,
  KID_THEME,
  THEME_COLORS,
  THEME_STORAGE_KEY,
} from '@core/theme'

const ROOT = join(__dirname, '..', '..', '..', '..')
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8')

const APP_HTML = read('apps/dhcb/index.html')
const HUB_HTML = read('apps/hub/index.html')
const MANIFEST = JSON.parse(read('apps/dhcb/public/manifest.webmanifest')) as {
  description: string
  background_color: string
  theme_color: string
}
const DEFAULT_COLOR = THEME_COLORS[DEFAULT_THEME]

// Câu chữ của các trụ/gói đã xoá (ba trụ Career · Startup · Life gỡ 2026-09-20; gói Plus/Pro xoá
// 2026-09-12 — CLAUDE.md mục 1 và 6).
const STALE = [/năm trụ/i, /gói Pro\b/i, /gói Plus\b/i, /Sự nghiệp/i, /Khởi nghiệp/i, /Đời sống/i]

describe.each([
  ['apps/dhcb/index.html', APP_HTML],
  ['apps/hub/index.html', HUB_HTML],
  ['manifest.webmanifest', JSON.stringify(MANIFEST)],
])('%s — câu chữ đúng hiện trạng', (_name, text) => {
  it.each(STALE.map((re) => [re.source, re] as const))('không còn "%s"', (_src, re) => {
    expect(text).not.toMatch(re)
  })
})

describe('apps/dhcb/index.html', () => {
  it('nhắc đúng hai trụ Học tập + Ghi chú', () => {
    expect(APP_HTML).toMatch(/Học tập/)
    expect(APP_HTML).toMatch(/Ghi chú/)
  })

  it('JSON-LD là JSON hợp lệ', () => {
    const blocks = [
      ...APP_HTML.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
    ]
    expect(blocks.length).toBeGreaterThan(0)
    for (const [, body] of blocks) expect(() => JSON.parse(body)).not.toThrow()
  })

  it('FAQ phân biệt AI miễn phí có hạn mức với VIP không giới hạn khi còn hiệu lực', () => {
    expect(APP_HTML).toMatch(/hạn mức hiển thị/)
    expect(APP_HTML).toMatch(/VIP.*không giới hạn lượt AI.*hiệu lực/)
  })

  it('không preconnect tới nhà cung cấp AI / api.sentry.io (client không bao giờ gọi)', () => {
    const preconnects = [...APP_HTML.matchAll(/<link[^>]*rel="(?:preconnect|dns-prefetch)"[^>]*>/g)]
    const hrefs = preconnects.map(([tag]) => tag)
    for (const host of ['api.groq.com', 'api.openai.com', 'api.anthropic.com', 'api.sentry.io']) {
      expect(hrefs.join('\n')).not.toContain(host)
    }
  })
})

describe('theme mặc định khớp giữa HTML tĩnh, manifest và packages/core-ui/theme.ts', () => {
  it.each([
    ['apps/dhcb/index.html', APP_HTML],
    ['apps/hub/index.html', HUB_HTML],
  ])('%s: data-theme + meta theme-color = theme mặc định', (_name, html) => {
    expect(html).toContain(`data-theme="${DEFAULT_THEME}"`)
    expect(html).toContain(`<meta name="theme-color" content="${DEFAULT_COLOR}" />`)
  })

  it('manifest: màu nền màn khởi động + thanh trạng thái = màu theme mặc định', () => {
    expect(MANIFEST.background_color).toBe(DEFAULT_COLOR)
    expect(MANIFEST.theme_color).toBe(DEFAULT_COLOR)
  })

  it('script chống nhá màu ở <head> cùng khoá lưu + cùng danh sách theme với getTheme()', () => {
    const head = APP_HTML.slice(0, APP_HTML.indexOf('</head>'))
    const script = /<script>([\s\S]*?)<\/script>/.exec(head)?.[1] ?? ''
    expect(script).toContain(`localStorage.getItem('${THEME_STORAGE_KEY}')`)
    for (const t of [...THEMES.map((x) => x.value), KID_THEME.value]) {
      expect(script).toContain(`'${t}'`)
    }
    expect(script).toContain('prefers-color-scheme: dark')
    expect(script).toContain(`? '${DARK_PREFERRED_THEME}' : '${DEFAULT_THEME}'`)
  })
})

// M13: `bg-white`/`text-zinc-*`/`border-zinc-*` đều là token TỰ ĐẢO theo theme (CLAUDE.md §4.5) —
// thêm `theme-light:` lên chúng là đảo LẦN HAI, ra nền tối + chữ mờ ở Blue sky. Ba trang dưới đã
// dính đúng lỗi đó; canh để không sinh lại.
describe.each([
  'apps/dhcb/src/pages/core/Landing.tsx',
  'apps/dhcb/src/pages/core/LandingEn.tsx',
  'apps/dhcb/src/pages/subjects/english/WordDetail.tsx',
])('%s — không đảo màu hai lần', (file) => {
  it('không có theme-light: trên token trung tính tự đảo (white/zinc)', () => {
    expect(read(file)).not.toMatch(/theme-light:(bg|text|border)-(white|zinc-\d+)/)
  })
})
