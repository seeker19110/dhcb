// runnerBridge — Phía APP của việc chạy code học viên ở origin riêng `run.…` (đặc tả
// docs/specs/2026-10-10-tach-runtime-chay-code-ten-mien-con.md, bước R2).
//
// Mọi lượt chạy bằng Worker (JS, DOM, fetch, SQL, Python) đi qua `runSandboxedLane()`:
//   · CÓ `VITE_CODE_RUNNER_ORIGIN` lúc build → gửi sang iframe runner ẩn qua postMessage. Code
//     học viên chạy ở origin khác nên không đọc được cookie/localStorage/IndexedDB của app, và
//     `fetch('/api/…')` trong code học viên đi tới host runner (không có API) chứ không phải app.
//   · KHÔNG có biến → chạy bằng Worker ngay trong trang như trước (dev, unit test, đường lui).
// Hai đường gọi ĐÚNG một hàm chạy (`runWorkerLane`, phía runner gọi lại nó) nên kết quả chấm bài
// không thể lệch nhau.
//
// Lõi `createRunnerBridge(env)` là hàm thuần nhận "môi trường" để test không cần iframe thật.
import type { CodeRunResult } from './codeRunResult'
import {
  parseRunnerEvent,
  parseRunnerOrigin,
  type RunnerEvent,
  type RunnerRequest,
} from './runnerProtocol'
import {
  resetWorkerLanes,
  runWorkerLane,
  type WorkerLaneCallbacks,
  type WorkerLaneRequest,
} from './workerLanes'

/** Runner phải chào (`hello`) trong khoảng này kể từ lúc tạo iframe. */
export const HELLO_TIMEOUT_MS = 10_000
/** Lượt chạy im lặng quá mức này (không output/kết quả) ⇒ runner coi như chết. Mỗi làn tự ngắt
 *  code học viên sau tối đa 10s (pythonRunner/sqlRunner), nên 15s chỉ vượt khi chính runner hỏng. */
export const RUN_WATCHDOG_MS = 15_000
/** Sau `loading` (tải Pyodide ~13 MB lần đầu) runner chưa đếm giờ chạy — cho mạng chậm thời gian. */
export const LOADING_WATCHDOG_MS = 180_000

export const BRIDGE_UNAVAILABLE_MESSAGE =
  'Không mở được khung chạy code — kiểm tra mạng rồi thử lại.'
export const BRIDGE_STALLED_MESSAGE =
  'Khung chạy code không phản hồi nên đã được khởi động lại — hãy bấm chạy lại.'
export const BRIDGE_STOPPED_MESSAGE = 'Đã dừng chương trình theo yêu cầu.'

type FrameState = 'ready' | 'unavailable' | 'stopped'

/** Iframe runner nhìn từ phía app — đủ để gửi tin và nhận diện tin trả về. */
export interface RunnerFrame {
  /** `iframe.contentWindow` — so với `event.source` để biết tin đến từ đúng khung. */
  readonly window: unknown
  post(message: RunnerRequest, targetOrigin: string): void
  remove(): void
}

export interface BridgeEnvironment {
  runnerOrigin: string
  appOrigin: string
  createFrame(src: string): RunnerFrame
  /** Gắn listener `message` của cửa sổ app; trả hàm gỡ. */
  listen(handler: (msg: { origin: string; source: unknown; data: unknown }) => void): () => void
  newId(): string
}

interface PendingRun {
  callbacks: WorkerLaneCallbacks
  resolve: (result: CodeRunResult) => void
  timer: ReturnType<typeof setTimeout> | null
  startedAt: number
  output: string
}

export interface RunnerBridge {
  run(req: WorkerLaneRequest, callbacks?: WorkerLaneCallbacks): Promise<CodeRunResult>
  /** Huỷ iframe (giải phóng Pyodide/SQLite); lượt đang chờ nhận lỗi "đã dừng". */
  reset(): void
}

