import { createHash } from 'node:crypto'
import { expect, test, type Browser, type Page, type TestInfo } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockLogin, USER_ID, type ThemeName } from './helpers/auth'
import { resolveE2ePort } from '../scripts/lib/e2ePort.ts'
import { freezeAnimations, waitForStableDom } from './helpers/axe'

const FIXED_EPOCH = Date.parse('2026-09-18T03:00:00.000Z')
const FIXTURE_VERSION = 'ux-r2-member-v1'
const BASE_ORIGIN = `http://localhost:${resolveE2ePort(process.env.E2E_PORT).port}`
const THEMES: readonly ThemeName[] = ['dark-blue', 'blue-sky', 'kid']
const CAPTURE_BEFORE = process.env.HOME_CLARITY_EVIDENCE_MODE === 'before'

type FixtureState =
  | 'member-data'
  | 'member-empty'
  | 'member-error'
  | 'member-validation'
  | 'member-insight'
  | 'member-comeback'
  | 'member-data-expanded-prompts'

interface ClsState {
  supported: boolean
  value: number
  entries: Array<{
    value: number
    sources: Array<{
      selector: string
      oldRect: { x: number; y: number; width: number; height: number } | null
      newRect: { x: number; y: number; width: number; height: number } | null
    }>
  }>
}

interface EvidenceEntry {
  commit: string
  state: FixtureState
  theme: ThemeName
  width: number
  pageHeightPx: number
  scrollWidthPx: number
  progressEntryCount: number
  focusableChipCount: number
  fixtureVersion: string
  fixtureHash: string
  screenshotSha256: string
  cls: number
}

declare global {
  interface Window {
    __homeClarityCls?: ClsState
  }
}

const DATA_PROGRESS = [{ lessonId: 'p1-u2-l1', status: 'in_progress' as const, completedAt: null }]

const FIXED_USAGE = [
  {
    date: '2026-09-14',
    chatCount: 0,
    writingCount: 0,
    speakingCount: 0,
    sttCount: 0,
    pronounceCount: 0,
    learnCount: 2,
  },
  {
    date: '2026-09-16',
    chatCount: 1,
    writingCount: 0,
    speakingCount: 0,
    sttCount: 0,
    pronounceCount: 0,
    learnCount: 0,
  },
  {
    date: '2026-09-18',
    chatCount: 0,
    writingCount: 0,
    speakingCount: 0,
    sttCount: 0,
    pronounceCount: 0,
    learnCount: 3,
  },
]

