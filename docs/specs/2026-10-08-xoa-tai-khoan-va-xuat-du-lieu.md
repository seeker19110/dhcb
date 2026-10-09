# Đặc tả: Xoá tài khoản + Xuất toàn bộ dữ liệu của tôi

**Trạng thái:** Approved for implementation — chủ dự án duyệt hướng "chất lượng cao nhất"
2026-10-08 trong phiên (giao qua coordinator, đợt `0533`).

**Nền:** `docs/changelog/0527-2026-10-08-sua-xuat-xoa-du-lieu-ca-nhan.md` mục "Ngoài phạm vi —
cần chủ dự án quyết" (export/erase cũ chỉ phủ Personal OS theo `person_id`, chưa phủ dữ liệu gắn
thẳng `user_id`). Đặc tả này đóng đúng khoảng trống đó.

---

## 0. Một câu

Người dùng đã đăng nhập tự **tải về toàn bộ dữ liệu của mình** (một tệp JSON) và tự **xoá vĩnh
viễn tài khoản** — xoá mọi dữ liệu cá nhân ở mọi schema trong MỘT transaction, riêng chứng từ
thanh toán được ẩn danh hoá thay vì xoá — sau khi xác minh lại danh tính ngay lúc thao tác.

## ① Phạm vi

**LÀM:**

- **Danh sách khai báo DUY NHẤT** `ACCOUNT_TABLES` (`packages/core-personal/accountErasureService.ts`):
  mỗi cặp (bảng, cột tham chiếu người dùng) có đúng một hành động `delete` / `anonymize`, kèm
  danh sách cột XUẤT tường minh. Xuất và xoá cùng duyệt danh sách này (khuôn `PERSON_TABLES` của
  0527). Dữ liệu Personal OS (`personal.persons` + 21 bảng theo `person_id`) đi qua dịch vụ đã có
  `personErasureService` (tách thêm biến thể chạy trên `PoolClient` để nằm chung transaction).
- **Test tích hợp đối chiếu `information_schema`/`pg_constraint`**: mọi khoá ngoại trỏ
  `public.users(id)`, mọi cột tên kiểu `user_id`/`owner_id`/`sender_id`/… và mọi cột email ở bảng
  thật PHẢI có trong `ACCOUNT_TABLES` (hoặc danh sách GIỮ LẠI có lý do). Thêm bảng mới mà quên khai
  ⇒ test đỏ.
- **Xoá tài khoản** `POST /api/account {action:'delete'}`: khoá dòng `public.users … for update`,
  áp hành động từng bảng, xoá Personal OS, xoá `public.users`, ghi nhật ký xoá — tất cả MỘT
  transaction; lỗi bất kỳ ⇒ rollback toàn bộ, ném lỗi (500 + Sentry qua `wrapEdge`), không nuốt.
  Thành công ⇒ mọi phiên/token bị huỷ (bảng `sessions`, `password_resets`, `email_verifications`,
  `user_2fa*`, `push_subscriptions` đều bị xoá trong transaction) + cookie phiên bị xoá ở response.
- **Xuất dữ liệu** `POST /api/account {action:'export'}`: một transaction `repeatable read, read
only`, trả tệp JSON (`Content-Disposition: attachment`). POST (không phải GET) vì mang thông tin
  xác minh lại trong body.
- **Step-up (xác minh lại) cho CẢ xoá lẫn xuất**, kiểm ngay trong chính request:
  - Tài khoản có mật khẩu ⇒ mật khẩu hiện tại (bcrypt, `verifyPassword`).
  - Tài khoản có liên kết Google ⇒ access token Google VỪA lấy qua popup GIS (cùng cơ chế đăng
    nhập thật của app — `initTokenClient`, `verifyGoogleAccessToken`), `sub` phải khớp
    `public.identities (provider='google')` của CHÍNH người này, và token phải được cấp trong
    **≤ 10 phút** (suy từ `expires_in` của tokeninfo; token Google sống 3600 giây).
  - Đã bật 2FA ⇒ thêm điều kiện: phiên đang trong cửa sổ nâng quyền (`hasStepUp`, TÁI DÙNG
    `packages/core-auth/twoFactor.ts`) HOẶC gửi kèm mã 2FA/mã khôi phục hợp lệ (`verifyTwoFactor`,
    dùng chung bộ đếm sai mã theo người dùng `twoFactorUserKey` của `/api/two-factor`).
  - Rate limit: theo IP (`checkRateLimit`, 10/phút, bucket `account`) + theo NGƯỜI DÙNG
    (`consumeWindowCounter`, 5 lần thử xác minh / 15 phút) — cookie bị đánh cắp xoay IP vẫn
    không dò được mật khẩu.
