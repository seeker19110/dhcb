// tsRunner — Bộ chạy bài TYPESCRIPT (PR-L16). Hai chặng:
//   ① gửi code lên `/api/programming/ts-check` để KIỂM KIỂU (trình biên dịch tsc nằm ở server
//      — xem lý do ở apps/server/src/api/subjects/programming/ts-check.ts),
//   ② còn lỗi kiểu thì DỪNG và in lỗi; sạch kiểu thì chạy JavaScript sinh ra bằng ĐÚNG Worker
//      JavaScript đã có (jsRunner), nên vẫn có ngắt vòng lặp vô hạn và cách ly như bài JS.
//
// Chặng ① dừng hẳn khi có lỗi là CHỦ Ý SƯ PHẠM, không phải giới hạn kỹ thuật: điều đáng giá
// nhất của TypeScript là chặn TRƯỚC khi chạy, nên học viên phải thấy đúng cảnh đó.
import type { CodeRunResult } from './codeRunResult'
import { getAuthHeader } from '@core/authHeader'
import { runSandboxedLane } from './runnerBridge'
import { dinhDangKetQuaTs, TIEU_DE_LOI } from '@dhcb/subject-programming/tsPrelude'

export interface TsRunOptions {
  stdinLines?: string[]
  onOutput?: (textSoFar: string) => void
}

interface KetQuaApi {
  loi: string[]
  js: string
}

const LOI_MANG = 'Không kiểm được kiểu (mất mạng?). Thử lại khi có kết nối nhé.'

// Chấm một bài = chạy lại code với NHIỀU bộ dữ liệu, mà kết quả kiểm kiểu thì chỉ phụ thuộc
// code. Không nhớ lại thì mỗi ca test là một lượt gọi server + một lượt chạy tsc — chậm cho
// học viên và tốn CPU vô ích. Nhớ đúng MỘT lượt gần nhất là đủ (chấm xong là code lại đổi).
let daBienDich: { code: string; ketQua: KetQuaApi } | null = null

/** Chỉ dùng cho test — xoá bộ nhớ tạm giữa các ca. */
export function resetTsCache(): void {
  daBienDich = null
}

export async function runTypeScript(
  code: string,
  options: TsRunOptions = {},
): Promise<CodeRunResult> {
  const batDau = Date.now()
  if (daBienDich?.code === code) return await chay(daBienDich.ketQua, options, batDau)

  let ketQua: KetQuaApi
  try {
    const res = await fetch('/api/programming/ts-check', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ code }),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      return {
        output: '',
        error: body.error ?? `Không kiểm được kiểu (mã ${res.status})`,
        timedOut: false,
        durationMs: Date.now() - batDau,
      }
    }
    ketQua = (await res.json()) as KetQuaApi
  } catch {
    return { output: '', error: LOI_MANG, timedOut: false, durationMs: Date.now() - batDau }
  }
  daBienDich = { code, ketQua }
  return await chay(ketQua, options, batDau)
}

/** Phần sau khi đã có kết quả kiểm kiểu — tách ra để lượt dùng lại bộ nhớ tạm đi cùng đường. */
async function chay(
  ketQua: KetQuaApi,
  options: TsRunOptions,
  batDau: number,
): Promise<CodeRunResult> {
  if (ketQua.loi.length > 0) {
    // Không chạy gì cả — nhưng vẫn là một lượt chạy THÀNH CÔNG về mặt kỹ thuật (không phải
    // lỗi hệ thống), nên trả qua `output` để engine chấm test-case đối chiếu như mọi bài.
    const output = [TIEU_DE_LOI, ...ketQua.loi].join('\n')
    options.onOutput?.(output)
    return { output, timedOut: false, durationMs: Date.now() - batDau }
  }

  // JS sinh ra chạy đúng làn JavaScript (ở runner `run.…` nếu đã cấu hình — xem runnerBridge.ts).
  const chay = await runSandboxedLane(
    {
      lane: 'javascript',
      code: ketQua.js,
      ...(options.stdinLines ? { stdinLines: options.stdinLines } : {}),
    },
    // Output của bước chạy phải đi kèm tiêu đề để khớp với thứ cổng CI dựng ra.
    options.onOutput
      ? { onOutput: (text: string) => options.onOutput?.(dinhDangKetQuaTs([], text)) }
      : {},
  )
  return {
    ...chay,
    output: dinhDangKetQuaTs([], chay.output),
    durationMs: Date.now() - batDau,
  }
}
