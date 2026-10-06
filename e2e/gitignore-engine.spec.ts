import { test, expect } from '@playwright/test'
import { mockLogin } from './helpers/auth'

// PR A dựng engine; lát B1 (spec 2026-10-05-gitignore-state-grading) thay rubric bài p3-u11-l1
// bằng tiêu chí trạng thái. Kiểm qua trang bài thật: CodeMirror, runner, kho mẫu và grader thật.
test('Git ignore qua trang bài thật: giữ file, bỏ khỏi status, báo pattern lỗi, chấm trạng thái', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/lap-trinh/bai-hoc/p3-u11-l1#make', { waitUntil: 'domcontentloaded' })
  const editor = page.getByRole('textbox', { name: 'Ô gõ lệnh bài tự viết' })
  await expect(editor).toBeVisible({ timeout: 30_000 })
  await expect(editor).toHaveClass(/cm-content/)

  const ignoreDung = [
    'echo ".env" > .gitignore',
    'echo "*.pt" >> .gitignore',
    'echo "*.pth" >> .gitignore',
    'echo "*.safetensors" >> .gitignore',
    'echo "__pycache__/" >> .gitignore',
  ]

  // Cố ý chưa commit: ca công khai đầu không đạt và hiện transcript để đối chiếu. Kho mẫu
  // (chữ giả) đã init sẵn nên git init lặp lại chỉ được báo, không lỗi. Đọc được .env chứng
  // minh ignore không xóa workdir; status chỉ còn hai file không bị bỏ qua.
  await editor.fill(['git init', ...ignoreDung, 'cat .env', 'git status', 'ls'].join('\n'))
  await page.getByRole('button', { name: 'Chấm bài', exact: true }).click()
  const actual = page
    .locator('p')
    .filter({ hasText: /^Máy của bạn in ra:/ })
    .locator('code')
    .first()
  await expect(actual).toContainText('$ git init\nThu muc nay da la kho git roi')
  await expect(actual).toContainText('$ cat .env\nAPI_KEY=khoa-gia-chi-de-hoc')
  await expect(actual).toContainText(
    'File chua duoc theo doi (can git add):\n  .gitignore\n  README.md\n$ ls',
  )
  await expect(actual).toContainText('$ ls\n.env\n.gitignore\nREADME.md')
  await expect(page.getByText('Đạt toàn bộ test!', { exact: true })).not.toBeVisible()

  // Commit đúng nhưng xóa .env để né: output có git commit, trạng thái thư mục vẫn rớt.
  await editor.fill(
    [...ignoreDung, 'rm .env', 'git add .', 'git commit -m "Chuan hoa cau truc"'].join('\n'),
  )
  await page.getByRole('button', { name: 'Chấm bài', exact: true }).click()
  await expect(
    page.getByText('Trang thai Git chua dat tieu chi cua ca cham.', { exact: true }).first(),
  ).toBeVisible()
  await expect(page.getByText('Đạt toàn bộ test!', { exact: true })).not.toBeVisible()

  // Cú pháp ngoài subset phải thành lỗi nhìn thấy được, không silently bỏ qua.
  await editor.fill('git init\necho "!*.pt" > .gitignore\necho "fake" > model.pt\ngit add .')
  await page.getByRole('button', { name: 'Chấm bài', exact: true }).click()
  const publicError = page.locator('ul[aria-live="polite"] li').first().locator('pre')
  await expect(publicError).toContainText('.gitignore dong 1: pattern "!*.pt" ngoai subset')
  await expect(publicError).toContainText('basename literal, mot *, hoac thu muc literal/')
  await expect(page.getByText('Đạt toàn bộ test!', { exact: true })).not.toBeVisible()

  // Code mẫu đi qua editor và grader thật; không mock runner.
  await page.getByRole('button', { name: 'Xem code mẫu', exact: true }).click()
  await expect(editor).toContainText('git commit -m "Chuan hoa cau truc"')
  await page.getByRole('button', { name: 'Chấm bài', exact: true }).click()
  await expect(page.getByText('Đạt toàn bộ test!', { exact: true })).toBeVisible()
  await expect(page.getByText('Đã chấm xong 7 ca: đạt 7/7.', { exact: true })).toBeVisible()
})
