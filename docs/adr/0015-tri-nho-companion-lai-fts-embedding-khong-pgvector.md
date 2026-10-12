# ADR-0015: Trí nhớ Companion — truy xuất lai FTS + embedding Gemini, KHÔNG dùng pgvector

- **Trạng thái:** Đã chấp nhận (chủ dự án chốt 2026-10-11, câu hỏi "Embedding" trong phiên)
- **Ngày:** 2026-10-11

## Bối cảnh

Kế hoạch nâng cấp Bạn Đồng Hành (`docs/research/nang-cap-ban-dong-hanh-2026-10-11.md`, GĐ2) cần
Companion **tìm ký ức theo nghĩa** ("kỳ thi tiếng Anh" phải khớp ký ức "thi IELTS tháng 12") chứ
không chỉ lấy "10 ký ức mới nhất". Chuẩn ngành là pgvector + một API embedding. Ràng buộc thật
của dự án, kiểm 2026-10-11 bằng nguồn sống (agent `version-check`):

- **Anthropic không có API embedding** — tài liệu chính thức khuyên dùng nhà cung cấp khác (Voyage).
- **pgvector KHÔNG phải trusted extension**: `create extension vector` cần superuser. VPS cài
  PostgreSQL 16 qua apt với user app `dhcb_app` không phải superuser
  (`docs/setup-postgresql-vps.md`); CI job `sql-prepare` dùng image `postgres:16` thường, kéo từ
  ECR Public vì Docker Hub từng chặn pull (`.github/workflows/ci.yml`). Thêm pgvector = một việc
  tay trên VPS + đổi image CI + thêm điểm hỏng.
- **`unaccent` là trusted extension** (PostgreSQL 16, F.48) — user có CREATE trên database tạo
  được, tức `npm run migrate:pg` tự cài, không cần việc tay.
- Mỗi người chỉ có **vài chục đến vài trăm** ký ức (`personal.memory_records`, nội dung ≤ 2000 ký
  tự). Chỉ mục vector (HNSW/IVFFlat) vô nghĩa ở quy mô này: tính cosine trên ≤ 300 vector 768
  chiều trong Node mất dưới 1 ms.
- Dự án đã có `GEMINI_API_KEY` (hội thoại dự phòng + TTS). `gemini-embedding-2` có free tier,
  trả phí $0,20/1M token; Voyage `voyage-4-lite` $0,02/1M nhưng phải mở tài khoản MongoDB Atlas
  mới và thêm key.

## Quyết định

1. **Không cài pgvector.** Embedding lưu ở cột `embedding real[]` (768 chiều, đã chuẩn hoá L2)
   trên `personal.memory_records`; tìm theo nghĩa = tải tối đa 300 ký ức đang hiệu lực của ĐÚNG
   người đó rồi tính cosine trong Node.
2. **Tìm chữ bằng Postgres FTS** cấu hình `simple` + `unaccent` (qua hàm bọc IMMUTABLE
   `personal.immutable_unaccent`) trên cột sinh `search_tsv` + chỉ mục GIN. Truy vấn nối OR các
   token đã bỏ dấu (tiếng Việt không biến hình nên `simple` là đủ).
3. **Gộp hai danh sách bằng RRF (k = 60)** rồi chấm điểm 3 thành phần theo Generative Agents:
   `recency = 0.995^giờ` tính từ lần truy xuất gần nhất (hoặc lúc tạo), `importance/10`,
   `relevance` = RRF chuẩn hoá về [0, 1]; trọng số bằng nhau. Luôn cộng thêm 20 ký ức quan trọng
   nhất vào tập ứng viên để lượt "xin chào" vẫn có ký ức nền.
4. **Nhà cung cấp embedding là Gemini `gemini-embedding-2`** qua lớp
   `packages/core-ai/embeddings.ts` (giao diện `EmbeddingProvider` — đổi sang Voyage sau chỉ là
   thêm một adapter). Tiền tố theo tài liệu Gemini: truy vấn `task: search result | query: …`,
   tài liệu `title: none | text: …`. Không có key → **chỉ tìm chữ**, không bao giờ lỗi.
5. Embedding tính lúc ghi ký ức (một lời gọi) và một lời gọi cho câu hỏi mỗi lượt Companion khi
   công tắc ký ức bật; ký ức chưa có embedding được job đêm bù dần (≤ 200/ngày).

## Lý do

Giữ đúng ưu tiên "miễn phí / chi phí thấp, không thêm việc tay cho VPS" (CLAUDE.md mục 7) mà
vẫn có tìm theo nghĩa thật. Lợi ích của pgvector ở quy mô vài trăm dòng/người bằng 0, còn chi phí
vận hành thì thật. Gemini được chọn vì **không cần key mới** — chọn Voyage sẽ rẻ hơn khi trả phí
nhưng tốn một tài khoản và một bí mật nữa; đổi sau không đau nhờ lớp `EmbeddingProvider`.

## Các phương án đã cân nhắc

- **pgvector thật:** chuẩn ngành, nhưng cần superuser trên VPS + đổi image CI (nguồn pull từng
  bị chặn) — lợi ích 0 ở quy mô này. Không chọn.
- **Voyage `voyage-4-lite`:** chất lượng đa ngôn ngữ được quảng cáo tốt hơn, rẻ hơn khi trả phí;
  cần tài khoản/key mới. Để ngỏ — thêm adapter nếu đo thấy Gemini kém trên tiếng Việt.
- **Chỉ FTS (không embedding):** miễn phí, không phụ thuộc ngoài; không khớp đồng nghĩa. Là
  **đường dự phòng** của phương án đã chọn, không phải phương án chính.

## Hệ quả

- Migration `0094` chạy được bằng user app trên VPS và trong CI (`unaccent` trusted).
- Trần cứng 300 ký ức hiệu lực/người đưa vào so sánh nghĩa; vượt trần thì lấy theo
  `last_accessed_at`/`importance` — ghi rõ trong mã, không phải giới hạn ngầm.
- Chi phí: ~1 lời gọi embedding/lượt Companion (≤ 2 000 ký tự ≈ 600 token) — free tier hoặc
  ≈ $0,0001/lượt khi trả phí. Ghi token vào `ai_token_usage` mode `embedding` để nhìn thấy.
- Nếu Gemini đổi tên model, biến `GEMINI_EMBEDDING_MODEL` đổi được không cần sửa mã; đổi SỐ
  CHIỀU thì phải tính lại embedding (cột `embedding_model` ghi model đã dùng để job bù nhận ra).
