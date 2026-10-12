# QUY TRÌNH AUDIT TOÀN DIỆN

> Đặc tả quy trình rà soát toàn diện dự án **Gia sư tiếng Anh AI** (bilingual-english-vietnamese).
> Mục tiêu: khi ai đó (người dùng, Claude, hoặc subagent) yêu cầu "audit toàn diện / rà soát toàn bộ",
> có **một chuẩn lặp lại được** — không thiếu bước, không đoán, kết quả so sánh được giữa các lần.
>
> Quan hệ với các tài liệu khác:
>
> - Mục **8–10** trong `CLAUDE.md` = cổng **commit/merge** cho MỘT thay đổi. File này = quy trình
>   **audit ĐỊNH KỲ** cho TOÀN dự án (rộng hơn: bảo mật, độ phủ test, đối chiếu tài liệu, phân loại việc).
> - `docs/framework/HUONG-DAN-cau-hinh-precommit-CI.md` = cấu hình công cụ (Prettier/ESLint/CI). File này
>   = **cách dùng** các công cụ đó thành một lượt audit hoàn chỉnh.

---

## 0. Khi nào chạy audit này

> **Hai KIỂU audit, đừng lẫn.** Mục 1–4 dưới đây là audit **RỘNG**: quét toàn repo theo 11 tầng
> (kèm các tầng phụ 1b · 2b · 5b · 6b · **8b**),
> tìm vấn đề về cổng/bảo mật/vệ sinh/độ phủ. Nó KHÔNG bắt được lỗi tính toán sai âm thầm bên
> trong một luồng nghiệp vụ (số hiển thị lệch số enforce, khoá ghi một đằng đọc một nẻo…) vì
> mọi cổng vẫn xanh khi những lỗi đó tồn tại. Loại lỗi ấy cần audit **SÂU** theo một luồng dữ
> liệu — xem **mục 5** ở cuối file.

- Người dùng yêu cầu trực tiếp ("rà soát toàn bộ", "audit toàn diện").
- **Cổng giữa các giai đoạn** (KHUNG-1): trước khi chuyển giai đoạn hoặc trước thay đổi lớn.
- Định kỳ (khuyến nghị: trước mỗi đợt deploy production, hoặc mỗi cuối tuần làm việc).
- Sau khi merge một loạt PR liên quan nhau, để chắc không có tương tác ngoài ý muốn.

> Audit ≠ cổng commit. Cổng commit chạy cho từng diff nhỏ; audit chạy cho **trạng thái toàn repo**
> ở một thời điểm, kể cả khi working tree sạch (không có diff nào).

---

## 1. Nguyên tắc

1. **Chạy thật, đọc output thật** — không đoán kết quả lệnh (mục 5 CLAUDE.md).
2. **Không sửa trong lúc audit** — audit là ĐỌC + BÁO CÁO. Nếu phát hiện lỗi: ghi vào báo cáo, phân loại
   (tự sửa được / cần người dùng), rồi mới tách việc sửa thành thay đổi riêng có PR. Không trộn "phát hiện"
   với "sửa" trong cùng một lượt — trừ khi người dùng yêu cầu sửa luôn.
3. **Phân loại việc rõ ràng** — mỗi phát hiện phải nói **AI tự làm được** hay **cần người dùng thao tác tay**
   (VD: điền secret trên VPS, chạy migration Supabase production, bật branch protection — AI không có quyền).
4. **Đối chiếu, không tin trí nhớ** — trạng thái thật đọc từ repo/lệnh, KHÔNG lấy từ hook đầu phiên hay
   ghi chú cũ (chúng có thể lỗi thời — đã từng xảy ra với trạng thái migration).

---

## 2. Các tầng audit

Chạy tuần tự. Mỗi tầng ghi rõ: **lệnh**, **tiêu chí đạt**, **nếu fail thì làm gì**, **ai xử lý**.

> **Trước khi chạy bất cứ lệnh `grep` nào trong tài liệu này:** xác nhận đường dẫn trong lệnh CÒN
> TỒN TẠI. Thư mục đã đổi tên (`apps/english` → `apps/dhcb`, gốc repo → `apps/server/src`) khiến
> `grep` trả 0 dòng vì **không có thư mục**, rồi bị chấm nhầm là "✅ 0 vi phạm" — âm tính giả, đã
> xảy ra thật (audit 2026-08-24). Kiểm nhanh: `ls apps/ packages/ | head`. Cột "Đã biết đạt" là
> **ghi chép có ngày tháng** — đường dẫn trong đó phản ánh cấu trúc lúc ghi, không cập nhật theo.

### Tầng 1 — Cổng tự động (bắt buộc, luôn chạy)

| Mục         | Lệnh                   | Tiêu chí đạt                                                                                                           |
| ----------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Build       | `npm run build`        | Thoát 0, không lỗi vite/tsc                                                                                            |
| Typecheck   | `npm run typecheck`    | 0 lỗi (gộp `tsconfig` + `tsconfig.api.json` + `tsconfig.e2e.json`)                                                     |
| Lint        | `npm run lint`         | 0 cảnh báo (`--max-warnings 0`)                                                                                        |
| Format      | `npm run format:check` | "All matched files use Prettier code style"                                                                            |
| Unit test   | `npm test`             | 100% pass; ghi số `X/Y`                                                                                                |
| Bundle size | `npm run size`         | JS ≤ 140 kB · CSS ≤ 18 kB (brotli) — ngưỡng thật đọc ở `.size-limit.json`/cấu hình size-limit, không hardcode số ở đây |

- **Nếu fail:** dừng, ghi lỗi cụ thể vào báo cáo. Đây là fail chặn (blocking).
- **Ai xử lý:** AI tự sửa được (lỗi code/format).
- **Ngân sách bundle: ghi cả BIÊN ĐỘ CÒN LẠI, không chỉ đạt/không đạt.** `size-limit` chỉ nói
  pass/fail, nên "còn 0,3 kB" và "còn 40 kB" trông giống hệt nhau trong báo cáo. Tính
  `còn lại = ngưỡng − thực đo` và ghi kèm %; **≥ 95% ngưỡng → cảnh báo trong báo cáo** (tính năng
  nhỏ kế tiếp sẽ làm CI đỏ). Đo 2026-08-25 sau khi nới ngưỡng (PR-L6b): JS 122,84/140 kB (87,7%) · CSS 15,66/18 kB (87,0%).

**1b. Test KHÔNG ỔN ĐỊNH (flaky) — một lượt xanh KHÔNG chứng minh được gì:**

CI chạy `npm test` đúng **một** lượt. Test đỏ ngẫu nhiên 1/10 lượt vẫn lọt qua mọi cổng suốt
nhiều tuần, rồi đỏ đúng hôm cần merge gấp — và bị coi nhầm là "lỗi mới của PR này".

- **Lệnh:** chạy `npm test` **≥ 3 lượt liên tiếp**, ghi lại số lượt xanh/tổng số lượt.
- **Tiêu chí đạt:** 3/3 xanh với cùng số test. Bất kỳ lượt nào đỏ → sang bước phân loại.
- **Phân loại đỏ là flaky hay lỗi thật:** chạy RIÊNG file đó ≥ 5 lượt
  (`npx vitest run <đường-dẫn-file>`). Xanh hết → flaky (chỉ đỏ dưới tải/khi chạy chung).
  Đỏ lại → lỗi thật, xử lý như fail chặn.
- **Không được kết luận "flake" mà không có nguyên nhân.** Phải chỉ ra cơ chế, và chứng minh
  bằng số. Bốn nguồn hay gặp trong dự án này:
  1. `Math.random()`/`Date.now()` nằm trong chính code được test → tính xác suất fail rồi **đo
     thực nghiệm** để đối chiếu (đợt 2026-08-24: khẳng định 1000 ID 8 ký tự hex không trùng ⇒
     không gian 2³² ⇒ nghịch lý sinh nhật cho ~0,012%/lượt, đo 2000 vòng khớp lý thuyết).
  2. Phụ thuộc thứ tự test / trạng thái dùng chung giữa các test trong cùng file.
  3. Timeout quá sát khi máy chịu tải (chạy kèm coverage chậm hơn hẳn).
  4. Ranh giới ngày/múi giờ (test chạy đúng lúc qua nửa đêm giờ VN).
- **Cách vá đúng:** sửa **TEST**, không sửa code sản phẩm, khi bản thân code không sai —
  ví dụ trên: `createRequestId()` chỉ dùng để nối log, trùng 1/8.600 lượt là chấp nhận được;
  cái sai là test đòi hỏi bất biến mạnh hơn thứ hàm cam kết.
- **Ai xử lý:** AI tự sửa được.
- **Lưu ý stderr "giả":** `apps/dhcb/src/lib/ai.test.ts`/`packages/core-ai/ai.test.ts` in log lỗi có
  chủ đích (test nhánh xử lý lỗi). Đó KHÔNG phải
  test fail — chỉ đọc dòng `Test Files … passed` / `Tests … passed` để kết luận.

### Tầng 2 — Bảo mật

