# 0586 — Đợt E1 mục 9 audit: 8 lỗi im lặng mức thấp ở server

- **Ngày:** 2026-10-10 · **PR:** (xem mô tả PR) · **Loại:** `fix(server)`
- **Nguồn:** báo cáo `docs/audit/2026-10-10-audit-toan-dien-va-toi-uu.md` mục E1.9 (phần còn mở
  sau `0581`). Người dùng yêu cầu "làm tiếp hết đi". Không có migration, không đổi schema.

## Đã làm

| #   | Chỗ                                                  | Trước                                                                                                      | Sau                                                                                                                                                                  |
| --- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `packages/core-personal/automationService.ts`        | Chưa có executor bù trừ nhưng biên nhận BẤT BIẾN ghi `reverted: true` + `status: 'compensated'`            | Giữ `status: 'failed'`, `compensation_result: { reverted: false, reason: 'not_implemented' }`. Enum hợp đồng vẫn giữ `compensated` cho biên nhận cũ                  |
| 2   | `packages/core-auth/guestTrial.ts`                   | Redis hỏng (production) → khách thấy "đã dùng hết lượt thử" dù chưa dùng lượt nào                          | Vẫn chặn (fail-closed) nhưng báo "máy chủ tạm bận", `guestTrialExhausted: false` (không mời đăng ký). Thêm `consumeDailyCounterStatus` ở `security.ts`               |
| 3   | `apps/server/src/api/core/progress.ts`               | Đọc gói lỗi → coi như Free (đúng, khoá chặt) nhưng danh sách cấp HẸP đó bị lưu vào biên nhận idempotent    | Đọc gói lỗi thì KHÔNG ghi biên nhận (merge vốn là hợp nhất nên gửi lại an toàn); cột `cefr_unlocked` tự lành ở lần ghi sau                                           |
| 4   | `apps/server/src/api/core/usage-summary.ts`          | Lỗi DB trả `plan: 'free'` — VIP bị báo là Free                                                             | Trả `plan: null`. Client hiện hành vốn đã coi phản hồi này là "chưa biết" (schema loại `freeWeeklyCap: 0`)                                                           |
| 5   | `apps/server/src/api/_lib/emailReminders.ts`         | SMTP lỗi/chưa cấu hình đếm vào `skipped`; lỗi ghi mốc cooldown làm DỪNG cả vòng gửi                        | Thêm `failed` (log `server.ts` in ra); lỗi ghi mốc chỉ log, vòng gửi tiếp cho người sau                                                                              |
| 6   | `apps/server/src/api/platform/hub-stats.ts`          | `catch {}` không log — admin âm thầm thành người thường                                                    | `console.warn` kèm lỗi, hành vi fail-open giữ nguyên                                                                                                                 |
| 7   | `packages/core-personal/intakeService.ts` + `intake` | `saveChosenTask`/`markTaskDone` không kiểm `rowCount` — chưa có hàng intake vẫn trả `ok: true`, số đo lệch | Hai hàm trả `boolean`; handler trả 409 "chưa trả lời 5 câu". `markTaskDone` dùng `coalesce(task_done_at, now())` để vẫn giữ mốc LẦN ĐẦU mà `rowCount` phân biệt được |
| 8   | `packages/core-auth/authService.ts`                  | Google `!ok` trả `null` không log; Facebook không kiểm `res.ok`                                            | Kiểm `res.ok` cả hai; 5xx/429 (nhà cung cấp sập) thì `console.warn`, 4xx (token sai) không log cho đỡ nhiễu. Vẫn trả `null` (fail-closed)                            |

## Quyết định

- Mã HTTP khi khách không đếm được lượt giữ **429** ở cả ba endpoint (`/api/agent`, `/api/stt`,
  `/api/tts`) cho nhất quán: `ActorGate` không mang mã trạng thái, đổi riêng `tts` sang 503 là lệch
  nhau. Điều quan trọng là câu chữ + cờ `guestTrialExhausted` đã đúng.
- Không đổi khoá chặt "đọc gói lỗi → Free" ở `progress.ts` và `programming/progress.ts` — đó là
  hướng có chủ đích (không phát nhầm quyền VIP). Môn Lập trình không lưu gì suy từ gói vào biên
  nhận nên không cần sửa.

## Bằng chứng kiểm chứng

- Kiểm ngược: cất phần sửa mã nguồn, giữ test mới → **24 test đỏ** trên code cũ (mọi ca hồi quy
  của 8 mục đều nằm trong số đó); trả phần sửa về → xanh.
- Test mới: `packages/core-auth/actorUsage.test.ts` (file mới, 3 ca), 2 ca `guestTrial`, 2 ca
  `progress` (đọc gói lỗi/không lỗi ↔ biên nhận), 2 ca `emailReminders`, 1 ca `intakeService`,
  3 ca `authService`, mở rộng ca `automationService`/`hub-stats`/`usage-summary`.
- Cổng (typecheck sạch, lint, format, test:coverage, build): xem mô tả PR.
