# Đặc tả: Huỷ đơn chờ để xoá tài khoản + hàng chờ hoàn tiền

**Trạng thái:** Approved for implementation — chủ dự án duyệt hướng "chất lượng cao nhất"
2026-10-09 (giao qua coordinator, đợt `0546`).

**Nền:** `docs/changelog/0533-2026-10-08-xoa-tai-khoan-va-xuat-du-lieu.md` mục "Nợ/quyết định chờ"
(b) và đặc tả `docs/specs/2026-10-08-xoa-tai-khoan-va-xuat-du-lieu.md`. Ở 0533, xoá tài khoản bị
chặn (409 `PAYMENT_PENDING`) khi còn đơn SePay `pending` "sống", tối đa ~24,5 giờ (30 phút hạn đơn
\+ `SEPAY_LATE_GRACE_MS` 24 giờ). Lý do: tiền chuyển muộn trong khoảng đó vẫn được webhook ghi nhận.

**Quyết định chủ dự án:** GIỮ chặn mặc định để không mất tiền, nhưng cho người dùng TỰ GỠ CHẶN an toàn.

---

## 0. Một câu

Khi xoá tài khoản bị chặn vì đơn chờ, người dùng thấy rõ đơn nào chặn và có thể tự huỷ đơn
("tôi CHƯA chuyển khoản"). Nếu tiền vẫn về sau khi huỷ hoặc sau khi xoá tài khoản, hệ thống
không cấp gói mà đưa khoản đó vào hàng chờ "Cần hoàn tiền" ở /admin để admin hoàn tay và đánh dấu.

## ① Phạm vi

**LÀM:**

- **Trạng thái đơn mới `cancelled`** (migration `0090`). Đi kèm hai cột `cancelled_at`,
  `cancel_reason` (`user_not_transferred`). CHECK bảo đảm đơn `cancelled` có đủ hai cột này, và đơn
  trạng thái khác không mang chúng.
  - Không dùng lại `expired`: trạng thái này đang mang nghĩa "hết hạn tự nhiên / ẩn danh do xoá tài khoản".
  - Không dùng lại `failed`: trạng thái này mang nghĩa "lỗi xử lý".
  - Lý do: khi hoàn tiền, admin cần phân biệt "người dùng chủ động từ chối".
- **`POST /api/payment-cancel {paymentId, confirmNotTransferred: true}`**: huỷ đơn `pending` của
  CHÍNH người dùng.
  - Kiểm theo thứ tự: rate limit theo IP (10/phút) → `validateAuth` → rate limit theo người dùng
    (5/phút) → Zod (`confirmNotTransferred` phải đúng `true`).
  - Huỷ bằng một câu UPDATE có điều kiện `id = $1 and user_id = <phiên> and status = 'pending'`.
  - Kết quả: huỷ thành công; đã huỷ từ trước (idempotent, giữ nguyên thời điểm cũ); đã trả (409);
    đã kết thúc theo đường khác (409); không có đơn hoặc đơn của người khác (404, cùng một phản hồi).
- **Endpoint này dùng độc lập được**, không gắn với xoá tài khoản (xem quyết định ở ⑥). Giao diện
  hiện tại chỉ đặt nút ở khối xoá tài khoản.
- **`GET /api/account?action=options` trả thêm `pendingPayments`**: danh sách đơn chờ còn sống của
  chính người dùng. Mỗi đơn gồm `id`, mã nội dung chuyển khoản, số tiền, gói/chu kỳ, `createdAt`,
  `expiresAt`, `graceEndsAt` (= `expiresAt` + 24 giờ).
  - Điều kiện "còn sống" là MỘT hằng SQL dùng chung (`LIVE_PENDING_CONDITION_SQL`): danh sách này,
    `hasLivePendingPayment` và chốt trong transaction của `deleteAccount` đều đọc cùng hằng đó.
