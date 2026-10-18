// Fixture chỉ cho unit mock; không phải observations/clock/ranking PostgreSQL thật.
import corpusJson from '../memory-retrieval-corpus.json'
import {
  FROZEN_DEFINITION_SHA256,
  RetrievalCorpusSchema,
  RetrievalSnapshotSchema,
  RetrievalConfigSchema,
  QueryObservationSchema,
  snapshotHash,
  configHash,
  type RetrievalMode,
} from './retrievalBenchmarkSchema.js'
import { scoreRetrieval } from './retrievalBenchmarkScorer.js'
import type { RetrievalObservationRun } from './retrievalBenchmarkRunner.js'
export const corpus = RetrievalCorpusSchema.parse(corpusJson)
export const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`
const NOW = '2026-10-17T00:00:00.000Z'
const replacementUuid = (key: string) =>
  uuid(corpus.records.findIndex((row) => row.key === key) + 1)
export function fixture(): RetrievalObservationRun {
  const persons = corpus.persons.map((person, index) => ({
    personKey: person.key,
    personId: uuid(index + 100),
    userId: uuid(index + 200),
  }))
  const snapshot = RetrievalSnapshotSchema.parse({
    version: 1,
    corpusHash: FROZEN_DEFINITION_SHA256,
    timePolicy: 'service_clock_snapshot',
    now: NOW,
    source: {
      gitCommit: 'a'.repeat(40),
      sourceSha256: { 'unit-only': 'b'.repeat(64) },
      postgresVersion: 'MOCK NO PG',
      migrationCount: 1,
      textSearchConfig: 'simple',
    },
    persons,
    records: corpus.records.map((label, index) => ({
      recordKey: label.key,
      accessCount: 0,
      updatedAt:
        label.lifecycle.kind === 'live' ? '2026-10-16T23:59:00.000Z' : '2026-10-16T23:59:30.000Z',
      record: {
        schemaVersion: 2,
        id: uuid(index + 1),
        personId: persons.find((person) => person.personKey === label.personKey)?.personId,
        namespace: label.namespace,
        content: label.content,
        provenance: label.seed.provenance,
        sensitivity: label.sensitivity,
        status: label.lifecycle.kind === 'expired' ? 'expired' : 'accepted',
        version: label.lifecycle.kind === 'live' ? 1 : 2,
        importance: 5,
        createdAt: '2026-10-16T23:59:00.000Z',
        validFrom: '2026-10-16T23:59:00.000Z',
        hasEmbedding: false,
        ...(label.lifecycle.kind === 'invalidated' || label.lifecycle.kind === 'superseded'
          ? { validTo: '2026-10-16T23:59:30.000Z' }
          : {}),
        ...(label.lifecycle.kind === 'superseded'
          ? {
              supersededBy: replacementUuid(label.lifecycle.supersededByKey),
            }
          : {}),
      },
    })),
  })
  const makeConfig = (mode: RetrievalMode) =>
    RetrievalConfigSchema.parse({
      version: 1,
      corpusHash: FROZEN_DEFINITION_SHA256,
      timePolicy: 'service_clock_snapshot',
      snapshotHash: snapshotHash(snapshot),
      now: NOW,
      limit: 10,
      touch: false,
      contextTokenBudget: 4000,
      mode,
      skipSemantic: mode === 'lexical_base',
      embeddingProvider: mode === 'lexical_base' ? 'disabled' : 'rejecting_fake',
    })
  const configs = {
    lexical_base: makeConfig('lexical_base'),
    embedding_error_fallback: makeConfig('embedding_error_fallback'),
  }
  const observationsFor = (mode: RetrievalMode) =>
    corpus.queries.map((query) =>
      QueryObservationSchema.parse({
        version: 1,
        mode,
        queryId: query.key,
        status: 'ok',
        ranked: [],
        snapshotHash: snapshotHash(snapshot),
        configHash: configHash(configs[mode]),
        embeddingAttempts: mode === 'lexical_base' ? 0 : 1,
        embeddingErrors: mode === 'lexical_base' ? 0 : 1,
      }),
    )
  const observations = {
    lexical_base: observationsFor('lexical_base'),
    embedding_error_fallback: observationsFor('embedding_error_fallback'),
  }
  const reports = {
    lexical_base: scoreRetrieval(corpus, snapshot, configs.lexical_base, observations.lexical_base),
    embedding_error_fallback: scoreRetrieval(
      corpus,
      snapshot,
      configs.embedding_error_fallback,
      observations.embedding_error_fallback,
    ),
  }
  return {
    status: 'VALID',
    snapshot,
    snapshotHash: snapshotHash(snapshot),
    clock: { postgresText: '2026-10-17 00:00:00+00', isoMilliseconds: NOW },
    configs,
    observations,
    reports,
    diagnosticReports: reports,
    parity: { status: 'MATCH', queryIds: [] },
    semantic: { status: 'NOT_MEASURED', reason: 'NO_REAL_VECTORS' },
  }
}
