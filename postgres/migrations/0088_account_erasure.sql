-- 0088_account_erasure.sql — Xoá tài khoản + xuất dữ liệu (đặc tả
-- docs/specs/2026-10-08-xoa-tai-khoan-va-xuat-du-lieu.md, changelog 0533).
--
-- Hai thay đổi:
--
-- 1. CHỨNG TỪ THANH TOÁN KHÔNG BỊ XOÁ DÂY CHUYỀN.
--    Trước đây `public.payments.user_id` là `not null` + `on delete cascade`: xoá một người dùng là
--    xoá luôn đơn thanh toán của họ — mất chứng từ kế toán (Luật Kế toán 2015 Đ.41: lưu tối thiểu
--    5 năm) và làm lệch số doanh thu ở /admin. Nay:
--      - thêm `anonymized_at` (thời điểm gỡ danh tính khỏi đơn);
--      - `user_id` cho phép null;
--      - khoá ngoại đổi sang `on delete RESTRICT`: muốn xoá người dùng thì PHẢI ẩn danh hoá đơn
--        trước (đúng việc `deleteAccount` làm trong cùng transaction). Một đường xoá user khác
--        quên bước này sẽ bị Postgres chặn thay vì âm thầm xoá chứng từ;
--      - ràng buộc: đơn không còn chủ thì phải có `anonymized_at` (không có "đơn mồ côi" không rõ
--        vì sao mất chủ).
--
-- 2. NHẬT KÝ XOÁ TÀI KHOẢN (append-only) `platform.account_erasure_log`.
--    Không chứa dữ liệu cá nhân: chỉ `subject_hash` = sha256("dhcb:account-erasure:v1:" || user_id)
--    (user_id là UUID ngẫu nhiên ⇒ không dò ngược), thời điểm, số dòng theo từng bảng.cột. Trigger
--    chặn UPDATE/DELETE/TRUNCATE để nhật ký không bị sửa lén.
--
-- Lũy đẳng (chạy lại không lỗi, đã chạy 2 lần trên Postgres 16).
--
-- ROLLBACK:
--   drop table if exists platform.account_erasure_log;
--   drop function if exists platform.account_erasure_log_append_only();
--   alter table public.payments drop constraint if exists payments_user_or_anonymized_check;
--   alter table public.payments drop constraint if exists payments_user_id_fkey;
--   alter table public.payments add constraint payments_user_id_fkey
--     foreign key (user_id) references public.users(id) on delete cascade;
--   -- Chỉ khi KHÔNG còn đơn đã ẩn danh (nếu còn: giữ cột nullable — đó là chứng từ thật):
--   --   alter table public.payments alter column user_id set not null;
--   --   alter table public.payments drop column if exists anonymized_at;

-- ── 1. payments ────────────────────────────────────────────────────────────────
alter table public.payments add column if not exists anonymized_at timestamptz;

alter table public.payments alter column user_id drop not null;

alter table public.payments drop constraint if exists payments_user_id_fkey;
alter table public.payments
  add constraint payments_user_id_fkey
  foreign key (user_id) references public.users(id) on delete restrict;

alter table public.payments drop constraint if exists payments_user_or_anonymized_check;
alter table public.payments
  add constraint payments_user_or_anonymized_check
  check (user_id is not null or anonymized_at is not null);

-- ── 2. Nhật ký xoá tài khoản ──────────────────────────────────────────────────
create schema if not exists platform;

create table if not exists platform.account_erasure_log (
  id                       uuid primary key default gen_random_uuid(),
  subject_hash             text not null check (subject_hash ~ '^[0-9a-f]{64}$'),
  erased_at                timestamptz not null default now(),
  initiated_by             text not null check (initiated_by in ('self')),
  -- { "<schema.bảng.cột>": { "action": "delete" | "anonymize", "rows": <số> } }
  table_counts             jsonb not null check (jsonb_typeof(table_counts) = 'object'),
  records_deleted_count    integer not null check (records_deleted_count >= 0),
  records_anonymized_count integer not null check (records_anonymized_count >= 0),
  -- Dòng tương ứng trong platform.person_erasure_log (null nếu người dùng chưa có Person).
  person_erasure_log_id    uuid
);

create index if not exists account_erasure_log_subject_idx
  on platform.account_erasure_log (subject_hash);

create or replace function platform.account_erasure_log_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'platform.account_erasure_log là nhật ký chỉ-thêm: cấm %', tg_op;
end;
$$;

drop trigger if exists account_erasure_log_no_update_delete on platform.account_erasure_log;
create trigger account_erasure_log_no_update_delete
  before update or delete on platform.account_erasure_log
  for each row execute function platform.account_erasure_log_append_only();

drop trigger if exists account_erasure_log_no_truncate on platform.account_erasure_log;
create trigger account_erasure_log_no_truncate
  before truncate on platform.account_erasure_log
  for each statement execute function platform.account_erasure_log_append_only();
