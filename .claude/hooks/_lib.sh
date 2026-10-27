#!/usr/bin/env bash
# _lib.sh — hàm dùng chung cho hook của repo (block-dangerous-git.sh, pre-commit-gate.sh) VÀ của khung X-Templates (phần cuối file).
# CHỈ để `source "$(dirname "$0")/_lib.sh"`, không tự chạy, không nối vào settings.json. Không `set` gì ở đây:
# hook gọi đã tự đặt shell option (cố ý KHÔNG -e — hook lỗi không được làm sập phiên).
#
# VÌ SAO TÁCH RA (changelog 0619, lấy từ seeker19110/project-template `.claude/hooks/_lib.sh` @ 59bd1d1):
# trước đây MỖI hook giữ một bản sao bộ lọc "bỏ dữ liệu trước khi so khớp", và hai bản đã lệch nhau —
# pre-commit-gate chỉ bỏ phần trong nháy, không bỏ thân heredoc. Đo thật 2026-10-12, bản cũ của
# block-dangerous-git để LỌT: `git push origin +HEAD:main`, `--delete main`, `-fu`, `bash -c 'git reset --hard'`,
# heredoc `<<-EOF` có dòng kết thúc thụt tab, và `"don't" && git reset --hard && echo "it's"` (TRAPS.md mục 22).
# Một bản duy nhất ở đây = sửa một chỗ, cả hai hook cùng nhận. Test: scripts/claude-hooks.test.ts.

# In lệnh Bash sắp chạy (`.tool_input.command`) từ payload JSON trên stdin; rỗng nếu không có.
# Hook gọi PHẢI tự kiểm `command -v jq` trước (mỗi hook giữ thông báo fail-open-có-cảnh-báo riêng).
read_hook_command() {
  jq -r '.tool_input.command // empty' 2>/dev/null
}

# Bỏ THÂN HEREDOC — dữ liệu nhiều dòng (commit message `git commit -F - <<EOF`, script `python3 - <<PY` có chuỗi
# `git reset --hard` làm dữ liệu test) không phải lệnh, so khớp nó là chặn oan.
#
# CẨN TRỌNG: bỏ NHẦM một dòng LÀ LỆNH thì hàng rào để lọt — hỏng theo chiều nguy hiểm. Vì thế:
#   - KHÔNG cho khoảng trắng giữa `<<` và delimiter: `echo "a << b"` từng bị nhận thành heredoc delimiter `b`
#     và nuốt mọi dòng sau. Đánh đổi cố ý: `cat << EOF` (có khoảng trắng) thì thân vẫn bị quét → có thể chặn oan;
#     chặn oan thì người dùng thấy ngay, còn lọt thì không ai biết.
#   - `<<-EOF`: bash bỏ TAB đầu dòng trước khi so terminator → so sau khi bỏ tab (bản cũ để lọt mọi dòng sau).
#   - `<<` nằm TRONG chuỗi nháy chưa đóng (`echo "x <<EOF"`) không phải heredoc.
# \047 = nháy đơn, \042 = nháy kép (escape bát phân của awk) — giữ cả chương trình awk trong một cặp nháy đơn.
strip_heredoc_bodies() {
  awk '
    BEGIN { delim = ""; dash = 0 }
    {
      if (delim != "") {
        line = $0
        if (dash) sub(/^\t+/, "", line)
        if (line == delim) delim = ""
        next
      }
      rest = $0; pre = ""
      while (match(rest, /<<-?[\047\042]?[A-Za-z_][A-Za-z0-9_]*[\047\042]?/)) {
        before = pre substr(rest, 1, RSTART - 1)
        d = substr(rest, RSTART, RLENGTH)
        q = before
        gsub(/\047[^\047]*\047|\042[^\042]*\042/, "", q)
        if (q !~ /[\047\042]/) {
          dash = (d ~ /^<<-/)
          sub(/^<<-?/, "", d)
          gsub(/[\047\042]/, "", d)
          delim = d
          break
        }
        pre = before d
        rest = substr(rest, RSTART + RLENGTH)
      }
      print
    }'
}

