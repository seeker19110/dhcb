# 0501 — Một luật "Tiếp tục" cho mọi danh sách duyệt tuần tự (2026-10-06)

- **Ngày:** 2026-10-06 · **PR:** _(điền khi tạo PR)_ · **Loại:** `fix(ux)`.
- **Phạm vi:** nối tiếp đợt U9b (changelog `0498`, audit 2026-09-30 **M19**). Đợt 0498 sửa gợi ý
  "Tiếp tục" ở Bài hội thoại nhưng ghi nợ: **Câu thông dụng** vẫn trỏ "chủ đề đầu tiên chưa xem".
  Rà thêm thấy tab Câu thông dụng trong **Luyện nghe** chép đúng khuôn sai đó.

## Đã làm

- `lib/viewedTracking.ts`: hàm thuần **`suggestContinue(namespace, uid, items, keyOf)`** — MỘT
  luật cho cả ba danh sách: (1) mục mở gần nhất còn trong danh sách → "Tiếp tục" chính mục đó;
  (2) không có → mục đầu tiên chưa xem, nhãn "Bắt đầu" nếu chưa xem mục nào, ngược lại "Tiếp tục"
  (người dùng cũ chỉ có dữ liệu "đã xem"); (3) xem hết → không gợi ý. 5 ca test bảng.
- `CommonPhrases.tsx` và `Listening.tsx` (tab Câu thông dụng): ghi `markLastOpened` khi mở chủ đề,
  dùng `suggestContinue`, nhãn "Bắt đầu"/"Tiếp tục". Thêm chuỗi i18n `phrasesStart`
  ("Bắt đầu" / "Start").
- `Lessons.tsx`: nhánh danh sách chuyển sang `suggestContinue` (hành vi giữ nguyên như 0498); nhánh
  "đang mở một bài → Bài tiếp theo" giữ riêng vì chỉ Lessons có bố cục master–detail.
- E2E `continue-viewing.spec.ts`: ca Câu thông dụng cũ khẳng định "mở xong thì gợi ý ĐỔI sang chủ
  đề khác" — chính là hành vi sai M19. Nay: người mới thấy "Bắt đầu"; mở một chủ đề rồi quay lại
  thấy "Tiếp tục" ĐÚNG chủ đề đó.

## Bằng chứng kiểm chứng

- Unit: `viewedTracking.test.ts` 13/13; thư mục `pages/subjects/english` + i18n 63/63.
- E2E: `continue-viewing`, `listening-phrases`, `listening`, `new-user-journey` — 10/10 xanh.
- Cổng commit: typecheck (sau khi xoá `dist`), lint, format, `test:coverage`, build — xem mô tả PR.

### Tầng 8b — ảnh trước/sau (390px + 1440px, đã tự nhìn)

- **Câu thông dụng, sau khi mở "I am" rồi quay lại:** trước — "Tiếp tục · I was" (thứ tự chỉ mục
  khác thứ tự hiển thị, nên gợi ý còn nhảy tới một chủ đề người học chưa thấy trên màn); sau —
  "Tiếp tục · I am".
- **Người mới (1440px):** dòng gợi ý ghi "Bắt đầu · I am" thay vì "Tiếp tục". Bố cục, màu, vùng chạm
  không đổi (cùng component `ContinueRow`).

## Nợ còn lại

- Ba danh sách vẫn không có tín hiệu "đã học xong" (nợ S11-1) — "Tiếp tục" là mục mở gần nhất. Khi có
  tín hiệu "xong", `suggestContinue` là chỗ DUY NHẤT cần sửa để tự nhảy sang mục kế.