- **Câu xác nhận gõ tay** khi xoá: "XOÁ TÀI KHOẢN" (giao diện tiếng Việt) / "DELETE MY ACCOUNT"
  (giao diện tiếng Anh). So khớp sau khi bỏ dấu + viết hoa + gộp khoảng trắng (bàn phím Việt đặt
  dấu "XÓA"/"XOÁ" khác nhau — không được bắt người dùng đoán). Server kiểm lại, không tin client.
- **Gói VIP còn hạn** ⇒ giao diện hiện cảnh báo rõ "không hoàn tiền phần còn lại" + ô xác nhận;
  server đòi `acknowledgeNoRefund: true` (thiếu ⇒ 409 `VIP_ACK_REQUIRED`). **Không đổi chính sách
  hoàn tiền** — chỉ nói rõ chính sách hiện hành.
- **Ẩn danh hoá chứng từ thanh toán** (`public.payments`): `user_id → null`, ghi
  `anonymized_at = now()`, đơn `pending` (chưa có tiền) ⇒ `expired`. Webhook SePay gặp đơn đã ẩn
  danh ⇒ ghi log `SEPAY_PAYMENT_ORPHANED`, không cấp gói cho ai.
- **Nhật ký xoá append-only** `platform.account_erasure_log`: chỉ chứa mã băm SHA-256 một chiều
  của `user_id` (kèm tiền tố miền), thời điểm, số dòng theo từng (bảng.cột), tổng xoá/ẩn danh, id
  dòng `person_erasure_log` (nếu có). Trigger chặn `update`/`delete`/`truncate`.
- **UI** ở trang cá nhân (`/trang-ca-nhan` — `Profile.tsx`): mục "Dữ liệu & tài khoản" gồm "Tải dữ liệu của
  tôi" và "Xoá tài khoản", song ngữ theo ngôn ngữ giao diện, token theme, vùng chạm ≥ 44px, trạng
  thái tải/lỗi/thử lại, `role="alert"` cho lỗi.

**KHÔNG LÀM (quan trọng ngang mục trên):**

- KHÔNG đổi chính sách hoàn tiền, KHÔNG tự hoàn tiền, KHÔNG huỷ đơn đã `paid`.
- KHÔNG xoá chứng từ thanh toán (nghĩa vụ lưu chứng từ kế toán — Luật Kế toán 2015 Điều 41: chứng
  từ kế toán lưu tối thiểu 5 năm; số liệu doanh thu ở `/admin` cũng dựa vào nó).
- KHÔNG có "xoá mềm/khôi phục trong 30 ngày" — xoá là xoá ngay, không hoàn tác (chủ dự án chọn
  hướng xoá thật; muốn có thời gian ân hạn phải là đặc tả riêng).
- KHÔNG xoá log ứng dụng/Sentry/Redis đếm lượt (tự hết hạn/xoay vòng; ngoài CSDL) và KHÔNG xoá
  bản backup CSDL đã chụp (backup xoay vòng theo lịch — ghi rõ trong mục "Rủi ro" của changelog).
- KHÔNG mở xoá tài khoản cho admin xoá hộ người khác (chỉ chính chủ, `initiated_by = 'self'`).
- KHÔNG xác minh lại qua Facebook/Apple/Microsoft: giao diện hiện KHÔNG có nút đăng nhập các nhà
  cung cấp này (`apps/dhcb/src` không gọi `loginWithFacebook/Apple/Microsoft`). Tài khoản chỉ có
  các liên kết đó ⇒ 409 `REAUTH_UNAVAILABLE` (không có đường tắt bỏ qua xác minh).
- KHÔNG đụng `PROGRESS.md`, file cổng (lint/coverage/size-limit, `scripts/*-policy.test.ts`,
  `e2e/a11y*.spec.ts`, `.github/`).
