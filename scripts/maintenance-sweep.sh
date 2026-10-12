#!/usr/bin/env bash
# maintenance-sweep.sh — Engine QUÉT BẢO TRÌ tổng hợp, CHỈ ĐỌC + ĐO, không sửa gì.
#
# VÌ SAO CẦN: "bảo trì" là việc lặp lại (tuần/tháng) gồm nhiều mảng rời rạc — dependency lỗi
# thời/lỗ hổng, nhánh git chết, PROGRESS.md/đặc tả lỗi thời, nợ TODO, bí mật lọt vào git, action
# CI chưa ghim SHA. Trước script này, DHCB chỉ có `scripts/check-progress-freshness.sh` — kiểm
# ĐÚNG MỘT mảng (nhánh nêu tên trong PROGRESS.md còn tồn tại không). Các mảng còn lại không ai
# nhớ hết, dễ bị bỏ hoặc làm lệch. Script này gom mọi phép đo về một báo cáo Markdown, để việc
# TRIAGE + LẬP KẾ HOẠCH không phải nhớ danh sách kiểm. Tham khảo
# seeker19110/projects-template scripts/maintenance-sweep.sh (2026-09-19) — viết lại RIÊNG cho
# stack cố định của DHCB (npm/Node), bỏ lớp "tự dò hệ sinh thái" của bản gốc (DHCB không cần).
#
# Dùng: scripts/maintenance-sweep.sh [--out <file.md>] [--strict] [--gate] [--no-deps]
#   --out      ghi báo cáo ra file (mặc định: stdout)
#   --strict   thoát mã 1 nếu có phát hiện mức 🔴 (dùng cho lịch tuần/CI)
#   --gate     chạy thêm npm run typecheck/lint/test — chậm, tuỳ chọn
#   --no-deps  bỏ qua `npm outdated`/`npm audit` (cần mạng; tắt khi offline)
#
# Mức độ:  🔴 phải xử lý ngay (bí mật lọt git, cổng đỏ, lỗ hổng dependency)
#          🟡 nên lên kế hoạch (dependency lỗi thời, tài liệu lỗi thời, nhánh chết, TODO nhiều)
#          ℹ️  thông tin (số liệu tham chiếu)
set -uo pipefail   # cố ý KHÔNG -e: một phép đo hỏng không được làm chết cả lượt quét

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
OUT=""; STRICT=0; RUN_GATE=0; DO_DEPS=1
DEPS_TIMEOUT="${MAINT_DEPS_TIMEOUT:-180}"
TODO_WARN="${MAINT_TODO_WARN:-30}"

while [ $# -gt 0 ]; do
  case "$1" in
    --out)     OUT="${2:-}"; shift 2 ;;
    --strict)  STRICT=1; shift ;;
    --gate)    RUN_GATE=1; shift ;;
    --no-deps) DO_DEPS=0; shift ;;
    -h|--help) sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) printf '[maintenance-sweep] tham số lạ: %s\n' "$1" >&2; exit 2 ;;
  esac
done

cd "$ROOT" || exit 2

RED=0; YEL=0
FINDINGS=()
REPORT=()

red()  { RED=$((RED+1)); FINDINGS+=("🔴|$1|$2|$3"); }
yel()  { YEL=$((YEL+1)); FINDINGS+=("🟡|$1|$2|$3"); }
info() { FINDINGS+=("ℹ️|$1|$2|$3"); }
sec()  { REPORT+=("" "## $1" ""); }
line() { REPORT+=("$1"); }
block() { local l; line '```'; while IFS= read -r l; do line "$l"; done; line '```'; }

has() { command -v "$1" >/dev/null 2>&1; }
tracked() { git ls-files -z 2>/dev/null; }

run_capture() { # $1=giây, $2..=lệnh (chuỗi bash)
  local secs="$1"; shift
  if has timeout; then timeout "$secs" bash -c "$*" 2>&1; else bash -c "$*" 2>&1; fi
}

