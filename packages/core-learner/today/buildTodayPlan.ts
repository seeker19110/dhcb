// buildTodayPlan — resolver THUẦN của "Hôm nay": nhận tín hiệu đã gom sẵn của từng môn, trả về
// ĐÚNG MỘT việc chính + tối đa hai việc phụ.
//
// Đặc tả: docs/specs/2026-09-15-learning-ux-s06-hom-nay-hoc-tiep.md §③.2.
//
// BA LUẬT của file này:
//  1. THUẦN và ĐỒNG BỘ: không fetch, không đọc storage, không React, không `Date.now()` (thời
//     gian luôn truyền vào) — nhờ vậy mọi nhánh đều test được bằng bảng dữ liệu.
//  2. KHÔNG MẶC ĐỊNH TIẾNG ANH: không có tín hiệu nào thì trả `pick` về `/goc-hoc-tap`; file này
//     cố ý KHÔNG chứa chuỗi đường dẫn của bất cứ môn nào (URL do adapter của môn dựng).
//  3. THỨ TỰ CỐ ĐỊNH, KHÔNG XOAY VÒNG: phiên dở mới nhất → bài kế tiếp của môn có bằng chứng mới
//     nhất → ôn tập → chọn môn. Hoà thì theo `TIE_BREAK_ORDER` (Anh đứng CUỐI để không thành mặc
//     định ngầm) — kết quả không phụ thuộc thứ tự mảng đầu vào.
import {
  todayItemId,
  type ResumePoint,
  type TodayItem,
  type TodayPlan,
} from '@dhcb/core-contracts/todayPlan'

/** Số mục phụ tối đa (§7 Q6). Nhiều hơn thì thẻ thành danh sách và CTA chính mất trọng tâm. */
export const MAX_SECONDARY = 2

/**
 * Thứ tự phá hoà khi KHÔNG có mốc thời gian nào để so (§7 Q1 bậc 3). Tiếng Anh đứng cuối: nó là
 * môn chín nhất, để đầu là biến "không biết chọn gì" thành "mặc định tiếng Anh".
 */
export const TIE_BREAK_ORDER: readonly string[] = [
  'programming',
  'mathematics',
  'physics',
  'chemistry',
  'biology',
  'english',
]

export interface SubjectSignal {
  subjectId: string
  /** Tên môn để dựng chữ "Môn thứ hai: …"; vắng thì mục phụ không có phần tên môn. */
  subjectLabel?: string
  /** Phiên dở gần nhất của môn (S08 → `ResumePoint`) — undefined nếu không có. */
  resume?: ResumePoint
  /**
   * Đường dẫn mở lại phiên, do adapter của môn dựng (`duongDanBaiHoc`…). Resolver không biết URL
   * của môn nào cả. Có `resume` mà KHÔNG tra ra được `href` (bài đã bị gỡ khỏi registry) thì
   * phiên bị bỏ qua và kế hoạch rơi xuống bậc 2 — thà chỉ bài kế tiếp còn hơn một nút chết.
   */
  resumeHref?: string
  /** Tên bài của phiên dở; vắng thì dùng `contentId` (vẫn hơn để trống thẻ). */
  resumeTitle?: string
  /** Bài kế tiếp do adapter môn tính — undefined nếu xong hết/không đo được. */
  next?: TodayItem
  /** Mục ôn tập do adapter cấp (hiện chỉ Anh: SRS) — undefined nếu 0 thẻ. */
  review?: TodayItem
  /** Mốc hoạt động gần nhất KHÔNG phải phiên (vd `max(completedAt)` Lập trình) — §7 Q1 bậc 2. */
  lastEvidenceAt?: number
}

export interface TodayInput {
  /** Mỗi môn tối đa một phần tử; thứ tự KHÔNG có ý nghĩa. */
  signals: readonly SubjectSignal[]
  /** `Date.now()` truyền vào để test tất định. */
  now: number
  /**
   * Danh sách môn hợp lệ (`SUPPORTED_SUBJECTS`). Tín hiệu của môn lạ bị BỎ QUA, không ném lỗi —
   * dữ liệu cũ trong localStorage không được làm trắng Trang chủ. Vắng = không lọc.
   */
  knownSubjectIds?: readonly string[]
  /**
   * [U9b, 2026-10-05] Môn người học CHỦ ĐỘNG chọn lúc onboarding (kèm tên để dựng chữ). Chỉ dùng
   * khi KHÔNG có tín hiệu nào: thay "Chọn môn để bắt đầu" (hỏi lại điều vừa trả lời) bằng lời
   * mời vào đúng môn đó. Đây là lựa chọn của người học, KHÔNG phải tiến độ — nên mục vẫn là
   * `pick` (nhãn "Bắt đầu: …"), không bao giờ thành "Học tiếp" một bài chưa từng mở. Môn lạ
   * (ngoài `knownSubjectIds`) bị bỏ qua như mọi tín hiệu lạ khác.
   */
  chosenSubject?: { id: string; label?: string }
}

