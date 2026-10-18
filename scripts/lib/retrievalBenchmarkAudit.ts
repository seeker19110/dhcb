// Oracle hẹp cho own rank cohort; không seed, đổi labels, cleanup hoặc đo retrieval.
import { isDeepStrictEqual } from 'node:util'
import type { Pool } from 'pg'
import { z } from 'zod'
import { MemoryNamespaceSchema } from '@dhcb/core-contracts/personalMemory'
import { BoundaryJsonSchema } from './companionBoundaryCorpus.js'
import { FROZEN_DEFINITION_SHA256, type RetrievalCorpus } from './retrievalBenchmarkSchema.js'
import type { RetrievalSeed } from './retrievalBenchmarkRunner.js'

const UUID = z.uuid()
const Time = z.iso.datetime({ offset: true })
const Memory = z
  .object({
    id: UUID,
    person_id: UUID,
    namespace: MemoryNamespaceSchema,
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
const Audit = z
  .object({
    id: z.number().int().positive().safe(),
    record_id: UUID,
    person_id: UUID,
    action: z.enum(['INSERT', 'UPDATE', 'MERGE', 'EXPIRE', 'DELETE']),
    changes: BoundaryJsonSchema,
    changed_by: z.string(),
    audited_at: Time,
  })
  .strict()
function exactOwnKeys(value: unknown, expected: readonly string[]): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    isDeepStrictEqual(Object.keys(value).sort(), [...expected].sort())
  )
}
const MemoryRaw = z.custom<z.infer<typeof Memory>>(
  (value) => Memory.safeParse(value).success && exactOwnKeys(value, Object.keys(Memory.shape)),
)
const AuditRaw = z.custom<z.infer<typeof Audit>>(
  (value) => Audit.safeParse(value).success && exactOwnKeys(value, Object.keys(Audit.shape)),
)
const State = z
  .object({ memory: z.array(MemoryRaw), audit: z.array(AuditRaw), at: z.date() })
  .strict()
export type RetrievalSeedState = z.infer<typeof State>
const Seed = z
  .object({
    version: z.literal(1),
    corpusHash: z.literal(FROZEN_DEFINITION_SHA256),
    persons: z
      .array(
        z.object({ personKey: z.enum(['P1', 'P2', 'P3']), userId: UUID, personId: UUID }).strict(),
      )
      .length(3),
    records: z
      .array(
        z
          .object({ recordKey: z.string(), personKey: z.enum(['P1', 'P2', 'P3']), recordId: UUID })
          .strict(),
      )
      .length(26),
  })
  .strict()
function fail(code: string): never {
  throw new Error(`RETRIEVAL_SEED_AUDIT_${code}`)
}
const iso = (value: string) => new Date(value).toISOString()
const inside = (value: string, lower: Date, upper: Date) =>
  Date.parse(value) >= lower.getTime() && Date.parse(value) <= upper.getTime()

