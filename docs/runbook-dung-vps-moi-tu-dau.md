# Runbook: Dựng VPS mới hoàn toàn từ đầu + khôi phục dữ liệu (A → Z, 1 file)

> Dùng khi: VPS cũ hỏng phần cứng vĩnh viễn, hoặc **diễn tập** (thực hành quy trình khi chưa có sự
> cố thật). File này **tự đủ** — chứa nguyên văn lệnh cần chạy theo đúng thứ tự, không cần mở file
> khác giữa chừng. Tài liệu gốc để tham khảo sâu hơn khi cần (không bắt buộc đọc):
> `docs/deploy-vps-ubuntu.md`, `docs/setup-postgresql-vps.md`, `docs/ke-hoach-khoi-phuc-su-co.md`,
> `docs/ke-hoach-khoi-phuc-su-co-server.md`.
>
> ⚠️ Đây là thao tác thật trên hạ tầng. Nếu VPS hiện tại (`103.118.29.58`,
> `en-vi.donghanhcungban.org`) **vẫn đang chạy bình thường**, KHÔNG chạy các lệnh xoá/ghi đè trong
> file này nhắm vào nó. Chỉ áp dụng cho **VPS mới, trống**.
>
> Mọi lệnh `sudo`/SSH dưới đây phải chạy **trên VPS thật** — AI không có quyền SSH vào VPS
> production, không tự chạy hộ được.

---

## 0. Trước khi bắt đầu — thông tin cần có sẵn

| Mục                     | Giá trị                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Nhà cung cấp VPS mới    | _(điền)_                                                                                                                        |
| IP VPS mới              | _(điền sau khi tạo máy)_                                                                                                        |
| Domain                  | `en-vi.donghanhcungban.com` (đổi DNS A record sang IP mới ở Bước 9)                                                             |
| Backup Postgres         | ưu tiên lấy từ **R2** (`R2_BACKUP_BUCKET`, xem Bước 10) — không cần còn giữ VPS cũ                                              |
| `.env` cũ               | ưu tiên khôi phục từ R2 (Bước 10a) bằng `ENV_BACKUP_PASSPHRASE`                                                                 |
| `ENV_BACKUP_PASSPHRASE` | passphrase mã hoá `.env` khi backup — **không nằm trong chính `.env`** (theo thiết kế), lấy từ nơi lưu riêng (password manager) |
| SSH key                 | dùng key cũ nếu còn giữ, hoặc tạo cặp mới rồi cập nhật `~/.ssh/config`                                                          |
| Repo                    | `https://github.com/seeker19110/bilingual-english-vietnamese.git`                                                               |

> Nếu **mất luôn cả `.env` lẫn không khôi phục được từ R2** (chưa từng bật cron backup, hoặc mất
> `ENV_BACKUP_PASSPHRASE`) → phải tạo lại **toàn bộ secret mới** (xem Bước 6). `TTS_ENCRYPTION_MASTER_KEY`
> mới nghĩa là audio cache cũ không giải mã được nữa (chấp nhận được — TTS tự tạo lại khi có request
> mới). Mật khẩu người dùng KHÔNG phụ thuộc secret app (hash nằm trong DB) — chỉ cần restore đúng DB
> ở Bước 10 là user cũ đăng nhập lại được, dù `.env` là bản hoàn toàn mới.

---

## 1. SSH vào máy mới + cập nhật hệ thống

```bash
ssh root@<ip-vps-moi>
apt update && apt upgrade -y
```

### 1a. (Khuyên làm ngay) Cấu hình SSH tự động — đỡ gõ lại IP/passphrase mỗi lần

Làm trên **máy cá nhân của bạn** (không phải trên VPS) — mở `~/.ssh/config` (macOS/Linux) hoặc
`C:\Users\<tên-bạn>\.ssh\config` (Windows), thêm/sửa (đổi `HostName` mỗi lần IP VPS đổi):

```ssh-config
Host xboss
    HostName <ip-vps-moi>
    User root
    IdentityFile ~/.ssh/id_ed25519

Host app
    HostName <ip-vps-moi>
    User root
    IdentityFile ~/.ssh/id_ed25519
    RequestTTY yes
    RemoteCommand cd /var/www/dhcb && exec $SHELL -l
```

