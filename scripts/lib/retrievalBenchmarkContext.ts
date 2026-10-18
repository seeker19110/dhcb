// S05: cohort mới, caller giữ Pool writable/scrub/network/journal/cleanup; không dùng rank snapshot.
import { randomUUID } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import type { Pool } from 'pg'
import { z } from 'zod'
import { withTransaction } from '@dhcb/core-db/transaction'
import { ContextPackageSchema, type ContextPackage } from '@dhcb/core-contracts/contextPackage'
import { MemoryRecordSchema, type MemoryRecord } from '@dhcb/core-contracts/personalMemory'
import { ConsentGrantSchema } from '@dhcb/core-contracts/consentGrant'
import {
  COMPANION_CONSENT_PURPOSE,
  COMPANION_CONSENT_SCOPES,
} from '@dhcb/core-contracts/consentGrant'
import { buildContextPackage } from '@dhcb/core-personal/contextEngine'
import { grantConsent, revokeConsent, listConsents } from '@dhcb/core-personal/consentService'
import {
  ingestMemory,
  expireMemoryRecord,
  invalidateMemoryWithClient,
  supersedeMemoryWithClient,
} from '@dhcb/core-personal/memoryService'
import type { OwnedFixtureScope } from './companionBoundaryDb.js'

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
const JsonObject = z.custom<Record<string, Json>>((value) => {
  try {
    return (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      z.json().safeParse(value).success &&
      JSON.stringify(value) !== undefined
    )
  } catch {
    return false
  }
})
const UUID = z.uuid()
const Time = z.string().datetime({ offset: true })
const MemoryShape = z
  .object({
    id: UUID,
    person_id: UUID,
    namespace: z.literal('semantic'),
    content: z.string(),
    provenance: z.string(),
    sensitivity: z.enum(['public', 'personal', 'sensitive', 'restricted']),
    status: z.enum(['accepted', 'merged', 'expired']),
    merged_from_id: UUID.nullable(),
    version: z.number().int().positive(),
    created_at: Time,
    updated_at: Time,
    retain_until: Time.nullable(),
    importance: z.number().int().min(1).max(10),
    last_accessed_at: Time.nullable(),
    access_count: z.number().int().nonnegative(),
    valid_from: Time,
    valid_to: Time.nullable(),
    superseded_by: UUID.nullable(),
    source_message_id: UUID.nullable(),
    embedding: z.array(z.number().finite()).nullable(),
    embedding_model: z.string().nullable(),
    search_tsv: z.string(),
  })
  .strict()
type MemoryRow = z.infer<typeof MemoryShape>
const MemoryRaw = z.custom<MemoryRow>((value) => {
  try {
    return (
      MemoryShape.safeParse(value).success &&
      isDeepStrictEqual(
        Object.keys(JsonObject.parse(value)).sort(),
        Object.keys(MemoryShape.shape).sort(),
      )
    )
  } catch {
    return false
  }
})
const AuditShape = z
  .object({
    id: z.number().int().positive().safe(),
    record_id: UUID,
    person_id: UUID,
    action: z.enum(['INSERT', 'UPDATE', 'MERGE', 'EXPIRE', 'DELETE']),
    changes: JsonObject,
    changed_by: z.string(),
    audited_at: Time,
  })
  .strict()
const GrantShape = z
  .object({
    id: UUID,
    person_id: UUID,
    scope: z.string(),
    purpose: z.string(),
    version: z.number().int().positive(),
    status: z.enum(['active', 'revoked', 'expired']),
    granted_at: Time,
    expires_at: Time.nullable(),
    revoked_at: Time.nullable(),
  })
  .strict()
