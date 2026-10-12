// packages/core-personal/policyService.ts — PersonalPolicy service (V2-04 slice 1,
// docs/architecture-v2/21-ROADMAP.md mục "V2-04" + 02-SYSTEM-ARCHITECTURE.md mục 7).
//
// PersonalPolicy = mức THẨM QUYỀN hệ thống được phép hành động thay người dùng trên một
// (subject, action, resourceScope): READ < SUGGEST < DRAFT < WRITE_INTERNAL <
// EXECUTE_WITH_CONFIRMATION < AUTOMATE, cùng mức chặn tuyệt đối DENY.
//
// NHẮC LẠI PRIORITY CHAIN (mục 7) — policy cá nhân KHÔNG đứng đầu:
//   security/law > authorization > domain invariant > explicit consent > personal policy >
//   workflow policy > agent proposal > LLM wording
// Nghĩa là `resolveAuthority` trả 'AUTOMATE' KHÔNG có nghĩa "cứ thế mà chạy": tầng gọi vẫn phải
// qua các cửa đứng trước (consent, domain invariant...). Module này chỉ trả lời đúng một câu:
// "người dùng đã tự đặt mức thẩm quyền nào cho việc này?".
//
// Cùng khuôn append-only + ownership-trong-SQL như `personService.ts`/`consentService.ts`: sửa
// policy = revoke bản cũ + insert bản mới, không update giá trị nghiệp vụ, không delete dòng.

import type { Pool, PoolClient } from 'pg'
import { withTransaction } from '@dhcb/core-db/transaction'
import { ConflictError, NotFoundError } from '@dhcb/core-errors/appError'
import {
  PersonalPolicySchema,
  AuthorityLevelSchema,
  PERSONAL_POLICY_SCHEMA_VERSION,
  type PersonalPolicy,
  type AuthorityLevel,
} from '@dhcb/core-contracts/personalPolicy'

interface PolicyRow {
  id: string
  person_id: string
  subject: string
  action: string
  resource_scope: string
  authority: string
  purpose: string
  created_at: Date
  review_at: Date | null
  revoked_at: Date | null
}

const POLICY_COLUMNS = `id, person_id, subject, action, resource_scope, authority, purpose,
  created_at, review_at, revoked_at`

function toPolicy(row: PolicyRow): PersonalPolicy {
  return PersonalPolicySchema.parse({
    id: row.id,
    personId: row.person_id,
    subject: row.subject,
    action: row.action,
    resourceScope: row.resource_scope,
    authority: row.authority,
    purpose: row.purpose,
    createdAt: row.created_at.toISOString(),
    ...(row.review_at ? { reviewAt: row.review_at.toISOString() } : {}),
    ...(row.revoked_at ? { revokedAt: row.revoked_at.toISOString() } : {}),
    schemaVersion: PERSONAL_POLICY_SCHEMA_VERSION,
  })
}

export interface SetPolicyInput {
  personId: string
  subject: string
  action: string
  resourceScope: string
  authority: AuthorityLevel
  purpose: string
  /** ISO datetime. BẮT BUỘC khi `authority = 'AUTOMATE'` (mục 7: quyền tự động phải có review). */
  reviewAt?: string
}

/** Khoá row policy đang hiệu lực của (person, subject, action, resourceScope) — chống hai request
 * cùng đặt policy một lúc khi ĐÃ có bản hiệu lực. Chưa có bản nào thì không có gì để khoá: ca đó
 * do chỉ mục duy nhất của 0042 chặn, `setPolicy` đổi lỗi thành 409 (changelog 0625). */
async function lockActivePolicy(
  client: PoolClient,
  input: SetPolicyInput,
): Promise<PolicyRow | undefined> {
  const res = await client.query<PolicyRow>(
    `select ${POLICY_COLUMNS} from personal.personal_policies
      where person_id = $1 and subject = $2 and action = $3 and resource_scope = $4
        and revoked_at is null
      for update`,
    [input.personId, input.subject, input.action, input.resourceScope],
  )
  return res.rows[0]
}

/** Lỗi unique_violation (23505) đúng ở chỉ mục "một policy hiệu lực mỗi bộ ba" của migration 0042. */
function isActivePolicyConflict(err: unknown): boolean {
  const e = err as { code?: unknown; constraint?: unknown } | null
  return e?.code === '23505' && e.constraint === 'idx_personal_policies_active'
}

/**
 * Đặt policy cho (subject, action, resourceScope). Đã có bản đang hiệu lực → thu hồi bản đó rồi
 * INSERT bản mới (append, giữ lịch sử "trước đây tôi từng cho phép tới mức nào").
 *
 * Ràng buộc "AUTOMATE phải có reviewAt" KHÔNG kiểm lại ở đây một cách thủ công: nó đã được
 * enforce hai lớp — Zod `.refine()` ở contract (API parse trước khi gọi vào đây) và `check`
 * constraint của bảng (migration 0042). Nhân đôi lần thứ ba chỉ tạo thêm chỗ để lệch nhau.
 */
