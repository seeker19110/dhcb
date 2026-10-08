// E2E — mục "Dữ liệu & tài khoản" ở trang cá nhân: tải dữ liệu của tôi + xoá tài khoản
// (spec docs/specs/2026-10-08-xoa-tai-khoan-va-xuat-du-lieu.md, changelog 0533).
// Không có backend thật khi chạy E2E (Vite dev) ⇒ mock /api/account; nghiệp vụ thật đã có test
// tích hợp Postgres ở packages/core-personal/accountErasureService.integration.test.ts.
import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockLogin } from './helpers/auth'
import { freezeAnimations } from './helpers/axe'

interface MockOptions {
  methods: Array<'password' | 'google'>
  twoFactorRequired: boolean
  vipActive: boolean
  planExpiresAt: string | null
}

async function mockAccount(page: Page, options: MockOptions): Promise<unknown[]> {
  const posted: unknown[] = []
  await page.route('**/api/account**', async (route) => {
    const req = route.request()
    if (req.method() === 'GET') return route.fulfill({ json: options })
    const body: unknown = req.postDataJSON()
    posted.push(body)
    const action = (body as { action?: string }).action
    if (action === 'export')
      return route.fulfill({
        status: 200,
        headers: {
          'content-type': 'application/json',
          'content-disposition': 'attachment; filename="dhcb-du-lieu-cua-toi-2026-10-08.json"',
        },
        body: JSON.stringify({ account: { id: 'e2e-user-0001' }, tables: {} }),
      })
    return route.fulfill({ json: { ok: true, erasedAt: '2026-10-08T00:00:00.000Z' } })
  })
  return posted
}

async function openSection(page: Page): Promise<void> {
  await page.goto('/trang-ca-nhan', { waitUntil: 'domcontentloaded' })
  const toggle = page.getByRole('button', { name: 'Dữ liệu & tài khoản', exact: true })
  await toggle.click({ timeout: 30_000 })
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('heading', { name: 'Xoá tài khoản', exact: true })).toBeVisible()
}

test('tải dữ liệu: xác minh mật khẩu rồi trình duyệt nhận đúng tệp JSON', async ({ page }) => {
  await mockLogin(page, 'vi', 'blue-sky')
  const posted = await mockAccount(page, {
    methods: ['password'],
    twoFactorRequired: false,
    vipActive: false,
    planExpiresAt: null,
  })
  await openSection(page)
  const exportForm = page.getByRole('form', { name: 'Tải dữ liệu của tôi' })
  await exportForm.getByLabel('Mật khẩu hiện tại').fill('mat-khau-e2e')
  const download = page.waitForEvent('download')
  await exportForm.getByRole('button', { name: 'Tải dữ liệu (JSON)' }).click()
  expect((await download).suggestedFilename()).toBe('dhcb-du-lieu-cua-toi-2026-10-08.json')
  await expect(exportForm.getByRole('status')).toContainText('dhcb-du-lieu-cua-toi-2026-10-08.json')
  expect(posted).toEqual([
    { action: 'export', reauth: { method: 'password', password: 'mat-khau-e2e' } },
  ])
})

test('xoá tài khoản VIP: phải gõ câu xác nhận + nhận không hoàn tiền; xoá xong rời trang cá nhân', async ({
  page,
}, testInfo) => {
  await mockLogin(page, 'vi', 'blue-sky')
  const posted = await mockAccount(page, {
    methods: ['password'],
    twoFactorRequired: false,
    vipActive: true,
    planExpiresAt: '2027-01-01T00:00:00.000Z',
  })
  await openSection(page)
  const deleteForm = page.getByRole('form', { name: 'Xoá tài khoản' })
  await expect(deleteForm.getByText(/KHÔNG được hoàn tiền/)).toBeVisible()
  const submit = deleteForm.getByRole('button', { name: 'Xoá vĩnh viễn tài khoản' })
  await expect(submit).toBeDisabled()

  await deleteForm.getByLabel('Mật khẩu hiện tại').fill('mat-khau-e2e')
  await deleteForm.getByLabel(/để xác nhận/).fill('xoa tai khoan')
  await expect(submit).toBeDisabled() // chưa nhận không hoàn tiền
  await deleteForm.getByRole('checkbox').check()
  await expect(submit).toBeEnabled()

  await freezeAnimations(page)
  const { violations } = await new AxeBuilder({ page })
    .include('section:has(> h2 > button[aria-expanded="true"])')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
  // Ảnh chụp KHÔNG fullPage: chụp fullPage đổi kích thước khung nhìn tạm thời (xem changelog 0533).
  await page.screenshot({ path: testInfo.outputPath('account-delete-filled.png') })

  await submit.click()
  await expect(page).not.toHaveURL(/trang-ca-nhan/, { timeout: 15_000 })
  expect(posted).toEqual([
    {
      action: 'delete',
      reauth: { method: 'password', password: 'mat-khau-e2e' },
      confirmation: 'xoa tai khoan',
      acknowledgeNoRefund: true,
    },
  ])
})

test('server đòi 2FA (403 STEP_UP_REQUIRED) ⇒ hiện ô mã, KHÔNG xoá, giữ nguyên trang', async ({
  page,
}) => {
  await mockLogin(page, 'vi', 'blue-sky')
  await page.route('**/api/account**', async (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({
        json: {
          methods: ['password'],
          twoFactorRequired: false,
          vipActive: false,
          planExpiresAt: null,
        },
      })
    return route.fulfill({
      status: 403,
      json: { error: 'Nhập mã xác thực hai bước để tiếp tục.', code: 'STEP_UP_REQUIRED' },
    })
  })
  await openSection(page)
  const deleteForm = page.getByRole('form', { name: 'Xoá tài khoản' })
  await expect(deleteForm.getByLabel(/Mã xác thực hai bước/)).toHaveCount(0)
  await deleteForm.getByLabel('Mật khẩu hiện tại').fill('mat-khau-e2e')
  await deleteForm.getByLabel(/để xác nhận/).fill('XOÁ TÀI KHOẢN')
  await deleteForm.getByRole('button', { name: 'Xoá vĩnh viễn tài khoản' }).click()
  await expect(deleteForm.getByRole('alert')).toHaveText('Nhập mã xác thực hai bước để tiếp tục.')
  await expect(deleteForm.getByLabel(/Mã xác thực hai bước/)).toBeVisible()
  await expect(page).toHaveURL(/trang-ca-nhan/)
})
