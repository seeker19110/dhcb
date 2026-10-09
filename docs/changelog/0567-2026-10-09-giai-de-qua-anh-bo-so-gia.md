# 0567 — Giải đề qua ảnh: bỏ độ tin cậy và số token bịa

- **Ngày:** 2026-10-09 · **PR:** (điền sau khi tạo) · **Loại:** `fix(ai)`
- **Nguồn:** nợ nhỏ còn sót sau changelog `0563` (gỡ scaffolding giả): "vision `confidence: 0.98`
  hardcoded".

## Vấn đề

`packages/core-ai/visionSolverService.ts` trả `confidence: 0.98` cố định cho MỌI lời giải, và
`tokenUsed` rơi về `350` khi Gemini không gửi `usageMetadata`. Contract
`packages/core-contracts/visionSolver.ts` còn tự điền `confidence` mặc định `0.95` khi thiếu. Gemini
không trả độ tin cậy cho lời giải, nên các con số này là số bịa — dù hiện chưa màn hình nào hiển
thị, ai dùng về sau sẽ tin nhầm.

## Đã làm

- Service bỏ `confidence`; `tokenUsed` chỉ có khi API báo thật.
- Contract: `confidence` thành `.optional()` không mặc định (vẫn nhận giá trị 0–1 nếu sau này có
  nguồn đo thật).
- Test: `visionSolverService.test.ts` +1 ca (thiếu `usageMetadata` → `tokenUsed`/`confidence` để
  trống) và kiểm `confidence` không còn ở ca thành công; `visionSolver.test.ts` +1 ca contract
  không tự điền.

## Kiểm chứng

- `vitest` 4 file liên quan (service, contract, handler `/api/learning/vision-solve`, client
  `visionSolverApi`): 27/27 xanh.
- Không nơi nào đọc `confidence`/`tokenUsed` của lời giải ảnh ở giao diện (grep `apps/dhcb/src`).

## Không làm

- Bản ghi Cung điện trí nhớ CŨ vẫn giữ độ nhớ ngẫu nhiên từ trước `0563`: sửa phải đổi dữ liệu
  người dùng thật (migration) — chờ chủ dự án quyết.