export function createRunnerBridge(env: BridgeEnvironment): RunnerBridge {
  let frame: RunnerFrame | null = null
  let ready: Promise<FrameState> | null = null
  let markReady: ((state: FrameState) => void) | null = null
  let unlisten: (() => void) | null = null
  const pending = new Map<string, PendingRun>()

  const failResult = (run: PendingRun, error: string): CodeRunResult => ({
    output: run.output,
    error,
    timedOut: false,
    durationMs: Date.now() - run.startedAt,
  })

  /** Bỏ iframe hiện tại; mọi lượt đang chờ (kể cả lượt còn chờ `hello`) nhận lỗi `error`. */
  const teardown = (error: string, state: FrameState) => {
    unlisten?.()
    unlisten = null
    frame?.remove()
    frame = null
    markReady?.(state)
    markReady = null
    ready = null
    for (const [id, run] of pending) {
      if (run.timer) clearTimeout(run.timer)
      pending.delete(id)
      run.resolve(failResult(run, error))
    }
  }

  const armWatchdog = (run: PendingRun, ms: number) => {
    if (run.timer) clearTimeout(run.timer)
    run.timer = setTimeout(() => teardown(BRIDGE_STALLED_MESSAGE, 'unavailable'), ms)
  }

  const onEvent = (event: RunnerEvent) => {
    if (event.type === 'hello') {
      markReady?.('ready')
      markReady = null
      return
    }
    const run = pending.get(event.id)
    if (!run) return
    if (event.type === 'loading') {
      armWatchdog(run, LOADING_WATCHDOG_MS)
      run.callbacks.onLoading?.()
    } else if (event.type === 'output') {
      armWatchdog(run, RUN_WATCHDOG_MS)
      run.output = event.text
      run.callbacks.onOutput?.(event.text)
    } else {
      if (run.timer) clearTimeout(run.timer)
      pending.delete(event.id)
      run.resolve(event.result)
    }
  }

  const ensureFrame = (): Promise<FrameState> => {
    if (ready) return ready
    const src = `${env.runnerOrigin}/runner.html?parent=${encodeURIComponent(env.appOrigin)}`
    const current = env.createFrame(src)
    frame = current
    unlisten = env.listen((msg) => {
      // Chỉ tin nhắn từ ĐÚNG khung runner, ĐÚNG origin, ĐÚNG hợp đồng.
      if (msg.origin !== env.runnerOrigin || msg.source !== current.window) return
      const event = parseRunnerEvent(msg.data)
      if (!event) {
        console.warn('[runnerBridge] Bỏ qua tin nhắn sai hợp đồng từ runner')
        return
      }
      onEvent(event)
    })
    ready = new Promise<FrameState>((resolve) => {
      markReady = resolve
      setTimeout(() => resolve('unavailable'), HELLO_TIMEOUT_MS)
    }).then((state) => {
      // Không chào kịp: dọn khung hỏng để lượt sau thử dựng lại từ đầu.
      if (state !== 'ready' && frame === current) teardown(BRIDGE_UNAVAILABLE_MESSAGE, state)
      return state
    })
    return ready
  }

  return {
    async run(req, callbacks = {}) {
      const startedAt = Date.now()
      const state = await ensureFrame()
      if (state !== 'ready' || !frame) {
        const error = state === 'stopped' ? BRIDGE_STOPPED_MESSAGE : BRIDGE_UNAVAILABLE_MESSAGE
        return { output: '', error, timedOut: false, durationMs: 0 }
      }
      const id = env.newId()
      const target = frame
      return new Promise<CodeRunResult>((resolve) => {
        const run: PendingRun = { callbacks, resolve, timer: null, startedAt, output: '' }
        pending.set(id, run)
        armWatchdog(run, RUN_WATCHDOG_MS)
        target.post({ type: 'run', id, req }, env.runnerOrigin)
      })
    },
    reset() {
      teardown(BRIDGE_STOPPED_MESSAGE, 'stopped')
    },
  }
}

// ── Nối với trình duyệt thật ────────────────────────────────────────────────────────────────

const RUNNER_ORIGIN = parseRunnerOrigin(import.meta.env.VITE_CODE_RUNNER_ORIGIN)

let browserBridge: RunnerBridge | null = null

function getBrowserBridge(runnerOrigin: string): RunnerBridge {
  browserBridge ??= createRunnerBridge({
    runnerOrigin,
    appOrigin: window.location.origin,
    createFrame(src) {
      const iframe = document.createElement('iframe')
      // allow-same-origin để Worker/Pyodide trong runner dùng được origin `run.…` của CHÍNH nó
      // (tải /pyodide/, /sqljs/). An toàn vì origin đó khác app — xem đặc tả mục 2.1.
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin')
      iframe.setAttribute('aria-hidden', 'true')
      iframe.tabIndex = -1
      iframe.title = 'Khung chạy code'
      iframe.style.display = 'none'
      iframe.src = src
      document.body.append(iframe)
      return {
        get window() {
          return iframe.contentWindow
        },
        post(message, targetOrigin) {
          iframe.contentWindow?.postMessage(message, targetOrigin)
        },
        remove() {
          iframe.remove()
        },
      }
    },
    listen(handler) {
      const onMessage = (e: MessageEvent) =>
        handler({ origin: e.origin, source: e.source, data: e.data as unknown })
      window.addEventListener('message', onMessage)
      return () => window.removeEventListener('message', onMessage)
    },
    newId: () => crypto.randomUUID(),
  })
  return browserBridge
}

/** Origin runner đã cấu hình (null = chạy trong trang). HtmlPreview dùng để chọn khung xem. */
export function getRunnerOrigin(): string | null {
  return RUNNER_ORIGIN
}

/** Chạy một lượt code học viên bằng Worker — ở runner nếu đã cấu hình, không thì ngay trong trang. */
export function runSandboxedLane(
  req: WorkerLaneRequest,
  callbacks: WorkerLaneCallbacks = {},
): Promise<CodeRunResult> {
  return RUNNER_ORIGIN
    ? getBrowserBridge(RUNNER_ORIGIN).run(req, callbacks)
    : runWorkerLane(req, callbacks)
}

/** Dọn mọi môi trường chạy code đã nạp — gọi khi rời trang hoặc bấm Dừng. */
export function resetSandboxedLanes(): void {
  if (RUNNER_ORIGIN) browserBridge?.reset()
  else resetWorkerLanes()
}
