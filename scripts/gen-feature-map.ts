// scripts/gen-feature-map.ts — Sinh `docs/FEATURE-MAP.md`: bản đồ TÍNH NĂNG của nền tảng
// (route giao diện ↔ endpoint API ↔ gói/bảng liên quan).
//
// Vì sao SINH TỰ ĐỘNG chứ không viết tay: audit toàn diện 2026-09-05 (F11) cần một nguồn để đối
// chiếu chéo tính năng, nhưng một bản đồ chép tay sẽ lệch khỏi code đúng như `AUDIT.md` đã lệch
// (F6). Bản đồ này đọc thẳng `apps/dhcb/src/App.tsx` + `apps/server/src/routes.ts`, nên chạy lại
// là đúng lại. Chạy: `npm run gen:feature-map`.

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const REPO_ROOT = path.resolve(import.meta.dirname, '..')

/** Giá trị đã biết của các hằng/hàm/mảng mà `App.tsx` dùng để ghép `path` (nạp từ mã thật). */
export interface RouteConstants {
  /** Hằng chuỗi hoặc hàm không tham số: `PROGRAMMING_PREFIX`, `duongDanMonTiengAnh()`. */
  scalars: Record<string, string>
  /** Mảng đường dẫn được `.map()` ra từng `<Route>`: `LEGACY_NOTES_PATHS`… */
  lists: Record<string, readonly string[]>
}

const NO_CONSTANTS: RouteConstants = { scalars: {}, lists: {} }

/** Thay `${NAME}` / `${NAME()}` trong khuôn template bằng giá trị đã biết; không biết → null. */
function fillTemplate(tpl: string, vars: Record<string, string>): string | null {
  let unknown = false
  const out = tpl.replace(/\$\{\s*(\w+)(\(\))?\s*\}/g, (_m, name: string) => {
    const v = vars[name]
    if (v === undefined) unknown = true
    return v ?? ''
  })
  return unknown ? null : out
}

/** Rút giá trị từ MỘT thuộc tính path: `"x"` · `{`tpl`}` · `{NAME}` · `{NAME()}`. */
function resolvePathAttr(expr: string, vars: Record<string, string>): string | null {
  const lit = /^"([^"]+)"$/.exec(expr)
  if (lit) return lit[1] as string
  const tpl = /^\{`([^`]+)`\}$/.exec(expr)
  if (tpl) return fillTemplate(tpl[1] as string, vars)
  const ref = /^\{\s*(\w+)(\(\))?\s*\}$/.exec(expr)
  if (ref) return vars[ref[1] as string] ?? null
  return null
}

const PATH_ATTR = /\bpath=("[^"]+"|\{`[^`]+`\}|\{\s*\w+(?:\(\))?\s*\})/g

/**
 * Mọi route khai trong cây `<Routes>` của app chính. Hiểu ba dạng khai: `path="/x"`,
 * `path={`${PREFIX}/x`}` / `path={PREFIX}` (hằng đã biết) và vòng
 * `{DANH_SACH.map((p) => <Route path={p} …/>)}` (mảng đã biết). Dạng động không giải được → bỏ qua.
 */
export function extractRoutes(appSource: string, consts: RouteConstants = NO_CONSTANTS): string[] {
  const found: string[] = []
  // Vòng .map(): cắt thân tới `))}` kế tiếp, thay biến vòng bằng từng phần tử của mảng.
  const mapBlocks = [...appSource.matchAll(/\{(\w+)\.map\(\((\w+)\) =>[\s\S]*?\)\)\}/g)]
  for (const m of mapBlocks) {
    const list = consts.lists[m[1] as string]
    if (!list) continue
    for (const item of list) {
      const vars = { ...consts.scalars, [m[2] as string]: item }
      for (const a of m[0].matchAll(PATH_ATTR)) {
        const r = resolvePathAttr(a[1] as string, vars)
        if (r) found.push(r)
      }
    }
  }
  // Phần còn lại (ngoài các vòng .map()).
  const rest = mapBlocks.reduce((src, m) => src.replace(m[0], ''), appSource)
  for (const a of rest.matchAll(PATH_ATTR)) {
    const r = resolvePathAttr(a[1] as string, consts.scalars)
    if (r) found.push(r)
  }
  return [...new Set(found)].sort()
}

/** Mọi đường dẫn '/api/...' gắn trong bảng route của server. */
export function extractApiPaths(routesSource: string): string[] {
  const found = [...routesSource.matchAll(/'(\/api\/[^']*)'/g)].map((m) => m[1] as string)
  return [...new Set(found)].sort()
}

