import { expect, test, type Page } from '@playwright/test'
import { mockLogin } from './helpers/auth'
import { muteTts } from './helpers/tts'

type Direction = 'A' | 'B'
type UiLang = 'vi' | 'en'
type AudioRequest = { text: string; lang: string }

// Dữ liệu tĩnh ở biên fetch; vẫn chạy loader, Practice và mini-game thật.
const entries = (
  [
    ['apple', 'quả táo'],
    ['book', 'quyển sách'],
    ['cat', 'con mèo'],
    ['dog', 'con chó'],
    ['egg', 'quả trứng'],
    ['flower', 'bông hoa'],
    ['house', 'ngôi nhà'],
    ['tree', 'cái cây'],
  ] as const
).map(([word, vi]) => ({
  word,
  vi,
  ipa: '',
  pos: 'n',
  ex_en: `I see a ${word}.`,
  ex_vi: `Tôi thấy ${vi}.`,
}))

async function setup(page: Page, direction: string | null, uiLang: UiLang) {
  // Chặn toàn bộ API chưa mock và origin ngoài trước khi đăng nhập: không provider thật.
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.pathname.startsWith('/api/')) {
      await route.abort()
    } else await route.continue()
  })
  await mockLogin(page, uiLang)
  await muteTts(page)
  const audio: AudioRequest[] = []
  await page.route('**/api/tts', async (route) => {
    audio.push(route.request().postDataJSON() as AudioRequest)
    await route.abort()
  })
  await page.route('**/data/curriculum.json', (route) => route.fulfill({ json: [] }))
  await page.route('**/data/cefr.json', (route) => route.fulfill({ json: [] }))
  await page.route('**/data/dictionary/chunk-*.json', (route) =>
    route.fulfill({ json: route.request().url().endsWith('chunk-000.json') ? entries : [] }),
  )
  await page.addInitScript((initialDirection) => {
    // Chỉ gieo một lần: reload phải đọc setting mới, không bị init script ghi đè.
    if (!sessionStorage.getItem('s04-seeded')) {
      if (initialDirection === null) localStorage.removeItem('et_direction')
      else localStorage.setItem('et_direction', initialDirection)
      sessionStorage.setItem('s04-seeded', '1')
    }
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      value: () => Promise.reject(new Error('S04: microphone bị chặn trong E2E')),
    })
  }, direction)
  await page.goto('/luyen-tap', { waitUntil: 'domcontentloaded' })
  await expect(
    page.getByRole('button', { name: /Nghe đoán từ vựng|Listen and guess vocabulary/ }),
  ).toBeEnabled({ timeout: 30_000 })
  return audio
}

// App chưa có UI-only switch trên Practice. Cầu nối chỉ gọi setter context thật,
// không sửa source, session, pool hoặc state của game. Đây không phải E2E nút đổi UI.
async function changeUi(page: Page, uiLang: UiLang) {
  await page.evaluate((next) => {
    type ContextValue = { lang?: string; setLang?: (lang: string) => void }
    type Dependency = { memoizedValue?: ContextValue; next?: Dependency }
    type Fiber = { return?: Fiber; dependencies?: { firstContext?: Dependency } }
    const main = document.querySelector('main')
    if (!main) throw new Error('Không tìm thấy main')
    const key = Object.keys(main).find((name) => name.startsWith('__reactFiber$'))
    let fiber = key ? (main as unknown as Record<string, Fiber>)[key] : undefined
    while (fiber) {
      let dependency = fiber.dependencies?.firstContext
      while (dependency) {
        const value = dependency.memoizedValue
        if (typeof value?.setLang === 'function' && typeof value.lang === 'string') {
          value.setLang(next)
          return
        }
        dependency = dependency.next
      }
      fiber = fiber.return
    }
    throw new Error('Không tìm thấy LangContext; không được bỏ qua kiểm tra đổi UI')
  }, uiLang)
  await expect.poll(() => page.evaluate(() => localStorage.getItem('ui_lang'))).toBe(uiLang)
}

