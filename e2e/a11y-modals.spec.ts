import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockLogin, type ThemeName } from './helpers/auth'
import { mockDomainApis } from './helpers/domains'
import { freezeAnimations } from './helpers/axe'

// ── CỔNG A11Y CHO HỘP THOẠI ĐANG MỞ ────────────────────────────────────────────
//
// Vì sao cần file riêng: `e2e/a11y.spec.ts` quét 4 trang trụ cột nhưng CHỈ ở trạng
// thái hộp thoại đang ĐÓNG. 15 hộp thoại của Career/Work/Startup/Life nằm sau
// `{showXModal && ...}` nên axe chưa từng nhìn thấy chúng — và quả thật chúng từng
// thiếu sạch role="dialog", aria-modal, phím Escape, bẫy tiêu điểm, cùng ~49 thẻ
// <label> không gắn với ô nhập. Cổng "0 vi phạm" khi đó xanh trên phần UI KHÔNG
// chứa hộp thoại.
//
// Mỗi test mở LẦN LƯỢT mọi hộp thoại của một trang trong CÙNG một lần tải trang
// (thay vì mỗi hộp thoại một test): 4 trang × 5 theme = 20 test thay vì 75, giữ
// thời gian tường của mảnh E2E ở mức chấp nhận được (luật CI mục 11.1).

async function scan(page: Page) {
  await freezeAnimations(page)
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  return violations.map((v) => `${v.id} (${v.impact}, ${v.nodes.length} phần tử)`)
}

const THEMES: ThemeName[] = ['dark-blue', 'blue-sky', 'kid']

/** Một hộp thoại: tên tab phải bấm trước (nếu có) và tên nút mở nó. */
type ModalCase = { tab?: string; trigger: string; title: string }

const PAGES: { name: string; route: string; modals: ModalCase[] }[] = [
  // [2026-09-20] Ba trang "Sự nghiệp", "Khởi nghiệp" và "Cuộc sống" đã bị gỡ hẳn cùng ba trụ
  // của chúng. Chỉ còn trang "Ghi chú" — nửa "Công việc" cũ, nay là trang cấp 1 độc lập.
  {
    name: 'Ghi chú',
    route: '/ghi-chu',
    modals: [
      { tab: 'Công việc', trigger: 'Thêm công việc', title: 'Thêm công việc mới' },
      { tab: 'Dự án', trigger: 'Tạo dự án mới', title: 'Tạo dự án mới' },
      { tab: 'Cuộc họp', trigger: 'Ghi lại cuộc họp', title: 'Ghi lại cuộc họp' },
      { tab: 'Ghi chú', trigger: 'Thêm ghi chú', title: 'Thêm ghi chú' },
    ],
  },
]

for (const pg of PAGES) {
  for (const theme of THEMES) {
    test(`a11y hộp thoại: ${pg.name} theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
      await mockLogin(page, 'vi', theme)
      await mockDomainApis(page)
      await page.goto(pg.route, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1000)

      for (const m of pg.modals) {
        if (m.tab) {
          await page
            .getByRole('button', { name: new RegExp(m.tab) })
            .first()
            .click()
        }
        await page.getByRole('button', { name: m.trigger, exact: true }).first().click()

        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        // Tên có thể truy cập của hộp thoại phải là tiêu đề của nó (aria-labelledby).
        await expect(dialog).toHaveAccessibleName(m.title)

        const violations = await scan(page)
        expect(violations, `hộp thoại "${m.title}"`).toEqual([])

        // Escape phải đóng được — hành vi bắt buộc của WAI-ARIA APG cho dialog.
        await page.keyboard.press('Escape')
        await expect(dialog).toBeHidden()
      }
    })
  }
}

// ── PANEL "MỤC LỤC" TRÊN MOBILE (S07-2) ────────────────────────────────────────
//
// Đây là hộp thoại dáng SHEET đầu tiên của dự án (neo đáy, cao 85dvh, cuộn trong panel) và là
// hộp thoại đầu tiên render qua `createPortal`. Hai điều đó đủ mới để phải có cổng riêng —
// nhất là vì nội dung của nó là một danh sách dài liên kết, đúng loại nội dung dễ rớt
// `target-size` và tương phản.
for (const theme of THEMES) {
  test(`a11y hộp thoại: panel Mục lục @390 theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await mockLogin(page, 'vi', theme)
    await page.goto('/goc-hoc-tap/physics/bai-hoc/ly10-c2-b10--su-roi-tu-do', {
      waitUntil: 'domcontentloaded',
    })
    await page.getByRole('button', { name: 'Mục lục môn học' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAccessibleName('Mục lục môn học')
    expect(await scan(page)).toEqual([])

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })
}
