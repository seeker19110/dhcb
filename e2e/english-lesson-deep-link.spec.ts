// S09c — hội thoại mẫu English: URL `?lesson=N#luot-M`, fallback, lỗi tải/Thử lại, history,
// focus, huỷ audio/đóng vai khi điều hướng, `#ket-qua`.
// Contract: docs/specs/2026-09-23-uiux-s09-s12-trai-nghiem-va-nghiem-thu.md §2.7 (S09-EN-AC01..06).
//
// MỌI nhà cung cấp trả phí đều MOCK bằng page.route: /api/tts (huỷ → Web Speech giả kết thúc
// ngay), /api/stt, /api/agent (chấm điểm). Micro là MediaRecorder giả. Spec ĐẾM request side
// effect để chứng minh điều hướng không phát/chấm lại và không cộng điểm.
import { test, expect, type Page, type Route } from '@playwright/test'
import { mockLogin } from './helpers/auth'
import { muteTts } from './helpers/tts'
import AxeBuilder from '@axe-core/playwright'
import { freezeAnimations } from './helpers/axe'
import type { ThemeName } from './helpers/auth'

const ROUTE = '/goc-hoc-tap/english/bai-hoc'

type Counters = { tts: number; stt: number; agent: number }

async function setup(
  page: Page,
  opts: { direction?: 'A' | 'B'; theme?: ThemeName } = {},
): Promise<Counters> {
  const c: Counters = { tts: 0, stt: 0, agent: 0 }
  await muteTts(page)
  // Đếm SAU muteTts: route đăng ký sau được ưu tiên, rồi chuyển tiếp cho route huỷ của muteTts.
  await page.route('**/api/tts', (route) => {
    c.tts++
    return route.fallback()
  })
  await page.route('**/api/plan-features', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ catalog: [], flags: {}, updatedAt: '1970-01-01T00:00:00.000Z' }),
    }),
  )
  await page.route('**/api/stt', (route) => {
    c.stt++
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"text":"hi"}' })
  })
  await page.route('**/api/agent', (route) => {
    c.agent++
    return route.abort()
  })
  await mockLogin(page, 'vi', opts.theme ?? 'blue-sky')
  if (opts.direction) {
    await page.addInitScript((d) => localStorage.setItem('et_direction', d), opts.direction)
  }
  return c
}

// Micro giả: getUserMedia trả stream rỗng, MediaRecorder giả phát 1 blob khi dừng.
async function fakeMic(page: Page) {
  await page.addInitScript(() => {
    const stream = { getTracks: () => [{ stop() {} }] }
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: async () => stream },
    })
    // Giống MediaRecorder thật: stop() khi đã "inactive" thì ném lỗi, onstop chỉ bắn MỘT lần.
    class FakeRecorder {
      ondataavailable: ((e: { data: Blob }) => void) | null = null
      onstop: (() => void) | null = null
      state: 'inactive' | 'recording' = 'inactive'
      static isTypeSupported() {
        return true
      }
      start() {
        this.state = 'recording'
      }
      stop() {
        if (this.state === 'inactive') throw new DOMException('inactive', 'InvalidStateError')
        this.state = 'inactive'
        setTimeout(() => {
          this.ondataavailable?.({ data: new Blob(['x'], { type: 'audio/webm' }) })
          this.onstop?.()
        }, 0)
      }
    }
    Object.defineProperty(window, 'MediaRecorder', { configurable: true, value: FakeRecorder })
  })
}

async function historyLength(page: Page) {
  return page.evaluate(() => history.length)
}

