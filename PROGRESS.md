# PROGRESS.md — Trạng thái dự án

> AI đọc file này để biết đang ở đâu. Chi tiết tính năng: `PROJECT.md`. Lịch sử đầy đủ từng PR:
> `git log`/PR đã merge trên GitHub — file này chỉ giữ **tóm tắt** + việc còn mở + quyết định lớn.
>
> **Nhịp làm việc theo giới hạn giờ (CLAUDE.md mục 3):** ≥ 70% usage → hoàn tất việc đang làm, tạo
> PR rồi DỪNG chờ duyệt. < 70% → sau khi PR merge, tự động tiếp tục mục kế tiếp.

## Giai đoạn hiện tại

**Nhật ký từng đợt việc nay nằm ở `docs/changelog/` — mỗi đợt MỘT FILE riêng.**

Xem nhanh: `npm run changelog` (in 10 đợt gần nhất) · `npm run changelog -- 30` (30 đợt) ·
`npm run changelog -- --all`. Hoặc mở thẳng `docs/changelog/`, file có SỐ LỚN NHẤT là mới nhất.

**Vì sao tách ra (quyết định 2026-08-26).** Trước đây mọi đợt việc đều chèn thêm một mục vào ĐẦU
mục này. Hệ quả: PR nào cũng sửa cùng một chỗ của cùng một file, nên cứ hai PR chạy song song là
xung đột — riêng ngày 2026-08-26 đã xung đột **bốn lần liên tiếp** (PR #693, #695, #696, #697),
lần nào cũng cùng một kiểu "cả hai bên cùng thêm mục ở đầu file" và phải giải tay. Tách mỗi đợt
thành một file riêng thì hai PR ghi hai file khác nhau, git không có gì để xung đột.

Cố ý **KHÔNG** commit file index sinh tự động: chính cái index đó sẽ lại thành một file mà mọi PR
cùng sửa, tức là dựng lại đúng vấn đề vừa bỏ. Thay vào đó `npm run changelog` đọc thẳng thư mục.

**File này giữ lại phần thật sự là TRẠNG THÁI HIỆN TẠI** — thứ được sửa tại chỗ chứ không chồng
thêm: nợ kỹ thuật còn mở, quyết định quan trọng, việc tiếp theo, việc cần làm tay. Đó là lý do
những mục đó vẫn nằm nguyên ở đây.

**Cắt gọn 2026-09-06 (đánh giá sâu dự án, `docs/changelog/0276-*.md`):** file này từ 3.797
dòng về ~700 dòng. Mọi phần đã hoàn tất (lộ trình English Tutor OS đã FROZEN, nhật ký trước khi
tách changelog, toàn bộ mục "Tiếp theo" cũ đã ✅, GĐ2 STEM) dời **nguyên văn** sang
`docs/legacy/progress-luu-tru-den-2026-09-06.md`; nợ đã đóng dời sang
`docs/legacy/no-ky-thuat-da-dong.md`. Bản đồ tài liệu nào còn hiệu lực, tài liệu nào chỉ tham
khảo: `docs/README.md`.

**Vị trí hôm nay (2026-09-06):** app nền tảng chạy thật tại `donghanhcungban.org`; môn Anh
chín nhất (A1→C2, 3 chế độ, hai chiều A/B); môn Lập trình có xương sống P1–P6 + 14 hướng chuyên
sâu + khoá ngắn + lộ trình mục tiêu; **[2026-09-20] ba trụ Sự nghiệp · Khởi nghiệp · Đời sống
ĐÃ GỠ HẲN khỏi giao diện, trụ Công việc đổi tên thành "Ghi chú" (`/ghi-chu`) và nối nội dung
vào ngữ cảnh Companion** (changelog 0389); **[2026-09-20, PR [#1063](https://github.com/seeker19110/dhcb/pull/1063), `docs/changelog/0389-2026-09-20-header-trang-chu-theo-sidebar-go-studio-switcher.md`]
nút "Trang chủ" ở header desktop nay ẩn khi sidebar mở rộng (đỡ trùng nút "Trang chủ" của sidebar),
hiện lại khi sidebar thu gọn/không có; gỡ hẳn dropdown "Studio" ở header (đã trùng mục "Góc học
tập"/"Sự nghiệp & Đời sống" ở sidebar và mục "Không gian" ở trang Hồ sơ)**; **[2026-09-20, PR [#1064](https://github.com/seeker19110/dhcb/pull/1064), `docs/changelog/0390-*.md`] `PageShell` thêm biến thể bề rộng `fluid` (Home/Dashboard tận
dụng khoảng trống khi sidebar desktop thu gọn, đo 1152px → 1336px @1440px); ~57 trang dùng
`PageHeader` trong thân trang đã chuyển tiêu đề lên thanh header (`Layout title=`), xoá subtitle,
giữ `h1 sr-only` cho trình đọc màn hình; lịch hoạt động Dashboard đổi mặc định thành MỞ SẴN. Đợt
này cũng vá 2 hồi quy tinh tế do đổi `<h1>` gây ra: thiếu `tabIndex={-1}` làm hỏng focus sau khi
đóng mục lục mobile (`useOutlinePane.tsx`), và `buildCrumbs()` (`apps/dhcb/src/lib/breadcrumb.ts`)
cộng thêm một đốt breadcrumb thay vì thay thế khi tiêu đề trang khác tên tĩnh trong route tree,
làm sai nhãn nút Back — đã sửa gốc, cả hai đều có test canh; **4 môn STEM
(Toán/Lí/Hoá/Sinh) ĐÃ NỐI VÀO APP 2026-09-13\*\* — 294 bài, 55 bài có hoạt ảnh minh hoạ, 24 chuyên
đề bồi dưỡng học sinh giỏi ba cấp, chấm câu hỏi tất định bằng `@dhcb/core-grading`
(`docs/changelog/0295-2026-09-13-hoan-thien-4-mon-stem.md`). Cổng chất lượng đo thật 2026-09-13:
typecheck ✅ · 586 file / 12.269 unit test ✅ · a11y AA+AAA ✅ · bundle 135,4/150 kB (trần nới 140 → 150 kB ngày 2026-09-17, changelog 0360).

**PR #890 (2026-09-12, đã merge) — `TRAPS.md` + cổng kiểm `PROGRESS.md` lỗi thời.** Mượn ý
tưởng từ repo khung `seeker19110/project-template`: `TRAPS.md` ở gốc repo (sổ bẫy đã mắc thật,
khác `docs/adr/` ghi quyết định) + `scripts/check-progress-freshness.sh` (cảnh báo, chưa chặn
CI, chạy trong job `audit` khi push `main`) — quét nhánh nêu tên trong file này mà không còn
tồn tại trên remote và chưa gắn nhãn giải quyết. Chi tiết: `docs/changelog/0292-*.md`.

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

## Tiếp theo

- **[2026-09-23] Kế hoạch nâng cấp UI/UX và sư phạm sau audit**:
  [goal 5 đợt](docs/goals/2026-09-23-uiux-su-pham.md) và
  [baseline F1–F8](docs/research/2026-09-23-uiux-su-pham-baseline.md).
  S01–S04 và S08 đã có source trên `main`; S06 phần cổng, S07a mở zoom và S11a sửa deep-link
  cũng đã merge. **S05 source kỹ thuật** (builder điền từ dùng chung runtime + audit,
  `docs/changelog/0432-*.md`) đã làm; review chuyên gia 20 câu/chiều + Product vẫn WAITING. [#1137](https://github.com/seeker19110/dhcb/pull/1137) đạt quality/e2e
  trước merge; CI trên merge commit còn chạy lúc cập nhật. S04/S08 vẫn thiếu bằng chứng
  screen reader/thiết bị thật; S04 còn thiếu zoom/microphone thật. S06/S07 partial theo
  [audit S06](docs/research/2026-09-23-s06-follow-up-approval-audit.md) và
  [audit S07](docs/research/2026-09-23-s07-followup-evidence-gap.md); #1142 đã merge, báo cáo
  một ca Chrome 200% ba theme trên sheet Vật lí, chưa đủ ma trận S07. **24/09: người dùng duyệt
  toàn bộ phần còn lại** — S06b (phủ AAA cho `/luyen-tap` + `/goc-hoc-tap/english`) và S09 (B1
  đóng mức kỹ thuật; thứ tự S09a kết quả STEM → S09b Trong bài → S09c English / S09d Lập trình)
  đã Approved for implementation (`docs/changelog/0434-*.md`). S10 chờ chuyên gia rà mẫu, S12 chờ pilot ngày 7/14.
  S06b source xong (`docs/changelog/0435-*.md`: hai màn vào cổng AAA, sửa nền gradient, xanh 3 theme).
  S09a source xong (`docs/changelog/0436-*.md`: kết quả STEM giữ số câu gốc, câu thiếu kết quả không bị coi là sai).
  S09b source xong (`docs/changelog/0437-*.md`: mục "Trong bài" + neo section cố định, ≤2 thao tác tới lý thuyết/tự kiểm/kết quả).
  S09d source xong (`docs/changelog/0439-*.md`: hash ↔ bước bài lập trình, lối tắt "Kết quả chấm", sửa kẹt "Đang chấm…" khi đổi tài khoản).
  S09c source xong (`docs/changelog/0438-*.md`: `?lesson=N#luot-M`, loader kiểm HTTP + id, huỷ audio/đóng vai khi điều hướng). **S09 xong toàn bộ phần source.**
  Hai nợ nhỏ sau S09 đã trả (`docs/changelog/0441-*.md`): liên kết "Bỏ qua mục lục" (bài Vật lí 52 → 5 Tab), thẻ hội thoại đếm lượt thống nhất; kèm sửa tiêu điểm rơi về `<body>` sau khi chọn trong mục lục mobile.
  **25/09:** S07d Approved (`docs/changelog/0442-*.md`) và source xong (`docs/changelog/0443-*.md`): focus không còn bị header/thanh đáy che khi Tab/Shift+Tab, vùng chạm 44px, `h1` ở CEFR/Placement, cổng `e2e/s07-matrix.spec.ts` 76 ca có negative control.
  **25/09:** S10b + S11b Approved (`docs/changelog/0444-*.md`): S10b xuất phản hồi thật của app cho 40 mẫu để chuyên gia chấm (không chấm thay); S11b tự thử lại câu STEM sai không lộ đáp án cũ.
  S11b source xong (`docs/changelog/0445-*.md`): vào câu STEM sai từ Sổ lỗi thì ẩn đáp án cũ + lời giải (có nút xem lại), nút "Thử lại câu này", E2E chuỗi sai → tự thử → nộp đúng → Sổ lỗi hết câu.
  S10b source xong (`docs/changelog/0446-*.md`): `candidate-feedback.json` dựng nguyên văn phản hồi app cho 40 mẫu (22 ca chuyên gia chấm được ngay; English cần provider), cổng chống lỗi thời, sàng lọc agent 5 nghi vấn — **chờ chuyên gia**.
  **25/09:** S06c Approved (`docs/changelog/0447-*.md`): 14 vi phạm AA tương phản ở 5 studio `/ban-dong-hanh`, cổng AA chưa quét các studio này — sửa + đưa vào cổng ở PR kế tiếp.
  S06c source xong (`docs/changelog/0448-*.md`): 14 vi phạm đã sửa, `aria-pressed` + vùng chạm 44px, cổng AA quét đủ 5 studio × 3 theme. Nợ còn: AAA ở 5 studio (1–5 nút mỗi studio × theme, chưa vào `a11y-aaa.spec.ts`), thẻ Workplace Harvester tràn ngang ở 390px.
  **25/09:** S06d Approved (`docs/changelog/0449-*.md`): hai nợ trên thành một slice — cổng AAA quét 5 studio (đo trên main: 10/15 ca đỏ, badge 11px dưới 7:1 và chữ trên nền gradient) + sửa tràn ngang Workplace Harvester; nợ riêng: nhãn thanh đáy "partially obscured" khi quét AAA ở 390px.
  S06d source xong (`docs/changelog/0450-*.md`): 5 studio × 3 theme xanh cổng AAA (bỏ nền gradient dưới chữ đọc, badge 11px ≥7:1), Workplace Harvester hết tràn ngang + `aria-pressed`.
  Header 6 thẻ CompanionVoice hết chật ở 390px (`docs/changelog/0451-*.md`): xếp dọc ở màn hẹp, tiêu đề ≤2 dòng, nút một dòng, có cổng E2E.
  Echo/Holodeck có trạng thái tải/lỗi/rỗng + Thử lại (`docs/changelog/0452-*.md`, PR #1178): hook dùng chung `lib/useCatalogList.ts` (kiểm Zod, sai hợp đồng = lỗi), test hợp đồng server↔client, E2E 3 ca.
  Nợ nhỏ còn lại sau S06d đã trả (`docs/changelog/0453-*.md`, PR #1179): badge A2A/Ambient một dòng ở 390px; thanh đáy nền đặc nên nhãn đo được tương phản (cổng mới 390px × 3 theme); thẻ shadowing báo lỗi khi chấm lượt thất bại. **Chuỗi S06 hết nợ mở.**
  **26/09:** hoạt ảnh có nút "Xem lớn" khi chữ nhãn dưới 10px (đo: 1.000/1.861 nhãn ở 390px), mở hộp thoại toàn màn hình tự xoay hình khổ ngang; kèm sửa khoá `airel` lặp bài, đáp án không dấu lộ đáp án ở bài Git (`docs/changelog/0454-*.md`).
  Bước tiếp theo: S11 (sau S10 chuyên gia) và thu bằng chứng accessibility/thiết bị thật còn thiếu;
  xem trạng thái và giới hạn nghiệm thu trong goal, không coi source merge là goal hoàn tất.

> Mỗi mục 1 PR, dừng xin duyệt ở mỗi cổng (CLAUDE.md mục 3). Mục đã ✅ KHÔNG nằm ở đây — xem
> `docs/changelog/`. Viết lại toàn bộ ngày 2026-09-06 theo kết luận đánh giá sâu: **kỹ thuật
> đã khoẻ, cái thiếu là bằng chứng người học thật; ưu tiên chiều sâu hơn chiều rộng.**

### Ưu tiên 1 — bằng chứng người dùng thật (trước mọi tính năng mới)

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

- **[2026-09-06] Đóng băng mở rộng phạm vi trong 2–4 tuần** (người dùng quyết): không thêm
  môn/khoá/hướng mới cho tới khi có số đo người học thật. Lý do: 3 tuần qua ~15 đợt việc/ngày,
  hầu hết là mở rộng chiều rộng (14 hướng lập trình, 8 khoá ngắn, 2 bộ chạy ngôn ngữ, 3 môn STEM
  nháp), trong khi chưa có một con số retention nào.
- **[2026-09-06] ✅ Đo phễu học thật — XONG (`docs/changelog/0277-*.md`).** Hạ tầng đã có
  (bảng `analytics_events`, `lib/analytics.ts`, tab admin Analytics + DAU/WAU/MAU). Lỗ hổng: 3/6
  bước phễu (`signup`, `first_session_done`, `day2_return`) chưa nơi nào bắn → luôn 0. Sửa bằng
  cách SUY RA từ `users.created_at` + `daily_usage` ngay trong `analytics-summary.ts` (một câu
  SQL, đã chạy thật trên Postgres 16), không bắn từ client. Từ nay tab admin Analytics đọc
  được phễu thật, có cả số quá khứ.
- **[2026-09-06] Mời 5 người học thật, quan sát 2 tuần** (việc tay của người dùng, xem mục
  "Cần làm tay"). Sau 2 tuần đọc phễu + DAU/returning rồi mới quyết mảng nào đi sâu.
- **[2026-09-13] ✅ Đọc phễu thật (20 người dùng) → tắt gate Intake 5 câu (`docs/changelog/0293-*.md`).**
  Tab Analytics cho thấy 20 đăng ký/14 ngày nhưng chỉ 4 hoàn thành phiên học đầu (rớt 80%). Đọc
  code xác nhận nguyên nhân nhiều khả năng nhất: người dùng mới bị ép qua Intake 5 câu rồi
  Onboarding 4 bước (tối đa 9 lượt bấm) trước khi vào được nội dung học. Đã tắt route tới Intake
  (`App.tsx` `RequireAuth` → thẳng `/onboarding`), thêm đo `onboarding_step_view` để biết rớt ở
  bước nào trong 4 bước Onboarding còn lại nếu vẫn còn rớt cao. **Theo dõi tiếp 1–2 tuần** xem tỉ
  lệ `first_session_done` có tăng không trước khi quyết bước kế (rút gọn tiếp Onboarding? thêm
  nút bỏ qua?).

### Ưu tiên 1b — ĐỔI MÔ HÌNH GÓI (chủ dự án chốt 2026-09-12, đặc tả đã viết, CHƯA thi hành)

Quyết định: **xoá gói Pro và Plus, chỉ còn Free + VIP**. Free hưởng **hạn mức Plus cũ (30
lượt/ngày)** miễn phí. **VIP** là gói trả phí duy nhất, đặc quyền là **học tự do** (nhảy cấp tuỳ
ý); Free học tuần tự từ đầu. Người đang trả Plus/Pro còn hạn → **nâng VIP giữ nguyên hạn đã trả**.

Chia giai đoạn, mỗi giai đoạn MỘT PR, dừng xin duyệt giữa các giai đoạn. **Toàn bộ quyết định
đã chốt 2026-09-12** — trừ một mục cần xác nhận trước khi bắt đầu (GĐ2b, xem dưới):

| GĐ  | Đặc tả                                                | Quyết định đã chốt                                                                                                                               | Trạng thái                                                 |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| 1   | `docs/specs/2026-09-12-gd1-xoa-goi-pro.md`            | Xoá **cả Pro lẫn Plus**; Free hưởng hạn mức Plus cũ (30/ngày); người đang trả còn hạn → nâng VIP giữ nguyên hạn                                  | ✅ **ĐÃ THI HÀNH** (PR GĐ1, `docs/changelog/0289-*.md`)    |
| 2a  | `docs/specs/2026-09-12-gd2-vip-hoc-tu-do-mon-anh.md`  | Khoá theo **cấp CEFR A1–C2**; chốt chặn **ở SERVER** (không phải chỉ giao diện)                                                                  | ✅ **ĐÃ THI HÀNH** (PR #887, `docs/changelog/0290-*.md`)   |
| 2b  | (chưa viết — khung ở GĐ2 §⑦)                          | Chuyển **chấm thi** về server để bịt nốt lỗ `cefrExams`                                                                                          | ⛔ **HOÃN** (chủ dự án chốt 2026-09-12) — xem ghi chú dưới |
| 3   | `docs/specs/2026-09-12-gd3-khoa-bai-mon-lap-trinh.md` | Khoá theo **bậc P1→P6** (dễ→nâng cao); mở bậc sau khi **≥70% bài** bậc trước; **chỉ** xương sống, không khoá hướng chuyên sâu/khoá ngắn/lộ trình | ✅ **ĐÃ THI HÀNH** (PR #888, `docs/changelog/0291-*.md`)   |
| 4   | `docs/specs/2026-09-12-gd4-khoa-bai-4-tru.md`         | **KHÔNG khoá gì ở 4 trụ** — chúng là công cụ, không phải giáo trình                                                                              | ⛔ **ĐÓNG, không thi hành**                                |

**Ngưỡng 70% dùng chung** giữa môn Anh (`UNLOCK_PCT`) và môn Lập trình — nếu đổi, đổi ở một nơi:
`packages/core-learner/unlockThreshold.ts` (GĐ3, 2026-09-12). Môn Anh re-export hằng này qua
`apps/dhcb/src/lib/cefrProgress.ts`; môn Lập trình dùng qua `packages/subject-programming/levelLock.ts`.

**Phát hiện khi khảo sát mã (2026-09-12), ảnh hưởng tới ước lượng:**

1. ~~Hệ thống thực tế có **4 gói** (`free/plus/pro/vip`)~~ — ✅ **ĐÓNG ở GĐ1 (2026-09-12):** nay
   đúng **2 gói** `free` + `vip`; con số 30 đã chuyển thành cấu hình (`app_settings.pro_daily_limit`,
   cột giữ tên cũ, ý nghĩa mới là "hạn mức Free"). `CLAUDE.md` mục 6 đã được sửa cho đúng.
2. ~~Luật khoá cấp CEFR **và cả việc chấm thi** hiện nằm hoàn toàn ở client~~ — ✅ **ĐÓNG MỘT NỬA
   ở GĐ2a (2026-09-12):** **quyền mở cấp** nay do server tính (`packages/core-learner/cefrUnlock.ts`
   - migration `0077` giữ grandfather); `/api/progress` KHÔNG nhận `cefrUnlocked` từ client nữa, nên
     sửa localStorage hay POST thẳng mảng giả không vượt được. **Còn lại:** `cefr_exams` vẫn do client
     ghi (chấm thi ở trình duyệt) — bịa kết quả thi vẫn mở được cấp sau. Đó là **GĐ2b**, chủ dự án đã
     chốt HOÃN (xem ghi chú dưới) vì nó làm mất khả năng thi offline.

⚠️ Việc này **mâu thuẫn với quyết định đóng băng phạm vi 2026-09-06** (ưu tiên 1: đo bằng chứng
người học thật trước). Đã nêu với chủ dự án; chủ dự án vẫn chọn làm. Ghi lại để sau này biết vì
sao ưu tiên 1 bị chen ngang.

**GĐ2b — chốt HOÃN (chủ dự án, 2026-09-12).** Đã hỏi lại trước khi thi hành vì hai lý do: (1) đặc
tả GĐ2 §⑦ chỉ có khung, chưa viết đủ (5 câu hỏi thiết kế còn để ngỏ); (2) đánh đổi thật —
chuyển chấm thi CEFR về server sẽ **làm mất khả năng thi offline (PWA)** của người dùng lương
thiện để chặn người gian lận. Chủ dự án xác nhận **hoãn**, giữ đúng khuyến nghị gốc của đặc tả:
đợi tới khi có người học thật + dấu hiệu gian lận thật (ưu tiên 1) mới làm.

Nếu sau này mở lại: đã hỏi trước và chốt sẵn nguồn đề thi = **bộ đề tĩnh trên server** (server
giữ ngân hàng đề + đáp án có sẵn, trả câu hỏi không kèm đáp án, chấm khi nộp) — không chọn
phương án AI sinh đề động mỗi lượt thi. Bốn câu hỏi thiết kế còn lại của §⑦ (chống dò đáp án qua
thi lại nhiều lần, người đang thi dở lúc deploy, giới hạn lượt/thời gian chờ) vẫn cần viết đặc tả
đầy đủ trước khi giao việc.

### Ưu tiên 1c — GÓC HỌC TẬP (đặc tả `docs/specs/2026-09-15-goc-hoc-tap-architecture.md`)

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

**Các slice còn lại của goal learning-ux — ĐẶC TẢ ĐÃ VIẾT 2026-09-15 (`docs/changelog/0328-*.md`), tất cả đã `Approved for implementation` từ 2026-09-15 (chủ dự án chốt toàn bộ §7 theo đề xuất mặc định — `docs/changelog/0329-*.md`).** Thứ tự thi hành đã chốt: S07 → S08 → S06 → S05 → S10 → S11 → S09 → S12 → S13. File: `docs/specs/2026-09-15-learning-ux-s{08,06,05,10,11,09,12,13}-*.md`. **Số migration cấp theo thứ tự MERGE thật, KHÔNG đặt trước (chủ dự án chốt 2026-09-15, PR #935):** cổng `scripts/migrations-readme-coverage.test.ts` cấm nhảy số, nên PR nào merge trước thì lấy số kế tiếp còn trống. S11-1 merge trước nên lấy `0081`; S05/S09/S12 lấy số còn trống tại thời điểm PR của chúng merge. Kế hoạch đánh số trước (S05 0081 · S11 0082 · S09 0083 · S12 0084) đã BỎ.

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

### Ưu tiên 1d — REDESIGN TRANG CHỦ & TRẢI NGHIỆM HỌC CỐT LÕI (đặc tả `docs/specs/2026-09-17-redesign-trang-chu-thi-hanh.md`)

**Current truth clarity-first (2026-09-19):** UX-R1 đã merge #1020; UX-R2 Home progressive
disclosure đã merge #1022. Spec UX-R3 đã merge #1023, **Approved for implementation** cho bốn
slice tuần tự; R3-1 async truth/retry đã merge #1024; R3-2 responsive state/focus/calendar đã
merge #1025; R3-3 hierarchy + consolidated "Tuần này" đã merge #1034
(`docs/changelog/0376-2026-09-19-ux-r3-3-dashboard-weekly-overview.md`). **R3-4 English
progressive disclosure — SLICE CUỐI CỦA UX-R3, đã làm** (PR này): `DashboardEnglishDetails` mới —
summary luôn hiển thị (từ cần ôn · chỉ dấu lộ trình CEFR · trạng thái lượt AI, gồm cả
`#dashboard-weekly-credit-heading` recovery target) + panel disclosure đóng mặc định ở MỌI
viewport (`#dashboard-english-details-toggle`/`-panel`, HTML `hidden`) chứa Hôm nay/Từ vựng/Sổ
lỗi/CEFR/IELTS/Tổng kết; `Dashboard.tsx` chỉ còn orchestration (resource async + focus recovery),
không còn JSX các khối English. Đủ 28 evidence case CLS/height/hierarchy ở
`e2e/ux-r3-4-english-disclosure-evidence.spec.ts` (canonical 9 · English expanded 3 · weekly
unavailable 6 · CEFR delayed 3 · CEFR error 3 · programming-only 3 · live responsive calendar 1),
xanh ổn định qua nhiều lần chạy lại. Chi tiết + các phát hiện hạ tầng test ở
`docs/changelog/0377-2026-09-19-ux-r3-4-english-disclosure.md`. **CHUỖI UX-R3 (R3-1→R3-4) HOÀN
TẤT.** P2-10 `ProgressStory` độc lập đã được phương án A supersede; UX-R4 (taxonomy/header/
navigation, đặc tả cha §2 non-goals) chưa thi hành — đọc lại `docs/specs/2026-09-18-ui-clarity-
foundation.md` trước khi bắt đầu UX-R4 để lấy đúng phạm vi. Không deploy hoặc truy cập production
trong scope này.

**[2026-09-17] Đặc tả 15 lệnh đã chốt (§2), chủ dự án ra lệnh thi hành từng lát.** Trạng thái
sau đợt 1 + đợt 2 + lệnh 8/9 (9/15 lệnh, chạy bằng subagent Sonnet, đã merge):

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
  lúc mở trang. Nợ mở: AC-8 (ảnh chụp guest 3 theme × 2 bề rộng) cần mở rộng hệ thống 6-màn-mẫu
  (`ScreenId` khoá cứng 6 giá trị dùng chung 3 file) — để lát riêng.
- **Lệnh 7 · P1-5 — ✅ ĐÃ MERGE (#1012).** `WeekRhythm` (7 chấm T2→CN + nhiệm vụ + huy hiệu mới
  nhất, ẩn với khách/tuần rỗng+streak=0) + `latestUnlocked()` mới trong `lib/achievements.ts`.
- **Lệnh 8 · P1-6 — ✅ ĐÃ MERGE (#1014).** `SessionDone` gộp `StreakCelebration` +
  `WeeklyGoalCelebration` thành sub-block trong ĐÚNG MỘT overlay (thay vì tự bật riêng từng cái);
  `buildSessionFact` (thuần, ≥ 12 ca) sinh câu "sự thật" luôn có số đếm, cấm "%"/"band"/"trình
  độ"/"Tuyệt vời!" trơ; `?xong=1` đồng bộ URL qua `history.replaceState`; nối vào
  `TodayLesson.tsx` (điểm gọi duy nhất của 2 celebration cũ, xác nhận bằng grep toàn repo). Nợ
  mở: AC-3 (một dialog duy nhất khi trùng streak+tuần) mới có test unit dựng trực tiếp, chưa lắp
  ráp qua `TodayLesson` thật; AC-4 (e2e `?xong=1` giữ khi reload) và AC-7 (a11y-modals + ảnh chụp)
  chưa thêm vì phiên thi hành không có Playwright — để CI thật xác nhận, đã xanh; `Challenge.tsx`/
  `Lesson*.tsx` (Lập trình)/`StemLessonView.tsx` CHƯA nối `SessionDone` (hiện các trang này không
  gọi celebration cũ nên không hồi quy, nhưng cũng chưa có overlay mới) — để lát riêng.
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

**Đã thi hành:** lệnh 10 (P1-9a, URL Lập trình → `/goc-hoc-tap/programming`) trong
`20cb2353`, và lệnh 11 (P1-9b, URL Tiếng Anh → `/goc-hoc-tap/english`) trong `c95240ca`.
Các route cũ vẫn có redirect tương thích; server/nginx/SEO (P1-9c) đã hoàn tất phần mã và tài liệu
trong lát lệnh 12. Còn hai việc tay:
người vận hành phải áp dụng các `location` 301 trên VPS theo `docs/deploy-vps-ubuntu.md`, rồi
đo Google Search Console sau 14 ngày (2026-10-01) để xác nhận URL cũ đã được thay thế.

**Còn lại:** nợ coverage branch, bundle JS, AC-8 visual, S09-3 conflict UI, read-model `stats`
không có cột nguồn, cùng các lỗi gate toàn repo đã ghi ở changelog. Mỗi lát tiếp theo phải có
đặc tả được duyệt và changelog riêng trước khi sửa mã.

### Ưu tiên 2 — nợ nội dung của mảng đã ship (đi sâu, không mở rộng)

- ~~Lộ trình "Kỹ Sư Trưởng AI": quiz sau chặng mới soạn 4/22~~ — **SAI, đo lại 2026-09-06:**
  `stageQuizzes.ts` đã có **27 chặng** (22/22 P1–P4 + 4 P5 + dư), đặc tả
  `docs/specs/2026-08-31-quiz-18-chang-con-lai.md` đã thi hành, test canh mỗi chặng đúng 5 câu.
  Ghi nhầm vì chép từ nhật ký đợt 3 (`0210`) mà không kiểm mã — đúng lỗi mà luật "đo, đừng
  đoán" nhắm tới. Không còn việc.
- **Chế độ ôn thi chiều B (`vsl-b1`) dùng tạm bộ từ A1–B1 học ngược** vì repo chưa có bộ từ
  vựng tiếng Việt phân bậc — việc NỘI DUNG vài nghìn mục, cần đặc tả riêng trước (xem "Nợ kỹ
  thuật còn mở").
- **Chương trình M (mở rộng ngôn ngữ) 11/12 PR — PR-M4–M6 (nội dung Swift) CHẶN** cho tới khi
  đối chiếu bộ chạy Swift với `swift` thật (việc tay, mục "Cần làm tay" A). Hiến chương:
  `docs/research/dac-ta-mo-rong-ngon-ngu-va-tu-duy-2026-08-26.md`.
- **4 môn STEM đã nối vào app (2026-09-13) — QUYẾT ĐỊNH CŨ VỀ CỔNG DUYỆT ĐÃ BỊ ĐẢO.** Trước đây
  mục này ghi "chờ duyệt chuyên môn, không nối khi chưa có người học thật cần". Người dùng chốt
  ngược lại trong phiên 2026-09-13: nối thẳng khi AI viết xong. Thay cho người duyệt, mỗi môn có
  test canh chấm lại TOÀN BỘ đáp án bằng engine chấm thật. Mọi bài vẫn mang `reviewStatus: 'draft'`.
  (Cổng đó lúc đầu là XANH GIẢ và môn Sinh còn không có — đã sửa 2026-09-14, PR #900; xem
  TRAPS.md mục 4.) **Nợ còn lại:** nội dung chưa ai có chuyên môn đọc lại; chuẩn sư phạm mới rà trên phần bài trọng
  điểm, chưa quét hết 294 bài. Chi tiết: `docs/changelog/0295-2026-09-13-hoan-thien-4-mon-stem.md`.
- **Môn Toán thiếu hình học không gian và thống kê** — lớp 10 C5; lớp 11 C3, C4, C8; lớp 12 C2, C3,
  và phương trình đường thẳng trong không gian. Đây là mảng mỏng nhất của cả bốn môn STEM.
- **Môn Sinh chưa có nhánh bồi dưỡng học sinh giỏi** — đợt 2026-09-13 chỉ làm cho Toán/Lí/Hoá.
- **[2026-09-21 · CẬP NHẬT cùng ngày, PR đặc tả — `docs/changelog/0396-2026-09-21-dac-ta-19-chang-p6-con-thieu.md`] P6 (Lập trình,
  14 hướng chuyên sâu) — lệch lớn giữa "đã đặc tả" và "đã có bài học thật".**
  **Phần KẾ HOẠCH đã khép: đủ 56/56 chặng có đặc tả.** 19 chặng thiếu nay đều có đặc tả triển
  khai đã duyệt
  (`docs/specs/2026-09-21-{mobile-s2-s4,algo-s3-s4,systems-s3-s4,game-s1-s4,embedded-s1-s4,desktop-s1-s4}-bai-hoc-that.md`,
  dải unit `p6-u214…u289`). Chủ dự án chốt: KHÔNG nối các chặng này vào `learningPaths/` nào.
  **Nợ còn lại thuần là SOẠN BÀI THẬT.** Thứ tự thi hành:
  1. ~~`security-s4` (`p6-u206…u209`)~~ — **XONG 2026-09-21** ở một PR riêng
     (`docs/changelog/0398-2026-09-21-bai-hoc-chang-security-s4.md`). ~~`security-s3`
     (`p6-u210…u213`)~~ — **XONG 2026-09-21** (`docs/changelog/0397-2026-09-21-bai-hoc-security-s3-s4.md`).
     Hướng `security` nay đủ bài S1–S4; cả hai chặng đã nối vào `principal-ai-p4`/`p5` kèm quiz
     sau chặng. (`data-s4` đã trả ở PR #1086.)
  2. Ba hướng đang RỖNG HOÀN TOÀN, ưu tiên cao nhất vì học viên chọn vào gặp mảng trắng: `game`
     → `embedded` → `desktop`, mỗi hướng 2 PR (S1+S2 rồi S3+S4). (`embedded-s1`/`s2` đã trả,
     `docs/changelog/0397-2026-09-21-bai-hoc-embedded-s1-s2.md`; còn `embedded-s3`/`s4`.)
  3. `mobile` S2–S4, ~~`algo` S3–S4~~ (XONG 2026-09-21, `p6-u226…u233`, PR #1094 —
     `docs/changelog/0397-2026-09-21-bai-hoc-that-algo-s3-s4.md`; hướng `algo` nay đủ S1–S4),
     ~~`systems` S3–S4~~ — mỗi hướng 1 PR.
     **`systems` S3–S4 ĐÃ XONG 2026-09-21** (`p6-u234…u241`, 8 unit / 16 bài — hướng Hệ thống
     nay đủ S1→S4; xem `docs/changelog/0404-2026-09-21-bai-hoc-systems-s3-s4.md`).

  Hiện trạng đo được lúc ghi nợ (trước khi `data-s4` xong ở PR #1086):
  Đo bằng cách đối chiếu `packages/subject-programming/specializations/details/` (56/56 file
  S1–S4 × 14 hướng, đủ hết, không placeholder) với `SPEC_STAGE_UNITS` trong
  `specializations/stageUnits.ts` (bảng map chặng → unit bài học thật trong `lessons/`):
  - ~~**3 hướng CHƯA có bài học nào dù đã có đặc tả đủ 4 chặng: game, embedded, desktop** (S1–S4
    đều 0 unit)~~ — **CẢ BA ĐÃ TRẢ XONG 2026-09-21, KHÔNG CÒN HƯỚNG NÀO TRẮNG.** `embedded-s1` =
    `p6-u258…u261` và `s2` = `p6-u262…u265` (`docs/changelog/0397-*.md`), `s3` = `p6-u266…u269`
    và `s4` = `p6-u270…u273` (`docs/changelog/0402-*.md`), tổng 32 bài với bốn cổng
    `embeddedS1…S4Lessons.test.ts`; `desktop-s1` = `p6-u274…u277` và `s2` = `p6-u278…u281`
    (`docs/changelog/0399-*.md`), `s3` = `p6-u282…u285` và `s4` = `p6-u286…u289`
    (`docs/changelog/0401-*.md`); `game-s1…s4` = `p6-u242…u257`, 16 unit / 32 bài, hai cổng
    `gameS1S2Lessons.test.ts` và `gameS3S4Lessons.test.ts` (`docs/changelog/0397-*.md` +
    `0398-*.md`). Cả ba hướng KHÔNG nối vào `learningPaths/` nào theo đúng mục ⑧ của từng đặc
    tả. Trước đây không có cờ trạng thái
    (`status/draft/comingSoon`) nào trong code để giao diện báo trước, chỉ suy ra được gián tiếp
    qua mảng rỗng.
  - **mobile chỉ có S1** (S2–S4 = 0 unit).
  - **systems, algo chỉ có S1–S2** (thiếu S3–S4).
  - ~~**security thiếu S3–S4**~~ — **S4 ĐÃ TRẢ 2026-09-21** (`docs/changelog/0398-*.md`):
    `security-s4` = `p6-u206…u209`, 8 bài, cổng `securityS4Lessons.test.ts` (chặng PHÒNG THỦ, có
    danh sách từ vựng tấn công bị cấm); nối vào `principal-ai-p5` trước `principal-s3` kèm quiz
    `security-s4-q1…q5`. **Còn `security-s3`** (`p6-u210…u213`, đặc tả riêng đã duyệt).
  - ~~**data thiếu S4**~~ — **ĐÃ TRẢ 2026-09-21** (`docs/changelog/0396-*.md`): `data-s4` =
    `p6-u202…u205`, 8 bài, cổng `dataS4Lessons.test.ts`; nối vào `principal-ai-p5` trước
    `principal-s3`. Ghi lại cho đợt sau: nối một chặng vào lộ trình `principal-ai` thì **bắt buộc
    soạn quiz** trong `stageQuizzes.ts` — đặc tả không liệt kê điểm chạm này, cổng
    `ProgrammingPathPage.test.tsx` mới bắt được.
  - **mathforcode S3/S4 mỏng** (2 unit/chặng thay vì 4 như các hướng khác).
  - 5 hướng đã đủ 4 chặng, dùng làm khuôn mẫu: web, devops, ai, architecture, backend.
    Vì `details/` đã có sẵn nội dung chi tiết (module/objective/practice/selfCheck/doneSignals)
    cho toàn bộ 56 chặng, việc còn thiếu là "dịch từ đặc tả sang bài học chấm được", không phải
    soạn từ đầu — nhưng vẫn là khối lượng nội dung lớn, chưa ước lượng effort.
    ✅ **Phát hiện phụ ĐÃ SỬA (2026-09-21, cùng PR đặc tả):** `CLAUDE.md` mục 2 trước đây dẫn
    tới `docs/research/dac-ta-huong-chuyen-sau-mon-lap-trinh-2026-08-27.md` — file KHÔNG tồn tại
    trong repo — và ghi "13 hướng" trong khi `registry.ts` có **14** (thiếu `mathforcode`). Nay mục
    đó trỏ thẳng vào mã nguồn làm nguồn sự thật (`specializations/registry.ts` · `<hướng>.ts` ·
    `details/` · `stageUnits.ts`) và ghi đúng 14 hướng = 11 sản phẩm + 3 nền. `docs/research/mon-lap-trinh.md`
    (bản gộp) và `docs/specs/2026-08-27-chang-s2-huong-chuyen-sau.md` vẫn còn ghi "13 hướng" —
    ĐÚNG với thời điểm chúng được viết (trước khi thêm `mathforcode`), giữ nguyên làm hồ sơ lịch sử,
    không sửa ngược tài liệu đã đóng.

- ✅ **Sáu việc nhỏ của lượt audit ĐÃ TRẢ XONG (2026-09-14, `docs/changelog/0300-*.md`):**
  F1 huy hiệu "chưa duyệt chuyên môn" · F4 cờ `notForKids` cho vòng sinh tự động (12 → 42
  vòng) · F5 gộp vòng dưới 5 từ (699 → 677 vòng, không mất từ nào) · F8 tiêu đề bài Hoá hết
  trùng · F9 viết lại 20 lời giải cụt · F10 bổ ca kiểm cho 7 bài Vibe.
  **NỢ MỚI ghi nhận trong lúc làm:** (a) 25 câu Lí + 5 câu Hoá có `explain` dài 41–59 ký tự
  (cổng đặt ở ngưỡng 40 đã audit, chưa nới lên 60); (b) 4 bài SQL muốn kiểm chặt hơn cần hạ
  tầng "mỗi test-case một bộ dữ liệu" — việc kiến trúc, chưa làm.
- ✅/🟡 **Audit tính chính xác (2026-09-14) — ĐÃ SỬA phần máy làm được, xem `docs/changelog/0299-*.md`.** Báo cáo:
  `docs/audit/2026-09-14-tinh-chinh-xac-cong-thuc-va-ket-qua.md`. **9 câu Vật lí chấm SAI học
  sinh trả lời ĐÚNG** vì lưu `value` ở đơn vị hiển thị thay vì SI (`core-grading/types.ts:41`
  chốt SI) — 90% số câu có đơn vị hệ số ≠ 1. Nặng hơn: **cổng canh `lessons.test.ts` của cả 4
  môn là XANH GIẢ** — nó dựng bài làm bằng `(value - offset) / factor`, tức giả định sẵn điều
  cần kiểm, nên không thể bắt được lỗi này; mà đặc tả 2026-09-13 lại viện dẫn chính cổng đó
  làm lý do bỏ khâu duyệt của người. **Cả hai đã sửa xong 2026-09-14:** cổng gom về
  `packages/core-grading/selfGrade.ts` với lớp đối chiếu ĐỘC LẬP vào `explain` (nạp thẳng
  `${value} ${unit}` cũng mù, chỉ mù chiều ngược lại — báo oan bài khai chuẩn SI); 9 giá trị
  khai lại bằng `donViHienThi(<số hiển thị>, <đơn vị>)`; môn Sinh được bù cổng còn thiếu.
  **CÒN NỢ (đếm lại 2026-09-14 bằng script nạp thẳng registry):** 442 câu trắc nghiệm KHÔNG máy
  nào kiểm được tính đúng kiến thức, vẫn cần người có chuyên môn đọc. Tỉ lệ là **66,5%** tổng số
  câu (442/665), không phải 60% như ghi trước đó — phân bổ: Toán 17/105 · Lí 119/208 · Hoá
  137/182 · **Sinh 169/170 = 99,4%** (môn rủi ro nhất, nên duyệt trước). Và nợ duyệt chuyên môn
  rộng hơn riêng phần trắc nghiệm: `reviewStatus: 'reviewed'` đang là **0/294 bài**, tức cả 665
  câu + 294 phần lý thuyết đều chưa ai đọc; 223 câu tự chấm được thì nay đã có cổng thật
  (`selfGrade.ts`) kiểm đúng/sai số học, nhưng cổng đó không phán được nội dung dạy có đúng
  chương trình hay không.
  **ĐÃ CÓ ĐƯỜNG ĐI (2026-09-14, PR #903):** `docs/specs/2026-09-14-quy-trinh-duyet-chuyen-mon-mon-sinh.md`
  — bản ghi duyệt kiểm chứng được, bộ tiêu chí `sinh-v1` 7 câu, chia **8 lô** môn Sinh theo mật độ
  rủi ro (lô 1 = `sinh12-c1`, 7 bài/14 câu), 5 bất biến kèm test canh. **CHỜ NGƯỜI DÙNG CHỐT 2 câu**
  **NỀN + GIAO DIỆN ĐÃ XONG (PR #904 + #905, `docs/changelog/0302-*.md` · `0303-*.md`):** hợp
  đồng bản ghi duyệt + băm nội dung + luật ăn khớp dùng chung 4 môn
  (`packages/core-contracts/lessonReview*.ts`), bảng `stem_lesson_reviews` (migration `0078`,
  sửa ràng buộc `mon` ở `0079`), API `/api/admin-stem-review` (chỉ admin, **server tự tính băm
  từ registry — không tin `bamNoiDung` do client gửi**, sửa khỏi thiết kế ban đầu của #904),
  khối duyệt cuối trang bài học (`LuotDuyetBai.tsx`) + tab "Duyệt nội dung STEM" ở `/admin-s`
  (`AdminStemReviewPanel.tsx`), `npm run review:status` và `npm run review:sync`. E2E a11y AA
  277/277 + AAA 165/165 (gồm 15 ca mới), Tầng 8b đã chụp 1440/390px trước/sau.
  **CÒN LẠI:** khâu AI sàng lọc (③bis) — làm sau khi lô 1 duyệt tay xong, để có 14 câu người đã
  đọc làm thước đo ca thử 13 câu; `review:sync` chưa dùng thật lần nào.
  Ô ⓪.5 **ĐÃ CHỐT trong phiên 2026-09-14**: duyệt **trong `/admin` và ngay trong trang bài học** ·
  AI được sàng lọc vòng 1 nhưng phải làm thật kỹ (5 ràng buộc đo được + ca thử 13 câu) và
  **không bao giờ** được ghi `reviewed`.
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

- **Audit chất lượng nội dung 6 môn (2026-09-14)** — báo cáo đầy đủ:
  `docs/audit/2026-09-14-chat-luong-noi-dung-cac-mon-hoc.md`. 11 phát hiện; hai cái đã có ở
  trên (Toán thủng 6 chương · Sinh chưa có HSG). Mới và đáng làm ngay: `reviewStatus: 'draft'`
  của 294 bài STEM KHÔNG được giao diện đọc (người học không biết bài chưa duyệt); **588/677**
  vòng từ vựng sinh tự động thiếu câu mẫu (báo cáo ghi "610/699" là SAI — đã đính chính tại chỗ
  2026-09-14); cờ `notForKids` không phủ vòng sinh tự động; 23 vòng dưới 5 từ; 6 bài Hoá trùng
  tiêu đề; 20 giải thích câu hỏi dưới 40 ký tự; 14 bài Lập trình chỉ 1 test-case.
- **BA ĐẶC TẢ NỘI DUNG MỚI ĐÃ SOẠN XONG, CHỜ NGƯỜI DÙNG DUYỆT** (2026-09-14, xem
  `docs/changelog/0307-*.md`). Chưa file nào mang cụm "Approved for implementation", nên **chưa
  được phép thi hành**: `docs/specs/2026-09-14-cau-mau-cho-vong-tu-vung-cefr.md` (F3) ·
  `docs/specs/2026-09-14-hoat-anh-minh-hoa-stem.md` (F6, ưu tiên Vật lí) ·
  `docs/specs/2026-09-14-chuyen-de-hsg-hoa-12.md` (F7). Mỗi file có ô câu hỏi chốt ở đầu.
  **Cập nhật 2026-09-14:** đặc tả **HSG Hoá 12 ĐÃ DUYỆT VÀ ĐÃ THI HÀNH XONG** — người dùng chốt
  "2 chuyên đề, giữ Điện hoá + Hữu cơ 12"; 6 bài đã vào registry (`docs/changelog/0308-*.md`),
  Hoá cân đối **3/6/6** bài HSG cho lớp 10/11/12, tổng chuyên đề HSG toàn hệ 9 → 15. **F7 đã
  đóng**, và nay có test bất biến chặn CI ép mỗi lớp Hoá có chuyên đề HSG đủ ba cấp nên không
  tái phát được.
  **Cập nhật 2026-09-14 — F6 và F3 đều đã duyệt và đã thi hành, qua HAI PR song song:**
  - **PR #911 (`docs/changelog/0309-*.md`):** F6 đợt 1 (hoạt ảnh Vật lí) + **F3 đợt 0 — bậc A1
    xong 34/34 vòng (102 câu)**, tổng vòng có câu mẫu 89 → **123/677**.
  - **PR #912 (`docs/changelog/0310-*.md`):** F6 đợt 0→4 **một mạch cho cả 4 môn** — người dùng
    chốt "70% cho cả 4 môn · ratchet cứng chặn CI". Thêm **162 hoạt ảnh**, độ phủ nhánh core
    **62/288 (21,5%) → 224/288 (77,8%)**: Lí 84,7% · Hoá 76,4% · Sinh 75,0% · Toán 72,3%. Khi gộp
    `main`, hai bên cùng vẽ hoạt ảnh cho chung các bài Vật lí; lấy bản của #912 vì nó phủ nhiều
    hơn (45 so với 29 trên các file xung đột) và **không bài nào chỉ có hoạt ảnh ở phía #911**,
    nên không mất độ phủ. Giữ lại bất biến **ratchet riêng cho lớp 12** do #911 đóng góp —
    ngưỡng toàn môn không canh được phân bố theo lớp.

  **F6 ĐÃ ĐÓNG** — ratchet `TOI_THIEU_PHU_HOAT_ANH` trong `lessons.test.ts` của cả 4 môn chặn CI
  khi độ phủ tụt.
  - **PR #913 ĐÃ MERGE (`docs/changelog/0311-*.md`): F3 ĐÃ ĐÓNG** — 554 vòng A2–C2 (1 662 câu) viết
    nốt, **677/677 vòng có câu mẫu** (cefr-\*: 588/588). Không cần key AI: viết tay như đợt 0.
    Kèm hai việc phát sinh do quy mô tăng 17 lần — (1) phải tối ưu `matchedCircleWords` vì test
    bất biến đỏ do **timeout** (đã đối chiếu cũ/mới trên 2 063 câu: 0 ca lệch; 5,4 s → 0,13 s);
    (2) lượt viết đầu ra câu **nhồi từ** sinh tiếng Anh bịa (`miscellaneous-ly`) nên **đã viết
    lại 244 vòng** và thêm bất biến `KHONG_NHOI_TU` chặn CI (trần 4 từ của vòng mỗi câu, mốc lấy
    từ chuẩn A1 đợt 0). Câu nhồi ≥ 5 từ: 445 → **0**.
  - **PR (đợt này) (`docs/changelog/0312-*.md`): gỡ 10 mục "từ vựng" KHÔNG phải từ tiếng Anh.**
    Bắt đầu từ `cefr-b2-noun-63` nhưng hoá ra là khuôn lỗi hệ thống: 8 **mảnh tên riêng**
    (`des`, `york` ở ngay bậc **A1**; `angeles`, `las`, `costa`, `kong`, `hong`, `los`) + biến thể
    trùng `netsurfer` + tên hệ điều hành `ios`. Gỡ ở **từ điển** (nguồn sinh ra mọi vòng `cefr-*`)
    chứ không sửa tay trong vòng, vì sửa trong vòng sẽ bị lần sinh lại ghi đè. Cổng mới
    `apps/dhcb/src/data/vocabQuality.test.ts` chặn CI, bắt theo **lời giải nghĩa** nên rác kiểu mới
    cũng bị chặn. Còn nợ: `scholasticism`/`mutability`/`RNA` gắn nhãn B2 là **sai bậc** (không phải
    lỗi dữ liệu) — cần đợt đánh giá lại thang bậc từ điển.

- **[2026-09-14 — ĐÃ QUYẾT, người dùng chốt phương án (a)] Tiêu chí kích thước file chương của
  đặc tả hoạt ảnh đo SAI CHỖ — đã sửa sang đo chunk sau build.** Tiêu chí cũ "file chương ≤ 120 kB
  **nguồn**" không đạt với 4 file Sinh (`sinh12c1.ts` 249,6 kB · `sinh11c2.ts` 139,3 ·
  `sinh12c2.ts` 136,5 · `sinh11c1.ts` 126,6), nhưng hai điều cho thấy chính tiêu chí mới là thứ
  sai: (1) mốc nền trong đặc tả **ghi sai** — nó viết "lớn nhất 56,7 kB" vì chỉ đo môn Lí, còn
  `sinh12c1.ts` **đã 132 kB TRƯỚC** đợt hoạt ảnh; (2) chi phí THẬT người học chịu thì tốt — đo
  trên `dist/js/` sau build, chunk chương nặng nhất `sinh12c1` = **39,7 kB gzip**, nhẹ hơn hẳn
  `ProgrammingSpecStagePage` 122,2 kB · `vendor-codemirror` 149,2 · `grading` 61,3 đang chạy sẵn
  trên production. Byte mã nguồn không phải thứ người học tải; **chunk sau build** mới là. Tiêu
  chí đã đổi trong đặc tả và nay có **cổng đo thật chặn CI** (`scripts/check-lesson-chunks.ts`)
  thay vì một dòng chữ trong tài liệu.
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
  đó, `contextEngine` đọc nó theo consent `life_graph`, và studio "Tổng hợp" của Companion
  (`StudioSynthesis`, đang chạy thật) gọi `/api/life-synthesis`. Xoá sẽ gãy các luồng Learning +
  Companion đó, nên chờ quyết định riêng.

### Ưu tiên 3 — kỹ thuật (nhỏ, đo được, không đổi hành vi)

- **Tách 4 file giao diện > 1.700 dòng** — ✅ XONG cả 4 (mỗi file một PR, có Tầng 8b):
  `StudyTabs.tsx` 2.071 → `studyTabs/` (`docs/changelog/0278`) · `Practice.tsx` 1.752 → `practice/`
  (`0279`) · `Lessons.tsx` 1.693 → `lessons/` (`0280`) · `AppliedKnowledge.tsx` 1.942 → trang 112
  dòng + `appliedKnowledge/` 14 file, state theo từng simulator — **phương án A**, giá trị nhập
  không còn được nhớ khi đổi simulator (`0281`, đặc tả
  `docs/specs/2026-09-06-tach-applied-knowledge-theo-simulator.md`). Phần dở còn lại
  `lessons/LessonView.tsx` 1.016 dòng cũng đã tách: chế độ Đóng vai ra hook `useRolePlay` + 3
  component, còn 699 dòng (`0282`, đặc tả `docs/specs/2026-09-06-tach-dong-vai-lesson-view.md`).
- **Rà lại sau vài ngày:** log Redis (`pm2 logs dhcb --err`) sau khi VPS có swap — còn ~7 lần
  rớt/ngày thì đào tiếp, giảm hẳn thì đóng nợ (chi tiết ở "Nợ kỹ thuật còn mở").
- **Đã kiểm 2026-09-06, KHÔNG cần làm:** (1) Zod — mọi handler API có đọc `req.body/query/params`
  đều đã validate bằng Zod (46 handler không dùng Zod là handler không đọc input); (2) 28 chỗ
  tắt `react-hooks/exhaustive-deps` trong 16 file đều là khuôn có chủ đích và có comment
  (khoá invalidation thủ công `refresh`/`ready` cho dữ liệu localStorage, hoặc effect chỉ chạy
  lúc mount) — không phải stale closure.

## ⚠️ Cần làm tay (không cần PR)

> **Soát lại toàn bộ 2026-09-03 bằng chứng cứ, không bằng trí nhớ.** Mục này là thứ người dùng
> đọc để biết MÌNH phải làm gì — nên một mục đã xong nằm lại đây không vô hại: nó bắt người
> dùng đi làm việc đã xong. Lần soát này tìm thấy **6 mục như vậy** (xem phần B).
> Quy tắc từ nay: xong mục nào thì chuyển ngay xuống phần B kèm **bằng chứng**, đừng xoá trắng —
> để lần sau khỏi phải đi kiểm lại từ đầu.

### A. CÒN PHẢI LÀM

- **[2026-09-26] Repo GitHub đã đổi tên `donghanh` → `dhcb`: đổi remote ở các chỗ NGOÀI repo.**
  Trong repo đã đổi hết (changelog `0458`). GitHub đang tự chuyển hướng tên cũ nên chưa có gì
  gãy, nhưng chuyển hướng mất ngay nếu sau này tài khoản `seeker19110` tạo repo mới tên
  `donghanh`. Ba chỗ cần tự làm:
  (1) VPS: `cd /var/www/dhcb && git remote set-url origin https://github.com/seeker19110/dhcb.git && git remote -v`;
  (2) bản clone trên máy cá nhân: cùng lệnh `git remote set-url` trong thư mục clone;
  (3) Claude Code on the web: phiên mới chọn repo `seeker19110/dhcb`. Phiên cũ vẫn khai tên
  `donghanh`; gọi API vẫn chạy nhờ chuyển hướng, nhưng đăng ký theo dõi PR bằng tên mới bị từ
  chối trong phiên cũ.

- **[2026-09-12 · GĐ1 · ĐÃ XONG]** Export CSV sao lưu gói người đang trả tiền trên DB
  PRODUCTION trước khi merge PR #886 — đã chạy trên VPS: `COPY 27` dòng
  (`/var/www/dhcb/backup-plans-2026-09-12.csv`). Số liệu thật: `vip=4 · pro=27 · free=6` (không
  có `plus`). Đã điền vào mục Nghiệm thu của `docs/specs/2026-09-12-gd1-xoa-goi-pro.md`.

- **[2026-09-06] Mời 5 người học thật (mỗi người một trụ: Anh · Lập trình · Career/Work ·
  Life · một người học chiều B), dùng 2 tuần.** Không cần công cụ ngoài: tab admin "Analytics"
  - "Sử dụng & chi phí" đã có DAU/WAU/MAU/returning và phễu. Ghi lại thứ họ dùng và thứ họ bỏ
    qua — đây là dữ liệu duy nhất quyết định được mảng nào đáng đi sâu. Xem "Tiếp theo" ưu tiên 1.

- **[2026-08-27] Đối chiếu bộ chạy Swift với `swift` THẬT — CHẶN chương trình M từ PR-M4.**
  Chạy trên máy có Xcode hoặc Swift toolchain:
  `npm run swift:conformance`
  Script sinh một file `.swift` gồm đúng 41 ca đối chiếu, chạy bằng `swift`, so từng ca với kết
  quả kỳ vọng **và** với output của bộ chạy DHCB, rồi in ca nào lệch. Xong thì đặt
  `daDoiChieu: true` cho các ca đã khớp trong
  `packages/subject-programming/swiftSim/conformance.ts`, ghi phiên bản `swift --version` vào
  `docs/research/dac-ta-bo-chay-swift-2026-08-27.md` mục 4, rồi commit.
  **Vì sao AI không tự làm được — đã thử lại 2026-09-03 và VẪN chặn:** `download.swift.org` trả
  mã 000 (không tới được), `github.com/swiftlang/swift/releases` trả 403. Khác Kotlin ở đúng
  điểm này: Kotlin tải được từ GitHub releases nên cổng đó đã tự mở (phần B mục 1).
  Hiến chương chương trình M §3.4 cấm suy đoán kết quả từ trí nhớ.
  **Hệ quả nếu bỏ qua:** PR-M4–M6 (nội dung Swift) không được bắt đầu — `conformance.test.ts`
  tự làm CI đỏ nếu có bài `language: 'swift'` khi ca còn chưa đối chiếu. Đây là **việc duy nhất
  còn lại của cả chương trình M** (11/12 PR đã xong).

- **Kế hoạch scale 50k concurrent (2026-07-25) — phần code/config/docs ĐÃ XONG (PR #321–#326),
  còn lại là việc hạ tầng thật cần người dùng tự làm:**
  1. **Mua thêm VPS** (khuyến nghị: tách Postgres/Redis ra 1 VPS riêng 6–8 vCPU trước tiên —
     xem runbook `docs/deploy-vps-ubuntu.md` mục "GĐ2"), sau đó thêm 2–3 VPS app khi k6 xác
     nhận cần (đo trước, đừng mua hết 1 lần).
  2. **Chạy `bash scripts/verify-pg-backup.sh`** trên VPS ít nhất 1 lần để xác nhận backup
     cron hiện có thật sự restore được (chưa từng kiểm chứng).
  3. **Cài k6 + chạy `npm run loadtest:k6`** (`BASE_URL=... VU_TARGET=... k6 run
scripts/load-test/k6-baseline.js`) nhắm staging/production — tăng dần VU_TARGET, KHÔNG
     nhảy thẳng lên 50k. Đây là bước đo THẬT còn thiếu — mọi con số vCPU trong kế hoạch hiện
     vẫn là ước lượng lý thuyết.
  4. Xem `docs/rollback-runbook.md` nếu có sự cố khi triển khai các bước trên.
  5. Xem `docs/research/ke-hoach-scale-30k-concurrent.md` (tên file cũ, nội dung đã cập nhật
     mục tiêu 50k) để biết đầy đủ bối cảnh/ngân sách/quyết định đã chốt.

- **Biến môi trường trên VPS — KHÔNG kiểm chứng được từ máy dựng** (phiên AI không đọc được
  `.env` của VPS; cả ba mục dưới đây đều "thiếu thì tính năng tự tắt", không làm vỡ app):
  - `GROQ_API_KEY` (hoặc `OPENAI_API_KEY`) — cần cho STT (`/api/stt`). Thiếu thì luyện nói rơi
    về Web Speech API dự phòng.
  - `ADMIN_EMAILS` — xác thực trang `/admin-settings` (`packages/core-auth/adminAuth.ts`).
    Thiếu thì không ai vào được trang quản trị. Mẫu ở `.env.example` dòng 207.
  - `AZURE_SPEECH_KEY`/`AZURE_SPEECH_REGION` — **TÙY CHỌN**, chỉ cần khi muốn bật chấm phát âm
    chi tiết qua Azure. Tạo resource "Speech service" (free tier F0, 5h audio/tháng) ở Azure
    Portal → Keys and Endpoint. Thiếu thì `/api/pronounce-assess` trả "chưa cấu hình" và client
    rơi về Giai đoạn 1 miễn phí.

### B. ĐÃ XONG — giữ lại kèm bằng chứng, đừng làm lại

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

## Quyết định quan trọng

- **[2026-09-05] 🔑 QUYẾT ĐỊNH QUAN TRỌNG — thêm Tầng 8b "NHÌN trang thật bằng ảnh chụp" vào
  `docs/framework/QUY-TRINH-AUDIT.md`, BẮT BUỘC với mọi đợt việc chạm giao diện** (người dùng
  chốt trong phiên, cùng PR `#863`; cập nhật chéo mục 2 `CLAUDE.md`).

  Căn cứ đo được, không phải phòng xa: chuỗi ba đợt trên tìm ra **bốn** lỗi lặp nội dung, **không
  lỗi nào** bị build/typecheck/lint/test/a11y bắt, và cả bốn chỉ lộ ra khi chụp ảnh trang rồi
  nhìn. Lý do chúng vô hình khi đọc mã: lỗi nằm ở **quan hệ giữa các chỗ cách xa nhau** (một
  `PageHeader` và một hero cách 40 dòng cùng in một câu) hoặc ở **con số chỉ tồn tại sau khi
  trình duyệt dựng xong** (trang cao 37.266px vì lưới dừng ở nấc `sm:`).

  Nội dung tầng: chụp `fullPage` ở **1440px và 390px**, **trước và sau** khi sửa, kèm 4 câu phải
  tự trả lời trên mỗi ảnh, công thức Playwright chạy được ngay, và 3 cái bẫy đã dính thật. Đặt là
  tầng phụ theo tiền lệ `1b`/`2b`/`5b`/`6b` nên tổng số tầng chính vẫn là 11.

  **Đánh đổi đã biết:** tầng này làm mọi đợt việc UI dài thêm một bước tay. Nếu sau vài đợt thấy
  tốn hơn lợi thì xem lại — ghi ở đây để lần sau có căn cứ đánh giá chứ không phải cãi từ trí nhớ.

- **[2026-09-03] Màu Tailwind cố định: GIỮ NGUYÊN, không token hoá ~4.100 chỗ — người dùng
  chốt.** Câu hỏi đặt ra sau PR #842: có nên đổi các họ màu Tailwind gốc (`amber` 763 ·
  `emerald` 700 · `rose` 480 · `sky` 328 · `indigo` 277…) sang token vai trò (`--info-*`,
  `--warn-*`…) để chúng tự đổi theo theme như `--z-*`/`--a-*` không? **Trả lời: KHÔNG.**
  Lý do: (a) đổi thì chạm >4.000 chỗ trong ~120 file với **rủi ro thị giác thật**, đổi lấy
  sự nhất quán về hình thức; (b) lý do an toàn — thứ duy nhất đáng đánh đổi rủi ro đó — **đã
  không còn**: 720 chỗ rớt tương phản đã vá xong ở PR #842, và cổng
  `scripts/fixed-color-contrast-audit.test.ts` nay đo MỌI màu cứng dùng làm màu chữ trên cả
  3 theme hiện hành mỗi lần `npm test`. Giữ nguyên là giữ cách viết quen thuộc mà vẫn không tái diễn
  loại lỗi vừa sửa.
  **Luật thi hành cho code mới:** dùng màu Tailwind cố định làm màu chữ thì phải kèm biến thể
  `theme-light:text-<họ>-800/900` NGAY TỪ ĐẦU; quên thì cổng trên đỏ và chỉ luôn cách vá.
  Đừng mở lại cuộc bàn này nếu không có dữ kiện mới.

- **[2026-09-03] "Giữ nguyên mọi thứ, thang bậc 5 và cover 90%" — người dùng chốt ba việc đang
  treo, KHÔNG đổi một dòng mã chạy nào.**
  1. **`Career.tsx` giữ CẢ HAI thước đo.** "Số năm kinh nghiệm" (trường hồ sơ, dòng 662) và
     thang 5 bậc thành thạo (per-kỹ-năng, dòng 534) đo hai cấp khác nhau nên bổ sung nhau. Mục
     nợ cũ mô tả chúng là "mâu thuẫn" — mô tả đó sai, đã đóng mục nợ kèm lý do.
  2. **Sàn coverage giữ nguyên 90%.** Biên độ 0,70 điểm được chấp nhận; không nâng ngưỡng,
     không viết test chỉ để đẩy số.
  3. **Không tự khởi động việc mới.** Hai việc còn mở (đối chiếu Nginx trên VPS, chạy
     `npm run swift:conformance` để mở cổng cứng cho track Swift) vẫn là **việc tay của người
     dùng** — AI không thay thế được vì cần SSH/toolchain thật.

- **[2026-08-04] Tự viết "bản đồ code" thay GitNexus.** `npm run codemap` — dùng TypeScript
  compiler API (đã có sẵn, KHÔNG thêm dependency) dựng đồ thị import + đồ thị lời gọi hàm, lưu
  `.codemap/graph.json` (gitignore, dựng lại được). Đo thật: 480 file · 1364 cạnh import · 4341
  cạnh lời gọi trong ~9 giây. Lệnh tra cứu: `impact` (sửa file này gãy chỗ nào), `callers` (ai gọi
  hàm này), `hotspots`, `cycles`, `orphans`. Logic thuần tách ở `scripts/lib/codemap.ts` (18 test).
  Phát hiện ngay khi chạy thử: 3 chu trình import trong `apps/english/src/data/` (cefr.ts ↔
  cefrAdvanced.ts, curriculum.ts ↔ cefrC1C2Vocab.ts, curriculum.ts ↔ cefrA1B2ExtraVocab.ts) —
  chưa gây lỗi nhưng nên gỡ, đã ghi vào "Nợ kỹ thuật còn mở".

- **[2026-08-04] Không cài `obra/superpowers` và `GitNexus` — chỉ dung hợp ý hay vào khung sẵn có.**
  Đã rà cả 14 skill của `obra/superpowers` (MIT). 10/14 skill (brainstorming, writing-plans,
  executing-plans, subagent-driven-development, dispatching-parallel-agents, using-git-worktrees,
  requesting/receiving-code-review, using-superpowers, writing-skills) **đã có tương đương** trong
  `docs/framework/KIEN-TRUC-DIEU-PHOI-3-TANG.md` — cài plugin sẽ tạo nguồn luật thứ hai song song
  với `CLAUDE.md`, dễ khiến agent hành xử không nhất quán. 4 skill còn thiếu đã được viết lại bằng
  tiếng Việt và nhúng thẳng vào khung: TDD RED-GREEN-REFACTOR + debug 5 bước (KHUNG 1, GĐ5),
  bằng chứng-trước-khi-báo-xong + hoàn tất nhánh an toàn (KHUNG 2, Phần A).
  **GitNexus bị loại** vì license PolyForm Noncommercial 1.0.0 xung đột với việc dự án đã thu phí
  Pro/VIP qua SePay — không đưa vào quy trình chính thức của repo.

- **[2026-07-31] Mở rộng thành nền tảng đa lĩnh vực — ĐÃ CHỐT.** Xem mục "Tiếp theo" ở trên +
  `docs/adr/0001-nen-tang-da-linh-vuc.md` (nguồn sự thật, đừng chép lại chi tiết ra đây kẻo lệch
  khi ADR được bổ sung sau này).

- **Bảng xếp hạng (LeagueSection trong `/challenge`) TẠM TẮT (2026-07-27).** Lý do: ở quy mô
  ít người dùng, bảng gần trống/chỉ vài người khiến người mới thấy app "vắng vẻ" và bỏ đi —
  phản tác dụng với mục tiêu giữ chân. Làm thành **cầu dao trong `app_settings`**
  (`leaderboardEnabled`, migration `0018_leaderboard_toggle.sql`) thay vì comment code, để admin
  tự bật lại qua `/admin-settings` KHÔNG cần deploy khi đủ đông người dùng hoạt động/tuần (đề
  xuất mốc tham khảo ~200). Component `LeagueSection.tsx` + `api/leaderboard.ts` giữ nguyên
  không xoá. Client đọc qua `isLeaderboardEnabled()` (`src/lib/appSettings.ts`), dùng ở
  `Challenge.tsx` giống cách `getLimits()` đã dùng (đọc trực tiếp lúc render, không qua context).
- **Challenge 30 ngày → nhập vào Giải đấu tuần (2026-07-15, quyết định người dùng).** Khi làm
  M5/M5b của `docs/research/dac-ta-nang-cap-su-pham-2026-07-15.md`: route `/challenge` thành
  trang Giải đấu tuần (redirect giữ link cũ), quay challenge = hoạt động ghi điểm (+15/ngày),
  bỏ khung 30 ngày chuyển chu kỳ tuần; dữ liệu `challenge_entries` + huy hiệu cũ giữ nguyên.
  **[Bổ sung 2026-07-15, làm cùng PR #7]** Người dùng yêu cầu "Challenge tính theo tuần luôn
  cho đồng bộ" (với mục tiêu tuần vừa làm) → phần "gọn challenge → chu kỳ tuần" (mục 16 bảng
  ưu tiên) ĐÃ LÀM NGAY, không đợi tới giải đấu (mục 14–15): bảng 7 ô Thứ 2→CN thay bảng 30 ô
  (dùng chung luật tuần `weekStartOf` của `lib/date.ts` với mục tiêu tuần), bỏ vé nghỉ/resume/
  restart/mốc 30 ngày, chủ đề xoay vòng theo tổng số bài đã nộp, tổng kết TUẦN vào Chủ nhật
  (so video đầu↔cuối tuần), ăn mừng "tuần trọn vẹn 7/7". Schema `challenge_entries` GIỮ NGUYÊN
  (cột `challenge_day`/`round` để nguyên — dữ liệu cũ không mất; prompt AI KHÔNG sửa để khỏi
  phải chạy lại eval). Phần bảng xếp hạng/điểm giải vẫn ở mục 14–15 như cũ.

- **Thanh toán Pro: KHÔNG làm (2026-07-11)** → **[Cập nhật 2026-07-24]** người dùng chủ động
  yêu cầu chuẩn bị TRƯỚC phần hạ tầng kỹ thuật (hạn dùng gói + cấp Pro thủ công qua admin —
  xem mục "Đã xong"), **CHƯA quyết định giá/cổng thanh toán/có siết hạn mức Free hay không**.
  App vẫn miễn phí như cũ, chưa có trang giá nào hiển thị cho người dùng thường. Việc còn lại
  khi quyết định thu phí thật: chọn cổng (khuyến nghị Casso/SePay — chỉ cần tài khoản ngân
  hàng cá nhân, KHÔNG cần hộ kinh doanh/MST như PayOS), chốt mức giá, trang `/upgrade` +
  webhook thanh toán thật gọi `admin-grant-plan` (hoặc endpoint tương đương) tự động thay vì
  admin gõ tay.
- **Giá gói ĐÃ CHỐT LẦN CUỐI (2026-07-27, thay bảng giá nháp cùng ngày):** Pro **20.000đ/10
  ngày · 40.000đ/tháng · 360.000đ/năm**; VIP **30.000đ/10 ngày · 75.000đ/tháng · 500.000đ/năm**.
  Đây là giá NIÊM YẾT — **dịp lễ/Tết sẽ giảm thêm**, mức và thời điểm quyết định sau từng đợt.
- **M2 Thanh toán Pro/VIP qua SePay: CODE ĐÃ XONG (2026-07-27)** — thay PayOS (PayOS đòi tư
  cách hộ kinh doanh/MST, SePay chỉ cần tài khoản ngân hàng cá nhân). **SePay KHÁC PayOS về bản
  chất:** không phải cổng trung gian, không giữ tiền, không có `checkoutUrl`, không redirect —
  chỉ theo dõi tài khoản ngân hàng và bắn webhook khi tiền về. Đã triển khai đúng mô hình đó:
  - **Schema:** migration `0014_plan_prices.sql` (bảng `plan_prices` — 3 chu kỳ `10day`/`month`/
    `year`, có `sale_price_vnd`/`sale_until` cho khuyến mãi dịp lễ sau này, ĐỘC LẬP với
    `promoUntil` sẵn có trong `app_settings` — trường đó là hạn mức lượt dùng, khác hẳn giá bán)
    · `0015_payments.sql` (bảng `payments`, UNIQUE `payment_code` + UNIQUE `provider_txn_id`
    chống trùng webhook ở TẦNG DB).
  - **Lib thuần (test kỹ, không đụng DB):** `api/_lib/prices.ts` (đọc giá + cache 30s + tính giá
    hiệu lực khi có khuyến mãi) · `api/_lib/sepay.ts` (sinh mã `ENVI` + 8 ký tự tránh nhầm
    0/O/1/I/L, dựng URL ảnh QR không gọi API ngoài, dò mã trong nội dung chuyển khoản không
    phân biệt hoa/thường, xác thực API Key bằng `timingSafeEqual`).
  - **API:** `GET /api/plan-prices` (công khai) · `POST /api/checkout` (tạo đơn, tự sinh mã, tự
    retry nếu trùng) · `POST /api/payment-webhook` (SePay gọi — chống trùng bằng
    `UPDATE ... WHERE status='pending'` + bắt lỗi `23505` cho ca hiếm hơn, kiểm tra đủ tiền mới
    cấp gói qua `grantPlanDays()` dùng chung, luôn trả `{"success":true}` khi đã xử lý xong để
    SePay không retry vô ích) · `GET /api/payment-status` (UI poll vì SePay không redirect) ·
    `GET /api/payment-history`.
  - **UI:** `UpgradeSection.tsx` trong `/profile` — chọn gói/chu kỳ → hiện QR + số tài khoản +
    nội dung chuyển khoản (nút sao chép) + đếm ngược 30 phút, tự poll tới khi `paid`. Ẩn hẳn nếu
    đã VIP.
  - **Test:** 40 test mới (unit thuần cho sepay/prices + handler-level cho 5 API), phủ đủ ca
    biên: sai khoá, tiền ra không liên quan, không khớp mã, thiếu tiền, webhook lặp, 2 webhook
    song song, UNIQUE violation, đúng số ngày theo từng chu kỳ.
  - **Còn lại là VIỆC TAY** (không phải code): đăng ký SePay + liên kết ngân hàng, điền
    `SEPAY_WEBHOOK_API_KEY`/`SEPAY_BANK_ACCOUNT`/`SEPAY_BANK_CODE` trên VPS, tạo webhook trỏ
    `/api/payment-webhook` + BẬT lọc tiền tố "ENVI", chạy `npm run migrate:pg` trước khi deploy,
    và nên chạy thử chuyển khoản thật số tiền nhỏ trước khi công bố rộng rãi.
  - Có đường xử lý tay cho ca người dùng gõ sai nội dung chuyển khoản (tiền vào nhưng không
    khớp đơn nào) — dùng `/api/admin-grant-plan` sẵn có, xem mục "Ca lệch" trong đặc tả.
  - Chi tiết đầy đủ: `docs/research/dac-ta-thanh-toan-2026-07-25.md`.
- **Đánh giá lại chi phí/hạn mức sau khi có giá bán thật (2026-07-27)** — phát hiện qua đọc
  code (không đoán): (1) `app_settings.promo_until` mặc định 2027-01-01 khiến `effectivePlan()`
  nâng MỌI gói lên 1 bậc — trong lúc bật, Pro/VIP nhận y hệt hạn mức + giọng, và Free được nâng
  lên hạn mức Pro. **Phải tắt khuyến mãi trong `/admin-settings` để giá bán mới có ý nghĩa.**
  (2) Giọng "Studio" ($24/1 triệu ký tự, KHÔNG có hạn mức miễn phí — đắt gấp 12 lần Chirp3-HD
  $2/1 triệu ký tự có 1 triệu miễn phí/tháng) đã **rút khỏi Pro, chỉ còn VIP**
  (`api/_lib/voiceAccess.ts`, `src/lib/voiceTiers.ts` — 2 nơi phải khớp tay, không share code
  api/↔src/). (3) Gói Free giới hạn còn 4 giọng (2 nữ Kore/Aoede + 2 nam Puck/Charon, đều đã
  seed sẵn nên phát ngay). Giá Google Cloud TTS xác nhận qua tài liệu thật, không suy đoán.
- **Hạn mức Pro/VIP đổi sang 1 số TỔNG lượt/ngày (2026-07-27, thay "5 số riêng theo chế độ")**
  — migration `0016_daily_total_limit.sql`: cột `app_settings.pro_daily_limit`/`vip_daily_limit`
  (mặc định Pro 30, VIP 300 — ĐÂY LÀ TỔNG, không nhân theo 5 chế độ) + hàm SQL
  `consume_usage_total` (SUM cả 5 cột `daily_usage` so với hạn mức, vẫn tăng đúng cột theo mode
  để giữ breakdown thống kê). Xoá 15 cột cũ (5 free đã CHẾT từ trước + 5 pro + 5 vip theo chế
  độ). `AdminLimitsPanel.tsx` viết lại: mỗi gói Pro/VIP chỉ còn 1 ô nhập, không còn hàng Free
  (Free không đọc `app_settings`, hiện ô đó chỉ gây hiểu nhầm).
- **Hạn mức Free đổi từ "tuần lịch" sang CỬA SỔ TRƯỢT 7 ngày liền kề thật (2026-07-27)** — quyết
  định chủ động để công bằng hơn với người học dồn cuối tuần (mô hình cũ 0012 reset cứng về 0
  mỗi thứ Hai, mất công tích luỹ nếu học nhiều vào thứ Bảy/Chủ nhật). Migration
  `0017_free_rolling_credit.sql`: bảng `free_daily_credit` (1 dòng/ngày/user, `bonus_earned` +
  `credits_spent`) + hàm `grant_daily_bonus_rolling`/`consume_rolling_credit`/
  `refund_rolling_credit` — "còn bao nhiêu lượt hôm nay" = tổng +5 nhận trong 7 ngày gần nhất
  trừ lượt đã dùng trong chính 7 ngày đó, trần tự nhiên vẫn 35 (không có cơ chế dồn bù ngày bỏ
  lỡ nên không cần cột cap riêng). `consume_rolling_credit` KHOÁ CÁC DÒNG trong cửa sổ bằng
  `SELECT ... FOR UPDATE` TRƯỚC rồi mới SUM (Postgres không cho `FOR UPDATE` cùng hàm gộp) —
  chống 2 request song song cùng đọc "còn lượt" rồi cùng trừ vượt quá số thật. Bảng
  `weekly_ai_credit` (0012) GIỮ NGUYÊN, không xoá — code đã ngừng đọc/ghi, dọn ở migration sau
  khi xác nhận mô hình mới chạy ổn trên production.
- **Giữ nguyên phiên bản:** Tailwind 3, React 18, TypeScript 5.x — không nâng. ESLint ĐÃ nâng
  8 → 9 flat config (`eslint.config.js`) ngày 2026-09-22, ADR 0011; đích là 9.x chứ không phải 10
  vì `eslint-plugin-jsx-a11y` chỉ khai peer tới `^9`.
- **Bundle-size budget (`size-limit`) thay Lighthouse CI** — Lighthouse không đo được trong môi
  trường sandbox/CI hiện có (`NO_FCP` ở mọi cấu hình). Cân nhắc lại nếu có runner thật sau này.
- **Zod validate input** đã rollout xong toàn bộ `api/*.ts` (đợt cuối `ai.ts`, dùng Zod v4).
- **Nhiều phiên làm việc có thể chạy song song** trên cùng repo — kiểm tra PR đang mở trên
  GitHub trước khi bắt đầu 1 kế hoạch lớn đã có sẵn trong `docs/research/`, tránh trùng công sức.
- **Gộp mọi script audio cache về 1 file `scripts/seed-all.ts` (2026-07-20, theo yêu cầu người
  dùng).** Trước đó có 3 script rời: `seed-all.ts` (seed nội dung), `sync-storage-to-r2.ts`
  (đẩy audio local → R2), `verify-r2-sync.ts` (đối chiếu R2 thật + xoá local an toàn). Đã gộp
  2 script sau vào `seed-all.ts` dưới dạng menu "s"/"v" (tương tác) hoặc cờ
  `--sync-r2`/`--verify-r2` (CI/cron) — xóa hẳn 2 file cũ + 2 dòng `package.json`
  (`sync:r2`/`verify:r2`). Không đổi logic bên trong (copy nguyên hàm, chỉ đổi tên biến/hàm
  tránh trùng namespace) — chưa tự chạy được trong sandbox này (không cài `node_modules`) nên
  CHỈ xác nhận bằng: không trùng định danh (grep), ngoặc cân bằng toàn file, và `prettier
--write` parse thành công không lỗi cú pháp. Cập nhật `docs/seed-guide.md` mục 5+7 +
  `docs/migration-thoat-ly-supabase.md` bước 7 theo lệnh mới. **Việc người dùng cần làm:** SSH
  VPS, `git pull`, thử `STORAGE_DRIVER=r2 npm run seed:all -- --sync-r2 --dry-run` xác nhận
  chạy đúng trước khi tin tưởng hoàn toàn (chưa test bằng máy thật).

- **Đợt tối ưu `scripts/seed-all.ts` — remap/verify/dọn orphan (2026-07-23→24, PR #308–#315,
  đã merge hết).** Từ thực tế chạy thật trên VPS (bảng `tts_cache` phình tới ~1,25 triệu dòng
  sau đợt mở rộng 14 giọng Chirp3-HD), phát hiện + sửa liền một mạch:
  - #308: `verifyDb()` từng coi câu pattern hợp lệ (đúng giọng/version, chỉ đơn giản ngoài
    top-N `seed-index.json`) là "orphan" → xoá nhầm cache còn dùng được; remap-only ("m")
    trước đó chỉ quét top-N nên cache giọng cũ của các câu ngoài top-N không bao giờ được
    remap. Sửa: bảo vệ hash pattern hợp lệ khỏi bị tính orphan + remap-only quét ĐỦ 100/100
    câu/chủ thể (remap không tốn API nên quét hết không sao) — seed thật (tốn phí) vẫn giữ
    nguyên top-N (mặc định 20/100, `TOP_N` khi chạy `npm run rank:patterns`).
  - #310: nhánh remap gọi `verifyDb()` quét lặp lại 2 lần tập hash pattern đầy đủ (~1,6
    triệu) → OOM. Thêm cờ `patternsAreFull` để bỏ bước quét dư thừa.
  - #311: log Postgres xác nhận VPS bị **restart ngoài ý muốn** (nghi cập nhật hệ điều hành
    tự động) giữa lúc script chạy hàng giờ → lỗi `57P01` làm crash toàn bộ tiến trình. Thêm
    `withDbRetry()` (backoff 1s/3s/8s) cho các vòng đọc/xoá dài.
  - #312: `cleanOrphans()` chạy im lặng suốt vòng xoá (có thể hàng trăm nghìn dòng) — thêm
    progress bar (`cli-progress`).
  - #313: vòng xoá orphan vốn TUẦN TỰ (1 dòng/lần, mỗi dòng 1 round-trip network) — đổi
    sang chạy song song có giới hạn (`DELETE_CONCURRENCY = 12`, khớp pool DB `max: 10`).
  - #314: `getR2Client()` tạo `S3Client` MỚI mỗi lần gọi (rò rỉ handle/socket) — cache lại 1
    instance dùng chung, sửa OOM khi xoá nhiều orphan liên tục.
  - #315: `fetchAllRows()` dùng LIMIT/OFFSET — mỗi trang phải quét & bỏ qua toàn bộ dòng
    trước đó (O(n²)), ở bảng >1 triệu dòng thành "treo" thật sự. Đổi sang **keyset
    pagination** (`where (khóa) > khóa_cuối`, dùng index). Đồng thời `verifyDb()` từng gom
    CẢ bảng `tts_cache` (kèm `audio_url`) vào 1 mảng trong RAM cùng lúc với nhiều Set lớn —
    đổi sang **stream từng trang** (`streamRows()`), bỏ hẳn mảng đầy đủ.
  - Kết quả người dùng xác nhận: hết treo, hết OOM, tốc độ xoá orphan "cải thiện rất nhanh".

## Sự cố hạ tầng đã xử lý (post-mortem ngắn)

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

## Nợ kỹ thuật còn mở

- 🟡 **[2026-09-22 — đợt React 19 + Tailwind 4, `docs/changelog/0415-*.md`] Sáu nợ sau đợt nâng
  framework.** (1) ✅ **ẢNH TẦNG 8B ĐÃ CHỤP VÀ ĐỐI CHIẾU — tìm ra một hồi quy CSS THẬT, đã vá
  (PR #1116).** So `main` (React 18/Tailwind 3/Vite 7) với nhánh nâng cấp trên 300 tổ hợp
  màn×trạng thái×theme×bề rộng: 153/300 ảnh lệch chiều cao 16–24px. Lượt điều tra đầu nghi do
  animation chưa đóng băng ở chính công cụ chụp (PR #1115 sửa, giả thuyết SAI — vá xong số liệu
  không đổi). Gốc thật: **Tailwind 4 đổi cơ chế `space-y-*`** từ gán `margin-top` cho con SAU con
  đầu (v3) sang gán `margin-block-end` cho MỌI con kể cả con đầu (v4); khuôn `<h1 sr-only>` (ẩn
  màn hình bằng `position:absolute`, dùng ở 54 trang) làm con đầu tiên khiến margin đó mất trắng
  vì nằm ngoài luồng → mất đúng một bậc `space-y-N` ở đỉnh trang. Vá bằng CSS toàn cục ở
  `apps/dhcb/src/index.css` (đặt ngoài mọi `@layer` để thắng cascade vô điều kiện), xác nhận lệch
  về đúng 0px trên 3 route thật, cổng a11y 289/289. Xem `docs/changelog/0416-*.md`.
  (2) ~~Vite 8 vẫn chặn~~ →
  **ĐÃ ĐÓNG ở đợt 0416**, xem bên dưới. (3) **Node 22 → 26 LTS** sau 2026-10-28. (4) **TypeScript 7
  KHÔNG THỂ nâng**: `@typescript-eslint/parser@8.70.1` khai `typescript: ">=4.8.4 <6.1.0"`, chờ
  typescript-eslint mở dải. (5) **ESLint 10** chờ `eslint-plugin-jsx-a11y` mở peer (nay `^9`).
  (6) **Đệm ngân sách mỏng hơn**: Initial JS nới 150 → 160 kB (React 19 +19,46 kB brotli, đã loại
  trừ nguyên nhân sai đóng gói), dùng 94,7%; CSS nới 20 → 26 kB (Tailwind 4 +5,61 kB), dùng 90,0%.
- 🟡 **[2026-09-22 — đợt nâng cấp major stack, `docs/changelog/0414-*.md`, ADR 0011] Ba nợ nâng
  cấp còn lại sau đợt này.** (1) ✅ **Vite 7 → 8 ĐÃ XONG ở đợt 0416** (`docs/changelog/0416-*.md`).
  Ba lo ngại ghi ở đây **đều sai**, ghi lại vì cả ba đều là bài học về "đọc log rồi đoán":
  nguyên nhân gãy KHÔNG ở rolldown mà là **một bare import `@dhcb/core-grading` vi phạm quy ước
  import của chính dự án** (rolldown kiểm `exports` nghiêm, Rollup thì dễ tính) — sửa một dòng ở
  `apps/dhcb/src/pages/learning/StemLessonView.tsx`; đường dẫn `.gz` "sai" chỉ là **lỗi in log**
  của plugin, file thật nằm đúng `dist/assets/*.gz`; và `manualChunks` **hoạt động đúng** dưới
  rolldown (chunk `vendor-sentry` "mất" chỉ vì container không có `VITE_SENTRY_DSN` nên nhánh chết
  bị xoá — đúng, không phải hồi quy). Thứ thật sự đổi: **không còn sinh file `.br`**, vô hại vì
  nginx chưa từng có `brotli_static`.
  (2) **Node 22 → 26 LTS: hoãn tới sau 2026-10-28** (v22 còn hỗ trợ đến 2027-04-30 nên không gấp;
  v24 rời Active LTS 2026-10-20 nên nâng lên 24 là nâng vào dòng sắp hạ cấp). Cần việc tay VPS.
  (3) ✅ **`.cjs` nay được lint thật (2026-09-26, `docs/changelog/0455-*.md`):** bỏ `**/*.cjs` khỏi
  `ignores`, khai `sourceType: 'commonjs'` (trước đó flat config parse `.cjs` như ES module).
  Hai file `commitlint.config.cjs`/`ecosystem.config.cjs` qua 127 luật; file thử có biến thừa bị bắt.
  (4) **ESLint 10:** chờ `eslint-plugin-jsx-a11y` mở peer (nay chỉ tới `^9`).
- ✅ **ĐÃ ĐÓNG [2026-09-22, xác nhận qua CI — `docs/changelog/0413-*.md`] Deploy VPS đỏ 5 lần
  liên tiếp vì hết heap Node lúc build (`FATAL ERROR ... JavaScript heap out of memory`),
  không liên quan nội dung PR.** Vá bằng `NODE_OPTIONS=--max-old-space-size=2560` cho bước
  build trong `scripts/deploy.sh` (PR #1110). **Xác nhận:** lần deploy đầu tiên sau khi PR
  merge — run #1061 (`e1db7a89`, workflow id 35696918341) — **xanh**, 06:53:43 → 06:57:35
  (~3 phút 52 giây, đúng thời lượng một deploy bình thường, không dấu hiệu tràn swap bất
  thường). Cũng đã sửa hai file changelog cùng đánh số `0411` (PR #1108/#1109 merge gần nhau
  không ai chạy lại `npm run changelog`) — đổi file của PR #1109 sang `0412`.
- 🟡 **[2026-09-22 — audit UI/UX sâu, `docs/audit/2026-09-22-danh-gia-sau-ui-ux.md` +
  `docs/changelog/0412-*.md`, PR đợt 0412] Đã xử lý 6 đợt A–F trong một PR.** Nợ còn lại: (1)
  ✅ `err.message` thô — ĐÃ ĐÓNG HẲN 2026-09-25 (`docs/changelog/0453-*.md`): 0433 bỏ sót khuôn
  `(err as Error).message` (27 điểm/14 panel admin + `feedbackApi`/`FeedbackModal` + lỗi giọng nói
  ở `Companion.tsx`), nay đã sửa; admin dùng `thongDiepLoiQuanTri` (giữ chi tiết lỗi server/Zod);
  cổng canh trong `friendlyError.test.ts` chặn khuôn này quay lại; (2) ✅ Phòng luyện tập vs
  Tiếng Anh home — ĐÃ GỘP (2026-09-24, PR #1157, `docs/changelog/0433-*.md`): chốt nhà từng tính
  năng, `/luyen-tap` gỡ kho học liệu trùng + rút 4 kỹ năng AI thành lối tắt, cao 3154→2461px ở
  390px; nút "N thẻ đến hạn" ở Tiếng Anh home nay mở tab ôn SRS của cấp đang học (trước trỏ
  `/luyen-tap`, trang không có ôn thẻ); (3) ~~ảnh
  Hồ sơ 1440px chụp `fullPage` luôn mờ~~ **ĐÃ ĐÓNG 2026-09-24 (`docs/changelog/0433-*.md`)**: lỗi của
  công cụ chụp chứ không phải của trang. `fullPage` cho trang thấy khung nhìn 1×1, `TwoPane` bị dựng
  lại và `fade-in` chạy lại giữa lúc chụp. Đã thay bằng `e2e/helpers/fullPageShot.ts`; (4) chưa chụp theme `kid` và các trang cần dữ liệu thật (bảng giá, huy hiệu, Kanban).
  **Kiểm lại 2026-09-22 (audit lần 2, `docs/audit/2026-09-22-danh-gia-toan-dien-ui-ux-lan-2.md`,
  `docs/changelog/0417-*.md`): 5/6 đợt có hiệu lực; (4) đã chụp `kid` (chỉ đổi màu). Nợ mới xếp
  P0: Luyện nghe 74.309px ở mobile (1.000 thẻ phẳng) và trang VIP mô tả bằng thuật ngữ + hứa
  Gemini Live chưa kiểm chứng; P1: Companion desktop ô nhập đè gợi ý, Nhiệm vụ báo "Đăng nhập" khi
  API lỗi, skeleton treo ở Hồ sơ. **ĐÃ SỬA HẾT 6 đợt G–M cùng ngày (`docs/changelog/0419-*.md`,
  6 commit, cùng PR)** — Luyện nghe 74.309 → 2.159px, Truyện 17.456 → 2.009px, VIP nói bằng lợi
  ích. **Đợt 0433 (2026-09-24, `docs/changelog/0433-*.md`) trả xong 2 nợ nhỏ:** (1) 8 chỗ
  `err.message` thô còn sót (`LiveMap.tsx` + 6 panel admin, ~11 điểm) nay qua `thongDiepLoiThanThien`;
  (5) thuật ngữ sót ở `EdgeAiIndicator` ("GPU Adapter" → "Phần cứng xử lý", `inferenceMode` thô →
  câu tiếng Việt) và `MemoryPalaceCard` (gộp badge "Platform V5 Method of Loci" thành "Ghi nhớ
  bằng không gian") — `CyberTutorAvatar3D` hoá ra đã dọn sạch từ trước. Còn mở: P2-5 theme `kid`
  chỉ đổi màu (câu hỏi sản phẩm); Phòng luyện tập vs Tiếng Anh home vẫn nhiều lối vào cùng đích;
  ~~"Đọc tiếp" ở Truyện~~ ĐÃ LÀM 2026-09-24 (`docs/changelog/0433-*.md`, PR #1158 — lưu đoạn
  đang đọc ở localStorage, chưa đồng bộ đa thiết bị).
  ~~`e2e/home-clarity-evidence.spec.ts` đỏ ngẫu nhiên ~1/3 lượt ở ca CLS 0,103~~ **ĐÃ SỬA
  2026-09-24 (PR #1159, `docs/changelog/0433-2026-09-24-home-comeback-reserve-cls-flaky.md`)**:
  không phải nhiễu đo — sàn comeback mobile của `HomeAiBriefingCard` thiếu chỗ (2 nút icon làm chữ
  xuống 3 dòng); CLS dưới tải 0,056–0,090 → 0,022–0,026, 30/30 xanh, ngưỡng 0,1 giữ nguyên.**
- 🟡 **[2026-09-22 — audit câu chữ toàn dự án + trả nợ, `docs/changelog/0406-*.md` · `0408-*.md`
  · `0409-*.md` · `0410-*.md`, PR #1102 · #1105 · #1106 · PR đợt 0410] Nợ còn lại:** chỉ còn
  **58 câu mẫu viết tay nằm trong hồ `pool`** của `cefrCircleSentences.json` — chưa gán được vòng
  nào, nhưng KHÔNG mất: mỗi lần sinh lại vòng script lấy hồ ra thử trước khi viết câu mới. Ngoài
  ra nội dung học vẫn chưa có người có chuyên môn sư phạm đọc lại (ngoài tầm mọi cổng máy).
  **ĐÃ TRẢ (0410) — ba nợ của 0409 đóng hết:** mốc thứ ba của sàn bậc theo tần suất (hạng ≥ 30 000
  → C1, 128 mục B2 lên C1, ngoại lệ có tên `app::n`/`downloads::n`); **bất biến thứ tư của thang
  bậc** — dạng chia không được đứng như từ riêng, quét theo `forms` (`findUnlinkedInflections`:
  42 mục → 30 nối `base`, 12 mục từ vựng hoá vào `LEXICALIZED_FORM_ALLOWLIST`); hồ `pool` cho câu
  mẫu + **cứu lại 40 câu 0409 đã bỏ**, vòng sinh lại 673 → 671 (95 câu gán lại, 12 câu viết tay,
  0 vòng thiếu). **ĐÃ TRẢ (0408 + 0409):** bộ sinh `forms` (55 mục +
  `grandchildren`), cổng `dictionaryForms.test.ts`; **bất biến thứ ba của thang bậc** — nhãn không
  có nguồn CEFR-J/Octanove phải tôn trọng sàn theo hạng tần suất (`UNSOURCED_LEVEL_FLOORS`, 306
  mục nâng bậc, 12 dạng chia nối `base`), vòng sinh lại 676 → 673, câu mẫu gán lại bằng
  `reassign-circle-sentences.ts` (208 cứu + 31 viết tay) → **pipeline vòng từ vựng có quy trình
  rõ** (CLAUDE.md §8); `pre` xoá; `lessons.json` 109 viết lại nửa sau; `ft-emperor-clothes` → B2;
  `my-perseus-4` chú thích người dịch; `gen-stem-lesson-index` tự Prettier; `stemCurriculum`
  phân cách nghìn; Tầng 8b tab Đại học đã nhìn (5 chương hiện, bỏ tiền tố "Chương N:" trùng số).
  Cổng CI `npm run audit:prose -- --ci` (job `audit`).
- 🟡 **[2026-09-21 — PR #1099, `docs/changelog/0405-*.md`] Hoạt ảnh mô phỏng bài học — GĐ0+GĐ1
  xong, GĐ2 (nhân rộng) CHƯA quyết.** Hạ tầng `LessonAnimationSchema` xác nhận đủ dùng, mở rộng
  sang môn Lập trình, 5 animation thí điểm (4 mới + 1 sửa lỗi hình học có sẵn) đã qua Zod +
  typecheck + lint + test toàn repo. **GĐ2 bước 1 xong (2026-09-22, `docs/changelog/0406-*.md`):**
  animation Lập trình đã có nơi hiển thị (`ProgrammingSpecStagePage` → từng `ModuleBlock`), có cổng
  Zod + cổng trang, đã chụp Tầng 8b 1440/390 × 2 theme cho `algo-s1-m1`. **GĐ2 bước 2 xong
  (2026-09-22, `docs/changelog/0407-*.md`):** 10 hoạt ảnh mới cho `algo-s1`…`algo-s3` (11/12
  module có hoạt ảnh) + **phát hiện và sửa renderer: hoạt ảnh CHƯA TỪNG CHẠY ở cả 5 môn** (hai lỗi
  CSS, `TRAPS.md` mục 10), kiểm bằng 55 khung hình theo thời gian. **Rà mắt Toán xong
  (2026-09-22, `docs/changelog/0408-*.md`):** 34/34 hoạt ảnh Toán soi 5 mốc thời gian bằng
  `npm run shots:lesson-anim`, sửa 17 hoạt ảnh (4 sai nội dung, 13 nhãn đè/cắt/chồng lớp), soi lại đủ.
  **Rà mắt Vật lí xong (2026-09-26, `docs/changelog/0457-*.md`):** 73/73 hoạt ảnh soi 5 mốc +
  máy kiểm hình học mới trong `shots:lesson-anim`; sửa 58 (khoảng 20 sai KIẾN THỨC, có
  chiều đường sức quanh dây thẳng bị đảo) + 3 lỗi renderer (`closed` thiếu cạnh khép ở 19 hình
  cả 4 môn, thêm `origin` cho xoay/co, bỏ halo chữ trên nền màu). **Rà mắt Hoá xong (2026-09-26,
  `docs/changelog/0459-*.md`):** 56/56 soi 5 mốc, sửa 54 (khoảng 25 sai KIẾN THỨC, có SO₄²⁻ "bị oxi
  hoá ở anode" trong cả lí thuyết bài điện phân) + bộ vẽ đọc mốc đúng ý người soạn (`giaiMoc`: giữ
  giá trị mốc trước, giữ trạng thái đầu/cuối — 40 hoạt ảnh ở 4 môn từng chạy sai) + `scaleX/scaleY`.
  **Còn thiếu:** rà mắt Sinh (64) hoạt ảnh — PR kế tiếp; cấu trúc animation cho môn Anh (chưa thiết
  kế).
  Đặc tả: `docs/specs/2026-09-21-hoat-anh-mo-phong-bai-hoc.md`.
- ✅ **[2026-09-20 — PR #1061 → ĐÓNG 2026-09-25, `docs/changelog/0447-*.md`] Ảnh Tầng 8b cho sửa
  tương phản CompanionVoice đã chụp và xem bằng mắt.** Ảnh 390/1440 × blue-sky/dark-blue × 3 studio
  cho thấy: trước sửa, 3 thẻ nền tối có chữ gần như không đọc được; sau sửa, chữ đọc được. Quét axe
  cùng lúc lộ ra **14 vi phạm AA khác** ở 5 studio, mà cổng AA chưa quét → mở S06c (Approved,
  sửa ở PR kế tiếp).
- ✅ **[2026-09-20 — Đợt 4 theo dõi audit 0380 — ĐÃ ĐÓNG 2 việc, còn 1 việc cần backend thật]**
  Chủ dự án đã chốt việc 1 và 2 (`docs/changelog/0380-*.md`):
  1. Gỡ `ComingSoonBanner` khỏi `/luyen-noi` (`Speaking.tsx`) — tính năng đã chạy thật trên
     production (TTS/STT thật), banner "Sắp ra mắt" từ quyết định 2026-08-09 nay gây hiểu lầm.
  2. Sửa gốc rễ toast "Đã đồng bộ dữ liệu học tập thành công!" bắn lại mỗi lần điều hướng trang:
     `applyCloudProgress()` trong `apps/dhcb/src/lib/progressSync.ts` gọi `enqueueSync(userId,
'english')` **VÔ ĐIỀU KIỆN** sau mỗi lượt kéo (`pullProgress`), dù bản hợp nhất không có gì
     mới ngoài bản cloud vừa nhận — mỗi trang dùng `useCloudSync` (Home/Dashboard/Profile/
     History/EnglishHome/Speaking/Writing/Chat) mount lại là kéo + đẩy lại y nguyên, khiến hàng
     đợi luôn có đúng 1 mục rồi gửi ngay → `OfflineSyncIndicator.tsx` thấy "chờ → 0" mỗi lần và
     bắn banner. Sửa: chỉ `enqueueSync` khi hợp nhất THẬT SỰ có gì mới so với bản cloud (local có
     mục cloud chưa có, SRS/exam/settings đổi nội dung, hoặc local thắng theo mốc thời gian ở
     placement/weeklyGoal/settings). Test canh ở `progressSync.test.ts`.
  3. **CÒN MỞ** — vài màn báo lỗi tải dữ liệu (trang chủ, hồ sơ, `/su-nghiep-khoi-nghiep`,
     `/cong-viec-cuoc-song`) thấy trong ảnh chụp audit: môi trường phiên làm việc này KHÔNG có
     `DATABASE_URL`/backend Postgres thật (đã kiểm — biến rỗng), nên KHÔNG thể tự xác nhận đây là
     lỗi thật hay chỉ do môi trường audit thiếu backend. Cần chủ dự án hoặc phiên có backend thật
     kiểm lại các trang trên trước khi kết luận có phải bug production hay không.
- ✅ **[2026-09-16 → 2026-09-19 — `apps/hub/src` nằm NGOÀI cổng tương phản tĩnh — ĐÃ ĐÓNG]** (`docs/changelog/0373-*.md`). Tiền đề của nợ cũ (hub "không cùng hệ token") **sai**: hub đã có `ThemeToggle` (`App.tsx`/`HubLogin.tsx`) và `apps/hub/tailwind.config.js` map `zinc`/`accent` sang ĐÚNG biến `--z-*`/`--a-*` của `packages/core-ui/theme.css` — cùng hệ token với `@dhcb/app`. Gỡ bằng cách thêm `apps/hub/src` vào phạm vi quét của `scripts/fixed-color-contrast-audit.ts` (không tạo script riêng); vá 5 chỗ rớt AA tìm được (`theme-light:text-<màu>-800/900`, đúng cách vá đã dùng ~720 lần); ~60 chỗ `text-zinc-*` còn lại đã tự đạt AA (chỉ dùng bậc sáng). Hub vẫn chưa có ca nào trong `e2e/a11y.spec.ts` — nợ nhỏ khác, chưa mở vé riêng.
- ✅ **[2026-09-16 → 2026-09-17 — S13-1 → S13-2] Hai nợ giao diện do cổng mới ĐO ĐƯỢC — ĐÃ ĐÓNG** (`docs/changelog/0358-*.md`, PR S13-2):
  1. `aria-prohibited-attr` (serious) trên Trang chủ ở trạng thái ĐANG TẢI: `TodayCard.tsx` nay có `role="status"`; khối `NO_AA` của `e2e/learning-ux-states.spec.ts` đã **xoá hẳn** — cổng chạy ở mức tuyệt đối, 0 vi phạm AA.
  2. Đoạn văn quá dài ở ≥ 768px: **126 → 3** vi phạm trên toàn bộ 10 ô (today 10→1 · outline 8→0 · lesson 12→0 · result 27→0 · progress 8→1 · tutor 2→1, 768/1440). Cách sửa: bó khoảng đọc `.read-measure` (hiệu chuẩn 66ch → 63ch, đo được 83 → 79 ký tự/dòng) lên đúng những đoạn chữ để đọc. Bảng `BASELINE_KY_TU` đã về **rỗng**.
- ✅ **[2026-09-17 → XÁC NHẬN ĐÃ ĐÓNG 2026-09-20] Initial JS — mô tả "vượt mốc cảnh báo, trần
  140kB" ĐÃ LỖI THỜI, không cần tách chunk.** Cùng ngày 2026-09-17 (sau thời điểm ghi nợ này),
  đặc tả `docs/specs/...thiet-ke-lai-trang-chu.md`/`docs/changelog/0360-*.md` (PR #1000) đã
  **NỚI TRẦN CÓ CHỦ ĐÍCH 140 → 150 kB** để có chỗ cho các lát P0 của trang chủ mới — quyết định
  của chủ dự án, đúng luật "nới ngân sách không phải việc của agent". Đo lại 2026-09-20
  (`npm run budget`, build sạch): **Initial JS 137,54 / 150 kB = 91,7%** — dưới mốc cảnh báo
  95%, dư 12,46 kB. Không còn là nợ mở; không tách chunk vì không cần thiết ở mức dùng hiện tại.
- ✅ **[2026-09-17 → ĐÃ ĐÓNG 2026-09-20, `docs/changelog/0358-*.md` + `docs/changelog/0385-*.md`] Coverage branch — ĐÃ ĐẠT "≥ 1 điểm" mà AC-10 đòi.** Thêm test ca biên cho nhánh chưa phủ:
  `listChemAdvancedLessons`/`listChemLessonsByChapter` (`packages/subject-chemistry/lessons.ts`,
  trước đây 0 test) và các nhánh rỗng/thẻ SCRIPT/CSS rỗng của `htmlPrelude.ts`
  (`packages/subject-programming`). Đo sau khi thêm (`npm run test:coverage` sạch, checkout mới):
  **Branches 90,01% (16175/17969) — dư 1,01 điểm so với sàn 89.** Không hạ sàn, không nới ngưỡng.
- 🟡 **[2026-09-17 — S13-2] AC-8 (ma trận thị giác 6 màn × 5 trục) CHƯA CHẤM:** spec S13 §7 Q6 cấm agent vừa làm vừa chấm — điểm cuối là của chủ dự án. 18 ảnh bắt buộc chụp sẵn bằng `npm run shots:learning-ux`. **Gỡ:** chủ dự án chấm 30 ô kèm một câu lý do/ô; ô < 4 thành mục việc. Goal `learning-ux` KHÔNG được kết luận COMPLETE trước đó.
- ✅ **[2026-09-15 → ĐÃ ĐÓNG 2026-09-20, `docs/changelog/0384-*.md`] Hai tài liệu được CLAUDE.md và mã dẫn tới nhưng KHÔNG tồn tại trong repo — KHÔI PHỤC LẠI.** Cả hai từng bị GỘP vào tài
  liệu tổng hợp khác trong một đợt dọn tài liệu (đúng khuôn lỗi đã gặp ở Đợt 1 audit UI/UX
  2026-09-19: nội dung còn nguyên trong bản gộp, chỉ đường dẫn gốc bị gãy). `docs/research/eval-tutor-baseline.md`
  (CLAUDE.md §8 + `scripts/eval-tutor.ts:53`) khôi phục nguyên văn từ `dinh-huong-va-ke-hoach-chung.md`
  mục [6]; `docs/research/cai-tien-lo-trinh-hoc.md` (`storage.ts:241`) khôi phục nguyên văn từ
  `phuong-phap-va-su-pham.md` mục [1]. `npm run check:specs` xanh. Cũng sửa: CLAUDE.md §13 ghi sai
  sàn coverage `97/93/96/97` — số thật theo `vitest.config.ts` là `93/89/93/93`, đã sửa.
- ✅ **[2026-09-15 → 2026-09-16 — S09] Mất tiến độ Lập trình khi offline — ĐÃ ĐÓNG:** nền server xong ở S09-1 (`docs/changelog/0334-*.md`, PR #940: migration `0083`, `version`/`client_updated_at`, `public.sync_receipts`, `sync.attemptId`/batch); hàng đợi client xong ở **S09-2** (`docs/changelog/0353-*.md`, PR #984): `apps/dhcb/src/lib/syncOutbox.ts` gửi lại theo chủ sở hữu (debounce · gộp · backoff · Web Locks · 401), `fetchProgress` phủ mục còn chờ lên bản server, `offlineStore.ts` (hàng đợi giả) đã xoá. Ba lỗi F1/F4/F5 hết. **Còn lại:** S09-3 (`ConflictRecord` + hộp thoại hỏi người học) vẫn BLOCKED chờ S08 quyết đẩy nháp lên server.
- ✅ **[2026-09-15 → đóng hoàn toàn 2026-09-19, `docs/changelog/0376-2026-09-19-sua-f6-f8-progress-merge.md`] Ba lỗi merge tinh tế ghi nợ ở S09-1 — ĐÃ SỬA CẢ BA (F7/F6/F8).** F7 (`mergeSrsMap` hoà `reps`) sửa ở đợt trước. F6 (`hard` ghi đè theo thứ tự ĐẾN của request) và F8 (`mergeByTimestamp` cho `placement`/`weeklyGoal` lệch đồng hồ 2 thiết bị) sửa ở đợt này theo quyết định đã chốt của chủ dự án: `resolveHard()` mới ở `progressMerge.ts` so `client_updated_at` (migration `0083`) của bản đã lưu với request hiện tại, bỏ qua thay đổi `hard` nếu request cũ hơn; `mergeByTimestamp()` nhận thêm tham số tuỳ chọn `clientClock` dùng `client_updated_at` của CẢ REQUEST (một trục nhất quán, thay vì mốc `lastAt`/`updatedAt` tự ghi rải rác từng object) làm tiêu chí chính, field nội bộ vẫn giữ để tie-break phụ. Cột `version` (S09-1) là version của CẢ DÒNG, không tách theo field — không đủ để làm trọng tài riêng cho `placement`/`weeklyGoal` (đã ghi rõ lý do đổi phương án so với đề xuất ban đầu trong changelog trên).
- ✅ **[2026-09-15 → ĐÃ ĐÓNG 2026-09-19 — khảo sát S12] `learningReadModelService.ts` select cột `stats`/`settings` không tồn tại trong `english.learning_progress` — ĐÃ SỬA theo ADR-0005 (Accepted).** Service nay chỉ SELECT cột thật (`learned, srs, placement, updated_at`); `masteredCount` tính từ `learned` (tự báo cáo), `inProgressCount`/`dueForReviewCount`/`srsDueCount` tính từ `srs` theo server time (`Date.now()`), `recentEvidenceCount` đổi sang nullable và trả `null` cho subject không có nguồn evidence thật (`english` hiện tại). Test canh `learningReadModelService.schemaGuard.test.ts` đã bỏ `describe.skip`, chạy XANH THẬT. Xem `docs/changelog/0375-2026-09-19-sua-learning-read-model-adr-0005.md`.
- ✅ **[2026-09-15 — ĐÃ TRẢ, xem `docs/changelog/0334-2026-09-15-on-dinh-test-python3.md`] `packages/subject-programming/lessonsPython.test.ts` (ca `p5-s2`) flaky dưới tải toàn suite.** Nguyên nhân thật KHÔNG phải `timeout: 15_000` của `execFileSync` mà là: hằng số `PYTHON_TEST_TIMEOUT_MS = 30_000` chỉ được truyền cho 2 trong 4 khối `it.each` sinh tiến trình `python3`; hai khối còn lại (Predict, milestone check — nơi `p5-s2` nằm) vẫn dùng mặc định 5s của Vitest. Đo lúc máy rảnh: ca chậm nhất của khối CÓ timeout là `p5-u6-l1` 1.866ms (dư 16×), ca chậm nhất của khối KHÔNG có timeout là `p5-s2` 1.604ms (dư 3,1×) — dưới tải song song thì 3,1× không đủ. Đã truyền hằng số cho cả bốn khối, không skip/giảm ca nào. Mục `programmingSrs.test.ts` (2026-09-14) ở cuối file là nợ KHÁC họ (phụ thuộc `vi.setSystemTime`), vẫn còn mở.
- ✅ **[2026-09-15 → ĐÓNG HOÀN TOÀN 2026-09-19, ADR-0007 Accepted] Bài Lập trình bậc P1–P4 (Python) nay được CHẤM LẠI Ở SERVER trước khi ghi `status:'completed'`, cả 3 lớp bảo vệ đều BẬT THẬT trên production.** `packages/subject-programming/completionSandboxServer.ts` chạy code học viên bằng `python3` thật trong tiến trình con (đúng `grading.ts`/`pyLanes.ts` mà cổng nội dung `lessonsPython.test.ts` dùng), đọc test-case từ registry SERVER (không tin dữ liệu client gửi). 3 lớp bảo vệ: (1) allowlist chặn import module hệ thống/mạng; (2) chạy dưới user hệ thống riêng `dhcb-sandbox` — đã chạy `scripts/setup-programming-sandbox-user.sh` + cấu hình `PROGRAMMING_SANDBOX_USER=dhcb-sandbox` + `pm2 restart --update-env` trên VPS thật 2026-09-19, xác nhận `pm2 logs` không có cảnh báo "không tra được uid/gid"; (3) giới hạn CPU/bộ nhớ/tiến trình (`ulimit`) + timeout 10s khớp client, diệt CẢ CÂY tiến trình qua `timeout(1)` (sửa ở PR sau khi phát hiện `execFileSync`'s timeout không lan xuống cháu tiến trình qua `sudo`). Cô lập mạng tầng phụ (`unshare --net`) VPS này CŨNG hỗ trợ — xác nhận qua script (không còn là nợ mở, xem lịch sử ADR-0007 Quyết định 2 đã đóng). `apps/server/src/api/subjects/programming/progress.ts` đòi kèm `code` khi báo 'completed' bài thuộc phạm vi này, từ chối (400) nếu chấm lại không đạt, rate-limit 5 lần nộp sai/phút/bài chống spam CPU. Bước dự án (`p<n>-s<x>`) và bài P5/P6 + 14 hướng chuyên sâu KHÔNG thuộc phạm vi ADR-0007 — xem dòng nợ hẹp bên dưới.
- ✅ **[2026-09-19 → ĐÓNG HOÀN TOÀN 2026-09-20 — ADR-0007 Quyết định 4; ADR-0008 Accepted] 509/509 bài Lập trình (100%) nay được CHẤM LẠI Ở SERVER, không còn bài nào "client tự khai".**
  `docs/adr/0008-cham-lai-server-lap-trinh-ngoai-p1-p4.md` (Accepted, cả 3 câu hỏi đã thi hành).
  B1+B2 (374 bài, `docs/changelog/0382-*.md`) + B3 (97 bài JS/TS/`html`/`dom`/`fetch`,
  `docs/changelog/0384-2026-09-20-adr-0008-b3-js-ts-dom-fetch.md`) đã đóng trước. **Đợt này đóng
  nốt câu hỏi 3 — SQL (5 bài, `docs/changelog/0387-*.md`):** xác minh THẬT trên `sql.js` (không
  đoán): `load_extension()` không tồn tại trong bản dựng đang dùng (ném "no such function");
  `ATTACH DATABASE '<đường dẫn>' AS x` không chạm hệ thống file thật (bản WASM không có VFS bền —
  kiểm bằng thực nghiệm: ghi bảng vào CSDL đã ATTACH rồi `existsSync()` đường dẫn, không tồn
  tại). Kết luận: an toàn chấm-lại-ở-server cùng mức tin cậy với lúc chạy trong Worker trình
  duyệt. Thêm `regradeSqlSubmission()` trong `completionSandboxServer.ts` (nạp `sql.js` lười,
  dùng lại `SQL_SEED`/`formatSqlResults` — đúng engine `sqlWorker.ts`/`lessonsSql.test.ts`).
  `regradeSubmission()` vẫn là dispatcher duy nhất. Test canh gồm ca xác minh ATTACH DATABASE
  không tạo file thật trên server. Bước dự án `p<n>-s<x>` + tiêu chí hướng chuyên sâu vẫn NGOÀI
  phạm vi ADR-0008 (câu hỏi 2 chốt KHÔNG mở rộng — chấm bằng rubric/artifact, khác bài toán này).
- 🟡 **[2026-09-15 — S11-1] Hội thoại CEFR đánh dấu "đã xem" (`markDialogueViewed`) chứ không phải "đã học".** Mục lục phải ghi đúng nhãn `english.cefrDialogue` = đã xem; cần một dạng evidence thật (nói lại/trả lời câu hỏi) ở slice môn Anh sau này.

> Mục này CHỈ giữ nợ **đang mở** (🟡/🔴). Nợ đã đóng (🟢) được dời sang
> `docs/legacy/no-ky-thuat-da-dong.md` (2026-09-01) để file này chỉ nói trạng thái hiện tại —
> đúng vai trò ở mục 2 `CLAUDE.md`. Đóng một món nợ = cắt khối đó dán sang file kia, kèm ngày.

- **[2026-09-15 — slice 02 Góc học tập, xem `docs/changelog/0326-*.md`, Q3 chủ dự án uỷ quyền]
  🟡 Dữ liệu học đã lỡ ghi ở origin `hoc-tap.donghanhcungban.org` KHÔNG được migrate.** Nguyên
  nhân: trước slice 02, nút "Vào …" ở danh mục trên host Góc học tập `navigate()` tại chỗ nên
  Tiếng Anh/Lập trình chạy ở origin `hoc-tap.` với `localStorage` riêng (người đã đăng nhập thành
  khách, tiến độ 0). Nguồn lỗi đã bịt; phần đã ghi ở origin đó vẫn nằm đấy, không ai đọc lại.
  Không migrate vì: không nhận diện được đáng tin, spec cha cấm chuyển dữ liệu qua
  query/postMessage, tập người ảnh hưởng nhỏ (chưa có phản ánh). **Cách đo nếu có phản ánh:**
  mở DevTools trên `hoc-tap.` → Application → Local Storage, đếm khoá `et_learned_*`/`dhcb_*`;
  nếu có, hướng dẫn người dùng "Đăng nhập lại ở www" — tiến độ trên server (đã đồng bộ trước đó)
  không mất. **[2026-09-20] NGUỒN LỖI ĐÃ CHẶN VĨNH VIỄN:** cơ chế đa host bị xoá khỏi mã
  (`docs/changelog/0383-*.md`), mọi môn dùng `/goc-hoc-tap/<mã môn>` trên MỘT host — không còn
  origin thứ hai để ghi nhầm. Nợ vẫn 🟡 vì phần dữ liệu ĐÃ ghi ở origin cũ chưa được dọn/chuyển.
  Đóng nợ sau 60 ngày không phản ánh, hoặc khi `hoc-tap.` bị gỡ khỏi `server_name` của nginx.
- ✅ **[2026-09-14 — ĐÃ TRẢ 2026-09-16, xem changelog trả nợ flaky] Test flaky có sẵn của môn
  Lập trình đã sửa.** Nguyên nhân thật KHÔNG phải `vi.setSystemTime` mà là ca "limit cắt đúng số
  thẻ cho một phiên ôn" nạp cả 381 bài (~1184 thẻ) vào SRS — `addLessonCardsToSrs()` gọi `save()`
  (stringify + ghi localStorage toàn bộ) cho MỖI thẻ nên đó là O(n²), đo thật ~1,7s trên máy rảnh,
  vượt ngưỡng 5s dưới tải full suite. Sửa cho nhanh (chỉ nạp đủ bài để vượt limit) thay vì nới
  ngưỡng. Cùng đợt: nới timeout 4 describe bcrypt thật (12 vòng) ở `packages/core-auth/authService.test.ts`
  — cùng khuôn lỗi, phát hiện khi chạy full suite (S05-2). Xem `TRAPS.md` mục khuôn lỗi timeout
  5s dưới tải.
- ✅ **[2026-09-12 → ĐÃ SIẾT 2026-09-19, xem `docs/changelog/0291-*.md` +
  `docs/changelog/0376-*.md`] Khoá bậc môn Lập trình — phần NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP nay siết ở
  SERVER.** Trước đây luật "Free học tuần tự P1→P6" chỉ tính ở trình duyệt
  (`lib/programmingLevelLock.ts`); người sửa localStorage/gõ thẳng URL vẫn GHI ĐƯỢC tiến độ bậc
  chưa mở. Từ 2026-09-19, `api/subjects/programming/progress.ts` tự kiểm lại bằng cùng hàm THUẦN
  `computeLevelLockMap` (`packages/subject-programming/levelLockServer.ts`) trước khi upsert:
  bài xương sống thuộc bậc chưa mở → 403, KHÔNG ghi DB. GRANDFATHER suy TỪ DỮ LIỆU SERVER sẵn có
  (bất kỳ dòng `lesson_progress` nào ở một bậc, bất kể status, tức là đã từng vào bậc đó) — không
  cần migration/cột mới, không khoá oan người dùng cũ. **Vẫn CỐ Ý không khoá nội dung bài học**
  (đọc bài không phải bí mật) — chỉ chặn ghi tiến độ.
  **[Cập nhật 2026-09-15 — chế độ Khách, `docs/changelog/0317-*.md`, KHÔNG đổi]** Khách vãng lai
  (chưa đăng nhập) vẫn không có hàng trên server nên luật khoá của họ vẫn tính HOÀN TOÀN ở
  client, theo tiến độ localStorage — quyết định riêng ở
  `docs/specs/2026-09-15-mo-xem-web-khong-can-dang-nhap.md`, không đổi bởi đợt siết này (khách
  không có điểm/tiền/xếp hạng gắn với danh tính nên không lấy được gì khi tự mở khoá; lượt AI
  thì server vẫn đếm theo `X-Guest-Id` + IP).

- ✅ **[2026-09-12 → xác minh lại 2026-09-19, xem `docs/changelog/0289-*.md` +
  `docs/changelog/NNNN-2026-09-19-*.md`] Kho lượt cửa sổ trượt 7 ngày — mô tả "MỒ CÔI" ban đầu là
  SAI, đã đóng nợ chính.** GĐ1 bỏ `consume_rolling_credit`/`refund_rolling_credit` khỏi đường
  enforce (Free chuyển sang hạn mức TỔNG/ngày) — **hai hàm này thật sự không còn lời gọi TS nào**
  (xác nhận qua `packages/core-billing/usage.test.ts:121,246`), có thể drop ở đợt dọn dẹp sau nếu
  muốn, không khẩn cấp. Nhưng **bảng `free_daily_credit` + hàm `grant_daily_bonus_rolling` KHÔNG
  mồ côi** — rà lại code thật 2026-09-19 phát hiện `apps/server/src/api/_lib/quests.ts`
  (`getCurrentStreak`, nhiệm vụ `streak_5` — "học liên tiếp 5 ngày") đọc trực tiếp
  `free_daily_credit.bonus_earned` và PHỤ THUỘC bảng này được ghi tiếp tục mỗi ngày qua lời gọi
  ở `apps/server/src/api/core/progress.ts`. **QUYẾT ĐỊNH: GIỮ NGUYÊN lời gọi
  `grant_daily_bonus_rolling`** — gỡ nó sẽ làm nhiệm vụ streak_5 hỏng âm thầm (không cổng CI nào
  bắt được, vì không có test tích hợp progress.ts→quests.ts). Không còn việc phải làm cho phần
  bảng/hàm chính này.

- 🟡 **[2026-08-26 — NỢ CÓ CHỦ ĐÍCH, người dùng chốt; TRẢ XONG PHẦN GIAO DIỆN 2026-09-05] Hai
  tính năng mới CHƯA có bản chiều B** (người nước ngoài học tiếng Việt). Người dùng xác nhận:
  "chiều A là ok rồi, chiều B nợ".

  **Trạng thái nay: CẢ HAI tính năng đã chạy được ở chiều B** ("Người thân theo dõi" 2026-09-03,
  "Chế độ ôn thi" 2026-09-05). Phần còn mở KHÔNG còn là việc dịch giao diện nữa mà là **việc
  NỘI DUNG**: bộ từ vựng tiếng Việt phân bậc cho phạm vi ôn thi `vsl-b1` (chi tiết ngay dưới).

  **[2026-09-03] "Người thân theo dõi" — ĐÃ TRẢ XONG.** Khối `CompanionLinkSection.tsx` nay nhận
  prop `isA` (như `ReferralSection`) và render đủ ở cả hai chiều — bỏ điều kiện `{isA && ...}` ở
  `Profile.tsx`. Nội dung thư (`weeklyReport.ts`) viết hoàn toàn bằng tiếng Anh ở chiều B (mở đầu/
  câu hỏi gợi ý theo cấp/dòng số liệu/footer riêng biệt, không trộn ngôn ngữ) — `direction` đọc
  từ `learning_progress.settings` qua `weeklyReportService.parseDirection()` (server-side, cùng
  nguồn `packages/core-learner/learnerState.ts` dùng ở client), thêm vào
  `WeeklyReportDataSchema` với `.default('A')` để dữ liệu/test cũ không cần đổi. Cổng
  `e2e/a11y-companion-link.spec.ts` đã nới thêm 2 theme + 1 vòng AAA ở `direction='B'`.

  **[2026-09-05] "Chế độ ôn thi" — ĐÃ TRẢ XONG phần giao diện + kỳ thi.** `ExamPlan.tsx` nay song
  ngữ trọn vẹn theo khuôn `isA ? 'vi' : 'en'` (giống `CompanionLinkSection`), `ExamKindSchema` mở
  thêm `vsl-b1` (chứng chỉ tiếng Việt bậc 3 theo Khung năng lực tiếng Việt cho người nước ngoài,
  Thông tư 17/2015) và `examKindForDirection()` chọn kỳ thi theo chiều học. Không cần migration:
  cột `exam_kind` là `text` không có ràng buộc CHECK. Cổng `e2e/a11y-exam-plan.spec.ts` nới thêm
  2 theme × 2 màn hình + 1 vòng AAA ở `direction='B'`, **cộng một test bất biến mới**: quét toàn
  bộ `main` ở chiều B và bắt đỏ nếu lọt bất kỳ ký tự có dấu tiếng Việt nào. 17/17 test xanh.

  **GIỚI HẠN CÒN LẠI, cố ý và NÓI THẲNG trên giao diện** (người dùng không có ưu tiên khi được
  hỏi, nên chọn phương án ship được ngay): phạm vi ôn của `vsl-b1` dùng lại chính bộ cặp từ
  A1–B1 sẵn có, học ngược chiều Việt → Anh, vì repo **chưa có bộ từ vựng tiếng Việt phân bậc**.
  Bậc hiển thị vì vậy là bậc CEFR của phía tiếng Anh, không phải bậc tiếng Việt thật — trang
  `/on-thi` in rõ điều này cho người học ở khối "Scope note", không giấu. Ghi chú giới hạn cũng
  nằm ngay trên `ExamKindSchema`.

  **Việc còn lại (đợt NỘI DUNG riêng, chưa lên lịch):** soạn bộ từ vựng tiếng Việt phân bậc theo
  Khung năng lực tiếng Việt cho người nước ngoài rồi thay vào phạm vi của `vsl-b1`. Đây là việc
  soạn nội dung vài nghìn mục cần nguồn tham chiếu, không phải việc sửa mã — nên tách hẳn, và
  cần một đặc tả riêng trước khi bắt đầu.

- 🟡 **[2026-08-26 — HẠ MỨC sau khi chẩn đoán; ban đầu ghi 🔴 là ĐÁNH GIÁ QUÁ NẶNG] Redis rớt
  kết nối 7 lần/ngày, mỗi lần DƯỚI MỘT GIÂY.** `pm2 logs dhcb --err` cho thấy 7 cặp log
  (00:03 · 00:27 · 02:50 · 03:41 · 04:37 · 05:28 · 08:03), mỗi cặp là "Redis lỗi (Stream isn't
  writeable…)" rồi "Redis đã hoạt động trở lại".

  **Vì sao hạ từ 🔴 xuống 🟡:** hai dòng của mỗi cặp có **CÙNG dấu thời gian đến giây**
  (`00:03:51` cho cả hai). Gián đoạn dưới 1 giây, 7 lần/ngày ⇒ cửa sổ rate limit lỏng chỉ vài
  mili giây, không ai khai thác được. Lần ghi đầu gắn 🔴 dựa trên giả định ngầm rằng gián đoạn
  kéo dài — **không kiểm dấu thời gian trước khi gắn nhãn**. Ghi lại lỗi suy luận này vì nó
  đúng loại sai mà quy trình audit sinh ra để bắt.

  **BỐN giả thuyết đã bị bác bỏ bằng số đo thật — đừng đi lại đường cũ:**

  | Giả thuyết                 | Số đo                                          | Kết luận                            |
  | -------------------------- | ---------------------------------------------- | ----------------------------------- |
  | Redis đóng client nhàn rỗi | `timeout 0`                                    | ❌ Redis không bao giờ đóng vì idle |
  | Redis bị khởi động lại     | `uptime_in_seconds: 232420` (2,7 ngày)         | ❌ không restart                    |
  | Chạm `maxclients`          | `rejected_connections: 0`, `maxclients: 10000` | ❌                                  |
  | `REDIS_URL` sai định dạng  | có dấu hai chấm, đúng chuẩn `redis://:pass@`   | ❌                                  |
  | Trùng job cron             | cron chạy 3:05/3:10/3:15 + 0:00/12:00          | ❌ chỉ 1/7 mốc gần trùng            |

  **Manh mối còn lại, chưa đủ kết luận:** `connected_clients: 2` trong khi có 3 instance PM2
  (kết nối tạo lazy nên có thể chỉ phản ánh lúc vừa reload); và khoảng cách giữa các lần rớt có
  nhịp 51 → 56 → 51 phút không thuộc cron nào.

  **Mốc theo dõi, KHÔNG vá vội:** VPS mới có swap từ 2026-08-26. Giả thuyết còn sống là máy bị
  áp lực bộ nhớ khiến tiến trình đình trệ, không đáp TCP keepalive (`tcp-keepalive 300`) nên
  Redis ngắt. Nếu vậy thì swap đã xử lý gián tiếp. **Đọc lại `pm2 logs dhcb --err` sau vài
  ngày:** còn đúng ~7 lần/ngày ⇒ nguyên nhân nằm chỗ khác, đào tiếp; giảm hẳn ⇒ đóng nợ.

  **Nếu phải vá:** KHÔNG đảo `enableOfflineQueue: false` (đặt có chủ đích để rate limit không
  treo request khi Redis chết). Ứng viên hợp lý là nới `connectTimeout` (đang 2000ms) — nhưng
  chỉ khi có bằng chứng, không theo linh cảm.

- 🟡 **[ĐO LẠI 2026-09-14 — mô tả "ngân sách BUNDLE nay rộng" ĐÃ LỖI THỜI] Cả COVERAGE lẫn
  BUNDLE nay đều mỏng.**

  **[2026-09-22 — nới đệm, `docs/changelog/0411-*.md`]** JS **136,73 → 131,99 / 150 kB (88,0%)**
  nhờ sửa phép đo: chunk lười `src/prompts` mang tên `index-*.js` bị glob `.size-limit.json` đếm
  nhầm 4,8 kB (đã đặt tên `prompts-*`). Branches **90,07 → 90,48%** (đệm 1,07 → 1,48 điểm) nhờ
  test mới cho `security.ts` (đường Redis), `chatFallback.ts`, `subjectProgressBoard.ts`. Vẫn
  🟡: CSS 17,80 / 20 kB (89%) chưa đụng; branches dư 1,48 điểm là đủ cho PR cỡ vừa, chưa phải
  thoải mái. Số bên dưới là đo CŨ, giữ để so xu hướng.

  Đo 2026-09-14 (build sạch): **JS 135,09 / 140 kB = 96,5%** — vượt ngưỡng cảnh báo 95% mà
  `docs/framework/QUY-TRINH-AUDIT.md` Tầng 1 đặt ra, chỉ còn 4,9 kB nên tính năng nhỏ kế tiếp
  sẽ làm CI đỏ. CSS 18,11 / 20 kB (90,6%; ngưỡng đã nới từ 18 lên 20). Phần mô tả bên dưới là
  số đo CŨ, giữ lại để so sánh xu hướng — đừng đọc nó như trạng thái hiện tại.

  **[Đo lại 2026-09-14, docs/changelog/0304 — phần JS của nợ này ĐÃ ĐÓNG.]** Sửa lỗi cấu hình
  `manualChunks` (`apps/dhcb/vite.config.ts`): `@marijn/find-cluster-break` rơi nhầm vào
  `vendor-misc` thay vì `vendor-codemirror`; tách `qrcode`+`dijkstrajs` (chỉ dùng sau route
  lazy-load) ra chunk riêng không bị preload eager. Kết quả `npx size-limit --json` sau `npm run
build`: **JS 126,07 / 140 kB = 90,06%** (dư 13,93 kB, gấp gần 3 lần biên độ cũ). CSS không đổi
  (ngoài phạm vi đợt này, vẫn 90,6%). Coverage vẫn mỏng như mô tả cũ bên dưới — CHƯA đóng.

  **[Đo lại 2026-09-01, đợt tối ưu dự án]** Trước đợt: JS 127,36 / 140 kB · CSS **17,00 / 18 kB
  (còn đúng 1 kB — PR #797 thêm keyframes/utility)** · branches **90,19%** (còn 0,19 điểm).
  Sau đợt: JS 127,26 kB (chunk `lessons` 3 MB của môn Lập trình đã tách thành 153 chunk theo
  unit, nạp lười; `programmingRoutes` 48 kB gzip → 0,5 kB) · branches **90,67%** (còn 0,67 điểm) nhờ test
  `progressSync.ts` (74 → 92%) + `co-learning-audio.ts`. CSS KHÔNG đổi — vẫn là biên độ mỏng nhất, thêm animation/theme
  mới là phải rà `tailwind.config.js` trước. Chạy `npm run budget` để xem số hiện tại. Số đo thật hôm nay trên `main` (chạy `npm ci` sạch rồi
  `npm run build`):

  | Ngân sách            | Số thật   | Ngưỡng | Biên độ          |
  | -------------------- | --------- | ------ | ---------------- |
  | Initial JS (brotli)  | 124,83 kB | 140 kB | dư **~10,8%**    |
  | Initial CSS (brotli) | 16,23 kB  | 18 kB  | dư **~9,8%**     |
  | Coverage branches    | 90,54%    | 90%    | dư **0,54 điểm** |

  **[Đo lại 2026-09-02] CSS đã hết mỏng — NỚI ngưỡng 18→20 kB, phần bundle của nợ này ĐÓNG.**
  Rà lại: `dist/assets/index-*.css` đã qua Tailwind v3 JIT purge đúng (không safelist thừa,
  không class chết) — không có "rác" thật để cắt mà không đụng nhiều file UI (đổi số class dùng
  trong component, rủi ro phá giao diện). Ngưỡng 18 kB là tự đặt, không phải giới hạn kỹ thuật,
  nên chọn nới thay vì cắt CSS đang dùng. Sửa `.size-limit.json` (CSS 18→20 kB). Số đo lại trên
  `main` sau khi sửa (`npm ci && npm run build && npm run budget`):

  | Ngân sách            | Số thật   | Ngưỡng | Biên độ      |
  | -------------------- | --------- | ------ | ------------ |
  | Initial JS (brotli)  | 127,26 kB | 140 kB | dư **~9,1%** |
  | Initial CSS (brotli) | 17,00 kB  | 20 kB  | dư **~15%**  |

  **[Đo lại 2026-09-05, audit toàn diện F10] CSS lại mỏng đi: 18,03 / 20 kB — chỉ còn ~1,97 kB
  (dư ~9,9%), tức đã ăn hết một nửa phần vừa nới ngày 02/09.** JS 128,44 / 140 kB (dư ~8,3%).
  Không nới thêm lần nữa: nới hai lần liên tiếp là biến ngân sách thành thứ chạy theo số đo. Thêm
  animation/theme mới thì rà `tailwind.config.js` TRƯỚC, và chạy `npm run budget` để xem số hiện tại.

  Coverage branches vẫn mỏng — **nhưng biên độ đó nay là CHẤP NHẬN ĐƯỢC theo quyết định người
  dùng (2026-09-03: "cover 90%")**. Số hiện tại 90,70% trên sàn 90 = dư 0,70 điểm. **KHÔNG nâng
  ngưỡng, và KHÔNG chạy đợt viết test chỉ để đẩy con số.** Phiên sau đọc cảnh báo của
  `npm run budget` ("biên độ hẹp") thì đừng tự ý "sửa" — đó là trạng thái đã chốt, không phải
  việc bỏ sót. Điều VẪN đúng: tính năng mới phải tự mang test cho nhánh logic của nó, nếu không
  cổng coverage sẽ đỏ.

  **[Đo lại 2026-08-27, sau PR-M7]** Ba con số trên là bản mới nhất. Đợt PR-M7 là ca thực tế
  đầu tiên nợ này bật ra: bộ chạy Kotlin (~4.000 dòng nguồn) làm branches tụt xuống **88,75%**
  — CI sẽ đỏ. Đã trả bằng cách **viết thêm test chứ không nâng ngưỡng** (hai file mới phủ bề
  mặt thư viện và đường lỗi), kéo lên 90,29%. Bài học: PR nào thêm một khối mã lớn thì phải
  **đo coverage TRƯỚC khi mở PR**, đừng đợi CI báo.

  **Phần bundle của nợ này coi như đóng.** Con số "99,7%" ghi ngày 2026-08-25 đã lạc hậu: ngưỡng
  JS được nới 123 → 140 kB và CSS 16 → 18 kB ở các PR sau đó, mà mục nợ không ai cập nhật. Đây
  đúng loại lệch mà Tầng 6b của quy trình audit sinh ra để bắt — tài liệu điều hành nói một
  đằng, số thật một nẻo — nên ghi lại để lần sau đo trước khi tin.

  **[Đo lại 2026-08-28] Phần coverage đã NỚI GẤP ĐÔI, chưa đóng.** Biên độ branches từ 0,27 lên
  **0,54 điểm** (90,27 → 90,54%) nhờ 90 test bù cho `kotlinSim`/`swiftSim`/`mistakes.ts` —
  xem `docs/changelog/0187-2026-08-28-super-kotlin-va-bien-do-coverage.md`. Đợt đó cũng bắt ra
  một lỗi thật nhờ đi tìm nhánh thiếu test (`super.f()` gọi vòng vô tận làm sập bộ chạy Kotlin),
  tức bản thân việc vá coverage có giá trị chứ không chỉ là làm đẹp con số. Vẫn còn mỏng: nửa
  điểm là đủ để một PR thêm khối mã lớn mà quên test làm CI đỏ.

  **[Đo lại 2026-09-05, PR #856 — phần coverage của nợ này coi như ĐÓNG.]** Sau đợt bổ sung
  test cho 33 file logic thuần, GỘP với PR #855 (542 test nhắm 18 file phủ thấp nhất) chạy
  song song: stmts **98,32%** · branches **94,53%** · funcs **97,69%** · lines **98,32%**
  (573/573 file test xanh). Sàn siết lên 97/93/96/97, biên độ branches nay **1,53 điểm** —
  gần gấp ba mức 0,54 ghi ở trên, đủ chỗ cho một PR thêm khối mã lớn. Đợt này cũng bắt ra một lỗi thật nữa (id trùng do `Date.now()` ở
  `memoryPalaceService.ts` làm API trả 404 sai) — lần thứ hai liên tiếp việc vá coverage lòi
  ra bug thật chứ không chỉ làm đẹp con số. Đợt này còn bắt thêm một cái bẫy đáng nhớ: một
  test của chính đợt đã **khoá hành vi LỖI làm chuẩn** (`find /` chỉ trả về `/`), chỉ lộ ra
  khi gộp với PR #855 vốn đã vá đúng lỗi đó. Bài học ghi lại trong changelog 0269: "nhánh
  không chạm tới được" KHÔNG đồng nghĩa "nhánh đúng".

  **Không đóng hẳn được ở mức 100%, và đây là kết luận có chủ đích, không phải việc bỏ dở.**
  Phần chưa phủ còn lại là (a) nhánh phòng thủ chết do `noUncheckedIndexedAccess` bắt viết,
  (b) vỏ bọc WebSocket/mạng sống thuộc phạm vi E2E. Danh sách mã chết cụ thể theo từng
  file:dòng nằm ở `docs/changelog/0269-2026-09-05-nang-coverage-33-file-logic-thuan.md`.

  **[ĐÃ QUYẾT 2026-09-05 — đợt mã chết, changelog 0270] Xong, không còn treo.** Đo lại thì
  danh sách cũ đã lỗi thời (một số mục nay đã được phủ sau PR #855); còn đúng 31 nhánh, soát
  từng dòng: **xoá 3** (nhánh "đường dẫn tương đối" của `bashSim.chuanHoa` + cặp tham số
  `tachDuoc`/`globDuoc` luôn bằng nhau của `noTu.them` — cả hai vừa chết vừa gây hiểu nhầm),
  **giữ 28** vì chúng hoặc là giá trị mặc định do `noUncheckedIndexedAccess` bắt viết (xoá
  thì phải thay bằng `!`, đi lùi), hoặc là chốt chặn trạng thái hỏng chống vòng lặp vô hạn.

  **[Đo lại 2026-08-31, sau loạt "thiết kế lại web cho desktop" PR #743/#750/#756] Bundle ăn
  bớt biên độ, coverage chưa đo lại.** `npm run build && npm run budget` trên `main` sau khi cả
  3 PR merge:

  | Ngân sách            | Số thật   | Ngưỡng | Biên độ      |
  | -------------------- | --------- | ------ | ------------ |
  | Initial JS (brotli)  | 126,60 kB | 140 kB | dư **~9,6%** |
  | Initial CSS (brotli) | 16,53 kB  | 18 kB  | dư **~8,2%** |

  So với lượt đo 2026-08-28 (JS dư ~10,8%, CSS dư ~9,8%), cả hai đều hẹp lại — sidebar desktop
  thu gọn được + cột "Sửa lỗi & giải thích" ở Chat + `useIsDesktopViewport` là phần thêm mới ăn
  vào biên độ. Vẫn còn dư, không chặn CI, nhưng CSS chỉ còn dư dưới 10% — PR sau thêm CSS diện
  rộng (nhiều `lg:`/`xl:` mới) nên đo `npm run budget` TRƯỚC khi mở PR, đừng đợi CI báo. Chưa
  chạy lại `npm run test:coverage` trong đợt này (đổi UI, không đổi nhánh logic mới).

  **Đo lại bất cứ lúc nào:** `npm run build && npm run test:coverage && npm run budget`
  (`scripts/check-budget-margin.ts`, thêm ở PR #664 — in biên độ còn lại thành số, cảnh báo khi
  bundle ≥95% ngân sách hoặc coverage dư <1 điểm).

  **Điều kiện gỡ nợ — chọn một, KHÔNG lặng lẽ nâng ngưỡng:** (a) giảm bundle thật
  (code-splitting thêm, bỏ dependency eager) và bổ sung test cho các file nhánh phủ thấp
  (`geminiLiveService.ts` 14 nhánh thiếu · `co-learning-audio.ts` 12 · `neuroAffectiveService.ts`
  8 · `redisChat.ts` 8); hoặc (b) nâng ngưỡng CÓ CHỦ ĐÍCH kèm lý do ghi vào chính mục này.

  **[2026-09-04] (b) đã chọn — người dùng yêu cầu rõ "nâng coverage lên 100%", ghi đè quyết
  định "KHÔNG nâng ngưỡng" ở trên (2026-09-03).** Phương án chọn: nâng sàn CI dần dần (không
  viết test bổ sung ồ ạt cho toàn repo — khối lượng quá lớn một đợt). Trước khi đo được số
  thật, `npm run test:coverage` không chạy trọn trên Windows vì 3 lỗi cùng lớp nguyên nhân với
  PR #794 (so đường dẫn `\` vs `/`, encoding console) — đã vá cả ba (xem
  `docs/changelog/0267-2026-09-04-siet-san-coverage-va-va-3-loi-windows.md`). Số đo thật sau vá:
  stmts 96,36% · branches 90,71% · funcs 95,19% · lines 96,36%. Ngưỡng `vitest.config.ts` nâng
  thành statements 95 · branches 90 (giữ nguyên, biên độ mỏng nhất) · functions 94 · lines 95.
  Branches vẫn là chỉ số cần vá tiếp — file nhánh phủ thấp liệt kê ở trên chưa đổi.

  **[2026-09-05] ĐỢT 2 — trả đúng chỗ mỏng bằng TEST, không phải bằng cách nâng ngưỡng suông.**
  Đo `coverage-final.json` để biết chính xác nhánh nào chưa đi, xếp hạng ra 18 file gom 586/1.461
  nhánh chưa đi của cả repo (40%), giao 8 subagent song song viết **542 test mới** (11.160 →
  11.702). Không sửa một dòng mã nguồn nào. Số đo thật sau đợt: **stmts 97,00 · branches 94,06 ·
  funcs 95,95 · lines 97,00**; sàn nâng thành **96 / 93 / 95 / 96** (vẫn chừa ~1 điểm biên độ).
  Chi tiết từng file + giải trình nhánh còn trống:
  `docs/changelog/0268-2026-09-05-coverage-dot-2-nhanh-chua-phu.md`.

  **Điều quan trọng nhất rút ra: 100% branch KHÔNG đạt được bằng test hợp lệ.** Gần như toàn bộ
  nhánh còn trống sau đợt này là fallback `?? ''`/`?? null`/`?? 0` sinh ra do
  `noUncheckedIndexedAccess` mà vế phải không thể chạy (bất biến nơi gọi bảo đảm vế trái luôn có
  giá trị), cộng vài `throw e` lưới an toàn cho lỗi lập trình. Muốn chạm 100% phải viết test giả
  tạo hoặc dọn mã phòng thủ — cả hai đắt hơn giá trị thu được. **Phiên sau đừng đặt mục tiêu
  100%**; muốn siết tiếp thì nhắm nhóm phủ thấp kế tiếp (`core-personal/*`, `core-domains/*`,
  `api/domains/*`), và biết trước rằng chỗ dễ đã hết.

  **Ba nghi bug phát hiện khi viết test — ĐÃ SỬA XONG 2026-09-05 (nhánh
  `fix/ba-loi-bo-chay-bash-kotlin`, xem `docs/changelog/0269-2026-09-05-sua-ba-loi-bo-chay-bash-kotlin.md`),
  mỗi lỗi có test canh riêng:**
  (1) `packages/subject-programming/bashSim.ts` — `find /` **bỏ sót TOÀN BỘ nội dung**: bộ lọc
  `k.startsWith(pGoc + '/')` với `pGoc === '/'` ghép ra tiền tố `'//'`, không khoá nào khớp nên
  lệnh im lặng trả về đúng một dòng `/`. Chẩn đoán ban đầu ghi ở đây ("cắt lệch 1 ký tự") CHƯA
  ĐÚNG HẲN — lỗi cắt có thật nhưng nằm SAU bộ lọc nên chưa bao giờ kịp lộ ra. Sửa bằng một biến
  `tienTo` dùng chung cho cả bước lọc lẫn bước cắt;
  (2) `kotlinSim` `associateWith` không khử trùng khoá → gộp theo khoá, giá trị lần cuối thắng;
  (3) `kotlinSim` `println` bỏ qua `override fun toString()` → thêm `chuoiHoa()` (chuỗi hoá để in,
  đệ quy qua List/Map/Pair), dùng cho cả `println`/`print` lẫn nội suy `"$x"`. Xác nhận đây là
  LỖI chứ không phải khác biệt cố ý: không mục nào trong `KHAC_BIET` nói tới nó.

  **Bài học ghi lại để đừng lặp:** nghi bug suy ra từ ĐỌC MÃ phải chạy thử trước khi tin. Lỗi (1)
  bị mô tả sai ở trên vì suy từ công thức `slice()` mà không chạy `find /` một lần — chạy thử mất
  mười giây và cho ra triệu chứng khác hẳn, nặng hơn, ở một dòng khác.

- 🟡 **[2026-08-25] Tầng 8 (Core Web Vitals) và Tầng 9 (vận hành production) CHƯA kiểm được
  trong lượt audit toàn diện 2026-08-25.** Proxy của container chặn
  `en-vi.donghanhcungban.org` (403 CONNECT tunnel). Hai tầng này được ghi **TRỐNG**, không chấm
  đạt — một lượt audit thiếu 2/13 tầng thì không được coi là đã phủ hết.

  **Điều kiện gỡ nợ:** từ máy có mạng tới server — chạy Lighthouse trên trang chủ + Dictionary +
  1 trang CEFR (ngân sách LCP ≤ 2,5s · INP ≤ 200ms · CLS ≤ 0,1), và đọc Sentry (lỗi mới chưa
  xem xét) + `pm2 logs`/số lần restart + dung lượng ổ đĩa.

  **Cập nhật 2026-09-21 (`docs/changelog/0400-*.md`): một hồi quy CLS THẬT đã lộ ra và được sửa**
  (khác debt gốc ở trên — đây là cổng CI `e2e/home-clarity-evidence.spec.ts` chạy trong sandbox,
  không phải Lighthouse trên server thật). `useTodayPlan.ts` (Trang chủ) import TĨNH
  `programmingNext.ts` → kéo `lessonsLoader.ts` (LESSON_INDEX) + `curriculum.ts` (~40KB gzip) vào
  chunk đồng bộ của Home; tổng chỉ mục tăng dần theo MỌI PR thêm bài học P6 tới lúc CLS vượt
  ngưỡng (0.1030 > 0.1000, PR #1088). Đã sửa: chuyển sang `import()` động, chỉ chờ khi thật sự có
  tiến độ Lập trình. Xác nhận bằng build đo được (chunk Home không còn static import các file đó)
  - chạy lại đúng test E2E đã đỏ → xanh ở máy. **Cảnh báo cho tương lai:** `LESSON_INDEX` là chỉ
    mục PHẲNG toàn bộ bài học, phình theo mỗi đợt thêm nội dung P6 — nếu tiếp tục đẩy CLS vượt
    ngưỡng ở nơi khác, cân nhắc tách nhỏ theo bậc/hướng thay vì chỉ vá từng điểm dùng.

- 🟡 **[2026-08-26] Dải nhiễu của eval rộng hơn mức một PR có thể phân biệt được.** Hai lượt
  chạy liên tiếp, cùng prompt · model · bộ đề · `--delay`, cách nhau vài phút: FP-rate 0% →
  5,6%, specificity 100% → 94,4%, Type-hit 86,0% → 76,7%. Chỉ MỘT câu đổi phán đoán
  (`edge-05`: TN → FP) đã làm FP-rate nhảy 5,6 điểm, vì mẫu số chỉ có 18 câu đúng/ca biên.

  Hệ quả: luật "recall/precision không được tụt" ở `CLAUDE.md` mục 8 hiện **không phân biệt
  được** một prompt tệ đi 5 điểm với nhiễu lấy mẫu — cả hai trông giống hệt nhau. Dải nhiễu và
  cách đọc đã ghi vào cuối `docs/research/eval-tutor-baseline.md` (chênh ≤ 1 câu không phải
  bằng chứng; nghi ngờ thì chạy ≥ 3 lượt so trung bình; Type-hit không dùng pass/fail; chỉ số
  đáng tin nhất là recall theo từng nhóm lỗi).

  **Cách chữa thật** là mở rộng golden set — nhất là nhóm câu đúng/ca biên, hiện chỉ 18 câu —
  chứ không phải chạy đi chạy lại cùng 62 câu. Chưa làm vì cần soạn fixture mới có đối chiếu.

  **Rủi ro nếu để lâu:** Gemini là fallback THỨ 3 trong chat (sau Groq, Anthropic) — sự cố chỉ lộ
  ra khi cả hai provider chính cùng lúc gặp vấn đề, tức âm thầm mất một lớp dự phòng mà không ai
  biết cho tới khi cần đến nó.

- 🟡 **[2026-08-23] MÃ HOÁ DỮ LIỆU NGƯỜI DÙNG — ĐÃ BẬT cho dữ liệu MỚI; còn nợ dữ liệu CŨ.**
  _(Cập nhật cùng ngày: người dùng đảo quyết định — "phải mã hoá dữ liệu người dùng". Secret 2FA
  đã mã hoá thật ngay từ bản đầu, không có giai đoạn plaintext. Phần còn nợ là **viết lại dữ liệu
  CŨ đang có** — tên, email, tiến độ — vốn rủi ro cao vì đụng dữ liệu thật; và **người dùng vẫn
  cần chốt nơi cất khoá gốc**, hướng dẫn ở `docs/van-hanh-khoa-ma-hoa.md`.)_ Hạ tầng
  **đã dựng xong và có test** (`packages/core-config/userDataCrypto.ts`, 18 test: AES-256-GCM,
  khoá mỗi người suy ra bằng `HMAC(USER_DATA_MASTER_KEY, user_id)`, chuỗi tự mô tả
  `v<n>:<iv>:<cipher>`, IV luôn ngẫu nhiên, `keyVersion` sẵn từ bản đầu, `isEncryptedField()` cho
  phép chuyển đổi dần, `hashLookupValue()` cho cột cần tra cứu). **Nhưng CHƯA nối vào bất kỳ dữ
  liệu nào** — module hiện đang NGỦ, không chỗ nào gọi, không ảnh hưởng gì đang chạy.

  **Việc còn lại + câu hỏi chưa có đáp án — **cất khoá gốc `USER_DATA_MASTER_KEY` ở đâu?** Khoá phải nằm KHÁC chỗ với backup DB (cất chung thì mã hoá vô
  nghĩa: ai lấy được backup lấy luôn khoá), mà **mất khoá = mất vĩnh viễn toàn bộ dữ liệu đã mã
  hoá, không có đường khôi phục\*\*. Bật mã hoá khi chưa chốt chỗ cất khoá là tự tạo rủi ro mất dữ
  liệu lớn hơn rủi ro nó định phòng.

  **Điều kiện gỡ nợ:** người dùng chốt nơi cất + cách sao lưu khoá gốc. Xong việc đó thì làm theo
  thứ tự ở `docs/research/dac-ta-ma-hoa-du-lieu-va-2fa-2026-08-23.md` mục 6:
  **S-3 trước** (mã hoá dữ liệu MỚI — gần như miễn phí vì dữ liệu chưa tồn tại), **S-4 sau và
  cân nhắc kỹ** (mã hoá dữ liệu CŨ — đụng dữ liệu thật của người dùng đang hoạt động, rủi ro cao).

  **Rủi ro đang chấp nhận trong lúc ghi nợ:** bản dump PostgreSQL và file backup trên Cloudflare R2
  vẫn là **plaintext** — lộ khoá R2 là lộ dữ liệu người dùng. Đây là lý do món nợ này không nên để
  quá lâu. Giảm nhẹ tạm thời: siết quyền truy cập khoá R2 và rà lại ai đang giữ nó.

  **Hệ quả cần biết khi làm tiếp tính năng:** hồ sơ năng lực ẩn và câu trả lời tự do (câu 3–4 của
  luồng người mới) là dữ liệu tầng T2 — theo đặc tả thì phải mã hoá. Nếu làm **C1b-2** (màn 5 câu)
  trước khi gỡ nợ này, dữ liệu đó sẽ nằm plaintext. Hai lựa chọn khi tới đó: ① chấp nhận plaintext
  tạm rồi mã hoá sau (module đã sẵn, chỉ cần thêm 1 biến môi trường + viết lại dữ liệu), hoặc
  ② hoãn C1b-2, làm **S-1 (2FA TOTP)** trước — 2FA độc lập hoàn toàn với mã hoá và không bị chặn
  bởi câu hỏi khoá gốc.

- 🟡 **[2026-08-21] Gemini Live — đã thay code GIẢ bằng kết nối WebSocket THẬT, nhưng CHƯA test
  với API key thật.** Nhánh `claude/gemini-live-integration-xo175x` **ĐÃ MERGE** (xác nhận
  2026-09-19: code đang chạy thật tại `apps/server/src/api/platform/gemini-live.ts` +
  `packages/core-ai/geminiLiveService.ts`/`wsGeminiLiveHandler.ts`/`packages/core-contracts/geminiLive.ts`,
  gắn vào `apps/server/src/server.ts`/`routes.ts`; nhánh đã bị xoá sau merge như thường lệ,
  đường dẫn `apps/english/...` cũ ở dưới đã đổi theo tái cấu trúc `apps/english`→`apps/dhcb`).
  Trước đó (commit `cf44362` "feat: implement horizon features and stress test suite") đã có sẵn
  một bộ khung lớn (~4100 dòng) — nhưng khi đọc kỹ, `geminiLiveService.ts` **không hề gọi API
  Gemini thật**: mỗi 20 audio chunk người dùng gửi lên, code chỉ **echo ngược chính audio đó** giả
  làm phản hồi AI. Đã sửa `packages/core-ai/geminiLiveService.ts` để **thật sự mở WebSocket** tới
  `wss://generativelanguage.googleapis.com/.../BidiGenerateContent` (đọc `docs/research/dac-ta-gemini-live-2026-08-21.md`
  để biết bối cảnh — chọn Phương án C: Live chỉ cho phần hội thoại, giữ pipeline STT/LLM/TTS cũ
  cho phần sửa lỗi 2 giọng). Đã verify: test đơn vị (mock `ws` qua `_setWebSocketFactoryForTests`,
  6/6 pass), `npm test` toàn bộ 5019/5019 pass, build/typecheck/lint xanh. **CHƯA verify được** với
  `GEMINI_API_KEY` thật (sandbox không có key) — trước khi dùng thật cần: (1) thêm
  `GEMINI_API_KEY` vào `.env`, (2) xác nhận model Live khả dụng qua `GEMINI_LIVE_MODEL` (mặc định
  `gemini-2.0-flash-exp`, Google hay đổi tên/khả dụng model Live), (3) thử 1 phiên thật qua
  `/ws/gemini-live`, (4) audit lại các file "V6.x/V7.0" khác cùng thời điểm với `cf44362` xem có
  scaffolding giả tương tự không (chưa rà — người dùng đã được báo, quyết định xử lý riêng sau).
