# 0342 — 2026-09-16 — S05-2: một nguồn danh mục môn cho hub và app

- **PR:** [#953](https://github.com/seeker19110/dhcb/pull/953)
- **Spec:** `docs/specs/2026-09-15-learning-ux-s05-bat-dau-theo-y-dinh.md` §9 mục 2 (AC-15 → AC-20)
- **Trạng thái đặc tả:** Approved for implementation (chủ dự án chốt 2026-09-15)

## Việc đã làm

1. **`packages/core-learner/subjectEntry.ts`** (mới) — export `SUBJECT_ENTRIES: readonly
SubjectEntry[]`, suy trực tiếp từ `SUPPORTED_SUBJECTS` (giữ nguyên id/nhãn/thứ tự của
   registry: english · mathematics · physics · chemistry · biology · programming), cộng
   `ctaPath` (dùng lại `subjectHomePath` đã có ở `subjectHome.ts`) và `status`
   (`'live' | 'preview' | 'building'`). Q5: english/programming `'live'`, 4 môn STEM `'preview'`
   (đã có hàng trăm bài `draft` phục vụ thật ở `/goc-hoc-tap/<id>/bai-hoc`, không còn `'building'`
   như hub từng ghi). Test `subjectEntry.test.ts`: id/thứ tự/label khớp registry 1-1, mọi
   `ctaPath` là route có thật trong `App.tsx` (đọc file, đối chiếu route tĩnh + mẫu tham số
   `/goc-hoc-tap/:subjectId`).
2. **`scripts/gen-subject-catalog.ts`** (mới, khuôn `gen-lesson-index.ts`) sinh
   `apps/hub/src/subjectsCatalog.generated.ts` từ `SUBJECT_ENTRIES` — dữ liệu THUẦN (không
   React/icon). Script mới: `npm run gen:subject-catalog`. Test tươi
   `scripts/gen-subject-catalog.test.ts` canh file sinh không lệch nguồn (khuôn
   `lessonsLazy.test.ts`) — đã tự kiểm bằng cách tạm xoá include vitest cho hub rồi thấy test hub
   KHÔNG chạy (AC-17), thêm lại thì chạy và xanh.
3. **`apps/hub/src/App.tsx`** — `SUBJECTS` nay ghép từ `SUBJECT_CATALOG` (file sinh, đọc
   `id/nhãn/thứ tự/ctaPath/status`) với `SUBJECT_COPY` (văn bản tiếp thị — tagline/description/
   highlight/skills/emoji/icon — GIỮ Ở HUB, không đưa vào gói dùng chung, đúng phạm vi "KHÔNG
   LÀM" của spec). Thêm nút phụ "Bắt đầu với `<môn>`" → `${APP_URL}/bat-dau?mon=<id>` cho mọi môn
   `'live'`/`'preview'` (AC-18); môn `'building'` không có nút nào. 5 chỗ `START_URL` giữ nguyên
   `${APP_URL}/bat-dau`.
4. **`vitest.config.ts`** — thêm `'apps/hub/src/**/*.test.{ts,tsx}'` vào `include` (AC-17): trước
   PR này, `apps/hub` có 0 file test nào từng chạy trong CI dù viết ra. Chứng minh bằng cách tạm
   bỏ dòng include, chạy `apps/hub/src/subjectsCatalog.test.ts` → "No test files found, exiting
   with code 1"; thêm lại → 6/6 test xanh.
5. **`apps/hub/src/subjectsCatalog.test.ts`** (mới — test THẬT ĐẦU TIÊN của `apps/hub`): id duy
   nhất, `ctaUrl` ghép luôn bắt đầu bằng `APP_URL` và không còn `/hoc-tieng-anh`, `START_URL` kết
   thúc `/bat-dau`, hub không import gói `@dhcb/*` nào (quét `App.tsx`/`main.tsx`/`HubLogin.tsx`),
   `Object.keys(SUBJECT_COPY)` khớp đúng tập id của `SUBJECT_CATALOG` (AC-16).
6. **`scripts/hub-links.test.ts`** — cập nhật theo cách hub ghép CTA mới (từ `entry.ctaPath` thay
   vì chuỗi viết tay từng môn); vẫn canh hub không còn `/hoc-tieng-anh`.
7. **`apps/dhcb/src/pages/core/Home.tsx`** (AC-19) — khối "Bộ môn & không gian": phần MÔN HỌC đổi
   từ 2 dòng viết tay (Tiếng Anh riêng, 4 môn STEM gộp "Toán, Lý, Hóa, Sinh" một dòng, môn Lập
   trình KHÔNG xuất hiện) sang render từ `SUBJECT_ENTRIES` — đủ 6 thẻ, đúng nhãn/thứ tự/`ctaPath`
   của registry. Icon/mô tả ngắn/lối tắt là phần trình bày riêng của app (`SUBJECT_ICON`/
   `SUBJECT_DESC`/`SUBJECT_SHORTCUTS`), không thuộc nguồn chung. Thẻ "Sự nghiệp, Khởi nghiệp & Đời
   sống" giữ nguyên. Test mới `Home.test.tsx` (mock auth khách + tài khoản, mock các khối AI/banner
   nặng): số thẻ môn = `SUBJECT_ENTRIES.length` (6), nhãn khớp, đúng thứ tự; khách cũng thấy đủ.
   Cập nhật `Home.design.test.ts` (test có sẵn) theo thiết kế mới.

## Quyết định tự chọn (đặc tả không nói rõ 100%, ghi lý do)

- **Thứ tự `SUBJECT_ENTRIES` theo `SUPPORTED_SUBJECTS` THẬT** (english · mathematics · physics ·
  chemistry · biology · programming), KHÔNG theo thứ tự liệt kê bằng chữ ở §③.6 của spec (english
  · programming · mathematics · …) — vì AC-15 tự nói tiêu chí đo được là "khớp registry 1-1" và
  `navTree.ts`/`navTree.test.ts` (S07) đã dùng đúng thứ tự registry cho "Góc học tập". Giữ MỘT thứ
  tự nhất quán toàn hệ thống quan trọng hơn khớp câu chữ minh hoạ trong spec.
- **AC-18 áp cho CẢ hai trạng thái `'live'` và `'preview'`** (đúng câu spec "status:'live'|
  'preview' có thêm nút phụ"): môn `'live'` giữ nút chính "Vào học" + thêm nút phụ "Bắt đầu với
  `<môn>"`; môn `'preview'` chỉ có nút "Bắt đầu với `<môn>`" (không có nút "Vào học" độc lập, vì
  hub chưa viết mô tả CTA riêng cho nội dung xem-trước).
- **AC-19 thay đổi UX thật** (không chỉ đổi nguồn dữ liệu giữ nguyên hình dạng): trước đây STEM
  gộp 1 dòng + Lập trình vắng mặt hoàn toàn khỏi Home; nay đủ 6 dòng theo `SUBJECT_ENTRIES`. Đây
  là hệ quả trực tiếp của "render từ SUBJECT_ENTRIES" — không thể vừa dùng đúng một nguồn 6 mục
  vừa giữ hình dạng cũ 2 dòng.
- **Ảnh Tầng 8b (hub, 1440/390/320px, trạng thái `english` (`live`) và `physics` (`preview`)) đã
  chụp thật** bằng Chromium có sẵn trong môi trường (`/opt/pw-browsers/chromium`), build
  `npm run build --workspace=@dhcb/hub` + phục vụ tĩnh cục bộ. Nhìn tay xác nhận: 6 tab đúng
  nhãn/thứ tự, badge "Học được"/"Xem trước được" đúng theo `status`, panel Vật lý có nút phụ
  "Bắt đầu với Vật lý" + dòng "Bài đang hoàn thiện dần…", không tràn ngang ở 320px, vùng chạm các
  nút đủ lớn ở mobile. Không phát hiện lỗi lặp/nội dung trùng.

## Bằng chứng

```
npm run typecheck   # 0 lỗi (4 project: apps/dhcb, tsconfig.api, tsconfig.e2e, apps/hub) — chạy lại
                     # sau rm -rf packages/*/dist dist dist-server và sau khi gộp origin/main
npm run lint        # 0 cảnh báo
npm run format      # không đổi gì (đã format sẵn)
npm run build --workspace=@dhcb/hub   # 0 lỗi, dist/ sinh ra
npm run test:coverage   # 13017-13018 test xanh; 1 ca timing hiệu năng flaky KHÔNG liên quan
                         # slice này: authService "hashPassword/verifyPassword so khớp SAI mật
                         # khẩu" — xanh khi chạy riêng lẻ, ghi lại cho coordinator, KHÔNG sửa ở
                         # PR này. (Ca cefrOutline "dựng dưới 16ms" đã được thay bằng phép đếm số
                         # lượt tra cứu ở #944 trên main — hết flaky sau khi gộp.)
```
