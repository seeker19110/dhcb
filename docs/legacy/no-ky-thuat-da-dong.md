# Nợ kỹ thuật ĐÃ ĐÓNG — kho lưu (tách khỏi `PROGRESS.md` ngày 2026-09-01)

`PROGRESS.md` mục "Nợ kỹ thuật còn mở" chỉ giữ nợ **đang mở**; các khối dưới đây là nợ đã gỡ,
dời nguyên văn sang đây để giữ bằng chứng và bài học (cách chẩn đoán, số đo, giả thuyết đã bác
bỏ). Thứ tự: như thứ tự cũ trong `PROGRESS.md`, mới hơn ở trên.

Khi đóng thêm một món nợ: cắt khối đó khỏi `PROGRESS.md`, dán vào ĐẦU danh sách dưới đây.

- ✅ **[2026-09-14 → ĐÓNG 2026-09-26, `docs/changelog/0454-*.md`] Nhãn chữ
  trong hoạt ảnh khó đọc ở màn hình 390px.** Đo được **29/150 nhãn dài hơn 24 ký tự** ở cỡ chữ
  11–12 trong viewBox rộng 440 — trên điện thoại chúng co lại rất nhỏ. **KHÔNG phải lỗi mới**:
  bài `ly11-c2-b8` đã như vậy từ trước. Sửa tận gốc phải đụng `packages/core-ui/LessonAnimation.tsx`
  (codemap: 5 file ảnh hưởng) hoặc đặt luật độ dài nhãn cho toàn bộ hoạt ảnh — cần một đợt riêng.
  **Đóng bằng nút "Xem lớn" ở bộ vẽ** (chủ dự án chọn trong 4 phương án, 2026-09-25). Đo lại khi
  đóng mới thấy nợ lớn hơn nhiều so với mô tả gốc: **1.000/1.861 nhãn của 238 hoạt ảnh hiện dưới
  10px** ở màn 390px (SVG thật rộng 358px), tệ nhất 6px (khung Sinh 716 × 118). Hình trong bài giữ
  nguyên; hình nào có chữ nhỏ hơn 10px ở bề rộng hiện tại thì hiện thêm nút "Xem lớn". Nút mở
  `<dialog>` toàn màn hình, tự xoay 90° khi máy dựng đứng mà hình khổ ngang, nên chữ về ≥ 10px kể
  cả khi khoá xoay. Không sửa tay nhãn nào. Cổng: `lessonAnimationZoom.test.ts` +
  `LessonAnimation.test.tsx` + `e2e/lesson-animation-zoom.spec.ts`.

- ✅ **[2026-08-28 → ĐÓNG 2026-09-21 (khảo sát nợ kỹ thuật định kỳ), nay VÔ NGHĨA vì trang đã bị
  xoá] "4 trang trụ Career/Work/Startup/Life vẫn chưa có bản chiều B".** Ba việc chính trong mục
  gốc (Career.tsx hỏi "Số năm kinh nghiệm", Work.tsx/Life.tsx đặt `<Layout>` cuối JSX,
  FeedbackModal.tsx thiếu Escape/bẫy tiêu điểm) đã đóng từ 2026-09-03. Phần còn treo — "4 trang
  trụ chưa có bản chiều B" — bị bỏ quên khi ba trụ Career/Startup/Life bị **XOÁ HẲN** khỏi mã
  nguồn ở đợt 2026-09-20 (`docs/changelog/0389-*.md` gỡ giao diện, `0390-*.md` gỡ backend +
  migration `postgres/migrations/0085_drop_career_startup_life.sql`), chỉ còn trụ `work` dưới
  tên hiển thị "Ghi chú" (`/ghi-chu`). Xác nhận lại 2026-09-21: `find apps -iname "Career.tsx"
-o -iname "Work.tsx" -o -iname "Startup.tsx" -o -iname "Life.tsx"` không trả file nào — không
  còn gì để dịch song ngữ. Đúng loại lệch Tầng 6b (tài liệu điều hành nói một đằng, mã một nẻo):
  đóng bằng cách xoá mục nợ, không phải bằng cách làm bản chiều B cho trang không còn tồn tại.

- ✅ **[2026-09-15 → ĐÓNG 2026-09-15, PR S10-1, `docs/changelog/0332-*.md`] 6 lỗi lifecycle
  voice/AI** (TTS nổ ở trang kế khi rời Companion giữa stream; stream không huỷ được; `tts.ts`
  chốt play-token sau await; mic không release khi `MediaRecorder` ném; `AiHelpPanel` rò hint
  giữa bài) — file:dòng ở spec S10 §②. **Đã trả hết sáu lỗi** (L1–L6), mỗi lỗi một test
  regression viết TRƯỚC và đỏ trên mã cũ: tổng 8 ca đỏ → 8 ca xanh. Hai file test mới
  (`sttServer.test.ts`, `AiHelpPanel.test.tsx`) cho hai file trước nay không có test nào.
  Bài học giữ lại: `stopSpeaking()` chỉ có tác dụng nếu lượt phát chốt "vé" **trước** quãng
  `await` tải audio — rời trang chính là lúc đang tải, nên chốt vé sau await là vô hiệu hoá
  đúng ca duy nhất mà nó cần chặn.

- ✅ **[2026-08-28 → ĐÓNG 2026-09-05, audit toàn diện F3] Repo từng có HAI file cấu hình Nginx mô
  tả cùng một server.** `nginx/dhcb.conf` tự nhận là "cấu hình ĐANG CHẠY THẬT trên VPS", trong khi
  `docs/deploy-vps-ubuntu.md`, `docs/cloudflare-setup.md` và `docs/runbook-dung-vps-moi-tu-dau.md`
  đều hướng dẫn copy `nginx/en-vi.conf`. Audit so hai file: `dhcb.conf` khai TRÙNG `server_name`
  nhưng chỉ có 2 khối `location`, **thiếu** `/api/`, `@express` và cache tài nguyên tĩnh mà
  `en-vi.conf` có (6 khối) — tức bản nghèo hơn hẳn, copy nhầm là mất cache tĩnh + proxy API. Không
  có tài liệu nào trỏ tới nó. **Đã xoá `nginx/dhcb.conf`; `nginx/en-vi.conf` là bản duy nhất.**

<!-- Khối dưới đây (2026-07-20 → 2026-08-21) dời từ PROGRESS.md ngày 2026-09-06: toàn bộ là nợ
     đã đóng / ghi nhận rà soát cũ, không còn mục 🟡/🔴 nào. Giữ nguyên văn để tra cứu. -->