/** Môn này có bất kỳ tín hiệu nào không (kể cả tín hiệu không dùng làm việc để học)? */
function coTinHieu(signal: SubjectSignal): boolean {
  return (
    signal.resume !== undefined ||
    signal.next !== undefined ||
    signal.review !== undefined ||
    signal.lastEvidenceAt !== undefined
  )
}

/** Phiên chỉ dùng được khi adapter tra ra đường dẫn mở lại. */
function phienDungDuoc(signal: SubjectSignal): boolean {
  return signal.resume !== undefined && !!signal.resumeHref
}

function thuTuPhaHoa(subjectId: string): number {
  const index = TIE_BREAK_ORDER.indexOf(subjectId)
  return index === -1 ? TIE_BREAK_ORDER.length : index
}

/** So hai môn: mốc thời gian lớn hơn thắng; hoà thì theo thứ tự cố định rồi tới id (ổn định). */
function soSanh(
  a: { signal: SubjectSignal; at?: number },
  b: { signal: SubjectSignal; at?: number },
): number {
  const byTime = (b.at ?? 0) - (a.at ?? 0)
  if (byTime !== 0) return byTime
  const byOrder = thuTuPhaHoa(a.signal.subjectId) - thuTuPhaHoa(b.signal.subjectId)
  if (byOrder !== 0) return byOrder
  return a.signal.subjectId < b.signal.subjectId ? -1 : 1
}

/** Dựng mục `resume` từ tín hiệu — chỉ gọi khi `phienDungDuoc`. */
function mucPhienDo(signal: SubjectSignal): TodayItem {
  const resume = signal.resume as ResumePoint
  return {
    id: todayItemId('resume', signal.subjectId, resume.contentId),
    kind: 'resume',
    subjectId: signal.subjectId,
    ...(resume.courseId === undefined ? {} : { courseId: resume.courseId }),
    contentId: resume.contentId,
    title: signal.resumeTitle ?? resume.contentId,
    href: signal.resumeHref as string,
    evidenceSource: 'session.resume',
    resume,
  }
}

/** Mục phụ của môn thứ hai: nói rõ đó là môn khác để người học không bấm nhầm. */
function ganNhanMonThuHai(item: TodayItem, signal: SubjectSignal): TodayItem {
  if (!signal.subjectLabel) return item
  return { ...item, hint: `Môn thứ hai: ${signal.subjectLabel}` }
}

/** Việc học của một môn khi nó KHÔNG phải môn chính: ưu tiên phiên dở, rồi bài kế tiếp. */
function vieckhacCuaMon(signal: SubjectSignal): TodayItem | undefined {
  if (phienDungDuoc(signal)) return mucPhienDo(signal)
  return signal.next
}

/**
 * Xếp kế hoạch "Hôm nay".
 *
 * @param input tín hiệu từng môn (adapter đã gom) + mốc thời gian.
 * @returns kế hoạch luôn có `primary` (tệ nhất là `kind:'pick'`) và ≤ 2 mục phụ.
 */
export function buildTodayPlan(input: TodayInput): TodayPlan {
  const known = input.knownSubjectIds
  const signals = input.signals.filter((s) => !known || known.includes(s.subjectId))
  const coMat = signals.filter(coTinHieu)
  const subjectsSeen = [...coMat]
    .sort((a, b) => soSanh({ signal: a }, { signal: b }))
    .map((s) => s.subjectId)

  // Bậc 1 — phiên dở mới nhất thắng mọi thứ (kể cả khi bài ấy đã được đánh dấu hoàn thành ở
  // evidence môn: phiên là dấu vết gần nhất của người học, S11 mới là nơi đóng phiên).
  const coPhien = signals
    .filter(phienDungDuoc)
    .map((signal) => ({ signal, at: signal.resume?.updatedAt }))
    .sort(soSanh)

  // Bậc 2 — môn có bài kế tiếp, chọn theo mốc bằng chứng gần nhất.
  const coBaiKeTiep = signals
    .filter((s) => s.next !== undefined)
    .map((signal) => ({ signal, at: signal.lastEvidenceAt }))
    .sort(soSanh)

  // Bậc 3 — chỉ còn việc ôn tập.
  const coOnTap = signals
    .filter((s) => s.review !== undefined)
    .map((signal) => ({ signal, at: signal.lastEvidenceAt }))
    .sort(soSanh)

  const chinh = coPhien[0]?.signal ?? coBaiKeTiep[0]?.signal ?? coOnTap[0]?.signal
  const plan = chinh
    ? keHoachCoViec(chinh, signals, subjectsSeen, input.now)
    : keHoachChonMon(coMat, subjectsSeen, input.now, monDaChon(input))
  return plan
}

