# 0559 — Hội thoại CEFR: trần 5 lượt nộp sai/24 giờ theo (người, hội thoại) (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** (điền sau khi tạo) · **Loại:** `feat(cefr)`
- **Nguồn:** mục (2) nợ 🟡 `PROGRESS.md` "[sau changelog `0558`, rà bảo mật độc lập] Kiểm tra hiểu
  hội thoại CEFR: script vẫn TRA được đáp án…" — "đoán mò … vá được bằng trần số lần SAI theo
  (người, hội thoại)". Đặc tả `docs/specs/2026-10-09-hoi-thoai-cefr-seed-server-cap.md` §⑥
  (Approved for implementation). Mục (1) (tra `dialogues.json`) KHÔNG làm — đổi kiến trúc, chờ chủ
  dự án.

## Vấn đề

Sau `0558` người học (hoặc script) vẫn nộp bừa được 6 lượt/phút cho tới khi đạt. Đo lại trên
`dialogues.json` thật (139 hội thoại × 2 chiều × 20 seed = 5 560 đề): mọi đề 3 câu, số phương án
{2,4,4} (92 %) hoặc {2,3,4} (8 %), đạt ≥ 2/3 ⇒ đoán ngẫu nhiên đạt **25,0–29,2 % mỗi lượt** (trung
bình 25,3 %; con số "~16–26 %" ở đặc tả cũ ước sai) — vét cạn tự động đạt trong vài giây.

## Đã làm

1. **`packages/core-auth/security.ts`:** thêm `consumeWindowCounterCount` (INCR trả SỐ ĐẾM, hoặc
   `unavailable` ở production khi Redis hỏng) và `peekWindowCounter` (GET, không tăng; hết cửa sổ →
   0). `consumeWindowCounterStatus` nay gói `consumeWindowCounterCount` — hành vi cũ giữ nguyên (các
   test cũ không đổi một dòng). +3 test (Redis + Map).
2. **Hợp đồng `packages/core-contracts/cefrDialogueCheck.ts`:** hằng `DIALOGUE_FAIL_CAP_PER_DAY = 5`
   (comment ghi con số đo thật ở trên + vì sao 5), `attemptsLeft?: 0..5` trong
   `DialogueCheckResultSchema` (chỉ khi chưa đạt), mã lỗi `ATTEMPT_CAP`.
3. **Server `apps/server/src/api/_lib/cefrDialogueCheck.ts`:** khoá
   `cefr-dialogue-fail:<sha256(JSON[userId, ownerId, titleEn])>` (băm, không PII, KHÔNG theo chiều
   A/B), cửa sổ 24 giờ. **Mở lượt** chỉ đọc bộ đếm: ≥ 5 → 409 `ATTEMPT_CAP`. **Nộp:** sau khi tiêu
   khoá lượt, GIỮ CHỖ bằng INCR nguyên tử trước khi lộ đúng/sai; vượt trần → trả lại khoá lượt + chỗ
   giữ, 409 không kết quả; đạt → trả chỗ; chưa đạt → 200 kèm `attemptsLeft`. Bộ đếm không sẵn sàng
   → 503 `SERVICE_UNAVAILABLE` (fail-closed, cùng khuôn), trả lại khoá lượt. +10 test (5 lượt →
   `attemptsLeft` 4..0 rồi chặn mở; token cất sẵn nộp sau khi hết trần kể cả đúng → 409; 3 token nộp
   đồng loạt khi còn 1 lượt → đúng 1 lượt được chấm; đổi chiều không thêm lượt; khoá băm; 503).
4. **Client `apps/dhcb/src/lib/dialogueCheckClient.ts`:** outcome `attempt-cap` ở cả
   `startDialogueCheck` và `submitDialogueCheck`; `.strict()` từ chối `attemptsLeft` ngoài 0..5.
   +2 test.
5. **Màn `apps/dhcb/src/components/DialogueComprehensionCheck.tsx`:** chưa đạt → "Còn N lượt thử hôm
   nay" (B: "N tries left today", số ít "1 try"); hết lượt (mở bị chặn, nộp bị chặn, hoặc lượt chưa
   đạt thứ 5) → "Bạn đã thử sai 5 lần hôm nay với hội thoại này — đọc lại hội thoại, mai làm tiếp",
   **không** nút Làm lại/Thử lại/Gửi lại, "Xem lại hội thoại" thành nút chính. +5 test.
6. Tài liệu: đặc tả §⑥ mới + ⑤b sửa số đo; skill `pedagogy-linguistics-master` hai bản gương;
   `PROGRESS.md` mục (2) → ✅.

## Quyết định trong đợt

