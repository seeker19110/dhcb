// packages/core-personal/coreMemoryBlocks.ts — Bạn Đồng Hành GĐ2b: khối ghi nhớ cố định + tóm tắt
// cuộn (đặc tả `docs/specs/2026-10-12-ban-dong-hanh-gd2b-trich-ky-uc-khoi-loi.md`, migration 0096).
//
// Hai loại dữ liệu NHỎ, luôn nạp vào ngữ cảnh khi consent tương ứng bật:
//   · Khối cố định (Letta core memory) — "Về tôi" + "Đang tập trung", người dùng TỰ VIẾT trên trang
//     ký ức nên không cần qua ProposedAction (không phải AI suy ra hộ). Bảng
//     `personal.companion_core_blocks`.
//   · Tóm tắt cuộn theo miền — bộ phản tỉnh nền viết (memoryReflectionService.ts), người dùng xem
//     và xoá được. `summary = ''` = đã xoá; con trỏ giữ lại để không tóm tắt lại chính tin cũ đó.
//     Bảng `personal.companion_conversation_summaries`.
// File này là nơi DUY NHẤT chạm hai bảng đó.
import type { Pool, PoolClient } from 'pg'
import { ConflictError, ValidationError } from '@dhcb/core-errors/appError'
import {
  CORE_MEMORY_BLOCK_MAX_CHARS,
  CONVERSATION_SUMMARY_MAX_CHARS,
  CoreMemoryBlockLabelSchema,
  type CoreMemoryBlock,
  type CoreMemoryBlockLabel,
  type ConversationSummary,
} from '@dhcb/core-contracts/personalMemory'

type Runner = Pick<Pool | PoolClient, 'query'>

/** Thứ tự hiển thị + thứ tự nạp vào ngữ cảnh. */
export const CORE_MEMORY_BLOCK_LABELS: readonly CoreMemoryBlockLabel[] =
  CoreMemoryBlockLabelSchema.options

/** Khối cố định kèm `id` (cần làm `sourceId` trong ContextPackage); `id = null` khi chưa viết. */
export interface StoredCoreBlock extends CoreMemoryBlock {
  id: string | null
}

interface CoreBlockRow {
  id: string
  label: string
  content: string
  version: number
  updated_at: Date
}

function toStoredBlock(row: CoreBlockRow): StoredCoreBlock {
  return {
    id: row.id,
    label: CoreMemoryBlockLabelSchema.parse(row.label),
    content: row.content,
    version: row.version,
    updatedAt: row.updated_at.toISOString(),
  }
}

/** Luôn trả ĐỦ hai khối theo thứ tự cố định — khối chưa viết có `content: ''`, `version: 0`. */
export async function listCoreBlocks(runner: Runner, personId: string): Promise<StoredCoreBlock[]> {
  const { rows } = await runner.query<CoreBlockRow>(
    `select id, label, content, version, updated_at
     from personal.companion_core_blocks
     where person_id = $1`,
    [personId],
  )
  const byLabel = new Map(rows.map((r) => [r.label, r]))
  return CORE_MEMORY_BLOCK_LABELS.map((label) => {
    const row = byLabel.get(label)
    return row ? toStoredBlock(row) : { id: null, label, content: '', version: 0 }
  })
}

/**
 * Ghi một khối (người dùng tự viết). `expectedVersion` = phiên bản client đang thấy (0 = chưa có).
 * Chuỗi rỗng = xoá khối. Lệch phiên bản (hai tab cùng sửa) ⇒ 409.
 */
