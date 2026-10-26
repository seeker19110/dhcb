# 0664 — 2026-10-25 — Eval AI thật trên VPS: đóng F-008, sửa action-canvas 0/10, ghi F-011

PR #1437. Chủ dự án chạy 5 eval trên VPS (cấu hình production, key thật) và dán nguyên văn
kết quả vào phiên. Agent không có key nên không chạy lại được — mọi số dưới đây chép từ log đó.

## Kết quả

| Eval                                                             | Kết quả                                           |
| ---------------------------------------------------------------- | ------------------------------------------------- |
| `eval:tutor` (180 câu, Anthropic · Haiku 5.5 effort low, 1 lượt) | Recall 99,2 % · Precision 78,8 % · FP-rate 53,3 % |
| `eval:companion`                                                 | 16/16                                             |
| `eval:code-feedback`                                             | 8/8                                               |
| `eval:v2:routing -- --haiku`                                     | 87,1 % (54/62, ngưỡng 85 %)                       |
| `eval:action-canvas`                                             | **0/10** — cả 10 ca `invalid_output:too_deep`     |

## Đã làm

- **F-008 đóng:** ghi baseline `docs/research/eval-tutor-baseline.md` cho bộ 180 câu; baseline cũ (62 câu,
  Groq, 2026-08-26) giữ ở mục "Lịch sử"; giữ phần "Dải nhiễu".
- **Sửa action-canvas:** model trả chuỗi tuần tự s1→…→sN dù prompt khuyên ≤ 4 tầng; bộ kiểm từ chối
  toàn bộ ⇒ mọi yêu cầu phân rã mục tiêu trả 502. `parseGoalDecomposition` bỏ kiểm `depth > MAX_DEPTH`
  (vẫn chặn vòng, trần 8 bước); `MAX_DEPTH` giữ làm lời khuyên trong prompt ⇒ **chuỗi prompt không đổi**
  (không cần chạy lại eval prompt; cần chạy lại `eval:action-canvas` để xác nhận các bất biến còn lại).
  Ghi sửa đổi vào đặc tả `docs/specs/2026-10-09-action-canvas-phan-ra-muc-tieu-ai.md`.

## Quyết định (CLAUDE.md §12, tự duyệt)

- Nới bộ kiểm thay vì sửa prompt: đúng & bền — không phụ thuộc model có tuân lời khuyên độ sâu hay không;
  chuỗi tuần tự hợp lệ về nghĩa; bố cục canvas không phụ thuộc độ sâu. Đường lùi: đặt lại kiểm độ sâu.

## Phát hiện mới

- **F-011 (🔴):** trên cùng 62 câu của baseline cũ, FP-rate ≈ 50 % (9/18 câu đúng/ca biên bị bịa lỗi) so
  với 5,6 % hồi Groq — tụt thật kể từ khi Claude làm AI chính (#1315). Sửa cần đổi prompt chấm + chạy lại
  `eval:tutor` với key thật; chưa làm trong PR này.

## Kiểm chứng

- Test đỏ-trước: hai ca mới "chấp nhận chuỗi 5 / 8 bước nối tiếp nhau" ĐỎ trên mã cũ, XANH sau sửa.
- `vitest` `packages/core-personal` + `apps/server/src/api/platform`: 1.144 pass / 20 skip sẵn có;
  typecheck, lint sạch.
