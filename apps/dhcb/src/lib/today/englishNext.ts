// englishNext — adapter "Hôm nay" của môn Tiếng Anh (slice S06-1, đặc tả §③.2).
//
// Adapter là cầu nối MỘT CHIỀU: nó BỌC luật đã có (`findNextStep` ở lib/cefrProgress.ts) và
// dịch kết quả sang `TodayItem` của hợp đồng dùng chung. Nó KHÔNG viết lại luật chọn bài, không
// đổi chữ ký hàm cũ, và cũng không được là nhánh riêng cho tiếng Anh trong resolver — nhờ vậy
// thêm môn mới chỉ là thêm một adapter, không phải sửa resolver.
//
// THUẦN và ĐỒNG BỘ: mọi dữ liệu (cấp CEFR, vòng từ vựng, từ đã học…) do nơi gọi truyền vào.
import type { TodayItem } from '@dhcb/core-contracts/todayPlan'
import { todayItemId } from '@dhcb/core-contracts/todayItemId'
import type { CefrLevel } from '../../data/cefr'
import type { Circle } from '../../data/curriculum'
import { circleDoneCount, findNextStep } from '../cefrProgress'
import { duongDanLoTrinh } from '../englishRoutes'

export const ENGLISH_SUBJECT_ID = 'english'

export interface EnglishNextCtx {
  levels: readonly CefrLevel[]
  circleById: Record<string, Circle>
  learned: Set<string>
  doneGrammar: Set<string>
  /** `computeLockedMapFromServer` — cấp bị khoá thì bỏ qua, y như Trang chủ đang làm. */
  lockedMap: ReadonlyMap<CefrLevel['id'], boolean>
  /** Chiều A (người Việt học tiếng Anh) → nhãn nội dung tiếng Việt. */
  isA: boolean
  /**
   * `getSRSStats(uid).due` — số thẻ từ vựng đến hạn.
   *
   * Tuỳ chọn vì hai TRANG MÔN (S06-3) chỉ cần bài kế tiếp: chúng đã có nút ôn riêng, truyền số
   * thẻ vào chỉ để rồi bỏ mục `review` đi là mời gọi hai chỗ đếm lệch nhau.
   */
  srsDue?: number
}

export interface EnglishNextResult {
  next?: TodayItem
  review?: TodayItem
  /**
   * Cấp CEFR người học đang đi tới — cấp MỞ đầu tiên còn bước chưa xong.
   *
   * [S06-3] Có mặt để `Home` và `EnglishHome` bỏ được bản chép vòng lặp `continueLevel`. Nó bám
   * đúng ngữ nghĩa cũ: cấp đầu tiên `findNextStep` trả về một bước, KỂ CẢ khi không dựng nổi
   * nhãn cho bước đó (vòng từ vựng vắng trong `circleById`) — nhờ vậy luồng "quay lại" và nút
   * "Tiếp tục học ngay" giữ nguyên hành vi, chỉ còn một nơi định nghĩa luật.
   */
  levelId?: CefrLevel['id']
}

/** Đường dẫn cấp CEFR — mã cấp viết thường theo route English chuẩn. */
export function duongDanCapCefr(levelId: CefrLevel['id']): string {
  return duongDanLoTrinh(levelId)
}

/**
 * Bài kế tiếp + việc ôn tập của môn Tiếng Anh.
 *
 * Ôn SRS chỉ xuất hiện khi người học ĐANG học tiếng Anh (có bài kế tiếp): kho SRS hiện chỉ chứa
 * từ vựng Anh, hiện nó với người chỉ học Lập trình chính là "mặc định tiếng Anh" trá hình.
 */
export function englishNext(ctx: EnglishNextCtx): EnglishNextResult {
  const srsDue = ctx.srsDue ?? 0
  let levelId: CefrLevel['id'] | undefined
  for (const level of ctx.levels) {
    if (ctx.lockedMap.get(level.id)) continue
    const step = findNextStep(level, ctx.circleById, ctx.learned, ctx.doneGrammar)
    if (!step) continue
    levelId ??= level.id

    const href = duongDanCapCefr(level.id)
    let next: TodayItem | undefined
    if (step.kind === 'vocab' && step.circleId) {
      const circle = ctx.circleById[step.circleId]
      if (circle) {
        const done = circleDoneCount(circle, ctx.learned)
        // Số x/y là số ĐẾM TỪ (việc phải làm), không phải điểm chẩn đoán — được phép hiện.
        const ten = ctx.isA ? circle.titleVi : circle.titleEn
        next = {
          id: todayItemId('next', ENGLISH_SUBJECT_ID, circle.id),
          kind: 'next',
          subjectId: ENGLISH_SUBJECT_ID,
          contentId: circle.id,
          title: `${circle.emoji} ${ten} (${done}/${circle.words.length})`,
          hint: `Từ vựng · Cấp ${level.id}`,
          href,
          evidenceSource: 'english.vocab',
        }
      }
    } else if (step.kind === 'grammar' && step.lessonId) {
      const lesson = step.unit.grammar.find((g) => g.id === step.lessonId)
      if (lesson) {
        next = {
          id: todayItemId('next', ENGLISH_SUBJECT_ID, lesson.id),
          kind: 'next',
          subjectId: ENGLISH_SUBJECT_ID,
          contentId: lesson.id,
          title: ctx.isA ? lesson.titleVi : lesson.titleEn,
          hint: `Ngữ pháp · Cấp ${level.id}`,
          href,
          evidenceSource: 'english.cefrGrammar',
        }
      }
    }
    if (!next) continue

    if (srsDue > 0) {
      const review: TodayItem = {
        id: todayItemId('review', ENGLISH_SUBJECT_ID, 'srs'),
        kind: 'review',
        subjectId: ENGLISH_SUBJECT_ID,
        contentId: 'srs',
        title: `Ôn ${srsDue} thẻ đến hạn`,
        hint: 'Ôn tập từ vựng',
        href: `${href}?tab=srs`,
        evidenceSource: 'english.srs',
      }
      return { next, review, levelId }
    }
    return { next, levelId }
  }
  return levelId === undefined ? {} : { levelId }
}
