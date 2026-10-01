#!/usr/bin/env bash
# config-protection.sh — PreToolUse hook (matcher: Edit|Write|MultiEdit).
#
# VÌ SAO CẦN: khi một cổng đỏ, đường tắt rẻ nhất của tác tử AI là NỚI CỔNG thay vì sửa code —
# hạ ngưỡng coverage, tắt một luật ESLint, thêm file vào .prettierignore, sửa test canh luật CI
# "cho vừa". CLAUDE.md đã cấm bằng chữ ở nhiều chỗ (mục 11.1 "sửa cho đúng luật, đừng sửa test
# cho vừa"; mục 6 "đừng đổi parseCssColor thành bỏ qua"), nhưng chữ thì quên được. Hook này
# chuyển thể ý tưởng `config-protection` của ECC (affaan-m/ECC v2.2.2, MIT —
# scripts/hooks/config-protection.js), khác bản gốc ở HAI điểm có chủ đích:
#
#   1. Bản gốc CHẶN cứng (exit 2) — sửa cổng đôi khi là việc chính đáng (thêm gói mới vào
#      vitest include, thêm job CI…), chặn cứng chỉ đẩy tác tử sang sửa qua Bash. DHCB dùng HAI
#      NẤC theo kiểu "fact-forcing" của GateGuard (cũng trong ECC): lần ĐẦU chạm một cổng trong
#      phiên → `deny` kèm lý do (tác tử buộc phải dừng, nói rõ với người dùng sửa gì + vì sao,
#      rồi mới thử lại); từ lần thứ hai → `ask` (người dùng duyệt ở nơi có hộp hỏi).
#      VÌ SAO không chỉ `ask`: đo thật 2026-10-01 ở phiên cloud auto mode (mở từ iOS, Claude Code
#      2.1.286), hook trả `ask` hai lần nhưng KHÔNG hộp hỏi nào hiện ra và Edit chạy thẳng — tức
#      chỉ `ask` thì vô tác dụng ở đúng môi trường chủ dự án hay dùng. `deny` thì luôn có hiệu lực.
#   2. Danh sách file là CỔNG THẬT của DHCB (test canh luật, cổng a11y/tương phản, workflow CI,
#      chính các hook này) — không phải danh sách chung của mọi dự án.
#
# Chỉ áp cho file ĐÃ TỒN TẠI (tạo mới không nới được cổng nào). Không bắt được sửa qua Bash
# (`sed -i`, `>`) — đó là giới hạn của hook theo tool; CI vẫn là tuyến cuối (test canh luật).
#
# Bỏ qua có chủ đích (vd chủ dự án đang tự sửa cổng): đặt ALLOW_GATE_EDIT=1 trong môi trường.
set -uo pipefail   # cố ý KHÔNG -e: hook lỗi không được làm sập phiên

[ "${ALLOW_GATE_EDIT:-0}" = "1" ] && exit 0
command -v jq >/dev/null 2>&1 || exit 0

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
payload="$(cat)"
file="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"
[ -n "$file" ] || exit 0

