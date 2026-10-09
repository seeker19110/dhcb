# 0539 — Bỏ "chỉ số tự nhận thức" giả của nhật ký phản tỉnh + chấm đáp số STEM theo giá trị (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** (chưa tạo — commit trên nhánh worktree) · **Loại:** `fix(personal)` + `fix(stem)`
- **Nguồn:** hai nợ 🟡 trong `PROGRESS.md`: "Chỉ số tự nhận thức" là số giả (changelog `0479`) và
  `submit_solution` của bảng nháp STEM so chuỗi con (changelog `0473`).

## Đã làm

### 1. Nhật ký phản tỉnh: bỏ con số, thay bằng phản hồi định tính có thật

Trước: `analyzeReflection` trả `metacognitiveIndex` = `wordCount * 1.5 + 40` + 10 điểm mỗi bẫy dò
được (sàn 30, trần 100) và `growthMindsetScore` = 90 nếu bài có chữ "cải thiện/thay đổi/thử
nghiệm/học hỏi", còn lại 75. Giao diện hiện chúng thành huy hiệu "MAI: 87/100", "Growth Mindset:
90/100", "Chỉ số Tự nhận thức (MAI) trung bình" và "MAI Index" trên thẻ của studio "Ghi nhớ". Không
phải thang MAI chuẩn (bộ câu hỏi tự đánh giá), viết dài hơn là điểm cao hơn. Vi phạm Luật số 1.

- **Hợp đồng** (`packages/core-contracts/metacognitiveReflection.ts`):
  - bỏ `metacognitiveIndex`, `growthMindsetScore` khỏi `MetacognitiveReflectionSchema`;
  - bỏ `overallAwarenessIndex` và `mindsetTrend` khỏi `MetacognitiveSummarySchema` (cả hai suy ra từ
    số giả);
  - thêm `triggerPhrases` cho mỗi bẫy: nguyên văn cụm từ trong bài đã khiến bộ dò nghĩ tới bẫy đó;
  - thêm `COGNITIVE_BIAS_LABELS` (một nguồn tên bẫy cho service và giao diện);
  - thêm `toPublicReflection`: chiếu bản ghi CSDL sang client theo danh sách trắng, bỏ bẫy "none"
    giữ chỗ;
  - thêm `SubmitReflectionRequestSchema` (Zod) cho thân `submit_reflection`.
- **Service** (`packages/core-personal/metacognitiveReflectionService.ts`): gỡ hẳn phần tính hai
  con số (không còn nơi nào dùng).
  - Bẫy tư duy dò theo bảng luật `BIAS_RULES`, câu chữ theo giọng "có thể bạn đang…".
  - Câu hỏi Socratic tiếp theo nay là câu hỏi riêng của TỪNG bẫy dò được, cộng một câu chốt
    "Nếu… thì…". Không dò được bẫy nào thì dùng câu hỏi mở chung. Bản cũ trả hai câu cố định cho
    mọi bài.
  - Bỏ bẫy giả "Tư duy trung dung & Cởi mở" khi không dò được gì: danh sách để rỗng.
  - Bỏ câu "Aha" bịa sẵn ("Nhận thức rõ ràng hơn…") khi người viết không kể điều gì vừa vỡ lẽ.
  - `summarizeReflections` chỉ còn số phiên, bẫy hay gặp lại và câu "Aha" gần đây.
- **API** (`apps/server/src/api/learning/metacognitive-reflection.ts`): GET danh sách và GET
  `summary` đều đi qua `toPublicReflection`. Bản ghi cũ còn số trong CSDL nhưng số không bao giờ rời
  server. POST validate bằng Zod: domain lạ hoặc bài chỉ có khoảng trắng trả 400.
- **Giao diện** (`MetacognitiveReflectionModal.tsx`, `MetacognitiveJournalCard.tsx`):
  - bỏ mọi huy hiệu điểm;
  - kết quả có tiêu đề "Phản hồi cho bài viết của bạn" kèm dòng "gợi ý dựa trên cụm từ trong bài
    viết, không phải lời chẩn đoán";
  - phần bẫy đổi tên thành "Có thể bạn đang mắc bẫy tư duy", có dòng "Vì bạn viết: “sợ sai”…";
  - tab Lịch sử hiện "Đã phản tỉnh N phiên" và "Bẫy tư duy bạn hay nhắc tới";
  - nút "Khám phá Điểm Mù AI" (không có AI nào) đổi thành "Nhận câu hỏi gợi mở";
  - giao diện vẫn tự lọc bẫy "none" và bù `triggerPhrases` để không vỡ nếu gặp server cũ khi
    rollback.

**CSDL, không migration:** dữ liệu nằm trong JSONB `platform.feature_state`
(`feature = 'metacognitive_reflection'`, migration `0058`), không có cột riêng. Không xoá gì: bản
ghi cũ giữ nguyên `metacognitiveIndex`/`growthMindsetScore`, server chỉ ngừng đọc và ngừng ghi hai
trường đó. Khi người dùng gửi bài mới, danh sách thô được ghi lại nguyên vẹn, bản mới chèn lên đầu
(có test kiểm bản ghi cũ trong kho còn y hệt).

### 2. `submit_solution` của bảng nháp STEM: so đáp số đã chuẩn hoá, không so chuỗi con

Trước: `finalAnswer?.includes(question.solutionLatex?.slice(0, 10))`. Hệ quả:

- "15" khớp đáp án "5";
- chép lại 10 ký tự đầu của đáp án rồi viết gì sau đó cũng được tính "giải xong";
- "2,5" lại trượt "2.5".

