# 0644 — Hủy TTS giữ đúng lượt phát qua tải lỗi và Web Speech

- **Ngày:** 2026-10-17 · **PR:** [#1410](https://github.com/seeker19110/dhcb/pull/1410) · **Loại:** `fix(voice)`.
- **Goal/spec:** [stored S06](../goals/2026-10-16-stored-upgrades.md),
  [S06 Approved](../specs/2026-10-16-stored-s06-voice-metrics.md), đã merge #1399.

## Vấn đề và thay đổi

Tải audio hoặc HTMLAudio.play có thể báo lỗi sau khi người dùng hủy hoặc chuyển lượt,
khiến câu cũ phát lại qua Web Speech. Callback Web Speech còn trả token toàn cục của
lượt mới, đọc tiếp phần giải thích hoặc cập nhật karaoke cũ.

Mỗi public speak không rỗng nay nhận một ticket trước mọi await. HTMLAudio/Web Speech
giữ nguyên ticket đó qua tải, phát và fallback. Callback trả ticket riêng; boundary và
public catch bỏ lượt đã hết quyền sở hữu. Nhờ claim sớm, câu cũ không thể chiếm vé của
câu mới còn đang tải. Empty không claim vé; lỗi tải/play đang active vẫn có fallback.

Public API, payload, cache/inflight/retry/provider/usage/database giữ nguyên. Không
abort/refund request đã gửi. Guard public catch chỉ hợp lệ sau khi bỏ self-increment
trong cả hai backend; chỉ thêm guard mà giữ double claim sẽ làm mất fallback hợp lệ.

## Kiểm chứng

- Test-first tại checkout thật: **13 unit đỏ, 9 đối chứng đạt**; Chromium **6 đỏ,
  2 đối chứng đạt**. Review độc lập tìm thêm khoảng hai tải A/B cùng pending: câu A
  resolve/reject/play-error trước B xong. Regression bổ sung **3 unit đỏ/22 controls**,
  Chromium **2 đỏ/8 controls** trước single claim. Không dùng crash làm oracle.
- Source cuối targeted **4 file/102 unit đạt** (2,90 giây), gồm 25 regression và 77
  test TTS cũ. Chromium **10/10**, hai chiều en→vi/vi→en, không retry (9,8 giây).
  Thin strict riêng ba file regression đạt. Đối chứng active fallback, empty và normal
  bilingual/feedback/karaoke giữ hành vi hợp lệ.
- Review độc lập trên đúng source có **29/29 probe đạt**, network violations 0;
  negative controls bản cũ và double claim đỏ đúng. Mock tại biên cache/HTTP/audio/Web
  Speech; module TTS thật, không provider có phí hoặc production data.
- Full local Node22 sau review: typecheck 92,42 giây, build 147,04 giây, lint 0 cảnh báo
  81,46 giây, format 99,18 giây; exit 0. **976 file/22.000 unit đạt**, 5 file/35 test skip
  sẵn có; Vitest 555,05 giây (npm wall 557,57 giây). Coverage **96,14/92,07/96,91/96,85%**,
  giữ sàn 94/90/94/94. Replay 7/7, specs 191 đạt.
- UI contract 6 file/173 test đạt; smoke TTS + Practice direction **22/22**, không retry
  (57,4 giây). Clean typecheck sau chỉ xóa generated dist đạt (95,61 giây). Năm file
  source/test giữ SHA qua toàn bộ gate, TTS
  `93e2ad177d5de58ba60c9ba212b32f71e71c12ef37de50cc316a32006ebe52c3`.
  CI exact head còn bắt buộc trước merge; số full gate source đầu chỉ giữ trong lịch sử goal.

CI head cũ 683d99ce lỗi ECR tại Initialize containers trước checkout; không rerun source
cũ vì finding P2 cần sửa. Không đổi image, workflow hoặc cổng để làm xanh.

## Rủi ro, giới hạn và rollback

Browser fixture nạp module qua Vite và giả lập HTTP/Web Speech. Không mount lifecycle
React, quan sát microphone hoặc âm thanh vật lý, không báo p50/p95. Chính sách dừng
audio khi chuyển backend giữ nguyên; không suy single claim thành hủy vật lý toàn pipeline.
Lỗi pending permission/STT completion sau unmount và instrumentation S06 là slice kế tiếp.
Rollback bằng revert PR; không migration hay thay đổi cấu hình/provider.
