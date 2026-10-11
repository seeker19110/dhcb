// src/lib/challenge.ts — Trạng thái thử thách "Challenge 1 phút" theo CHU KỲ TUẦN.
//
// LỊCH SỬ: ban đầu là "Challenge 30 ngày" (docs/research/thu-thach-vlog-30-ngay.md);
// quyết định 2026-07-15 (người dùng, xem PROGRESS.md): bỏ khung vòng 30 ngày/vé nghỉ/
// mốc, chuyển CHU KỲ TUẦN Thứ 2 → CN — đồng bộ luật tuần với mục tiêu tuần
// (lib/weeklyGoal.ts, cùng weekStartOf của date.ts). Schema dữ liệu GIỮ NGUYÊN
// (entries vẫn mang challengeDay/round cũ — lịch sử người dùng không mất).
//
// Phạm vi file này: LOGIC THUẦN + lưu localStorage (key `et_challenge_<uid>` theo quy ước
// `et_*_<uid>` của storage.ts). Đồng bộ Supabase: lib/challengeCloud.ts (bảng challenge_entries).
//
// Video KHÔNG lưu ở đây (xem lib/challengeVideo.ts — IndexedDB); ở đây chỉ giữ transcript,
// feedback và tiến độ — dữ liệu chính, nhẹ (vài KB), an toàn khi mất video local.

import { vnDateStr, addDays, weekStartOf } from './date'
import type { SessionOutcome } from './session/sessionFact'

// ── Hằng số thử thách ────────────────────────────────────────────────────────
// Số ngày 1 tuần challenge (Thứ 2 → CN).
export const CHALLENGE_WEEK_DAYS = 7
// Số video local gần nhất cần giữ (chính sách dọn IndexedDB) — đúng 1 tuần.
const KEEP_RECENT_VIDEOS = 7

// ── Kiểu dữ liệu ─────────────────────────────────────────────────────────────
// 1 lần nộp challenge trong ngày. `feedback` là JSON string THÔ từ AI (UI tự parse —
// giữ nguyên chuỗi để đồng bộ/hiển thị lại không mất thông tin khi schema đổi).
export interface ChallengeEntryLocal {
  day: string // YYYY-MM-DD theo giờ VN (vnDateStr)
  challengeDay: number // ngày thứ mấy của thử thách lúc nộp (1..30)
  topicDay: number // chủ đề gợi ý số mấy (1..30) — có thể khác challengeDay
  transcript: string
  feedback: string | null // null = nộp xong nhưng AI feedback lỗi/chưa về
  durationSec: number
  wordCount: number
  // QUYẾT ĐỊNH THIẾT KẾ: gắn `round` vào TỪNG entry (thay vì tách entries theo vòng)
  // — map `entries` giữ TRỌN lịch sử mọi vòng dưới 1 khóa ngày duy nhất (mỗi ngày chỉ
  // nộp được 1 challenge nên không đụng độ), lọc vòng hiện tại chỉ là 1 phép so sánh.
  round: number
}

export interface ChallengeState {
  startDate: string // ngày bắt đầu tham gia (giữ lại từ mô hình cũ — chỉ để tham khảo)
  round: number // di sản mô hình vòng 30 ngày — GIỮ để entries/cloud cũ đọc được, UI tuần không dùng
  entries: Record<string, ChallengeEntryLocal> // khóa = ngày nộp (YYYY-MM-DD), mọi vòng
}

// ── localStorage (đọc/ghi an toàn — cùng phong cách storage.ts) ──────────────
const CHALLENGE_KEY = (uid: string) => `et_challenge_${uid}`

