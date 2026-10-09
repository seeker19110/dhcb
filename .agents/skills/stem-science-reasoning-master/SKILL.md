---
name: stem-science-reasoning-master
description: 'Kỹ năng Nghiệp vụ Khoa học STEM & Suy luận Logic Đa bước (Toán, Lý, Hoá, Sinh; bảng nháp STEM, gợi ý Socratic, giải đề qua ảnh, trình bày công thức). Kích hoạt khi làm bài học/đề STEM, kiểm từng bước giải, cân bằng phản ứng hoá học, viết gợi ý cho học sinh hoặc trình bày công thức.'
---

# STEM SCIENCE & MULTI-STEP REASONING MASTER

Quy chuẩn cho bài học, bài tập và phản hồi môn STEM (Toán · Lý · Hoá · Sinh) trong Đồng Hành.

> **Đối chiếu mã ngày 2026-10-09 (changelog 0547, 0551, 0552).** Trước 0547 skill ghi đúng rằng mã
> KHÔNG có bộ kiểm bước — và chính việc từng tin nhầm điều đó làm bảng nháp khen mọi bước là đúng
> (changelog 0473). Từ 0547 có bộ kiểm THẬT cho Toán một ẩn + PTHH; từ 0552 có kiểm THỨ NGUYÊN Vật lí
> (§2); từ 0551 gợi ý Socratic dùng chính kết quả các bộ kiểm đó; mọi dạng khác vẫn là "chưa tự kiểm
> được".
> App **không render LaTeX**. Khi skill và mã lệch nhau, **MÃ thắng**.

---

## 1. NỘI DUNG STEM ĐANG CÓ

- Gói môn: `packages/subject-math`, `packages/subject-physics`, `packages/subject-chemistry`,
  `packages/subject-biology` — chương trình bám khung GDPT 2018. Một phần nội dung còn là bản nháp
  chờ duyệt; xem `docs/goals/2026-08-31-mon-hoc-toan-ly-hoa-sinh.md` trước khi nối thêm vào app.
- Trang bài học: `apps/dhcb/src/pages/learning/StemLesson*.tsx`, đường dẫn dựng qua
  `apps/dhcb/src/lib/stemLessonRoutes.ts`.
- **Giải đề qua ảnh (Vision Solver):** `apps/server/src/api/learning/vision-solve.ts` (có rate
  limit + `validateAuth`), gọi từ `apps/dhcb/src/lib/visionSolverApi.ts`. Là lệnh gọi AI → phải
  qua đếm lượt (`checkAndConsumeUsage`). **Không có nhánh giả lập** (changelog 0563): thiếu
  `GEMINI_API_KEY` ⇒ `VisionSolverUnavailableError` (503), AI trả sai khuôn JSON ⇒
  `VisionSolverBadOutputError` (502); handler hoàn lượt ở mọi nhánh lỗi. Đừng thêm lại lời giải mẫu
  "Đáp số đã được xác minh chính xác."

---

## 2. BẢNG NHÁP STEM — GIỚI HẠN THẬT CỦA BỘ KIỂM

`packages/core-ai/stemScratchpadService.ts` (API `apps/server/src/api/learning/stem-scratchpad.ts`,
giao diện `apps/dhcb/src/components/StemScratchpad/`). Đặc tả:
`docs/specs/2026-10-09-kiem-buoc-giai-stem.md`. Bộ kiểm nằm ở `packages/core-grading/` nhưng
**không** xuất qua `index.ts` (client import file đó) → chỉ chạy ở server.

- **Toán — `checkMathStep` (`stepCheckMath.ts`):** phương trình đại số MỘT ẩn (tên ẩn một chữ cái;
  `+ − × / ÷` (dấu `:` chưa nhận — trả "?"), phân số `\frac`, luỹ thừa số nguyên, chuỗi `a = b = c`, `⇒`/`\implies`, "hoặc"/`;`/
  `\lor`, `±`). Đổi về đa thức Q[x] chính xác (`rational.ts` BigInt, `polynomial.ts` ƯCLN +
  square-free + dãy Sturm), so **tập nghiệm thực** của bước với ĐỀ, giữ điều kiện xác định (mẫu ≠ 0).
  Ra: tương đương (`valid`) · đổi nghiệm — mất/thêm/cả hai (`invalid`, `changed_solutions`) · chia
  cho 0 (`invalid`, `division_by_zero`) · ngoài phạm vi (`unverified`). Không có đề → bước đầu là mốc.
- **Hoá — `checkChemStep` (`stepCheckChem.ts`):** tái dùng `parseFormula`/`parseEquation` của
  `chemistry.ts` (ngoặc lồng, `·` ngậm nước, ion `^{2-}`); thêm electron `e^-`, trạng thái
  `(s)/(aq)/(k)`, `↑↓`, điều kiện `→(t°)`, 118 ký hiệu nguyên tố. Thứ tự: đổi chất so với đề
  (`substance_changed`) → lệch nguyên tử, nêu đích danh nguyên tố + số đếm (`unbalanced_equation`) →
  lệch điện tích (`unbalanced_charge`) → cân bằng (`valid`, báo nếu chưa tối giản).
