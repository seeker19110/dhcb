# 0533 — Xoá tài khoản + Tải toàn bộ dữ liệu của tôi, có xác minh lại danh tính (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** (chưa tạo — commit trên nhánh worktree) · **Loại:** `feat(account)`
- **Đặc tả:** `docs/specs/2026-10-08-xoa-tai-khoan-va-xuat-du-lieu.md` — Approved for
  implementation (chủ dự án duyệt hướng "chất lượng cao nhất" 2026-10-08 trong phiên).

## Vì sao

Người dùng chưa có cách tự tải hết dữ liệu của mình hoặc xoá hẳn tài khoản. `/api/persons`
(0527) chỉ phủ dữ liệu Personal OS gắn `person_id`, còn hơn 50 bảng gắn với `users.id` hoặc
email thì chưa có đường nào. Xoá dây chuyền (`on delete cascade`) không đủ: nhiều bảng không có
FK, thanh toán phải giữ làm chứng từ, và tin nhắn trong phòng chat chung còn liên quan tới người khác.

## Đã làm

1. **Một danh sách khai báo duy nhất `ACCOUNT_TABLES`** (`packages/core-personal/accountErasureService.ts`).
   - Mỗi bảng có cột người dùng ghi rõ bốn điều: cột nào, khớp theo `user_id` hay email, xoá dòng
     hay ẩn danh (câu `set` cụ thể), và cột nào được xuất.
   - Xuất và xoá cùng duyệt mảng này, nên không thể có bảng "xuất có mà xoá sót".
   - Cột xuất được liệt kê tường minh; không xuất cột bí mật (hash mật khẩu, token, khoá 2FA, mã khôi phục…).
   - Cột mã hoá (`personal.intake.*_enc`) được giải mã trước khi xuất.
2. **Test tích hợp canh schema thật** (`accountErasureService.integration.test.ts`, đối chiếu `information_schema`):
   - Mọi FK trỏ tới `public.users` đều phải đã khai báo.
   - Mọi cột tên kiểu `user_id`/`*_by`/`learner_id`… đều phải đã khai báo; ngoại lệ ghi lý do trong
     `NOT_A_USER_REFERENCE`.
   - Mọi cột chứa `email` phải được xử lý, hoặc nằm trong danh sách giữ (`ACCOUNT_KEPT_COLUMNS`) kèm lý do.
   - Đã thử đột biến: tạo bảng `zz_mutation(user_id …)` thì cả 3 test đều đỏ.
3. **Migration `0088_account_erasure.sql`.**
   - `payments.user_id` cho phép null. FK đổi sang `on delete restrict`, để chứng từ không bao giờ
     bị xoá dây chuyền. Thêm `anonymized_at` và check `user_id is not null or anonymized_at is not null`.
   - Bảng `platform.account_erasure_log` chỉ-thêm, có trigger cấm update/delete/truncate. Bảng chỉ lưu:
     - `subject_hash`: sha256 có tiền tố miền của user id, không chứa email;
     - thời điểm;
     - số dòng theo từng bảng;
     - id nhật ký xoá Person.
   - Có ghi chú rollback. Đã chạy hai lần (luỹ đẳng).
4. **`deleteAccount`** chạy trong MỘT transaction:
   - Khoá dòng `users` bằng `for update`. Mọi insert vào bảng có FK tới users đều phải chờ khoá này,
     nên không có dòng mới lọt vào giữa chừng.
   - Xoá hoặc ẩn danh theo danh sách, rồi gọi lại `erasePersonDataWith` của 0527 (dữ liệu Personal OS).
   - Xoá `users` (phải đúng 1 dòng), ghi nhật ký.
   - Bất kỳ lỗi nào thì rollback toàn bộ và ném lỗi tiếp, không nuốt.
5. **`exportAccountData`** chạy trong một transaction `repeatable read, read only`. Bản xuất gồm:
   `account`, `tables`, `personalOs` (khuôn 0527), `kept` và `notes`. Lệnh `set transaction` gom
   về một hàm dùng chung `beginReadOnlySnapshot` ở `personErasureService.ts`, nên allowlist của
   `check:sql` giữ nguyên, không thêm mục.
