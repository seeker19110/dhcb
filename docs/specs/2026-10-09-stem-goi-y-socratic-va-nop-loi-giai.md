# Đặc tả: Bảng nháp STEM — gợi ý Socratic, ngân hàng đề thật, nộp lời giải, bố cục 390px

**Trạng thái:** Approved for implementation — coordinator giao đợt `0551` (2026-10-09) để trả ba
mục còn lại (3)(4)(5) của nợ 🟡 "Bảng nháp STEM" trong `PROGRESS.md`, theo hướng "chất lượng cao
nhất" chủ dự án đã duyệt cho đợt `0547`.

**Nền:** changelog `0473` (bảng nháp thôi khen sai), `0539` (`submit_solution` chấm theo giá trị),
`0547` (bộ kiểm bước Toán một ẩn + cân bằng PTHH, đặc tả
`docs/specs/2026-10-09-kiem-buoc-giai-stem.md`). Skill `stem-science-reasoning-master` §2–§3.

---

## 0. Một câu

Bảng nháp STEM gợi ý bằng **câu hỏi dẫn dắt** (không bao giờ đưa nghiệm), lấy đề từ **ngân hàng đề
thật** của bài học Toán · Lí · Hoá, cho người học **nộp đáp số** để máy chấm, và hàng nhập không còn
chật ở màn 390px.

## ① Phạm vi

**LÀM:**

- (3) **Gợi ý Socratic:** `generateMicroHint` trả `{ hintText, level }` — luôn là câu hỏi, chọn theo
  kết luận của chính bộ kiểm `0547` cho bước cuối (`checkMathStep` / `checkChemStep` chạy lại) và
  theo **hình dạng** bước khi bước hợp lệ (`describeMathStep` mới: còn hạng tử gộp được, còn ngoặc,
  ẩn ở hai vế, mẫu chứa ẩn, hệ số khác 1…). Ba bậc của skill §3: chưa có bước → bậc 1 (khái niệm);
  bước hợp lệ → bậc 2 (cấu trúc); bước sai → bậc 3 (chỉ đúng chỗ sai, vd mất ĐKXĐ → hỏi điều kiện
  xác định). Bỏ hẳn `suggestedFormula` (nơi từng lộ `x = \frac{10}{2} = 5`).
- (4a) **Ngân hàng đề thật:** thay 60 câu dữ liệu mẫu (`P_{2} = 10x + 0` / `S_{2} = 0`) bằng các câu
  "Tự kiểm tra" (`checkQuestions`) của bài học Toán · Lí · Hoá đã có trong repo, **giữ nguyên văn**
  đề + `AnswerSpec` + lời giải. Lọc: bỏ trắc nghiệm (`choice`) và câu đúng/sai mã hoá thành số
  ("Nhập 1 nếu ĐÚNG…"). Kết quả đo ngày 2026-10-09: **272 câu** (Toán 127 · Lí 89 · Hoá 56;
  numeric 261 · fraction 10 · chemFormula 1; 82 câu bắt buộc đơn vị). Mọi câu đều máy chấm được
  (test chấm đáp án chuẩn của từng câu).
- (4b) **Nộp lời giải:** phiên mở từ `questionId` (server tự tra đề), `submit_solution` chấm theo
  `prob.questionId` bằng `gradeAnswer(finalValueText(…), AnswerSpec của bài học)`; trả `correct`,
  `reason`, và `explanation` **chỉ khi đã giải đúng**. Giao diện có ô "Đáp số cuối" + nút "Nộp lời
  giải" với trạng thái đang chấm / sai (câu nhắc theo mã lý do, không nêu đáp số) / đúng (hiện lời
  giải của bài học, khoá ô nhập) / lỗi mạng.
- (4c) Đề lời văn không có phương trình → **bước 1 là mốc**: các bước sau so tập nghiệm với bước 1,
  phản hồi nói "so với bước 1 của em" (không nói "khớp đề bài"), và **không bao giờ** `isFinalAnswer`
  (bước 1 có thể đã sai so với đề). "Giải xong" của bài ngân hàng chỉ đến từ `submit_solution`; bài
  có phương trình đề (`problemLatex`) vẫn "giải xong" bằng `valid` + `isFinalAnswer` như `0547`.
- (5) **Bố cục mobile-first:** hàng nhập bước ở 390px thành ô nhập một hàng + hai nút một hàng;
  mọi nút hành động `min-h-11` (44px) + `whitespace-nowrap`; tab môn `min-h-11`; không tràn ngang.
- Lỗi mạng của kiểm bước / gợi ý / tải đề / mở phiên hiện ra cho người học (`role="alert"`), thay
  cho `console.error` im lặng; tải đề có trạng thái tải/lỗi + "Thử lại"/rỗng.

**KHÔNG LÀM (quan trọng ngang mục trên):**