Dùng: `ssh app` (vào thẳng thư mục dự án) · `ssh xboss` (vào bình thường) ·
`ssh xboss "pm2 logs dhcb"` (chạy 1 lệnh lẻ — **không** dùng được với host `app` vì có
`RemoteCommand`, sẽ báo lỗi xung đột).

Nếu khóa SSH có passphrase (khuyên dùng), tránh gõ lại mỗi lần bằng `ssh-agent`:

```powershell
# Windows PowerShell
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent
ssh-add C:\Users\<tên-bạn>\.ssh\id_ed25519   # gõ passphrase MỘT LẦN
```

```bash
# macOS/Linux
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

> Quên passphrase = không khôi phục được, phải tạo khóa mới + thêm public key vào
> `~/.ssh/authorized_keys` trên VPS (cần vào VPS bằng cách khác trước, vd. console nhà cung cấp).

---

## 2. Bật firewall (ufw)

```bash
sudo ufw allow OpenSSH      # cổng 22 — đừng quên, kẻo tự khóa mình ngoài SSH
sudo ufw allow 'Nginx Full' # cổng 80 (HTTP) + 443 (HTTPS) — cài Nginx ở Bước 5 rồi mới có profile này
sudo ufw enable
sudo ufw status
```

---

## 3. Cài Node.js 22

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v      # phải ra v22.x.x
which node   # ghi lại đường dẫn, ví dụ /usr/bin/node — dùng để xác nhận PM2 dùng đúng Node ở Bước 8
```

---

## 4. Cài PostgreSQL tự host + tạo database

```bash
apt-cache policy postgresql   # xem version có trong kho Ubuntu (thường PostgreSQL 16), dùng bản kho mặc định

sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql

# Tạo user riêng cho app (KHÔNG dùng superuser)
sudo -u postgres psql <<'SQL'
create user tutor_app with password 'DAT_MAT_KHAU_MANH_O_DAY';
create database dhcb owner tutor_app;
SQL
```

Kiểm tra Postgres chỉ nghe nội bộ (mặc định đã đúng, không cần sửa gì thêm):

```bash
sudo -u postgres psql -c "show listen_addresses;"   # kỳ vọng: localhost
```

> **CHƯA chạy `npm run migrate:pg` ở bước này** — để DB trống, sẽ restore backup từ R2 ở Bước 10
> rồi mới migrate, tránh tạo bảng trống rồi phải xoá lại.

---

## 5. Cài Nginx, PM2, Redis, log rotation

```bash
sudo apt update && sudo apt install -y nginx
sudo ufw allow 'Nginx Full'   # chạy lại nếu Bước 2 báo chưa có profile này

npm install -g pm2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# Redis local — bắt buộc trước khi bật cluster mode (rate limit dùng chung giữa nhiều tiến trình)
sudo apt install -y redis-server
sudo nano /etc/redis/redis.conf
# Tìm dòng "# requirepass foo bar", bỏ comment, đổi thành:
#   requirepass mat-khau-redis-that-cua-ban
grep '^bind' /etc/redis/redis.conf   # xác nhận "bind 127.0.0.1 -::1" (mặc định, không sửa gì thêm)
sudo systemctl restart redis-server
sudo systemctl enable redis-server
redis-cli -a 'mat-khau-redis-that-cua-ban' ping   # phải trả về PONG
```

Ghi lại `REDIS_URL=redis://:mat-khau-redis-that-cua-ban@127.0.0.1:6379` — dùng ở Bước 6.

---

## 6. Clone code + khôi phục/tạo `.env`

```bash
cd /var/www
git clone https://github.com/seeker19110/bilingual-english-vietnamese.git dhcb
cd dhcb
mkdir -p logs uploads
npm install   # cần chạy trước để có lệnh npm run restore:env dùng được ở bước dưới
```

### 6a. Cách 1 (ưu tiên) — khôi phục `.env` từ R2

