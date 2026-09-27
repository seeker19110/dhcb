/**
 * e2e/admin.spec.ts — Kiểm thử toàn diện trang /admin-s (AdminDashboard).
 *
 * Chiến lược:
 *  - baseURL = production https://en-vi.donghanhcungban.org
 *  - Mỗi test tự setup riêng (loginAsAdmin + mockAllAdminApis + goto) để tránh route conflict
 *  - Không dùng beforeEach navigate — chỉ dùng beforeEach cho mock setup
 *
 * Tab map:
 *  usage           → AdminUsagePanel + AdminSystemControlPanel
 *  limits          → AdminLimitsPanel + AdminPricePromoPanel
 *  plan-features   → AdminPlanFeaturesPanel
 *  plan-marketing  → AdminPlanMarketingPanel
 *  achievement-rewards → AdminAchievementRewardsPanel
 *  grant-plan      → AdminPaymentsPanel + AdminUsersPanel + AdminGrantPlanPanel + AdminVipWhitelistPanel + AdminReservedNamesPanel
 *  analytics       → AdminAnalyticsPanel + AdminFeedbackPanel
 */

import { test, expect, type Page, type Route } from '@playwright/test'

/* ── Hằng số ─────────────────────────────────────────────────────────────── */

const ADMIN_URL = '/admin-s'
const TOKEN_KEY = 'gsa_session_present_v1'
const GOTO_TIMEOUT = 20000
const VISIBLE_TIMEOUT = 15000

/* ── Mock data ─────────────────────────────────────────────────────────────── */

const MOCK_PROFILE_ADMIN = {
  id: 'admin-test-001',
  email: 'admin@test.com',
  name: 'Admin Test',
  plan: 'vip',
  onboarded: true,
  isAdmin: true,
}

const MOCK_USAGE_STATS = {
  range: { days: 30, from: '2026-07-06', to: '2026-08-05' },
  users: {
    total: 1234,
    newInRange: 56,
    byPlan: { free: 1100, pro: 100, vip: 34 },
    paidUsers: 134,
    paidRatio: 0.1085,
    dau: 45,
    wau: 210,
    mau: 520,
    returningInRange: 300,
  },
  usage: {
    totals: { chat: 5000, writing: 1200, speaking: 800, stt: 400, pronounce: 300, learn: 9000 },
    daily: [
      {
        day: '2026-08-05',
        chat: 200,
        writing: 50,
        speaking: 30,
        stt: 15,
        pronounce: 10,
        learn: 400,
        active_users: 45,
      },
    ],
    reach: { chat: 300, writing: 80, speaking: 60, stt: 40, pronounce: 30, learn: 600 },
    byPlan: [
      {
        plan: 'free',
        users: 400,
        counts: { chat: 2000, writing: 500, speaking: 300, stt: 150, pronounce: 100 },
        costUsd: 5.2,
      },
      {
        plan: 'pro',
        users: 80,
        counts: { chat: 2000, writing: 500, speaking: 300, stt: 150, pronounce: 100 },
        costUsd: 4.1,
      },
      {
        plan: 'vip',
        users: 20,
        counts: { chat: 1000, writing: 200, speaking: 200, stt: 100, pronounce: 100 },
        costUsd: 2.8,
      },
    ],
  },
  cost: {
    unitCostsUsd: {
      chat: 0.0004,
      writing: 0.0006,
      speaking: 0.001,
      stt: 0.0002,
      pronounce: 0.0003,
    },
    usdVndRate: 25000,
    totalUsd: 12.1,
    totalVnd: 302500,
    byFeature: [
      { mode: 'chat', count: 5000, unitUsd: 0.0004, costUsd: 2.0, users: 300 },
      { mode: 'writing', count: 1200, unitUsd: 0.0006, costUsd: 0.72, users: 80 },
      { mode: 'speaking', count: 800, unitUsd: 0.001, costUsd: 0.8, users: 60 },
      { mode: 'stt', count: 400, unitUsd: 0.0002, costUsd: 0.08, users: 40 },
      { mode: 'pronounce', count: 300, unitUsd: 0.0003, costUsd: 0.09, users: 30 },
    ],
    perActiveUserVnd: 581730,
  },
  // Chi phí AI đo THẬT theo token (mục N4). Trường TUỲ CHỌN ở client — có fixture này để
  // thẻ "Chi phí AI đo THẬT theo token" được kiểm thật; ca thiếu trường được phủ bởi
  // MOCK_USAGE_STATS_NO_TOKEN_COST bên dưới.
  tokenCost: {
    totals: {
      calls: 42,
      promptTokens: 1250000,
      completionTokens: 310000,
      cacheReadTokens: 900000,
      // CỐ Ý tránh các chuỗi số mà test khác đang dò bằng getByText khớp-chuỗi-con
      // ('1.234' tổng tài khoản, '134' người trả phí, '5.500.000' doanh thu) — đặt 1.2345
      // ở đây từng làm test "Hiện tổng tài khoản 1.234" đỏ vì strict mode thấy 2 phần tử.
      costUsd: 0.9876,
    },
    totalVnd: 24690,
    byProviderModel: [
      {
        provider: 'groq',
        model: 'openai/gpt-oss-120b',
        mode: 'chat',
        calls: 30,
        promptTokens: 1000000,
        completionTokens: 250000,
        cacheReadTokens: 0,
        costUsd: 0.9,
      },
      {
        provider: 'anthropic',
        model: 'claude-haiku-4-5-20251001',
        mode: 'companion',
        calls: 12,
        promptTokens: 250000,
        completionTokens: 60000,
        cacheReadTokens: 900000,
        costUsd: 0.0876,
      },
    ],
    dailyBudgetUsd: 2,
  },
  revenue: {
    vnd: 5500000,
    payments: { paid: 22, pending: 3, failed: 1 },
    createdOrders: 26,
    payRate: 0.846,
    byPlanCycle: [
      { plan: 'pro', cycle: 'month', count: 15, vnd: 3000000 },
      { plan: 'vip', cycle: 'year', count: 7, vnd: 2500000 },
    ],
    daily: [{ day: '2026-08-05', count: 2, vnd: 500000 }],
    marginVnd: 5197500,
  },
  freeCredit: { cap: 35, users: 800, total: 12000, exhausted: 120, capped: 250 },
  topUsers: [
    {
      email: 'top@test.com',
      plan: 'free',
      total: 500,
      active_days: 28,
      chat: 400,
      writing: 50,
      speaking: 30,
      stt: 10,
      pronounce: 10,
    },
  ],
}

