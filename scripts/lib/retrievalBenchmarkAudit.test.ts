// Payload/row fault controls cho oracle, không PG hoặc actual seed/services.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Socket } from 'node:net'
import { Pool } from 'pg'
import { z } from 'zod'
import { corpus, fixture, uuid } from './retrievalBenchmarkCli.unitFixtures.js'
import {
  validateRetrievalSeedState,
  assertRetrievalSeedUnchanged,
  readRetrievalSeedState,
  type RetrievalSeedState,
} from './retrievalBenchmarkAudit.js'
import type { RetrievalSeed } from './retrievalBenchmarkRunner.js'
import { FROZEN_DEFINITION_SHA256 } from './retrievalBenchmarkSchema.js'

function auditFixture() {
  const snapshot = fixture().snapshot
  const seed: RetrievalSeed = {
    version: 1,
    corpusHash: FROZEN_DEFINITION_SHA256,
    persons: snapshot.persons,
    records: snapshot.records.map((row) => ({
      recordKey: row.recordKey,
      recordId: row.record.id,
      personKey: snapshot.persons.find((person) => person.personId === row.record.personId)!
        .personKey,
    })),
  }
  const memory: RetrievalSeedState['memory'] = snapshot.records.map(({ recordKey, record }) => {
    const created = recordKey === 'R01' ? '2026-10-16T23:59:30.000Z' : record.createdAt
    return {
      id: record.id,
      person_id: record.personId,
      namespace: record.namespace,
      content: record.content,
      provenance: record.provenance,
      sensitivity: record.sensitivity,
      status: record.status,
      version: record.version,
      merged_from_id: null,
      created_at: created,
      updated_at: record.version === 2 ? '2026-10-16T23:59:30.000Z' : created,
      retain_until: null,
      importance: 5,
      last_accessed_at: null,
      access_count: 0,
      valid_from: created,
      valid_to: record.validTo ?? null,
      superseded_by: record.supersededBy ?? null,
      source_message_id: null,
      embedding: null,
      embedding_model: null,
      search_tsv: "'synthetic':1",
    }
  })
  const id = (key: string) => seed.records.find((row) => row.recordKey === key)!.recordId
  const audit: RetrievalSeedState['audit'] = memory.map((row, index) => ({
    id: index + 1,
    record_id: row.id,
    person_id: row.person_id,
    action: 'INSERT',
    changes: {
      namespace: row.namespace,
      content: row.content,
      ...(row.id === id('R01') ? { supersedes: id('R02') } : {}),
    },
    changed_by: 'stored-s05-synthetic',
    audited_at: row.created_at,
  }))
  for (const key of ['R02', 'R13', 'R14']) {
    const row = memory.find((row) => row.id === id(key))!
    audit.push({
      id: audit.length + 1,
      record_id: row.id,
      person_id: row.person_id,
      action: key === 'R14' ? 'EXPIRE' : 'UPDATE',
      changed_by: 'stored-s05-synthetic',
      audited_at: row.updated_at,
      changes:
        key === 'R02'
          ? { supersededBy: id('R01'), validTo: row.valid_to }
          : key === 'R13'
            ? { invalidated: true, reason: 'synthetic fixture lifecycle' }
            : { previousStatus: 'accepted' },
    })
  }
  const state: RetrievalSeedState = { memory, audit, at: new Date('2026-10-17T00:00:00.000Z') }
  const lower = new Date('2026-10-16T23:58:00.000Z')
  return {
    seed,
    state,
    lower,
    validate: () => validateRetrievalSeedState(corpus, seed, state, lower),
  }
}
let external = 0
beforeEach(() => {
  external = 0
  const forbidden = () => {
    external++
    throw new Error('UNIT_NO_EXTERNAL')
  }
  vi.spyOn(Socket.prototype, 'connect').mockImplementation(forbidden)
  vi.spyOn(Pool.prototype, 'connect').mockImplementation(forbidden)
  vi.stubGlobal('fetch', forbidden)
})
afterEach(() => {
  expect(external).toBe(0)
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
describe('rank-seed audit independent literal contract', () => {
  it('26 INSERT + supersession UPDATE + invalidation UPDATE + EXPIRE =29, own typed payloads', () => {
    const test = auditFixture()
    const state = test.validate()
    expect(state.memory).toHaveLength(26)
    expect(state.audit).toHaveLength(29)
  })
  it.each([
    'missing',
    'extra',
    'wrongOwner',
    'wrongRecord',
    'wrongActor',
    'wrongType',
    'wrongContent',
    'wrongSupersedes',
    'wrongReason',
    'wrongValidTo',
    'futureTime',
    'beforeClock',
    'wrongVersion',
    'wrongPrivacy',
    'wrongSource',
    'wrongEmbedding',
    'touch',
    'extraPayload',
  ])('phát hiện %s, không chỉ count', (fault) => {
    const test = auditFixture()
    const event = test.state.audit[0]!
    const row = test.state.memory[0]!
    if (fault === 'missing') test.state.audit.pop()
    if (fault === 'extra') test.state.audit.push({ ...event, id: 1000 })
    if (fault === 'wrongOwner') event.person_id = uuid(1002)
    if (fault === 'wrongRecord') event.record_id = uuid(1003)
    if (fault === 'wrongActor') event.changed_by = 'other'
    if (fault === 'wrongType') event.action = 'MERGE'
    if (fault === 'wrongContent') event.changes = { namespace: row.namespace, content: 'altered' }
    if (fault === 'wrongSupersedes')
      event.changes = { namespace: row.namespace, content: row.content, supersedes: uuid(1004) }
    if (fault === 'wrongReason')
      test.state.audit[27]!.changes = { invalidated: true, reason: 'other' }
    if (fault === 'wrongValidTo')
      test.state.audit[26]!.changes = { supersededBy: row.id, validTo: null }
    if (fault === 'futureTime') event.audited_at = '2027-01-01T00:00:00.000Z'
    if (fault === 'beforeClock') event.audited_at = '2025-01-01T00:00:00.000Z'
    if (fault === 'wrongVersion') row.version = 2
    if (fault === 'wrongPrivacy') row.sensitivity = 'public'
    if (fault === 'wrongSource') row.provenance = 'other_source'
    if (fault === 'wrongEmbedding') row.embedding_model = 'unexpected'
    if (fault === 'touch') row.access_count = 1
    if (fault === 'extraPayload')
      event.changes = JSON.parse(
        '{"namespace":"semantic","content":"altered","__proto__":{"hidden":true}}',
      )
    expect(test.validate).toThrow()
  })
  it('extra own __proto__ key không bị Zod loại trước so payload', () => {
    const test = auditFixture()
    const event = test.state.audit[0]!
    Object.defineProperty(event.changes, '__proto__', { value: { hidden: true }, enumerable: true })
    expect(test.validate).toThrow()
  })
  it('extra own raw-row metadata không bị drop trước fullrow oracle', () => {
    const test = auditFixture()
    Object.defineProperty(test.state.memory[0], '__proto__', {
      value: { hidden: true },
      enumerable: true,
    })
    expect(test.validate).toThrow()
  })
  it('mọi full memory/audit field phải unchanged sau read, không chỉ access count', () => {
    const before = auditFixture().validate()
    const after = structuredClone(before)
    after.at = new Date('2026-10-17T00:00:02.000Z')
    expect(() => assertRetrievalSeedUnchanged(before, after)).not.toThrow()
    after.memory[0]!.search_tsv = "'altered':1"
    expect(() => assertRetrievalSeedUnchanged(before, after)).toThrow()
  })
  it('audit mutated after read phải fail kể cả còn29 events', () => {
    const before = auditFixture().validate()
    const after = structuredClone(before)
    after.audit[0]!.changed_by = 'mutated'
    expect(() => assertRetrievalSeedUnchanged(before, after)).toThrow()
  })
  it('mapping UUID/person key bị tráo không được chấp nhận', () => {
    const test = auditFixture()
    test.seed.records[0]!.personKey = 'P3'
    expect(test.validate).toThrow()
  })
  it.each(['control', 'missing', 'extra', 'wrongOwner', 'wrongRecord'])(
    'Pool read boundary %s: bound own IDs, thiếu/sai audit không qua gate',
    async (fault) => {
      const test = auditFixture()
      const pool = new Pool()
      const queried: string[] = []
      const response = (rows: Record<string, unknown>[]) => ({
        rows,
        rowCount: rows.length,
        command: 'SELECT',
        oid: 0,
        fields: [],
      })
      vi.spyOn(pool, 'query').mockImplementation((sql, values) => {
        if (typeof sql !== 'string') throw new Error('UNIT_SQL_TYPE')
        queried.push(sql)
        if (sql === 'select clock_timestamp() as at')
          return Promise.resolve(response([{ at: test.state.at }]))
        const ids = z.tuple([z.array(z.uuid())]).parse(values)[0]
        expect(ids).toEqual(test.seed.persons.map((person) => person.personId))
        expect(sql).toContain('where person_id = any($1::uuid[]) order by id')
        if (sql.includes('from personal.memory_records t'))
          return Promise.resolve(response(test.state.memory.map((value) => ({ value }))))
        if (!sql.includes('from personal.memory_records_audit_log t'))
          throw new Error('UNIT_SQL_UNKNOWN')
        const rows = structuredClone(test.state.audit)
        if (fault === 'missing') rows.pop()
        if (fault === 'extra') rows.push({ ...rows[0]!, id: 999 })
        if (fault === 'wrongOwner') rows[0]!.person_id = uuid(1001)
        if (fault === 'wrongRecord') rows[0]!.record_id = uuid(1002)
        return Promise.resolve(response(rows.map((value) => ({ value }))))
      })
      try {
        const operation = readRetrievalSeedState(pool, corpus, test.seed, test.lower)
        if (fault === 'control') await expect(operation).resolves.toEqual(test.state)
        else await expect(operation).rejects.toThrow()
        expect(queried).toHaveLength(3)
      } finally {
        await pool.end()
      }
    },
  )
})
