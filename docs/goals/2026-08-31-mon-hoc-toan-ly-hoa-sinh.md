# Goal: Nội dung bài học Toán/Lý/Hoá/Sinh (GĐ3, bắt đầu bằng Hoá học)

| Thuộc tính        | Giá trị                                                                          |
| ----------------- | -------------------------------------------------------------------------------- |
| Goal ID           | GOAL-2026-002                                                                    |
| Owner             | seeker19110 (chuyên môn/nội dung); AI thực thi từng slice, tuân `AGENTS.md`      |
| Trạng thái        | ACTIVE                                                                           |
| Bắt đầu           | 2026-08-31                                                                       |
| Target review     | chưa đặt — dự án nhiều tháng, review theo từng slice PR                          |
| Quyền được cấp    | Research, branch, PR. Chưa có quyền merge/deploy/duyệt chuyên môn thay giáo viên |
| Budget/guardrails | 1 slice nhỏ nhất/PR; không migration DB sớm; không AI trong luồng chấm           |

## 1. Outcome và Definition of Goal Complete

- Outcome: 4 môn Toán, Vật lí, Hoá học, Sinh học có bài học hoàn chỉnh, có cấu trúc dữ liệu +
  engine chấm dùng chung (đã khôi phục `packages/core-grading`), bám đúng thứ tự chương/bài SGK
  "Kết nối tri thức" (đối chiếu bằng ảnh scan trong `tai-lieu-sgk/`, không commit).
- Người dùng: học sinh cấp 2-3 muốn học/ôn 4 môn này trên app, khớp đúng bài đang học trên lớp.
- Metric baseline → target: 0 bài học hiện có (2 package `subject-*` chỉ có English +
  Programming) → mục tiêu dài hạn: đủ bài cho khung chương trình đã đối chiếu SGK ở
  `docs/research/kho-kien-thuc-*-gdpt2018.md`.
- Cửa sổ đo: theo từng slice PR, không có deadline cứng.
- Guardrails: **nội dung kiến thức trong `docs/research/kho-kien-thuc-*.md` CHƯA DUYỆT CHUYÊN
  MÔN** — mọi bài học sinh ra từ các file này phải gắn cờ "cần giáo viên duyệt" (ghi ở
  PROGRESS.md, không chặn code nhưng không được coi là final). AI không chấm đúng/sai — mọi bài
  chấm được phải qua `packages/core-grading` (thuần, tất định, không gọi AI).
- Completion approver: seeker19110 (quyết định phạm vi mỗi đợt + duyệt chuyên môn cuối).

## 2. Scope và non-goals

### In scope

- Khôi phục `packages/core-grading` (DONE — xem Iteration 1).
- `packages/subject-chemistry`: dữ liệu nền (bảng tuần hoàn, bảng tính tan) + bài học 10-12 theo
  khuôn 8 bước tương tự `subject-programming/lessonTypes.ts`, thích nghi cho Hoá (câu hỏi chấm
  bằng `AnswerSpec` của core-grading: `chemFormula`, `chemEquation`, `numeric`...).
- Sau khi Hoá xong: Vật lí (engine đơn vị/dung sai), rồi Sinh (SRS, PA B).
- Toán làm ở đợt riêng (đã có SGK đầy đủ 1-12, khối lượng lớn hơn nhiều).

### Không làm

- Không migrate DB / đổi API công khai trong các slice ban đầu.
- Không tự ý duyệt chuyên môn thay giáo viên — chỉ đánh dấu rõ trạng thái nháp.
- Không dùng AI để chấm đúng/sai bài có đáp án xác định (đúng nguyên tắc `core-grading`).
- Không viết bài "Thực hành" (không có đáp số chấm được) trong đợt MVP.

## 3. Milestones và slices

