# 0490 — Đợt U4 audit UI/UX: ngôn ngữ của trang và ngôn ngữ của từng đoạn (2026-10-04)

- **Ngày:** 2026-10-04 · **PR:** (điền khi tạo) · **Loại:** `fix(a11y)`.
- **Phạm vi:** đợt U4 trong `docs/audit/2026-09-30-audit-ui-ux-chuan-2026.md` mục 12. Gồm lỗi C5
  (WCAG 3.1.1 Language of Page mức A, 3.1.2 Language of Parts mức AA) và cổng (c) ở mục 11. Đợt này
  "không cần chủ dự án quyết".

## Đã làm

### 3.1.1 — `<html lang>` theo ngôn ngữ giao diện

- `apps/dhcb/src/lib/documentLang.ts` (mới) là một kho nhỏ quyết định `<html lang>` từ hai nguồn:
  - **giá trị nền** là ngôn ngữ giao diện (`ui_lang`), do `LangProvider` đặt và cập nhật mỗi khi đổi;
  - **ghi đè** cho trang chỉ có một ngôn ngữ, qua hook `useDocumentLangOverride`. Rời trang thì gỡ
    ghi đè.
- Lý do dùng kho thay vì để mỗi nơi tự ghi: React chạy effect của component con TRƯỚC component
  cha. Nếu trang con ghi "en" rồi `LangProvider` (cha) ghi "vi" sau, ghi đè của trang bị mất. Kho
  luôn tính lại kết quả từ cả hai nguồn, nên thứ tự effect không ảnh hưởng.
- `LandingEn` (`/learn-vietnamese`) dùng ghi đè `en`, kể cả khi giao diện người dùng là `vi`. Tên
  thương hiệu tiếng Việt trong câu tiếng Anh được bọc `lang="vi"`. Diff ở file này giữ tối thiểu,
  vì đợt U3 song song cũng sửa file này (đổi màu).

### 3.1.2 — `lang` cho đoạn khác ngôn ngữ (sửa ở component dùng chung)

- `WordText`: câu thoại và bản dịch của bài hội thoại. Component vốn đã nhận prop `lang`, nay gắn
  thêm lên `<p>`. Một chỗ sửa áp cho mọi bài, cả hai chiều A/B.
- `LessonView`, `LessonList`: tên bài và tình huống luôn là tiếng Việt trong dữ liệu, nên gắn
  `lang="vi"`. Ở chiều B (giao diện tiếng Anh), trình đọc màn hình đọc đúng giọng Việt.
- `OutlinePrevNext`: thêm prop tuỳ chọn `titleLang`. Bài hội thoại truyền `vi`; các môn khác
  không đổi.
- `StoryCard`: tiêu đề lớn mang ngôn ngữ đích, tiêu đề nhỏ mang ngôn ngữ còn lại.
- **Công thức ngữ pháp CEFR trộn hai thứ tiếng trong một chuỗi**, vd
  "S + am / is / are + (tính từ • danh từ)":
  - nếu gắn cả chuỗi `lang="en"` thì "tính từ" bị đọc giọng Anh;
  - nên thêm `lib/langRuns.ts` + `components/MixedLangText.tsx` để tách chuỗi theo ký hiệu nối
    (`+ • · / ( ) …`) và gắn `lang` cho TỪNG đoạn;
  - cắt theo ký hiệu chứ không theo từng từ, vì "danh" không có dấu sẽ bị nhận nhầm là tiếng Anh.
  - Áp cho công thức và tên bài ngữ pháp ở `CefrLevelPage` và `CefrLessonViews`. Có tên
    "tiếng Việt" thật ra là tiếng Anh, vd "This / That / These / Those".
- Khung giao diện (chrome):
  - `DesktopSidebar` viết cứng tiếng Việt → `lang="vi"`;
  - `SkipLink` có thêm prop `lang`, mặc định `vi` theo nhãn mặc định;
  - nút "Đồng Hành AI" ở `Layout` → `lang="vi"`;
  - `BottomNav` đọc chữ qua `T`, nên gắn `lang` = ngôn ngữ giao diện. Nhãn `aria-label` cũng theo
    ngôn ngữ giao diện: "Main navigation" khi là en.

### Cổng (c) — `e2e/lang-of-parts.spec.ts` (mới)

- Heuristic:
  - lấy chữ riêng (text node con trực tiếp) của mọi phần tử hiển thị;
  - "khối tiếng Anh" là khối không có chữ cái mang dấu tiếng Việt, ≥ 3 từ, và ≥ 2 từ chức năng
    tiếng Anh khác nhau;
  - "khối tiếng Việt" là khối có ≥ 2 từ mang dấu;
  - vi phạm khi `closest('[lang]')` của khối không khớp ngôn ngữ của nó.
- Spec còn kiểm `<html lang>` đúng.
- Ngưỡng **0** trên mỗi trang. Đo 5 ca × 2 khổ (1440px, 390px) = 10 test:
  - bài hội thoại `lesson=1`, chiều A với giao diện vi và chiều B với giao diện en;
  - `/lo-trinh-hoc/a1`;
  - danh sách truyện;
  - `/learn-vietnamese`.
- Mỗi ca chờ một phần tử NỘI DUNG chứ không chờ `h1`. Lý do: bản nháp chờ `h1` từng **xanh giả**
  ở danh sách truyện 1440px, vì đo lúc thẻ truyện chưa tải.

## Không làm

- Khung giao diện ở các trang ngoài 4 trang trên chưa được rà từng chỗ. Ví dụ: sidebar viết cứng
  tiếng Việt (nay đã có `lang="vi"`, nhưng chưa được dịch), và các trang chọn chữ theo chiều học
  (`isA`) thay vì theo `ui_lang`. Nếu người dùng đặt chiều A cùng giao diện en (hoặc ngược lại),
  chữ giao diện của các trang này sẽ lệch với `<html lang>`. Việc đúng ở đây là i18n hoá các trang
  đó, vượt phạm vi U4.
- Không sửa prompt AI, màu, Login/ResetPassword, hub.

## Bằng chứng

- Unit:
  - `LangProvider.test.tsx` (3 ca): vi→en→vi; chiều B lần đầu ra `en`; ghi đè của trang con thắng
    giá trị nền rồi được gỡ khi rời trang;
  - `langRuns.test.ts` (7 ca);
  - `MixedLangText.test.tsx` (1 ca).
- **Đối chứng âm:** chạy spec mới trên bản sao `main` 7081d8a (bằng `git archive`) thì **10/10 đỏ**.

  | Trang                  | Trước — 1440px         | Trước — 390px          | Sau |
  | ---------------------- | ---------------------- | ---------------------- | --- |
  | Bài hội thoại, chiều A | 20                     | 20                     | 0   |
  | Bài hội thoại, chiều B | 25 + `<html lang>` sai | 24 + `<html lang>` sai | 0   |
  | `/lo-trinh-hoc/a1`     | 5                      | 5                      | 0   |
  | Danh sách truyện       | 8                      | 8                      | 0   |
  | `/learn-vietnamese`    | 6 + `<html lang>` sai  | 6 + `<html lang>` sai  | 0   |

  Số đo khớp audit: 20 câu, 5 mẫu ngữ pháp, 8 tiêu đề.

- Spec mới trên nhánh: **10/10** ✅.
- Tầng 8b: chụp bài hội thoại `lesson=1` ở 1440px và 390px, trước (bản sao `main`) và sau. Ảnh
  **trùng từng byte** (sha256 giống nhau), tức thêm `lang` không đổi giao diện.
