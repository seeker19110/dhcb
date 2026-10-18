// Cổng đo S05; VALID chỉ nói phép đo hợp lệ, không đặt ngưỡng chất lượng.
import { z } from 'zod'
import {
  PLANNED,
  RetrievalSnapshotSchema,
  RetrievalConfigSchema,
  QueryObservationSchema,
  RetrievalReportSchema,
  hashCanonical,
  snapshotHash,
  configHash,
  type RetrievalCorpus,
  type RetrievalSnapshot,
} from './retrievalBenchmarkSchema.js'
import { scoreRetrieval } from './retrievalBenchmarkScorer.js'
import type { RetrievalSeed } from './retrievalBenchmarkRunner.js'
import { FixtureCleanupError, type CleanupReport } from './companionBoundaryDb.js'

export const RETRIEVAL_TOKEN_BUDGET = 4000
export const RETRIEVAL_MODES = ['lexical_base', 'embedding_error_fallback'] as const
export const CONTEXT_IDS = [
  'CTX01-active',
  'CTX02-foreign',
  'CTX03-none',
  'CTX04-wrong_purpose',
  'CTX05-revoked',
  'CTX06-expired',
  'CTX07-public',
  'CTX08-ephemeral',
] as const
const Count = z.number().int().nonnegative().safe()
const Hash = z.string().regex(/^[a-f0-9]{64}$/)
const RunSchema = z
  .object({
    status: z.enum(['VALID', 'INVALID']),
    snapshot: RetrievalSnapshotSchema,
    snapshotHash: Hash,
    clock: z.object({ postgresText: z.string(), isoMilliseconds: z.iso.datetime() }).strict(),
    configs: z
      .object({
        lexical_base: RetrievalConfigSchema,
        embedding_error_fallback: RetrievalConfigSchema,
      })
      .strict(),
    observations: z
      .object({
        lexical_base: z.array(QueryObservationSchema),
        embedding_error_fallback: z.array(QueryObservationSchema),
      })
      .strict(),
    reports: z
      .object({
        lexical_base: RetrievalReportSchema,
        embedding_error_fallback: RetrievalReportSchema,
      })
      .strict()
      .nullable(),
    diagnosticReports: z
      .object({
        lexical_base: RetrievalReportSchema,
        embedding_error_fallback: RetrievalReportSchema,
      })
      .strict(),
    parity: z
      .object({
        status: z.enum(['MATCH', 'MISMATCH', 'INVALID']),
        queryIds: z.array(z.string()),
      })
      .strict(),
    semantic: z
      .object({
        status: z.literal('NOT_MEASURED'),
        reason: z.literal('NO_REAL_VECTORS'),
      })
      .strict(),
  })
  .strict()
type CheckedRun = z.infer<typeof RunSchema>
const ContextSchema = z
  .object({
    status: z.enum(['PASSED', 'FAILED']),
    planned: Count,
    executed: Count,
    passed: Count,
    failed: Count,
    results: z.array(
      z
        .object({
          id: z.string(),
          passed: z.boolean(),
          crashed: z.boolean(),
          failedChecks: z.array(z.string()),
        })
        .strict(),
    ),
  })
  .strict()
type CheckedContext = z.infer<typeof ContextSchema>
const CleanupSchema = z
  .object({
    status: z.enum(['clean', 'failed']),
    residuals: z.array(z.object({ table: z.string().min(1), count: Count }).strict()).nullable(),
    reason: z.string().nullable(),
  })
  .strict()

