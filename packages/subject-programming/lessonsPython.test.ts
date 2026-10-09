// CỔNG NỘI DUNG MẠNH NHẤT của môn Lập trình: chạy code THẬT bằng python3 rồi chấm bằng
// ĐÚNG engine mà học viên gặp (grading.ts), cho:
//   1. mọi `make.sampleSolution` của bài học   → phải đạt HẾT test-case của bài
//   2. mọi `workedExample.code`                 → phải chạy không lỗi (ví dụ mẫu không được vỡ)
//   3. mọi `predict.code` + đáp án              → output thật phải khớp lựa chọn đúng
//   4. mọi `referenceCode` của bước dự án trục  → phải đạt HẾT milestone check của bước
//
// Vì sao cần: soạn nội dung bằng tay rất dễ sai số học/định dạng chuỗi (đã xảy ra thật ở
// PR-L3: 150 kWh ghi nhầm 305.850 thay vì 306.000). Test số học đối chiếu chỉ bắt được lỗi
// TÍNH; cổng này bắt cả lỗi CODE (thụt lề, tên biến, thiếu dòng in, sai định dạng f-string).
//
// Môi trường: cần python3 trên PATH (runner ubuntu của GitHub Actions luôn có; container dev
// cũng có). KHÔNG có python3 → test tự bỏ qua kèm cảnh báo, KHÔNG làm đỏ CI oan.
import { describe, expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { PROGRAMMING_LESSONS } from './lessons.js'
import { laLanPython, fileCuaLan, noiCodeTheoLan, type PythonLane } from './pyLanes.js'
import { getProjectStages, getStepLanguage, type ProjectStep } from './projectSteps.js'
import { PROJECT_TRACK_IDS } from './projectTrackIds.js'
import { gradeTestCase, allTestsPassed } from './grading.js'
import type { ProgrammingTestCase } from './lessonTypes.js'

const hasPython = spawnSync('python3', ['--version']).status === 0

// Chỉ bài chạy bằng ENGINE PYTHON đi qua cổng này — gồm cả các LÀN mở rộng của bậc P4
// (pytest…), vì chúng dùng đúng engine đó, chỉ khác mấy module ghi sẵn vào thư mục làm việc
// (pyLanes.ts). Bài JavaScript có cổng riêng (lessonsJs.test.ts).
const PYTHON_LESSONS = PROGRAMMING_LESSONS.filter((l) => laLanPython(l.language))
const WORK_DIR = mkdtempSync(join(tmpdir(), 'dhcb-lesson-'))

// Mỗi làn một thư mục riêng đã ghi sẵn module của làn — dựng MỘT lần, dùng lại cho mọi lượt
// chạy, đúng cách Pyodide mount workspace ở trình duyệt.
const LANE_DIRS = new Map<PythonLane, string>()

function thuMucCuaLan(lane: PythonLane): string {
  const san = LANE_DIRS.get(lane)
  if (san) return san
  const files = fileCuaLan(lane)
  if (Object.keys(files).length === 0) {
    LANE_DIRS.set(lane, WORK_DIR)
    return WORK_DIR
  }
  const dir = mkdtempSync(join(tmpdir(), `dhcb-lan-${lane}-`))
  for (const [name, content] of Object.entries(files)) {
    // Tên có "/" = một GÓI Python (fastapi/__init__.py) — tạo thư mục cha trước, y hệt
    // cách worker Pyodide dựng workspace trong trình duyệt.
    const dich = join(dir, name)
    mkdirSync(dirname(dich), { recursive: true })
    writeFileSync(dich, content, 'utf8')
  }
  LANE_DIRS.set(lane, dir)
  return dir
}

/** Chạy một đoạn code của bài THEO ĐÚNG LÀN của nó (module + phần nối cuối + thư mục). */
function chayTheoLan(lane: PythonLane, code: string, stdinLines: string[]) {
  return runPython3(noiCodeTheoLan(lane, code), stdinLines, thuMucCuaLan(lane))
}

/** Python in CRLF trên Windows nhưng LF trên Linux/macOS; nội dung bài học dùng LF. */
function chuanHoaXuongDong(text: string): string {
  return text.replaceAll('\r\n', '\n')
}

/**
 * Các test nội dung gọi python3 đồng bộ rất nhiều lần. Nhường một lượt sau từng test
 * để worker Vitest nhận phản hồi RPC/reporting thay vì để hàng đợi onTaskUpdate vượt timeout.
 */
function nhuongEventLoop(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve))
}

// Prelude PHẢI khớp hành vi input() của sandbox trình duyệt (apps/dhcb/src/workers/
// pyodideWorker.ts): đọc tuần tự các dòng đã điền sẵn và ECHO "prompt + giá trị" ra stdout.
// Lệch prelude = test xanh nhưng học viên vẫn rớt → giữ hai nơi này khớp nhau.
function wrap(code: string, stdinLines: string[]): string {
  return `import builtins, json
_lines = json.loads(${JSON.stringify(JSON.stringify(stdinLines))})
_it = iter(_lines)
def _input(prompt=""):
    try:
        value = next(_it)
    except StopIteration:
        raise EOFError("het du lieu nhap")
    print(f"{prompt}{value}")
    return value
builtins.input = _input

${code}
`
}

