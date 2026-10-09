# 0545 — Sổ chống lạm dụng quyền lợi một-lần sau khi xoá tài khoản (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** (chưa tạo — commit trên nhánh worktree) · **Loại:** `feat(account)`
- **Đặc tả:** `docs/specs/2026-10-09-so-chong-lam-dung-sau-xoa-tai-khoan.md` — Approved for
  implementation (chủ dự án duyệt hướng "chất lượng cao nhất" 2026-10-09).
- **Nguồn:** quyết định chờ (a) của `0533` — xoá tài khoản xoá luôn dấu dùng thử và dòng giới thiệu,
  mở đường "dùng thử → xoá → đăng ký lại → dùng thử lại" và "giới thiệu → xoá → giới thiệu lại".

## Đã làm

1. **Migration `0089_erased_benefit_ledger.sql`.**
   - Bảng `platform.erased_benefit_ledger`: `subject_kind` (`email`/`device`), `subject_hash`
     (HMAC-SHA256 hex, CHECK định dạng), `benefit` (`signup_trial`/`referral_referee`/
     `referral_referrer`), `units` (> 0), `created_at`. Không user_id, không plaintext, không khoá
     ngoại tới người dùng. Chỉ mục `(subject_hash, benefit)` + `(created_at)`.
   - `public.referrals.referrer_id` cho phép null + khoá ngoại `on delete set null` (trước: not null
     - cascade). Khoá ngoại tìm theo CỘT trong `pg_constraint` như `0088`.
2. **`packages/core-billing/erasedBenefitLedger.ts`** — đọc/kiểm khoá, chuẩn hoá email, HMAC có tiền
   tố miền, ghi (một câu `insert … unnest`), tra (`isBenefitBlocked`, `erasedBenefitUnits`), dọn
   (`purgeExpiredErasedBenefits`). Mọi câu tra tự lọc hạn giữ 12 tháng.
3. **Xoá tài khoản** (`accountErasureService.ts` thêm MỘT lời gọi tới `accountErasureLedger.ts`):
   trong CÙNG transaction, sau khoá dòng `users` + kiểm đơn chờ, TRƯỚC mọi câu xoá — một câu đọc sự
   thật (email đăng nhập + email OAuth, dấu dùng thử cũ/mới, thiết bị của lượt được mời đã thưởng,
   số lượt mời đã thưởng) rồi một câu ghi sổ. `referrals.referrer_id` đổi từ XOÁ dòng sang ẨN DANH.
4. **Cấp dùng thử** (`packages/core-auth/trial.ts`): khớp sổ ⇒ không cấp, không giành dấu, log
   `SIGNUP_TRIAL_REPEAT_AFTER_ERASURE` `{ benefit }`.
5. **Thưởng giới thiệu** (`apps/server/src/api/_lib/referral.ts`): người được mời khớp sổ (email hoặc
   thiết bị) ⇒ không thưởng ai, log `REFERRAL_REPEAT_AFTER_ERASURE` `{ benefit }`; trần người mời =
   lượt hiện có + `units` của tài khoản cũ cùng email; `referrer_id` null ⇒ chỉ người được mời nhận.
6. **`server.ts`**: job dọn hằng ngày `startErasedBenefitLedgerCleanup` (khuôn `startSyncReceiptCleanup`,
   chỉ instance 0) + báo lỗi cấu hình khoá lúc khởi động.
7. **Giao diện** `AccountDataSection`: thêm một dòng song ngữ vào danh sách cảnh báo trước khi xoá.
8. `.env.example` (`ERASED_BENEFIT_LEDGER_KEY`, để dạng chú thích — thiếu ở dev là bình thường),
   dòng README migration, đặc tả `0533` (bảng ẩn danh hoá + trỏ đặc tả này), `PROGRESS.md` (mục (a)
   ✅ + việc tay đặt khoá), skill `financial-security-sentinel` + `gamification-viral-growth-architect`
   (cả `.claude/skills` lẫn bản gương `.agents/skills`).

## Quyết định đã tự chốt trong ranh giới brief

