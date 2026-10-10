// stemContinue — chọn "bài kế tiếp chưa xong" cho khối "Học tiếp" của bốn môn STEM.
//
// HÀM THUẦN: không đọc localStorage, không fetch. Nhận chỉ mục bài theo lớp + bản đồ tiến độ
// (`completion_state`) rồi trả quyết định. Tiến độ chỉ đến từ BẰNG CHỨNG nộp bài
// (`useStemCompletionState`) — mở bài KHÔNG tính là học (xem spec S11 §④ D).
//
// Hai luật chốt (changelog 0505):
//  1. LỚP MẶC ĐỊNH = lớp có bài được học GẦN NHẤT (theo `updatedAt`, mọi trạng thái); chưa học
//     gì / tiến độ rỗng / null → lớp THẤP NHẤT.
//  2. BÀI KẾ = bài đầu tiên chưa `completed` theo thứ tự mục lục của lớp đó. Hết bài trong lớp
//     → sang lớp cao hơn kế tiếp, rồi vòng lại các lớp thấp hơn; không còn bài nào → `all-done`.
import type { CompletionState } from '@dhcb/core-contracts/completionEvidence'

export interface StemContinueLesson {
  id: string
  title: string
}

export type StemContinueProgress = ReadonlyMap<
  string,
  Pick<CompletionState, 'status' | 'updatedAt'>
>

export type StemContinuePick =
  /** Không có bài chuẩn nào ở bất kỳ lớp nào (môn rỗng). */
  | { kind: 'empty' }
  /** Mọi bài chuẩn của mọi lớp đã hoàn thành. */
  | { kind: 'all-done' }
  | {
      kind: 'next'
      grade: string
      lesson: StemContinueLesson
      /** Bài này đã nộp dở (in_progress) — nhãn "Đang học dở" thay vì "Học tiếp". */
      resuming: boolean
      /** Người học chưa có bằng chứng nào ở môn này — nhãn "Bắt đầu". */
      fresh: boolean
    }

const thoiGian = (iso: string): number => {
  const t = Date.parse(iso)
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t
}

/** Sắp lớp tăng dần theo SỐ ("9" < "10"), lớp không phải số xếp cuối. */
export function sapLop(grades: readonly string[]): string[] {
  const so = (g: string): number => (/^\d+$/.test(g) ? Number(g) : Number.POSITIVE_INFINITY)
  return [...grades].sort((a, b) => so(a) - so(b))
}

/** Lớp có bài học gần nhất; `undefined` khi chưa có bằng chứng nào khớp bài của môn. */
export function lopHocGanNhat(
  lessonsByGrade: ReadonlyMap<string, readonly StemContinueLesson[]>,
  progress: StemContinueProgress | null | undefined,
): string | undefined {
  if (!progress || progress.size === 0) return undefined
  let best: { grade: string; at: number } | undefined
  for (const grade of sapLop([...lessonsByGrade.keys()])) {
    for (const lesson of lessonsByGrade.get(grade) ?? []) {
      const row = progress.get(lesson.id)
      if (!row) continue
      const at = thoiGian(row.updatedAt)
      // Hoà thời gian → giữ lớp ĐÃ gặp trước (lớp thấp hơn, vì duyệt theo thứ tự lớp).
      if (!best || at > best.at) best = { grade, at }
    }
  }
  return best?.grade
}

export function pickStemContinue(
  lessonsByGrade: ReadonlyMap<string, readonly StemContinueLesson[]>,
  progress: StemContinueProgress | null | undefined,
  /** Lớp bắt đầu khi CHƯA có bằng chứng học nào. Toán có cả lớp 6–9 nhưng người học hiện có
   *  phần lớn ở cấp 3, nên người mới vẫn bắt đầu ở lớp 10 như trước khi mở THCS. Vắng mặt hoặc
   *  lớp đó không có bài → lớp thấp nhất. */
  defaultGrade?: string,
): StemContinuePick {
  const grades = sapLop([...lessonsByGrade.keys()].filter((g) => lessonsByGrade.get(g)?.length))
  if (grades.length === 0) return { kind: 'empty' }

  const recent = lopHocGanNhat(lessonsByGrade, progress)
  const startGrade = recent ?? defaultGrade
  const start = startGrade !== undefined ? Math.max(0, grades.indexOf(startGrade)) : 0
  // Thứ tự duyệt: từ lớp mặc định lên cao, rồi vòng về các lớp thấp hơn.
  const order = [...grades.slice(start), ...grades.slice(0, start)]

  for (const grade of order) {
    for (const lesson of lessonsByGrade.get(grade) ?? []) {
      const row = progress?.get(lesson.id)
      if (row?.status === 'completed') continue
      return {
        kind: 'next',
        grade,
        lesson,
        resuming: row?.status === 'in_progress',
        fresh: recent === undefined,
      }
    }
  }
  return { kind: 'all-done' }
}
