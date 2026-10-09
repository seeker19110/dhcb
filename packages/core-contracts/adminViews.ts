// adminViews.ts — Kiểu dữ liệu hàng (row) trả về cho các panel admin ở frontend.
//
// [PR-S4] Chuyển từ chính file handler sang core-contracts: frontend KHÔNG được import
// xuyên tầng vào apps/server (luật boundary) — kiểu dùng chung 2 tầng phải nằm ở đây.
// Handler tương ứng: apps/server/src/api/admin/{admin-reserved-names,admin-feedback,
// admin-payments}.ts (import lại type từ file này).

export interface ReservedNameRow {
  id: string
  phrase: string
  createdAt: string
}

export interface TutorFeedbackRow {
  id: string
  userId: string
  userEmail: string | null
  source: 'chat' | 'speaking'
  userInput: string
  aiFeedback: string
  createdAt: string
}

export interface AdminPaymentRow {
  id: string
  // null = đơn của tài khoản đã xoá (ẩn danh hoá — migration 0088, changelog 0533).
  userId: string | null
  userEmail: string | null
  userName: string | null
  plan: 'pro' | 'vip'
  cycle: '10day' | 'month' | 'year'
  amountVnd: number
  provider: string
  paymentCode: string
  providerTxnId: string | null
  // 'cancelled' = người dùng tự huỷ "tôi chưa chuyển khoản" (migration 0090, changelog 0546).
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled'
  createdAt: string
  expiresAt: string
  paidAt: string | null
  cancelledAt: string | null
}
