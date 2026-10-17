// @vitest-environment node
// Unit orchestration: dịch vụ/HTTP/query đều giả, không phải PG/auth/guard proof.
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Pool, type QueryResult } from 'pg'
import { z } from 'zod'
import { ConflictError, NotFoundError } from '@dhcb/core-errors/appError'
import { ProposedActionSchema } from '@dhcb/core-contracts/proposedAction'
import { PersonalFactSchema } from '@dhcb/core-contracts/personalFact'
import { MemoryRecordSchema } from '@dhcb/core-contracts/personalMemory'
import { WorkDocumentSchema } from '@dhcb/core-contracts/work'
import { proposeAction, confirmAction } from '@dhcb/core-personal/proposedActionService'
import { declareFact } from '@dhcb/core-personal/personService'
import { ingestMemory } from '@dhcb/core-personal/memoryService'
import { createWorkDocument } from '@dhcb/core-domains/workService'
import { createCompanionToolSession } from '@dhcb/core-personal/companionTools'
import {
  OwnedFixtureScope,
  REQUIRED_COLUMNS,
  parseDisposableDatabase,
} from './companionBoundaryDb.js'
import {
  BoundaryCorpusSchema,
  BoundaryJsonSchema,
  type BoundaryCase,
} from './companionBoundaryCorpus.js'
import { newBoundaryPair } from './companionBoundaryFixtures.js'
import {
  readBoundaryProposals,
  readBoundaryAudit,
  readBoundaryFacts,
  snapshotBoundaryDomain,
} from './companionBoundaryAuthority.js'
import type { BoundaryHttpHarness } from './companionBoundaryHttp.js'
import {
  executeConfirmBoundary,
  executeHttpBoundary,
  executeNoteToolBoundary,
} from './companionBoundaryActions.js'

const fakes = vi.hoisted(() => ({
  pair: vi.fn<typeof newBoundaryPair>(),
  propose: vi.fn<typeof proposeAction>(),
  confirm: vi.fn<typeof confirmAction>(),
  fact: vi.fn<typeof declareFact>(),
  memory: vi.fn<typeof ingestMemory>(),
  document: vi.fn<typeof createWorkDocument>(),
  session: vi.fn<typeof createCompanionToolSession>(),
  proposals: vi.fn<typeof readBoundaryProposals>(),
  audit: vi.fn<typeof readBoundaryAudit>(),
  facts: vi.fn<typeof readBoundaryFacts>(),
  snapshot: vi.fn<typeof snapshotBoundaryDomain>(),
}))
vi.mock('@dhcb/core-personal/proposedActionService', () => ({
  proposeAction: fakes.propose,
  confirmAction: fakes.confirm,
}))
vi.mock('@dhcb/core-personal/personService', () => ({
  declareFact: fakes.fact,
  getOrCreatePerson: () => {
    throw new Error('UNEXPECTED_PERSON_SERVICE')
  },
}))
vi.mock('@dhcb/core-personal/memoryService', () => ({ ingestMemory: fakes.memory }))
vi.mock('@dhcb/core-domains/workService', () => ({ createWorkDocument: fakes.document }))
vi.mock('@dhcb/core-personal/companionTools', () => ({
  createCompanionToolSession: fakes.session,
  toToolData: JSON.stringify,
}))
vi.mock('./companionBoundaryFixtures.js', () => ({
  newBoundaryPair: fakes.pair,
  fixtureCanary: (g: { canaries: Record<string, string> }, key: string) => g.canaries[key],
}))
vi.mock('./companionBoundaryAuthority.js', () => ({
  readBoundaryProposals: fakes.proposals,
  readBoundaryAudit: fakes.audit,
  readBoundaryFacts: fakes.facts,
  snapshotBoundaryDomain: fakes.snapshot,
}))

