// subjectProgressBoard — gom tiến độ CỦA TỪNG MÔN cho khối "Tiến độ theo môn" ở `/tien-do`.
//
// Đặc tả: docs/specs/2026-09-15-learning-ux-s12-on-lai-so-loi-tien-do.md AC-14 (S12-3).
//
// BA RÀNG BUỘC ĐỊNH HÌNH FILE NÀY:
//
// ① Con số chỉ đến từ BẰNG CHỨNG. Mỗi môn dựng cây mục lục bằng đúng adapter S07 mà trang môn
//    đang dùng, rồi `summarizeOutline` đếm. Không có đường tắt nào đọc thẳng localStorage rồi
//    tự cộng — thêm một đường đếm thứ hai là thêm một cách để hai trang nói hai số khác nhau.
//
// ② KHÔNG kéo dữ liệu môn vào chunk của Dashboard. Chương trình CEFR, chỉ mục bài Lập trình và
//    bốn chỉ mục STEM đều nặng; chúng vào đây bằng `import()` ĐỘNG (cùng khuôn với
//    `lib/intent/buildIntentOutlines.ts`), nên `/tien-do` vẫn mở nhanh và ngân sách bundle
//    của Dashboard gần như không đổi.
//
// ③ Một môn hỏng KHÔNG được làm trắng cả khối. Mỗi môn dựng trong `try` riêng; hỏng thì môn đó
//    vắng mặt, các môn khác vẫn hiện.
//
// KHÔNG gọi AI, không endpoint mới: chỉ đúng những nguồn dữ liệu đã có.
import type { Outline } from '@dhcb/core-contracts/outline'
import type { StemSubjectId } from '@dhcb/core-contracts/stemLesson'
import type { LockPlan } from '@dhcb/subject-programming/levelLock'
import { summarizeOutline, type SubjectProgressSummary } from './progressSummary'

export interface SubjectProgressCard {
  subjectId: string
  /** Tên môn cho người học — lấy từ dữ liệu môn, không tự đặt. */
  subjectLabel: string
  /** Nơi bấm vào để học tiếp đúng phạm vi đã đếm. */
  href: string
  summary: SubjectProgressSummary
}

/** Lớp mặc định khi người học chưa khai lớp trong ý định (S05) — cùng giá trị với `/bat-dau`. */
const LOP_STEM_MAC_DINH = '10'

/** Bậc mặc định khi môn Lập trình chưa có bằng chứng nào. */
const BAC_LAP_TRINH_MAC_DINH = 'p1'

async function theTiengAnh(uid: string): Promise<SubjectProgressCard | undefined> {
  const [
    { loadCefr },
    { loadFoundation },
    { getDialogueTitlesByUnit },
    outline,
    cefrProgress,
    vocab,
    exam,
    today,
    storage,
  ] = await Promise.all([
    import('../data/cefrLoader'),
    import('../data/curriculumLoader'),
    import('../data/dialoguesLoader'),
    import('./outline/cefrOutline'),
    import('./cefrProgress'),
    import('./vocab'),
    import('./cefrExam'),
    import('./today/englishNext'),
    import('./storage'),
  ])
  const [levels, circles] = await Promise.all([loadCefr(), loadFoundation()])
  const capDau = levels[0]
  if (!capDau) return undefined

  const learned = vocab.getLearnedWords(uid)
  const doneGrammar = cefrProgress.getDoneGrammar(uid)
  const circleById = Object.fromEntries(circles.map((c) => [c.id, c]))
  // Khoá cấp: SERVER là nguồn sự thật (migration 0077) — đọc lại bản đồ đã có, không tự tính.
  const lockedMap = cefrProgress.computeLockedMapFromServer(
    uid,
    [...levels],
    exam.getPassedExamLevels(uid),
  )

  // "Cấp hiện tại" = đúng cấp mà Trang chủ và "Hôm nay" đang mời học tiếp. Gọi lại `englishNext`
  // thay vì chép vòng lặp chọn cấp: hai nơi chọn khác nhau là hai câu trả lời khác nhau cho
  // cùng một câu hỏi.
  const levelId =
    today.englishNext({
      levels,
      circleById,
      learned,
      doneGrammar,
      lockedMap,
      isA: storage.getDirection() === 'A',
    }).levelId ?? capDau.id
  const level = levels.find((l) => l.id === levelId)
  if (!level) return undefined

  const chiSo = levels.findIndex((l) => l.id === level.id)
  const capTruoc = chiSo > 0 ? levels[chiSo - 1]?.id : undefined
  // Tên hội thoại từng unit — để "Hội thoại" chỉ tính XONG khi đã học hết (đặc tả 2026-10-09).
  // Tải lỗi thì bỏ qua: adapter khi đó không khẳng định "đã học hết", thẻ vẫn hiện.
  const dialogueTitlesByUnit = await getDialogueTitlesByUnit(level.units.map((u) => u.id)).catch(
    () => undefined,
  )
  const cay: Outline = outline.buildCefrOutline(level, {
    learned,
    doneGrammar,
    viewedDialogues: cefrProgress.getViewedDialogues(uid),
    learnedDialogues: cefrProgress.getLearnedDialogues(uid),
    ...(dialogueTitlesByUnit ? { dialogueTitlesByUnit } : {}),
    circles: new Map(circles.map((c) => [c.id, c])),
    lockedMap,
    ...(capTruoc ? { prevLevelId: capTruoc } : {}),
  })

  return {
    subjectId: 'english',
    subjectLabel: 'Tiếng Anh',
    href: today.duongDanCapCefr(level.id),
    summary: summarizeOutline(cay),
  }
}

