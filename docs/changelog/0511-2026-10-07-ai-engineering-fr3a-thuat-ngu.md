# 0511 — AI Engineering FR-3a: sửa thuật ngữ convolution và lời hứa "BPE" trong bài cũ (2026-10-07)

- **Ngày:** 2026-10-07 · **PR:** chưa tạo (nhánh `claude/ai-engineering-tiep`) · **Loại:** `fix(programming)`.
- **Đặc tả:** `docs/specs/2026-10-05-ai-engineering-from-scratch-dhcb.md` (Approved, #1236), FR-3a
  "rà lỗi nội dung cũ trước reuse"; lỗi cụ thể lấy từ
  `docs/research/2026-10-05-ai-engineering-pilot-selection.md` (hai ca convolution và BPE). Kế hoạch
  giao việc (`docs/specs/2026-10-05-ai-engineering-execution-plan.md` mục C1) yêu cầu sửa hai lỗi
  này trước khi reuse hoặc gắn hoạt họa.

## Vì sao chọn lát này

Các phần lớn hơn của goal đều đang chờ người quyết: B2 hoạt họa Git (chuyên gia chốt 9 điểm
storyboard), gói bộ chấm #1239 (quyết định kiến trúc), ba hoạt họa thí điểm còn lại (đặc tả hoạt
họa ① điều kiện 5: phải có reviewer nội dung), bài/khóa mới (lát contract chốt ID công khai, và
khóa coding không được đăng ký khi M0G chưa đạt). Lát FR-3a không cần quyết định mới: lỗi đã được
phiếu thí điểm nêu cụ thể, sửa không đổi ID, Make, ca chấm hay tiến độ.

## Việc đã làm

- `packages/subject-programming/lessons/cv1u2.ts` — bài `cv1-u2-l1`:
  - Lý thuyết: tính chất thứ ba đổi từ "bất biến tịnh tiến" thành **tương đương tịnh tiến**
    (translation equivariance), tách rõ với bất biến (invariance), kèm ví dụ số: hàng "27 27 0",
    dời cạnh sang phải một cột ra "0 27 27".
  - Thêm đoạn **giới hạn ở viền**: dời sang trái một cột ra "27 0 0" (một số 27 rơi ở mép vì không
    padding); muốn gần bất biến cần bước gom như pooling (bài sau).
  - Ghi chú thuật ngữ: công thức không lật kernel nên nói chặt chẽ là **tương quan chéo**
    (cross-correlation); thư viện vẫn gọi là convolution, kernel được học nên không đổi điều mạng học.
  - Thẻ SRS 3 sửa thuật ngữ; thêm thẻ 4 về giới hạn viền (3 → 4 thẻ, trong khung 2–4).
- `packages/subject-programming/lessons/cv2u1.ts` — bài `cv2-u1-l4` (lý thuyết CNN vs ViT + thẻ
  SRS): định kiến cài sẵn của CNN là tương đương tịnh tiến; nói rõ pooling và lớp cuối gom lại mới
  cho nhãn gần như không đổi theo vị trí.
- `packages/subject-programming/lessons/mldsu3.ts` — bài `mlds-u3-l1` (lý thuyết + thẻ SRS): cùng sửa.
- `packages/subject-programming/lessons/llmagentu1.ts` — bài `llmagent-u1-l1`: tiêu đề
  "tokenizer BPE mini tự cài" → **"tokenizer subword theo luật cố định"**; lý thuyết nói thẳng code
  không đếm cặp, không gộp, không học từ kho văn bản và nêu khác biệt cốt lõi (BPE cắt theo mảnh đã
  học, luật của bài cắt theo độ dài). Phần giải thích BPE và thẻ SRS về BPE giữ nguyên vì đúng.
- `packages/subject-programming/courses/llmagent.ts` — tóm tắt chương `llmagent-c1` bỏ cụm "BPE mini".
- `packages/subject-programming/lessonsLazy.ts` — sinh lại bằng `npm run gen:lesson-index` (đổi
  tiêu đề `llmagent-u1-l1`, số thẻ SRS `cv1-u2-l1` 3 → 4).
- `packages/subject-programming/lessons/aiEngineeringTerminology.test.ts` (mới, 10 ca): ba bài
  convolution không còn "bất biến tịnh tiến" và có "tương đương tịnh tiến"; **tính lại** ba hàng
  đặc trưng bằng kernel của bài và đòi lý thuyết in đúng chúng (không tin chữ chép tay); thẻ viền
  dùng đúng số; Make `cv1-u2-l1` giữ nguyên ba ca chấm; tiêu đề `llmagent-u1-l1` không nhắc BPE,
  lý thuyết nói "KHÔNG cài BPE", lời giải mẫu vẫn là luật cắt theo độ dài.

## Quyết định trong ranh giới đặc tả

- **BPE chọn hướng (a) của phiếu thí điểm** (giữ code, sửa tiêu đề/mục tiêu cho đúng). Hướng (b)
  — bài BPE thật với vòng đếm cặp và gộp — cần ID bài mới, thuộc lát contract chốt ID; (a) không
  cản (b): bài BPE thật sau này là bài riêng, bài cũ vẫn phải có tiêu đề trung thực. Không đổi
  Make để giữ tương thích tiến độ đã lưu (FR-3).
- **Không thêm ca chấm cho ví dụ dời cạnh**: đổi Make làm lệch chấm với tiến độ cũ; ví dụ chỉ nằm ở
  lý thuyết và thẻ SRS, được test tính lại.
- **Pooling (`cv1-u2-l2`) giữ "bất biến nhỏ với dịch chuyển"**: max pooling cho bất biến gần đúng cục
  bộ, đúng thuật ngữ; nay khớp với câu dẫn "cần bước gom như pooling" của `cv1-u2-l1`.
- **Không sửa** tài liệu lịch sử `docs/specs/2026-09-01-llmagent-bai-hoc-chi-tiet.md` và bản đồ CSV
  (hàng `10-llms-from-scratch/01-tokenizers` giữ EXTEND; hàng `05-…/19-subword-tokenization` giữ NEW
  vì chưa có bài BPE thật). Focus `airel-c2` "BPE và token length" giữ vì bài vẫn dạy khái niệm BPE.

## Kiểm chứng

- Ví dụ số đối chiếu bằng Python thật (3.x, ngoài repo): `[27, 27, 0]`, dời phải `[0, 27, 27]`, dời
  trái `[27, 0, 0]`; lật kernel đổi dấu `[-27, -27, 0]`.
- `npx vitest run packages/subject-programming`: 92 file, **7.469/7.469 test đạt** (exit 0).
- `npm run typecheck` exit 0 · `npm run lint` exit 0 (0 cảnh báo) · Prettier `--check` 7 file đã đổi đạt.
- `npm run audit:prose -- --ci` exit 0: 0 lỗi, không cảnh báo nào ở bốn bài đã sửa ·
  `npm run audit:lessons -- --ci` exit 0.
- `npm run build` exit 0.
- **Chưa chạy:** full `test:coverage` và E2E (thuộc CI khi mở PR).

## Còn lại

- Hoạt họa convolution/RAG/agent: có thể viết storyboard nháp, nhưng gắn `animation` cần reviewer
  nội dung (đặc tả hoạt họa ① điều kiện 5).
- Bài BPE thật (hướng b) và các outcome NEW: chờ lát contract chốt ID khóa/bài.