- **Chuẩn hoá email:** NFC + trim + chữ thường; bỏ "+nhãn" ở MỌI miền; riêng Gmail bỏ dấu chấm và
  gộp `googlemail.com` → `gmail.com`. Dương tính giả chỉ làm mất một ưu đãi, không chặn đăng ký.
- **Khoá:** biến môi trường RIÊNG `ERASED_BENEFIT_LEDGER_KEY`. Không tái dùng `accountSubjectHash`
  (SHA-256 không khoá — dò từ điển email được) hay `USER_DATA_MASTER_KEY` (module đang ngủ, nơi cất
  khoá chưa chốt; mục đích và hậu quả mất khoá khác hẳn).
- **Fail mode:** thiếu/sai khoá ⇒ sổ TẮT (không ghi mã băm yếu thay thế, tra luôn "không khớp"), log
  lỗi lúc khởi động. KHÔNG chặn khởi động, KHÔNG chặn xoá — quyền được xoá quan trọng hơn ưu đãi 14
  ngày. Câu ghi sổ lỗi khi có khoá ⇒ rollback cả việc xoá (không nuốt lỗi).
- **`referrer_id` ẩn danh thay vì xoá dòng:** dòng giới thiệu là dữ liệu của người được mời. Chỉ ghi
  sổ thì người được mời (vẫn còn tài khoản) không bị chặn "được mời lại" khi không có mã thiết bị;
  giữ dòng thì ràng buộc unique `referee_id` sẵn có chặn luôn, không cần băm dữ liệu của người
  KHÔNG xoá tài khoản.
- **Tối thiểu hoá:** dùng thử chỉ ghi email (lúc cấp chưa có mã thiết bị — không có đường tra);
  chỉ ghi quyền lợi ĐÃ hưởng (`rewarded_at` khác null).
- **Câu chữ giao diện** không hứa "không thể dùng để nhận diện bạn" (dữ liệu là bút danh hoá: người
  giữ khoá kiểm được một email cụ thể) — nói đúng: "không chứa email hay tên… chỉ dùng để chặn nhận
  lại ưu đãi".
- **Xuất dữ liệu không chứa sổ** (không gắn tài khoản; tài khoản còn sống chưa có dòng nào).

## Bằng chứng

- Postgres 16 thật (cụm tạm `a45`, cổng 5511): `npm run migrate:pg` áp 92 migration tới `0089`, exit 0.
  Chạy lại `0089` hai lần bằng `psql -v ON_ERROR_STOP=1`: chỉ NOTICE "already exists", OID khoá
  ngoại `referrals_referrer_id_fkey` giữ nguyên 18589 (`confdeltype = n`, đã validate),
  `referrer_id` nullable.
- `npm run check:sql`: exit 0 — PREPARE 602 câu, 1 câu miễn sẵn có.
- Test tích hợp `accountErasureService.integration.test.ts` + `personErasureService.integration.test.ts`
  trên Postgres thật: 18/18 pass, gồm 3 ca mới (ghi sổ đúng 4 dòng không PII; biến thể Gmail bị chặn,
  người lạ không, đúng thiết bị thì bị chặn; người được mời của người xoá giữ dòng `referrer_id`
  null; hạn 12 tháng + job dọn; CHECK chặn giá trị sai) và 4 ca đối chiếu schema (`ACCOUNT_TABLES` ↔
  `pg_constraint`/`information_schema`) vẫn xanh.
- Unit mới/sửa: `erasedBenefitLedger.test.ts` (mới), `trial.test.ts` (+2), `referral.test.ts` (+4),
  `accountErasureService.test.ts` (+4), `AccountDataSection.test.tsx` (+1).
- `npm run test:coverage` (cổng CI, có ngưỡng): 846 tệp pass, 3 bỏ qua; 19294 test pass, 20 bỏ qua;
  exit 0 (test tích hợp tự bỏ qua khi thiếu `DATABASE_URL`, đã chạy riêng trên Postgres thật như trên).
