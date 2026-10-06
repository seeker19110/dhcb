// src/lib/weeklyCredit.ts — Đọc "còn bao nhiêu lượt AI HÔM NAY" từ SERVER (xem
// api/usage-summary.ts). Tên file/field giữ "weekly"/"freeWeekly*" vì LỊCH SỬ: gói Free từng
// dùng kho lượt cửa sổ trượt 7 ngày; GĐ1 2026-09-12 đổi sang hạn mức TỔNG/ngày (Free 30, VIP
// theo cấu hình) nhưng giữ nguyên tên field để không phá cache localStorage đã phát hành.
//   freeWeeklyCredit = còn bao nhiêu lượt hôm nay (null = server lỗi, chưa biết)
//   freeWeeklyCap    = hạn mức lượt mỗi ngày của gói hiện tại
//
// Không cache lâu (số đổi mỗi lần dùng AI) — luôn hỏi lại server khi vào các trang
// Chat/Writing/Speaking/Dashboard/Challenge để số hiển thị luôn đúng.

import { getAuthHeader } from '@core/authHeader'
import { z } from 'zod'

export interface WeeklyCreditInfo {
  plan: 'free' | 'vip'
  freeWeeklyCredit: number | null // null = server không đọc được (fail-open, UI ẩn số)
  freeWeeklyCap: number
  unlimited?: true
  usedToday?: number
}

const LimitedCreditInfoSchema = z
  .object({
    plan: z.enum(['free', 'vip']),
    freeWeeklyCredit: z.number().int().finite().nullable(),
    freeWeeklyCap: z.number().int().finite().positive(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.freeWeeklyCredit !== null &&
      (value.freeWeeklyCredit < 0 || value.freeWeeklyCredit > value.freeWeeklyCap)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['freeWeeklyCredit'],
        message: 'Credit must be within the daily cap',
      })
    }
  })

const WeeklyCreditInfoSchema = z.union([
  z
    .object({
      plan: z.literal('vip'),
      unlimited: z.literal(true),
      usedToday: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
      freeWeeklyCredit: z.null(),
      freeWeeklyCap: z.literal(0),
    })
    .strict(),
  LimitedCreditInfoSchema,
])

// Lỗi mạng/server → coi như hết lượt (an toàn hơn là coi như còn — tránh hiển thị sai
// "còn nhiều lượt" trong khi server có thể đang chặn thật). UI nơi gọi tự xử lý null/lỗi
// hiển thị phù hợp (vd ẩn số, không chặn cứng — chặn thật vẫn do server quyết định).
export async function fetchWeeklyCredit(): Promise<WeeklyCreditInfo | null> {
  try {
    const resp = await fetch('/api/usage-summary', { headers: getAuthHeader() })
    if (!resp.ok) return null
    const parsed = WeeklyCreditInfoSchema.safeParse(await resp.json())
    if (!parsed.success) return null
    if ('unlimited' in parsed.data && parsed.data.unlimited) return parsed.data
    if (parsed.data.freeWeeklyCredit === null) return null
    return parsed.data
  } catch {
    return null
  }
}
