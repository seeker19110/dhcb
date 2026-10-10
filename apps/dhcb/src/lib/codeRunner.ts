// codeRunner — ĐIỂM VÀO DUY NHẤT để chạy code bài học (PR-L7b1). Trang bài học không tự
// chọn bộ chạy; nó gọi runLessonCode() và trường `language` của bài quyết định.
//
// Thêm ngôn ngữ mới (SQL ở PR-L7b2): thêm một nhánh ở đây + một bộ chạy riêng, KHÔNG rải
// if/else về ngôn ngữ ra các trang.
import type { ProgrammingLesson } from '@dhcb/subject-programming/lessonTypes'
import type { CodeRunResult } from './codeRunResult'
import { runSandboxedLane, resetSandboxedLanes } from './runnerBridge'
import { runHtml } from './htmlRunner'
import { runGit } from './gitRunner'
import { runBash } from './bashRunner'
import { runHermes } from './hermesRunner'
import { runVibe } from './vibeRunner'
import { runOpenclaw } from './openclawRunner'
import { runSwift } from './swiftRunner'
import { runKotlin } from './kotlinRunner'
import { runTypeScript } from './tsRunner'
import type { FetchApi } from '@dhcb/subject-programming/fetchPrelude'
import { laLanPython, fileCuaLan, noiCodeTheoLan } from '@dhcb/subject-programming/pyLanes'

export type LessonLanguage = ProgrammingLesson['language']

/** Bài mà học viên gõ LỆNH chứ không phải code (Git ở P3-U10/U11, dòng lệnh ở chương trình M).
 *  Khai ở đây để giao diện không phải liệt kê tay từng ngôn ngữ ở mỗi chỗ cần đổi chữ. */
export function laBaiDongLenh(language: LessonLanguage): boolean {
  return (
    language === 'git' ||
    language === 'bash' ||
    language === 'hermes' ||
    language === 'vibe' ||
    language === 'openclaw'
  )
}

export interface LessonRunOptions {
  stdinLines?: string[]
  onOutput?: (textSoFar: string) => void
  /** Gọi khi bắt đầu tải môi trường nặng (Pyodide ~13MB). JavaScript không dùng tới. */
  onLoading?: () => void
  /** Workspace nhiều file — hiện chỉ Python (dự án trục) dùng. */
  files?: Record<string, string>
  /** Bài 'dom': trang HTML có sẵn mà script của học viên tác động lên (bắt buộc với 'dom'). */
  domHtml?: string
  /** Bài/bước 'fetch': API mẫu nào phục vụ lượt chạy — bài học P3-U7 dùng API thời tiết
   *  (mặc định), dự án trục chặng P3 dùng API menu cửa hàng của chính dự án. */
  fetchApi?: FetchApi
  /** Bài 'sql': bộ dữ liệu riêng của ca chấm (testCase.datasetSql) thay cho SQL_SEED mặc định. */
  datasetSql?: string
}

