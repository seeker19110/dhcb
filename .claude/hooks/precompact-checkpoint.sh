#!/usr/bin/env bash
# precompact-checkpoint.sh — PreCompact hook. Ngay TRƯỚC khi Claude Code nén ngữ cảnh (tự động hoặc /compact),
# chụp trạng thái làm việc ra `.claude/.compact-checkpoint` (gitignored qua `.claude/*`) để phần "sau nén" không mất
# dấu: nhánh, thay đổi chưa commit, 5 commit gần nhất, 3 đợt changelog mới nhất. `.claude/report-status.sh`
# (SessionStart — chạy cả sau khi nén) nhắc file này nếu nó còn mới.
#
# Lấy từ khung seeker19110/project-template `.claude/hooks/precompact-checkpoint.sh` @ 59bd1d1 (changelog 0620),
# chỉnh cho DHCB: KHÔNG trích mục PROGRESS.md (file 200+ KB, mục "Tiếp theo" hàng trăm dòng) — đợt việc đang làm
# nằm ở docs/changelog/; bỏ telemetry `.ai-telemetry/` (DHCB không dùng).
# Chỉ đọc + ghi một file cục bộ; fail-open (hook lỗi không được làm sập phiên).
set -uo pipefail

payload="$(cat 2>/dev/null || true)" # đọc HẾT stdin trước mọi `exit` sớm (changelog 0472)
# ROOT = cây ĐANG làm việc (có thể là git worktree); CLAUDE_PROJECT_DIR chỉ là chỗ lùi về (TRAPS.md mục 20).
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -n "$ROOT" ] || ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
OUT="$ROOT/.claude/.compact-checkpoint"
trigger="unknown"
command -v jq >/dev/null 2>&1 && trigger="$(printf '%s' "$payload" | jq -r '.trigger // "unknown"' 2>/dev/null || echo unknown)"

mkdir -p "$ROOT/.claude" 2>/dev/null || exit 0
{
  echo "# Checkpoint trước khi nén ngữ cảnh — $(date -u +%Y-%m-%dT%H:%M:%SZ) (trigger: $trigger)"
  if git -C "$ROOT" rev-parse --git-dir >/dev/null 2>&1; then
    echo "Nhánh: $(git -C "$ROOT" branch --show-current 2>/dev/null)"
    echo "-- Thay đổi chưa commit --"
    git -C "$ROOT" status --short 2>/dev/null | head -40
    echo "-- 5 commit gần nhất --"
    git -C "$ROOT" log --oneline -5 2>/dev/null
  fi
  if [ -d "$ROOT/docs/changelog" ]; then
    echo "-- 3 đợt changelog mới nhất --"
    find "$ROOT/docs/changelog" -maxdepth 1 -name '[0-9]*.md' 2>/dev/null | sort -r | head -3 | while IFS= read -r f; do
      printf '%s — %s\n' "${f#"$ROOT"/}" "$(head -1 "$f" | sed 's/^# //')"
    done
  fi
} >"$OUT" 2>/dev/null || exit 0

echo "[precompact-checkpoint] đã chụp trạng thái vào .claude/.compact-checkpoint — sau khi nén, đọc lại file này nếu mất dấu việc đang làm." >&2
exit 0
