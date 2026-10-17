// @vitest-environment node
// Regression oracle S04: actual helpers, SQL/context/tool boundaries giả; không PG/provider.
import { readFileSync } from 'node:fs'
import { Socket } from 'node:net'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Pool, type QueryResult } from 'pg'
import { ProposedActionSchema } from '@dhcb/core-contracts/proposedAction'
import { WorkDocumentSchema, WorkTaskSchema } from '@dhcb/core-contracts/work'
import { PersonalPolicySchema } from '@dhcb/core-contracts/personalPolicy'
import type { ContextPackage } from '@dhcb/core-contracts/contextPackage'
import { createWorkDocument, createWorkTask } from '@dhcb/core-domains/workService'
import {
  createCompanionToolSession,
  type CompanionToolSession,
} from '@dhcb/core-personal/companionTools'
import { setPolicy } from '@dhcb/core-personal/policyService'
import {
  executeToolBoundary,
  readBoundaryAudit,
  readBoundaryFacts,
  readBoundaryProposals,
  snapshotBoundaryDomain,
} from './companionBoundaryAuthority.js'
import {
  fixtureCanary,
  newBoundaryPair,
  observeContextBoundary,
} from './companionBoundaryFixtures.js'
import {
  BoundaryCorpusSchema,
  BoundaryJsonSchema,
  SOURCE_KEYS,
  type BoundaryCase,
} from './companionBoundaryCorpus.js'
import {
  OwnedFixtureScope,
  REQUIRED_COLUMNS,
  parseDisposableDatabase,
} from './companionBoundaryDb.js'

vi.mock('@dhcb/core-domains/workService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@dhcb/core-domains/workService')>()),
  createWorkDocument: vi.fn(),
  createWorkTask: vi.fn(),
}))
vi.mock('@dhcb/core-personal/companionTools', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@dhcb/core-personal/companionTools')>()),
  createCompanionToolSession: vi.fn(),
}))
vi.mock('@dhcb/core-personal/policyService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@dhcb/core-personal/policyService')>()),
  setPolicy: vi.fn(),
}))
vi.mock('./companionBoundaryFixtures.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./companionBoundaryFixtures.js')>()),
  newBoundaryPair: vi.fn(),
}))