const JsonRows = z.array(z.object({ value: JsonObject }).strict())
const Person = z.object({ userId: UUID, personId: UUID }).strict()
type Person = z.infer<typeof Person>
const QUERY = 'Mình muốn ôn lại các thói quen học và sinh hoạt.'
const ACTOR = 'test:synthetic_s05_context'
const REASON = 'synthetic_s05_context_invalidation'
const NO_EMBED = { embed: async () => null }
const FIXTURES = {
  live_personal: {
    sensitivity: 'personal',
    canary: 'SYNTHETICSFIVELIVEPERSONALCANARY',
    body: 'Buổi tối thích đọc truyện ở phòng khách.',
  },
  live_public: {
    sensitivity: 'public',
    canary: 'SYNTHETICSFIVEPUBLICCANARY',
    body: 'Sáng chủ nhật hay đi bộ quanh công viên.',
  },
  live_sensitive: {
    sensitivity: 'sensitive',
    canary: 'SYNTHETICSFIVESENSITIVECANARY',
    body: 'Thích ghi nhật ký riêng sau giờ làm việc.',
  },
  expired: {
    sensitivity: 'public',
    canary: 'SYNTHETICSFIVEEXPIREDCANARY',
    body: 'Từng tham gia câu lạc bộ gốm vào mùa hè.',
  },
  invalidated: {
    sensitivity: 'public',
    canary: 'SYNTHETICSFIVEINVALIDATEDCANARY',
    body: 'Trước đây chọn học đàn vào chiều thứ bảy.',
  },
  superseded: {
    sensitivity: 'public',
    canary: 'SYNTHETICSFIVEOLDGOALCANARY',
    body: 'Mục tiêu cũ là chăm vườn vào giữa tuần.',
  },
  replacement: {
    sensitivity: 'public',
    canary: 'SYNTHETICSFIVEREPLACEMENTCANARY',
    body: 'Mục tiêu mới là vẽ màu vào chiều cuối tuần.',
  },
} as const
type Key = keyof typeof FIXTURES
const KEYS = Object.keys(FIXTURES) as Key[]
const LIVE: readonly Key[] = ['live_personal', 'live_public', 'live_sensitive', 'replacement']
const PUBLIC: readonly Key[] = ['live_public', 'replacement']
const content = (key: Key) => `${FIXTURES[key].body} ${FIXTURES[key].canary}`
const provenance = (id: string, key: Key) => `user_declared:synthetic:s05_context:${id}:${key}`
type Mode =
  'active' | 'foreign' | 'none' | 'wrong_purpose' | 'revoked' | 'expired' | 'public' | 'ephemeral'
