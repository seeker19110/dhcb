# 0541 — `/api/persons?action=full_erase` đòi xác minh lại danh tính (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** (điền khi tạo) · **Loại:** `fix(persons)` (bảo mật)
- **Nguồn:** nợ mở `PROGRESS.md` mục "/api/persons" điểm (2) — xoá toàn bộ dữ liệu cá nhân chỉ cần
  cookie phiên, chưa có step-up như `/api/account` (changelog `0533`, PR #1284).

## Việc đã làm

- **Tách cổng dùng chung** `apps/server/src/api/_lib/reauthGate.ts` (`requireReauth`) từ
  `apps/server/src/api/core/account.ts`: hạn mức lượt thử theo người dùng (5 lần / 15 phút, khoá
  `account-reauth:<userId>`) → `verifyAccountReauth` (mật khẩu hoặc token Google ≤ 10 phút) →
  lớp 2FA (cửa sổ nâng quyền + bộ đếm sai mã của `/api/two-factor`). `account.ts` gọi cổng này —
  hành vi KHÔNG đổi (32 test cũ của `account.test.ts` xanh nguyên văn). Hằng số/`accountReauthKey`
  vẫn re-export từ `account.ts`.
- **`DELETE /api/persons?action=full_erase`** (`apps/server/src/api/personal/persons.ts`) nay bắt
  buộc body `{ reauth, twoFactorCode? }` và chạy đúng cổng trên TRƯỚC mọi thao tác CSDL:
  - body rỗng / thiếu `reauth` / sai dạng → **403 `REAUTH_REQUIRED`** (không trừ lượt thử);
  - JSON hỏng → 400; sai mật khẩu/token → 401 `REAUTH_FAILED`; cách xác minh không có → 409
    `REAUTH_UNAVAILABLE`; hết lượt → 429 `RATE_LIMITED` (+ `Retry-After: 900`); bật 2FA chưa nâng
    quyền mà chưa gửi mã → 403 `STEP_UP_REQUIRED` (KHÔNG kiểm mật khẩu); có mã mà sai mật khẩu
    hoặc sai mã → cùng một 401 `REAUTH_FAILED` (xem mục Quyết định).
  - Log bảo mật dùng `accountSubjectHash` (không ghi userId trần), `action: 'person_full_erase'`.
  - `GET` và `GET ?action=export` giữ nguyên.
- **Hợp đồng** `packages/core-contracts/account.ts`: thêm `ReauthProofSchema` (dùng chung),
  `PersonFullEraseBodySchema`, `REAUTH_ERROR_CODES` + `ReauthErrorCode` (thêm mã `REAUTH_REQUIRED`).
  `AccountExportBodySchema`/`AccountDeleteBodySchema` dựng từ `ReauthProofSchema.extend` (cùng hình
  dạng như cũ); `ACCOUNT_ERROR_CODES` gộp `REAUTH_ERROR_CODES`.

## Quyết định

- **Hạn mức lượt thử DÙNG CHUNG khoá với `/api/account`**: kẻ cầm cookie bị đánh cắp không được
  nhân đôi số lần dò mật khẩu bằng cách xoay giữa hai route.
- **Thiếu bằng chứng = 403 `REAUTH_REQUIRED`, không phải 400 Zod**: người đã đăng nhập nhưng chưa
  chứng minh danh tính — mã máy đọc được để client rẽ nhánh hiện ô xác minh lại.
- **Cổng đặt ở `api/_lib/`** (không ở `api/core/`): `routes-registered.test.ts` coi mọi file ngoài
  `_lib/` là handler HTTP cần gắn route.
- **Không làm giao diện**: rà toàn repo (`apps/dhcb`, `apps/hub`, `packages`, `e2e`) KHÔNG có nơi
  nào gọi `full_erase` — endpoint hiện chỉ có hợp đồng API. Không tự chế một màn "xoá dữ liệu
  Personal OS" ngoài đặc tả; khi có giao diện thì tái dùng khối xác minh lại của
  `AccountDataSection.tsx` và `GET /api/account?action=options` (danh sách cách xác minh + có cần
  mã 2FA). Vì không chạm giao diện nên không có ảnh chụp Tầng 8b.
- **Breaking change API**: client nào gọi `full_erase` không kèm body sẽ nhận 403 thay vì xoá —
  đúng chủ đích; trong repo không có client như vậy.

- **Vá sau rà bảo mật (Medium): cổng xác minh lại không còn là "máy dò" mật khẩu khi bật 2FA.**
  Trước đây cổng kiểm mật khẩu TRƯỚC rồi mới xét 2FA: kẻ cầm cookie đánh cắp gửi mật khẩu đoán,
  sai thì nhận 401, đúng thì nhận 403 "nhập mã 2FA" — xác nhận được mật khẩu dù không có mã.
  Lỗi có sẵn từ `/api/account` (0533), commit này mở thêm route đi qua cùng cổng nên vá luôn cho
  cả hai. Nay: người bật 2FA mà chưa gửi mã nhận 403 ngay, mật khẩu chưa được kiểm; có mã rồi thì
  sai mật khẩu hay sai mã đều nhận CÙNG phản hồi 401 `REAUTH_FAILED`. Khi mật khẩu sai, cổng KHÔNG
  gọi `verifyTwoFactor` vì hàm đó tiêu mã (mã khôi phục bị đánh dấu đã dùng) — gọi lúc ấy là đốt
  mã của chính chủ. Còn lại một chênh lệch thời gian nhỏ (một truy vấn 2FA), đã bị giới hạn
  5 lượt/15 phút. Mã `TWO_FACTOR_INVALID` không còn được trả nên gỡ khỏi `REAUTH_ERROR_CODES`.

## Bằng chứng

- `npx vitest run apps/server packages/core-auth packages/core-contracts apps/dhcb/src/lib/accountApi apps/dhcb/src/components/AccountDataSection`
  → 215 file xanh, 2769 test pass, 2 skip.
- `persons.test.ts`: +12 ca (thiếu body/thiếu reauth/JSON hỏng/sai mật khẩu + log không lộ userId/
  xác minh theo userId phiên/không khả dụng/hết lượt dùng chung khoá/STEP_UP/2FA sai/2FA đúng/không
  bật 2FA/export không bị đòi reauth); 4 ca full_erase cũ cập nhật gửi body.
- `rm -rf packages/*/dist dist dist-server && npm run typecheck` → exit 0; `npm run lint` → exit 0;
  `npm run codemap -- cycles` → "Không có chu trình import."; không đổi SQL ⇒ không cần `check:sql`.
