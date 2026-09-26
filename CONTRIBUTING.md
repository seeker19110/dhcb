# Đóng góp cho dhcb

Mọi thay đổi đi theo một luồng duy nhất: **Idea → Spec → Issue → Branch → Pull request → CI/Review → Merge → Release → Observe**.

Tài liệu chi tiết, tiêu chí vào/ra và ma trận kiểm thử nằm tại
[`docs/DEVELOPMENT_WORKFLOW.md`](docs/DEVELOPMENT_WORKFLOW.md).

## Bắt đầu nhanh

1. Tạo Feature request hoặc Bug report bằng Issue Form.
2. Chỉ bắt đầu code khi issue đạt Definition of Ready.
3. Tạo nhánh từ `main`: `feat/<issue>-<slug>`, `fix/<issue>-<slug>` hoặc `docs/<issue>-<slug>`.
4. Dùng conventional commits.
5. Mở draft PR sớm; liên kết issue bằng `Closes #<số>`.
6. Chạy kiểm tra phù hợp với mức rủi ro; chuyển Ready for review khi đạt Definition of Done.
7. Chỉ merge khi `quality`, `e2e` và `PR policy` xanh.

## Lệnh kiểm tra chuẩn

```bash
npm ci
npm run typecheck
npm run lint
npm run format:check
npm run test:coverage
npm run build
npm run size
npm run test:e2e
```

Với thay đổi tài liệu thuần túy, chạy Prettier cho file đã đổi và `git diff --check` là đủ.

## Quy tắc an toàn

- Không commit `.env`, secret, dữ liệu production hoặc dữ liệu người học.
- Không gọi provider trả phí trong test.
- Auth, payment, entitlement, usage, migration và AI cost là vùng rủi ro cao; xem `AGENTS.md`.
- Migration phải versioned, forward-compatible, có truy vấn xác minh và phương án rollback.
- Không push trực tiếp vào `main`; không deploy production ngoài PR đã được duyệt.
