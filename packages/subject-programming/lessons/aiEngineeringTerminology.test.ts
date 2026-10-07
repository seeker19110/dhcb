// Canh hai lỗi nội dung cũ mà phiếu thí điểm AI Engineering phát hiện (FR-3a của
// docs/specs/2026-10-05-ai-engineering-from-scratch-dhcb.md, chi tiết ở
// docs/research/2026-10-05-ai-engineering-pilot-selection.md) — phải sửa TRƯỚC khi reuse/gắn hoạt họa:
//  1. Convolution là TƯƠNG ĐƯƠNG tịnh tiến (equivariance), không phải "bất biến tịnh tiến".
//     Các con số minh hoạ trong lý thuyết cv1-u2-l1 được TÍNH LẠI ở đây, không tin chữ.
//  2. llmagent-u1-l1 cắt từ theo độ dài cố định — không phải BPE, tiêu đề không được hứa BPE.
// Không đổi ID, Make hay ca chấm của bài nào (giữ tương thích tiến độ đã lưu).
import { describe, expect, it } from 'vitest'
import { getLesson } from '../lessons.js'
import type { ProgrammingLesson } from '../lessonTypes.js'

function lessonOf(id: string): ProgrammingLesson {
  const lesson = getLesson(id)
  if (!lesson) throw new Error(`Không tìm thấy bài ${id}`)
  return lesson
}

/** Mọi chữ người học đọc được của một bài (tiêu đề, hook, lý thuyết, thẻ SRS). */
function readableText(lesson: ProgrammingLesson): string {
  const cards = (lesson.srsCards ?? []).flatMap((c) => [c.hoi, c.dap])
  return [lesson.title, lesson.hook, lesson.theory, ...cards].join('\n')
}

// Kernel dò cạnh dọc của bài cv1-u2-l1, cùng công thức out[i][j] = Σ anh[i+u][j+v]·kernel[u][v].
const KERNEL = [
  [-1, 0, 1],
  [-1, 0, 1],
  [-1, 0, 1],
]

/** Hàng đặc trưng đầu tiên khi mọi hàng ảnh 5x5 giống nhau (bước 1, không padding). */
function featureRow(imageRow: number[]): string {
  const image = Array.from({ length: 5 }, () => imageRow)
  const out: number[] = []
  for (let j = 0; j < 3; j += 1) {
    let sum = 0
    for (let u = 0; u < 3; u += 1) {
      for (let v = 0; v < 3; v += 1) sum += image[u]![j + v]! * KERNEL[u]![v]!
    }
    out.push(sum)
  }
  return out.join(' ')
}

const CONV_LESSONS = ['cv1-u2-l1', 'cv2-u1-l4', 'mlds-u3-l1'] as const

describe('Thuật ngữ convolution: tương đương tịnh tiến, không phải bất biến', () => {
  it.each(CONV_LESSONS)('%s không gọi convolution là "bất biến tịnh tiến"', (id) => {
    const text = readableText(lessonOf(id)).toLowerCase()
    expect(text).not.toContain('bất biến tịnh tiến')
    expect(text).toContain('tương đương tịnh tiến')
  })

  it('cv1-u2-l1 tách rõ equivariance với invariance và nêu tên tiếng Anh', () => {
    const theory = lessonOf('cv1-u2-l1').theory
    expect(theory).toContain('translation equivariance')
    expect(theory).toContain('invariance')
    expect(theory).toContain('cross-correlation')
  })

  it('ví dụ dời cạnh trong lý thuyết cv1-u2-l1 khớp phép tính thật', () => {
    const theory = lessonOf('cv1-u2-l1').theory
    const goc = featureRow([0, 0, 9, 9, 9])
    const dichPhai = featureRow([0, 0, 0, 9, 9])
    const dichTrai = featureRow([0, 9, 9, 9, 9])
    // Ba con số này được tính, không chép tay: lý thuyết phải in đúng chúng.
    expect([goc, dichPhai, dichTrai]).toEqual(['27 27 0', '0 27 27', '27 0 0'])
    for (const row of [goc, dichPhai, dichTrai]) expect(theory).toContain(`"${row}"`)
    expect(theory).toContain('(0,0,0,9,9)')
    expect(theory).toContain('(0,9,9,9,9)')
  })

  it('cv1-u2-l1 giữ 2–4 thẻ SRS và thẻ giới hạn viền dùng đúng con số', () => {
    const cards = lessonOf('cv1-u2-l1').srsCards ?? []
    expect(cards.length).toBeGreaterThanOrEqual(2)
    expect(cards.length).toBeLessThanOrEqual(4)
    const vien = cards.find((c) => c.hoi.includes('27 0 0'))
    expect(vien?.hoi).toContain(featureRow([0, 0, 9, 9, 9]))
    expect(vien?.dap).toContain('padding')
  })

  it('Make của cv1-u2-l1 không đổi (ca chấm cũ giữ nguyên để tiến độ đã lưu còn đúng)', () => {
    const make = lessonOf('cv1-u2-l1').make
    expect(make.testCases.map((c) => c.expected)).toEqual([
      '27 27 0\n27 27 0\n27 27 0',
      '0 0 0\n0 0 0\n0 0 0',
      '0 -27 -27\n0 -27 -27\n0 -27 -27',
    ])
  })
})

describe('llmagent-u1-l1 không hứa BPE khi code chỉ cắt theo độ dài', () => {
  const lesson = lessonOf('llmagent-u1-l1')

  it('tiêu đề không nhắc BPE và nói rõ luật cố định', () => {
    expect(lesson.title).not.toMatch(/BPE/i)
    expect(lesson.title).toContain('luật cố định')
  })

  it('lý thuyết nói thẳng bài không cài BPE và nêu khác biệt cốt lõi', () => {
    expect(lesson.theory).toContain('KHÔNG cài BPE')
    expect(lesson.theory).toContain('ĐỘ DÀI')
  })

  it('lời giải mẫu đúng là luật cắt theo độ dài, không có vòng gộp cặp', () => {
    const code = lesson.make.sampleSolution
    expect(code).toContain('len(tu) > 5')
    expect(code).not.toMatch(/merge|gop|pair/i)
  })
})
