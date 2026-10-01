#!/usr/bin/env bash
# auto-format.sh — PostToolUse hook (matcher: Edit|Write|MultiEdit).
#
# VÌ SAO CẦN: `pre-commit-gate.sh` từ lâu đã ghi "Format không tự chạy ở đây vì `auto-format.sh`
# (PostToolUse) đã format ngay sau mỗi Edit/Write" — nhưng file này CHƯA TỪNG tồn tại và
# settings.json không có PostToolUse nào (phát hiện khi đối chiếu với ECC, 2026-10-01). Format
# vì thế chỉ được lint-staged làm lúc `git commit` → file Claude đang làm việc lệch với file sẽ
# được commit, và commit kèm `--no-verify` thì bỏ lọt hẳn (CI job `static` mới bắt).
# Chuyển thể `post-edit-format` của ECC (affaan-m/ECC v2.2.2, MIT), bản DHCB:
#   - Gọi THẲNG `node_modules/.bin/prettier` (không npx → không tải gì qua mạng, không trễ).
#   - Tôn trọng `.prettierignore` (Prettier tự bỏ qua file bị ignore kể cả khi truyền tên file).
#   - Prettier không parse được file → gần như chắc có LỖI CÚ PHÁP: báo ngay cho Claude (exit 2
#     ở PostToolUse = đưa stderr cho Claude đọc, KHÔNG hoàn tác thao tác vừa làm).
#   - KHÔNG chạy `tsc` sau mỗi lần sửa như ECC: typecheck của DHCB gồm 4 project, chạy mỗi lần
#     sửa là quá chậm; nó đã được `pre-commit-gate.sh` chặn ở lúc commit.
set -uo pipefail   # cố ý KHÔNG -e: hook lỗi không được làm sập phiên

command -v jq >/dev/null 2>&1 || exit 0
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
PRETTIER="$ROOT/node_modules/.bin/prettier"
[ -x "$PRETTIER" ] || exit 0   # chưa `npm ci` → im lặng, lint-staged/CI vẫn là tuyến sau

payload="$(cat)"
file="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"
[ -n "$file" ] || exit 0
ROOT="${ROOT//\\//}"           # Windows (Git Bash): `\` → `/`
file="${file//\\//}"
case "$file" in
  "$ROOT"/*) ;;
  /* | [A-Za-z]:/*) exit 0 ;;    # file ngoài repo (scratchpad, /tmp…) — không phải việc của dự án
  *) file="$ROOT/${file#./}" ;;
esac
[ -f "$file" ] || exit 0

# Cùng tập phần mở rộng mà `.lintstagedrc.json` giao cho Prettier.
case "$file" in
  *.ts | *.tsx | *.js | *.jsx | *.mjs | *.cjs | *.json | *.css | *.md | *.html | *.yml | *.yaml) ;;
  *) exit 0 ;;
esac

cd "$ROOT" || exit 0
if ! out="$("$PRETTIER" --write --log-level warn "$file" 2>&1)"; then
  rel="${file#"$ROOT"/}"
  {
    echo "⚠️ auto-format: Prettier không format được \`$rel\` — thường là LỖI CÚ PHÁP trong lần sửa vừa rồi:"
    printf '%s\n' "$out" | head -n 15
  } >&2
  exit 2
fi
exit 0