- **Giữ chỗ rồi trả chỗ** thay vì "tăng sau khi chấm không đạt": ròng lại giống hệt (chỉ lượt sai
  được đếm), nhưng INCR đi TRƯỚC khi lộ kết quả nên nhiều token cất sẵn nộp đồng thời không vượt
  trần được. Trả chỗ thất bại (Redis hỏng đúng lúc) chỉ làm một lượt đạt bị tính là sai — vô hại.
- **Không miễn người đã học**: làm lại sau khi đã học không được gì thêm; miễn thì tốn một lần đọc
  DB mỗi lượt mở.
- **Không theo chiều A/B**: "đã học" vốn theo (owner, tên), đổi chiều không được thêm lượt đoán.
- **Hằng ở gói hợp đồng**: server dùng để chặn, giao diện dùng để nói đúng con số.

## Không đổi (cố ý)

- Không migration, không biến môi trường mới, không thư viện mới. Khách (chưa đăng nhập) giữ luồng
  tại máy. Giới hạn 12 lượt mở/6 lượt nộp mỗi phút giữ nguyên.

## Giới hạn còn lại (ghi thật)

- Với 25–29 %/lượt, đoán mò vẫn đạt **~77 % trong 5 lượt một ngày** (76–82 % tuỳ đề). Không trần nào
  ≥ 1 hạ được dưới một lượt đơn; trần này chặn vét cạn tự động và buộc người sai liên tục dừng lại
  đọc hội thoại, không làm đoán mò bất khả. Muốn mạnh hơn phải đổi đề (thêm câu/phương án).
- Mục (1) — tra đáp án từ `dialogues.json` — vẫn mở, chờ chủ dự án quyết.

## Tầng 8b — nhìn trang thật (ảnh chụp, đã xem từng ảnh)

Trang thật `/goc-hoc-tap/english/lo-trinh/a1?unit=a1-greetings&hd=dialogue:…` (dev server Vite,
đăng nhập giả bằng `e2e/helpers/auth.ts`, API `cefr-dialogue-start`/`cefr-dialogue` mock bằng
`page.route` với đề thật dựng từ `dialogues.json`). 1440px + 390px × `blue-sky` + `dark-blue`, mỗi
ca một ảnh toàn trang + một ảnh khung nhìn sau khi cuộn tới khối kết quả + một ảnh riêng khối kết
quả (60 ảnh; spec/config/ảnh tạm đã xoá):

| Ca                                    | Chiều | Thấy trong ảnh                                                                                       |
| ------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------- |
| (a) nộp không đạt, `attemptsLeft = 3` | A, B  | "Còn 3 lượt thử hôm nay." / "3 tries left today."; nút Làm lại (chính) + Xem lại hội thoại           |
| (b1) không đạt ở lượt thứ 5 (`= 0`)   | A     | "Đúng 1/3 — chưa đạt (cần 2)" + "Bạn đã thử sai 5 lần hôm nay…"; CHỈ nút "Xem lại hội thoại" (chính) |
| (b2) 409 `ATTEMPT_CAP` lúc nộp        | A     | "Chưa chấm được lượt này" + lời nhắn hết lượt; CHỈ nút "Xem lại hội thoại", không Gửi lại/Làm lại    |
| (c) 409 `ATTEMPT_CAP` lúc mở lượt     | A     | "Hôm nay đã hết lượt thử hội thoại này" + lời nhắn; CHỈ nút "Xem lại hội thoại", không có đề         |

- Không tràn ngang ở cả 20 tổ hợp (spec tạm kiểm `scrollWidth ≤ bề rộng` trước khi chụp); chữ xuống
  dòng gọn ở 390px; tương phản chữ/nút đọc rõ ở cả hai theme. Danh sách nút trong khối kết quả đọc
  bằng máy khớp bảng trên ở mọi tổ hợp.
- **Đã sửa:** ca (b2) — các câu hỏi vẫn bấm đổi được dù không còn nút nộp nào (gợi ý sai thao tác).
  Nay hết lượt thì khoá câu hỏi (`locked` gồm `outOfTries`, fieldset `disabled`); test màn thêm câu
  kiểm mọi radiogroup bị khoá; chụp lại (b2) ở 390 cả hai theme — ô chọn đã xám.
- Ghi nhận, KHÔNG thuộc đợt này: thẻ nổi "Đang đồng bộ dữ liệu (1 mục)…" hiện ở môi trường mock (hàng
  đợi đồng bộ "đã xem" không có backend thật) — có từ trước, không liên quan trần lượt sai.

## Bằng chứng

Xem mô tả PR: typecheck/lint/prettier/check:specs + vitest liên quan.