type Proposal = Awaited<ReturnType<typeof readBoundaryProposals>>[number]
type Audit = Awaited<ReturnType<typeof readBoundaryAudit>>[number]
type Fact = Awaited<ReturnType<typeof readBoundaryFacts>>[number]
type Json = z.infer<typeof BoundaryJsonSchema>
interface Memory {
  id: string
  person_id: string
  namespace: string
  content: string
  provenance: string
  sensitivity: string
  status: string
  version: number
  importance: number
  valid_from: Date
  valid_to: Date | null
  superseded_by: string | null
  source_message_id: string | null
  has_embedding: boolean
  raw: Record<string, Json>
  expected_search_tsv: string
}
interface MemoryAudit {
  id: string
  person_id: string
  record_id: string
  action: string
  changes: Json
  changed_by: string
}
interface Resolution {
  id: string
  person_id: string
  action: string
  target_domain: string
  risk_level: string
  resolved_at: Date | null
}
interface Document {
  id: string
  person_id: string
  title: string
  document_type: string
  summary: string
  version: number
  updated_at: Date
}
const corpus = BoundaryCorpusSchema.parse(
  JSON.parse(readFileSync(new URL('../companion-boundary-corpus.json', import.meta.url), 'utf8')),
)
const group = (c: BoundaryCase) => corpus.fixtureGroups.find((g) => g.id === c.fixtureGroupRef)!
const NOW = new Date('2026-10-17T02:00:00.000Z')
const pair = {
  owner: { userId: randomUUID(), personId: randomUUID() },
  other: { userId: randomUUID(), personId: randomUUID() },
}
const tables = [
  'personal.personal_facts',
  'personal.memory_records',
  'personal.memory_records_audit_log',
  'worklife.documents',
  'worklife.tasks',
]
const target = parseDisposableDatabase(
  'postgresql://synthetic:not-a-secret@127.0.0.1:56543/dhcb_stored_test',
  'stored-local',
  {},
)
const catalog = Object.entries(REQUIRED_COLUMNS).flatMap(([table, columns]) => {
  const [table_schema, table_name] = table.split('.')
  return columns.map((column_name) => ({ table_schema, table_name, column_name }))
})
let proposals: Proposal[] = []
let audit: Audit[] = []
let facts: Fact[] = []
let memories: Memory[] = []
let memoryAudit: MemoryAudit[] = []
let resolutions: Resolution[] = []
let documents: Document[] = []
let pool: Pool
let scope: OwnedFixtureScope
let afterCommit: () => void = () => {}
let falseCommit = false
let extraTableChanged = false
let noteTransform: (body: Record<string, unknown>) => Record<string, unknown> = (body) => body
const boundaryFailures: string[] = []
function response<T extends object>(rows: T[]): QueryResult<T> {
  return { rows, rowCount: rows.length, command: 'SELECT', fields: [], oid: 0 }
}
function dto(row: Proposal, status = row.status) {
  return ProposedActionSchema.parse({
    schemaVersion: 1,
    id: row.id,
    personId: row.person_id,
    capabilityId: row.capability_id,
    action: row.action,
    targetDomain: row.target_domain,
    payload: row.payload,
    riskLevel: row.risk_level,
    status,
    createdAt: NOW.toISOString(),
    ...(status === 'committed' ? { decidedAt: NOW.toISOString() } : {}),
  })
}
function memoryDto(row: Memory) {
  return MemoryRecordSchema.parse({
    schemaVersion: 2,
    id: row.id,
    personId: row.person_id,
    namespace: row.namespace,
    content: row.content,
    provenance: row.provenance,
    sensitivity: row.sensitivity,
    status: row.status,
    version: row.version,
    importance: row.importance,
    createdAt: NOW.toISOString(),
    validFrom: row.valid_from.toISOString(),
    hasEmbedding: row.has_embedding,
  })
}
function addMemory(person: string, content: string, provenance: string, actor: string) {
  const id = randomUUID()
  const record: Memory = {
    id,
    person_id: person,
    namespace: 'semantic',
    content,
    provenance,
    sensitivity: 'personal',
    status: 'accepted',
    version: 1,
    importance: 5,
    valid_from: NOW,
    valid_to: null,
    superseded_by: null,
    source_message_id: null,
    has_embedding: false,
    expected_search_tsv: 'SYNTHETIC_GENERATED_TSV',
    raw: {
      id,
      person_id: person,
      namespace: 'semantic',
      content,
      provenance,
      sensitivity: 'personal',
      status: 'accepted',
      merged_from_id: null,
      version: 1,
      created_at: NOW.toISOString(),
      updated_at: NOW.toISOString(),
      retain_until: null,
      importance: 5,
      last_accessed_at: null,
      access_count: 0,
      valid_from: NOW.toISOString(),
      valid_to: null,
      superseded_by: null,
      source_message_id: null,
      embedding: null,
      embedding_model: null,
      search_tsv: 'SYNTHETIC_GENERATED_TSV',
    },
  }
  memories.push(record)
  memoryAudit.push({
    id: String(memoryAudit.length + 1),
    person_id: person,
    record_id: record.id,
    action: 'INSERT',
    changes: { namespace: 'semantic', content },
    changed_by: actor,
  })
  return record
}
function addFact(person: string, namespace: string, key: string, value: Json, source: Json) {
  const previous = facts.find(
    (f) => f.person_id === person && f.namespace === namespace && f.key === key && f.is_current,
  )
  if (previous) previous.is_current = false
  const fact: Fact = {
    id: randomUUID(),
    person_id: person,
    namespace,
    key,
    value,
    origin: 'observed',
    confidence: 0.85,
    is_current: true,
    supersedes: previous?.id ?? null,
    sensitivity: 'personal',
    source,
    expires_at: null,
    last_confirmed_at: null,
    created_at: NOW,
    updated_at: NOW,
  }
  facts.push(fact)
  return fact
}
function commit(row: Proposal, actor: string) {
  const payload = z.record(z.string(), z.unknown()).parse(row.payload)
  let detail: Record<string, Json>
  if (row.capability_id === 'memory.create_record') {
    const content = z.string().parse(payload.content)
    const record = addMemory(row.person_id, content, 'companion:conversation', actor)
    detail = { recordId: record.id, outcome: 'ACCEPT' }
  } else if (row.capability_id === 'memory.invalidate_record') {
    const record = memories.find((m) => m.id === payload.targetRecordId)
    if (!record || record.version !== payload.targetVersion)
      throw new ConflictError('PRIVATE_STALE_TARGET')
    record.valid_to = NOW
    record.version++
    record.raw = {
      ...record.raw,
      valid_to: NOW.toISOString(),
      updated_at: NOW.toISOString(),
      version: record.version,
    }
    memoryAudit.push({
      id: String(memoryAudit.length + 1),
      person_id: row.person_id,
      record_id: record.id,
      action: 'UPDATE',
      changes: { invalidated: true, reason: 'synthetic_boundary_confirmation' },
      changed_by: actor,
    })
    detail = { recordId: record.id, validTo: NOW.toISOString() }
  } else {
    const learning = row.capability_id === 'learning.update_goal'
    const namespace = learning ? 'learning' : z.string().parse(payload.namespace)
    const key = learning ? 'goal' : z.string().parse(payload.key)
    const value = z.string().parse(learning ? payload.goal : payload.value)
    const fact = addFact(row.person_id, namespace, key, value, {
      type: 'companion_conversation',
      occurredAt: NOW.toISOString(),
    })
    detail = learning
      ? { factId: fact.id, storedAs: 'personal_fact:learning.goal' }
      : { factId: fact.id, namespace, key }
  }
  const execution = {
    status: 'ok',
    toolId: row.capability_id,
    executedAt: NOW.toISOString(),
    detail,
  }
  row.status = 'committed'
  row.version++
  row.resolved_by = actor
  row.execution_result = execution
  const resolution = resolutions.find((r) => r.id === row.id)
  if (!resolution) throw new Error('MISSING_RESOLUTION')
  resolution.resolved_at = NOW
  audit.push({
    id: randomUUID(),
    person_id: row.person_id,
    proposed_action_id: row.id,
    tool_id: row.capability_id,
    status: 'success',
    input_payload: structuredClone(row.payload),
    output_payload: structuredClone(execution),
  })
  afterCommit()
}
beforeEach(async () => {
  vi.clearAllMocks()
  proposals = []
  audit = []
  facts = []
  memories = []
  memoryAudit = []
  resolutions = []
  documents = []
  afterCommit = () => {}
  falseCommit = false
  extraTableChanged = false
  noteTransform = (body) => body
  pool = new Pool(target.poolConfig)
  vi.spyOn(pool, 'query').mockImplementation((sql) => {
    if (sql === 'select clock_timestamp() as observed_at')
      return Promise.resolve(response([{ observed_at: NOW }]))
    if (sql === 'select current_database() as database')
      return Promise.resolve(response([{ database: 'dhcb_stored_test' }]))
    if (sql.includes('from information_schema.columns')) return Promise.resolve(response(catalog))
    if (sql.includes('from personal.memory_records_audit_log'))
      return Promise.resolve(response(structuredClone(memoryAudit)))
    if (sql.includes('from personal.memory_records'))
      return Promise.resolve(response(structuredClone(memories)))
    if (sql.includes('from personal.proposed_actions'))
      return Promise.resolve(response(structuredClone(resolutions)))
    if (sql.includes('from worklife.documents'))
      return Promise.resolve(response(structuredClone(documents)))
    boundaryFailures.push('UNEXPECTED_SQL')
    throw new Error('UNEXPECTED_SQL_PRIVATE')
  })
  scope = await OwnedFixtureScope.open(pool, target, async () => {})
  fakes.pair.mockResolvedValue(pair)
  fakes.proposals.mockImplementation(async () => structuredClone(proposals))
  fakes.audit.mockImplementation(async () => structuredClone(audit))
  fakes.facts.mockImplementation(async () => structuredClone(facts))
  fakes.snapshot.mockImplementation(
    async (_pool, _persons, requested) =>
      new Map(
        requested.map((table) => [
          table,
          JSON.stringify(
            table === 'personal.personal_facts'
              ? facts
              : table === 'personal.memory_records'
                ? memories
                : table === 'personal.memory_records_audit_log'
                  ? memoryAudit
                  : table === 'worklife.documents'
                    ? documents
                    : table === 'worklife.tasks' && extraTableChanged
                      ? [{ unexpected: true }]
                      : [],
          ),
        ]),
      ),
  )
  fakes.propose.mockImplementation(async (_pool, input) => {
    const row: Proposal = {
      id: randomUUID(),
      person_id: input.personId,
      capability_id: input.capabilityId,
      action: input.action,
      target_domain: input.targetDomain,
      risk_level: input.riskLevel,
      payload: BoundaryJsonSchema.parse(input.payload),
      status: 'pending',
      version: 1,
      resolved_by: null,
      execution_result: null,
    }
    proposals.push(row)
    resolutions.push({
      id: row.id,
      person_id: row.person_id,
      action: row.action,
      target_domain: row.target_domain,
      risk_level: row.risk_level,
      resolved_at: null,
    })
    return { action: dto(row), autoExecuted: false }
  })
  fakes.fact.mockImplementation(async (_pool, input) => {
    const row = addFact(
      input.personId,
      input.namespace,
      input.key,
      BoundaryJsonSchema.parse(input.value),
      input.source,
    )
    return PersonalFactSchema.parse({
      schemaVersion: 1,
      id: row.id,
      personId: row.person_id,
      namespace: row.namespace,
      key: row.key,
      value: row.value,
      origin: row.origin,
      confidence: row.confidence,
      source: row.source,
      sensitivity: row.sensitivity,
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    })
  })
  fakes.memory.mockImplementation(async (_pool, person, candidate, actor) => {
    const record = addMemory(person, candidate.content, candidate.provenance, actor ?? 'system')
    return { record: memoryDto(record), evaluation: { outcome: 'ACCEPT', reason: 'synthetic' } }
  })
  fakes.confirm.mockImplementation(async (_pool, person, id, version, actor) => {
    const row = proposals.find((p) => p.id === id && p.person_id === person)
    if (!row) throw new NotFoundError('PRIVATE_OTHER_PERSON')
    if (row.version !== version || row.status !== 'pending')
      throw new ConflictError('PRIVATE_VERSION')
    if (falseCommit) return dto(row, 'committed')
    commit(row, actor)
    return dto(row)
  })
  fakes.document.mockImplementation(async (_pool, person, input) => {
    const row: Document = {
      id: randomUUID(),
      person_id: person,
      title: input.title,
      document_type: input.documentType,
      summary: input.summary,
      version: 1,
      updated_at: NOW,
    }
    documents.push(row)
    return WorkDocumentSchema.parse({
      schemaVersion: 1,
      id: row.id,
      personId: person,
      title: row.title,
      documentType: row.document_type,
      summary: row.summary,
      version: 1,
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    })
  })
  fakes.session.mockImplementation(() => ({
    definitions: [],
    proposals: [],
    execute: async (name, input) => {
      expect(name).toBe('search_notes')
      expect(input).toEqual({ query: 'wifi' })
      const own = documents.find((d) => d.person_id === pair.owner.personId)!
      const body = noteTransform({
        notes: [
          { title: own.title, excerpt: 'wifi SYNTHETICWRAPPERCANARY', updatedAt: '2026-10-17' },
        ],
        openTasks: [],
        matchedQuery: 'wifi',
      })
      return { content: JSON.stringify(body) }
    },
  }))
})
afterEach(async () => {
  await pool.end()
  vi.restoreAllMocks()
  expect(boundaryFailures.splice(0)).toEqual([])
})
const allGreen = (observation: { checks: readonly { name: string; ok: boolean }[] }) =>
  expect(observation.checks.filter((c) => !c.ok)).toEqual([])
