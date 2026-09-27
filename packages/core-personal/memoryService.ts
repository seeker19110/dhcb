// packages/core-personal/memoryService.ts — V2-06 Personal Knowledge Fabric.
import type { Pool, PoolClient } from 'pg'
import { withTransaction } from '@dhcb/core-db/transaction'
import { ConflictError, NotFoundError, ValidationError } from '@dhcb/core-errors/appError'
import {
  MemoryRecordSchema,
  PERSONAL_MEMORY_SCHEMA_VERSION,
  type MemoryRecord,
  type MemoryNamespace,
} from '@dhcb/core-contracts/personalMemory'
import type { Sensitivity } from '@dhcb/core-contracts/personalFact'

type Runner = Pick<Pool | PoolClient, 'query'>

export interface MemoryRecordRow {
  id: string
  person_id: string
  namespace: string
  content: string
  provenance: string
  sensitivity: string
  status: string
  merged_from_id: string | null
  version: number
  created_at: Date
  updated_at: Date
  retain_until: Date | null
}

export interface MemoryCandidate {
  namespace: MemoryNamespace
  content: string
  provenance: string
  sensitivity: Sensitivity
  confidence?: number
  retainUntil?: string
}

export interface CandidateEvaluation {
  outcome: 'ACCEPT' | 'MERGE' | 'REJECT' | 'ASK_USER' | 'EXPIRE'
  reason: string
  existingRecordId?: string
  mergedContent?: string
}

const MEMORY_COLUMNS =
  'id, person_id, namespace, content, provenance, sensitivity, status, merged_from_id, version, created_at, updated_at, retain_until'

export function rowToMemoryRecord(row: MemoryRecordRow): MemoryRecord {
  return MemoryRecordSchema.parse({
    id: row.id,
    personId: row.person_id,
    namespace: row.namespace,
    content: row.content,
    provenance: row.provenance,
    sensitivity: row.sensitivity,
    status: row.status,
    mergedFromId: row.merged_from_id ?? undefined,
    createdAt: row.created_at.toISOString(),
    retainUntil: row.retain_until ? row.retain_until.toISOString() : undefined,
    schemaVersion: PERSONAL_MEMORY_SCHEMA_VERSION,
  })
}

/**
 * Memory Candidate Pipeline:
 * Observation → Candidate extraction → Schema validation → Dedup/conflict detection
 * → Sensitivity classification → Confidence policy → ACCEPT | MERGE | REJECT | ASK_USER | EXPIRE
 */
export async function evaluateMemoryCandidate(
  runner: Runner,
  personId: string,
  candidate: MemoryCandidate,
): Promise<CandidateEvaluation> {
  const content = candidate.content?.trim()
  if (!content || content.length > 2000) {
    return { outcome: 'REJECT', reason: 'Content length must be between 1 and 2000 characters' }
  }

  const provenance = candidate.provenance?.trim()
  if (!provenance || provenance.length > 200) {
    return { outcome: 'REJECT', reason: 'Provenance length must be between 1 and 200 characters' }
  }

  // Sensitivity + privacy policy: Restricted sensitivity requires verified user-declared provenance
  if (candidate.sensitivity === 'restricted' && !provenance.startsWith('user_declared')) {
    return {
      outcome: 'REJECT',
      reason: 'Restricted sensitivity requires explicit user_declared provenance',
    }
  }

  // Confidence policy threshold
  if (candidate.confidence !== undefined) {
    if (candidate.confidence < 0.6) {
      return {
        outcome: 'REJECT',
        reason: `Confidence score ${candidate.confidence} is below minimum threshold 0.60`,
      }
    }
    if (candidate.confidence < 0.8) {
      return {
        outcome: 'ASK_USER',
        reason: `Confidence score ${candidate.confidence} requires explicit user confirmation`,
      }
    }
  }

  // Dedup and conflict detection in existing active records
  const { rows } = await runner.query<MemoryRecordRow>(
    `select ${MEMORY_COLUMNS} from personal.memory_records
     where person_id = $1 and namespace = $2 and status <> 'expired'`,
    [personId, candidate.namespace],
  )

  for (const existing of rows) {
    // Exact match -> Duplicate
    if (existing.content.trim().toLowerCase() === content.toLowerCase()) {
      return {
        outcome: 'REJECT',
        reason: 'Duplicate memory already exists in this namespace',
        existingRecordId: existing.id,
      }
    }

    // Subsumption / Merge check: If one contains the other and provenance matches
    if (
      existing.content.toLowerCase().includes(content.toLowerCase()) ||
      content.toLowerCase().includes(existing.content.toLowerCase())
    ) {
      const mergedContent = content.length >= existing.content.length ? content : existing.content
      return {
        outcome: 'MERGE',
        reason: 'Overlapping memory content detected; merging into existing record',
        existingRecordId: existing.id,
        mergedContent,
      }
    }
  }

  return { outcome: 'ACCEPT', reason: 'Passed all candidate pipeline checks' }
}

