// gitRunner — "Chạy" một bài Git/dòng lệnh trong trình duyệt (PR-L9).
//
// KHÔNG CẦN WORKER, cùng lý do với htmlRunner: bộ mô phỏng (gitSim.ts) chỉ duyệt một danh
// sách lệnh HỮU HẠN do học viên gõ — không có vòng lặp, không có code của học viên được thực
// thi, nên không thể treo. Mọi thứ chạy đồng bộ, tức thì.
//
// Cổng CI gọi CHÍNH hàm chayLenh() này, nên hai nơi không thể lệch nhau (engine thuần
// TypeScript, không phụ thuộc trình duyệt hay Node).
import { chayLenh } from '@dhcb/subject-programming/gitSim'
import type { CodeRunResult } from './codeRunResult'

export interface GitRunOptions {
  /** Lệnh dựng bối cảnh, chạy trước và KHÔNG in ra (xem gitSim.chayLenh). */
  lenhChuanBi?: string[]
}

export function runGit(code: string, options: GitRunOptions = {}): Promise<CodeRunResult> {
  const batDau = Date.now()
  const r = chayLenh(code, options.lenhChuanBi ?? [])
  return Promise.resolve({
    output: r.output,
    ...(r.gitState ? { gitState: r.gitState } : {}),
    // Lệnh gõ sai KHÔNG phải "sự cố hệ thống" mà là một phần bài học: output vẫn giữ nguyên
    // dòng `loi: …` để học viên đọc, và trường error cho phép bộ chấm đánh rớt ca đó.
    ...(r.error ? { error: r.error } : {}),
    timedOut: false,
    durationMs: Date.now() - batDau,
  })
}
