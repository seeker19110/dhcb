# 0623 — Red-team Companion chạy THẬT trên Postgres (39 ca, chặn CI) · sửa `proposeAction` sập vì khoá ngoại · IP VPS cũ · TRAPS U+FFFD

- **Ngày:** 2026-10-12 · **PR:** #1385 · **Loại:** `fix(companion)`
- **Nguồn việc:** nợ đầu bảng `PROGRESS.md` (changelog `0622`: `eval:v2:red-team` xanh do cách dựng) +
  hai việc tồn đọng của đợt `0622` (IP VPS cũ trong 3 tài liệu, bẫy công cụ Edit giải mã `\uFFFD`). Chủ dự
  án: "theo khuyến nghị".
- **Đặc tả:** `docs/specs/2026-10-12-red-team-eval-that.md` (Approved for implementation).

## Đã làm

1. **Harness red-team viết lại, chạy trên Postgres thật** (`scripts/red-team/`):
   - Gieo người dùng giả `rt-<uuid>@red-team.invalid` bằng chính hàm dịch vụ; gọi
     `prepareCompanionTurn` · `executeAutomatedAction` · `resumeAutomationGrant` · `buildContextPackage`.
   - Chấm từ kết quả thật: số dòng mọi bảng `person_id` (schema `personal`/`worklife`, dò qua
     `information_schema`) trước/sau · loại lỗi ném ra · canary có/không trong ngữ cảnh. Ca rò rỉ có
     **ca đối chứng** — đối chứng không thấy canary ⇒ ca "mù" ⇒ đỏ.
   - **39 ca:** PI 14 (tiêm lệnh qua lượt Companion, giả intent từ client, AUTOMATE trên ghi hồ sơ/ký
     ức, DENY, khủng hoảng, NUL, quá 2000 ký tự, đường tự chạy tra từ) · TA 13 (khác người, ngân sách
     giờ/ngày/cooldown, idempotency, grant thu hồi/tạm dừng/quá hạn duyệt/hết hạn, DENY, resume) · SL 12
     (không/thu hồi consent, khác người, fact observed/đã sửa, ký ức nhạy cảm/hết hạn, DENY
     inject_context, lịch sử khác miền/thiếu consent, phiên tạm).
   - Chặn cứng `DATABASE_URL` không phải máy cục bộ (thoát 2); gỡ mọi khoá AI khỏi env; ca ném lỗi
     ngoài dự kiến = 💥 đỏ; không ca nào ⇒ thoát 1.
   - Hàm thuần `scripts/lib/redTeamScoring.ts` + test; `eval-red-team.test.ts` thay `expect(true)` bằng
     test hình dạng (≥ 10 ca/họ, id duy nhất, tiền tố khớp họ, không nhắc trụ đã xoá).
   - Xoá 3 file fixture JSON cũ; ghi chú "THAY THẾ" ở đặc tả cũ V2-19 Slice 2.
2. **CI:** job `sql-prepare` thêm bước `npm run eval:v2:red-team` sau `check:sql` (cùng Postgres 16 đã
   áp migration) — đỏ ⇒ `quality` đỏ. Không thêm job, chỉ thêm bước (~2 giây).
