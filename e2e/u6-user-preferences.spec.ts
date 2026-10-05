// E2E đợt U6 — TUỲ CHỌN NGƯỜI DÙNG (audit UI/UX 2026-09-30 mục 5, M1–M6).
//
// Mỗi khối dưới đây đo bằng trình duyệt thật đúng điều audit chỉ ra, và đã được chạy ĐỐI CHỨNG
// ÂM trên mã trước U6 (đỏ) — xem docs/changelog/0491-2026-10-05-u6-tuy-chon-nguoi-dung.md.
//   M1  thanh cố định chiếm bao nhiêu % khung nhìn khi khung nhìn thấp (phóng to / xoay ngang)
//   M2  dải "Reachability" (mũi tên nảy vô hạn + vùng `touch-action: none`) đã gỡ hẳn
//   M3  avatar Bạn Đồng Hành đứng yên khi "giảm chuyển động"
//   M4  chế độ màu cưỡng bức: icon theo màu hệ thống, nút có viền, Orb thanh đáy có hình
//   M5  chữ thân bài đọc theo cỡ chữ người dùng (rem, không khoá px)
//   M6  ô lịch hoạt động ở Tiến độ có vùng chạm ≥ 24×24px (WCAG 2.5.8)
import { test, expect, type Page } from '@playwright/test'
import { mockLogin, USER_ID } from './helpers/auth'
import { waitForStableDom } from './helpers/axe'

/**
 * Tỉ lệ chiều cao khung nhìn bị các thanh `fixed`/`sticky` (rộng ≥ nửa màn) che SAU KHI CUỘN.
 * Bỏ qua: phần tử lồng trong một thanh khác (đếm một lần), khung rỗng (vùng chứa toast chưa có
 * toast), và thông báo tạm thời `role=status` (dải "đang đồng bộ" tự biến mất).
 */
async function stickyCoverage(page: Page) {
  return page.evaluate(() => {
    const vh = window.innerHeight
    const isPinned = (el: Element) => {
      const p = getComputedStyle(el).position
      return p === 'fixed' || p === 'sticky'
    }
    let covered = 0
    const parts: string[] = []
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      if (!isPinned(el)) continue
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      if (el.closest('[role="status"]')) continue
      if (el.childElementCount === 0 && !el.textContent?.trim()) continue
      let parent = el.parentElement
      let nested = false
      while (parent) {
        if (isPinned(parent)) {
          nested = true
          break
        }
        parent = parent.parentElement
      }
      if (nested) continue
      const r = el.getBoundingClientRect()
      if (r.width < window.innerWidth / 2) continue
      const visible = Math.min(vh, r.bottom) - Math.max(0, r.top)
      if (visible <= 0) continue
      covered += visible
      parts.push(`${el.tagName.toLowerCase()}:${Math.round(visible)}px`)
    }
    return { ratio: covered / vh, parts }
  })
}

test.describe('M1 — khung nhìn thấp: thanh cố định không ăn mất nội dung (WCAG 1.4.10)', () => {
  // Ngưỡng 25%: audit đo 39–60% trước khi sửa; thanh đáy gọn 56px ở 390px cao = 14%.
  const MAX_RATIO = 0.25
  for (const [width, height] of [
    [800, 400],
    [844, 390],
  ] as const) {
    for (const route of ['/', '/tien-do', '/goc-hoc-tap/english/lo-trinh/a1']) {
      test(`${width}×${height} ${route}: thanh cố định ≤ 25% khung nhìn sau khi cuộn`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height })
        await mockLogin(page)
        await page.goto(route)
        await expect(page.locator('nav.bottom-nav')).toBeVisible()
        await waitForStableDom(page)
        await page.mouse.wheel(0, 600)
        await page.waitForTimeout(300)
        const { ratio, parts } = await stickyCoverage(page)
        expect(ratio, `các thanh: ${parts.join(', ')}`).toBeLessThanOrEqual(MAX_RATIO)
        // Thanh đáy vẫn đủ vùng chạm 44px cho mỗi tab ở dạng gọn.
        const tabs = page.locator('nav.bottom-nav a')
        const count = await tabs.count()
        expect(count).toBe(5)
        for (let i = 0; i < count; i++) {
          const box = await tabs.nth(i).boundingBox()
          expect(box!.height).toBeGreaterThanOrEqual(44)
        }
      })
    }
  }

  test('390×844 (dọc): KHÔNG đổi — header vẫn dính, thanh đáy giữ cỡ đầy đủ', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await mockLogin(page)
    await page.goto('/')
    await expect(page.locator('nav.bottom-nav')).toBeVisible()
    const header = page.locator('header.app-header')
    await expect(header).toHaveCSS('position', 'sticky')
    const nav = await page.locator('nav.bottom-nav').boundingBox()
    // 5.25rem (84px) + đệm safe-area tối thiểu 12px.
    expect(nav!.height).toBeGreaterThanOrEqual(96)
  })
})

