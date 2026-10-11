# 0600 — Ảnh trang chủ khách (AC-8) + lời chào không bị cắt ở màn hẹp

- **Ngày:** 2026-10-11 · **PR:** (xem mô tả PR) · **Loại:** `fix(home)`
- **Đặc tả:** `docs/specs/2026-09-17-redesign-trang-chu-thi-hanh.md` §P0-3 **AC-8** "Ảnh chụp guest
  1440 + 390 × 3 theme" (Approved for implementation). Nợ mở từ PR #1011.

## Vấn đề

- AC-8 bị để lại vì tưởng phải mở rộng hệ "6 màn mẫu" (`ScreenId` khoá cứng, dùng chung 3 file).
- Khi chụp, ảnh 390px lộ ra một lỗi thật: câu giới thiệu của Bạn Đồng Hành dài 84 ký tự, nhưng
  `CompanionBubble` mặc định cắt ở 2 dòng.
  - Ở 390px câu cần 3 dòng, nên khách điện thoại thấy "…từng bước tự họ…".
  - Câu này nằm trên màn đầu tiên khách mở. Lỗi có cả trong HTML dựng sẵn ở production.

## Đã làm

- **`e2e/guest-home.spec.ts`:** thêm 6 ca AC-8 (3 theme × 1440/390).
  - Mỗi ca chụp màn hình đầu và gắn ảnh vào báo cáo Playwright. Đặt `GUEST_SHOT_DIR` để ghi ảnh ra
    thư mục.
  - Mỗi ca đo 4 bất biến: không tràn ngang; CTA nằm trọn trong màn đầu; vùng chạm CTA ≥ 44px; lời
    chào không bị cắt (`scrollHeight > clientHeight` là đỏ).
- **`GuestHome`:** bọc bong bóng bằng `[&_p]:!line-clamp-none`. Đây là đúng cách mà `Home` cho người
  đã đăng nhập đang dùng (`HomeAiBriefingCard`). Không sửa `CompanionBubble` dùng chung.
- **Sinh lại HTML dựng sẵn** bằng `npm run gen:prerender-home`.
- **PROGRESS:** đóng nợ AC-8, điền số PR #1307 còn bỏ trống của đợt `0559`.

## Quyết định

- **Không mở rộng `ScreenId`:** AC-8 chỉ cần ảnh + bố cục của MỘT màn. Gắn vào spec khách sẵn có
  thì gọn hơn, và không chạm ba cổng đang dùng hệ 6 màn.
- **Chụp màn hình đầu, không `fullPage`:** ở 390px `fullPage` vẽ sai thanh điều hướng đáy cố định
  (để lại một khoảng trống giả bên dưới), thành ảnh gây hiểu nhầm.
- **Dải môn học bị cắt ngang ở 390px là cố ý:** `overflow-x-auto`, cuộn ngang. Trang không tràn.

## Bằng chứng

- **Phép đo "lời chào không bị cắt" có răng:**
  - Trên `GuestHome` cũ → **3 đỏ** (390px × 3 theme), báo đúng câu bị cắt.
  - Trên bản sửa nhưng CHƯA sinh lại HTML dựng sẵn → vẫn đỏ: lúc CTA hiện, trang còn là markup
    cũ. Đây đúng là cái bẫy CLAUDE.md §7 đã ghi.
  - Sau khi sinh lại → `guest-home.spec.ts` **11/11** xanh.
- **`GuestHome.test.tsx`:** thêm assert override `line-clamp-none`.
- **Tầng 8b:** ảnh 1440 + 390 × 3 theme.
  - 390px: câu giới thiệu hiện trọn "…từng bước tự học tốt hơn.". CTA dịch xuống 24px, vẫn trong
    màn đầu.
  - 1440px: không đổi (câu vốn vừa 2 dòng).
