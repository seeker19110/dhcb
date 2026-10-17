import type { Pool } from 'pg'
import { z } from 'zod'
import { createWorkDocument, createWorkTask } from '@dhcb/core-domains/workService'
import { createCompanionToolSession } from '@dhcb/core-personal/companionTools'
import { setPolicy } from '@dhcb/core-personal/policyService'
import { runFinalAnswerChecks } from '@dhcb/core-personal/finalAnswerChecks'
import { fixtureContent, newBoundaryPair } from './companionBoundaryFixtures.js'
import type { OwnedFixtureScope } from './companionBoundaryDb.js'
import {
  BoundaryJsonSchema,
  type BoundaryCase,
  type BoundaryCorpus,
} from './companionBoundaryCorpus.js'
import type { BoundaryObservation } from './companionBoundaryEval.js'

type ToolCase = Extract<BoundaryCase, { kind: 'tool_authority' }>
type Group = BoundaryCorpus['fixtureGroups'][number]
const JsonRows = z.array(z.object({ value: BoundaryJsonSchema }).strict())
const EXCLUDED_SNAPSHOT_TABLES = new Set([
  'personal.proposed_actions',
  'personal.tool_execution_audit_log',
])
/** Danh sách bảng từ preflight/catalog, không từ corpus/model. Chỉ đọc own person IDs. */
export async function snapshotBoundaryDomain(
  pool: Pool,
  personIds: readonly string[],
  tables: readonly string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  for (const table of tables) {
    if (EXCLUDED_SNAPSHOT_TABLES.has(table)) continue
    const split = z
      .tuple([
        z.enum(['public', 'personal', 'worklife', 'platform']),
        z.string().regex(/^[a-z][a-z0-9_]*$/),
      ])
      .parse(table.split('.'))
    const rows = await pool.query(
      `select to_jsonb(t) as value from "${split[0]}"."${split[1]}" t where person_id=any($1::uuid[]) order by to_jsonb(t)::text`,
      [personIds],
    )
    result.set(table, JSON.stringify(JsonRows.parse(rows.rows)))
  }
  return result
}
function changedTables(before: ReadonlyMap<string, string>, after: ReadonlyMap<string, string>) {
  return [...new Set([...before.keys(), ...after.keys()])].filter(
    (table) => before.get(table) !== after.get(table),
  )
}
const ProposalRowSchema = z
  .object({
    id: z.string().uuid(),
    person_id: z.string().uuid(),
    capability_id: z.string(),
    action: z.string(),
    target_domain: z.string(),
    risk_level: z.string(),
    payload: BoundaryJsonSchema,
    status: z.enum(['pending', 'confirmed', 'rejected', 'committed']),
    version: z.number().int().positive(),
    resolved_by: z.string().nullable(),
    execution_result: BoundaryJsonSchema,
  })
  .strict()
export async function readBoundaryProposals(pool: Pool, persons: readonly string[]) {
  const result = await pool.query(
    'select id,person_id,capability_id,action,target_domain,risk_level,payload,status,version,resolved_by,execution_result from personal.proposed_actions where person_id=any($1::uuid[]) order by created_at,id',
    [persons],
  )
  return z.array(ProposalRowSchema).parse(result.rows)
}
const AuditRowSchema = z
  .object({
    id: z.string().uuid(),
    person_id: z.string().uuid(),
    proposed_action_id: z.string().uuid().nullable(),
    tool_id: z.string(),
    status: z.enum(['success', 'failed', 'rejected_by_policy']),
    input_payload: BoundaryJsonSchema,
    output_payload: BoundaryJsonSchema.nullable(),
  })
  .strict()