- KHÔNG đổi `/api/persons?action=export|full_erase` (giữ nguyên hợp đồng của 0527).

## ② Điểm chạm

| Việc | Đường dẫn file                                                     | Ghi chú                                                                                                                        |
| ---- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Thêm | `postgres/migrations/0088_account_erasure.sql`                     | `payments.anonymized_at`, FK `payments.user_id` → `on delete restrict` + nullable, nhật ký xoá                                 |
| Sửa  | `postgres/migrations/README.md`                                    | dòng 0088                                                                                                                      |
| Thêm | `packages/core-contracts/account.ts`                               | Zod body + câu xác nhận + chuẩn hoá (dùng chung client/server)                                                                 |
| Thêm | `packages/core-contracts/account.test.ts`                          |                                                                                                                                |
| Thêm | `packages/core-personal/accountErasureService.ts`                  | `ACCOUNT_TABLES`, `exportAccountData`, `deleteAccount`                                                                         |
| Thêm | `packages/core-personal/accountErasureService.test.ts`             | unit (pg giả): thứ tự, transaction, không nuốt lỗi, đếm, nhật ký                                                               |
| Thêm | `packages/core-personal/accountErasureService.integration.test.ts` | Postgres thật: phủ schema, xoá A sạch, B nguyên, thanh toán ẩn danh, append-only                                               |
| Sửa  | `packages/core-personal/personErasureService.ts`                   | thêm `readPersonDataWith`/`erasePersonDataWith` (chạy trên `PoolClient`), hành vi cũ giữ nguyên                                |
| Thêm | `packages/core-auth/accountReauth.ts`                              | xác minh lại: mật khẩu / Google + 2FA                                                                                          |
| Thêm | `packages/core-auth/accountReauth.test.ts`                         |                                                                                                                                |
| Sửa  | `packages/core-auth/authService.ts`                                | thêm `inspectGoogleAccessToken` (trả kèm `expiresInSec`); `verifyGoogleAccessToken` gọi lại nó, hình dạng trả về cũ giữ nguyên |
| Sửa  | `packages/core-auth/authService.test.ts`                           | 3 ca `inspectGoogleAccessToken`                                                                                                |
| Sửa  | `packages/core-auth/tsconfig.json`                                 | reference `../core-contracts` (accountReauth dùng `Reauth`)                                                                    |
| Thêm | `apps/server/src/api/core/account.ts`                              | handler `/api/account`                                                                                                         |
| Thêm | `apps/server/src/api/core/account.test.ts`                         | 401/403/409/429, IDOR, bypass step-up, cookie bị xoá                                                                           |
| Sửa  | `apps/server/src/routes.ts`                                        | `app.all('/api/account', …)`                                                                                                   |
| Sửa  | `apps/server/src/api/billing/payment-webhook.ts`                   | đơn đã ẩn danh ⇒ log, không cấp gói                                                                                            |
| Sửa  | `apps/server/src/api/billing/payment-webhook.test.ts`              | ca đơn đã ẩn danh                                                                                                              |
| Sửa  | `packages/core-contracts/adminViews.ts`                            | `AdminPaymentRow.userId: string \| null` (đơn của tài khoản đã xoá)                                                            |
| Sửa  | `apps/dhcb/src/components/admin/AdminPaymentsPanel.tsx`            | hiện "Tài khoản đã xoá" khi `userId` null                                                                                      |
| Sửa  | `packages/core-ui/clientAuth.ts`                                   | `requestGoogleAccessToken()` — lấy token Google cho xác minh lại (không đăng nhập)                                             |
| Thêm | `apps/dhcb/src/lib/accountApi.ts`                                  | gọi `/api/account`, tải tệp                                                                                                    |
| Thêm | `apps/dhcb/src/components/AccountDataSection.tsx`                  | UI hai khối                                                                                                                    |
| Thêm | `apps/dhcb/src/components/AccountDataSection.test.tsx`             |                                                                                                                                |
| Sửa  | `apps/dhcb/src/pages/core/Profile.tsx`                             | gắn mục mới sau "Bảo mật"                                                                                                      |
| Thêm | `e2e/account-data.spec.ts`                                         | Playwright (mock API): luồng xuất + xoá, a11y AA của mục mới                                                                   |

