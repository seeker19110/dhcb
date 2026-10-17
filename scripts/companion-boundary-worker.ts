// Dedicated child; launcher đã loại inherited provider/PG/debug/preload env trước bootstrap.
import { readFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { randomUUID, createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { Pool } from 'pg'
import { parseBoundaryOptions } from './lib/companionBoundaryCli'
import { BoundaryCorpusSchema } from './lib/companionBoundaryCorpus'
import { runBoundaryEvaluation } from './lib/companionBoundaryEval'
import {
  parseDisposableDatabase,
  preflightDisposableDatabase,
  OwnedFixtureScope,
  FixtureCleanupError,
  type CleanupReport,
} from './lib/companionBoundaryDb'
import { createBoundaryArtifacts } from './lib/companionBoundaryArtifacts'
import { guardBoundaryNetwork } from './lib/companionBoundaryNetwork'
import { executeContextBoundary } from './lib/companionBoundaryFixtures'
import { executeToolBoundary } from './lib/companionBoundaryAuthority'
import { executePromptBoundary, executeStreamBoundary } from './lib/companionBoundaryPure'
import { createBoundaryHttpHarness, type BoundaryHttpHarness } from './lib/companionBoundaryHttp'
import {
  executeRuntimeConsentBoundary,
  snapshotBoundaryDailyUsage,
} from './lib/companionBoundaryRuntime'
import {
  executeConfirmBoundary,
  executeHttpBoundary,
  executeNoteToolBoundary,
} from './lib/companionBoundaryActions'

let mutationPossible = false
async function main() {
  const options = parseBoundaryOptions(
    process.argv.slice(2),
    resolve(import.meta.dirname, 'companion-boundary-corpus.json'),
  )
  const corpusBytes = options.cleanupManifest ? undefined : await readFile(options.corpus)
  const raw: unknown = corpusBytes ? JSON.parse(corpusBytes.toString('utf8')) : undefined
  const corpus = options.cleanupManifest ? undefined : BoundaryCorpusSchema.parse(raw)
  const target = parseDisposableDatabase(
    process.env.STORED_EVAL_DATABASE_URL ?? '',
    options.profile,
    process.env,
  )
  const head = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: resolve(import.meta.dirname, '..'),
    encoding: 'utf8',
  }).trim()
  const sourceFiles = [
    'packages/core-personal/contextEngine.ts',
    'packages/core-personal/companionRuntime.ts',
    'packages/core-personal/companionTools.ts',
    'packages/core-personal/proposedActionService.ts',
    'packages/core-personal/capabilityExecutor.ts',
    'packages/core-personal/companionVisibleText.ts',
    'packages/core-personal/companionPrompt.ts',
    'apps/server/src/api/personal/proposed-actions.ts',
    'scripts/eval-companion-boundary.ts',
    'scripts/companion-boundary-worker.ts',
    ...[
      'companionBoundaryArtifacts',
      'companionBoundaryCli',
      'companionBoundaryCorpus',
      'companionBoundaryEval',
      'companionBoundaryDb',
      'companionBoundaryFixtures',
      'companionBoundaryAuthority',
      'companionBoundaryPure',
      'companionBoundaryNetwork',
      'companionBoundaryHttp',
      'companionBoundaryActions',
      'companionBoundaryRuntime',
      'companionRuntimeConsent',
      'companionRuntimeConsentFixture',
      'providerReplay',
    ].map((name) => `scripts/lib/${name}.ts`),
  ]
  const workingTreeDirty =
    execFileSync('git', ['status', '--porcelain'], {
      cwd: resolve(import.meta.dirname, '..'),
      encoding: 'utf8',
    }).trim().length > 0
  const sourceHashes: Record<string, string> = {}
  for (const file of sourceFiles)
    sourceHashes[file] = createHash('sha256')
      .update(await readFile(resolve(import.meta.dirname, '..', file)))
      .digest('hex')
  await mkdir(options.artifacts, { recursive: true, mode: 0o700 })
  const artifacts = await createBoundaryArtifacts(options.artifacts, randomUUID())
  const network = guardBoundaryNetwork(target.poolConfig.port ?? 0)
  const pool = new Pool(target.poolConfig)
  let scope: OwnedFixtureScope | undefined
  let http: BoundaryHttpHarness | undefined
  let cleanup: CleanupReport | undefined
  let evaluation: Awaited<ReturnType<typeof runBoundaryEvaluation>> | undefined
  let runtime: Awaited<ReturnType<typeof executeRuntimeConsentBoundary>> | undefined
  let setupPassed = false
  let failed = false
  let cleanupOnly = false
  let failureStage = 'preflight'
  let firstFailureStage: string | null = null
  let dailyBefore: string | undefined
  let dailyAfterAccountingPoolClosed = false
  let accountingPoolClosed = false
  try {
    const tables = await preflightDisposableDatabase(pool, target)
    setupPassed = true
    const resume: unknown = options.cleanupManifest
      ? JSON.parse(await readFile(options.cleanupManifest, 'utf8'))
      : undefined
    scope = await OwnedFixtureScope.open(
      pool,
      target,
      (m) => artifacts.write('manifest.json', m),
      resume ? { resume } : {},
    )
    mutationPossible = true
    if (options.cleanupManifest) {
      cleanupOnly = true
    } else {
      if (!corpus) throw new Error('CORPUS_REQUIRED')
      dailyBefore = await snapshotBoundaryDailyUsage(pool)
      failureStage = 'http_setup'
      http = await createBoundaryHttpHarness(target, (port) => network.allowPort(port))
      const activeScope = scope
      const activeHttp = http
      const groups = new Map(corpus.fixtureGroups.map((group) => [group.id, group]))
      failureStage = 'evaluation'
      evaluation = await runBoundaryEvaluation(corpus, async (c) => {
        const group = groups.get(c.fixtureGroupRef)
        if (!group) throw new Error('FIXTURE_GROUP_MISSING')
        switch (c.kind) {
          case 'context_scope':
            return executeContextBoundary(pool, activeScope, group, c)
          case 'tool_authority':
            return executeToolBoundary(pool, activeScope, group, c, tables)
          case 'proposal_confirm':
            return executeConfirmBoundary(pool, activeScope, group, c, tables)
          case 'proposal_http':
            return executeHttpBoundary(pool, activeScope, group, c, tables, activeHttp)
          case 'prompt_wrapping':
            return c.input.surface === 'note_tool'
              ? executeNoteToolBoundary(pool, activeScope, group, c, tables)
              : executePromptBoundary(c)
          case 'stream_surface':
            return executeStreamBoundary(c)
        }
      })
      if (evaluation.exitCode !== 0) {
        failed = true
        firstFailureStage ??= 'evaluation'
      }
      failureStage = 'runtime_consent'
      process.env.ANTHROPIC_API_KEY = `fake-stored-runtime-consent-${randomUUID()}`
      process.env.ANTHROPIC_FAST_MODEL = 'claude-haiku-5-5'
      try {
        runtime = await executeRuntimeConsentBoundary(pool, activeScope, tables, network)
        if (runtime.status !== 'PASSED') {
          failed = true
          firstFailureStage ??= 'runtime_consent'
        }
      } finally {
        delete process.env.ANTHROPIC_API_KEY
        delete process.env.ANTHROPIC_FAST_MODEL
      }
    }
  } catch {
    failed = true
    firstFailureStage ??= failureStage
  } finally {
    try {
      await http?.close()
      accountingPoolClosed = http !== undefined
      if (dailyBefore !== undefined) {
        dailyAfterAccountingPoolClosed =
          accountingPoolClosed && dailyBefore === (await snapshotBoundaryDailyUsage(pool))
        if (!dailyAfterAccountingPoolClosed) {
          failed = true
          firstFailureStage ??= 'accounting_after_pool_close'
        }
      }
    } catch {
      failed = true
      firstFailureStage ??= accountingPoolClosed ? 'accounting_after_pool_close' : 'http_close'
    }
    try {
      if (scope) cleanup = await scope.cleanup()
    } catch (error) {
      failed = true
      firstFailureStage ??= 'cleanup'
      if (error instanceof FixtureCleanupError) cleanup = error.report
    }
    try {
      await pool.end()
    } catch {
      failed = true
      firstFailureStage ??= 'pool_end'
    }
    network.restore()
  }
  const clean =
    cleanup?.status === 'clean' &&
    cleanup.residuals !== null &&
    cleanup.residuals.every((row) => row.count === 0)
  const noNetwork = network.violations === 0
  let sourceUnchanged = true
  for (const file of sourceFiles) {
    try {
      if (
        createHash('sha256')
          .update(await readFile(resolve(import.meta.dirname, '..', file)))
          .digest('hex') !== sourceHashes[file]
      )
        sourceUnchanged = false
    } catch {
      sourceUnchanged = false
    }
  }
  if (!sourceUnchanged) {
    failed = true
    firstFailureStage ??= 'source_changed'
  }
  const complete =
    !failed &&
    clean &&
    noNetwork &&
    (cleanupOnly ||
      (evaluation?.exitCode === 0 &&
        runtime?.status === 'PASSED' &&
        dailyAfterAccountingPoolClosed))
  const report = {
    schemaVersion: 1,
    sourceHead: head,
    sourceHashes,
    workingTreeDirty,
    sourceUnchanged,
    profile: target.profile,
    database: target.database,
    corpusSha256: corpusBytes ? createHash('sha256').update(corpusBytes).digest('hex') : null,
    scope: cleanupOnly ? 'CLEANUP_ONLY' : 'SERVICE_CORPUS_HTTP',
    status: complete ? (cleanupOnly ? 'CLEANUP_COMPLETE' : 'PASSED') : 'FAILED',
    evaluation,
    cleanup: cleanup ?? null,
    networkViolations: network.violations,
    failureStage: complete
      ? null
      : (firstFailureStage ??
        (!clean ? 'cleanup_unverified' : !noNetwork ? 'network' : failureStage)),
    accountingPoolClosed,
    dailyAfterAccountingPoolClosed,
    runtimeConsentWiring: runtime ?? null,
    physicalVoice: 'NOT_MEASURED',
  }
  await artifacts.write('report.json', report)
  console.log(
    JSON.stringify({
      status: report.status,
      scope: report.scope,
      executed: evaluation?.executed ?? 0,
      passed: evaluation?.passed ?? 0,
      failed: evaluation?.failed ?? 0,
      crashed: evaluation?.crashed ?? 0,
      notRun: evaluation?.notRun ?? null,
      cleanup: cleanup?.status ?? 'NOT_VERIFIED',
      networkViolations: network.violations,
      artifacts: artifacts.folder,
    }),
  )
  process.exitCode = complete ? 0 : setupPassed ? 1 : 2
}
main().catch(() => {
  console.error('FAIL: cấu hình/corpus/runner không hợp lệ; không có kết quả nghiệm thu')
  process.exitCode = mutationPossible ? 1 : 2
})