export async function readBoundaryAudit(pool: Pool, persons: readonly string[]) {
  const result = await pool.query(
    'select id,person_id,proposed_action_id,tool_id,status,input_payload,output_payload from personal.tool_execution_audit_log where person_id=any($1::uuid[]) order by id',
    [persons],
  )
  return z.array(AuditRowSchema).parse(result.rows)
}
const FactRowSchema = z
  .object({
    id: z.string().uuid(),
    person_id: z.string().uuid(),
    namespace: z.string(),
    key: z.string(),
    value: BoundaryJsonSchema,
    origin: z.string(),
    is_current: z.boolean(),
    supersedes: z.string().uuid().nullable(),
    confidence: z.number().finite(),
    sensitivity: z.enum(['public', 'personal', 'sensitive', 'restricted']),
    source: BoundaryJsonSchema,
    expires_at: z.date().nullable(),
    last_confirmed_at: z.date().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
  })
  .strict()
export async function readBoundaryFacts(pool: Pool, persons: readonly string[]) {
  const result = await pool.query(
    'select id,person_id,namespace,key,value,origin,is_current,supersedes,confidence::double precision as confidence,sensitivity,source,expires_at,last_confirmed_at,created_at,updated_at from personal.personal_facts where person_id=any($1::uuid[]) order by id',
    [persons],
  )
  return z.array(FactRowSchema).parse(result.rows)
}
function sameStrings(a: readonly string[], b: readonly string[]) {
  return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort())
}
function executionFactId(value: unknown) {
  return z
    .object({ detail: z.object({ factId: z.string().uuid() }).passthrough() })
    .passthrough()
    .safeParse(value)
}
function replaceFixtureValues(value: unknown, otherPersonId: string): unknown {
  return JSON.parse(
    JSON.stringify(value, (_key, entry: unknown) =>
      entry === '$OTHER_PERSON_ID' ? otherPersonId : entry,
    ),
  )
}
function sameJson(left: unknown, right: unknown) {
  const canonical = (value: unknown) =>
    JSON.stringify(value, (_key, entry: unknown) =>
      entry !== null && typeof entry === 'object' && !Array.isArray(entry)
        ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b)))
        : entry,
    )
  return canonical(left) === canonical(right)
}
export function expectedBoundaryToolProposal(call: ToolCase['input']['calls'][number]) {
  if (call.name === 'propose_memory') {
    const p = z
      .object({ namespace: z.string(), content: z.string(), importance: z.number() })
      .strict()
      .parse(call.input)
    return {
      capability_id: 'memory.create_record',
      action: 'create_record',
      target_domain: 'personal',
      risk_level: 'low',
      payload: {
        namespace: p.namespace,
        content: p.content.trim(),
        importance: Math.round(p.importance),
        sensitivity: 'personal',
        origin: 'agent',
      },
    }
  }
  if (call.name === 'propose_profile_fact') {
    const p = z.object({ key: z.string(), value: z.string() }).strict().parse(call.input)
    return {
      capability_id: 'profile.update_fact',
      action: 'update_fact',
      target_domain: 'profile',
      risk_level: 'low',
      payload: { key: p.key, value: p.value.trim(), origin: 'observed', confidence: 0.85 },
    }
  }
  if (call.name === 'propose_learning_goal') {
    const p = z.object({ goal: z.string() }).strict().parse(call.input)
    return {
      capability_id: 'learning.update_goal',
      action: 'update_goal',
      target_domain: 'learning',
      risk_level: 'medium',
      payload: { goal: p.goal.trim(), source: 'companion_agent' },
    }
  }
  throw new Error('PROPOSAL_ORACLE_UNKNOWN_TOOL')
}
const SPECIFICATIONS = {
  propose_memory: {
    capability: 'memory.create_record',
    action: 'create_record',
    domain: 'personal',
  },
  propose_profile_fact: {
    capability: 'profile.update_fact',
    action: 'update_fact',
    domain: 'profile',
  },
  propose_learning_goal: {
    capability: 'learning.update_goal',
    action: 'update_goal',
    domain: 'learning',
  },
} as const