**Ảnh hưởng lan ra (theo codemap):** `personErasureService.ts` → `apps/server/src/api/personal/persons.ts`,
`scripts/eval-v2-privacy.ts`, `scripts/eval-v2-final-audit.ts` (API cũ giữ nguyên chữ ký).
`authService.ts` (hotspot) — chỉ thêm trường trả về. `clientAuth.ts` — chỉ thêm hàm.
`payments` đổi FK: mọi đường xoá `public.users` khác (hiện KHÔNG có trong mã nguồn, chỉ test dọn
dữ liệu) sẽ bị chặn nếu người đó còn đơn chưa ẩn danh — có chủ đích.

## ③ Hợp đồng dữ liệu

**Vào** (`packages/core-contracts/account.ts`):

```ts
type Reauth =
  | { method: 'password'; password: string /* 1..200 */ }
  | { method: 'google'; accessToken: string /* 10..4096 */ }

type AccountBody =
  | { action: 'export'; reauth: Reauth; twoFactorCode?: string /* 6..32 */ }
  | {
      action: 'delete'
      reauth: Reauth
      twoFactorCode?: string
      confirmation: string // khớp câu xác nhận sau chuẩn hoá
      acknowledgeNoRefund?: boolean // bắt buộc true khi VIP còn hạn
    }

// GET /api/account?action=options
type AccountOptions = {
  methods: ('password' | 'google')[] // cách xác minh lại khả dụng
  twoFactorRequired: boolean // 2FA bật và phiên CHƯA trong cửa sổ nâng quyền
  vipActive: boolean
  planExpiresAt: string | null // null + vipActive = VIP vĩnh viễn
}
```

**Ra:**

```ts
// export: 200, application/json, Content-Disposition: attachment; filename="dhcb-du-lieu-cua-toi-YYYY-MM-DD.json"
type AccountExport = {
  format: 'dhcb-account-export'
  formatVersion: 1
  exportedAt: string // ISO 8601
  userId: string
  notes: string[] // giải thích phần cố ý không xuất (bí mật xác thực)
  tables: Record<ExportKey, Record<string, unknown>[]> // mọi mục trong ACCOUNT_TABLES có cột xuất
  personalOs: PersonExportData | null // khuôn của 0527
}
// delete: 200 { ok: true, erasedAt: string } + Set-Cookie xoá phiên
```

**Ca lỗi (là một phần hợp đồng):**

| Tình huống                                              | Mã  | `code`                            | Hành vi                                       |
| ------------------------------------------------------- | --- | --------------------------------- | --------------------------------------------- |
| Không đăng nhập                                         | 401 | —                                 | không chạm CSDL                               |
| Body sai Zod / câu xác nhận sai                         | 400 | `CONFIRMATION_MISMATCH` (sai câu) | không trừ lượt xác minh                       |
| Phương thức xác minh không khả dụng cho tài khoản       | 409 | `REAUTH_UNAVAILABLE`              |                                               |
| Mật khẩu sai / token Google sai, cũ (> 10 phút), lạ sub | 401 | `REAUTH_FAILED`                   | trừ 1 lượt, ghi `logSecurityEvent`            |
| 2FA bật, chưa nâng quyền, thiếu mã                      | 403 | `STEP_UP_REQUIRED`                |                                               |
| Mã 2FA sai (cùng phản hồi với sai mật khẩu — 0541)      | 401 | `REAUTH_FAILED`                   | trừ lượt theo `twoFactorUserKey`              |
| VIP còn hạn, thiếu `acknowledgeNoRefund`                | 409 | `VIP_ACK_REQUIRED`                | kiểm TRƯỚC khi trừ lượt xác minh              |
| Quá lượt (IP hoặc người dùng)                           | 429 | `RATE_LIMITED`                    | `Retry-After`                                 |
| Người dùng đã bị xoá (request song song thứ hai)        | 404 | —                                 | transaction thứ hai chờ khoá rồi thấy 0 dòng  |
| Lỗi CSDL bất kỳ giữa chừng                              | 500 | —                                 | rollback toàn bộ, log `ACCOUNT_DELETE_FAILED` |

### Bảng xoá / ẩn danh / giữ (nguồn sự thật là `ACCOUNT_TABLES`, đối chiếu schema sau 0088)

