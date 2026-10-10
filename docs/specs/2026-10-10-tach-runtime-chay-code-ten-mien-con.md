# Đặc tả: Tách runtime chạy code học viên sang tên miền con — gỡ `'unsafe-inline'`/`'unsafe-eval'` khỏi CSP trang chính

> Ngày: 2026-10-10 · **Trạng thái:** Approved for implementation — chủ dự án chốt cả 4 câu hỏi
> mục 8 theo đề xuất (2026-10-10). Thi hành theo từng bước R1→R4 ở mục 5; R4 (bật CSP chặt
> thật) vẫn cần chủ dự án duyệt lại sau 7 ngày Report-Only.

**Nền:** máy quét bảo mật báo `content-security-policy` yếu (changelog `0588`). `script-src` của
trang chính (`apps/server/src/routes.ts#CSP_HEADER`) còn `'unsafe-inline'` + `'unsafe-eval'`, nên
CSP gần như không chặn được XSS: script chèn vào trang vẫn chạy. Hai từ khoá này còn đó vì môn
Lập trình chạy code của học viên NGAY TRÊN origin của app. `docs/security-rollout-2026-09-27.md`
mục "Giới hạn còn lại" đã ghi hướng sửa: tách runtime trình duyệt ra origin riêng.

## 0. Một câu

Chuyển mọi chỗ chạy code học viên trong trình duyệt sang một origin riêng
(`run.donghanhcungban.org`, không cookie, không API). Nhờ vậy trang chính (app + hub) bỏ được
`'unsafe-inline'` và `'unsafe-eval'` khỏi `script-src`, mà học viên không thấy gì khác.

## 1. Hiện trạng đo được (2026-10-10, đọc mã + bản build thật)

### 1.1 Vì sao trang chính cần `'unsafe-eval'`

Đã dò `new Function`/`eval(` trên 723 file JS trong `dist/`:

| Nơi                                                     | Vì sao                                                                  | Sau khi tách                                                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `workers/jsWorker.ts`, `domWorker.ts`, `fetchWorker.ts` | chạy code JS học viên bằng `new Function`                               | chạy trên origin runner                                                                    |
| `dist/pyodide/pyodide.asm.mjs`                          | Emscripten `EM_ASM` dùng `eval(func)` lúc khởi tạo, cộng biên dịch WASM | chạy trên origin runner (cần cả `'unsafe-eval'` lẫn `'wasm-unsafe-eval'`)                  |
| `workers/sqlWorker.ts` (sql.js)                         | biên dịch WASM                                                          | chạy trên origin runner (`'wasm-unsafe-eval'`)                                             |
| `vendor-misc-*.js` (zod v4)                             | chỉ là phép thử `try { new Function('') } catch {}` để bật JIT          | tự rơi về chế độ không JIT; đặt `z.config({ jitless: true })` để khỏi phát báo vi phạm CSP |

Ngoài các chỗ trên, mã của app không dùng `eval`. Vite cũng không cần `'unsafe-eval'`.

### 1.2 Vì sao trang chính cần `'unsafe-inline'`

1. **`components/HtmlPreview.tsx`**: bài DOM dùng `<iframe sandbox="allow-scripts" srcDoc=…>`,
   có chèn `<script>` của học viên vào trang. **Iframe `srcdoc` thừa kế CSP của trang cha**, nên
   gỡ `'unsafe-inline'` là script học viên chết. Hai nơi dùng component này:
   `components/programming/LivePreview.tsx` và `pages/subjects/programming/ProgrammingProjectPage.tsx`.
2. **`apps/dhcb/index.html` dòng 15**: một script inline chống nháy theme. Thay `'unsafe-inline'`
   bằng băm `'sha256-…'` là đủ. Hai khối `application/ld+json` không phải script chạy được, CSP
   không áp lên chúng.
3. `apps/hub/index.html`: không có script inline.

### 1.3 Điểm vào chạy code

Mọi lượt chạy đi qua MỘT hàm `runLessonCode()` (`apps/dhcb/src/lib/codeRunner.ts`), từ 3 trang:
`ProgrammingLessonPage`, `ProgrammingPlayground`, `ProgrammingProjectPage`.