export function validateRetrievalRun(
  corpus: RetrievalCorpus,
  input: unknown,
  source: RetrievalSnapshot['source'],
): { run: CheckedRun | null; failedChecks: string[] } {
  const parsed = RunSchema.safeParse(input)
  if (!parsed.success) return { run: null, failedChecks: ['measurement_schema'] }
  const run = parsed.data
  const failedChecks: string[] = []
  const fail = (check: string) => failedChecks.push(check)
  if (run.status !== 'VALID') fail('measurement_status')
  if (
    run.snapshotHash !== snapshotHash(run.snapshot) ||
    hashCanonical(run.snapshot.source) !== hashCanonical(source) ||
    Object.keys(source.sourceSha256).length === 0
  )
    fail('measurement_source_snapshot')
  if (
    run.clock.isoMilliseconds !== run.snapshot.now ||
    Date.parse(run.clock.postgresText) !== Date.parse(run.snapshot.now)
  )
    fail('measurement_clock')
  if (run.parity.status !== 'MATCH' || run.parity.queryIds.length) fail('measurement_parity')
  for (const mode of RETRIEVAL_MODES) {
    const config = run.configs[mode]
    const rows = run.observations[mode]
    if (
      config.mode !== mode ||
      config.contextTokenBudget !== RETRIEVAL_TOKEN_BUDGET ||
      config.snapshotHash !== run.snapshotHash ||
      config.now !== run.snapshot.now
    )
      fail(`${mode}_config`)
    if (
      rows.length !== PLANNED.queries ||
      new Set(rows.map((row) => row.queryId)).size !== PLANNED.queries ||
      corpus.queries.some((query) => !rows.some((row) => row.queryId === query.key)) ||
      rows.some(
        (row) =>
          row.status !== 'ok' ||
          row.mode !== mode ||
          row.snapshotHash !== run.snapshotHash ||
          row.configHash !== configHash(config),
      )
    )
      fail(`${mode}_queries`)
    const rescored = scoreRetrieval(corpus, run.snapshot, config, rows)
    if (
      rescored.status !== 'VALID' ||
      !run.reports ||
      run.reports[mode].status !== 'VALID' ||
      hashCanonical(run.diagnosticReports[mode]) !== hashCanonical(rescored) ||
      hashCanonical(run.reports?.[mode] ?? null) !== hashCanonical(rescored)
    )
      fail(`${mode}_scorer`)
  }
  // Kiểm parity độc lập trên actual observations, không chỉ tin status do runner trả.
  const right = new Map(run.observations.embedding_error_fallback.map((row) => [row.queryId, row]))
  if (
    run.observations.lexical_base.some((left) => {
      const other = right.get(left.queryId)
      return (
        left.status !== 'ok' ||
        other?.status !== 'ok' ||
        hashCanonical(left.ranked) !== hashCanonical(other.ranked)
      )
    })
  )
    fail('measurement_parity_rows')
  return { run, failedChecks }
}

export function validateRetrievalContexts(input: unknown): {
  context: CheckedContext | null
  failedChecks: string[]
} {
  const parsed = ContextSchema.safeParse(input)
  if (!parsed.success) return { context: null, failedChecks: ['context_schema'] }
  const context = parsed.data
  const complete =
    context.status === 'PASSED' &&
    context.planned === 8 &&
    context.executed === 8 &&
    context.passed === 8 &&
    context.failed === 0 &&
    context.results.length === 8 &&
    new Set(context.results.map((result) => result.id)).size === 8 &&
    CONTEXT_IDS.every((id) => context.results.some((result) => result.id === id)) &&
    context.results.every(
      (result) => result.passed && !result.crashed && result.failedChecks.length === 0,
    )
  return { context, failedChecks: complete ? [] : ['context_incomplete'] }
}

export interface RetrievalLifecycleOperations {
  seed(): Promise<RetrievalSeed>
  observe(seed: RetrievalSeed): Promise<unknown>
  contexts(): Promise<unknown>
  snapshotDaily(): Promise<string>
  snapshotDailyAfterWorkPoolEnd(): Promise<{
    value: string
    verificationPoolEnded: boolean
  }>
  cleanup(): Promise<CleanupReport>
  end(): Promise<void>
  verifySource(): Promise<boolean>
  networkViolations(): number
  poolErrors(): number
  seedAuditEvidence(): unknown
}