**XOÁ dòng** (theo cột người dùng): `location.positions` · `location.consent_log` ·
`location.session_members` · `location.sessions` (owner — kéo theo thành viên/vị trí của chuyến
đi do người này tạo, giống khi chủ chuyến kết thúc chuyến) · `chat.moderation_events` ·
`chat.room_members` · `english.challenge_entries` · `english.chat_sessions` ·
`english.learning_progress` · `english.mistakes` · `english.speaking_sessions` ·
`english.tutor_feedback` · `english.user_profile` · `english.writing_submissions` ·
`personal.intake` · `personal.learner_intent` · `platform.completion_evidence` ·
`platform.completion_state` · `platform.feature_state` · `programming.learner_state` ·
`programming.lesson_progress` · `programming.path_artifacts` · `programming.path_progress` ·
`programming.project_files` · `programming.project_snapshots` · `programming.spec_enrollment` ·
`programming.spec_stage_progress` · `public.achievement_claims` · `public.companion_invites`
(learner) · `public.companion_links` (learner + watcher) · `public.daily_plan_completions` ·
`public.daily_usage` · `public.email_reminders` · `public.email_verifications` ·
`public.entitlements` · `public.exam_plans` · `public.free_daily_credit` · `public.friendships`
(a + b) · `public.identities` · `public.password_resets` · `public.push_subscriptions` ·
`public.quest_claims` · `public.referrals` (referee) · `public.sessions` ·
`public.sync_conflicts` · `public.sync_receipts` · `public.user_2fa` ·
`public.user_2fa_recovery_codes` · `public.user_feedback` · `public.weekly_ai_credit` ·
`public.profiles` · Personal OS (`personal.persons` + 21 bảng, qua `personErasureService`) ·
`public.users` (cuối cùng).

**ẨN DANH HOÁ (giữ dòng, gỡ danh tính):**

| Bảng.cột                                          | Gán                                                                                                                            | Vì sao giữ dòng                                                                                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `public.payments.user_id`                         | `user_id=null`, `anonymized_at=now()`, `pending→expired`                                                                       | chứng từ kế toán. **Giữ:** id, plan, cycle, amount_vnd, provider, payment_code, provider_txn_id, status, created_at, expires_at, paid_at, years |
| `chat.messages.sender_id`                         | `content='[đã xoá]'`, `content_clean=null`, `moderation_flags=null`, `sender_id=null`, `deleted_at=coalesce(deleted_at,now())` | phòng chat chung: tin của người KIA giữ nguyên; tin của người bị xoá ẩn khỏi danh sách theo đúng cơ chế xoá tin hiện có (`deleted_at`)          |
| `chat.rooms.created_by`                           | `null`                                                                                                                         | phòng còn thành viên khác                                                                                                                       |
| `public.analytics_events.user_id`                 | `null`                                                                                                                         | số liệu phễu tổng hợp; sau khi gỡ `user_id` không còn là dữ liệu cá nhân                                                                        |
| `public.companion_invites.used_by`                | `null`                                                                                                                         | mã mời thuộc về người học khác                                                                                                                  |
| `public.stem_lesson_reviews.user_id`              | `user_id=null`, `nguoi_duyet='đã xoá #<id>'` (khi có)                                                                          | hồ sơ duyệt nội dung bài học (không phải dữ liệu học của người dùng)                                                                            |
| `public.feature_status_checks.triggered_by_email` | `null` (khớp email, không phân biệt hoa thường)                                                                                | nhật ký kiểm tra hệ thống của admin                                                                                                             |
| `public.referrals.referrer_id`                    | `null` (0545)                                                                                                                  | dòng là của người ĐƯỢC mời: giữ để không "được mời lại" nhận thưởng lần hai                                                                     |

Tài khoản thanh toán KHÔNG lưu email/tên trong `payments` (đã rà cột) — danh tính chỉ nằm ở
`user_id`. Chọn `null` thay vì mã băm vì mã băm `user_id` vẫn cho người giữ `user_id` cũ (log,
backup) nối lại đơn với người — ẩn danh mạnh hơn, mà kế toán không cần nối đơn với người.

