-- 0097_companion_daily_cards.sql — Bạn Đồng Hành GĐ4a: "Thẻ hôm nay" + sở thích 👍/👎.
-- Đặc tả: docs/specs/2026-10-12-ban-dong-hanh-gd4a-the-hom-nay.md §③
--
-- VÌ SAO:
--   · companion_daily_cards — bộ thẻ của MỘT ngày (giờ VN) cho mỗi người, dựng lúc mở lần đầu
--     trong ngày từ dữ liệu thật. Hai ràng buộc duy nhất (theo `kind` và theo `position` 1..3) để
--     CSDL giữ trần 3 thẻ/ngày: hai request đầu ngày đua nhau cùng `on conflict do nothing` không
--     thể sinh thẻ thứ tư hay trùng loại. `snapshot` = số liệu lúc dựng (đo tỉ lệ thẻ làm xong).
--   · companion_card_preferences — 👍/👎 gộp theo loại thẻ: 👎 tắt loại đó 7 ngày (`muted_until`),
--     👍 bỏ tắt và được xếp trước.
--
-- Rollback (gỡ mã trước):
--   drop table if exists personal.companion_card_preferences;
--   drop table if exists personal.companion_daily_cards;

create table if not exists personal.companion_daily_cards (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid not null references personal.persons(id) on delete cascade,
  vn_day      date not null,
  kind        text not null
              check (kind in ('review_due', 'due_tasks', 'learning_goal', 'reflection')),
  position    smallint not null check (position between 1 and 3),
  snapshot    jsonb not null default '{}'::jsonb,
  feedback    text check (feedback in ('up', 'down')),
  feedback_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (person_id, vn_day, kind),
  unique (person_id, vn_day, position)
);

-- Job dọn thẻ cũ (> 90 ngày) quét theo ngày, không theo người.
create index if not exists idx_companion_daily_cards_vn_day
  on personal.companion_daily_cards (vn_day);

create table if not exists personal.companion_card_preferences (
  person_id   uuid not null references personal.persons(id) on delete cascade,
  kind        text not null
              check (kind in ('review_due', 'due_tasks', 'learning_goal', 'reflection')),
  up_count    integer not null default 0 check (up_count >= 0),
  down_count  integer not null default 0 check (down_count >= 0),
  muted_until timestamptz,
  updated_at  timestamptz not null default now(),
  primary key (person_id, kind)
);
