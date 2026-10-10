// runnerHost — Lõi của trang runner (`runner.html` ở origin `run.…`): nhận yêu cầu chạy code từ
// app qua postMessage, chạy bằng ĐÚNG các làn Worker app vẫn dùng (lib/workerLanes.ts), gửi tiến
// độ + kết quả về. Viết thành hàm thuần nhận "môi trường" để test không cần iframe thật.
//
// Ba lớp chặn tin nhắn lạ (đặc tả docs/specs/2026-10-10-tach-runtime-chay-code-ten-mien-con.md):
//   1. Không nằm trong khung (mở thẳng runner.html) → không làm gì cả.
//   2. Chỉ nhận tin từ ĐÚNG cửa sổ cha và ĐÚNG origin cha khai ở `?parent=` (CSP
//      `frame-ancestors` của runner đã bảo đảm chỉ origin app mới nhúng được trang này).
//   3. Tin nhắn phải khớp schema (runnerProtocol.ts).
// Trả lời luôn gửi tới đúng origin cha — không bao giờ `'*'`.
import {
  RUNNER_PROTOCOL_VERSION,
  parseRunnerOrigin,
  parseRunnerRequest,
  type RunnerEvent,
} from '../lib/runnerProtocol'
import type { runWorkerLane } from '../lib/workerLanes'

export interface RunnerEnvironment {
  /** Giá trị `?parent=` của URL trang runner (origin của app nhúng nó). */
  parentParam: string | null
  /** `window.parent` — chính là `window` khi trang KHÔNG nằm trong khung. */
  parentWindow: unknown
  selfWindow: unknown
  post: (event: RunnerEvent, targetOrigin: string) => void
  runLane: typeof runWorkerLane
  resetLanes: () => void
}

export interface IncomingMessage {
  origin: string
  source: unknown
  data: unknown
}

/**
 * Khởi động runner: gửi `hello` cho app rồi trả về hàm xử lý tin nhắn để gắn vào
 * `window.addEventListener('message', …)`. Trả `null` khi không được phép chạy (không nằm trong
 * khung hoặc thiếu/sai origin cha) — trang giữ trống.
 */
export function startRunner(env: RunnerEnvironment): ((msg: IncomingMessage) => void) | null {
  const parentOrigin = parseRunnerOrigin(env.parentParam ?? undefined)
  if (!parentOrigin || env.parentWindow === env.selfWindow) return null

  env.post({ type: 'hello', protocol: RUNNER_PROTOCOL_VERSION }, parentOrigin)

  return (msg) => {
    if (msg.origin !== parentOrigin || msg.source !== env.parentWindow) return
    const request = parseRunnerRequest(msg.data)
    if (!request) {
      console.warn('[runner] Bỏ qua tin nhắn sai hợp đồng')
      return
    }
    if (request.type === 'reset') {
      env.resetLanes()
      return
    }
    const { id } = request
    env
      .runLane(request.req, {
        onOutput: (text) => env.post({ type: 'output', id, text }, parentOrigin),
        onLoading: () => env.post({ type: 'loading', id }, parentOrigin),
      })
      .then(
        (result) => env.post({ type: 'result', id, result }, parentOrigin),
        // Các làn tự bắt lỗi của code học viên; tới được đây là lỗi của chính runner (worker không
        // tạo được…). Vẫn trả một kết quả để app không chờ mãi.
        (err: unknown) =>
          env.post(
            {
              type: 'result',
              id,
              result: {
                output: '',
                error: `Không chạy được code: ${err instanceof Error ? err.message : String(err)}`,
                timedOut: false,
                durationMs: 0,
              },
            },
            parentOrigin,
          ),
      )
  }
}
