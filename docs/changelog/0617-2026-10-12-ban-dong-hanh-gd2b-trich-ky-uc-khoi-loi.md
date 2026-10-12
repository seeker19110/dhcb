# 0617 — Bạn Đồng Hành GĐ2b: gợi ý ký ức sau buổi trò chuyện (chờ duyệt) · ghi nhớ cố định · tóm tắt cuộn

- **Ngày:** 2026-10-12 · **PR:** (điền khi tạo) · **Loại:** `feat(companion)`
- **Đặc tả:** `docs/specs/2026-10-12-ban-dong-hanh-gd2b-trich-ky-uc-khoi-loi.md` (Approved for
  implementation). **Nghiên cứu:** `docs/research/nang-cap-ban-dong-hanh-2026-10-11.md` (GĐ2 tách
  2a/2b). Nối tiếp GĐ2a (changelog `0615`, PR #1375).
- **Nguồn việc:** chủ dự án nói "viết đặc tả GĐ2b Companion rồi làm".

## Vấn đề (đo trong mã trước đợt này)

1. Ký ức chỉ được ghi khi người dùng nói đúng "ghi nhớ…" trong một câu. Những điều đã kể qua nhiều
   lượt (mục tiêu đổi, thói quen học) không bao giờ thành ký ức; ký ức cũ sai không có đường nào
   đánh dấu "không còn đúng" ngoài việc người dùng tự vào trang ký ức bấm Quên.
2. Không có chỗ người dùng tự viết điều Bạn Đồng Hành luôn cần biết ("Về tôi", "Đang tập trung").
3. Lịch sử đưa vào ngữ cảnh chỉ là vài lượt gần nhất; mọi buổi trước đó coi như mất.

## Đã làm

- **Migration `0096`** (lũy đẳng, đã chạy 2 lần trên Postgres 16): `personal.companion_core_blocks`
  (2 nhãn, ≤ 1.500 ký tự, `version`), `personal.companion_conversation_summaries` (theo miền, con
  trỏ `summarized_through_at/id`), `personal.companion_reflection_state` (con trỏ trích xuất, trần
  lượt/ngày); chỉ mục `companion_messages(person_id, created_at, id)`; FK `superseded_by` đổi sang
  `on delete set null` để xoá bản mới không gãy bản cũ.
- **Bộ phản tỉnh** `packages/core-personal/memoryReflectionService.ts` + prompt/kiểm đầu ra
  `memoryReflectionPrompt.ts`: bộ hẹn giờ 10 phút ở PM2 instance 0 (`apps/server/src/server.ts`),
  chọn người có buổi im ≥ 15 phút trong 48 giờ; kiểm consent; gọi AI nhiệm vụ mới `memory_reflect`
  (Haiku, `packages/core-ai/aiConfig.ts`) qua `generateChatText` với JSON Schema; **đếm lượt qua
  `checkAndConsumeUsage` (fail-closed), hoàn lượt khi AI không trả / JSON hỏng**; trần 4 lần/người/ngày,
  ≤ 5 thao tác/lần, ≤ 10 gợi ý đang chờ.
- **AI chỉ ĐỀ XUẤT**: mỗi thao tác thành một ProposedAction `pending` — `memory.create_record`,
  `memory.supersede_record`, `memory.invalidate_record` (hai cái sau mới, thêm vào
  `CONFIRMATION_REQUIRED_CAPABILITIES` + `toolRegistry`). Thay/vô hiệu đặt `valid_to` +
  `superseded_by` (kiểu Zep), không xoá; khoá dòng `for update`, lệch `version` ⇒ 409.
- **Rào an toàn trước khi vào prompt:** bỏ tin có độ nhạy > `personal` và tin khớp
  `prefilterCrisis`; chỉ tin người dùng có id tham chiếu; bọc thẻ + gỡ `<>` (Spotlighting); sau AI
  bỏ riêng từng thao tác trỏ id lạ, mang mệnh lệnh, chạm khủng hoảng, lộ PII hoặc trùng; không log
  nội dung. Truy xuất ứng viên dùng `touch: false` để bước nền không làm sai "lần dùng gần nhất".
- **Khối ghi nhớ cố định + tóm tắt cuộn** `packages/core-personal/coreMemoryBlocks.ts`, nạp vào
  ngữ cảnh qua `contextEngine` (khối cố định khi bật "Nhớ về tôi", tóm tắt khi bật "Dùng lịch sử");
  đọc lỗi thì bỏ nhóm đó, lượt vẫn trả lời. Tóm tắt kiểu Letta 70/50: cửa sổ 20 tin, đủ 14 tin chưa
  tóm tắt thì gập 10 tin cũ nhất vào bản cũ (≤ 1.500 ký tự).
- **Công tắc thứ ba** "Gợi ý điều nên nhớ" = consent `memory_suggestion.create`
  (`packages/core-contracts/consentGrant.ts`), mặc định tắt, chỉ bật được khi "Nhớ về tôi" bật.
- **API** `/api/companion-memory`: `GET` trả thêm `coreBlocks` + `summaries` (không lộ id/con trỏ);
  `POST` thêm `set_core_block` (khoá phiên bản) và `clear_summary` (xoá nội dung, giữ con trỏ để
  không tóm tắt lại tin cũ).
- **Xuất/xoá dữ liệu cá nhân** (`personErasureService.ts`): thêm 3 bảng mới; bản xuất ký ức có
  thêm `importance`, `valid_from/valid_to`, `superseded_by`, `source_message_id`.
- **Giao diện** `/ban-dong-hanh/ky-uc`: mục "Gợi ý chờ bạn duyệt" (Ghi nhớ/Đồng ý bỏ · Bỏ qua),
  "Ghi nhớ cố định" (2 ô, bộ đếm ký tự, 409 khi sửa chồng), danh sách chính chỉ còn ký ức đang hiệu
  lực + khối gập "Thông tin cũ đã được thay" (dùng `Disclosure` có mũi tên), "Tóm tắt các buổi
  trước" có nút xoá. Thành phần mới tách ở `CompanionMemorySections.tsx`. Không hiện `importance`
  (Luật số 1).
- **Cổng a11y mới** `e2e/a11y-companion-memory.spec.ts` (+ dữ liệu giả `e2e/helpers/companionMemoryMocks.ts`):
  quét trang KHI CÓ dữ liệu ở 3 theme, A/AA và AAA cho chữ nội dung. `a11y.spec.ts` chỉ thấy trạng
  thái lỗi tải vì không giả lập API. Cổng mới bắt ngay một lỗi có từ GĐ2a: liên kết "phòng trò
  chuyện" ở theme sáng chỉ đạt 6,96:1 (< 7:1) — đổi `theme-light:text-accent-800` → `-900`.

## Quyết định

- Bước nền KHÔNG ghi thẳng ký ức: mọi thay đổi đi qua duyệt, đúng nguyên tắc "Planning ≠ Execution
  ≠ State Mutation" và Luật số 1. Lượt AI nền tính vào hạn mức ngày của người dùng (đã nói rõ trên
  trang); lỗi ghi sau khi AI trả hợp lệ vẫn tính lượt.
