# 0553 — Mở rộng golden set `eval:tutor` lên 180 câu, hai chiều A/B, thêm `--runs`/`--group` (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** (chưa tạo — commit trên nhánh `test/eval-tutor-golden-set`) ·
  **Loại:** `test(eval)`
- **Nguồn:** nợ `PROGRESS.md` "[2026-08-26] Dải nhiễu của eval rộng hơn mức một PR có thể phân
  biệt được" — nay THU HẸP (xem cuối).

## Vấn đề

Bộ 62 câu cũ chỉ có 18 câu đúng/ca biên: một câu đổi phán đoán làm FP-rate nhảy 5,6 điểm, nên luật
"không tụt so với baseline" (`CLAUDE.md` §8) không phân biệt được prompt tệ đi với nhiễu lấy mẫu.
Bộ cũ cũng 100% chiều A — chiều B (người nước ngoài học tiếng Việt) chưa có câu nào để đo.

## Đã làm

- **`scripts/eval-tutor-fixtures-extra.json`** — 118 câu mới (bộ cũ 62 giữ NGUYÊN, không sửa). Tổng
  **180 câu**: 120 lỗi · 43 đúng · 17 ca biên (nhóm đúng/ca biên = 60, gấp 3,3 lần trước). Chiều A
  103 câu · chiều B 77 câu (57,2% / 42,8%). Mỗi câu lỗi có: câu gốc · loại lỗi · bản sửa · giải thích
  (chiều A tiếng Việt, chiều B tiếng Anh) · nguồn đối chiếu; mỗi câu đúng/ca biên có `whyCorrect`.
  Nguồn là sách ngữ pháp thật (Swan, Murphy, Quirk, Biber, Carter & McCarthy; Thompson, Cao Xuân
  Hạo, Diệp Quang Ban, Hoàng Phê, Nguyễn Lân) hoặc "quy tắc chung" kèm luật cụ thể — không số
  trang/mục bịa. Các câu đúng "trông sai": thành ngữ, tỉnh lược hội thoại, câu đáp ngắn, phương
  ngữ Nam/Bắc (ba/má, heo/lợn), từ mượn (online, order, size), tiểu từ, tin nhắn không dấu, và ca
  "không cần đã/sẽ khi có từ chỉ thời gian".
- **Bốn loại lỗi riêng chiều B** thêm vào `ERROR_TYPES`: `tone_mark` · `classifier` · `word_order` ·
  `negation` (mỗi loại 8 câu). Nhãn dùng chung (tense, preposition, pronoun, missing_be, extra_be,
  adjective_order, plural_s, word_by_word) mang nghĩa theo chiều của câu — chiều B là đã/đang/sẽ,
  giới từ tiếng Việt, xưng hô, thiếu/thừa "là", tính từ sau danh từ. Mọi loại lỗi ≥ 8 câu.
- **`scripts/lib/evalScoring.ts`** — `FixtureSchema` thêm `corrected`/`explanation`/`source`/
  `whyCorrect` (tuỳ chọn — bộ cũ không có); `parseRichFixtures` bắt buộc đủ bằng chứng cho bộ mở
  rộng; `EvalResult.dir`; từ khoá `typeHit` thêm tiếng Anh cho chiều B. **Sửa nhỏ kèm theo:** tỉ lệ
  "nhận xét bằng tiếng Việt" (`feedbackViRate`) chỉ tính chiều A — chiều B nhận xét phải bằng tiếng
  Anh, đo chung sẽ lệch. Bộ cũ toàn chiều A nên số cũ không đổi.
- **`scripts/lib/evalStats.ts`** (hàm thuần, không gọi AI) — `mean`, `sampleStdDev` (mẫu, n−1),
  `wilsonInterval` (95%), `parseRuns`/`parseGroup`, `fixtureInGroup`, gộp theo nhóm qua nhiều lượt.
- **`scripts/eval-tutor.ts`** — `--runs N` (1..20; in trung bình ± SD giữa các lượt + Wilson 95% trên
  số gộp, theo từng loại lỗi và chỉ số tổng) và `--group <tên>` (loại lỗi | error | correct | edge |
  clean | A | B). Mặc định KHÔNG đổi: không cờ → một lượt, bảng y hệt trước. Cổng chặn ghi baseline
  (≥ 80% câu chấm được) nay áp cho TỪNG lượt. Thứ tự gộp bộ cũ → bộ mở rộng nên `--limit 62` tái hiện
  đúng bộ 62 câu của baseline cũ.
- **Cổng tĩnh** `scripts/evalTutorFixtures.test.ts` (+ `scripts/lib/evalStats.test.ts`): khớp Zod,
  id duy nhất toàn bộ, tổng ≥ 150, đúng/ca biên ≥ 60, mỗi loại lỗi ≥ 8, hai chiều mỗi bên ≤ 60%,
  không câu trùng (chuẩn hoá khoảng trắng/hoa thường/dấu câu cuối), bản sửa ≠ câu gốc và ≠ câu khác,
  câu đúng không có bản sửa, nguồn thuộc danh mục đã biết, ngôn ngữ đúng chiều (A: câu Anh + giải
  thích Việt; B: câu Việt + giải thích Anh), nhãn riêng chiều B chỉ ở câu chiều B.
- **`docs/research/eval-tutor-baseline.md`** — thêm khung "HIỆU LỰC" trên đầu: số cũ chỉ còn giá trị
  với bộ 62 câu; bộ 180 câu CHƯA có baseline.

## Quyết định

- Không sửa bộ 62 câu cũ (giữ khả năng đối chiếu baseline cũ); bộ mới nằm file riêng, gộp ở lúc chạy.
- Wilson tính trên số gộp (mỗi lượt-câu một phép thử) hơi lạc quan vì các lượt cùng bộ câu — đã ghi
  trong báo cáo sinh ra; quy tắc đọc: hai khoảng không chồng nhau mới coi là khác thật.
- KHÔNG gọi API AI, KHÔNG đọc `.env` trong đợt này — chỉ dữ liệu + công cụ + cổng tĩnh.

## Còn lại (việc tay chủ dự án)

Chạy `npm run eval:tutor -- --runs 3 --write-baseline` với key thật (≈ 540 lời gọi/chế độ), kiểm các
câu hay bị hỏng nhất, rồi dán bảng vào PR đổi prompt đầu tiên. Đến lúc đó nợ dải nhiễu mới đóng hẳn.
`CLAUDE.md` §8 không đổi ("không tụt so với baseline" — nay có baseline đủ rộng để áp).

## Bằng chứng

Xem phần báo cáo cuối của đợt (lệnh + kết quả thật): vitest `scripts/`, typecheck sạch dist, lint 0
cảnh báo, prettier, `check:docs`, `audit:prose -- --ci`.
