// e2e/new-user-journey.spec.ts — HÀNH TRÌNH NGƯỜI MỚI đi trọn (đợt U9b, audit 2026-09-30 M19 +
// mục 8): Trang chủ khách → Đăng nhập → Đăng ký → Onboarding → bốn màn đầu tiên.
//
// Vì sao cần E2E đi TRỌN mà không chỉ test từng màn: lỗi M19 là lỗi GIỮA các màn — mỗi màn tự nó
// "đúng", nhưng người vừa chọn "Tiếng Anh · Cơ bản · Giao tiếp hàng ngày · 10 phút" lại bị Trang
// chủ hỏi lại môn, Trò chuyện mở "Phỏng vấn xin việc", Tiếng Anh nói "Học tiếp" + "0 / 50", Ôn tập
// bảo "quay lại ngày mai". Chỉ một bài đi hết hành trình mới bắt được các câu chữ nói ngược nhau.
//
// Backend giả bằng `page.route` (E2E chạy trên `npm run dev`, không có Postgres): đăng ký trả một
// người dùng CHƯA onboarding; `POST /api/profile` (lưu onboarding) lật `onboarded` thành true —
// đúng chuyển trạng thái của server thật.
import { test, expect, type Page } from '@playwright/test'

const USER = {
  id: 'e2e-new-user-0001',
  email: 'nguoi.moi@example.com',
  name: 'Người Mới',
  plan: 'free',
}

const APP_SETTINGS = {
  limits: {
    free: { chat: 30, writing: 30, speaking: 30, stt: 30, pronounce: 30 },
    pro: { chat: 100, writing: 100, speaking: 100, stt: 100, pronounce: 100 },
    vip: { chat: 1000000, writing: 1000000, speaking: 1000000, stt: 1000000, pronounce: 1000000 },
  },
  promoUntil: null,
  leaderboardEnabled: false,
  updatedAt: '1970-01-01T00:00:00.000Z',
}

/** Backend giả có trạng thái: chưa đăng ký → 401; đăng ký xong → chưa onboarding; lưu → xong. */
async function mockBackend(page: Page): Promise<{ events: string[] }> {
  let registered = false
  let onboarded = false
  const events: string[] = []
  const profile = () => ({
    ...USER,
    onboarded,
    userLevel: 'beginner',
    goal: 'daily',
    dailyMinutes: 10,
    ageGroup: 'nguoi_lon',
    isAdmin: false,
  })
  const json = (body: unknown, status = 200) => ({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })

  await page.route('**/api/auth**', async (route) => {
    const req = route.request()
    if (req.method() === 'POST') {
      const body = req.postDataJSON() as { action?: string }
      if (body.action === 'register') {
        registered = true
        return route.fulfill(
          json({ authenticated: true, user: { ...USER, onboarded: false, createdAt: Date.now() } }),
        )
      }
      return route.fulfill(json({ ok: true }))
    }
    return route.fulfill(registered ? json(profile()) : json({ error: 'unauthorized' }, 401))
  })
  await page.route('**/api/profile**', (route) => {
    if (route.request().method() === 'POST') {
      onboarded = true
      return route.fulfill(json({ ok: true }))
    }
    return route.fulfill(registered ? json(profile()) : json({ error: 'unauthorized' }, 401))
  })
  await page.route('**/api/analytics**', (route) => {
    const body = route.request().postDataJSON() as { event?: string; refCode?: string }
    events.push(`${body.event}:${body.refCode ?? ''}`)
    return route.fulfill(json({ ok: true }))
  })
  await page.route('**/api/app-settings**', (route) => route.fulfill(json(APP_SETTINGS)))
  await page.route('**/api/progress**', (route) => route.fulfill(json({ ok: true })))
  await page.route('**/api/history**', (route) => route.fulfill(json([])))
  return { events }
}

test.use({ viewport: { width: 390, height: 844 } })