- **Giao diện khối Xoá tài khoản** (`PendingPaymentsBlock`):
  - Hiện từng đơn: số tiền, mã nội dung CK, giờ tạo, thời gian còn lại tới hết ân hạn (cập nhật
    mỗi phút) và mốc giờ hết ân hạn.
  - Có cảnh báo "đã chuyển thì đừng huỷ".
  - Ô tick "Tôi xác nhận CHƯA chuyển khoản cho đơn …"; nút "Huỷ đơn — tôi CHƯA chuyển khoản" bị
    khoá tới khi tick.
  - Nút xoá tài khoản bị khoá khi còn đơn chặn.
  - Huỷ xong: gỡ đơn khỏi danh sách và mở lại nút xoá. Server từ chối xoá vì đơn tạo ở tab khác
    thì tải lại danh sách đơn, KHÔNG xoá ô người dùng đã nhập.
  - Có bản tiếng Anh cho chiều B.
- **Webhook SePay — tiền về cho đơn đã huỷ hoặc đã ẩn danh:**
  - KHÔNG cấp gói, KHÔNG đổi đơn.
  - Ghi một dòng `public.payment_refunds` (`reason`: `cancelled_by_user` hoặc `account_deleted`)
    với đúng số tiền thực về.
  - Đơn đã huỷ đi nhánh này TRƯỚC nhánh quá hạn và nhánh chuyển thiếu: mọi khoản tiền về cho đơn
    đã huỷ đều phải hoàn, bất kể thời điểm hay số tiền.
  - Thua đua ở UPDATE (người dùng huỷ hoặc xoá tài khoản giữa SELECT và UPDATE của webhook): đọc
    lại `user_id, status` rồi ghi hàng chờ trong CÙNG transaction.
  - Lỗi CSDL khi ghi hàng chờ thì NÉM lỗi (500) để SePay gửi lại; không trả success giả.
- **Bằng chứng SePay lưu cho hoàn tiền:**
  - Lưu: `id` giao dịch, `referenceCode`, `gateway`, `accountNumber` (tài khoản NHẬN, của ta),
    `transactionDate`, số tiền.
  - KHÔNG lưu `content`/`description`, vì thường chứa họ tên người gửi. Admin tra sao kê theo mã
    tham chiếu để biết tài khoản nguồn.
  - Payload SePay không có trường tài khoản nguồn.
  - Các trường bằng chứng parse "lỏng" (`.catch(null)`): giá trị lạ thì bỏ riêng trường đó, KHÔNG
    làm hỏng cả payload (payload hỏng nghĩa là mất khớp đơn).
- **/admin, mục thanh toán:**
  - Khối "Cần hoàn tiền (N)" viền nổi bật, đặt ở đầu mục, đủ thông tin trên; khoản đã hoàn gom
    trong `<details>`.
  - Thao tác "Đã hoàn tiền" bắt buộc có ghi chú (1–500 ký tự):
    `POST /api/admin-payments {action:'mark-refunded', refundId, note}`.
  - Đánh dấu là chuyển MỘT CHIỀU `needed → refunded`. Trigger CSDL cấm mọi sửa khác, cấm xoá và
    truncate, nên dòng đã hoàn chính là bản ghi kiểm toán (ai, khi nào, ghi chú). Kèm log
    `PAYMENT_REFUND_MARKED`.
  - Bấm lại thì idempotent và KHÔNG ghi đè.
  - `GET /api/admin-payments?view=refunds`. Bảng đơn có thêm nhãn "Người dùng huỷ", bộ lọc
    `cancelled` và giờ huỷ.
- **Khớp tay (manual-match) bị CHẶN với đơn `cancelled`**, ở cả nhánh kiểm sớm lẫn câu UPDATE
  `status not in ('paid','cancelled')`. Nếu không chặn, một khoản có thể vừa được cấp gói vừa nằm
  trong hàng chờ hoàn.

**KHÔNG LÀM:**

- Không tự hoàn tiền qua API ngân hàng: SePay không có API chi, hoàn tiền là việc tay của admin.
- Không đổi ân hạn 24 giờ hay điều kiện "đơn sống".
- Không bỏ chặn mặc định khi xoá tài khoản.
- Không đặt nút huỷ ở màn QR thanh toán (`UpgradeSection`). Lý do: đơn tự hết hạn sau 30 phút, và
  đơn sống chỉ gây hại khi người dùng muốn xoá tài khoản. Chỉ sửa để màn QR ngừng hỏi trạng thái
  khi đơn đã `cancelled`.
