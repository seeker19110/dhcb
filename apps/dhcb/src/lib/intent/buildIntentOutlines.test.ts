// buildIntentOutlines.test.ts — lớp chung khai ở "Bắt đầu" áp cho TỪNG môn STEM: môn có bài ở
// lớp đó thì dùng, môn chưa có (Lí/Hoá/Sinh với lớp 6–9) về lớp mặc định của môn — không dựng
// cây rỗng (đặc tả docs/specs/2026-10-10-menu-lop-thcs-va-bat-dau-6-9.md).
//
// Dựng cây THẬT (không mock): Vitest chỉ trả bản mock cho lượt `import()` động ĐẦU, các lượt song
// song còn lại nhận module thật (đã ghi ở subjectProgressBoard.ts) — mock sẽ cho kết quả nửa vời.
// Cây thật mang lớp trong `rootId` (`level:<môn>-<lớp>`), đủ để canh.
import { describe, it, expect } from 'vitest'
import { buildIntentOutlines } from './buildIntentOutlines'
import type { LearnerIntent } from '@dhcb/core-contracts/learnerIntent'

function yDinh(subjectIds: LearnerIntent['subjectIds'], grade?: LearnerIntent['grade']) {
  return {
    schemaVersion: 1,
    subjectIds,
    ...(grade ? { grade } : {}),
    createdAt: 1,
    updatedAt: 1,
  } as LearnerIntent
}

describe('buildIntentOutlines — lớp STEM theo từng môn', () => {
  it('Toán + Vật lí, lớp 8 → Toán lớp 8, Vật lí lớp 10', async () => {
    const cay = await buildIntentOutlines(yDinh(['mathematics', 'physics'], '8'), 'u1', 'free')
    expect(cay.get('mathematics')?.rootId).toBe('level:mathematics-8')
    expect(cay.get('physics')?.rootId).toBe('level:physics-10')
  })

  it('chưa khai lớp → lớp mặc định của môn', async () => {
    const cay = await buildIntentOutlines(yDinh(['chemistry']), 'u1', 'free')
    expect(cay.get('chemistry')?.rootId).toBe('level:chemistry-10')
  })

  it('lớp 12 có ở mọi môn → giữ nguyên', async () => {
    const cay = await buildIntentOutlines(yDinh(['biology'], '12'), 'u1', 'free')
    expect(cay.get('biology')?.rootId).toBe('level:biology-12')
  })
})