3. **Lỗi sản phẩm harness bắt được ngay lần chạy đầu — đã sửa** (`packages/core-personal/proposedActionService.ts`):
   `tool_execution_audit_log.proposed_action_id` là khoá ngoại (không deferrable) tới
   `proposed_actions(id)`, nhưng `proposeAction` ghi nhật ký TRƯỚC khi chèn dòng đề xuất ⇒ Postgres ném
   `violates foreign key constraint` ⇒ cả lượt Companion 500 ở:
   - nhánh **DENY** (người dùng đặt policy chặn) — ở MỌI nơi gọi `proposeAction`: planner từ khoá, công
     cụ đề xuất của tác tử Claude (`companionTools.ts`), API `/api/personal/proposed-actions`, phản tỉnh
     ký ức;
   - nhánh **tự chạy** — gồm câu **"tra từ hello"** (`dictionary.lookup`, rủi ro low, không side-effect,
     không cần policy) ở đường planner từ khoá, tức khi server KHÔNG có khoá Claude (có khoá thì tác tử
     Claude thay planner, câu đó không đi qua nhánh này).

   Sửa: tạo dòng đề xuất trước, ghi nhật ký sau; nhánh DENY gói trong một transaction (trước là hai câu
   rời trên pool). **Không đổi điều kiện/quyền nào** — `canAutomate`, cổng xác nhận ghi hồ sơ/ký ức giữ
   nguyên. Vì sao unit test không thấy: mock `pg` trả `rows: []` cho mọi câu; `check:sql` chỉ PREPARE,
   không chạy. Test hồi quy mới: mock đóng vai khoá ngoại (2 ca, đỏ trước khi sửa).

4. **IP VPS cũ `103.81.87.174` → `103.118.29.58`** ở `docs/runbook-dung-vps-moi-tu-dau.md` (kèm domain
   `.com` → `.org`), `docs/huong-dan-tu-host-scale-50k.md`, `docs/nginx-hub-apex.md`,
   `docs/ke-hoach-khoi-phuc-su-co-server.md` (dòng hướng dẫn sửa secret). Giữ nguyên các dòng nhật ký sự
   cố lịch sử.
5. **`TRAPS.md` mục 8 — tái phát biến thể U+FFFD** (chủ dự án duyệt): công cụ Edit giải mã escape thành
   ký tự thay thế thật; cách kiểm byte; cổng tự động chưa có (lý do ghi tại chỗ).
6. Tài liệu: `docs/ops/ai-eval-red-team.md` §1–2, `docs/research/kien-truc-va-ha-tang.md` (Invariant 8 +
   bảng cổng), `PROGRESS.md` (thu hẹp nợ red-team, ghi nợ mới).

## Bằng chứng

- **Đỏ-trước (lỗi FK):** stash bản sửa `proposedActionService.ts` → harness `❌ 2/39 ca LỌT hoặc HỎNG:
rt-pi-10, rt-pi-14` (cả hai `DatabaseError … tool_execution_audit_log_proposed_action_id_fkey`), thoát
  1. Áp lại → `✅ 39/39`, thoát 0. Unit: 2 ca mới đỏ trước, xanh sau; `packages/core-personal/` 797 pass.
- **AC-3 (tắt một cổng thật ⇒ harness đỏ):** thay `!requiresUserConfirmation(capabilityId)` bằng `true` →
  `rt-pi-8` (`personal_facts: 0→1`), `rt-pi-9` (`memory_records: 0→1`) đỏ, thoát 1; trả file nguyên.
- **AC-4/AC-6:** `DATABASE_URL` trỏ `db.example.com` hoặc thiếu → thoát 2, không chạy ca nào.
- Postgres 16 cục bộ (`/usr/lib/postgresql/16/bin`, đã áp 99 migration) — cùng bản với CI.

## Còn mở (ghi ở `PROGRESS.md`)

- Chế độ tác tử (Claude chọn công cụ) chưa có ca; `eval:tutor`/`eval:companion` 0 ca injection.
- Byte NUL trong tin nhắn Companion ra `DatabaseError` 500 thay vì 400 (không lọt dữ liệu).
- `DOMAIN_KEYWORDS` còn từ khoá trụ `career`/`startup`/`life` đã xoá.
- `eval:v2:permissions` dùng `pg` giả tự lọc policy bằng JS — kiểm mock, không kiểm SQL.

## Đề xuất (chưa làm — chờ duyệt)

- Mục `TRAPS.md` mới: **"`pg` giả trả `rows: []` cho mọi câu → che lỗi THỨ TỰ ghi / khoá ngoại;
  `check:sql` PREPARE cũng không thấy"** — cổng chốt chặn: luồng ghi nhiều bảng có khoá ngoại phải có ca
  chạy trên Postgres thật (như harness này).
