# PROGRESS.md — Trạng thái dự án

> Mỗi mục MỘT dòng, sửa TẠI CHỖ. Chi tiết: `docs/legacy/progress-luu-tru-den-2026-11-06.md`
> (`Lxxx` = số dòng trong file đó).

## Giai đoạn hiện tại

App chạy thật (`donghanhcungban.org`). **Đóng băng mở rộng phạm vi** tới khi có số đo người học
thật (L239). Việc kỹ thuật tự làm được gần hết; phần lớn mục dưới **chờ chủ dự án**.
Nhật ký: `docs/changelog/` (`npm run changelog`); nợ đã đóng: `docs/legacy/no-ky-thuat-da-dong.md`.

## Tiếp theo

- **[2026-10-20] Audit toàn diện 11 tầng** — W-001…W-004 xong, F-008/F-011 đóng (baseline `0683`); còn F-007 (ghi nhận) + 14 moderate chỉ ở dev (`0691`). L83
- **[2026-10-16] Nâng cấp từ stored** — S01–S06 đã merge/deploy; WAITING chủ dự án: nhãn tay + floor S05, benchmark vector thật, đo acoustic S06 (`docs/goals/2026-10-16-stored-upgrades.md`). L107
- **[2026-10-13] Gợi ý rà soát chéo** — mục 2/3/5/6 xong; mục 1 (`opusplan`) chờ chủ dự án quyết chi phí (`0630`). L128
- **[2026-10-11] Bạn Đồng Hành 4 GĐ** — code xong; còn việc tay sau deploy: `migrate:pg`, key Gemini, bật 3 công tắc, eval companion/routing, theo dõi chi phí. L134
- **[2026-10-09] Dự án trục T2/T3 Lập trình** — đủ P1→P5; nội dung `draft`, chưa ai duyệt sư phạm (`0571`). L173
- **[2026-10-05] 20 khoá AI Engineering** — B2 hoạt hoạ Git chờ chuyên gia chốt storyboard; 3 hoạt hoạ chờ reviewer; gói chấm #1239 chờ quyết kiến trúc. L183–L185
- **[2026-09-23] Nâng cấp UI/UX + sư phạm** — S05/S10 chờ chuyên gia, S12 chờ pilot; thiếu bằng chứng a11y trên thiết bị thật (`docs/goals/2026-09-23-uiux-su-pham.md`). L198
- **[2026-09-06] Mời 5 người học thật, quan sát 2 tuần** — việc tay chủ dự án; sau đó đọc phễu + DAU/returning mới quyết bước tiếp. L243
- **Góc học tập / redesign trang chủ** — slice đã thi hành hết phần Approved; UX-R4 chưa làm; việc tay: 301 nginx + Search Console (`0377`). L294–L336
- **Nội dung** — `vsl-b1` cần bộ từ tiếng Việt phân bậc (cần đặc tả); Swift PR-M4–M6 chặn chờ `swift:conformance`; STEM 294 bài + Toán THCS chờ người chuyên môn đọc; còn 442 câu TN chưa ai đọc (`0299`). L339–L468
- **Kỹ thuật** — ECC đợt 2 mục (6) chờ quyết (`0468`); đọc lại `pm2 logs dhcb --err` (Redis) sau khi VPS có swap. L522–L540

## ⚠️ Cần làm tay (không cần PR)

- **[2026-10-10] Siết TLS Cloudflare + DNS/cert `run.`**, đặt `VITE_CODE_RUNNER_ORIGIN`, 7 ngày Report-Only rồi R4 (`0588`). L558
- **[2026-10-09] Claude AI chính** — kiểm key/credit, đặt `AI_DAILY_BUDGET_USD`, chấm thử 5 màn, `eval:action-canvas` (`0568`). L577
- **[2026-10-09] Đặt `ERASED_BENEFIT_LEDGER_KEY` trên VPS** trước deploy, kiểm log khởi động (`0545`). L601
- **[2026-10-08] ElevenLabs** — điền key, nghe tone-sample, `--check`, seed theo hạn mức (`0517`). L609
- **[2026-09-30] Kiểm production** — hub trong `ALLOWED_ORIGINS`, câu Free cũ trong bullets, chạy `cwv:prod` (`0466`). L618
- **[2026-09-27] VPS sau audit bảo mật 2** — xoay khoá VAPID đã lộ, áp `nginx/en-vi.conf` mới, ufw chỉ cho Cloudflare (`0465`). L632
- **[2026-09-27] Sales-Hunter** — bật lối vào chỉ sau khi Sales nghiệm thu (`0460`). L646
- **[2026-08-27] `npm run swift:conformance`** trên máy có Swift — gỡ chặn PR-M4–M6. L677
- **Scale 50k** — mua VPS, `verify-pg-backup`, chạy k6 (`docs/research/ke-hoach-scale-30k-concurrent.md`). L693
- **Biến VPS chưa kiểm** — `GROQ_API_KEY`, `ADMIN_USER_IDS`, `AZURE_SPEECH_*`. L708
- **SePay** — đăng ký, điền biến VPS, tạo webhook, chuyển khoản thử (`docs/research/dac-ta-thanh-toan-2026-07-25.md`). L834
- **seed-all** — thử `--sync-r2 --dry-run` trên VPS (`docs/seed-guide.md`). L902

## Quyết định quan trọng

