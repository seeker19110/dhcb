-- 0091_audit_indexes.sql — Chỉ mục còn thiếu, phát hiện ở audit toàn diện 2026-10-10 (mục E3,
-- docs/audit/2026-10-10-audit-toan-dien-va-toi-uu.md; changelog 0583).
--
-- Mỗi chỉ mục phục vụ một truy vấn/thao tác THẬT đang quét cả bảng:
--   1. daily_usage(day)        — nhắc học qua email + thống kê admin lọc `where day = $1` /
--                                `day >= $1` KHÔNG kèm user_id (khoá chính bắt đầu bằng user_id
--                                nên không dùng được).
--   2. chat.messages(sender_id) — khoá ngoại `on delete set null`: xoá một tài khoản phải quét cả
--                                bảng tin nhắn để gỡ sender_id.
--   3. analytics_events(user_id) — khoá ngoại `on delete set null`, cùng lý do.
--   4. analytics_events(created_at) — job dọn sự kiện quá 365 ngày (chủ dự án chốt 2026-10-10).
--   5. sessions(expires)       — job dọn phiên đăng nhập hết hạn.
--   6. push_subscriptions(endpoint) — xoá subscription hết hạn `where endpoint = any($1)` sau mỗi
--                                lượt gửi nhắc/chat; ràng buộc unique (user_id, endpoint) bắt đầu
--                                bằng user_id nên không dùng được.
--   7. Bảng xếp hạng PvP       — `order by (state->>'eloRating')::int desc` trên feature_state
--                                (partial: chỉ dòng `pvp_profile`). Biểu thức PHẢI trùng từng ký tự
--                                với truy vấn ở apps/server/src/api/platform/pvp-arena.ts.
--
-- KHÔNG dùng `create index concurrently`: scripts/run-pg-migrations.ts bọc mỗi file trong một
-- transaction (concurrently không chạy được trong transaction). `create index` thường khoá GHI
-- (không khoá đọc) trên bảng trong lúc tạo — với quy mô người dùng hiện tại là ngắn. CHƯA đo số
-- dòng production: nếu lo, chạy `select count(*)` từng bảng trên VPS trước khi merge.
-- Lũy đẳng: `if not exists` — chạy lại không lỗi.
--
-- ROLLBACK (chạy tay, an toàn bất cứ lúc nào — chỉ mục không mang dữ liệu):
--   drop index if exists public.daily_usage_day_idx;
--   drop index if exists chat.messages_sender_idx;
--   drop index if exists public.analytics_events_user_idx;
--   drop index if exists public.analytics_events_created_idx;
--   drop index if exists public.sessions_expires_idx;
--   drop index if exists public.push_subscriptions_endpoint_idx;
--   drop index if exists platform.feature_state_pvp_elo_idx;

create index if not exists daily_usage_day_idx on public.daily_usage (day);

create index if not exists messages_sender_idx on chat.messages (sender_id);

create index if not exists analytics_events_user_idx on public.analytics_events (user_id);

create index if not exists analytics_events_created_idx on public.analytics_events (created_at);

create index if not exists sessions_expires_idx on public.sessions (expires);

create index if not exists push_subscriptions_endpoint_idx on public.push_subscriptions (endpoint);

create index if not exists feature_state_pvp_elo_idx
  on platform.feature_state (((state ->> 'eloRating')::int) desc, updated_at)
  where feature = 'pvp_profile';
