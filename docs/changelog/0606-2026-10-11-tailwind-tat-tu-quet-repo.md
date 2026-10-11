# 0606 — CSS: tắt Tailwind tự quét cả repo (bỏ ~170 rule rác) + đo lại Từ điển trên production

- **Ngày:** 2026-10-11 · **PR:** (xem mô tả PR) · **Loại:** `perf(css)`
- **Nguồn việc:** mục "Còn mở" (2) của nợ Tầng 8 trong `PROGRESS.md`:
  - CSS chặn hiển thị `index-*.css` mất ~300–450 ms ở trang Từ điển / CEFR (đo ở 0605);
  - trang Từ điển cần đo lại sau khi deploy 0604.

## Chẩn đoán

App có đúng một file CSS dùng chung cho mọi trang: 283 KB thô / 34,7 KB gzip.

- `apps/dhcb/src/index.css` dùng `@import 'tailwindcss'`. Ở Tailwind 4, cách viết này **tự quét
  class trên toàn thư mục chạy Vite** (gốc repo), CỘNG THÊM `content` của `tailwind.config.js`.
- Kết quả: Tailwind đọc cả `docs/`, `scripts/`, dữ liệu bài học, `public/sitemap-words.xml`… rồi
  sinh rule cho mọi chuỗi trông giống class. Ví dụ:
  - `.[backup:env]`, `.[migrate:pg]` — lấy từ tài liệu;
  - `.mt-12` / `.m-3` — thật ra là id câu hỏi trong bài Sinh;
  - `.text-[Npx]`, `.w-700`…
- Build thử với `source(none)` thì **170 selector biến mất**.
  - Đã đối chiếu TỪNG cái với mã nguồn của app + `packages/` (chỉ tính khi class đứng độc lập,
    không có tiền tố biến thể): không cái nào đang được dùng làm class. Chỗ duy nhất trùng tên là
    id dữ liệu (`id: 'm-3'`), con số (`391`) và chuỗi (`'ordinal'`).
- Phần còn lại (~2.700 rule) là utility đang dùng thật của app, không bớt được bằng cách này.

## Đã làm

- `apps/dhcb/src/index.css`: `@import 'tailwindcss' source(none);`. Nguồn class DUY NHẤT nay là
  `content` của `apps/dhcb/tailwind.config.js` (src của app + `packages/core-ui`) — danh sách
  vốn đã có, giờ thành nguồn sự thật thật.
- **Cái giá và cách canh:** tắt tự quét là bỏ lưới an toàn. Nếu sau này một gói khác bắt đầu dùng
  `className`, class của nó sẽ LẶNG LẼ không được sinh. Test mới `scripts/tailwind-sources.test.ts`
  canh ba điều:
  - (1) `index.css` giữ `source(none)` + `@config`;
  - (2) `content` vẫn quét src của app + core-ui;
  - (3) không gói nào ngoài core-ui có `.tsx` hoặc chữ `className` — có thì đỏ, kèm câu nhắc thêm
    gói vào `content`.

  Đã thử cả ba ca: đỏ đúng chỗ khi gỡ `source(none)` và khi thêm một file `.ts` có `className` vào
  `packages/subject-math`.

- `apps/hub` giữ nguyên: Vite của hub chạy trong `apps/hub`, nên tự quét chỉ phủ đúng thư mục hub.

## Bằng chứng

- **CSS (bản build production):** 282.807 → 266.700 B thô; **34.721 → 32.837 B gzip (−5,4 %)**,
  trên đường găng của MỌI trang.
- **Tầng 8b** (theme Blue sky, 1440 + 390, full page; trang chủ · cấp CEFR A1 · Từ điển · bài học
  Lập trình · Ghi chú): **10/10 ảnh trùng từng pixel** khi so trong cùng điều kiện.
  - Lượt đầu, 2 ảnh desktop khác. Trang chủ khác vì lượt "sau" chạy đầu tiên trên dev server còn
    nguội, nên chụp lúc sidebar và cột phải chưa ổn định; chụp lại thì trùng.
  - Trang CEFR desktop khác ở viền chữ, lệch tối đa 67/255. Chụp lại chính mã cũ cũng cho đúng
    khác biệt đó, nên đây là nhiễu giữa các lượt chụp. Ảnh cũ chụp lại và ảnh mới (`before2` /
    `after2`) trùng từng pixel.
- **Lighthouse production — trang Từ điển sau deploy 0604** (Lighthouse 13.5 mobile, cấu hình
  PageSpeed; đã xác nhận chunk `Dictionary` trên production nặng 50.308 B, khớp bản build, có tham
  chiếu chunk `StudyPanel` riêng):

  | Lượt          | Điểm  | LCP       | TBT       | Request JS trước 3 s |
  | ------------- | ----- | --------- | --------- | -------------------- |
  | Trước 0604    | 92–93 | 2,7–2,9 s | 80–120 ms | 60                   |
  | Sau 0604 (×5) | 86–92 | 2,8–3,0 s | 20–120 ms | 27                   |
  - Một lượt nữa lỗi NO_FCP (Chrome headless), không tính.
  - **LCP chưa tách được khỏi nhiễu:** TTFB trong phân rã LCP là 1,47–1,62 s, so với 0,70 s lúc đo
    trước 0604. `curl` từ container cho TTFB 0,4–1,5 s, kể cả với `/api/health` rất nhẹ — tức là
    nhiễu của đường mạng đi qua proxy, không phải của trang. Phần "độ trễ vẽ phần tử" (~930 ms)
    giữ nguyên so với trước.
  - Phần tử LCP vẫn là placeholder của ô tra từ.
