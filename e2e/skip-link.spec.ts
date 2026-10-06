// E2E: "Bỏ qua tới nội dung chính" — WCAG 2.4.1 Bypass Blocks (mức A).
//
// Mọi trang đều có sidebar cố định (~15 mục) cộng header. Người dùng bàn phím muốn tới nội
// dung phải Tab qua toàn bộ khối đó, MỖI LẦN đổi trang. Đo thật ở 1440px: trang cấp CEFR có
// 137 điểm dừng Tab, các trang khác 26–59 — phần đầu luôn là cùng một menu.
//
// Cổng axe của dự án vẫn xanh trước khi có liên kết này, vì luật `bypass` chấp nhận landmark
// `<main>` là đủ. Nhưng landmark chỉ giúp người dùng TRÌNH ĐỌC MÀN HÌNH; người dùng bàn phím
// thuần không có cách nào bỏ qua menu. Test này canh phần mà axe không canh.
import { test, expect } from '@playwright/test'
import { mockLogin } from './helpers/auth'

test('Tab lần đầu là skip link, Enter đưa tiêu điểm thẳng vào nội dung', async ({ page }) => {
  await mockLogin(page)
  await page.setViewportSize({ width: 1440, height: 1000 })
  // Chọn trang NHIỀU điểm dừng Tab nhất — nơi liên kết này có giá trị rõ nhất.
  await page.goto('/lo-trinh-hoc/a1')
  await expect(page.getByRole('button', { name: /Lộ trình CEFR/ }).first()).toBeVisible()

  // 1) Điểm dừng Tab ĐẦU TIÊN của trang phải là skip link. Bản đầu đặt nó trong `Layout` và
  //    đo ra sai: `DesktopSidebar` render TRƯỚC `Layout` nên Tab lần 1 rơi vào logo sidebar,
  //    tức liên kết vô dụng. Nay đặt trong `App`, ngay trước `DesktopSidebar`.
  await page.keyboard.press('Tab')
  const focused = page.locator(':focus')
  await expect(focused).toHaveText(/Bỏ qua tới nội dung chính|Skip to main content/)

  // 2) Nó phải HIỆN RA khi có tiêu điểm (sr-only lúc bình thường). Kích thước > 0 là bằng
  //    chứng: `display:none` sẽ cho 0 và cũng gỡ luôn khỏi thứ tự Tab.
  const box = await focused.boundingBox()
  expect(box?.width ?? 0).toBeGreaterThan(50)
  expect(box?.height ?? 0).toBeGreaterThan(20)

  // 3) Enter đưa TIÊU ĐIỂM (không chỉ cuộn màn hình) vào vùng nội dung chính — và KHÔNG gắn
  //    `#noi-dung-chinh` vào URL (trang bài học đọc hash làm đích điều hướng trong bài).
  await page.keyboard.press('Enter')
  await expect(page.locator(':focus')).toHaveAttribute('id', 'noi-dung-chinh')
  expect(await page.evaluate(() => location.hash)).toBe('')

  // 4) Và Tab kế tiếp rơi vào phần tử BÊN TRONG nội dung, không quay về menu — đây mới là
  //    điều người dùng thật sự cần; ba bước trên chỉ vô nghĩa nếu bước này sai.
  await page.keyboard.press('Tab')
  const inMain = await page.locator(':focus').evaluate((el) => !!el.closest('main'))
  expect(inMain, 'phím Tab sau khi bỏ qua phải ở trong <main>').toBe(true)
})

test('skip link KHÔNG hiện khi chưa có tiêu điểm', async ({ page }) => {
  await mockLogin(page)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/tien-do')
  const link = page.getByRole('link', { name: /Bỏ qua tới nội dung chính/ })
  // Vẫn nằm trong DOM (phải thế, nếu không sẽ không nhận được tiêu điểm), nhưng thu về
  // kích thước 1px của `sr-only` nên người dùng chuột không bao giờ thấy.
  await expect(link).toBeAttached()
  const box = await link.boundingBox()
  expect(box?.width ?? 99).toBeLessThan(5)
})

// [Trả nợ S03-2, 2026-09-15] Hai test trên chỉ chạy ở trang có `PageShell` — nơi
// `MAIN_CONTENT_ID` được đặt sẵn. Các trang TỰ DỰNG `<main>` không đi qua `PageShell`, và
// `/welcome` + `/learn-vietnamese` đã thiếu `id` suốt: skip link render toàn cục ở `App.tsx`
// nên nó VẪN hiện ra, người dùng bàn phím vẫn bấm Enter, và không có gì xảy ra — hỏng lặng
// lẽ, không cổng nào đỏ. Danh sách cố định, cùng lý do với mobile-layout-guards: trang mới
// tự dựng `<main>` phải được thêm vào đây một cách CÓ Ý THỨC.
const TRANG_TU_DUNG_MAIN = ['/welcome', '/learn-vietnamese']

for (const route of TRANG_TU_DUNG_MAIN) {
  test(`${route} — đích của skip link tồn tại và nhận được tiêu điểm`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(route)

    // 1) Đích phải TỒN TẠI. Thiếu bước này thì mọi thứ dưới đây vẫn xanh một cách vô nghĩa.
    const main = page.locator('#noi-dung-chinh')
    await expect(main).toBeAttached()
    expect(await main.evaluate((el) => el.tagName)).toBe('MAIN')

    // 2) Và phải nhận được tiêu điểm bằng mã (`tabIndex={-1}`): thiếu thuộc tính đó thì bấm
    //    Enter chỉ CUỘN màn hình còn tiêu điểm vẫn kẹt trên thanh điều hướng, nên phím Tab
    //    tiếp theo lại quay về đầu menu — đúng cái mà skip link sinh ra để tránh.
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toHaveText(
      /Bỏ qua tới nội dung chính|Skip to main content/,
    )
    await page.keyboard.press('Enter')
    await expect(page.locator(':focus')).toHaveAttribute('id', 'noi-dung-chinh')
  })
}

// [2026-09-25] Trang bài có cột mục lục TRÁI (`TwoPane railSide="left"`): cột đó nằm TRONG
// `<main>` và đứng trước nội dung, nên riêng skip link trên vẫn để lại ~20 điểm dừng trong cây
// mục lục. Đo trước sửa: bài Vật lí mất 52 Tab tới "Lý thuyết"; sau sửa 5.
test('trang bài có mục lục trái: liên kết thứ hai bỏ qua mục lục, tiêu điểm không bị header che', async ({
  page,
}) => {
  await mockLogin(page)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/goc-hoc-tap/physics/bai-hoc/ly10-c2-b10--su-roi-tu-do')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')
  const boQua = page.locator(':focus')
  await expect(boQua).toHaveText('Bỏ qua mục lục, tới nội dung')
  expect((await boQua.boundingBox())?.width ?? 0).toBeGreaterThan(50)

  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')
  const dich = page.locator(':focus')
  // Rơi vào cột NỘI DUNG, không vào cây mục lục; URL không bị gắn hash lạ.
  expect(await dich.evaluate((el) => !el.closest('aside') && !!el.closest('main'))).toBe(true)
  expect(await page.evaluate(() => location.hash)).toBe('')
  // Không bị header sticky che (WCAG 2.4.11): mép trên của phần tử nằm dưới đáy header.
  const dayHeader = await page.evaluate(
    () => document.querySelector('header')?.getBoundingClientRect().bottom ?? 0,
  )
  expect((await dich.boundingBox())?.y ?? 0).toBeGreaterThanOrEqual(dayHeader)

  // Tới "Lý thuyết" của mục "Trong bài" chỉ còn vài Tab (trước sửa: 52 từ đầu trang).
  // Đã bấm 3 lần Tab (Enter không tính).
  let soTab = 3
  while (
    !/^Lý thuyết$/.test((await page.locator(':focus').textContent())?.trim() ?? '') &&
    soTab < 12
  ) {
    await page.keyboard.press('Tab')
    soTab += 1
  }
  expect(soTab).toBeLessThanOrEqual(5)
})
