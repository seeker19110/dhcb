# 0548 — Hội thoại CEFR: bằng chứng "đã học" bằng kiểm tra hiểu tất định (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** (chưa tạo — commit trên nhánh worktree) · **Loại:** `feat(english)`
- **Đặc tả:** `docs/specs/2026-10-09-hoi-thoai-cefr-bang-chung-da-hoc.md` (Approved for
  implementation — chủ dự án duyệt hướng chất lượng cao nhất 2026-10-09).
- **Nguồn:** nợ `PROGRESS.md` "[2026-09-15 — S11-1] Hội thoại CEFR đánh dấu 'đã xem' chứ không
  phải 'đã học'" — nay THU HẸP (xem cuối).

## Vấn đề (đã thấy trên trang thật)

Ảnh "trước" (Tầng 8b): chỉ cần MỞ hội thoại "Làm quen ở lớp học" là nút "Hội thoại" của unit trong
mục lục chuyển ✓ **Đã xong**, và danh sách hội thoại ẩn bài đó vào "đã hoàn thành". Không có gì
chứng minh người học hiểu.

## Đã làm

- **`apps/dhcb/src/lib/dialogueComprehension.ts`** — sinh đề 3 câu từ CHÍNH dữ liệu hội thoại, hàm
  thuần, tất định theo seed (`<owner>:<titleEn>|<chiều>|<lần làm>`), không gọi AI:
  ① nghĩa của một dòng (đáp án = bản dịch tác giả của chính dòng đó, nhiễu = bản dịch dòng khác,
  tránh dòng mà tên riêng/số chỉ có ở đáp án đúng) · ② câu được nói NGAY SAU (nhiễu = câu khác của
  cùng người nói với đáp án) · ③ ai nói câu này. Không dòng nào dùng lại giữa các câu. Loại nào
  không dựng được thì bù loại khác; dưới 2 câu → `[]` và giao diện nói thật "chưa kiểm tra được".
  Ngưỡng đạt `ceil(2·total/3)` (3 câu → 2).
- **`apps/dhcb/src/components/DialogueComprehensionCheck.tsx`** — màn kiểm tra CHE bản hội thoại
  (kèm bản dịch) khi làm; mỗi câu `fieldset role="radiogroup"` + `legend`, radio thật, đề gắn
  `lang`; nộp khi đủ câu (có lời nhắc chữ); phản hồi từng câu bằng CHỮ + biểu tượng ("Bạn chọn —
  đúng/chưa đúng", "Đáp án đúng", lời giải trích nguyên văn); focus vào khối kết quả
  `role="status"`; "Làm lại (câu hỏi mới)" đổi seed. Chưa đăng nhập: báo thật là chưa lưu.
- **`cefrProgress.ts`** — `markDialogueLearned`/`getLearnedDialogues`: bản ghi `learned|<khoá>`
  nằm CHUNG mảng `et_cefr_dialogue_<uid>` ↔ cột `cefr_dialogues` (UNION ở client + server) → đồng
  bộ cloud không cần migration; client cũ đẩy lại vẫn giữ. `getViewedDialogues` lọc tiền tố. Dữ
  liệu cũ "đã xem" giữ nguyên là đã xem.
- **Mục lục (`cefrOutline.ts`)** — `tienDoHoiThoaiCuaUnit`: chưa xem (`not-started`) · đã xem
  (`in-progress`, "Đã xem x/N · đã học y/N") · đã học hết (`completed`, nguồn mới
  `english.cefrDialogueLearned`). Không biết tổng (đang tải) thì không bao giờ khẳng định xong.
  Trang cấp, thẻ "Tiến độ theo môn" và cây ý định đều truyền tên hội thoại
  (`getDialogueTitlesByUnit`, lỗi tải thì bỏ qua).
- **Trang cấp** — mỗi hội thoại có nhãn chữ Chưa xem / Đã xem · chưa kiểm tra hiểu / Đã học; chỉ
  bài ĐÃ HỌC mới ẩn vào "đã hoàn thành".
- Skill `pedagogy-linguistics-master` (cả `.claude/skills` + `.agents/skills`) thêm mục A2.

## Quyết định tự chọn (trong ranh giới brief)

- **Không làm "sắp xếp lại lượt thoại"**: kéo-thả khó đạt a11y bàn phím/trình đọc màn hình; câu
  "next-line" đo cùng năng lực theo dõi mạch hội thoại bằng radio chuẩn.
- **Câu hỏi hỏi điều ĐÃ XẢY RA**, không hỏi "câu nào hợp lý" — đáp án đúng luôn là sự thật kiểm
  được trong dữ liệu, không phụ thuộc phán đoán (đúng yêu cầu "không bịa nội dung").
- **Lưu chung mảng có tiền tố** thay vì cột mới: không đổi schema (CLAUDE.md §12), đồng bộ sẵn.
- **Radio dùng `--focus-ring`** (≥ 3:1 mọi theme) thay `--a-500` (2,65:1 ở Blue sky).

## Bằng chứng kiểm chứng

- Quét dữ liệu thật: 139 hội thoại × 2 chiều × 2 lần làm đều ra 3 câu đủ 3 loại, đáp án kiểm
  ngược khớp dữ liệu; câu nghĩa "lộ đáp án": 0/834 (đo bằng oracle độc lập).
- Lệnh cổng + kết quả: xem báo cáo của đợt (typecheck/lint/cycles/prettier/vitest/audit:prose/e2e).
- Tầng 8b: ảnh trước/sau 1440 + 390, blue-sky + dark-blue, chiều A + B (màn hội thoại, màn kiểm
  tra, màn kết quả, trang cấp). Theme `kid` không chụp: trang CEFR chỉ vào `kid` theo nhóm tuổi,
  người dùng mẫu là người lớn.

## Còn mở (nợ thu hẹp trong `PROGRESS.md`)

- "Đã học" do client ghi sau khi đạt ở máy (cùng mức tin cậy `cefrGrammar`); server chấm lại qua
  `/api/learning/evidence` cần đưa dữ liệu hội thoại lên server — slice riêng.
- 162/197 unit không có hội thoại nhưng cây vẫn sinh nút "Hội thoại" (nay có chữ "Phần này chưa có
  hội thoại"); bỏ hẳn nút là đổi cấu trúc/đếm tổng — việc riêng.
- Số "đã xong" môn Anh của người dùng cũ có thể GIẢM (hội thoại chỉ đã xem không còn tính xong) —
  đúng ý đồ, nên báo trước trong ghi chú phát hành.
