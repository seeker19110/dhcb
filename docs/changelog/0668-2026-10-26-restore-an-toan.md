# 0668 — 2026-10-26 — Restore an toàn: không báo thành công giả, không lộ mật khẩu, file giải mã 0600

PR (điền khi mở). Đợt sửa audit thứ nhất (sổ `docs/ops/AUDIT-STATUS.md`): đóng `AUD-DATA-002` (🔴),
`AUD-SEC-003` (🟠), `AUD-SEC-004` (🟠).

## Đã làm

- `scripts/restore-pg-from-r2.ts`:
  - `assertGzipIntact` — `gunzip -t` **trước** bước DROP: dump cắt cụt/tải dở dừng khi database cũ còn nguyên.
  - `runRestorePipeline` — `bash -o pipefail` + `psql -v ON_ERROR_STOP=1`: gzip hỏng giữa chừng hoặc câu SQL
    lỗi đầu tiên làm cả lệnh lỗi. Giữ đúng khuôn literal để bộ tái hiện
    `docs/ops/audit-evidence/2026-10-26/restore-safe-repro.sh.txt` vẫn đọc được.
  - `verifyRestoredDatabase` — `select count(*) from public.users` phải trả số trước khi báo ✅.
  - Lỗi của `execFileSync` mang NGUYÊN dòng lệnh (cả URL có mật khẩu) → `rethrowWithoutCommand` chỉ giữ tên
    bước + mã thoát; dòng hướng dẫn cuối in URL đã che (`redactConnectionUrl`). Phát hiện thêm khi chạy thật,
    ngoài phạm vi mô tả ban đầu của `AUD-SEC-003`.
- `scripts/lib/restoreSafety.ts` (mới): `redactConnectionUrl`, `writePrivateFile` (ghi rồi `chmod 0600`, siết cả
  file cũ). `restore-env-from-r2.ts` / `restore-system-from-r2.ts` dùng `writePrivateFile`.
- `.gitignore`: `.restore-*.sql.gz`, `system-restored.tar.gz` (`.env.restored` đã khớp `.env.*`).

## Kiểm chứng

- Đỏ-trước: `scripts/restore-pg-from-r2.test.ts` (14 ca, `psql` giả trên PATH) đỏ trên mã cũ (thiếu hàm/module),
  xanh sau sửa.
- Postgres 16 thật cục bộ (database tạm `dhcb_audit_restore`, xoá sau khi chạy): dump SQL lỗi → ném lỗi;
  gzip cụt → chặn ở `assertGzipIntact` và ở pipeline; dump tốt → `verifyRestoredDatabase` = 3; DB rỗng → ném
  lỗi; thông báo lỗi không chứa mật khẩu.
- Bước phân tích mã của bộ tái hiện audit chấp nhận khuôn mới (`-o pipefail -c`, `psql -v ON_ERROR_STOP=1`).
  Không chạy được phần Docker của bộ tái hiện (container không có Docker daemon).
- typecheck (`tsconfig.api.json` gồm `scripts/`), eslint 0 cảnh báo, prettier.

## Rủi ro và đường lùi

Chỉ đổi script vận hành chạy tay, không chạy trong app. Restore trên dump có lỗi SQL giờ DỪNG thay vì nạp
nửa vời — đúng ý đồ; nếu dump cố ý có lỗi bỏ qua được thì phải sửa dump. Đường lùi: revert PR.
