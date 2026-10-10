# 0582 — `/api/tts`: khách dùng thử giọng server + hoàn lượt khi provider hết quota

- **Ngày:** 2026-10-10 · **PR:** #1332 · **Loại:** `fix(tts)`
- **Nguồn:** lượt "kiểm tra api tts" cùng phiên — người dùng chốt "sửa cả hai điểm, khách được
  dùng thử giọng server".

## Vấn đề

1. **Khách vãng lai không bao giờ nghe giọng server.** Server đã có nhánh khách cho `/api/tts`
   (cache HIT miễn phí, tạo mới trừ lượt dùng thử — đặc tả
   `docs/specs/2026-09-15-mo-xem-web-khong-can-dang-nhap.md`), nhưng client
   `apps/dhcb/src/lib/tts.ts#ensureAudioWithTimeline` ném lỗi "Chưa đăng nhập" TRƯỚC khi gọi
   fetch → khách luôn rơi về Web Speech, nhánh khách ở server không bao giờ được dùng.
2. **Provider hết quota vẫn trừ lượt.** `packages/core-ai/tts.ts` chỉ hoàn lượt khi CHƯA gọi
   provider. Google/ElevenLabs/Gemini trả 429 (hết quota) → server trả 503 + client fallback Web
   Speech, nhưng lượt AI/ngày (hoặc lượt thử của khách) vẫn bị trừ: lúc provider cạn quota,
   người dùng mất 1 lượt cho mỗi câu mới mà không nhận được audio.

## Đã làm

- Server (`packages/core-ai/tts.ts`): cờ `providerQuotaExhausted` bật ở nhánh quota (503); khối
  `finally` hoàn lượt khi `!providerStarted || providerQuotaExhausted` — áp cho cả user
  (`refundUsage`, đúng ngày đã trừ) và khách (`refundGuestTrial`). Lỗi provider KHÁC (500), lỗi
  lưu file/DB vẫn KHÔNG hoàn (giữ luật "không tạo lượt miễn phí"). `/api/pronunciation` đã hoàn
  lượt ở mọi lỗi Google từ trước — không phải sửa.
- Client (`apps/dhcb/src/lib/tts.ts`):
  - Bỏ chặn "chưa đăng nhập" trong `ensureAudioWithTimeline` — `getAuthHeader()` đã tự gắn
    `X-Guest-Id` khi chưa có phiên.
  - 429 kèm `guestTrialExhausted: true` → ném lỗi ngay, KHÔNG thử lại sau 1,2 s (hạn mức theo
    ngày, thử lại vô ích) → `speak()` rơi về Web Speech không phải chờ.
  - `prefetchSpeech` bỏ qua với khách: lượt thử chỉ 3/ngày và DÙNG CHUNG với chat/STT, nạp trước
    câu chưa cache ở nền sẽ đốt lượt cho câu có thể không bao giờ phát. Khách vẫn nghe giọng
    server khi bấm phát thật. (`preloader.ts` vốn đã bỏ qua khách.)

## Quyết định

- Chỉ hoàn lượt ở nhánh hết quota, không hoàn mọi lỗi provider: lỗi khác (timeout sau khi
  provider đã xử lý…) có thể đã tính tiền; nhánh quota là provider từ chối, không sinh audio.
- Không thêm chế độ "chỉ đọc cache" cho nạp trước của khách (mở rộng phạm vi API) — bỏ qua nạp
  trước là đủ; chỉ tốn thêm độ trễ tải lúc phát.

## Bằng chứng kiểm chứng

- Test mới server (`packages/core-ai/tts.test.ts`): hết quota → hoàn đúng ngày (user) / hoàn lượt
  thử (khách); lỗi khác → không hoàn. Đã chạy với điều kiện cũ (`!providerStarted`) → 2 ca đỏ,
  với bản sửa → xanh.
- Test mới client (`apps/dhcb/src/lib/tts.test.ts`): khách vẫn gọi `/api/tts`; khách hết lượt
  thử → 1 request, không retry; `prefetchSpeech` với khách không đọc cache/không fetch. Thay ca cũ
  "chưa đăng nhập → ném lỗi" (hành vi đã bỏ có chủ đích).
- Cổng ở máy: xem báo cáo xác thực trong mô tả PR.

## Ghi chú vận hành (đã sửa ở đợt kế tiếp — `docs/changelog/0583-*.md`)

Lúc kiểm production, `/api/tts` và `/api/pronunciation` mỗi cái trả **429 một lần** khi chưa hề
gần hạn mức 60/phút, rồi trở lại bình thường. Đọc mã thấy cơ chế khớp: `getRedis()`
(`packages/core-auth/security.ts`) tạo client Redis **lười** ở lần gọi đầu, lúc đó
`status = 'connecting'`; `checkRateLimit` thấy chưa `ready` thì production **từ chối** (fail-closed)
→ request có rate limit ĐẦU TIÊN tới mỗi instance PM2 sau khi khởi động luôn nhận 429. Chưa đối
chiếu log server nên vẫn là giả thuyết. Đề xuất sửa ở đợt riêng: mở kết nối Redis ngay lúc server
khởi động, và/hoặc chờ ngắn (≤ `connectTimeout`) sự kiện `ready` khi client đang `connecting`
thay vì từ chối ngay.
