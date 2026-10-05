# 0496 — Mô phỏng gitignore và chấm trạng thái Git (2026-10-05)

- **Ngày:** 2026-10-05 · **PR:** chờ tạo · **Loại:** `feat(programming)`.
- Spec Approved đã merge #1240 trước khi viết mã. Lát A triển khai engine/grader; nội dung và hoạt họa bài Git thuộc lát B sau.
- Bổ sung subset basename literal, một star và literal directory; tracked files không bị ignore. Snapshot tách rời, assertions strict, browser/server cùng chấm engine thật; grader chung fail closed.
- Trần 4.000 ký tự / 100 lệnh / 20 lệnh chuẩn bị / 100 file / 100 commit / 128 KiB state, rollback khi vượt; toàn lịch sử sau reset/rebase giữ bằng chứng.
- Reviewer tìm inherited-property lookup; sửa toàn các đường đọc và kiểm hồi quy tên `toString`, `valueOf`, `hasOwnProperty`.
- Full local: 794 file đạt, 1 bỏ qua; 18.536 test đạt, 2 bỏ qua (287,94 giây); build/typecheck/lint/format đạt. Rebase thêm checkpoint tài liệu #1242 sau full gate, không đổi source.
- Browser thật route Git/CodeMirror kiểm ignore, file còn workdir, lỗi subset và sample legacy; lượt tích hợp cuối 3/3 đạt trong 9,2 giây. Font symlink bị Vite chặn nên chưa dùng lượt này làm nghiệm thu hình thức chữ. Required CI còn chờ ở PR/goal.
- Không migration, I/O/mạng Git thật, mở grader Python hoặc deploy production thủ công. Rollback revert B trước A nếu B đã phát hành.
