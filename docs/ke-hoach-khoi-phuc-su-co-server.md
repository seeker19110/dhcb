# Kế hoạch khôi phục hoạt động server sau sự cố (Incident Recovery Plan)

> File này trả lời câu hỏi **"server sập/gặp sự cố thì làm gì, theo thứ tự nào"** — khác với:
>
> - `docs/DEPLOY.md` — deploy code mới + fix nhanh vài lỗi phổ biến (502, port bận...).
> - `docs/rollback-runbook.md` — rollback **cấu hình** khi 1 PR/thay đổi cụ thể gây lỗi.
>
> File này là **quy trình ứng phó sự cố tổng thể**: phát hiện → phân loại mức độ → xử lý theo
> từng kịch bản cụ thể → xác minh khôi phục xong → viết báo cáo sau sự cố (post-mortem).
> Đọc 1 lần để biết tổng thể; khi có sự cố thật, nhảy thẳng vào **Phần 3 (kịch bản)** khớp
> triệu chứng đang gặp.

---

## 0. Thông tin cần có sẵn (điền trước, đừng tìm lúc đang sập)

| Mục                     | Giá trị                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| VPS IP                  | `103.118.29.58` (VPS 3 vCPU / 3GB RAM)                                                         |
| Domain                  | `donghanhcungban.org` (Hub), `en-vi.donghanhcungban.org` (English App)                         |
| Thư mục app             | `/var/www/dhcb`                                                                                |
| PM2 process             | `dhcb` (port **3001**, 3 workers cluster)                                                      |
| Health check            | `curl https://en-vi.donghanhcungban.org/api/health`                                            |
| Database                | PostgreSQL tự host, db `dhcb`, user `dhcb_app`                                                 |
| Backup DB               | `/var/backups/dhcb_YYYYMMDD.sql.gz` (cron 3h sáng, giữ 7 bản)                                  |
| Audio storage           | `STORAGE_DRIVER` — `r2` (Cloudflare R2, độc lập VPS)                                           |
| Nhà cung cấp VPS/domain | _(điền: tên nhà cung cấp, cách đăng nhập control panel để restart VPS nếu SSH không vào được)_ |
| Người liên hệ khẩn      | _(điền: SĐT/email người quản trị dự phòng nếu không phải chỉ 1 người)_                         |

> ⚠️ **Việc cần làm ngay (không thuộc phần code):** điền 2 dòng cuối bảng trên — kế hoạch này vô
> dụng nếu không vào được VPS lúc sập và chỉ có 1 người biết cách xử lý.

### 0b. Kết nối SSH nhanh (đặt sẵn TRƯỚC khi có sự cố, đỡ mất thời gian lúc đang gấp)

Làm trên **máy cá nhân của bạn** (không phải trên VPS) — mở file `~/.ssh/config` (macOS/Linux) hoặc
`C:\Users\<tên-bạn>\.ssh\config` (Windows), thêm:

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

Cách dùng sau khi thêm:

```bash
ssh dhcb                    # vào thẳng /var/www/dhcb, không cần gõ cd
ssh vps                     # vào VPS bình thường (thư mục home)
ssh vps "pm2 logs dhcb"     # chạy 1 lệnh lẻ rồi thoát, không vào shell
```

> ⚠️ Đổi `IdentityFile` cho khớp đúng khóa SSH bạn dùng, và đổi `HostName` nếu IP VPS đổi (xem
> Phần 0 ở trên — nhớ cập nhật cả 2 chỗ khi đổi VPS). Host có `RemoteCommand` (`dhcb`) không chạy
> được lệnh lẻ kiểu `ssh dhcb "lệnh"` (báo lỗi xung đột) — dùng host trơn `vps` cho trường hợp đó.
> (Sửa 2026-10-12, changelog `0622`: phần này từng gọi `ssh app`/`ssh xboss` — tên host không khớp
> khối cấu hình ngay phía trên.)

**Nếu khóa SSH có đặt passphrase** (khuyên dùng, an toàn hơn) — mỗi lần `ssh dhcb`/`ssh vps` sẽ
hỏi lại passphrase, không phải lỗi. Muốn khỏi gõ lại mỗi lần trong cùng phiên làm việc, dùng
`ssh-agent`:

**Windows (PowerShell):**

```powershell
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent
ssh-add C:\Users\<tên-bạn>\.ssh\id_ed25519   # gõ passphrase MỘT LẦN khi được hỏi
```

Sau đó `ssh dhcb` trong cùng phiên PowerShell (và các phiên sau, vì đã set `Automatic`) sẽ không
hỏi lại passphrase.

**macOS/Linux:**

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

> Nếu **quên passphrase**: không có cách khôi phục — phải tạo khóa mới (`ssh-keygen`) rồi thêm
> public key mới vào `~/.ssh/authorized_keys` trên VPS (cần đăng nhập VPS bằng cách khác trước,
> vd. mật khẩu root hoặc console nhà cung cấp — xem kịch bản 3.1 nếu SSH không vào được).

---

## 1. Nguyên tắc chung khi có sự cố

1. **Bình tĩnh, đừng sửa tay trực tiếp trên VPS nếu tránh được.** Mọi thay đổi nên đi qua
   `git commit` + push + để `scripts/deploy.sh` tự chạy — sửa tay trên VPS sẽ **mất khi deploy
   lần sau** (`deploy.sh` chạy `git reset --hard origin/main`) và không ai biết bạn đã đổi gì.
   Ngoại lệ: sự cố khẩn cấp cần app sống lại **ngay** (xem Phần 3) — sửa tay để cứu hỏa trước,
   ghi lại đã làm gì, rồi đưa thay đổi đó vào commit thật ngay sau khi ổn định.
2. **Không xoá dữ liệu khi chưa chắc chắn.** Ưu tiên đổi cấu hình / rollback code trước; chỉ xoá
   (database, file backup cũ...) sau khi xác nhận hệ thống ổn định vài ngày.
3. **Luôn xác minh bằng lệnh thật**, không đoán — mọi bước dưới đây đều có lệnh copy-paste được.
4. **Ghi lại thời gian + việc đã làm** (kể cả trong lúc rối) — cần cho báo cáo post-mortem (Phần 5)
   và để người khác tiếp tục nếu bạn phải dừng giữa chừng.

### 1b. Phân mức sự cố (SEV) — chọn mức TRƯỚC khi chọn kịch bản

Mức quyết định **làm ngay hay xếp lịch** và **có bắt buộc post-mortem không** (Phần 5). Phân vân
giữa hai mức → chọn mức CAO hơn; hạ mức sau khi đã chẩn đoán là bình thường (ghi lý do vào
post-mortem). Thêm 2026-10-12 (changelog `0622`) — trước đó tài liệu nói "phân loại mức độ" mà
không có thang nào.