```bash
ENV_BACKUP_PASSPHRASE="passphrase-that-cua-ban" npm run restore:env
# → ghi ra .env.restored — TỰ ĐỌC LẠI nội dung rồi mới đổi tên (tránh restore nhầm bản môi trường khác):
mv .env.restored .env

# Sau khi khôi phục, sửa lại các giá trị đổi theo máy mới:
nano .env
# - DATABASE_URL: đổi mật khẩu Postgres nếu Bước 4 bạn đặt mật khẩu mới khác bản cũ
# - REDIS_URL: đổi theo mật khẩu Redis mới tạo ở Bước 5
```

### 6b. Cách 2 (không có backup `.env`) — tạo mới từ đầu

```bash
nano .env
```

```env
# ── PostgreSQL (Bước 4) ──
DATABASE_URL=postgresql://tutor_app:DAT_MAT_KHAU_MANH_O_DAY@localhost:5432/dhcb

# ── Auth tự viết (Bearer token) — Google OAuth Client ID, CẢ 2 biến CÙNG giá trị ──
GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com

# ── AI + TTS ──
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_TTS_API_KEY=AIza...

# ── Mã hóa audio cache (bắt buộc — 32 byte base64) ──
# Tạo key: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
TTS_ENCRYPTION_MASTER_KEY=...

# ── Bảo mật: chỉ cho domain thật gọi API ──
ALLOWED_ORIGINS=https://en-vi.donghanhcungban.com

# ── Lưu audio TTS ──
STORAGE_DRIVER=local
UPLOADS_DIR=/var/www/dhcb/uploads
# STORAGE_DRIVER=r2 cần thêm R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET/R2_PUBLIC_BASE_URL

# ── Backup R2 (bucket RIÊNG, PRIVATE, khác R2_BUCKET của audio) ──
R2_BACKUP_BUCKET=...

# ── Cổng app ──
PORT=3001

# ── Redis (Bước 5) ──
REDIS_URL=redis://:mat-khau-redis-that-cua-ban@127.0.0.1:6379
```

> Xem đầy đủ mọi biến (kể cả tùy chọn) tại `.env.example` trong repo.
> **Thiếu `TTS_ENCRYPTION_MASTER_KEY`** → audio cache thất bại, fallback giọng trình duyệt.
> **Thiếu `DATABASE_URL`** → mọi request lỗi 500. **Bỏ trống `ALLOWED_ORIGINS`** = cho mọi domain
> gọi API (chỉ dùng lúc dev).

### 6c. Build

```bash
npm run build   # gồm cả build:server — biên dịch server.ts + api/**/*.ts sang dist-server/
```

> Luôn chạy lại `npm run build` trước mỗi `pm2 start`/`pm2 reload`, nếu không PM2 chạy JS cũ.

---

## 7. Cấu hình PM2

File `ecosystem.config.cjs` đã có sẵn trong repo (cluster mode, `instances: 'max'`, port 3001 —
đổi nếu cổng khác đã bị chiếm bởi app khác trên cùng máy). Kiểm tra nhanh trước khi chạy:

```bash
cat ecosystem.config.cjs   # xác nhận env.PORT khớp .env
```

> Nếu lần đầu bật cluster mode thấy tiến trình "errored"/khởi động lại liên tục → đổi tạm về fork
> mode (`instances: 1, exec_mode: 'fork'`) trong file này, đừng để service down, rồi điều tra sau.

---

## 8. Nginx reverse proxy (chưa bật HTTPS vội)

```bash
cd /var/www/dhcb
sudo cp nginx/en-vi.conf /etc/nginx/sites-available/en-vi
sudo ln -s /etc/nginx/sites-available/en-vi /etc/nginx/sites-enabled/
```

⚠️ **Nếu dùng Cloudflare** (file config có dòng `include /etc/nginx/cloudflare-realip.conf;`) —
file đó **không nằm trong git**, phải tự sinh ra TRƯỚC khi `nginx -t`, nếu không sẽ báo lỗi
"No such file or directory":

```bash
sudo bash scripts/update-cloudflare-ips.sh
```

