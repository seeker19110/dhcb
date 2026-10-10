// E2E: bài kiểm tra đang làm dở KHÔNG mất khi chuyển tab.
//
// Trước đây tiến trình nằm hoàn toàn trong state của component, nên đổi tab là component bị gỡ
// khỏi cây và làm dở 9/10 câu cũng mất trắng. Luật lưu/đọc phiên đã có test thuần ở
// `apps/dhcb/src/lib/quizSession.test.ts`; test này canh phần LẮP RÁP — thứ mà unit test không
// thấy được: state có thật sự khôi phục đúng khi component dựng lại hay không.
import { test, expect } from '@playwright/test'
import { mockLogin, USER_ID } from './helpers/auth'

const LEARNED = [
  'hello',
  'water',
  'book',
  'house',
  'friend',
  'school',
  'happy',
  'green',
  'city',
  'music',
]

test('làm dở bài kiểm tra, đổi tab rồi quay lại thì học tiếp đúng chỗ', async ({ page }) => {
  await mockLogin(page)
  await page.addInitScript(
    ([uid, words]) => {
      localStorage.setItem(`et_learned_${uid}`, JSON.stringify(words))
    },
    [USER_ID, LEARNED] as const,
  )
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/lo-trinh-hoc/a1?tab=quiz')

  const counter = page.locator('text=/CÂU \\d+\\/10/i').first()
  await expect(counter).toBeVisible()

  // Trả lời 3 câu bằng bàn phím (1 = chọn đáp án đầu, Enter = sang câu tiếp).
  // Chờ theo TRẠNG THÁI ở từng bước (nút "Câu tiếp theo" hiện ra, rồi số câu đổi) chứ không
  // chờ cứng theo thời gian: bấm liên tiếp quá nhanh thì React chưa kịp dựng lại câu mới.
  for (let i = 1; i <= 3; i++) {
    await page.keyboard.press('1')
    await expect(page.getByRole('button', { name: /Câu tiếp theo|Xem kết quả/ })).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(counter).toHaveText(new RegExp(`Câu ${i + 1}/10`, 'i'))
  }

  await page
    .getByRole('button', { name: /Từ khó/ })
    .first()
    .click()
  await expect(counter).toHaveCount(0)

  await page
    .getByRole('button', { name: /Kiểm tra/ })
    .first()
    .click()
  // Điểm mấu chốt: quay lại đúng câu 4, KHÔNG phải câu 1.
  await expect(page.locator('text=/CÂU \\d+\\/10/i').first()).toHaveText(/Câu 4\/10/i)
})

// ── P1-6 `SessionDone` · AC-4 ────────────────────────────────────────────────
// Đặc tả: docs/specs/2026-09-17-redesign-trang-chu-thi-hanh.md §P1-6 ④ AC-4:
//   "Mở overlay → URL có ?xong=1; reload (E2E) → overlay vẫn hiện; đóng → query mất."
// Unit test không thấy được phần này: `history.replaceState` + đọc lại `?xong=1` lúc mount chỉ
// chứng minh được khi trình duyệt THẬT tải lại trang.
test('SessionDone: mở overlay gắn ?xong=1, reload vẫn hiện, đóng thì query mất', async ({
  page,
}) => {
  await mockLogin(page)
  await page.addInitScript((uid) => {
    // Tốc độ 5 từ/lượt (khoá có sẵn trong lib/curriculum.ts) — gieo MỖI lần nạp trang: giá trị
    // không đổi nên lặp lại lúc reload là vô hại (không đụng tiến độ học đã ghi).
    localStorage.setItem(`et_speed_${uid}`, '5')
  }, USER_ID)
  await page.setViewportSize({ width: 1440, height: 1000 })
  // `cap=2`: lượt đầu chỉ 2 từ (luồng "quay lại" của lib/comeback.ts) cho test ngắn gọn.
  await page.goto('/lo-trinh-hoc/a1?tab=today&cap=2')

  const dialog = page.getByRole('dialog')
  await expect(dialog).toHaveCount(0)

  // Học hết batch: bấm "Đã thuộc" cho tới khi overlay mở (không cứng 2 lần — chờ theo trạng thái).
  const gotIt = page.getByRole('button', { name: /Đã thuộc/ })
  await expect(gotIt).toBeVisible()
  for (let i = 0; i < 2; i++) {
    await gotIt.click()
  }

  // 1) Overlay mở → URL có xong=1.
  await expect(dialog).toBeVisible()
  await expect(page).toHaveURL(/[?&]xong=1(&|$)/)

  // 2) Reload → overlay vẫn hiện, query vẫn còn.
  await page.reload()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page).toHaveURL(/[?&]xong=1(&|$)/)

  // 3) Đóng bằng nút chính "Về trang chủ" → dialog biến mất, query xong mất khỏi URL.
  await page.getByRole('dialog').getByRole('button', { name: 'Về trang chủ' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).not.toHaveURL(/[?&]xong=/)
})
