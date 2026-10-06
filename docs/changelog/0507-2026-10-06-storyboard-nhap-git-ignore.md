# 0507 — Storyboard NHÁP hoạt họa Git ignore cho `p3-u11-l1` (2026-10-06)

- **Ngày:** 2026-10-06 · **PR:** chưa tạo (commit cục bộ) · **Loại:** `docs(curriculum)`.
- **Nối tiếp:** đặc tả hoạt họa AI Engineering và đặc tả chấm trạng thái gitignore (2026-10-05).

## Việc đã làm

- Thêm `docs/research/2026-10-06-ai-engineering-git-ignore-storyboard.md` theo khuôn storyboard gradient: bảng đối chiếu (bài ID, mục tiêu, câu hỏi kiểm tra, lý do cần chuyển động, reviewer, 5 trạng thái), bố cục dọc 480×660, mốc thời gian 10,8 s (mỗi mốc giữ 1,5 s), thứ tự di chuyển thẻ, nguyên văn title/description/5 captions, đáp án kiểm độc lập, giảm chuyển động/phát lại.
- Trạng thái tài liệu: **DRAFT — chờ reviewer chuyên môn duyệt**. Không ghi Approved, không có tên reviewer, không có kết quả review.
- 9 điểm **CẦN CHUYÊN GIA CHỐT** (mục 8), nổi bật: thẻ tracked cũ (`app.py` không khớp mẫu nên không chứng minh ignore; đề xuất thêm `old.pt`), cảnh `.env` đã commit (đề xuất để ngoài), `__pycache__/` và `models/x.pt` (đề xuất không vẽ), bản chụp đi so với thẻ di chuyển.

## Bằng chứng

- Chạy Git 2.43.0 thật trong thư mục tạm ngoài repo: sau `git add .` chỉ `.gitignore` và `README.md` vào vùng chờ; file tracked khớp `*.pt` sửa vẫn hiện ` M`; HEAD sau commit không có `.env`/`model.*`; thư mục làm việc còn đủ file.
- Không sửa mã nguồn, không có dữ liệu `animation`, chưa chụp ảnh, chưa chạy gate sản phẩm.
