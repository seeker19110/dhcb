// packages/core-personal/personErasureService.ts — V2-19 Privacy Export & Full Erasure.
//
// Hai năng lực theo kiến trúc mục 18 (Privacy Controls):
//
//   1. exportPersonData(pool, personId) — gom MỌI dữ liệu gắn với Person (mọi bảng có cột
//      `person_id`) thành một bản xuất có cấu trúc: "Đồng Hành biết gì về tôi?" + mang dữ liệu đi.
//
//   2. erasePersonData(pool, personId, erasedBy) — xoá sạch mọi bảng đó trong MỘT transaction,
//      ghi một dòng nhật ký xoá (append-only), trả số bản ghi đã xoá.
//
// BẤT BIẾN:
//   - Danh sách bảng là MỘT nguồn duy nhất (`PERSON_TABLES`): xuất và xoá luôn phủ cùng một tập
//     bảng, không thể "xuất có mà xoá sót" hay ngược lại.
//   - Xoá là nguyên tử: một câu lỗi ⇒ rollback toàn bộ, không xoá dở dang.
//   - KHÔNG nuốt lỗi: trước 2026-10-08 có `.catch(() => ({ rows: [] }))` ⇒ bản xuất có thể im lặng
//     thiếu dữ liệu; lỗi thật giờ nổi lên thành 500 (changelog 0527).
//   - Nhật ký xoá (`platform.person_erasure_log`) KHÔNG bao giờ bị xoá — nó là vết kiểm toán.
//   - personId do nơi gọi suy từ token (`/api/persons`), không bao giờ nhận từ client.
//
// Phạm vi: dữ liệu Personal OS gắn với `personal.persons.id`. Dữ liệu tài khoản gắn thẳng với
// `user_id` (tiến độ học, thanh toán, `personal.intake`, `personal.learner_intent`…) KHÔNG thuộc
// thao tác này — xem changelog 0527 mục "Ngoài phạm vi".

import type { Pool, PoolClient } from 'pg'
import { withTransaction } from '@dhcb/core-db/transaction'
import { NotFoundError } from '@dhcb/core-errors/appError'

// ─── Danh sách bảng (nguồn sự thật duy nhất) ─────────────────────────────────

interface PersonTableSpec {
  /** Tên trường trong JSON xuất. */
  readonly exportKey: string
  /** `schema.bảng` — hằng trong code, không bao giờ từ người dùng. */
  readonly table: string
  /** Cột xuất ra — liệt kê tường minh để một cột mới (vd bí mật mã hoá) không tự lọt ra ngoài. */
  readonly columns: readonly string[]
  readonly orderBy: string
}

/**
 * Mọi bảng chứa dữ liệu theo `person_id` (đối chiếu schema thật sau migration 0087).
 *
 * THỨ TỰ = THỨ TỰ XOÁ: bảng con trước bảng cha, vì vài khoá ngoại KHÔNG cascade:
 *   - life_graph_edges / life_goals → life_graph_nodes (khoá kép (id, person_id), không cascade)
 *   - tool_execution_audit_log → proposed_actions (set null — xoá trước cho gọn)
 *   - worklife.tasks / documents → worklife.projects (set null)
 * `personal.memory_records_audit_log` KHÔNG có khoá ngoại nào ⇒ chỉ xoá được bằng câu tường minh.
 */