- Checkout sạch (`rm -rf packages/*/dist dist dist-server`) rồi `npm run typecheck`: exit 0.
  `npm run lint`: exit 0. `npm run codemap -- cycles`: "Không có chu trình import".
  `npm run check:specs`: OK 152 đặc tả.
- Tầng 8b: ảnh 1440 + 390px, vi + en, trước/sau ở
  `/tmp/claude-0/-home-user-dhcb/88aafb10-9d27-57d2-94b0-359edeffb66f/scratchpad/shots-0545/` (dev
  server cổng riêng của worktree; ảnh không commit). Dòng mới hiện đúng vị trí, cùng kiểu
  chữ các dòng khác, không tràn ngang (`scrollWidth ≤` bề rộng khung nhìn — test kèm).
  **Bẫy gặp thật:** lần chụp "sau" đầu tiên KHÔNG thấy dòng mới — Playwright `reuseExistingServer`
  đã dùng dev server cổng 5179 của một worktree khác đang chạy song song. Chụp lại bằng cấu hình tạm
  cổng riêng + `reuseExistingServer: false`.
- `e2e/account-data.spec.ts` (gồm quét axe A/AA mục "Dữ liệu & tài khoản"): 3/3 pass trên server của
  worktree này.

## Rủi ro còn lại

- **Phải đặt `ERASED_BENEFIT_LEDGER_KEY` trên VPS trước khi deploy** (việc tay trong `PROGRESS.md`);
  thiếu thì sổ tắt — hành vi giống trước đợt này, không hỏng gì khác.
- Người dùng đổi sang email khác hẳn + thiết bị khác vẫn nhận lại dùng thử — giới hạn vốn có của mọi
  cơ chế không thu định danh mạnh; xác minh email đã làm việc này tốn công.
- Xoay khoá làm sổ cũ hết khớp (chấp nhận: hạn giữ chỉ 12 tháng). Tiền tố miền có `v1` nhưng bảng
  chưa có cột phiên bản khoá ⇒ chưa giữ song song khoá cũ/mới được.
- **Đổi email rồi xoá** (nợ chấp nhận): app CÓ luồng đổi email (`packages/core-auth/changeEmail.ts`);
  sổ chỉ ghi email hiện tại lúc xoá, không ghi email cũ (ghi mọi email từng dùng là thu quá rộng) ⇒
  nhận dùng thử bằng A → đổi sang B → xoá ⇒ đăng ký lại bằng A vẫn nhận. Lạm dụng phải xác thực lại
  A bằng mã 6 số nên chi phí vẫn cao.
- `startPlanExpiryScheduler` (hạ gói hết hạn) cùng khuôn "chỉ chạy khi sang ngày" với lỗi đã sửa ở
  hai job dọn, nhưng chưa đổi (chạm billing) — đề xuất đợt riêng.
- Repo chưa có trang chính sách quyền riêng tư; khi có phải thêm mục sổ này.
- `isBenefitBlocked` ở luồng thưởng cũng bị chặn khi người được mời chỉ trùng THIẾT BỊ với một tài
  khoản đã xoá (máy dùng chung) — cùng đánh đổi đã chấp nhận ở `0008_referral_device.sql`.

## Sau rà soát (bảo mật + CSDL độc lập trên `31656535`, không có mục Cao)

1. **[Trung — bảo mật] Người được mời xoá tài khoản làm tụt trần thưởng của người mời.** Dòng
   `referrals` theo `referee_id` bị xoá ⇒ mời → thưởng → bảo người kia xoá → mời tiếp vượt trần 10.
   Sửa: lúc xoá, ghi thêm `referral_referrer` units=1 cho mọi email của NGƯỜI MỜI đã được thưởng nhờ
   tài khoản này; `erasedBenefitUnits` cộng dồn theo mã băm nên trần (lượt sống + sổ) giữ nguyên.
   `getReferralStats.rewardedCount` cũng cộng phần sổ. **Vì sao không cho `referee_id` nullable +
   ẩn danh:** dòng chưa thưởng phải xoá còn dòng đã thưởng phải giữ — `ACCOUNT_TABLES` chỉ có một
   hành động mỗi cột, đổi thành hành động có điều kiện là đụng bất biến của 0533; thêm nữa phải đổi
   khoá ngoại/unique của cột. Cách sổ không đổi schema, đi đúng đường cộng trần đã có. Đánh đổi: sổ
   giữ mã băm email của người mời (không xoá tài khoản) — ghi rõ trong đặc tả. Test tích hợp: trần
   của người mời = 1 trước và SAU khi người được mời xoá.
