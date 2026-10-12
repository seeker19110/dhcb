---
description: Cổng commit/merge + Báo cáo xác thực — chạy build/typecheck/lint/format/test rồi xuất báo cáo theo CLAUDE.md mục 10; chặn nếu có mục ❌
---

Chạy **cổng chất lượng trước khi commit/merge** rồi xuất **Báo cáo xác thực**, đúng CLAUDE.md mục 8–10. Mục tiêu: không bao giờ commit/merge khi còn mục ❌. (Nguồn: seeker19110/projects-template `.claude/commands/gate.md`, khớp DHCB 2026-09-19 — DHCB là MỘT stack cố định nên lệnh dưới đây gọi thẳng, không cần lớp "tự dò" của bản gốc.)

> Lưu ý: hook `pre-commit-gate.sh` (PreToolUse) đã tự chặn `git commit` khi `typecheck`/`lint`/`test` đỏ — `/gate` dùng khi muốn chủ động chạy TRƯỚC khi gõ commit, hoặc khi cần chế độ **merge** (đủ hơn cổng commit).

## Bước 1 — Chạy cổng commit (CLAUDE.md mục 8)

Chạy tuần tự, đọc output thật (không suy đoán):

```
npm run build
npm run typecheck
npm run lint
npm run format:check
npm test
```

`/gate merge` (chế độ merge) → chạy thêm toàn bộ test (đã bao gồm ở `npm test` — DHCB không tách unit/integration) + `npm run test:coverage` (cổng CI thật dùng lệnh này, KHÔNG phải `npm test` — xem TRAPS.md mục 3) + `npm run test:e2e` nếu có Playwright cài sẵn.

## Bước 2 — Tự rà diff (CLAUDE.md mục 5 + 8)

`git diff` (đã/chưa stage): đúng mục tiêu, không sửa nhầm · xoá `console.log` debug/code chết · **không bí mật trong code** (API key, mật khẩu — luôn dùng `.env`) · mọi input ngoài đã validate (Zod ở boundary) · mọi thao tác có thể lỗi đã xử lý (nhánh lỗi + trạng thái tải/rỗng/lỗi trên UI) · commit message theo **conventional commits** đúng regex ở `.github/workflows/pr-policy.yml`.

Diff đổi `apps/dhcb/src/prompts/*` hoặc `packages/core-ai/aiConfig.ts` → PHẢI chạy lại `npm run eval:tutor` và dán bảng so sánh baseline vào mô tả PR (CLAUDE.md mục 8). Diff đổi `packages/subject-programming/feedbackPrompt.ts` → PHẢI chạy `npm run eval:code-feedback`. Diff chạm 9 hàm dựng prompt môn Anh → chạy `npx vitest run apps/dhcb/src/prompts/golden.test.ts` (không thay thế eval:tutor, hai cổng bổ sung nhau).

Diff thêm/đổi bài học trong `packages/subject-programming/` → chạy `npm run gen:lesson-index` rồi commit `lessonsLazy.ts` cùng đợt (quên thì `lessonsLazy.test.ts` đỏ).

## Bước 3 — Xuất Báo cáo xác thực (đúng khuôn CLAUDE.md mục 10)

```
Build ✅/❌ | Type ✅/❌ (lỗi:..) | Lint ✅/❌ (cảnh báo:..) | Format ✅/❌ | Test ✅/❌ (X/Y)
Đỏ-trước ✅/n-a (fix:/logic mới có test ĐỎ trước khi sửa, hoặc ngoại lệ số ..)
Tự review diff ✅ | Không bí mật/rác ✅ | Tiêu chí chấp nhận ✅ | DoD ✅
Rủi ro/ảnh hưởng: .. | Góp ý cải tiến: ..
KẾT LUẬN: Sẵn sàng  /  Cần xử lý: [..]
```

**Dòng "Đỏ-trước"** (lấy từ khung project-template, changelog 0620 — trước đây luật đỏ-trước chỉ có
trong `/debug`): commit `fix:` phải có test TÁI HIỆN lỗi, đã chạy cho thấy ĐỎ trước khi sửa; code mới có
logic rẽ nhánh cũng vậy. Ghi `n-a` kèm số ngoại lệ khi rơi vào danh sách ĐÓNG: (1) chỉ tài liệu/chú
thích; (2) đổi cấu hình/hằng không có logic; (3) đổi tên/di chuyển thuần cơ học (test cũ vẫn phủ);
(4) mã chỉ chạy tay một lần (script di trú dữ liệu đã chạy xong); (5) giao diện thuần trình bày —
bằng chứng là ảnh chụp Tầng 8b thay cho test. Ngoài 5 ca này mà không có test đỏ-trước → ❌.

**Bất kỳ mục ❌ → sửa trước, chạy lại TOÀN BỘ, KHÔNG commit/merge** (CLAUDE.md mục 10). Lint phải **0 cảnh báo** (`--max-warnings 0`).

## Chế độ merge (`/gate merge`) — thêm các mục mục 9

Toàn bộ test xanh (kể cả `test:coverage` với ngưỡng chặn) · nhánh đã cập nhật với `main` nếu GitHub báo xung đột (repo đã tắt "require branches up to date") · đối chiếu **tiêu chí chấp nhận** (`PROJECT.md`) + Definition of Done · smoke test luồng chính thật · rà bảo mật (mọi handler API tự kiểm `user_id` qua `validateAuth()`, không lộ dữ liệu) · nếu đổi schema Postgres: có migration đánh số trong `postgres/migrations/`, rollback được · `npm run codemap -- impact <file>` cho từng file đã sửa để soát "không phá tính năng khác" bằng công cụ, không bằng trí nhớ.

Trước lần push cuối: `rm -rf packages/*/dist dist dist-server` rồi chạy lại `npm run typecheck` để tái hiện checkout sạch của CI (TRAPS.md mục 3, biến thể xanh giả #2).

Bắt đầu **Bước 1** ngay.
