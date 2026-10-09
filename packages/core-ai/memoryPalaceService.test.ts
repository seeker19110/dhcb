// packages/core-ai/memoryPalaceService.test.ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { INITIAL_RETENTION_STRENGTH, MemoryPalaceService } from './memoryPalaceService.js'

describe('MemoryPalaceService', () => {
  it('creates a memory palace room with default loci templates', () => {
    const room = MemoryPalaceService.createMemoryPalaceRoom('user-1', {
      name: 'Thư Viện Tri Thức Anh Ngữ',
      theme: 'knowledge_library',
    })

    expect(room.personId).toBe('user-1')
    expect(room.theme).toBe('knowledge_library')
    expect(room.loci.length).toBeGreaterThan(0)
    expect(room.totalAnchorsCount).toBe(room.loci.length)
    // Chưa ôn lần nào ⇒ độ bền xác định = 0, không phải số ngẫu nhiên (changelog 0563).
    expect(room.averageRetentionRate).toBe(INITIAL_RETENTION_STRENGTH)
    for (const locus of room.loci) {
      expect(locus.retentionStrength).toBe(INITIAL_RETENTION_STRENGTH)
      expect(locus.lastRecalledAt).toBeUndefined()
    }
  })

  it('verifies locus recall with accurate answer', () => {
    const room = MemoryPalaceService.createMemoryPalaceRoom('user-1', {
      name: 'Phòng Thí Nghiệm STEM',
      theme: 'stem_laboratory',
    })
    const locus = room.loci[0]!

    const result = MemoryPalaceService.verifyLocusRecall(locus, locus.keyConcept)
    expect(result.locusId).toBe(locus.id)
    expect(result.isAccurate).toBe(true)
    expect(result.similarityScore).toBeGreaterThan(50)
  })

  it('handles inaccurate recall feedback gracefully', () => {
    const room = MemoryPalaceService.createMemoryPalaceRoom('user-1', {
      name: 'Vườn Thiền',
      theme: 'zen_garden',
    })
    const locus = room.loci[0]!

    const result = MemoryPalaceService.verifyLocusRecall(locus, 'không nhớ gì')
    expect(result.locusId).toBe(locus.id)
    expect(result.feedback).toContain(locus.mnemonicStory)
  })

  it('độ bền chỉ đổi qua ôn tập thật và kẹp trong [0, 100]', () => {
    const room = MemoryPalaceService.createMemoryPalaceRoom('user-1', {
      name: 'Vườn Thiền',
      theme: 'zen_garden',
    })
    const locus = room.loci[0]!
    // Sai lần đầu từ khởi điểm 0 ⇒ giữ 0, không âm.
    expect(MemoryPalaceService.verifyLocusRecall(locus, 'x').strengthenedRetention).toBe(0)
    // Đúng ⇒ +15.
    expect(
      MemoryPalaceService.verifyLocusRecall(locus, locus.keyConcept).strengthenedRetention,
    ).toBe(15)
    // Gần trần ⇒ kẹp 100.
    expect(
      MemoryPalaceService.verifyLocusRecall({ ...locus, retentionStrength: 95 }, locus.keyConcept)
        .strengthenedRetention,
    ).toBe(100)
  })

  it('mã nguồn không còn sinh số ngẫu nhiên cho độ bền ghi nhớ (chống số giả)', () => {
    const source = readFileSync(join(__dirname, 'memoryPalaceService.ts'), 'utf8')
    expect(source).not.toMatch(/Math\.random/)
  })
})