- **Đi qua Worker** (cần origin runner): `jsRunner` (cả `tsRunner` dùng lại nó), `pythonRunner`,
  `sqlRunner`, `domRunner`, `fetchRunner`. Hai cái cuối dùng chung khuôn `pageWorkerRunner`.
- **Không cần runner** (giả lập thuần, không `eval`): `htmlRunner`, `gitRunner`, `bashRunner`,
  `hermesRunner`, `vibeRunner`, `openclawRunner`, `swiftRunner`, `kotlinRunner`.

### 1.4 Mô hình mối đe doạ

- Hôm nay **không có tính năng chia sẻ code** giữa người dùng (đã dò). Code chạy là code học viên
  tự gõ, hoặc mã mẫu trong bài học. Rủi ro trực tiếp vì thế thấp.
- Rủi ro thật nằm ở chỗ CSP hiện tại **không còn là lớp phòng thủ**. Một lỗi XSS bất kỳ ở chỗ
  khác (một `dangerouslySetInnerHTML` sau này, một thư viện bị chèn mã) sẽ chạy được với đủ quyền
  của phiên đăng nhập.
- Worker chạy code JS hôm nay nằm cùng origin với app. `fetch('/api/…')` trong code học viên GỬI
  KÈM cookie phiên. Muốn chặn hướng này thì code học viên không được nằm trên origin của app.

## 2. Giải pháp

```
en-vi.donghanhcungban.org (app, CSP chặt)          run.donghanhcungban.org (runner, không cookie/API)
┌──────────────────────────────────┐   postMessage   ┌──────────────────────────────────────┐
│ codeRunner.ts → runnerBridge.ts  │ ──────────────► │ runner.html → runner/main.ts         │
│  <iframe src=run…/runner.html    │ ◄────────────── │  new Worker(js/py/sql/dom/fetch)     │
│    sandbox="allow-scripts        │  {type,id,…}    │  terminate() khi quá giờ (như nay)   │
│             allow-same-origin">  │                 │  preview.html: render HTML+script    │
└──────────────────────────────────┘                 └──────────────────────────────────────┘
```

- **Runner là một entry Vite thứ hai** trong `apps/dhcb`: `runner.html` (chạy code) và
  `preview.html` (xem trang DOM). Hai trang dùng lại nguyên các file `workers/*.ts` và
  `lib/*Runner.ts` hiện có, nên không viết lại logic chạy/ngắt nào.
- **Cùng bản build, cùng Express**, chọn theo Host như hub đang làm
  (`apps/server/src/staticApps.ts#resolveDistDir`): Host là runner thì chỉ phục vụ file tĩnh,
  KHÔNG gắn `/api`, và dùng CSP riêng (mục 3). Nhờ vậy không phải dựng thêm tiến trình hay máy.
- **Phía app**: `codeRunner.ts` giữ nguyên chữ ký `runLessonCode()` và kiểu `CodeRunResult`, nên
  3 trang gọi không đổi gì. Một module mới `lib/runnerBridge.ts` thay chỗ `new Worker(...)` bằng
  postMessage tới iframe runner. Iframe runner được tạo LƯỜI ở lượt chạy đầu tiên, dùng chung cho
  mọi lượt sau.
- **Đường lui**: thiếu `VITE_CODE_RUNNER_ORIGIN` lúc build thì dùng Worker trong trang như hôm nay.
  Điều này giữ dev và unit test chạy như cũ. Production BẮT BUỘC có biến này: test cấu hình chặn
  build production thiếu biến.
- **`HtmlPreview`**: bỏ `srcDoc`, đổi sang `<iframe src="${runner}/preview.html" sandbox="allow-scripts">`
  rồi gửi `{html, script}` qua postMessage. Trang `preview.html` dựng nội dung bằng
  `document.open()/write()` dưới CSP riêng của runner, nơi được phép `'unsafe-inline'`. Iframe giữ
  sandbox KHÔNG có `allow-same-origin`, nên script học viên mang origin ẩn danh.

### 2.1 Vì sao iframe runner có `allow-same-origin` mà preview thì không

