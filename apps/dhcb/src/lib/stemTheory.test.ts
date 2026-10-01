// Cổng cho bộ tách lý thuyết STEM (audit đồng nhất bố cục 2026-10-01).
//
// Chạy trên DỮ LIỆU THẬT của cả 4 môn: điều đáng canh là bộ tách KHÔNG làm mất/đổi một ký tự
// nào của nội dung người soạn, và nhận đúng tiêu đề mục trên dữ liệu đang có — dữ liệu giả
// không nói lên điều đó.
import { describe, expect, it } from 'vitest'
import { MATH_LESSONS } from '@dhcb/subject-math/lessons'
import { PHYSICS_LESSONS } from '@dhcb/subject-physics/lessons'
import { CHEM_LESSONS } from '@dhcb/subject-chemistry/lessons'
import { BIOLOGY_LESSONS } from '@dhcb/subject-biology/lessons'
import { laTieuDeLyThuyet, phanTichLyThuyet, tachChiSoDuoi, type InlinePart } from './stemTheory'

const MOI_BAI = [...MATH_LESSONS, ...PHYSICS_LESSONS, ...CHEM_LESSONS, ...BIOLOGY_LESSONS]

/** Ghép lại chuỗi từ các phần — để so với bản gốc. */
const ghep = (ps: InlinePart[]) =>
  ps.map((p) => (p.kind === 'text' ? p.text : `${p.base}_${p.sub}`)).join('')

describe('laTieuDeLyThuyet', () => {
  it('nhận dòng viết hoa kết thúc bằng hai chấm, kể cả có chú thích viết thường trong ngoặc', () => {
    expect(laTieuDeLyThuyet('ĐỊNH NGHĨA SỰ RƠI TỰ DO:')).toBe(true)
    expect(laTieuDeLyThuyet('GIA TỐC RƠI TỰ DO (g):')).toBe(true)
    expect(laTieuDeLyThuyet('QUÁ TRÌNH HÌNH THÀNH LOÀI (Speciation):')).toBe(true)
    expect(laTieuDeLyThuyet('SACCHAROSE (C₁₂H₂₂O₁₁ = 342):')).toBe(true)
  })

  it('KHÔNG nhận câu thường, mục danh sách, hay dòng có chữ thường ngoài ngoặc', () => {
    expect(laTieuDeLyThuyet('Lý thuyết:')).toBe(false)
    expect(laTieuDeLyThuyet('— GHÉP SONG SONG (hai lò xo):')).toBe(false)
    expect(laTieuDeLyThuyet('1. NGUYÊN LÝ CHUNG:')).toBe(false)
    expect(laTieuDeLyThuyet('PHẢN ỨNG CỦA NaOH:')).toBe(false)
    expect(laTieuDeLyThuyet('ĐỊNH NGHĨA: chuyển động có vận tốc đổi')).toBe(false)
    expect(laTieuDeLyThuyet('AB:')).toBe(false)
  })
})

describe('phanTichLyThuyet', () => {
  it('tách tiêu đề và đoạn; giữ xuống dòng của các mục trong đoạn', () => {
    const khoi = phanTichLyThuyet(
      'ĐỊNH NGHĨA:\n— Ý một.\n— Ý hai.\n\nCÔNG THỨC (g):\n1. v = g.t\n2. h = 0,5.g.t²',
    )
    expect(khoi).toEqual([
      { kind: 'heading', text: 'ĐỊNH NGHĨA' },
      { kind: 'para', text: '— Ý một.\n— Ý hai.' },
      { kind: 'heading', text: 'CÔNG THỨC (g)' },
      { kind: 'para', text: '1. v = g.t\n2. h = 0,5.g.t²' },
    ])
  })

  it('chuỗi rỗng → không khối nào', () => {
    expect(phanTichLyThuyet('')).toEqual([])
  })

  it(`DỮ LIỆU THẬT (${MOI_BAI.length} bài): không mất một ký tự chữ nào của lý thuyết`, () => {
    for (const bai of MOI_BAI) {
      const khoi = phanTichLyThuyet(bai.theory)
      const conLai = khoi.map((k) => (k.kind === 'heading' ? `${k.text}:` : k.text)).join('\n')
      // So phần không phải khoảng trắng: bộ tách chỉ được bỏ dòng trống và khoảng trắng đầu/cuối
      // dòng tiêu đề, không được bỏ/đổi chữ.
      expect(conLai.replace(/\s+/gu, ''), bai.id).toBe(bai.theory.replace(/\s+/gu, ''))
    }
  })

  it('DỮ LIỆU THẬT: nhận ra tiêu đề mục ở cả ba môn Lý · Hoá · Sinh (con số đo 2026-10-01)', () => {
    const dem = (ds: readonly { theory: string }[]) =>
      ds.reduce(
        (n, b) => n + phanTichLyThuyet(b.theory).filter((k) => k.kind === 'heading').length,
        0,
      )
    // Sàn chứ không phải số khít: nội dung được sửa thường xuyên. Tụt dưới sàn nghĩa là luật
    // nhận tiêu đề đã hỏng (hoặc nội dung đổi khuôn) — phải nhìn lại, không hạ sàn cho qua.
    expect(dem(PHYSICS_LESSONS)).toBeGreaterThanOrEqual(200)
    expect(dem(CHEM_LESSONS)).toBeGreaterThanOrEqual(120)
    expect(dem(BIOLOGY_LESSONS)).toBeGreaterThanOrEqual(190)
  })

  it('DỮ LIỆU THẬT: không "tiêu đề" nào là một câu dài (luật nhận diện không nuốt đoạn văn)', () => {
    for (const bai of MOI_BAI) {
      for (const k of phanTichLyThuyet(bai.theory)) {
        if (k.kind === 'heading') expect(k.text.length, `${bai.id}: ${k.text}`).toBeLessThan(160)
      }
    }
  })
})

describe('tachChiSoDuoi', () => {
  it('tách ký hiệu chỉ số dưới, kể cả chữ có dấu và °', () => {
    expect(tachChiSoDuoi('v_tb = s / t')).toEqual([
      { kind: 'sub', base: 'v', sub: 'tb' },
      { kind: 'text', text: ' = s / t' },
    ])
    expect(tachChiSoDuoi('W_đ + E°_pin')).toEqual([
      { kind: 'sub', base: 'W', sub: 'đ' },
      // `E°_pin`: gốc của chỉ số là `°` (ký tự ngay trước `_`), chữ E đứng trước nó → E°ₚᵢₙ.
      { kind: 'text', text: ' + E' },
      { kind: 'sub', base: '°', sub: 'pin' },
    ])
  })

  it('dấu _ đứng đầu từ (ký hiệu hạt nhân) và chuỗi không có _ giữ nguyên', () => {
    expect(tachChiSoDuoi('hạt _Z^A X')).toEqual([{ kind: 'text', text: 'hạt _Z^A X' }])
    expect(tachChiSoDuoi('không có gì')).toEqual([{ kind: 'text', text: 'không có gì' }])
    expect(tachChiSoDuoi('')).toEqual([])
  })

  it('DỮ LIỆU THẬT: ghép lại đúng nguyên văn lý thuyết của mọi bài', () => {
    for (const bai of MOI_BAI) expect(ghep(tachChiSoDuoi(bai.theory)), bai.id).toBe(bai.theory)
  })
})
