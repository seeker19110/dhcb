// packages/core-ai/stemQuestionBank.test.ts — ngân hàng đề bảng nháp STEM dựng từ bài học THẬT
// (changelog 0551). Canh ba điều: (1) không bịa — mọi đề/đáp án trùng nguyên văn bài học;
// (2) máy chấm được — đáp án chuẩn của chính câu đó được `gradeAnswer` chấm đúng; (3) bản công
// khai không lộ đáp án.
import { describe, expect, it } from 'vitest'
import { gradeAnswer } from '@dhcb/core-grading/index'
import { UNITS } from '@dhcb/core-grading/units'
import type { AnswerSpec } from '@dhcb/core-grading/types'
import { StemBankQuestionPublicSchema } from '@dhcb/core-contracts/stemScratchpad'
import { MATH_LESSONS } from '@dhcb/subject-math/lessons'
import { PHYSICS_LESSONS } from '@dhcb/subject-physics/lessons'
import { CHEM_LESSONS } from '@dhcb/subject-chemistry/lessons'
import {
  buildStemQuestionBank,
  filterStemQuestions,
  getStemQuestionById,
  stemQuestionId,
  toPublicStemQuestion,
  type StemLessonSource,
} from './stemQuestionBank.js'

const NGUON = [
  { subject: 'math' as const, lessons: MATH_LESSONS },
  { subject: 'physics' as const, lessons: PHYSICS_LESSONS },
  { subject: 'chemistry' as const, lessons: CHEM_LESSONS },
]
const BANK = buildStemQuestionBank(NGUON)

/** Giá trị SI → con số ở đơn vị hiển thị (ngược với `toSI`): 0,8 với '%' → 80. */
function tuSI(value: number, unit: string): number {
  const def = UNITS[unit]
  if (!def) throw new Error(`đơn vị lạ: ${unit}`)
  return (value - (def.offset ?? 0)) / def.factor
}

/** Đáp án chuẩn dạng chữ của một AnswerSpec — đúng cách một học sinh sẽ gõ. */
function dapAnChuan(spec: AnswerSpec): string | null {
  switch (spec.kind) {
    case 'numeric':
      return spec.unit ? `${tuSI(spec.value, spec.unit)} ${spec.unit}` : `${spec.value}`
    case 'fraction':
      return `${spec.num}/${spec.den}`
    case 'chemFormula':
      return spec.formula
    default:
      return null
  }
}

