// runnerProtocol — Hợp đồng tin nhắn giữa app và trang runner chạy code ở origin riêng
// (`run.…`, đặc tả docs/specs/2026-10-10-tach-runtime-chay-code-ten-mien-con.md mục ③).
//
// HAI phía đều kiểm từng tin nhắn bằng schema này: tin nhắn là dữ liệu từ một origin KHÁC, không
// được tin chỉ vì nó tới đúng cửa sổ. Dùng `zod/mini` để runner (và chunk bài học của app) không
// phải kéo zod bản đầy đủ.
import * as z from 'zod/mini'
import type { FetchApi } from '@dhcb/subject-programming/fetchPrelude'
import type { CodeRunResult } from './codeRunResult'
import type { WorkerLaneRequest } from './workerLanes'

/** Tăng khi đổi hình dạng tin nhắn mà hai phía phải nâng cùng lúc. */
export const RUNNER_PROTOCOL_VERSION = 1

// Trần kích thước — chặn một tin nhắn khổng lồ làm treo bộ kiểm. Bài học dài nhất hiện nay
// dưới 20 KB; trần rộng gấp nhiều lần để không bao giờ cắt nhầm bài thật.
const MAX_CODE_CHARS = 500_000
const MAX_OUTPUT_CHARS = 2_000_000
const MAX_LIST_ITEMS = 1_000

const text = z.string().check(z.maxLength(MAX_CODE_CHARS))
const lines = z
  .array(z.string().check(z.maxLength(MAX_CODE_CHARS)))
  .check(z.maxLength(MAX_LIST_ITEMS))
const runId = z.string().check(z.minLength(1), z.maxLength(64))

const FETCH_APIS = ['thoi-tiet', 'cua-hang', 'quy-lop', 'tai-lieu'] as const
// Đứt đồng bộ với kiểu `FetchApi` của gói bài học ⇒ lỗi kiểu ngay tại đây (không đợi tới lúc chạy).
type SameSet<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never
const _fetchApisInSync: SameSet<(typeof FETCH_APIS)[number], FetchApi> = true
void _fetchApisInSync

const laneRequestSchema = z.discriminatedUnion('lane', [
  z.object({ lane: z.literal('javascript'), code: text, stdinLines: z.optional(lines) }),
  z.object({ lane: z.literal('dom'), code: text, html: text, hanhDong: z.optional(lines) }),
  z.object({
    lane: z.literal('fetch'),
    code: text,
    html: text,
    hanhDong: z.optional(lines),
    api: z.optional(z.enum(FETCH_APIS)),
  }),
  z.object({ lane: z.literal('sql'), code: text, seed: z.optional(text) }),
  z.object({
    lane: z.literal('python'),
    code: text,
    stdinLines: z.optional(lines),
    files: z.optional(z.record(z.string().check(z.maxLength(256)), text)),
  }),
])

const runnerRequestSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('run'), id: runId, req: laneRequestSchema }),
  z.object({ type: z.literal('reset') }),
])

const codeRunResultSchema = z.object({
  output: z.string().check(z.maxLength(MAX_OUTPUT_CHARS)),
  error: z.optional(z.string().check(z.maxLength(MAX_OUTPUT_CHARS))),
  timedOut: z.boolean(),
  durationMs: z.number(),
})

const runnerEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hello'), protocol: z.number() }),
  z.object({ type: z.literal('loading'), id: runId }),
  z.object({
    type: z.literal('output'),
    id: runId,
    text: z.string().check(z.maxLength(MAX_OUTPUT_CHARS)),
  }),
  z.object({ type: z.literal('result'), id: runId, result: codeRunResultSchema }),
])

export type RunnerRequest = { type: 'run'; id: string; req: WorkerLaneRequest } | { type: 'reset' }

export type RunnerEvent =
  | { type: 'hello'; protocol: number }
  | { type: 'loading'; id: string }
  | { type: 'output'; id: string; text: string }
  | { type: 'result'; id: string; result: CodeRunResult }

/** Tin nhắn app → runner; sai hình thì `null` (bên gọi bỏ qua, không trả lời). */
export function parseRunnerRequest(data: unknown): RunnerRequest | null {
  const parsed = runnerRequestSchema.safeParse(data)
  return parsed.success ? (parsed.data as RunnerRequest) : null
}

/** Tin nhắn runner → app; sai hình thì `null`. */
export function parseRunnerEvent(data: unknown): RunnerEvent | null {
  const parsed = runnerEventSchema.safeParse(data)
  return parsed.success ? (parsed.data as RunnerEvent) : null
}

/**
 * Chuẩn hoá một origin cấu hình (vd `VITE_CODE_RUNNER_ORIGIN`): chỉ nhận `http(s)://host[:port]`
 * đúng dạng origin — có đường dẫn, query hay dấu `/` cuối là cấu hình sai, trả `null`.
 */
export function parseRunnerOrigin(raw: string | undefined): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.origin === raw ? raw : null
  } catch {
    return null
  }
}
