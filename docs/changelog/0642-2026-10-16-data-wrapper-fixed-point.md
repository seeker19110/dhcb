# 0642 — Giữ thẻ bọc dữ liệu ổn định sau khi xóa thẻ giả

- **Ngày:** 2026-10-16 · **PR:** [#1407](https://github.com/seeker19110/dhcb/pull/1407) · **Loại:** `fix(companion)`.
- **Goal/spec:** [stored S04c](../goals/2026-10-16-stored-upgrades.md),
  [S04 Approved](../specs/2026-10-16-stored-s04-injection-stream.md), merge #1399.

## Lỗi và thay đổi

Một lần replace có thể xóa thẻ ở giữa rồi ghép phần còn lại thành thẻ dữ liệu mới.
Context active nonce và tool result nay xóa tới fixed point với matcher riêng hiện hữu.
Tối đa32 deletion passes và một stable check; nếu còn thay đổi, bỏ content context nhưng
vẫn giữ wrapper, hoặc trả literalJSONnull cho tool. Không trả remainder chưa ổn định.

Không đổi matcher/nonce scope, UUID/fence/HTML policy, object được persist, tool permissions,
consent, authority hoặc usage. JSON serialize và cap4000+ellipsis giữ behavior bình thường.
Đây là robustness với nonce biết trước trong fixture, không bằng chứng model bị chiếm quyền.
Cap32 giới hạn số pass, không CPU/input/memory; regex cost overlap hiện hữu chưa sửa.

## Kiểm chứng

- Actual checkout main46ff9437: public API regression19 đỏ/10 xanh,29 ca đều chạy;
  source cũ sai behavior, không thiếu module. Parent review patch/test trước integration.
- Sau patch7 file/198 test đạt (9,81s), gồm29 public wrappers cùng prompt/tools/guard/
  final/runtime/registered HTTP. Codemap prompt26/tools28 trước edit.
- Full local Node22: build/type/lint0 cảnh báo/format exit0;963 file/21.676 test pass,35 skip
  sẵn có,362,49s; coverage96,13/92,05/96,91/96,83%, giữ sàn. Replay7/7/specs191 và browser8/8
  (9,3s) đạt. Typecheck checkout sạch sau xóa generated dist exit0 (83,04s); CI exact head còn bắt buộc.
- Không PG/provider/production trong slice wrapper;
  corpus authority PG và runtime/browser gates riêng vẫn cần trước kết luận S04 hoàn tất.

## Rollout và rollback

Không migration, dependencies hoặc provider mới; revert PR để rollback. Vượt32 lớp có thể
mất dữ liệu trong block gửi model theo failclosed, không sửa dữ liệu lưu. Không bật trace.
