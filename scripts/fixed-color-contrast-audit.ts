// scripts/fixed-color-contrast-audit.ts — Soi các màu Tailwind CỐ ĐỊNH dùng làm màu CHỮ.
//
// VÌ SAO CẦN: thang `zinc`/`accent`/`content` của dự án là biến CSS nên tự đổi theo theme
// (`packages/core-ui/theme.css`). Nhưng giao diện còn dùng RẤT NHIỀU màu Tailwind gốc
// (amber, emerald, rose, purple, cyan…) — những màu này là hex CỐ ĐỊNH, KHÔNG đổi theo theme.
// Hai theme nền sáng (blue-sky, kid) vì thế là chỗ dễ rớt tương phản nhất: một màu chữ
// chọn cho nền tối sẽ nằm trên nền SÁNG mà không ai đổi nó.
//
// Dự án đã có cách vá đúng — biến thể `theme-light:text-<màu>-800` — nhưng chỉ vá tay ở một
// phần nhỏ. Script này tìm những chỗ CHƯA vá và đo xem chúng có thật sự rớt ngưỡng không, để
// việc sửa đi theo BẰNG CHỨNG chứ không theo cảm giác "màu cứng là xấu".
//
// Chạy: npx tsx scripts/fixed-color-contrast-audit.ts
// Cổng CHẶN nằm ở `scripts/fixed-color-contrast-audit.test.ts`.
//
// PHẠM VI QUÉT (2026-09-19): `apps/dhcb/src` + `apps/hub/src` + `packages/core-ui`. `apps/hub`
// (`@dhcb/hub`, landing) từng bị loại vì tưởng là bảng màu riêng không cùng hệ token — SAI: hub
// đã có `ThemeToggle` (`apps/hub/src/App.tsx`, `HubLogin.tsx`) và `apps/hub/tailwind.config.js`
// map `zinc`/`accent` sang ĐÚNG biến `--z-*`/`--a-*` của `packages/core-ui/theme.css` như
// `@dhcb/app` — cùng một hệ token thật, chỉ là app Vite khác. Xem
// `docs/changelog/0356-2026-09-16-quet-mau-cung-mo-rong-cong-tuong-phan.md` (lý do loại trừ cũ,
// nay đã lỗi thời) và changelog đợt này (nợ đóng lại thế nào).
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import colors from 'tailwindcss/colors'
import {
  AA,
  AAA,
  checkPairs,
  contrastRatio,
  parseCssColor,
  parseThemeTokens,
  type ContrastCheck,
  type Rgb,
} from './lib/contrast.js'

/** Các họ màu Tailwind GỐC (hex cố định). Cố ý KHÔNG gồm `zinc` — dự án đã ánh xạ zinc sang
 *  biến CSS trong `tailwind.config.js`, nên `text-zinc-*` là token chứ không phải màu cứng.
 *  `zinc` được soi RIÊNG bên dưới (mục "thang zinc"), bằng giá trị token thật của từng theme. */
export const FIXED_FAMILIES = [
  'slate',
  'gray',
  'neutral',
  'stone',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'cyan',
] as const

/** 11 bậc chuẩn của mọi họ màu Tailwind. Chỉ dùng cho test canh "bảng màu còn đọc được không"
 *  (`lib/contrast.test.ts`) — bản thân audit lấy bậc từ class có thật trong mã nguồn. */
export const PALETTE_STEPS = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  '950',
] as const

/** Hai theme nền sáng — đúng danh sách mà biến thể `theme-light:` áp dụng
 *  (xem `addVariant('theme-light', …)` trong `apps/dhcb/tailwind.config.js`). */
const LIGHT_THEMES = ['blue-sky', 'kid'] as const
const DARK_THEMES = ['dark-blue'] as const

/** Ba bề mặt thật của dự án, theo đúng bảng ở `scripts/contrast-audit.ts`. */
const SURFACES = [
  { name: 'surface-base', token: 'z-950' },
  { name: 'surface-card', token: 'z-900' },
  { name: 'surface-raised', token: 'z-800' },
] as const

export type Finding = {
  file: string
  line: number
  cls: string
  theme: string
  surface: string
  ratio: number
}

