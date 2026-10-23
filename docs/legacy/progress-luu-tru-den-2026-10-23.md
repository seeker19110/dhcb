# PROGRESS.md — kho lưu trữ phần đã hoàn tất (cắt ngày 2026-10-23)

> **Đây KHÔNG phải trạng thái hiện tại.** File này giữ nguyên văn những phần của `PROGRESS.md`
> đã hoàn tất, cắt ra ngày 2026-10-23 (autopilot thu gọn `PROGRESS.md`, `docs/autopilot/PLAN.md`,
> quyết định D-001) theo luật CLAUDE.md mục 3: `PROGRESS.md` chỉ giữ trạng thái hiện tại. Kho cũ
> hơn: `docs/legacy/progress-luu-tru-den-2026-09-06.md`; nợ đã đóng: `docs/legacy/no-ky-thuat-da-dong.md`.
>
> Thứ tự các khối như thứ tự cũ trong `PROGRESS.md`.

## Đã xong — tóm tắt theo mảng

**Lõi sản phẩm (MVP → v2):** đăng nhập Supabase Auth · 3 chế độ Chat/Viết/Nói song ngữ (STT
Groq-OpenAI + TTS Google Cloud 2 giọng, cache mã hoá AES-256-GCM) · đếm lượt/ngày atomic
(RPC `consume_usage`/`refund_usage`) tách riêng theo mode (chat/writing/speaking/stt) · mở
chiều B (dạy Việt qua Anh) · deploy VPS (PM2 + Nginx + Let's Encrypt) sau Cloudflare · nút
"Kết thúc & chấm điểm" cuối phiên Chat/Speaking · trang cá nhân `/profile`.

**Lộ trình học:** vòng từ vựng nền tảng theo chủ đề, tốc độ 5/10/20 từ/ngày tự chọn · lộ trình
chuẩn CEFR **A1→C2 đầy đủ 6 cấp** (mỗi cấp 1 trang riêng, thứ tự Từ vựng→Ngữ pháp→Hội thoại,
4 tab Hôm nay/Ôn SRS/Từ khó/Kiểm tra lọc theo cấp) · bài thi cuối cấp chặn lên cấp (≥70%) ·
SRS toàn cục (cap phiên, leech, vé nghỉ streak) · xen kẽ từ vựng↔ngữ pháp · quiz ngữ pháp ·
Sổ lỗi cá nhân (Mistake Bank, `/mistakes`) · gamification (flashcard lật 3D, màn ăn mừng
streak/confetti, vòng cung phiên học nối lộ trình↔Chat/Speaking qua `targetWords`).

**Từ điển & dữ liệu:** 12.073 mục, **100% đã gắn nhãn CEFR** (A1-C2, qua CEFR-J/Octanove/
Words-CEFR-Dataset + AI cho phần còn thiếu) · dạng biến thể từ (`WordForms`, 8.740 từ, 200 bất
quy tắc) kèm ví dụ song ngữ cho ~391 ô bất quy tắc · tần suất từ thật (SUBTLEX-US, 9.540/10.006
từ) dùng để sắp "Mở rộng" theo độ thông dụng thay vì alphabet.

**Hạ tầng/chất lượng:** CI gate (lint/typecheck/test/build/format/E2E) trên mọi PR · coverage
ratchet + bundle-size budget (`size-limit`, thay Lighthouse CI) · a11y AA toàn site qua axe
(kể cả màn kết quả AI, 3 theme hiện hành) — **đã đóng nợ a11y** · Zod validate input toàn bộ `api/*.ts` ·
Sentry error tracking (**đã bật thật trên VPS, 2026-07-27** — DSN đã điền, đã xác nhận lỗi test
ghi nhận được) · CI/CD tự deploy + tự chạy migration Postgres khi merge vào `main`
(`npm run migrate:pg` trong pipeline deploy, không cần chạy tay) · audit bảo mật/logic nhiều đợt
(RLS theo cột chặn tự nâng Pro/bypass lượt, timeout fetch, refund lượt khi provider lỗi, ranh
giới ngày theo giờ VN — chi tiết `AUDIT.md`) · **deploy zero-downtime (2026-07-20)**: PM2
chuyển cluster mode (1 instance) + `wait_ready` (`server.ts` gửi `process.send('ready')` sau
`app.listen` + graceful shutdown SIGINT/SIGTERM) — trước đó fork mode `pm2 reload` = tắt cũ
rồi mới bật mới → app chết ~10s mỗi lần deploy (thấy trong log deploy: 9 lần curl
"Couldn't connect"); logic reload + health check gom về `scripts/pm2-reload.sh` (cả
`deploy.yml`/`deploy.sh`/`scripts/deploy.sh` cùng gọi, tự phát hiện fork mode cũ để
delete+start MỘT lần vì PM2 không đổi được exec_mode qua reload) — đã kiểm chứng bằng PM2
thật trong sandbox: 3.766 request liên tục xuyên 2 lần reload, 0 request rớt.

**Quy trình AI-agent (thêm 2026-09-19, đối chiếu `seeker19110/projects-template`):** hook
PreToolUse `pre-commit-gate.sh` tự chặn `git commit` khi typecheck/lint/test đỏ · hook
`block-dangerous-git.sh` nâng cấp (lọc dấu nháy/heredoc trước khi so khớp, tránh chặn oan) ·
hook Stop `usage-guard.sh` tự nhắc wind-down ở ≥70% quota 5h (CLAUDE.md mục 3) · gate CI mới
`check:specs` (`scripts/check-spec-paths.ts`) chặn merge khi đặc tả "Approved" trỏ path không
tồn tại · `scripts/maintenance-sweep.sh` (`npm run maintain`) quét bảo trì tổng hợp chỉ-đọc ·
4 slash-command `/gate` `/debug` `/incident` `/consult` (`.claude/commands/`).

**Tính năng mới:** Thử thách "Challenge 1 phút/ngày" (`/challenge`) — từ 2026-07-15 chạy
**CHU KỲ TUẦN** Thứ 2→CN (bảng 7 ô, tổng kết tuần vào CN, ăn mừng 7/7; bỏ vòng 30 ngày/vé
nghỉ/mốc — huy hiệu sẽ quay lại ở M2). ~~Migration `0010_challenge_entries.sql` chưa chạy trên
production~~ **hết hiệu lực (2026-07-20)** — ghi chú từ thời Supabase; sau khi rời hẳn sang
Postgres tự host, bảng `challenge_entries` đã có sẵn trong `postgres/schema.sql` (baseline khi
khởi tạo DB mới) nên tự động có qua `npm run migrate:pg`, không cần chạy riêng.

**i18n/UX:** song ngữ toàn site kể cả `/login` · bottom-nav mobile (Trang chủ/Lộ trình/Luyện
tập/Tiến độ) · thẻ "Học tiếp" ở Home · karaoke (sáng chữ theo giọng đọc) áp dụng mọi TTS >1 từ ·
chuẩn hoá vị trí nút loa/micro + vùng chạm ≥44px.

**Giọng TTS 14 giọng + gói VIP + admin cấu hình (2026-07-21, nhánh
`claude/chirp-3-hd-voice-upgrade-c06eds` — ✅ ĐÃ MERGE, ghi chú "CHƯA MERGE" cũ đã sai; đo lại
2026-09-03: nhánh không còn trên remote, tính năng đã ở trên `main`):** mở rộng từ 4 → 14
giọng Chirp3-HD thật (7 nữ/7 nam, xác minh qua Google TTS `voices.list`) cho cả en-US/vi-VN ·
mọi user tự chọn giọng ở trang Hồ sơ (`VoicePicker`), lưu toàn cục áp dụng mọi trang · thêm gói
`vip` (bên cạnh free/pro) · **quyết định người dùng 2026-07-21:** hạn mức free=5/pro=100/
vip=không giới hạn (lượt/tính năng/ngày), khuyến mãi ra mắt hiện đang bật (mọi user = VIP tới
hết 31/12/2026, cấu hình được) · trang `/admin-settings` (admin xác thực qua `ADMIN_EMAILS`
trong `.env`) cho chỉnh 15 hạn mức + bật/tắt khuyến mãi lưu trong bảng `app_settings` — server
(`usage.ts`/`voiceAccess.ts`, cache 30s) và client (`src/lib/appSettings.ts`, đồng bộ lúc mở
app qua ETag/If-None-Match, không fetch thừa khi chưa đổi gì) đều đọc từ đây, không còn hard-
code trong nhiều file rời rạc.

**Quản trị VIP/gói (2026-07-28):** Danh sách VIP whitelist (thêm/xoá email → tự cấp/hạ VIP vĩnh
viễn, kể cả người chưa đăng ký) + Ma trận tính năng theo gói Free/Pro/VIP (admin bật/tắt từng
tính năng, thêm/xoá tính năng mới) — 2 tab mới trong `/admin`, xem chi tiết trong "Tiếp theo" và
`docs/` liên quan nếu cần đào sâu.

**Trang Nghe `/listening` — thư viện nghe song ngữ (2026-08-01, PR #434, đang bổ sung nội dung
theo đợt):** trang mới gom 4 mục để NGHE (không chấm điểm, khác `/phrases` và tab "Nghe" trong
`/practice`): câu thông dụng + hội thoại (tái dùng dữ liệu sẵn có, đổi cách trình bày) và **truyện
song ngữ MỚI** (`ft-*`/`fb-*`/... theo 6 thể loại `fairy-tale`/`fable`/`vn-folk`/`myth`/`humor`/
`children`, xem `docs/research/danh-muc-truyen-nghe-2026-08-01.md` — chốt 120 truyện, làm dần mỗi
đợt ~10 truyện/PR). Hạ tầng: `data/stories/{index.ts,loader.ts,raw/*.json}` +
`scripts/gen-stories-json.mjs` (`npm run gen:stories`, nối vào `build`) sinh
`public/data/stories/`; UI `pages/Listening.tsx` (tab đồng bộ URL) + `pages/StoryReader.tsx` (đọc
truyện, tự cuộn theo câu, ghi nguồn bắt buộc) + `components/StoryCard.tsx`. Bản tiếng Anh **bắt
buộc tải thật từ Project Gutenberg** (không gõ từ trí nhớ — CLAUDE.md §5), tiếng Việt Opus dịch
tay chất lượng văn học. Migration `0032` bật feature `listening` cho mọi gói.
**Tiến độ nội dung [cập nhật 2026-08-03, đếm file thật]:** ✅ **`fairy-tale` XONG 20/20** · ✅
**`vn-folk` XONG 20/20** · ✅ **`fable` XONG 20/20** — ba thể loại đã hoàn tất trọn vẹn.
🔵 **`myth` 24/25** (Kingsley 8 + Bulfinch 12 + Colum Bắc Âu 4; chỉ còn Cupid và Psyche).
🔓 **`vn-folk` 24 truyện — thể loại KHÔNG CÒN TRẦN** (chủ dự án chốt 2026-08-03: cứ còn truyện
dân gian Việt Nam hay và chưa có thì bổ sung tiếp). Vì thế `vn-folk` ghi số tuyệt đối, KHÔNG ghi
dạng `n/20` nữa, và tổng danh mục 125 giờ chỉ là **sàn**, không phải đích.
`humor` 0/20 · `children` 0/20. **Tổng 88 truyện.**
🚨 **Sự cố trùng lặp 2026-08-03 (đã xử lý):** đã soạn `vn-tam-cam` rồi mới thấy `ft-tam-cam` ĐÃ
CÓ SẴN ở thể loại `fairy-tale` (bản dài gấp đôi) — đã xoá bản trùng. Nguyên nhân: kiểm "truyện VN
đã có" bằng `ls raw/vn-*.json`, tức lọc theo TIỀN TỐ THỂ LOẠI, trong khi truyện Việt Nam nằm rải
cả ở `fairy-tale` và `humor`. **Thể loại KHÔNG suy ra được quốc gia.** Quy tắc mới đã ghi vào
danh mục §5: trước khi soạn truyện mới phải rà TOÀN BỘ `raw/*.json` không lọc tiền tố.
✅ **Rào cản mạng ĐÃ GỠ (2026-08-03):** `gutenberg.org` giờ truy cập được từ môi trường Claude
Code web (`curl` PG 3327 trả HTTP 200) — ghi chú cũ ngày 2026-08-02 nói `fable`/`myth`/`humor`/
`children` "bị chặn cứng" đã hết hiệu lực, 4 thể loại phụ thuộc Gutenberg làm tiếp được bình thường.
⚠️ Cách cập nhật con số này: **đếm file thật** (`ls apps/english/src/data/stories/raw/ft-*.json |
wc -l`), đừng cộng nhẩm — ghi chú trước đó từng ghi `fairy-tale` "12/20" trong khi thực tế mới có
11 file, và ghi `myth` "chưa bắt đầu" trong khi thực tế đã có 16 file.

## Cần làm tay — B. ĐÃ XONG — giữ lại kèm bằng chứng, đừng làm lại

1. **~~Đối chiếu bộ chạy Kotlin với `kotlinc` thật~~ — ✅ XONG 2026-09-03, cổng §3.4 ĐÃ MỞ.**
   48/48 ca chạy trên `kotlinc 2.0.21` thật (JRE 21.0.10) và khớp hết; mọi ca nay
   `daDoiChieu: true`. Hoá ra không cần máy riêng — proxy tải được `kotlin-compiler-2.0.21.zip`
   từ GitHub releases và máy dựng đã có sẵn `java`. PR-M8/M9 (nội dung Kotlin) đã làm xong nhờ
   cổng này. Nhật ký `docs/changelog/0248-*.md`.
2. **~~Nâng cấp giọng TTS 14 giọng + gói VIP + admin cấu hình (nhánh
   `claude/chirp-3-hd-voice-upgrade-c06eds`)~~ — ✅ ĐÃ MERGE.** Mục cũ ghi "chưa merge, PHẢI
   chạy đủ cổng trước khi merge" — **sai từ lâu**. Bằng chứng (đo 2026-09-03):
   `git ls-remote --heads origin` **không còn nhánh đó**, và tính năng đã nằm trên `main`
   (`apps/dhcb/src/components/VoicePicker.tsx`, `postgres/migrations/0001_app_settings.sql`,
   `packages/core-billing/promo.ts`). Riêng `ADMIN_EMAILS` vẫn là việc tay — đã dời lên phần A.
3. **~~Migration `0004_plan_expires_at.sql`~~** · 4. **~~Migration `0028_tts_viseme_timeline.sql`~~** · 5. **~~Migration `0034`–`0037` (ADR-0002)~~** — ✅ **đều đã chạy trên production từ lâu.**
   Bằng chứng: `scripts/deploy.sh` dòng 75 gọi `npm run migrate:pg` **tự động mỗi lần deploy**,
   và repo nay đã ở migration `0074` (77 file) — tức mọi migration số nhỏ hơn đã được áp qua các
   lượt deploy từ đó tới nay. Ghi chú còn giá trị tra cứu: đợt `0034`–`0037` khiến **mọi phiên
   Bearer cũ phải đăng nhập lại một lần** (đánh đổi đã xác nhận, không phải lỗi); cột
   `viseme_timeline` chỉ phát huy khi có `ELEVENLABS_API_KEY` + giọng VIP "Rachel" (giọng Google
   Chirp3-HD không có timestamp nên vẫn chạy đường ước lượng).
4. **~~Backup R2~~ — ✅ XONG (2026-07-29, người dùng xác nhận).** VPS có đủ **3 dòng cron**
   (`pg_dump` 5h03, `backup:r2` 3h10, `backup:env` 3h10), đã xác nhận upload thật cả 2 loại.
   Trong lúc rà soát còn phát hiện và bịt thêm lỗ hổng `.env` chưa từng được backup ở đâu
   (`scripts/backup-env-to-r2.ts` + `restore-env-from-r2.ts`, mã hoá AES-256-GCM, PR #369).
   `ENV_BACKUP_PASSPHRASE` tạo bằng `openssl rand -base64 24`, lưu ở password manager,
   **KHÔNG** đặt trong `.env`.
5. **~~`SENTRY_DSN`/`VITE_SENTRY_DSN`~~ — ✅ XONG (2026-07-27, người dùng xác nhận).** Đã điền
   trên VPS, đã thấy lỗi test được ghi nhận trên Sentry. Không còn no-op.
6. **Cấp Pro/VIP thủ công** (vẫn dùng được, không phải việc phải làm): admin gọi
   `POST /api/admin-grant-plan` body `{ "email": "...", "plan": "pro", "days": 30 }` với Bearer
   token của admin — `days: null` = vĩnh viễn.

## Sự cố hạ tầng đã xử lý (post-mortem ngắn)

> Từ 2026-10-12 (changelog `0622`): post-mortem SEV1/SEV2 MỚI là một file ở `docs/ops/postmortem/`
> (khuôn trong `README.md` của thư mục đó); mục này chỉ giữ MỘT dòng trỏ tới file. Bản ghi dưới đây là
> định dạng cũ, để nguyên.

- 🟢 **[2026-08-30 16:20 UTC → 2026-09-02 ~03:00 UTC, ĐÃ XỬ LÝ] VPS mất kết nối outbound tới
  GitHub — auto-deploy fail liên tục ~34 giờ, production đứng ở code cũ.**

  **Phát hiện:** kiểm tra thủ công workflow `Deploy to VPS` (`.github/workflows/deploy.yml`)
  thấy **toàn bộ ≥30 lần chạy liên tiếp** đều `failure`/`cancelled` kể từ lần thành công gần
  nhất (`2026-08-30T16:20:50Z`) — bao gồm cả lần chạy ngay sau khi merge PR #807. App (`pm2`/
  `/api/health`) không bị ảnh hưởng vì runtime không cần gọi GitHub — chỉ đường **deploy** đứt.

  **Log lỗi thấy được (2 dạng xen kẽ, cùng gốc mạng phía VPS):**
  - `dial tcp <VPS_IP>:22: i/o timeout` — Actions không SSH vào được VPS.
  - `fatal: unable to access 'https://github.com/...': Failed to connect to github.com port 443
... Couldn't connect to server` — SSH vào được nhưng VPS không ra được Internet để
    `git fetch`.

  **Nguyên nhân gốc:** sự cố mạng phía **nhà cung cấp VPS** (không phải do cấu hình DNS/
  firewall/iptables trên VPS — đã loại trừ qua checklist chẩn đoán SSH). Tự phục hồi/được xử lý
  ở tầng hạ tầng, không cần đổi code hay cấu hình trong repo.

  **Xác minh đã khôi phục:** run deploy `33584562143` (commit `4551ba6c` = PR #807) chuyển từ
  `failure` sang `success` sau khi người dùng chạy lại; các lần deploy kế tiếp lên xanh bình
  thường.

  **Bài học:** `deploy.yml` hiện KHÔNG có cảnh báo khi fail liên tiếp nhiều lần — sự cố này bị
  phát hiện muộn (thủ công, không phải qua thông báo tự động). Cân nhắc thêm bước báo (ví dụ
  comment/issue tự động) khi 2-3 lần deploy liên tiếp fail, để không phải chờ ai đó chủ động rà
  Actions mới biết production bị "đứng" so với `main`. Chưa làm — để mở nếu thấy cần.

## Tiếp theo — các mục đã xong trọn vẹn (cắt 2026-10-23)

### Từ «Tiếp theo (đầu mục)»

- **[2026-10-10] Sửa theo audit toàn diện** ([báo cáo](../audit/2026-10-10-audit-toan-dien-va-toi-uu.md),
  `docs/changelog/0580-*.md`). Đợt đầu (JS khởi động −15,9 kB, chunk trang xếp lớp 2,95 MB → 11 kB) đã
  làm. **E1 lỗi im lặng server ĐÃ LÀM** (mục 1–8 ở `docs/changelog/0581-*.md`, mục 9 mức thấp ở
  `0586`). **E2 nghiệp vụ/SQL ĐÃ LÀM** (`0582`: trần `learn-day` 300/ngày, lịch sử 200/loại, đua
  Elo PvP/phòng DM). **E3 ĐÃ LÀM** (`0583`: migration `0091`
  chỉ mục + job dọn phiên/mã hết hạn + `analytics_events` giữ 365 ngày). **E4 frontend ĐÃ LÀM**
  (`0584`: JS khởi động −3,5 kB, trang chặng 542 → 17 kB, gộp FNV/mulberry32/ngày VN/đọc
  localStorage, sửa 2 bug). **E4.1b ĐÃ LÀM** (`0587`: tách hàm thuần khỏi file hợp đồng thay vì đổi
  hợp đồng sang `zod/mini` — route `/` đã đăng nhập không còn tải `vendor-zod`, −13,7 kB gzip). **E5 ĐÃ LÀM** (`0585`: `.size-limit.json` đếm đủ chunk `modulepreload`, 135,68/160 kB + phép kiểm `scripts/check-startup-coverage.ts` trong `npm run size`). Cả 5 đợt audit đã xong, không còn mục mở (3 helper fetch + 5 bản bỏ dấu cố ý không gộp, lý do ở `0584`). Giới hạn đã biết của E1 (cầu dao chỉ xoá cache ở 1 tiến trình PM2) đã gỡ ở `0589`: phát tin xoá cache qua Redis pub/sub tới cả cụm.

- **[2026-09-30] Sửa theo audit UI/UX chuẩn 2026** ([báo cáo](../audit/2026-09-30-audit-ui-ux-chuan-2026.md),
  `docs/changelog/0466-*.md`, PR #1197): 8 critical · 22 major · 14 minor, chia **9 đợt U1–U9** (mục 12 báo
  cáo), mỗi đợt một PR kèm ảnh trước/sau (Tầng 8b). **Mốc 2026-10-05: xong 6/9 đợt:**
  - U1 #1222 (`0487`): viền focus, toast, manifest, tiêu đề trang, `<main>`/skip link;
  - U2 #1223 (`0488`): form xác thực, hub tràn ngang;
  - U3 #1231 (`0489`): 14 trang tương phản, đưa vào cổng;
  - U4 #1229 (`0490`): ngôn ngữ trang/đoạn;
  - U6 #1234 (`0491`): khung nhìn thấp, gỡ Reachability, giảm chuyển động, màu cưỡng bức, lịch 24px;
  - U8 #1235 (`0492`): thuật ngữ nội bộ, mã enum, chữ Viết Hoa Mỗi Chữ, nguồn truyện.

  Kèm #1232 (`0493`): thứ bậc tiêu đề ở Góc học tập và trang môn STEM.
  **Cập nhật 2026-10-07:** U5/U7/U9 + chuyển px→rem đã merge (xem mục trên); đo lại phát hiện 8
  lỗi WCAG còn sót, sửa ở `0512` (U10, nhánh `claude/wcag-no-conlai-u10`) — xem nợ audit UI/UX.
  **[2026-10-01] Một phần U9 + M15 đã làm** ([audit đồng nhất bố cục](../audit/2026-10-01-audit-dong-nhat-bo-cuc-trai-nghiem-hoc.md),
  `docs/changelog/0467-*.md`, PR #1200): thanh bên thu gọn ở 1024–1279px (M18), lý thuyết STEM có `<h3>` +
  chỉ số dưới (M15 phần cấu trúc), nút Back header đúng đích ở 21 trang, chế độ tập trung + "Bài
  sau" cho bài hội thoại. **Đợt 2 (`docs/changelog/0469-*.md`, PR #1202)**: chủ dự án giao "chọn theo đề xuất
  tốt nhất" → nút chính mọi trang môn dùng màu accent (xanh lá dành cho nghĩa "đúng"), tiêu đề bài
  Lập trình hiện trong nội dung, nhãn gói ở thanh bên đọc gói thật (M8 phần thanh bên), khổ đọc
  60ch cho trang Lập trình (M22). **Đợt nội dung (`docs/changelog/0470-*.md`, PR #1203)**: 575 tiêu đề lý
  thuyết STEM chuyển sang viết hoa đầu câu + dấu `## ` trong dữ liệu nguồn (giữ tên riêng/viết
  tắt; cổng chặn kiểu viết HOA cũ quay lại) — M15 xong. **Đợt 3 (`docs/changelog/0471-*.md`)**:
  thanh công cụ bài hội thoại mobile 167px → 57px một hàng (tuỳ chỉnh vào bảng "Tuỳ chọn nghe",
  nút Back header về danh sách); khối "Học tiếp" dùng chung `ContinueCard`/`ContinueRow` cho trang
  môn Tiếng Anh + Lập trình và ba danh sách (PR #1205). **Việc kế tiếp (đã làm ở `0505`, ĐÃ MERGE #1257):** "Học tiếp" cho bốn môn STEM (cần
  hàm "lá kế tiếp chưa xong" + chốt lớp mặc định); thống nhất tên "Bài học hôm nay" ↔ "Các bài hội
  thoại mẫu thông dụng" và "Vật lý"/"Vật lí" trong đợt câu chữ.

### Từ «Ưu tiên 1 — bằng chứng người dùng thật (trước mọi tính năng mới)»

- **[2026-09-15] S05-1 "Bắt đầu theo ý định" — ✅ ĐÃ MERGE (#939).** `/bat-dau` nay là luồng
  ≤ 5 câu chọn MÔN (công khai cho khách), Intake đời sống giữ nguyên mã ở `/bat-dau/doi-song`;
  hợp đồng `LearnerIntent` + `GET|PUT /api/learner-intent` + migration **`0082`**. Xem
  `docs/changelog/0334-2026-09-15-s05-1-bat-dau-theo-y-dinh.md`. **[2026-09-16] S05-2 "một nguồn
  danh mục môn cho hub và app" — PR mở, chờ CI.** `packages/core-learner/subjectEntry.ts` +
  `scripts/gen-subject-catalog.ts` sinh `apps/hub/src/subjectsCatalog.generated.ts`; hub và
  `Home.tsx` cùng đọc một nguồn (6 môn, đúng thứ tự registry). Xem
  `docs/changelog/0342-2026-09-16-s05-2-mot-nguon-danh-muc-mon.md`. **[2026-09-17] Nợ tài liệu
  `docs/research/luong-nguoi-moi-ho-so-nang-luc-an-2026-08-23.md` đã ĐÓNG** — file đã viết lại,
  đối chiếu đúng mã đang chạy (`intakeService.ts`/`intakeSuggestion.ts`/`Intake.tsx`), xem
  `docs/changelog/0357-2026-09-17-bo-sung-tai-lieu-luong-nguoi-moi.md`.

- **[2026-09-06] ✅ Đo phễu học thật — XONG (`docs/changelog/0277-*.md`).** Hạ tầng đã có
  (bảng `analytics_events`, `lib/analytics.ts`, tab admin Analytics + DAU/WAU/MAU). Lỗ hổng: 3/6
  bước phễu (`signup`, `first_session_done`, `day2_return`) chưa nơi nào bắn → luôn 0. Sửa bằng
  cách SUY RA từ `users.created_at` + `daily_usage` ngay trong `analytics-summary.ts` (một câu
  SQL, đã chạy thật trên Postgres 16), không bắn từ client. Từ nay tab admin Analytics đọc
  được phễu thật, có cả số quá khứ.

- **[2026-09-13] ✅ Đọc phễu thật (20 người dùng) → tắt gate Intake 5 câu (`docs/changelog/0293-*.md`).**
  Tab Analytics cho thấy 20 đăng ký/14 ngày nhưng chỉ 4 hoàn thành phiên học đầu (rớt 80%). Đọc
  code xác nhận nguyên nhân nhiều khả năng nhất: người dùng mới bị ép qua Intake 5 câu rồi
  Onboarding 4 bước (tối đa 9 lượt bấm) trước khi vào được nội dung học. Đã tắt route tới Intake
  (`App.tsx` `RequireAuth` → thẳng `/onboarding`), thêm đo `onboarding_step_view` để biết rớt ở
  bước nào trong 4 bước Onboarding còn lại nếu vẫn còn rớt cao. **Theo dõi tiếp 1–2 tuần** xem tỉ
  lệ `first_session_done` có tăng không trước khi quyết bước kế (rút gọn tiếp Onboarding? thêm
  nút bỏ qua?).

### Từ «Ưu tiên 1c — GÓC HỌC TẬP (đặc tả `docs/specs/2026-09-15-goc-hoc-tap-architecture.md`)»

| Slice | Việc                                                                                    | Trạng thái                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0S    | Đặc tả + goal                                                                           | ✅ đã merge (`docs/changelog/0323-2026-09-15-goc-hoc-tap-spec.md`)                                                                                                                                                                                                                                                                                                                                                            |
| 01    | Đổi tên không gian + URL `/goc-hoc-tap` + alias tương thích                             | ✅ **ĐÃ THI HÀNH** (`docs/changelog/0324-*.md`)                                                                                                                                                                                                                                                                                                                                                                               |
| 02    | Tiếng Anh thành một MÔN ngang hàng, bỏ entry cấp không gian                             | ✅ **ĐÃ THI HÀNH** (`docs/changelog/0326-*.md`; đặc tả `docs/specs/2026-09-15-goc-hoc-tap-02-tieng-anh-la-mot-mon.md`)                                                                                                                                                                                                                                                                                                        |
| 03    | Công cụ tiếng Anh nằm trong môn, công cụ chung có ngữ cảnh môn                          | ✅ **ĐÃ THI HÀNH** (`docs/changelog/0327-*.md`; đặc tả `docs/specs/2026-09-15-goc-hoc-tap-03-04-cong-cu-theo-mon-va-bo-mac-dinh-english.md`)                                                                                                                                                                                                                                                                                  |
| 04    | Nền tảng không mặc định tiếng Anh (`english.isDefault`)                                 | ✅ **ĐÃ THI HÀNH** (`docs/changelog/0327-*.md`, cùng đặc tả với 03)                                                                                                                                                                                                                                                                                                                                                           |
| S07   | Mục lục môn/khoá độc lập shellbar (hợp đồng `OutlineNode` + adapter 3 môn + rail/panel) | ✅ **ĐÃ THI HÀNH đủ 3 slice** — đặc tả `docs/specs/2026-09-15-goc-hoc-tap-07-muc-luc-mon-khoa.md` **Approved** (Q1–Q5 theo cột đề xuất). S07-1 hợp đồng `OutlineNode` + 3 adapter (`docs/changelog/0330-*.md`); S07-2 rail/panel Lập trình + STEM (`0335-*.md`); S07-3 mục lục cấp CEFR môn Tiếng Anh (`0342-*.md`)                                                                                                           |
| S08-1 | Khung phiên học `LearningSession` + hook resume cùng thiết bị (0 đổi giao diện)         | ✅ **ĐÃ THI HÀNH** (`docs/changelog/0331-*.md`; đặc tả `docs/specs/2026-09-15-learning-ux-s08-khung-phien-resume.md` §9 mục 1). Tiếp theo: S08-2 (bài Lập trình, chờ S07-2) và S08-3 (STEM + CEFR)                                                                                                                                                                                                                            |
| S08-2 | Nháp code + bước đang học của bài Lập trình sống qua reload (cùng thiết bị)             | ✅ **ĐÃ THI HÀNH** (`docs/changelog/0343-*.md`; đặc tả §9 mục 2, PR [#961](https://github.com/seeker19110/dhcb/pull/961)). Còn lại của S08: S08-3 phần STEM đã thi hành (`docs/changelog/0347-*.md`, PR [#962](https://github.com/seeker19110/dhcb/pull/962)); phần tab học CEFR (AC-18/AC-19) đã làm ở S08-4 (`docs/changelog/0354-*.md`, PR [#985](https://github.com/seeker19110/dhcb/pull/985)) — **S08 xong cả 4 slice** |
| S06-1 | Hợp đồng `TodayPlan`/`ResumePoint` + resolver "Hôm nay" (0 đổi giao diện)               | ✅ **ĐÃ THI HÀNH** (`docs/changelog/0337-*.md`; đặc tả `docs/specs/2026-09-15-learning-ux-s06-hom-nay-hoc-tiep.md` §9 mục 1). Tiếp theo: S06-2 thẻ "Hôm nay" ở Trang chủ, S06-3 trang môn dùng chung resolver                                                                                                                                                                                                                 |
| S06-2 | Thẻ "Hôm nay" một CTA học tiếp ở Trang chủ                                              | ✅ **ĐÃ THI HÀNH** (`docs/changelog/0338-*.md`; đặc tả `docs/specs/2026-09-15-learning-ux-s06-hom-nay-hoc-tiep.md` §9 mục 2). `TodayCard` thay khối "Kế hoạch hôm nay" của `HomeAiBriefingCard` (hai lối `/lo-trinh-hoc` hard-code đã gỡ). S06-3 đã thi hành                                                                                                                                                                  |
| S06-3 | Trang môn dùng chung resolver "học tiếp" (Home · EnglishHome · ProgrammingHome)         | ✅ **ĐÃ THI HÀNH** (`docs/changelog/0348-*.md`; đặc tả `docs/specs/2026-09-15-learning-ux-s06-hom-nay-hoc-tiep.md` §9 mục 3, PR [#964](https://github.com/seeker19110/dhcb/pull/964)). `pickNextLesson` không còn trong `apps/dhcb/src/pages/`; `CefrLevelPage:621` giữ `findNextStep` (bước trong MỘT cấp đã mở — cách dùng khác). Hết slice S06. Tiếp theo theo thứ tự chốt: S05                                            |

**S11 (completion evidence) — ĐÃ DUYỆT và ĐANG THI HÀNH.** S11-1 (nền tảng: hợp đồng
`packages/core-contracts/completionEvidence.ts`, bảng luật `packages/core-learner/completionRules.ts`,
migration `0081` hai bảng `platform.completion_evidence`/`completion_state`, endpoint
`POST | GET /api/learning/evidence` server chấm LẠI trả lời thô) đã làm — `docs/changelog/0333-*.md`.
**S11-2 ĐÃ THI HÀNH** (`docs/changelog/0348-*.md`, PR [#964](https://github.com/seeker19110/dhcb/pull/964)):
nút "Nộp bài tự kiểm tra" ở `StemLessonView`, `apps/dhcb/src/lib/stemEvidence.ts`, evidence khách
`guest_*` + merge khi đăng nhập (server chấm lại từ trả lời thô), hàng đợi gửi lại cùng thiết bị.
**S11-3 ĐÃ THI HÀNH — S11 KHÉP LẠI ĐỦ BA SLICE** (`docs/changelog/0351-*.md`): màn kết quả dùng chung
`apps/dhcb/src/components/learning/ActivityResult.tsx` (5 trạng thái đều có CHỮ, lý do sai dịch từ
`ReasonCode` sang tiếng Việt, "Làm lại" + "Bài tiếp theo", chừa `reviewSlot` cho S12); `stemOutline`
nhận `state`/`stateStatus` tuỳ chọn nên mục lục STEM hết "chưa đo được" khi đã có bằng chứng;
`apps/dhcb/src/lib/useStemCompletionState.ts` đọc `completion_state` một lần khi mở + sau mỗi lượt nộp.

**S12-1 (hàng đợi ôn xuyên môn) — ĐANG MỞ PR.** Hợp đồng `ReviewItem`, `buildReviewQueue` thuần,
namespace SRS `stem:`, tách `FlashcardReview`, hub `/goc-hoc-tap/on-tap` + `/goc-hoc-tap/:subjectId/on-tap`,
comeback trỏ hub `?cap=5` — `docs/changelog/0341-2026-09-16-s12-1-hang-doi-on-xuyen-mon.md`. Công thức SRS
có golden snapshot canh (`apps/dhcb/src/lib/srs.golden.test.ts`, chụp ở commit đầu của PR). Nhóm thẻ STEM
còn rỗng: S11-3 cố ý KHÔNG gọi `addStemLessonCardsToSrs` (đặc tả S11 §① "KHÔNG ghi thẻ SRS — S12"), chỉ
chừa prop `reviewSlot` của `ActivityResult`; việc nối dây là của S12 và chỉ khi
`ketQua.kind === 'server' && evidence.passed`.

**S12-3 (tiến độ theo môn) — ĐANG MỞ PR [#983](https://github.com/seeker19110/dhcb/pull/983)**
(`docs/changelog/0353-2026-09-16-s12-3-tien-do-theo-mon.md`): `/tien-do` có khối "Tiến độ theo môn"
đứng đầu nội dung, số đếm CHỈ từ cây mục lục S07 qua `apps/dhcb/src/lib/progressSummary.ts` (thuần)
và `apps/dhcb/src/lib/subjectProgressBoard.ts` (dựng cây 6 môn bằng `import()` động). Môn chưa có
bằng chứng hiện CHỮ "chưa đo được", không quy về 0. StatCard tiếng Anh cũ giữ nguyên (quyết định Q6:
THÊM, không thay). Không migration. **S12 khép lại đủ ba slice.**

**S12-2 (sổ lỗi có bằng chứng) — ĐANG MỞ PR [#981](https://github.com/seeker19110/dhcb/pull/981)** (`docs/changelog/0352-2026-09-16-s12-2-so-loi-co-bang-chung.md`).
Migration **`0084_mistakes_evidence.sql`** (3 cột nullable trên `english.mistakes`, lũy đẳng, không
đổi `unique (user_id, dedupe_key)`); `GET /api/learning/evidence?include=attempts`; sổ lỗi STEM là
**hàm thuần đọc từ evidence S11**, KHÔNG có bảng lỗi thứ hai; `MistakeBank` có bộ lọc môn + nhãn "có
bằng chứng"/"ghi tay" + "Ôn lại lỗi này"; hub ôn tập nối nguồn `learning.evidence`. Môn Lập trình ghi
thẳng "chưa có bằng chứng câu sai" (không sổ ghi tay).

**Ghi trong lúc khảo sát 02 (2026-09-15, `docs/changelog/0325-*.md`) — LỖI THẬT đang chạy:** trên
host `hoc-tap.`, nút "Vào Không Gian Học Tiếng Anh"/"Vào Lộ Trình Lập Trình" ở danh mục dùng
`navigate()` nên KHÔNG đổi origin → người đã đăng nhập thành khách, tiến độ 0, dữ liệu học ghi
vào origin không ai đọc lại. **Slice 02 đã bịt**, và **2026-09-20 cơ chế đa host bị GỠ HẲN**
(`docs/changelog/0383-*.md`): không còn origin thứ hai để sinh lại lỗi này. Dữ liệu đã lỡ ghi ở
origin `hoc-tap.` KHÔNG migrate (Q3, chủ dự án uỷ quyền, người dùng còn ít) — xem mục nợ tương
ứng ở "Nợ kỹ thuật còn mở".

**Ghi trong lúc làm 01:** luật chuyển hướng cũ có lỗi VÒNG LẶP thật với bài học STEM khi host
mode bật (`/mon-hoc/:mon/bai-hoc` → host Góc học tập → đá ngược về một đường dẫn không tồn tại).
Đã sửa bằng bảng ownership theo độ sâu. Lỗi này chưa bao giờ lộ ở localhost/E2E vì ở đó chỉ có
một host — đó là lý do nó sống sót từ 2026-08-28.

### Từ «Ưu tiên 1d — REDESIGN TRANG CHỦ & TRẢI NGHIỆM HỌC CỐT LÕI (đặc tả `docs/specs/2026-09-17-redesign-trang-chu-thi-hanh.md`)»

- **Lệnh 1 · P0-1 — ✅ ĐÃ MERGE (#1005).** `pickHomeBanner` (hàm thuần chọn ĐÚNG MỘT banner phụ),
  `Home.tsx` sắp lại thứ tự khối (TodayCard là tâm điểm).

- **Lệnh 2 · P0-2 — ✅ ĐÃ MERGE (#1008).** Token ấm `--w-*` (3 theme) + `CompanionAvatar`/
  `CompanionBubble` (`packages/core-ui`) + `companionVoice.ts`; gộp luồng "quay lại sau bỏ bẵng"
  vào bong bóng Companion (không còn card `.glass` riêng ở `Home.tsx`).

- **Lệnh 5 · P0-4 — ✅ ĐÃ MERGE (#1006).** Header mobile ≤ 4 khe (ẩn Studio switcher + đổi giao
  diện dưới 1024px, dời vào Hồ sơ mục "Không gian"/"Giao diện"); `focus` mode ẩn thêm `BottomNav`.

- **Lệnh 6 · P1-8 — ✅ ĐÃ MERGE (#1007).** `SubjectSpaceList` + `orderSubjects` (thuần) tách khỏi
  `Home.tsx`: môn có bằng chứng học lên đầu (không mặc định tiếng Anh), trạng thái bằng CHỮ
  ("đang học · …" / "chưa bắt đầu", không %), mobile 3 thẻ + "Xem tất cả", empty state "Thử 5
  phút".

- **Lệnh 3 · P2-13 — ✅ ĐÃ MERGE (#1010).** Rule `prefers-reduced-motion` chung đã có sẵn từ
  S13-2 (2026-09-16, universal `*` mạnh hơn đề xuất của đặc tả) — phạm vi thực tế chỉ thêm 3 lớp
  test canh gác (E2E 5 trang, ca giả trong `UiNoise.design.test.ts`, unit cho `confetti.ts`).

- **Lệnh 4 · P0-3 — ✅ ĐÃ MERGE (#1011).** `GuestHome` (Companion giới thiệu + ĐÚNG MỘT CTA
  "Bắt đầu — chọn việc đầu tiên" + dải môn) thay bố cục đầy đủ cho khách; `GuestBanner` đổi điều
  kiện — chỉ hiện SAU KHI khách có dấu vết học thật (`hasAnyGuestSession()`), không còn hiện ngay
  lúc mở trang. ✅ AC-8 (ảnh chụp guest 3 theme × 2 bề rộng) ĐÃ LÀM ở changelog `0600` — không cần mở rộng
  hệ 6-màn-mẫu: `e2e/guest-home.spec.ts` chụp 1440/390 × 3 theme kèm 4 bất biến đo được (không
  tràn, CTA trong màn đầu, vùng chạm ≥ 44px, lời chào không bị cắt); phép đo cuối bắt được câu
  giới thiệu mất chữ "tốt hơn." ở 390px (đã sửa).

- **Lệnh 7 · P1-5 — ✅ ĐÃ MERGE (#1012).** `WeekRhythm` (7 chấm T2→CN + nhiệm vụ + huy hiệu mới
  nhất, ẩn với khách/tuần rỗng+streak=0) + `latestUnlocked()` mới trong `lib/achievements.ts`.

- **Lệnh 8 · P1-6 — ✅ ĐÃ MERGE (#1014).** `SessionDone` gộp `StreakCelebration` +
  `WeeklyGoalCelebration` thành sub-block trong ĐÚNG MỘT overlay (thay vì tự bật riêng từng cái);
  `buildSessionFact` (thuần, ≥ 12 ca) sinh câu "sự thật" luôn có số đếm, cấm "%"/"band"/"trình
  độ"/"Tuyệt vời!" trơ; `?xong=1` đồng bộ URL qua `history.replaceState`; nối vào
  `TodayLesson.tsx` (điểm gọi duy nhất của 2 celebration cũ, xác nhận bằng grep toàn repo). AC-3/AC-4/AC-7 ĐÃ CÓ TEST (changelog `0595`: tích hợp
  qua `TodayLesson` thật, E2E `?xong=1` qua reload, a11y-modals 3 theme × 1440/390). ✅ **[changelog
  `0597`] Đã nối `SessionDone` vào `Challenge.tsx` (thay `Celebration` "Tuần trọn vẹn 7/7" — nay
  là tầng 2 cùng hộp), bài Lập trình (đạt Make) và bài STEM (lượt nộp đạt)**; kết quả phiên nhớ
  trong `sessionStorage` (`useSessionDone`) nên F5 mở lại đúng số liệu, `?xong=1` mồ côi không mở
  màn rỗng. Còn lại: nhãn nút chính "Về trang chủ" ở `TodayLesson` thật ra chỉ ĐÓNG overlay — chờ
  chủ dự án chọn nhãn.

- **Lệnh 9 · P1-7 — ✅ ĐÃ MERGE (#1016).** `DesktopSidebar` 10→7 mục cấp 1: gộp `career` +
  `worklife` thành nhóm "Sự nghiệp & Đời sống ▾", gỡ "Luyện tập" khỏi menu chính (route
  `/luyen-tap` vẫn sống), "Nâng cấp" thành dòng nhỏ dưới avatar. `BottomNav` tab 4 đổi "Luyện
  tập"→"Ôn tập" (`/goc-hoc-tap/on-tap`), bỏ hiệu ứng phóng to khi active, thêm prop
  `companionHasNote?` (mặc định false, nối dữ liệu thật ở lệnh 15). `CAREER_LIFE_PATHS` mới
  trong `navPaths.ts`. CI đỏ 1 vòng: `e2e/english-tools-context.spec.ts` AC-3.2 còn dùng nhãn tab
  "Luyện tập" cũ — sửa theo nhãn mới ("Học"/"Ôn tập"), xanh. Nợ mở: ảnh chụp 1440/390 trước/sau +
  a11y AAA đủ 15 trang × 3 theme hiện hành chưa chạy trong phiên thi hành, để CI thật xác nhận.

Đợt 1 (4 PR đầu) đều dính lỗi CI nhỏ do nhiều slice cùng đụng `Home.tsx`/pattern `theme-light:` —
đã tự sửa hết trước khi merge (chi tiết: đặc tả §8 "Nghiệm thu"): 1 lỗi format, 1 lỗi mô tả PR
(cụm "Approved for implementation" bị ngắt dòng), 2 lỗi thiếu biến thể `theme-light:` cho màu
accent trên nền `bg-zinc-900`/`bg-warm-50` (nền tự đảo sáng ở theme `blue-sky`/`kid` vì `zinc`
map qua CSS variable theo theme — bài học chung: MỌI `text-accent-*` mới thêm phải kèm
`theme-light:` nếu nền không phải fixed-dark thật), 2 lần merge conflict trên `Home.tsx`, 1
selector e2e lỗi thời. Đợt 2: lệnh 3 và lệnh 7 xanh ngay; lệnh 4 (GuestHome) dính nhiều vòng CI
đỏ nhất — xung đột merge `Home.tsx` với lệnh 7 (giữ cả nhánh `isGuest` lẫn khối `WeekRhythm`), 1
eslint-disable thừa, và **4 test e2e cũ giả định hành vi khách cũ** (`english-subject-home`,
`home-quick-ask`, `smoke`, `today-plan` — banner hiện ngay lúc mở trang / có ô hỏi nhanh / có thẻ
"Hôm nay" cho khách) bị phá bởi luật `GuestHome`/`GuestBanner` mới, đã cập nhật theo luật mới.

### Từ «Ưu tiên 2 — nợ nội dung của mảng đã ship (đi sâu, không mở rộng)»

- ~~Lộ trình "Kỹ Sư Trưởng AI": quiz sau chặng mới soạn 4/22~~ — **SAI, đo lại 2026-09-06:**
  `stageQuizzes.ts` đã có **27 chặng** (22/22 P1–P4 + 4 P5 + dư), đặc tả
  `docs/specs/2026-08-31-quiz-18-chang-con-lai.md` đã thi hành, test canh mỗi chặng đúng 5 câu.
  Ghi nhầm vì chép từ nhật ký đợt 3 (`0210`) mà không kiểm mã — đúng lỗi mà luật "đo, đừng
  đoán" nhắm tới. Không còn việc.

- ✅ **[ĐÃ TRẢ 2026-10-09, changelog `0568`] Toán đã đủ 24/24 chương chuẩn** (12 C5 nay có cả
  đường thẳng và góc trong không gian) **và Sinh đã có nhánh HSG** (9 bài, chương 91–93).
  ✅ **[changelog `0569`] Không còn chương Toán nào chỉ 1 bài** (+13 bài, Toán 68 bài). Hoá 10C4–C6
  và Sinh 12C5/C7/C9 chỉ 1 bài là ĐÚNG số bài SGK (đánh số theo bài SGK), không phải thiếu.

- ✅ **Sáu việc nhỏ của lượt audit ĐÃ TRẢ XONG (2026-09-14, `docs/changelog/0300-*.md`):**
  F1 huy hiệu "chưa duyệt chuyên môn" · F4 cờ `notForKids` cho vòng sinh tự động (12 → 42
  vòng) · F5 gộp vòng dưới 5 từ (699 → 677 vòng, không mất từ nào) · F8 tiêu đề bài Hoá hết
  trùng · F9 viết lại 20 lời giải cụt · F10 bổ ca kiểm cho 7 bài Vibe.
  **Hai nợ phát sinh (a) 30 lời giải Lí/Hoá 41–59 ký tự và (b) hạ tầng "mỗi test-case một bộ
  dữ liệu" cho bài SQL — ĐÃ TRẢ ở `docs/changelog/0304-*.md`** (`datasetSql`, áp thử `p5u5.ts`).

- ✅ **Rà lại thang bậc CEFR của từ điển (2026-09-14, `docs/changelog/0312-*.md`)** — báo cáo:
  `docs/audit/2026-09-14-thang-bac-cefr-tu-dien.md`. Nhãn KHÔNG bịa (khớp CEFR-J 100,0 % trên
  8 973 mục, 0 mục thiếu bậc), nhưng **101 dạng biến thể lệch bậc so với từ gốc** (`see` A1 mà
  `saw` B2, `find` A1 mà `found` B2) vì cả ba tầng gắn nhãn chấm từng dạng mặt chữ độc lập. Đã
  sửa **49 mục** theo bất biến mới _dạng chia thừa kế bậc của từ gốc_, giữ nguyên 52 ca đã từ
  vựng hoá (`ground` ≠ `grind`, `rose` ≠ `rise`). Cổng chặn tái phát:
  `packages/subject-english/dictionaryLevels.test.ts`. **Đợt 2 ĐÃ TRẢ XONG NỢ CHÍNH (2026-09-15,
  `docs/changelog/0313-*.md`, báo cáo `docs/audit/2026-09-15-tu-hiem-gan-bac-nhap-mon.md`):**
  56 mục rất hiếm mà gắn A1/A2 → **sửa 45** (B1 6 · B2 31 · C1 8), **giữ cố ý 10** mục do chính
  CEFR-J chấm theo chủ đề giáo trình (`grandparent`, `kilogram`, `tablespoon`…). Cổng mới:
  `RARE_EASY_ALLOWLIST` — danh sách ngoại lệ CÓ TÊN, mục mới rơi vào vùng đó làm CI đỏ.
  **Đợt 3 — vệ sinh dữ liệu ĐÃ XONG (2026-09-15, `docs/changelog/0315-*.md`, báo cáo
  `docs/audit/2026-09-15-ve-sinh-du-lieu-tu-dien.md`):** gỡ **4** liên kết `base` sai từ nguyên
  (`bit`←bite · `ground`←grind · `rose`←rise · `left`←leave; quét ra thêm 3 ca ngoài ca đã biết),
  xoá mục `iii`. **Quan trọng hơn cả hai việc đó:** phát hiện hai đợt sửa trước **chưa tới người
  học** — vòng `cefr-*` chép bậc vào JSON nên **43 từ vẫn được dạy ở bậc cũ** (người học A1 vẫn
  gặp `impetus`, `tensely`); đã đồng bộ 43 bậc + sinh lại `curriculum.json`, và thêm cổng
  `apps/dhcb/src/data/vocabLevelSync.test.ts`.
  **✅ ĐÃ XONG — người dùng chốt phương án (b), thi hành 2026-09-15
  (`docs/changelog/0316-*.md`, báo cáo `docs/audit/2026-09-15-sinh-lai-vong-theo-thang-bac.md`):**
  sinh lại vòng A1–B2 + C1–C2 rồi sinh lại `curriculum.json` và `public/data/cefr.json` →
  **0 từ còn nằm trong vòng sai bậc** (trước: 43). Quy mô thật LỚN HƠN ước lượng "khoảng 8 vòng"
  của tôi: **123 vòng đổi thành phần, 328 từ đổi vòng**; kèm viết tay 22 câu mẫu cho 13 vòng bị
  hỏng. **Luật rút ra, phải theo lần sau:** hai generator khử trùng qua `curriculum.json` nên
  **thứ tự chạy 5 bước** (A1B2 → curriculum → C1C2 → curriculum → learn-json) là một phần của
  lời giải — chạy sai thứ tự thì từ bậc C1 biến mất khỏi lộ trình im lặng.

- ~~**4 trang trụ Career/Work/Startup/Life chưa có chiều B**~~ — ✅ **ĐÓNG 2026-09-20**: ba
  trang Career/Startup/Life đã bị gỡ hẳn (changelog 0389), trang còn lại là "Ghi chú" —
  nội dung do người dùng tự nhập, không có chiều học nào để phân biệt.

- ~~**[2026-09-20] Backend ba trụ đã gỡ vẫn còn sống**~~ — ✅ **ĐÓNG 2026-09-20 (chủ dự án chốt
  xoá, chấp nhận mất dữ liệu cũ)**: đã xoá `careerService`/`startupService`/
  `lifeFoundationService`/`lifeMilestoneMasteryService`, `/api/{career,career-interview,startup,
life}`, contract + `careerInterviewService`/`compassionateCoachPrompt`/
  `crossDomainGraphService`/`crossDomainSynergyService` (chỉ tồn tại để đồng bộ mục tiêu sự
  nghiệp) và bảng CSDL (`postgres/migrations/0085_drop_career_startup_life.sql`).
  `domainReadModelService` giờ chỉ còn trụ `work`; Companion **không còn** tư vấn xuyên trụ ở ba
  mảng đó. **CÒN MỞ (cần chủ dự án xác nhận riêng):** `/api/life-graph` · `/api/life-goals` ·
  `/api/life-synthesis` + `lifeGraphService` + bảng `personal.life_graph_*` (migration 0043) **cố
  ý GIỮ LẠI** — đó là đồ thị cá nhân/Learning chứ không phải trụ "Đời sống" (bảng nằm ở schema
  `personal`, không phải `life`): `learningGoalAdapter` → `/api/profile` chiếu learning goal vào
  đó, `contextEngine` đọc nó theo consent `life_graph`. (`/api/life-synthesis` từ changelog `0550`
  chỉ đếm bản ghi thật của Học tập + Ghi chú, không đọc đồ thị cá nhân.) Xoá sẽ gãy các luồng Learning + Companion
  đó, nên chờ quyết định riêng.

### Từ «Ưu tiên 3 — kỹ thuật (nhỏ, đo được, không đổi hành vi)»

- **Tách 4 file giao diện > 1.700 dòng** — ✅ XONG cả 4 (mỗi file một PR, có Tầng 8b):
  `StudyTabs.tsx` 2.071 → `studyTabs/` (`docs/changelog/0278`) · `Practice.tsx` 1.752 → `practice/`
  (`0279`) · `Lessons.tsx` 1.693 → `lessons/` (`0280`) · `AppliedKnowledge.tsx` 1.942 → trang 112
  dòng + `appliedKnowledge/` 14 file, state theo từng simulator — **phương án A**, giá trị nhập
  không còn được nhớ khi đổi simulator (`0281`, đặc tả
  `docs/specs/2026-09-06-tach-applied-knowledge-theo-simulator.md`). Phần dở còn lại
  `lessons/LessonView.tsx` 1.016 dòng cũng đã tách: chế độ Đóng vai ra hook `useRolePlay` + 3
  component, còn 699 dòng (`0282`, đặc tả `docs/specs/2026-09-06-tach-dong-vai-lesson-view.md`).
