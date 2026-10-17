// @vitest-environment node
// Review độc lập oracle orchestration. Probe/fixtures/readers đều fake: không PG/prepare/SDK proof.
import { randomUUID } from 'node:crypto'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { Pool, type QueryResult } from 'pg'
import { ProposedActionSchema } from '@dhcb/core-contracts/proposedAction'
import { ConsentGrantSchema } from '@dhcb/core-contracts/consentGrant'
import type { listConsents } from '@dhcb/core-personal/consentService'
import type {
  createRuntimeConsentProbe,
  RuntimeConsentObservation,
} from './companionRuntimeConsent.js'
import type { newBoundaryPair, configureBoundaryConsent } from './companionBoundaryFixtures.js'
import type {
  readBoundaryProposals,
  readBoundaryAudit,
  snapshotBoundaryDomain,
} from './companionBoundaryAuthority.js'
import {
  OwnedFixtureScope,
  REQUIRED_COLUMNS,
  parseDisposableDatabase,
} from './companionBoundaryDb.js'
import type { BoundaryNetworkGuard } from './companionBoundaryNetwork.js'
import { executeRuntimeConsentBoundary } from './companionBoundaryRuntime.js'

const fakes = vi.hoisted(() => ({
  factory: vi.fn<typeof createRuntimeConsentProbe>(),
  pair: vi.fn<typeof newBoundaryPair>(),
  consent: vi.fn<typeof configureBoundaryConsent>(),
  proposals: vi.fn<typeof readBoundaryProposals>(),
  audit: vi.fn<typeof readBoundaryAudit>(),
  snapshot: vi.fn<typeof snapshotBoundaryDomain>(),
  listConsents: vi.fn<typeof listConsents>(),
}))
vi.mock('@dhcb/core-personal/consentService', () => ({ listConsents: fakes.listConsents }))
vi.mock('./companionRuntimeConsent.js', () => ({
  createRuntimeConsentProbe: fakes.factory,
}))
vi.mock('./companionBoundaryFixtures.js', () => ({
  newBoundaryPair: fakes.pair,
  configureBoundaryConsent: fakes.consent,
}))
vi.mock('./companionBoundaryAuthority.js', () => ({
  readBoundaryProposals: fakes.proposals,
  readBoundaryAudit: fakes.audit,
  snapshotBoundaryDomain: fakes.snapshot,
}))