**Sổ chống lạm dụng (bổ sung 2026-10-09, `0545`):** trong CÙNG transaction xoá, ghi mã băm HMAC
email/thiết bị + quyền lợi một-lần đã hưởng vào `platform.erased_benefit_ledger` (giữ 12 tháng) —
xem `docs/specs/2026-10-09-so-chong-lam-dung-sau-xoa-tai-khoan.md`.

**GIỮ NGUYÊN có lý do:** `public.vip_whitelist` (danh sách email do ADMIN nhập để cấp VIP — dữ
liệu quản trị, admin gỡ ở `/admin`; xoá tự động sẽ đổi quyết định của admin) ·
`platform.person_erasure_log`, `platform.account_erasure_log` (vết kiểm toán, không chứa dữ liệu
cá nhân).

### Nhật ký xoá

`subject_hash = sha256("dhcb:account-erasure:v1:" + user_id)` (hex). `user_id` là UUID ngẫu nhiên
122 bit nên không dò ngược được; KHÔNG băm email (email entropy thấp — dò từ điển được). Mục đích:
trả lời "tài khoản X đã bị xoá chưa, lúc nào" khi có yêu cầu, mà không lưu lại danh tính.

### Luật số 1 và hồ sơ năng lực ẩn trong bản xuất — QUYẾT ĐỊNH

Bản xuất **CÓ** chứa `personal.intake` (câu trả lời của chính người dùng, hai câu tự do được
**giải mã** về chữ họ đã viết) và `personal.learner_intent`.

Lý do: Luật số 1 (`docs/research/luong-nguoi-moi-ho-so-nang-luc-an-2026-08-23.md` §1–2, §7) cấm
đưa kết quả chẩn đoán lên **giao diện làm màn hình chính / bảng chấm điểm**; nó không phải luật
giấu dữ liệu khỏi chính chủ. Bản xuất là quyền truy cập dữ liệu của chính mình, nhận dưới dạng
**tệp tải về** mà giao diện KHÔNG render. Ba ràng buộc giữ đúng tinh thần luật:

1. Giao diện chỉ hiện nút "Tải dữ liệu"; KHÔNG đọc/hiển thị nội dung tệp (test UI canh: sau khi
   tải, DOM không chứa trường nào của `intake`).
2. Hồ sơ ẩn KHÔNG có điểm số/thang bậc nào để rò (bảng `intake` chỉ lưu câu trả lời + mã việc gợi
   ý + mốc thời gian — §4 tài liệu trên); xuất NGUYÊN câu trả lời, không tính thêm/không suy luận.
3. Bảy test bất biến T1–T7 không đổi, vẫn chạy.

## ④ Tiêu chí chấp nhận

- [ ] AC1 — Danh sách khai báo phủ đủ schema: mọi FK → `public.users`, mọi cột tên người dùng và
      mọi cột email ở bảng thật nằm trong `ACCOUNT_TABLES`/ủy quyền Personal OS/danh sách giữ —
      `DATABASE_URL=… npx vitest run packages/core-personal/accountErasureService.integration.test.ts`.
- [ ] AC2 — Tạo user A, B có dữ liệu ở MỌI bảng khai báo; xoá A ⇒ mọi bảng khai báo 0 dòng của A,
      `public.users` không còn A, thanh toán của A còn đủ dòng với `user_id is null` +
      `anonymized_at` có giá trị, đơn `pending` thành `expired`; số dòng mọi bảng của B y nguyên;
      tin chat của B trong phòng chung còn nguyên chữ — cùng lệnh trên.
- [ ] AC3 — Nhật ký: có đúng một dòng `account_erasure_log` khớp `subject_hash`, không chứa
      `user_id`/email ở bất kỳ cột nào; `update`/`delete` dòng đó ⇒ lỗi — cùng lệnh trên.
- [ ] AC4 — Lỗi giữa chừng (ép một câu lỗi) ⇒ rollback: dữ liệu A còn nguyên — test tích hợp + unit.
- [ ] AC5 — Xuất A: mọi mục khai báo có cột xuất đều có mặt và ≥ 1 dòng, chỉ dữ liệu A, không có
      `password_hash`/`session_token`/`secret`/`code_hash`/`token_hash`/`p256dh`/`auth_key`/
      `invite_code`/`admin_notes`/`device_hash`; câu tự do của `intake` đã giải mã — test tích hợp.
