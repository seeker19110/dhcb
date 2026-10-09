// lessons.ts — Registry BÀI HỌC môn Sinh học (gộp từ các file theo lớp/chương) + hàm tra cứu.
import type { BiologyLesson } from './lessonTypes.js'
import { SINH10_C1_LESSONS } from './lessons/sinh10c1.js'
import { SINH10_C2_LESSONS } from './lessons/sinh10c2.js'
import { SINH10_C3_LESSONS } from './lessons/sinh10c3.js'
import { SINH10_C4_LESSONS } from './lessons/sinh10c4.js'
import { SINH11_C1_LESSONS } from './lessons/sinh11c1.js'
import { SINH11_C2_LESSONS } from './lessons/sinh11c2.js'
import { SINH12_C1_LESSONS } from './lessons/sinh12c1.js'
import { SINH12_C2_LESSONS } from './lessons/sinh12c2.js'
import { SINH12_C3_LESSONS } from './lessons/sinh12c3.js'
import { SINH_HSG_TE_BAO_LESSONS } from './lessons/sinhhsgtebao.js'
import { SINH_HSG_SINH_LI_LESSONS } from './lessons/sinhhsgsinhli.js'
import { SINH_HSG_DI_TRUYEN_LESSONS } from './lessons/sinhhsgditruyen.js'

export const BIOLOGY_LESSONS: BiologyLesson[] = [
  ...SINH10_C1_LESSONS,
  ...SINH10_C2_LESSONS,
  ...SINH10_C3_LESSONS,
  ...SINH10_C4_LESSONS,
  ...SINH11_C1_LESSONS,
  ...SINH11_C2_LESSONS,
  ...SINH12_C1_LESSONS,
  ...SINH12_C2_LESSONS,
  ...SINH12_C3_LESSONS,
  // Chuyên đề bồi dưỡng học sinh giỏi (nhánh 'advanced', chương 91–93) — thêm 2026-10-09.
  ...SINH_HSG_TE_BAO_LESSONS,
  ...SINH_HSG_SINH_LI_LESSONS,
  ...SINH_HSG_DI_TRUYEN_LESSONS,
]

/** Chuyên đề bồi dưỡng học sinh giỏi, xếp từ cấp trường → cấp tỉnh → cấp quốc gia. */
export function listBiologyAdvancedLessons(): BiologyLesson[] {
  const tierOrder = { 'hsg-truong': 0, 'hsg-tinh': 1, 'hsg-quoc-gia': 2 } as const
  return BIOLOGY_LESSONS.filter((l) => l.track === 'advanced').sort((a, b) => {
    // advancedTier chắc chắn có với bài 'advanced' (schema ràng buộc); mặc định chỉ để khỏi ép kiểu.
    const ta = a.advancedTier ? tierOrder[a.advancedTier] : 0
    const tb = b.advancedTier ? tierOrder[b.advancedTier] : 0
    return ta !== tb ? ta - tb : a.id.localeCompare(b.id)
  })
}

const lessonMap = new Map<string, BiologyLesson>(BIOLOGY_LESSONS.map((l) => [l.id, l]))

export function getBiologyLesson(id: string): BiologyLesson | undefined {
  return lessonMap.get(id)
}

export function listBiologyLessonsByGrade(grade: '10' | '11' | '12'): BiologyLesson[] {
  return BIOLOGY_LESSONS.filter((l) => l.grade === grade).sort((a, b) =>
    a.chapterNumber !== b.chapterNumber
      ? a.chapterNumber - b.chapterNumber
      : a.lessonNumber - b.lessonNumber,
  )
}

export function listBiologyLessonsByChapter(
  grade: '10' | '11' | '12',
  chapterNumber: number,
): BiologyLesson[] {
  return listBiologyLessonsByGrade(grade).filter((l) => l.chapterNumber === chapterNumber)
}