test.describe('M2 — dải Reachability đã gỡ hẳn', () => {
  test('390×844: thanh đáy không còn mũi tên nảy, không còn vùng chặn cuộn', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await mockLogin(page)
    await page.goto('/')
    const nav = page.locator('nav.bottom-nav')
    await expect(nav).toBeVisible()
    const found = await page.evaluate(() => {
      const navEl = document.querySelector('nav.bottom-nav')
      const all = Array.from(document.querySelectorAll<HTMLElement>('body *'))
      return {
        bounce: navEl ? navEl.querySelectorAll('.animate-bounce').length : -1,
        // Bất kỳ phần tử nào chặn cử chỉ cuộn (`touch-action: none`) trên toàn trang.
        touchNone: all.filter((el) => getComputedStyle(el).touchAction === 'none').length,
        // Không còn gì của thanh đáy nhô lên TRÊN mép trên của nó.
        aboveNav: navEl
          ? Array.from(navEl.querySelectorAll<HTMLElement>('*')).filter(
              (el) =>
                el.getBoundingClientRect().height > 0 &&
                el.getBoundingClientRect().bottom <= navEl.getBoundingClientRect().top,
            ).length
          : -1,
      }
    })
    expect(found).toEqual({ bounce: 0, touchNone: 0, aboveNav: 0 })
  })
})

test.describe('M3 — avatar Bạn Đồng Hành tôn trọng "giảm chuyển động" (WCAG 2.3.3)', () => {
  async function canvasFrames(page: Page): Promise<[string, string]> {
    await page.setViewportSize({ width: 1440, height: 900 })
    await mockLogin(page)
    await page.goto('/ban-dong-hanh')
    const canvas = page.locator('canvas').first()
    // Trang Bạn Đồng Hành nạp lười, lần đầu có thể chậm trên dev server.
    await expect(canvas).toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(500)
    const first = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())
    await page.waitForTimeout(1200)
    const second = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())
    return [first, second]
  }

  test('mặc định: avatar có chuyển động (canvas đổi giữa hai lần chụp)', async ({ page }) => {
    const [a, b] = await canvasFrames(page)
    expect(a).not.toBe(b)
  })

  test('reduce: avatar là khung TĨNH (canvas giữ nguyên sau 1,2 giây)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const [a, b] = await canvasFrames(page)
    expect(a.length).toBeGreaterThan(1000) // có vẽ thật, không phải canvas trống
    expect(a).toBe(b)
  })
})

