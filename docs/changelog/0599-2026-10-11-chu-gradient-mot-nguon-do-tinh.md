# 0599 — Chữ gradient: một nguồn màu, đo tĩnh ở mọi theme

- **Ngày:** 2026-10-11 · **PR:** (xem mô tả PR) · **Loại:** `fix(a11y)`
- **Nối tiếp:** changelog `0598` (cổng a11y hub tìm ra điểm mù chữ gradient của axe).

## Vấn đề

axe-core không đo được tương phản của chữ `bg-clip-text text-transparent`, nên mọi cổng E2E cho
qua. Rà toàn repo sau `0598` thấy thêm hai con số band điểm cùng khuôn lỗi:

- **`EvaluationResultView`** (điểm hội thoại): gradient vàng/accent nhạt.
- **`Writing`** (điểm bài viết): xanh ngọc → cyan, vàng, hồng.

Ở hai theme sáng (Blue sky là theme MẶC ĐỊNH), các bộ màu cũ chỉ đạt tới **1,01:1** trên một số
bề mặt. Riêng điểm thấp bài viết (`rose-500`) còn rớt cả ở theme TỐI: **3,28:1**.

Cổng a11y AA có quét màn kết quả Writing, nhưng vẫn xanh vì đây đúng là điểm mù của axe.

## Đã làm

- **`packages/core-ui/gradientText.ts` (mới):** MỘT nơi chứa mọi bộ màu chữ gradient.
  - `GRADIENT_TEXT`, `HERO_ACCENT_GRADIENT`, `CONVERSATION_SCORE_GRADIENT`,
    `WRITING_SCORE_GRADIENT`.
  - `scoreBand()` gom mốc ≥ 7 / ≥ 5, trước đây chép ở hai component.
  - Mỗi bộ có bậc nhạt cho theme tối và bậc đậm `theme-light:` cho theme sáng.
- **Ba chỗ dùng nối về module:** tiêu đề hub, `EvaluationResultView`, `Writing`.
- **`scripts/fixed-color-contrast-audit.ts`:** thêm hai hàm.
  - `auditGradientTextColors`: đo từng điểm dừng ở 3 theme × 3 bề mặt. Ngưỡng 4,5:1 (AAA chữ lớn,
    chữ gradient chỉ dùng cho chữ lớn). Ở theme sáng, mỗi vị trí `theme-light:` ghi đè riêng.
  - `findRawGradientText`: cấm `.tsx` tự viết `bg-clip-text`, để không bộ màu nào nằm ngoài phép
    đo.
- **Màu mới:**
  - Theme sáng: accent 800→700 · amber 900→800 · red 800→700 · emerald/teal/cyan 800 ·
    rose 800 → red 700.
  - Theme tối: điểm thấp bài viết `rose-500` → `rose-400`.

## Quyết định

- **Đo TĨNH thay vì thêm vào E2E app:** file cổng `e2e/a11y.spec.ts` được bảo vệ, và E2E chỉ thấy
  một mức điểm mỗi lần chạy. Test tĩnh đo đủ cả ba mức điểm × 3 theme × 3 bề mặt, nhanh hơn và
  không bỏ sót nhánh nào. Hub vẫn có phép đo trong trình duyệt (`0598`), nên có thêm một kiểm
  chứng chéo rằng Tailwind sinh đúng class từ module `.ts`.
- **Giữ màu riêng của từng màn** (hội thoại theo accent, bài viết theo emerald). Không gộp hai bảng
  màu vì việc đó là quyết định thiết kế, không phải sửa a11y.

## Bằng chứng

- **Test tĩnh mới, 4 ca:**
  - Mọi bộ màu đạt.
  - Không còn `bg-clip-text` viết thẳng.
  - Bắt được bộ màu cũ ở cả theme sáng lẫn `rose-500` ở theme tối; không báo nhầm hub ở theme
    tối.
  - Class lạ, thiếu điểm dừng hoặc màu không đọc được thì ném lỗi.
- **Đo bộ màu CŨ:** 110 cặp rớt ngưỡng, thấp nhất 1,01:1. Đo bộ màu MỚI: 0 cặp.
- **`findRawGradientText` trên mã cũ:** liệt kê đúng 4 dòng (`EvaluationResultView:72`,
  `Writing:110`, `App.tsx:409/412`).
- **`scoreBand`:** test mốc 7/5 và số thập phân ngay dưới mốc.
- **E2E `a11y-hub.spec.ts`:** 7/7 sau khi hub chuyển sang module.
- **Tầng 8b:** ảnh thẻ điểm Writing ở 390px, 3 mức điểm × 3 theme, trước/sau.
  - Theme sáng: số 8/6/4 từ gần như chìm vào nền thành đọc rõ.
  - Theme tối: gần như không đổi.
