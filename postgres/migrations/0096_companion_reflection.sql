-- 0096_companion_reflection.sql — Bạn Đồng Hành GĐ2b: gợi ý ký ức sau buổi · khối ghi nhớ cố
-- định · tóm tắt cuộn.
-- Đặc tả: docs/specs/2026-10-12-ban-dong-hanh-gd2b-trich-ky-uc-khoi-loi.md §③
--
-- VÌ SAO:
--   · companion_core_blocks — hai khối ngắn (≤ 1.500 ký tự) người dùng tự viết, LUÔN nạp vào ngữ
--     cảnh khi công tắc "Nhớ về tôi" bật (Letta core memory). Không phụ thuộc truy xuất theo câu
--     hỏi: điều cốt lõi không bao giờ bị rụng vì câu hỏi không khớp chữ.
--   · companion_conversation_summaries — tóm tắt cuộn theo miền (Letta 70/50): lịch sử trôi khỏi
--     cửa sổ 10 lượt thì vẫn còn một bản gọn để nối tiếp. `summary = ''` = người dùng đã xoá;
--     GIỮ con trỏ để bộ tóm tắt không gom lại chính những tin cũ đó.
--   · companion_reflection_state — con trỏ "đã trích ký ức tới tin nào", mốc lần thử gần nhất
--     (chống quét lại vô hạn khi AI/lượt hỏng) và trần lượt/ngày.
--   · FK `memory_records.superseded_by` (0094) KHÔNG có `on delete` — GĐ2b bắt đầu ghi cột này,
--     nên khi bản MỚI bị dọn (quên > 30 ngày, `purgeExpiredMemories`) thì bản cũ còn trỏ tới làm
--     cả câu DELETE của job dọn gãy. Đổi sang `on delete set null`.
--
-- Rollback (gỡ mã + bộ hẹn giờ trước):
--   drop table if exists personal.companion_reflection_state;
--   drop table if exists personal.companion_conversation_summaries;
--   drop table if exists personal.companion_core_blocks;
--   -- FK `on delete set null` giữ lại được (vô hại).

create table if not exists personal.companion_core_blocks (
  id         uuid primary key default gen_random_uuid(),
  person_id  uuid not null references personal.persons(id) on delete cascade,
  label      text not null check (label in ('about_me', 'current_focus')),
  content    text not null check (char_length(content) between 1 and 1500),
  version    integer not null default 1 check (version >= 1),
  updated_at timestamptz not null default now(),
  unique (person_id, label)
);

create table if not exists personal.companion_conversation_summaries (
  id                    uuid primary key default gen_random_uuid(),
  person_id             uuid not null references personal.persons(id) on delete cascade,
  domain                text not null check (char_length(domain) between 1 and 100),
  summary               text not null default '' check (char_length(summary) <= 1500),
  summarized_through_at timestamptz not null,
  summarized_through_id uuid not null,
  version               integer not null default 1 check (version >= 1),
  updated_at            timestamptz not null default now(),
  unique (person_id, domain)
);

create table if not exists personal.companion_reflection_state (
  person_id            uuid primary key references personal.persons(id) on delete cascade,
  extracted_through_at timestamptz,
  extracted_through_id uuid,
  last_attempt_at      timestamptz,
  runs_day             date,
  runs_count           integer not null default 0 check (runs_count >= 0),
  updated_at           timestamptz not null default now()
);

-- Quét ứng viên: "tin nhắn trong 48 giờ của mọi người" — chỉ mục theo thời gian toàn bảng
-- (chỉ mục sẵn có `(person_id, created_at desc)` không phục vụ được câu quét không có person_id).
create index if not exists idx_companion_messages_created
  on personal.companion_messages (created_at);

alter table personal.memory_records
  drop constraint if exists memory_records_superseded_by_fkey;
alter table personal.memory_records
  add constraint memory_records_superseded_by_fkey
  foreign key (superseded_by) references personal.memory_records(id) on delete set null;
