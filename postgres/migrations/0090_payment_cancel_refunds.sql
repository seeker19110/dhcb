-- 0090_payment_cancel_refunds.sql — Người dùng tự huỷ đơn chờ trả + hàng chờ hoàn tiền.
-- Đặc tả: docs/specs/2026-10-09-huy-don-cho-de-xoa-tai-khoan.md (changelog 0546).
--
-- Bối cảnh: changelog 0533 chặn xoá tài khoản tới ~24,5 giờ khi còn đơn SePay `pending` "sống"
-- (webhook vẫn tự cấp gói cho tiền chuyển muộn). Đợt này cho người dùng TỰ GỠ CHẶN an toàn:
--
-- 1. `public.payments` thêm trạng thái `cancelled` (người dùng tự huỷ — "tôi CHƯA chuyển khoản")
--    + `cancelled_at` + `cancel_reason`. Ràng buộc: đơn `cancelled` PHẢI có đủ thời điểm + lý do.
--    `cancelled` là trạng thái MỚI vì 4 trạng thái cũ đều sai nghĩa: `expired` = hết hạn tự nhiên
--    / do xoá tài khoản (0088), `failed` = lỗi xử lý; người dùng chủ động từ chối là sự kiện riêng
--    mà admin cần phân biệt khi hoàn tiền.
--
-- 2. Bảng `public.payment_refunds` — HÀNG CHỜ HOÀN TIỀN THỦ CÔNG: tiền SePay về cho đơn đã huỷ
--    hoặc đã ẩn danh (tài khoản đã xoá). Webhook KHÔNG cấp gói cho các đơn này mà ghi một dòng ở
--    đây để admin hoàn tiền và đánh dấu "đã hoàn".
--    - Chỉ lưu thông tin SePay CẦN cho hoàn tiền: mã giao dịch SePay, mã tham chiếu ngân hàng,
--      ngân hàng (gateway), số tài khoản NHẬN (của ta), thời điểm giao dịch, số tiền. KHÔNG lưu
--      nội dung chuyển khoản (`content`/`description` — thường chứa họ tên người gửi): admin tra
--      sao kê ngân hàng theo mã tham chiếu để biết tài khoản nguồn.
--    - `provider_txn_id` UNIQUE: SePay retry tới 7 lần ⇒ một giao dịch chỉ sinh MỘT dòng.
--    - Chuyển trạng thái MỘT CHIỀU `needed → refunded` (trigger chặn mọi sửa khác + cấm xoá/
--      truncate) ⇒ dòng `refunded` chính là bản ghi kiểm toán (ai, khi nào, ghi chú) không sửa lén.
--    - `refunded_by` = id admin (KHÔNG khoá ngoại: bản ghi kiểm toán phải sống qua việc xoá tài
--      khoản admin; admin là danh sách cấu hình `ADMIN_USER_IDS`, không phải người dùng thường).
--
-- Lũy đẳng: chạy lại không lỗi, không drop/add lại ràng buộc đã đúng.
--
-- ROLLBACK (chạy tay, theo thứ tự — CHỈ khi chưa có dòng nào cần giữ; xuất bảng
-- payment_refunds ra file trước nếu còn dòng `needed`, đó là tiền chưa hoàn):
--   -- BƯỚC 1: đưa đơn `cancelled` về `expired` (mất thông tin huỷ). Chạy KHI CHECK
--   -- payments_cancelled_fields_check CÒN HIỆU LỰC — nó buộc xoá cả hai cột huỷ cùng lúc:
--   update public.payments set status = 'expired', cancelled_at = null, cancel_reason = null
--    where status = 'cancelled';
--   drop table if exists public.payment_refunds;
--   drop function if exists public.payment_refunds_guard();
--   alter table public.payments drop constraint if exists payments_cancelled_fields_check;
--   alter table public.payments drop constraint if exists payments_status_check;
--   alter table public.payments add constraint payments_status_check
--     check (status in ('pending', 'paid', 'failed', 'expired'));
--   alter table public.payments drop column if exists cancel_reason;
--   alter table public.payments drop column if exists cancelled_at;

-- ── 1. payments: trạng thái `cancelled` ───────────────────────────────────────
alter table public.payments add column if not exists cancelled_at timestamptz;
alter table public.payments add column if not exists cancel_reason text;

-- CHECK trạng thái tạo inline ở 0015 ⇒ Postgres đặt tên `payments_status_check`. Tìm theo NỘI
-- DUNG (mọi CHECK trên cột status) thay vì giả định tên; chỉ thay khi chưa có 'cancelled'.
do $$
declare
  status_attnum smallint;
  ck record;
  has_cancelled boolean := false;