- **Vật lí — `checkPhysicsStep` (`stepCheckPhysics.ts` + `dimension.ts`, changelog 0552):** kiểm
  THỨ NGUYÊN (vector số mũ hữu tỉ BigInt của 7 đại lượng SI) của hai vế, từng hạng tử cộng/trừ, đối số
  `sin/cos/ln/e^…`. Thứ nguyên biến lấy từ bảng `variables` của ĐỀ (`{ v: 'm/s', t: 's' }`, hợp đồng
  `StemVariableTableSchema`); không có bảng → `unverified` (KHÔNG đoán theo tên). Hằng chuẩn không mơ
  hồ (g, c, G…); `k`, `h`, `e`, `R` đề phải khai. Ra: lệch CHỨNG MINH được → `invalid`,
  `dimension_mismatch` (`✗ Lệch thứ nguyên`); lệch chỉ khi coi số trần là hệ số (`v = 2t` lối SGK
  "đơn vị ghi sau", `½at`) → `unverified` hỏi lại; **khớp thứ nguyên → vẫn `unverified`** (điều kiện
  cần, không đủ — `v = 2at` khớp mà sai). Đáp số đề mẫu viết cứng (`khopDapSo`) đã gỡ ở 0551. Đặc tả
  `docs/specs/2026-10-09-kiem-thu-nguyen-vat-li.md` §6 (quy ước "số trần").
- **Bảng biến của câu Vật lí ngân hàng (changelog 0560):** khai ở trường `variables` của từng câu
  "Tự kiểm tra" trong `packages/subject-physics/lessons/*.ts` (schema `PhysicsCheckQuestionSchema`
  dùng lại `StemVariableTableSchema`); ngân hàng mang theo, server gắn vào phiên khi mở đề bằng
  `questionId` — client không gửi bảng. 86/89 câu có bảng; 3 câu số đếm cố ý không khai. Luật
  soạn: chỉ ký hiệu đề/lời giải dùng, đúng NGHĨA của bài (`k` lò xo ≠ Coulomb ≠ số bó sóng; `c`
  nhiệt dung riêng thắng hằng tốc độ ánh sáng); chữ vừa là đơn vị (`V`, `T`, `W`, `N`) mà lời giải
  viết `V1`, `T2` thì PHẢI khai cả ký hiệu gốc, không thì `V1` bị đọc là "1 vôn" và bước đúng bị
  hỏi lại "lệch có điều kiện"; chỉ số dưới nhiều chữ viết `v_{max}`. Không chắc nghĩa thì bỏ —
  thiếu chỉ ra "?", sai thì ✗ oan. Test `packages/core-ai/stemQuestionBank.physicsVariables.test.ts`
  chạy bước ĐÚNG lấy từ lời giải của từng câu.
- **Sinh:** CHƯA kiểm bước.
- **"Giải xong"** chỉ khi `status: 'valid'` VÀ `isFinalAnswer: true` (`x = 5` tương đương đề; PTHH cân
  bằng tối giản, đúng chất của đề). Bước giữa `valid` (vd `2x = 10`) KHÔNG làm bài xong.
- **Ngân hàng đề (changelog 0551):** `packages/core-ai/stemQuestionBank.ts` dựng từ câu "Tự kiểm
  tra" THẬT của bài học Toán · Lí · Hoá (nguyên văn đề + `AnswerSpec` + lời giải; bỏ trắc nghiệm và
  câu "Nhập 1 nếu…") — 272 câu ngày 2026-10-09. Hàm thuần nhận danh sách bài học (gói `core-*` không
  import `subject-*`); handler truyền vào. Client chỉ thấy bản công khai (`toPublicStemQuestion`,
  không đáp án). Đề ngân hàng là lời văn, KHÔNG có `problemLatex` → với Toán, **bước 1 là mốc**:
  bước sau so với bước 1 ("so với bước 1 của em"), không bao giờ `isFinalAnswer`; bài ngân hàng chỉ
  "giải xong" qua `submit_solution`.
- Nhãn hiển thị qua `nhanKetQuaBuoc()` (`packages/core-contracts/stemScratchpad.ts`): `✓ Hợp lệ` ·
  `✗ Đổi nghiệm|Chia cho 0|Lệch nguyên tử|Lệch điện tích|Đổi chất|Lệch thứ nguyên` ·
  `? Chưa tự kiểm được` — luôn
  ký hiệu + chữ, không chỉ màu.

**Luật bất biến:** bước không chứng minh được thì **KHÔNG BAO GIỜ** báo "đúng"/"hợp lệ"/tô xanh.
Mở rộng bộ kiểm (căn, bất phương trình…) phải giữ: `valid` **chỉ khi đã chứng minh**,
LaTeX lạ ⇒ `unverified` (không đoán), và có test ca sai rõ ràng (vd `2x = 15 + 7` sau `2x + 5 = 15`)
không bao giờ ra `valid`. Gợi ý (`suggestedCorrection`) là **câu hỏi Socratic**, không chứa nghiệm
hay bước đúng.

