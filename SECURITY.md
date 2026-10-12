# Chính sách bảo mật

Bảo mật là nguyên tắc kỹ thuật bất biến của dự án (`CLAUDE.md` mục 4, nguyên tắc 2 + 6). Tài
liệu này nói **cách báo cáo lỗ hổng** và **các hàng rào bảo mật đang chạy thật** trong repo này.

## Báo cáo lỗ hổng

**Đừng** mở issue công khai cho lỗ hổng bảo mật (lộ dữ liệu người dùng, bypass thanh toán/gói,
chiếm quyền admin…). Thay vào đó:

- Dùng **GitHub Security Advisories**: tab **Security → Report a vulnerability** (báo cáo riêng
  tư, không public) — ⚠️ **chỉ hiện khi chủ repo bật "Private vulnerability reporting"**; kiểm
  2026-10-12 qua API thì đang **TẮT** (`docs/ops/repository-settings.md`), trong lúc chờ hãy dùng
  email bên dưới, hoặc
- Gửi email tới người bảo trì: donghanhcungban.org@gmail.com.

Vui lòng kèm: mô tả, bước tái hiện, ảnh hưởng dự kiến (có chạm dữ liệu người dùng thật/thanh
toán không), và commit/PR liên quan nếu biết. Mục tiêu phản hồi: xác nhận trong vòng **72 giờ**;
thống nhất mốc vá trước khi công bố.

## Hàng rào bảo mật đang chạy thật trong repo

| Lớp                               | Công cụ                                                                                                                     | Bắt gì                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Bí mật lỡ commit                  | gitleaks (`.github/workflows/secret-scan.yml`, thêm 2026-09-13)                                                             | API key/token/mật khẩu rơi vào diff/commit                            |
| Bí mật trước commit (ở máy)       | `scripts/check-staged-secrets.sh` (husky) + `.claude/hooks/pre-commit-gate.sh` (changelog 0619)                             | khoá API trong phần THÊM của diff, TRƯỚC khi rời máy                  |
| Phụ thuộc                         | Dependabot (`.github/dependabot.yml`)                                                                                       | phiên bản npm package/GitHub Action có lỗ hổng đã biết                |
| Phân tích tĩnh (SAST)             | CodeQL `security-extended` (`.github/workflows/codeql.yml`, thêm changelog 0621 — KHÔNG chặn merge)                         | input chảy tới SQL/đường dẫn/HTML, workflow dễ bị injection           |
| Đầu vào API                       | Zod (`validateBody`, mọi handler đọc `req.body/query/params` — xác nhận đủ 2026-09-06)                                      | dữ liệu sai kiểu/thiếu trường trước khi chạm DB                       |
| Phân quyền dữ liệu                | `validateAuth()` tự kiểm `user_id` khớp token ở MỌI handler API (thay Row Level Security của Supabase cũ)                   | một user đọc/ghi được dữ liệu của user khác                           |
| Webhook thanh toán                | HMAC + UNIQUE constraint tầng DB chống trùng (`api/payment-webhook`)                                                        | giả webhook SePay, replay, race hai webhook song song                 |
| Dữ liệu nhạy cảm ở nghỉ (at-rest) | Mã hoá AES-256-GCM cho audio cache TTS + backup `.env` trên R2                                                              | rò rỉ nếu bucket bị lộ                                                |
| Quyền quản trị                    | `ADMIN_USER_IDS` (ID tài khoản bất biến, không theo email; trống ⇒ không ai là admin) qua `packages/core-auth/adminAuth.ts` | người thường vào được `/admin`, `/admin-settings`                     |
| Build/test/type                   | CI (`ci.yml`: `quality`/`e2e`/`metadata`, required check chặn merge)                                                        | lỗi kiểu, test đỏ, vi phạm quy ước PR                                 |
| Accessibility                     | axe (`e2e/a11y*.spec.ts`, chặn CI)                                                                                          | không phải lỗ hổng bảo mật, nhưng cùng nhóm "sàn cứng không ngoại lệ" |

## Nguyên tắc bất biến (không bao giờ phá — `CLAUDE.md` mục 4)

- **Bí mật không bao giờ vào Git** — dùng biến môi trường; `.env*` đã bị `.gitignore` chặn.
- **Không tin client** — logic nhạy cảm (kiểm quyền, đếm lượt AI, cấp gói) luôn ở server
  (`apps/server/src/api/`), không bao giờ tin giá trị client gửi lên cho việc này.
- Truy vấn Postgres **tham số hoá** (`pg` với `$1, $2…`) — chống SQL injection.
- Mọi đầu vào (form, API, query string) **validate lúc chạy bằng Zod** trước khi dùng.
- Không lộ secret trong log/response lỗi/thông báo cho client.

## Phạm vi

Chỉ áp dụng cho mã nguồn trong repo này (`apps/`, `packages/`, `postgres/`, hạ tầng CI/CD). Sự
cố hạ tầng VPS thật (SSH, firewall, backup) theo quy trình riêng ở
`docs/ke-hoach-khoi-phuc-su-co-server.md`.