| Mức      | Nghĩa                                     | Ví dụ ở DHCB                                                                                                                                                                                           | Phản hồi                 | Post-mortem                              |
| -------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ | ---------------------------------------- |
| **SEV1** | Sập · mất dữ liệu · lộ dữ liệu · sai tiền | `/api/health` không phản hồi · lộ dữ liệu người dùng hoặc secret · mất/hỏng dữ liệu Postgres · SePay thu tiền mà không nâng VIP (hoặc ngược lại) · đếm lượt AI **fail-open** (đốt tiền API không trần) | Ngay, mọi lúc            | Bắt buộc                                 |
| **SEV2** | Luồng chính hỏng, site vẫn sống           | Đăng nhập lỗi · AI hỏng cho MỌI người (Claude lẫn dự phòng Groq/Gemini) · auto-deploy fail liên tiếp (production đứng ở code cũ — sự cố 2026-08-30) · backup đêm thất bại · SSL còn < 7 ngày           | Trong ngày               | Bắt buộc                                 |
| **SEV3** | Ảnh hưởng nhỏ, có đường lách              | TTS Google lỗi (đã rơi về Web Speech) · Redis chớp < 1 giây (nợ mở trong `PROGRESS.md`) · một trang/bài học lỗi                                                                                        | Xếp lịch như việc thường | Không bắt buộc — changelog đợt sửa là đủ |

**Sự cố bảo mật (lộ dữ liệu, xâm nhập, lỗ hổng đang bị khai thác):** repo là **public** — KHÔNG
mở issue công khai và KHÔNG commit chi tiết khai thác trước khi vá xong. Ghi tạm ở GitHub Security
Advisory riêng tư (`SECURITY.md`), post-mortem công khai chỉ viết **sau** khi đã vá và đã xoay vòng
khoá; phần kỹ thuật nhạy cảm tóm ở mức "đã đóng đường X", không kèm cách tái hiện.

---

## 2. Bước đầu tiên khi phát hiện sự cố — chẩn đoán nhanh (< 2 phút)

```bash
# 1. App còn phản hồi không?
curl -i https://en-vi.donghanhcungban.org/api/health

# 2. SSH vào VPS được không? (IP lấy ở Phần 0 — đổi VPS thì sửa CẢ hai chỗ)
ssh root@103.118.29.58

# --- Nếu SSH được, chạy tiếp trên VPS: ---

# 3. PM2 process còn sống không?
pm2 status

# 4. Log lỗi gần nhất
pm2 logs dhcb --lines 50 --nostream

# 5. Database còn sống không?
sudo -u postgres psql -c "SELECT 1;"

# 6. Còn đủ ổ đĩa / RAM không? (nguyên nhân sập âm thầm hay gặp nhất)
df -h /
free -h

# 7. Nginx còn chạy không?
sudo systemctl status nginx
```

Dựa vào kết quả, đi tới đúng kịch bản ở **Phần 3**:

| Triệu chứng                                                                               | → Kịch bản                                         |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `curl health` timeout/refused, SSH **không** vào được                                     | 3.1 VPS không phản hồi                             |
| SSH vào được, `pm2 status` báo `errored`/`stopped`/restart liên tục                       | 3.2 App (PM2) crash                                |
| `df -h /` báo `100%` hoặc gần đầy                                                         | 3.3 Hết dung lượng ổ đĩa                           |
| `psql -c "SELECT 1"` lỗi, hoặc log báo `ECONNREFUSED`/`too many connections` tới Postgres | 3.4 Database lỗi/không kết nối được                |
| App chạy, health OK, nhưng **dữ liệu sai/thiếu** (mất bài học, mất lịch sử...)            | 3.5 Mất/hỏng dữ liệu — cần restore backup          |
| Trình duyệt báo cảnh báo SSL / chứng chỉ hết hạn                                          | 3.6 SSL hết hạn                                    |
| Site load được nhưng cực chậm, hoặc log có traffic bất thường tăng vọt                    | 3.7 Quá tải / nghi bị tấn công (DDoS)              |
| Nghi có truy cập trái phép (log lạ, file lạ, tài khoản lạ)                                | 3.8 Nghi bị xâm nhập bảo mật                       |
| Deploy mới nhất gây lỗi (biết rõ do PR nào)                                               | → dùng `docs/rollback-runbook.md` thay vì file này |

---

## 3. Kịch bản xử lý chi tiết

### 3.1 VPS không phản hồi (SSH không vào được)

**Nguyên nhân thường gặp:** VPS bị treo/reboot ngoài ý muốn, nhà cung cấp bảo trì, hết RAM/CPU
khiến kernel không phản hồi SSH.

**Xử lý:**

1. Vào **control panel của nhà cung cấp VPS** (không qua SSH) — kiểm tra trạng thái máy (đang
   chạy/đã tắt), xem có cảnh báo (quá tải, vi phạm chính sách...) không.
2. Nếu máy hiện "đang chạy" nhưng SSH vẫn không vào: dùng chức năng **console/VNC** của nhà cung
   cấp (không cần SSH) để xem màn hình thật — thường thấy kernel panic hoặc log OOM-killer.
3. Nếu máy "đã tắt"/"treo": **restart VPS** qua control panel.
4. Sau khi VPS lên lại: SSH vào, chạy chẩn đoán Phần 2 lại từ đầu — PM2 thường **tự khởi động
   lại** app nếu đã chạy `pm2 startup` + `pm2 save` trước đó (kiểm tra: `pm2 status`; nếu app
   không tự lên, chạy `pm2 resurrect` hoặc `cd /var/www/dhcb && pm2 start
ecosystem.config.cjs`).
5. Nếu nguyên nhân là **hết RAM** (kiểm tra `dmesg | grep -i "out of memory"` sau khi vào lại
   được) → xem thêm mục 3.7 (quá tải).

### 3.2 App (PM2) crash / restart liên tục

**Triệu chứng:** `pm2 status` báo `errored` hoặc `↺` (restart count) tăng liên tục.

```bash
pm2 logs dhcb --lines 100 --nostream   # đọc lỗi thật gây crash
```

**Xử lý theo nguyên nhân log cho thấy:**

- **Thiếu biến môi trường / `.env` sai** (log kiểu `undefined is not a function` liên quan
  `process.env.X`, hoặc lỗi kết nối DB ngay khi start) → kiểm tra `.env` còn đủ key theo
  `.env.example` không (`diff <(grep -oP '^[A-Z_]+(?==)' .env.example) <(grep -oP '^[A-Z_]+(?==)' .env)`).
- **Lỗi do code mới deploy** (crash xuất hiện đúng lúc deploy gần nhất) → xem
  `docs/rollback-runbook.md` (rollback bằng `git revert` + push, KHÔNG sửa tay).
- **`exec_mode` PM2 lệch cấu hình** (đổi cluster↔fork gần đây) — dấu hiệu: crash im lặng, log
  gần như trống ngay sau start → xem ghi chú trong `ecosystem.config.cjs` + GĐ1 của
  `docs/rollback-runbook.md`.
- **Không rõ nguyên nhân, cần app sống lại ngay:**
  ```bash
  cd /var/www/dhcb
  pm2 delete dhcb
  pm2 start ecosystem.config.cjs
  pm2 logs dhcb --lines 30   # xem có lên ổn không
  ```
- Nếu vẫn lỗi → build lại sạch từ đầu (loại trừ `node_modules`/`dist` hỏng):
  ```bash
  cd /var/www/dhcb
  rm -rf dist dist-server node_modules
  npm ci
  npm run build
  pm2 restart dhcb
  ```

**Xác minh xong:** `curl https://en-vi.donghanhcungban.com/api/health` trả `{"status":"ok",...}`
và thử đăng nhập + 1 luồng thật (tra từ điển hoặc gửi 1 tin nhắn chat) trên trình duyệt thật.

### 3.3 Hết dung lượng ổ đĩa

