-- 0094_companion_memory_retrieval.sql — Trí nhớ Bạn Đồng Hành GĐ2a: truy xuất lai chữ + nghĩa.
-- Đặc tả: docs/specs/2026-10-11-ban-dong-hanh-gd2a-tri-nho-truy-xuat.md §③
-- Quyết định: docs/adr/0015-tri-nho-companion-lai-fts-embedding-khong-pgvector.md
--
-- VÌ SAO: trước đó Companion chỉ lấy "10 ký ức mới nhất" mỗi namespace — không theo câu đang hỏi,
-- không theo mức quan trọng. Đợt này thêm:
--   · importance / last_accessed_at / access_count → điểm 3 thành phần (recency · importance ·
--     relevance) theo Generative Agents;
--   · valid_from / valid_to / superseded_by → hai trục thời gian (Zep/Graphiti): mâu thuẫn thì VÔ
--     HIỆU bản cũ, không xoá (GĐ2b mới ghi hai cột này, đợt này chỉ tạo);
--   · source_message_id → ký ức nối về lượt thoại sinh ra nó;
--   · embedding real[] + embedding_model → tìm theo nghĩa, cosine tính trong Node trên ≤ 300 ký
--     ức của ĐÚNG MỘT người (KHÔNG cài pgvector: extension `vector` không "trusted", cần superuser
--     trên VPS — ADR-0015);
--   · search_tsv (cột sinh) + GIN → tìm chữ bằng FTS `simple` + unaccent (tiếng Việt không biến
--     hình nên `simple` đủ; bỏ dấu để "hoc" khớp "học").
--
-- `unaccent` là trusted extension (PostgreSQL 16 F.48): user có CREATE trên database tạo được,
-- tức `npm run migrate:pg` bằng `dhcb_app` chạy được, không cần việc tay. Hàm `unaccent()` gốc là
-- STABLE (tra từ điển) nên không dùng được trong cột sinh/chỉ mục → bọc một hàm IMMUTABLE trỏ
-- thẳng tới từ điển `public.unaccent` (khuôn chuẩn trong tài liệu Postgres).
--
-- Rollback (ưu tiên: gỡ mã, GIỮ cột — không mất dữ liệu). Chỉ khi chắc chắn:
--   drop index if exists personal.idx_memory_records_person_live;
--   drop index if exists personal.idx_memory_records_search_tsv;
--   alter table personal.memory_records
--     drop column if exists search_tsv, drop column if exists embedding_model,
--     drop column if exists embedding, drop column if exists source_message_id,
--     drop column if exists superseded_by, drop column if exists valid_to,
--     drop column if exists valid_from, drop column if exists access_count,
--     drop column if exists last_accessed_at, drop column if exists importance;
--   drop function if exists personal.immutable_unaccent(text);
--   -- KHÔNG drop extension unaccent (vô hại, có thể nơi khác dùng sau).

create extension if not exists unaccent;

create or replace function personal.immutable_unaccent(text)
  returns text
  language sql
  immutable
  parallel safe
  strict
as $$
  select public.unaccent('public.unaccent', $1)
$$;

alter table personal.memory_records
  add column if not exists importance        smallint    not null default 5
                                              check (importance between 1 and 10),
  add column if not exists last_accessed_at  timestamptz,
  add column if not exists access_count      integer     not null default 0
                                              check (access_count >= 0),
  add column if not exists valid_from        timestamptz not null default now(),
  add column if not exists valid_to          timestamptz,
  add column if not exists superseded_by     uuid references personal.memory_records(id),
  add column if not exists source_message_id uuid references personal.companion_messages(id)
                                              on delete set null,
  add column if not exists embedding         real[],
  add column if not exists embedding_model   text,
  add column if not exists search_tsv        tsvector generated always as
    (to_tsvector('simple', personal.immutable_unaccent(content))) stored;

-- Tìm chữ: `search_tsv @@ to_tsquery('simple', …)` — luôn kèm `person_id = $1` nên GIN toàn bảng
-- là đủ (mỗi người chỉ vài trăm dòng, phần lọc person làm trên heap rất rẻ).
create index if not exists idx_memory_records_search_tsv
  on personal.memory_records using gin (search_tsv);

-- Ứng viên nền "quan trọng nhất / dùng gần đây nhất" của một người, chỉ ký ức còn hiệu lực.
create index if not exists idx_memory_records_person_live
  on personal.memory_records (person_id, importance desc, last_accessed_at desc nulls last)
  where status <> 'expired' and valid_to is null;