- Không đòi xác minh lại danh tính khi huỷ đơn (xem ⑥).
- Không đụng: `ACCOUNT_TABLES` (bảng mới không có khoá ngoại hoặc cột người dùng; cổng 0533 vẫn
  xanh), luồng cấp gói của đơn `pending` bình thường, nhánh LATE/INSUFFICIENT của đơn `pending`.

## ② Điểm chạm

| Việc | Đường dẫn file                                                                | Ghi chú                                                                         |
| ---- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Thêm | `postgres/migrations/0090_payment_cancel_refunds.sql`                         | `cancelled` + cột huỷ + CHECK; bảng `payment_refunds` + trigger                 |
| Thêm | `packages/core-billing/paymentCancel.ts`                                      | `cancelPendingPayment`, `listLivePendingPayments`, `LIVE_PENDING_CONDITION_SQL` |
| Thêm | `packages/core-billing/paymentRefunds.ts`                                     | `refundReasonFor`, `recordRefundNeeded`, `listRefunds`, `markRefunded`          |
| Thêm | `packages/core-contracts/paymentCancel.ts`                                    | Zod: body huỷ, kết quả, mã lỗi, đơn chờ, dòng hoàn tiền                         |
| Thêm | `apps/server/src/api/billing/payment-cancel.ts`                               | `POST /api/payment-cancel`                                                      |
| Sửa  | `apps/server/src/routes.ts`                                                   | gắn route                                                                       |
| Sửa  | `apps/server/src/api/billing/payment-webhook.ts`                              | nhánh hoàn tiền (sớm + thua đua), trường bằng chứng                             |
| Sửa  | `apps/server/src/api/admin/admin-payments.ts`                                 | `view=refunds`, `mark-refunded`, chặn khớp tay đơn huỷ, lọc `cancelled`         |
| Sửa  | `apps/server/src/api/core/account.ts`                                         | options trả `pendingPayments`                                                   |
| Sửa  | `packages/core-contracts/account.ts`                                          | `pendingPayments` (mặc định `[]`)                                               |
| Sửa  | `packages/core-contracts/adminViews.ts`                                       | `status` thêm `cancelled`, `cancelledAt`                                        |
| Sửa  | `packages/core-personal/accountErasureService.ts`                             | dùng chung `LIVE_PENDING_CONDITION_SQL`                                         |
| Sửa  | `packages/core-personal/accountErasureShared.ts`                              | thông điệp `PAYMENT_PENDING` chỉ đường tới nút huỷ                              |
| Thêm | `apps/dhcb/src/components/PendingPaymentsBlock.tsx`                           | khối đơn chờ + nút huỷ                                                          |
| Thêm | `apps/dhcb/src/lib/paymentCancelApi.ts`                                       | gọi API + Zod                                                                   |
| Sửa  | `apps/dhcb/src/components/AccountDataSection.tsx`                             | gắn khối, khoá nút xoá, tải lại khi 409                                         |
| Thêm | `apps/dhcb/src/components/admin/AdminRefundQueue.tsx`                         | hàng chờ hoàn tiền                                                              |
| Sửa  | `apps/dhcb/src/components/admin/AdminPaymentsPanel.tsx`                       | gắn hàng chờ, nhãn/lọc `cancelled`                                              |
| Sửa  | `apps/dhcb/src/components/UpgradeSection.tsx`, `apps/dhcb/src/lib/payment.ts` | dừng poll khi `cancelled`; kiểu trạng thái                                      |

**Ảnh hưởng lan ra (theo codemap):**

- `AccountOptions` có thêm trường `pendingPayments`, mặc định `[]` khi parse nên phản hồi cũ vẫn
  đọc được.
- `AdminPaymentRow.status` có thêm `cancelled`.
- Webhook đổi hành vi với đơn `user_id null`: trước chỉ ghi log, nay ghi log VÀ ghi hàng chờ.
  Tên sự kiện log giữ `SEPAY_PAYMENT_ORPHANED`.

## ③ Hợp đồng dữ liệu

**Vào:**

```ts
// POST /api/payment-cancel
{ paymentId: string /* uuid */, confirmNotTransferred: true }
// POST /api/admin-payments
{ action: 'mark-refunded', refundId: string /* uuid */, note: string /* trim, 1..500 */ }
// Webhook SePay (thêm, đều tuỳ chọn, sai kiểu/quá dài ⇒ null)
{ gateway?: string /*≤100*/, referenceCode?: string /*≤100*/, accountNumber?: string /*≤50*/, transactionDate?: string /*≤40*/ }
```