const COHORTS: readonly { id: string; mode: Mode }[] = [
  { id: 'CTX01-active', mode: 'active' },
  { id: 'CTX02-foreign', mode: 'foreign' },
  { id: 'CTX03-none', mode: 'none' },
  { id: 'CTX04-wrong_purpose', mode: 'wrong_purpose' },
  { id: 'CTX05-revoked', mode: 'revoked' },
  { id: 'CTX06-expired', mode: 'expired' },
  { id: 'CTX07-public', mode: 'public' },
  { id: 'CTX08-ephemeral', mode: 'ephemeral' },
]
const same = isDeepStrictEqual
const iso = (value: string) => new Date(value).toISOString()
function inWindow(value: string, lower: Date, upper: Date) {
  const ms = Date.parse(value)
  return Number.isFinite(ms) && ms >= lower.getTime() && ms <= upper.getTime()
}
function fail(code: string): never {
  throw new Error(`RETRIEVAL_CONTEXT_${code}`)
}
async function catalog(pool: Pool) {
  const rows = await pool.query(
    `select c.table_schema,c.table_name from information_schema.columns c join information_schema.tables t on t.table_schema=c.table_schema and t.table_name=c.table_name where c.column_name='person_id' and c.table_schema in ('public','personal','worklife','platform') and t.table_type='BASE TABLE' order by 1,2`,
  )
  const parsed = z
    .array(
      z
        .object({
          table_schema: z.enum(['public', 'personal', 'worklife', 'platform']),
          table_name: z.string().regex(/^[a-z_][a-z0-9_]*$/),
        })
        .strict(),
    )
    .parse(rows.rows)
  const tables = parsed.map((row) => `${row.table_schema}.${row.table_name}`)
  if (
    new Set(tables).size !== tables.length ||
    [
      'personal.memory_records',
      'personal.memory_records_audit_log',
      'personal.consent_grants',
    ].some((name) => !tables.includes(name))
  )
    fail('CATALOG_INVALID')
  return tables
}
async function state(pool: Pool, ids: readonly string[], tables: readonly string[]) {
  const all = new Map<string, Record<string, Json>[]>()
  for (const table of tables) {
    const [schema, name] = table.split('.')
    const rows = await pool.query(
      `select to_jsonb(t) as value from "${schema}"."${name}" t where person_id=any($1::uuid[]) order by to_jsonb(t)::text`,
      [ids],
    )
    all.set(
      table,
      JsonRows.parse(rows.rows).map((row) => row.value),
    )
  }
  const persons = await pool.query(
    'select to_jsonb(t) as value from personal.persons t where id=any($1::uuid[]) order by to_jsonb(t)::text',
    [ids],
  )
  all.set(
    'personal.persons',
    JsonRows.parse(persons.rows).map((row) => row.value),
  )
  const clock = await pool.query('select clock_timestamp() as observed_at')
  const clockRows = z
    .array(z.object({ observed_at: z.date() }).strict())
    .length(1)
    .parse(clock.rows)
  const at = clockRows[0]?.observed_at
  if (!at) fail('CLOCK_MISSING')
  const memory = z.array(MemoryRaw).parse(all.get('personal.memory_records'))
  const audit = z.array(AuditShape).parse(all.get('personal.memory_records_audit_log'))
  const grants = z.array(GrantShape).parse(all.get('personal.consent_grants'))
  return { all, memory, audit, grants, at }
}
type State = Awaited<ReturnType<typeof state>>
type Sources = Map<Key, MemoryRecord>
async function seed(pool: Pool, owner: Person, id: string): Promise<Sources> {
  const result: Sources = new Map()
  for (const key of KEYS) {
    if (key === 'replacement') continue
    const out = await ingestMemory(
      pool,
      owner.personId,
      {
        namespace: 'semantic',
        content: content(key),
        provenance: provenance(id, key),
        sensitivity: FIXTURES[key].sensitivity,
        confidence: 1,
        importance: 5,
      },
      ACTOR,
      NO_EMBED,
    )
    if (out.evaluation.outcome !== 'ACCEPT' || !out.record) fail('FIXTURE_NOT_ACCEPTED')
    result.set(key, MemoryRecordSchema.parse(out.record))
  }
  const expired = result.get('expired'),
    invalid = result.get('invalidated'),
    old = result.get('superseded')
  if (!expired || !invalid || !old) fail('FIXTURE_SOURCE_MISSING')
  result.set(
    'expired',
    MemoryRecordSchema.parse(
      await expireMemoryRecord(pool, owner.personId, expired.id, expired.version, ACTOR),
    ),
  )
  result.set(
    'invalidated',
    MemoryRecordSchema.parse(
      await withTransaction(pool, (client) =>
        invalidateMemoryWithClient(
          client,
          owner.personId,
          invalid.id,
          invalid.version,
          ACTOR,
          REASON,
        ),
      ),
    ),
  )
  const replaced = await withTransaction(pool, (client) =>
    supersedeMemoryWithClient(
      client,
      owner.personId,
      {
        recordId: old.id,
        expectedVersion: old.version,
        content: content('replacement'),
        provenance: provenance(id, 'replacement'),
        importance: 5,
      },
      ACTOR,
      NO_EMBED,
    ),
  )
  result.set('superseded', MemoryRecordSchema.parse(replaced.previous))
  result.set('replacement', MemoryRecordSchema.parse(replaced.record))
  return result
}
async function consent(pool: Pool, owner: Person, other: Person, mode: Mode, clock: Date) {
  if (mode === 'none') return
  for (const person of mode === 'foreign' ? [owner, other] : [owner]) {
    const grant = ConsentGrantSchema.parse(
      await grantConsent(pool, {
        personId: person.personId,
        scope: COMPANION_CONSENT_SCOPES.memory,
        purpose: mode === 'wrong_purpose' ? 'synthetic_wrong_purpose' : COMPANION_CONSENT_PURPOSE,
        ...(mode === 'expired'
          ? { expiresAt: new Date(clock.getTime() - 60_000).toISOString() }
          : {}),
      }),
    )
    if (mode === 'revoked') await revokeConsent(pool, person.personId, grant.id)
  }
}
async function validateGrants(
  pool: Pool,
  owner: Person,
  other: Person,
  mode: Mode,
  before: State,
  lower: Date,
) {
  const dtos = [
    ...(await listConsents(pool, owner.personId, { includeHistory: true })),
    ...(await listConsents(pool, other.personId, { includeHistory: true })),
  ].map((grant) => ConsentGrantSchema.parse(grant))
  const expectedPersons =
    mode === 'none' ? [] : mode === 'foreign' ? [owner.personId, other.personId] : [owner.personId]
  if (
    dtos.length !== expectedPersons.length ||
    before.grants.length !== expectedPersons.length ||
    new Set(dtos.map((grant) => grant.id)).size !== dtos.length
  )
    fail('GRANT_COUNT_INVALID')
  for (const personId of expectedPersons) {
    const dto = dtos.find((grant) => grant.personId === personId)
    const row = before.grants.find((grant) => grant.person_id === personId)
    if (
      !dto ||
      !row ||
      dto.id !== row.id ||
      row.scope !== COMPANION_CONSENT_SCOPES.memory ||
      row.purpose !==
        (mode === 'wrong_purpose' ? 'synthetic_wrong_purpose' : COMPANION_CONSENT_PURPOSE) ||
      row.version !== 1 ||
      row.status !== (mode === 'revoked' ? 'revoked' : 'active') ||
      dto.scope !== row.scope ||
      dto.purpose !== row.purpose ||
      dto.version !== row.version ||
      dto.status !== row.status ||
      dto.grantedAt !== iso(row.granted_at) ||
      !inWindow(row.granted_at, lower, before.at) ||
      (row.revoked_at !== null && !inWindow(row.revoked_at, lower, before.at)) ||
      dto.expiresAt !== (row.expires_at ? iso(row.expires_at) : undefined) ||
      dto.revokedAt !== (row.revoked_at ? iso(row.revoked_at) : undefined) ||
      (mode === 'expired'
        ? row.expires_at === null || Date.parse(row.expires_at) >= Date.parse(row.granted_at)
        : row.expires_at !== null) ||
      (mode === 'revoked'
        ? row.revoked_at === null || Date.parse(row.revoked_at) < Date.parse(row.granted_at)
        : row.revoked_at !== null)
    )
      fail('GRANT_INVALID')
  }
}
function validateFixture(owner: Person, id: string, sources: Sources, before: State, lower: Date) {
  if (
    sources.size !== KEYS.length ||
    before.memory.length !== KEYS.length ||
    new Set([...sources.values()].map((row) => row.id)).size !== KEYS.length ||
    new Set(before.memory.map((row) => row.id)).size !== KEYS.length ||
    before.audit.length !== 10 ||
    new Set(before.audit.map((row) => row.id)).size !== 10
  )
    fail('FIXTURE_COUNT_INVALID')
  const replacement = sources.get('replacement')
  if (!replacement) fail('FIXTURE_REPLACEMENT_MISSING')
  for (const key of KEYS) {
    const dto = sources.get(key)
    const row = before.memory.find((memory) => memory.id === dto?.id)
    if (!dto || !row) fail('FIXTURE_ID_MISSING')
    const closed = key === 'invalidated' || key === 'superseded'
    const transitioned = closed || key === 'expired'
    const version = transitioned ? 2 : 1
    const status = key === 'expired' ? 'expired' : 'accepted'
    const supersededBy = key === 'superseded' ? replacement.id : null
    const validTo = closed ? row.valid_to : null
    const expireAudit = before.audit.find(
      (audit) => audit.record_id === row.id && audit.action === 'EXPIRE',
    )
    const updated = closed
      ? row.valid_to
      : key === 'expired'
        ? expireAudit?.audited_at
        : row.created_at
    const expected = {
      id: dto.id,
      person_id: owner.personId,
      namespace: 'semantic',
      content: content(key),
      provenance: provenance(id, key),
      sensitivity: FIXTURES[key].sensitivity,
      status,
      merged_from_id: null,
      version,
      created_at: row.created_at,
      updated_at: updated,
      retain_until: null,
      importance: 5,
      last_accessed_at: null,
      access_count: 0,
      valid_from: row.created_at,
      valid_to: validTo,
      superseded_by: supersededBy,
      source_message_id: null,
      embedding: null,
      embedding_model: null,
      search_tsv: row.search_tsv,
    }
    if (
      !same(row, expected) ||
      (closed && row.valid_to === null) ||
      !inWindow(row.created_at, lower, before.at) ||
      !inWindow(row.updated_at, lower, before.at) ||
      Date.parse(row.updated_at) < Date.parse(row.created_at) ||
      !row.search_tsv.trim() ||
      dto.personId !== owner.personId ||
      dto.namespace !== 'semantic' ||
      dto.content !== content(key) ||
      dto.provenance !== provenance(id, key) ||
      dto.sensitivity !== FIXTURES[key].sensitivity ||
      dto.status !== status ||
      dto.version !== version ||
      dto.importance !== 5 ||
      dto.createdAt !== iso(row.created_at) ||
      dto.validFrom !== iso(row.valid_from) ||
      dto.validTo !== (row.valid_to ? iso(row.valid_to) : undefined) ||
      dto.supersededBy !== (supersededBy ?? undefined) ||
      dto.hasEmbedding ||
      dto.lastAccessedAt !== undefined ||
      dto.mergedFromId !== undefined ||
      dto.retainUntil !== undefined ||
      dto.sourceMessageId !== undefined
    )
      fail('FIXTURE_ROW_INVALID')
    const audits = before.audit.filter((audit) => audit.record_id === row.id)
    const expectedEvents: Array<{ action: string; changes: Record<string, Json> }> =
      key === 'replacement'
        ? [
            {
              action: 'INSERT',
              changes: {
                namespace: 'semantic',
                content: content(key),
                supersedes: sources.get('superseded')?.id ?? '',
              },
            },
          ]
        : [{ action: 'INSERT', changes: { namespace: 'semantic', content: content(key) } }]
    if (key === 'expired')
      expectedEvents.push({ action: 'EXPIRE', changes: { previousStatus: 'accepted' } })
    if (key === 'invalidated')
      expectedEvents.push({ action: 'UPDATE', changes: { invalidated: true, reason: REASON } })
    if (key === 'superseded')
      expectedEvents.push({
        action: 'UPDATE',
        changes: { supersededBy: replacement.id, validTo: row.valid_to ? iso(row.valid_to) : null },
      })
    if (
      audits.length !== expectedEvents.length ||
      audits.some(
        (audit) =>
          audit.person_id !== owner.personId ||
          audit.changed_by !== ACTOR ||
          !inWindow(audit.audited_at, lower, before.at),
      ) ||
      expectedEvents.some(
        (event) =>
          audits.filter(
            (audit) => audit.action === event.action && same(audit.changes, event.changes),
          ).length !== 1,
      )
    )
      fail('FIXTURE_AUDIT_INVALID')
  }
  const old = before.memory.find((row) => row.id === sources.get('superseded')?.id)
  const fresh = before.memory.find((row) => row.id === replacement.id)
  if (!old || !fresh || old.valid_to !== fresh.valid_from) fail('FIXTURE_CHAIN_INVALID')
}
function observeContext(
  context: ContextPackage,
  requester: Person,
  requestId: string,
  sources: Sources,
  mode: Mode,
  tokenBudget: number,
) {
  const present = mode === 'active' ? LIVE : mode === 'public' ? PUBLIC : []
  const presentIds = new Set(present.map((key) => sources.get(key)?.id))
  const allIds = new Set([...sources.values()].map((row) => row.id))
  const sourceItems = context.items.filter((item) => item.sourceType !== 'current_request')
  const identity =
    context.personId === requester.personId &&
    context.requestId === requestId &&
    context.tokenBudget === tokenBudget &&
    context.items.every(
      (item) =>
        item.sourceType !== 'current_request' ||
        (item.content === QUERY &&
          item.provenance === 'user_input:current_turn' &&
          !allIds.has(item.sourceId)),
    )
  const exactSources =
    sourceItems.length === present.length &&
    new Set(sourceItems.map((item) => item.sourceId)).size === sourceItems.length &&
    sourceItems.every((item) => presentIds.has(item.sourceId))
  const seen = present.every((key) => {
    const row = sources.get(key)
    const matches = context.items.filter((item) => item.sourceId === row?.id)
    const item = matches[0]
    return (
      row !== undefined &&
      matches.length === 1 &&
      item !== undefined &&
      item.sourceType === 'validated_derived_memory' &&
      item.content === `[semantic] ${content(key)}` &&
      item.content.includes(FIXTURES[key].canary) &&
      item.provenance === `personal_memory:${row.provenance}` &&
      item.sensitivity === FIXTURES[key].sensitivity
    )
  })
  const absent = KEYS.filter((key) => !present.includes(key)).every((key) => {
    const row = sources.get(key)
    return context.items.every(
      (item) => item.sourceId !== row?.id && !item.content.includes(FIXTURES[key].canary),
    )
  })
  return {
    present,
    checks: [
      { name: 'context_identity', ok: identity },
      { name: 'source_identity', ok: exactSources },
      { name: 'source_present', ok: seen },
      { name: 'source_absent', ok: absent },
    ],
  }
}
function observeMutation(before: State, after: State, expectedIds: ReadonlySet<string>) {
  const previous = new Map(before.memory.map((row) => [row.id, row]))
  const sameMap =
    after.memory.length === before.memory.length &&
    new Set(after.memory.map((row) => row.id)).size === after.memory.length &&
    after.memory.every((row) => previous.has(row.id))
  const rowsMatch =
    sameMap &&
    after.memory.every((row) => {
      const old = previous.get(row.id)
      return (
        old !== undefined &&
        (expectedIds.has(row.id)
          ? same(row, {
              ...old,
              access_count: old.access_count + 1,
              last_accessed_at: row.last_accessed_at,
            })
          : same(row, old))
      )
    })
  const touches =
    sameMap &&
    after.memory.every((row) => {
      const old = previous.get(row.id)
      return (
        old !== undefined &&
        (expectedIds.has(row.id)
          ? row.access_count === old.access_count + 1 &&
            row.last_accessed_at !== null &&
            inWindow(row.last_accessed_at, before.at, after.at)
          : row.access_count === old.access_count && row.last_accessed_at === old.last_accessed_at)
      )
    })
  const beforeBusiness = new Map(
    [...before.all].filter(([table]) => table !== 'personal.memory_records'),
  )
  const afterBusiness = new Map(
    [...after.all].filter(([table]) => table !== 'personal.memory_records'),
  )
  return [
    { name: 'memory_rows', ok: rowsMatch },
    { name: 'touch_metadata', ok: touches },
    { name: 'business_state', ok: same(beforeBusiness, afterBusiness) },
  ]
}
export async function runRetrievalContextProbes(
  pool: Pool,
  scope: Pick<OwnedFixtureScope, 'newPerson'>,
  options: { tokenBudget: number },
) {
  const { tokenBudget } = z
    .object({ tokenBudget: z.number().int().positive() })
    .strict()
    .parse(options)
  if (tokenBudget < QUERY.length + KEYS.reduce((n, key) => n + content(key).length + 32, 0))
    fail('TOKEN_BUDGET_INSUFFICIENT')
  const tables = await catalog(pool)
  const allocated = new Set<string>()
  const results: Array<{ id: string; passed: boolean; crashed: boolean; failedChecks: string[] }> =
    []
  for (const cohort of COHORTS) {
    try {
      const owner = Person.parse(await scope.newPerson()),
        other = Person.parse(await scope.newPerson())
      const identities = [owner.userId, owner.personId, other.userId, other.personId]
      if (new Set(identities).size !== 4 || identities.some((id) => allocated.has(id)))
        fail('IDENTITY_REUSED')
      identities.forEach((id) => allocated.add(id))
      const ids = [owner.personId, other.personId]
      const initial = await state(pool, ids, tables)
      const personRows = z
        .array(z.object({ id: UUID, user_id: UUID }).passthrough())
        .parse(initial.all.get('personal.persons'))
      if (
        personRows.length !== 2 ||
        new Set(personRows.map((row) => row.id)).size !== 2 ||
        personRows.some(
          (row) =>
            ![owner, other].some(
              (person) => person.personId === row.id && person.userId === row.user_id,
            ),
        ) ||
        initial.memory.length ||
        initial.audit.length ||
        initial.grants.length
      )
        fail('COHORT_NOT_FRESH')
      const sources = await seed(pool, owner, cohort.id)
      await consent(pool, owner, other, cohort.mode, initial.at)
      const before = await state(pool, ids, tables)
      validateFixture(owner, cohort.id, sources, before, initial.at)
      await validateGrants(pool, owner, other, cohort.mode, before, initial.at)
      const requester = cohort.mode === 'foreign' ? other : owner
      const requestId = randomUUID()
      if (
        [...sources.values()].some((row) => row.id === requestId || QUERY.includes(row.id)) ||
        KEYS.some((key) => QUERY.includes(FIXTURES[key].canary))
      )
        fail('QUERY_CONTAMINATED')
      const context = ContextPackageSchema.parse(
        await buildContextPackage(pool, {
          personId: requester.personId,
          requestId,
          requestText: QUERY,
          domain: 'learning',
          purpose: COMPANION_CONSENT_PURPOSE,
          tokenBudget,
          maxSensitivity: cohort.mode === 'public' ? 'public' : 'restricted',
          includePersonalContext: cohort.mode !== 'ephemeral',
          includeCompanionHistory: false,
        }),
      )
      const after = await state(pool, ids, tables)
      const observed = observeContext(
        context,
        requester,
        requestId,
        sources,
        cohort.mode,
        tokenBudget,
      )
      const expectedIds = new Set(
        observed.present.flatMap((key) => {
          const row = sources.get(key)
          return row ? [row.id] : []
        }),
      )
      const checks = [...observed.checks, ...observeMutation(before, after, expectedIds)]
      results.push({
        id: cohort.id,
        passed: checks.every((check) => check.ok),
        crashed: false,
        failedChecks: checks.filter((check) => !check.ok).map((check) => check.name),
      })
    } catch {
      results.push({
        id: cohort.id,
        passed: false,
        crashed: true,
        failedChecks: ['context_probe_crashed'],
      })
    }
  }
  if (
    ['CTX01-active', 'CTX07-public'].some((id) => !results.find((row) => row.id === id)?.passed)
  ) {
    for (const row of results)
      if (row.passed) {
        row.passed = false
        row.failedChecks.push('positive_control')
      }
  }
  const passed = results.filter((row) => row.passed).length
  return {
    status: passed === COHORTS.length ? ('PASSED' as const) : ('FAILED' as const),
    planned: COHORTS.length,
    executed: results.length,
    passed,
    failed: results.length - passed,
    results,
  }
}