⚠️ **`nginx -t` ở bước này SẼ LỖI TIẾP** vì file config cũng trỏ sẵn tới cert Let's Encrypt
(`ssl_certificate`, `options-ssl-nginx.conf`, `ssl-dhparams.pem`) **chưa hề tồn tại** (chỉ tạo được
ở Bước 12) — đây là chuyện **bình thường ở giai đoạn này**, đừng cố sửa/reload ngay, cứ để Nginx
tạm chưa load site này (hoặc dừng hẳn) và làm tiếp Bước 9-11 trước, quay lại Bước 12 mới xử lý:

```bash
sudo nginx -t   # kỳ vọng: LỖI ở đây, bỏ qua, không chạy `systemctl reload` cho tới Bước 12
```

---

## 9. Trỏ domain sang IP mới

- [ ] Đổi DNS A record của `en-vi.donghanhcungban.com` sang IP VPS mới (ở nhà cung cấp domain).
- [ ] Chờ DNS propagate: `dig en-vi.donghanhcungban.com` phải ra đúng IP mới (vài phút tới vài giờ
      tùy TTL cũ).

> Cần app chạy tạm qua IP thẳng trong lúc chờ DNS? Bỏ qua HTTPS tạm thời, dùng
> `curl http://<ip-moi>/api/health` sau khi Bước 11 (start PM2) xong.

---

## 10. Khôi phục database từ R2 (KHÔNG cần VPS cũ còn sống)

```bash
cd /var/www/dhcb

# Xem có bản backup nào trên R2
RESTORE_PSQL_URL=postgresql://postgres:MAT_KHAU_SUPERUSER@localhost:5432/postgres \
  npm run restore:r2 -- --list

# Khôi phục thật — backup tự tạo lại toàn bộ schema, KHÔNG cần migrate:pg trước
RESTORE_PSQL_URL=postgresql://postgres:MAT_KHAU_SUPERUSER@localhost:5432/postgres \
  npm run restore:r2 -- --restore-into dhcb --yes

# Xác nhận dữ liệu thật, không phải bảng rỗng
sudo -u postgres psql dhcb -c "select count(*) from public.users;"

# Chạy migration còn thiếu (backup có thể cũ hơn schema mới nhất)
npm run migrate:pg
```

⚠️ **Reset lại mật khẩu role `tutor_app` — BẮT BUỘC, hay bị bỏ sót:** dump/restore theo database
**không mang theo mật khẩu role** (Postgres lưu hash mật khẩu ở catalog hệ thống riêng, ngoài phạm
vi 1 database) — dù `\du` cho thấy role `tutor_app` vẫn "tồn tại" (do dump có ghi lại ai là owner
bảng), mật khẩu thật của nó **không được khôi phục theo**. Nếu bỏ qua bước này, app sẽ chạy được
lúc `pm2 start` (không lỗi ngay) nhưng **mọi request đụng DB đều lỗi 500** vì `DATABASE_URL` sai
mật khẩu:

```bash
sudo -u postgres psql -c "ALTER ROLE tutor_app WITH PASSWORD 'khớp-đúng-mật-khẩu-trong-DATABASE_URL-của-.env';"

# Xác nhận bằng chính connection string app dùng, không phải bằng quyền postgres superuser
psql "$(grep '^DATABASE_URL=' .env | cut -d= -f2-)" -c "select count(*) from public.users;"
```

- [ ] `restore:r2 --list` thấy đúng bản backup mong muốn
- [ ] `restore:r2 --restore-into` chạy xong, không lỗi
- [ ] `select count(*) from public.users` > 0 và hợp lý so với traffic gần đây
- [ ] `npm run migrate:pg` chạy xong, không lỗi
- [ ] Mật khẩu role `tutor_app` đã reset khớp `.env` — xác nhận bằng connect thật qua `DATABASE_URL`,
      không chỉ bằng role `postgres` superuser (dễ nhầm "restore xong là chạy được")

### 10b. Phương án dự phòng — không dùng được R2 (còn giữ file backup local từ VPS cũ)