test('người mới: đăng ký → onboarding "Tiếng Anh · Cơ bản · Giao tiếp · 10 phút" → bốn màn nói cùng một điều', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await mockBackend(page)

  // ── Trang chủ khách: có lối "Đăng nhập" bằng chữ (audit mục 8) ──
  await page.goto('/')
  const dangNhap = page.getByRole('link', { name: 'Đăng nhập', exact: true })
  await expect(dangNhap).toBeVisible()
  await dangNhap.click()
  await expect(page).toHaveURL(/\/login/)

  // ── Đăng ký ──
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click()
  await page.locator('#name').fill(USER.name)
  await page.locator('#email').fill(USER.email)
  await page.locator('#password').fill('mat-khau-du-dai-15-ky-tu')
  await page.locator('form button[type="submit"]').click()
  await expect(page).toHaveURL(/\/onboarding$/)

  // ── Onboarding: nút chính đứng YÊN một chỗ qua mọi bước (audit mục 8: 653 → 683 → 671 → 618) ──
  await expect(page.getByRole('heading', { name: 'Bạn muốn học gì?' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Bỏ qua', exact: true })).toBeVisible()
  await page.getByRole('button', { name: /Tiếng Anh/ }).click()

  const nutChinh = page.locator('div.mt-auto > button').first()
  const viTri: number[] = []
  async function ghiViTri() {
    const box = await nutChinh.boundingBox()
    expect(box).not.toBeNull()
    viTri.push(Math.round(box!.y))
  }

  await expect(page.getByText('Bước 1 / 4')).toBeVisible()
  await ghiViTri()
  await page.getByRole('button', { name: /Tiếp theo/ }).click()
  await expect(page.getByText('Bước 2 / 4')).toBeVisible()
  await ghiViTri()
  await expect(page.getByRole('button', { name: /Cơ bản/ })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: /Tiếp theo/ }).click()
  await expect(page.getByText('Bước 3 / 4')).toBeVisible()
  await ghiViTri()
  await expect(page.getByRole('button', { name: /Giao tiếp hàng ngày/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: /Tiếp theo/ }).click()
  await expect(page.getByText('Bước 4 / 4')).toBeVisible()
  await ghiViTri()
  // Nút số phút có aria-pressed như nút nhóm tuổi (audit mục 8).
  const muoiPhut = page.getByRole('button', { name: /^10\s*phút/ })
  await expect(muoiPhut).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: /^5\s*phút/ })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  expect(new Set(viTri).size, `vị trí nút chính qua 4 bước: ${viTri.join(' → ')}`).toBe(1)

  await page.getByRole('button', { name: /Bắt đầu học/ }).click()
  await expect(page).toHaveURL(/\/goc-hoc-tap\/english$/)

  // ── Tiếng Anh home: chưa học gì → "Bắt đầu", mục tiêu 10 từ (đã chọn 10 phút), không "Học tiếp" ──
  await expect(page.getByText('Bài đầu tiên theo lộ trình')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('button', { name: 'Bắt đầu', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /Học tiếp/ })).toHaveCount(0)
  await expect(page.getByText(/Mục tiêu hôm nay:\s*0\s*\/\s*10 từ vựng/)).toBeVisible()
  await expect(page.getByText(/\/\s*50 từ vựng/)).toHaveCount(0)

  // ── Trang chủ: không hỏi lại "Chọn môn" — mời vào đúng môn vừa chọn ──
  await page.goto('/')
  const viecChinh = page.getByRole('link', { name: 'Bắt đầu: Học Tiếng Anh' })
  await expect(viecChinh).toBeVisible({ timeout: 30_000 })
  await expect(viecChinh).toHaveAttribute('href', '/goc-hoc-tap/english')
  await expect(page.getByRole('link', { name: /Chọn môn/ })).toHaveCount(0)

  // ── Trò chuyện: tình huống mặc định theo mục tiêu "Giao tiếp hàng ngày", không phỏng vấn ──
  await page.goto('/goc-hoc-tap/english/tro-truyen')
  const tinhHuong = page.locator('select#situation')
  await expect(tinhHuong).toBeVisible({ timeout: 30_000 })
  await expect(tinhHuong).toHaveValue('small_talk')

  // ── Ôn tập: không bảo người chưa học gì "quay lại ngày mai"; chỉ lối bắt đầu đúng môn ──
  await page.goto('/goc-hoc-tap/on-tap')
  await expect(page.getByRole('status').first()).toContainText('Chưa có gì để ôn')
  await expect(page.getByText(/quay lại ngày mai/)).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Bắt đầu học bài đầu tiên' })).toHaveAttribute(
    'href',
    '/goc-hoc-tap/english',
  )
})

test('"Bỏ qua" ở bước chọn môn: lưu mặc định, ghi sự kiện bỏ qua, về Trang chủ mời chọn môn', async ({
  page,
}) => {
  const { events } = await mockBackend(page)
  await page.goto('/login')
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click()
  await page.locator('#name').fill(USER.name)
  await page.locator('#email').fill(USER.email)
  await page.locator('#password').fill('mat-khau-du-dai-15-ky-tu')
  await page.locator('form button[type="submit"]').click()
  await expect(page).toHaveURL(/\/onboarding$/)

  await page.getByRole('button', { name: 'Bỏ qua', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  // Bỏ qua ngay ở bước chọn môn thì CHƯA chọn môn nào — Trang chủ hỏi môn là đúng, không tự gán
  // Tiếng Anh (luật "không mặc định tiếng Anh").
  await expect(page.getByRole('link', { name: 'Bắt đầu: Chọn môn' })).toBeVisible({
    timeout: 30_000,
  })
  expect(events).toContain('onboarding_skip:onboarding:subject')
})
