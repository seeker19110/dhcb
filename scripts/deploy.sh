#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Triển khai English Tutor, CHẠY TRỰC TIẾP TRÊN VPS (không SSH).
#
# Cách dùng (đang đứng trên VPS, user root):
#     cd /var/www/dhcb
#     bash scripts/deploy.sh
#   (hoặc gọi từ bất kỳ đâu: bash /var/www/dhcb/scripts/deploy.sh)
#
# Cơ chế: ép thư mục code KHỚP CHÍNH XÁC với origin/main (git reset --hard) →
#         dọn file build/data cũ → cài + build sạch → restart PM2 → health check.
# Nhờ "reset --hard origin/main", mọi PR đã merge vào main đều được gộp, và mọi
# thay đổi cục bộ lỡ tay trên VPS bị bỏ → tránh kẹt "git pull" hay sót dữ liệu cũ.
#
# AN TOÀN: .env / node_modules / dist đều nằm trong .gitignore nên KHÔNG bị xoá.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── CONFIG — tự động nhận diện thư mục dự án ──────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="${APP_DIR:-$SCRIPT_DIR}"        # tự động nhận thư mục (vd /var/www/dhcb)
BRANCH="main"                            # luôn deploy main (gồm mọi PR đã merge)
PM2_PROCESS="dhcb"
PORT="3001"                              # cổng app để kiểm tra health sau restart

# Biến môi trường cần thêm (bỏ trống nếu đã có sẵn trong .env trên VPS)
CRON_SECRET=""                           # <-- đặt chuỗi bí mật nếu .env chưa có
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════════"
echo "  🚀  English Tutor — Deploy (trên VPS)"
echo "  Dir   : $APP_DIR"
echo "  Branch: $BRANCH (ép khớp origin/$BRANCH)"
echo "═══════════════════════════════════════════════"

echo "── [1/6] Vào thư mục app ───────────────────────"
cd "$APP_DIR"

echo "── [2/6] Ép code KHỚP origin/$BRANCH (gồm mọi PR đã merge) ──"
if [ -n "${GITHUB_TOKEN:-}" ]; then
  REPO_NAME="${GITHUB_REPOSITORY:-seeker19110/dhcb}"
  git fetch "https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO_NAME}.git" "$BRANCH" --prune --tags
  git checkout -f -B "$BRANCH" FETCH_HEAD
  git reset --hard FETCH_HEAD
else
  git fetch origin --prune --tags 2>/dev/null || true
  git checkout -f -B "$BRANCH" "origin/$BRANCH" 2>/dev/null || git checkout -f -B "$BRANCH" 2>/dev/null || true
  git reset --hard "origin/$BRANCH" 2>/dev/null || true
fi
echo "  → Đang ở commit:"
git --no-pager log -1 --oneline

echo "── [3/7] Dọn dữ liệu CŨ (tránh sót, vd lessons 1000 bài cũ) ──"
# KHÔNG xoá dist/ ở đây — ĐỪNG THÊM LẠI dòng xoá thư mục dist.
#
# [Sự cố 2026-08-23] Dòng `rm -rf dist` từng đứng ngay đây đã gây SẬP WEB VÀI PHÚT MỖI LẦN
# DEPLOY: nó xoá giao diện ngay từ bước [3], trong khi mãi bước [6] mới build lại — suốt
# khoảng giữa (cài dependencies + migration + build) app VẪN ONLINE nhưng không còn
# dist/index.html, nên mọi request vào trang đều hỏng. Log production đúng lúc người dùng
# không đăng nhập được:
#   Error: ENOENT: no such file or directory, stat '/var/www/dhcb/dist/index.html'
#
# Bỏ đi KHÔNG làm build bẩn hơn: apps/dhcb/vite.config.ts đã đặt `emptyOutDir: true`, tức
# Vite tự dọn sạch thư mục NGAY TRƯỚC KHI ghi file mới. Cửa sổ chết vì thế co từ vài phút
# xuống còn đúng lúc Vite ghi (~vài giây).
git clean -fd apps/dhcb/public/data || true  # bỏ file rác không-theo-dõi (public/ đã dời vào apps/dhcb ở PR-S2)

echo "── [4/7] Cài dependencies (npm ci) ─────────────"
npm ci || npm install                    # npm ci: cài đúng lockfile; lỗi → fallback install

