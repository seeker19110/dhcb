// workerLanes — Các LÀN chạy code học viên bằng Web Worker (JS, DOM, fetch, SQL, Python), gói
// thành MỘT hàm nhận yêu cầu thuần dữ liệu.
//
// Vì sao tách khỏi codeRunner (đặc tả docs/specs/2026-10-10-tach-runtime-chay-code-ten-mien-con.md):
// cùng một lượt chạy giờ có thể diễn ra ở HAI nơi — ngay trong trang app (dev, test, đường lui)
// hoặc trong trang runner ở origin riêng `run.…` (production). Cả hai gọi đúng hàm này nên kết quả
// chấm không thể lệch nhau. Yêu cầu là dữ liệu thuần (không hàm) để gửi được qua postMessage;
// hai callback tiến độ đi riêng.
import type { FetchApi } from '@dhcb/subject-programming/fetchPrelude'
import type { CodeRunResult } from './codeRunResult'
import { runPython, resetPythonWorker } from './pythonRunner'
import { runJavaScript, resetJsWorker } from './jsRunner'
import { runSql, resetSqlWorker } from './sqlRunner'
import { runDom, resetDomWorker } from './domRunner'
import { runFetchLesson, resetFetchWorker } from './fetchRunner'

export type WorkerLaneRequest =
  | { lane: 'javascript'; code: string; stdinLines?: string[] }
  | { lane: 'dom'; code: string; html: string; hanhDong?: string[] }
  | { lane: 'fetch'; code: string; html: string; hanhDong?: string[]; api?: FetchApi }
  | { lane: 'sql'; code: string; seed?: string }
  /** `code` đã nối prelude của làn Python mở rộng (pyLanes) — runner không biết gì về làn con. */
  | { lane: 'python'; code: string; stdinLines?: string[]; files?: Record<string, string> }

export interface WorkerLaneCallbacks {
  onOutput?: (textSoFar: string) => void
  /** Bắt đầu tải môi trường nặng lần đầu (Pyodide ~13 MB, SQLite ~648 KB). */
  onLoading?: () => void
}

export function runWorkerLane(
  req: WorkerLaneRequest,
  { onOutput, onLoading }: WorkerLaneCallbacks = {},
): Promise<CodeRunResult> {
  // Chỉ gắn field khi có giá trị — các bộ chạy con phân biệt "không truyền" với `undefined`.
  const out = onOutput ? { onOutput } : {}
  const loading = onLoading ? { onLoading } : {}
  switch (req.lane) {
    case 'javascript':
      return runJavaScript(req.code, {
        ...(req.stdinLines ? { stdinLines: req.stdinLines } : {}),
        ...out,
      })
    case 'dom':
    case 'fetch': {
      const chung = {
        html: req.html,
        ...(req.hanhDong ? { hanhDong: req.hanhDong } : {}),
        ...out,
      }
      return req.lane === 'fetch'
        ? runFetchLesson(req.code, { ...chung, ...(req.api ? { api: req.api } : {}) })
        : runDom(req.code, chung)
    }
    case 'sql':
      return runSql(req.code, { ...out, ...loading, ...(req.seed ? { seed: req.seed } : {}) })
    case 'python':
      return runPython(req.code, {
        ...(req.stdinLines ? { stdinLines: req.stdinLines } : {}),
        ...(req.files ? { files: req.files } : {}),
        ...out,
        ...loading,
      })
  }
}

/** Dọn mọi Worker đã nạp (giải phóng Pyodide/SQLite) — gọi khi rời trang bài học. */
export function resetWorkerLanes(): void {
  resetPythonWorker()
  resetJsWorker()
  resetSqlWorker()
  resetDomWorker()
  resetFetchWorker()
}