# ── 1. Git hygiene ────────────────────────────────────────────────────────────
sweep_git() {
  sec "1. Git"
  local main dirty behind stale_n stale_list last_age
  main="$(git symbolic-ref -q --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##')"
  [ -n "$main" ] || main=main
  dirty="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
  line "- Nhánh chính: \`$main\` · nhánh hiện tại: \`$(git rev-parse --abbrev-ref HEAD 2>/dev/null)\`"
  line "- File chưa commit: $dirty"
  [ "$dirty" -gt 0 ] && yel Git "$dirty file chưa commit trong working tree" "commit hoặc stash trước khi bảo trì"
  if git show-ref -q --verify "refs/remotes/origin/$main"; then
    behind="$(git rev-list --count "HEAD..origin/$main" 2>/dev/null || echo 0)"
    line "- Commit đứng sau \`origin/$main\`: $behind"
    [ "$behind" -gt 0 ] && yel Git "nhánh hiện tại đứng sau origin/$main $behind commit" "merge/rebase với $main trước"
  fi
  stale_list="$(git branch --merged "$main" 2>/dev/null | sed 's/^[* ] *//' | grep -vxE "$main|$(git rev-parse --abbrev-ref HEAD)" || true)"
  stale_n="$(printf '%s' "$stale_list" | grep -c . || true)"
  line "- Nhánh local đã merge vào \`$main\` chưa xoá: $stale_n"
  [ "$stale_n" -gt 0 ] && yel Git "$stale_n nhánh local đã merge còn sót: $(printf '%s' "$stale_list" | tr '\n' ' ')" "git branch -d <nhánh>"
  last_age="$(( ( $(date +%s) - $(git log -1 --format=%ct 2>/dev/null || date +%s) ) / 86400 ))"
  line "- Commit gần nhất: $last_age ngày trước"
  info Git "commit gần nhất $last_age ngày trước" "—"
}

# ── 2. Dependency (npm — stack cố định, xem CLAUDE.md mục 6) ─────────────────
sweep_deps() {
  sec "2. Dependency (npm)"
  if [ "$DO_DEPS" -eq 0 ]; then line "bỏ qua (--no-deps)"; info Dependency "bỏ qua theo --no-deps" "—"; return; fi
  local out rc
  out="$(run_capture "$DEPS_TIMEOUT" "npm outdated")"; rc=$?
  line "- npm outdated: exit $rc"
  if [ "$rc" -eq 124 ]; then
    yel Dependency "outdated: hết giờ sau ${DEPS_TIMEOUT}s (mạng/proxy?)" "chạy tay: npm outdated"
  elif [ -n "$out" ]; then
    yel Dependency "có gói lỗi thời" "chạy tay: npm outdated — lên kế hoạch nâng theo lô"
  fi
  [ -n "$out" ] && block <<<"$(printf '%s\n' "$out" | head -n 25)"

  # Khớp cổng CI job `audit` (mục 9 CLAUDE.md): 0 lỗ hổng ở production deps.
  out="$(run_capture "$DEPS_TIMEOUT" "npm audit --omit=dev")"; rc=$?
  line "- npm audit --omit=dev: exit $rc"
  if [ "$rc" -eq 124 ]; then
    yel Dependency "audit: hết giờ sau ${DEPS_TIMEOUT}s" "chạy tay: npm audit --omit=dev"
  elif [ "$rc" -ne 0 ]; then
    red Dependency "npm audit báo lỗ hổng ở production deps (exit $rc)" "chạy tay: npm audit --omit=dev — nâng gói bị ảnh hưởng (CI job audit sẽ đỏ)"
  fi
  [ "$rc" -ne 0 ] && [ -n "$out" ] && block <<<"$(printf '%s\n' "$out" | tail -n 25)"
}

# ── 3. Tài liệu & nợ kỹ thuật ─────────────────────────────────────────────────
sweep_docs() {
  sec "3. Tài liệu & nợ kỹ thuật"
  if [ -x scripts/check-progress-freshness.sh ]; then
    local out rc
    out="$(bash scripts/check-progress-freshness.sh 2>&1)"; rc=$?
    line "- check-progress-freshness.sh: exit $rc"
    if [ "$rc" -ne 0 ]; then
      yel "Tài liệu" "PROGRESS.md nhắc nhánh đã lỗi thời (xem TRAPS.md mục 2)" "cập nhật PROGRESS.md — gạch/nhãn nhánh đã merge/xoá"
      block <<<"$(printf '%s\n' "$out" | head -n 15)"
    fi
  else
    line "- check-progress-freshness.sh: không có/không chạy được"
  fi
  if [ -d docs/specs ]; then
    local n
    n="$(grep -lE '\*\*Trạng thái:\*\*\s*(Draft|In review)' docs/specs/*.md 2>/dev/null | wc -l | tr -d ' ')"
    line "- Đặc tả chưa Approved (Draft/In review) trong docs/specs/: $n"
    [ "$n" -gt 0 ] && info "Tài liệu" "$n đặc tả còn Draft/In review" "duyệt hoặc đóng đặc tả treo"
  fi
  if [ -d docs/goals ]; then
    local n
    n="$(grep -liE 'BLOCKED' docs/goals/*.md 2>/dev/null | grep -v README | wc -l | tr -d ' ')"
    line "- File trong docs/goals/ có nhắc BLOCKED: $n"
    [ "$n" -gt 0 ] && yel "Tài liệu" "$n goal có thể đang BLOCKED chờ quyết định" "xem docs/goals/ — quyết định rồi mở lại"
  fi
  local n
  n="$(tracked | grep -zvE '\.(md|json|lock|svg|png|jpg)$' | xargs -0 grep -lE '\b(TODO|FIXME|HACK|XXX)\b' 2>/dev/null | grep -vc "maintenance-sweep.sh" || true)"
  line "- File có TODO/FIXME/HACK/XXX: $n"
  if [ "${n:-0}" -gt "$TODO_WARN" ]; then yel "Nợ kỹ thuật" "$n file có TODO/FIXME/HACK (ngưỡng $TODO_WARN)" "gom thành mục nợ trong PROGRESS.md hoặc xử lý theo lô"; else info "Nợ kỹ thuật" "$n file có TODO/FIXME/HACK" "—"; fi
}

