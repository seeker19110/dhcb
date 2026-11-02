# 0692 — 2026-11-02 — Sửa và tích hợp PR phụ thuộc #1474–#1478

## Phạm vi

- #1474: cập nhật bộ typescript-eslint, kiểu Node, Autoprefixer và PostCSS.
- #1475: cập nhật Google Auth, jose, React Router và sql.js.
- #1476: Lucide React 1.64.0; #1477: Sentry Node 11.10.0; #1478: Nodemailer 10.3.1.
- Cập nhật các nhánh với `main` để nhận bản vá audit `glob` của #1473.
- Nhánh #1478 chứa kết quả tích hợp để kiểm tổ hợp; hòa giải hai dòng phiên bản
  Lucide/Nodemailer, giữ cả hai bản nâng cấp. Không đổi mã sản phẩm hoặc ngưỡng kiểm thử.

## Kiểm chứng tổ hợp trước khi push

- Node 22, `npm ci` và `npm ls` đạt; `npm audit --omit=dev`: 0 lỗ hổng.
- Build, typecheck, lint và format đạt; `npm test -- --maxWorkers=2`:
  1.019 file đạt, 5 file skip; 22.631 test đạt, 36 test skip.
- Initial JS: 127,26/160 kB brotli; CSS: 23,76/26 kB; 111 chunk bài học đạt ngân sách.
- Smoke offline: Sentry `globFiles` CJS/ESM, tạo email trong bộ nhớ và JWT đúng/sai
  chữ ký đạt. Rà độc lập Google Auth từ chối sai chữ ký/audience/issuer/hết hạn.
- Lượt chạy nhiều gate cùng lúc trên máy 6 GB RAM bị timeout, đã dừng và chạy tuần tự;
  không sửa mã, bỏ assertion hoặc nới thời gian để xử lý hiện tượng này.
- E2E cục bộ tập trung đăng nhập, điều hướng, smoke, a11y AA/AAA; toàn bộ coverage,
  SQL và sáu mảnh E2E của từng PR vẫn phải đạt trên CI tại head cuối trước merge.

## Rủi ro và đường lùi

Không có migration. Rollback bằng revert PR tương ứng. Override `glob 14` tiếp tục
áp dụng cho Sentry mới; kiểm lại API và audit khi nâng Sentry lần sau. Còn 14 cảnh báo
moderate chỉ ở công cụ dev đã ghi trong đợt 0691. Không dùng dữ liệu production,
gửi email thật hoặc gọi AI/provider trả phí trong kiểm thử.
