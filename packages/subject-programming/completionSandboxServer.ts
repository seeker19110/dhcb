// completionSandboxServer — chính sách chấm lại bài nộp trên server.
//
// Bản vá audit 2026-09-27: node:vm, Python subprocess cùng máy chủ và SQLite WASM
// trong API KHÔNG cung cấp ranh giới cô lập đủ mạnh cho mã không tin cậy. Không giữ
// fallback/biến môi trường mở lại các engine đó. Cần worker cô lập trước khi mở lại.
// Kotlin/Swift/bash cũng tạm dừng: trần bước không chặn cấp phát bộ nhớ hoặc RegExp
// trong một bước. Bốn bộ mô phỏng dòng lệnh bên dưới chỉ thao tác trạng thái ảo,
// không eval/I/O, không vòng lặp do học viên định nghĩa; code luôn có trần kích thước.
import { getLesson } from './lessons.js'
import { chayLenh, type GitRunResult } from './gitSim.js'
import { chayLenhHermes } from './hermesSim.js'
import { chayLenhVibe } from './vibeSim.js'
import { chayLenhOpenclaw } from './openclawSim.js'
import { laLanPython } from './pyLanes.js'
import { gradeTestCase, gradeGitTestCase, allTestsPassed, type TestCaseResult } from './grading.js'

const SPINE_RE = /^p[1-6]-u\d+-l\d+$/
const PYTHON_SHORT_COURSE_RE = /^(ml|pyai|mathai|mlds|cv1|cv2|llmagent)-u\d+-l\d+$/
const SIM_SHORT_COURSE_RE = /^(git|hermes|vibe|openclaw)-u\d+-l\d+$/
const WEB_LANGUAGES = new Set(['javascript', 'typescript', 'html', 'dom', 'fetch'])
const INTERPRETED_LANGUAGES = new Set([
  'kotlin',
  'swift',
  'bash',
  'git',
  'hermes',
  'vibe',
  'openclaw',
])

/** Trần giống hợp đồng API, áp lại tại dispatcher để caller khác không bỏ qua được. */
export const MAX_SUBMISSION_CODE_LENGTH = 4_000

type InterpretedRunner = (code: string, stdinLines: string[]) => GitRunResult
const INTERPRETED_RUNNERS: Readonly<Partial<Record<string, InterpretedRunner>>> = {
  git: chayLenh,
  hermes: chayLenhHermes,
  vibe: chayLenhVibe,
  openclaw: chayLenhOpenclaw,
}

/** Phạm vi BẮT BUỘC có bằng chứng chấm lại, KHÔNG phải danh sách engine đang mở.
 * Giữ true với engine tạm dừng để API không rơi về tin completed do client tự khai. */
export function isServerRegradableLesson(lessonId: string): boolean {
  const spine = SPINE_RE.test(lessonId)
  if (!spine && !PYTHON_SHORT_COURSE_RE.test(lessonId) && !SIM_SHORT_COURSE_RE.test(lessonId)) {
    return false
  }
  const lesson = getLesson(lessonId)
  if (!lesson) return false
  // B3 — làn web (JS/TS/html/dom/fetch): chỉ bài xương sống.
  if (WEB_LANGUAGES.has(lesson.language)) return spine
  // B1 — làn Python: bài xương sống mọi bậc + 7 khoá ngắn Python.
  if (laLanPython(lesson.language)) {
    return spine || PYTHON_SHORT_COURSE_RE.test(lessonId)
  }
  // B2 — bộ thông dịch thuần: bài xương sống (Kotlin/Swift/bash/git ở P3/P6) + 4 khoá mô phỏng.
  if (INTERPRETED_LANGUAGES.has(lesson.language)) {
    return spine || SIM_SHORT_COURSE_RE.test(lessonId)
  }
  // ADR-0008 câu hỏi 3 — SQL: cả 5 bài đều là bài xương sống (p3/p5/p6), không có khoá ngắn SQL.
  if (lesson.language === 'sql') return spine
  return false
}

export type ServerRegradeAvailability = 'available' | 'isolated_worker_required' | 'not_regradable'

export function getServerRegradeAvailability(lessonId: string): ServerRegradeAvailability {
  if (!isServerRegradableLesson(lessonId)) return 'not_regradable'
  const lesson = getLesson(lessonId)!
  return Object.hasOwn(INTERPRETED_RUNNERS, lesson.language)
    ? 'available'
    : 'isolated_worker_required'
}

/** Lỗi dịch vụ có kiểu riêng để route trả 503, không biến thành bài làm sai/500. */
export class GradingUnavailableError extends Error {
  readonly code = 'PROGRAMMING_GRADING_UNAVAILABLE'

  constructor() {
    super(
      'Chấm bài này đang tạm dừng để nâng cấp an toàn. Bạn vẫn có thể đọc bài và chạy thử trên trình duyệt; tiến độ hoàn thành chưa được ghi nhận.',
    )
    this.name = 'GradingUnavailableError'
  }
}

export function assertServerRegradeAvailable(lessonId: string): void {
  const availability = getServerRegradeAvailability(lessonId)
  if (availability === 'not_regradable') {
    throw new Error(`Bài "${lessonId}" không thuộc phạm vi chấm-lại-ở-server`)
  }
  if (availability !== 'available') throw new GradingUnavailableError()
}

export interface RegradeResult {
  passed: boolean
  results: TestCaseResult[]
}

/** Giữ chữ ký cũ nhưng loại bỏ engine native khỏi module production; gọi thẳng cũng bị chặn. */
export function regradeMakeSubmission(lessonId: string, code: string): RegradeResult {
  void lessonId
  void code
  throw new GradingUnavailableError()
}

export async function regradeWebSubmission(lessonId: string, code: string): Promise<RegradeResult> {
  void lessonId
  void code
  throw new GradingUnavailableError()
}

export async function regradeSqlSubmission(lessonId: string, code: string): Promise<RegradeResult> {
  void lessonId
  void code
  throw new GradingUnavailableError()
}

/** Chỉ chạy bộ mô phỏng đã được chính sách cho phép, kể cả khi caller bỏ qua dispatcher. */
export function regradeInterpretedSubmission(lessonId: string, code: string): RegradeResult {
  assertServerRegradeAvailable(lessonId)
  if (code.length > MAX_SUBMISSION_CODE_LENGTH) {
    throw new Error(`Code vượt quá ${MAX_SUBMISSION_CODE_LENGTH} ký tự`)
  }
  const lesson = getLesson(lessonId)!
  const runner = INTERPRETED_RUNNERS[lesson.language]!
  const results = lesson.make.testCases.map((testCase) => {
    const result = runner(code, testCase.stdinLines)
    return lesson.language === 'git'
      ? gradeGitTestCase(testCase, result)
      : gradeTestCase(testCase, result.output, result.error)
  })
  return { passed: allTestsPassed(results), results }
}

/** Điểm vào công khai luôn kiểm chính sách trước khi chạy bất kỳ mã học viên nào. */
export async function regradeSubmission(lessonId: string, code: string): Promise<RegradeResult> {
  assertServerRegradeAvailable(lessonId)
  return regradeInterpretedSubmission(lessonId, code)
}