export const PERSON_TABLES = [
  {
    exportKey: 'actionReceipts',
    table: 'personal.action_receipts',
    columns: [
      'id',
      'grant_id',
      'capability_id',
      'action',
      'idempotency_key',
      'trigger_source',
      'input_payload',
      'execution_result',
      'status',
      'retry_count',
      'duration_ms',
      'error_message',
      'compensation_result',
      'created_at',
    ],
    orderBy: 'created_at, id',
  },
  {
    exportKey: 'automationGrants',
    table: 'personal.automation_grants',
    columns: [
      'id',
      'name',
      'description',
      'capability_id',
      'action',
      'target_domain',
      'trigger_config',
      'budget_config',
      'compensation_config',
      'status',
      'version',
      'review_at',
      'expires_at',
      'created_at',
      'updated_at',
      'revoked_at',
    ],
    orderBy: 'created_at, id',
  },
  {
    exportKey: 'toolExecutionAuditLog',
    table: 'personal.tool_execution_audit_log',
    columns: [
      'id',
      'tool_id',
      'proposed_action_id',
      'input_payload',
      'output_payload',
      'status',
      'duration_ms',
      'error_message',
      'executed_at',
    ],
    orderBy: 'executed_at, id',
  },
  {
    exportKey: 'proposedActions',
    table: 'personal.proposed_actions',
    columns: [
      'id',
      'capability_id',
      'action',
      'target_domain',
      'payload',
      'risk_level',
      'status',
      'version',
      'created_at',
      'resolved_at',
      'resolved_by',
      'execution_result',
    ],
    orderBy: 'created_at, id',
  },
  {
    exportKey: 'lifeGoalSources',
    table: 'personal.life_goal_sources',
    columns: ['goal_id', 'source_domain', 'source_type', 'source_id', 'created_at'],
    orderBy: 'created_at, goal_id',
  },
  {
    exportKey: 'lifeGoals',
    table: 'personal.life_goals',
    columns: [
      'id',
      'node_id',
      'label',
      'status',
      'target_date',
      'version',
      'created_at',
      'updated_at',
    ],
    orderBy: 'created_at, id',
  },
  {
    exportKey: 'lifeGraphEdges',
    table: 'personal.life_graph_edges',
    columns: [
      'id',
      'from_node_id',
      'to_node_id',
      'relation',
      'provenance',
      'version',
      'created_at',
      'archived_at',
    ],
    orderBy: 'created_at, id',
  },
  {
    exportKey: 'lifeGraphAuditLog',
    table: 'personal.life_graph_audit_log',
    columns: [
      'id',
      'entity_type',
      'entity_id',
      'action',
      'before_data',
      'after_data',
      'created_at',
    ],
    orderBy: 'created_at, id',
  },
  {
    exportKey: 'lifeGraphNodes',
    table: 'personal.life_graph_nodes',
    columns: ['id', 'type', 'label', 'version', 'created_at', 'updated_at', 'archived_at'],
    orderBy: 'created_at, id',
  },
  {
    exportKey: 'memoryAuditLog',
    table: 'personal.memory_records_audit_log',
    columns: ['id', 'record_id', 'action', 'changes', 'changed_by', 'audited_at'],
    orderBy: 'audited_at, id',
  },
  {
    exportKey: 'memories',
    table: 'personal.memory_records',
    columns: [
      'id',
      'namespace',
      'content',
      'provenance',
      'sensitivity',
      'status',
      'merged_from_id',
      'version',
      'created_at',
      'updated_at',
      'retain_until',
    ],
    orderBy: 'created_at, id',
  },
  {
    exportKey: 'personalFacts',
    table: 'personal.personal_facts',
    columns: [
      'id',
      'namespace',
      'key',
      'value',
      'origin',
      'confidence',
      'source',
      'sensitivity',
      'created_at',
      'updated_at',
      'last_confirmed_at',
      'expires_at',
      'supersedes',
      'is_current',
    ],
    orderBy: 'created_at, id',
  },
  {
    exportKey: 'decisionReviewsAuditLog',
    table: 'personal.decision_reviews_audit_log',
    columns: ['id', 'decision_id', 'actor', 'action', 'details', 'created_at'],
    orderBy: 'created_at, id',
  },
  {
    exportKey: 'decisionRecords',
    table: 'personal.decision_records',
    columns: [
      'id',
      'problem',
      'domain',
      'options',
      'assumptions',
      'evidence',
      'tradeoffs',
      'selected_option_id',
      'rationale',
      'expected_outcomes',
      'actual_outcomes',
      'status',
      'review_at',
      'version',
      'created_at',
      'updated_at',
    ],
    orderBy: 'created_at, id',
  },
  {
    exportKey: 'companionMessages',
    table: 'personal.companion_messages',
    columns: ['id', 'role', 'content', 'domain', 'intent', 'sensitivity', 'created_at'],
    orderBy: 'created_at, id',
  },
  {
    exportKey: 'personalPolicies',
    table: 'personal.personal_policies',
    columns: [
      'id',
      'subject',
      'action',
      'resource_scope',
      'authority',
      'purpose',
      'created_at',
      'review_at',
      'revoked_at',
    ],
    orderBy: 'created_at, id',
  },
  {
    exportKey: 'consentGrants',
    table: 'personal.consent_grants',
    columns: [
      'id',
      'scope',
      'purpose',
      'version',
      'status',
      'granted_at',
      'expires_at',
      'revoked_at',
    ],
    orderBy: 'granted_at, id',
  },
  {
    exportKey: 'workTasks',
    table: 'worklife.tasks',
    columns: [
      'id',
      'project_id',
      'title',
      'priority',
      'status',
      'due_at',
      'created_at',
      'updated_at',
      'version',
    ],
    orderBy: 'created_at, id',
  },
  {
    exportKey: 'workDocuments',
    table: 'worklife.documents',
    columns: [
      'id',
      'project_id',
      'title',
      'document_type',
      'summary',
      'content_uri',
      'created_at',
      'updated_at',
      'version',
    ],
    orderBy: 'created_at, id',
  },
  {
    exportKey: 'workMeetings',
    table: 'worklife.meetings',
    columns: [
      'id',
      'title',
      'scheduled_at',
      'duration_minutes',
      'summary',
      'action_items',
      'created_at',
    ],
    orderBy: 'created_at, id',
  },
  {
    exportKey: 'workProjects',
    table: 'worklife.projects',
    columns: [
      'id',
      'name',
      'description',
      'status',
      'deadline',
      'created_at',
      'updated_at',
      'version',
    ],
    orderBy: 'created_at, id',
  },
] as const satisfies readonly PersonTableSpec[]

