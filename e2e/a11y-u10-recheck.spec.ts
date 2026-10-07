// e2e/a11y-u10-recheck.spec.ts — Cổng cho các lỗi còn sót sau đợt U1–U9 của audit UI/UX
// 2026-09-30 (`docs/audit/2026-09-30-audit-ui-ux-chuan-2026.md`), đo lại trên `main` ngày
// 2026-10-07 (changelog 0511). Mỗi ca dưới đây ĐỎ trên mã trước khi sửa:
//
// - `/reset-password`: nút hiện/ẩn mật khẩu 20×20px → axe `target-size` (WCAG 2.5.8 AA). Trang
//   chưa từng nằm trong cổng axe (`a11y.spec.ts` ghi "U2 phủ" nhưng U2 chỉ thêm nhãn/autocomplete).
// - Skip link trỏ `#noi-dung-chinh` không tồn tại (WCAG 2.4.1) ở Luyện viết bản mobile, luồng
//   "Đời sống" `/bat-dau/doi-song`, trang Kết bạn — các trang tự dựng `<main>` không có `id`.
// - Trang không có `<h1>` nào (`/bat-dau` lớp hỏi, bài hội thoại desktop chưa chọn bài) và nhảy
//   cấp h2 → h4 ở chi tiết hướng Lập trình (WCAG 1.3.1).
// - `/action-canvas` tràn ngang 76px ở 320px (WCAG 1.4.10 Reflow).
// - Bài hội thoại dùng chung tiêu đề tab "Bài học" với danh sách (WCAG 2.4.2).

import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockLogin, type ThemeName } from './helpers/auth'
import { freezeAnimations } from './helpers/axe'
import { muteTts } from './helpers/tts'

const THEMES: ThemeName[] = ['dark-blue', 'blue-sky', 'kid']

async function scanAa(page: Page): Promise<string[]> {
  await freezeAnimations(page)
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  return violations.map((v) => {
    const first = v.nodes[0]?.target
    const sel = Array.isArray(first) ? first.join(' ') : String(first ?? '?')
    return `${v.id} (${v.impact}, ${v.nodes.length} phần tử, đầu tiên: ${sel})`
  })
}

/** Cấu trúc tiêu đề của trang: số `<h1>` và các lần nhảy cấp (h2 → h4…) theo thứ tự DOM. */
async function headingOutline(page: Page): Promise<{ h1: number; skips: string[] }> {
  return page.evaluate(() => {
    const hs = [...document.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6')]
    const skips: string[] = []
    let prev = 0
    let h1 = 0
    for (const h of hs) {
      const level = Number(h.tagName.slice(1))
      if (level === 1) h1++
      if (prev && level > prev + 1) {
        skips.push(`h${prev} → h${level} "${(h.textContent ?? '').trim().slice(0, 40)}"`)
      }
      prev = level
    }
    return { h1, skips }
  })
}

test.describe('/reset-password — 0 vi phạm A/AA, nút hiện mật khẩu đủ vùng chạm', () => {
  for (const theme of THEMES) {
    test(`theme=${theme}`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('ui_theme', t), theme)
      await page.goto('/reset-password?token=e2e-token')
      const toggle = page.getByRole('button', { name: /Hiện mật khẩu|Show password/ })
      await expect(toggle).toBeVisible()
      const box = await toggle.boundingBox()
      expect(box?.width ?? 0, 'nút hiện mật khẩu phải rộng ≥ 44px').toBeGreaterThanOrEqual(44)
      expect(box?.height ?? 0, 'nút hiện mật khẩu phải cao ≥ 44px').toBeGreaterThanOrEqual(44)
      expect(await scanAa(page)).toEqual([])
    })
  }
})

interface StructureCase {
  name: string
  path: string
  width: number
  /** Mock riêng của trang (ngoài `mockLogin`). */
  mock?: (page: Page) => Promise<void>
  /** Phần tử chứng tỏ trang đã dựng xong đúng màn cần đo (không phải màn tải). */
  ready: (page: Page) => ReturnType<Page['locator']>
}

const STRUCTURE_CASES: StructureCase[] = [
  {
    name: 'Luyện viết (mobile)',
    path: '/goc-hoc-tap/english/luyen-viet',
    width: 390,
    ready: (page) => page.locator('#essay-prompt-select'),
  },
  {
    name: 'Bắt đầu — lớp hỏi',
    path: '/bat-dau',
    width: 390,
    ready: (page) => page.getByRole('group', { name: /Bạn muốn học môn gì/ }),
  },
  {
    name: 'Bắt đầu — Đời sống',
    path: '/bat-dau/doi-song',
    width: 390,
    mock: async (page) => {
      await page.route('**/api/intake', (route) =>
        route.fulfill({ json: { done: false, chosenTaskId: null, result: null } }),
      )
    },
    ready: (page) => page.locator('fieldset').first(),
  },
  {
    name: 'Bài hội thoại desktop — chưa chọn bài',
    path: '/goc-hoc-tap/english/bai-hoc',
    width: 1440,
    ready: (page) => page.getByText('Chọn một bài hội thoại để bắt đầu'),
  },
  {
    name: 'Chi tiết hướng Lập trình',
    path: '/goc-hoc-tap/programming/huong/web--lap-trinh-web',
    width: 390,
    ready: (page) => page.getByRole('heading', { name: 'Sản phẩm tốt nghiệp hướng' }),
  },
]

test.describe('đích skip link + một <h1> + không nhảy cấp tiêu đề', () => {
  for (const c of STRUCTURE_CASES) {
    test(c.name, async ({ page }) => {
      await page.setViewportSize({ width: c.width, height: c.width < 600 ? 844 : 900 })
      await mockLogin(page, 'vi', 'blue-sky')
      await muteTts(page)
      if (c.mock) await c.mock(page)
      await page.goto(c.path)
      await expect(c.ready(page).first()).toBeVisible()
      await expect(
        page.locator('main#noi-dung-chinh'),
        `${c.path}: thiếu <main id="noi-dung-chinh">`,
      ).toHaveCount(1)
      const { h1, skips } = await headingOutline(page)
      expect(h1, `${c.path}: phải có đúng một <h1>`).toBe(1)
      expect(skips, `${c.path}: tiêu đề nhảy cấp`).toEqual([])
    })
  }
})

test('/action-canvas không tràn ngang ở 320px (WCAG 1.4.10)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await mockLogin(page, 'vi', 'blue-sky')
  await page.goto('/action-canvas')
  await expect(page.getByRole('button', { name: /Xuất Markdown/ })).toBeVisible()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow, 'số px tràn ngang').toBeLessThanOrEqual(0)
})

test('bài hội thoại có tiêu đề tab riêng theo tên bài (WCAG 2.4.2)', async ({ page }) => {
  await mockLogin(page, 'vi', 'blue-sky')
  await muteTts(page)
  await page.goto('/goc-hoc-tap/english/bai-hoc')
  await expect.poll(() => page.title()).toBe('Bài học | Môn tiếng Anh · Đồng Hành Cùng Bạn')
  await page.goto('/goc-hoc-tap/english/bai-hoc?lesson=1')
  await expect.poll(() => page.title()).toMatch(/^Bài 1: .+ \| Môn tiếng Anh · Đồng Hành Cùng Bạn$/)
})
