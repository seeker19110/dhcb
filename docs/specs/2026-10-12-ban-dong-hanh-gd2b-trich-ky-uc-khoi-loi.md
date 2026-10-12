# Đặc tả — Bạn Đồng Hành GĐ2b: gợi ý ký ức sau buổi trò chuyện · khối ghi nhớ cố định · tóm tắt cuộn

- **Ngày:** 2026-10-12 · **Trạng thái:** Approved for implementation (chủ dự án giao trong phiên:
  "viết đặc tả GĐ2b Companion rồi làm"; khung 4 giai đoạn đã chốt 2026-10-11)
- **Nghiên cứu:** `docs/research/nang-cap-ban-dong-hanh-2026-10-11.md` mục 2.1 (mem0, Zep, Letta,
  ChatGPT memory) + mục 2.4 (Spotlighting — ký ức trích ra là dữ liệu không tin cậy)
- **GĐ trước:** `docs/specs/2026-10-11-ban-dong-hanh-gd2a-tri-nho-truy-xuat.md` (đã merge, PR #1375)

## 0. Một câu

Sau mỗi buổi trò chuyện, Bạn Đồng Hành **tự đề xuất** điều nên nhớ (thêm · cập nhật · bỏ điều cũ)
để người dùng bấm duyệt, luôn mang theo **hai khối ghi nhớ cố định** do người dùng tự viết, và giữ
một **bản tóm tắt cuộn** các buổi trước để nối tiếp câu chuyện khi lịch sử đã trôi khỏi ngữ cảnh.

## ① Phạm vi

**LÀM:**

- **Công tắc thứ ba** `suggestMemories` = consent `memory_suggestion.create` (purpose
  `companion_conversation`), mặc định TẮT. Chỉ có tác dụng khi "Nhớ về tôi" (`personal_memory.read`)
  cũng bật — bộ trích phải đọc ký ức hiện có để so.
- **Phản tỉnh sau buổi** `packages/core-personal/memoryReflectionService.ts`, chạy NGOÀI đường
  nóng: bộ hẹn giờ 10 phút ở instance 0 quét người có tin nhắn mới mà tin cuối đã **im ≥ 15 phút**
  (debounce theo mem0). Mỗi người mỗi lượt quét **đúng MỘT lời gọi AI** (Haiku, nhiệm vụ mới
  `memory_reflect`, JSON schema chặt) làm cả hai việc:
  1. **Trích ký ức kiểu mem0:** đọc ≤ 30 tin gần nhất sau con trỏ trích + ≤ 10 ký ức giống nhất
     (`searchMemories`, KHÔNG chạm `last_accessed_at`) → trả ≤ 5 thao tác `ADD | UPDATE |
INVALIDATE` có id ký ức sẵn có. Mỗi thao tác thành **một ProposedAction `pending`** — không
     thao tác nào tự ghi.
  2. **Tóm tắt cuộn 70/50 kiểu Letta** theo từng miền: cửa sổ 20 tin; khi số tin chưa tóm tắt
     **≥ 14 (70%)** thì gộp **10 tin cũ nhất (50%)** vào bản tóm tắt cũ thành bản mới ≤ 1.500 ký
     tự. Cần công tắc "Dùng lịch sử trò chuyện" (`companion_history.read`).
- **Ba capability ký ức** (đều trong `CONFIRMATION_REQUIRED_CAPABILITIES`, chạy trong transaction
  của `confirmAction`):
  - `memory.create_record` (đã có) — nhận thêm `importance`, `sourceMessageId`, `provenance`
    `companion:reflection`.
  - `memory.supersede_record` (mới) — tạo bản mới, bản cũ nhận `valid_to = now()` +
    `superseded_by = <id mới>` (vô hiệu, KHÔNG xoá — Zep). Bản cũ đã đổi `version` / đã quên / đã
    bị thay ⇒ 409, người dùng bỏ qua gợi ý.
  - `memory.invalidate_record` (mới) — chỉ đặt `valid_to = now()` (điều cũ không còn đúng).
- **Khối ghi nhớ cố định** (Letta core memory) `packages/core-personal/coreMemoryBlocks.ts`: hai
  khối `about_me` ("Về tôi") · `current_focus` ("Đang tập trung"), mỗi khối ≤ 1.500 ký tự, **người
  dùng tự viết** trên trang ký ức (không qua AI, không cần duyệt), luôn nạp vào ngữ cảnh khi công
  tắc "Nhớ về tôi" bật, đứng ngay sau câu đang hỏi.
- **Tóm tắt cuộn vào ngữ cảnh:** công tắc lịch sử bật ⇒ `contextEngine` nạp bản tóm tắt của đúng
  miền (đứng SAU lịch sử gần nhất trong thứ tự gói ngân sách — lượt vừa nói luôn được ưu tiên).
- **Trang `/ban-dong-hanh/ky-uc`:** công tắc thứ ba; mục "Gợi ý chờ bạn duyệt" (Ghi nhớ / Bỏ qua);
  mục "Ghi nhớ cố định" (hai ô sửa có đếm ký tự); mục "Tóm tắt các buổi trước" (xem + xoá); ký ức
  đã bị thay tách vào `<details>` "Thông tin cũ đã được thay".
- **Xuất/xoá dữ liệu cá nhân** phủ ba bảng mới (`PERSON_TABLES`).
- Sửa khoá ngoại `superseded_by` thành `on delete set null` — không thì job dọn ký ức hết hạn (xoá
  bản mới) gãy vì bản cũ còn trỏ tới.

**KHÔNG LÀM (quan trọng ngang mục trên):**

- KHÔNG tự ghi bất kỳ ký ức nào — kể cả "preference rủi ro thấp" mà nghiên cứu gợi ý tự áp. Chốt
  2026-08-25 (ghi hồ sơ/ký ức luôn chờ xác nhận) đứng trên gợi ý nghiên cứu.
- KHÔNG cho AI sửa khối ghi nhớ cố định (Letta cho model tự sửa qua tool) — để GĐ3 khi có vòng
  công cụ; đợt này khối do người dùng viết.
- KHÔNG phản tỉnh kiểu Generative Agents (câu hỏi nổi bật → nhận định) — GĐ4.
- KHÔNG đọc tin nhắn có độ nhạy > `personal` hoặc lượt có dấu hiệu khủng hoảng (lượt `concern` lưu
  với độ nhạy ≥ `sensitive` nên tự rơi khỏi bộ lọc; thêm bộ lọc từ khoá `prefilterCrisis` cho
  chắc). Lượt `imminent` và phiên tạm vốn không được lưu.
- KHÔNG đổi route AI đang có (`aiConfig.ts` chỉ THÊM `memory_reflect`); không đổi prompt môn Anh,
  prompt Companion (`companionPrompt.ts`) — không cần `eval:tutor`.
- KHÔNG đổi `proposedActionService` (cổng xác nhận giữ nguyên), không đụng SePay/billing.
- KHÔNG xử lý khi người dùng đang trò chuyện (đường nóng không thêm lời gọi AI nào).

## ② Điểm chạm

| Việc | Đường dẫn file                                                         | Ghi chú                                                   |
| ---- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| Thêm | `postgres/migrations/0096_companion_reflection.sql`                    | 3 bảng + sửa FK `superseded_by`, lũy đẳng                 |
| Sửa  | `postgres/migrations/README.md`                                        | dòng 0096                                                 |
| Sửa  | `packages/core-contracts/consentGrant.ts`                              | scope `suggest`, `suggestMemories`                        |
| Sửa  | `packages/core-contracts/personalMemory.ts`                            | `CoreMemoryBlock*`, `ConversationSummary*`, hằng giới hạn |
| Sửa  | `packages/core-ai/aiConfig.ts`                                         | THÊM nhiệm vụ `memory_reflect` (Haiku)                    |
| Thêm | `packages/core-ai/aiConfig.test.ts`                                    |                                                           |
| Thêm | `packages/core-personal/coreMemoryBlocks.ts`                           | đọc/ghi khối cố định + tóm tắt cuộn                       |
| Thêm | `packages/core-personal/coreMemoryBlocks.test.ts`                      |                                                           |
| Thêm | `packages/core-personal/memoryReflectionPrompt.ts`                     | prompt, JSON schema, kiểm đầu ra                          |
| Thêm | `packages/core-personal/memoryReflectionPrompt.test.ts`                |                                                           |
| Thêm | `packages/core-personal/memoryReflectionService.ts`                    | quét, consent, đếm/hoàn lượt, đề xuất, con trỏ            |
| Thêm | `packages/core-personal/memoryReflectionService.test.ts`               |                                                           |
| Sửa  | `packages/core-personal/memoryService.ts`                              | `supersedeMemoryWithClient`, `invalidateMemoryWithClient` |
| Sửa  | `packages/core-personal/memoryService.test.ts`                         |                                                           |
| Sửa  | `packages/core-personal/memoryRetrieval.ts`                            | tuỳ chọn `touch: false`                                   |
| Sửa  | `packages/core-personal/memoryRetrieval.test.ts`                       |                                                           |
| Sửa  | `packages/core-personal/capabilityExecutor.ts`                         | 2 capability mới + `importance`/`sourceMessageId`         |
| Sửa  | `packages/core-personal/capabilityExecutor.test.ts`                    |                                                           |
| Sửa  | `packages/core-personal/toolRegistry.ts`                               | 2 manifest mới                                            |
| Sửa  | `packages/core-personal/toolRegistry.test.ts`                          |                                                           |
| Sửa  | `packages/core-personal/contextEngine.ts`                              | khối cố định + tóm tắt cuộn                               |
| Sửa  | `packages/core-personal/contextEngine.test.ts`                         |                                                           |
| Sửa  | `packages/core-personal/personErasureService.ts`                       | 3 bảng mới                                                |
| Sửa  | `packages/core-personal/personErasureService.integration.test.ts`      | seed 3 bảng mới                                           |
| Sửa  | `apps/server/src/api/personal/companion-memory.ts`                     | 3 công tắc, khối cố định, tóm tắt                         |
| Sửa  | `apps/server/src/api/personal/companion-memory.test.ts`                |                                                           |
| Sửa  | `apps/server/src/server.ts`                                            | bộ hẹn giờ phản tỉnh 10 phút (instance 0)                 |
| Sửa  | `apps/dhcb/src/lib/companionMemoryApi.ts`                              | khối cố định, tóm tắt, gợi ý chờ duyệt                    |
| Sửa  | `apps/dhcb/src/lib/companionMemoryApi.test.ts`                         |                                                           |
| Sửa  | `apps/dhcb/src/pages/companion/CompanionMemory.tsx`                    | 4 mục mới                                                 |
| Sửa  | `apps/dhcb/src/pages/companion/CompanionMemory.test.tsx`               |                                                           |
| Thêm | `apps/dhcb/src/pages/companion/CompanionMemorySections.tsx`            | gợi ý chờ duyệt + ô sửa khối cố định                      |
| Sửa  | `apps/dhcb/src/components/CompanionStudios/MemoryConsentCard.test.tsx` | thêm `suggestMemories` vào dữ liệu giả                    |
| Thêm | `e2e/a11y-companion-memory.spec.ts`                                    | cổng A/AA + AAA khi trang CÓ dữ liệu, 3 theme             |
| Thêm | `e2e/helpers/companionMemoryMocks.ts`                                  | dữ liệu giả chạm mọi mục mới                              |

**Ảnh hưởng lan ra (codemap):** `capabilityExecutor.ts` ← `proposedActionService.ts`;
`contextEngine.ts` ← `companionRuntime.ts`, `api/personal/context-package.ts`,
`scripts/eval-v2-privacy.ts`; `consentGrant.ts` ← `companion-memory.ts`, `companionMemoryApi.ts`,
`MemoryConsentCard.tsx`; `personErasureService.ts` ← `/api/persons`, `accountErasureService.ts`.

## ③ Hợp đồng dữ liệu

**DDL (migration `0096`, lũy đẳng, không cần superuser):**

```sql
-- Khối ghi nhớ cố định (Letta core memory) — người dùng tự viết.
create table if not exists personal.companion_core_blocks (
  id         uuid primary key default gen_random_uuid(),
  person_id  uuid not null references personal.persons(id) on delete cascade,
  label      text not null check (label in ('about_me', 'current_focus')),
  content    text not null check (char_length(content) between 1 and 1500),
  version    integer not null default 1 check (version >= 1),
  updated_at timestamptz not null default now(),
  unique (person_id, label)
);
-- Tóm tắt cuộn theo miền. summary rỗng = người dùng đã xoá (giữ con trỏ để không tóm tắt lại tin cũ).
create table if not exists personal.companion_conversation_summaries (
  id                    uuid primary key default gen_random_uuid(),
  person_id             uuid not null references personal.persons(id) on delete cascade,
  domain                text not null check (char_length(domain) between 1 and 100),
  summary               text not null default '' check (char_length(summary) <= 1500),
  summarized_through_at timestamptz not null,
  summarized_through_id uuid not null,
  version               integer not null default 1 check (version >= 1),
  updated_at            timestamptz not null default now(),
  unique (person_id, domain)
);
-- Con trỏ trích ký ức + chống chạy lại + trần lượt/ngày.
create table if not exists personal.companion_reflection_state (
  person_id            uuid primary key references personal.persons(id) on delete cascade,
  extracted_through_at timestamptz,
  extracted_through_id uuid,
  last_attempt_at      timestamptz,
  runs_day             date,
  runs_count           integer not null default 0 check (runs_count >= 0),
  updated_at           timestamptz not null default now()
);
alter table personal.memory_records drop constraint if exists memory_records_superseded_by_fkey;
alter table personal.memory_records add constraint memory_records_superseded_by_fkey
  foreign key (superseded_by) references personal.memory_records(id) on delete set null;
```

Rollback: gỡ mã + bộ hẹn giờ trước; rồi `drop table if exists` ba bảng (mất khối cố định/tóm tắt
— dữ liệu phụ, ký ức chính không đổi). FK `on delete set null` giữ lại được (vô hại).

**Contract:**

```ts
// consentGrant.ts
COMPANION_CONSENT_SCOPES.suggest = 'memory_suggestion.create'
CompanionMemorySettingsSchema = { rememberMemories, useHistory, suggestMemories: boolean } (strict)

// personalMemory.ts
CORE_MEMORY_BLOCK_MAX_CHARS = 1500 ; CONVERSATION_SUMMARY_MAX_CHARS = 1500
CoreMemoryBlockLabelSchema = z.enum(['about_me', 'current_focus'])
CoreMemoryBlockSchema = { label, content (0–1500), version (int ≥ 0; 0 = chưa có), updatedAt? }
ConversationSummarySchema = { domain, summary (0–1500), updatedAt }
```

**Payload ProposedAction (đều `targetDomain: 'personal'`, `riskLevel: 'medium'`):**

| Capability                 | payload                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| `memory.create_record`     | `{ namespace, content, importance, sourceMessageId?, origin: 'reflection' }`                |
| `memory.supersede_record`  | `{ targetRecordId, targetVersion, previousContent, content, importance, sourceMessageId? }` |
| `memory.invalidate_record` | `{ targetRecordId, targetVersion, previousContent, reason }`                                |

**API `/api/companion-memory`:**

| Phương thức | Vào                                                                            | Ra                                                        |
| ----------- | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `GET`       | —                                                                              | `{ settings, coreBlocks: CoreMemoryBlock[2], summaries }` |
| `POST`      | `{ action: 'set_settings', rememberMemories?, useHistory?, suggestMemories? }` | `{ settings }`                                            |
| `POST`      | `{ action: 'set_core_block', label, content (0–1500), expectedVersion }`       | `{ block }` — rỗng = xoá khối; lệch version ⇒ 409         |
| `POST`      | `{ action: 'clear_summary', domain }`                                          | `{ summaries }`                                           |

Gợi ý chờ duyệt dùng API có sẵn `GET /api/proposed-actions?status=pending` + `PATCH confirm|reject`
(không thêm route).

**Đầu ra AI (`memory_reflect`, JSON schema ép ở nhánh Claude, Zod kiểm ở mọi nhánh):**

```ts
{
  summaries: Array<{ domain: string; summary: string }>,
  operations: Array<{
    op: 'ADD' | 'UPDATE' | 'INVALIDATE'
    target: string   // id rút gọn ký ức sẵn có ("k1".."k10"), '' khi ADD
    source: string   // id rút gọn tin nhắn ("t1"..), '' nếu không rõ
    namespace: 'semantic' | 'preference' | 'commitment'
    content: string  // ≤ 300 ký tự; '' khi INVALIDATE
    importance: number // 1–10
    reason: string
  }>
}
```

Luật kiểm đầu ra (thao tác sai bị BỎ RIÊNG, không làm hỏng cả lượt): tối đa 5 thao tác; `target`
phải nằm trong danh sách ký ức đã đưa (UPDATE/INVALIDATE) và rỗng với ADD; nội dung 1–300 ký tự;
bỏ nội dung dạng mệnh lệnh nhắm vào AI ("bỏ qua hướng dẫn", "từ giờ hãy", "ignore previous",
"system prompt"…); bỏ nội dung khớp `prefilterCrisis`; bỏ ADD trùng nguyên văn ký ức đã có hoặc gợi
ý đang chờ; `summaries[].domain` phải là miền đã yêu cầu, cắt ≤ 1.500 ký tự. JSON hỏng / sai khuôn
toàn cục ⇒ coi như AI hỏng.

**Thuật toán một lượt quét (mỗi người):**

```text
ứng viên = người có tin nhắn trong 48 giờ, mới hơn last_attempt_at, tin cuối im ≥ 15 phút (≤ 20 người/lượt)
1. ghi last_attempt_at = now (trước gọi AI — tiến trình chết giữa chừng không quét lại vô hạn)
2. runs_day = hôm nay && runs_count ≥ 4 ⇒ bỏ qua
3. extract = consent(memory) && consent(suggest) ; summarize = consent(history)
4. tin hợp lệ = độ nhạy ≤ personal && prefilterCrisis(user) = null (lượt bị loại: bỏ cả câu trả lời đi kèm)
5. không có việc (không tin hợp lệ mới, không miền nào ≥ 14 tin chưa tóm tắt) ⇒ chỉ dời con trỏ, không gọi AI
6. checkAndConsumeUsage(userId, 'chat') — fail-closed; hết lượt ⇒ bỏ qua, KHÔNG dời con trỏ
7. gọi AI một lần; null / JSON hỏng ⇒ refundUsage, không dời con trỏ
8. ghi tóm tắt (upsert + con trỏ miền) ; mỗi thao tác hợp lệ ⇒ proposeAction (pending) ; dời con trỏ trích ; runs_count + 1
   trần 10 gợi ý ký ức đang chờ/người — vượt thì không đề xuất thêm (vẫn dời con trỏ)
```

**Ca lỗi (là một phần hợp đồng):**

| Tình huống                                          | Hành vi                                                                      |
| --------------------------------------------------- | ---------------------------------------------------------------------------- |
| Không có key AI nào                                 | Không gọi; hoàn lượt; thử lại ở lần có tin mới                               |
| Hết lượt AI trong ngày / cầu dao AI bật             | Bỏ qua người đó, không trừ, không dời con trỏ                                |
| AI trả JSON hỏng / sai khuôn                        | Hoàn lượt, log lý do máy đọc được (KHÔNG log nội dung), không dời con trỏ    |
| Một thao tác sai (id lạ, mệnh lệnh, khủng hoảng)    | Bỏ riêng thao tác đó; phần hợp lệ vẫn đề xuất                                |
| Xác nhận `supersede`/`invalidate` mà bản gốc đã đổi | 409 `ConflictError`; gợi ý vẫn `pending`, người dùng bấm "Bỏ qua"            |
| Lỗi ghi sau khi AI trả hợp lệ                       | Lượt vẫn tính (AI đã làm việc); log + Sentry; lần sau quét lại từ con trỏ cũ |
| Hai lượt quét chồng nhau                            | Cờ `running` trong tiến trình + chỉ instance 0 chạy                          |
| `set_core_block` lệch `expectedVersion`             | 409                                                                          |
| Khối cố định / tóm tắt đọc lỗi khi dựng ngữ cảnh    | Bỏ nhóm đó, lượt thoại vẫn trả lời                                           |

## ④ Tiêu chí chấp nhận

- [ ] `memoryReflectionPrompt.test.ts`: dựng prompt bọc `<tin>`/`<ky_uc>` có id rút gọn, gỡ thẻ giả
      trong nội dung; `parseReflectionOutput` (a) nhận đầu ra đúng; (b) bỏ thao tác target lạ, ADD có
      target, nội dung mệnh lệnh, nội dung khủng hoảng, ADD trùng; (c) cắt > 5 thao tác; (d) JSON
      hỏng ⇒ `ok: false`; (e) miền tóm tắt lạ bị bỏ, tóm tắt > 1.500 bị cắt.
- [ ] `memoryReflectionService.test.ts`: (a) không consent ⇒ 0 lời gọi AI, 0 trừ lượt; (b) chỉ
      `history` ⇒ có tóm tắt khi ≥ 14 tin, gộp đúng 10 tin cũ nhất, không đề xuất ký ức; (c) đủ
      consent ⇒ mỗi thao tác hợp lệ đúng một `proposeAction` `pending` với capability + payload
      đúng bảng; (d) hết lượt ⇒ không gọi AI, không dời con trỏ; (e) AI `null`/JSON hỏng ⇒ hoàn
      lượt đúng `day`, không dời con trỏ; (f) tin `sensitive` và lượt khớp từ khoá khủng hoảng
      không vào prompt; (g) trần 4 lượt/ngày; (h) trần 10 gợi ý đang chờ; (i) không có việc ⇒ dời
      con trỏ, không gọi AI.
- [ ] `memoryService.test.ts`: `supersede` tạo bản mới, bản cũ có `valid_to` + `superseded_by`,
      audit `INSERT` + `UPDATE`; bản cũ lệch version / đã quên / đã bị thay ⇒ 409; `invalidate`
      đặt `valid_to`, audit `UPDATE`.
- [ ] `capabilityExecutor.test.ts`: hai capability mới thi hành thật, nằm trong
      `CONFIRMATION_REQUIRED_CAPABILITIES`; `create_record` ghi `importance` + `sourceMessageId`
      (chỉ khi tin đó là của chính người đó).
- [ ] `contextEngine.test.ts`: bật `memory` ⇒ có khối cố định (đứng ngay sau câu hỏi); tắt ⇒ không;
      bật `history` ⇒ có tóm tắt đúng miền, đứng sau lịch sử; tóm tắt rỗng ⇒ không nạp; phiên tạm
      ⇒ không có cả hai.
- [ ] `companion-memory.test.ts`: GET trả 3 công tắc + 2 khối + tóm tắt; `set_core_block` (ghi,
      xoá bằng chuỗi rỗng, 409); `clear_summary`; `suggestMemories` cấp/thu hồi đúng scope.
- [ ] `CompanionMemory.test.tsx`: công tắc thứ ba bị khoá khi "Nhớ về tôi" tắt; gợi ý chờ duyệt
      hiện nội dung + bấm "Ghi nhớ"/"Bỏ qua" gọi confirm/reject với `expectedVersion`; ô khối cố
      định lưu với `expectedVersion`; ký ức có `validTo` không ở danh sách chính.
- [ ] `check:sql` PREPARE mọi câu mới; `migrate:pg` áp 0096 hai lần liền không lỗi; integration
      test xuất/xoá phủ đủ bảng có `person_id` (chạy tay với Postgres thật).
- [ ] Tầng 8b: ảnh chụp trang ký ức 1440 px + 390 px (trước/sau), cổng a11y AA/AAA xanh.

**Lệnh chứng minh:**

```bash
rm -rf packages/*/dist dist dist-server && npm run typecheck && npm run lint && npm run test:coverage && npm run build
npm run check:specs
```

## ⑤ Bất biến không được phá

| Bất biến                                                                              | Test nào canh nó                                                |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Mọi thay đổi ký ức do AI đề xuất đều `pending` cho tới khi người dùng bấm             | `memoryReflectionService.test.ts`, `capabilityExecutor.test.ts` |
| Không consent ⇒ không đọc transcript cho AI, không trừ lượt                           | `memoryReflectionService.test.ts`                               |
| Mọi lời gọi AI nền đều qua `checkAndConsumeUsage` (fail-closed) và hoàn lượt khi hỏng | `memoryReflectionService.test.ts`                               |
| Lượt khủng hoảng / dữ liệu nhạy cảm không vào prompt phản tỉnh                        | `memoryReflectionService.test.ts`                               |
| Vô hiệu không xoá: bản cũ còn trong bảng, `valid_to` có giá trị, truy xuất bỏ qua nó  | `memoryService.test.ts`, `memoryRetrieval.test.ts`              |
| Đường nóng (lượt trò chuyện) không thêm lời gọi AI nào                                | `companionRuntime.test.ts` (không đổi)                          |
| Không consent ⇒ khối cố định/tóm tắt không vào prompt; phiên tạm không đọc gì cá nhân | `contextEngine.test.ts`                                         |
| Trang ký ức không hiện `importance` (Luật số 1)                                       | `CompanionMemory.test.tsx`                                      |

## ⑥ Quy ước dự án liên quan

- Migration lũy đẳng, có số thứ tự, có dòng README; SQL tĩnh PREPARE được.
- Import xuyên gói `@dhcb/<gói>/<file>`; `packages/` không import `apps/` — đếm/hoàn lượt
  (`@dhcb/core-billing/usage`) được TIÊM từ `server.ts` vào service.
- Gọi AI: một lời gọi/lượt, trần token theo route, không tự thử lại, ghi token mode `memory_reflect`.
- Không log nội dung ký ức/tin nhắn; chỉ log số đếm và lý do máy đọc được.
- Giao diện: chữ AAA, điều khiển AA, vùng chạm ≥ 44 px, 3 theme, token màu.

---

## Nghiệm thu

- Lệnh đã chạy + kết quả thật: xem changelog `0617`.
- Để ngỏ (việc tay chủ dự án): sau deploy chạy `migrate:pg` (0096); bật ba công tắc trên tài khoản
  thật, trò chuyện vài lượt, chờ ≥ 25 phút rồi xem mục "Gợi ý chờ bạn duyệt".
