# 0558 — Hội thoại CEFR: seed do SERVER cấp (token HMAC), không trả đáp án câu sai (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** (điền sau khi tạo) · **Loại:** `feat(cefr)`
- **Nguồn:** nợ 🟡 `PROGRESS.md` "[rà soát bảo mật changelog `0555`] Kiểm tra hiểu hội thoại CEFR
  chưa chống người đọc mã có chủ ý" — chủ dự án chốt "làm mục 1 seed HMAC". Đặc tả
  `docs/specs/2026-10-09-hoi-thoai-cefr-seed-server-cap.md` (Approved for implementation).

## Vấn đề

Đợt `0555` để client chọn seed và server dựng lại đề từ cùng seed. Vì `dialogues.json` + thuật
toán sinh đề đều công khai, ai đọc mã vẫn tự tính được đáp án trước khi nộp; server còn trả
`correctId` sau khi chấm nên dò qua nhiều lượt cũng được.

## Đã làm

1. **`packages/core-auth/attemptToken.ts`** (mới, dùng chung được cho mọi loại "lượt"): token
   `v1.<payload>.<HMAC-SHA256>`; khoá ký suy bằng HKDF-SHA256 từ `USER_DATA_MASTER_KEY` (đã bắt
   buộc ở production — KHÔNG thêm biến môi trường); dev/test thiếu khoá → khoá ngẫu nhiên theo tiến
   trình, cảnh báo một lần; production thiếu khoá → `SigningKeyUnavailableError`. **Seed ẩn** =
   HMAC(khoá, `scope|seed|chữ ký`) — client cầm token nhưng không có khoá nên không tính được seed.
   Verify so chữ ký `timingSafeEqual` TRƯỚC rồi mới xem hạn. 15 test.
2. **Hợp đồng `packages/core-contracts/cefrDialogueCheck.ts`:** thêm action `cefr-dialogue-start`
   (`DialogueStartInputSchema` → `DialogueStartResultSchema`: `token · expiresAt · questions` bản
   CÔNG KHAI `PublicDialogueQuestionSchema` không `correctId`/`explanation`); nộp đổi thành
   `{ token, answers }` (bỏ `ownerId/titleEn/direction/attempt` — đã ký trong token); kết quả từng
   câu bỏ `correctId`, thêm `explanation?` **chỉ khi đúng**; mã lỗi mới `ATTEMPT_EXPIRED`.
3. **Server `apps/server/src/api/_lib/cefrDialogueCheck.ts`:** `handleCefrDialogueStart` (12 lượt
   mở/phút/tài khoản, ký token gắn `userId`+owner+title+chiều, TTL 60 phút, dựng đề từ seed ẩn,
   trả bản công khai qua `toPublicComprehensionQuestion`); `handleCefrDialogueCheck` verify token
   (sai chữ ký / của user khác → 409 `ATTEMPT_EXPIRED` + sự kiện `ATTEMPT_TOKEN_REJECTED`; hết hạn →
   409 không log), suy lại seed, chấm, khoá lượt theo băm chữ ký (24 giờ), ghi "đã học" như cũ.
   `evidence.ts` gắn action mới. Test viết lại: 32 ca (thân phản hồi không chứa `correctId`,
   `explanation` của câu sai, lẫn seed; token sửa một ký tự / user khác / scope khác / quá hạn;
   thiếu khoá ở production → 503; các ca 0555 giữ nguyên ý).