const raw: unknown = JSON.parse(
  readFileSync(new URL('../companion-boundary-corpus.json', import.meta.url), 'utf8'),
)
const corpus = BoundaryCorpusSchema.parse(raw)
type ToolCase = Extract<BoundaryCase, { kind: 'tool_authority' }>
type ContextCase = Extract<BoundaryCase, { kind: 'context_scope' }>
type SourceKey = (typeof SOURCE_KEYS)[number]
type Source = { id: string; canary: string }
type ProposalRow = Awaited<ReturnType<typeof readBoundaryProposals>>[number]
type AuditRow = Awaited<ReturnType<typeof readBoundaryAudit>>[number]
type FactRow = Awaited<ReturnType<typeof readBoundaryFacts>>[number]
type Mode = 'pending' | 'automate' | 'raw_input'
type Mutant = 'none' | 'binding' | 'privacy' | 'audit' | 'extra_tool' | 'duplicate_tool'
const at = '2026-10-16T22:00:00.000Z'
const memoryText = 'Thích học đọc truyện vào buổi tối SYNTHETICPROPOSALCANARY'
const goalText = 'Luyện đọc đều đặn mỗi buổi tối SYNTHETICPROPOSALCANARY'
// Literals độc lập với expected corpus: không biến expected.offered/status thành observation.
const offeredTools = [
  'get_learning_progress',
  'get_review_queue',
  'search_notes',
  'lookup_dictionary',
  'propose_memory',
  'propose_learning_goal',
  'propose_profile_fact',
]
const memoryInput = { namespace: 'preference', content: memoryText, importance: 5 }
const goalInput = { goal: goalText }
function uuid(value: number): string {
  return `00000000-0000-4000-8000-${String(value).padStart(12, '0')}`
}
const owner = { userId: uuid(1), personId: uuid(2) }
const other = { userId: uuid(3), personId: uuid(4) }
const proposalId = uuid(300)
const factId = uuid(301)
const persons = [owner.personId, other.personId]
function group(id: string) {
  const value = corpus.fixtureGroups.find((candidate) => candidate.id === id)
  if (!value) throw new Error('ORACLE_TEST_GROUP_MISSING')
  return value
}
function toolCase(id: string): ToolCase {
  const value = corpus.cases.find((candidate) => candidate.id === id)
  if (value?.kind !== 'tool_authority') throw new Error('ORACLE_TEST_TOOL_CASE_MISSING')
  return structuredClone(value)
}
function contextCase(id: string): ContextCase {
  const value = corpus.cases.find((candidate) => candidate.id === id)
  if (value?.kind !== 'context_scope') throw new Error('ORACLE_TEST_CONTEXT_CASE_MISSING')
  return structuredClone(value)
}
function jsonObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
let pool: Pool
let scope: OwnedFixtureScope
let failures: string[]
let state: ReturnType<typeof authorityState> | undefined
let directSnapshots: Array<Record<string, unknown>[]> | undefined
function boundary(condition: boolean, code: string): void {
  if (!condition) {
    failures.push(code)
    throw new Error('UNEXPECTED_ORACLE_BOUNDARY')
  }
}
function result(rows: Record<string, unknown>[] = []): QueryResult<Record<string, unknown>> {
  return { command: 'SELECT', rows, rowCount: rows.length, oid: 0, fields: [] }
}
function authorityState(mode: Mode, mutant: Mutant) {
  const committed = mode === 'automate'
  const binding = mutant === 'binding'
  const execution = committed
    ? {
        status: 'ok',
        toolId: 'learning.update_goal',
        executedAt: at,
        detail: { factId, storedAs: 'personal_fact:learning.goal' },
      }
    : null
  const proposal: ProposalRow = {
    id: proposalId,
    person_id: owner.personId,
    capability_id: binding
      ? 'profile.update_fact'
      : committed
        ? 'learning.update_goal'
        : 'memory.create_record',
    action: binding ? 'update_fact' : committed ? 'update_goal' : 'create_record',
    target_domain: binding ? 'profile' : committed ? 'learning' : 'personal',
    risk_level: committed ? 'medium' : 'low',
    payload: binding
      ? { key: 'occupation', value: 'Nội dung khác ngoài tool call.' }
      : committed
        ? { goal: goalText, source: 'companion_agent' }
        : {
            namespace: 'preference',
            content: memoryText,
            importance: 5,
            sensitivity: 'personal',
            origin: 'agent',
          },
    status: committed ? 'committed' : 'pending',
    version: 1,
    resolved_by: committed ? 'system:automate' : null,
    execution_result: execution,
  }
  const audit: AuditRow[] = committed
    ? [
        {
          id: uuid(302),
          person_id: owner.personId,
          proposed_action_id: proposalId,
          tool_id: mutant === 'audit' ? 'profile.update_fact' : 'learning.update_goal',
          status: 'success',
          input_payload: proposal.payload,
          output_payload: execution,
        },
      ]
    : []
  const fact: FactRow = {
    id: factId,
    person_id: owner.personId,
    namespace: 'learning',
    key: 'goal',
    value: goalText,
    origin: 'observed',
    confidence: 0.85,
    is_current: true,
    supersedes: null,
    sensitivity: mutant === 'privacy' ? 'public' : 'personal',
    source:
      mutant === 'privacy'
        ? { type: 'untrusted_other_source' }
        : { type: 'companion_conversation', occurredAt: at },
    expires_at: mutant === 'privacy' ? new Date('2000-01-01T00:00:00.000Z') : null,
    last_confirmed_at: null,
    created_at: new Date(at),
    updated_at: new Date(at),
  }
  return {
    mode,
    mutant,
    proposal,
    audit,
    fact,
    executed: false,
    reads: { snapshot: 0, proposals: 0, audit: 0, facts: 0 },
    rawCaptured: false,
  }
}
function queryBoundary(text: unknown, values: unknown) {
  boundary(typeof text === 'string', 'query_shape')
  if (typeof text !== 'string') throw new Error('UNREACHABLE')
  if (text === 'select current_database() as database') {
    boundary(values === undefined, 'preflight_values')
    return result([{ database: 'dhcb_stored_test' }])
  }
  if (text.startsWith('select c.table_schema, c.table_name, c.column_name')) {
    boundary(values === undefined, 'catalog_values')
    return result(
      Object.entries(REQUIRED_COLUMNS).flatMap(([table, columns]) =>
        columns.map((column) => ({
          table_schema: table.split('.')[0],
          table_name: table.split('.')[1],
          column_name: column,
        })),
      ),
    )
  }
  if (text.startsWith('select to_jsonb(t) as value')) {
    const ids = directSnapshots ? [owner.personId] : persons
    boundary(JSON.stringify(values) === JSON.stringify([ids]), 'snapshot_owner_values')
    boundary(
      text.includes('from "personal"."personal_facts" t where person_id=any($1::uuid[])'),
      'snapshot_sql',
    )
    if (directSnapshots) {
      const rows = directSnapshots.shift()
      boundary(rows !== undefined, 'snapshot_excess_read')
      return result(rows)
    }
    boundary(state !== undefined, 'snapshot_unplanned')
    if (!state) throw new Error('UNREACHABLE')
    state.reads.snapshot++
    // to_jsonb của PG trả timestamp strings; reader fact riêng trả Date đúng pg parser.
    const value: unknown = JSON.parse(JSON.stringify(state.fact))
    return result(state.executed && state.mode === 'automate' ? [{ value }] : [])
  }
  boundary(state !== undefined, 'sql_unplanned')
  if (!state) throw new Error('UNREACHABLE')
  boundary(JSON.stringify(values) === JSON.stringify([persons]), 'reader_owner_values')
  if (
    text ===
    'select id,person_id,capability_id,action,target_domain,risk_level,payload,status,version,resolved_by,execution_result from personal.proposed_actions where person_id=any($1::uuid[]) order by created_at,id'
  ) {
    state.reads.proposals++
    return result(state.mode === 'raw_input' ? [] : [{ ...state.proposal }])
  }
  if (
    text ===
    'select id,person_id,proposed_action_id,tool_id,status,input_payload,output_payload from personal.tool_execution_audit_log where person_id=any($1::uuid[]) order by id'
  ) {
    state.reads.audit++
    return result(state.audit.map((row) => ({ ...row })))
  }
  if (
    text ===
    'select id,person_id,namespace,key,value,origin,is_current,supersedes,confidence::double precision as confidence,sensitivity,source,expires_at,last_confirmed_at,created_at,updated_at from personal.personal_facts where person_id=any($1::uuid[]) order by id'
  ) {
    state.reads.facts++
    return result([{ ...state.fact }])
  }
  boundary(false, 'unexpected_sql')
  return result()
}

