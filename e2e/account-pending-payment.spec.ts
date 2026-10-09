// E2E — đơn SePay chờ trả chặn xoá tài khoản + người dùng tự huỷ "tôi CHƯA chuyển khoản"
// (spec docs/specs/2026-10-09-huy-don-cho-de-xoa-tai-khoan.md, changelog 0546).
// Không có backend thật khi chạy E2E (Vite dev) ⇒ mock /api/account + /api/payment-cancel; nghiệp
// vụ thật (đua với webhook, hàng chờ hoàn tiền) có test tích hợp Postgres ở
// apps/server/src/api/billing/payment-cancel.integration.test.ts.
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockLogin } from './helpers/auth'
import { freezeAnimations } from './helpers/axe'

const now = Date.now()
const PENDING = {
  id: '11111111-1111-4111-8111-111111111111',
  paymentCode: 'DHCB7K2M9QRT',
  amountVnd: 99000,
  plan: 'vip',
  cycle: 'month',
  createdAt: new Date(now - 20 * 60_000).toISOString(),
  expiresAt: new Date(now + 10 * 60_000).toISOString(),
  graceEndsAt: new Date(now + 10 * 60_000 + 24 * 3600_000).toISOString(),
}

for (const theme of ['blue-sky', 'dark-blue'] as const) {
  test(`đơn chờ chặn xoá: hiện rõ đơn, tick xác nhận rồi huỷ, nút xoá mở lại (${theme})`, async ({
    page,
  }) => {
    await mockLogin(page, 'vi', theme)
    await page.route('**/api/account**', (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({
            json: {
              methods: ['password'],
              twoFactorRequired: false,
              vipActive: false,
              planExpiresAt: null,
              pendingPayments: [PENDING],
            },
          })
        : route.fulfill({ json: { ok: true, erasedAt: new Date().toISOString() } }),
    )
    const cancelBodies: unknown[] = []
    await page.route('**/api/payment-cancel', (route) => {
      cancelBodies.push(route.request().postDataJSON())
      return route.fulfill({
        json: { ok: true, alreadyCancelled: false, cancelledAt: new Date().toISOString() },
      })
    })

    await page.goto('/trang-ca-nhan', { waitUntil: 'domcontentloaded' })
    await page
      .getByRole('button', { name: 'Dữ liệu & tài khoản', exact: true })
      .click({ timeout: 30_000 })
    const block = page.getByRole('region', { name: 'Đơn thanh toán đang chờ' })
    await expect(block).toBeVisible()
    await expect(block).toContainText('99.000 đ')
    await expect(block).toContainText('DHCB7K2M9QRT')
    await expect(block).toContainText(/2[34] giờ \d+ phút/)

    const deleteForm = page.getByRole('form', { name: 'Xoá tài khoản' })
    const del = deleteForm.getByRole('button', { name: 'Xoá vĩnh viễn tài khoản' })
    await deleteForm.getByLabel(/để xác nhận/).fill('XOÁ TÀI KHOẢN')
    await expect(del).toBeDisabled() // còn đơn chặn

    const cancel = block.getByRole('button', { name: 'Huỷ đơn — tôi CHƯA chuyển khoản' })
    await expect(cancel).toBeDisabled()

    await freezeAnimations(page)
    const { violations } = await new AxeBuilder({ page })
      .include('section:has(> h2 > button[aria-expanded="true"])')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])

    await block.getByRole('checkbox', { name: /CHƯA chuyển khoản cho đơn DHCB7K2M9QRT/ }).check()
    await cancel.click()
    await expect(block).toHaveCount(0)
    expect(cancelBodies).toEqual([{ paymentId: PENDING.id, confirmNotTransferred: true }])
    await expect(del).toBeEnabled()
  })
}

for (const theme of ['blue-sky', 'dark-blue'] as const) {
  test(`admin: hàng chờ hoàn tiền nổi bật, đủ thông tin SePay, đánh dấu đã hoàn (${theme})`, async ({
    page,
  }) => {
    await mockLogin(page, 'vi', theme, { isAdmin: true })
    let marked = false
    const refund = {
      id: '22222222-2222-4222-8222-222222222222',
      paymentId: PENDING.id,
      paymentCode: 'DHCB7K2M9QRT',
      provider: 'sepay',
      providerTxnId: '92704',
      amountVnd: 99000,
      reason: 'cancelled_by_user',
      gateway: 'Vietcombank',
      referenceCode: 'MBVCB.3278907687',
      receivingAccount: '0123499999',
      transactionDate: '2026-10-09 14:02:37',
      receivedAt: new Date(now).toISOString(),
      status: 'needed',
      refundedAt: null,
      refundedBy: null,
      refundNote: null,
    }
    const posted: unknown[] = []
    await page.route('**/api/admin-payments**', (route) => {
      const req = route.request()
      if (req.method() === 'POST') {
        posted.push(req.postDataJSON())
        marked = true
        return route.fulfill({ json: { ok: true, alreadyRefunded: false } })
      }
      if (new URL(req.url()).searchParams.get('view') === 'refunds') {
        const row = marked
          ? {
              ...refund,
              status: 'refunded',
              refundedAt: new Date().toISOString(),
              refundedBy: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
              refundNote: 'FT999',
            }
          : refund
        return route.fulfill({ json: { refunds: [row] } })
      }
      return route.fulfill({ json: { payments: [] } })
    })
    await page.goto('/admin-s?tab=grant-plan', { waitUntil: 'domcontentloaded' })
    const queue = page.getByRole('region', { name: /Cần hoàn tiền/ })
    await expect(queue).toBeVisible({ timeout: 30_000 })
    await expect(queue.getByRole('heading')).toHaveText('Cần hoàn tiền (1)')
    for (const s of ['99.000 đ', '92704', 'MBVCB.3278907687', 'Vietcombank', '0123499999']) {
      await expect(queue).toContainText(s)
    }
    await freezeAnimations(page)
    const { violations } = await new AxeBuilder({ page })
      .include('section:has(> h4)')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])

    const btn = queue.getByRole('button', { name: 'Đã hoàn tiền' })
    await expect(btn).toBeDisabled()
    await queue.getByLabel(/Ghi chú hoàn tiền/).fill('FT999')
    await btn.click()
    await expect(queue.getByRole('heading')).toHaveText('Cần hoàn tiền (0)')
    expect(posted).toEqual([{ action: 'mark-refunded', refundId: refund.id, note: 'FT999' }])
  })
}
