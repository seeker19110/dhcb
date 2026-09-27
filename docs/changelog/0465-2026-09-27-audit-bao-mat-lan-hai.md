# 0465 — Audit bảo mật lần hai: vá 7 lỗ hổng còn sót sau đợt 0464 (2026-09-27)

- **Ngày:** 2026-09-27 · **PR:** [#1191](https://github.com/seeker19110/dhcb/pull/1191) · **Loại:** `fix(security)`
- **Nền:** `main` sau PR #1190 (đợt 0464 đã vá F01–F13). Lượt này rà lại toàn bộ để tìm lỗ hổng
  đợt trước **chưa** bắt được, rồi vá.

## Cách rà

- Tự động: `npm audit` (0 lỗ hổng cả prod lẫn dev), `gitleaks` quét toàn bộ 1.390 commit lịch
  sử. semgrep không tải được bộ luật (mạng sandbox chặn `semgrep.dev`) → thay bằng rà thủ công
  theo mẫu: SQL ghép chuỗi, sink HTML (`dangerouslySetInnerHTML`/`innerHTML`), `fetch` URL do
  người dùng đưa (SSRF), đọc file theo tham số, chuyển hướng mở, IDOR (truy vấn theo `id` thiếu
  điều kiện chủ sở hữu), WebSocket, rate limit, cấu hình nginx/deploy.
- **Không quét được trang đã deploy từ phiên này**: proxy mạng của container chặn
  `en-vi.donghanhcungban.org` (cả curl lẫn WebFetch). Phần "web đã deploy" được audit qua cấu
  hình thật sự chạy trên VPS có trong repo (`nginx/en-vi.conf`, `scripts/deploy.sh`,
  `.github/workflows/deploy.yml`, `ecosystem.config.cjs`) + bằng chứng đã ghi ở changelog cũ.
- Mọi phát hiện đều **tái hiện được bằng test đỏ trên mã cũ** trước khi vá (ghi dưới từng mục).

## Lỗ hổng đã vá

| #   | Mức        | Lỗ hổng                                                                                                                                                                                                                                                                                                                                                                                           | Vá                                                                                                                                                                                                                                                               |
| --- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | **Cao**    | `getClientIp()` tin `CF-Connecting-IP` TRƯỚC `X-Real-IP`. Module `real_ip` của nginx chỉ đổi `$remote_addr`, **không xoá** header client tự gửi → gọi thẳng IP VPS (bỏ qua Cloudflare, cổng 443 mở cho mọi IP) kèm `CF-Connecting-IP` ngẫu nhiên = mỗi request một bộ đếm mới: dò mật khẩu, dò mã 2FA, dùng AI của khách **không giới hạn**. Bài thử A/B 2026-08-26 đi qua CF nên không bắt được. | App đọc `X-Real-IP` trước (nginx luôn ghi đè = `$remote_addr` đã qua `real_ip`). nginx ghi đè cả `CF-Connecting-IP` + `X-Forwarded-For` ở mọi `location` proxy (khối `@express` trước đó thiếu cả `X-Real-IP`). Test canh `scripts/nginx-proxy-headers.test.ts`. |
| S2  | Trung bình | Rate limit/hạn mức khách đếm theo từng địa chỉ IPv6 /128. Một thuê bao có cả dải /64 (2^64 địa chỉ) → đổi địa chỉ là né.                                                                                                                                                                                                                                                                          | `rateLimitSubject()` gom IPv6 về /64, bóc IPv4-mapped; áp trong `checkRateLimit` + khoá IP của lượt thử khách. Bucket `persons` thôi nhét IP vào tên bucket.                                                                                                     |
| S3  | Trung bình | Đăng nhập mật khẩu và mã 2FA chỉ giới hạn theo IP → dò phân tán MỘT tài khoản không giới hạn. Thêm: email chưa đăng ký trả lời ngay, email có thật phải chạy bcrypt → **dò được email nào có tài khoản qua thời gian phản hồi**.                                                                                                                                                                  | Bộ đếm theo tài khoản: đăng nhập 10 lần/15 phút theo email (băm SHA-256, không lưu email rõ), 2FA 10 lần/15 phút theo userId; đúng thì xoá. Nhánh "không có user" chạy bcrypt với hash giả cùng độ khó.                                                          |
| S4  | Trung bình | **SSRF/lộ IP origin** qua Web Push: `endpoint` chấp nhận chuỗi bất kỳ, server POST tới đó mỗi giờ và MỖI tin nhắn chat gửi người offline → đăng ký endpoint trỏ về máy kẻ tấn công là biết IP thật của VPS sau Cloudflare (mở đường cho S1), hoặc gọi dịch vụ HTTPS nội bộ theo ý muốn. `/api/push` không có rate limit; `CRON_SECRET` so bằng `!==`; lỗi CSDL trả nguyên văn cho client.         | Danh sách cho phép host dịch vụ push thật (FCM, Mozilla, Apple, WNS), chỉ `https`, không cổng lạ/credential — kiểm khi ĐĂNG KÝ và khi GỬI (cả đường chat). Rate limit 30/phút, `timingSafeEqual` cho `CRON_SECRET`, lỗi 500 trả thông báo chung.                 |
| S5  | Trung bình | `POST /api/programming/ts-check` dùng compiler host THẬT của server: `/// <reference path="…">` làm server đọc file trên đĩa → dò file tồn tại (TS6053) và **mỗi file lớn nằm lại vĩnh viễn trong cache** (đo: +10 MB heap/file `.d.ts`) → worker bị PM2 giết (DoS).                                                                                                                              | `noResolve` + `types: []`; host chỉ đọc file lib chuẩn của gói typescript, cache chỉ còn tập hữu hạn đó. 328 test bài học TS vẫn xanh.                                                                                                                           |
| S6  | Trung bình | 4/5 WebSocket (chat, **vị trí GPS**, giọng nói, phòng học chung) không kiểm `Origin` → trang cùng site (vd `sales.donghanhcungban.org`) mở kết nối nhân danh người dùng. Chat/vị trí/giọng nói không đặt `maxPayload` (thư viện `ws` mặc định 100 MiB/khung); bộ đệm giọng nói lớn vô hạn 10 phút; chat/vị trí qua WS không có giới hạn tần suất (spam tin + thông báo đẩy).                      | Cổng `isAllowedWebSocketOrigin()` dùng chung danh sách CORS; `maxPayload` 32 KiB/16 KiB/256 KiB; trần bộ đệm giọng nói 2 MiB (bỏ phần cũ); giới hạn theo userId: chat 30 tin + 120 sự kiện/phút, vị trí 120 sự kiện/phút.                                        |
| S7  | Cao (tay)  | **Private key VAPID nằm trong lịch sử git PUBLIC** (commit `f6e0caa7`, 2026-06-21; gỡ khỏi script 2026-06-27 nhưng không xoay khoá). `.env.example` vẫn in đúng public key của cặp đó → gần như chắc production còn dùng.                                                                                                                                                                         | Code: bỏ khoá khỏi `.env.example`; server báo lỗi đỏ + Sentry lúc khởi động nếu vẫn dùng cặp đã lộ; client tự huỷ + đăng ký lại khi khoá server đổi (trước đây dùng lại subscription cũ → mất thông báo âm thầm). **Xoay khoá thật là việc tay** (PROGRESS).     |

## Kiểm chứng

- Mỗi vá có test đỏ trên mã cũ → xanh sau vá: `nginx-proxy-headers.test.ts` (4 ca đỏ trên conf
  cũ), `http.test.ts` (ca "gọi thẳng IP VPS"), `security.test.ts` (IPv6 /64, bộ đếm cửa sổ,
  Origin WS), `auth.test.ts` + `authService.test.ts` (khoá theo tài khoản, bcrypt hash giả),
  `two-factor.test.ts`, `push.test.ts` + `pushSubscription.test.ts` + `chatPush.test.ts` (SSRF),
  `tsPrelude.test.ts` (2 ca đỏ trên host cũ), `wsHandler/wsLocation/wsVoiceHandler/
wsCoLearningHandler/realtimeVoiceService.test.ts`, `pushNotif.test.ts` (xoay khoá VAPID).
- Bài thử S5 chạy thật trước/sau: trước `TS6053 File '…/does-not-exist.ts' not found` (máy dò)
  và heap +10,2 MB; sau: không lỗi nào lộ đường dẫn, heap không tăng.
- Cổng: xem Báo cáo xác thực trong mô tả PR (build · typecheck · lint · format · test:coverage).

## Không làm trong đợt này (ghi rõ để khỏi tưởng đã xong)

- Không gỡ `/ws/voice-companion` và `/ws/co-learning-room` dù **không client nào gọi** — gỡ là
  đổi hành vi, để chủ dự án quyết (đã siết bằng Origin + trần kích thước).
- Kênh vị trí: người đã **rời** chuyến nhưng giữ socket mở vẫn nhận vị trí của thành viên còn lại
  tới khi socket gửi sự kiện kế tiếp (fan-out không kiểm lại quyền). Cần cơ chế thu hồi socket
  khi rời chuyến — ghi nợ.
- CSP còn `'unsafe-inline' 'unsafe-eval'` (đã ghi ở runbook 0464, cần tách origin chạy code).
- `appleboy/ssh-action@v1.2.5` (cầm SSH key VPS) ghim theo tag, không theo SHA như mọi action
  khác — không tra được SHA từ phiên này (ngoài phạm vi repo được phép).