| Mục                     | Cách kiểm                                                                                                                                                                                                                                                                          | Tiêu chí đạt                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Secret hardcode         | Quét `sk-…`, `AIza…`, `api_key=…` trong `apps/*/src`/`apps/server/src`/`packages` (trừ `*.test.*`)                                                                                                                                                                                 | 0 khớp                                                          |
| `.env` bị track         | `git ls-files \| grep -E "^\.env($\|\.)"`                                                                                                                                                                                                                                          | chỉ `.env.example`                                              |
| Lỗ hổng dependency      | `npm audit --omit=dev`                                                                                                                                                                                                                                                             | 0 mức high/critical (low/moderate: ghi nhận, cân nhắc)          |
| Logic nhạy cảm ở server | Rà `apps/server/src/api/` + `apps/server/src/server.ts`: kiểm quyền (`validateAuth`), đếm lượt, gọi AI đều ở server                                                                                                                                                                | không có logic nhạy cảm chạy ở client                           |
| Kiểm quyền mỗi handler  | Đối chiếu `apps/server/src/api/**/*.ts` — mọi endpoint đọc/sửa dữ liệu người dùng đều gọi `validateAuth()` (dự án đã rời Supabase, không còn RLS — xem `docs/migration-thoat-ly-supabase.md`); endpoint công khai có chủ đích (vd `app-settings.ts`) phải có comment giải thích rõ | mọi handler chạm dữ liệu riêng tư đều kiểm `user_id` khớp token |

- **Nếu fail:** secret lộ = fail chặn, xử lý NGAY (xoay key nếu đã đẩy lên remote). `npm audit` high/critical =
  ghi vào báo cáo + đề xuất nâng phiên bản.
- **Ai xử lý:** AI rà + đề xuất; xoay key thật / cập nhật secret trên VPS = **người dùng**.

### Tầng 2b — Checklist OWASP mở rộng (2026-08-04)

