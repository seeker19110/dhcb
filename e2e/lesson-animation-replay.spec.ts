import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockLogin } from './helpers/auth'
import { freezeAnimations, waitForStableDom } from './helpers/axe'

const PILOT = '/lap-trinh/bai-hoc/mathai-u3-l3'
const INLINE = 'figure > svg[role="img"]'
const GROUPS = `${INLINE} g[data-animated="true"]`

async function openPilot(page: Page, theme: 'blue-sky' | 'dark-blue' = 'blue-sky') {
  await mockLogin(page, 'vi', theme)
  await page.goto(PILOT, { waitUntil: 'domcontentloaded' })
  await expect(page.locator(INLINE)).toBeVisible({ timeout: 30_000 })
}

async function timeline(page: Page) {
  return page
    .locator(GROUPS)
    .first()
    .evaluate((element) => {
      const animation = element.getAnimations()[0]
      return {
        name: (element as SVGElement).style.animationName,
        time: Number(animation?.currentTime ?? -1),
        state: animation?.playState ?? 'missing',
      }
    })
}

async function finishCurrentRun(page: Page) {
  // Accelerate the real CSS timeline; animationend must still come from the browser.
  await page.locator(GROUPS).evaluateAll((elements) => {
    for (const element of elements) {
      for (const animation of element.getAnimations()) animation.updatePlaybackRate(24)
    }
  })
  await expect(page.getByRole('button', { name: 'Chạy lại hoạt ảnh', exact: true })).toBeVisible()
}

async function compareZoomTimelines(page: Page) {
  return page.evaluate(() => {
    const read = (selector: string) =>
      new Map(
        [...document.querySelectorAll(`${selector} g[data-animated="true"]`)].map((element) => [
          element.getAttribute('data-animation-shape'),
          Number(element.getAnimations()[0]?.currentTime ?? -1),
        ]),
      )
    const inline = read('figure > svg')
    const zoom = read('dialog svg')
    return [...inline].map(([id, time]) => ({ id, inline: time, zoom: zoom.get(id) ?? -1 }))
  })
}

test('lượt hữu hạn kết thúc thật, giữ DOM/focus và phát lại hai lượt', async ({ page }) => {
  await openPilot(page)
  await expect.poll(async () => (await timeline(page)).state).toBe('running')
  await page.locator(INLINE).evaluate((element) => element.setAttribute('data-original-svg', 'yes'))
  const firstName = (await timeline(page)).name
  await finishCurrentRun(page)
  await expect(page.locator('[data-animation-shape="slow-state-n4"]')).toHaveCSS('opacity', '1')

  const replay = page.getByRole('button', { name: 'Chạy lại hoạt ảnh', exact: true })
  await replay.focus()
  await page.keyboard.press('Enter')
  const second = await timeline(page)
  expect(second.name).not.toBe(firstName)
  expect(second.time).toBeGreaterThanOrEqual(0)
  expect(second.time).toBeLessThan(1200)
  expect(second.state).toBe('running')
  await expect(page.locator(INLINE)).toHaveAttribute('data-original-svg', 'yes')
  await expect(page.getByRole('button', { name: 'Tạm dừng hoạt ảnh', exact: true })).toBeFocused()

  // A delayed end event from the old run must not finish the new run.
  await page
    .locator(GROUPS)
    .first()
    .evaluate((element, name) => {
      element.dispatchEvent(
        new AnimationEvent('animationend', { bubbles: true, animationName: name }),
      )
    }, firstName)
  await expect(page.getByRole('button', { name: 'Tạm dừng hoạt ảnh', exact: true })).toBeVisible()
  await finishCurrentRun(page)
  await page.getByRole('button', { name: 'Chạy lại hoạt ảnh', exact: true }).click()
  const third = await timeline(page)
  expect(third.name).not.toBe(second.name)
  expect(third.time).toBeLessThan(1200)
  expect(third.state).toBe('running')
})