type Pair = Awaited<ReturnType<typeof newBoundaryPair>>
type Proposal = Awaited<ReturnType<typeof readBoundaryProposals>>[number]
type Grant = {
  personId: string
  scope: string
  state: Parameters<typeof configureBoundaryConsent>[3]
}
const target = parseDisposableDatabase(
  'postgresql://synthetic:not-a-secret@127.0.0.1:56543/dhcb_stored_test',
  'stored-local',
  {},
)
const catalog = Object.entries(REQUIRED_COLUMNS).flatMap(([table, columns]) => {
  const [table_schema, table_name] = table.split('.')
  return columns.map((column_name) => ({ table_schema, table_name, column_name }))
})
const READ = ['get_learning_progress', 'get_review_queue', 'search_notes', 'lookup_dictionary']
const TABLES = ['personal.memory_records', 'personal.personal_facts', 'worklife.documents']
const CONTENT = 'Thích đọc truyện bằng tiếng Anh vào buổi tối.'
const MARKER = 'SYNTHETIC_PRIVATE_OBSERVATION_MARKER'
let pool: Pool
let scope: OwnedFixtureScope
let pair: Pair
let grants: Grant[]
let rows: Proposal[]
let mode: string
let dailyReads: number
let domainChanged: boolean
let violations: number
let closeCalls: number
let lateDailyTokens: number
const network: BoundaryNetworkGuard = {
  get violations() {
    return violations
  },
  allowPort: () => () => {},
  withFetchResponder: async (_responder, operation) => operation(),
  restore: () => {},
}
function response<T extends object>(data: T[]): QueryResult<T> {
  return { rows: data, rowCount: data.length, command: 'SELECT', fields: [], oid: 0 }
}
beforeEach(async () => {
  vi.clearAllMocks()
  mode = 'clean'
  grants = []
  rows = []
  dailyReads = 0
  domainChanged = false
  violations = 0
  closeCalls = 0
  lateDailyTokens = 0
  pool = new Pool(target.poolConfig)
  vi.spyOn(pool, 'query').mockImplementation((sql) => {
    if (sql === 'select current_database() as database')
      return Promise.resolve(response([{ database: 'dhcb_stored_test' }]))
    if (sql.includes('from information_schema.columns')) return Promise.resolve(response(catalog))
    if (sql.includes('from platform.ai_token_usage_daily')) {
      dailyReads++
      if (mode === 'daily_throw' && dailyReads > 1) throw new Error(MARKER)
      return Promise.resolve(
        response([
          {
            value: {
              model: 'synthetic',
              tokens: mode === 'daily_changed' && dailyReads > 1 ? 1 : lateDailyTokens,
            },
          },
        ]),
      )
    }
    throw new Error('UNEXPECTED_FAKE_SQL')
  })
  scope = await OwnedFixtureScope.open(pool, target, async () => {})
  fakes.pair.mockImplementation(async () => {
    pair = {
      owner: { userId: randomUUID(), personId: randomUUID() },
      other: { userId: randomUUID(), personId: randomUUID() },
    }
    grants = []
    rows = []
    domainChanged = false
    return pair
  })
  fakes.consent.mockImplementation(async (_pool, person, scope, state) => {
    if (mode === 'drop_wrong_purpose_fixture' && state === 'wrong_purpose') return
    if (state !== 'none') grants.push({ personId: person.personId, scope, state })
  })
  fakes.listConsents.mockImplementation(async (_pool, personId) => {
    const result = grants
      .filter((grant) => grant.personId === personId)
      .map((grant) =>
        ConsentGrantSchema.parse({
          schemaVersion: 1,
          id: randomUUID(),
          personId: grant.personId,
          scope: grant.scope,
          purpose:
            grant.state === 'wrong_purpose' ? 'synthetic_wrong_purpose' : 'companion_conversation',
          version: mode === 'grant_version_wrong' ? 2 : 1,
          status: grant.state === 'revoked' ? 'revoked' : 'active',
          grantedAt: '2026-10-17T00:00:00.000Z',
          ...(grant.state === 'revoked' ? { revokedAt: '2026-10-17T00:01:00.000Z' } : {}),
          ...(grant.state === 'expired' ? { expiresAt: '2026-10-16T23:59:00.000Z' } : {}),
        }),
      )
    if (mode === 'extra_grant' && result[0]) result.push({ ...result[0], id: randomUUID() })
    return result
  })
  fakes.proposals.mockImplementation(async () => structuredClone(rows))
  fakes.audit.mockImplementation(async () =>
    mode === 'audit_nonempty'
      ? [
          {
            id: randomUUID(),
            person_id: pair.owner.personId,
            proposed_action_id: null,
            tool_id: 'memory.create_record',
            status: 'success',
            input_payload: {},
            output_payload: null,
          },
        ]
      : [],
  )
  fakes.snapshot.mockImplementation(
    async (_pool, _ids, tables) =>
      new Map(tables.map((table) => [table, domainChanged ? 'changed' : 'before'])),
  )
  fakes.factory.mockImplementation(async () => ({
    close: async () => {
      closeCalls++
      if (mode === 'close_throw') throw new Error(MARKER)
    },
    observe: async (_pool, input): Promise<RuntimeConsentObservation> => {
      if (mode === 'observe_throw') throw new Error(MARKER)
      const active =
        !input.ephemeral &&
        grants.some(
          (g) =>
            g.personId === input.personId &&
            g.scope === 'personal_memory.read' &&
            g.state === 'active',
        )
      const payload = {
        origin: 'agent',
        content: CONTENT,
        namespace: 'preference',
        importance: 5,
        sensitivity: 'personal',
      }
      const row: Proposal = {
        id: randomUUID(),
        person_id: input.personId,
        capability_id: 'memory.create_record',
        action: 'create_record',
        target_domain: 'personal',
        risk_level: 'low',
        payload,
        status: 'pending',
        version: 1,
        resolved_by: null,
        execution_result: null,
      }
      rows = active ? [row] : []
      const dto = ProposedActionSchema.parse({
        schemaVersion: 1,
        id: row.id,
        personId: row.person_id,
        capabilityId: row.capability_id,
        action: row.action,
        targetDomain: row.target_domain,
        payload,
        riskLevel: 'low',
        status: 'pending',
        createdAt: '2026-10-17T00:00:00.000Z',
      })
      if (mode === 'dto_committed') dto.status = 'committed'
      if (mode === 'dto_payload_wrong') dto.payload = { content: 'wrong content' }
      if (mode === 'dto_owner_wrong') dto.personId = pair.other.personId
      if (mode === 'dto_id_wrong') dto.id = randomUUID()
      if (mode === 'dto_capability_wrong') dto.capabilityId = 'profile.update_fact'
      if (mode === 'dto_action_wrong') dto.action = 'update_fact'
      if (mode === 'dto_domain_wrong') dto.targetDomain = 'profile'
      if (mode === 'dto_risk_wrong') dto.riskLevel = 'high'
      if (mode === 'dto_decided_at') dto.decidedAt = '2026-10-17T00:01:00.000Z'
      if (mode === 'db_payload_wrong') row.payload = { ...payload, content: 'wrong content' }
      const offeredTools = [
        ...READ,
        ...(input.ephemeral ? [] : ['propose_learning_goal', 'propose_profile_fact']),
        ...(active ? ['propose_memory'] : []),
      ]
      if (mode === 'inventory_duplicate') offeredTools.push(offeredTools[0]!)
      if (mode === 'domain_changed') domainChanged = true
      return {
        personId: mode === 'person_wrong' ? pair.other.personId : input.personId,
        userId: mode === 'user_wrong' ? pair.other.userId : pair.owner.userId,
        ephemeral: input.ephemeral,
        memoryConsent: active,
        contextItemCount: 0,
        offeredTools,
        proposals: active ? [dto] : [],
        outcome: active
          ? { content: JSON.stringify({ status: 'pending_user_confirmation', note: MARKER }) }
          : { content: MARKER, isError: true },
        classifier: {
          calls: 1,
          terminals: mode === 'classifier_terminal_missing' ? 0 : 1,
          failedCalls: 0,
          cancellations: 0,
          usage: 'unknown',
        },
      }
    },
  }))
})
afterEach(async () => {
  await pool.end()
  vi.restoreAllMocks()
})
const run = () => executeRuntimeConsentBoundary(pool, scope, TABLES, network)
describe('actual runtime oracle, mocked I/O/probe only', () => {
  it('huit cohorts green baseline, no serialized observation content', async () => {
    const r = await run()
    expect(r.status).toBe('PASSED')
    expect(r.passed).toBe(8)
    expect(closeCalls).toBe(8)
    expect(dailyReads).toBe(2)
    expect(JSON.stringify(r)).not.toContain(MARKER)
    expect(fakes.pair).toHaveBeenCalledTimes(8)
    for (const call of fakes.snapshot.mock.calls) {
      expect(call[1]).toHaveLength(2)
      expect(call[1][0]).not.toBe(call[1][1])
    }
  })
  it.each([
    'person_wrong',
    'user_wrong',
    'inventory_duplicate',
    'db_payload_wrong',
    'audit_nonempty',
    'domain_changed',
    'classifier_terminal_missing',
    'dto_id_wrong',
  ])('%s fails closed', async (fault) => {
    mode = fault
    expect((await run()).status).toBe('FAILED')
  })
  it.each([
    'dto_committed',
    'dto_payload_wrong',
    'dto_owner_wrong',
    'dto_capability_wrong',
    'dto_action_wrong',
    'dto_domain_wrong',
    'dto_risk_wrong',
    'dto_decided_at',
  ])('REGRESSION %s makes runtime proposal_state red', async (fault) => {
    mode = fault
    const r = await run()
    expect(r.status).toBe('FAILED')
    expect(r.results.find((c) => c.id === 'R01-active')?.failedChecks).toContain('proposal_state')
  })
  it('REGRESSION absent wrong-purpose grant crashes fixture before probe', async () => {
    mode = 'drop_wrong_purpose_fixture'
    const r = await run()
    expect(r.status).toBe('FAILED')
    expect(r.results.find((c) => c.id === 'R03-purpose')?.crashed).toBe(true)
    expect(fakes.factory).toHaveBeenCalledTimes(7)
  })
  it.each(['extra_grant', 'grant_version_wrong'])(
    '%s rejects fixture before active probe',
    async (fault) => {
      mode = fault
      const report = await run()
      expect(report.status).toBe('FAILED')
      expect(report.results.find((c) => c.id === 'R01-active')?.crashed).toBe(true)
      expect(fakes.factory).toHaveBeenCalledTimes(1)
    },
  )
  it('daily global drift makes global status red without serializing rows', async () => {
    mode = 'daily_changed'
    const r = await run()
    expect(r.status).toBe('FAILED')
    expect(r.dailyUnchanged).toBe(false)
    expect(JSON.stringify(r)).not.toContain('tokens')
  })
  it('daily snapshot exception propagates; cannot be passed observation', async () => {
    mode = 'daily_throw'
    await expect(run()).rejects.toThrow(MARKER)
  })
  it('LIMITATION helper snapshot alone does not drain future accounting; worker must post-close check', async () => {
    const original = fakes.factory.getMockImplementation()
    if (!original) throw new Error('FAKE_FACTORY_MISSING')
    let release: () => void = () => {}
    const barrier = new Promise<void>((resolve) => {
      release = resolve
    })
    let completed: Promise<void> = Promise.resolve()
    fakes.factory.mockImplementation(async (...args) => {
      const probe = await original(...args)
      return {
        ...probe,
        observe: async (...observeArgs) => {
          const result = await probe.observe(...observeArgs)
          completed = barrier.then(() => {
            lateDailyTokens = 1
          })
          return result
        },
      }
    })
    const report = await run()
    expect(report.status).toBe('PASSED')
    expect(report.dailyUnchanged).toBe(true)
    expect(closeCalls).toBe(8)
    release()
    await completed
    expect(lateDailyTokens).toBe(1)
    expect(dailyReads).toBe(2)
  })
  it.each(['observe_throw', 'close_throw'])(
    '%s cannot report pass and stays sanitized',
    async (fault) => {
      mode = fault
      const r = await run()
      expect(r.status).toBe('FAILED')
      expect(r.failed).toBe(8)
      expect(JSON.stringify(r)).not.toContain(MARKER)
      expect(closeCalls).toBe(8)
    },
  )
  it('network ledger dirty cannot report pass', async () => {
    violations = 1
    expect((await run()).status).toBe('FAILED')
  })
})
