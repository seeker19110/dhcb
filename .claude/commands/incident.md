---
description: Xử lý sự cố production (incident response) — giảm thiệt hại trước, tìm nguyên nhân sau; kết bằng post-mortem cho sự cố nghiêm trọng
---

Kích hoạt **quy trình xử lý sự cố production**. Đọc kỹ `docs/ke-hoach-khoi-phuc-su-co-server.md` (chẩn đoán nhanh → kịch bản xử lý → restore backup → post-mortem) và **làm theo đúng các bước trong đó**. Nguyên tắc lõi: **giảm thiệt hại TRƯỚC, tìm nguyên nhân SAU** — theo bước cố định để không phải suy nghĩ lúc đang hoảng. (Nguồn: seeker19110/projects-template `.claude/commands/incident.md`, dịch/khớp DHCB 2026-09-19.)

> Khác `docs/DEPLOY.md` (deploy + fix nhanh thường quy) và `docs/rollback-runbook.md` (rollback cấu hình theo PR cụ thể) — dùng `/incident` khi có **sự cố thật đang xảy ra**, không phải việc deploy bình thường.

> Đây là việc đụng **production & dữ liệu thật** → thuộc nhóm "PHẢI dừng và hỏi" (CLAUDE.md mục 12). **An toàn trước tốc độ:** mọi thao tác lên dữ liệu thật phải cân nhắc khôi phục **trước** khi chạy, và xác nhận với người dùng trước các bước không thể hoàn tác (đặc biệt: restore từ backup R2, xoay vòng khoá/mật khẩu).

## Trình tự (bám `docs/ke-hoach-khoi-phuc-su-co-server.md`)

1. **Phát hiện & ghi nhận + chọn mức SEV:** ghi thời điểm bắt đầu (UTC), triệu chứng, nguồn cảnh báo (Sentry, uptime, hoặc người dùng báo trực tiếp); chọn SEV1/2/3 theo bảng Phần 1b của tài liệu (phân vân → chọn mức cao hơn). Sự cố bảo mật: KHÔNG mở issue công khai (repo public).
2. **Chẩn đoán nhanh:** bám phần "chẩn đoán nhanh" của tài liệu — kiểm PM2 (`pm2 status`/`pm2 logs`), Nginx, Postgres, Redis, dung lượng đĩa VPS trước khi đoán mò.
3. **Giảm thiệt hại (mitigate) trước khi vá triệt để:** theo đúng "kịch bản xử lý" tương ứng trong tài liệu — restart service qua PM2, rollback deploy gần nhất (`docs/rollback-runbook.md`), hoặc restore backup (DB/.env/Nginx+crontab+PM2 — đã kiểm chứng cả hai chiều, xem PROGRESS.md). **Xác nhận người dùng trước thao tác lên dữ liệu thật.**
4. **Liên lạc:** nếu ảnh hưởng người dùng thật đang dùng `donghanhcungban.org`, cân nhắc thông báo (banner/status) nếu sự cố kéo dài.
5. **Khắc phục triệt để:** nhánh `fix/...` → qua đủ cổng commit/merge (CLAUDE.md mục 8–9) → deploy qua `docs/deploy-vps-ubuntu.md`.
6. **Đóng sự cố:** xác nhận hết triệu chứng (health check `/api/health`, kiểm tra luồng chính); ghi thời điểm kết thúc.
7. **Post-mortem (bắt buộc với SEV1/SEV2):** một file `docs/ops/postmortem/YYYY-MM-DD-<slug>.md` theo khuôn ở `docs/ops/postmortem/README.md` — dòng thời gian (UTC + giờ Việt Nam, kèm bằng chứng), nguyên nhân gốc (5 Whys), hàng rào mới; thêm một dòng trỏ tới file vào `PROGRESS.md` mục "Sự cố hạ tầng đã xử lý". **Văn hoá không đổ lỗi (blameless).**

## Bất biến

- Một **người điều phối** dẫn dắt xử lý, kể cả một mình — tránh vừa chữa cháy vừa tự hỏi bước tiếp theo.
- **Ghi lại mọi thay đổi lúc chữa cháy** (lệnh đã chạy, thời điểm) để post-mortem tái dựng được dòng thời gian.
- Mỗi sự cố để lại **ít nhất một hàng rào mới** (test hồi quy / cảnh báo Sentry / mục trong `TRAPS.md`) để cùng nguyên nhân không tái diễn.

Bắt đầu: hỏi nhanh **triệu chứng + nguồn cảnh báo**, rồi vào **Bước 1**.