**Ra:**

```ts
// 200 /api/payment-cancel
{ ok: true, alreadyCancelled: boolean, cancelledAt: string }
// GET /api/account?action=options — thêm
pendingPayments: Array<{ id; paymentCode; amountVnd; plan; cycle; createdAt; expiresAt; graceEndsAt }>
// GET /api/admin-payments?view=refunds
{ refunds: AdminRefundRow[] } // core-contracts/paymentCancel.ts
```

**Ca lỗi (là một phần hợp đồng, không phải phụ lục):**

| Tình huống                                      | Mã lỗi                 | Hành vi mong đợi                                   |
| ----------------------------------------------- | ---------------------- | -------------------------------------------------- |
| Quá 10 req/phút/IP hoặc 5 req/phút/người        | 429 `RATE_LIMITED`     | Không huỷ; IP kiểm TRƯỚC xác thực                  |
| Chưa đăng nhập                                  | 401                    | Không đọc CSDL                                     |
| Thiếu/sai tick xác nhận, `paymentId` không uuid | 400                    | Không huỷ                                          |
| Đơn của người khác / không tồn tại              | 404 `NOT_FOUND`        | Cùng phản hồi — không lộ đơn tồn tại               |
| Đơn đã `paid` (webhook thắng đua)               | 409 `ALREADY_PAID`     | Giao diện báo "vừa được thanh toán", KHÔNG gỡ khối |
| Đơn `expired`/`failed`                          | 409 `NOT_CANCELLABLE`  | Giao diện coi như không còn chặn, gỡ khối          |
| Huỷ lại đơn đã huỷ                              | 200 `alreadyCancelled` | Không đổi `cancelled_at`, không log lại            |
| Lỗi CSDL khi huỷ                                | 500                    | Ném lên `wrapEdge` + Sentry                        |
| Tiền về đơn đã huỷ/ẩn danh, SePay gửi lại       | 200                    | Đúng MỘT dòng hàng chờ (`on conflict do nothing`)  |
| Lỗi CSDL khi ghi hàng chờ                       | 500                    | SePay gửi lại; không mất dấu vết                   |
| Admin đánh dấu lại khoản đã hoàn                | 200 `alreadyRefunded`  | Không ghi đè người/thời điểm/ghi chú               |
| Khớp tay đơn `cancelled`                        | 400                    | Không update, không cấp gói                        |

## ④ Tiêu chí chấp nhận

- [x] Huỷ đơn của chính mình → `cancelled` + `cancelled_at` + lý do; hết chặn xoá; xoá tài khoản
      thành công (tích hợp Postgres `payment-cancel.integration.test.ts`).
- [x] Huỷ đơn người khác → 404, đơn nguyên vẹn (tích hợp + `payment-cancel.test.ts`).
- [x] Huỷ đơn đã `paid` → `already_paid`; đơn `expired` → `not_cancellable` (tích hợp + unit).
- [x] Idempotent: huỷ lại trả cùng `cancelledAt` (tích hợp).
- [x] Đua, ca xác định 1: webhook giữ khoá dòng rồi commit `paid` → lệnh huỷ trả `already_paid`
      (tích hợp, Postgres thật).
- [x] Đua, ca xác định 2: lệnh huỷ giữ khoá, webhook chạy giữa chừng → không cấp gói, có một dòng
      hàng chờ (tích hợp).
- [x] Đua song song thật, 15 đơn: mỗi đơn đúng MỘT kết cục (tích hợp).
- [x] Tiền về sau khi huỷ, kể cả SePay gửi lại → không cấp VIP, đúng 1 dòng hàng chờ, không lưu
      nội dung chuyển khoản (tích hợp).
- [x] Tiền về đơn của tài khoản đã xoá → hàng chờ `account_deleted` (tích hợp).
- [x] Sổ hoàn tiền: chỉ `needed → refunded`; sửa trường khác, quay lại hoặc xoá đều bị trigger
      chặn; đơn có tiền về không xoá được (23503) (tích hợp).
