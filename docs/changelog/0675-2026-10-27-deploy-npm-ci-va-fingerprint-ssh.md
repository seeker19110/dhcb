# 0675 — 2026-10-27 — Deploy dừng khi `npm ci` lỗi và bắt buộc xác minh host key VPS

PR #1455. Đợt sửa audit thứ tám: đóng `AUD-CI-001` và `AUD-SEC-002` (🟠).

## Vấn đề

- `scripts/deploy.sh` chạy `npm ci || npm install`: `npm ci` lỗi thì `npm install` resolve lại
  dependency, có thể khác lockfile đã qua CI — production chạy mã chưa ai kiểm.
- `.github/workflows/deploy.yml` không truyền `fingerprint` cho `appleboy/ssh-action`; khi trống,
  action (easyssh) dùng `InsecureIgnoreHostKey` — giả mạo VPS trên đường mạng/DNS nhận được
  `GITHUB_TOKEN` (được forward qua SSH) và lệnh deploy.

## Đã làm

- `deploy.sh`: chỉ `npm ci`; lỗi ⇒ dừng (`set -euo pipefail`), kèm chú thích cách xử lý.
- `deploy.yml`: bước `Require VPS host key fingerprint` dừng trước SSH khi secret
  `VPS_SSH_FINGERPRINT` trống; ssh-action nhận `fingerprint: ${{ secrets.VPS_SSH_FINGERPRINT }}`.
- `scripts/deploy-safety.test.ts` (mới) canh cả hai chốt.
- `docs/DEPLOY.md` + `docs/ke-hoach-khoi-phuc-su-co-server.md` mục 3b: lấy fingerprint TRÊN VPS
  (`ssh-keygen -l -f /etc/ssh/ssh_host_ed25519_key.pub | cut -d ' ' -f2`), không qua `ssh-keyscan`
  từ máy lạ; host key đổi mà không dựng lại VPS ⇒ coi là dấu hiệu giả mạo.

## Quyết định

Fail-closed: thiếu secret thì KHÔNG deploy (tiêu chí 1 — an toàn — thắng tiêu chí tiện). Đường lùi:
thêm secret là chạy lại; hoặc revert PR.

## Kiểm chứng

- Đỏ-trước: `deploy-safety.test.ts` ĐỎ 3/4 trên mã cũ, 4/4 XANH sau sửa; `ci-workflow-policy.test.ts`
  vẫn xanh. `bash -n scripts/deploy.sh`, YAML parse, Prettier đạt.
- Không chạy deploy thật, không thử MITM.

## Việc tay chủ dự án

Thêm secret `VPS_SSH_FINGERPRINT` (GitHub → Settings → Secrets and variables → Actions) trước lần
deploy kế tiếp.
