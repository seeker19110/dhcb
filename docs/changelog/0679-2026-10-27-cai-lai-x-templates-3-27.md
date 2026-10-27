# 0679 — 2026-10-27 — Cài lại X-Templates 3.15.3 → 3.27.0 (guard + template PLAN)

PR #1461. Đợt sửa audit thứ mười: đóng `AUD-HAR-001` và `AUD-HAR-002` (🟠). Chủ dự án cho phép chạy
installer (2026-10-27).

## Vấn đề

- `AUD-HAR-001`: guard bản 3.15.3 KHÔNG chặn `git config core.hooksPath /dev/null` và `codex exec --yolo x`
  (`xt.py doctor` báo error).
- `AUD-HAR-002`: `.xtemplates/framework/templates/PLAN.md` thiếu, bốn liên kết hỏng (`xt.py validate` exit 1).

Báo cáo audit yêu cầu sửa bằng installer chính chủ, không vá tay `.xtemplates/`.

## Đã làm

- Đọc `install.py` của `seeker19110/X-Templates` @ `99f8b52` (3.27.0) trước khi chạy: chỉ gọi `git`, copy qua thư
  mục tạm rồi mới thay, harness copy-if-absent (file dự án đã sửa ⇒ ghi `.xtemplates-new`). Chạy `--plan` trước.
- Chạy installer: thay `.xtemplates/` (framework/research/scripts), cập nhật `guard.py`, `pre-bash-guard.sh`,
  `pre-edit-guard.sh`, `pre-mcp-guard.sh`, `pre-compact.sh`, `stop-guard.sh`, `agents/researcher.md`; thêm agent
  `executor-deep`, `reviewer-alt`.
- **Không nhận thay đổi quyền:** installer định thêm `allow: "Bash"` (cho MỌI lệnh shell không hỏi) vào
  `.claude/settings.json` — khôi phục `settings.json` về bản đã commit; bật `harness_permissions: own` trong
  `xt.yaml` (changelog khung 3.15.4 ghi đúng tên dhcb) để lần nâng sau không lặp lại.
- **Sự cố trong lúc cài (đã gỡ):** guard mới gọi `guard_fields`/`fence_closed` nhưng `_lib.sh` của dhcb là bản
  đã sửa nên installer giữ bản cũ ⇒ hook lỗi, CHẶN MỌI lệnh Bash. Gộp phần "của khung X-Templates" trong
  `.claude/hooks/_lib.sh` lên 3.27.0 (`py_run`, `guard_fields`, `ask_strict`, `fence_closed`, `python3 -I`), giữ
  nguyên phần của repo (bộ lọc heredoc/nháy). `session-start.sh`: hai chỗ `python3 -I`/`py_run` như bản khung.
- Giữ bản dhcb: `auto-format.sh` (Prettier trực tiếp), `CLAUDE.md`, `AGENTS.md`, `PROGRESS.md`, skill/agent đã
  tuỳ biến — bỏ các file `.xtemplates-new`.
- Ngoài phạm vi, cất vào `git stash` (guard chặn xoá năng lực agent qua Bash — LOOP-STOP-023, cần người duyệt):
  skill `complete`/`optimize` (làm đỏ `skills-mirror.test.ts`, `optimize` trỏ file không có) và 4 hook chưa nối
  (`permission-request`, `post-tool-failure`, `subagent-stop`, `task-completed`).

## Kiểm chứng

- Guard mới (đưa payload JSON vào `pre-bash-guard.sh`): `core.hooksPath /dev/null` → deny, `--yolo` → deny,
  `git push --force origin main` → deny, `ls -la` → cho qua. Guard còn tự chặn lệnh ghi `settings.json` qua
  script Python trong phiên này.
- `xt.py validate`: ✓ 186 file, 2.758 mục. `xt.py doctor`: hết hai error của audit; còn warn (hook
  TaskCompleted/SubagentStop/PostToolUseFailure chưa nối — có chủ đích, giữ quyền riêng; `PROGRESS.md` > 8 KB).
- `scripts/` 1.372/1.372; `check:docs` đạt.

## Rủi ro và đường lùi

Hook là hàng rào của chính tác tử: guard mới chặt hơn (ví dụ chặn ghi `.claude/` qua Bash). Đường lùi: revert PR.

## Đổi luật merge (chủ dự án chọn phương án (a), 2026-10-27)

Guard mới chặn lệnh bật auto-merge (ADR-0036 của khung: máy chỉ merge ghim head sau `xt.py merge-check`), trái với
`CLAUDE.md` mục 11 cũ ("bật auto-merge ngay khi tạo PR"). Chủ dự án chọn theo khung: sửa `CLAUDE.md` mục 3, 9, 11,
11.1 và câu nhắc trong `.claude/hooks/usage-guard.sh` sang "CI xanh → `merge-check` → merge squash kèm
`expectedHeadSha`". Lợi thêm: hết lỗi auto-merge gộp PR khi commit tài liệu chưa kịp lên (#1453 → #1454).
