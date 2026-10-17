// Caller sở hữu child, ledger, harness, cleanup và pool disposable.
import { isDeepStrictEqual } from 'node:util'
import type { Pool } from 'pg'
import { z } from 'zod'
import { NotFoundError, ConflictError } from '@dhcb/core-errors/appError'
import { ProposedActionSchema } from '@dhcb/core-contracts/proposedAction'
import { proposeAction, confirmAction } from '@dhcb/core-personal/proposedActionService'
import { declareFact } from '@dhcb/core-personal/personService'
import { ingestMemory } from '@dhcb/core-personal/memoryService'
import { createWorkDocument } from '@dhcb/core-domains/workService'
import { createCompanionToolSession, toToolData } from '@dhcb/core-personal/companionTools'
import type { OwnedFixtureScope } from './companionBoundaryDb.js'
import {
  BoundaryJsonSchema,
  type BoundaryCase,
  type BoundaryCorpus,
} from './companionBoundaryCorpus.js'
import type { BoundaryObservation } from './companionBoundaryEval.js'
import { newBoundaryPair, fixtureCanary } from './companionBoundaryFixtures.js'
import {
  readBoundaryProposals,
  readBoundaryAudit,
  readBoundaryFacts,
  snapshotBoundaryDomain,
} from './companionBoundaryAuthority.js'
import type { BoundaryHttpHarness } from './companionBoundaryHttp.js'

type Group = BoundaryCorpus['fixtureGroups'][number]
type ConfirmCase = Extract<BoundaryCase, { kind: 'proposal_confirm' }>
type HttpCase = Extract<BoundaryCase, { kind: 'proposal_http' }>
type PromptCase = Extract<BoundaryCase, { kind: 'prompt_wrapping' }>
type Capability = ConfirmCase['input']['capability']
type Pair = Awaited<ReturnType<typeof newBoundaryPair>>
const SEED_ACTOR = 'test:stored_boundary_fixture'
const NO_EMBED = { embed: async () => null }
const UUID = z.string().uuid()
type BoundaryJson = z.infer<typeof BoundaryJsonSchema>
const JsonObject = z.custom<Record<string, BoundaryJson>>(
  (value) =>
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    BoundaryJsonSchema.safeParse(value).success,
)
const DatabaseClockRows = z.array(z.object({ observed_at: z.date() }).strict()).length(1)
const DatabaseTimestamp = z.string().datetime({ offset: true })
const MemoryRows = z.array(
  z
    .object({
      id: UUID,
      person_id: UUID,
      namespace: z.string(),
      content: z.string(),
      provenance: z.string(),
      sensitivity: z.string(),
      status: z.string(),
      version: z.number().int().positive(),
      importance: z.number().int(),
      valid_from: z.date(),
      valid_to: z.date().nullable(),
      superseded_by: UUID.nullable(),
      source_message_id: UUID.nullable(),
      has_embedding: z.boolean(),
      raw: JsonObject,
      expected_search_tsv: z.string(),
    })
    .strict(),
)
const MemoryAuditRows = z.array(
  z
    .object({
      id: z.string().regex(/^\d+$/),
      person_id: UUID,
      record_id: UUID,
      action: z.string(),
      changes: BoundaryJsonSchema,
      changed_by: z.string(),
    })
    .strict(),
)
const ResolutionRows = z.array(
  z
    .object({
      id: UUID,
      person_id: UUID,
      action: z.string(),
      target_domain: z.string(),
      risk_level: z.string(),
      resolved_at: z.date().nullable(),
    })
    .strict(),
)
const DocumentRows = z.array(
  z
    .object({
      id: UUID,
      person_id: UUID,
      title: z.string(),
      document_type: z.string(),
      summary: z.string(),
      version: z.number().int().positive(),
      updated_at: z.date(),
    })
    .strict(),
)
const ToolNotes = z
  .object({
    notes: z.array(
      z
        .object({
          title: z.string(),
          excerpt: z.string(),
          updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        })
        .strict(),
    ),
    openTasks: z.array(z.unknown()),
    matchedQuery: z.string(),
  })
  .strict()
const ExecutionResult = z
  .object({
    status: z.literal('ok'),
    toolId: z.string(),
    executedAt: z.string().datetime(),
    detail: JsonObject,
  })
  .strict()
