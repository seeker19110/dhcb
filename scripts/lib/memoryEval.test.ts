import { describe, expect, it, vi } from 'vitest'
import { evaluateMemoryCandidate, type MemoryCandidate } from '@dhcb/core-personal/memoryService'
import storedFixtures from '../eval-v2-memory-fixtures.json'
import { MemoryEvalFixturesSchema, runMemoryEvaluation, type MemoryEvalFixture } from './memoryEval'

// Chỉ giả biên SELECT dữ liệu có sẵn; chính memory service quyết định kết quả của từng ca.
async function evaluate(fixture: MemoryEvalFixture) {
  const query = vi.fn().mockResolvedValue({ rows: fixture.existingRecords ?? [] })
  const candidate: MemoryCandidate = fixture.candidate
  const result = await evaluateMemoryCandidate({ query }, 'person-test', candidate)
  return result.outcome
}

const fixtures = () => MemoryEvalFixturesSchema.parse(storedFixtures)

describe('hợp đồng fixture eval ký ức', () => {
  it.each([undefined, null, {}, [], 'không phải bộ ca'])(
    'từ chối bộ ca hỏng/rỗng: %j',
    async (raw) => {
      const evaluator = vi.fn(evaluate)
      await expect(runMemoryEvaluation(raw, evaluator)).rejects.toThrow()
      expect(evaluator).not.toHaveBeenCalled()
    },
  )

  it('chặn bộ ca bị cắt dưới sàn 30 của đặc tả', () => {
    expect(() => MemoryEvalFixturesSchema.parse(fixtures().slice(1))).toThrow()
  })

  it('chặn ID trùng dù tổng số ca đủ', () => {
    const cases = fixtures()
    expect(() => MemoryEvalFixturesSchema.parse([...cases, cases[0]])).toThrow(/trùng/)
  })

  it.each(['conf-low-', 'conf-ask-', 'conf-accept-', 'sens-rej-', 'dup-rej-', 'merge-'])(
    'chặn thiếu nhóm %s dù bù đủ 30 ca bằng nhóm khác',
    (prefix) => {
      const cases = fixtures()
      const kept = cases.filter((c) => !c.id.startsWith(prefix))
      const replacement = kept[0]
      if (!replacement) throw new Error('Bộ ca đối chứng phải còn nhóm khác')
      const padding = Array.from({ length: cases.length - kept.length }, (_, i) => ({
        ...replacement,
        id: `extra-${i}`,
      }))
      expect(() => MemoryEvalFixturesSchema.parse([...kept, ...padding])).toThrow(/nhóm/)
    },
  )

  it.each([
    { expectedOutcome: 'PASS' },
    {
      candidate: {
        namespace: 'unknown',
        content: 'a',
        provenance: 'derived',
        sensitivity: 'personal',
      },
    },
    {
      candidate: {
        namespace: 'semantic',
        content: 10,
        provenance: 'derived',
        sensitivity: 'personal',
      },
    },
    {
      candidate: {
        namespace: 'semantic',
        content: 'a',
        provenance: 'derived',
        sensitivity: 'unknown',
      },
    },
    {
      candidate: {
        namespace: 'semantic',
        content: 'a',
        provenance: 'derived',
        sensitivity: 'personal',
        confidence: Number.NaN,
      },
    },
    { unexpected: 'trường ngoài hợp đồng' },
  ])('chặn dữ liệu sai hợp đồng: %j', (change) => {
    const cases = fixtures().map((c, i) => (i === 0 ? { ...c, ...change } : c))
    expect(() => MemoryEvalFixturesSchema.parse(cases)).toThrow()
  })

  it('giữ khoảng trắng nội dung để service thật kiểm ca trùng sau trim', () => {
    expect(fixtures().find((c) => c.id === 'dup-rej-3')?.candidate.content).toBe(
      ' User likes coffee ',
    )
  })
})

describe('cổng kết quả eval ký ức', () => {
  it('30 ca qua service thật → mã 0, các mẫu số đều có dữ liệu', async () => {
    const result = await runMemoryEvaluation(storedFixtures, evaluate)
    expect(result).toMatchObject({
      total: 30,
      correct: 30,
      crashed: 0,
      falseMemoryCount: 0,
      falseMemoryTotal: 20,
      correctionCount: 10,
      correctionTotal: 10,
      exitCode: 0,
    })
    expect(result.results.every((r) => r.actual === r.expected)).toBe(true)
  })

  it.each(['conf-accept-1', 'conf-low-1', 'conf-ask-1', 'sens-rej-1', 'dup-rej-1', 'merge-1'])(
    'negative control: ép %s sai phải làm cổng đỏ',
    async (id) => {
      const result = await runMemoryEvaluation(storedFixtures, async (fixture) => {
        const actual = await evaluate(fixture)
        return fixture.id === id ? (actual === 'REJECT' ? 'ASK_USER' : 'REJECT') : actual
      })
      expect(result.correct).toBe(29)
      expect(result.exitCode).toBe(1)
      expect(result.results.filter((r) => r.actual !== r.expected).map((r) => r.id)).toEqual([id])
    },
  )

  it('giữ ngưỡng false-memory nghiêm ngặt: 1/20 = 5% phải đỏ', async () => {
    const result = await runMemoryEvaluation(storedFixtures, async (fixture) =>
      fixture.id === 'conf-low-1' ? 'ACCEPT' : evaluate(fixture),
    )
    expect(result.falseMemoryCount / result.falseMemoryTotal).toBe(0.05)
    expect(result.exitCode).toBe(1)
  })

  it('giữ ngưỡng correction 100%: một ca sửa sai phải đỏ', async () => {
    const result = await runMemoryEvaluation(storedFixtures, async (fixture) =>
      fixture.id === 'merge-1' ? 'ACCEPT' : evaluate(fixture),
    )
    expect(result.correctionCount / result.correctionTotal).toBe(0.9)
    expect(result.exitCode).toBe(1)
  })

  it('ca ném lỗi không tính là đúng; vẫn chạy đủ các ca khác', async () => {
    const evaluator = vi.fn(async (fixture: MemoryEvalFixture) => {
      if (fixture.id === 'conf-accept-1') throw new Error('biên dữ liệu lỗi')
      return evaluate(fixture)
    })
    const result = await runMemoryEvaluation(storedFixtures, evaluator)
    expect(evaluator).toHaveBeenCalledTimes(30)
    expect(result).toMatchObject({ correct: 29, crashed: 1, exitCode: 1 })
    expect(result.results.find((r) => r.id === 'conf-accept-1')).toMatchObject({
      actual: null,
      error: 'biên dữ liệu lỗi',
    })
  })

  it('kết quả evaluator sai schema cũng là ca hỏng', async () => {
    const result = await runMemoryEvaluation(storedFixtures, async (fixture) =>
      fixture.id === 'conf-accept-1' ? undefined : evaluate(fixture),
    )
    expect(result).toMatchObject({ correct: 29, crashed: 1, exitCode: 1 })
  })
})
