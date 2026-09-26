# Triển khai lên VPS Ubuntu Server

> Hướng dẫn này dành cho người mới — giải thích từng bước từ cài môi trường đến HTTPS.
> Đọc hết một lần trước khi bắt đầu để hiểu tổng thể.
>
> **Dự án deploy bằng VPS (Express `server.ts` + PM2 + Nginx) — KHÔNG dùng Vercel.**
>
> Muốn thêm Cloudflare (CDN + chống DDoS, miễn phí) trước VPS này? Xem
> `docs/cloudflare-setup.md` — làm SAU KHI app đã chạy ổn qua Nginx (hướng dẫn dưới đây).

---

## Kiến trúc tổng quan

```
Internet
   │
[Nginx :443]  ← nhận HTTPS, tên miền, gzip, serve file audio tĩnh /uploads/
   │
[Express :3001]  ← server.ts: api/*.ts (auth Bearer token tự viết) + phục vụ React build (dist/)
   │
[PostgreSQL tự host]  ← database (user, lịch sử học, tts_cache...) — cùng VPS
   │
[Cloudflare R2 hoặc /uploads/ local]  ← audio cache TTS/phát âm (STORAGE_DRIVER)
```

App chạy bằng **PM2** trên **Node.js 22** (yêu cầu tối thiểu — dùng cho `tsx`/ESM và các
thư viện hiện tại, không còn ràng buộc riêng nào từ Supabase).

---

## Thông tin VPS thực tế đang dùng

| Mục           | Giá trị                                            |
| ------------- | -------------------------------------------------- |
| OS            | Ubuntu 24.04 (3 vCPU / 3GB RAM)                    |
| Node          | v22.x (cài hệ thống, đường dẫn `/usr/bin/node`)    |
| Thư mục app   | `/var/www/dhcb`                                    |
| Port app      | **3001**                                           |
| Domain chính  | `donghanhcungban.org`, `en-vi.donghanhcungban.org` |
| Domain phụ    | `donghanhcungban.com`, `en-vi.donghanhcungban.com` |
| Audio storage | **Cloudflare R2** (`STORAGE_DRIVER=r2`)            |
| PM2 app name  | `dhcb` (3 cluster workers)                         |
| Database      | PostgreSQL `dhcb`, user `dhcb_app`                 |

> Xem chi tiết bảng so sánh **Cấu hình tối thiểu vs Cấu hình khuyến nghị** tại [`docs/system-requirements.md`](system-requirements.md).

---

## ✅ Checklist trước khi bắt đầu