/** Mọi journal/seed/query/context exception đều đi qua cleanup/end; không serialize raw errors. */
export async function runRetrievalLifecycle(
  corpus: RetrievalCorpus | undefined,
  source: RetrievalSnapshot['source'] | undefined,
  operations: RetrievalLifecycleOperations,
  cleanupOnly = false,
) {
  let measurement: CheckedRun | null = null
  let context: CheckedContext | null = null
  let cleanup: CleanupReport | null = null
  const failedChecks: string[] = []
  let stage = 'daily_before'
  let firstFailureStage: string | null = null
  const fail = (check: string) => {
    failedChecks.push(check)
    firstFailureStage ??= stage
  }
  let dailyBefore: string | undefined
  let dailyUnchanged = false
  let poolEnded = false
  let finalSnapshotAfterWorkPoolEnd = false
  let verificationPoolEnded = false
  let sourceUnchanged = false
  try {
    if (!cleanupOnly) {
      if (!corpus || !source) throw new Error('MISSING_INPUT')
      dailyBefore = await operations.snapshotDaily()
      stage = 'seed'
      const seed = await operations.seed()
      stage = 'observe'
      const checked = validateRetrievalRun(corpus, await operations.observe(seed), source)
      measurement = checked.run
      for (const check of checked.failedChecks) fail(check)
      // observe đã await COMMIT/ROLLBACK trước khi helper context nhận writable Pool.
      stage = 'context'
      const checkedContext = validateRetrievalContexts(await operations.contexts())
      context = checkedContext.context
      for (const check of checkedContext.failedChecks) fail(check)
    }
  } catch {
    fail(`${stage}_exception`)
  } finally {
    stage = 'cleanup'
    try {
      cleanup = await operations.cleanup()
    } catch (error) {
      if (error instanceof FixtureCleanupError) cleanup = error.report
      fail('cleanup_exception')
    }
    const parsedCleanup = CleanupSchema.safeParse(cleanup)
    if (
      !parsedCleanup.success ||
      parsedCleanup.data.status !== 'clean' ||
      parsedCleanup.data.reason !== null ||
      parsedCleanup.data.residuals === null ||
      parsedCleanup.data.residuals.length === 0 ||
      parsedCleanup.data.residuals.some((row) => row.count !== 0)
    )
      fail('cleanup_unverified')
    stage = 'pool_end'
    try {
      await operations.end()
      poolEnded = true
    } catch {
      fail('pool_end_exception')
    }
    if (dailyBefore !== undefined && poolEnded) {
      stage = 'daily_after_work_pool_end'
      try {
        const final = await operations.snapshotDailyAfterWorkPoolEnd()
        verificationPoolEnded = final.verificationPoolEnded === true
        finalSnapshotAfterWorkPoolEnd = verificationPoolEnded && typeof final.value === 'string'
        dailyUnchanged = finalSnapshotAfterWorkPoolEnd && dailyBefore === final.value
        if (!dailyUnchanged) fail('daily_changed_or_unverified')
      } catch {
        fail('daily_unverified')
      }
    }
    stage = 'source_after'
    try {
      sourceUnchanged = await operations.verifySource()
    } catch {
      sourceUnchanged = false
    }
    if (!sourceUnchanged) fail('source_changed_or_missing')
  }
  stage = 'network'
  const networkViolations = operations.networkViolations()
  if (!Number.isSafeInteger(networkViolations) || networkViolations !== 0) fail('network_violation')
  stage = 'pool_errors'
  const poolErrors = operations.poolErrors()
  if (!Number.isSafeInteger(poolErrors) || poolErrors !== 0) fail('pool_background_error')
  stage = 'seed_audit_evidence'
  const rankSeedAudit = z
    .object({
      memoryRows: z.literal(26),
      auditEvents: z.literal(29),
      beforeRankValidated: z.literal(true),
      unchangedAfterRank: z.literal(true),
    })
    .strict()
    .safeParse(operations.seedAuditEvidence())
  if (!cleanupOnly && !rankSeedAudit.success) fail('seed_audit_unverified')
  if (!cleanupOnly && (!measurement || !context || !dailyUnchanged)) fail('baseline_incomplete')
  const complete = failedChecks.length === 0 && poolEnded && sourceUnchanged
  const validBaseline = complete && !cleanupOnly
  return {
    status: complete
      ? cleanupOnly
        ? ('CLEANUP_COMPLETE' as const)
        : ('BASELINE_VALID' as const)
      : ('INVALID' as const),
    scope: cleanupOnly ? ('CLEANUP_ONLY' as const) : ('RETRIEVAL_BASELINE' as const),
    planned: {
      queriesPerMode: 40,
      observations: 80,
      positivePerMode: 33,
      noRelevantPerMode: 7,
      positiveByLanguage: { vi: 17, en: 16 },
      noRelevantByLanguage: { vi: 3, en: 4 },
      contextCohorts: 8,
    },
    executed: {
      lexical_base: measurement?.observations.lexical_base.length ?? 0,
      embedding_error_fallback: measurement?.observations.embedding_error_fallback.length ?? 0,
      context: context?.executed ?? 0,
    },
    reports: validBaseline ? (measurement?.reports ?? null) : null,
    // Nếu overall INVALID, không phát metrics của một mode như baseline hợp lệ.
    diagnostics: measurement
      ? Object.fromEntries(
          RETRIEVAL_MODES.map((mode) => [
            mode,
            {
              status: measurement.diagnosticReports[mode].status,
              issues: measurement.diagnosticReports[mode].issues,
              metrics: null,
            },
          ]),
        )
      : null,
    parity: measurement?.parity ?? null,
    context,
    cleanup,
    globalDailyUnchanged: dailyUnchanged,
    explicitPoolEnded: poolEnded,
    finalSnapshotAfterWorkPoolEnd,
    verificationPoolEnded,
    cachedPool: 'NOT_CONFIGURED' as const,
    sourceUnchanged,
    networkViolations,
    poolErrors,
    rankSeedAudit: rankSeedAudit.success ? rankSeedAudit.data : null,
    failedChecks,
    failureStage: complete ? null : firstFailureStage,
    semantic: {
      status: 'NOT_MEASURED' as const,
      reason: 'NO_REAL_VECTORS' as const,
    },
    qualityThreshold: 'NOT_DEFINED' as const,
    exitCode: complete ? 0 : 1,
    measurement: measurement
      ? {
          snapshot: measurement.snapshot,
          snapshotHash: measurement.snapshotHash,
          clock: measurement.clock,
          configs: measurement.configs,
          observations: measurement.observations,
        }
      : null,
  }
}