function readChallenge(uid: string): ChallengeState | null {
  try {
    const raw = localStorage.getItem(CHALLENGE_KEY(uid))
    if (!raw) return null
    const parsed = JSON.parse(raw) as ChallengeState
    // Kiểm tra tối thiểu hình dạng dữ liệu (phòng bản ghi hỏng/format cũ) — hỏng thì
    // coi như chưa có thử thách, KHÔNG throw vỡ trang.
    if (
      typeof parsed?.startDate !== 'string' ||
      typeof parsed?.round !== 'number' ||
      typeof parsed?.entries !== 'object' ||
      parsed.entries === null
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeChallenge(uid: string, challenge: ChallengeState): void {
  try {
    localStorage.setItem(CHALLENGE_KEY(uid), JSON.stringify(challenge))
  } catch (err) {
    // Đầy bộ nhớ / private mode — không vỡ luồng; dữ liệu thật sẽ có bản sync Supabase.
    console.warn('[challenge] không ghi được localStorage (bỏ qua):', err)
  }
}

// ── API chính ────────────────────────────────────────────────────────────────
export function getChallenge(uid: string): ChallengeState | null {
  return readChallenge(uid)
}

// 1 entry kéo từ Supabase (lib/challengeCloud.ts, đã đổi camelCase) — kiểu tối thiểu cần
// để hợp nhất, tránh phụ thuộc chéo vào challengeCloud.ts (giống cách challengeCloud.ts tự định
// nghĩa kiểu tối thiểu thay vì import ngược lại file này).
export interface CloudEntryForMerge {
  day: string
  round: number
  challengeDay: number
  topicDay: number
  transcript: string
  feedback: string | null
  durationSec: number
  wordCount: number
}

// Hợp nhất entries kéo từ Supabase vào challenge LOCAL — cho phép đổi máy/xóa cache
// không mất tiến độ thử thách. KHÔNG đụng startDate/round nếu máy này đã có challenge
// (tránh phá luật vé nghỉ đang tính dở); chỉ dùng dữ liệu cloud để DỰNG LẠI challenge
// khi máy này hoàn toàn chưa có (vd vừa đăng nhập trên thiết bị mới) — suy ra startDate
// từ ngày nộp SỚM NHẤT của vòng mới nhất trong dữ liệu cloud.
// Luật hợp nhất từng entry: ngày chỉ có ở cloud → thêm mới; ngày có ở cả 2 và bản cloud
// có feedback còn bản local thì không → cloud thắng (đầy đủ hơn); các trường hợp khác
// giữ nguyên bản local (máy này vừa nộp là bản mới nhất).
export function mergeCloudEntries(
  uid: string,
  cloudEntries: CloudEntryForMerge[],
): ChallengeState | null {
  if (cloudEntries.length === 0) return readChallenge(uid)

  const cur = readChallenge(uid)
  const maxRound = Math.max(...cloudEntries.map((e) => e.round))
  const earliestOfMaxRound = cloudEntries
    .filter((e) => e.round === maxRound)
    .map((e) => e.day)
    .sort()[0]
  const base: ChallengeState = cur ?? {
    startDate: earliestOfMaxRound ?? vnDateStr(),
    round: maxRound,
    entries: {},
  }

  const entries = { ...base.entries }
  for (const e of cloudEntries) {
    const existing = entries[e.day]
    const cloudMoreComplete = !existing || (!!e.feedback && !existing.feedback)
    if (cloudMoreComplete) {
      entries[e.day] = {
        day: e.day,
        challengeDay: e.challengeDay,
        topicDay: e.topicDay,
        transcript: e.transcript,
        feedback: e.feedback,
        durationSec: e.durationSec,
        wordCount: e.wordCount,
        round: e.round,
      }
    }
  }

  const next: ChallengeState = { ...base, round: Math.max(base.round, maxRound), entries }
  writeChallenge(uid, next)
  return next
}

// Bắt đầu thử thách lần đầu (chu kỳ tuần không có "vòng mới" — đã có thì giữ nguyên).
export function startChallenge(uid: string): ChallengeState {
  const cur = readChallenge(uid)
  if (cur) return cur
  const next: ChallengeState = { startDate: vnDateStr(), round: 1, entries: {} }
  writeChallenge(uid, next)
  return next
}

// Lưu 1 lần nộp — IDEMPOTENT theo `entry.day`: nộp lại trong ngày = ghi đè bản cũ
// (đúng luật unique user_id+day của bảng challenge_entries sau này). Chưa có thử thách
// thì tự mở vòng 1 (phòng UI gọi lệch thứ tự). `round` do hàm này tự đóng dấu.
export function saveEntry(uid: string, entry: Omit<ChallengeEntryLocal, 'round'>): ChallengeState {
  const challenge = readChallenge(uid) ?? startChallenge(uid)
  const next: ChallengeState = {
    ...challenge,
    entries: { ...challenge.entries, [entry.day]: { ...entry, round: challenge.round } },
  }
  writeChallenge(uid, next)
  return next
}

// Toàn bộ ngày ĐÃ NỘP (mọi vòng cũ lẫn mới — khóa ngày là duy nhất), tăng dần.
function submittedDays(challenge: ChallengeState): string[] {
  return Object.keys(challenge.entries).sort()
}

// ── Chu kỳ TUẦN (Thứ 2 → CN, cùng luật weekStartOf với mục tiêu tuần) ─────────
export interface WeekCell {
  date: string // YYYY-MM-DD
  entry: ChallengeEntryLocal | null // bài đã nộp ngày này (null = chưa/không nộp)
  isToday: boolean
  isFuture: boolean // ngày chưa tới trong tuần
}

// 7 ô của tuần chứa `todayStr` — UI tô ô đã nộp, đánh dấu hôm nay, làm mờ ngày chưa tới.
export function getWeekCells(challenge: ChallengeState, todayStr: string): WeekCell[] {
  const start = weekStartOf(todayStr)
  return Array.from({ length: CHALLENGE_WEEK_DAYS }, (_, i) => {
    const date = addDays(start, i)
    return {
      date,
      entry: challenge.entries[date] ?? null,
      isToday: date === todayStr,
      isFuture: date > todayStr,
    }
  })
}

// Tổng số challenge đã nộp từ trước tới nay (mọi tuần) — hiện ở UI + xoay chủ đề.
export function getTotalSubmitted(challenge: ChallengeState): number {
  return Object.keys(challenge.entries).length
}

// Đã từng có 1 tuần nộp ĐỦ 7/7 ngày chưa (bất kỳ tuần nào trong lịch sử, không chỉ
// tuần hiện tại) — dùng cho huy hiệu "Tuần trọn vẹn" (② M2, lib/achievements.ts).
export function hasPerfectWeek(challenge: ChallengeState): boolean {
  const byWeek = new Map<string, number>()
  for (const day of Object.keys(challenge.entries)) {
    const wk = weekStartOf(day)
    byWeek.set(wk, (byWeek.get(wk) ?? 0) + 1)
  }
  return [...byWeek.values()].some((n) => n >= CHALLENGE_WEEK_DAYS)
}

// Số thứ tự cho cột `challengeDay` (di sản schema cũ — giờ = "bài nộp thứ mấy").
// Nộp lại trong ngày giữ nguyên số cũ (idempotent, không nhảy số).
export function nextChallengeDay(challenge: ChallengeState, todayStr: string): number {
  return challenge.entries[todayStr]?.challengeDay ?? getTotalSubmitted(challenge) + 1
}

// ── Chính sách giữ video local ───────────────────────────────────────────────
// Giữ 7 video của các ngày nộp GẦN NHẤT (đúng 1 tuần — đủ cho màn tổng kết tuần).
// Đưa thẳng vào challengeVideo.pruneChallengeVideos(uid, keepDates).
export function getKeepDates(challenge: ChallengeState): string[] {
  return submittedDays(challenge).slice(-KEEP_RECENT_VIDEOS)
}

// ── Thống kê nhịp nói ────────────────────────────────────────────────────────
// Đếm số từ trong transcript (tách theo khoảng trắng, bỏ chuỗi rỗng).
export function countWords(transcript: string): number {
  const trimmed = transcript.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

/** Số câu trong bài nói/viết: tách theo dấu kết câu; có chữ mà không có dấu (STT không chấm
 *  câu) vẫn tính là 1 câu — không bao giờ khoe con số người học không làm. */
export function countSentences(transcript: string): number {
  const cau = transcript.split(/[.!?…]+/).filter((c) => c.trim().length > 0)
  return cau.length
}

/** Kết quả phiên Challenge cho màn kết `SessionDone` (P1-6): quay/ghi âm → đếm CÂU đã nói; gõ
 *  chữ → MỘT đoạn đã viết. Nộp rỗng → `steps: 0` (SessionDone không mở). */
export function challengeSessionOutcome(input: {
  day: string
  transcript: string
  isTyped: boolean
  durationSec: number
}): SessionOutcome {
  const coChu = input.transcript.trim().length > 0
  return {
    subjectId: 'english',
    contentId: `challenge:${input.day}`,
    kind: input.isTyped ? 'writing' : 'speaking',
    steps: !coChu ? 0 : input.isTyped ? 1 : countSentences(input.transcript),
    durationSec: input.durationSec,
  }
}

// Nhịp nói (từ/phút), làm tròn; chống chia 0 (chưa có thời lượng → 0).
export function calcWpm(wordCount: number, durationSec: number): number {
  if (durationSec <= 0 || wordCount <= 0) return 0
  return Math.round((wordCount * 60) / durationSec)
}
