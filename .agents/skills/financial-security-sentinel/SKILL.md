---
name: financial-security-sentinel
description: 'Kỹ năng Nghiệp vụ Tài chính, Thanh toán, Kiểm soát Chi phí AI & Bảo mật (Financial Integrity, Billing, SePay Webhook, đếm lượt AI, Zero-Trust Auth, OWASP). Kích hoạt khi đụng tới thanh toán, gói cước, webhook ngân hàng, cấp quyền/entitlements, chi phí token LLM, xác thực auth, cookie/token và bảo mật dữ liệu.'
---

# FINANCIAL INTEGRITY, BILLING & SECURITY SENTINEL

Quy chuẩn tài chính, thanh toán, phần thưởng, chi phí AI và bảo mật cho Đồng Hành. Đụng vùng này
là vùng **dừng và hỏi** (CLAUDE.md mục 12): thanh toán, dữ liệu người dùng thật, quyền truy cập.
Rà diff bằng subagent `security-reviewer` + `silent-failure-hunter` (rào an ninh/tiền FAIL-OPEN) +
`database-reviewer` (SQL/migration).

> **Đối chiếu mã ngày 2026-10-02 (luồng hoàn tiền/huỷ đơn cập nhật 2026-10-09, changelog 0546).** Bản trước của skill này mô tả webhook ký HMAC, trạng thái
> `processing/completed`, mốc thưởng referral 1/3/5/10, "rương" streak freeze, trần chi phí USD tự
> hạ model — đều KHÔNG khớp mã. Mục dưới ghi đúng thực tế. Khi skill và mã lệch nhau, **MÃ thắng**.

---

## 1. GÓI CƯỚC & THANH TOÁN SEPAY

**Gói (nguồn sự thật `packages/core-billing/plan.ts`):** đúng HAI gói — `free` (30 lượt AI/ngày,
cấu hình ở `/admin`) và `vip` (gói trả phí duy nhất). Gói `plus`/`pro` đã xoá (migration `0076`);
dòng cũ trong DB được đọc thành `vip` tới hết `plan_expires_at`. Giá VIP đọc từ bảng `plan_prices`
(`packages/core-billing/prices.ts`), không gán cứng ở client.

**Luồng webhook thật** (`apps/server/src/api/billing/payment-webhook.ts`):

```
[SePay POST webhook]
   │ Header `Authorization: Apikey <SEPAY_WEBHOOK_API_KEY>`
   ▼
[verifySepayApiKey — timingSafeEqual] ──(sai)──► 401 + logSecurityEvent
   │ (đúng)
   ▼
[Bỏ qua tiền RA; tách mã thanh toán từ code/content] ──(không khớp đơn)──► 200 + log UNMATCHED
   ▼
[Đơn đã 'paid'?] ──(rồi)──► 200 (idempotent)
   ▼
[Đơn 'cancelled' (người dùng tự huỷ) hoặc user_id null (tài khoản đã xoá)?]
   ──(có)──► INSERT payment_refunds … ON CONFLICT DO NOTHING ──► 200, KHÔNG cấp gói
   ▼                          (lỗi CSDL ⇒ ném 500 để SePay gửi lại)
[Quá hạn đơn + ân hạn 24h?] ──(quá)──► 200 + log LATE, giữ 'pending' cho admin đối chiếu
   ▼
[Chuyển THIẾU tiền?] ──(thiếu)──► 200 + log INSUFFICIENT, giữ 'pending'
   ▼
[withTransaction]
   ├── UPDATE payments SET status='paid', provider_txn_id=… WHERE id=… AND status='pending'
   │     (rowCount=0 → đọc lại user_id, status: vừa bị huỷ/ẩn danh → ghi payment_refunds
   │      trong CÙNG transaction; còn lại = request khác vừa xử lý xong → dừng)
   └── grantPlanDays(user, plan, days, now, client)   ← cùng transaction
   ▼
[200 OK] (lỗi 23505 trùng provider_txn_id → coi như đã xử lý)
```

### Nguyên tắc bất biến

1. **Xác thực webhook** bằng API key so sánh hằng thời gian (`timingSafeEqual`,
   `packages/core-billing/sepay.ts`) TRƯỚC khi tin payload. SePay **không** ký HMAC — đừng viết
   code/test giả định có chữ ký.
2. **Chống trùng hai lớp:** `WHERE status = 'pending'` (Postgres khoá dòng khi UPDATE nên hai
   webhook song song chỉ một cái thắng) + `UNIQUE` trên `provider_txn_id`. SePay retry tới 7 lần —
   mọi nhánh đã xử lý phải trả `200`.
3. **Đánh dấu đã trả và cấp gói trong CÙNG một `withTransaction`.** Tách ra là user mất tiền mà
   không có gói, và retry bị chặn ở nhánh `'paid'` nên không tự phục hồi.
4. **Không tự cấp gói khi lệch:** chuyển thiếu, đơn quá hạn quá ân hạn → giữ `pending`, ghi log
   để admin đối chiếu tay.
5. **Tiền về đơn người dùng đã từ chối/không còn chủ ⇒ hàng chờ hoàn tiền, không chỉ log**
   (changelog 0546, migration `0090`). Đơn `cancelled` (người dùng tự huỷ qua
   `POST /api/payment-cancel` — UPDATE có điều kiện `user_id = <phiên> and status = 'pending'`,
   đua với webhook thì đúng một bên thắng) hoặc `user_id null` (xoá tài khoản, 0533) ⇒ dòng
   `public.payment_refunds` (UNIQUE `(provider, provider_txn_id)`; chỉ lưu mã giao dịch, mã tham
   chiếu, ngân hàng, TK nhận, thời điểm — KHÔNG lưu nội dung CK). Admin hoàn tay rồi
   `mark-refunded` (ghi chú bắt buộc); trigger chỉ cho `needed → refunded`, cấm sửa/xoá ⇒ dòng là
   bản ghi kiểm toán. Khớp tay (`manual-match`) đơn `cancelled` bị chặn.