/** Raw rows giữ JSON payload keys để không bỏ qua __proto__/extra payload khi đối chiếu. */
export function validateRetrievalSeedState(
  corpus: RetrievalCorpus,
  seedInput: RetrievalSeed,
  input: unknown,
  lower: Date,
): RetrievalSeedState {
  const seed = Seed.parse(seedInput)
  const state = State.parse(input)
  if (!Number.isFinite(lower.getTime()) || lower > state.at) fail('CLOCK')
  if (
    new Set(seed.persons.map((person) => person.personKey)).size !== 3 ||
    new Set(seed.persons.map((person) => person.personId)).size !== 3 ||
    new Set(seed.persons.map((person) => person.userId)).size !== 3 ||
    new Set(seed.records.map((record) => record.recordKey)).size !== 26 ||
    new Set(seed.records.map((record) => record.recordId)).size !== 26 ||
    state.memory.length !== 26 ||
    new Set(state.memory.map((row) => row.id)).size !== 26 ||
    state.audit.length !== 29 ||
    new Set(state.audit.map((row) => row.id)).size !== 29
  )
    fail('COUNT_OR_MAPPING')
  const record = (key: string) => {
    const mapping = seed.records.find((row) => row.recordKey === key)
    const row = state.memory.find((memory) => memory.id === mapping?.recordId)
    if (!mapping || !row) fail('RECORD_MISSING')
    return { mapping, row }
  }
  for (const label of corpus.records) {
    const { mapping, row } = record(label.key)
    const owner = seed.persons.find((person) => person.personKey === label.personKey)
    if (!owner || mapping.personKey !== label.personKey) fail('OWNER_MAPPING')
    const closed = label.lifecycle.kind === 'invalidated' || label.lifecycle.kind === 'superseded'
    const transitioned = label.lifecycle.kind !== 'live'
    const events = state.audit.filter((event) => event.record_id === row.id)
    const expire = events.find((event) => event.action === 'EXPIRE')
    const expectedUpdated = closed
      ? row.valid_to
      : label.lifecycle.kind === 'expired'
        ? expire?.audited_at
        : row.created_at
    const expected = {
      id: mapping.recordId,
      person_id: owner.personId,
      namespace: label.namespace,
      content: label.content,
      provenance: label.seed.provenance,
      sensitivity: label.sensitivity,
      status: label.lifecycle.kind === 'expired' ? 'expired' : 'accepted',
      merged_from_id: null,
      version: transitioned ? 2 : 1,
      created_at: row.created_at,
      updated_at: expectedUpdated,
      retain_until: null,
      importance: 5,
      last_accessed_at: null,
      access_count: 0,
      valid_from: row.created_at,
      valid_to: closed ? row.valid_to : null,
      superseded_by:
        label.lifecycle.kind === 'superseded'
          ? record(label.lifecycle.supersededByKey).row.id
          : null,
      source_message_id: null,
      embedding: null,
      embedding_model: null,
      search_tsv: row.search_tsv,
    }
    if (
      !isDeepStrictEqual(row, expected) ||
      (closed && row.valid_to === null) ||
      !row.search_tsv.trim() ||
      !inside(row.created_at, lower, state.at) ||
      !inside(row.updated_at, lower, state.at) ||
      Date.parse(row.updated_at) < Date.parse(row.created_at)
    )
      fail('ROW')
    const expectedEvents: Array<{ action: string; changes: unknown; at: string }> = [
      {
        action: 'INSERT',
        at: row.created_at,
        changes: {
          namespace: label.namespace,
          content: label.content,
          ...(label.key === 'R01' ? { supersedes: record('R02').row.id } : {}),
        },
      },
    ]
    if (label.lifecycle.kind === 'expired')
      expectedEvents.push({
        action: 'EXPIRE',
        changes: { previousStatus: 'accepted' },
        at: row.updated_at,
      })
    if (label.lifecycle.kind === 'invalidated')
      expectedEvents.push({
        action: 'UPDATE',
        changes: { invalidated: true, reason: 'synthetic fixture lifecycle' },
        at: row.updated_at,
      })
    if (label.lifecycle.kind === 'superseded') {
      const fresh = record(label.lifecycle.supersededByKey).row
      if (row.valid_to !== fresh.valid_from) fail('CHAIN')
      expectedEvents.push({
        action: 'UPDATE',
        at: row.updated_at,
        changes: { supersededBy: fresh.id, validTo: row.valid_to ? iso(row.valid_to) : null },
      })
    }
    if (
      events.length !== expectedEvents.length ||
      events.some(
        (event) =>
          event.person_id !== owner.personId ||
          event.changed_by !== 'stored-s05-synthetic' ||
          !inside(event.audited_at, lower, state.at),
      ) ||
      expectedEvents.some(
        (expectedEvent) =>
          events.filter(
            (event) =>
              event.action === expectedEvent.action &&
              event.audited_at === expectedEvent.at &&
              isDeepStrictEqual(event.changes, expectedEvent.changes),
          ).length !== 1,
      )
    )
      fail('EVENT')
  }
  return state
}

export async function captureRetrievalClock(pool: Pick<Pool, 'query'>): Promise<Date> {
  const row = z
    .array(z.object({ at: z.date() }).strict())
    .length(1)
    .parse((await pool.query('select clock_timestamp() as at')).rows)[0]
  if (!row) fail('CLOCK_MISSING')
  return row.at
}
export async function readRetrievalSeedState(
  pool: Pick<Pool, 'query'>,
  corpus: RetrievalCorpus,
  seed: RetrievalSeed,
  lower: Date,
): Promise<RetrievalSeedState> {
  const ids = Seed.parse(seed).persons.map((person) => person.personId)
  const Rows = z.array(z.object({ value: BoundaryJsonSchema }).strict())
  const memory = Rows.parse(
    (
      await pool.query(
        'select to_jsonb(t) as value from personal.memory_records t where person_id = any($1::uuid[]) order by id',
        [ids],
      )
    ).rows,
  ).map((row) => row.value)
  const audit = Rows.parse(
    (
      await pool.query(
        'select to_jsonb(t) as value from personal.memory_records_audit_log t where person_id = any($1::uuid[]) order by id',
        [ids],
      )
    ).rows,
  ).map((row) => row.value)
  return validateRetrievalSeedState(
    corpus,
    seed,
    { memory, audit, at: await captureRetrievalClock(pool) },
    lower,
  )
}
export function assertRetrievalSeedUnchanged(
  before: RetrievalSeedState,
  after: RetrievalSeedState,
): void {
  if (
    !isDeepStrictEqual(before.memory, after.memory) ||
    !isDeepStrictEqual(before.audit, after.audit)
  )
    fail('CHANGED_AFTER_RANK')
}