async function theLapTrinh(uid: string, plan: LockPlan): Promise<SubjectProgressCard | undefined> {
  const [progOutline, progress, lock, next, routes, levels] = await Promise.all([
    import('./outline/programmingOutline'),
    import('./programmingProgress'),
    import('./programmingLevelLock'),
    import('./today/programmingNext'),
    import('./programmingRoutes'),
    import('@dhcb/subject-programming/curriculum'),
  ])

  const { lessons, state } = await progress.fetchProgressWithState(uid)
  // Bậc hiện tại = bậc `pickNextLesson` đang chỉ tới; chưa có bằng chứng nào thì là bậc đầu.
  const levelId =
    next.programmingNext({ progress: lessons }).picked?.levelId ?? BAC_LAP_TRINH_MAC_DINH
  const cay = progOutline.buildLevelOutline(levelId, {
    progress: lessons,
    // Tải hỏng → mọi bài là `unknown` → thẻ nói "chưa đo được", KHÔNG phải "0 bài đã xong".
    progressState: state,
    lockMap: lock.levelLockMap(uid, lessons, plan),
  })
  if (!cay) return undefined

  const level = levels.PROGRAMMING_LEVELS.find((l) => l.id === levelId)
  return {
    subjectId: 'programming',
    subjectLabel: 'Lập trình',
    href: level ? routes.duongDanBac(level) : '/goc-hoc-tap/programming',
    summary: summarizeOutline(cay),
  }
}

const MON_STEM: readonly StemSubjectId[] = ['mathematics', 'physics', 'chemistry', 'biology']

/**
 * Bốn thẻ STEM dựng chung: ba module dùng chung nạp ĐÚNG MỘT LẦN rồi mới dựng từng môn.
 * Trước đây mỗi môn tự `import()` lại cùng ba module (4 lượt song song) — thừa, và làm test
 * không mock được: Vitest chỉ trả bản mock cho lượt import động ĐẦU, ba lượt đồng thời còn lại
 * nhận module thật (đo 2026-09-22, `subjectProgressBoard.test.ts`). Mỗi môn vẫn dựng trong `try`
 * riêng (ràng buộc ③).
 */
async function cacTheStem(
  uid: string,
  grade: string,
): Promise<ReadonlyArray<SubjectProgressCard | undefined>> {
  const [stemOutline, routes, evidence] = await Promise.all([
    import('./outline/stemOutlineApp'),
    import('./stemLessonRoutes'),
    import('./stemEvidence'),
  ])
  return Promise.all(
    MON_STEM.map(async (subjectId): Promise<SubjectProgressCard | undefined> => {
      try {
        const subject = routes.STEM_SUBJECTS[subjectId]
        const { state, status } = await evidence.fetchCompletionState(uid, subjectId)
        const cay = stemOutline.buildStemOutlineForApp(subject, grade, {
          state,
          stateStatus: status,
        })
        if (!cay) return undefined
        return {
          subjectId,
          subjectLabel: subject.label,
          href: routes.duongDanDanhSachBai(subjectId),
          summary: summarizeOutline(cay),
        }
      } catch {
        return undefined
      }
    }),
  )
}

/** Lớp STEM người học đã khai ở luồng "Bắt đầu" (S05); chưa khai thì lớp mặc định. */
async function lopStem(uid: string): Promise<string> {
  try {
    const { readLocalIntent } = await import('./intent/learnerIntentStore')
    return readLocalIntent(uid)?.grade ?? LOP_STEM_MAC_DINH
  } catch {
    return LOP_STEM_MAC_DINH
  }
}

/**
 * Tiến độ của mọi môn có nội dung, dựng song song.
 *
 * @param uid id người học (khách cũng có id thật).
 * @param plan gói dịch vụ đã quy đổi (`effectivePlan`) — chỉ dùng cho luật khoá bậc Lập trình.
 * @returns các thẻ dựng được, theo thứ tự cố định; môn dựng hỏng bị bỏ qua.
 */
export async function buildSubjectProgressBoard(
  uid: string,
  plan: LockPlan,
): Promise<readonly SubjectProgressCard[]> {
  const grade = await lopStem(uid)
  const cong = async (
    fn: () => Promise<SubjectProgressCard | undefined>,
  ): Promise<SubjectProgressCard | undefined> => {
    try {
      return await fn()
    } catch {
      // Một môn tải hỏng không được làm trắng cả khối — xem chú thích ③ đầu file.
      return undefined
    }
  }

  const [anh, lapTrinh, stem] = await Promise.all([
    cong(() => theTiengAnh(uid)),
    cong(() => theLapTrinh(uid, plan)),
    // Ba module STEM nạp hỏng → cả bốn môn STEM vắng mặt, hai môn kia vẫn hiện.
    cacTheStem(uid, grade).catch((): ReadonlyArray<SubjectProgressCard | undefined> => []),
  ])
  return [anh, lapTrinh, ...stem].filter((t): t is SubjectProgressCard => t !== undefined)
}
