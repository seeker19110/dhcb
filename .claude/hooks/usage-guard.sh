#!/usr/bin/env bash
# usage-guard.sh — Stop hook. Sau mỗi lượt, ước tính % quota 5h (scripts/usage-estimate.sh).
# Nếu >= ngưỡng → tiêm additionalContext nhắc AI WIND-DOWN (không chặn cứng).
# Nhắc MỘT lần/phiên (marker) để không lặp. Tự tắt khi chưa khai báo budget (OVERALL=NA).
#
# VÌ SAO CẦN: CLAUDE.md mục 3 đã có luật "≥70% → hoàn tất việc đang làm, tạo PR rồi DỪNG chờ
# người dùng" nhưng trước hook này luật này HOÀN TOÀN THỦ CÔNG — không có cơ chế đo/nhắc. Copy
# gần nguyên bản từ seeker19110/projects-template .claude/hooks/usage-guard.sh (2026-09-19).
#
# BẬT tính năng: copy .claude/usage-budget.example.sh thành .claude/usage-budget.sh và điền số
# (file cá nhân, không commit — đã nằm trong .gitignore qua ".claude/*").
set -uo pipefail   # cố ý KHÔNG -e: không được làm chết phiên/lượt chạy

payload="$(cat)"   # đọc HẾT stdin trước mọi `exit` sớm (tránh EPIPE cho bên gọi, changelog 0472)
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
command -v jq >/dev/null 2>&1 || exit 0

tp="$(printf '%s' "$payload" | jq -r '.transcript_path // empty' 2>/dev/null)"
[ -n "$tp" ] || exit 0
[ -x "$ROOT/scripts/usage-estimate.sh" ] || exit 0

out="$("$ROOT/scripts/usage-estimate.sh" "$tp" 2>/dev/null)" || exit 0
overall="$(printf '%s' "$out" | sed -n 's/^OVERALL=//p' | head -1)"
thr="$(printf '%s' "$out" | sed -n 's/^THRESHOLD=//p' | head -1)"
[ -n "$overall" ] && [ "$overall" != "NA" ] || exit 0
[ -n "$thr" ] || thr=70

# So sánh nguyên; nếu chưa đạt ngưỡng → im lặng.
if [ "$overall" -lt "$thr" ] 2>/dev/null; then exit 0; fi

MARK="$ROOT/.claude/.winddown-nudged"
[ -f "$MARK" ] && exit 0
touch "$MARK" 2>/dev/null || true

detail="$(printf '%s' "$out" | grep -E '^(opus|sonnet|haiku|fable)=' | tr '\n' ' ')"
reason="⚠️ Ước tính đã dùng ~${overall}% quota 5h (ngưỡng ${thr}%). Chi tiết: ${detail}. WIND-DOWN NGAY theo CLAUDE.md mục 3: hoàn tất gọn đơn vị đang làm, chạy đủ cổng (mục 8), tạo PR (nhật ký docs/changelog/ + cập nhật PROGRESS.md nếu đổi trạng thái), bật auto-merge, rồi DỪNG phiên sạch sẽ chờ người dùng. KHÔNG khởi động đơn vị/merge mới."

jq -n --arg r "$reason" '{hookSpecificOutput:{hookEventName:"Stop",additionalContext:$r}}'
exit 0