beforeEach(async () => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  failures = []
  state = undefined
  directSnapshots = undefined
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      failures.push('unexpected_http')
      throw new Error('UNEXPECTED_HTTP')
    }),
  )
  vi.spyOn(Socket.prototype, 'connect').mockImplementation(() => {
    failures.push('unexpected_tcp')
    throw new Error('UNEXPECTED_TCP')
  })
  const target = parseDisposableDatabase(
    'postgresql://fixture:fixture@127.0.0.1:56543/dhcb_stored_test',
    'stored-local',
    {},
  )
  pool = new Pool(target.poolConfig)
  vi.spyOn(pool, 'connect').mockImplementation(() => {
    failures.push('unexpected_connect')
    throw new Error('UNEXPECTED_CONNECT')
  })
  vi.spyOn(pool, 'query').mockImplementation((text, values) =>
    Promise.resolve(queryBoundary(text, values)),
  )
  // Instance thật, preflight/query boundary giả; manifest chỉ RAM và scope không tạo người thật.
  scope = await OwnedFixtureScope.open(pool, target, async () => undefined, { runId: uuid(99) })
  vi.mocked(newBoundaryPair).mockImplementation(async (candidate) => {
    boundary(candidate === scope, 'unexpected_scope')
    return { owner, other }
  })
  vi.mocked(createWorkDocument).mockImplementation(async (candidate, personId, input) => {
    boundary(candidate === pool && personId === owner.personId, 'work_document_owner')
    return WorkDocumentSchema.parse({
      id: uuid(400),
      personId,
      ...input,
      createdAt: at,
      updatedAt: at,
      version: 1,
      schemaVersion: 1,
    })
  })
  vi.mocked(createWorkTask).mockImplementation(async (candidate, personId, input) => {
    boundary(candidate === pool && personId === owner.personId, 'work_task_owner')
    return WorkTaskSchema.parse({
      id: uuid(401),
      personId,
      ...input,
      status: 'todo',
      createdAt: at,
      updatedAt: at,
      version: 1,
      schemaVersion: 1,
    })
  })
  vi.mocked(setPolicy).mockImplementation(async (candidate, input) => {
    boundary(
      candidate === pool &&
        input.personId === owner.personId &&
        input.subject === 'learning.update_goal' &&
        input.action === 'update_goal' &&
        input.resourceScope === 'learning' &&
        input.authority === 'AUTOMATE',
      'policy_boundary',
    )
    return PersonalPolicySchema.parse({ id: uuid(402), ...input, createdAt: at, schemaVersion: 1 })
  })
  vi.mocked(createCompanionToolSession).mockImplementation((ctx) => {
    boundary(
      ctx.pool === pool &&
        ctx.personId === owner.personId &&
        ctx.userId === owner.userId &&
        !ctx.ephemeral &&
        ctx.memoryConsent,
      'tool_context',
    )
    boundary(state !== undefined, 'tool_unplanned')
    if (!state) throw new Error('UNREACHABLE')
    const active = state
    const names = [...offeredTools]
    if (active.mutant === 'extra_tool') names.push('unexpected_authority_tool')
    if (active.mutant === 'duplicate_tool') names.push('propose_memory')
    const session: CompanionToolSession = {
      definitions: names.map((name) => ({
        name,
        description: 'Fixture boundary',
        inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
      })),
      proposals: [],
      async execute(name, input) {
        const goal = active.mode === 'automate'
        boundary(
          name === (goal ? 'propose_learning_goal' : 'propose_memory'),
          'unexpected_tool_name',
        )
        if (active.mode === 'raw_input') {
          boundary(jsonObject(input) && Object.hasOwn(input, '__proto__'), 'raw_key_lost')
          if (!jsonObject(input)) throw new Error('UNREACHABLE')
          boundary(
            JSON.stringify(input['__proto__']) === JSON.stringify({ target: other.personId }),
            'raw_placeholder_lost',
          )
          active.executed = true
          active.rawCaptured = true
          return { isError: true, content: 'Đề xuất ký ức không hợp lệ.' }
        }
        boundary(
          JSON.stringify(input) === JSON.stringify(goal ? goalInput : memoryInput),
          'unexpected_tool_input',
        )
        active.executed = true
        session.proposals.push(
          ProposedActionSchema.parse({
            id: active.proposal.id,
            personId: owner.personId,
            capabilityId: active.proposal.capability_id,
            action: active.proposal.action,
            targetDomain: active.proposal.target_domain,
            payload: active.proposal.payload,
            riskLevel: active.proposal.risk_level,
            status: active.proposal.status,
            createdAt: at,
            schemaVersion: 1,
          }),
        )
        return {
          content: JSON.stringify({
            status: goal ? 'done_by_user_policy' : 'pending_user_confirmation',
          }),
        }
      },
    }
    return session
  })
})
afterEach(async () => {
  try {
    expect(failures).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  } finally {
    vi.unstubAllGlobals()
    try {
      await pool.end()
    } finally {
      vi.restoreAllMocks()
    }
  }
})
async function runAuthority(mode: 'pending' | 'automate', mutant: Mutant) {
  state = authorityState(mode, mutant)
  const c = toolCase(mode === 'automate' ? 'T10-control_learning_automate' : 'T08-control_memory')
  const observed = await executeToolBoundary(pool, scope, group('tool_sources'), c, [
    'personal.personal_facts',
  ])
  expect(state.reads).toEqual({
    snapshot: 2,
    proposals: 1,
    audit: 1,
    facts: mode === 'automate' ? 1 : 0,
  })
  expect(createWorkDocument).toHaveBeenCalledTimes(1)
  expect(createWorkTask).toHaveBeenCalledTimes(1)
  expect(setPolicy).toHaveBeenCalledTimes(mode === 'automate' ? 1 : 0)
  return observed
}

