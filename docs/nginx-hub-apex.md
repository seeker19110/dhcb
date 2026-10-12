# Nginx cho apex domain + hub — ĐÃ TRIỂN KHAI THẬT (2026-07-31)

> Trạng thái: **ĐÃ LÊN PRODUCTION.** `donghanhcungban.com`, `www.donghanhcungban.com`,
> `donghanhcungban.org`, `www.donghanhcungban.org` đều phục vụ `apps/hub` thật (xem PR-7,
> `docs/research/dac-ta-gd1-tach-loi-monorepo-2026-07-31.md` §7). `en-vi.donghanhcungban.com`
> vẫn là app tiếng Anh, không đổi gì. Domain `.org` đã có SSL sẵn (chuẩn bị cho
> `docs/doi-ten-mien-chinh-org.md`) nhưng CHƯA phải mặc định — cả `.com` và `.org` hiện đều
> phục vụ hub, `EN_VI_HOSTNAME` vẫn chỉ khớp đúng `en-vi.donghanhcungban.com`.

## ⚠️ Bẫy thật đã gặp lúc triển khai — đọc trước khi làm VPS khác/mới

**Certbot KHÔNG tạo file cấu hình riêng cho domain chưa có vhost — nó tự chèn thẳng vào
`/etc/nginx/sites-available/default`** (file mặc định của Debian/Ubuntu, đang bật sẵn trong
`sites-enabled`). Cụ thể khi chạy `certbot --expand -d ... -d donghanhcungban.com ...` với các
domain apex/`.org`/`www` chưa khớp vhost nào, Certbot:

1. Chèn `server_name <các domain mới> # managed by Certbot` + toàn bộ `listen 443 ssl` +
   `ssl_certificate ...` vào **NGAY TRONG block `server { listen 80 default_server; ... }` gốc**
   của file `default` — biến nó thành 2 server block tách biệt cho port 80/443 nhưng **giữ
   nguyên `location / { try_files $uri $uri/ =404; }` cũ** (không tự sinh `location /` mới).
2. Thêm một `server {}` MỚI (cuối file `default`) chỉ để redirect HTTP→HTTPS
   (`if ($host = ...) return 301 ...`) cho các domain đó.

**Hệ quả:** file `default` (vốn có sẵn 1 `location / { try_files ...; }` boilerplate ở block
`server_name _;` gốc) giờ có **2 block `location /` giống hệt nhau về text** — một ở block
`server_name _;` (chỉ port 80, vô hại), một ở block Certbot vừa chèn (block THẬT SỰ phục vụ
HTTPS domain mới). Nếu sửa bằng `nano` + tìm text `"First attempt to serve request as file"`,
`Ctrl+W` sẽ nhảy tới bản sao ĐẦU TIÊN (sai bản, không ảnh hưởng gì) chứ không phải bản đang thật
sự phục vụ HTTPS — sửa nhầm chỗ này khiến domain vẫn ra "Welcome to nginx!" dù `nginx -t` xanh
và domain gọi thẳng vào Express (`curl -H "Host: ..." http://localhost:3001/`) lại đúng, dễ
nhầm tưởng lỗi ở tầng khác (Cloudflare cache, DNS...). **Cách chẩn đoán đúng: `cat -n
/etc/nginx/sites-available/default` xem TOÀN BỘ file, xác định chính xác `location /` nào nằm
trong block có `server_name <domain thật>` + `listen 443 ssl`, không dựa vào tìm kiếm text.**

## Các bước ĐÃ làm thật (theo đúng thứ tự, để tham khảo khi dựng VPS khác)

1. **DNS**: A record cho `donghanhcungban.com`, `www.donghanhcungban.com`,
   `donghanhcungban.org`, `www.donghanhcungban.org` → IP VPS (`103.118.29.58`, xem
   `docs/deploy-vps-ubuntu.md`). Ban đầu thiếu bản ghi `www.` cho cả 2 domain khiến bước 2 fail
   NXDOMAIN — phải thêm DNS rồi mới chạy certbot được.
