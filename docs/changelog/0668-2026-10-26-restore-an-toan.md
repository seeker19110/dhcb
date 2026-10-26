# 0668 — 2026-10-26 — Restore an toàn: không báo thành công giả, không lộ mật khẩu, file giải mã 0600

PR #1447. Đợt sửa audit thứ nhất (sổ `docs/ops/AUDIT-STATUS.md`): đóng `AUD-DATA-002` (🔴),
`AUD-SEC-003` (🟠), `AUD-SEC-004` (🟠).

## Đã làm

- `scripts/restore-pg-from-r2.ts`:
  - `assertGzipIntact` — `gunzip -t` **trước** bước DROP: dump cắt cụt/tải dở dừng khi database cũ còn nguyên.
  - `runRestorePipeline` — KHÔNG qua shell: Node `spawn` gunzip và `psql -v ON_ERROR_STOP=1`, nối ống
    stdout → stdin, kiểm mã thoát của CẢ HAI (tương đương `pipefail`). Lý do bỏ shell: CodeQL
    (`js/indirect-command-line-injection`, cao) bắt bản đầu còn nội suy đường dẫn/URL vào `bash -c` — tên file
    chứa `$(...)` chạy được lệnh (lỗi có từ trước, test đỏ-trước xác nhận); bản `$1`/`$2` vẫn bị CodeQL báo nên
    bỏ hẳn shell. Phát hiện thêm khi chạy thật: psql dừng sớm với dump lớn làm gunzip kẹt ghi → treo vĩnh viễn;
    sửa bằng đóng đầu đọc khi psql thoát. Hệ quả: bước phân tích khuôn tĩnh của `restore-safe-repro.sh.txt`
    không còn khớp — cổng thay thế là `scripts/restore-pg-from-r2.test.ts` + chạy Postgres thật bên dưới.
  - `assertSafeDatabaseName` — tên ở `--restore-into` (ghép vào `DROP/CREATE DATABASE` và URL) chỉ nhận định
    danh Postgres thường.
  - `verifyRestoredDatabase` — `select count(*) from public.users` phải trả số trước khi báo ✅.
  - Lỗi của `execFileSync` mang NGUYÊN dòng lệnh (cả URL có mật khẩu) → `rethrowWithoutCommand` chỉ giữ tên
    bước + mã thoát; dòng hướng dẫn cuối in URL đã che (`redactConnectionUrl`). Phát hiện thêm khi chạy thật,
    ngoài phạm vi mô tả ban đầu của `AUD-SEC-003`.
- `scripts/lib/restoreSafety.ts` (mới): `redactConnectionUrl`, `writePrivateFile` (ghi rồi `chmod 0600`, siết cả
  file cũ). `restore-env-from-r2.ts` / `restore-system-from-r2.ts` dùng `writePrivateFile`.
- `.gitignore`: `.restore-*.sql.gz`, `system-restored.tar.gz` (`.env.restored` đã khớp `.env.*`).

## Kiểm chứng

- Đỏ-trước: `scripts/restore-pg-from-r2.test.ts` (25 ca, `psql` giả trên PATH) đỏ trên mã cũ (thiếu hàm/module),
  xanh sau sửa.
- Postgres 16 thật cục bộ (database tạm `dhcb_audit_restore`, xoá sau khi chạy): dump SQL lỗi → ném lỗi;
  gzip cụt → chặn ở `assertGzipIntact` và ở pipeline; psql dừng sớm với dump lớn → lỗi sau 214 ms, không
  treo; dump tốt (cả tên file có dấu cách) →
  `verifyRestoredDatabase` đếm đúng; DB rỗng → ném lỗi; thông báo lỗi không chứa mật khẩu.
- Test chèn lệnh qua tên file (`x"$(touch …)".sql.gz`) ĐỎ với khuôn nội suy cũ; test psql dừng sớm với dump
  ~30 MB ĐỎ (hết giờ 15 s) khi bỏ bước đóng đầu đọc; cả hai XANH sau sửa — 25/25 ca.
- Bộ tái hiện audit: không chạy được phần Docker (container không có Docker daemon); bước phân tích khuôn tĩnh
  của nó từ chối khuôn mới có chủ đích (xem trên).
- typecheck (`tsconfig.api.json` gồm `scripts/`), eslint 0 cảnh báo, prettier.

## Rủi ro và đường lùi

Chỉ đổi script vận hành chạy tay, không chạy trong app. Restore trên dump có lỗi SQL giờ DỪNG thay vì nạp
nửa vời — đúng ý đồ; nếu dump cố ý có lỗi bỏ qua được thì phải sửa dump. Đường lùi: revert PR.
