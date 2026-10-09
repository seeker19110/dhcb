# 0570 — mathforcode S3/S4: thêm 4 unit cho đủ 2 bài mỗi module

- **Ngày:** 2026-10-09 · **PR:** (xem mô tả PR) · **Loại:** `feat(programming)`
- **Đặc tả:** `docs/specs/2026-10-09-mathforcode-s3-s4-bo-sung-unit.md` (Approved for
  implementation, chủ dự án chọn phạm vi trong phiên 2026-10-09).
- **Nợ được trả:** `PROGRESS.md` "mathforcode S3/S4 mỏng (2 unit/chặng thay vì 4 như các hướng
  khác)".

## Vấn đề

Chặng `mathforcode-s3` và `mathforcode-s4` mỗi chặng có 4 module nhưng chỉ 2 unit
(`p6-u158…u161`), tức mỗi module chỉ 1 bài; các hướng khác đều 4 unit mỗi chặng. Nhiều topic đã
khai trong `specializations/mathforcode.ts` chưa có bài nào dạy (va chạm/phản xạ, ma trận xoay góc
bất kì, định thức và cân bằng luồng, chuỗi Markov, descent nhiều biến, hàm không lồi, backprop
nhiều tầng, tìm kiếm cục bộ).

## Đã làm

- 4 unit mới `p6-u290…u293`, 8 bài Python MÔ PHỎNG tất định (không numpy/torch/random/time), mỗi
  bài có test hiện + ẩn và ca ẩn fail-closed `input-khong-hop-le`:
  - `p6-u290` (S3 m1+m2): va chạm hai hình tròn + phản xạ `v − 2(v·n)n` (không phản xạ khi đang
    tách ra, từ chối hai tâm trùng nhau); nhân ma trận bằng tay theo quy ước hàng-cột với
    `rot:<độ>`/`scale`/`flip`, bắt `shape-khong-khop`.
  - `p6-u291` (S3 m3+m4): định thức cofactor + Cramer cho cân bằng luồng nhiều nút (hệ bảo toàn
    mọi nút luôn suy biến, thêm một phép đo thì giải được, cảnh báo luồng âm); chuỗi Markov quy
    ước hàng, trạng thái dừng, bắt nhầm quy ước cột và chuỗi tuần hoàn.
  - `p6-u292` (S4 m1+m2): descent hai biến với bảng loss từng vòng cho nhiều learning rate
    (`cham`/`hoi-tu`/`phan-ky@<vòng>`, có ca loss giảm ở vòng 1 rồi nổ ở vòng 2); hàm không lồi:
    hai đáy theo điểm xuất phát, điểm yên ngựa, cao nguyên.
  - `p6-u293` (S4 m3+m4): backprop mạng 2 tầng 4 tham số (`tanh`), kiểm gradient từng tham số
    bằng sai phân, bản lỗi "quên đạo hàm tanh" lệch đúng `w,b` và bị che tại `z = 0`; hill
    climbing lập lịch hai máy với ba lý do dừng và ca cực trị cục bộ khác tối ưu toàn cục.
- `curriculum.ts`: 4 unit ngay sau `p6-u161`. `lessons.ts`: đăng ký. `lessonsLazy.ts`: sinh lại
  (693 bài · 318 unit).
- `stageUnits.ts`: S3 = `p6-u158, p6-u159, p6-u290, p6-u291`; S4 = `p6-u160, p6-u161, p6-u292,
p6-u293` (unit cũ đứng đầu). `stageUnits.test.ts` cập nhật theo.
- Test ngữ nghĩa mới `mathforcodeS34ExtraLessons.test.ts`: id/ánh xạ/vị trí curriculum, 8 id bài cũ
  vẫn tra được, mỗi bài có topic + nhãn biên thật trong test-case, ca ẩn fail-closed, nhãn MÔ
  PHỎNG + "không phải … thật", cấm numpy/torch/random/time.

## Quyết định

- Giữ nguyên 8 bài cũ và id của chúng; bài mới chỉ dạy topic chưa phủ, không viết lại.
- Mỗi unit gộp m1+m2 hoặc m3+m4 giống tiền lệ `p6-u158…u161`, nên mỗi module có đúng 2 bài.
- Không đụng quiz chặng và lộ trình `principal-ai`: quiz là 5 câu/chặng, lộ trình chỉ trỏ
  `stageId`, không có ràng buộc số unit (đã đọc `stageQuizzes.ts`, `stageQuizzes.test.ts`,
  `learningPaths/principal-ai.ts`).
- Trạng thái `completed` của chặng là trạng thái chốt (`specProgressService.ts`), nên học viên đã
  xong S3/S4 không bị kéo lùi khi chặng có thêm unit.

## Kiểm chứng

Chạy trong worktree, ngày 2026-10-09:

- `npx vitest run packages/subject-programming` → 94 file, 7574/7574 test xanh (gồm
  `lessonsPython.test.ts` chạy python3 thật: 8 bài mới đạt hết test-case, ví dụ mẫu chạy được,
  đáp án Predict khớp output thật).
- Sau khi Prettier định dạng lại: 19 file liên quan (lessonsPython, lessons, lessonsLazy, srsCards,
  specializations, learningPaths, trang `apps/dhcb/src/pages/subjects/programming`) → 4417/4417
  xanh; `npx vitest run scripts` → 52 file, 612/612 xanh.
- `npm run typecheck` thoát 0 · `npm run lint` thoát 0 (0 cảnh báo) · `npm run format:check` "All
  matched files use Prettier code style!".
- `npx tsx scripts/audit-prose.ts --ci` → 0 lỗi (riêng 4 file bài mới: 0 lỗi, 2 cảnh báo
  "hai khoảng trắng liền nhau" ở dòng Parsons thụt lề — là code, không phải văn xuôi).
- `npm run check:specs` → "đã kiểm 163 đặc tả, không có đường dẫn thiếu".

## Không làm

- Không đổi rubric dự án/artifact của chặng, không thêm quiz, không đụng giao diện hay CSDL.