**CHƯA CÓ — cần đặc tả trước khi làm:**

- căn, lượng giác, log/mũ, π, giá trị tuyệt đối, bất phương trình, hệ nhiều ẩn;
- Vật lí: kiểm vector/chiều, đạo hàm/tích phân; ô nhập bảng biến cho đề TỰ DO trên giao diện;
- hệ số phân số trong PTHH (`1/2 O_2`).

**Đáp số cuối của `submit_solution`** (đề ngân hàng) chấm theo câu gắn với phiên
(`prob.questionId`, server gán lúc `create_problem { questionId }` — KHÔNG theo id client gửi):
`gradeAnswer(finalValueText(…), AnswerSpec của bài học)` (changelog 0551; `finalValueText` ở
`packages/core-grading/finalAnswer.ts` bỏ "x =", vỏ LaTeX) — cùng dung sai/đơn vị/phân số như trang
bài học, KHÔNG so chuỗi con. Trả `correct` + `attemptsLeft`; `reason` CHỈ là mã công khai
(`PublicSubmitReasonSchema`: đúng, hoặc lỗi cách ghi PARSE_ERROR/EMPTY) — mã chi tiết đơn vị/dấu lộ
đáp án nên không trả khi sai. Lời giải chỉ trả khi đã giải đúng. Phiên không thuộc ngân hàng → 409
`NO_ANSWER_KEY`; sai đủ `MAX_WRONG_SUBMITS` (5) → 409 `TOO_MANY_WRONG_SUBMITS` cho phiên đó; mọi
POST qua `checkRateLimit` 60/phút/người (rà soát bảo mật 0551).

---

## 3. NGUYÊN TẮC GỢI Ý SOCRATIC

- **CẤM** đưa đáp số cuối ngay khi học viên bế tắc.
- **Ba bậc gợi ý**, chỉ lên bậc sau khi bậc trước chưa đủ:
  - **Bậc 1 — gợi khái niệm:** nhắc định luật/định lý liên quan ("Em nhớ định luật bảo toàn động
    lượng cho hệ kín không?").
  - **Bậc 2 — gợi cấu trúc:** hướng bước biến đổi tiếp theo ("Thử đưa các số hạng chứa x sang một
    vế").
  - **Bậc 3 — chỉ đúng chỗ sai:** nêu điểm tính nhầm cụ thể ("Dòng 2, nhân hai vế với −1 thì chiều
    bất phương trình phải đổi").
- Thực tế hiện tại (changelog 0551): `generateMicroHint` → `generateSocraticHint`
  (`packages/core-ai/stemMicroHint.ts`) trả `{ hintText, level }`, luôn là câu hỏi: chưa có bước →
  bậc 1; bước hợp lệ → bậc 2 theo hình dạng bước (`describeMathStep` trong `stepCheckMath.ts`: còn
  hạng tử gộp được, còn ngoặc, ẩn hai vế, mẫu chứa ẩn, hệ số khác 1); bước sai → bậc 3 theo kết luận
  của bộ kiểm (mất nghiệm, nghiệm lạ do bỏ ĐKXĐ, chia cho 0, nguyên tố đang lệch, lệch thứ nguyên
  Vật lí — bảng biến chung ở `packages/core-ai/stemPhysicsVariables.ts`…). Bất biến "gợi ý
  không chứa nghiệm" canh bằng `stemMicroHint.test.ts` (nghiệm lấy bằng chính bộ kiểm). Gợi ý ba bậc
  cũng là chuẩn cho **prompt AI** và nội dung viết tay.

---

## 4. TRÌNH BÀY CÔNG THỨC

App **không có thư viện render LaTeX** (không KaTeX/MathJax). Vì vậy:

- **Nội dung bài học và phản hồi hiển thị cho học viên:** viết công thức bằng **ký tự Unicode**,
  đúng như nội dung đang có — `x²`, `H₂O`, `CO₂↑`, `→`, `≤`, `√2`, `π`, `Δt`, `·`. Phân số đơn giản
  viết `a/b`; điều kiện phản ứng ghi trong ngoặc: `CaCO₃ →(t°) CaO + CO₂↑`.
- **KHÔNG** trả `$…$`, `\frac{…}{…}`, `\[ … \]` cho học viên — họ sẽ thấy ký hiệu thô.
- **Ngoại lệ:** ô nhập của bảng nháp STEM nhận dạng gõ phẳng kiểu LaTeX đơn giản (`H_2 + O_2
\rightarrow H_2O`), vì đó là cách người học gõ bằng bàn phím. Hiển thị lại thì vẫn giữ nguyên
  chuỗi người học gõ.
- Muốn render LaTeX thật thì đó là quyết định công nghệ (bundle size + a11y công thức) — dùng
  `/consult`, không tự thêm thư viện.
