# Hướng Dẫn & Quy Trình Deploy Toàn Diện

> **Tài liệu hợp nhất toàn bộ quy trình deploy** (Tự động, Thủ công, Migration, Troubleshooting, Pre-cache & Checklist).
> Hướng dẫn thiết lập VPS lần đầu: xem **`docs/deploy-vps-ubuntu.md`**.
> Kế hoạch khôi phục sự cố server: xem **`docs/ke-hoach-khoi-phuc-su-co-server.md`**.

---

## 1. Thông Tin Môi Trường VPS Production

- **Domain chính**: `www.donghanhcungban.org`, `donghanhcungban.org`
- **Domain song hành / phụ**: `www.donghanhcungban.com`, `donghanhcungban.com`, `en-vi.donghanhcungban.org`, `en-vi.donghanhcungban.com`
- **Server IP**: `103.118.29.58` (Port Express: `3001`)
- **Thư mục ứng dụng**: `/var/www/dhcb`
- **PM2 Process Name**: `dhcb` (`instances: max`, `exec_mode: cluster`)

---

## 2. Các Phương Thức Deploy

### Cách 1 — Tự Động Qua GitHub Actions (Khuyến nghị)

- Khi PR được merge vào nhánh `main`:
  1. Workflow `.github/workflows/ci.yml` chạy kiểm tra cổng chất lượng (lint, typecheck, format, unit test, build).
  2. Nếu CI xanh, workflow `.github/workflows/deploy.yml` tự động SSH vào VPS và thực thi `bash scripts/deploy.sh`.
- Yêu cầu secrets cấu hình trong GitHub Repository: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`,
  `VPS_SSH_FINGERPRINT` (host key SHA256 của VPS — thiếu thì workflow DỪNG, không deploy mà không
  xác minh host). Lấy giá trị bằng lệnh chạy TRÊN VPS:
  `ssh-keygen -l -f /etc/ssh/ssh_host_ed25519_key.pub | cut -d ' ' -f2` (dạng `SHA256:…`). Đổi VPS
  hoặc cài lại SSH server ⇒ cập nhật secret này.

### Cách 2 — Triển Khai Thủ Công Trực Tiếp Trên VPS

Khi cần deploy khẩn cấp hoặc kiểm tra trực tiếp:

```bash
ssh root@103.118.29.58
cd /var/www/dhcb
bash scripts/deploy.sh
```

Hoặc từng bước thủ công:

```bash
cd /var/www/dhcb
git pull origin main
npm ci                  # cài đặt dependencies chuẩn theo package-lock.json
npm run build           # build client, server dist-server và hub
bash scripts/pm2-reload.sh # reload zero-downtime + health check
pm2 status
curl -s http://localhost:3001/api/health
```

---

## 3. Database Migration & CSDL

Script `scripts/deploy.sh` **tự động chạy** `npm run migrate:pg` trong bước 4/7:

- Áp dụng tuần tự các migration mới trong `postgres/migrations/`.
- Kiểm tra tính an toàn qua `npm run migrate:verify`.
- Tự động dừng deploy nếu migration gặp lỗi để tránh phá vỡ dữ liệu.

---

## 4. Xử Lý Sự Cố Nhanh (Troubleshooting Quick Guide)

| Hiện tượng | Nguyên nhân | Lệnh kiểm tra & xử lý |
| :---------------------------- | :------------------------------------- | :---------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **502 Bad Gateway** | App chưa start hoặc bị crash | `pm2 logs dhcb --lines 50`<br>`curl http://localhost:3001/api/health` |
| **Port 3001 bị chiếm** | Tiến trình cũ còn kẹt socket | `lsof -i :3001` sau đó `kill -9 <PID>` |
| **Đăng nhập lỗi / DB lỗi** | Thiếu biến môi trường hoặc DB pool đầy | `grep -E "^DATABASE_URL                                                                         | ^GOOGLE_CLIENT_ID" .env`<br>`bash scripts/pm2-reload.sh` |
| **Lỗi cache / node_modules** | Cần xóa sạch cài lại | `rm -rf dist dist-server node_modules && npm ci && npm run build && bash scripts/pm2-reload.sh` |
| **SSL Let's Encrypt hết hạn** | Certbot chưa tự renew | `sudo certbot renew --dry-run` |

---

## 5. Rollback Khẩn Cấp (Khi Deploy Lỗi)

Nếu bản deploy mới phát sinh lỗi nghiêm trọng:

```bash
cd /var/www/dhcb
git log --oneline | head -10
git reset --hard <commit-hash-on-dinh-truoc-do>
npm run build && bash scripts/pm2-reload.sh
```

---

## 6. Checklist Nghiệm Thu Sau Deploy

- [ ] `curl -s https://en-vi.donghanhcungban.org/api/health` trả về `{"status":"ok",...}`
- [ ] `curl -s https://en-vi.donghanhcungban.org/api/health/deep` trả về `{"status":"healthy",...}`
- [ ] PM2 hiển thị status `online` không có restart loop.
- [ ] Đăng nhập thành công và gửi tin nhắn chat thử nghiệm.
