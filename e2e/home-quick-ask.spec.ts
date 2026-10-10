// e2e/home-quick-ask.spec.ts — Luồng "hỏi nhanh trung thực" ở Trang chủ (slice S02).
//
// Đặc tả: docs/specs/2026-09-15-learning-ux-foundation.md §④ A.
//
// Canh hai thứ không cổng nào khác bắt được:
//   1. Ô hỏi nhanh KHÔNG được giả vờ trả lời. Bản trước hiện "đang phân tích và trích xuất lời
//      giải" rồi in đoạn văn viết sẵn — biên dịch sạch, lint sạch, ảnh chụp đẹp, và sai sự thật.
//   2. Đi từ Trang chủ sang nơi học KHÔNG được sinh ra lượt gọi AI tính phí nào. Đây là tiền
//      thật của dự án, nên đo bằng cách đếm request tới các endpoint AI.
import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockLogin, USER_ID, type ThemeName } from './helpers/auth'
import { freezeAnimations } from './helpers/axe'

const AI_ENDPOINTS = /\/api\/(agent|companion|tts|stt|chat)/

/**
 * Đếm các request SINH RA NỘI DUNG AI (tốn tiền) trong suốt bài test.
 *
 * Chỉ tính request không phải GET — và đây không phải chi tiết vụn vặt: `/api/companion` phục vụ
 * CẢ hai việc, GET là đọc lại lịch sử hội thoại đã lưu (miễn phí, chạy mỗi lần mở trang từ
 * trước tới nay), POST mới là gửi câu hỏi cho mô hình. Đếm cả GET thì test đỏ vì một hành vi
 * hoàn toàn đúng, và người sửa sau sẽ đi "vá" nhầm chỗ.
 */
function watchAiCalls(page: Page): string[] {
  const calls: string[] = []
  page.on('request', (req) => {
    if (req.method() !== 'GET' && AI_ENDPOINTS.test(req.url())) {
      calls.push(`${req.method()} ${req.url()}`)
    }
  })
  return calls
}

async function ask(page: Page, question: string) {
  const input = page.getByLabel('Câu hỏi của bạn')
  await input.fill(question)
  await page.getByLabel('Tìm nơi học cho câu hỏi này').click()
}

test('câu hỏi Toán chỉ nhận gợi ý nơi học, không nhận lời giải viết sẵn', async ({ page }) => {
  await mockLogin(page)
  const aiCalls = watchAiCalls(page)
  await page.goto('/')

  await ask(page, 'Giải phương trình x + 2 = 5')

  const panel = page.getByRole('region', { name: 'Gợi ý nơi học' })
  await expect(panel).toBeVisible()
  // Nguyên văn câu hỏi được giữ lại.
  await expect(panel).toContainText('Giải phương trình x + 2 = 5')
  await expect(panel).toContainText('Môn Toán')
  // Các chuỗi lời giải giả của bản cũ không được quay lại ở bất kỳ đâu trên trang.
  await expect(page.locator('body')).not.toContainText('bảng biến thiên')
  await expect(page.locator('body')).not.toContainText('Gợi ý Socratic')
  await expect(page.locator('body')).not.toContainText('Phản Hồi Nhanh AI')

  // Chỉ gợi ý thôi thì chưa đi đâu cả.
  await expect(page).toHaveURL(/\/$/)
  await panel.getByRole('button', { name: /^Mở Môn Toán$/ }).click()
  await expect(page).toHaveURL(/\/goc-hoc-tap\/mathematics/)

  expect(aiCalls, `không được gọi AI khi chỉ điều hướng: ${aiCalls.join(', ')}`).toEqual([])
})

// [P0-3, lệnh 4, 2026-09-17] Trang chủ khách nay là `GuestHome` (đặc tả
// `docs/specs/2026-09-17-redesign-trang-chu-thi-hanh.md` §P0-3, "Approved for implementation"):
// không còn render `HomeUniversalAiBar` cho khách — lối vào duy nhất là CTA "Bắt đầu — chọn việc
// đầu tiên" → `/bat-dau`. Bài test "khách hỏi nhanh ở Trang chủ" của slice S02 vì vậy không còn
// áp dụng được cho khách (ô hỏi không tồn tại trên `GuestHome`); bất biến "hỏi nhanh mời đăng
// nhập, câu hỏi không mất" vẫn được canh bởi 2 bài test còn lại trong file này (người đã đăng
// nhập, qua `mockLogin`).