const confirmCases = corpus.cases.filter(
  (c): c is Extract<BoundaryCase, { kind: 'proposal_confirm' }> => c.kind === 'proposal_confirm',
)
const httpCases = corpus.cases.filter(
  (c): c is Extract<BoundaryCase, { kind: 'proposal_http' }> => c.kind === 'proposal_http',
)
const noteCases = corpus.cases.filter(
  (c): c is Extract<BoundaryCase, { kind: 'prompt_wrapping' }> =>
    c.kind === 'prompt_wrapping' && c.input.surface === 'note_tool',
)
const confirmCase = (id: string) => confirmCases.find((c) => c.id === id)!
const runConfirm = (id: string) => {
  const c = confirmCase(id)
  return executeConfirmBoundary(pool, scope, group(c), c, tables)
}

describe('confirm orchestration (services và rows giả)', () => {
  it.each(confirmCases)('$id', async (c) => {
    allGreen(await executeConfirmBoundary(pool, scope, group(c), c, tables))
    expect(fakes.confirm).toHaveBeenCalledTimes(
      c.input.operation === 'repeat' || c.input.operation === 'concurrent' ? 2 : 1,
    )
    expect(fakes.pair).toHaveBeenCalledWith(scope)
  })
  it('service trả committed suông nhưng rows pending làm oracle đỏ', async () => {
    falseCommit = true
    const observed = await runConfirm('A01-control_memory')
    expect(observed.checks.filter((c) => !c.ok).map((c) => c.name)).toEqual(
      expect.arrayContaining([
        'proposal_state',
        'version',
        'execution_count',
        'domain_state',
        'audit_state',
      ]),
    )
  })
  it.each([
    'wrong_owner',
    'wrong_actor',
    'payload_changed',
    'audit_missing',
    'foreign_table',
    'detail_wrong',
    'fact_source_wrong',
    'fact_history_wrong',
  ])('oracle bắt %s sau service success', async (fault) => {
    afterCommit = () => {
      if (fault === 'wrong_owner') memories[0]!.person_id = pair.other.personId
      if (fault === 'wrong_actor') proposals[0]!.resolved_by = 'system:unexpected'
      if (fault === 'payload_changed') proposals[0]!.payload = { unexpected: true }
      if (fault === 'audit_missing') audit = []
      if (fault === 'foreign_table') extraTableChanged = true
      if (fault === 'detail_wrong')
        proposals[0]!.execution_result = {
          status: 'ok',
          toolId: 'memory.create_record',
          executedAt: NOW.toISOString(),
          detail: { recordId: randomUUID(), outcome: 'ACCEPT' },
        }
      if (fault === 'fact_source_wrong') facts.at(-1)!.source = { type: 'wrong_source' }
      if (fault === 'fact_history_wrong') facts[0]!.value = 'changed old value'
    }
    const observed = await runConfirm(
      fault.startsWith('fact_') ? 'A02-control_profile' : 'A01-control_memory',
    )
    expect(observed.checks.some((c) => !c.ok)).toBe(true)
  })
  it('JSONB payload/detail key order không tạo false mismatch', async () => {
    afterCommit = () => {
      const row = proposals[0]!
      row.payload = Object.fromEntries(
        Object.entries(z.record(z.string(), BoundaryJsonSchema).parse(row.payload)).reverse(),
      )
    }
    allGreen(await runConfirm('A01-control_memory'))
  })
  it.each(
    ['A01-control_memory', 'A06-control_invalidate'].flatMap((id) =>
      [
        'access_count',
        'embedding_model',
        'last_accessed_at',
        'retain_until',
        'search_tsv',
        'unknown_field',
        'raw_version',
      ].map((field) => ({ id, field })),
    ),
  )('$id bắt whole-row metadata drift $field', async ({ id, field }) => {
    afterCommit = () => {
      const raw = memories[0]!.raw
      if (field === 'access_count') raw.access_count = 9
      if (field === 'embedding_model') raw.embedding_model = 'unexpected_model'
      if (field === 'last_accessed_at') raw.last_accessed_at = NOW.toISOString()
      if (field === 'retain_until') raw.retain_until = '2030-01-01T00:00:00.000Z'
      if (field === 'search_tsv') raw.search_tsv = 'unexpected token'
      if (field === 'unknown_field') raw.future_unexpected_column = true
      if (field === 'raw_version') raw.version = 99
    }
    const observed = await runConfirm(id)
    expect(observed.checks.find((c) => c.name === 'domain_state')?.ok).toBe(false)
  })
  it.each(['A01-control_memory', 'A06-control_invalidate'])(
    '%s giữ PostgreSQL timestamp có microseconds/offset ngoài JS precision',
    async (id) => {
      afterCommit = () => {
        const raw = memories[0]!.raw
        const microseconds = '2026-10-17T02:00:00.000321+00:00'
        if (id === 'A01-control_memory') {
          raw.created_at = microseconds
          raw.updated_at = microseconds
          raw.valid_from = microseconds
        } else {
          raw.valid_to = microseconds
          raw.updated_at = microseconds
        }
      }
      allGreen(await runConfirm(id))
    },
  )
  it.each(['A01-control_memory', 'A06-control_invalidate'])(
    '%s từ chối timestamp ở ngoài cửa sổ clock PostgreSQL',
    async (id) => {
      afterCommit = () => {
        const record = memories[0]!
        const future = '2030-01-01T00:00:00.000Z'
        record.raw.updated_at = future
        if (id === 'A01-control_memory') {
          record.raw.created_at = future
          record.raw.valid_from = future
          record.valid_from = new Date(future)
        } else {
          record.raw.valid_to = future
          record.valid_to = new Date(future)
          const execution = proposals[0]!.execution_result
          if (!execution || typeof execution !== 'object' || Array.isArray(execution))
            throw new Error('BAD_FAKE_EXECUTION')
          const detail = execution.detail
          if (!detail || typeof detail !== 'object' || Array.isArray(detail))
            throw new Error('BAD_FAKE_DETAIL')
          detail.validTo = future
          audit[0]!.output_payload = structuredClone(execution)
        }
      }
      const observed = await runConfirm(id)
      expect(observed.checks.find((c) => c.name === 'domain_state')?.ok).toBe(false)
    },
  )
  it('invalidation updated_at phải cùng giá trị server với valid_to', async () => {
    afterCommit = () => {
      memories[0]!.raw.updated_at = '2026-10-17T02:00:00.000001+00:00'
    }
    const observed = await runConfirm('A06-control_invalidate')
    expect(observed.checks.find((c) => c.name === 'domain_state')?.ok).toBe(false)
  })
  it.each(['memory_audit', 'execution_detail'])(
    'oracle giữ own __proto__ JSON để bắt field thừa trong %s',
    async (fault) => {
      afterCommit = () => {
        if (fault === 'memory_audit') {
          const changes = memoryAudit[0]!.changes
          if (!changes || typeof changes !== 'object' || Array.isArray(changes))
            throw new Error('BAD_FAKE_AUDIT')
          memoryAudit[0]!.changes = { ...changes, ['__proto__']: { unexpected: true } }
        } else {
          const result = proposals[0]!.execution_result
          if (!result || typeof result !== 'object' || Array.isArray(result))
            throw new Error('BAD_FAKE_EXECUTION')
          const detail = result.detail
          if (!detail || typeof detail !== 'object' || Array.isArray(detail))
            throw new Error('BAD_FAKE_DETAIL')
          result.detail = { ...detail, ['__proto__']: { unexpected: true } }
          audit[0]!.output_payload = structuredClone(result)
        }
      }
      const observed = await runConfirm('A01-control_memory')
      expect(observed.checks.find((c) => c.name === 'domain_state')?.ok).toBe(false)
    },
  )
  it.each(['action', 'targetDomain', 'riskLevel'])(
    'service DTO %s sai đỏ dù DB state đúng',
    async (field) => {
      const original = fakes.confirm.getMockImplementation()
      if (!original) throw new Error('FAKE_CONFIRM_MISSING')
      fakes.confirm.mockImplementationOnce(async (...args) => {
        const result = await original(...args)
        return ProposedActionSchema.parse({
          ...result,
          [field]: field === 'riskLevel' ? 'high' : 'wrong',
        })
      })
      const observed = await runConfirm('A01-control_memory')
      expect(observed.checks.find((c) => c.name === 'error_kind')?.ok).toBe(false)
      expect(observed.checks.find((c) => c.name === 'proposal_state')?.ok).toBe(true)
    },
  )
  it('unknown error name giả ConflictError không được coi expected domain conflict', async () => {
    fakes.confirm.mockRejectedValue(
      Object.assign(new Error('PRIVATE_DB_ERROR'), { name: 'ConflictError' }),
    )
    await expect(runConfirm('A04-stale_memory')).rejects.toThrow(
      'BOUNDARY_CONFIRM_EXECUTION_FAILED',
    )
  })
  it('concurrent chờ cả promise khi một lỗi hạ tầng, không cleanup khi call còn active', async () => {
    let secondStarted = false
    let release: () => void = () => {}
    const barrier = new Promise<void>((resolve) => {
      release = resolve
    })
    fakes.confirm
      .mockImplementationOnce(async () => {
        throw new Error('PRIVATE_NETWORK')
      })
      .mockImplementationOnce(async () => {
        secondStarted = true
        await barrier
        throw new ConflictError('expected')
      })
    let settled = false
    const call = runConfirm('A05-concurrent_memory').finally(() => {
      settled = true
    })
    const rejection = expect(call).rejects.toThrow('BOUNDARY_CONFIRM_EXECUTION_FAILED')
    await vi.waitFor(() => expect(secondStarted).toBe(true))
    expect(settled).toBe(false)
    release()
    await rejection
  })
  it('missing snapshot table fail trước fixture mutation', async () => {
    const c = confirmCase('A01-control_memory')
    await expect(executeConfirmBoundary(pool, scope, group(c), c, [])).rejects.toThrow(
      'BOUNDARY_REQUIRED_TABLE_MISSING',
    )
    expect(fakes.pair).not.toHaveBeenCalled()
  })
})

