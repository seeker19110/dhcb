#!/usr/bin/env bash
# shared-file-reminder.sh — PreToolUse hook (matcher: Edit|Write|MultiEdit). CHỈ NHẮC, không chặn.
#
# VÌ SAO CẦN: CLAUDE.md mục 7 + 9 bắt "tra bản đồ code TRƯỚC khi sửa file dùng chung"
# (`npm run codemap -- impact <file>`), nhưng đó là luật bằng chữ. ECC (affaan-m/ECC v2.2.2) có
# hook GateGuard CHẶN lần sửa đầu tiên của MỌI file cho tới khi tác tử trình đủ dữ kiện — chặn mọi
# file thì ma sát quá lớn với dự án ~2.400 file TS như DHCB (ADR-0013 mục đợt 2). Bản DHCB chỉ nhắc,
# và chỉ nhắc cho file THẬT SỰ dùng chung: số file đang import nó ≥ NGUONG, đếm từ bản đồ
# `.codemap/graph.json` (sinh bởi `npm run codemap`, gitignore). Mỗi file nhắc MỘT lần mỗi phiên.
#
# Không có bản đồ → im lặng (KHÔNG tự quét: lần quét đầu mất ~45 giây, quá chậm cho một hook).
# Bản đồ cũ hơn mã nguồn vẫn dùng được — con số chỉ để nhắc, không để chặn.
set -uo pipefail   # cố ý KHÔNG -e: hook lỗi không được làm sập phiên

# File có từ chừng này nơi import trở lên mới nhắc (≈ 42 file ở thời điểm 2026-10-01).
NGUONG=20

payload="$(cat)"   # đọc HẾT stdin trước mọi `exit` sớm (tránh EPIPE cho bên gọi, changelog 0472)
command -v jq >/dev/null 2>&1 || exit 0
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
ROOT="${ROOT//\\//}"
GRAPH="$ROOT/.codemap/graph.json"
[ -f "$GRAPH" ] || exit 0

file="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"
[ -n "$file" ] || exit 0
file="${file//\\//}"
case "$file" in
  "$ROOT"/*) rel="${file#"$ROOT"/}" ;;
  /* | [A-Za-z]:/*) exit 0 ;;
  *) rel="${file#./}" ;;
esac

# Chỉ mã nguồn TS mà codemap quét; file test và file mới (chưa ai import) bỏ qua.
case "$rel" in
  *.test.ts | *.test.tsx) exit 0 ;;
  apps/dhcb/src/*.ts | apps/dhcb/src/*.tsx | apps/hub/src/*.ts | apps/hub/src/*.tsx) ;;
  apps/server/src/*.ts | packages/*.ts | packages/*.tsx | scripts/*.ts) ;;
  *) exit 0 ;;
esac
[ -f "$ROOT/$rel" ] || exit 0

# Mỗi file chỉ nhắc một lần mỗi phiên (cùng thư mục ghi nhận với config-protection.sh).
sid="$(printf '%s' "$payload" | jq -r '.session_id // empty' 2>/dev/null | tr -cd 'A-Za-z0-9_-')"
[ -n "$sid" ] || exit 0
ack_dir="${GATE_ACK_DIR:-$ROOT/.claude/.gate-ack}"
ack="$ack_dir/$sid.shared"
grep -qxF -- "$rel" "$ack" 2>/dev/null && exit 0

n="$(jq --arg f "$rel" '[.imports[] | select(.to == $f)] | length' "$GRAPH" 2>/dev/null)"
case "$n" in '' | *[!0-9]*) exit 0 ;; esac
[ "$n" -ge "$NGUONG" ] || exit 0

mkdir -p "$ack_dir" 2>/dev/null && printf '%s\n' "$rel" >>"$ack" 2>/dev/null
msg="📍 shared-file-reminder: \`$rel\` đang được $n file import (theo .codemap/graph.json — có thể hơi cũ). Đổi chữ ký, kiểu hay hành vi công khai của nó là đổi cho cả $n nơi: chạy \`npm run codemap -- impact $rel\` để biết phạm vi TRƯỚC khi sửa, rồi chạy test của các nơi bị ảnh hưởng (CLAUDE.md mục 7, 9). Chỉ nhắc một lần cho file này trong phiên."
jq -n --arg c "$msg" '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:$c}}'
exit 0