Iframe runner cần đúng origin `run.…` để tạo Worker từ URL cùng origin (Worker không tạo được từ
origin ẩn danh). Như vậy vẫn an toàn vì `run.…` **không có gì để lấy**: không API, Nginx xoá
header `Cookie` trước khi tới Express, không storage của app. Thêm nữa, `connect-src` của runner
chỉ cho tải `/pyodide/` và `/sqljs/` cùng origin. Preview thì chạy script học viên ngay trên luồng
chính của khung, nên giữ origin ẩn danh làm lớp thứ hai.

### 2.2 Các phương án đã cân nhắc

| Phương án                                                                           | Loại vì                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cùng origin: iframe `src="/runner.html"` có sandbox + CSP riêng cho file worker     | Rẻ nhất (không DNS/chứng chỉ), nhưng **một lỗi cấu hình là mất cả app**. Ai đó mở thẳng `/runner.html` ở cửa sổ riêng (không sandbox) rồi gửi HTML qua postMessage là có XSS trên origin chính. Lỡ thêm `allow-same-origin` cũng vậy. Tách origin thì lỗi kiểu này chỉ chạm tới `run.…`, nơi không có gì |
| Chỉ cho file worker CSP lỏng, giữ `srcdoc`                                          | Gỡ được `'unsafe-eval'` nhưng KHÔNG gỡ được `'unsafe-inline'`, vì `srcdoc` thừa kế CSP trang cha                                                                                                                                                                                                         |
| Tên miền đăng ký riêng (vd `donghanhcungban-run.org`, kiểu `githubusercontent.com`) | Mạnh nhất: khác SITE nên trình duyệt chắc chắn tách tiến trình và không gửi cookie cùng site. Đổi lại tốn ~10–15 USD/năm và thêm một domain phải gia hạn. Thiết kế này giữ nguyên dùng được: chỉ đổi `VITE_CODE_RUNNER_ORIGIN` (câu hỏi Q2)                                                              |
| Chạy code trên server                                                               | Là việc khác (ADR-0014, host grader riêng), không gỡ được CSP trang và tăng chi phí                                                                                                                                                                                                                      |

## 3. Chính sách header sau khi xong

**App + hub (trang chính):**

```
script-src 'self' 'sha256-<băm script theme>' https://static.cloudflareinsights.com https://accounts.google.com
frame-src  https://accounts.google.com https://run.donghanhcungban.org
worker-src 'self'            (service worker /sw.js còn ở origin chính)
(phần còn lại giữ nguyên; style-src 'unsafe-inline' NGOÀI phạm vi — xem ①)
```

Băm `sha256` **tính lúc server khởi động** từ đúng file `index.html` đã build mà nó phục vụ (app
và hub, mỗi bên một danh sách). Nhờ vậy sửa script theme không thể quên cập nhật băm. Có test
canh: dựng CSP từ một `index.html` mẫu ra đúng băm. Thêm một script inline mới mà không đi qua
hàm này thì E2E bắt được vi phạm CSP (mục ④).

**Runner (`run.…`):**

```
default-src 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval';
worker-src 'self'; connect-src 'self'; style-src 'unsafe-inline'; img-src data:;
frame-ancestors <các origin app — đọc từ ALLOWED_ORIGINS, không ghi cứng>;
base-uri 'none'; form-action 'none'
```

Kèm `Origin-Agent-Cluster: ?1` (gợi ý trình duyệt tách tiến trình), `Referrer-Policy: no-referrer`
và `Cache-Control` như asset hiện nay. **Không** đặt `X-Frame-Options` (sẽ đá nhau với
`frame-ancestors` liệt kê origin khác).

## ① Phạm vi

**LÀM:**

- Entry `runner.html` + `preview.html` trong `apps/dhcb`; giao thức postMessage có kiểm `origin`
  ở CẢ hai chiều.
- `runnerBridge.ts` + đổi 5 runner dùng Worker sang đi qua bridge khi có `VITE_CODE_RUNNER_ORIGIN`;
  `HtmlPreview` sang iframe `src` runner.
- Express: chọn bản build theo Host runner, chặn `/api` trên host runner, CSP riêng cho runner,
  CSP trang chính chặt (bỏ `'unsafe-inline'`/`'unsafe-eval'` khỏi `script-src`, thêm băm, thêm
  runner vào `frame-src`).
- Nginx: thêm `run.donghanhcungban.org` vào `server_name`, và `proxy_set_header Cookie ""` cho
  host này (`nginx/en-vi.conf`).