test('tải lại trang không tự gửi câu hỏi cho AI', async ({ page }) => {
  await mockLogin(page)
  const aiCalls = watchAiCalls(page)
  await page.goto('/')
  await ask(page, 'Hôm nay tôi thấy hơi mệt, nên bắt đầu từ đâu?')
  await expect(page.getByRole('region', { name: 'Gợi ý nơi học' })).toBeVisible()

  await page.reload()
  await expect(page.getByLabel('Câu hỏi của bạn')).toBeVisible()
  expect(aiCalls, `mount/reload không được gọi AI: ${aiCalls.join(', ')}`).toEqual([])
})

test('câu hỏi quá dài bị báo lỗi tại chỗ, không bị cắt bớt', async ({ page }) => {
  await mockLogin(page)
  await page.goto('/')
  await ask(page, 'a'.repeat(2001))
  await expect(page.getByRole('alert')).toContainText('vượt giới hạn')
  await expect(page.getByRole('region', { name: 'Gợi ý nơi học' })).toHaveCount(0)
})

test.describe('UX-R2 — progressive disclosure ở Trang chủ member', () => {
  test('mobile: prompt panel stable/hidden, mở có 4 chip và click chip không gọi mạng', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await mockLogin(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const toggle = page.locator('button[aria-controls="home-prompt-chips"]')
    const panel = page.locator('#home-prompt-chips')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(panel).toBeHidden()
    await expect(panel.locator('button')).toHaveCount(4)

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(panel).toBeVisible()
    await expect(toggle).toBeFocused()

    // "Không gọi mạng" = không gọi API (AI/server). Chỉ đếm `/api/`: app có việc NỀN tải trước
    // chunk trang + dữ liệu tĩnh theo hẹn giờ (lib/pageSettled.ts, 2026-10-10) — chúng có thể rơi
    // đúng vào khoảng đo này mà không liên quan gì tới cú bấm chip.
    const requests: string[] = []
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.startsWith('/api/')) requests.push(request.url())
    })
    await panel.getByRole('button', { name: /Giải Toán & STEM/ }).click()
    await expect(page.getByRole('region', { name: 'Gợi ý nơi học' })).toBeVisible()
    expect(requests).toEqual([])

    await toggle.click()
    await expect(panel).toBeHidden()
    await expect(toggle).toBeFocused()
  })

  test('resize live giữ lựa chọn và chuyển focus toggle mobile sang chip đầu desktop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await mockLogin(page)
    await page.goto('/')

    const toggle = page.getByRole('button', { name: 'Xem 4 gợi ý nhanh' })
    await toggle.focus()
    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(toggle).toHaveCount(0)
    await expect(page.locator('#home-prompt-chips').getByRole('button').first()).toBeFocused()

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByRole('button', { name: 'Xem 4 gợi ý nhanh' })).toBeVisible()
    await expect(page.locator('#home-prompt-chips')).toBeHidden()
  })

  test('mobile: 3 môn → toggle → list 4–6; shortcut phụ không render sẵn', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await mockLogin(page)
    await page.goto('/')

    const revealed = page.locator('#home-subjects-revealed')
    const toggle = page.locator('button[aria-controls="home-subjects-revealed"]')
    await expect(revealed).toBeHidden()
    await expect(page.getByRole('button', { name: 'Lộ trình CEFR' })).toHaveCount(0)

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(revealed).toBeVisible()
    await expect(toggle).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(revealed.getByRole('button').first()).toBeFocused()

    await toggle.click({ force: true })
    await expect(revealed).toBeHidden()
  })

  test('desktop giữ đủ prompt/môn/shortcut và chỉ một Tiến độ do Home sở hữu', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await mockLogin(page)
    await page.goto('/')

    await expect(page.getByRole('button', { name: /gợi ý nhanh/i })).toHaveCount(0)
    await expect(page.locator('#home-prompt-chips').getByRole('button')).toHaveCount(4)
    await expect(page.locator('#home-subjects-revealed')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(7)
    await expect(page.getByRole('button', { name: 'Lộ trình CEFR' })).toBeVisible()
    await expect(
      page.locator('main').getByRole('button', { name: 'Xem bảng tiến độ' }),
    ).toHaveCount(1)
    await expect(page.getByText('Xem tiến độ', { exact: true })).toHaveCount(0)
  })
})

