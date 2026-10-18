// @vitest-environment node
// Chỉ observations tự viết để kiểm phép chấm; KHÔNG gọi search hay đo chất lượng corpus.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import corpusJson from '../memory-retrieval-corpus.json'
import {
  FROZEN_DEFINITION_SHA256,
  FROZEN_DRAFT_SHA256,
  PLANNED,
  QueryObservationSchema,
  RetrievalConfigSchema,
  RetrievalCorpusSchema,
  RetrievalReportSchema,
  RetrievalSnapshotSchema,
  SCORING_PLAN_SHA256,
  configHash,
  frozenDefinitionHash,
  snapshotHash,
  type QueryObservation,
  type RetrievalConfig,
  type RetrievalMode,
  type RetrievalReport,
  type RetrievalSnapshot,
} from './retrievalBenchmarkSchema.js'
import { scoreRelevantSet, scoreRetrieval } from './retrievalBenchmarkScorer.js'

const corpus = RetrievalCorpusSchema.parse(corpusJson)
const NOW = '2026-10-17T00:00:00.000Z'
const SEEDED = '2026-10-16T23:59:00.000Z'
const CLOSED = '2026-10-16T23:59:30.000Z'
let boundaryAttempts = 0
const uuid = (value: number) => `00000000-0000-4000-8000-${value.toString(16).padStart(12, '0')}`
function replacementUuid(key: string) {
  const index = corpus.records.findIndex((record) => record.key === key)
  if (index < 0) throw new Error('UNIT_REPLACEMENT_MISSING')
  return uuid(index + 1)
}
function snapshotFixture(): RetrievalSnapshot {
  const persons = corpus.persons.map((person, index) => ({
    personKey: person.key,
    personId: uuid(100 + index),
    userId: uuid(200 + index),
  }))
  return RetrievalSnapshotSchema.parse({
    version: 1,
    corpusHash: FROZEN_DEFINITION_SHA256,
    timePolicy: 'service_clock_snapshot',
    now: NOW,
    source: {
      gitCommit: '1'.repeat(40),
      sourceSha256: { 'unit-fixture-only': 'a'.repeat(64) },
      postgresVersion: 'unit fixture; no Postgres called',
      migrationCount: 100,
      textSearchConfig: 'simple',
    },
    persons,
    records: corpus.records.map((record, index) => ({
      recordKey: record.key,
      updatedAt: record.lifecycle.kind === 'live' ? SEEDED : CLOSED,
      accessCount: 0,
      record: {
        schemaVersion: 2,
        id: uuid(index + 1),
        personId: persons.find((person) => person.personKey === record.personKey)!.personId,
        namespace: record.namespace,
        content: record.content,
        provenance: record.seed.provenance,
        sensitivity: record.sensitivity,
        status: record.lifecycle.kind === 'expired' ? 'expired' : 'accepted',
        version: record.lifecycle.kind === 'live' ? 1 : 2,
        importance: 5,
        createdAt: SEEDED,
        validFrom: SEEDED,
        hasEmbedding: false,
        ...(record.lifecycle.kind === 'invalidated' || record.lifecycle.kind === 'superseded'
          ? { validTo: CLOSED }
          : {}),
        ...(record.lifecycle.kind === 'superseded'
          ? {
              supersededBy: replacementUuid(record.lifecycle.supersededByKey),
            }
          : {}),
      },
    })),
  })
}
function configFixture(
  snapshot: RetrievalSnapshot,
  mode: RetrievalMode = 'lexical_base',
): RetrievalConfig {
  return RetrievalConfigSchema.parse({
    version: 1,
    corpusHash: FROZEN_DEFINITION_SHA256,
    timePolicy: 'service_clock_snapshot',
    snapshotHash: snapshotHash(snapshot),
    now: snapshot.now,
    limit: 10,
    touch: false,
    contextTokenBudget: 4000,
    mode,
    skipSemantic: mode === 'lexical_base',
    embeddingProvider: mode === 'lexical_base' ? 'disabled' : 'rejecting_fake',
  })
}
function observationsFixture(config: RetrievalConfig): QueryObservation[] {
  return corpus.queries.map((query) =>
    QueryObservationSchema.parse({
      version: 1,
      mode: config.mode,
      queryId: query.key,
      snapshotHash: config.snapshotHash,
      configHash: configHash(config),
      status: 'ok',
      ranked: [],
      embeddingAttempts: config.mode === 'lexical_base' ? 0 : 1,
      embeddingErrors: config.mode === 'lexical_base' ? 0 : 1,
    }),
  )
}
function unitFixture(mode: RetrievalMode = 'lexical_base') {
  const snapshot = snapshotFixture()
  const config = configFixture(snapshot, mode)
  return { snapshot, config, observations: observationsFixture(config) }
}
function okObservation(observations: QueryObservation[], key: string) {
  const observation = observations.find((item) => item.queryId === key)
  if (!observation || observation.status !== 'ok') throw new Error('UNIT_OBSERVATION_MISSING')
  return observation
}
function ranked(snapshot: RetrievalSnapshot, recordKey: string) {
  const row = snapshot.records.find((item) => item.recordKey === recordKey)
  if (!row) throw new Error('UNIT_RECORD_MISSING')
  return { recordKey, recordId: row.record.id, score: 1, recency: 1, importance: 0.5, relevance: 1 }
}
function evaluate(fixture = unitFixture()): RetrievalReport {
  return scoreRetrieval(corpus, fixture.snapshot, fixture.config, fixture.observations)
}
function expectInvalid(report: RetrievalReport, code: RetrievalReport['issues'][number]['code']) {
  expect(report.status).toBe('INVALID')
  expect(report.metrics).toBeNull()
  expect(report.byLanguage).toEqual({ vi: null, en: null })
  expect(report.plannedQueries).toBe(40)
  expect(report.plannedPositive).toBe(33)
  expect(report.plannedNoRelevant).toBe(7)
  expect(report.positiveByLanguage).toEqual({ vi: 17, en: 16 })
  expect(report.issues.some((issue) => issue.code === code)).toBe(true)
  expect(RetrievalReportSchema.safeParse(report).success).toBe(true)
}
beforeEach(() => {
  boundaryAttempts = 0
  vi.stubGlobal('fetch', () => {
    boundaryAttempts++
    throw new Error('UNEXPECTED_NETWORK')
  })
})
afterEach(() => {
  vi.unstubAllGlobals()
  expect(boundaryAttempts).toBe(0)
})

