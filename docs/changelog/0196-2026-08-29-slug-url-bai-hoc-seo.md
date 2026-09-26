# 0196 — URL bài học có chuỗi mô tả (slug SEO)

**Ngày:** 2026-08-29
**PR:** [#736](https://github.com/seeker19110/dhcb/pull/736)

## Việc đã làm

URL của Truyện song ngữ và Bài học lập trình trước đây chỉ có id ngắn, không nói lên nội dung
gì (vd `/lap-trinh/bai-hoc/p1-u1-l1`, `/truyen-song-ngu/ft-emperor-clothes`) — vừa khó đọc vừa
không giúp Google hiểu trang nói về gì, giảm cơ hội được tìm thấy qua tìm kiếm (SEO), theo yêu
cầu tăng lượng truy cập ứng dụng.

Đã thêm phần mô tả lấy từ tiêu đề bài học vào cuối URL, theo mẫu Youtube/Medium (id đứng đầu,
slug mô tả chỉ để đọc/SEO, không bắt buộc khớp tuyệt đối):

- `/lap-trinh/bai-hoc/p1-u1-l1--chuong-trinh-dau-tien-may-tinh-lam-gi-va-lenh-print`
- `/truyen-song-ngu/ft-emperor-clothes--bo-quan-ao-moi-cua-hoang-de`

**Thiết kế:**

- `packages/core-ui/slug.ts` — hàm `slugify()` (bỏ dấu tiếng Việt, hạ chữ thường), `buildSlugSegment(id, title)`
  ghép `id--slug`, `idFromSlugSegment(segment)` tách id gốc. Dùng `--` (2 gạch ngang) làm ranh
  giới vì id gốc và slug sinh ra đều chỉ có 1 gạch ngang liền nhau — tránh lẫn lộn kiểu
  `p1-u1-l1` / `p1-u1-l10` nếu tách bằng 1 gạch ngang.
- **Không đổi định nghĩa route** — mỗi route vẫn 1 segment động (`:lessonId`, `:id`), việc tách
  id khỏi slug nằm ở phía đọc (component trang bài học), không phải ở router.
- **Tương thích ngược:** URL cũ (chỉ có id, không có slug) vẫn vào đúng bài — `idFromSlugSegment`
  trả về nguyên id khi không có `--`.
- **Canonical redirect:** khi mở URL cũ hoặc slug không khớp tiêu đề hiện tại (bài đã đổi tên),
  `ProgrammingLessonPage`/`StoryReader` tự chuyển hướng (`replace`) về URL chuẩn — tránh Google
  coi 2 URL cùng nội dung là 2 trang khác nhau.
- Cập nhật 4 nơi tạo link: `ProgrammingHome.tsx`, `ProgrammingLevelPage.tsx`,
  `ProgrammingReview.tsx`, `Stories.tsx`.
- **Không đổi** `/lo-trinh-hoc/:levelId` (CEFR, chỉ `A1`…`C2`) — đã đủ ngắn gọn, không cần
  slug thêm.
- Canonical `<link>` tag ở `App.tsx` không cần sửa — đã tự đọc `pathname` hiện tại.

## Bằng chứng

- `npm run typecheck` ✅ · `npm run lint` ✅ (0 cảnh báo) · `npx vitest run` ✅ (503 file, 7683 test)
- `npm run build` ✅ (client + server + hub)
- `npm run budget` ✅ — JS 125,27/140 kB · CSS 16,33/18 kB (trong ngân sách)
- Test mới: `packages/core-ui/slug.test.ts` (8 ca, gồm ca biên id trùng tiền tố `p1-u1-l1`/`p1-u1-l10`)
- E2E hiện có (`e2e/programming-lesson.spec.ts`, `e2e/a11y*.spec.ts`) vẫn mở bằng URL id trần
  (`/lap-trinh/bai-hoc/p1-u4-l1`) — hoạt động tiếp nhờ tương thích ngược + redirect client-side
  (không reload trang).

## Việc còn để ngỏ

- Chưa cập nhật `docs/framework/BO-SUNG-nang-cao-i18n-PWA-Sentry-SEO.md` / sitemap — sitemap tĩnh
  hiện chỉ phủ từ điển, chưa phủ truyện/bài lập trình (có thể làm ở đợt sau nếu cần).
