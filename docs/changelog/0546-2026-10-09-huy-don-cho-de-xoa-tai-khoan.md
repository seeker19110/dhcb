# 0546 — Huỷ đơn chờ để xoá tài khoản + hàng chờ hoàn tiền ở /admin (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** (chưa tạo — commit trên nhánh worktree) · **Loại:** `feat(billing)`
- **Đặc tả:** `docs/specs/2026-10-09-huy-don-cho-de-xoa-tai-khoan.md` — Approved for implementation
  (chủ dự án duyệt hướng "chất lượng cao nhất" 2026-10-09).
- **Đóng:** quyết định chờ (b) của `0533`: một đơn chờ có thể chặn xoá tài khoản tới ~24,5 giờ.

## Vì sao

`0533` chặn xoá tài khoản khi còn đơn SePay `pending` "sống", vì tiền chuyển muộn trong 24 giờ ân
hạn vẫn được webhook ghi nhận. Chặn như vậy là đúng để không mất tiền. Nhưng người dùng chắc chắn
CHƯA chuyển khoản thì phải chờ tới 24,5 giờ hoặc nhờ admin. Ngoài ra, tiền về cho đơn của tài
khoản đã xoá trước đây chỉ để lại một dòng log, rất dễ trôi mất.

## Đã làm

1. **Migration `0090_payment_cancel_refunds.sql`:**
   - `payments` có thêm trạng thái `cancelled`, kèm `cancelled_at` và `cancel_reason`.
     - CHECK trạng thái được tìm theo nội dung, chỉ thay khi chưa có `cancelled`.
     - CHECK mới `payments_cancelled_fields_check`.
   - Bảng `public.payment_refunds`:
     - UNIQUE `(provider, provider_txn_id)`, FK RESTRICT tới `payments`.
     - Trigger chỉ cho phép chuyển `needed → refunded`; cấm sửa khác, xoá và truncate.
   - Có ghi chú rollback.
2. **`POST /api/payment-cancel`** (`apps/server/src/api/billing/payment-cancel.ts` +
   `packages/core-billing/paymentCancel.ts`):
   - Thứ tự kiểm: rate limit IP 10/phút → `validateAuth` → rate limit người dùng 5/phút → Zod
     (bắt buộc `confirmNotTransferred: true`).
   - Huỷ bằng một UPDATE có điều kiện `user_id = <phiên> and status = 'pending'`.
   - Phản hồi: đơn người khác trả 404 giống hệt đơn không tồn tại; huỷ lại thì idempotent (giữ
     thời điểm cũ); đơn đã paid hoặc expired trả 409.
   - Log chỉ ghi mã băm người dùng.
3. **`/api/account?action=options` trả thêm `pendingPayments`.** Điều kiện "đơn sống" là MỘT hằng
   `LIVE_PENDING_CONDITION_SQL`, dùng chung cho cả `deleteAccount`/`hasLivePendingPayment`. Nhờ vậy
   giao diện không thể hiện khác chốt thật.
4. **Webhook:**
   - Đơn `cancelled` hoặc `user_id null`: ghi `payment_refunds` (`on conflict do nothing`), KHÔNG
     cấp gói.
   - Nhánh này đứng TRƯỚC nhánh quá hạn và nhánh chuyển thiếu.
   - Thua đua ở UPDATE: đọc lại `user_id, status` rồi ghi hàng chờ trong cùng transaction.
   - Lỗi CSDL khi ghi thì ném lỗi (500) để SePay gửi lại.
   - Lưu thêm `referenceCode`, `gateway`, `accountNumber` (tài khoản NHẬN), `transactionDate`. Các
     trường này parse lỏng: giá trị lạ thì thành null, không làm hỏng payload.
   - KHÔNG lưu nội dung chuyển khoản.
   - Log `SEPAY_PAYMENT_ORPHANED` (đơn của tài khoản đã xoá, giữ tên cũ) hoặc
     `SEPAY_PAYMENT_CANCELLED_PAID`.
5. **Admin (`admin-payments.ts`, `AdminRefundQueue.tsx`):**
   - `GET ?view=refunds`; khối "Cần hoàn tiền (N)" viền nổi bật ở đầu mục thanh toán.
   - `POST mark-refunded`: ghi chú 1–500 ký tự là bắt buộc; bấm lại thì idempotent, không ghi đè;
     có log `PAYMENT_REFUND_MARKED`.
   - Khớp tay đơn `cancelled` bị chặn ở hai lớp. Bảng đơn có thêm nhãn "Người dùng huỷ", bộ lọc
     và giờ huỷ.
6. **Giao diện (`PendingPaymentsBlock.tsx` trong `AccountDataSection`):**
   - Hiện số tiền, mã nội dung CK, giờ tạo, thời gian còn lại tới hết ân hạn (cập nhật mỗi phút)
     và mốc giờ hết ân hạn. Có cảnh báo "đã chuyển thì đừng huỷ".
   - Phải tick xác nhận mới huỷ được. Nút xoá tài khoản bị khoá khi còn đơn.
   - Phản hồi theo kết quả huỷ:
     - `ALREADY_PAID`: báo rõ, giữ khối.
     - `NOT_CANCELLABLE`: gỡ khối.
   - Server trả 409 `PAYMENT_PENDING` thì tải lại danh sách mà không xoá ô đã nhập.
   - Có bản tiếng Anh cho chiều B.
   - Màn QR (`UpgradeSection`) ngừng hỏi trạng thái khi đơn đã `cancelled`.
7. Thông điệp `PAYMENT_PENDING` (vi + en) nay chỉ đường tới nút huỷ.
8. Skill `financial-security-sentinel` (`.claude` + gương `.agents`): sơ đồ webhook và nguyên tắc 5–6.

## Quyết định tự chốt trong ranh giới brief

- **Thêm trạng thái `cancelled`**, không dùng lại `expired`/`failed`: hai trạng thái đó đã mang
  nghĩa khác, và admin cần biết "người dùng chủ động từ chối".
- **API huỷ dùng độc lập được** (mọi đơn `pending` của chính mình). Giao diện chỉ đặt nút ở khối
  xoá tài khoản: đơn tự hết hạn sau 30 phút, và đơn sống chỉ gây hại khi người dùng muốn xoá tài khoản.
- **Không đòi xác minh lại khi huỷ:** kẻ chiếm phiên chỉ huỷ được đơn CHƯA trả. Nếu tiền vẫn về
  thì vào hàng chờ hoàn, không mất. Bước xoá ngay sau đó đã đòi xác minh lại.
- **Hàng chờ hoàn tiền là bảng riêng chỉ-tiến**, không phải cột trên `payments`: một đơn có thể
  nhận NHIỀU khoản chuyển (chuyển hai lần); mỗi giao dịch SePay là một dòng.
- **`refunded_by` không có FK**: bản ghi kiểm toán phải còn sau khi xoá tài khoản admin. Bảng không
  có cột tên kiểu người dùng hay FK tới `users`, nên cổng phủ schema của `0533` vẫn xanh, không cần
  sửa `ACCOUNT_TABLES`.
- **Đổi tên migration** từ `0090_payment_cancel_and_refund_queue.sql` sang
  `0090_payment_cancel_refunds.sql`. Tên dài làm Prettier căn lại CẢ bảng README (187 dòng diff,
  dễ xung đột với `0089` song song).

## Bằng chứng

Postgres 16 thật (cụm tạm `a46`, cổng 5512, tạo mới từ đầu):

- **Migration:**
  - `npm run migrate:pg` áp 92 migration lẻ; chạy lần hai báo "không có gì mới".
  - Chạy thẳng `0090` thêm 2 lần bằng `psql -1`: 0 dòng lỗi, OID của 19 ràng buộc trên
    `payments` và `payment_refunds` không đổi.