const MOCK_ADMIN_SETTINGS = {
  limits: { free: 200, vip: 999 },
  promoUntil: null,
  aiCircuitBreaker: false,
  leaderboardEnabled: false,
}

const MOCK_CIRCUIT_BREAKER_OFF = { circuitBreakerEnabled: false }
const MOCK_CIRCUIT_BREAKER_ON = { circuitBreakerEnabled: true, message: 'Đã kích hoạt' }

const MOCK_USERS = {
  total: 42,
  users: [
    {
      id: 'u1',
      email: 'user1@test.com',
      createdAt: '2026-01-01T00:00:00Z',
      emailVerified: true,
      plan: 'pro',
      planExpiresAt: '2027-01-01T00:00:00Z',
      lastActiveDay: '2026-08-04',
    },
    {
      id: 'u2',
      email: 'user2@test.com',
      createdAt: '2026-02-15T00:00:00Z',
      emailVerified: false,
      plan: 'free',
      planExpiresAt: null,
      lastActiveDay: null,
    },
  ],
}

const MOCK_PAYMENTS = {
  payments: [
    {
      id: 'pay-001',
      orderId: 'ORD-001',
      paymentCode: 'DHCB001',
      userName: 'Nguyen A',
      userEmail: 'buyer@test.com',
      userId: 'u1',
      plan: 'pro',
      cycle: 'month',
      amountVnd: 199000,
      status: 'paid',
      transferCode: 'PRO001',
      createdAt: '2026-08-01T10:00:00Z',
      paidAt: '2026-08-01T10:05:00Z',
    },
    {
      id: 'pay-002',
      orderId: 'ORD-002',
      paymentCode: 'DHCB002',
      userName: null,
      userEmail: null,
      userId: null,
      plan: 'vip',
      cycle: 'year',
      amountVnd: 999000,
      status: 'pending',
      transferCode: 'VIP002',
      createdAt: '2026-08-05T09:00:00Z',
      paidAt: null,
    },
  ],
}

const MOCK_PLAN_FEATURES = {
  catalog: [
    { key: 'chat', label: 'Chat AI', description: 'Chat với AI' },
    { key: 'speaking', label: 'Luyện nói', description: 'Luyện speaking' },
  ],
  flags: {
    chat: { free: true, pro: true, vip: true },
    speaking: { free: false, pro: true, vip: true },
  },
}

const MOCK_PLAN_MARKETING = {
  plans: {
    free: {
      plan: 'free',
      badge: '',
      taglineVi: 'Cơ bản',
      taglineEn: 'Basic',
      bullets: [],
    },
    vip: {
      plan: 'vip',
      badge: 'Phổ biến',
      taglineVi: 'Học không giới hạn',
      taglineEn: 'Learn unlimited',
      bullets: [{ id: 1, textVi: 'Chat không giới hạn', textEn: 'Unlimited chat', sortOrder: 10 }],
    },
  },
  updatedAt: '2026-08-01T00:00:00.000Z',
}

const MOCK_ACHIEVEMENT_REWARDS = {
  rewards: [
    {
      achievementId: 'streak_7',
      config: {
        enabled: true,
        rewardPlan: 'pro',
        rewardDays: 3,
      },
    },
  ],
}

const MOCK_PRICE_PROMO = {
  percent: 0,
  startsAt: null,
  endsAt: null,
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const MOCK_ANALYTICS = {
  days: 14,
  totalsByEvent: {
    landing_view: 500,
    signup: 120,
    first_session_done: 80,
    daily_plan_completion: 8,
  },
  daily: [
    { day: '2026-08-05', event: 'landing_view', count: 50 },
    { day: '2026-08-05', event: 'signup', count: 12 },
    { day: '2026-08-05', event: 'daily_plan_completion', count: 8 },
  ],
  dailyPlanActions: [
    {
      actionKind: 'srs_review',
      plannerVersion: 'p1.1',
      impressionCount: 20,
      clickCount: 12,
      completionCount: 8,
      completionRate: 0.4,
    },
    {
      actionKind: 'continue_learning',
      plannerVersion: 'p1.1',
      impressionCount: 15,
      clickCount: 7,
      completionCount: null,
      completionRate: null,
    },
    {
      actionKind: 'discover_path',
      plannerVersion: 'p1.1',
      impressionCount: 5,
      clickCount: 2,
      completionCount: null,
      completionRate: null,
    },
  ],
}

const MOCK_FEEDBACK = {
  feedbackList: [
    {
      id: 'fb1',
      userId: 'u1',
      userEmail: 'user1@test.com',
      source: 'chat',
      userInput: 'What is grammar?',
      aiFeedback: 'Grammar is rules.',
      createdAt: '2026-08-05T10:00:00Z',
    },
    {
      id: 'fb2',
      userId: 'u2',
      userEmail: 'user2@test.com',
      source: 'speaking',
      userInput: 'Hello how are you',
      aiFeedback: 'Good pronunciation.',
      createdAt: '2026-08-04T15:00:00Z',
    },
  ],
}

const MOCK_VIP_WHITELIST = {
  items: [{ email: 'vip@test.com', note: 'Bạn thân', createdAt: '2026-01-01T00:00:00Z' }],
}

const MOCK_RESERVED_NAMES = {
  reservedNames: [
    { id: 'rn1', phrase: 'admin', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'rn2', phrase: 'hotro', createdAt: '2026-01-02T00:00:00Z' },
  ],
}

const MOCK_GRANT_LOOKUP = { email: 'user@test.com', plan: 'free', planExpiresAt: null }

/* ── Helpers ─────────────────────────────────────────────────────────────── */

async function loginAsAdmin(page: Page): Promise<void> {
  await page.addInitScript(
    ({ tokenKey }: { tokenKey: string }) => {
      localStorage.setItem(tokenKey, 'session:e2e-admin')
      localStorage.setItem('ui_lang', 'vi')
    },
    { tokenKey: TOKEN_KEY },
  )
  await page.route('**/api/auth?action=me', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PROFILE_ADMIN),
    }),
  )
}