describe('actual authority oracle — controls và corrupted observations độc lập', () => {
  it.each(['pending', 'automate'] as const)(
    '%s control đủ SQL fields qua cả5 checks',
    async (mode) => {
      const observed = await runAuthority(mode, 'none')
      expect(observed.checks.map((check) => check.name)).toEqual([
        'offered_tools',
        'tool_outcome',
        'proposal_state',
        'domain_state',
        'audit_state',
      ])
      expect(observed.checks.every((check) => check.ok)).toBe(true)
    },
  )
  it.each([
    ['pending', 'binding', 'proposal_state'],
    ['automate', 'privacy', 'domain_state'],
    ['automate', 'audit', 'audit_state'],
    ['pending', 'extra_tool', 'offered_tools'],
    ['pending', 'duplicate_tool', 'offered_tools'],
  ] as const)('%s/%s bị đúng oracle %s bắt', async (mode, mutant, failedCheck) => {
    const observed = await runAuthority(mode, mutant)
    expect(observed.checks.filter((check) => !check.ok).map((check) => check.name)).toEqual([
      failedCheck,
    ])
  })
  it('raw own __proto__ và placeholder còn tới actual tool boundary', async () => {
    state = authorityState('raw_input', 'none')
    const c = toolCase('T05-memory_extra_personid')
    const input: unknown = JSON.parse(
      `{"namespace":"preference","content":"${memoryText}","importance":5,"__proto__":{"target":"$OTHER_PERSON_ID"}}`,
    )
    if (!BoundaryJsonSchema.safeParse(input).success) throw new Error('INVALID_JSON_TEST_FIXTURE')
    c.input.calls = [{ name: 'propose_memory', input: BoundaryJsonSchema.parse(input) }]
    const observed = await executeToolBoundary(pool, scope, group('tool_sources'), c, [
      'personal.personal_facts',
    ])
    expect(state.rawCaptured).toBe(true)
    expect(observed.checks.every((check) => check.ok)).toBe(true)
  })
})

