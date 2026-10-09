// Kiểm bất biến của khung giáo trình môn Lập trình — chặn lỗi dữ liệu khi soạn thêm unit.
import { describe, expect, it } from 'vitest'
import {
  PROGRAMMING_LEVELS,
  PROGRAMMING_LEVEL_IDS,
  getProgrammingLevel,
  getLevelIdOfLesson,
} from './curriculum.js'

describe('programming curriculum', () => {
  it('có đủ 6 bậc P1–P6 đúng thứ tự', () => {
    expect(PROGRAMMING_LEVELS.map((l) => l.id)).toEqual(PROGRAMMING_LEVEL_IDS)
  })

  it('id unit duy nhất toàn giáo trình và đúng tiền tố bậc', () => {
    const seen = new Set<string>()
    for (const level of PROGRAMMING_LEVELS) {
      for (const unit of level.units) {
        expect(unit.id.startsWith(`${level.id}-u`)).toBe(true)
        expect(seen.has(unit.id)).toBe(false)
        seen.add(unit.id)
      }
    }
  })

  it('mỗi bậc P1–P5 đều có bước dự án trục và unit milestone cuối bậc', () => {
    for (const level of PROGRAMMING_LEVELS.filter((l) => l.id !== 'p6')) {
      const projectSteps = level.units.filter((u) => u.projectStep)
      expect(projectSteps.length).toBeGreaterThan(0)
      const last = level.units[level.units.length - 1]!
      expect(last.projectStep).toBeTruthy()
      expect(level.projectMilestone.length).toBeGreaterThan(0)
    }
  })

  it('getProgrammingLevel không phân biệt hoa thường và trả undefined khi id lạ', () => {
    expect(getProgrammingLevel('P1')?.name).toBe('Nhập môn tư duy')
    expect(getProgrammingLevel('p9')).toBeUndefined()
  })

  it('getLevelIdOfLesson suy đúng bậc từ mã bài — mọi bậc, không riêng p1', () => {
    expect(getLevelIdOfLesson('p1-u4-l1')).toBe('p1')
    expect(getLevelIdOfLesson('p3-u9-l1')).toBe('p3')
    expect(getLevelIdOfLesson('p6-u1-l1')).toBe('p6')
    // Hoa thường không ảnh hưởng — khớp cách getProgrammingLevel cư xử.
    expect(getLevelIdOfLesson('P5-U2-L1')).toBe('p5')
  })

  it('getLevelIdOfLesson trả undefined với mã lạ, không rơi về p1', () => {
    // Đây là bất biến chặn lỗi V2 tái phát: sai mã thì phải nói KHÔNG BIẾT,
    // tuyệt đối không đoán bừa một bậc nào đó.
    expect(getLevelIdOfLesson('p9-u1-l1')).toBeUndefined()
    expect(getLevelIdOfLesson('khong-phai-ma-bai')).toBeUndefined()
    expect(getLevelIdOfLesson('')).toBeUndefined()
    // Bước dự án T2/T3 (2026-10-09) không phải mã bài học — không suy ra bậc.
    expect(getLevelIdOfLesson('t2-p3-s1')).toBeUndefined()
    expect(getLevelIdOfLesson('t3-p1-s1')).toBeUndefined()
  })

  it('mọi bài đã soạn đều suy được về bậc có thật', () => {
    for (const level of PROGRAMMING_LEVELS) {
      for (const unit of level.units) {
        expect(getLevelIdOfLesson(`${unit.id}-l1`)).toBe(level.id)
      }
    }
  })
})
