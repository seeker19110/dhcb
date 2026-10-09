// packages/core-ai/stemPhysicsVariables.ts — Bảng thứ nguyên biến cho đề Vật lí của bảng nháp STEM.
//
// Tách riêng (gộp 0551 + 0552) để HAI nơi dùng cùng một nguồn: bộ kiểm bước
// (`stemScratchpadService.validateStep`, changelog 0552) và gợi ý Socratic (`stemMicroHint.ts`,
// changelog 0551). Nếu mỗi nơi tự tra bảng riêng, phản hồi ✗ và gợi ý có thể nói hai điều khác nhau.
import type { StemVariableTable } from '@dhcb/core-contracts/stemScratchpad'

/**
 * Bảng thứ nguyên biến của các ĐỀ MẪU Vật lí (khoá = `problemLatex` nguyên văn). Đề có bảng
 * `variables` riêng thì bảng đó thắng. Đề lạ không có ở đây → không đoán.
 */
const BANG_BIEN_DE_MAU: Readonly<Record<string, StemVariableTable>> = {
  'v = a \\cdot t': { v: 'm/s', a: 'm/s^2', t: 's' },
  'v = v_0 + a \\cdot t': { v: 'm/s', v_0: 'm/s', a: 'm/s^2', t: 's' },
}

/** Bảng biến dùng để kiểm một đề: `variables` của đề, nếu không có thì bảng đề mẫu, không thì rỗng. */
export function bangBienCuaDe(deBai?: {
  problemLatex?: string
  variables?: StemVariableTable
}): StemVariableTable | undefined {
  return deBai?.variables ?? BANG_BIEN_DE_MAU[deBai?.problemLatex ?? '']
}