const SOURCE_TYPES: Record<SourceKey, ContextPackage['items'][number]['sourceType']> = {
  memory: 'validated_derived_memory',
  public_memory: 'validated_derived_memory',
  sensitive_memory: 'validated_derived_memory',
  restricted_memory: 'validated_derived_memory',
  old_memory: 'validated_derived_memory',
  live_replacement: 'validated_derived_memory',
  fact: 'user_declared_fact',
  core_block: 'user_declared_fact',
  life_graph: 'active_goal_or_project',
  history_vi: 'recent_episodic_context',
  history_en: 'recent_episodic_context',
  summary: 'recent_episodic_context',
  work_history: 'recent_episodic_context',
  work_summary: 'recent_episodic_context',
  null_history: 'recent_episodic_context',
  domain_state: 'authoritative_domain_state',
  note: 'authoritative_domain_state',
  task: 'authoritative_domain_state',
}
const sources = new Map<SourceKey, Source>(
  SOURCE_KEYS.map((key, i) => [
    key,
    { id: uuid(i + 100), canary: fixtureCanary(group('context_sources'), key) },
  ]),
)
const controlSources: SourceKey[] = [
  'memory',
  'fact',
  'core_block',
  'life_graph',
  'public_memory',
  'old_memory',
  'domain_state',
]
function sourceItem(key: SourceKey): ContextPackage['items'][number] {
  const source = sources.get(key)
  if (!source) throw new Error('SOURCE_TEST_FIXTURE_MISSING')
  return {
    sourceType: SOURCE_TYPES[key],
    sourceId: source.id,
    content: source.canary,
    provenance: key,
    sensitivity: 'personal',
    tokenEstimate: 1,
  }
}
function context(keys: readonly SourceKey[], personId = owner.personId): ContextPackage {
  return {
    id: uuid(10),
    personId,
    requestId: 'oracle-review',
    items: keys.map(sourceItem),
    tokenBudget: 2000,
    tokenUsed: keys.length,
    createdAt: at,
    schemaVersion: 1,
  }
}
describe('context oracle F1', () => {
  it('inactive ID bị bắt dù nội dung không có canary', () => {
    const c = contextCase('C12-old_expired')
    const value = context(controlSources.filter((key) => key !== 'old_memory'))
    expect(
      observeContextBoundary(value, sources, group('context_sources'), c, owner).checks.every(
        (check) => check.ok,
      ),
    ).toBe(true)
    value.items.push({ ...sourceItem('old_memory'), content: 'Nội dung thay đổi không có canary.' })
    expect(
      observeContextBoundary(value, sources, group('context_sources'), c, owner).checks.find(
        (check) => check.name === 'source_absent',
      )?.ok,
    ).toBe(false)
  })
  it('đúng ID/canary nhưng loại nguồn sai vẫn đỏ', () => {
    const c = contextCase('C01-control_memory'),
      value = context(controlSources)
    expect(
      observeContextBoundary(value, sources, group('context_sources'), c, owner).checks.every(
        (check) => check.ok,
      ),
    ).toBe(true)
    const memory = value.items.find((item) => item.sourceId === sources.get('memory')?.id)
    if (!memory) throw new Error('SOURCE_TEST_FIXTURE_MISSING')
    memory.sourceType = 'authoritative_domain_state'
    expect(
      observeContextBoundary(value, sources, group('context_sources'), c, owner).checks.find(
        (check) => check.name === 'source_seen',
      )?.ok,
    ).toBe(false)
  })
  it('requester-other có domain state riêng hợp lệ', () => {
    const c = contextCase('C02-foreign_owner_sources'),
      value = context([], other.personId)
    value.items.push({
      ...sourceItem('domain_state'),
      sourceId: uuid(999),
      content: 'Dữ liệu miền hợp lệ của người đang hỏi.',
    })
    expect(
      observeContextBoundary(value, sources, group('context_sources'), c, other).checks.every(
        (check) => check.ok,
      ),
    ).toBe(true)
  })
})

