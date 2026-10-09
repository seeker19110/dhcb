# Đặc tả — `mathforcode-s3..s4`: bổ sung 4 unit cho đủ 2 bài mỗi module

> Ngày: 2026-10-09 · **Trạng thái:** Approved for implementation (chủ dự án chọn phạm vi trong
> phiên 2026-10-09)
> Khuôn: `docs/templates/dac-ta-tinh-nang.md`. Nối tiếp
> `docs/specs/2026-09-16-mathforcode-s3-s4-bai-hoc-that.md` (đặc tả đã soạn `p6-u158…u161`).
> Nợ được trả: `PROGRESS.md` mục "mathforcode S3/S4 mỏng (2 unit/chặng thay vì 4 như các hướng
> khác)".

## 0. Một câu

Thêm 4 unit / 8 bài Python MÔ PHỎNG, tất định, để chặng `mathforcode-s3` và `mathforcode-s4` mỗi
chặng có 4 unit và mỗi module có 2 bài, dạy đúng các topic của module mà 8 bài cũ chưa phủ.

## ① Phạm vi

**LÀM:**

- Bốn unit mới, mỗi unit hai lesson `language: 'python'` theo khuôn 8 bước (hook, theory, worked
  example, predict, Parsons, make có test hiện + ẩn, homework, thẻ SRS). Mỗi unit gộp hai module
  giống cách `p6-u158…u161` đã gộp, nên sau đợt này mỗi module có đúng 2 bài:
  - `p6-u290` (`mathforcode-s3-m1`, `m2`):
    - `l1` va chạm hai hình tròn, pháp tuyến đơn vị, phản xạ `v − 2(v·n)n`, chỉ phản xạ khi
      `v·n < 0`, hướng di chuyển là vector đã chuẩn hoá.
    - `l2` nhân ma trận bằng tay theo quy ước hàng-cột; ma trận xoay góc bất kì, co giãn,
      phản chiếu; kiểm shape không khớp.
  - `p6-u291` (`mathforcode-s3-m3`, `m4`):
    - `l1` định thức (cofactor), ma trận suy biến, quy tắc Cramer; ứng dụng cân bằng luồng nhiều
      nút: hệ bảo toàn luồng viết cho mọi nút luôn suy biến, thay một phương trình bằng phép đo
      thì có nghiệm duy nhất, nghiệm âm phải cảnh báo.
    - `l2` ma trận chuyển trạng thái (chuỗi Markov) theo quy ước hàng, lặp k bước, trạng thái
      dừng `π·P = π`, kiểm tổng mỗi hàng bằng 1 và bắt lỗi nhầm quy ước cột.
  - `p6-u292` (`mathforcode-s4-m1`, `m2`):
    - `l1` gradient descent hai biến trên `f(w1, w2) = (w1 − 3)² + 5(w2 + 1)²`, so sánh nhiều
      learning rate bằng bảng loss từng vòng, phân loại `phan-ky@<vòng>` / `cham` / `hoi-tu`.
    - `l2` hàm không lồi: cực tiểu địa phương phụ thuộc điểm xuất phát, điểm yên ngựa, cao nguyên
      (gradient gần 0 nhưng không phải cực tiểu), phân loại bằng gradient + độ cong.
  - `p6-u293` (`mathforcode-s4-m3`, `m4`):
    - `l1` lan truyền ngược trên mạng 2 tầng 4 tham số (`tanh` ở tầng ẩn), kiểm gradient từng
      tham số bằng sai phân trung tâm; bản cài lỗi "quên đạo hàm tanh" bị bắt ở đúng `w`, `b`,
      và bị che tại `z = 0`.
    - `l2` lập lịch hai máy bằng hill climbing (lân cận "chuyển một việc"), ba lý do dừng
      `het-ngan-sach` / `cuc-bo` / `cai-thien-nho`, ví dụ cực trị cục bộ khác tối ưu toàn cục.
- Khai 4 unit trong `curriculum.ts` ngay sau `p6-u161`, đăng ký trong `lessons.ts`, sinh lại
  `lessonsLazy.ts`, nối vào `SPEC_STAGE_UNITS` sau các unit cũ.
- Test ngữ nghĩa riêng cho 8 bài mới.

**KHÔNG LÀM:**

- KHÔNG sửa, đổi id hay đổi thứ tự 8 bài cũ `p6-u158-l1…p6-u161-l2`: tiến độ học viên đang gắn
  với id đó (bảng `programming.lesson_progress`).
