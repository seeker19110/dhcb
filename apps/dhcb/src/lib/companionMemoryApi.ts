// apps/dhcb/src/lib/companionMemoryApi.ts — Client cho trang "Bạn Đồng Hành nhớ gì về tôi"
// (GĐ2a, đặc tả `docs/specs/2026-10-11-ban-dong-hanh-gd2a-tri-nho-truy-xuat.md`):
// hai công tắc cài đặt (`/api/companion-memory`) + danh sách ký ức sửa/quên được (`/api/memories`).
import { z } from 'zod'
import { getAuthHeader } from '@core/authHeader'
import {
  CompanionMemorySettingsSchema,
  type CompanionMemorySettings,
} from '@dhcb/core-contracts/consentGrant'
import { MemoryRecordSchema, type MemoryRecord } from '@dhcb/core-contracts/personalMemory'

/** Mã lỗi máy đọc được: ký ức mức nhạy cảm cần 2FA (server trả 403 kèm `code`). */
export const MEMORY_ERROR_CODES = ['TWO_FACTOR_SETUP_REQUIRED', 'STEP_UP_REQUIRED'] as const
export type MemoryErrorCode = (typeof MEMORY_ERROR_CODES)[number]

export class CompanionMemoryApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: MemoryErrorCode,
  ) {
    super(message)
    this.name = 'CompanionMemoryApiError'
  }
}

const ErrorBodySchema = z.object({
  error: z.string().optional(),
  code: z.enum(MEMORY_ERROR_CODES).optional(),
})

async function toError(res: Response, fallback: string): Promise<CompanionMemoryApiError> {
  const parsed = ErrorBodySchema.safeParse(await res.json().catch(() => null))
  const body = parsed.success ? parsed.data : {}
  return new CompanionMemoryApiError(body.error ?? fallback, res.status, body.code)
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json', ...getAuthHeader() }
}

// ── Hai công tắc ─────────────────────────────────────────────────────────────────────────────

const SettingsBodySchema = z.object({ settings: CompanionMemorySettingsSchema })

export async function fetchCompanionMemorySettings(): Promise<CompanionMemorySettings> {
  const res = await fetch('/api/companion-memory', { headers: getAuthHeader() })
  if (!res.ok) throw await toError(res, 'Không tải được cài đặt ký ức')
  return SettingsBodySchema.parse(await res.json()).settings
}

/** Chỉ gửi công tắc cần đổi; server trả trạng thái đọc lại sau khi ghi. */
export async function updateCompanionMemorySettings(
  patch: Partial<CompanionMemorySettings>,
): Promise<CompanionMemorySettings> {
  const res = await fetch('/api/companion-memory', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ action: 'set_settings', ...patch }),
  })
  if (!res.ok) throw await toError(res, 'Không lưu được cài đặt ký ức')
  return SettingsBodySchema.parse(await res.json()).settings
}

// ── Danh sách ký ức ──────────────────────────────────────────────────────────────────────────

const RecordsBodySchema = z.object({ records: z.array(MemoryRecordSchema) })

export async function fetchMemories(): Promise<MemoryRecord[]> {
  const res = await fetch('/api/memories', { headers: getAuthHeader() })
  if (!res.ok) throw await toError(res, 'Không tải được danh sách ký ức')
  return RecordsBodySchema.parse(await res.json()).records
}

/** Bản ghi sau khi sửa/quên: ký ức mức nhạy cảm chỉ trả về id/status/version (không đọc ngược). */
const UpdatedRecordSchema = z.object({
  record: z.union([
    MemoryRecordSchema,
    z.object({ id: z.string().uuid(), status: z.string(), version: z.number().int().positive() }),
  ]),
})
export type UpdatedMemoryRecord = z.infer<typeof UpdatedRecordSchema>['record']

export async function updateMemory(
  id: string,
  content: string,
  expectedVersion: number,
): Promise<UpdatedMemoryRecord> {
  const res = await fetch('/api/memories', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ action: 'update', id, content, expectedVersion }),
  })
  if (!res.ok) throw await toError(res, 'Không lưu được ký ức')
  return UpdatedRecordSchema.parse(await res.json()).record
}

/** "Quên" = expire (giữ dấu vết audit, không xoá cứng). */
export async function forgetMemory(id: string, expectedVersion: number): Promise<void> {
  const res = await fetch('/api/memories', {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify({ action: 'expire', id, expectedVersion }),
  })
  if (!res.ok) throw await toError(res, 'Không quên được ký ức này')
}
