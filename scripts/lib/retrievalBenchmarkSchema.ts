// Hợp đồng benchmark tổng hợp; không truy cập DB, provider hoặc authoritative state.
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { MemoryRecordSchema, MemoryNamespaceSchema } from '@dhcb/core-contracts/personalMemory'
import { SensitivitySchema } from '@dhcb/core-contracts/personalFact'

export const FROZEN_DRAFT_SHA256 =
  'b8cf4cfb775e39e6e9a1b1baa67c387a6e5b2171719d037f1f83bddd759dd68a'
export const SCORING_PLAN_SHA256 =
  'dcca6a4eecdc2b69eb4ac837cbab9cd445dad695558b2dee0a70a08b70c7d62b'
export const FROZEN_DEFINITION_SHA256 =
  '817ff8bea6bf9ff40fd4474ed3e0a847af1609c5231f76c883de9c7b05dc0297'
export const PLANNED = {
  queries: 40,
  positive: 33,
  noRelevant: 7,
  positiveByLanguage: { vi: 17, en: 16 },
  noRelevantByLanguage: { vi: 3, en: 4 },
} as const
export const EXPECTED_RECORD_KEYS = Array.from(
  { length: 26 },
  (_, index) => `R${String(index + 1).padStart(2, '0')}`,
)
export const EXPECTED_QUERY_KEYS = ['V', 'E'].flatMap((prefix) =>
  Array.from({ length: 20 }, (_, index) => `${prefix}${String(index + 1).padStart(2, '0')}`),
)
const PersonKey = z.enum(['P1', 'P2', 'P3'])
const RecordKey = z.string().regex(/^R\d{2}$/)
const QueryKey = z.string().min(1).max(40)
export const HashSchema = z.string().regex(/^[a-f0-9]{64}$/)
const IsoTime = z.iso.datetime()
const Count = z.number().int().nonnegative().safe()
const UnitInterval = z.number().finite().min(0).max(1)
const unique = (values: readonly string[]) => new Set(values).size === values.length
export const SENSITIVITY_ORDER = ['public', 'personal', 'sensitive', 'restricted'] as const

const LifecycleSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('live') }).strict(),
  z.object({ kind: z.literal('expired') }).strict(),
  z.object({ kind: z.literal('invalidated') }).strict(),
  z.object({ kind: z.literal('superseded'), supersededByKey: RecordKey }).strict(),
])
const CorpusRecordSchema = z
  .object({
    key: RecordKey,
    personKey: PersonKey,
    namespace: MemoryNamespaceSchema,
    content: z.string().min(1).max(2000),
    sensitivity: SensitivitySchema,
    lifecycle: LifecycleSchema,
    seed: z
      .object({
        confidence: z.literal(1),
        importance: z.literal(5),
        provenance: z.string().max(200),
      })
      .strict(),
  })
  .strict()
const queryFields = {
  key: QueryKey,
  language: z.enum(['vi', 'en']),
  personKey: PersonKey,
  text: z.string().min(1).max(2000),
  maxSensitivity: SensitivitySchema,
  mustExcludeIds: z.array(RecordKey).max(26),
}
const CorpusQuerySchema = z.discriminatedUnion('kind', [
  z
    .object({
      ...queryFields,
      kind: z.literal('positive'),
      relevantIds: z.array(RecordKey).min(1).max(26),
    })
    .strict(),
  z.object({ ...queryFields, kind: z.literal('no_relevant'), relevantIds: z.tuple([]) }).strict(),
])
const CorpusShape = z
  .object({
    version: z.literal(1),
    datasetId: z.literal('stored-retrieval-synthetic-v1'),
    metadata: z
      .object({
        labelRevision: z.literal(1),
        labelProvenance: z.literal('agent_synthetic_review'),
        humanReview: z.literal('NOT_REVIEWED'),
        frozenDraftSha256: z.literal(FROZEN_DRAFT_SHA256),
        frozenDefinitionSha256: z.literal(FROZEN_DEFINITION_SHA256),
        timeContractRevision: z.literal(1),
        timePolicy: z.literal('service_clock_snapshot'),
        scoringPlanSha256: z.literal(SCORING_PLAN_SHA256),
        draftDatesReplaced: z.literal(true),
        semanticQuality: z.literal('NOT_MEASURED'),
        semanticReason: z.literal('NO_REAL_VECTORS'),
      })
      .strict(),
    persons: z
      .array(z.object({ key: PersonKey, displayName: z.string().min(1).max(50) }).strict())
      .length(3),
    records: z.array(CorpusRecordSchema).length(26),
    queries: z.array(CorpusQuerySchema).length(40),
  })
  .strict()