- KHÔNG dùng NumPy, torch, `random`, `time`, subprocess, network; KHÔNG tuyên bố simulator là
  runtime ML, physics engine, bộ lập lịch hay bộ dự báo production.
- KHÔNG đổi rubric artifact/dự án chặng trong `specializations/mathforcode.ts` và
  `details/mathforcode-s3.ts`, `details/mathforcode-s4.ts`.
- KHÔNG đổi quiz chặng (`learningPaths/stageQuizzes.ts`) hay lộ trình `principal-ai`: quiz đúng
  5 câu/chặng, không ràng buộc số unit; lộ trình chỉ trỏ tới `stageId`.
- KHÔNG đụng schema CSDL, API hay giao diện.

## ② Điểm chạm

| Việc | Đường dẫn file                                                    | Ghi chú                                  |
| ---- | ----------------------------------------------------------------- | ---------------------------------------- |
| Thêm | `packages/subject-programming/lessons/p6u290.ts`                  | 2 bài S3 m1+m2                           |
| Thêm | `packages/subject-programming/lessons/p6u291.ts`                  | 2 bài S3 m3+m4                           |
| Thêm | `packages/subject-programming/lessons/p6u292.ts`                  | 2 bài S4 m1+m2                           |
| Thêm | `packages/subject-programming/lessons/p6u293.ts`                  | 2 bài S4 m3+m4                           |
| Sửa  | `packages/subject-programming/curriculum.ts`                      | 4 unit ngay sau `p6-u161`                |
| Sửa  | `packages/subject-programming/lessons.ts`                         | import + spread sau `P6U161_LESSONS`     |
| Sửa  | `packages/subject-programming/lessonsLazy.ts`                     | sinh lại bằng `npm run gen:lesson-index` |
| Sửa  | `packages/subject-programming/specializations/stageUnits.ts`      | S3/S4 thành 4 unit, unit cũ đứng đầu     |
| Sửa  | `packages/subject-programming/specializations/stageUnits.test.ts` | cập nhật ánh xạ mong đợi                 |
| Thêm | `packages/subject-programming/mathforcodeS34ExtraLessons.test.ts` | cổng ngữ nghĩa 8 bài mới                 |

**Ảnh hưởng lan ra:**

- `ProgrammingPathStagePage.tsx`, `ProgrammingSpecializationPage.tsx`, `ProgrammingPathPage.tsx`
  đọc `unitsOfStage()`: chặng S3/S4 hiện 4 unit thay vì 2, không đổi mã giao diện.
- Trạng thái `completed` của chặng (`programming.spec_stage_progress`) là trạng thái CHỐT
  (`specProgressService.ts`), nên học viên đã xong S3/S4 không bị kéo lùi.
- Cổng chung tự áp lên bài mới: `lessonsPython.test.ts` (chạy python3 thật), `lessons.test.ts`
  (Zod, unit tồn tại), `srsCards.test.ts`, `lessonsLazy.test.ts`, `scripts/audit-prose.ts`.

## ③ Hợp đồng dữ liệu

**Vào:** mỗi bài là một `ProgrammingLesson` (`packages/subject-programming/lessonTypes.ts`), Make
đọc stdin dòng theo đề.

**Ra:**

```ts
const MATH_S3_UNIT_IDS = ['p6-u158', 'p6-u159', 'p6-u290', 'p6-u291'] as const
const MATH_S4_UNIT_IDS = ['p6-u160', 'p6-u161', 'p6-u292', 'p6-u293'] as const
```

**Ca lỗi (là một phần hợp đồng):**

