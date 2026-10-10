// packages/core-ai/providerFailure.ts — Mô tả NGẮN một lần gọi nhà cung cấp AI thất bại, để GHI
// LOG phía server. KHÔNG trả các chuỗi này cho client (có thể chứa thông điệp nội bộ của nhà
// cung cấp, vd body lỗi HTTP).
//
// Tách thành module riêng (chỉ import KIỂU) thay vì đặt trong `anthropicClient.ts`/
// `chatProviders.ts`: test của các nơi gọi mock nguyên hai module kia bằng factory, đặt hàm ở đó
// là mock nào cũng phải khai thêm. Dùng chung cho `/api/agent` (ai.ts), `chatFallback.ts` và
// Companion — trước 2026-10-10 hai nơi sau nuốt lỗi không ghi một dòng (audit 2026-10-10, E1).
import type { AnthropicTextResult } from './anthropicClient.js'
import type { ChatCallResult } from './chatProviders.js'

export function describeAnthropicFailure(
  r: Exclude<AnthropicTextResult, { kind: 'success' }>,
): string {
  if (r.kind === 'network_error') return `lỗi mạng/timeout: ${r.message}`
  if (r.kind === 'api_error') return `HTTP ${r.status}: ${r.message.slice(0, 200)}`
  return `không dùng được (${r.reason}: ${r.detail})`
}

export function describeChatCallFailure(r: Exclude<ChatCallResult, { kind: 'success' }>): string {
  if (r.kind === 'http_error') return `HTTP ${r.status}: ${r.bodyText.slice(0, 200)}`
  if (r.kind === 'network_error') return `lỗi mạng/timeout: ${r.message}`
  return `body không hợp lệ: ${r.message}`
}

/** Thông điệp của một lỗi bị ném (Error hoặc giá trị bất kỳ) — cho dòng log. */
export function describeThrown(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