- Giai đoạn `Content-Security-Policy-Report-Only` (mục 5) gửi báo vi phạm về Sentry trước khi
  bật thật.
- `z.config({ jitless: true })` ở điểm vào app.
- Tài liệu: `docs/cloudflare-setup.md` (DNS), `docs/deploy-vps-ubuntu.md` (chứng chỉ), changelog,
  `PROGRESS.md`.

**KHÔNG LÀM:**

- **`style-src 'unsafe-inline'`**: React `style={…}`, Tailwind runtime, GIS và bản HTML dựng sẵn
  (`guestPrerender`) đều dùng style inline. Rủi ro XSS qua CSS thấp hơn hẳn. Để đợt sau nếu cần.
- **Thu hẹp `connect-src https:`** của trang chính: phải rà mọi đích fetch/WebSocket (R2, Sentry,
  Gemini Live, GIS). Là việc riêng.
- **COEP**: vẫn không bật (changelog `0588`).
- Không đổi logic chấm, không đổi `CodeRunResult`, không đổi nội dung bài học, không đụng 8 runner
  giả lập ở mục 1.3.
- Không chạy code trên server (ADR-0014 là hướng riêng).
- Không gỡ các SDK đăng nhập chưa dùng khỏi `script-src` trong đợt này, trừ khi chủ dự án chọn
  ở Q4.

## ② Điểm chạm

| Việc | Đường dẫn file                                 | Bước  | Ghi chú                                                                                                        |
| ---- | ---------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------- |
| Thêm | `apps/dhcb/runner.html`                        | R1    | Entry thứ hai của bản build; chỉ nạp `src/runner/main.ts`                                                      |
| Thêm | `apps/dhcb/src/runner/main.ts`                 | R1    | Nối `runnerHost.ts` với `window` thật                                                                          |
| Thêm | `apps/dhcb/src/runner/runnerHost.ts` (+ test)  | R1    | Lõi runner: 3 lớp chặn tin nhắn lạ, gọi đúng các làn Worker hiện có                                            |
| Thêm | `apps/dhcb/preview.html`                       | R1    | Script inline (không module — origin mờ sẽ bị CORS chặn module) đọc trang từ fragment URL rồi `document.write` |
| Thêm | `apps/dhcb/src/lib/workerLanes.ts`             | R1    | Một điểm điều phối 5 làn Worker, dùng chung cho app (khi chưa bật runner) và runner                            |
| Thêm | `apps/dhcb/src/lib/runnerProtocol.ts` (+ test) | R1    | Hợp đồng message (zod/mini) + `parseRunnerOrigin`                                                              |
| Sửa  | `apps/dhcb/src/lib/codeRunner.ts`              | R1/R2 | R1: đi qua `workerLanes.ts`. R2: chọn bridge khi có runner origin                                              |
| Sửa  | `apps/dhcb/vite.config.ts`                     | R1    | `build.rollupOptions.input` thêm 2 entry; `/pyodide`, `/sqljs` vẫn copy như nay                                |
| Thêm | `apps/server/src/runnerHost.ts` (+ test)       | R1    | Host runner → danh sách trắng file tĩnh + CSP riêng, 404 mọi thứ khác; host app chặn 2 trang runner            |
| Sửa  | `apps/server/src/server.ts`                    | R1    | Gắn middleware runner TRƯỚC `/api`                                                                             |
| Sửa  | `packages/core-auth/security.ts`               | R1    | Xuất `allowedOrigins()` để dựng `frame-ancestors` của runner                                                   |
| Sửa  | `nginx/en-vi.conf`                             | R1    | Block 4 cho host runner: mọi request qua Express, xoá Cookie                                                   |
| Sửa  | `apps/dhcb/src/components/HtmlPreview.tsx`     | R2    | `srcDoc` → `src` = `<runner>/preview.html#<base64url>`, `sandbox="allow-scripts"`                              |
| Sửa  | `playwright.config.ts`                         | R2    | Runner chạy ở origin thứ hai: app `localhost`, runner `127.0.0.1` (khác origin, khác site)                     |
| Sửa  | `apps/server/src/routes.ts`                    | R3    | CSP chặt theo Host; băm script theme từ `index.html`; `Report-Only` theo cờ                                    |
| Sửa  | `apps/dhcb/src/main.tsx`                       | R3    | `z.config({ jitless: true })`                                                                                  |

