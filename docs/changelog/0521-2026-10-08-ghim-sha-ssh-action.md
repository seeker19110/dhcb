# 0521 — Ghim `appleboy/ssh-action` theo commit SHA + cổng chặn action bên thứ ba ghim tag (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** #1273 · **Loại:** `ci` · **Nhánh:** `claude/peaceful-newton-czolhg`.
- **Nguồn:** nợ (3) của audit bảo mật lần hai (`docs/changelog/0465-*.md`), mục "Nợ kỹ thuật còn
  mở" trong `PROGRESS.md`. Chủ dự án: "tiếp tục các việc kế tiếp trong PROGRESS.md".

## Vì sao

`deploy.yml` dùng `appleboy/ssh-action@v1.2.5` và cấp cho nó `VPS_SSH_KEY`. Tag git là con trỏ dời
được: ai nắm repo action (chủ action, hoặc kẻ chiếm tài khoản họ) dời `v1.2.5` sang một commit độc là
lần deploy kế tiếp chạy mã đó với khoá SSH vào VPS production. Ghim commit SHA thì không dời được.

## Đã làm

- `.github/workflows/deploy.yml`: `appleboy/ssh-action@0ff4204d59e8e51228ff73bce53f80d53301dee2 # v1.2.5`.
  SHA tra bằng `git ls-remote https://github.com/appleboy/ssh-action 'refs/tags/v1.2.5*'` — tag nhẹ
  (không có dòng `^{}`), nên SHA chính là commit, không đổi hành vi.
- `scripts/ci-workflow-policy.test.ts` thêm luật 4: quét mọi `uses:` trong `.github/workflows/*.yml`,
  action ngoài tổ chức `actions/` (và ngoài action cục bộ `./`) phải ghim `@<SHA 40 ký tự>`. Kèm ca
  tự bảo vệ (quét ra > 5 `uses:` và có ít nhất một action bên thứ ba) để test không xanh rỗng.
- Dependabot (`github-actions`, hằng tháng) cập nhật được SHA kèm chú thích `# vX.Y.Z`, nên ghim SHA
  không làm mất cập nhật.
- `PROGRESS.md`: đóng nợ (3); sửa ba dòng trạng thái lỗi thời phát hiện lúc rà — FR-3a đã merge
  (#1261), hướng `mobile` S2–S4 đã có bài từ `0397` (24 bài `p6-u214…u225`).

## Bằng chứng

- Cổng mới trên `deploy.yml` cũ: **đỏ**, báo đúng `deploy.yml: appleboy/ssh-action@v1.2.5`; trên mã
  mới: 9/9 xanh.
- Action chính chủ `actions/*` vẫn ghim theo tag major — cố ý không ép: chúng do chính GitHub phát
  hành, cùng ranh giới tin cậy với runner đang chạy workflow; rủi ro dời tag nằm ở action bên thứ ba.

## Còn mở

- Nợ (4) của audit bảo mật lần hai (bài thử gọi thẳng IP gốc với `CF-Connecting-IP` giả) vẫn là việc
  tay sau deploy.