export async function ingestMemory(
  pool: Pool,
  personId: string,
  candidate: MemoryCandidate,
  actor = 'system',
): Promise<{ record: MemoryRecord; evaluation: CandidateEvaluation }> {
  return withTransaction(pool, (client) =>
    ingestMemoryWithClient(client, personId, candidate, actor),
  )
}

/**
 * Bản chạy TRONG một transaction đang mở sẵn — dùng khi việc ghi ký ức phải nguyên tử cùng thao
 * tác khác (ví dụ Companion xác nhận một ProposedAction). `ingestMemory` ở trên chỉ là lớp bọc
 * mở transaction rồi gọi hàm này.
 */
export async function ingestMemoryWithClient(
  client: PoolClient,
  personId: string,
  candidate: MemoryCandidate,
  actor = 'system',
): Promise<{ record: MemoryRecord; evaluation: CandidateEvaluation }> {
  const evaluation = await evaluateMemoryCandidate(client, personId, candidate)

  if (evaluation.outcome === 'REJECT' || evaluation.outcome === 'ASK_USER') {
    throw new ValidationError(`Memory candidate not accepted: ${evaluation.reason}`)
  }

  if (evaluation.outcome === 'MERGE' && evaluation.existingRecordId) {
    // evaluateMemoryCandidate() luôn set mergedContent khi outcome='MERGE' (dòng ~131-136) —
    // bất biến này không được TypeScript enforce (CandidateEvaluation không phải discriminated
    // union) nên assert tường minh thay vì âm thầm rơi về candidate.content nếu bất biến vỡ.
    if (!evaluation.mergedContent) {
      throw new Error('mergedContent phải có giá trị khi outcome=MERGE')
    }
    // Merge into existing record
    const { rows } = await client.query<MemoryRecordRow>(
      `update personal.memory_records
       set content = $1, status = 'merged', updated_at = now(), version = version + 1,
           sensitivity = (array['public', 'personal', 'sensitive', 'restricted']::text[])[
             greatest(
               array_position(array['public', 'personal', 'sensitive', 'restricted']::text[], sensitivity),
               array_position(array['public', 'personal', 'sensitive', 'restricted']::text[], $4)
             )
           ]
       where id = $2 and person_id = $3
       returning ${MEMORY_COLUMNS}`,
      [evaluation.mergedContent, evaluation.existingRecordId, personId, candidate.sensitivity],
    )
    const row = rows[0]
    if (!row) throw new NotFoundError('Target memory record to merge was not found')

    await client.query(
      `insert into personal.memory_records_audit_log
         (record_id, person_id, action, changes, changed_by)
       values ($1, $2, 'MERGE', $3, $4)`,
      [
        row.id,
        personId,
        JSON.stringify({ mergedFromContent: candidate.content, newContent: row.content }),
        actor,
      ],
    )

    return { record: rowToMemoryRecord(row), evaluation }
  }

  // ACCEPT -> Insert new record
  const { rows } = await client.query<MemoryRecordRow>(
    `insert into personal.memory_records
       (person_id, namespace, content, provenance, sensitivity, status, retain_until)
     values ($1, $2, $3, $4, $5, 'accepted', $6)
     returning ${MEMORY_COLUMNS}`,
    [
      personId,
      candidate.namespace,
      candidate.content.trim(),
      candidate.provenance.trim(),
      candidate.sensitivity,
      candidate.retainUntil ? new Date(candidate.retainUntil) : null,
    ],
  )

  const row = rows[0]
  if (!row) throw new Error('Failed to insert memory record')

  await client.query(
    `insert into personal.memory_records_audit_log
       (record_id, person_id, action, changes, changed_by)
     values ($1, $2, 'INSERT', $3, $4)`,
    [row.id, personId, JSON.stringify({ namespace: row.namespace, content: row.content }), actor],
  )

  return { record: rowToMemoryRecord(row), evaluation }
}