interface RunOutcome {
  output: string
  error?: string
}

function runPython3(code: string, stdinLines: string[], cwd: string = WORK_DIR): RunOutcome {
  try {
    const output = execFileSync('python3', ['-c', wrap(code, stdinLines)], {
      encoding: 'utf8',
      timeout: 15_000,
      // Chạy trong thư mục TẠM: bài học P2-U6 ghi file CSV thật, không được để nó rơi
      // vào cây mã nguồn của repo khi chạy test.
      cwd,
      // Không cho code mẫu đọc stdin thật (mọi input phải đi qua prelude).
      stdio: ['ignore', 'pipe', 'pipe'],
      // Trên Windows, python3 mặc định in theo codepage console (không phải UTF-8) — chữ
      // tiếng Việt có dấu bị hỏng thành ký tự thay thế "�" trước khi Node kịp decode utf8.
      // Ép UTF-8 để output nhất quán trên mọi hệ điều hành.
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
    })
    return { output }
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message?: string }
    return { output: e.stdout ?? '', error: (e.stderr || e.message || 'lỗi chạy python3').trim() }
  }
}

function gradeAll(code: string, cases: ProgrammingTestCase[], cwd: string = WORK_DIR) {
  return cases.map((c) => {
    const r = runPython3(code, c.stdinLines, cwd)
    return gradeTestCase(c, r.output, r.error)
  })
}

/** Như gradeAll nhưng chạy theo làn của bài (bài Python thuần: y hệt gradeAll). */
function gradeAllTheoLan(lane: PythonLane, code: string, cases: ProgrammingTestCase[]) {
  return cases.map((c) => {
    const r = chayTheoLan(lane, code, c.stdinLines)
    return gradeTestCase(c, r.output, r.error)
  })
}

// Mô tả lỗi gọn cho người soạn nội dung biết sai ở ca nào.
function describeFailures(results: ReturnType<typeof gradeAll>): string {
  return results
    .filter((r) => !r.passed)
    .map(
      (r) => `[${r.label}] ${r.error ? `LỖI: ${r.error}` : `output thật: ${r.actual ?? '(ẩn)'}`}`,
    )
    .join(' | ')
}

// Mọi test trong khối này SINH TIẾN TRÌNH python3 thật, nên thời gian chạy phụ thuộc tải máy chứ
// không chỉ phụ thuộc code. Mặc định 5s của vitest quá sát: lúc máy rảnh bài chậm nhất đo được
// 2,4s (dư ~2x), nhưng khi chạy cùng lúc với bộ E2E thì `p5-u6-l1` mất 5,35s và ĐỎ — dù code
// hoàn toàn không sai (audit 2026-08-28, F8). Nới lên 30s: đủ rộng để tải máy không quyết định
// kết quả, vẫn đủ chặt để một bài treo thật thì lộ ra. Sửa TEST chứ không sửa code sản phẩm —
// bản thân bộ chạy không có gì sai.
//
// 2026-09-15 — VÌ SAO PHẢI ÁP CHO *MỌI* KHỐI: hằng số này trước đây chỉ được truyền cho 2 trong
// 4 khối `it.each`; hai khối còn lại (Predict, milestone check) vẫn dùng mặc định 5s. Đo thật
// lúc máy rảnh (chạy riêng file này): bài chậm nhất của khối có timeout là `p5-u6-l1` 1.866ms
// (dư 16x so với 30s), còn bài chậm nhất của khối KHÔNG có timeout là `p5-s2` 1.604ms — chỉ dư
// 3,1x so với 5s. Khi chạy TOÀN BỘ suite song song, 3,1x không đủ và `p5-s2` đỏ oan vì hết giờ
// (đo ở đợt S10-1: 5 lượt `test:coverage` thì 2 lượt đỏ, chạy riêng file thì 577/577 xanh).
// Vậy nên hằng số nay được truyền cho CẢ BỐN khối — không khối nào chạy python3 mà còn dùng
// mặc định 5s nữa. KHÔNG bỏ bớt/skip ca nào: số ca chạy giữ nguyên.
const PYTHON_TEST_TIMEOUT_MS = 30_000

