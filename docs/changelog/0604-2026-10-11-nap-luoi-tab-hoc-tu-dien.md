# 0604 — Trang Từ điển: nạp lười JS của 4 tab học

- **Ngày:** 2026-10-11 · **PR:** (xem mô tả PR) · **Loại:** `perf(english)`
- **Nguồn việc:** mục "Còn mở" (1) của nợ Tầng 8 trong `PROGRESS.md` — trang Từ điển (LCP mobile
  2,8 s trên production, đợt 0601) vẫn trên ngân sách 2,5 s, phần còn lại là chuỗi chunk JS.

## Chẩn đoán

Đo đồ thị import TĨNH của chunk `Dictionary` trên bản build (trừ phần entry đã nạp sẵn):
**45 chunk, 317 KB thô / 113 KB gzip**. Tab mặc định của trang là "Tra từ" (audit 2026-09-30), nhưng
`StudyPanel` — kéo theo toàn bộ `StudyTabs` (Hôm nay/Ôn/Từ khó/Kiểm tra: FSRS, quiz, chấm phát
âm…) — được import tĩnh, nên trang phải tải hết JS của 4 tab học mới vẽ được ô tra từ.

## Đã làm

- `Dictionary.tsx`: `StudyPanel` nạp qua `lazyWithRetry` (khuôn của 0603), bọc `Suspense` ở chỗ
  dùng duy nhất. Ô chờ là "Đang tải từ vựng…" — đúng câu `StudyPanel` tự hiện khi từ điển chưa
  về, nên người học thấy MỘT trạng thái chờ liền mạch.
- Nạp trước JS tab học qua `runWhenPageSettled` (`lib/pageSettled.ts`, nhịp việc nền sẵn có của app:
  sau `load` + 4 s + lúc rảnh), để không chen băng thông với nội dung đầu tiên.
- **Gom lại cho DRY:**
  - `components/LoadingNotice.tsx` (mới) — ô chờ dùng chung cho `Suspense` fallback, thay hàm
    `OChoTai` cục bộ của trang cấp CEFR (0603).
  - Trang cấp CEFR đổi bước nạp trước tự viết (`requestIdleCallback` / `setTimeout`) của 0603 sang
    `runWhenPageSettled` — đợt 0603 đã bỏ sót helper sẵn có này.

## Bằng chứng

- **Đồ thị chunk (bản build production):**

  | Trang    | Trước (thô / gzip) | Sau (thô / gzip) | Giảm  |
  | -------- | ------------------ | ---------------- | ----- |
  | Từ điển  | 317 KB / 113 KB    | 138 KB / 47,5 KB | ~57 % |
  | Cấp CEFR | 180 KB / 68 KB     | 180 KB / 69 KB   | (giữ) |

- **E2E mới `e2e/dictionary-lazy-study-tabs.spec.ts`:** giữ treo module `StudyPanel` (dev server
  Vite) mà ô tra từ vẫn hiện; bấm "Hôm nay" → "Đang tải từ vựng…"; nhả ra → hết chờ. **Bản mới xanh;
  bản cũ đỏ** (ô tra từ không bao giờ hiện).
- **Unit:** 89 file / 1275 test trong `pages/subjects/english` + `components` xanh.
- **E2E liên quan chạy ở máy (gồm cả `a11y.spec` + `a11y-aaa.spec` đủ trang × theme): 713/714.**
  Ca đỏ duy nhất: AAA `/bai-hoc` theme dark-blue — trang KHÔNG nằm trong diff; chạy lại riêng
  `--repeat-each 3` xanh 3/3 (mỗi lượt ~18 s, sát ngưỡng khi máy chạy 2 worker bộ a11y nặng). Báo
  cáo lỗi lần đỏ đã bị lượt sau ghi đè nên chưa xác minh được nguyên nhân — CI chạy lại trên máy
  sạch.
- **Tầng 8b** (theme Blue sky, 1440 + 390, trước/sau, so `ImageChops.difference`): tab "Tra từ" và
  tab "Hôm nay" (đã có thẻ từ) **trùng từng pixel** ở cả hai bề rộng.
