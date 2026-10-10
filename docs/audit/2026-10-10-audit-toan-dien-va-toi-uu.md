# Audit toàn diện + tối ưu mã nguồn — 2026-10-10

> Quy trình: `docs/framework/QUY-TRINH-AUDIT.md` (audit RỘNG, mục 1–4). Nhánh
> `claude/inspiring-archimedes-9duwjj`, gốc `main` @ `017e6d8` (#1329). Nhật ký đợt việc:
> `docs/changelog/0580-2026-10-10-audit-toan-dien-toi-uu-bundle.md`.
>
> Người dùng yêu cầu "audit toàn diện rồi tối ưu mã nguồn" — nên khác nguyên tắc 1.2 (audit chỉ
> đọc), đợt này **sửa luôn** phần tối ưu rủi ro thấp đã đo được (mục C). Mọi phát hiện còn lại
> chỉ ghi lại và chia đợt ở mục E, chờ chủ dự án duyệt — nhiều mục chạm bảo mật, thanh toán
> hoặc dữ liệu người dùng thật (CLAUDE.md mục 12).

## A. Báo cáo theo khuôn (mục 3 của quy trình)

```
=== BÁO CÁO AUDIT TOÀN DIỆN — 2026-10-10 · nhánh claude/inspiring-archimedes-9duwjj ===

TẦNG 1 — Cổng tự động (đo TRƯỚC khi sửa, trên main @017e6d8)
Build ✅ | Type ✅ (0 lỗi) | Lint ✅ (0 cảnh báo) | Format ✅ | Test ✅ (20474/20507, 33 skip)
Size ⚠️ JS 149,29/160 kB = 93,3% · CSS 24,57/26 kB = 94,5%  ← cả hai sát ngưỡng cảnh báo 95%
  Sau đợt này: JS 134,39/160 kB = 84,0% · CSS không đổi. JS khởi động THẬT (entry + mọi
  modulepreload, size-limit không đếm hết): 154,3 → 138,4 kB (−15,9 kB). Xem mục C, D.

TẦNG 1b — Test không ổn định
Số lượt chạy toàn bộ: 2 (test:coverage trước + sau khi sửa) | Xanh: 2/2, cùng số test (20474).
Chưa đủ 3 lượt theo quy trình — lượt thứ 3 là CI của PR này.

TẦNG 2 — Bảo mật
Secret hardcode ✅ 0 | .env sạch ✅ (chỉ .env.example) | npm audit --omit=dev ✅ 0
npm audit (cả dev) ❌→✅ 2 high (brace-expansion <1.1.21, source-map-js <1.2.2, đều gián tiếp) — đã vá
Kiểm quyền handler ✅ (agent database-reviewer: mọi `where id = $1` ngoài admin dùng auth.userId)

TẦNG 2b — Checklist OWASP mở rộng
#1 SQLi ✅ (1 câu nội suy `${safeTable}` ở personErasureService.ts:515 qua assertIdent + danh sách hằng)
#2 Command ✅ (chỉ execFile, không shell) | #3 XSS ✅ (0 dangerouslySetInnerHTML)
#12 Business logic ❌ → E2.1 (learn-day ghi đè điểm giải đấu) · E2.6 (PvP đua cộng Elo hai lần)
#13 Lộ thông tin lỗi ❌ → E1.8 (4 handler STT/phát âm trả nguyên err.message cho client)

TẦNG 3 — Vệ sinh code
console.log rác ✅ (chỉ log khởi động chủ đích + nội dung bài học) | TODO/FIXME ✅ 0
any lọt lưới ✅ (1 chỗ có eslint-disable có lý do: lazyWithRetry.ts) | Chu trình import ✅ 0
Code chết: 0 file mồ côi thật (909 file "orphan" đều là test/script/route); export chết → E4.5
Số migration trùng: 0026/0027/0059 — ĐÃ BIẾT, có ghi ở postgres/migrations/README.md, vô hại
(runner theo tên file, không chạm cùng bảng). Không nhảy cóc.

TẦNG 4 — Chất lượng AI
N/A — đợt này không đổi prompt/model.

TẦNG 5 — Độ phủ test
Coverage gate ✅ 95,98/91,88/96,72/96,64 (sàn 94/90/94/94; biên 1,98/1,88/2,72/2,64)
E2E+a11y: không chạy ở máy (CI chạy trên PR). Vùng thiếu test → mục E.

TẦNG 6 — Đối chiếu tài liệu & hạ tầng
Git: ahead 0 / behind 0 so với origin/main lúc bắt đầu | Working tree ✅
check-progress-freshness ✅ | check:specs ✅ (170 đặc tả) | check:docs ✅
Nợ: 8 gói chưa được nhắc trong CLAUDE.md/claude-md-chi-tiet.md → E4.6

TẦNG 6b — Tài liệu điều hành
Hook report-status ✅ (đọc thẳng PROGRESS.md) | Đường dẫn đặc tả ✅ | CLAUDE.md nhắc đủ app ✅,
gói ❌ (core-chat, core-config, core-contracts, core-errors, core-examplan, core-integrations,
core-learner, core-location)

TẦNG 8 — Hiệu năng thực đo: N/A (không chạy cwv:prod lượt này — cần mạng tới production)
TẦNG 9 — Vận hành production: N/A (không có quyền VPS)

TẦNG 10 — Logic ngẫu nhiên
Phép trộn dùng Fisher–Yates ✅ (0 `sort(() => Math.random() - 0.5)` ngoài chú thích/test)
Bản trộn song song: parsonsShuffle tự viết lại vòng Fisher–Yates, mulberry32 chép 2 nơi → E4.2

TẦNG 11 — Đường cài mới & lũy đẳng migration
schema.sql + 93/93 migration trên DB rỗng ✅ (Postgres 16, 118 bảng / 8 schema) | Lũy đẳng lần 2 ✅
Boot dist-server + /api/health 200 ✅ | /api/health/deep 429 (production không Redis ⇒ rate limit
fail-closed — đúng thiết kế)

Quét scripts/tính năng: script mồ côi 0 (scripts/red-team/eval-red-team.ts có trong package.json)
```

## B. Ba lượt rà sâu bằng tác tử (chỉ đọc)

- `silent-failure-hunter` — `apps/server/src` + `packages/core-*`: 16 phát hiện, đối chiếu với
  đợt săn trước (`docs/changelog/0523-*.md`) để không báo lại.
- `database-reviewer` — mọi SQL ở `apps/server/src/api/**` + `packages/**`: 14 phát hiện.
- Rà frontend (bundle, DRY, React, export chết): 18 phát hiện.

Các phát hiện mức CAO đã được **xác minh lại bằng tay** với mã nguồn trước khi ghi vào đây
(`pgPool.ts` thiếu timeout, `history.ts` không LIMIT, `learn-day` ghi đè, cầu dao AI không xoá
cache, Companion nuốt lỗi nhà cung cấp, `Placement.tsx` import thẳng dữ liệu CEFR).

## C. Đã tối ưu trong đợt này (đo thật, trước → sau)

| #   | Việc                                                                                                                                                                                                                                                                                                                                                                                                                                  | Số đo                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| C1  | **Đưa zod bản đầy đủ ra khỏi đường khởi động.** `vendor-misc` (tải ngay khi mở trang) 100% là zod, gồm cả bộ chuyển JSON Schema không dùng ở client. Sáu đường kéo nó vào: `clientAuth.ts`, `core-contracts/appSettings.ts`, `cloud.ts` → `zod/mini`; `App.tsx` (dọn nháp) và `AuthProvider` (gộp tiến độ khách) → import động; `GuestBanner` → module khoá nhẹ. `manualChunks` tách `vendor-zod`. Test canh `startupBundle.test.ts`. | JS khởi động thật **154,3 → 138,4 kB** brotli; size-limit 149,29 → 134,39 kB |
| C2  | **`Placement.tsx` dùng `loadCefr()`** thay vì import thẳng `data/cefr` — trang xếp lớp không còn mang 4,4 MB JSON từ vựng. Đã kiểm `public/data/cefr.json` trùng khớp `CEFR_LEVELS` (so `JSON.stringify`).                                                                                                                                                                                                                            | Chunk trang xếp lớp **2.953.340 → 11.352 B** thô                             |
| C3  | `npm audit fix` (chỉ lockfile, patch gián tiếp ở dependency dev).                                                                                                                                                                                                                                                                                                                                                                     | 2 high → 0                                                                   |

Đã cân nhắc và **bỏ**:

- `react-router` đang đóng gói thư mục `dist/development` — nhưng bản `production` lệch đúng
  1 byte (375.607 vs 375.608), không có lợi.
- Bỏ khối `@supports (color: color-mix(...))` Tailwind 4 sinh ra (82 kB thô = 30% CSS): sau
  brotli chỉ được ~0,7 kB, phải viết hậu xử lý CSS riêng — không đáng rủi ro.
- Chuyển cả `core-contracts` sang `zod/mini`: `.optional()` được gọi 41 lần trên các schema dùng
  chung với server → thay đổi ~40 file, rủi ro cao hơn hẳn lợi ích còn lại.

## D. Bằng chứng cổng sau khi sửa

Bảng số đo đầy đủ ở changelog `0580` (cổng chạy trên checkout sạch, đã xoá
`dist`/`packages/*/dist`): typecheck/lint/format/build/size ✅, test:coverage 20474 test ✅
96,03/91,92/96,75/96,69, smoke Chromium 1440px + 390px trên bản build ✅.

**Bài học đo lường (ghi lại để lần sau khỏi mắc):** lần đầu `size-limit` báo giảm 15 kB nhưng
trình duyệt vẫn tải `vendor-zod` qua `modulepreload` — vì `.size-limit.json` không đếm chunk đó.
Chỉ lộ ra khi mở bản build bằng Chromium và đọc `<link rel="modulepreload">` của `index.html`.
Từ nay đo JS khởi động bằng cách cộng MỌI file `index.html` tải ngay (xem E5).

**Mặt trái:** trang chủ vẫn dùng hợp đồng zod đầy đủ nên `vendor-zod` vẫn tải song song chunk
`Home` khi vào `/` (tổng zod trên `/` +2,6 kB so với trước). Cách bỏ hẳn: E4.1b.

## E. Phát hiện CHƯA sửa — đề xuất chia đợt (chờ duyệt)

Mỗi đợt một PR nhỏ. Thứ tự đề xuất theo giá trị/rủi ro.

### E1 — Server: lỗi im lặng & độ bền (`fix(server)`, không cần migration)

> **✅ ĐÃ LÀM mục 1–8 ở `docs/changelog/0581-2026-10-10-e1-loi-im-lang-server.md`** (2026-10-10).
> Mục 9 (mức thấp) còn mở. Ngưỡng timeout pool đã chọn: 10s kết nối / 60s câu lệnh / 60s ngồi im
> giữa transaction, chỉnh được qua `.env`.

1. **CAO** `packages/core-personal/companionRuntime.ts:472,501,507` — Companion nuốt lỗi cả 3
   nhà cung cấp AI, rơi về câu trả lời mẫu với HTTP 200, không log, **vẫn trừ lượt**. Trái với
   chính chú thích ở `chatFallback.ts:10-11`. Sửa: log mỗi nhánh; rơi về mẫu thì `isFallback` +
   hoàn lượt (hoặc 503).
2. **CAO** `packages/core-db/pgPool.ts:19` — `new Pool({ connectionString, max })` không có
   `connectionTimeoutMillis`/`statement_timeout`/`idle_in_transaction_session_timeout`; pool chỉ 5
   kết nối/tiến trình → một câu chậm có thể treo mọi request vô hạn. ⚠️ Cần chọn ngưỡng cùng chủ
   dự án (job nền có câu dài).
3. `packages/core-ai/chatFallback.ts:52,62,85` — nhánh Anthropic/Groq/Gemini lỗi không log.
4. Sáu handler bắt lỗi trả 500/503 không log/Sentry (`scenario-holodeck`, `socratic-diagnostics`,
   `workplace-insights`, `neuro-affective`, `subconscious`, `a2a`, kèm `neural-curriculum:130`,
   `cefr-assessment:33`) → dùng `internalErrorResponse` có sẵn ở `core-http/http.ts`.
5. `packages/core-auth/security.ts:584-588` — `validateAuth` `catch { return null }`: CSDL sập ⇒
   mọi API trả 401 thay vì 503, phiên hợp lệ bị báo hết hạn.
6. `apps/server/src/api/admin/admin-system-control.ts:61-83` — bật cầu dao khẩn cấp không gọi
   `invalidateSettingsCache()` ⇒ AI còn chạy tới 30 giây/tiến trình sau khi admin tin là đã dập.
7. `apps/server/src/api/admin/admin-settings.ts:66,81,95` — `getAppSettings()` thiếu
   `requireAvailable`: DB lỗi thì POST ghi đè cầu dao đang BẬT thành TẮT.
8. `push.ts:274-282` + `chatPush.ts:117-126` — lỗi web push ngoài 404/410 biến mất (VAPID sai ⇒
   "gửi 0" không lý do). `stt.ts:125`, `pronounce-assess.ts:119`, `pronunciation.ts:238,259` —
   không log và trả nguyên `err.message` nội bộ cho client.
9. Mức thấp: `automationService.ts:495-534` (biên nhận bù trừ ghi `reverted: true` sai sự thật),
   `guestTrial.ts:58`, `progress.ts:166`, `usage-summary.ts:77`, `emailReminders.ts:~190`,
   `hub-stats.ts:85`, `intakeService.ts:115`, `authService.ts:176,343`.

### E2 — Nghiệp vụ & SQL (cần quyết định của chủ dự án)

1. **CAO — gian lận giải đấu.** `apps/server/src/api/core/history.ts:213-218` (`learn-day`):
   `learn_count = excluded.learn_count` ghi đè bằng số client gửi (≤ 10.000) cho ngày tuỳ ý; điểm
   giải đấu = `learn_count` ⇒ một request là vượt mọi người học thật. Đề xuất: `greatest(...)`,
   kẹp trần thực tế, chỉ nhận hôm nay/hôm qua giờ VN. **Cần chốt trần.**
2. **CAO** `history.ts:111-125` — `GET /api/history` đọc KHÔNG LIMIT cả 3 bảng phiên kèm cột
   `messages` jsonb ⇒ phản hồi phình theo năm dùng. Đề xuất phân trang; đổi hợp đồng API.
3. `apps/server/src/api/subjects/english/mistakes.ts:166-211` — N+1 tới 500 upsert tuần tự,
   ngoài transaction → một câu `unnest` trong `withTransaction`.
4. TTS cache HIT vẫn ghi DB mỗi lượt (`tts.ts:307,338`, `pronunciation.ts:191`, `ttsStats.ts:30`)
   → chỉ cập nhật `last_accessed_at` khi cũ hơn 1 ngày; gom thống kê theo lô.
5. `pvp-arena.ts:225-245` — `submit_round` đọc-rồi-ghi hai bước: hai request song song ở vòng
   cuối cộng Elo hai lần; `roundIndex` không bị ép theo `currentRound`.
6. `chatService.ts:24-47` — `createOrGetDmRoom` kiểm-rồi-chèn không ràng buộc ⇒ phòng DM trùng.
7. `changeEmail.ts:50` — băm mật khẩu trong transaction đang giữ khoá hàng.

### E3 — Migration chỉ mục + dọn dữ liệu (một migration `0091`, cần duyệt)

`daily_usage(day)` · chỉ mục bảng xếp hạng PvP theo `eloRating` · `chat.messages(sender_id)` ·
`analytics_events(user_id)` + `(created_at)` · `sessions(expires)` ·
`push_subscriptions(endpoint)`. Kèm job dọn `sessions`/`password_resets`/`email_verifications`
hết hạn. **Thời hạn giữ `analytics_events` (đề xuất 180 ngày) là xoá dữ liệu — chủ dự án quyết.**
Bảng lớn nên dùng `create index concurrently` — phải kiểm runner có bọc transaction không.

### E4 — Frontend: bundle tiếp, DRY, bug nhỏ

1. Bundle: `main.tsx:10` import cả `lib/tts.ts` (+`voiceTiers`, `audioCache`) chỉ để lấy
   `unlockAudio` — tách module nhỏ (giữ mở khoá âm thanh đồng bộ trong cử chỉ người dùng, iOS).
   `stageDetails.ts` nạp tĩnh 56 chặng ⇒ chunk `ProgrammingSpecStagePage` 542 kB thô → loader lười.
   **1b.** Chuyển nhóm hợp đồng trên đường của trang chủ (`learnerIntent`, `completionEvidence`,
   `shared`, `version`) sang `zod/mini`: đổi `X.optional()` → `z.optional(X)` ở ~10 file
   `core-contracts` ⇒ route `/` bỏ được `vendor-zod` (−10,6 kB). Cũng cân nhắc chỉ nạp trước
   7 trang ở `usePrefetchPages` (`App.tsx`) khi `navigator.connection.saveData` không bật.
2. DRY: FNV-1a chép 4 nơi, mulberry32 2 nơi, `parsonsShuffle` tự viết Fisher–Yates; date helper
   trùng giữa `apps/dhcb/src/lib/date.ts` và `packages/core-db/date.ts`; bỏ dấu tiếng Việt chép 5
   nơi; ~6 bản try/catch localStorage JSON; 3 helper fetch-kèm-auth riêng.
3. Bug: `AmbientScreenCopilot.tsx:36` — dừng chia sẻ màn hình từ UI trình duyệt thì panel vẫn
   báo "đang chia sẻ" (closure cũ). `onboarding.ts:113-131` — đổi uid mà fetch trả null thì giữ
   dữ liệu người trước ⇒ theme "Nhi đồng" có thể còn khoá sau khi tài khoản trẻ em đăng xuất.
4. React: `Layout.tsx:99` gọi `getStreak` (vòng 365 ngày đọc localStorage) mỗi lần render;
   `ThemeProvider.tsx:44` tạo object `value` mới mỗi render.
5. Export chết (0 nơi dùng, kể cả test): `fetchMyFeedback`, `duongDanActionCanvas`, `DAILY_MAX`,
   `getActiveUid`, `_resetGoogleMapsLoaderForTests`, `SESSION_DURATION_MINUTES`/
   `DEFAULT_DURATION_MINUTES`. ~20 export khác chỉ test dùng — cần quyết từng cái.
6. Tài liệu: 8 gói `core-*` chưa được nhắc ở CLAUDE.md/`docs/claude-md-chi-tiet.md`.

### E5 — Đụng cổng (cần người dùng đồng ý trước — hook `config-protection`)

`.size-limit.json` chưa đo các chunk được `modulepreload` lúc khởi động (`guestId`,
`authHeader`, `storage`, `appSettings`, `syncOutboxStorage`, runtime ~12 kB thô) ⇒ con số
"Initial JS" đang thấp hơn thực tế. Đề xuất thêm vào `path` — và giữ trần 160 kB nhờ phần dư
vừa giải phóng ở C1.