2. **SSL mở rộng** (một cert phủ tất cả domain, không tạo cert riêng):
   ```bash
   sudo certbot --expand \
     -d en-vi.donghanhcungban.com -d donghanhcungban.com -d www.donghanhcungban.com \
     -d en-vi.donghanhcungban.org -d donghanhcungban.org -d www.donghanhcungban.org
   ```
3. **Build hub trên VPS**: `npm run build` (đã gồm `npm run build --workspace=hub` từ PR-7) →
   xác nhận `apps/hub/dist/` tồn tại (`index.html`, `assets/`, `favicon.svg`).
4. **Sửa `location /` trong file `default`** (KHÔNG tạo file riêng — xem phần "bẫy" ở trên,
   Certbot đã tự chèn server block vào `default` rồi, tạo thêm file riêng chỉ gây
   "conflicting server name" warning): tìm đúng `location /` nằm trong block có
   `server_name donghanhcungban.org www.donghanhcungban.com en-vi.donghanhcungban.org
donghanhcungban.com www.donghanhcungban.org; # managed by Certbot`, thay bằng:
   ```nginx
   location /api/ {
       proxy_pass http://localhost:3001;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }

   location / {
       proxy_pass http://localhost:3001;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```
   `proxy_set_header Host $host` là chỗ mấu chốt — `server.ts` (`distDirForHost`) dựa vào đúng
   header `Host` này để quyết định phục vụ `dist/` (tiếng Anh) hay `apps/hub/dist/` (hub).
5. `sudo nginx -t && sudo systemctl reload nginx`.
6. **Xác nhận bằng `curl`, KHÔNG chỉ tin domain thật ngay** (Cloudflare có cache, dễ nhầm lẫn
   nguồn lỗi) — luôn kiểm theo 3 lớp riêng biệt:
   ```bash
   # Lớp 1: Express có phục vụ đúng app theo Host không (bỏ qua hẳn Nginx)
   curl -s -H "Host: donghanhcungban.com" http://localhost:3001/ | grep -o "<title>[^<]*</title>"
   # Lớp 2: Nginx + SSL ở origin có route đúng không (bỏ qua Cloudflare, gọi thẳng IP VPS)
   curl -s -k --resolve donghanhcungban.com:443:103.118.29.58 https://donghanhcungban.com/ \
     | grep -o "<title>[^<]*</title>"
   # Lớp 3: qua Cloudflare thật (domain thật, không bypass)
   curl -s -o /dev/null -w "%{http_code}\n" https://donghanhcungban.com/
   ```
   Nếu lớp 1 đúng nhưng lớp 2 sai → lỗi nằm ở Nginx (khả năng cao là bẫy "2 block location /" ở
   trên), không phải Cloudflare.

## Việc CHƯA làm (out of scope PR-7, để dành khi cần)

- Cookie phiên đăng nhập dùng chung (`domain=.donghanhcungban.com`) — SSO thật giữa hub và
  subdomain từng môn. Hiện tại hub chỉ điều hướng sang `en-vi.donghanhcungban.com/login`, người
  dùng đăng nhập lại ở đó bình thường.
- Bảng `onboarding_profiles(user_id, subject, ...)` hỏi trình độ/mục tiêu riêng theo từng môn khi
  bấm "Học ngay" lần đầu (§7.2 đặc tả) — chỉ cần khi có môn thứ hai thật sự tồn tại.
- `math.donghanhcungban.com` — dựng khi môn Toán bắt đầu code thật (GĐ2).
- Dọn lại cấu trúc Nginx cho gọn (tách vhost apex/`.org` ra khỏi `default` thành file riêng có
  tên rõ ràng) — hiện đang chạy đúng nhưng gộp chung với file mặc định của hệ điều hành, hơi rối
  khi đọc lại sau này. Không gấp vì đang hoạt động ổn định, cân nhắc dọn khi có dịp bảo trì.
