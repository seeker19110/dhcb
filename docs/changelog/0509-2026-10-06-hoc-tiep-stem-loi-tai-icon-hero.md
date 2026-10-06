# 0509 — Khối "Học tiếp" STEM: báo lỗi tải, biểu tượng "xem lại", hero 390px (2026-10-06)

- **Ngày:** 2026-10-06 · **PR:** chưa tạo (commit cục bộ) · **Loại:** `fix(ui)`.
- **Nối tiếp:** changelog 0508 (ảnh chụp Tầng 8b phát hiện ba điểm nhỏ).

## Việc đã làm

1. **Lỗi tải ≠ chưa học.** `StemContinueBlock.tsx`: khi `stateStatus === 'error'` thêm dòng
   `<p role="status">` "Chưa tải được tiến độ — đang gợi ý bài đầu tiên." (chữ `text-zinc-300`,
   token). Nút vẫn bấm được. Đo tương phản thật: blue-sky 9,45:1 · dark-blue 9,48:1 · kid 7,77:1
   (đều đạt AAA 7:1).
2. **Biểu tượng nút "Xem lại danh sách bài".** `ContinueCard` thêm prop tuỳ chọn `icon`
   (mặc định vẫn `Play` nên Tiếng Anh + Lập trình + 3 danh sách không đổi; `codemap impact`
   17 file, không file nào đổi hành vi). Trạng thái "đã học xong" truyền `ListChecks`.
3. **Hero môn ở 390px.** `SubjectDetail.tsx`: hàng chỉ số "N chương" / "AI giải từng bước" đổi sang
   `flex-wrap gap-x-4 gap-y-1.5` + `whitespace-nowrap` → xuống dòng có chủ đích, mỗi chỉ số một
   dòng, không bẻ chữ. 1440px không đổi (vẫn một hàng).

## Test

`StemContinueBlock.test.tsx`: thêm ca (lỗi tải có dòng `role=status` đúng chữ; tải ổn không có
dòng đó), kiểm biểu tượng `lucide-list-checks` ở "đã học xong" và `lucide-play` ở "bắt đầu".

## Kiểm chứng

typecheck · lint (0 cảnh báo) · prettier · vitest 16 file/161 ca (components/learning,
pages/learning, EnglishHome) xanh · `audit:prose -- --ci` 0 lỗi · e2e `a11y.spec.ts` +
`a11y-aaa.spec.ts` lọc STEM/mathematics: 18/18 xanh (các mock đó không dựng trạng thái lỗi tải
nên dòng báo lỗi được đo tương phản riêng, số ở trên).

Ảnh Tầng 8b (3 theme × 390/1440 × lỗi/chưa học/đã xong), trước: `/tmp/shots-before/`, sau:
`/tmp/shots-after/` (không commit PNG). Tràn ngang = 0 ở cả 36 ảnh. Đã nhìn ảnh thật: hero 390px
gọn hơn (trước: "1 / chương" và "AI giải / từng / bước" bị bẻ), dòng báo lỗi dịu, đọc rõ ở cả ba
theme; 1440px hàng ngang gọn, nút nằm bên phải, biểu tượng danh sách hợp nghĩa.
