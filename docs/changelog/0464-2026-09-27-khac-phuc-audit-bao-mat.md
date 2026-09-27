# 0464 — Khắc phục audit bảo mật (2026-09-27)

Trạng thái: bản vá local trên `fix/security-audit-20260927`, chưa push/merge/deploy.
Nền: `896626a58b8f6f9640d5af875c7cb19cbe036c98` (main sau PR #1189).

- F01/F02: đóng server grader thiếu cách ly, kiểm quyền/admission trước compute; chia batch và giữ
  code trong outbox khi bảo trì. 606/685 bài tạm dừng chấm, 79 mô phỏng còn dùng được.
- F03–F06: admin theo ID, không auto-link OAuth bằng email, session chỉ trong cookie HttpOnly,
  marker UI không bí mật, redirect origin chính xác, kiểm OAuth state, mật khẩu mới 15 ký tự.
- F07/F08: ownership và ID server cho Gemini, quota chung REST/WS/TTS miss, Origin/payload/idle/
  revalidation và dọn tài nguyên; không lộ lỗi chứa URL upstream.
- F09/F12: thanh toán không xác minh email, mã gắn user/email và lock giao dịch, TOTP CAS chống replay.
- F10/F11: lịch sử/click không cấp VIP; referral + cả hai grants nguyên tử, retry an toàn; giao diện
  thể hiện đúng các phần thưởng đang tắt.
- F13 một phần: CSRF tại adapter HTTP; Redis production đóng khi thiếu bộ đếm chung; cookie lỗi
  không gây500; CSP cấm object/base/form ngoài origin. Cập nhật hướng dẫn triển khai.

Không thay schema và không tác động dữ liệu production. Các trường hợp lỗi dùng mock/provider giả;
không chạy payload sandbox escape hay gọi provider trả phí.

Kiểm chứng cuối: build/typecheck/lint PASS, **18.154 test PASS**, 2 skip; 773 file PASS,
1 skip. Format PASS; xem
[runbook](../security-rollout-2026-09-27.md#kết-quả-kiểm-chứng).

Cần trước phát hành: Chromium E2E + visual 390/1440 px, integration PostgreSQL/Redis staging,
review và cấu hình `ADMIN_USER_IDS`/Origin/Redis. E2E trong môi trường hiện tại dừng ở global setup
vì thiếu browser binary, không phải kết quả đạt. Sandbox riêng, CSP chặt toàn bộ, bắt buộc MFA admin,
phân trang lịch sử và đối soát trạng thái cũ vẫn là các việc tiếp theo.
