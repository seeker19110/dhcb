import type { Page } from '@playwright/test'
import { PublicAppSettingsSchema } from '../../packages/core-contracts/appSettings'

// Giả "đã đăng nhập" cho E2E: gieo trước cờ phiên không bí mật (đúng key mà
// src/lib/authHeader.ts đọc — gsa_session_present_v1) + chặn network `GET
// /api/auth?action=me` (gọi thật khi AuthProvider mount, xem src/lib/auth.ts
// getCurrentUser()) trả về profile giả — E2E chạy bằng `npm run dev` (Vite),
// không có backend Postgres thật nên không thể để request đó đi thật.
const TOKEN_KEY = 'gsa_session_present_v1'
// Export để các file E2E khác seed localStorage đúng key theo user (vd `et_challenge_<uid>`).
export const USER_ID = 'e2e-user-0001'

// Tên 4 theme tự chọn (đồng bộ src/lib/theme.ts). Dùng để E2E quét a11y ở mọi theme.
// 'kid' (Nhi đồng) tách riêng — không nằm trong vòng lặp THEMES chính (không tự chọn được),
// chỉ dùng ở vài test riêng quét theme này.
export type ThemeName = 'dark-blue' | 'blue-sky' | 'kid'

// [2026-10-05, audit M9] Mock `/api/app-settings` PARSE qua đúng hợp đồng Zod mà server + client
// dùng — một nguồn sự thật cho hình dạng dữ liệu. Trước đây mock giữ hình dạng cũ (hạn mức theo
// từng chế độ + gói `pro` đã xoá) nên mọi cổng E2E xanh trong khi production hiện "0/". Lệch hợp
// đồng nay là lỗi ngay lúc nạp file test, không im lặng nữa.
export const MOCK_APP_SETTINGS = PublicAppSettingsSchema.parse({
  limits: { free: 30, vip: 300 },
  promoUntil: null,
  leaderboardEnabled: false,
  updatedAt: '1970-01-01T00:00:00.000Z',
})

export async function mockLogin(
  page: Page,
  uiLang: 'vi' | 'en' = 'vi',
  theme?: ThemeName,
  options?: { isAdmin?: boolean; onboarded?: boolean },
): Promise<void> {
  const profile = {
    id: USER_ID,
    email: 'e2e@example.com',
    name: 'E2E User',
    plan: 'free',
    // [Slice 04] `onboarded: false` để E2E đi qua luồng onboarding theo môn.
    onboarded: options?.onboarded ?? true,
    userLevel: 'beginner',
    goal: 'daily',
    dailyMinutes: 10,
    ageGroup: 'nguoi_lon',
    // Chỉ để quét a11y các khối/trang chỉ-admin (RequireAdmin ở App.tsx đọc đúng cờ này từ
    // /api/auth?action=me). Mặc định false — không đổi hành vi mọi test đang gọi mockLogin().
    isAdmin: options?.isAdmin ?? false,
  }

  await page.addInitScript(
    (data) => {
      localStorage.setItem(data.tokenKey, 'session:e2e')
      localStorage.setItem('ui_lang', data.uiLang)
      if (data.theme) localStorage.setItem('ui_theme', data.theme)
    },
    {
      tokenKey: TOKEN_KEY,
      uiLang,
      theme: theme ?? null,
    },
  )

  await page.route('**/api/auth?action=me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) }),
  )

  await page.route('**/api/profile**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) }),
  )

  await page.route('**/api/app-settings**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_APP_SETTINGS),
    }),
  )

  await page.route('**/api/progress**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }),
  )

  await page.route('**/api/history**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
}