describe('HTTP orchestration (harness giả; không auth/CSRF proof)', () => {
  it.each(httpCases)('$id forwards raw input và đối chiếu state', async (c) => {
    const harness: BoundaryHttpHarness = {
      close: vi.fn(),
      observe: vi.fn(async () => {
        if (c.expected.status === 200) commit(proposals[0]!, `user:${pair.owner.userId}`)
        return {
          status: c.expected.status,
          body:
            c.expected.status === 200
              ? { action: dto(proposals[0]!) }
              : { error: 'synthetic_response' },
        }
      }),
    }
    allGreen(await executeHttpBoundary(pool, scope, group(c), c, tables, harness))
    expect(harness.observe).toHaveBeenCalledWith(c.input, { ...pair, actionId: proposals[0]!.id })
    expect(harness.close).not.toHaveBeenCalled()
    expect(fakes.confirm).not.toHaveBeenCalled()
  })
  it('200 body committed không thay được PG state oracle', async () => {
    const c = httpCases.find((c) => c.expected.status === 200)!
    const harness: BoundaryHttpHarness = {
      close: async () => {},
      observe: async () => ({ status: 200, body: { action: dto(proposals[0]!, 'committed') } }),
    }
    const observed = await executeHttpBoundary(pool, scope, group(c), c, tables, harness)
    expect(observed.checks.filter((c) => !c.ok).map((c) => c.name)).toEqual(
      expect.arrayContaining(['proposal_state', 'domain_state', 'execution_count']),
    )
  })
  it.each(['personId', 'action', 'targetDomain', 'riskLevel'])(
    'response body %s sai đỏ dù status/state đúng',
    async (field) => {
      const c = httpCases.find((c) => c.expected.status === 200)!
      const harness: BoundaryHttpHarness = {
        close: async () => {},
        observe: async () => {
          commit(proposals[0]!, `user:${pair.owner.userId}`)
          return {
            status: 200,
            body: {
              action: {
                ...dto(proposals[0]!),
                [field]:
                  field === 'personId'
                    ? pair.other.personId
                    : field === 'riskLevel'
                      ? 'high'
                      : 'wrong',
              },
            },
          }
        },
      }
      const observed = await executeHttpBoundary(pool, scope, group(c), c, tables, harness)
      expect(observed.checks.find((c) => c.name === 'http_status')?.ok).toBe(false)
    },
  )
  it('transport error vẫn throw, không tự chuyển thành status expected', async () => {
    const c = httpCases.find((c) => c.expected.status === 404)!
    const harness: BoundaryHttpHarness = {
      close: async () => {},
      observe: async () => {
        throw new Error('SYNTHETIC_HTTP_FAILED')
      },
    }
    await expect(executeHttpBoundary(pool, scope, group(c), c, tables, harness)).rejects.toThrow(
      'SYNTHETIC_HTTP_FAILED',
    )
  })
})

