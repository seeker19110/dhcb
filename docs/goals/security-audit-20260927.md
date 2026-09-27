# Goal: Khắc phục audit bảo mật ngày 2026-09-27

| Thuộc tính        | Giá trị                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| Goal ID           | GOAL-2026-SEC-0927                                                           |
| Owner             | Chủ repo dhcb; Codex triển khai                                              |
| Trạng thái        | WAITING                                                                      |
| Bắt đầu           | 2026-09-27                                                                   |
| Target review     | 2026-09-27                                                                   |
| Quyền được cấp    | Audit, sửa mã, nhánh local và kiểm thử; chưa push/merge/deploy               |
| Budget/guardrails | Không gọi provider trả phí, không dữ liệu/secret production, không migration |

## 1. Outcome và Definition of Goal Complete

Chặn các đường vượt quyền, cấp quyền lợi từ dữ liệu không tin cậy, chạy mã học viên thiếu cách ly,
lộ session và vượt quota đã xác định trong audit. Mỗi đường sửa phải có regression test cả nhánh
từ chối lẫn luồng hợp lệ; các cổng build/typecheck/lint/format/unit phải đạt. E2E và kiểm tra DB
thật cần ghi đúng giới hạn môi trường, không thay thế bằng số test cũ.

Mốc nền: main `896626a58b8f6f9640d5af875c7cb19cbe036c98`, PR #1189 đã merge. Đích của lượt
được ủy quyền này là bản vá local kiểm chứng được; phát hành production là milestone riêng.

## 2. Scope và non-goals

- Phạm vi: F01–F12; các phần F13 liên quan Origin/CSRF, Redis, mật khẩu và CSP cơ bản.
- Không thực hiện khai thác production, tạo sandbox mới, đổi schema, tự cấp bù quyền lợi lịch sử.
- Không tuyên bố sandbox đã được cách ly: tạm đóng các runtime chưa có ranh giới an toàn.

## 3. Milestones và slices

| ID  | Outcome/AC                                                      | State   | Evidence                                          |
| --- | --------------------------------------------------------------- | ------- | ------------------------------------------------- |
| S1  | Chặn grader không cách ly; gate trước compute; giữ outbox       | DONE    | completionSandboxServer/progress/syncOutbox tests |
| S2  | Admin ID; OAuth không auto-link; cookie-only; email/TOTP atomic | DONE    | core-auth và admin tests                          |
| S3  | Gemini owner/quota; TTS paid miss quota + breaker               | DONE    | core-ai và gemini-live tests                      |
| S4  | Chỉ bằng chứng tin cậy cấp VIP; referral atomic                 | DONE    | rewards/history/evidence tests                    |
| S5  | CSRF trung tâm; Redis production đóng khi lỗi; runbook          | DONE    | security/browser/redis và routes.csrf tests       |
| S6  | Local gates và review diff                                      | DONE    | Build/typecheck/lint/unit PASS; E2E chờ Chromium  |
| S7  | Review, CI, rollout và smoke staging/production                 | WAITING | Cần quyền phát hành và môi trường                 |

## 4. Risk register

| Risk                           | Trigger/guardrail                 | Mitigation/rollback                                                  | Owner      | State |
| ------------------------------ | --------------------------------- | -------------------------------------------------------------------- | ---------- | ----- |
| Grader tạm dừng nhiều bài      | 606/685 bài trong registry        | Vẫn đọc/luyện browser; outbox giữ dữ liệu; chỉ mở lại khi có sandbox | Maintainer | OPEN  |
| Admin bị mất quyền sau rollout | Thiếu ADMIN_USER_IDS              | Xác minh ID thật trước deploy, không dùng email fallback             | Operator   | OPEN  |
| Redis lỗi gây từ chối request  | Redis không ready                 | Kiểm tra PING và cảnh báo; phục hồi Redis                            | Operator   | OPEN  |
| Browser/cookie tương thích     | Backend/client phải cùng contract | Smoke OAuth/SSO/logout/admin trước phát hành                         | Maintainer | OPEN  |
| Sai entitlement từ quá khứ     | Thiếu ledger cấp thưởng cũ        | Đối soát riêng, không tự suy đoán cấp bù                             | Owner      | OPEN  |

## 5. Current truth

- Main đã đối chiếu đúng SHA nền ở trên; nhánh `fix/security-audit-20260927`.
- Bản vá đã ghép xong trên nhánh local để review; chưa có thay đổi remote.
- E2E thử chạy nhưng thiếu binary Chromium trong môi trường; không có kết quả E2E đạt.
- Quyền còn cần nếu phát hành: push/PR/merge/deploy. Không cần thêm quyền để hoàn tất bản vá local.

## 6. Iteration log

### Iteration 1 — 2026-09-27

- State: DONE.
- Người dùng yêu cầu sửa ngay sau audit, xác định đây là sửa lỗi bảo mật hiện có.
- Chốt contract admin theo user ID, auth response không token, paid voice dùng quota speaking.
- Chọn đóng grader rủi ro và phần thưởng chưa có bằng chứng, thay vì dựng hệ thống mới trong bản vá.
- Validation: build/typecheck/lint/format PASS; 18.154 test PASS, 2 skip (773 file PASS/1 skip).
  E2E thiếu Chromium; chi tiết tại runbook và changelog0464.

## 7. Final audit

- [x] Bản vá local có gate được thực thi và giới hạn E2E ghi chính xác.
- [x] Review diff và cập nhật runbook/rollback.
- [ ] E2E trên môi trường có Chromium; integration PostgreSQL/Redis staging.
- [ ] Review/CI/merge và production verification nếu được cấp quyền.

**Kết luận:** NOT COMPLETE ở mức phát hành; bản vá local đã kiểm chứng; E2E/visual/staging còn chờ môi trường.
