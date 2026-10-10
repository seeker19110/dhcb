# 0582 — PageSpeed trang chủ: khách không còn tải JS của người đã đăng nhập, việc nền chờ trang vẽ xong

- **Ngày:** 2026-10-10 · **PR:** (xem mô tả PR) · **Loại:** `perf(app)`
- **Yêu cầu:** người dùng gửi kết quả PageSpeed Insights của `https://www.donghanhcungban.org/`
  (mobile) và yêu cầu cải thiện cả mobile lẫn desktop.

## Đo trước khi sửa (production, Lighthouse 12, cùng cấu hình PageSpeed)

API PageSpeed Insights hết hạn mức ngày (429) nên chạy Lighthouse CLI trực tiếp lên production:

| Thiết bị | Hiệu năng | FCP   | LCP   | SI    | TBT    | CLS |
| -------- | --------- | ----- | ----- | ----- | ------ | --- |
| Mobile   | 70        | 3,4 s | 5,1 s | 5,4 s | 110 ms | 0   |
| Desktop  | 96        | 0,9 s | 1,1 s | 1,2 s | 0 ms   | 0   |

A11y/SEO 100; Best Practices 96 (mobile — lỗi 429 của chính lượt đo) / 100. Desktop báo thêm
`label-content-name-mismatch` (nút hồ sơ hiện "Khách" nhưng tên truy cập là "Trang cá nhân").

**LCP mobile: 71% là "render delay"** — chữ đã sẵn, chỉ chờ JS. Lần ngược thác nước mạng:

1. **Khách tải trọn trang chủ của người đã đăng nhập.** `Home.tsx` rẽ nhánh khách ở BÊN TRONG
   component, nên chunk Home kéo theo "Hôm nay", CEFR, SRS, `lessonsLoader`, `stemLessonRoutes`…
   — **512 KiB JS thô ngoài bundle khởi động** chỉ để vẽ Companion + 1 nút + dải môn.
2. **Việc nền chen băng thông với chunk trang:** Sentry (~150 KB) tải ngay ở `main.tsx`;
   `usePrefetchPages` gọi `requestIdleCallback` lúc khởi động — luồng chính "rảnh" trong lúc chờ
   mạng nên nó bắn ra ngay, tải ~100 chunk của 7 trang CÙNG LÚC với chunk Home; `App.tsx` tải zod
   để dọn nháp phiên học cũng ngay lúc đó.
3. **Font: mọi trang tiếng Việt tải thừa `inter-latin-ext` 85 KB.** `wght.css` của fontsource khai
   `latin-ext` SAU `vietnamese`; trình duyệt xét @font-face khai sau cùng trước (CSS Fonts 4), mà dải
   U+0100–02BA của `latin-ext` trùm cả ă/đ/ĩ/ũ/ơ/ư → chữ Việt kéo cả hai file.
4. `subjectRegistry.ts` `SubjectManifestSchema.parse` 6 hằng số viết tay lúc chạy → kéo zod
   (~37 KiB thô) vào cả trang chủ khách.

## Đã làm

- **Tách trang chủ khách:** `apps/dhcb/src/pages/core/GuestHomePage.tsx` (mới). `App.tsx` thêm
  `HomeRoute` chọn GuestHomePage/Home TRƯỚC khi nạp chunk; `Home.tsx` dùng lại GuestHomePage ở
  nhánh khách (lưới an toàn, test cũ giữ nguyên). JS thêm cho khách: **512 → 22 KiB thô**.
- `main.tsx`: khách mở thẳng `/` (máy chưa có phiên) thì tải chunk GuestHomePage SONG SONG với
  lượt hỏi phiên `/api/auth` thay vì nối tiếp.
- **`apps/dhcb/src/lib/pageSettled.ts` (mới) — `runWhenPageSettled`:** chờ `load`, thêm 4 s, rồi
  lúc rảnh. Chỉ chờ `load` là KHÔNG đủ — đo thật trên production `load` bắn ở 2,5 s còn LCP ở 4,0 s
  (chunk route lười không giữ `load`). Đã thử kích hoạt sớm theo tương tác đầu tiên rồi BỎ: cú chạm
  đầu thường là chuyển trang, khi đó chunk trang đích phải tranh băng thông với ~100 chunk tải
  trước. Dùng cho: tải trước 7 trang (`usePrefetchPages`, bỏ qua hẳn khi máy bật Save-Data), dọn
  nháp phiên học, và tải Sentry.
- **`errorTracking.ts`:** Sentry tải khi trang ổn định; lỗi `error`/`unhandledrejection` xảy ra
  trước đó xếp hàng (tối đa 10) rồi gửi bù; `captureException` tự kích tải SDK khi cần gửi ngay.
