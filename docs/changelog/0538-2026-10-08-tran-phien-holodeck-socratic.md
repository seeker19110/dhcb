# 0538 — Trần phiên + TTL cho Scenario Holodeck và Socratic (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** (chưa tạo — commit trên nhánh worktree) · **Loại:** `fix(server)`
- **Nguồn:** nợ đề xuất (a) của `0526` (audit kiểm soát truy cập) và ghi chú ở `0534` (gỡ
  `/api/realtime-multimodal`, GIỮ hai endpoint này vì có client thật:
  `ScenarioHolodeckCard`/`SocraticDiagnosticsCard` trong Companion → `StudioLabs`/`StudioCognitive`).

## Vấn đề

`/api/scenario-holodeck` và `/api/socratic-diagnostics` giữ phiên trong một `Map` cấp module
**không bao giờ dọn**: mỗi lần bấm "Bắt đầu" là một phiên sống tới khi PM2 khởi động lại. Rate
limit 60/phút/IP chỉ làm chậm, không chặn RAM tăng mãi. Thêm nữa, một phiên Holodeck nhận lượt
không giới hạn (mỗi lượt +2 bản ghi, câu trả lời không giới hạn độ dài). Phía client, thẻ Socratic
nuốt mọi lỗi bằng `console.error` — người học bấm "Gửi" mà không thấy gì.

## Đã làm

1. **Tiện ích dùng chung `packages/core-personal/ttlSessionStore.ts`** (`TtlSessionStore<T>` +
   `createPracticeSessionStore()`), cả hai service dùng chung:
   - **TTL trượt** `PRACTICE_SESSION_IDLE_TTL_MS` = 30 phút không hoạt động. Hết hạn ĐÚNG mốc:
     còn hạn ở `TTL − 1ms`, hết ở `TTL`. `get` tự kiểm hạn nên mốc chính xác, không phụ thuộc chu
     kỳ dọn. Người khác đọc thử KHÔNG gia hạn hộ phiên.
   - **Trần mỗi người** `PRACTICE_SESSION_MAX_PER_PERSON` = 5 → vượt thì **đóng phiên ít hoạt
     động nhất của chính người đó** (không 429). Lý do: giao diện chỉ dùng MỘT phiên, nút "Đổi kịch
     bản/chủ đề" bỏ phiên cũ mà không báo server — phiên cũ nhất gần như chắc chắn đã bị bỏ. 429 sẽ
     chặn đúng người dùng thật vừa đổi ý vài lần.
   - **Trần toàn tiến trình** `PRACTICE_SESSION_MAX_TOTAL` = 2 000 mỗi service → chạm trần (sau khi
     đã dọn phiên hết hạn) thì **từ chối phiên mới bằng 503** `session_capacity`, KHÔNG đuổi phiên
     của người khác (đuổi LRU toàn cục cho phép kẻ tạo phiên hàng loạt đá văng phiên đang dùng dở
     của người thật). Trần mỗi người xét TRƯỚC trần toàn cục: người đã đủ 5 phiên vẫn đổi được
     phiên khi tiến trình đầy.
   - **Dọn định kỳ** `setInterval(...).unref()` mỗi 5 phút, khởi động lười ở phiên đầu tiên, tự
     dừng khi hết phiên; `dispose()` là đường dừng cho test (`resetHolodeckSessionsForTest` /
     `resetSocraticSessionsForTest`). Map giữ thứ tự theo lần hoạt động (chạm = xoá + chèn cuối) →
     dọn chỉ duyệt phần đã hết hạn.
   - Đồng hồ mặc định gọi `Date.now()` lúc chạy (không giữ tham chiếu `Date.now`) — bộ lưu tạo cấp
     module vẫn theo fake timers trong test (bẫy đã gặp khi viết test, sửa ngay).