- ~~🟡~~ **[2026-08-18, cập nhật khi fix PR #603] `eslint-plugin-react-hooks` đã ghim TẠM về lại
  `^4.6.2`** (đúng bản trước PR #574) để CI/lint xanh trở lại ngay — bản `7.1.1` mà PR #574 bump
  lên mang theo 5 rule React Compiler mới, làm lộ **73 lỗi trải trên 45+ file**: `set-state-in-effect`
  (48 lỗi — vd `Work.tsx:103`, `WorkKanban.tsx:53`, `packages/core-ui/ThemeProvider.tsx:36`, phần
  lớn các trang `useEffect(() => { loadData() }, [loadData])`), `purity` (10), `exhaustive-deps`
  (10), `immutability` (8), `static-components` (3). Việc còn lại: **mở PR riêng** để (1) nâng lại
  `eslint-plugin-react-hooks` lên `^7.x`, (2) sửa đúng 73 lỗi theo từng rule (không chỉ thêm
  `eslint-disable`) — có thời gian review kỹ vì đụng logic hook ở nhiều trang/component cùng lúc.
  Danh sách file/line đầy đủ: chạy lại `npm run lint` sau khi bump plugin để lấy danh sách mới nhất
  (số dòng có thể lệch do code đã đổi).
- **[Rà soát Dependabot 2026-08-16] Xử lý 9 PR dependency tồn đọng (#550-559): merge 6, đóng 3.**
  Merge (đều CI xanh thật, chỉ thiếu heading PR template nên `metadata` báo sai): `actions/
setup-node` 4→7 (#550), `actions/upload-artifact` 4→7 (#551), `actions/github-script` 7→9 (#552),
  `actions/checkout` 4→7 (#553), nhóm `production-patch` (`jose` 6.2.4→6.2.8, `nodemailer`
  9.0.3→9.0.5, #556), `@sentry/react` 10.63.0→10.70.0 (#558). **Đóng KHÔNG merge** 3 PR có vấn đề
  thật, không phải lỗi CI vặt:
  - **#559 TypeScript 5.9.3→7.0.2** — vi phạm trực tiếp chính sách ghim phiên bản CLAUDE.md mục 6
    ("KHÔNG nâng ... TS"). Đóng ngay, không cần điều tra thêm.
  - **#555 nhóm dev-deps (13 gói)** — `npm ci` fail thật: `eslint-plugin-react-refresh@0.5.4` đòi
    `eslint@^9||^10`, dự án ghim ESLint 8 có chủ đích (chưa chuyển flat config). Không giải được
    mà không nâng ESLint major (cũng bị cấm). Đóng, để dependabot tách PR khác nếu muốn cập nhật
    12 gói còn lại riêng.
  - **#557 vitest 3.2.6→4.1.10** — `npm ci` fail thật: thiếu bump kèm `@vitest/coverage-v8` (vẫn
    ghim `^3.2.6`) → ERESOLVE. Ngoài lỗi kỹ thuật, đây là major bump test runner đang chạy 3415
    test — rủi ro cao, không tự merge dù sửa được xung đột peer. Để owner quyết định thời điểm
    nâng cấp (cần bump đồng thời coverage-v8 + review breaking changes changelog v4).
    Sau đợt xử lý: `rm -rf node_modules && npm ci` sạch, build ✅ typecheck ✅ lint 0 cảnh báo ✅ test
    **3415/3415** ✅ (208 file), `npm audit` **0 lỗ hổng**.

- **[Rà soát tự động 2026-08-09] `npm audit` VỀ 0 LỖ HỔNG lần đầu tiên — mục react-router ở dưới
  ĐÃ ĐÓNG (không còn là nợ), cộng thêm vá 2 advisory mới phát sinh.** Container mới (chưa có
  `node_modules`) → `npm ci` sạch rồi chạy đủ cổng: build ✅ · typecheck ✅ (4 tsconfig) · lint ✅
  (0 cảnh báo) · test ✅ (**164 file / 2982 test**). Không có lỗi type/lint/test nào trong code.
  - **Tin quan trọng: advisory react-router `GHSA-qwww-vcr4-c8h2` đã được GitHub cập nhật ngày
    2026-08-07, NARROW dải ảnh hưởng xuống `>=7.12.0 <7.18.2`** (trước đó ghi "chưa có bản vá nào
    trong dòng 7.x", xem quyết định 2026-08-03 ở dưới) — nghĩa là **`7.18.2` (bản dự án đang dùng
    sẵn) chính là bản đã vá**, không cần đổi gì. Xác nhận qua `npm ls react-router-dom` (đúng
    `7.18.2`) + `npm audit` không còn liệt kê react-router. **Mục "giữ nguyên v7.18.2, chấp nhận
    báo 2 dòng high dài hạn" ở quyết định 2026-08-03 nay LỖI THỜI — đã đóng, không phải chờ nâng
    React 19 như dự tính.**
  - `npm audit` phát sinh **2 advisory mới** (khác hẳn react-router, do hệ sinh thái cập nhật từ
    2026-08-03 tới nay): `js-yaml` 4.0.0–4.3.0 (`GHSA-5p4m-2wfm-xmqj`, quadratic CPU qua `!!omap`)
    nguồn `eslint`/`@commitlint/cli → cosmiconfig`, và `nanoid` `<3.3.17` (`GHSA-2v37-7h3g-55p8`,
    vòng lặp vô hạn khi `size=0`) nguồn `postcss`. Cả hai đều **thuần devDependency** (lint/build
    time), không vào bundle chạy cho người dùng cuối. `npm audit fix` mặc định kéo theo cả loạt
    gói optional platform (`@esbuild/*`, `@img/sharp-libvips-*`) không liên quan — thay vào đó
    thêm `overrides` trong `package.json` (`js-yaml` `^4.3.1`, `nanoid` `^3.3.18`) rồi `npm
install`, chỉ đổi 2 dòng version trong `package-lock.json`. Xác nhận lại `npm audit`: **0 lỗ
    hổng** (`prod` 239 · `dev` 551 · `optional` 83, tổng 790 gói). Đã chạy lại đủ 4 cổng
    (build/typecheck/lint/test) sau khi đổi, vẫn xanh 100%.
  - Đã sửa `.claude/report-status.sh` mục nợ #1 (không còn ghi "2 dòng high react-router báo lâu
    dài" — đã đóng) để phiên sau không đọc phải thông tin lỗi thời.
  - PR trước của nhánh này (#525) đã merge & xoá nhánh remote trước khi phiên này bắt đầu — theo
    đúng quy ước "tạo PR = coi như đã xong" (CLAUDE.md mục 3): nhánh `claude/jolly-mendel-h56pdm`
    khởi động lại từ `origin/main` (lúc đó trùng khớp HEAD, không có commit lạc), coi lượt này là
    chu kỳ mới trên cùng tên nhánh.

- **[2026-08-04] Luật a11y mới + ĐÃ TRẢ HẾT nợ tương phản AAA.** Luật (CLAUDE.md mục 4.5, theo
  khuyến nghị W3C _Understanding Conformance_): **nội dung & tiêu đề đạt AAA (≥ 7:1)**, **mọi phần
  còn lại đạt AA**. Hai cổng E2E chặn CI, cả hai TUYỆT ĐỐI (không còn baseline):
  - `e2e/a11y.spec.ts` — 0 vi phạm A/AA ở MỌI mức tác động (trước chỉ chặn critical + serious mới),
    thêm tag `wcag22aa`, mở rộng **cả 5 theme** cho mọi trang + trang đăng nhập. 122 test xanh.
  - `e2e/a11y-aaa.spec.ts` (mới) — 15 trang × 5 theme, lọc riêng phần tử nội dung/tiêu đề. 75 test xanh.
  - Nợ tương phản AAA ban đầu **~305 phần tử** (Pink 115 · Nhi đồng 115 · Rực rỡ 48 · Blue sky 26 ·
    Xanh đêm 1) đã **xử lý xong**: gốc rễ chỉ là 2 token `--z-300`/`--z-400` (`text-zinc-300/400`)
    của từng theme trong `apps/english/src/index.css` — chỉnh sắc độ cho đạt 7:1 trên nền sáng nhất
    (theme sáng) / tối nhất (theme tối) là hết. Giá trị mới: dark-blue z-400 `158 173 191` ·
    blue-sky z-400 `64 78 96` · pink z-300 `82 68 76` z-400 `89 75 83` · vibrant z-400
    `190 172 216` · kid z-300 `98 72 45` z-400 `101 75 48`.
- **[2026-08-04] 3 lỗi AA THẬT do cổng siết + quét đủ 5 theme phát hiện (đã sửa):**
  1. 4 nút vote 👍/👎 (Chat, Speaking) rớt `target-size` (WCAG 2.2 AA 2.5.8) → `tap-44` → `h-11 w-11`.
  2. Nút hiện/ẩn mật khẩu ở `/login` chỉ 20×20px → `h-8 w-8` (32px, nằm gọn trong `pr-11` của ô nhập).
  3. **Nặng nhất:** 3 nút OAuth (Facebook/Apple/Microsoft) ở `/login` dùng `text-white` — mà `white`
     map sang token `--c-white`, ở theme nền sáng token này bị ĐẢO thành màu tối → chữ tối trên nền
     thương hiệu tối, tương phản chỉ **1.17–1.33:1**, gần như không đọc được với người dùng theme
     Blue sky/Pink/Nhi đồng. Sửa: dùng `text-[#fff]` (trắng thật). Nút Facebook đổi `#1877F2` →
     `#1772E8` để chữ trắng đạt 4.5:1 (bản gốc 4.23:1).
     Cả 3 đều là lỗi có thật với người dùng, cổng cũ (chỉ chặn critical + serious mới, 4 theme, không
     quét `wcag22aa`) không bắt được.
- ~~**Nợ mới chưa xử lý:** tiện ích `.tap-44` mở rộng vùng chạm bằng `::after` có
  `pointer-events: none`~~ **✅ ĐÃ TRẢ (2026-08-08).** Xem mục "Đợt trả nợ kỹ thuật 2026-08-08" ở đầu file.
- ~~🟡 **Token `--z-500` rớt WCAG AA ở gần như mọi nền, mọi theme**~~ **✅ ĐÃ TRẢ (2026-08-08)** trên
  mọi bề mặt thật (z-950/900/800); chỉ còn nhóm nền `z-700` giữ trong `KNOWN_LOW` CÓ CHỦ Ý. Xem mục
  "Đợt trả nợ kỹ thuật 2026-08-08" ở đầu file.
- ~~🟢 **3 chu trình import trong `apps/english/src/data/`**~~ **✅ ĐÃ TRẢ (2026-08-08)** — thực tế
  lúc bắt tay vào làm là **5 chu trình** (có thêm 2 cái trong `lib/` dính logic chạy thật, phát sinh
  sau lần ghi nhận 2026-08-04). Nay `npm run codemap -- cycles` báo 0.

- **[Rà soát tự động 2026-08-03, phiên sau PR #462]** `npm ci` sạch (container mới, chưa có
  `node_modules`) rồi chạy đủ cổng commit: build ✅ · typecheck ✅ (4 tsconfig) · lint ✅ (0 cảnh
  báo) · test ✅ (**149 file / 2414 test**, tăng nhiều so với lượt trước vì các PR listening/story
  mới đã merge). Không có lỗi type/lint/test mới trong code.
  - `npm audit` sau `npm ci` báo **3 lỗ hổng high** — nhiều hơn 2 dòng đã chốt ở mục ngay dưới, vì
    phát sinh THÊM 1 advisory mới: `fast-uri` 3.0.0–3.1.4 (`GHSA-7p8r-x3mc-p8w7`, host confusion
    qua backslash). Nguồn: `@commitlint/cli → @commitlint/load → config-validator → ajv@8.20.0 →
fast-uri` — thuần devDependency (commitlint hook), không vào bundle chạy cho người dùng cuối.
    Có bản vá không phá vỡ gì trong dải semver cũ → chạy `npm audit fix` (không dùng `--force`),
    nâng `fast-uri` `3.1.4` → `3.1.5`, chỉ đổi `package-lock.json` (không đổi `package.json`).
    Xác nhận lại `npm audit`: về đúng **2 lỗ hổng** (react-router, xem mục dưới — quyết định giữ
    nguyên đã chốt, không đổi gì thêm ở đây).
  - Đây là việc lặp lại theo lịch (audit định kỳ bắt kịp advisory mới của hệ sinh thái), không
    phải lỗi bỏ sót trước đó — bản thân advisory `fast-uri` mới được công bố sau lượt audit PR
    #462. Không có thay đổi code nghiệp vụ nào trong lượt rà soát này.

- **[2026-08-03] Lỗ hổng npm: ĐÃ VÁ 3/4, mục react-router ĐÓNG LẠI bằng quyết định "không nâng"
  (người dùng chốt phương án A).** PR #462. `npm audit`: **5 lỗ hổng → 2** (2 con số còn lại là
  cùng MỘT advisory react-router, xem ngay dưới).
  - Đã vá, **không nâng major gói nào**: `postcss` 8.4.x → **8.5.25** (Path Traversal source map,
    `GHSA-r28c-9q8g-f849`, high) · `brace-expansion` → **1.1.18/2.1.4/5.0.9** (DoS tràn bộ nhớ,
    `GHSA-mh99-v99m-4gvg`, high) · `esbuild` 0.27.7 → **0.28.1** (đọc file tuỳ ý ở dev server trên
    Windows, `GHSA-g7r4-m6w7-qqqr`, low). Cả 3 đều chỉ chạy lúc **build/dev**, không nằm trong
    bundle chạy trên trình duyệt người dùng.
  - `package.json` chỉ đổi đúng 1 dòng: `vite` `7.3.5` → `7.3.6` — **bản vá (patch), vẫn nằm trong
    dải `^7.3.5` cũ**, không vi phạm quy tắc GIỮ NGUYÊN PHIÊN BẢN (CLAUDE.md mục 6). Cần thiết vì
    vite 7.3.5 khoá cứng `esbuild@^0.27.0`; 7.3.6 mới nới sang `^0.27.0 || ^0.28.0` để
    `npm update esbuild` dedupe được về bản đã vá. Ba gói còn lại vá trong dải semver sẵn có nên
    chỉ `package-lock.json` đổi.
  - ⚠️ **ĐÍNH CHÍNH ghi chú rà soát 2026-08-01 phía dưới** (dòng "`npm audit fix` không giải quyết
    dứt điểm 2 mục high vì cần nâng major `eslint`/`tailwindcss`/`vite`"): kết luận đó **SAI/đã lỗi
    thời**. Chạy lại thực tế ngày 2026-08-03 thì cả 2 mục high vá được mà **không cần nâng major
    gói nào** — các gói thượng nguồn đã phát hành bản vá trong dải semver cũ kể từ ngày ghi chú đó.
  - 🔒 **`react-router` (`GHSA-qwww-vcr4-c8h2`, high): QUYẾT ĐỊNH GIỮ NGUYÊN `7.18.2`, KHÔNG nâng.
    Đây là quyết định có chủ đích, không phải việc còn tồn.** Người dùng chốt 2026-08-03 sau khi
    cân nhắc 3 dữ kiện đã kiểm chứng:
    1. **Không ảnh hưởng dự án này.** Advisory ghi rõ _"This only affects your application if you
       are using the unstable RSC APIs."_ Đã grep xác nhận repo không dùng RSC, không dùng
       `RouterProvider`/`createBrowserRouter` — `App.tsx` dùng `BrowserRouter` thuần (SPA).
    2. **Bản vá duy nhất là react-router `8.3.0`**, không có bản vá nào trong dòng 7.x. Mà **v8 yêu
       cầu React `19.2.7+`** (tài liệu chính thức `reactrouter.com/upgrading/v7`) — dự án đang React
       `18.3.1`, nâng react-router ⇒ **buộc nâng React 18 → 19**, đúng thứ CLAUDE.md mục 6 cấm.
       v8 cũng **xoá hẳn gói `react-router-dom`** → 32 file phải đổi import sang
       `react-router` / `react-router/dom`.
    3. `npm audit fix --force` không phải là "nâng" — nó **HẠ CẤP** về `react-router-dom@7.11.0`
       (lùi 7 minor, mất tính năng).
       → Đổi React 18 → 19 để vá một lỗ hổng ở code path app không hề chạy là cái giá không đáng.
       **`npm audit` sẽ còn báo 2 dòng high này lâu dài — đó là kỳ vọng, không phải việc bỏ sót.**
       Xem lại quyết định khi nào: nếu dự án sau này dùng RSC/data router, hoặc khi có lý do độc lập
       để nâng React lên 19.

- **[Rà soát tự động 2026-08-03]** Chạy lại đầy đủ cổng commit sau `npm ci` sạch: build ✅ ·
  typecheck ✅ (4 tsconfig: gốc/api/e2e/`apps/hub`) · lint ✅ (0 cảnh báo) · test ✅ (**103 file /
  1683 test**). Không có lỗi code mới. `npm audit`: **5 lỗ hổng (4 high, 1 low)** — khớp đúng dự
  đoán ở mục nâng cấp react-router bên dưới (2 high cũ `postcss`/`brace-expansion` + 1 high mới
  `react-router` CSRF RSC Mode + 1 low `esbuild`), không phát sinh gì ngoài dự kiến. Phát hiện 1
  tài liệu lỗi thời: `.claude/report-status.sh` dòng nợ kỹ thuật #1 vẫn ghi react-router "chưa
  nâng cấp" dù đã nâng lên v7.18.2 từ 2026-08-02 — đã sửa lại đúng hiện trạng (hết 2 CVE moderate
  cũ, chấp nhận 1 cảnh báo high mới vì app không dùng RSC Mode). E2E Playwright vẫn KHÔNG chạy
  được trong sandbox này (không có `.env`/Postgres thật) — như các lượt rà soát trước.
  ⚠️ **Số liệu `npm audit` trong mục này đã bị thay thế** bởi mục 2026-08-03 ngay phía
  trên (PR #462 đã vá 3/4 lỗ hổng, còn 2). Giữ lại nguyên văn làm bản ghi lịch sử của lượt
  rà soát lúc 00:13 cùng ngày, không phải hiện trạng.

- **[2026-08-02] react-router: ĐÃ NÂNG LÊN v7 (phương án 1 bước), package.json đổi
  `react-router-dom` `^6.24.1` → `^7.18.2`.** Cổng commit đạt đủ: build ✅ · typecheck ✅ (4
  tsconfig) · lint ✅ (0 cảnh báo) · test ✅ (103 file / 1473 test) · dev server khởi động sạch
  (HTTP 200, không lỗi console). Không sửa file nào khác ngoài `package.json`/`package-lock.json`
  — đúng như dự đoán trong đặc tả (Declarative Mode, không data router/loader/action/`<Outlet>`).
  **Lưu ý audit:** `npm audit` hết 2 CVE moderate cũ, nhưng phát sinh 1 cảnh báo **high** MỚI
  (`GHSA-qwww-vcr4-c8h2`, CSRF trong **RSC Mode** — React Server Components, dải
  `>=7.12.0 <8.3.0`) — **chưa có bản vá nào** (react-router v8 chưa phát hành trên npm tính đến
  2026-08-02). App này **không dùng RSC Mode** (không `react-router.config.ts`, không action
  route) nên không khai thác được thực tế — chấp nhận cảnh báo audit này, sẽ tự hết khi có bản vá
  phát hành và nâng tiếp. **Chưa chạy E2E Playwright** (cần Postgres thật, sandbox không có) — cần
  chạy trước khi merge như cổng merge CLAUDE.md mục 9 yêu cầu. Kế hoạch gốc + đánh giá "chuyển
  sang data router/loader/action/SSR" (đã đề xuất KHÔNG làm — chi phí lớn, lợi ích nhỏ vì app hầu
  hết sau đăng nhập, VPS 1 vCPU không nên tăng tải server-render) ở
  `docs/research/dac-ta-nang-cap-react-router-v7-2026-08-02.md`. Trước đó
  chọn phương án trước khi làm.
- **[2026-08-02] `restore:r2 -- --restore-into`: đã viết runbook kiểm thử, CHỜ BẠN TỰ CHẠY TRÊN
  VPS.** Sandbox Claude Code web không có Docker daemon/mạng tới VPS nên không tự test được nhánh
  phá huỷ dữ liệu tại đây. Đã soạn quy trình 7 bước an toàn (dùng database TẠM
  `english_tutor_restore_test`, không đụng `english_tutor` production) ở
  `docs/kiem-thu-restore-into-staging.md` — gồm đối chiếu số liệu trước/sau, dọn dẹp, và lý do cố
  tình KHÔNG tự động hoá thành 1 script (cần người đọc log/phán đoán chênh lệch số liệu).
- **[Audit toàn diện 2026-08-01 — phát hiện mới]** Tầng 1–6 theo `docs/framework/QUY-TRINH-AUDIT.md`
  đều đạt (build/typecheck/lint/format/1033 test/bundle-size ✅, 0 secret hardcode, 0 high/critical
  `npm audit`, coverage 52.94/87.02/79.93/52.94% vượt sàn 48/87/76/48). Nợ còn lại:
  - ~~🟡 `react-router`: 2 lỗ hổng **moderate** (CVE-2025-68470 bypass + arbitrary constructor
    injection qua `deserializeErrors()`), có fix qua `npm audit fix` — chưa nâng cấp, cần kiểm tra
    không phá route trước khi merge (đổi major/minor react-router-dom).~~ **[Lỗi thời]** 2 CVE
    moderate này đã hết khi nâng lên react-router v7 (2026-08-02). Advisory react-router hiện tại
    là `GHSA-qwww-vcr4-c8h2` (high, RSC Mode) — **đã quyết định giữ nguyên, xem mục đầu 2026-08-03.**
  - ~~🟡 `restore:all`/`restore:system`/`restore:r2`: nhánh `--restore-into <db> --yes` CHƯA test
    thật~~ **✅ ĐÃ KIỂM CHỨNG (2026-08-08)** trên cụm Postgres 16 nháp — xem mục "Đợt trả nợ kỹ
    thuật 2026-08-08" ở đầu file. Vẫn giữ nguyên khuyến cáo vận hành: chạy lần đầu trên database
    phụ/staging, không thử trực tiếp trên `english_tutor` production.
  - Đã sửa 2 lỗi tài liệu lỗi thời tìm thấy: `.claude/report-status.sh` (hardcode text cũ báo sai
    Sentry/thanh toán Pro/branch protection/migration Supabase "chưa xong" dù đã xong từ lâu) và
    `docs/framework/QUY-TRINH-AUDIT.md` (ngưỡng CSS bundle ghi 9.7kB thật là 11kB, ngưỡng coverage
    ghi số đo 2026-07-02 đã lỗi thời so với `vitest.config.ts` hiện tại).
  - 2 test a11y (`/progress`, `/profile` theme blue-sky) fail 1 lần do "Execution context destroyed"
    (Playwright flaky khi nhiều test a11y chạy song song dội rate-limit) — chạy lại riêng cả 24 test
    theme blue-sky đều pass, không phải lỗi a11y thật, không cần xử lý thêm.

- **[Rà soát tự động 2026-08-01, phiên sau]** Chạy lại đầy đủ cổng commit: build ✅ · typecheck ✅
  (4 tsconfig: gốc/api/e2e/`apps/hub`) · lint ✅ (0 cảnh báo) · test ✅ (**103 file / 1249 test** — tăng
  từ 1033 vì nội dung Nghe + đối chiếu SGK mới thêm sau ngày ghi audit ở trên). Không có lỗi code mới.
  **Đính chính `npm audit`:** dòng "0 high/critical" ở mục audit toàn diện phía trên **đã lỗi thời** —
  chạy lại `npm audit` ngay bây giờ ra **5 lỗ hổng: 2 high, 2 moderate, 1 low** (advisory database
  npm cập nhật liên tục trong ngày, không phải do code đổi):
  - 🔴 `postcss` (phụ thuộc TRỰC TIẾP qua Tailwind, high, `GHSA-r28c-9q8g-f849`) — Path Traversal khi
    tự nạp source map (`sourceMappingURL`) lộ file `.map` tuỳ ý. Chỉ chạy lúc BUILD, không lọt vào
    bundle chạy trên trình duyệt người dùng — rủi ro thực tế thấp nhưng nên nâng khi có bản vá
    tương thích Tailwind 3.
  - 🔴 `brace-expansion` (gián tiếp qua `eslint`/`glob`, high) — DoS bộ nhớ, chỉ ảnh hưởng tool dev,
    không chạy trên server production.
  - 🟢 `esbuild` (gián tiếp qua Vite, low) — chỉ ảnh hưởng dev server chạy trên Windows.
  - `react-router`/`react-router-dom` (moderate) — vẫn là mục đã biết ở trên, chưa đổi.
  - ~~`npm audit fix` (không `--force`) KHÔNG giải quyết dứt điểm 2 mục high vì bản vá nằm sâu trong
    cây phụ thuộc của `eslint`/`tailwindcss`/`vite` — cần nâng major các gói này mới hết, trái quy
    tắc "GIỮ NGUYÊN PHIÊN BẢN" (CLAUDE.md mục 6) nên CHƯA tự làm, cần người dùng quyết định trước.~~
    ⚠️ **[SAI — đã đính chính 2026-08-03, xem mục đầu "Nợ kỹ thuật còn mở"]** Chạy lại thực tế cho
    thấy cả 3 mục (`postcss`/`brace-expansion`/`esbuild`) vá được mà **KHÔNG cần nâng major gói
    nào**; đã vá xong ở PR #462.
  - E2E (Playwright) KHÔNG chạy trong lượt rà soát này (môi trường phiên không có `.env`/Postgres để
    kết nối) — chỉ xác nhận cổng commit, chưa phải cổng merge đầy đủ.

- **PM2 cluster mode: ĐÃ XÁC NHẬN chạy đúng cơ chế trên VPS thật (2026-07-25),
  nhưng hiệu quả bị giới hạn bởi phần cứng — xem cuối mục.** (nhánh
  `claude/project-100k-active-users-8292zf`, đặc tả `docs/research/dac-ta-gd1-scale-30k.md`
  Việc A + fix PR #322.) Bối cảnh: PM2 cluster mode ĐÃ ROLLBACK
  về fork mode (2026-07-20, PR #285) vì PR #283/#284 làm worker crash im lặng khi chạy thật
  trên VPS (Node `cluster` module không tương thích loader ESM `--import tsx`). Lần này gỡ
  ĐÚNG nguyên nhân: thêm `tsconfig.server.json` + script `build:server` (`npm run build` gọi
  kèm) biên dịch `server.ts` + `api/**/*.ts` sang JS thật ở `dist-server/` (ESM/NodeNext,
  đã phải thêm đuôi `.js` vào ~150 import tương đối trong `api/` cho đúng chuẩn Node ESM).
  `ecosystem.config.cjs` đổi `script: './dist-server/server.js'` (bỏ `interpreter: tsx`),
  `instances: 'max'`, `exec_mode: 'cluster'`. Phát hiện thêm khi build thật: `server.ts` +
  `api/_lib/dictionaryData.ts` dùng `__dirname`/`import.meta.url` để tìm `dist/` (frontend),
  `uploads/`, `public/data/dictionary/` — các đường dẫn này SẼ SAI khi tính từ vị trí file đã
  biên dịch (nằm trong `dist-server/`), đã sửa sang `process.cwd()` (ổn định vì PM2 luôn cwd
  = gốc repo). **Đã kiểm chứng trong sandbox dev**: `node dist-server/server.js` chạy
  standalone, `/api/health` 200, `/api/dictionary` đọc đúng 12.168 từ.

  **[Cập nhật 2026-07-25, xác nhận trên VPS thật]** Deploy đầu tiên sau merge PR #321 phát hiện
  `pm2 reload` không đổi được `exec_mode` của process đang chạy (log vẫn `ids: [ 1 ]`, cluster
  mode chưa hề áp dụng) — đã vá bằng PR #322 (`scripts/pm2-reload.sh` tự phát hiện lệch
  exec_mode → `pm2 delete` + `pm2 start`; đồng thời bật `wait_ready`/`kill_timeout` cho
  zero-downtime thật). Deploy tiếp theo (commit `d801a8e`, run
  [30154933490](https://github.com/seeker19110/bilingual-english-vietnamese/actions/runs/30154933490))
  xác nhận log đúng như thiết kế: phát hiện đổi `fork_mode → cluster_mode`, xoá + start lại,
  health check OK sau 1s.

  **[Lúc đó] log PM2 báo `App [english-tutor] launched (1 instances)`** — dù cấu hình
  `instances: 'max'`, chỉ có đúng 1 tiến trình được tạo, vì VPS lúc đó chỉ có 1 vCPU (`'max'` =
  số core thật của máy).

  **[Cập nhật 2026-08-21] VPS ĐÃ NÂNG CẤP LÊN 3 vCPU / 3GB RAM** (người dùng xác nhận). Theo
  CLAUDE.md mục 13 (cập nhật 2026-08-19), PM2 đang chạy **cluster mode 3 instances thật** tận
  dụng cả 3 core, cùng `REDIS_URL` cho rate-limit tập trung (mục ngay bên dưới) — nghĩa là lợi
  ích song song thật ĐÃ CÓ, không còn bị giới hạn bởi phần cứng như trước. Nợ kỹ thuật này coi
  là **đã đóng hoàn toàn** (cả cơ chế lẫn phần cứng).

  **[Cùng ngày 2026-08-21] Tên tiến trình PM2 đổi từ `english-tutor` sang `dhcb`** (người dùng
  xác nhận đã đổi thật trên VPS). Đã đồng bộ lại trong repo: `ecosystem.config.cjs` (`name`),
  `scripts/deploy.sh` + `scripts/pm2-reload.sh` (`PM2_PROCESS`), `scripts/diagnose-502.sh`, và
  các docs vận hành trực tiếp dùng lệnh `pm2 ...`/đường dẫn `/var/www/...`:
  `docs/deploy-vps-ubuntu.md`, `docs/system-requirements.md`,
  `docs/runbook-platform-v2-production-deployment.md`, `docs/setup-postgresql-vps.md`,
  `docs/ke-hoach-khoi-phuc-su-co-server.md`, `docs/cloudflare-setup.md`, `docs/DEPLOY.md`,
  `docs/rollback-runbook.md`, `docs/runbook-dung-vps-moi-tu-dau.md`,
  `docs/huong-dan-lien-ket-facebook-apple-microsoft.md`, `docs/huong-dan-tu-host-scale-50k.md`,
  `docs/email-setup.md`.

  **[Cập nhật tiếp, cùng ngày] Đã xác minh + dọn xong mục database.** Trên VPS thật có SONG SONG
  2 database (`sudo -u postgres psql -l+`): `dhcb` (356MB, 41 bảng) và `english_tutor` (301MB, 40
  bảng, cùng 18 users) — số liệu gần giống nhau vì `english_tutor` là **bản sao/rác còn sót lại
  từ lúc đổi tên trước đây**. Xác nhận DB thật app đang dùng qua `DATABASE_URL` trong `.env`:
  `postgresql://tutor_app:...@localhost:5432/dhcb` → **`dhcb` mới là DB sống, `english_tutor` là
  rác**. Đã xử lý: backup phòng hờ (`pg_dump english_tutor | gzip > /var/backups/english_tutor-
truoc-khi-xoa-20260821.sql.gz`), xác nhận 0 kết nối đang dùng
  (`pg_stat_activity`), rồi `dropdb english_tutor` — VPS giờ chỉ còn đúng 1 database `dhcb`. Đã
  sửa nốt `docs/ke-hoach-khoi-phuc-su-co-server.md` + `docs/setup-postgresql-vps.md` (toàn bộ
  lệnh `pg_dump`/`dropdb`/`createdb`/`psql -d`/`--restore-into`/tên file backup `*.sql.gz` đổi từ
  `english_tutor` sang `dhcb`; **role `tutor_app` giữ nguyên** — đó là role Postgres thật đang
  dùng, không phải tên cần đổi). Role name khác database name là chủ ý của hệ thống, không phải
  lỗi.

  Còn lại **2 chỗ chưa đổi**, không thuộc hạ tầng vận hành nên chưa cần gấp: (1) tên GitHub repo
  `seeker19110/english-tutor` trong `docs/CODEX_CLOUD_SETUP.md` (khác `seeker19110/dhcb`
  đang dùng thật — có thể là repo cũ trước khi đổi tên, cần người dùng xác nhận có còn dùng
  không); (2) tên gọi dự án "english-tutor" trong `docs/MASTER_SPEC.md` dòng mở đầu (mang tính mô
  tả lịch sử dự án, không phải định danh hạ tầng).

  **[Hoàn tất, cùng ngày] Đã merge + deploy thật lên VPS, xác nhận qua `pm2 list`.** PR #614
  (đổi tên PM2 + dọn DB) merge vào `main` bằng squash (commit `e2477d4`) sau khi vá 2 lỗi CI
  không liên quan tới nội dung đổi tên: (1) PR body thiếu mục bắt buộc khi chuyển draft → ready
  (gate `metadata`) — bổ sung đủ 6 mục theo template; (2) `quality` fail 2 lần vì lỗi format
  Prettier — lần 2 do **lệch phiên bản Prettier** giữa `npx` cache cũ (3.8.1) và bản khai trong
  `package.json` (^3.9.6, đúng bài học CLAUDE.md mục 8 "công cụ phải khớp lockfile"), sửa bằng
  `npm ci` rồi format lại. **Phát hiện phụ, chưa xử lý**: gate coverage của `quality`
  (branches ≥90%) đang FAIL LIÊN TỤC trên `main` qua rất nhiều commit gần đây (89.23%, thấp hơn
  ngưỡng) — không phải lỗi do PR này, là nợ kỹ thuật có sẵn ảnh hưởng mọi PR, `merge_pull_request`
  vẫn cho qua nên `quality` không phải required status check chặn merge trên branch protection
  hiện tại (khác mô tả ở CLAUDE.md mục 13 "CI check quality/e2e xanh"). Cần người dùng quyết định
  có ưu tiên vá coverage hay không.

  Sau merge, người dùng tự chạy trên VPS: `git pull origin main` → `npm ci && npm run build` →
  `pm2 delete english-tutor` → `pm2 start ecosystem.config.cjs` → `pm2 save`. Kết quả xác nhận
  **cả 3 tiến trình `dhcb` chạy `cluster`/`online`**, `english-tutor` đã biến mất khỏi `pm2 list`,
  health check `/api/health` trả `{"status":"ok"}`. Site production đã khôi phục hoàn toàn sau
  sự cố 502 (do 3 tiến trình `english-tutor` cũ bị crash-loop hết `max_restarts` trước khi đổi
  tên — nguyên nhân gốc chưa xác minh kỹ vì standalone `node dist-server/server.js` chạy hoàn
  toàn ổn không lỗi, nhiều khả năng do PM2 exec_mode/wait_ready chưa khớp cấu hình cũ, không phải
  lỗi code).

  Việc còn lại thuộc GĐ2 scale xa hơn (nếu
  cần vượt quá 3 vCPU cho mục tiêu 30k-50k concurrent) là quyết định mở rộng tiếp theo, không
  còn là nợ kỹ thuật cấp thiết.

  Cũng cần đặt `REDIS_URL` (xem mục ngay bên dưới — rate limit chuyển sang Redis) trước khi bật
  cluster mode nhiều tiến trình thật (sau khi thêm VPS ở GĐ2), không thì rate limit lỏng hơn N
  lần (N = số tiến trình).

- **Rate limit chuyển từ `Map` in-memory sang Redis khi có `REDIS_URL` (2026-07-25, Việc B
  cùng đặc tả trên).** `api/_lib/security.ts` `checkRateLimit()` giờ là async: có
  `REDIS_URL` → đếm atomic qua Lua script (INCR + PEXPIRE có điều kiện) dùng chung mọi tiến
  trình/máy; không có (hoặc Redis lỗi) → fallback `Map` in-memory y hệt hành vi cũ
  (FAIL-OPEN, không bắt buộc — dev/local không cần Redis). Đã thêm dependency `ioredis`.
  **Chưa kiểm chứng** bằng Redis thật nhiều tiến trình (sandbox không có Redis server) — cần
  xác nhận trên VPS cùng lúc với cluster mode ở trên.
- ~~**E2E `mockLogin` không còn khớp luồng đăng nhập thật**~~ **ĐÃ TRẢ XONG (PR #282,
  2026-07-20)** — `e2e/helpers/auth.ts` nay gieo đúng key Bearer token
  (`gsa_session_token_v1`) VÀ dùng `page.route()` chặn `GET /api/auth?action=me` trả profile
  giả. Dòng cũ ghi "chưa làm" đã lỗi thời (viết trước PR #282, xác nhận lại 2026-07-20 khi
  quét toàn diện nợ kỹ thuật).
- ~~**2 script deploy trùng lặp**~~ **ĐÃ GỘP (2026-07-20, người dùng xác nhận giữ
  `scripts/deploy.sh`)** — xóa hẳn `deploy.sh` gốc repo (kém đầy đủ hơn); `.github/workflows/
deploy.yml` không còn tự inline các bước, nay gọi thẳng `bash scripts/deploy.sh` (1 nguồn
  chân lý duy nhất cho cả thủ công lẫn tự động). Đã cập nhật mọi doc còn nhắc `deploy.sh` gốc
  (`docs/DEPLOY.md`, `docs/deploy-vps-ubuntu.md`, `DEPLOY_STEPS.md`, `CLAUDE.md`).
- ⚠️ **[Ý tưởng, 2026-07-30] Phòng chat cho bạn bè cùng luyện tập** — ghi "chưa làm, mới bàn sơ
  bộ" nhưng mục `packages/core-chat/redisChat.ts` + `packages/core-chat/wsHandler.ts` ở TRÊN
  trong file này mô tả WebSocket + Redis pub/sub đã code xong (route `/ws/chat`, moderation,
  presence…) — **hai đoạn mâu thuẫn nhau, cần phiên sau xác minh lại tính năng chat bạn bè đã
  triển khai tới đâu thật sự** trước khi coi đây còn là "ý tưởng chưa làm". Ràng buộc phần cứng
  cũ (VPS 1 vCPU, chưa có Redis) đã hết hiệu lực: VPS nay 3 vCPU + `REDIS_URL` đã điền
  (2026-08-21).
- Không còn hạng mục a11y/kiểm thử lớn nào mở. Xem "Tiếp theo" ở trên cho việc sản phẩm còn dở.
- `docs/research/thu-thach-vlog-30-ngay.md` dùng tên cũ "Vlog" (tính năng đã đổi tên thành
  "Challenge" — route `/challenge`, bảng `challenge_entries`) — tài liệu đó là ghi chép lịch sử
  tại thời điểm merge, cố ý giữ nguyên tên cũ, không phải lỗi.
- **Kế hoạch khôi phục sự cố server (2026-07-25).** Thêm
  `docs/ke-hoach-khoi-phuc-su-co-server.md` — quy trình ứng phó tổng thể khi server sập/gặp sự
  cố (chẩn đoán nhanh, phân loại theo triệu chứng, xử lý từng kịch bản: VPS không phản hồi, PM2
  crash, hết ổ đĩa, Postgres lỗi, restore backup, SSL hết hạn, quá tải/DDoS, nghi bị xâm nhập —
  kèm checklist xác minh + mẫu post-mortem). Khác `docs/DEPLOY.md` (deploy + fix nhanh) và
  `docs/rollback-runbook.md` (rollback cấu hình theo PR cụ thể) — 3 file bổ sung nhau, không
  trùng. Đã liệt kê "cải tiến nên cân nhắc" cần người dùng quyết định (chưa tự làm): uptime
  monitoring tự động, điền DSN Sentry, tăng tần suất backup Postgres, và điền thông tin liên hệ
  khẩn/nhà cung cấp VPS vào bảng đầu file (việc duy nhất người dùng cần tự điền tay).

- **[Audit toàn diện 2026-08-08] Tầng 1–3 đạt hết, không phát hiện lỗi mới; thêm hook
  `useMountedRef` chặn setState sau unmount ở Chat/Speaking (PR #514 → đã MERGE, commit
  `e5a371d`).** Chạy lại đầy đủ cổng: build ✅ · typecheck ✅ (4 tsconfig) · lint ✅ (0 cảnh
  báo) · format ✅ · test ✅ **162 file / 2947 test** (trước khi thêm test mới) · bundle-size ✅
  JS 96.32/123kB · CSS 10.46/11kB (brotli) · `npm audit --omit=dev` **0 lỗ hổng** (production
  deps sạch hoàn toàn). Không có secret hardcode, không `.env` bị track, không
  `dangerouslySetInnerHTML`, không `any`/`TODO` mới, 11 `console.log` còn lại đều là log khởi
  động chủ đích (`server.ts`) hoặc logger dùng chung — không phải rác. Quét kỹ thêm: 0 N+1 query
  trong `api/` (mọi vòng lặp xử lý dữ liệu đã lấy sẵn, gửi push dùng `Promise.all` đúng cách),
  0 catch rỗng nuốt lỗi, không có race double-submit ở Chat/Speaking/Writing (đã chặn đủ bằng
  `loading`/`isThrottled`/`limitHit`), data lớn (`curriculum.ts` 9059 dòng...) chỉ import
  `type`, không phình bundle.
  - **Phát hiện + đã vá:** 27 file gọi `fetch()` trực tiếp trong component nhưng chỉ 2 file dùng
    `AbortController`/kiểm tra unmount — rủi ro "setState sau unmount" khi người dùng rời trang
    giữa lúc AI đang trả lời (`callClaude`/TTS có thể mất vài giây). Đã thêm hook dùng chung
    `useMountedRef()` (`apps/english/src/lib/useMountedRef.ts` + test mount/unmount) và áp dụng
    vào 6 hàm gọi AI trong `Chat.tsx`/`Speaking.tsx` (`startSession`, `sendMessage`/
    `sendUserSpeech`, `endAndGrade`) — nơi rủi ro cao nhất. Lượt dùng/lưu phiên (side-effect
    không phụ thuộc component) vẫn chạy bình thường dù đã rời trang, chỉ bỏ qua các `setState`.
    `npm run codemap -- impact` xác nhận chỉ ảnh hưởng `App.tsx`/`main.tsx` (router-level),
    không phá tính năng khác. PR #514, đã merge (squash, `e5a371d`), CI `quality`+`e2e` xanh.
  - **Đề xuất đã bàn nhưng CHƯA làm (người dùng quyết định hoãn — rủi ro > lợi ích trong điều
    kiện sandbox này):**
    - Gộp hook dùng chung giữa `Chat.tsx`/`Speaking.tsx` (2 luồng gần giống nhau: session/
      loading/error/limitHit/evaluation/throttle) — không có sai lệch logic thật giữa 2 file,
      lợi ích chỉ là "gọn hơn". Không có test component nào cho 2 trang này, sandbox không chạy
      được dev server thật (không Postgres/`.env`) để tự smoke-test → hoãn, chỉ nên làm sau khi
      có test component bảo vệ hoặc test tay trên máy có app thật.
    - Tách nhỏ các trang >1000 dòng (`Lessons.tsx` 1537, `Practice.tsx` 1338, `Speaking.tsx`
      1207, `StudyTabs.tsx` 1972...). Đã thử soát `Lessons.tsx`: `LessonView` (dòng 451–1537,
      ~1090 dòng) không tách cơ học được — chứa hàng chục closure lồng nhau tham chiếu trực
      tiếp ~65 `useState`/`useEffect`/`useRef` của component cha, tách sai dễ gây stale-closure
      bug âm thầm mà không có test bắt được. Hoãn tương tự lý do trên.
    - Rủi ro vận hành khác đã nêu nhưng cần người dùng tự làm tay (không phải AI tự làm được):
      uptime monitoring ngoài (UptimeRobot/Better Uptime), PWA/offline (`manifest.json` + service
      worker — có đặc tả sẵn ở `docs/framework/BO-SUNG-nang-cao-i18n-PWA-Sentry-SEO.md` nhưng
      viết cho Next.js, cần điều chỉnh cho Vite), dashboard theo dõi tổng chi phí AI/tháng.

- **[Audit toàn diện 2026-08-21] Tầng 1–3+5a+6 chạy lại đầy đủ theo `docs/framework/QUY-TRINH-AUDIT.md`
  (nhánh `claude/quet-sau-toan-dien-du-an-a3fnv5`), phát hiện 2 vấn đề mới phát sinh cùng đợt thêm bộ
  "10 SOTA Agent Super Skills" (mục 2.1 CLAUDE.md) — cả hai đã VÁ trong cùng PR này, không chờ PR riêng.**
  - **Phát hiện 1 — CORS mở quá rộng:** 18 endpoint REST mới
    (`api/agent-orchestrator.ts`, `avatar-embodiment.ts`, `life-synthesis.ts`, `memory-palace.ts`,
    `debate-arena.ts`, `pvp-arena.ts`, `daily-quests.ts`, `referral-vip.ts`, `mesh-telemetry.ts`,
    `stem-scratchpad.ts`, `action-canvas.ts`, `metacognitive-reflection.ts`, `neural-curriculum.ts`,
    `co-learning-audio.ts`, `gemini-live.ts`, `realtime-multimodal.ts`, `acoustic-phonetics.ts`,
    `proactive-agent.ts`) set cứng `Access-Control-Allow-Origin: '*'` ở OPTIONS preflight, khác thiết
    kế same-origin của các endpoint cũ (whitelist `getCorsHeaders()` trong
    `packages/core-auth/security.ts`, đọc `ALLOWED_ORIGINS`). **Đã sửa:** đổi cả 18 file sang dùng
    `getCorsHeaders(req)` thay vì khối `'*'` tự viết tay — hành vi giữ nguyên với origin hợp lệ, nhưng
    origin lạ giờ bị chặn đúng theo whitelist thay vì luôn được chấp nhận. Cập nhật kèm 3 file test có
    `vi.mock('../packages/core-auth/security.js', ...)` toàn module (thiếu export `getCorsHeaders`,
    gây lỗi mock khi thêm test OPTIONS).
  - **Phát hiện 2 — Coverage branches tụt dưới sàn:** đo được branches 89.23% (tụt từ mốc đặt ngưỡng
    90.32%, dưới sàn 90% ở `vitest.config.ts`) — các service/handler mới của bộ 10 Super Skills thiếu
    test ca biên (OPTIONS, method không hỗ trợ, thiếu field bắt buộc, action không hợp lệ, JSON hỏng,
    404/400 theo nhánh nghiệp vụ). **Đã sửa:** viết thêm ~70 test ca biên cho 10 file
    (`referral-vip`, `agent-orchestrator`, `acoustic-phonetics`, `pvp-arena`, `admin-feedback`,
    `avatar-embodiment`, `gemini-live`, `realtime-multimodal`, `action-canvas`, `life-synthesis`,
    `daily-quests` — không đổi code nghiệp vụ, chỉ thêm test) → branches về **90.02%** (statements
    94.07% · functions 97.15% · lines 94.07%), qua ngưỡng `npm run test:coverage`.
  - Chạy lại toàn bộ cổng sau khi vá: build ✅ · typecheck ✅ (4 tsconfig) · lint ✅ (0 cảnh báo) ·
    format ✅ · test ✅ **417 file / 5018 test** · size ✅ (JS 120.58/123 kB · CSS 15.62/16 kB brotli) ·
    `npm audit --omit=dev` 0 lỗ hổng · 0 secret hardcode · `.env` không bị track · 0 `console.log` rác ·
    0 `TODO`/`any` mới. Git: `origin/main`...HEAD 0 ahead/0 behind lúc audit.
  - **Còn để ngỏ (chưa làm, ghi nhận để phiên sau xử lý nếu cần):** mâu thuẫn nội bộ PROGRESS.md về
    tính năng "phòng chat bạn bè" (một đoạn ghi "chưa làm", đoạn khác mô tả code đã xong ở
    `packages/core-chat/`) — cần audit luồng riêng (mục 5 quy trình audit) để xác minh, không thuộc
    phạm vi đợt này. E2E+a11y và audit luồng dữ liệu sâu (Tầng 5c, Tầng 8–9) chưa chạy lượt này.
  - **[Cập nhật cùng ngày] CI e2e (PR #616) đỏ, xác nhận đỏ Y HỆT trên `main`** (job e2e của cả
    2 nhánh đều "230 passed" + đúng cùng 4 test fail, không phải do PR gây ra) — **đã vá 2/4** vì
    là test lỗi thời theo sau thay đổi sản phẩm thật, không phải bug:
    - `e2e/bottomnav.spec.ts` — tab "Tiến độ" đã bị thay bằng tab "Đồng Hành" (AI companion,
      `/dong-hanh`) ở `BottomNav.tsx` (Platform V7.0), test cũ chưa cập nhật theo. Đã sửa assertion
      sang `/Đồng Hành/`. Trang `/tien-do` vẫn tồn tại (vào qua Cá nhân/Dashboard), chỉ không còn
      là tab riêng.
    - `e2e/admin.spec.ts` (3 test Analytics feedback) — `AdminFeedbackPanel.tsx` giờ có 2 tab con
      "Ý Kiến Người Dùng" (mặc định) và "Đánh Giá Gia Sư AI 👎" (thêm sau PR feedback người dùng,
      `feat(feedback): implement full user feedback & suggestion system`) — nội dung phản hồi gia
      sư AI (`userInput`, dropdown nguồn, tiêu đề "Phản Hồi 👎...") chỉ hiện sau khi bấm sang tab
      con thứ 2. Đã thêm bước click tab trước khi assert. Cả 2 file đã chạy pass cục bộ
      (Playwright Chromium).
  - **[Cùng ngày, tiếp] Đã vá NỐT toàn bộ 68 vi phạm a11y `color-contrast` còn lại** (không dừng ở
    2/4 ban đầu — người dùng yêu cầu xử lý hết). Gốc rễ: nhiều nơi dùng thẳng màu pastel Tailwind
    (`text-emerald-300`, `text-sky-300`, `text-blue-300`, `text-purple-300`, `text-cyan-300`,
    `text-red-300`...) — vốn chỉ đọc tốt trên nền tối — mà THIẾU biến thể `theme-light:` (quy ước
    đã có sẵn ở nhiều nơi khác, `tailwind.config.js` định nghĩa variant `theme-light:` = áp cho
    3 theme nền sáng blue-sky/pink/kid) nên rớt AA trên 3 theme đó. 2 lỗi có tính LAN RỘNG (xuất
    hiện ở gần như MỌI trang vì nằm trong component dùng chung):
    - Nút "Đồng Hành AI" toàn cục trong `Layout.tsx` (header mọi trang) — `text-accent-300` thiếu
      `theme-light:text-accent-800`.
    - `PageHeader.tsx` (subtitle mọi trang có tiêu đề) — có bug NGƯỢC: ai đó thêm
      `theme-light:text-zinc-600` tưởng số càng cao càng đậm (quy ước Tailwind chuẩn), nhưng hệ
      thống token `--z-*` của dự án ĐẢO CHIỀU thang màu cho theme nền sáng (xem
      `packages/core-ui/theme.css` — z-50 đậm nhất/z-950 nhạt nhất ở theme sáng, ngược hẳn theme
      tối) nên `z-600` ở blue-sky lại NHẠT HƠN z-400 mặc định — ghi đè lên đúng giá trị đã đúng sẵn.
      Đã bỏ hẳn override sai (base `text-zinc-400` tự đúng theo theme nhờ CSS var). Cùng bug lặp lại
      ở `Landing.tsx`, `LandingEn.tsx`, `WordDetail.tsx` (`theme-light:text-zinc-600/700`) — đã sửa
      luôn dù 3 trang này chưa có trong `e2e/a11y.spec.ts`, để tránh tái phát khi được thêm vào quét.
    - Còn lại: `Home.tsx` (9 chỗ), `HomeUniversalAiBar.tsx` (6 chỗ badge gợi ý câu hỏi AI),
      `Writing.tsx` (lỗi/sửa lỗi ngữ pháp trong màn chấm bài), `EdgeAiIndicator.tsx` (badge chế độ
      WASM/WebGPU) — mỗi chỗ thêm đúng 1 class `theme-light:text-*-800` (hoặc `-700` cho đỏ, khớp
      quy ước đã dùng ở `CefrLessonViews.tsx`), không đổi cấu trúc/hành vi, chỉ đổi màu chữ ở
      3 theme sáng.
    - **Xác minh:** `e2e/a11y.spec.ts` 122/122 pass · `e2e/a11y-aaa.spec.ts` 75/75 pass · toàn bộ
      `npm run test:e2e` 305/305 pass · `npm test` 417 file/5018 test · build/size/typecheck/
      lint/format đều xanh. Không đổi hành vi nghiệp vụ, chỉ đổi màu chữ ở theme sáng.
    - **`e2e/v2-hubs.spec.ts`** — 1 lỗi KHÁC phát sinh khi CI chạy lại (không có trong danh sách
      fail của `main`, không liên quan CORS/coverage/a11y): `getByText('Bạn Đồng Hành AI')` khớp 2
      phần tử (tiêu đề thẻ AI companion trên Home + mô tả nhiệm vụ hàng ngày "...cùng Bạn Đồng Hành
      AI..." của `DailyQuestsCard`, cả hai đã có sẵn từ commit `f67bbcf`, chỉ là test dùng
      `getByText` không đủ cụ thể + phụ thuộc thời điểm phản hồi `/api/daily-quests` không mock
      trong test này). Đã sửa locator sang `getByRole('heading', { name: /Bạn Đồng Hành AI/ })` cho
      rõ ràng, không đổi sản phẩm.

- 🟢 **[ĐÓNG 2026-09-03, cùng ngày mở — PR #842 sửa phần có hại, người dùng chốt phần còn lại]
  Màu Tailwind
  cố định dùng khắp app; phần THẬT SỰ hỏng đã sửa xong, phần còn lại là quyết định thiết kế.**
  Đo đủ 21 họ màu (không chỉ 4 họ như lần trước): **~4.141 lần** dùng màu Tailwind gốc trong
  `apps/` — nhiều nhất là `amber` 763 · `emerald` 700 · `rose` 480 · `sky` 328 · `indigo` 277.
  Nên "423" chỉ là một lát cắt, và việc token hoá 4 họ màu như dự tính ban đầu sẽ là **tuỳ tiện**
  (vì sao token hoá `purple` mà không token hoá `amber`?).
  **Phần có hại đã ĐÓNG (2026-09-03):** 720 chỗ màu chữ rớt tương phản AA ở 3 theme nền sáng đã
  vá xong + có cổng chặn `scripts/fixed-color-contrast-audit.test.ts` — xem
  `docs/changelog/0259-*.md`.
  **Phần từng để ngỏ nay ĐÃ CHỐT (giữ nguyên, không token hoá — xem mục "Quyết định quan trọng"
  trong `PROGRESS.md`):** có nên đổi hẳn các
  họ màu này sang token vai trò (`--info-*`, `--warn-*`…) để chúng đổi theo theme, hay giữ màu
  cố định + biến thể `theme-light:` như hiện nay? Giữ nguyên thì rẻ và đã an toàn về tương phản;
  đổi thì nhất quán hơn nhưng chạm >4.000 chỗ và có rủi ro thị giác thật. **Đề xuất: giữ nguyên.**

- 🟢 **[ĐÓNG 2026-09-03, cùng ngày mở] Cổng a11y đã chờ theo TRẠNG THÁI, không theo thời gian.**
  Mở buổi sáng khi chữa CI đỏ PR #826, đóng ngay trong ngày — xem
  `docs/changelog/0245-2026-09-03-cong-a11y-cho-theo-trang-thai.md`.
  Vấn đề: hai file cổng gọi `waitForTimeout(1000)` rồi mới quét, nên trên máy chậm/nguội axe
  soi một trang chưa render xong và báo "0 vi phạm" — xanh giả. Đo thật: TRANG CHỦ lúc quét
  mới có 268/478 phần tử, trong đó **21/55 phần tử tương tác** (38%) và 39/94 phần tử chữ.
  Đã thay bằng `waitForStableDom` (`e2e/helpers/axe.ts`) + test canh gác
  `scripts/a11y-gate-policy.test.ts` chặn quay lại lối chờ cứng.
  **Quét lại toàn bộ với cách chờ mới: 392/392 xanh — KHÔNG có vi phạm nào bị che.** Dự đoán
  ban đầu ("rất có thể lòi ra vi phạm") là SAI; ghi lại để không ai đi tìm lỗi không tồn tại.
  Chi phí thời gian: bằng nhau (1,2 phút cho 49 test, cả hai bản).

- 🟢 **[ĐÓNG 2026-08-28] Giao diện coi người dùng là khách khi mở subdomain khác.**
  **Đính chính mô tả ban đầu của mục này:** nó viết "`validateAuth` chấp nhận cookie khi thiếu
  Bearer" — SAI. Từ Bước 6 (`docs/adr/0002-quan-ly-nguoi-dung.md`), `validateAuth` **chỉ** đọc
  cookie `session_token` và **bỏ qua hoàn toàn** header `Authorization`. Đo trực tiếp trên
  server đã build với DB thật: cùng một phiên, gọi `/api/auth?action=me` chỉ với cookie → 200,
  chỉ với Bearer → 401. Nghĩa là API trên subdomain mới **vốn đã xác thực được** nhờ cookie
  `Domain=.donghanhcungban.org`.
  Chỗ thật sự hỏng nằm ở CLIENT: app dùng "có token trong `localStorage` không" làm cờ
  đã-đăng-nhập, mà `localStorage` cô lập theo origin — `getCurrentUser()` thoát sớm, và
  `cloud.ts`/`challengeCloud.ts`/`tutorFeedback.ts` lặng lẽ bỏ qua đồng bộ. Đã vá bằng action
  `session-from-cookie`: nạp lại cờ đó đúng một lần lúc khởi động.

- 🟢 **[2026-08-26 — ĐÃ GỠ, kiểm chứng bằng bài thử] Rate limit từng bị né hoàn toàn bằng
  header `X-Forwarded-For` giả; nay đã bịt cả hai tầng.**

  **Trước khi vá** — 40 request vào `/api/app-settings` (giới hạn 30/phút) với IP giả ngẫu
  nhiên mỗi lần: **40 lần `200`, không một `429`**. Nguyên nhân: nginx dùng
  `$proxy_add_x_forwarded_for` (NỐI ip thật vào CUỐI) trong khi `getClientIp()` đọc phần tử
  ĐẦU — tức giá trị client tự khai.

  **Sau khi vá** — chạy lại đúng hai bài thử ở `docs/cloudflare-setup.md`:

  | Bài thử                           | Kết quả                            | Đọc thế nào                                                                                                        |
  | --------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
  | A — IP giả **ngẫu nhiên** mỗi lần | **30 × `200`, rồi 10 × `429`**     | Khớp CHÍNH XÁC giới hạn 30/phút ⇒ đếm theo IP thật, header giả vô tác dụng                                         |
  | B — IP giả **cố định**            | **40 × `429`** ngay từ request đầu | Chạy từ cùng máy với A nên cùng IP thật; quota đã bị A dùng hết ⇒ hai bài dùng CHUNG một bộ đếm, đúng như phải thế |

  Bài B trả `429` ngay từ đầu thoạt nhìn có vẻ lạ, nhưng đó mới là bằng chứng mạnh nhất: nếu
  rate limit còn tin header giả thì B đã có bộ đếm riêng và trả `200`.

  **Hai tầng đã áp:** (1) `getClientIp()` đọc `CF-Connecting-IP` → `X-Real-IP` → XFF phần tử
  CUỐI (PR #701, 7 test chặn hồi quy trong `packages/core-http/http.test.ts`); (2) nginx
  `cloudflare-realip.conf` chỉ nhận header từ đúng dải IP Cloudflare — người dùng đã áp lên VPS
  cùng ngày.

  **Bài học ghi lại:** lỗ hổng sống sót qua nhiều lần rà soát vì cách kiểm chứng cũ hỏi sai
  câu — _"IP hiển thị có đúng không?"_ (nhìn log là trả lời được) thay vì _"IP có ghi đè được
  không?"_ (chỉ trả lời được bằng cách tự tấn công mình). Tài liệu đã đổi sang câu thứ hai.

- 🟢 **[2026-08-26 — ĐÃ GỠ] VPS production đã có swap 6 GB.** `scripts/setup-swap.sh` chạy
  thật trên máy: `free -h` nay báo `Swap: 6.0Gi · used 0B` (dùng 0B là đúng —
  `vm.swappiness=10` nên kernel chỉ chạm swap khi RAM thật sự cạn). Đĩa còn 22 GB trước khi
  tạo nên không sát đáy. Ghi lại bối cảnh gốc: Số đo người dùng gửi từ VPS hôm nay:

  ```
  free -h  →  total 2.9Gi · used 1.1Gi · available 1.8Gi · Swap 0B
  pm2 list →  3 instance dhcb: 218,7 + 217,6 + 231,1 MB · pm2-logrotate 57,5 MB
  ```

  Lúc rảnh dư dả (dùng ~40% RAM). Chỗ nguy hiểm là **lúc deploy**: `scripts/deploy.sh` chạy
  `npm ci` + `npm run build` ngay trên máy đang phục vụ, Vite + `tsc -b` 16 workspace ngốn thêm
  1–1,5 GB ở đỉnh — chạm trần 2,9 GB. Không swap thì kernel gọi OOM killer, mà OOM killer
  **không chọn tiến trình đáng chết**: nó có thể giết PostgreSQL giữa lúc deploy.

  **Điều kiện gỡ nợ:** trên VPS chạy `sudo bash scripts/setup-swap.sh 6G` rồi xác nhận
  `free -h` thấy dòng Swap khác `0B`. Xem `docs/deploy-vps-ubuntu.md` Bước 3a.

  **Hai thứ nữa phát hiện cùng lúc, chưa vá (đề xuất, chờ người dùng chốt):**
  1. `ecosystem.config.cjs` **thiếu `max_memory_restart`** — instance rò rỉ bộ nhớ thì PM2
     không tự khởi động lại, để mặc kernel giết bừa. Đề xuất `'400M'` (mỗi instance đang dùng
     ~220 MB, nên 400 MB là ngưỡng bất thường rõ ràng chứ không phải mức bình thường).
  2. `PG_POOL_MAX` mặc định **10 mỗi tiến trình × 3 instance = 30 kết nối** Postgres thật.
     Chưa vỡ (`max_connections` mặc định 100) nhưng thừa; đề xuất đặt `PG_POOL_MAX=5`.

  **↺ 64 — ĐÃ KẾT LUẬN, không phải crash.** Đọc `pm2 logs dhcb --err --lines 200`: 200 dòng
  log lỗi gần nhất KHÔNG có một stack trace crash nào, không có tiến trình thoát bất thường.
  Toàn bộ là cảnh báo Redis rớt (mục trên) và 2 lỗi TTS Gemini có xử lý sẵn. Vậy 64 là cộng
  dồn qua các lần `pm2 reload` khi deploy — bình thường.

- 🟢 **[2026-08-25 → ĐÃ GỠ 2026-08-26] `nginx/en-vi.conf` nay ĐÃ áp lên VPS thật** (làm cùng lúc với việc áp `cloudflare-realip.conf` để bịt lỗ hổng rate limit — xác nhận bằng bài thử A/B ở mục trên). Ghi lại bối cảnh gốc: Audit
  2026-08-25 (F5) phát hiện bản `Content-Security-Policy-Report-Only` trong nginx còn whitelist
  `*.supabase.co` dù dự án rời Supabase từ 2026-07-20, lại thiếu facebook/apple/microsoft,
  `media-src blob:` và `frame-src accounts.google.com` so với CSP thật — nên nó chỉ sinh báo cáo
  vi phạm GIẢ. Đã xoá hẳn ở PR #664 (giữ đúng MỘT nguồn CSP là Express).

  **Điều kiện gỡ nợ:** copy file lên VPS rồi:

  ```bash
  sudo nginx -t && sudo systemctl reload nginx
  ```

  **Vì sao chưa gỡ được từ đây:** repo chỉ chứa BẢN SAO cấu hình; file thi hành thật nằm trên
  server. Sửa trong repo mà quên áp = tài liệu nói một đằng, server chạy một nẻo — đúng loại
  lệch mà Tầng 6b của quy trình audit sinh ra để bắt.

- 🟢 **[2026-08-26 — ĐÃ GỠ] Baseline eval gia sư ĐÃ CÓ SỐ THẬT, chất lượng sư phạm không tụt.**
  Chạy trên VPS với key thật: **62/62 câu chấm được**, recall 97,7% · precision 97,7% ·
  FP-rate 5,6% · specificity 94,4% · Feedback VI 100% · Type-hit 76,7%. 9/11 nhóm lỗi đạt
  tuyệt đối; chỉ bỏ sót `adj-02` (trật tự tính từ). Số liệu ở
  `docs/research/eval-tutor-baseline.md`.

  **Đính chính một điều mục nợ này từng ghi sai:** nó viết "baseline vẫn là bản 2026-08-21".
  Không đúng — `git log -- docs/research/eval-tutor-baseline.md` cho ĐÚNG MỘT commit trong
  toàn bộ lịch sử (PR #625), và nội dung là bản mẫu rỗng ghi rõ "⏳ CHƯA CÓ SỐ LIỆU BASELINE".
  Tức **chưa từng có baseline số nào, ở bất kỳ ngày nào**, và luật ở `CLAUDE.md` mục 8 ("PR
  sửa prompt/model phải dán bảng so sánh, recall/precision không được tụt") **chưa bao giờ thi
  hành được** vì không có mốc để so. Lần chạy 2026-08-26 là baseline ĐẦU TIÊN, không phải một
  lần so sánh. Bài học: một mục nợ khẳng định "bản ngày X" mà không ai mở file ra xem thì nó
  chỉ là tin đồn được chép lại — kiểm bằng `git log` trước khi chép.

  **Đo đúng đường production.** `chatFallback.ts` gọi theo thứ tự Groq → Anthropic → Gemini,
  và script eval cũng ưu tiên Groq trước, nên số trên là chất lượng của **provider chính** mà
  người dùng thật đang gặp. Gemini (`gemini-3.6-flash`) là lớp dự phòng thứ ba — health-check
  07:00 ngày 26/8 xác nhận nó gọi được (512ms), nhưng chất lượng sư phạm của riêng nhánh đó
  vẫn chưa đo; chạy `npm run eval:tutor` trên máy KHÔNG có `GROQ_API_KEY`/`ANTHROPIC_API_KEY`
  thì script sẽ rơi xuống Gemini và đo được. Hai tính năng vision
  (`visionSolverService.ts`, `ambientVisionService.ts`) dùng chung model đó, cũng chưa thử tay.

  **Ba việc phải làm để chạy được, ghi lại vì đều là bẫy thật:**
  1. Script đọc `process.env.GROQ_API_KEY` nguyên chuỗi làm Bearer token, trong khi production
     đi qua `groqKeyPool()` tách nhiều key theo dấu phẩy → 62/62 lỗi `401` và một báo động sự
     cố production hoàn toàn không có thật. Đã vá.
  2. Báo lỗi chỉ giữ `lastErr` nên `429` của khoá đang sống bị `401` của khoá hỏng che mất →
     chẩn đoán sai thêm hai vòng. Nay in trạng thái TỪNG khoá: `[#1→429 #2→429]`. Đã vá.
  3. Một khoá trong `.env` hỏng vật lý — dài 50 ký tự thay vì 56, kết thúc bằng ký tự `>`, sai
     định dạng `gsk_[A-Za-z0-9]+`. Bị cắt cụt lúc ghi file, không phải bị thu hồi. Đã thay.

  Groq tính hạn mức theo **TÀI KHOẢN chứ không theo khoá**, nên gộp nhiều khoá cùng một tài
  khoản vào bể KHÔNG tăng quota — chỉ có giá trị dự phòng khi một khoá bị thu hồi. Đúng cho cả
  production. Chạy eval cần `--delay 3000` (62 câu ≈ 3–4 phút); `--delay 500` mặc định làm tắc
  từ câu 22.

- 🟢 **[2026-08-21] Đã vá 15 test e2e đỏ trên `main`** (phát hiện khi driving PR #617 tới green —
  commit `fd188ef` "restructure platform hub and dedicated english studio routing" đổi route "/"
  từ `EnglishHome` sang `Home` (platform hub mới) và dời `EnglishHome` sang `/hoc-tieng-anh`, kéo
  theo 2 loại lỗi:
  1. **5 test sai route** (`e2e/a11y.spec.ts` "Home — gợi ý luyện nói..." × 5 theme,
     `e2e/comeback.spec.ts` × 2, `e2e/bottomnav.spec.ts` × 1 — nhãn tab đổi "Lộ trình" →
     "Học Tiếng Anh"): sửa test trỏ đúng `/hoc-tieng-anh` thay vì `/` cho nội dung đã dời, và
     cập nhật locator theo nhãn mới.
  2. **9 lỗi a11y `color-contrast` thật** trên `Home.tsx` (platform hub mới) và `EnglishHome.tsx`
     — 2 dạng bug lặp lại từ đợt vá PR #616 trước: (a) pill/nút dùng thẳng `text-emerald/blue/
purple/orange/amber/sky-300` thiếu biến thể `theme-light:text-*-800` nên nhạt trên 3 theme
     sáng; (b) nút nền `bg-accent-500`/`bg-emerald-500` dùng `text-zinc-950` — token `--z-950`
     BỊ ĐẢO CHIỀU ở theme sáng (nhạt nhất thay vì đậm nhất, xem PROGRESS.md đợt vá PR #616) nên
     chữ gần trắng trên nền sáng → sửa bằng màu cố định `text-[#09090b]` (không qua token z-\*,
     đã tính contrast ≥ 5.9:1 trên cả 5 theme accent màu khác nhau) thay vì `text-zinc-950`.
     Xác nhận: `npx playwright test e2e/a11y.spec.ts e2e/bottomnav.spec.ts e2e/comeback.spec.ts`
     134/134 pass cục bộ; build/typecheck/lint/format/`npm test` (5019/5019) đều xanh.

- 🟢 **[ĐÃ TRẢ 2026-09-15, PR S10-1 — `docs/changelog/0332-*.md`] 6 lỗi lifecycle voice/AI
  (khảo sát S10, spec `docs/specs/2026-09-15-learning-ux-s10-tro-giang-trong-bai-voice.md`
  §2.1 + §④ Phần 1 AC-1…AC-6).** Sáu lỗi "rời trang rồi mà thứ cũ vẫn chạy": (L1) rời trang
  Companion giữa lúc AI đang nói bằng giọng → AI cất tiếng ở trang kế; (L2) stream SSE không
  huỷ được, callback vẫn bắn sau khi rời trang; (L3) StrictMode gọi `fetchProactiveAgentState`
  hai lượt, lượt cũ setState sau unmount; (L4) `tts.ts` chốt `playToken` **sau** await nên
  `stopSpeaking()` gọi lúc đang tải không ngăn được audio nổ ở trang kế; (L5) `MediaRecorder`
  constructor ném lỗi → mic không bao giờ được nhả; (L6) `AiHelpPanel` rò state/response trễ
  giữa hai bài học (component không remount khi đổi `lessonId`). Sửa: `Companion.tsx` cleanup
  đặt cờ huỷ + abort; `companionApi.ts`/`proactiveAgentApi.ts` nhận `AbortSignal`; `tts.ts` chốt
  vé trước await; `sttServer.ts` bọc try/catch quanh constructor, release track trước khi ném
  lại; `AiHelpPanel.tsx` + `key={lesson.id}` ở `ProgrammingLessonPage.tsx`. 8 ca test đỏ-trước/
  xanh-sau (bảng đầy đủ ở changelog `0332`), không đổi giao diện/API công khai/schema. Xác nhận
  lại 2026-09-21 (khảo sát nợ kỹ thuật định kỳ): 5 file test liên quan / 98 ca vẫn xanh trên
  `main`, không regression — `npx vitest run apps/dhcb/src/pages/companion
apps/dhcb/src/lib/companionApi.test.ts apps/dhcb/src/lib/tts.test.ts
apps/dhcb/src/lib/sttServer.test.ts apps/dhcb/src/components/programming/AiHelpPanel.test.tsx`.

- 🟢 **[ĐÃ TRẢ 2026-08-24 — xem mục "Giai đoạn hiện tại"]** Nâng lại plugin lên `7.1.1` + sửa
  đúng bản chất 95 lỗi (danh sách 73 lỗi cũ đã phình theo code mới), 0 eslint-disable mới.
  Ghi chú gốc giữ lại bên dưới để tra cứu:
