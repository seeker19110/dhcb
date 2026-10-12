# Hướng dẫn triển khai tự host — scale 50.000 concurrent (từ đầu tới cuối)

> Gom toàn bộ các bước rải rác trong `docs/deploy-vps-ubuntu.md`, `docs/setup-postgresql-vps.md`,
> `docs/research/dac-ta-gd2-scale-50k.md`, `docs/rollback-runbook.md` thành **1 luồng làm việc
> tuần tự duy nhất** — làm theo đúng thứ tự từ trên xuống, đừng nhảy cóc. Đây là việc **THỦ CÔNG**
> (SSH, mua máy) — AI không có quyền tự thực hiện, người đọc hướng dẫn này tự làm tay.
>
> Bối cảnh đầy đủ + quyết định đã chốt (ngân sách $2.000/tháng, tự host, không dùng managed):
> `docs/research/ke-hoach-scale-30k-concurrent.md`.

## 0. Trước khi bắt đầu — checklist chuẩn bị

- [ ] Đã đọc `docs/research/ke-hoach-scale-30k-concurrent.md` mục 4.1 (đánh giá ngân sách) và
      mục 5 (các quyết định đã chốt) — hiểu RÕ vì sao chọn tự host, không phải managed.
- [ ] Có quyền truy cập tài khoản nhà cung cấp VPS (Hetzner/Vultr/DigitalOcean — cỡ nào cũng
      được, miễn trong ngân sách) để tạo máy mới.
- [ ] Có quyền SSH vào VPS app hiện tại (`103.118.29.58` theo `docs/deploy-vps-ubuntu.md`).
- [ ] Đã backup thủ công 1 bản Postgres hiện tại TRƯỚC khi động vào bất cứ gì (an toàn):
      `pg_dump dhcb | gzip > ~/backup-truoc-khi-scale.sql.gz` (chạy trên VPS app hiện tại).

Nếu chưa tick hết — DỪNG, làm xong các mục trên trước.

## 1. Kiến trúc đích (sau khi hoàn tất hướng dẫn này)

```
                 Cloudflare (đã có sẵn — CDN + WAF)
                          │
                    Nginx trên VPS app (hiện tại — LB nhiều máy làm SAU, xem mục 8)
                          │
              PM2 cluster mode (đã bật, xem mục 3) — 1..N tiến trình
                          │
              ┌───────────┴───────────┐
              │                       │
   VPS DB/Redis MỚI (mục 2-6)    Cloudflare R2 (audio TTS)
   ├─ PostgreSQL + PgBouncer
   └─ Redis
```

**Thứ tự làm:** DB/Redis trước (mục 2-6) vì đây là nút thắt rõ ràng nhất đã xác nhận qua log thật
(VPS app hiện tại chỉ 1 vCPU — xem `PROGRESS.md`). Thêm VPS app / LB (mục 11) làm SAU, dựa vào số
đo k6 thật (mục 10), không làm trước khi có số liệu.

> ✅ **R2 đã bật và xác nhận hoạt động trên production từ 2026-07-20**
> (`docs/migration-thoat-ly-supabase.md` mục 10 — `STORAGE_DRIVER=r2` đã set trên VPS, audio
> mới tự động lên R2). Đây LÀ điều kiện tiên quyết cho mục 11 (thêm VPS app thứ 2) — nếu quay
> lại `STORAGE_DRIVER=local`, 2 VPS app sẽ có 2 cache KHÔNG đồng bộ (cache-miss trùng lặp, tốn
> tiền AI gọi lại). **Việc còn sót lại (tuỳ chọn nhưng nên làm):** audio đã cache TỪ TRƯỚC khi
> bật R2 vẫn còn nằm ở `uploads/` local trên VPS app — chưa xác nhận đã chạy đồng bộ nốt lên R2
> (xem mục 10 bước 7 của `docs/migration-thoat-ly-supabase.md`):
>
> ```bash
> STORAGE_DRIVER=r2 npm run seed:all -- --sync-r2 --dry-run   # xem trước, không ghi gì
> STORAGE_DRIVER=r2 npm run seed:all -- --sync-r2              # chạy thật, an toàn chạy lại nhiều lần
> ```
>
> Chạy xong, xác nhận qua Cloudflare Dashboard → R2 → bucket thấy đủ file, rồi mới cân nhắc dùng
> menu `v` (`--verify-r2 --delete-verified`) để xoá file local lấy lại dung lượng ổ đĩa.

---

## 2. Tạo VPS Postgres/Redis mới

Khuyến nghị: 4 vCPU / 8GB RAM (đủ cho cả Postgres + Redis chung 1 máy ở giai đoạn đầu; tách
Redis ra máy riêng sau nếu k6 cho thấy cần). Nhà cung cấp giá rẻ: Hetzner CX-series, Vultr,
DigitalOcean.

Ghi lại **IP máy mới** — dùng xuyên suốt các bước dưới (thay `<ip-vps-db>`).

