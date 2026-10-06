import { describe, it, expect } from 'vitest'
import { pickStemContinue, lopHocGanNhat, sapLop, type StemContinueProgress } from './stemContinue'

const bai = (id: string) => ({ id, title: `Bài ${id}` })
const LOP = new Map([
  ['10', [bai('a1'), bai('a2')]],
  ['11', [bai('b1'), bai('b2')]],
  ['12', [bai('c1')]],
])
type Dong = { status: 'in_progress' | 'completed'; updatedAt: string }
const row = (status: Dong['status'], updatedAt: string): Dong => ({ status, updatedAt })
const tienDo = (e: [string, Dong][]): StemContinueProgress => new Map(e)
const idBai = (r: ReturnType<typeof pickStemContinue>) => (r.kind === 'next' ? r.lesson.id : '')

describe('pickStemContinue', () => {
  it('chưa học gì (map rỗng) → bài đầu của lớp thấp nhất, fresh', () => {
    const r = pickStemContinue(LOP, new Map())
    expect(r).toMatchObject({ kind: 'next', grade: '10', fresh: true, resuming: false })
    expect(idBai(r)).toBe('a1')
  })

  it('tiến độ null/undefined được xử như rỗng, không ném lỗi', () => {
    expect(pickStemContinue(LOP, null)).toMatchObject({ kind: 'next', grade: '10' })
    expect(pickStemContinue(LOP, undefined)).toMatchObject({ kind: 'next', grade: '10' })
  })

  it('lớp mặc định là lớp học gần nhất, không phải lớp thấp nhất', () => {
    const p = tienDo([
      ['a1', row('completed', '2026-10-01T00:00:00Z')],
      ['b1', row('completed', '2026-10-03T00:00:00Z')],
    ])
    const r = pickStemContinue(LOP, p)
    expect(r).toMatchObject({ kind: 'next', grade: '11', fresh: false })
    expect(idBai(r)).toBe('b2')
  })

  it('bài dở được đánh dấu resuming', () => {
    const p = tienDo([['a1', row('in_progress', '2026-10-01T00:00:00Z')]])
    const r = pickStemContinue(LOP, p)
    expect(r).toMatchObject({ kind: 'next', resuming: true })
    expect(idBai(r)).toBe('a1')
  })

  it('hết bài trong lớp gần nhất → sang lớp cao hơn kế tiếp', () => {
    const p = tienDo([
      ['a1', row('completed', '2026-10-01T00:00:00Z')],
      ['a2', row('completed', '2026-10-02T00:00:00Z')],
    ])
    expect(pickStemContinue(LOP, p)).toMatchObject({ kind: 'next', grade: '11' })
  })

  it('học gần nhất ở lớp cao nhất đã xong → vòng về lớp thấp còn sót', () => {
    const p = tienDo([
      ['c1', row('completed', '2026-10-05T00:00:00Z')],
      ['a1', row('completed', '2026-10-01T00:00:00Z')],
    ])
    const r = pickStemContinue(LOP, p)
    expect(r).toMatchObject({ kind: 'next', grade: '10' })
    expect(idBai(r)).toBe('a2')
  })

  it('học xong hết → all-done', () => {
    const p = tienDo(
      ['a1', 'a2', 'b1', 'b2', 'c1'].map((id): [string, Dong] => [
        id,
        row('completed', '2026-10-01T00:00:00Z'),
      ]),
    )
    expect(pickStemContinue(LOP, p)).toEqual({ kind: 'all-done' })
  })

  it('môn không có bài (hoặc lớp rỗng) → empty', () => {
    expect(pickStemContinue(new Map(), new Map())).toEqual({ kind: 'empty' })
    expect(pickStemContinue(new Map([['10', []]]), null)).toEqual({ kind: 'empty' })
  })

  it('bằng chứng của bài không thuộc lớp chuẩn nào (vd HSG) bị bỏ qua', () => {
    const p = tienDo([['hsg-1', row('completed', '2026-10-09T00:00:00Z')]])
    expect(pickStemContinue(LOP, p)).toMatchObject({ kind: 'next', grade: '10', fresh: true })
  })

  it('updatedAt hỏng không làm gãy việc chọn lớp', () => {
    const p = tienDo([
      ['a1', row('in_progress', 'không-phải-ngày')],
      ['b1', row('in_progress', '2026-10-01T00:00:00Z')],
    ])
    expect(lopHocGanNhat(LOP, p)).toBe('11')
  })
})

describe('sapLop', () => {
  it('sắp theo số, không theo chữ', () => {
    expect(sapLop(['12', '9', '10'])).toEqual(['9', '10', '12'])
  })
})
