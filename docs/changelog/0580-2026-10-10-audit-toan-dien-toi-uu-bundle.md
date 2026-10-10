# 0580 — Audit toàn diện + tối ưu bundle khởi động (zod ra khỏi đường khởi động)

- **Ngày:** 2026-10-10 · **PR:** (xem mô tả PR) · **Loại:** `perf(app)`
- **Báo cáo audit:** `docs/audit/2026-10-10-audit-toan-dien-va-toi-uu.md` (theo
  `docs/framework/QUY-TRINH-AUDIT.md`, 11 tầng + 3 lượt rà sâu bằng tác tử).

## Vấn đề

Người dùng yêu cầu "audit toàn diện rồi tối ưu mã nguồn". Audit cho thấy mọi cổng đều xanh,
nhưng **ngân sách bundle đã sát trần**: Initial JS 149,29/160 kB (93,3%), CSS 24,57/26 kB
(94,5%) — một tính năng nhỏ nữa là CI đỏ. Đọc source map của 4 chunk khởi động:
`vendor-misc` (24,4 kB brotli, tải ngay khi mở trang) **100% là zod bản đầy đủ**, kể cả bộ
chuyển JSON Schema mà client không dùng. Zod bản đầy đủ không tree-shake được.

Lần ngược import: zod lọt vào đường khởi động qua 4 điểm —

1. `packages/core-ui/clientAuth.ts` — kiểm phản hồi `/api/auth` (thật sự cần lúc khởi động).
2. `App.tsx` → `pruneExpiredSessions` (`learningSession.ts`) — dọn nháp, không gấp.
3. `AuthProvider` → `guestProgress.ts` → `learningSession`/`stemEvidence`/`learnerIntentStore`
   — chỉ cần phép kiểm "khách có tiến độ không" ở mỗi lần nạp phiên.
4. `GuestBanner` → `guestActivity.ts` → `learningSession`/`learnerIntentStore` — chỉ cần TÊN
   khoá và biết khách đã chọn môn chưa.

Ngoài ra rà frontend phát hiện `Placement.tsx` import GIÁ TRỊ từ `data/cefr` (file duy nhất làm
vậy — mọi chỗ khác dùng `loadCefr()`), kéo ~4,4 MB JSON từ vựng vào chunk trang xếp lớp
(2,95 MB thô / 850 kB gzip).

## Đã làm

- `clientAuth.ts` chuyển sang `zod/mini` (vẫn là Zod, cùng lõi kiểm tra, API dạng hàm nên chỉ
  kéo phần dùng). Đo riêng: mini ~7,6 kB brotli.
- `packages/core-contracts/appSettings.ts` và `apps/dhcb/src/lib/cloud.ts` (đều nằm trong chunk
  `modulepreload`) cũng chuyển sang `zod/mini` — xem mục "Bẫy đo" bên dưới. Server chỉ
  `safeParse` hợp đồng `appSettings` nên không phải sửa gì thêm.
- Test canh mới `apps/dhcb/src/lib/startupBundle.test.ts` (8 ca).
- Module nhẹ mới `apps/dhcb/src/lib/storageKeyPrefixes.ts` (tiền tố khoá localStorage) và
  `apps/dhcb/src/lib/guestProgressKeys.ts` (danh sách khoá của một uid + `hasGuestProgress`).
  Module gốc re-export lại — mọi chỗ import cũ không đổi.
- `AuthProvider`: `hasGuestProgress()` vẫn chạy ĐỒNG BỘ ở mỗi lần nạp phiên (không làm chậm
  người đã đăng nhập); chỉ khi thật sự có tiến độ khách mới `import()` phần hợp nhất.
- `App.tsx`: dọn nháp quá hạn qua `import()` động.
- `guestActivity.ts`: kiểm nhẹ `subjectIds` thay cho `readLocalIntent` (đủ cho quyết định hiện
  banner; chỗ dùng ý định thật vẫn đọc qua `readLocalIntent`). Thêm 2 test ca biên (JSON hỏng,
  chưa chọn môn, `null`, khoá của người khác).
- `vite.config.ts`: quy tắc `manualChunks` tách zod bản đầy đủ + JSON Schema + locale sang
  `vendor-zod` (chỉ trang lười dùng); lõi `zod/v4/core` + `zod/v4/mini` ở lại `vendor-misc`.
  Không có quy tắc này thì zod đầy đủ vẫn rơi vào `vendor-misc` (tải eager) dù không ai trên
  đường khởi động import nó.
- `Placement.tsx` dùng `loadCefr()`; lỗi tải đi chung nhánh `loadError` sẵn có. Đã kiểm
  `public/data/cefr.json` trùng khớp `CEFR_LEVELS` (`JSON.stringify` bằng nhau, 6 cấp). Test
  `ExamCallers.s08.test.tsx` mock `cefrLoader` trả đúng dữ liệu thật.
