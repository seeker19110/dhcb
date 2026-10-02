---
name: principal-engineer-architect
description: 'Kỹ năng Kỹ sư Trưởng (Principal Engineer), Kiến trúc Phần mềm Tinh gọn & Code Craftsmanship chuẩn mực cao nhất. Bắt buộc kích hoạt khi thiết kế kiến trúc, refactor, tạo migration CSDL, tối ưu hiệu năng, xây dựng API/Contracts, xử lý giao dịch database và thiết lập Quality Gates.'
---

# PRINCIPAL SYSTEMS ARCHITECT & SOFTWARE CRAFTSMANSHIP

Quy chuẩn kỹ thuật cho toàn bộ quá trình phát triển mã nguồn, kiến trúc và vận hành hệ thống Đồng
Hành.

> **Đối chiếu mã ngày 2026-10-02.** Bản trước của skill này mô tả ba thứ KHÔNG tồn tại như đã có
> (Web Worker DSP âm thanh, Hybrid RAG/RRF, Edge AI nạp model WebGPU) — nay ghi đúng thực tế ở
> mục 2–3. Khi skill và mã lệch nhau, **MÃ thắng**: sửa skill, đừng code theo skill.

---

## 1. NGUYÊN TẮC BẤT BIẾN VỀ KIẾN TRÚC & TYPE SAFETY

```
[UI Layer (React 19 + Vite 8 + lazyWithRetry)]
    │ (Strict DTO / API Client)
    ▼
[API Layer (Express 5 Endpoints + validateAuth)]
    │ (Validation via Zod Schema)
    ▼
[Core Domain Services (packages/core-*)]
    │ (Atomic Transactions & Idempotency)
    ▼
[Data Layer (PostgreSQL Pool + Cloudflare R2)]
```

1. **Type Safety Tuyệt Đối (TypeScript Strict):**
   - Không được phép sử dụng `any` hoặc `as unknown as Type` trừ trường hợp đặc biệt có bọc Type
     Guard `is...()`.
   - Mọi dữ liệu đi vào hệ thống từ bên ngoài (Network Request, Form Data, AI Output, Webhooks, CSDL
     Query) **BẮT BUỘC** phải parse/validate qua **Zod Schema**.
2. **Schema-First Contract-Driven Architecture:**
   - Định nghĩa hợp đồng dữ liệu tại `packages/core-contracts/` trước khi viết code logic hoặc UI
     (lệnh `/contract` khi cần bảng/endpoint mới).
   - Đa số contract có trường `schemaVersion` hoặc hằng `*_SCHEMA_VERSION` (đếm 2026-10-02: 58/86
     file). Contract đã có version thì **tăng version khi đổi phá vỡ**; contract mới nên có version
     ngay từ đầu.

---

## 2. HIỆU NĂNG & CÔ LẬP TIẾN TRÌNH

1. **Web Worker — cái ĐANG CÓ:** `apps/dhcb/src/workers/` chạy code của học viên môn Lập trình
   ngoài main thread (JavaScript, Python qua Pyodide, SQL qua sql.js, bài DOM/FETCH qua
   `apps/dhcb/src/lib/pageWorkerRunner.ts`). Muốn thêm worker mới thì theo khuôn này.
   - **CHƯA CÓ:** worker xử lý âm thanh (RMS, cao độ F0, formant F1/F2). Không có phân tích
     formant nào trong app ("GOP Lab" cũ chỉ gán số cứng, đã gỡ ở changelog 0484).
     Bản cũ của skill nhắc `audioDspWorker.ts` — file đó không tồn tại.
2. **Lưu trữ cục bộ OPFS → IndexedDB → bộ nhớ:** `apps/dhcb/src/lib/edgeAi/edgeModelStorage.ts`
   có thật (OPFS ưu tiên, tự lùi về IndexedDB, rồi bộ nhớ trong test).
   - **CHƯA CÓ mô hình Edge AI nào để nạp.** `classifyIntentEdge` trong
     `apps/dhcb/src/lib/edgeAi/edgeAiService.ts` là **phân loại ý định bằng regex**, không phải suy
     luận WebGPU; nó còn trả về các miền đã xoá (career/startup/life). Đừng mô tả hay thiết kế như
     thể đã có model chạy trên trình duyệt.