# ── 4. Vệ sinh repo & bí mật ──────────────────────────────────────────────────
sweep_hygiene() {
  sec "4. Vệ sinh repo & bí mật"
  local envs hits big
  envs="$(tracked | grep -zE '(^|/)\.env(\.[a-z]+)?$' | grep -zvE '\.example$|\.sample$|\.template$' | tr '\0' ' ')"
  line "- File .env đang được git theo dõi: ${envs:-không}"
  [ -n "$envs" ] && red "Bí mật" "file .env nằm trong git: $envs" "git rm --cached <file> + thêm vào .gitignore + xoay vòng bí mật"
  # Loại .md khỏi quét PEM/khoá: tài liệu vận hành (vd docs/ke-hoach-khoi-phuc-su-co-server.md)
  # thường TRÍCH DẪN khuôn "-----BEGIN ... PRIVATE KEY-----" để giải thích, không phải khoá thật.
  # Mẫu bí mật lấy từ MỘT nguồn chung với cổng commit (scripts/_commit-guard.sh — changelog 0619). Bản cũ tự
  # chép regex riêng và sót `sk-ant-` (Anthropic — AI chính), `AIza` (Google TTS/Gemini), `github_pat_`.
  # shellcheck source=scripts/_commit-guard.sh
  source "$ROOT/scripts/_commit-guard.sh"
  # CHỈ in `đường-dẫn:dòng` — KHÔNG in nội dung dòng: báo cáo này được dán vào issue/PR, in khoá ra là
  # làm lộ chính khoá đang cảnh báo (bản cũ in tới 160 ký tự mỗi dòng khớp).
  hits="$(tracked | grep -zvE '\.(example|sample|md)$|maintenance-sweep\.sh$|_commit-guard\.sh$' \
    | xargs -0 grep -nIE "$COMMIT_GUARD_SECRET_RE" 2>/dev/null | cut -d: -f1,2 | head -n 10 || true)"
  if [ -n "$hits" ]; then
    line "- Chuỗi giống bí mật (chỉ vị trí, nội dung đã che):"; block <<<"$(sed 's/$/ [redacted]/' <<<"$hits")"
    red "Bí mật" "$(printf '%s\n' "$hits" | wc -l | tr -d ' ') dòng giống khoá/token thật trong file được git theo dõi" "xoá khỏi lịch sử + xoay vòng khoá; khoá GIẢ trong test thì dựng bằng nối chuỗi"
  else
    line "- Chuỗi giống bí mật (Anthropic/Google/GitHub/AWS/PEM/JWT/…): không"
  fi
  # Đọc tên file bằng `read -d ''` — KHÔNG chèn tên file vào chuỗi `sh -c "…{}…"` (tên file chứa `"`/`$(…)` sẽ
  # thành lệnh chạy được).
  big=""
  local f s
  while IFS= read -r -d '' f; do
    [ -f "$f" ] || continue
    s="$(wc -c <"$f" 2>/dev/null || echo 0)"
    [ "$s" -gt 2097152 ] && big="${big}${big:+$'\n'}$f ($((s / 1024)) KB)"
  done < <(tracked)
  line "- File > 2 MB được theo dõi: ${big:-không}"
  [ -n "$big" ] && yel "Vệ sinh" "file lớn trong git: $(printf '%s' "$big" | tr '\n' ' ')" "cân nhắc Git LFS hoặc loại khỏi repo"
}

