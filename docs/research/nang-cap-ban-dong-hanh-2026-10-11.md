# Nghiên cứu — Nâng cấp "Bạn Đồng Hành" toàn diện (2026-10-11)

- **Trạng thái:** Approved for implementation — chủ dự án chốt 2026-10-11 "làm lần lượt cả 4 giai
  đoạn, mỗi giai đoạn một PR", lớp an toàn chọn "bộ lọc từ khoá + bộ phân loại Haiku".
- **Yêu cầu gốc:** "nghiên cứu các repo trên GitHub và các AI agent nổi tiếng, nâng cấp Bạn Đồng
  Hành toàn diện nhất có thể".
- **Cách nghiên cứu:** một agent đọc NGUỒN GỐC (README/paper/tài liệu chính thức) của từng hệ
  thống ngày 2026-10-11; mục nào chỉ có nguồn thứ cấp được ghi rõ `[thứ cấp]`. Phần "áp vào DHCB"
  là của phiên chính, đã đối chiếu với mã thật.

## 1. Hiện trạng đo trong mã (trước đợt này)

| Điểm             | Mã thật                                                                                                                                        | Hệ quả người dùng thấy                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| "Stream"         | `streamCompanionTurn` chờ AI viết xong cả câu rồi `split(' ')` phát từng từ                                                                    | Chờ trọn thời gian sinh câu rồi chữ mới chạy — stream giả                                                 |
| Cắt lịch sử      | `contextEngine` đẩy lịch sử cũ → mới, vòng gói ngân sách `break` ở mục đầu không vừa                                                           | Hết ngân sách (2000 token) là mất **lượt vừa nói**, nhớ chuyện 10 lượt trước                              |
| Prompt hệ thống  | Kể 5 lĩnh vực gồm Sự nghiệp · Khởi nghiệp · Đời sống (đã xoá 2026-09-20); không có ngày giờ; không theo nhóm tuổi; dữ liệu người dùng chữ trần | Hứa tính năng không có; đoán "mai thứ mấy"; dễ bị chèn lệnh từ ghi chú                                    |
| An toàn          | Không có lớp nào nhận ra tự hại / bị bạo hành                                                                                                  | Có người dùng `nhi_dong`/`thieu_nien` mà AI trả lời như lượt thường, còn đề xuất "lưu ký ức" chính câu đó |
| Ý định · công cụ | Bảng từ khoá; 4 capability; "ghi nhớ"/"cập nhật hồ sơ" lưu NGUYÊN câu                                                                          | Ký ức thô, không có cấu trúc                                                                              |
| Trí nhớ          | `memory_records` lấy "10 cái mới nhất" theo namespace; trùng lặp bằng so chuỗi con; không tự trích ký ức từ hội thoại                          | Không xếp theo độ liên quan; không học được gì từ hội thoại nếu người dùng không bảo "ghi nhớ"            |
| Chủ động         | `proactiveAgentService` giữ state trong `Map` bộ nhớ tiến trình, số liệu `circadianEnergy`/`stressIndex` không có nguồn thật                   | Bản tin/nhắc nhở không dựa trên dữ liệu người dùng                                                        |

## 2. Những gì học được từ các hệ thống nổi tiếng (kèm cách áp)

### 2.1. Trí nhớ

- **Generative Agents (Stanford, arXiv 2304.03442):** điểm truy xuất = recency + importance +
  relevance, mỗi thành phần chuẩn hoá [0,1], trọng số bằng nhau; recency = `0.995^giờ` tính từ
  lần **truy xuất** gần nhất; importance 1–10 chấm một lần lúc ghi; **phản tỉnh** khi tổng
  importance gần đây vượt ngưỡng (150) → sinh 3 câu hỏi nổi bật → rút 5 nhận định có dẫn chứng.
  → **Áp (GĐ2):** cột `importance`, `last_accessed_at`, `embedding` (pgvector); SQL tính điểm
  trên top-50 pre-filter; thay "10 cái mới nhất".