- `npm audit fix` (chỉ lockfile): `brace-expansion` 1.1.18 → 1.1.21, `source-map-js`
  1.2.1 → 1.2.2 (dependency dev gián tiếp, 2 lỗ hổng high → 0).

## Quyết định

- **Không** chuyển `core-contracts` sang `zod/mini`: `.optional()` được gọi 41 lần trên các
  schema dùng chung với server → ~40 file, rủi ro không xứng phần lợi còn lại.
- **Không** đổi `react-router` sang `dist/production`: lệch đúng 1 byte so với bản development.
- **Không** bỏ khối `@supports color-mix` của Tailwind 4 (30% CSS thô) — sau brotli chỉ được
  ~0,7 kB, phải viết hậu xử lý CSS riêng.
- Mọi phát hiện server/SQL/nghiệp vụ (Companion nuốt lỗi AI, pool Postgres không timeout,
  `learn-day` cho phép gian lận điểm giải đấu, `/api/history` không LIMIT, chỉ mục thiếu…)
  **chưa sửa** — chia đợt E1–E5 trong báo cáo audit, chờ chủ dự án duyệt vì nhiều mục chạm bảo
  mật/thanh toán/dữ liệu người dùng thật (CLAUDE.md mục 12).

## Bẫy đo đã mắc trong đợt (và cách đã chặn)

Lần build đầu sau khi tách `vendor-zod`, `size-limit` báo **149,29 → 134,24 kB** — nhưng mở bản
build bằng Chromium thì `vendor-zod` VẪN nằm trong `<link rel="modulepreload">` của
`index.html`: hai module nữa trên đường khởi động (`packages/core-contracts/appSettings.ts`,
`apps/dhcb/src/lib/cloud.ts`) vẫn import zod đầy đủ, trước đó bị che vì cả zod nằm chung
`vendor-misc`. `.size-limit.json` chỉ đo 4 glob nên không thấy chunk `vendor-zod` (lỗ hổng phép
đo — báo cáo audit mục E5). Đã chuyển hai module đó sang `zod/mini`, và thêm
`apps/dhcb/src/lib/startupBundle.test.ts` canh ở mức mã nguồn (đã thử đưa lại import tĩnh vào
`App.tsx` → test đỏ đúng chỗ). Con số dưới đây đo bằng cách cộng MỌI chunk mà `index.html` tải
ngay (entry + modulepreload), không chỉ tin `size-limit`.

## Bằng chứng kiểm chứng

| Cổng                                          | Trước (main @017e6d8)                  | Sau                                                                          |
| --------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------- |
| JS khởi động THẬT (entry + mọi modulepreload) | 154.313 B brotli (10 file)             | **138.448 B** (9 file) — **−15,9 kB**                                        |
| `size-limit` Initial JS                       | 149,29 / 160 kB (93,3%)                | 134,39 / 160 kB (84,0%)                                                      |
| `size-limit` Initial CSS                      | 24,57 / 26 kB (94,5%)                  | 24,57 / 26 kB (không đổi)                                                    |
| Chunk `Placement-*.js` (thô)                  | 2.953.340 B                            | **11.352 B**                                                                 |
| `npm audit` (cả dev)                          | 2 high                                 | 0                                                                            |
| Typecheck / Lint / Format / Build             | ✅                                     | ✅ (checkout sạch, đã xoá mọi `dist`)                                        |
| test:coverage                                 | 20474 test ✅, 95,98/91,88/96,72/96,64 | 20474 test ✅, 96,03/91,92/96,75/96,69                                       |
| Tầng 11 (DB rỗng, Postgres 16)                | —                                      | 93/93 migration, lũy đẳng ✅, `/api/health` 200                              |
| Smoke Chromium bản build (1440px + 390px)     | —                                      | trang chủ render, 0 lỗi JS (chỉ 404 `/api/auth` vì preview không có backend) |

**Mặt trái phải biết:** trang chủ (`Home`, chunk lười) vẫn dùng các hợp đồng zod đầy đủ
(`learnerIntent`, `completionEvidence`…) nên `vendor-zod` (10,6 kB) vẫn được tải song song với
chunk `Home` khi vào `/`. Tổng byte zod trên route `/` là 16,4 + 10,6 = 27,0 kB so với 24,4 kB
trước (+2,6 kB, phần `zod/v4/mini/schemas.js`) — đổi lại đợt tải đầu nhẹ hơn 15,9 kB và các
route không cần zod đầy đủ không tải nó nữa. Muốn bỏ hẳn cho `/` thì phải chuyển nhóm hợp đồng
trên đường của Home sang `zod/mini` (đổi `X.optional()` → `z.optional(X)` ở ~10 file
`core-contracts`) — ghi ở báo cáo audit mục E4.
