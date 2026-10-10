// ──────────────────────────────────────────────────────────────────────
// HUY HIỆU & MỐC — logic đạt/lưu (② M2, docs/research/dac-ta-nang-cap-su-pham-2026-07-15.md)
//
// QUYẾT ĐỊNH THIẾT KẾ: không thêm tracking mới — mọi điều kiện đều so với dữ liệu
// ĐÃ CÓ SẴN trong app (streak, từ đã thuộc, thi cuối cấp, phiên nói/viết, challenge).
// Vì vậy "điểm phát âm ≥90 lần đầu" trong đặc tả KHÔNG làm (pronounceScore.ts chưa
// lưu lịch sử điểm) — thay bằng nhóm kỹ năng hiện có (nói/viết) + huy hiệu challenge
// theo quyết định 2026-07-15 (M5b: mốc 30 ngày cũ → huy hiệu M2).
//
// Đã đạt CHỈ CỘNG THÊM, không bao giờ thu hồi (nguyên tắc "dữ liệu chỉ tốt lên" sẵn
// có của app — giống cefr_unlocked/cefr_exams). checkNewAchievements() gọi ở vài điểm
// mấu chốt (học từ mới, nộp challenge, chấm bài viết, luyện nói, thi cuối cấp) — mỗi
// lần gọi tính lại TOÀN BỘ điều kiện nên không cần gọi ở MỌI nơi, chỉ cần đủ để người
// dùng thấy huy hiệu ngay lúc vừa đạt.
// ──────────────────────────────────────────────────────────────────────

import { ACHIEVEMENTS, type AchievementDef } from '../data/achievements'
import { getStreak, getSpeakingSessions, getWritingSubs } from './storage'
import { getLearnedCount } from './vocab'
import { getPassedExamLevels } from './cefrExam'
import { getChallenge, getTotalSubmitted, hasPerfectWeek } from './challenge'
import { pushProgress } from './progressSync'
import { readLocalArray } from './localJson'

const KEY = (uid: string) => `et_achievements_${uid}`

function readEarned(uid: string): Set<string> {
  return new Set(readLocalArray<string>(KEY(uid)))
}

function writeEarned(uid: string, set: Set<string>): void {
  try {
    localStorage.setItem(KEY(uid), JSON.stringify([...set]))
  } catch {
    /* hết dung lượng — bỏ qua, vẫn đồng bộ Supabase được */
  }
}

export function getEarnedAchievements(uid: string): Set<string> {
  return readEarned(uid)
}

// Huy hiệu mở khoá GẦN NHẤT — dùng cho `WeekRhythm` ở trang chủ (P1-5, lệnh 7).
// App KHÔNG lưu mốc thời gian mở khoá riêng (chỉ lưu tập id, xem `writeEarned`), nhưng
// `checkNewAchievements` luôn CỘNG THÊM vào cuối mảng khi có huy hiệu mới (Set giữ thứ tự
// chèn) — nên phần tử CUỐI của mảng đã lưu chính là huy hiệu mở khoá gần nhất. Không cần
// thêm tracking mới (đúng nguyên tắc đầu file).
export function latestUnlocked(uid: string, isA: boolean): { id: string; label: string } | null {
  const earned = [...readEarned(uid)]
  const lastId = earned[earned.length - 1]
  if (!lastId) return null
  const def = ACHIEVEMENTS.find((a) => a.id === lastId)
  if (!def) return null
  return { id: def.id, label: isA ? def.nameVi : def.nameEn }
}

interface AchievementStats {
  streak: number
  vocab: number
  cefrPassed: Set<string> // 'A1'..'C2' (id gốc từ CefrLevel, xem cefrExam.ts)
  speakingSessions: number
  gradedEssays: number
  challengeSubmitted: number
  challengePerfectWeek: boolean
}

function computeStats(uid: string): AchievementStats {
  const challenge = getChallenge(uid)
  return {
    streak: getStreak(uid),
    vocab: getLearnedCount(uid),
    cefrPassed: getPassedExamLevels(uid),
    speakingSessions: getSpeakingSessions(uid).length,
    gradedEssays: getWritingSubs(uid).length,
    challengeSubmitted: challenge ? getTotalSubmitted(challenge) : 0,
    challengePerfectWeek: challenge ? hasPerfectWeek(challenge) : false,
  }
}

// Điều kiện đạt của TỪNG huy hiệu — so trực tiếp với id (đơn giản hơn nhúng
// ngưỡng vào data/achievements.ts vì vài điều kiện không phải "số ≥ ngưỡng" đơn
// thuần, vd cefr_* so Set, challenge_perfect_week là boolean).
function isEarned(id: string, s: AchievementStats): boolean {
  switch (id) {
    case 'streak_7':
      return s.streak >= 7
    case 'streak_30':
      return s.streak >= 30
    case 'streak_100':
      return s.streak >= 100
    case 'streak_365':
      return s.streak >= 365
    case 'vocab_100':
      return s.vocab >= 100
    case 'vocab_500':
      return s.vocab >= 500
    case 'vocab_1000':
      return s.vocab >= 1000
    case 'cefr_a1':
      return s.cefrPassed.has('A1')
    case 'cefr_a2':
      return s.cefrPassed.has('A2')
    case 'cefr_b1':
      return s.cefrPassed.has('B1')
    case 'cefr_b2':
      return s.cefrPassed.has('B2')
    case 'cefr_c1':
      return s.cefrPassed.has('C1')
    case 'cefr_c2':
      return s.cefrPassed.has('C2')
    case 'speak_10':
      return s.speakingSessions >= 10
    case 'write_10':
      return s.gradedEssays >= 10
    case 'challenge_10':
      return s.challengeSubmitted >= 10
    case 'challenge_30':
      return s.challengeSubmitted >= 30
    case 'challenge_100':
      return s.challengeSubmitted >= 100
    case 'challenge_perfect_week':
      return s.challengePerfectWeek
    default:
      return false
  }
}

// Tính lại toàn bộ điều kiện, hợp nhất với huy hiệu đã có (CHỈ CỘNG THÊM) và lưu
// nếu có gì mới. Trả về danh sách huy hiệu VỪA đạt lần gọi này (rỗng nếu không có
// gì mới) — UI dùng để bắn toast/confetti đúng lúc.
export function checkNewAchievements(uid: string): AchievementDef[] {
  if (!uid) return []
  const stats = computeStats(uid)
  const before = readEarned(uid)
  const now = new Set(before)
  const fresh: AchievementDef[] = []
  for (const def of ACHIEVEMENTS) {
    if (before.has(def.id)) continue
    if (isEarned(def.id, stats)) {
      now.add(def.id)
      fresh.push(def)
    }
  }
  if (fresh.length > 0) {
    writeEarned(uid, now)
    pushProgress(uid) // đồng bộ lên Supabase
  }
  return fresh
}

// Câu thông báo toast khi vừa đạt 1 huy hiệu — dùng chung ở mọi nơi gọi
// checkNewAchievements() để khỏi lặp lại cùng 1 dòng string ghép (DRY, CLAUDE.md §4.4).
export function achievementMessage(def: AchievementDef, isA: boolean): string {
  return isA ? `${def.icon} Huy hiệu mới: ${def.nameVi}!` : `${def.icon} New badge: ${def.nameEn}!`
}