| Tiện ích                       | Bắt buộc?      | Bước      |
| ------------------------------ | -------------- | --------- |
| PostgreSQL tự host + bảng      | ✅             | Bước 0    |
| Firewall `ufw`                 | ✅ Nên có      | Bước 1    |
| Node.js 22                     | ✅             | Bước 2    |
| Nginx + PM2 + log rotation     | ✅             | Bước 3    |
| `.env` đủ key                  | ✅             | Bước 4    |
| HTTPS (Let's Encrypt)          | ✅             | Bước 7    |
| Pre-cache audio (seed scripts) | ⬜ Khuyên dùng | Bước 8    |
| Backup uploads                 | ⬜ Tùy chọn    | mục riêng |

---

## Bước 0 — Cài PostgreSQL tự host + tạo bảng

App **không chạy được** nếu chưa có database. Xem hướng dẫn đầy đủ (cài đặt, tạo user
riêng không dùng superuser, backup) tại **`docs/setup-postgresql-vps.md`** — tóm tắt:

1. Cài PostgreSQL 16+ qua `apt`, tạo database `dhcb` + user riêng `dhcb_app`
   (không dùng superuser cho app).
2. Ghi connection string vào `.env` VPS: `DATABASE_URL=postgresql://dhcb_app:MAT_KHAU@localhost:5432/dhcb`.
3. Áp schema: `npm run migrate:pg` (đọc `postgres/schema.sql` + mọi file trong
   `postgres/migrations/*.sql` chưa chạy — tạo bảng `users`, `sessions`, `profiles`,
   `daily_usage`, `tts_cache`, `pronunciations`, `learning_progress`... quyền kiểm tra
   nằm trong code `api/`, không còn Row Level Security của Supabase).
4. Thiết lập cron `pg_dump` backup hàng ngày (Postgres tự host không có backup tự động
   như Supabase — xem mục 7 của `docs/setup-postgresql-vps.md`).

> Dùng `STORAGE_DRIVER=local` (mặc định) thì **không cần** cấu hình Cloudflare R2 —
> audio lưu thẳng vào thư mục `uploads/` trên VPS.

---

## Bước 1 — Bật firewall (ufw)

```bash
sudo ufw allow OpenSSH      # cổng 22 — đừng quên, kẻo tự khóa mình ngoài SSH
sudo ufw allow 'Nginx Full' # cổng 80 (HTTP) + 443 (HTTPS)
sudo ufw enable
sudo ufw status
```

> Express chạy ở cổng 3001 — **không cần mở ra ngoài** (chỉ Nginx gọi nội bộ).

---

## Bước 2 — Cài Node.js 22

### Cách A: Cài qua NodeSource (Node hệ thống — đơn giản hơn, đang dùng)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # phải ra v22.x.x
which node   # lấy đường dẫn → dùng ở Bước 5, ví dụ: /usr/bin/node
```

### Cách B: Dùng NVM (nếu cần chạy nhiều version Node song song)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 22
nvm which 22   # lấy đường dẫn → dùng ở Bước 5
```

> VPS hiện tại dùng **Cách A** (`/usr/bin/node`).

---

## Bước 3 — Cài Nginx, PM2 và log rotation

```bash
sudo apt update && sudo apt install -y nginx

npm install -g pm2

pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## Bước 2b — Nơi cất secret cho các job cron (đọc TRƯỚC khi tạo cron)

> **Luật: không viết mật khẩu thẳng vào crontab.** Ai đọc được `crontab -l` là thấy hết — và
> `crontab -l` là lệnh người ta chạy hằng ngày để xem lịch, nên bí mật lộ ra trong những tình
> huống hoàn toàn bình thường: dán output đi hỏi, chụp màn hình, gửi log.
>
> Nguy hiểm nhất là `ENV_BACKUP_PASSPHRASE`: nó giải mã **bản backup `.env`** trên R2. Ai có nó
> cộng một file backup là mở được toàn bộ secret của dự án — `DATABASE_URL`, khoá AI, khoá
> SePay. Một dòng crontab đánh đổi tất cả.

Cất secret của cron vào một file chỉ root đọc được:

```bash
sudo install -m 600 /dev/null /root/.dhcb-cron-env
sudo nano /root/.dhcb-cron-env
```

Nội dung (mỗi dòng một biến, không có `export`, không dấu nháy thừa):

```bash
ENV_BACKUP_PASSPHRASE=<passphrase-that>
FEATURE_STATUS_CRON_KEY=<khoa-that-khop-.env>
```

Rồi trong crontab, nạp file đó thay vì viết giá trị ra:

```cron
5 3 * * * . /root/.dhcb-cron-env && cd /var/www/dhcb && BACKUP_DIR=/var/backups/pg npm run backup:r2 >> /var/log/pg-backup-r2.log 2>&1
10 3 * * * . /root/.dhcb-cron-env && cd /var/www/dhcb && npm run backup:env >> /var/log/env-backup-r2.log 2>&1
15 3 * * * . /root/.dhcb-cron-env && cd /var/www/dhcb && npm run backup:system >> /var/log/system-backup-r2.log 2>&1
0 0,12 * * * . /root/.dhcb-cron-env && curl -s -X POST -H "x-cron-key: $FEATURE_STATUS_CRON_KEY" https://en-vi.donghanhcungban.org/api/admin-feature-status >/dev/null 2>&1
```

Kiểm quyền file (phải là `-rw-------`):

```bash
sudo ls -l /root/.dhcb-cron-env
```

**Nếu lỡ để lộ passphrase** (dán vào chat, chụp màn hình, commit nhầm): đổi passphrase mới
**và** xoá các bản backup `.env` cũ trên R2 rồi tạo lại — bản cũ vẫn mã hoá bằng passphrase cũ,
đổi khoá không làm chúng an toàn trở lại.

```bash
openssl rand -base64 32     # passphrase backup mới
openssl rand -hex 32        # FEATURE_STATUS_CRON_KEY mới (nhớ sửa cả .env rồi pm2 reload)
```

---

## Bước 3a — Tạo swap (làm TRƯỚC lần deploy đầu tiên)

> **Vì sao bắt buộc, không phải "nên có".** Số đo thật trên VPS ngày 2026-08-26:
>
> ```
> free -h  →  total 2.9Gi · used 1.1Gi · available 1.8Gi · Swap 0B
> pm2 list →  3 instance dhcb: 218 + 218 + 231 MB (+ pm2-logrotate 57 MB)
> ```
>
> Lúc rảnh thì dư dả. Nhưng `scripts/deploy.sh` chạy `npm ci` + `npm run build` **ngay trên
> máy đang phục vụ** — Vite cộng `tsc -b` 16 workspace ngốn thêm 1–1,5 GB ở đỉnh. Cộng vào
> 1,1 GB đang chạy là chạm trần 2,9 GB. Không có swap thì kernel gọi OOM killer, và OOM
> killer **không chọn tiến trình "đáng chết"**: nó có thể giết PostgreSQL giữa lúc deploy.
>
> Swap không làm máy nhanh hơn. Nó đổi "OOM giết mất một dịch vụ" lấy "deploy chậm hơn vài
> chục giây" — đó là toàn bộ mục đích.

```bash
cd /var/www/dhcb
sudo bash scripts/setup-swap.sh 6G
```

Script tự kiểm đĩa còn trống (đòi dư ít nhất 2 GB sau khi trừ swap), hỏi xác nhận trước khi
ghi, ghi `/etc/fstab` để swap sống qua reboot, và đặt `vm.swappiness=10` — kernel chỉ chạm
vào swap khi RAM thật sự cạn, chứ không đẩy dữ liệu sang sớm làm chậm máy.

Kiểm lại sau khi chạy:

```bash
free -h            # dòng Swap phải khác 0B
swapon --show
cat /proc/sys/vm/swappiness   # 10
```

Gỡ ra nếu cần: `sudo swapoff /swapfile && sudo rm -f /swapfile`, rồi xoá dòng `/swapfile`
trong `/etc/fstab`.

## Bước 3b — Cài Redis local (bắt buộc trước khi bật cluster mode nhiều tiến trình)

> Vì sao cần: cluster mode (`instances: 'max'` trong `ecosystem.config.cjs`) chạy N tiến
> trình Node song song, mỗi tiến trình vốn đếm rate limit bằng `Map` riêng trong bộ nhớ
> (xem `api/_lib/security.ts`) — nếu không dùng chung 1 nơi đếm, 1 IP có thể vượt giới hạn
> gấp N lần (N = số tiến trình), kể cả giới hạn gọi AI trả phí (Claude/Whisper/TTS). Cài
> Redis NGAY TRÊN VPS app hiện tại (không cần VPS riêng — đó là việc của GĐ2 ở cuối file
> này, dành cho quy mô lớn hơn nhiều) là cách rẻ nhất và độ trễ thấp nhất để giải quyết,
> vì rate limit chỉ dùng nội bộ giữa các tiến trình trên CÙNG máy, không cần lộ ra mạng
> ngoài. Nếu bỏ qua bước này: app vẫn chạy bình thường (rơi về `Map` in-memory, tự động
> cảnh báo ở log khởi động — xem `warnIfClusterWithoutRedis()`), chỉ là rate limit lỏng
> hơn khi có traffic đông.

```bash
sudo apt install -y redis-server
```

Đặt mật khẩu cho Redis (không để trắng, kể cả khi chỉ nghe cổng localhost — phòng trường
hợp cấu hình mạng thay đổi sau này):

```bash
sudo nano /etc/redis/redis.conf
```

Tìm dòng `# requirepass foo bar` (khoảng dòng bắt đầu bằng `#requirepass`), bỏ comment và
đổi thành mật khẩu mạnh riêng của bạn:

```conf
requirepass mat-khau-redis-that-cua-ban
```

Xác nhận Redis CHỈ nghe cổng nội bộ (mặc định `bind 127.0.0.1 -::1` đã đúng — không cần
sửa gì thêm, không mở port 6379 ra ngoài qua `ufw`):

```bash
grep '^bind' /etc/redis/redis.conf
```

Khởi động lại Redis để áp dụng mật khẩu, rồi kiểm tra chạy được:

```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server   # tự khởi động lại cùng VPS sau khi reboot
redis-cli -a 'mat-khau-redis-that-cua-ban' ping   # phải trả về PONG
```

Ghi lại giá trị `REDIS_URL` để dán vào `.env` ở Bước 4 ngay sau đây:

```
REDIS_URL=redis://:mat-khau-redis-that-cua-ban@127.0.0.1:6379
```

---

## Bước 4 — Clone code, tạo `.env`, cài đặt, build

```bash
cd /var/www
git clone https://github.com/seeker19110/dhcb.git dhcb
cd dhcb

mkdir -p logs uploads

nano .env
```

Nội dung `.env` đầy đủ (xem `.env.example` trong repo để có danh sách mới nhất):

```env
# ── PostgreSQL tự host (Bước 0) ──
DATABASE_URL=postgresql://dhcb_app:mat-khau-that@localhost:5432/dhcb

# ── Auth tự viết (Bearer token) — Google OAuth Client ID, CẢ 2 biến CÙNG giá trị ──
GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com

# ── AI + TTS ──
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_TTS_API_KEY=AIza...
# (Tùy chọn) nhiều key TTS xoay vòng để tránh hết quota — xem .env.example
# GOOGLE_TTS_API_KEYS=AIza...key1,AIza...key2

# ── Mã hóa audio cache (bắt buộc — 32 byte base64) ──
# Tạo key: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# ⚠️ Sau khi tạo xong KHÔNG ĐỔI — đổi key thì toàn bộ audio cache cũ giải mã thất bại
TTS_ENCRYPTION_MASTER_KEY=...

# ── Bảo mật: chỉ cho domain thật gọi API ──
ALLOWED_ORIGINS=https://donghanhcungban.org,https://www.donghanhcungban.org,https://en-vi.donghanhcungban.org,https://donghanhcungban.com,https://www.donghanhcungban.com,https://en-vi.donghanhcungban.com

# ── Domain app ──
EN_VI_HOSTNAME=en-vi.donghanhcungban.org,en-vi.donghanhcungban.com
VITE_ENGLISH_APP_URL=https://en-vi.donghanhcungban.org
VITE_SITE_URL=https://en-vi.donghanhcungban.org

# ── Lưu audio TTS — local (mặc định, ổ đĩa VPS) hoặc r2 (Cloudflare R2) ──
STORAGE_DRIVER=local
UPLOADS_DIR=/var/www/dhcb/uploads

# ── Cổng app ──
PORT=3001

# ── Redis local (Bước 3b) — rate limit dùng chung khi PM2 chạy nhiều tiến trình ──
REDIS_URL=redis://:mat-khau-redis-that-cua-ban@127.0.0.1:6379
```

> **Thiếu `TTS_ENCRYPTION_MASTER_KEY`** → audio cache mã hóa/giải mã thất bại, app fallback giọng trình duyệt.
> **Thiếu `DATABASE_URL`** → app không kết nối được database, mọi request lỗi 500.
> **Bỏ trống `ALLOWED_ORIGINS`** = cho phép mọi domain gọi API (chỉ dùng lúc dev).
> Xem đầy đủ mọi biến (kể cả tùy chọn) tại `.env.example`.

```bash
npm install
npm run build
```

> `npm run build` giờ gồm cả `build:server` (biên dịch `server.ts` + `api/**/*.ts` sang
> `dist-server/` — xem `tsconfig.server.json`). PM2 chạy thẳng `dist-server/server.js`,
> KHÔNG còn qua loader `tsx` — đây là điều kiện để cluster mode chạy được (xem comment
> trong `ecosystem.config.cjs`, mục 2026-07-25). **Luôn chạy `npm run build` trước mỗi
> `pm2 start`/`pm2 reload`**, nếu không PM2 sẽ chạy JS cũ (chưa có thay đổi mới nhất).

> **Rate limit + cluster mode:** `REDIS_URL` ở trên (Bước 3b) đã đủ để rate limit dùng
> chung đúng giữa mọi tiến trình PM2. Nếu bỏ qua Bước 3b và không đặt `REDIS_URL`, app vẫn
> chạy được (rơi về Map in-memory mỗi tiến trình, đúng hành vi cũ — có cảnh báo ở log khởi
> động, xem `warnIfClusterWithoutRedis()` trong `api/_lib/security.ts`) nhưng rate limit sẽ
> lỏng hơn N lần (N = số tiến trình) — chấp nhận được khi traffic còn thấp, không nên dùng
> khi traffic đông.

---

## Bước 5 — Cấu hình `ecosystem.config.cjs` (PM2)

```bash
nano ecosystem.config.cjs
```

File này đã có sẵn trong repo — dùng **cluster mode** (`instances: 'max'`, PM2 tự fork
1 tiến trình / CPU core) để tận dụng nhiều core. Port mặc định 3001 — đổi trong
`env.PORT` nếu cổng đã bị app khác dùng.

> Cluster mode từng bị rollback về fork mode ngày 2026-07-20 vì loader `tsx` không tương
> thích Node `cluster` module (worker crash im lặng) — đã gỡ nguyên nhân bằng bước biên
> dịch ở trên (`build:server`). **Lần đầu bật lại cluster mode trên VPS, theo dõi kỹ
> `pm2 logs` + `pm2 status` sau `pm2 start`/`pm2 reload`** — nếu thấy tiến trình
> "errored"/khởi động lại liên tục, rollback ngay về fork mode
> (`instances: 1, exec_mode: 'fork'`) và báo lại, đừng để service down.

Lưu ý: cluster mode chạy bằng Node của chính PM2 (không có trường `interpreter`) —
PM2 phải được cài bằng Node ≥ 22 (VPS này: Node hệ thống v22, `/usr/bin/node`).

Kiểm tra Node mà PM2 dùng:

```bash
pm2 info dhcb | grep -i 'node.js version'
```

---

## Bước 6 — Chạy app với PM2

```bash
pm2 start ecosystem.config.cjs

pm2 status   # cột "status" phải là "online"

pm2 logs dhcb   # log realtime (Ctrl+C để thoát)

# Tự khởi động khi VPS reboot
pm2 startup   # chạy lệnh sudo nó in ra
pm2 save

# Kiểm tra app sống
curl http://localhost:3001/api/health
# Kết quả: {"status":"ok","uptime":...}
```

---

## Bước 7 — Nginx reverse proxy + HTTPS

### 7a. Tạo config Nginx

File config chuẩn đã có sẵn trong repo tại `nginx/en-vi.conf` (đọc file đó để biết chi tiết:
`/js/`, `/assets/` được serve thẳng từ `dist/` không qua Express để giảm tải; `/uploads/` serve
file audio TTS; `/api/` và phần còn lại proxy về Express port 3001; có sẵn dòng `include` cho
Cloudflare real-IP — xem `docs/cloudflare-setup.md` nếu dùng). Copy lên VPS:

```bash
# Từ thư mục dự án trên VPS
sudo cp nginx/en-vi.conf /etc/nginx/sites-available/en-vi
sudo ln -s /etc/nginx/sites-available/en-vi /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 7a.1. Redirect URL cũ của Góc học tập (P1-9c)

Sau khi deploy bản có URL chuẩn mới, thêm các luật sau vào **block HTTPS phục vụ app** trong
`/etc/nginx/sites-available/en-vi`, đặt trước `location /`. Đây là redirect SEO tại Nginx cho
các URL đã được phát hành; Express vẫn giữ redirect tương thích khi Nginx chưa được cập nhật.
Không đổi hostname và không đặt luật này cho `/api/`.

```nginx
# Lập trình: giữ toàn bộ phần đuôi bài/khoá và query string.
location = /lap-trinh {
    return 301 https://$host/goc-hoc-tap/programming$is_args$args;
}
location = /lap-trinh/ {
    return 301 https://$host/goc-hoc-tap/programming$is_args$args;
}
location ~ ^/lap-trinh/(.*)$ {
    return 301 https://$host/goc-hoc-tap/programming/$1$is_args$args;
}

# Tiếng Anh: các trang gốc đã phát hành.
location = /lo-trinh-hoc { return 301 https://$host/goc-hoc-tap/english/lo-trinh$is_args$args; }
location = /bai-hoc { return 301 https://$host/goc-hoc-tap/english/bai-hoc$is_args$args; }
location = /tro-truyen { return 301 https://$host/goc-hoc-tap/english/tro-truyen$is_args$args; }
location = /luyen-noi { return 301 https://$host/goc-hoc-tap/english/luyen-noi$is_args$args; }
location = /luyen-viet { return 301 https://$host/goc-hoc-tap/english/luyen-viet$is_args$args; }
location = /luyen-nghe { return 301 https://$host/goc-hoc-tap/english/luyen-nghe$is_args$args; }
location = /tu-dien { return 301 https://$host/goc-hoc-tap/english/tu-dien$is_args$args; }
location = /tu-vung { return 301 https://$host/goc-hoc-tap/english/tu-dien$is_args$args; }
location = /cau-thong-dung { return 301 https://$host/goc-hoc-tap/english/cau-thong-dung$is_args$args; }
location = /truyen-song-ngu { return 301 https://$host/goc-hoc-tap/english/truyen$is_args$args; }
location = /so-tay-loi-sai { return 301 https://$host/goc-hoc-tap/english/so-tay-loi-sai$is_args$args; }
location = /on-thi { return 301 https://$host/goc-hoc-tap/english/on-thi$is_args$args; }
location = /thu-thach { return 301 https://$host/goc-hoc-tap/english/thu-thach$is_args$args; }
```

Kiểm tra trước khi reload và xác nhận cả URL gốc lẫn URL có phần đuôi:

```bash
sudo nginx -t
sudo systemctl reload nginx
curl -sS -o /dev/null -D - https://www.donghanhcungban.org/lap-trinh | head
curl -sS -o /dev/null -D - https://www.donghanhcungban.org/lap-trinh/bai-hoc/demo | head
# Cả hai phải trả HTTP/2 301 và Location bắt đầu bằng /goc-hoc-tap/programming.
curl -sS -o /dev/null -D - 'https://www.donghanhcungban.org/lo-trinh-hoc?utm_source=old' | head
# Phải trả 301 tới /goc-hoc-tap/english/lo-trinh và giữ query utm_source.
```

Đây là bước vận hành thủ công trên VPS; không chạy `nginx` hoặc reload production từ phiên AI.

### 7b. Cài HTTPS miễn phí (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx

sudo certbot --nginx -d en-vi.donghanhcungban.com

# Kiểm tra tự gia hạn
sudo certbot renew --dry-run
```

**⚠️ Lưu ý:** Certbot sẽ tự sửa file Nginx để thêm SSL certificate, nhưng sẽ **bỏ đi** `http2` từ dòng `listen`. Sau khi Certbot chạy xong, phải thêm lại `http2`:

```bash
# Sau certbot, edit file lại
sudo nano /etc/nginx/sites-available/en-vi

# Tìm dòng: listen 443 ssl;
# Sửa thành: listen 443 ssl http2;
```

Kiểm tra + reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
curl https://en-vi.donghanhcungban.com/api/health
```

### 7c. Kiểm tra HTTP/2 đã bật

```bash
# Cách 1: dùng curl
curl -I --http2 https://en-vi.donghanhcungban.com
# Kết quả phải có: HTTP/2 200

# Cách 2: dùng h2load (cài: sudo apt install nghttp2)
h2load -n 100 -c 10 https://en-vi.donghanhcungban.com

# Cách 3: kiểm tra online
# Truy cập: https://www.webpagetest.org/ → nhập domain → xem Protocol
```

**Lợi ích HTTP/2:**

- ✅ Multiplexing: gửi nhiều request cùng lúc (không chờ tuần tự)
- ✅ Nén header: giảm ~30% kích thước request/response
- ✅ Server push: đẩy asset trước khi client request (tùy chọn)
- ✅ Phù hợp hơn với nhiều file nhỏ (JS, CSS, hình ảnh)

---

## Bước 8 — Pre-cache audio (khuyên chạy 1 lần sau deploy)

Chạy trước để người dùng đầu tiên đã có audio ngay, không phải chờ generate:

```bash
cd /var/www/dhcb

# Cache phát âm từ điển (~8800 từ × 2 giọng nam/nữ)
npm run seed:pronunciation

# Pre-cache câu mẫu luyện nói (~1677 câu × 2 ngôn ngữ × 2 giọng = 6708 file)
BASE_URL=https://en-vi.donghanhcungban.com npm run prefetch:tts-patterns
```

> Hai script này tự bỏ qua file đã có — **chạy lại an toàn**.
> Nếu cần tạo lại toàn bộ (vd. cache cũ bị hỏng): thêm `-- --force` vào cuối.

---

## Cập nhật code mới (deploy lại)

> Có 2 cách: **tự động** (GitHub Actions, chạy sau khi CI pass trên `main` — xem
> `docs/DEPLOY.md`, cũng chạy migration) hoặc **thủ công bằng `scripts/deploy.sh`** mô tả
> dưới đây (cùng 1 script — `deploy.yml` cũng gọi thẳng file này, không còn 2 bản trùng
> lặp như trước).

**Cách khuyên dùng khi có migration mới: chạy `bash scripts/deploy.sh`**. Script này tự làm
hết: pull code → dọn `dist`/`public/data` cũ → cài thư viện → **tự động chạy mọi migration
Postgres tự host còn thiếu** (`npm run migrate:pg`, dừng deploy ngay nếu migration lỗi) →
build → reload PM2 kèm nạp lại `.env` (`scripts/pm2-reload.sh`, có vài giây downtime — xem
ghi chú fork mode trong `ecosystem.config.cjs`).

```bash
cd /var/www/dhcb   # hoặc đường dẫn thật trên VPS của bạn
bash scripts/deploy.sh
```

> ⚠️ **Cần có `DATABASE_URL` trong `.env`** (xem Bước 0 + Bước 4 phía trên). Script tự tạo
> bảng theo dõi `_schema_migrations` ở lần chạy đầu tiên. Xem chi tiết + trạng thái từng
> migration tại `postgres/migrations/README.md`.

<details>
<summary>Deploy thủ công từng bước (không dùng <code>scripts/deploy.sh</code>)</summary>

```bash
cd /var/www/dhcb
git pull origin main
npm install        # chỉ cần nếu package.json đổi
npm run migrate:pg # chạy migration Postgres tự host còn thiếu (cần DATABASE_URL trong .env)
npm run build      # chỉ cần nếu code frontend thay đổi
bash scripts/pm2-reload.sh   # reload + health check
```

</details>

---

## Chạy chung với app khác trên cùng VPS

VPS này đang có 2 app PM2:

- **`xboss`** (id 0) — Next.js, port 3000, interpreter riêng
- **`dhcb`** — Express, port 3001, cluster mode (Node của PM2, hệ thống v22)

Mỗi app có `PORT` riêng trong `ecosystem.config.cjs` của mình → không xung đột.

---

## Health check

```bash
curl https://en-vi.donghanhcungban.com/api/health
# {"status":"ok","uptime":123.4,"time":"2026-06-21T..."}
```

---

## Kiểm tra trạng thái tính năng (Admin — tự động 2 lần/ngày)

Trang `/admin` tab "Sử dụng, chi phí & Vận hành" có mục "Trạng thái tính năng": kiểm tra
CSDL, AI hội thoại (Anthropic/Gemini/Groq), STT (Groq/OpenAI), TTS (Google Cloud), lưu trữ R2,
thanh toán SePay còn phản hồi không — bấm "Kiểm tra thủ công" bất kỳ lúc nào, hoặc để crontab
VPS tự gọi 2 lần/ngày qua `POST /api/admin-feature-status` (header `x-cron-key` khớp
`FEATURE_STATUS_CRON_KEY` trong `.env`, không cần đăng nhập admin).

Thêm crontab (2 lần/ngày, 7h và 19h giờ Việt Nam = 0h và 12h UTC — đổi giờ nếu VPS đặt timezone
khác UTC, kiểm tra bằng `timedatectl`):

```bash
crontab -e
```

Thêm dòng (khoá đọc từ `/root/.dhcb-cron-env` — xem Bước 2b, KHÔNG viết thẳng vào crontab):

```
0 0,12 * * * . /root/.dhcb-cron-env && curl -s -X POST -H "x-cron-key: $FEATURE_STATUS_CRON_KEY" https://en-vi.donghanhcungban.org/api/admin-feature-status >/dev/null 2>&1
```

---

## Theo dõi dung lượng audio

```bash
du -sh /var/www/dhcb/uploads/          # tổng
du -sh /var/www/dhcb/uploads/*/        # theo thư mục con
ls uploads/tts-cache/en-US/female/ | wc -l      # đếm file đã cache
df -h                                            # ổ cứng tổng thể
```

---

## Dọn cache TTS thừa (audio không còn từ/dòng nào dùng)

Audio cache (bảng `tts_cache`) không tự hết hạn theo thời gian — CHỈ xoá khi câu đó không còn
nằm trong bất kỳ từ vựng/bài học/cụm từ nào của app nữa (vd. xoá bớt nội dung, đổi giọng), KHÔNG
xoá theo "lâu không ai nghe" (nội dung đang dùng phải giữ vô thời hạn). Dùng
`npm run seed:all -- --verify --clean-orphans --yes` — đối chiếu 2 chiều với dữ liệu thật rồi
mới xoá, xem chi tiết `docs/seed-guide.md` mục dọn dẹp orphan.

## Backup

Audio cache **có thể tạo lại** bằng script seed (chỉ tốn thêm Google TTS quota).
Dữ liệu quan trọng (tài khoản, lịch sử học) nằm trên **PostgreSQL tự host** — cron
`pg_dump` hàng ngày đã thiết lập theo `docs/setup-postgresql-vps.md` mục 7 (Postgres
tự host không có backup tự động như Supabase, tự chịu trách nhiệm backup).

```bash
# Backup uploads thủ công
tar -czf ~/backup-uploads-$(date +%Y%m%d).tar.gz /var/www/dhcb/uploads/

# Tự động hàng tuần (Chủ Nhật 2h sáng)
crontab -e
# 0 2 * * 0 tar -czf ~/backup-uploads-$(date +\%Y\%m\%d).tar.gz /var/www/dhcb/uploads/
```

---

## User sandbox chấm bài Lập trình (ADR-0007)

Server chạy PM2 bằng **root** (xem `scripts/deploy.sh`) — nếu không cấu hình biến
`PROGRAMMING_SANDBOX_USER`, code học viên nộp bài Lập trình bậc P1–P4 (Python) vẫn được chấm lại
đúng ở tiến trình con, nhưng tiến trình đó chạy bằng root (chỉ còn lớp allowlist + timeout bảo
vệ, thiếu lớp "user hệ thống riêng"). Chạy MỘT LẦN để bật thêm lớp này:

```bash
cd /var/www/dhcb
bash scripts/setup-programming-sandbox-user.sh   # tạo user, tự kiểm sudo/unshare --net
```

Sau đó thêm vào `.env` rồi nạp lại PM2 (script tự in đúng 2 dòng này ở cuối, đây là chép lại):

```bash
echo "PROGRAMMING_SANDBOX_USER=dhcb-sandbox" >> .env
pm2 restart dhcb --update-env
```

Kiểm tra đã ăn: `pm2 logs dhcb --lines 50 | grep -i sandbox` không thấy dòng cảnh báo "không tra
được uid/gid" nào — có nghĩa là mọi lượt chấm bài Lập trình sau đó chạy dưới user riêng, không
phải root. Xem `packages/subject-programming/completionSandboxServer.ts` và
`docs/adr/0007-completion-evidence-sandbox-lap-trinh.md` để biết đủ 3 lớp bảo vệ.

---

## Xử lý sự cố thường gặp

### App không start

```bash
pm2 logs dhcb --lines 50
```

Hay gặp: PM2 chạy bằng Node < 22 (cluster mode dùng Node của chính PM2) — kiểm tra:

```bash
pm2 info dhcb | grep -i 'node.js version'   # phải >= 22
which node   # Node hệ thống, nơi PM2 được cài
```

### Nginx 502 Bad Gateway

Express chưa chạy hoặc sai port.

```bash
pm2 status
curl http://localhost:3001/api/health
```

Nếu app không trả lời, kiểm tra port trong `.env` (`PORT=3001`) và `ecosystem.config.cjs`.

### Đăng nhập lỗi / không gọi được API

```bash
# Kiểm tra đủ key chưa
grep -E "^(DATABASE_URL|GOOGLE_CLIENT_ID|ANTHROPIC|GOOGLE_TTS|TTS_ENCRYPTION|ALLOWED_ORIGINS)" .env

# Reload sau khi sửa .env
pm2 reload ecosystem.config.cjs --update-env
```

Hay gặp: `ALLOWED_ORIGINS` không có domain của bạn → bị chặn CORS. `DATABASE_URL` sai/DB
chưa chạy → mọi request lỗi 500 (`pm2 logs dhcb` sẽ thấy lỗi kết nối Postgres).

### Audio không phát / fallback về giọng trình duyệt

```bash
# Kiểm tra file audio đã có chưa
ls /var/www/dhcb/uploads/tts-cache/en-US/female/ | head

# Kiểm tra Nginx phục vụ được không
curl -I https://en-vi.donghanhcungban.com/uploads/tts-cache/en-US/female/<tên-file>.mp3
```

Hay gặp: `TTS_ENCRYPTION_MASTER_KEY` bị đổi → giải mã thất bại. Key phải giống nhau từ lúc tạo đến khi dùng.

### Gia hạn SSL thủ công

```bash
sudo certbot renew && sudo systemctl reload nginx
```

---

## SSH nhanh — tự vào thẳng thư mục app

Để mỗi lần SSH tự nhảy vào `/var/www/dhcb` (khỏi gõ `cd` lại), thêm
**trên máy cá nhân** của bạn vào file `~/.ssh/config`
(Windows: `C:\Users\<tên-bạn>\.ssh\config`):

```ssh-config
# Host trơn — dùng vào VPS bình thường + chạy lệnh lẻ
Host vps
    HostName 103.118.29.58
    User root
    IdentityFile ~/.ssh/id_ed25519

# Host tự cd vào thư mục app khi đăng nhập tương tác
Host dhcb
    HostName 103.118.29.58
    User root
    IdentityFile ~/.ssh/id_ed25519
    RequestTTY yes
    RemoteCommand cd /var/www/dhcb && exec $SHELL -l
```

Cách dùng:

```bash
ssh dhcb                             # → vào thẳng /var/www/dhcb
ssh vps                              # → vào VPS như cũ (thư mục home)
ssh vps "pm2 logs dhcb"     # → chạy lệnh lẻ trên VPS
```

> ⚠️ Host có `RemoteCommand` (ở đây là `app`) **không** chạy được lệnh lẻ kiểu
> `ssh app "lệnh"` (sẽ báo xung đột lệnh). Vì vậy giữ thêm host trơn `xboss`
> để chạy lệnh nhanh. Đổi `User`/`IdentityFile` cho khớp nếu bạn đăng nhập
> bằng user hoặc khóa khác.

---

## Tóm tắt lệnh hay dùng

```bash
pm2 status                                # trạng thái tất cả app
pm2 logs dhcb                    # log realtime
pm2 reload ecosystem.config.cjs          # restart không downtime
pm2 restart dhcb --update-env   # restart + nạp lại .env
sudo nginx -t && sudo systemctl reload nginx   # reload Nginx sau khi sửa config

# Deploy nhanh
~/deploy-dhcb.sh

# Kiểm tra
curl https://en-vi.donghanhcungban.com/api/health

# Audio cache
du -sh /var/www/dhcb/uploads/
BASE_URL=https://en-vi.donghanhcungban.com npm run prefetch:tts-patterns -- --force
```

---

## GĐ2 (kế hoạch scale 50k concurrent): tách Postgres/Redis ra VPS riêng

> Xem bối cảnh đầy đủ: `docs/research/ke-hoach-scale-30k-concurrent.md` (mục 4.1/5.1/5.2) +
> `docs/research/dac-ta-gd2-scale-50k.md`. Bắt buộc phải làm TRƯỚC khi traffic thật tăng cao:
> VPS app hiện tại là **3 vCPU / 3GB RAM** (nâng 2026-08-21 — con số "1 vCPU" trong log deploy
> 2026-07-25 đã lỗi thời), đủ chạy 3 instance PM2 nhưng vẫn KHÔNG đủ chỗ cho Postgres/Redis
> nặng chạy chung.
>
> ⚠️ Đây là **việc phải làm TAY** (mua máy, SSH, không tự động hoá được qua CI) — làm cẩn thận
> từng bước, đừng xoá dữ liệu cũ cho tới khi xác nhận máy mới chạy ổn định.

### Bước 1 — Tạo VPS Postgres/Redis mới

Khuyến nghị (trong ngân sách $2.000/tháng đã chốt, xem đánh giá mục 4.1 kế hoạch scale): VPS cỡ
trung 4 vCPU / 8GB RAM ở nhà cung cấp giá rẻ (Hetzner CX-series, Vultr, DigitalOcean) —
**tách hẳn khỏi VPS app hiện tại** (đang dùng chung với app "xboss").

### Bước 2 — Cài PostgreSQL + PgBouncer trên máy mới

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib pgbouncer
sudo systemctl enable --now postgresql pgbouncer
```

Tạo database + user (đổi tên/mật khẩu thật, không dùng giá trị mẫu):

```bash
sudo -u postgres psql -c "create database dhcb;"
sudo -u postgres psql -c "create user tutor_app with encrypted password 'ĐỔI-MẬT-KHẨU-THẬT';"
sudo -u postgres psql -c "grant all privileges on database dhcb to tutor_app;"
```

Chạy schema + migration (từ máy có repo, trỏ `DATABASE_URL` tạm thời vào máy mới):

```bash
DATABASE_URL="postgresql://tutor_app:MẬT-KHẨU@<ip-vps-db>:5432/dhcb" \
  npm run migrate:pg
```

### Bước 3 — Cấu hình PgBouncer

Copy `postgres/pgbouncer.ini.example` (trong repo) thành `/etc/pgbouncer/pgbouncer.ini` trên máy
mới, điền đúng host/dbname thật (đọc kỹ comment trong file — giải thích từng tham số). Tạo
`/etc/pgbouncer/userlist.txt` theo định dạng PgBouncer (`"user" "md5hash"`), khớp user/password
đã tạo ở Bước 2.

```bash
sudo systemctl restart pgbouncer
```

### Bước 4 — Cài Redis trên cùng máy (hoặc máy riêng nếu tải cao)

```bash
sudo apt install -y redis-server
sudo systemctl enable --now redis-server
```

Đặt mật khẩu Redis (`requirepass` trong `/etc/redis/redis.conf`) — bắt buộc vì máy này sẽ mở
cổng cho VPS app kết nối từ xa.

### Bước 5 — Firewall: CHỈ cho phép IP VPS app

```bash
sudo ufw allow from <ip-vps-app> to any port 6432   # PgBouncer
sudo ufw allow from <ip-vps-app> to any port 6379   # Redis
sudo ufw enable
```

**TUYỆT ĐỐI không mở public 5432/6432/6379 ra Internet** — chỉ whitelist đúng IP VPS app.

### Bước 6 — Chuyển VPS app sang dùng máy mới

Trên VPS app, sửa `.env`:

```bash
DATABASE_URL=postgresql://tutor_app:MẬT-KHẨU@<ip-vps-db>:6432/dhcb
REDIS_URL=redis://:MẬT-KHẨU-REDIS@<ip-vps-db>:6379
PG_POOL_MAX=20   # khớp default_pool_size trong pgbouncer.ini — xem comment file mẫu
```

Reload app:

```bash
bash scripts/pm2-reload.sh
curl http://localhost:3001/api/health
```

Thử 1 luồng thật (đăng nhập, tra từ điển, chat) trước khi coi bước này xong.

### Rollback nếu có sự cố

Đổi `DATABASE_URL`/`REDIS_URL` trong `.env` VPS app về giá trị CŨ (Postgres/Redis local trên
VPS app hiện tại) rồi `bash scripts/pm2-reload.sh` lại — **KHÔNG xoá Postgres/Redis local cũ**
cho tới khi xác nhận máy mới chạy ổn định qua vài ngày traffic thật.