- Không kiểm thứ nguyên bước giữa môn Vật lí, không mở rộng bộ kiểm Toán (căn, lượng giác, log,
  bất phương trình, nhiều ẩn, dấu `:`) — vẫn là nợ (1)(2) của `PROGRESS.md`.
- Không trích phương trình từ lời đề để làm mốc tự động (đoán sai thì thành kiểm giả).
- Không đưa Sinh học vào bảng nháp (giao diện không có tab, bộ kiểm chưa hỗ trợ).
- Không thêm thư viện, không đổi `apps/dhcb/src/prompts/*`, không đổi CSDL (dữ liệu vẫn ở JSONB
  `platform.feature_state`, `questionId` là trường tuỳ chọn mới trong JSON — không migration).
- Không gọi AI: gợi ý và chấm đều tất định (không tốn lượt AI, không cần `checkAndConsumeUsage`).
- Không render LaTeX (skill §4).

## ② Điểm chạm

| Việc | Đường dẫn file                                                         | Ghi chú                                                         |
| ---- | ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| Sửa  | `packages/core-grading/stepCheckMath.ts`                               | thêm `describeMathStep` (hình dạng bước, không nghiệm)          |
| Thêm | `packages/core-ai/stemMicroHint.ts`                                    | `generateSocraticHint` — gợi ý câu hỏi theo bộ kiểm + hình dạng |
| Thêm | `packages/core-ai/stemMicroHint.test.ts`                               | bất biến "không lộ nghiệm" (nghiệm lấy bằng bộ kiểm)            |
| Sửa  | `packages/core-ai/stemScratchpadService.ts`                            | mốc bước 1; bỏ `DAP_SO_DE_MAU`/`khopDapSo`; `questionId`        |
| Sửa  | `packages/core-ai/stemQuestionBank.ts`                                 | dựng ngân hàng từ bài học thật; bản công khai không đáp án      |
| Sửa  | `packages/core-contracts/stemScratchpad.ts`                            | `questionId`, câu công khai, gợi ý, kết quả nộp, câu nhắc       |
| Sửa  | `apps/server/src/api/learning/stem-scratchpad.ts`                      | `get_questions` Zod; mở phiên từ ngân hàng; chấm theo câu       |
| Sửa  | `apps/dhcb/src/lib/stemScratchpadApi.ts`                               | API ngân hàng/mở phiên/nộp, validate Zod                        |
| Sửa  | `apps/dhcb/src/components/StemScratchpad/StemScratchpadModal.tsx`      | đề ngân hàng, "Đề khác", nộp lời giải, bố cục 390px, báo lỗi    |
| Thêm | `apps/dhcb/src/components/StemScratchpad/StemScratchpadModal.test.tsx` | DOM thật: tải/lỗi/rỗng, nộp sai/đúng/lỗi, gợi ý                 |

**Ảnh hưởng lan ra (theo codemap):** `stemQuestionBank.ts` và `stemScratchpadService.ts` chỉ được
handler `stem-scratchpad.ts` dùng; `stemScratchpadApi.ts` chỉ được modal dùng; hợp đồng
`stemScratchpad.ts` thêm trường/khai báo mới (tương thích ngược với bản ghi cũ — `questionId` tuỳ
chọn). Handler nay import `@dhcb/subject-{math,physics,chemistry}/lessons` (server, giống
`evidence.ts`), không vào bundle client.

## ③ Hợp đồng dữ liệu

**Vào:**

```ts
GET  /api/stem-scratchpad?action=get_questions&subject?&grade?('10'|'11'|'12')&track?('core'|'advanced')&limit?(1..500, mặc định 20)
POST /api/stem-scratchpad?action=create_problem   { questionId: string }        // mở phiên từ ngân hàng
POST /api/stem-scratchpad?action=get_hint         { problemId: string }
POST /api/stem-scratchpad?action=submit_solution  { problemId: string, finalAnswer: string }
```

**Ra:**

```ts
get_questions   → { success: true, questions: StemBankQuestionPublic[], total: number } // KHÔNG answer/explain
create_problem  → { success: true, problem: StemProblemState & { questionId?: string } }
get_hint        → { success: true, hint: { hintText: string; level: 1 | 2 | 3 }, hintsUsed: number }
submit_solution → { success: true, isSolved: boolean, correct: boolean, reason: SubmitReason,
                    explanation?: string /* chỉ khi isSolved */ }
```

**Ca lỗi (là một phần hợp đồng, không phải phụ lục):**

