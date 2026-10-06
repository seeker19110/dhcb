// e2e/english-subject-home.spec.ts — Slice 02 Góc học tập: Tiếng Anh là MỘT MÔN ngang hàng.
// Đặc tả: docs/specs/2026-09-15-goc-hoc-tap-02-tieng-anh-la-mot-mon.md (AC-1, AC-7, AC-8, AC-9).
//
// Ba thứ chỉ E2E mới chứng minh được (unit test không thấy trình duyệt thật):
//   1. Alias cũ giữ query/hash và Back không kẹt vòng lặp (AC-1).
//   2. Đi qua alias → tổng quan → công cụ → Back KHÔNG làm đổi/mất khoá localStorage (AC-7) —
//      đây là bất biến "không mất gì của người học" khi đổi đường dẫn.
//   3. Sidebar desktop mở đúng cấp 2 "Công cụ Tiếng Anh" tại trang thật (AC-8), và khách vào
//      được trang tổng quan với GuestBanner (AC-9).
import { test, expect, type Page } from '@playwright/test'
import { mockLogin } from './helpers/auth'

const ENGLISH_HOME = '/goc-hoc-tap/english'

/** Ảnh chụp localStorage, bỏ các khoá giao diện (`ui_*`) vốn được phép đổi khi bấm nav. */
async function snapshotStorage(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const out: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!
      if (k.startsWith('ui_')) continue
      out[k] = localStorage.getItem(k) ?? ''
    }
    return out
  })
}

test('alias cũ /hoc-tieng-anh → trang tổng quan môn, giữ query + hash, Back về trang nguồn', async ({
  page,
}) => {
  await mockLogin(page)
  await page.goto('/tien-do')
  await page.goto('/hoc-tieng-anh?tab=hom-nay#cong-cu')
  await expect(page).toHaveURL(/\/goc-hoc-tap\/english\?tab=hom-nay#cong-cu$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/tien-do$/)
})

test('trang tổng quan là trang MÔN: tiêu đề "Tiếng Anh", không còn "Không Gian"', async ({
  page,
}) => {
  await mockLogin(page)
  await page.goto(ENGLISH_HOME)
  await expect(page).toHaveTitle(/Tiếng Anh/)
  await expect(page.getByText('Không Gian Tiếng Anh')).toHaveCount(0)
  await expect(page.getByText('English Studio')).toHaveCount(0)
})

test('không mất gì của người học: localStorage trước/sau khi đi qua alias → tổng quan → công cụ → Back', async ({
  page,
}) => {
  await mockLogin(page)
  await page.goto('/tien-do')
  const before = await snapshotStorage(page)
  expect(Object.keys(before).length).toBeGreaterThan(0)

  await page.goto('/hoc-tieng-anh')
  await expect(page).toHaveURL(/\/goc-hoc-tap\/english$/)
  await page.getByRole('button', { name: /Ôn thi/ }).click()
  await expect(page).toHaveURL(/\/on-thi/)
  await page.goBack()
  await expect(page).toHaveURL(/\/goc-hoc-tap\/english$/)

  const after = await snapshotStorage(page)
  // Đổi đường dẫn KHÔNG phải migration dữ liệu: không khoá nào mất, không khoá nào đổi giá trị.
  for (const [k, v] of Object.entries(before)) expect(after[k], k).toBe(v)
})

test('sidebar desktop: mục "Tiếng Anh" trong Góc học tập mở cấp 2 với đủ 5 công cụ', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await mockLogin(page)
  await page.goto('/lo-trinh-hoc')
  const tools = page.getByRole('list', { name: 'Công cụ Tiếng Anh' })
  await expect(tools).toBeVisible()
  for (const label of [
    'Lộ trình CEFR',
    'Bài hội thoại mẫu',
    'Câu thông dụng',
    'Sổ tay lỗi sai',
    'Ôn thi',
  ]) {
    await expect(tools.getByRole('link', { name: label })).toBeVisible()
  }
  // Không còn mục cấp nền tảng "Học Tiếng Anh".
  await expect(page.getByRole('link', { name: 'Học Tiếng Anh' })).toHaveCount(0)
  // Nút mở/đóng cấp 2 có vùng chạm ≥ 44px (CLAUDE.md §4.7).
  const box = await page.getByRole('button', { name: /công cụ Tiếng Anh/ }).boundingBox()
  expect(box).not.toBeNull()
  expect(box!.height).toBeGreaterThanOrEqual(44)
  expect(box!.width).toBeGreaterThanOrEqual(44)
})

test('khách (chưa đăng nhập) vào được trang tổng quan môn và thấy GuestBanner', async ({
  page,
}) => {
  // [P0-3, lệnh 4] GuestBanner chỉ hiện SAU KHI khách đã có ít nhất một dấu vết học thật trên
  // máy này (`hasAnyGuestSession()`) — seed một khoá phiên học giả trước khi mở trang, khớp luật
  // mới thay vì luật cũ "hiện ngay khi khách vừa mở trang".
  await page.addInitScript(() => {
    localStorage.setItem('dhcb_lsession_v1_guest:e2e-fake_english_demo', '{}')
  })
  await page.goto(ENGLISH_HOME)
  await expect(page).toHaveURL(/\/goc-hoc-tap\/english$/)
  await expect(page.getByRole('status').filter({ hasText: 'Đăng ký miễn phí' })).toBeVisible()
})
