// Cổng ngữ nghĩa cho 4 unit BỔ SUNG của mathforcode S3/S4 (p6-u290…u293, 2026-10-09).
// Đặc tả: docs/specs/2026-10-09-mathforcode-s3-s4-bo-sung-unit.md.
//
// Cổng chạy python3 thật (lessonsPython.test.ts) chỉ chứng minh sampleSolution khớp test-case;
// nó không biết bài có dạy ĐÚNG topic còn thiếu, có ca biên fail-closed, hay có tự nhận mình là
// runtime ML/production không. File này khoá ba điều đó, cùng bất biến "không đổi id bài cũ".
import { describe, expect, it } from 'vitest'
import { getLesson } from './lessons.js'
import { PROGRAMMING_LEVELS } from './curriculum.js'
import { unitsOfStage } from './specializations/stageUnits.js'
import { P6U290_LESSONS } from './lessons/p6u290.js'
import { P6U291_LESSONS } from './lessons/p6u291.js'
import { P6U292_LESSONS } from './lessons/p6u292.js'
import { P6U293_LESSONS } from './lessons/p6u293.js'
import type { ProgrammingLesson } from './lessonTypes.js'

const NEW_UNITS = ['p6-u290', 'p6-u291', 'p6-u292', 'p6-u293'] as const
const lessons = [...P6U290_LESSONS, ...P6U291_LESSONS, ...P6U292_LESSONS, ...P6U293_LESSONS]

/** Chữ người học đọc ở đề bài: tiêu đề + khái niệm + đề Make. */
const textOf = (lesson: ProgrammingLesson): string =>
  `${lesson.title}\n${lesson.theory}\n${lesson.make.prompt}`.toLocaleLowerCase('vi')

/** Mọi đoạn code sẽ chạy thật trong sandbox hoặc cổng python3. */
const codeOf = (lesson: ProgrammingLesson): string =>
  [
    lesson.workedExample.code,
    lesson.predict.code,
    lesson.parsons.lines.join('\n'),
    lesson.make.starterCode,
    lesson.make.sampleSolution,
  ].join('\n')

describe('mathforcode S3/S4 bổ sung — mỗi module đủ 2 bài', () => {
  it('có bốn unit mới, tám bài Python, id đúng khuôn và mỗi bài có ca hiện lẫn ca ẩn', () => {
    expect(lessons.map((lesson) => lesson.id)).toEqual(
      NEW_UNITS.flatMap((unitId) => [`${unitId}-l1`, `${unitId}-l2`]),
    )
    for (const lesson of lessons) {
      expect(lesson.language).toBe('python')
      expect(lesson.make.testCases.some((testCase) => !testCase.hidden)).toBe(true)
      expect(lesson.make.testCases.some((testCase) => testCase.hidden)).toBe(true)
    }
  })

  it('S3 và S4 mỗi chặng 4 unit; unit cũ giữ nguyên ở đầu', () => {
    expect(unitsOfStage('mathforcode-s3')).toEqual(['p6-u158', 'p6-u159', 'p6-u290', 'p6-u291'])
    expect(unitsOfStage('mathforcode-s4')).toEqual(['p6-u160', 'p6-u161', 'p6-u292', 'p6-u293'])
  })

  it('tám bài cũ vẫn còn đúng id (tiến độ học viên gắn với id đó)', () => {
    for (const unitId of ['p6-u158', 'p6-u159', 'p6-u160', 'p6-u161']) {
      for (const suffix of ['l1', 'l2']) {
        expect(getLesson(`${unitId}-${suffix}`), `${unitId}-${suffix} bị mất`).toBeDefined()
      }
    }
  })

  it('bốn unit mới khai trong curriculum P6 ngay sau p6-u161, tiêu đề đúng chặng', () => {
    const p6 = PROGRAMMING_LEVELS.find((level) => level.id === 'p6')!
    const ids = p6.units.map((unit) => unit.id)
    const start = ids.indexOf('p6-u161')
    expect(ids.slice(start + 1, start + 5)).toEqual([...NEW_UNITS])
    const titleOf = (id: string) => p6.units.find((unit) => unit.id === id)!.title
    expect(titleOf('p6-u290')).toMatch(/^Toán cho Lập trình S3 — /)
    expect(titleOf('p6-u291')).toMatch(/^Toán cho Lập trình S3 — /)
    expect(titleOf('p6-u292')).toMatch(/^Toán cho Lập trình S4 — /)
    expect(titleOf('p6-u293')).toMatch(/^Toán cho Lập trình S4 — /)
  })
})

