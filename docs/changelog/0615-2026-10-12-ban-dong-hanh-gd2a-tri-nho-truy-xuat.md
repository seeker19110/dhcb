# 0615 — Bạn Đồng Hành GĐ2a: ký ức thật sự được đọc · truy xuất lai · trang "nhớ gì về tôi" · phiên không lưu

- **Ngày:** 2026-10-12 · **PR:** #1375 · **Loại:** `feat(companion)`
- **Đặc tả:** `docs/specs/2026-10-11-ban-dong-hanh-gd2a-tri-nho-truy-xuat.md` (Approved for
  implementation). **ADR:** `docs/adr/0015-tri-nho-companion-lai-fts-embedding-khong-pgvector.md`.
  **Nghiên cứu:** `docs/research/nang-cap-ban-dong-hanh-2026-10-11.md` (mục GĐ2 tách 2a/2b).
- **Nguồn việc:** chủ dự án nói "bắt đầu GĐ2"; qua hỏi đáp chốt **Gemini embedding, KHÔNG
  pgvector** và **tách GĐ2a (đọc/truy xuất/trang ký ức) — GĐ2b (trích xuất sau phiên, khối lõi,
  tóm tắt cuộn)**.

## Vấn đề (đo trong mã trước đợt này)

1. **Lỗi im lặng trên production:** `contextEngine` kiểm consent scope `personal_memory` /
   `personal_facts` / `life_graph` / `<domain>` (không dấu chấm), còn `ConsentGrantSchema` và
   `/api/consents` chỉ nhận `resource.action` — **không có đường nào cấp được**, nên mọi cổng đọc
   ngữ cảnh cá nhân luôn đóng: Bạn Đồng Hành chưa từng nhớ gì, chưa từng đọc hồ sơ/mục tiêu/lịch
   sử, dù người dùng có nói "ghi nhớ…" và xác nhận.
2. Ký ức (nếu đọc được) chỉ là "10 bản mới nhất", không theo câu đang hỏi; không có điểm quan
   trọng / lần dùng gần nhất; không có `version` để client sửa/quên an toàn.
3. Không có chỗ nào cho người dùng xem Bạn Đồng Hành nhớ gì, sửa hay quên; không có cách "nói
   chuyện mà không lưu". `purgeExpiredMemories` có từ V2-06 nhưng chưa từng được lên lịch.

## Đã làm

- **Consent chuẩn** `packages/core-contracts/consentGrant.ts`: `COMPANION_CONSENT_PURPOSE`
  (`companion_conversation`) + `COMPANION_CONSENT_SCOPES` = hai công tắc `personal_memory.read`
  (ký ức + hồ sơ + đồ thị mục tiêu) và `companion_history.read` (lịch sử). `contextEngine` chỉ hỏi
  đúng hai scope này; **tóm tắt môn học (`domainState`) KHÔNG qua công tắc** — là dữ liệu app người
  dùng vẫn thấy ở bảng điều khiển.
- **API cài đặt** `GET/POST /api/companion-memory` (`apps/server/src/api/personal/companion-memory.ts`):
  bật → `grantConsent`, tắt → `revokeConsent` bản active, lũy đẳng; đọc lại trạng thái sau khi ghi.
  `/api/memories` thêm `action: 'update'` (`updateMemoryContent`, khoá `for update`, 409 khi lệch
  `expectedVersion`, audit `UPDATE`).
- **Migration `0094`** (`unaccent` trusted, không cần superuser): `importance`, `last_accessed_at`,
  `access_count`, `valid_from/valid_to`, `superseded_by`, `source_message_id`, `embedding real[]`,
  `embedding_model`, cột sinh `search_tsv` (`to_tsvector('simple', immutable_unaccent(content))`) +
  GIN + chỉ mục partial cho tập "sống". `MemoryRecord` lên v2 (`version`, `importance`,
  `hasEmbedding`…).
- **Embedding Gemini** `packages/core-ai/embeddings.ts` (`gemini-embedding-2`, 768 chiều,
  `batchEmbedContents`, timeout 8 s, ghi usage mode `embedding`); không có `GEMINI_API_KEY` → `null`,
  mọi thứ vẫn chạy. Ghi ký ức (`ingest`/`merge`/`update`) tự nhúng, lỗi nhúng không chặn ghi.
- **Truy xuất lai** `packages/core-personal/memoryRetrieval.ts`: FTS (bỏ dấu, OR token) + cosine
  trong Node trên ≤ 300 ứng viên + RRF (k=60) → điểm 3 thành phần (recency 0.995^giờ · importance/10 ·
  relevance)/3, tập nền 20 ký ức quan trọng nhất; chạm `last_accessed_at` sau truy xuất.
  `contextEngine` dùng `searchMemories(query = câu đang hỏi, limit 10)`; lỗi truy xuất → bỏ nhóm ký
  ức, lượt vẫn trả lời.
