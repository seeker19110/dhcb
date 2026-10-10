# 0584 — PageSpeed mobile tối đa: dựng sẵn HTML trang chủ khách + Agentic Browsing 100

- **Ngày:** 2026-10-10 · **PR:** (xem mô tả PR) · **Loại:** `perf(app)`
- **Yêu cầu:** người dùng gửi kết quả PageSpeed Insights mobile của `https://www.donghanhcungban.org/`,
  yêu cầu "nâng điểm lên tối đa", rồi thêm "điểm số Agentic Browsing nữa". Phương án dựng sẵn HTML
  (đợt 0582 ghi "cần chủ dự án quyết") được người dùng **chốt trong phiên** sau khi xem số đo thử.

## Đo trước khi sửa

Phiên này **không tới được production** (proxy chặn 403) và API PageSpeed hết hạn mức ngày (429),
nên đo bằng Lighthouse 13.5 (đúng cấu hình mobile của PageSpeed) trên bản build production phục vụ
bởi một máy chủ tĩnh mô phỏng nginx (gzip sẵn, cache immutable, SPA fallback; `/api/*` trả đúng
như production trả cho khách).

| Bản   | Hiệu năng | FCP   | LCP   | Best Practices | Agentic Browsing |
| ----- | --------- | ----- | ----- | -------------- | ---------------- |
| Trước | 86–92     | 2,8 s | 3,1 s | 100            | 50 (2/4)         |

## Chẩn đoán (đọc mã Lantern của Lighthouse, không đoán)

1. **Là app một trang:** chữ đầu tiên chỉ hiện sau khi tải + chạy ~165 KB JS khởi động.
2. **Chèn sẵn HTML là chưa đủ** (đã thử): Lantern tính MỌI file ưu tiên cao tải xong trước lần vẽ
   đầu vào FCP, và MỌI file (kể cả ưu tiên thấp) vào LCP — kể cả khi chữ đã hiện từ HTML.
3. **`createRoot` xoá HTML có sẵn rồi vẽ lại phần tử y hệt** → trình duyệt ghi một lần vẽ LCP mới
   (đo bằng PerformanceObserver: LCP bị đẩy từ 136 ms lên ~600 ms). Hydrate không dùng được vì
   lần render đầu của app là khung chờ phiên đăng nhập, không phải trang chủ.
4. Critical CSS (`beasties`) đã thử rồi BỎ: CLS 0 → 0,063 và FCP không đổi.
5. Agentic Browsing: `llms.txt` không có liên kết Markdown nào (và lỗi thời: đường dẫn cũ
   `/tro-truyen`…, còn nhắc Supabase); `/.well-known/ai-catalog.json` rơi xuống SPA fallback, trả
   `index.html` 200 → bị chấm là "catalog JSON hỏng".

## Đã làm

- **`apps/dhcb/src/lib/guestPrerender.ts` (mới)** — toàn bộ cơ chế, hàm thuần, có test:
  - `shouldShowGuestPrerender`: chỉ bật khi `/` + máy chưa có cờ phiên + giao diện tiếng Việt +
    màn **< 1024px** (header chọn nút bằng JS nên HTML tĩnh chỉ đúng một bề rộng; desktop đã ~99
    điểm, chạy như cũ). Nhúng NGUYÊN VĂN vào `<script>` đầu `<head>` qua `toString()` — test chạy
    chính chuỗi đó với biến toàn cục giả để chứng minh hàm tự đủ.
  - Bản dựng sẵn nằm trong `#guest-prerender` CẠNH `#root`; CSS ẩn `#root` khi cờ bật. React render
    vào `#root` đang ẩn; `releaseGuestPrerender()` gỡ bản dựng sẵn + hiện `#root` trong
    `useLayoutEffect` (cùng khung hình — không nháy, không xê dịch).
  - `loadBootScripts` + `deferBootScriptsWhilePrerendered` (chỉ bản build): thay thẻ script
    module + `modulepreload` tĩnh bằng một script inline. Không hiện bản dựng sẵn → nạp NGAY, cùng
    thứ tự như cũ. Đang hiện → chờ đúng sự kiện `first-contentful-paint` (PerformanceObserver;
    dự phòng rAF; hẹn giờ 2 s cho tab nền). Thử `requestAnimationFrame` trước và BỎ: khung hình đầu
    có thể chưa có chữ (còn chờ font), JS vẫn kịp tải trước lần vẽ chữ.
- **`apps/dhcb/src/prerender/GuestHomePrerender.tsx` + `guestHome.prerender.html`**: render tĩnh
  bằng CHÍNH các component (SkipLink · cột nội dung · GuestHomePage · BottomNav), giá trị khách cố
  định thay AuthProvider. `guestHomePrerender.test.tsx` so file với đầu ra render (định dạng bằng
  Prettier của repo → diff đọc được, qua `format:check`). Sửa component trong cây → `npm run
gen:prerender-home`.
- Plugin Vite `dhcb-guest-home-prerender` (`apps/dhcb/vite.config.ts`) chèn ở **cả dev lẫn
  build** (E2E chạy trên dev server nên đi qua đúng luồng mới); hoãn nạp JS chỉ ở build.
