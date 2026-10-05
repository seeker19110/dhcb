import { expect, test, type Page } from '@playwright/test'
import { mockLogin } from './helpers/auth'
import { muteTts } from './helpers/tts'

// S05 — "Khôi phục câu ví dụ đã học": câu phát ra đã qua builder kiểm chứng, lọc trước cap,
// chấm theo id, empty có lối ra, dùng được bằng bàn phím. Dữ liệu tĩnh ở biên fetch.
type Direction = 'A' | 'B'
type UiLang = 'vi' | 'en'

const goodPairs = [
  ['apple', 'quả táo'],
  ['book', 'quyển sách'],
  ['river', 'dòng sông'],
  ['garden', 'khu vườn'],
  ['flower', 'bông hoa'],
  ['house', 'ngôi nhà'],
  ['bridge', 'cây cầu'],
  ['candle', 'ngọn nến'],
  ['window', 'cửa sổ'],
] as const
// Mỗi câu mang "Clue n" để test biết đáp án đúng mà không cần đọc state của app.
const good = goodPairs.map(([word, vi], i) => ({
  word,
  vi,
  ipa: '',
  pos: 'n',
  ex_en: `Clue ${i}: I like the ${word}.`,
  ex_vi: `Gợi ý ${i}: Tôi thích ${vi}.`,
}))
// Câu lỗi đứng ĐẦU pool: từ con ("he" trong "the"), hai vị trí, không khớp.
const bad = [
  {
    word: 'he',
    vi: 'anh ấy',
    ipa: '',
    pos: 'pron',
    ex_en: 'Look at the sky.',
    ex_vi: 'Nhìn trời.',
  },
  {
    word: 'cat',
    vi: 'con mèo',
    ipa: '',
    pos: 'n',
    ex_en: 'A cat and a cat.',
    ex_vi: 'Mèo và mèo.',
  },
]

async function setup(page: Page, direction: Direction, uiLang: UiLang, entries: unknown[]) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.pathname.startsWith('/api/')) {
      await route.abort()
    } else await route.continue()
  })
  await mockLogin(page, uiLang)
  await muteTts(page)
  await page.route('**/data/curriculum.json', (route) => route.fulfill({ json: [] }))
  await page.route('**/data/cefr.json', (route) => route.fulfill({ json: [] }))
  await page.route('**/data/dictionary/chunk-*.json', (route) =>
    route.fulfill({ json: route.request().url().endsWith('chunk-000.json') ? entries : [] }),
  )
  await page.addInitScript((dir) => localStorage.setItem('et_direction', dir), direction)
  await page.goto('/luyen-tap', { waitUntil: 'domcontentloaded' })
  const mode = page.getByRole('button', { name: /Điền từ ngữ cảnh|Fill in the blank/ })
  await expect(mode).toBeEnabled({ timeout: 30_000 })
  return mode
}

const question = (page: Page) => page.getByRole('main').locator('p[tabindex="-1"]')

async function correctAnswer(page: Page, direction: Direction) {
  const text = (await question(page).textContent()) ?? ''
  const index = Number(/(?:Clue|Gợi ý) (\d+)/.exec(text)?.[1])
  const entry = good[index]!
  return direction === 'A' ? entry.word : entry.vi
}

test.describe('S05 — điền từ có kiểm chứng', () => {
  for (const [direction, uiLang] of [
    ['A', 'vi'],
    ['B', 'en'],
  ] as const) {
    test(`${direction} × ${uiLang}: lọc câu lỗi trước cap, bàn phím, phản hồi chữ, Retry`, async ({
      page,
    }) => {
      const mode = await setup(page, direction, uiLang, [...bad, ...good])
      await mode.click()
      await expect(
        page.getByText(
          uiLang === 'vi'
            ? 'Khôi phục câu ví dụ đã học'
            : 'Restore the example sentence you learned',
          { exact: true },
        ),
      ).toBeVisible()
      await expect(page.getByText('1/8', { exact: true })).toBeVisible()
      await expect(question(page)).toHaveAttribute('lang', direction === 'A' ? 'en' : 'vi')

      const next = uiLang === 'vi' ? 'Câu tiếp theo →' : 'Next →'
      for (let i = 1; i <= 8; i++) {
        await expect(page.getByText(`${i}/8`, { exact: true })).toBeVisible()
        const text = (await question(page).textContent()) ?? ''
        expect(text).toContain('_____')
        expect(text).not.toMatch(/Look at|A cat and|Nhìn trời|Mèo và/)
        const options = page.getByRole('group').getByRole('button')
        await expect(options).toHaveCount(4)
        const labels = await options.allTextContents()
        expect(new Set(labels.map((l) => l.trim().toLowerCase())).size).toBe(4)
        const answer = await correctAnswer(page, direction)
        // Câu 1 trả lời SAI bằng bàn phím để kiểm phản hồi chữ; các câu sau trả lời đúng.
        const pick = i === 1 ? labels.find((l) => l !== answer)! : answer
        const target = options.filter({ hasText: new RegExp(`^${pick}$`) })
        await target.focus()
        await page.keyboard.press('Enter')
        await expect(page.getByRole('status').filter({ hasText: /\S/ })).toHaveText(
          i === 1
            ? uiLang === 'vi'
              ? `Chưa đúng. Đáp án: ${answer}`
              : `Not quite. Answer: ${answer}`
            : uiLang === 'vi'
              ? 'Chính xác!'
              : 'Correct!',
        )
        for (const option of await options.all()) await expect(option).toBeDisabled()
        const nextButton = page.getByRole('button', { name: next, exact: true })
        await expect(nextButton).toBeFocused()
        await page.keyboard.press('Enter')
        if (i < 8) await expect(question(page)).toBeFocused()
      }
      await expect(page.getByRole('main').locator('p', { hasText: /^7\/8$/ })).toBeVisible()
      await page.getByRole('button', { name: /^(Làm lại|Retry)$/ }).click()
      await expect(page.getByText('1/8', { exact: true })).toBeVisible()
    })
  }

  test('dưới 4 câu hợp lệ: màn chưa đủ, không chấm 0, có đường về Luyện tập', async ({ page }) => {
    const mode = await setup(page, 'B', 'vi', [...bad, ...good.slice(0, 3)])
    await mode.click()
    await expect(page.getByText(/Chưa đủ câu ví dụ phù hợp/)).toBeVisible()
    await expect(page.getByText('Điểm phiên luyện tập này')).toHaveCount(0)
    const back = page.getByRole('main').getByRole('button', { name: 'Về Luyện tập' }).last()
    await back.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: /Điền từ ngữ cảnh/ })).toBeVisible()
  })
})
