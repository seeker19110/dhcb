# 0488 — Đợt U2 audit UI/UX: form xác thực có nhãn, hub hết tràn ngang, hub đạt axe (2026-10-04)

- **Ngày:** 2026-10-04 · **PR:** #1223 · **Loại:** `fix(a11y)`.
- **Phạm vi:** đợt U2 trong `docs/audit/2026-09-30-audit-ui-ux-chuan-2026.md` mục 12: C3 + C6 +
  phần hub của C4 (`link-name`, tương phản chữ "Bắt đầu"). Không cần chủ dự án quyết.

## Đã làm

### C3 — Form xác thực (WCAG 1.3.5, 3.3.2, 4.1.2, 4.1.3)

Áp cho `apps/dhcb/src/pages/core/Login.tsx`, `ResetPassword.tsx`, `apps/hub/src/pages/HubLogin.tsx`:

- Mọi ô nhập có `<label htmlFor>` hiện chữ (trước chỉ có placeholder).
- `autoComplete`: `name` (tên) · `email` · `current-password` (đăng nhập) · `new-password`
  (đăng ký, đặt lại).
- Dòng "Mật khẩu tối thiểu 15 ký tự." hiện cố định dưới ô mật khẩu khi đăng ký / đặt lại, nối
  `aria-describedby`. Trước đây luật chỉ nằm ở placeholder nên biến mất khi gõ ký tự đầu. Luật
  vẫn là 15 ký tự (`minLength` + `isValidNewPassword` giữ nguyên).
- Khối lỗi có `role="alert"`; ô sai có `aria-invalid` (trạng thái `invalidFields`, chỉ để trình
  bày: mật khẩu ngắn → ô mật khẩu; thiếu tên → ô tên; email không hợp lệ → ô email; sai thông tin
  đăng nhập → email + mật khẩu). Đổi chế độ xoá cả lỗi lẫn `aria-invalid`.
- Nút chế độ "Đăng nhập | Đăng ký" có `aria-pressed` (và `type="button"`).
- Không đổi logic gửi form, kiểm hợp lệ, gọi API.
- Ngoài phạm vi, để nguyên: `ResetPassword` còn nút "Về trang đăng nhập" `text-accent-400` (C4,
  đợt U3).

### C6 — Hub tràn ngang (WCAG 1.4.10)

- `apps/hub/src/App.tsx`: dưới 560px, chữ thương hiệu trong header ẩn (còn biểu tượng), nhãn "Nền
  tảng" chỉ hiện từ `md`. `scrollWidth − clientWidth` ở `/`: 390px **194 → 0**, 320px **264 → 0**.
  Bắt được cả ca 2px ở 640px khi nhãn "Nền tảng" mới hiện lúc thử `sm`, nên dời sang `md`.
- Logo-link có `aria-label="Đồng hành cùng bạn — trang chủ"` (cần vì chữ đã ẩn ở điện thoại).

### Hub — `link-name` và tương phản (C4, dòng hub)

- `HubLogin.tsx`: logo-link có `aria-label`.
- Chữ "Bắt đầu" (và mọi chữ đặt trên nền `bg-accent-500` ở hub): `text-zinc-950` →
  `text-[#09090b]`. Nguyên nhân: `zinc-950` bị đảo thành màu sáng ở theme nền sáng nên chữ sáng
  trên nền sky-500. Dùng đúng khuôn của `Button`/`SkipLink` ở `packages/core-ui` (chữ tối cố định
  trên nền accent, bất biến ở `Button.test.tsx`). 20 chỗ ở hub (`App.tsx` 15, `HubLogin.tsx` 5).

## Cổng mới

- **Unit** `apps/dhcb/src/pages/core/AuthForms.a11y.test.tsx` (9 ca: Login đăng nhập/đăng ký,
  ResetPassword) và `apps/hub/src/pages/HubLogin.a11y.test.tsx` (6 ca): nhãn, autocomplete,
  aria-describedby (gợi ý không biến mất khi gõ, `minLength` vẫn 15), `role="alert"`,
  `aria-invalid` đúng ô, `aria-pressed`, logo-link `aria-label`.
  - **Đối chứng âm:** trả 3 file về bản `HEAD` thì **15/15 ca đỏ**.
- **E2E** `e2e/hub-reflow.spec.ts` (17 ca): hub `/` và `/login` không tràn ngang ở 320, 390, 559,
  560, 639, 640, 768px; logo-link có tên; nút "Đăng nhập"/"Bắt đầu" nằm trong khung 320px.
  - Hub là Vite app riêng, không nằm trong `webServer` của `playwright.config.ts`, nên spec tự
    dựng dev server hub bằng `createServer` của Vite (cổng tự chọn) — không sửa config, không
    thêm vào `e2e/mobile-layout-guards.spec.ts` (file đó đo thanh điều hướng đáy của app chính).
  - **Đối chứng âm:** trả `App.tsx` về `HEAD` thì **6/17 đỏ** (320, 390, 559, 560, 640px của `/` và
    ca nút trong khung 320px).

## Không làm / để đợt sau

- Hub: tiêu đề phụ ở `/login` vẫn ghi "năm trụ và mọi môn học" (ba trụ đã gỡ) và `DEFAULT_ALLOWED_ORIGINS`
  chưa có hub (audit mục 10) — việc nội dung/cấu hình, không thuộc U2.
- C4 các trang còn lại → U3; C5 ngôn ngữ trang → U4.

## Bằng chứng

- Typecheck (đã xoá `dist`) ✅ · Lint ✅ · Build ✅ · `test:coverage` — xem mô tả PR.
- Axe A/AA + wcag22aa trên hub `/` và `/login`, 3 theme × 1440/390px: **0 vi phạm** (trước đó
  `link-name` + `color-contrast`).
- E2E `a11y.spec.ts` + `a11y-aaa.spec.ts` + `landmark-title.spec.ts` lọc "login": 7/7 ✅.
- Tầng 8b (Blue sky), ảnh trước/sau:
  - Hub `/` 390px: trước, cụm nút "Đăng nhập · Bắt đầu" bị cắt khỏi khung; sau, nằm gọn ở góc
    phải header, chữ "Bắt đầu" tối đọc rõ trên nền sky.
  - Hub `/login` 390px: sau có nhãn "Email", "Mật khẩu" phía trên ô.
  - App `/login` 390px và 1440px: nhãn nhỏ trên từng ô; chế độ Đăng ký + gõ 1 ký tự: dòng "Mật
    khẩu tối thiểu 15 ký tự." vẫn hiện dưới ô (trước: luật biến mất cùng placeholder).
