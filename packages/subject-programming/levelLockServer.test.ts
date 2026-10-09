// levelLockServer.test.ts — canh gác luật khoá bậc P1→P6 SIẾT Ở SERVER (2026-09-19).
// Đặc tả: docs/changelog/2026-09-19-siet-khoa-bac-lap-trinh-server.md
import { describe, it, expect } from 'vitest'
import {
  checkLevelWriteAllowed,
  levelOfSpineLesson,
  buildLevelLessonsServer,
} from './levelLockServer.js'

describe('levelOfSpineLesson', () => {
  it('nhận diện bài xương sống P1–P6', () => {
    expect(levelOfSpineLesson('p3-u2-l1')).toBe('p3')
  })

  it('bước dự án trục / hướng chuyên sâu / khoá ngắn KHÔNG thuộc phạm vi khoá bậc', () => {
    expect(levelOfSpineLesson('p1-s1')).toBeNull()
    expect(levelOfSpineLesson('web-s2-m1')).toBeNull()
    expect(levelOfSpineLesson('git-u2-l1')).toBeNull()
  })

  it('bước dự án T2/T3 (2026-10-09) cũng KHÔNG phải bài xương sống — đối xử y như bước T1', () => {
    expect(levelOfSpineLesson('t2-p3-s1')).toBeNull()
    expect(levelOfSpineLesson('t3-p5-s4')).toBeNull()
  })
})

describe('checkLevelWriteAllowed', () => {
  const levels = buildLevelLessonsServer()

  it('bước dự án T1/T2/T3 ở bậc cao KHÔNG bị khoá bậc (Free, chưa học gì)', () => {
    for (const lessonId of ['p5-s1', 't2-p5-s1', 't3-p4-s2']) {
      const result = checkLevelWriteAllowed({
        lessonId,
        plan: 'free',
        completedLessonIds: [],
        everEnteredLessonIds: [],
      })
      expect(result.allowed, lessonId).toBe(true)
    }
  })

  const p2Lessons = levels.find((l) => l.levelId === 'p2')?.lessonIds ?? []
  const firstP2Lesson = p2Lessons[0]
  if (!firstP2Lesson) throw new Error('P2 chưa có bài nào — dữ liệu giáo trình đã đổi?')

  it('Free ghi bài P2 khi CHƯA hoàn thành đủ P1 → bị chặn (đúng lỗ hổng debt mô tả)', () => {
    const result = checkLevelWriteAllowed({
      lessonId: firstP2Lesson,
      plan: 'free',
      completedLessonIds: [],
      everEnteredLessonIds: [],
    })
    expect(result.allowed).toBe(false)
    if (!result.allowed) expect(result.requiredLevelId).toBe('p1')
  })

  it('Free ghi bài P1 (bậc đầu) luôn qua được, kể cả chưa học gì', () => {
    const p1Lessons = levels.find((l) => l.levelId === 'p1')?.lessonIds ?? []
    const firstP1Lesson = p1Lessons[0]
    if (!firstP1Lesson) throw new Error('P1 chưa có bài nào')
    const result = checkLevelWriteAllowed({
      lessonId: firstP1Lesson,
      plan: 'free',
      completedLessonIds: [],
      everEnteredLessonIds: [],
    })
    expect(result.allowed).toBe(true)
  })

  it('Free ghi bài P2 khi ĐÃ hoàn thành đủ P1 (≥70%) → qua được', () => {
    const p1Lessons = levels.find((l) => l.levelId === 'p1')?.lessonIds ?? []
    const needed = Math.ceil(p1Lessons.length * 0.7)
    const completed = p1Lessons.slice(0, needed)
    const result = checkLevelWriteAllowed({
      lessonId: firstP2Lesson,
      plan: 'free',
      completedLessonIds: completed,
      everEnteredLessonIds: completed,
    })
    expect(result.allowed).toBe(true)
  })

  it('User GRANDFATHER (đã có dòng tiến độ ở P2 từ trước) vẫn ghi tiếp được dù P1 chưa đủ 70%', () => {
    // Suy grandfather TỪ DỮ LIỆU SERVER: đã có ít nhất 1 dòng tiến độ ở P2 (bất kể status) tức
    // là đã từng vào bậc này trước khi luật ra đời — không khoá oan người dùng cũ.
    const result = checkLevelWriteAllowed({
      lessonId: firstP2Lesson,
      plan: 'free',
      completedLessonIds: [],
      everEnteredLessonIds: [firstP2Lesson],
    })
    expect(result.allowed).toBe(true)
  })

  it('VIP luôn qua được, bất kể tiến độ P1', () => {
    const result = checkLevelWriteAllowed({
      lessonId: firstP2Lesson,
      plan: 'vip',
      completedLessonIds: [],
      everEnteredLessonIds: [],
    })
    expect(result.allowed).toBe(true)
  })

  it('bước dự án trục (p1-s1) không bị chặn dù ngoài phạm vi P1', () => {
    const result = checkLevelWriteAllowed({
      lessonId: 'p3-s1',
      plan: 'free',
      completedLessonIds: [],
      everEnteredLessonIds: [],
    })
    expect(result.allowed).toBe(true)
  })
})
