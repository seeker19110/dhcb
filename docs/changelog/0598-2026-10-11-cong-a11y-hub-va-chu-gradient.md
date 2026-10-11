# 0598 — Cổng a11y E2E cho hub + đo tương phản chữ gradient

- **Ngày:** 2026-10-11 · **PR:** (xem mô tả PR) · **Loại:** `fix(hub)`
- **Nguồn:** chủ dự án chốt "Thêm vào cổng" (2026-10-10) cho nợ "Hub chưa có ca nào trong
  `e2e/a11y.spec.ts`" (PROGRESS, mục nợ hub/tương phản tĩnh, changelog `0373`).

## Vấn đề

Hub là cửa vào đầu tiên của người lạ, nhưng chỉ có test đơn vị jsdom (`HubLogin.a11y.test.tsx`).
jsdom không tính được tương phản, vùng chạm hay bố cục thật. Hai cổng E2E a11y chỉ quét app nền
tảng.

## Đã làm

- **`e2e/a11y-hub.spec.ts` (mới):** quét trang chủ + `/login` của hub × 3 theme, cộng trang chủ
  khi đã đăng nhập (theme sáng). Luật giống cổng app: 0 vi phạm A/AA ở mọi mức tác động.
- **Đo chữ gradient (`scripts/lib/gradientText.ts` + `e2e/helpers/gradientText.ts`):**
  - axe không đo được chữ `bg-clip-text text-transparent`: nó xếp phần tử vào `incomplete` và
    cổng vẫn XANH.
  - Helper đọc màu từng điểm dừng gradient + nền đặc thật phía sau, lấy điểm dừng TỆ NHẤT, chấm
    theo mức AAA nội dung: chữ lớn ≥ 4,5:1, chữ thường ≥ 7:1.
  - Không đọc được màu (nền là ảnh, màu có alpha) thì BÁO LỖI, không bỏ qua.
- **Sửa lỗi cổng mới bắt được:** dòng "Hiểu điều bạn học." ở tiêu đề hub dùng bậc accent
  200–400.
  - Trên nền sáng chỉ đạt **1,27:1** (Blue sky) và **1,31:1** (Nhi đồng), dưới cả sàn AA chữ lớn
    3:1. Blue sky lại là theme MẶC ĐỊNH.
  - Theme sáng nay dùng bậc 800→700 qua `theme-light:`: ≥ 5,68:1 và ≥ 7,05:1. Theme tối giữ
    nguyên (≥ 9,9:1).
- **`e2e/helpers/hubServer.ts` (mới):** dựng dev server hub ngay trong spec bằng API của Vite,
  tách ra từ `e2e/hub-reflow.spec.ts` để hai spec hub dùng chung.

## Quyết định

- **Không thêm `webServer` thứ hai vào `playwright.config.ts`.** Đã thử và chạy được, nhưng cách
  đó bắt cả 6 mảnh E2E của CI dựng thêm một server chỉ cho vài spec hub. `hub-reflow.spec.ts` đã
  có tiền lệ tự dựng server; đi theo tiền lệ, không sửa config hay workflow CI.
- **File riêng, không sửa `e2e/a11y.spec.ts`** (cổng được bảo vệ). Luật chấm giữ y hệt.
- **Chưa gắn phép đo gradient vào cổng của app chính.** Rà `bg-clip-text` toàn repo thấy thêm hai
  con số band điểm (`EvaluationResultView`, `Writing`) cùng khuôn lỗi, khoảng 1,5:1 ở theme sáng.
  Để sang đợt kế tiếp, sửa cùng chặn tĩnh, cho PR này gọn.

## Bằng chứng

- **Cổng bắt được lỗi thật:** chạy spec trên tiêu đề CŨ → **3 đỏ** (Blue sky, Nhi đồng, Blue sky
  đã đăng nhập), báo đúng `1.27:1 (điểm dừng rgb(186, 230, 253) …) < 4.5:1`. Theme tối xanh, đúng
  như tính tay. Trên bản sửa → 7/7 xanh.
- **axe trên hub không phải xanh giả:** chèn thử một đoạn chữ mờ + một nút không tên → axe báo
  `color-contrast` + `button-name`. Trang lúc quét có 565 phần tử (đã render đủ).
- **Test đơn vị `gradientText.test.ts`:** ngưỡng chữ lớn, đọc alpha, bản trước/sau sửa, các ca
  không đọc được màu.
- **`hub-reflow.spec.ts` sau khi tách helper:** 17/17 xanh.
- **Tầng 8b:** ảnh hub 1440 + 390 trước/sau ở cả 3 theme. Theme sáng: tiêu đề đọc rõ, bố cục
  không đổi. Theme tối: không đổi.
