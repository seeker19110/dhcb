// @vitest-environment node
// Adapter/trace/accounting/context thật; chỉ HTTP, PG và các nguồn context phụ được giả.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Pool } from 'pg'
import { z } from 'zod'
import {
  CompanionTraceSpanSchema,
  unknownTraceUsage,
  type CompanionTraceSpan,
} from '@dhcb/core-contracts/companionTrace'
import { traceCompanionTurn, withTraceStage, type TraceSink } from '@dhcb/core-db/turnTrace'
import { buildContextPackage } from '@dhcb/core-personal/contextEngine'
import {
  EMBEDDING_DIMENSIONS,
  embedForStorage,
  embedQuery,
  getEmbeddingProvider,
} from './embeddings.js'
import { callGemini } from './geminiApi.js'

const boundaries = vi.hoisted(() => ({
  getPgPool: vi.fn<() => Pool>(),
  consent: vi.fn<(...args: unknown[]) => Promise<boolean>>(),
  authority: vi.fn<(...args: unknown[]) => Promise<null>>(),
  empty: vi.fn<(...args: unknown[]) => Promise<never[]>>(),
  summary: vi.fn<(...args: unknown[]) => Promise<null>>(),
}))
vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: boundaries.getPgPool }))
vi.mock('@dhcb/core-personal/consentService', () => ({
  isConsentActive: boundaries.consent,
}))
vi.mock('@dhcb/core-personal/policyService', () => ({
  resolveAuthority: boundaries.authority,
}))
vi.mock('@dhcb/core-personal/lifeGraphService', () => ({
  listNodes: boundaries.empty,
}))
vi.mock('@dhcb/core-personal/personService', () => ({
  listFacts: boundaries.empty,
}))
vi.mock('@dhcb/core-personal/coreMemoryBlocks', () => ({
  listCoreBlocks: boundaries.empty,
  getConversationSummary: boundaries.summary,
}))

const CANARY = 'SYNTHETIC_PRIVATE_EMBED_QUERY_KEY_CANARY'
const PERSON = '11111111-1111-4111-8111-111111111111'
const pools: Pool[] = []
const boundaryFailures: string[] = []
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
function vector() {
  return Array.from({ length: EMBEDDING_DIMENSIONS }, () => 2)
}
function response(count = 1) {
  return json({
    embeddings: Array.from({ length: count }, () => ({ values: vector() })),
  })
}
function poolBoundary(allowedSql: RegExp) {
  // Không có kết nối: query được thay trước mọi call, thông số đều là dữ liệu tổng hợp.
  const pool = new Pool({
    host: '127.0.0.1',
    port: 1,
    user: 'synthetic',
    password: 'not-a-secret',
    database: 'never_connect',
  })
  pools.push(pool)
  const query = vi.spyOn(pool, 'query').mockImplementation((text) => {
    if (!allowedSql.test(text)) {
      boundaryFailures.push('unexpected_sql')
      throw new Error('UNEXPECTED_SQL_BOUNDARY')
    }
    const insert = text.trimStart().startsWith('insert')
    return Promise.resolve({
      rows: [],
      rowCount: insert ? 1 : 0,
      command: insert ? 'INSERT' : 'SELECT',
      fields: [],
      oid: 0,
    })
  })
  return { pool, query }
}
let accounting: ReturnType<typeof poolBoundary>
function dailyCalls() {
  return accounting.query.mock.calls.map((call) => ({
    sql: call[0],
    values: z.array(z.unknown()).parse(call[1]),
  }))
}
function provider(fetchImpl: typeof fetch, timeoutMs?: number) {
  return getEmbeddingProvider({
    env: { GEMINI_API_KEY: CANARY },
    fetchImpl,
    ...(timeoutMs === undefined ? {} : { timeoutMs }),
  })!
}
async function traced<T>(
  action: () => Promise<T>,
  enabled = true,
  sinkBehavior: 'collect' | 'throw' | 'reject' = 'collect',
) {
  const events: CompanionTraceSpan[] = []
  const sink = vi.fn<TraceSink>((span) => {
    events.push(CompanionTraceSpanSchema.parse(span))
    if (sinkBehavior === 'throw') throw new Error(CANARY)
    if (sinkBehavior === 'reject') return Promise.reject(new Error(CANARY))
  })
  let clock = 0
  const result = await traceCompanionTurn(action, {
    enabled,
    clock: () => clock++,
    sink,
  })
  if (enabled) {
    await vi.waitFor(() => expect(events.some((e) => e.stage === 'turn')).toBe(true), {
      interval: 5,
    })
  } else await new Promise<void>((resolve) => setImmediate(resolve))
  expect(JSON.stringify(events)).not.toContain(CANARY)
  expect(JSON.stringify(events)).not.toContain(PERSON)
  expect(events.every((event) => event.durationMs >= 0 && Number.isFinite(event.durationMs))).toBe(
    true,
  )
  return {
    result,
    events,
    sink,
    root: events.find((event) => event.stage === 'turn'),
    attempts: events.filter((event) => event.stage === 'http_attempt'),
    logical: events.filter((event) => event.stage === 'model_call'),
  }
}
function requestFingerprint(fetchImpl: ReturnType<typeof vi.fn<typeof fetch>>) {
  return fetchImpl.mock.calls.map(([url, init]) => ({
    url: String(url),
    method: init?.method,
    headers: [...new Headers(init?.headers)],
    body: init?.body,
    hasAbortSignal: init?.signal instanceof AbortSignal,
  }))
}
function expectUnknownAttempt(attempt: CompanionTraceSpan | undefined) {
  expect(attempt).toMatchObject({
    stage: 'http_attempt',
    provider: 'gemini',
    model: 'unknown',
    attempt: 1,
    usage: unknownTraceUsage(),
    costUsd: null,
  })
}
beforeEach(() => {
  vi.clearAllMocks()
  boundaryFailures.length = 0
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-16T00:00:00.000Z'))
  vi.stubEnv('COMPANION_TRACE_ENABLED', '')
  vi.stubEnv('AI_DAILY_BUDGET_USD', '')
  vi.stubEnv('GEMINI_API_KEY', CANARY)
  vi.stubEnv('GEMINI_EMBEDDING_MODEL', 'gemini-embedding-2')
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(async () => {
      boundaryFailures.push('unexpected_http')
      throw new Error('UNEXPECTED_NETWORK_BOUNDARY')
    }),
  )
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  boundaries.consent.mockResolvedValue(true)
  boundaries.authority.mockResolvedValue(null)
  boundaries.empty.mockResolvedValue([])
  boundaries.summary.mockResolvedValue(null)
  accounting = poolBoundary(/insert into platform\.ai_token_usage_daily/)
  boundaries.getPgPool.mockReturnValue(accounting.pool)
})
afterEach(async () => {
  await new Promise<void>((resolve) => setImmediate(resolve))
  await Promise.all(pools.splice(0).map((pool) => pool.end()))
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  vi.useRealTimers()
  expect(boundaryFailures).toEqual([])
})