**Triệu chứng:** `df -h /` gần/đúng 100%; app crash khi ghi log/file; DB ghi lỗi
`No space left on device`.

```bash
# Tìm thư mục chiếm nhiều dung lượng nhất
du -sh /var/www/dhcb/* | sort -rh | head -10
du -sh /var/backups/* 2>/dev/null | sort -rh | head -10
du -sh /root/.pm2/logs/* 2>/dev/null | sort -rh | head -10
```

**Dọn theo thứ tự ưu tiên (an toàn → rủi ro tăng dần):**

1. Log PM2 cũ (an toàn, tự sinh lại): `pm2 flush` (xoá log hiện tại) — vốn đã có
   `pm2-logrotate` (giới hạn 10MB/file, giữ 7 bản) nên nếu vẫn đầy → kiểm tra
   `pm2 conf pm2-logrotate` xem có bị tắt/đổi cấu hình không.
2. Backup Postgres **quá hạn giữ** (script `verify-pg-backup.sh`/cron đã tự xoá bản >7 ngày —
   nếu chưa chạy, xoá tay bản cũ nhất, **giữ lại ít nhất 1-2 bản gần nhất**):
   ```bash
   ls -lt /var/backups/dhcb_*.sql.gz
   ```
3. `node_modules`/`dist` cũ không dùng (an toàn, build lại được):
   ```bash
   cd /var/www/dhcb && rm -rf dist dist-server node_modules && npm ci && npm run build
   ```
4. **Không xoá** `uploads/` (audio cache, nếu `STORAGE_DRIVER=local`) hay dữ liệu Postgres thật —
   đây là dữ liệu người dùng, không tái tạo được.
5. Nếu dọn xong vẫn gần đầy lâu dài → cân nhắc: chuyển `STORAGE_DRIVER` sang `r2` (Cloudflare R2,
   xem `.env.example`) để audio không chiếm ổ VPS, hoặc nâng dung lượng VPS.

### 3.4 Database (PostgreSQL) lỗi / không kết nối được

**Triệu chứng:** log app báo `ECONNREFUSED`/`too many clients already`/timeout tới Postgres.

```bash
# Postgres còn chạy không?
sudo systemctl status postgresql

# Chưa chạy → khởi động lại
sudo systemctl restart postgresql
sudo systemctl status postgresql   # xác nhận "active (running)"

# Nếu báo "too many clients already" — xem có kết nối rò rỉ (không đóng) không:
sudo -u postgres psql -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
```

- **Postgres không tự khởi động lại được** → đọc log lỗi thật:
  `sudo journalctl -u postgresql -n 100 --no-pager`. Nguyên nhân thường gặp: hết ổ đĩa (→ 3.3),
  file cấu hình `postgresql.conf`/`pg_hba.conf` bị sửa sai gần đây, hoặc dữ liệu (`PGDATA`) hỏng.
- **`too many clients`** → app có thể đang leak connection pool (`pg.Pool` trong
  `api/_lib/pgPool.ts`) — restart app trước (`pm2 restart dhcb`) để giải phóng kết nối
  cũ, sau đó điều tra code nếu lặp lại thường xuyên (không phải sự cố tạm thời).
- **Dữ liệu nghi hỏng (không chỉ là không kết nối được)** → **DỪNG, không tự sửa tay trong DB**,
  chuyển sang mục 3.5 (restore từ backup) — sửa tay khi đang hoảng dễ làm mất thêm dữ liệu.

### 3.5 Mất/hỏng dữ liệu — khôi phục từ backup Postgres

**Dùng khi:** dữ liệu bị xoá/sửa sai (do bug, thao tác nhầm, hoặc DB hỏng không sửa được).

⚠️ **Đây là thao tác không thể hoàn tác dễ dàng — xác nhận với người dùng/đội trước khi restore
đè lên database đang chạy**, trừ khi database đã hỏng hoàn toàn và không còn lựa chọn khác.

```bash
# 1. Xem các bản backup có sẵn (mới nhất trước)
ls -lt /var/backups/dhcb_*.sql.gz

# 2. LUÔN backup trạng thái HIỆN TẠI trước khi ghi đè (dù đang lỗi — có thể vẫn cứu được ít dữ liệu)
sudo -u postgres pg_dump dhcb | gzip > /var/backups/before-restore-$(date +%Y%m%d-%H%M).sql.gz

# 3. Test khôi phục vào DB TẠM trước (không đụng DB thật) — dùng script có sẵn:
bash /var/www/dhcb/scripts/verify-pg-backup.sh /var/backups/dhcb_<ngày-cần>.sql.gz

# 4. Nếu bước 3 OK (backup không hỏng) — mới restore đè lên DB thật:
pm2 stop dhcb   # dừng app trong lúc restore, tránh ghi đè song song
sudo -u postgres dropdb dhcb
sudo -u postgres createdb dhcb -O tutor_app
gunzip -c /var/backups/dhcb_<ngày-cần>.sql.gz | sudo -u postgres psql dhcb

# 5. Chạy lại migration nếu backup cũ hơn schema hiện tại (bản backup có thể thiếu bảng/cột mới)
cd /var/www/dhcb && npm run migrate:pg

# 6. Khởi động lại app + xác minh
pm2 start dhcb
curl http://localhost:3001/api/health
```

**Lưu ý quan trọng:**

- Backup chạy **hàng ngày 3h sáng**, giữ 7 bản → dữ liệu mất **tối đa gần 24h** kể từ lần backup
  gần nhất (không phải real-time). Nếu cần khôi phục sát thời điểm sự cố hơn, không có cách nào
  khác ngoài backup gần nhất — đây là giới hạn đã biết (RPO ~24h), cân nhắc backup thường xuyên
  hơn nếu dữ liệu quan trọng tăng lên (xem "Cải tiến nên cân nhắc" ở Phần 6).
- Nếu `STORAGE_DRIVER=local`, **audio cache trong `uploads/` KHÔNG nằm trong backup Postgres** —
  mất file audio không mất dữ liệu học tập (audio sẽ tự tạo lại qua TTS lần gọi kế tiếp, chỉ tốn
  lại chi phí API TTS), nên không cấp bách bằng mất dữ liệu Postgres.

### 3.6 SSL (Let's Encrypt) hết hạn

```bash
sudo certbot certificates          # xem ngày hết hạn thật
sudo certbot renew --dry-run       # test renew có chạy được không (không đổi cert thật)
sudo certbot renew                 # renew thật nếu dry-run OK
sudo systemctl reload nginx        # áp cert mới vào Nginx
```

Nếu `certbot renew` lỗi (thường do domain không trỏ đúng IP nữa, hoặc port 80 bị chặn) → kiểm
tra DNS (`dig en-vi.donghanhcungban.com`) và `sudo ufw status` (port 80 phải mở cho HTTP-01
challenge).

### 3.7 Quá tải / nghi bị tấn công (DDoS, traffic spike bất thường)

```bash
# Xem kết nối đang mở nhiều nhất từ IP nào
ss -ant | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head -20

# Log Nginx — request nhiều nhất từ IP nào trong vài phút gần đây
sudo tail -n 5000 /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -20
```

- **Chi phí AI tăng bất thường do spam** (không phải lỗi hạ tầng) → dùng **"Cầu dao khẩn cấp AI"**
  ở trang `/admin-settings` (đã có sẵn, hiệu lực ~30s, không cần deploy) — xem
  `docs/rollback-runbook.md` mục GĐ3.
