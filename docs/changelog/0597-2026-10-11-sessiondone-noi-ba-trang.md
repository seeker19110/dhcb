# 0597 — Nối màn kết `SessionDone` vào Challenge, bài Lập trình và bài STEM

- **Ngày:** 2026-10-11 · **PR:** (xem mô tả PR) · **Loại:** `feat(home)`
- **Đặc tả:** `docs/specs/2026-09-17-redesign-trang-chu-thi-hanh.md` §P1-6 (Approved for
  implementation), mục "Nơi gọi". Chủ dự án chốt "Làm luôn theo đặc tả" ngày 2026-10-10.
- **Nối tiếp:** changelog `0595` (test nghiệm thu AC-3/4/7 ở `TodayLesson`).

## Vấn đề

P1-6 quy định mọi hoạt động học kết thúc bằng MỘT màn kết `SessionDone`. Đến đợt này mới chỉ có
`TodayLesson` gọi màn kết. Ba trang còn lại kết thúc theo cách riêng:

- Challenge bật một `Celebration` riêng khi đủ "tuần 7/7".
- Bài Lập trình và bài STEM không có màn kết.

## Đã làm

- **`useSessionDone` (mới, `lib/session/`):** quản trạng thái overlay cho trang có một điểm kết thúc.
  - Kết quả phiên được chép vào `sessionStorage` theo từng nội dung. Nhờ vậy F5 với `?xong=1` mở
    lại ĐÚNG số liệu thật. Trước đây sau khi tải lại trang, kết quả chấm đã mất khỏi bộ nhớ.
  - `?xong=1` mồ côi (link chia sẻ, tab khác, nội dung khác) không mở màn mừng rỗng; hook chỉ dọn
    query.
- **`SessionDone`:** thêm hai prop tùy chọn.
  - `closeLabel`: nút chính chỉ ĐÓNG overlay thì không hứa "Về trang chủ".
  - `milestone`: mốc riêng của trang, hiện ở tầng (2) trong cùng một hộp thoại.
- **Bài STEM:** lượt nộp ĐẠT mở màn kết "đúng x/y câu"; lượt chưa đạt thì không.
  - Đóng overlay → nhảy xuống màn kết quả chi tiết.
  - Nhãn nút là "Xem kết quả"; sau F5 đổi thành "Tiếp tục" vì màn chi tiết không phục hồi.
  - CTA phụ: ôn thẻ STEM của môn.
- **Bài Lập trình:** đạt bài Make lần đầu trong lần mở bài thì mở màn kết; chấm lại không bật lần
  hai.
  - "Sự thật" đếm số bước đã làm THẬT: Dự đoán và Xếp code bị bỏ qua thì không đếm.
  - Nút "Tiếp tục bài" → bước "Về nhà".
- **Challenge:** nộp xong mở màn kết.
  - Ghi âm/quay video: đếm số câu. Gõ chữ: một đoạn.
  - "Tuần trọn vẹn 7/7" nay là `milestone` trong cùng hộp; đã bỏ `Celebration` riêng.
  - Nút "Xem nhận xét".
  - Hàm thuần `challengeSessionOutcome`/`countSentences` có test.

## Quyết định

- **Ba trang không bật tầng streak/mục tiêu tuần:** chúng không ghi "ngày có học"
  (`markStudiedToday` chỉ có ở luồng tiếng Anh). Bật tầng đó ở đây là mừng thứ phiên này không tạo
  ra.
- **Mốc 7/7 không sống qua F5:** sau khi tải lại, overlay chỉ còn tầng (1). Đây là cùng cách
  `TodayLesson` xử lý streak/tuần.
- **Không đổi nhãn ở `TodayLesson`:** nhãn "Về trang chủ" ở đó thật ra chỉ đóng overlay. Đã ghi vào
  PROGRESS để chủ dự án chọn nhãn.

## Bằng chứng

- **Unit (tổng 15 ca mới):**
  - `useSessionDone`: 7 ca (mở/đóng, F5, mồ côi, khác nội dung, steps 0, dữ liệu hỏng, đổi nội
    dung).
  - `SessionDone`: 2 ca (`closeLabel`, `milestone` trong cùng một dialog).
  - STEM tích hợp: 2 ca (đạt → 1 dialog "đúng 3/3 câu", đóng → về kết quả; chưa đạt → 0 dialog).
  - Lập trình tích hợp: 1 ca (đạt → 1 dialog "3 bước", "Tiếp tục bài" → `#done`, chấm lại → 0).
  - `challengeSessionOutcome`: 3 ca.
- **E2E và a11y (chạy ở máy, các spec bị ảnh hưởng):** 520/522 đạt, gồm `a11y.spec.ts` và
  `a11y-aaa.spec.ts`.
  - `programming-lesson.spec.ts:18` đỏ vì overlay che nút "Về nhà". Đã sửa test theo luồng mới:
    kiểm hộp thoại "hoàn thành 5 bước" + `?xong=1`, bấm "Tiếp tục bài" rồi mới tới bước Về nhà.
  - `programming-lesson.spec.ts:296` (xem trước DOM) đỏ khi chạy cả loạt, đạt khi chạy riêng
    (6,8 giây). Test này không chạm mã đợt này.
- **Tầng 8b:** ảnh 1440px + 390px trước/sau cho bài Lập trình và bài STEM. Overlay cùng khuôn
  với `TodayLesson`, nút chính đủ 44px, chữ không tràn ở 390px.
