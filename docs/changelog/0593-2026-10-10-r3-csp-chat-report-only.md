# 0593 — R3: CSP chặt dạng Report-Only cho app + hub, báo về Sentry; gỡ 3 SDK đăng nhập thừa

- **Ngày:** 2026-10-10 · **PR:** (xem mô tả PR) · **Loại:** `feat(security)`
- **Nguồn:** bước R3 của `docs/specs/2026-10-10-tach-runtime-chay-code-ten-mien-con.md` (đã duyệt;
  R1 = `0591`, R2 = `0592`). Q3 (7 ngày Report-Only) và Q4 (gỡ SDK Facebook/Apple/Microsoft) chủ
  dự án chốt theo đề xuất.

## Đã làm

- `apps/server/src/strictCsp.ts` (mới) — CSP chặt cho trang app + hub:
  - `script-src 'self'` + băm sha256 từng script inline CHẠY ĐƯỢC của `index.html` (cổng trang chủ
    dựng sẵn, chống nháy theme, bộ nạp chunk) + Cloudflare beacon + Google Identity Services.
    KHÔNG `'unsafe-inline'`, KHÔNG `'unsafe-eval'`. Bỏ qua script dữ liệu (`ld+json`, `importmap`…).
  - Băm tính MỘT lần lúc server khởi động từ đúng file đã build (app và hub băm riêng) ⇒ sửa script
    inline không thể quên cập nhật băm. Deploy luôn restart PM2 nên băm luôn khớp bản build mới.
  - `worker-src 'self'` (service worker), `frame-src` Google + runner, giữ nguyên các directive khác
    của CSP cũ.
  - `report-uri` + `report-to csp-endpoint` (+ header `Reporting-Endpoints`) trỏ về endpoint
    security của Sentry, suy ra từ `SENTRY_DSN`. Không có DSN thì không gửi báo cáo.
- `server.ts`: mọi response không phải `/api` mang THÊM `Content-Security-Policy-Report-Only` (CSP
  cũ vẫn enforce như trước — trình duyệt chỉ báo, không chặn gì). `CSP_MODE=legacy` tắt header này,
  chỉ cần restart.
- Q4: gỡ `connect.facebook.net`, `appleid.cdn-apple.com`, `alcdn.msauth.net` khỏi CSP ĐANG ENFORCE
  (`buildAppCsp`) và không đưa vào CSP chặt. Không giao diện nào gọi `loginWithFacebook/Apple/
Microsoft`; comment ở `clientAuth.ts` nhắc thêm lại host nếu bật nút.
- `apps/dhcb/src/lib/zodJitless.ts` + import ĐẦU TIÊN ở `main.tsx`: `config({ jitless: true })`.
  zod v4 thử `new Function('')` (`allowsEval` trong `zod/v4/core/util.js`) — bị nuốt bằng catch
  nhưng vẫn sinh báo cáo vi phạm ở mỗi lần tải trang; `jitless` bỏ hẳn phép thử (đã đọc mã zod).
- `runnerOriginsFromEnv()` (`runnerHost.ts`) dùng chung cho cả hai CSP.

## Lưu ý vận hành

- **Đồng hồ 7 ngày chỉ tính từ khi production đã đặt `VITE_CODE_RUNNER_ORIGIN`.** Trước đó code
  học viên chạy bằng Worker ở origin app; file Worker cũng nhận header Report-Only (đã kiểm bằng
  `curl -sI /assets/pyodideWorker-*.js`), nên mỗi lượt chạy JS/Python sinh báo cáo
  `unsafe-eval`/`wasm-unsafe-eval` — vi phạm đúng dự kiến, không phải vi phạm thật.
- Cloudflare Rocket Loader / Email Obfuscation tự chèn script inline → sẽ hiện trong báo cáo (đặc
  tả mục 6). Thấy thì TẮT tính năng đó ở dashboard.
- Bản đồ Google (`maps.googleapis.com`) không có trong cả CSP cũ lẫn mới — đã bị chặn từ trước,
  không đổi trong đợt này.

## Bằng chứng

- Unit: `strictCsp.test.ts` 11 (băm khớp vector MDN `'sha256-qznLcs…Tng='`, bỏ script dữ liệu/
  `src`/rỗng, giữ nguyên khoảng trắng, suy endpoint Sentry từ DSN kể cả DSN có đường dẫn, DSN sai
  → không báo cáo, không `unsafe-*`, không 3 SDK, `CSP_MODE`), `routes.csp.test.ts` +1 (CSP enforce
  không còn 3 SDK).
- Server đã build (`node dist-server/server.js`): `curl -sI /` trả cả hai header; Report-Only có
  3 băm (đúng 3 script inline chạy được của `dist/index.html`, 2 khối `ld+json` bị bỏ qua) +
  `report-uri`/`report-to` + `Reporting-Endpoints`.
- Chromium thật, 7 trang (`/`, `/goc-hoc-tap`, `/goc-hoc-tap/programming`, `/goc-hoc-tap/english`,
  `/ghi-chu`, …) × 2 khổ (1440px, 390px): **0** sự kiện `securitypolicyviolation`. Đối chứng: chèn
  một `<script>` inline lạ → đúng 1 báo cáo `script-src-elem`, `disposition: report` (bộ nghe hoạt
  động, CSP chặt thật sự có hiệu lực ở dạng báo).
- Trang Chạy thử Python vẫn chạy (`print` ra kết quả) dưới header Report-Only.

## Việc tay

Như `0592` (R0 → đặt `VITE_CODE_RUNNER_ORIGIN` → thử tay), rồi theo dõi Sentry 7 ngày. R4 (bật
thật) chờ chủ dự án duyệt.
