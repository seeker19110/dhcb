# Đặc tả: Sổ chống lạm dụng quyền lợi một-lần sau khi xoá tài khoản

**Trạng thái:** Approved for implementation — chủ dự án duyệt hướng "chất lượng cao nhất"
2026-10-09 (giao qua coordinator, đợt `0545`).

**Nền:** `docs/specs/2026-10-08-xoa-tai-khoan-va-xuat-du-lieu.md` (changelog `0533`) cho người dùng
tự xoá tài khoản. `ACCOUNT_TABLES` xoá luôn `profiles.signup_trial_granted_at`/`trial_granted_at` và
dòng `referrals` (kèm `device_hash`) ⇒ mở hai đường lạm dụng ghi ở mục rủi ro của `0533`:
"dùng thử → xoá → đăng ký lại → dùng thử lại" và "giới thiệu → xoá → giới thiệu lại".

---

## 0. Một câu

Khi một tài khoản bị xoá, server ghi vào một sổ tối thiểu, không định danh, các mã băm có khoá
(HMAC) của email và thiết bị kèm loại quyền lợi một-lần đã hưởng, để trong 12 tháng tài khoản đăng
ký lại bằng cùng hộp thư/thiết bị không nhận lại dùng thử 14 ngày hay thưởng giới thiệu.

## ① Phạm vi

**LÀM:**

- Bảng mới `platform.erased_benefit_ledger` (migration `0089`): `subject_kind` (`email`/`device`),
  `subject_hash` (HMAC-SHA256 hex), `benefit` (`signup_trial`/`referral_referee`/
  `referral_referrer`), `units` (> 0), `created_at`. Không `user_id`, không plaintext, không khoá
  ngoại tới người dùng.
- `deleteAccount` (CÙNG transaction, sau khi khoá dòng `public.users` và kiểm đơn chờ trả, TRƯỚC mọi
  câu xoá) đọc sự thật rồi ghi sổ:
  - `signup_trial` cho mỗi email nếu `signup_trial_granted_at` hoặc `trial_granted_at` (cột cũ
    `0013`) khác null;
  - `referral_referee` cho mỗi email + mỗi `device_hash` của lượt được mời ĐÃ được thưởng;
  - `referral_referrer` cho mỗi email, `units` = số lượt mời người khác đã được thưởng.
  - "Email" = `users.email` + `identities.email` (liên kết OAuth), bỏ trùng sau chuẩn hoá.
- **Người mời xoá tài khoản ⇒ `referrals.referrer_id` chỉ ẩn danh hoá (`null`), không xoá dòng**:
  dòng là dữ liệu của người ĐƯỢC mời. Giữ dòng ⇒ họ không "được mời lại" (ràng buộc unique
  `referee_id`) để nhận thưởng lần hai, và `device_hash` của họ vẫn chặn cày thưởng. Migration
  `0089`: `referrer_id` cho phép null + khoá ngoại `on delete set null`.
- Lúc cấp **dùng thử** (`grantSignupTrial`): tra sổ theo email của tài khoản; khớp ⇒ trả `false`
  (không cấp, không giành dấu), log bảo mật `SIGNUP_TRIAL_REPEAT_AFTER_ERASURE` không PII. Người
  dùng vẫn đăng ký/đăng nhập bình thường.
- Lúc **thưởng giới thiệu** (`rewardReferralIfEligible`, trong transaction thưởng):
  - người được mời khớp `referral_referee` (email hoặc `device_hash` của lượt mời) ⇒ không thưởng
    ai, không đánh dấu `rewarded_at` (y như nhánh thiết bị dùng lại sẵn có), log
    `REFERRAL_REPEAT_AFTER_ERASURE` không PII;
  - trần `MAX_REWARDED_REFERRALS` của người mời = số lượt đã thưởng hiện có + `units`
    `referral_referrer` của tài khoản cũ cùng email (lấy MAX theo từng mã băm, không cộng chéo) ⇒
    xoá rồi đăng ký lại không làm mới trần;
  - `referrer_id` null (người mời đã xoá) ⇒ chỉ người được mời nhận phần của mình.
- **Hạn giữ 12 tháng**: mọi câu tra tự lọc `created_at > now() - 12 tháng`; job hằng ngày ở
  `server.ts` (cùng khuôn `startSyncReceiptCleanup`, chỉ instance 0) xoá dòng quá hạn.
