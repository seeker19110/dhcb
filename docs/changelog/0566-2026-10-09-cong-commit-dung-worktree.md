# 0566 — Cổng commit chạy ở đúng cây đang commit (kể cả git worktree)

- **Ngày:** 2026-10-09 · **PR:** (điền sau khi tạo) · **Loại:** `fix(hooks)`
- **Nguồn:** đề xuất trong báo cáo tổng sau đợt 0565; chủ dự án duyệt sửa hook ("sửa hook
  pre-commit như đề xuất"). `.claude/hooks/pre-commit-gate.sh` là file cổng được bảo vệ
  (`config-protection.sh` từ chối lần chạm đầu — đã báo người dùng lý do trước khi thử lại).

## Vấn đề

Hook luôn `cd "${CLAUDE_PROJECT_DIR}"` (checkout chính) rồi chạy typecheck/lint/test. Subagent
chạy `isolation: worktree` commit trong `.claude/worktrees/agent-*` nên bị kiểm SAI CÂY: đợt 0559
một test CEFR bị báo "chập chờn" chỉ vì checkout chính đang dở `git cherry-pick`; ngược lại lỗi
chỉ có trong worktree sẽ lọt qua (xanh giả).

## Đã làm

1. `.claude/hooks/pre-commit-gate.sh`: xác định thư mục commit theo thứ tự `cwd` của payload →
   các `cd <dir>` đứng TRƯỚC lần `git … commit` cuối (tương đối/tuyệt đối/có nháy) →
   `git -C <dir>` → `git rev-parse --show-toplevel`. Chỉ gác cây cùng `--git-common-dir` với repo
   dự án (commit ở repo khác → bỏ qua, không chặn). Cây chưa có `node_modules` → chặn (exit 2)
   kèm lời nhắc `npm ci` thay vì đỏ khó hiểu. Biến `PRE_COMMIT_GATE_DRY_RUN=1` chỉ in thư mục cổng
   (dành cho test).
2. `scripts/claude-hooks.test.ts`: +11 ca (repo giả + `git worktree add`): cwd là worktree, `cd`
   tương đối, `cd` có nháy, `git -C`, thư mục con, `cd` SAU commit không tính, chữ "cd" trong
   message không tính, cwd không tồn tại, repo khác, thiếu `node_modules`, lệnh không phải commit
   / `--no-verify`.
3. `TRAPS.md` mục 20; `CLAUDE.md` mục 8 + `docs/claude-md-chi-tiet.md` §8 ghi hành vi mới.

## Kiểm chứng

- `npx vitest run scripts/claude-hooks.test.ts`: 48/48 xanh. Đổi tạm hook về bản cũ: 10/11 ca
  mới đỏ (ca còn lại là "không phải commit" — vốn đúng ở cả hai bản).
- Thử tay với worktree thật `.claude/worktrees/agent-a84bd81fa38a246bc`: cwd = worktree và
  `cd <worktree> && git commit` đều ra đúng worktree; thư mục con `apps/` ra checkout chính; repo
  `git init` ngoài → bỏ qua.
- Commit của chính đợt này đi qua hook mới ở checkout chính (typecheck + lint + test thật).

## Không làm

- Không nhắc `gen:feature-map` ở `.husky/` (đề xuất tuỳ chọn ở 0565): test canh đã chặn ở CI.