| ID    | Outcome/AC                                                                                                                                       | Dependency     | State       | Evidence                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ----------- | --------------------------------------------------------------------------------------- |
| M1/S1 | Khôi phục `packages/core-grading`, 86 test pass, typecheck sạch                                                                                  | —              | DONE        | `git checkout 4a44a62 -- packages/core-grading`, `npx vitest run packages/core-grading` |
| M1/S2 | `packages/subject-chemistry` khung + dữ liệu nền (bảng tuần hoàn, bảng tính tan, parser)                                                         | M1/S1          | DONE        | 92 test pass toàn package                                                               |
| M1/S3 | Hoá 10 Chương 1 (4 bài: Mở đầu, Thành phần nguyên tử, Nguyên tố hoá học, Cấu trúc lớp vỏ electron)                                               | M1/S2          | DONE        | `docs/changelog/0211-*.md`                                                              |
| M1/S4 | Hoá 10 Chương 2-7 (13 bài còn lại: Bảng tuần hoàn 4, Liên kết 4, Oxi hoá-khử 1, Năng lượng 1, Tốc độ phản ứng 1, Halogen 2)                      | M1/S3          | DONE        | `docs/changelog/0211-*.md`, 17/17 bài Hoá 10 xong                                       |
| M2/S1 | Hoá 11 (25 bài: Cân bằng hoá học 3, Nitrogen-Sulfur 6, Đại cương hữu cơ 5, Hydrocarbon 4, Dẫn xuất-Alcohol-Phenol 4, Carbonyl-Carboxylic acid 3) | M1 xong        | DONE        | `docs/changelog/0212-*.md`, 25/25 bài Hoá 11 xong                                       |
| M2/S2 | Hoá 12 (30 bài)                                                                                                                                  | M2/S1          | DONE        | `docs/changelog/0213-*.md`, 30/30 bài Hoá 12 xong                                       |
| M3/S1 | Vật lí 10 (34 bài)                                                                                                                               | M2 xong        | DONE        | `docs/changelog/0214-*.md`, 34/34 bài Vật lí 10 xong                                    |
| M3/S2 | Vật lí 11 (26 bài)                                                                                                                               | M3/S1          | DONE        | `docs/changelog/0215-*.md`, 26/26 bài Vật lí 11 xong                                    |
| M3/S3 | Vật lí 12 (25 bài)                                                                                                                               | M3/S2          | DONE        | `docs/changelog/0216-*.md`, 25/25 bài Vật lí 12 xong                                    |
| M4    | Sinh 10-12 (PA B, SRS)                                                                                                                           | M3 xong        | IN_PROGRESS |                                                                                         |
| M5    | Toán 1-12 (đợt riêng, khối lượng lớn nhất)                                                                                                       | song song được | IN_PROGRESS | THCS: đặc tả `docs/specs/2026-10-10-toan-thcs-6-9.md`; Toán 6 xong (`0576`)             |

## 4. Risk register

| Risk                                                              | Trigger/guardrail                           | Mitigation/rollback                                          | Owner       | State    |
| ----------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------ | ----------- | -------- |
| Nội dung kiến thức sai (kho kiến thức chưa duyệt chuyên môn)      | Bất kỳ bài nào sinh từ `kho-kien-thuc-*.md` | Đánh dấu nháp, không public mặc định tới khi giáo viên duyệt | seeker19110 | OPEN     |
| Khối lượng bài học rất lớn (Toán ~500+ bài, Lý/Hoá/Sinh ~250 bài) | Không xong trong 1 phiên                    | Chia nhỏ theo chương, mỗi PR 1 chương                        | AI          | OPEN     |
| `core-grading` khôi phục có thể lệch API với code hiện tại        | Build/typecheck lỗi sau khi khôi phục       | Đã chạy `tsc -b` + `vitest run` xác nhận sạch                | AI          | RESOLVED |

## 5. Current truth

> **[2026-09-21] §5/§6 dưới đây LỖI THỜI (dừng ở 2026-09-01) trong khi §3 đã ghi M3 (Vật lí
> 10-12) DONE và M4 (Sinh) IN_PROGRESS — cập nhật lại khi rà nợ kỹ thuật định kỳ.** Bảng milestone
> ở §3 là nguồn đúng hơn; các dòng dưới đây giữ nguyên văn cũ để không mất dấu vết, chỉ bổ sung
> đoạn xác nhận mới.

- Commit `main` đã reconcile: `e4ace50` (2026-08-31).
- Goal gap hiện tại: Đã hoàn thành 100% môn Hoá học (72 bài học cho các lớp 10, 11, 12).
- Blocker/câu hỏi mở: chưa có giáo viên duyệt nội dung kiến thức — theo quyết định người dùng, vẫn tạo bài học từ bản thảo, đánh dấu rõ cần duyệt sau (`reviewStatus: 'draft'`).
- Next best slice: M3 — Vật lí 10-12 (85 bài).
- Quyền hoặc quyết định cần thêm: không có, tiếp tục đợt tiếp theo với môn Vật lí.