/**
 * Đọc màu `<họ>-<bậc>` từ bảng màu Tailwind ĐANG CÀI.
 *
 * Phân biệt HAI trường hợp rất khác nhau — trước 2026-09-22 cả hai đều trả `null` và bị bỏ qua
 * im lặng, đó là lỗ hổng:
 *
 * 1. **Nhãn không tồn tại** (vd `text-amber-1000` do gõ sai, hoặc họ màu Tailwind đã bỏ):
 *    trả `null`, chỗ gọi bỏ qua — ĐÚNG, vì không có màu nào để đo.
 * 2. **Có giá trị nhưng bộ đọc không hiểu định dạng**: NÉM LỖI. Đây là lúc cổng bị mù. Tailwind 3
 *    khai hex, Tailwind 4 khai `oklch(...)`; nếu một ngày bảng màu đổi sang định dạng thứ ba mà
 *    ta lặng lẽ bỏ qua thì audit báo "0 vi phạm" trên hàng nghìn chỗ chưa từng được kiểm. Thà đỏ
 *    ồn ào còn hơn xanh giả (bài học audit 2026-09-05 F1 với jsx-a11y).
 */
function paletteRgb(family: string, step: string): Rgb | null {
  const fam = (colors as unknown as Record<string, Record<string, string>>)[family]
  const raw = fam?.[step]
  if (typeof raw !== 'string') return null
  const rgb = parseCssColor(raw)
  if (!rgb) {
    throw new Error(
      `Cổng tương phản KHÔNG đọc được màu \`${family}-${step}\` = "${raw}" của bảng màu ` +
        `Tailwind đang cài. Bỏ qua nó nghĩa là audit báo xanh mà chưa kiểm gì — nên dừng ở đây. ` +
        `Sửa parseCssColor() ở scripts/lib/contrast.ts để hiểu định dạng này.`,
    )
  }
  return rgb
}

export function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry.startsWith('.')) continue
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (p.endsWith('.tsx')) out.push(p)
  }
  return out
}