# Bỏ phần TRONG DẤU NHÁY (đơn và kép) trong MỘT lượt trái→phải. Bản cũ bỏ nháy đơn trước rồi mới bỏ nháy kép
# → `"don't" && git reset --hard && echo "it's"` mất luôn lệnh ở giữa (cặp '…' ghép từ hai chuỗi nháy kép).
strip_quoted() {
  sed -E "s/'[^']*'|\"[^\"]*\"//g"
}

# Chỉ bỏ KÝ TỰ nháy, giữ nội dung: dùng khi phần trong nháy có thể LÀ lệnh/tên nhánh (`bash -c 'git reset --hard'`,
# `-f origin "main"`). Rộng hơn strip_quoted → chỉ dùng ở chỗ chặn oan rẻ hơn để lọt.
strip_quote_marks() {
  tr -d "'\""
}

# Vỏ bọc chạy CHUỖI như lệnh: `bash -c '…'`, `sh -c "…"`, `zsh -lc '…'`, `eval "…"`.
# GIỚI HẠN (nói ra, không giấu): `cmd=…; eval "$cmd"` hay script ghi ra file rồi chạy thì hook KHÔNG thấy lệnh
# thật — hook là lưới đỡ lỗi vô ý, không phải hàng rào chống người cố né (branch protection mới là rào cứng).
HOOK_WRAPPER_RE="(^|[[:space:]])(bash|sh|zsh|eval)[[:space:]]+(-[A-Za-z]+[[:space:]]+)*[\"']"

# Văn bản để so khớp: bỏ thân heredoc, rồi bỏ phần trong nháy — TRỪ KHI lệnh có vỏ bọc chạy chuỗi, lúc đó phần
# trong nháy chính là lệnh nên chỉ bỏ ký tự nháy (chặn oan `echo "bash -c '…'"` là đánh đổi cố ý, chiều an toàn).
hook_scan_text() { # $1 = lệnh gốc
  local body
  body="$(printf '%s' "$1" | strip_heredoc_bodies)"
  if printf '%s' "$body" | grep -Eq "$HOOK_WRAPPER_RE"; then
    printf '%s' "$body" | strip_quote_marks
  else
    printf '%s' "$body" | strip_quoted
  fi
}

# ======================================================================================================================
# PHẦN CỦA KHUNG X-TEMPLATES (pre-bash-guard.sh, pre-edit-guard.sh, pre-mcp-guard.sh, pre-compact.sh, session-start.sh,
# stop-guard.sh `source` file này và cần các hàm dưới đây). Gộp từ _lib.sh.xtemplates-new khi cài khung; HAI PHẦN KHÔNG
# TRÙNG TÊN hàm/biến nào (đã đối chiếu) nên giữ nguyên tên cả hai phía. Cập nhật khung: so sánh lại phần này với bản
# `_lib.sh` mới của khung (install.py ghi `_lib.sh.xtemplates-new`), đừng chép đè cả file — sẽ mất phần của repo ở trên.
# Dùng: XT_ROOT, xt_py, py_run, guard_fields, json_field, pretool_decision, ask_strict, fence_closed, utf8_head,
# context_output. Đồng bộ với khung 3.27.0 (changelog 0679, AUD-HAR-001).
# ======================================================================================================================

XT_ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

# Đường dẫn xt.py: dự án đích cài khung vào .xtemplates/, còn repo khung thì ở scripts/.
xt_py() {
  for p in "$XT_ROOT/.xtemplates/scripts/xt.py" "$XT_ROOT/scripts/xt.py"; do
    [ -f "$p" ] && { printf '%s' "$p"; return 0; }
  done
  return 1
}

# Chạy file Python của khung như module (`main()`), sys.path[0] = thư mục của file như khi chạy script (không lấy cwd).
# `-I` (cách ly): bỏ biến PYTHON*, user-site (`usercustomize.py`) và cwd — mã agent đặt ở đó không chạy trước guard
# (AUD-SEC-065). `-B`: Python không ghi bytecode (không đẻ `__pycache__` cạnh hook). KHÔNG cache bytecode: biên dịch từ
# nguồn mỗi lần — thư mục agent ghi được không thể tin (header pyc checked-hash tính được từ nguồn công khai, phần
# marshal không ai kiểm — AUD-SEC-074, review PR #182); đổi lại thêm ~80–100 ms mỗi lệnh Bash. Bộ nạp giống hệt
# `PY_LOADER` của guard.py (test so).
py_run() { # $1=đường dẫn .py (có main()) $2…=đối số
  python3 -I -B -c 'import sys
p = sys.argv[1]
d, _, f = p.rpartition("/")
sys.path.insert(0, d or ".")
code = compile(open(p, "rb").read(), p, "exec", dont_inherit=True)
m = type(sys)(f[:-3])
m.__file__ = p
sys.modules[m.__name__] = m
sys.argv = sys.argv[1:]
exec(code, m.__dict__)
sys.exit(m.main())
' "$@"
}

