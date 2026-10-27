// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { Socket } from 'node:net'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Pool, type QueryResult, type QueryResultRow } from 'pg'
import { z } from 'zod'
import {
  createConsentClassifierLedger,
  createRuntimeConsentProbe,
  type RuntimeConsentNetwork,
} from './companionRuntimeConsent.js'
import { CLASSIFIER_EXCHANGE, EXPECTED_CLASSIFIER_BODY } from './companionRuntimeConsentFixture.js'
import { parseAnthropicUsage, recordAiTokenUsage } from '@dhcb/core-ai/aiTokenUsage'

const boundary = vi.hoisted(() => ({ globalPoolCalls: 0, context: vi.fn(), readModel: vi.fn() }))
vi.mock('@dhcb/core-db/pgPool', () => ({
  getPgPool: () => {
    boundary.globalPoolCalls += 1
    throw new Error('GLOBAL_POOL_FORBIDDEN')
  },
}))
vi.mock('@dhcb/core-personal/contextEngine', () => ({
  buildContextPackage: (...args: unknown[]) => boundary.context(...args),
}))
vi.mock('@dhcb/core-domains/domainReadModelService', () => ({
  getDomainReadModelForContext: (...args: unknown[]) => boundary.readModel(...args),
}))
const PERSON = '11111111-1111-4111-8111-111111111111'
const OTHER = '22222222-2222-4222-8222-222222222222'
const USER = '33333333-3333-4333-8333-333333333333'
const FIXED_NOW = new Date('2026-10-17T00:00:00.000Z')
const CONTENT = 'Bạn tổng hợp thích học từ mới qua truyện ngắn.'
const POOLS: Pool[] = []
let socketAttempts = 0
function queryResult(rows: QueryResultRow[] = []): QueryResult {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] }
}
type Grant = {
  personId: string
  scope: string
  purpose: string
  status: string
  expiresAt: Date | null
}
const grant = (extra: Partial<Grant> = {}): Grant => ({
  personId: PERSON,
  scope: 'personal_memory.read',
  purpose: 'companion_conversation',
  status: 'active',
  expiresAt: null,
  ...extra,
})
function fakeDatabase(grants: Grant[]) {
  const pool = new Pool({ host: '127.0.0.1', port: 56543, database: 'never_connected' })
  POOLS.push(pool)
  const queries: string[] = []
  const violations: string[] = []
  const proposals: Record<string, unknown>[] = []
  const ConsentSql =
    "select id from personal.consent_grants where person_id = $1 and scope = $2 and purpose = $3 and status = 'active' and (expires_at is null or expires_at > now()) limit 1"
  const ProfileSql =
    'select p.user_id, pr.age_group from personal.persons p left join public.profiles pr on pr.id = p.user_id where p.id = $1'
  function dispatch(raw: unknown, rawValues: unknown) {
    if (typeof raw !== 'string') {
      violations.push('SQL_TYPE')
      throw new Error('SQL_TYPE')
    }
    const sql = raw.replace(/\s+/g, ' ').trim()
    const values = z.array(z.unknown()).parse(rawValues)
    queries.push(sql)
    if (sql === ProfileSql && values.length === 1 && values[0] === PERSON)
      return queryResult([{ user_id: USER, age_group: 'adult' }])
    if (sql === ConsentSql && values.length === 3) {
      return queryResult(
        grants
          .filter(
            (g) =>
              g.personId === values[0] &&
              g.scope === values[1] &&
              g.purpose === values[2] &&
              g.status === 'active' &&
              (g.expiresAt === null || g.expiresAt > FIXED_NOW),
          )
          .slice(0, 1)
          .map(() => ({ id: randomUUID() })),
      )
    }
    if (
      sql.startsWith(
        "select id, person_id, capability_id, action, target_domain, payload, risk_level, status, version, created_at, resolved_at, resolved_by, execution_result from personal.proposed_actions where person_id = $1 and status = 'pending' and capability_id = $2 and payload = $3::jsonb order by created_at desc limit 1",
      ) &&
      values.length === 3 &&
      values[0] === PERSON
    )
      return queryResult([])
    if (
      sql ===
        'select authority, (review_at is not null and review_at <= now()) as review_due from personal.personal_policies where person_id = $1 and subject = $2 and action = $3 and resource_scope = $4 and revoked_at is null limit 1' &&
      JSON.stringify(values) ===
        JSON.stringify([PERSON, 'memory.create_record', 'create_record', 'personal'])
    )
      return queryResult([])
    if (
      sql ===
        "insert into personal.proposed_actions (id, person_id, capability_id, action, target_domain, payload, risk_level, status, version) values ($1, $2, $3, $4, $5, $6, $7, 'pending', 1) returning id, person_id, capability_id, action, target_domain, payload, risk_level, status, version, created_at, resolved_at, resolved_by, execution_result" &&
      values.length === 7 &&
      values[1] === PERSON
    ) {
      const row = {
        id: z.uuid().parse(values[0]),
        person_id: values[1],
        capability_id: values[2],
        action: values[3],
        target_domain: values[4],
        payload: z.json().parse(JSON.parse(z.string().parse(values[5]))),
        risk_level: values[6],
        status: 'pending',
        version: 1,
        created_at: FIXED_NOW,
        resolved_at: null,
        resolved_by: null,
        execution_result: null,
      }
      proposals.push(row)
      return queryResult([row])
    }
    violations.push('UNEXPECTED_SQL')
    throw new Error('UNEXPECTED_SQL')
  }
  vi.spyOn(pool, 'query').mockImplementation((text, values) =>
    Promise.resolve(dispatch(text, values)),
  )
  vi.spyOn(pool, 'connect').mockImplementation(() => {
    violations.push('CONNECT_FORBIDDEN')
    throw new Error('CONNECT_FORBIDDEN')
  })
  return { pool, proposals, queries, violations }
}
function fakeNetwork() {
  let responder: typeof fetch | undefined
  let violations = 0
  const dispatch: typeof fetch = async (input, init) => {
    if (!responder) {
      violations += 1
      throw new Error('NO_NETWORK_ALLOWED')
    }
    return responder(input, init)
  }
  vi.stubGlobal('fetch', dispatch)
  const guard: RuntimeConsentNetwork = {
    get violations() {
      return violations
    },
    async withFetchResponder(next, operation) {
      if (responder) throw new Error('RESPONDER_BUSY')
      responder = next
      try {
        return await operation()
      } finally {
        responder = undefined
      }
    },
  }
  return {
    guard,
    dispatch,
    dirty: () => {
      violations += 1
    },
  }
}
const envNames = [
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_BASE_URL',
  'ANTHROPIC_LOG',
  'ANTHROPIC_CUSTOM_HEADERS',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'GROQ_API_KEY',
  'NODE_DEBUG',
  'NODE_DEBUG_NATIVE',
  'DEBUG',
  'COMPANION_TRACE_ENABLED',
]
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test')
  for (const key of envNames) vi.stubEnv(key, undefined)
  vi.stubEnv('ANTHROPIC_API_KEY', 'fake-stored-runtime-consent-' + randomUUID())
  vi.stubEnv('ANTHROPIC_FAST_MODEL', 'claude-haiku-5-5')
  boundary.globalPoolCalls = 0
  socketAttempts = 0
  boundary.context
    .mockReset()
    .mockImplementation(
      async (_pool: unknown, options: { personId: string; requestId: string }) => ({
        id: randomUUID(),
        personId: options.personId,
        requestId: options.requestId,
        items: [],
        tokenBudget: 4000,
        tokenUsed: 0,
        createdAt: FIXED_NOW.toISOString(),
        schemaVersion: 1,
      }),
    )
  boundary.readModel.mockReset().mockResolvedValue(null)
  vi.spyOn(Socket.prototype, 'connect').mockImplementation(function () {
    socketAttempts += 1
    throw new Error('NO_SOCKET_ALLOWED')
  })
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})
afterEach(async () => {
  await Promise.all(POOLS.splice(0).map((pool) => pool.end()))
  expect(boundary.globalPoolCalls).toBe(0)
  expect(socketAttempts).toBe(0)
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('actual prepare → consent query → actual session → actual proposal service, fake SQL only', () => {
  const cases: [string, Grant[], boolean, boolean][] = [
    ['active', [grant()], false, true],
    ['none', [], false, false],
    ['wrong_purpose', [grant({ purpose: 'unrelated_purpose' })], false, false],
    ['revoked', [grant({ status: 'revoked' })], false, false],
    ['expired', [grant({ expiresAt: new Date('2026-10-16T00:00:00Z') })], false, false],
    ['ephemeral_active', [grant()], true, false],
    ['foreign_person_active', [grant({ personId: OTHER })], false, false],
    ['wrong_scope', [grant({ scope: 'companion_history.read' })], false, false],
  ]
  it.each(cases)('%s', async (_name, records, ephemeral, expected) => {
    const db = fakeDatabase(records)
    const { guard, dispatch } = fakeNetwork()
    const probe = await createRuntimeConsentProbe(guard)
    const observation = await probe.observe(db.pool, {
      personId: PERSON,
      ephemeral,
      memoryContent: CONTENT,
    })
    expect(observation.memoryConsent).toBe(expected)
    expect(observation.personId).toBe(PERSON)
    expect(observation.userId).toBe(USER)
    expect(observation.ephemeral).toBe(ephemeral)
    expect(observation.offeredTools.includes('propose_memory')).toBe(expected)
    expect(observation.offeredTools.includes('propose_profile_fact')).toBe(!ephemeral)
    expect(observation.offeredTools.includes('propose_learning_goal')).toBe(!ephemeral)
    expect(observation.offeredTools).toContain('search_notes')
    expect(observation.outcome.isError === true).toBe(!expected)
    expect(observation.proposals).toHaveLength(expected ? 1 : 0)
    expect(db.proposals).toHaveLength(expected ? 1 : 0)
    if (expected) {
      expect(db.proposals[0]).toMatchObject({
        person_id: PERSON,
        capability_id: 'memory.create_record',
        status: 'pending',
        version: 1,
        payload: {
          namespace: 'preference',
          content: CONTENT,
          importance: 5,
          sensitivity: 'personal',
          origin: 'agent',
        },
      })
      expect(
        z
          .object({ status: z.string() })
          .passthrough()
          .parse(JSON.parse(observation.outcome.content)).status,
      ).toBe('pending_user_confirmation')
    }
    expect(db.queries.filter((sql) => sql.includes('consent_grants'))).toHaveLength(
      ephemeral ? 0 : 1,
    )
    expect(boundary.context).toHaveBeenCalledWith(
      db.pool,
      expect.objectContaining({
        includeCompanionHistory: !ephemeral,
        includePersonalContext: !ephemeral,
      }),
    )
    expect(observation.classifier).toEqual({
      calls: 1,
      terminals: 1,
      failedCalls: 0,
      cancellations: 0,
      usage: 'unknown',
    })
    expect(db.violations).toEqual([])
    expect(guard.violations).toBe(0)
    await probe.close()
    expect(globalThis.fetch).toBe(dispatch)
    await expect(
      probe.observe(db.pool, { personId: PERSON, ephemeral, memoryContent: CONTENT }),
    ).rejects.toThrow('UNAVAILABLE')
  })
  it('serial observe/close owns no shared resources and rejects while operation is held', async () => {
    let resolveContext!: (value: unknown) => void
    boundary.context.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveContext = resolve
        }),
    )
    const db = fakeDatabase([grant()])
    const { guard, dispatch } = fakeNetwork()
    const probe = await createRuntimeConsentProbe(guard)
    const pending = probe.observe(db.pool, {
      personId: PERSON,
      ephemeral: false,
      memoryContent: CONTENT,
    })
    // prepare has awaits before Context Engine; yield until that real seam starts.
    await vi.waitFor(() => expect(resolveContext).toBeTypeOf('function'))
    await expect(probe.close()).rejects.toThrow('PROBE_BUSY')
    await expect(
      probe.observe(db.pool, { personId: PERSON, ephemeral: false, memoryContent: CONTENT }),
    ).rejects.toThrow('UNAVAILABLE')
    resolveContext({ items: [] })
    expect((await pending).memoryConsent).toBe(true)
    await probe.close()
    await probe.close()
    expect(globalThis.fetch).toBe(dispatch)
    expect(db.pool.ended).toBe(false)
    expect(db.violations).toEqual([])
  })
  it('missing usage keeps real recordAiTokenUsage before getPgPool/SQL', async () => {
    const raw = z
      .record(z.string(), z.unknown())
      .parse(JSON.parse(CLASSIFIER_EXCHANGE.response.body))
    expect(Object.hasOwn(raw, 'usage')).toBe(false)
    expect(parseAnthropicUsage(raw)).toBeNull()
    await recordAiTokenUsage({
      provider: 'anthropic',
      model: 'claude-haiku-5-5',
      mode: 'safety',
      usage: parseAnthropicUsage(raw),
    })
    expect(boundary.globalPoolCalls).toBe(0)
  })
  it('history changes fingerprint: classifier catches, independent ledger still rejects before proposal', async () => {
    boundary.context.mockResolvedValueOnce({
      items: [
        {
          provenance: 'companion_message:user:synthetic',
          content: 'Một lượt synthetic thêm ngoài fixture.',
        },
      ],
    })
    const db = fakeDatabase([grant()])
    const { guard } = fakeNetwork()
    const probe = await createRuntimeConsentProbe(guard)
    await expect(
      probe.observe(db.pool, { personId: PERSON, ephemeral: false, memoryContent: CONTENT }),
    ).rejects.toThrow('REPLAY_')
    expect(db.proposals).toHaveLength(0)
    expect(db.violations).toEqual([])
    await expect(
      probe.observe(db.pool, { personId: PERSON, ephemeral: false, memoryContent: CONTENT }),
    ).rejects.toThrow('UNAVAILABLE')
    await probe.close()
  })
  it('rejects dirty dispatcher and wrong/missing model env before SDK imports', async () => {
    const network = fakeNetwork()
    network.dirty()
    await expect(createRuntimeConsentProbe(network.guard)).rejects.toThrow('NETWORK_DIRTY')
    vi.stubEnv('ANTHROPIC_FAST_MODEL', 'synthetic-other-model')
    await expect(createRuntimeConsentProbe(fakeNetwork().guard)).rejects.toThrow(
      'CHILD_ENV_INVALID',
    )
  })
  it('input rejects expected consent injection', async () => {
    const probe = await createRuntimeConsentProbe(fakeNetwork().guard)
    const db = fakeDatabase([])
    const input = {
      personId: PERSON,
      ephemeral: false,
      memoryContent: CONTENT,
      memoryConsent: true,
    }
    await expect(probe.observe(db.pool, input)).rejects.toThrow()
    expect(db.queries).toEqual([])
    await probe.close()
  })
})