test.describe('M4 — chế độ màu cưỡng bức (Windows tương phản cao)', () => {
  for (const route of ['/', '/goc-hoc-tap/english']) {
    test(`390px ${route}: icon theo màu hệ thống, nút và Orb có viền`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.emulateMedia({ forcedColors: 'active' })
      await mockLogin(page)
      await page.goto(route)
      await expect(page.locator('nav.bottom-nav')).toBeVisible()
      await waitForStableDom(page)
      const report = await page.evaluate(() => {
        const visible = (el: Element) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
        }
        // Icon lucide phải mang ĐÚNG màu của phần tử chứa nó (màu hệ thống đã ép), trừ vùng
        // tự khai giữ màu tác giả (`forced-color-adjust: none`).
        const iconOffenders = Array.from(document.querySelectorAll('svg.lucide'))
          .filter(visible)
          .filter((svg) => getComputedStyle(svg).forcedColorAdjust !== 'none')
          .filter((svg) => {
            const parent = svg.parentElement
            return parent && getComputedStyle(svg).color !== getComputedStyle(parent).color
          })
          .map((svg) => svg.getAttribute('class') ?? '')
        const hasEdge = (el: Element) => {
          const cs = getComputedStyle(el)
          const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 1
          const border = cs.borderTopStyle !== 'none' && parseFloat(cs.borderTopWidth) >= 1
          return outline || border
        }
        const buttonOffenders = Array.from(document.querySelectorAll('button'))
          .filter(visible)
          .filter((b) => !hasEdge(b))
          .map((b) => b.getAttribute('aria-label') || b.textContent?.trim().slice(0, 30) || '?')
        const orb = document.querySelector('nav.bottom-nav .bottom-nav-orb')
        return {
          iconCount: document.querySelectorAll('svg.lucide').length,
          iconOffenders,
          buttonOffenders,
          orbHasEdge: orb ? hasEdge(orb) : false,
        }
      })
      expect(report.iconCount).toBeGreaterThan(5)
      expect(report.iconOffenders).toEqual([])
      expect(report.buttonOffenders).toEqual([])
      expect(report.orbHasEdge).toBe(true)
    })
  }
})

test.describe('M5 — chữ thân bài đọc theo cỡ chữ người dùng', () => {
  test('cỡ chữ gốc 24px: `.read-body` lớn theo (22,5px), không khoá 15px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await mockLogin(page)
    await page.goto('/')
    await expect(page.locator('nav.bottom-nav')).toBeVisible()
    // Mô phỏng người dùng đặt cỡ chữ mặc định của trình duyệt = 24px (thay vì 16px).
    await page.addStyleTag({ content: 'html { font-size: 24px !important; }' })
    const size = await page.evaluate(() => {
      const probe = document.createElement('p')
      probe.className = 'read-body'
      probe.textContent = 'Đoạn thử cỡ chữ'
      document.body.appendChild(probe)
      const px = parseFloat(getComputedStyle(probe).fontSize)
      probe.remove()
      return px
    })
    expect(size).toBeCloseTo(22.5, 1)
  })
})

test.describe('M6 — lịch hoạt động ở Tiến độ: vùng chạm ≥ 24px (WCAG 2.5.8)', () => {
  for (const width of [1024, 1440]) {
    test(`${width}px: mọi ô ngày ≥ 24×24px, tuần gần nhất hiện sẵn`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await mockLogin(page)
      await page.addInitScript((uid) => {
        const today = new Date()
        for (let i = 0; i < 190; i += 3) {
          const d = new Date(today.getTime() - i * 86400000)
          const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          localStorage.setItem(
            `et_usage_${uid}_${k}`,
            JSON.stringify({ chatCount: 2, writingCount: 1, speakingCount: 0, sttCount: 0 }),
          )
        }
      }, USER_ID)
      await page.goto('/tien-do')
      const grid = page.getByRole('grid', { name: /Lịch hoạt động theo ngày/ })
      await expect(grid).toBeVisible()
      const sizes = await grid.locator('[role="gridcell"]').evaluateAll((cells) =>
        cells.map((c) => {
          const r = c.getBoundingClientRect()
          return Math.min(r.width, r.height)
        }),
      )
      expect(sizes.length).toBeGreaterThan(60)
      expect(Math.min(...sizes)).toBeGreaterThanOrEqual(24)
      // Ô hôm nay (ô được chọn sẵn) nằm trong phần nhìn thấy của khung cuộn ngang.
      const today = grid.locator('[role="gridcell"][tabindex="0"]')
      const scroller = grid.locator('xpath=ancestor::div[contains(@class,"overflow-x-auto")][1]')
      const t = await today.boundingBox()
      const s = await scroller.boundingBox()
      expect(t!.x + t!.width).toBeLessThanOrEqual(s!.x + s!.width + 1)
      expect(t!.x).toBeGreaterThanOrEqual(s!.x - 1)
    })
  }
})
