// examPlan.ts (client) — Ghép dữ liệu học THẬT vào hàm lập lịch thuần `@dhcb/core-examplan`.
//
// Đặc tả: docs/research/dac-ta-che-do-on-thi-2026-08-26.md
//
// Vì sao tính ở CLIENT: dữ liệu từ vựng/CEFR nằm ở `src/data`, trạng thái đã thuộc và lịch SRS
// nằm ở localStorage (đồng bộ lên server nhưng nguồn đọc nhanh là ở đây). Server chỉ giữ Ý ĐỊNH
// (thi gì, ngày nào) — xem `apps/server/src/api/learning/exam-plan.ts`.

import { buildExamPlan, type ExamPlanOutput } from '@dhcb/core-examplan/examPlan'
import type { ExamPlan, CreateExamPlanInput, ExamKind } from '@dhcb/core-contracts/examPlan'
import { getAuthHeader } from '@core/authHeader'
import { getLevelWords, getDailySpeed } from './curriculum'
import { getLearnedWords } from './vocab'
import { getSRSStats } from './srs'
import { vnDateStr } from './date'
import type { CefrLevel } from '../data/cefrTypes'

/**
 * Phạm vi kỳ thi vào lớp 10 môn Tiếng Anh: từ vựng A1 → B1.
 *
 * Căn cứ: đề vào 10 bám khung A2–B1, nhưng người học phải nắm chắc cả A1 mới làm được A2 — nên
 * phạm vi tính từ A1. KHÔNG lấy tới B2: đưa vào phạm vi thứ đề không hỏi chỉ làm khối lượng mỗi
 * ngày phình lên và kế hoạch thành bất khả thi giả.
 */
const EXAM_SCOPE_LEVELS: Array<CefrLevel['id']> = ['A1', 'A2', 'B1']

/**
 * Kỳ thi mặc định theo CHIỀU HỌC — mỗi chiều đúng một kỳ thi (luật 4.4: một kế hoạch tại một
 * thời điểm, và đợt này không làm màn hình chọn kỳ thi).
 *
 * Chiều B dùng `vsl-b1` (chứng chỉ tiếng Việt bậc 3). Phạm vi ôn của nó **dùng lại cùng bộ cặp
 * từ A1–B1**, chỉ khác chiều hỏi — xem ghi chú giới hạn ở `@dhcb/core-contracts/examPlan`. Vì
 * phạm vi trùng nhau nên `getExamScopeWords()` không cần tham số kỳ thi.
 */
export function examKindForDirection(isA: boolean): ExamKind {
  return isA ? 'vao10-english' : 'vsl-b1'
}

/** Từ vựng trong phạm vi kỳ thi (đã khử trùng giữa các cấp). */
export function getExamScopeWords(): string[] {
  const seen = new Set<string>()
  for (const level of EXAM_SCOPE_LEVELS) {
    for (const w of getLevelWords(level)) seen.add(w.word.toLowerCase())
  }
  return [...seen]
}

export interface TodayPlan extends ExamPlanOutput {
  examDate: string
  scopeItems: number
  masteredItems: number
}

/**
 * Lịch của HÔM NAY, tính lại từ trạng thái học thật mỗi lần gọi.
 * `today` truyền vào được để test — mặc định là hôm nay theo giờ VN.
 */
export function computeTodayPlan(
  plan: Pick<ExamPlan, 'examDate' | 'dailyCapItems' | 'restDays' | 'scopeItems'>,
  uid: string,
  today: string = vnDateStr(),
): TodayPlan {
  const scopeWords = getExamScopeWords()
  const learned = getLearnedWords(uid)
  const masteredItems = scopeWords.filter((w) => learned.has(w)).length
  // Ưu tiên số đo TẠI CHỖ (từ điển hiện tại) hơn con số đã lưu lúc tạo kế hoạch: dữ liệu từ
  // vựng có thể được bổ sung giữa chừng, và người học quan tâm phạm vi THẬT hôm nay. Từ điển
  // rỗng (chưa nạp được) thì lùi về số đã lưu — và trả về CHÍNH số đó cho UI: trước 2026-10-08
  // lịch tính theo số đã lưu nhưng UI lại nhận 0 → hiện "Đã nắm 0/0" lệch với khối lượng/ngày.
  const scopeItems = scopeWords.length || plan.scopeItems

  const out = buildExamPlan({
    today,
    examDate: plan.examDate,
    scopeItems,
    masteredItems,
    dueToday: getSRSStats(uid).due,
    dailyCapItems: plan.dailyCapItems,
    restDays: plan.restDays,
  })

  return { ...out, examDate: plan.examDate, scopeItems, masteredItems }
}

/** Trần mặc định gợi ý khi tạo kế hoạch = tốc độ học người dùng đã chọn ở Hồ sơ (5/10/20). */
export function suggestedDailyCap(uid: string): number {
  return getDailySpeed(uid)
}

// ── Gọi API ─────────────────────────────────────────────────────────────────
const ENDPOINT = '/api/exam-plan'

/**
 * Kế hoạch đang chạy, `null` = THẬT SỰ chưa có kế hoạch. Lỗi mạng/HTTP/body lệch hợp đồng thì
 * NÉM — [changelog 0525] bản cũ trả `null` cho cả lỗi, nên mạng chập một nhịp là trang Ôn thi
 * hiện form "tạo kế hoạch mới" như thể kế hoạch đã mất, đồng thời đặt lại mức nhớ mục tiêu FSRS
 * về mặc định (lịch ôn thưa ra ngay trước ngày thi).
 */
export async function fetchExamPlan(): Promise<ExamPlan | null> {
  const res = await fetch(ENDPOINT, { headers: { ...getAuthHeader() } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const body: unknown = await res.json()
  if (typeof body !== 'object' || body === null || !('plan' in body)) {
    throw new Error('Dữ liệu kế hoạch ôn thi không đúng định dạng.')
  }
  return (body as { plan: ExamPlan | null }).plan
}

export type CreateOutcome = { ok: true; plan: ExamPlan } | { ok: false; message: string }

/**
 * `isA` chỉ dùng để chọn NGÔN NGỮ của câu lỗi dự phòng khi server không nói gì (lỗi mạng, phản
 * hồi rỗng). Lỗi do server trả về thì hiện nguyên văn — server là nơi biết chuyện gì đã xảy ra.
 */
export async function createExamPlan(
  input: CreateExamPlanInput,
  isA = true,
): Promise<CreateOutcome> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(input),
    })
    const data = (await res.json()) as { plan?: ExamPlan; error?: string }
    if (!res.ok || !data.plan)
      return {
        ok: false,
        message: data.error ?? (isA ? 'Không tạo được kế hoạch' : 'Could not create a plan'),
      }
    return { ok: true, plan: data.plan }
  } catch {
    return {
      ok: false,
      message: isA ? 'Lỗi mạng — thử lại sau' : 'Network error — please try again',
    }
  }
}

export async function endExamPlan(planId: string): Promise<boolean> {
  try {
    const res = await fetch(`${ENDPOINT}?planId=${encodeURIComponent(planId)}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    })
    return res.ok
  } catch {
    return false
  }
}
