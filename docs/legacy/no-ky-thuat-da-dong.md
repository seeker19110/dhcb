# Nợ kỹ thuật ĐÃ ĐÓNG — kho lưu (tách khỏi `PROGRESS.md` ngày 2026-09-01)

`PROGRESS.md` mục "Nợ kỹ thuật còn mở" chỉ giữ nợ **đang mở**; các khối dưới đây là nợ đã gỡ,
dời nguyên văn sang đây để giữ bằng chứng và bài học (cách chẩn đoán, số đo, giả thuyết đã bác
bỏ). Thứ tự: như thứ tự cũ trong `PROGRESS.md`, mới hơn ở trên.

Khi đóng thêm một món nợ: cắt khối đó khỏi `PROGRESS.md`, dán vào ĐẦU danh sách dưới đây.

- ✅ **[2026-10-26 — changelog `0665`; XONG ở `0677`, PR #1457] `@anthropic-ai/sdk` ĐÃ nâng lên 1.3.0.**
  Eval thật với SDK mới: companion 16/16, code-feedback 8/8, tutor 20 câu chấm đủ, action-canvas 10/10 (trên
  production sau deploy, 2026-10-27); chủ dự án chat thử trên app — ổn. `linkedom` 0.18.14 vẫn bị chặn (vỡ
  build worker do `@acemir/cssom`) — chỉ đúng bản đó.

- ✅ **[GỘP 2026-10-28, `0685`: phần còn mở (Node 26, ESLint 10) trùng mục "đợt React 19 + Tailwind 4" vẫn ở PROGRESS] [2026-09-22 — đợt nâng cấp major stack, `docs/changelog/0414-*.md`, ADR 0011] Ba nợ nâng
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

- ✅ **[2026-10-02 — phát hiện ở changelog `0485`, ĐÃ XỬ LÝ ở `0549`] Action Canvas "tạo sơ đồ
  từ mục tiêu" từng chỉ là KHUNG MẪU cố định.** Nay AI ĐỀ XUẤT phân rã thật (đặc tả
  `docs/specs/2026-10-09-action-canvas-phan-ra-muc-tieu-ai.md`): 1 lời gọi/lần, đếm chung lượt AI/ngày,
  hoàn lượt khi AI lỗi/đầu ra hỏng, khoá chống hai request đua, đầu ra kiểm Zod + DAG; đề xuất KHÔNG
  tự lưu — người dùng bỏ/sửa bước rồi bấm Lưu; hết lượt thì tự bắt đầu với thẻ mục tiêu. Khung mẫu
  `synthesizeCrossDomainGoalCanvas` đã gỡ. **Việc tay còn lại:** chủ dự án chạy
  `npm run eval:action-canvas` (cần key AI trong `.env`, tốn phí) và ghi kết quả vào PR — chưa
  chạy lần nào trên model thật.
- ✅ **[2026-10-02 — changelog `0479`, ĐÃ XỬ LÝ ở `0539`] "Chỉ số tự nhận thức" giả của nhật ký
  phản tỉnh đã BỎ HẲN** (cùng "Growth Mindset" và "xu hướng tư duy"): service không còn tính, hợp
  đồng/API/giao diện không còn số, thay bằng phản hồi định tính (bẫy có thể đang mắc + cụm từ khiến
  bộ dò nghĩ tới + câu hỏi Socratic theo từng bẫy). Bản ghi cũ trong `platform.feature_state` vẫn
  còn hai trường số (không xoá dữ liệu thật) — server chỉ ngừng đọc/ghi.