- **`payment-cancel.integration.test.ts` 12/12:**
  - Huỷ, idempotent, IDOR, paid/expired, CHECK 23514.
  - Tiền về sau khi huỷ (cả khi SePay gửi lại): đúng 1 dòng, không có VIP, không lưu nội dung CK.
  - Đơn pending bình thường vẫn được cấp VIP.
  - Huỷ → xoá tài khoản → tiền về; tài khoản đã xoá → `account_deleted`.
  - Đua xác định theo hai chiều; đua song song 15 đơn, mỗi đơn đúng một kết cục.
  - Trigger sổ hoàn tiền; xoá đơn có tiền về bị chặn (23503).
- **Đột biến:** đổi điều kiện huỷ thành `status <> 'cancelled'` thì 2 test tích hợp đỏ (paid →
  already_paid, đua xác định). Đã khôi phục.
- `accountErasureService.integration.test.ts` 13/13: cổng phủ schema của `0533` vẫn xanh với bảng mới.
- `npm run check:sql`: exit 0, PREPARE 603 câu, 1 câu được miễn sẵn có.
- **Unit (đếm từ `vitest --reporter=verbose`):**
  - `paymentCancel.test.ts` 8/8, `paymentRefunds.test.ts` 14/14.
  - `payment-cancel.test.ts` 13/13.
  - `payment-webhook.test.ts` 29/29 (thêm 9 ca: huỷ + đúng/thiếu/quá hạn, huỷ rồi xoá, bằng
    chứng không PII, trường lạ, gửi lại, lỗi CSDL, đua).
  - `admin-payments.refunds.test.ts` 11/11, `account.test.ts` 35/35.
  - `AccountDataSection.pending.test.tsx` 9/9, `AdminRefundQueue.test.tsx` 4/4,
    `paymentCancelApi.test.ts` 5/5.
- **Bộ vitest liên quan** (core-billing, core-contracts, core-personal, `apps/server/src/api`,
  component tài khoản/admin/nâng cấp/hồ sơ, `scripts/`): 292 tệp xanh, 4 bỏ qua (test tích hợp, đã
  chạy riêng ở trên); 3601 test xanh, 29 bỏ qua.
  - 1 test đỏ CÓ CHỦ Ý: `scripts/migrations-readme-coverage.test.ts › không có số bị nhảy cóc`,
    vì thiếu `0089`. Test tự xanh khi đợt `0545` merge.
- **E2E** `e2e/account-pending-payment.spec.ts` 4/4: hai luồng (người dùng huỷ đơn; admin đánh
  dấu đã hoàn), mỗi luồng chạy ở blue-sky và dark-blue, axe AA 0 vi phạm.
  `e2e/account-data.spec.ts` 3/3 vẫn xanh.
- **Tầng 8b:** ảnh 1440 và 390px, blue-sky và dark-blue, trước và sau, cho khối bị chặn và cho màn
  admin (hàng chờ + bảng đơn). Ảnh "trước" chỉ có một dòng lỗi chung. Ảnh "sau" có khối viền ấm,
  đủ thông tin đơn, nút huỷ bị khoá tới khi tick.
  - Ở 390px, mã CK lúc đầu bị ngắt giữa chừng ("DHCB7K2M9QR / T"). Đã đổi sang nhãn trên, giá trị
    dưới khi màn hẹp, rồi chụp lại.

## Rủi ro còn lại

- **Thứ tự merge:** `0090` cần `0089` (đợt `0545`) merge trước. Nếu `0546` vào `main` trước,
  `scripts/migrations-readme-coverage.test.ts` ("không nhảy số") đỏ.
- **Người dùng tick sai** (đã chuyển nhưng vẫn huỷ): tiền không mất nhưng phải chờ admin hoàn tay.
  Giao diện đã cảnh báo hai lần.
