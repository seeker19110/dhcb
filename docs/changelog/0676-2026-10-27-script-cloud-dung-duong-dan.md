# 0676 — 2026-10-27 — Script dựng môi trường cloud về đúng đường dẫn tài liệu gọi

PR #1456. Đợt sửa audit thứ chín: đóng `AUD-DOC-001` (🟠).

## Vấn đề

`AGENTS.md` và `docs/CODEX_CLOUD_SETUP.md` bảo chạy `bash scripts/codex-cloud-setup.sh` /
`codex-cloud-maintenance.sh`, nhưng hai file chỉ nằm ở `scripts/archive/` (dời từ PR #628). Ở đó
`PROJECT_DIR="$(dirname)/.."` trỏ vào `scripts/` chứ không phải gốc repo — làm đúng hướng dẫn thì
checkout mới không bootstrap được.

## Đã làm

- `git mv` hai script về `scripts/` (nội dung giữ nguyên; `..` nay là gốc repo).
- `scripts/cloud-setup-docs.test.ts` (mới): mọi `bash scripts/*.sh` nhắc trong hai tài liệu phải
  tồn tại, nằm ngay dưới `scripts/` để `dirname/..` là gốc repo.
- Sửa tên repo cũ `english-tutor` → `dhcb` trong `docs/CODEX_CLOUD_SETUP.md`.

## Kiểm chứng

- Đỏ-trước: test mới ĐỎ 2/3 khi script còn ở `archive/`, 3/3 XANH sau chuyển. `bash -n` hai script đạt;
  cổng pre-commit đạt.
- Chưa chạy setup từ checkout sạch (cài gói hệ thống, ghi `~/.bashrc`) — để môi trường Codex Cloud thật.

## Còn lại của đợt audit

`AUD-HAR-001`/`AUD-HAR-002` cần cài lại X-Templates từ bản gốc (`seeker19110/X-Templates` 3.27.0, repo
đang 3.15.3) — chờ chủ dự án chọn cách chạy installer; `AUD-SEC-005` (thu hồi credential) là việc tay.
