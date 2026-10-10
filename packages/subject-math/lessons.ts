// lessons.ts — Registry BÀI HỌC môn Toán (gộp từ các file theo chương) + hàm tra cứu.
import type { MathGrade, MathLesson } from './lessonTypes.js'
import { TOAN6_C1_LESSONS } from './lessons/toan6c1.js'
import { TOAN6_C2_LESSONS } from './lessons/toan6c2.js'
import { TOAN6_C3_LESSONS } from './lessons/toan6c3.js'
import { TOAN6_C4_LESSONS } from './lessons/toan6c4.js'
import { TOAN6_C5_LESSONS } from './lessons/toan6c5.js'
import { TOAN6_C6_LESSONS } from './lessons/toan6c6.js'
import { TOAN6_C7_LESSONS } from './lessons/toan6c7.js'
import { TOAN6_C8_LESSONS } from './lessons/toan6c8.js'
import { TOAN6_C9_LESSONS } from './lessons/toan6c9.js'
import { TOAN7_C1_LESSONS } from './lessons/toan7c1.js'
import { TOAN7_C2_LESSONS } from './lessons/toan7c2.js'
import { TOAN7_C3_LESSONS } from './lessons/toan7c3.js'
import { TOAN7_C4_LESSONS } from './lessons/toan7c4.js'
import { TOAN7_C5_LESSONS } from './lessons/toan7c5.js'
import { TOAN7_C6_LESSONS } from './lessons/toan7c6.js'
import { TOAN7_C7_LESSONS } from './lessons/toan7c7.js'
import { TOAN7_C8_LESSONS } from './lessons/toan7c8.js'
import { TOAN7_C9_LESSONS } from './lessons/toan7c9.js'
import { TOAN7_C10_LESSONS } from './lessons/toan7c10.js'
import { TOAN10_C1_LESSONS } from './lessons/toan10c1.js'
import { TOAN10_C2_LESSONS } from './lessons/toan10c2.js'
import { TOAN10_C3_LESSONS } from './lessons/toan10c3.js'
import { TOAN10_C4_LESSONS } from './lessons/toan10c4.js'
import { TOAN10_C5_LESSONS } from './lessons/toan10c5.js'
import { TOAN10_C6_LESSONS } from './lessons/toan10c6.js'
import { TOAN10_C7_LESSONS } from './lessons/toan10c7.js'
import { TOAN10_C8_LESSONS } from './lessons/toan10c8.js'
import { TOAN10_C9_LESSONS } from './lessons/toan10c9.js'
import { TOAN11_C1_LESSONS } from './lessons/toan11c1.js'
import { TOAN11_C2_LESSONS } from './lessons/toan11c2.js'
import { TOAN11_C3_LESSONS } from './lessons/toan11c3.js'
import { TOAN11_C4_LESSONS } from './lessons/toan11c4.js'
import { TOAN11_C5_LESSONS } from './lessons/toan11c5.js'
import { TOAN11_C6_LESSONS } from './lessons/toan11c6.js'
import { TOAN11_C7_LESSONS } from './lessons/toan11c7.js'
import { TOAN11_C8_LESSONS } from './lessons/toan11c8.js'
import { TOAN10_C20_LESSONS } from './lessons/toan10c20.js'
import { TOAN11_C9_LESSONS } from './lessons/toan11c9.js'
import { TOAN11_C20_LESSONS } from './lessons/toan11c20.js'
import { TOAN12_C1_LESSONS } from './lessons/toan12c1.js'
import { TOAN12_C2_LESSONS } from './lessons/toan12c2.js'
import { TOAN12_C3_LESSONS } from './lessons/toan12c3.js'
import { TOAN12_C4_LESSONS } from './lessons/toan12c4.js'
import { TOAN12_C5_LESSONS } from './lessons/toan12c5.js'
import { TOAN12_C6_LESSONS } from './lessons/toan12c6.js'
import { TOAN12_C20_LESSONS } from './lessons/toan12c20.js'

export const MATH_LESSONS: MathLesson[] = [
  // THCS — Toán 6 (docs/specs/2026-10-10-toan-thcs-6-9.md).
  ...TOAN6_C1_LESSONS,
  ...TOAN6_C2_LESSONS,
  ...TOAN6_C3_LESSONS,
  ...TOAN6_C4_LESSONS,
  ...TOAN6_C5_LESSONS,
  ...TOAN6_C6_LESSONS,
  ...TOAN6_C7_LESSONS,
  ...TOAN6_C8_LESSONS,
  ...TOAN6_C9_LESSONS,
  // Toán 7.
  ...TOAN7_C1_LESSONS,
  ...TOAN7_C2_LESSONS,
  ...TOAN7_C3_LESSONS,
  ...TOAN7_C4_LESSONS,
  ...TOAN7_C5_LESSONS,
  ...TOAN7_C6_LESSONS,
  ...TOAN7_C7_LESSONS,
  ...TOAN7_C8_LESSONS,
  ...TOAN7_C9_LESSONS,
  ...TOAN7_C10_LESSONS,
  ...TOAN10_C1_LESSONS,
  ...TOAN10_C2_LESSONS,
  ...TOAN10_C3_LESSONS,
  ...TOAN10_C4_LESSONS,
  ...TOAN10_C5_LESSONS,
  ...TOAN10_C6_LESSONS,
  ...TOAN10_C7_LESSONS,
  ...TOAN10_C8_LESSONS,
  ...TOAN10_C9_LESSONS,
  ...TOAN11_C1_LESSONS,
  ...TOAN11_C2_LESSONS,
  ...TOAN11_C3_LESSONS,
  ...TOAN11_C4_LESSONS,
  ...TOAN11_C5_LESSONS,
  ...TOAN11_C6_LESSONS,
  ...TOAN11_C7_LESSONS,
  ...TOAN11_C8_LESSONS,
  ...TOAN11_C9_LESSONS,
  ...TOAN12_C1_LESSONS,
  ...TOAN12_C2_LESSONS,
  ...TOAN12_C3_LESSONS,
  ...TOAN12_C4_LESSONS,
  ...TOAN12_C5_LESSONS,
  ...TOAN12_C6_LESSONS,
  // Nhánh nâng cao (HSG): cấp trường → cấp tỉnh → cấp quốc gia.
  ...TOAN10_C20_LESSONS,
  ...TOAN11_C20_LESSONS,
  ...TOAN12_C20_LESSONS,
]

const lessonMap = new Map<string, MathLesson>(MATH_LESSONS.map((l) => [l.id, l]))

export function getMathLesson(id: string): MathLesson | undefined {
  return lessonMap.get(id)
}

export function listMathLessonsByGrade(grade: MathGrade): MathLesson[] {
  return MATH_LESSONS.filter((l) => l.grade === grade).sort((a, b) =>
    a.chapterNumber !== b.chapterNumber
      ? a.chapterNumber - b.chapterNumber
      : a.lessonNumber - b.lessonNumber,
  )
}
