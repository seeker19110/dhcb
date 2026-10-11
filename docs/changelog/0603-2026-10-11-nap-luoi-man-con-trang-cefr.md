# 0603 — Trang cấp CEFR: nạp lười JS của màn con, tab học và bài thi

- **Ngày:** 2026-10-11 · **PR:** (xem mô tả PR) · **Loại:** `perf(english)`
- **Nguồn việc:** mục "Còn mở" (1) của nợ Tầng 8 trong `PROGRESS.md` (đợt 0601): sau khi bỏ chờ dữ
  liệu nặng, phần LCP còn lại của trang cấp là chuỗi chunk JS.

## Chẩn đoán

Đo đồ thị import TĨNH của chunk `CefrLevelPage` trên bản build (trừ phần entry đã nạp sẵn):
**66 chunk, 425 KB thô / 151 KB gzip** phải về trước khi trang vẽ được danh sách bài. Phần lớn là
ba khối chỉ hiện khi người học BẤM vào:

- `CefrLessonViews` — thẻ từ, bài ngữ pháp, hội thoại (kéo theo chấm phát âm, chấm AI, thẻ kết quả…).
- `StudyTabs` — 5 tab học Hôm nay / Ôn / Từ khó / Kiểm tra / Nghe (kéo theo FSRS, quiz…).
- `CefrExam` — bài thi cuối cấp.

## Đã làm

- `CefrLevelPage.tsx`: ba khối trên nạp qua `lazyWithRetry` (khuôn sẵn có của `App.tsx` /
  `Companion.tsx`: chunk cũ mất sau deploy → tự tải lại trang một lần), bọc `Suspense` ở đúng ba
  chỗ dùng (màn con, bài thi, vùng tab học). Ô chờ `OChoTai` cùng khuôn ô "Đang tải từ vựng…".
- Trang đã vẽ (`ready`) → nạp trước ba chunk lúc rảnh (`requestIdleCallback`, lui về
  `setTimeout`), để cú bấm đầu tiên thường không phải chờ thêm một lượt mạng. Lỗi nạp trước bỏ qua
  có chủ đích: lần render thật đi qua `lazyWithRetry` + Suspense, có nhánh lỗi riêng.

## Bằng chứng

- **Đồ thị chunk (bản build production):** JS tĩnh thêm vào trước nội dung
  **425 → 180 KB thô (151 → 68 KB gzip), giảm ~58%**; 66 → 41 chunk. Chunk của chính trang
  97 → 37 KB thô.
- **E2E mới** (`e2e/cefr-level-fast-paint.spec.ts`, ca 4): giữ treo ba module (dev server Vite →
  mỗi module một request) mà danh sách bài vẫn phải hiện; mở vòng lúc còn treo → "Đang tải…"; nhả
  ra → thẻ từ. **Bản mới xanh; bản cũ đỏ** (danh sách không bao giờ hiện vì trang import tĩnh
  chúng). Ca này canh luôn chuyện ai đó import tĩnh lại về sau.
- **E2E liên quan chạy ở máy: 298/298 xanh** (load-error-states, cefr-level-fast-paint,
  outline-english, s07-matrix, cefr-tab-touch-target, audit-cefr-assessment, today-plan, comeback,
  english-lesson-deep-link, learning-session-resume, learning-ux-\*, ux-r3-4, smoke).
- **Tầng 8b** (trang A1, theme Blue sky, 1440 + 390, trước/sau, so `ImageChops.difference`):
  danh sách bài, tab Hôm nay và thẻ từ ở 1440 **trùng từng pixel**. Thẻ từ ở 390 lệch **vị trí
  cuộn** (~96 px): bản cũ giữ vị trí cuộn của danh sách (nút "Mục lục cấp học" bị header che một
  nửa), bản mới hiện ô chờ một nhịp nên trang co lại và về đầu. Nội dung màn giống nhau.

## Còn mở

- Vị trí cuộn khi mở màn con nay không nhất quán: lần mở ĐẦU về đầu trang (do Suspense), các lần
  sau giữ vị trí cuộn của danh sách như trước. Nên chốt một hành vi (đề xuất: luôn về đầu màn con
  ở mobile) ở đợt riêng — chạm cả bố cục `TwoPane` desktop nên không gộp vào đây.
- Trang Từ điển vẫn kéo ~317 KB JS thô tĩnh trước nội dung; tách tương tự là đợt riêng.
- Đo lại trang cấp trên production sau deploy (Lighthouse mobile).
