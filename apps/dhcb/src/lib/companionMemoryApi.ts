// apps/dhcb/src/lib/companionMemoryApi.ts — Client cho trang "Bạn Đồng Hành nhớ gì về tôi"
// (GĐ2a, đặc tả `docs/specs/2026-10-11-ban-dong-hanh-gd2a-tri-nho-truy-xuat.md`):
// ba công tắc cài đặt (`/api/companion-memory`) + danh sách ký ức sửa/quên được (`/api/memories`)
// + (GĐ2b) khối ghi nhớ cố định, tóm tắt cuộn, gợi ý ký ức chờ duyệt (`/api/proposed-actions`).
import { z } from 'zod'
import { getAuthHeader } from '@core/authHeader'
import {
  CompanionMemorySettingsSchema,
  type CompanionMemorySettings,
} from '@dhcb/core-contracts/consentGrant'
import {
  ConversationSummarySchema,
  CoreMemoryBlockSchema,
  MemoryRecordSchema,
  type ConversationSummary,
  type CoreMemoryBlock,
  type CoreMemoryBlockLabel,
  type MemoryRecord,
} from '@dhcb/core-contracts/personalMemory'

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

// ── GĐ2b: khối ghi nhớ cố định · tóm tắt cuộn · gợi ý ký ức chờ duyệt ─────────────────────────
// Đặc tả `docs/specs/2026-10-12-ban-dong-hanh-gd2b-trich-ky-uc-khoi-loi.md`.

const OverviewBodySchema = z.object({
  settings: CompanionMemorySettingsSchema,
  coreBlocks: z.array(CoreMemoryBlockSchema),
  summaries: z.array(ConversationSummarySchema),
})
export type CompanionMemoryOverview = z.infer<typeof OverviewBodySchema>

/** Một lần GET: ba công tắc + hai khối cố định + các bản tóm tắt cuộn. */
export async function fetchCompanionMemoryOverview(): Promise<CompanionMemoryOverview> {
  const res = await fetch('/api/companion-memory', { headers: getAuthHeader() })
  if (!res.ok) throw await toError(res, 'Không tải được cài đặt ký ức')
  return OverviewBodySchema.parse(await res.json())
}

/** Ghi một khối cố định; chuỗi rỗng = xoá. `expectedVersion` lệch ⇒ lỗi 409. */
export async function saveCoreBlock(
  label: CoreMemoryBlockLabel,
  content: string,
  expectedVersion: number,
): Promise<CoreMemoryBlock> {
  const res = await fetch('/api/companion-memory', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ action: 'set_core_block', label, content, expectedVersion }),
  })
  if (!res.ok) throw await toError(res, 'Không lưu được khối ghi nhớ')
  return z.object({ block: CoreMemoryBlockSchema }).parse(await res.json()).block
}

/** Xoá nội dung bản tóm tắt của một miền; trả danh sách còn lại. */
export async function clearConversationSummary(domain: string): Promise<ConversationSummary[]> {
  const res = await fetch('/api/companion-memory', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ action: 'clear_summary', domain }),
  })
  if (!res.ok) throw await toError(res, 'Không xoá được bản tóm tắt')
  return z.object({ summaries: z.array(ConversationSummarySchema) }).parse(await res.json())
    .summaries
}

/** Ba capability ký ức mà một gợi ý chờ duyệt có thể mang (khớp server). */
const SUGGESTION_KIND: Record<string, MemorySuggestion['kind']> = {
  'memory.create_record': 'add',
  'memory.supersede_record': 'update',
  'memory.invalidate_record': 'invalidate',
}

export interface MemorySuggestion {
  id: string
  kind: 'add' | 'update' | 'invalidate'
  /** Điều sẽ được nhớ (rỗng với `invalidate`). */
  content: string
  /** Ký ức hiện có sẽ bị thay/bỏ. */
  previousContent?: string
  createdAt: string
}

const SuggestionPayloadSchema = z.object({
  content: z.string().optional(),
  previousContent: z.string().optional(),
})

const ActionsBodySchema = z.object({
  actions: z.array(
    z.object({
      id: z.string().uuid(),
      capabilityId: z.string(),
      status: z.string(),
      payload: z.unknown(),
      createdAt: z.string(),
    }),
  ),
})

/** Gợi ý ký ức đang chờ người dùng duyệt (từ bộ phản tỉnh sau buổi, hoặc câu "ghi nhớ…"). */
export async function fetchMemorySuggestions(): Promise<MemorySuggestion[]> {
  const res = await fetch('/api/proposed-actions?status=pending', { headers: getAuthHeader() })
  if (!res.ok) throw await toError(res, 'Không tải được gợi ý ký ức')
  const out: MemorySuggestion[] = []
  for (const action of ActionsBodySchema.parse(await res.json()).actions) {
    const kind = SUGGESTION_KIND[action.capabilityId]
    if (!kind || action.status !== 'pending') continue
    const payload = SuggestionPayloadSchema.safeParse(action.payload)
    const content = payload.success ? (payload.data.content ?? '') : ''
    const previousContent = payload.success ? payload.data.previousContent : undefined
    // Gợi ý không còn nội dung hiển thị được thì không cho duyệt mù.
    if (!content && !previousContent) continue
    out.push({
      id: action.id,
      kind,
      content,
      ...(previousContent ? { previousContent } : {}),
      createdAt: action.createdAt,
    })
  }
  return out
}

/**
 * Duyệt hoặc bỏ qua một gợi ý. Đề xuất `pending` luôn ở phiên bản 1 (chỉ đổi khi được quyết), nên
 * `expectedVersion` cố định — lệch nghĩa là đã được quyết ở tab khác (409).
 */
export async function decideMemorySuggestion(
  id: string,
  decision: 'confirm' | 'reject',
): Promise<void> {
  const res = await fetch('/api/proposed-actions', {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify({ action: decision, id, expectedVersion: 1 }),
  })
  if (!res.ok) {
    throw await toError(
      res,
      decision === 'confirm' ? 'Chưa ghi nhớ được gợi ý này' : 'Chưa bỏ qua được gợi ý này',
    )
  }
}