File sẽ TẠO ở bước sau (chưa nằm trong bảng vì `npm run check:specs` kiểm mọi đường dẫn trong
bảng của đặc tả đã duyệt phải tồn tại — PR tạo ra file nào thì dời dòng đó lên bảng):

- R2 — `apps/dhcb/src/lib/runnerBridge.ts` (+ test): iframe lười, chờ `hello` 10s, watchdog huỷ
  iframe khi runner im quá timeout + 5s.
- R2 — `e2e/code-runner-origin.spec.ts`: các ca âm ở mục ④ + không vi phạm CSP.

**Ảnh hưởng lan ra:** chạy `npm run codemap -- impact` cho `codeRunner.ts`, `HtmlPreview.tsx`,
`routes.ts`, `staticApps.ts` lúc thi hành và dán vào PR. Đã biết: 3 trang Lập trình + 9 file E2E
`e2e/programming-*.spec.ts`, `outline-programming.spec.ts`; cổng `size-limit`, vì entry mới phải
nằm NGOÀI JS khởi động của app (`scripts/check-startup-coverage.ts`).

## ③ Hợp đồng dữ liệu

Nguồn sự thật là `apps/dhcb/src/lib/runnerProtocol.ts` (đã sửa lúc thi hành R1 cho khớp mã
thật — bản nháp ban đầu tách `stdout/done/error/timeout` thành nhiều loại sự kiện; nay runner trả
nguyên `CodeRunResult` các làn vẫn trả, để kết quả chấm bài giống hệt trước/sau tách).

**App → runner** (`targetOrigin` = runner origin, không bao giờ `'*'`):

```ts
type WorkerLaneRequest =
  | { lane: 'javascript'; code: string; stdinLines?: string[] }
  | { lane: 'dom'; code: string; html: string; hanhDong?: string[] }
  | { lane: 'fetch'; code: string; html: string; hanhDong?: string[]; api?: FetchApi }
  | { lane: 'sql'; code: string; seed?: string }
  | { lane: 'python'; code: string; stdinLines?: string[]; files?: Record<string, string> }

type RunnerRequest = { type: 'run'; id: string; req: WorkerLaneRequest } | { type: 'reset' }
```

Trần kích thước: code ≤ 500 000 ký tự, đầu ra ≤ 2 000 000 ký tự, danh sách ≤ 1 000 phần tử.
Thời hạn chạy (`timeoutMs`) KHÔNG đi qua message — mỗi làn tự giữ hằng số của nó như hôm nay.

**Runner → app** (`targetOrigin` = origin cha khai ở `?parent=`):

```ts
type RunnerEvent =
  | { type: 'hello'; protocol: 1 } // runner sẵn sàng
  | { type: 'loading'; id: string } // đang tải runtime (Pyodide/sql.js) lần đầu
  | { type: 'output'; id: string; text: string } // đầu ra phát dần
  | { type: 'result'; id: string; result: CodeRunResult } // { output, error?, timedOut, durationMs }
```

Trang runner được mở bằng `https://run.…/runner.html?parent=<origin app>`; nó chỉ nhận tin từ
`window.parent` có đúng origin đó (và CSP `frame-ancestors` của host runner bảo đảm chỉ origin app
nhúng được). **Trang xem trước HTML không dùng postMessage:** trang của học viên đi trong fragment
URL (`preview.html#<base64url UTF-8>` — fragment không gửi lên server), iframe tạo lại (React
`key`) mỗi khi nội dung đổi. Lý do: iframe preview có origin mờ (`sandbox` không
`allow-same-origin`), muốn postMessage tới nó thì phải dùng `targetOrigin '*'` — trái bất biến ở
mục ⑤.

Cả hai phía validate bằng `zod/mini`; message sai hình thì bỏ và ghi `console.warn`.

**Ca lỗi:**