begin
  select attnum into strict status_attnum
    from pg_attribute
   where attrelid = 'public.payments'::regclass and attname = 'status' and not attisdropped;

  for ck in
    select conname, pg_get_constraintdef(oid) as def
      from pg_constraint
     where conrelid = 'public.payments'::regclass
       and contype = 'c'
       and conkey = array[status_attnum]
  loop
    if ck.def like '%''cancelled''%' then
      has_cancelled := true;
    else
      execute format('alter table public.payments drop constraint %I', ck.conname);
    end if;
  end loop;

  if not has_cancelled then
    alter table public.payments
      add constraint payments_status_check
      check (status in ('pending', 'paid', 'failed', 'expired', 'cancelled'));
  end if;
end;
$$;

-- Đơn `cancelled` phải có thời điểm + lý do; đơn khác KHÔNG được mang dấu huỷ.
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.payments'::regclass
       and conname = 'payments_cancelled_fields_check'
  ) then
    alter table public.payments
      add constraint payments_cancelled_fields_check
      check (
        (status = 'cancelled' and cancelled_at is not null
           and cancel_reason in ('user_not_transferred'))
        or (status <> 'cancelled' and cancelled_at is null and cancel_reason is null)
      )
      not valid;
  end if;
end;
$$;

alter table public.payments validate constraint payments_cancelled_fields_check;

-- ── 2. Hàng chờ hoàn tiền thủ công ────────────────────────────────────────────
create table if not exists public.payment_refunds (
  id                 uuid primary key default gen_random_uuid(),
  -- Chứng từ gốc. RESTRICT: đơn đã có tiền về không bao giờ được xoá (0088 cũng đã RESTRICT
  -- users → payments; xoá đơn là xoá chứng từ).
  payment_id         uuid not null references public.payments(id) on delete restrict,
  provider           text not null default 'sepay',
  provider_txn_id    text not null,
  amount_vnd         bigint not null check (amount_vnd >= 0),
  -- Vì sao không cấp gói: người dùng tự huỷ đơn / đơn của tài khoản đã xoá (ẩn danh).
  reason             text not null check (reason in ('cancelled_by_user', 'account_deleted')),
  -- Trường từ payload SePay, nguyên văn (null nếu payload không có).
  gateway            text check (char_length(gateway) <= 100),
  reference_code     text check (char_length(reference_code) <= 100),
  receiving_account  text check (char_length(receiving_account) <= 50),
  transaction_date   text check (char_length(transaction_date) <= 40),
  received_at        timestamptz not null default now(),
  status             text not null default 'needed' check (status in ('needed', 'refunded')),
  refunded_at        timestamptz,
  refunded_by        uuid,
  refund_note        text check (char_length(refund_note) between 1 and 500),
  constraint payment_refunds_refunded_fields_check check (
    (status = 'needed' and refunded_at is null and refunded_by is null and refund_note is null)
    or (status = 'refunded' and refunded_at is not null and refunded_by is not null
          and refund_note is not null)
  )
);

create unique index if not exists payment_refunds_provider_txn_idx
  on public.payment_refunds (provider, provider_txn_id);

-- Màn admin luôn đọc "việc chưa làm" trước.
create index if not exists payment_refunds_status_idx
  on public.payment_refunds (status, received_at desc);

-- Kiểm toán: chỉ cho đúng MỘT chuyển trạng thái `needed → refunded`, không sửa gì khác, cấm xoá.
create or replace function public.payment_refunds_guard()
returns trigger
language plpgsql
as $$
begin
  if tg_op <> 'UPDATE' then
    raise exception 'public.payment_refunds là sổ kiểm toán: cấm %', tg_op;
  end if;
  if old.status <> 'needed' or new.status <> 'refunded'
     or new.id <> old.id
     or new.payment_id <> old.payment_id
     or new.provider <> old.provider
     or new.provider_txn_id <> old.provider_txn_id
     or new.amount_vnd <> old.amount_vnd
     or new.reason <> old.reason
     or new.gateway is distinct from old.gateway
     or new.reference_code is distinct from old.reference_code
     or new.receiving_account is distinct from old.receiving_account
     or new.transaction_date is distinct from old.transaction_date
     or new.received_at <> old.received_at then
    raise exception 'public.payment_refunds: chỉ được chuyển needed → refunded';
  end if;
  return new;
end;
$$;

drop trigger if exists payment_refunds_guard_row on public.payment_refunds;
create trigger payment_refunds_guard_row
  before update or delete on public.payment_refunds
  for each row execute function public.payment_refunds_guard();

drop trigger if exists payment_refunds_guard_truncate on public.payment_refunds;
create trigger payment_refunds_guard_truncate
  before truncate on public.payment_refunds
  for each statement execute function public.payment_refunds_guard();
