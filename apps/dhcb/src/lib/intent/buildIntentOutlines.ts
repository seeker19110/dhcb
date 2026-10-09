// lib/intent/buildIntentOutlines.ts — Dựng cây mục lục (S07-1) cho các môn người học đã chọn.
// Đặc tả: docs/specs/2026-09-15-learning-ux-s05-bat-dau-theo-y-dinh.md §③.3.1.
//
// Tách khỏi `pickStartAction.ts` có chủ đích: chỗ đó phải THUẦN để test quét mọi tổ hợp, còn chỗ
// này mới là nơi chạm dữ liệu (tải chương trình học, đọc tiến độ, hỏi luật khoá).
//
// Mọi dữ liệu nặng nạp bằng `import()` ĐỘNG và chỉ nạp ĐÚNG môn người dùng chọn — nhờ vậy chunk
// của trang `/bat-dau` giữ nhỏ, và người chọn mỗi môn Lập trình không phải tải chương trình CEFR.
//
// KHÔNG nới luật khoá: bảng khoá lấy nguyên từ `levelLockMap`/bộ đệm cấp CEFR do server cấp.

import type { Outline } from '@dhcb/core-contracts/outline'
import {
  isStemIntentSubject,
  type IntentSubjectId,
  type LearnerIntent,
} from '@dhcb/core-contracts/learnerIntent'
import type { StemSubjectId } from '@dhcb/core-contracts/stemLesson'
import type { LockPlan } from '@dhcb/subject-programming/levelLock'

/** Bậc/cấp khởi đầu — S05 KHÔNG nới khoá, nên "quen rồi" vẫn vào chặng đầu (quyết định Q2(a)). */
const ENGLISH_START_LEVEL = 'A1'
const PROGRAMMING_START_LEVEL = 'p1'
const DEFAULT_STEM_GRADE = '10'

async function cayTiengAnh(uid: string): Promise<Outline | undefined> {
  const [
    { loadCefr },
    { loadFoundation },
    { getDialogueTitlesByUnit },
    { buildCefrOutline },
    cefrProgress,
    vocab,
  ] = await Promise.all([
    import('../../data/cefrLoader'),
    import('../../data/curriculumLoader'),
    import('../../data/dialoguesLoader'),
    import('../outline/cefrOutline'),
    import('../cefrProgress'),
    import('../vocab'),
  ])
  const [levels, circles] = await Promise.all([loadCefr(), loadFoundation()])
  const level = levels.find((l) => l.id === ENGLISH_START_LEVEL)
  if (!level) return undefined
  // Tải tên hội thoại lỗi thì bỏ qua — adapter không khẳng định "đã học hết" khi không biết tổng.
  const dialogueTitlesByUnit = await getDialogueTitlesByUnit(level.units.map((u) => u.id)).catch(
    () => undefined,
  )
  return buildCefrOutline(level, {
    learned: vocab.getLearnedWords(uid),
    doneGrammar: cefrProgress.getDoneGrammar(uid),
    viewedDialogues: cefrProgress.getViewedDialogues(uid),
    learnedDialogues: cefrProgress.getLearnedDialogues(uid),
    ...(dialogueTitlesByUnit ? { dialogueTitlesByUnit } : {}),
    circles: new Map(circles.map((c) => [c.id, c])),
    // Chỉ dựng cấp A1 — cấp này luôn mở cho mọi người, kể cả khách. Các cấp sau do SERVER
    // cưỡng chế (migration 0077) và không được dựng ở đây, nên bản đồ khoá chỉ cần một dòng.
    lockedMap: new Map([[level.id, false]]),
  })
}

async function cayLapTrinh(uid: string, plan: LockPlan): Promise<Outline | undefined> {
  const [{ buildLevelOutline }, { fetchProgress }, { levelLockMap }] = await Promise.all([
    import('../outline/programmingOutline'),
    import('../programmingProgress'),
    import('../programmingLevelLock'),
  ])
  const progress = await fetchProgress(uid)
  return buildLevelOutline(PROGRAMMING_START_LEVEL, {
    progress,
    progressState: 'ready',
    lockMap: levelLockMap(uid, progress, plan),
  })
}

async function cayStem(subjectId: StemSubjectId, grade: string): Promise<Outline | undefined> {
  const [{ buildStemOutline }, routes] = await Promise.all([
    import('@dhcb/core-learner/outline/stemOutline'),
    import('../stemLessonRoutes'),
  ])
  const subject = routes.STEM_SUBJECTS[subjectId]
  return buildStemOutline(subjectId, grade, {
    loader: subject.loader,
    subjectLabel: subject.label,
    buildHref: (lesson) => routes.duongDanBaiHoc(subjectId, lesson.id, lesson.title),
    tierLabel: routes.nhanCapHsg,
  })
}

/** Một môn dựng không được thì trả `undefined` — `pickStartAction` tự rơi về trang tổng quan. */
async function cayMotMon(
  subjectId: IntentSubjectId,
  intent: LearnerIntent,
  uid: string,
  plan: LockPlan,
): Promise<Outline | undefined> {
  try {
    if (subjectId === 'english') return await cayTiengAnh(uid)
    if (subjectId === 'programming') return await cayLapTrinh(uid, plan)
    if (isStemIntentSubject(subjectId)) {
      return await cayStem(subjectId as StemSubjectId, intent.grade ?? DEFAULT_STEM_GRADE)
    }
    return undefined
  } catch {
    // Dữ liệu môn tải lỗi không được làm trắng trang: mất cây thì vẫn còn trang tổng quan môn.
    return undefined
  }
}

/** Dựng cây cho mọi môn trong ý định, song song. */
export async function buildIntentOutlines(
  intent: LearnerIntent,
  uid: string,
  plan: LockPlan,
): Promise<Map<IntentSubjectId, Outline | undefined>> {
  const entries = await Promise.all(
    intent.subjectIds.map(async (id) => [id, await cayMotMon(id, intent, uid, plan)] as const),
  )
  return new Map(entries)
}
