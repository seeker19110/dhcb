// Chấm observations đã thu thập; không gọi search, DB hoặc provider để tạo thứ tự kết quả.
import { z } from 'zod'
import {
  FROZEN_DEFINITION_SHA256,
  PLANNED,
  QueryObservationSchema,
  RetrievalConfigSchema,
  RetrievalCorpusSchema,
  RetrievalReportSchema,
  RetrievalSnapshotSchema,
  SENSITIVITY_ORDER,
  configHash,
  snapshotHash,
  type CorpusQuery,
  type QueryObservation,
  type RetrievalCorpus,
  type RetrievalMetrics,
  type RetrievalReport,
  type RetrievalSnapshot,
} from './retrievalBenchmarkSchema.js'

type OkObservation = Extract<QueryObservation, { status: 'ok' }>
type HardReason = NonNullable<RetrievalReport['issues'][number]['reason']>

/** Bài toán tập relevant không có thứ tự; thứ tự ranked được giữ nguyên. */
export function scoreRelevantSet(
  relevantIds: readonly string[],
  rankedIds: readonly string[],
): RetrievalMetrics {
  const relevant = new Set(relevantIds)
  if (relevant.size === 0) throw new TypeError('BENCHMARK_NO_RELEVANT_FOR_METRIC')
  const recall = (limit: number) =>
    [...new Set(rankedIds.slice(0, limit))].filter((key) => relevant.has(key)).length /
    relevant.size
  const first = rankedIds.slice(0, 10).findIndex((key) => relevant.has(key))
  return { recallAt5: recall(5), recallAt10: recall(10), mrrAt10: first < 0 ? 0 : 1 / (first + 1) }
}
function mean(rows: readonly RetrievalMetrics[], planned: number): RetrievalMetrics {
  const sum = (key: keyof RetrievalMetrics) => rows.reduce((total, row) => total + row[key], 0)
  return {
    recallAt5: sum('recallAt5') / planned,
    recallAt10: sum('recallAt10') / planned,
    mrrAt10: sum('mrrAt10') / planned,
  }
}
function initialReport(): RetrievalReport {
  return {
    version: 1,
    mode: null,
    expectedSnapshotHash: null,
    expectedConfigHash: null,
    now: null,
    corpusHash: FROZEN_DEFINITION_SHA256,
    status: 'INVALID',
    plannedQueries: PLANNED.queries,
    plannedPositive: PLANNED.positive,
    plannedNoRelevant: PLANNED.noRelevant,
    positiveByLanguage: { ...PLANNED.positiveByLanguage },
    noRelevantByLanguage: { ...PLANNED.noRelevantByLanguage },
    observedQueries: 0,
    scoredPositive: 0,
    observedNoRelevant: 0,
    hardGuardsChecked: 0,
    missingQueryIds: [],
    duplicateQueryIds: [],
    unknownQueryIds: [],
    queryErrorIds: [],
    hardViolationQueryIds: [],
    embeddingAttempts: 0,
    embeddingErrors: 0,
    issues: [],
    metrics: null,
    byLanguage: { vi: null, en: null },
    noRelevant: [],
  }
}

