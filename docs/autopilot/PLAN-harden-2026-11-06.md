# PLAN-harden 2026-11-06

> **Duyệt:** phiên chính tự duyệt (ADR-0008 của khung), D-001 bên dưới. Nguồn: audit delta
> `docs/ops/AUDIT-REPORT-2026-11-06-delta.md`. Không có `BLUEPRINT.md` → bước (b) MUST blueprint và
> sàn Gate M/L (c) không áp; `release-check` cần blueprint — để chủ dự án quyết có lập blueprint không.
> Mỗi lát một PR ≤ 150 dòng, review sạch ở head trước merge (pha harden).

**D-001 (2026-11-06):** làm 4 🟠 theo thứ tự rủi ro người dùng: XFEAT-004 (đồng bộ thừa ở
production) → HAR-003 (cổng commit trùng) → TEST-001 (bằng chứng red-team) → A11Y-001 (phủ quét).
🟢 để nợ trong sổ; AUD-CODE-002 và AUD-SEC-005 là việc tay chủ dự án (key eval, thu hồi credential).

### Lát 1 — 🟠

- [x] `T-001` AUD-XFEAT-004: `mergeSrsMap` hoà reps+due giữ bản đang lưu (`a`), test với thứ tự khoá jsonb — Gate: `npx vitest run packages/core-learner apps/dhcb/src/lib/progressSync.test.ts apps/server/src/api/_lib` (files: packages/core-learner/srsMerge.ts, apps/dhcb/src/lib/progressSync.test.ts) — Bằng chứng: #1483 (0696), review SẠCH
- [ ] `T-002` AUD-HAR-003: `pre-commit-gate.sh` chỉ chạy test liên quan file staged, bỏ typecheck/lint trùng với guard — Gate: `npx vitest run scripts/claude-hooks.test.ts` (files: .claude/hooks/pre-commit-gate.sh) (cần: chủ dự án — bộ phân loại quyền chặn tác tử tự sửa hook, 2026-11-06)
- [x] `T-003` AUD-TEST-001a: bộ chấm writing — canary trích lại không tính lộ, thêm `errors_suppressed`, `injectEssay` giữ đoạn cuối — Gate: `npx vitest run scripts/lib/writingEvalScoring.test.ts` (files: scripts/lib/writingEvalScoring.ts, scripts/lib/writingEvalScoring.test.ts) — Bằng chứng: #1484 (0697), review SẠCH
- [x] `T-004` AUD-TEST-001b: bộ chấm tutor/companion — canary trích để từ chối, `forbidStrings` cho link độc — Gate: `npx vitest run scripts/lib/tutorInjectionScoring.test.ts scripts/lib/companionInjectionScoring.test.ts` (sau: T-003; files: scripts/lib/tutorInjectionScoring.ts, scripts/lib/companionInjectionScoring.ts, scripts/eval-companion-injection-fixtures.json) — Bằng chứng: #1485 (0698), review SẠCH sau 1 vòng sửa
- [x] `T-005` AUD-A11Y-001: ca dữ liệu thật cho `/ghi-chu` + `/ghi-chu/kanban` trong `e2e/a11y.spec.ts` — Gate: `npx playwright test e2e/a11y.spec.ts -g "ghi-chu"` (files: e2e/a11y.spec.ts) — Bằng chứng: #1486 (0699), review SẠCH sau 1 vòng sửa

### Lát 2 — 🟢 (nếu còn thời gian, mỗi mục một PR nhỏ)

- [ ] `T-006` AUD-CODE-003: `formatDateVN` trả `—` khi ngày hỏng — Gate: `npx vitest run apps/dhcb/src/lib` (files: apps/dhcb/src/lib/workTaskLabels.ts)
- [ ] `T-007` AUD-CI-002: `timeout-minutes` cho job metadata/release — Gate: `python3 .xtemplates/scripts/xt.py ci-check` (files: .github/workflows/pr-policy.yml, .github/workflows/release.yml)
- [ ] `T-008` AUD-SEC-006 + AUD-DATA-003 + AUD-SEC-007: restore an toàn hơn — Gate: `npx vitest run scripts/restore-pg-from-r2.test.ts` (files: scripts/restore-pg-from-r2.ts, scripts/lib/restoreSafety.ts)
