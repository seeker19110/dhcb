# 0621 — Tích hợp khung project-template (đợt 3a): CI gom `needs` đủ · trần thời gian · token chỉ đọc · cổng soi từng commit · CodeQL

- **Ngày:** 2026-10-12 · **PR:** (điền khi tạo PR) · **Loại:** `ci(github)`
- **Nguồn việc:** tiếp đợt 1 (`0619`, PR #1381) và đợt 2 (`0620`, PR #1382) — chủ dự án: "tích hợp sâu những
  cái hay, ưu điểm vào dự án" → "xong tích hợp luôn". Đợt 3 tách đôi: **3a** = `.github/` (file này), **3b** =
  tài liệu vận hành.
- **Khung đối chiếu:** `seeker19110/project-template` @ `59bd1d1`, `.github/workflows/*` (10 workflow).
- Mọi file cổng sửa qua đúng quy trình `config-protection` (nêu lý do trước, lần chạm đầu bị từ chối có chủ đích).

## Đã lấy (mỗi dòng: tốt hơn bản đang chạy ở đâu, kiểm bằng gì)

| Hạng mục                                                                                                                                                   | Nơi đặt                                   | Tốt hơn ở đâu                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Job tổng hợp `quality`/`e2e` gom qua `toJSON(needs)` + `jq`                                                                                                | `ci.yml`                                  | **Bắt một lớp lỗi**: trước đây liệt kê tay 5 `needs.<id>.result` — thêm job thứ 6 vào `needs` (test cây `needs` vẫn xanh) mà quên câu `if` thì job đó đỏ vẫn merge. Nay `skipped` và `needs` rỗng cũng đỏ. Tên `quality`/`e2e` giữ nguyên.                                                 |
| `timeout-minutes` mọi job CI                                                                                                                               | `ci.yml`, `secret-scan.yml`, `codeql.yml` | Mặc định GitHub 360 phút. Trần ≈ 3–4× số đo thật ở run `38224335831`: static 3,5′→15 · unit 6,9′→25 · build 1,6′→15 · audit 1,4′→15 · E2E chậm nhất 9,5′→30 · tổng hợp <5″→5.                                                                                                              |
| `permissions: contents: read`                                                                                                                              | `ci.yml`, `deploy.yml`                    | Trước không khai → token nhận quyền mặc định của repo. `deploy.yml` dùng `GITHUB_TOKEN` CHỈ để `git fetch` (đã đọc `scripts/deploy.sh`) → đọc là đủ.                                                                                                                                       |
| Cổng `metadata` soi TIÊU ĐỀ TỪNG COMMIT (Conventional, ≤ 100 ký tự = commitlint ở máy, không ký tự điều khiển) + cổng đặc tả `feat` theo cả tiêu đề commit | `pr-policy.yml`                           | **Bắt một lớp lỗi có thật ở DHCB**: API repo báo `squash_merge_commit_title = COMMIT_OR_PR_TITLE` → PR MỘT commit lấy tiêu đề COMMIT lên main. PR `refactor:` + commit `feat:` lọt cổng đặc tả; commit `--no-verify` lọt commitlint. Bỏ qua merge commit (CLAUDE.md §11 cho gộp main).     |
| Chặn ký tự điều khiển / U+FFFD trong tiêu đề PR                                                                                                            | `pr-policy.yml`                           | Regex cũ chỉ soi tiền tố.                                                                                                                                                                                                                                                                  |
| PR `fix:` không chạm `TRAPS.md` → CẢNH BÁO (không chặn)                                                                                                    | `pr-policy.yml`                           | Nhắc `/learn` đúng lúc; không chặn vì lỗi gõ một lần không cần mục TRAPS.                                                                                                                                                                                                                  |
| CodeQL `security-extended` cho `javascript-typescript` + `actions`, KHÔNG required                                                                         | `codeql.yml` (mới)                        | Trước không có SAST: `npm audit` chỉ soi gói phụ thuộc, eslint không soi luồng dữ liệu. Khác khung: ghi cứng ngôn ngữ thay vì dò qua API (cùng kết quả, bớt một job); `security-extended` thay `security-and-quality` (ít nhiễu). Action ghim SHA v4.38.3, đối chiếu bằng `git ls-remote`. |
| `secret-scan` chạy tay được (`workflow_dispatch`)                                                                                                          | `secret-scan.yml`                         | Quét lại toàn lịch sử ngay sau khi xoay vòng khoá, không chờ push.                                                                                                                                                                                                                         |
| Link "Discussions" chết → kênh báo lỗ hổng riêng tư                                                                                                        | `ISSUE_TEMPLATE/config.yml`               | API repo: `has_discussions: false`.                                                                                                                                                                                                                                                        |
| Hai luật mới trong test canh CI                                                                                                                            | `scripts/ci-workflow-policy.test.ts`      | Luật 2b (`toJSON(needs)`, cấm liệt kê tay) + luật 5 (mọi job có `timeout-minutes`).                                                                                                                                                                                                        |

## Đã có và SÂU HƠN (không lấy)

- **Dependabot** (`.github/dependabot.yml`): DHCB đã nhóm cập nhật + chặn major THEO TỪNG GÓI gắn với ràng
  buộc thật (CLAUDE.md §6: TS 7, ESLint 10…). Khung chặn major toàn cục — thô hơn, giấu luôn major nên nâng.
- **`npm audit --omit=dev` = 0 lỗ hổng chặn CI** (job `audit`) — mạnh hơn `dependency-review` của khung ở
  phần production. `dependency-review` chỉ thêm dev-deps + giấy phép trên diff → **chưa cần**; _xem lại khi:_
  có sự cố từ dev-dependency hoặc cần chính sách giấy phép.
- **Concurrency huỷ run cũ trên PR, giữ run trên main** — đã có từ PR #703.

## Chưa cần (kèm điều kiện xem lại)

- **`maintenance.yml` (mở issue hằng tuần từ sweep):** thêm một kênh thông báo người dùng phải đọc; `npm run
maintain` đã chạy được tay. _Xem lại khi:_ hai lần rà định kỳ liền bị bỏ lỡ.
- **`scorecard.yml` (OpenSSF):** chấm điểm tổng quát, không bắt lỗi cụ thể nào bản hiện có bỏ lọt. _Xem lại
  khi:_ cần huy hiệu/đánh giá bên ngoài.
- **`stale-pr-alert.yml`, trần WIP 5 PR mở:** DHCB làm PR liền mạch bằng auto-merge; chưa có ca PR treo bị quên.
  _Xem lại khi:_ có PR mở > 7 ngày không ai biết.
- **Trần 72 ký tự cho tiêu đề PR:** mâu thuẫn commitlint của DHCB (100) và lịch sử `main` (tiêu đề tới 137
  ký tự) — giữ 100 cho commit, không áp cho tiêu đề PR.
- **`dependabot-auto-merge.yml`:** quyết định của chủ dự án (nêu trong mô tả PR).

## Bằng chứng kiểm chứng

- **Đỏ-trước:** `ci-workflow-policy.test.ts` chạy trên `ci.yml` CŨ (lấy từ `origin/main`) → 3 test mới ĐỎ
  (2 ca `toJSON(needs)` + 1 ca `timeout-minutes`); trên bản mới → 12/12 xanh.
- **Script `pr-policy` chạy thật với `github`/`core` giả** (đọc nguyên script từ YAML, không chép lại): 13 ca —
  commit thường/merge commit/không conventional/> 100 ký tự/PR `refactor` + commit `feat` không đặc tả/có đặc tả
  Approved/ký tự điều khiển/U+FFFD/`fix` có và không chạm TRAPS/dependabot/đặc tả không tồn tại/tiếng Việt có
  dấu — đều cho đúng kết quả mong đợi.
- **Bẫy gặp giữa chừng:** công cụ Edit của tác tử tự GIẢI MÃ chuỗi `\uFFFD` gõ trong regex thành ký tự U+FFFD
  THẬT (3 byte `EF BF BD`) — regex vẫn chạy đúng nhưng mã nguồn mang đúng thứ ký tự nó đang chặn. Phát hiện khi
  tự soát diff; thay lại bằng chuỗi escape qua Python, `grep -c $'\xef\xbf\xbd'` = 0. Cùng họ với cảnh báo
  ký tự điều khiển ở CLAUDE.md §8.
- `jq -e 'length > 0 and all(.[]; .result == "success")'` thử với `skipped` → 1, `{}` → 1 (không xanh giả).
- Thời gian job đo từ run `38224335831`; thời gian deploy 4–7,5′ (không đặt timeout cho deploy — ssh-action đã
  có `command_timeout: 30m`, cắt ngang lúc migrate nguy hiểm hơn).
- Cổng đủ: xem Báo cáo xác thực trong mô tả PR.
