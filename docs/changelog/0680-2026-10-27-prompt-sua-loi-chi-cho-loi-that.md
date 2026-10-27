# 0680 — 2026-10-27 — Prompt gia sư: dòng sửa lỗi chỉ cho lỗi thật (F-011)

PR #1462. Sửa nguyên nhân F-011 (🔴, gia sư "bịa lỗi" ở câu đúng).

## Vấn đề

Eval 2026-10-27 (`0677`): FP-rate 44,4 % ± 5,6. Soi 36 ca FP: 32 ca là lời khen, lời chào hoặc mẹo nhỏ được đặt
vào dòng ✅ — bộ chấm (`scripts/lib/evalScoring.ts`) coi mọi chữ sau ✅ là "đã báo lỗi", và giao diện cũng hiện
nó trong khung "Sửa lỗi & giải thích". Chỉ 4 ca là sửa sai thật.

## Đã làm

- `apps/dhcb/src/prompts/index.ts`: thêm `FEEDBACK_ONLY_FOR_ERRORS_A`/`_B` (luật 5: phần sửa lỗi chỉ cho lỗi
  thật; luật 6: văn nói, viết tắt, trả lời một từ, thiếu dấu ở chiều B đều là ĐÚNG). Không dùng câu nào của bộ
  eval làm ví dụ (đã kiểm bằng script).
- Chat A/B: khen đặt trong dòng 💬, câu đúng thì bỏ hẳn dòng ✅. Luyện nói: khen trong `"speech"`, `feedback`
  và `corrected` để trống.
- Golden snapshot cập nhật có chủ đích (5 snapshot).

## Quyết định

- Chủ dự án yêu cầu merge trước khi chạy `eval:tutor` (CLAUDE.md §8 đòi eval cho đổi prompt). **Nợ:** chủ dự án
  chạy lại `eval:tutor` trên VPS; đạt khi FP-rate giảm rõ và recall/precision không tụt so với baseline. Không
  đạt thì quay lại prompt cũ bằng `git revert` commit của #1462.

## Bằng chứng

- CI #1462 xanh đủ 19 check trên head `c98d6570`; merge squash `a4adf7db`.
