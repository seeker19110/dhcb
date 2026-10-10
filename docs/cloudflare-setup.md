# Đặt Cloudflare trước VPS (CDN + chống DDoS, miễn phí)

> Dành cho người mới. Đọc hết 1 lần trước khi làm. Việc này **đổi DNS domain** —
> có ảnh hưởng thật tới site đang chạy, nhưng **an toàn & dễ hoàn tác** (chỉ cần
> đổi lại nameserver hoặc tắt "Proxy" là quay về y như cũ, không mất dữ liệu).

## Vì sao làm việc này

- **Nhanh hơn cho người dùng ở xa VPS**: Cloudflare có server (edge) gần người dùng
  khắp nơi, cache file tĩnh (JS/CSS/ảnh) tại edge thay vì mọi request đều phải bay
  tới VPS ở Việt Nam.
- **Giảm tải VPS**: VPS hiện dùng chung tài nguyên với app "xboss" khác — traffic
  tĩnh (chiếm phần lớn) được Cloudflare phục vụ, VPS chỉ còn xử lý `/api/` + HTML.
- **Ẩn IP thật + chống DDoS cơ bản**: người dùng thấy IP Cloudflare, không thấy IP
  VPS thật; Cloudflare tự lọc bớt traffic rác trước khi tới VPS.
- **Miễn phí** (gói Free đủ dùng cho nhu cầu hiện tại).

## Việc BẠN phải tự làm (chỉ chủ tài khoản domain mới làm được)

AI không có quyền truy cập tài khoản Cloudflare/nơi mua domain của bạn — các bước
dưới đây bạn tự thao tác trên trình duyệt.

### Bước 1 — Thêm site vào Cloudflare

1. Vào https://dash.cloudflare.com → **Add a Site** → gõ domain gốc (vd
   `donghanhcungban.com`, không cần gõ subdomain `en-vi.`).
2. Chọn gói **Free** → **Continue**.
3. Cloudflare tự quét bản ghi DNS hiện có — kiểm tra thấy đủ bản ghi cho
   `en-vi.donghanhcungban.com` (và các subdomain khác bạn đang dùng, kể cả app
   "xboss" nếu chung domain) trước khi qua bước sau. Thiếu bản ghi nào thì thêm tay.

### Bước 2 — Bật Proxy (đám mây cam) cho bản ghi `en-vi` và domain chính

Trong danh sách DNS record, tìm các dòng `@`, `www`, `en-vi` (loại A, trỏ vào IP VPS
`103.118.29.58`) → bấm vào biểu tượng đám mây để chuyển từ **DNS only** (xám)
sang **Proxied** (🟠 cam).

### Bước 3 — Đổi Nameserver ở nơi mua domain

Cloudflare cho bạn 2 nameserver riêng (dạng `xxx.ns.cloudflare.com`). Vào trang
quản lý domain (Namecheap/GoDaddy/Mắt Bão/... — nơi bạn đã mua domain) → thay nameserver cũ bằng 2 cái Cloudflare vừa cấp.

⏳ Việc này có thể mất **vài phút đến 24 giờ** để lan truyền (DNS propagation).
Cloudflare sẽ gửi email báo khi site đã "Active".

### Bước 4 — SSL/TLS mode = "Full (strict)"

Vào **SSL/TLS → Overview** → chọn **Full (strict)**. Bắt buộc chọn đúng mode này
vì VPS **đã có chứng chỉ Let's Encrypt thật** (không phải self-signed) — "Full
(strict)" nghĩa là Cloudflare xác minh cert VPS hợp lệ trước khi tin, an toàn nhất.
KHÔNG chọn "Flexible" (sẽ làm mất mã hóa đoạn Cloudflare→VPS).

### Bước 5 — (Khuyên dùng) Always Use HTTPS + tắt cache cho /api/

- **SSL/TLS → Edge Certificates** → bật **Always Use HTTPS**.
- **Rules → Page Rules** (hoặc **Cache Rules** ở bản mới) → thêm rule:
  URL khớp `*donghanhcungban.org/api/*` → **Cache Level: Bypass** (API luôn
  cần dữ liệu mới + xác thực, không được cache).

### Bước 6 — Siết TLS ở biên Cloudflare (BẮT BUỘC từ 2026-10-10)

Máy quét bảo mật nhìn vào **biên Cloudflare** (DNS trỏ về Cloudflare), KHÔNG nhìn Nginx trên VPS.
Các mục "SSL/TLS - Protocols", "BEAST", "Lucky 13" là do biên còn nhận TLS 1.0/1.1 và bộ mã
CBC — cài đặt ở dashboard, code trong repo không sửa được:

- **SSL/TLS → Edge Certificates → Minimum TLS Version** → chọn **TLS 1.2** (bỏ TLS 1.0/1.1 ⇒ hết
  BEAST — lỗi chỉ có ở TLS 1.0).