async function openListen(page: Page) {
  await page.getByRole('button', { name: /Nghe đoán từ vựng|Listen and guess vocabulary/ }).click()
  await expect(
    page.getByRole('heading', { name: /Nghe đoán từ vựng|Listen & guess/ }),
  ).toBeVisible()
}

function options(page: Page, direction: Direction) {
  const labels = entries.map((entry) => (direction === 'A' ? entry.vi : entry.word))
  return page.getByRole('main').getByRole('button', { name: new RegExp(`^(${labels.join('|')})$`) })
}

async function replay(page: Page, audio: AudioRequest[], direction: Direction) {
  const before = audio.length
  await page.getByRole('button', { name: /^(Nghe lại|Play again)$/ }).click()
  await expect.poll(() => audio.length).toBeGreaterThan(before)
  const request = audio.at(-1)!
  expect(request.lang).toBe(direction === 'A' ? 'en-US' : 'vi-VN')
  const entry = entries.find((item) => (direction === 'A' ? item.word : item.vi) === request.text)
  expect(entry, 'Audio phải thuộc pool tĩnh và đúng chiều học').toBeDefined()
  return { request, answer: direction === 'A' ? entry!.vi : entry!.word }
}

test.describe('S04 — direction độc lập UI', () => {
  test('Keyboard focus is visible on a mode and its answer', async ({ page }) => {
    await setup(page, 'A', 'vi')
    const mode = page.getByRole('button', { name: 'Nghe đoán từ vựng' })
    await mode.focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    await expect(mode).toBeFocused()
    await expect(mode).toHaveCSS('outline-style', 'solid')
    await mode.press('Enter')
    const exit = page.getByRole('button', { name: 'Về Luyện tập' })
    const exitBox = await exit.boundingBox()
    expect(exitBox?.width).toBeGreaterThanOrEqual(44)
    expect(exitBox?.height).toBeGreaterThanOrEqual(44)
    const answer = options(page, 'A').first()
    await answer.focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    await expect(answer).toBeFocused()
    await expect(answer).toHaveCSS('outline-style', 'solid')
  })

  test('Settings thật lưu B, reload Practice dùng B dù UI được gieo vi', async ({ page }) => {
    const audio = await setup(page, 'A', 'vi')
    await page.goto('/cai-dat')
    await page.getByRole('button').filter({ hasText: 'Tiếng Việt (học tiếng Anh)' }).click()
    await expect(
      page.getByRole('button').filter({ hasText: 'English (learn Vietnamese)' }),
    ).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('et_direction'))).toBe('B')
    await page.goto('/luyen-tap')
    await openListen(page)
    await expect(options(page, 'B')).toHaveCount(4)
    await replay(page, audio, 'B')
    await page.reload()
    await openListen(page)
    await replay(page, audio, 'B')
  })

  for (const direction of ['A', 'B'] as const) {
    for (const uiLang of ['vi', 'en'] as const) {
      test(`${direction} × ${uiLang}: đổi UI giữ câu, options, lựa chọn, điểm và audio; Retry giữ phiên`, async ({
        page,
      }) => {
        const audio = await setup(page, direction, uiLang)
        await openListen(page)
        await expect(
          page.getByRole('button', {
            name: uiLang === 'vi' ? 'Nghe lại' : 'Play again',
            exact: true,
          }),
        ).toBeVisible()
        const first = await replay(page, audio, direction)
        await expect(options(page, direction)).toHaveCount(4)
        await page.getByRole('button', { name: first.answer, exact: true }).press('Enter')
        await page.getByRole('button', { name: /^(Câu tiếp theo →|Next →)$/ }).click()
        await expect(page.getByText('2/8', { exact: true })).toBeVisible()
        const second = await replay(page, audio, direction)
        const beforeOptions = await options(page, direction).allTextContents()
        await page.getByRole('button', { name: second.answer, exact: true }).click()
        const nextUi = uiLang === 'vi' ? 'en' : 'vi'
        await changeUi(page, nextUi)
        await expect(
          page.getByRole('button', {
            name: nextUi === 'vi' ? 'Câu tiếp theo →' : 'Next →',
            exact: true,
          }),
        ).toBeVisible()
        await expect(page.getByText('2/8', { exact: true })).toBeVisible()
        expect(await options(page, direction).allTextContents()).toEqual(beforeOptions)
        for (const option of await options(page, direction).all())
          await expect(option).toBeDisabled()
        expect((await replay(page, audio, direction)).request).toEqual(second.request)
        expect(await page.evaluate(() => localStorage.getItem('et_direction'))).toBe(direction)

        // Setting thay đổi khi phiên đang mở: phiên cũ và Retry vẫn giữ chiều cũ.
        const newDirection = direction === 'A' ? 'B' : 'A'
        await page.evaluate((value) => localStorage.setItem('et_direction', value), newDirection)
        await page.getByRole('button', { name: /^(Câu tiếp theo →|Next →)$/ }).click()
        for (let index = 3; index <= 8; index++) {
          await expect(page.getByText(`${index}/8`, { exact: true })).toBeVisible()
          const current = await replay(page, audio, direction)
          await page.getByRole('button', { name: current.answer, exact: true }).click()
          await page.getByRole('button', { name: /^(Câu tiếp theo →|Next →)$/ }).click()
        }
        await expect(page.getByText('8/8', { exact: true })).toBeVisible()
        await expect(
          page.getByText(nextUi === 'vi' ? 'Điểm phiên luyện tập này' : 'Score for this session', {
            exact: true,
          }),
        ).toBeVisible()
        await page.getByRole('button', { name: /^(Làm lại|Retry)$/ }).click()
        await expect(page.getByText('1/8', { exact: true })).toBeVisible()
        expect((await replay(page, audio, direction)).request).toEqual(first.request)
        await page
          .getByRole('button', {
            name: nextUi === 'vi' ? 'Về Luyện tập' : 'Back to Practice',
          })
          .click()
        await openListen(page)
        await expect(options(page, newDirection)).toHaveCount(4)
        await replay(page, audio, newDirection)
        await page.reload()
        await openListen(page)
        await replay(page, audio, newDirection)
      })
    }
  }

  for (const setting of [null, 'invalid-direction']) {
    test(`setting ${String(setting)} fallback A với UI en`, async ({ page }) => {
      const audio = await setup(page, setting, 'en')
      await openListen(page)
      await expect(options(page, 'A')).toHaveCount(4)
      await expect(page.getByRole('button', { name: 'Play again', exact: true })).toBeVisible()
      await replay(page, audio, 'A')
    })
  }

  for (const mode of [/Chấm phát âm từ vựng/, /Đọc lại câu ví dụ/]) {
    for (const direction of ['A', 'B'] as const) {
      test(`${mode.source} ${direction}: câu thứ hai ổn định khi đổi UI`, async ({ page }) => {
        await setup(page, direction, 'vi')
        await page.getByRole('button', { name: mode }).click()
        await page.getByRole('button', { name: 'Tiếp theo →', exact: true }).click()
        await expect(page.getByText('2/8', { exact: true })).toBeVisible()
        const targets = entries.map((entry) =>
          mode.source.startsWith('Chấm')
            ? direction === 'A'
              ? entry.word
              : entry.vi
            : direction === 'A'
              ? entry.ex_en
              : entry.ex_vi,
        )
        const target = page
          .getByRole('main')
          .locator('p')
          .filter({
            hasText: new RegExp(
              `^(${targets.map((text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})$`,
            ),
          })
        await expect(target).toHaveCount(1)
        const before = await target.textContent()
        await changeUi(page, 'en')
        await expect(page.getByRole('button', { name: 'Next →', exact: true })).toBeVisible()
        await expect(page.getByText('2/8', { exact: true })).toBeVisible()
        await expect(target).toHaveText(before!)
        await expect(
          page.getByRole('button', { name: 'Check pronunciation', exact: true }),
        ).toBeVisible()
      })
    }
  }
})