- **Traffic quá tải hạ tầng thật** → cân nhắc bật Cloudflare (CDN + chống DDoS miễn phí, xem
  `docs/cloudflare-setup.md`) nếu chưa bật; nếu đã bật Cloudflare, kiểm tra "Under Attack Mode"
  trong Cloudflare Dashboard.
- Tạm thời chặn IP cụ thể (chỉ khi xác định rõ IP tấn công, tránh chặn nhầm người dùng thật):
  ```bash
  sudo ufw deny from <IP>
  ```

### 3.8 Nghi bị xâm nhập bảo mật

**Dấu hiệu:** file lạ trong `/var/www/dhcb`, tài khoản Postgres lạ, log SSH có đăng nhập
từ IP không quen, `crontab` có dòng lạ.

**Xử lý (ưu tiên ngăn chặn trước, điều tra sau):**

1. **Đổi ngay mọi secret** có khả năng đã lộ: mật khẩu Postgres (`tutor_app`), `JWT_SECRET`/khoá
   ký token trong `.env`, API key AI (Claude/Groq/OpenAI/Google TTS) — thu hồi key cũ ở nhà cung
   cấp, tạo key mới, cập nhật `.env`, `pm2 restart dhcb --update-env`.
2. Đổi mật khẩu SSH/khoá SSH của VPS; kiểm tra `~/.ssh/authorized_keys` có khoá lạ không.
3. Kiểm tra `crontab -l` (cả user thường và `sudo -u postgres crontab -l`) — xoá dòng lạ không
   phải do mình thêm.
4. **KHÔNG vội xoá bằng chứng** (log, file lạ) trước khi chụp lại/copy ra chỗ khác — cần cho điều
   tra nguyên nhân sau này.
5. Nếu nghi database bị đọc trộm dữ liệu người dùng (email, mật khẩu hash...) → cân nhắc **thông
   báo cho người dùng** theo tinh thần minh bạch, dù dự án nhỏ — mật khẩu đã hash nên rủi ro thấp
   hơn, nhưng vẫn nên khuyến khích đổi mật khẩu nếu xác nhận có rò rỉ thật.
6. Sau khi chặn xong, restore lại từ **backup Postgres trước thời điểm nghi bị xâm nhập** (mục 3.5)
   nếu nghi dữ liệu đã bị chỉnh sửa.

### 3.9 VPS bị dựng lại hoàn toàn từ đầu (mất toàn bộ hệ điều hành/cấu hình)

**Khi nào dùng:** VPS cũ mất hẳn (hỏng phần cứng, cấp lại từ nhà cung cấp, hoặc chủ động dựng máy
mới) — chỉ còn **backup Postgres trên R2**, không còn gì khác từ máy cũ (không Nginx config, không
SSL cert, không PM2 process, có thể **cả IP cũng đổi**). Đây là kịch bản nặng nhất, gộp gần như mọi
mục ở Phần 3 lại với nhau. Thứ tự dưới đây đã được xác minh THẬT (sự cố 2026-07-29, xem mục 7).

**⚠️ Trước khi bắt đầu:** cập nhật IP mới ở Phần 0 của file này (nếu đổi) — mọi lệnh `ssh` trong
tài liệu khác (`docs/deploy-vps-ubuntu.md`) vẫn ghi IP cũ tới khi có người sửa lại.

1. **Cài lại môi trường theo `docs/deploy-vps-ubuntu.md` Bước 1–4** (firewall, Node 22, Nginx, PM2,
   Redis, clone code, `.env`, `npm install && npm run build`). File `.env` phải chép lại từ nơi lưu
   trữ an toàn riêng (KHÔNG nằm trong git) — nếu cũng mất luôn `.env`, phải tự tạo lại từng key
   (xem danh sách trong `docs/deploy-vps-ubuntu.md` Bước 4 + `.env.example`).

2. **Khôi phục database từ R2** (backup Postgres tự host không nằm trên chính VPS mà đẩy lên
   Cloudflare R2 — xem `scripts/backup-pg-to-r2.ts` + `scripts/restore-pg-from-r2.ts`):

   ```bash
   cd /var/www/dhcb
   npm run restore:r2 -- --list                       # xem các bản backup có sẵn
   RESTORE_PSQL_URL='postgresql://postgres:MẬT-KHẨU-SUPERUSER@localhost:5432/postgres' \
     npm run restore:r2 -- --restore-into dhcb --yes
   ```

   - Nếu **không nhớ/không chắc mật khẩu superuser `postgres`** trên máy mới (rất có thể — máy mới
     không kế thừa gì từ máy cũ): đặt lại trực tiếp bằng quyền hệ thống (không cần biết mật khẩu cũ):
     ```bash
     sudo -u postgres psql -c "ALTER ROLE postgres WITH PASSWORD 'mật-khẩu-mới-tự-đặt';"
     ```
   - **`--list` không hề gọi tới Postgres** (chỉ liệt kê object trên R2) — đừng lấy việc `--list`
     chạy được làm bằng chứng rằng mật khẩu Postgres đúng.
   - **Restore hỏng giữa chừng, không cần tải lại bản dump:** thêm `--from-file` để dùng đúng file
     đã tải về (kết hợp `--download`), bỏ qua R2 hoàn toàn — dump vài GB mà tải lại từ đầu trong
     lúc dịch vụ đang sập là mất thời gian vô ích:
     ```bash
     npm run restore:r2 -- --download                 # tải 1 lần, giữ lại file
     RESTORE_PSQL_URL='...' npm run restore:r2 -- \
       --restore-into dhcb --from-file ./dhcb-2026-08-08.sql.gz --yes
     ```
     File truyền qua `--from-file` **không bị script tự xoá** (khác file tạm tự tải, sẽ xoá sau khi
     restore xong).
   - **[2026-08-08] Nhánh `--restore-into` ĐÃ ĐƯỢC KIỂM CHỨNG THẬT** (trước đó chỉ mới thử nhánh an
     toàn `--download`): dựng cụm Postgres 16 nháp, nạp `postgres/schema.sql` + toàn bộ migration
     (47 bảng `public` + `english`) + 1 user thật, `pg_dump | gzip` đúng định dạng cron, rồi chạy
     `--restore-into` vào một database đã có sẵn dữ liệu rác. Kết quả: bảng rác bị xoá sạch, danh
     sách 47 bảng giống hệt nguồn, hàng dữ liệu về đủ. Ba hàng rào an toàn đều chặn đúng khi thiếu
     `--yes` / thiếu `RESTORE_PSQL_URL` / `--from-file` trỏ file không tồn tại.
   - Sau khi restore xong, role ứng dụng (`tutor_app`) dùng trong `DATABASE_URL` **thường vẫn còn
     tồn tại nhưng KHÔNG có mật khẩu nào được set lại** (backup/restore ở tầng dữ liệu không phục
     hồi được mật khẩu role vì Postgres lưu hash mật khẩu role trong catalog hệ thống riêng, không
     nằm trong dump theo database) — luôn cần chạy:
     ```bash
     sudo -u postgres psql -c "\du"   # xem role tutor_app có tồn tại chưa
     sudo -u postgres psql -c "ALTER ROLE tutor_app WITH PASSWORD 'khớp-đúng-DATABASE_URL-trong-.env';"
     ```
     rồi xác minh bằng chính connection string app dùng:
     ```bash
     psql "$DATABASE_URL" -c "select count(*) from public.users;"
     ```