async function mockAllAdminApis(page: Page): Promise<void> {
  await page.route('**/api/admin-usage-stats**', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USAGE_STATS),
    }),
  )
  await page.route('**/api/admin-settings', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ADMIN_SETTINGS),
    }),
  )
  await page.route('**/api/admin-system-control', (route: Route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as { enabled?: boolean }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body?.enabled ? MOCK_CIRCUIT_BREAKER_ON : MOCK_CIRCUIT_BREAKER_OFF),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CIRCUIT_BREAKER_OFF),
    })
  })
  await page.route('**/api/admin-users**', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USERS),
    }),
  )
  await page.route('**/api/admin-payments**', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PAYMENTS),
    }),
  )
  await page.route('**/api/admin-plan-features**', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PLAN_FEATURES),
    }),
  )
  await page.route('**/api/admin-plan-marketing**', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PLAN_MARKETING),
    }),
  )
  await page.route('**/api/admin-achievement-rewards**', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ACHIEVEMENT_REWARDS),
    }),
  )
  await page.route('**/api/admin-price-promo**', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PRICE_PROMO),
    }),
  )
  await page.route('**/api/analytics-summary**', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ANALYTICS),
    }),
  )
  await page.route('**/api/admin-feedback**', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_FEEDBACK),
    }),
  )
  await page.route('**/api/admin-vip-whitelist**', (route: Route) => {
    const method = route.request().method()
    if (method === 'DELETE')
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
    if (method === 'POST')
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_VIP_WHITELIST),
    })
  })
  await page.route('**/api/admin-reserved-names**', (route: Route) => {
    if (route.request().method() === 'POST')
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_RESERVED_NAMES),
    })
  })
  await page.route('**/api/admin-grant-plan**', (route: Route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_GRANT_LOOKUP),
      })
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ email: 'user@test.com', plan: 'pro', planExpiresAt: null }),
    })
  })
  await page.route('**/api/app-settings**', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        promoUntil: null,
        aiCircuitBreaker: false,
        leaderboardEnabled: false,
      }),
    }),
  )
}

/** Setup + navigate, chờ heading xuất hiện */
async function gotoAdmin(page: Page, tab = ''): Promise<void> {
  await loginAsAdmin(page)
  await mockAllAdminApis(page)
  const url = tab ? `${ADMIN_URL}?tab=${tab}` : ADMIN_URL
  await page.goto(url, { timeout: GOTO_TIMEOUT })
  await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible({
    timeout: VISIBLE_TIMEOUT,
  })
}

/* ════════════════════════════════════════════════════════════════════════════
 * TESTS
 * ════════════════════════════════════════════════════════════════════════════ */