- **`apps/dhcb/src/fonts.css` (mới)** thay `@fontsource-variable/inter/wght.css`: cùng 7 subset,
  cùng unicode-range, chỉ đổi thứ tự (`vietnamese` sau `latin-ext`). Glyph không đổi. Bớt luôn
  một file CSS chặn render (`vendor-misc-*.css`).
- `subjectRegistry.ts`: bỏ parse lúc chạy (kiểu `SubjectManifest[]` chặn field lạ lúc biên dịch);
  hằng `SUBJECT_MANIFEST_SCHEMA_VERSION` tách sang `core-contracts/subjectManifestVersion.ts`
  không import zod (re-export ở `subjectManifest.ts` — nơi gọi cũ không đổi).
- `Layout.tsx`: tên truy cập nút hồ sơ = `"<tên> — Trang cá nhân"`, vòng chữ cái đầu
  `aria-hidden` (WCAG 2.5.3 Label in Name).
- E2E `home-quick-ask.spec.ts` + `home-clarity-evidence.spec.ts`: hai ca "bấm chip không gọi
  mạng" nay chỉ đếm request `/api/` — trước đây đếm MỌI request, và việc tải trước theo hẹn giờ có
  thể rơi đúng vào khoảng đo (đã đỏ thật ở máy với bản kích hoạt theo tương tác). Ý canh của ca
  test (chip không gọi AI/server) giữ nguyên.
- Test mới: `pageSettled.test.ts` (5 ca), `errorTracking.test.ts` (3 ca), `fonts.test.ts` (3 ca —
  thứ tự + khớp unicode-range với gói, đỏ khi nâng gói mà gói đổi dải), `subjectRegistry.test.ts`
  thêm ca parse từng manifest bằng schema (giữ bảo đảm cũ của `.parse` lúc chạy).

## Đo sau khi sửa (cùng máy, build trước/sau phục vụ giống nhau, trung vị 3 lần mobile)

| Bản   | Mobile | FCP   | LCP   | SI    | Desktop | LCP desktop | Tổng tải |
| ----- | ------ | ----- | ----- | ----- | ------- | ----------- | -------- |
| Trước | 66     | 3,9 s | 7,3 s | 3,9 s | 84      | 2,4 s       | 426 KiB  |
| Sau   | 89     | 2,8 s | 3,1 s | 2,8 s | 99      | 0,7 s       | 277 KiB  |

(Số tuyệt đối cục bộ khác production vì máy chủ tĩnh tối giản, `/api/*` trả 401; cả hai bản đo
cùng điều kiện, có DSN Sentry giả để Sentry được tải như production.) Font trên `/`: trước tải
latin + vietnamese + latin-ext, sau chỉ latin + vietnamese (đo bằng `performance` API).

## Kiểm chứng

- `npm run typecheck` (cả sau khi xoá `packages/*/dist dist-server`) · `npm run lint` ·
  `npm run test:coverage` 893 file / 20.521 test, 96,02/91,92/96,74/96,68 · `npm run build` ·
  `npm run size` (Initial JS 134,53/160 kB; CSS 24,95/26 kB — +0,38 kB vì @font-face dời từ
  `vendor-misc.css` vào `index.css`, đổi lại bớt một request CSS chặn render).
- E2E ở máy: `a11y` + `a11y-aaa` + authenticated, bottomnav, guest-home, home-clarity-evidence,
  home-quick-ask, new-user-journey, smoke, week-rhythm, landmark-title, header-back-touch-target
  — 458/459 lượt đầu (đỏ: home-quick-ask, đã sửa như trên), chạy lại 4 spec trang chủ 30/30 xanh.
- Tầng 8b: ảnh `/` 1440 px + 390 px trước/sau — giống hệt nhau (dấu tiếng Việt đúng font).

## Chưa làm / gợi ý tiếp

- **FCP mobile còn ~2,7 s** vì là SPA: chữ đầu tiên chỉ có sau khi tải + chạy ~135 kB JS khởi
  động. Muốn xuống dưới ~1,8 s phải dựng sẵn HTML trang chủ khách (prerender/SSG) — thay đổi kiến
  trúc, cần chủ dự án quyết.
- `static.cloudflareinsights.com/beacon.min.js` (Cloudflare Web Analytics tự chèn) bị Lighthouse
  báo "legacy JS" + cache ngắn — tắt/bật trong bảng điều khiển Cloudflare, không nằm trong repo.
- Trong lượt đo production, `/api/app-settings` và `/api/auth` trả **429** (lượt đo lặp từ IP
  dùng chung của môi trường đo). Repo (Express + `nginx/*.conf`) không có chỗ nào trả 429 cho hai
  endpoint này → nhiều khả năng là luật rate limit/WAF của Cloudflare. Nên xem lại luật đó nếu
  người dùng thật sau NAT chung của nhà mạng cũng bị chặn.
- Đo lại bằng PageSpeed Insights sau khi deploy.
