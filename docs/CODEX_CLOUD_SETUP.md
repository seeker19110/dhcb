# Thiết lập English Tutor chạy trên Codex Cloud

## Mục tiêu

Cấu hình này cho phép Codex Cloud checkout repository, cài đúng dependency, tạo PostgreSQL test
cục bộ, áp migration, chạy TypeScript/lint/unit/E2E và mở pull request. Nó không thay đổi quy trình
deploy production hiện tại qua GitHub Actions → VPS.

## 1. Cloud environment hiện tại

Environment `english-tutor` đã được tạo cho repository `seeker19110/dhcb` (tên cũ `english-tutor`) bằng universal
image. Post-setup caching đang **On** và agent internet access đang **Off**.

Setup script kiểm tra Node.js 22+ để khớp `package.json` và CI. Nếu universal image đổi runtime và
không còn đáp ứng điều kiện này, setup sẽ dừng sớm thay vì tạo một cache không hợp lệ.

## 2. Setup script

Environment hiện dùng một setup script inline tương đương file sau, để chạy được ngay cả trước khi
file được merge vào default branch:

```bash
bash scripts/codex-cloud-setup.sh
```

Script sẽ:

1. Kiểm tra Node.js 22.
2. Chạy `npm ci` theo lockfile.
3. Cài/khởi động PostgreSQL trong container.
4. Tạo database `dhcb_codex` và tài khoản test-only.
5. Ghi biến test vào `~/.bashrc` để còn hiệu lực trong agent phase.
6. Áp schema/migrations bằng `npm run migrate:pg`.
7. Cài Chromium cho Playwright.
8. Chạy typecheck và lint để fail sớm nếu bootstrap sai.

## 3. Maintenance script

Environment hiện dùng maintenance script inline tương đương:

```bash
bash scripts/codex-cloud-maintenance.sh
```

Maintenance chạy khi Codex dùng lại container cache: đồng bộ `package-lock.json`, khởi động lại
PostgreSQL, áp migration mới và làm mới Chromium khi cần. Sau khi các file này có trên `main`, có
thể thay nội dung inline bằng hai lệnh ngắn phía trên để chỉ còn một nguồn cấu hình.

## 4. Environment variables và secrets

Không thêm `.env` production. Environment đã được cấu hình các biến test-only sau; setup script
cũng xuất cùng giá trị trong quá trình bootstrap:

| Biến                   | Giá trị/mục đích                      |
| ---------------------- | ------------------------------------- |
| `DATABASE_URL`         | PostgreSQL disposable trong container |
| `MIGRATE_DATABASE_URL` | cùng database, dùng cho migration     |
| `NODE_ENV`             | `test`                                |
| `SKIP_AUTH`            | `true`, chỉ hợp lệ vì `NODE_ENV=test` |
| `ALLOWED_ORIGINS`      | `http://localhost:5179` cho E2E       |

Không đưa các giá trị sau vào cloud environment mặc định: database/VPS production, SePay webhook,
SMTP, R2, cookie production, Google/Groq/Anthropic/OpenAI/Azure/ElevenLabs keys. Unit và E2E phải
dùng fake/mock. Chỉ thêm secret cho một nhiệm vụ eval được phê duyệt riêng; Codex Cloud chỉ cung
cấp secret cho setup phase, không cung cấp cho agent phase.

## 5. Internet access

Setup phase cần internet để `npm ci`, apt và tải Chromium. Agent phase nên để internet **Off** theo
mặc định. Chỉ bật allowlist khi nhiệm vụ thật sự cần đọc tài liệu/provider công khai; không bật
unrestricted chỉ để test ứng dụng.

## 6. Kiểm chứng sau khi tạo environment

Tạo một cloud task trên `main` với yêu cầu:

```text
Không sửa file. Hãy báo phiên bản Node/npm/PostgreSQL, chạy npm run typecheck,
npm run lint và npm test, rồi tóm tắt AGENTS.md đã nạp.
```

Kết quả đạt khi:

- Node major là 22 hoặc mới hơn theo `package.json`.
- PostgreSQL nhận kết nối từ `DATABASE_URL`.
- Typecheck/lint/unit test xanh.
- Codex nhắc đúng quy tắc payment, production secrets và PR trong `AGENTS.md`.

Sau đó chạy một task E2E riêng. Nếu E2E log `ip=unknown`, thiếu DB hoặc rate-limit chéo giữa
workers, coi là lỗi test environment cần sửa; không chấp nhận vì UI fallback vẫn render.

## 7. Luồng tạo PR tự động

1. Khởi chạy cloud task từ `main`.
2. Codex làm việc trên branch/worktree riêng, chạy cổng trong `AGENTS.md`.
3. Review diff và kết quả kiểm tra trong task.
4. Chọn **Open PR**; `main` vẫn được bảo vệ bởi checks `quality` và `e2e`.
5. Chỉ merge khi checks chạy trên commit cuối cùng đều xanh.

Khi sửa setup/maintenance/environment variables, Codex tự làm mất hiệu lực cache cũ. Nếu repository
thay đổi lớn nhưng cache không còn tương thích, dùng **Reset cache** trong trang environment.

## 8. Giới hạn còn lại

- Cloud database là disposable, không dùng để xác nhận dữ liệu production.
- AI/TTS/STT/payment/email integration thật vẫn cần staging riêng và secret có scope tối thiểu.
- Deploy production vẫn do `.github/workflows/deploy.yml` sau khi merge `main`; cloud task không SSH
  vào VPS và không tự deploy.
