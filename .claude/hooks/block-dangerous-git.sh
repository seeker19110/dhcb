#!/usr/bin/env bash
# block-dangerous-git.sh — PreToolUse hook (matcher: Bash).
#
# VÌ SAO CẦN: CLAUDE.md mục 11 CẤM một số thao tác git bằng văn bản ("không push thẳng main",
# không --abort để né giải xung đột…) nhưng trước hook này lệnh cấm chỉ là LUẬT — không có
# hàng rào nào thi hành. Bản 2025 (tham khảo mattpocock/skills) không lọc phần trong dấu nháy/heredoc
# → chặn oan commit message nhắc tới lệnh nguy hiểm. Bản 2026-09-19 thêm bước lọc. Bản này
# (changelog 0619, TRAPS.md mục 22) dùng bộ lọc chung `_lib.sh` và so ĐÍCH PUSH đã chuẩn hoá — lấy từ
# seeker19110/project-template @ 59bd1d1 — vì đo thật 2026-10-12 bản trước để lọt 10 biến thể.
#
# Chặn (exit 2 = chặn, thông báo về lại Claude):
#   1. `git reset --hard` — mất vĩnh viễn thay đổi chưa commit.
#   2. `git clean -f`/`-fd` — xoá file chưa track không hoàn tác được.
#   3. `git branch -D` — xoá cưỡng chế nhánh local (mất commit chưa merge).
#   4. `git checkout [--] .` / `git restore [--worktree] [--] .` — bỏ toàn bộ thay đổi chưa commit.
#      (`git restore --staged .` chỉ bỏ stage, không mất gì → cho qua.)
#   5. `git stash clear` / `git stash drop` — xoá stash, không hoàn tác được bằng lệnh thường.
#   6. FORCE-PUSH MỌI NHÁNH: `--force`/`-f`/`--force-with-lease`/cờ gộp `-fu`/refspec `+<nhánh>` —
#      CLAUDE.md mục 11 cấm force-push chung, không chỉ nhánh chính (khác khung gốc — DHCB chặn cứng).
#   7. Push XOÁ nhánh chính: `:main`, `--delete main`/`-d main`. (Xoá nhánh feature đã merge vẫn được —
#      TRAPS.md mục 21 cần đúng lệnh đó.)
#   8. `merge --abort`/`rebase --abort`/`cherry-pick --abort` — né việc giải xung đột.
# Lệnh trong vỏ bọc `bash -c '…'`/`sh -c "…"`/`eval "…"` cũng được soi (_lib.sh).
#
# Bỏ qua có chủ đích: đặt ALLOW_DANGEROUS_GIT=1 trong môi trường (tường minh, có chủ ý, nói rõ
# lý do cho người dùng — không dùng "--no-verify" vì hook này nằm ngoài git, không liên quan
# commit hook).
set -uo pipefail   # cố ý KHÔNG -e: không được làm chết phiên (một hook lỗi không được sập session)

payload="$(cat)"   # đọc HẾT stdin trước mọi `exit` sớm (tránh EPIPE cho bên gọi, changelog 0472)
[ "${ALLOW_DANGEROUS_GIT:-0}" = "1" ] && exit 0

if ! command -v jq >/dev/null 2>&1; then
  # Không có jq → KHÔNG đoán lệnh từ JSON thô (sẽ khớp nhầm nội dung file/mô tả và chặn oan).
  echo "[block-dangerous-git] không có jq → không đọc được lệnh, bỏ qua kiểm tra." >&2
  exit 0
fi
# shellcheck source=.claude/hooks/_lib.sh
source "$(dirname "$0")/_lib.sh" || { echo "[block-dangerous-git] thiếu .claude/hooks/_lib.sh → bỏ qua kiểm tra." >&2; exit 0; }
cmd="$(printf '%s' "$payload" | read_hook_command)"
[ -n "$cmd" ] || exit 0
# Mọi khuôn dưới đều cần chữ `git` → lệnh không chứa nó thì khỏi chạy awk/sed/grep (hook chạy trên MỌI lệnh Bash).
case "$cmd" in *git*) ;; *) exit 0 ;; esac

# Bỏ DỮ LIỆU (thân heredoc + phần trong nháy) trước khi so khớp — lý do và giới hạn: _lib.sh.
cmd_scan="$(hook_scan_text "$cmd")"

block() {
  echo "🚫 Lệnh bị chặn bởi block-dangerous-git.sh: $1" >&2
  echo "   Lý do: $2" >&2
  echo "   Nếu THỰC SỰ cần: chạy lại với ALLOW_DANGEROUS_GIT=1 (và nói rõ lý do cho người dùng)." >&2
  exit 2
}

GIT_PRE='(^|[^-])git[[:space:]]+([^|&;]*[[:space:]])?'
is_git() { printf '%s' "$cmd_scan" | grep -Eq "$GIT_PRE$1"'([[:space:]]|$)'; }
has_flag() { printf '%s' "$cmd_scan" | grep -Eq '(^|[[:space:]])'"$1"'([[:space:]=]|$)'; }
# Đoạn `git … <lệnh con> …` tới `|`/`&`/`;`/xuống dòng — chỉ soi cờ trong ĐOẠN đó, để cờ của lệnh khác
# (`rm -rf`, `ls -d`) không bị tính nhầm.
git_segs() { printf '%s' "$cmd_scan" | grep -oE "$GIT_PRE$1"'([[:space:]][^|&;]*)?'; }