const QUESTS = {
  share: { cooldownDays: 7, rewardDays: 1, canClaim: false },
  streak: { current: 3, required: 7, rewardDays: 1, cooldownDays: 7, canClaim: true },
  cefrExams: [],
  referral: { code: 'UXR2', rewardedCount: 0, pendingCount: 0, maxRewarded: 5, rewardDays: 1 },
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function fixturePayload(state: FixtureState) {
  return {
    fixtureVersion: FIXTURE_VERSION,
    fixedEpoch: FIXED_EPOCH,
    locale: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
    state,
    plan: 'free',
    planExpiresAt: null,
    promoUntil: null,
    firstTask: null,
    banner: null,
    usage: state === 'member-comeback' ? FIXED_USAGE.slice(0, 1) : FIXED_USAGE,
    programmingProgress: state === 'member-empty' ? [] : DATA_PROGRESS,
    learnedWords: state === 'member-comeback' ? ['hello'] : [],
    quests: QUESTS,
  }
}

async function installDeterministicBrowserState(
  page: Page,
  state: FixtureState,
  theme: ThemeName,
): Promise<void> {
  const payload = fixturePayload(state)
  await page.addInitScript(
    ({ epoch, fixture, selectedTheme, userId }) => {
      const NativeDate = Date
      const FixedDate = new Proxy(NativeDate, {
        construct(target, args) {
          return Reflect.construct(target, args.length === 0 ? [epoch] : args)
        },
      })
      Object.defineProperty(FixedDate, 'now', { value: () => epoch })
      globalThis.Date = FixedDate

      Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true })
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem('ui_lang', 'vi')
      localStorage.setItem('ui_theme', selectedTheme)
      localStorage.setItem('et_reward_tip_seen_' + userId, '1')
      localStorage.setItem('dhcb_sync_outbox_v2', '[]')
      localStorage.setItem(
        'dhcb_prog_progress_' + userId,
        JSON.stringify(fixture.programmingProgress),
      )
      localStorage.setItem('et_learned_' + userId, JSON.stringify(fixture.learnedWords))
      for (const usage of fixture.usage) {
        localStorage.setItem(`et_usage_${userId}_${usage.date}`, JSON.stringify(usage))
      }
    },
    {
      epoch: FIXED_EPOCH,
      fixture: payload,
      selectedTheme: theme,
      userId: USER_ID,
    },
  )

  // Cài observer trước lần navigation đầu tiên. Không có fallback tự suy từ ảnh.
  await page.addInitScript(() => {
    const supported =
      typeof PerformanceObserver !== 'undefined' &&
      PerformanceObserver.supportedEntryTypes.includes('layout-shift')
    window.__homeClarityCls = { supported, value: 0, entries: [] }
    if (!supported) return
    const observer = new PerformanceObserver((list) => {
      for (const rawEntry of list.getEntries()) {
        const entry = rawEntry as PerformanceEntry & {
          hadRecentInput?: boolean
          value?: number
        }
        if (!entry.hadRecentInput && typeof entry.value === 'number') {
          window.__homeClarityCls!.value += entry.value
          const sources = (
            entry as PerformanceEntry & {
              sources?: Array<{
                node?: Node
                previousRect?: DOMRectReadOnly
                currentRect?: DOMRectReadOnly
              }>
            }
          ).sources
          window.__homeClarityCls!.entries.push({
            value: entry.value,
            sources: (sources ?? []).map((source) => {
              const node = source.node
              const rect = (value?: DOMRectReadOnly) =>
                value ? { x: value.x, y: value.y, width: value.width, height: value.height } : null
              return {
                selector:
                  node instanceof Element
                    ? `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ''}.${Array.from(node.classList).slice(0, 3).join('.')}`
                    : (node?.nodeName ?? 'unknown'),
                oldRect: rect(source.previousRect),
                newRect: rect(source.currentRect),
              }
            }),
          })
        }
      }
    })
    observer.observe({ type: 'layout-shift', buffered: true })
  })
}

/**
 * Mọi API mà Home dùng đều được route về fixture cục bộ. Catch-all được đăng ký trước để các
 * route cụ thể đăng ký sau có ưu tiên; request API/provider nào lọt qua sẽ bị abort và lưu bằng
 * chứng thay vì âm thầm chạm backend thật.
 */
async function installCanonicalRoutes(
  page: Page,
  state: FixtureState,
): Promise<{ unexpectedRequests: string[] }> {
  const unexpectedRequests: string[] = []
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin === BASE_ORIGIN && !url.pathname.startsWith('/api/')) {
      await route.continue()
      return
    }
    unexpectedRequests.push(`${request.method()} ${request.url()}`)
    await route.abort('blockedbyclient')
  })

  await mockLogin(page, 'vi')

  const fixture = fixturePayload(state)
  await page.route('**/api/history**', (route) =>
    route.fulfill({
      json: { chat: [], writing: [], speaking: [], usage: fixture.usage },
    }),
  )
  await page.route('**/api/progress**', (route) => route.fulfill({ json: { ok: true } }))
  await page.route('**/api/programming/progress**', (route) => {
    if (state === 'member-error') {
      return route.fulfill({ status: 503, json: { error: 'fixture unavailable' } })
    }
    return route.fulfill({ json: { lessons: fixture.programmingProgress } })
  })
  await page.route('**/api/proactive-briefing**', async (route) => {
    // Giữ một pha loading thật để PerformanceObserver đo loading → loaded.
    await new Promise<void>((resolve) => setTimeout(resolve, 120))
    if (state === 'member-error') {
      await route.fulfill({ status: 503, json: { error: 'fixture unavailable' } })
      return
    }
    await route.fulfill({
      json: {
        briefing: {
          id: 'ux-r2-briefing',
          type: 'morning',
          summary: 'Hôm nay mình tiếp tục một bước nhỏ ở bài Lập trình đang học dở.',
          insights:
            state === 'member-insight'
              ? ['Bạn đang giữ nhịp đều; hãy hoàn thành phần đang dở trước.']
              : [],
          suggestions: [],
          generatedAt: '2026-09-18T03:00:00.000Z',
        },
      },
    })
  })
  await page.route('**/api/quests**', (route) => route.fulfill({ json: QUESTS }))
  await page.route('**/api/plan-features**', (route) =>
    route.fulfill({
      json: { catalog: [], flags: {}, updatedAt: '2026-09-18T03:00:00.000Z' },
    }),
  )
  await page.route('**/api/plan-marketing**', (route) =>
    route.fulfill({
      json: {
        plans: {
          free: { plan: 'free', badge: '', taglineVi: '', taglineEn: '', bullets: [] },
          vip: { plan: 'vip', badge: '', taglineVi: '', taglineEn: '', bullets: [] },
        },
        updatedAt: '2026-09-18T03:00:00.000Z',
      },
    }),
  )
  await page.route('**/api/analytics**', (route) => route.fulfill({ json: { ok: true } }))
  await page.route('**/api/intake**', (route) =>
    route.fulfill({
      json: { done: false, chosenTaskId: null, taskDone: false, result: null },
    }),
  )

  return { unexpectedRequests }
}