# ── 5. CI & chuỗi cung ứng ────────────────────────────────────────────────────
sweep_ci() {
  sec "5. CI & chuỗi cung ứng"
  local wf unpinned
  if [ ! -d .github/workflows ]; then line "n-a — không có .github/workflows"; return; fi
  wf="$(find .github/workflows -maxdepth 1 \( -name '*.yml' -o -name '*.yaml' \) | wc -l | tr -d ' ')"
  line "- Workflow: $wf"
  unpinned="$(grep -nE '^\s*-?\s*uses:\s*[^./][^@]*@' .github/workflows/*.y*ml 2>/dev/null | grep -vE '@[0-9a-f]{40}' || true)"
  if [ -n "$unpinned" ]; then
    line "- Action ghim theo tag (vd \`v7\`), không phải SHA đầy đủ — chấp nhận được, chỉ cảnh báo:"
    block <<<"$unpinned"
    info CI "$(printf '%s\n' "$unpinned" | wc -l | tr -d ' ') action ghim theo tag, không phải SHA đầy đủ" "cân nhắc ghim SHA cho action bên thứ ba không phải actions/* chính chủ"
  else
    line "- Action chưa ghim full SHA: không"
  fi
}

# ── 6. Cổng khung ─────────────────────────────────────────────────────────────
run_gate_script() {
  local label="$1"; shift
  local out rc; out="$(run_capture 300 "$*")"; rc=$?
  if [ "$rc" -eq 0 ]; then line "- $label: ✅"; else
    line "- $label: ❌ (exit $rc)"; block <<<"$(printf '%s\n' "$out" | tail -n 20)"
    red "Cổng" "$label đỏ" "chạy \`$*\` và sửa theo output"
  fi
}
sweep_gates() {
  sec "6. Cổng khung"
  if [ -f .codemap/graph.json ] || npm run codemap >/dev/null 2>&1; then
    local cycles
    cycles="$(npm run codemap -- cycles 2>/dev/null | grep -c "Chu trình" || true)"
    line "- codemap cycles: $([ "${cycles:-0}" -eq 0 ] && echo "0 ✅" || echo "$cycles ❌")"
    [ "${cycles:-0}" -gt 0 ] && red "Cổng" "codemap phát hiện chu trình import" "npm run codemap -- cycles để xem chi tiết"
  else
    line "- codemap: chưa quét được"
  fi
  if [ -x scripts/check-spec-paths.ts ] || [ -f scripts/check-spec-paths.ts ]; then
    if npm run check:specs >/tmp/maint-specs.$$ 2>&1; then
      line "- check:specs: ✅"
    else
      line "- check:specs: ❌"; block <<<"$(tail -n 15 /tmp/maint-specs.$$)"
      red "Cổng" "đặc tả Approved trỏ tới path không tồn tại" "npm run check:specs -- --ci để xem chi tiết"
    fi
    rm -f /tmp/maint-specs.$$
  fi
  if [ "$RUN_GATE" -eq 1 ]; then
    run_gate_script "typecheck" npm run typecheck
    run_gate_script "lint" npm run lint
    run_gate_script "test" npm test
  else
    line "- typecheck/lint/test: bỏ qua (thêm \`--gate\` để chạy — chậm)"
  fi
}

sweep_git; sweep_deps; sweep_docs; sweep_hygiene; sweep_ci; sweep_gates

{
  echo "# Báo cáo quét bảo trì — $(date +%Y-%m-%d)"
  echo
  echo "> Sinh bởi \`scripts/maintenance-sweep.sh\` (chỉ đọc + đo, không sửa). 🔴 $RED · 🟡 $YEL."
  echo "> Mọi sửa đổi từ báo cáo này đi PR riêng, qua đủ cổng CLAUDE.md mục 8."
  echo
  echo "## Tổng hợp phát hiện"
  echo
  echo "| Mức | Mảng | Phát hiện | Cách xử lý |"
  echo "| --- | --- | --- | --- |"
  for f in "${FINDINGS[@]}"; do
    IFS='|' read -r lv area what how <<<"$f"
    printf '| %s | %s | %s | %s |\n' "$lv" "$area" "${what//|/\\|}" "${how//|/\\|}"
  done
  printf '%s\n' "${REPORT[@]}"
} > "${OUT:-/dev/stdout}"

[ -n "$OUT" ] && printf '[maintenance-sweep] báo cáo: %s (🔴 %s · 🟡 %s)\n' "$OUT" "$RED" "$YEL" >&2
if [ "$STRICT" -eq 1 ] && [ "$RED" -gt 0 ]; then exit 1; fi
exit 0