// ── S09-EN-AC01 ──────────────────────────────────────────────────────────────
for (const width of [390, 1440]) {
  for (const direction of ['A', 'B'] as const) {
    test(`AC01 ${width}px chiều ${direction}: ?lesson=1#luot-20 mở thẳng + tải lại → focus lượt 20`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await setup(page, { direction })
      await page.goto(`${ROUTE}?lesson=1#luot-20`)
      const turn = page.locator('#luot-20')
      await expect(turn).toBeFocused()
      await expect(turn).toHaveAttribute(
        'aria-label',
        direction === 'A' ? 'Lượt 20 — Tom' : 'Turn 20 — Tom',
      )
      // Đích không bị thanh điều khiển che. Đo CẢ thanh (không phải khung kính bên trong: mobile
      // đã bỏ khung đó từ 2026-10-02, desktop vẫn còn) — mép dưới của thanh là thứ có thể che.
      const toolbarBottom = await page
        .getByTestId('thanh-dieu-khien-bai')
        .evaluate((el) => el.getBoundingClientRect().bottom)
      const top = (await turn.boundingBox())!.y
      expect(top).toBeGreaterThanOrEqual(toolbarBottom)
      await page.reload()
      await expect(page.locator('#luot-20')).toBeFocused()
    })
  }
}

test('AC01: từ đầu bài tới lượt 20 bằng 2 kích hoạt bàn phím; chọn lại không thêm history', async ({
  page,
}) => {
  await setup(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${ROUTE}?lesson=1`)
  const trigger = page.getByRole('button', { name: 'Trong bài' })
  await trigger.focus()
  await page.keyboard.press('Enter') // kích hoạt 1
  const link = page.getByRole('link', { name: 'Lượt 20 — Tom' })
  await link.focus()
  const before = await historyLength(page)
  await page.keyboard.press('Enter') // kích hoạt 2
  await expect(page.locator('#luot-20')).toBeFocused()
  await expect(page).toHaveURL(/\?lesson=1#luot-20$/)
  expect(await historyLength(page)).toBe(before + 1)
  // Chọn lại đúng đích: focus lại, không thêm entry.
  await trigger.click()
  await page.getByRole('link', { name: 'Lượt 20 — Tom' }).click()
  await expect(page.locator('#luot-20')).toBeFocused()
  expect(await historyLength(page)).toBe(before + 1)
  // Escape khi chưa chọn → focus về nút mở.
  await trigger.click()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  // Back → về đầu bài (entry không hash) + focus tiêu đề; Forward → lượt 20.
  await page.goBack()
  await expect(page).toHaveURL(/\?lesson=1$/)
  await expect(page.locator('#dau-bai')).toBeFocused()
  await page.goForward()
  await expect(page.locator('#luot-20')).toBeFocused()
})

test('AC01: link cũ /bai-hoc giữ query + hash qua redirect', async ({ page }) => {
  await setup(page)
  await page.goto('/bai-hoc?lesson=1#luot-20')
  await expect(page).toHaveURL(new RegExp(`${ROUTE}\\?lesson=1#luot-20$`))
  await expect(page.locator('#luot-20')).toBeFocused()
})

// ── S09-EN-AC04 ──────────────────────────────────────────────────────────────
for (const q of ['lesson=0', 'lesson=abc', 'lesson=', 'lesson=1&lesson=2', 'lesson=9999']) {
  test(`AC04: ?${q} → thông báo tại danh sách, focus heading, không nạp chunk`, async ({
    page,
  }) => {
    await setup(page)
    // AuthProvider nạp sẵn chunk-000 lúc đăng nhập (preloadBrowse) — đó KHÔNG phải mở bài.
    // Chốt ở đây: không chunk nào KHÁC được tải, và không bài nào được dựng.
    const chunks: string[] = []
    await page.route('**/data/lessons/chunk-*.json', (route) => {
      chunks.push(route.request().url().split('/').pop() ?? '')
      return route.fallback()
    })
    await page.goto(`${ROUTE}?${q}`)
    await expect(page.locator('#bai-khong-mo-duoc')).toBeFocused()
    await expect(page.locator('#dau-bai')).toHaveCount(0)
    await expect(page.locator('#lesson-card-1')).toBeVisible()
    expect(chunks.filter((c) => c !== 'chunk-000.json')).toEqual([])
  })
}

for (const h of ['#luot-0', '#luot-21', '#abc', '#luot-01']) {
  test(`AC04: bài 1 ${h} → về tiêu đề bài, không kẹp sang lượt cuối`, async ({ page }) => {
    await setup(page)
    await page.goto(`${ROUTE}?lesson=1${h}`)
    await expect(page.locator('#dau-bai')).toBeFocused()
  })
}

// ── S09-EN-AC03 ──────────────────────────────────────────────────────────────
test('AC03: bài 11 (chunk-001) tải chậm, chuyển sang bài 1 → không nhận response/focus cũ', async ({
  page,
}) => {
  await setup(page)
  let release: () => void = () => undefined
  const gate = new Promise<void>((r) => (release = r))
  await page.route('**/data/lessons/chunk-001.json', async (route: Route) => {
    await gate
    await route.fallback()
  })
  await page.goto(`${ROUTE}?lesson=11#luot-4`)
  await expect(page.getByRole('status')).toContainText('Đang tải bài học')
  // Chuyển bài qua danh sách bên trái (desktop 1280px).
  await page.locator('#lesson-card-1').click()
  await expect(page.locator('#dau-bai')).toContainText('Giới thiệu bản thân')
  release()
  await page.waitForTimeout(500)
  await expect(page.locator('#dau-bai')).toContainText('Giới thiệu bản thân')
  await expect(page.locator('#dau-bai')).toBeFocused()
  await expect(page).toHaveURL(/\?lesson=1$/)
})

test('AC03: HTTP 503 ở chunk → "Không tải được" + Thử lại (không phải mã sai); Thử lại mở bài', async ({
  page,
}) => {
  await setup(page)
  let fail = true
  await page.route('**/data/lessons/chunk-001.json', (route) =>
    fail ? route.fulfill({ status: 503, body: '' }) : route.fallback(),
  )
  await page.goto(`${ROUTE}?lesson=11`)
  await expect(page.locator('#loi-tai-bai')).toBeFocused()
  await expect(page.locator('#loi-tai-bai')).toContainText('Không tải được bài 11')
  await expect(page.locator('#bai-khong-mo-duoc')).toHaveCount(0)
  fail = false
  await page.getByRole('button', { name: 'Thử lại' }).click()
  await expect(page.locator('#dau-bai')).toContainText('Trả phòng khách sạn')
})

// ── History "Danh sách" (mobile) ─────────────────────────────────────────────
test('390px: "Danh sách" bỏ lesson + hash, giữ query khác, focus thẻ bài vừa mở', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await setup(page)
  await page.goto(`${ROUTE}?from=home&lesson=1#luot-3`)
  await expect(page.locator('#luot-3')).toBeFocused()
  await page.getByRole('button', { name: /Danh sách/ }).click()
  await expect(page).toHaveURL(new RegExp(`${ROUTE}\\?from=home$`))
  await expect(page.locator('#lesson-card-1')).toBeFocused()
})

