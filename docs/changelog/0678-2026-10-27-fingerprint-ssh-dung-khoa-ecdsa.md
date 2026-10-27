# 0678 — 2026-10-27 — Hướng dẫn fingerprint SSH dùng khoá ECDSA (sửa hướng dẫn của `0675`)

PR (điền khi mở). Sửa sai sót trong hướng dẫn của changelog `0675` (AUD-SEC-002).

## Vấn đề

`0675` bảo lấy fingerprint từ `/etc/ssh/ssh_host_ed25519_key.pub`. Chủ dự án làm đúng như vậy ⇒ workflow
Deploy (run 40454809047) đỏ `ssh: handshake failed: ssh: host key fingerprint mismatch`. VPS có 4 host key
(DSA 1024, ECDSA 256, ED25519 256, RSA 3072); `appleboy/ssh-action` (drone-ssh 1.8.2, Go) chọn **ECDSA**
khi cả hai cùng có. Đổi secret sang fingerprint ECDSA ⇒ deploy chạy (chủ dự án xác nhận 2026-10-27).

## Đã làm

- `docs/DEPLOY.md`, `docs/ke-hoach-khoi-phuc-su-co-server.md` mục 3b, chú thích `.github/workflows/deploy.yml`:
  lệnh lấy fingerprint đổi sang `ssh_host_ecdsa_key.pub`, ghi lý do + cách liệt kê mọi khoá nếu VPS mới
  không có ECDSA. Không đổi logic workflow.
- `PROGRESS.md`: bỏ việc tay "thêm secret `VPS_SSH_FINGERPRINT`" — đã xong.

## Góp ý còn lại (việc tay, chủ dự án tự quyết)

VPS còn host key **DSA 1024-bit** (lỗi thời): bỏ dòng `HostKey …dsa…` trong `/etc/ssh/sshd_config`, `sshd -t`,
`systemctl reload ssh` — làm khi còn một phiên SSH khác đang mở.

## Kiểm chứng

Prettier đạt; `scripts/deploy-safety.test.ts` vẫn xanh (kiểm `fingerprint:` + bước dừng, không phụ thuộc loại khoá).