3. **Khởi động PM2 đúng port đã định** — máy mới có thể vô tình chạy app ở port mặc định khác
   (vd. `3000` thay vì `3001` theo quy ước VPS này), gây đụng port với app khác chạy chung máy.
   Sửa `PORT` trong **cả `.env` lẫn `ecosystem.config.cjs`** (PM2 tự set biến môi trường của
   riêng nó _trước khi_ app đọc `.env` — sửa một mình `.env` rồi `pm2 restart --update-env`
   **không đủ**, phải xoá và start lại đúng bằng file ecosystem):

   ```bash
   pm2 delete dhcb
   pm2 start ecosystem.config.cjs
   pm2 save
   curl -I http://localhost:3001   # đổi đúng port thật của app này
   ```

4. **Cấu hình Nginx** — copy `nginx/en-vi.conf` từ repo, nhưng **nếu file có dùng Cloudflare
   real-IP** (dòng `include /etc/nginx/cloudflare-realip.conf;`), file được include đó **không có
   trong git** (tự sinh) — phải chạy script sinh nó TRƯỚC khi `nginx -t`, nếu không sẽ báo lỗi
   "No such file or directory":

   ```bash
   sudo cp nginx/en-vi.conf /etc/nginx/sites-available/en-vi
   sudo ln -sf /etc/nginx/sites-available/en-vi /etc/nginx/sites-enabled/en-vi
   sudo bash scripts/update-cloudflare-ips.sh   # BẮT BUỘC trước bước dưới nếu dùng Cloudflare
   sudo nginx -t
   ```

   `nginx -t` ở bước này **vẫn sẽ lỗi tiếp** vì thiếu chứng chỉ SSL (bước 5) — bình thường, đừng
   cố `reload` khi đang thiếu cert, cứ để Nginx tạm chạy config cũ (nếu có) hoặc tạm dừng.

5. **Cấp lại SSL Let's Encrypt** — máy mới không kế thừa `/etc/letsencrypt` từ máy cũ, phải cấp cert
   mới hoàn toàn (không phải "gia hạn"):
   - **Việc BẠN phải tự làm trước** (ngoài khả năng AI — cần quyền tài khoản DNS): nếu IP VPS đổi,
     cập nhật bản ghi **A** của subdomain sang IP mới ở nơi quản lý DNS (Cloudflare hoặc nhà cung
     cấp domain). Chờ DNS lan truyền, xác minh bằng `dig +short <domain>` — nếu domain đi qua
     Cloudflare (proxy bật), `dig` sẽ trả IP của Cloudflare (bình thường), không phản ánh trực tiếp
     origin IP đã đổi đúng chưa; xác nhận qua Cloudflare Dashboard.
   - File cấu hình Nginx có sẵn **đã tự trỏ tới đường dẫn cert** (`ssl_certificate ...`) trước cả
     khi cert tồn tại → `sudo certbot --nginx -d <domain>` **sẽ lỗi ngay từ bước `nginx -t` nội bộ
     của nó** (plugin `--nginx` cần config hợp lệ trước khi chạy). Dùng `--standalone` để lấy cert
     lần đầu (không đụng Nginx đang lỗi):
     ```bash
     sudo systemctl stop nginx
     sudo certbot certonly --standalone -d en-vi.donghanhcungban.com
     sudo systemctl start nginx   # sẽ VẪN lỗi nếu thiếu 2 file dưới đây
     ```
   - `certonly --standalone` chỉ tạo `fullchain.pem`/`privkey.pem`, **không tạo**
     `options-ssl-nginx.conf` và `ssl-dhparams.pem` mà file Nginx cũng tham chiếu tới (2 file này
     bình thường do plugin `--nginx` tự sinh) — tạo tay:
     ```bash
     sudo tee /etc/letsencrypt/options-ssl-nginx.conf > /dev/null <<'EOF'
     ssl_session_cache shared:le_nginx_SSL:10m;
     ssl_session_timeout 1440m;
     ssl_session_tickets off;
     ssl_protocols TLSv1.2 TLSv1.3;
     ssl_prefer_server_ciphers off;
     ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
     EOF
     sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048   # mất ~30-60s
     sudo nginx -t && sudo systemctl start nginx   # giờ phải pass
     ```
   - **Chuyển sang plugin `--nginx` ngay sau đó** — cert lấy bằng `--standalone` sẽ **renew thất
     bại** về sau vì tự mở port 80 riêng, xung đột với Nginx đang chiếm port đó. Chạy lại (giờ
     `nginx -t` đã pass nên chạy được), chọn "Renew & replace" khi được hỏi:
     ```bash
     sudo certbot --nginx -d en-vi.donghanhcungban.com
     grep -n "listen 443" /etc/nginx/sites-available/en-vi   # xác nhận còn "http2" (certbot hay xoá mất)
     sudo certbot renew --dry-run   # PHẢI pass — đây là bằng chứng renew tự động sẽ hoạt động
     ```

6. **`pm2 startup` + `pm2 save`** — máy mới chưa có gì tự khởi động lại app sau reboot:

   ```bash
   pm2 save
   pm2 startup   # chạy đúng lệnh sudo nó in ra
   ```

7. **Seed lại cache** (không khẩn cấp, có thể chạy nền) — audio TTS/pronunciation nếu
   `STORAGE_DRIVER=local` không nằm trong backup Postgres, phần lớn sẽ tự tạo lại khi người dùng
   gọi, nhưng có thể chủ động chạy trước:
   ```bash
   npm run seed:all
   ```

**Checklist riêng cho kịch bản này** (ngoài checklist chung ở Phần 4):

- [ ] `PORT` trong `.env` VÀ `ecosystem.config.cjs` khớp nhau, khớp với `proxy_pass` trong Nginx
- [ ] Role Postgres ứng dụng (`tutor_app`) đã set lại mật khẩu, KHÔNG chỉ database đã restore
- [ ] `/etc/nginx/cloudflare-realip.conf` đã sinh (nếu dùng Cloudflare) — không chỉ copy file `.conf` chính
- [ ] `sudo certbot renew --dry-run` **pass** (không chỉ có cert — phải renew được về sau)
- [ ] DNS (Cloudflare hoặc nhà cung cấp) đã trỏ đúng IP VPS mới
- [ ] `pm2 startup` đã chạy trên máy mới (không kế thừa từ máy cũ)

### 3.10 Auto-deploy GitHub Actions lỗi sau khi đổi IP VPS / dựng lại VPS

**Khi nào dùng:** VPS vẫn sống (SSH tay vào được, app chạy bình thường), nhưng workflow
**"Deploy to VPS"** trên GitHub Actions (`.github/workflows/deploy.yml`) tự động fail mỗi
lần push/merge lên `main`. Nếu VPS bị dựng lại HOÀN TOÀN (mất Nginx/SSL/PM2/`.env`) thì
đây KHÔNG phải kịch bản đúng — dừng lại, sang mục 3.9 làm từ đầu thay vì làm tiếp ở đây.
Đã xác minh THẬT (sự cố 2026-07-30, đổi IP nhưng quên cập nhật secret).