2. **Service kiểm chủ phiên bên trong** (trước đây handler tự so `personId`):
   `getHolodeckSession/processHolodeckTurn/finalizeHolodeckSession` và
   `getSocraticSession/submitSocraticReflection` nay nhận `personId`. Không có / hết hạn / của
   người khác → `SessionGoneError` (404, mã `session_not_found`, thông điệp tiếng Việt "…hãy bấm
   'Bắt đầu lại'") — ba ca giống hệt nhau, giữ nguyên tính chất không lộ id của 0526.
   Gửi lượt vào phiên đã kết thúc → 409 (trước là 500).
3. **Chặn phình RAM trong một phiên:** Holodeck tối đa `MAX_HOLODECK_USER_TURNS` = 40 lượt người
   học (409, vẫn tổng kết được); Socratic tự có trần (= số bước `inquiryPath`). Body POST cả hai
   handler nay kiểm bằng **Zod** (`discriminatedUnion` theo `action`, thay ép kiểu tay), câu trả
   lời tối đa 2 000 ký tự → 413.
4. **Client:** `apps/dhcb/src/lib/practiceSessionError.ts` đọc body lỗi (Zod, cả hai khuôn
   `{error:'…'}` và `{error:{message,code}}`), nhận ra `session_not_found`/410. Khung báo lỗi dùng
   chung `CompanionVoice/PracticeSessionAlert.tsx` (`role="alert"` + nút **"Bắt đầu lại"** mở
   phiên mới cùng kịch bản/chủ đề). Phiên chết thì khoá ô nhập; lỗi gửi thì trả lại câu vừa gõ.
   Thẻ Socratic hết im lặng: lỗi bắt đầu/gửi phản tư hiện lên thẻ.

## Bằng chứng

- `packages/core-personal/ttlSessionStore.test.ts` — 16 ca fake timers: hết hạn đúng mốc, trượt,
  dọn nền + timer tự dừng, `dispose`, chủ khác (không đọc được, không gia hạn hộ), trần mỗi người
  (đóng phiên ít hoạt động nhất, không đụng người khác), trần toàn cục (503, không đuổi; có phiên
  hết hạn thì dọn rồi nhận), cấu hình vô nghĩa bị từ chối.
- Service: `scenarioHolodeckService.test.ts` + `socraticDiagnosticsService.test.ts` thêm 11 ca
  (hết hạn đúng mốc 30 phút, chủ khác, trần 5/người, trần 2 000 toàn cục, trần 40 lượt, 409 phiên
  đã xong).
- Handler: `scenario-holodeck.test.ts` + `socratic-diagnostics.test.ts` thêm 6 ca (404
  `session_not_found` cho turn/finalize/GET sau 30 phút, TTL trượt qua HTTP, 409, 413).
- Client: `practiceSessionError.test.ts` (6 ca, gồm test hợp đồng mã client = mã server) +
  `CompanionVoice/PracticeSessionCards.test.tsx` (4 ca: Holodeck/Socratic nhận 404 → alert +
  "Bắt đầu lại" → POST start cùng id; 409 không hiện "Bắt đầu lại" và trả lại câu; 503 hiện lên thẻ).
- `npm run codemap -- impact` cho 6 file sửa: ảnh hưởng dừng ở `routes.ts`/`server.ts`,
  `StudioLabs`/`StudioCognitive`/`Companion` và các test của chúng — đã chạy lại
  `routes.csrf.test.ts`, `CompanionStudios.test.tsx`, `Companion.voice.test.tsx`,
  `useCatalogList.contract.test.ts`: xanh.
- Cổng: `rm -rf packages/*/dist dist dist-server && npm run typecheck` · `npm run lint` ·
  `npx prettier --check` (file đổi) · vitest các file liên quan + `scripts/changelog.test.ts`.

## Rủi ro / còn lại

- Phiên vẫn chỉ nằm trong RAM: PM2 khởi động lại (deploy) là mất phiên — nay client hiện "Bắt đầu
  lại" thay vì kẹt. Chạy nhiều tiến trình (cluster) thì phiên không chia sẻ; hiện VPS chạy một
  tiến trình nên chưa cần Redis.
- Ước lượng RAM ca xấu nhất mỗi service ~320 MB (2 000 phiên × 40 lượt × 2 KB); phiên thật < 10 KB.
- Danh sách chủ đề của thẻ Socratic (GET catalog) vẫn nuốt lỗi tải bằng `console.error` — nên đổi
  sang `useCatalogList` như Holodeck (ngoài phạm vi đợt này).
