#!/usr/bin/env bash
# pre-commit-gate.sh — PreToolUse hook (matcher: Bash).
#
# VÌ SAO CẦN: CLAUDE.md mục 8 liệt kê đủ cổng commit (Build/Type/Lint/Format/Test) nhưng trước
# hook này chỉ dựa vào tự giác — không có gì chặn thật khi Claude chạy `git commit` với cổng đỏ.
# Tham khảo seeker19110/projects-template .claude/hooks/pre-commit-gate.sh (2026-09-19), nhưng
# KHÔNG dùng lớp "tự dò lệnh theo stack" của template — DHCB là MỘT stack cố định (npm, xem
# CLAUDE.md mục 6) nên gọi thẳng script trong package.json.
#
# Thứ tự kiểm khi Claude định chạy `git commit` (changelog 0619 thêm 1–3 + 5, lấy từ khung @ 59bd1d1):
#   1. Đang đứng trên `main`/`master` → CHẶN (CLAUDE.md mục 11: không push thẳng main; `checkout -b` hỏng thì
#      commit rơi vào main mà không ai thấy). Bỏ qua có chủ đích: ALLOW_COMMIT_ON_MAIN=1.
#   2. Diff (staged, hoặc sắp stage qua `git add … && git commit` / `commit -a`) có chuỗi giống khoá bí mật → CHẶN.
#      Trước đây bí mật chỉ bị gitleaks bắt ở CI — tức SAU khi đã push lên GitHub (repo public).
#   3. File THÊM MỚI > 1 MB → CHẶN (file dữ liệu lớn sẵn có vẫn sửa được — scripts/_commit-guard.sh).
#   4. typecheck + lint + test.
#   5. Đỏ CÙNG một lỗi lần 2 → nhắc ghi lỗi nằm ở TẦNG nào trước khi sửa tiếp; lần ≥ 3 → nhắc DỪNG, báo người
#      dùng (AI_DELIVERY_LOOP.md §5). Đếm ở `.claude/.gate-red-streak` của cây đang commit (gitignored).
#
# PHẠM VI CỐ Ý HẸP HƠN mục 8 (KHÔNG chạy `npm run build`): build đầy đủ tốn 1-3 phút — chặn nó ở MỖI lần commit
# làm chậm mọi phiên đến mức phản tác dụng (khuyến khích gõ --no-verify). `npm run build` vẫn bị chặn thật ở CI
# job `build` và ở checklist thủ công trước PR (mục 10). Format không tự chạy ở đây vì `auto-format.sh`
# (PostToolUse) đã format ngay sau mỗi Edit/Write.
set -uo pipefail   # cố ý KHÔNG -e: không được làm chết phiên/lượt chạy

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

payload="$(cat)"
if ! command -v jq >/dev/null 2>&1; then
  echo "[pre-commit-gate] không có jq → không đọc được lệnh, bỏ qua cổng." >&2
  exit 0
fi
# shellcheck source=.claude/hooks/_lib.sh
source "$(dirname "$0")/_lib.sh" || { echo "[pre-commit-gate] thiếu .claude/hooks/_lib.sh → bỏ qua cổng." >&2; exit 0; }
cmd="$(printf '%s' "$payload" | read_hook_command)"
case "$cmd" in *commit*) ;; *) exit 0 ;; esac

# Bỏ DỮ LIỆU (thân heredoc + phần trong nháy) trước khi so khớp — tránh chặn oan khi commit message/heredoc
# chứa chữ "commit" hay "git add" (lý do và giới hạn: _lib.sh).
cmd_scan="$(hook_scan_text "$cmd")"

# Chỉ can thiệp khi thực sự là `git commit` (bỏ qua commit-tree, --help…).
if ! printf '%s' "$cmd_scan" | grep -Eq '(^|[^-])git[[:space:]]+([^|&;]*[[:space:]])?commit([[:space:]]|$)'; then
  exit 0
fi

