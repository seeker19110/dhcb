# 0591 — R1: trang chạy code học viên ở tên miền con `run.` (app chưa dùng)

- **Ngày:** 2026-10-10 · **PR:** (xem mô tả PR) · **Loại:** `feat(programming)`
- **Nguồn:** chủ dự án chốt cả 4 câu hỏi của đặc tả
  `docs/specs/2026-10-10-tach-runtime-chay-code-ten-mien-con.md` (Q1 `run.donghanhcungban.org` ·
  Q2 tên miền con trước, origin cấu hình được · Q3 Report-Only 7 ngày · Q4 gỡ SDK Facebook/Apple/
  Microsoft khỏi `script-src`) → đặc tả chuyển "Approved for implementation"; đây là bước R1.

## Đã làm

- **Phía trình duyệt (entry build mới, app CHƯA nạp):**
  - `apps/dhcb/src/lib/workerLanes.ts` — một điểm điều phối 5 làn Worker (javascript · dom ·
    fetch · sql · python). `codeRunner.ts` đi qua nó; runner cũng gọi đúng nó ⇒ cùng hàm chạy,
    cùng prelude, kết quả chấm bài giống hệt.
  - `apps/dhcb/src/lib/runnerProtocol.ts` — hợp đồng message app ⇄ runner bằng `zod/mini`, có trần
    kích thước; tên API `fetch` kiểm KHỚP kiểu `FetchApi` ngay lúc biên dịch.
  - `apps/dhcb/runner.html` + `src/runner/{main,runnerHost}.ts` — runner chỉ chạy khi nằm trong
    khung, chỉ nhận tin từ đúng `window.parent` có origin khai ở `?parent=`, trả lời đúng origin
    đó (không bao giờ `'*'`).
  - `apps/dhcb/preview.html` — trang xem trước HTML đọc nội dung từ fragment URL (không
    postMessage tới origin mờ), từ chối hiển thị khi bị mở thẳng (chống dùng làm trang lừa đảo).
  - `vite.config.ts`: 3 entry (`index`/`runner`/`preview`); plugin dựng sẵn trang chủ khách chỉ
    xử lý `index.html`; chunk `modulepreload-polyfill` (sinh ra khi có nhiều entry) gom vào
    `vendor-misc` để JS khởi động không thêm file ngoài ngân sách size-limit.
- **Phía server:** `apps/server/src/runnerHost.ts` (gắn TRƯỚC `/api` trong `server.ts`):
  - Host runner (`RUNNER_HOSTNAME`, mặc định `run.donghanhcungban.org`): chỉ GET/HEAD, chỉ danh
    sách trắng (`/runner.html`, `/preview.html`, `/js/*`, `/assets/*`, `/pyodide/*`,
    `/sqljs/sql-wasm.wasm`), mọi thứ khác 404 — không `/api`, không SPA.
  - CSP riêng: `default-src 'none'`, `script-src 'self' 'unsafe-inline' 'unsafe-eval'
'wasm-unsafe-eval'`, `connect-src 'self'`, `frame-ancestors` = `ALLOWED_ORIGINS`
    (`allowedOrigins()` nay được xuất từ `packages/core-auth/security.ts`), kèm
    `Origin-Agent-Cluster: ?1`, `Referrer-Policy: no-referrer`, CORP `same-origin`; KHÔNG
    `X-Frame-Options`.
  - Host app: `/runner.html` và `/preview.html` trả 404.
- **Nginx:** block 4 cho `run.` — mọi request qua Express (một nguồn header; Worker lấy CSP từ
  response của chính file JS) và **xoá Cookie** (cookie phiên `Domain=.donghanhcungban.org` vẫn
  được trình duyệt gửi tới `run.`); thêm `run.` vào block :80.
- **Tài liệu:** `docs/cloudflare-setup.md` Bước 7 (DNS + certbot + lệnh kiểm),
  `docs/deploy-vps-ubuntu.md`, `.env.example` (`RUNNER_HOSTNAME`), đặc tả cập nhật mục ②/③ cho
  khớp mã thật.

## Sửa một cổng XANH GIẢ (phát hiện khi thêm entry)

`scripts/check-startup-coverage.ts` báo "0 file JS khởi động" từ changelog `0584`: bản HTML dựng
sẵn thay thẻ `<script src>`/`modulepreload` bằng một script inline nạp trễ, nên cổng không còn
thấy file nào để đối chiếu với size-limit. Đã sửa `scripts/lib/startupCoverage.ts` để đọc cả
đường dẫn `/js/*.js` trong script inline (bỏ qua `ld+json`), thêm test đúng hình HTML đó. Sau sửa:
cổng thấy 9 file và bắt được ngay chunk `modulepreload-polyfill` mới — lý do của dòng
`manualChunks` ở trên.

## Bằng chứng

- Unit: `runnerProtocol.test.ts` 7, `runnerHost.test.ts` (app) 8, `runnerHost.test.ts` (server,
  express thật + `express.static` thật) 9, `startupCoverage.test.ts` 6, `codeRunner`/`tsRunner` 37.
- Build: `dist/` có `index.html`, `runner.html`, `preview.html`; `npm run size` JS khởi động
  135.89 kB; `check-startup-coverage` ✅ 9 file.
- Boot `node dist-server/server.js` + `curl -H 'Host: run.donghanhcungban.org'`: `/runner.html`,
  file JS, worker, `/pyodide/*`, `/sqljs/sql-wasm.wasm` → 200 kèm CSP runner, không
  `X-Frame-Options`; `/api/health`, `/`, `/index.html`, `/hoc-tap`, `/sw.js` → 404; POST → 405.
  Host app: `/runner.html`, `/preview.html` → 404, `/` và `/api/health` → 200 như cũ.
- Thử trong Chromium thật, hai origin (cha `localhost:3200`, runner `127.0.0.1:3199` với
  `RUNNER_HOSTNAME=127.0.0.1`): JS `42`, SQL `x\n5`, Python `10` — cả Pyodide lẫn sql.js chạy
  dưới CSP runner thật, **0 vi phạm CSP**; trang cha đọc `contentWindow.document` của runner →
  bị chặn; cha KHÔNG có trong `ALLOWED_ORIGINS` → `frame-ancestors` từ chối; `preview.html` hiện
  đúng trang học viên trong iframe, mở thẳng thì trống.
- Phát hiện cho R2: CSP hiện tại của app (`frame-src https://accounts.google.com`) chặn iframe
  runner — R2 phải thêm origin runner vào `frame-src` cùng lúc bật bridge.
- E2E `programming-playground` + `programming-lesson` + `programming-project`: 43/43 (đường đi
  mới của `codeRunner.ts` qua `workerLanes.ts`).

## Chưa làm (bước sau)

- R0 (tay, chủ dự án): DNS `run` + `certbot --expand` — `docs/cloudflare-setup.md` Bước 7.
- R2: `runnerBridge.ts` + `HtmlPreview` + E2E hai origin, bật bằng `VITE_CODE_RUNNER_ORIGIN`.
- R3: CSP chặt cho app/hub ở Report-Only; R4: bật thật sau 7 ngày, chủ dự án duyệt.
