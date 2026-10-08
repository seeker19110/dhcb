# 0518 — M17 đợt 7: nút trung tính `zinc` tự ghép → `buttonClass` (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** #1269 · **Loại:** `style(ui)` · **Nhánh:**
  `claude/peaceful-newton-czolhg` (dựng lại từ `main` `2048ace` sau khi #1268 merge).
- **Nguồn:** phần còn mở của `0517` ("nút trung tính `zinc` tự ghép — chuyển dần khi chạm tới"), audit
  `docs/audit/2026-09-30-audit-ui-ux-chuan-2026.md` **M17**. Chủ dự án: "tiếp tục đợt nút trung tính
  zinc tự ghép".

## Phân loại (grep trên `main` `5f7c3bd`)

| Loại                                                                                          | Số  | Xử lý                                   |
| --------------------------------------------------------------------------------------------- | --- | --------------------------------------- |
| Nút hành động nền zinc đặc (`bg-zinc-800 hover:bg-zinc-700`, `bg-zinc-900 hover:bg-zinc-800`) | ~40 | → `buttonClass({ variant: 'outline' })` |
| Nút viền zinc tự ghép (`border border-zinc-7xx … hover:bg-zinc-800`)                          | ~14 | → `outline`                             |
| Nút chữ không khung (`hover:bg-zinc-800/60`)                                                  | 1   | → `ghost`                               |
| Nút chỉ có biểu tượng (tải lại ở admin, đóng, dừng) — cỡ riêng                                | 9   | → `buttonVariantClass('outline')` + cỡ  |
| Hàng lựa chọn (`w-full text-left`), mục danh sách, nút cây, ô Parsons, gợi ý nhập vai         | ~20 | giữ — không phải nút hành động          |
| Chip/tab bật-tắt (`active ? … : 'bg-zinc-800 …'`), mục sidebar                                | ~5  | giữ — trạng thái                        |
| Ô chữ trò xếp câu (`SentenceScramble`)                                                        | 1   | giữ — quân cờ trò chơi, ngoại lệ cổng   |
| Hub (`apps/hub`)                                                                              | 5   | giữ — hub không có token ngữ nghĩa      |

Vì sao đổi: cùng một vai "hành động phụ trung tính" (Thử lại, Đóng, Làm lại, Để sau, Dừng, Nghe lại)
nhưng có 2 kiểu nền (đặc xám / viền), 4 kiểu bo góc, chữ lúc `text-zinc-200/300/400`, lúc `text-white`.
Biến thể chuẩn `outline` dùng token đã đo ở cả 3 theme (`line-strong`, `content`, `surface-raised`).

## Đã làm

- 57 nút ở 35 file qua `buttonClass` + 9 nút biểu tượng qua `buttonVariantClass('outline')`; tổng 42
  file. Cỡ chọn theo NÚT ĐỨNG CẠNH để hàng nút cùng cao: cạnh nút `primary` `lg` → `lg` (QuizTab,
  ListeningTab ×2, CefrLessonViews, ShareProgress, ProgrammingPlayground, GameChrome); `text-sm` → `md`
  (44px); `text-xs` → `sm` + `tap-44` (vùng chạm vẫn 44px).
- Đổi kèm nút đứng cạnh để cặp nút đồng bộ:
  - `TodayLesson`/`CefrLessonViews` "Đã thuộc" tự ghép `bg-accent-500/20 …` → `secondary` (trùng màu).
  - `GameChrome` "Chơi tiếp" gradient `from-accent-500 … text-white` → `primary`. Chữ trắng trên accent
    ở theme nền tối ~2,3–3,4:1, trượt AA — `primary` dùng chữ `#09090b` cố định.
- `SentenceScramble` "Nghe câu": `mx-auto` không căn giữa được phần tử `inline-flex` → bọc
  `<div className="flex justify-center">`.
- `TrongBaiHoiThoai.lopLink` (hằng class dùng lại 2 nơi) → `buttonClass(...)`, giữ gạch chân khi rê.
- `Companion` "Giữ chữ đang viết" → `outline` (không dùng `ghost`: cổng 0501 cấm `ghost` + `border`
  trong cùng file theo regex rộng, và nút đứng cạnh nút chính nên cần khung).
- Cổng mới `DesignSystem.design.test.ts`: "0 chuỗi `className="…"` có nền zinc đặc (`800/900/950`,
  không `/opacity`) kèm `hover:bg-zinc-700/800`" trên app + packages, ngoại lệ duy nhất `SentenceScramble`.
  Bẫy đã gặp khi viết: `\bbg-zinc-800` khớp luôn đuôi của `hover:bg-zinc-800` (`\b` đứng giữa `:` và
  `b`) → 11 file báo nhầm; sửa bằng `[\s"]bg-zinc-…`.

## Bằng chứng

- Cổng local: typecheck · lint 0 cảnh báo · prettier · build · `test:coverage` **808 file / 18.826 test**
  xanh.
- Cổng mới: trên mã cũ (`5f7c3bd`) khớp **44 chỗ ở 32 file** → đỏ; trên mã mới chỉ còn đúng ngoại lệ `SentenceScramble` (1 chỗ) → xanh.
- E2E: `a11y` (AA, 15 trang × 3 theme) · `a11y-modals` · `a11y-exam-plan` · `listening` ·
  `mistake-bank` — **260/260 xanh**.
- Tầng 8b (1440 + 390px, `blue-sky` + `dark-blue`, trước/sau, so điểm ảnh): `/action-canvas` — "Thêm
  Thẻ", "Tự động bố cục", "Thử lại" từ nền xám đặc → khung viền, cùng chiều cao; `/` (390px) — "Xem 4 gợi
  ý nhanh" viền rõ hơn, chữ đậm hơn, cùng cao; `/placement`, `/so-tay-loi-sai`, `/` (1440px) giống hệt
  từng điểm ảnh (nút đã đổi không hiện ở trạng thái ban đầu).

## Còn mở

- 6 nút gradient tự ghép `from-accent-500 … text-white` (StudioDialogue ×2, Chat, Login, Profile ×2) —
  cùng lỗi chữ trắng trên accent như `GameChrome`; cổng `0517` không bắt vì nền là `from-…` chứ không
  phải `bg-…`. Đề xuất một đợt nhỏ riêng.
- Hub vẫn tự ghép nút zinc (5 chỗ) vì chưa có token ngữ nghĩa; chỉ xử lý khi hub có token.
- Nút chỉ có biểu tượng ở admin (`p-1.5`) dưới 44px — bảng admin dùng chuột, chưa xử lý.
