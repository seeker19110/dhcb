// Đại số thứ nguyên + bảng đơn vị — đặc tả docs/specs/2026-10-09-kiem-thu-nguyen-vat-li.md §5.
import { describe, expect, it } from 'vitest'
import {
  DIMENSIONLESS,
  PHYSICS_CONSTANTS,
  dim,
  dimEq,
  formatDimension,
  parseUnitExpression,
  unitWordDimension,
} from './dimension.js'
import { rat } from './rational.js'

const doc = (u: string) => {
  const r = parseUnitExpression(u)
  return r.ok ? formatDimension(r.dim) : `LỖI:${r.bad}`
}

describe('parseUnitExpression', () => {
  it.each([
    ['m/s', 'm·s⁻¹'],
    ['m/s^2', 'm·s⁻²'],
    ['m/s²', 'm·s⁻²'],
    ['m/s2', 'm·s⁻²'],
    ['m·s^{-1}', 'm·s⁻¹'],
    ['kg.m/s', 'kg·m·s⁻¹'],
    ['J/(kg.K)', 'm²·s⁻²·K⁻¹'],
    ['J/kg.K', 'm²·s⁻²·K⁻¹'], // quy ước giống units.ts: sau "/" là mẫu
    ['N·m^2/kg^2', 'kg⁻¹·m³·s⁻²'],
    ['km/h', 'm·s⁻¹'],
    ['\\Omega', 'kg·m²·s⁻³·A⁻²'],
    ['kΩ', 'kg·m²·s⁻³·A⁻²'],
    ['\\mu s', 's'],
    ['μs', 's'],
    ['Nm', 'kg·m²·s⁻²'], // tách được duy nhất thành N·m
    ['°C', 'K'],
    ['^\\circ C', 'K'],
    ['1/s', 's⁻¹'],
    ['rad/s', 's⁻¹'],
    ['giây', 's'],
    ['%', 'không thứ nguyên'],
  ])('%s → %s', (unit, expected) => {
    expect(doc(unit)).toBe(expected)
  })

  it('ms là mili-giây (đọc nguyên khối trước, theo ISO), không phải m·s', () => {
    expect(doc('ms')).toBe('s')
  })

  it('số mũ viết NGOÀI \\text gắn vào đơn vị cuối: \\text{m/s}^2 = m/s²', () => {
    const r = parseUnitExpression('m/s', rat(2n))
    expect(r.ok && formatDimension(r.dim)).toBe('m·s⁻²')
  })

  it('đơn vị lạ / LaTeX lạ → không đọc được, nêu đúng phần lạ', () => {
    expect(doc('furlong')).toBe('LỖI:furlong')
    expect(doc('\\frac{m}{s}')).toBe('LỖI:\\frac{m}{s}')
    expect(doc('m/')).toMatch(/^LỖI/)
    expect(doc('')).toMatch(/^LỖI/)
    expect(doc('m^x')).toBe('LỖI:m') // số mũ không phải số
    expect(doc('m^{1/0}')).toMatch(/^LỖI/) // mẫu 0
    expect(doc('m^{x}')).toMatch(/^LỖI/)
    expect(doc('m # s')).toMatch(/^LỖI/) // ký tự lạ giữa hai đơn vị
    expect(doc('(m/s')).toMatch(/^LỖI/) // lệch ngoặc
    expect(doc('m·3')).toMatch(/^LỖI/)
  })

  it('ngoặc lồng, mũ hữu tỉ, mũ ngoài ngoặc', () => {
    expect(doc('(kg·m)/(s^2)')).toBe('kg·m·s⁻²')
    expect(doc('(m/s)^2')).toBe('m²·s⁻²')
    expect(doc('m^(1/2)')).toBe('m^(1/2)')
    expect(doc('{m}^{2}')).toBe('m²')
    expect(doc('m ^ -1')).toBe('m⁻¹')
    expect(doc('m^−2')).toBe('m⁻²')
  })
})

describe('unitWordDimension', () => {
  it('tiền tố chỉ ghép với đơn vị cho phép ghép (không có "kmin")', () => {
    expect(unitWordDimension('kmin')).toBeNull()
    expect(unitWordDimension('kg')).not.toBeNull()
    expect(unitWordDimension('mmHg')).not.toBeNull()
  })
})

describe('formatDimension + hằng số', () => {
  it('mũ phân số hiển thị dạng ^(1/2); không thứ nguyên ghi bằng chữ', () => {
    expect(formatDimension([rat(0n), rat(1n, 2n), rat(-1n), ...DIMENSIONLESS.slice(3)])).toBe(
      'm^(1/2)·s⁻¹',
    )
    expect(formatDimension(DIMENSIONLESS)).toBe('không thứ nguyên')
  })

  it('bảng hằng chuẩn đọc được hết và đúng thứ nguyên', () => {
    expect(dimEq(PHYSICS_CONSTANTS.get('g') ?? DIMENSIONLESS, dim(0, 1, -2))).toBe(true)
    expect(dimEq(PHYSICS_CONSTANTS.get('G') ?? DIMENSIONLESS, dim(-1, 3, -2))).toBe(true)
    // k, h, e, R là ký hiệu MƠ HỒ — cố ý không có trong bảng hằng.
    for (const k of ['k', 'h', 'e', 'R']) expect(PHYSICS_CONSTANTS.has(k)).toBe(false)
  })
})
