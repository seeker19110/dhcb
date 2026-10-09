// Ca biên của bộ kiểm bước cân bằng phương trình hoá học (đặc tả docs/specs/2026-10-09-kiem-buoc-giai-stem.md §6, §8).
import { describe, it, expect } from 'vitest'
import { checkChemStep, normalizeChemLatex } from './stepCheckChem.js'

const DE_NUOC = 'H_2 + O_2 \\rightarrow H_2O'

describe('normalizeChemLatex', () => {
  it('đổi LaTeX phẳng/Unicode về dạng bộ đọc công thức hiểu', () => {
    expect(normalizeChemLatex('2H_2 + O_2 \\rightarrow 2H_2O')).toBe('2H2 + O2  ->  2H2O')
    expect(normalizeChemLatex('SO_4^{2-}')).toBe('SO4^2-')
    expect(normalizeChemLatex('\\ce{H2O}')).toBe('H2O')
    expect(normalizeChemLatex('CuSO_4 \\cdot 5H_2O')).toBe('CuSO4 · 5H2O')
  })

  it('lệnh LaTeX lạ hoặc lệch ngoặc → null (không đoán)', () => {
    expect(normalizeChemLatex('H_2 + \\alpha \\rightarrow X')).toBeNull()
    expect(normalizeChemLatex('\\ce{H2O')).toBeNull()
  })
})

describe('checkChemStep', () => {
  it('đã cân bằng, tối giản, đúng chất của đề → balanced + khớp đề', () => {
    expect(checkChemStep('2H_2 + O_2 \\rightarrow 2H_2O', DE_NUOC)).toEqual({
      verdict: 'balanced',
      simplified: true,
      matchesProblem: true,
    })
    // Mũi tên Unicode, chỉ số Unicode, thứ tự chất khác.
    expect(checkChemStep('O₂ + 2H₂ → 2H₂O', DE_NUOC)).toMatchObject({
      verdict: 'balanced',
      matchesProblem: true,
    })
  })

  it('cân bằng nhưng chưa tối giản → balanced, simplified = false', () => {
    expect(checkChemStep('4H_2 + 2O_2 -> 4H_2O', DE_NUOC)).toEqual({
      verdict: 'balanced',
      simplified: false,
      matchesProblem: true,
    })
  })

  it('chưa cân bằng → nêu ĐÍCH DANH nguyên tố lệch và số đếm từng vế', () => {
    expect(checkChemStep('H_2 + O_2 -> H_2O', DE_NUOC)).toEqual({
      verdict: 'unbalanced_atoms',
      counts: [{ element: 'O', left: 2, right: 1 }],
    })
    expect(checkChemStep('H_2 + O_2 -> 2H_2O', DE_NUOC)).toEqual({
      verdict: 'unbalanced_atoms',
      counts: [{ element: 'H', left: 2, right: 4 }],
    })
  })

  it('sửa chỉ số (đổi chất) thay vì thêm hệ số → substance_changed', () => {
    expect(checkChemStep('H_2 + O_2 -> H_2O_2', DE_NUOC)).toEqual({ verdict: 'substance_changed' })
    expect(checkChemStep('2H_2 + O_2 -> 2H_2O + H_2', DE_NUOC)).toEqual({
      verdict: 'substance_changed',
    })
  })

  it('ngoặc lồng nhau + hệ số', () => {
    expect(checkChemStep('Fe_2(SO_4)_3 + 6NaOH -> 2Fe(OH)_3 + 3Na_2SO_4')).toEqual({
      verdict: 'balanced',
      simplified: true,
      matchesProblem: null,
    })
    expect(checkChemStep('Fe_2(SO_4)_3 + 3NaOH -> 2Fe(OH)_3 + 3Na_2SO_4')).toMatchObject({
      verdict: 'unbalanced_atoms',
    })
  })

  it('ngậm nước với dấu ·', () => {
    expect(checkChemStep('CuSO_4 \\cdot 5H_2O \\rightarrow CuSO_4 + 5H_2O')).toMatchObject({
      verdict: 'balanced',
    })
    expect(checkChemStep('CuSO₄·5H₂O → CuSO₄ + 4H₂O')).toMatchObject({
      verdict: 'unbalanced_atoms',
    })
  })

  it('phương trình ion: kiểm cả điện tích; electron e^- trong bán phản ứng', () => {
    expect(checkChemStep('Fe^{3+} + e^- \\rightarrow Fe^{2+}')).toMatchObject({
      verdict: 'balanced',
    })
    expect(checkChemStep('Fe^{3+} + 2e^- \\rightarrow Fe^{2+}')).toEqual({
      verdict: 'unbalanced_charge',
      left: 1,
      right: 2,
    })
    expect(checkChemStep('Ag^+ + Cl^- -> AgCl')).toMatchObject({ verdict: 'balanced' })
    expect(checkChemStep('Ba^{2+} + SO_4^{2-} -> BaSO_4')).toMatchObject({ verdict: 'balanced' })
    expect(checkChemStep('Ba^{2+} + 2SO_4^{2-} -> BaSO_4')).toMatchObject({
      verdict: 'unbalanced_atoms',
    })
  })

  it('bỏ qua trạng thái chất, ↑/↓ và điều kiện phản ứng', () => {
    expect(checkChemStep('H_2(g) + Cl_2(g) -> 2HCl(g)')).toMatchObject({ verdict: 'balanced' })
    expect(checkChemStep('CaCO_3 \\xrightarrow{t^o} CaO + CO_2\\uparrow')).toMatchObject({
      verdict: 'balanced',
    })
    expect(checkChemStep('CaCO₃ →(t°) CaO + CO₂↑')).toMatchObject({ verdict: 'balanced' })
    expect(checkChemStep('BaCl_2 + Na_2SO_4 -> BaSO_4\\downarrow + 2NaCl')).toMatchObject({
      verdict: 'balanced',
    })
  })

  it('không đọc được ⇒ unsupported, KHÔNG BAO GIỜ balanced', () => {
    expect(checkChemStep('Xy + O_2 -> XyO_2')).toEqual({
      verdict: 'unsupported',
      reason: 'unknown_element',
    })
    expect(checkChemStep('H_2 + O_2')).toEqual({ verdict: 'unsupported', reason: 'not_equation' })
    expect(checkChemStep('h2 + o2 -> h2o')).toEqual({
      verdict: 'unsupported',
      reason: 'not_equation',
    })
    expect(checkChemStep('H_2 + \\gamma -> H_2')).toEqual({
      verdict: 'unsupported',
      reason: 'unknown_notation',
    })
    expect(checkChemStep('1/2 O_2 + H_2 -> H_2O')).toEqual({
      verdict: 'unsupported',
      reason: 'not_equation',
    })
  })

  it('đề không đọc được thì vẫn đếm nguyên tử, nhưng không khẳng định khớp đề', () => {
    expect(checkChemStep('2H_2 + O_2 -> 2H_2O', 'đề bằng chữ')).toEqual({
      verdict: 'balanced',
      simplified: true,
      matchesProblem: null,
    })
  })
})
