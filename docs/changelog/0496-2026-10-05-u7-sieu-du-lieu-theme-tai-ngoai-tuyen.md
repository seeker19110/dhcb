# 0496 — Đợt U7 audit UI/UX: siêu dữ liệu, theme mặc định, tải ngoại tuyến có điều kiện (2026-10-05)

- **Ngày:** 2026-10-05 (xong 2026-10-06) · **PR:** #1255 · **Loại:** `fix(ui)`.
- **Phạm vi:** đợt U7 trong `docs/audit/2026-09-30-audit-ui-ux-chuan-2026.md` mục 12: **M12 + M13
  - M14**. Quyết định chủ dự án 2026-10-05 cho M14: chỉ tải ngầm khi đã đăng nhập + đã học ≥ 1
    phiên, bỏ qua khi Save-Data, có công tắc "Tải để học ngoại tuyến" ở Cài đặt mặc định BẬT.

## Đã làm

### M12 — Siêu dữ liệu công khai đúng hiện trạng

- `apps/dhcb/index.html`: từ khoá bỏ "sự nghiệp/công việc/khởi nghiệp/đời sống", thêm các môn
  STEM; JSON-LD `WebApplication` nhắc đủ Tiếng Anh + Lập trình + bốn môn STEM. FAQ viết lại cho
  người đọc (bỏ câu liệt kê đường dẫn nội bộ `/tro-truyen`…): "gồm những gì", "môn Tiếng Anh có
  gì", "học khi không có mạng" (đúng chính sách M14 mới), "có miễn phí không" — **Free 30 lượt AI
  mỗi ngày tính chung, VIP hạn mức cao hơn nhiều** (không ghi con số VIP vì cấu hình được ở
  `/admin`; bỏ "nâng cấp gói Pro").
- `apps/hub/index.html`: title/description/og:description còn "năm trụ … Sự nghiệp · Khởi
  nghiệp · Đời sống" → hai trụ Học tập + Ghi chú. Kèm chuỗi "năm trụ" ở `HubLogin.tsx`.
- **Xoá 4 `preconnect`** tới `api.groq.com`, `api.openai.com`, `api.anthropic.com`,
  `api.sentry.io`. Đã kiểm Sentry client (`lib/errorTracking.ts`): chỉ bật khi có
  `VITE_SENTRY_DSN`, nạp lười khi có lỗi, và gửi tới host ingest trong DSN
  (`*.ingest.sentry.io` theo `.env.example`) — **không bao giờ** tới `api.sentry.io`, nên xoá cả
  bốn, không thay bằng host nào.
- `manifest.webmanifest`: chỉ đổi màu (mục M13); `name`/`short_name` để đợt "Lỗi minor" (minor 8).

### M13 — Theme

- **Đảo màu hai lần:** `Landing.tsx`, `LandingEn.tsx` (và `WordDetail.tsx` — trang chi tiết từ
  dính đúng khuôn này, sửa cùng) bỏ mọi `theme-light:bg-white / text-zinc-* / border-zinc-*`: các
  token `--z-*`/`--c-white` đã tự đảo theo theme. Thang accent KHÔNG tự đảo, nên chữ nhấn
  `text-accent-400` trên nền sáng thêm `theme-light:text-accent-700` (khuôn sẵn có ở Cài đặt).
- **Mặc định HTML ↔ JS khớp:** `index.html` (app + hub) `data-theme="blue-sky"` +
  `theme-color #f0f9ff`; manifest `background_color`/`theme_color` `#09090b` → `#f0f9ff` (màn
  khởi động PWA hết màu đen). Hub bỏ `class="dark"` không dùng.
- **Lần đầu vào theo `prefers-color-scheme`:** `getTheme()` (`packages/core-ui/theme.ts`) — đã
  chọn thì lựa chọn thắng; chưa chọn thì máy tối → Xanh đêm, máy sáng → Blue sky; KHÔNG ghi lại
  giá trị suy ra (đổi chế độ máy thì lần sau đổi theo). `kid` (khoá theo tuổi ở `ThemeProvider`)
  không bị đụng. Script nhỏ trong `<head>` của `apps/dhcb/index.html` áp cùng luật trước khi JS
  chính chạy để khỏi nhá màu (CSP đã cho `'unsafe-inline'`); test canh script và `theme.ts` cùng
  khoá + cùng danh sách theme.

