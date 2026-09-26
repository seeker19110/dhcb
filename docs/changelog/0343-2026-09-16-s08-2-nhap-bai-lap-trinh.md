# 0343 — S08-2: nháp code và bước đang học sống qua reload ở bài Lập trình

- **Ngày:** 2026-09-16
- **PR:** [#961](https://github.com/seeker19110/dhcb/pull/961)
- **Đặc tả:** [`docs/specs/2026-09-15-learning-ux-s08-khung-phien-resume.md`](../specs/2026-09-15-learning-ux-s08-khung-phien-resume.md) (Approved for implementation) — slice S08-2, AC-11…AC-15, AC-20.

## Việc đã làm

- `ProgrammingLessonPage.tsx`: 6 `useState` rời (bước, code, Dự đoán, Parsons, gợi ý, code mẫu)
  gộp về một nguồn ghi duy nhất là `useLearningSession` — nháp + bước sống qua reload trên CÙNG
  thiết bị, khoá `dhcb_lsession_v1_*` của S08-1.
- Hai nhánh giao diện mới: hộp `Modal` "Bài này đã được cập nhật" khi vân tay nội dung bài đổi
  (hỏi trước, KHÔNG tự đổ nháp cũ đè lên đề mới), và dòng `role="status"` "Trình duyệt đang chặn
  lưu nháp — rời trang là mất phần đang gõ" khi storage bị chặn.
- Thêm dòng nhỏ "Đã khôi phục code bạn gõ — bấm "Chấm bài" để chấm lại." ở bước Tự viết, để
  không ai tưởng bài chấm của mình biến mất (rủi ro §8 của đặc tả).
- Test mới: `ProgrammingLessonPage.test.tsx` (5 ca) + `e2e/learning-session-resume.spec.ts` (4 ca).

## Quyết định trong lúc thi hành

- **`useLearningSession` có thêm tham số `paused`** (mặc định `false`, không đổi hành vi nơi
  khác). Lý do đo được: §7 Q6 muốn "mở lại bài đã xong là bắt đầu sạch", nhưng chỉ gọi
  `clearSession` lúc đạt hết test là chưa đủ — người học bấm "Bước tiếp" sang "Về nhà" một cái
  là hook ghi lại nháp và bài ĐÃ XONG lại có nháp. `paused: passed` chặn đúng chỗ đó. Có test
  riêng ở `useLearningSession.test.tsx`.
- **Kết quả Parsons tính lại, không lưu**: giữ một cờ cục bộ "đã bấm Kiểm tra" rồi suy ra
  đúng/sai bằng `checkParsonsOrder`. Giữ nguyên hành vi hiện có (không lộ đáp án trước khi bấm)
  mà vẫn không cất con số đúng/sai nào trên máy. `predictRevealed` suy ra từ `predictChoice`.
- **AC-12 đo trên `p1-u5-l1` thay vì `p1-u4-l2`**: đếm thật `grep "id: 'p1-u4-l"` = 1 dòng —
  unit P1-U4 chỉ có đúng một bài, nên "bài khác" lấy ở unit kế tiếp.

## Bằng chứng kiểm chứng

- `npm run typecheck` ✅ · `npm run lint` (max-warnings 0) ✅ · `npx prettier --check .` ✅
- `npm run test:coverage` ✅ — 650 file / 13257 test xanh; Statements 94.09 · Branches 90.06 ·
  Functions 94.46 · Lines 94.61 (đều trên sàn 93/89/93/93).
- E2E: `learning-session-resume.spec.ts` 4/4 ✅; `a11y.spec.ts` + `a11y-aaa.spec.ts` +
  `programming-lesson.spec.ts` + `outline-programming.spec.ts` = 496 xanh. Hai ca nặng
  (`bài SQL p3-u8-l1`, `bài DOM p3-u6-l2`) hết giờ khi chạy 4 spec song song trên một máy; chạy
  lại riêng: 7,0 s và 7,3 s đều xanh → nghẽn tài nguyên, không phải hồi quy.
- **Tầng 8b (ảnh thật 1440/390/320, trước/sau)** bắt được một lỗi mà không cổng nào thấy: dòng
  ĐẦU của đoạn văn trong hộp thoại bị **nền dính của `Modal` che mất 24px** (tiêu đề dính bị kéo
  lên bằng `-mt-6`) — người học chỉ đọc được "code bạn đã gõ hay bắt đầu mới?". Đã bù bằng
  `pt-6` đúng khuôn đã ghi ở `useOutlinePane.tsx`, chụp lại thấy đủ chữ ở cả ba bề rộng.
- Ảnh trước/sau của bước "Tự viết" ở 1440px trùng khít từng byte (md5
  `57ba6195468a1e3160fecd2f0522fa41`) → không có hồi quy bố cục trên nền đã có #944 (cột mục lục).
