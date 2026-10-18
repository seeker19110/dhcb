// Unit orchestration với service/search boundary giả; KHÔNG chạy search/ranking production.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Client, Pool, type QueryResult } from 'pg'
import { MemoryRecordSchema, type MemoryRecord } from '@dhcb/core-contracts/personalMemory'
import type { MemoryRecordRow } from '@dhcb/core-personal/memoryService'
import {
  ingestMemory,
  supersedeMemoryWithClient,
  invalidateMemoryWithClient,
  expireMemoryRecord,
} from '@dhcb/core-personal/memoryService'
import { searchMemories, type ScoredMemory } from '@dhcb/core-personal/memoryRetrieval'
import rawCorpus from '../memory-retrieval-corpus.json'
import { RetrievalCorpusSchema, snapshotHash, configHash } from './retrievalBenchmarkSchema.js'
import {
  seedRetrievalCorpus,
  observeRetrievalBenchmark,
  type RetrievalSeed,
} from './retrievalBenchmarkRunner.js'

vi.mock('@dhcb/core-personal/memoryService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@dhcb/core-personal/memoryService')>()),
  ingestMemory: vi.fn(),
  supersedeMemoryWithClient: vi.fn(),
  invalidateMemoryWithClient: vi.fn(),
  expireMemoryRecord: vi.fn(),
}))
vi.mock('@dhcb/core-personal/memoryRetrieval', () => ({ searchMemories: vi.fn() }))
const corpus = RetrievalCorpusSchema.parse(rawCorpus)
const source = {
  gitCommit: '1'.repeat(40),
  sourceSha256: { 'memoryRetrieval.ts': '2'.repeat(64) },
  postgresVersion: 'fixture-only-not-a-measurement',
  migrationCount: 100,
  textSearchConfig: 'simple' as const,
}
const at = '2026-10-16T00:00:00.000Z'
const clockIso = '2026-10-16T00:00:01.123Z'
function uuid(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
}
const pool = new Pool()
const client = Object.assign(new Client(), { release: vi.fn() })
let records: Map<string, MemoryRecord>
let sql: string[]
let boundaryFailures: string[]
let readonly = false
let aborted = false
let snapshotReads = 0
let afterSnapshot: (() => void) | undefined
let breakSavepoint = false
let breakRecovery = false
let personCount = 0
let snapshotTransform:
  | ((rows: Array<MemoryRecordRow & { embedding_model: null }>) => Record<string, unknown>[])
  | undefined