3. **Code-splitting & ngân sách kích thước:**
   - Các studio của Bạn Đồng Hành và trang nặng nạp lười qua `lazyWithRetry`
     (`apps/dhcb/src/lib/lazyWithRetry.ts`).
   - Ngân sách bundle nằm ở `.size-limit.json`, đo bằng `npm run size` (CI job `build`). **Đừng
     chép con số vào đây** — đọc file đó, vì con số đổi theo thời gian.

---

## 3. NGỮ CẢNH CHO AI

- **ĐANG CÓ:** ngữ cảnh cá nhân đưa vào prompt đi qua `packages/core-personal/contextEngine.ts`
  (Context Builder: chọn mục theo consent và mức nhạy cảm, đóng gói theo
  `packages/core-contracts/contextPackage.ts`). Thêm nguồn ngữ cảnh mới thì đi qua lớp này để giữ
  ranh giới consent.
- **CHƯA CÓ:** Hybrid RAG (dense + BM25) và Reciprocal Rank Fusion. Bản cũ của skill nhắc
  `hybridRagEngine.ts` — file đó không tồn tại. Muốn làm thì cần đặc tả + đo chất lượng trước.

---

## 4. QUẢN TRỊ DỮ LIỆU & GIAO DỊCH DATABASE

1. **Giao dịch nguyên tử:**
   - Mọi thao tác ghi nhiều bảng hoặc cần tính nhất quán (trừ tiền, cấp entitlement, ghi nhận
     usage, update streak) **BẮT BUỘC** chạy qua
     `withTransaction(pool, async (client) => { ... })` ở `packages/core-db/transaction.ts`.
     Hàm này lo `BEGIN`/`COMMIT`/`ROLLBACK` và trả kết nối về pool.
   - Mọi handler tự kiểm `user_id` khớp token qua `validateAuth()` trước khi query (không có RLS —
     CLAUDE.md mục 4.2). Rà SQL/migration: subagent `database-reviewer`.
2. **Quy chuẩn migration (`postgres/migrations/`):**
   - Đặt tên theo số thứ tự: `XXXX_ten_migration_ngan_gon.sql`, thêm dòng vào
     `postgres/migrations/README.md`.
   - **Khả nghịch & tương thích ngược (additive first):**
     - Không xoá cột/bảng đang chạy khi chưa qua giai đoạn deprecation — và phải hỏi chủ dự án
       trước mọi thay đổi phá vỡ (CLAUDE.md mục 12).
     - Dùng `IF NOT EXISTS` khi tạo bảng/cột/index và `IF EXISTS` khi drop.

---

## 5. LÁ CHẮN CHỐNG ẢO GIÁC AI (ANTI-HALLUCINATION GUARDRAILS)

```
[Raw AI Response] ──► [Zod Strict Parser] ──► [Domain Business Rule Validator] ──► [DB Persistence]
                               │ (Parse Error)                      │ (Invalid State)
                               ▼                                    ▼
                      [Deterministic Fallback]            [Deterministic Fallback]
```

- **Quy tắc vàng:** AI output chỉ là "dữ liệu thô chưa được tin cậy".
- **CẤM:** Tuyệt đối không để AI output trực tiếp thay đổi số dư tài khoản, cấp quyền VIP, thay đổi
  quyền truy cập, hay cập nhật chỉ số năng lực của người học mà không qua bộ lọc kiểm tra logic tất
  định.
- **Fallback êm:** khi AI trả JSON lỗi hoặc không khớp Zod Schema, hệ thống tự dùng nhánh dự phòng
  tất định mà không làm crash luồng của người dùng.
- **Không hiển thị số ước đoán như số đo thật.** Thiếu dữ liệu thì nói "chưa có dữ liệu", đừng
  dùng giá trị mặc định gán cứng (bài học changelog 0473 · 0475).

---

## 6. QUALITY GATES — CỔNG KIỂM THỬ (DUNG SAI = 0)

Nguồn sự thật: CLAUDE.md mục 8–10. Tối thiểu trước mỗi PR:

```bash
npm run typecheck        # gộp 4 tsconfig (app, api, e2e, hub)
npm run lint             # 0 warning
npm run format:check     # Prettier
npm run test:coverage    # cổng CI THẬT, có ngưỡng chặn — KHÔNG phải `npm test`
npm run build
```

Trước lần push cuối, `rm -rf packages/*/dist dist dist-server` rồi chạy lại `npm run typecheck` để
tái hiện checkout sạch của CI (TRAPS.md mục 3).