| Tình huống                                | Hành vi mong đợi                                                                                |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `event.origin` lạ (cả hai chiều)          | Bỏ qua, không trả lời                                                                           |
| Runner không gửi `hello` trong 10s        | Lượt chạy trả `error`: "Không mở được khung chạy code — kiểm tra mạng rồi thử lại" (không treo) |
| Code chạy quá `timeoutMs`                 | Runner `terminate()` Worker như hôm nay, trả `timeout` → cùng câu báo hiện có                   |
| Runner im lặng quá `timeoutMs + 5s`       | Bridge huỷ iframe, tạo lại ở lượt sau, trả lỗi như hàng trên                                    |
| Mở thẳng `run.…/runner.html` không có cha | Trang trống, không nhận message (kiểm `window.parent !== window` + origin cha trong danh sách)  |
| `/api/*` trên host runner                 | 404, không chạm handler                                                                         |

## ④ Tiêu chí chấp nhận

- [ ] `curl -sI https://en-vi.donghanhcungban.org/` → `script-src` KHÔNG chứa `'unsafe-inline'`
      lẫn `'unsafe-eval'`. Test `routes.test.ts` canh hằng CSP cho app và hub.
- [ ] Toàn bộ `e2e/programming-*.spec.ts` + `outline-programming.spec.ts` xanh khi runner ở origin
      thứ hai (Playwright `127.0.0.1`).
- [ ] `e2e/code-runner-origin.spec.ts`, ca âm chạy BÊN TRONG code học viên:
      `fetch(appOrigin + '/api/me', {credentials:'include'})` không đọc được dữ liệu;
      `document.cookie === ''`; truy cập `parent.document` ném lỗi; mở thẳng `runner.html`
      rồi postMessage từ origin lạ không chạy code.
- [ ] Vòng lặp vô hạn JS và Python vẫn bị dừng đúng câu báo hiện có, và trang app vẫn bấm được
      trong lúc chờ (E2E).
- [ ] 0 sự kiện `securitypolicyviolation` trên 15 trang của cổng a11y × 3 theme, cộng 3 trang Lập
      trình (gắn listener trong E2E).
- [ ] Đăng nhập Google (GIS popup + nút) chạy trên production sau khi bật CSP chặt: kiểm tay, ghi
      vào changelog.
- [ ] `curl -sI https://run.donghanhcungban.org/api/health` → 404; log Express không thấy header
      `Cookie` từ host runner.
- [ ] Giai đoạn Report-Only (mục 5) chạy đủ thời gian đã chốt ở Q3, Sentry ghi 0 vi phạm thật
      (vi phạm từ extension trình duyệt thì bỏ qua) trước khi bật thật.
- [ ] `npm run size`: JS khởi động của app không tăng quá 1 kB gzip.

**Lệnh chứng minh:**

```bash
rm -rf packages/*/dist dist dist-server && npm run typecheck && npm run lint && npx prettier --check . \
  && npm run test:coverage && npm run build && npm run size && npm run test:e2e
```

## ⑤ Bất biến không được phá

| Bất biến                                                                | Test nào canh nó                                                                         |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Kết quả chấm bài giống hệt trước/sau (cùng hàm chạy, cùng prelude)      | `e2e/programming-*.spec.ts` + unit test các prelude trong `packages/subject-programming` |
| Vòng lặp vô hạn luôn bị ngắt                                            | test `jsRunner`/`pythonRunner` hiện có + ca E2E mới                                      |
| Iframe preview KHÔNG BAO GIỜ có `allow-same-origin`                     | test mới cho `HtmlPreview` (khẳng định giá trị `sandbox`)                                |
| `postMessage` không bao giờ dùng `targetOrigin '*'`                     | test lint/grep mới trong `runnerBridge.test.ts`                                          |
| Header bảo mật hiện có (HSTS, COOP, CORP, nosniff…) giữ nguyên trên app | `packages/core-auth/security.test.ts`, `routes.test.ts`                                  |
| Cổng a11y AA + AAA                                                      | `e2e/a11y.spec.ts`, `e2e/a11y-aaa.spec.ts`                                               |

## ⑥ Quy ước dự án liên quan

- Import xuyên gói dùng `@dhcb/<gói>/<file>` (không đuôi `.js`). Rolldown kiểm `exports`
  nghiêm, nên bare import `@dhcb/<gói>` gãy build.
