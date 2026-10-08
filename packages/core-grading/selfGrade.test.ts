// Test trực tiếp cổng tự chấm `selfGrade.ts`. Trước đây file này chỉ được chạy GIÁN TIẾP qua test
// nội dung bài học (bài nào cũng khai đúng nên nhánh báo lỗi chưa từng được đi qua) — tức là cổng
// chưa bao giờ được chứng minh là ĐỎ được. Các ca dưới dựng cố ý bài khai sai để chứng minh điều đó.
import { describe, expect, it } from 'vitest'
import {
  cacSoTrongLoiGiai,
  chuoiHocSinhGoDung,
  moTaLoiTuCham,
  soHienThi,
  timLoiTuCham,
  type BaiCoCauHoi,
} from './selfGrade.js'

describe('soHienThi — đổi value (SI) về đơn vị hiển thị', () => {
  it('không có đơn vị hoặc đơn vị lạ → giữ nguyên con số', () => {
    expect(soHienThi(42, undefined)).toBe(42)
    expect(soHienThi(42, 'đơn-vị-không-có')).toBe(42)
  })

  it('đơn vị có hệ số: 0,0866 m hiển thị là 8,66 cm', () => {
    expect(soHienThi(0.0866, 'cm')).toBeCloseTo(8.66, 10)
  })

  it('đơn vị có độ lệch: 300,15 K hiển thị là 27 °C; 273,15 K là đúng 0 (không phải NaN)', () => {
    expect(soHienThi(300.15, '°C')).toBeCloseTo(27, 10)
    expect(soHienThi(273.15, '°C')).toBe(0)
  })
})

describe('chuoiHocSinhGoDung — chuỗi học sinh làm đúng sẽ gõ', () => {
  it('numeric không đơn vị → chính con số', () => {
    expect(chuoiHocSinhGoDung({ kind: 'numeric', value: 0 })).toBe('0')
  })

  it('numeric có đơn vị → số hiển thị kèm đơn vị', () => {
    expect(chuoiHocSinhGoDung({ kind: 'numeric', value: 1000, unit: 'km' })).toBe('1 km')
  })

  it('các dạng còn lại', () => {
    expect(chuoiHocSinhGoDung({ kind: 'fraction', num: 3, den: 4 })).toBe('3/4')
    expect(chuoiHocSinhGoDung({ kind: 'expression', expr: '2*x + 1' })).toBe('2*x + 1')
    expect(chuoiHocSinhGoDung({ kind: 'choice', correctIds: ['a', 'c'] })).toBe('a,c')
    expect(chuoiHocSinhGoDung({ kind: 'chemFormula', formula: 'H2O' })).toBe('H2O')
    expect(
      chuoiHocSinhGoDung({ kind: 'chemEquation', reactants: ['H2', 'O2'], products: ['H2O'] }),
    ).toBe('H2 + O2 -> H2O')
  })
})

describe('cacSoTrongLoiGiai — đọc số trong lời giải viết kiểu Việt', () => {
  it('lời giải rỗng hoặc thuần chữ → không có số nào', () => {
    expect(cacSoTrongLoiGiai('')).toEqual([])
    expect(cacSoTrongLoiGiai('Vì vật đứng yên nên hợp lực bằng không.')).toEqual([])
  })

  it('dấu phẩy thập phân và dấu trừ Unicode', () => {
    expect(cacSoTrongLoiGiai('d = 8,66 cm')).toEqual([8.66])
    expect(cacSoTrongLoiGiai('t = −5 °C')).toEqual([-5])
    expect(cacSoTrongLoiGiai('Δ = –3')).toEqual([-3])
  })

  it('luỹ thừa mũ trên ghép thành một số: 3 × 10⁸ và 1,6 · 10⁻¹⁹', () => {
    expect(cacSoTrongLoiGiai('c = 3 × 10⁸ m/s')).toEqual([3e8])
    const so = cacSoTrongLoiGiai('e = 1,6 · 10⁻¹⁹ C')
    expect(so).toHaveLength(1)
    expect(so[0]).toBeCloseTo(1.6e-19, 30)
  })

  it('số mũ chứa ¹ ² ³ (khối Latin-1, ngoài dải ⁴–⁹) vẫn đọc đúng — hồi quy bug 2026-10-08', () => {
    const avogadro = cacSoTrongLoiGiai('N = 6,02 × 10²³ hạt')
    expect(avogadro).toHaveLength(1)
    expect(avogadro[0]).toBeCloseTo(6.02e23, -18)
    // Mũ trên của đơn vị (m²) không đứng sau 10 nên không bị đọc thành số.
    expect(cacSoTrongLoiGiai('S = 10² m²')).toEqual([100])
    expect(cacSoTrongLoiGiai('q = 10⁻¹ C')).toEqual([0.1])
  })

  it('10 mũ đứng một mình (không có hệ số phía trước)', () => {
    expect(cacSoTrongLoiGiai('k = 10⁻⁷')).toEqual([1e-7])
  })
})

/** Một bài một câu — đủ để soi từng nhánh của `timLoiTuCham`. */
function motBai(answer: BaiCoCauHoi['checkQuestions'][number]['answer'], explain: string) {
  return [{ id: 'bai-1', checkQuestions: [{ prompt: 'Câu 1', answer, explain }] }]
}

describe('timLoiTuCham — cổng phải ĐỎ được với bài khai sai', () => {
  it('không có bài nào / bài không có câu hỏi → không có lỗi', () => {
    expect(timLoiTuCham([])).toEqual([])
    expect(timLoiTuCham([{ id: 'rong', checkQuestions: [] }])).toEqual([])
  })

  it('bài khai đúng SI và lời giải có đúng con số hiển thị → đạt', () => {
    expect(
      timLoiTuCham(motBai({ kind: 'numeric', value: 0.0866, unit: 'cm' }, 'd = 8,66 cm')),
    ).toEqual([])
  })

  it('lời giải làm tròn trong dung sai 1% vẫn đạt (8,7 cm so với 8,66 cm)', () => {
    expect(
      timLoiTuCham(motBai({ kind: 'numeric', value: 0.0866, unit: 'cm' }, 'd ≈ 8,7 cm')),
    ).toEqual([])
  })

  it('đáp án hiển thị bằng 0 (0 °C) không bị dung sai 0 làm báo oan', () => {
    expect(
      timLoiTuCham(motBai({ kind: 'numeric', value: 273.15, unit: '°C' }, 't = 0 °C')),
    ).toEqual([])
  })

  it('khai value ở ĐƠN VỊ HIỂN THỊ (đúng lỗi audit 2026-09-14) → LECH_LOI_GIAI', () => {
    const loi = timLoiTuCham(motBai({ kind: 'numeric', value: 8.66, unit: 'cm' }, 'd = 8,66 cm'))
    expect(loi).toHaveLength(1)
    expect(loi[0]).toMatchObject({ lessonId: 'bai-1', prompt: 'Câu 1', loai: 'LECH_LOI_GIAI' })
    expect(loi[0]?.chiTiet).toContain('hiển thị 866 cm')
  })

  it('đơn vị SI cơ sở (hệ số 1) không bị đối chiếu lời giải — lời giải văn xuôi không báo oan', () => {
    expect(
      timLoiTuCham(motBai({ kind: 'numeric', value: 5, unit: 'm' }, 'Quãng đường bằng năm mét.')),
    ).toEqual([])
  })

  it('đáp án không tự chấm đúng được → TU_CHAM và KHÔNG xét tiếp lớp 2', () => {
    // Trắc nghiệm không khai đáp án đúng nào → chuỗi gõ rỗng → engine chấm EMPTY.
    const loi = timLoiTuCham(motBai({ kind: 'choice', correctIds: [] }, ''))
    expect(loi).toEqual([
      { lessonId: 'bai-1', prompt: 'Câu 1', loai: 'TU_CHAM', chiTiet: 'gõ "" → EMPTY' },
    ])
  })

  it('gom lỗi qua nhiều bài, giữ đúng thứ tự', () => {
    const loi = timLoiTuCham([
      ...motBai({ kind: 'choice', correctIds: [] }, ''),
      {
        id: 'bai-2',
        checkQuestions: [
          { prompt: 'Câu A', answer: { kind: 'numeric', value: 2, unit: 'km' }, explain: '2 km' },
          { prompt: 'Câu B', answer: { kind: 'fraction', num: 1, den: 2 }, explain: '1/2' },
        ],
      },
    ])
    expect(loi.map((l) => `${l.lessonId}:${l.loai}`)).toEqual([
      'bai-1:TU_CHAM',
      'bai-2:LECH_LOI_GIAI',
    ])
  })
})

describe('moTaLoiTuCham', () => {
  it('rỗng → chuỗi rỗng; có lỗi → mỗi lỗi một dòng có loại + id bài', () => {
    expect(moTaLoiTuCham([])).toBe('')
    expect(
      moTaLoiTuCham([
        { lessonId: 'a', prompt: 'p', loai: 'TU_CHAM', chiTiet: 'x' },
        { lessonId: 'b', prompt: 'q', loai: 'LECH_LOI_GIAI', chiTiet: 'y' },
      ]),
    ).toBe('  [TU_CHAM] a: x\n  [LECH_LOI_GIAI] b: y')
  })
})