// ── S09-EN-AC05 ──────────────────────────────────────────────────────────────
test('AC05: tải lại bài 1 #ket-qua → thông báo rỗng, không điểm giả, không request chấm', async ({
  page,
}) => {
  const c = await setup(page)
  await page.goto(`${ROUTE}?lesson=1#ket-qua`)
  await expect(page.locator('#ket-qua')).toBeFocused()
  await expect(page.getByText('Chưa có kết quả trong lần mở bài này.')).toBeVisible()
  await page.reload()
  await expect(page.locator('#ket-qua')).toBeFocused()
  await expect(page.getByText('Chưa có kết quả trong lần mở bài này.')).toBeVisible()
  expect(c.agent).toBe(0)
  expect(c.stt).toBe(0)
})

// ── S09-EN-AC02 ──────────────────────────────────────────────────────────────
test('AC02: bài 2 đang "Phát tất cả" → nhảy lượt dừng phát, không phát lại; đổi bài cũng vậy', async ({
  page,
}) => {
  const c = await setup(page)
  await page.goto(`${ROUTE}?lesson=2`)
  await page.getByRole('button', { name: 'Phát tất cả' }).click()
  await expect(page.getByRole('button', { name: 'Dừng', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Trong bài' }).click()
  await page.getByRole('link', { name: /^Lượt 10 — / }).click()
  await expect(page.locator('#luot-10')).toBeFocused()
  // Điều hướng áp → trình phát về trạng thái nghỉ, không tự phát lại.
  await expect(page.getByRole('button', { name: 'Phát tất cả' })).toBeVisible()
  const sau = c.tts
  await page.waitForTimeout(1500)
  expect(c.tts).toBe(sau)

  await page.getByRole('button', { name: 'Phát tất cả' }).click()
  await expect(page.getByRole('button', { name: 'Dừng', exact: true })).toBeVisible()
  await page.locator('#lesson-card-1').click()
  await expect(page.locator('#dau-bai')).toContainText('Giới thiệu bản thân')
  await expect(page.getByRole('button', { name: 'Phát tất cả' })).toBeVisible()
  const sau2 = c.tts
  await page.waitForTimeout(1500)
  expect(c.tts).toBe(sau2)
})

test('AC02: bài 2 đóng vai, STT đang chờ mà đổi bài → không chấm, không thêm request', async ({
  page,
}) => {
  const c = await setup(page)
  await fakeMic(page)
  let releaseStt: () => void = () => undefined
  const sttGate = new Promise<void>((r) => (releaseStt = r))
  await page.route('**/api/stt', async (route) => {
    c.stt++
    await sttGate
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"text":"hi"}' })
  })
  await page.goto(`${ROUTE}?lesson=2`)
  await page.getByRole('button', { name: 'Đóng vai' }).click()
  // Vai A: lượt 1 là của người học → chờ ghi âm ngay.
  const nguoiA = await page.locator('#luot-1').getAttribute('aria-label')
  const tenA = (nguoiA ?? '').split(' — ')[1] ?? ''
  await page.getByRole('button', { name: tenA, exact: true }).click()
  await page.getByRole('button', { name: 'Bấm để nói câu này' }).click()
  await page.getByRole('button', { name: 'Dừng ghi âm' }).click()
  await expect.poll(() => c.stt).toBe(1)
  await page.locator('#lesson-card-1').click()
  await expect(page.locator('#dau-bai')).toContainText('Giới thiệu bản thân')
  releaseStt()
  await page.waitForTimeout(1500)
  expect(c.stt).toBe(1)
  expect(c.agent).toBe(0)
  await expect(page.getByRole('button', { name: 'Kết thúc & chấm điểm' })).toHaveCount(0)
  await expect(page.getByText('· đến lượt bạn')).toHaveCount(0)
})

// ── S09-EN-AC06 — bài + kết quả TỔNG HỢP (mock), không phải bằng chứng sư phạm ────────
const MOCK_INDEX = [
  {
    id: 1,
    title: 'Bài thử',
    situation: 'Hai người chào nhau.',
    turnCount: 2,
    speakerAGender: 'female',
    speakerBGender: 'male',
    chunk: 0,
    idx: 0,
  },
]
const MOCK_CHUNK = [
  {
    id: 1,
    title: 'Bài thử',
    situation: 'Hai người chào nhau.',
    speakerAGender: 'female',
    speakerBGender: 'male',
    speakerAName: { vi: 'Lan', en: 'Lan' },
    speakerBName: { vi: 'Tom', en: 'Tom' },
    turns: [
      { speaker: 'A', en: 'Hi Tom', vi: 'Chào Tom' },
      { speaker: 'B', en: 'Hi Lan', vi: 'Chào Lan' },
    ],
  },
]
const LONG = 'Giải thích rất dài để kiểm bố cục. '.repeat(30)
const MOCK_EVAL = {
  scores: { fluency: 6, lexical: 6, grammar: 6, overall: 6 },
  errors: [
    { original: 'Hi Lan', corrected: 'Hi, Lan', explanation: LONG },
    { original: 'Hi Lan', corrected: 'Hello, Lan', explanation: LONG },
  ],
  strengths: ['Phát âm rõ'],
  suggestions: ['Thêm dấu phẩy khi gọi tên'],
  encouragement: 'Làm tốt lắm, cố lên nhé!',
}

test('AC06: kết quả tổng hợp — tới #ket-qua, summary + original/corrected thấy, không suy lượt', async ({
  page,
}) => {
  const c = await setup(page)
  await fakeMic(page)
  await page.route('**/data/lessons/index.json', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_INDEX),
    }),
  )
  await page.route('**/data/lessons/chunk-000.json', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CHUNK),
    }),
  )
  await page.route('**/api/agent', (route) => {
    c.agent++
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(MOCK_EVAL) }] }),
    })
  })
  await page.goto(`${ROUTE}?lesson=1`)
  await page.getByRole('button', { name: 'Đóng vai' }).click()
  await page.getByRole('button', { name: 'Tom', exact: true }).click()
  await page.getByRole('button', { name: 'Bấm để nói câu này' }).click()
  await page.getByRole('button', { name: 'Dừng ghi âm' }).click()
  await page.getByRole('button', { name: 'Kết thúc & chấm điểm' }).click()
  await expect(page.locator('#ket-qua')).toBeFocused()
  await expect(page).toHaveURL(/#ket-qua$/)
  const section = page.locator('section[aria-labelledby="ket-qua"]')
  await expect(section.getByText('Làm tốt lắm, cố lên nhé!')).toBeVisible()
  await expect(section.getByText('→ Hi, Lan')).toBeVisible()
  await expect(section.getByText('→ Hello, Lan')).toBeVisible()
  await expect(section.locator('a[href^="#luot-"]')).toHaveCount(0)
  await expect(page.locator('main')).toHaveCount(1)
  // Hội thoại vẫn còn — kết quả không thay cả màn.
  await expect(page.locator('#luot-2')).toBeVisible()
  expect(c.agent).toBe(1)
  // Đóng kết quả → #hoi-thoai, focus heading; không chấm lại.
  await page.getByRole('button', { name: 'Đóng và tiếp tục hội thoại' }).click()
  await expect(page.locator('#hoi-thoai')).toBeFocused()
  await expect(page.getByText('Chưa có kết quả trong lần mở bài này.')).toBeVisible()
  expect(c.agent).toBe(1)
})