// CỐ Ý chỉ khớp class TRẦN (`text-amber-400`), không khớp class có biến thể đứng trước
// (`hover:text-amber-400`, `group-hover:…`, `theme-light:…`). Lý do: cách vá của dự án là
// thêm `theme-light:text-<màu>-800`, mà bản vá đó chỉ đúng cho class trần — vá cho một
// biến thể phải là `theme-light:hover:…`, tức một bài toán khác. Class trần cũng là cái
// quyết định màu Ở TRẠNG THÁI NGHỈ, tức thứ người dùng nhìn thấy gần như toàn bộ thời gian.
const FAMILY_RE = new RegExp(
  `(^|[\\s"'\`{(])text-(${FIXED_FAMILIES.join('|')})-([0-9]{2,3})\\b`,
  'g',
)
// Chữ nằm trên NỀN MÀU ĐẶC (`bg-amber-400 text-slate-950`) thì bề mặt thật là cái nền đó,
// KHÔNG phải nền trang — đo theo nền trang sẽ ra dương tính giả. Nền màu có độ mờ
// (`bg-cyan-500/20`) thì ngược lại: nó chỉ là lớp phủ mỏng, màu nhìn thấy vẫn do nền trang
// quyết định phần lớn, nên vẫn đo.
const OPAQUE_BG_RE = new RegExp(
  `(^|[\\s"'\`{(])bg-(${FIXED_FAMILIES.join('|')})-[0-9]{2,3}(?![0-9/])`,
)
// ── THANG ZINC (token theo theme) ────────────────────────────────────────────────────────
// `text-zinc-*` KHÔNG phải màu cứng — nó là `rgb(var(--z-<bậc>))`, đổi theo theme. Nhưng
// "đổi theo theme" không có nghĩa là "luôn đủ tương phản": ba bậc tối nhất của thang nằm
// SÁT các bề mặt nền ở CẢ 5 theme. Đo thật (2026-09-16): z-600 cao nhất chỉ 3.25:1, z-700
// 1.83:1, z-800 1.27:1 — rớt AA ở mọi theme, mọi bề mặt. Đây chính là khuôn lỗi PR #981:
// màu cứng-theo-nghĩa-khác, hỏng ĐỀU cả 5 theme, mà cổng cũ không soi vì bỏ qua họ `zinc`.
//
// CỐ Ý chỉ soi 600/700/800. Các bậc tối hơn (900/950) là thành ngữ "chữ tối trên chip nhấn
// sáng" (`bg-accent-500 text-zinc-950`) và nền đó thường nằm ở thẻ CHA — một script đọc theo
// DÒNG không phán được, nên soi chúng sẽ chỉ sinh dương tính giả. Các bậc sáng hơn (≤ 500)
// đã đo là đạt AA trên cả 5 theme.
const ZINC_DARK_STEPS = ['600', '700', '800'] as const
const ZINC_RE = new RegExp(
  `(^|[\\s"'\`{(])text-zinc-(${ZINC_DARK_STEPS.join('|')})(?![\\w/-])`,
  'g',
)
// Nền nhấn thương hiệu / dải màu cũng là nền ĐẶC — chữ trên nó không đo theo nền trang.
const ACCENT_BG_RE = /(^|[\s"'`{(])(bg-accent-[0-9]{2,3}(?![0-9/])|bg-gradient-to-)/

const LIGHT_OVERRIDE_RE = new RegExp(
  `theme-light:text-(${FIXED_FAMILIES.join('|')})-([0-9]{2,3})\\b`,
)

/** Soi một dòng mã: trả về các phát hiện rớt ngưỡng AA trên bề mặt nào, theme nào. */
export function auditLine(
  file: string,
  line: number,
  text: string,
  themes: Record<string, Record<string, Rgb>>,
): Finding[] {
  const found: Finding[] = []
  if (OPAQUE_BG_RE.test(text) || ACCENT_BG_RE.test(text)) return found

  // Thang zinc: màu chữ lấy thẳng token `z-<bậc>` của chính theme đang xét.
  ZINC_RE.lastIndex = 0
  let z: RegExpExecArray | null
  while ((z = ZINC_RE.exec(text)) !== null) {
    const step = z[2] as string
    for (const theme of [...DARK_THEMES, ...LIGHT_THEMES]) {
      const tokens = themes[theme]
      const fg = tokens?.[`z-${step}`]
      if (!tokens || !fg) continue
      for (const surface of SURFACES) {
        const bg = tokens[surface.token]
        if (!bg) continue
        const ratio = contrastRatio(fg, bg)
        if (ratio < AA) {
          found.push({ file, line, cls: `text-zinc-${step}`, theme, surface: surface.name, ratio })
        }
      }
    }
  }

  const override = LIGHT_OVERRIDE_RE.exec(text)
  FAMILY_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = FAMILY_RE.exec(text)) !== null) {
    // Bỏ qua chính cái override (`theme-light:text-…`) — nó được xét riêng bên dưới.
    const family = m[2] as string
    const step = m[3] as string
    const cls = `text-${family}-${step}`
    for (const theme of [...DARK_THEMES, ...LIGHT_THEMES]) {
      const tokens = themes[theme]
      if (!tokens) continue
      // Ở theme nền sáng, nếu dòng có sẵn `theme-light:text-…` thì màu THẬT là màu override.
      const isLight = (LIGHT_THEMES as readonly string[]).includes(theme)
      // Theme có thể ghi đè biến bảng màu Tailwind (`--color-<họ>-<bậc>: rgb(...)` trong
      // theme.css, cách của xboss) — khi đó màu THẬT ở theme ấy là giá trị ghi đè.
      const themed = tokens[`color-${family}-${step}`]
      const eff =
        isLight && override
          ? paletteRgb(override[1] as string, override[2] as string)
          : (themed ?? paletteRgb(family, step))
      if (!eff) continue
      for (const surface of SURFACES) {
        const bg = tokens[surface.token]
        if (!bg) continue
        const ratio = contrastRatio(eff, bg)
        if (ratio < AA) {
          found.push({ file, line, cls, theme, surface: surface.name, ratio })
        }
      }
    }
  }
  return found
}

/**
 * Ngoại lệ CÓ LÝ DO — cố ý rất nhỏ và phải giải thích được. Đây KHÔNG phải "baseline" nới
 * cho nợ cũ (luật a11y của dự án cấm baseline): mỗi mục dưới đây là một chỗ mà phép đo của
 * script sai bản chất, không phải một lỗi được tha.
 *
 * `text-*` đặt trên <input type="checkbox"> KHÔNG phải màu chữ — nó là màu dấu tích của ô
 * chọn (Tailwind forms). Script đo nó như chữ nằm trên nền trang nên báo nhầm.
 *
 * Test canh (`fixed-color-contrast-audit.test.ts`) bắt buộc mỗi mục ở đây phải CÒN khớp thật:
 * mục không còn khớp là mục chết, phải xoá — nhờ vậy danh sách không âm thầm phình ra.
 */
// [2026-09-20] Hai mục cũ (`domains/career/Career.tsx`, `domains/startup/Startup.tsx`) đã bị xoá
// cùng chính hai trang đó khi ba trụ Sự nghiệp · Khởi nghiệp · Đời sống được gỡ khỏi sản phẩm.
// Danh sách rỗng là trạng thái ĐÚNG và mong muốn: không có ngoại lệ nào đang được tha.
export const ALLOWLIST: ReadonlyArray<{ file: string; cls: string; reason: string }> = []

