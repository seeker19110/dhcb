# Review S08: phản hồi quiz và ownership focus

- Ngày: 2026-09-23. Base: `b0c424c0`. PR: [#1129](https://github.com/seeker19110/dhcb/pull/1129).
- Đã rà ExamQuestionCard, QuizTab, ba caller, hook keyboard và E2E hiện hữu.
- Thêm `docs/specs/2026-09-23-uiux-s08-review-contract.md`: năm phát hiện,
  state table live region/focus, ranh giới caller/shared hook, ma trận kiểm chứng.
- S06 đã tích hợp nhưng S08 vẫn Draft. Không sửa source trước phê duyệt/merge spec;
  không tự ghi Approved hoặc Done. Parent agent cập nhật goal/PROGRESS tập trung.
- Kiểm chứng: Prettier check hai file Markdown và git diff --check đạt; không chạy full source gate vì chỉ tài liệu.
- Chưa có browser/AT evidence. Không migration, provider trả phí hoặc dữ liệu production.
- Rollback: revert PR tài liệu; không tác động trạng thái học viên.