export function runLessonCode(
  language: LessonLanguage,
  code: string,
  options: LessonRunOptions = {},
): Promise<CodeRunResult> {
  // Callback tiến độ đi riêng với yêu cầu (yêu cầu phải là dữ liệu thuần — xem workerLanes.ts).
  // Làn Worker đi qua runnerBridge: chạy ở origin runner `run.…` nếu đã cấu hình.
  const callbacks = {
    ...(options.onOutput ? { onOutput: options.onOutput } : {}),
    ...(options.onLoading ? { onLoading: options.onLoading } : {}),
  }
  if (language === 'javascript') {
    const { stdinLines } = options
    return runSandboxedLane(
      { lane: 'javascript', code, ...(stdinLines ? { stdinLines } : {}) },
      callbacks,
    )
  }
  if (language === 'dom' || language === 'fetch') {
    const { stdinLines, domHtml, fetchApi } = options
    if (!domHtml) {
      // Bài 'dom' không có trang thì không chấm được — nói thẳng thay vì chạy ra kết quả rỗng.
      return Promise.resolve({
        output: '',
        error: 'Bài này thiếu trang HTML đi kèm (domHtml).',
        timedOut: false,
        durationMs: 0,
      })
    }
    const chung = { code, html: domHtml, ...(stdinLines ? { hanhDong: stdinLines } : {}) }
    // Bài 'fetch' = bài DOM cộng fetch giả lập — worker riêng, cùng khuôn chạy.
    return runSandboxedLane(
      language === 'fetch'
        ? { lane: 'fetch', ...chung, ...(fetchApi ? { api: fetchApi } : {}) }
        : { lane: 'dom', ...chung },
      { ...(options.onOutput ? { onOutput: options.onOutput } : {}) },
    )
  }
  if (language === 'git') {
    // Bài Git/dòng lệnh: "code" là DANH SÁCH LỆNH học viên gõ; `stdinLines` mang lệnh dựng
    // bối cảnh (kho đã có sẵn vài commit…), tái dùng đúng ô có sẵn như bài DOM đã làm.
    const { stdinLines } = options
    return runGit(code, { ...(stdinLines ? { lenhChuanBi: stdinLines } : {}) })
  }
  if (language === 'bash') {
    // Bài dòng lệnh (chương trình M tầng 1): giống hệt bài Git về mặt đường đi — "code" là
    // script học viên gõ, `stdinLines` mang lệnh dựng bối cảnh (tạo sẵn file/thư mục cho đề
    // bài). Bộ mô phỏng khác (bashSim), khái niệm giao diện thì không đổi.
    const { stdinLines } = options
    return runBash(code, { ...(stdinLines ? { lenhChuanBi: stdinLines } : {}) })
  }
  if (language === 'hermes') {
    // Bài Hermes Agent (khoá ngắn Hermes): cùng đường đi với bài Git/bash — "code" là danh
    // sách lệnh học viên gõ, `stdinLines` mang lệnh dựng bối cảnh (agent đã có việc chờ
    // duyệt…). Bộ mô phỏng khác (hermesSim), khái niệm giao diện không đổi.
    const { stdinLines } = options
    return runHermes(code, { ...(stdinLines ? { lenhChuanBi: stdinLines } : {}) })
  }
  if (language === 'vibe') {
    // Bài tác tử AI viết code (khoá ngắn Vibe Code): cùng đường đi với bài Git/bash/hermes —
    // "code" là danh sách lệnh học viên gõ, `stdinLines` mang lệnh dựng bối cảnh (dự án đã
    // có bản nháp chờ xem…). Bộ mô phỏng khác (vibeSim), khái niệm giao diện không đổi.
    const { stdinLines } = options
    return runVibe(code, { ...(stdinLines ? { lenhChuanBi: stdinLines } : {}) })
  }
  if (language === 'openclaw') {
    // Bài OpenClaw (khoá ngắn OpenClaw): cùng đường đi với bài Git/bash/hermes — "code" là
    // danh sách lệnh học viên gõ, `stdinLines` mang lệnh dựng bối cảnh (đã onboard, đã có
    // kênh…). Bộ mô phỏng khác (openclawSim), khái niệm giao diện không đổi.
    const { stdinLines } = options
    return runOpenclaw(code, { ...(stdinLines ? { lenhChuanBi: stdinLines } : {}) })
  }
  if (language === 'swift') {
    // Bài Swift chạy trên trình thông dịch tập con (swiftSim) — không Worker, không mạng, và
    // KHÔNG có readLine() nên bài lấy dữ liệu từ hằng trong đề, đúng khuôn ví dụ sách Swift.
    return runSwift(code)
  }
  if (language === 'kotlin') {
    // Bài Kotlin chạy trên trình thông dịch tập con (kotlinSim) — không Worker, không mạng, và
    // KHÔNG có readLine() nên bài lấy dữ liệu từ hằng trong đề, đúng khuôn ví dụ sách Kotlin.
    return runKotlin(code)
  }
  if (language === 'html') {
    // Bài HTML/CSS không có input() và không chạy script — "chạy" nghĩa là dựng cây DOM rồi
    // mô tả lại. Khung XEM TRANG là phần riêng của giao diện (iframe sandbox="").
    return runHtml(code)
  }
  if (language === 'typescript') {
    // Kiểm kiểu ở server rồi chạy JavaScript sinh ra trong Worker JS đã có — xem tsRunner.ts.
    const { stdinLines, onOutput } = options
    return runTypeScript(code, {
      ...(stdinLines ? { stdinLines } : {}),
      ...(onOutput ? { onOutput } : {}),
    })
  }
  if (language === 'sql') {
    // SQL không có input(): dữ liệu đã nằm sẵn trong CSDL mẫu (sqlDataset.ts). Ca chấm nào
    // khai datasetSql thì lượt đó nạp bộ dữ liệu riêng của nó — đúng luật cổng CI đang dùng.
    const { datasetSql } = options
    return runSandboxedLane(
      { lane: 'sql', code, ...(datasetSql ? { seed: datasetSql } : {}) },
      callbacks,
    )
  }
  // Còn lại là các LÀN chạy bằng engine Python. Làn mở rộng của bậc P4 (pytest…) chỉ khác
  // Python thuần ở mấy module ghi sẵn vào workspace + phần nối cuối — khai báo ở pyLanes.ts,
  // dùng chung với cổng CI để hai nơi không trôi khỏi nhau.
  const lane = laLanPython(language) ? language : 'python'
  const laneFiles = fileCuaLan(lane)
  const files =
    Object.keys(laneFiles).length > 0 ? { ...laneFiles, ...(options.files ?? {}) } : options.files
  const { stdinLines } = options
  return runSandboxedLane(
    {
      lane: 'python',
      code: noiCodeTheoLan(lane, code),
      ...(stdinLines ? { stdinLines } : {}),
      ...(files ? { files } : {}),
    },
    callbacks,
  )
}

/** Dọn mọi môi trường đã nạp — gọi khi rời trang bài học. */
export function resetLessonRunners(): void {
  resetSandboxedLanes()
}
