import type { GitStateSnapshot } from '@dhcb/subject-programming/gitSim'
// codeRunResult — Hình dạng kết quả CHUNG cho mọi bộ chạy code của môn Lập trình
// (Python/Pyodide, JavaScript/Worker, và SQL ở PR sau). Tách riêng để pythonRunner và
// jsRunner không phải import lẫn nhau chỉ vì một cái kiểu.
export interface CodeRunResult {
  /** Toàn bộ output đã in (stdout + stderr, theo thứ tự). */
  gitState?: GitStateSnapshot
  output: string
  /** Thông điệp lỗi — undefined nếu chạy sạch. */
  error?: string
  /** true nếu bị ngắt vì quá thời gian cho phép. */
  timedOut: boolean
  durationMs: number
}
