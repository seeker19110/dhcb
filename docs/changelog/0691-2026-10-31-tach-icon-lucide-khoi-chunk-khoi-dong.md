# 0691 — 2026-10-31 — Tách icon lucide khỏi chunk khởi động: Initial JS −9,6 kB, tổng JS thật −4,5 % (PR #1473)

Yêu cầu trong phiên: "tối ưu hiệu năng dự án". Đo trước, chọn chỗ có số liệu, một thay đổi nhỏ.

## Đo hiện trạng (`main` 7e23118, `npm run build` + `npm run budget`)

- Initial JS 136,86 kB / 160 kB (85,5 %), Initial CSS 23,76 kB / 26 kB (91,4 %).
- CSS: 233 kB/264 kB thô là lớp `utilities` thật sự đang dùng (Tailwind chỉ quét `apps/dhcb` + `core-ui`);
  khối `@supports color-mix` đã đo ở `0580` (bỏ chỉ lời ~0,7 kB nén) → không làm.
- JS: Zod đã dùng `zod/mini`, Sentry/CodeMirror/qrcode/ts-fsrs đã tách. Chỗ còn lại: `vendor-ui` chứa
  **toàn bộ 190 icon lucide** app dùng (15,4 kB brotli), tải eager cho mọi khách — trong khi chỉ 34 icon nằm
  trên đường khởi động.

## Ba phương án, đo TỔNG JS trình duyệt thật tải (Playwright, `vite preview`, 390 px, 7 trang)

Tổng brotli của mọi file `/js/*.js` được tải ở `/`, `/login`, `/gioi-thieu`, `/nang-cap`, `/luyen-tap`,
`/cai-dat`, `/goc-hoc-tap`:

| Phương án                                                    | Initial JS (size-limit) | Tổng 7 trang  | Số file/trang |
| ------------------------------------------------------------ | ----------------------- | ------------- | ------------- |
| A — `main`: mọi icon trong `vendor-ui`                       | 136,86 kB               | 1112,2 kB     | 15–38         |
| B — icon khởi động ở `vendor-ui`, icon lười gom MỘT chunk    | 125,75 kB               | 1118,7 kB     | +1            |
| **D — chỉ lõi runtime ở `vendor-ui`, icon để rolldown chia** | **127,24 kB**           | **1062,6 kB** | +6…+21        |

**B bị loại dù số size-limit đẹp nhất:** trang nào cũng cần vài icon "lười" nên cả chunk 12 kB luôn bị tải —
byte chỉ dời từ bước khởi động sang bước nạp trang, tổng còn TĂNG 0,6 %. Làm B mất 2 file mới (plugin viết lại
import barrel + hàm dò đồ thị import) mà người dùng không nhận được gì.

B còn lộ hai bẫy đáng ghi (đã ghi vào comment `vite.config.ts`):

1. `manualChunks` của rolldown = MỘT nhóm có `includeDependenciesRecursively: true`; nhóm có tên sắp trước theo
   bảng chữ cái kéo dependency chưa có chủ về mình. Tên `vendor-icons`/`aaa-icons` cướp lõi runtime lucide →
   `vendor-ui` import tĩnh chunk "lười" → nó thành eager. `npm run size` (`check-startup-coverage`) bắt được
   ca này — đã thử và thấy đỏ.
2. Glob `dist/js/vendor-ui-*.js` của `.size-limit.json` khớp nhầm mọi chunk tên `vendor-ui-…`.

**Chọn D** — 3 dòng cấu hình, tree-shaking của rolldown tự đưa 34 icon khởi động vào chunk entry, icon còn lại
đi theo trang dùng nó. Đổi lại ~80 chunk icon 1–2 kB: chấp nhận vì `nginx/en-vi.conf` chạy `http2` (ghép kênh)
và Vite `modulepreload` dependency của chunk lười SONG SONG với chunk trang (không thêm vòng chờ).

## Đã làm

- `apps/dhcb/vite.config.ts` (`manualChunks`): file `lucide-react/dist/esm/icons/*` trả `undefined`; phần còn
  lại của lucide giữ ở `vendor-ui`. Comment ghi số đo + vì sao không gom icon lười.

## Bằng chứng

- `npm run build` ✅ · `npm run size` ✅ (Initial JS 127,24 kB; 9 file khởi động đều được đếm) ·
  `npm run size:chunks` ✅ · `npm run typecheck` ✅ · `npm run lint` ✅ (0 cảnh báo) · `npm run format:check` ✅
- `npm run test:coverage` ✅ 22.631 đạt (lượt chạy gồm thêm 13 test của phương án B, đã xoá cùng mã B) ·
  stmts 96,23 · branches 92,16 · funcs 97,01 · lines 96,95 (không đổi — chỉ đổi cấu hình build).
- Smoke bản build production (Chromium, 9 trang × 1440/390 px): 0 lỗi trang/module, số icon `svg.lucide`
  hiển thị ở từng trang khớp đúng bản trước.
- Tầng 8b (ảnh chụp): n/a — không đổi giao diện; số icon hiển thị từng trang đã đối chiếu như trên.
- E2E (`npm run test:e2e`) chạy trên dev server nên KHÔNG chạm thay đổi này (chỉ ảnh hưởng `vite build`); CI
  vẫn chạy đủ.

## Còn mở

- CSS vẫn là ngân sách mỏng nhất (91,4 %) — không có chỗ giảm rẻ (xem trên).
- Chưa đo Core Web Vitals trên production (nợ Tầng 8, container không tới được domain): con số ở đây là byte
  JS, không phải LCP/INP thật.
