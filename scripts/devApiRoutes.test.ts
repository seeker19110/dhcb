// @vitest-environment node
// Canh parity bảng route API của server dev Vite (`apps/dhcb/vite.config.ts#API_ROUTES`) với Express
// (`apps/server/src/routes.ts`): route dev trỏ sai/không có ở Express là lệch hành vi giữa dev và
// production; route client cần mà dev thiếu thì dev trả HTML SPA thay JSON (audit 2026-10-26,
// AUD-XFEAT-003 — `/api/subjects`).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const viteConfig = readFileSync('apps/dhcb/vite.config.ts', 'utf8')
const expressRoutes = readFileSync('apps/server/src/routes.ts', 'utf8')
const routeTable = viteConfig.slice(viteConfig.indexOf('const API_ROUTES'))
const devPrefixes = [...routeTable.matchAll(/prefix: '([^']+)'/g)].map((m) => m[1])

describe('Bảng route API dev khớp Express', () => {
  it('đọc được bảng route dev', () => {
    expect(devPrefixes.length).toBeGreaterThan(10)
  })

  it('mọi route dev đều có ở Express', () => {
    const missing = devPrefixes.filter(
      (prefix) => !new RegExp(`app\\.\\w+\\(\\s*'${prefix}['/]`).test(expressRoutes),
    )
    expect(missing).toEqual([])
  })

  it('dev có route danh mục môn học mà Góc học tập gọi', () => {
    expect(devPrefixes).toContain('/api/subjects')
  })
})