// ── a11y A/AA của hai trạng thái mà cổng a11y chung không mở: menu "Trong bài" đang mở và màn
// kết quả nhúng trong `#ket-qua` (dữ liệu tổng hợp). Cổng chung đã quét `#ket-qua` rỗng.
async function axeAA(page: Page) {
  await freezeAnimations(page)
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  return violations.map((v) => `${v.id}: ${JSON.stringify(v.nodes[0]?.target)}`)
}

for (const theme of ['blue-sky', 'dark-blue', 'kid'] as const) {
  test(`a11y AA 390px ${theme}: menu Trong bài mở + bảng Tuỳ chọn nghe + kết quả nhúng`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await setup(page, { theme })
    await fakeMic(page)
    await page.route('**/data/lessons/index.json', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_INDEX),
      }),
    )
    await page.route('**/data/lessons/chunk-000.json', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CHUNK),
      }),
    )
    await page.route('**/api/agent', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(MOCK_EVAL) }] }),
      }),
    )
    await page.goto(`${ROUTE}?lesson=1`)
    await page.getByRole('button', { name: 'Trong bài' }).click()
    expect(await axeAA(page)).toEqual([])
    await page.keyboard.press('Escape')
    // Bảng "Tuỳ chọn nghe" của thanh công cụ mobile (2026-10-02): tốc độ · chế độ · giọng.
    await page.getByRole('button', { name: 'Tuỳ chọn nghe' }).click()
    await expect(page.getByRole('button', { name: 'Cài đặt giọng' })).toBeVisible()
    expect(await axeAA(page)).toEqual([])
    await page.getByRole('button', { name: 'Tuỳ chọn nghe' }).click()
    await page.getByRole('button', { name: 'Đóng vai' }).click()
    await page.getByRole('button', { name: 'Tom', exact: true }).click()
    await page.getByRole('button', { name: 'Bấm để nói câu này' }).click()
    await page.getByRole('button', { name: 'Dừng ghi âm' }).click()
    await page.getByRole('button', { name: 'Kết thúc & chấm điểm' }).click()
    await expect(page.locator('#ket-qua')).toBeFocused()
    expect(await axeAA(page)).toEqual([])
  })
}
