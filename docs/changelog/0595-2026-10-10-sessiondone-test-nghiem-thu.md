# 0595 — Trả nợ test nghiệm thu `SessionDone` (P1-6 · AC-3, AC-4, AC-7)

- **Ngày:** 2026-10-10 · **PR:** (xem mô tả PR) · **Loại:** `test(home)`
- **Đặc tả:** `docs/specs/2026-09-17-redesign-trang-chu-thi-hanh.md` §P1-6 (đã duyệt, mã đã merge ở
  PR #1014). Đợt này CHỈ thêm test còn nợ — không đổi mã sản phẩm.

## Vấn đề

PR #1014 ship `SessionDone` (một overlay gộp chuỗi ngày + mục tiêu tuần) nhưng ba tiêu chí chấp nhận
chưa có test vì phiên thi hành khi đó không có Playwright: AC-3 chỉ có test dựng `SessionDone`
trực tiếp (chưa lắp ráp qua `TodayLesson` thật), AC-4 (`?xong=1` sống qua reload) và AC-7 (a11y
overlay + ảnh chụp) chưa có.

## Đã làm

- **AC-3** — `apps/dhcb/src/components/studyTabs/TodayLesson.sessionDone.test.tsx`: render
  `TodayLesson` THẬT, ghim ngày (giờ VN), gieo 6 ngày học liền trước + mục tiêu tuần 3 ngày đã có 2
  ⇒ lần hoàn thành này chạm CÙNG LÚC mốc chuỗi 7 ngày và đạt mục tiêu tuần. Khẳng định DOM chỉ có
  MỘT `[role="dialog"]`, chứa cả "Chuỗi 7 ngày" lẫn "Đạt mục tiêu tuần · 3/3 ngày"; kèm ca đối
  chứng "chưa học xong thì 0 dialog".
- **AC-4** — `e2e/quiz-session.spec.ts`: học hết lượt 2 từ → URL có `xong=1` → `page.reload()`
  overlay vẫn hiện → bấm "Về trang chủ" → overlay đóng, query `xong` mất.
- **AC-7** — `e2e/a11y-modals.spec.ts`: overlay `SessionDone` × 3 theme hiện hành, quét axe A/AA ở
  1440px rồi 390px trong cùng một lần mở, kiểm dialog có tên truy cập được và Escape đóng được.
- Ảnh tầng 8b: overlay ở 3 theme × 1440px/390px — bố cục gọn, nút chính đủ lớn, chữ đọc rõ trên
  nền mờ; số chuỗi ngày ở header nền khớp số trong overlay.
- `PROGRESS.md`: gỡ câu lỗi thời "nợ `programmingSrs.test.ts` vẫn còn mở" (đã trả ở `0344`; đo lại
  3 lượt: 2–5 ms).

## Kiểm chứng

- AC-3: 3 lượt liên tiếp 2/2 xanh. AC-4: 4 lượt liên tiếp xanh (không chập chờn). AC-7: 3/3 theme
  xanh.
- Cổng đầy đủ: xem mô tả PR.

## Còn lại

- Nối `SessionDone` vào `Challenge.tsx`, bài Lập trình (`Lesson*.tsx`) và `StemLessonView.tsx` —
  đã nằm trong điểm chạm của đặc tả P1-6 nhưng chưa làm (các trang này chưa từng gọi celebration
  cũ nên không hồi quy). Là lát giao diện riêng.
