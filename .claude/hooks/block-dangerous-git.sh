#!/usr/bin/env bash
# block-dangerous-git.sh — PreToolUse hook (matcher: Bash).
#
# VÌ SAO CẦN: CLAUDE.md mục 11 CẤM một số thao tác git bằng văn bản ("không push thẳng main",
# không --abort để né giải xung đột…) nhưng trước hook này lệnh cấm chỉ là LUẬT — không có
# hàng rào nào thi hành. Bản trước của hook này (2025, tham khảo mattpocock/skills) đã chặn
# reset --hard/clean/branch -D/checkout ./force-push nhưng KHÔNG lọc phần trong dấu nháy/heredoc
# trước khi so khớp — một lệnh như `git commit -m 'quay lại: git reset --hard cho sạch'` sẽ bị
# chặn oan vì chuỗi mô tả trong commit message khớp mẫu. Bản này thêm bước lọc trước khi so khớp
# (tham khảo seeker19110/projects-template .claude/hooks/block-dangerous-git.sh, 2026-09-19).
#
# Chặn (exit 2 = chặn, thông báo về lại Claude):
#   1. `git reset --hard` — mất vĩnh viễn thay đổi chưa commit.
#   2. `git clean -f`/`-fd` — xoá file chưa track không hoàn tác được.
#   3. `git branch -D` — xoá cưỡng chế nhánh local (mất commit chưa merge).
#   4. `git checkout .` / `git restore .` — bỏ toàn bộ thay đổi chưa commit trong working tree.
#   5. `push --force`/`-f`/`--force-with-lease` — CLAUDE.md mục 11 cấm force-push chung, không
#      chỉ riêng nhánh chính (khác template gốc — DHCB chặn cứng mọi force-push).
#   6. `merge --abort`/`rebase --abort` — né việc giải xung đột.
#
# Bỏ qua có chủ đích: đặt ALLOW_DANGEROUS_GIT=1 trong môi trường (tường minh, có chủ ý, nói rõ
# lý do cho người dùng — không dùng "--no-verify" vì hook này nằm ngoài git, không liên quan
# commit hook).
set -uo pipefail   # cố ý KHÔNG -e: không được làm chết phiên (một hook lỗi không được sập session)

payload="$(cat)"   # đọc HẾT stdin trước mọi `exit` sớm (tránh EPIPE cho bên gọi, changelog 0472)
[ "${ALLOW_DANGEROUS_GIT:-0}" = "1" ] && exit 0

cmd=""
if command -v jq >/dev/null 2>&1; then
  cmd="$(printf '%s' "$payload" | jq -r '.tool_input.command // empty' 2>/dev/null)"
else
  # Không có jq → KHÔNG đoán lệnh từ JSON thô (sẽ khớp nhầm nội dung file/mô tả và chặn oan).
  echo "[block-dangerous-git] không có jq → không đọc được lệnh, bỏ qua kiểm tra." >&2
  exit 0
fi
[ -n "$cmd" ] || exit 0

# Bỏ DỮ LIỆU trước khi so khớp: nội dung trong dấu nháy đơn/kép, và thân heredoc (`<<EOF ... EOF`)
# — cả hai đều có thể chứa chuỗi giống lệnh git nguy hiểm mà thực ra chỉ là văn bản (commit
# message, script heredoc dùng làm dữ liệu test…).
strip_heredoc_bodies() {
  awk '
    BEGIN { delim = "" }
    {
      if (delim != "") { if ($0 == delim) { delim = "" } ; next }
      if (match($0, /<<-?[\047\042]?[A-Za-z_][A-Za-z0-9_]*[\047\042]?/)) {
        d = substr($0, RSTART, RLENGTH)
        sub(/^<<-?/, "", d)
        gsub(/[\047\042]/, "", d)
        delim = d
      }
      print
    }'
}
cmd_scan="$(printf '%s' "$cmd" | strip_heredoc_bodies | sed "s/'[^']*'//g; s/\"[^\"]*\"//g")"

block() {
  echo "🚫 Lệnh bị chặn bởi block-dangerous-git.sh: $1" >&2
  echo "   Lý do: $2" >&2
  echo "   Nếu THỰC SỰ cần: chạy lại với ALLOW_DANGEROUS_GIT=1 (và nói rõ lý do cho người dùng)." >&2
  exit 2
}

is_git() { printf '%s' "$cmd_scan" | grep -Eq '(^|[^-])git[[:space:]]+([^|&;]*[[:space:]])?'"$1"'([[:space:]]|$)'; }
has_flag() { printf '%s' "$cmd_scan" | grep -Eq '(^|[[:space:]])'"$1"'([[:space:]=]|$)'; }

# --- 1. reset --hard ---
if is_git reset && has_flag --hard; then
  block "git reset --hard" "Mất vĩnh viễn thay đổi chưa commit. Dùng 'git stash' hoặc 'git restore <file>' cho phạm vi hẹp."
fi

# --- 2. clean -f/-fd ---
if is_git clean && printf '%s' "$cmd_scan" | grep -Eq '(^|[^-])git[[:space:]]+([^|&;]*[[:space:]])?clean[[:space:]]+-[a-zA-Z]*f'; then
  block "git clean -f" "Xoá vĩnh viễn file chưa track, không hoàn tác được."
fi

# --- 3. branch -D ---
if printf '%s' "$cmd_scan" | grep -Eq '(^|[^-])git[[:space:]]+([^|&;]*[[:space:]])?branch[[:space:]]+.*-D([[:space:]]|$)'; then
  block "git branch -D" "Xoá cưỡng chế nhánh local — mất commit chưa merge. Dùng 'git branch -d' (chỉ xoá khi đã merge)."
fi

# --- 4. checkout . / restore . ---
if printf '%s' "$cmd_scan" | grep -Eq '(^|[^-])git[[:space:]]+(checkout|restore)[[:space:]]+\.([[:space:]]|$)'; then
  block "git checkout . / git restore ." "Bỏ toàn bộ thay đổi chưa commit trong working tree — không hoàn tác được."
fi

# --- 5. push --force (mọi nhánh — CLAUDE.md mục 11 cấm chung, khác template gốc) ---
if is_git push && (has_flag --force || has_flag --force-with-lease || has_flag -f); then
  block "git push --force" "CLAUDE.md mục 11: không push thẳng/force-push. Nếu cần đồng bộ lại nhánh riêng, dùng merge commit thay vì force-push."
fi

# --- 6. --abort để né giải xung đột ---
if printf '%s' "$cmd_scan" | grep -Eq '(^|[^-])git[[:space:]]+([^|&;]*[[:space:]])?(merge|rebase|cherry-pick)([[:space:]]|$)' && has_flag --abort; then
  block "git ...--abort" "CLAUDE.md mục 11: không --abort để né việc giải xung đột — đọc cả hai phía rồi giải."
fi

exit 0
