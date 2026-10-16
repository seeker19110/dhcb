# 0639 — Lọc lời văn Companion trước khi phát stream

- **Ngày:** 2026-10-16 · **PR:** chưa mở · **Loại:** `fix(companion)`.
- **Goal/spec:** [stored S04b](../goals/2026-10-16-stored-upgrades.md),
  [S04 Approved](../specs/2026-10-16-stored-s04-injection-stream.md), đã merge #1399.

## Lỗi và thay đổi

Delta từng tới client trước khi finalize loại markup/UUID; không thể thu hồi chữ đã phát.
Phép xóa một lượt còn ghép lại thành thẻ nội bộ mới. Guard câu hỏi cũ nuốt cả literal inline
và tên có suffix Extra, nhưng bỏ lọt header có spaces/tabs mà parser nhận ra; parser chỉ gỡ
khối đầu nên JSON khối sau có thể xuất hiện trở lại ở `done.reply`.

Guard chung giữ suffix còn mơ hồ trước khi phát, ổn định markup rồi mới xét biên ASCII UUID.
Tag đã chắc là nội bộ được discard đến dấu đóng, không giữ attributes. Phần chưa quyết định
bị chặn ở 256 ký tự/16 frame; vượt trần bỏ pending và lời văn còn lại. EOF bình thường có thể
nhả literal chưa thành mẫu; lỗi/fallback abort pending và không nối với bản dự phòng.
Đây là giới hạn riêng của guard, không phải backpressure/bộ nhớ toàn SDK hay hàng đợi.

Parser và guard fence dùng cùng grammar đầu dòng, đúng nhãn, spaces/tabs, LF/CRLF. Theo
prompt khối luôn đứng cuối, lời văn dừng tại header reserved đầu tiên; bộ questions đầu
hợp lệ vẫn giữ ID. ID/cấu trúc actions/questions/context không bị quét như lời văn.
False-save/language check vẫn ở finalize; không thay authority, usage, provider, migration
hoặc dependency. Không gọi model trả phí và không dùng dữ liệu production.

## Kiểm chứng

- Đỏ trước sửa: 8 lỗi/91 ca xanh qua ba file. Sau wire: 143 test/5 file xanh.
- Mọi cut point/từng ký tự; canary oracle độc lập trên từng accumulation đã emit;
  composition, ASCII boundaries, inline/Extra/code/math, EOF/abort/fallback, idempotence,
  chunk lớn, attrs1MiB, state cap, lifecycle và finite diagnostics.
- Route HTTP đăng ký thật/runtime/SDK với provider/auth/DB/usage giả: prefix tới trước EOF,
  lời văn không chứa canary, metadata/question ID còn nguyên; side effects giữ như trước.
  Browser fixture shared guard qua bridge production/dev thật, không route.fulfill.
- Browser cuối 8/8 đạt: prefix trước EOF và hai đối chứng cố tình đệm chữ bị từ chối
  đúng tại checkpoint. Review P2 oracle đã đóng; source không finding mở.
- Node22: build/typecheck/lint (0 cảnh báo)/format:check exit0;
  `npm test -- --coverage --maxWorkers=2` exit0: 961 file/21.614 test pass,
  5 file/35 test skip sẵn có, 477,90s. Coverage 96,13/92,04/96,91/96,84%,
  giữ sàn 94/90/94/94. Guard riêng 46/46 đạt.
- Replay provider 7/7, check:specs 191 đạt; không external provider call.
  CI quality/e2e/metadata trên head PR cuối vẫn bắt buộc trước merge.

## Rollout và rollback

Áp dụng cho lời văn Companion, không migration hoặc flag mới. Revert PR để rollback.
Corpus context/tool authority trên Postgres ở slice S04 tiếp theo. Fixture tất định không
chứng minh chất lượng model mới; chưa đo delivery qua Nginx/Cloudflare hoặc acoustic voice.