describe('Corpus frozen — nhãn trước ranking', () => {
  it('giữ hash provenance, 26 records/40 query/33 positive và semantic NOT_MEASURED', () => {
    expect(corpus.metadata.frozenDraftSha256).toBe(FROZEN_DRAFT_SHA256)
    expect(corpus.metadata.scoringPlanSha256).toBe(SCORING_PLAN_SHA256)
    expect(corpus.metadata.labelProvenance).toBe('agent_synthetic_review')
    expect(corpus.metadata.humanReview).toBe('NOT_REVIEWED')
    expect(corpus.metadata.semanticQuality).toBe('NOT_MEASURED')
    expect(corpus.metadata.timePolicy).toBe('service_clock_snapshot')
    expect(corpus.records).toHaveLength(26)
    expect(corpus.queries).toHaveLength(40)
    expect(corpus.queries.filter((query) => query.kind === 'positive')).toHaveLength(33)
    expect(corpus.queries.filter((query) => query.language === 'vi')).toHaveLength(20)
    expect(frozenDefinitionHash(corpus)).toBe(FROZEN_DEFINITION_SHA256)
    expect(corpus.records.every((record) => record.seed.confidence === 1)).toBe(true)
  })

  it('metadata thời gian không thay frozen label hash; reordered sets vẫn là cùng nhãn', () => {
    const clone = structuredClone(corpus)
    clone.records.reverse()
    clone.queries.reverse()
    clone.persons.reverse()
    for (const query of clone.queries) {
      query.relevantIds.reverse()
      query.mustExcludeIds.reverse()
    }
    expect(RetrievalCorpusSchema.safeParse(clone).success).toBe(true)
    expect(frozenDefinitionHash(clone)).toBe(FROZEN_DEFINITION_SHA256)
    const revisedMetadata = { ...clone, metadata: { ...clone.metadata, timeContractRevision: 2 } }
    expect(frozenDefinitionHash(revisedMetadata)).toBe(FROZEN_DEFINITION_SHA256)
    expect(RetrievalCorpusSchema.safeParse(revisedMetadata).success).toBe(false)
  })

  it.each(['text', 'relevant', 'exclude', 'duplicate', 'empty', 'language'] as const)(
    'từ chối corpus bị đổi %s, không coi là revision ngầm',
    (mutation) => {
      const clone = structuredClone(corpus)
      if (mutation === 'text') clone.queries[0]!.text += ' changed'
      if (mutation === 'relevant' && clone.queries[0]!.kind === 'positive')
        clone.queries[0]!.relevantIds = ['R03']
      if (mutation === 'exclude') clone.queries[0]!.mustExcludeIds.pop()
      if (mutation === 'duplicate') clone.queries[1]!.key = clone.queries[0]!.key
      if (mutation === 'empty') clone.queries.length = 0
      if (mutation === 'language') clone.queries[0]!.language = 'en'
      expect(RetrievalCorpusSchema.safeParse(clone).success).toBe(false)
    },
  )
})