export async function setPolicy(pool: Pool, input: SetPolicyInput): Promise<PersonalPolicy> {
  return withTransaction(pool, async (client) => {
    const current = await lockActivePolicy(client, input)

    if (current) {
      await client.query('update personal.personal_policies set revoked_at = now() where id = $1', [
        current.id,
      ])
    }

    let res
    try {
      res = await client.query<PolicyRow>(
        `insert into personal.personal_policies
           (person_id, subject, action, resource_scope, authority, purpose, review_at)
         values ($1, $2, $3, $4, $5, $6, $7)
         returning ${POLICY_COLUMNS}`,
        [
          input.personId,
          input.subject,
          input.action,
          input.resourceScope,
          input.authority,
          input.purpose,
          input.reviewAt ?? null,
        ],
      )
    } catch (err) {
      // `for update` ở trên chỉ khoá được khi ĐÃ có dòng hiệu lực. Chưa có thì hai lần đặt đồng
      // thời cùng insert và chỉ mục duy nhất `idx_personal_policies_active` chặn một bên (đo trên
      // Postgres thật — changelog 0625). Bên thua nhận 409 "thử lại" thay vì 500.
      if (isActivePolicyConflict(err)) {
        throw new ConflictError('Policy vừa được đặt bởi thao tác khác, thử lại')
      }
      throw err
    }
    const row = res.rows[0]
    if (!row) throw new ConflictError('Không ghi được policy, thử lại')
    return toPolicy(row)
  })
}

export interface ListPoliciesOptions {
  /** true = trả cả bản đã bị thu hồi/thay thế (dùng cho audit/export). */
  includeHistory?: boolean
  subject?: string
}

export async function listPolicies(
  pool: Pool,
  personId: string,
  opts: ListPoliciesOptions = {},
): Promise<PersonalPolicy[]> {
  const conditions = ['person_id = $1']
  const params: unknown[] = [personId]
  if (!opts.includeHistory) conditions.push('revoked_at is null')
  if (opts.subject) {
    params.push(opts.subject)
    conditions.push(`subject = $${params.length}`)
  }
  const res = await pool.query<PolicyRow>(
    `select ${POLICY_COLUMNS} from personal.personal_policies
      where ${conditions.join(' and ')}
      order by created_at asc, id asc`,
    params,
  )
  return res.rows.map(toPolicy)
}

/**
 * Thu hồi policy — xoá mềm (set `revoked_at`), giữ dòng để audit.
 * Cùng quy ước lỗi với `revokeConsent`: không thấy/không phải chủ → 404; đã thu hồi rồi → 409.
 */
export async function revokePolicy(pool: Pool, personId: string, policyId: string): Promise<void> {
  await withTransaction(pool, async (client) => {
    const res = await client.query<PolicyRow>(
      `select ${POLICY_COLUMNS} from personal.personal_policies
        where id = $1 and person_id = $2
        for update`,
      [policyId, personId],
    )
    const current = res.rows[0]
    if (!current) throw new NotFoundError('Không tìm thấy policy')
    if (current.revoked_at) {
      throw new ConflictError('Policy đã được thu hồi hoặc thay thế bởi thao tác khác')
    }
    await client.query('update personal.personal_policies set revoked_at = now() where id = $1', [
      current.id,
    ])
  })
}

/**
 * ĐIỂM NỐI TƯƠNG LAI (V2-07 Context Builder / V2-08 tool execution): tra mức thẩm quyền người
 * dùng đã đặt cho đúng bộ ba (subject, action, resourceScope).
 *
 * Trả `null` khi CHƯA có policy nào — cố ý KHÔNG tự suy ra mức mặc định ở đây. Mặc định an toàn
 * là quyết định của tầng gọi (mỗi loại tool có mức đáy khác nhau), và trộn hai việc đó vào một
 * hàm sẽ khiến "chưa cấu hình" không phân biệt được với "đã cấu hình đúng mức đó".
 *
 * AUTOMATE đã quá `review_at` → trả 'EXECUTE_WITH_CONFIRMATION' (changelog 0627, chủ dự án chốt
 * 2026-10-12): mục 7 bắt quyền tự động "phải có expiry/review", nhưng trước đây không chỗ nào đọc
 * `review_at` nên AUTOMATE có hiệu lực vĩnh viễn. Hạ mức thay vì coi như không có policy: người
 * dùng vẫn được đề xuất, chỉ là phải bấm xác nhận — cho tới khi họ đặt lại policy. Không đụng dòng
 * trong CSDL (policy append-only). So bằng `now()` của Postgres để mọi tầng dùng chung một đồng hồ.
 */
export async function resolveAuthority(
  pool: Pool,
  personId: string,
  subject: string,
  action: string,
  resourceScope: string,
): Promise<AuthorityLevel | null> {
  const res = await pool.query<{ authority: string; review_due: boolean }>(
    `select authority, (review_at is not null and review_at <= now()) as review_due
       from personal.personal_policies
      where person_id = $1 and subject = $2 and action = $3 and resource_scope = $4
        and revoked_at is null
      limit 1`,
    [personId, subject, action, resourceScope],
  )
  const row = res.rows[0]
  if (!row) return null
  // Parse qua Zod: giá trị lạ trong DB (migration tay, dữ liệu cũ) không được lọt ra ngoài dưới
  // dạng AuthorityLevel giả — thà ném lỗi còn hơn cấp nhầm quyền.
  const authority = AuthorityLevelSchema.parse(row.authority)
  return authority === 'AUTOMATE' && row.review_due === true
    ? 'EXECUTE_WITH_CONFIRMATION'
    : authority
}
