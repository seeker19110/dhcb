---
name: stem-science-reasoning-master
description: 'Kỹ năng Nghiệp vụ Khoa học STEM & Suy luận Logic Đa bước (Toán, Lý, Hoá, Sinh; bảng nháp STEM, gợi ý Socratic, giải đề qua ảnh, trình bày công thức). Kích hoạt khi làm bài học/đề STEM, kiểm từng bước giải, cân bằng phản ứng hoá học, viết gợi ý cho học sinh hoặc trình bày công thức.'
---

# STEM SCIENCE & MULTI-STEP REASONING MASTER

Quy chuẩn cho bài học, bài tập và phản hồi môn STEM (Toán · Lý · Hoá · Sinh) trong Đồng Hành.

> **Đối chiếu mã ngày 2026-10-02.** Bản trước của skill này mô tả một "bộ kiểm tất định" chứng minh
> biến đổi đại số, đếm nguyên tử, kiểm thứ nguyên — **mã KHÔNG có bộ kiểm đó**, và chính việc tin
> nhầm như vậy từng làm bảng nháp khen mọi bước là đúng (changelog 0473). Bản trước cũng bắt viết
> công thức bằng LaTeX trong khi app **không render LaTeX**. Khi skill và mã lệch nhau, **MÃ thắng**.

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
giao diện `apps/dhcb/src/components/StemScratchpad/`):

- **Bắt được (status `invalid`):** ô rỗng, lệch ngoặc, một lỗi chuyển vế sai dấu gán cứng, một
  phương trình hoá học chưa cân bằng gán cứng.
- **Chứng minh đúng được (status `valid`):** CHỈ khi đáp số cuối khớp nguyên vẹn đáp số đã biết của
  3 đề mẫu (`khopDapSo`).
- **Mọi bước khác:** status `unverified` → giao diện hiện "? Chưa tự kiểm được", kèm cách tự kiểm.
- Giao diện dựng nhãn bằng `ketQuaBuoc()` (`packages/core-contracts/stemScratchpad.ts`).

**Luật bất biến:** bước không chứng minh được thì **KHÔNG BAO GIỜ** báo "đúng"/"hợp lệ"/tô xanh.
Bất kỳ bộ kiểm mới nào (đại số ký hiệu, đếm nguyên tử, thứ nguyên) phải trả `valid` **chỉ khi đã
chứng minh**, và cần test ca sai rõ ràng (vd `2x = 15 + 7` sau `2x + 5 = 15`) không bao giờ ra
`valid`.

**CHƯA CÓ — cần đặc tả trước khi làm:**

- kiểm đẳng trị đại số giữa hai dòng biến đổi;
- đếm nguyên tử / bảo toàn điện tích cho phương trình bất kỳ;
- kiểm thứ nguyên cho từng bước giữa.

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
- Thực tế hiện tại: `generateMicroHint` của bảng nháp chỉ có gợi ý soạn sẵn cho đề mẫu. Gợi ý theo
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