- Lần đầu bật "Dùng lịch sử" khi đã có lịch sử dài: chỉ tóm tắt trong cửa sổ 20 tin gần nhất, không
  gom cả quá khứ vào một lần gọi.

## Bằng chứng kiểm chứng

- Unit: `memoryReflectionService` 23 · `memoryReflectionPrompt` 15 · `coreMemoryBlocks` 10 ·
  `memoryService` 41 · `capabilityExecutor` 17 · `contextEngine` 35 · `memoryRetrieval` 13 ·
  `toolRegistry` 8 · `companion-memory` (API) 16 · `companionMemoryApi` 13 · `CompanionMemory` 16 —
  xanh. `personErasureService.integration` 16 xanh trên Postgres 16 thật.
- Chạy thật trên Postgres 16 (script tạm, đã xoá): đề xuất 2 mục → duyệt được → bản cũ có
  `valid_to` + `superseded_by` → tóm tắt được ghi → lượt quét thứ hai bỏ qua → xoá bản mới không gãy
  khoá ngoại. `npm run check:sql` không lỗi ngoài allowlist.
- E2E `e2e/a11y-companion-memory.spec.ts` 6/6 xanh. Tầng 8b: chụp 1440px + 390px (blue-sky,
  dark-blue) trước/sau với cùng dữ liệu giả. Sau: bốn mục mới đủ, không tràn ngang, khối gập có mũi
  tên, nút chạm ≥ 44px. Trước: ký ức đã bị thay nằm lẫn trong danh sách chính; ô công tắc báo lỗi
  tải vì hợp đồng cũ `strict` từ chối khoá `suggestMemories` mới — đúng rủi ro rollout ghi ở PR
  (bundle cũ còn trong bộ nhớ đệm thấy trạng thái lỗi có nút "Thử lại" cho tới khi tải lại trang).
- Cổng: typecheck · lint (0 cảnh báo) · prettier · test:coverage · build · check:specs.