/** Đối chiếu snapshot do runner lấy từ service/PG, không tự coi JSON là bằng chứng PG thật. */
function snapshotMatchesCorpus(corpus: RetrievalCorpus, snapshot: RetrievalSnapshot): boolean {
  const persons = new Map(snapshot.persons.map((person) => [person.personKey, person]))
  const rows = new Map(snapshot.records.map((row) => [row.recordKey, row]))
  if (
    persons.size !== 3 ||
    rows.size !== 26 ||
    new Set(snapshot.persons.map((person) => person.personId)).size !== 3 ||
    new Set(snapshot.persons.map((person) => person.userId)).size !== 3 ||
    new Set(snapshot.records.map((row) => row.record.id)).size !== 26
  )
    return false
  for (const label of corpus.records) {
    const row = rows.get(label.key)
    const owner = persons.get(label.personKey)
    if (!row || !owner) return false
    const record = row.record
    if (
      record.personId !== owner.personId ||
      record.namespace !== label.namespace ||
      record.content !== label.content ||
      record.provenance !== label.seed.provenance ||
      record.sensitivity !== label.sensitivity ||
      record.importance !== label.seed.importance ||
      record.hasEmbedding ||
      row.accessCount !== 0 ||
      record.lastAccessedAt !== undefined ||
      record.retainUntil !== undefined ||
      record.mergedFromId !== undefined ||
      record.sourceMessageId !== undefined
    )
      return false
    const kind = label.lifecycle.kind
    if (
      record.status !== (kind === 'expired' ? 'expired' : 'accepted') ||
      record.version !== (kind === 'live' ? 1 : 2)
    )
      return false
    if (kind === 'live' || kind === 'expired') {
      if (record.validTo !== undefined || record.supersededBy !== undefined) return false
    } else {
      if (record.validTo === undefined) return false
      if (kind === 'invalidated' && record.supersededBy !== undefined) return false
      if (
        label.lifecycle.kind === 'superseded' &&
        record.supersededBy !== rows.get(label.lifecycle.supersededByKey)?.record.id
      )
        return false
    }
  }
  return true
}
function hardViolations(
  query: CorpusQuery,
  observation: OkObservation,
  snapshot: RetrievalSnapshot,
): HardReason[] {
  const rows = new Map(snapshot.records.map((row) => [row.recordKey, row.record]))
  const person = snapshot.persons.find((owner) => owner.personKey === query.personKey)
  const seen = new Set<string>()
  const reasons = new Set<HardReason>()
  for (const result of observation.ranked) {
    if (
      seen.has(result.recordKey) ||
      observation.ranked.filter((item) => item.recordId === result.recordId).length > 1
    )
      reasons.add('duplicate_record')
    seen.add(result.recordKey)
    const record = rows.get(result.recordKey)
    if (!record) {
      reasons.add('unknown_record')
      continue
    }
    if (record.id !== result.recordId) reasons.add('record_identity')
    if (record.personId !== person?.personId) reasons.add('cross_person')
    if (record.status === 'expired' || record.validTo !== undefined) reasons.add('inactive')
    if (
      SENSITIVITY_ORDER.indexOf(record.sensitivity) >
      SENSITIVITY_ORDER.indexOf(query.maxSensitivity)
    )
      reasons.add('sensitivity')
    if (query.mustExcludeIds.includes(result.recordKey)) reasons.add('explicit_exclusion')
  }
  return [...reasons]
}

/**
 * Input không tin cậy đi qua Zod. INVALID luôn giữ mẫu số planned và null mọi aggregate.
 * VALID chỉ có nghĩa observations hợp lệ để chấm, không phải quality floor/consent/cleanup đạt.
 */