# --- 1. reset --hard ---
if is_git reset && git_segs reset | grep -Eq '(^|[[:space:]])--hard([[:space:]]|$)'; then
  block "git reset --hard" "Mất vĩnh viễn thay đổi chưa commit. Dùng 'git stash' hoặc 'git restore <file>' cho phạm vi hẹp."
fi

# --- 2. clean -f/-fd ---
if is_git clean && git_segs clean | grep -Eq '(^|[[:space:]])(-[a-zA-Z]*f[a-zA-Z]*|--force)([[:space:]]|$)'; then
  block "git clean -f" "Xoá vĩnh viễn file chưa track, không hoàn tác được."
fi

# --- 3. branch -D ---
if is_git branch && git_segs branch | grep -Eq '(^|[[:space:]])(-[a-zA-Z]*D[a-zA-Z]*|--delete[[:space:]]+--force|--force[[:space:]]+--delete)([[:space:]]|$)'; then
  block "git branch -D" "Xoá cưỡng chế nhánh local — mất commit chưa merge. Dùng 'git branch -d' (chỉ xoá khi đã merge)."
fi

# --- 4. checkout . / restore . (có hoặc không `--`) ---
if git_segs checkout | grep -Eq '[[:space:]]checkout([[:space:]]+--)?[[:space:]]+\.([[:space:]]|$)'; then
  block "git checkout ." "Bỏ toàn bộ thay đổi chưa commit trong working tree — không hoàn tác được."
fi
restore_seg="$(git_segs restore)"
if printf '%s' "$restore_seg" | grep -Eq '[[:space:]]\.([[:space:]]|$)'; then
  # `--staged` đứng một mình chỉ bỏ stage (an toàn); có `--worktree`/`-W` hoặc không có `--staged` → mất thay đổi.
  if ! printf '%s' "$restore_seg" | grep -Eq '(^|[[:space:]])(--staged|-S)([[:space:]]|$)' \
     || printf '%s' "$restore_seg" | grep -Eq '(^|[[:space:]])(--worktree|-W)([[:space:]]|$)'; then
    block "git restore ." "Bỏ toàn bộ thay đổi chưa commit trong working tree — không hoàn tác được. Bỏ stage thì dùng 'git restore --staged .'."
  fi
fi

# --- 5. stash clear / drop ---
if is_git stash && git_segs stash | grep -Eq '[[:space:]]stash[[:space:]]+(clear|drop)([[:space:]]|$)'; then
  block "git stash clear/drop" "Xoá stash — không hoàn tác được bằng lệnh thường. Dùng 'git stash pop'/'apply' để lấy lại thay đổi."
fi

# --- 6 + 7. push: force mọi nhánh, xoá nhánh chính ---
if is_git push; then
  # Đoạn push với ký tự nháy đã bỏ (tên nhánh trong nháy `"main"` vẫn thấy), tách từng token.
  push_tokens="$(printf '%s' "$cmd" | strip_heredoc_bodies | strip_quote_marks \
    | grep -oE "$GIT_PRE"'push([[:space:]][^|&;]*)?' | tr -s '[:space:]' '\n')"
  # Force: cờ dài, `-f`, cờ gộp có `f` (`-fu`), hoặc refspec bắt đầu bằng `+` (`+HEAD:main`, `+feat/x`).
  if printf '%s\n' "$push_tokens" | grep -Eq '^(--force|--force-with-lease(=.*)?|--force-if-includes|-[A-Za-z]*f[A-Za-z]*|\+.+)$'; then
    block "git push --force" "CLAUDE.md mục 11: không force-push (mọi nhánh, kể cả cờ gộp '-fu' và refspec '+…'). Cần đồng bộ lại nhánh riêng thì dùng merge commit."
  fi
  # Đích push chuẩn hoá: `src:dst` → `dst`, bỏ `refs/heads/`.
  dests="$(printf '%s\n' "$push_tokens" | sed -E 's/^.*://; s#^refs/heads/##')"
  if printf '%s\n' "$push_tokens" | grep -Eq '^:(refs/heads/)?(main|master)$' \
     || { printf '%s\n' "$push_tokens" | grep -Eq '^(--delete|-d)$' && printf '%s\n' "$dests" | grep -Eq '^(main|master)$'; }; then
    block "push xoá nhánh chính" "CLAUDE.md mục 11: nhánh chính chỉ nhận thay đổi qua PR; ':main' hay --delete main xoá nhánh của mọi người."
  fi
fi

# --- 8. --abort để né giải xung đột ---
if printf '%s' "$cmd_scan" | grep -Eq "$GIT_PRE"'(merge|rebase|cherry-pick)([[:space:]]|$)' && has_flag --abort; then
  block "git ...--abort" "CLAUDE.md mục 11: không --abort để né việc giải xung đột — đọc cả hai phía rồi giải."
fi

exit 0
