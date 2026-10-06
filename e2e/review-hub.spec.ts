// E2E: hub ôn tập xuyên môn `/goc-hoc-tap/on-tap` (S12-1, AC-5 + AC-7).
//
// Ba thứ chỉ trình duyệt thật mới chốt được: hàng đợi RỖNG không phải màn trắng, hàng đợi có
// thẻ của NHIỀU môn thì gộp đúng và dẫn đúng chỗ, và luồng "quay lại sau khi bỏ bẵng" nay trỏ
// về hub với cap 5 thay vì chỉ SRS môn Anh.
import { test, expect, type Page } from '@playwright/test'
import { mockLogin, USER_ID } from './helpers/auth'

/** Một thẻ FSRS đã QUÁ HẠN — đủ trường mà lib/srs.ts đọc. */
function theQuaHan(due: number, difficulty = 5) {
  return {
    due,
    stability: 1,
    difficulty,
    elapsed_days: 1,
    scheduled_days: 1,
    learning_steps: 0,
    reps: 2,
    lapses: 0,
    state: 2,
    last_review: due - 86_400_000,
  }
}

/** Gieo kho SRS `srs_<uid>` trước khi trang tải (đúng key của lib/srs.ts). */
async function seedSrs(page: Page, cards: Record<string, ReturnType<typeof theQuaHan>>) {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: `srs_${USER_ID}`,
    value: cards,
  })
}

/** Ngày theo giờ VN (khớp lib/date.ts vnDateStr) — để giả "đã vắng n ngày". */
function vnDateOffset(offsetDays: number): string {
  const ms = Date.now() - offsetDays * 86400000 + 7 * 3600000
  return new Date(ms).toISOString().slice(0, 10)
}

test('hàng đợi rỗng (đã có thẻ, chưa tới hạn) → nói rõ bằng chữ + có lối "Học tiếp", không phải màn trắng', async ({
  page,
}) => {
  // Một thẻ hạn NGÀY MAI: người này đã học, chỉ là hôm nay chưa có gì đến hạn.
  await seedSrs(page, { apple: theQuaHan(Date.now() + 86_400_000) })
  await mockLogin(page, 'vi')
  await page.goto('/goc-hoc-tap/on-tap', { waitUntil: 'domcontentloaded' })

  const trangThai = page.getByRole('status')
  await expect(trangThai).toContainText('Hôm nay không có gì đến hạn')
  await expect(page.getByRole('link', { name: /Học tiếp/ })).toBeVisible()
})

// [U9b, audit 2026-09-30 M19] Người chưa học gì không được bảo "quay lại ngày mai".
test('người chưa học gì → không hứa "ngày mai", chỉ lối bắt đầu vào đúng môn đã chọn', async ({
  page,
}) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, 'english'),
    `dhcb_onboarding_subject_${USER_ID}`,
  )
  await mockLogin(page, 'vi')
  await page.goto('/goc-hoc-tap/on-tap', { waitUntil: 'domcontentloaded' })

  const trangThai = page.getByRole('status')
  await expect(trangThai).toContainText('Chưa có gì để ôn')
  await expect(trangThai).not.toContainText('ngày mai')
  const batDau = page.getByRole('link', { name: 'Bắt đầu học bài đầu tiên' })
  await expect(batDau).toHaveAttribute('href', '/goc-hoc-tap/english')
})

test('có thẻ của 3 nguồn → gộp thành các nhóm môn, mỗi nhóm dẫn tới màn ôn của môn đó', async ({
  page,
}) => {
  const qua = Date.now() - 86_400_000
  await seedSrs(page, {
    apple: theQuaHan(qua),
    'grammar:a1-be': theQuaHan(qua - 1000),
    'prog:p1-u1-l1:0': theQuaHan(qua - 2000),
    'stem:physics:ly10-c1-b1:0': theQuaHan(qua - 3000),
  })
  await mockLogin(page, 'vi')
  await page.goto('/goc-hoc-tap/on-tap', { waitUntil: 'domcontentloaded' })

  // Ba môn có mục đến hạn — nhóm nào cũng nói số mục bằng CHỮ, không chỉ bằng màu.
  await expect(page.getByRole('link', { name: /Tiếng Anh/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Lập trình/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Vật lí/ })).toBeVisible()

  // Bấm nhóm Vật lí → màn ôn thẻ của đúng môn đó (không phải màn ôn của môn khác).
  await page.getByRole('link', { name: /Vật lí/ }).click()
  await expect(page).toHaveURL(/\/goc-hoc-tap\/physics\/on-tap/)
})

