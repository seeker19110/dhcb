// Dedicated child: không chạy trực tiếp với env shell/provider của người dùng.
import { readFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { randomUUID, createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { isDeepStrictEqual } from 'node:util'
import { Pool } from 'pg'
import { z } from 'zod'
import { boundaryChildEnvironment, parseBoundaryOptions } from './lib/companionBoundaryCli.js'
import { createBoundaryArtifacts } from './lib/companionBoundaryArtifacts.js'
import { guardBoundaryNetwork } from './lib/companionBoundaryNetwork.js'
import {
  OwnedFixtureScope,
  parseDisposableDatabase,
  preflightDisposableDatabase,
} from './lib/companionBoundaryDb.js'
import { snapshotBoundaryDailyUsage } from './lib/companionBoundaryRuntime.js'
import { RetrievalCorpusSchema, RetrievalSnapshotSchema } from './lib/retrievalBenchmarkSchema.js'
import { seedRetrievalCorpus, observeRetrievalBenchmark } from './lib/retrievalBenchmarkRunner.js'
import { runRetrievalContextProbes } from './lib/retrievalBenchmarkContext.js'
import {
  captureRetrievalClock,
  readRetrievalSeedState,
  assertRetrievalSeedUnchanged,
  type RetrievalSeedState,
} from './lib/retrievalBenchmarkAudit.js'
import { RETRIEVAL_TOKEN_BUDGET, runRetrievalLifecycle } from './lib/retrievalBenchmarkCli.js'

const FROZEN = {
  'scripts/lib/retrievalBenchmarkSchema.ts':
    '2eeb2f42a4e13ce8b1920c28c8856667a399874b14c166832ee30007e95795be',
  'scripts/lib/retrievalBenchmarkScorer.ts':
    'ffd40212e90fa65e6483858577df120a25d30543214d626b148ca3ac1ebedde8',
  'scripts/lib/retrievalBenchmarkRunner.ts':
    '5a79412bc5b95aa00e8b2ee77f19787e8ffc1e0bb7a9c6abf3a14d568c4b1e01',
  // Hash bản portable frozen đã bàn giao: chỉ thay type-only import thành sibling.
  'scripts/lib/retrievalBenchmarkContext.ts':
    '16ce622dfc645238af69b897f9a429f94a4b437d40caae17e5b355a22a63d64d',
} as const
const CORPUS_SHA256 = 'f1e92b3f1f86859765c943b9656bc34fb2c8dafd76c4966a7b967b764e95d6db'
const SOURCE_FILES = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.base.json',
  'tsconfig.api.json',
  'packages/core-personal/memoryRetrieval.ts',
  'packages/core-personal/memoryService.ts',
  'packages/core-personal/vietnameseText.ts',
  'packages/core-personal/contextEngine.ts',
  'packages/core-personal/consentService.ts',
  'packages/core-personal/personService.ts',
  'packages/core-personal/policyService.ts',
  'packages/core-personal/lifeGraphService.ts',
  'packages/core-personal/companionMessageService.ts',
  'packages/core-personal/coreMemoryBlocks.ts',
  'packages/core-ai/embeddings.ts',
  'packages/core-ai/aiTokenUsage.ts',
  'packages/core-db/pgPool.ts',
  'packages/core-db/transaction.ts',
  'packages/core-contracts/personalMemory.ts',
  'packages/core-contracts/personalFact.ts',
  'packages/core-contracts/contextPackage.ts',
  'packages/core-contracts/consentGrant.ts',
  'packages/core-contracts/person.ts',
  'packages/core-contracts/personalPolicy.ts',
  'scripts/eval-memory-retrieval.ts',
  'scripts/retrieval-benchmark-worker.ts',
  'scripts/lib/retrievalBenchmarkCli.ts',
  'scripts/lib/retrievalBenchmarkAudit.ts',
  ...Object.keys(FROZEN),
  ...['Artifacts', 'Cli', 'Db', 'Network', 'Runtime', 'Corpus', 'Fixtures', 'Authority'].map(
    (name) => `scripts/lib/companionBoundary${name}.ts`,
  ),
  'scripts/lib/companionRuntimeConsent.ts',
  'scripts/lib/companionRuntimeConsentFixture.ts',
  'scripts/lib/providerReplay.ts',
]
const Root = resolve(import.meta.dirname, '..')
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')
let mutationPossible = false

async function main() {
  if (Number(process.versions.node.split('.')[0]) !== 22) throw new Error('NODE22_REQUIRED')
  // Không chấp nhận worker bị gọi trực tiếp với extra env hoặc bootstrap preloads.
  if (!isDeepStrictEqual({ ...process.env }, boundaryChildEnvironment(process.env)))
    throw new Error('UNSCRUBBED_ENV')
  const options = parseBoundaryOptions(
    process.argv.slice(2),
    resolve(import.meta.dirname, 'memory-retrieval-corpus.json'),
  )
  const bytes = options.cleanupManifest ? undefined : await readFile(options.corpus)
  const corpusSha256 = bytes ? sha256(bytes) : null
  if (!options.cleanupManifest && corpusSha256 !== CORPUS_SHA256)
    throw new Error('FROZEN_CORPUS_MISMATCH')
  const raw: unknown = bytes ? JSON.parse(bytes.toString('utf8')) : undefined
  const corpus = options.cleanupManifest ? undefined : RetrievalCorpusSchema.parse(raw)
  const target = parseDisposableDatabase(
    process.env.STORED_EVAL_DATABASE_URL ?? '',
    options.profile,
    process.env,
  )
  const sourceHead = z
    .string()
    .regex(/^[a-f0-9]{40}$/)
    .parse(
      execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: Root,
        encoding: 'utf8',
      }).trim(),
    )
  const workingTreeDirty =
    execFileSync('git', ['status', '--porcelain'], {
      cwd: Root,
      encoding: 'utf8',
    }).trim().length > 0
  const sourceHashes: Record<string, string> = {}
  for (const file of SOURCE_FILES) sourceHashes[file] = sha256(await readFile(resolve(Root, file)))
  for (const [file, pin] of Object.entries(FROZEN)) {
    if (sourceHashes[file] !== pin) throw new Error('FROZEN_HELPER_MISMATCH')
  }
  await mkdir(options.artifacts, { recursive: true, mode: 0o700 })
  const runId = randomUUID()
  const artifacts = await createBoundaryArtifacts(options.artifacts, runId)
  const network = guardBoundaryNetwork(target.poolConfig.port ?? 0)
  const pool = new Pool(target.poolConfig)
  let poolErrors = 0
  pool.on('error', () => {
    poolErrors++
  })
  let rankLower: Date | undefined
  let rankBefore: RetrievalSeedState | undefined
  let rankSeedAudit: unknown = null
  let scope: OwnedFixtureScope | undefined
  let setupPassed = false
  let result: Awaited<ReturnType<typeof runRetrievalLifecycle>> | undefined
  try {
    await preflightDisposableDatabase(pool, target)
    const metadata = z
      .array(
        z
          .object({
            postgres_version: z.string().min(1).max(100),
            migration_count: z.string().regex(/^\d+$/),
          })
          .strict(),
      )
      .length(1)
      .parse(
        (
          await pool.query(`select current_setting('server_version') as postgres_version,
        (select count(*)::text from public._schema_migrations) as migration_count`)
        ).rows,
      )[0]
    if (!metadata) throw new Error('SOURCE_METADATA_MISSING')
    const source = RetrievalSnapshotSchema.shape.source.parse({
      gitCommit: sourceHead,
      sourceSha256: sourceHashes,
      postgresVersion: metadata.postgres_version,
      migrationCount: Number(metadata.migration_count),
      textSearchConfig: 'simple',
    })
    const resume: unknown = options.cleanupManifest
      ? JSON.parse(await readFile(options.cleanupManifest, 'utf8'))
      : undefined
    scope = await OwnedFixtureScope.open(
      pool,
      target,
      (manifest) => artifacts.write('manifest.json', manifest),
      options.cleanupManifest ? { resume } : { runId },
    )
    mutationPossible = true
    setupPassed = true
    const ownedScope = scope
    result = await runRetrievalLifecycle(
      corpus,
      source,
      {
        seed: async () => {
          if (!corpus) throw new Error('CORPUS_MISSING')
          rankLower = await captureRetrievalClock(pool)
          const seed = await seedRetrievalCorpus(pool, ownedScope, corpus)
          rankBefore = await readRetrievalSeedState(pool, corpus, seed, rankLower)
          rankSeedAudit = {
            memoryRows: 26,
            auditEvents: 29,
            beforeRankValidated: true,
            unchangedAfterRank: false,
          }
          return seed
        },
        observe: async (seed) => {
          if (!corpus) throw new Error('CORPUS_MISSING')
          if (!rankBefore || !rankLower) throw new Error('AUDIT_PREFLIGHT_MISSING')
          const observed = await observeRetrievalBenchmark(pool, corpus, seed, {
            source,
            contextTokenBudget: RETRIEVAL_TOKEN_BUDGET,
          })
          assertRetrievalSeedUnchanged(
            rankBefore,
            await readRetrievalSeedState(pool, corpus, seed, rankLower),
          )
          rankSeedAudit = {
            memoryRows: 26,
            auditEvents: 29,
            beforeRankValidated: true,
            unchangedAfterRank: true,
          }
          return observed
        },
        contexts: () =>
          runRetrievalContextProbes(pool, ownedScope, {
            tokenBudget: RETRIEVAL_TOKEN_BUDGET,
          }),
        snapshotDaily: () => snapshotBoundaryDailyUsage(pool),
        snapshotDailyAfterWorkPoolEnd: async () => {
          const verification = new Pool(target.poolConfig)
          verification.on('error', () => {
            poolErrors++
          })
          let value: string
          try {
            await preflightDisposableDatabase(verification, target)
            value = await snapshotBoundaryDailyUsage(verification)
          } finally {
            await verification.end()
          }
          return { value, verificationPoolEnded: true }
        },
        cleanup: () => ownedScope.cleanup(),
        end: () => pool.end(),
        verifySource: async () => {
          for (const file of SOURCE_FILES) {
            if (sha256(await readFile(resolve(Root, file))) !== sourceHashes[file]) return false
          }
          return (
            execFileSync('git', ['rev-parse', 'HEAD'], {
              cwd: Root,
              encoding: 'utf8',
            }).trim() === sourceHead
          )
        },
        networkViolations: () => network.violations,
        poolErrors: () => poolErrors,
        seedAuditEvidence: () => rankSeedAudit,
      },
      Boolean(options.cleanupManifest),
    )
  } finally {
    // Lifecycle có finally riêng sau scope.open; setup failure vẫn đóng explicit Pool.
    if (!setupPassed) await pool.end()
    network.restore()
  }
  if (!result) throw new Error('RUN_MISSING')
  const { measurement, ...summary } = result
  if (measurement) await artifacts.write('observations.json', measurement)
  await artifacts.write('report.json', {
    schemaVersion: 1,
    sourceHead,
    sourceHashes,
    workingTreeDirty,
    profile: target.profile,
    database: target.database,
    corpusSha256,
    ...summary,
    labelProvenance: 'agent_synthetic_review',
    humanReview: 'NOT_REVIEWED',
  })
  console.log(
    JSON.stringify({
      status: result.status,
      scope: result.scope,
      executed: result.executed,
      planned: result.planned,
      cleanup: result.cleanup?.status ?? 'NOT_VERIFIED',
      networkViolations: result.networkViolations,
      artifacts: artifacts.folder,
    }),
  )
  process.exitCode = result.exitCode
}
main().catch(() => {
  console.error('FAIL: cấu hình/corpus/source/runner không hợp lệ; chưa có baseline hợp lệ')
  process.exitCode = mutationPossible ? 1 : 2
})
