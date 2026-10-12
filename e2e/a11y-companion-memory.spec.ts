// e2e/a11y-companion-memory.spec.ts — Cổng a11y cho trang "Bạn Đồng Hành nhớ gì về tôi" khi CÓ
// dữ liệu (GĐ2b, đặc tả `docs/specs/2026-10-12-ban-dong-hanh-gd2b-trich-ky-uc-khoi-loi.md`).
//
// Vì sao cần spec riêng: `e2e/a11y.spec.ts` có quét `/ban-dong-hanh/ky-uc` nhưng KHÔNG giả lập
// API (E2E không có backend) nên chỉ thấy trạng thái lỗi tải. Bốn mục mới của GĐ2b — gợi ý chờ
// duyệt (viền màu nhấn), hai khối ghi nhớ cố định (ô nhập + bộ đếm), danh sách "thông tin cũ đã
// được thay" (chữ gạch/nhạt) và tóm tắt các buổi trước — chỉ render khi API trả dữ liệu, nên
// phải giả lập để cổng thật sự đo được màu chữ mới sinh ra.

import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockLogin, type ThemeName } from './helpers/auth'
import { freezeAnimations } from './helpers/axe'
import { COMPANION_MEMORY_PAGE as PAGE, mockMemoryPageApi } from './helpers/companionMemoryMocks'

const THEMES: ThemeName[] = ['dark-blue', 'blue-sky', 'kid']
const AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function openWithData(page: Page, theme?: ThemeName): Promise<void> {
  await mockLogin(page, 'vi', theme)
  await mockMemoryPageApi(page)
  await page.goto(PAGE, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Gợi ý chờ bạn duyệt' })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByText('Mục tiêu IELTS 7.0 vào tháng 12')).toBeVisible()
  // Mở danh sách "thông tin cũ" — trạng thái mới sinh ra chữ gạch/nhạt.
  await page.getByText(/Thông tin cũ đã được thay/).click()
  await expect(page.getByText('Mục tiêu IELTS 6.5')).toBeVisible()
  await freezeAnimations(page)
}

async function violationsIn(page: Page, tags: string[]): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page }).include('main').withTags(tags).analyze()
  return violations.map((v) => `${v.id} (${v.impact}, ${v.nodes.length} phần tử)`)
}

for (const theme of THEMES) {
  test(`a11y: trang ký ức có dữ liệu GĐ2b theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await openWithData(page, theme)
    expect(await violationsIn(page, AA_TAGS)).toEqual([])
  })
}

for (const theme of THEMES) {
  test(`a11y AAA: chữ nội dung trang ký ức theme=${theme} đạt tương phản ≥ 7:1`, async ({
    page,
  }) => {
    await openWithData(page, theme)
    const { violations } = await new AxeBuilder({ page })
      .include('main')
      .withRules(['color-contrast-enhanced'])
      // Luật AAA chỉ áp cho NỘI DUNG (CLAUDE.md mục 4.5): nút/ô nhập/công tắc giữ sàn AA ở trên.
      .exclude('button')
      .exclude('textarea')
      .exclude('[role="switch"]')
      .analyze()
    // In kèm tỉ lệ đo được để đọc log CI là biết sửa token nào.
    const found = violations.flatMap((v) =>
      v.nodes.map((n) => `${n.target.join(' ')} — ${n.failureSummary ?? ''}`),
    )
    expect(found).toEqual([])
  })
}
