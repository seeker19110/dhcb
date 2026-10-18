// Unit orchestration/oracle: observations tổng hợp, không PG, search hoặc chất lượng corpus.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Socket } from 'node:net'
import { Pool } from 'pg'
import { FROZEN_DEFINITION_SHA256 } from './retrievalBenchmarkSchema.js'
import { corpus, fixture } from './retrievalBenchmarkCli.unitFixtures.js'
import {
  CONTEXT_IDS,
  runRetrievalLifecycle,
  validateRetrievalRun,
  validateRetrievalContexts,
  type RetrievalLifecycleOperations,
} from './retrievalBenchmarkCli.js'
import type { RetrievalObservationRun, RetrievalSeed } from './retrievalBenchmarkRunner.js'

const contextFixture = () => ({
  status: 'PASSED',
  planned: 8,
  executed: 8,
  passed: 8,
  failed: 0,
  results: CONTEXT_IDS.map((id) => ({
    id,
    passed: true,
    crashed: false,
    failedChecks: [] as string[],
  })),
})
function operations(run = fixture()) {
  const events: string[] = []
  const seed: RetrievalSeed = {
    version: 1,
    corpusHash: FROZEN_DEFINITION_SHA256,
    persons: run.snapshot.persons,
    records: run.snapshot.records.map((row) => ({
      recordKey: row.recordKey,
      personKey:
        run.snapshot.persons.find((person) => person.personId === row.record.personId)?.personKey ??
        '',
      recordId: row.record.id,
    })),
  }
  const op: RetrievalLifecycleOperations = {
    seed: vi.fn(async () => {
      events.push('seed')
      return seed
    }),
    observe: vi.fn(async (received) => {
      expect(received).toBe(seed)
      events.push('observe-committed')
      return run
    }),
    contexts: vi.fn(async () => {
      events.push('context-writable')
      return contextFixture()
    }),
    snapshotDaily: vi.fn(async () => {
      events.push('daily-before')
      return '[]'
    }),
    snapshotDailyAfterWorkPoolEnd: vi.fn(async () => {
      events.push('daily-after-end')
      return { value: '[]', verificationPoolEnded: true }
    }),
    cleanup: vi.fn(async () => {
      events.push('cleanup')
      return {
        status: 'clean' as const,
        residuals: [{ table: 'public.users', count: 0 }],
        reason: null,
      }
    }),
    end: vi.fn(async () => {
      events.push('end')
    }),
    verifySource: vi.fn(async () => {
      events.push('verify-source')
      return true
    }),
    networkViolations: vi.fn(() => 0),
    poolErrors: vi.fn(() => 0),
    seedAuditEvidence: vi.fn(() => ({
      memoryRows: 26,
      auditEvents: 29,
      beforeRankValidated: true,
      unchangedAfterRank: true,
    })),
  }
  return {
    run,
    op,
    events,
    execute: () => runRetrievalLifecycle(corpus, run.snapshot.source, op),
  }
}
let forbiddenCalls = 0
beforeEach(() => {
  forbiddenCalls = 0
  const forbidden = () => {
    forbiddenCalls++
    throw new Error('UNIT_EXTERNAL_CALL_FORBIDDEN')
  }
  vi.spyOn(Socket.prototype, 'connect').mockImplementation(forbidden)
  vi.spyOn(Pool.prototype, 'connect').mockImplementation(forbidden)
  vi.stubGlobal('fetch', forbidden)
})
afterEach(() => {
  expect(forbiddenCalls).toBe(0)
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('S05 pure complete-run oracle', () => {
  it('chấp nhận dữ liệu đo hợp lệ dù recall bằng0, không tự tạo quality floor', () => {
    const run = fixture()
    expect(validateRetrievalRun(corpus, run, run.snapshot.source).failedChecks).toEqual([])
    expect(run.reports?.lexical_base.metrics?.recallAt10).toBe(0)
  })
  it.each([
    [
      'missing mode',
      (run: RetrievalObservationRun) => ({
        ...run,
        observations: { lexical_base: run.observations.lexical_base },
      }),
    ],
    [
      'missing query',
      (run: RetrievalObservationRun) => {
        run.observations.lexical_base.pop()
        return run
      },
    ],
    [
      'duplicate query',
      (run: RetrievalObservationRun) => {
        run.observations.lexical_base[1] = run.observations.lexical_base[0]!
        return run
      },
    ],
    [
      'wrong mode',
      (run: RetrievalObservationRun) => {
        run.observations.lexical_base[0]!.mode = 'embedding_error_fallback'
        return run
      },
    ],
    [
      'empty source',
      (run: RetrievalObservationRun) => {
        run.snapshot.source.sourceSha256 = {}
        return run
      },
    ],
    [
      'wrong snapshot hash',
      (run: RetrievalObservationRun) => {
        run.snapshotHash = 'd'.repeat(64)
        return run
      },
    ],
    [
      'wrong clock',
      (run: RetrievalObservationRun) => {
        run.clock.postgresText = '2026-10-16 00:00:00+00'
        return run
      },
    ],
    [
      'wrong budget',
      (run: RetrievalObservationRun) => {
        run.configs.lexical_base.contextTokenBudget = 3999
        return run
      },
    ],
    [
      'parity mismatch',
      (run: RetrievalObservationRun) => {
        run.parity.status = 'MISMATCH'
        return run
      },
    ],
    [
      'forged scorer',
      (run: RetrievalObservationRun) => {
        run.reports!.lexical_base.metrics!.recallAt10 = 1
        return run
      },
    ],
    [
      'fallback missing ledger',
      (run: RetrievalObservationRun) => {
        run.observations.embedding_error_fallback[0]!.embeddingAttempts = 0
        return run
      },
    ],
    [
      'report absent',
      (run: RetrievalObservationRun) => {
        run.reports = null
        return run
      },
    ],
  ])('từ chối %s', (_label, mutate) => {
    const run = fixture()
    const source = structuredClone(run.snapshot.source)
    expect(validateRetrievalRun(corpus, mutate(run), source).failedChecks.length).toBeGreaterThan(0)
  })
  it('tự phát hiện ranked parity drift dù runner statusMATCH', () => {
    const run = fixture()
    const row = run.snapshot.records.find(
      (record) => record.recordKey === corpus.queries[0]?.relevantIds[0],
    )!
    const left = run.observations.lexical_base[0]!
    if (left.status !== 'ok') throw new Error('UNIT')
    left.ranked.push({
      recordKey: row.recordKey,
      recordId: row.record.id,
      score: 0.5,
      recency: 0.5,
      importance: 0.5,
      relevance: 0.5,
    })
    expect(validateRetrievalRun(corpus, run, run.snapshot.source).failedChecks).toContain(
      'measurement_parity_rows',
    )
  })
  it.each(['missing', 'duplicate', 'crashed', 'failedCheck', 'wrongId', 'count', 'failedStatus'])(
    'context %s không được xanh bằng counters',
    (fault) => {
      const context = contextFixture()
      if (fault === 'missing') context.results.pop()
      if (fault === 'duplicate') context.results[1] = { ...context.results[0]! }
      if (fault === 'crashed') context.results[0]!.crashed = true
      if (fault === 'failedCheck') context.results[0]!.failedChecks.push('identity')
      if (fault === 'wrongId')
        context.results[0]!.id = 'CTX99-wrong' as (typeof CONTEXT_IDS)[number]
      if (fault === 'count') context.executed = 7
      if (fault === 'failedStatus') context.status = 'FAILED'
      expect(validateRetrievalContexts(context).failedChecks.length).toBeGreaterThan(0)
    },
  )
})

describe('S05 lifecycle mock boundaries', () => {
  it('đợi rank commit, context, cleanup/end rồi verification snapshot/end và source proof', async () => {
    const test = operations()
    const result = await test.execute()
    expect(test.events).toEqual([
      'daily-before',
      'seed',
      'observe-committed',
      'context-writable',
      'cleanup',
      'end',
      'daily-after-end',
      'verify-source',
    ])
    expect(result.status).toBe('BASELINE_VALID')
    expect(result.exitCode).toBe(0)
    expect(result.finalSnapshotAfterWorkPoolEnd).toBe(true)
    expect(result.cachedPool).toBe('NOT_CONFIGURED')
  })
  it.each(['seed', 'observe', 'contexts', 'snapshotDaily'] as const)(
    'cleanup/end vẫn chạy sau %s exception, không lộ lỗi raw',
    async (key) => {
      const test = operations()
      vi.mocked(test.op[key]).mockRejectedValueOnce(new Error('SECRET_SENTINEL'))
      const result = await test.execute()
      expect(result.status).toBe('INVALID')
      expect(result.exitCode).toBe(1)
      expect(test.op.cleanup).toHaveBeenCalledOnce()
      expect(test.op.end).toHaveBeenCalledOnce()
      expect(JSON.stringify(result)).not.toContain('SECRET_SENTINEL')
      expect(result.reports).toBeNull()
      expect(result.planned.observations).toBe(80)
    },
  )
  it.each(['cleanup', 'end', 'verifySource', 'snapshotDailyAfterWorkPoolEnd'] as const)(
    '%s exception phải INVALID và suppress metrics',
    async (key) => {
      const test = operations()
      vi.mocked(test.op[key]).mockRejectedValueOnce(new Error('BOUNDARY_FAILURE'))
      const result = await test.execute()
      expect(result.status).toBe('INVALID')
      expect(result.reports).toBeNull()
      expect(result.diagnostics?.lexical_base?.metrics).toBeNull()
      expect(test.op.end).toHaveBeenCalledOnce()
    },
  )
  it.each([
    'residual',
    'unknown',
    'empty',
    'reason',
    'sourceDrift',
    'network',
    'dailyDrift',
    'verificationUnclosed',
    'poolBackgroundError',
    'missingAuditProof',
  ])('không falsegreen khi %s', async (fault) => {
    const test = operations()
    if (fault === 'residual')
      vi.mocked(test.op.cleanup).mockResolvedValueOnce({
        status: 'clean',
        residuals: [{ table: 'users', count: 1 }],
        reason: null,
      })
    if (fault === 'unknown')
      vi.mocked(test.op.cleanup).mockResolvedValueOnce({
        status: 'clean',
        residuals: null,
        reason: null,
      })
    if (fault === 'empty')
      vi.mocked(test.op.cleanup).mockResolvedValueOnce({
        status: 'clean',
        residuals: [],
        reason: null,
      })
    if (fault === 'reason')
      vi.mocked(test.op.cleanup).mockResolvedValueOnce({
        status: 'clean',
        residuals: [{ table: 'users', count: 0 }],
        reason: 'failure',
      })
    if (fault === 'sourceDrift') vi.mocked(test.op.verifySource).mockResolvedValueOnce(false)
    if (fault === 'network') vi.mocked(test.op.networkViolations).mockReturnValueOnce(1)
    if (fault === 'poolBackgroundError') vi.mocked(test.op.poolErrors).mockReturnValueOnce(1)
    if (fault === 'missingAuditProof')
      vi.mocked(test.op.seedAuditEvidence).mockReturnValueOnce(null)
    if (fault === 'dailyDrift')
      vi.mocked(test.op.snapshotDailyAfterWorkPoolEnd).mockResolvedValueOnce({
        value: '[1]',
        verificationPoolEnded: true,
      })
    if (fault === 'verificationUnclosed')
      vi.mocked(test.op.snapshotDailyAfterWorkPoolEnd).mockResolvedValueOnce({
        value: '[]',
        verificationPoolEnded: false,
      })
    const result = await test.execute()
    expect(result.status).toBe('INVALID')
    expect(result.exitCode).toBe(1)
    expect(result.reports).toBeNull()
  })
  it('không mở verification Pool nếu work pool.end lỗi', async () => {
    const test = operations()
    vi.mocked(test.op.end).mockRejectedValueOnce(new Error('END_FAIL'))
    const result = await test.execute()
    expect(test.op.snapshotDailyAfterWorkPoolEnd).not.toHaveBeenCalled()
    expect(result.finalSnapshotAfterWorkPoolEnd).toBe(false)
  })
  it('cleanup-only không gọi seed/query/context/daily và không trở thành baseline0case', async () => {
    const test = operations()
    const result = await runRetrievalLifecycle(undefined, undefined, test.op, true)
    expect(result.status).toBe('CLEANUP_COMPLETE')
    expect(result.scope).toBe('CLEANUP_ONLY')
    expect(result.reports).toBeNull()
    expect(result.executed).toEqual({
      lexical_base: 0,
      embedding_error_fallback: 0,
      context: 0,
    })
    expect(result.planned.observations).toBe(80)
    expect(test.op.seed).not.toHaveBeenCalled()
    expect(test.op.snapshotDaily).not.toHaveBeenCalled()
  })
  it('context invalid phải giữ 80 observations nhưng không phát canonical metrics', async () => {
    const test = operations()
    vi.mocked(test.op.contexts).mockResolvedValueOnce({
      ...contextFixture(),
      executed: 7,
    })
    const result = await test.execute()
    expect(result.executed.lexical_base + result.executed.embedding_error_fallback).toBe(80)
    expect(result.status).toBe('INVALID')
    expect(result.reports).toBeNull()
  })
})