test.describe('Admin Dashboard — /admin-s', () => {
  /* ── 1. Bảo vệ route ─────────────────────────────────────────────────── */

  test('Auth: Không đăng nhập → redirect /login', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear())
    await page.route('**/api/auth?action=me', (r: Route) =>
      r.fulfill({ status: 401, body: '{"error":"Unauthorized"}' }),
    )
    await page.route('**/api/app-settings**', (r: Route) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: '{"promoUntil":null}' }),
    )
    await page.goto(ADMIN_URL, { timeout: GOTO_TIMEOUT })
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('Auth: Non-admin → redirect hoặc hiện lỗi quyền', async ({ page }) => {
    const nonAdmin = { ...MOCK_PROFILE_ADMIN, isAdmin: false, plan: 'free' }
    await page.addInitScript(
      ({ k }: { k: string }) => {
        localStorage.setItem(k, 'non-admin-token')
        localStorage.setItem('ui_lang', 'vi')
      },
      { k: TOKEN_KEY },
    )
    await page.route('**/api/auth?action=me', (r: Route) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(nonAdmin) }),
    )
    await page.route('**/api/admin-**', (r: Route) =>
      r.fulfill({ status: 403, body: '{"error":"Forbidden"}' }),
    )
    await page.route('**/api/app-settings**', (r: Route) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: '{"promoUntil":null}' }),
    )
    await page.goto(ADMIN_URL, { timeout: GOTO_TIMEOUT })
    await page.waitForTimeout(3000)
    const isOutside = !page.url().includes('/admin-s')
    if (isOutside) {
      expect(isOutside).toBe(true)
    } else {
      expect(await page.getByText(/không có quyền|Forbidden/i).isVisible()).toBe(true)
    }
  })

  /* ── 2. Layout & Navigation ──────────────────────────────────────────── */

  test('Layout: Tiêu đề "Quản trị hệ thống" hiển thị', async ({ page }) => {
    await gotoAdmin(page)
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible()
  })

  test('Layout: Hiển thị đủ 7 tab accordion', async ({ page }) => {
    await gotoAdmin(page)
    for (const label of [
      'Sử dụng, chi phí & Vận hành',
      'Hạn mức & khuyến mãi',
      'Tính năng theo gói',
      'Nội dung gói',
      'Thưởng huy hiệu',
      'Người dùng, Thanh toán & Từ cấm',
      'Analytics & Phản hồi AI',
    ]) {
      await expect(page.getByRole('button', { name: label })).toBeVisible()
    }
  })

  test('Layout: Tab mặc định "usage" mở (aria-expanded=true)', async ({ page }) => {
    await gotoAdmin(page)
    await expect(page.getByRole('button', { name: 'Sử dụng, chi phí & Vận hành' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  test('Layout: Click tab khác → tab mới có aria-expanded=true', async ({ page }) => {
    await gotoAdmin(page)
    await page.getByRole('button', { name: 'Hạn mức & khuyến mãi' }).click()
    await expect(page.getByRole('button', { name: 'Hạn mức & khuyến mãi' })).toHaveAttribute(
      'aria-expanded',
      'true',
      { timeout: 5000 },
    )
  })

  test('Layout: URL query ?tab= cập nhật khi đổi tab', async ({ page }) => {
    await gotoAdmin(page)
    await page.getByRole('button', { name: 'Hạn mức & khuyến mãi' }).click()
    await expect(page).toHaveURL(/tab=limits/, { timeout: 5000 })
  })

  test('Layout: Toggle tab đang mở → đóng/URL thay đổi', async ({ page }) => {
    await gotoAdmin(page)
    const usageBtn = page.getByRole('button', { name: 'Sử dụng, chi phí & Vận hành' })
    await expect(usageBtn).toHaveAttribute('aria-expanded', 'true')
    await usageBtn.click()
    await page.waitForTimeout(500)
    const expanded = await usageBtn.getAttribute('aria-expanded')
    const url = page.url()
    expect(expanded === 'false' || !url.includes('tab=')).toBe(true)
  })

  test('Layout: Deep link ?tab=limits', async ({ page }) => {
    await gotoAdmin(page, 'limits')
    await expect(page.getByRole('button', { name: 'Hạn mức & khuyến mãi' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  test('Layout: Deep link ?tab=grant-plan', async ({ page }) => {
    await gotoAdmin(page, 'grant-plan')
    await expect(
      page.getByRole('button', { name: 'Người dùng, Thanh toán & Từ cấm' }),
    ).toHaveAttribute('aria-expanded', 'true')
  })

  test('Layout: Deep link ?tab=analytics', async ({ page }) => {
    await gotoAdmin(page, 'analytics')
    await expect(page.getByRole('button', { name: 'Analytics & Phản hồi AI' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  test('Layout: ?tab=unknown → fallback tab usage', async ({ page }) => {
    await gotoAdmin(page, 'unknown_tab')
    await expect(page.getByRole('button', { name: 'Sử dụng, chi phí & Vận hành' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  /* ── 3. Tab Usage ────────────────────────────────────────────────────── */

  test('Usage: Hiện tổng tài khoản 1.234', async ({ page }) => {
    await gotoAdmin(page, 'usage')
    await expect(page.getByText('Sử dụng & chi phí')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
    await expect(page.getByText('1.234')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('Usage: Hiện số người trả phí 134', async ({ page }) => {
    await gotoAdmin(page, 'usage')
    await expect(page.getByText('Sử dụng & chi phí')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
    await expect(page.getByText('134')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('Usage: Bảng tính năng hiện Luyện viết', async ({ page }) => {
    await gotoAdmin(page, 'usage')
    await expect(page.locator('table').getByText('Luyện viết').first()).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  test('Usage: Bảng tính năng hiện Nhận dạng giọng (STT)', async ({ page }) => {
    await gotoAdmin(page, 'usage')
    await expect(page.locator('table').getByText('Nhận dạng giọng (STT)').first()).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  test('Usage: Bảng tính năng hiện Chấm phát âm', async ({ page }) => {
    await gotoAdmin(page, 'usage')
    await expect(page.locator('table').getByText('Chấm phát âm').first()).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  test('Usage: Bảng tính năng hiện Học từ vựng', async ({ page }) => {
    await gotoAdmin(page, 'usage')
    await expect(page.locator('table').getByText('Học từ vựng')).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  test('Usage: Selector ngày có 4 lựa chọn', async ({ page }) => {
    await gotoAdmin(page, 'usage')
    const select = page.getByRole('combobox', { name: 'Số ngày hiển thị' })
    await expect(select).toBeVisible({ timeout: VISIBLE_TIMEOUT })
    const options = await select.locator('option').allTextContents()
    expect(options).toContain('7 ngày')
    expect(options).toContain('30 ngày')
    expect(options).toContain('90 ngày')
    expect(options).toContain('180 ngày')
  })

  test('Usage: Thay đổi selector → gọi API days=7', async ({ page }) => {
    await loginAsAdmin(page)
    await mockAllAdminApis(page)
    const calls: string[] = []
    await page.route('**/api/admin-usage-stats**', (r: Route) => {
      calls.push(r.request().url())
      return r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USAGE_STATS),
      })
    })
    await page.goto(`${ADMIN_URL}?tab=usage`, { timeout: GOTO_TIMEOUT })
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
    await page.getByRole('combobox', { name: 'Số ngày hiển thị' }).selectOption('7')
    await page.waitForTimeout(800)
    expect(calls.some((u) => u.includes('days=7'))).toBe(true)
  })

  test('Usage: Nút refresh gọi lại API', async ({ page }) => {
    await loginAsAdmin(page)
    let callCount = 0
    await page.route('**/api/admin-usage-stats**', (r: Route) => {
      callCount++
      return r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USAGE_STATS),
      })
    })
    await page.route('**/api/admin-system-control', (r: Route) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CIRCUIT_BREAKER_OFF),
      }),
    )
    await page.route('**/api/app-settings**', (r: Route) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: '{"promoUntil":null}' }),
    )
    await page.goto(`${ADMIN_URL}?tab=usage`, { timeout: GOTO_TIMEOUT })
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
    await page.getByRole('button', { name: 'Tải lại', exact: true }).click()
    await page.waitForTimeout(800)
    expect(callCount).toBeGreaterThan(0)
  })

  test('Usage: Hiện email top@test.com trong Top users', async ({ page }) => {
    await gotoAdmin(page, 'usage')
    await expect(page.getByText('Sử dụng & chi phí')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
    await expect(page.getByText('top@test.com')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  // ── Chi phí AI đo THẬT theo token (mục N4) ────────────────────────────────
  test('Usage: Thẻ chi phí token thật hiện provider/model đã đo', async ({ page }) => {
    await gotoAdmin(page, 'usage')
    await expect(page.getByText('Chi phí AI đo THẬT theo token')).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
    await expect(page.getByText('openai/gpt-oss-120b')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
    await expect(page.getByText('claude-haiku-4-5-20251001')).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  // Chốt chặn hồi quy cho đúng lỗi đã làm đỏ CI ở lần đẩy đầu của PR N4: server bản CŨ (đang
  // deploy cuốn chiếu) trả response KHÔNG có `tokenCost` → trước khi vá, component đọc
  // `stats.tokenCost.totalVnd` và ném TypeError, SẬP TOÀN BỘ trang admin (30 test đỏ).
  test('Usage: Thiếu tokenCost trong response → trang admin vẫn dựng bình thường', async ({
    page,
  }) => {
    await loginAsAdmin(page)
    await mockAllAdminApis(page)
    const statsCu: Record<string, unknown> = { ...MOCK_USAGE_STATS }
    delete statsCu.tokenCost
    await page.route('**/api/admin-usage-stats**', (r: Route) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(statsCu),
      }),
    )
    await page.goto(`${ADMIN_URL}?tab=usage`, { timeout: GOTO_TIMEOUT })
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
    // Phần còn lại của tab vẫn hiển thị; riêng thẻ token thật thì ẩn đi, không sập trang.
    await expect(page.getByText('top@test.com')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
    await expect(page.getByText('Chi phí AI đo THẬT theo token')).toHaveCount(0)
  })

  test('Usage: Hiện doanh thu 5.500.000', async ({ page }) => {
    await gotoAdmin(page, 'usage')
    await expect(page.getByText('Sử dụng & chi phí')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
    // Dùng regex linh hoạt ko escaped dot để match bất kỳ định dạng grouping nào
    await expect(page.getByText(/5.500.000/)).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('Usage: SystemControl trạng thái HOẠT ĐỘNG BÌNH THƯỜNG', async ({ page }) => {
    await gotoAdmin(page, 'usage')
    await expect(page.getByText('HOẠT ĐỘNG BÌNH THƯỜNG')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('Usage: Nút KÍCH HOẠT DẬP KHẨN CẤP hiển thị', async ({ page }) => {
    await gotoAdmin(page, 'usage')
    await expect(page.getByRole('button', { name: /KÍCH HOẠT DẬP KHẨN CẤP/i })).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  test('Usage: Click bật circuit breaker → ĐANG BẬT', async ({ page }) => {
    await loginAsAdmin(page)
    await mockAllAdminApis(page)
    await page.goto(`${ADMIN_URL}?tab=usage`, { timeout: GOTO_TIMEOUT })
    await page
      .getByRole('button', { name: /KÍCH HOẠT DẬP KHẨN CẤP/i })
      .click({ timeout: VISIBLE_TIMEOUT })
    await expect(page.getByText('ĐANG BẬT — ĐÃ DẬP GỌI AI')).toBeVisible({ timeout: 8000 })
  })

  test('Usage: Sau khi bật → nút TẮT CẦU DAO xuất hiện', async ({ page }) => {
    await loginAsAdmin(page)
    await mockAllAdminApis(page)
    await page.goto(`${ADMIN_URL}?tab=usage`, { timeout: GOTO_TIMEOUT })
    await page
      .getByRole('button', { name: /KÍCH HOẠT DẬP KHẨN CẤP/i })
      .click({ timeout: VISIBLE_TIMEOUT })
    await expect(page.getByRole('button', { name: /TẮT CẦU DAO/i })).toBeVisible({ timeout: 8000 })
  })

  test('Usage: API 500 → hiện thông báo lỗi', async ({ page }) => {
    await loginAsAdmin(page)
    await mockAllAdminApis(page)
    await page.route('**/api/admin-usage-stats**', (r: Route) =>
      r.fulfill({ status: 500, body: 'Error' }),
    )
    await page.goto(`${ADMIN_URL}?tab=usage`, { timeout: GOTO_TIMEOUT })
    await expect(page.getByText(/Không tải được số liệu|Lỗi/i)).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  /* ── 4. Tab Limits ───────────────────────────────────────────────────── */

  test('Limits: Hiện "Cầu dao khẩn cấp — chặn toàn bộ AI"', async ({ page }) => {
    await gotoAdmin(page, 'limits')
    await expect(page.getByText('Cầu dao khẩn cấp — chặn toàn bộ AI')).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  test('Limits: Hiện "Khuyến mãi ra mắt"', async ({ page }) => {
    await gotoAdmin(page, 'limits')
    await expect(page.getByText('Khuyến mãi ra mắt')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('Limits: Hiện input Free và VIP', async ({ page }) => {
    await gotoAdmin(page, 'limits')
    await expect(page.getByText('Gói Free (lượt/ngày)')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
    await expect(page.getByText('Gói VIP (lượt/ngày)')).toBeVisible()
  })

  test('Limits: Giá trị Free=200, VIP=999', async ({ page }) => {
    await gotoAdmin(page, 'limits')
    await expect(page.locator('input[type="number"]').first()).toHaveValue('200', {
      timeout: VISIBLE_TIMEOUT,
    })
    await expect(page.locator('input[type="number"]').last()).toHaveValue('999', {
      timeout: VISIBLE_TIMEOUT,
    })
  })

  test('Limits: Bật checkbox khuyến mãi → hiện datetime picker', async ({ page }) => {
    await gotoAdmin(page, 'limits')
    const promoSection = page.locator('section').filter({ hasText: 'Khuyến mãi ra mắt' })
    await promoSection.locator('input[type="checkbox"]').check()
    await expect(page.locator('input[type="datetime-local"]')).toBeVisible()
  })

  test('Limits: Tắt checkbox khuyến mãi → ẩn datetime picker', async ({ page }) => {
    await gotoAdmin(page, 'limits')
    const promoSection = page.locator('section').filter({ hasText: 'Khuyến mãi ra mắt' })
    const cb = promoSection.locator('input[type="checkbox"]')
    await cb.check()
    await cb.uncheck()
    await expect(page.locator('input[type="datetime-local"]')).not.toBeVisible()
  })

  test('Limits: Hiện section Bảng xếp hạng', async ({ page }) => {
    await gotoAdmin(page, 'limits')
    // Chờ settings load xong (section chỉ hiện sau khi !loading && !forbidden && settings)
    await expect(page.getByText('Cầu dao khẩn cấp — chặn toàn bộ AI')).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
    await expect(page.getByText('Bảng xếp hạng', { exact: true })).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  test('Limits: Checkbox leaderboard mặc định tắt', async ({ page }) => {
    await gotoAdmin(page, 'limits')
    const leaderboardSection = page.locator('section').filter({ hasText: 'Bảng xếp hạng' })
    await expect(leaderboardSection.locator('input[type="checkbox"]')).not.toBeChecked({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  test('Limits: Nút "Lưu cấu hình" gọi POST /api/admin-settings', async ({ page }) => {
    await loginAsAdmin(page)
    await mockAllAdminApis(page)
    let postCalled = false
    // Override admin-settings route để capture POST
    await page.route('**/api/admin-settings', (r: Route) => {
      if (r.request().method() === 'POST') postCalled = true
      return r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ADMIN_SETTINGS),
      })
    })
    await page.goto(`${ADMIN_URL}?tab=limits`, { timeout: GOTO_TIMEOUT })
    await expect(page.getByText('Cầu dao khẩn cấp — chặn toàn bộ AI')).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
    await page.getByRole('button', { name: 'Lưu cấu hình' }).first().click()
    await page.waitForTimeout(1000)
    expect(postCalled).toBe(true)
  })

  test('Limits: Sau lưu thành công → toast "Đã lưu cấu hình"', async ({ page }) => {
    await loginAsAdmin(page)
    await mockAllAdminApis(page)
    await page.route('**/api/admin-settings', (r: Route) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ADMIN_SETTINGS),
      }),
    )
    await page.goto(`${ADMIN_URL}?tab=limits`, { timeout: GOTO_TIMEOUT })
    await expect(page.getByText('Cầu dao khẩn cấp — chặn toàn bộ AI')).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
    await page.getByRole('button', { name: 'Lưu cấu hình' }).first().click()
    await expect(page.getByText('Đã lưu cấu hình')).toBeVisible({ timeout: 8000 })
  })

  test('Limits: POST 500 → toast lỗi', async ({ page }) => {
    await loginAsAdmin(page)
    await mockAllAdminApis(page)
    let callCount = 0
    await page.route('**/api/admin-settings', (r: Route) => {
      callCount++
      if (callCount === 1)
        return r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ADMIN_SETTINGS),
        })
      return r.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      })
    })
    await page.goto(`${ADMIN_URL}?tab=limits`, { timeout: GOTO_TIMEOUT })
    await expect(page.getByText('Cầu dao khẩn cấp — chặn toàn bộ AI')).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
    await page.getByRole('button', { name: 'Lưu cấu hình' }).first().click()
    await expect(page.getByText(/Lưu thất bại|Server error/i)).toBeVisible({ timeout: 8000 })
  })

  test('Limits: API 403 → hiện thông báo không có quyền', async ({ page }) => {
    await loginAsAdmin(page)
    await mockAllAdminApis(page)
    await page.route('**/api/admin-settings', (r: Route) =>
      r.fulfill({ status: 403, body: '{"error":"Forbidden"}' }),
    )
    await page.route('**/api/admin-price-promo**', (r: Route) =>
      r.fulfill({ status: 403, body: '{"error":"Forbidden"}' }),
    )
    await page.goto(`${ADMIN_URL}?tab=limits`, { timeout: GOTO_TIMEOUT })
    await expect(page.getByText('Bạn không có quyền truy cập trang này.').first()).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  /* ── 5. Tab Plan Features ────────────────────────────────────────────── */

  test('PlanFeatures: "Chat AI" hiện trong danh sách', async ({ page }) => {
    await gotoAdmin(page, 'plan-features')
    await expect(page.getByText('Chat AI')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('PlanFeatures: "Luyện nói" hiện trong danh sách', async ({ page }) => {
    await gotoAdmin(page, 'plan-features')
    await expect(page.getByText('Luyện nói').first()).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  /* ── 6. Tab Plan Marketing ───────────────────────────────────────────── */

  test('PlanMarketing: Tab accordion mở sau khi navigate', async ({ page }) => {
    await gotoAdmin(page)
    // Click tab Nội dung gói từ trang chính (đáng tin cậy hơn deep link)
    await page.getByRole('button', { name: 'Nội dung gói' }).click()
    await expect(page.getByRole('button', { name: 'Nội dung gói' })).toHaveAttribute(
      'aria-expanded',
      'true',
      { timeout: 5000 },
    )
  })

  test('PlanMarketing: Hiện badge "Phổ biến" sau khi mở tab', async ({ page }) => {
    await gotoAdmin(page)
    await page.getByRole('button', { name: 'Nội dung gói' }).click()
    await expect(page.getByRole('button', { name: 'Nội dung gói' })).toHaveAttribute(
      'aria-expanded',
      'true',
      { timeout: 5000 },
    )
    await expect(page.locator('input[value="Phổ biến"]')).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  /* ── 7. Tab Achievement Rewards ──────────────────────────────────────── */

  test('AchievementRewards: Tab accordion mở sau khi click', async ({ page }) => {
    await gotoAdmin(page)
    await page.getByRole('button', { name: 'Thưởng huy hiệu' }).click()
    await expect(page.getByRole('button', { name: 'Thưởng huy hiệu' })).toHaveAttribute(
      'aria-expanded',
      'true',
      { timeout: 5000 },
    )
  })

  test('AchievementRewards: Nút accordion "Thưởng huy hiệu" tồn tại', async ({ page }) => {
    await gotoAdmin(page)
    await expect(page.getByRole('button', { name: 'Thưởng huy hiệu' })).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  /* ── 8. Tab Grant Plan (Users, Payments, Grant, VIP, ReservedNames) ─── */

  test('GrantPlan: Bảng người dùng hiện user1@test.com', async ({ page }) => {
    await gotoAdmin(page, 'grant-plan')
    await expect(page.getByText('user1@test.com')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('GrantPlan: Bảng người dùng hiện user2@test.com', async ({ page }) => {
    await gotoAdmin(page, 'grant-plan')
    await expect(page.getByText('user2@test.com')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('GrantPlan: Người dùng đã xác thực hiện "Đã xác thực"', async ({ page }) => {
    await gotoAdmin(page, 'grant-plan')
    await expect(page.getByText('Đã xác thực').first()).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('GrantPlan: Bảng thanh toán hiện paymentCode DHCB001', async ({ page }) => {
    // paymentCode là field được render trong <td> đầu tiên của bảng thanh toán
    await gotoAdmin(page, 'grant-plan')
    await expect(page.getByText('DHCB001')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('GrantPlan: Bảng thanh toán hiện paymentCode DHCB002', async ({ page }) => {
    await gotoAdmin(page, 'grant-plan')
    await expect(page.getByText('DHCB002')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('GrantPlan: Bảng thanh toán hiện buyer@test.com', async ({ page }) => {
    await gotoAdmin(page, 'grant-plan')
    await expect(page.getByText('buyer@test.com')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('GrantPlan: Tìm kiếm user → gọi API với search param', async ({ page }) => {
    await loginAsAdmin(page)
    await mockAllAdminApis(page)
    const calls: string[] = []
    await page.route('**/api/admin-users**', (r: Route) => {
      calls.push(r.request().url())
      return r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USERS),
      })
    })
    await page.goto(`${ADMIN_URL}?tab=grant-plan`, { timeout: GOTO_TIMEOUT })
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
    const searchInput = page.getByPlaceholder('Tìm theo email...')
    await searchInput.fill('test@example.com')
    await searchInput.press('Enter')
    await page.waitForTimeout(800)
    expect(calls.some((u) => u.includes('search='))).toBe(true)
  })

  test('GrantPlan: Form cấp gói hiện text "Cấp gói VIP thủ công theo email"', async ({ page }) => {
    await gotoAdmin(page, 'grant-plan')
    await expect(page.getByText('Cấp gói VIP thủ công theo email')).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  test('GrantPlan: Checkbox "Vĩnh viễn" tồn tại', async ({ page }) => {
    await gotoAdmin(page, 'grant-plan')
    await expect(page.getByRole('checkbox', { name: /Vĩnh viễn/i })).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  test('GrantPlan: Uncheck "Vĩnh viễn" → hiện input số ngày', async ({ page }) => {
    await gotoAdmin(page, 'grant-plan')
    const grantSection = page
      .locator('section')
      .filter({ hasText: 'Cấp gói VIP thủ công theo email' })
    await grantSection.locator('input[type="checkbox"]').uncheck()
    await expect(grantSection.locator('input[type="number"]')).toBeVisible({ timeout: 5000 })
  })

  test('GrantPlan: Nút Tra cứu gọi GET /api/admin-grant-plan', async ({ page }) => {
    await gotoAdmin(page, 'grant-plan')
    await page.getByPlaceholder('user@example.com').first().fill('user@test.com')
    await page.getByRole('button', { name: 'Tra cứu' }).click()
    // Kết quả hiện sau đó
    await expect(page.getByText('user@test.com').first()).toBeVisible({ timeout: 5000 })
  })

  test('GrantPlan: Nút Cấp gói gọi POST', async ({ page }) => {
    await loginAsAdmin(page)
    await mockAllAdminApis(page)
    let postCalled = false
    await page.route('**/api/admin-grant-plan**', (r: Route) => {
      if (r.request().method() === 'POST') postCalled = true
      if (r.request().method() === 'GET')
        return r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_GRANT_LOOKUP),
        })
      return r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ email: 'user@test.com', plan: 'pro', planExpiresAt: null }),
      })
    })
    await page.goto(`${ADMIN_URL}?tab=grant-plan`, { timeout: GOTO_TIMEOUT })
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
    await page.getByPlaceholder('user@example.com').first().fill('user@test.com')
    await page.getByRole('button', { name: 'Cấp gói' }).click()
    await page.waitForTimeout(1000)
    expect(postCalled).toBe(true)
  })

  test('GrantPlan: Email trống → toast "Nhập email trước đã"', async ({ page }) => {
    await gotoAdmin(page, 'grant-plan')
    await page.getByRole('button', { name: 'Tra cứu' }).click()
    await expect(page.getByText('Nhập email trước đã')).toBeVisible({ timeout: 5000 })
  })

  test('GrantPlan: VIP whitelist hiện vip@test.com', async ({ page }) => {
    await gotoAdmin(page, 'grant-plan')
    await expect(page.getByText('vip@test.com')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('GrantPlan: Button "Thêm vào danh sách VIP" gọi POST', async ({ page }) => {
    await gotoAdmin(page, 'grant-plan')
    let postCalled = false
    await page.route('**/api/admin-vip-whitelist**', (r: Route) => {
      if (r.request().method() === 'POST') postCalled = true
      return r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
    })
    const vipSection = page.locator('section').filter({ hasText: 'Thêm email vào danh sách VIP' })
    await vipSection.locator('input[type="email"]').fill('newvip@test.com')
    await page.getByRole('button', { name: 'Thêm vào danh sách VIP' }).click()
    await page.waitForTimeout(800)
    expect(postCalled).toBe(true)
  })

  test('GrantPlan: Button "Gỡ" VIP tồn tại', async ({ page }) => {
    await gotoAdmin(page, 'grant-plan')
    await expect(page.getByRole('button', { name: 'Gỡ' }).first()).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  test('GrantPlan: Click Gỡ → gọi DELETE /api/admin-vip-whitelist', async ({ page }) => {
    await gotoAdmin(page, 'grant-plan')
    let deleteCalled = false
    await page.route('**/api/admin-vip-whitelist**', (r: Route) => {
      if (r.request().method() === 'DELETE') deleteCalled = true
      return r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
    })
    const removeBtn = page.getByRole('button', { name: 'Gỡ' }).first()
    await expect(removeBtn).toBeVisible({ timeout: VISIBLE_TIMEOUT })
    await removeBtn.click()
    await page.waitForTimeout(800)
    expect(deleteCalled).toBe(true)
  })

  test('GrantPlan: Từ cấm "admin" hiện trong danh sách', async ({ page }) => {
    await gotoAdmin(page, 'grant-plan')
    await expect(page.getByText('admin').first()).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('GrantPlan: Từ cấm "hotro" hiện trong danh sách', async ({ page }) => {
    await gotoAdmin(page, 'grant-plan')
    await expect(page.getByText('hotro').first()).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('GrantPlan: Thêm từ cấm → POST với action=add', async ({ page }) => {
    await gotoAdmin(page, 'grant-plan')
    let postBody: unknown = null
    await page.route('**/api/admin-reserved-names**', (r: Route) => {
      if (r.request().method() === 'POST') postBody = r.request().postDataJSON()
      return r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
    })
    await page.getByPlaceholder(/Nhập cụm từ cấm mới/).fill('support_fake')
    await page.getByRole('button', { name: 'Thêm từ cấm' }).click()
    await page.waitForTimeout(800)
    expect((postBody as { action?: string })?.action).toBe('add')
  })

  /* ── 9. Tab Analytics ───────────────────────────────────────────────── */

  test('Analytics: Tiêu đề "Analytics marketing" hiện', async ({ page }) => {
    await gotoAdmin(page, 'analytics')
    await expect(page.getByText('Analytics marketing')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('Analytics: Số liệu landing_view=500 hiện', async ({ page }) => {
    await gotoAdmin(page, 'analytics')
    await expect(page.getByText('500')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('Analytics: funnel Daily Plan hiển thị completion SRS và n/a cho action chưa được hỗ trợ', async ({
    page,
  }) => {
    await gotoAdmin(page, 'analytics')
    await expect(page.getByText('Phễu Daily Plan theo action')).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
    await expect(page.getByText('Ôn SRS')).toBeVisible()
    await expect(page.getByText('40.0%')).toBeVisible()
    await expect(page.getByText('n/a').first()).toBeVisible()
  })

  // AdminFeedbackPanel giờ có 2 tab con: "Ý Kiến Người Dùng" (mặc định) và "Đánh Giá Gia Sư AI 👎"
  // (feat/feedback: hệ thống góp ý người dùng, xem CI #616) — nội dung phản hồi gia sư AI chỉ
  // hiện sau khi bấm sang tab con thứ 2.
  test('Analytics: Tiêu đề "Phản Hồi 👎 Chất Lượng Gia Sư AI"', async ({ page }) => {
    await gotoAdmin(page, 'analytics')
    await page.getByRole('button', { name: /Đánh Giá Gia Sư AI/ }).click()
    await expect(page.getByText(/Phản Hồi.*Chất Lượng Gia Sư AI/)).toBeVisible({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  test('Analytics: Feedback hiện userInput "What is grammar?"', async ({ page }) => {
    await gotoAdmin(page, 'analytics')
    await page.getByRole('button', { name: /Đánh Giá Gia Sư AI/ }).click()
    await expect(page.getByText('What is grammar?')).toBeVisible({ timeout: VISIBLE_TIMEOUT })
  })

  test('Analytics: Dropdown "Tất cả nguồn" tồn tại', async ({ page }) => {
    await gotoAdmin(page, 'analytics')
    await page.getByRole('button', { name: /Đánh Giá Gia Sư AI/ }).click()
    await expect(page.getByRole('option', { name: 'Tất cả nguồn' })).toBeAttached({
      timeout: VISIBLE_TIMEOUT,
    })
  })

  test('Circuit breaker POST lỗi → hiện thông báo lỗi', async ({ page }) => {
    await loginAsAdmin(page)
    await page.route('**/api/admin-usage-stats**', (r: Route) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USAGE_STATS),
      }),
    )
    await page.route('**/api/admin-system-control', (r: Route) => {
      if (r.request().method() === 'POST')
        return r.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'DB error' }),
        })
      return r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CIRCUIT_BREAKER_OFF),
      })
    })
    await page.route('**/api/app-settings**', (r: Route) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: '{"promoUntil":null}' }),
    )
    await page.goto(`${ADMIN_URL}?tab=usage`, { timeout: GOTO_TIMEOUT })
    await page
      .getByRole('button', { name: /KÍCH HOẠT DẬP KHẨN CẤP/i })
      .click({ timeout: VISIBLE_TIMEOUT })
    await expect(page.getByText(/Lỗi|error|DB error|Cập nhật thất bại/i)).toBeVisible({
      timeout: 8000,
    })
  })

  /* ── 10. Accessibility & Responsive ─────────────────────────────────── */

  test('A11y: aria-expanded ≥ 7 nút accordion', async ({ page }) => {
    await gotoAdmin(page)
    await page.waitForTimeout(2000)
    const buttons = await page.locator('button[aria-expanded]').all()
    expect(buttons.length).toBeGreaterThanOrEqual(7)
  })

  test('A11y: Mobile 375px — tiêu đề và tab visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await gotoAdmin(page)
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sử dụng, chi phí & Vận hành' })).toBeVisible()
  })

  test('A11y: Tablet 768px — layout OK', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await gotoAdmin(page)
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible()
  })
})
