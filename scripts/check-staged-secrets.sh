#!/usr/bin/env bash
# check-staged-secrets.sh — chặn commit có chuỗi giống khoá bí mật trong phần THÊM của diff đã stage.
# Gọi từ `.husky/pre-commit` → phủ MỌI commit (gõ tay, Codex, công cụ khác), không chỉ commit qua Claude Code
# (hook `.claude/hooks/pre-commit-gate.sh` đã kiểm cùng mẫu, nhưng chỉ chạy trong Claude Code).
# Mẫu bí mật: MỘT nguồn ở scripts/_commit-guard.sh (changelog 0619). Trước đây bí mật chỉ bị gitleaks bắt ở CI —
# tức SAU khi đã push lên GitHub (repo public).
# Bỏ qua có chủ đích (dương tính giả đã xác minh): `git commit --no-verify`.
set -uo pipefail

# shellcheck source=scripts/_commit-guard.sh
source "$(dirname "$0")/_commit-guard.sh" || { echo "❌ thiếu scripts/_commit-guard.sh" >&2; exit 1; }

hits="$(git diff --cached -U0 -- 2>/dev/null | awk '
  /^diff --git / { file = $4; sub(/^b\//, "", file); h = 0 }
  /^@@/ { h = 1; next }
  h && /^\+/ { print file "\t" substr($0, 2) }' | grep -E "$COMMIT_GUARD_SECRET_RE" | cut -f1 | sort -u || true)"

if [ -n "$hits" ]; then
  echo "🚫 Diff đã stage có chuỗi giống khoá/token thật (Anthropic/Google/GitHub/AWS/PEM/JWT/…) ở:" >&2
  sed 's/^/   /' <<<"$hits" >&2
  echo "   Gỡ khỏi diff, đưa vào biến môi trường (.env), xoay vòng khoá nếu đã lộ." >&2
  echo "   Khoá GIẢ trong test: dựng bằng nối chuỗi. Dương tính giả đã xác minh: git commit --no-verify." >&2
  exit 1
fi
exit 0