# Chuẩn hoá: dấu `\` của Windows (Git Bash) → `/`; gỡ `..` để `scripts/../eslint.config.js`
# không lách được danh sách bên dưới.
ROOT="${ROOT//\\//}"
file="${file//\\//}"
if command -v realpath >/dev/null 2>&1; then
  ROOT="$(realpath -m -- "$ROOT" 2>/dev/null || printf '%s' "$ROOT")"
  case "$file" in
    /* | [A-Za-z]:/*) file="$(realpath -m -- "$file" 2>/dev/null || printf '%s' "$file")" ;;
    *) file="$(realpath -m -- "$ROOT/$file" 2>/dev/null || printf '%s' "$ROOT/$file")" ;;
  esac
fi

# Đường dẫn tương đối so với gốc repo; file nằm ngoài repo thì không phải việc của hook này.
case "$file" in
  "$ROOT"/*) rel="${file#"$ROOT"/}" ;;
  /* | [A-Za-z]:/*) exit 0 ;;
  *) rel="${file#./}" ;;
esac

# Tạo file mới → cho qua (không có cổng cũ nào bị nới).
[ -e "$ROOT/$rel" ] || [ -L "$ROOT/$rel" ] || exit 0

reason=""
case "$rel" in
  eslint.config.js | .prettierrc.json | .prettierignore | .lintstagedrc.json | commitlint.config.cjs | .size-limit.json)
    reason="cấu hình lint/format/ngân sách bundle — sửa CODE cho đạt luật, đừng nới luật" ;;
  vitest.config.ts)
    reason="giữ ngưỡng coverage và danh sách test được quét — hạ ngưỡng/bớt include là nới cổng" ;;
  tsconfig.base.json)
    reason="chứa compilerOptions chung (strict) — CLAUDE.md mục 4.1" ;;
  scripts/*-policy.test.ts | scripts/no-control-chars.test.ts | scripts/agent-config-security.test.ts)
    reason="test canh luật dự án — CLAUDE.md mục 11.1: sửa cho đúng luật, ĐỪNG sửa test cho vừa" ;;
  e2e/a11y.spec.ts | e2e/a11y-aaa.spec.ts | scripts/lib/contrast.ts)
    reason="cổng a11y AA/AAA tuyệt đối, không baseline — CLAUDE.md mục 4.5" ;;
  .github/workflows/*)
    reason="workflow CI (required check quality/e2e/metadata + secret) — CLAUDE.md mục 11.1" ;;
  .husky/*)
    reason="git hook chạy lint-staged/commitlint ở mọi commit" ;;
  .claude/settings.json | .claude/hooks/* | .claude/report-status.sh)
    reason="chính hàng rào an toàn của tác tử AI — tác tử không được tự tắt rào của mình; cấu hình hook còn là bề mặt tấn công (Check Point, CVE-2025-59536)" ;;
esac
[ -n "$reason" ] || exit 0

msg="🛡️ config-protection: \`$rel\` là CỔNG CHẤT LƯỢNG của DHCB ($reason)."

# Nấc 1/2: lần đầu chạm cổng này trong phiên → từ chối có chủ đích. Ghi nhận theo session_id
# (thư mục nằm trong .claude/ nên đã bị .gitignore loại; GATE_ACK_DIR chỉ để test trỏ chỗ khác).
sid="$(printf '%s' "$payload" | jq -r '.session_id // empty' 2>/dev/null | tr -cd 'A-Za-z0-9_-')"
if [ -n "$sid" ]; then
  ack_dir="${GATE_ACK_DIR:-$ROOT/.claude/.gate-ack}"
  ack="$ack_dir/$sid"
  if ! grep -qxF -- "$rel" "$ack" 2>/dev/null; then
    mkdir -p "$ack_dir" 2>/dev/null && printf '%s\n' "$rel" >>"$ack" 2>/dev/null
    jq -n --arg r "$msg TỪ CHỐI lần chạm đầu tiên trong phiên (có chủ đích). Nếu cổng THẬT SỰ cần đổi: nói rõ với người dùng sửa gì và vì sao — không phải để cho xanh — rồi thử lại; lần sau sẽ chuyển sang hỏi quyền. Đang đỏ vì code thì sửa CODE. Bỏ qua có chủ đích: ALLOW_GATE_EDIT=1." \
      '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
    exit 0
  fi
fi

# Nấc 2/2: đã được nhắc trong phiên này (hoặc không có session_id) → hỏi người dùng.
jq -n --arg r "$msg Người dùng duyệt thay đổi này — lý do phải đã được nêu rõ trong câu trả lời. Bỏ qua có chủ đích: ALLOW_GATE_EDIT=1." \
  '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"ask",permissionDecisionReason:$r}}'
exit 0
