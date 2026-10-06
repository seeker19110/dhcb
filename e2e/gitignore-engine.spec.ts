import { test, expect } from '@playwright/test'
import { mockLogin } from './helpers/auth'

// PR A dùng bài Git hiện có: CodeMirror, runner và phản hồi chấm thật.
// Chưa thay tiêu chí bài học legacy; assertion state dành cho PR nội dung kế tiếp.
test('Git ignore qua trang bài thật: giữ file, bỏ khỏi add, báo pattern lỗi và giữ sample legacy', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/lap-trinh/bai-hoc/p3-u11-l1#make', { waitUntil: 'domcontentloaded' })
  const editor = page.getByRole('textbox', { name: 'Ô gõ lệnh bài tự viết' })
  await expect(editor).toBeVisible({ timeout: 30_000 })
  await expect(editor).toHaveClass(/cm-content/)

  // Cố ý bỏ cat .gitignore: ca công khai đầu không đạt và hiện transcript để đối chiếu.
  // Secret là chữ giả. Việc đọc được sau commit chứng minh ignore không xóa workdir.
  await editor.fill(
    [
      'git init',
      'echo "# Quan cua toi" > README.md',
      'echo "FAKE_ONLY_WORKDIR" > .env',
      'echo ".env" > .gitignore',
      'echo "__pycache__/" >> .gitignore',
      'git add .',
      'git commit -m "Chuan hoa cau truc"',
      'cat .env',
      'git status',
      'ls',
    ].join('\n'),
  )
  await page.getByRole('button', { name: 'Chấm bài', exact: true }).click()
  const actual = page
    .locator('p')
    .filter({ hasText: /^Máy của bạn in ra:/ })
    .locator('code')
    .first()
  await expect(actual).toContainText('[main c1] Chuan hoa cau truc\n 2 file trong ban chup')
  await expect(actual).toContainText('$ cat .env\nFAKE_ONLY_WORKDIR')
  await expect(actual).toContainText('Khong co gi de commit, thu muc lam viec sach')
  await expect(actual).toContainText('$ ls\n.env\n.gitignore\nREADME.md')
  await expect(page.getByText('Đạt toàn bộ test!', { exact: true })).not.toBeVisible()

  // Cú pháp ngoài subset phải thành lỗi nhìn thấy được, không silently bỏ qua.
  await editor.fill('git init\necho "!*.pt" > .gitignore\necho "fake" > model.pt\ngit add .')
  await page.getByRole('button', { name: 'Chấm bài', exact: true }).click()
  const publicError = page.locator('ul[aria-live="polite"] li').first().locator('pre')
  await expect(publicError).toContainText('.gitignore dong 1: pattern "!*.pt" ngoai subset')
  await expect(publicError).toContainText('basename literal, mot *, hoac thu muc literal/')
  await expect(page.getByText('Đạt toàn bộ test!', { exact: true })).not.toBeVisible()

  // Code mẫu gốc vẫn đi qua editor và grader thật; không sửa lesson/registry hoặc mock runner.
  await page.getByRole('button', { name: 'Xem code mẫu', exact: true }).click()
  await expect(editor).toContainText('git commit -m "Chuan hoa cau truc"')
  await page.getByRole('button', { name: 'Chấm bài', exact: true }).click()
  await expect(page.getByText('Đạt toàn bộ test!', { exact: true })).toBeVisible()
  await expect(page.getByText('Đã chấm xong 4 ca: đạt 4/4.', { exact: true })).toBeVisible()
})
