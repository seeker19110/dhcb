// Helper nội bộ S05: caller phải guard DB disposable và cleanup own manifest trong finally.
import type { Pool, PoolClient } from 'pg'
import { z } from 'zod'
import { withTransaction } from '@dhcb/core-db/transaction'
import type { EmbeddingProvider } from '@dhcb/core-ai/embeddings'
import { MemoryRecordSchema, type MemoryRecord } from '@dhcb/core-contracts/personalMemory'
import {
  ingestMemory,
  supersedeMemoryWithClient,
  invalidateMemoryWithClient,
  expireMemoryRecord,
  rowToMemoryRecord,
} from '@dhcb/core-personal/memoryService'
import { searchMemories } from '@dhcb/core-personal/memoryRetrieval'
import { scoreRetrieval } from './retrievalBenchmarkScorer.js'
import {
  FROZEN_DEFINITION_SHA256,
  RetrievalCorpusSchema,
  RetrievalSnapshotSchema,
  RetrievalConfigSchema,
  QueryObservationSchema,
  snapshotHash,
  configHash,
  hashCanonical,
  type RetrievalCorpus,
  type RetrievalSnapshot,
  type RetrievalConfig,
  type RetrievalMode,
  type RetrievalReport,
  type QueryObservation,
  type CorpusQuery,
} from './retrievalBenchmarkSchema.js'

type Label = RetrievalCorpus['records'][number]
const PersonMappingSchema = z
  .object({
    personKey: z.string().regex(/^P[123]$/),
    userId: z.uuid(),
    personId: z.uuid(),
  })
  .strict()
const SeedMappingSchema = z
  .object({
    version: z.literal(1),
    corpusHash: z.literal(FROZEN_DEFINITION_SHA256),
    persons: z.array(PersonMappingSchema).length(3),
    records: z
      .array(
        z
          .object({
            recordKey: z.string().regex(/^R\d{2}$/),
            personKey: z.string().regex(/^P[123]$/),
            recordId: z.uuid(),
          })
          .strict(),
      )
      .length(26),
  })
  .strict()
export type RetrievalSeed = z.infer<typeof SeedMappingSchema>
export interface RetrievalFixtureScope {
  newPerson(): Promise<{ userId: string; personId: string }>
}
export interface ObserveRetrievalOptions {
  source: RetrievalSnapshot['source']
  contextTokenBudget?: number
}
export interface RetrievalObservationRun {
  status: 'VALID' | 'INVALID'
  snapshot: RetrievalSnapshot
  snapshotHash: string
  clock: { postgresText: string; isoMilliseconds: string }
  configs: Record<RetrievalMode, RetrievalConfig>
  observations: Record<RetrievalMode, QueryObservation[]>
  // Khi parity hỏng, reports=null; diagnosticReports giữ phép chấm riêng để điều tra.
  reports: Record<RetrievalMode, RetrievalReport> | null
  diagnosticReports: Record<RetrievalMode, RetrievalReport>
  parity: { status: 'MATCH' | 'MISMATCH' | 'INVALID'; queryIds: string[] }
  semantic: { status: 'NOT_MEASURED'; reason: 'NO_REAL_VECTORS' }
}
const ACTOR = 'stored-s05-synthetic'
const NO_EMBEDDING = { embed: async () => null }
function fail(code: string): never {
  throw new Error(`RETRIEVAL_FIXTURE_${code}`)
}
function mustGet<K, V>(map: Map<K, V>, key: K): V {
  const value = map.get(key)
  if (value === undefined) fail('MAPPING_MISSING')
  return value
}
function checkedSeed(corpus: RetrievalCorpus, input: RetrievalSeed): RetrievalSeed {
  const seed = SeedMappingSchema.parse(input)
  if (
    new Set(seed.persons.map((p) => p.personKey)).size !== 3 ||
    new Set(seed.persons.map((p) => p.personId)).size !== 3 ||
    new Set(seed.persons.map((p) => p.userId)).size !== 3 ||
    new Set(seed.records.map((r) => r.recordKey)).size !== 26 ||
    new Set(seed.records.map((r) => r.recordId)).size !== 26
  )
    fail('MAPPING_DUPLICATE')
  if (
    corpus.persons.some((p) => !seed.persons.some((s) => s.personKey === p.key)) ||
    corpus.records.some(
      (r) => !seed.records.some((s) => s.recordKey === r.key && s.personKey === r.personKey),
    )
  )
    fail('MAPPING_MISMATCH')
  return seed
}
function assertIdentity(label: Label, personId: string, input: MemoryRecord): MemoryRecord {
  const record = MemoryRecordSchema.parse(input)
  if (
    record.personId !== personId ||
    record.content !== label.content ||
    record.namespace !== label.namespace ||
    record.sensitivity !== label.sensitivity ||
    record.provenance !== label.seed.provenance ||
    record.importance !== 5 ||
    record.hasEmbedding ||
    record.mergedFromId !== undefined ||
    record.retainUntil !== undefined ||
    record.lastAccessedAt !== undefined ||
    record.sourceMessageId !== undefined
  )
    fail('RECORD_CHANGED')
  return record
}
function assertNew(label: Label, personId: string, input: MemoryRecord): MemoryRecord {
  const record = assertIdentity(label, personId, input)
  if (
    record.status !== 'accepted' ||
    record.version !== 1 ||
    record.validTo !== undefined ||
    record.supersededBy !== undefined
  )
    fail('NEW_RECORD_INVALID')
  return record
}