- ✅ **ĐÃ ĐÓNG [2026-09-22, xác nhận qua CI — `docs/changelog/0413-*.md`] Deploy VPS đỏ 5 lần
  liên tiếp vì hết heap Node lúc build (`FATAL ERROR ... JavaScript heap out of memory`),
  không liên quan nội dung PR.** Vá bằng `NODE_OPTIONS=--max-old-space-size=2560` cho bước
  build trong `scripts/deploy.sh` (PR #1110). **Xác nhận:** lần deploy đầu tiên sau khi PR
  merge — run #1061 (`e1db7a89`, workflow id 35696918341) — **xanh**, 06:53:43 → 06:57:35
  (~3 phút 52 giây, đúng thời lượng một deploy bình thường, không dấu hiệu tràn swap bất
  thường). Cũng đã sửa hai file changelog cùng đánh số `0411` (PR #1108/#1109 merge gần nhau
  không ai chạy lại `npm run changelog`) — đổi file của PR #1109 sang `0412`.
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
- ✅ **[2026-09-16 → 2026-09-19 — `apps/hub/src` nằm NGOÀI cổng tương phản tĩnh — ĐÃ ĐÓNG]** (`docs/changelog/0373-*.md`). Tiền đề của nợ cũ (hub "không cùng hệ token") **sai**: hub đã có `ThemeToggle` (`App.tsx`/`HubLogin.tsx`) và `apps/hub/tailwind.config.js` map `zinc`/`accent` sang ĐÚNG biến `--z-*`/`--a-*` của `packages/core-ui/theme.css` — cùng hệ token với `@dhcb/app`. Gỡ bằng cách thêm `apps/hub/src` vào phạm vi quét của `scripts/fixed-color-contrast-audit.ts` (không tạo script riêng); vá 5 chỗ rớt AA tìm được (`theme-light:text-<màu>-800/900`, đúng cách vá đã dùng ~720 lần); ~60 chỗ `text-zinc-*` còn lại đã tự đạt AA (chỉ dùng bậc sáng). Phần E2E ĐÃ ĐÓNG ở changelog `0598`: `e2e/a11y-hub.spec.ts` quét trang chủ + `/login` của hub × 3 theme (0 vi phạm A/AA) và đo thêm tương phản CHỮ GRADIENT — điểm mù của axe; chính phép đo này bắt tiêu đề hub chỉ đạt 1,27:1 ở theme sáng (đã sửa). Changelog `0599` gom MỌI chữ gradient (hub + hai con số band điểm của app) về `packages/core-ui/gradientText.ts`, đo tĩnh ở 3 theme × 3 bề mặt, sửa thêm hai con số điểm ~1,5:1 ở theme sáng và điểm thấp bài viết 3,28:1 ở theme tối.
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
- ✅ **[2026-09-15 — ĐÃ TRẢ, xem `docs/changelog/0334-2026-09-15-on-dinh-test-python3.md`] `packages/subject-programming/lessonsPython.test.ts` (ca `p5-s2`) flaky dưới tải toàn suite.** Nguyên nhân thật KHÔNG phải `timeout: 15_000` của `execFileSync` mà là: hằng số `PYTHON_TEST_TIMEOUT_MS = 30_000` chỉ được truyền cho 2 trong 4 khối `it.each` sinh tiến trình `python3`; hai khối còn lại (Predict, milestone check — nơi `p5-s2` nằm) vẫn dùng mặc định 5s của Vitest. Đo lúc máy rảnh: ca chậm nhất của khối CÓ timeout là `p5-u6-l1` 1.866ms (dư 16×), ca chậm nhất của khối KHÔNG có timeout là `p5-s2` 1.604ms (dư 3,1×) — dưới tải song song thì 3,1× không đủ. Đã truyền hằng số cho cả bốn khối, không skip/giảm ca nào. Mục `programmingSrs.test.ts` (2026-09-14) là nợ KHÁC họ — ĐÃ TRẢ ở changelog `0344` (đo lại 2026-10-10: ca "limit cắt đúng số thẻ" 2–5 ms, 3/3 lượt xanh).
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

> Mục này CHỈ giữ nợ **đang mở** (🟡/🔴). Nợ đã đóng (🟢) được dời sang
> `docs/legacy/no-ky-thuat-da-dong.md` (2026-09-01) để file này chỉ nói trạng thái hiện tại —
> đúng vai trò ở mục 2 `CLAUDE.md`. Đóng một món nợ = cắt khối đó dán sang file kia, kèm ngày.

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
  (xác nhận qua `packages/core-billing/usage.test.ts:121,246`) — ✅ **ĐÃ GỠ ở migration `0093`**
  (changelog `0607`, chủ dự án đồng ý 2026-10-11; cả bốn chữ ký của 0017 + 0029). Nhưng **bảng `free_daily_credit` + hàm `grant_daily_bonus_rolling` KHÔNG
  mồ côi** — rà lại code thật 2026-09-19 phát hiện `apps/server/src/api/_lib/quests.ts`
  (`getCurrentStreak`, nhiệm vụ `streak_5` — "học liên tiếp 5 ngày") đọc trực tiếp
  `free_daily_credit.bonus_earned` và PHỤ THUỘC bảng này được ghi tiếp tục mỗi ngày qua lời gọi
  ở `apps/server/src/api/core/progress.ts`. **QUYẾT ĐỊNH: GIỮ NGUYÊN lời gọi
  `grant_daily_bonus_rolling`** — gỡ nó sẽ làm nhiệm vụ streak_5 hỏng âm thầm (không cổng CI nào
  bắt được, vì không có test tích hợp progress.ts→quests.ts). Không còn việc phải làm cho phần
  bảng/hàm chính này.
- ✅ **[ĐÃ ĐÓNG 2026-10-09 — changelog `0558`: seed do SERVER cấp qua token HMAC (`packages/core-auth/attemptToken.ts`, khoá HKDF từ `USER_DATA_MASTER_KEY`), `?action=cefr-dialogue-start` trả đề đã bỏ đáp án, nộp bằng token dùng một lần, câu sai không trả đáp án — đặc tả `docs/specs/2026-10-09-hoi-thoai-cefr-seed-server-cap.md`] [2026-10-09 — rà soát bảo mật changelog `0555`] Kiểm tra hiểu hội thoại CEFR chưa chống
  người đọc mã có chủ ý — CẦN CHỦ DỰ ÁN QUYẾT.** Đợt `0555` đã chặn sửa localStorage và POST giả
  (server chấm lại, mỗi lượt chấm một lần, `/api/progress` lọc `learned|…`). Còn mở: seed do client
  chọn và server trả `correctId`, nên ai đọc mã vẫn tính được đáp án. Phương án: **seed do server
  cấp (HMAC, TTL, dùng một lần) + không gửi `correctId` về client** — đánh đổi một vòng gọi server
  trước khi làm bài và mất lời giải sau khi nộp (có chủ đích sư phạm). Chi tiết: đặc tả
  `docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md` mục ⑤.
- ✅ **[ĐÃ ĐÓNG 2026-10-09 — changelog `0555`: server CHẤM LẠI kiểm tra hiểu qua `POST /api/learning/evidence?action=cefr-dialogue`, chỉ server ghi `learned|…`, `/api/progress` lọc bản client tự khai — đặc tả `docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md`] [2026-09-15 — S11-1, THU HẸP 2026-10-09 `docs/changelog/0548-*.md`] Hội thoại CEFR: "đã học" mới có bằng chứng ở MÁY, server chưa chấm lại.** Phần chính ĐÃ XONG: sau khi xem, người học làm kiểm tra hiểu 3 câu tất định (không tốn lượt AI, hai chiều A/B), đạt ≥ 2/3 → `markDialogueLearned`; mục lục phân biệt chưa xem / đã xem (`english.cefrDialogue`, đang học dở) / đã học (`english.cefrDialogueLearned`) — đặc tả `docs/specs/2026-10-09-hoi-thoai-cefr-bang-chung-da-hoc.md`. Còn mở: bản ghi "đã học" do client khai (cùng mức tin cậy `cefrGrammar`), muốn server chấm lại qua `/api/learning/evidence` thì phải đưa dữ liệu hội thoại lên server.
- ✅ **[ĐÃ ĐÓNG 2026-10-09 — changelog `0550`: `/api/life-synthesis` dựng "Tổng hợp 30 ngày" CHỈ từ bản ghi thật (Học tập 6 môn + Ghi chú), không điểm tổng hợp, câu chữ tất định theo 17 luật có tên, không AI; khối gắn lại trong studio "Kế hoạch" (sau thẻ Workplace Harvester); đặc tả `docs/specs/2026-10-09-tong-hop-da-mien-du-lieu-that.md`] [2026-10-02 — HẠ MỨC từ 🔴 sau changelog `0475`] "Tổng hợp đa miền" (Life Synthesis) chờ
  dữ liệu thật.** Lỗi 🔴 cũ (studio "Tổng kết" hiện điểm "phân tích cuộc sống" BỊA — 88/92/85 —
  giống nhau cho mọi người dùng) đã gỡ: tab không còn, `/api/life-synthesis` trả 501 kèm lời giải
  thích. Thẻ Agent + banner Action Canvas dời sang studio "Kế hoạch". **Muốn bật lại:** nối nguồn
  hoạt động thật (Learning + Ghi chú), bỏ ba miền đã xoá (career/startup/life), VIẾT LẠI phần câu
  chữ của `packages/core-personal/lifeSynthesisService.ts` (nhận xét, khó khăn, khuyến nghị đều
  soạn sẵn) rồi mới gắn lại `LifeSynthesisDashboard`.
- ✅ **[ĐÃ ĐÓNG 2026-10-02 — changelog `0484`: chủ dự án chọn (a) ẩn thẻ — thẻ, service, hợp đồng đã xoá; `/api/wearables-sync` trả 501] [2026-10-02 — phát hiện khi chụp ảnh Tầng 8b ở changelog `0481`] Thẻ "Wearables &
  Circadian Bio-Adaptive MCP" (studio Kế hoạch) hiện số liệu sinh trắc BỊA.**
  `WearablesSyncCard.tsx` gửi lên `/api/wearables-sync` HRV, nhịp tim nghỉ, điểm giấc ngủ, phút
  ngủ sâu đều bằng `Math.random()`, rồi hiện huy hiệu "BIO-SYNC ACTIVE" + nút Apple HealthKit /
  Oura / Garmin — không có tích hợp thiết bị nào. Cùng họ với Echo Shadowing và lab phát âm.
  **Gỡ — chờ chủ dự án chọn:** (a) ẩn thẻ tới khi có tích hợp thật; hoặc (b) cho nhập tay và ghi
  rõ là số tự khai.
- ✅ **[ĐÃ ĐÓNG 2026-10-02 — changelog `0484`: chủ dự án chọn (a) bỏ điểm/band, giữ bài luyện 3 pha với giọng mẫu TTS; POST `/api/echo-shadowing` trả 501] [2026-10-02 — phát hiện khi rà skill `multimodal-realtime-voice-master`, changelog `0479`]
  Studio Thử thách › Echo Shadowing hiện "Band" tính từ số NGẪU NHIÊN.** `EchoShadowingCard.tsx`
  gửi `measuredLatencyMs`/`phonemeAccuracy` bằng `Math.random()` (chú thích ghi sẵn "380 - 460ms",
  "88 - 98%"), server (`echoShadowingService.ts`) tính band từ đó — học viên thấy điểm không đo gì.
  Cùng họ với nợ lab phát âm ngay dưới. **Gỡ — chờ chủ dự án chọn:** (a) bỏ điểm/band, giữ bài
  luyện 3 pha; hoặc (b) đo thật độ trễ + độ khớp âm vị từ bản ghi âm (cần đặc tả).
- ✅ **[ĐÃ ĐÓNG 2026-10-02 — changelog `0484`: chủ dự án chọn (b) bỏ mọi con số, đổi thành thẻ "Gợi ý luyện âm" (`pronunciationHints.ts`); `/api/acoustic-phonetics` trả 501] [2026-10-02 — phát hiện khi rà skill `pedagogy-linguistics-master`, changelog `0478`]
  Studio Thử thách › "Acoustic Phonetics & GOP Lab" hiển thị điểm BỊA cho mọi người dùng.**
  `packages/core-ai/acousticPhoneticsService.ts` (qua `/api/acoustic-phonetics`) đoán âm sai từ
  CHÍNH TẢ của câu đã nhận dạng (`word.includes('th')`…) và tính "Điểm GOP" bằng công thức gán
  cứng (`92 - idx * 3`, lệch thì 48), không đo âm thanh; giao diện vẫn ghi "Điểm GOP Tổng X/100" +
  lưu loát/ngữ điệu dạng %. Cùng loại lỗi với 0473 (STEM) và 0475 (Tổng kết). **Gỡ — chờ chủ dự án
  chọn:** (a) ẩn lab tới khi có chấm âm học thật (forced alignment); hoặc (b) bỏ mọi con số, đổi
  nhãn thành "gợi ý luyện âm" và chỉ giữ ma trận lỗi L1 + mẹo đặt lưỡi.
- ✅ **[ĐÃ ĐÓNG 2026-10-02 — changelog `0485`: miền đã xoá đổi về `general`, mẫu và phân loại chỉ còn learning/work/general] [2026-10-02 — changelog `0480`] Action Canvas dựng nút gán vào miền `career`/`life` đã
  xoá** (`packages/core-personal/actionCanvasService.ts`, mẫu nút). Gỡ cùng đợt với nợ Edge AI bên
  dưới: đổi sang miền còn tồn tại hoặc bỏ trường miền.
- ✅ **[ĐÃ ĐÓNG 2026-10-02 — changelog `0485`: miền đã xoá đổi về `general`, mẫu và phân loại chỉ còn learning/work/general] [2026-10-02 — changelog `0478`] Edge AI phân loại ý định về các miền đã xoá.**
  `classifyIntentEdge` (`apps/dhcb/src/lib/edgeAi/edgeAiService.ts`, regex — không phải model) vẫn
  trả `career`/`startup`/`life` dù ba trụ đã gỡ 2026-09-20. Gỡ: bỏ ba nhánh đó (rơi về `general`)
  và đối chiếu nơi tiêu thụ kết quả.
- ✅ **[ĐÃ ĐÓNG 2026-10-02 — changelog `0483`: chủ dự án chọn (a) chỉ biệt danh, chưa có thì "Học viên #N"] [2026-10-02 — phát hiện khi sửa PvP ở changelog `0482`] Bảng xếp hạng PvP hiện TÊN THẬT
  của người dùng cho mọi người chơi.** `realLeaderboard` (`apps/server/src/api/platform/pvp-arena.ts`)
  lấy top 10 Elo kèm `coalesce(profiles.nickname, users.name)` — ai chưa đặt biệt danh thì lộ tên
  tài khoản (thường là họ tên đầy đủ), không có bước đồng ý tham gia bảng xếp hạng. Đụng dữ liệu
  người dùng thật → **chờ chủ dự án chọn:** (a) chỉ hiện biệt danh, ai chưa có thì hiện "Học viên
  #N"; (b) thêm lựa chọn tham gia/ẩn khỏi bảng xếp hạng; (c) giữ nguyên.
- ✅ **[2026-09-14 → ĐÓNG 2026-09-26, `docs/changelog/0454-*.md`] Nhãn chữ
  trong hoạt ảnh khó đọc ở màn hình 390px.** Đo được **29/150 nhãn dài hơn 24 ký tự** ở cỡ chữ
  11–12 trong viewBox rộng 440 — trên điện thoại chúng co lại rất nhỏ. **KHÔNG phải lỗi mới**:
  bài `ly11-c2-b8` đã như vậy từ trước. Sửa tận gốc phải đụng `packages/core-ui/LessonAnimation.tsx`
  (codemap: 5 file ảnh hưởng) hoặc đặt luật độ dài nhãn cho toàn bộ hoạt ảnh — cần một đợt riêng.
  **Đóng bằng nút "Xem lớn" ở bộ vẽ** (chủ dự án chọn trong 4 phương án, 2026-09-25). Đo lại khi
  đóng mới thấy nợ lớn hơn nhiều so với mô tả gốc: **1.000/1.861 nhãn của 238 hoạt ảnh hiện dưới
  10px** ở màn 390px (SVG thật rộng 358px), tệ nhất 6px (khung Sinh 716 × 118). Hình trong bài giữ
  nguyên; hình nào có chữ nhỏ hơn 10px ở bề rộng hiện tại thì hiện thêm nút "Xem lớn". Nút mở
  `<dialog>` toàn màn hình, tự xoay 90° khi máy dựng đứng mà hình khổ ngang, nên chữ về ≥ 10px kể
  cả khi khoá xoay. Không sửa tay nhãn nào. Cổng: `lessonAnimationZoom.test.ts` +
  `LessonAnimation.test.tsx` + `e2e/lesson-animation-zoom.spec.ts`.

- ✅ **[2026-08-28 → ĐÓNG 2026-09-21 (khảo sát nợ kỹ thuật định kỳ), nay VÔ NGHĨA vì trang đã bị
  xoá] "4 trang trụ Career/Work/Startup/Life vẫn chưa có bản chiều B".** Ba việc chính trong mục
  gốc (Career.tsx hỏi "Số năm kinh nghiệm", Work.tsx/Life.tsx đặt `<Layout>` cuối JSX,
  FeedbackModal.tsx thiếu Escape/bẫy tiêu điểm) đã đóng từ 2026-09-03. Phần còn treo — "4 trang
  trụ chưa có bản chiều B" — bị bỏ quên khi ba trụ Career/Startup/Life bị **XOÁ HẲN** khỏi mã
  nguồn ở đợt 2026-09-20 (`docs/changelog/0389-*.md` gỡ giao diện, `0390-*.md` gỡ backend +
  migration `postgres/migrations/0085_drop_career_startup_life.sql`), chỉ còn trụ `work` dưới
  tên hiển thị "Ghi chú" (`/ghi-chu`). Xác nhận lại 2026-09-21: `find apps -iname "Career.tsx"
-o -iname "Work.tsx" -o -iname "Startup.tsx" -o -iname "Life.tsx"` không trả file nào — không
  còn gì để dịch song ngữ. Đúng loại lệch Tầng 6b (tài liệu điều hành nói một đằng, mã một nẻo):
  đóng bằng cách xoá mục nợ, không phải bằng cách làm bản chiều B cho trang không còn tồn tại.

- ✅ **[2026-09-15 → ĐÓNG 2026-09-15, PR S10-1, `docs/changelog/0332-*.md`] 6 lỗi lifecycle
  voice/AI** (TTS nổ ở trang kế khi rời Companion giữa stream; stream không huỷ được; `tts.ts`
  chốt play-token sau await; mic không release khi `MediaRecorder` ném; `AiHelpPanel` rò hint
  giữa bài) — file:dòng ở spec S10 §②. **Đã trả hết sáu lỗi** (L1–L6), mỗi lỗi một test
  regression viết TRƯỚC và đỏ trên mã cũ: tổng 8 ca đỏ → 8 ca xanh. Hai file test mới
  (`sttServer.test.ts`, `AiHelpPanel.test.tsx`) cho hai file trước nay không có test nào.
  Bài học giữ lại: `stopSpeaking()` chỉ có tác dụng nếu lượt phát chốt "vé" **trước** quãng
  `await` tải audio — rời trang chính là lúc đang tải, nên chốt vé sau await là vô hiệu hoá
  đúng ca duy nhất mà nó cần chặn.

- ✅ **[2026-08-28 → ĐÓNG 2026-09-05, audit toàn diện F3] Repo từng có HAI file cấu hình Nginx mô
  tả cùng một server.** `nginx/dhcb.conf` tự nhận là "cấu hình ĐANG CHẠY THẬT trên VPS", trong khi
  `docs/deploy-vps-ubuntu.md`, `docs/cloudflare-setup.md` và `docs/runbook-dung-vps-moi-tu-dau.md`
  đều hướng dẫn copy `nginx/en-vi.conf`. Audit so hai file: `dhcb.conf` khai TRÙNG `server_name`
  nhưng chỉ có 2 khối `location`, **thiếu** `/api/`, `@express` và cache tài nguyên tĩnh mà
  `en-vi.conf` có (6 khối) — tức bản nghèo hơn hẳn, copy nhầm là mất cache tĩnh + proxy API. Không
  có tài liệu nào trỏ tới nó. **Đã xoá `nginx/dhcb.conf`; `nginx/en-vi.conf` là bản duy nhất.**

<!-- Khối dưới đây (2026-07-20 → 2026-08-21) dời từ PROGRESS.md ngày 2026-09-06: toàn bộ là nợ
     đã đóng / ghi nhận rà soát cũ, không còn mục 🟡/🔴 nào. Giữ nguyên văn để tra cứu. -->

- ~~🟡~~ **[2026-08-18, cập nhật khi fix PR #603] `eslint-plugin-react-hooks` đã ghim TẠM về lại
  `^4.6.2`** (đúng bản trước PR #574) để CI/lint xanh trở lại ngay — bản `7.1.1` mà PR #574 bump
  lên mang theo 5 rule React Compiler mới, làm lộ **73 lỗi trải trên 45+ file**: `set-state-in-effect`
  (48 lỗi — vd `Work.tsx:103`, `WorkKanban.tsx:53`, `packages/core-ui/ThemeProvider.tsx:36`, phần
  lớn các trang `useEffect(() => { loadData() }, [loadData])`), `purity` (10), `exhaustive-deps`
  (10), `immutability` (8), `static-components` (3). Việc còn lại: **mở PR riêng** để (1) nâng lại
  `eslint-plugin-react-hooks` lên `^7.x`, (2) sửa đúng 73 lỗi theo từng rule (không chỉ thêm
  `eslint-disable`) — có thời gian review kỹ vì đụng logic hook ở nhiều trang/component cùng lúc.
  Danh sách file/line đầy đủ: chạy lại `npm run lint` sau khi bump plugin để lấy danh sách mới nhất
  (số dòng có thể lệch do code đã đổi).
- **[Rà soát Dependabot 2026-08-16] Xử lý 9 PR dependency tồn đọng (#550-559): merge 6, đóng 3.**
  Merge (đều CI xanh thật, chỉ thiếu heading PR template nên `metadata` báo sai): `actions/
setup-node` 4→7 (#550), `actions/upload-artifact` 4→7 (#551), `actions/github-script` 7→9 (#552),
  `actions/checkout` 4→7 (#553), nhóm `production-patch` (`jose` 6.2.4→6.2.8, `nodemailer`
  9.0.3→9.0.5, #556), `@sentry/react` 10.63.0→10.70.0 (#558). **Đóng KHÔNG merge** 3 PR có vấn đề
  thật, không phải lỗi CI vặt:
  - **#559 TypeScript 5.9.3→7.0.2** — vi phạm trực tiếp chính sách ghim phiên bản CLAUDE.md mục 6
    ("KHÔNG nâng ... TS"). Đóng ngay, không cần điều tra thêm.
  - **#555 nhóm dev-deps (13 gói)** — `npm ci` fail thật: `eslint-plugin-react-refresh@0.5.4` đòi
    `eslint@^9||^10`, dự án ghim ESLint 8 có chủ đích (chưa chuyển flat config). Không giải được
    mà không nâng ESLint major (cũng bị cấm). Đóng, để dependabot tách PR khác nếu muốn cập nhật
    12 gói còn lại riêng.
  - **#557 vitest 3.2.6→4.1.10** — `npm ci` fail thật: thiếu bump kèm `@vitest/coverage-v8` (vẫn
    ghim `^3.2.6`) → ERESOLVE. Ngoài lỗi kỹ thuật, đây là major bump test runner đang chạy 3415
    test — rủi ro cao, không tự merge dù sửa được xung đột peer. Để owner quyết định thời điểm
    nâng cấp (cần bump đồng thời coverage-v8 + review breaking changes changelog v4).
    Sau đợt xử lý: `rm -rf node_modules && npm ci` sạch, build ✅ typecheck ✅ lint 0 cảnh báo ✅ test
    **3415/3415** ✅ (208 file), `npm audit` **0 lỗ hổng**.

- **[Rà soát tự động 2026-08-09] `npm audit` VỀ 0 LỖ HỔNG lần đầu tiên — mục react-router ở dưới
  ĐÃ ĐÓNG (không còn là nợ), cộng thêm vá 2 advisory mới phát sinh.** Container mới (chưa có
  `node_modules`) → `npm ci` sạch rồi chạy đủ cổng: build ✅ · typecheck ✅ (4 tsconfig) · lint ✅
  (0 cảnh báo) · test ✅ (**164 file / 2982 test**). Không có lỗi type/lint/test nào trong code.
  - **Tin quan trọng: advisory react-router `GHSA-qwww-vcr4-c8h2` đã được GitHub cập nhật ngày
    2026-08-07, NARROW dải ảnh hưởng xuống `>=7.12.0 <7.18.2`** (trước đó ghi "chưa có bản vá nào
    trong dòng 7.x", xem quyết định 2026-08-03 ở dưới) — nghĩa là **`7.18.2` (bản dự án đang dùng
    sẵn) chính là bản đã vá**, không cần đổi gì. Xác nhận qua `npm ls react-router-dom` (đúng
    `7.18.2`) + `npm audit` không còn liệt kê react-router. **Mục "giữ nguyên v7.18.2, chấp nhận
    báo 2 dòng high dài hạn" ở quyết định 2026-08-03 nay LỖI THỜI — đã đóng, không phải chờ nâng
    React 19 như dự tính.**
  - `npm audit` phát sinh **2 advisory mới** (khác hẳn react-router, do hệ sinh thái cập nhật từ
    2026-08-03 tới nay): `js-yaml` 4.0.0–4.3.0 (`GHSA-5p4m-2wfm-xmqj`, quadratic CPU qua `!!omap`)
    nguồn `eslint`/`@commitlint/cli → cosmiconfig`, và `nanoid` `<3.3.17` (`GHSA-2v37-7h3g-55p8`,
    vòng lặp vô hạn khi `size=0`) nguồn `postcss`. Cả hai đều **thuần devDependency** (lint/build
    time), không vào bundle chạy cho người dùng cuối. `npm audit fix` mặc định kéo theo cả loạt
    gói optional platform (`@esbuild/*`, `@img/sharp-libvips-*`) không liên quan — thay vào đó
    thêm `overrides` trong `package.json` (`js-yaml` `^4.3.1`, `nanoid` `^3.3.18`) rồi `npm
install`, chỉ đổi 2 dòng version trong `package-lock.json`. Xác nhận lại `npm audit`: **0 lỗ
    hổng** (`prod` 239 · `dev` 551 · `optional` 83, tổng 790 gói). Đã chạy lại đủ 4 cổng
    (build/typecheck/lint/test) sau khi đổi, vẫn xanh 100%.
  - Đã sửa `.claude/report-status.sh` mục nợ #1 (không còn ghi "2 dòng high react-router báo lâu
    dài" — đã đóng) để phiên sau không đọc phải thông tin lỗi thời.
  - PR trước của nhánh này (#525) đã merge & xoá nhánh remote trước khi phiên này bắt đầu — theo
    đúng quy ước "tạo PR = coi như đã xong" (CLAUDE.md mục 3): nhánh `claude/jolly-mendel-h56pdm`
    khởi động lại từ `origin/main` (lúc đó trùng khớp HEAD, không có commit lạc), coi lượt này là
    chu kỳ mới trên cùng tên nhánh.

- **[2026-08-04] Luật a11y mới + ĐÃ TRẢ HẾT nợ tương phản AAA.** Luật (CLAUDE.md mục 4.5, theo
  khuyến nghị W3C _Understanding Conformance_): **nội dung & tiêu đề đạt AAA (≥ 7:1)**, **mọi phần
  còn lại đạt AA**. Hai cổng E2E chặn CI, cả hai TUYỆT ĐỐI (không còn baseline):
  - `e2e/a11y.spec.ts` — 0 vi phạm A/AA ở MỌI mức tác động (trước chỉ chặn critical + serious mới),
    thêm tag `wcag22aa`, mở rộng **cả 5 theme** cho mọi trang + trang đăng nhập. 122 test xanh.
  - `e2e/a11y-aaa.spec.ts` (mới) — 15 trang × 5 theme, lọc riêng phần tử nội dung/tiêu đề. 75 test xanh.
  - Nợ tương phản AAA ban đầu **~305 phần tử** (Pink 115 · Nhi đồng 115 · Rực rỡ 48 · Blue sky 26 ·
    Xanh đêm 1) đã **xử lý xong**: gốc rễ chỉ là 2 token `--z-300`/`--z-400` (`text-zinc-300/400`)
    của từng theme trong `apps/english/src/index.css` — chỉnh sắc độ cho đạt 7:1 trên nền sáng nhất
    (theme sáng) / tối nhất (theme tối) là hết. Giá trị mới: dark-blue z-400 `158 173 191` ·
    blue-sky z-400 `64 78 96` · pink z-300 `82 68 76` z-400 `89 75 83` · vibrant z-400
    `190 172 216` · kid z-300 `98 72 45` z-400 `101 75 48`.
- **[2026-08-04] 3 lỗi AA THẬT do cổng siết + quét đủ 5 theme phát hiện (đã sửa):**
  1. 4 nút vote 👍/👎 (Chat, Speaking) rớt `target-size` (WCAG 2.2 AA 2.5.8) → `tap-44` → `h-11 w-11`.
  2. Nút hiện/ẩn mật khẩu ở `/login` chỉ 20×20px → `h-8 w-8` (32px, nằm gọn trong `pr-11` của ô nhập).
  3. **Nặng nhất:** 3 nút OAuth (Facebook/Apple/Microsoft) ở `/login` dùng `text-white` — mà `white`
     map sang token `--c-white`, ở theme nền sáng token này bị ĐẢO thành màu tối → chữ tối trên nền
     thương hiệu tối, tương phản chỉ **1.17–1.33:1**, gần như không đọc được với người dùng theme
     Blue sky/Pink/Nhi đồng. Sửa: dùng `text-[#fff]` (trắng thật). Nút Facebook đổi `#1877F2` →
     `#1772E8` để chữ trắng đạt 4.5:1 (bản gốc 4.23:1).
     Cả 3 đều là lỗi có thật với người dùng, cổng cũ (chỉ chặn critical + serious mới, 4 theme, không
     quét `wcag22aa`) không bắt được.
- ~~**Nợ mới chưa xử lý:** tiện ích `.tap-44` mở rộng vùng chạm bằng `::after` có
  `pointer-events: none`~~ **✅ ĐÃ TRẢ (2026-08-08).** Xem mục "Đợt trả nợ kỹ thuật 2026-08-08" ở đầu file.
- ~~🟡 **Token `--z-500` rớt WCAG AA ở gần như mọi nền, mọi theme**~~ **✅ ĐÃ TRẢ (2026-08-08)** trên
  mọi bề mặt thật (z-950/900/800); chỉ còn nhóm nền `z-700` giữ trong `KNOWN_LOW` CÓ CHỦ Ý. Xem mục
  "Đợt trả nợ kỹ thuật 2026-08-08" ở đầu file.
- ~~🟢 **3 chu trình import trong `apps/english/src/data/`**~~ **✅ ĐÃ TRẢ (2026-08-08)** — thực tế
  lúc bắt tay vào làm là **5 chu trình** (có thêm 2 cái trong `lib/` dính logic chạy thật, phát sinh
  sau lần ghi nhận 2026-08-04). Nay `npm run codemap -- cycles` báo 0.

- **[Rà soát tự động 2026-08-03, phiên sau PR #462]** `npm ci` sạch (container mới, chưa có
  `node_modules`) rồi chạy đủ cổng commit: build ✅ · typecheck ✅ (4 tsconfig) · lint ✅ (0 cảnh
  báo) · test ✅ (**149 file / 2414 test**, tăng nhiều so với lượt trước vì các PR listening/story
  mới đã merge). Không có lỗi type/lint/test mới trong code.
  - `npm audit` sau `npm ci` báo **3 lỗ hổng high** — nhiều hơn 2 dòng đã chốt ở mục ngay dưới, vì
    phát sinh THÊM 1 advisory mới: `fast-uri` 3.0.0–3.1.4 (`GHSA-7p8r-x3mc-p8w7`, host confusion
    qua backslash). Nguồn: `@commitlint/cli → @commitlint/load → config-validator → ajv@8.20.0 →
fast-uri` — thuần devDependency (commitlint hook), không vào bundle chạy cho người dùng cuối.
    Có bản vá không phá vỡ gì trong dải semver cũ → chạy `npm audit fix` (không dùng `--force`),
    nâng `fast-uri` `3.1.4` → `3.1.5`, chỉ đổi `package-lock.json` (không đổi `package.json`).
    Xác nhận lại `npm audit`: về đúng **2 lỗ hổng** (react-router, xem mục dưới — quyết định giữ
    nguyên đã chốt, không đổi gì thêm ở đây).
  - Đây là việc lặp lại theo lịch (audit định kỳ bắt kịp advisory mới của hệ sinh thái), không
    phải lỗi bỏ sót trước đó — bản thân advisory `fast-uri` mới được công bố sau lượt audit PR
    #462. Không có thay đổi code nghiệp vụ nào trong lượt rà soát này.

- **[2026-08-03] Lỗ hổng npm: ĐÃ VÁ 3/4, mục react-router ĐÓNG LẠI bằng quyết định "không nâng"
  (người dùng chốt phương án A).** PR #462. `npm audit`: **5 lỗ hổng → 2** (2 con số còn lại là
  cùng MỘT advisory react-router, xem ngay dưới).
  - Đã vá, **không nâng major gói nào**: `postcss` 8.4.x → **8.5.25** (Path Traversal source map,
    `GHSA-r28c-9q8g-f849`, high) · `brace-expansion` → **1.1.18/2.1.4/5.0.9** (DoS tràn bộ nhớ,
    `GHSA-mh99-v99m-4gvg`, high) · `esbuild` 0.27.7 → **0.28.1** (đọc file tuỳ ý ở dev server trên
    Windows, `GHSA-g7r4-m6w7-qqqr`, low). Cả 3 đều chỉ chạy lúc **build/dev**, không nằm trong
    bundle chạy trên trình duyệt người dùng.
  - `package.json` chỉ đổi đúng 1 dòng: `vite` `7.3.5` → `7.3.6` — **bản vá (patch), vẫn nằm trong
    dải `^7.3.5` cũ**, không vi phạm quy tắc GIỮ NGUYÊN PHIÊN BẢN (CLAUDE.md mục 6). Cần thiết vì
    vite 7.3.5 khoá cứng `esbuild@^0.27.0`; 7.3.6 mới nới sang `^0.27.0 || ^0.28.0` để
    `npm update esbuild` dedupe được về bản đã vá. Ba gói còn lại vá trong dải semver sẵn có nên
    chỉ `package-lock.json` đổi.
  - ⚠️ **ĐÍNH CHÍNH ghi chú rà soát 2026-08-01 phía dưới** (dòng "`npm audit fix` không giải quyết
    dứt điểm 2 mục high vì cần nâng major `eslint`/`tailwindcss`/`vite`"): kết luận đó **SAI/đã lỗi
    thời**. Chạy lại thực tế ngày 2026-08-03 thì cả 2 mục high vá được mà **không cần nâng major
    gói nào** — các gói thượng nguồn đã phát hành bản vá trong dải semver cũ kể từ ngày ghi chú đó.
  - 🔒 **`react-router` (`GHSA-qwww-vcr4-c8h2`, high): QUYẾT ĐỊNH GIỮ NGUYÊN `7.18.2`, KHÔNG nâng.
    Đây là quyết định có chủ đích, không phải việc còn tồn.** Người dùng chốt 2026-08-03 sau khi
    cân nhắc 3 dữ kiện đã kiểm chứng:
    1. **Không ảnh hưởng dự án này.** Advisory ghi rõ _"This only affects your application if you
       are using the unstable RSC APIs."_ Đã grep xác nhận repo không dùng RSC, không dùng
       `RouterProvider`/`createBrowserRouter` — `App.tsx` dùng `BrowserRouter` thuần (SPA).
    2. **Bản vá duy nhất là react-router `8.3.0`**, không có bản vá nào trong dòng 7.x. Mà **v8 yêu
       cầu React `19.2.7+`** (tài liệu chính thức `reactrouter.com/upgrading/v7`) — dự án đang React
       `18.3.1`, nâng react-router ⇒ **buộc nâng React 18 → 19**, đúng thứ CLAUDE.md mục 6 cấm.
       v8 cũng **xoá hẳn gói `react-router-dom`** → 32 file phải đổi import sang
       `react-router` / `react-router/dom`.
    3. `npm audit fix --force` không phải là "nâng" — nó **HẠ CẤP** về `react-router-dom@7.11.0`
       (lùi 7 minor, mất tính năng).
       → Đổi React 18 → 19 để vá một lỗ hổng ở code path app không hề chạy là cái giá không đáng.
       **`npm audit` sẽ còn báo 2 dòng high này lâu dài — đó là kỳ vọng, không phải việc bỏ sót.**
       Xem lại quyết định khi nào: nếu dự án sau này dùng RSC/data router, hoặc khi có lý do độc lập
       để nâng React lên 19.

- **[Rà soát tự động 2026-08-03]** Chạy lại đầy đủ cổng commit sau `npm ci` sạch: build ✅ ·
  typecheck ✅ (4 tsconfig: gốc/api/e2e/`apps/hub`) · lint ✅ (0 cảnh báo) · test ✅ (**103 file /
  1683 test**). Không có lỗi code mới. `npm audit`: **5 lỗ hổng (4 high, 1 low)** — khớp đúng dự
  đoán ở mục nâng cấp react-router bên dưới (2 high cũ `postcss`/`brace-expansion` + 1 high mới
  `react-router` CSRF RSC Mode + 1 low `esbuild`), không phát sinh gì ngoài dự kiến. Phát hiện 1
  tài liệu lỗi thời: `.claude/report-status.sh` dòng nợ kỹ thuật #1 vẫn ghi react-router "chưa
  nâng cấp" dù đã nâng lên v7.18.2 từ 2026-08-02 — đã sửa lại đúng hiện trạng (hết 2 CVE moderate
  cũ, chấp nhận 1 cảnh báo high mới vì app không dùng RSC Mode). E2E Playwright vẫn KHÔNG chạy
  được trong sandbox này (không có `.env`/Postgres thật) — như các lượt rà soát trước.
  ⚠️ **Số liệu `npm audit` trong mục này đã bị thay thế** bởi mục 2026-08-03 ngay phía
  trên (PR #462 đã vá 3/4 lỗ hổng, còn 2). Giữ lại nguyên văn làm bản ghi lịch sử của lượt
  rà soát lúc 00:13 cùng ngày, không phải hiện trạng.

- **[2026-08-02] react-router: ĐÃ NÂNG LÊN v7 (phương án 1 bước), package.json đổi
  `react-router-dom` `^6.24.1` → `^7.18.2`.** Cổng commit đạt đủ: build ✅ · typecheck ✅ (4
  tsconfig) · lint ✅ (0 cảnh báo) · test ✅ (103 file / 1473 test) · dev server khởi động sạch
  (HTTP 200, không lỗi console). Không sửa file nào khác ngoài `package.json`/`package-lock.json`
  — đúng như dự đoán trong đặc tả (Declarative Mode, không data router/loader/action/`<Outlet>`).
  **Lưu ý audit:** `npm audit` hết 2 CVE moderate cũ, nhưng phát sinh 1 cảnh báo **high** MỚI
  (`GHSA-qwww-vcr4-c8h2`, CSRF trong **RSC Mode** — React Server Components, dải
  `>=7.12.0 <8.3.0`) — **chưa có bản vá nào** (react-router v8 chưa phát hành trên npm tính đến
  2026-08-02). App này **không dùng RSC Mode** (không `react-router.config.ts`, không action
  route) nên không khai thác được thực tế — chấp nhận cảnh báo audit này, sẽ tự hết khi có bản vá
  phát hành và nâng tiếp. **Chưa chạy E2E Playwright** (cần Postgres thật, sandbox không có) — cần
  chạy trước khi merge như cổng merge CLAUDE.md mục 9 yêu cầu. Kế hoạch gốc + đánh giá "chuyển
  sang data router/loader/action/SSR" (đã đề xuất KHÔNG làm — chi phí lớn, lợi ích nhỏ vì app hầu
  hết sau đăng nhập, VPS 1 vCPU không nên tăng tải server-render) ở
  `docs/research/dac-ta-nang-cap-react-router-v7-2026-08-02.md`. Trước đó
  chọn phương án trước khi làm.
- **[2026-08-02] `restore:r2 -- --restore-into`: đã viết runbook kiểm thử, CHỜ BẠN TỰ CHẠY TRÊN
  VPS.** Sandbox Claude Code web không có Docker daemon/mạng tới VPS nên không tự test được nhánh
  phá huỷ dữ liệu tại đây. Đã soạn quy trình 7 bước an toàn (dùng database TẠM
  `english_tutor_restore_test`, không đụng `english_tutor` production) ở
  `docs/kiem-thu-restore-into-staging.md` — gồm đối chiếu số liệu trước/sau, dọn dẹp, và lý do cố
  tình KHÔNG tự động hoá thành 1 script (cần người đọc log/phán đoán chênh lệch số liệu).
- **[Audit toàn diện 2026-08-01 — phát hiện mới]** Tầng 1–6 theo `docs/framework/QUY-TRINH-AUDIT.md`
  đều đạt (build/typecheck/lint/format/1033 test/bundle-size ✅, 0 secret hardcode, 0 high/critical
  `npm audit`, coverage 52.94/87.02/79.93/52.94% vượt sàn 48/87/76/48). Nợ còn lại:
  - ~~🟡 `react-router`: 2 lỗ hổng **moderate** (CVE-2025-68470 bypass + arbitrary constructor
    injection qua `deserializeErrors()`), có fix qua `npm audit fix` — chưa nâng cấp, cần kiểm tra
    không phá route trước khi merge (đổi major/minor react-router-dom).~~ **[Lỗi thời]** 2 CVE
    moderate này đã hết khi nâng lên react-router v7 (2026-08-02). Advisory react-router hiện tại
    là `GHSA-qwww-vcr4-c8h2` (high, RSC Mode) — **đã quyết định giữ nguyên, xem mục đầu 2026-08-03.**
  - ~~🟡 `restore:all`/`restore:system`/`restore:r2`: nhánh `--restore-into <db> --yes` CHƯA test
    thật~~ **✅ ĐÃ KIỂM CHỨNG (2026-08-08)** trên cụm Postgres 16 nháp — xem mục "Đợt trả nợ kỹ
    thuật 2026-08-08" ở đầu file. Vẫn giữ nguyên khuyến cáo vận hành: chạy lần đầu trên database
    phụ/staging, không thử trực tiếp trên `english_tutor` production.
  - Đã sửa 2 lỗi tài liệu lỗi thời tìm thấy: `.claude/report-status.sh` (hardcode text cũ báo sai
    Sentry/thanh toán Pro/branch protection/migration Supabase "chưa xong" dù đã xong từ lâu) và
    `docs/framework/QUY-TRINH-AUDIT.md` (ngưỡng CSS bundle ghi 9.7kB thật là 11kB, ngưỡng coverage
    ghi số đo 2026-07-02 đã lỗi thời so với `vitest.config.ts` hiện tại).
  - 2 test a11y (`/progress`, `/profile` theme blue-sky) fail 1 lần do "Execution context destroyed"
    (Playwright flaky khi nhiều test a11y chạy song song dội rate-limit) — chạy lại riêng cả 24 test
    theme blue-sky đều pass, không phải lỗi a11y thật, không cần xử lý thêm.

- **[Rà soát tự động 2026-08-01, phiên sau]** Chạy lại đầy đủ cổng commit: build ✅ · typecheck ✅
  (4 tsconfig: gốc/api/e2e/`apps/hub`) · lint ✅ (0 cảnh báo) · test ✅ (**103 file / 1249 test** — tăng
  từ 1033 vì nội dung Nghe + đối chiếu SGK mới thêm sau ngày ghi audit ở trên). Không có lỗi code mới.
  **Đính chính `npm audit`:** dòng "0 high/critical" ở mục audit toàn diện phía trên **đã lỗi thời** —
  chạy lại `npm audit` ngay bây giờ ra **5 lỗ hổng: 2 high, 2 moderate, 1 low** (advisory database
  npm cập nhật liên tục trong ngày, không phải do code đổi):
  - 🔴 `postcss` (phụ thuộc TRỰC TIẾP qua Tailwind, high, `GHSA-r28c-9q8g-f849`) — Path Traversal khi
    tự nạp source map (`sourceMappingURL`) lộ file `.map` tuỳ ý. Chỉ chạy lúc BUILD, không lọt vào
    bundle chạy trên trình duyệt người dùng — rủi ro thực tế thấp nhưng nên nâng khi có bản vá
    tương thích Tailwind 3.
  - 🔴 `brace-expansion` (gián tiếp qua `eslint`/`glob`, high) — DoS bộ nhớ, chỉ ảnh hưởng tool dev,
    không chạy trên server production.
  - 🟢 `esbuild` (gián tiếp qua Vite, low) — chỉ ảnh hưởng dev server chạy trên Windows.
  - `react-router`/`react-router-dom` (moderate) — vẫn là mục đã biết ở trên, chưa đổi.
  - ~~`npm audit fix` (không `--force`) KHÔNG giải quyết dứt điểm 2 mục high vì bản vá nằm sâu trong
    cây phụ thuộc của `eslint`/`tailwindcss`/`vite` — cần nâng major các gói này mới hết, trái quy
    tắc "GIỮ NGUYÊN PHIÊN BẢN" (CLAUDE.md mục 6) nên CHƯA tự làm, cần người dùng quyết định trước.~~
    ⚠️ **[SAI — đã đính chính 2026-08-03, xem mục đầu "Nợ kỹ thuật còn mở"]** Chạy lại thực tế cho
    thấy cả 3 mục (`postcss`/`brace-expansion`/`esbuild`) vá được mà **KHÔNG cần nâng major gói
    nào**; đã vá xong ở PR #462.
  - E2E (Playwright) KHÔNG chạy trong lượt rà soát này (môi trường phiên không có `.env`/Postgres để
    kết nối) — chỉ xác nhận cổng commit, chưa phải cổng merge đầy đủ.

- **PM2 cluster mode: ĐÃ XÁC NHẬN chạy đúng cơ chế trên VPS thật (2026-07-25),
  nhưng hiệu quả bị giới hạn bởi phần cứng — xem cuối mục.** (nhánh
  `claude/project-100k-active-users-8292zf`, đặc tả `docs/research/dac-ta-gd1-scale-30k.md`
  Việc A + fix PR #322.) Bối cảnh: PM2 cluster mode ĐÃ ROLLBACK
  về fork mode (2026-07-20, PR #285) vì PR #283/#284 làm worker crash im lặng khi chạy thật
  trên VPS (Node `cluster` module không tương thích loader ESM `--import tsx`). Lần này gỡ
  ĐÚNG nguyên nhân: thêm `tsconfig.server.json` + script `build:server` (`npm run build` gọi
  kèm) biên dịch `server.ts` + `api/**/*.ts` sang JS thật ở `dist-server/` (ESM/NodeNext,
  đã phải thêm đuôi `.js` vào ~150 import tương đối trong `api/` cho đúng chuẩn Node ESM).
  `ecosystem.config.cjs` đổi `script: './dist-server/server.js'` (bỏ `interpreter: tsx`),
  `instances: 'max'`, `exec_mode: 'cluster'`. Phát hiện thêm khi build thật: `server.ts` +
  `api/_lib/dictionaryData.ts` dùng `__dirname`/`import.meta.url` để tìm `dist/` (frontend),
  `uploads/`, `public/data/dictionary/` — các đường dẫn này SẼ SAI khi tính từ vị trí file đã
  biên dịch (nằm trong `dist-server/`), đã sửa sang `process.cwd()` (ổn định vì PM2 luôn cwd
  = gốc repo). **Đã kiểm chứng trong sandbox dev**: `node dist-server/server.js` chạy
  standalone, `/api/health` 200, `/api/dictionary` đọc đúng 12.168 từ.

  **[Cập nhật 2026-07-25, xác nhận trên VPS thật]** Deploy đầu tiên sau merge PR #321 phát hiện
  `pm2 reload` không đổi được `exec_mode` của process đang chạy (log vẫn `ids: [ 1 ]`, cluster
  mode chưa hề áp dụng) — đã vá bằng PR #322 (`scripts/pm2-reload.sh` tự phát hiện lệch
  exec_mode → `pm2 delete` + `pm2 start`; đồng thời bật `wait_ready`/`kill_timeout` cho
  zero-downtime thật). Deploy tiếp theo (commit `d801a8e`, run
  [30154933490](https://github.com/seeker19110/bilingual-english-vietnamese/actions/runs/30154933490))
  xác nhận log đúng như thiết kế: phát hiện đổi `fork_mode → cluster_mode`, xoá + start lại,
  health check OK sau 1s.

  **[Lúc đó] log PM2 báo `App [english-tutor] launched (1 instances)`** — dù cấu hình
  `instances: 'max'`, chỉ có đúng 1 tiến trình được tạo, vì VPS lúc đó chỉ có 1 vCPU (`'max'` =
  số core thật của máy).

  **[Cập nhật 2026-08-21] VPS ĐÃ NÂNG CẤP LÊN 3 vCPU / 3GB RAM** (người dùng xác nhận). Theo
  CLAUDE.md mục 13 (cập nhật 2026-08-19), PM2 đang chạy **cluster mode 3 instances thật** tận
  dụng cả 3 core, cùng `REDIS_URL` cho rate-limit tập trung (mục ngay bên dưới) — nghĩa là lợi
  ích song song thật ĐÃ CÓ, không còn bị giới hạn bởi phần cứng như trước. Nợ kỹ thuật này coi
  là **đã đóng hoàn toàn** (cả cơ chế lẫn phần cứng).

  **[Cùng ngày 2026-08-21] Tên tiến trình PM2 đổi từ `english-tutor` sang `dhcb`** (người dùng
  xác nhận đã đổi thật trên VPS). Đã đồng bộ lại trong repo: `ecosystem.config.cjs` (`name`),
  `scripts/deploy.sh` + `scripts/pm2-reload.sh` (`PM2_PROCESS`), `scripts/diagnose-502.sh`, và
  các docs vận hành trực tiếp dùng lệnh `pm2 ...`/đường dẫn `/var/www/...`:
  `docs/deploy-vps-ubuntu.md`, `docs/system-requirements.md`,
  `docs/runbook-platform-v2-production-deployment.md`, `docs/setup-postgresql-vps.md`,
  `docs/ke-hoach-khoi-phuc-su-co-server.md`, `docs/cloudflare-setup.md`, `docs/DEPLOY.md`,
  `docs/rollback-runbook.md`, `docs/runbook-dung-vps-moi-tu-dau.md`,
  `docs/huong-dan-lien-ket-facebook-apple-microsoft.md`, `docs/huong-dan-tu-host-scale-50k.md`,
  `docs/email-setup.md`.

  **[Cập nhật tiếp, cùng ngày] Đã xác minh + dọn xong mục database.** Trên VPS thật có SONG SONG
  2 database (`sudo -u postgres psql -l+`): `dhcb` (356MB, 41 bảng) và `english_tutor` (301MB, 40
  bảng, cùng 18 users) — số liệu gần giống nhau vì `english_tutor` là **bản sao/rác còn sót lại
  từ lúc đổi tên trước đây**. Xác nhận DB thật app đang dùng qua `DATABASE_URL` trong `.env`:
  `postgresql://tutor_app:...@localhost:5432/dhcb` → **`dhcb` mới là DB sống, `english_tutor` là
  rác**. Đã xử lý: backup phòng hờ (`pg_dump english_tutor | gzip > /var/backups/english_tutor-
truoc-khi-xoa-20260821.sql.gz`), xác nhận 0 kết nối đang dùng
  (`pg_stat_activity`), rồi `dropdb english_tutor` — VPS giờ chỉ còn đúng 1 database `dhcb`. Đã
  sửa nốt `docs/ke-hoach-khoi-phuc-su-co-server.md` + `docs/setup-postgresql-vps.md` (toàn bộ
  lệnh `pg_dump`/`dropdb`/`createdb`/`psql -d`/`--restore-into`/tên file backup `*.sql.gz` đổi từ
  `english_tutor` sang `dhcb`; **role `tutor_app` giữ nguyên** — đó là role Postgres thật đang
  dùng, không phải tên cần đổi). Role name khác database name là chủ ý của hệ thống, không phải
  lỗi.

  Còn lại **2 chỗ chưa đổi**, không thuộc hạ tầng vận hành nên chưa cần gấp: (1) tên GitHub repo
  `seeker19110/english-tutor` trong `docs/CODEX_CLOUD_SETUP.md` (khác `seeker19110/dhcb`
  đang dùng thật — có thể là repo cũ trước khi đổi tên, cần người dùng xác nhận có còn dùng
  không); (2) tên gọi dự án "english-tutor" trong `docs/MASTER_SPEC.md` dòng mở đầu (mang tính mô
  tả lịch sử dự án, không phải định danh hạ tầng).

  **[Hoàn tất, cùng ngày] Đã merge + deploy thật lên VPS, xác nhận qua `pm2 list`.** PR #614
  (đổi tên PM2 + dọn DB) merge vào `main` bằng squash (commit `e2477d4`) sau khi vá 2 lỗi CI
  không liên quan tới nội dung đổi tên: (1) PR body thiếu mục bắt buộc khi chuyển draft → ready
  (gate `metadata`) — bổ sung đủ 6 mục theo template; (2) `quality` fail 2 lần vì lỗi format
  Prettier — lần 2 do **lệch phiên bản Prettier** giữa `npx` cache cũ (3.8.1) và bản khai trong
  `package.json` (^3.9.6, đúng bài học CLAUDE.md mục 8 "công cụ phải khớp lockfile"), sửa bằng
  `npm ci` rồi format lại. **Phát hiện phụ, chưa xử lý**: gate coverage của `quality`
  (branches ≥90%) đang FAIL LIÊN TỤC trên `main` qua rất nhiều commit gần đây (89.23%, thấp hơn
  ngưỡng) — không phải lỗi do PR này, là nợ kỹ thuật có sẵn ảnh hưởng mọi PR, `merge_pull_request`
  vẫn cho qua nên `quality` không phải required status check chặn merge trên branch protection
  hiện tại (khác mô tả ở CLAUDE.md mục 13 "CI check quality/e2e xanh"). Cần người dùng quyết định
  có ưu tiên vá coverage hay không.

  Sau merge, người dùng tự chạy trên VPS: `git pull origin main` → `npm ci && npm run build` →
  `pm2 delete english-tutor` → `pm2 start ecosystem.config.cjs` → `pm2 save`. Kết quả xác nhận
  **cả 3 tiến trình `dhcb` chạy `cluster`/`online`**, `english-tutor` đã biến mất khỏi `pm2 list`,
  health check `/api/health` trả `{"status":"ok"}`. Site production đã khôi phục hoàn toàn sau
  sự cố 502 (do 3 tiến trình `english-tutor` cũ bị crash-loop hết `max_restarts` trước khi đổi
  tên — nguyên nhân gốc chưa xác minh kỹ vì standalone `node dist-server/server.js` chạy hoàn
  toàn ổn không lỗi, nhiều khả năng do PM2 exec_mode/wait_ready chưa khớp cấu hình cũ, không phải
  lỗi code).

  Việc còn lại thuộc GĐ2 scale xa hơn (nếu
  cần vượt quá 3 vCPU cho mục tiêu 30k-50k concurrent) là quyết định mở rộng tiếp theo, không
  còn là nợ kỹ thuật cấp thiết.

  Cũng cần đặt `REDIS_URL` (xem mục ngay bên dưới — rate limit chuyển sang Redis) trước khi bật
  cluster mode nhiều tiến trình thật (sau khi thêm VPS ở GĐ2), không thì rate limit lỏng hơn N
  lần (N = số tiến trình).

- **Rate limit chuyển từ `Map` in-memory sang Redis khi có `REDIS_URL` (2026-07-25, Việc B
  cùng đặc tả trên).** `api/_lib/security.ts` `checkRateLimit()` giờ là async: có
  `REDIS_URL` → đếm atomic qua Lua script (INCR + PEXPIRE có điều kiện) dùng chung mọi tiến
  trình/máy; không có (hoặc Redis lỗi) → fallback `Map` in-memory y hệt hành vi cũ
  (FAIL-OPEN, không bắt buộc — dev/local không cần Redis). Đã thêm dependency `ioredis`.
  **Chưa kiểm chứng** bằng Redis thật nhiều tiến trình (sandbox không có Redis server) — cần
  xác nhận trên VPS cùng lúc với cluster mode ở trên.
- ~~**E2E `mockLogin` không còn khớp luồng đăng nhập thật**~~ **ĐÃ TRẢ XONG (PR #282,
  2026-07-20)** — `e2e/helpers/auth.ts` nay gieo đúng key Bearer token
  (`gsa_session_token_v1`) VÀ dùng `page.route()` chặn `GET /api/auth?action=me` trả profile
  giả. Dòng cũ ghi "chưa làm" đã lỗi thời (viết trước PR #282, xác nhận lại 2026-07-20 khi
  quét toàn diện nợ kỹ thuật).
- ~~**2 script deploy trùng lặp**~~ **ĐÃ GỘP (2026-07-20, người dùng xác nhận giữ
  `scripts/deploy.sh`)** — xóa hẳn `deploy.sh` gốc repo (kém đầy đủ hơn); `.github/workflows/
deploy.yml` không còn tự inline các bước, nay gọi thẳng `bash scripts/deploy.sh` (1 nguồn
  chân lý duy nhất cho cả thủ công lẫn tự động). Đã cập nhật mọi doc còn nhắc `deploy.sh` gốc
  (`docs/DEPLOY.md`, `docs/deploy-vps-ubuntu.md`, `DEPLOY_STEPS.md`, `CLAUDE.md`).
- ⚠️ **[Ý tưởng, 2026-07-30] Phòng chat cho bạn bè cùng luyện tập** — ghi "chưa làm, mới bàn sơ
  bộ" nhưng mục `packages/core-chat/redisChat.ts` + `packages/core-chat/wsHandler.ts` ở TRÊN
  trong file này mô tả WebSocket + Redis pub/sub đã code xong (route `/ws/chat`, moderation,
  presence…) — **hai đoạn mâu thuẫn nhau, cần phiên sau xác minh lại tính năng chat bạn bè đã
  triển khai tới đâu thật sự** trước khi coi đây còn là "ý tưởng chưa làm". Ràng buộc phần cứng
  cũ (VPS 1 vCPU, chưa có Redis) đã hết hiệu lực: VPS nay 3 vCPU + `REDIS_URL` đã điền
  (2026-08-21).
- Không còn hạng mục a11y/kiểm thử lớn nào mở. Xem "Tiếp theo" ở trên cho việc sản phẩm còn dở.
- `docs/research/thu-thach-vlog-30-ngay.md` dùng tên cũ "Vlog" (tính năng đã đổi tên thành
  "Challenge" — route `/challenge`, bảng `challenge_entries`) — tài liệu đó là ghi chép lịch sử
  tại thời điểm merge, cố ý giữ nguyên tên cũ, không phải lỗi.
- **Kế hoạch khôi phục sự cố server (2026-07-25).** Thêm
  `docs/ke-hoach-khoi-phuc-su-co-server.md` — quy trình ứng phó tổng thể khi server sập/gặp sự
  cố (chẩn đoán nhanh, phân loại theo triệu chứng, xử lý từng kịch bản: VPS không phản hồi, PM2
  crash, hết ổ đĩa, Postgres lỗi, restore backup, SSL hết hạn, quá tải/DDoS, nghi bị xâm nhập —
  kèm checklist xác minh + mẫu post-mortem). Khác `docs/DEPLOY.md` (deploy + fix nhanh) và
  `docs/rollback-runbook.md` (rollback cấu hình theo PR cụ thể) — 3 file bổ sung nhau, không
  trùng. Đã liệt kê "cải tiến nên cân nhắc" cần người dùng quyết định (chưa tự làm): uptime
  monitoring tự động, điền DSN Sentry, tăng tần suất backup Postgres, và điền thông tin liên hệ
  khẩn/nhà cung cấp VPS vào bảng đầu file (việc duy nhất người dùng cần tự điền tay).

- **[Audit toàn diện 2026-08-08] Tầng 1–3 đạt hết, không phát hiện lỗi mới; thêm hook
  `useMountedRef` chặn setState sau unmount ở Chat/Speaking (PR #514 → đã MERGE, commit
  `e5a371d`).** Chạy lại đầy đủ cổng: build ✅ · typecheck ✅ (4 tsconfig) · lint ✅ (0 cảnh
  báo) · format ✅ · test ✅ **162 file / 2947 test** (trước khi thêm test mới) · bundle-size ✅
  JS 96.32/123kB · CSS 10.46/11kB (brotli) · `npm audit --omit=dev` **0 lỗ hổng** (production
  deps sạch hoàn toàn). Không có secret hardcode, không `.env` bị track, không
  `dangerouslySetInnerHTML`, không `any`/`TODO` mới, 11 `console.log` còn lại đều là log khởi
  động chủ đích (`server.ts`) hoặc logger dùng chung — không phải rác. Quét kỹ thêm: 0 N+1 query
  trong `api/` (mọi vòng lặp xử lý dữ liệu đã lấy sẵn, gửi push dùng `Promise.all` đúng cách),
  0 catch rỗng nuốt lỗi, không có race double-submit ở Chat/Speaking/Writing (đã chặn đủ bằng
  `loading`/`isThrottled`/`limitHit`), data lớn (`curriculum.ts` 9059 dòng...) chỉ import
  `type`, không phình bundle.
  - **Phát hiện + đã vá:** 27 file gọi `fetch()` trực tiếp trong component nhưng chỉ 2 file dùng
    `AbortController`/kiểm tra unmount — rủi ro "setState sau unmount" khi người dùng rời trang
    giữa lúc AI đang trả lời (`callClaude`/TTS có thể mất vài giây). Đã thêm hook dùng chung
    `useMountedRef()` (`apps/english/src/lib/useMountedRef.ts` + test mount/unmount) và áp dụng
    vào 6 hàm gọi AI trong `Chat.tsx`/`Speaking.tsx` (`startSession`, `sendMessage`/
    `sendUserSpeech`, `endAndGrade`) — nơi rủi ro cao nhất. Lượt dùng/lưu phiên (side-effect
    không phụ thuộc component) vẫn chạy bình thường dù đã rời trang, chỉ bỏ qua các `setState`.
    `npm run codemap -- impact` xác nhận chỉ ảnh hưởng `App.tsx`/`main.tsx` (router-level),
    không phá tính năng khác. PR #514, đã merge (squash, `e5a371d`), CI `quality`+`e2e` xanh.
  - **Đề xuất đã bàn nhưng CHƯA làm (người dùng quyết định hoãn — rủi ro > lợi ích trong điều
    kiện sandbox này):**
    - Gộp hook dùng chung giữa `Chat.tsx`/`Speaking.tsx` (2 luồng gần giống nhau: session/
      loading/error/limitHit/evaluation/throttle) — không có sai lệch logic thật giữa 2 file,
      lợi ích chỉ là "gọn hơn". Không có test component nào cho 2 trang này, sandbox không chạy
      được dev server thật (không Postgres/`.env`) để tự smoke-test → hoãn, chỉ nên làm sau khi
      có test component bảo vệ hoặc test tay trên máy có app thật.
    - Tách nhỏ các trang >1000 dòng (`Lessons.tsx` 1537, `Practice.tsx` 1338, `Speaking.tsx`
      1207, `StudyTabs.tsx` 1972...). Đã thử soát `Lessons.tsx`: `LessonView` (dòng 451–1537,
      ~1090 dòng) không tách cơ học được — chứa hàng chục closure lồng nhau tham chiếu trực
      tiếp ~65 `useState`/`useEffect`/`useRef` của component cha, tách sai dễ gây stale-closure
      bug âm thầm mà không có test bắt được. Hoãn tương tự lý do trên.
    - Rủi ro vận hành khác đã nêu nhưng cần người dùng tự làm tay (không phải AI tự làm được):
      uptime monitoring ngoài (UptimeRobot/Better Uptime), PWA/offline (`manifest.json` + service
      worker — có đặc tả sẵn ở `docs/framework/BO-SUNG-nang-cao-i18n-PWA-Sentry-SEO.md` nhưng
      viết cho Next.js, cần điều chỉnh cho Vite), dashboard theo dõi tổng chi phí AI/tháng.

- **[Audit toàn diện 2026-08-21] Tầng 1–3+5a+6 chạy lại đầy đủ theo `docs/framework/QUY-TRINH-AUDIT.md`
  (nhánh `claude/quet-sau-toan-dien-du-an-a3fnv5`), phát hiện 2 vấn đề mới phát sinh cùng đợt thêm bộ
  "10 SOTA Agent Super Skills" (mục 2.1 CLAUDE.md) — cả hai đã VÁ trong cùng PR này, không chờ PR riêng.**
  - **Phát hiện 1 — CORS mở quá rộng:** 18 endpoint REST mới
    (`api/agent-orchestrator.ts`, `avatar-embodiment.ts`, `life-synthesis.ts`, `memory-palace.ts`,
    `debate-arena.ts`, `pvp-arena.ts`, `daily-quests.ts`, `referral-vip.ts`, `mesh-telemetry.ts`,
    `stem-scratchpad.ts`, `action-canvas.ts`, `metacognitive-reflection.ts`, `neural-curriculum.ts`,
    `co-learning-audio.ts`, `gemini-live.ts`, `realtime-multimodal.ts`, `acoustic-phonetics.ts`,
    `proactive-agent.ts`) set cứng `Access-Control-Allow-Origin: '*'` ở OPTIONS preflight, khác thiết
    kế same-origin của các endpoint cũ (whitelist `getCorsHeaders()` trong
    `packages/core-auth/security.ts`, đọc `ALLOWED_ORIGINS`). **Đã sửa:** đổi cả 18 file sang dùng
    `getCorsHeaders(req)` thay vì khối `'*'` tự viết tay — hành vi giữ nguyên với origin hợp lệ, nhưng
    origin lạ giờ bị chặn đúng theo whitelist thay vì luôn được chấp nhận. Cập nhật kèm 3 file test có
    `vi.mock('../packages/core-auth/security.js', ...)` toàn module (thiếu export `getCorsHeaders`,
    gây lỗi mock khi thêm test OPTIONS).
  - **Phát hiện 2 — Coverage branches tụt dưới sàn:** đo được branches 89.23% (tụt từ mốc đặt ngưỡng
    90.32%, dưới sàn 90% ở `vitest.config.ts`) — các service/handler mới của bộ 10 Super Skills thiếu
    test ca biên (OPTIONS, method không hỗ trợ, thiếu field bắt buộc, action không hợp lệ, JSON hỏng,
    404/400 theo nhánh nghiệp vụ). **Đã sửa:** viết thêm ~70 test ca biên cho 10 file
    (`referral-vip`, `agent-orchestrator`, `acoustic-phonetics`, `pvp-arena`, `admin-feedback`,
    `avatar-embodiment`, `gemini-live`, `realtime-multimodal`, `action-canvas`, `life-synthesis`,
    `daily-quests` — không đổi code nghiệp vụ, chỉ thêm test) → branches về **90.02%** (statements
    94.07% · functions 97.15% · lines 94.07%), qua ngưỡng `npm run test:coverage`.
  - Chạy lại toàn bộ cổng sau khi vá: build ✅ · typecheck ✅ (4 tsconfig) · lint ✅ (0 cảnh báo) ·
    format ✅ · test ✅ **417 file / 5018 test** · size ✅ (JS 120.58/123 kB · CSS 15.62/16 kB brotli) ·
    `npm audit --omit=dev` 0 lỗ hổng · 0 secret hardcode · `.env` không bị track · 0 `console.log` rác ·
    0 `TODO`/`any` mới. Git: `origin/main`...HEAD 0 ahead/0 behind lúc audit.
  - **Còn để ngỏ (chưa làm, ghi nhận để phiên sau xử lý nếu cần):** mâu thuẫn nội bộ PROGRESS.md về
    tính năng "phòng chat bạn bè" (một đoạn ghi "chưa làm", đoạn khác mô tả code đã xong ở
    `packages/core-chat/`) — cần audit luồng riêng (mục 5 quy trình audit) để xác minh, không thuộc
    phạm vi đợt này. E2E+a11y và audit luồng dữ liệu sâu (Tầng 5c, Tầng 8–9) chưa chạy lượt này.
  - **[Cập nhật cùng ngày] CI e2e (PR #616) đỏ, xác nhận đỏ Y HỆT trên `main`** (job e2e của cả
    2 nhánh đều "230 passed" + đúng cùng 4 test fail, không phải do PR gây ra) — **đã vá 2/4** vì
    là test lỗi thời theo sau thay đổi sản phẩm thật, không phải bug:
    - `e2e/bottomnav.spec.ts` — tab "Tiến độ" đã bị thay bằng tab "Đồng Hành" (AI companion,
      `/dong-hanh`) ở `BottomNav.tsx` (Platform V7.0), test cũ chưa cập nhật theo. Đã sửa assertion
      sang `/Đồng Hành/`. Trang `/tien-do` vẫn tồn tại (vào qua Cá nhân/Dashboard), chỉ không còn
      là tab riêng.
    - `e2e/admin.spec.ts` (3 test Analytics feedback) — `AdminFeedbackPanel.tsx` giờ có 2 tab con
      "Ý Kiến Người Dùng" (mặc định) và "Đánh Giá Gia Sư AI 👎" (thêm sau PR feedback người dùng,
      `feat(feedback): implement full user feedback & suggestion system`) — nội dung phản hồi gia
      sư AI (`userInput`, dropdown nguồn, tiêu đề "Phản Hồi 👎...") chỉ hiện sau khi bấm sang tab
      con thứ 2. Đã thêm bước click tab trước khi assert. Cả 2 file đã chạy pass cục bộ
      (Playwright Chromium).
  - **[Cùng ngày, tiếp] Đã vá NỐT toàn bộ 68 vi phạm a11y `color-contrast` còn lại** (không dừng ở
    2/4 ban đầu — người dùng yêu cầu xử lý hết). Gốc rễ: nhiều nơi dùng thẳng màu pastel Tailwind
    (`text-emerald-300`, `text-sky-300`, `text-blue-300`, `text-purple-300`, `text-cyan-300`,
    `text-red-300`...) — vốn chỉ đọc tốt trên nền tối — mà THIẾU biến thể `theme-light:` (quy ước
    đã có sẵn ở nhiều nơi khác, `tailwind.config.js` định nghĩa variant `theme-light:` = áp cho
    3 theme nền sáng blue-sky/pink/kid) nên rớt AA trên 3 theme đó. 2 lỗi có tính LAN RỘNG (xuất
    hiện ở gần như MỌI trang vì nằm trong component dùng chung):
    - Nút "Đồng Hành AI" toàn cục trong `Layout.tsx` (header mọi trang) — `text-accent-300` thiếu
      `theme-light:text-accent-800`.
    - `PageHeader.tsx` (subtitle mọi trang có tiêu đề) — có bug NGƯỢC: ai đó thêm
      `theme-light:text-zinc-600` tưởng số càng cao càng đậm (quy ước Tailwind chuẩn), nhưng hệ
      thống token `--z-*` của dự án ĐẢO CHIỀU thang màu cho theme nền sáng (xem
      `packages/core-ui/theme.css` — z-50 đậm nhất/z-950 nhạt nhất ở theme sáng, ngược hẳn theme
      tối) nên `z-600` ở blue-sky lại NHẠT HƠN z-400 mặc định — ghi đè lên đúng giá trị đã đúng sẵn.
      Đã bỏ hẳn override sai (base `text-zinc-400` tự đúng theo theme nhờ CSS var). Cùng bug lặp lại
      ở `Landing.tsx`, `LandingEn.tsx`, `WordDetail.tsx` (`theme-light:text-zinc-600/700`) — đã sửa
      luôn dù 3 trang này chưa có trong `e2e/a11y.spec.ts`, để tránh tái phát khi được thêm vào quét.
    - Còn lại: `Home.tsx` (9 chỗ), `HomeUniversalAiBar.tsx` (6 chỗ badge gợi ý câu hỏi AI),
      `Writing.tsx` (lỗi/sửa lỗi ngữ pháp trong màn chấm bài), `EdgeAiIndicator.tsx` (badge chế độ
      WASM/WebGPU) — mỗi chỗ thêm đúng 1 class `theme-light:text-*-800` (hoặc `-700` cho đỏ, khớp
      quy ước đã dùng ở `CefrLessonViews.tsx`), không đổi cấu trúc/hành vi, chỉ đổi màu chữ ở
      3 theme sáng.
    - **Xác minh:** `e2e/a11y.spec.ts` 122/122 pass · `e2e/a11y-aaa.spec.ts` 75/75 pass · toàn bộ
      `npm run test:e2e` 305/305 pass · `npm test` 417 file/5018 test · build/size/typecheck/
      lint/format đều xanh. Không đổi hành vi nghiệp vụ, chỉ đổi màu chữ ở theme sáng.
    - **`e2e/v2-hubs.spec.ts`** — 1 lỗi KHÁC phát sinh khi CI chạy lại (không có trong danh sách
      fail của `main`, không liên quan CORS/coverage/a11y): `getByText('Bạn Đồng Hành AI')` khớp 2
      phần tử (tiêu đề thẻ AI companion trên Home + mô tả nhiệm vụ hàng ngày "...cùng Bạn Đồng Hành
      AI..." của `DailyQuestsCard`, cả hai đã có sẵn từ commit `f67bbcf`, chỉ là test dùng
      `getByText` không đủ cụ thể + phụ thuộc thời điểm phản hồi `/api/daily-quests` không mock
      trong test này). Đã sửa locator sang `getByRole('heading', { name: /Bạn Đồng Hành AI/ })` cho
      rõ ràng, không đổi sản phẩm.

- 🟢 **[ĐÓNG 2026-09-03, cùng ngày mở — PR #842 sửa phần có hại, người dùng chốt phần còn lại]
  Màu Tailwind
  cố định dùng khắp app; phần THẬT SỰ hỏng đã sửa xong, phần còn lại là quyết định thiết kế.**
  Đo đủ 21 họ màu (không chỉ 4 họ như lần trước): **~4.141 lần** dùng màu Tailwind gốc trong
  `apps/` — nhiều nhất là `amber` 763 · `emerald` 700 · `rose` 480 · `sky` 328 · `indigo` 277.
  Nên "423" chỉ là một lát cắt, và việc token hoá 4 họ màu như dự tính ban đầu sẽ là **tuỳ tiện**
  (vì sao token hoá `purple` mà không token hoá `amber`?).
  **Phần có hại đã ĐÓNG (2026-09-03):** 720 chỗ màu chữ rớt tương phản AA ở 3 theme nền sáng đã
  vá xong + có cổng chặn `scripts/fixed-color-contrast-audit.test.ts` — xem
  `docs/changelog/0259-*.md`.
  **Phần từng để ngỏ nay ĐÃ CHỐT (giữ nguyên, không token hoá — xem mục "Quyết định quan trọng"
  trong `PROGRESS.md`):** có nên đổi hẳn các
  họ màu này sang token vai trò (`--info-*`, `--warn-*`…) để chúng đổi theo theme, hay giữ màu
  cố định + biến thể `theme-light:` như hiện nay? Giữ nguyên thì rẻ và đã an toàn về tương phản;
  đổi thì nhất quán hơn nhưng chạm >4.000 chỗ và có rủi ro thị giác thật. **Đề xuất: giữ nguyên.**

- 🟢 **[ĐÓNG 2026-09-03, cùng ngày mở] Cổng a11y đã chờ theo TRẠNG THÁI, không theo thời gian.**
  Mở buổi sáng khi chữa CI đỏ PR #826, đóng ngay trong ngày — xem
  `docs/changelog/0245-2026-09-03-cong-a11y-cho-theo-trang-thai.md`.
  Vấn đề: hai file cổng gọi `waitForTimeout(1000)` rồi mới quét, nên trên máy chậm/nguội axe
  soi một trang chưa render xong và báo "0 vi phạm" — xanh giả. Đo thật: TRANG CHỦ lúc quét
  mới có 268/478 phần tử, trong đó **21/55 phần tử tương tác** (38%) và 39/94 phần tử chữ.
  Đã thay bằng `waitForStableDom` (`e2e/helpers/axe.ts`) + test canh gác
  `scripts/a11y-gate-policy.test.ts` chặn quay lại lối chờ cứng.
  **Quét lại toàn bộ với cách chờ mới: 392/392 xanh — KHÔNG có vi phạm nào bị che.** Dự đoán
  ban đầu ("rất có thể lòi ra vi phạm") là SAI; ghi lại để không ai đi tìm lỗi không tồn tại.
  Chi phí thời gian: bằng nhau (1,2 phút cho 49 test, cả hai bản).

- 🟢 **[ĐÓNG 2026-08-28] Giao diện coi người dùng là khách khi mở subdomain khác.**
  **Đính chính mô tả ban đầu của mục này:** nó viết "`validateAuth` chấp nhận cookie khi thiếu
  Bearer" — SAI. Từ Bước 6 (`docs/adr/0002-quan-ly-nguoi-dung.md`), `validateAuth` **chỉ** đọc
  cookie `session_token` và **bỏ qua hoàn toàn** header `Authorization`. Đo trực tiếp trên
  server đã build với DB thật: cùng một phiên, gọi `/api/auth?action=me` chỉ với cookie → 200,
  chỉ với Bearer → 401. Nghĩa là API trên subdomain mới **vốn đã xác thực được** nhờ cookie
  `Domain=.donghanhcungban.org`.
  Chỗ thật sự hỏng nằm ở CLIENT: app dùng "có token trong `localStorage` không" làm cờ
  đã-đăng-nhập, mà `localStorage` cô lập theo origin — `getCurrentUser()` thoát sớm, và
  `cloud.ts`/`challengeCloud.ts`/`tutorFeedback.ts` lặng lẽ bỏ qua đồng bộ. Đã vá bằng action
  `session-from-cookie`: nạp lại cờ đó đúng một lần lúc khởi động.

- 🟢 **[2026-08-26 — ĐÃ GỠ, kiểm chứng bằng bài thử] Rate limit từng bị né hoàn toàn bằng
  header `X-Forwarded-For` giả; nay đã bịt cả hai tầng.**

  **Trước khi vá** — 40 request vào `/api/app-settings` (giới hạn 30/phút) với IP giả ngẫu
  nhiên mỗi lần: **40 lần `200`, không một `429`**. Nguyên nhân: nginx dùng
  `$proxy_add_x_forwarded_for` (NỐI ip thật vào CUỐI) trong khi `getClientIp()` đọc phần tử
  ĐẦU — tức giá trị client tự khai.

  **Sau khi vá** — chạy lại đúng hai bài thử ở `docs/cloudflare-setup.md`:

  | Bài thử                           | Kết quả                            | Đọc thế nào                                                                                                        |
  | --------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
  | A — IP giả **ngẫu nhiên** mỗi lần | **30 × `200`, rồi 10 × `429`**     | Khớp CHÍNH XÁC giới hạn 30/phút ⇒ đếm theo IP thật, header giả vô tác dụng                                         |
  | B — IP giả **cố định**            | **40 × `429`** ngay từ request đầu | Chạy từ cùng máy với A nên cùng IP thật; quota đã bị A dùng hết ⇒ hai bài dùng CHUNG một bộ đếm, đúng như phải thế |

  Bài B trả `429` ngay từ đầu thoạt nhìn có vẻ lạ, nhưng đó mới là bằng chứng mạnh nhất: nếu
  rate limit còn tin header giả thì B đã có bộ đếm riêng và trả `200`.

  **Hai tầng đã áp:** (1) `getClientIp()` đọc `CF-Connecting-IP` → `X-Real-IP` → XFF phần tử
  CUỐI (PR #701, 7 test chặn hồi quy trong `packages/core-http/http.test.ts`); (2) nginx
  `cloudflare-realip.conf` chỉ nhận header từ đúng dải IP Cloudflare — người dùng đã áp lên VPS
  cùng ngày.

  **Bài học ghi lại:** lỗ hổng sống sót qua nhiều lần rà soát vì cách kiểm chứng cũ hỏi sai
  câu — _"IP hiển thị có đúng không?"_ (nhìn log là trả lời được) thay vì _"IP có ghi đè được
  không?"_ (chỉ trả lời được bằng cách tự tấn công mình). Tài liệu đã đổi sang câu thứ hai.

- 🟢 **[2026-08-26 — ĐÃ GỠ] VPS production đã có swap 6 GB.** `scripts/setup-swap.sh` chạy
  thật trên máy: `free -h` nay báo `Swap: 6.0Gi · used 0B` (dùng 0B là đúng —
  `vm.swappiness=10` nên kernel chỉ chạm swap khi RAM thật sự cạn). Đĩa còn 22 GB trước khi
  tạo nên không sát đáy. Ghi lại bối cảnh gốc: Số đo người dùng gửi từ VPS hôm nay:

  ```
  free -h  →  total 2.9Gi · used 1.1Gi · available 1.8Gi · Swap 0B
  pm2 list →  3 instance dhcb: 218,7 + 217,6 + 231,1 MB · pm2-logrotate 57,5 MB
  ```

  Lúc rảnh dư dả (dùng ~40% RAM). Chỗ nguy hiểm là **lúc deploy**: `scripts/deploy.sh` chạy
  `npm ci` + `npm run build` ngay trên máy đang phục vụ, Vite + `tsc -b` 16 workspace ngốn thêm
  1–1,5 GB ở đỉnh — chạm trần 2,9 GB. Không swap thì kernel gọi OOM killer, mà OOM killer
  **không chọn tiến trình đáng chết**: nó có thể giết PostgreSQL giữa lúc deploy.

  **Điều kiện gỡ nợ:** trên VPS chạy `sudo bash scripts/setup-swap.sh 6G` rồi xác nhận
  `free -h` thấy dòng Swap khác `0B`. Xem `docs/deploy-vps-ubuntu.md` Bước 3a.

  **Hai thứ nữa phát hiện cùng lúc, chưa vá (đề xuất, chờ người dùng chốt):**
  1. `ecosystem.config.cjs` **thiếu `max_memory_restart`** — instance rò rỉ bộ nhớ thì PM2
     không tự khởi động lại, để mặc kernel giết bừa. Đề xuất `'400M'` (mỗi instance đang dùng
     ~220 MB, nên 400 MB là ngưỡng bất thường rõ ràng chứ không phải mức bình thường).
  2. `PG_POOL_MAX` mặc định **10 mỗi tiến trình × 3 instance = 30 kết nối** Postgres thật.
     Chưa vỡ (`max_connections` mặc định 100) nhưng thừa; đề xuất đặt `PG_POOL_MAX=5`.

  **↺ 64 — ĐÃ KẾT LUẬN, không phải crash.** Đọc `pm2 logs dhcb --err --lines 200`: 200 dòng
  log lỗi gần nhất KHÔNG có một stack trace crash nào, không có tiến trình thoát bất thường.
  Toàn bộ là cảnh báo Redis rớt (mục trên) và 2 lỗi TTS Gemini có xử lý sẵn. Vậy 64 là cộng
  dồn qua các lần `pm2 reload` khi deploy — bình thường.

- 🟢 **[2026-08-25 → ĐÃ GỠ 2026-08-26] `nginx/en-vi.conf` nay ĐÃ áp lên VPS thật** (làm cùng lúc với việc áp `cloudflare-realip.conf` để bịt lỗ hổng rate limit — xác nhận bằng bài thử A/B ở mục trên). Ghi lại bối cảnh gốc: Audit
  2026-08-25 (F5) phát hiện bản `Content-Security-Policy-Report-Only` trong nginx còn whitelist
  `*.supabase.co` dù dự án rời Supabase từ 2026-07-20, lại thiếu facebook/apple/microsoft,
  `media-src blob:` và `frame-src accounts.google.com` so với CSP thật — nên nó chỉ sinh báo cáo
  vi phạm GIẢ. Đã xoá hẳn ở PR #664 (giữ đúng MỘT nguồn CSP là Express).

  **Điều kiện gỡ nợ:** copy file lên VPS rồi:

  ```bash
  sudo nginx -t && sudo systemctl reload nginx
  ```

  **Vì sao chưa gỡ được từ đây:** repo chỉ chứa BẢN SAO cấu hình; file thi hành thật nằm trên
  server. Sửa trong repo mà quên áp = tài liệu nói một đằng, server chạy một nẻo — đúng loại
  lệch mà Tầng 6b của quy trình audit sinh ra để bắt.

- 🟢 **[2026-08-26 — ĐÃ GỠ] Baseline eval gia sư ĐÃ CÓ SỐ THẬT, chất lượng sư phạm không tụt.**
  Chạy trên VPS với key thật: **62/62 câu chấm được**, recall 97,7% · precision 97,7% ·
  FP-rate 5,6% · specificity 94,4% · Feedback VI 100% · Type-hit 76,7%. 9/11 nhóm lỗi đạt
  tuyệt đối; chỉ bỏ sót `adj-02` (trật tự tính từ). Số liệu ở
  `docs/research/eval-tutor-baseline.md`.

  **Đính chính một điều mục nợ này từng ghi sai:** nó viết "baseline vẫn là bản 2026-08-21".
  Không đúng — `git log -- docs/research/eval-tutor-baseline.md` cho ĐÚNG MỘT commit trong
  toàn bộ lịch sử (PR #625), và nội dung là bản mẫu rỗng ghi rõ "⏳ CHƯA CÓ SỐ LIỆU BASELINE".
  Tức **chưa từng có baseline số nào, ở bất kỳ ngày nào**, và luật ở `CLAUDE.md` mục 8 ("PR
  sửa prompt/model phải dán bảng so sánh, recall/precision không được tụt") **chưa bao giờ thi
  hành được** vì không có mốc để so. Lần chạy 2026-08-26 là baseline ĐẦU TIÊN, không phải một
  lần so sánh. Bài học: một mục nợ khẳng định "bản ngày X" mà không ai mở file ra xem thì nó
  chỉ là tin đồn được chép lại — kiểm bằng `git log` trước khi chép.

  **Đo đúng đường production.** `chatFallback.ts` gọi theo thứ tự Groq → Anthropic → Gemini,
  và script eval cũng ưu tiên Groq trước, nên số trên là chất lượng của **provider chính** mà
  người dùng thật đang gặp. Gemini (`gemini-3.6-flash`) là lớp dự phòng thứ ba — health-check
  07:00 ngày 26/8 xác nhận nó gọi được (512ms), nhưng chất lượng sư phạm của riêng nhánh đó
  vẫn chưa đo; chạy `npm run eval:tutor` trên máy KHÔNG có `GROQ_API_KEY`/`ANTHROPIC_API_KEY`
  thì script sẽ rơi xuống Gemini và đo được. Hai tính năng vision
  (`visionSolverService.ts`, `ambientVisionService.ts`) dùng chung model đó, cũng chưa thử tay.

  **Ba việc phải làm để chạy được, ghi lại vì đều là bẫy thật:**
  1. Script đọc `process.env.GROQ_API_KEY` nguyên chuỗi làm Bearer token, trong khi production
     đi qua `groqKeyPool()` tách nhiều key theo dấu phẩy → 62/62 lỗi `401` và một báo động sự
     cố production hoàn toàn không có thật. Đã vá.
  2. Báo lỗi chỉ giữ `lastErr` nên `429` của khoá đang sống bị `401` của khoá hỏng che mất →
     chẩn đoán sai thêm hai vòng. Nay in trạng thái TỪNG khoá: `[#1→429 #2→429]`. Đã vá.
  3. Một khoá trong `.env` hỏng vật lý — dài 50 ký tự thay vì 56, kết thúc bằng ký tự `>`, sai
     định dạng `gsk_[A-Za-z0-9]+`. Bị cắt cụt lúc ghi file, không phải bị thu hồi. Đã thay.

  Groq tính hạn mức theo **TÀI KHOẢN chứ không theo khoá**, nên gộp nhiều khoá cùng một tài
  khoản vào bể KHÔNG tăng quota — chỉ có giá trị dự phòng khi một khoá bị thu hồi. Đúng cho cả
  production. Chạy eval cần `--delay 3000` (62 câu ≈ 3–4 phút); `--delay 500` mặc định làm tắc
  từ câu 22.

- 🟢 **[2026-08-21] Đã vá 15 test e2e đỏ trên `main`** (phát hiện khi driving PR #617 tới green —
  commit `fd188ef` "restructure platform hub and dedicated english studio routing" đổi route "/"
  từ `EnglishHome` sang `Home` (platform hub mới) và dời `EnglishHome` sang `/hoc-tieng-anh`, kéo
  theo 2 loại lỗi:
  1. **5 test sai route** (`e2e/a11y.spec.ts` "Home — gợi ý luyện nói..." × 5 theme,
     `e2e/comeback.spec.ts` × 2, `e2e/bottomnav.spec.ts` × 1 — nhãn tab đổi "Lộ trình" →
     "Học Tiếng Anh"): sửa test trỏ đúng `/hoc-tieng-anh` thay vì `/` cho nội dung đã dời, và
     cập nhật locator theo nhãn mới.
  2. **9 lỗi a11y `color-contrast` thật** trên `Home.tsx` (platform hub mới) và `EnglishHome.tsx`
     — 2 dạng bug lặp lại từ đợt vá PR #616 trước: (a) pill/nút dùng thẳng `text-emerald/blue/
purple/orange/amber/sky-300` thiếu biến thể `theme-light:text-*-800` nên nhạt trên 3 theme
     sáng; (b) nút nền `bg-accent-500`/`bg-emerald-500` dùng `text-zinc-950` — token `--z-950`
     BỊ ĐẢO CHIỀU ở theme sáng (nhạt nhất thay vì đậm nhất, xem PROGRESS.md đợt vá PR #616) nên
     chữ gần trắng trên nền sáng → sửa bằng màu cố định `text-[#09090b]` (không qua token z-\*,
     đã tính contrast ≥ 5.9:1 trên cả 5 theme accent màu khác nhau) thay vì `text-zinc-950`.
     Xác nhận: `npx playwright test e2e/a11y.spec.ts e2e/bottomnav.spec.ts e2e/comeback.spec.ts`
     134/134 pass cục bộ; build/typecheck/lint/format/`npm test` (5019/5019) đều xanh.

- 🟢 **[ĐÃ TRẢ 2026-09-15, PR S10-1 — `docs/changelog/0332-*.md`] 6 lỗi lifecycle voice/AI
  (khảo sát S10, spec `docs/specs/2026-09-15-learning-ux-s10-tro-giang-trong-bai-voice.md`
  §2.1 + §④ Phần 1 AC-1…AC-6).** Sáu lỗi "rời trang rồi mà thứ cũ vẫn chạy": (L1) rời trang
  Companion giữa lúc AI đang nói bằng giọng → AI cất tiếng ở trang kế; (L2) stream SSE không
  huỷ được, callback vẫn bắn sau khi rời trang; (L3) StrictMode gọi `fetchProactiveAgentState`
  hai lượt, lượt cũ setState sau unmount; (L4) `tts.ts` chốt `playToken` **sau** await nên
  `stopSpeaking()` gọi lúc đang tải không ngăn được audio nổ ở trang kế; (L5) `MediaRecorder`
  constructor ném lỗi → mic không bao giờ được nhả; (L6) `AiHelpPanel` rò state/response trễ
  giữa hai bài học (component không remount khi đổi `lessonId`). Sửa: `Companion.tsx` cleanup
  đặt cờ huỷ + abort; `companionApi.ts`/`proactiveAgentApi.ts` nhận `AbortSignal`; `tts.ts` chốt
  vé trước await; `sttServer.ts` bọc try/catch quanh constructor, release track trước khi ném
  lại; `AiHelpPanel.tsx` + `key={lesson.id}` ở `ProgrammingLessonPage.tsx`. 8 ca test đỏ-trước/
  xanh-sau (bảng đầy đủ ở changelog `0332`), không đổi giao diện/API công khai/schema. Xác nhận
  lại 2026-09-21 (khảo sát nợ kỹ thuật định kỳ): 5 file test liên quan / 98 ca vẫn xanh trên
  `main`, không regression — `npx vitest run apps/dhcb/src/pages/companion
apps/dhcb/src/lib/companionApi.test.ts apps/dhcb/src/lib/tts.test.ts
apps/dhcb/src/lib/sttServer.test.ts apps/dhcb/src/components/programming/AiHelpPanel.test.tsx`.

- 🟢 **[ĐÃ TRẢ 2026-08-24 — xem mục "Giai đoạn hiện tại"]** Nâng lại plugin lên `7.1.1` + sửa
  đúng bản chất 95 lỗi (danh sách 73 lỗi cũ đã phình theo code mới), 0 eslint-disable mới.
  Ghi chú gốc giữ lại bên dưới để tra cứu:

## Lịch sử đo coverage/bundle

- 📜 **[Lịch sử đo coverage/bundle — dời 2026-10-28, `0685`; mục vẫn mở ở PROGRESS với số đo mới] [ĐO LẠI 2026-09-14 — mô tả "ngân sách BUNDLE nay rộng" ĐÃ LỖI THỜI] Cả COVERAGE lẫn
  BUNDLE nay đều mỏng.**
  **Cập nhật 2026-10-10 (`docs/changelog/0580-*.md`, audit toàn diện):** Initial JS 93,3% →
  **84,0%** (149,29 → 134,39/160 kB; JS khởi động THẬT gồm mọi modulepreload 154,3 → 138,4 kB)
  nhờ đưa zod bản đầy đủ ra khỏi đường khởi động (`zod/mini` ở `clientAuth`/`appSettings`/
  `cloud`, chunk `vendor-zod` lười, test canh `startupBundle.test.ts`). CSS vẫn 24,57/26 kB (**94,5% — sát ngưỡng cảnh báo**;
  30% CSS thô là khối `@supports color-mix` của Tailwind 4 nhưng bỏ chỉ được ~0,7 kB nén). **Cập nhật 2026-10-10 (`0584`/`0585`):** Initial JS nay đếm ĐỦ chunk `modulepreload` — 135,68/160 kB (84,8%); `npm run size` đỏ nếu chunk khởi động mới không có glob.
  **Cập nhật 2026-10-08 (`docs/changelog/0522-*.md`):** Initial JS 96,6% → **93,1%** (148,93/160 kB, tách
  `ts-fsrs` ra chunk `vendor-fsrs` không preload); CSS không đổi 23,95/26 kB (92,1%, toàn class đang
  dùng). Coverage 95,74/91,79/96,41/96,36 sau test ca biên 6 file — lộ và sửa 3 bug
  thật (`selfGrade.ts` đọc sai số mũ `¹²³` và số ≥1e21; Ôn thi "Đã nắm 0/0"). **Sàn đã nâng
  93/89/93/93 → 94/90/94/94** (chủ dự án duyệt, `docs/changelog/0537-*.md`; số CI sau #1281
  95,75/91,79/96,46/96,36 — biên độ còn 1,75/1,79/2,46/2,36).

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