- **Phiên không lưu (`ephemeral`)** xuyên client → handler → runtime: `includePersonalContext:false`
  - `includeCompanionHistory:false`, bỏ bước `memory.create_record` kể cả khi câu có "ghi nhớ",
    không ghi transcript; **lớp an toàn vẫn chạy**.
- **Giao diện:** trang `/ban-dong-hanh/ky-uc` "Bạn Đồng Hành nhớ gì về tôi" (hai công tắc
  `role="switch"`, danh sách sửa/quên với `expectedVersion`, 4 trạng thái tải/rỗng/lỗi/cần 2FA,
  KHÔNG hiện `importance`); thanh gọn `MemoryConsentCard` NGAY DƯỚI ô nhập trong studio trò
  chuyện (mời bật ký ức một nút = cấp cả hai consent; công tắc "Phiên không lưu" giữ trong
  `sessionStorage`; nhãn `role="status"` đổi chữ khi đang bật). Vị trí chốt sau hai lần đổi do
  NHÌN ảnh + CI: đặt thành thẻ to TRONG khung chat thì ăn vùng cuộn ở 390px; đặt NGOÀI khung thì
  đẩy nút gợi ý nhanh ra khỏi màn 1440×900 (`e2e/companion-history.spec.ts:95` đỏ trên CI, đo
  thật chỉ dư ~37px) → thanh một dòng dưới ô nhập không thêm chiều cao bố cục.
- **Job ngày** `startCompanionMemoryMaintenance` (server.ts): `purgeExpiredMemories` +
  `backfillMemoryEmbeddings(…, 200)`. `.env.example` thêm `GEMINI_EMBEDDING_MODEL` (tuỳ chọn).
- Dọn: `stripVietnameseDiacritics` dời sang `vietnameseText.ts` (safetyGuard re-export);
  `scripts/eval-v2-privacy.ts` + skill `life-career-strategic-advisor` đổi scope cũ sang chuẩn;
  skill `principal-engineer-architect` ghi truy xuất lai là ĐANG CÓ (cả bản gương `.agents/`);
  `docs/FEATURE-MAP.md` sinh lại (`gen:feature-map`).

## Quyết định

- Không pgvector (ADR-0015): extension không trusted → cần superuser trên VPS; ≤ 300 vector/người
  tính cosine trong Node là đủ, giữ migration chạy được bằng user app.
- Trích xuất ký ức tự động sau phiên (mem0-style) để GĐ2b — GĐ2a chỉ làm cho đường ĐỌC đúng và cho
  người dùng cầm lái. Ghi ký ức vẫn LUÔN qua `ProposedAction` (bất biến không đổi).
- Người chưa bật công tắc: Companion hoạt động như trước (không ngữ cảnh cá nhân) nhưng nay thấy thẻ
  mời bật — không tự cấp consent thay người dùng.

## Bằng chứng

- `npx vitest run packages/core-personal/contextEngine.test.ts` → 29 passed (thêm: chỉ hỏi hai
  scope chuẩn; `searchMemories` nhận đúng câu/limit/ngưỡng, lỗi không làm hỏng gói;
  `includePersonalContext:false` không hỏi consent, vẫn có `domainState`; hai công tắc độc lập).
- `memoryRetrieval.test.ts` + `memoryService.test.ts` → 47 passed; `packages/core-ai/embeddings.test.ts`
  → 9 passed; `companionRuntime.test.ts` → 71 passed (4 ca ephemeral).
- Server: `companion-memory.test.ts` → 10 passed; `memories.test.ts` + `companion.test.ts` + routes
  → 39 passed. Client: `companionMemoryApi.test.ts` → 8 passed; `CompanionMemory.test.tsx` → 8
  passed; `pages/companion` + `CompanionStudios` → 52 passed.
- `npm run check:specs` → OK (180 đặc tả). Cổng đầy đủ + ảnh chụp 1440/390 (Tầng 8b): xem mô tả PR.
- `MemoryConsentCard.test.tsx` → 4 passed; `e2e/companion-history.spec.ts` → 4/4 xanh ở máy sau khi dời
  thanh xuống dưới ô nhập (ca 1440×900 từng đỏ trên CI).

## Chưa làm / tiếp theo

- **GĐ2b:** trích xuất ký ức sau phiên (ADD/UPDATE/DELETE/NOOP qua `ProposedAction`), khối lõi
  (core blocks) + tóm tắt cuộn 70/50 — đặc tả riêng, chờ chủ dự án duyệt. Rồi GĐ3, GĐ4.
- Việc tay: deploy xong chạy `npm run migrate:pg` (0094 cần `CREATE EXTENSION unaccent` — trusted,
  user app chạy được; nếu VPS từ chối thì chạy một lần bằng superuser), kiểm `GEMINI_API_KEY` có
  trên production để embedding hoạt động; bật hai công tắc trên tài khoản thật rồi nói "ghi nhớ…"
  và xem `/ban-dong-hanh/ky-uc`.
- Đề xuất ghi `TRAPS.md`: "scope consent không khớp khuôn schema → cổng đóng im lặng, không test nào
  đỏ" (chờ chủ dự án duyệt qua `/learn`).
