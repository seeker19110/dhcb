import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

const base = 'https://www.donghanhcungban.org'
await mkdir('public-evidence', { recursive: true })
const result = { checkedAt: new Date().toISOString(), base, checks: [] }
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const health = await context.request.get(`${base}/api/health`, { timeout: 30000 })
  assert.equal(health.status(), 200)
  assert.equal((await health.json()).status, 'ok')
  result.checks.push('public health: 200 / ok')
  const settings = await context.request.get(`${base}/api/app-settings?release=20261006`, { timeout: 30000 })
  assert.equal(settings.status(), 200)
  const policy = await settings.json()
  assert.equal(policy.vipUnlimited, true)
  assert.match(policy.updatedAt, /vip-unlimited-20261006/)
  result.checks.push('live server confirms VIP unlimited policy version')
  const password = await context.request.get(`${base}/api/auth?action=password-status`, { timeout: 30000 })
  assert.equal(password.status(), 401)
  result.checks.push('password status rejects unauthenticated access')
  const page = await context.newPage()
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.getByRole('button', { name: /Google/i }).waitFor({ timeout: 20000 })
  assert.equal(await page.getByRole('button', { name: /Microsoft|Apple|Facebook/i }).count(), 0)
  assert.equal(await page.locator('input[type="email"]').isVisible(), true)
  await page.screenshot({ path: 'public-evidence/login.png', fullPage: true })
  result.checks.push('live login keeps Google + email, hides three providers')
  await page.goto(`${base}/gioi-thieu`, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.getByRole('heading', { name: 'Học điều bạn muốn. Hiểu điều bạn học.' }).waitFor()
  await page.getByText(/Không giới hạn lượt AI trong thời gian gói còn hiệu lực/).waitFor()
  await page.screenshot({ path: 'public-evidence/about-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 900 })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.screenshot({ path: 'public-evidence/about-mobile.png', fullPage: true })
  await page.getByRole('link', { name: 'Bắt đầu học miễn phí', exact: true }).click()
  await page.waitForURL('**/bat-dau')
  result.checks.push('live About mobile/desktop and guest start without login')
  result.ok = true
} catch (error) {
  result.ok = false
  result.error = String(error)
  process.exitCode = 1
} finally {
  await browser.close()
  await writeFile('public-evidence/result.json', JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result, null, 2))
}
