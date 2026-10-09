# 0560 — Bảng thứ nguyên biến cho câu Vật lí của ngân hàng đề Bảng nháp STEM (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** #1305 ·
  **Loại:** `feat(stem)`
- **Nguồn:** mục (1) của nợ 🟡 "Bảng nháp STEM" trong `PROGRESS.md` — "Vật lí — đề ngân hàng chưa
  khai bảng `variables` … và giao diện chưa gửi `variables` khi tạo đề". Đặc tả
  `docs/specs/2026-10-09-bang-bien-vat-li-ngan-hang-de.md` (Approved for implementation).

## Vấn đề

Đợt `0552` làm bộ kiểm thứ nguyên `checkPhysicsStep` nhưng nó cần bảng `variables` của đề (không
đoán thứ nguyên theo tên biến). Ngân hàng đề (`0551`) dựng từ câu "Tự kiểm tra" của bài học, không
câu nào có bảng → mọi bước Vật lí của học sinh trên đề ngân hàng đều "chưa tự kiểm được", kể cả
`a = (v_t − v_o)·t` lệch rõ.

## Đã làm

1. **Schema bài học** `packages/subject-physics/lessonTypes.ts`: `PhysicsCheckQuestionSchema` thêm
   `variables: StemVariableTableSchema.optional()` — dùng lại đúng hợp đồng của bảng nháp (gói
   `subject-physics` đã tham chiếu `core-contracts`, không khai schema song song); câu `choice` khai
   `variables` bị từ chối (refine).
2. **Nội dung** (17 file `packages/subject-physics/lessons/*.ts`): khai bảng cho **86/89** câu Vật
   lí của ngân hàng. **3 câu bỏ qua, có chủ đích:** `ly12-c2-b11-q2` (tra hằng số 22,4 lít/mol,
   không có bước tính), `ly12-c4-b20-q2` (đọc số proton — số đếm), `ly12-c4-b22-q2` (bảo toàn số
   khối — số đếm). Ký hiệu đổi nghĩa theo bài khai lại từng câu: `k` = `N/m` (lò xo) ·
   `N·m^2/C^2` (Coulomb) · `''` (số bó sóng); `c` = `J/(kg·K)` ở bài nhiệt (thắng hằng tốc độ ánh
   sáng); `E` = `V` (suất điện động) · `V/m` (cường độ điện trường) · `J` (năng lượng); `λ` = `m`
   (bước sóng) · `J/kg` (nhiệt nóng chảy riêng) · `s^-1` (hằng số phóng xạ); `T` = `s`/`K`/`N` theo
   bài. Câu có lời giải viết `V1/T1`, `U2 = U1·N2/N1`, `p1*V1/T1` khai thêm ký hiệu gốc `V`, `T`,
   `U`, `N`, `p` — không thì `V1` bị đọc là "1 vôn" và bước đúng bị hỏi lại oan (đo thật:
   `V1/T1 = V_2/T_2` khi chỉ khai `V_1…T_2` → `conditional_mismatch`). `T` ở bài lực căng
   (`ly10-c6-b32-q2`) KHÔNG khai vì cùng bài dễ là chu kì; `ℓ` không khai vì bộ đọc ký hiệu không nhận.
3. **Ngân hàng** `packages/core-ai/stemQuestionBank.ts`: `StemLessonSource`/`StemQuestion` mang
   `variables?`; `toPublicStemQuestion` giữ nguyên danh sách trắng (không có bảng).
4. **Server** `apps/server/src/api/learning/stem-scratchpad.ts`: `create_problem { questionId }` gắn
   `variables` của câu vào phiên — client không gửi, bảng client gửi kèm `questionId` bị bỏ qua.
5. **Giao diện:** KHÔNG sửa. `StemScratchpadModal` chỉ mở đề từ ngân hàng
   (`createStemProblemFromBankApi(questionId)`), không có luồng tạo đề tự do → "giao diện chưa gửi
   `variables`" không còn là lỗ hổng: server gán. Không có ảnh Tầng 8b vì không đổi giao diện.
6. **Test:**
   - `packages/core-ai/stemQuestionBank.physicsVariables.test.ts` (mới, 7 ca): phủ 89/86/3; mọi
     bảng qua `StemVariableTableSchema`; mọi khoá đọc được là một ký hiệu đúng thứ nguyên đơn vị
     khai (`khoá = khoá` → `consistent`); **180 bước ĐÚNG** viết theo `explain` của 86 câu — không
     bước nào `mismatch`/`conditional_mismatch`/`division_by_zero`, bước công thức đầu mỗi câu
     `consistent`; 12 bước SAI điển hình → `mismatch` (không bảng → `unsupported`); ký hiệu mơ hồ
     đúng nghĩa từng bài.
   - `stemQuestionBank.test.ts`: bảng câu ngân hàng trùng bài học; bản công khai không có bảng.
   - `stemScratchpadService.physics.test.ts`: quét ngân hàng — câu không bảng như cũ, câu có bảng
     khớp thứ nguyên vẫn `unverified`, không `isFinalAnswer`.
   - `apps/server/src/api/learning/stem-scratchpad.test.ts` (+2 ca): câu `ly10-c2-b8-q1` mở bằng
     `questionId` mang đúng bảng (bảng client gửi bị bỏ qua), `a = (v_t - v_o) t` →
     `dimension_mismatch`, `a = (v_t - v_o) / t` → `unverified` không giải xong; câu
     `ly12-c4-b22-q2` (không bảng) giữ "chưa khai bảng thứ nguyên".
7. Tài liệu: đặc tả mới; `PROGRESS.md` sửa tại chỗ nợ "Bảng nháp STEM"; skill
   `stem-science-reasoning-master` (hai bản gương) thêm nguồn bảng biến + luật soạn.

## Cách xác minh bảng (không khai bừa)

Mỗi bảng được thử bằng bước ĐÚNG chép từ lời giải của chính câu (cả LaTeX lẫn gõ thường: `V1/T1`,
`kg.m/s`, `0,5 r`, `\sin 30^\circ`…). Lần chạy nháp đầu tiên bắt được `ℓ` (bảng hỏng → tắt kiểm cả
câu) — đã bỏ. Các bước còn `unsupported` (không kết luận) là giới hạn sẵn có của bộ đọc, không phải
lỗi bảng: `|q|`, `100\%`, `kg.m/s`, phương trình chỉ một vế có thứ nguyên (`1,3 = 1,5 - 0,5 r`).

## Không đổi (cố ý)

- Không sửa bộ kiểm `stepCheckPhysics.ts`/`dimension.ts`, đề, đáp án, lời giải; không migration;
  không thư viện mới; hợp đồng `StemBankQuestionPublic` và chữ ký endpoint giữ nguyên.

## Giới hạn còn lại

- Bảng biến cho đề TỰ DO chỉ gửi được qua API (`create_problem` không `questionId`) — giao diện
  không có luồng đó; thêm ô nhập là việc giao diện riêng (cần Tầng 8b).
- Vật lí vẫn chưa kiểm vector/chiều, đạo hàm/tích phân (`di/dt` → "chưa tự kiểm được").
- Bảng do AI soạn trên bài `draft` — chưa có giáo viên duyệt; test chỉ chứng minh "bước đúng của
  lời giải không bị báo lệch", không chứng minh học sinh không bao giờ gõ một ký hiệu khác nghĩa.

## Bằng chứng

Xem báo cáo cổng của đợt: typecheck · lint · prettier · vitest (core-grading, core-ai,
subject-physics, core-contracts, stem-scratchpad, stemScratchpadApi, skills-mirror, changelog) ·
`check:specs` · `audit:prose -- --ci`.
