// @vitest-environment node
// Portable dự kiến scripts/lib/. Chỉ VM module boundaries; không PG/provider/HTTP.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createHash } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import * as zod from 'zod'
import { describe, expect, it } from 'vitest'
const require = createRequire(import.meta.url)
const libRoot = dirname(fileURLToPath(import.meta.url))
const entryRoot = dirname(libRoot)
const source = (name: string) =>
  readFileSync(join(name.startsWith('companionBoundary') ? libRoot : entryRoot, name), 'utf8')
function load<T>(
  name: string,
  modules: Record<string, unknown>,
  globals: Record<string, unknown> = {},
): T {
  const text = source(name).replaceAll(
    'import.meta.dirname',
    JSON.stringify('/synthetic/repo/scripts'),
  )
  const code = ts.transpileModule(text, {
    fileName: name,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  }).outputText
  const module = { exports: {} }
  const context = vm.createContext({
    module,
    exports: module.exports,
    require: (id: string) => {
      if (Object.hasOwn(modules, id)) return modules[id]
      if (id === 'zod') return zod
      if (['node:path', 'node:crypto', 'node:util'].includes(id)) return require(id)
      throw new Error('UNMATCHED_MODULE:' + id)
    },
    console: { log() {}, error() {}, warn() {} },
    setTimeout,
    clearTimeout,
    ...globals,
  })
  vm.runInContext(code, context, { filename: name, timeout: 1000 })
  return module.exports as T
}
const tick = () => new Promise<void>((resolve) => setImmediate(resolve))
const sha = (value: string) => createHash('sha256').update(value).digest('hex')
type Report = {
  status: string
  corpusSha256: string | null
  cleanup: unknown
  networkViolations: number
  accountingPoolClosed: boolean
  dailyAfterAccountingPoolClosed: boolean
  failureStage: string | null
}
async function worker(
  options: {
    preflightThrows?: boolean
    evalThrows?: boolean
    evaluationFails?: boolean
    closeThrows?: boolean
    cleanupThrows?: boolean
    reportThrows?: boolean
    cleanupOnly?: boolean
    violations?: number
    runtimeFails?: boolean
    runtimeThrows?: boolean
    sourceChanges?: boolean
    dirty?: boolean
    delayedAccountingWrite?: boolean
    corpusAccountingWrite?: boolean
    beforeDailyThrows?: boolean
    afterDailyThrows?: boolean
  } = {},
) {
  const events: string[] = []
  const initial = JSON.stringify({ fixtureGroups: [], cases: [], marker: 'A_evaluated' })
  const later = JSON.stringify({ fixtureGroups: [], cases: [], marker: 'B_not_evaluated' })
  let reads = 0
  let evaluated: unknown
  let runtimeSawFakeKey = false
  let dailyReads = 0
  let dailyVersion = 0
  let accountingPoolClosed = false
  let releaseAccounting: (() => void) | undefined
  let pendingAccounting: Promise<void> | undefined
  const sourceReads = new Map<string, number>()
  let report: Report | undefined
  const proc = {
    argv: ['node', 'worker'],
    env: { STORED_EVAL_DATABASE_URL: 'synthetic-explicit' },
    exitCode: undefined as number | undefined,
  }
  const args = {
    profile: 'stored-local',
    artifacts: '/synthetic/artifacts',
    corpus: '/synthetic/corpus.json',
    ...(options.cleanupOnly ? { cleanupManifest: '/synthetic/manifest.json' } : {}),
  }
  class CleanupError extends Error {
    report = { status: 'failed', residuals: null }
  }
  const modules: Record<string, unknown> = {
    'node:fs/promises': {
      readFile: async (file: string, encoding?: string) => {
        if (file === args.corpus) {
          reads++
          const bytes = reads === 1 ? initial : later
          return encoding ? bytes : Buffer.from(bytes)
        }
        if (file === '/synthetic/manifest.json') return '{}'
        const times = (sourceReads.get(file) ?? 0) + 1
        sourceReads.set(file, times)
        return Buffer.from(
          'source-' + file + (options.sourceChanges && times > 1 ? '-changed' : ''),
        )
      },
      mkdir: async () => {},
    },
    'node:child_process': {
      execFileSync: (_cmd: string, args: string[]) =>
        args[0] === 'status' ? (options.dirty ? '?? synthetic.ts' : '') : 'synthetic-head\n',
    },
    pg: {
      Pool: class {
        async end() {
          events.push('pool.end')
        }
      },
    },
    './lib/companionBoundaryCli': { parseBoundaryOptions: () => args },
    './lib/companionBoundaryCorpus': { BoundaryCorpusSchema: { parse: (value: unknown) => value } },
    './lib/companionBoundaryEval': {
      runBoundaryEvaluation: async (corpus: unknown) => {
        evaluated = corpus
        events.push('evaluation')
        if (options.corpusAccountingWrite) {
          dailyVersion++
          events.push('accounting.corpus_write')
        }
        if (options.delayedAccountingWrite) {
          pendingAccounting = new Promise<void>((resolve) => {
            releaseAccounting = resolve
          }).then(() => {
            dailyVersion++
            events.push('accounting.write')
          })
          events.push('accounting.queued')
        }
        if (options.evalThrows) throw new Error('synthetic')
        return {
          exitCode: options.evaluationFails ? 1 : 0,
          executed: 1,
          passed: 1,
          failed: 0,
          crashed: 0,
          notRun: 0,
        }
      },
    },
    './lib/companionBoundaryDb': {
      parseDisposableDatabase: () => ({
        profile: 'stored-local',
        database: 'dhcb_stored_test',
        poolConfig: { port: 56543 },
      }),
      preflightDisposableDatabase: async () => {
        events.push('preflight')
        if (options.preflightThrows) throw new Error('synthetic')
        return []
      },
      OwnedFixtureScope: {
        open: async () => {
          events.push('scope.open')
          return {
            cleanup: async () => {
              events.push('cleanup')
              if (options.cleanupThrows) throw new CleanupError()
              return { status: 'clean', residuals: [{ table: 'own', count: 0 }] }
            },
          }
        },
      },
      FixtureCleanupError: CleanupError,
    },
    './lib/companionBoundaryArtifacts': {
      createBoundaryArtifacts: async () => ({
        folder: '/synthetic/artifacts/run',
        write: async (name: string, value: Report) => {
          if (name === 'report.json') {
            events.push('report')
            if (options.reportThrows) throw new Error('synthetic')
            report = value
          }
        },
      }),
    },
    './lib/companionBoundaryNetwork': {
      guardBoundaryNetwork: () => ({
        violations: options.violations ?? 0,
        allowPort() {
          return () => {}
        },
        restore() {
          events.push('restore')
        },
      }),
    },
    './lib/companionBoundaryFixtures': { executeContextBoundary() {} },
    './lib/companionBoundaryAuthority': { executeToolBoundary() {} },
    './lib/companionBoundaryPure': { executePromptBoundary() {}, executeStreamBoundary() {} },
    './lib/companionBoundaryHttp': {
      createBoundaryHttpHarness: async () => {
        events.push('http.open')
        return {
          close: async () => {
            events.push('http.close')
            if (options.closeThrows) throw new Error('synthetic')
            releaseAccounting?.()
            await pendingAccounting
            accountingPoolClosed = true
            events.push('accounting.pool.closed')
          },
        }
      },
    },
    './lib/companionBoundaryRuntime': {
      snapshotBoundaryDailyUsage: async () => {
        dailyReads++
        events.push(accountingPoolClosed ? 'daily.after_closed' : 'daily.before_closed')
        if (
          (dailyReads === 1 && options.beforeDailyThrows) ||
          (dailyReads > 1 && options.afterDailyThrows)
        )
          throw new Error('SYNTHETIC_DAILY_QUERY')
        return JSON.stringify({ calls: dailyVersion })
      },
      executeRuntimeConsentBoundary: async () => {
        events.push('runtime')
        const fakeKey: unknown = Reflect.get(proc.env, 'ANTHROPIC_API_KEY')
        runtimeSawFakeKey =
          typeof fakeKey === 'string' && /^fake-stored-runtime-consent-/.test(fakeKey)
        if (options.runtimeThrows) throw new Error('SYNTHETIC_RUNTIME')
        return { status: options.runtimeFails ? 'FAILED' : 'PASSED' }
      },
    },
    './lib/companionBoundaryActions': {
      executeConfirmBoundary() {},
      executeHttpBoundary() {},
      executeNoteToolBoundary() {},
    },
  }
  load('companion-boundary-worker.ts', modules, { process: proc })
  for (let i = 0; i < 16; i++) await tick()
  return {
    events,
    reads,
    evaluated,
    report,
    exitCode: proc.exitCode,
    runtimeSawFakeKey,
    dailyReads,
    dailyVersion,
    accountingPoolClosed,
    finalEnvironment: proc.env,
    initialSha: sha(initial),
    laterSha: sha(later),
  }
}
describe('worker source orchestration with faithful fault boundaries', () => {
  it('hashes exactly evaluated bytes once, even if corpus path changes later', async () => {
    const result = await worker()
    expect(result.evaluated).toMatchObject({ marker: 'A_evaluated' })
    expect(result.report?.corpusSha256).toBe(result.initialSha)
    expect(result.report?.corpusSha256).not.toBe(result.laterSha)
    expect(result.reads).toBe(1)
    expect(result.report?.status).toBe('PASSED')
    expect(result.exitCode).toBe(0)
    expect(result.runtimeSawFakeKey).toBe(true)
    expect(result.finalEnvironment).not.toHaveProperty('ANTHROPIC_API_KEY')
    expect(result.finalEnvironment).not.toHaveProperty('ANTHROPIC_FAST_MODEL')
    expect(result.events.indexOf('runtime')).toBeGreaterThan(result.events.indexOf('http.open'))
    expect(result.report).toMatchObject({
      accountingPoolClosed: true,
      dailyAfterAccountingPoolClosed: true,
    })
    expect(result.dailyReads).toBe(2)
    expect(result.events.indexOf('daily.after_closed')).toBeGreaterThan(
      result.events.indexOf('accounting.pool.closed'),
    )
    expect(result.events.indexOf('daily.after_closed')).toBeLessThan(
      result.events.indexOf('cleanup'),
    )
    expect(result.events.slice(-5)).toEqual([
      'daily.after_closed',
      'cleanup',
      'pool.end',
      'restore',
      'report',
    ])
  })
  it.each([
    'evalThrows',
    'evaluationFails',
    'closeThrows',
    'cleanupThrows',
    'reportThrows',
    'runtimeFails',
    'runtimeThrows',
  ] as const)('%s cannot produce exit zero; cleanup and pool end still run', async (fault) => {
    const result = await worker({ [fault]: true })
    expect(result.exitCode).toBe(1)
    expect(result.events).toContain('cleanup')
    expect(result.events).toContain('pool.end')
    expect(result.events).toContain('restore')
    expect(result.report?.status).not.toBe('PASSED')
  })
  it('detects accounting write queued during corpus and completed only by close drain', async () => {
    const result = await worker({ delayedAccountingWrite: true })
    expect(result.dailyVersion).toBe(1)
    expect(result.report?.status).toBe('FAILED')
    expect(result.events.indexOf('accounting.queued')).toBeLessThan(
      result.events.indexOf('runtime'),
    )
    expect(result.events.indexOf('accounting.write')).toBeGreaterThan(
      result.events.indexOf('runtime'),
    )
    expect(result.events.indexOf('accounting.write')).toBeLessThan(
      result.events.indexOf('daily.after_closed'),
    )
    expect(result.report).toMatchObject({
      status: 'FAILED',
      accountingPoolClosed: true,
      dailyAfterAccountingPoolClosed: false,
      failureStage: 'accounting_after_pool_close',
    })
    expect(result.exitCode).toBe(1)
    expect(result.events).toContain('cleanup')
  })
  it('global baseline catches write completed before runtime cohort begins', async () => {
    const result = await worker({ corpusAccountingWrite: true })
    expect(result.events.indexOf('accounting.corpus_write')).toBeLessThan(
      result.events.indexOf('runtime'),
    )
    expect(result.dailyVersion).toBe(1)
    expect(result.report).toMatchObject({
      status: 'FAILED',
      dailyAfterAccountingPoolClosed: false,
      accountingPoolClosed: true,
      failureStage: 'accounting_after_pool_close',
    })
    expect(result.exitCode).toBe(1)
  })
  it('close failure cannot attest drained accounting pool or take post-close snapshot', async () => {
    const result = await worker({ closeThrows: true })
    expect(result.report).toMatchObject({
      status: 'FAILED',
      accountingPoolClosed: false,
      dailyAfterAccountingPoolClosed: false,
      failureStage: 'http_close',
    })
    expect(result.dailyReads).toBe(1)
    expect(result.exitCode).toBe(1)
    expect(result.events).toContain('cleanup')
  })
  it.each(['beforeDailyThrows', 'afterDailyThrows'] as const)(
    '%s fails closed and still cleans scope',
    async (fault) => {
      const result = await worker({ [fault]: true })
      expect(result.report).toMatchObject({
        status: 'FAILED',
        dailyAfterAccountingPoolClosed: false,
      })
      expect(result.exitCode).toBe(1)
      expect(result.events).toContain('cleanup')
      expect(result.events).toContain('pool.end')
      if (fault === 'beforeDailyThrows') expect(result.events).not.toContain('http.open')
      else {
        expect(result.report?.accountingPoolClosed).toBe(true)
        expect(result.report?.failureStage).toBe('accounting_after_pool_close')
      }
    },
  )
  it('keeps evaluation failure stage after runtime passes and later close/cleanup/source failures', async () => {
    const result = await worker({
      evaluationFails: true,
      closeThrows: true,
      cleanupThrows: true,
      sourceChanges: true,
    })
    expect(result.events).toContain('runtime')
    expect(result.report).toMatchObject({ status: 'FAILED', failureStage: 'evaluation' })
    expect(result.exitCode).toBe(1)
  })
  it('keeps first runtime/accounting failure instead of later cleanup failure', async () => {
    const runtime = await worker({ runtimeFails: true, cleanupThrows: true })
    expect(runtime.report?.failureStage).toBe('runtime_consent')
    const accounting = await worker({ delayedAccountingWrite: true, cleanupThrows: true })
    expect(accounting.report?.failureStage).toBe('accounting_after_pool_close')
  })
  it('preflight failure does not open fixture/http; restores/end and exits2', async () => {
    const result = await worker({ preflightThrows: true })
    expect(result.exitCode).toBe(2)
    expect(result.events).not.toContain('scope.open')
    expect(result.events).not.toContain('http.open')
    expect(result.events.slice(-3)).toEqual(['pool.end', 'restore', 'report'])
    expect(result.report?.status).toBe('FAILED')
  })
  it('independent network violation defeats otherwise passing evaluation', async () => {
    const result = await worker({ violations: 1 })
    expect(result.exitCode).toBe(1)
    expect(result.report).toMatchObject({ status: 'FAILED', networkViolations: 1 })
  })
  it('selected source changed during run fails after cleanup; dirty state is reported', async () => {
    const changed = await worker({ sourceChanges: true, dirty: true })
    expect(changed.report).toMatchObject({
      status: 'FAILED',
      sourceUnchanged: false,
      workingTreeDirty: true,
    })
    expect(changed.exitCode).toBe(1)
    expect(changed.events).toContain('cleanup')
    const unchanged = await worker()
    expect(unchanged.report).toMatchObject({ sourceUnchanged: true, workingTreeDirty: false })
  })
  it('cleanup-only neither loads corpus nor creates HTTP/evaluates', async () => {
    const result = await worker({ cleanupOnly: true })
    expect(result.reads).toBe(0)
    expect(result.events).not.toContain('http.open')
    expect(result.events).not.toContain('evaluation')
    expect(result.report).toMatchObject({
      status: 'CLEANUP_COMPLETE',
      corpusSha256: null,
      accountingPoolClosed: false,
      dailyAfterAccountingPoolClosed: false,
    })
    expect(result.dailyReads).toBe(0)
    expect(result.exitCode).toBe(0)
  })
})
interface Cli {
  boundaryChildEnvironment(environment: NodeJS.ProcessEnv): NodeJS.ProcessEnv
  parseBoundaryOptions(args: string[], defaultCorpus: string): unknown
}
const cli = () => load<Cli>('companionBoundaryCli.ts', {})
function launcher(extra: { version?: string; args?: string[] } = {}) {
  const child = new EventEmitter()
  let spawnOptions: Record<string, unknown> | undefined
  const proc = {
    versions: { node: extra.version ?? '22.23.2' },
    argv: [
      'node',
      'launcher',
      ...(extra.args ?? ['--profile', 'stored-local', '--artifacts', '/synthetic']),
    ],
    env: {
      DATABASE_URL: 'private-production',
      ANTHROPIC_API_KEY: 'private-key',
      NODE_OPTIONS: '--require private-preload',
    },
    execPath: '/synthetic/node',
    exitCode: undefined as number | undefined,
  }
  load(
    'eval-companion-boundary.ts',
    {
      'node:child_process': {
        spawn: (_path: string, _args: string[], options: Record<string, unknown>) => {
          spawnOptions = options
          return child
        },
      },
      './lib/companionBoundaryCli': cli(),
    },
    { process: proc },
  )
  return {
    child,
    proc,
    get spawnOptions() {
      return spawnOptions
    },
  }
}
describe('launcher actual source, no actual child boot', () => {
  it('error then native close(-2) retains infrastructure exit2', () => {
    const result = launcher()
    result.child.emit('error', new Error('SYNTHETIC_ENOENT'))
    result.child.emit('close', -2, null)
    expect(result.proc.exitCode).toBe(2)
  })
  it.each([null, -2, -11])('abnormal close %s returns failure1', (code) => {
    const result = launcher()
    result.child.emit('close', code, code === null ? 'SIGTERM' : null)
    expect(result.proc.exitCode).toBe(1)
  })
  it.each([0, 1, 2])('propagates worker exit%s', (code) => {
    const result = launcher()
    result.child.emit('close', code, null)
    expect(result.proc.exitCode).toBe(code)
  })
  it('has12min SIGTERM timeout and scrubs before bootstrap; no prod/preload fallback', () => {
    const result = launcher()
    expect(result.spawnOptions).toMatchObject({ timeout: 720_000, killSignal: 'SIGTERM' })
    expect(result.spawnOptions?.env).toEqual({
      NODE_ENV: 'test',
      STORAGE_DRIVER: 'local',
      NODE_OPTIONS: '--max-old-space-size=4096',
    })
    expect(
      cli().boundaryChildEnvironment({ DATABASE_URL: 'private-production' })
        .STORED_EVAL_DATABASE_URL,
    ).toBeUndefined()
  })
  it('invalid args and Node version fail before spawn', () => {
    const bad = launcher({ args: [] })
    expect(bad.proc.exitCode).toBe(2)
    expect(bad.spawnOptions).toBeUndefined()
    const version = launcher({ version: '20.0.0' })
    expect(version.proc.exitCode).toBe(2)
    expect(version.spawnOptions).toBeUndefined()
  })
})
type Writer = { folder: string; write(name: string, value: unknown): Promise<void> }
type ArtifactModule = { createBoundaryArtifacts(parent: string, runId: string): Promise<Writer> }
describe('artifact journal actual source with fs syscall ledger', () => {
  it('fsyncs new run parent before write, then file/rename/run directory', async () => {
    const events: string[] = []
    const { createBoundaryArtifacts } = load<ArtifactModule>('companionBoundaryArtifacts.ts', {
      'node:fs/promises': {
        mkdir: async (name: string) => {
          events.push('mkdir:' + name)
        },
        open: async (name: string) => ({
          writeFile: async () => {
            events.push('write:' + name)
          },
          sync: async () => {
            events.push('sync:' + name)
          },
          close: async () => {},
        }),
        rename: async () => {
          events.push('rename')
        },
      },
    })
    const writer = await createBoundaryArtifacts(
      '/synthetic/artifacts',
      '11111111-1111-4111-8111-111111111111',
    )
    expect(events).toEqual([
      'mkdir:' + writer.folder,
      'sync:/synthetic/artifacts',
      'sync:/synthetic',
      'sync:/',
    ])
    await writer.write('manifest.json', {})
    expect(events.findIndex((event) => event.startsWith('write:'))).toBeGreaterThan(1)
    expect(events.slice(-2)).toEqual(['rename', 'sync:' + writer.folder])
  })
  it('parent sync failure prevents a writer from being returned', async () => {
    const { createBoundaryArtifacts } = load<ArtifactModule>('companionBoundaryArtifacts.ts', {
      'node:fs/promises': {
        mkdir: async () => {},
        open: async () => ({
          sync: async () => {
            throw new Error('FS_FAIL')
          },
          close: async () => {},
        }),
      },
    })
    await expect(
      createBoundaryArtifacts('/synthetic/artifacts', '11111111-1111-4111-8111-111111111111'),
    ).rejects.toThrow('FS_FAIL')
  })
  it('timeout settles without more filesystem I/O; poison forbids later journals', async () => {
    let timeout: (() => void) | undefined
    let calls = 0
    const { createBoundaryArtifacts } = load<ArtifactModule>(
      'companionBoundaryArtifacts.ts',
      {
        'node:fs/promises': {
          mkdir: async () => {},
          open: async (name: string) => {
            calls++
            if (!name.endsWith('.tmp')) return { sync: async () => {}, close: async () => {} }
            return new Promise(() => {})
          },
          unlink: async () => {
            calls++
            return new Promise(() => {})
          },
          rename: async () => {},
        },
      },
      {
        setTimeout: (callback: () => void) => {
          timeout = callback
          return 1
        },
        clearTimeout() {},
      },
    )
    const writer = await createBoundaryArtifacts(
      '/synthetic/artifacts',
      '11111111-1111-4111-8111-111111111111',
    )
    const writing = writer.write('manifest.json', {})
    expect(timeout).toBeTypeOf('function')
    timeout?.()
    await expect(writing).rejects.toThrow('ARTIFACT_PERSIST_FAILED')
    const atFailure = calls
    await expect(writer.write('report.json', {})).rejects.toThrow('ARTIFACT_WRITER_INVALID_OR_BUSY')
    expect(calls).toBe(atFailure)
  })
})
interface NetworkGuard {
  readonly violations: number
  allowPort(port: number): () => void
  withFetchResponder<T>(responder: typeof fetch, operation: () => Promise<T>): Promise<T>
  restore(): void
}
function network() {
  const allowed: unknown[][] = []
  class FakeSocket {
    connect(...args: unknown[]) {
      allowed.push(args)
      return this
    }
  }
  const original = FakeSocket.prototype.connect
  const initialFetch = async () => new Response('original-unused')
  const global = { fetch: initialFetch }
  const { guardBoundaryNetwork } = load<{ guardBoundaryNetwork(port: number): NetworkGuard }>(
    'companionBoundaryNetwork.ts',
    { 'node:net': { Socket: FakeSocket } },
    { globalThis: global },
  )
  const guard = guardBoundaryNetwork(56543)
  return { guard, global, initialFetch, FakeSocket, original, allowed }
}
describe('network guard actual source, fake original socket only', () => {
  it('denies unmatched fetch/TCP path/lookup/host before original connect; ledger survives catch', async () => {
    const n = network()
    try {
      await n.global.fetch().catch(() => undefined)
      expect(n.guard.violations).toBe(1)
      const socket = new n.FakeSocket()
      for (const input of [
        { host: 'untrusted.invalid', port: 56543 },
        { host: '127.0.0.1', port: 56543, path: '/tmp/forbidden' },
        { host: 'localhost', port: 56543, lookup() {} },
      ])
        expect(() => socket.connect(input)).toThrow('BOUNDARY_NETWORK_DENIED')
      expect(n.allowed).toHaveLength(0)
      expect(n.guard.violations).toBe(4)
      socket.connect({ host: '127.0.0.1', port: 56543, path: null, lookup: null })
      expect(n.allowed).toHaveLength(1)
    } finally {
      n.guard.restore()
    }
    expect(n.global.fetch).toBe(n.initialFetch)
    expect(n.FakeSocket.prototype.connect).toBe(n.original)
  })
  it('own listener refcounts revoke without revoking database port', () => {
    const n = network()
    try {
      const first = n.guard.allowPort(31337)
      const second = n.guard.allowPort(31337)
      first()
      first()
      new n.FakeSocket().connect({ host: '127.0.0.1', port: 31337 })
      second()
      expect(() => new n.FakeSocket().connect({ host: '127.0.0.1', port: 31337 })).toThrow(
        'BOUNDARY_NETWORK_DENIED',
      )
      new n.FakeSocket().connect({ host: '127.0.0.1', port: 56543 })
      expect(n.allowed).toHaveLength(2)
    } finally {
      n.guard.restore()
    }
    expect(() => n.guard.allowPort(31337)).toThrow('BOUNDARY_NETWORK_CLOSED')
  })
  it('scoped responder is cleared after throw; restore during active scope rejected', async () => {
    const n = network()
    try {
      await expect(
        n.guard.withFetchResponder(
          async () => new Response('synthetic'),
          async () => {
            expect(() => n.guard.restore()).toThrow('BOUNDARY_FETCH_BUSY')
            expect(await (await n.global.fetch()).text()).toBe('synthetic')
            throw new Error('SYNTHETIC_OPERATION_FAILURE')
          },
        ),
      ).rejects.toThrow('SYNTHETIC_OPERATION_FAILURE')
      await n.global.fetch().catch(() => undefined)
      expect(n.guard.violations).toBe(1)
    } finally {
      n.guard.restore()
    }
  })
})