- Cùng trang → **TLS 1.3** → **On**.
- Cùng trang → **Cipher suites** (nếu gói tài khoản cho chỉnh): chọn mức **Modern** (chỉ bộ mã
  AEAD — GCM/ChaCha20) ⇒ hết **Lucky 13** (tấn công nhắm vào bộ mã CBC). Nếu mục này bị khoá theo
  gói thì Lucky 13 còn ở mức cảnh báo thấp: trình duyệt hiện đại tự chọn GCM/ChaCha20 trước.
- **DROWN** chỉ là "hint": lỗi thật cần SSLv2, mà cả Cloudflare lẫn Nginx (Certbot
  `options-ssl-nginx.conf` chỉ bật TLSv1.2 + TLSv1.3) đều không có. Giữ nguyên miễn là KHÔNG máy
  nào khác dùng chung chứng chỉ/khoá này mà còn bật SSLv2.

Kiểm lại sau khi đổi (từ máy bất kỳ có `openssl`, KHÔNG qua proxy):

```bash
# Phải THẤT BẠI (handshake failure / no protocols):
openssl s_client -connect en-vi.donghanhcungban.org:443 -servername en-vi.donghanhcungban.org -tls1_1 </dev/null
# Phải THÀNH CÔNG:
openssl s_client -connect en-vi.donghanhcungban.org:443 -servername en-vi.donghanhcungban.org -tls1_2 </dev/null
```

Nginx trên VPS (đoạn Cloudflare → VPS): kiểm `grep -E 'ssl_protocols|ssl_ciphers'
/etc/letsencrypt/options-ssl-nginx.conf` — phải chỉ có `TLSv1.2 TLSv1.3` và bộ mã ECDHE-…-GCM /
CHACHA20.

### Bước 7 — Tên miền con chạy code `run.donghanhcungban.org` (từ 2026-10-10)

Code học viên (JavaScript/Python/SQL/xem trước HTML) sẽ chạy ở origin riêng `run.` để không đọc
được phiên đăng nhập của app — đặc tả `docs/specs/2026-10-10-tach-runtime-chay-code-ten-mien-con.md`.
Việc tay, làm MỘT lần, TRƯỚC khi bật biến `VITE_CODE_RUNNER_ORIGIN` (đợt R2):

1. **DNS → Add record**: loại **A**, tên **`run`**, trỏ cùng IP VPS như `en-vi`, **Proxy: bật
   (đám mây cam)**.
2. Trên VPS, mở rộng chứng chỉ cho tên mới rồi nạp lại Nginx (`nginx/en-vi.conf` đã có block 4
   cho host này):

   ```bash
   sudo certbot --nginx -d run.donghanhcungban.org --expand
   sudo cp nginx/en-vi.conf /etc/nginx/sites-available/en-vi
   sudo nginx -t && sudo systemctl reload nginx
   ```

3. Kiểm: `curl -sI https://run.donghanhcungban.org/runner.html` → `200` có
   `content-security-policy: … frame-ancestors https://…` và KHÔNG có `x-frame-options`;
   `curl -sI https://run.donghanhcungban.org/api/health` → `404`;
   `curl -sI https://en-vi.donghanhcungban.org/runner.html` → `404`.

## Việc AI/bạn làm trên VPS (sau khi Bước 1–4 xong)

Repo đã có sẵn `scripts/update-cloudflare-ips.sh` (sinh danh sách IP Cloudflare
mới nhất) + `nginx/en-vi.conf` đã thêm dòng `include` — chỉ cần deploy lên VPS:

```bash
# SSH vào VPS
ssh root@103.118.29.58
cd /var/www/dhcb

# Kéo code mới nhất (đã có script + nginx config cập nhật)
git pull

# 1. Sinh file danh sách IP Cloudflare (BẮT BUỘC trước khi reload nginx)
sudo bash scripts/update-cloudflare-ips.sh

# 2. Copy nginx config mới (nếu đã sửa nginx/en-vi.conf)
sudo cp nginx/en-vi.conf /etc/nginx/sites-available/en-vi

# 3. Kiểm tra cú pháp rồi mới reload (an toàn — không làm sập site đang chạy nếu lỗi)
sudo nginx -t && sudo systemctl reload nginx
```

> Đặt cron chạy lại `update-cloudflare-ips.sh` mỗi tháng — xem hướng dẫn trong
> chính file script (Cloudflare hiếm khi đổi dải IP nhưng có thể xảy ra).

## Cách kiểm tra đã chạy đúng

1. **DNS đã qua Cloudflare**: `curl -I https://en-vi.donghanhcungban.com` — thấy
   header `cf-ray` nghĩa là request đã đi qua Cloudflare.
2. **App vẫn chạy bình thường**: mở site, thử đăng nhập, chat, nghe TTS — luồng
   chính không đổi gì cả (Cloudflare chỉ là lớp trung gian, không đổi code app).