describe('Ngân hàng đề STEM (dựng từ bài học thật)', () => {
  it('có câu cho cả ba môn của bảng nháp', () => {
    for (const mon of ['math', 'physics', 'chemistry'] as const) {
      expect(filterStemQuestions(BANK, { subject: mon }).length).toBeGreaterThan(20)
    }
  })

  it('KHÔNG BỊA: mọi đề, đáp án, lời giải trùng NGUYÊN VĂN câu tự kiểm tra của bài học', () => {
    const theoId = new Map<string, StemLessonSource>()
    for (const { lessons } of NGUON) for (const l of lessons) theoId.set(l.id, l)
    for (const q of BANK) {
      const lesson = theoId.get(q.lessonId)
      expect(lesson, q.id).toBeDefined()
      const index = Number(q.id.slice(q.lessonId.length + 2)) - 1
      expect(q.id).toBe(stemQuestionId(q.lessonId, index))
      const goc = lesson?.checkQuestions[index]
      expect(goc?.prompt).toBe(q.problemStatement)
      expect(goc?.answer).toEqual(q.answer)
      expect(goc?.explain).toBe(q.explain)
      // Bảng thứ nguyên biến (0560) lấy nguyên từ bài học — không dựng ở nơi khác.
      expect(q.variables).toEqual(goc?.variables)
      expect(q.reviewStatus).toBe(lesson?.reviewStatus)
    }
  })

  it('không có dữ liệu mẫu cũ (S_{n} = …, "Câu hỏi về …")', () => {
    for (const q of BANK) {
      expect(q.problemStatement).not.toMatch(/^Câu hỏi về /)
      expect(q.problemStatement).not.toMatch(/P_\{\d+\}/)
    }
  })

  it('bỏ trắc nghiệm và câu đúng/sai mã hoá thành số', () => {
    for (const q of BANK) {
      expect(q.answer.kind).not.toBe('choice')
      expect(q.problemStatement).not.toMatch(/nhập\s+\d+\s+nếu/i)
    }
    const nguon: StemLessonSource = {
      id: 'toan10-c1-b1',
      grade: '10',
      chapterTitle: 'C',
      title: 'T',
      track: 'core',
      reviewStatus: 'draft',
      checkQuestions: [
        { prompt: 'Chọn A hay B?', answer: { kind: 'choice', correctIds: ['a'] }, explain: 'e' },
        {
          prompt: 'Đúng hay sai? Nhập 1 nếu ĐÚNG.',
          answer: { kind: 'numeric', value: 1 },
          explain: 'e',
        },
        { prompt: 'Tính 2 + 3.', answer: { kind: 'numeric', value: 5 }, explain: 'e' },
      ],
    }
    const nho = buildStemQuestionBank([{ subject: 'math', lessons: [nguon] }])
    expect(nho.map((q) => q.id)).toEqual(['toan10-c1-b1-q3'])
  })

  it('chỉ nhận bài lớp 10–12: bài Toán THCS không lọt vào bảng nháp của học sinh cấp 3', () => {
    const cau = [
      { prompt: 'Tính 2 + 3.', answer: { kind: 'numeric', value: 5 }, explain: 'e' },
    ] as const
    const bai = (id: string, grade: string): StemLessonSource => ({
      id,
      grade,
      chapterTitle: 'C',
      title: 'T',
      track: 'core',
      reviewStatus: 'draft',
      checkQuestions: cau,
    })
    const nho = buildStemQuestionBank([
      { subject: 'math', lessons: [bai('toan6-c1-b1', '6'), bai('toan10-c1-b1', '10')] },
    ])
    expect(nho.map((q) => q.id)).toEqual(['toan10-c1-b1-q1'])
    // Và trên dữ liệu thật: không câu nào của ngân hàng thuộc lớp ngoài 10–12.
    expect(BANK.every((q) => ['10', '11', '12'].includes(q.grade))).toBe(true)
  })

  it('MÁY CHẤM ĐƯỢC: đáp án chuẩn của từng câu được gradeAnswer chấm đúng', () => {
    let soCauDaKiem = 0
    for (const q of BANK) {
      const chuan = dapAnChuan(q.answer)
      if (chuan === null) continue
      soCauDaKiem++
      expect(gradeAnswer(chuan, q.answer).correct, `${q.id}: "${chuan}"`).toBe(true)
    }
    expect(soCauDaKiem).toBe(BANK.length)
  })

  it('cờ needsUnit/expectsFraction khớp đáp án', () => {
    for (const q of BANK) {
      if (q.needsUnit) {
        expect(q.answer.kind).toBe('numeric')
        const chiSo =
          q.answer.kind === 'numeric' ? `${tuSI(q.answer.value, q.answer.unit ?? '')}` : ''
        expect(gradeAnswer(chiSo, q.answer).reason, q.id).toBe('MISSING_UNIT')
      }
      expect(q.expectsFraction).toBe(q.answer.kind === 'fraction')
    }
  })

  it('bản công khai KHÔNG có đáp án hay lời giải và đúng hợp đồng .strict()', () => {
    for (const q of BANK) {
      const pub = toPublicStemQuestion(q)
      expect(StemBankQuestionPublicSchema.safeParse(pub).success).toBe(true)
      expect(pub).not.toHaveProperty('answer')
      expect(pub).not.toHaveProperty('explain')
      // Danh sách đề không cần bảng biến (0560) — chỉ phiên đã mở mới mang bảng.
      expect(pub).not.toHaveProperty('variables')
    }
  })

  it('lọc theo môn/lớp/nhánh/giới hạn và tra theo id', () => {
    const toan12 = filterStemQuestions(BANK, { subject: 'math', grade: '12' })
    expect(toan12.length).toBeGreaterThan(0)
    expect(toan12.every((q) => q.subject === 'math' && q.grade === '12')).toBe(true)
    const nangCao = filterStemQuestions(BANK, { track: 'advanced' })
    expect(nangCao.every((q) => q.track === 'advanced')).toBe(true)
    expect(filterStemQuestions(BANK, { limit: 5 })).toHaveLength(5)
    expect(filterStemQuestions(BANK, {})).toHaveLength(BANK.length)
    const dau = BANK[0]
    expect(dau && getStemQuestionById(BANK, dau.id)).toEqual(dau)
    expect(getStemQuestionById(BANK, 'khong-co')).toBeUndefined()
  })

  it('id không trùng', () => {
    const ids = BANK.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
