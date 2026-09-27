-- Phân loại transcript: bản cũ/chưa phân loại được coi là nhạy cảm.
-- Additive: chạy migration trước khi triển khai code đọc/ghi cột mới.
-- Verification/recovery: docs/audit/2026-09-27-privacy-migration.md.
alter table personal.companion_messages
  add column if not exists sensitivity text not null default 'sensitive'
  check (sensitivity in ('public', 'personal', 'sensitive', 'restricted'));
