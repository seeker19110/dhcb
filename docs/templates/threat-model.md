# Khuôn MÔ HÌNH MỐI ĐE DOẠ (threat model)

> Thêm 2026-10-12 (changelog `0622`, từ `THREAT-MODEL.template.md` của `seeker19110/project-template`,
> chỉnh cho DHCB). **Khi nào dùng:** đặc tả (`docs/templates/dac-ta-tinh-nang.md`) chạm auth · thanh toán
> SePay · đếm lượt AI · dữ liệu cá nhân · quyền Companion — đúng nhóm "PHẢI dừng và hỏi" ở CLAUDE.md §12.
> Điền thành một mục `## Mô hình mối đe doạ` ngay trong đặc tả đó (không tạo file riêng), rồi giao
> `security-reviewer` rà theo bảng này. Việc không chạm nhóm trên thì KHÔNG cần khuôn này.

## 1. Tài sản và ranh giới tin cậy

<!-- Thay đổi này chạm tài sản nào? Gạch những dòng không liên quan. -->

- Dữ liệu người dùng (hồ sơ, lịch sử học, ký ức Companion, ghi chú) — Postgres, KHÔNG có RLS: mọi truy
  vấn tự lọc `user_id` lấy từ token (`validateAuth()`).
- Tiền: gói VIP qua SePay (`packages/core-billing/plan.ts`); lượt AI/ngày (hạn mức Free cấu hình ở `/admin`).
- Chi phí API AI (Claude · Groq · Gemini · Google TTS · Whisper) — mỗi lượt gọi là tiền thật.
- Quyền admin (`ADMIN_USER_IDS`, `packages/core-auth/adminAuth.ts`).
- Secret + khoá mã hoá (`docs/van-hanh-khoa-ma-hoa.md`); audio cache trên R2.

**Ranh giới:** trình duyệt (không tin) → Nginx/Cloudflare → Express `apps/server` → Postgres/Redis/R2 →
nhà cung cấp AI/SePay (bên thứ ba). Đánh dấu ranh giới nào thay đổi này đi qua.

## 2. Mối đe doạ

| ID  | Kịch bản lạm dụng (ai làm gì) | Tài sản / ranh giới | Khả năng (T/V/C) | Tác hại (T/V/C) | Hàng rào + test canh | Rủi ro còn lại |
| --- | ----------------------------- | ------------------- | ---------------- | --------------- | -------------------- | -------------- |
| T1  |                               |                     |                  |                 |                      |                |

Rà đủ các họ dưới đây; họ nào "không áp dụng" thì ghi một dòng lý do, đừng bỏ trống:

- **Giả danh / vượt auth** — token người khác, đoán id trong URL, vào `/admin`.
- **Đọc chéo dữ liệu** — handler quên lọc `user_id` (không RLS nên không có lưới thứ hai).
- **Sửa dữ liệu / tiền** — webhook SePay giả, gửi lại (replay), hai request song song cùng nâng gói.
- **Đốt chi phí** — gọi AI vượt hạn mức, đếm lượt **fail-open** khi Redis/CSDL rớt, file STT lớn.
- **Prompt injection / output AI không an toàn** — chữ người dùng đổi vai AI, lộ system prompt, AI trả
  link/HTML lạ (`docs/ops/ai-eval-red-team.md`).
- **Lộ qua log / lỗi** — secret, token, nội dung riêng tư trong log, Sentry, thông báo lỗi trả client.
- **Từ chối dịch vụ** — request nặng không trần, truy vấn không chỉ mục.
- **Chuỗi cung ứng** — gói npm mới, action CI mới (`docs/ops/supply-chain.md`).

## 3. Tiêu chí an toàn (đưa vào ô ④ của đặc tả, mỗi dòng một test)

- [ ] Test ÂM về quyền: user A gọi bằng id của user B → 403/404, không lộ dữ liệu.
- [ ] Input ngoài validate bằng Zod tại server; output AI không render như HTML.
- [ ] Đếm lượt / tiền: nguyên tử + idempotency; Redis/CSDL rớt ⇒ **từ chối** (fail-closed), có test.
- [ ] Không secret / dữ liệu riêng tư trong log; lỗi trả client không kèm stack.
- [ ] Phát hiện + khôi phục: sự cố loại này thuộc SEV mấy (`docs/ke-hoach-khoi-phuc-su-co-server.md` 1b)?

**Người duyệt / ngày / xem lại khi:**