- [x] Đột biến: bỏ `status = 'pending'` khỏi câu huỷ thì 2 test tích hợp đỏ.
- [x] Giao diện: hiện đủ thông tin đơn; nút huỷ bị khoá tới khi tick; huỷ xong mở lại nút xoá;
      axe AA 0 vi phạm ở blue-sky + dark-blue (`e2e/account-pending-payment.spec.ts`,
      `AccountDataSection.pending.test.tsx`).
- [x] /admin: hàng chờ nổi bật, đủ thông tin SePay, đánh dấu đã hoàn, axe AA 0 vi phạm
      (`e2e/account-pending-payment.spec.ts`, `AdminRefundQueue.test.tsx`).
- [x] `npm run check:sql` exit 0 trên Postgres đã áp tới `0090`.

**Lệnh chứng minh:**

```bash
npm run typecheck && npm run lint && npm run check:specs
npx vitest run packages/core-billing apps/server/src/api/billing apps/server/src/api/admin/admin-payments \
  apps/server/src/api/core/account.test.ts apps/dhcb/src/components/AccountDataSection \
  apps/dhcb/src/components/admin/AdminRefundQueue.test.tsx apps/dhcb/src/lib/paymentCancelApi.test.ts
DATABASE_URL=… npx vitest run apps/server/src/api/billing/payment-cancel.integration.test.ts \
  packages/core-personal/accountErasureService.integration.test.ts
DATABASE_URL=… npm run check:sql
npx playwright test e2e/account-pending-payment.spec.ts e2e/account-data.spec.ts
```

## ⑤ Bất biến không được phá

| Bất biến                                                                  | Test nào canh nó                                                                      |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Không bao giờ vừa cấp gói vừa ghi hàng chờ cho cùng một đơn               | `payment-cancel.integration.test.ts` (đua song song)                                  |
| Tiền về đơn đã huỷ/ẩn danh luôn để lại dấu vết trong CSDL (không chỉ log) | `payment-webhook.test.ts`, `payment-cancel.integration.test.ts`                       |
| Đơn `pending` bình thường vẫn được cấp gói như cũ                         | `payment-webhook.test.ts`, `payment-cancel.integration.test.ts`                       |
| Danh sách đơn chặn ở giao diện = điều kiện chặn thật của `deleteAccount`  | hằng chung `LIVE_PENDING_CONDITION_SQL` + `accountErasureService.integration.test.ts` |
| Mọi cột người dùng/FK tới users đều được khai trong xoá tài khoản         | `accountErasureService.integration.test.ts` (0533, vẫn xanh)                          |
| Không ai huỷ được đơn của người khác                                      | `payment-cancel.test.ts`, `payment-cancel.integration.test.ts`                        |

## ⑥ Quy ước dự án liên quan + quyết định tự chốt

- Import xuyên gói dùng `@dhcb/<gói>/<file>`; handler tự `validateAuth`, `userId` CHỈ từ phiên.
- Màu lấy từ token (`border-warm-500`, `text-content*`, `bg-surface-*`); vùng chạm ≥ 44px; nội
  dung AAA, phần còn lại AA.
- **Huỷ dùng độc lập được.** API không gắn với xoá tài khoản vì việc huỷ một đơn chưa trả là hợp lệ
  ở mọi lúc. Giao diện tạm chỉ đặt nút ở khối xoá tài khoản, là nơi duy nhất một đơn sống gây hại.
- **Không đòi xác minh lại khi huỷ.** Kẻ chiếm được phiên chỉ huỷ được đơn CHƯA trả của nạn nhân.
  Nếu nạn nhân vẫn chuyển tiền thì tiền vào hàng chờ hoàn, không mất. Đổi lại người dùng thật không
  phải nhập mật khẩu hai lần, vì bước xoá tài khoản ngay sau đó đã đòi xác minh lại.
- **Thứ tự lý do hoàn tiền:** `cancelled` được xét trước `user_id null`. Đơn đã huỷ rồi chủ tài
  khoản xoá luôn vẫn ghi là "người dùng huỷ".
- **`refunded_by` không có khoá ngoại:** bản ghi kiểm toán phải còn sau khi xoá tài khoản admin.
  Admin lấy từ cấu hình `ADMIN_USER_IDS`.