6. **Xoá tài khoản chặn khi còn đơn `pending` "sống"** (`LIVE_PENDING_CONDITION_SQL` trong
   `packages/core-billing/paymentCancel.ts` — MỘT điều kiện dùng chung cho chốt trong transaction
   của `deleteAccount`, danh sách đơn ở giao diện, và khớp với ân hạn của webhook). Người dùng tự
   gỡ chặn bằng nút "Huỷ đơn — tôi CHƯA chuyển khoản" (bắt tick xác nhận).

---

## 2. PHẦN THƯỞNG VIP & NHIỆM VỤ

1. **Mời bạn (`apps/server/src/api/_lib/referral.ts`):** `REFERRAL_REWARD_DAYS = 7` ngày VIP cho
   **cả hai** bên, cấp qua `grantPlanDays` trong cùng transaction, khoá theo thứ tự cố định để
   tránh deadlock. Điều kiện đủ và trần số lần thưởng của người mời do server tự kiểm — đọc file
   trước khi đổi. Mỗi người chỉ được mời một lần.
   - **Sổ chống lạm dụng sau xoá tài khoản** (`packages/core-billing/erasedBenefitLedger.ts`,
     changelog 0545): xoá tài khoản ghi HMAC email/thiết bị + quyền lợi đã hưởng vào
     `platform.erased_benefit_ledger` (12 tháng, không user_id/plaintext). Cấp dùng thử
     (`packages/core-auth/trial.ts`) và thưởng giới thiệu tra sổ trước; trần người mời cộng lượt
     của tài khoản cũ cùng email. Thiếu `ERASED_BENEFIT_LEDGER_KEY` ⇒ sổ tắt, KHÔNG chặn xoá.
   - **CHƯA CÓ:** lộ trình mốc 1/3/5/10 bạn và danh hiệu.
2. **Nhiệm vụ (`apps/server/src/api/_lib/quests.ts`):** 4 nhiệm vụ, xếp theo độ tin cậy xác minh.
   "Chia sẻ công khai" và "Học liên tiếp N ngày" **đã tắt thưởng VIP** (thưởng 0 ngày) vì client
   không chứng minh được; "Thi đạt cấp CEFR" thưởng 3 ngày và chỉ đọc kết quả do server chấm.
   **Luật: không cấp quyền lợi từ thứ client tự khai.**
3. **Cộng dồn hạn:** `grantPlanDays` (`packages/core-billing/planGrant.ts`) tính hạn mới từ hạn cũ
   — đừng viết đường cấp gói thứ hai.
4. **Streak freeze:** chỉ có mảng `streak_freeze_dates` trong tiến độ người học
   (`apps/server/src/api/core/progress.ts`). **CHƯA CÓ** "rương bí ẩn" hay token freeze thưởng từ
   nhiệm vụ.

---

## 3. CHI PHÍ AI

1. **Giới hạn thật = đếm lượt theo gói:** mọi lệnh gọi AI phải qua
   `checkAndConsumeUsage` (`packages/core-billing/usage.ts`) — Free 30 lượt/ngày tính tổng mọi
   tính năng, VIP theo cấu hình. Đếm ở SERVER, nguyên tử qua hàm SQL `consume_usage_total`; lỗi
   CSDL thì **từ chối** chứ không cho qua (fail-closed) — giữ nguyên tính chất này khi sửa.
   Audio TTS cũng là chi phí AI: đường TẠO audio mới (cache MISS) của `/api/tts` và
   `/api/pronunciation` trừ lượt mode `speaking` trước khi gọi provider; cache HIT miễn phí
   (`/api/pronunciation` thêm từ changelog 0534).
   **Phanh khẩn cấp thật:** cầu dao `aiCircuitBreaker` (admin bật qua `/api/admin-settings`, migration
   `0005_ai_circuit_breaker.sql`) chặn MỌI lệnh gọi AI ngay, không phân biệt gói.
2. **Model do server quyết** ở `packages/core-ai/aiConfig.ts` (client không chọn model). Đổi model
   hoặc prompt → chạy lại `npm run eval:tutor` / `npm run eval:code-feedback` (CLAUDE.md mục 8).
3. **Prompt caching:** `packages/core-ai/chatProviders.ts` gắn `cache_control` cho Anthropic; theo
   dõi chi phí theo năng lực ở `packages/core-ai/capabilityCostTracker.ts`.
   - **CHƯA CÓ:** trần chi phí USD/ngày toàn hệ thống và tự hạ model khi chạm trần —
     `checkBudgetExceeded` có trong `capabilityCostTracker` nhưng **chưa nơi nào gọi**. Đừng mô tả
     như đã có.

---

## 4. BẢO MẬT ZERO-TRUST & QUYỀN RIÊNG TƯ

1. **`validateAuth(req)`** ở mọi handler nhạy cảm để lấy `userId` từ token. **CẤM** nhận
   `userId` từ `req.body`/`req.query` mà không so với token (IDOR). Không có RLS — kiểm quyền là
   việc của handler (CLAUDE.md mục 4.2).
2. **Không lộ bí mật:** key qua biến môi trường, đọc `.env` phải hỏi người dùng; log không chứa
   token/key.
3. **Dữ liệu riêng tư:** ẩn danh hoá trước khi gửi API bên ngoài khi có thể; audio cache trên
   Cloudflare R2 mã hoá `AES-256-GCM` (`packages/core-ai/fileStorage.ts`).
