import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import type { Pool } from 'pg'
import { z } from 'zod'
import { withTransaction } from '@dhcb/core-db/transaction'
import {
  COMPANION_CONSENT_PURPOSE,
  COMPANION_CONSENT_SCOPES,
} from '@dhcb/core-contracts/consentGrant'
import type { ContextPackage } from '@dhcb/core-contracts/contextPackage'
import type { Sensitivity } from '@dhcb/core-contracts/personalFact'
import {
  ingestMemory,
  expireMemoryRecord,
  invalidateMemoryWithClient,
  supersedeMemoryWithClient,
} from '@dhcb/core-personal/memoryService'
import { declareFact } from '@dhcb/core-personal/personService'
import { createNode } from '@dhcb/core-personal/lifeGraphService'
import {
  setCoreBlock,
  upsertConversationSummary,
  getConversationSummary,
} from '@dhcb/core-personal/coreMemoryBlocks'
import { appendCompanionMessage } from '@dhcb/core-personal/companionMessageService'
import { grantConsent, revokeConsent } from '@dhcb/core-personal/consentService'
import { setPolicy } from '@dhcb/core-personal/policyService'
import { buildContextPackage } from '@dhcb/core-personal/contextEngine'
import type { FixturePerson, OwnedFixtureScope } from './companionBoundaryDb.js'
import type { BoundaryCase, BoundaryCorpus, SOURCE_KEYS } from './companionBoundaryCorpus.js'
import type { BoundaryObservation } from './companionBoundaryEval.js'

type ContextCase = Extract<BoundaryCase, { kind: 'context_scope' }>
type Group = BoundaryCorpus['fixtureGroups'][number]
type SourceKey = (typeof SOURCE_KEYS)[number]
type Source = { id: string; canary: string }
const UUID = z.string().uuid()
const ACTOR = 'test:stored_boundary_corpus'
const NO_EMBED = { embed: async () => null }
export function fixtureCanary(group: Group, key: string): string {
  return z.string().min(1).parse(group.canaries[key])
}
export function fixtureContent(group: Group, key: string): string {
  return `${group.query} ${fixtureCanary(group, key)} — dữ liệu tổng hợp riêng nguồn ${key}.`
}
export async function newBoundaryPair(scope: OwnedFixtureScope) {
  return { owner: await scope.newPerson(), other: await scope.newPerson() }
}
async function seedMemory(
  pool: Pool,
  owner: FixturePerson,
  group: Group,
  key: string,
  sensitivity: Sensitivity = 'personal',
) {
  const out = await ingestMemory(
    pool,
    owner.personId,
    {
      namespace: 'semantic',
      content: fixtureContent(group, key),
      provenance: `user_declared:synthetic:stored-boundary:${key}`,
      sensitivity,
      confidence: 1,
      importance: 5,
    },
    ACTOR,
    NO_EMBED,
  )
  if (out.evaluation.outcome !== 'ACCEPT' || !out.record)
    throw new Error('MEMORY_FIXTURE_NOT_ACCEPTED')
  return out.record
}
export async function configureBoundaryConsent(
  pool: Pool,
  person: FixturePerson,
  scope: string,
  state: ContextCase['input']['memoryConsent'],
) {
  if (state === 'none') return
  const grant = await grantConsent(pool, {
    personId: person.personId,
    scope,
    purpose: state === 'wrong_purpose' ? 'synthetic_wrong_purpose' : COMPANION_CONSENT_PURPOSE,
    ...(state === 'expired' ? { expiresAt: new Date(Date.now() - 60_000).toISOString() } : {}),
  })
  if (state === 'revoked') await revokeConsent(pool, person.personId, grant.id)
}

/** Gieo nguồn bằng service thật; chưa có query/ranking khi module chỉ được import. */
export async function executeContextBoundary(
  pool: Pool,
  scope: OwnedFixtureScope,
  group: Group,
  c: ContextCase,
): Promise<BoundaryObservation> {
  const pair = await newBoundaryPair(scope)
  const sources = new Map<SourceKey, Source>()
  const put = (key: SourceKey, id: string | null) =>
    sources.set(key, { id: UUID.parse(id), canary: fixtureCanary(group, key) })
  for (const key of [
    'memory',
    'public_memory',
    'sensitive_memory',
    'restricted_memory',
    'old_memory',
  ] as const) {
    const sensitivity =
      key === 'public_memory'
        ? 'public'
        : key === 'sensitive_memory'
          ? 'sensitive'
          : key === 'restricted_memory'
            ? 'restricted'
            : 'personal'
    const record = await seedMemory(pool, pair.owner, group, key, sensitivity)
    put(key, record.id)
    if (key === 'old_memory') {
      if (c.input.lifecycle === 'expired')
        await expireMemoryRecord(pool, pair.owner.personId, record.id, record.version, ACTOR)
      if (c.input.lifecycle === 'invalidated')
        await withTransaction(pool, (client) =>
          invalidateMemoryWithClient(client, pair.owner.personId, record.id, record.version, ACTOR),
        )
      if (c.input.lifecycle === 'superseded') {
        const fresh = await withTransaction(pool, (client) =>
          supersedeMemoryWithClient(
            client,
            pair.owner.personId,
            {
              recordId: record.id,
              expectedVersion: record.version,
              content: fixtureContent(group, 'live_replacement'),
              provenance: 'user_declared:synthetic:stored-boundary:live_replacement',
            },
            ACTOR,
            NO_EMBED,
          ),
        )
        put('live_replacement', fresh.record.id)
      }
    }
  }
  const fact = await declareFact(pool, {
    personId: pair.owner.personId,
    namespace: 'synthetic_boundary',
    key: 'learning_style',
    value: fixtureContent(group, 'fact'),
    origin: 'user_declared',
    confidence: 1,
    source: { type: 'synthetic_corpus' },
    sensitivity: 'personal',
  })
  put('fact', fact.id)
  const block = await setCoreBlock(
    pool,
    pair.owner.personId,
    'about_me',
    fixtureContent(group, 'core_block'),
    0,
  )
  put('core_block', block.id)
  const goal = await createNode(pool, {
    personId: pair.owner.personId,
    type: 'Goal',
    label: fixtureContent(group, 'life_graph'),
  })
  put('life_graph', goal.value.id)
  const first = await appendCompanionMessage(pool, {
    personId: pair.owner.personId,
    role: 'user',
    domain: 'learning',
    content: fixtureContent(group, 'history_vi'),
    sensitivity: 'personal',
  })
  put('history_vi', first.id)
  // Timestamp service thật; tách hai lượt >=2ms để oracle chronology không phụ thuộc UUID tie.
  await delay(2)
  const second = await appendCompanionMessage(pool, {
    personId: pair.owner.personId,
    role: 'companion',
    domain: 'learning',
    content: fixtureContent(group, 'history_en'),
    sensitivity: 'personal',
  })
  put('history_en', second.id)
  await upsertConversationSummary(
    pool,
    pair.owner.personId,
    'learning',
    fixtureContent(group, 'summary'),
    { at: new Date(second.createdAt), id: second.id },
  )
  const summary = await getConversationSummary(pool, pair.owner.personId, 'learning')
  put('summary', summary?.id ?? null)
  const work = await appendCompanionMessage(pool, {
    personId: pair.owner.personId,
    role: 'user',
    domain: 'work',
    content: fixtureContent(group, 'work_history'),
    sensitivity: 'personal',
  })
  put('work_history', work.id)
  await upsertConversationSummary(
    pool,
    pair.owner.personId,
    'work',
    fixtureContent(group, 'work_summary'),
    { at: new Date(work.createdAt), id: work.id },
  )
  const workSummary = await getConversationSummary(pool, pair.owner.personId, 'work')
  put('work_summary', workSummary?.id ?? null)
  const nullHistory = await appendCompanionMessage(pool, {
    personId: pair.owner.personId,
    role: 'user',
    content: fixtureContent(group, 'null_history'),
    sensitivity: 'personal',
  })
  put('null_history', nullHistory.id)
  for (const person of [pair.owner, pair.other]) {
    await configureBoundaryConsent(
      pool,
      person,
      COMPANION_CONSENT_SCOPES.memory,
      c.input.memoryConsent,
    )
    await configureBoundaryConsent(
      pool,
      person,
      COMPANION_CONSENT_SCOPES.history,
      c.input.historyConsent,
    )
  }
  const requester = pair[c.input.requester]
  if (c.input.denySource)
    await setPolicy(pool, {
      personId: requester.personId,
      subject: c.input.denySource,
      action: 'inject_context',
      resourceScope: c.input.domain,
      authority: 'DENY',
      purpose: COMPANION_CONSENT_PURPOSE,
    })
  const ownerDomainId = randomUUID()
  put('domain_state', ownerDomainId)
  const domainId = c.input.requester === 'owner' ? ownerDomainId : randomUUID()
  const context: ContextPackage = await buildContextPackage(pool, {
    personId: requester.personId,
    requestId: randomUUID(),
    requestText: group.query,
    domain: c.input.domain,
    purpose: c.input.purpose,
    tokenBudget: 2000,
    maxSensitivity: c.input.maxSensitivity,
    includePersonalContext: c.input.includePersonalContext,
    includeCompanionHistory: c.input.includeCompanionHistory,
    domainState: {
      sourceId: domainId,
      provenance: 'synthetic:own_domain_state',
      content:
        c.input.requester === 'owner'
          ? fixtureContent(group, 'domain_state')
          : 'Thông tin miền tổng hợp riêng người khác.',
    },
  })
  return observeContextBoundary(context, sources, group, c, requester)
}
function sourceTypeFor(key: SourceKey): ContextPackage['items'][number]['sourceType'] {
  if (key === 'core_block' || key === 'fact') return 'user_declared_fact'
  if (key === 'life_graph') return 'active_goal_or_project'
  if (
    [
      'history_vi',
      'history_en',
      'summary',
      'work_history',
      'work_summary',
      'null_history',
    ].includes(key)
  )
    return 'recent_episodic_context'
  if (key === 'domain_state' || key === 'note' || key === 'task')
    return 'authoritative_domain_state'
  return 'validated_derived_memory'
}
/** Oracle thuần: kiểm cả ID/loại nguồn khi canary bị mất hoặc đổi nội dung. */
export function observeContextBoundary(
  context: ContextPackage,
  sources: ReadonlyMap<SourceKey, Source>,
  group: Group,
  c: ContextCase,
  requester: FixturePerson,
): BoundaryObservation {
  const privateItems = context.items.filter(
    (item) =>
      item.sourceType !== 'current_request' && item.sourceType !== 'authoritative_domain_state',
  )
  const sourceSeen = (key: SourceKey) => {
    const source = sources.get(key)
    if (!source) return false
    return context.items.some(
      (item) =>
        item.sourceType === sourceTypeFor(key) &&
        item.sourceId === source.id &&
        item.content.includes(source.canary),
    )
  }
  const absent = (key: SourceKey) =>
    !context.items.some(
      (item) =>
        item.sourceId === sources.get(key)?.id || item.content.includes(fixtureCanary(group, key)),
    )
  const allowedIds =
    c.input.requester === 'owner'
      ? new Map([...sources].map(([key, source]) => [source.id, sourceTypeFor(key)]))
      : new Map<string, string>()
  const actualHistory = context.items
    .filter((item) => item.provenance.startsWith('companion_message:'))
    .map((item) => item.sourceId)
  return {
    checks: [
      {
        name: 'source_identity',
        ok:
          context.personId === requester.personId &&
          privateItems.every((item) => allowedIds.get(item.sourceId) === item.sourceType),
      },
      { name: 'source_seen', ok: c.expected.present.every(sourceSeen) },
      { name: 'source_absent', ok: c.expected.absent.every(absent) },
      ...(c.expected.historyOrder
        ? [
            {
              name: 'history_order' as const,
              ok:
                JSON.stringify(actualHistory) ===
                JSON.stringify(c.expected.historyOrder.map((key) => sources.get(key)?.id)),
            },
          ]
        : []),
    ],
  }
}
