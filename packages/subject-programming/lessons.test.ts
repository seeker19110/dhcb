// Gác chất lượng nội dung bài học: mọi bài phải qua LessonSchema + khớp chéo curriculum.
import { describe, expect, it } from 'vitest'
import { PROGRAMMING_LESSONS, getLesson, getLessonsByUnit } from './lessons.js'
import { LessonSchema } from './lessonTypes.js'
import { PROGRAMMING_LEVELS } from './curriculum.js'
import { SHORT_COURSES } from './courses/registry.js'
import type { LessonAnimation } from '@dhcb/core-contracts/lessonAnimation'

const animation: LessonAnimation = {
  title: 'Luồng dữ liệu',
  description: 'Dữ liệu đi từ đầu vào, qua bước xử lý rồi tới đầu ra.',
  viewBoxWidth: 320,
  viewBoxHeight: 120,
  durationMs: 2000,
  loop: false,
  shapes: [
    {
      kind: 'circle',
      id: 'du-lieu',
      cx: 30,
      cy: 60,
      r: 10,
      fill: 'accent',
      keyframes: [
        { atMs: 0, dx: 0 },
        { atMs: 1000, dx: 130 },
        { atMs: 2000, dx: 260 },
      ],
    },
  ],
  captions: [
    { atMs: 0, text: 'Nhận dữ liệu đầu vào.' },
    { atMs: 1000, text: 'Xử lý dữ liệu.' },
    { atMs: 2000, text: 'Trả kết quả đầu ra.' },
  ],
}

const ALL_UNIT_IDS = new Set(PROGRAMMING_LEVELS.flatMap((l) => l.units.map((u) => u.id)))

// Bài thuộc TẦNG KHOÁ NGẮN (unitId dạng 'git-u2'…) không nằm trong curriculum.ts — đây là
// "unit ảo", chỉ hợp lệ khi id của chính bài đó THẬT SỰ được một khoá tham chiếu (qua
// courses/registry.ts). Tránh nới lỏng vô căn cứ: một bài unitId 'git-u9' bịa ra mà không
// khoá nào trỏ tới vẫn phải bị chặn, đúng tinh thần cổng gốc.
const COURSE_REFERENCED_LESSON_IDS = new Set(
  SHORT_COURSES.flatMap((c) => c.chapters.flatMap((ch) => ch.lessonIds)),
)