- **Hoàn tiền là việc tay:** khối "Cần hoàn tiền" chỉ hiện ở /admin, chưa có thông báo đẩy hay email
  cho admin.

## Vòng sửa sau rà bảo mật + CSDL

Rà soát commit đầu không thấy lỗi mức Cao/Trung. Năm điểm nhỏ đã sửa trong cùng nhánh:

1. **Số tiền lẻ hoặc âm không còn làm mất dòng hoàn tiền.** `transferAmount` là `z.number()`
   nhưng cột `amount_vnd` là bigint `CHECK >= 0`. Trước đây số lẻ hoặc âm làm INSERT lỗi, webhook
   trả 500, và sau 7 lần SePay gửi lại thì mất dấu khoản tiền. Nay `normalizeRefundAmount` trong
   `packages/core-billing/paymentRefunds.ts` làm tròn, kẹp số âm về 0 và kẹp số quá lớn về
   `MAX_SAFE_INTEGER`, rồi `console.warn` kèm mã đơn, mã giao dịch và số gốc (không có PII). Dòng
   vẫn được ghi, admin đối chiếu sao kê theo `reference_code`. Cách này phủ cả hai nhánh của
   webhook vì cả hai đều đi qua `recordRefundNeeded`. Không siết schema thành `int().nonnegative()`
   vì như vậy payload sẽ bị loại hẳn ở nhánh BAD_PAYLOAD, đúng thứ cần tránh.
2. **Log `SEPAY_WEBHOOK_BAD_PAYLOAD` không còn ghi nguyên payload.** `content` và `description`
   thường chứa họ tên người chuyển. Nay hàm `describeBadPayload` chỉ ghi kiểu payload, danh sách
   khoá và `id` giao dịch.
3. **Test tích hợp cho TRUNCATE.** Có test cho cả `truncate public.payment_refunds` và
   `truncate public.payments cascade`: cả hai đều bị trigger chặn. Hai lệnh chạy trong transaction
   rồi ROLLBACK, nên nếu trigger hỏng thì test đỏ mà không xoá dữ liệu của test khác. Không test
   CSDL nào dùng TRUNCATE để dọn dữ liệu (đã grep).
4. **ROLLBACK trong `0090`** thêm bước 1: chuyển đơn `cancelled` về `expired` và xoá cả hai cột
   huỷ, chạy khi CHECK `payments_cancelled_fields_check` còn hiệu lực. Chỉ sửa chú thích.
5. **Sắp xếp hàng chờ:** `order by r.status asc, r.received_at desc`. Vì `'needed' < 'refunded'`
   nên việc chưa làm vẫn lên đầu. Thứ tự này khớp chỉ mục `payment_refunds_status_idx
(status, received_at desc)`.

## Nợ còn lại

- **(a)** Đơn `expired`/`failed` mà vẫn còn `user_id` thì tiền về **không vào hàng chờ hoàn
  tiền**. Đây là hành vi cũ, đợt này giữ nguyên vì nằm ngoài phạm vi. Có hai trường hợp:
  - Quá ân hạn 24h: chỉ có log `SEPAY_PAYMENT_LATE`.
  - Còn trong ân hạn: UPDATE `where status = 'pending'` không khớp dòng nào nên bị coi là "race",
    không có log riêng.

  Lần đọc mã này cho thấy trường hợp thứ hai **im lặng**. Nên làm thành đợt riêng: đưa
  `expired`/`failed` vào `refundReasonFor`.

- **(b)** Trigger kiểm toán chỉ chặn SQL thường. Owner hoặc superuser vẫn có thể
  `alter table … disable trigger`. **Việc tay:** kiểm role app trên VPS không phải owner bảng và
  không phải superuser.
- **(c)** Các test tích hợp Postgres (`*.integration.test.ts`) **chưa chạy trong CI**. Muốn chạy
  thì phải sửa `.github/workflows/ci.yml`, là cổng được bảo vệ, nên đang chờ người dùng duyệt.