describe('loader F2 và raw JSON snapshot', () => {
  it.each([{ present: [] }, { present: ['domain_state'] }] as const)(
    'positive primary không được thay bằng present=%j',
    ({ present }) => {
      const changed = structuredClone(corpus)
      const c = changed.cases.find((candidate) => candidate.id === 'C01-control_memory')
      if (c?.kind !== 'context_scope') throw new Error('SOURCE_TEST_FIXTURE_MISSING')
      c.expected.present = [...present]
      expect(BoundaryCorpusSchema.safeParse(changed).success).toBe(false)
    },
  )
  it('raw JSON own __proto__/constructor không bị loader clone mất', () => {
    const changed = structuredClone(corpus)
    const c = changed.cases.find(
      (candidate) => candidate.kind === 'proposal_http' && candidate.role === 'attack',
    )
    if (c?.kind !== 'proposal_http') throw new Error('HTTP_TEST_FIXTURE_MISSING')
    c.input.body = BoundaryJsonSchema.parse(
      JSON.parse('{"__proto__":{"mark":"preserved"},"constructor":{"prototype":{"mark":true}}}'),
    )
    const parsed = BoundaryCorpusSchema.parse(changed).cases.find(
      (candidate) => candidate.id === c.id,
    )
    if (parsed?.kind !== 'proposal_http' || !jsonObject(parsed.input.body))
      throw new Error('HTTP_TEST_FIXTURE_MISSING')
    expect(Object.hasOwn(parsed.input.body, '__proto__')).toBe(true)
    expect(parsed.input.body['__proto__']).toEqual({ mark: 'preserved' })
    expect(parsed.input.body['constructor']).toEqual({ prototype: { mark: true } })
  })
  it('cycle không phải JSON hợp lệ', () => {
    const cycle: { self?: unknown } = {}
    cycle.self = cycle
    expect(BoundaryJsonSchema.safeParse(cycle).success).toBe(false)
  })
  it('snapshot phát hiện nested own __proto__ bị thay, không normalize mất', async () => {
    const before: unknown = JSON.parse(
      `{"id":"${factId}","person_id":"${owner.personId}","source":{"type":"synthetic_review","__proto__":{"mark":"before"}}}`,
    )
    const after: unknown = JSON.parse(
      `{"id":"${factId}","person_id":"${owner.personId}","source":{"type":"synthetic_review","__proto__":{"mark":"after"}}}`,
    )
    directSnapshots = [[{ value: before }], [{ value: after }]]
    const left = await snapshotBoundaryDomain(pool, [owner.personId], ['personal.personal_facts'])
    const right = await snapshotBoundaryDomain(pool, [owner.personId], ['personal.personal_facts'])
    expect(directSnapshots).toHaveLength(0)
    expect(left.get('personal.personal_facts')).not.toBe(right.get('personal.personal_facts'))
    expect(left.get('personal.personal_facts')).toContain('"__proto__":{"mark":"before"}')
    expect(right.get('personal.personal_facts')).toContain('"__proto__":{"mark":"after"}')
  })
})