export type RetrievalCorpus = z.infer<typeof CorpusShape>
export type CorpusQuery = z.infer<typeof CorpusQuerySchema>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
/** Chỉ dùng dữ liệu JSON đã validate, không sort ranked observations. */
function canonical(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value)
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(',')}}`
  }
  throw new TypeError('BENCHMARK_NON_JSON_VALUE')
}
export function hashCanonical(value: unknown): string {
  return createHash('sha256').update(canonical(value)).digest('hex')
}
export function frozenDefinitionHash(
  corpus: Pick<RetrievalCorpus, 'persons' | 'records' | 'queries'>,
): string {
  return hashCanonical({
    persons: [...corpus.persons].sort((a, b) => a.key.localeCompare(b.key)),
    records: [...corpus.records].sort((a, b) => a.key.localeCompare(b.key)),
    queries: [...corpus.queries]
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((query) => ({
        ...query,
        relevantIds: [...query.relevantIds].sort(),
        mustExcludeIds: [...query.mustExcludeIds].sort(),
      })),
  })
}
export const RetrievalCorpusSchema = CorpusShape.superRefine((corpus, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message })
  const keysMatch = (actual: string[], expected: readonly string[]) =>
    unique(actual) &&
    actual.length === expected.length &&
    expected.every((key) => actual.includes(key))
  if (
    !keysMatch(
      corpus.persons.map((person) => person.key),
      ['P1', 'P2', 'P3'],
    )
  )
    fail('PERSON_KEYS')
  if (
    !keysMatch(
      corpus.records.map((record) => record.key),
      EXPECTED_RECORD_KEYS,
    )
  )
    fail('RECORD_KEYS')
  if (
    !keysMatch(
      corpus.queries.map((query) => query.key),
      EXPECTED_QUERY_KEYS,
    )
  )
    fail('QUERY_KEYS')
  const records = new Map(corpus.records.map((record) => [record.key, record]))
  for (const record of corpus.records) {
    if (record.seed.provenance !== `user_declared:synthetic:stored-s05-v1:${record.key}`)
      fail('SEED_PROVENANCE')
    if (record.lifecycle.kind === 'superseded') {
      const replacement = records.get(record.lifecycle.supersededByKey)
      if (
        !replacement ||
        replacement.personKey !== record.personKey ||
        replacement.lifecycle.kind !== 'live'
      )
        fail('SUPERSESSION_REFERENCE')
    }
  }
  for (const query of corpus.queries) {
    if (!query.key.startsWith(query.language === 'vi' ? 'V' : 'E')) fail('QUERY_LANGUAGE')
    if (!unique(query.relevantIds) || !unique(query.mustExcludeIds))
      fail('QUERY_REFERENCE_DUPLICATE')
    const expectedExcluded = corpus.records
      .filter(
        (record) =>
          record.personKey !== query.personKey ||
          record.lifecycle.kind !== 'live' ||
          SENSITIVITY_ORDER.indexOf(record.sensitivity) >
            SENSITIVITY_ORDER.indexOf(query.maxSensitivity),
      )
      .map((record) => record.key)
    if (!keysMatch(query.mustExcludeIds, expectedExcluded)) fail('EXCLUSIONS_MISMATCH')
    if (query.relevantIds.some((key) => !records.has(key) || expectedExcluded.includes(key)))
      fail('RELEVANT_INELIGIBLE')
  }
  for (const language of ['vi', 'en'] as const) {
    const group = corpus.queries.filter((query) => query.language === language)
    if (
      group.length !== 20 ||
      group.filter((query) => query.kind === 'positive').length !==
        PLANNED.positiveByLanguage[language]
    )
      fail('QUERY_GROUPS')
  }
  if (frozenDefinitionHash(corpus) !== FROZEN_DEFINITION_SHA256) fail('FROZEN_DEFINITION_CHANGED')
})

export const RetrievalSnapshotSchema = z
  .object({
    version: z.literal(1),
    corpusHash: z.literal(FROZEN_DEFINITION_SHA256),
    timePolicy: z.literal('service_clock_snapshot'),
    now: IsoTime,
    source: z
      .object({
        gitCommit: z.string().regex(/^[a-f0-9]{40}$/),
        sourceSha256: z.record(z.string().min(1).max(300), HashSchema),
        postgresVersion: z.string().min(1).max(100),
        migrationCount: Count,
        textSearchConfig: z.literal('simple'),
      })
      .strict(),
    persons: z
      .array(z.object({ personKey: PersonKey, personId: z.uuid(), userId: z.uuid() }).strict())
      .length(3),
    records: z
      .array(
        z
          .object({
            recordKey: RecordKey,
            record: MemoryRecordSchema,
            updatedAt: IsoTime,
            accessCount: Count,
          })
          .strict(),
      )
      .length(26),
  })
  .strict()
export type RetrievalSnapshot = z.infer<typeof RetrievalSnapshotSchema>
export function snapshotHash(snapshot: RetrievalSnapshot): string {
  return hashCanonical({
    ...snapshot,
    persons: [...snapshot.persons].sort((a, b) => a.personKey.localeCompare(b.personKey)),
    records: [...snapshot.records].sort((a, b) => a.recordKey.localeCompare(b.recordKey)),
  })
}
const configFields = {
  version: z.literal(1),
  corpusHash: z.literal(FROZEN_DEFINITION_SHA256),
  timePolicy: z.literal('service_clock_snapshot'),
  snapshotHash: HashSchema,
  now: IsoTime,
  limit: z.literal(10),
  touch: z.literal(false),
  contextTokenBudget: z.number().int().positive().max(8000),
}
export const RetrievalConfigSchema = z.discriminatedUnion('mode', [
  z
    .object({
      ...configFields,
      mode: z.literal('lexical_base'),
      skipSemantic: z.literal(true),
      embeddingProvider: z.literal('disabled'),
    })
    .strict(),
  z
    .object({
      ...configFields,
      mode: z.literal('embedding_error_fallback'),
      skipSemantic: z.literal(false),
      embeddingProvider: z.literal('rejecting_fake'),
    })
    .strict(),
])
export type RetrievalConfig = z.infer<typeof RetrievalConfigSchema>
export type RetrievalMode = RetrievalConfig['mode']
export function configHash(config: RetrievalConfig): string {
  return hashCanonical(config)
}

const observationFields = {
  version: z.literal(1),
  mode: z.enum(['lexical_base', 'embedding_error_fallback']),
  queryId: QueryKey,
  snapshotHash: HashSchema,
  configHash: HashSchema,
  embeddingAttempts: Count.max(1),
  embeddingErrors: Count.max(1),
}
export const QueryObservationSchema = z.discriminatedUnion('status', [
  z
    .object({
      ...observationFields,
      status: z.literal('ok'),
      ranked: z
        .array(
          z
            .object({
              recordKey: RecordKey,
              recordId: z.uuid(),
              score: UnitInterval,
              recency: UnitInterval,
              importance: UnitInterval,
              relevance: UnitInterval,
            })
            .strict(),
        )
        .max(10),
    })
    .strict(),
  z
    .object({
      ...observationFields,
      status: z.literal('query_error'),
      errorCode: z.enum(['db_error', 'result_invalid', 'unexpected_provider']),
    })
    .strict(),
])
export type QueryObservation = z.infer<typeof QueryObservationSchema>
const MetricsSchema = z
  .object({ recallAt5: UnitInterval, recallAt10: UnitInterval, mrrAt10: UnitInterval })
  .strict()
export type RetrievalMetrics = z.infer<typeof MetricsSchema>
export const IssueCodeSchema = z.enum([
  'CORPUS_INVALID',
  'SNAPSHOT_INVALID',
  'CONFIG_INVALID',
  'OBSERVATIONS_INVALID',
  'MISSING_QUERY',
  'DUPLICATE_QUERY',
  'UNKNOWN_QUERY',
  'QUERY_ERROR',
  'MODE_MISMATCH',
  'SNAPSHOT_MISMATCH',
  'CONFIG_MISMATCH',
  'HARD_GUARD',
  'FALLBACK_LEDGER_INVALID',
])
export type IssueCode = z.infer<typeof IssueCodeSchema>
const HardReasonSchema = z.enum([
  'unknown_record',
  'record_identity',
  'cross_person',
  'inactive',
  'sensitivity',
  'explicit_exclusion',
  'duplicate_record',
])
const NO_RELEVANT_KEYS = ['V16', 'V17', 'V18', 'E16', 'E17', 'E19', 'E20']
export const RetrievalReportSchema = z
  .object({
    version: z.literal(1),
    mode: z.enum(['lexical_base', 'embedding_error_fallback']).nullable(),
    expectedSnapshotHash: HashSchema.nullable(),
    expectedConfigHash: HashSchema.nullable(),
    now: IsoTime.nullable(),
    corpusHash: z.literal(FROZEN_DEFINITION_SHA256),
    status: z.enum(['VALID', 'INVALID']),
    plannedQueries: z.literal(40),
    plannedPositive: z.literal(33),
    plannedNoRelevant: z.literal(7),
    positiveByLanguage: z.object({ vi: z.literal(17), en: z.literal(16) }).strict(),
    noRelevantByLanguage: z.object({ vi: z.literal(3), en: z.literal(4) }).strict(),
    observedQueries: Count,
    scoredPositive: Count,
    observedNoRelevant: Count,
    hardGuardsChecked: Count,
    missingQueryIds: z.array(QueryKey),
    duplicateQueryIds: z.array(QueryKey),
    unknownQueryIds: z.array(QueryKey),
    queryErrorIds: z.array(QueryKey),
    hardViolationQueryIds: z.array(QueryKey),
    embeddingAttempts: Count,
    embeddingErrors: Count,
    issues: z.array(
      z
        .object({
          code: IssueCodeSchema,
          queryId: QueryKey.optional(),
          observationIndex: Count.optional(),
          reason: HardReasonSchema.optional(),
        })
        .strict(),
    ),
    metrics: MetricsSchema.nullable(),
    byLanguage: z.object({ vi: MetricsSchema.nullable(), en: MetricsSchema.nullable() }).strict(),
    noRelevant: z.array(
      z
        .object({
          queryId: QueryKey,
          resultCount: Count.nullable(),
          status: z.enum(['ok', 'query_error', 'missing', 'duplicate']),
          hardViolations: z.array(HardReasonSchema),
        })
        .strict(),
    ),
  })
  .strict()
  .superRefine((report, ctx) => {
    const diagnosticIds = [
      report.missingQueryIds,
      report.duplicateQueryIds,
      report.unknownQueryIds,
      report.queryErrorIds,
      report.hardViolationQueryIds,
    ]
    const noRelevantComplete =
      report.noRelevant.length === 7 &&
      new Set(report.noRelevant.map((row) => row.queryId)).size === 7 &&
      NO_RELEVANT_KEYS.every((key) =>
        report.noRelevant.some(
          (row) =>
            row.queryId === key &&
            row.status === 'ok' &&
            row.resultCount !== null &&
            row.hardViolations.length === 0,
        ),
      )
    const validLedger =
      report.mode === 'lexical_base'
        ? report.embeddingAttempts === 0 && report.embeddingErrors === 0
        : report.mode === 'embedding_error_fallback' &&
          report.embeddingAttempts === 40 &&
          report.embeddingErrors === 40
    if (
      report.status === 'INVALID' &&
      (report.metrics !== null || report.byLanguage.vi !== null || report.byLanguage.en !== null)
    )
      ctx.addIssue({ code: 'custom', message: 'INVALID_METRICS_MUST_BE_NULL' })
    if (
      report.status === 'VALID' &&
      (report.issues.length ||
        report.expectedSnapshotHash === null ||
        report.expectedConfigHash === null ||
        report.now === null ||
        report.metrics === null ||
        report.byLanguage.vi === null ||
        report.byLanguage.en === null ||
        report.scoredPositive !== 33 ||
        report.hardGuardsChecked !== 40 ||
        report.observedQueries !== 40 ||
        report.observedNoRelevant !== 7 ||
        diagnosticIds.some((ids) => ids.length > 0) ||
        !noRelevantComplete ||
        !validLedger)
    )
      ctx.addIssue({ code: 'custom', message: 'VALID_REPORT_INCOMPLETE' })
  })
export type RetrievalReport = z.infer<typeof RetrievalReportSchema>