4. **Client:** `dialogueCheckClient.ts` thêm `startDialogueCheck` (outcome `started | no-quiz |
offline | auth | rate-limited | unavailable | error`), `submitDialogueCheck` nhận token và thêm
   `attempt-expired`; hợp đồng `.strict()` ở client từ chối luôn phản hồi có `correctId` lọt vào.
   `DialogueComprehensionCheck.tsx`: đã đăng nhập → "Đang lấy câu hỏi…" (`role=status`,
   `aria-busy`) → đề server; mở lượt thất bại → "Chưa lấy được câu hỏi" + lý do + Thử lại; nộp lỗi
   tạm → "Chưa chấm được lượt này" (KHÔNG còn điểm chấm tại máy — máy không có đáp án), giữ nguyên
   lựa chọn, Gửi lại gửi lại đúng token; **câu sai không hiện "Đáp án đúng"**, chỉ "Xem lại đoạn
   này trong hội thoại rồi làm lại"; Làm lại = mở lượt mới. Khách giữ luồng tại máy (có lời giải).
   27 test màn + 10 test client.
5. Tài liệu: `.env.example` ghi khoá gốc còn ký token lượt; skill `pedagogy-linguistics-master` hai
   bản gương; nợ `PROGRESS.md` đóng → `docs/legacy/no-ky-thuat-da-dong.md`.

## Sau rà soát độc lập (bảo mật + lỗi im lặng) — đã vá trong cùng đợt

- **Chữ ký base64url chuẩn tắc** (`attemptToken.ts`): `Buffer.from(sig,'base64url')` bỏ qua bit
  thừa/ký tự rác nên một token có thể có nhiều "chữ ký" → nhiều khoá lượt (lách "mỗi lượt một lần")
  và nhiều seed. Nay so lại `b64url(decoded) === sig`; test ký tự cuối/ký tự rác.
- **Nộp khi khoá ký đã bị gỡ ở production → 503** (trước là 500 chung).
- **409 `ATTEMPT_USED` kèm `saved`**: mất phản hồi SAU khi server ghi "đã học" → Gửi lại nhận 409
  nhưng màn hiện "Đã học — ghi từ lượt trước" và `onVerified`.
- **`key` ở nơi gọi** (`CefrLessonViews.tsx`): đổi hội thoại/chiều/đăng nhập giữa chừng = màn mới,
  không dính state lượt cũ. Effect mở lượt có cleanup + `.catch` lưới an toàn.

**Giới hạn còn lại (ghi thật, xem đặc tả ⑤b):** đáp án vẫn TRA được từ đề công khai +
`dialogues.json` bằng script — seed ẩn không chặn được, chỉ chặn tính-trước-khi-mở-lượt, replay và
xem-đáp-án-câu-sai; đoán mò ~16–26 %/lượt chưa có trần số lần sai. Hai điểm này ghi nợ 🟡 trong
`PROGRESS.md` cho chủ dự án quyết (đổi kiến trúc dữ liệu hội thoại / thêm trần sai).

## Không đổi (cố ý)

- Không migration; không biến môi trường mới; không thư viện mới (`node:crypto`).
- Cách ghi `cefr_dialogues`, lọc `learned|…` ở `/api/progress`, cộng thưởng ngày học: y nguyên 0555.
- Không chống "học thuộc" (nhìn đề → đọc lại hội thoại → trả lời là ĐÚNG mục đích); dò bằng nộp sai
  chỉ biết "phương án này sai" của đề đó, mỗi lượt đề/thứ tự khác, 6 lượt nộp/phút.

## Đánh đổi

- Người đã đăng nhập cần MỘT vòng gọi server trước khi làm bài (có trạng thái tải), và mất lời giải
  của câu SAI (có chủ đích: lời giải trích nguyên văn đáp án). Câu đúng vẫn có lời giải.
- Khởi động lại server ở dev (không khoá) làm token đang dở hết hiệu lực → màn báo "hết hạn, Làm
  lại". Production dùng khoá cố định nên không bị.

## Bằng chứng

Xem mô tả PR: typecheck/lint/prettier/codemap/check:specs/audit:prose/gitleaks + vitest liên quan

- ảnh Tầng 8b (đang tải · đề server · nộp sai không lộ đáp án · chưa chấm vì mất mạng · mở lượt
  thất bại) ở 1440 + 390.
