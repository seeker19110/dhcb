# 0624 — Byte NUL trong body → 400 thay vì 500 · từ khoá trụ đã xoá về `general` · TRAPS 23 (mock `pg` che khoá ngoại)

- **Ngày:** 2026-10-12 · **PR:** #1386 · **Loại:** `fix(companion)`
- **Nguồn việc:** ba nợ ghi ở changelog `0623`; chủ dự án: "tất cả theo khuyến nghị".

## Đã làm

1. **Byte NUL → 400** (`packages/core-http/validation.ts#readJsonBody`): body JSON có ký tự NUL ở giá trị
   chuỗi, tên khoá hay phần tử lồng ⇒ trả 400 "Body chứa ký tự NUL không hợp lệ". Postgres (text lẫn
   jsonb) không lưu được NUL — trước đây request đi tới câu SQL rồi vỡ `DatabaseError: unsupported
Unicode escape sequence` (500). Chặn ở cửa chung nên phủ cả 76 handler dùng `readJsonBody`, không chỉ
   Companion. Chuỗi CHỮ "gạch chéo ngược + u0000" (đã escape, vd mã nguồn học viên) không bị chặn oan.
2. **Lớp thứ hai ở schema Companion** (`CompanionRequestSchema.userMessage`): `prepareCompanionTurn` còn
   được gọi ngoài API — từ chối NUL bằng Zod trước khi chạm CSDL. Ca red-team `rt-pi-12` siết lại: lỗi
   `DatabaseError` nay tính là ĐỎ (trước tính là chặn được vì không ghi gì).
3. **`DOMAIN_KEYWORDS`** (`packages/core-personal/companionRuntime.ts`): từ khoá sự nghiệp/khởi
   nghiệp/đời sống (ba trụ đã xoá 2026-09-20) nay trả `general_conversation/general` — khớp
   `normalizeRoutedIntent` của bộ định tuyến LLM, hết domain ma `career`/`startup`/`life`. Vẫn giữ từ
   khoá để câu "Mục tiêu sự nghiệp của tôi là gì?" không rơi nhầm vào "đặt mục tiêu HỌC TẬP". Thứ tự ưu
   tiên giữ nguyên (sự nghiệp/khởi nghiệp → Work → đời sống). 9 fixture `eval:v2:routing` đổi nhãn tương
   ứng (id `dom-*` → `gen-*`).
4. **`TRAPS.md` mục 23** (chủ dự án duyệt): mock `pg` trả `rows: []` + `check:sql` chỉ PREPARE ⇒ che lỗi
   thứ tự ghi/khoá ngoại; cách rà + cổng chốt chặn.
5. `PROGRESS.md` thu hẹp nợ red-team; ghi thêm nợ: ba dịch vụ (`metacognitiveReflectionService`,
   `proactiveAgentService`, `subconsciousService`) còn nhận/sinh domain trụ đã xoá.

## Bằng chứng

- **Đỏ-trước:** 3 ca NUL mới ở `validation.test.ts` đỏ trước khi sửa; 7 ca từ khoá ở
  `companionRuntime.test.ts` đỏ trước khi sửa. Harness red-team với schema cũ (stash):
  `❌ rt-pi-12 … DatabaseError: unsupported Unicode escape sequence · ✗ NUL lọt xuống CSDL`; sau sửa:
  `✅ rt-pi-12 … ZodError`, tổng `✅ 39/39`.
- `eval:v2:routing`: 98,39 % (61/62) trước và sau (ca trượt duy nhất là `create_memory` có sẵn).
- Test NUL viết bằng `String.fromCharCode(0)`; kiểm byte: 0 byte NUL thật, 0 byte U+FFFD trong file đã sửa.