describe.skipIf(!hasPython)('nội dung môn Lập trình chạy THẬT bằng python3', () => {
  it(
    'có python3 và chạy được (chống test rỗng vô nghĩa)',
    () => {
      expect(runPython3('print("ok")', []).output.trim()).toBe('ok')
    },
    PYTHON_TEST_TIMEOUT_MS,
  )

  it.each(PYTHON_LESSONS)(
    '$id — code mẫu đạt HẾT test-case',
    async (lesson) => {
      const results = gradeAllTheoLan(
        lesson.language as PythonLane,
        lesson.make.sampleSolution,
        lesson.make.testCases,
      )
      expect(allTestsPassed(results), `Bài ${lesson.id}: ${describeFailures(results)}`).toBe(true)
      await nhuongEventLoop()
    },
    PYTHON_TEST_TIMEOUT_MS,
  )

  it.each(PYTHON_LESSONS)(
    '$id — ví dụ mẫu chạy không lỗi',
    async (lesson) => {
      const r = chayTheoLan(
        lesson.language as PythonLane,
        lesson.workedExample.code,
        lesson.workedExample.stdinLines,
      )
      expect(r.error, `Bài ${lesson.id} ví dụ mẫu lỗi: ${r.error}`).toBeUndefined()
      expect(r.output.trim().length, `Bài ${lesson.id}: ví dụ mẫu không in gì`).toBeGreaterThan(0)
      await nhuongEventLoop()
    },
    PYTHON_TEST_TIMEOUT_MS,
  )

  it.each(PYTHON_LESSONS)(
    '$id — đáp án Predict khớp output thật',
    async (lesson) => {
      const r = chayTheoLan(lesson.language as PythonLane, lesson.predict.code, [])
      expect(r.error, `Bài ${lesson.id} code Predict lỗi: ${r.error}`).toBeUndefined()
      const answer = lesson.predict.choices[lesson.predict.answerIndex]!
      // Lựa chọn đúng phải xuất hiện trong output thật; các lựa chọn SAI thì không được
      // trùng khớp (tránh soạn nhầm 2 đáp án cùng đúng).
      const output = chuanHoaXuongDong(r.output)
      expect(
        output.includes(answer),
        `Bài ${lesson.id}: đáp án "${answer}" KHÔNG có trong output thật "${output.trim()}"`,
      ).toBe(true)
      const wrongMatches = lesson.predict.choices.filter(
        (c, i) => i !== lesson.predict.answerIndex && output.includes(c),
      )
      expect(wrongMatches, `Bài ${lesson.id}: lựa chọn sai lại khớp output`).toEqual([])
      await nhuongEventLoop()
    },
    PYTHON_TEST_TIMEOUT_MS,
  )

  // Bước dự án THUẦN PYTHON của mọi chặng đã mở. Bước nhiều file (milestone P2) được dựng
  // thành thư mục thật rồi chạy: `referenceFiles` ghi ra đĩa, entry là `probeCode` nếu bước
  // có (bộ chấm import module của học viên) — đúng cách sandbox trình duyệt mount workspace.
  //
  // LỌC THEO NGÔN NGỮ (PR-L8): từ chặng P3, dự án có bước HTML/DOM/SQL/fetch — chúng chạy
  // bằng engine khác và có cổng riêng (projectStepsP3.test.ts). Đưa chúng vào python3 thì
  // chỉ nhận về SyntaxError vô nghĩa.
  //
  // PR-L17: chặng P4 có bước chạy bằng LÀN mở rộng (pytest/apisim) — vẫn cùng engine Python,
  // nên chúng đi qua chính cổng này; thư mục của bước được ghi thêm module của làn.
  //
  // 2026-10-09: quét bước của CẢ BA dự án trục T1/T2/T3 — PR nội dung T2/T3 chỉ cần điền bước,
  // cổng này tự chạy code tham chiếu của chúng (không phải nhớ đăng ký thêm).
  const ALL_STEPS: ProjectStep[] = PROJECT_TRACK_IDS.flatMap((track) => getProjectStages(track))
    .flatMap((stage) => stage.steps)
    .filter((s) => laLanPython(getStepLanguage(s)))

  it.each(ALL_STEPS)(
    '$id — code tham chiếu đạt HẾT milestone check',
    async (step) => {
      const lane = getStepLanguage(step) as PythonLane
      const dir = mkdtempSync(join(tmpdir(), `dhcb-step-${step.id}-`))
      for (const [name, content] of Object.entries(fileCuaLan(lane))) {
        const dich = join(dir, name)
        mkdirSync(dirname(dich), { recursive: true })
        writeFileSync(dich, content, 'utf8')
      }
      for (const [path, content] of Object.entries(step.referenceFiles ?? {})) {
        writeFileSync(join(dir, path), content, 'utf8')
      }
      const mainFile = step.files?.[0] ?? 'cua_hang.py'
      writeFileSync(join(dir, mainFile), step.referenceCode, 'utf8')

      const entry = noiCodeTheoLan(lane, step.probeCode ?? step.referenceCode)
      const results = gradeAll(entry, step.checks, dir)
      expect(allTestsPassed(results), `Bước ${step.id}: ${describeFailures(results)}`).toBe(true)
      await nhuongEventLoop()
    },
    PYTHON_TEST_TIMEOUT_MS,
  )
})
