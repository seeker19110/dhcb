// E2E đợt U9a — VÙNG CHẠM + GIÃN CHỮ (audit UI/UX 2026-09-30 mục 5, M20 + M21).
//
//   M20  luật dự án: mọi đích chạm ≥ 44×44px trên mobile (CLAUDE.md mục 4.7, WCAG 2.5.5 AAA).
//        axe không bắt được: luật của axe là 24px (2.5.8) và bỏ qua phần tử `tabindex="-1"`.
//   M21  WCAG 1.4.12 (AA): áp khoảng cách chữ/dòng/đoạn theo chuẩn mà KHÔNG phần tử nào mới bị
//        cắt chữ (`truncate`/`line-clamp` trên mô tả thẻ là thủ phạm audit đo được ở 16 route).
//
// Cách đo nằm ở `e2e/helpers/touchAndSpacing.ts` (kèm các ngoại lệ đúng chuẩn: liên kết giữa câu,
// ô radio/checkbox có nhãn bao quanh, phần tử bị vô hiệu/ẩn). Cổng TUYỆT ĐỐI: 0 đích nhỏ, 0 phần
// tử mới bị cắt — không baseline. Đã chạy ĐỐI CHỨNG ÂM trên mã trước U9a (đỏ ở đúng các route
// audit nêu) — xem docs/changelog/0497-2026-10-05-u9a-vung-cham-gian-chu.md.
import { test, expect, type Page } from '@playwright/test'
import { mockLogin } from './helpers/auth'
import { waitForStableDom } from './helpers/axe'
import {
  mockFriendsState,
  mockPlanPrices,
  mockQuestsStatus,
  mockReferralStats,
} from './helpers/realDataMocks'
import { newlyClippedOnTextSpacing, smallTouchTargets } from './helpers/touchAndSpacing'

const GUEST_ROUTES = ['/welcome', '/login', '/learn-vietnamese']

// Các route audit đo (23 route trượt vùng chạm + 16 route trượt giãn chữ) cộng các route anh em
// dùng chung component — để sửa ở component dùng chung không bị hồi quy ở trang khác.
const AUTHED_ROUTES = [
  '/',
  '/tien-do',
  '/lich-su-hoc',
  '/cai-dat',
  '/trang-ca-nhan',
  '/nhiem-vu',
  '/ban-be',
  '/nang-cap',
  '/ban-dong-hanh',
  '/action-canvas',
  '/ung-dung-thuc-te',
  '/luyen-tap',
  '/ghi-chu',
  '/ghi-chu/kanban',
  '/tin-nhan',
  '/gioi-thieu',
  '/goc-hoc-tap',
  '/goc-hoc-tap/on-tap',
  '/goc-hoc-tap/physics',
  '/goc-hoc-tap/physics/bai-hoc',
  '/goc-hoc-tap/english',
  '/goc-hoc-tap/english/lo-trinh',
  '/goc-hoc-tap/english/lo-trinh/a1',
  '/goc-hoc-tap/english/lo-trinh/c1',
  '/goc-hoc-tap/english/bai-hoc',
  '/goc-hoc-tap/english/tu-dien',
  '/goc-hoc-tap/english/cau-thong-dung',
  '/goc-hoc-tap/english/luyen-nghe',
  '/goc-hoc-tap/english/truyen',
  '/goc-hoc-tap/english/truyen/ch-alphabet',
  '/goc-hoc-tap/english/luyen-viet',
  '/goc-hoc-tap/english/thu-thach',
  '/goc-hoc-tap/english/on-thi',
  '/goc-hoc-tap/programming',
  '/goc-hoc-tap/programming/bac/p1',
  '/goc-hoc-tap/programming/bai-hoc/p1-u4-l1',
  '/goc-hoc-tap/programming/du-an',
  '/goc-hoc-tap/programming/khoa-hoc/git--git-github-thuc-hanh',
  '/goc-hoc-tap/programming/lo-trinh/principal-ai/chan-doan',
]

async function openRoute(page: Page, route: string, width: number) {
  await page.setViewportSize({ width, height: 844 })
  if (!GUEST_ROUTES.includes(route)) {
    await mockLogin(page)
    // Dữ liệu ĐÚNG HÌNH DẠNG thật (đợt U3): thiếu mock thì trang vẽ màn lỗi, phần tử cần đo
    // (nút "Nhắn tin", nút mua VIP…) không bao giờ hiện ra → cổng xanh giả.
    await mockReferralStats(page)
    await mockQuestsStatus(page)
    await mockFriendsState(page)
    await mockPlanPrices(page)
  }
  await page.goto(route, { waitUntil: 'domcontentloaded' })
  await waitForStableDom(page)
}

function fmtTargets(list: Awaited<ReturnType<typeof smallTouchTargets>>) {
  return list.map((t) => `${t.w}×${t.h} ${t.desc}`).join('\n')
}
function fmtClipped(list: Awaited<ReturnType<typeof newlyClippedOnTextSpacing>>) {
  return list.map((c) => `${c.desc} «${c.text}»`).join('\n')
}

test.describe('M20 + M21 — 390px: vùng chạm ≥ 44px và giãn chữ không cắt chữ', () => {
  for (const route of [...GUEST_ROUTES, ...AUTHED_ROUTES]) {
    test(`390px ${route}`, async ({ page }) => {
      await openRoute(page, route, 390)
      // Trang có <main> = đã qua màn tải (mọi route có <main id="noi-dung-chinh"> — đợt U1).
      await expect(page.locator('main').first()).toBeVisible()
      const small = await smallTouchTargets(page)
      expect(small, `đích chạm < 44px:\n${fmtTargets(small)}`).toEqual([])
      const clipped = await newlyClippedOnTextSpacing(page)
      expect(clipped, `bị cắt chữ khi giãn chữ:\n${fmtClipped(clipped)}`).toEqual([])
    })
  }
})

// Màn chỉ hiện sau một thao tác (audit: thanh công cụ bài hội thoại "EN / EN+VI / VI" cao
// 20–24px, nút "Quay lại", lựa chọn trắc nghiệm của bài ngữ pháp).
const INTERACTIONS: { name: string; open: (page: Page) => Promise<void>; ready: string }[] = [
  {
    name: 'bài hội thoại (thanh công cụ EN / EN+VI / VI)',
    open: (page) =>
      page
        .getByRole('button', { name: /Làm quen ở lớp học/ })
        .first()
        .click(),
    ready: 'EN+VI',
  },
  {
    name: 'vòng từ vựng',
    open: (page) =>
      page
        .getByRole('button', { name: /Đại từ & lời chào/ })
        .first()
        .click(),
    ready: 'Quay lại',
  },
  {
    name: 'bài ngữ pháp',
    open: (page) => page.getByRole('button', { name: /Bài 1/ }).first().click(),
    ready: 'Quay lại',
  },
]

test.describe('M20 + M21 — màn mở ra sau thao tác ở trang cấp CEFR (390px)', () => {
  for (const c of INTERACTIONS) {
    test(`390px /goc-hoc-tap/english/lo-trinh/a1 › ${c.name}`, async ({ page }) => {
      await openRoute(page, '/goc-hoc-tap/english/lo-trinh/a1', 390)
      await c.open(page)
      await expect(page.getByRole('button', { name: c.ready }).first()).toBeVisible()
      await waitForStableDom(page)
      const small = await smallTouchTargets(page)
      expect(small, `đích chạm < 44px:\n${fmtTargets(small)}`).toEqual([])
      const clipped = await newlyClippedOnTextSpacing(page)
      expect(clipped, `bị cắt chữ khi giãn chữ:\n${fmtClipped(clipped)}`).toEqual([])
    })
  }
})

// 768px vẫn là giao diện mobile (< 1024px) nên luật 44px áp dụng; 1440px chỉ đo giãn chữ (desktop
// dùng chuột — sàn 24px của WCAG 2.5.8 do axe canh ở `a11y.spec.ts`).
test.describe('M20 + M21 — bề rộng khác', () => {
  for (const route of ['/', '/ban-dong-hanh', '/goc-hoc-tap/programming/bai-hoc/p1-u4-l1']) {
    test(`768px ${route}`, async ({ page }) => {
      await openRoute(page, route, 768)
      await expect(page.locator('main').first()).toBeVisible()
      const small = await smallTouchTargets(page)
      expect(small, `đích chạm < 44px:\n${fmtTargets(small)}`).toEqual([])
      const clipped = await newlyClippedOnTextSpacing(page)
      expect(clipped, `bị cắt chữ khi giãn chữ:\n${fmtClipped(clipped)}`).toEqual([])
    })
  }
  for (const route of [
    '/',
    '/trang-ca-nhan',
    '/luyen-tap',
    '/goc-hoc-tap/english',
    '/goc-hoc-tap/english/lo-trinh/a1',
    '/goc-hoc-tap/english/truyen/ch-alphabet',
    '/goc-hoc-tap/programming',
  ]) {
    test(`1440px ${route}: giãn chữ không cắt chữ`, async ({ page }) => {
      await openRoute(page, route, 1440)
      await expect(page.locator('main').first()).toBeVisible()
      const clipped = await newlyClippedOnTextSpacing(page)
      expect(clipped, `bị cắt chữ khi giãn chữ:\n${fmtClipped(clipped)}`).toEqual([])
    })
  }
})