## 3. Cài PostgreSQL + PgBouncer trên máy mới

SSH vào máy mới, chạy:

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib pgbouncer
sudo systemctl enable --now postgresql pgbouncer
```

Tạo database + user (đổi mật khẩu thật, không dùng giá trị mẫu, lưu vào trình quản lý mật khẩu):

```bash
sudo -u postgres psql -c "create database dhcb;"
sudo -u postgres psql -c "create user tutor_app with encrypted password 'ĐỔI-MẬT-KHẨU-THẬT';"
sudo -u postgres psql -c "grant all privileges on database dhcb to tutor_app;"
```

## 4. Áp schema + migration lên máy mới

Từ máy có sẵn repo (máy của bạn hoặc VPS app cũ), chạy tạm thời trỏ vào máy mới:

```bash
DATABASE_URL="postgresql://tutor_app:MẬT-KHẨU@<ip-vps-db>:5432/dhcb" \
  npm run migrate:pg
```

Kỳ vọng thấy `[migrate:pg] ✅ schema.sql xong.` — nếu lỗi, đọc kỹ thông báo, đừng đoán, xem lại
Bước 3 (user/quyền/mật khẩu).

## 5. Cấu hình PgBouncer

Copy `postgres/pgbouncer.ini.example` (đã có sẵn trong repo, có comment giải thích từng tham số)
thành `/etc/pgbouncer/pgbouncer.ini` trên máy mới — điền đúng `host`/`dbname` thật đã tạo ở
Bước 3. Tạo `/etc/pgbouncer/userlist.txt`:

```bash
# Định dạng: "tên_user" "md5<hash md5 của (password + username)>"
# Cách lấy hash nhanh: echo -n "MẬT-KHẨU-THẬTtutor_app" | md5sum
echo '"tutor_app" "md5<hash-vừa-tạo>"' | sudo tee /etc/pgbouncer/userlist.txt
```

```bash
sudo systemctl restart pgbouncer
```

## 6. Cài Redis trên cùng máy

```bash
sudo apt install -y redis-server
```

Sửa `/etc/redis/redis.conf`: đặt `requirepass MẬT-KHẨU-REDIS-MẠNH` (bắt buộc vì mở cổng cho VPS
app kết nối từ xa).

```bash
sudo systemctl enable --now redis-server
sudo systemctl restart redis-server
```

## 7. Firewall — CHỈ cho phép IP VPS app

Lấy IP VPS app hiện tại (`<ip-vps-app>`), rồi trên máy DB/Redis mới:

```bash
sudo ufw allow from <ip-vps-app> to any port 6432   # PgBouncer
sudo ufw allow from <ip-vps-app> to any port 6379   # Redis
sudo ufw enable
sudo ufw status   # xác nhận đúng 2 rule trên, KHÔNG có rule "allow 6432/6379 from anywhere"
```

**TUYỆT ĐỐI không bỏ qua bước này** — để hở Postgres/Redis ra Internet là lỗ hổng bảo mật nghiêm
trọng (dữ liệu người dùng thật, mật khẩu đã băm, session token).

## 8. Chuyển VPS app sang dùng máy mới

Trên VPS app, sửa `.env` (`nano /var/www/dhcb/.env` hoặc tương đương):

```bash
DATABASE_URL=postgresql://tutor_app:MẬT-KHẨU@<ip-vps-db>:6432/dhcb
REDIS_URL=redis://:MẬT-KHẨU-REDIS@<ip-vps-db>:6379
PG_POOL_MAX=20   # khớp default_pool_size trong pgbouncer.ini — xem comment file mẫu
# Migration/DDL nối THẲNG Postgres (5432), KHÔNG qua PgBouncer (6432) — một số DDL (vd
# CREATE INDEX CONCURRENTLY) không chạy được qua transaction pooling.
MIGRATE_DATABASE_URL=postgresql://tutor_app:MẬT-KHẨU@<ip-vps-db>:5432/dhcb
```

Reload app (KHÔNG cần deploy lại toàn bộ code, chỉ đổi `.env`):

```bash
cd /var/www/dhcb
bash scripts/pm2-reload.sh
curl http://localhost:3001/api/health
```

**Kiểm tra kỹ trước khi coi bước này xong:**

- `pm2 status` báo `online` (KHÔNG phải `errored`/khởi động lại liên tục).
- `pm2 logs dhcb --lines 30` không có lỗi kết nối DB/Redis.
- Thử 1 luồng thật qua trình duyệt: đăng nhập, tra 1 từ trong từ điển, gửi 1 tin nhắn Chat.

**Nếu có sự cố** → xem `docs/rollback-runbook.md` mục "GĐ2" (trả `.env` về giá trị cũ, KHÔNG xoá
Postgres/Redis local cũ cho tới khi máy mới chạy ổn định qua vài ngày).

## 9. Xác nhận backup + kiểm thử phục hồi trên máy mới

Máy DB mới cần cron `pg_dump` riêng (chưa tự động chuyển từ máy cũ):

```bash
sudo mkdir -p /var/backups && sudo chown postgres:postgres /var/backups
sudo -u postgres crontab -e
# Thêm dòng (3h sáng mỗi ngày):
0 3 * * * pg_dump dhcb | gzip > /var/backups/dhcb_$(date +\%Y\%m\%d).sql.gz && find /var/backups -name 'dhcb_*.sql.gz' -mtime +7 -delete
```

Sau khi có ít nhất 1 bản backup, xác nhận NGAY nó phục hồi được (đừng đợi tới lúc cần thật):

```bash
bash scripts/verify-pg-backup.sh
```

Kỳ vọng: `✅ Phục hồi + kiểm tra OK`. Nếu lỗi, đọc kỹ log — sửa xong mới coi bước này hoàn tất.
Thêm cron hàng tuần theo hướng dẫn trong `docs/setup-postgresql-vps.md` mục 7.1.

**Bắt buộc thêm:** đẩy backup lên Cloudflare R2 — backup nằm cùng ổ đĩa với DB gốc (như cron
trên) KHÔNG đủ an toàn, ổ hỏng mất cả 2. Xem `docs/setup-postgresql-vps.md` mục 7.2
(`npm run backup:r2`, bucket R2 riêng + private, tách khỏi bucket audio public-read).

## 10. Đo tải thật bằng k6 (đừng bỏ qua — mọi con số trước đó là ước lượng)

Cài k6 (https://k6.io/docs/get-started/installation/), rồi chạy tăng dần, **KHÔNG nhảy thẳng
lên 50k**:

```bash
BASE_URL=https://en-vi.donghanhcungban.com VU_TARGET=100  npm run loadtest:k6
# Đọc kết quả (p95 latency, tỷ lệ lỗi) → nếu đạt threshold, tăng dần:
BASE_URL=https://en-vi.donghanhcungban.com VU_TARGET=500  npm run loadtest:k6
BASE_URL=https://en-vi.donghanhcungban.com VU_TARGET=2000 npm run loadtest:k6
# ... tiếp tục tăng, DỪNG ngay khi thấy p95 tăng vọt hoặc tỷ lệ lỗi vượt 1% — đó là trần thật
```

**Chạy vào giờ ít traffic thật** nếu nhắm thẳng vào production (chưa có staging riêng) — báo
trước cho người vận hành biết đang test.

## 11. Thêm VPS app / bật Load Balancer — CHỈ khi bước 10 cho thấy cần

Nếu k6 cho thấy 1 VPS app hiện tại đã là trần (p95 tăng vọt ở VU_TARGET thấp), thêm VPS app thứ 2:

1. Tạo VPS mới (cùng cấu hình VPS app hiện tại, khuyến nghị 4 vCPU/8GB).
2. Clone repo, cài đặt y hệt VPS app hiện tại (`docs/deploy-vps-ubuntu.md` bước 1-6), trỏ
   `DATABASE_URL`/`REDIS_URL` vào máy DB/Redis đã tạo ở mục 2-6 (dùng CHUNG, không tạo DB mới).
3. Cấu hình Nginx (trên 1 trong 2 máy, hoặc máy thứ 3 riêng) làm load balancer round-robin giữa
   2 VPS app — health check tự loại máy chết.
4. Chạy lại k6 (mục 10) xác nhận cải thiện.

## 12. Bật Sentry (quan sát lỗi thật)

Tạo tài khoản miễn phí tại sentry.io → lấy DSN → điền `SENTRY_DSN`/`VITE_SENTRY_DSN` vào `.env`
VPS app → build lại (`npm run build`) → `pm2 restart dhcb --update-env`. Code đã sẵn
sàng (no-op tới khi có DSN) — chỉ cần điền giá trị.

## 13. Checklist hoàn tất

- [ ] VPS DB/Redis mới chạy ổn định ≥ 3 ngày, không lỗi trong `pm2 logs`.
- [ ] `verify-pg-backup.sh` chạy OK, có cron hàng tuần.
- [ ] Đã chạy k6 ít nhất tới mức traffic thật hiện tại × 2 (dự phòng tăng trưởng).
- [ ] Sentry nhận được lỗi thật (test bằng cách cố tình gây lỗi nhỏ, xem có lên dashboard không).
- [ ] Đã xoá Postgres/Redis local trên VPS app cũ (chỉ sau khi chắc chắn máy mới ổn định).
- [ ] `docs/rollback-runbook.md` đã đọc, biết cách rollback nếu sự cố xảy ra sau này.

---

**Nếu gặp bất kỳ bước nào không rõ hoặc lỗi không có trong hướng dẫn** — dừng lại, dán nguyên
văn lỗi để debug tiếp, đừng tự đoán tiếp (đúng nguyên tắc CLAUDE.md mục 5 — chống ảo giác).
