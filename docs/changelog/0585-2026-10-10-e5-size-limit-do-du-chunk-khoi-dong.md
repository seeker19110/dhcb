# 0585 — Đợt E5 audit: `size-limit` đo ĐỦ JS khởi động + phép kiểm chống danh sách "mục"

- **Ngày:** 2026-10-10 · **PR:** (xem mô tả PR) · **Loại:** `build(size)`
- **Nguồn:** báo cáo `docs/audit/2026-10-10-audit-toan-dien-va-toi-uu.md` mục E5. Đụng file cổng
  `.size-limit.json` — **chủ dự án đã đồng ý trước** (2026-10-10, giữ trần 160 kB).

## Đã làm

1. **`.size-limit.json`** — mục "Initial JS" thêm 5 glob chunk `modulepreload` đang tải lúc khởi
   động (sau đợt E4): `rolldown-runtime`, `guestId`, `authHeader`, `storage`, `localJson`. Đổi tên
   mục thành "Initial JS (entry + vendors + modulepreload, brotli)". **Trần giữ nguyên 160 kB.**
2. **Phép kiểm phủ** `scripts/check-startup-coverage.ts` (+ logic thuần
   `scripts/lib/startupCoverage.ts`, 5 test): đọc `dist/index.html` thật, mọi file JS tải ngay
   (entry + `modulepreload`) phải khớp một glob của mục "Initial JS"; thiếu → thoát mã 1 và in
   đúng file. Nối vào `npm run size` (`size-limit && tsx scripts/check-startup-coverage.ts`) nên
   CI job `build` tự chạy — **không** sửa workflow.

## Vì sao cần phép kiểm (không chỉ thêm glob)

Danh sách glob theo tên module "mục" âm thầm khi cách chia chunk đổi: báo cáo audit (viết TRƯỚC
đợt E4) liệt kê `appSettings`, `syncOutboxStorage` — sau E4 `appSettings` đã rời đường khởi động
còn `localJson` mới xuất hiện. Đợt 0580 cũng từng dính đúng kiểu này (`vendor-zod` được
`modulepreload` mà size-limit không đếm). Từ nay chunk khởi động mới mà quên thêm glob là CI đỏ.

## Bằng chứng kiểm chứng

| Kiểm                                                     | Kết quả                                                   |
| -------------------------------------------------------- | --------------------------------------------------------- |
| `npm run size` trước (4 glob)                            | Initial JS 131,98 / 160 kB brotli                         |
| `npm run size` sau (9 glob = đủ 9 file `index.html` tải) | **135,59 / 160 kB** (84,7%) ✅ · ✅ 9 file đều được đếm   |
| Bỏ tạm glob `localJson` rồi chạy phép kiểm               | ❌ thoát mã 1, in `dist/js/localJson-*.js` (đã khôi phục) |
| `npm run budget`                                         | đọc được mục mới: còn 24,41 kB                            |