- [ ] AC6 — Step-up: thiếu/sai mật khẩu ⇒ 401 và KHÔNG gọi dịch vụ xoá; token Google của người
      khác/cũ ⇒ 401; 2FA bật + chưa nâng quyền + thiếu mã ⇒ 403; quá lượt ⇒ 429; `userId` gửi
      trong body/query bị bỏ qua — `npx vitest run apps/server/src/api/core/account.test.ts packages/core-auth/accountReauth.test.ts`.
- [ ] AC7 — UI: mục mới có ở trang Hồ sơ, nút xoá chỉ bật khi gõ đúng câu xác nhận (+ đánh dấu
      không hoàn tiền nếu VIP), lỗi hiện bằng `role="alert"`, vùng chạm ≥ 44px, 0 vi phạm axe A/AA
      ở 3 theme — `npx playwright test e2e/account-data.spec.ts` + `npx vitest run apps/dhcb/src/components/AccountDataSection.test.tsx`.
- [ ] AC8 — Câu SQL tĩnh mới PREPARE được trên CSDL thật — `DATABASE_URL=… npm run check:sql`.

**Lệnh chứng minh:**

```bash
rm -rf packages/*/dist dist dist-server && npm run typecheck && npm run lint && npm run build
npm run check:specs && npm run test:coverage
DATABASE_URL=postgresql://postgres@localhost:<cổng>/<db> npm run migrate:pg
DATABASE_URL=… npx vitest run packages/core-personal/
DATABASE_URL=… npm run check:sql
npx playwright test e2e/account-data.spec.ts e2e/a11y.spec.ts
```

## ⑤ Bất biến không được phá

| Bất biến                                                         | Test nào canh nó                                                                 |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Bảng mới có cột người dùng phải được khai báo xoá/ẩn danh/giữ    | `packages/core-personal/accountErasureService.integration.test.ts`               |
| Bảng mới có `person_id` phải nằm trong `PERSON_TABLES`           | `packages/core-personal/personErasureService.integration.test.ts`                |
| Chứng từ thanh toán không bao giờ bị xoá dây chuyền khi xoá user | `packages/core-personal/accountErasureService.integration.test.ts` (FK restrict) |
| Xoá/xuất chỉ cho chính chủ, sau xác minh lại                     | `apps/server/src/api/core/account.test.ts`                                       |
| Không nuốt lỗi, rollback toàn bộ                                 | `packages/core-personal/accountErasureService.test.ts`                           |
| Luật số 1: không số năng lực lên UI (T1–T7)                      | `packages/core-personal/intakeSuggestion.test.ts`, `e2e/a11y-intake.spec.ts`     |
| A/AA 0 vi phạm, AAA nội dung                                     | `e2e/a11y.spec.ts`, `e2e/a11y-aaa.spec.ts`                                       |

## ⑥ Quy ước dự án liên quan

- Import xuyên gói `@dhcb/<gói>/<file>` (không đuôi `.js`), nội bộ gói đường tương đối có `.js`.
  `packages/` không import `apps/`. `core-personal` không phụ thuộc `core-auth`.
- Mọi handler `validateAuth()` trước khi chạm CSDL; `userId` CHỈ lấy từ phiên; không có RLS.
- Dữ liệu ngoài validate bằng Zod; lỗi trả `jsonResponse` có `code`; lỗi hạ tầng để `wrapEdge`
  trả 500 + Sentry, không `catch` nuốt.
- Định danh SQL không tham số hoá được ⇒ `assertIdent` (khuôn 0527).
- Màu qua token (`text-content`, `bg-surface-card`, `border-line-*`), không hard-code; nội dung
  AAA, điều khiển AA; vùng chạm `tap-44`.
- Migration có số tiếp theo, luỹ đẳng, có dòng README, ghi cách rollback.

---

## Nghiệm thu (bên giao việc điền SAU khi nhận kết quả)

- Lệnh đã chạy + kết quả thật:
- Tiêu chí ④ đạt hết chưa; cái nào chưa và vì sao:
- Có phá bất biến ⑤ nào không:
- Có mở rộng ngoài phạm vi ① không (nếu có: bỏ ra hay giữ lại, vì sao):
- Còn để ngỏ:
