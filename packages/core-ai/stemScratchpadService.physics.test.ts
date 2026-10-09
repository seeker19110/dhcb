// Nhánh Vật lí của validateStep — kiểm thứ nguyên (changelog 0552,
// docs/specs/2026-10-09-kiem-thu-nguyen-vat-li.md). Tách file riêng để không đụng test Toán/Hoá.
import { describe, expect, it } from 'vitest'
import { nhanKetQuaBuoc } from '@dhcb/core-contracts/stemScratchpad'
import { StemScratchpadService } from './stemScratchpadService.js'
import { PHYSICS_LESSONS } from '@dhcb/subject-physics/lessons'
import { buildStemQuestionBank } from './stemQuestionBank.js'

/** Đề mẫu Vật lí (client gửi qua `create_problem` có `problemLatex`) — bảng biến lấy từ `stemPhysicsVariables.ts` (BANG_BIEN_DE_MAU). */
const DE_MAU = {
  problemLatex: 'v = a \\cdot t',
  problemStatement: 'Tính vận tốc sau 5s khi gia tốc a = 2m/s² từ trạng thái nghỉ:',
}
const kiem = (latex: string, deBai: Parameters<typeof StemScratchpadService.validateStep>[3]) =>
  StemScratchpadService.validateStep('physics', latex, [], deBai)

describe('StemScratchpadService.validateStep — Vật lí (thứ nguyên)', () => {
  it('lệch thứ nguyên → ✗ Lệch thứ nguyên, nêu thứ nguyên từng vế, gợi ý là CÂU HỎI', () => {
    const r = kiem('v = a t^2', DE_MAU)
    expect(r.status).toBe('invalid')
    expect(r.errorType).toBe('dimension_mismatch')
    expect(nhanKetQuaBuoc(r)).toBe('✗ Lệch thứ nguyên')
    expect(r.feedback).toContain('m·s⁻¹')
    expect(r.feedback).toContain('“a t^2”')
    expect(r.suggestedCorrection).toMatch(/\?$/)
    // Gợi ý không đưa công thức đúng hay đáp số.
    expect(r.suggestedCorrection).not.toMatch(/=|\d/)
  })

  it('đối số hàm siêu việt có thứ nguyên → gợi ý riêng về đối số', () => {
    const r = kiem('x = A \\cos(t)', { variables: { x: 'm', A: 'm', t: 's' } })
    expect(r.errorType).toBe('dimension_mismatch')
    expect(r.feedback).toContain('đối số của cos')
    expect(r.suggestedCorrection).toContain('không đơn vị')
  })

  it('khớp thứ nguyên KHÔNG BAO GIỜ thành ✓ (điều kiện cần, không đủ)', () => {
    for (const buoc of ['v = a t', 'v = 2 a t', 'v = a \\cdot t + 0\\,\\text{m/s}']) {
      const r = kiem(buoc, DE_MAU)
      expect(r.status).toBe('unverified')
      expect(r.isFinalAnswer).toBeUndefined()
      expect(nhanKetQuaBuoc(r)).toBe('? Chưa tự kiểm được')
    }
    expect(kiem('v = a t', DE_MAU).feedback).toContain('Thứ nguyên khớp')
    expect(kiem('v = a t', DE_MAU).feedback).toContain('điều kiện CẦN')
  })

  it('lệch CÓ ĐIỀU KIỆN (v = 2t, lối "đơn vị ghi sau") → không ✗, hỏi lại kèm lý do', () => {
    const r = kiem('v = 2t', DE_MAU)
    expect(r.status).toBe('unverified')
    expect(r.errorType).toBe('none')
    expect(r.feedback).toContain('Chưa kết luận được')
    expect(r.feedback).toContain('“2” không kèm đơn vị')
    expect(r.suggestedCorrection).toMatch(/\?/)
  })

  it('đáp số sai thứ nguyên → ✗ ngay; đáp số khớp thứ nguyên vẫn chỉ "chưa tự kiểm được"', () => {
    // Đáp số đề mẫu viết cứng (`khopDapSo`) đã gỡ ở changelog 0551: "giải xong" của bài ngân hàng
    // đi qua `submit_solution`, bộ kiểm bước không tự gắn `isFinalAnswer` cho Vật lí.
    const khop = kiem('v = 10 m/s', DE_MAU)
    expect(khop.status).toBe('unverified')
    expect(khop.isFinalAnswer).toBeUndefined()
    const saiDonVi = kiem('v = 10\\,\\text{s}', DE_MAU)
    expect(saiDonVi.status).toBe('invalid')
    expect(saiDonVi.errorType).toBe('dimension_mismatch')
  })

  it('chia cho 0 → ✗ Chia cho 0', () => {
    const r = kiem('v = \\frac{a}{0}', DE_MAU)
    expect(r.errorType).toBe('division_by_zero')
    expect(nhanKetQuaBuoc(r)).toBe('✗ Chia cho 0')
  })

  it('đề không có bảng biến → "chưa tự kiểm được" nói rõ lý do, không đoán', () => {
    const r = kiem('v = a t^2', { problemLatex: 'F = m a', problemStatement: 'đề lạ' })
    expect(r.status).toBe('unverified')
    expect(r.feedback).toContain('chưa khai bảng thứ nguyên')
    expect(r.feedback).toContain('Vật lí')
    const kyHieuLa = kiem('v = q t', DE_MAU)
    expect(kyHieuLa.feedback).toContain('“q” không có trong bảng biến')
  })

  it('bảng biến riêng của đề thắng bảng đề mẫu', () => {
    const r = kiem('v = a t', { ...DE_MAU, variables: { v: 'm', a: 'm/s^2', t: 's' } })
    expect(r.errorType).toBe('dimension_mismatch')
  })

  it('phản hồi luôn ≤ 500 ký tự (hợp đồng) kể cả khi người học gõ rất dài', () => {
    const dai = `v = a t + ${Array.from({ length: 60 }, () => 'a t').join(' + ')} + a t^2`
    const r = kiem(dai, DE_MAU)
    expect(r.feedback.length).toBeLessThanOrEqual(500)
    expect((r.suggestedCorrection ?? '').length).toBeLessThanOrEqual(500)
  })

  it('quét ngân hàng đề THẬT: đề Vật lí chưa khai bảng biến → "chưa tự kiểm được", không ✓/✗', () => {
    // Ngân hàng (changelog 0551) là đề lời văn từ bài học, chưa có `variables` (nợ mở) — bộ kiểm
    // không được đoán thứ nguyên theo tên ký hiệu, kể cả với bước lệch rõ như `v = a t^2`.
    const deLi = buildStemQuestionBank([{ subject: 'physics', lessons: PHYSICS_LESSONS }])
    expect(deLi.length).toBeGreaterThan(0)
    for (const q of deLi) {
      const r = kiem('v = a t^2', { problemStatement: q.problemStatement })
      expect(r.errorType).not.toBe('dimension_mismatch')
      expect(r.status).toBe('unverified')
      expect(r.feedback).toContain('chưa khai bảng thứ nguyên')
    }
  })
})
