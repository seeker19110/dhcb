# Đặc tả: Bảng thứ nguyên biến cho câu Vật lí của ngân hàng đề Bảng nháp STEM

**Trạng thái:** Approved for implementation — chủ dự án uỷ quyền "làm tất cả" trong phiên
2026-10-09 (giao qua coordinator, đợt `0560`; trả mục (1) của nợ 🟡 "Bảng nháp STEM" trong
`PROGRESS.md`).

**Nền:** `docs/specs/2026-10-09-kiem-thu-nguyen-vat-li.md` (đợt `0552` — bộ kiểm thứ nguyên + hợp
đồng `StemVariableTableSchema`) và `docs/specs/2026-10-09-stem-goi-y-socratic-va-nop-loi-giai.md`
(đợt `0551` — ngân hàng đề thật, mở phiên bằng `questionId`).

---

## 0. Một câu

Câu Vật lí lấy từ ngân hàng đề mở trong Bảng nháp STEM mang sẵn bảng thứ nguyên biến của chính câu
đó, để `checkPhysicsStep` bắt được bước lệch thứ nguyên thay vì luôn trả "chưa tự kiểm được".

## ① Phạm vi

**LÀM:**

- Trường tuỳ chọn `variables` cho câu "Tự kiểm tra" Vật lí (`PhysicsCheckQuestionSchema`), dùng lại
  đúng `StemVariableTableSchema` của `@dhcb/core-contracts/stemScratchpad` (không khai schema song
  song — `subject-physics` đã tham chiếu `core-contracts`). Câu trắc nghiệm không được có `variables`.
- Khai bảng cho câu Vật lí của ngân hàng (câu không phải `choice`, không phải "Nhập 1 nếu…") trong
  `packages/subject-physics/lessons/*.ts`, theo luật soạn ở §⑥.
- Ngân hàng (`buildStemQuestionBank`) mang `variables` của câu sang `StemQuestion` (chỉ ở server).
- `create_problem { questionId }` gắn `variables` của câu vào `StemProblemState`. Client không gửi
  bảng; bảng client gửi kèm `questionId` bị bỏ qua.
- Test: quét toàn bộ ngân hàng (phủ, đọc được khoá, bước đúng không bị báo lệch, bước sai bị bắt) +
  luồng API.

**KHÔNG LÀM (quan trọng ngang mục trên):**

- **Không thêm UI.** Giao diện chỉ mở đề từ ngân hàng (`createStemProblemFromBankApi(questionId)`),
  không có luồng tạo đề tự do → không cần gửi `variables`. Ô nhập bảng biến cho đề tự do là việc
  khác (cần Tầng 8b), ghi nợ.
- **Không đưa `variables` vào bản công khai của danh sách đề** (`toPublicStemQuestion`,
  `StemBankQuestionPublicSchema` giữ nguyên): màn chọn đề không dùng tới. Phiên đã mở vẫn mang
  bảng (trường có từ `0552`) — bảng là ký hiệu → đơn vị, không phải đáp án.
- **Không đoán.** Ký hiệu chưa rõ nghĩa trong bài thì không khai; câu không có thứ nguyên để kiểm
  (số đếm, tra hằng số) thì không khai bảng.
- Không sửa bộ kiểm `stepCheckPhysics.ts` / `dimension.ts`, không sửa đề, đáp án, lời giải của bài
  học; không kiểm vector/chiều, đạo hàm/tích phân; không thêm thư viện.

## ② Điểm chạm