# Chạy guard.py một lần, đặt XG_DECISION XG_REASON XG_COMMIT XG_NO_VERIFY XG_COMMIT_DIR (định dạng `nul` của guard.py) — không
# sinh thêm tiến trình python để tách trường. Trả 1 khi guard.py không trả kết quả (lỗi cú pháp, bị kill, thiếu file).
# Gọi bằng `guard_fields <mode> <<<"$payload"` (không qua ống: ống chạy hàm trong subshell, mất biến).
# shellcheck disable=SC2034 # XG_* là kết quả cho hook đã source file này
guard_fields() { # $1=bash|edit|mcp
  local ok=""
  XG_DECISION="" XG_REASON="" XG_COMMIT="" XG_NO_VERIFY="" XG_COMMIT_DIR=""
  {
    IFS= read -r -d '' ok
    IFS= read -r -d '' XG_DECISION
    IFS= read -r -d '' XG_REASON
    IFS= read -r -d '' XG_COMMIT
    IFS= read -r -d '' XG_NO_VERIFY
    IFS= read -r -d '' XG_COMMIT_DIR
  } < <(CLAUDE_PROJECT_DIR="$XT_ROOT" py_run "$(dirname "$0")/guard.py" "$1" nul 2>/dev/null)
  [ "$ok" = ok ]
}

# Đọc một trường trong payload JSON (stdin của hook) bằng python3; rỗng nếu thiếu.
json_field() { # $1=payload $2=đường dẫn dạng a.b.c
  printf '%s' "$1" | python3 -I -c '
import json, sys
try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(0)
for k in sys.argv[1].split("."):
    d = d.get(k) if isinstance(d, dict) else None
    if d is None:
        sys.exit(0)
sys.stdout.write(d if isinstance(d, str) else json.dumps(d, ensure_ascii=False))
' "$2" 2>/dev/null
}

# In JSON quyết định PreToolUse (deny|ask|allow) kèm lý do, rồi exit 0.
pretool_decision() { # $1=deny|ask $2=lý do
  python3 -I -c '
import json, sys
print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse",
      "permissionDecision": sys.argv[1], "permissionDecisionReason": sys.argv[2]}}, ensure_ascii=False))
' "$1" "$2"
  exit 0
}

# Hỏi người CHỈ khi `XT_GUARD_POLICY=strict` (hành vi cũ); mặc định cho qua để phiên không dừng chờ (ADR-0018). Luôn exit 0.
ask_strict() { # $1=lý do
  [ "${XT_GUARD_POLICY:-}" = strict ] && pretool_decision ask "$1"
  exit 0
}

# Không kiểm được thứ phải kiểm (merge khi guard vắng/lỗi — ADR-0019, AUD-SEC-045): strict hỏi, mặc định CHẶN. Luôn exit 0.
fence_closed() { # $1=lý do
  [ "${XT_GUARD_POLICY:-}" = strict ] && pretool_decision ask "$1"
  pretool_decision deny "${1#Khung cần xác nhận: }"
}

# Cắt stdin tối đa $1 byte KHÔNG cắt giữa ký tự UTF-8 (head -c từng làm hỏng tiếng Việt — AUD-HAR-011).
utf8_head() {
  python3 -I -c 'import sys; sys.stdout.write(sys.stdin.buffer.read()[: int(sys.argv[1])].decode("utf-8", "ignore"))' "$1" 2>/dev/null
}

# In JSON additionalContext cho SessionStart/UserPromptSubmit.
context_output() { # $1=hookEventName $2=nội dung
  python3 -I -c '
import json, sys
print(json.dumps({"hookSpecificOutput": {"hookEventName": sys.argv[1],
      "additionalContext": sys.argv[2]}}, ensure_ascii=False))
' "$1" "$2"
}
