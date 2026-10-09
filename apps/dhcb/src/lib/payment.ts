// src/lib/payment.ts — Client cho thanh toán VIP qua SePay (xem api/checkout.ts,
// api/payment-webhook.ts, api/payment-status.ts, api/payment-history.ts).
//
// SePay KHÔNG redirect người dùng về sau khi chuyển khoản — UI phải tự POLL trạng thái đơn
// (fetchPaymentStatus lặp lại) thay vì chờ query string như luồng redirect thông thường.

import { getAuthHeader } from '@core/authHeader'

// GĐ1 2026-09-12: VIP là gói trả phí DUY NHẤT — PHẢI khớp packages/core-billing/prices.ts.
export type PayablePlan = 'vip'
export type PayableCycle = '10day' | 'month' | 'year'

export interface CheckoutResult {
  paymentCode: string
  amountVnd: number
  qrUrl: string
  bankAccount: string
  bankName: string
  expiresAt: string
  plan: PayablePlan
  cycle: PayableCycle
  years: number
}

export interface PlanPriceEntry {
  priceVnd: number
  salePriceVnd: number | null
  saleUntil: string | null
  effectiveVnd: number
  // Chỉ có ở cycle='year' — tổng tiền mua 1..maxPromoYears năm liền (đã áp giảm giá luỹ tiến),
  // index 0 = mua 1 năm. Xem MAX_PROMO_YEARS/effectiveTotalPrice ở api/_lib/prices.ts.
  yearTotals?: number[]
}

export type PlanPrices = Record<PayablePlan, Record<PayableCycle, PlanPriceEntry>> & {
  promoPercent: number | null
  // Mốc kết thúc khuyến mãi % đang hiệu lực — null nếu promoPercent cũng null.
  promoEndsAt: string | null
  maxPromoYears: number
}

// Công khai, không cần đăng nhập (xem api/plan-prices.ts) — gọi trước khi bấm mua để hiện giá.
export async function fetchPlanPrices(): Promise<PlanPrices | null> {
  try {
    const res = await fetch('/api/plan-prices')
    if (!res.ok) return null
    return (await res.json()) as PlanPrices
  } catch {
    return null
  }
}

export async function createCheckout(
  plan: PayablePlan,
  cycle: PayableCycle,
  years = 1,
): Promise<{ ok: true; data: CheckoutResult } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ plan, cycle, years }),
    })
    const data = (await res.json().catch(() => ({}))) as CheckoutResult & { error?: string }
    if (!res.ok) return { ok: false, error: data.error ?? 'Không tạo được đơn' }
    return { ok: true, data }
  } catch {
    return { ok: false, error: 'Lỗi kết nối, thử lại sau' }
  }
}

export interface PaymentStatus {
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled'
  plan: PayablePlan
  cycle: PayableCycle
  amountVnd: number
  expiresAt: string
}

export async function fetchPaymentStatus(code: string): Promise<PaymentStatus | null> {
  try {
    const res = await fetch(`/api/payment-status?code=${encodeURIComponent(code)}`, {
      headers: getAuthHeader(),
    })
    if (!res.ok) return null
    return (await res.json()) as PaymentStatus
  } catch {
    return null
  }
}

export interface PaymentHistoryEntry {
  plan: PayablePlan
  cycle: PayableCycle
  amountVnd: number
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled'
  createdAt: string
  paidAt: string | null
}

export async function fetchPaymentHistory(): Promise<PaymentHistoryEntry[]> {
  try {
    const res = await fetch('/api/payment-history', { headers: getAuthHeader() })
    if (!res.ok) return []
    const data = (await res.json()) as { payments: PaymentHistoryEntry[] }
    return data.payments
  } catch {
    return []
  }
}
