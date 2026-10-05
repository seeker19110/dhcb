import { expect, test } from '@playwright/test'
import { mockLogin, type ThemeName } from './helpers/auth'

const CAP_A1 = '/goc-hoc-tap/english/lo-trinh/a1'
const THEMES: ThemeName[] = ['dark-blue', 'blue-sky', 'kid']
const TAB_NAMES = ['Bài học', 'Hôm nay', 'Ôn lại', 'Nghe', 'Từ khó', 'Kiểm tra']

for (const width of [320, 390]) {
  for (const theme of THEMES) {
    test(`CEFR tabs keep 44px targets at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await mockLogin(page, 'vi', theme)
      await page.goto(CAP_A1, { waitUntil: 'domcontentloaded' })

      const quiz = page.getByRole('button', { name: 'Kiểm tra', exact: true })
      await expect(quiz).toBeVisible({ timeout: 60_000 })
      const tabs = quiz.locator('..').locator(':scope > button')
      await expect(tabs).toHaveCount(6)

      const tops: number[] = []
      for (const [index, name] of TAB_NAMES.entries()) {
        const tab = tabs.nth(index)
        await expect(tab).toContainText(name)
        const box = await tab.boundingBox()
        expect(box, `${name} must have a visible hit target`).not.toBeNull()
        expect(box!.width, `${name} width`).toBeGreaterThanOrEqual(44)
        expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44)
        tops.push(await tab.evaluate((element) => (element as HTMLElement).offsetTop))
        await tab.scrollIntoViewIfNeeded()
        expect(
          await tab.evaluate((element) => {
            const rect = element.getBoundingClientRect()
            const hit = document.elementFromPoint(
              rect.left + rect.width / 2,
              rect.top + rect.height / 2,
            )
            return hit === element || element.contains(hit)
          }),
          `${name} center must hit its own button`,
        ).toBe(true)
      }

      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      ).toBe(0)
      if (width === 320) {
        expect(tops[3]!).toBeGreaterThan(tops[0]!)
      } else {
        expect(tops[3]).toBe(tops[0])
      }

      await tabs.nth(4).focus()
      await page.keyboard.press('Tab')
      await expect(tabs.nth(5)).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(tabs.nth(5)).toHaveAttribute('aria-pressed', 'true')
    })
  }
}