echo "── [5/7] Chạy migration Postgres tự host còn thiếu ─────"
# Tự áp mọi file postgres/migrations/*.sql chưa chạy (cần DATABASE_URL trong .env —
# xem postgres/migrations/README.md). Dừng deploy nếu migration lỗi (set -e ở trên).
npm run migrate:pg

echo "── [6/7] Build ──────────────────────────────────"
# [2026-09-22, incident] 5 lần deploy liên tiếp sập ĐÚNG cùng chữ ký lỗi:
#   FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed
#   - JavaScript heap out of memory   (heap chạm ~1.48 GB rồi crash, exit 134)
# KHÁC sự cố 2026-08-26 (kernel OOM killer giết tiến trình vì RAM/swap thật sự cạn — đã vá
# bằng scripts/setup-swap.sh): đây là process V8 TỰ BÁO "hết heap" trước khi chạm trần vật
# lý — VPS 3GB RAM + swap 6G vẫn còn chỗ, nhưng Node không biết dùng, vì KHÔNG file nào
# trong build đặt `--max-old-space-size` nên V8 tự chọn mức cũ dựa trên RAM máy, không tính
# swap. `tsc -b` 16 workspace + `vite build` project ngày càng lớn (thêm bài học/hoạt ảnh
# liên tục) đã vượt mức đó. Repo build được ở CI (runner ~7GB, V8 tự nới đủ) nên không lộ ra
# tới khi chạy trên VPS thật.
# Sửa: nới trần heap CHỈ cho bước build này (không đổi hành vi `npm run build` ở máy dev/CI —
# nơi RAM luôn dư, cờ này vô hại). Chọn 2560 MB (không phải trọn 3GB vật lý): app CŨ vẫn
# đang phục vụ traffic thật qua PM2 suốt lúc build (zero-downtime reload chỉ diễn ra ở bước
# [7/7], sau khi build xong) — để cả cap chạm sát trần RAM vật lý sẽ đẩy MỌI tiến trình sang
# swap cùng lúc, có thể làm app đang chạy giật. 2560 MB vẫn dư hơn 1 GB so với đỉnh crash đo
# được (~1,48 GB); nếu có lúc build cần hơn thì tràn sang swap (chậm hơn vài chục giây, không
# crash) — đúng tinh thần swap đã lập ở Bước 3a.
NODE_OPTIONS="${NODE_OPTIONS:-} --max-old-space-size=2560" npm run build

echo "── Cập nhật .env (nếu cần) ───────────────────────"
ENV_FILE="$APP_DIR/.env"

add_env() {
  local key="$1" val="$2"
  if [ -z "$val" ]; then return; fi
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    echo "  ✓ $key đã có trong .env — bỏ qua"
  else
    echo "${key}=${val}" >> "$ENV_FILE"
    echo "  + Đã thêm $key vào .env"
  fi
}

# Web Push (VAPID): KHÔNG nhúng khoá vào script — tránh lộ secret trong git.
# Khoá đã có sẵn trong .env trên VPS. Ở đây CHỈ kiểm tra, thiếu thì cảnh báo.
for VK in VAPID_PUBLIC_KEY VAPID_PRIVATE_KEY VAPID_EMAIL; do
  if grep -q "^${VK}=" "$ENV_FILE" 2>/dev/null; then
    echo "  ✓ $VK đã có trong .env"
  else
    echo "  ⚠️  .env thiếu $VK — thêm tay nếu cần Web Push"
  fi
done

# CRON_SECRET: chỉ thêm nếu bạn điền ở phần CONFIG (mặc định trống → bỏ qua).
add_env "CRON_SECRET" "$CRON_SECRET"

echo "── [7/7] Reload PM2 (zero-downtime) + kiểm tra health ─────────"
# Logic reload + health check dùng chung ở scripts/pm2-reload.sh
# (cluster mode + wait_ready; tự xử lý chuyển đổi fork→cluster lần đầu)
PORT="$PORT" bash "$APP_DIR/scripts/pm2-reload.sh"

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅  Deploy xong! (đã khớp origin/$BRANCH)"
echo "  🌐  https://www.donghanhcungban.org"
echo "═══════════════════════════════════════════════"
echo ""
echo "  Nhắc:"
echo "  • App là PWA: máy đang xem có thể giữ cache cũ → bấm Ctrl+Shift+R"
echo "    (hoặc xoá site data) để thấy bản mới."