- **Khoá HMAC**: biến môi trường MỚI `ERASED_BENEFIT_LEDGER_KEY` (≥ 32 byte base64), có mục trong
  `.env.example`; log khởi động báo lỗi nếu thiếu (production) hoặc sai định dạng (mọi môi trường).
- **Giao diện** (`AccountDataSection`): thêm một dòng vào danh sách cảnh báo trước khi xoá, song ngữ.
- **Xuất dữ liệu KHÔNG chứa sổ này**: sổ không gắn với tài khoản nào (không `user_id`), không thể
  chọn ra "dòng của bạn" mà không băm lại email — và tài khoản đang tồn tại thì chưa có dòng nào
  (sổ chỉ ghi lúc xoá).

**KHÔNG LÀM (quan trọng ngang mục trên):**

- KHÔNG chặn đăng ký, KHÔNG khoá tài khoản khi khớp sổ — chỉ không cấp quyền lợi một-lần (mã thiết
  bị là best-effort, máy dùng chung rất phổ biến — xem `0008_referral_device.sql`).
- KHÔNG ghi thiết bị cho `signup_trial`: lúc cấp dùng thử chưa có mã thiết bị nào ⇒ không có đường
  tra ⇒ không thu (tối thiểu hoá dữ liệu).
- KHÔNG lưu `user_id`, email, mã thiết bị dạng rõ, hay SHA-256 trần (email entropy thấp — dò từ
  điển được). Thiếu khoá thì KHÔNG ghi gì, không có "mã băm yếu" thay thế.
- KHÔNG chặn xoá tài khoản khi sổ tắt (thiếu/sai khoá) — xem ③ "Ca lỗi".
- KHÔNG đổi chính sách dùng thử 14 ngày, thưởng 7 ngày, trần 10 lượt; KHÔNG đổi `claimReferral`.
- KHÔNG xử lý "suất founder được giải phóng sau khi xoá" (rủi ro khác của `0533`, ngoài phạm vi).
- KHÔNG đụng file cổng (lint/coverage/size-limit, `scripts/*-policy.test.ts`, `e2e/a11y*.spec.ts`,
  `.github/`).
- Repo **không có trang chính sách quyền riêng tư** (rà `quyền riêng tư`/`privacy` trong
  `apps/dhcb/src` + `apps/hub/src`: chỉ có câu `loginPrivacy` về đồng bộ). Thông báo cho người dùng
  nằm ở `AccountDataSection` — nơi họ quyết định xoá. Khi có trang chính sách, phải thêm mục này.

## ② Điểm chạm

| Việc | Đường dẫn file                                                     | Ghi chú                                                                       |
| ---- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Thêm | `postgres/migrations/0089_erased_benefit_ledger.sql`               | bảng sổ + `referrals.referrer_id` nullable/`set null`; lũy đẳng; ROLLBACK     |
| Sửa  | `postgres/migrations/README.md`                                    | dòng `0089`                                                                   |
| Thêm | `packages/core-billing/erasedBenefitLedger.ts`                     | khoá, chuẩn hoá, HMAC, ghi, tra, dọn                                          |
| Thêm | `packages/core-billing/erasedBenefitLedger.test.ts`                | unit                                                                          |
| Thêm | `packages/core-personal/accountErasureLedger.ts`                   | đọc sự thật trong transaction xoá + gọi ghi sổ                                |
| Sửa  | `packages/core-personal/accountErasureService.ts`                  | MỘT lời gọi sau kiểm đơn chờ; `referrals.referrer_id` → ẩn danh               |
| Sửa  | `packages/core-personal/accountErasureService.test.ts`             | thứ tự câu, lỗi ⇒ rollback, sổ tắt                                            |
| Sửa  | `packages/core-personal/accountErasureService.integration.test.ts` | Postgres thật: ghi sổ, đăng ký lại bị chặn, hạn giữ, ràng buộc                |
| Sửa  | `packages/core-auth/trial.ts`                                      | tra sổ trước khi giành dấu dùng thử                                           |
| Sửa  | `packages/core-auth/trial.test.ts`                                 |                                                                               |
| Sửa  | `apps/server/src/api/_lib/referral.ts`                             | tra sổ người được mời; trần người mời cộng sổ; `referrer_id` null             |
| Sửa  | `apps/server/src/api/_lib/referral.test.ts`                        |                                                                               |
| Sửa  | `apps/server/src/server.ts`                                        | job dọn hằng ngày + báo cấu hình khi khởi động                                |
| Sửa  | `apps/dhcb/src/components/AccountDataSection.tsx`                  | dòng thông báo giữ mã băm 12 tháng                                            |
| Sửa  | `apps/dhcb/src/components/AccountDataSection.test.tsx`             |                                                                               |
| Sửa  | `.env.example`                                                     | `ERASED_BENEFIT_LEDGER_KEY`                                                   |
| Sửa  | `docs/specs/2026-10-08-xoa-tai-khoan-va-xuat-du-lieu.md`           | bảng xoá/ẩn danh: `referrals.referrer_id` chuyển sang ẩn danh; trỏ đặc tả này |

