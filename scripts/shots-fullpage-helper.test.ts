// scripts/shots-fullpage-helper.test.ts — Chốt chặn: công cụ chụp ảnh Tầng 8b KHÔNG được quay lại
// `page.screenshot({ fullPage: true })`.
//
// VÌ SAO CẦN (2026-09-24, `docs/changelog/0433-*.md`): `fullPage: true` cho trang thấy khung nhìn
// 1×1 px thoáng qua trong lúc chụp. Ở 1440px, `useIsDesktopViewport()` lật false → true, `TwoPane`
// đổi nhánh và React dựng lại cả cột chính giữa lúc chụp → ảnh Hồ sơ "mờ toàn trang" mà đo
// `opacity` vẫn = 1 (đợt audit 2026-09-22 không lần ra). Chữa bằng `screenshotFullPage()` ở
// `e2e/helpers/fullPageShot.ts`. Lỗi này KHÔNG làm đỏ cổng nào — ảnh sai vẫn là một ảnh hợp lệ —
// nên phải canh bằng test đọc mã, giống `shots-freeze-animations.test.ts`.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function read(relPath: string): string {
  return readFileSync(join(process.cwd(), relPath), 'utf-8')
}

/** Bỏ comment để chỉ xét MÃ chạy thật — comment giải thích được phép nhắc `fullPage: true`. */
function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

describe('chụp toàn trang Tầng 8b đi qua screenshotFullPage', () => {
  it('helper không tự dùng fullPage và có chốt canh truy vấn desktop', () => {
    const src = read('e2e/helpers/fullPageShot.ts')
    expect(codeOnly(src)).not.toMatch(/fullPage\s*:\s*true/)
    expect(src).toContain("'(min-width: 1024px)'")
    expect(src).toContain('throw new Error')
  })

  it('shots-learning-ux chụp qua helper, không fullPage', () => {
    const src = codeOnly(read('scripts/shots-learning-ux.ts'))
    expect(src).toContain('screenshotFullPage(page)')
    expect(src).not.toMatch(/fullPage\s*:\s*true/)
  })

  it('công thức Tầng 8b trong QUY-TRINH-AUDIT dùng helper', () => {
    const doc = read('docs/framework/QUY-TRINH-AUDIT.md')
    const section = doc.slice(doc.indexOf('**Công thức chụp'), doc.indexOf('### Tầng 9'))
    // Chỉ xét khối mã ```ts của công thức (phần chữ bên dưới được phép nhắc tên bẫy).
    const recipe = codeOnly(
      section.slice(
        section.indexOf('```ts'),
        section.indexOf('```\n', section.indexOf('```ts') + 5),
      ),
    )
    expect(recipe).toContain(
      "import { screenshotFullPage, waitForShotReady } from './helpers/fullPageShot'",
    )
    expect(recipe).toContain('await waitForShotReady(page)')
    expect(recipe).not.toMatch(/waitForTimeout\(/)
    expect(recipe).toContain('await screenshotFullPage(page')
    expect(recipe).not.toMatch(/fullPage\s*:\s*true/)
  })

  it('ngưỡng desktop của helper khớp useIsDesktopViewport', () => {
    const hook = read('apps/dhcb/src/lib/useIsDesktopViewport.ts')
    expect(hook).toContain("export const DESKTOP_VIEWPORT_QUERY = '(min-width: 1024px)'")
  })
})
