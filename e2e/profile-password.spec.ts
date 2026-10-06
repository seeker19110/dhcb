import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockLogin } from './helpers/auth'

for (const width of [390, 1440]) {
  test(`Profile đổi mật khẩu: sai → sửa → đăng nhập lại (${width}px)`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await mockLogin(page, 'vi', 'dark-blue')
    let attempts = 0
    let changed = false
    await page.route('**/api/auth**', async (route) => {
      const req = route.request()
      const action = new URL(req.url()).searchParams.get('action')
      if (action === 'password-status') return route.fulfill({ json: { hasPassword: true } })
      if (action === 'me' && changed)
        return route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
      if (req.method() === 'POST') {
        const body = req.postDataJSON() as Record<string, unknown>
        if (body.action === 'session-from-cookie')
          return route.fulfill({ json: { authenticated: false } })
        if (body.action === 'change-password') {
          attempts++
          expect(Object.keys(body).sort()).toEqual(['action', 'currentPassword', 'newPassword'])
          if (attempts === 1)
            return route.fulfill({ status: 400, json: { error: 'Mật khẩu hiện tại không đúng.' } })
          changed = true
          return route.fulfill({ json: { ok: true } })
        }
      }
      return route.fallback()
    })
    await page.goto('/trang-ca-nhan')
    await page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click()
    await expect(page.getByLabel('Mật khẩu hiện tại', { exact: true })).toBeVisible()
    await page.locator('#password-change-panel').scrollIntoViewIfNeeded()
    await testInfo.attach(`password-${width}`, {
      body: await page.screenshot(),
      contentType: 'image/png',
    })
    const results = await new AxeBuilder({ page }).include('#password-change-panel').analyze()
    expect(results.violations).toEqual([])
    await page.getByLabel('Mật khẩu hiện tại', { exact: true }).fill('old password to test')
    await page.getByLabel('Mật khẩu mới', { exact: true }).fill('new password to test')
    await page.getByLabel('Nhập lại mật khẩu mới', { exact: true }).fill('new password to test')
    await page.getByRole('button', { name: 'Lưu mật khẩu mới' }).click()
    await expect(page.locator('#password-change-error')).toContainText('hiện tại không đúng')
    await expect(page).toHaveURL(/\/trang-ca-nhan$/)
    await page.getByRole('button', { name: 'Lưu mật khẩu mới' }).click()
    await expect(page).toHaveURL(/\/login$/)
    expect(attempts).toBe(2)
    await expect(page.getByRole('button', { name: /Google/ }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Microsoft|Apple|Facebook/ })).toHaveCount(0)
  })
}

test('Profile tài khoản liên kết chưa có mật khẩu: không mở form đặt mật khẩu', async ({
  page,
}) => {
  await mockLogin(page)
  await page.route('**/api/auth?action=password-status', (route) =>
    route.fulfill({ json: { hasPassword: false } }),
  )
  await page.goto('/trang-ca-nhan')
  await page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click()
  await expect(page.locator('#password-change-panel')).toContainText('chưa có mật khẩu riêng')
  await expect(page.locator('#password-current')).toHaveCount(0)
})