# `--no-verify` phải là cờ CỦA `git commit` (cùng đoạn, không qua `|`/`&`/`;`): `git commit -m x && rm --no-verify`
# từng bị hiểu là bỏ cổng vì cờ của lệnh khác (đo thật 2026-10-12, TRAPS.md mục 22).
if printf '%s' "$cmd_scan" | grep -Eq 'commit[^|&;]*[[:space:]]--no-verify([[:space:]]|$)'; then
  echo "[pre-commit-gate] phát hiện --no-verify → bỏ qua cổng." >&2
  exit 0
fi

# THƯ MỤC COMMIT THẬT (changelog 0566). Trước đây cổng luôn `cd "$ROOT"` (checkout chính) nên
# commit trong git worktree (subagent `isolation: worktree`) bị kiểm SAI CÂY: đỏ oan khi checkout
# chính đang dở cherry-pick, xanh giả khi lỗi chỉ nằm trong worktree. Nay lấy theo thứ tự:
# `cwd` của payload → các `cd <dir>` đứng trước `git commit` → `git -C <dir>` → gốc repo của nó.
strip_quotes() { local s="$1"; s="${s#[\"\']}"; s="${s%[\"\']}"; printf '%s' "${s/#\~/$HOME}"; }
join_dir() { case "$2" in /*) printf '%s' "$2" ;; *) printf '%s/%s' "$1" "$2" ;; esac; }

dir="$(printf '%s' "$payload" | jq -r '.cwd // empty' 2>/dev/null)"
[ -n "$dir" ] && [ -d "$dir" ] || dir="$ROOT"
# Phần lệnh trước lần `git … commit` cuối — `cd` nằm SAU commit không ảnh hưởng nơi commit chạy.
pre="${cmd%git*commit*}"
while IFS= read -r d; do
  [ -n "$d" ] && dir="$(join_dir "$dir" "$(strip_quotes "$d")")"
done < <(printf '%s' "$pre" \
  | grep -oE "(^|[;&|[:space:]])cd[[:space:]]+(\"[^\"]+\"|'[^']+'|[^[:space:];&|]+)" \
  | sed -E 's/^[;&|[:space:]]?cd[[:space:]]+//')
c_dir="$(printf '%s' "${cmd:${#pre}}" \
  | grep -oE "^git[[:space:]]+-C[[:space:]]+(\"[^\"]+\"|'[^']+'|[^[:space:];&|]+)" \
  | sed -E 's/^git[[:space:]]+-C[[:space:]]+//')"
[ -n "$c_dir" ] && dir="$(join_dir "$dir" "$(strip_quotes "$c_dir")")"
GATE_DIR="$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null)" || GATE_DIR="$ROOT"
[ -n "$GATE_DIR" ] || GATE_DIR="$ROOT"
# Chỉ gác repo NÀY (checkout chính + worktree của nó — cùng `--git-common-dir`); commit ở repo
# khác (thư mục nháp…) không phải việc của cổng DHCB.
common_of() { (cd "$1" 2>/dev/null && cd "$(git rev-parse --git-common-dir 2>/dev/null)" 2>/dev/null && pwd -P); }
if [ "$(common_of "$GATE_DIR")" != "$(common_of "$ROOT")" ]; then
  echo "[pre-commit-gate] $GATE_DIR không thuộc repo dự án → bỏ qua cổng." >&2
  exit 0
fi

if [ "${PRE_COMMIT_GATE_DRY_RUN:-}" = "1" ]; then # chỉ cho test: in thư mục; vẫn chạy rào 1–3, KHÔNG chạy npm
  echo "[pre-commit-gate] thư mục cổng: $GATE_DIR" >&2
fi

# --- 1. Không commit thẳng lên nhánh chính ---
branch="$(git -C "$GATE_DIR" branch --show-current 2>/dev/null || true)"
if [ "${ALLOW_COMMIT_ON_MAIN:-0}" != "1" ] && { [ "$branch" = "main" ] || [ "$branch" = "master" ]; }; then
  echo "🚫 Đang đứng trên nhánh '$branch' — CLAUDE.md mục 11: mọi thay đổi vào main đi qua PR. Tạo nhánh trước: git switch -c <nhánh>." >&2
  echo "   Nếu THỰC SỰ cần: chạy lại với ALLOW_COMMIT_ON_MAIN=1 (và nói rõ lý do cho người dùng)." >&2
  exit 2
fi

# --- 2 + 3. Bí mật / file mới lớn trong diff (mẫu + ngưỡng một nguồn: scripts/_commit-guard.sh) ---
# Lấy lib theo vị trí HOOK. Thiếu lib → CHẶN (fail-closed): buông kiểm bí mật âm thầm không đảo ngược được.
# shellcheck source=scripts/_commit-guard.sh
if ! source "$(dirname "$0")/../../scripts/_commit-guard.sh" 2>/dev/null || [ -z "${COMMIT_GUARD_SECRET_RE:-}" ] \
   || ! declare -F commit_guard_added_lines >/dev/null; then
  echo "🚫 [pre-commit-gate] thiếu scripts/_commit-guard.sh → không kiểm được bí mật/file lớn. Bỏ qua có chủ đích: --no-verify." >&2
  exit 2
fi
# Hook chạy TRƯỚC lệnh nên index còn CŨ: `git add X && git commit` hay `commit -a` tự stage thứ hook chưa thấy.
# Lệnh tự stage → xét cả thay đổi chưa stage; `git add` còn kéo file chưa theo dõi. Commit thường chỉ xét index.
self_stage=0; add_untracked=0
if printf '%s' "$cmd_scan" | grep -Eq '(^|[^-])git[[:space:]]+([^|&;]*[[:space:]])?add([[:space:]]|$)'; then self_stage=1; add_untracked=1; fi
if printf '%s' "$cmd_scan" | grep -Eq 'commit[^|&;]*[[:space:]](-[A-Za-z]*a[A-Za-z]*|--all)([[:space:]]|$)'; then self_stage=1; fi
diff_text() { # luôn return 0: dưới pipefail, `[ ] &&` cuối nhóm trả 1 sẽ làm cả pipeline "lỗi" và bỏ lọt ca
  git -C "$GATE_DIR" diff --cached -U0 -- 2>/dev/null
  [ "$self_stage" = 1 ] && git -C "$GATE_DIR" diff -U0 -- 2>/dev/null
  return 0
}
new_files() { # NUL-separated, chỉ file THÊM MỚI (đường dẫn tương đối gốc cây)
  git -C "$GATE_DIR" diff --cached --name-only --diff-filter=A -z -- 2>/dev/null
  [ "$add_untracked" = 1 ] && git -C "$GATE_DIR" ls-files -o --exclude-standard -z -- 2>/dev/null
  return 0
}
secret_hit=0
if diff_text | commit_guard_added_lines | grep -Eq "$COMMIT_GUARD_SECRET_RE"; then secret_hit=1; fi
if [ "$secret_hit" = 0 ] && [ "$add_untracked" = 1 ]; then
  while IFS= read -r -d '' f; do
    grep -IEq "$COMMIT_GUARD_SECRET_RE" "$GATE_DIR/$f" 2>/dev/null && { secret_hit=1; break; }
  done < <(git -C "$GATE_DIR" ls-files -o --exclude-standard -z -- 2>/dev/null)
fi
if [ "$secret_hit" = 1 ]; then
  echo "🚫 Diff (staged hoặc sắp được stage) chứa chuỗi giống khoá/token thật (Anthropic/Google/GitHub/AWS/PEM/JWT/…). Gỡ khỏi diff, đưa vào biến môi trường (CLAUDE.md mục 4.6), xoay vòng khoá nếu đã lộ." >&2
  echo "   Dương tính giả (vd khoá GIẢ trong test): bỏ qua có chủ đích bằng --no-verify và nói rõ cho người dùng." >&2
  exit 2
fi
big=""
while IFS= read -r -d '' f; do
  [ -f "$GATE_DIR/$f" ] || continue # "dir/" = repo git lồng chưa theo dõi: không phải file để đo
  sz="$(wc -c <"$GATE_DIR/$f" 2>/dev/null || echo 0)"
  [ "$sz" -gt "$COMMIT_GUARD_MAX_FILE_BYTES" ] && big="$big $f($((sz / 1024))KB)"
done < <(new_files | sort -zu)
if [ -n "$big" ]; then
  echo "🚫 File MỚI > 1 MB:$big — không đưa file lớn mới vào git (nén/chia nhỏ, hoặc lưu R2). Chắc chắn cần: --no-verify và nói rõ lý do." >&2
  exit 2
fi

[ "${PRE_COMMIT_GATE_DRY_RUN:-}" = "1" ] && exit 0

cd "$GATE_DIR" || exit 0
if [ ! -d node_modules ]; then
  echo "❌ [pre-commit-gate] $GATE_DIR chưa có node_modules (worktree mới?) — chạy \`npm ci\` ở đó rồi commit lại." >&2
  exit 2
fi

# --- 4 + 5. typecheck/lint/test + đếm chuỗi đỏ cùng chữ ký ---
STREAK="$GATE_DIR/.claude/.gate-red-streak"
out="$(mktemp)"
run() { # $1 = nhãn, $2.. = lệnh
  local label="$1"; shift
  echo "[pre-commit-gate] chạy: $label ($*)" >&2
  if ! "$@" >"$out" 2>&1; then
    tail -n 40 "$out" >&2
    # Chữ ký = nhãn cổng + dòng lỗi đầu tiên (bỏ số dòng/thời gian để hai lần chạy cùng lỗi trùng nhau).
    local sig prev=0 n
    sig="$label: $(grep -m1 -iE 'error|fail|✗|×' "$out" | sed -E 's/[0-9]+(ms|s)\b//g; s/:[0-9]+:[0-9]+//g' | cut -c1-160)"
    if [ -f "$STREAK" ] && [ "$(sed -n 's/^sig=//p' "$STREAK" | head -1)" = "$sig" ]; then
      prev="$(sed -n 's/^n=//p' "$STREAK" | head -1)"; case "$prev" in '' | *[!0-9]*) prev=0 ;; esac
    fi
    n=$((prev + 1))
    mkdir -p "$GATE_DIR/.claude" 2>/dev/null && printf 'n=%s\nsig=%s\n' "$n" "$sig" >"$STREAK" 2>/dev/null
    rm -f "$out"
    echo "❌ Cổng ĐỎ: $label. CLAUDE.md mục 8 — sửa hết rồi commit lại." >&2
    echo "   Bỏ qua có chủ đích: thêm --no-verify vào lệnh git commit." >&2
    if [ "$n" -eq 2 ]; then
      echo "⚠️  Lần 2 cùng một lỗi: trước khi sửa tiếp, ghi một dòng \"lỗi nằm ở tầng đặc tả / thiết kế / code / cổng vì …\" rồi quay về đúng tầng — không sửa mù (AI_DELIVERY_LOOP.md §5)." >&2
    elif [ "$n" -ge 3 ]; then
      echo "🛑 Đã $n lần cùng một lỗi — DỪNG sửa mù, báo người dùng kèm chẩn đoán và xin quyết định (AI_DELIVERY_LOOP.md §5)." >&2
    fi
    exit 2
  fi
}

run "typecheck" npm run typecheck
run "lint" npm run lint
run "test" npm test
rm -f "$out" "$STREAK"

# Diff staged lớn → nhắc /code-review, không chặn (cổng máy chỉ bắt lỗi cú pháp).
lines_changed="$(git diff --cached --numstat -- 2>/dev/null | awk '{a+=$1; d+=$2} END{print a+d+0}')"
files_changed="$(git diff --cached --name-only -- 2>/dev/null | grep -c . || true)"
if [ "${lines_changed:-0}" -ge 80 ] || [ "${files_changed:-0}" -ge 5 ]; then
  echo "💡 Diff staged khá lớn (${files_changed} file, ~${lines_changed} dòng đổi). Cân nhắc /code-review trước khi commit để bắt lỗi logic/trùng lặp." >&2
fi

exit 0