- **Tái dùng engine chấm sẵn có:** `@dhcb/core-grading`, gồm `gradeAnswer`, `normalizeAnswerText`
  (dấu thập phân kiểu Việt), `splitValueUnit`/`toSI` (đơn vị, thứ nguyên) và `expressionsEqual`.
  Không viết bộ so thứ hai. File mới `packages/core-grading/finalAnswer.ts` chỉ thêm hai việc:
  - `finalValueText`: gỡ vỏ LaTeX đơn giản (`\text{}`, `\,`, `$`), lấy vế phải của mệnh đề cuối
    ("2x = 10 \implies x = 5" → "5"), làm ở CẢ hai phía;
  - `gradeFinalAnswer`: dựng `NumericSpec` từ đáp án (có đơn vị thì đổi sang SI, đơn vị bắt buộc),
    dung sai tương đối 0,1%; đáp án không phải số thì dùng `ExpressionSpec`; đáp án rỗng thì luôn
    sai.
- `apps/server/src/api/learning/stem-scratchpad.ts` gọi `gradeFinalAnswer`.
  - `finalAnswer` không phải chuỗi thì trả 400.
  - Bài đã giải xong thì vẫn giữ trạng thái xong.
  - `solutionPreview` (100 ký tự đầu lời giải) chỉ trả về khi bài ĐÃ giải đúng. Trước đây nộp
    một đáp số sai bất kỳ cũng nhận được, nên nút nộp bài thành nút xem đáp án. Giao diện không
    đọc trường này; test ca sai khẳng định không có trường.

### 3. Skill khớp lại với mã

`memory-palace-cognitive-scaffolder` §3 (không còn con số) và `stem-science-reasoning-master` §2
(`submit_solution` chấm qua `gradeFinalAnswer`) — sửa cả `.claude/skills/` lẫn bản gương
`.agents/skills/`.

## Quyết định

- **Không đổi tên con số mà bỏ hẳn.** Đổi tên không làm nó bớt giả: nó vẫn đo độ dài bài viết.
- **Bỏ luôn `growthMindsetScore` và `mindsetTrend`.** Brief chỉ nêu "chỉ số tự nhận thức", nhưng
  hai trường này cùng loại: số 75/90 theo từ khoá, và "xu hướng" suy ra từ trung bình số giả. Giữ
  lại thì vẫn trái Luật số 1.
- **Danh sách trắng thay cho xoá trường.** `toPublicReflection` dựng object từ từng trường đã biết,
  nên trường lạ ghi thêm vào CSDL sau này cũng không lọt ra client.
- **Dung sai 0,1% tương đối, ghi rõ trong `gradeFinalAnswer`.** Không dùng `defaultToleranceFor`
  (đáp số nguyên phải khớp tuyệt đối) vì brief yêu cầu dung sai tương đối nhỏ cho đáp số số học.
  Đáp án 0 thì engine tự lùi về so tuyệt đối.
- **Giữ quy ước phân nhóm nghìn của engine.** Một dấu phẩy theo sau đúng 3 chữ số được hiểu là
  phân nhóm nghìn (đặc tả chấm dùng chung §3), nên "4,999" là 4999. Có test ghi lại hành vi này để
  không ai "sửa" riêng ở đây.
- **Không đụng `lifeSynthesisService`.** File này còn nhận tham số `metacognitiveAwarenessIndex`
  (mặc định 82). Hàm đó đã ngừng nối (API trả 501, changelog `0475`) và không đọc từ nhật ký phản
  tỉnh. Nợ "Life Synthesis chờ dữ liệu thật" đã yêu cầu viết lại khi bật lại.

## Test bất biến Luật số 1 (mở rộng)

7 test gốc giữ nguyên: T1–T6 (`intakeSuggestion.test.ts`) chạy lại xanh; T7 (e2e màn intake) không
chạy lại vì đợt này không đụng màn intake. Thêm nhóm tương đương
cho nhật ký phản tỉnh, dùng lại `findForbiddenLanguage`:

- `metacognitiveReflectionService.test.ts`, mục "Luật số 1":
  - quét 32 tổ hợp từ khoá bẫy và câu "Aha" qua `analyzeReflection`;
  - kết quả hợp lệ theo hợp đồng `.strict()`;
  - không khoá nào mang tên `score`/`index`/`awareness`/`trend`, không trường số ở cấp trên cùng;
  - câu chữ hiển thị không chứa ngôn ngữ chấm điểm hay xếp loại.
- `metacognitiveReflection.test.ts`: schema `.strict()` từ chối nếu ai thêm lại
  `metacognitiveIndex`/`growthMindsetScore`/`overallAwarenessIndex`.
- `metacognitive-reflection.test.ts` (API): bản ghi cũ còn số thì GET không trả số, CSDL vẫn còn
  nguyên.
- `MetacognitiveReflection.test.tsx` (mới, DOM thật):
  - mock API cố ý trả số giả kiểu cũ;
  - thẻ, kết quả và lịch sử không có "x/100", "MAI", "Mindset" hay ngôn ngữ cấm;
  - phản hồi kiểu server cũ không làm vỡ giao diện.

## Bằng chứng

- Ảnh Tầng 8b (1440 + 390, theme Blue sky, mock API):
  `/tmp/claude-0/-home-user-dhcb/88aafb10-9d27-57d2-94b0-359edeffb66f/scratchpad/shots-0539/`.
  - `before-*`: các huy hiệu "MAI: 87/100" và "Growth Mindset: 90/100".
  - `after-*`: không còn số (script tự kiểm `/\d+\/100/` và "MAI" trên `innerText`: trước
    true/true, sau false/false ở cả hai khổ).
- Kết quả cổng: xem báo cáo của đợt (typecheck sạch checkout, lint, prettier, vitest các file liên
  quan, codemap impact).
