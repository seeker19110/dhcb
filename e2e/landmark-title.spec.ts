import { test, expect, type Page } from '@playwright/test'
import { mockLogin } from './helpers/auth'
import { muteTts } from './helpers/tts'

// Cổng (b) của audit UI/UX 2026-09-30 (mục 11) — hai lỗi axe KHÔNG bắt được:
// - M7 (WCAG 2.4.1): liên kết "Bỏ qua tới nội dung chính" trỏ `#noi-dung-chinh`, nhưng 9 route
//   không có phần tử đó (Trò chuyện và Luyện nói còn không có `<main>`), người dùng bàn phím
//   phải Tab qua ~39 mục thanh bên.
// - C8 (WCAG 2.4.2): 13 route dùng chung tiêu đề mặc định lỗi thời ("… Sự nghiệp · Công việc ·
//   Khởi nghiệp · Đời sống"), các trang khác lẫn 3 kiểu hậu tố.
// Mỗi route phải có ĐÚNG MỘT `<main id="noi-dung-chinh">`, tiêu đề tab riêng theo một khuôn hậu
// tố, và không trùng tiêu đề của route khác.

const BRAND = 'Đồng hành cùng bạn'

interface RouteCase {
  path: string
  /** Mảnh chữ tiêu đề phải có — chờ tới khi xuất hiện (trang tải dữ liệu rồi mới đặt tiêu đề). */
  title: string
}

const PUBLIC_ROUTES: RouteCase[] = [
  { path: '/login', title: 'Đăng nhập' },
  { path: '/reset-password?token=e2e-token', title: 'Đặt lại mật khẩu' },
]

const AUTHED_ROUTES: RouteCase[] = [
  // M7 — 7 route từng thiếu đích skip link (2 route công khai ở trên; /avatar-demo kiểm riêng
  // bằng phiên admin ở dưới)
  { path: '/bat-dau', title: 'Bắt đầu' },
  { path: '/nang-cap', title: 'Nâng cấp VIP' },
  { path: '/tin-nhan', title: 'Tin nhắn' },
  { path: '/goc-hoc-tap/english/tro-truyen', title: 'Trò chuyện với gia sư AI' },
  { path: '/goc-hoc-tap/english/luyen-noi', title: 'Luyện nói song ngữ' },
  { path: '/lap-trinh/chay-thu', title: 'Môn Lập trình' },
  // C8 — 11 trang từng không đặt tiêu đề riêng
  { path: '/ghi-chu', title: 'Ghi chú' },
  { path: '/goc-hoc-tap/physics', title: 'Vật l' },
  { path: '/lo-trinh-hoc/a1', title: 'Trình độ A1' },
  { path: '/lap-trinh/huong/web--lap-trinh-web', title: 'Môn Lập trình' },
  {
    path: '/lap-trinh/huong/web--lap-trinh-web/web-s2--full-stack-co-backend-cua-minh',
    title: 'Môn Lập trình',
  },
  { path: '/lap-trinh/khoa-hoc/git--git-github-thuc-hanh', title: 'Môn Lập trình' },
  { path: '/lap-trinh/lo-trinh/principal-ai', title: 'Lộ trình:' },
  { path: '/lap-trinh/lo-trinh/principal-ai/chan-doan', title: 'Chẩn đoán:' },
  { path: '/lap-trinh/p1', title: 'Bậc P1' },
  { path: '/lap-trinh/bai-hoc/p1-u4-l1', title: 'Môn Lập trình' },
]

/** Kiểm một route; trả về tiêu đề tab để so trùng giữa các route. */
async function checkRoute(page: Page, { path, title }: RouteCase): Promise<string> {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await expect(
    page.locator('main#noi-dung-chinh'),
    `${path}: thiếu <main id="noi-dung-chinh">`,
  ).toHaveCount(1)
  await expect
    .poll(() => page.title(), { message: `${path}: tiêu đề phải chứa "${title}"` })
    .toContain(title)
  const tab = await page.title()
  expect(tab, `${path}: tiêu đề phải kết thúc bằng thương hiệu`).toMatch(
    new RegExp(`[|·] ${BRAND}$`),
  )
  expect(tab, `${path}: tiêu đề còn nhắc trụ đã xoá`).not.toMatch(/Sự nghiệp|Khởi nghiệp|Đời sống/)
  return tab
}

test.describe('mọi route có <main id="noi-dung-chinh"> và tiêu đề riêng (audit C8 + M7)', () => {
  test('trang công khai', async ({ page }) => {
    const titles = new Map<string, string>()
    for (const route of PUBLIC_ROUTES) titles.set(route.path, await checkRoute(page, route))
    expect(new Set(titles.values()).size, 'hai trang công khai trùng tiêu đề').toBe(titles.size)
  })

  test('trang sau đăng nhập — đích skip link, tiêu đề riêng, không trùng', async ({ page }) => {
    test.setTimeout(180_000)
    await mockLogin(page, 'vi', 'blue-sky')
    await muteTts(page)
    const titles = new Map<string, string>()
    for (const route of AUTHED_ROUTES) titles.set(route.path, await checkRoute(page, route))
    const seen = new Map<string, string>()
    for (const [path, tab] of titles) {
      expect(seen.get(tab), `"${tab}" trùng giữa ${seen.get(tab)} và ${path}`).toBeUndefined()
      seen.set(tab, path)
    }
  })

  // [audit 2026-09-30 minor 5] /avatar-demo nay CHỈ admin — kiểm riêng bằng phiên admin, và
  // người dùng thường gõ URL thì bị đưa về Trang chủ.
  test('/avatar-demo: admin vào được — đích skip link + tiêu đề riêng', async ({ page }) => {
    await mockLogin(page, 'vi', 'blue-sky', { isAdmin: true })
    await muteTts(page)
    await checkRoute(page, { path: '/avatar-demo', title: 'Demo avatar' })
  })

  test('/avatar-demo: người dùng không phải admin bị chuyển về Trang chủ', async ({ page }) => {
    await mockLogin(page, 'vi', 'blue-sky')
    await muteTts(page)
    await page.goto('/avatar-demo', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/$/)
  })

  test('liên kết "Bỏ qua tới nội dung chính" đưa tiêu điểm vào <main> ở trang Trò chuyện', async ({
    page,
  }) => {
    await mockLogin(page, 'vi', 'blue-sky')
    await muteTts(page)
    await page.goto('/goc-hoc-tap/english/tro-truyen', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main#noi-dung-chinh')).toHaveCount(1)
    await page.keyboard.press('Tab')
    const skip = page.locator(':focus')
    await expect(skip).toHaveAttribute('href', '#noi-dung-chinh')
    await page.keyboard.press('Enter')
    await expect(page.locator('main#noi-dung-chinh')).toBeFocused()
  })
})