```bash
# Copy file backup local từ VPS cũ (hoặc nơi lưu ngoài) lên VPS mới
scp /duong/dan/dhcb_YYYYMMDD.sql.gz root@<ip-vps-moi>:/var/backups/

# Verify backup không hỏng trước khi restore thật
bash scripts/verify-pg-backup.sh /var/backups/dhcb_YYYYMMDD.sql.gz

# Restore vào DB thật (DB đang trống, không cần dropdb)
gunzip -c /var/backups/dhcb_YYYYMMDD.sql.gz | sudo -u postgres psql dhcb

npm run migrate:pg
```

### 10c. Không có backup nào (DB thật sự trống, ví dụ diễn tập lần đầu)

```bash
npm run migrate:pg   # tạo schema trống, không có dữ liệu người dùng nào
```

---

## 11. Bật app với PM2

```bash
cd /var/www/dhcb
pm2 start ecosystem.config.cjs
pm2 status                       # cột "status" phải là "online"
pm2 logs dhcb --lines 30   # xác nhận dòng "đang chạy tại http://localhost:XXXX" đúng port .env

pm2 startup   # chạy lệnh sudo nó in ra
pm2 save      # để PM2 tự khởi động lại khi VPS reboot

curl http://localhost:3001/api/health
# Kết quả: {"status":"ok","uptime":...}
```

⚠️ **Nếu log báo chạy sai port** (vd. thấy `3000` thay vì `3001` trong `.env`/`ecosystem.config.cjs`)
— **`pm2 restart --update-env` KHÔNG đủ để sửa**, vì PM2 tự set biến môi trường riêng của process
_trước khi_ code app đọc `.env` (`dotenv` mặc định không override biến đã có sẵn trong
`process.env`). Phải xoá hẳn process rồi start lại đúng bằng `ecosystem.config.cjs`:

```bash
pm2 delete dhcb
pm2 start ecosystem.config.cjs
pm2 save
```

---

## 12. HTTPS (Let's Encrypt) — chỉ làm sau khi DNS đã trỏ đúng (Bước 9)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d en-vi.donghanhcungban.com
```

⚠️ **Nếu `en-vi.conf` đã tự có sẵn dòng `ssl_certificate ...` trỏ tới cert chưa tồn tại** (đúng
tình huống VPS mới, Bước 8 đã báo trước) — lệnh trên **sẽ lỗi ngay** vì plugin `--nginx` tự chạy
`nginx -t` trước khi làm gì, mà config đang lỗi do thiếu cert. Đây là vòng lặp "con gà quả trứng",
xử lý bằng `--standalone` để lấy cert TRƯỚC, không đụng Nginx đang lỗi:

```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone -d en-vi.donghanhcungban.com
```

`certonly --standalone` chỉ tạo `fullchain.pem`/`privkey.pem`, **không tạo** 2 file Nginx cũng cần
(`options-ssl-nginx.conf`, `ssl-dhparams.pem` — bình thường do plugin `--nginx` tự sinh) — tạo tay:

```bash
sudo tee /etc/letsencrypt/options-ssl-nginx.conf > /dev/null <<'EOF'
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_session_tickets off;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
EOF
sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048   # ~30-60s

