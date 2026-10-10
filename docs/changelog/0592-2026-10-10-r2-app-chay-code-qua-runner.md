# 0592 — R2: app gửi code học viên sang runner `run.` (bật bằng `VITE_CODE_RUNNER_ORIGIN`)

- **Ngày:** 2026-10-10 · **PR:** (xem mô tả PR) · **Loại:** `feat(programming)`
- **Nguồn:** bước R2 của `docs/specs/2026-10-10-tach-runtime-chay-code-ten-mien-con.md` (đã duyệt,
  changelog `0591` làm R1).

## Đã làm

- `apps/dhcb/src/lib/runnerBridge.ts` — `runSandboxedLane()` / `resetSandboxedLanes()`:
  - Build CÓ `VITE_CODE_RUNNER_ORIGIN` → gửi lượt chạy sang iframe runner ẩn
    (`sandbox="allow-scripts allow-same-origin"`, `aria-hidden`, không tab vào được) qua
    postMessage tới ĐÚNG origin runner; chỉ nhận tin từ đúng khung + đúng origin + đúng hợp đồng.
  - Iframe tạo lười ở lượt đầu, dùng lại cho lượt sau. Không chào trong 10s → lỗi "Không mở được
    khung chạy code…"; im lặng quá 15s giữa lượt (180s khi đang tải Pyodide lần đầu) → gỡ khung,
    trả lỗi kèm output đã có. Dừng/rời trang → gỡ khung (giải phóng Pyodide/SQLite).
  - KHÔNG có biến → chạy Worker trong trang như trước (dev, unit test, đường lui).
- Đi qua bridge: `codeRunner.ts` (5 làn Worker), `tsRunner.ts` (JS sinh từ TypeScript), và **trang
  Chạy thử Python** (`ProgrammingPlayground.tsx` — trước đây gọi thẳng `runPython`, đặc tả bỏ sót;
  phát hiện khi rà mọi chỗ import bộ chạy).
- `HtmlPreview.tsx`: bài DOM (có script) + đã cấu hình runner → khung nạp
  `<runner>/preview.html#<trang base64url>`, `key` đổi theo nội dung. Trang tĩnh (HTML/CSS) giữ
  `srcdoc` + `sandbox=""`. `encodePreviewPayload()` trong `runnerProtocol.ts`, test khứ hồi với đúng
  công thức giải mã trong `preview.html`.
- CSP app: `frame-src` thêm origin runner (`buildAppCsp()` trong `routes.ts`, lấy từ
  `RUNNER_HOSTNAME`) — thiếu thì CSP chặn iframe runner (phát hiện ở `0591`).
- `vite.config.ts`: `VITE_CODE_RUNNER_ORIGIN` sai dạng (có `/` cuối, có đường dẫn…) → build dừng
  với lỗi rõ thay vì app lặng lẽ quay về chạy trong trang.
- Playwright: dev server dựng với `VITE_CODE_RUNNER_ORIGIN=http://127.0.0.1:<cổng>` — app ở
  `localhost`, runner ở `127.0.0.1` (khác origin, khác site) ⇒ MỌI E2E môn Lập trình nay chạy qua
  runner như production.

## Quyết định lệch đặc tả (đã ghi vào đặc tả)

Đặc tả ghi "build production BẮT BUỘC có biến" ngay từ R2. Dời sang **R4**: biến chỉ đặt được sau
việc tay R0 (DNS + chứng chỉ); ép từ R2 thì deploy gãy, hoặc phải đặt biến khi `run.` chưa sống ⇒
mọi bài code báo lỗi. Tới R4 (bỏ `'unsafe-eval'` khỏi app) Worker trong trang không còn chạy được,
lúc đó mới bắt buộc.

## Bằng chứng

- Unit: `runnerBridge.test.ts` 8 (khung lười, chờ hello, bỏ tin lạ, hello quá hạn, watchdog,
  hạn dài khi tải Pyodide, reset, không `'*'` cả trong mã nguồn), `HtmlPreview.test.tsx` 5
  (không bao giờ `allow-same-origin`), `runnerProtocol.test.ts` +2 (khứ hồi payload),
  `routes.csp.test.ts` 2.
- E2E mới `e2e/code-runner-origin.spec.ts` 4/4: Python in `js.location.origin` ra đúng
  `http://127.0.0.1:<cổng>`; Worker JS tải từ origin runner, không từ app; `while True: pass` bị
  ngắt "quá 10 giây" và trang app vẫn thao tác được trong lúc đó; mở thẳng `runner.html` thì không
  nhận lệnh.
- E2E toàn bộ (mọi bài Lập trình nay chạy qua runner): xem mô tả PR.

## Việc tay (thứ tự bắt buộc)

1. R0 — `docs/cloudflare-setup.md` Bước 7.
2. Khi `run.` trả 200: `VITE_CODE_RUNNER_ORIGIN=https://run.donghanhcungban.org` vào `.env` VPS,
   deploy lại.
3. Thử tay một bài Python và một bài DOM "Xem trang chạy".

Đường lui: xoá biến, deploy lại.
