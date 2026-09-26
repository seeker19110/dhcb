# S06 — Audit điều kiện triển khai follow-up contrast gate

Ngày 2026-09-23. Base: `422c9134` từ origin/main. Trạng thái:
**BLOCKED_IMPLEMENTATION_APPROVAL**; audit tài liệu, không xác nhận gate đạt.

## Bằng chứng duyệt và phạm vi đã tích hợp

- Spec `docs/specs/2026-09-23-uiux-s06-s08-accessibility.md` được thêm tại
  `818f0150` (#1119) với trạng thái Draft.
- Thay đổi spec tại `62eb7143` (#1131) duyệt riêng **S08 Approved for
  implementation**. §2 S06 vẫn là hợp đồng dự kiến; chưa có quyết định duyệt
  triển khai S06 follow-up trong lịch sử file đã kiểm.
- [PR #1122](https://github.com/seeker19110/dhcb/pull/1122) đã merge ngày
  2026-09-23. Chính mô tả PR ghi spec Draft cho milestone rộng và giới hạn đây là
  sửa lỗi hiện hữu. Merge source và CI xanh không thay thế quyết định duyệt spec.
- Goal vẫn ghi **PARTIAL #1122 MERGED**. Không đổi thành COMPLETE.

#1122 đã thêm collector inline/target/incomplete, phép đo 7:1 cho chữ đọc,
đo bổ sung SVG halo và ngoài vùng cuộn, kiểm snapshot thay đổi và sửa lỗi UI được
phát hiện. Đã đọc collector hiện hành và negative controls trong
`e2e/a11y-aaa.spec.ts`; không tái dùng số test cũ làm kết quả kiểm chứng bản audit.

Mẫu contrast danh sách bài học chỉ gồm 10 metadata thật phủ palette theo
`docs/ux-upgrade/s06/contrast-fixture-scope.md`. Không suy ra đã đo cả 350 bài.
Bằng chứng lịch sử trong `2026-09-23-s06-implementation-evidence.md` còn mở đầu
VERIFYING trên base cũ; trạng thái merge lấy từ GitHub và goal, không từ dòng đó.

## Blocker và bước tiếp theo

Yêu cầu của tác vụ follow-up quy định chỉ sửa implementation khi spec đã Approved;
nếu thiếu phải giao audit docs-only. Vì vậy đợt này không sửa source/test, không
tự đánh dấu Approved và không khẳng định đã tìm được defect được tái hiện.

Cần một quyết định duyệt rõ phạm vi S06 follow-up trong spec, merge trước source.
Sau đó chọn đúng một lỗi incomplete/negative-control có test tái hiện thất bại,
sửa tối thiểu, chạy Node 22 và toàn bộ gate liên quan; giữ ngưỡng và mọi rule.
Nếu không có lỗi an toàn tái hiện được, báo chưa có defect, không tạo pass giả.

Không truy cập production, provider trả phí hoặc worktree S04. Kiểm chứng đợt
docs-only: Prettier các Markdown thay đổi và git diff --check; không chạy hay
tuyên bố build/unit/E2E cho thay đổi source.