- **mem0 (`mem0ai/mem0`, arXiv 2504.19413):** trích fact từ tóm tắt cuộn + 10 tin gần nhất → với
  mỗi fact tìm 10 ký ức giống nhất → LLM chọn `ADD | UPDATE | DELETE | NONE` với id có sẵn; viết
  fact **bằng ngôn ngữ đầu vào**; lời chào/đệm → `facts: []`. Tóm tắt cuộn cập nhật **ngoài
  đường nóng**. → **Áp (GĐ2):** thay dedupe chuỗi con bằng pipeline này (Haiku, schema chặt), chạy
  **debounce** sau phiên; ghi hồ sơ vẫn qua ProposedAction; preference rủi ro thấp tự áp kèm
  thông báo + hoàn tác.
- **Zep/Graphiti (arXiv 2501.13956):** fact hai trục thời gian (`valid_at/invalid_at` +
  `created/expired`); mâu thuẫn → **vô hiệu**, không xoá; mọi fact nối về "tập" nguồn. Truy xuất
  kết hợp cosine + BM25 + RRF. → **Áp (GĐ2):** `valid_from/valid_to/superseded_by/
source_message_id`; `tsvector` (`simple` + `unaccent`) + pgvector, gộp RRF (k=60). Companion
  nói được "trước đây bạn nhắm 6.5…".
- **Letta/MemGPT (arXiv 2310.08560, docs.letta.com):** khối ký ức lõi nhỏ luôn nạp (`human`,
  `persona`…, có `limit` ký tự, model tự sửa qua tool); cảnh báo ở ~70% cửa sổ, tới 100% thì đẩy
  ~50% tin cũ ra và cập nhật **tóm tắt đệ quy**. → **Áp (GĐ2):** 2–3 khối lõi ≤ 1.500 ký tự/người
  luôn nạp; tóm tắt cuộn `conversation_summary` theo luật 70/50.
- **ChatGPT memory `[thứ cấp]`:** hai công tắc tách bạch (ký ức đã lưu · tham chiếu lịch sử),
  trang "Quản lý ký ức", chat tạm không nhớ. → **Áp (GĐ2):** trang "Bạn Đồng Hành nhớ gì về
  tôi" (xem/sửa/xoá), công tắc trích ký ức ngầm, chế độ phiên tạm — quan trọng với trẻ em/phụ huynh.
- **Claude memory tool / context editing (platform.claude.com):** mô hình file không hợp với
  ký ức có namespace + cổng xác nhận; **mượn checklist bảo mật** (kiểm path, trần kích thước,
  hết hạn ký ức không ai đọc, tước dữ liệu nhạy cảm trước khi ghi).

### 2.2. Vòng lặp tác tử · công cụ

- **Anthropic "Building effective agents":** workflow (routing, evaluator-optimizer) trước, agent
  sau; agent cần điều kiện dừng (số bước tối đa), sự thật từ môi trường mỗi bước, điểm dừng chờ
  người. Tool description viết như docstring cho junior; "poka-yoke" tham số. → **Áp (GĐ3):**
  bộ định tuyến ý định bằng Haiku + schema chặt (từ khoá là fallback); công cụ CHỈ-ĐỌC (tiến độ
  học, ghi chú, từ điển, thẻ ôn) cho model tự gọi, tối đa 4 bước; công cụ GHI vẫn qua
  ProposedAction.
- **Claude strict tool use:** `strict: true` + `additionalProperties:false` bảo đảm hình dạng —
  vẫn phải Zod + kiểm quyền ở server.
- **OpenAI Agents SDK (guardrails/HITL) · LangGraph interrupt · smolagents:** guardrail chặn trước
  model (không tốn token) cho người dưới 18; đề xuất lưu server kèm hash tham số, duyệt lũy đẳng
  (`pending → approved → executed` trong một UPDATE), executor sau duyệt lũy đẳng; trần bước 4–5
  (`max_iterations` của SDK mặc định KHÔNG giới hạn); `final_answer_checks` (không lộ lời giải
  Socratic, đúng ngôn ngữ, tước dữ liệu cá nhân).

### 2.3. Trải nghiệm đồng hành · gia sư