- `apps/dhcb/src` cấm `console.log` (lint `no-console`), chỉ được `warn`/`error`.
- Sửa `ci.yml` (nếu cần thêm host cho E2E) phải theo CLAUDE.md §11.1. Hook `config-protection`
  sẽ chặn lần đầu, phải nói rõ với chủ dự án.
- Tầng 8b: chụp ảnh 1440px + 390px trang bài học Lập trình (có khung xem trang DOM) trước/sau.
- Mỗi giai đoạn ở mục 5 là một PR. Đổi header là thay đổi bảo mật (CLAUDE.md §12), nên dừng
  hỏi trước khi bật CSP chặt.

## 5. Thứ tự triển khai (mỗi bước một PR, có đường lui)

| Bước | Việc                                                                                                                | Ai                      | Đường lui                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------- |
| R0   | DNS `run` (proxied, Cloudflare) + mở rộng chứng chỉ (`certbot --expand -d run.donghanhcungban.org`) + `server_name` | **Chủ dự án (tay)**     | Xoá bản ghi DNS                                                   |
| R1   | Runner entry + Express/Nginx theo Host + CSP runner. App CHƯA dùng (biến chưa đặt)                                  | AI                      | Revert PR                                                         |
| R2   | Bridge + `HtmlPreview`, bật bằng `VITE_CODE_RUNNER_ORIGIN` lúc build; E2E hai origin                                | AI                      | Bỏ biến build → quay về Worker trong trang                        |
| R3   | CSP chặt cho app + hub ở chế độ **Report-Only** (song song với CSP cũ đang enforce), báo về Sentry                  | AI                      | Tắt cờ Report-Only                                                |
| R4   | Sau thời gian ở Q3 không có vi phạm thật: đổi CSP chặt sang enforce, bỏ CSP cũ                                      | AI, **chủ dự án duyệt** | Biến môi trường `CSP_MODE=legacy` quay lại CSP cũ không cần build |

## 6. Rủi ro

- **Cloudflare tự chèn script inline** (Rocket Loader, một số tính năng "Zaraz"/"Web Analytics" tự
  động) sẽ bị chặn. R3 Report-Only là để bắt đúng loại này. Kiểm dashboard: Rocket Loader phải TẮT.
- **Safari/iOS**: postMessage + Worker trong iframe khác origin chạy được, nhưng chặn cookie bên
  thứ ba không ảnh hưởng vì runner vốn không dùng cookie. Phải thử trên iPhone thật ở R2.
- **Cùng site với app** (tên miền con): trình duyệt có thể chạy runner chung tiến trình với app.
  `Origin-Agent-Cluster` chỉ là gợi ý, nên vòng lặp vô hạn trong khung preview vẫn có thể làm đứng
  tab. Hôm nay cũng vậy, không tệ hơn. Muốn chắc thì dùng domain riêng (Q2).
- **Pyodide ~13 MB tải lại ở origin mới** một lần (cache theo origin). Chỉ chậm lượt Python đầu
  tiên sau khi bật.

## 7. Chi phí

0 đồng nếu dùng tên miền con: chứng chỉ Let's Encrypt và DNS Cloudflare đều miễn phí, chạy chung
VPS và tiến trình. Domain riêng (Q2) thì ~10–15 USD/năm.

## 8. Câu hỏi cho chủ dự án — ĐÃ CHỐT 2026-10-10: cả 4 câu theo đề xuất

| #   | Câu hỏi                                                           | Đề xuất                                                                                                                              |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Q1  | Tên miền con là gì?                                               | `run.donghanhcungban.org`: ngắn, người dùng không bao giờ thấy trên thanh địa chỉ                                                    |
| Q2  | Tên miền con hay domain đăng ký riêng?                            | **Tên miền con trước** (miễn phí, đúng yêu cầu). Biến `VITE_CODE_RUNNER_ORIGIN` để sau này đổi sang domain riêng không phải sửa code |
| Q3  | Report-Only chạy bao lâu trước khi bật thật?                      | 7 ngày (phủ một chu kỳ tuần người học)                                                                                               |
| Q4  | Gỡ luôn SDK đăng nhập Facebook/Apple/Microsoft khỏi `script-src`? | Có: không giao diện nào gọi chúng (chỉ Google). Bớt 3 nguồn script bên thứ ba được tin                                               |