### M14 — Tải ngầm dữ liệu có điều kiện

- `main.tsx` chỉ còn đăng ký service worker; KHÔNG gọi tải ngầm cho mọi người nữa.
- Mới `lib/offlineDownload.ts` (hàm thuần): `precacheBlockReason()` trả lý do không tải theo thứ
  tự `unsupported` (dev / không Cache Storage) → `disabled` (công tắc tắt) → `save-data` →
  `guest` (chưa đăng nhập hoặc khách vãng lai) → `not-studied`; công tắc lưu theo MÁY
  (`et_offline_download`, chỉ `'0'` là tắt — mặc định bật; không đồng bộ đa thiết bị vì dữ liệu
  nằm trên máy này); `isSaveDataOn()` đọc `navigator.connection.saveData`.
- `storage.ts` thêm `hasEverStudied(uid)`: quét mọi khoá `et_usage_<uid>_<ngày>` có hoạt động > 0
  (cùng luật `hasActivityOn` của streak; không giới hạn khung ngày; dữ liệu `pullUserData` kéo về
  cũng tính → đổi máy vẫn đúng; kiểm phần đuôi là ngày để uid `a` không khớp nhầm uid `a_b`).
- Mới `components/DataPrecacheGate.tsx` (gắn trong `App.tsx`): đánh giá lại khi trạng thái đăng
  nhập đổi, khi chuyển trang (người mới học xong phiên đầu → tải từ lần chuyển trang kế tiếp), khi
  công tắc đổi. Khách KHÔNG nạp chunk tải.
- `lib/dataPrecache.ts`: chờ sự kiện `load`; thêm `stopDataPrecache()` (đếm "thế hệ" — vòng tải
  thoát êm sau file đang tải; phần đã tải giữ nguyên) và `fetchDataPackSummary()` (tổng dung lượng
  từ manifest + phần đã tải theo bản đồ hash).
- Mới `components/OfflineDownloadSetting.tsx` ở cuối trang Cài đặt (nhóm "Môn tiếng Anh" vì dữ
  liệu là của môn này — chỉ THÊM khối, không đụng các khối đợt minor 13/U9a sửa): công tắc
  `role="switch"` theo khuôn VoicePicker, "Dung lượng ước lượng: 23,5 MB trên máy · đã tải X MB"
  (MB thập phân như iOS/Android báo), và câu trạng thái theo đúng lý do chưa tải.

## Bằng chứng

- **Số yêu cầu `/data/*` trang chủ khách** (bản build PROD qua `vite preview`, 1440×900, service
  worker bật, 8 giây sau `load`): **trước 315 → sau 6** (6 = dữ liệu trang tự cần, vd `cefr.json`).
- Kịch bản cổng tải trên bản build PROD (đăng nhập giả lập bằng `e2e/helpers/auth.ts`, 8 giây):
  khách 6 · đăng nhập chưa học 8 · **đăng nhập + đã học 317 (tải chạy)** · đã học + Save-Data 8 ·
  đã học + công tắc tắt 8. Mạng chậm giả lập (300 ms/file, chặn SW): đang tải 8,1 MB thì bấm tắt →
  0 yêu cầu trong 6 giây tiếp; bật lại → tải tiếp 13 file trong 4 giây. Công tắc đo được vùng chạm
  44×44. Đo lại trên bản build của kết quả gộp `main` cuối: cùng số.
- Test mới/sửa: `offlineDownload.test.ts` 30 ca (mọi lý do chặn + thứ tự ưu tiên, công tắc, Save-Data,
  localStorage bị chặn, MB) · `storage.test.ts` +8 ca `hasEverStudied` · `theme.test.ts` +8 ca
  prefers-color-scheme · `publicMetadata.test.ts` 29 ca (câu chữ cũ, JSON-LD hợp lệ, preconnect,
  theme mặc định HTML ↔ manifest ↔ `theme.ts`, script chống nhá màu, khuôn đảo màu hai lần).
  **Đối chứng âm:** đặt lại HTML/manifest/Landing/WordDetail bản `main`, giữ test → 17/29 đỏ.