**Ảnh hưởng lan ra (theo `npm run codemap -- impact`):** `erasedBenefitLedger.ts` → `trial.ts`
(→ `auth.ts`, luồng đăng ký/OAuth/xác minh email), `referral.ts` (→ `api/platform/referral.ts`,
`quests.ts`, `history`/chấm bài gọi `rewardReferralIfEligible`, `routes.ts`), `accountErasureService.ts`
(→ `api/core/account.ts`), `server.ts`. Không đổi chữ ký hàm công khai nào đang có.

## ③ Hợp đồng dữ liệu

**Bảng:**

```sql
platform.erased_benefit_ledger (
  id bigserial primary key,
  subject_kind text not null check (subject_kind in ('email','device')),
  subject_hash text not null check (subject_hash ~ '^[0-9a-f]{64}$'),
  benefit text not null check (benefit in ('signup_trial','referral_referee','referral_referrer')),
  units integer not null default 1 check (units > 0),
  created_at timestamptz not null default now()
)
-- index (subject_hash, benefit), index (created_at)
```

**Mã băm:** `subject_hash = HMAC-SHA256(key, "dhcb:erased-benefit:v1:" + kind + ":" + chuẩn_hoá(v))`,
hex. `key` = `ERASED_BENEFIT_LEDGER_KEY` (base64, ≥ 32 byte).

**Chuẩn hoá email (QUYẾT ĐỊNH):**

1. NFC, `trim`, chữ thường.
2. Bỏ "+nhãn" ở phần tên cho MỌI miền (plus addressing: Gmail, Outlook/Hotmail, iCloud, Fastmail,
   Proton… đều giao `ten+abc@` vào `ten@`). Miền coi "+" là ký tự thường rất hiếm; cái giá của dương
   tính giả chỉ là mất một ưu đãi dùng thử, không chặn đăng ký.
3. Riêng `gmail.com`/`googlemail.com`: bỏ MỌI dấu chấm ở phần tên và gộp `googlemail.com` →
   `gmail.com` (Google coi là cùng hộp thư). KHÔNG bỏ dấu chấm ở miền khác (ở đó `a.b@` ≠ `ab@`).
4. Phần tên chỉ gồm "+nhãn" (vd `+x@a.vn`) hoặc chuỗi không có `@` ⇒ giữ nguyên sau bước 1.

**Chuẩn hoá thiết bị:** `trim` + chữ thường; chỉ nhận `^[a-f0-9]{64}$` (đúng định dạng
`referrals.device_hash`), giá trị khác bỏ qua.

**Khoá (QUYẾT ĐỊNH): biến môi trường RIÊNG `ERASED_BENEFIT_LEDGER_KEY`, không tái dùng.**

- Không dùng `accountSubjectHash` (`accountErasureShared.ts`): SHA-256 KHÔNG khoá — đủ cho UUID
  ngẫu nhiên 122 bit, KHÔNG đủ cho email (dò từ điển).
- Không dùng `USER_DATA_MASTER_KEY`/`hashLookupValue` (`userDataCrypto.ts`): module đó đang NGỦ, khoá
  gốc chưa chốt nơi cất (nợ mở trong `PROGRESS.md`) — gắn sổ vào đó là để sổ tắt theo một quyết
  định chưa có. Mục đích cũng khác hẳn: mất khoá dữ liệu người dùng = mất dữ liệu vĩnh viễn; mất/xoay
  khoá sổ chỉ làm sổ cũ hết khớp (chống lạm dụng tạm hở, không mất gì của ai). Tách khoá ⇒ lộ một
  khoá không kéo theo khoá kia.