| Tình huống                                             | Mã lỗi | Hành vi mong đợi                                       |
| ------------------------------------------------------ | ------ | ------------------------------------------------------ |
| `get_questions` tham số sai (môn lạ, lớp 13, limit)    | 400    | "Tham số lọc không hợp lệ", không âm thầm bỏ qua       |
| GET không `action`, không `problemId`                  | 400    | "Invalid action parameter" (3 bài mẫu viết cứng đã gỡ) |
| `create_problem` `questionId` rỗng / không chuỗi       | 400    | không tạo phiên                                        |
| `create_problem` `questionId` không có trong ngân hàng | 404    | không tạo phiên                                        |
| `submit_solution` phiên không thuộc ngân hàng đề       | 409    | `NO_ANSWER_KEY` — không đoán đúng/sai                  |
| `submit_solution` `finalAnswer` không phải chuỗi       | 400    | như `0539`                                             |
| Nộp sai                                                | 200    | `correct:false` + `reason`, KHÔNG có `explanation`     |
| Lỗi mạng ở client                                      | —      | `role="alert"` + cách xử lý, không đánh dấu xong       |

## ④ Tiêu chí chấp nhận

- [x] Mọi gợi ý cho bộ đề mẫu (6 phương trình Toán × nhiều chuỗi bước đúng/sai, có/không đề; 3
      PTHH) KHÔNG chứa nghiệm/bộ hệ số — nghiệm lấy bằng chính `checkMathStep`/`checkChemStep` —
      và luôn là câu hỏi — `packages/core-ai/stemMicroHint.test.ts`.
- [x] Gợi ý đúng loại: mất ĐKXĐ → hỏi điều kiện xác định; còn hạng tử gộp được → "gộp được";
      chuyển vế sai dấu → hỏi dấu; chia cho 0; lỗi từ bước trước → `stemMicroHint.test.ts`.
- [x] Ngân hàng: mọi câu trùng NGUYÊN VĂN bài học; đáp án chuẩn của từng câu được `gradeAnswer`
      chấm đúng; bản công khai không có `answer`/`explain` — `packages/core-ai/stemQuestionBank.test.ts`.
- [x] `submit_solution` chấm theo `prob.questionId`; đặt `problemId` = id câu qua `validate_step` không
      "mượn" được đáp án (409); nộp sai không có lời giải —
      `apps/server/src/api/learning/stem-scratchpad.test.ts`.
- [x] Bài ngân hàng: bước đúng so với bước 1 KHÔNG làm bài "giải xong" — cùng file.
- [x] Giao diện: trạng thái tải/lỗi/rỗng của đề, nộp đang chấm/sai/đúng/lỗi, lỗi gợi ý/kiểm bước —
      `apps/dhcb/src/components/StemScratchpad/StemScratchpadModal.test.tsx`.
- [x] 390px: nút "Gợi ý" một dòng, mọi nút ≥ 44px, `scrollWidth ≤ innerWidth` — ảnh Tầng 8b.

**Lệnh chứng minh:**

```bash
rm -rf packages/*/dist dist dist-server && npm run typecheck && npm run lint
npx vitest run packages/core-ai packages/core-grading packages/core-contracts \
  apps/server/src/api/learning/stem-scratchpad.test.ts apps/dhcb/src/components/StemScratchpad \
  apps/dhcb/src/lib/stemScratchpadApi.test.ts
```

## ⑤ Bất biến không được phá

| Bất biến                                                    | Test nào canh nó                                       |
| ----------------------------------------------------------- | ------------------------------------------------------ |
| Gợi ý không chứa nghiệm/đáp số/hệ số đã giải                | `packages/core-ai/stemMicroHint.test.ts`               |
| Bước không chứng minh được thì KHÔNG BAO GIỜ `valid` (0547) | `packages/core-ai/stemScratchpadService.test.ts`       |
| Đề/đáp án ngân hàng không bịa (trùng bài học)               | `packages/core-ai/stemQuestionBank.test.ts`            |
| Client không bao giờ nhận đáp án trước khi giải đúng        | `apps/server/src/api/learning/stem-scratchpad.test.ts` |
| Câu nhắc khi nộp sai không chứa chữ số                      | `packages/core-contracts/stemScratchpad.test.ts`       |

## ⑥ Quy ước dự án liên quan

- `packages/core-*` không import `packages/subject-*` (chưa gói core nào làm) → ngân hàng là hàm
  thuần nhận danh sách bài học; server truyền vào (giống `evidence.ts` + `stemEvidenceGrader.ts`).
- Import xuyên gói `@dhcb/<gói>/<file>`; dữ liệu server → client validate bằng Zod.
- Nhãn trạng thái có ký hiệu + chữ; xanh lá chỉ cho "đúng"; vùng chạm ≥ 44px.
- Bài STEM đều `reviewStatus: 'draft'` → giao diện phải nói "bản nháp, chưa duyệt chuyên môn".

---

## Nghiệm thu

Xem `docs/changelog/0551-2026-10-09-stem-goi-y-socratic-va-nop-loi-giai.md`.
