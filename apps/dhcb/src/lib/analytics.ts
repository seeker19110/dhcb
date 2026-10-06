// src/lib/analytics.ts — Client "gửi rồi quên" cho analytics tự viết (xem api/analytics.ts).
// KHÔNG await ở nơi gọi, KHÔNG block UI, nuốt lỗi mạng — đây là tracking nền, lỗi không
// quan trọng với trải nghiệm nên không hiện toast/thông báo lỗi cho user.

import { getAuthHeader } from '@core/authHeader'

// Whitelist khớp EVENT_TYPES ở api/platform/analytics.ts — giữ đồng bộ khi thêm event mới.
// Ba bước phễu signup / first_session_done / day2_return KHÔNG bắn từ client: server tự suy ra
// từ bảng users + daily_usage (xem api/admin/analytics-summary.ts).
// [2026-09-13] onboarding_step_view: đo rớt TỪNG bước trong Intake (5 câu)/Onboarding (4 bước)
// giữa lúc đăng ký và "first_session_done" — refCode = `intake:<step>` hoặc `onboarding:<step>`.
export type AnalyticsEvent =
  | 'landing_view'
  | 'cta_click'
  | 'share_click'
  | 'daily_plan_impression'
  | 'daily_plan_click'
  | 'onboarding_step_view'
  // [2026-10-05, U9b] Bấm "Bỏ qua" trong Onboarding — refCode = `onboarding:<bước>` hoặc
  // `onboarding:subject` (bỏ qua ngay ở bước chọn môn). Tách khỏi `onboarding_step_view` để phễu
  // phân biệt được "bỏ qua có chủ đích" với "rời đi giữa chừng".
  | 'onboarding_skip'
  // [2026-09-17, P1-6] SessionDone (lệnh 8): xem/mở CTA phụ của màn kết phiên gộp.
  | 'session_done_view'
  | 'session_done_more'

export interface AnalyticsExtra {
  refCode?: string
  utmSource?: string
  path?: string
}

export function track(event: AnalyticsEvent, extra?: AnalyticsExtra): void {
  const body = {
    event,
    refCode: extra?.refCode,
    utmSource: extra?.utmSource,
    // Tự gắn path hiện tại nếu không truyền — window chỉ tồn tại ở trình duyệt.
    path: extra?.path ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
  }

  fetch('/api/analytics', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...getAuthHeader(), // rỗng nếu chưa đăng nhập — vẫn gửi được, server không bắt buộc auth
    },
    body: JSON.stringify(body),
  }).catch(() => {
    // Nuốt lỗi mạng — tracking nền, không ảnh hưởng trải nghiệm người dùng.
  })
}