**[2026-09-21] Xác nhận lại bằng cách đọc mã thật (không suy đoán):**

- M3 (Vật lí 10-12, 85 bài) đã DONE — khớp §3, changelog `0214`/`0215`/`0216` (2026-09-01, lưu ý
  trùng số với 3 changelog khác ngày 2026-08-31 của môn Lập trình — không phải lỗi gõ, hai đợt
  việc song song từng lấy trùng số thứ tự).
- M4 (Sinh 10-12) **ĐANG DỞ, không phải chưa bắt đầu**: `packages/subject-biology/lessons/`
  có 9 file chương thật (`sinh10c1..c4`, `sinh11c1..c2`, `sinh12c1..c3`) — Sinh 10 đủ 4 chương,
  Sinh 11/12 mới một phần. **Không tìm thấy changelog nào ghi lại đợt soạn bài Sinh học** (đã
  `grep` toàn bộ `docs/changelog/`) — vi phạm quy trình bắt buộc ở CLAUDE.md mục 3 ("tạo PR =
  coi như đã xong" đòi một file changelog mỗi đợt). Không rõ đây là nợ tài liệu (quên viết
  changelog) hay nội dung được ghi thẳng ngoài quy trình PR thường — cần chủ dự án xác nhận số
  chương Sinh 11/12 còn thiếu trước khi giao tiếp phần còn lại của M4.
- Next best slice thật: hoàn tất phần Sinh 11/12 còn thiếu của M4, VÀ bổ sung changelog còn
  thiếu cho phần Sinh học đã làm (để không lặp lại khoảng trống bằng chứng này).

## 6. Iteration log

### Iteration 1 — 2026-08-31

- State: DONE (M1/S1)
- Slice: Khôi phục `packages/core-grading` từ git history.
- Goal gap trước/sau: trước — engine chấm không tồn tại trong repo; sau — engine chấm hoạt động, 86 test pass, gắn lại vào `tsconfig.packages.json`.
- Research/spec/issue/PR: dùng lại đặc tả cũ `docs/research/dac-ta-engine-cham-dung-chung.md`.
- Thay đổi: `git checkout 4a44a62 -- packages/core-grading`; thêm reference vào `tsconfig.packages.json`.
- Validation và test count: `npx vitest run packages/core-grading` → 86/86 pass; `npx tsc -b packages/core-grading` → sạch.
- Metric/guardrail: không đổi contract nào đang chạy production.
- Quyết định: tiếp tục theo Hoá học trước (đã chốt trong `kho-kien-thuc-hoa-gdpt2018.md`).
- Blocker: không.
- Next best slice: M1/S2.
- Quyền cần thêm: không.

### Iteration 2 — 2026-08-31

- State: DONE (M1/S2, M1/S3, M1/S4, M2/S1)
- Slice: Thiết lập `packages/subject-chemistry`, soạn đủ 17 bài học Hoá 10 và 25 bài học Hoá 11.
- Goal gap trước/sau: đã phủ toàn bộ kiến thức Hoá 10 và 11 bám sát mục lục SGK thật, tất cả bài học qua kiểm chứng tự động.
- Research/spec/issue/PR: PR #782 và PR #785.
- Validation và test count: `npx vitest run packages/subject-chemistry` → pass 100% (6/6 tests).
- Next best slice: M2/S2 (Hoá 12).

### Iteration 3 — 2026-09-01

- State: DONE (M2/S2)
- Slice: Soạn đủ 30 bài học Hoá 12 (Chương 1-8), tích hợp vào registry, format & lint sạch sẽ.
- Goal gap trước/sau: hoàn tất toàn bộ môn Hoá học cấp 3 (lớp 10, 11, 12).
- Research/spec/issue/PR: PR #785 đã cập nhật thêm Hoá 12.
- Validation và test count: `npx vitest run packages/subject-chemistry` → 6/6 tests pass (72/72 bài học).
- Next best slice: M3 (Vật lí 10-12).

## 7. Final audit

Chưa tới — goal đang ACTIVE, còn nhiều milestone mở.