async function settleHome(
  page: Page,
  caseLabel = 'unspecified',
  enforceCls = true,
): Promise<ClsState> {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Hôm nay' })).toBeVisible()
  await expect(page.locator('[aria-label="Đang tải bản tin"]')).toHaveCount(0)
  await expect(page.locator('[aria-label="Đang tìm việc học hôm nay"]')).toHaveCount(0)
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    await document.fonts.ready
    const images = Array.from(document.images)
    await Promise.all(
      images.map(async (img) => {
        if (img.complete) return
        await img.decode().catch(() => undefined)
      }),
    )
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    )
  })
  await waitForStableDom(page)
  const cls = await page.evaluate(
    () => window.__homeClarityCls ?? { supported: false, value: 0, entries: [] },
  )
  expect(cls.supported, 'Chromium phải hỗ trợ PerformanceObserver layout-shift').toBe(true)
  if (enforceCls) {
    expect(
      cls.value,
      `CLS loading → loaded phải không vượt 0,1; case=${caseLabel}; entries=${JSON.stringify(cls.entries)}`,
    ).toBeLessThanOrEqual(0.1)
  }
  return cls
}

async function assertA11y(page: Page): Promise<void> {
  const aa = await new AxeBuilder({ page })
    .include('main')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(aa.violations.map((violation) => `${violation.id} (${violation.impact})`)).toEqual([])

  const aaa = await new AxeBuilder({ page })
    .include('main')
    .withTags(['wcag2aaa', 'wcag21aaa'])
    .options({ rules: { 'color-contrast-enhanced': { enabled: true } } })
    .analyze()
  const contentViolations = aaa.violations.filter((violation) =>
    violation.nodes.some((node) =>
      /^(h[1-6]|p|li|td|th|blockquote)\b/i.test(node.html.replace('<', '')),
    ),
  )
  expect(
    contentViolations.map(
      (violation) => `${violation.id}: ${violation.nodes.map((node) => node.html).join(' | ')}`,
    ),
  ).toEqual([])
}

async function assertTouchTarget(locator: ReturnType<Page['locator']>): Promise<void> {
  const box = await locator.boundingBox()
  expect(box, 'control phải có bounding box').not.toBeNull()
  expect(box!.width).toBeGreaterThanOrEqual(44)
  expect(box!.height).toBeGreaterThanOrEqual(44)
}

