// packages/core-contracts/consentGrant.ts — Contract cho "ConsentGrant" (V2-02). Chưa có shape
// gợi ý cụ thể trong `02-SYSTEM-ARCHITECTURE.md` (chỉ có nguyên tắc ở mục 7: "consent
// scope/version/revoke") — field dưới đây suy trực tiếp từ đúng 3 từ khoá đó, không thêm khái
// niệm nào ngoài tài liệu đã nêu. Đây là 1 trong 8 gap contract mà
// `docs/architecture-v2/V2-02-CONTRACT-DIFF.md` mục 3/4 ghi rõ cần owner tham gia thiết kế field
// — bản này là ĐỀ XUẤT đầu tiên tối giản theo đúng 3 từ khoá roadmap nêu, KHÔNG phải quyết định
// cuối cùng; owner review lại trước khi domain engine Wave B (V2-04) dùng thật.

import { z } from 'zod'
import { versionedObject } from './version.js'
import { IsoDateTimeSchema, UuidSchema } from './shared.js'

export const CONSENT_GRANT_SCHEMA_VERSION = 1

export const ConsentStatusSchema = z.enum(['active', 'revoked', 'expired'])

export const ConsentGrantSchema = versionedObject(
  {
    id: UuidSchema,
    personId: UuidSchema,
    // Phạm vi tài nguyên được cấp phép, dạng "resource.action" (vd "personal_fact.read",
    // "life_graph.write") — khớp cách đặt tên "domain.action" đã dùng ở `eventEnvelope.ts`.
    scope: z.string().regex(/^[a-z_]+\.[a-z_]+$/, 'scope phải dạng "resource.action"'),
    // Mục đích dùng — TẠI SAO cần quyền này (vd "companion_context_building",
    // "third_party_export") — tách riêng `purpose` khỏi `scope` vì cùng 1 scope có thể được cấp
    // cho nhiều mục đích khác nhau, mỗi mục đích có thể revoke độc lập.
    purpose: z.string().min(1).max(200),
    version: z.number().int().positive(),
    status: ConsentStatusSchema,
    grantedAt: IsoDateTimeSchema,
    expiresAt: IsoDateTimeSchema.optional(),
    revokedAt: IsoDateTimeSchema.optional(),
  },
  CONSENT_GRANT_SCHEMA_VERSION,
)

export type ConsentGrant = z.infer<typeof ConsentGrantSchema>

/**
 * Consent của Bạn Đồng Hành — HAI công tắc, mỗi công tắc là một scope (chốt 2026-10-11, đặc tả
 * `docs/specs/2026-10-11-ban-dong-hanh-gd2a-tri-nho-truy-xuat.md`).
 *
 * VÌ SAO phải khai ở đây: trước đó `contextEngine` kiểm scope `personal_memory` / `personal_facts`
 * / `life_graph` / `<domain>` (không có dấu chấm) trong khi API `/api/consents` và chính
 * `ConsentGrantSchema` ở trên chỉ nhận `resource.action` — không có đường nào cấp được, nên mọi
 * cổng đọc ngữ cảnh cá nhân đều đóng im lặng trên production. Nguồn sự thật duy nhất cho tên
 * scope là hằng này; đừng gõ lại chuỗi ở nơi khác.
 */
export const COMPANION_CONSENT_PURPOSE = 'companion_conversation'

export const COMPANION_CONSENT_SCOPES = {
  /** Ký ức đã lưu + sự thật hồ sơ + đồ thị mục tiêu. (Tóm tắt tiến độ môn học là dữ liệu app,
   * KHÔNG qua công tắc này.) */
  memory: 'personal_memory.read',
  /** Lịch sử trò chuyện gần đây với Bạn Đồng Hành. */
  history: 'companion_history.read',
} as const

export type CompanionConsentScope =
  (typeof COMPANION_CONSENT_SCOPES)[keyof typeof COMPANION_CONSENT_SCOPES]

/** Hai công tắc trên trang "Bạn Đồng Hành nhớ gì về tôi" — phản ánh đúng hai consent ở trên. */
export const CompanionMemorySettingsSchema = z
  .object({
    rememberMemories: z.boolean(),
    useHistory: z.boolean(),
  })
  .strict()

export type CompanionMemorySettings = z.infer<typeof CompanionMemorySettingsSchema>
