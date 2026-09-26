# Review kỹ thuật contract Practice S04–S05

- Ngày: 2026-09-23; baseline `b0c424c0`; PR: [#1128](https://github.com/seeker19110/dhcb/pull/1128).
- Đối chiếu S03 đã merge #1121; S04/S05 còn lỗi trong source, chưa triển khai.
- Thêm [review S04–S05](../specs/2026-09-23-uiux-s04-s05-review.md): ổn định danh sách
  phát âm, nhánh chấm chi tiết, lỗi bất đồng bộ khi đổi UI, deduplicate span và guard điểm.
- Spec vẫn chưa Approved; review này không thay phê duyệt, gate sản phẩm hay pilot.
- Validation: Prettier check cho hai file và `git diff --check` đạt (Node 22.23.2).
- Không migration, không gọi provider. Rollback bằng revert tài liệu.