Làm đúng theo thứ tự dưới đây — **mỗi bước chỉ chạy khi bước xác minh ngay trước nó còn
báo lỗi**; hễ xác minh pass thì dừng, không cần chạy tiếp các bước sau.

1. Vào GitHub repo → tab **Actions** → chọn lần chạy đỏ gần nhất của "Deploy to VPS" →
   job `deploy` → bước "Deploy to VPS via SSH" → đọc dòng lỗi cuối cùng.

2. Nếu dòng lỗi là `dial tcp ***:22: i/o timeout` → secret `VPS_HOST` đang trỏ IP cũ:
   - Vào **Settings → Secrets and variables → Actions** → sửa secret `VPS_HOST` = IP hiện
     tại của VPS (vd `103.81.87.174`).
   - Nếu user SSH cũng đổi, sửa luôn secret `VPS_USER`.
   - Quay lại bước 6 (rerun) để xác minh.

3. Nếu dòng lỗi là `ssh.ParsePrivateKey: ssh: no key found` hoặc
   `unable to authenticate, attempted methods [none]` → secret `VPS_SSH_KEY` trống, sai
   định dạng, hoặc bị dán nhầm public key:
   - SSH vào VPS bằng khoá cá nhân của bạn (hoặc console nhà cung cấp VPS), tạo khoá
     **riêng cho CI** (không dùng chung khoá cá nhân):
     ```bash
     ssh-keygen -t ed25519 -f ~/.ssh/github_deploy_key -N "" -C "github-actions-deploy"
     cat ~/.ssh/github_deploy_key.pub >> ~/.ssh/authorized_keys
     chmod 600 ~/.ssh/authorized_keys
     cat ~/.ssh/github_deploy_key
     ```
   - Lệnh cuối in ra private key — copy **toàn bộ**, giữ nguyên cả 2 dòng
     `-----BEGIN OPENSSH PRIVATE KEY-----` và `-----END OPENSSH PRIVATE KEY-----` (thiếu 1
     trong 2 dòng này là nguyên nhân trực tiếp gây lỗi `ssh: no key found`), không cắt bớt,
     không thêm khoảng trắng.
   - Dán vào secret `VPS_SSH_KEY` trên GitHub (cùng chỗ ở bước 2).
   - Quay lại bước 6 (rerun) để xác minh.

4. Nếu dòng lỗi là `permission denied for schema public` (mã `42501`) khi chạy
   `migrate:pg` → database thiếu quyền GRANT trên schema `public` (Postgres 15+ không tự
   cấp quyền CREATE cho owner database nữa — xem `docs/setup-postgresql-vps.md` mục 3):
   - Trên VPS, chạy:
     ```bash
     sudo -u postgres psql -d dhcb -c "GRANT ALL ON SCHEMA public TO tutor_app;"
     ```
   - Quay lại bước 6 (rerun) để xác minh.

5. Nếu dòng lỗi khác 3 trường hợp trên — dừng lại, đây không phải lỗi đã biết trong mục
   này, cần chẩn đoán riêng (không đoán mò áp fix ở trên).

6. Rerun: trên GitHub → tab **Actions** → chọn lần chạy đỏ → **Re-run failed jobs**. Đợi
   job `deploy` chạy xong.

7. Xác minh: job `deploy` phải hiện tick xanh (`success`) — nếu vẫn đỏ, quay lại bước 1
   đọc log mới (log lúc này có thể khác lỗi trước, vì mỗi bước 2-4 chỉ sửa đúng 1 nguyên
   nhân). Nếu tick xanh, chạy `curl https://en-vi.donghanhcungban.com/api/health` để xác
   nhận app thật đã nhận code mới — thấy `{"status":"ok",...}` là xong, không cần làm gì
   thêm.

---

## 4. Sau khi khôi phục xong — checklist xác minh

Không coi là "xong" cho tới khi đủ:

- [ ] `curl https://en-vi.donghanhcungban.com/api/health` → `{"status":"ok",...}`
- [ ] Đăng nhập được bằng tài khoản thật trên trình duyệt
- [ ] Thử ít nhất 1 luồng chính mỗi loại còn hoạt động (chat AI, tra từ điển, ghi âm luyện nói)
- [ ] `pm2 status` báo `online`, không còn restart loop (`↺` không tăng thêm sau vài phút)
- [ ] `df -h /` còn đủ dung lượng trống (không sát 100%)
- [ ] Nếu vừa restore DB: kiểm tra vài bản ghi gần nhất còn đúng không (không chỉ chạy được, mà
      dữ liệu đúng)
- [ ] Nếu vừa đổi secret (mục 3.8): xác nhận `.env` VPS đã cập nhật VÀ đã `pm2 restart
--update-env` (PM2 không tự đọc lại `.env` khi chỉ sửa file)

---

## 5. Sau sự cố — báo cáo ngắn (post-mortem)

**Nơi lưu CỐ ĐỊNH (chốt 2026-10-12, changelog `0622`): mỗi sự cố SEV1/SEV2 một file
`docs/ops/postmortem/YYYY-MM-DD-<slug>.md`**, theo khuôn trong `docs/ops/postmortem/README.md`
(dòng thời gian UTC + giờ Việt Nam, 5 Whys, hàng rào mới). `PROGRESS.md` mục "Sự cố hạ tầng đã xử
lý" chỉ giữ MỘT dòng trỏ tới file đó; hành động còn mở thì vào "Nợ kỹ thuật còn mở" như mọi nợ khác.

Trước đây post-mortem nằm rải ở ba nơi (Phần 7 dưới đây · `PROGRESS.md` · `docs/legacy/`) nên
không ai tìm lại được sự cố cũ bằng một lệnh `ls`. Bản ghi cũ để nguyên chỗ, không dời.

Bản tối thiểu khi đang vội (SEV3, hoặc nháp ngay sau khi khôi phục — điền đủ khuôn sau):

```
Sự cố: [mô tả ngắn] · Mức: SEV1/2/3
Thời gian: [bắt đầu] → [khôi phục xong], tổng downtime: [X phút]
Nguyên nhân gốc: [vì sao xảy ra — không chỉ triệu chứng]
Đã làm gì để khôi phục: [tóm tắt các bước đã chạy thật]
Có mất dữ liệu không: [có/không, nếu có thì phạm vi]
Hàng rào mới: [test/cảnh báo/cổng CI/mục TRAPS.md nào để cùng nguyên nhân không lặp lại]
```

---

## 6. Cải tiến nên cân nhắc (chưa làm — không tự ý làm, cần người dùng quyết định trước)

Ghi lại để không quên, KHÔNG tự triển khai nếu chưa được xác nhận (theo CLAUDE.md — thay đổi lớn
phải hỏi trước):

1. **Uptime monitoring tự động** (vd. UptimeRobot/Better Uptime miễn phí) gọi `/api/health` mỗi
   vài phút + báo qua email/Telegram khi sập — hiện tại **chưa có gì tự động phát hiện sự cố**,
   phải có người chủ động kiểm tra hoặc chờ người dùng báo app lỗi.
2. **Sentry** đã code xong (client + server, no-op tới khi có DSN) nhưng **chưa điền
   `SENTRY_DSN`/`VITE_SENTRY_DSN`** trên VPS — xem `PROGRESS.md` mục nợ kỹ thuật. Bật sẽ giúp
   phát hiện lỗi runtime (không chỉ sập hẳn) sớm hơn.