describe('Trace embedding — adapter thật, không provider có phí', () => {
  it('trace off/on giữ request, vector và daily accounting, không đọc kép JSON', async () => {
    async function run(enabled: boolean) {
      accounting.query.mockClear()
      const body = response()
      const readJson = vi.spyOn(body, 'json')
      const fetchImpl = vi.fn<typeof fetch>(async () => body)
      const out = await traced(() => embedQuery(CANARY, provider(fetchImpl)), enabled)
      expect(fetchImpl).toHaveBeenCalledTimes(1)
      expect(readJson).toHaveBeenCalledTimes(1)
      expect(out.result).toHaveLength(EMBEDDING_DIMENSIONS)
      expect(dailyCalls()).toHaveLength(1)
      return {
        ...out,
        requests: requestFingerprint(fetchImpl),
        daily: dailyCalls(),
      }
    }
    const off = await run(false)
    const on = await run(true)
    expect(off.sink).not.toHaveBeenCalled()
    expect(on.result).toEqual(off.result)
    expect(on.requests).toEqual(off.requests)
    expect(on.daily).toEqual(off.daily)
    expect(on.daily[0]?.values.slice(1, 4)).toEqual(['gemini', 'gemini-embedding-2', 'embedding'])
    expect(on.daily[0]?.values[4]).toBeGreaterThan(0)
    expect(on.attempts).toHaveLength(1)
    expectUnknownAttempt(on.attempts[0])
  })

  it('embedding-only có một attempt unknown, tổng không thể thành 0 đã đo', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => response())
    const out = await traced(() =>
      withTraceStage('context', () => embedQuery(CANARY, provider(fetchImpl))),
    )
    expect(out.attempts).toHaveLength(1)
    expect(out.logical).toHaveLength(1)
    expectUnknownAttempt(out.attempts[0])
    expect(out.attempts[0]).toMatchObject({
      status: 'success',
      httpStatus: 200,
    })
    expect(out.logical[0]?.status).toBe('success')
    expect(out.attempts[0]?.parentSpanId).toBe(out.logical[0]?.spanId)
    const context = out.events.find((event) => event.stage === 'context')
    expect(out.logical[0]?.parentSpanId).toBe(context?.spanId)
    expect(out.root?.summary).toMatchObject({
      callCount: 1,
      unknownCallCount: 1,
      openCallCount: 0,
      openModelCallCount: 0,
      observedCostUsd: 0,
      totalCostUsd: null,
    })
  })

  it('mixed chat + embedding giữ observed chat cost, total chuyển unknown và không double count', async () => {
    const chatFetch = vi.fn<typeof fetch>(async () =>
      json({
        candidates: [{ content: { parts: [{ text: 'Phản hồi tổng hợp.' }] } }],
        usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 40 },
      }),
    )
    vi.stubGlobal('fetch', chatFetch)
    const chat = () => callGemini(CANARY, 'gemini-3.6-flash', CANARY, [], 100)
    const baseline = await traced(chat)
    expect(baseline.root?.summary?.totalCostUsd).toBeGreaterThan(0)
    const fetchImpl = vi.fn<typeof fetch>(async () => response())
    const mixed = await traced(async () => {
      const vector = await embedQuery(CANARY, provider(fetchImpl))
      const text = await chat()
      return { vector, text }
    })
    expect(mixed.result.vector).toHaveLength(EMBEDDING_DIMENSIONS)
    expect(mixed.result.text).toBe(baseline.result)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(chatFetch).toHaveBeenCalledTimes(2)
    expect(mixed.attempts).toHaveLength(2)
    expect(mixed.root?.summary).toMatchObject({
      callCount: 2,
      unknownCallCount: 1,
      observedCostUsd: baseline.root?.summary?.observedCostUsd,
      totalCostUsd: null,
    })
    expect(dailyCalls()).toHaveLength(1)
  })

  it.each([
    {
      name: 'HTTP429',
      make: () => json({ error: CANARY }, 429),
      http: 429,
      attempt: 'error',
      daily: 0,
    },
    {
      name: 'network',
      make: () => {
        throw new Error(CANARY)
      },
      http: null,
      attempt: 'error',
      daily: 0,
    },
    {
      name: 'JSON lỗi',
      make: () => new Response('{', { status: 200 }),
      http: 200,
      attempt: 'error',
      daily: 0,
    },
    {
      name: 'vector sai chiều',
      make: () => json({ embeddings: [{ values: [1, 2] }] }),
      http: 200,
      attempt: 'success',
      daily: 1,
    },
    {
      name: 'vector zero',
      make: () => json({ embeddings: [{ values: Array(EMBEDDING_DIMENSIONS).fill(0) }] }),
      http: 200,
      attempt: 'success',
      daily: 1,
    },
  ])('$name: giữ null/daily parity, có một attempt và logical error', async (scenario) => {
    async function run(enabled: boolean) {
      accounting.query.mockClear()
      const fetchImpl = vi.fn<typeof fetch>(async () => scenario.make())
      const out = await traced(() => embedQuery(CANARY, provider(fetchImpl)), enabled)
      expect(out.result).toBeNull()
      expect(fetchImpl).toHaveBeenCalledTimes(1)
      expect(dailyCalls()).toHaveLength(scenario.daily)
      return {
        ...out,
        requests: requestFingerprint(fetchImpl),
        daily: dailyCalls(),
      }
    }
    const off = await run(false)
    const on = await run(true)
    expect(on.requests).toEqual(off.requests)
    expect(on.daily).toEqual(off.daily)
    expect(on.attempts).toHaveLength(1)
    expectUnknownAttempt(on.attempts[0])
    expect(on.attempts[0]).toMatchObject({
      status: scenario.attempt,
      httpStatus: scenario.http,
    })
    expect(on.logical[0]?.status).toBe('error')
    expect(on.root?.summary).toMatchObject({
      callCount: 1,
      unknownCallCount: 1,
      totalCostUsd: null,
    })
  })

  it('timeout giữ abort/null, một HTTP error attempt và không retry', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException(CANARY, 'AbortError')),
          )
        }),
    )
    const out = await traced(() => embedQuery(CANARY, provider(fetchImpl, 5)))
    expect(out.result).toBeNull()
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(fetchImpl.mock.calls[0]?.[1]?.signal?.aborted).toBe(true)
    expect(out.attempts).toHaveLength(1)
    expectUnknownAttempt(out.attempts[0])
    expect(out.attempts[0]).toMatchObject({
      status: 'error',
      httpStatus: null,
    })
    expect(out.logical[0]?.status).toBe('error')
    expect(dailyCalls()).toHaveLength(0)
  })

  it('batch nhiều vector là một request/attempt, không một attempt cho mỗi text', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => response(3))
    const out = await traced(() => provider(fetchImpl).embed([CANARY, 'hai', 'ba'], 'document'))
    expect(out.result).toHaveLength(3)
    expect(out.result.every((v) => v?.length === EMBEDDING_DIMENSIONS)).toBe(true)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(out.attempts).toHaveLength(1)
    expect(out.logical[0]?.status).toBe('success')
    expect(dailyCalls()).toHaveLength(1)
  })

  it('batch partial giữ vector/null như trước, logical error và HTTP attempt success', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      json({ embeddings: [{ values: vector() }, { values: [1, 2] }] }),
    )
    const out = await traced(() => provider(fetchImpl).embed([CANARY, 'hai'], 'document'))
    expect(out.result[0]).toHaveLength(EMBEDDING_DIMENSIONS)
    expect(out.result[1]).toBeNull()
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(out.attempts).toHaveLength(1)
    expect(out.attempts[0]).toMatchObject({
      status: 'success',
      httpStatus: 200,
    })
    expect(out.logical[0]?.status).toBe('error')
    expect(out.root?.summary).toMatchObject({
      callCount: 1,
      unknownCallCount: 1,
      totalCostUsd: null,
    })
    expect(dailyCalls()).toHaveLength(1)
  })

  it('empty batch không tạo logical call/HTTP attempt hoặc daily accounting', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => response())
    const out = await traced(() => provider(fetchImpl).embed([], 'document'))
    expect(out.result).toEqual([])
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(out.logical).toHaveLength(0)
    expect(out.attempts).toHaveLength(0)
    expect(out.root?.summary).toMatchObject({
      callCount: 0,
      unknownCallCount: 0,
      totalCostUsd: 0,
    })
    expect(dailyCalls()).toHaveLength(0)
  })

  it('không provider hoặc query/storage trắng không bịa call', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => response())
    expect(getEmbeddingProvider({ env: {} })).toBeNull()
    const out = await traced(async () => [
      await embedQuery(CANARY, null),
      await embedForStorage(CANARY, null),
      await embedQuery('   ', provider(fetchImpl)),
      await embedForStorage('   ', provider(fetchImpl)),
    ])
    expect(out.result).toEqual([null, null, null, null])
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(out.logical).toHaveLength(0)
    expect(out.attempts).toHaveLength(0)
    expect(dailyCalls()).toHaveLength(0)
  })

  it.each(['throw', 'reject'] as const)(
    'sink %s không đổi vector/daily hoặc tăng fetch/fallback',
    async (behavior) => {
      const fetchImpl = vi.fn<typeof fetch>(async () => response())
      const out = await traced(() => embedForStorage(CANARY, provider(fetchImpl)), true, behavior)
      expect(out.result?.vector).toHaveLength(EMBEDDING_DIMENSIONS)
      expect(out.result?.model).toBe('gemini-embedding-2')
      expect(fetchImpl).toHaveBeenCalledTimes(1)
      expect(out.attempts).toHaveLength(1)
      expect(out.logical).toHaveLength(1)
      expect(dailyCalls()).toHaveLength(1)
      expect(out.root?.summary?.totalCostUsd).toBeNull()
    },
  )

  it.each([false, true])(
    'Context Engine → search → embedding thật; HTTP fail=%s vẫn truy vấn chữ/nền',
    async (failHttp) => {
      const read = poolBoundary(/from personal\.memory_records/)
      const fetchImpl = vi.fn<typeof fetch>(async () =>
        failHttp ? json({ error: CANARY }, 429) : response(),
      )
      vi.stubGlobal('fetch', fetchImpl)
      const out = await traced(() =>
        withTraceStage('context', () =>
          buildContextPackage(read.pool, {
            personId: PERSON,
            requestId: 'synthetic-context-request',
            requestText: CANARY,
            purpose: 'companion_conversation',
            domain: 'learning',
            maxSensitivity: 'personal',
            includeCompanionHistory: false,
          }),
        ),
      )
      expect(fetchImpl).toHaveBeenCalledTimes(1)
      expect(out.result.items).toHaveLength(1)
      expect(out.result.items[0]?.sourceType).toBe('current_request')
      const queries = read.query.mock.calls.map(([sql]) => sql)
      expect(queries.some((sql) => sql.includes('search_tsv @@'))).toBe(true)
      expect(queries.some((sql) => sql.includes('order by importance desc'))).toBe(true)
      expect(queries.some((sql) => sql.includes('select id, embedding'))).toBe(!failHttp)
      expect(out.attempts).toHaveLength(1)
      expectUnknownAttempt(out.attempts[0])
      const context = out.events.find((event) => event.stage === 'context')
      expect(out.logical[0]?.parentSpanId).toBe(context?.spanId)
      expect(out.root?.summary).toMatchObject({
        callCount: 1,
        unknownCallCount: 1,
        totalCostUsd: null,
      })
      expect(dailyCalls()).toHaveLength(failHttp ? 0 : 1)
    },
  )
})
