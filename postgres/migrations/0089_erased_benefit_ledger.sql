-- 0089_erased_benefit_ledger.sql — Sổ chống lạm dụng quyền lợi một-lần sau khi xoá tài khoản
-- (đặc tả docs/specs/2026-10-09-so-chong-lam-dung-sau-xoa-tai-khoan.md, changelog 0545).
--
-- Bối cảnh: xoá tài khoản (0088/0533) xoá luôn `profiles.signup_trial_granted_at`/`trial_granted_at`
-- và dòng `referrals` (kèm `device_hash`) ⇒ mở đường "dùng thử → xoá → đăng ký lại → dùng thử lại"
-- và "giới thiệu → xoá → giới thiệu lại". Hai thay đổi:
--
-- 1. SỔ `platform.erased_benefit_ledger` — tối thiểu, KHÔNG định danh:
--    - chỉ `subject_hash` = HMAC-SHA256(khoá bí mật của server, giá trị đã chuẩn hoá) của email /
--      mã thiết bị của tài khoản ĐÃ XOÁ, loại quyền lợi đã hưởng, số đơn vị, thời điểm;
--    - KHÔNG có user_id, KHÔNG có email/thiết bị dạng rõ; không khoá ngoại nào tới người dùng;
--    - giữ 12 tháng (job dọn hằng ngày ở server.ts + mọi câu tra đều tự lọc `created_at`).
--    Cơ sở: lợi ích hợp pháp — chống gian lận ưu đãi.
--
-- 2. `public.referrals.referrer_id` cho phép null + khoá ngoại `on delete set null` (trước: not null
--    + cascade). Dòng giới thiệu là dữ liệu của NGƯỜI ĐƯỢC MỜI: người mời xoá tài khoản thì chỉ gỡ
--    danh tính người mời (deleteAccount ẩn danh hoá `referrer_id`), dòng ở lại ⇒ người được mời
--    không thể "được mời lại" để nhận thưởng lần hai, và `device_hash` của họ vẫn chặn cày thưởng.
--    Ràng buộc `referrals_no_self_invite` (referrer_id <> referee_id) vẫn đúng với null.
--
-- 3. `public.referrals.reward_blocked_at` (timestamptz, null) — lượt mời bị sổ chặn thưởng (người
--    được mời trùng tài khoản đã xoá từng được thưởng). Đánh dấu để lượt đó không nằm "chờ" vĩnh
--    viễn (số `pendingCount` sai) và không tra sổ lại mỗi lần chấm bài.
--
-- Lũy đẳng: `if not exists` cho bảng/chỉ mục; khoá ngoại tìm theo CỘT trong `pg_constraint` (không
-- giả định tên), chỉ bỏ khoá ngoại không phải SET NULL và chỉ thêm khi chưa có. Chạy lại không
-- drop/add gì.
--
-- ROLLBACK — ⚠️ LÙI MÃ (PR của changelog 0545) TRƯỚC, rồi mới chạy các lệnh dưới. Lùi bảng/cột
-- trước mã thì `deleteAccount` (ghi sổ trong transaction xoá) và thưởng giới thiệu (đọc
-- `reward_blocked_at`) lỗi 500 cho tới khi mã được lùi. Chạy tay, theo thứ tự:
--   drop table if exists platform.erased_benefit_ledger;
--   alter table public.referrals drop column if exists reward_blocked_at;
--   -- Khoá ngoại referrer_id về cascade (tra tên: select conname from pg_constraint
--   --   where conrelid = 'public.referrals'::regclass and contype = 'f'):
--   alter table public.referrals drop constraint if exists referrals_referrer_id_fkey;
--   alter table public.referrals add constraint referrals_referrer_id_fkey
--     foreign key (referrer_id) references public.users(id) on delete cascade;
--   -- CHỈ khi chấp nhận mất các dòng có người mời đã xoá (mất chặn "được mời lại"):
--   --   delete from public.referrals where referrer_id is null;
--   --   alter table public.referrals alter column referrer_id set not null;

-- ── 1. Sổ chống lạm dụng ──────────────────────────────────────────────────────
create schema if not exists platform;

create table if not exists platform.erased_benefit_ledger (
  id           bigserial primary key,
  -- Loại chủ thể đã băm: email (đã chuẩn hoá) hay mã thiết bị (`referrals.device_hash`).
  subject_kind text not null check (subject_kind in ('email', 'device')),
  -- HMAC-SHA256 dạng hex. Khoá nằm ở biến môi trường server, KHÔNG nằm trong CSDL/backup.
  subject_hash text not null check (subject_hash ~ '^[0-9a-f]{64}$'),
  benefit      text not null
               check (benefit in ('signup_trial', 'referral_referee', 'referral_referrer')),
  -- Số đơn vị đã hưởng (vd số lượt mời đã được thưởng của người mời — để giữ trần qua lần xoá).
  units        integer not null default 1 check (units > 0),
  created_at   timestamptz not null default now()
);

-- Tra "chủ thể này đã từng hưởng quyền lợi X chưa".
create index if not exists erased_benefit_ledger_lookup_idx
  on platform.erased_benefit_ledger (subject_hash, benefit);

-- Job dọn theo hạn giữ 12 tháng.
create index if not exists erased_benefit_ledger_created_idx
  on platform.erased_benefit_ledger (created_at);

-- ── 2. referrals.reward_blocked_at ────────────────────────────────────────────
alter table public.referrals add column if not exists reward_blocked_at timestamptz;

-- ── 3. referrals.referrer_id: nullable + on delete set null ───────────────────
alter table public.referrals alter column referrer_id drop not null;

do $$
declare
  referrer_attnum smallint;
  fk record;
begin
  select attnum into strict referrer_attnum
    from pg_attribute
   where attrelid = 'public.referrals'::regclass and attname = 'referrer_id' and not attisdropped;

  -- Bỏ MỌI khoá ngoại trên referrer_id không phải SET NULL (cascade, no action… — bất kể tên).
  for fk in
    select conname
      from pg_constraint
     where conrelid = 'public.referrals'::regclass
       and contype = 'f'
       and conkey = array[referrer_attnum]
       and confdeltype <> 'n'
  loop
    execute format('alter table public.referrals drop constraint %I', fk.conname);
  end loop;

  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.referrals'::regclass
       and contype = 'f'
       and conkey = array[referrer_attnum]
       and confrelid = 'public.users'::regclass
       and confdeltype = 'n'
  ) then
    -- Dữ liệu cũ đã thoả khoá ngoại cascade cùng cột ⇒ NOT VALID + VALIDATE riêng là an toàn.
    alter table public.referrals
      add constraint referrals_referrer_id_fkey
      foreign key (referrer_id) references public.users(id) on delete set null
      not valid;
  end if;
end;
$$;

do $$
declare
  fk record;
begin
  for fk in
    select c.conname
      from pg_constraint c
      join pg_attribute a
        on a.attrelid = c.conrelid and a.attnum = any (c.conkey) and a.attname = 'referrer_id'
     where c.conrelid = 'public.referrals'::regclass
       and c.contype = 'f'
       and c.confdeltype = 'n'
       and not c.convalidated
  loop
    execute format('alter table public.referrals validate constraint %I', fk.conname);
  end loop;
end;
$$;