describe('Metric thuần — observations toy, không output từ search', () => {
  it('Recall tính đủ relevant không có thứ tự và MRR giữ vị trí đầu tiên', () => {
    const rankedIds = ['A', 'x1', 'x2', 'x3', 'x4', 'B', 'x5', 'x6', 'x7', 'x8']
    expect(scoreRelevantSet(['B', 'A'], rankedIds)).toEqual({
      recallAt5: 0.5,
      recallAt10: 1,
      mrrAt10: 1,
    })
    const shuffled = ['x8', 'x1', 'x2', 'x3', 'x4', 'B', 'x5', 'x6', 'x7', 'A']
    expect(scoreRelevantSet(['A', 'B'], shuffled)).toEqual({
      recallAt5: 0,
      recallAt10: 1,
      mrrAt10: 1 / 6,
    })
  })

  it('bỏ relevant khỏi kết quả cho 0; quá top10 không cho MRR hoặc recall10', () => {
    expect(scoreRelevantSet(['A'], [])).toEqual({ recallAt5: 0, recallAt10: 0, mrrAt10: 0 })
    expect(
      scoreRelevantSet(['A'], [...Array.from({ length: 10 }, (_, index) => `x${index}`), 'A']),
    ).toEqual({ recallAt5: 0, recallAt10: 0, mrrAt10: 0 })
    expect(() => scoreRelevantSet([], [])).toThrow('BENCHMARK_NO_RELEVANT_FOR_METRIC')
  })

  it('miss hợp lệ không bị loại mẫu số; macro chỉ chia 33/17/16, không chia 40', () => {
    const fixture = unitFixture()
    okObservation(fixture.observations, 'V03').ranked = [ranked(fixture.snapshot, 'R03')]
    const report = evaluate(fixture)
    expect(report.status).toBe('VALID')
    expect(report.scoredPositive).toBe(33)
    expect(report.hardGuardsChecked).toBe(40)
    expect(report.metrics?.recallAt5).toBeCloseTo(0.5 / 33, 12)
    expect(report.metrics?.mrrAt10).toBeCloseTo(1 / 33, 12)
    expect(report.byLanguage.vi?.recallAt10).toBeCloseTo(0.5 / 17, 12)
    expect(report.byLanguage.en).toEqual({ recallAt5: 0, recallAt10: 0, mrrAt10: 0 })
  })

  it('7 no_relevant có base candidate hợp lệ vẫn VALID, không thêm điểm/mẫu số', () => {
    const fixture = unitFixture()
    for (const query of corpus.queries.filter((item) => item.kind === 'no_relevant')) {
      const candidate = corpus.records.find(
        (record) =>
          record.personKey === query.personKey && !query.mustExcludeIds.includes(record.key),
      )!
      okObservation(fixture.observations, query.key).ranked = [
        ranked(fixture.snapshot, candidate.key),
      ]
    }
    const report = evaluate(fixture)
    expect(report.status).toBe('VALID')
    expect(report.metrics).toEqual({ recallAt5: 0, recallAt10: 0, mrrAt10: 0 })
    expect(report.noRelevant).toHaveLength(7)
    expect(report.observedNoRelevant).toBe(7)
    expect(report.noRelevant.every((item) => item.resultCount === 1 && item.status === 'ok')).toBe(
      true,
    )
  })
})

