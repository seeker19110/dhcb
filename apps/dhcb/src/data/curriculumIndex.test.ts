import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildCurriculumIndex, toCircleSummary } from './curriculumIndex'
import type { Circle, CircleSummary } from './curriculumTypes'

const DATA_DIR = path.resolve(__dirname, '../../public/data')
const readJson = <T>(file: string): T =>
  JSON.parse(readFileSync(path.join(DATA_DIR, file), 'utf8')) as T

describe('toCircleSummary', () => {
  const full: Circle = {
    id: 'family',
    titleVi: 'Gia đình',
    titleEn: 'Family',
    emoji: '👪',
    words: [{ word: 'mother', pos: 'noun', vi: 'mẹ', ex_en: 'My mother.', ex_vi: 'Mẹ tôi.' }],
    sentences: [{ en: 'I love my mother.', vi: 'Tôi yêu mẹ.' }],
  }

  it('chỉ giữ tên vòng + danh sách từ, bỏ nghĩa/câu ví dụ/câu thông dụng', () => {
    expect(toCircleSummary(full)).toEqual({
      id: 'family',
      titleVi: 'Gia đình',
      titleEn: 'Family',
      emoji: '👪',
      words: [{ word: 'mother' }],
    })
  })

  it('giữ cờ notForKids khi bật, không sinh khoá thừa khi tắt', () => {
    expect(toCircleSummary({ ...full, notForKids: true }).notForKids).toBe(true)
    expect('notForKids' in toCircleSummary({ ...full, notForKids: false })).toBe(false)
  })
})

describe('public/data/curriculum-index.json', () => {
  it('khớp đúng curriculum.json (quên sinh lại → chạy `npm run gen:curriculum-index`)', () => {
    const full = readJson<Circle[]>('curriculum.json')
    const index = readJson<CircleSummary[]>('curriculum-index.json')
    // So độ dài trước để báo lỗi gọn, rồi mới so toàn bộ.
    expect(index.length, 'Chỉ mục lệch curriculum.json — chạy `npm run gen:curriculum-index`').toBe(
      full.length,
    )
    expect(index, 'Chỉ mục lệch curriculum.json — chạy `npm run gen:curriculum-index`').toEqual(
      buildCurriculumIndex(full),
    )
  })
})
