// packages/core-personal/companionMessageService.ts — Đọc/ghi hội thoại với Bạn Đồng Hành AI
// (bảng `personal.companion_messages`, migration 0067).
//
// Trước đây hội thoại chỉ sống trong bộ nhớ trình duyệt nên đóng trang là mất, và LLM chỉ nhận
// đúng một tin nhắn mỗi lượt. File này là nơi DUY NHẤT chạm vào bảng đó.
import type { Pool, PoolClient } from 'pg'
import { SensitivitySchema, type Sensitivity } from '@dhcb/core-contracts/personalFact'

/** Giới hạn cứng số tin nạp vào prompt gửi LLM — mỗi tin thêm vào là thêm tiền token mỗi lượt. */
export const COMPANION_HISTORY_TURNS = 10

/** Giới hạn số tin trả về giao diện khi mở lại trang. */
export const COMPANION_HISTORY_PAGE_SIZE = 50

export type CompanionMessageRole = 'user' | 'companion'

export interface CompanionMessage {
  id: string
  role: CompanionMessageRole
  content: string
  domain?: string
  intent?: string
  sensitivity?: Sensitivity
  createdAt: string
}

interface MessageRow {
  id: string
  role: string
  content: string
  domain: string | null
  intent: string | null
  created_at: Date
  sensitivity?: string
}

const MESSAGE_COLUMNS = 'id, role, content, domain, intent, created_at, sensitivity'

function toMessage(row: MessageRow): CompanionMessage {
  return {
    id: row.id,
    // Giá trị lạ trong DB không được lọt ra ngoài dưới dạng role giả — cột đã có CHECK constraint,
    // đây là lưới an toàn thứ hai cho dữ liệu ghi tay.
    role: row.role === 'user' ? 'user' : 'companion',
    content: row.content,
    ...(row.domain ? { domain: row.domain } : {}),
    ...(row.intent ? { intent: row.intent } : {}),
    createdAt: row.created_at.toISOString(),
    sensitivity: SensitivitySchema.safeParse(row.sensitivity).data ?? 'sensitive',
  }
}

export interface AppendCompanionMessageInput {
  personId: string
  role: CompanionMessageRole
  content: string
  domain?: string
  intent?: string
  sensitivity?: Sensitivity
}

/**
 * Ghi một tin nhắn vào lịch sử hội thoại.
 *
 * Cột `content` có CHECK độ dài 1–8000; nội dung dài hơn bị CẮT thay vì ném lỗi — mất một đoạn
 * đuôi của bản ghi lưu trữ vẫn hơn là làm hỏng cả lượt trả lời mà người dùng đang chờ.
 */
export async function appendCompanionMessage(
  runner: Pick<Pool | PoolClient, 'query'>,
  input: AppendCompanionMessageInput,
): Promise<CompanionMessage> {
  const content = input.content.trim().slice(0, 8000)
  if (!content) {
    throw new Error('Nội dung tin nhắn rỗng — không ghi vào lịch sử hội thoại')
  }

  const res = await runner.query<MessageRow>(
    `insert into personal.companion_messages (person_id, role, content, domain, intent, sensitivity)
     values ($1, $2, $3, $4, $5, $6)
     returning ${MESSAGE_COLUMNS}`,
    [
      input.personId,
      input.role,
      content,
      input.domain ?? null,
      input.intent ?? null,
      input.sensitivity ?? 'sensitive',
    ],
  )
  const row = res.rows[0]
  if (!row) throw new Error('Không ghi được tin nhắn Companion')
  return toMessage(row)
}

/**
 * Lấy các tin nhắn gần nhất, trả về theo thứ tự CŨ → MỚI (đúng thứ tự đọc và đúng thứ tự cần
 * đưa vào prompt LLM). Truy vấn lấy mới nhất trước rồi đảo lại, để dùng được index có sẵn.
 */
export async function listRecentCompanionMessages(
  runner: Pick<Pool | PoolClient, 'query'>,
  personId: string,
  limit = COMPANION_HISTORY_PAGE_SIZE,
  domain?: string,
  maxSensitivity?: Sensitivity,
): Promise<CompanionMessage[]> {
  const safeLimit = Math.min(200, Math.max(1, Math.trunc(limit)))
  const params: unknown[] = [personId, safeLimit]
  const conditions = ['person_id = $1']
  if (domain !== undefined) {
    params.push(domain)
    conditions.push(`domain = $${params.length}`)
  }
  if (maxSensitivity !== undefined) {
    const levels: Sensitivity[] = ['public', 'personal', 'sensitive', 'restricted']
    params.push(levels.slice(0, levels.indexOf(maxSensitivity) + 1))
    conditions.push(`sensitivity = any($${params.length}::text[])`)
  }
  const res = await runner.query<MessageRow>(
    `select ${MESSAGE_COLUMNS} from personal.companion_messages
     where ${conditions.join(' and ')}
     order by created_at desc, id desc
     limit $2`,
    params,
  )
  return res.rows.map(toMessage).reverse()
}

/**
 * Chuyển lịch sử sang định dạng messages của nhà cung cấp LLM ('user' | 'assistant').
 *
 * Cắt mỗi tin về tối đa 1500 ký tự: một câu trả lời dài của AI có thể chiếm hết ngân sách token
 * của cả lượt, đẩy văng chính ngữ cảnh hồ sơ mà ta muốn AI nhớ.
 */
export function toProviderMessages(
  history: CompanionMessage[],
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return history.map((msg) => ({
    role: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
    content: msg.content.slice(0, 1500),
  }))
}
