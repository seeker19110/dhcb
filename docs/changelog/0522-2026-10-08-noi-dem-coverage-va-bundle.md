# 0522 — Nới đệm COVERAGE + BUNDLE: test ca biên 6 file phủ thấp, tách `ts-fsrs` khỏi chunk khởi động (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** (chưa tạo) · **Loại:** `test` + `perf` + `fix` ·
  **Nhánh:** `worktree-agent-a680bcaa54b64f711`.
- **Nguồn:** nợ "Cả COVERAGE lẫn BUNDLE nay đều mỏng" ở mục "Nợ kỹ thuật còn mở" của
  `PROGRESS.md` (tìm cụm "ngân sách BUNDLE nay rộng").

## Vì sao

Đo lại trên `main` (`4953c0a`) trước khi làm: **Initial JS 154,53 / 160 kB = 96,6%**. Mức này
lại vượt ngưỡng cảnh báo 95% của `QUY-TRINH-AUDIT.md` Tầng 1, chỉ còn 5,5 kB cho mọi tính năng
kế tiếp. CSS ở mức 23,95 / 26 kB (92,1%). Coverage branches 91,44% so với sàn 89 (đệm 2,44
điểm).

## Đã làm

### Bundle — `apps/dhcb/vite.config.ts`

- Tách `ts-fsrs` (thuật toán ôn tập ngắt quãng) ra chunk riêng `vendor-fsrs`. Gói này chỉ có
  `lib/srs.ts` import, và `srs.ts` nằm ở chunk lười (Home, ôn tập, CEFR…), không nằm trong entry.
  Nhưng `manualChunks` dồn MỌI `node_modules` còn lại vào `vendor-misc`, mà `vendor-misc` được
  modulepreload ngay lúc khởi động. Hệ quả là khách mở trang Landing cũng phải tải thuật toán
  FSRS. Sau khi tách:
  `vendor-fsrs` không có trong danh sách `modulepreload` của `dist/index.html`, và entry chỉ nhắc
  tới nó trong `__vite__mapDeps` (phụ thuộc của import động), không có import tĩnh. Không đổi
  hành vi: lần đầu mở trang có ôn tập, chunk này tải song song cùng chunk `srs`.
- CSS: đã rà, KHÔNG cắt. Trong `index-*.css` (268 kB thô), lớp `@layer utilities` chiếm 240 kB,
  toàn là class đang dùng thật. Muốn giảm thì phải sửa class trong component, tức là đổi giao
  diện, nằm ngoài phạm vi đợt này. File `vendor-misc-*.css` (1,9 kB) là `@font-face` của Inter,
  cần thiết.

### Coverage — test ca biên cho 6 file phủ thấp nhất mà có logic thật

| File                                             | Branches       | Statements     |
| ------------------------------------------------ | -------------- | -------------- |
| `packages/core-grading/selfGrade.ts`             | 72,41 → 96,55% | 71,42 → 100%   |
| `packages/core-ai/visemeTimeline.ts`             | 62,50 → 96,87% | 77,35 → 100%   |
| `apps/dhcb/src/lib/examPlan.ts`                  | 50,00 → 100%   | 78,12 → 100%   |
| `apps/dhcb/src/lib/programmingProgress.ts`       | 54,34 → 89,13% | 75,00 → 98,43% |
| `packages/subject-programming/tsPrelude.ts`      | 68,96 → 93,10% | 82,14 → 98,21% |
| `apps/server/src/api/admin/admin-usage-stats.ts` | 65,21 → 97,82% | 90,14 → 100%   |

- `selfGrade.test.ts` (mới): cổng tự chấm đáp án bài STEM trước đây chỉ chạy GIÁN TIẾP qua test
  nội dung, mà bài nào cũng khai đúng, nên nhánh báo lỗi chưa từng chạy. Tức là chưa ai chứng
  minh được cổng này ĐỎ được. Test mới dựng bài khai sai cố ý (đúng lỗi audit 2026-09-14: khai
  `value` ở đơn vị hiển thị) để chứng minh điều đó.
- `visemeTimelineFromAlignment.test.ts` (mới): đường dùng chính alignment → timeline (eSpeak được
  mock), ranh giới trần 4000 khung hình (đúng 4000 thì giữ, 4001 thì bỏ), mảng mốc thời gian
  ngắn hơn mảng ký tự.
- `tsPreludeHost.test.ts` (mới): soi TRỰC TIẾP compiler host của `/api/programming/ts-check`
  (ranh giới an toàn vá 2026-09-27). Host chặn leo thư mục `..`, thư mục con, thư mục "anh em"
  cùng tiền tố (`lib` → `libX`), file ngoài server. Lib chỉ đọc đĩa một lần. Có cả nhánh dự
  phòng khi host gốc không có `getDefaultLibLocation`.
