# ADR-0012: Dùng OpenCodeReview (alibaba) ở chế độ delegation cho bước `/review`

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-10-01

## Bối cảnh

`/review` (CLAUDE.md mục 7) giao cho skill `code-review` đọc diff bằng ngôn ngữ tự nhiên. Ba điểm
yếu đã biết của kiểu review "thuần prompt" trên diff lớn (DHCB thường có PR 50–100 file):
bỏ sót file khi diff dài, chỉ sai dòng, và luật dự án (validateAuth, migration lũy đẳng, token
màu…) chỉ nằm trong CLAUDE.md — mô hình phải tự nhớ áp cho đúng file.

[OpenCodeReview](https://github.com/alibaba/open-code-review) (Apache-2.0, bản 1.12.11 ngày
2026-09-29) là CLI Go của Alibaba tách phần "chắc chắn" ra khỏi mô hình: lọc file bằng thuật toán
6 cổng, khớp luật theo glob (`.opencodereview/rule.json`), bắt buộc báo độ phủ file. Nó có chế độ
**delegation** (`ocr delegate preview|rule`) **không gọi LLM nào** — chính phiên Claude Code làm
việc review.

## Quyết định

1. Thêm `.opencodereview/rule.json` mã hoá luật DHCB theo đường dẫn (API, migration, prompt, gói,
   frontend, CI), mọi luật `merge_system_rule: true` để giữ luật ngôn ngữ có sẵn của OCR.
2. `/review` dùng `npm run review:ocr:preview` + `npm run review:ocr -- delegate rule …` để lấy
   danh sách file + luật, rồi review từng file và báo `coverage_rate`.
3. Gọi qua `npx` **ghim phiên bản** 1.12.11 — KHÔNG thêm vào `devDependencies` (gói kéo binary
   theo nền tảng qua optionalDependencies; tránh đổi `package-lock.json` và thêm rủi ro cho `npm ci`
   của CI).
4. **CHƯA bật GitHub Action** `alibaba/open-code-review` trên PR.

## Lý do

- Chi phí 0: delegation không cần API key, không tốn lượt AI của dự án.
- Luật nằm ở MỘT file, khớp máy theo glob — test `scripts/ocr-rules-policy.test.ts` canh thứ tự.
- Không đổi lockfile, không đụng CI → rủi ro gần bằng 0, gỡ được bằng cách xoá 3 file.

## Phương án đã cân nhắc

- **GitHub Action review mọi PR:** tốn tiền LLM mỗi lần push (dự án vốn tối thiểu), cần secret
  `OCR_LLM_URL/TOKEN`, và chạy `pull_request_target`. Để chủ dự án quyết riêng.
- **Cài plugin Claude Code của OCR:** trùng vai với `/review` sẵn có; tích hợp vào `/review` giữ
  một cửa duy nhất.

## Hệ quả

- Nâng phiên bản OCR = sửa số trong 2 npm script (và ADR này nếu hành vi đổi).
- OCR mặc định bỏ qua file test và `.md`; luật về test vẫn do skill `code-review` + cổng coverage lo.