/** Kế hoạch khi đã có ít nhất một việc học được. */
function keHoachCoViec(
  chinh: SubjectSignal,
  signals: readonly SubjectSignal[],
  subjectsSeen: readonly string[],
  now: number,
): TodayPlan {
  const laPhien = phienDungDuoc(chinh)
  const primary = laPhien ? mucPhienDo(chinh) : (chinh.next ?? (chinh.review as TodayItem))

  const phu: TodayItem[] = []
  // (a) Bài tiếp SAU bài đang học dở — bỏ qua khi trùng chính bài đó.
  if (laPhien && chinh.next && chinh.next.contentId !== chinh.resume?.contentId) {
    phu.push(chinh.next)
  }
  // (b) Ôn tập của chính môn đang học.
  if (chinh.review && chinh.review.id !== primary.id) phu.push(chinh.review)
  // (c) Việc của môn thứ hai — theo cùng tiêu chí thời gian với môn chính.
  const monThuHai = [...signals]
    .filter((s) => s.subjectId !== chinh.subjectId)
    .map((signal) => ({
      signal,
      at: signal.resume?.updatedAt ?? signal.lastEvidenceAt,
    }))
    .sort(soSanh)
  for (const { signal } of monThuHai) {
    const item = vieckhacCuaMon(signal)
    if (item) {
      phu.push(ganNhanMonThuHai(item, signal))
      break
    }
  }

  const secondary = phu.filter((item) => item.id !== primary.id).slice(0, MAX_SECONDARY)
  return { primary, secondary, subjectsSeen: [...subjectsSeen], builtAt: now }
}

/** Môn đã chọn lúc onboarding, nếu hợp lệ theo `knownSubjectIds`. */
function monDaChon(input: TodayInput): { id: string; label?: string } | undefined {
  const chon = input.chosenSubject
  if (!chon || !chon.id) return undefined
  if (input.knownSubjectIds && !input.knownSubjectIds.includes(chon.id)) return undefined
  return chon
}

/**
 * Kế hoạch khi KHÔNG có việc nào: mời chọn môn.
 *
 * Đây là chỗ luật "không mặc định tiếng Anh" được thi hành: đường dẫn duy nhất là góc học tập,
 * có đúng MỘT môn để lại dấu vết thì đi thẳng vào góc của môn đó, còn lại là góc chung.
 */
function keHoachChonMon(
  coMat: readonly SubjectSignal[],
  subjectsSeen: readonly string[],
  now: number,
  daChon?: { id: string; label?: string },
): TodayPlan {
  const motMon = coMat.length === 1 ? coMat[0] : undefined
  const daTungHoc = coMat.length > 0
  // [U9b] Người mới vừa chọn môn ở onboarding, chưa học gì: mời vào ĐÚNG môn đó. Tiêu đề theo
  // khuôn "lời dẫn — việc" mà `todayCardText.tachLoiMoi` tách thành dòng nguồn + nhãn nút.
  if (!daTungHoc && daChon) {
    const primary: TodayItem = {
      id: todayItemId('pick', daChon.id, undefined),
      kind: 'pick',
      subjectId: daChon.id,
      title: `Môn bạn đã chọn — học ${daChon.label ?? daChon.id}`,
      href: `/goc-hoc-tap/${daChon.id}`,
      evidenceSource: 'none',
    }
    return { primary, secondary: [], subjectsSeen: [...subjectsSeen], builtAt: now }
  }
  const primary: TodayItem = {
    id: todayItemId('pick', motMon?.subjectId, undefined),
    kind: 'pick',
    ...(motMon ? { subjectId: motMon.subjectId } : {}),
    title: daTungHoc
      ? 'Bạn đã đi hết nội dung đang có — chọn môn hoặc khoá mới'
      : 'Chọn môn để bắt đầu',
    href: motMon ? `/goc-hoc-tap/${motMon.subjectId}` : '/goc-hoc-tap',
    evidenceSource: 'none',
  }
  return { primary, secondary: [], subjectsSeen: [...subjectsSeen], builtAt: now }
}