test('tạm dừng/tiếp tục và Xem lớn giữ timeline; phát lại từ hộp lớn', async ({ page }) => {
  // Narrow viewport exercises zoom even though the pilot labels are readable at 390px.
  await page.setViewportSize({ width: 260, height: 844 })
  await openPilot(page)
  await expect.poll(async () => (await timeline(page)).time).toBeGreaterThan(300)
  await page.getByRole('button', { name: 'Tạm dừng hoạt ảnh', exact: true }).click()
  await expect.poll(async () => (await timeline(page)).state).toBe('paused')
  const paused = (await timeline(page)).time
  await page.waitForTimeout(100)
  expect(Math.abs((await timeline(page)).time - paused)).toBeLessThan(30)

  const zoomButton = page.getByRole('button', { name: 'Xem lớn', exact: true })
  await zoomButton.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('svg')).toBeVisible()
  const samples = await compareZoomTimelines(page)
  expect(samples.length).toBeGreaterThan(0)
  for (const sample of samples) {
    expect(sample.zoom, String(sample.id)).toBeGreaterThanOrEqual(0)
    expect(Math.abs(sample.inline - sample.zoom), String(sample.id)).toBeLessThanOrEqual(150)
  }
  await dialog.getByRole('button', { name: 'Chạy hoạt ảnh', exact: true }).click()
  await expect.poll(async () => (await timeline(page)).time).toBeGreaterThan(paused + 100)
  await dialog.getByRole('button', { name: 'Tạm dừng hoạt ảnh', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(zoomButton).toBeFocused()

  await page.getByRole('button', { name: 'Chạy hoạt ảnh', exact: true }).click()
  await zoomButton.click()
  await expect(dialog.locator('svg')).toBeVisible()
  await expect.poll(async () => (await timeline(page)).state).toBe('running')
  for (const sample of await compareZoomTimelines(page)) {
    expect(Math.abs(sample.inline - sample.zoom), String(sample.id)).toBeLessThanOrEqual(150)
  }
  const runningTime = (await timeline(page)).time
  await expect.poll(async () => (await timeline(page)).time).toBeGreaterThan(runningTime + 200)
  for (const sample of await compareZoomTimelines(page)) {
    expect(Math.abs(sample.inline - sample.zoom), String(sample.id)).toBeLessThanOrEqual(150)
  }
  await page.keyboard.press('Escape')
  await finishCurrentRun(page)
  await zoomButton.click()
  await expect(dialog.locator('svg')).toBeVisible()
  for (const sample of await compareZoomTimelines(page)) {
    expect(Math.abs(sample.inline - sample.zoom), String(sample.id)).toBeLessThanOrEqual(150)
  }
  await dialog.getByRole('button', { name: 'Chạy lại hoạt ảnh', exact: true }).click()
  await expect.poll(async () => (await timeline(page)).state).toBe('running')
  expect((await timeline(page)).time).toBeLessThan(1200)
  for (const sample of await compareZoomTimelines(page)) {
    expect(Math.abs(sample.inline - sample.zoom), String(sample.id)).toBeLessThanOrEqual(150)
  }
})

test('reduced motion giữ cảnh đầu cả khi bấm controls và mở Xem lớn', async ({ page }) => {
  await page.setViewportSize({ width: 260, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openPilot(page)
  const initial = '[data-animation-shape="slow-state-n0"]'
  const final = '[data-animation-shape="slow-state-n4"]'
  await expect(page.locator(`${INLINE} ${initial}`)).toHaveCSS('opacity', '1')
  await expect(page.locator(`${INLINE} ${final}`)).toHaveCSS('opacity', '0')
  expect(
    await page
      .locator(INLINE)
      .evaluate((element) => element.getAnimations({ subtree: true }).length),
  ).toBe(0)
  await page.getByRole('button', { name: 'Tạm dừng hoạt ảnh', exact: true }).click()
  await page.getByRole('button', { name: 'Chạy hoạt ảnh', exact: true }).click()
  await page.getByRole('button', { name: 'Xem lớn', exact: true }).click()
  await expect(page.locator(`dialog ${initial}`)).toHaveCSS('opacity', '1')
  await expect(page.locator(`dialog ${final}`)).toHaveCSS('opacity', '0')
  expect(
    await page
      .locator('dialog svg')
      .evaluate((element) => element.getAnimations({ subtree: true }).length),
  ).toBe(0)
  await expect(page.locator('figure figcaption ol li')).toHaveCount(5)
})

test('hoạt họa STEM lặp vẫn chỉ phát/dừng, không chuyển sang phát lại', async ({ page }) => {
  await mockLogin(page, 'vi', 'blue-sky')
  await page.goto('/goc-hoc-tap/biology/bai-hoc/sinh10-c2-b5', { waitUntil: 'domcontentloaded' })
  await expect(page.locator(INLINE)).toBeVisible({ timeout: 30_000 })
  await page
    .locator(GROUPS)
    .first()
    .evaluate((element) => {
      element.dispatchEvent(
        new AnimationEvent('animationend', {
          bubbles: true,
          animationName: (element as SVGElement).style.animationName,
        }),
      )
    })
  await expect(page.getByRole('button', { name: 'Chạy lại hoạt ảnh', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Tạm dừng hoạt ảnh', exact: true }).click()
  await expect.poll(async () => (await timeline(page)).state).toBe('paused')
  await page.getByRole('button', { name: 'Chạy hoạt ảnh', exact: true }).click()
  await expect.poll(async () => (await timeline(page)).state).toBe('running')
})

for (const theme of ['blue-sky', 'dark-blue'] as const) {
  test(`pilot 390px/${theme}: chữ đọc được và qua quét AAA`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openPilot(page, theme)
    const minFont = await page.locator(INLINE).evaluate((element) => {
      const svg = element as SVGSVGElement
      const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width
      return (
        Math.min(
          ...[...svg.querySelectorAll('text')].map((label) =>
            Number(label.getAttribute('font-size')),
          ),
        ) * scale
      )
    })
    expect(minFont).toBeGreaterThanOrEqual(12)
    await freezeAnimations(page)
    await waitForStableDom(page)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag2aaa'])
      .analyze()
    expect(results.violations).toEqual([])
  })
}