- Bổ sung ca vào `examPlan.test.ts`, `programmingProgress.test.ts` (khách vãng lai, cờ "từ
  cache", luật phủ mục chờ gửi, mốc client hỏng, localStorage đầy) và
  `admin-usage-stats.test.ts` (OPTIONS, 429 trước khi chạm DB, DB trả 0 dòng, trạng thái đơn
  lạ, chi phí theo gói, cộng token thật từ chuỗi numeric/NULL).

### Bug thật do test lộ ra (đã sửa, có test hồi quy)

1. **`selfGrade.ts` — đọc sai mọi số mũ chứa 1/2/3.** Dải ký tự `[⁰-⁹]` chỉ phủ U+2070–2079,
   trong khi `¹ ² ³` nằm ở khối Latin-1 (U+00B9/B2/B3). Vì vậy `10⁻¹⁹`, `10²³`, `10²` không được
   nhận là luỹ thừa, và `6,02 × 10²³` bị đọc thành `[6.02, 10]`. Sửa thành `[⁰¹²³⁴-⁹]`.
2. **`selfGrade.ts` — số ≥ 1e21 bị cắt đôi.** `String(6.02 * 1e23)` cho ra `"6.02e+23"`, mà regex
   đọc số chỉ nhận `e-?\d+` (không nhận `+`), nên kết quả là `[6.02, 23]`. Sửa thành `e[+-]?\d+`.
   Hai bug này chỉ ảnh hưởng cổng CI kiểm nội dung bài học (lớp 2 "đối chiếu lời giải"). Bài khai
   ĐÚNG mà lời giải có số mũ dạng này có thể bị báo đỏ oan. Sau khi sửa, test bài học Toán, Lí,
   Hoá, Sinh vẫn xanh (8 file, 177 test).
3. **`examPlan.ts` — "Đã nắm 0/0" lệch với lịch.** Khi từ điển chưa nạp (rỗng), lịch ôn thi tính
   theo `plan.scopeItems` đã lưu, nhưng UI lại nhận `scopeItems: 0`. Sửa để cả lịch lẫn UI dùng
   CÙNG một phạm vi.

### Test chập chờn

- `packages/subject-programming/tsPrelude.test.ts`: ca đầu tiên phải parse lib chuẩn từ đầu.
  Chạy riêng mất khoảng 3 s, nhưng trong `test:coverage` toàn bộ (4 lõi, máy có tải) mất 5,7–6,5 s
  và đỏ hai lần liên tiếp vì timeout mặc định 5 s. Đã nới timeout RIÊNG ca này lên 30 s. Không
  đụng cấu hình vitest.

## Bằng chứng

- **Bundle** (`npx size-limit --json` sau `npm run build`): Initial JS **154 525 → 148 880 B**
  (96,6% → 93,1% của 160 kB; dư 5,5 → 11,1 kB). Đo theo từng chunk: `vendor-misc` 30,08 → 24,42 kB
  brotli, phần chênh 5,67 kB đúng bằng `ts-fsrs`. Initial CSS không đổi: 23 945 B (92,1%).
- **Coverage** (`npm run test:coverage`, thoát mã 0, 813 file test xanh, 18 917 test):
  statements **95,52 → 95,74** · branches **91,44 → 91,79** · functions **96,03 → 96,41** ·
  lines **96,18 → 96,36** (sàn 93 / 89 / 93 / 93). Số "trước" đo bằng
  `vitest run --coverage --coverage.reportOnFailure` trên mã gốc. Lượt đó có 2 test script
  (`scanGraph`, `no-control-chars`) đỏ vì timeout do 3 phiên khác chạy coverage cùng lúc (tải
  trung bình khoảng 23 trên 4 lõi). Ở lượt đo "sau" chúng xanh.
- Cổng: `npm run typecheck` (sau `rm -rf packages/*/dist dist dist-server`) · `npm run lint` ·
  `npx prettier --check` trên các file đã đổi · `npm run build` · `npm run test:coverage`. Cả năm
  cổng đều thoát mã 0.

## Còn mở

- Đề xuất (chưa làm, cần người dùng duyệt vì là sửa file cổng): branches nay dư 2,79 điểm so với
  sàn 89. Nếu giữ nguyên tắc "chừa khoảng 1,5 điểm" của `vitest.config.ts` thì có thể nâng sàn
  branches lên 90.
- CSS vẫn ở 92,1%. Muốn có thêm biên độ phải rà class Tailwind trong component (đổi giao diện),
  hoặc người dùng quyết định nới ngưỡng.
- `programmingProgress.ts` có hai hàm `fetchProgressWithStatus` / `fetchProgressWithState` lặp
  gần như nguyên logic (khác mỗi tên cờ). Có thể gộp thành một hàm lõi, để đợt sau.