/** Chỉ service ghi lifecycle. Seed chưa phải quyền kết nối DB; caller giữ scope/cleanup. */
export async function seedRetrievalCorpus(
  pool: Pool,
  scope: RetrievalFixtureScope,
  corpusInput: RetrievalCorpus,
): Promise<RetrievalSeed> {
  const corpus = RetrievalCorpusSchema.parse(corpusInput)
  const persons: RetrievalSeed['persons'] = []
  for (const person of corpus.persons) {
    persons.push(PersonMappingSchema.parse({ personKey: person.key, ...(await scope.newPerson()) }))
    if (
      new Set(persons.map((p) => p.personId)).size !== persons.length ||
      new Set(persons.map((p) => p.userId)).size !== persons.length
    )
      fail('PERSON_DUPLICATE')
  }
  const people = new Map(persons.map((p) => [p.personKey, p.personId]))
  const labels = new Map(corpus.records.map((r) => [r.key, r]))
  const records = new Map<string, MemoryRecord>()
  const ingest = async (key: string) => {
    const label = mustGet(labels, key)
    const personId = mustGet(people, label.personKey)
    const result = await ingestMemory(
      pool,
      personId,
      {
        namespace: label.namespace,
        content: label.content,
        provenance: label.seed.provenance,
        sensitivity: label.sensitivity,
        confidence: 1,
        importance: 5,
      },
      ACTOR,
      NO_EMBEDDING,
    )
    if (result.evaluation.outcome !== 'ACCEPT') fail('INGEST_NOT_ACCEPT')
    const record = assertNew(label, personId, result.record)
    if ([...records.values()].some((r) => r.id === record.id)) fail('RECORD_DUPLICATE')
    records.set(key, record)
    return record
  }
  const old = await ingest('R02')
  const replacement = mustGet(labels, 'R01')
  const replaced = await withTransaction(pool, (client) =>
    supersedeMemoryWithClient(
      client,
      old.personId,
      {
        recordId: old.id,
        expectedVersion: old.version,
        content: replacement.content,
        provenance: replacement.seed.provenance,
        importance: 5,
      },
      ACTOR,
      NO_EMBEDDING,
    ),
  )
  const fresh = assertNew(replacement, old.personId, replaced.record)
  const previous = assertIdentity(mustGet(labels, 'R02'), old.personId, replaced.previous)
  if (
    fresh.id === old.id ||
    previous.id !== old.id ||
    previous.status !== 'accepted' ||
    previous.version !== old.version + 1 ||
    previous.validTo === undefined ||
    previous.supersededBy !== fresh.id
  )
    fail('SUPERSEDE_INVALID')
  records.set('R01', fresh)
  records.set('R02', previous)
  for (const label of corpus.records)
    if (!['R01', 'R02'].includes(label.key)) await ingest(label.key)
  const invalid = mustGet(records, 'R13')
  const invalidated = assertIdentity(
    mustGet(labels, 'R13'),
    invalid.personId,
    await withTransaction(pool, (client) =>
      invalidateMemoryWithClient(
        client,
        invalid.personId,
        invalid.id,
        invalid.version,
        ACTOR,
        'synthetic fixture lifecycle',
      ),
    ),
  )
  if (
    invalidated.id !== invalid.id ||
    invalidated.status !== 'accepted' ||
    invalidated.version !== invalid.version + 1 ||
    invalidated.validTo === undefined ||
    invalidated.supersededBy !== undefined
  )
    fail('INVALIDATE_INVALID')
  records.set('R13', invalidated)
  const expiring = mustGet(records, 'R14')
  const expired = assertIdentity(
    mustGet(labels, 'R14'),
    expiring.personId,
    await expireMemoryRecord(pool, expiring.personId, expiring.id, expiring.version, ACTOR),
  )
  if (
    expired.id !== expiring.id ||
    expired.status !== 'expired' ||
    expired.version !== expiring.version + 1 ||
    expired.validTo !== undefined ||
    expired.supersededBy !== undefined
  )
    fail('EXPIRE_INVALID')
  records.set('R14', expired)
  return checkedSeed(corpus, {
    version: 1,
    corpusHash: FROZEN_DEFINITION_SHA256,
    persons,
    records: corpus.records.map((label) => ({
      recordKey: label.key,
      personKey: label.personKey,
      recordId: mustGet(records, label.key).id,
    })),
  })
}