describe('note_tool orchestration (query/session giả)', () => {
  it.each(noteCases)(
    '$id gắn own source ID/raw content và giữ foreign ngoài outcome',
    async (c) => {
      allGreen(await executeNoteToolBoundary(pool, scope, group(c), c, tables))
      expect(fakes.document).toHaveBeenCalledTimes(2)
      expect(fakes.session).toHaveBeenCalledWith(
        expect.objectContaining({
          personId: pair.owner.personId,
          ephemeral: true,
          memoryConsent: false,
        }),
      )
      expect(documents[0]?.summary).toBe(c.input.value)
    },
  )
  it.each(['title', 'date', 'foreign', 'raw_mutation', 'fake_source_id'])(
    'canary/literal đúng vẫn đỏ khi %s sai',
    async (fault) => {
      noteTransform = (body) => {
        const parsed = z
          .object({
            notes: z.array(
              z.object({ title: z.string(), excerpt: z.string(), updatedAt: z.string() }),
            ),
            openTasks: z.array(z.unknown()),
            matchedQuery: z.string(),
          })
          .parse(body)
        if (fault === 'title') parsed.notes[0]!.title = 'counterfeit title'
        if (fault === 'date') parsed.notes[0]!.updatedAt = '2000-01-01'
        if (fault === 'foreign')
          parsed.notes.push({
            title: 'foreign',
            excerpt: 'SYNTHETIC_FOREIGN_NOTE_CANARY',
            updatedAt: '2026-10-17',
          })
        if (fault === 'raw_mutation') documents[0]!.summary = 'silently overwritten'
        if (fault === 'fake_source_id') documents[0]!.id = randomUUID()
        return parsed
      }
      const c = noteCases[0]!
      const observed = await executeNoteToolBoundary(pool, scope, group(c), c, tables)
      expect(observed.checks.find((c) => c.name === 'source_identity')?.ok).toBe(false)
    },
  )
})
