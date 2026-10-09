// Cổng cho CẦU NỐI chặng → unit: khai sai ở đây nghĩa là học viên bấm "Vào học" rồi rơi vào
// trang trắng, nên mọi mã trong bảng phải TỒN TẠI THẬT ở cả hai đầu.
import { describe, expect, it } from 'vitest'
import { SPEC_STAGE_UNITS, unitsOfStage, specHasLessons } from './stageUnits.js'
import { resolveStage } from '../learningPaths/pathStages.js'
import { PROGRAMMING_LEVELS } from '../curriculum.js'
import { getLessonsByUnit } from '../lessons.js'

const UNIT_IDS = new Set(PROGRAMMING_LEVELS.flatMap((l) => l.units.map((u) => u.id)))

describe('cầu nối chặng chuyên sâu → unit bài học', () => {
  it('mọi chặng khai trong bảng đều là chặng CÓ THẬT (hướng chuyên sâu HOẶC chặng riêng của lộ trình)', () => {
    for (const stageId of Object.keys(SPEC_STAGE_UNITS)) {
      expect(resolveStage(stageId), `chặng ${stageId} không có trong bản đồ hướng`).toBeDefined()
    }
  })

  it('mọi unit khai trong bảng đều có thật trong curriculum VÀ đã có bài học', () => {
    for (const [stageId, units] of Object.entries(SPEC_STAGE_UNITS)) {
      expect(units.length, `chặng ${stageId} khai bảng rỗng`).toBeGreaterThan(0)
      for (const u of units) {
        expect(UNIT_IDS.has(u), `unit ${u} (chặng ${stageId}) không có trong curriculum`).toBe(true)
        expect(getLessonsByUnit(u).length, `unit ${u} chưa có bài học nào`).toBeGreaterThan(0)
      }
    }
  })

  it('một unit không được gán cho hai chặng khác nhau', () => {
    const tatCa = Object.values(SPEC_STAGE_UNITS).flat()
    expect(new Set(tatCa).size).toBe(tatCa.length)
  })

  it('chặng chưa soạn bài trả về mảng rỗng, không đoán bừa', () => {
    // Không ghim cứng tên chặng thật làm ví dụ "chưa có bài" — nội dung được lấp dần theo
    // từng đợt (đã đổi ví dụ này 3 lần: security-s3 → game-s1, nay game cũng đã có bài),
    // nên một mã cố định sẽ hết đúng ngay khi đợt soạn bài kế tiếp merge. Khoá `${id}` không
    // tồn tại trong `SPEC_STAGE_UNITS` đã đủ canh đúng nhánh `?? []` — đây chính là hành vi
    // cần kiểm, độc lập với việc chặng nào đã/chưa có bài tại thời điểm chạy test.
    expect(unitsOfStage('khong-co-huong-nay-s1')).toEqual([])
  })

  it('specHasLessons đúng cho mọi hướng đã có bài', () => {
    // Tính đến 2026-09-21, cả 14 hướng chuyên sâu đều có ít nhất một chặng có bài thật
    // (game/embedded/desktop — ba hướng từng rỗng hoàn toàn — đã được lấp nốt). Vì vậy
    // nhánh "chưa có bài" của specHasLessons không còn ví dụ thật nào để canh ở mức hướng;
    // hành vi của nó (kiểm tiền tố `${specId}-` trong SPEC_STAGE_UNITS) vẫn được canh gián
    // tiếp qua các assertion true dưới đây — sai tiền tố sẽ làm chúng đỏ.
    expect(specHasLessons('web')).toBe(true)
    expect(specHasLessons('game')).toBe(true)
    expect(specHasLessons('embedded')).toBe(true)
    expect(specHasLessons('desktop')).toBe(true)
  })

  it('game-s1 tới game-s4 phủ đủ bốn module mỗi chặng bằng unit thật', () => {
    expect(unitsOfStage('game-s1')).toEqual(['p6-u242', 'p6-u243', 'p6-u244', 'p6-u245'])
    expect(unitsOfStage('game-s2')).toEqual(['p6-u246', 'p6-u247', 'p6-u248', 'p6-u249'])
    expect(unitsOfStage('game-s3')).toEqual(['p6-u250', 'p6-u251', 'p6-u252', 'p6-u253'])
    expect(unitsOfStage('game-s4')).toEqual(['p6-u254', 'p6-u255', 'p6-u256', 'p6-u257'])
  })

  it('mathforcode-s1 phủ đủ bốn module theo đúng thứ tự bằng bốn unit thật', () => {
    expect(unitsOfStage('mathforcode-s1')).toEqual(['p6-u134', 'p6-u135', 'p6-u136', 'p6-u137'])
  })

  it('mathforcode-s2 phủ đủ bốn module theo đúng thứ tự bằng bốn unit thật', () => {
    expect(unitsOfStage('mathforcode-s2')).toEqual(['p6-u138', 'p6-u139', 'p6-u140', 'p6-u141'])
  })

  it('algo-s1 phủ đủ bốn module theo đúng thứ tự bằng bốn unit thật', () => {
    expect(unitsOfStage('algo-s1')).toEqual(['p6-u142', 'p6-u143', 'p6-u144', 'p6-u145'])
  })

  it('algo-s2 phủ đủ bốn module theo đúng thứ tự bằng bốn unit thật', () => {
    expect(unitsOfStage('algo-s2')).toEqual(['p6-u162', 'p6-u163', 'p6-u164', 'p6-u165'])
  })

  it('algo-s3 phủ đủ bốn module theo đúng thứ tự bằng bốn unit thật', () => {
    expect(unitsOfStage('algo-s3')).toEqual(['p6-u226', 'p6-u227', 'p6-u228', 'p6-u229'])
  })

  it('algo-s4 phủ đủ bốn module theo đúng thứ tự bằng bốn unit thật', () => {
    expect(unitsOfStage('algo-s4')).toEqual(['p6-u230', 'p6-u231', 'p6-u232', 'p6-u233'])
  })

  it('systems-s1 phủ đủ bốn module theo đúng thứ tự bằng bốn unit thật', () => {
    expect(unitsOfStage('systems-s1')).toEqual(['p6-u146', 'p6-u147', 'p6-u148', 'p6-u149'])
  })

  it('systems-s2 phủ đủ bốn module theo đúng thứ tự bằng bốn unit thật', () => {
    expect(unitsOfStage('systems-s2')).toEqual(['p6-u150', 'p6-u151', 'p6-u152', 'p6-u153'])
  })

  it('devops-s1 phủ đủ bốn module theo đúng thứ tự bằng bốn unit thật', () => {
    expect(unitsOfStage('devops-s1')).toEqual(['p6-u154', 'p6-u155', 'p6-u156', 'p6-u157'])
  })

  it('devops-s2 phủ đủ bốn unit policy vận hành thật', () => {
    expect(unitsOfStage('devops-s2')).toEqual(['p6-u178', 'p6-u179', 'p6-u180', 'p6-u181'])
  })

  it('security-s1 phủ đủ bốn unit policy phòng thủ thật', () => {
    expect(unitsOfStage('security-s1')).toEqual(['p6-u182', 'p6-u183', 'p6-u184', 'p6-u185'])
  })

  it('architecture-s4 phủ đủ bốn unit enterprise có evidence', () => {
    expect(unitsOfStage('architecture-s4')).toEqual(['p6-u190', 'p6-u191', 'p6-u192', 'p6-u193'])
  })

  it('security-s2 phủ đủ bốn unit assessment và disclosure có trách nhiệm', () => {
    expect(unitsOfStage('security-s2')).toEqual(['p6-u186', 'p6-u187', 'p6-u188', 'p6-u189'])
  })

  it('mathforcode-s3 và s4 mỗi chặng đủ bốn unit, unit cũ giữ nguyên vị trí đầu', () => {
    expect(unitsOfStage('mathforcode-s3')).toEqual(['p6-u158', 'p6-u159', 'p6-u290', 'p6-u291'])
    expect(unitsOfStage('mathforcode-s4')).toEqual(['p6-u160', 'p6-u161', 'p6-u292', 'p6-u293'])
  })

  it('ai-s2 đến ai-s4 phủ đủ mười hai unit simulator thật', () => {
    expect(unitsOfStage('ai-s2')).toEqual(['p6-u166', 'p6-u167', 'p6-u168', 'p6-u169'])
    expect(unitsOfStage('ai-s3')).toEqual(['p6-u170', 'p6-u171', 'p6-u172', 'p6-u173'])
    expect(unitsOfStage('ai-s4')).toEqual(['p6-u174', 'p6-u175', 'p6-u176', 'p6-u177'])
  })
})