2. **[Trung — CSDL] ROLLBACK**: đầu `0089` và dòng README ghi rõ "lùi mã (PR này) TRƯỚC rồi mới
   chạy lệnh rollback" — lùi bảng/cột trước thì xoá tài khoản và thưởng giới thiệu lỗi 500.
3. **[Thấp — CSDL] Lượt mời bị sổ chặn nằm "chờ" vĩnh viễn.** Thêm cột
   `referrals.reward_blocked_at` (gộp vào `0089`, chưa deploy): bị chặn ⇒ đánh dấu, `pendingCount`
   loại dòng này, lần chấm bài sau thoát sớm không tra sổ lại. Cột được xuất trong
   `referralsReceived`.
4. **[Thấp — CSDL] Job dọn không chạy nếu không tiến trình nào sống qua nửa đêm.** Tách
   `apps/server/src/dailyJob.ts` (`startDailyJob`): chạy một lần ~60 giây sau khởi động rồi mỗi lần
   sang ngày UTC (so `YYYY-MM-DD`, không chỉ ngày trong tháng), không chạy chồng, lỗi chuyển cho
   `onError`. Áp cho CẢ `startErasedBenefitLedgerCleanup` lẫn `startSyncReceiptCleanup` (cùng lỗi).
   `startPlanExpiryScheduler` cùng khuôn nhưng để đợt riêng (chạm billing).
5. **[Thấp — bảo mật] Sổ tắt là fail-open, vận hành khó thấy.** `/api/health/deep` có
   `checks.erasedBenefitLedger: { status: 'enabled' | 'disabled', reason? }`, không đổi trạng thái
   tổng. **Đặt ở `/api/health/deep` (phần chi tiết chỉ admin) chứ không ở `/api/health` công khai**:
   công bố "chống lạm dụng đang tắt" là mời lạm dụng, và dự án đã gỡ chi tiết nội bộ khỏi endpoint
   công khai từ đợt N1 B2 (`pm2-reload.sh` chỉ cần `/api/health` trả ok). `scripts/deploy.sh` cảnh
   báo (không dừng) khi `.env` thiếu `ERASED_BENEFIT_LEDGER_KEY`, cùng khuôn kiểm VAPID.
6. **[Thấp — bảo mật] Đổi email.** Có luồng đổi email (`packages/core-auth/changeEmail.ts`). Không
   ghi email cũ vào sổ; giới hạn ghi thành nợ chấp nhận trong đặc tả + mục "Rủi ro còn lại".
7. **[Nhỏ]** `emptyFacts` đưa lên trước hàm dùng nó; đặc tả ghi "xoay khoá làm sổ cũ hết khớp, tiền
   tố v1 chưa có cột phiên bản".
8. **TRAPS.md mục 19**: Playwright `reuseExistingServer` dùng nhầm dev server của worktree khác.

**Bằng chứng sau rà soát:** Postgres 16 thật (cụm `a45` dựng lại, cổng 5511): `migrate:pg` áp 92
migration tới `0089` exit 0; chạy lại `0089` ba lần bằng `psql -v ON_ERROR_STOP=1` đều exit 0, OID
`referrals_referrer_id_fkey` giữ 18589 (`n`), `referrer_id` và `reward_blocked_at` nullable.
`check:sql`: exit 0, PREPARE 603 câu (thêm câu đánh dấu bị chặn), 1 câu miễn sẵn có. Test tích hợp
`accountErasureService` + `personErasureService`: 18/18 pass. Các cổng còn lại: xem báo cáo commit
`fix(account)` của đợt.