- **Khanmigo (blog Khan Academy):** "meet learners where they are", mời tự giải thích, kinh tế
  ngôn từ, **không emoji ở chủ đề nghiêm trọng**, prompt dài làm model bỏ sót; dưới 18 chỉ qua
  phụ huynh/trường, cảnh báo kiểm duyệt gửi người lớn. → **Áp (GĐ1):** vào prompt.
- **Duolingo Max `[thứ cấp]`:** "Explain My Answer" sau bài sai; kịch bản roleplay do chuyên gia
  viết theo CEFR, kết phiên có nhận xét. → Ý tưởng cho môn Anh (ngoài đợt này).
- **Pi (Inflection) `[thứ cấp]`:** ấm nhưng **không nhận có cảm xúc**, không "nhớ bạn". → GĐ1.
- **Chống xu nịnh:** OpenAI 4o (2025-04) hỏng vì tín hiệu thumbs-up lấn át; Anthropic đo bằng
  Petri, warmth ↔ sycophancy đánh đổi. → GĐ1 luật prompt; GĐ3 thêm ca xu nịnh vào eval.
- **Chủ động (ChatGPT Pulse `[thứ cấp]`, OpenAI "What we're optimizing ChatGPT for"):** thẻ
  sáng từ ký ức + mục tiêu, có 👍/👎, trần số thẻ/ngày, nhắc nghỉ khi phiên dài; đo "rời đi đã
  làm xong việc" chứ không đo thời gian ở lại. → **Áp (GĐ4):** cron đêm ≤ 3 thẻ/người từ mục tiêu
  - thẻ ôn đến hạn + phản tỉnh; không có thông điệp tội lỗi về streak cho trẻ.

### 2.4. An toàn cho người dùng nhỏ tuổi

- **Đường dây ở Việt Nam (đã kiểm):** **111** Tổng đài quốc gia bảo vệ trẻ em, miễn phí 24/7 (nay
  thuộc Cục Bà mẹ và Trẻ em, Bộ Y tế — báo cáo 2025 của tổng đài); **115** cấp cứu; **Ngày Mai
  096 306 1414** miễn phí nhưng giờ giới hạn (~13:00–20:30, Thứ Tư–CN theo befrienders.org /
  findahelpline.com — kiểm lại trước khi đổi).
- **Anthropic (protecting well-being):** bộ phân loại + banner khủng hoảng; Haiku 4.5 đúng 99,3% ca
  đơn lượt, **yếu hơn rõ ở đa lượt** → bộ phân loại nhận vài lượt gần đây.
- **Character.AI (2025-11) `[thứ cấp]`:** bỏ chat mở cho dưới 18; **California SB 243
  `[thứ cấp]`:** phải nói rõ là AI với trẻ, có quy trình tự hại, nhắc nghỉ.
- **Spotlighting (Microsoft, arXiv 2403.14720):** delimiting thường bị bắt chước; datamarking/
  thẻ có mã ngẫu nhiên + tuyên bố "đây là dữ liệu" hạ tỉ lệ chèn lệnh từ ~50% xuống <3%.
  → **Áp (GĐ1):** `wrapContextBlocks` ở `companionPrompt.ts`; ký ức trích ra cũng là dữ liệu
  không tin cậy lúc ghi (GĐ2: bộ trích không lưu câu mệnh lệnh làm fact).

### 2.5. Stream thật

- **Anthropic streaming + SDK TS (`helpers.md`):** `message_start → content_block_* →
message_delta (stop_reason, usage cộng dồn) → message_stop`; `client.beta.messages.stream()`
  - `.on('text')` + `await finalMessage()`; không chuyển `input_json_delta` xuống client; hook
    đóng kết nối → `abort()`; usage từ `message_delta`. → **Áp (GĐ1):** `callAnthropicText({
onTextDelta })`; SSE thêm `X-Accel-Buffering: no`; dự phòng Groq/Gemini giữ phát từng từ.

## 3. Kế hoạch 4 giai đoạn (mỗi giai đoạn một PR, chờ duyệt giữa các giai đoạn)

