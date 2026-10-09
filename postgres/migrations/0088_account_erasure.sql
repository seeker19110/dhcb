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
-- Lũy đẳng THẬT (rà soát 0533): chạy lại không lỗi và KHÔNG drop/add lại gì — khoá ngoại tìm theo
-- CỘT trong `pg_constraint` (không giả định tên `payments_user_id_fkey`), chỉ tạo khi chưa có khoá
-- ngoại RESTRICT; CHECK chỉ tạo khi chưa có. Đã chạy 2 lần liên tiếp trên Postgres 16.
--
-- Khoá: FK và CHECK thêm bằng `NOT VALID` rồi `VALIDATE CONSTRAINT` ở câu riêng — bước quét chỉ cần
-- SHARE UPDATE EXCLUSIVE (payments) / ROW SHARE (users), không giữ SHARE ROW EXCLUSIVE trên
-- `public.users` trong lúc quét. LƯU Ý: `npm run migrate:pg` bọc CẢ FILE trong một transaction nên
-- mọi khoá vẫn giữ tới commit; lợi ích trọn vẹn chỉ có khi chạy tay từng câu ngoài transaction.
-- `payments` nhỏ (một dòng mỗi lần mua) nên quét rất nhanh ở cả hai cách.
--
-- ROLLBACK (chạy tay, theo thứ tự):
--   drop table if exists platform.account_erasure_log;
--   drop function if exists platform.account_erasure_log_append_only();
--   alter table public.payments drop constraint if exists payments_user_or_anonymized_check;
--   alter table public.payments drop constraint if exists payments_user_id_fkey;
--   -- (nếu khoá ngoại RESTRICT mang tên khác: tra `select conname from pg_constraint where
--   --  conrelid = 'public.payments'::regclass and contype = 'f'` rồi drop đúng tên đó)
--   alter table public.payments add constraint payments_user_id_fkey
--     foreign key (user_id) references public.users(id) on delete cascade not valid;
--   alter table public.payments validate constraint payments_user_id_fkey;
--   -- Chỉ khi KHÔNG còn đơn đã ẩn danh (nếu còn: giữ cột nullable — đó là chứng từ thật):
--   --   alter table public.payments alter column user_id set not null;
--   --   alter table public.payments drop column if exists anonymized_at;

-- ── 1. payments ────────────────────────────────────────────────────────────────
alter table public.payments add column if not exists anonymized_at timestamptz;

-- Không-op nếu cột đã nullable.
alter table public.payments alter column user_id drop not null;

-- 1a. Khoá ngoại trên payments.user_id: bỏ MỌI khoá ngoại không phải RESTRICT (cascade, set null,
--     no action… — bất kể tên), rồi thêm RESTRICT (NOT VALID) chỉ khi chưa có.
do $$
declare
  user_id_attnum smallint;
  fk record;
begin
  select attnum into strict user_id_attnum
    from pg_attribute
   where attrelid = 'public.payments'::regclass and attname = 'user_id' and not attisdropped;

  for fk in
    select conname
      from pg_constraint
     where conrelid = 'public.payments'::regclass
       and contype = 'f'
       and conkey = array[user_id_attnum]
       and confdeltype <> 'r'
  loop
    execute format('alter table public.payments drop constraint %I', fk.conname);
  end loop;

  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.payments'::regclass
       and contype = 'f'
       and conkey = array[user_id_attnum]
       and confrelid = 'public.users'::regclass
       and confdeltype = 'r'
  ) then
    alter table public.payments
      add constraint payments_user_id_fkey
      foreign key (user_id) references public.users(id) on delete restrict
      not valid;
  end if;
end;
$$;

-- 1b. Kiểm dữ liệu cũ cho khoá ngoại RESTRICT (tên tra động; đã hợp lệ thì bỏ qua).
do $$
declare
  fk record;
begin
  for fk in
    select c.conname
      from pg_constraint c
      join pg_attribute a
        on a.attrelid = c.conrelid and a.attnum = any (c.conkey) and a.attname = 'user_id'
     where c.conrelid = 'public.payments'::regclass
       and c.contype = 'f'
       and c.confdeltype = 'r'
       and not c.convalidated
  loop
    execute format('alter table public.payments validate constraint %I', fk.conname);
  end loop;
end;
$$;

-- 1c. Đơn không còn chủ thì phải có `anonymized_at`.
do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.payments'::regclass
       and conname = 'payments_user_or_anonymized_check'
  ) then
    alter table public.payments
      add constraint payments_user_or_anonymized_check
      check (user_id is not null or anonymized_at is not null)
      not valid;
  end if;
end;
$$;

-- Câu riêng; ràng buộc đã hợp lệ thì Postgres bỏ qua (không quét lại).
alter table public.payments validate constraint payments_user_or_anonymized_check;

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
