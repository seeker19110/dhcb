# 0644 — Hủy TTS giữ đúng lượt phát qua tải lỗi và Web Speech

- **Ngày:** 2026-10-17 · **PR:** [#1410](https://github.com/seeker19110/dhcb/pull/1410) · **Loại:** `fix(voice)`.
- **Goal/spec:** [stored S06](../goals/2026-10-16-stored-upgrades.md),
  [S06 Approved](../specs/2026-10-16-stored-s06-voice-metrics.md), đã merge #1399.

## Vấn đề và thay đổi

Tải audio có thể báo lỗi sau khi người dùng đã hủy hoặc chuyển lượt. Catch ngoài cùng
trước đây vẫn chuyển sang Web Speech, làm câu cũ phát lại. Catch tại quãng tải nay trả
vé cũ khi đã bị thay thế; lỗi của lượt đang hoạt động vẫn giữ giọng dự phòng.

Web Speech trước đây trả token toàn cục khi callback kết thúc, nên lượt song ngữ cũ có
thể nhận vé mới và đọc tiếp phần giải thích. Mỗi lượt Web Speech nay claim ticket trước
cancel, trả ticket riêng khi kết thúc và bỏ callback karaoke đã hết quyền sở hữu.

Public API, payload HTTP, cache/inflight/retry, provider, usage và database không đổi.
Không chặn public catch bằng token trước tải: HTMLAudio tự tăng token khi nhận thẻ phát,
lỗi play đang active vẫn phải chuyển giọng dự phòng.

## Kiểm chứng

- Trước sửa tại checkout thật: **13 unit đỏ, 9 đối chứng đạt**; browser **6 đỏ, 2 đối
  chứng đạt**. Lỗi là phát/feedback/karaoke không mong muốn, không phải crash.
- Sau sửa: **99/99 unit** (4 file, 2,78 giây), gồm 22 regression và 77 test TTS cũ;
  **8/8 Chromium** hai chiều en→vi/vi→en, không retry (7,5 giây).
- Deferred cache/HTTP errors, cancel qua onend/onerror, đổi lượt, boundary cũ, delayed
  HTMLAudio.play reject đều được kiểm; đối chứng active error và đọc song ngữ bình thường
  vẫn đạt. Mock tại biên, module TTS thật; không provider có phí hoặc production data.
- Full local Node22: build/typecheck/lint (0 cảnh báo)/format đạt. **976 file/21.997
  unit test đạt**, 5 file/35 test skip sẵn có; Vitest 538,83 giây (npm wall 541,25 giây).
  Coverage **96,14/92,07/96,91/96,85%**, sàn 94/90/94/94 giữ nguyên. Replay 7/7 và
  specs 191 đạt. Thin strict riêng ba file regression đạt.
- check:ui-ux 6 file/173 test đạt. Smoke TTS + Practice direction **20/20**, không retry
  (59,0 giây); clean typecheck sau chỉ xóa generated dist đạt (94,82 giây). Năm file
  source/test giữ SHA qua toàn bộ gate. CI exact head còn bắt buộc trước merge.

## Rủi ro, giới hạn và rollback

Browser fixture nạp module qua Vite và giả lập HTTP/Web Speech. Không mount lifecycle
React, không quan sát microphone hoặc âm thanh vật lý, không báo p50/p95. Lỗi pending
permission/STT completion sau unmount và instrumentation S06 vẫn là slice kế tiếp.
Rollback bằng revert bản sửa; không migration hay thay đổi cấu hình/provider.