6. **Endpoint `/api/account`** (`apps/server/src/api/core/account.ts`): `GET ?action=options`, `POST {action: export|delete}`.
   - Thứ tự kiểm tra:
     1. Rate limit theo IP (10/phút).
     2. `validateAuth`.
     3. Zod.
     4. Câu xác nhận gõ tay (chấp nhận XOÁ/XÓA, có hoặc không dấu).
     5. VIP còn hạn thì bắt buộc `acknowledgeNoRefund`.
   - Bước 4–5 kiểm TRƯỚC khi trừ lượt xác minh.
   - Sau đó là bộ đếm xác minh lại theo người dùng: 5 lần / 15 phút.
   - Xác minh lại bằng mật khẩu, hoặc bằng Google (access token mới lấy qua popup, `sub` phải khớp,
     token phải tươi ≤ 10 phút). Nếu bật 2FA thì cần thêm mã 2FA, tái dùng `hasStepUp`/`verifyTwoFactor`
     và bộ đếm `twoFactorUserKey` có sẵn.
   - Xoá xong: huỷ mọi phiên (bảng `sessions` bị xoá trong cùng transaction) và gửi `Set-Cookie` xoá cookie.
   - Mọi phản hồi đều có `Cache-Control: no-store`.
7. **Webhook SePay:** đơn đã ẩn danh (`user_id` null) chỉ ghi log `SEPAY_PAYMENT_ORPHANED`, không cấp gói.
   Câu update có thêm `and user_id is not null`. Trang admin thanh toán hiện "Tài khoản đã xoá".
8. **Giao diện:** mục "Dữ liệu & tài khoản" (thu gọn mặc định) ở `/trang-ca-nhan`, ngay sau "Xác thực hai bước".
   - Khối "Tải dữ liệu của tôi": tải tệp JSON. Giao diện KHÔNG đọc và không hiển thị nội dung tệp.
   - Khối "Xoá tài khoản": danh sách cảnh báo; khung VIP với ô "không hoàn tiền"; ô gõ câu xác nhận;
     nút nguy hiểm bị khoá tới khi đủ điều kiện.
   - Server trả `STEP_UP_REQUIRED` thì hiện ô mã 2FA.
   - Có đủ trạng thái tải / lỗi / thử lại, và hướng dẫn liên hệ khi tài khoản không có cách xác minh nào.

## Xoá / ẩn danh / giữ

- **Xoá dòng** (khớp `user_id` hoặc tên cột tương ứng):
  - `location.*` (4 bảng)
  - `chat.moderation_events`, `chat.room_members`
  - `english.*` (8 bảng)
  - `personal.intake`, `personal.learner_intent`
  - `platform.completion_evidence|completion_state|feature_state`
  - `programming.*` (8 bảng)
  - `public.achievement_claims`, `companion_invites` (`learner_id`), `companion_links` (cả hai phía)
  - `daily_plan_completions`, `daily_usage`, `email_reminders`, `email_verifications`
  - `entitlements`, `exam_plans`, `free_daily_credit`, `friendships` (cả hai phía)
  - `identities`, `password_resets`, `push_subscriptions`, `quest_claims`, `referrals` (cả hai phía)
  - `sessions`, `sync_conflicts`, `sync_receipts`, `user_2fa`, `user_2fa_recovery_codes`
  - `user_feedback`, `weekly_ai_credit`, `profiles`, `users`
  - Dữ liệu Personal OS: qua `erasePersonDataWith` (0527)
- **Ẩn danh, giữ dòng:**
  - `payments`: `user_id=null`, `anonymized_at`, `pending→expired`. Giữ số tiền, mã đơn và thời điểm làm chứng từ kế toán.
  - `chat.messages` của người bị xoá: nội dung thành `[đã xoá]`, gỡ người gửi, đặt `deleted_at`. Tin của người khác giữ nguyên.
  - `chat.rooms.created_by` → null
  - `analytics_events.user_id` → null
  - `companion_invites.used_by` → null
  - `stem_lesson_reviews` (`user_id`, `nguoi_duyet`)
  - `feature_status_checks.triggered_by_email` (khớp theo email)
- **Giữ nguyên:**
  - `vip_whitelist.email`: dữ liệu quản trị do admin nhập, không phải dữ liệu người dùng tạo; có ghi trong `kept` của bản xuất.
  - Hai nhật ký xoá (chỉ chứa mã băm).