> Chắt lọc từ 5 nguồn tham khảo bảo mật ứng dụng web phổ biến, áp vào đúng stack dự án (Express +
> `pg` tự host + React SPA), **không** cài công cụ scan mới — chỉ thêm hạng mục kiểm tra thủ công/grep
> vào audit đã có:
>
> - [OWASP WSTG](https://github.com/OWASP/wstg) — khung 12 nhóm test chuẩn (Configuration, Authentication,
>   Authorization, Session Management, Input Validation, Error Handling, Cryptography, Business Logic,
>   Client-side, API Testing…) — dùng làm **khung phân loại** cho bảng dưới, không chạy full WSTG (dự án
>   nhỏ, không có pentest team).
> - [OWASP-Web-Checklist](https://github.com/0xRadi/OWASP-Web-Checklist) +
>   [Awesome-Application-Security-Checklist](https://github.com/MahdiMashrur/Awesome-Application-Security-Checklist)
>   — nguồn các dòng checklist cụ thể bên dưới.
> - [w3af](https://github.com/andresriancho/w3af) / [Arachni](https://github.com/Arachni/arachni) — hai
>   scanner tự động; dự án **không cài** (nặng, cần server riêng để scan, rủi ro scan nhầm production của
>   người khác trên cùng VPS). Thay vào đó mượn **danh mục lỗ hổng** chúng qua active/passive check (SQLi,
>   XSS, CSRF, path traversal, header thiếu, cookie không an toàn…) làm checklist thủ công dưới đây —
>   tinh thần "biết scanner sẽ tìm gì" mà không cần chạy scanner.

**Cách chạy:** đọc code thật (`Grep`/`Read`), KHÔNG đoán. Với mỗi dòng ❌ → ghi vào báo cáo, phân loại
AI tự sửa được hay cần người dùng. Không chạy `npm audit`/`eval:tutor` lại ở đây (đã có Tầng 2/4).

| #   | Nhóm (theo WSTG)                     | Kiểm tra cụ thể                                                                                                                                                                         | Cách kiểm trong repo này                                                                                                                                                                                                                                                                                                                                  | Đã biết đạt (xác nhận 2026-08-04, lượt audit thật đầu tiên sau khi thêm Tầng 2b)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Injection — SQLi                     | Mọi câu Postgres dùng tham số hoá (`$1, $2…`), không nối chuỗi trực tiếp                                                                                                                | `grep -rnE "(pool\|client\|db)\.query\(\s*\`" apps/server/src packages --include=*.ts \| grep -v "\.test\." \| grep -E '\$\{'`— bắt mọi query dùng template literal có chèn biến. Mỗi kết quả phải xác minh biến chèn vào là **định danh** (tên bảng/cột) đến từ hằng số trong code, KHÔNG phải giá trị từ người dùng (giá trị luôn phải đi qua`$1, $2…`) | ✅ 0 query nối chuỗi — soát lại mỗi lần thêm handler mới                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2   | Injection — Command/Path             | Không có `child_process.exec`/`fs` ghép trực tiếp input người dùng vào đường dẫn                                                                                                        | `grep -rnE "exec\(                                                                                                                                                                                                                                                                                                                                        | execSync                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | spawn\( | path\.join\(._req\." apps/server/src packages --include=_.ts` | ✅ 0 kết quả — STT/TTS ghi file cache theo hash, không theo tên người dùng gửi lên |
| 3   | XSS                                  | Không dùng `dangerouslySetInnerHTML` với dữ liệu chưa qua sanitize; React tự escape phần còn lại                                                                                        | `grep -rn "dangerouslySetInnerHTML" apps/dhcb/src apps/hub/src`                                                                                                                                                                                                                                                                                           | ✅ 0 kết quả — React escape mặc định đủ dùng, giữ nguyên, không thêm `dangerouslySetInnerHTML` khi chưa có lý do + sanitize (DOMPurify)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 4   | CSRF                                 | Endpoint đổi trạng thái (POST/PUT/DELETE) yêu cầu Bearer token riêng (không chỉ dựa cookie tự động gửi) → giảm rủi ro CSRF theo thiết kế token-based hiện tại                           | Xác nhận `validateAuth()` đọc header `Authorization`, không phải cookie session                                                                                                                                                                                                                                                                           | ✅ Bearer token qua header, không cookie — CSRF cổ điển không áp dụng. Webhook thanh toán (`apps/server/src/api/billing/payment-webhook.ts`) xác minh chữ ký riêng qua `verifySepayApiKey`, không dựa "đăng nhập"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 5   | Auth — brute force / enumeration     | Endpoint login/đăng ký không lộ "email tồn tại hay không" qua message khác nhau; có giới hạn số lần thử                                                                                 | Đọc `packages/core-auth/auth.ts` + `packages/core-auth/authService.ts`, đối chiếu message lỗi + rate limit áp dụng cho `/api/auth*`                                                                                                                                                                                                                       | ✅ Message lỗi gộp chung "Email hoặc mật khẩu không đúng" (không lộ email tồn tại), có rate limit 429 "Quá nhiều yêu cầu"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 6   | Session/Token                        | Token có hạn dùng (expiry), không log token ra console/Sentry, đăng xuất thu hồi được                                                                                                   | `grep -rnE "console\.(log\|info\|debug).*([Tt]oken\|[Aa]uthorization\|password)" apps/*/src apps/server/src packages --include=*.ts --include=*.tsx \| grep -v "\.test\."`                                                                                                                                                                                | ✅ 0 chỗ log token. Sentry client (`apps/dhcb/src/lib/errorTracking.ts`) và server (`apps/server/src/api/_lib/sentry.ts`) đều KHÔNG bật request-handler/tracing tự động — chỉ `captureException`/`captureServerException` thủ công với `extra` tối giản (path, method, context) → không có đường nào Authorization header lọt vào Sentry                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 7   | Authorization / IDOR                 | Mọi handler đọc/sửa dữ liệu theo `id` từ URL/body đều đối chiếu `user_id` lấy từ token, không tin `user_id` client gửi lên                                                              | Đã có ở Tầng 2 gốc ("Kiểm quyền mỗi handler") — bổ sung: rà riêng các handler có tham số `:id`/`userId` trong query string (VD `history.ts`, `progress.ts`, `profile.ts`) xem có so khớp `req.user.id` hay dùng thẳng param                                                                                                                               | ✅ `history.ts`/`progress.ts`/`profile.ts` đều lấy `user_id` từ `validateAuth()` rồi mới query (`where user_id = $1`) — không có handler nào tin `id`/`userId` từ query string client                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 8   | File upload (STT audio)              | Giới hạn kích thước + loại file audio nhận vào `/api/stt`; không cho ghi ra ngoài thư mục cache dự kiến                                                                                 | Đọc `packages/core-ai/stt.ts`: có giới hạn `bodyParser`/base64 size không, có validate mime/độ dài trước khi gửi Whisper                                                                                                                                                                                                                                  | ✅ `server.ts:102` giới hạn `express.json({ limit: '10mb' })` riêng cho `/api/stt`; `stt.ts` có `checkRateLimit(clientIp, 15)` riêng                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 9   | Security headers                     | CSP, `X-Content-Type-Options`, `Referrer-Policy` đã có (`server.ts`); còn thiếu `X-Frame-Options`/`frame-ancestors`, `Strict-Transport-Security`, `Permissions-Policy`                  | `grep -rnE "X-Frame\|Strict-Transport\|Permissions-Policy\|frame-ancestors\|Content-Security-Policy" apps/server/src packages/core-auth/security.ts`                                                                                                                                                                                                      | ✅ **XONG (2026-08-04).** CSP (kèm `frame-ancestors 'self'`) + nosniff + Referrer-Policy có ở Express (`server.ts` ~144-174, phủ mọi request vì cả 2 block Nginx đều proxy thẳng về Express, không tách static). `Strict-Transport-Security` + `Permissions-Policy` phát hiện thiếu qua đối chiếu `/etc/nginx/sites-available/{default,en-vi}` thật trên VPS → người dùng đã thêm `add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;` + `add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;` vào block HTTPS `.org` trong `default`, `nginx -t && systemctl reload nginx` — **xác nhận sống qua `curl -sI https://www.donghanhcungban.org` cùng ngày, cả 2 header đều có**. `nginx/en-vi.conf` trong repo vẫn là file mẫu/lịch sử cố ý giữ `.com` (xem `docs/doi-ten-mien-chinh-org.md` mục "Không nằm trong phạm vi này") — không sửa file mẫu |
| 10  | CORS                                 | Nếu có bật CORS cho origin khác domain chính, danh sách origin phải whitelist rõ, không `*` khi có credentials                                                                          | `grep -rn "Access-Control-Allow" apps/server/src packages/core-auth/security.ts`                                                                                                                                                                                                                                                                          | ✅ Same-origin SPA — 0 middleware CORS mở rộng trong `server.ts`/`api/`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 11  | Rate limiting / anti-automation      | Endpoint tốn tài nguyên (AI, STT, TTS, auth) có giới hạn lượt/IP hoặc /user, tách biệt đếm lượt nghiệp vụ (Free/Pro) và rate-limit chống spam kỹ thuật                                  | Đọc `packages/core-ai/{ai,stt,tts}.ts` — xác nhận có áp cho `/api/auth`, `/api/agent`, `/api/stt`, `/api/tts`, không chỉ đếm lượt nghiệp vụ                                                                                                                                                                                                               | ✅ `checkRateLimit` áp riêng theo IP cho cả 4: `ai.ts` (5), `stt.ts` (15), `tts.ts` (60, 2 điểm chặn), `auth.ts` (429 riêng) — tách biệt hoàn toàn với đếm lượt nghiệp vụ Free/Pro                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 12  | Business logic (đếm lượt/thanh toán) | Không thể gọi API AI vượt giới hạn bằng cách gọi song song (race condition đếm lượt), webhook thanh toán xác minh chữ ký + idempotent (không cộng tiền 2 lần nếu SePay gửi lại)         | Đã có phần trong Tầng 5b ("Async race / idempotency… `0004_refund_usage`") — bổ sung riêng cho `payment-webhook`: xác nhận có kiểm tra "đã xử lý giao dịch này chưa" trước khi cộng plan                                                                                                                                                                  | ✅ `apps/server/src/api/billing/payment-webhook.ts:79` — `if (payment.status === 'paid') return ok(...)` chặn xử lý lại trước khi cộng plan → idempotent                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 13  | Error handling / thông tin lộ        | Response lỗi cho client không kèm stack trace / chi tiết nội bộ (tên bảng, path server) ở production                                                                                    | `grep -rn "\.stack" apps/server/src packages --include=*.ts \| grep -v "\.test\."` rồi xác nhận không trả thẳng ra response                                                                                                                                                                                                                               | ✅ 0 kết quả — không có response nào trả thẳng `.stack` ra client                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 14  | Sensitive data ở client              | Không có API key/secret nào lộ trong bundle client (`apps/dhcb/src`, `apps/hub/src` — KHÔNG tính `apps/server/src`) — chỉ biến `VITE_*` public (site URL, Google client ID publishable) | `grep -rn "process\.env\." apps/dhcb/src apps/hub/src \| grep -v VITE_` — liệt kê TƯỜNG MINH từng app client, **đừng dùng `apps/*/src`** vì glob đó nuốt luôn `apps/server/src` (code server được phép đọc biến môi trường) → 94 dòng dương tính giả (phải rỗng — code client không được đọc biến server)                                                 | ✅ 0 kết quả — chạy grep này mỗi audit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

**Ghi chú phạm vi:** danh mục trên ưu tiên các lớp lỗ hổng OWASP Top 10 còn _chưa_ có dòng kiểm tra rõ
trong Tầng 1–2 gốc (CSRF, headers, rate limiting, error leak, file upload, IDOR theo param, secret lộ ở
client). Các lớp đã có sẵn (secret hardcode, `.env`, `npm audit`, `validateAuth`) **không lặp lại** ở
đây — xem Tầng 2 gốc.

- **Nếu fail:** ghi từng dòng ❌ cụ thể vào báo cáo kèm số dòng #. Không tự sửa trong lúc audit trừ
  khi người dùng yêu cầu (nguyên tắc mục 1.2).
- **Ai xử lý:** AI rà + đề xuất vá (thêm header, thêm rate limit, sửa error handler) đều tự làm được
  qua PR riêng; xoay secret / cấu hình Nginx-VPS thật = **người dùng**.

### Tầng 3 — Vệ sinh code

| Mục                     | Cách kiểm                                                       | Tiêu chí đạt                                                   |
| ----------------------- | --------------------------------------------------------------- | -------------------------------------------------------------- |
| `console.log` rác       | Quét `apps/*/src`/`apps/server/src`/`packages` (trừ `*.test.*`) | 0 (log khởi động chủ đích trong `server.ts` KHÔNG tính là rác) |
| TODO/FIXME/XXX sót      | Quét `apps/*/src`/`apps/server/src`/`packages` (trừ test)       | 0, hoặc mỗi cái có issue/ghi chú trong PROGRESS                |
| `any` lọt lưới          | Quét `: any` / `as any` ngoài test                              | 0 mới (mục 4.1 CLAUDE.md)                                      |
| Code chết / import thừa | Lint đã bắt phần lớn (`no-unused-vars`)                         | không còn cảnh báo                                             |
| Chu trình import        | `npm run codemap -- cycles`                                     | "Không có chu trình import"                                    |
| File không ai import    | `npm run codemap -- orphans` (xem bước lọc bên dưới)            | 0 file mồ côi THẬT                                             |
| Đánh số migration       | xem bước kiểm bên dưới                                          | 0 số bị trùng, 0 số bị nhảy cóc                                |

**Lọc kết quả `orphans` (bắt buộc — nếu không sẽ toàn báo động giả).** Lệnh trả cả trăm file vì
test, script chạy tay và trang route **vốn dĩ** không ai import. Lọc rồi mới soi phần còn lại:

```bash
npm run codemap -- orphans | grep -vE "test\.ts|scripts/archive|main\.tsx"
```

Mỗi file còn lại: xác nhận bằng `grep -rn "<TênFile>" apps packages --include=*.ts --include=*.tsx`
(loại chính nó). 0 kết quả = code chết thật → **báo cáo, KHÔNG tự xoá** (xoá cần người dùng xác
nhận, theo Bước bổ sung ở cuối mục 2). Đợt 2026-08-24 bắt được 201 dòng theo cách này.

**Kiểm đánh số migration.** Chuỗi migration là thứ tự thi hành trên DB thật — số trùng làm thứ tự
giữa 2 file trở thành may rủi theo alphabet; số nhảy cóc thường là dấu hiệu một file bị mất khi
rebase:

```bash
ls postgres/migrations/*.sql | xargs -n1 basename | sed -E 's/^([0-9]+)_.*/\1/' | sort | uniq -d   # phải rỗng
```

> **Số trùng KHÔNG làm bỏ sót migration** — `scripts/run-pg-migrations.ts` theo dõi theo **tên
> file**, không theo số (đã kiểm chứng bằng lượt chạy thật 2026-08-24). Vấn đề là **thứ tự**: hai
> file trùng số mà có phụ thuộc lẫn nhau thì chạy đúng hay sai là do tình cờ. Gặp số trùng → kiểm
> 2 file có chạm cùng bảng không; không chạm nhau thì ghi nhận là nợ quy ước, có chạm nhau thì
> **đổi số ngay** (fail chặn).

- **Ai xử lý:** AI tự sửa được (xoá code chết: cần người dùng xác nhận trước).

### Tầng 4 — Chất lượng AI (chỉ khi liên quan)

- **Kích hoạt khi:** `apps/dhcb/src/prompts/*` hoặc `packages/core-ai/aiConfig.ts` đổi NỘI DUNG kể từ
  lần cập nhật baseline gần nhất. Xác định bằng lệnh, đừng đoán:

  ```bash
  git log -1 --format=%ad --date=short -- apps/dhcb/src/prompts packages/core-ai/aiConfig.ts
  git log -1 --format=%ad --date=short -- docs/research/eval-tutor-baseline.md
  ```

  Ngày đầu MỚI HƠN ngày sau → baseline đã cũ, phải chạy lại. Lưu ý phân biệt đổi **nội dung** với
  **di chuyển file** (đợt cải tổ cấu trúc): xem `git show --stat <commit>` trước khi kết luận.

- **Lệnh:** `npm run eval:tutor` (cần key AI trong `.env`).
- **Tiêu chí đạt:** recall/precision **không tụt** so với `docs/research/eval-tutor-baseline.md`.
- **Nếu fail:** không được merge thay đổi prompt/model; dán bảng so sánh vào báo cáo (mục 8 CLAUDE.md).
- **Ai xử lý:** AI chạy được nếu có key; nếu không có key trong môi trường audit → ghi "cần chạy tay có key".

### Tầng 5 — Độ phủ test (coverage) + rà vùng thiếu test

Đây là phần đi xa hơn cổng commit: không chỉ "test có xanh không" mà "test có ĐỦ không".

**5a. Coverage gate (định lượng):**

- **Lệnh:** `npm run test:coverage`.
- **Tiêu chí đạt:** vượt ngưỡng SÀN trong `vitest.config.ts` (cơ chế "ratchet" — không tệ hơn hiện tại).
  **Đọc ngưỡng từ `vitest.config.ts` mỗi lượt, ĐỪNG chép số vào đây** — số chép tay trong tài liệu
  sẽ lệch với cấu hình thật (đã xảy ra: tài liệu ghi 93/89/96/93 trong khi cấu hình là 90/90/90/90,
  phát hiện 2026-08-24):

  ```bash
  grep -A5 "thresholds" vitest.config.ts
  ```

  Đo thực tế 2026-08-24: statements 93,27% · branches 90,17% · functions 96,48% · lines 93,27%
  (sàn cấu hình 90 cả 4). **Ghi cả biên độ dư** — branches chỉ dư 0,17 điểm, thêm một nhánh
  chưa test là CI đỏ.

- **Cảnh báo ratchet ngược:** nếu ngưỡng trong `vitest.config.ts` THẤP HƠN lần audit trước, đó là
  ratchet đi lùi — ghi vào báo cáo kèm commit đã hạ nó, đừng lặng lẽ chấp nhận.
  Chỉ đo LOGIC THUẦN (`apps/*/src/lib/**`, `apps/server/src/**`, `packages/**`), không đo UI.
- **Khi thêm test mới:** NÂNG DẦN các ngưỡng này (đừng để trôi xuống). Ghi mốc mới vào PROGRESS.

**5b. Rà vùng thiếu test (định tính — theo mục 9 CLAUDE.md "chống lỗi logic"):**

Mở báo cáo coverage HTML (`coverage/index.html`) và soi các file `apps/*/src/lib/**`/`packages/**` + `apps/server/src/**` có nhánh chưa phủ.
Với mỗi hàm logic phức tạp, đối chiếu checklist:

- [ ] **Ca biên / rỗng:** mảng rỗng, chuỗi rỗng, `undefined`, giá trị 0.
- [ ] **`null` vs 0:** phân biệt "chưa có" và "bằng không" (đếm lượt, điểm, streak).
- [ ] **Async race / idempotency:** gọi 2 lần, gọi song song, retry — đặc biệt đếm lượt (`packages/core-billing/usage.ts`)
      và hoàn lượt (`0004_refund_usage`).
- [ ] **Thời gian UTC:** ranh giới ngày, đổi múi giờ, reset lượt theo ngày.
- [ ] **Nhánh lỗi:** mọi thao tác mạng/DB/AI có test cho nhánh thất bại.

**Tiêu chí đạt:** mỗi nhánh logic phức tạp có ≥ 1 test ca biên. Vùng thiếu → **ghi danh sách đề xuất bổ sung
test** vào báo cáo (KHÔNG tự viết test trong lượt audit — đó là việc tách riêng, trừ khi người dùng yêu cầu).

**5c. E2E + a11y:**

- **Lệnh:** `npm run test:e2e` (Playwright + axe).
- **Tiêu chí đạt:** mọi flow chính xanh; axe không có vi phạm WCAG AA mới.
- **Ai xử lý:** AI chạy được nếu môi trường có Chromium (`/opt/pw-browsers`).

### Tầng 6 — Đối chiếu tài liệu & hạ tầng

| Mục                        | Cách kiểm                                                                                                                                                                                                                                                                   | Tiêu chí đạt                                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Git vs nhánh chính         | `git fetch origin main && git rev-list --left-right --count origin/main...HEAD`                                                                                                                                                                                             | biết rõ ahead/behind; nếu behind → cân nhắc rebase                                                        |
| Working tree               | `git status -sb`                                                                                                                                                                                                                                                            | sạch, hoặc mọi thay đổi có chủ đích                                                                       |
| PROGRESS.md khớp thực tế   | Đọc PROGRESS + đối chiếu code/migration thật                                                                                                                                                                                                                                | không có mục "đã xong" mà code chưa có (và ngược lại)                                                     |
| Migration Postgres tự host | Đọc `postgres/migrations/README.md` (danh sách file) — **tự động áp khi deploy** (`scripts/deploy.sh` gọi `npm run migrate:pg` mỗi lượt, deploy tự chạy khi push lên `main`) nên KHÔNG cần thao tác tay như Supabase cũ; vẫn nên xác nhận qua log deploy nếu vừa đổi schema | biết mọi migration đã merge có nằm trong lần deploy gần nhất; **đọc file thật, không tin hook đầu phiên** |
| Nợ kỹ thuật                | Đối chiếu danh sách nợ trong CLAUDE.md/PROGRESS với thực tế                                                                                                                                                                                                                 | mỗi nợ còn đúng, phân loại ai xử lý                                                                       |

**6b. Tài liệu ĐIỀU HÀNH có nói đúng thực tế không (bổ sung 2026-08-24).**

Khác dòng "PROGRESS.md khớp thực tế" ở trên (soát _tính năng_), mục này soát các tài liệu mà **AI
đọc rồi hành động theo** — sai ở đây thì sai lan sang mọi phiên sau, không tự lộ ra bao giờ:

| Mục                        | Cách kiểm                                                                                                      | Tiêu chí đạt                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Hook đầu phiên             | Đọc `.claude/report-status.sh`, đối chiếu từng khẳng định với CLAUDE.md mục 13 + PROGRESS "Nợ kỹ thuật còn mở" | 0 khẳng định ghi cứng đã lỗi thời  |
| Đường dẫn trong đặc tả     | `grep -oE "(apps\|packages\|docs\|scripts)/[A-Za-z0-9_./*-]+" <file.md> \| sort -u` rồi `ls` từng cái          | mọi đường dẫn THẬT còn tồn tại     |
| Cấu trúc thư mục CLAUDE.md | `ls apps/ packages/` đối chiếu mục 6 "Cấu trúc" của CLAUDE.md                                                  | mọi app/gói thật đều được nhắc tới |

> **Hai loại kết quả cần bỏ qua khi chạy lệnh trên** (không phải đường dẫn chết thật): mẫu có `*`
> (vd `apps/*/src`), và chuỗi bị cắt giữa chừng vì dính chữ tiếng Việt ngay sau dấu `/` — vd
> "Quét scripts/tính năng" cho ra `scripts/t`. Ngoài ra `apps/english` xuất hiện có chủ đích
> trong chính lời cảnh báo về đợt đổi tên — đó là ví dụ, không phải đường dẫn đang dùng.

**Vì sao cần:** hook `.claude/report-status.sh` là dòng chữ **mọi phiên đọc đầu tiên**. Đợt
2026-08-24 nó vẫn ghi cứng "VPS 1 vCPU nên chưa có lợi ích song song thật" trong khi VPS đã nâng
**3 vCPU** từ 2026-08-21 và PM2 chạy thật 3 instance — mọi phiên sau đó đều khởi động với một
tiền đề sai. Cùng lượt: `apps/hub/` (app thứ 3, có build riêng trong `npm run build`) không được
nhắc ở bất kỳ đâu trong CLAUDE.md; và chính file QUY-TRÌNH-AUDIT này còn 8 chỗ trỏ `apps/english`.

> Nguyên tắc: **tài liệu điều hành sai nguy hiểm hơn code sai** — code sai làm đỏ cổng, tài liệu
> sai thì im lặng và được tin tưởng.

- **Ai xử lý:** AI đối chiếu + báo cáo; chạy migration production / rebase = cần người dùng xác nhận.

### Tầng 7 — Báo cáo & phân loại

Xuất báo cáo theo **mẫu ở §3 bên dưới** (mở rộng từ mẫu mục 10 CLAUDE.md), rồi thêm phần phân
loại việc.

> **Số thứ tự KHÔNG phải thứ tự chạy.** Tầng 7 là bước CUỐI CÙNG dù mang số 7 — các tầng 8–11
> được thêm về sau nên nhận số lớn hơn, nhưng phải chạy XONG hết rồi mới viết báo cáo. Thứ tự
> chạy thực tế: 1 → 1b → 2 → 2b → 3 → 4 → 5 → 6 → 6b → 8 → 9 → 10 → 11 → Bước bổ sung → **7**.

### Tầng 8 — Hiệu năng thực đo (Core Web Vitals)

- **Kích hoạt khi:** audit định kỳ trước deploy lớn, hoặc khi thay đổi UI/trang tải nhiều dữ liệu.
- **Cách kiểm:** chạy Lighthouse (CLI hoặc DevTools) trên domain production
  (https://en-vi.donghanhcungban.org) cho trang chủ + 1-2 trang tải nặng (Dictionary, CEFR level).
- **Tiêu chí đạt:** LCP ≤ 2.5s · INP ≤ 200ms · CLS ≤ 0.1 (ngân sách mục 4.7 CLAUDE.md).
- **Nếu fail:** ghi vào báo cáo kèm trang cụ thể + chỉ số vượt ngưỡng; không tự sửa trong lượt audit.
- **Ai xử lý:** AI đo + đề xuất; sửa performance thật (code-splitting, ảnh, font) = việc riêng.

### Tầng 8b — NHÌN trang thật bằng ảnh chụp (bổ sung 2026-09-05)

> **Vì sao phải có tầng riêng:** đây là loại lỗi mà **đọc mã không thấy được**. Trong chuỗi ba đợt
> thiết kế lại desktop giáo dục (PR #861/#862/#863) có **bốn** lỗi lặp nội dung, tất cả đều chỉ lộ
> ra khi chụp ảnh trang rồi nhìn. Không lỗi nào bị build/typecheck/lint/test/a11y bắt, và cả bốn
> đều **trông hoàn toàn hợp lý ở dòng mã của nó**:
>
> - `<div className="flex … md:block">` bọc một `<p>` mô tả, cộng thêm một `<p>` khác
>   `hidden md:block` in đúng nội dung đó. Đọc thì tưởng "dưới md kiểu này, từ md kiểu kia" —
>   thật ra `md:block` chỉ đổi `display`, **không ẩn**, nên từ 768px trở lên chữ hiện HAI LẦN.
> - Một `PageHeader` và một khối hero đứng cách nhau 40 dòng, cùng in một tiêu đề. Mỗi khối đọc
>   riêng đều đúng; chỉ khi nhìn trang mới thấy chúng nói cùng một câu hai lần (và trang có hai `<h1>`).
> - Một lưới `grid-cols-1 sm:grid-cols-2` trông rất bình thường — cho tới khi đo ra trang cao
>   **37.266px** vì lưới dừng ở nấc `sm:` còn danh sách thì có 139 mục.
>
> Điểm chung: lỗi nằm ở **quan hệ giữa các chỗ cách xa nhau**, hoặc ở **con số chỉ tồn tại sau khi
> trình duyệt dựng xong**. Không có cách nào đọc ra; phải nhìn.

- **Kích hoạt khi:** BẮT BUỘC với mọi đợt việc chạm giao diện. Cũng chạy trong audit định kỳ cho
  các trang trụ cột.
- **Cách kiểm:** chụp mỗi trang trong phạm vi ở **hai bề rộng — 1440px và 390px**, dạng `fullPage`,
  **trước** khi sửa và **sau** khi sửa, rồi **mở ảnh ra nhìn** (không chỉ lưu file).
- **Bốn câu phải tự trả lời trên mỗi ảnh:**
  1. Có câu chữ nào xuất hiện **hai lần** không? (tiêu đề, mô tả, nhãn)
  2. **Chiều cao trang** bao nhiêu? Trên 3–4 lần chiều cao khung nhìn thì hỏi: người dùng có cách
     nào **nhảy** tới nơi họ cần, hay chỉ có mỗi cách cuộn?
  3. Ở 1440px có **mảng trống lớn** nào không — bên phải, hoặc giữa tiêu đề và nội dung chính?
     Việc chính của trang có nằm trong màn hình đầu không?
  4. Ảnh **sau** có làm hỏng ảnh 390px so với ảnh **trước** không? (cam kết "không đổi gì dưới
     1024px" chỉ đáng tin khi có ảnh đối chứng)
- **Tiêu chí đạt:** không có nội dung lặp; mọi danh sách dài hơn ~3 màn hình đều có mục lục/đường
  tắt; ảnh 390px trước và sau khớp nhau (trừ phần cố ý đổi, phải nói rõ là cố ý).
- **Nếu fail:** vá ngay trong đợt nếu là lỗi lặp nội dung (nó sai ở MỌI bề rộng, không riêng
  desktop); ghi vào báo cáo nếu là việc bố cục lớn cần tách đợt.
- **Ai xử lý:** AI chụp, AI nhìn, AI vá. Ảnh đính vào mô tả PR hoặc dẫn số đo (chiều cao trang
  trước/sau) — **số đo là bằng chứng, "trông đẹp hơn" thì không**.

**Công thức chụp (đã dùng thật, chạy được ngay).** Tạo file tạm `e2e/zz-shot.tmp.spec.ts`, chạy
`npx playwright test e2e/zz-shot.tmp.spec.ts`, xem ảnh, rồi **xoá file tạm** trước khi commit:

```ts
import { test } from '@playwright/test'
import { mockLogin } from './helpers/auth'
import { screenshotFullPage, waitForShotReady } from './helpers/fullPageShot'

const OUT = '/tmp/shots' // thư mục nào cũng được, miễn ngoài repo
const ROUTES: [string, string][] = [['/mon-hoc', 'subjects']] // các trang trong phạm vi
const PHASE = process.env.SHOT_PHASE ?? 'before' // đặt 'after' cho lượt sau

for (const [w, h, tag] of [
  [1440, 900, 'desktop'],
  [390, 844, 'mobile'],
] as const) {
  test(`shot ${tag}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h })
    await mockLogin(page, 'vi') // dùng helper thật của dự án, đừng tự gieo localStorage
    for (const [route, name] of ROUTES) {
      await page.goto(route)
      // Chờ theo TRẠNG THÁI (DOM đứng yên + hết skeleton), không chờ cứng số giây — xem helper.
      await waitForShotReady(page)
      // KHÔNG dùng page.screenshot({ fullPage: true }) — xem bẫy thứ tư bên dưới.
      await screenshotFullPage(page, { path: `${OUT}/${PHASE}-${name}-${tag}.png` })
    }
  })
}
```

Bốn cái bẫy đã dính thật khi làm việc này:

- **Đừng tự gieo `localStorage` để giả đăng nhập** — dùng `mockLogin` trong `e2e/helpers/auth.ts`.
  Tự gieo sai khoá thì trang chụp ra là màn đăng nhập, và rất dễ tưởng đó là giao diện thật.
- **Trang gọi API sẽ rỗng** trong môi trường chụp (Vite dev không có backend). Muốn thấy trang có
  dữ liệu thì `page.route('**/api/...', …)` trả dữ liệu giả — nhớ đúng hình dạng đáp ứng
  (`{ subjects: [...] }` khác `{ subject: {...} }`).
- **Đo chiều cao trang bằng máy, đừng ước lượng:** đọc thẳng từ header PNG —
  `python3 -c "import struct;d=open('f.png','rb').read(33);print(struct.unpack('>II',d[16:24]))"`.
- **Đừng chụp bằng `fullPage: true` (bẫy 2026-09-24, `docs/changelog/0433-*.md`).** Trong lúc
  chụp toàn trang, Chromium cho trang thấy khung nhìn **1×1 px** thoáng qua. Ở 1440px, truy vấn
  `(min-width: 1024px)` của `useIsDesktopViewport()` lật false → true, `TwoPane` đổi nhánh, React
  dựng lại cả cột chính: `animate-fade-in` chạy lại, khối nạp dữ liệu quay về skeleton. Ảnh ra
  **mờ và lệch xuống vài px** (Hồ sơ 1440px: 8/10 lần), trong khi đo `opacity` ngay trước khi chụp
  vẫn = 1. `freezeAnimations()` hay `animations: 'disabled'` KHÔNG đủ (vẫn 3–4/10 lần). Dùng
  `screenshotFullPage()` ở `e2e/helpers/fullPageShot.ts`: nó giữ nguyên bề rộng, nới chiều cao
  khung nhìn rồi chụp thường, và **ném lỗi** nếu truy vấn desktop vẫn lật trong lúc chụp. Hệ quả
  cần biết khi nhìn ảnh: phần tử `position: fixed` (thanh bên) nay cao hết ảnh thay vì dừng ở 900px.

### Tầng 9 — Kiểm tra vận hành (production)

- **Kích hoạt khi:** audit định kỳ trước deploy lớn, hoặc nghi ngờ có sự cố gần đây.
- **Cách kiểm:** đọc Sentry (alert/lỗi mới chưa xử lý), log PM2 trên VPS (`pm2 logs` / restart count
  bất thường), dung lượng ổ đĩa còn lại.
- **Tiêu chí đạt:** không có lỗi Sentry mới chưa xem xét; PM2 không có restart loop; ổ đĩa còn đủ chỗ.
- **Nếu fail:** ghi vào báo cáo, phân loại xử lý theo `docs/ke-hoach-khoi-phuc-su-co-server.md` nếu là sự cố thật.
- **Ai xử lý:** AI đọc log qua SSH nếu có quyền; xử lý sự cố thật ưu tiên theo runbook khôi phục.

### Tầng 10 — Tính đúng của logic NGẪU NHIÊN & thống kê (bổ sung 2026-08-24)

> **Vì sao phải có tầng riêng:** đây là loại lỗi mà **KHÔNG cổng nào bắt được**. Build xanh,
> typecheck xanh, lint xanh, test xanh, coverage 100% — mà phân bố kết quả vẫn sai, và người dùng
> là bên duy nhất chịu hậu quả. Nó khác Tầng 5b ("ca biên") ở chỗ: không có đầu vào cụ thể nào
> sai cả; chỉ khi chạy **hàng trăm nghìn lượt rồi đếm** thì cái sai mới hiện ra.

**Cách chạy:** liệt kê trước, đo sau. Đừng đọc code rồi phán "trông có vẻ ngẫu nhiên".

```bash
grep -rn "Math.random" apps/*/src packages --include=*.ts --include=*.tsx | grep -v "\.test\."
```

Với mỗi kết quả, đối chiếu 3 cờ đỏ:

| #   | Cờ đỏ                                                       | Vì sao sai                                                                                                                                                                      |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | `sort(() => Math.random() - 0.5)`                           | **KHÔNG phải thuật toán trộn.** Hàm so sánh không nhất quán → kết quả phụ thuộc thuật toán sort của engine, phân bố lệch nặng. Bản đúng duy nhất: **Fisher–Yates**.             |
| R2  | Đáp án đúng ghép vào mảng ở **vị trí cố định** rồi mới trộn | Nếu phép trộn lệch, vị trí đáp án đúng đoán được → người học ăn điểm bằng cách bấm theo vị trí, điểm số mất ý nghĩa. Dạng hay gặp: `options: [đúng, ...sai].sort(...)`.         |
| R3  | Có **nhiều bản cài đặt trộn song song** trong repo          | Chỗ này Fisher–Yates, chỗ kia `sort(random)` → hai đường cùng mục đích cho hai kết quả khác nhau (thuộc "danh sách D" mục 5.3). Phải gom về **một hàm dùng chung được export**. |

**Tiêu chí đạt — đo, không suy luận.** Với mọi phép trộn có ý nghĩa nghiệp vụ (đáp án trắc nghiệm,
thứ tự câu hỏi, chọn mẫu ôn tập), chạy ≥ 100.000 lượt và đếm phân bố:

```bash
node -e "
const N=400000, K=4;                       // K = số lựa chọn
const pos=new Array(K).fill(0);
for(let n=0;n<N;n++){
  const a=['DUNG']; for(let i=1;i<K;i++) a.push('sai'+i);
  pos[a.sort(()=>Math.random()-0.5).indexOf('DUNG')]++;
}
console.log(pos.map(p=>(p/N*100).toFixed(2)+'%').join(' | '), 'ky vong deu:', (100/K).toFixed(2)+'%');
"
```

Mọi vị trí phải nằm trong **±1 điểm phần trăm** quanh `100/K`. Lệch hơn → **fail**, ghi số đo vào
báo cáo.

**Kết quả đo thật 2026-08-24 (lý do tầng này ra đời):**

| Vị trí đáp án đúng (4 lựa chọn)   | 1         | 2     | 3     | 4         |
| --------------------------------- | --------- | ----- | ----- | --------- |
| `sort(() => Math.random() - 0.5)` | **36,0%** | 17,2% | 15,6% | **31,2%** |
| Kỳ vọng (đều)                     | 25%       | 25%   | 25%   | 25%       |

Bấm luôn ô đầu được **36% thay vì 25%**. Dính ở `apps/dhcb/src/components/StudyTabs.tsx` (tab
Kiểm tra) và `CefrLessonViews.tsx` (test-out cuối vòng) — trong khi
`apps/dhcb/src/lib/cefrExam.ts` đã có Fisher–Yates đúng từ trước (đúng cờ đỏ R3).

**Test bất biến nên thêm kèm khi vá:** chạy hàm trộn N lần, khẳng định mỗi vị trí nằm trong
`[1/K − ε, 1/K + ε]`. Đây là loại test rẻ nhất bắt được lỗi này, và nó sẽ **fail trước khi sửa,
pass sau khi sửa** (điều kiện bắt buộc ở mục 5, Giai đoạn 3).

**Phạm vi khác cùng loại (kiểm luôn khi rà):** chia nhóm A/B, chọn giọng đọc ngẫu nhiên, sinh khoá
/ID ngẫu nhiên (kiểm không gian khoá đủ lớn — xem Tầng 1b nguồn flaky #1), lấy mẫu từ vựng ôn tập
(mọi từ phải có cơ hội như nhau, không thì có từ không bao giờ được ôn).

- **Ai xử lý:** AI tự sửa được. **Lưu ý:** vá phép trộn **làm đổi điểm số** người học nhận được —
  theo mục 5.3 phải nêu rõ trong báo cáo, không lặng lẽ đổi.

### Tầng 11 — Đường CÀI MỚI & tính lũy đẳng của migration (bổ sung 2026-08-24)

> **Vì sao cần:** production nâng cấp bằng cách chạy **migration mới trên DB đã có**. Không ai
> dựng lại từ DB rỗng, nên đường "cài mới" (`schema.sql` + TOÀN BỘ chuỗi migration) có thể hỏng âm
> thầm hàng tháng mà không ai biết — cho tới lúc cần nhất: dựng lại server sau sự cố
> (`docs/ke-hoach-khoi-phuc-su-co-server.md`), hoặc dựng môi trường staging.

Container audit **chạy được việc này offline**, không cần VPS và không đụng dữ liệu thật:

```bash
# 1. Dựng cụm Postgres tạm (initdb TỪ CHỐI chạy bằng root → phải hạ quyền)
export PATH=/usr/lib/postgresql/16/bin:$PATH
D=/tmp/pgaudit; rm -rf $D; mkdir -p $D; chown -R nobody $D
su -s /bin/bash nobody -c "PATH=$PATH initdb -U postgres -A trust -D $D/data"
su -s /bin/bash nobody -c "PATH=$PATH pg_ctl -D $D/data -o '-p 5433 -k $D' -l $D/log start"
psql -h $D -p 5433 -U postgres -c "create database dhcb_audit;"

# 2. Chạy ĐÚNG runner thật của dự án (không viết lại logic áp migration)
export DATABASE_URL="postgresql://postgres@localhost:5433/dhcb_audit"
npx tsx scripts/run-pg-migrations.ts

# 3. LŨY ĐẲNG: chạy lại lần 2 — phải báo "không có gì mới", không đụng gì thêm
npx tsx scripts/run-pg-migrations.ts

# 4. Server đã biên dịch có sống với DB đó không
PORT=3999 NODE_ENV=production node dist-server/server.js &   # PORT tường minh để không đụng dev
curl -s localhost:3999/api/health          # phải trả {"status":"ok",...}
curl -s localhost:3999/api/health/deep     # phải trả {"status":"healthy",...}

# 5. Dọn
su -s /bin/bash nobody -c "PATH=$PATH pg_ctl -D $D/data stop"; rm -rf $D
```

**Tiêu chí đạt:**

- Bước 2 áp hết **N/N** migration, exit 0 — N khớp `ls postgres/migrations/*.sql | wc -l`.
- Bước 3 báo "Đã áp dụng đủ N migration lẻ — không có gì mới" (lũy đẳng).
- Bước 4 `/api/health` trả 200.

**Kết quả 2026-08-24:** `schema.sql` + **65/65** migration chạy sạch trên DB rỗng → 99 bảng / 9
schema; lần 2 lũy đẳng; `/api/health` 200 và `/api/health/deep` "healthy".

> **Đọc đúng kết quả:** `schema.sql` KHÔNG chứa bảng của các migration gần đây (0055–0062) —
> **đó không phải drift**. Runner áp `schema.sql` TRƯỚC rồi mới tới toàn bộ migration, nên cài mới
> vẫn hội tụ đúng trạng thái cuối. Đừng "sửa" `schema.sql` cho khớp; điều phải kiểm là **cả chuỗi
> chạy được**, đúng như bước 2 ở trên.

- **Ai xử lý:** AI chạy được toàn bộ offline. Chạm DB **production** thì tuyệt đối không —
  tầng này chỉ dùng DB tạm trong container.

### Bước bổ sung — Quét scripts/ và tính năng chính (kèm mọi lượt audit toàn diện)

Không tự động hóa được bằng lệnh đơn — làm thủ công, nhanh:

- **Scripts:** liệt kê `scripts/*.ts` (trừ test), đối chiếu với `package.json` "scripts". Script không
  có trong `package.json` → tra `grep -rl <tên-script> docs/ PROGRESS.md apps/*/src/data` để xác nhận là
  script sinh dữ liệu one-off đã có tài liệu tham chiếu (bình thường) hay code chết thật sự (đề xuất xoá).
- **Tính năng chính:** đối chiếu 3 chế độ học (Chat/Viết/Nói) + Lộ trình CEFR + Thanh toán còn hoạt động
  đúng mô tả ở CLAUDE.md mục 1 — tối thiểu chạy thử 1 lượt tay trên trang thật hoặc dev nếu có nghi ngờ,
  không chỉ dựa vào test tự động.
- **Tiêu chí đạt:** không có script/tính năng "mồ côi" (không dùng, không tài liệu, không rõ mục đích).
- **Ai xử lý:** AI quét + đối chiếu; xoá script/tính năng chết = xác nhận với người dùng trước.

---

## 3. Mẫu báo cáo audit

```
=== BÁO CÁO AUDIT TOÀN DIỆN — <ngày giờ UTC> · nhánh <tên> ===

TẦNG 1 — Cổng tự động
Build ✅/❌ | Type ✅/❌ (lỗi:..) | Lint ✅/❌ (cảnh báo:..) | Format ✅/❌ | Test ✅/❌ (X/Y)
Size ✅/❌ (JS ../<ngưỡng>kB = ..% · CSS ../<ngưỡng>kB = ..%)   ← ghi cả % dùng, cảnh báo nếu ≥ 95%

TẦNG 1b — Test không ổn định (flaky)
Số lượt chạy: X | Xanh: Y/X | Test đỏ ngẫu nhiên: [.. tên + cơ chế đã chứng minh + tỉ lệ đo được ..]

TẦNG 2 — Bảo mật
Secret hardcode ✅/❌ | .env sạch ✅/❌ | npm audit (high/critical: ..) | Kiểm quyền handler ✅/❌ (X/Y handler có validateAuth, Z handler công khai có chủ đích)

TẦNG 2b — Checklist OWASP mở rộng
Dòng ❌ (14 mục, xem bảng Tầng 2b): [.. liệt kê # + mô tả ngắn, hoặc "0 — tất cả đạt/đã có bằng chứng"]

TẦNG 3 — Vệ sinh code
console.log rác ✅/❌ | TODO/FIXME ✅/❌ | any lọt lưới ✅/❌ | Chu trình import ✅/❌ | Code chết: [.. file + số dòng ..] | Số migration trùng/nhảy cóc: [..]

TẦNG 4 — Chất lượng AI
(Chạy nếu prompt/model đổi NỘI DUNG sau baseline) eval:tutor ✅/❌ vs baseline | hoặc "N/A — không đổi" | hoặc "CẦN CHẠY TAY — không có key trong môi trường audit, baseline cũ hơn model từ <ngày>"

TẦNG 5 — Độ phủ test
Coverage gate ✅/❌ (stmts/branches/funcs/lines + biên độ dư so với sàn) | E2E+a11y ✅/❌ (X/Y) | Vùng thiếu test đề xuất: [..]

TẦNG 6 — Đối chiếu tài liệu & hạ tầng
Git: ahead X / behind Y | Working tree ✅/❌ | PROGRESS khớp ✅/❌ | Migration chưa áp: [..] | Nợ kỹ thuật: [..]

TẦNG 6b — Tài liệu điều hành có nói đúng thực tế
Hook .claude/report-status.sh ✅/❌ | Đường dẫn trong đặc tả còn sống ✅/❌ | CLAUDE.md nhắc đủ app/gói ✅/❌

TẦNG 8 — Hiệu năng thực đo (nếu chạy)
LCP .. | INP .. | CLS .. | hoặc "N/A — không đo lượt này"

TẦNG 9 — Vận hành production (nếu chạy)
Sentry ✅/❌ (lỗi mới: ..) | PM2 ✅/❌ (restart bất thường: ..) | Ổ đĩa ✅/❌ | hoặc "N/A — không có quyền truy cập VPS lượt này"

TẦNG 10 — Logic ngẫu nhiên & thống kê
Phép trộn dùng Fisher-Yates ✅/❌ | Phân bố đo được (N lượt): [.. so với kỳ vọng đều ..] | Bản trộn song song lệch nhau: [..]

TẦNG 11 — Đường cài mới & lũy đẳng migration
schema.sql + N/N migration trên DB rỗng ✅/❌ | Lũy đẳng lần 2 ✅/❌ | Boot + /api/health ✅/❌

Quét scripts/tính năng: script mồ côi: [..] | tính năng chính còn hoạt động đúng ✅/❌

--- ĐÃ RÀ VÀ KHÔNG CÓ LỖI (ghi lại để lần sau khỏi rà lại) ---
[.. kết quả âm tính là BẰNG CHỨNG đã rà, không phải chỗ bỏ trống — xem mục 5.2 Giai đoạn 1 ..]

--- PHÂN LOẠI VIỆC ---
AI tự làm được: [..]
Cần người dùng thao tác tay: [.. VD: điền secret trên VPS, chạy eval:tutor có key AI, quyết định nâng ngưỡng bundle ..]

Rủi ro/ảnh hưởng: ..
Góp ý cải tiến: ..
KẾT LUẬN: Sẵn sàng / Cần xử lý: [..]
```

Bất kỳ mục ❌ ở Tầng 1–2 (chặn) → nêu rõ trong kết luận là "Cần xử lý", không kết luận "Sẵn sàng".

### 3b. Truy vết & HỘI TỤ (bổ sung 2026-10-12, changelog 0620 — lấy từ khung `seeker19110/project-template`)

Báo cáo audit là ĐIỂM BẮT ĐẦU, không phải điểm kết thúc. Để lượt sửa sau audit không bỏ rơi phát hiện:

- **ID cố định:** mỗi phát hiện mang `F-001`, `F-002`… + `file:dòng` + mức (Cao/Trung/Thấp) + rủi ro nếu để
  nguyên. Mỗi việc sửa mang `W-001`… và ghi rõ đóng những `F-` nào. Truy vết đủ: `F-` → `W-` → PR → bằng chứng.
  Không có `W-` mồ côi (sửa ngoài kế hoạch đã duyệt), không có `F-` bị bỏ rơi (mọi `F-` phải có kết cục).
- **Quét lại sau mỗi đợt sửa** — chỉ các tầng BỊ ẢNH HƯỞNG bởi đợt đó: xác nhận `F-` đã đóng thật, và việc sửa
  không đẻ phát hiện mới. Sau đợt cuối, quét lại toàn bộ một lượt.
- **Tiêu chí thoát (hội tụ):** (1) 0 phát hiện mức Cao còn mở; (2) mọi Trung/Thấp còn lại có quyết định ghi nhận
  — "sửa đợt sau" hoặc "chấp nhận rủi ro" (vào mục nợ của `PROGRESS.md`, kèm lý do + điều kiện xem lại);
  (3) lượt quét cuối không phát sinh phát hiện Cao mới (có → mở đợt bổ sung, lặp lại).
- **Deletion test cho module nghi "nông"** (interface đơn giản mà bên trong rối, một khái niệm rải nhiều file):
  giả định xoá module đó — độ phức tạp CHỈ DỜI CHỖ sang nơi gọi → không đáng động; độ phức tạp DỒN LẠI một chỗ
  rõ hơn → đáng gộp/đào sâu. Ghi kết quả ("dời chỗ"/"dồn lại") vào cột lý do.
- **Dòng "net" cho mục tối ưu/vệ sinh:** kết phần Tầng 3 bằng MỘT dòng `net: -<N> dòng, -<M> dependency có thể
bỏ` — ước lượng từ chính các mục đã liệt kê, không phải con số chung chung.

---

## 4. Ghi chú vận hành

- **Cài dependency trước:** môi trường sạch cần `npm ci` trước khi chạy các tầng (kiểm `node_modules` tồn tại).
- **Song song hóa:** các lệnh độc lập (typecheck / lint / format:check) có thể chạy song song để nhanh hơn;
  build + size phải chạy tuần tự (size đọc `dist/`).
- **Không cần key:** Tầng 1, 1b, 2, 2b, 3, 5a, 6, 6b, 10, 11 chạy được offline không cần secret (Tầng 11
  cần `initdb`/`pg_ctl` — có sẵn trong container audit). Tầng 4 (eval) và một số E2E cần key/mạng.
- **Tầng tốn thời gian nhất:** 1b (≥ 3 lượt `npm test`, ~1,5 phút/lượt) và 5c (E2E ~7 phút). Chạy
  E2E ở NỀN rồi làm tầng khác trong lúc chờ — chúng độc lập nhau.
- **Lịch định kỳ:** có thể dùng `send_later` / trigger để tự hẹn chạy lại audit (đã dùng trong thực tế).
- **Không tự thêm CI/script trong đặc tả này** (quyết định phạm vi 2026-07-17: chỉ tài liệu). Nếu sau này muốn
  gộp Tầng 1–3 thành `npm run audit` hoặc job CI hàng tuần → mở thay đổi riêng, cập nhật file này.

---

## 5. Audit LUỒNG DỮ LIỆU (chuyên sâu một luồng) — bổ sung 2026-08-12

Audit rộng ở mục 2 quét theo **tầng công cụ**. Mục này quét theo **đường đi của dữ liệu**: từ
`<đầu vào>` tới `<đầu ra>` của MỘT luồng cụ thể. Lý do phải có riêng: loại lỗi nguy hiểm nhất
của dự án này — số đếm lệch, khoá ghi/đọc không khớp, hai đường nhập liệu cho hai kết quả khác
nhau — **không làm đỏ bất kỳ cổng nào**. Build xanh, test xanh, lint xanh, mà con số hiển thị
cho người học vẫn sai.

### 5.1. Cách dùng

Chọn TRƯỚC một luồng, đừng rà "tất cả". Điền vào chỗ trống rồi giao nguyên văn prompt ở 5.2.
Ví dụ luồng có thật trong dự án:

| Luồng                    | Đầu vào                                    | Đầu ra                                                              |
| ------------------------ | ------------------------------------------ | ------------------------------------------------------------------- |
| SRS + đếm lượt           | Hành động học (local + hàng chờ offline)   | Lịch ôn SRS, streak, số lượt còn lại ở DB                           |
| Từ điển & nhãn CEFR/freq | Dữ liệu nguồn (CEFR-J, SUBTLEX, dict JSON) | `apps/dhcb/src/data/*.json` + `apps/dhcb/public/data/` cho lộ trình |
| Audio TTS/STT + cache    | Text / giọng nói                           | File audio mã hoá AES-256-GCM, phát lại                             |
| Thanh toán SePay         | Webhook chuyển khoản                       | Gói Pro/VIP + hạn dùng                                              |

> Một luồng một lượt. Gộp nhiều luồng vào một lượt là cách chắc chắn nhất để không luồng nào
> được rà đến nơi đến chốn.

### 5.2. Prompt dùng lại (giao nguyên văn)

```text
Rà soát triệt để các nguồn SAI LỆCH trong <luồng: từ <đầu vào> tới <đầu ra>>.

=== GIAI ĐOẠN 1: LẬP DANH SÁCH TRƯỚC KHI RÀ (bắt buộc, làm xong mới được sửa gì) ===

Không đi tìm lỗi bằng cảm hứng. Lập trước 4 danh sách, rồi rà theo danh sách:

A. KHÔNG GIAN ĐẦU VÀO: liệt kê ĐẦY ĐỦ mọi biến thể mà định dạng/nguồn dữ liệu cho
   phép (mọi kiểu entity, mọi trường header, mọi biến thể cấu trúc). Lấy từ đặc tả
   chính thức hoặc từ API của thư viện đang dùng, KHÔNG lấy từ trí nhớ.
B. CÁC TẦNG BIẾN ĐỔI: liệt kê từng bước dữ liệu bị đọc / đổi đơn vị / gộp / suy diễn
   / ghi ra.
C. MỌI HẰNG SỐ VÀ NGƯỠNG trong code liên quan: mỗi con số là một giả định được chôn
   sẵn. Ghi rõ từng cái giả định điều gì và vỡ khi nào.
D. CÁC LUỒNG SONG SONG cùng mục đích (đường nhập liệu khác, plugin, API khác) — chúng
   phải cho cùng kết quả trên cùng dữ liệu.

Lập ma trận A × B. Mỗi ô phải được tick: đã kiểm chứng thực nghiệm, kết quả đúng/sai.
Ô "đúng, không có lỗi" cũng phải ghi lại — kết quả âm tính là bằng chứng đã rà, không
phải là chỗ bỏ trống.

=== GIAI ĐOẠN 2: KIỂM CHỨNG ===

1. THỰC NGHIỆM, không suy luận: mỗi ô trong ma trận phải dựng dữ liệu thử và chạy
   thật. Không tin docstring và comment — chúng có thể mô tả sai chính code bên dưới.
2. BẤT BIẾN (quan trọng nhất — đây là thứ bắt được lỗi mà bạn CHƯA nghĩ tới):
   viết test kiểm tra các tính chất phải luôn đúng, ví dụ:
   - Bất biến hình học/đơn vị: đổi đơn vị + nhân tọa độ tương ứng → kết quả không đổi.
   - Bất biến phép biến đổi: xoay/tịnh tiến/lật toàn bộ đầu vào → đại lượng đo không đổi.
   - Bất biến tương đương: dữ liệu đóng gói (nhóm/lồng nhau) phải cho cùng kết quả
     với dữ liệu trải phẳng tương đương.
   - Bất biến cộng tính: chia đầu vào làm hai rồi cộng kết quả = xử lý một lần.
   - Bất biến lũy đẳng: chạy hai lần cho cùng kết quả.
   - Bất biến khép kín: dữ liệu do chính hệ thống ghi ra, đọc lại phải ra đúng số cũ.
3. ĐỐI CHIẾU ĐỘC LẬP: với vài mẫu, tính tay hoặc bằng một công cụ/thư viện khác, so
   với kết quả chương trình. Một cài đặt tự đối chiếu với chính nó không chứng minh
   được gì.
4. GIÁ TRỊ BIÊN: rỗng, một phần tử, độ dài 0, trùng điểm, số âm, số cực lớn/cực nhỏ,
   giá trị thiếu, dữ liệu dị dạng. Với mỗi hằng số ở danh sách C: thử ngay dưới, ngay
   trên, và đúng bằng ngưỡng.
5. ĐO ĐỘ PHỦ: chạy coverage trên phần code liên quan. Nhánh nào chưa bao giờ chạy là
   nhánh chưa ai kiểm chứng — rà từng nhánh đó.

=== GIAI ĐOẠN 3: SỬA ===

- Mỗi lỗi phải có test tái hiện: FAIL trước khi sửa, PASS sau khi sửa. Chưa thấy nó
  fail thì chưa chắc test đang kiểm tra đúng thứ cần kiểm tra.
- KHÔNG tự đổi con số dựa trên phỏng đoán. Nếu phép tự sửa có mặt trái đối xứng (sửa
  đúng thì lợi, sửa nhầm thì gây sai lệch ngược lại và âm thầm) → chỉ CẢNH BÁO, đưa
  quyền quyết định cho người dùng qua tham số tùy chọn, mặc định giữ hành vi cũ.
- Mọi thay đổi làm đổi con số phải được nêu trong chính đầu ra của chương trình.
- Sau mỗi lần sửa: chạy lại TOÀN BỘ test + lint (ghi rõ baseline để biết có phát sinh
  lỗi mới). Sửa xong phải rà lại chính phần vừa sửa — nó là dữ liệu đầu vào mới của
  các bước sau.

=== GIAI ĐOẠN 4: ĐIỀU KIỆN DỪNG (dừng theo bằng chứng, không theo cảm giác) ===

Chỉ được dừng khi ĐỒNG THỜI:
  [ ] Ma trận A × B đã tick hết, không còn ô trống.
  [ ] Mọi hằng số ở danh sách C đã có test biên.
  [ ] Bộ test bất biến ở mục 2 chạy pass.
  [ ] Các luồng song song ở D cho cùng kết quả trên cùng dữ liệu.
  [ ] HAI vòng rà liên tiếp không phát hiện thêm lỗi mới nào.
  [ ] Đã chạy thử trên dữ liệu THẬT, không chỉ dữ liệu tổng hợp.

=== BÁO CÁO ===

- Bảng nguồn sai lệch: hậu quả (thiếu/thừa/sai vị trí/sai tên) + cách xử lý.
- Danh sách đã rà và KHÔNG có lỗi (để lần sau khỏi rà lại).
- Danh sách "cân nhắc nhưng không làm" kèm lý do.
- Nếu phát hiện lỗi do chính bạn gây ra ở đợt trước: nói thẳng.
```

### 5.3. Điều chỉnh cho dự án này

- **Danh sách D là chỗ sinh lỗi nhiều nhất.** Dự án có nhiều cặp đường song song bắt buộc phải
  khớp nhau, sai là lệch số âm thầm: truy vấn HIỂN THỊ vs hàm SQL ENFORCE · `postgres/schema.sql`
  (cài mới) vs chuỗi `postgres/migrations/` (nâng cấp) · merge phía client
  (`apps/dhcb/src/lib/progressSync.ts`) vs merge phía server (`apps/server/src/api/_lib/progressMerge.ts`) ·
  `vnDateStr` bản client (`apps/dhcb/src/lib/date.ts`) vs bản server (`packages/core-db/date.ts`) ·
  hàm trộn ngẫu nhiên: Fisher–Yates ở `apps/dhcb/src/lib/cefrExam.ts` vs `sort(() => Math.random() - 0.5)`
  ở `StudyTabs.tsx`/`CefrLessonViews.tsx` (đợt 2026-08-24 phát hiện hai bên KHÔNG cho cùng phân bố).
- **Bất biến khép kín là loại rẻ nhất mà bắt được nhiều nhất ở đây** — ghi bằng hàm A, đọc lại
  bằng hàm B, phải ra đúng thứ vừa ghi. Đợt 2026-08-12 bắt được lỗi khoá SRS ngữ pháp
  (`addToSRS` hạ chữ thường khi ghi, `getDueGrammarLessonIds` không hạ khi đọc) đúng bằng cách này.
- **Dùng `npm run codemap -- impact <file>` để lập danh sách B**, đừng tự liệt kê theo trí nhớ.
- **"Dữ liệu THẬT" ở điều kiện dừng thường KHÔNG đạt được từ phiên AI**: không có quyền vào DB
  production. Khi đó phải ghi thẳng vào báo cáo là chưa đạt, KHÔNG được lặng lẽ coi dữ liệu
  nguồn trong repo là "dữ liệu thật" rồi tick ô đó.
- **Mục 1 nguyên tắc "không sửa trong lúc audit" KHÔNG áp cho mục 5 này** — prompt 5.2 có sẵn
  Giai đoạn 3 (sửa) nên đây là audit-kèm-sửa. Vẫn giữ luật: chỉ sửa cái không đổi con số của
  người dùng đang dùng; cái nào đổi con số thì báo cáo và chờ người dùng quyết.

### 5.4. Tiền lệ đã chạy

| Ngày       | Luồng                   | Kết quả                                                                                                                                                                                                                                                      |
| ---------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-12 | SRS + đếm lượt          | 2 lỗi tiềm ẩn đã sửa (khoá SRS ngữ pháp lệch hoa/thường · truy vấn hiển thị lượt Free thiếu lọc `subject`) + 3 việc để ngỏ chờ quyết. Xem `PROGRESS.md` cùng ngày.                                                                                           |
| 2026-08-24 | Trộn đáp án trắc nghiệm | Audit RỘNG bắt được (Tầng 10 ra đời từ đây): `sort(() => Math.random() - 0.5)` cho đáp án đúng rơi vào vị trí 1 hoặc 4 tới 67% thay vì 50% — đo 400.000 lượt. Ảnh hưởng chấm điểm `StudyTabs.tsx` + `CefrLessonViews.tsx`. Xem `PROGRESS.md` cùng ngày (F1). |