- Typecheck (đã xoá `packages/*/dist dist dist-server`) ✅ · Lint 0 cảnh báo ✅ · Prettier ✅ ·
  Build ✅ · size-limit 154,29/160 kB JS, 23,95/26 kB CSS ✅ (đo trên kết quả gộp `main` cuối).
- `test:coverage` (trên kết quả gộp `main` cuối): 803 file / 18712 test ✅, độ phủ 95,12 / 91,00 /
  95,70 / 95,77.
- E2E `a11y.spec.ts` + `a11y-aaa.spec.ts` lọc `/welcome|/learn-vietnamese|/cai-dat|/tu-dien`
  (3 theme): **21/21** ✅; các spec chạm Cài đặt/tiêu đề (`bottomnav`, `practice-direction`,
  `profile-save-recovery`, `u9-touch-target-text-spacing`, `landmark-title`): **91/91** ✅. Trang
  chi tiết từ (ngoài cổng) quét axe riêng 3 theme × (từ có / từ không có): 0 vi phạm.
- **Tầng 8b** (bản build PROD, tự xem ảnh), 1440 + 390, máy sáng + máy tối:
  - `/welcome`, `/learn-vietnamese` máy sáng — trước: nền tối chữ sáng giữa thanh bên + nav sáng
    (đúng mô tả M13); sau: Blue sky sáng đồng bộ thanh bên, tiêu đề nhấn xanh đậm đọc rõ;
  - máy tối, chưa chọn theme — trước: vẫn Blue sky; sau: Xanh đêm, trang đích tối đồng bộ;
  - `/cai-dat` 390 — khối "Tải để học ngoại tuyến" ở cuối, công tắc bật, dòng dung lượng + trạng
    thái "Sẽ bắt đầu sau khi bạn đăng nhập và học phiên đầu tiên" (khách); phần trên trang giống
    hệt trước;
  - chi tiết từ `hello` 390 Blue sky — trước nền tối, sau sáng.

## Còn tồn / ghi chú cho phiên điều phối (KHÔNG sửa PROGRESS.md theo luật đợt)

- **Trùng số changelog:** `main` đã có `0496-2026-10-05-gitignore-state-grading.md` (phiên khác).
  File này GIỮ số 0496 do phiên điều phối giao; `scripts/changelog.test.ts` cho phép trùng số (phá
  hoà theo ngày rồi tên file).
- Gộp `main` (hai lần, merge không rebase): xung đột ở `Landing.tsx` — U9a thêm `tap-44-y` cho
  liên kết "Xem toàn bộ nền tảng", giữ cả hai. Công tắc "Tải để học ngoại tuyến" theo khuôn công
  tắc mới của U9a (nút 44×44, viên thuốc 44×24 vẽ bên trong) và đọc ngôn ngữ GIAO DIỆN (`isUiVi`)
  vì minor 13 đã tách khỏi chiều học. Tên sản phẩm trong manifest/tiêu đề do #1246/#1249 đổi —
  giữ nguyên của họ.
- **Sự cố trong phiên (đã khắc phục):** lệnh `git checkout -q -- .` gõ nhầm đã hoàn tác mọi thay
  đổi chưa commit trên 16 file; hook `block-dangerous-git.sh` không bắt được dạng có cờ `-q --`.
  Đã khôi phục từ bản sao lưu + áp lại từng bước sửa, rồi chạy lại ĐỦ cổng trên kết quả gộp. Đề
  xuất (chờ chủ dự án): mở rộng hook bắt cả `git checkout [cờ] -- .`.

- Cổng tải ngầm chỉ có test hàm thuần + kiểm tay trên bản PROD; chưa có E2E cố định vì Playwright
  chạy dev server (`import.meta.env.PROD = false` → luôn `unsupported`). Muốn chặn hồi quy ở CI
  cần một project E2E chạy trên `vite preview` — đề xuất, chờ chủ dự án.
- Banner `GuestBanner`/`PlanExpiryBanner`/`PromoEndingBanner`, `Dictionary.tsx`, `EnglishHome.tsx`
  còn `theme-light:text-zinc-*` nhưng nằm trên nền màu riêng (không phải đảo cả trang) và đang qua
  cổng a11y — để nguyên, không thuộc M13.
- Thấy khi chụp: phiên âm trang chi tiết từ hiện hai lần gạch chéo (`//hɛˈloʊ//`) — lỗi có sẵn,
  ngoài phạm vi đợt.
