# Đổi tên repo GitHub `donghanh` → `dhcb` trong mã và tài liệu

- **Ngày:** 2026-09-26 · **PR:** PR của nhánh `seeker/zealous-allen-ygj0gw` (sau #1184)
- **Loại:** `chore(repo)`. Chủ dự án vừa đổi tên repo trên GitHub thành `seeker19110/dhcb` và nhờ
  cập nhật lại mọi chỗ còn ghi tên cũ.

## Đã đổi

- **Chỗ đang chạy thật:**
  - `scripts/deploy.sh`: giá trị mặc định của `REPO_NAME` (dùng khi fetch code trên VPS mà thiếu
    biến `GITHUB_REPOSITORY`).
  - `apps/dhcb/index.html`: đường dẫn GitHub trong JSON-LD `sameAs`.
  - `.github/ISSUE_TEMPLATE/config.yml`: đường dẫn Discussions.
- **Hướng dẫn cài đặt:** `README.md` (`git clone …/dhcb.git` rồi `cd dhcb`) và
  `docs/deploy-vps-ubuntu.md` bước 4.
- **Tên dự án trong tài liệu còn hiệu lực:** `CONTRIBUTING.md`, `TRAPS.md`,
  `docs/DEVELOPMENT_WORKFLOW.md`, cây thư mục đích ở `docs/research/kien-truc-va-ha-tang.md`.
- **Đường dẫn PR/Actions** `github.com/seeker19110/donghanh/…` trong `PROGRESS.md`, nhật ký,
  goals, research, specs: đổi sang `seeker19110/dhcb`. Tổng cộng 46 file, toàn bộ là thay 1:1.
  Sau đó chạy Prettier để căn lại 7 bảng Markdown bị lệch cột vì tên ngắn đi.

## Cố ý KHÔNG đổi

Những chỗ này có chữ "donghanh" nhưng không phải tên repo:

- Khoá `localStorage` `donghanh_offline_queue`. Đổi khoá thì hàng đợi offline đang lưu trên máy
  người dùng bị bỏ rơi.
- Tên miền `donghanhcungban.org` và `cdn.donghanh.org`; tag `donghanh_ai`.
- `dongHanh` trong bộ giả lập Kotlin (nghĩa là `companion object`).
- Skill Hermes tên `donghanh` trong `AGENTS.md`: đây là tên skill ở môi trường ngoài, không phải
  tên repo.
- Đường dẫn máy thật trong log cũ (`/home/user/donghanh/…` ở nhật ký 0414, 0416) và các câu kể
  lại lịch sử trong nhật ký, đặc tả cũ.
- Cây thư mục "hiện tại" và "đề xuất" cũ ở `kien-truc-va-ha-tang.md` mục 1.1 và 2: đó là ảnh
  chụp lịch sử, không phải trạng thái hiện tại.
- Remote của container phiên này: phạm vi phiên vẫn khai tên cũ, GitHub tự chuyển hướng nên
  push vẫn chạy.

## Việc tay còn lại

Ghi ở `PROGRESS.md` mục "Cần làm tay" A: đổi remote trên VPS (`/var/www/dhcb`) và trên máy cá
nhân bằng `git remote set-url origin https://github.com/seeker19110/dhcb.git`, và chọn repo mới
khi mở phiên Claude Code mới.

## Bằng chứng

- `git grep -n "seeker19110/donghanh"`: 0 kết quả sau khi đổi.
- `npx prettier --check` trên 45 file Markdown/YAML/HTML đã sửa: xanh. Trước khi chạy
  `--write`, 7 file lệch; trên `main` cả 7 file đều đạt, tức lệch là do đợt đổi tên này.
- `bash -n scripts/deploy.sh`: cú pháp hợp lệ.