/** Bảng gốc — xoá CUỐI CÙNG (mọi bảng trên tham chiếu nó). */
const PERSONS_TABLE = 'personal.persons'

type PersonTable = (typeof PERSON_TABLES)[number]
export type PersonExportKey = PersonTable['exportKey']

/** Một dòng xuất: tên cột thật ⇒ giá trị (timestamp là `Date`, ra JSON thành chuỗi ISO 8601). */
export type ExportRow = Record<string, unknown>

export interface PersonRow {
  id: string
  user_id: string
  display_name: string
  created_at: Date
  updated_at: Date
}

export type PersonExportData = {
  exportedAt: string
  personId: string
  person: PersonRow | null
} & { [K in PersonExportKey]: ExportRow[] }

export interface ErasePersonResult {
  personId: string
  /** Mọi bảng đã được dọn (kể cả bảng vốn không có dòng nào của người này). */
  schemasCleared: string[]
  recordsDeletedCount: number
  erasureLogId: string
}

// ─── An toàn định danh SQL ────────────────────────────────────────────────────

// Xuất ra để `accountErasureService.ts` (cùng gói) dùng CHUNG đúng bộ kiểm này — không chép lại.
export const QUALIFIED_IDENT = /^[a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*$/
export const IDENT = /^[a-z_][a-z0-9_]*$/

/**
 * Tên bảng/cột KHÔNG tham số hoá được bằng $1 (Postgres chỉ nhận tham số ở vị trí GIÁ TRỊ) nên
 * phải nối chuỗi. Mọi giá trị hiện là hằng trong code; chặn ngay đây để một lần sửa sau này lỡ
 * nối biến từ người dùng vào là NỔ NGAY thay vì thành lỗ SQL injection im lặng (audit 2026-08-24, F9).
 */
export function assertIdent(value: string, pattern: RegExp): string {
  if (!pattern.test(value)) throw new Error(`Định danh SQL không hợp lệ: ${JSON.stringify(value)}`)
  return value
}

/** `created_at, id` → kiểm từng cột. */
export function assertOrderBy(value: string): string {
  for (const col of value.split(',')) assertIdent(col.trim(), IDENT)
  return value
}

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Đọc toàn bộ dữ liệu của personId bằng `client` ĐANG Ở TRONG một transaction do nơi gọi mở.
 *
 * Tách riêng (2026-10-08, changelog 0533) để xuất dữ liệu TÀI KHOẢN (`accountErasureService`)
 * đọc Personal OS trong CÙNG ảnh chụp với các bảng theo `user_id`. Hàm này KHÔNG tự đặt mức cô
 * lập — nơi gọi phải `set transaction isolation level repeatable read, read only` ngay câu đầu.
 */
export async function readPersonDataWith(
  client: PoolClient,
  personId: string,
): Promise<PersonExportData> {
  const personRes = await client.query<PersonRow>(
    `select id, user_id, display_name, created_at, updated_at
       from ${PERSONS_TABLE} where id = $1`,
    [personId],
  )

  const sections: Partial<Record<PersonExportKey, ExportRow[]>> = {}
  for (const spec of PERSON_TABLES) {
    const table = assertIdent(spec.table, QUALIFIED_IDENT)
    const cols = spec.columns.map((c) => assertIdent(c, IDENT)).join(', ')
    const res = await client.query<ExportRow>(
      `select ${cols} from ${table} where person_id = $1 order by ${assertOrderBy(spec.orderBy)}`,
      [personId],
    )
    sections[spec.exportKey] = res.rows
  }

  return {
    exportedAt: new Date().toISOString(),
    personId,
    person: personRes.rows[0] ?? null,
    ...(sections as Record<PersonExportKey, ExportRow[]>),
  }
}

/**
 * Gom toàn bộ dữ liệu cá nhân của personId. Bất kỳ câu nào lỗi ⇒ NÉM lỗi (không trả bản xuất
 * thiếu). Nơi gọi phải xác thực và suy personId từ token trước.
 */
export async function exportPersonData(pool: Pool, personId: string): Promise<PersonExportData> {
  // MỘT transaction `repeatable read, read only` ⇒ bản xuất là một ảnh chụp nhất quán (không lẫn
  // trạng thái trước/sau một lần ghi xen giữa), và không thể vô tình ghi.
  return withTransaction(pool, async (client) => {
    await beginReadOnlySnapshot(client)
    return readPersonDataWith(client, personId)
  })
}

/**
 * Câu ĐẦU của một transaction xuất dữ liệu: `repeatable read, read only` ⇒ ảnh chụp nhất quán và
 * không thể vô tình ghi. Dùng chung cho xuất Person (0527) và xuất tài khoản (0533) — một chỗ
 * duy nhất, cũng là chỗ duy nhất được miễn trong `scripts/sql-prepare-allowlist.json`.
 */
export async function beginReadOnlySnapshot(client: PoolClient): Promise<void> {
  await client.query('set transaction isolation level repeatable read, read only')
}

// ─── Erase ────────────────────────────────────────────────────────────────────

/**
 * Xoá nguyên tử mọi dữ liệu của personId, ghi nhật ký xoá (append-only), trả tóm tắt.
 *
 *   - Nơi gọi phải xác minh quyền sở hữu (chính chủ hoặc admin).
 *   - Khoá dòng Person (`for update`) NGAY đầu transaction: mọi lệnh insert vào bảng con phải
 *     lấy khoá `key share` trên dòng này để kiểm khoá ngoại ⇒ bị chặn tới khi xoá xong, nên
 *     không có bản ghi mới lọt vào giữa chừng rồi sống sót.
 *   - Một câu lỗi ⇒ rollback toàn bộ, lỗi được ném lên (không có `.catch` nuốt lỗi — trong
 *     Postgres, sau một câu lỗi transaction đã bị huỷ, nuốt lỗi chỉ làm câu sau lỗi khó hiểu hơn).
 */
export async function erasePersonData(
  pool: Pool,
  personId: string,
  erasedBy: string,
): Promise<ErasePersonResult> {
  return withTransaction(pool, (client) => erasePersonDataWith(client, personId, erasedBy))
}

/**
 * Như `erasePersonData` nhưng chạy trên `client` ĐANG Ở TRONG transaction của nơi gọi — để xoá
 * tài khoản (`accountErasureService.deleteAccount`) gộp Personal OS vào CÙNG một transaction với
 * mọi bảng theo `user_id`: lỗi ở bất kỳ đâu ⇒ rollback cả hai phần (changelog 0533).
 */
export async function erasePersonDataWith(
  client: PoolClient,
  personId: string,
  erasedBy: string,
): Promise<ErasePersonResult> {
  const personCheck = await client.query<{ id: string }>(
    `select id from ${PERSONS_TABLE} where id = $1 for update`,
    [personId],
  )
  if (!personCheck.rows[0]) {
    throw new NotFoundError('Person not found')
  }

  const schemasCleared: string[] = []
  let totalDeleted = 0

  async function deleteFrom(table: string, column: 'person_id' | 'id'): Promise<void> {
    const safeTable = assertIdent(table, QUALIFIED_IDENT)
    const res = await client.query(`delete from ${safeTable} where ${column} = $1`, [personId])
    totalDeleted += res.rowCount ?? 0
    schemasCleared.push(table)
  }

  for (const spec of PERSON_TABLES) await deleteFrom(spec.table, 'person_id')
  // Bảng gốc cuối cùng.
  await deleteFrom(PERSONS_TABLE, 'id')

  const logRes = await client.query<{ id: string }>(
    `insert into platform.person_erasure_log
       (person_id, erased_at, erased_by, schemas_cleared, records_deleted_count)
     values ($1, now(), $2, $3, $4)
     returning id`,
    [personId, erasedBy, schemasCleared, totalDeleted],
  )
  const erasureLogId = logRes.rows[0]?.id
  if (!erasureLogId) throw new Error('Không ghi được nhật ký xoá dữ liệu (person_erasure_log)')

  return { personId, schemasCleared, recordsDeletedCount: totalDeleted, erasureLogId }
}