function exactRequest(body: unknown = EXPECTED_CLASSIFIER_BODY) {
  return new Request('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'anthropic-version': '2026-10-21',
      authorization: `Bearer ${process.env.ANTHROPIC_API_KEY ?? ''}`,
    },
    body: JSON.stringify(body),
  })
}
describe('independent protocol/terminal ledger negative controls', () => {
  it('real body read reaches terminal once; creating response alone does not', async () => {
    const ledger = createConsentClassifierLedger()
    const response = await ledger.fetchImpl(exactRequest())
    expect(ledger.snapshot().terminals).toBe(0)
    expect(() => ledger.assertComplete()).toThrow()
    await response.json()
    ledger.assertComplete()
    expect(ledger.snapshot().terminals).toBe(1)
  })
  it('cancellation is failure, not a completed classifier', async () => {
    const ledger = createConsentClassifierLedger()
    const response = await ledger.fetchImpl(exactRequest())
    await response.body?.cancel()
    expect(ledger.snapshot().cancellations).toBe(1)
    expect(ledger.snapshot().terminals).toBe(0)
    expect(() => ledger.assertComplete()).toThrow()
  })
  it.each(['path', 'method', 'version', 'beta', 'body', 'auth', 'origin'])(
    'rejects %s; swallowed exception cannot clean ledger',
    async (kind) => {
      const request = exactRequest()
      const url = new URL(request.url)
      const headers = new Headers(request.headers)
      if (kind === 'path') url.pathname = '/v1/other'
      if (kind === 'origin') url.hostname = 'forbidden.invalid'
      if (kind === 'version') headers.set('anthropic-version', '2099-01-01')
      if (kind === 'beta') headers.set('anthropic-beta', 'synthetic-beta')
      if (kind === 'auth') headers.set('x-api-key', 'synthetic-other-key')
      const altered = new Request(url, {
        method: kind === 'method' ? 'PUT' : 'POST',
        headers,
        body: kind === 'body' ? '{"synthetic":"wrong"}' : JSON.stringify(EXPECTED_CLASSIFIER_BODY),
      })
      const ledger = createConsentClassifierLedger()
      await ledger.fetchImpl(altered).catch(() => undefined)
      expect(ledger.snapshot().failedCalls).toBe(1)
      expect(() => ledger.assertComplete()).toThrow()
    },
  )
  it('extra request remains a violation after exact request terminal', async () => {
    const ledger = createConsentClassifierLedger()
    await (await ledger.fetchImpl(exactRequest())).json()
    await ledger.fetchImpl(exactRequest()).catch(() => undefined)
    expect(() => ledger.assertComplete()).toThrow()
    expect(ledger.snapshot().calls).toBe(2)
  })
})