/** Gom route theo trụ (đoạn đầu của đường dẫn) để bảng đọc được. */
export function groupByPillar(paths: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>()
  for (const p of paths) {
    const head = p.replace(/^\//, '').split('/')[0] || '(gốc)'
    const list = groups.get(head) ?? []
    list.push(p)
    groups.set(head, list)
  }
  return new Map([...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])))
}

function render(routes: string[], apis: string[]): string {
  const lines: string[] = []
  lines.push('<!-- FILE NÀY ĐƯỢC SINH TỰ ĐỘNG — đừng sửa tay. Chạy: npm run gen:feature-map -->')
  lines.push('')
  lines.push('# FEATURE-MAP — bản đồ tính năng nền tảng DHCB')
  lines.push('')
  lines.push(
    'Nguồn: `apps/dhcb/src/App.tsx` (route giao diện) + `apps/server/src/routes.ts` (endpoint API).',
  )
  lines.push(
    'Dùng để **đối chiếu chéo tính năng** trong audit toàn diện (Nhóm 12): một tính năng có màn hình',
  )
  lines.push(
    'mà không có API, hoặc có API mà không màn hình nào gọi, là dấu hiệu việc làm dở dang.',
  )
  lines.push('')
  lines.push(`Tổng: **${routes.length} route giao diện** · **${apis.length} endpoint API**.`)
  lines.push('')
  lines.push('## Route giao diện theo trụ')
  lines.push('')
  for (const [pillar, list] of groupByPillar(routes)) {
    lines.push(`### \`/${pillar}\` — ${list.length} route`)
    lines.push('')
    for (const r of list) lines.push(`- \`${r}\``)
    lines.push('')
  }
  lines.push('## Endpoint API theo trụ')
  lines.push('')
  for (const [pillar, list] of groupByPillar(apis.map((a) => a.replace(/^\/api/, '')))) {
    lines.push(`### \`/api/${pillar}\` — ${list.length} endpoint`)
    lines.push('')
    for (const a of list) lines.push(`- \`/api${a}\``)
    lines.push('')
  }
  return lines.join('\n')
}

/** Nạp giá trị thật của các hằng route từ mã nguồn app (không chép tay → không lệch). */
async function loadRouteConstants(): Promise<RouteConstants> {
  const hosts = await import('../apps/dhcb/src/lib/subjectsHost')
  const nav = await import('../apps/dhcb/src/lib/navPaths')
  const { SUBJECTS_ON_APP_HOST } = await import('@dhcb/core-learner/subjectHome')
  const { ENGLISH_PREFIX } = await import('../apps/dhcb/src/lib/englishRoutes')
  return {
    scalars: {
      // programmingRoutes.ts kéo theo alias `@core/…` mà tsconfig.api.json không có → lấy qua bảng môn.
      PROGRAMMING_PREFIX: SUBJECTS_ON_APP_HOST.programming as string,
      ENGLISH_PREFIX,
      SUBJECTS_PREFIX: hosts.SUBJECTS_PREFIX,
      duongDanMonTiengAnh: hosts.duongDanMonTiengAnh(),
    },
    lists: {
      LEGACY_NOTES_PATHS: nav.LEGACY_NOTES_PATHS,
      REMOVED_DOMAIN_PATHS: nav.REMOVED_DOMAIN_PATHS,
      LEGACY_ENGLISH_PREFIXES: hosts.LEGACY_ENGLISH_PREFIXES,
      LEGACY_SUBJECTS_PREFIXES: hosts.LEGACY_SUBJECTS_PREFIXES,
    },
  }
}

/** Nội dung `docs/FEATURE-MAP.md` đúng theo mã nguồn hiện tại (test canh file khớp hàm này). */
export async function buildFeatureMap(): Promise<string> {
  const app = readFileSync(path.join(REPO_ROOT, 'apps/dhcb/src/App.tsx'), 'utf8')
  const routes = readFileSync(path.join(REPO_ROOT, 'apps/server/src/routes.ts'), 'utf8')
  return render(extractRoutes(app, await loadRouteConstants()), extractApiPaths(routes))
}

async function main(): Promise<void> {
  const out = path.join(REPO_ROOT, 'docs/FEATURE-MAP.md')
  writeFileSync(out, await buildFeatureMap(), 'utf8')
  console.log(`Đã ghi ${out}`)
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) void main()
