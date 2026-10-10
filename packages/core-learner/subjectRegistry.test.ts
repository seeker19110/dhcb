import { describe, expect, it } from 'vitest'
import {
  getSubjectManifest,
  listSupportedSubjects,
  isValidSubjectLevel,
  SUPPORTED_SUBJECTS,
} from './subjectRegistry.js'
import { NotFoundError } from '@dhcb/core-errors/appError'
import { SubjectManifestSchema } from '@dhcb/core-contracts/subjectManifest'

describe('subjectRegistry', () => {
  // Registry KHÔNG parse lúc chạy (để zod khỏi lọt vào trang chủ của khách) — test này giữ nguyên
  // bảo đảm cũ: mọi manifest viết tay phải qua đúng schema (strict, regex id, độ dài, version).
  it.each(SUPPORTED_SUBJECTS.map((s) => [s.id, s] as const))(
    'manifest %s hợp lệ theo SubjectManifestSchema',
    (_id, manifest) => {
      expect(SubjectManifestSchema.parse(manifest)).toEqual(manifest)
    },
  )

  it('retrieves English manifest', () => {
    const english = getSubjectManifest('english')
    expect(english.id).toBe('english')
    expect(english.category).toBe('language')
    expect(english.taxonomyKind).toBe('cefr')
  })

  it('retrieves STEM manifests (Mathematics, Physics, Chemistry, Biology)', () => {
    const math = getSubjectManifest('mathematics')
    expect(math.category).toBe('stem')
    expect(math.evaluationModes).toContain('exact_formula')

    const physics = getSubjectManifest('physics')
    expect(physics.category).toBe('stem')

    const chemistry = getSubjectManifest('chemistry')
    expect(chemistry.category).toBe('stem')

    const biology = getSubjectManifest('biology')
    expect(biology.category).toBe('stem')
  })

  it('throws NotFoundError for unsupported subjects', () => {
    expect(() => getSubjectManifest('astronomy')).toThrow(NotFoundError)
  })

  it('lists subjects by category', () => {
    const stemSubjects = listSupportedSubjects('stem')
    expect(stemSubjects.length).toBe(5)
    expect(stemSubjects.map((s) => s.id)).toEqual([
      'mathematics',
      'physics',
      'chemistry',
      'biology',
      'programming',
    ])

    const languageSubjects = listSupportedSubjects('language')
    expect(languageSubjects.length).toBe(1)
    expect(languageSubjects[0]?.id).toBe('english')
  })

  it('validates subject level correctly', () => {
    expect(isValidSubjectLevel('english', 'B2')).toBe(true)
    expect(isValidSubjectLevel('english', 'grade_10')).toBe(false)
    expect(isValidSubjectLevel('mathematics', 'grade_12')).toBe(true)
    expect(isValidSubjectLevel('mathematics', 'B2')).toBe(false)
  })

  it('retrieves Programming manifest (thang P1–P6, dự án xuyên suốt)', () => {
    const programming = getSubjectManifest('programming')
    expect(programming.category).toBe('stem')
    expect(programming.taxonomyKind).toBe('topic_hierarchy')
    expect(programming.standardLevels).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'])
    expect(programming.questionTypes).toContain('project_milestone')
    expect(isValidSubjectLevel('programming', 'p1')).toBe(true)
    expect(isValidSubjectLevel('programming', 'grade_10')).toBe(false)
  })
})

describe('subjectRegistry — nhánh biên', () => {
  it('liệt kê toàn bộ môn khi không truyền category', () => {
    const all = listSupportedSubjects()
    expect(all.length).toBe(6)
    // Trả về BẢN SAO: sửa mảng nhận được không đụng tới registry gốc.
    all.pop()
    expect(listSupportedSubjects().length).toBe(6)
  })

  it('category không có môn nào → mảng rỗng', () => {
    expect(listSupportedSubjects('humanities')).toEqual([])
  })

  it('tra manifest không phân biệt hoa thường', () => {
    expect(getSubjectManifest('ENGLISH').id).toBe('english')
    expect(getSubjectManifest('Mathematics').id).toBe('mathematics')
  })

  it('isValidSubjectLevel trả false (không ném lỗi) khi môn học không tồn tại', () => {
    expect(isValidSubjectLevel('astronomy', 'B2')).toBe(false)
  })
})

// [Slice 04] Nền tảng không mặc định môn nào — thêm lại `isDefault: true` là dựng lại đúng thứ đặc tả bỏ.
describe('subjectRegistry — không môn nào là mặc định', () => {
  it('không manifest nào có isDefault: true', () => {
    for (const s of listSupportedSubjects()) expect(s.isDefault, s.id).not.toBe(true)
  })
})
