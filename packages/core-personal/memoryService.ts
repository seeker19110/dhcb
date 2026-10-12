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
import { embedForStorage, type EmbeddingProvider } from '@dhcb/core-ai/embeddings'

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
  // GĐ2a (migration 0094) — điểm truy xuất + hai trục thời gian + vector nghĩa.
  importance: number
  last_accessed_at: Date | null
  access_count: number
  valid_from: Date
  valid_to: Date | null
  superseded_by: string | null
  source_message_id: string | null
  has_embedding: boolean
}

export interface MemoryCandidate {
  namespace: MemoryNamespace
  content: string
  provenance: string
  sensitivity: Sensitivity
  confidence?: number
  retainUntil?: string
  /** 1–10, mặc định 5. Chấm một lần lúc ghi; không hiện ra giao diện như "điểm". */
  importance?: number
  /** Lượt thoại (`personal.companion_messages.id`) sinh ra ký ức này, nếu có. */
  sourceMessageId?: string
}

/** Hàm tính vector nghĩa cho nội dung ký ức — `null` = không có provider hoặc lỗi (vẫn lưu). */
export type MemoryEmbedFn = (content: string) => Promise<{ vector: number[]; model: string } | null>

export interface MemoryWriteOptions {
  /** Mặc định: Gemini qua `embedForStorage` (không có key → null). Test truyền hàm giả. */
  embed?: MemoryEmbedFn
}

const DEFAULT_IMPORTANCE = 5

function clampImportance(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return DEFAULT_IMPORTANCE
  return Math.min(10, Math.max(1, Math.round(value)))
}

export interface CandidateEvaluation {
  outcome: 'ACCEPT' | 'MERGE' | 'REJECT' | 'ASK_USER' | 'EXPIRE'
  reason: string
  existingRecordId?: string
  mergedContent?: string
}

// KHÔNG select cột `embedding` (768 số thực/dòng) ở đường đọc thường — chỉ cờ "đã có vector";
// memoryRetrieval.ts tự đọc vector khi cần so nghĩa.
const MEMORY_COLUMNS =
  'id, person_id, namespace, content, provenance, sensitivity, status, merged_from_id, version, created_at, updated_at, retain_until, importance, last_accessed_at, access_count, valid_from, valid_to, superseded_by, source_message_id, (embedding is not null) as has_embedding'

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
    version: row.version,
    importance: row.importance,
    lastAccessedAt: row.last_accessed_at ? row.last_accessed_at.toISOString() : undefined,
    validFrom: row.valid_from.toISOString(),
    validTo: row.valid_to ? row.valid_to.toISOString() : undefined,
    supersededBy: row.superseded_by ?? undefined,
    sourceMessageId: row.source_message_id ?? undefined,
    hasEmbedding: row.has_embedding === true,
    schemaVersion: PERSONAL_MEMORY_SCHEMA_VERSION,
  })
}

/** Vector lúc ghi — mọi lỗi đã được lớp embedding nuốt thành `null`; ở đây chỉ thêm một lớp chắn
 * nữa để một hàm `embed` do nơi gọi truyền vào mà ném cũng không làm hỏng việc lưu ký ức. */
