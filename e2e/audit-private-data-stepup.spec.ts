import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockLogin } from './helpers/auth'
import { freezeAnimations } from './helpers/axe'

test('2FA: mã sai giữ lại để sửa; chỉ báo mở dữ liệu riêng tư sau server xác nhận', async ({
  page,
}, testInfo) => {
  await mockLogin(page, 'vi', 'blue-sky')
  const verified: unknown[] = []
  await page.route('**/api/two-factor', async (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({ json: { enabled: true, pending: false, recoveryCodesLeft: 10 } })
    const body = route.request().postDataJSON()
    verified.push(body)
    if (verified.length === 1)
      return route.fulfill({ status: 400, json: { ok: false, error: 'Mã xác minh chưa đúng' } })
    return route.fulfill({ json: { ok: true } })
  })
  await page.goto('/profile', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /Xác thực hai bước/ }).click({ timeout: 30_000 })
  const verify = page.getByRole('button', {
    name: 'Xác minh truy cập dữ liệu riêng tư',
    exact: true,
  })
  await expect(verify).toBeDisabled()
  const code = page.getByLabel('Nhập mã từ ứng dụng xác thực (hoặc một mã khôi phục):', {
    exact: true,
  })
  await code.fill('000000')
  await verify.click()
  await expect(page.getByText('Mã xác minh chưa đúng', { exact: true })).toBeVisible()
  await expect(code).toHaveValue('000000')
  await expect(page.getByText(/Đã xác minh\. Bạn có thể xem/)).toHaveCount(0)
  await code.fill('123456')
  await verify.click()
  await expect(
    page.getByText(/Đã xác minh\. Bạn có thể xem và xuất dữ liệu riêng tư trong 15 phút\./),
  ).toBeVisible()
  await expect(code).toHaveValue('')
  expect(verified).toEqual([
    { action: 'verify', code: '000000' },
    { action: 'verify', code: '123456' },
  ])
  await freezeAnimations(page)
  const { violations } = await new AxeBuilder({ page })
    .include('#two-factor-section')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag2aaa'])
    .analyze()
  expect(violations.map((item) => `${item.id}: ${item.nodes.length}`)).toEqual([])
  await page.screenshot({ path: testInfo.outputPath('private-data-stepup.png'), fullPage: true })
})