**Luật số 1:** bản xuất CÓ chứa hồ sơ intake, đã giải mã. Lý do: quyền truy cập dữ liệu của chính
mình đòi trả về mọi thứ đang lưu, còn Luật số 1 cấm con số chẩn đoán làm _màn hình_. Tệp chỉ được
tải về máy; giao diện không bao giờ hiển thị nội dung tệp. Đã có test canh việc này, ở cả mức
component lẫn E2E.

## Quyết định tự chốt trong ranh giới brief

- **Google:** dùng access token qua popup `initTokenClient`, vì đó là cơ chế đăng nhập thật của app
  (không có ID token/One Tap). Độ tươi suy từ `expires_in` (≥ 3000/3600 giây, tức token cấp trong
  10 phút gần nhất).
- **Facebook/Apple/Microsoft:** trả 409 `REAUTH_UNAVAILABLE`, vì giao diện không có nút cho các nhà cung cấp này.
- **Xuất dữ liệu cũng phải xác minh lại**, kể cả khi chưa bật 2FA. Bản xuất chứa toàn bộ dữ liệu,
  nên kẻ trộm cookie không được tải về.
- **`payments.user_id = null` thay vì băm:** ẩn danh mạnh hơn, vì không còn khoá nối nào với người dùng.

## Bằng chứng

Postgres 16 thật (cụm tạm cổng 5533), chạy toàn bộ migration tới 0088:

- Unit + tích hợp `accountErasureService`:
  - 17/17 unit.
  - 10/10 tích hợp: phủ schema; xoá A sạch, B nguyên; thanh toán ẩn danh; chat chung; append-only;
    FK restrict trả 23503; rollback khi lỗi giả lập; hai lệnh xoá song song thì đúng một thành công và
    một nhật ký; user không có Person.
- `personErasureService` (unit + tích hợp): 16/16.
- `account.test.ts` 26/26 (401/403/409/429, IDOR, bypass step-up, xoá cookie). `accountReauth.test.ts` xanh.
- `authService.test.ts` 86/86. `payment-webhook.test.ts` 18/18.
- `AccountDataSection.test.tsx` 8/8 và `Profile.test.tsx` xanh.
- `npm run check:sql` trên cụm 5533: exit 0 (PREPARE 492 câu, 1 câu được miễn sẵn có).
- E2E `e2e/account-data.spec.ts` 3/3: tải tệp; xoá VIP; axe AA của mục mới; 2FA.
- `e2e/a11y.spec.ts`: 235/236 ở lượt đầu. Ca đỏ duy nhất là `/lap-trinh/p6 theme=kid`, timeout
  30 giây khi máy đang tải nặng, trang không liên quan đợt này; chạy lại riêng thì xanh. Cả ba theme
  `/trang-ca-nhan` đều xanh.
- Tầng 8b: ảnh 1440 và 390px, trước và sau (trang cá nhân, kèm mục mới khi mở rộng). Mục mới theo
  đúng khuôn "Đổi mật khẩu" và không tràn ngang ở 390px.
- Cổng cuối (checkout sạch: đã xoá `packages/*/dist dist dist-server`): `typecheck`, `lint`, `build`,
  `check:specs`, `format:check`, `test:coverage` đều exit 0. `test:coverage`: 832 tệp test pass, 3 bỏ qua;
  19105 test pass, 14 bỏ qua. Test tích hợp tự bỏ qua khi thiếu `DATABASE_URL` và đã chạy riêng trên
  Postgres thật như ghi ở trên.

## Rủi ro còn lại

- **Giới thiệu:** xoá `referrals` (cả `device_hash`) có thể mở lại đường lạm dụng "giới thiệu → xoá → giới thiệu lại".
- **Suất founder:** suất founder có thể được giải phóng sau khi xoá.
- **Kết nối đang mở:** WebSocket/chat đang mở có thể còn sống tới khi kết nối kiểm lại phiên.
- **Backup và log:** bản backup và log hệ thống không bị xoá; chúng hết hạn theo vòng đời backup.
- **Ngưỡng Google:** ngưỡng 3600 giây phụ thuộc vào thời hạn token Google, hiện là 1 giờ.
- **Đổi bề rộng khung nhìn:** đổi bề rộng qua mốc 1024px (xoay máy, chụp `fullPage`) làm `TwoPane`
  của trang cá nhân dựng lại cây con, khiến chữ đang gõ trong các mục bị mất. Lỗi có sẵn, ảnh hưởng mọi
  mục của trang; E2E đã tránh bằng ảnh không `fullPage`. Đề xuất sửa ở một đợt riêng.
