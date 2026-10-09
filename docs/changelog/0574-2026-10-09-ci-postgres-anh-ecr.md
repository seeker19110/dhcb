# 0574 — CI: kéo image Postgres của job SQL PREPARE từ ECR Public thay vì Docker Hub

- **Ngày:** 2026-10-09 · **PR:** (xem mô tả PR) · **Loại:** `ci`
- **Nguồn:** chủ dự án chọn "Mở PR sửa CI" khi PR #1321 kẹt (phiên 2026-10-09).

## Vấn đề

Job `sql-prepare` ("SQL PREPARE trên Postgres thật", nằm trong `needs` của `quality`) dùng service
container `postgres:16` kéo ẩn danh từ Docker Hub. Ngày 2026-10-09 Docker Hub trả
`toomanyrequests: You have reached your unauthenticated pull rate limit` ở bước _Initialize
containers_ — hai run liền nhau của PR #1321 (head `de27cf1` có chạy lại, rồi head `d1aff60`) đều
đỏ trước khi có bước nào của job chạy, trong khi mọi job khác xanh. Lỗi không thuộc về PR nào:
cùng giờ, run trên `main` trước đó một tiếng vẫn xanh. Vì `quality` là required check, một giới
hạn của bên thứ ba chặn merge MỌI PR.

## Đã làm

- `.github/workflows/ci.yml`: `image: postgres:16` → `image: public.ecr.aws/docker/library/postgres:16`
  (bản sao chính thức của Docker Official Image trên Amazon ECR Public; cùng tag, cùng
  `env`/`ports`/healthcheck). Kèm comment nói lý do.

## Kiểm chứng

- Manifest `public.ecr.aws/docker/library/postgres:16` trả HTTP 200 qua registry API, có bản
  `amd64` (kiểm ở máy ngày 2026-10-09).
- `scripts/ci-workflow-policy.test.ts` không ràng buộc image; id job `sql-prepare` và `quality`
  giữ nguyên (CLAUDE.md §11.1 luật 2).
- Bằng chứng cuối là chính job `sql-prepare` của PR này chạy xanh trên CI.

## Không làm

- Không đăng nhập Docker Hub bằng secret: cần tài khoản + secret mới, chủ dự án chưa có; mirror
  công khai đủ cho một service container.