| GĐ  | Nội dung                                                                                                                                                                                                                                                                                                                                           | CSDL      | Trạng thái                                                                                                                                                                                                                                                                                                                                                                |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Stream thật từ Claude · sửa cắt lịch sử giữ lượt mới nhất · ngân sách 2000 → 4000 · prompt mới (2 trụ, giờ VN, nhóm tuổi, chống xu nịnh, không nhận cảm xúc, bọc dữ liệu) · lớp an toàn (từ khoá + Haiku, thẻ 111/115/Ngày Mai, imminent → câu cố định + hoàn lượt + không lưu transcript)                                                         | Không     | ✅ `docs/specs/2026-10-11-ban-dong-hanh-gd1-stream-an-toan.md`, changelog `0614`                                                                                                                                                                                                                                                                                          |
| 2   | Trí nhớ thông minh: cột `importance/last_accessed_at/embedding/valid_from/valid_to/superseded_by/source_message_id`; điểm 3 thành phần; hybrid tsvector + pgvector + RRF; trích ký ức kiểu mem0 sau phiên (debounce), ADD/UPDATE/vô hiệu qua ProposedAction; khối lõi + tóm tắt cuộn 70/50; trang "Bạn Đồng Hành nhớ gì về tôi" + chế độ phiên tạm | Migration | Tách 2 PR (chốt 2026-10-11): **GĐ2a** `docs/specs/2026-10-11-ban-dong-hanh-gd2a-tri-nho-truy-xuat.md` (mở cổng consent, truy xuất lai, trang ký ức, phiên tạm; ADR-0015: Gemini embedding, không pgvector) · **GĐ2b ĐÃ LÀM** `docs/specs/2026-10-12-ban-dong-hanh-gd2b-trich-ky-uc-khoi-loi.md` (changelog 0617: phản tỉnh → gợi ý chờ duyệt, khối cố định, tóm tắt cuộn) |
| 3   | Tác tử dùng công cụ thật: định tuyến ý định bằng Haiku (schema chặt, từ khoá fallback); công cụ chỉ-đọc (tiến độ học, ghi chú, từ điển, thẻ ôn) model tự gọi ≤ 4 bước, `tool_use` không stream xuống client; công cụ ghi vẫn qua ProposedAction (hash tham số, duyệt lũy đẳng); `final_answer_checks`; eval thêm ca xu nịnh + khủng hoảng đa lượt  | Không     | Kế tiếp (GĐ2a + GĐ2b xong)                                                                                                                                                                                                                                                                                                                                                |
| 4   | Bản tin chủ động bằng dữ liệu thật: cron đêm ≤ 3 thẻ/người từ mục tiêu + thẻ ôn đến hạn + phản tỉnh; 👍/👎 lưu thành preference; trần/ngày; nhắc nghỉ phiên dài cho trẻ; thay `proactiveAgentService` giả lập                                                                                                                                      | Migration | Chờ GĐ3                                                                                                                                                                                                                                                                                                                                                                   |

## 4. Nguồn đã đọc (chính)

- arxiv.org/abs/2304.03442 (Generative Agents) · github.com/mem0ai/mem0 + arxiv 2504.19413 ·
  arxiv 2501.13956 + github.com/getzep/graphiti · arxiv 2310.08560 + docs.letta.com ·
  arxiv 2502.12110 (A-MEM) · github.com/langchain-ai/langmem · platform.claude.com (memory tool,
  context editing, streaming, strict tool use) · anthropic.com/engineering/building-effective-agents
  · anthropic.com/news/protecting-well-being-of-users · openai.github.io/openai-agents-js
  (guardrails, human-in-the-loop) · docs.langchain.com (interrupts) · huggingface.co/docs/smolagents
  · blog.khanacademy.org (7-step prompt engineering) · openai.com/index/optimizing-chatgpt ·
  arxiv 2403.14720 (Spotlighting) · tongdai111.vn · befrienders.org · findahelpline.com/countries/vn.
- Thứ cấp (trang gốc 403 hoặc không có tài liệu kỹ thuật): OpenAI help center (memory), Duolingo
  Max, Pi, Character.AI, California SB 243, ChatGPT Pulse.
