# 0605 — Trang cấp CEFR (mobile): mở màn con về đầu, đóng thì danh sách về chỗ cũ

- **Ngày:** 2026-10-11 · **PR:** (xem mô tả PR) · **Loại:** `fix(english)`
- **Nguồn việc:** mục "Còn mở" (4) của nợ Tầng 8 trong `PROGRESS.md` — lộ ra ở Tầng 8b của
  `0603`: ảnh thẻ từ 390 px lệch ~96 px giữa trước/sau.

## Chẩn đoán

Trang cấp CEFR không có nhánh nào xử lý vị trí cuộn khi đổi giữa danh sách và màn con (vòng từ
vựng · bài ngữ pháp · hội thoại · bài thi), nên hành vi phụ thuộc vào chuyện ngẫu nhiên:

- **Trước 0603:** giữ nguyên `scrollY` của danh sách. Bấm một vòng ở cuối danh sách thì thẻ từ mở
  ra lưng chừng, phần đầu thẻ (tên vòng, nút "Quay lại") nằm khuất phía trên.
- **Từ 0603 (màn con nạp lười):** lần mở ĐẦU về đầu trang, vì ô chờ ngắn làm trình duyệt kẹp
  `scrollY` về 0. Các lần sau module đã có sẵn nên lại giữ vị trí.
- **Đóng màn con:** danh sách hiện lại ở vị trí bất kỳ còn sót lại. Người học phải cuộn lại tìm
  chỗ đang học.

## Đã làm

`CefrLevelPage.tsx` (chỉ áp cho mobile; desktop giữ nguyên vì màn con nằm trong bố cục hai cột với
mục lục ở cột trái):

- Gom trạng thái "màn con nào đang mở" thành một khoá. Khi khoá đổi:
  - mở màn con → `window.scrollTo({ top: 0 })`, cùng cách `StoryReader` và `CommonPhrases` đang làm;
  - đóng hẳn về danh sách → cuộn về vị trí đã lưu.
- Vị trí danh sách được **ghi liên tục bằng sự kiện `scroll` khi danh sách đang hiện**, không đọc
  lúc mở. Lý do: bản đầu đọc `scrollY` trong effect và E2E đỏ. Lúc effect chạy, màn con (hoặc ô
  chờ) đã thế chỗ danh sách và trình duyệt đã kẹp `scrollY` xuống. Cờ "đang ở danh sách" đổi trong
  `useLayoutEffect`, tức là trước khung hình kế tiếp, nên cú cuộn do kẹp không ghi đè vị trí đã
  lưu.
- Mở hội thoại từ trong một vòng (màn con → màn con) không ghi đè vị trí danh sách.

## Bằng chứng

- **E2E mới `e2e/cefr-level-subview-scroll.spec.ts`** (390×844): cuộn tới vòng "❓ Từ để hỏi & giới
  từ" (`scrollY` > 400), mở → `scrollY` = 0, "Quay lại" → về đúng vị trí cũ (±4 px); lặp lại với
  vòng "🧍 Cơ thể" (lần mở thứ hai, module đã có sẵn).
  - **Bản mới:** xanh, chạy `--repeat-each 3` cùng `cefr-level-fast-paint.spec.ts` được 15/15.
  - **Bản cũ:** đỏ, đóng xong `scrollY` lệch 4647 px so với chỗ cũ.
- **E2E liên quan** (14 spec chạm trang cấp, gồm `s07-matrix`, `outline-english`,
  `load-error-states`): **239/239 xanh**. Bộ `a11y.spec` đã chạy 58/473 ca, đều xanh, rồi dừng vì
  quá chậm ở máy; diff không đổi DOM nên CI chạy đủ.
- **Tầng 8b** (theme Blue sky; mở 2 vòng ở Phần 6 rồi đóng; trước/sau, so `ImageChops.difference`):
  - **1440:** cả 4 ảnh **trùng từng pixel**, đúng như dự kiến vì desktop không đổi hành vi.
  - **390, lần mở 1:** trùng.
  - **390, lần mở 2:** bản cũ mở lưng chừng, mất nút "Mục lục cấp học", "Quay lại" và tên vòng;
    bản mới hiện từ đầu màn.
  - **390, sau khi đóng:** bản cũ nhảy về đầu trang; bản mới về đúng Phần 6, nơi vừa bấm.
- **Lighthouse production — trang cấp CEFR B1** (Lighthouse 13.5 mobile, cấu hình PageSpeed),
  đo sau deploy 0601 + 0603. Đã xác nhận chunk `CefrLevelPage` trên production nặng 37.056 B, khớp
  bản build.

  | Lượt                 | Điểm    | LCP         | TBT        | CLS     |
  | -------------------- | ------- | ----------- | ---------- | ------- |
  | Đợt 0601 (trước)     | 83–85   | 3,1–3,2 s   | 190–280 ms | ≤ 0,012 |
  | Sau deploy, lượt 2–3 | 90 / 92 | 3,1 / 2,9 s | 80 / 70 ms | 0,012   |
  - Lượt 1 sau deploy lệch hẳn: điểm 67, LCP 3,6 s, TBT 650 ms. Nguyên nhân chưa xác minh
    (không tái hiện ở hai lượt sau), nên không tính vào kết quả.
  - **Phân rã LCP:** TTFB 683 ms (đo từ container), độ trễ vẽ phần tử 2.107 ms. Phần tử LCP là một
    câu can-do trong `<details>`. CSS chặn hiển thị (`index-*.css`) mất ~450 ms. Đây là ứng viên kế
    tiếp — đã ghi ở `PROGRESS.md`.
  - **Từ điển** (chưa có 0604): 92–93, LCP 2,7–2,9 s, TBT 80–120 ms, CLS 0. Cần đo lại sau khi
    deploy 0604.