async function createFixturePage(
  browser: Browser,
  state: FixtureState,
  theme: ThemeName,
  width: number,
): Promise<{ page: Page; close: () => Promise<void>; unexpectedRequests: string[] }> {
  const context = await browser.newContext({
    viewport: { width, height: width === 1440 ? 900 : 844 },
    timezoneId: 'Asia/Ho_Chi_Minh',
    locale: 'vi-VN',
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  await installDeterministicBrowserState(page, state, theme)
  const { unexpectedRequests } = await installCanonicalRoutes(page, state)
  return { page, close: () => context.close(), unexpectedRequests }
}

async function captureEvidence(
  page: Page,
  testInfo: TestInfo,
  state: FixtureState,
  theme: ThemeName,
  width: number,
  cls: number,
): Promise<EvidenceEntry> {
  await page.evaluate(() => scrollTo(0, 0))
  await freezeAnimations(page)
  const screenshot = await page.screenshot({ fullPage: true, animations: 'disabled' })
  const name = `${state}-${theme}-${width}`
  await testInfo.attach(`${name}.png`, { body: screenshot, contentType: 'image/png' })

  const measurements = await page.evaluate(() => {
    const mainControls = Array.from(
      document.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>('main button, main a'),
    )
    const promptNames = [
      'Luyện phát âm AI',
      'Giải Toán & STEM',
      '10 thí nghiệm đời sống',
      'Hỏi đáp & ghi nhớ',
    ]
    const chips = mainControls.filter((control) =>
      promptNames.some((name) => control.textContent?.includes(name)),
    )
    const focusableChipCount = chips.filter((chip) => {
      const style = getComputedStyle(chip)
      return (
        !(chip instanceof HTMLButtonElement && chip.disabled) &&
        chip.tabIndex >= 0 &&
        style.display !== 'none' &&
        chip.offsetParent !== null
      )
    }).length
    return {
      pageHeightPx: document.documentElement.scrollHeight,
      scrollWidthPx: document.documentElement.scrollWidth,
      progressEntryCount: mainControls.filter((control) => {
        const text = control.textContent?.trim() ?? ''
        return (
          control.getAttribute('aria-label') === 'Xem bảng tiến độ' ||
          control.getAttribute('href') === '/tien-do' ||
          text === 'Xem tiến độ' ||
          text === 'Tiến độ'
        )
      }).length,
      focusableChipCount,
    }
  })
  if (!CAPTURE_BEFORE) {
    expect(measurements.progressEntryCount, `${name}: Home-owned Tiến độ`).toBe(1)
    expect(measurements.focusableChipCount, `${name}: prompt chip focusable`).toBe(
      width === 1440 || state === 'member-data-expanded-prompts' ? 4 : 0,
    )
  }

  return {
    commit: process.env.HOME_CLARITY_COMMIT ?? process.env.GITHUB_SHA ?? 'local-working-tree',
    state,
    theme,
    width,
    ...measurements,
    fixtureVersion: FIXTURE_VERSION,
    fixtureHash: sha256(JSON.stringify(fixturePayload(state))),
    screenshotSha256: sha256(screenshot),
    cls,
  }
}

test.describe('UX-R2 — canonical Home evidence', () => {
  test('responsive contract, keyboard order, focus resize và zero-network', async ({
    browser,
  }, testInfo) => {
    test.skip(CAPTURE_BEFORE, 'before mode chỉ chụp canonical member-data')
    const fixture = await createFixturePage(browser, 'member-data', 'dark-blue', 390)
    const { page, unexpectedRequests } = fixture
    try {
      const cls = await settleHome(page)
      await testInfo.attach('cls-390-dark-blue.json', {
        body: Buffer.from(JSON.stringify(cls, null, 2)),
        contentType: 'application/json',
      })

      const companion = page.locator('section[aria-label="Bạn Đồng Hành AI chào và đề xuất"]')
      const today = page.locator('section[aria-labelledby="today-card-heading"]')
      expect(
        await companion.evaluate(
          (node, other) =>
            Boolean(node.compareDocumentPosition(other as Node) & Node.DOCUMENT_POSITION_FOLLOWING),
          await today.elementHandle(),
        ),
      ).toBe(true)
      const todayCta = today.getByRole('link').first()
      await expect(todayCta).toHaveAttribute('href', /\/goc-hoc-tap\/programming\/bai-hoc\//)
      await expect(today.locator('ul')).toHaveCount(0)
      const todayBox = await todayCta.boundingBox()
      expect(todayBox).not.toBeNull()
      expect(todayBox!.y + todayBox!.height).toBeLessThanOrEqual(844)

      const promptToggle = page.locator('button[aria-controls="home-prompt-chips"]')
      const promptPanel = page.locator('#home-prompt-chips')
      await expect(promptToggle).toHaveAttribute('aria-expanded', 'false')
      await expect(promptPanel).toBeHidden()
      await expect(page.getByRole('button', { name: /Luyện phát âm AI/ })).toHaveCount(0)
      await assertTouchTarget(promptToggle)

      const subjectToggle = page.locator('button[aria-controls="home-subjects-revealed"]')
      const revealedSubjects = page.locator('#home-subjects-revealed')
      await expect(revealedSubjects).toBeHidden()
      await expect(page.getByRole('button', { name: /^Vào không gian / })).toHaveCount(4)
      await expect(page.getByRole('button', { name: 'Lộ trình CEFR' })).toHaveCount(0)
      await assertTouchTarget(subjectToggle)

      await subjectToggle.click()
      await expect(subjectToggle).toBeFocused()
      const revealedButtons = revealedSubjects.getByRole('button')
      await expect(revealedButtons).toHaveCount(3)
      await page.keyboard.press('Tab')
      await expect(revealedButtons.nth(0)).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(revealedButtons.nth(1)).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(revealedButtons.nth(2)).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(page.getByRole('button', { name: 'Vào không gian Ghi chú' })).toBeFocused()
      await page.keyboard.press('Shift+Tab')
      await expect(revealedButtons.nth(2)).toBeFocused()
      await subjectToggle.click({ force: true })
      await expect(revealedSubjects).toBeHidden()
      await expect(subjectToggle).toBeFocused()

      await promptToggle.click()
      await expect(promptPanel).toBeVisible()
      await expect(promptPanel.getByRole('button')).toHaveCount(4)
      await expect(promptToggle).toBeFocused()
      const requestsAfterSettle: string[] = []
      page.on('request', (request) => requestsAfterSettle.push(request.url()))
      const promptCases = [
        {
          name: /Luyện phát âm AI/,
          query: 'Luyện phát âm với từ vựng',
          destination: 'Luyện nói',
        },
        {
          name: /Giải Toán & STEM/,
          query: 'Tìm cực trị của hàm số bậc 3: y = x^3 - 3x + 2',
          destination: 'Môn Toán',
        },
        {
          name: /10 thí nghiệm đời sống/,
          query: 'Cách tính tiền điện bậc thang EVN và tối ưu công suất',
          destination: 'Ứng dụng thực tế',
        },
        {
          name: /Hỏi đáp & ghi nhớ/,
          query: 'Cách xây dựng Cung điện Trí nhớ (Memory Palace) để học từ vựng',
          destination: 'Bạn Đồng Hành',
        },
      ] as const
      for (const promptCase of promptCases) {
        await promptPanel.getByRole('button', { name: promptCase.name }).click()
        await expect(page.getByLabel('Câu hỏi của bạn')).toHaveValue(promptCase.query)
        const suggestion = page.getByRole('region', { name: 'Gợi ý nơi học' })
        await expect(suggestion).toContainText(promptCase.destination)
        await suggestion.getByRole('button', { name: 'Đóng gợi ý nơi học' }).click()
        await expect(suggestion).toHaveCount(0)
      }
      expect(requestsAfterSettle).toEqual([])

      await page.getByRole('button', { name: 'Ẩn gợi ý nhanh' }).click()
      await expect(promptPanel).toBeHidden()
      await promptToggle.focus()
      await page.setViewportSize({ width: 1440, height: 900 })
      await expect(promptToggle).toHaveCount(0)
      await expect(promptPanel.getByRole('button').first()).toBeFocused()
      await expect(promptPanel.getByRole('button')).toHaveCount(4)
      await expect(page.locator('#home-subjects-revealed')).toHaveCount(0)
      await expect(page.getByRole('button', { name: /^Vào không gian / })).toHaveCount(7)
      await expect(page.getByRole('button', { name: 'Lộ trình CEFR' })).toBeVisible()
      await expect(page.locator('main [aria-label="Xem bảng tiến độ"]')).toHaveCount(1)
      await expect(page.getByText('Xem tiến độ', { exact: true })).toHaveCount(0)

      await page.setViewportSize({ width: 390, height: 844 })
      await expect(page.getByRole('button', { name: 'Xem 4 gợi ý nhanh' })).toBeVisible()
      await expect(promptPanel).toBeHidden()

      // Khi focus ở nơi khác, resize không cưỡng ép focus. Lựa chọn expanded sống qua roundtrip.
      await page.getByRole('button', { name: 'Xem 4 gợi ý nhanh' }).click()
      const questionInput = page.getByLabel('Câu hỏi của bạn')
      await questionInput.focus()
      await page.setViewportSize({ width: 1440, height: 900 })
      await expect(questionInput).toBeFocused()
      await page.setViewportSize({ width: 390, height: 844 })
      await expect(page.getByRole('button', { name: 'Ẩn gợi ý nhanh' })).toBeVisible()
      await expect(promptPanel).toBeVisible()
      await page.getByRole('button', { name: 'Ẩn gợi ý nhanh' }).click()

      // Danh sách môn cũng giữ lựa chọn mở qua mobile → desktop → mobile.
      await subjectToggle.click()
      await questionInput.focus()
      await page.setViewportSize({ width: 1440, height: 900 })
      await expect(questionInput).toBeFocused()
      await page.setViewportSize({ width: 390, height: 844 })
      await expect(page.getByRole('button', { name: 'Thu gọn danh sách môn' })).toBeVisible()
      await expect(revealedSubjects).toBeVisible()
      expect(unexpectedRequests).toEqual([])
    } finally {
      await fixture.close()
    }
  })

  test('empty state giữ CTA 44px cho mọi môn đang render', async ({ browser }) => {
    test.skip(CAPTURE_BEFORE, 'before mode chỉ chụp canonical member-data')
    const fixture = await createFixturePage(browser, 'member-empty', 'dark-blue', 390)
    try {
      await settleHome(fixture.page)
      await expect(fixture.page.getByRole('link', { name: 'Bắt đầu: Chọn môn' })).toBeVisible()
      const visibleCtas = fixture.page.getByRole('button', { name: 'Thử 5 phút' })
      await expect(visibleCtas).toHaveCount(3)
      for (let index = 0; index < 3; index += 1) {
        await assertTouchTarget(visibleCtas.nth(index))
      }
      await fixture.page.locator('button[aria-controls="home-subjects-revealed"]').click()
      await expect(visibleCtas).toHaveCount(6)
      for (let index = 0; index < 6; index += 1) {
        await assertTouchTarget(visibleCtas.nth(index))
      }
      expect(fixture.unexpectedRequests).toEqual([])
    } finally {
      await fixture.close()
    }
  })

  // Ba bề rộng phủ ba bậc sàn comeback mobile (<340 · 340–359 · ≥360); 320px là mức reflow
  // WCAG 1.4.10 — mỗi bậc có số dòng khác nên phải kiểm riêng, không suy từ 390px.
  for (const width of [320, 340, 390] as const) {
    test(`comeback có English evidence giữ CLS dưới 0,1 từ render đầu (${width}px)`, async ({
      browser,
    }, testInfo) => {
      test.skip(CAPTURE_BEFORE, 'before mode chỉ chụp canonical member-data')
      const fixture = await createFixturePage(browser, 'member-comeback', 'dark-blue', width)
      try {
        const cls = await settleHome(fixture.page, `member-comeback-dark-blue-${width}`)
        await expect(fixture.page.getByText(/Đã \d+ ngày rồi/).first()).toBeVisible()
        await testInfo.attach(`cls-comeback-${width}-dark-blue.json`, {
          body: Buffer.from(JSON.stringify(cls, null, 2)),
          contentType: 'application/json',
        })
        expect(fixture.unexpectedRequests).toEqual([])
      } finally {
        await fixture.close()
      }
    })
  }

  test('desktop giữ đúng đích của 3 shortcut Tiếng Anh và shortcut Ghi chú', async ({
    browser,
  }) => {
    test.skip(CAPTURE_BEFORE, 'before mode chỉ chụp canonical member-data')
    const fixture = await createFixturePage(browser, 'member-data', 'dark-blue', 1440)
    try {
      await settleHome(fixture.page)
      const shortcuts = [
        { name: 'Lộ trình CEFR', path: '/goc-hoc-tap/english/lo-trinh' },
        { name: 'Luyện nói', path: '/goc-hoc-tap/english/luyen-noi' },
        { name: 'Từ điển', path: '/goc-hoc-tap/english/tu-dien' },
        // [2026-09-20] Thẻ "Sự nghiệp, Khởi nghiệp & Đời sống" thay bằng thẻ "Ghi chú".
        { name: 'Bảng Kanban', path: '/ghi-chu/kanban' },
      ] as const

      for (const shortcut of shortcuts) {
        await fixture.page.getByRole('button', { name: shortcut.name, exact: true }).click()
        await expect(fixture.page).toHaveURL(new URL(shortcut.path, BASE_ORIGIN).toString())
        await fixture.page.goto('/')
        await expect(
          fixture.page.getByRole('button', { name: shortcut.name, exact: true }),
        ).toBeVisible()
      }
    } finally {
      await fixture.close()
    }
  })

  test('attach canonical screenshots và manifest', async ({ browser }, testInfo) => {
    test.setTimeout(8 * 60_000)
    const cases: Array<{ state: FixtureState; width: number }> = CAPTURE_BEFORE
      ? [320, 390, 1440].map((width) => ({ state: 'member-data' as const, width }))
      : [
          ...[320, 390, 1440].map((width) => ({ state: 'member-data' as const, width })),
          { state: 'member-empty', width: 390 },
          { state: 'member-error', width: 390 },
          { state: 'member-validation', width: 390 },
          { state: 'member-insight', width: 390 },
          { state: 'member-insight', width: 1440 },
          { state: 'member-comeback', width: 390 },
          { state: 'member-comeback', width: 1440 },
          { state: 'member-data-expanded-prompts', width: 390 },
        ]
    const manifest: EvidenceEntry[] = []

    for (const { state, width } of cases) {
      for (const theme of THEMES) {
        const fixture = await createFixturePage(browser, state, theme, width)
        try {
          const cls = await settleHome(fixture.page, `${state}-${theme}-${width}`, !CAPTURE_BEFORE)
          if (state === 'member-validation') {
            await fixture.page.getByLabel('Câu hỏi của bạn').fill('a'.repeat(2001))
            await fixture.page.getByLabel('Tìm nơi học cho câu hỏi này').click()
            await expect(fixture.page.getByRole('alert')).toContainText('vượt giới hạn')
          }
          if (state === 'member-data-expanded-prompts') {
            await fixture.page.locator('button[aria-controls="home-prompt-chips"]').click()
            await expect(fixture.page.locator('#home-prompt-chips')).toBeVisible()
          }
          if (state === 'member-error') {
            await expect(fixture.page.getByText('Chưa tải được tiến độ')).toBeVisible()
            await expect(fixture.page.getByRole('button', { name: 'Thử lại' })).toBeVisible()
          }
          if (state === 'member-comeback') {
            await expect(fixture.page.getByText(/Đã \d+ ngày rồi/).first()).toBeVisible()
          }

          if (!CAPTURE_BEFORE && state === 'member-data' && (width === 320 || width === 390)) {
            const dimensions = await fixture.page.evaluate(() => ({
              height: document.documentElement.scrollHeight,
              width: document.documentElement.scrollWidth,
              innerWidth,
            }))
            expect(dimensions.width).toBe(dimensions.innerWidth)
            expect(dimensions.height).toBeLessThanOrEqual(width === 320 ? 1850 : 1700)
          }
          if (!CAPTURE_BEFORE && state === 'member-data' && width === 1440) {
            expect(
              await fixture.page.evaluate(() => document.documentElement.scrollHeight),
            ).toBeLessThanOrEqual(1459)
          }

          if (
            !CAPTURE_BEFORE &&
            width === 390 &&
            (state === 'member-data' || state === 'member-data-expanded-prompts')
          ) {
            await freezeAnimations(fixture.page)
            await assertA11y(fixture.page)
          }

          manifest.push(
            await captureEvidence(fixture.page, testInfo, state, theme, width, cls.value),
          )
          expect(fixture.unexpectedRequests).toEqual([])
        } finally {
          await fixture.close()
        }
      }
    }

    await testInfo.attach(CAPTURE_BEFORE ? 'manifest-before.json' : 'manifest-after.json', {
      body: Buffer.from(JSON.stringify(manifest, null, 2)),
      contentType: 'application/json',
    })
    expect(manifest).toHaveLength(CAPTURE_BEFORE ? 9 : 33)
  })
})
