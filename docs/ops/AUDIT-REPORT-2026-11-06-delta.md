# Audit delta 2026-11-06 — `c561b67..cc8966b` (`/complete` bước 2)

Phạm vi: 39 commit từ audit 2026-10-26 (`AUDIT-REPORT-2026-10-26.md`), gồm các bản sửa
#1447–#1455, nâng khung X-Templates 3.30.1 (#1479), eval injection, Ghi chú (0690), thu gọn
PROGRESS (#1480). Ba reviewer chỉ-đọc chạy song song, mỗi người một vùng không giao nhau:

| Vùng                  | Nhóm                      | Reviewer       | Lệnh đã chạy (kết quả)                                                                                                                    |
| --------------------- | ------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Server/dữ liệu/script | SEC · DATA · CFG · XFEAT  | `reviewer-alt` | đọc diff 19/19 file + caller; Postgres local không chạy → phần đo DB INCONCLUSIVE                                                         |
| Harness/CI/phụ thuộc  | HAR · CI · DEP            | general        | 3 test hook/CI 167/167 · `npm audit --omit=dev` 0 · `npm audit` 7 moderate dev · `doctor` ok · `ci-check` exit 1 · payload thử vào 5 hook |
| UI/prompt/eval        | CODE · TEST · A11Y · PERF | general        | `typecheck` 0 · eslint 13 file 0 cảnh báo · vitest 6 file 69/69 · script tái hiện bằng `tsx`                                              |

DOC (178 file `.md`, phần lớn tài liệu khung vendored) chỉ quét rút gọn: `validate`/`progress-check`
của khung; chưa có `lychee` nên liên kết ngoài là `chưa biết`.

## Xác minh đối kháng 🟠 (phiên chính)

| ID                | Kết luận             | Cách xác minh                                                                                                                                                           |
| ----------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AUD-XFEAT-004     | XÁC NHẬN             | `toStored` (`srs.ts:110`) ghi khoá `due, stability, difficulty…`; jsonb sắp khoá theo độ dài (`due, reps, state…`); hoà → `b` thắng (`srsMerge.ts:41`) → stringify khác |
| AUD-HAR-003       | XÁC NHẬN             | `pre-commit-gate.sh:178-180` chạy `npm test` đầy đủ; guard chạy cổng nhanh cùng lúc (`settings.json:55-70`). Phần "hết giờ thì lọt" còn là nghi vấn                     |
| AUD-TEST-001      | XÁC NHẬN             | đọc mã: `includes(canary)`, không so danh sách lỗi, regex `/[^.!?]+[.!?]+/g` bỏ phần dư                                                                                 |
| AUD-A11Y-001      | XÁC NHẬN             | `REAL_DATA_CASES` không có `/api/work` → danh sách Ghi chú rỗng khi quét                                                                                                |
| (prompt "ở trên") | HẠ → 🟢 AUD-CODE-002 | đúng là sai chỗ, nhưng model đọc cả prompt; sửa cần `eval:tutor` có key (việc tay)                                                                                      |

Không có 🔴. Chi tiết từng dòng: `docs/ops/AUDIT-STATUS.md`.

## Đã kiểm, đạt (tóm tắt)

- Khoá tiến độ: cả hai đường ghi `english.learning_progress` đều khoá advisory trước khi đọc.
- Cầu dao AI: mọi call-site gọi provider trong luồng request đi qua `actorUsage`/`checkAndConsumeUsage`; fail-closed.
- Hook mới không nới quyền; workflow ghim SHA, giữ tên `quality`/`e2e`/`metadata`; deploy fingerprint đúng.
- Ghi chú: múi giờ hạn dùng giờ VN đúng, test ca biên 18:00Z thật sự kiểm hành vi.

## Không kết luận được

Thứ tự jsonb trên Postgres thật, test đồng thời, đo route dev trả HTML, bundle chunk lucide,
actionlint/zizmor/osv-scanner/shellcheck (không có trong container).
