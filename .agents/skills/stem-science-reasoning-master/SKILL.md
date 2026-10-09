---
name: stem-science-reasoning-master
description: 'Kỹ năng Nghiệp vụ Khoa học STEM & Suy luận Logic Đa bước (Toán, Lý, Hoá, Sinh; bảng nháp STEM, gợi ý Socratic, giải đề qua ảnh, trình bày công thức). Kích hoạt khi làm bài học/đề STEM, kiểm từng bước giải, cân bằng phản ứng hoá học, viết gợi ý cho học sinh hoặc trình bày công thức.'
---

# STEM SCIENCE & MULTI-STEP REASONING MASTER

Quy chuẩn cho bài học, bài tập và phản hồi môn STEM (Toán · Lý · Hoá · Sinh) trong Đồng Hành.

> **Đối chiếu mã ngày 2026-10-09 (changelog 0547).** Trước 0547 skill ghi đúng rằng mã KHÔNG có bộ
> kiểm bước — và chính việc từng tin nhầm điều đó làm bảng nháp khen mọi bước là đúng (changelog
> 0473). Từ 0547 đã có bộ kiểm THẬT cho hai dạng (§2); mọi dạng khác vẫn là "chưa tự kiểm được".
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
  qua đếm lượt (`checkAndConsumeUsage`).

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
- **Vật lí, Sinh:** CHƯA kiểm bước (thứ nguyên từng bước là nợ). Vật lí chỉ có `khopDapSo` cho đề mẫu.
- **"Giải xong"** chỉ khi `status: 'valid'` VÀ `isFinalAnswer: true` (`x = 5` tương đương đề; PTHH cân
  bằng tối giản, đúng chất của đề). Bước giữa `valid` (vd `2x = 10`) KHÔNG làm bài xong.
- Nhãn hiển thị qua `nhanKetQuaBuoc()` (`packages/core-contracts/stemScratchpad.ts`): `✓ Hợp lệ` ·
  `✗ Đổi nghiệm|Chia cho 0|Lệch nguyên tử|Lệch điện tích|Đổi chất` · `? Chưa tự kiểm được` — luôn
  ký hiệu + chữ, không chỉ màu.

**Luật bất biến:** bước không chứng minh được thì **KHÔNG BAO GIỜ** báo "đúng"/"hợp lệ"/tô xanh.
Mở rộng bộ kiểm (căn, bất phương trình, thứ nguyên…) phải giữ: `valid` **chỉ khi đã chứng minh**,
LaTeX lạ ⇒ `unverified` (không đoán), và có test ca sai rõ ràng (vd `2x = 15 + 7` sau `2x + 5 = 15`)
không bao giờ ra `valid`. Gợi ý (`suggestedCorrection`) là **câu hỏi Socratic**, không chứa nghiệm
hay bước đúng.

**CHƯA CÓ — cần đặc tả trước khi làm:**

- căn, lượng giác, log/mũ, π, giá trị tuyệt đối, bất phương trình, hệ nhiều ẩn;
- kiểm thứ nguyên cho từng bước giữa môn Vật lí;
- hệ số phân số trong PTHH (`1/2 O_2`).

**Đáp số cuối của `submit_solution`** (đề ngân hàng) chấm qua `gradeFinalAnswer`
(`packages/core-grading/finalAnswer.ts`, changelog 0539): bỏ "x =", thống nhất `,`/`.`, dung sai
tương đối 0,1%, đơn vị phải cùng thứ nguyên — tái dùng `gradeAnswer`, KHÔNG so chuỗi con.

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
- Thực tế hiện tại: `generateMicroHint` của bảng nháp chỉ có gợi ý soạn sẵn cho đề mẫu (và gợi ý
  cho bước `2x = 10` còn đưa thẳng `x = 5` — nợ, changelog 0547). Phản hồi của bộ kiểm bước (§2)
  đã theo lối câu hỏi. Gợi ý theo
  ba bậc ở trên là chuẩn cho **prompt AI** và cho nội dung viết tay.

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
