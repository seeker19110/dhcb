#!/usr/bin/env bash
# block-pipe-to-shell.sh — PreToolUse hook (matcher: Bash).
#
# VÌ SAO CẦN: "tải mã từ mạng rồi chạy THẲNG" (curl/wget nối vào sh/bash/python…) là đường cài
# mã độc kinh điển — không ai, kể cả tác tử, đọc được thứ sắp chạy. Security Guide của ECC
# (affaan-m/ECC v2.2.2) gợi ý chặn bằng luật quyền `Bash(curl * | bash)`, nhưng luật đó KHÔNG
# BAO GIỜ khớp ở Claude Code: lệnh được tách theo `|` và từng phần được so riêng (tài liệu
# permissions, mục "Compound commands") — phát hiện ở changelog 0468. Nên phải chặn bằng hook.
#
# Chặn (exit 2, thông báo về lại Claude) ba dạng:
#   1. Ống:        curl … | sh        wget -qO- … | sudo bash        curl … | python3 -
#   2. Thế lệnh:   sh -c "$(curl …)"  bash -c "$(wget -O- …)"        eval "$(curl …)"
#   3. Thế tiến trình: bash <(curl …)  source <(curl …)               . <(wget -O- …)
#
# KHÔNG chặn: tải về file (`curl -o x.sh …`) rồi đọc, rồi chạy — đó chính là cách đúng.
# Nội dung trong nháy ĐƠN và thân heredoc là dữ liệu (commit message, script mẫu), bị bỏ trước
# khi so khớp; nháy KÉP chỉ bỏ ở dạng 1 và 3 vì dạng 2 sống trong nháy kép.
#
# Bỏ qua có chủ đích (chủ dự án tự chạy lệnh cài đã đọc kỹ): đặt ALLOW_PIPE_TO_SHELL=1.
set -uo pipefail   # cố ý KHÔNG -e: hook lỗi không được làm sập phiên

# Đọc HẾT stdin TRƯỚC mọi `exit` sớm — xem chú thích cùng chỗ trong config-protection.sh.
payload="$(cat)"
[ "${ALLOW_PIPE_TO_SHELL:-0}" = "1" ] && exit 0
command -v jq >/dev/null 2>&1 || exit 0

cmd="$(printf '%s' "$payload" | jq -r '.tool_input.command // empty' 2>/dev/null)"
[ -n "$cmd" ] || exit 0

# Bỏ thân heredoc — cùng cách với block-dangerous-git.sh.
no_heredoc="$(printf '%s' "$cmd" | awk '
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
  }')"
no_single="$(printf '%s' "$no_heredoc" | sed "s/'[^']*'//g")"
no_quotes="$(printf '%s' "$no_single" | sed 's/"[^"]*"//g')"

# Khoảng trắng sau tên lệnh: `curl-config … | bash` không phải tải mạng.
FETCH='(curl|wget)[[:space:]]'
RUNNER='(sudo([[:space:]]+-[^[:space:]]+)*[[:space:]]+)?(env[[:space:]]+([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+)*)?(sh|bash|zsh|dash|ksh|python3?|node|perl|ruby)([[:space:]]|$)'
SHELL_C='(sh|bash|zsh|dash|ksh)[[:space:]]+-c[[:space:]]+"?\$\([[:space:]]*'

hit=""
if printf '%s' "$no_quotes" | grep -Eq "(^|[^[:alnum:]_-])${FETCH}[^|;&]*\|[[:space:]]*${RUNNER}"; then
  hit="tải rồi nối ống thẳng vào trình chạy"
elif printf '%s' "$no_single" | grep -Eq "(${SHELL_C}|eval[[:space:]]+\"?\\\$\([[:space:]]*)${FETCH}"; then
  hit="chạy kết quả tải về qua \$(…)"
elif printf '%s' "$no_quotes" | grep -Eq "((sh|bash|zsh|dash|ksh|source)|(^|[;&|[:space:]])\.)[[:space:]]+<\([[:space:]]*${FETCH}"; then
  hit="chạy kết quả tải về qua <(…)"
fi
[ -n "$hit" ] || exit 0

{
  echo "🚫 block-pipe-to-shell: lệnh bị chặn — $hit (tải bằng curl/wget, chạy bằng shell/interpreter)."
  echo "   Lý do: không ai đọc được mã sắp chạy; đây là đường cài mã độc kinh điển."
  echo "   Cách đúng: tải về FILE (-o /tmp/x.sh), ĐỌC nội dung, rồi mới chạy file đó."
  echo "   Nếu chủ dự án THỰC SỰ cần: chạy lại với ALLOW_PIPE_TO_SHELL=1 (và nói rõ lý do)."
} >&2
exit 2