sudo nginx -t && sudo systemctl start nginx   # giờ phải pass
```

Cert lấy bằng `--standalone` **sẽ renew thất bại** về sau (tự mở port 80 riêng, xung đột Nginx
đang chiếm port đó) — chuyển ngay sang plugin `--nginx` để renew tự động hoạt động đúng
(giờ `nginx -t` đã pass nên chạy được, chọn "Renew & replace" khi được hỏi):

```bash
sudo certbot --nginx -d en-vi.donghanhcungban.com
sudo certbot renew --dry-run   # PHẢI pass — bằng chứng renew tự động sẽ hoạt động
```

**⚠️ Certbot bỏ đi `http2` khỏi dòng `listen` sau khi chạy** — kiểm tra, chỉ sửa nếu thiếu:

```bash
grep -n "listen 443" /etc/nginx/sites-available/en-vi
# Nếu chỉ còn "listen 443 ssl;" (thiếu http2), sửa lại:
sudo sed -i 's/listen 443 ssl;/listen 443 ssl http2;/' /etc/nginx/sites-available/en-vi
sudo nginx -t && sudo systemctl reload nginx
curl -I --http2 https://en-vi.donghanhcungban.com
```

---

## 13. Thiết lập lại cron backup (máy mới KHÔNG tự có — phải tạo lại)

```bash
sudo mkdir -p /var/backups && sudo chown postgres:postgres /var/backups
sudo -u postgres crontab -e
```

Thêm 3 dòng:

```cron
0 3 * * * pg_dump dhcb | gzip > /var/backups/dhcb_$(date +\%Y\%m\%d).sql.gz && find /var/backups -name 'dhcb_*.sql.gz' -mtime +7 -delete
5 3 * * * cd /var/www/dhcb && npm run backup:r2 >> /var/log/pg-backup-r2.log 2>&1
10 3 * * * . /root/.dhcb-cron-env && cd /var/www/dhcb && npm run backup:env >> /var/log/env-backup-r2.log 2>&1
0 4 * * 0 bash /var/www/dhcb/scripts/verify-pg-backup.sh >> /var/log/pg-restore-test.log 2>&1
```

> **`/root/.dhcb-cron-env` là gì:** file `chmod 600` chứa `ENV_BACKUP_PASSPHRASE` (và
> `FEATURE_STATUS_CRON_KEY`). Cách tạo: `docs/deploy-vps-ubuntu.md` **Bước 2b**.
> Không viết passphrase thẳng vào crontab — `crontab -l` là lệnh người ta chạy hằng ngày,
> nên bí mật sẽ lộ trong những tình huống hoàn toàn bình thường (dán output đi hỏi, chụp
> màn hình). Passphrase này giải mã được **toàn bộ `.env`** từ bản backup trên R2.

---

## 14. Pre-cache audio (tùy chọn, giảm độ trễ lần đầu cho người dùng)

```bash
cd /var/www/dhcb
npm run seed:pronunciation
BASE_URL=https://en-vi.donghanhcungban.com npm run prefetch:tts-patterns
```

> Tự bỏ qua file đã có — chạy lại an toàn. Thêm `-- --force` nếu cần tạo lại toàn bộ.

---

## 15. Checklist xác minh cuối cùng

- [ ] `curl https://en-vi.donghanhcungban.com/api/health` → `{"status":"ok",...}`
- [ ] Đăng nhập được bằng tài khoản thật đã có từ trước khi restore (xác nhận dữ liệu restore đúng)
- [ ] Thử 1 luồng mỗi loại: chat AI, tra từ điển, ghi âm luyện nói
- [ ] `pm2 status` ổn định, không restart loop (`↺` không tăng thêm sau vài phút)
- [ ] SSL hợp lệ: `sudo certbot certificates`
- [ ] `df -h /` còn nhiều dung lượng trống
- [ ] Cron backup (Bước 13) đã chạy thử 1 lần thành công, không lỗi
- [ ] Nếu dùng `STORAGE_DRIVER=r2`: `.env` máy mới vẫn trỏ đúng R2 bucket audio cũ (độc lập VPS,
      không cần khôi phục riêng)

---

## 16. Ghi lại sau khi hoàn tất (post-mortem / nhật ký diễn tập)

Ghi vào `PROGRESS.md`:

```
Loại: [Diễn tập / Sự cố thật]
Thời gian dựng lại: [bắt đầu] → [xong], tổng thời gian: [X phút/giờ]
Vướng mắc gặp phải: [bước nào chậm/khó, thiếu thông tin gì ở Phần 0]
Cải tiến runbook: [cập nhật gì vào file này cho lần sau nhanh hơn]
```

---

## 17. Việc KHÔNG thể tự động hoá (cần bạn quyết định/thực hiện tay)

1. Phần 0 (nhà cung cấp VPS, người liên hệ khẩn cấp) — nên điền trước khi cần dùng thật, không
   phải lúc đang sập.
2. Bản sao lưu `.env`/`ENV_BACKUP_PASSPHRASE` — tự bạn giữ ở nơi an toàn (password manager), AI
   không được lưu hộ secret thật.
3. Uptime monitoring tự động (UptimeRobot/Better Uptime) — hiện chưa có, nếu VPS mất chỉ phát hiện
   khi có người kiểm tra thủ công hoặc user báo lỗi.