3. **Rate-limit KHÔNG né được bằng header giả** — quan trọng nhất, và phải kiểm bằng
   BÀI THỬ chứ không chỉ đọc log. Cách cũ (đọc `pm2 logs` xem IP có đúng không) chỉ cho biết
   IP hiển thị đẹp, KHÔNG cho biết kẻ tấn công có ghi đè được nó không.

   ```bash
   # A. 40 request, mỗi lần một IP giả khác nhau. /api/app-settings giới hạn 30/phút.
   for i in $(seq 1 40); do
     curl -s -o /dev/null -w "%{http_code} " \
       -H "X-Forwarded-For: 10.0.$((RANDOM%255)).$((RANDOM%255))" \
       https://en-vi.donghanhcungban.org/api/app-settings
   done; echo

   # B. Đối chứng: 40 request, CÙNG một IP giả cố định.
   for i in $(seq 1 40); do
     curl -s -o /dev/null -w "%{http_code} " \
       -H "X-Forwarded-For: 203.0.113.99" \
       https://en-vi.donghanhcungban.org/api/app-settings
   done; echo
   ```

   **Đọc kết quả:** cả A và B đều phải xuất hiện `429` sau khoảng 30 request. Nếu A toàn `200`
   mà B có `429` ⇒ rate limit **bị né bằng header giả** — đúng lỗ hổng đo được ngày 2026-08-26
   (40/40 lần `200`, không một `429`). Nếu cả hai đều toàn `200` ⇒ rate limit không chạy chút
   nào, vấn đề còn lớn hơn.

   Hai bài trên đi QUA Cloudflare — CF tự ghi đè `CF-Connecting-IP` nên chúng KHÔNG thử được
   đường nguy hiểm nhất: **gọi thẳng vào IP VPS**, bỏ qua CF. Bài C (chạy từ máy bất kỳ, thay
   `<IP_VPS>`):

   ```bash
   # C. 40 request thẳng vào origin, mỗi lần một CF-Connecting-IP giả khác nhau.
   for i in $(seq 1 40); do
     curl -sk -o /dev/null -w "%{http_code} " --resolve en-vi.donghanhcungban.org:443:<IP_VPS> \
       -H "CF-Connecting-IP: 10.0.$((RANDOM%255)).$((RANDOM%255))" \
       https://en-vi.donghanhcungban.org/api/app-settings
   done; echo
   ```

   Phải thấy `429` sau khoảng 30 request (hoặc toàn lỗi kết nối nếu firewall đã chỉ cho CF vào —
   càng tốt). Toàn `200` ⇒ rate limit bị né.

   **Lớp bảo vệ — đính chính 2026-09-27 (changelog 0465):** bản trước của tài liệu này nói
   `cloudflare-realip.conf` "chỉ nhận header đó từ đúng dải IP Cloudflare". **Sai.** Module
   `real_ip` chỉ đổi biến `$remote_addr`, KHÔNG xoá header client tự gửi — nginx vẫn chuyển
   nguyên `CF-Connecting-IP` giả tới Express, và app khi đó đọc header này TRƯỚC, nên bài C từng
   né được hoàn toàn. Nay có ba lớp: (1) `getClientIp()` đọc `X-Real-IP` trước — nginx luôn ghi
   đè = `$remote_addr` đã qua `real_ip`; (2) `nginx/en-vi.conf` ghi đè cả `CF-Connecting-IP` lẫn
   `X-Forwarded-For` bằng `$remote_addr` ở mọi `location` proxy (test canh
   `scripts/nginx-proxy-headers.test.ts`); (3) firewall chỉ cho dải IP Cloudflare vào 80/443
   (mục cuối).

## Cách hoàn tác (nếu có sự cố)

- **Tắt nhanh nhất**: vào Cloudflare DNS → bấm đám mây 🟠 → xám lại **DNS only**.
  Traffic đi thẳng VPS như trước, không cần đổi gì ở VPS.
- **Hoàn tác hẳn**: đổi nameserver ở nơi mua domain về nameserver cũ (nhà cung cấp
  ban đầu thường lưu sẵn nameserver gốc, hoặc đăng ký lại domain "sử dụng DNS mặc
  định" của nhà cung cấp).
- Trên VPS: comment dòng `include /etc/nginx/cloudflare-realip.conf;` trong
  `nginx/en-vi.conf` nếu không dùng Cloudflare nữa, rồi `nginx -t && reload`.

## (Tùy chọn, nâng cao) Chặn truy cập thẳng vào IP VPS

**Khuyến nghị làm (nâng từ "tùy chọn" ngày 2026-09-27):** giới hạn firewall VPS chỉ nhận
traffic từ dải IP Cloudflare trên cổng 80/443. `cloudflare-realip.conf` KHÔNG tự chống giả mạo
IP (xem đính chính ở mục kiểm chứng trên), và trước bản vá 0465 IP thật của VPS có thể đã lộ qua
lỗ SSRF Web Push — nên kẻ gọi thẳng vào origin là khả năng thật, không phải giả định.
**Rủi ro:** nếu sau này tắt Cloudflare Proxy mà quên gỡ rule
firewall, site sẽ không truy cập được — luôn giữ port 22 (SSH) mở để không tự
khóa mình ngoài VPS.
