# 0583 — Đợt E3 audit: chỉ mục còn thiếu + job dọn dữ liệu hết hạn

- **Ngày:** 2026-10-10 · **PR:** (xem mô tả PR) · **Loại:** `perf(db)`
- **Nguồn:** báo cáo `docs/audit/2026-10-10-audit-toan-dien-va-toi-uu.md` mục E3. Người dùng yêu
  cầu "làm tiếp tất cả các đợt khác" và **chốt giữ `analytics_events` 365 ngày** (đây là xoá dữ
  liệu thật — đã hỏi trước khi làm).

## Đã làm

1. **Migration `postgres/migrations/0091_audit_indexes.sql`** — 7 chỉ mục, mỗi cái gắn với một truy
   vấn/thao tác đang quét cả bảng: `daily_usage(day)`, `chat.messages(sender_id)`,
   `analytics_events(user_id)`, `analytics_events(created_at)`, `sessions(expires)`,
   `push_subscriptions(endpoint)`, và chỉ mục biểu thức partial cho bảng xếp hạng PvP
   (`((state->>'eloRating')::int) desc, updated_at where feature = 'pvp_profile'`). Có dòng README,
   rollback (`drop index`) ở đầu file.
2. **Job dọn hằng ngày** `apps/server/src/api/_lib/retentionCleanup.ts` + `startRetentionCleanup()`
   trong `server.ts` (chỉ instance PM2 số 0, lịch `startDailyJob` như các job dọn khác):
   - phiên đăng nhập đã hết hạn;
   - token đặt lại mật khẩu / mã xác thực email đã hết hạn **quá 1 ngày** (cooldown gửi lại chỉ
     xét dòng còn hạn nên không bị ảnh hưởng);
   - `analytics_events` cũ hơn **365 ngày**, xoá theo lô 5.000 dòng, tối đa 200 lô/ngày — lần
     chạy đầu không tạo một câu DELETE khổng lồ chạm `statement_timeout` 60s (đợt E1).

## Quyết định

- **Không dùng `create index concurrently`**: `scripts/run-pg-migrations.ts` bọc mỗi file trong
  transaction. `create index` thường chỉ khoá GHI bảng trong lúc tạo. **Chưa đo số dòng
  production** — nếu lo, chạy `select count(*)` từng bảng trên VPS trước khi merge.
- Chỉ mục PvP dùng đúng biểu thức `::int` của truy vấn hiện có (`pvp-arena.ts`) để planner dùng
  được; truy vấn đó vốn đã ép `::int` trên mọi dòng `pvp_profile` nên tạo chỉ mục không thêm rủi ro
  ép kiểu mới.

## Bằng chứng kiểm chứng

| Kiểm                                                    | Kết quả                                                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Tầng 11: Postgres 16 rỗng, `npm run migrate:pg` hai lần | 94/94 migration áp được; lần 2 "không có gì mới" (lũy đẳng)                                             |
| `npm run check:sql` trên DB vừa migrate                 | ✅ PREPARE 626 câu (gồm 4 câu dọn dữ liệu mới), 1 câu miễn theo allowlist sẵn có                        |
| `EXPLAIN` (tắt seqscan)                                 | bảng xếp hạng PvP → `feature_state_pvp_elo_idx`; dọn phiên → `sessions_expires_idx`                     |
| Test                                                    | `retentionCleanup.test.ts` (5 ca: đúng bảng/điều kiện, 365 ngày, xoá theo lô, trần lô, lỗi CSDL ném ra) |

Các cổng còn lại (typecheck sạch, lint, format, test:coverage, build): xem mô tả PR.