describe('mathforcode S3/S4 bổ sung — dạy đúng topic còn thiếu, có hợp đồng ca biên', () => {
  // Mỗi bài một bộ dấu hiệu: topic phải xuất hiện trong chữ người học đọc, và trạng thái biên
  // phải là một nhãn đầu ra có thật trong test-case — không chỉ được nhắc suông trong lý thuyết.
  const CONTRACT: Record<string, { topics: string[]; outputs: string[] }> = {
    'p6-u290-l1': {
      topics: ['v − 2(v·n)n', 'pháp tuyến', 'hướng di chuyển', 'va chạm'],
      outputs: ['reflect=skip-separating', 'tam-trung-nhau', 'collision=no'],
    },
    'p6-u290-l2': {
      topics: ['quy ước hàng-cột', 'ma trận xoay', 'co giãn', 'phản chiếu'],
      outputs: ['shape-khong-khop:2x3*2x2', 'shape=1x1'],
    },
    'p6-u291-l1': {
      topics: ['định thức', 'suy biến', 'bảo toàn luồng', 'cramer'],
      outputs: ['suy-bien', 'canh-bao-luong-am=2'],
    },
    'p6-u291-l2': {
      topics: ['chuỗi markov', 'quy ước hàng', 'trạng thái dừng', 'tuần hoàn'],
      outputs: ['hang-khong-tong-1:1', 'xac-suat-am:1', 'trang-thai-dung=yes'],
    },
    'p6-u292-l1': {
      topics: ['đạo hàm riêng', 'learning rate', 'bảng loss', 'phân kỳ'],
      outputs: ['->phan-ky@2', '->cham', '->hoi-tu', 'lr-tot-nhat=khong-co'],
    },
    'p6-u292-l2': {
      topics: ['không lồi', 'cực tiểu địa phương', 'điểm yên ngựa', 'cao nguyên'],
      outputs: ['ket-luan=diem-yen-ngua', 'ket-luan=cao-nguyen', 'phan-ky'],
    },
    'p6-u293-l1': {
      topics: ['lan truyền ngược', 'quy tắc chuỗi', 'sai phân', '1 − h²'],
      outputs: ['tong-ket=lech:w,b', 'tong-ket=khop-het'],
    },
    'p6-u293-l2': {
      topics: ['hill climbing', 'ngân sách', 'ngưỡng', 'cực trị cục bộ'],
      outputs: ['dung=het-ngan-sach', 'dung=cai-thien-nho', 'dung=cuc-bo'],
    },
  }

  it.each(lessons)('$id — topic và nhãn đầu ra biên đều có thật', (lesson) => {
    const contract = CONTRACT[lesson.id]
    expect(contract, `${lesson.id} chưa khai hợp đồng`).toBeDefined()
    const text = textOf(lesson)
    for (const topic of contract!.topics) {
      expect(text, `${lesson.id} thiếu topic "${topic}"`).toContain(topic.toLocaleLowerCase('vi'))
    }
    const expectedOutputs = lesson.make.testCases.map((testCase) => testCase.expected).join('\n')
    for (const output of contract!.outputs) {
      expect(expectedOutputs, `${lesson.id} thiếu ca biên "${output}"`).toContain(output)
    }
  })

  it.each(lessons)('$id — có ca ẩn fail-closed với nhãn input-khong-hop-le', (lesson) => {
    const failClosed = lesson.make.testCases.filter(
      (testCase) => testCase.hidden && testCase.expected === 'input-khong-hop-le',
    )
    expect(failClosed.length).toBeGreaterThanOrEqual(1)
    expect(lesson.make.prompt).toContain('`input-khong-hop-le`')
  })
})

describe('mathforcode S3/S4 bổ sung — không biến simulator thành runtime thật', () => {
  it.each(lessons)('$id — tự ghi MÔ PHỎNG và nói rõ không phải runtime thật', (lesson) => {
    expect(lesson.theory).toContain('MÔ PHỎNG')
    expect(lesson.make.prompt).toContain('MÔ PHỎNG')
    expect(lesson.theory.toLocaleLowerCase('vi')).toMatch(
      /không (?:phải|train)[^.]*?(?:thật|production)/,
    )
  })

  it.each(lessons)('$id — Python thuần, tất định: không numpy/torch/random/time', (lesson) => {
    expect(codeOf(lesson)).not.toMatch(
      /\bimport\s+(?:numpy|torch|random|time)\b|\bfrom\s+(?:numpy|torch|random|time)\b/,
    )
  })
})