3. **Backup Postgres mới chạy 1 lần/ngày** (RPO ~24h) — nếu dữ liệu người dùng tăng giá trị, có
   thể cân nhắc tăng tần suất (vd. mỗi 6h) hoặc bật WAL archiving để giảm mất dữ liệu tối đa.
4. **1 VPS duy nhất, không có standby/failover** — nếu VPS hỏng phần cứng vĩnh viễn, khôi phục
   nghĩa là dựng VPS mới hoàn toàn từ đầu (theo `docs/deploy-vps-ubuntu.md`) + restore backup
   Postgres mới nhất — chấp nhận được ở quy mô hiện tại, nhưng cần biết rõ đây là đánh đổi đã chọn
   (chi phí thấp, đổi lại downtime dài hơn nếu hỏng phần cứng).
5. **Người biết quy trình khôi phục hiện chỉ có 1 người** — nên điền đủ bảng ở Phần 0 (đặc biệt
   cách đăng nhập control panel nhà cung cấp VPS) để người khác có thể xử lý nếu cần.

---

## 7. Lịch sử sự cố thật

### 2026-07-29 — VPS dựng lại hoàn toàn từ đầu (IP đổi `160.30.172.203` → `103.81.87.174`)

```
Sự cố: VPS cũ mất hoàn toàn (dựng lại từ đầu — "mới khôi phục lại mới hoàn toàn"), IP đổi sang
       103.81.87.174. Chỉ còn backup Postgres trên Cloudflare R2, không còn Nginx/SSL/PM2/.env
       nào từ máy cũ.
Thời gian: ~21:24 (Nginx cài lại) → ~22:51 +07 (renew --dry-run pass, xác nhận xong hạ tầng),
           seed cache tiếp tục chạy nền sau đó. Tổng thời gian downtime thực tế của domain
           chưa rõ chính xác (bắt đầu xử lý từ lúc phát hiện lỗi restore DB).
Nguyên nhân gốc: VPS bị dựng lại hoàn toàn (ngoài phạm vi code/app — hạ tầng vật lý/nhà cung cấp),
       không phải lỗi do code hay deploy.
```

**Các bước đã xử lý thật, theo đúng thứ tự (đã gộp vào kịch bản 3.9 ở trên để dùng lại sau này):**

1. Phát hiện qua lệnh `npm run restore:r2 -- --restore-into dhcb --yes` báo
   `password authentication failed for user "postgres"` — mật khẩu superuser đoán không đúng.
2. **Cảnh giác nhầm ban đầu:** dòng log `◇ injected env (27) from .env // tip: ⌁ auth for agents
[www.vestauth.com]` trông giống prompt injection nhắm AI agent. Đã điều tra kỹ (đọc thẳng source
   `node_modules/dotenv/lib/main.js`) — xác nhận đây là tính năng "tip ngẫu nhiên" **CÓ THẬT** của
   chính gói `dotenv@17.4.2` (mảng `TIPS` quảng cáo sản phẩm khác của nhà phát triển dotenv), KHÔNG
   phải mã độc/supply-chain compromise. Ghi chú lại để **lần sau đừng hoảng vì dòng "tip" này** —
   không phải dấu hiệu xâm nhập, nhưng dòng "⌁ auth for agents [www.vestauth.com]" vẫn là nội dung
   quảng cáo lạ/không rõ nguồn gốc từ bên thứ ba trong gói dotenv, không phải do dự án này thêm vào.
3. Đặt lại mật khẩu role `postgres` bằng quyền hệ thống (`sudo -u postgres psql -c "ALTER ROLE
postgres WITH PASSWORD '...'"`), restore DB thành công (4 dòng `users` — xác nhận đúng dữ liệu).
4. Phát hiện PM2 không chạy process nào (mất toàn bộ do máy mới) → `pm2 resurrect` từ
   `/root/.pm2/dump.pm2` cũ còn sót — chỉ khôi phục được process, KHÔNG khôi phục đúng port.
5. Phát hiện app chạy nhầm port `3000` (đúng ra `3001` theo `docs/deploy-vps-ubuntu.md` — port 3000
   dành cho app `xboss` khác chạy chung VPS) → `pm2 restart --update-env` KHÔNG đủ để đổi port
   (PM2 tự set env trước khi app đọc `.env`) → phải `pm2 delete` + `pm2 start ecosystem.config.cjs`
   sau khi sửa `.env` mới ăn.
6. Nginx báo lỗi thiếu `/etc/nginx/cloudflare-realip.conf` — chạy `scripts/update-cloudflare-ips.sh`
   để sinh file (bước bắt buộc trước `nginx -t`, dễ quên khi dựng máy mới).
7. Nginx tiếp tục báo thiếu `/etc/letsencrypt/options-ssl-nginx.conf` — máy mới chưa từng cài
   certbot. Cài `certbot` + `python3-certbot-nginx`.
8. `certbot --nginx` thất bại vì `nginx -t` đã lỗi từ trước (plugin cần config hợp lệ trước khi
   chạy) → dùng `certbot certonly --standalone` (dừng Nginx tạm) để lấy cert lần đầu.
9. Nginx vẫn không start được sau khi có cert — thiếu tiếp `options-ssl-nginx.conf` (nội dung
   khuyến nghị TLS chuẩn của certbot) và `ssl-dhparams.pem` (2 file này bình thường do plugin
   `--nginx` tự tạo, `certonly --standalone` không tạo) → tạo tay cả hai.
10. Domain xác nhận sống lại (HTTP/2 200, qua Cloudflare) — nhưng IP VPS đã đổi sang
    `103.81.87.174`, phải cập nhật DNS Cloudflare trỏ IP mới (người dùng tự làm, ngoài khả năng AI).
11. Chạy `certbot renew --dry-run` → THẤT BẠI vì cert lấy bằng `--standalone` xung đột port 80 với
    Nginx đang chạy thật → chạy lại `sudo certbot --nginx -d ...` (giờ `nginx -t` đã pass) để
    chuyển sang cơ chế renew qua Nginx, `--dry-run` sau đó pass.
12. `pm2 save` + `pm2 startup` — máy mới chưa từng cấu hình tự khởi động PM2 cùng hệ thống.
13. Chạy `npm run seed:all` → lỗi `password authentication failed for user "tutor_app"` — restore
    database chỉ khôi phục DỮ LIỆU, KHÔNG khôi phục được mật khẩu role ứng dụng (Postgres lưu hash
    mật khẩu role ở catalog hệ thống riêng, `pg_dump`/`psql` theo từng database không mang theo).
    `\du` xác nhận role `tutor_app` **có tồn tại** (dump có tham chiếu owner) nhưng mật khẩu không
    khớp `.env` → `ALTER ROLE tutor_app WITH PASSWORD '...'` khớp đúng giá trị trong `DATABASE_URL`.

**Có mất dữ liệu không:** Không mất dữ liệu Postgres (users, lịch sử học...) — backup R2 gần nhất
(29/07) đủ mới. Audio cache (`uploads/`, `STORAGE_DRIVER=local`) mất hoàn toàn theo VPS cũ — không
nằm trong backup Postgres, đã chạy `npm run seed:all` để tạo lại (tốn thêm quota Google TTS, không
mất tiền lớn vì cache theo nội dung tĩnh, không phụ thuộc user).