- **[2026-10-09] Claude là AI chính**, model theo nhiệm vụ (Anthropic → Groq → Gemini); chấm điểm dùng structured outputs (`0568`). L722
- **[2026-09-05] Tầng 8b bắt buộc** — chụp 1440/390 px trước/sau cho mọi đợt chạm UI (`docs/framework/QUY-TRINH-AUDIT.md`). L736
- **[2026-09-03] Giữ màu Tailwind cố định**, không token hoá ~4.100 chỗ; code mới kèm `theme-light:text-*-800/900`. L753
- **[2026-08-04] Tự viết `codemap`**; không cài `obra/superpowers`/GitNexus (license). L778–L787
- **[2026-07-31] Nền tảng đa lĩnh vực** — nguồn sự thật `docs/adr/0001-nen-tang-da-linh-vuc.md`. L798
- **Bảng xếp hạng tạm tắt** bằng cầu dao `leaderboardEnabled` — bật lại khi đủ đông (~200/tuần). L802
- **Gói & hạn mức** — chỉ `free`/`vip` (nguồn `packages/core-billing/plan.ts`), Free 30 lượt AI/ngày; thanh toán SePay; giọng Studio chỉ VIP. L823–L889
- Khác (`size-limit` thay Lighthouse CI, nhiều phiên song song…): L897–L900

## Nợ kỹ thuật còn mở

- 🟠 **[2026-10-26] Audit sâu: hết mục Cao; còn AUD-SEC-005 (Trung)** — chủ dự án đối soát thu hồi VAPID/Supabase service-role (`docs/ops/AUDIT-STATUS.md`). L944
- 🟡 **[2026-10-12] Red-team AI: còn eval injection với key thật** — Companion V2 54/54 xong; tutor/companion/writing + tác tử là việc tay (`0622`). L970
- 🟡 **[2026-10-09] Hội thoại CEFR: đáp án tra được từ `dialogues.json` công khai** — đoán mò đã chặn (`0559`); CẦN CHỦ DỰ ÁN QUYẾT. L986
- 🟡 **[2026-10-08] Xuất/xoá dữ liệu cá nhân: mã xong** — chỉ còn việc tay `ERASED_BENEFIT_LEDGER_KEY` (`0527`). L996
- 🟡 **[2026-10-02] Bảng nháp STEM: còn Lí vector/đạo hàm, Toán căn ba/lượng giác/log/nhiều ẩn, 272 câu draft** (`docs/specs/2026-10-09-kiem-buoc-giai-stem.md`). L1016
- 🟡 **[2026-09-30] Audit UI/UX 2026: còn rail mục lục trước h1 + thử trình đọc màn hình thật** — WCAG A/AA đã đóng (`0512`). L1046
- 🟡 **[2026-09-27] Audit bảo mật 2: còn (4) thử tay gọi thẳng IP gốc với `CF-Connecting-IP` giả** (`0465`). L1062
- 🟡 **[2026-09-22] Nợ sau React 19/Tailwind 4: Node 26 chờ VPS; TS 7, ESLint 10 chờ upstream** (`0415`). L1080
- 🟡 **[2026-09-22] Audit UI/UX sâu: theme `kid` chỉ đổi màu; nhiều lối vào cùng đích** (`docs/audit/2026-09-22-danh-gia-sau-ui-ux.md`). L1097
- 🟡 **[2026-09-22] Audit câu chữ: 58 câu mẫu chưa gán vòng; nội dung chưa có người chuyên môn đọc** (`0406`). L1128
- 🟡 **[2026-09-21] Hoạt ảnh bài học: môn Anh chưa có cấu trúc animation** (`docs/specs/2026-09-21-hoat-anh-mo-phong-bai-hoc.md`). L1147
- 🟡 **[2026-09-17] S13-2 AC-8 ma trận thị giác CHƯA CHẤM** — chủ dự án chấm 30 ô; ảnh: `npm run shots:learning-ux`. L1174
- 🟡 **[2026-09-15] Dữ liệu đã ghi ở origin `hoc-tap.` không migrate** — đóng sau 60 ngày không phản ánh hoặc khi gỡ host (`0326`, `0383`). L1176
- 🟡 **[2026-08-26] Chiều B: còn bộ từ tiếng Việt phân bậc cho `vsl-b1`** — cần đặc tả riêng. L1190
- 🟡 **[2026-08-26] Redis rớt ~7 lần/ngày dưới 1 giây** — đã chặn 429 oan (`0583`); gốc rễ chờ đọc log. L1227
- 🟡 **[2026-10-28] Đệm coverage/bundle: CSS 23,76/26 kB mỏng nhất** — xem lại khi CSS > 25 kB hoặc branches < 91 % (`0685`). L1267
- 🟡 **[2026-08-25] Core Web Vitals: LCP mobile Từ điển/CEFR > 2,5 s; Tầng 9 vận hành là việc tay** (`0601`). L1285
- 🟡 **[2026-08-26] Nhiễu eval: còn chạy `eval:tutor --runs 3 --write-baseline`** (`docs/research/eval-tutor-baseline.md`). L1337
- 🟡 **[2026-08-23] Mã hoá dữ liệu CŨ chưa backfill** — chờ chốt nơi cất `USER_DATA_MASTER_KEY` (`docs/van-hanh-khoa-ma-hoa.md`). L1362
- 🟡 **[2026-08-21] Gemini Live chưa test với key thật, chưa có client** — xây client hay gỡ: chưa quyết. L1398
