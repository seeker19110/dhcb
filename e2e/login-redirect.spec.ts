import { test, expect } from '@playwright/test'
import { mockLogin } from './helpers/auth'

// Canh gác lỗi TRANG TRẮNG: trước đây Login.tsx gọi nav('/') ngay trong thân render rồi
// `return null` — React bỏ qua side effect đó nên URL đứng nguyên ở /login và người dùng
// đã đăng nhập nhìn thấy màn hình trắng. Test này bắt đúng ca đó.
test('người đã đăng nhập vào /login thì được đẩy về trang chủ, không thấy trang trắng', async ({
  page,
}) => {
  await mockLogin(page)
  await page.goto('/login')
  await expect(page).toHaveURL(/\/$/)
  // Chờ trang chủ (lazy chunk) vẽ xong rồi mới đo — nếu vẫn trắng thì đây là lỗi thật.
  await expect(page.locator('main, nav').first()).toBeVisible()
  await expect
    .poll(async () => (await page.locator('body').innerText()).trim().length)
    .toBeGreaterThan(40)
})

// [2026-09-15 — chế độ Khách] Test này canh một BẪY THẬT đã suýt lọt: `AuthProvider` nay cấp
// một `User` ảo cho khách vãng lai, nên điều kiện cũ `if (user) <Navigate to="/">` trong
// Login.tsx đúng với MỌI khách và đá họ khỏi chính trang đăng nhập — tức không ai đăng ký
// được nữa. Sửa bằng `if (user && !isGuest)`. Đừng nới điều kiện này về `user` trần.
test('người chưa đăng nhập vẫn thấy form đăng nhập ở /login', async ({ page }) => {
  await page.goto('/login')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.locator('input[type="email"]')).toBeVisible()
})

// Hợp đồng cookie thật trong trình duyệt: JSON/cờ UI không chứa secret phiên.
test('đăng nhập bằng cookie HttpOnly, không lưu hay gửi lại secret qua JavaScript', async ({
  page,
}) => {
  await mockLogin(page)
  await page.addInitScript(() => localStorage.removeItem('gsa_session_present_v1'))
  const profile = {
    id: 'e2e-user-0001',
    email: 'e2e@example.com',
    name: 'E2E User',
    plan: 'free',
    onboarded: true,
    createdAt: Date.now(),
  }
  let loggedIn = false
  const authHeaders: Record<string, string>[] = []
  await page.route('**/api/auth**', async (route) => {
    authHeaders.push(route.request().headers())
    const action =
      route.request().method() === 'POST'
        ? (route.request().postDataJSON() as { action: string }).action
        : 'me'
    if (action === 'login') {
      loggedIn = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'set-cookie': 'session_token=e2e-cookie-secret; HttpOnly; Path=/; SameSite=Lax',
        },
        body: JSON.stringify({ authenticated: true, user: profile }),
      })
      return
    }
    await route.fulfill({
      status: loggedIn ? 200 : 401,
      contentType: 'application/json',
      body: JSON.stringify(loggedIn ? profile : { error: 'Unauthorized' }),
    })
  })
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(profile.email)
  // Tài khoản cũ tiếp tục đăng nhập được bằng mật khẩu dưới 15 ký tự.
  await page.locator('input[name="password"]').fill('legacy')
  await page.locator('form button[type="submit"]').click()
  await expect(page).toHaveURL(/\/$/)
  const clientState = await page.evaluate(() => ({
    legacy: localStorage.getItem('gsa_session_token_v1'),
    marker: localStorage.getItem('gsa_session_present_v1'),
    cookies: document.cookie,
  }))
  expect(clientState.legacy).toBeNull()
  expect(clientState.marker).toMatch(/^session:/)
  expect(JSON.stringify(clientState)).not.toContain('e2e-cookie-secret')
  expect(authHeaders.every((headers) => !headers.authorization)).toBe(true)
  expect(
    (await page.context().cookies()).find((cookie) => cookie.name === 'session_token'),
  ).toMatchObject({ httpOnly: true, value: 'e2e-cookie-secret' })
})