const isAllowed = (f: Finding): boolean =>
  ALLOWLIST.some((a) => a.file === f.file && a.cls === f.cls)

export function auditRepo(root: string): Finding[] {
  const css = readFileSync(join(root, 'packages', 'core-ui', 'theme.css'), 'utf-8')
  const themes = parseThemeTokens(css) as unknown as Record<string, Record<string, Rgb>>
  const files = [
    ...walk(join(root, 'apps', 'dhcb', 'src')),
    ...walk(join(root, 'apps', 'hub', 'src')),
    ...walk(join(root, 'packages', 'core-ui')),
  ]
  const out: Finding[] = []
  for (const file of files) {
    // relative() sinh "\\" trên Windows, còn ALLOWLIST/allowlist so khớp viết bằng "/" —
    // chuẩn hoá để đường dẫn nhất quán trên mọi hệ điều hành.
    const rel = relative(root, file).split('\\').join('/')
    readFileSync(file, 'utf-8')
      .split('\n')
      .forEach((text, i) => out.push(...auditLine(rel, i + 1, text, themes)))
  }
  return out.filter((f) => !isAllowed(f))
}

/**
 * Đo tương phản của các CẶP TOKEN ẤM `--w-*` (P0-2, 2026-09-17) — bong bóng Companion dùng
 * `bg-warm-50` + chữ `text-content` (AAA), avatar dùng viền/mắt `warm-500`/`warm-700` trên nền
 * `warm-100` (AA, không phải chữ). In ra để dán vào PR AC-1 — đo TRÊN CẢ 3 THEME, không đoán.
 */
export function auditWarmTokenPairs(root: string): ContrastCheck[] {
  const css = readFileSync(join(root, 'packages', 'core-ui', 'theme.css'), 'utf-8')
  const themes = parseThemeTokens(css)
  // `text-content` (class Tailwind) = biến `--text-primary` = LUÔN bí danh của `--z-100` ở cả 3
  // theme (xem khối "TOKEN NGỮ NGHĨA" trong theme.css: `--text-primary: var(--z-100)`) — dùng
  // thẳng `z-100` vì `parseThemeTokens` chỉ đọc được RGB LITERAL, không theo được `var(...)`.
  return checkPairs(themes, [
    { text: 'z-100', surface: 'w-50' }, // bong bóng: text-content trên bg-warm-50 (AAA)
    { text: 'z-100', surface: 'w-100' }, // đề phòng viền/nền phụ dùng warm-100
    { text: 'w-700', surface: 'w-50' }, // mắt/miệng avatar (warm-700) trên nền bong bóng
    { text: 'w-700', surface: 'w-100' }, // mắt/miệng avatar trên nền tròn avatar (warm-100)
  ])
}

// ── CHỮ GRADIENT (`bg-clip-text`) ───────────────────────────────────────────────────────────
// axe-core không đo được chữ gradient, nên E2E cho qua (changelog 0598, 0599). Mọi bộ màu chữ
// gradient sống ở `packages/core-ui/gradientText.ts`; hai hàm dưới đây (1) đo TẤT CẢ các bộ đó
// ở 3 theme × 3 bề mặt và (2) cấm `.tsx` tự viết `bg-clip-text` — phải dùng hằng của module, để
// không bộ màu nào nằm ngoài phép đo.

/** Ngưỡng của chữ gradient: chỉ dùng cho chữ LỚN → AAA chữ lớn 4,5:1 (CLAUDE.md mục 4.5). */
export const GRADIENT_TEXT_MIN = 4.5

const STOP_RE = /^(theme-light:)?(from|via|to)-([a-z]+)-([0-9]{2,3})$/

export type GradientTextFinding = {
  name: string
  theme: string
  surface: string
  stop: string
  ratio: number
}

/** Màu thật của một điểm dừng ở một theme: `accent` là token theo theme, họ cố định đọc bảng màu. */
function stopRgb(family: string, step: string, tokens: Record<string, Rgb>): Rgb {
  const rgb =
    family === 'accent'
      ? tokens[`a-${step}`]
      : (FIXED_FAMILIES as readonly string[]).includes(family)
        ? (tokens[`color-${family}-${step}`] ?? paletteRgb(family, step))
        : undefined
  // Không đọc được → NÉM LỖI: bỏ qua là cổng báo xanh mà chưa đo (xem paletteRgb).
  if (!rgb) throw new Error(`Chữ gradient: không đọc được màu điểm dừng \`${family}-${step}\``)
  return rgb
}