- Tên chứa `KEY` ⇒ `packages/core-config/secrets.ts` tự che giá trị trong log.

**Ca lỗi (là một phần hợp đồng):**

| Tình huống                                    | Mã lỗi / log                                    | Hành vi mong đợi                                                                                      |
| --------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Thiếu khoá, production                        | `console.error` lúc khởi động (instance 0)      | Server VẪN chạy. Sổ TẮT: xoá không ghi gì (log lỗi mỗi lần), tra luôn "không khớp" (cảnh báo một lần) |
| Thiếu khoá, dev/test                          | không báo lúc khởi động                         | như trên                                                                                              |
| Khoá sai định dạng (không base64 / < 32 byte) | `console.error` lúc khởi động, mọi môi trường   | như "thiếu khoá" — tuyệt đối không ghi mã băm yếu thay thế                                            |
| Câu ghi sổ lỗi trong transaction xoá          | lỗi ném lên nguyên vẹn                          | Rollback TOÀN BỘ việc xoá (không nuốt lỗi, giống mọi câu khác của `deleteAccount`)                    |
| Tra sổ lỗi khi cấp dùng thử                   | `[trial] Lỗi khi cấp quà dùng thử`              | `grantSignupTrial` trả `false` (không cấp), không ném — đăng ký không hỏng                            |
| Tra sổ lỗi khi thưởng giới thiệu              | `[referral] Lỗi khi trao thưởng`                | Transaction thưởng rollback, không cấp, retry lần sau an toàn                                         |
| Khớp sổ khi cấp dùng thử                      | `SIGNUP_TRIAL_REPEAT_AFTER_ERASURE` `{benefit}` | Không cấp, không giành dấu `signup_trial_granted_at`; người dùng dùng app bình thường                 |
| Khớp sổ khi thưởng giới thiệu                 | `REFERRAL_REPEAT_AFTER_ERASURE` `{benefit}`     | Không thưởng ai, không đánh dấu `rewarded_at`                                                         |

**Fail mode (QUYẾT ĐỊNH, cân nhắc "fail-closed ở production"):** chọn **không chặn khởi động và
không chặn xoá** khi thiếu khoá. Lý do: quyền được xoá dữ liệu là nghĩa vụ với người dùng; một ưu đãi
14 ngày VIP không đáng đổi lấy việc chặn quyền đó vì một lỗi cấu hình. Chặn khởi động thì một lần
quên đặt biến là sập cả site. "Fail-closed" được giữ ở đúng chỗ quan trọng: thiếu khoá thì KHÔNG BAO
GIỜ ghi mã băm yếu. Việc tay: đặt `ERASED_BENEFIT_LEDGER_KEY` trên VPS TRƯỚC khi deploy.

