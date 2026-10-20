# Audit toàn diện — 2026-10-20

> Quy trình: `docs/framework/QUY-TRINH-AUDIT.md` (audit RỘNG, mục 2, đủ các tầng 1 → 1b → 2 → 2b →
> 3 → 4 → 5 → 6 → 6b → 8b → 10 → 11 → bước bổ sung → 7). Nhánh `claude/modest-archimedes-tjsh0m`,
> HEAD = `origin/main` @ `17ce6b0f` (#1414). Nhật ký đợt việc:
> `docs/changelog/0648-2026-10-20-audit-toan-dien.md`.
>
> Đợt này **chỉ ĐỌC + BÁO CÁO** (nguyên tắc 1.2 của quy trình) — không sửa gì trong repo ngoài
> hai file tài liệu này. Mọi phát hiện mang mã `F-nnn` (mục 3b) để lượt sửa sau truy vết được.
> Môi trường: container cloud, 4 vCPU, Node 22.22, `npm ci` sạch, **không có key AI / không có
> quyền VPS** — nên Tầng 4 (eval) và Tầng 8/9 (Lighthouse production, Sentry/PM2) không chạy được
> ở đây, ghi rõ bên dưới.

## A. Báo cáo theo khuôn (mục 3 của quy trình)

```
=== BÁO CÁO AUDIT TOÀN DIỆN — 2026-10-20 ~06:30 UTC · nhánh claude/modest-archimedes-tjsh0m ===

TẦNG 1 — Cổng tự động
Build ✅ | Type ✅ (0 lỗi, 4 tsconfig) | Lint ✅ (0 cảnh báo) | Format ✅ | Test ✅ (22.465/22.465, 35 skip, 1006 file)
Size ✅ (JS 136,66/160 kB = 85,4 %, còn 23,34 kB · CSS 23,74/26 kB = 91,3 %, còn 2,26 kB — dưới 95 %, CSS sát hơn JS)

TẦNG 1b — Test không ổn định (flaky)
Số lượt chạy: 3 | Xanh: 3/3, cùng số test 22.465 pass / 35 skip | Thời gian 394 s · 383 s · 393 s | Test đỏ ngẫu nhiên: không có

TẦNG 2 — Bảo mật
Secret hardcode ✅ (0) | .env sạch ✅ (chỉ .env.example) | npm audit --omit=dev: 0 lỗ hổng | Kiểm quyền handler ✅ (104/109 gọi validateAuth; 5 công khai có chủ đích: app-settings · plan-marketing · plan-features · plan-prices (GET + cache public) · payment-webhook (verifySepayApiKey))

TẦNG 2b — Checklist OWASP mở rộng
Dòng ❌: 0 — 14/14 đạt, bằng chứng ở mục B

TẦNG 3 — Vệ sinh code
console.log rác ✅ (0) | TODO/FIXME trong mã ✅ (0) | any lọt lưới ✅ (0 mới; 1 chỗ có eslint-disable chủ đích lazyWithRetry.ts:17) | Chu trình import ✅ (0) | Code chết: apps/dhcb/src/components/Celebration.tsx (F-003) | Số migration trùng/nhảy cóc: 3 cặp trùng cũ 0026/0027/0059 (nợ quy ước đã chốt changelog 0101, test chặn số trùng MỚI) · 0 nhảy cóc · 100 file

TẦNG 4 — Chất lượng AI
CẦN CHẠY TAY — không có key trong môi trường audit. aiConfig.ts đổi NỘI DUNG 2026-10-10 (#1315, Claude làm AI chính) và 2026-10-11/12 (Companion GĐ1–GĐ3); số liệu baseline vẫn là Groq gpt-oss-120b ngày 2026-08-26 trên bộ 62 câu; bộ 180 câu CHƯA có baseline (chính file baseline ghi vậy, changelog 0553) → F-008

TẦNG 5 — Độ phủ test
Coverage gate ✅ (stmts 96,01 / branches 91,89 / funcs 96,92 / lines 96,73 — sàn 94/90/94/94, dư +2,01 / +1,89 / +2,92 / +2,73 điểm) | E2E+a11y ✅* (1467/1473 pass, 5 skip, 1 đỏ do Chromium 141 của container ≠ 156 CI ghim — cơ chế chứng minh ở mục C; CI main cùng HEAD 6/6 mảnh xanh) | Vùng thiếu test đề xuất: mục D

TẦNG 6 — Đối chiếu tài liệu & hạ tầng
Git: ahead 0 / behind 0 so với origin/main | Working tree ✅ sạch | PROGRESS khớp ❌ 1 mục tự mâu thuẫn (F-002) + 2 mục số liệu cũ (F-005) | Migration chưa áp: không xác định được từ container (deploy tự chạy migrate:pg) | Nợ kỹ thuật: 19 mục mở trong PROGRESS, 6 mục đã đối chiếu mã — 5 KHỚP, 1 LỆCH
check:docs ✅ | check:specs ✅ (191 đặc tả) | check:sql ✅ (686 câu PREPARE, 1 câu miễn có lý do) | maintain: 🔴 0 · 🟡 4 (gói lỗi thời; 4 goal ghi BLOCKED; "64 file TODO" là dương tính giả, F-006; 3 file dữ liệu > 2 MB)

TẦNG 6b — Tài liệu điều hành có nói đúng thực tế
Hook .claude/report-status.sh ✅ (0 khẳng định ghi cứng — đọc động từ PROGRESS/changelog) | Đường dẫn trong đặc tả còn sống ✅ (check:specs) | CLAUDE.md + docs/claude-md-chi-tiet.md nhắc đủ 3 app + 24 gói ✅ (nợ E4-6 của audit 2026-10-10 đã đóng)

TẦNG 8 — Hiệu năng thực đo
N/A — không đo lượt này (Lighthouse trên production cần chạy từ máy không chịu tải; container đang chạy E2E song song nên số đo sẽ sai). Vẫn là nợ #16 trong PROGRESS.

TẦNG 8b — NHÌN trang thật bằng ảnh chụp
6 trang trụ cột × 2 bề rộng (1440 / 390), mockLogin, không backend. Chiều cao (px): home 1609/1824 · companion 1197/1294 · goc-hoc-tap 900/1045 · ghi-chu 900/844 · tien-do 1024/2247 · programming 3140/4232. Câu chữ lặp: 0. Trang > 3 màn hình: programming — CÓ hàng chip nhảy mục ("Bậc học P1–P5 · Chuyên sâu · Khoá ngắn · Lộ trình mục tiêu") ✅. Mảng trống lớn ở 1440: không (trang API rỗng hiện đúng trạng thái lỗi + Thử lại). Ghi nhận nhỏ: F-009.

TẦNG 9 — Vận hành production
N/A — không có quyền truy cập VPS/Sentry từ container.

TẦNG 10 — Logic ngẫu nhiên & thống kê
Phép trộn dùng Fisher–Yates ✅ (packages/core-contracts/shuffle.ts, 15 file dùng chung; 0 chỗ sort(() => Math.random() - 0.5)) | Phân bố đo được (400.000 lượt, K = 4): 24,98 | 24,98 | 25,04 | 25,00 % so với kỳ vọng 25 % — trong ±1 điểm ✅ | Bản trộn song song: pickRandom (Fisher–Yates một phần) chép ở 2 nơi, đo 25,21 | 24,94 | 24,90 | 24,95 % — đúng nhưng là R3 (F-004) | Mã mời dùng Math.random: friends.ts · locationService.ts (F-001)

TẦNG 11 — Đường cài mới & lũy đẳng migration
schema.sql + 100/100 migration trên DB rỗng ✅ (123 bảng / 8 schema) | Lũy đẳng lần 2 ✅ ("Đã áp dụng đủ 100 migration lẻ — không có gì mới") | Boot + /api/health ✅ 200 | /api/health/deep trả 429 vì NODE_ENV=production + không có Redis → rate limit fail-closed đúng thiết kế (security.ts:444); kỳ vọng "healthy" ở bước 4 của tài liệu đã lỗi thời (F-005)

Quét scripts/tính năng: script mồ côi: 0 (24 script ngoài package.json đều có tài liệu tham chiếu hoặc được import: e2e-prewarm.mjs ← playwright.config.ts:42, lesson-animation-capture-options.ts ← shots-lesson-animations.ts) | tính năng chính còn hoạt động đúng: chỉ kiểm qua test tự động + ảnh chụp (không có backend/key để chạy tay 3 chế độ Chat/Viết/Nói)

--- ĐÃ RÀ VÀ KHÔNG CÓ LỖI ---
Xem mục B (bảng bằng chứng theo từng dòng 2b) và mục E.

--- PHÂN LOẠI VIỆC ---
AI tự làm được: F-001 · F-002 · F-003 · F-004 · F-005 · F-006 · F-007 · F-009 · D-1…D-n (test bổ sung)
Cần người dùng thao tác tay: F-008 (eval:tutor với key thật, ghi baseline mới) · quyết định có xoá Celebration.tsx (F-003) · Tầng 8/9 cần chạy từ máy có quyền VPS

Rủi ro/ảnh hưởng: không có phát hiện mức Cao. 1 mức Trung (F-001, mã mời đoán được về lý thuyết, đã có rate limit IP). Còn lại Thấp.
Góp ý cải tiến: xem mục F.
KẾT LUẬN: Sẵn sàng — mọi cổng chặn (Tầng 1–2) xanh; các phát hiện đều là nợ nhỏ, chia đợt ở mục F.
```

## B. Tầng 2b — bằng chứng từng dòng (đọc mã thật, không đoán)

| #   | Nhóm               | Kết quả | Bằng chứng                                                                                                                                                                                                                                                                    |
| --- | ------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | SQLi               | ✅      | Duy nhất 1 template literal có `${}`: `packages/core-personal/personErasureService.ts:577` — `safeTable` đi qua `assertIdent(table, QUALIFIED_IDENT)` từ hằng `PERSON_TABLES`, `column` là union literal `'person_id' \| 'id'`, giá trị người dùng đi `$1`                    |
| 2   | Command/Path       | ✅      | `packages/core-ai/espeakPhonemes.ts:86` `execFile` với mảng tham số cố định, văn bản đưa qua `stdin`, timeout 5 s; `apps/server/src/server.ts:264` `path.join(distDirForHost(req.hostname), 'index.html')` — hostname chỉ chọn giữa 2 thư mục dist cố định (`resolveDistDir`) |
| 3   | XSS                | ✅      | 0 `dangerouslySetInnerHTML` ở `apps/dhcb/src` + `apps/hub/src` (1 khớp là chú thích khẳng định KHÔNG dùng, `ChatProse.tsx:15`)                                                                                                                                                |
| 4   | CSRF               | ✅      | Bearer qua header + `isTrustedMutation` kiểm `Origin`/`Sec-Fetch-Site` cho mọi mutation (`packages/core-auth/security.ts:55-65`); WebSocket có cổng Origin riêng (`:72`)                                                                                                      |
| 5   | Brute force        | ✅      | `packages/core-auth/auth.ts:375` message gộp "Email hoặc mật khẩu không đúng"; rate limit 429 chung                                                                                                                                                                           |
| 6   | Log token          | ✅      | 0 — 9 khớp grep đều nằm TRONG chuỗi nội dung bài học Lập trình (`packages/subject-programming/lessons/p6u225.ts`, `p6u63.ts`), không phải log thật                                                                                                                            |
| 7   | IDOR               | ✅      | 104/109 handler gọi `validateAuth`; 5 handler không gọi đều GET công khai có chú thích hoặc webhook xác minh khoá (mục A, Tầng 2)                                                                                                                                             |
| 8   | Upload STT         | ✅      | `apps/server/src/routes.ts:247` `express.json({ limit: '10mb' })` riêng `/api/stt`; mặc định toàn app `64kb` (`:258`)                                                                                                                                                         |
| 9   | Security headers   | ✅      | `apps/server/src/routes.ts:171-175` CSP (có `frame-ancestors 'self'`) + HSTS + `X-Frame-Options` + `Permissions-Policy` + nosniff cho MỌI response; thêm CSP chặt Report-Only (`server.ts:203`)                                                                               |
| 10  | CORS               | ✅      | `security.ts:82` chỉ trả `*` khi `allowedOrigins() === null`, tức **dev** (`:35` production luôn có danh sách mặc định); `Allow-Credentials` chỉ khi origin tin cậy (`:87`)                                                                                                   |
| 11  | Rate limiting      | ✅      | `checkRateLimit` theo IP, Redis Lua nguyên khối; Redis rớt ở production → **từ chối** (`security.ts:444`, fail-closed) — đã thấy thật ở Tầng 11                                                                                                                               |
| 12  | Webhook idempotent | ✅      | `apps/server/src/api/billing/payment-webhook.ts:119` chặn `status === 'paid'`; `:228` nuốt `23505` (txn trùng) thành OK                                                                                                                                                       |
| 13  | Lộ stack trace     | ✅      | 0 `.stack` ngoài test ở `apps/server/src` + `packages`                                                                                                                                                                                                                        |
| 14  | Secret ở client    | ✅      | 0 `process.env.*` ngoài `VITE_` ở `apps/dhcb/src` + `apps/hub/src`                                                                                                                                                                                                            |

## C. Tầng 5c — E2E + a11y

`npm run test:e2e` (2 worker, 51,2 phút): **1467 passed · 5 skipped · 1 failed** / 1473.
Ca đỏ: `e2e/lesson-animation-reduced-motion.spec.ts:118` "bật reduced motion giữa lượt" — `expect(getAnimations().length).toBe(0)` nhận 3.

Phân loại theo Tầng 1b (không kết luận "flake" khi chưa có cơ chế):

- Chạy riêng file 5 lượt (`--repeat-each=5`): ca này **đỏ 5/5**, ca còn lại trong file xanh 5/5 → không
  phải flaky theo tải, mà **lệch theo trình duyệt**.
- Container dùng Chromium cài sẵn `/opt/pw-browsers/chromium` → `chromium-1194` = **Chromium
  141.0.7390.37** (`playwright.config.ts:20-24` ưu tiên đường dẫn này). Playwright 1.64.0 trong
  lockfile ghim `chromium-1248` = **Chromium 156.0.8078.4**, và CI dùng bản ghim đó (cache trúng).
  CI `main` @ `17ce6b0f` (run 39136824362): 6/6 mảnh E2E xanh, kể cả ca này.
- Thí nghiệm tối giản trên Chromium 141 (3 phần tử, `@media (prefers-reduced-motion: reduce) {
animation: none !important }`, rồi `emulateMedia({ reducedMotion: 'reduce' })`): KHÔNG pause →
  `getAnimations()` 3 → **0**; `pause()` + `currentTime = 1500` qua WAAPI trước khi đổi media →
  3 → **3**. Tức Chromium 141 giữ `CSSAnimation` đã bị WAAPI pause dù `animation: none`; test này
  pause chính bằng cách đó (`:124-129`), còn Chromium 156 huỷ đúng.

**Kết luận:** lỗi của MÔI TRƯỜNG audit (trình duyệt cũ hơn bản ghim), không phải lỗi mã/test trên
CI. Ghi F-010 để người sau biết; không sửa test, không skip.

## D. Tầng 5b — vùng thiếu test (định tính)

Tác tử chỉ-đọc rà `coverage/coverage-summary.json` + báo cáo HTML (lọc `apps/dhcb/src/lib/`,
`apps/server/src/`, `packages/`, bỏ test, `branches.total ≥ 10`). Tôi đã mở mã đối chiếu các dòng
được nêu ở D-1, D-3, D-6 — khớp.

**15 file logic có branches thấp nhất:** `ambient-vision.ts` · `ts-check.ts` ·
`useVisualViewportHeight.ts` · `neuro-affective.ts` · `subconscious.ts` · `a2a.ts` · `intake.ts`
(7 file 0 % — handler/hook nhỏ, không có test riêng) · `buildIntentOutlines.ts` 30 % ·
`redisChat.ts` 40,9 % · `admin-intake-stats.ts` 41,7 % · `a2aNegotiationService.ts` 50 % ·
`neuroAffectiveService.ts` 57,9 % · `useTodayPlan.ts` 60,7 % · `accountErasureLedger.ts` 63,6 % ·
`integrations.ts` 65 %. Vùng nhạy cảm phủ tốt: `core-billing/usage.ts` 100 % nhánh ·
`payment-webhook.ts` 89,6 % · `core-auth/auth.ts` 87 %.

**Đề xuất bổ sung test (KHÔNG viết trong lượt audit):**

| ID  | Mức   | File:dòng                                                    | Nhánh chưa phủ · loại checklist                                                                                                                                     |
| --- | ----- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1 | Cao   | `packages/core-auth/actorUsage.ts:52`                        | `refundActorUsage` với `day === ''` → `day \|\| undefined` (hoàn lượt vào ngày nào?) · null vs rỗng, ranh giới ngày UTC                                             |
| D-2 | Cao   | `packages/core-auth/actorUsage.ts:55`                        | Nhánh actor là KHÁCH → `refundGuestTrial` chưa chạy lần nào · nhánh lỗi AI hoàn lượt khách                                                                          |
| D-3 | Cao   | `packages/core-billing/prices.ts:71-73`                      | `catch` khi `pool.query` lỗi → trả `DEFAULT_PRICES` (fail-open có chủ đích) · nhánh lỗi DB — cần test khẳng định giá mặc định đúng và có `warn`                     |
| D-4 | Cao   | `packages/core-billing/prices.ts:47, 61`                     | Cache còn hạn (TTL 30 s) chưa chạy; vòng đọc dòng DB gồm lọc gói cũ `plan !== 'vip'` và `sale_until` null/có giá trị · ca biên, thời gian UTC                       |
| D-5 | Cao   | `apps/server/src/api/billing/payment-webhook.ts:76, 244-249` | Body hỏng (trả 200 để SePay không gửi lại); payload không phải object/mảng; `id` không phải number/string → `txnId = null` · ca biên, idempotency webhook           |
| D-6 | Cao   | `packages/core-personal/accountErasureLedger.ts:60-65`       | `readErasedAccountFacts` khi `rows[0]` không tồn tại / cột null (`?? []`, `?? 0`) · null vs 0 — sổ này giữ "đã nhận lượt thử/thưởng mời" sống sót sau xoá tài khoản |
| D-7 | Trung | `packages/core-personal/companionTools.ts:405-406, 466, 479` | `proposeAction` trả `committed` (chính sách tự động của người dùng); bộ lọc `unsafe()` chặn trong `propose_learning_goal`/`propose_profile_fact` · consent          |
| D-8 | Trung | `apps/dhcb/src/lib/syncOutbox.ts:205, 271-290`               | `setActiveUid` (null / khách), `onVisible`, `onStorage` (khoá ngoài tiền tố, `pending > 0` thì flush), debounce · async race nhiều tab, idempotency                 |

Ngoài ngưỡng lọc: `packages/core-billing/founder.ts:77-78` (`catch` khi cấp ưu đãi Người tiên phong
lỗi) chưa phủ — 9 nhánh nên không vào bảng, nhưng chạm tiền, nên ghi kèm.

## E. Tầng 6 — PROGRESS.md đối chiếu mã (6 khẳng định, tác tử chỉ-đọc)

| #   | Khẳng định trong PROGRESS                                | Kết luận                | Bằng chứng                                                                                                                                                                                                                                                                 |
| --- | -------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a   | Xuất/xoá dữ liệu cá nhân `/api/persons` ĐÃ SỬA (21 bảng) | KHỚP, số cũ             | `apps/server/src/api/personal/persons.ts:77` validateAuth, `:116` export, `:125` full_erase + `requireReauth`; `PERSON_TABLES` nay **26** bảng, test tích hợp so với `information_schema` → số "21" ở PROGRESS.md:1347 chỉ đúng thời điểm 0527                             |
| b   | Mã hoá dữ liệu người dùng ĐÃ BẬT cho dữ liệu MỚI         | **LỆCH** (tự mâu thuẫn) | Tiêu đề PROGRESS.md:2016 "ĐÃ BẬT" nhưng thân :2024-2025 vẫn ghi "CHƯA nối vào bất kỳ dữ liệu nào — module hiện đang NGỦ". Mã thật: `packages/core-auth/twoFactor.ts:132` và `packages/core-personal/intakeService.ts:44` ĐÃ gọi `userDataCrypto`; không có script backfill |
| c   | WCAG A/AA ĐÃ ĐÓNG, 15 trang × 3 theme                    | KHỚP, số cũ             | `e2e/a11y.spec.ts:94` 42 route + login + home × 3 theme; `a11y-aaa.spec.ts:39` ~39 route; chú thích `a11y.spec.ts:21` còn ghi "15 trang × 5 theme"                                                                                                                         |
| d   | Gemini Live WebSocket thật, chưa test key thật           | KHỚP                    | `packages/core-ai/geminiLiveService.ts:17,28,36` dùng `ws` thật; mock chỉ qua `_setWebSocketFactoryForTests`; chưa có client ở `apps/dhcb/src`                                                                                                                             |
| e   | Đúng hai gói free/vip, 0076 xoá plus/pro                 | KHỚP                    | `packages/core-billing/plan.ts:6`; `postgres/migrations/0076_remove_pro_plus_plans.sql`                                                                                                                                                                                    |
| f   | Red-team Companion V2 đã kiểm thật, 54 ca, chặn CI       | KHỚP                    | `scripts/red-team/eval-red-team.ts`; `.github/workflows/ci.yml:252-254`; đếm ca PI 14 · TA 13 · SL 12 · AG 15 = 54                                                                                                                                                         |

## F. Phát hiện (F-) và đề xuất chia đợt — chờ chủ dự án duyệt

| ID    | Mức   | Vị trí                                                                                                                                                        | Phát hiện                                                                                                                                                                                                                                                                                   | Rủi ro nếu để nguyên                                                                                                       | Đề xuất                                                                                                                                            |
| ----- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-001 | Trung | `packages/core-chat/friends.ts:12-18` · `packages/core-location/locationService.ts:19-25`                                                                     | Mã mời bạn bè (8 ký tự, nhúng URL công khai) và mã mời phiên chia sẻ VỊ TRÍ (6 ký tự) sinh bằng `Math.random` (xorshift128+, suy được trạng thái). Trái quy ước đã chốt ở `referral.ts:25`, `emailVerification.ts:31`, `companionLinkService.ts:48`, `sepay.ts:37` (đều `crypto.randomInt`) | Về lý thuyết đoán được mã mời của người khác (vị trí là dữ liệu nhạy cảm). Có rate limit IP 30/phút nên khó khai thác thật | Đổi sang `randomInt` của `node:crypto` (2 hàm, ~6 dòng), thêm test "không gian mã" như referral. `fix(security)`, không migration                  |
| F-002 | Thấp  | `PROGRESS.md:2016` vs `:2024-2025`                                                                                                                            | Mục nợ mã hoá tự mâu thuẫn: tiêu đề "ĐÃ BẬT cho dữ liệu MỚI" nhưng thân "module đang NGỦ, không chỗ nào gọi"                                                                                                                                                                                | Tài liệu điều hành sai → phiên sau khởi động với tiền đề sai (đúng cảnh báo Tầng 6b)                                       | Viết lại thân mục: đã nối ở `twoFactor.ts:132` + `intakeService.ts:44`; còn nợ tên/email/tiến độ cũ + nơi cất khoá gốc. `docs`                     |
| F-003 | Thấp  | `apps/dhcb/src/components/Celebration.tsx` · `apps/dhcb/src/lib/confetti.ts:2`                                                                                | File mồ côi THẬT (0 import; chỉ được nhắc trong chú thích của `WeeklyGoalCelebration.tsx:5`); chú thích `confetti.ts:2` nói "chỉ nạp qua Celebration.tsx" trong khi `SessionDone.tsx:75` nạp trực tiếp                                                                                      | Code chết + chú thích lỗi thời                                                                                             | Xoá `Celebration.tsx` (cần người dùng xác nhận), sửa chú thích. `chore`                                                                            |
| F-004 | Thấp  | `apps/dhcb/src/lib/dictionaryApi.ts:135` · `apps/server/src/api/subjects/english/dictionary.ts:110`                                                           | `pickRandom`/`fetchRandomEntries` (Fisher–Yates một phần) chép 2 nơi — cờ đỏ R3 Tầng 10 (đo phân bố vẫn đều)                                                                                                                                                                                | Hai bản song song dễ lệch nhau khi sửa một bên                                                                             | Thêm `sample(arr, n, rng)` vào `packages/core-contracts/shuffle.ts`, hai nơi gọi chung. `refactor`                                                 |
| F-005 | Thấp  | `PROGRESS.md:1347` ("21 bảng") · `e2e/a11y.spec.ts:21`, `e2e/a11y-aaa.spec.ts:30` ("15 trang × 5 theme") · `docs/framework/QUY-TRINH-AUDIT.md` Tầng 11 bước 4 | Số liệu/kỳ vọng cũ: 26 bảng, 42/39 route × 3 theme, `/api/health/deep` nay trả 429 khi không Redis ở production (fail-closed, đúng)                                                                                                                                                         | Người đọc tin số cũ                                                                                                        | Sửa 4 chỗ chữ. `docs`                                                                                                                              |
| F-006 | Thấp  | `scripts/maintenance-sweep.sh` (đếm TODO)                                                                                                                     | Báo 🟡 "64 file TODO (ngưỡng 30)" nhưng 57/64 là NỘI DUNG BÀI HỌC `packages/subject-programming/lessons/` (TODO là đề bài cho học viên), mã nguồn thật = 0                                                                                                                                  | Báo động giả lặp mỗi lượt maintain, làm mờ tín hiệu thật                                                                   | Loại `**/lessons/**` + `specializations/**` khỏi phép đếm. `chore(scripts)`                                                                        |
| F-007 | Thấp  | `.size-limit.json` (CSS 23,74/26 kB = 91,3 %)                                                                                                                 | Biên CSS còn 2,26 kB — chưa chạm 95 % nhưng là ngân sách sát nhất; JS còn 23,34 kB                                                                                                                                                                                                          | Một tính năng UI nhỏ nữa có thể làm CI đỏ bất ngờ                                                                          | Ghi nhận; khi chạm 95 % thì đo CSS không dùng (coverage DevTools) trước khi nới ngưỡng (đụng cổng, cần người dùng đồng ý)                          |
| F-008 | —     | `docs/research/eval-tutor-baseline.md`                                                                                                                        | Baseline eval gia sư Anh vẫn là Groq 2026-08-26 / 62 câu; model chính đã đổi sang Claude 2026-10-10 (#1315); bộ 180 câu chưa có baseline                                                                                                                                                    | Luật "không tụt so với baseline" (CLAUDE.md §8) hiện không có mốc để so                                                    | **Người dùng** chạy `npm run eval:tutor -- --runs 3 --write-baseline` với key thật rồi commit (≈ 540 lời gọi/chế độ, đã ghi ở chính file baseline) |
| F-009 | Thấp  | Trang `/goc-hoc-tap` (ảnh 1440 + 390)                                                                                                                         | Màn hình đầu có HAI lối vào cùng đích "phòng thí nghiệm mô phỏng": chip "10 phòng thí nghiệm mô phỏng" trong hero và banner "MỚI · 10 thí nghiệm tương tác" ngay dưới ô tìm kiếm                                                                                                            | Không phải lỗi, nhưng là dạng "cùng một câu nói hai lần" mà Tầng 8b nhắm tới                                               | Chủ dự án quyết: giữ (banner là quảng bá có thời hạn) hay bỏ chip. `style(ui)`; nếu sửa phải chụp lại trước/sau                                    |

| F-010 | Thấp | `e2e/lesson-animation-reduced-motion.spec.ts:118-135` · `playwright.config.ts:20` | Ca test phụ thuộc hành vi Chromium khi `CSSAnimation` đã bị WAAPI `pause()` rồi media đổi sang `reduce`: Chromium 156 (bản Playwright ghim, CI) huỷ, Chromium 141 (container audit cài sẵn) giữ → đỏ 5/5 ở container, xanh trên CI | Máy dev/container có Chromium cũ hơn bản ghim sẽ thấy E2E đỏ "giả", mất thời gian chẩn đoán | Không sửa test. Ghi vào `TRAPS.md` (bẫy "Chromium cài sẵn ≠ bản Playwright ghim") hoặc cho `playwright.config.ts` in cảnh báo khi `browser.version()` khác `browsers.json`. `docs`/`chore(e2e)` |

**Đã rà và KHÔNG có lỗi (ghi lại để lần sau khỏi rà lại):** 14/14 dòng 2b (mục B) · 0 chu trình import ·
0 `console.log`/TODO/`any` mới trong mã · 0 script mồ côi · hook đầu phiên không ghi cứng · mọi gói/app
được nhắc trong CLAUDE.md · đường cài mới 100/100 migration + lũy đẳng · phép trộn chung Fisher–Yates
đo đều · 3 lượt unit test cùng số · `check:docs`/`check:specs`/`check:sql` xanh · auto-merge/CI không
đụng tới (audit chỉ đọc).

**Dòng "net" Tầng 3:** net: −~60 dòng (Celebration.tsx) − ~10 dòng (gộp pickRandom), −0 dependency.

**Hội tụ (mục 3b):** 0 phát hiện mức Cao → đạt tiêu chí (1). Các F- còn lại chờ quyết định ghi vào
`PROGRESS.md` ("sửa đợt sau" hoặc "chấp nhận rủi ro") ở lượt sửa kế tiếp — tiêu chí (2) chưa đóng cho
tới khi chủ dự án chốt.

## G. Truy vết F- → W- (cập nhật theo từng PR sửa)

| W-    | Đóng F-                                                              | PR / changelog             | Trạng thái |
| ----- | -------------------------------------------------------------------- | -------------------------- | ---------- |
| W-001 | F-001                                                                | `docs/changelog/0649-*.md` | ĐÃ LÀM     |
| W-002 | D-1…D-8 (+ `founder.ts` catch)                                       | `docs/changelog/0650-*.md` | ĐÃ LÀM     |
| W-003 | F-002 · F-003 · F-004 · F-005 · F-006 · F-010                        | —                          | chờ        |
| W-004 | F-009                                                                | —                          | chờ        |
| —     | F-007 (ghi nhận, không sửa) · F-008 (việc tay chủ dự án, cần key AI) | —                          | mở         |
