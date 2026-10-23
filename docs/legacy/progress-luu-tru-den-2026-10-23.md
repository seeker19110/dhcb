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