/** Đo các bộ màu chữ gradient; trả mọi cặp (bộ × theme × bề mặt) dưới ngưỡng. */
export function auditGradientTextColors(
  sets: ReadonlyArray<{ name: string; classes: string }>,
  themes: Record<string, Record<string, Rgb>>,
): GradientTextFinding[] {
  const found: GradientTextFinding[] = []
  for (const set of sets) {
    const base = new Map<string, [string, string]>()
    const light = new Map<string, [string, string]>()
    for (const token of set.classes.split(/\s+/).filter(Boolean)) {
      const m = STOP_RE.exec(token)
      if (!m) throw new Error(`Chữ gradient ${set.name}: class lạ "${token}" (chỉ nhận điểm dừng)`)
      ;(m[1] ? light : base).set(m[2] as string, [m[3] as string, m[4] as string])
    }
    if (!base.has('from') || !base.has('to')) {
      throw new Error(`Chữ gradient ${set.name}: thiếu điểm dừng from-/to- cho theme tối`)
    }
    for (const theme of [...DARK_THEMES, ...LIGHT_THEMES]) {
      const tokens = themes[theme]
      if (!tokens) throw new Error(`Chữ gradient: theme.css không có theme ${theme}`)
      const isLight = (LIGHT_THEMES as readonly string[]).includes(theme)
      for (const pos of ['from', 'via', 'to']) {
        // Theme sáng: `theme-light:` ghi đè TỪNG vị trí; vị trí không ghi đè giữ màu gốc.
        const stop = (isLight ? light.get(pos) : undefined) ?? base.get(pos)
        if (!stop) continue
        const [family, step] = stop
        const fg = stopRgb(family, step, tokens)
        for (const surface of SURFACES) {
          const bg = tokens[surface.token]
          if (!bg) continue
          const ratio = contrastRatio(fg, bg)
          if (ratio < GRADIENT_TEXT_MIN) {
            found.push({
              name: set.name,
              theme,
              surface: surface.name,
              stop: `${pos}-${family}-${step}`,
              ratio,
            })
          }
        }
      }
    }
  }
  return found
}

/** Các dòng `.tsx` tự viết `bg-clip-text` thay vì dùng `GRADIENT_TEXT` của module. */
export function findRawGradientText(root: string): string[] {
  const files = [
    ...walk(join(root, 'apps', 'dhcb', 'src')),
    ...walk(join(root, 'apps', 'hub', 'src')),
    ...walk(join(root, 'packages', 'core-ui')),
  ]
  const out: string[] = []
  for (const file of files) {
    const rel = relative(root, file).split('\\').join('/')
    readFileSync(file, 'utf-8')
      .split('\n')
      .forEach((text, i) => {
        if (/\bbg-clip-text\b/.test(text)) out.push(`${rel}:${i + 1}`)
      })
  }
  return out
}

if (process.argv[1]?.endsWith('fixed-color-contrast-audit.ts')) {
  const findings = auditRepo(process.cwd())
  const byClass = new Map<string, Finding[]>()
  for (const f of findings) byClass.set(f.cls, [...(byClass.get(f.cls) ?? []), f])
  const rows = [...byClass.entries()].sort((a, b) => b[1].length - a[1].length)
  console.log(`Tổng: ${findings.length} cặp (chỗ dùng × bề mặt × theme) rớt AA ${AA}:1\n`)
  for (const [cls, list] of rows) {
    const worst = Math.min(...list.map((f) => f.ratio))
    const themes = [...new Set(list.map((f) => f.theme))].join(', ')
    const places = [...new Set(list.map((f) => `${f.file}:${f.line}`))]
    console.log(
      `${cls.padEnd(22)} thấp nhất ${worst.toFixed(2)}  [${themes}]  ${places.length} chỗ`,
    )
    for (const p of places.slice(0, 3)) console.log(`    ${p}`)
    if (places.length > 3) console.log(`    … và ${places.length - 3} chỗ nữa`)
  }

  console.log('\n── Token ấm --w-* (P0-2) — text × surface × theme ──')
  for (const c of auditWarmTokenPairs(process.cwd())) {
    const threshold = c.text === 'z-100' ? AAA : AA
    const label = c.text === 'z-100' ? 'text-content (z-100)' : c.text
    const status = c.ratio >= threshold ? 'OK' : 'RỚT'
    console.log(
      `${c.theme.padEnd(10)} ${label.padEnd(22)} bg-${c.surface.padEnd(6)} ${c.ratio.toFixed(2)}:1  ngưỡng ${threshold}:1  ${status}`,
    )
  }
}