test('?cap= cắt số mục của phiên và nói còn bao nhiêu mục sau phiên này', async ({ page }) => {
  const qua = Date.now() - 86_400_000
  const cards: Record<string, ReturnType<typeof theQuaHan>> = {}
  for (let i = 0; i < 6; i++) cards[`w${i}`] = theQuaHan(qua - i * 1000)
  await seedSrs(page, cards)
  await mockLogin(page, 'vi')
  await page.goto('/goc-hoc-tap/on-tap?cap=2', { waitUntil: 'domcontentloaded' })

  await expect(page.getByText(/2 mục trong phiên này/)).toBeVisible()
  await expect(page.getByText(/còn 4 mục sau phiên này/)).toBeVisible()
})

test('quay lại sau khi bỏ bẵng: nút "Ôn thẻ" trỏ về hub với cap 5', async ({ page }) => {
  const date = vnDateOffset(5)
  await page.addInitScript(
    ({ usageKey, usage, learnedKey }) => {
      localStorage.setItem(usageKey, JSON.stringify(usage))
      // Usage là đa miền; cần bằng chứng English riêng để CTA comeback này hợp lệ.
      localStorage.setItem(learnedKey, JSON.stringify(['apple']))
    },
    {
      usageKey: `et_usage_${USER_ID}_${date}`,
      usage: { date, chatCount: 0, writingCount: 0, speakingCount: 0, learnCount: 1 },
      learnedKey: `et_learned_${USER_ID}`,
    },
  )
  await seedSrs(page, { apple: theQuaHan(Date.now() - 86_400_000) })
  await mockLogin(page, 'vi')
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: /Ôn 1 thẻ/ }).click()
  await expect(page).toHaveURL(/\/goc-hoc-tap\/on-tap\?cap=5/)
})

const stemFixtures = [
  { subject: 'mathematics', lesson: 'toan10-c1-b1', question: 'Khi nào mệnh đề P ⇒ Q sai?' },
  {
    subject: 'physics',
    lesson: 'ly10-c1-b1',
    question: 'Hai phương pháp nghiên cứu cơ bản của Vật lí học là gì?',
  },
  {
    subject: 'chemistry',
    lesson: 'hoa10-c2-b5',
    question: 'Nguyên tố xếp trong bảng tuần hoàn theo chiều tăng dần đại lượng gì?',
  },
  {
    subject: 'biology',
    lesson: 'sinh10-c1-b1',
    question: 'Đối tượng nghiên cứu của Sinh học là gì?',
  },
]

for (const fixture of stemFixtures) {
  test(`S03: ${fixture.subject} lọc trước cap=1 và mở đúng bài`, async ({ page }) => {
    const due = Date.now() - 86_400_000
    const cards = Object.fromEntries(
      stemFixtures.map((other) => [
        `stem:${other.subject}:${other.lesson}:0`,
        theQuaHan(due - (other.subject === fixture.subject ? 0 : 1000)),
      ]),
    )
    await seedSrs(page, cards)
    await mockLogin(page, 'vi')
    await page.goto(`/goc-hoc-tap/${fixture.subject}/on-tap?cap=1`)
    await expect(page.getByText(fixture.question, { exact: true })).toBeVisible()
    for (const other of stemFixtures.filter((other) => other.subject !== fixture.subject)) {
      await expect(page.getByText(other.question, { exact: true })).toHaveCount(0)
    }
    await page.getByRole('button', { name: 'Mở lại bài này' }).click()
    await expect(page).toHaveURL(
      new RegExp(`/goc-hoc-tap/${fixture.subject}/bai-hoc/${fixture.lesson}--`),
    )
  })
}

test('S03: môn rỗng không mượn thẻ môn khác', async ({ page }) => {
  await seedSrs(page, { 'stem:physics:ly10-c1-b1:0': theQuaHan(Date.now() - 86_400_000) })
  await mockLogin(page, 'vi')
  await page.goto('/goc-hoc-tap/chemistry/on-tap?cap=1')
  await expect(page.getByText('Hôm nay không có thẻ nào tới hạn')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Xem bài học môn Hoá học' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Xem đáp án' })).toHaveCount(0)
})
