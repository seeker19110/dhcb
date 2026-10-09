# 0551 — Bảng nháp STEM: gợi ý Socratic, ngân hàng đề thật, nộp lời giải, hàng nhập 390px (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** #1302 · **Loại:** `feat(stem)`
- **Đặc tả:** `docs/specs/2026-10-09-stem-goi-y-socratic-va-nop-loi-giai.md` (Approved for
  implementation — coordinator giao đợt 0551).
- **Nguồn:** ba mục còn lại (3)(4)(5) của nợ 🟡 "Bảng nháp STEM" trong `PROGRESS.md` (sau `0547`).

## Đã làm

**(3) Gợi ý Socratic — `packages/core-ai/stemMicroHint.ts` (mới).** `generateMicroHint` cũ trả gợi ý
soạn sẵn, và với bước `2x = 10` thì đưa thẳng `x = \frac{10}{2} = 5` ("chia cho 2 để tìm nghiệm").
Nay `generateSocraticHint` trả `{ hintText, level }`, luôn là câu hỏi:

- chưa có bước → bậc 1 (khái niệm): "Ẩn cần tìm là gì…", "Nguyên tố nào chỉ nằm trong MỘT chất…";
- bước cuối SAI → bậc 3, chạy lại `checkMathStep`/`checkChemStep` của `0547` để biết đúng loại lỗi:
  chuyển vế sai dấu → "hạng tử nào vừa đổi vế, dấu của nó…"; mất nghiệm → "có chia cho biểu thức
  chứa ẩn không?"; nghiệm lạ khi đề có mẫu chứa ẩn → hỏi **điều kiện xác định**; chia cho 0; lỗi từ
  bước trước → "tìm bước ✗ đầu tiên"; Hoá → tên nguyên tố đang lệch (không hệ số), điện tích, đổi chất;
  Vật lí (gộp trên `0552`) → chạy `checkPhysicsStep`: lệch thứ nguyên → nêu thứ nguyên hai phần, hỏi
  thừa số đang thiếu/thừa (đối số hàm → hỏi về đối số không đơn vị); chia cho 0; lệch có điều kiện
  (số trần) → bậc 2 hỏi ghi đơn vị; khớp → bậc 2 "khớp đơn vị chưa chắc là đúng"; đề không có bảng
  biến → câu hỏi chung về đơn vị (không đoán);
- bước cuối HỢP LỆ → bậc 2, theo hình dạng bước (`describeMathStep` mới trong
  `packages/core-grading/stepCheckMath.ts`): còn hạng tử gộp được → "hai vế còn hạng tử nào gộp
  được?"; còn ngoặc → phá ngoặc; ẩn hai vế; bậc ≥ 2 → nhân tử; số hạng tự do; hệ số khác 1; đã ở dạng
  đáp số → "thay lại vào đề rồi nộp".

Bỏ hẳn trường `suggestedFormula`. Hợp đồng `StemMicroHintSchema` `.strict()` từ chối nếu ai thêm lại.

**(4a) Ngân hàng đề thật — `packages/core-ai/stemQuestionBank.ts` (viết lại).** 60 câu dữ liệu mẫu
(`"Câu hỏi về hệ phương trình"`, `P_{2} = 10x + 0`, đáp án `S_{2} = 0`) thay bằng **272 câu** lấy
NGUYÊN VĂN từ `checkQuestions` của bài học Toán (127) · Lí (89) · Hoá (56), kèm `AnswerSpec` + lời
giải của chính bài học. Bỏ trắc nghiệm và câu "Nhập 1 nếu ĐÚNG…". Ngân hàng là hàm thuần nhận danh
sách bài học (gói `core-*` chưa từng import `subject-*`); handler truyền `MATH_LESSONS`/… vào như
`evidence.ts`. Client chỉ thấy `toPublicStemQuestion` (danh sách trắng, không `answer`/`explain`) —
trước đây `get_questions` trả nguyên `solutionLatex`, tức lộ đáp án. Mọi câu là bài `draft` → giao
diện ghi "⚠ Bản nháp — đề lấy từ bài học chưa duyệt chuyên môn".

**(4b) Nộp lời giải.**

- `create_problem { questionId }`: server tự tra đề/môn/tiêu đề, gắn `questionId` vào phiên (client
  gửi kèm đề khác cũng bị bỏ qua).
- `submit_solution` chấm theo `prob.questionId` bằng `gradeAnswer(finalValueText(…), AnswerSpec)`
  — cùng dung sai/đơn vị/phân số với trang bài học. Trả `correct`, `reason`, và `explanation` chỉ khi
  đã giải đúng. Phiên không thuộc ngân hàng → 409 `NO_ANSWER_KEY`.