describe('Run invalid giữ mẫu số và null mọi aggregate', () => {
  it.each(['V01', 'E20'])('query missing %s, kể cả no_relevant, không bị bỏ qua', (key) => {
    const fixture = unitFixture()
    fixture.observations = fixture.observations.filter((item) => item.queryId !== key)
    const report = evaluate(fixture)
    expectInvalid(report, 'MISSING_QUERY')
    expect(report.observedQueries).toBe(39)
    expect(report.missingQueryIds).toContain(key)
  })

  it('duplicate không bị Map overwrite thành một observation xanh', () => {
    const fixture = unitFixture()
    fixture.observations.push(structuredClone(fixture.observations[0]!))
    const report = evaluate(fixture)
    expectInvalid(report, 'DUPLICATE_QUERY')
    expect(report.duplicateQueryIds).toEqual(['V01'])
    expect(report.observedQueries).toBe(41)
  })

  it('unknown query không mở rộng corpus hoặc bị ignore', () => {
    const fixture = unitFixture()
    fixture.observations.push({ ...fixture.observations[0]!, queryId: 'Q404' })
    const report = evaluate(fixture)
    expectInvalid(report, 'UNKNOWN_QUERY')
    expect(report.unknownQueryIds).toEqual(['Q404'])
  })

  it.each(['V01', 'E20'])('DB/query error ở %s làm INVALID, không đổi thành miss', (key) => {
    const fixture = unitFixture()
    const index = fixture.observations.findIndex((item) => item.queryId === key)
    const previous = fixture.observations[index]!
    fixture.observations[index] = QueryObservationSchema.parse({
      version: 1,
      mode: previous.mode,
      queryId: key,
      snapshotHash: previous.snapshotHash,
      configHash: previous.configHash,
      embeddingAttempts: 0,
      embeddingErrors: 0,
      status: 'query_error',
      errorCode: 'db_error',
    })
    const report = evaluate(fixture)
    expectInvalid(report, 'QUERY_ERROR')
    expect(report.queryErrorIds).toContain(key)
    if (key === 'E20')
      expect(report.noRelevant.find((item) => item.queryId === key)?.status).toBe('query_error')
  })

  it.each(['mode', 'snapshotHash', 'configHash'] as const)(
    'observation không được tự chọn expected %s',
    (field) => {
      const fixture = unitFixture()
      const observation = fixture.observations[0]!
      if (field === 'mode') observation.mode = 'embedding_error_fallback'
      else observation[field] = 'b'.repeat(64)
      const report = evaluate(fixture)
      expectInvalid(
        report,
        field === 'mode'
          ? 'MODE_MISMATCH'
          : field === 'snapshotHash'
            ? 'SNAPSHOT_MISMATCH'
            : 'CONFIG_MISMATCH',
      )
    },
  )

  it('config không được lấy now/hash tùy tiện thay snapshot thật được đưa vào scorer', () => {
    const fixture = unitFixture()
    fixture.config.now = '2027-01-01T00:00:00.000Z'
    expectInvalid(evaluate(fixture), 'SNAPSHOT_MISMATCH')
  })

  it.each(['missing', 'duplicateId', 'person', 'content', 'lifecycle', 'touch'] as const)(
    'snapshot lệch %s là fixture invalid',
    (mutation) => {
      const fixture = unitFixture()
      const row = fixture.snapshot.records[0]!
      if (mutation === 'missing') fixture.snapshot.records.pop()
      if (mutation === 'duplicateId') fixture.snapshot.records[1]!.record.id = row.record.id
      if (mutation === 'person') row.record.personId = uuid(101)
      if (mutation === 'content') row.record.content += ' changed'
      if (mutation === 'lifecycle') row.record.status = 'expired'
      if (mutation === 'touch') row.accessCount = 1
      expectInvalid(evaluate(fixture), 'SNAPSHOT_INVALID')
    },
  )

  it('strict schema từ chối NaN/Infinity/unknown field/unknown mode và malformed inputs', () => {
    const fixture = unitFixture()
    const observation = okObservation(fixture.observations, 'V01')
    observation.ranked = [ranked(fixture.snapshot, 'R01')]
    observation.ranked[0]!.score = Number.NaN
    expectInvalid(evaluate(fixture), 'OBSERVATIONS_INVALID')
    observation.ranked[0]!.score = Number.POSITIVE_INFINITY
    expectInvalid(evaluate(fixture), 'OBSERVATIONS_INVALID')
    expect(
      QueryObservationSchema.safeParse({ ...observation, rawError: 'must_not_be_allowed' }).success,
    ).toBe(false)
    expect(
      RetrievalConfigSchema.safeParse({ ...fixture.config, mode: 'semantic_hybrid' }).success,
    ).toBe(false)
    expect(RetrievalConfigSchema.safeParse({ ...fixture.config, touch: true }).success).toBe(false)
    expect(RetrievalConfigSchema.safeParse({ ...fixture.config, qualityFloor: 0 }).success).toBe(
      false,
    )
    expectInvalid(scoreRetrieval(null, null, null, null), 'CORPUS_INVALID')
    expectInvalid(
      scoreRetrieval(corpus, fixture.snapshot, fixture.config, null),
      'OBSERVATIONS_INVALID',
    )
  })
})