/** Executor thật, dữ liệu/state thật trong DB disposable do caller đã preflight. */
export async function executeToolBoundary(
  pool: Pool,
  scope: OwnedFixtureScope,
  group: Group,
  c: ToolCase,
  tables: readonly string[],
): Promise<BoundaryObservation> {
  const pair = await newBoundaryPair(scope)
  await createWorkDocument(pool, pair.owner.personId, {
    title: group.query,
    documentType: 'note',
    summary: fixtureContent(group, 'note'),
  })
  await createWorkTask(pool, pair.owner.personId, {
    title: fixtureContent(group, 'task'),
    priority: 'medium',
  })
  const requester = pair[c.input.requester]
  if (c.input.policy !== 'default') {
    const names = new Set(c.input.calls.map((call) => call.name))
    for (const [name, spec] of Object.entries(SPECIFICATIONS)) {
      if (!names.has(name)) continue
      await setPolicy(pool, {
        personId: requester.personId,
        subject: spec.capability,
        action: spec.action,
        resourceScope:
          c.input.policy === 'automate_wrong_scope' ? 'synthetic_wrong_scope' : spec.domain,
        authority: c.input.policy === 'deny' ? 'DENY' : 'AUTOMATE',
        purpose: 'synthetic_stored_boundary',
        ...(c.input.policy === 'deny'
          ? {}
          : {
              reviewAt: new Date(
                Date.now() + (c.input.policy === 'automate_expired' ? -60_000 : 86_400_000),
              ).toISOString(),
            }),
      })
    }
  }
  const persons = [pair.owner.personId, pair.other.personId]
  const before = await snapshotBoundaryDomain(pool, persons, tables)
  const session = createCompanionToolSession({
    pool,
    personId: requester.personId,
    userId: requester.userId,
    ephemeral: c.input.ephemeral,
    memoryConsent: c.input.memoryConsent,
    toolkit: { lookupDictionary: () => [] },
  })
  const outcomes = []
  for (const call of c.input.calls)
    outcomes.push(
      await session.execute(call.name, replaceFixtureValues(call.input, pair.other.personId)),
    )
  const proposals = await readBoundaryProposals(pool, persons)
  const audit = await readBoundaryAudit(pool, persons)
  const after = await snapshotBoundaryDomain(pool, persons, tables)
  const changes = changedTables(before, after)
  const names = session.definitions.map((tool) => tool.name)
  const offered =
    new Set(names).size === names.length &&
    sameStrings(names, c.expected.offered) &&
    c.expected.unoffered.every((name) => !names.includes(name))
  const outcomesMatch = outcomes.every((outcome, i) => {
    const expected = c.expected.outcomes[i]
    if (
      !expected ||
      Boolean(outcome.isError) !== expected.isError ||
      expected.includes.some((value) => !outcome.content.includes(value)) ||
      expected.excludes.some((value) => outcome.content.includes(value))
    )
      return false
    if (expected.responseStatus !== undefined) {
      try {
        return (
          z.object({ status: z.string() }).passthrough().parse(JSON.parse(outcome.content))
            .status === expected.responseStatus
        )
      } catch {
        return false
      }
    }
    return true
  })
  const expectedSpecs = c.input.calls.flatMap((call, i) => {
    const status = c.expected.outcomes[i]?.responseStatus
    return status && status !== 'already_pending' ? [expectedBoundaryToolProposal(call)] : []
  })
  const proposalDetails = proposals.map(
    ({ capability_id, action, target_domain, risk_level, payload }) => ({
      capability_id,
      action,
      target_domain,
      risk_level,
      payload,
    }),
  )
  const expectedMatches =
    proposalDetails.length === expectedSpecs.length &&
    expectedSpecs.every(
      (spec) =>
        proposalDetails.filter((row) => sameJson(row, spec)).length ===
        expectedSpecs.filter((other) => sameJson(other, spec)).length,
    )
  const pendingClean = proposals.every(
    (proposal) =>
      proposal.person_id === requester.personId &&
      proposal.version === 1 &&
      (proposal.status === 'pending'
        ? proposal.resolved_by === null && proposal.execution_result === null
        : proposal.status === 'rejected'
          ? proposal.resolved_by === 'policy:deny' && proposal.execution_result === null
          : proposal.resolved_by === 'system:automate'),
  )
  const proposalsMatch =
    expectedMatches &&
    pendingClean &&
    sameStrings(
      proposals.map((proposal) => proposal.status),
      c.expected.proposalStatuses,
    ) &&
    sameStrings(
      proposals.map((proposal) => proposal.id),
      session.proposals.map((proposal) => proposal.id),
    )
  const auditExpected = c.expected.audit
  const auditCount =
    auditExpected === 'none'
      ? 0
      : proposals.filter(
          (proposal) =>
            proposal.status === (auditExpected === 'success' ? 'committed' : 'rejected'),
        ).length
  const auditMatch =
    audit.length === auditCount &&
    audit.every(
      (row) =>
        row.status === auditExpected &&
        row.person_id === requester.personId &&
        proposals.some(
          (proposal) =>
            proposal.id === row.proposed_action_id &&
            proposal.capability_id === row.tool_id &&
            sameJson(proposal.payload, row.input_payload) &&
            sameJson(proposal.execution_result, row.output_payload),
        ),
    )
  let domainMatch = changes.length === 0
  if (c.expected.domain === 'learning_goal_matches') {
    const goals = c.input.calls.filter((call) => call.name === 'propose_learning_goal')
    const last = goals.at(-1)
    const goal = last ? z.object({ goal: z.string() }).passthrough().parse(last.input).goal : null
    const facts = await readBoundaryFacts(pool, persons)
    const committed = proposals.filter((proposal) => proposal.status === 'committed')
    const executed = committed.length === 1 ? executionFactId(committed[0]?.execution_result) : null
    domainMatch =
      sameStrings(changes, ['personal.personal_facts']) &&
      facts.length === 1 &&
      facts.every(
        (fact) =>
          fact.person_id === requester.personId &&
          fact.namespace === 'learning' &&
          fact.key === 'goal' &&
          fact.value === goal?.trim() &&
          fact.sensitivity === 'personal' &&
          fact.expires_at === null &&
          fact.last_confirmed_at === null &&
          fact.origin === 'observed' &&
          fact.confidence === 0.85 &&
          fact.is_current &&
          fact.supersedes === null &&
          executed?.success &&
          executed.data.detail.factId === fact.id &&
          (() => {
            const result = z
              .object({
                status: z.literal('ok'),
                toolId: z.literal('learning.update_goal'),
                executedAt: z.string().datetime(),
                detail: z
                  .object({
                    factId: z.string().uuid(),
                    storedAs: z.literal('personal_fact:learning.goal'),
                  })
                  .strict(),
              })
              .strict()
              .safeParse(committed[0]?.execution_result)
            return (
              result.success &&
              sameJson(fact.source, {
                type: 'companion_conversation',
                occurredAt: result.data.executedAt,
              })
            )
          })(),
      )
  }
  const final =
    c.input.reply === undefined
      ? null
      : runFinalAnswerChecks({
          reply: c.input.reply,
          userMessage: group.query,
          proposedActions: session.proposals,
        })
  return {
    checks: [
      { name: 'offered_tools', ok: offered },
      { name: 'tool_outcome', ok: outcomes.length === c.expected.outcomes.length && outcomesMatch },
      { name: 'proposal_state', ok: proposalsMatch },
      { name: 'domain_state', ok: domainMatch },
      { name: 'audit_state', ok: auditMatch },
      ...(c.expected.finalCheck
        ? [
            {
              name: 'final_answer' as const,
              ok:
                final !== null &&
                final.text === c.expected.finalCheck.literal &&
                final.issues.includes('false_save_claim') === c.expected.finalCheck.falseSaveIssue,
            },
          ]
        : []),
    ],
  }
}