| Việc | Đường dẫn file                                               | Ghi chú                                                   |
| ---- | ------------------------------------------------------------ | --------------------------------------------------------- |
| Sửa  | `packages/subject-physics/lessonTypes.ts`                    | `variables: StemVariableTableSchema.optional()` + refine  |
| Sửa  | `packages/subject-physics/lessons/ly10c2.ts`                 | bảng biến (tương tự 16 file chương còn lại bên dưới)      |
| Sửa  | `packages/subject-physics/lessons/ly12c2.ts`                 | bảng biến — có `V`/`T` gốc cho lối viết `V1/T1`           |
| Sửa  | `packages/subject-physics/lessons/lyhsgnhietdientu.ts`       | bảng biến chuyên đề HSG                                   |
| Sửa  | `packages/core-ai/stemQuestionBank.ts`                       | `StemLessonSource`/`StemQuestion` mang `variables?`       |
| Sửa  | `packages/core-ai/stemQuestionBank.test.ts`                  | bảng trùng bài học; bản công khai không có `variables`    |
| Thêm | `packages/core-ai/stemQuestionBank.physicsVariables.test.ts` | phủ · đọc khoá · bước đúng/sai theo lời giải từng câu     |
| Sửa  | `packages/core-ai/stemScratchpadService.physics.test.ts`     | quét ngân hàng: câu có bảng thì khớp vẫn không ✓          |
| Sửa  | `apps/server/src/api/learning/stem-scratchpad.ts`            | `create_problem { questionId }` gắn `variables` của câu   |
| Sửa  | `apps/server/src/api/learning/stem-scratchpad.test.ts`       | câu có bảng → `dimension_mismatch`; câu không bảng như cũ |
| Sửa  | `.claude/skills/stem-science-reasoning-master/SKILL.md`      | mô tả nguồn bảng biến + luật soạn (bản gương `.agents/`)  |

**Ảnh hưởng lan ra:** `stemQuestionBank.ts` chỉ được handler `stem-scratchpad.ts` và test dùng;
`PhysicsCheckQuestionSchema` chỉ được `lessons.test.ts` parse (lesson file import KIỂU). Bài học Vật
lí được giao diện trang bài học nạp lười — trường mới không được giao diện đọc, chỉ thêm vài chục
byte mỗi câu. `stemMicroHint.ts` đọc bảng qua `bangBienCuaDe(problem)` nên gợi ý Socratic của câu
ngân hàng tự hưởng bảng mới, không sửa mã.

## ③ Hợp đồng dữ liệu

**Vào (dữ liệu bài học):**

```ts
// PhysicsCheckQuestionSchema — thêm:
variables?: StemVariableTable // = StemVariableTableSchema: ký hiệu → đơn vị, ≤ 64 mục, khoá 1–32, giá trị ≤ 64
// ví dụ (ly10-c2-b8-q1, tàu hãm phanh): { a: 'm/s^2', v: 'm/s', v_t: 'm/s', v_o: 'm/s', v_0: 'm/s', t: 's' }
```

**Ra:** `StemQuestion.variables?` (server); `StemProblemState.variables` của phiên mở bằng
`questionId` = đúng bảng của câu. `StemBankQuestionPublic` KHÔNG đổi. Endpoint không đổi chữ ký.

**Ca lỗi:**

| Tình huống                                        | Kết luận                         | Hành vi mong đợi                                 |
| ------------------------------------------------- | -------------------------------- | ------------------------------------------------ |
| Câu có bảng, bước lệch thứ nguyên chứng minh được | `invalid` · `dimension_mismatch` | `✗ Lệch thứ nguyên` như đề tự do `0552`          |
| Câu có bảng, bước khớp thứ nguyên                 | `unverified` · `none`            | "?" — không bao giờ ✓, không làm bài "giải xong" |
| Câu không bảng (3 câu số đếm)                     | `unverified` · `none`            | "chưa khai bảng thứ nguyên" như trước            |
| Client gửi `variables` kèm `questionId`           | bỏ qua                           | phiên mang bảng của SERVER                       |
| Câu `choice` khai `variables`                     | schema bài học từ chối           | `lessons.test.ts` đỏ                             |

## ④ Tiêu chí chấp nhận

- [x] Mọi câu Vật lí của ngân hàng hoặc có bảng, hoặc nằm trong danh sách bỏ qua có lý do; số câu
      (89 · 86 có bảng · 3 bỏ qua) chốt bằng test —
      `packages/core-ai/stemQuestionBank.physicsVariables.test.ts`.
- [x] Mọi bảng hợp lệ theo `StemVariableTableSchema`; mọi khoá được bộ kiểm đọc là MỘT ký hiệu có
      đúng thứ nguyên của đơn vị khai (`khoá = khoá` → `consistent`, thứ nguyên khớp
      `parseUnitExpression`) — cùng file.
- [x] Mỗi câu có bảng có ≥ 1 bước ĐÚNG lấy từ `explain` của chính câu: không bước nào bị
      `mismatch`/`conditional_mismatch`/`division_by_zero`, bước công thức đầu tiên `consistent` —
      cùng file (86 câu, 180 bước).