export function scoreRetrieval(
  corpusInput: unknown,
  snapshotInput: unknown,
  configInput: unknown,
  observationsInput: unknown,
): RetrievalReport {
  const report = initialReport()
  const corpusParsed = RetrievalCorpusSchema.safeParse(corpusInput)
  const snapshotParsed = RetrievalSnapshotSchema.safeParse(snapshotInput)
  const configParsed = RetrievalConfigSchema.safeParse(configInput)
  const arrayParsed = z.array(z.unknown()).safeParse(observationsInput)
  if (!corpusParsed.success) report.issues.push({ code: 'CORPUS_INVALID' })
  if (!snapshotParsed.success) report.issues.push({ code: 'SNAPSHOT_INVALID' })
  if (!configParsed.success) report.issues.push({ code: 'CONFIG_INVALID' })
  if (!arrayParsed.success) report.issues.push({ code: 'OBSERVATIONS_INVALID' })
  if (configParsed.success) report.mode = configParsed.data.mode
  if (arrayParsed.success) report.observedQueries = arrayParsed.data.length
  if (!corpusParsed.success || !snapshotParsed.success || !configParsed.success)
    return RetrievalReportSchema.parse(report)
  const corpus = corpusParsed.data
  const snapshot = snapshotParsed.data
  const config = configParsed.data
  if (!snapshotMatchesCorpus(corpus, snapshot)) report.issues.push({ code: 'SNAPSHOT_INVALID' })
  const expectedSnapshotHash = snapshotHash(snapshot)
  const expectedConfigHash = configHash(config)
  report.expectedSnapshotHash = expectedSnapshotHash
  report.expectedConfigHash = expectedConfigHash
  report.now = snapshot.now
  if (config.snapshotHash !== expectedSnapshotHash || config.now !== snapshot.now)
    report.issues.push({ code: 'SNAPSHOT_MISMATCH' })
  if (
    report.issues.some(
      (issue) => issue.code === 'SNAPSHOT_INVALID' || issue.code === 'SNAPSHOT_MISMATCH',
    )
  )
    return RetrievalReportSchema.parse(report)

  const expected = new Map(corpus.queries.map((query) => [query.key, query]))
  const grouped = new Map<string, QueryObservation[]>()
  for (const [index, input] of (arrayParsed.success ? arrayParsed.data : []).entries()) {
    const parsed = QueryObservationSchema.safeParse(input)
    if (!parsed.success) {
      report.issues.push({ code: 'OBSERVATIONS_INVALID', observationIndex: index })
      continue
    }
    const observation = parsed.data
    report.embeddingAttempts += observation.embeddingAttempts
    report.embeddingErrors += observation.embeddingErrors
    if (observation.mode !== config.mode)
      report.issues.push({ code: 'MODE_MISMATCH', queryId: observation.queryId })
    if (observation.snapshotHash !== expectedSnapshotHash)
      report.issues.push({ code: 'SNAPSHOT_MISMATCH', queryId: observation.queryId })
    if (observation.configHash !== expectedConfigHash)
      report.issues.push({ code: 'CONFIG_MISMATCH', queryId: observation.queryId })
    const invalidLedger =
      config.mode === 'lexical_base'
        ? observation.embeddingAttempts !== 0 || observation.embeddingErrors !== 0
        : observation.embeddingAttempts > 1 ||
          observation.embeddingErrors > observation.embeddingAttempts ||
          (observation.status === 'ok' &&
            (observation.embeddingAttempts !== 1 || observation.embeddingErrors !== 1))
    if (invalidLedger)
      report.issues.push({ code: 'FALLBACK_LEDGER_INVALID', queryId: observation.queryId })
    if (!expected.has(observation.queryId)) {
      if (!report.unknownQueryIds.includes(observation.queryId))
        report.unknownQueryIds.push(observation.queryId)
      report.issues.push({ code: 'UNKNOWN_QUERY', queryId: observation.queryId })
      continue
    }
    const group = grouped.get(observation.queryId) ?? []
    group.push(observation)
    grouped.set(observation.queryId, group)
  }

  const quality: { vi: RetrievalMetrics[]; en: RetrievalMetrics[] } = { vi: [], en: [] }
  for (const query of corpus.queries) {
    const group = grouped.get(query.key) ?? []
    const noRelevant: RetrievalReport['noRelevant'][number] = {
      queryId: query.key,
      resultCount: null,
      status: 'missing',
      hardViolations: [],
    }
    if (group.length === 0) {
      report.missingQueryIds.push(query.key)
      report.issues.push({ code: 'MISSING_QUERY', queryId: query.key })
    } else if (group.length > 1) {
      report.duplicateQueryIds.push(query.key)
      report.issues.push({ code: 'DUPLICATE_QUERY', queryId: query.key })
      noRelevant.status = 'duplicate'
    } else {
      const observation = group[0]!
      if (query.kind === 'no_relevant') report.observedNoRelevant++
      if (observation.status === 'query_error') {
        report.queryErrorIds.push(query.key)
        report.issues.push({ code: 'QUERY_ERROR', queryId: query.key })
        noRelevant.status = 'query_error'
      } else {
        report.hardGuardsChecked++
        const violations = hardViolations(query, observation, snapshot)
        noRelevant.status = 'ok'
        noRelevant.resultCount = observation.ranked.length
        noRelevant.hardViolations = violations
        if (violations.length > 0) {
          report.hardViolationQueryIds.push(query.key)
          for (const reason of violations)
            report.issues.push({ code: 'HARD_GUARD', queryId: query.key, reason })
        } else if (query.kind === 'positive') {
          quality[query.language].push(
            scoreRelevantSet(
              query.relevantIds,
              observation.ranked.map((result) => result.recordKey),
            ),
          )
          report.scoredPositive++
        }
      }
    }
    if (query.kind === 'no_relevant') report.noRelevant.push(noRelevant)
  }
  if (report.issues.length === 0) {
    report.status = 'VALID'
    report.metrics = mean([...quality.vi, ...quality.en], PLANNED.positive)
    report.byLanguage = {
      vi: mean(quality.vi, PLANNED.positiveByLanguage.vi),
      en: mean(quality.en, PLANNED.positiveByLanguage.en),
    }
  }
  return RetrievalReportSchema.parse(report)
}
