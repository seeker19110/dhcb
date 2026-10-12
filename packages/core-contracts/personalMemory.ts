// packages/core-contracts/personalMemory.ts — Contract cho "MemoryRecord" V2-02 (Personal
// Knowledge Fabric, `docs/architecture-v2/02-SYSTEM-ARCHITECTURE.md` mục 6), KHÁC `MemorySchema`
// ở `memory.ts` (Phase 21 "Memory OS" v1 — bộ nhớ tutor gắn với 1 learner/domain học tập cụ
// thể, frozen). Đặt tên file `personalMemory.ts` (không phải `memory.ts` đã bị v1 chiếm) và type
// `MemoryRecord` (không phải `Memory`) để không nhầm 2 khái niệm — quyết định ở
// `docs/architecture-v2/V2-02-CONTRACT-DIFF.md` mục 2.2 và 4.
//
// So với v1 Memory, MemoryRecord thêm đúng những gì mục 6 kiến trúc đòi: provenance,
// sensitivity, retention, và kết quả bước cuối "Memory candidate pipeline" (mục 6:
// `ACCEPT | MERGE | REJECT | ASK_USER | EXPIRE`) — record ĐÃ tồn tại trong hệ thống nghĩa là đã
// qua pipeline và ở trạng thái `accepted`/`merged` (2 outcome duy nhất khiến record được LƯU;
// `rejected`/`expired` không tạo record mới, chỉ đổi trạng thái record cũ).

import { z } from 'zod'
import { versionedObject } from './version.js'
import { IsoDateTimeSchema, UuidSchema } from './shared.js'
import { SensitivitySchema } from './personalFact.js'

// v2 (2026-10-11, GĐ2a trí nhớ): thêm `version` (client cần để sửa/quên có kiểm phiên bản),
// `importance`/`lastAccessedAt` (điểm truy xuất 3 thành phần), hai trục thời gian
// `validFrom`/`validTo` + `supersededBy` (vô hiệu thay vì xoá — GĐ2b mới ghi), `sourceMessageId`
// (ký ức nối về lượt thoại sinh ra nó) và `hasEmbedding` (đã có vector tìm theo nghĩa chưa).
export const PERSONAL_MEMORY_SCHEMA_VERSION = 2

export const MemoryNamespaceSchema = z.enum([
  'semantic',
  'episodic',
  'preference',
  'commitment',
  'domain',
])
export type MemoryNamespace = z.infer<typeof MemoryNamespaceSchema>

export const MemoryRecordStatusSchema = z.enum(['accepted', 'merged', 'expired'])

export const MemoryRecordSchema = versionedObject(
  {
    id: UuidSchema,
    personId: UuidSchema,
    namespace: MemoryNamespaceSchema,
    content: z.string().min(1).max(2000),
    provenance: z.string().min(1).max(200),
    sensitivity: SensitivitySchema,
    status: MemoryRecordStatusSchema,
    // Chỉ record đã `merged` mới có nguồn gốc từ 1 record khác — trace được lịch sử hợp nhất.
    mergedFromId: UuidSchema.optional(),
    createdAt: IsoDateTimeSchema,
    // Retention — hạn giữ dữ liệu, KHÁC `expiresAt` ở PersonalFact (đó là hạn hiệu lực của 1
    // fact; đây là hạn PHẢI XOÁ theo chính sách retention, có thể ngắn hơn nhiều so với thời
    // gian fact còn "đúng").
    retainUntil: IsoDateTimeSchema.optional(),
    // Tăng 1 mỗi lần sửa/gộp/quên — client gửi lại làm `expectedVersion` (optimistic lock).
    version: z.number().int().positive(),
    // 1–10, chấm một lần lúc ghi (Generative Agents); mặc định 5. KHÔNG hiện ra giao diện như một
    // "điểm" — chỉ dùng để xếp thứ tự truy xuất.
    importance: z.number().int().min(1).max(10),
    lastAccessedAt: IsoDateTimeSchema.optional(),
    // Trục "đúng từ lúc nào tới lúc nào" (khác `retainUntil` là hạn PHẢI XOÁ theo retention).
    validFrom: IsoDateTimeSchema,
    validTo: IsoDateTimeSchema.optional(),
    supersededBy: UuidSchema.optional(),
    sourceMessageId: UuidSchema.optional(),
    hasEmbedding: z.boolean(),
  },
  PERSONAL_MEMORY_SCHEMA_VERSION,
)

export type MemoryRecord = z.infer<typeof MemoryRecordSchema>

// ─── GĐ2b (2026-10-12): khối ghi nhớ cố định + tóm tắt cuộn ──────────────────────────────────
// Đặc tả `docs/specs/2026-10-12-ban-dong-hanh-gd2b-trich-ky-uc-khoi-loi.md` §③.

/** Trần ký tự của một khối ghi nhớ cố định (Letta core memory: khối nhỏ, luôn nạp). */
export const CORE_MEMORY_BLOCK_MAX_CHARS = 1500

/** Trần ký tự của một bản tóm tắt cuộn theo miền. */
export const CONVERSATION_SUMMARY_MAX_CHARS = 1500

/** Hai khối cố định: "Về tôi" và "Đang tập trung" — người dùng tự viết trên trang ký ức. */
export const CoreMemoryBlockLabelSchema = z.enum(['about_me', 'current_focus'])
export type CoreMemoryBlockLabel = z.infer<typeof CoreMemoryBlockLabelSchema>

export const CoreMemoryBlockSchema = z
  .object({
    label: CoreMemoryBlockLabelSchema,
    // Chuỗi rỗng = chưa viết (hoặc đã xoá).
    content: z.string().max(CORE_MEMORY_BLOCK_MAX_CHARS),
    // 0 = khối chưa từng được lưu; client gửi lại làm `expectedVersion`.
    version: z.number().int().nonnegative(),
    updatedAt: IsoDateTimeSchema.optional(),
  })
  .strict()
export type CoreMemoryBlock = z.infer<typeof CoreMemoryBlockSchema>

export const ConversationSummarySchema = z
  .object({
    domain: z.string().min(1).max(100),
    // Chuỗi rỗng = người dùng đã xoá bản tóm tắt (con trỏ vẫn giữ ở server).
    summary: z.string().max(CONVERSATION_SUMMARY_MAX_CHARS),
    updatedAt: IsoDateTimeSchema,
  })
  .strict()
export type ConversationSummary = z.infer<typeof ConversationSummarySchema>