| Tình huống                                                  | Nhãn đầu ra                                       | Hành vi mong đợi                           |
| ----------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------ |
| Mọi bài: thiếu số, chữ thay số, NaN/inf, tham số ngoài miền | `input-khong-hop-le`                              | dừng, không tính tiếp                      |
| Hai tâm trùng nhau                                          | `tam-trung-nhau`                                  | không chia cho khoảng cách 0               |
| Bóng đã đang tách khỏi vật cản (`v·n ≥ 0`)                  | `reflect=skip-separating`                         | không phản xạ lần hai                      |
| Số cột A khác số hàng B                                     | `shape-khong-khop:<m>x<n>*<n2>x<p>`               | không tính tích                            |
| `abs(det) < 1e-9`                                           | `suy-bien`                                        | không chia cho định thức                   |
| Nghiệm luồng âm                                             | `canh-bao-luong-am=<chỉ số>`                      | vẫn in nghiệm, kèm cảnh báo                |
| Hàng ma trận chuyển có số âm / tổng khác 1                  | `xac-suat-am:<i>` / `hang-khong-tong-1:<i>`       | không lặp                                  |
| Phân bố đầu âm hoặc tổng khác 1                             | `phan-bo-dau-khong-hop-le`                        | không lặp                                  |
| Loss tăng ở một vòng                                        | `lr=<lr>->phan-ky@<vòng>`                         | dừng lr đó, loại khỏi `lr-tot-nhat`        |
| Toạ độ vượt `1e6` khi descent                               | `phan-ky`                                         | dừng, không phân loại điểm                 |
| Gradient giải tích lệch sai phân quá tolerance              | `grad-<tên>=…\|kiem=lech`, `tong-ket=lech:…`      | chỉ đúng tham số lỗi                       |
| Hết ngân sách / không bước nào giảm / giảm dưới ngưỡng      | `dung=het-ngan-sach` / `cuc-bo` / `cai-thien-nho` | dừng đúng lý do, không áp bước dưới ngưỡng |

## ④ Tiêu chí chấp nhận

- [ ] 4 unit / 8 bài Python, mỗi bài có ≥ 1 test hiện và ≥ 1 test ẩn, có ca ẩn
      `input-khong-hop-le` — `npx vitest run packages/subject-programming/mathforcodeS34ExtraLessons.test.ts`.
- [ ] `sampleSolution` đạt mọi test-case, ví dụ mẫu chạy không lỗi, đáp án Predict khớp output
      thật — `npx vitest run packages/subject-programming/lessonsPython.test.ts`.
- [ ] `unitsOfStage('mathforcode-s3')` = `['p6-u158','p6-u159','p6-u290','p6-u291']`, S4 =
      `['p6-u160','p6-u161','p6-u292','p6-u293']` — `stageUnits.test.ts`.
- [ ] 8 id bài cũ vẫn tra được — `mathforcodeS34ExtraLessons.test.ts`.
- [ ] Chỉ mục lười đồng bộ — `lessonsLazy.test.ts` sau `npm run gen:lesson-index`.
- [ ] Không lỗi câu chữ mức LỖI — `npx tsx scripts/audit-prose.ts --ci`.

**Lệnh chứng minh:**

```bash
npm run gen:lesson-index
npx vitest run packages/subject-programming
npm run typecheck && npm run lint && npm run format:check
npx tsx scripts/audit-prose.ts --ci && npm run check:specs
```

## ⑤ Bất biến không được phá

| Bất biến                                           | Test nào canh nó                                                  |
| -------------------------------------------------- | ----------------------------------------------------------------- |
| Id 8 bài cũ không đổi, unit cũ đứng đầu mảng chặng | `packages/subject-programming/mathforcodeS34ExtraLessons.test.ts` |
| 8 bài cũ vẫn đúng hợp đồng của đợt trước           | `packages/subject-programming/mathforcodeS34Lessons.test.ts`      |
| Code mẫu chạy thật đạt mọi test-case               | `packages/subject-programming/lessonsPython.test.ts`              |
| Mọi unit P6 có bài, mọi bài khớp Zod               | `packages/subject-programming/lessons.test.ts`                    |
| Ánh xạ chặng chỉ trỏ tới unit có thật              | `packages/subject-programming/specializations/stageUnits.test.ts` |

## ⑥ Quy ước dự án liên quan

- Thêm/đổi bài học xong PHẢI chạy `npm run gen:lesson-index` (app chỉ nạp `lessonsLoader`).
- Import nội bộ gói dùng đường tương đối có đuôi `.js`.
- Nhãn đầu ra máy chấm không dấu (`input-khong-hop-le`); chữ cho người học đọc có dấu đầy đủ.
- Thẻ SRS: một ý mỗi thẻ, đáp án ≥ 40 ký tự, không trùng câu hỏi với bài khác (`srsCards.test.ts`).

---

## Nghiệm thu (bên giao việc điền SAU khi nhận kết quả)

- Lệnh đã chạy + kết quả thật:
- Tiêu chí ④ đạt hết chưa; cái nào chưa và vì sao:
- Có phá bất biến ⑤ nào không:
- Có mở rộng ngoài phạm vi ① không:
- Còn để ngỏ:
