import type { Page } from '@playwright/test'

// Tắt animation/transition trước khi quét để axe đo TRẠNG THÁI CUỐI, không bắt
// nhằm khung giữa của `animate-fade-in` (opacity 0→1) — lúc opacity ~0.6 màu chữ
// trộn nền làm contrast tụt → vi phạm chập chờn (flaky).
// Ép duration 0s: hoạt ảnh `both` nhảy thẳng tới khung cuối; ba hoạt ảnh xuất hiện (fade-in,
// fade-up, scale-in — fill-mode `backwards` từ changelog 0474) về ngay style gốc. Cả hai đều là
// trạng thái hiển thị đầy đủ (opacity 1).
export async function freezeAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content:
      '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}',
  })
  await page.waitForTimeout(100)
}

/**
 * Chờ cho tới khi DOM THÔI ĐỔI, thay vì chờ cứng một số giây.
 *
 * VÌ SAO CẦN (2026-09-03): cổng a11y trước đây gọi `waitForTimeout(1000)` rồi quét. Con số
 * đó là một CANH BẠC về tốc độ máy: đo thật trên máy phát triển lúc dev server còn nguội,
 * trang `/tien-do` sau 1 giây chưa render xong lịch hoạt động (`gridcells: 0`), nên axe quét
 * một trang gần như trống và báo **0 vi phạm** — trong khi CI, chạy đúng commit đó, bắt được
 * `aria-required-parent` trên 182 phần tử ở mức critical. Một cổng cho xanh giả còn nguy hiểm
 * hơn không có cổng, vì nó tạo niềm tin sai.
 *
 * Đo lại toàn bộ danh sách trang lúc server đã nóng: 20/21 trang render xong trong 1 giây,
 * riêng TRANG CHỦ mới có **56%** số phần tử (268/478) — tức phần lớn nội dung chưa tồn tại
 * lúc quét. Vì độ trễ phụ thuộc máy và độ "nóng" của server, không có con số cứng nào đúng
 * cho mọi lần chạy; phải chờ theo TRẠNG THÁI.
 *
 * Cách đo: đếm số phần tử trong DOM, coi là ổn định khi con số đó không đổi qua `stableTicks`
 * lần đo liên tiếp. Đơn giản hơn `networkidle` và bắt được cả phần render sau khi đọc
 * localStorage (không có request mạng nào để mà chờ).
 */
export async function waitForStableDom(
  page: Page,
  {
    interval = 200,
    stableTicks = 3,
    timeout = 15_000,
  }: {
    interval?: number
    stableTicks?: number
    timeout?: number
  } = {},
): Promise<void> {
  const deadline = Date.now() + timeout
  let last = ''
  let same = 0
  while (Date.now() < deadline) {
    // [2026-09-24] Ba điều kiện, không chỉ số phần tử: (1) số phần tử, (2) URL — trang chuyển
    // hướng về URL chuẩn (`<Navigate replace>`) sẽ dựng lại cả Layout SAU khi đếm đã đứng yên,
    // (3) KHÔNG còn khung chờ `[data-page-loading]` của Suspense — skeleton đứng yên đủ 3 nhịp khi
    // dev server/CI chậm, trước đây bị coi là "ổn định" và cổng AAA quét giữa lúc trang thay DOM
    // (đo được: `/lap-trinh/bai-hoc/p1-u4-l1` đỏ 6/8 lượt với 4 worker, "DOM changed during scan").
    const snap = await page.evaluate(() =>
      document.querySelector('[data-page-loading]')
        ? null
        : `${location.href}|${document.querySelectorAll('*').length}`,
    )
    same = snap !== null && snap === last ? same + 1 : 0
    last = snap ?? ''
    if (same >= stableTicks) return
    await page.waitForTimeout(interval)
  }
  // Hết giờ mà DOM vẫn đổi: KHÔNG ném lỗi. Trang có hoạt ảnh lặp vô hạn hoặc đồng hồ đếm
  // ngược sẽ không bao giờ "đứng yên", mà quét muộn vẫn tốt hơn quét sớm — ném lỗi ở đây chỉ
  // đổi một cổng xanh giả lấy một cổng đỏ giả.
}
