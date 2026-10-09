// api/_lib/sepay.ts — Phần THUẦN (không đụng DB) của tích hợp SePay: sinh mã thanh toán, dựng
// URL ảnh QR, dò mã trong nội dung chuyển khoản, xác thực webhook. Tách riêng để test được mọi
// ca biên (đặc biệt việc dò mã — nơi dễ sai nhất vì phụ thuộc cách ngân hàng ghi nội dung).
//
// Đọc tài liệu thật trước khi viết: https://docs.sepay.vn/tich-hop-webhooks.html,
// https://docs.sepay.vn/lap-trinh-webhooks.html, https://sepay.vn/lap-trinh-cong-thanh-toan.html
// — xem docs/research/dac-ta-thanh-toan-2026-07-25.md mục "Cổng thanh toán: SePay".

import { randomInt, timingSafeEqual } from 'node:crypto'

// Tiền tố cố định để lọc trên dashboard SePay ("tiền tố mã thanh toán") — tách giao dịch của
// app khỏi các giao dịch cá nhân khác trong cùng tài khoản ngân hàng.
//
// [2026-07-31, ADR-0001 mục 4] Đổi sang 'DHCB' (Đồng Hành Cùng Bạn) — tiền tố DÙNG CHUNG cho
// nền tảng đa lĩnh vực, thay 'ENVI' (chỉ tiếng Anh). PAYMENT_CODE_PREFIX chỉ dùng khi TẠO mã
// đơn MỚI. Khi ĐỐI CHIẾU webhook, dùng ACCEPTED_PAYMENT_PREFIXES — PHẢI giữ 'ENVI' trong đó
// VĨNH VIỄN: giao dịch cũ và người dùng copy lại nội dung chuyển khoản cũ vẫn phải khớp đúng.
// Không bao giờ xoá 'ENVI' khỏi danh sách chấp nhận, và trên trang quản trị SePay phải giữ
// nguyên bộ lọc 'ENVI' đang có, chỉ THÊM bộ lọc 'DHCB' mới (việc tay, xem
// docs/kiem-tra-tay-thanh-toan-google-login.md mục B7).
export const PAYMENT_CODE_PREFIX = 'DHCB'
export const ACCEPTED_PAYMENT_PREFIXES = ['DHCB', 'ENVI'] as const

/**
 * Ân hạn sau `payments.expires_at` mà webhook VẪN tự cấp gói (chuyển khoản liên ngân hàng có thể
 * chậm). Quá mốc này đơn giữ 'pending' để admin đối chiếu tay. Dùng chung ở 2 nơi phải khớp nhau:
 * webhook SePay (cấp gói) và `deleteAccount` (từ chối xoá tài khoản khi đơn còn có thể được trả —
 * changelog 0533 mục "Sau rà soát").
 */
export const SEPAY_LATE_GRACE_MS = 24 * 60 * 60 * 1000

// Bảng ký tự KHÔNG chứa 0/O, 1/I/L — người dùng có thể phải GÕ TAY nội dung chuyển khoản khi
// ứng dụng ngân hàng không cho sửa nội dung từ QR, nên tránh ký tự dễ đọc/gõ nhầm.
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
const CODE_SUFFIX_LEN = 8

/** Sinh mã thanh toán mới, vd "ENVI7K2M9QRT". Ngẫu nhiên an toàn (node:crypto), không Math.random. */
export function generatePaymentCode(): string {
  let suffix = ''
  for (let i = 0; i < CODE_SUFFIX_LEN; i++) {
    suffix += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)]
  }
  return `${PAYMENT_CODE_PREFIX}${suffix}`
}

/**
 * Dò mã thanh toán trong một đoạn text (nội dung chuyển khoản hoặc trường `code` của webhook).
 * Không phân biệt hoa/thường — nhiều ngân hàng viết hoa toàn bộ nội dung chuyển khoản.
 * Chấp nhận CẢ HAI tiền tố (ACCEPTED_PAYMENT_PREFIXES) — mã cũ 'ENVI...' vẫn phải khớp đúng.
 * Trả về mã dạng CHUẨN HOÁ (viết hoa) nếu tìm thấy, null nếu không.
 */
export function extractPaymentCode(text: string | null | undefined): string | null {
  if (!text) return null
  const re = new RegExp(
    `(?:${ACCEPTED_PAYMENT_PREFIXES.join('|')})[${CODE_ALPHABET}]{${CODE_SUFFIX_LEN}}`,
    'i',
  )
  const match = text.toUpperCase().match(re)
  return match ? match[0] : null
}

export interface SepayQrParams {
  bankAccount: string
  bankCode: string
  amountVnd: number
  paymentCode: string
}

/** Dựng URL ảnh QR VietQR của SePay — KHÔNG gọi API ngoài, chỉ ghép chuỗi. */
export function buildSepayQrUrl({
  bankAccount,
  bankCode,
  amountVnd,
  paymentCode,
}: SepayQrParams): string {
  const params = new URLSearchParams({
    acc: bankAccount,
    bank: bankCode,
    amount: String(amountVnd),
    des: paymentCode,
  })
  return `https://qr.sepay.vn/img?${params.toString()}`
}

/**
 * So sánh header `Authorization: Apikey <key>` với khoá thật, chống timing attack.
 * `timingSafeEqual` YÊU CẦU 2 buffer cùng độ dài — độ dài khác nhau đã đủ để biết sai mà
 * không cần so nội dung, nên trả false thẳng (không rò rỉ thời gian có ý nghĩa: độ dài khoá
 * không phải bí mật cần giữ).
 */
export function verifySepayApiKey(authHeader: string | null, expectedKey: string): boolean {
  if (!authHeader || !expectedKey) return false
  const prefix = 'Apikey '
  if (!authHeader.startsWith(prefix)) return false
  const provided = Buffer.from(authHeader.slice(prefix.length))
  const expected = Buffer.from(expectedKey)
  if (provided.length !== expected.length) return false
  return timingSafeEqual(provided, expected)
}