describe('programming lessons', () => {
  it('bài cũ không có animation và bài có hoạt họa khai báo đều hợp lệ', () => {
    const lesson = getLesson('p1-u4-l1')!
    const baiCu = { ...lesson }
    delete baiCu.animation
    expect(LessonSchema.parse(baiCu).animation).toBeUndefined()
    expect(LessonSchema.parse({ ...baiCu, animation }).animation).toEqual(animation)
  })

  it.each([
    ['thiếu mô tả', { ...animation, description: undefined }],
    ['trùng id hình', { ...animation, shapes: [animation.shapes[0], animation.shapes[0]] }],
    [
      'keyframe vượt thời lượng',
      {
        ...animation,
        shapes: [{ ...animation.shapes[0], keyframes: [{ atMs: 2001, dx: 0 }] }],
      },
    ],
    ['HTML tùy ý', { ...animation, html: '<svg onload="alert(1)"></svg>' }],
  ])('LessonSchema chặn hoạt họa %s', (_case, animationSai) => {
    const result = LessonSchema.safeParse({ ...getLesson('p1-u4-l1')!, animation: animationSai })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'animation')).toBe(true)
    }
  })

  it('mọi bài đúng khuôn LessonSchema (Zod)', () => {
    for (const lesson of PROGRAMMING_LESSONS) {
      const r = LessonSchema.safeParse(lesson)
      expect(r.success, `Bài ${lesson.id} sai khuôn: ${r.success ? '' : r.error.message}`).toBe(
        true,
      )
    }
  })

  it('id duy nhất và unitId tồn tại thật trong curriculum (hoặc là unit ảo của khoá ngắn, có khoá tham chiếu thật)', () => {
    const seen = new Set<string>()
    for (const lesson of PROGRAMMING_LESSONS) {
      expect(seen.has(lesson.id)).toBe(false)
      seen.add(lesson.id)
      if (
        lesson.unitId.startsWith('git-u') ||
        lesson.unitId.startsWith('hermes-u') ||
        lesson.unitId.startsWith('vibe-u') ||
        lesson.unitId.startsWith('openclaw-u') ||
        lesson.unitId.startsWith('ml-u') ||
        lesson.unitId.startsWith('pyai-u') ||
        lesson.unitId.startsWith('mathai-u') ||
        lesson.unitId.startsWith('mlds-u') ||
        lesson.unitId.startsWith('cv1-u') ||
        lesson.unitId.startsWith('cv2-u') ||
        lesson.unitId.startsWith('llmagent-u')
      ) {
        expect(
          COURSE_REFERENCED_LESSON_IDS.has(lesson.id),
          `bài ${lesson.id} khai unit ảo ${lesson.unitId} nhưng KHÔNG có khoá ngắn nào tham chiếu tới nó`,
        ).toBe(true)
      } else {
        expect(ALL_UNIT_IDS.has(lesson.unitId), `unit ${lesson.unitId} không tồn tại`).toBe(true)
      }
    }
  })

  it('mỗi bài Make có ít nhất 1 ca HIỆN (học viên phải thấy được mình sai gì)', () => {
    for (const lesson of PROGRAMMING_LESSONS) {
      expect(lesson.make.testCases.some((t) => !t.hidden)).toBe(true)
    }
  })

  it('bài mẫu P1-U4 tính tiền đúng số học (khớp đề với test-case, không tin tay soạn)', () => {
    const tien = (kwh: number) =>
      kwh <= 50
        ? kwh * 1893
        : kwh <= 100
          ? 50 * 1893 + (kwh - 50) * 1956
          : 50 * 1893 + 50 * 1956 + (kwh - 100) * 2271
    const lesson = getLesson('p1-u4-l1')!
    const expectFor = (stdin: string) =>
      lesson.make.testCases.find((t) => t.stdinLines[0] === stdin)!.expected
    for (const kwh of [30, 60, 50, 150, 0]) {
      expect(expectFor(String(kwh))).toBe(`Tien dien: ${tien(kwh)} dong`)
    }
  })

  // Bậc đã MỞ = mọi unit của bậc đều có bài (học viên đi trọn bậc, không gặp lỗ hổng
  // "Sắp mở" ở giữa đường). P1 mở ở PR-L4, P2 ở PR-L6, P3 ở PR-L11, P4 ở PR-L17, P5 ở PR-L18,
  // P6 ở PR-L19 — từ đây MỌI bậc của môn đều đã mở, không còn unit rỗng nào.
  it.each(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'])(
    'MỌI unit của bậc %s đều đã có bài học',
    (levelId) => {
      const units = PROGRAMMING_LEVELS.find((l) => l.id === levelId)!.units
      const thieu = units.filter((u) => getLessonsByUnit(u.id).length === 0).map((u) => u.id)
      expect(thieu, `Unit ${levelId} chưa có bài học: ${thieu.join(', ')}`).toEqual([])
    },
  )

  it('tra cứu theo unit và theo id', () => {
    expect(getLessonsByUnit('p1-u4').map((l) => l.id)).toContain('p1-u4-l1')
    expect(getLessonsByUnit('p2-u4').map((l) => l.id)).toContain('p2-u4-l1')
    expect(getLessonsByUnit('p3-u2').map((l) => l.id)).toContain('p3-u2-l1')
    expect(getLessonsByUnit('p4-u1').map((l) => l.id)).toContain('p4-u1-l1')
    expect(getLessonsByUnit('p5-u1').map((l) => l.id)).toContain('p5-u1-l1')
    expect(getLessonsByUnit('p6-u1').map((l) => l.id)).toContain('p6-u1-l1')
    // Từ PR-L19 mọi unit CÓ THẬT đều đã có bài, nên mốc "nhánh rỗng" phải là một unit
    // KHÔNG tồn tại — giữ nhánh này để hàm tra cứu vẫn trả mảng rỗng chứ không ném lỗi.
    expect(getLessonsByUnit('p1-u99')).toEqual([])
    expect(getLesson('p9-u9-l9')).toBeUndefined()
  })
})

it('Git assertions chỉ hợp lệ bài Git, mọi ngôn ngữ khác bị chặn', () => {
  const lesson = getLesson('p1-u4-l1')!
  const testCases = [
    { ...lesson.make.testCases[0]!, gitAssertions: [{ type: 'headAbsent', path: '.env' }] },
  ]
  expect(LessonSchema.safeParse({ ...lesson, make: { ...lesson.make, testCases } }).success).toBe(
    false,
  )
  const git = PROGRAMMING_LESSONS.find((l) => l.language === 'git')!
  expect(LessonSchema.safeParse({ ...git, make: { ...git.make, testCases } }).success).toBe(true)
})
