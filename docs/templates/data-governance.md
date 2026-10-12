# Khuôn QUẢN TRỊ DỮ LIỆU (data governance)

> Thêm 2026-10-12 (changelog `0622`, từ `DATA-GOVERNANCE.template.md` của `seeker19110/project-template`,
> chỉnh cho DHCB). **Khi nào dùng:** đặc tả thêm **bảng/cột chứa dữ liệu người dùng mới** (migration ở
> `postgres/migrations/`) hoặc gửi dữ liệu người dùng tới **bên thứ ba mới**. Điền thành mục
> `## Quản trị dữ liệu` trong đặc tả. Lý do có khuôn: mỗi bảng mới phải tự trả lời "xuất được không, xoá
> theo tài khoản không, nằm trong backup không" — quên một câu là nợ kiểu `/api/persons` (PROGRESS.md).

## 1. Kê khai

| Bảng / cột | Loại (công khai · cá nhân · nhạy cảm · bí mật) | Để làm gì | Lưu ở đâu (Postgres · R2 · Redis · bên thứ ba) | Mã hoá khi lưu? | Giữ bao lâu | Ai đọc được | Xuất / xoá theo tài khoản |
| ---------- | ---------------------------------------------- | --------- | ---------------------------------------------- | --------------- | ----------- | ----------- | ------------------------- |
|            |                                                |           |                                                |                 |             |             |                           |

## 2. Năm câu bắt buộc trả lời (kèm đường dẫn mã hoặc test)

1. **Tối thiểu hoá:** cột nào bỏ được mà tính năng vẫn chạy? Không lưu "phòng khi cần".
2. **Xoá tài khoản:** bảng mới đã vào danh sách xoá/xuất (`PERSON_TABLES` ở
   `packages/core-personal/personErasureService.ts`, đặc tả `docs/specs/2026-10-08-xoa-tai-khoan-va-xuat-du-lieu.md`)
   chưa? Test nào chứng minh xoá xong không còn dòng nào?
3. **Mã hoá:** dữ liệu cá nhân/nhạy cảm mới có đi qua lớp mã hoá ở `docs/van-hanh-khoa-ma-hoa.md` không?
   Không thì vì sao.
4. **Backup:** dữ liệu này nằm trong backup Postgres lên R2 (`scripts/backup-pg-to-r2.ts`, giữ theo
   `BACKUP_KEEP_DAYS`) — xoá theo yêu cầu người dùng thì bản trong backup cũ hết hạn khi nào? Ghi rõ.
5. **Bên thứ ba:** gửi dữ liệu này cho nhà cung cấp AI/TTS/SePay nào? Gửi tối thiểu phần nào? Có gửi
   nội dung riêng tư của người dùng vào prompt không, và người dùng có biết không?

## 3. Bằng chứng

Test âm về quyền đọc · test xoá/xuất bao gồm bảng mới · `npm run check:sql` xanh với migration mới ·
log không chứa nội dung cột nhạy cảm.

**Người duyệt / ngày / xem lại khi:**
