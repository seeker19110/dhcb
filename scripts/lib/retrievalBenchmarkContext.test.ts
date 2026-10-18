// Orchestration/oracle với services và Context Engine fake; không PG/retrieval/provider proof.
import { randomUUID } from 'node:crypto'
import { Socket } from 'node:net'
import { Pool, Client, type QueryResult } from 'pg'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { MemoryRecordSchema } from '@dhcb/core-contracts/personalMemory'
import { ConsentGrantSchema } from '@dhcb/core-contracts/consentGrant'
import { ContextPackageSchema, type ContextPackage } from '@dhcb/core-contracts/contextPackage'
import {
  ingestMemory,
  expireMemoryRecord,
  invalidateMemoryWithClient,
  supersedeMemoryWithClient,
} from '@dhcb/core-personal/memoryService'
import { grantConsent, revokeConsent, listConsents } from '@dhcb/core-personal/consentService'
import { buildContextPackage } from '@dhcb/core-personal/contextEngine'
import type { OwnedFixtureScope } from './companionBoundaryDb.js'
import { runRetrievalContextProbes } from './retrievalBenchmarkContext.js'

const fakes = vi.hoisted(() => ({
  ingest: vi.fn<typeof ingestMemory>(),
  expire: vi.fn<typeof expireMemoryRecord>(),
  invalidate: vi.fn<typeof invalidateMemoryWithClient>(),
  supersede: vi.fn<typeof supersedeMemoryWithClient>(),
  grant: vi.fn<typeof grantConsent>(),
  revoke: vi.fn<typeof revokeConsent>(),
  consents: vi.fn<typeof listConsents>(),
  context: vi.fn<typeof buildContextPackage>(),
}))
vi.mock('@dhcb/core-personal/memoryService', () => ({
  ingestMemory: fakes.ingest,
  expireMemoryRecord: fakes.expire,
  invalidateMemoryWithClient: fakes.invalidate,
  supersedeMemoryWithClient: fakes.supersede,
}))
vi.mock('@dhcb/core-personal/consentService', () => ({
  grantConsent: fakes.grant,
  revokeConsent: fakes.revoke,
  listConsents: fakes.consents,
}))
vi.mock('@dhcb/core-personal/contextEngine', () => ({ buildContextPackage: fakes.context }))
type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
interface Row {
  id: string
  person_id: string
  namespace: 'semantic'
  content: string
  provenance: string
  sensitivity: 'public' | 'personal' | 'sensitive' | 'restricted'
  status: 'accepted' | 'expired'
  merged_from_id: null
  version: number
  created_at: string
  updated_at: string
  retain_until: null
  importance: number
  last_accessed_at: string | null
  access_count: number
  valid_from: string
  valid_to: string | null
  superseded_by: string | null
  source_message_id: null
  embedding: null
  embedding_model: string | null
  search_tsv: string
}
interface Audit {
  id: number
  person_id: string
  record_id: string
  action: string
  changes: Record<string, Json>
  changed_by: string
  audited_at: string
}
interface Grant {
  id: string
  person_id: string
  scope: string
  purpose: string
  version: number
  status: 'active' | 'revoked'
  granted_at: string
  expires_at: string | null
  revoked_at: string | null
}
interface Person {
  id: string
  user_id: string
  display_name: string
  created_at: string
  updated_at: string
}
const NOW = '2026-10-17T08:00:00.000Z'
const TABLES = [
  'personal.memory_records',
  'personal.memory_records_audit_log',
  'personal.consent_grants',
  'personal.proposed_actions',
  'worklife.tasks',
]
const catalog = TABLES.map((table) => {
  const [table_schema, table_name] = table.split('.')
  return { table_schema, table_name }
})
const sensitivities = ['public', 'personal', 'sensitive', 'restricted']
let rows: Row[]
let audit: Audit[]
let grants: Grant[]
let persons: Person[]
let latestOwner: string
let latestOther: string
let mode: string
let auditId: number
let pool: Pool
let networkAttempts: number
let rootCalls: number
const unexpected: string[] = []
const scope: Pick<OwnedFixtureScope, 'newPerson'> = { newPerson: vi.fn() }
function response<T extends object>(data: T[]): QueryResult<T> {
  return { rows: data, rowCount: data.length, command: 'SELECT', fields: [], oid: 0 }
}
function memoryDto(row: Row) {
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
    createdAt: row.created_at,
    validFrom: row.valid_from,
    ...(row.valid_to ? { validTo: row.valid_to } : {}),
    ...(row.superseded_by ? { supersededBy: row.superseded_by } : {}),
    hasEmbedding: false,
  })
}
function grantDto(row: Grant) {
  return ConsentGrantSchema.parse({
    schemaVersion: 1,
    id: row.id,
    personId: row.person_id,
    scope: row.scope,
    purpose: row.purpose,
    version: row.version,
    status: row.status,
    grantedAt: row.granted_at,
    ...(row.expires_at ? { expiresAt: row.expires_at } : {}),
    ...(row.revoked_at ? { revokedAt: row.revoked_at } : {}),
  })
}
function addRow(
  personId: string,
  body: string,
  provenance: string,
  sensitivity: Row['sensitivity'],
): Row {
  const row: Row = {
    id: randomUUID(),
    person_id: personId,
    namespace: 'semantic',
    content: body,
    provenance,
    sensitivity,
    status: 'accepted',
    merged_from_id: null,
    version: 1,
    created_at: NOW,
    updated_at: NOW,
    retain_until: null,
    importance: 5,
    last_accessed_at: null,
    access_count: 0,
    valid_from: NOW,
    valid_to: null,
    superseded_by: null,
    source_message_id: null,
    embedding: null,
    embedding_model: null,
    search_tsv: 'SYNTHETIC_TSV',
  }
  rows.push(row)
  return row
}
function addAudit(row: Row, action: string, changes: Record<string, Json>, actor: string) {
  audit.push({
    id: ++auditId,
    person_id: row.person_id,
    record_id: row.id,
    action,
    changes,
    changed_by: actor,
    audited_at: NOW,
  })
}
function mustRow(person: string, id: string) {
  const row = rows.find((r) => r.id === id && r.person_id === person)
  if (!row) throw new Error('BAD_FAKE_RECORD')
  return row
}
beforeEach(() => {
  vi.clearAllMocks()
  rows = []
  audit = []
  grants = []
  persons = []
  mode = 'clean'
  auditId = 0
  networkAttempts = 0
  rootCalls = 0
  latestOwner = ''
  latestOther = ''
  unexpected.length = 0
  vi.spyOn(Socket.prototype, 'connect').mockImplementation(() => {
    networkAttempts++
    throw new Error('UNEXPECTED_SOCKET')
  })
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    networkAttempts++
    throw new Error('UNEXPECTED_FETCH')
  })
  pool = new Pool({
    host: '127.0.0.1',
    port: 56543,
    database: 'dhcb_stored_test',
    user: 'synthetic',
    password: 'not-a-secret',
  })
  const client = Object.assign(new Client(), { release: vi.fn() })
  vi.spyOn(client, 'query').mockImplementation(() => Promise.resolve(response([])))
  vi.spyOn(pool, 'connect').mockImplementation(async () => client)
  vi.spyOn(pool, 'end')
  vi.spyOn(pool, 'query').mockImplementation((sql, values) => {
    if (typeof sql !== 'string') {
      unexpected.push('SQL_TYPE')
      throw new Error('SQL_TYPE')
    }
    if (sql.includes('information_schema.columns')) return Promise.resolve(response(catalog))
    if (sql === 'select clock_timestamp() as observed_at')
      return Promise.resolve(response([{ observed_at: new Date(NOW) }]))
    const ids = z.tuple([z.array(z.uuid())]).parse(values)[0]
    if (sql.includes('from personal.persons'))
      return Promise.resolve(
        response(
          persons
            .filter((row) => ids.includes(row.id))
            .map((value) => ({ value: structuredClone(value) })),
        ),
      )
    const match = /from "([a-z_]+)"\."([a-z_]+)"/.exec(sql)
    const table = match ? `${match[1]}.${match[2]}` : ''
    if (!TABLES.includes(table)) {
      unexpected.push('UNKNOWN_SQL')
      throw new Error('UNKNOWN_SQL')
    }
    const data =
      table === 'personal.memory_records'
        ? rows.filter((row) => ids.includes(row.person_id))
        : table === 'personal.memory_records_audit_log'
          ? audit.filter((row) => ids.includes(row.person_id))
          : table === 'personal.consent_grants'
            ? grants.filter((row) => ids.includes(row.person_id))
            : []
    return Promise.resolve(response(data.map((value) => ({ value: structuredClone(value) }))))
  })
  vi.mocked(scope.newPerson).mockImplementation(async () => {
    rootCalls++
    const person = { userId: randomUUID(), personId: randomUUID() }
    if (rootCalls % 2 === 1) latestOwner = person.personId
    else latestOther = person.personId
    persons.push({
      id: person.personId,
      user_id: person.userId,
      display_name: 'synthetic',
      created_at: NOW,
      updated_at: NOW,
    })
    return person
  })
  fakes.ingest.mockImplementation(async (_pool, person, candidate, actor) => {
    const row = addRow(person, candidate.content, candidate.provenance, candidate.sensitivity)
    addAudit(row, 'INSERT', { namespace: 'semantic', content: row.content }, actor ?? 'system')
    return {
      record: memoryDto(row),
      evaluation: { outcome: mode === 'seed_merge' ? 'MERGE' : 'ACCEPT', reason: 'synthetic_fake' },
    }
  })
  fakes.expire.mockImplementation(async (_pool, person, id, _version, actor) => {
    const row = mustRow(person, id)
    if (mode !== 'bad_lifecycle') {
      row.status = 'expired'
      row.version++
      row.updated_at = NOW
    }
    addAudit(row, 'EXPIRE', { previousStatus: 'accepted' }, actor ?? 'system')
    return memoryDto(row)
  })
  fakes.invalidate.mockImplementation(async (_client, person, id, _version, actor, reason) => {
    const row = mustRow(person, id)
    row.valid_to = NOW
    row.updated_at = NOW
    row.version++
    addAudit(row, 'UPDATE', { invalidated: true, reason: reason ?? '' }, actor ?? 'system')
    return memoryDto(row)
  })
  fakes.supersede.mockImplementation(async (_client, person, input, actor) => {
    const old = mustRow(person, input.recordId)
    const fresh = addRow(person, input.content, input.provenance, old.sensitivity)
    old.valid_to = NOW
    old.updated_at = NOW
    old.version++
    old.superseded_by = fresh.id
    addAudit(
      fresh,
      'INSERT',
      { namespace: 'semantic', content: fresh.content, supersedes: old.id },
      actor ?? 'system',
    )
    addAudit(old, 'UPDATE', { supersededBy: fresh.id, validTo: NOW }, actor ?? 'system')
    return { record: memoryDto(fresh), previous: memoryDto(old) }
  })
  fakes.grant.mockImplementation(async (_pool, input) => {
    const row: Grant = {
      id: randomUUID(),
      person_id: input.personId,
      scope: input.scope,
      purpose: input.purpose,
      version: 1,
      status: 'active',
      granted_at: mode === 'future_grant' ? '2030-01-01T00:00:00.000Z' : NOW,
      expires_at: input.expiresAt ?? null,
      revoked_at: null,
    }
    if (mode !== 'missing_grant') grants.push(row)
    return grantDto(row)
  })
  fakes.revoke.mockImplementation(async (_pool, person, id) => {
    const row = grants.find((r) => r.id === id && r.person_id === person)
    if (!row) throw new Error('BAD_FAKE_GRANT')
    row.status = 'revoked'
    row.revoked_at = NOW
  })
  fakes.consents.mockImplementation(async (_pool, person) =>
    grants.filter((row) => row.person_id === person).map(grantDto),
  )
  fakes.context.mockImplementation(async (_pool, input) => {
    const active = grants.some(
      (row) =>
        row.person_id === input.personId &&
        row.scope === 'personal_memory.read' &&
        row.purpose === input.purpose &&
        row.status === 'active' &&
        (row.expires_at === null || Date.parse(row.expires_at) > Date.parse(NOW)),
    )
    const person =
      mode === 'foreign_leak' && input.personId === latestOther ? latestOwner : input.personId
    let selected =
      input.includePersonalContext && (active || mode === 'consent_bypass')
        ? rows.filter(
            (row) =>
              row.person_id === person &&
              (mode === 'lifecycle_bypass' ||
                (row.status !== 'expired' && row.valid_to === null)) &&
              (mode === 'sensitivity_bypass' ||
                sensitivities.indexOf(row.sensitivity) <=
                  sensitivities.indexOf(input.maxSensitivity ?? 'personal')),
          )
        : []
    if (mode === 'empty') selected = []
    const touched =
      mode === 'extra_touch' ? rows.filter((row) => row.person_id === latestOwner) : selected
    if (mode !== 'no_touch')
      for (const row of touched) {
        row.access_count++
        row.last_accessed_at = mode === 'future_touch' ? '2030-01-01T00:00:00.000Z' : NOW
      }
    const items: ContextPackage['items'] = selected.map((row) => ({
      sourceType: mode === 'wrong_type' ? 'recent_episodic_context' : 'validated_derived_memory',
      sourceId: mode === 'wrong_source_id' ? randomUUID() : row.id,
      content: `[semantic] ${mode === 'hide_canary' ? row.content.split(' ').slice(0, -1).join(' ') : row.content}`,
      provenance: `personal_memory:${row.provenance}`,
      sensitivity: row.sensitivity,
      tokenEstimate: 30,
    }))
    if (input.maxSensitivity !== 'public')
      items.unshift({
        sourceType: 'current_request',
        sourceId: randomUUID(),
        content: input.requestText,
        provenance: 'user_input:current_turn',
        sensitivity: 'personal',
        tokenEstimate: 20,
      })
    if (mode === 'metadata_model') {
      const row = rows.find((r) => r.person_id === latestOwner)
      if (row) row.embedding_model = 'drift'
    }
    if (mode === 'metadata_content') {
      const row = rows.find((r) => r.person_id === latestOwner)
      if (row) row.content = 'drift'
    }
    if (mode === 'metadata_updated') {
      const row = rows.find((r) => r.person_id === latestOwner)
      if (row) row.updated_at = '2030-01-01T00:00:00.000Z'
    }
    if (mode === 'audit_proto') {
      const row = audit.find((event) => event.person_id === latestOwner)
      if (row) row.changes = { ...row.changes, ['__proto__']: { unexpected: true } }
    }
    if (mode === 'extra_memory') addRow(latestOwner, 'unexpected new memory', 'synthetic', 'public')
    if (mode === 'business_person') {
      const row = persons.find((r) => r.id === latestOwner)
      if (row) row.display_name = 'changed'
    }
    if (mode === 'business_grant') {
      const row = grants.find((r) => r.person_id === latestOwner)
      if (row) row.purpose = 'changed'
    }
    if (mode === 'request_echo') {
      const first = rows.find((r) => r.person_id === latestOwner)
      if (first)
        items.push({
          sourceType: 'current_request',
          sourceId: randomUUID(),
          content: first.content,
          provenance: 'user_input:current_turn',
          sensitivity: 'personal',
          tokenEstimate: 30,
        })
    }
    return ContextPackageSchema.parse({
      schemaVersion: 1,
      id: randomUUID(),
      personId: mode === 'wrong_identity' ? latestOther : input.personId,
      requestId: input.requestId,
      items,
      tokenBudget: input.tokenBudget,
      tokenUsed: items.reduce((n, item) => n + item.tokenEstimate, 0),
      createdAt: NOW,
    })
  })
})
afterEach(async () => {
  await pool.end()
  vi.restoreAllMocks()
  expect(unexpected).toEqual([])
  expect(networkAttempts).toBe(0)
})
const run = () => runRetrievalContextProbes(pool, scope, { tokenBudget: 4000 })
describe('S05 context helper orchestration; boundaries fake', () => {
  it('8 cohorts, lifecycle controls, exact own sources, writable touch và no caller cleanup', async () => {
    const report = await run()
    expect(report).toMatchObject({
      status: 'PASSED',
      planned: 8,
      executed: 8,
      passed: 8,
      failed: 0,
    })
    expect(rootCalls).toBe(16)
    expect(fakes.context).toHaveBeenCalledTimes(8)
    expect(rows).toHaveLength(56)
    expect(audit).toHaveLength(80)
    expect(pool.end).not.toHaveBeenCalled()
    for (const call of fakes.ingest.mock.calls) {
      expect(call[2].confidence).toBe(1)
      expect(await call[4]?.embed?.(call[2].content)).toBeNull()
    }
    for (const [, request] of fakes.context.mock.calls) {
      expect(
        rows.some(
          (row) =>
            request.requestText.includes(row.id) ||
            request.requestText.includes(row.content.split(' ').at(-1) ?? 'UNMATCHED'),
        ),
      ).toBe(false)
    }
  })
  it.each([
    'empty',
    'hide_canary',
    'wrong_source_id',
    'wrong_type',
    'wrong_identity',
    'consent_bypass',
    'foreign_leak',
    'sensitivity_bypass',
    'lifecycle_bypass',
    'no_touch',
    'future_touch',
    'extra_touch',
    'metadata_model',
    'metadata_content',
    'metadata_updated',
    'extra_memory',
    'business_person',
    'business_grant',
    'audit_proto',
    'request_echo',
  ])('oracle bắt %s', async (fault) => {
    mode = fault
    const report = await run()
    expect(report.status).toBe('FAILED')
    expect(report.failed).toBeGreaterThan(0)
  })
  it.each(['seed_merge', 'bad_lifecycle', 'missing_grant', 'future_grant'])(
    'fixture %s không được thành deny pass',
    async (fault) => {
      mode = fault
      const report = await run()
      expect(report.status).toBe('FAILED')
      expect(report.results.some((row) => row.crashed)).toBe(true)
    },
  )
  it('positive control rỗng không để các deny cohort được tính đạt', async () => {
    mode = 'empty'
    const report = await run()
    expect(report.passed).toBe(0)
    expect(report.results.find((row) => row.id === 'CTX03-none')?.failedChecks).toContain(
      'positive_control',
    )
  })
  it('budget thiếu bị từ chối trước allocate hoặc SQL', async () => {
    await expect(runRetrievalContextProbes(pool, scope, { tokenBudget: 1 })).rejects.toThrow(
      'TOKEN_BUDGET_INSUFFICIENT',
    )
    expect(scope.newPerson).not.toHaveBeenCalled()
    expect(pool.query).not.toHaveBeenCalled()
  })
  it('unrelated baseline không nằm own snapshots và không bị mutate', async () => {
    const baseline = addRow(
      randomUUID(),
      'Unrelated baseline remains intact.',
      'user_declared:baseline',
      'public',
    )
    addAudit(baseline, 'INSERT', { namespace: 'semantic', content: baseline.content }, 'baseline')
    const before = structuredClone({ baseline, audit: audit[0] })
    expect((await run()).status).toBe('PASSED')
    expect(baseline).toEqual(before.baseline)
    expect(audit[0]).toEqual(before.audit)
  })
  it('caller scope tái dùng identity không được seed hoặc probe', async () => {
    const identity = { userId: randomUUID(), personId: randomUUID() }
    vi.mocked(scope.newPerson).mockResolvedValue(identity)
    const report = await run()
    expect(report.status).toBe('FAILED')
    expect(report.failed).toBe(8)
    expect(fakes.ingest).not.toHaveBeenCalled()
    expect(fakes.context).not.toHaveBeenCalled()
  })
})
