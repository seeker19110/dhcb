# Đặc tả — Bạn Đồng Hành GĐ2a: mở cổng consent · truy xuất ký ức lai · trang ký ức · phiên tạm

- **Ngày:** 2026-10-11 · **Trạng thái:** Approved for implementation (chủ dự án chốt trong phiên:
  "bắt đầu GĐ2", chọn Gemini không pgvector, tách GĐ2a/GĐ2b)
- **Nghiên cứu:** `docs/research/nang-cap-ban-dong-hanh-2026-10-11.md` mục 2.1 + 3 (GĐ2)
- **Quyết định kiến trúc:** `docs/adr/0015-tri-nho-companion-lai-fts-embedding-khong-pgvector.md`
- **GĐ trước:** `docs/specs/2026-10-11-ban-dong-hanh-gd1-stream-an-toan.md` (đã merge, PR #1369)

## 0. Một câu

Làm cho Bạn Đồng Hành **thật sự nhớ**: mở được cổng consent (hiện không mở được nên production
chạy ngữ cảnh rỗng), tìm ký ức theo chữ + nghĩa với điểm 3 thành phần, cho người dùng xem/sửa/quên
ký ức ở một trang riêng, và có chế độ phiên tạm không nhớ.

## ① Phạm vi

**LÀM:**

- **Mở cổng consent (lỗi im lặng đo được 2026-10-11):** `contextEngine` kiểm scope
  `personal_memory` / `personal_facts` / `life_graph` / `<domain>` (không dấu chấm) nhưng API
  `/api/consents` và contract `ConsentGrantSchema` chỉ nhận `resource.action`; client chưa gọi API
  này ở đâu. Hệ quả: không lịch sử, không ký ức, không hồ sơ, không tóm tắt môn học nào vào được
  prompt. Sửa: hai scope chuẩn `personal_memory.read` (ký ức đã lưu + hồ sơ + đồ thị mục tiêu) và
  `companion_history.read` (lịch sử trò chuyện); tóm tắt tiến độ môn học là dữ liệu app người
  dùng vốn thấy ở bảng điều khiển — KHÔNG qua công tắc (phiên tạm vẫn nạp), purpose `companion_conversation`, khai ở
  `packages/core-contracts/consentGrant.ts`; `contextEngine` chỉ dùng hai scope này.
- **API cài đặt ký ức** `/api/companion-memory` (GET/POST) — hai công tắc = hai consent.
- **Migration `0094`:** `unaccent` (trusted) + hàm bọc IMMUTABLE; cột `importance`,
  `last_accessed_at`, `access_count`, `valid_from`, `valid_to`, `superseded_by`,
  `source_message_id`, `embedding real[]`, `embedding_model`, `search_tsv` (cột sinh) + GIN.
- **Truy xuất lai** `packages/core-personal/memoryRetrieval.ts`: FTS OR-token + cosine Node + RRF
  k=60 + điểm 3 thành phần; cập nhật `last_accessed_at`/`access_count` cho ký ức đã dùng.
- **Embedding Gemini** `packages/core-ai/embeddings.ts` (`gemini-embedding-2`, 768 chiều, có key
  mới chạy, hỏng → `null`, ghi token mode `embedding`).
- `memoryService`: trả `version` + trường mới; `ingest` nhận `importance`/`sourceMessageId` + tính
  embedding; `updateMemoryContent` (sửa nội dung, audit `UPDATE`, tính lại embedding);
  `backfillMemoryEmbeddings`; `purgeExpiredMemories` được **lên lịch thật** (hiện chưa ai gọi).
- **`/api/memories`:** thêm `action: 'update'`; GET trả trường mới.
- **Phiên tạm** (`ephemeral: true`): không đọc ký ức/hồ sơ/lịch sử, không lưu transcript, không đề
  xuất "lưu ký ức"; lớp an toàn vẫn chạy; tóm tắt môn học (dữ liệu app) vẫn được nạp.
- **Trang `/ban-dong-hanh/ky-uc` "Bạn Đồng Hành nhớ gì về tôi":** hai công tắc, danh sách ký ức
  (sửa tại chỗ, "Quên"), trạng thái tải/rỗng/lỗi, nhắc bật 2FA khi có ký ức nhạy cảm; link từ
  trang Companion; thẻ mời bật ký ức trong khung trò chuyện khi cả hai công tắc tắt.

**KHÔNG LÀM (quan trọng ngang mục trên):**

- Trích ký ức tự động kiểu mem0 sau phiên, ADD/UPDATE/vô hiệu qua ProposedAction, khối lõi, tóm
  tắt cuộn 70/50 → **GĐ2b** (cột `valid_to`/`superseded_by` được TẠO ở đợt này nhưng chưa ai ghi).
- Không cài pgvector, không đổi image CI, không việc tay trên VPS (ADR-0015).
- Không đổi `aiConfig.ts` route đang có; không đổi prompt môn Anh (không chạy `eval:tutor`).
- Không đụng `personal.personal_facts`, `proposed_actions`, luồng SePay/billing.
- Không tự cấp consent ngầm: công tắc mặc định TẮT cho tới khi người dùng bật (trẻ em/phụ huynh
  quyết định).

## ② Điểm chạm

| Việc | Đường dẫn file                                                    | Ghi chú                                                               |
| ---- | ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| Thêm | `postgres/migrations/0094_companion_memory_retrieval.sql`         | unaccent + cột + cột sinh + GIN, lũy đẳng                             |
| Sửa  | `packages/core-contracts/consentGrant.ts`                         | `COMPANION_CONSENT_PURPOSE`, `COMPANION_CONSENT_SCOPES`, settings     |
| Sửa  | `packages/core-contracts/personalMemory.ts`                       | `version`, `importance`, `lastAccessedAt`, `validFrom/To`, …; v2      |
| Thêm | `packages/core-ai/embeddings.ts`                                  | provider Gemini, `embedForStorage`/`embedQuery`                       |
| Thêm | `packages/core-ai/embeddings.test.ts`                             |                                                                       |
| Sửa  | `packages/core-personal/memoryService.ts`                         | cột mới, `updateMemoryContent`, `touchMemoryAccess`, backfill         |
| Sửa  | `packages/core-personal/memoryService.test.ts`                    |                                                                       |
| Thêm | `packages/core-personal/memoryRetrieval.ts`                       | tokenize, FTS, cosine, RRF, điểm 3 thành phần                         |
| Thêm | `packages/core-personal/memoryRetrieval.test.ts`                  |                                                                       |
| Sửa  | `packages/core-personal/contextEngine.ts`                         | scope chuẩn; `searchMemories`; `includePersonalContext`               |
| Sửa  | `packages/core-personal/contextEngine.test.ts`                    |                                                                       |
| Sửa  | `packages/core-personal/companionRuntime.ts`                      | `ephemeral`: bỏ ngữ cảnh cá nhân, bỏ bước ký ức, không lưu transcript |
| Sửa  | `packages/core-personal/companionRuntime.test.ts`                 |                                                                       |
| Sửa  | `packages/core-personal/safetyGuard.ts`                           | `stripVietnameseDiacritics` dời sang `vietnameseText.ts` (re-export)  |
| Thêm | `packages/core-personal/vietnameseText.ts`                        | bỏ dấu dùng chung                                                     |
| Thêm | `apps/server/src/api/personal/companion-memory.ts`                | GET/POST cài đặt (2 consent)                                          |
| Thêm | `apps/server/src/api/personal/companion-memory.test.ts`           |                                                                       |
| Sửa  | `apps/server/src/api/personal/memories.ts`                        | `action: 'update'`                                                    |
| Sửa  | `apps/server/src/api/personal/memories.test.ts`                   |                                                                       |
| Sửa  | `apps/server/src/api/personal/companion.ts`                       | nhận `ephemeral`                                                      |
| Sửa  | `apps/server/src/routes.ts`                                       | gắn `/api/companion-memory`                                           |
| Sửa  | `apps/server/src/server.ts`                                       | job ngày: `purgeExpiredMemories` + `backfillMemoryEmbeddings`         |
| Thêm | `apps/dhcb/src/lib/companionMemoryApi.ts`                         | client cài đặt + ký ức                                                |
| Thêm | `apps/dhcb/src/lib/companionMemoryApi.test.ts`                    |                                                                       |
| Sửa  | `apps/dhcb/src/lib/companionApi.ts`                               | `ephemeral` trong params                                              |
| Thêm | `apps/dhcb/src/pages/companion/CompanionMemory.tsx`               | trang ký ức                                                           |
| Thêm | `apps/dhcb/src/pages/companion/CompanionMemory.test.tsx`          |                                                                       |
| Thêm | `apps/dhcb/src/components/CompanionStudios/MemoryConsentCard.tsx` | thẻ mời bật ký ức + nút phiên tạm                                     |
| Sửa  | `apps/dhcb/src/components/CompanionStudios/StudioDialogue.tsx`    | gắn thẻ, nhãn phiên tạm                                               |
| Sửa  | `apps/dhcb/src/pages/companion/Companion.tsx`                     | state `ephemeral`, nạp cài đặt, link trang ký ức                      |
| Sửa  | `apps/dhcb/src/App.tsx`                                           | route `/ban-dong-hanh/ky-uc`                                          |
| Sửa  | `e2e/a11y.spec.ts`                                                | thêm `/ban-dong-hanh/ky-uc`                                           |
| Sửa  | `.env.example`                                                    | `GEMINI_EMBEDDING_MODEL` (tuỳ chọn)                                   |

**Ảnh hưởng lan ra (theo codemap, chạy trước khi sửa):** `contextEngine.ts` được
`companionRuntime.ts`, `api/personal/context-package.ts` và `scripts/eval-v2-privacy.ts` dùng;
`memoryService.ts` được `capabilityExecutor.ts`, `api/personal/memories.ts`,
`personErasureService.ts` dùng — mọi nơi đọc `MemoryRecord` phải chịu được trường mới.

## ③ Hợp đồng dữ liệu

**DDL (migration `0094`, lũy đẳng, user app chạy được — không cần superuser):**

```sql
create extension if not exists unaccent;
create or replace function personal.immutable_unaccent(text) returns text
  language sql immutable parallel safe strict
  as $$ select public.unaccent('public.unaccent', $1) $$;
alter table personal.memory_records
  add column if not exists importance        smallint    not null default 5
                                              check (importance between 1 and 10),
  add column if not exists last_accessed_at  timestamptz,
  add column if not exists access_count      integer     not null default 0,
  add column if not exists valid_from        timestamptz not null default now(),
  add column if not exists valid_to          timestamptz,
  add column if not exists superseded_by     uuid references personal.memory_records(id),
  add column if not exists source_message_id uuid references personal.companion_messages(id)
                                              on delete set null,
  add column if not exists embedding         real[],
  add column if not exists embedding_model   text,
  add column if not exists search_tsv        tsvector generated always as
    (to_tsvector('simple', personal.immutable_unaccent(content))) stored;
create index if not exists idx_memory_records_search_tsv
  on personal.memory_records using gin (search_tsv);
create index if not exists idx_memory_records_person_live
  on personal.memory_records (person_id, importance desc, last_accessed_at desc nulls last)
  where status <> 'expired' and valid_to is null;
```

Rollback: gỡ route/code, GIỮ cột (không mất dữ liệu); chỉ khi chắc chắn: `drop index`, `alter
table … drop column` theo thứ tự ngược, `drop function personal.immutable_unaccent`.

**Contract (`packages/core-contracts`):**

```ts
// consentGrant.ts
export const COMPANION_CONSENT_PURPOSE = 'companion_conversation'
export const COMPANION_CONSENT_SCOPES = {
  memory: 'personal_memory.read', // ký ức đã lưu + hồ sơ + đồ thị mục tiêu (tóm tắt môn: không qua cổng)
  history: 'companion_history.read', // lịch sử trò chuyện
} as const
export const CompanionMemorySettingsSchema = z
  .object({ rememberMemories: z.boolean(), useHistory: z.boolean() })
  .strict()

// personalMemory.ts — PERSONAL_MEMORY_SCHEMA_VERSION = 2
MemoryRecordSchema += {
  version: z.number().int().positive(),
  importance: z.number().int().min(1).max(10),
  lastAccessedAt: IsoDateTimeSchema.optional(),
  validFrom: IsoDateTimeSchema,
  validTo: IsoDateTimeSchema.optional(),
  supersededBy: UuidSchema.optional(),
  sourceMessageId: UuidSchema.optional(),
  hasEmbedding: z.boolean(),
}
```

**API:**

| Phương thức + đường dẫn      | Vào                                                                      | Ra                                                     |
| ---------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| `GET /api/companion-memory`  | —                                                                        | `{ settings: CompanionMemorySettings }`                |
| `POST /api/companion-memory` | `{ action: 'set_settings', rememberMemories?: bool, useHistory?: bool }` | `{ settings }` (cấp/thu hồi consent)                   |
| `GET /api/memories`          | (như cũ)                                                                 | `{ records: MemoryRecord[] }` có trường mới            |
| `POST /api/memories`         | `{ action: 'update', id, content (1–2000), expectedVersion }`            | `{ record }`                                           |
| `POST /api/companion`        | `+ ephemeral?: boolean`                                                  | như cũ; `contextPackage` chỉ còn yêu cầu + tóm tắt môn |

**Truy xuất (`searchMemories`):**

```ts
searchMemories(pool, personId, {
  query: string            // câu người dùng vừa nói
  limit?: number           // mặc định 10
  maxSensitivity?: Sensitivity
  now?: Date
}) → Array<MemoryRecord & { score: number }>
// ứng viên = FTS(OR token bỏ dấu, ts_rank_cd) ∪ cosine(≤ 300 ký ức có embedding) ∪ top-20 importance
// relevance = RRF(k=60) / max ; recency = 0.995^giờ(last_accessed_at ?? created_at) ; importance/10
// score = (recency + importance + relevance) / 3 ; sau khi chọn: last_accessed_at = now(), access_count + 1
```

**Ca lỗi (là một phần hợp đồng):**

| Tình huống                                   | Mã lỗi / hành vi                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| Không có `GEMINI_API_KEY`                    | Không lỗi: `embedding = null`, chỉ tìm chữ; `hasEmbedding = false`        |
| Gemini lỗi/timeout (8 s) lúc ghi             | Ký ức VẪN lưu, không embedding; job đêm bù                                |
| Gemini lỗi lúc hỏi                           | Bỏ nhánh nghĩa, vẫn tìm chữ + importance; không chậm lượt quá 8 s         |
| `update` với `expectedVersion` lệch          | 409 `ConflictError`                                                       |
| `update`/`expire` ký ức không thuộc người đó | 404                                                                       |
| Xem ký ức `sensitive`/`restricted` chưa 2FA  | 403 `TWO_FACTOR_SETUP_REQUIRED` / `STEP_UP_REQUIRED` (giữ luật hiện có)   |
| Phiên tạm + lượt khủng hoảng                 | Lớp an toàn vẫn chạy; thẻ hỗ trợ vẫn hiện; không lưu gì                   |
| Công tắc ký ức TẮT                           | `contextPackage` không có `validated_derived_memory`/`user_declared_fact` |

## ④ Tiêu chí chấp nhận

- [ ] Hai scope chuẩn khớp regex `^[a-z_]+\.[a-z_]+$`; `contextEngine` KHÔNG còn gọi
      `isConsentActive` với scope không có dấu chấm — `contextEngine.test.ts` (bật `memory` →
      có ký ức + hồ sơ; chỉ `history` → có lịch sử, không ký ức; tắt cả → chỉ yêu cầu + tóm tắt môn).
- [ ] `/api/companion-memory`: GET phản ánh consent thật; POST bật → `grantConsent` đúng scope +
      purpose, tắt → `revokeConsent` bản active — `companion-memory.test.ts`.
- [ ] `searchMemories`: (a) câu hỏi có dấu/không dấu đều khớp ký ức FTS; (b) không embedding
      → vẫn có kết quả; (c) RRF gộp đúng (ký ức có mặt cả hai danh sách đứng đầu); (d) ký ức
      quan trọng (importance 9) không khớp chữ vẫn vào top khi ngân sách còn; (e) sau truy xuất
      có UPDATE `last_accessed_at` cho đúng id — `memoryRetrieval.test.ts`.
- [ ] Embedding: body REST đúng khoá (`model`, `content.parts[].text`, `output_dimensionality`),
      tiền tố query/document đúng tài liệu Gemini, timeout → `null`, ghi token mode `embedding` —
      `embeddings.test.ts`.
- [ ] `memoryService`: `updateMemoryContent` tăng `version`, audit `UPDATE`, lệch version → 409;
      `rowToMemoryRecord` trả `version`/`importance`/`hasEmbedding` — `memoryService.test.ts`.
- [ ] Phiên tạm: `buildContextPackage` được gọi với `includePersonalContext: false` và
      `includeCompanionHistory: false`; 0 insert `companion_messages`; không có bước
      `memory.create_record` kể cả khi câu có "ghi nhớ"; `assessSafety` vẫn được gọi —
      `companionRuntime.test.ts`.
- [ ] Trang ký ức: render 4 trạng thái (tải/rỗng/lỗi/danh sách), sửa → gọi `update` với
      `expectedVersion`, "Quên" → `expire`; công tắc `role="switch"` + `aria-checked` —
      `CompanionMemory.test.tsx`; cổng a11y AA/AAA quét `/ban-dong-hanh/ky-uc` (3 theme).
- [ ] `check:sql` PREPARE được mọi câu mới (CI `sql-prepare`); `migrate:pg` áp 0094 trên
      Postgres 16 bằng user có CREATE, không superuser.

**Lệnh chứng minh:**

```bash
rm -rf packages/*/dist dist dist-server && npm run typecheck && npm run lint && npm run test:coverage && npm run build
npm run check:specs
```

## ⑤ Bất biến không được phá

| Bất biến                                                                                         | Test nào canh nó                                   |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| Ghi ký ức vào CSDL LUÔN qua xác nhận người dùng (ProposedAction)                                 | `proposedActionService.test.ts` (không đổi)        |
| Không consent ⇒ không một ký ức/hồ sơ/lịch sử nào vào prompt                                     | `contextEngine.test.ts`                            |
| Phiên tạm không để lại dấu vết trong CSDL                                                        | `companionRuntime.test.ts`                         |
| Embedding hỏng không làm hỏng ghi/đọc ký ức                                                      | `memoryService.test.ts`, `memoryRetrieval.test.ts` |
| Lớp an toàn chạy ở MỌI lượt, kể cả phiên tạm                                                     | `companionRuntime.test.ts`                         |
| Ký ức nhạy cảm chỉ hiện sau 2FA + step-up                                                        | `memories.test.ts`                                 |
| Số năng lực/chẩn đoán không lên giao diện (Luật số 1) — trang ký ức không hiện điểm `importance` | `CompanionMemory.test.tsx`                         |

## ⑥ Quy ước dự án liên quan

- Migration lũy đẳng, có số thứ tự, có dòng README (`postgres/migrations/README.md`).
- Mọi SQL tĩnh PREPARE được (`npm run check:sql`); không dùng lệnh cần superuser.
- Import xuyên gói `@dhcb/<gói>/<file>`; `packages/` không import `apps/`.
- Gọi dịch vụ ngoài (Gemini) có timeout, có nhánh lỗi, ghi token; không log nội dung ký ức.
- Giao diện: chữ AAA, điều khiển AA, vùng chạm ≥ 44 px (`tap-44`), 3 theme; token màu `--a-*`.
- Luật số 1 của sản phẩm: trang ký ức không phải bảng chấm điểm con người.

---

## Nghiệm thu

- Lệnh đã chạy + kết quả thật: xem changelog `0615` (điền khi mở PR).
- Để ngỏ: kiểm thật trên production với `GEMINI_API_KEY` (ký ức có `hasEmbedding = true` sau khi
  ghi? hỏi đồng nghĩa có khớp?) — việc tay của chủ dự án.