export async function getMemoryRecord(
  runner: Runner,
  personId: string,
  recordId: string,
): Promise<MemoryRecord | null> {
  const { rows } = await runner.query<MemoryRecordRow>(
    `select ${MEMORY_COLUMNS} from personal.memory_records
     where id = $1 and person_id = $2`,
    [recordId, personId],
  )
  const row = rows[0]
  return row ? rowToMemoryRecord(row) : null
}

export async function listMemoryRecords(
  runner: Runner,
  personId: string,
  options: {
    namespace?: MemoryNamespace
    includeExpired?: boolean
    limit?: number
  } = {},
): Promise<MemoryRecord[]> {
  const params: unknown[] = [personId]
  const conditions = ['person_id = $1']

  if (options.namespace) {
    params.push(options.namespace)
    conditions.push(`namespace = $${params.length}`)
  }

  if (!options.includeExpired) {
    conditions.push("status <> 'expired'")
  }

  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200)
  params.push(limit)

  const { rows } = await runner.query<MemoryRecordRow>(
    `select ${MEMORY_COLUMNS} from personal.memory_records
     where ${conditions.join(' and ')}
     order by created_at desc
     limit $${params.length}`,
    params,
  )

  return rows.map(rowToMemoryRecord)
}

export async function expireMemoryRecord(
  pool: Pool,
  personId: string,
  recordId: string,
  expectedVersion: number,
  actor = 'system',
): Promise<MemoryRecord> {
  return withTransaction(pool, async (client) => {
    const { rows: currentRows } = await client.query<MemoryRecordRow>(
      `select ${MEMORY_COLUMNS} from personal.memory_records
       where id = $1 and person_id = $2`,
      [recordId, personId],
    )
    const current = currentRows[0]
    if (!current) throw new NotFoundError('Memory record not found')
    if (current.version !== expectedVersion) {
      throw new ConflictError('Memory record version mismatch; please reload before expiring')
    }

    const { rows } = await client.query<MemoryRecordRow>(
      `update personal.memory_records
       set status = 'expired', updated_at = now(), version = version + 1
       where id = $1 and person_id = $2
       returning ${MEMORY_COLUMNS}`,
      [recordId, personId],
    )
    const row = rows[0]
    if (!row) throw new NotFoundError('Memory record not found')

    await client.query(
      `insert into personal.memory_records_audit_log
         (record_id, person_id, action, changes, changed_by)
       values ($1, $2, 'EXPIRE', $3, $4)`,
      [recordId, personId, JSON.stringify({ previousStatus: current.status }), actor],
    )

    return rowToMemoryRecord(row)
  })
}

export async function deleteMemoryRecord(
  pool: Pool,
  personId: string,
  recordId: string,
  actor = 'system',
): Promise<void> {
  await withTransaction(pool, async (client) => {
    const { rows } = await client.query<MemoryRecordRow>(
      `delete from personal.memory_records
       where id = $1 and person_id = $2
       returning ${MEMORY_COLUMNS}`,
      [recordId, personId],
    )
    if (rows.length === 0) throw new NotFoundError('Memory record not found')

    await client.query(
      `insert into personal.memory_records_audit_log
         (record_id, person_id, action, changes, changed_by)
       values ($1, $2, 'DELETE', $3, $4)`,
      [recordId, personId, JSON.stringify({ deleted: true }), actor],
    )
  })
}

export async function purgeExpiredMemories(pool: Pool): Promise<number> {
  const { rowCount } = await pool.query(
    `delete from personal.memory_records
     where (retain_until is not null and retain_until < now())
        or (status = 'expired' and updated_at < now() - interval '30 days')`,
  )
  return rowCount ?? 0
}
