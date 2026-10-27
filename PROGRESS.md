# PROGRESS.md — Trạng thái dự án

> AI đọc file này để biết đang ở đâu. Chi tiết tính năng: `PROJECT.md`. Lịch sử đầy đủ từng PR:
> `git log`/PR đã merge trên GitHub — file này chỉ giữ **tóm tắt** + việc còn mở + quyết định lớn.
>
> **Nhịp làm việc theo giới hạn giờ (CLAUDE.md mục 3):** ≥ 70% usage → hoàn tất việc đang làm, tạo
> PR rồi DỪNG chờ duyệt. < 70% → sau khi PR merge, tự động tiếp tục mục kế tiếp.

## Giai đoạn hiện tại

**Hai đợt vá bảo mật 2026-09-27.** Đợt `0464` đã merge (#1190) và **đã deploy** (workflow
Deploy run 1142, 08:34 UTC) — điều kiện vận hành (`ADMIN_USER_IDS`, `ALLOWED_ORIGINS`, Redis)
ở [runbook](docs/security-rollout-2026-09-27.md), trạng thái ở
[goal bảo mật](docs/goals/security-audit-20260927.md). Đợt `0465` (PR #1191, audit lần hai) vá
tiếp 7 lỗ hổng còn sót — xem `docs/changelog/0465-*.md`; **ba việc tay trên VPS** ở mục "Cần
làm tay" A (xoay khoá VAPID đã lộ, áp nginx mới, firewall chỉ cho Cloudflare). Các grader thiếu
cách ly vẫn tạm đóng; chỉ mở lại sau khi có ranh giới thực thi an toàn.

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

**Cắt gọn 2026-10-23 (autopilot, `docs/autopilot/PLAN.md`, D-001):** 19 mục nợ đã đóng dời sang
`docs/legacy/no-ky-thuat-da-dong.md`; "Đã xong — tóm tắt theo mảng", "Cần làm tay › B. ĐÃ XONG" và
"Sự cố hạ tầng đã xử lý" dời nguyên văn sang `docs/legacy/progress-luu-tru-den-2026-10-23.md`.

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

## Tiếp theo

- **[2026-10-20] Audit toàn diện 11 tầng** ([báo cáo](docs/audit/2026-10-20-audit-toan-dien.md),
  `docs/changelog/0648-*.md`): mọi cổng chặn xanh, 0 phát hiện Cao, 1 Trung (F-001 mã mời
  `Math.random` → `crypto.randomInt`), 7 Thấp (F-002…F-009), 8 đề xuất test D-1…D-8 (6 mức Cao chạm
  lượt/giá/webhook/sổ xoá tài khoản). Chủ dự án chốt **"làm tất cả"** (2026-10-20), chia 4 PR:
  **W-001 F-001 ĐÃ LÀM** (`docs/changelog/0649-*.md`, `crypto.randomInt` cho mã kết bạn + mã mời vị
  trí, test đỏ-trước, PR #1421). **W-002 ĐÃ LÀM** (`docs/changelog/0650-*.md`, +~330 dòng test
  cho D-1…D-8 + `founder.ts`, không đổi mã sản phẩm, PR #1422). **W-003 ĐÃ LÀM**
  (`docs/changelog/0651-*.md`: `sample()` chung, xoá `Celebration.tsx`, 4 chỗ tài liệu cũ, đếm
  TODO bỏ nội dung bài học, TRAPS mục 31, PR #1423). **W-004 ĐÃ LÀM** (`docs/changelog/0652-*.md`:
  gỡ banner trùng lối tắt ở `/goc-hoc-tap`, ảnh 390 px 1045 → 857). **Cả 4 đợt sửa sau audit ĐÃ
  XONG**; còn mở: F-007 (biên CSS, chỉ ghi nhận) và F-008 (`eval:tutor` baseline mới với key thật —
  việc tay chủ dự án, AI không làm được).
  **Audit delta 2026-10-24** (`docs/audit/2026-10-24-audit-delta.md`, changelog `0662`–`0663`): 19 commit
  sau đó kiểm lại tầng 1–2–5 xanh; vá `body-parser` (#1435) + nâng `happy-dom` 21 — `npm audit` cả dev = 0.
  **Eval AI thật 2026-10-25** (chủ dự án chạy trên VPS, changelog `0664`): **F-008 ĐÃ ĐÓNG** — baseline
  `eval:tutor` 180 câu đã ghi (`docs/research/eval-tutor-baseline.md`); companion 16/16, code-feedback 8/8,
  routing 87,1 % (≥ 85 %). **action-canvas 0/10 (`too_deep`) ĐÃ SỬA** ở bộ kiểm — cần chạy lại
  `npm run eval:action-canvas` trên VPS sau deploy để xác nhận các bất biến khác. **🔴 F-011 MỞ:** gia sư
  bịa lỗi ở câu đúng — FP-rate ≈ 50 % trên cùng 62 câu cũ (5,6 % hồi Groq 2026-08-26); cần sửa prompt
  chấm rồi chạy lại `eval:tutor` với key thật.
- **[2026-10-16] Nâng cấp từ stored:** [goal](docs/goals/2026-10-16-stored-upgrades.md).
  S01 đã merge [PR #1399](https://github.com/seeker19110/dhcb/pull/1399) và deploy thành công:
  cổng eval ký ức chặn ca sai; đủ quality/e2e/metadata. Owner duyệt S02–S06 và quyền
  push/PR/merge/deploy khi CI xanh; không chi phí provider hoặc dữ liệu production.
  S02 replay offline đã merge/deploy [PR #1400](https://github.com/seeker19110/dhcb/pull/1400).
  S03a sửa phép tính cache write đã merge [PR #1401](https://github.com/seeker19110/dhcb/pull/1401)
  sau đủ 19 check, CI 21.491 test/coverage và sáu mảnh E2E đạt; deploy thành công.
  S03 trace đã merge [PR #1402](https://github.com/seeker19110/dhcb/pull/1402) sau 19 check xanh,
  mặc định tắt; deploy thành công. Rà soát bổ sung phát hiện embedding thiếu trace attempt, cần S03b trước khi coi coverage trace hoàn tất. S04a sửa đường SSE đã merge [PR #1403](https://github.com/seeker19110/dhcb/pull/1403) sau 19 check xanh; deploy thành công. S04b guard delta/final đã merge [PR #1404](https://github.com/seeker19110/dhcb/pull/1404) sau 19 check xanh, deploy thành công. S05a vá retrieval guard đã merge [PR #1405](https://github.com/seeker19110/dhcb/pull/1405) sau 19 check xanh (21.630 unit/1.440 E2E), deploy thành công. S03b trace embedding đã merge [PR #1406](https://github.com/seeker19110/dhcb/pull/1406) sau19 check xanh (21.647 unit/1.440 E2E), deploy thành công. S04c wrapper đã merge [PR #1407](https://github.com/seeker19110/dhcb/pull/1407) sau19 check xanh (21.676 unit/1.440 E2E), deploy thành công; mainCI retry bootstrap ECR đã đạt. Corpus S04 đã merge [PR #1408](https://github.com/seeker19110/dhcb/pull/1408): CI21.975 unit, PG1.874+8runtime/cleanup0 đạt; browser1.439 pass/1flaky lịch [#1409](https://github.com/seeker19110/dhcb/issues/1409) — ĐÃ SỬA ở changelog `0655` (test đo giữa hoạt ảnh, không hạ ngưỡng). Main CI/deploy thành công. S06a sửa hủy TTS [PR #1410](https://github.com/seeker19110/dhcb/pull/1410) đã merge/deploy:
  CI22.000 unit/1.450 E2E/0flaky, main CI/deploy/CodeQL/secret scan đạt. S06b đã merge/deploy
  [PR #1412](https://github.com/seeker19110/dhcb/pull/1412), mainba82335f:19context xanh,
  CI22.152unit/1.460E2E/0flaky; bốn workflow main đạt. Sửa capture/confirm/AI/TTS ownership
  và ràng buộc phiên ở client (changelog `0645`), có test-first/review độc lập. Baseline S05 đã merge/deploy
  [PR #1413](https://github.com/seeker19110/dhcb/pull/1413), main08f9508e:19context xanh,
  CI22.350unit/1.460E2E/0flaky, actualCI80+8/source44/cleanup0 và4localPGnegative đạt;
  chưa human label review/quality floor/vector thật. Instrumentation S06 (đo metadata giọng nói
  cục bộ, mặc định tắt) đã merge/deploy [PR #1414](https://github.com/seeker19110/dhcb/pull/1414),
  main `17ce6b0f`: CI/deploy/CodeQL/secret scan đều SUCCESS (đối soát changelog `0657`).
  **Goal WAITING chủ dự án** — engineering xong; còn 3 việc cần người (mục 7 file goal):
  duyệt nhãn tay + chốt floor S05, benchmark vector thật (provider có phí), đo acoustic/device
  thật S06. Không suy số đo hiệu năng từ fake clock.
- **[2026-10-13] Gợi ý nâng cấp từ rà soát chéo** (`docs/research/2026-10-13-goi-y-nang-cap.md`,
  changelog `0630`). **Mục 2 + 3 ĐÃ LÀM** (PR #1396, `docs/changelog/0632-*.md`): ghim cả 21
  `uses:` theo SHA (test canh siết cho cả `actions/*`), thêm `permissions.deny` hẹp. **Mục 5 ĐÃ LÀM** (PR #1397,
  `docs/changelog/0633-*.md`): `CLAUDE.md` 33.940 → ~24.300 ký tự, trần hạ còn 26.000. Mục 1 (`opusplan`) là quyết định
  chi phí của chủ dự án; mục 6 (TypeScript 6) để đợt nâng phụ thuộc; mục 4 không làm (trùng
  `pre-commit-gate.sh`).
- **[2026-10-11] Nâng cấp "Bạn Đồng Hành" 4 giai đoạn** (nghiên cứu
  `docs/research/nang-cap-ban-dong-hanh-2026-10-11.md`, chủ dự án chốt làm lần lượt cả 4, mỗi GĐ
  một PR). **GĐ1 ĐÃ LÀM** (PR #1369, `docs/changelog/0614-*.md`, đặc tả
  `docs/specs/2026-10-11-ban-dong-hanh-gd1-stream-an-toan.md`): stream thật từ Claude, lịch sử giữ
  lượt mới nhất, prompt mới (2 trụ, giờ VN, nhóm tuổi, chống xu nịnh, bọc dữ liệu), lớp an toàn
  khủng hoảng (từ khoá + Haiku, thẻ 111/115/Ngày Mai). **GĐ2a ĐÃ LÀM** (PR #1375,
  `docs/changelog/0615-*.md`, đặc tả `docs/specs/2026-10-11-ban-dong-hanh-gd2a-tri-nho-truy-xuat.md`,
  ADR-0015): sửa lỗi im lặng consent scope không cấp được (Companion chưa từng đọc ký ức/hồ sơ/lịch
  sử), hai công tắc = hai consent chuẩn, migration 0094 (FTS unaccent + embedding Gemini `real[]`,
  không pgvector), truy xuất lai RRF + điểm 3 thành phần, trang `/ban-dong-hanh/ky-uc`, phiên không
  lưu. **GĐ2b ĐÃ LÀM** (PR #1377, `docs/changelog/0617-*.md`, đặc tả
  `docs/specs/2026-10-12-ban-dong-hanh-gd2b-trich-ky-uc-khoi-loi.md`): bộ phản tỉnh sau buổi (hẹn
  giờ 10 phút, công tắc thứ ba "Gợi ý điều nên nhớ", 1 lượt AI/lần, trần 4 lần/ngày) CHỈ đề xuất
  ký ức thêm/cập nhật/vô hiệu thành gợi ý chờ duyệt (không gì được ghi khi chưa bấm), vô hiệu
  bằng `valid_to` + `superseded_by` không xoá; hai khối ghi nhớ cố định người dùng tự viết; tóm tắt
  cuộn theo miền (cửa sổ 20 tin, đủ 14 tin chưa tóm tắt thì gập 10 tin cũ nhất), migration 0096.
  **GĐ3 ĐÃ LÀM** (PR #1378, `docs/changelog/0618-*.md`, đặc tả
  `docs/specs/2026-10-12-ban-dong-hanh-gd3-tac-tu-cong-cu.md`, không migration): định tuyến Haiku
  (`intent_route`, fallback từ khoá), vòng công cụ viết tay (≤ 4 bước, ≤ 6 lần thi hành, hạn chót
  45 giây) với 4 công cụ chỉ-đọc + 3 công cụ CHỈ tạo đề xuất chờ duyệt, kiểm câu trả lời cuối tất
  định, nhãn "đang tra cứu" trên giao diện; công tắc lùi `COMPANION_TOOLS=off`. **GĐ4a ĐÃ LÀM**
  (PR #1392, `docs/changelog/0629-*.md`, đặc tả
  `docs/specs/2026-10-12-ban-dong-hanh-gd4a-the-hom-nay.md`, migration 0097): "Thẻ hôm nay" ≤ 3
  thẻ/ngày dựng tất định từ dữ liệu thật (thẻ ôn đến hạn · việc đến hạn · mục tiêu học · lời mời
  phản tỉnh), không gọi AI, tự chuyển "Đã xong"; 👍/👎 thành sở thích (👎 tắt loại thẻ 7 ngày);
  gỡ hẳn tác tử chủ động giả lập (`/api/proactive-agent`, "năng lượng 85%", AutoPilot gõ sẵn).
  **GĐ4b ĐÃ LÀM** (PR #1395, `docs/changelog/0631-*.md`, đặc tả
  `docs/specs/2026-10-13-ban-dong-hanh-gd4b-nhac-nghi.md`, không migration): lời nhắc nghỉ viết sẵn
  cho `nhi_dong` (sau 20 phút) / `thieu_nien` (sau 40 phút) trò chuyện liên tục, đếm bằng mã ở
  client (mô hình không biết thời lượng phiên), nói rõ là AI, "Thêm một chút" / "Mình nghỉ đây".
  **Cả 4 GĐ nâng cấp Bạn Đồng Hành ĐÃ XONG.** Việc tay:
  sau deploy chạy `migrate:pg` (0094 cần extension `unaccent`; 0096 ba bảng mới; 0097 hai bảng thẻ
  hôm nay), kiểm `GEMINI_API_KEY` production, bật ba công tắc trên tài khoản
  thật, trò chuyện rồi chờ ≥ 15 phút xem gợi ý hiện ở `/ban-dong-hanh/ky-uc`; kiểm stream + bộ phân
  loại GĐ1 với key thật; **GĐ3:** chạy `npm run eval:companion` và
  `npm run eval:v2:routing -- --haiku` với key thật, theo dõi chi phí token mode `companion` +
  `intent_route` một tuần sau deploy (vòng công cụ gọi Sonnet tới 5 lần/lượt — trần cứng ở mã);
  tăng vọt thì đặt `COMPANION_TOOLS=off` trong `.env` rồi `pm2 reload`.

- **[2026-10-09] Dự án trục T2/T3 môn Lập trình** — hạ tầng xong (changelog `0571`, đặc tả
  `docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md`): chọn dự án, mã bước
  `t2-`/`t3-`, tiến độ + workspace riêng từng dự án. **T2 "Quỹ lớp" (changelog `0572`) và T3
  "Sổ học tập" (changelog `0573`) đều đủ P1→P5, mỗi dự án 26 bước** — ba dự án trục đã mở hết.
  Nội dung còn `draft`, chưa có người duyệt sư phạm. ✅ `0609`: 9 bước apisim của cả T1/T2/T3 có
  `probeCode` — bộ chấm chạy nguyên `api.py` rồi tự gọi API bằng dữ liệu riêng, nên lời giải chỉ in
  sẵn đáp án trượt ca ẩn (đặc tả `docs/specs/2026-10-11-apisim-ca-an-chong-go-cung.md`; vẫn chỉ
  chấm ở trình duyệt — server không chấm lại bước dự án). ✅ `0610`: trần `requirement` 2000 → 3000
  (`p5-s5` vượt trần), test parse MỌI bước của T1/T2/T3 qua `ProjectStepSchema`.

- **[2026-10-05] 20 khóa AI Engineering**: kế hoạch và ánh xạ 523 mục nguồn đã duyệt (#1236); renderer hoạt họa (#1237) và bài gradient có phát lại (#1241) đã merge. [Goal và bằng chứng](docs/goals/2026-10-05-ai-engineering-from-scratch.md) ghi phần còn thiếu; chưa có phase nào nghiệm thu toàn bộ. Engine Git (#1243) và B1 nội dung/rubric `p3-u11-l1` (#1258) đã merge; B2 hoạt họa Git chờ chuyên gia chốt storyboard. Hai lỗi nội dung cũ FR-3a (convolution "bất biến" → tương đương tịnh tiến ở `cv1-u2-l1`/`cv2-u1-l4`/`mlds-u3-l1`; `llmagent-u1-l1` bỏ hứa "BPE") đã sửa ở changelog `0511`, đã merge (#1261). Ba hoạt họa thí điểm còn lại (convolution, RAG, agent) chờ reviewer nội dung; bài mới cần lát contract chốt ID. Gói bộ chấm #1239 còn Draft chờ quyết định kiến trúc; chủ dự án chưa có staging và yêu cầu chuẩn bị gói trước.

- **[2026-10-06 — cập nhật hiện trạng] `main` ở #1257.** Đã merge sau mục dưới:
  U5 #1244 · U9a #1248 · U9b #1245 · minor 1–14 #1246 · Git ignore + chấm trạng thái #1243 ·
  U7 #1255 · đổi mật khẩu/Google #1252 · học hỏi + VIP không giới hạn lượt AI #1256 (changelog
  `0501`–`0503`). Nghĩa là **U1–U9 đều đã có source trên `main`** (danh sách "6/9" bên dưới là
  mốc 2026-10-05, giữ làm lịch sử). Đã merge #1257: đổi `text-[Npx]` → rem (nợ `FontSizeRem.design.test.ts` = 0) và "Học tiếp" cho 4 môn
  STEM + thống nhất "Vật lí". PR kế (changelog `0506`–`0508`): B1 bài `p3-u11-l1` (nội dung + rubric trạng
  Git, chưa hoạt họa) · storyboard NHÁP hoạt họa Git — **B2 chờ chuyên gia chốt 9 điểm** trong
  `docs/research/2026-10-06-ai-engineering-git-ignore-storyboard.md` · test render khối "Học tiếp".
  E2E `e2e/gitignore-engine.spec.ts` viết lại theo rubric mới, chỉ CI mới chạy được.
  Còn chờ chủ dự án: việc tay mục A bên dưới (VAPID/nginx/firewall, `ALLOWED_ORIGINS`, câu Free
  cũ trong `plan_marketing_bullets`, `cwv:prod`), quyết định kiến trúc gói chấm #1239, chuyên gia
  rà S10b/S12.

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

- **[2026-09-06] Đóng băng mở rộng phạm vi trong 2–4 tuần** (người dùng quyết): không thêm
  môn/khoá/hướng mới cho tới khi có số đo người học thật. Lý do: 3 tuần qua ~15 đợt việc/ngày,
  hầu hết là mở rộng chiều rộng (14 hướng lập trình, 8 khoá ngắn, 2 bộ chạy ngôn ngữ, 3 môn STEM
  nháp), trong khi chưa có một con số retention nào.
- **[2026-09-06] Mời 5 người học thật, quan sát 2 tuần** (việc tay của người dùng, xem mục
  "Cần làm tay"). Sau 2 tuần đọc phễu + DAU/returning rồi mới quyết mảng nào đi sâu.

### Ưu tiên 1b — ĐỔI MÔ HÌNH GÓI (chủ dự án chốt 2026-09-12, đặc tả đã viết, CHƯA thi hành)

Quyết định: **xoá gói Pro và Plus, chỉ còn Free + VIP**. Free hưởng **hạn mức Plus cũ (30
lượt/ngày)** miễn phí. **VIP** là gói trả phí duy nhất, đặc quyền là **học tự do** (nhảy cấp tuỳ
ý); Free học tuần tự từ đầu. Người đang trả Plus/Pro còn hạn → **nâng VIP giữ nguyên hạn đã trả**.

Chia giai đoạn, mỗi giai đoạn MỘT PR, dừng xin duyệt giữa các giai đoạn. **Toàn bộ quyết định
đã chốt 2026-09-12**; mục 2b hoãn rồi mở lại 2026-10-12 (xem ghi chú dưới):

| GĐ  | Đặc tả                                                | Quyết định đã chốt                                                                                                                               | Trạng thái                                                                                                            |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 1   | `docs/specs/2026-09-12-gd1-xoa-goi-pro.md`            | Xoá **cả Pro lẫn Plus**; Free hưởng hạn mức Plus cũ (30/ngày); người đang trả còn hạn → nâng VIP giữ nguyên hạn                                  | ✅ **ĐÃ THI HÀNH** (PR GĐ1, `docs/changelog/0289-*.md`)                                                               |
| 2a  | `docs/specs/2026-09-12-gd2-vip-hoc-tu-do-mon-anh.md`  | Khoá theo **cấp CEFR A1–C2**; chốt chặn **ở SERVER** (không phải chỉ giao diện)                                                                  | ✅ **ĐÃ THI HÀNH** (PR #887, `docs/changelog/0290-*.md`)                                                              |
| 2b  | `docs/specs/2026-10-12-gd2b-cham-thi-cefr-server.md`  | Chuyển **chấm thi** về server để bịt nốt lỗ `cefrExams`; bộ đề tĩnh trên server; không thêm trần ngày; chấp nhận mất thi offline                 | ✅ **ĐÃ THI HÀNH** (lõi lẫn trong PR #1320 2026-10-10 không ghi chép; hoàn tất + đặc tả ở `docs/changelog/0616-*.md`) |
| 3   | `docs/specs/2026-09-12-gd3-khoa-bai-mon-lap-trinh.md` | Khoá theo **bậc P1→P6** (dễ→nâng cao); mở bậc sau khi **≥70% bài** bậc trước; **chỉ** xương sống, không khoá hướng chuyên sâu/khoá ngắn/lộ trình | ✅ **ĐÃ THI HÀNH** (PR #888, `docs/changelog/0291-*.md`)                                                              |
| 4   | `docs/specs/2026-09-12-gd4-khoa-bai-4-tru.md`         | **KHÔNG khoá gì ở 4 trụ** — chúng là công cụ, không phải giáo trình                                                                              | ⛔ **ĐÓNG, không thi hành**                                                                                           |

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
     sửa localStorage hay POST thẳng mảng giả không vượt được. ✅ **ĐÓNG NỐT ở GĐ2b (2026-10-12,
     changelog `0616`):** đề + đáp án + chấm ở server (`/api/cefr-assessment`, sổ thi
     `platform.feature_state`), `/api/progress` vứt `cefrExams` client gửi — bịa kết quả thi không
     còn mở được cấp.

⚠️ Việc này **mâu thuẫn với quyết định đóng băng phạm vi 2026-09-06** (ưu tiên 1: đo bằng chứng
người học thật trước). Đã nêu với chủ dự án; chủ dự án vẫn chọn làm. Ghi lại để sau này biết vì
sao ưu tiên 1 bị chen ngang.

**GĐ2b — ĐÃ LÀM (chủ dự án mở lại 2026-10-12, changelog `0616`; từng HOÃN 2026-09-12 vì mất thi
offline + năm câu hỏi §⑦ để ngỏ).** Phát hiện khi khảo sát: lõi (server dựng đề từ bộ đề tĩnh, giữ
đáp án, chấm, ghi sổ `platform.feature_state`; `progress.ts` chỉ đọc sổ đó) **đã vào mã từ PR
#1320 ngày 2026-10-10 mà không có đặc tả/changelog/ghi chú** — đợt 0616 bổ sung đặc tả, trả lời đủ
năm câu hỏi (bộ đề tĩnh · `start` không trả đáp án · KHÔNG thêm trần ngày vì 24 câu đoán mò ≈ 10⁻⁷
và đề là bài học đã mở cho người thi · lượt thi nằm trong DB nên deploy không mất · chấp nhận mất
thi offline), vá hai lỗ #1320 để lại: migration `0095` grandfather bài đạt theo cách cũ
(2026-09-12 → 2026-10-10) và khôi phục giọng Nghe ngẫu nhiên. Giới hạn còn lại: script tra JSON
công khai vẫn trả lời đúng được — cùng nợ 🟡 "Kiểm tra hiểu hội thoại CEFR" ở mục nợ, chờ quyết.

### Ưu tiên 1c — GÓC HỌC TẬP (đặc tả `docs/specs/2026-09-15-goc-hoc-tap-architecture.md`)

Các slice 0S, 01–04, S06–S08, S11, S12 ĐÃ THI HÀNH — bảng trạng thái và ghi chú dời nguyên văn sang
`docs/legacy/progress-luu-tru-den-2026-10-23.md` (cắt gọn 2026-10-23).

**Các slice còn lại của goal learning-ux — ĐẶC TẢ ĐÃ VIẾT 2026-09-15 (`docs/changelog/0328-*.md`), tất cả đã `Approved for implementation` từ 2026-09-15 (chủ dự án chốt toàn bộ §7 theo đề xuất mặc định — `docs/changelog/0329-*.md`).** Thứ tự thi hành đã chốt: S07 → S08 → S06 → S05 → S10 → S11 → S09 → S12 → S13. File: `docs/specs/2026-09-15-learning-ux-s{08,06,05,10,11,09,12,13}-*.md`. **Số migration cấp theo thứ tự MERGE thật, KHÔNG đặt trước (chủ dự án chốt 2026-09-15, PR #935):** cổng `scripts/migrations-readme-coverage.test.ts` cấm nhảy số, nên PR nào merge trước thì lấy số kế tiếp còn trống. S11-1 merge trước nên lấy `0081`; S05/S09/S12 lấy số còn trống tại thời điểm PR của chúng merge. Kế hoạch đánh số trước (S05 0081 · S11 0082 · S09 0083 · S12 0084) đã BỎ.

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

**Đã thi hành:** lệnh 10 (P1-9a, URL Lập trình → `/goc-hoc-tap/programming`) trong
`20cb2353`, và lệnh 11 (P1-9b, URL Tiếng Anh → `/goc-hoc-tap/english`) trong `c95240ca`.
Các route cũ vẫn có redirect tương thích; server/nginx/SEO (P1-9c) đã hoàn tất phần mã và tài liệu
trong lát lệnh 12. Còn hai việc tay:
người vận hành phải áp dụng các `location` 301 trên VPS theo `docs/deploy-vps-ubuntu.md`, rồi
đo Google Search Console sau 14 ngày (2026-10-01) để xác nhận URL cũ đã được thay thế.

**Còn lại:** nợ coverage branch, bundle JS, S09-3 conflict UI, read-model `stats`
không có cột nguồn, cùng các lỗi gate toàn repo đã ghi ở changelog. Mỗi lát tiếp theo phải có
đặc tả được duyệt và changelog riêng trước khi sửa mã.

### Ưu tiên 2 — nợ nội dung của mảng đã ship (đi sâu, không mở rộng)

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
- **[2026-10-10 — changelog `0577`–`0579`, `0594`, đặc tả `docs/specs/2026-10-10-toan-thcs-6-9.md`] Toán
  THCS ĐỦ 4 LỚP:** Toán 6 (9 chương, 26 bài, PR #1327), Toán 7 (10 chương, 28 bài, PR #1328), Toán 8
  (10 chương, 29 bài), Toán 9 (10 chương, 26 bài, changelog `0594`) — mọi bài `draft`, chờ giáo viên
  duyệt. Bài THCS cố ý KHÔNG vào ngân hàng đề bảng nháp. ✅ **[changelog `0596`, đặc tả
  `docs/specs/2026-10-10-menu-lop-thcs-va-bat-dau-6-9.md`]** Thanh bên mục Toán có Lớp 6–9 (trỏ danh
  sách bài `?lop=`), `/bat-dau` hỏi được lớp 6–9 khi chọn Toán (`IntentGradeSchema` 6–12 + migration
  `0092`). Phần TỔNG QUAN chương trình lớp 6–9 (`apps/dhcb/src/data/stemCurriculum.ts`) cố ý chưa viết.
  Tiểu học (1–5) chưa làm: cần khuôn bài riêng.
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
  3. ~~`mobile` S2–S4~~ (XONG 2026-09-21, `docs/changelog/0397-2026-09-21-bai-hoc-mobile-s2-s4.md`), ~~`algo` S3–S4~~ (XONG 2026-09-21, `p6-u226…u233`, PR #1094 —
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
  - ~~**mobile chỉ có S1**~~ — **ĐÃ TRẢ 2026-09-21** (`p6-u214…u225`, 24 bài, `docs/changelog/0397-2026-09-21-bai-hoc-mobile-s2-s4.md`).
  - ~~**systems, algo chỉ có S1–S2** (thiếu S3–S4).~~ — **ĐÃ TRẢ 2026-09-21** (`0397` algo, `0404` systems).
  - ~~**security thiếu S3–S4**~~ — **S4 ĐÃ TRẢ 2026-09-21** (`docs/changelog/0398-*.md`):
    `security-s4` = `p6-u206…u209`, 8 bài, cổng `securityS4Lessons.test.ts` (chặng PHÒNG THỦ, có
    danh sách từ vựng tấn công bị cấm); nối vào `principal-ai-p5` trước `principal-s3` kèm quiz
    `security-s4-q1…q5`. **Còn `security-s3`** (`p6-u210…u213`, đặc tả riêng đã duyệt).
  - ~~**data thiếu S4**~~ — **ĐÃ TRẢ 2026-09-21** (`docs/changelog/0396-*.md`): `data-s4` =
    `p6-u202…u205`, 8 bài, cổng `dataS4Lessons.test.ts`; nối vào `principal-ai-p5` trước
    `principal-s3`. Ghi lại cho đợt sau: nối một chặng vào lộ trình `principal-ai` thì **bắt buộc
    soạn quiz** trong `stageQuizzes.ts` — đặc tả không liệt kê điểm chạm này, cổng
    `ProgrammingPathPage.test.tsx` mới bắt được.
  - ~~**mathforcode S3/S4 mỏng** (2 unit/chặng thay vì 4 như các hướng khác).~~ — **ĐÃ TRẢ
    2026-10-09** (`docs/changelog/0570-*.md`): thêm `p6-u290…u293`, 8 bài; `mathforcode-s3` =
    `p6-u158, u159, u290, u291`, `s4` = `p6-u160, u161, u292, u293`, mỗi module đủ 2 bài; cổng
    `mathforcodeS34ExtraLessons.test.ts`.
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

- **Audit chất lượng nội dung 6 môn (2026-09-14)** — báo cáo đầy đủ:
  `docs/audit/2026-09-14-chat-luong-noi-dung-cac-mon-hoc.md`. 11 phát hiện; hai cái đã có ở
  trên (Toán thủng 6 chương · Sinh chưa có HSG). Mới và đáng làm ngay: `reviewStatus: 'draft'`
  của 294 bài STEM KHÔNG được giao diện đọc (người học không biết bài chưa duyệt); **588/677**
  vòng từ vựng sinh tự động thiếu câu mẫu (báo cáo ghi "610/699" là SAI — đã đính chính tại chỗ
  2026-09-14); cờ `notForKids` không phủ vòng sinh tự động; 23 vòng dưới 5 từ; 6 bài Hoá trùng
  tiêu đề; 20 giải thích câu hỏi dưới 40 ký tự; 14 bài Lập trình chỉ 1 test-case.
  **Cập nhật 2026-10-08:** F1/F4/F5/F8/F9/F10 đã trả ở `0300` + `0304`; F11 (câu ví dụ tiếng Anh
  dùng lại cho nhiều mục từ, đo lại: 39 câu/79 mục → 0) trả ở `0524`, cổng `CAU_VI_DU_KHONG_DUNG_CHUNG`.
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

### Ưu tiên 3 — kỹ thuật (nhỏ, đo được, không đổi hành vi)

- **Đợt 2 tích hợp ECC** (đợt 1 ở changelog `0468`, ADR-0013; chi tiết
  `docs/research/ecc-everything-claude-code.md` mục 6). ✅ Xong ở `0469`: (4) hook chặn
  `curl … | sh`; (5) nhắc mềm khi sửa file dùng chung (≥ 20 nơi import); bẫy escape → TRAPS mục 8.
  ✅ Xong ở `0470`: (3) ESLint `no-console` cho `apps/dhcb/src` + `apps/hub/src`. ✅ Xong ở
  `0473`: bảng nháp STEM thôi khen sai. ✅ Xong ở `0475`: gỡ studio "Tổng kết" (điểm bịa).
  ✅ Xong ở `0476`: (2) rút gọn CLAUDE.md 43.964 → 31.784 ký tự, phần lý do/lịch sử dời NGUYÊN VĂN
  sang `docs/claude-md-chi-tiet.md` (`npm run check:claude-md` chứng minh không mất dòng nào;
  `scripts/claude-md-split.test.ts` canh trần 34.000 ký tự). **Đang làm (chủ dự án duyệt
  2026-10-02):** (1) rà & viết lại `.agents/skills/` rồi chuyển sang `.claude/skills/`, bản
  `.agents/` giữ làm gương trùng từng byte — **11/11 đã chuyển**: `0477` (`ui-ux`,
  `marketing-content-writer`), `0478` (`principal-engineer-architect`,
  `financial-security-sentinel`, `pedagogy-linguistics-master`), `0479`
  (`stem-science-reasoning-master`, `memory-palace-cognitive-scaffolder`,
  `multimodal-realtime-voice-master`), `0480` (`autonomous-agent-orchestrator`,
  `gamification-viral-growth-architect`, `life-career-strategic-advisor`); cổng
  `scripts/skills-mirror.test.ts` chặn skill nhắc đường dẫn không tồn tại. CLAUDE.md §2.1 đã cập
  nhật theo.
  Còn chờ quyết: (6) hai người rà độc lập (`santa-method`) cho nội dung học.
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

- **[2026-10-27 · changelog `0675`, PR #1455] Thêm secret `VPS_SSH_FINGERPRINT` — DEPLOY DỪNG
  cho tới khi có.** Chạy TRÊN VPS: `ssh-keygen -l -f /etc/ssh/ssh_host_ed25519_key.pub | cut -d ' ' -f2`,
  dán kết quả (`SHA256:…`) vào GitHub → Settings → Secrets and variables → Actions. Chi tiết:
  `docs/ke-hoach-khoi-phuc-su-co-server.md` mục 3b.
- **[2026-10-10 · rà cảnh báo header/TLS của máy quét, changelog `0588`] Siết TLS ở dashboard
  Cloudflare** (code không sửa được — máy quét đo ở biên Cloudflare): **SSL/TLS → Edge
  Certificates** → Minimum TLS Version **TLS 1.2** · TLS 1.3 **On** · Cipher suites **Modern** (nếu
  gói cho chỉnh). Hết các mục Protocols/BEAST/Lucky 13. Các bước + lệnh `openssl` kiểm lại:
  `docs/cloudflare-setup.md` Bước 6. Sau khi deploy PR này, chạy lại máy quét: X-XSS-Protection,
  COOP, CORP phải hết; COEP + CSP `unsafe-inline/eval` còn lại CÓ CHỦ ĐÍCH (lý do ở `0588`). Gỡ CSP inline/eval bằng cách tách runtime chạy code sang `run.donghanhcungban.org` — đặc tả
  `docs/specs/2026-10-10-tach-runtime-chay-code-ten-mien-con.md` ĐÃ DUYỆT (Q1–Q4 theo đề xuất);
  R1 (trang runner + host Express/Nginx, changelog `0591`, PR #1345) + R2 (app gửi code sang
  runner, changelog `0592`, PR #1346) + R3 (CSP chặt dạng Report-Only báo về Sentry, gỡ 3 SDK
  đăng nhập thừa, changelog `0593`) xong — app CHỈ dùng runner khi build có `VITE_CODE_RUNNER_ORIGIN`.
  **Việc tay, ĐÚNG THỨ TỰ:** (1) R0: DNS `run` (A, proxied) + `sudo certbot --nginx -d
run.donghanhcungban.org --expand` + chép `nginx/en-vi.conf` + reload — lệnh kiểm:
  `docs/cloudflare-setup.md` Bước 7; (2) chỉ khi `curl -sI https://run.donghanhcungban.org/runner.html`
  ra 200: thêm `VITE_CODE_RUNNER_ORIGIN=https://run.donghanhcungban.org` vào `.env` trên VPS rồi
  deploy lại (build lại); (3) thử tay một bài Python + một bài DOM "Xem trang chạy"; (4) từ ngày
  bước (2) xong, đếm 7 ngày Report-Only: xem Sentry › Issues lọc `csp` — trước bước (2) mọi lượt
  chạy code đều báo `unsafe-eval` (ĐÚNG dự kiến, Worker còn ở origin app). Tiếp theo: R4 (bật
  CSP chặt thật + bắt buộc biến, chủ dự án duyệt sau 7 ngày không có vi phạm thật).

- **[2026-10-09 · Claude là AI chính, model theo nhiệm vụ, changelog `0568`, PR #1315 · structured
  outputs chấm điểm + Action Canvas, changelog `0569`/`0570`, PR #1316 · #1318] Năm việc trên VPS sau khi deploy** (phiên AI không có key
  Anthropic thật):
  1. Kiểm `ANTHROPIC_API_KEY` trong `/var/www/dhcb/.env` còn hiệu lực + tài khoản còn credit
     (`console.anthropic.com` › Billing). Từ đợt này Claude chạy MỌI lượt chat/chấm bài → hết credit
     là rơi hết về Groq/Gemini.
  2. Đặt ngưỡng cảnh báo chi phí, vd `AI_DAILY_BUDGET_USD=5` → `pm2 reload dhcb` (log ERROR khi vượt).
  3. ~~Chạy `npm run eval:tutor -- --runs 3`~~ **ĐÃ CHẠY 2026-10-09 (Haiku 5.5, 180 câu): recall
     99.2% ± 0.8 nhưng FP-rate 48.3% ± 6.7** (baseline cũ 5.6%) — 19 câu đúng bị đánh dấu ở cả 3
     lượt, kể cả `Hello`. Nghi Haiku viết lời khen vào dòng `✅` thay vì để trống; hậu quả thật ở
     Chat: hiện khung cam "sửa lỗi" và ghi câu ĐÚNG vào sổ lỗi cá nhân (`Chat.tsx` `addMistake`).
     **Việc tiếp:** sau khi deploy changelog `0576` (PR #1325), chạy
     `npm run eval:tutor -- --group clean --dump /tmp/eval-dump.jsonl` rồi gửi các dòng
     `"outcome":"FP"` để sửa prompt chat. **CHƯA được `--write-baseline`** (sẽ chốt FP 48% làm chuẩn).
     Sau vài ngày, đối chiếu thẻ "chi phí theo token thật" ở `/admin` với ước tính và chỉnh
     `AI_COST_*_USD`.
  4. Chấm thử 1 bài ở mỗi màn Writing · Speaking · Chat · Challenge · Reverse Interview (lượt chấm
     nay gửi JSON Schema — `packages/core-ai/gradingSchemas.ts`): điểm hiện đúng và counter
     `ai_anthropic_status_400` ở `/admin` không tăng. Có 400 → lượt đó đã rơi sang Groq; báo lại
     để gỡ schema gây lỗi.
  5. Action Canvas cũng gửi JSON Schema (changelog `0570`): chạy `npm run eval:action-canvas` rồi
     so với lần đo trước (bắt buộc vì đợt này sửa `goalDecomposition.ts`), và tạo thử 1 kế hoạch
     ở `/action-canvas`.

- **[2026-10-09 · sổ chống lạm dụng sau xoá tài khoản, changelog `0545`] Đặt khoá
  `ERASED_BENEFIT_LEDGER_KEY` trên VPS TRƯỚC khi deploy:**
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` → thêm vào
  `/var/www/dhcb/.env` → `pm2 reload dhcb`. Kiểm: log khởi động KHÔNG có dòng
  `❌ [erased-benefit-ledger]`. Thiếu khoá thì sổ tắt (xoá rồi đăng ký lại sẽ nhận lại dùng thử), xoá
  tài khoản vẫn chạy. Cất khoá cùng chỗ các khoá khác của `.env` (backup env lên R2), KHÔNG chung
  với bản dump CSDL.

- **[2026-10-08 · seed giọng ElevenLabs, PR #1270, changelog `0517`] Nghe thử giọng điệu rồi mới seed
  lớn** (phiên AI không có key và seed tốn tiền thật): (1) điền `ELEVENLABS_API_KEY` vào `.env` trên
  VPS; (2) `npm run eleven:tone-sample` (~400 credit) rồi nghe 8 file mp3 — nếu model ĐỌC THẲNG chữ
  "calm"/"cheerful"/"excited" thì dừng, đổi `ELEVENLABS_TONE_MODEL` hoặc seed với `--no-tone`;
  (3) `npm run seed:all -- --eleven --check` xem ước tính (toàn bộ ~17,3 triệu credit); (4) seed theo
  hạn mức gói, vd `npm run seed:all -- --eleven --eleven-budget=400000`, chạy lại hàng tháng để làm
  tiếp. Chưa kiểm được bằng API thật: v4 hiểu thẻ trên tiếng Việt, `/with-timestamps` với v4, giá v4,
  và `Rachel` còn gọi được không. Hướng dẫn: `docs/seed-guide.md` mục 8.

- **[2026-09-30 · audit UI/UX, changelog `0466`] Ba việc kiểm tay trên production** (phiên AI
  không tới được production vì chính sách mạng của môi trường chặn `*.donghanhcungban.org`):
  1. **Hub có trong `ALLOWED_ORIGINS` không.** `DEFAULT_ALLOWED_ORIGINS`
     (`packages/core-auth/security.ts`) không có `https://hub.donghanhcungban.org`. Nếu `.env` trên
     VPS cũng không liệt kê hub thì đăng nhập ở hub trả 403. Kiểm:
     `grep ALLOWED_ORIGINS /var/www/dhcb/.env`.
  2. **Bảng `plan_marketing_bullets` còn câu Free cũ không.** Seed `0025` ghi "+5 lượt AI/ngày…
     tối đa 35 lượt trong 7 ngày", trong khi Free nay là 30 lượt/ngày. Trang giá đọc từ bảng này,
     nên nói sai với người dùng. Kiểm:
     `select plan, text_vi from plan_marketing_bullets where plan = 'free';`. Sửa câu chữ là
     quyết định của chủ dự án (đợt U5).
  3. **Chạy `npm run cwv:prod` từ máy có mạng** để có Core Web Vitals thật. Số trong báo cáo là số
     LAB: LCP trượt 2,5 s ở mọi trang app trong điều kiện Slow 4G.

- **[2026-09-27 · audit bảo mật lần hai, changelog `0465`] BA việc tay trên VPS — làm NGAY sau khi
  PR vá merge + deploy xong** (code đã vá, nhưng ba chỗ này nằm ngoài repo):
  1. **Xoay khoá VAPID (khoá cũ đã lộ trong lịch sử git public).** Trên VPS:
     `node -e "console.log(JSON.stringify(require('web-push').generateVAPIDKeys()))"` → thay
     `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` trong `/var/www/dhcb/.env` → `pm2 reload dhcb`. Người
     dùng bật lại "Nhắc học" một lần là client tự đăng ký lại. Kiểm: log khởi động KHÔNG còn dòng
     `🔴 [security] VAPID key đang dùng là cặp khoá ĐÃ LỘ`.
  2. **Áp `nginx/en-vi.conf` mới** (ghi đè `CF-Connecting-IP`/`X-Forwarded-For`):
     `sudo cp /var/www/dhcb/nginx/en-vi.conf /etc/nginx/sites-available/donghanhcungban && sudo nginx -t && sudo systemctl reload nginx`.
     Lớp app đã tự vá (đọc `X-Real-IP` trước) nên đây là lớp thứ hai, không gấp bằng mục 1.
  3. **Chỉ cho Cloudflare vào cổng 80/443** (`ufw` theo dải `https://www.cloudflare.com/ips/`,
     giữ cổng 22). Trước bản vá, IP thật của VPS có thể đã lộ qua lỗ SSRF Web Push, nên "gọi
     thẳng vào IP gốc" không còn là giả định. Xem `docs/cloudflare-setup.md` mục cuối.

- **[2026-09-27] Bật lối vào Sales-Hunter trên trang chủ — CHỈ sau khi Sales nghiệm thu.** PR
  [#1183](https://github.com/seeker19110/dhcb/pull/1183) (changelog `0460`) đã đặt khối ở trang
  chủ, mặc định "Chưa mở truy cập". Thứ tự: phía Sales (repo Sales-Hunter) làm xong
  staging/HTTPS/Access/backup-restore → thêm `VITE_SALES_HUNTER_PILOT_ENABLED=true` vào `.env`
  build trên VPS → deploy lại. Tắt: bỏ cờ rồi build lại; thu hồi quyền phải làm ở Access/Sales.
  ⚠️ **Cookie phiên DHCB (`Domain=.donghanhcungban.org`) được trình duyệt gửi kèm MỌI request tới
  `sales.donghanhcungban.org`** (audit 0465). Trước khi bật cờ: hoặc đưa Sales sang tên miền
  riêng, hoặc cấu hình biên của Sales xoá header `Cookie: session_token=…` trước khi vào ứng
  dụng — nếu không, log/lỗi của Sales là nơi rò phiên đăng nhập DHCB. WebSocket DHCB đã chặn
  Origin `sales.*` từ 0465.

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
  - `ADMIN_USER_IDS` — danh sách UUID (`public.users.id`) được vào trang quản trị
    (`packages/core-auth/adminAuth.ts`). Từ đợt `0464` KHÔNG còn cấp quyền theo `ADMIN_EMAILS`.
    Thiếu thì không ai vào được trang quản trị.
  - `AZURE_SPEECH_KEY`/`AZURE_SPEECH_REGION` — **TÙY CHỌN**, chỉ cần khi muốn bật chấm phát âm
    chi tiết qua Azure. Tạo resource "Speech service" (free tier F0, 5h audio/tháng) ở Azure
    Portal → Keys and Endpoint. Thiếu thì `/api/pronounce-assess` trả "chưa cấu hình" và client
    rơi về Giai đoạn 1 miễn phí.

## Quyết định quan trọng

- **[2026-10-09] Claude (Anthropic) là AI CHÍNH, chọn model theo NHIỆM VỤ** (chủ dự án chốt trong
  phiên, changelog `0568`, đặc tả `docs/specs/2026-10-09-phan-chia-model-claude-theo-nhiem-vu.md`).
  Thứ tự provider: **Anthropic → Groq → Gemini** (trước: Groq miễn phí đứng đầu). Haiku 5.5 cho trò
  chuyện/luyện nói/tranh biện; Sonnet 5.5 cho chấm bài, Companion, góp ý code, Action Canvas. Bảng
  định tuyến ở `packages/core-ai/aiConfig.ts#getAnthropicRoute`, đổi model qua
  `ANTHROPIC_FAST_MODEL`/`ANTHROPIC_SMART_MODEL`. **Đánh đổi đã biết:** chi phí từ ~0 lên trả phí thật
  (ước tính $0.0006/lượt chat, ~$0.03/lượt chấm bài); đổi lại chất lượng ổn định hơn. Chưa có số
  `eval:tutor` cho model mới — việc tay ở mục A. **Lượt chấm điểm dùng structured outputs** (changelog
  `0569`): client gửi TÊN khuôn JSON (`output_schema`), server giữ schema ở
  `packages/core-ai/gradingSchemas.ts`; sửa khoá JSON trong prompt chấm thì PHẢI sửa schema
  (`apps/dhcb/src/prompts/gradingSchemas.contract.test.ts` canh). Action Canvas cũng vậy (changelog
  `0570`): schema `GOAL_DECOMPOSITION_JSON_SCHEMA` nằm cạnh khuôn Zod; góp ý code giữ văn xuôi,
  KHÔNG áp schema (chờ chủ dự án quyết có thiết kế lại sang JSON không).

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

## Nợ kỹ thuật còn mở

- 🟠 **[2026-10-26 — audit sâu; THU HẸP ở `0668`, `0669`, `0670`, `0671`, `0672`, `0673`, `0674`, `0675`] HẾT mục Cao; còn mở 4 mức Trung.**
  ✅ `0668` (PR #1447): đã sửa `AUD-DATA-002`, `AUD-SEC-003`, `AUD-SEC-004` (restore an toàn).
  ✅ `0669` (PR #1448): đã sửa `AUD-CFG-001` (cầu dao AI chặn cả khách).
  ✅ `0670` (PR #1449): đã sửa `AUD-SEC-001` (công cụ đọc tôn trọng policy DENY).
  ✅ `0671` (PR #1450): đã sửa `AUD-DATA-001` (khoá theo user cho lần đồng bộ tiến độ đầu).
  ✅ `0672` (PR #1451): đã sửa `AUD-CODE-001` (Ambient/Neuro/A2A đọc body đúng hợp đồng).
  ✅ `0673` (PR #1452): đã sửa `AUD-XFEAT-001` (client/server dùng chung hàm gộp SRS).
  ✅ `0674` (PR #1453): đã sửa `AUD-XFEAT-002`, `AUD-XFEAT-003` (dev Vite giữ cookie/Origin, có `/api/subjects`).
  ✅ `0675` (PR #1455): đã sửa `AUD-CI-001`, `AUD-SEC-002` (deploy dừng khi `npm ci` lỗi, bắt buộc fingerprint SSH).
  Theo dõi từng ID tại [sổ audit](docs/ops/AUDIT-STATUS.md); bằng chứng tái hiện, giới hạn và kế hoạch
  chia đợt nằm trong [báo cáo audit](docs/ops/AUDIT-REPORT-2026-10-26.md). Chủ xử lý: kỹ thuật qua PR;
  riêng thu hồi credential cần chủ dự án xác minh trên provider.

  **Bốn mục Trung còn mở:**

  - `AUD-HAR-001`, `AUD-HAR-002`, `AUD-DOC-001`: cập nhật guard, bổ sung template PLAN từ nguồn
    framework được hỗ trợ và sửa hướng dẫn cloud đang gọi script không tồn tại.
  - `AUD-SEC-005`: chủ dự án đối soát việc thu hồi VAPID/Supabase service-role lịch sử; nối với việc
    xoay VAPID đã có trong mục "Cần làm tay" A. Chưa biết credential cũ còn hiệu lực hay đã thu hồi;
    không coi việc xóa file là bằng chứng thu hồi và không gửi giá trị secret trong chat.

  **Điều kiện đóng:** từng ID có bằng chứng sửa và gate tương ứng đạt, cập nhật trạng thái kèm PR/SHA
  trong sổ audit; credential cần bằng chứng thu hồi/rotation. Build/unit/coverage xanh riêng chưa đóng
  các lỗi đã tái hiện. _Xem lại khi:_ trước phát hành hoặc khi thay đổi sync, AI/policy, restore,
  dev adapter, deploy hay harness.

- 🟡 **[2026-10-26 — changelog `0665`] `@anthropic-ai/sdk` 1.x CHƯA nâng (Dependabot chặn bản major).**
  SDK 1.0 đổi API version `2023-06-01` → `2026-10-21` và gửi khoá qua `Authorization: Bearer` thay
  `x-api-key` (PR #1439 đỏ). **Gỡ theo thứ tự:** (1) đọc ghi chú API version `2026-10-21` của Anthropic, rà
  `packages/core-ai/anthropicClient.ts` + `anthropicToolLoop.ts` (đọc `stop_reason`/`usage`/beta header);
  (2) harness replay (`scripts/lib/providerReplay.ts`, `companionRuntimeConsent.ts`) nhận Bearer khoá giả,
  ghi lại fingerprint fixture (`scripts/eval-companion-replay-fixtures.json`,
  `companionRuntimeConsentFixture.ts`); (3) chủ dự án chạy `eval:tutor`/`eval:companion`/`eval:action-canvas`
  với key thật trước khi merge; (4) gỡ mục `ignore` ở `.github/dependabot.yml`. `linkedom` 0.18.14 cũng bị
  chặn (vỡ build worker do `@acemir/cssom`) — chỉ đúng bản đó, không cần làm gì thêm.

- 🟡 **[2026-10-12 — changelog `0622`; THU HẸP ở `0623`, `0624`, `0625`, `0626`, `0627`, `0628`] Red-team AI: phần Companion V2 ĐÃ KIỂM
  THẬT, còn các mặt khác.** ✅ `eval:v2:red-team` viết lại chạy trên Postgres thật, chặn CI (job
  `sql-prepare`): **54/54** (PI 14 · TA 13 · SL 12 · AG 15) — lần chạy đầu bắt được lỗi sản phẩm (DENY + tự chạy
  của `proposeAction` sập vì khoá ngoại), đã sửa cùng PR. ✅ `0624`: byte NUL trong body JSON → 400 ở
  `readJsonBody` (mọi handler) + schema Companion; `DOMAIN_KEYWORDS` không còn trả domain ma
  `career`/`startup`/`life`. **Còn mở:** (1) ✅ `0626`: chế độ tác tử đã có họ ca AG (14 ca, kịch bản gọi
  công cụ đóng vai Claude, tầng công cụ trên Postgres thật) — còn lại: Claude THẬT có bị dụ gọi công cụ
  không (cần key AI); (2) `eval:tutor` + `eval:companion` có **0** ca injection, chấm bài viết chưa có
  eval (`docs/ops/ai-eval-red-team.md` §5); (3) ✅ `0625`: `eval:v2:permissions` nay chạy Postgres thật (21 ca,
  chặn CI) — lộ và sửa lỗi đặt policy đồng thời → 500; (3b) ✅ `0627`: policy `AUTOMATE` đã quá
  `review_at` nay được `resolveAuthority` hạ về `EXECUTE_WITH_CONFIRMATION` (chờ xác nhận), dòng policy
  giữ nguyên — chủ dự án chốt "theo khuyến nghị"; (4) ✅ `0628`: domain `career`/`startup`/`life` đã gỡ
  khỏi 6 contract + 5 service + modal phản tỉnh, dùng chung `packages/core-contracts/pillarDomain.ts`
  (dữ liệu lưu cũ mang trụ đã xoá đọc ra `general`, không lỗi). _Xem lại khi:_ trước khi Companion/planner
  nhận thêm quyền ghi dữ liệu, hoặc khi có PR đổi prompt `/api/agent`.
- 🟡 **[2026-10-09 — sau changelog `0558`, rà bảo mật độc lập] Kiểm tra hiểu hội thoại CEFR: script
  vẫn TRA được đáp án từ đề công khai + `dialogues.json` — CẦN CHỦ DỰ ÁN QUYẾT.** Đợt `0558` đã
  chặn tính đáp án trước khi mở lượt, replay cùng lượt, và xem đáp án câu sai (token HMAC, seed ẩn,
  không trả `correctId`). Còn lại hai đường, không chặn được bằng seed: (1) đọc đề rồi tra
  `dialogues.json` (đáp án là sự thật trong dữ liệu công khai) — chỉ hết khi dữ liệu hội thoại không
  còn gửi cho giao diện (đổi kiến trúc, tốn nhiều) — **vẫn chờ quyết**; (2) ✅ **đoán mò — đã vá
  đợt `0559`** (PR [#1307](https://github.com/seeker19110/dhcb/pull/1307)): trần 5 lượt nộp KHÔNG ĐẠT/24 giờ/(người, hội thoại), hết
  trần → 409 `ATTEMPT_CAP` ở cả mở lượt lẫn nộp. Đo thật: đoán ngẫu nhiên đạt 25–29 %/lượt nên vẫn
  ~77 % đạt trong 5 lượt/ngày — trần chặn VÉT CẠN tự động, không làm đoán mò bất khả. Đặc tả
  `docs/specs/2026-10-09-hoi-thoai-cefr-seed-server-cap.md` ⑤b + ⑥.
- 🟡 **[2026-10-08 — HẠ MỨC từ 🔴 sau `0527`] Xuất/xoá dữ liệu cá nhân `/api/persons` ĐÃ SỬA** (5 cột
  sai, bỏ nuốt lỗi, mọi bảng `person_id` trong một danh sách duy nhất `PERSON_TABLES` (21 lúc `0527`, nay
  26 — audit 2026-10-20 đối chiếu) — trước sót 11 bảng; test tích hợp
  Postgres thật canh danh sách khớp `information_schema`). Lưới `unhandledRejection`/`uncaughtException`
  (`0528`) và cổng CI `sql-prepare` (`0529`) cũng đã làm. (1) ✅ **Xoá tài khoản + tải toàn bộ dữ liệu** đã làm ở `0533`
  (`/api/account`, đặc tả `docs/specs/2026-10-08-xoa-tai-khoan-va-xuat-du-lieu.md`): mọi bảng có cột
  người dùng khai trong `ACCOUNT_TABLES` (test tích hợp đối chiếu `information_schema`), xác minh lại
  bằng mật khẩu/Google + 2FA, chứng từ thanh toán ẨN DANH chứ không xoá (migration `0088`), chặn xoá
  khi còn đơn chờ trả. (a) ✅ **xoá rồi đăng ký lại KHÔNG nhận lại dùng thử/thưởng giới thiệu**
  (`0545`, đặc tả `docs/specs/2026-10-09-so-chong-lam-dung-sau-xoa-tai-khoan.md`): sổ
  `platform.erased_benefit_ledger` (migration `0089`) giữ 12 tháng mã băm HMAC email/thiết bị +
  quyền lợi đã hưởng, không user_id/plaintext; người mời xoá thì `referrals.referrer_id` → null.
  **Việc tay trước khi deploy:** đặt `ERASED_BENEFIT_LEDGER_KEY` trên VPS (thiếu ⇒ sổ tắt, log lỗi
  lúc khởi động, xoá vẫn chạy). (b) ✅ `0546` — vẫn chặn mặc định (không mất
  tiền) nhưng người dùng tự gỡ được: khối xoá tài khoản hiện rõ đơn chờ + nút "Huỷ đơn — tôi CHƯA
  chuyển khoản" (`/api/payment-cancel`, trạng thái `cancelled`, migration `0090`); tiền về sau khi
  huỷ/xoá vào hàng chờ "Cần hoàn tiền" ở /admin (`public.payment_refunds`, đánh dấu đã hoàn một
  chiều). (2) ✅ `/api/persons?action=full_erase` nay đòi xác minh lại
  (mật khẩu/Google + 2FA) qua cổng dùng chung với `/api/account` (`api/_lib/reauthGate.ts`, cùng
  hạn mức lượt thử), `0541` — chưa có giao diện nào gọi endpoint này; (3) ✅ câu SQL dựng động nay `check:sql` kiểm hết (21 → 0 câu bỏ qua, `0536`).
- 🟡 **[2026-10-02 — HẠ MỨC từ 🔴 sau changelog `0473`; THU HẸP ở `0547`, `0551`, `0552`, `0560`, `0608`, `0611`, `0612`, `0613`, `0614`] Bảng nháp
  STEM (Companion › Thử thách) — bước giữa đã kiểm được cho Toán + Hoá, Vật lí kiểm thứ nguyên.** `0547` (đặc tả
  `docs/specs/2026-10-09-kiem-buoc-giai-stem.md`): Toán — phương trình đại số MỘT ẩn được so TẬP
  NGHIỆM THỰC với đề, chính xác (đa thức hữu tỉ BigInt + Sturm, giữ điều kiện xác định) → `✓ Hợp lệ`
  / `✗ Đổi nghiệm` (mất/thêm nghiệm) / `✗ Chia cho 0`; Hoá — đếm nguyên tử + điện tích, bắt đổi chất
  → `✗ Lệch nguyên tử` / `✗ Lệch điện tích` / `✗ Đổi chất`; còn lại `? Chưa tự kiểm được` kèm câu
  nói rõ phạm vi. "Giải xong" cần `isFinalAnswer`. `0552` (đặc tả
  `docs/specs/2026-10-09-kiem-thu-nguyen-vat-li.md`): Vật lí kiểm THỨ NGUYÊN từng bước
  (`stepCheckPhysics.ts`) — lệch đã chứng minh → `✗ Lệch thứ nguyên`, khớp vẫn là "?" (điều kiện
  cần). `0551` (đặc tả `docs/specs/2026-10-09-stem-goi-y-socratic-va-nop-loi-giai.md`): gợi ý là câu
  hỏi Socratic ba bậc theo bộ kiểm Toán · Hoá · Vật lí (không còn lộ `x = 5`, có test bất biến);
  ngân hàng đề THẬT 272 câu từ bài học Toán · Lí · Hoá thay dữ liệu mẫu `S_{n} = …`; nút "Nộp lời
  giải" gọi `submit_solution` (chấm theo `questionId` do server gán); hàng nhập 390px hết chật.
  ✅ `0560` (đặc tả `docs/specs/2026-10-09-bang-bien-vat-li-ngan-hang-de.md`): 86/89 câu Vật lí của
  ngân hàng có bảng `variables` khai trong bài học, server gắn vào phiên khi mở đề bằng
  `questionId` (giao diện chỉ mở đề từ ngân hàng nên không cần gửi gì); 3 câu số đếm cố ý không
  khai. **Còn lại:** (1) Vật lí — chưa kiểm vector/chiều, đạo hàm/tích phân; bảng biến cho đề TỰ DO
  chỉ gửi được qua API (giao diện không có luồng tạo đề tự do);
  (2) Toán ngoài phạm vi: căn bậc ba, BA căn khác nhau trở lên trong một quan hệ, mẫu dạng
  `C + D√f`, lượng giác, log, π, dấu `≠`, nhiều ẩn (căn bậc hai, chính xác `A + B√f` ✅ `0613`, đặc
  tả `docs/specs/2026-10-11-can-bac-hai.md`; hai căn khác nhau `√(x+5) + √x = 5` — tháp hai tầng ✅
  `0614`, đặc tả `docs/specs/2026-10-11-hai-can-khac-nhau.md`; dấu chia `:` ✅ 0562; bất
  phương trình một ẩn ✅ `0608`, đặc tả `docs/specs/2026-10-11-kiem-buoc-bat-phuong-trinh.md`; trị
  tuyệt đối (chia trường hợp, chính xác) + ký hiệu tập `S = (a; b)`, `x ∈ [a; b) ∪ {c}`, `S = ℝ \ {a}`
  ✅ `0611`, đặc tả `docs/specs/2026-10-11-ky-hieu-khoang-va-tri-tuyet-doi.md`); (3) ✅ `0612` mốc phương trình cho câu
  Toán ngân hàng (trường `equation` của câu "Tự kiểm tra", đặc tả
  `docs/specs/2026-10-11-moc-de-ngan-hang-toan.md`) — đo thật: trong 168 câu Toán lớp 10–12 chỉ 1
  câu có phương trình một ẩn NGUYÊN VĂN mà việc giải nó là đề bài (`x² + 1 < 0`); các câu còn lại
  không có phương trình hoặc phải tự lập (khai sẵn = lộ cách giải), nên bước 1 vẫn là mốc. Câu "Giải
  phương trình…" thật ở lớp 8–9, ngoài ngân hàng (muốn đưa vào cần bộ lọc lớp ở màn chọn đề); 272 câu đều là bài `draft` chưa duyệt chuyên môn.
- 🟡 **[2026-09-30 — audit UI/UX chuẩn 2026, `docs/audit/2026-09-30-audit-ui-ux-chuan-2026.md` —
  HẠ MỨC từ 🔴 sau changelog `0512`, 2026-10-07] Phần WCAG 2.2 A/AA của audit ĐÃ ĐÓNG.** U1–U9 +
  đợt minor (#1222–#1255) đóng 8 critical + major/minor. Đo lại bằng máy trên `main` `e3afc29`
  (56 route × 320/390/1440 × 3 theme, mock E2E) còn sót 8 lỗi — đặt lại mật khẩu trượt
  `target-size`, 10 `<main>` không `id` (Luyện viết mobile, `/bat-dau/doi-song`, Kết bạn…), 3 màn
  không `<h1>`, h2→h4 ở chi tiết hướng, `/action-canvas` tràn 76px ở 320px, tiêu đề tab bài hội
  thoại trùng — đã sửa ở `0512` (ĐÃ MERGE #1262) + cổng
  `e2e/a11y-u10-recheck.spec.ts`. Sau sửa: 0 vi phạm axe A/AA, 0 tràn ngang, mọi route một
  `main#noi-dung-chinh` + một `<h1>`. **Còn mở (không phải lỗi WCAG / cần quyết định):** rail mục
  lục đứng trước `<h1>` ở 1440px (đổi thứ tự DOM của `TwoPane` — quyết định thiết kế); M17 chuẩn hoá nút/bề rộng ĐÃ XONG (`0513`–`0520`,
  #1264–#1272): gỡ hết `transition-all`; mọi nút CTA/accent/zinc tự ghép → `buttonClass`;
  sửa chữ trắng trên nền accent (bong bóng tin nhắn, nút Đăng nhập — trượt AA ở Xanh đêm); hub có token
  ngữ nghĩa; bề rộng nội dung 4 giá trị có chủ đích (`e2e/page-width.spec.ts`); mỗi loại có cổng chặn tái
  phát trong `DesignSystem.design.test.ts`; việc tay mục A (`plan_marketing_bullets`, hub
  trong `ALLOWED_ORIGINS`, `cwv:prod`). Giới hạn: đo trên mock, không có trình đọc màn hình thật.

- 🟡 **[2026-09-27 — audit bảo mật lần hai, `docs/changelog/0465-*.md`] Bốn nợ còn lại sau đợt
  vá 7 lỗ hổng.** (1) ✅ **ĐÃ VÁ ở changelog `0510`** (ngắt socket khi `member_left`/`session_ended`) — mô tả cũ: người đã RỜI chuyến mà giữ socket mở vẫn
  nhận vị trí của thành viên còn lại tới khi socket gửi sự kiện kế tiếp (fan-out ở
  `packages/core-location/wsLocation.ts` không kiểm lại quyền) — cần đẩy sự kiện thu hồi khi rời
  chuyến. (2) ✅ **ĐÃ GỠ ở changelog `0513`** — mô tả cũ: **`/ws/voice-companion` và `/ws/co-learning-room` không có client nào gọi** — đã
  siết Origin/kích thước, chủ dự án quyết gỡ hay giữ. (3) ✅ **ĐÃ GHIM SHA ở changelog `0521`** — `appleboy/ssh-action` (cầm
  SSH key VPS) nay ghim commit SHA; cổng `scripts/ci-workflow-policy.test.ts` chặn mọi action ngoài `actions/` ghim theo tag. (4) Chưa quét
  được trang production từ phiên AI (proxy chặn domain) — bài thử "gọi thẳng IP gốc với
  `CF-Connecting-IP` giả" nên chạy tay sau khi deploy, cách làm ở `docs/cloudflare-setup.md`.
  **[2026-10-08 — audit kiểm soát truy cập 113 route, `docs/changelog/0526-*.md`]** Đã vá 4 lỗ IDOR
  (realtime-multimodal, scenario-holodeck, socratic-diagnostics, gắn task/tài liệu vào dự án người
  khác ở `/api/work`). (a) ✅ `/api/realtime-multimodal` ĐÃ GỠ ở `0534` (không client nào gọi); ✅ Map
  phiên `/api/scenario-holodeck` + `/api/socratic-diagnostics` (CÓ client thật trong Companion nên
  giữ) ĐÃ XỬ LÝ ở `0538`: TTL trượt 30 phút, trần 5 phiên/người (đóng phiên cũ nhất), trần 2 000
  phiên/tiến trình (503), client hiện "Bắt đầu lại"; (b) ✅ `/api/pronunciation`
  cache MISS nay trừ lượt Free/VIP (`0534`);
  ~~(c) `/api/admin-feature-status` so `x-cron-key` bằng `===`~~ — ✅ ĐÃ SỬA ở `0531` (`packages/core-auth/secretCompare.ts`).

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
  **Rà mắt Sinh xong (2026-09-27, `docs/changelog/0462-*.md`):** 64/64 soi 5 mốc, sửa 47 (khoảng
  20 sai KIẾN THỨC: chạc chữ Y vẽ ngược, nguyên phân 2n = 4 không có cặp tương đồng, phả hệ "ba thế
  hệ" chỉ có hai, đường S nằm trên đường J…) + một bài gắn nhầm hoạt ảnh (`sinh10-c8-b26`). **Chuỗi
  rà mắt 4 môn STEM xong.** **Hoạt ảnh Sinh dạng "chuỗi ô chữ": đã vẽ lại hết thành hình thật**
  (đếm lại trên `main` là 20 bài, không phải 21 như 0462 ghi: 5 bài ở changelog 0561 — PR #1306,
  15 bài còn lại ở changelog 0564). **Còn thiếu:** cấu trúc animation cho môn Anh (chưa
  thiết kế).
  (Bản này thay 9 file bài học của #1187 — changelog 0461; `shots:lesson-anim` chạy được trên Windows từ #1187.)
  Đặc tả: `docs/specs/2026-09-21-hoat-anh-mo-phong-bai-hoc.md`.
- 🟡 **[2026-09-17 — S13-2] AC-8 (ma trận thị giác 6 màn × 5 trục) CHƯA CHẤM:** spec S13 §7 Q6 cấm agent vừa làm vừa chấm — điểm cuối là của chủ dự án. 18 ảnh bắt buộc chụp sẵn bằng `npm run shots:learning-ux`. **Gỡ:** chủ dự án chấm 30 ô kèm một câu lý do/ô; ô < 4 thành mục việc. Goal `learning-ux` KHÔNG được kết luận COMPLETE trước đó.

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

  **Cập nhật 2026-10-10 (`docs/changelog/0583-*.md`):** từ khi rate limit chuyển sang fail-closed,
  mỗi lần client Redis chưa `ready` = người dùng thật nhận **429 oan** (không còn là "cửa sổ lỏng").
  Đã giảm thiệt hại mà KHÔNG đổi `enableOfflineQueue`: mọi instance mở kết nối lúc khởi động
  (`warmUpRedis`), và ở trạng thái `connecting`/`reconnecting` chờ tối đa 1 s sự kiện `ready` trước
  khi từ chối. Gốc rễ (vì sao rớt ~7 lần/ngày) VẪN mở — đọc lại `pm2 logs dhcb --err` như trên.

- 🟡 **[ĐO LẠI 2026-09-14 — mô tả "ngân sách BUNDLE nay rộng" ĐÃ LỖI THỜI] Cả COVERAGE lẫn
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

- 🟡 **[2026-08-25] Tầng 8 (Core Web Vitals) và Tầng 9 (vận hành production) CHƯA kiểm được
  trong lượt audit toàn diện 2026-08-25.** Proxy của container chặn
  `en-vi.donghanhcungban.org` (403 CONNECT tunnel). Hai tầng này được ghi **TRỐNG**, không chấm
  đạt — một lượt audit thiếu 2/13 tầng thì không được coi là đã phủ hết.

  **Điều kiện gỡ nợ:** từ máy có mạng tới server — chạy Lighthouse trên trang chủ + Dictionary +
  1 trang CEFR (ngân sách LCP ≤ 2,5s · INP ≤ 200ms · CLS ≤ 0,1), và đọc Sentry (lỗi mới chưa
  xem xét) + `pm2 logs`/số lần restart + dung lượng ổ đĩa.

  **Cập nhật 2026-10-10 (`docs/changelog/0582-*.md`): TRANG CHỦ đã đo được trên production**
  (phiên này tới được `www.donghanhcungban.org`): mobile 70 (LCP 5,1 s), desktop 96. Đã sửa ba
  nguyên nhân chính (khách tải JS trang chủ thành viên, việc nền chen băng thông, font latin-ext
  thừa) — đo cục bộ trước/sau: mobile 66 → 89 (LCP 7,3 → 3,1 s), desktop 84 → 99.
  **Tiếp 2026-10-10 (`docs/changelog/0584-*.md`, người dùng chốt prerender):** dựng sẵn HTML
  trang chủ khách (mobile) + nạp JS sau lần vẽ chữ đầu + `llms.txt`/404 `/.well-known/` — đo cục
  bộ Lighthouse 13.5 mobile 97–99 (FCP = LCP 1,5 s), A11y/BP/SEO/Agentic Browsing 100.
  **Tiếp 2026-10-11 (`docs/changelog/0601-*.md`): TẦNG 8 ĐÃ ĐO ĐỦ 3 TRANG trên production**
  (Lighthouse 13.5 mobile, cấu hình PageSpeed): trang chủ 99 (LCP 1,1 s — xác nhận đợt 0584 sau
  deploy); Từ điển 91–93 (LCP 2,8–2,9 s); trang cấp CEFR B1 83–85 (LCP 3,1–3,2 s), đo Slow 4G
  thật thì 6,3–7,3 s vì chờ `curriculum.json` ~1 MB nén → đã tách bản tóm tắt
  `curriculum-index.json` + hoãn dữ liệu nặng: đo cục bộ trên đường Slow 4G dùng chung, LCP
  13,7 → 5,4 s. CLS cả ba trang 0–0,012. **Còn mở:** (1) Từ điển + CEFR vẫn trên ngân sách LCP
  2,5 s ở mobile — phần còn lại là chuỗi chunk JS của trang. **CEFR đã tách ở
  `docs/changelog/0603-*.md`** (nạp lười màn con/tab học/bài thi: JS tĩnh thêm trước nội dung
  425 → 180 KB thô); **Từ điển đã tách ở `docs/changelog/0604-*.md`** (nạp lười 4 tab học:
  317 → 138 KB thô); (2) **CEFR B1 đã đo lại sau deploy 0601+0603** (`docs/changelog/0605-*.md`):
  điểm 90–92, LCP 2,9–3,1 s, TBT 70–80 ms (trước 83–85 · 3,1–3,2 s · 190–280 ms) — LCP còn lại
  chủ yếu là CSS chặn hiển thị (~450 ms) + TTFB. **Từ điển đã đo lại sau deploy 0604**
  (`docs/changelog/0606-*.md`): 90–92, LCP 2,8–3,0 s, TBT 20–120 ms, request JS trước 3 s
  60 → 27 — LCP chưa tách được khỏi nhiễu TTFB đo từ container (0,4–1,5 s, cả `/api/health`).
  CSS chặn hiển thị: đã bỏ ~170 rule rác do Tailwind tự quét cả repo (`0606`, 34,7 → 32,8 KB
  gzip); phần còn lại là utility dùng thật. **CSS tới hạn nội tuyến: ĐÃ ĐO, KHÔNG LÀM** — trên
  trang đã đăng nhập, CSS về CÙNG lúc JS entry (Từ điển: 1,73 s vs 1,75 s) và nội dung đầu tiên do
  React vẽ sau khi JS chạy (FCP 2,25 s), nên đường găng là chuỗi JS chứ không phải CSS;
  trang chủ khách (nơi CSS nằm trên đường găng) đã 97–99 nhờ bản dựng sẵn; (3) Tầng 9 — phần
  kiểm được từ ngoài đạt (health, redirect, HSTS/CSP/nosniff/x-frame); phần Sentry · `pm2 logs`
  · dung lượng ổ đĩa là việc tay (phiên không có SSH/token). (Vị trí cuộn khi mở/đóng màn con trang cấp trên mobile — ✅ ĐÃ CHỐT ở `0605`: mở → về đầu,
  đóng → danh sách về chỗ cũ.)
  (Nhánh lỗi khi tải `cefr.json` + chỉ mục ở trang cấp/Lộ trình/trang môn — ✅ ĐÃ SỬA ở
  `docs/changelog/0602-*.md`; Home + `useTodayPlan` vốn đã có nhánh lỗi.)

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

  **[2026-10-09, changelog 0553] ĐÃ THU HẸP:** golden set mở rộng 62 → **180 câu** (nhóm
  đúng/ca biên 18 → 60, mọi loại lỗi ≥ 8 câu, thêm chiều B với 4 loại lỗi riêng), mỗi câu có bản
  sửa + giải thích + nguồn đối chiếu, cổng tĩnh `scripts/evalTutorFixtures.test.ts` canh; thêm
  `--runs N` (trung bình ± SD + Wilson 95%) và `--group`. **Còn nợ — việc tay chủ dự án:** chạy
  `npm run eval:tutor -- --runs 3 --write-baseline` với key AI thật để có baseline cho bộ 180 câu,
  **SAU KHI** sửa xong FP-rate 48% của Haiku 5.5 (mục A, việc VPS số 3)
  (số 2026-08-26 chỉ còn đúng với bộ 62 câu cũ; `--limit 62` tái hiện bộ đó). Xong việc này mới đóng
  hẳn nợ.

  **Rủi ro nếu để lâu:** Gemini là fallback THỨ 3 trong chat (sau Anthropic, Groq — thứ tự đổi ở
  changelog `0568`) — sự cố chỉ lộ
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
  phép chuyển đổi dần, `hashLookupValue()` cho cột cần tra cứu). **Đã nối vào ĐÚNG HAI chỗ ghi
  mới** (đối chiếu mã ở audit 2026-10-20, F-002 — thân mục này trước ghi "module đang NGỦ" là đã
  lỗi thời): secret 2FA (`packages/core-auth/twoFactor.ts`) và câu trả lời tự do lúc đăng ký
  (`packages/core-personal/intakeService.ts`, cột `*_enc`; xuất dữ liệu giải mã ở
  `accountErasureService.ts`). Tên, email, tiến độ **chưa mã hoá** và **chưa có script backfill**
  dữ liệu cũ — đó là phần nợ còn lại bên dưới.

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
  `/ws/gemini-live`, (4) ✅ **ĐÃ RÀ ở changelog `0563`** các file "V6.x/V7.0" cùng thời điểm
  `cf44362`: gỡ `/api/co-learning-audio` + service + hợp đồng (0 client từ #628/#644, Map phòng
  không TTL) và `scripts/stress-test.ts` (mọi request 401 vẫn tính là thành công); sửa 3 chỗ số
  giả (độ bền Cung điện trí nhớ `random`, Vision Solver trả lời giải bịa khi thiếu key mà vẫn trừ
  lượt, "Khớp N%" pitch ngẫu nhiên ở thẻ khẩu hình). **Chủ dự án quyết 2026-10-09 (changelog
  `0568`): GỠ dòng quảng cáo** VIP "Nói chuyện trực tiếp với gia sư bằng giọng (đang thử nghiệm)"
  khỏi `UpgradeSection.tsx` (không bán tính năng chưa có giao diện). Mã server Gemini Live
  (`/api/gemini-live`, `/ws/gemini-live`) GIỮ NGUYÊN, vẫn CHƯA có client trong `apps/` — xây
  client hay gỡ hẳn: chưa quyết.