export async function setCoreBlock(
  pool: Pool,
  personId: string,
  label: CoreMemoryBlockLabel,
  content: string,
  expectedVersion: number,
): Promise<StoredCoreBlock> {
  const trimmed = content.trim()
  if (trimmed.length > CORE_MEMORY_BLOCK_MAX_CHARS) {
    throw new ValidationError(`Mỗi khối tối đa ${CORE_MEMORY_BLOCK_MAX_CHARS} ký tự`)
  }
  const conflict = () =>
    new ConflictError('Khối ghi nhớ vừa được sửa ở nơi khác — tải lại rồi sửa tiếp')

  if (!trimmed) {
    if (expectedVersion === 0) {
      // Chưa từng có mà xoá: chỉ hợp lệ khi thật sự chưa có dòng nào.
      const { rows } = await pool.query<{ id: string }>(
        `select id from personal.companion_core_blocks where person_id = $1 and label = $2`,
        [personId, label],
      )
      if (rows.length > 0) throw conflict()
    } else {
      const { rowCount } = await pool.query(
        `delete from personal.companion_core_blocks
         where person_id = $1 and label = $2 and version = $3`,
        [personId, label, expectedVersion],
      )
      if (!rowCount) throw conflict()
    }
    return { id: null, label, content: '', version: 0 }
  }

  if (expectedVersion === 0) {
    const { rows } = await pool.query<CoreBlockRow>(
      `insert into personal.companion_core_blocks (person_id, label, content)
       values ($1, $2, $3)
       on conflict (person_id, label) do nothing
       returning id, label, content, version, updated_at`,
      [personId, label, trimmed],
    )
    const row = rows[0]
    if (!row) throw conflict()
    return toStoredBlock(row)
  }

  const { rows } = await pool.query<CoreBlockRow>(
    `update personal.companion_core_blocks
     set content = $4, version = version + 1, updated_at = now()
     where person_id = $1 and label = $2 and version = $3
     returning id, label, content, version, updated_at`,
    [personId, label, expectedVersion, trimmed],
  )
  const row = rows[0]
  if (!row) throw conflict()
  return toStoredBlock(row)
}

// ─── Tóm tắt cuộn ────────────────────────────────────────────────────────────────────────────

interface SummaryRow {
  id: string
  domain: string
  summary: string
  summarized_through_at: Date
  summarized_through_id: string
  updated_at: Date
}

const SUMMARY_COLUMNS =
  'id, domain, summary, summarized_through_at, summarized_through_id, updated_at'

export interface StoredSummary extends ConversationSummary {
  id: string
  /** Con trỏ: tin cuối cùng (theo `(created_at, id)`) đã được gộp vào bản tóm tắt. */
  through: { at: Date; id: string }
}

function toStoredSummary(row: SummaryRow): StoredSummary {
  return {
    id: row.id,
    domain: row.domain,
    summary: row.summary,
    updatedAt: row.updated_at.toISOString(),
    through: { at: row.summarized_through_at, id: row.summarized_through_id },
  }
}

/** Mọi bản tóm tắt của một người (kể cả bản đã xoá — nơi gọi cần con trỏ). */
export async function listConversationSummaries(
  runner: Runner,
  personId: string,
): Promise<StoredSummary[]> {
  const { rows } = await runner.query<SummaryRow>(
    `select ${SUMMARY_COLUMNS} from personal.companion_conversation_summaries
     where person_id = $1
     order by domain`,
    [personId],
  )
  return rows.map(toStoredSummary)
}

/** Bản tóm tắt CÒN NỘI DUNG của đúng một miền — để nạp vào ngữ cảnh. */
export async function getConversationSummary(
  runner: Runner,
  personId: string,
  domain: string,
): Promise<StoredSummary | null> {
  const { rows } = await runner.query<SummaryRow>(
    `select ${SUMMARY_COLUMNS} from personal.companion_conversation_summaries
     where person_id = $1 and domain = $2 and summary <> ''`,
    [personId, domain],
  )
  const row = rows[0]
  return row ? toStoredSummary(row) : null
}

/** Bộ phản tỉnh ghi bản tóm tắt mới + dời con trỏ (một câu upsert — chỉ instance 0 chạy). */
export async function upsertConversationSummary(
  runner: Runner,
  personId: string,
  domain: string,
  summary: string,
  through: { at: Date; id: string },
): Promise<void> {
  await runner.query(
    `insert into personal.companion_conversation_summaries
       (person_id, domain, summary, summarized_through_at, summarized_through_id)
     values ($1, $2, $3, $4, $5)
     on conflict (person_id, domain) do update
       set summary = excluded.summary,
           summarized_through_at = excluded.summarized_through_at,
           summarized_through_id = excluded.summarized_through_id,
           version = personal.companion_conversation_summaries.version + 1,
           updated_at = now()`,
    [
      personId,
      domain,
      summary.trim().slice(0, CONVERSATION_SUMMARY_MAX_CHARS),
      through.at,
      through.id,
    ],
  )
}

/** Người dùng xoá bản tóm tắt: nội dung về rỗng, GIỮ con trỏ (không tóm tắt lại tin cũ). */
export async function clearConversationSummary(
  pool: Pool,
  personId: string,
  domain: string,
): Promise<void> {
  await pool.query(
    `update personal.companion_conversation_summaries
     set summary = '', version = version + 1, updated_at = now()
     where person_id = $1 and domain = $2`,
    [personId, domain],
  )
}