- [x] 12 bước SAI thứ nguyên điển hình (thiếu/thừa t, `I = UR`, `λ = vf`, `F = kq₁q₂/r`…) bị
      `mismatch` nhờ bảng; cùng bước đó khi không có bảng → `unsupported` — cùng file.
- [x] Ký hiệu mơ hồ khai đúng nghĩa của bài (`k` lò xo/Coulomb/số bó sóng, `c` nhiệt dung riêng,
      `E` suất điện động/cường độ điện trường) — cùng file.
- [x] `create_problem { questionId }` của câu có bảng gắn đúng bảng (bỏ qua bảng client gửi), bước
      lệch qua API → `dimension_mismatch`, bước khớp → `unverified`, không giải xong; câu không bảng
      giữ hành vi cũ — `apps/server/src/api/learning/stem-scratchpad.test.ts`.
- [x] Bảng của câu ngân hàng trùng bảng trong bài học; bản công khai không có `variables` —
      `packages/core-ai/stemQuestionBank.test.ts`.

**Lệnh chứng minh:**

```bash
npm run typecheck && npm run lint
npx vitest run packages/core-grading packages/core-ai packages/subject-physics packages/core-contracts \
  apps/server/src/api/learning/stem-scratchpad.test.ts
npm run check:specs
```

## ⑤ Bất biến không được phá

| Bất biến                                                           | Test nào canh nó                                             |
| ------------------------------------------------------------------ | ------------------------------------------------------------ |
| Bước đúng theo lời giải không bao giờ bị báo lệch (✗ hay "nếu…")   | `packages/core-ai/stemQuestionBank.physicsVariables.test.ts` |
| Câu ngân hàng có bảng: khớp thứ nguyên không bao giờ ✓             | `packages/core-ai/stemScratchpadService.physics.test.ts`     |
| Không bảng → không kết luận (không đoán theo tên ký hiệu)          | `packages/core-ai/stemQuestionBank.physicsVariables.test.ts` |
| Bảng do server gắn, client không ghi đè được                       | `apps/server/src/api/learning/stem-scratchpad.test.ts`       |
| Danh sách đề công khai không có đáp án/lời giải (và không có bảng) | `packages/core-ai/stemQuestionBank.test.ts`                  |

## ⑥ Quy ước dự án liên quan — luật soạn bảng biến

- Chỉ khai ký hiệu đề/lời giải dùng rõ ràng, theo đúng NGHĨA của bài. Ký hiệu mơ hồ (`k`, `h`, `e`,
  `R`) và ký hiệu đổi nghĩa theo bài (`E`, `T`, `A`, `λ`, `L`, `N`, `c`) khai lại ở từng câu; bảng
  của câu THẮNG hằng chuẩn (`c` nhiệt dung riêng thắng tốc độ ánh sáng).
- Không chắc nghĩa → bỏ. Thiếu chỉ làm bước đó "chưa tự kiểm được"; khai sai thì báo ✗ oan người
  học đúng.
- Chữ vừa là ký hiệu đơn vị (`V`, `T`, `W`, `N`, `A`, `F`, `C`) mà lời giải viết liền chỉ số
  (`V1/T1`, `U2`, `N1`) → khai cả ký hiệu gốc (`V`, `T`…), không thì `V1` bị đọc là "1 vôn" và bước
  đúng bị hỏi lại "lệch có điều kiện".
- Chỉ số dưới nhiều chữ viết trong ngoặc nhọn (`v_{max}`, `F_{ht}`, `Q_{thu}`) — đúng cách gõ LaTeX;
  chỉ số không phải ASCII (`W_{đ}`) kèm bản ASCII (`W_d`) vì học sinh hay gõ cả hai.
- Đơn vị viết theo bảng của `packages/core-grading/dimension.ts` (`m/s^2`, `kg·m/s`, `J/(kg·K)`,
  `Ω`, `°C`, `rad/s`, `N·m^2/C^2`); `''` = không thứ nguyên.
- Import xuyên gói `@dhcb/<gói>/<file>`; không `any`; comment tiếng Việt.

---

## Nghiệm thu

Xem `docs/changelog/0560-2026-10-09-bang-bien-vat-li-ngan-hang-de.md`.