// Các cột thật của memoryService, cộng embedding_model chỉ để assert NULL; không giả cột confidence.
const SNAPSHOT_COLUMNS = `id, person_id, namespace, content, provenance, sensitivity, status,
 merged_from_id, version, created_at, updated_at, retain_until, importance, last_accessed_at,
 access_count, valid_from, valid_to, superseded_by, source_message_id,
 (embedding is not null) as has_embedding, embedding_model`
const RawMemorySchema = z
  .object({
    id: z.uuid(),
    person_id: z.uuid(),
    namespace: z.string(),
    content: z.string(),
    provenance: z.string(),
    sensitivity: z.string(),
    status: z.string(),
    merged_from_id: z.uuid().nullable(),
    version: z.number().int().positive(),
    created_at: z.date(),
    updated_at: z.date(),
    retain_until: z.date().nullable(),
    importance: z.number().int().min(1).max(10),
    last_accessed_at: z.date().nullable(),
    access_count: z.number().int().nonnegative(),
    valid_from: z.date(),
    valid_to: z.date().nullable(),
    superseded_by: z.uuid().nullable(),
    source_message_id: z.uuid().nullable(),
    has_embedding: z.literal(false),
    embedding_model: z.null(),
  })
  .strict()
async function readSnapshot(
  client: PoolClient,
  seed: RetrievalSeed,
  now: string,
  source: RetrievalSnapshot['source'],
): Promise<RetrievalSnapshot> {
  const result = await client.query<Record<string, unknown>>(
    `select ${SNAPSHOT_COLUMNS} from personal.memory_records where person_id = any($1::uuid[])`,
    [seed.persons.map((p) => p.personId)],
  )
  const rows = z.array(RawMemorySchema).length(26).parse(result.rows)
  const keys = new Map(seed.records.map((r) => [r.recordId, r.recordKey]))
  if (new Set(rows.map((r) => r.id)).size !== 26 || rows.some((row) => !keys.has(row.id)))
    fail('SNAPSHOT_MAPPING')
  return RetrievalSnapshotSchema.parse({
    version: 1,
    corpusHash: FROZEN_DEFINITION_SHA256,
    timePolicy: 'service_clock_snapshot',
    now,
    source,
    persons: seed.persons,
    records: rows.map((row) => ({
      recordKey: mustGet(keys, row.id),
      record: rowToMemoryRecord(row),
      updatedAt: row.updated_at.toISOString(),
      accessCount: row.access_count,
    })),
  })
}
function configsFor(
  snapshot: RetrievalSnapshot,
  budget: number,
): Record<RetrievalMode, RetrievalConfig> {
  const common = {
    version: 1,
    corpusHash: FROZEN_DEFINITION_SHA256,
    timePolicy: 'service_clock_snapshot',
    snapshotHash: snapshotHash(snapshot),
    now: snapshot.now,
    limit: 10,
    touch: false,
    contextTokenBudget: budget,
  }
  return {
    lexical_base: RetrievalConfigSchema.parse({
      ...common,
      mode: 'lexical_base',
      skipSemantic: true,
      embeddingProvider: 'disabled',
    }),
    embedding_error_fallback: RetrievalConfigSchema.parse({
      ...common,
      mode: 'embedding_error_fallback',
      skipSemantic: false,
      embeddingProvider: 'rejecting_fake',
    }),
  }
}
class ObservationFailure extends Error {
  constructor(readonly code: 'result_invalid' | 'unexpected_provider') {
    super(code)
  }
}
async function observeQuery(
  client: PoolClient,
  query: CorpusQuery,
  personId: string,
  config: RetrievalConfig,
  ids: Map<string, string>,
): Promise<QueryObservation> {
  let attempts = 0
  let errors = 0
  let unexpected = false
  const provider: EmbeddingProvider = {
    model: 'stored-s05-rejecting-fake',
    async embed(texts, kind) {
      attempts++
      errors++
      if (attempts !== 1 || kind !== 'query' || texts.length !== 1 || texts[0] !== query.text)
        unexpected = true
      throw new Error('SYNTHETIC_EMBEDDING_REJECT')
    },
  }
  // Savepoint/rollback lỗi phải thoát toàn run, không biến thành query_error thông thường.
  await client.query('savepoint stored_s05_query')
  const fields = () => ({
    version: 1 as const,
    mode: config.mode,
    queryId: query.key,
    snapshotHash: config.snapshotHash,
    configHash: configHash(config),
    embeddingAttempts: attempts,
    embeddingErrors: errors,
  })
  let observation: QueryObservation
  try {
    const results = await searchMemories(client, personId, {
      query: query.text,
      maxSensitivity: query.maxSensitivity,
      now: new Date(config.now),
      limit: 10,
      touch: false,
      skipSemantic: config.skipSemantic,
      embeddingProvider: config.mode === 'lexical_base' ? null : provider,
    })
    if (
      unexpected ||
      (config.mode === 'embedding_error_fallback' && (attempts !== 1 || errors !== 1))
    )
      throw new ObservationFailure('unexpected_provider')
    const candidate = QueryObservationSchema.safeParse({
      ...fields(),
      status: 'ok',
      ranked: results.map((row) => ({
        recordKey: ids.get(row.record.id),
        recordId: row.record.id,
        score: row.score,
        recency: row.recency,
        importance: row.importance,
        relevance: row.relevance,
      })),
    })
    if (!candidate.success) throw new ObservationFailure('result_invalid')
    observation = candidate.data
  } catch (error) {
    await client.query('rollback to savepoint stored_s05_query')
    if (attempts > 1 || errors > 1) fail('EMBEDDING_LEDGER_OVERFLOW')
    observation = QueryObservationSchema.parse({
      ...fields(),
      status: 'query_error',
      errorCode: unexpected
        ? 'unexpected_provider'
        : error instanceof ObservationFailure
          ? error.code
          : 'db_error',
    })
  }
  await client.query('release savepoint stored_s05_query')
  return observation
}