const same = isDeepStrictEqual // JSONB object key order không quyết định equality.
const sameStrings = (left: readonly string[], right: readonly string[]) =>
  same([...left].sort(), [...right].sort())
function changedTables(before: ReadonlyMap<string, string>, after: ReadonlyMap<string, string>) {
  return [...new Set([...before.keys(), ...after.keys()])].filter(
    (key) => before.get(key) !== after.get(key),
  )
}
function requireTables(tables: readonly string[], required: readonly string[]): void {
  if (required.some((table) => !tables.includes(table)))
    throw new Error('BOUNDARY_REQUIRED_TABLE_MISSING')
}
async function readDatabaseClock(pool: Pool): Promise<Date> {
  const result = await pool.query('select clock_timestamp() as observed_at')
  const rows = DatabaseClockRows.parse(result.rows)
  const row = rows[0]
  if (!row) throw new Error('BOUNDARY_DATABASE_CLOCK_MISSING')
  return row.observed_at
}
function timestampInWindow(value: BoundaryJson | undefined, lower: Date, upper: Date): boolean {
  const parsed = DatabaseTimestamp.safeParse(value)
  if (!parsed.success) return false
  const milliseconds = Date.parse(parsed.data)
  return milliseconds >= lower.getTime() && milliseconds <= upper.getTime()
}
type MemoryRow = z.infer<typeof MemoryRows>[number]
function freshMemoryRow(
  record: MemoryRow,
  personId: string,
  content: string,
  provenance: string,
  lower: Date,
  upper: Date,
): boolean {
  const createdAt = record.raw.created_at
  return (
    timestampInWindow(createdAt, lower, upper) &&
    typeof createdAt === 'string' &&
    record.valid_from.getTime() === Date.parse(createdAt) &&
    same(record.raw, {
      id: record.id,
      person_id: personId,
      namespace: 'semantic',
      content,
      provenance,
      sensitivity: 'personal',
      status: 'accepted',
      merged_from_id: null,
      version: 1,
      created_at: createdAt,
      updated_at: createdAt,
      retain_until: null,
      importance: 5,
      last_accessed_at: null,
      access_count: 0,
      valid_from: createdAt,
      valid_to: null,
      superseded_by: null,
      source_message_id: null,
      embedding: null,
      embedding_model: null,
      search_tsv: record.expected_search_tsv,
    })
  )
}
async function readState(pool: Pool, persons: readonly string[], tables: readonly string[]) {
  const memories = await pool.query(
    `select id,person_id,namespace,content,provenance,sensitivity,status,version,
    importance,valid_from,valid_to,superseded_by,source_message_id,(embedding is not null) as has_embedding,
    to_jsonb(m) as raw,to_tsvector('simple',personal.immutable_unaccent(content))::text as expected_search_tsv
    from personal.memory_records m where person_id=any($1::uuid[]) order by id`,
    [persons],
  )
  const memoryAudit = await pool.query(
    `select id::text as id,person_id,record_id,action,changes,changed_by
    from personal.memory_records_audit_log where person_id=any($1::uuid[]) order by id`,
    [persons],
  )
  const resolutions = await pool.query(
    `select id,person_id,action,target_domain,risk_level,resolved_at
    from personal.proposed_actions where person_id=any($1::uuid[]) order by id`,
    [persons],
  )
  return {
    proposals: await readBoundaryProposals(pool, persons),
    audit: await readBoundaryAudit(pool, persons),
    facts: await readBoundaryFacts(pool, persons),
    domain: await snapshotBoundaryDomain(pool, persons, tables),
    memories: MemoryRows.parse(memories.rows),
    memoryAudit: MemoryAuditRows.parse(memoryAudit.rows),
    resolutions: ResolutionRows.parse(resolutions.rows),
    observedAt: await readDatabaseClock(pool),
  }
}
type State = Awaited<ReturnType<typeof readState>>
interface Spec {
  capability: Capability
  action: string
  domain: string
  risk: 'low' | 'medium'
  payload: Record<string, unknown>
  content: string
  targetId?: string
}
async function prepareProposal(
  pool: Pool,
  scope: OwnedFixtureScope,
  group: Group,
  capability: Capability,
  conflict: boolean,
  tables: readonly string[],
) {
  requireTables(tables, [
    'personal.personal_facts',
    'personal.memory_records',
    'personal.memory_records_audit_log',
  ])
  const pair = await newBoundaryPair(scope)
  const seedStartedAt = await readDatabaseClock(pool)
  const content = `Thích đọc truyện vào buổi tối ${fixtureCanary(group, 'proposal')}`
  let spec: Spec
  if (capability === 'memory.invalidate_record') {
    const seeded = await ingestMemory(
      pool,
      pair.owner.personId,
      {
        namespace: 'semantic',
        content,
        provenance: 'user_declared:synthetic:stored_boundary',
        sensitivity: 'personal',
        confidence: 1,
        importance: 5,
      },
      SEED_ACTOR,
      NO_EMBED,
    )
    if (seeded.evaluation.outcome !== 'ACCEPT' || !seeded.record)
      throw new Error('BOUNDARY_MEMORY_FIXTURE_NOT_ACCEPTED')
    spec = {
      capability,
      action: 'invalidate_record',
      domain: 'personal',
      risk: 'low',
      content,
      targetId: seeded.record.id,
      payload: {
        targetRecordId: seeded.record.id,
        targetVersion: seeded.record.version + (conflict ? 1 : 0),
        reason: 'synthetic_boundary_confirmation',
      },
    }
  } else if (capability === 'memory.create_record') {
    spec = {
      capability,
      action: 'create_record',
      domain: 'personal',
      risk: 'low',
      content,
      payload: { namespace: 'semantic', content, sensitivity: 'personal', importance: 5 },
    }
  } else {
    const learning = capability === 'learning.update_goal'
    const namespace = learning ? 'learning' : 'companion'
    const key = learning ? 'goal' : 'stored_boundary_fact'
    await declareFact(pool, {
      personId: pair.owner.personId,
      namespace,
      key,
      value: 'Nội dung trước khi người dùng xác nhận.',
      origin: 'observed',
      confidence: 0.85,
      source: { type: 'synthetic_corpus' },
      sensitivity: 'personal',
    })
    spec = {
      capability,
      action: learning ? 'update_goal' : 'update_fact',
      domain: learning ? 'learning' : 'profile',
      risk: learning ? 'medium' : 'low',
      content,
      payload: learning
        ? { goal: content, source: 'companion_agent' }
        : {
            namespace,
            key,
            value: content,
            origin: 'observed',
            confidence: 0.85,
            sensitivity: 'personal',
          },
    }
  }
  const persons = [pair.owner.personId, pair.other.personId]
  const beforePropose = await readState(pool, persons, tables)
  const target = beforePropose.memories[0]
  const priorFact = beforePropose.facts[0]
  const seedValid =
    capability === 'memory.invalidate_record'
      ? beforePropose.memories.length === 1 &&
        target !== undefined &&
        target.id === spec.targetId &&
        target.person_id === pair.owner.personId &&
        target.content === content &&
        target.version === 1 &&
        target.valid_to === null &&
        freshMemoryRow(
          target,
          pair.owner.personId,
          content,
          'user_declared:synthetic:stored_boundary',
          seedStartedAt,
          beforePropose.observedAt,
        ) &&
        beforePropose.facts.length === 0 &&
        beforePropose.memoryAudit.length === 1 &&
        beforePropose.memoryAudit[0]?.record_id === target.id
      : capability === 'memory.create_record'
        ? beforePropose.memories.length === 0 &&
          beforePropose.facts.length === 0 &&
          beforePropose.memoryAudit.length === 0
        : beforePropose.memories.length === 0 &&
          beforePropose.memoryAudit.length === 0 &&
          beforePropose.facts.length === 1 &&
          priorFact?.person_id === pair.owner.personId &&
          priorFact.namespace ===
            (capability === 'learning.update_goal' ? 'learning' : 'companion') &&
          priorFact.key ===
            (capability === 'learning.update_goal' ? 'goal' : 'stored_boundary_fact') &&
          priorFact.value === 'Nội dung trước khi người dùng xác nhận.' &&
          priorFact.is_current &&
          priorFact.supersedes === null
  if (!seedValid || beforePropose.proposals.length || beforePropose.audit.length)
    throw new Error('BOUNDARY_FIXTURE_INVALID')
  const submitted = await proposeAction(pool, {
    personId: pair.owner.personId,
    capabilityId: spec.capability,
    action: spec.action,
    targetDomain: spec.domain,
    payload: spec.payload,
    riskLevel: spec.risk,
  })
  const action = ProposedActionSchema.parse(submitted.action)
  const before = await readState(pool, persons, tables)
  const row = before.proposals[0]
  const resolution = before.resolutions[0]
  if (
    submitted.autoExecuted ||
    action.status !== 'pending' ||
    action.personId !== pair.owner.personId ||
    before.proposals.length !== 1 ||
    !row ||
    row.id !== action.id ||
    row.person_id !== pair.owner.personId ||
    row.capability_id !== capability ||
    row.action !== spec.action ||
    row.target_domain !== spec.domain ||
    row.risk_level !== spec.risk ||
    !same(row.payload, spec.payload) ||
    row.status !== 'pending' ||
    row.version !== 1 ||
    row.resolved_by !== null ||
    row.execution_result !== null ||
    before.audit.length !== 0 ||
    before.resolutions.length !== 1 ||
    !resolution ||
    resolution.id !== row.id ||
    resolution.resolved_at !== null ||
    resolution.person_id !== pair.owner.personId ||
    resolution.action !== spec.action ||
    resolution.target_domain !== spec.domain ||
    resolution.risk_level !== spec.risk ||
    changedTables(beforePropose.domain, before.domain).length !== 0 ||
    !same(beforePropose.facts, before.facts) ||
    !same(beforePropose.memories, before.memories) ||
    !same(beforePropose.memoryAudit, before.memoryAudit)
  ) {
    throw new Error('BOUNDARY_PROPOSAL_FIXTURE_NOT_PENDING')
  }
  return { pair, spec, before, actionId: row.id, persons }
}
type Prepared = Awaited<ReturnType<typeof prepareProposal>>
function inspectExecution(value: unknown, spec: Spec) {
  const parsed = ExecutionResult.safeParse(value)
  return parsed.success && parsed.data.toolId === spec.capability ? parsed.data : null
}
function observeAction(
  prepared: Prepared,
  after: State,
  status: 'pending' | 'committed',
  version: number,
  executions: number,
  actor: string,
) {
  const { before, pair, spec, actionId } = prepared
  const row = after.proposals[0]
  const resolution = after.resolutions[0]
  const committed = status === 'committed'
  const execution = row ? inspectExecution(row.execution_result, spec) : null
  const proposalMatch =
    after.proposals.length === 1 &&
    row !== undefined &&
    row.id === actionId &&
    row.person_id === pair.owner.personId &&
    row.capability_id === spec.capability &&
    row.action === spec.action &&
    row.target_domain === spec.domain &&
    row.risk_level === spec.risk &&
    same(row.payload, spec.payload) &&
    row.status === status &&
    row.resolved_by === (committed ? actor : null) &&
    (committed ? execution !== null : row.execution_result === null) &&
    after.resolutions.length === 1 &&
    resolution !== undefined &&
    resolution.id === actionId &&
    resolution.person_id === pair.owner.personId &&
    resolution.action === spec.action &&
    resolution.target_domain === spec.domain &&
    resolution.risk_level === spec.risk &&
    (committed ? resolution.resolved_at !== null : resolution.resolved_at === null)
  const auditMatch =
    after.audit.length === executions &&
    after.audit.every(
      (audit) =>
        audit.person_id === pair.owner.personId &&
        audit.proposed_action_id === actionId &&
        audit.tool_id === spec.capability &&
        audit.status === 'success' &&
        same(audit.input_payload, spec.payload) &&
        same(audit.output_payload, row?.execution_result),
    )
  const changes = changedTables(before.domain, after.domain)
  let domainMatch =
    !committed &&
    changes.length === 0 &&
    same(after.facts, before.facts) &&
    same(after.memories, before.memories) &&
    same(after.memoryAudit, before.memoryAudit)
  if (committed && execution) {
    if (spec.capability === 'profile.update_fact' || spec.capability === 'learning.update_goal') {
      const previous = before.facts[0]
      const current = after.facts.find((fact) => fact.id === execution.detail.factId)
      const old = after.facts.find((fact) => fact.id === previous?.id)
      domainMatch =
        sameStrings(changes, ['personal.personal_facts']) &&
        before.facts.length === 1 &&
        after.facts.length === 2 &&
        previous !== undefined &&
        current !== undefined &&
        old !== undefined &&
        current.person_id === pair.owner.personId &&
        current.namespace === previous.namespace &&
        current.key === previous.key &&
        current.value === spec.content &&
        current.origin === 'observed' &&
        current.confidence === 0.85 &&
        current.is_current &&
        current.supersedes === previous.id &&
        current.sensitivity === 'personal' &&
        current.expires_at === null &&
        current.last_confirmed_at === null &&
        same(current.created_at, current.updated_at) &&
        same(current.source, {
          type: 'companion_conversation',
          occurredAt: execution.executedAt,
        }) &&
        same(old, { ...previous, is_current: false }) &&
        same(after.memories, before.memories) &&
        same(after.memoryAudit, before.memoryAudit)
      domainMatch =
        domainMatch &&
        same(
          execution.detail,
          spec.capability === 'learning.update_goal'
            ? { factId: current?.id, storedAs: 'personal_fact:learning.goal' }
            : { factId: current?.id, namespace: previous?.namespace, key: previous?.key },
        )
    } else {
      const recordId = execution.detail.recordId
      const record = after.memories.find((memory) => memory.id === recordId)
      const previous = before.memories[0]
      const deltaAudit = after.memoryAudit.filter(
        (audit) => !before.memoryAudit.some((old) => old.id === audit.id),
      )
      const expectedDetail =
        spec.capability === 'memory.create_record'
          ? { recordId, outcome: 'ACCEPT' }
          : { recordId, validTo: record?.valid_to?.toISOString() ?? null }
      const expectedChanges =
        spec.capability === 'memory.create_record'
          ? { namespace: 'semantic', content: spec.content }
          : { invalidated: true, reason: 'synthetic_boundary_confirmation' }
      const recordMatch =
        record !== undefined &&
        record.person_id === pair.owner.personId &&
        record.namespace === 'semantic' &&
        record.content === spec.content &&
        record.status === 'accepted' &&
        record.sensitivity === 'personal' &&
        record.importance === 5 &&
        record.source_message_id === null &&
        record.superseded_by === null &&
        !record.has_embedding &&
        (spec.capability === 'memory.create_record'
          ? record.version === 1 &&
            record.valid_to === null &&
            record.provenance === 'companion:conversation' &&
            freshMemoryRow(
              record,
              pair.owner.personId,
              spec.content,
              'companion:conversation',
              before.observedAt,
              after.observedAt,
            ) &&
            before.memories.length === 0
          : previous !== undefined &&
            recordId === spec.targetId &&
            record.version === previous.version + 1 &&
            record.valid_to !== null &&
            timestampInWindow(record.raw.valid_to, before.observedAt, after.observedAt) &&
            typeof record.raw.valid_to === 'string' &&
            record.valid_to.getTime() === Date.parse(record.raw.valid_to) &&
            same(record, {
              ...previous,
              version: previous.version + 1,
              valid_to: record.valid_to,
              raw: {
                ...previous.raw,
                version: previous.version + 1,
                valid_to: record.raw.valid_to,
                updated_at: record.raw.valid_to,
              },
            }))
      domainMatch =
        sameStrings(changes, ['personal.memory_records', 'personal.memory_records_audit_log']) &&
        after.memories.length === 1 &&
        recordMatch &&
        same(after.facts, before.facts) &&
        same(execution.detail, expectedDetail) &&
        after.memoryAudit.length === before.memoryAudit.length + 1 &&
        deltaAudit.length === 1 &&
        before.memoryAudit.every((old) => after.memoryAudit.some((audit) => same(old, audit))) &&
        deltaAudit.every(
          (audit) =>
            audit.person_id === pair.owner.personId &&
            audit.record_id === recordId &&
            audit.changed_by === actor &&
            audit.action === (spec.capability === 'memory.create_record' ? 'INSERT' : 'UPDATE') &&
            same(audit.changes, expectedChanges),
        )
    }
  }
  return [
    { name: 'proposal_state' as const, ok: proposalMatch },
    { name: 'version' as const, ok: row?.version === version },
    { name: 'execution_count' as const, ok: after.audit.length === executions },
    { name: 'domain_state' as const, ok: domainMatch },
    { name: 'audit_state' as const, ok: auditMatch },
  ]
}
async function invokeConfirm(
  pool: Pool,
  pair: Pair,
  actionId: string,
  who: 'owner' | 'other',
  version: number,
) {
  const person = pair[who]
  try {
    return {
      action: ProposedActionSchema.parse(
        await confirmAction(pool, person.personId, actionId, version, `user:${person.userId}`),
      ),
      error: null,
    }
  } catch (error) {
    if (error instanceof NotFoundError) return { action: null, error: 'NotFoundError' as const }
    if (error instanceof ConflictError) return { action: null, error: 'ConflictError' as const }
    throw new Error('BOUNDARY_CONFIRM_EXECUTION_FAILED')
  }
}
export async function executeConfirmBoundary(
  pool: Pool,
  scope: OwnedFixtureScope,
  group: Group,
  c: ConfirmCase,
  tables: readonly string[],
): Promise<BoundaryObservation> {
  const prepared = await prepareProposal(
    pool,
    scope,
    group,
    c.input.capability,
    c.input.operation === 'execution_conflict',
    tables,
  )
  const operation = c.input.operation
  const request = () =>
    invokeConfirm(
      pool,
      prepared.pair,
      prepared.actionId,
      operation === 'other_confirm' ? 'other' : 'owner',
      operation === 'stale_version' ? 2 : 1,
    )
  let results: Awaited<ReturnType<typeof invokeConfirm>>[]
  if (operation === 'concurrent') {
    const settled = await Promise.allSettled([request(), request()])
    if (settled.some((result) => result.status === 'rejected'))
      throw new Error('BOUNDARY_CONFIRM_EXECUTION_FAILED')
    results = settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
  } else {
    results = [await request()]
    if (operation === 'repeat') results.push(await request())
  }
  const after = await readState(pool, prepared.persons, tables)
  const successes = results.filter((result) => result.action !== null)
  const returnedMatches = successes.every(
    ({ action }) =>
      action !== null &&
      action.id === prepared.actionId &&
      action.personId === prepared.pair.owner.personId &&
      action.capabilityId === prepared.spec.capability &&
      action.action === prepared.spec.action &&
      action.targetDomain === prepared.spec.domain &&
      action.riskLevel === prepared.spec.risk &&
      action.status === 'committed' &&
      same(action.payload, prepared.spec.payload),
  )
  return {
    checks: [
      ...observeAction(
        prepared,
        after,
        c.expected.status,
        c.expected.version,
        c.expected.executions,
        `user:${prepared.pair.owner.userId}`,
      ),
      {
        name: 'error_kind',
        ok:
          successes.length === c.expected.successes &&
          returnedMatches &&
          sameStrings(
            results.flatMap((result) => (result.error ? [result.error] : [])),
            c.expected.errorKinds,
          ),
      },
    ],
  }
}
export async function executeHttpBoundary(
  pool: Pool,
  scope: OwnedFixtureScope,
  group: Group,
  c: HttpCase,
  tables: readonly string[],
  harness: BoundaryHttpHarness,
): Promise<BoundaryObservation> {
  const prepared = await prepareProposal(pool, scope, group, 'memory.create_record', false, tables)
  const response = await harness.observe(c.input, { ...prepared.pair, actionId: prepared.actionId })
  const after = await readState(pool, prepared.persons, tables)
  let bodyMatches = true
  if (response.status === 200) {
    const parsed = z.object({ action: ProposedActionSchema }).strict().safeParse(response.body)
    bodyMatches =
      parsed.success &&
      parsed.data.action.id === prepared.actionId &&
      parsed.data.action.personId === prepared.pair.owner.personId &&
      parsed.data.action.status === 'committed' &&
      parsed.data.action.capabilityId === prepared.spec.capability &&
      parsed.data.action.action === prepared.spec.action &&
      parsed.data.action.targetDomain === prepared.spec.domain &&
      parsed.data.action.riskLevel === prepared.spec.risk &&
      same(parsed.data.action.payload, prepared.spec.payload)
  }
  return {
    checks: [
      ...observeAction(
        prepared,
        after,
        c.expected.committed ? 'committed' : 'pending',
        c.expected.version,
        c.expected.executions,
        `user:${prepared.pair.owner.userId}`,
      ),
      { name: 'http_status', ok: response.status === c.expected.status && bodyMatches },
    ],
  }
}
export async function executeNoteToolBoundary(
  pool: Pool,
  scope: OwnedFixtureScope,
  group: Group,
  c: PromptCase,
  tables: readonly string[],
): Promise<BoundaryObservation> {
  if (c.input.surface !== 'note_tool') throw new Error('BOUNDARY_NOTE_TOOL_SURFACE_REQUIRED')
  requireTables(tables, ['worklife.documents'])
  const raw = z.string().parse(c.input.value)
  const canary = fixtureCanary(group, c.canaryRef)
  if (!raw.includes(canary)) throw new Error('BOUNDARY_NOTE_TOOL_CANARY_MISSING')
  const pair = await newBoundaryPair(scope)
  const title = `${group.query} owner ${canary}`
  const own = await createWorkDocument(pool, pair.owner.personId, {
    title,
    documentType: 'note',
    summary: raw,
  })
  const foreignTitle = `${group.query} other SYNTHETIC_FOREIGN_NOTE_CANARY`
  const foreign = await createWorkDocument(pool, pair.other.personId, {
    title: foreignTitle,
    documentType: 'note',
    summary: `${group.query} SYNTHETIC_FOREIGN_NOTE_CANARY`,
  })
  const persons = [pair.owner.personId, pair.other.personId]
  const before = await snapshotBoundaryDomain(pool, persons, tables)
  const rows = await pool.query(
    `select id,person_id,title,document_type,summary,version,updated_at
    from worklife.documents where person_id=any($1::uuid[]) order by id`,
    [persons],
  )
  const documents = DocumentRows.parse(rows.rows)
  const source = documents.find((row) => row.id === own.id)
  const other = documents.find((row) => row.id === foreign.id)
  const validSources =
    documents.length === 2 &&
    own.id !== foreign.id &&
    source !== undefined &&
    other !== undefined &&
    source.person_id === pair.owner.personId &&
    source.title === title &&
    source.summary === raw &&
    source.document_type === 'note' &&
    source.version === 1 &&
    other.person_id === pair.other.personId &&
    other.title === foreignTitle &&
    other.summary === `${group.query} SYNTHETIC_FOREIGN_NOTE_CANARY` &&
    other.document_type === 'note' &&
    other.version === 1
  const session = createCompanionToolSession({
    pool,
    personId: pair.owner.personId,
    userId: pair.owner.userId,
    ephemeral: true,
    memoryConsent: false,
    toolkit: { lookupDictionary: () => [] },
  })
  const outcome = await session.execute('search_notes', { query: group.query })
  const notes = ToolNotes.parse(JSON.parse(outcome.content))
  const after = await snapshotBoundaryDomain(pool, persons, tables)
  const proposals = await readBoundaryProposals(pool, persons)
  const audit = await readBoundaryAudit(pool, persons)
  const note = notes.notes[0]
  let stable = false
  try {
    stable = toToolData(BoundaryJsonSchema.parse(JSON.parse(outcome.content))) === outcome.content
  } catch {
    /* malformed output là idempotence false */
  }
  return {
    checks: [
      {
        name: 'literal',
        ok: !outcome.isError && notes.notes.length === 1 && note?.excerpt === c.expected.literal,
      },
      { name: 'idempotence', ok: stable === c.expected.idempotent },
      { name: 'source_seen', ok: note?.excerpt.includes(canary) === true },
      {
        name: 'source_identity',
        ok:
          validSources &&
          notes.notes.length === 1 &&
          note?.title === source?.title &&
          note?.updatedAt === source?.updated_at.toISOString().slice(0, 10) &&
          notes.openTasks.length === 0 &&
          notes.matchedQuery === group.query.trim() &&
          !outcome.content.includes('SYNTHETIC_FOREIGN_NOTE_CANARY') &&
          session.proposals.length === 0 &&
          proposals.length === 0 &&
          audit.length === 0 &&
          changedTables(before, after).length === 0,
      },
    ],
  }
}