describe('Hard guards trên cả 40, kể cả no_relevant', () => {
  it.each([
    { query: 'E17', key: 'R25', reason: 'cross_person' },
    { query: 'V16', key: 'R15', reason: 'sensitivity' },
    { query: 'E01', key: 'R02', reason: 'inactive' },
    { query: 'V17', key: 'R13', reason: 'inactive' },
    { query: 'V18', key: 'R14', reason: 'inactive' },
  ])('$query không được nhận $key ($reason)', ({ query, key, reason }) => {
    const fixture = unitFixture()
    okObservation(fixture.observations, query).ranked = [ranked(fixture.snapshot, key)]
    const report = evaluate(fixture)
    expectInvalid(report, 'HARD_GUARD')
    expect(report.hardGuardsChecked).toBe(40)
    expect(report.hardViolationQueryIds).toContain(query)
    expect(report.issues.some((issue) => issue.queryId === query && issue.reason === reason)).toBe(
      true,
    )
  })

  it.each(['unknown_record', 'record_identity', 'duplicate_record'] as const)(
    'chặn %s, không drop/sửa thứ tự record để chấm',
    (reason) => {
      const fixture = unitFixture()
      const observation = okObservation(fixture.observations, 'V01')
      observation.ranked = [ranked(fixture.snapshot, 'R01')]
      if (reason === 'unknown_record') observation.ranked[0]!.recordKey = 'R99'
      if (reason === 'record_identity') observation.ranked[0]!.recordId = uuid(999)
      if (reason === 'duplicate_record')
        observation.ranked.push(structuredClone(observation.ranked[0]!))
      const report = evaluate(fixture)
      expectInvalid(report, 'HARD_GUARD')
      expect(report.issues.some((issue) => issue.reason === reason)).toBe(true)
    },
  )
})

describe('Embedding fallback có ledger, không semantic quality', () => {
  it('40 fake provider failures có lexical results hợp lệ vẫn được chấm, lỗi embedding báo riêng', () => {
    const report = evaluate(unitFixture('embedding_error_fallback'))
    expect(report.status).toBe('VALID')
    expect(report.embeddingAttempts).toBe(40)
    expect(report.embeddingErrors).toBe(40)
    expect(report.queryErrorIds).toEqual([])
    expect(report.metrics).toEqual({ recallAt5: 0, recallAt10: 0, mrrAt10: 0 })
    expect(corpus.metadata.semanticQuality).toBe('NOT_MEASURED')
  })

  it('tên mode không thay được actual ledger và baseline không được có provider call', () => {
    const fallback = unitFixture('embedding_error_fallback')
    fallback.observations[0]!.embeddingAttempts = 0
    fallback.observations[0]!.embeddingErrors = 0
    expectInvalid(evaluate(fallback), 'FALLBACK_LEDGER_INVALID')
    const lexical = unitFixture()
    lexical.observations[0]!.embeddingAttempts = 1
    expectInvalid(evaluate(lexical), 'FALLBACK_LEDGER_INVALID')
  })

  it('report schema từ chối INVALID mang metrics hoặc VALID thiếu observations', () => {
    const valid = evaluate()
    expect(RetrievalReportSchema.safeParse({ ...valid, status: 'INVALID' }).success).toBe(false)
    expect(RetrievalReportSchema.safeParse({ ...valid, observedQueries: 39 }).success).toBe(false)
    expect(RetrievalReportSchema.safeParse({ ...valid, missingQueryIds: ['V01'] }).success).toBe(
      false,
    )
    expect(RetrievalReportSchema.safeParse({ ...valid, noRelevant: [] }).success).toBe(false)
    expect(RetrievalReportSchema.safeParse({ ...valid, embeddingAttempts: 1 }).success).toBe(false)
    const independent = unitFixture()
    expect(valid.expectedSnapshotHash).toBe(snapshotHash(independent.snapshot))
    expect(valid.expectedConfigHash).toBe(configHash(independent.config))
    expect(valid.now).toBe(NOW)
    expect(valid.plannedPositive).toBe(PLANNED.positive)
  })
})
