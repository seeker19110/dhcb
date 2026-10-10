// programmingLevelLock — tầng PERSIST của luật khoá bậc môn Lập trình (GĐ3, 2026-09-12).
// Đặc tả: docs/specs/2026-09-12-gd3-khoa-bai-mon-lap-trinh.md
//
// Luật tính nằm ở hàm THUẦN `@dhcb/subject-programming/levelLock` (test được không cần DB/trình
// duyệt). File này chỉ lo phần bẩn: ráp danh sách bài của từng bậc từ chỉ mục nhẹ, và nhớ tập
// bậc "đã từng vào" (grandfather) trong localStorage.
//
// VÌ SAO localStorage chứ không phải cột DB: đợt đầu không cần migration (đặc tả §③). Mất
// localStorage chỉ làm người học quay về đúng luật tuần tự — không ai mất tiến độ, và tiến độ
// thật vẫn ở server. Nếu sau này cần chắc chắn hơn thì chuyển sang cột như môn Anh đã làm ở
// migration 0077.
import { PROGRAMMING_LEVELS } from '@dhcb/subject-programming/curriculum'
import { getUnitSummaries } from '@dhcb/subject-programming/lessonsLoader'
import {
  computeLevelLockMap,
  type LevelLessons,
  type LevelLockInfo,
  type LockPlan,
} from '@dhcb/subject-programming/levelLock'
import type { ProgrammingLessonProgress } from './programmingProgress'
import { readLocalArray } from './localJson'

export type { LevelLockInfo } from '@dhcb/subject-programming/levelLock'

const KEY = (uid: string) => `dhcb_prog_levels_entered_${uid}`

/** Danh sách bài ĐÃ SOẠN của từng bậc, theo đúng thứ tự P1→P6. */
export function buildLevelLessons(): LevelLessons[] {
  return PROGRAMMING_LEVELS.map((level) => ({
    levelId: level.id,
    lessonIds: level.units.flatMap((u) => getUnitSummaries(u.id).map((l) => l.id)),
  }))
}

function readSet(uid: string): Set<string> {
  return new Set(readLocalArray<string>(KEY(uid)))
}

function writeSet(uid: string, set: Set<string>): void {
  try {
    localStorage.setItem(KEY(uid), JSON.stringify([...set]))
  } catch {
    // localStorage đầy/bị chặn — bỏ qua, người học chỉ quay về luật tuần tự.
  }
}

/** Bậc người học đã từng vào (grandfather). */
export function getLevelsEntered(uid: string): Set<string> {
  return readSet(uid)
}

/** Ghi nhận người học đã vào một bậc — từ đó bậc này không bao giờ bị khoá lại. */
export function markLevelEntered(uid: string, levelId: string): void {
  const set = readSet(uid)
  if (set.has(levelId)) return
  set.add(levelId)
  writeSet(uid, set)
}

/**
 * CHỐNG HỒI TỐ cho người học CŨ: ai đã có tiến độ ở một bậc TRƯỚC khi luật khoá ra đời thì bậc
 * đó được ghi vào tập grandfather ngay lần mở app đầu tiên sau khi deploy.
 * Chỉ chạy khi đã tải xong tiến độ và tiến độ KHÔNG rỗng — tránh "đóng băng" nhầm tập rỗng
 * trong lúc mạng chưa trả lời.
 */
export function seedGrandfather(
  uid: string,
  progress: readonly ProgrammingLessonProgress[],
  levels: readonly LevelLessons[] = buildLevelLessons(),
): Set<string> {
  const set = readSet(uid)
  if (progress.length === 0) return set

  const levelOf = new Map<string, string>()
  for (const level of levels) for (const id of level.lessonIds) levelOf.set(id, level.levelId)

  let added = false
  for (const row of progress) {
    const levelId = levelOf.get(row.lessonId)
    if (levelId && !set.has(levelId)) {
      set.add(levelId)
      added = true
    }
  }
  if (added) writeSet(uid, set)
  return set
}

/** Bản đồ khoá bậc để hiển thị: ráp dữ liệu thật rồi gọi hàm thuần. */
export function levelLockMap(
  uid: string | undefined,
  progress: readonly ProgrammingLessonProgress[],
  plan: LockPlan,
): Map<string, LevelLockInfo> {
  const levels = buildLevelLessons()
  return computeLevelLockMap({
    levels,
    completedLessonIds: progress.filter((p) => p.status === 'completed').map((p) => p.lessonId),
    plan,
    everUnlocked: uid ? getLevelsEntered(uid) : null,
  })
}

/** Câu giải thích cho ổ khoá — "còn N bài ở P1 nữa là mở". */
export function loiGiaiThichKhoa(info: LevelLockInfo): string {
  if (!info.locked) return ''
  const bac = info.requiredLevelId?.toUpperCase() ?? 'bậc trước'
  return `Còn ${info.remaining} bài ở ${bac} nữa là mở — đã xong ${info.doneInRequired}/${info.neededInRequired} bài cần thiết.`
}