**Cơ sở pháp lý và minh bạch:** lợi ích hợp pháp — chống gian lận ưu đãi. Dữ liệu là bút danh hoá
(pseudonymous): không tự nhận ra ai, nhưng người giữ khoá + biết một email cụ thể có thể kiểm email
đó có trong sổ không. Vì vậy câu chữ giao diện nói đúng điều đó ("không chứa email hay tên… chỉ dùng
để chặn nhận lại ưu đãi"), KHÔNG hứa "không thể dùng để nhận diện bạn" (sẽ là hứa quá).

**Thông điệp giao diện (dòng mới trong danh sách "Xoá tài khoản"):**

- vi: "Để chống lạm dụng ưu đãi (dùng thử, mời bạn), chúng tôi giữ mã băm của email và thiết bị
  trong 12 tháng. Mã băm không chứa email hay tên của bạn, không gắn với tài khoản nào, và chỉ dùng
  để chặn nhận lại ưu đãi khi đăng ký lại."
- en: "To prevent offer abuse (free trial, invites), we keep a hash of your email and device for 12
  months. The hash contains no email or name, is not linked to any account, and is only used to stop
  the same offers being claimed again on sign-up."

## ④ Tiêu chí chấp nhận

- [ ] Xoá tài khoản đã nhận dùng thử + được thưởng giới thiệu + từng mời được thưởng ⇒ sổ có đúng 4
      dòng (trial/email, referee/email, referee/device, referrer/email units=1), không cột nào chứa
      user_id/email/thiết bị trần — `accountErasureService.integration.test.ts` (Postgres thật).
- [ ] Tài khoản mới với biến thể Gmail cùng hộp thư (hoa/thường, không dấu chấm, `googlemail.com`)
      bị chặn `signup_trial` + `referral_referee`, `erasedBenefitUnits` = 1; người lạ không bị chặn
      trừ khi dùng đúng thiết bị — cùng test.
- [ ] Người được mời của người xoá giữ dòng (`referrer_id` null, `device_hash` còn) — cùng test.
- [ ] Bản ghi quá 12 tháng không còn hiệu lực và bị `purgeExpiredErasedBenefits` xoá — cùng test.
- [ ] Ghi sổ lỗi ⇒ xoá rollback; thiếu khoá ⇒ không đọc/ghi sổ, xoá vẫn commit —
      `accountErasureService.test.ts`.
- [ ] `grantSignupTrial` khớp sổ ⇒ `false`, không câu ghi nào — `trial.test.ts`.
- [ ] Thưởng giới thiệu: khớp sổ ⇒ không thưởng; trần cộng sổ; `referrer_id` null ⇒ chỉ người được
      mời — `referral.test.ts`.
- [ ] Chuẩn hoá email, HMAC có khoá + tiền tố miền, khoá thiếu/sai ⇒ tắt — `erasedBenefitLedger.test.ts`.
- [ ] Test `ACCOUNT_TABLES` ↔ `information_schema`/`pg_constraint` vẫn xanh.
- [ ] Migration `0089` lũy đẳng (chạy lại không lỗi, OID khoá ngoại không đổi).
- [ ] Tầng 8b: ảnh 1440 + 390px trước/sau, không tràn ngang.

**Lệnh chứng minh:**

```bash
rm -rf packages/*/dist dist dist-server && npm run typecheck && npm run lint
npx vitest run packages/core-billing/erasedBenefitLedger.test.ts packages/core-auth/trial.test.ts \
  apps/server/src/api/_lib/referral.test.ts packages/core-personal/accountErasureService.test.ts \
  apps/dhcb/src/components/AccountDataSection.test.tsx
DATABASE_URL=... npm run migrate:pg && DATABASE_URL=... npm run check:sql
DATABASE_URL=... npx vitest run packages/core-personal/accountErasureService.integration.test.ts
npm run check:specs
```

## ⑤ Bất biến không được phá

| Bất biến                                                                                 | Test nào canh nó                                                   |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Mọi bảng/cột trỏ người dùng đều khai trong `ACCOUNT_TABLES` (sổ không có cột người dùng) | `packages/core-personal/accountErasureService.integration.test.ts` |
| Xoá tài khoản nguyên tử — một câu lỗi (kể cả ghi sổ) ⇒ rollback toàn bộ                  | `packages/core-personal/accountErasureService.test.ts`             |
| Sổ không chứa user_id/plaintext; thiếu khoá không ghi mã băm yếu                         | `packages/core-billing/erasedBenefitLedger.test.ts` + integration  |
| Lỗi cấp dùng thử không phá đăng ký/đăng nhập                                             | `packages/core-auth/trial.test.ts`                                 |
| Thưởng giới thiệu: nguyên tử, mỗi bên đúng một lần, khoá theo thứ tự cố định             | `apps/server/src/api/_lib/referral.test.ts`                        |

## ⑥ Quy ước dự án liên quan

- Import xuyên gói `@dhcb/<gói>/<file>` (không đuôi `.js`); nội bộ gói đường tương đối có `.js`.
- Mọi câu SQL tĩnh phải PREPARE được trên schema thật (`npm run check:sql`).
- Migration có số, lũy đẳng, có ROLLBACK + dòng README (`postgres/migrations/README.md`).
- Log bảo mật không chứa PII (không id, không email).
- Chữ giao diện song ngữ theo `isA`; màu từ token; nội dung AAA (dòng mới dùng đúng class
  `text-content` của danh sách sẵn có).

---

## Nghiệm thu (bên giao việc điền SAU khi nhận kết quả)

- Lệnh đã chạy + kết quả thật: xem `docs/changelog/0545-2026-10-09-so-chong-lam-dung-sau-xoa-tai-khoan.md`.
- Tiêu chí ④ đạt hết chưa; cái nào chưa và vì sao:
- Có phá bất biến ⑤ nào không:
- Có mở rộng ngoài phạm vi ① không:
- Còn để ngỏ:
