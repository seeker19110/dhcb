---
description: Review code trước khi mở PR — gọi skill code-review (+ subagent security-reviewer nếu chạm vùng nhạy cảm) đọc logic/thiết kế trên diff, khác /gate (chỉ máy chạy build/lint/test)
---

Kích hoạt **rà soát code trước khi mở Pull Request**. Đây là bước đọc-hiểu (logic/thiết kế/tái
sử dụng), bổ sung cho `/gate` (chỉ chạy máy build/type/lint/format/test) — làm **cả hai**, không
thay thế nhau. (Nguồn: `seeker19110/projects-template` `.claude/commands/review.md`, khớp DHCB
2026-09-21.)

> **TRIGGER:** người dùng nói đã xong một tính năng/sửa lỗi và sắp mở PR ("xong rồi", "review
> giúp trước khi PR", "chuẩn bị PR"), hoặc tự thấy diff đủ lớn/đủ rủi ro logic trước khi đề xuất
> mở PR.

## Bước 1 — Xác định phạm vi diff

- Mặc định: diff hiện tại so với `main` (`git diff origin/main...HEAD`).
- Người dùng chỉ định PR/nhánh/đường dẫn cụ thể → dùng đúng phạm vi đó.

## Bước 1b — Lấy danh sách file + luật bằng OpenCodeReview (delegation, không tốn API)

Theo ADR-0012. OCR chỉ làm phần chắc chắn (lọc file, khớp luật theo `.opencodereview/rule.json`),
**không gọi LLM**:

```bash
npm run -s review:ocr:preview -- --format json          # file cần review (mặc định origin/main..HEAD)
npm run -s review:ocr -- delegate rule --format json <file...>   # luật DHCB + luật ngôn ngữ cho từng nhóm file
```

Lập checklist MỌI file trong `reviewable_files`; mỗi file kết thúc là `reviewed` hoặc `skipped`
kèm lý do. Dùng luật của nhóm file làm checklist khi đọc diff ở Bước 2. Cuối báo cáo ghi
`reviewed/total` (độ phủ) — không được im lặng bỏ file.

## Bước 2 — Gọi skill `code-review`

Dùng `Skill(code-review)` ở effort phù hợp độ rủi ro của diff (mặc định `medium`; nâng `high`
nếu diff chạm nhiều file/luồng nghiệp vụ chính, ví dụ đổi luồng AI/thanh toán/nhiều trang).

## Bước 3 — Gọi thêm subagent `security-reviewer` nếu chạm vùng nhạy cảm

Diff đụng auth, thanh toán SePay, dữ liệu người dùng thật, quyền truy cập (`validateAuth()`),
hoặc input từ bên ngoài chưa rõ đã validate → giao thêm `Agent(security-reviewer)` (đúng
CLAUDE.md mục 12).

## Bước 4 — Xử lý phát hiện

- Lỗi **correctness/bảo mật** xác nhận thật → sửa ngay, chạy lại `/gate`, review lại phần đã
  sửa.
- Gợi ý **đơn giản hóa/tái sử dụng** không bắt buộc → nêu cho người dùng quyết định (không tự ý
  refactor ngoài phạm vi PR — CLAUDE.md nguyên tắc "không đưa abstraction thừa").
- Không phát hiện gì đáng kể → báo ngắn gọn "review sạch, sẵn sàng PR".

## Ranh giới

- **Không thay `/gate`** — vẫn phải chạy `/gate` (build/type/lint/format/test) trước khi
  commit/merge như CLAUDE.md mục 8–9 yêu cầu.
- **Không tự merge/tạo PR** thay người dùng nếu chưa được yêu cầu.
- Phát hiện vấn đề kiến trúc lớn (không phải bug cục bộ) → đúng CLAUDE.md mục 12, dừng và hỏi
  thay vì tự quyết sửa; cân nhắc `/grill` nếu cần làm rõ nhiều nhánh.