- Lưới an toàn để `#root` không bao giờ bị ẩn mãi: `GuestPrerenderGuard` trong `App.tsx` (cờ không
  bật / sang trang khác / hoá ra đã đăng nhập), `ErrorBoundary.componentDidCatch`.
- `components/appFrame.ts`: hằng lớp cột nội dung dùng chung App ↔ bản dựng sẵn.
  `useIsDesktopViewport.ts` xuất `DESKTOP_VIEWPORT_QUERY` (test `shots-fullpage-helper` đổi theo).
- **Agentic Browsing:** viết lại `apps/dhcb/public/llms.txt` theo llmstxt.org (H1, tóm tắt, danh
  sách liên kết tuyệt đối tới route THẬT); `apps/server/src/server.ts` trả **404** cho
  `/.well-known/*` không có file (đúng nghĩa: DHCB không công bố agent/MCP nào — tạo catalog
  ARD "cho có" là khai sai), nên mục ARD thành "không áp dụng".

## Đo sau khi sửa

Lighthouse 13.5 mobile, cùng máy chủ mô phỏng:

| Bản | Hiệu năng | FCP   | LCP   | TBT       | CLS | A11y | BP  | SEO | Agentic |
| --- | --------- | ----- | ----- | --------- | --- | ---- | --- | --- | ------- |
| Sau | 97–99     | 1,5 s | 1,5 s | 70–170 ms | 0   | 100  | 100 | 100 | 100     |

Trình duyệt thật, mạng 4G giả lập (RTT 150 ms, 1,6 Mbps, CPU ×4), mỗi lượt một trình duyệt mới,
tắt cache, chặn service worker, trung vị 5 lượt xen kẽ:

| Trang                      | FCP trước → sau | LCP trước → sau | React tiếp quản trước → sau |
| -------------------------- | --------------- | --------------- | --------------------------- |
| `/` (khách, mobile)        | 2,24 → 0,75 s   | 2,58 → 0,75 s   | 2,56 → 2,98 s               |
| `/goc-hoc-tap/english`     | 2,24 → 2,18 s   | 3,21 → 3,28 s   | 3,17 → 3,23 s               |
| `/goc-hoc-tap`             | 2,17 → 2,21 s   | 2,69 → 2,76 s   | 2,62 → 2,69 s               |
| `/goc-hoc-tap/programming` | 2,21 → 2,18 s   | 4,15 → 4,24 s   | 4,02 → 4,35 s               |

**Đánh đổi đã chấp nhận:** trên trang chủ khách, chữ hiện sớm ~1,8 s nhưng React tiếp quản muộn
~0,4 s (JS chờ tới sau lần vẽ chữ). Trong khoảng đó mọi lối đi chính (nút Bắt đầu, Đăng nhập, dải
môn, thanh điều hướng đáy) là thẻ `<a>` thật nên vẫn bấm được. Các trang khác chậm ~70 ms LCP (phần
HTML thêm ~4 KB nén) — nằm trong dải dao động đo.

Lưu ý đo: khi service worker đã kích hoạt, request đi qua SW **không bị giả lập 4G làm chậm** (giới
hạn của CDP) — lần đo đầu cho kết quả lệch vì thế; bảng trên đã chặn SW.

## Kiểm chứng

- Ảnh bản dựng sẵn (chặn JS) so với trang React vẽ, 390 px toàn trang: theme sáng **0 điểm ảnh
  khác**, theme tối 16 điểm ở mép dải môn học. Tầng 8b: ảnh `/` 1440 px + 390 px trước/sau giống
  nhau.
- Kịch bản: khách `/` (đổi chỗ sạch, 1 `<main>`, không trùng id, 0 lỗi console) · có cờ phiên ·
  giao diện EN · desktop 1440 — ba trường hợp sau không bật bản dựng sẵn.
- `npm run typecheck` · `npm run lint` · `npm run format:check` · `npm run check:docs` ·
  `npm run size` (Initial JS 134,73/160 kB; CSS 24,95/26 kB) · `npm run test:coverage` ·
  `npm run build`.
- E2E ở máy (dev server có chèn bản dựng sẵn): guest-home, smoke, home-clarity-evidence,
  home-quick-ask, new-user-journey, landmark-title, bottomnav, authenticated,
  header-back-touch-target, week-rhythm, a11y-interactive-states — 93/93; a11y + a11y-aaa — xem
  mô tả PR.

## Chưa làm / gợi ý tiếp

- **Đo lại bằng PageSpeed Insights sau khi deploy** — số trên là đo ở máy; production còn
  Cloudflare (beacon Web Analytics bị báo "legacy JS") và độ trễ thật.
- Khách quay lại (đã có tiến độ khách) thấy `GuestBanner` xuất hiện lúc React tiếp quản (bản dựng
  sẵn là lượt mở đầu tiên, không có banner) — không tính CLS, nhưng là một cú nhảy nhỏ nhìn thấy.
