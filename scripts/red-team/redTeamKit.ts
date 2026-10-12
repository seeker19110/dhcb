// scripts/red-team/redTeamKit.ts — Đồ nghề dùng chung cho các ca red-team (gieo dữ liệu + quan sát).
//
// Nguyên tắc (docs/ops/ai-eval-red-team.md §3, đặc tả docs/specs/2026-10-12-red-team-eval-that.md):
//   - Gieo dữ liệu bằng CHÍNH hàm dịch vụ của sản phẩm, không INSERT tay vào bảng nghiệp vụ — để
//     dữ liệu đi qua đúng ràng buộc như production. Ngoại lệ có ghi lý do tại chỗ (vd lùi mốc thời
//     gian về quá khứ, việc mà API cố ý không cho làm).
//   - Quan sát bằng thứ ĐỘC LẬP với mã đang bị kiểm: số dòng thật trong CSDL, lỗi thật bị ném,
//     chuỗi canary ngẫu nhiên có/không trong ngữ cảnh.
import { randomBytes, randomUUID } from 'node:crypto'
import type { Pool } from 'pg'
import type { RedTeamFamily, RedTeamOutcome } from '../lib/redTeamScoring'
import { getOrCreatePerson } from '@dhcb/core-personal/personService'
import { grantConsent } from '@dhcb/core-personal/consentService'
import {
  COMPANION_CONSENT_PURPOSE,
  COMPANION_CONSENT_SCOPES,
} from '@dhcb/core-contracts/consentGrant'

/** Email của người dùng giả — đuôi `.invalid` (RFC 2606) không bao giờ là địa chỉ thật. */
export const RED_TEAM_EMAIL_DOMAIN = 'red-team.invalid'

export interface RedTeamPerson {
  userId: string
  personId: string
}

export interface RedTeamContext {
  pool: Pool
  /** Tạo một người dùng giả mới (user + person) — mỗi ca dùng người riêng, không dính trạng thái. */
  newPerson(): Promise<RedTeamPerson>
}

/** Một ca red-team. Đặt ở đây (không ở `redTeamCases.ts`) để file họ ca tách riêng như
 *  `redTeamAgentCases.ts` không phải import ngược `redTeamCases.ts` — tránh chu trình import. */
export interface RedTeamCase {
  id: string
  family: RedTeamFamily
  title: string
  run(ctx: RedTeamContext): Promise<RedTeamOutcome>
}

export function createContext(pool: Pool): RedTeamContext {
  return {
    pool,
    async newPerson() {
      const userId = randomUUID()
      await pool.query(`insert into public.users (id, email) values ($1, $2)`, [
        userId,
        `rt-${userId}@${RED_TEAM_EMAIL_DOMAIN}`,
      ])
      const person = await getOrCreatePerson(pool, userId)
      return { userId, personId: person.id }
    },
  }
}

/** Xoá mọi người dùng giả (cascade sang persons và toàn bộ dữ liệu cá nhân). */
export async function cleanupRedTeamUsers(pool: Pool): Promise<number> {
  const res = await pool.query(`delete from public.users where email like $1`, [
    `rt-%@${RED_TEAM_EMAIL_DOMAIN}`,
  ])
  return res.rowCount ?? 0
}

/**
 * Chuỗi canary: một "từ" chữ+số duy nhất, để (1) không thể có sẵn ở đâu khác và (2) bộ tìm kiếm
 * chữ (tsquery) coi là một token — ca rò rỉ hỏi đúng từ này để ký ức chắc chắn được TRUY XUẤT nếu
 * không có lớp phòng thủ nào chặn.
 */
export function newCanary(): string {
  return `rtcanary${randomBytes(6).toString('hex')}`
}

/** Cấp consent Companion đọc ký ức/hồ sơ và/hoặc lịch sử — đúng hai scope mà API cấp được. */
export async function grantCompanionConsent(
  pool: Pool,
  personId: string,
  scopes: ReadonlyArray<keyof typeof COMPANION_CONSENT_SCOPES> = ['memory'],
): Promise<string[]> {
  const ids: string[] = []
  for (const scope of scopes) {
    const grant = await grantConsent(pool, {
      personId,
      scope: COMPANION_CONSENT_SCOPES[scope],
      purpose: COMPANION_CONSENT_PURPOSE,
    })
    ids.push(grant.id)
  }
  return ids
}

/** Bảng chỉ GHI LẠI đề xuất/nhật ký — không phải dữ liệu về con người, loại khỏi bộ đếm. */
const NON_DATA_TABLES = new Set(['personal.proposed_actions', 'personal.tool_execution_audit_log'])

/**
 * Ảnh chụp số dòng của MỘT người ở mọi bảng có cột `person_id` trong schema `personal`/`worklife`.
 * Dò bảng qua information_schema thay vì liệt kê tay: bảng mới thêm sau này tự được phủ, không ai
 * phải nhớ cập nhật danh sách ở đây.
 */
export async function snapshotPersonRows(
  pool: Pool,
  personId: string,
): Promise<Map<string, number>> {
  const { rows: tables } = await pool.query<{ table_schema: string; table_name: string }>(
    `select c.table_schema, c.table_name
       from information_schema.columns c
       join information_schema.tables t
         on t.table_schema = c.table_schema and t.table_name = c.table_name
      where c.column_name = 'person_id'
        and c.table_schema in ('personal', 'worklife')
        and t.table_type = 'BASE TABLE'
      order by 1, 2`,
  )
  const counts = new Map<string, number>()
  for (const { table_schema: schema, table_name: name } of tables) {
    const key = `${schema}.${name}`
    if (NON_DATA_TABLES.has(key)) continue
    // Tên bảng lấy từ information_schema (không phải từ input), đặt trong dấu nháy kép.
    const res = await pool.query<{ n: string }>(
      `select count(*)::text as n from "${schema}"."${name}" where person_id = $1`,
      [personId],
    )
    counts.set(key, Number(res.rows[0]?.n ?? 0))
  }
  return counts
}

/** Các bảng có số dòng THAY ĐỔI giữa hai ảnh chụp, dạng `bảng: trước→sau`. */
export function diffSnapshots(before: Map<string, number>, after: Map<string, number>): string[] {
  const changed: string[] = []
  for (const [table, n] of after) {
    const prev = before.get(table) ?? 0
    if (prev !== n) changed.push(`${table}: ${prev}→${n}`)
  }
  return changed
}

/**
 * Chạy `fn` và trả về lỗi nó ném ra (hoặc `null` nếu không ném). Ca red-team dùng để kiểm lớp
 * phòng thủ có TỪ CHỐI thật không — và từ chối bằng ĐÚNG loại lỗi mong đợi (403 khác 404 khác 500).
 */
export async function captureError(fn: () => Promise<unknown>): Promise<Error | null> {
  try {
    await fn()
    return null
  } catch (err) {
    return err instanceof Error ? err : new Error(String(err))
  }
}

/** Mô tả ngắn một lỗi cho cột bằng chứng: `TênLớp: thông điệp`. */
export function describeError(err: Error | null): string {
  if (!err) return 'không ném lỗi'
  return `${err.constructor.name}: ${err.message.slice(0, 120)}`
}

/** Mốc ISO cách hiện tại `days` ngày (âm = quá khứ). */
export function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString()
}