- **Lỗ hổng vá kèm:** trước đây server tra câu bằng `getStemQuestionById(problemId)` — id phiên thật
  (`prob-…`) không bao giờ trùng nên nút nộp không thể chấm đúng; còn client đặt `problemId` = id câu
  (qua nhánh tự tạo phiên của `validate_step`) thì tự chọn được câu để chấm. Có test chặn hồi quy.
- `get_questions` validate tham số bằng Zod (môn/lớp/nhánh/limit sai → 400). GET không `action`
  (trả 3 "bài mẫu" viết cứng) → 400.
- Giao diện: ô "Đáp số cuối" + "Nộp lời giải" — đang chấm / sai (câu nhắc theo mã lý do, không chữ
  số, không đáp số) / đúng (lời giải của bài học, khoá ô nhập, huy hiệu "ĐÃ GIẢI XONG") / lỗi mạng.

**(4c) Đề lời văn → bước 1 là mốc.** Đề ngân hàng không có phương trình (`problemLatex`), nên bước
Toán được so với bước 1 của người học. Phản hồi nói "so với bước 1 của em" (không nói "khớp đề
bài"), bước 1 đọc được thì báo vai trò MỐC thay vì câu "chưa đọc căn…" (sai sự thật ở đây), và
**không bao giờ** `isFinalAnswer` — trước đây phiên không có đề cũng có thể tự "giải xong" khi bước
sau tương đương bước 1. Bỏ `DAP_SO_DE_MAU`/`khopDapSo` (đáp số của 3 đề mẫu viết cứng đã gỡ).

**(5) Bố cục 390px.** Hàng nhập: ô nhập một hàng, hai nút một hàng bên dưới (`flex-col sm:flex-row`);
mọi nút hành động `min-h-11` + `whitespace-nowrap`; tab môn `min-h-11` (trước `py-1.5` ≈ 30px); ô
nhập có nhãn `sr-only` (trước chỉ có placeholder). Lỗi kiểm bước / gợi ý / tải đề / mở phiên hiện ra
bằng `role="alert"` thay cho `console.error` im lặng; tải đề có "Thử lại", môn rỗng nói rõ. Nhãn gợi
ý đổi "Gợi ý từ AI Tutor" → "Gợi ý bậc N/3 (câu hỏi dẫn dắt)" (không có AI nào trong luồng này).

## Quyết định

- **Không trích phương trình từ lời đề để làm mốc.** Đoán sai thì bộ kiểm so với một phương trình
  không phải của đề — thành kiểm giả. Đề lời văn dùng bước 1 làm mốc và nói rõ điều đó.
- **"Giải xong" của bài ngân hàng chỉ qua `submit_solution`.** Bộ kiểm không chứng minh được bước 1
  khớp đề, nên `isFinalAnswer` (0547) chỉ áp cho bài có phương trình đề; luật đó giữ nguyên.
- **Chấm bằng `AnswerSpec` của bài học, không qua `gradeFinalAnswer`.** `gradeFinalAnswer` dựng spec
  từ một chuỗi LaTeX đáp án; ngân hàng mới đã có spec gốc (dung sai riêng từng câu, đơn vị bắt buộc,
  phân số) — dùng thẳng thì khớp tuyệt đối với trang bài học. Vẫn tái dùng `finalValueText` để bỏ
  "x =".
- **Câu nhắc khi nộp sai theo `reason`** (`NHAC_KHI_NOP_SAI`): nói LOẠI sai (thiếu đơn vị, sai dấu,
  chưa tối giản…), không bao giờ nêu đáp số; test canh không chữ số.
- **Gộp lên trên `0552` (kiểm thứ nguyên Vật lí):** giữ cả hai — nhánh `physics` của `validateStep`,
  `variables` trong `createProblemSession`/`create_problem`, `dimension_mismatch` + nhãn
  `✗ Lệch thứ nguyên` (0552) cùng `questionId`/gợi ý Socratic/ngân hàng thật (0551). Bảng biến đề mẫu
  `BANG_BIEN_DE_MAU` dời sang `packages/core-ai/stemPhysicsVariables.ts` (`bangBienCuaDe`) để bộ kiểm
  bước và gợi ý dùng CÙNG một nguồn. Nhánh "đáp số đề mẫu `v = 10` → giải xong" (`khopDapSo`) của
  `0552` bỏ theo quyết định ở trên: Vật lí không tự gắn `isFinalAnswer`; test 0552 đổi tương ứng, và
  test quét ngân hàng đề chuyển sang ngân hàng thật (đề lời văn, chưa có `variables` → "chưa tự kiểm
  được", không bao giờ ✗).
- **Màu modal giữ đúng khuôn sẵn có của file** (teal/zinc + biến thể `theme-light:`) cho phần thêm
  mới; chuyển cả modal sang token `--a-*` là việc riêng.

## Tầng 8b

Ảnh 1440 + 390 × blue-sky + dark-blue, trước/sau, ở
`/tmp/claude-0/-home-user-dhcb/88aafb10-9d27-57d2-94b0-359edeffb66f/scratchpad/shots-0551/` (32 ảnh,
đã tự xem). API chạy THẬT qua handler (`page.route` → `handler(Request)`, CSDL giả bằng Map).

- Trước: gợi ý cho `2x = 10` là "chia cho 2 để tìm nghiệm x"; đề là `2x + 5 = 15` viết cứng; không
  có chỗ nộp; ở 390px nút "💡 Gợi ý" bị ép 2 dòng, sát/cắt mép phải.
- Sau: đề thật "Một tổ có 30 bạn…" (câu 1/127, bản nháp); bước 2 sai → "✗ Đổi nghiệm … so với bước 1
  của em" + "Gợi ý bậc 3/3: Đặt bước này cạnh bước liền trước: hạng tử nào vừa đổi vế?…"; nộp `8` →
  "✓ Đúng đáp số." + lời giải của bài học; Hoá "Al + O₂ → Al₂O₃" → `✗ Lệch nguyên tử` rồi `✓ Hợp lệ`,
  gợi ý bậc 2, nộp `3` → "✗ Chưa đúng…" (không lộ 4). 390px: ô nhập một hàng, "Kiểm tra" + "💡 Gợi ý"
  một dòng, cao 44px; `scrollWidth > innerWidth` = false ở cả 4 tổ hợp.
- Vật lí (sau khi gộp `0552`, 4 ảnh `after-li-thunguyen-*`): đề ngân hàng "đoàn tàu… Tính gia tốc"
  — ngân hàng chưa khai `variables` nên harness tạo phiên qua `create_problem` có `variables`
  (`a: m/s^2, v, v_0: m/s, t: s`). Bước `a = (v - v_0) t` → `× Lệch thứ nguyên` ("vế a có thứ nguyên
  m·s⁻², còn vế (v - v_0) t có thứ nguyên m") + "Gợi ý bậc 3/3: Hai phần đang được đặt bằng nhau có
  thứ nguyên m·s⁻² và m…" — không lộ công thức/đáp số. Không tràn ngang ở cả 4 tổ hợp.

## Kiểm chứng

- `rm -rf packages/*/dist dist dist-server && npm run typecheck` → exit 0.
- `npm run lint` → exit 0 (0 cảnh báo) · `npm run codemap -- cycles` → "Không có chu trình import".
- `npx prettier --check` các file đổi → sạch · `npm run check:specs` → OK 155 đặc tả ·
  `npm run audit:prose -- --ci` → exit 0 (0 lỗi).
- Vitest nhắm (`packages/core-ai packages/core-grading packages/core-contracts
apps/server/src/api/learning/stem-scratchpad.test.ts apps/dhcb/src/components/StemScratchpad
apps/dhcb/src/components/CompanionStudios apps/dhcb/src/lib/stemScratchpadApi.test.ts
scripts/changelog.test.ts scripts/skills-mirror.test.ts` + hai test design của `pages/core`) →
  135 file, 1345 test xanh (exit 0).
- Không đổi câu SQL tĩnh → không chạy `check:sql`. Không chạy `test:coverage` toàn bộ (máy dùng
  chung, theo chỉ đạo coordinator) — CI sẽ chạy.

## Nợ / rủi ro còn lại

- Vật lí: đề ngân hàng chưa khai `variables` và giao diện chưa gửi `variables` → bước Vật lí của
  ngân hàng vẫn "chưa tự kiểm được"; chưa kiểm vector/chiều, đạo hàm. Toán: căn, lượng giác, log, π,
  bất phương trình, nhiều ẩn, `:`.
- Đề ngân hàng là lời văn → bước Toán chỉ so được với bước 1 của người học.
- 272 câu đều từ bài `draft` (chưa giáo viên duyệt) — giao diện đã nói ra.
- ~~`submit_solution` không giới hạn số lần nộp~~ — đã vá, xem "Sau rà soát" mục 1. Còn lại: mỗi phiên
  5 lần sai, nhưng mở phiên mới cho cùng câu là được 5 lần nữa (trong trần 60 yêu cầu/phút) — đủ
  chặn script dò nhanh, chưa chặn người kiên nhẫn dò tay đáp số nguyên nhỏ.

## Sau rà soát (bảo mật độc lập trên `75960a69`, không có mục Cao)

1. **[Thấp–Trung] `submit_solution` là oracle dò đáp số.** Không giới hạn số lần, và mã lý do
   `MISSING_UNIT`/`WRONG_UNIT`/`WRONG_DIMENSION`/`SIGN_ERROR` cho biết đáp án có đơn vị gì, độ lớn
   đã đúng chưa. Sửa: (a) bộ đếm `checkRateLimit(userId, 60, 'stem-scratchpad')` cho MỌI action
   POST (hằng `STEM_POST_PER_MINUTE`), vượt → 429 + `logSecurityEvent('RATE_LIMIT_EXCEEDED')`;
   (b) trường `wrongSubmits` trong `StemProblemStateSchema` (`.default(0)`, bản ghi cũ đọc thành 0);
   đủ `MAX_WRONG_SUBMITS` = 5 lần sai thì phiên đó trả 409 `TOO_MANY_WRONG_SUBMITS` "Em đã nộp sai
   quá 5 lần cho đề này — xem lại các bước rồi mở đề khác nhé." — chỉ khoá PHIÊN, không khoá tài
   khoản; lỗi cách ghi (`PARSE_ERROR`/`EMPTY`) không trừ lượt; (c) hợp đồng chỉ còn
   `PublicSubmitReasonSchema` (`CORRECT`, `CORRECT_LOOSE`, `PARSE_ERROR`, `EMPTY`) — sai giá trị/đơn
   vị/dấu chỉ trả `correct: false` + `attemptsLeft`, giao diện hiện câu chung `NHAC_NOP_SAI_CHUNG`
   và "Còn N lần nộp", hết lượt thì khoá ô; 409/429 hiện đúng câu của server (`StemApiError`).
2. **[Thấp] `get_hint`** đi chung bộ đếm ở mục 1 — test 429 phủ cả bốn action POST.
3. **[Thấp, có sẵn] `create_problem` tự do và `validate_step` không qua Zod** — body `null` ném
   TypeError (500), chuỗi dài vô hạn vào JSONB. Nay mọi action POST qua Zod; giới hạn lấy lại từ
   chính hợp đồng (`StemProblemStateSchema.pick`, `ScratchpadStepSchema.pick`) nên thứ được lưu luôn
   hợp lệ với hợp đồng: title ≤ 200, problemStatement ≤ 2000, problemLatex ≤ 1000, latexInput/
   explanation ≤ 1000, finalAnswer ≤ 200. **Lệch brief có chủ đích:** brief gợi ý 4000 cho đề;
   hợp đồng trạng thái đã đặt 2000/1000 — lấy theo hợp đồng để phiên lưu xuống không bao giờ trái
   schema của chính nó.
4. **[Thấp, có sẵn] Tra phiên dính khoá prototype.** `book['constructor']` trả hàm `Object` nên lọt
   kiểm "không tìm thấy". Nay qua `findProblem` (`typeof === 'string'` + `Object.hasOwn`) ở cả bốn
   chỗ (GET, `validate_step`, `get_hint`, `submit_solution`) → 404. Kèm: `validate_step` có
   `problemId` mà không thấy phiên → 404 (trước đây tạo phiên MỚI mang đúng id client chọn).
5. **[Thấp, có sẵn] `checkMathStep`/`describeMathStep` để lọt `RangeError`** (30000 ngoặc lồng → 500).
   Sửa: chặn trước bằng `nestingDepth > MAX_NESTING` (100, đếm vòng lặp, không đệ quy) → `too_complex`
   (mốc → `anchor_unsupported`, `describeMathStep` → `null`); thêm lưới `try/catch RangeError` bọc
   cả hàm vì khi rà lại thấy chuỗi `1+1+…+1` 30000 hạng tử KHÔNG ngoặc vẫn tràn ngăn xếp ở bước duyệt
   cây nằm ngoài `guarded`. Ở API, độ dài ≤ 1000 (mục 3) đã chặn cả hai ca trước khi tới bộ kiểm.

**Bằng chứng sau rà soát:** test mới — server: 429 cho cả 4 action + log; body `null`/`42` → 400;
5 trường quá dài → 400; `constructor`/`toString`/`__proto__`/`hasOwnProperty` → 404 ở 4 chỗ tra; 5 lần
sai → 409, lỗi cách ghi không trừ lượt, phiên mới nộp đúng được; thiếu đơn vị không còn `reason`.
Hợp đồng: mã lộ đơn vị bị schema từ chối, `wrongSubmits` mặc định 0. Toán: 30000 ngoặc và chuỗi
cộng dài → `too_complex`, không ném. Giao diện: hết lượt khoá ô, 409 hiện câu server.
