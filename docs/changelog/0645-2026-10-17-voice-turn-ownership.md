# 0645 — Giữ đúng lượt thu âm, xác nhận và trả lời khi đổi phiên

- **Ngày:** 2026-10-17 · **Loại:** `fix(voice)`.
- **Goal/spec:** [stored](../goals/2026-10-16-stored-upgrades.md),
  [S06 Approved](../specs/2026-10-16-stored-s06-voice-metrics.md), đã merge #1399.

## Vấn đề và thay đổi

Quyền micro có thể được cấp sau khi người học đã rời trang. Kết quả nhận diện cũ có thể
khởi phát câu trả lời sau khi đổi phòng; nút Dừng ở Web Speech lại xóa kết quả cuối.
Mỗi lượt nay giữ owner riêng xuyên permission, ghi âm, xác nhận, AI và phát giọng nói.
Ref đồng bộ chặn thao tác lặp; cleanup vô hiệu owner trước khi đóng tài nguyên. Callback,
timer và finalizer chỉ tác động đúng owner của mình, kể cả sau StrictMode setup/cleanup.

Server STT thêm signal/predicate nội bộ; stop dùng chung promise. Hủy trước upload chặn
encode/auth continuation, nhả tracks trước constructor/start khi permission về muộn.
Sau fetch giữ timeout và receipt thật: Speaking ghi đúng lượt cho user gốc cả khi kết
quả rỗng, rồi mới bỏ continuation đã cũ; EMPTY chưa upload không tính lượt. Web Speech
phân biệt cancel mặc định với complete ở nút Dừng, giữ ref tới kết thúc để cleanup vẫn thắng.

Speaking dọn capture/confirm khi đổi phòng, đổi chiều học, tài khoản hoặc phiên đăng nhập;
AI phản hồi/gõ tay thay capture cũng reset trạng thái ghi/nhận diện. Timer hoặc nút Dừng
phải dọn owner đã hết hạn thay vì chỉ bỏ callback và để micro mở. Playback có vé riêng
để finalizer cũ không tắt trạng thái lượt mới.

Marker phiên là cờ lifecycle không bí mật của client, không thay auth/server authority.
Kiểm trước/sau auth await ngay trước HTTP; predicate lỗi hủy bằng AbortError, không báo
nhầm lỗi mạng. Khi request đã gửi, giữ response/persistence/usage hiện hữu. Kết quả AI cũ
vẫn lưu cục bộ cho tài khoản gốc nhưng không đẩy lịch sử bằng cookie phiên mới. Đồng bộ
sổ lỗi có guard xuyên debounce/auth/response; marker unknown giữ local, task stale không
xóa lịch sync hợp lệ. Chữ ký cũ mặc định giữ tương thích.

Companion khởi tạo lại state khi tài khoản/phiên đổi, xóa hội thoại, consent UI và đề
xuất đã render của account trước. Hủy voice trước fetch chặn cả request AI; sau fetch
vẫn giữ reply/loading và không TTS như policy hiện hành.

Quick prompt dùng một intent chứa scope đích, gửi sau khi domain đã commit. Điều này tránh
request vừa khởi phát bị chính việc đổi domain hủy; privacy cleanup không bị trì hoãn.

## Kiểm chứng

Validation cuối ngày 18/10 trên base main 54590ead: 988 file/22.152 unit đạt,
5 file/35 test skip sẵn có; coverage statements/branches/functions/lines
96,16/92,10/96,94/96,87%, giữ nguyên sàn. Build/typecheck/lint 0 warning/format, replay 7/7 và Approved specs 191 đạt.
UI contract 173/173; Chromium 47/47, retry 0, gồm hai chiều thoại/TTS/Practice và AA/AAA
hai trang trên ba theme. Clean typecheck sau chỉ xóa generated dist đạt 101,59s.
14 test/helper artifacts strict với 744 source/declaration files đạt; page implementation facade,
whole-app typecheck riêng đã đạt. 25 source/test hashes giữ nguyên xuyên 10 gate cuối.

Test-first và review độc lập được ghi trong goal. Đối chiếu ảnh trước/sau 1440×1000 và 390×844:
không có hồi quy bố cục; snapshot tắt animation để tránh frame chuyển màu 150ms. Lượt chụp 1280
đặt tên 1440 và gate ở base cũ được giữ riêng, không dùng làm bằng chứng bản cuối.
CI exact-head quality/e2e/metadata và artifact thật còn bắt buộc trước merge.

## Rủi ro, giới hạn và rollback

Không đổi server DTO, database, transport, model/provider, retry/refund hoặc cổng usage.
Không gọi provider có phí hay dùng dữ liệu production. Browser/media/HTTP fixtures kiểm
client ownership; không chứng minh cookie/DB integration, quyền micro hệ điều hành hoặc
âm thanh vật lý. Không báo latency p50/p95 từ đồng hồ giả. Metrics S06 và benchmark S05
vẫn là slice tiếp theo. Rollback bằng revert PR, không migration/cấu hình mới.