async function safeEmbed(
  embed: MemoryEmbedFn | undefined,
  content: string,
): Promise<{ vector: number[]; model: string } | null> {
  try {
    return await (embed ?? embedForStorage)(content)
  } catch {
    return null
  }
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
  options: MemoryWriteOptions = {},
): Promise<{ record: MemoryRecord; evaluation: CandidateEvaluation }> {
  return withTransaction(pool, (client) =>
    ingestMemoryWithClient(client, personId, candidate, actor, options),
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
  options: MemoryWriteOptions = {},
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
    // Nội dung đổi ⇒ vector cũ không còn đúng: tính lại (null thì xoá vector, job đêm bù).
    const embedding = await safeEmbed(options.embed, evaluation.mergedContent)
    // Merge into existing record
    const { rows } = await client.query<MemoryRecordRow>(
      `update personal.memory_records
       set content = $1, status = 'merged', updated_at = now(), version = version + 1,
           sensitivity = (array['public', 'personal', 'sensitive', 'restricted']::text[])[
             greatest(
               array_position(array['public', 'personal', 'sensitive', 'restricted']::text[], sensitivity),
               array_position(array['public', 'personal', 'sensitive', 'restricted']::text[], $4)
             )
           ],
           embedding = $5::real[], embedding_model = $6
       where id = $2 and person_id = $3
       returning ${MEMORY_COLUMNS}`,
      [
        evaluation.mergedContent,
        evaluation.existingRecordId,
        personId,
        candidate.sensitivity,
        embedding?.vector ?? null,
        embedding?.model ?? null,
      ],
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
  const content = candidate.content.trim()
  const embedding = await safeEmbed(options.embed, content)
  const { rows } = await client.query<MemoryRecordRow>(
    `insert into personal.memory_records
       (person_id, namespace, content, provenance, sensitivity, status, retain_until,
        importance, source_message_id, embedding, embedding_model)
     values ($1, $2, $3, $4, $5, 'accepted', $6, $7, $8, $9::real[], $10)
     returning ${MEMORY_COLUMNS}`,
    [
      personId,
      candidate.namespace,
      content,
      candidate.provenance.trim(),
      candidate.sensitivity,
      candidate.retainUntil ? new Date(candidate.retainUntil) : null,
      clampImportance(candidate.importance),
      candidate.sourceMessageId ?? null,
      embedding?.vector ?? null,
      embedding?.model ?? null,
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

/**
 * Người dùng SỬA nội dung một ký ức trên trang "Bạn Đồng Hành nhớ gì về tôi" (GĐ2a). Giữ id và
 * lịch sử; `version + 1`, audit `UPDATE`, tính lại vector. `expectedVersion` lệch ⇒ 409 (hai tab
 * cùng sửa).
 */
export async function updateMemoryContent(
  pool: Pool,
  personId: string,
  recordId: string,
  content: string,
  expectedVersion: number,
  actor = 'system',
  options: MemoryWriteOptions = {},
): Promise<MemoryRecord> {
  const trimmed = content.trim()
  if (!trimmed || trimmed.length > 2000) {
    throw new ValidationError('Nội dung ký ức phải từ 1 đến 2000 ký tự')
  }
  return withTransaction(pool, async (client) => {
    const { rows: currentRows } = await client.query<MemoryRecordRow>(
      `select ${MEMORY_COLUMNS} from personal.memory_records
       where id = $1 and person_id = $2
       for update`,
      [recordId, personId],
    )
    const current = currentRows[0]
    if (!current) throw new NotFoundError('Memory record not found')
    if (current.version !== expectedVersion) {
      throw new ConflictError('Memory record version mismatch; please reload before editing')
    }
    if (current.status === 'expired') {
      throw new ValidationError('Ký ức đã được quên, không sửa được')
    }

    const embedding = await safeEmbed(options.embed, trimmed)
    const { rows } = await client.query<MemoryRecordRow>(
      `update personal.memory_records
       set content = $1, updated_at = now(), version = version + 1,
           embedding = $4::real[], embedding_model = $5
       where id = $2 and person_id = $3
       returning ${MEMORY_COLUMNS}`,
      [trimmed, recordId, personId, embedding?.vector ?? null, embedding?.model ?? null],
    )
    const row = rows[0]
    if (!row) throw new NotFoundError('Memory record not found')

    await client.query(
      `insert into personal.memory_records_audit_log
         (record_id, person_id, action, changes, changed_by)
       values ($1, $2, 'UPDATE', $3, $4)`,
      [
        recordId,
        personId,
        JSON.stringify({ previousContent: current.content, newContent: row.content }),
        actor,
      ],
    )
    return rowToMemoryRecord(row)
  })
}

/**
 * Khoá rồi kiểm một ký ức CÒN HIỆU LỰC của đúng người đó, đúng phiên bản — dùng chung cho hai thao
 * tác GĐ2b bên dưới. Gợi ý của AI được tạo từ một phiên bản cụ thể; nếu người dùng đã sửa/quên ký
 * ức đó, hoặc nó đã bị thay bởi gợi ý khác, thì gợi ý cũ không còn đúng ngữ cảnh ⇒ 409.
 */
async function lockLiveMemory(
  client: PoolClient,
  personId: string,
  recordId: string,
  expectedVersion: number,
): Promise<MemoryRecordRow> {
  const { rows } = await client.query<MemoryRecordRow>(
    `select ${MEMORY_COLUMNS} from personal.memory_records
     where id = $1 and person_id = $2
     for update`,
    [recordId, personId],
  )
  const current = rows[0]
  if (!current) throw new NotFoundError('Memory record not found')
  if (current.status === 'expired' || current.valid_to !== null) {
    throw new ConflictError('Ký ức này đã được quên hoặc đã được thay — gợi ý không còn áp dụng')
  }
  if (current.version !== expectedVersion) {
    throw new ConflictError('Ký ức vừa được sửa sau khi có gợi ý — gợi ý không còn áp dụng')
  }
  return current
}

export interface SupersedeMemoryInput {
  recordId: string
  expectedVersion: number
  content: string
  provenance: string
  importance?: number
  sourceMessageId?: string
}

/**
 * GĐ2b — THAY một ký ức bằng phiên bản mới mà KHÔNG xoá bản cũ (hai trục thời gian, Zep/Graphiti):
 * bản mới được tạo (giữ namespace + độ nhạy của bản cũ), bản cũ nhận `valid_to = now()` và
 * `superseded_by = <id mới>`. Truy xuất chỉ đọc bản `valid_to is null`, nên Companion dùng điều
 * mới nhưng lịch sử "trước đây bạn nhắm 6.5…" vẫn còn để tra. Chạy TRONG transaction của nơi gọi
 * (capability `memory.supersede_record` lúc người dùng bấm duyệt).
 */
export async function supersedeMemoryWithClient(
  client: PoolClient,
  personId: string,
  input: SupersedeMemoryInput,
  actor = 'system',
  options: MemoryWriteOptions = {},
): Promise<{ record: MemoryRecord; previous: MemoryRecord }> {
  const content = input.content.trim()
  if (!content || content.length > 2000) {
    throw new ValidationError('Nội dung ký ức phải từ 1 đến 2000 ký tự')
  }
  const current = await lockLiveMemory(client, personId, input.recordId, input.expectedVersion)
  const embedding = await safeEmbed(options.embed, content)

  const { rows: inserted } = await client.query<MemoryRecordRow>(
    `insert into personal.memory_records
       (person_id, namespace, content, provenance, sensitivity, status,
        importance, source_message_id, embedding, embedding_model)
     values ($1, $2, $3, $4, $5, 'accepted', $6, $7, $8::real[], $9)
     returning ${MEMORY_COLUMNS}`,
    [
      personId,
      current.namespace,
      content,
      input.provenance.trim(),
      current.sensitivity,
      clampImportance(input.importance ?? current.importance),
      input.sourceMessageId ?? null,
      embedding?.vector ?? null,
      embedding?.model ?? null,
    ],
  )
  const fresh = inserted[0]
  if (!fresh) throw new Error('Failed to insert superseding memory record')

  const { rows: closed } = await client.query<MemoryRecordRow>(
    `update personal.memory_records
     set valid_to = now(), superseded_by = $1, updated_at = now(), version = version + 1
     where id = $2 and person_id = $3
     returning ${MEMORY_COLUMNS}`,
    [fresh.id, current.id, personId],
  )
  const previous = closed[0]
  if (!previous) throw new NotFoundError('Memory record not found')

  await client.query(
    `insert into personal.memory_records_audit_log
       (record_id, person_id, action, changes, changed_by)
     values ($1, $2, 'INSERT', $3, $4), ($5, $2, 'UPDATE', $6, $4)`,
    [
      fresh.id,
      personId,
      JSON.stringify({
        namespace: fresh.namespace,
        content: fresh.content,
        supersedes: current.id,
      }),
      actor,
      current.id,
      JSON.stringify({ supersededBy: fresh.id, validTo: previous.valid_to }),
    ],
  )

  return { record: rowToMemoryRecord(fresh), previous: rowToMemoryRecord(previous) }
}

/**
 * GĐ2b — VÔ HIỆU một ký ức (người dùng nói điều cũ không còn đúng): chỉ đặt `valid_to = now()`,
 * KHÔNG xoá, KHÔNG đổi `status` — khác "Quên" (`expireMemoryRecord`) là thao tác người dùng tự
 * bấm để bỏ hẳn. Chạy TRONG transaction của nơi gọi.
 */
export async function invalidateMemoryWithClient(
  client: PoolClient,
  personId: string,
  recordId: string,
  expectedVersion: number,
  actor = 'system',
  reason = '',
): Promise<MemoryRecord> {
  await lockLiveMemory(client, personId, recordId, expectedVersion)
  const { rows } = await client.query<MemoryRecordRow>(
    `update personal.memory_records
     set valid_to = now(), updated_at = now(), version = version + 1
     where id = $1 and person_id = $2
     returning ${MEMORY_COLUMNS}`,
    [recordId, personId],
  )
  const row = rows[0]
  if (!row) throw new NotFoundError('Memory record not found')

  await client.query(
    `insert into personal.memory_records_audit_log
       (record_id, person_id, action, changes, changed_by)
     values ($1, $2, 'UPDATE', $3, $4)`,
    [
      recordId,
      personId,
      JSON.stringify({ invalidated: true, reason: reason.slice(0, 300) }),
      actor,
    ],
  )
  return rowToMemoryRecord(row)
}

/**
 * Đánh dấu "vừa được dùng" cho các ký ức đã vào prompt — `last_accessed_at` nuôi thành phần
 * recency của điểm truy xuất (Generative Agents: recency tính từ lần TRUY XUẤT, không phải lần
 * tạo). Không ghi audit: đây là tín hiệu sử dụng, không phải thay đổi nội dung.
 */
export async function touchMemoryAccess(
  runner: Runner,
  personId: string,
  recordIds: readonly string[],
): Promise<void> {
  if (recordIds.length === 0) return
  await runner.query(
    `update personal.memory_records
     set last_accessed_at = now(), access_count = access_count + 1
     where person_id = $1 and id = any($2::uuid[])`,
    [personId, [...recordIds]],
  )
}

export const BACKFILL_EMBEDDING_BATCH = 20

/**
 * Job đêm: tính vector cho ký ức chưa có (ghi lúc Gemini lỗi, hoặc trước khi có key). Mỗi lần
 * tối đa `limit` dòng, gửi theo lô `BACKFILL_EMBEDDING_BATCH`; dòng embed hỏng thì bỏ qua, lần
 * sau thử lại. Trả số dòng đã có vector.
 */
export async function backfillMemoryEmbeddings(
  pool: Pool,
  provider: EmbeddingProvider | null,
  limit = 200,
): Promise<number> {
  if (!provider) return 0
  const { rows } = await pool.query<{ id: string; content: string }>(
    `select id, content from personal.memory_records
     where embedding is null and status <> 'expired' and valid_to is null
     order by importance desc, created_at desc
     limit $1`,
    [Math.min(Math.max(1, limit), 1000)],
  )
  let done = 0
  for (let i = 0; i < rows.length; i += BACKFILL_EMBEDDING_BATCH) {
    const batch = rows.slice(i, i + BACKFILL_EMBEDDING_BATCH)
    const vectors = await provider.embed(
      batch.map((r) => r.content),
      'document',
    )
    for (let j = 0; j < batch.length; j++) {
      const vector = vectors[j]
      if (!vector) continue
      await pool.query(
        `update personal.memory_records
         set embedding = $2::real[], embedding_model = $3
         where id = $1 and embedding is null`,
        [batch[j]!.id, vector, provider.model],
      )
      done++
    }
  }
  return done
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