/** Cùng client/snapshot/now cho hai mode; không Context Engine, provider thật hay cleanup. */
export async function observeRetrievalBenchmark(
  pool: Pool,
  corpusInput: RetrievalCorpus,
  seedInput: RetrievalSeed,
  options: ObserveRetrievalOptions,
): Promise<RetrievalObservationRun> {
  const corpus = RetrievalCorpusSchema.parse(corpusInput)
  const seed = checkedSeed(corpus, seedInput)
  const source = RetrievalSnapshotSchema.shape.source.parse(options.source)
  const budget = z
    .number()
    .int()
    .positive()
    .max(8000)
    .parse(options.contextTokenBudget ?? 4000)
  return withTransaction(pool, async (client) => {
    await client.query('set transaction isolation level repeatable read read only')
    const clockRows = await client.query<Record<string, unknown>>(
      `select captured.benchmark_now, captured.benchmark_now::text as benchmark_now_text
       from (select clock_timestamp() as benchmark_now) as captured`,
    )
    const clock = z
      .array(
        z
          .object({ benchmark_now: z.date(), benchmark_now_text: z.string().min(1).max(100) })
          .strict(),
      )
      .length(1)
      .parse(clockRows.rows)[0]
    if (!clock) fail('CLOCK_MISSING')
    const now = clock.benchmark_now.toISOString()
    const snapshot = await readSnapshot(client, seed, now, source)
    const configs = configsFor(snapshot, budget)
    // Dùng lại oracle fixture của scorer, chưa chạy query/ranking ở bước preflight này.
    if (
      scoreRetrieval(corpus, snapshot, configs.lexical_base, []).issues.some(
        (i) => i.code === 'SNAPSHOT_INVALID',
      )
    )
      fail('SNAPSHOT_INVALID')
    const ids = new Map(seed.records.map((r) => [r.recordId, r.recordKey]))
    const people = new Map(seed.persons.map((p) => [p.personKey, p.personId]))
    const observations: Record<RetrievalMode, QueryObservation[]> = {
      lexical_base: [],
      embedding_error_fallback: [],
    }
    for (const mode of ['lexical_base', 'embedding_error_fallback'] as const) {
      for (const query of corpus.queries)
        observations[mode].push(
          await observeQuery(client, query, mustGet(people, query.personKey), configs[mode], ids),
        )
    }
    if (snapshotHash(await readSnapshot(client, seed, now, source)) !== snapshotHash(snapshot))
      fail('SNAPSHOT_CHANGED')
    const diagnosticReports = {
      lexical_base: scoreRetrieval(
        corpus,
        snapshot,
        configs.lexical_base,
        observations.lexical_base,
      ),
      embedding_error_fallback: scoreRetrieval(
        corpus,
        snapshot,
        configs.embedding_error_fallback,
        observations.embedding_error_fallback,
      ),
    }
    const mismatches: string[] = []
    const invalidQueries: string[] = []
    for (let i = 0; i < corpus.queries.length; i++) {
      const left = observations.lexical_base[i]
      const right = observations.embedding_error_fallback[i]
      const query = corpus.queries[i]
      if (!query || !left || !right || left.status !== 'ok' || right.status !== 'ok') {
        if (query) invalidQueries.push(query.key)
      } else if (hashCanonical(left.ranked) !== hashCanonical(right.ranked))
        mismatches.push(query.key)
    }
    const parity: RetrievalObservationRun['parity'] =
      invalidQueries.length > 0
        ? { status: 'INVALID', queryIds: [...new Set([...invalidQueries, ...mismatches])] }
        : { status: mismatches.length ? 'MISMATCH' : 'MATCH', queryIds: mismatches }
    const valid =
      parity.status === 'MATCH' &&
      Object.values(diagnosticReports).every((r) => r.status === 'VALID')
    return {
      status: valid ? 'VALID' : 'INVALID',
      snapshot,
      snapshotHash: snapshotHash(snapshot),
      clock: { postgresText: clock.benchmark_now_text, isoMilliseconds: now },
      configs,
      observations,
      reports: parity.status === 'MATCH' ? diagnosticReports : null,
      diagnosticReports,
      parity,
      semantic: { status: 'NOT_MEASURED', reason: 'NO_REAL_VECTORS' },
    }
  })
}