test('Bạn Đồng Hành đổ sẵn câu hỏi vào ô soạn nhưng KHÔNG tự gửi', async ({ page }) => {
  await mockLogin(page)
  const aiCalls = watchAiCalls(page)
  const question = 'Hôm nay tôi thấy hơi mệt,\nnên bắt đầu từ đâu?'
  await page.addInitScript(
    ([uid, q]) => {
      sessionStorage.setItem(
        'dhcb_learning_question_draft_v1',
        JSON.stringify({
          version: 1,
          id: 'e2e-draft-1',
          question: q,
          source: 'home',
          owner: { kind: 'account', id: uid },
          target: 'companion',
          createdAt: Date.now(),
        }),
      )
    },
    [USER_ID, question] as const,
  )

  await page.goto('/ban-dong-hanh')
  const composer = page.locator('textarea').first()
  // Nguyên văn, kể cả dấu xuống dòng.
  await expect(composer).toHaveValue(question)
  // Đổ chữ KHÔNG phải gửi: không một lượt gọi AI nào được sinh ra khi chỉ mở trang.
  expect(aiCalls, `mở trang không được gọi AI: ${aiCalls.join(', ')}`).toEqual([])

  // Tải lại trang cũng vậy — nháp còn đó, vẫn không gửi.
  await page.reload()
  await expect(page.locator('textarea').first()).toHaveValue(question)
  expect(aiCalls).toEqual([])
})

// ── Cổng a11y cho TRẠNG THÁI MỚI ────────────────────────────────────────────────────────────
// `e2e/a11y.spec.ts` quét Trang chủ ở trạng thái mặc định, nên panel "Gợi ý nơi học" (chỉ hiện
// sau khi người dùng hỏi) không nằm trong vùng quét đó. Đặc tả §⑤ yêu cầu THÊM state mới vào
// cổng chứ không bỏ rule — nên quét riêng đúng panel này, đủ 5 theme.
const THEMES: ThemeName[] = ['dark-blue', 'blue-sky', 'kid']

for (const theme of THEMES) {
  test(`a11y: panel gợi ý nơi học theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await mockLogin(page, 'vi', theme)
    await page.goto('/')
    await ask(page, 'Giải phương trình x + 2 = 5')
    await expect(page.getByRole('region', { name: 'Gợi ý nơi học' })).toBeVisible()
    await freezeAnimations(page)

    const { violations } = await new AxeBuilder({ page })
      .include('section[aria-label="Gợi ý nơi học"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(violations.map((v) => `${v.id} (${v.impact})`)).toEqual([])
  })
}

// Nội dung/tiêu đề trong panel phải đạt AAA (CLAUDE.md mục 4.5) — quét đúng phần chữ để đọc.
for (const theme of THEMES) {
  test(`a11y AAA: chữ nội dung trong panel gợi ý theme=${theme}`, async ({ page }) => {
    await mockLogin(page, 'vi', theme)
    await page.goto('/')
    await ask(page, 'Giải phương trình x + 2 = 5')
    await expect(page.getByRole('region', { name: 'Gợi ý nơi học' })).toBeVisible()
    await freezeAnimations(page)

    const { violations } = await new AxeBuilder({ page })
      .include('section[aria-label="Gợi ý nơi học"]')
      .withTags(['wcag2aaa', 'wcag21aaa'])
      .options({ rules: { 'color-contrast-enhanced': { enabled: true } } })
      .analyze()
    const content = violations.filter((v) =>
      v.nodes.some((n) => /^(h[1-6]|p|li|td|th|blockquote)\b/i.test(n.html.replace('<', ''))),
    )
    expect(content.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`)).toEqual([])
  })
}