function result(rows: Record<string, unknown>[] = []): QueryResult<Record<string, unknown>> {
  return { command: 'SELECT', rowCount: rows.length, oid: 0, fields: [], rows }
}
function labelFor(key: string) {
  const label = corpus.records.find((r) => r.key === key)
  if (!label) throw new Error('TEST_LABEL_MISSING')
  return label
}
function recordFor(key: string, personId: string): MemoryRecord {
  const label = labelFor(key)
  return MemoryRecordSchema.parse({
    id: uuid(100 + Number(key.slice(1))),
    personId,
    namespace: label.namespace,
    content: label.content,
    provenance: label.seed.provenance,
    sensitivity: label.sensitivity,
    status: 'accepted',
    createdAt: at,
    validFrom: at,
    version: 1,
    importance: 5,
    hasEmbedding: false,
    schemaVersion: 2,
  })
}
function rawRows(): Array<MemoryRecordRow & { embedding_model: null }> {
  return [...records.values()].map((r) => ({
    id: r.id,
    person_id: r.personId,
    namespace: r.namespace,
    content: r.content,
    provenance: r.provenance,
    sensitivity: r.sensitivity,
    status: r.status,
    merged_from_id: r.mergedFromId ?? null,
    version: r.version,
    created_at: new Date(r.createdAt),
    updated_at: new Date(at),
    retain_until: null,
    importance: r.importance,
    last_accessed_at: r.lastAccessedAt ? new Date(r.lastAccessedAt) : null,
    access_count: 0,
    valid_from: new Date(r.validFrom),
    valid_to: r.validTo ? new Date(r.validTo) : null,
    superseded_by: r.supersededBy ?? null,
    source_message_id: null,
    has_embedding: r.hasEmbedding,
    embedding_model: null,
  }))
}
async function newPerson() {
  personCount++
  return { userId: uuid(personCount), personId: uuid(10 + personCount) }
}
async function seed() {
  return seedRetrievalCorpus(pool, { newPerson }, corpus)
}
async function observe(mapping: RetrievalSeed) {
  return observeRetrievalBenchmark(pool, corpus, mapping, { source })
}
async function rejectFake(options: Parameters<typeof searchMemories>[2]) {
  if (!options.skipSemantic && options.embeddingProvider) {
    try {
      await options.embeddingProvider.embed([options.query], 'query')
    } catch {
      /* fallback theo hợp đồng */
    }
  }
}
function oneResult(key = 'R01'): ScoredMemory[] {
  const record = records.get(key)
  if (!record) throw new Error('TEST_RECORD_MISSING')
  return [{ record, score: 0.5, recency: 0.5, importance: 0.5, relevance: 0.5 }]
}
beforeEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  records = new Map()
  sql = []
  boundaryFailures = []
  readonly = false
  aborted = false
  snapshotReads = 0
  personCount = 0
  afterSnapshot = undefined
  snapshotTransform = undefined
  breakSavepoint = false
  breakRecovery = false
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      boundaryFailures.push('unexpected_http')
      throw new Error('UNEXPECTED_NETWORK_BOUNDARY')
    }),
  )
  vi.spyOn(pool, 'connect').mockImplementation(() => Promise.resolve(client))
  vi.spyOn(pool, 'query').mockImplementation(() => {
    boundaryFailures.push('unexpected_pool_query')
    throw new Error('UNEXPECTED_POOL_QUERY')
  })
  vi.spyOn(client, 'query').mockImplementation((text) => {
    if (typeof text !== 'string') {
      boundaryFailures.push('unexpected_query_shape')
      throw new Error('UNEXPECTED_SQL')
    }
    sql.push(text)
    const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim()
    if (normalized === 'rollback' || normalized === 'begin') {
      aborted = false
      return Promise.resolve(result())
    }
    if (normalized.startsWith('rollback to savepoint')) {
      if (breakRecovery) throw new Error('SYNTHETIC_RECOVERY_FAILED')
      aborted = false
      return Promise.resolve(result())
    }
    if (aborted) throw new Error('SYNTHETIC_TRANSACTION_ABORTED')
    if (normalized.startsWith('savepoint') && breakSavepoint)
      throw new Error('SYNTHETIC_SAVEPOINT_FAILED')
    if (normalized.startsWith('set transaction')) {
      readonly = true
      return Promise.resolve(result())
    }
    if (
      ['commit', 'savepoint stored_s05_query', 'release savepoint stored_s05_query'].includes(
        normalized,
      )
    )
      return Promise.resolve(result())
    if (normalized.includes('clock_timestamp()'))
      return Promise.resolve(
        result([
          {
            benchmark_now: new Date(clockIso),
            benchmark_now_text: '2026-10-16 00:00:01.123456+00',
          },
        ]),
      )
    if (normalized.startsWith('select id, person_id')) {
      snapshotReads++
      if (snapshotReads === 2) afterSnapshot?.()
      const rows = rawRows()
      return Promise.resolve(
        result(snapshotTransform ? snapshotTransform(rows) : rows.map((row) => ({ ...row }))),
      )
    }
    if (normalized === 'select synthetic_sql_error') {
      aborted = true
      throw new Error('PRIVATE_SQL_ERROR_CANARY')
    }
    if (
      normalized === 'update personal.memory_records set access_count=access_count+1' &&
      readonly
    ) {
      aborted = true
      throw new Error('SYNTHETIC_READ_ONLY_VIOLATION')
    }
    boundaryFailures.push('unexpected_sql')
    throw new Error('UNEXPECTED_SQL')
  })
  vi.mocked(ingestMemory).mockImplementation(
    async (_pool, personId, candidate, _actor, options) => {
      expect(_pool).toBe(pool)
      expect(candidate.confidence).toBe(1)
      expect(candidate.importance).toBe(5)
      expect(await options?.embed?.(candidate.content)).toBeNull()
      const key = candidate.provenance.slice(-3)
      const record = recordFor(key, personId)
      records.set(key, record)
      return { record, evaluation: { outcome: 'ACCEPT', reason: 'fixture-boundary' } }
    },
  )
  vi.mocked(supersedeMemoryWithClient).mockImplementation(
    async (_client, personId, input, _actor, options) => {
      expect(_client).toBe(client)
      expect(input).not.toHaveProperty('confidence')
      expect(input.provenance).toBe(labelFor('R01').seed.provenance)
      expect(await options?.embed?.(input.content)).toBeNull()
      const previous = records.get('R02')
      if (!previous) throw new Error('TEST_SUPERSEDE_ORDER')
      expect(input.recordId).toBe(previous.id)
      expect(input.expectedVersion).toBe(1)
      const record = recordFor('R01', personId)
      const closed = { ...previous, version: 2, validTo: at, supersededBy: record.id }
      records.set('R01', record)
      records.set('R02', closed)
      return { record, previous: closed }
    },
  )
  vi.mocked(invalidateMemoryWithClient).mockImplementation(
    async (_client, personId, recordId, expectedVersion) => {
      expect(_client).toBe(client)
      const current = records.get('R13')
      if (!current) throw new Error('TEST_INVALIDATE_MISSING')
      expect([personId, recordId, expectedVersion]).toEqual([current.personId, current.id, 1])
      const record = { ...current, version: 2, validTo: at }
      records.set('R13', record)
      return record
    },
  )
  vi.mocked(expireMemoryRecord).mockImplementation(
    async (_pool, personId, recordId, expectedVersion) => {
      expect(_pool).toBe(pool)
      const current = records.get('R14')
      if (!current) throw new Error('TEST_EXPIRE_MISSING')
      expect([personId, recordId, expectedVersion]).toEqual([current.personId, current.id, 1])
      const record = { ...current, version: 2, status: 'expired' as const }
      records.set('R14', record)
      return record
    },
  )
  vi.mocked(searchMemories).mockImplementation(async (runner, _personId, options) => {
    expect(runner).toBe(client)
    expect(options.touch).toBe(false)
    expect(options.limit).toBe(10)
    expect(options.now?.toISOString()).toBe(clockIso)
    await rejectFake(options)
    return []
  })
})
afterEach(() => {
  expect(boundaryFailures).toEqual([])
  expect(fetch).not.toHaveBeenCalled()
  vi.unstubAllGlobals()
})

describe('seed qua service boundary', () => {
  it('tạo 3 persons/26 records, ingest25, R02 trước supersede duy nhất R01, lifecycle đúng', async () => {
    const mapping = await seed()
    expect(mapping.persons).toHaveLength(3)
    expect(mapping.records).toHaveLength(26)
    expect(ingestMemory).toHaveBeenCalledTimes(25)
    expect(vi.mocked(ingestMemory).mock.calls[0]?.[2].provenance).toBe(
      labelFor('R02').seed.provenance,
    )
    expect(
      vi
        .mocked(ingestMemory)
        .mock.calls.some((call) => call[2].provenance === labelFor('R01').seed.provenance),
    ).toBe(false)
    expect(supersedeMemoryWithClient).toHaveBeenCalledTimes(1)
    expect(invalidateMemoryWithClient).toHaveBeenCalledTimes(1)
    expect(expireMemoryRecord).toHaveBeenCalledTimes(1)
    expect(records.get('R02')).toMatchObject({ version: 2, supersededBy: records.get('R01')?.id })
    expect(records.get('R14')).not.toHaveProperty('validTo')
  })
  it('MERGE thay ACCEPT dừng ngay, không sửa SQL để hợp nhãn', async () => {
    vi.mocked(ingestMemory).mockResolvedValueOnce({
      record: recordFor('R02', uuid(11)),
      evaluation: { outcome: 'MERGE', reason: 'synthetic' },
    })
    await expect(seed()).rejects.toThrow('INGEST_NOT_ACCEPT')
    expect(supersedeMemoryWithClient).not.toHaveBeenCalled()
    expect(sql).toEqual([])
  })
  it('record service đổi provenance bị chặn trước ranking', async () => {
    vi.mocked(ingestMemory).mockResolvedValueOnce({
      record: { ...recordFor('R02', uuid(11)), provenance: 'changed' },
      evaluation: { outcome: 'ACCEPT', reason: 'synthetic' },
    })
    await expect(seed()).rejects.toThrow('RECORD_CHANGED')
    expect(searchMemories).not.toHaveBeenCalled()
  })
  it('person UUID trùng bị chặn', async () => {
    await expect(
      seedRetrievalCorpus(
        pool,
        { newPerson: async () => ({ userId: uuid(1), personId: uuid(11) }) },
        corpus,
      ),
    ).rejects.toThrow('PERSON_DUPLICATE')
    expect(ingestMemory).not.toHaveBeenCalled()
  })
})

describe('observe chỉ mock search, transaction thật với PG boundary giả', () => {
  it('SET đầu sau BEGIN, clock1 lần, 80 observations, cùng now/hash và ledger fallback40', async () => {
    const mapping = await seed()
    sql = []
    const run = await observe(mapping)
    expect(sql[0]).toBe('begin')
    expect(sql[1]).toBe('set transaction isolation level repeatable read read only')
    expect(sql.filter((s) => s.includes('clock_timestamp()'))).toHaveLength(1)
    expect(snapshotReads).toBe(2)
    expect(searchMemories).toHaveBeenCalledTimes(80)
    expect(sql.filter((s) => s === 'savepoint stored_s05_query')).toHaveLength(80)
    expect(run.status).toBe('VALID')
    expect(run.parity).toEqual({ status: 'MATCH', queryIds: [] })
    expect(run.clock).toEqual({
      postgresText: '2026-10-16 00:00:01.123456+00',
      isoMilliseconds: clockIso,
    })
    expect(run.snapshotHash).toBe(snapshotHash(run.snapshot))
    expect(run.configs.lexical_base.contextTokenBudget).toBe(4000)
    for (const mode of ['lexical_base', 'embedding_error_fallback'] as const) {
      expect(run.observations[mode]).toHaveLength(40)
      expect(run.diagnosticReports[mode]).toMatchObject({
        status: 'VALID',
        plannedPositive: 33,
        hardGuardsChecked: 40,
        metrics: { recallAt5: 0, recallAt10: 0, mrrAt10: 0 },
      })
      expect(
        run.observations[mode].every(
          (o) =>
            o.snapshotHash === run.snapshotHash && o.configHash === configHash(run.configs[mode]),
        ),
      ).toBe(true)
    }
    expect(run.diagnosticReports.lexical_base.embeddingAttempts).toBe(0)
    expect(run.diagnosticReports.embedding_error_fallback).toMatchObject({
      embeddingAttempts: 40,
      embeddingErrors: 40,
    })
    expect(run.semantic).toEqual({ status: 'NOT_MEASURED', reason: 'NO_REAL_VECTORS' })
    expect(sql.at(-1)).toBe('commit')
    expect(client.release).toHaveBeenCalled()
  })
  it('SQL error ở noRelevant giữ query_error/null, rollback và vẫn chạy đủ80', async () => {
    const mapping = await seed()
    vi.mocked(searchMemories).mockImplementation(async (runner, _person, options) => {
      if (options.query === corpus.queries.find((q) => q.key === 'E17')?.text)
        await runner.query('select synthetic_sql_error')
      await rejectFake(options)
      return []
    })
    const run = await observe(mapping)
    expect(run.status).toBe('INVALID')
    expect(run.reports).toBeNull()
    expect(searchMemories).toHaveBeenCalledTimes(80)
    expect(run.observations.lexical_base.find((o) => o.queryId === 'E17')).toMatchObject({
      status: 'query_error',
      errorCode: 'db_error',
      embeddingAttempts: 0,
    })
    expect(run.diagnosticReports.lexical_base).toMatchObject({
      plannedPositive: 33,
      metrics: null,
      byLanguage: { vi: null, en: null },
    })
    expect(sql.filter((s) => s === 'rollback to savepoint stored_s05_query')).toHaveLength(2)
    expect(JSON.stringify(run)).not.toContain('PRIVATE_SQL_ERROR_CANARY')
  })
  it('fake không được gọi không thể giả làm fallback success', async () => {
    const mapping = await seed()
    vi.mocked(searchMemories).mockResolvedValue([])
    const run = await observe(mapping)
    expect(
      run.observations.embedding_error_fallback.every(
        (o) =>
          o.status === 'query_error' &&
          o.errorCode === 'unexpected_provider' &&
          o.embeddingAttempts === 0,
      ),
    ).toBe(true)
    expect(run.status).toBe('INVALID')
    expect(run.reports).toBeNull()
  })
  it('unknown result UUID không bị drop thành [] thành công', async () => {
    const mapping = await seed()
    vi.mocked(searchMemories).mockImplementation(async (_runner, _person, options) => {
      await rejectFake(options)
      return [{ ...oneResult()[0]!, record: { ...oneResult()[0]!.record, id: uuid(999) } }]
    })
    const run = await observe(mapping)
    expect(run.observations.lexical_base[0]).toMatchObject({
      status: 'query_error',
      errorCode: 'result_invalid',
    })
    expect(run.status).toBe('INVALID')
    expect(searchMemories).toHaveBeenCalledTimes(80)
  })
  it('score NaN thành result_invalid', async () => {
    const mapping = await seed()
    vi.mocked(searchMemories).mockImplementation(async (_runner, _person, options) => {
      await rejectFake(options)
      return [{ ...oneResult()[0]!, score: Number.NaN }]
    })
    expect((await observe(mapping)).observations.lexical_base[0]).toMatchObject({
      status: 'query_error',
      errorCode: 'result_invalid',
    })
  })
  it('thay score giữa mode làm parity hỏng, không xuất reports chất lượng', async () => {
    const mapping = await seed()
    vi.mocked(searchMemories).mockImplementation(async (_runner, _person, options) => {
      await rejectFake(options)
      if (options.query !== corpus.queries[0]?.text) return []
      return [{ ...oneResult()[0]!, score: options.skipSemantic ? 0.5 : 0.6 }]
    })
    const run = await observe(mapping)
    expect(run.parity).toEqual({ status: 'MISMATCH', queryIds: ['V01'] })
    expect(run.status).toBe('INVALID')
    expect(run.reports).toBeNull()
  })
  it('hard guard cross-person trên noRelevant được scorer bắt độc lập', async () => {
    const mapping = await seed()
    vi.mocked(searchMemories).mockImplementation(async (_runner, _person, options) => {
      await rejectFake(options)
      return options.query === corpus.queries.find((q) => q.key === 'E17')?.text
        ? oneResult('R25')
        : []
    })
    const run = await observe(mapping)
    expect(run.parity.status).toBe('MATCH')
    expect(run.status).toBe('INVALID')
    expect(run.reports?.lexical_base).toMatchObject({
      status: 'INVALID',
      metrics: null,
      hardViolationQueryIds: ['E17'],
    })
  })

  it('đổi thứ tự IDs giữa hai mode bị parity bắt, không tự sort lại rank', async () => {
    const mapping = await seed()
    vi.mocked(searchMemories).mockImplementation(async (_runner, _person, options) => {
      await rejectFake(options)
      if (options.query !== corpus.queries[0]?.text) return []
      const ranked = [...oneResult(), ...oneResult('R03')]
      return options.skipSemantic ? ranked : ranked.reverse()
    })
    const run = await observe(mapping)
    expect(run.parity).toEqual({ status: 'MISMATCH', queryIds: ['V01'] })
    expect(run.reports).toBeNull()
  })
  it('source metadata sai bị validate trước mở transaction', async () => {
    const mapping = await seed()
    vi.mocked(pool.connect).mockClear()
    await expect(
      observeRetrievalBenchmark(pool, corpus, mapping, {
        source: { ...source, gitCommit: 'invalid' },
      }),
    ).rejects.toThrow()
    expect(pool.connect).not.toHaveBeenCalled()
    expect(searchMemories).not.toHaveBeenCalled()
  })
  it('snapshot access/content đổi bị chặn toàn run', async () => {
    const mapping = await seed()
    afterSnapshot = () => {
      const r = records.get('R03')
      if (r) records.set('R03', { ...r, content: 'changed' })
    }
    await expect(observe(mapping)).rejects.toThrow('SNAPSHOT_CHANGED')
    expect(sql.at(-1)).toBe('rollback')
  })
  it('thiếu record snapshot dừng trước gọi search', async () => {
    const mapping = await seed()
    records.delete('R26')
    await expect(observe(mapping)).rejects.toThrow()
    expect(searchMemories).not.toHaveBeenCalled()
  })
  it('embedding_model không null dừng trước search dù hasEmbedding false', async () => {
    const mapping = await seed()
    snapshotTransform = (rows) =>
      rows.map((r, i) => ({ ...r, embedding_model: i === 0 ? 'unexpected' : null }))
    await expect(observe(mapping)).rejects.toThrow()
    expect(searchMemories).not.toHaveBeenCalled()
  })
  it('SAVEPOINT lỗi throw toàn run', async () => {
    const mapping = await seed()
    breakSavepoint = true
    await expect(observe(mapping)).rejects.toThrow('SYNTHETIC_SAVEPOINT_FAILED')
    expect(searchMemories).not.toHaveBeenCalled()
  })
  it('rollback savepoint lỗi throw toàn run, không tiếp tục coi như fallback', async () => {
    const mapping = await seed()
    breakRecovery = true
    vi.mocked(searchMemories).mockRejectedValue(new Error('synthetic-sql-error'))
    await expect(observe(mapping)).rejects.toThrow('SYNTHETIC_RECOVERY_FAILED')
    expect(searchMemories).toHaveBeenCalledTimes(1)
  })
  it('SQL touch bị caller nuốt vẫn làm transaction PG abort và runner throw', async () => {
    const mapping = await seed()
    vi.mocked(searchMemories).mockImplementation(async (runner) => {
      try {
        await runner.query('update personal.memory_records set access_count=access_count+1')
      } catch {
        /* mô phỏng source nuốt touch */
      }
      return []
    })
    await expect(observe(mapping)).rejects.toThrow('SYNTHETIC_TRANSACTION_ABORTED')
    expect(searchMemories).toHaveBeenCalledTimes(1)
  })
  it('fake bị gọi2 lần invalidate toàn run, không clamp attempt để làm xanh', async () => {
    const mapping = await seed()
    vi.mocked(searchMemories).mockImplementation(async (_runner, _person, options) => {
      await rejectFake(options)
      await rejectFake(options)
      return []
    })
    await expect(observe(mapping)).rejects.toThrow('EMBEDDING_LEDGER_OVERFLOW')
  })
  it('snapshot lifecycle sai bị preflight bắt trước search', async () => {
    const mapping = await seed()
    const r = records.get('R14')
    if (r) records.set('R14', { ...r, status: 'accepted' })
    await expect(observe(mapping)).rejects.toThrow('SNAPSHOT_INVALID')
    expect(searchMemories).not.toHaveBeenCalled()
  })
})
