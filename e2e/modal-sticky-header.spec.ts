import { test, expect, type Locator } from '@playwright/test'
import { mockLogin } from './helpers/auth'
import { mockDomainApis } from './helpers/domains'

// ── CỔNG: TIÊU ĐỀ DÍNH CỦA `Modal` KHÔNG ĐƯỢC CHE NỘI DUNG ─────────────────────
//
// Bẫy đã mắc BA lần (xem TRAPS.md): header dính của `Modal` từng được kéo lên bằng `-mt-6`
// để dải nền chạm mép khung. Margin âm làm header chiếm trong LUỒNG ít hơn chiều cao thật
// đúng 24px, nên phần tử ngay sau nó bị che 24px — dòng đầu nội dung biến mất.
//
// VÌ SAO PHẢI LÀ E2E, VÀ VÌ SAO KHÔNG TÌM THEO CHỮ: DOM vẫn có đủ chữ, `toBeVisible()` vẫn
// đúng (phần tử không `display:none`, không `opacity:0`, vẫn trong khung nhìn), và
// `getBoundingClientRect` trả chiều cao đúng. Mọi test tìm theo text đều XANH trong khi
// người dùng không đọc được dòng đầu. Thứ duy nhất phân biệt được là QUAN HỆ HÌNH HỌC giữa
// hai phần tử — và nó chỉ tồn tại khi có bố cục thật, tức phải chạy trong trình duyệt.
//
// Đo `bottom` của header so với `top` của phần tử nội dung ngay sau nó, ở trạng thái CHƯA
// CUỘN (cuộn rồi thì header che nội dung là ĐÚNG — đó là điểm của sticky).

/** Dương = nội dung bị header che bấy nhiêu px. */
async function doChongLan(dialog: Locator): Promise<number> {
  const so = await dialog.evaluate((el) => {
    const header = el.firstElementChild as HTMLElement | null
    const noiDung = header?.nextElementSibling as HTMLElement | null
    if (!header || !noiDung) return null
    if (getComputedStyle(header).position !== 'sticky') return null
    return header.getBoundingClientRect().bottom - noiDung.getBoundingClientRect().top
  })
  // `null` = cấu trúc Modal đã đổi khác giả định → test phải ĐỎ, không được lặng lẽ bỏ qua.
  expect(so, 'không đọc được hình học header/nội dung của hộp thoại').not.toBeNull()
  return so as number
}

// Dung sai 0,5px cho làm tròn sub-pixel của trình duyệt; 24px của bẫy thì vượt xa ngưỡng này.
const DUNG_SAI = 0.5

test.describe('tiêu đề dính của Modal không che nội dung', () => {
  for (const w of [1440, 390, 320]) {
    test(`dáng center @${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: w === 1440 ? 900 : 844 })
      await mockLogin(page, 'vi', 'dark-blue')
      await mockDomainApis(page)
      await page.goto('/ghi-chu', { waitUntil: 'domcontentloaded' })

      // [2026-09-20] Trang "Sự nghiệp" đã bị gỡ; dùng hộp thoại "Tạo dự án mới" của trang
      // "Ghi chú" — cùng dáng Modal center, vẫn canh đúng thứ lỗi này từng làm biến mất.
      // Nút chỉ hiện ở tab "Dự án" (mặc định trang mở ở tab "Công việc") nên phải chuyển tab
      // trước khi chờ nút.
      await page.getByRole('button', { name: /Dự án \(\d+\)/ }).click()
      const nut = page.getByRole('button', { name: 'Tạo dự án mới', exact: true }).first()
      await nut.waitFor()
      await nut.click()

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      // Nhãn của ô ĐẦU TIÊN chính là thứ từng biến mất — canh luôn cho cụ thể.
      await expect(dialog.getByText('Tên dự án', { exact: false })).toBeVisible()
      expect(await doChongLan(dialog)).toBeLessThanOrEqual(DUNG_SAI)
    })
  }

  test('dáng sheet @390px (panel Mục lục môn học)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await mockLogin(page, 'vi', 'dark-blue')
    await page.goto('/goc-hoc-tap/physics/bai-hoc/ly10-c2-b10--su-roi-tu-do', {
      waitUntil: 'domcontentloaded',
    })

    const nut = page.getByRole('button', { name: 'Mục lục môn học' })
    await nut.waitFor()
    await nut.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    // Chờ theo TRẠNG THÁI (cây đã hiện), không theo thời gian.
    await expect(dialog.getByRole('link').first()).toBeVisible()
    expect(await doChongLan(dialog)).toBeLessThanOrEqual(DUNG_SAI)
  })

  test('cuộn xuống thì header VẪN dính ở mép trên (không phá tính năng cũ)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await mockLogin(page, 'vi', 'dark-blue')
    await page.goto('/goc-hoc-tap/physics/bai-hoc/ly10-c2-b10--su-roi-tu-do', {
      waitUntil: 'domcontentloaded',
    })
    await page.getByRole('button', { name: 'Mục lục môn học' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('link').first()).toBeVisible()

    const truoc = await dialog.evaluate(
      (el) => (el.firstElementChild as HTMLElement).getBoundingClientRect().top,
    )
    await dialog.evaluate((el) => el.scrollBy(0, 400))
    const sau = await dialog.evaluate(
      (el) => (el.firstElementChild as HTMLElement).getBoundingClientRect().top,
    )
    // Dính = cuộn 400px mà header không nhúc nhích khỏi mép trên vùng cuộn.
    expect(Math.abs(sau - truoc)).toBeLessThanOrEqual(DUNG_SAI)
  })
})