**Cách ngăn tái diễn / cải tiến rút ra:**

1. ✅ Đã thêm kịch bản đầy đủ **3.9** vào file này — lần sau dựng VPS mới có checklist sẵn, không
   phải dò từng lỗi Nginx/certbot một như lần này (mất khá nhiều lượt qua lại).
2. ⚠️ **Chưa có nơi lưu trữ tách biệt cho mật khẩu role Postgres app (`tutor_app`)** — hiện chỉ nằm
   trong `.env` trên chính VPS, nên khi VPS mất, không có cách nào biết lại mật khẩu cũ (may là lần
   này đặt lại được vì có quyền superuser hệ thống). Nên cân nhắc lưu `.env` (hoặc riêng các secret
   quan trọng) ở một nơi thứ 2 an toàn (password manager/secret vault) — hiện chưa làm, cần người
   dùng xác nhận trước khi triển khai (theo CLAUDE.md, không tự ý làm thay đổi lớn).
3. ⚠️ Cấu hình Nginx mẫu (`nginx/en-vi.conf`) tham chiếu sẵn đường dẫn SSL cert **trước khi** cert
   tồn tại — hợp lý khi deploy lần đầu có certbot hướng dẫn riêng, nhưng gây vòng lặp "con gà quả
   trứng" khi phải dựng lại từ đầu trong tình huống khẩn. Đã ghi rõ cách né (dùng `--standalone`
   trước, `--nginx` sau) vào 3.9 — không sửa file mẫu vì cách làm hiện tại vẫn đúng cho trường hợp
   deploy VPS mới bình thường theo đúng thứ tự trong `docs/deploy-vps-ubuntu.md`.
4. ✅ IP VPS đã đổi — đã cập nhật toàn bộ các file tài liệu tham chiếu IP cũ `160.30.172.203`
   (`docs/deploy-vps-ubuntu.md`, `docs/cloudflare-setup.md`, `docs/setup-postgresql-vps.md`,
   `docs/DEPLOY.md`, `docs/runbook-dung-vps-moi-tu-dau.md`, `docs/huong-dan-tu-host-scale-50k.md`,
   `CLAUDE.md`, `DEPLOY_QUICK_GUIDE.md`, `DEPLOY_STEPS.md`) sang IP mới `103.81.87.174`. IP cũ chỉ
   còn xuất hiện trong chính mục lịch sử sự cố này (có chủ đích, để lưu vết).

### 2026-07-30 — Auto-deploy GitHub Actions lỗi liên tục sau sự cố đổi IP hôm 29/07

```
Sự cố: docs đã cập nhật IP mới 103.81.87.174 từ sự cố hôm trước, nhưng secret GitHub Actions
       VPS_HOST chưa từng được cập nhật theo — mọi lần push/merge lên main từ 29/07 đến nay
       (workflow run #312 → #316, 5 lần liên tiếp) đều tự động fail ở bước "Deploy to VPS via
       SSH", không ai để ý vì không có cảnh báo chủ động.
Thời gian: phát hiện + xử lý xong trong ~1 giờ (từ lúc soát log tới lúc workflow tick xanh).
Nguyên nhân gốc: 3 lỗi ĐỘC LẬP xếp chồng, phải xử lý tuần tự mới thấy hết:
  1. VPS_HOST (secret GitHub) vẫn trỏ IP cũ → dial tcp timeout.
  2. Sau khi sửa VPS_HOST: VPS_SSH_KEY trống/sai định dạng (chưa từng set đúng, hoặc lỡ dán
     public key thay vì private key) → "ssh: no key found".
  3. Sau khi tạo khoá CI riêng + sửa VPS_SSH_KEY: SSH đã vào được, nhưng migrate:pg báo
     "permission denied for schema public" — database tạo bằng `create database ... owner
     tutor_app` (theo đúng docs/setup-postgresql-vps.md lúc đó) KHÔNG tự cấp quyền CREATE
     trên schema `public` cho tutor_app (hành vi mặc định đổi từ Postgres 15) — lỗi này CÓ SẴN
     từ lúc dựng VPS 29/07, chỉ lộ ra bây giờ vì trước đó deploy còn chưa qua nổi bước SSH.
```

**Các bước đã xử lý thật (đã gộp vào kịch bản 3.10 ở trên để dùng lại sau này):**

1. Đọc log job `deploy` trên tab Actions → thấy `dial tcp ***:22: i/o timeout` → sửa secret
   `VPS_HOST` sang IP hiện tại.
2. Rerun → lỗi đổi sang `ssh.ParsePrivateKey: ssh: no key found` (auth fail gần như ngay lập
   tức, không còn timeout) → xác nhận `VPS_SSH_KEY` hỏng, không phải do IP.
3. Tạo cặp khoá SSH **riêng cho CI** trên VPS (`ssh-keygen ... -f ~/.ssh/github_deploy_key`),
   thêm public key vào `authorized_keys`, dán **toàn bộ** private key (đủ dòng
   `BEGIN`/`END`) vào secret `VPS_SSH_KEY`.
4. Rerun → SSH qua được, `npm ci` chạy xong, nhưng dừng ở `migrate:pg` với lỗi
   `permission denied for schema public` (mã `42501`) → xác định là lỗi Postgres, không phải
   SSH/secret.
5. Chạy `sudo -u postgres psql -d dhcb -c "GRANT ALL ON SCHEMA public TO tutor_app;"`
   trên VPS.
6. Rerun lần cuối (attempt #6) → **thành công** (`conclusion: success`).

**Có mất dữ liệu không:** Không — đây thuần là lỗi cấu hình CI/quyền DB, không đụng tới dữ
liệu người dùng. Tác động thực tế: mọi thay đổi code merge vào `main` từ 29/07 đến khi xử lý
xong (bao gồm cả PR #386 sửa lỗi flashcard) **không được đưa lên server thật** cho tới lúc này.

**Cách ngăn tái diễn / cải tiến rút ra:**

1. ✅ Đã thêm kịch bản đầy đủ **3.10** vào file này — lần sau đổi IP/rotate SSH key có bảng
   tra lỗi + từng bước sẵn, không phải dò log từ đầu.
2. ✅ Đã bổ sung bước `grant all on schema public to tutor_app;` vào
   `docs/setup-postgresql-vps.md` mục 3 — VPS dựng mới lần sau sẽ không dính lại lỗi
   `permission denied for schema public`.
3. ⚠️ **Chưa có cảnh báo chủ động khi deploy fail** — 5 lần deploy liên tiếp fail âm thầm suốt
   ~1 ngày mà không ai biết cho tới khi có người chủ động vào xem tab Actions. Nên cân nhắc
   thêm bước báo lỗi (vd Slack/Telegram/email webhook khi `deploy.yml` fail) — chưa làm, cần
   người dùng xác nhận trước khi triển khai (theo CLAUDE.md, không tự ý làm thay đổi lớn).
4. ⚠️ Không có checklist "sau khi đổi IP VPS" nhắc cập nhật **cả 2 nơi**: docs (đã có thói quen
   cập nhật) VÀ GitHub Actions secrets (bị quên) — mục 3.10 checklist mới đã bù việc này, nhưng
   nên nhớ **mỗi lần đổi IP/khoá SSH, luôn kiểm tra cả secret lẫn docs cùng lúc**, không chỉ 1
   trong 2.
