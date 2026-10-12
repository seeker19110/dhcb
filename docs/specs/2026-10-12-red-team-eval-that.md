# Đặc tả: `eval:v2:red-team` kiểm THẬT trên Postgres thật

**Trạng thái:** Approved for implementation — chủ dự án duyệt 2026-10-12 ("theo khuyến nghị", đề xuất
cuối changelog `0622`).
**Nguồn:** nợ mở đầu bảng trong `PROGRESS.md` (changelog `0622`); luật viết ca ở
`docs/ops/ai-eval-red-team.md` §3.

## 0. Một câu

Thay harness red-team "xanh do cách dựng" bằng harness gọi đúng đường production của Companion /
tự động hoá / ngữ cảnh trên Postgres thật, chấm bằng KẾT QUẢ THẬT (trạng thái hành động, lỗi ném ra,
dòng trong CSDL, chuỗi canary), và chạy chặn trong CI.

## ① Phạm vi

**LÀM:**

- Viết lại `scripts/red-team/eval-red-team.ts`: gieo dữ liệu bằng chính hàm dịch vụ (`getOrCreatePerson`,
  `grantConsent`, `setPolicy`, `declareFact`, `ingestMemory`, `appendCompanionMessage`,
  `createAutomationGrant`…), gọi `prepareCompanionTurn` · `executeAutomatedAction` ·
  `resumeAutomationGrant` · `buildContextPackage`, chấm từ kết quả.
- Ba họ ca, mỗi họ ≥ 10: **PI** (prompt injection qua lượt Companion), **TA** (lạm dụng tự động hoá),
  **SL** (rò dữ liệu vào ngữ cảnh). Ca viết bằng TS (cần bước gieo dữ liệu), thay 3 file fixture JSON.
  **Bổ sung changelog `0626`:** họ thứ tư **AG** (chế độ tác tử) — "kịch bản" gọi công cụ đóng vai
  Claude, chạy thẳng `createCompanionToolSession(…).execute` trên Postgres thật, không cần key AI.
- Hàm chấm thuần + kiểm `DATABASE_URL` chỉ trỏ máy cục bộ, có unit test.
- Thêm bước chạy vào job CI `sql-prepare` (đã có Postgres 16 + đủ migration) → chặn merge qua `quality`.
- Đính chính lại `docs/research/kien-truc-va-ha-tang.md`, cập nhật `docs/ops/ai-eval-red-team.md`, nợ
  trong `PROGRESS.md`.

**KHÔNG LÀM:**

- Không gọi LLM: harness xoá mọi biến môi trường `ANTHROPIC_*`/`GROQ_*`/`GEMINI_*`/`OPENAI_*` lúc khởi
  động → đo đường từ khoá (đường mặc định khi không có Claude) + mọi cổng sau planner. Chế độ tác tử
  (Claude gọi công cụ) KHÔNG nằm trong đợt này — ghi rõ ở nợ. (Đã phủ ở TẦNG CÔNG CỤ trong changelog
  `0626` bằng họ AG; việc Claude THẬT có bị dụ gọi công cụ hay không vẫn cần key AI.)
- Không thêm ca injection cho `eval:tutor`/`eval:companion`/chấm bài viết (nợ riêng, cần key AI).
- Không sửa mã sản phẩm. Ca nào ĐỎ thật thì báo, không "chữa" bằng cách đổi ca.
  **Ngoại lệ đã thi hành (changelog `0623`):** harness lộ lỗi thật ở `proposeAction` — ghi
  `tool_execution_audit_log` TRƯỚC khi có dòng `proposed_actions` mà nhật ký trỏ khoá ngoại tới ⇒
  nhánh DENY và nhánh tự chạy (gồm câu "tra từ …" mặc định của MỌI người dùng) sập 500. Sửa đúng
  thứ tự ghi (không đổi quyền/điều kiện nào), có unit test mô phỏng khoá ngoại + ca `rt-pi-14`.
- Không chạy được vào CSDL không phải máy cục bộ (chặn cứng — tránh gieo người dùng rác vào production).

## ② Điểm chạm

| Việc | Đường dẫn file                                                                                  | Ghi chú                                                    |
| ---- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Sửa  | `scripts/red-team/eval-red-team.ts`                                                             | Harness: guard, xoá key AI, chạy ca, dọn dữ liệu, mã thoát |
| Thêm | `scripts/red-team/redTeamCases.ts`                                                              | 3 họ ca, mỗi ca `run(ctx)` → `{ blocked, evidence }`       |
| Thêm | `scripts/red-team/redTeamAgentCases.ts`                                                         | Họ AG (changelog `0626`): kịch bản gọi công cụ tác tử      |
| Thêm | `scripts/red-team/redTeamKit.ts`                                                                | Gieo dữ liệu bằng hàm dịch vụ, `captureError`              |
| Thêm | `scripts/lib/redTeamScoring.ts`                                                                 | Hàm thuần: tổng hợp, `isLocalDatabaseUrl`                  |
| Thêm | `scripts/lib/redTeamScoring.test.ts`                                                            | Unit test hàm thuần                                        |
| Sửa  | `scripts/red-team/eval-red-team.test.ts`                                                        | Thay `expect(true)`: sàn số ca, id duy nhất                |
| Xoá  | 3 file fixture JSON cũ trong scripts/red-team (prompt-injection, tool-abuse, sensitive-leakage) | Thay bằng ca TS                                            |
| Sửa  | `.github/workflows/ci.yml`                                                                      | Job `sql-prepare`: thêm bước `npm run eval:v2:red-team`    |
| Sửa  | `packages/core-personal/proposedActionService.ts`                                               | Ngoại lệ ①: tạo dòng đề xuất trước, ghi nhật ký sau        |
| Sửa  | `packages/core-personal/proposedActionService.test.ts`                                          | Hồi quy: mock đóng vai khoá ngoại                          |

## ③ Hợp đồng dữ liệu

```ts
type Family = 'PI' | 'TA' | 'SL' | 'AG' // AG thêm ở changelog 0626
interface RedTeamCase {
  id: string
  family: Family
  title: string
  run(ctx: Ctx): Promise<Outcome>
}
interface Outcome {
  blocked: boolean
  evidence: string
} // evidence = điều quan sát THẬT (status, lỗi, số dòng)
```

**Ca lỗi:** ca ném lỗi ngoài dự kiến ⇒ tính là KHÔNG chặn (đỏ), in lỗi. Thiếu `DATABASE_URL` hoặc
trỏ máy khác ⇒ thoát mã 2 kèm lý do, không chạy ca nào.

## ④ Tiêu chí chấp nhận

| AC   | Tiêu chí                                                                         | Bằng chứng                                                   |
| ---- | -------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| AC-1 | Không ca nào đọc kết quả từ nhãn của chính nó; không cộng theo số lượng          | Đọc `redTeamCases.ts`: mọi `blocked` tính từ kết quả gọi hàm |
| AC-2 | Mỗi họ ≥ 10 ca, id duy nhất                                                      | `eval-red-team.test.ts`                                      |
| AC-3 | Đỏ-trước: đảo một cổng thật (vd bỏ `requiresUserConfirmation`) ⇒ harness thoát 1 | Chạy tay, ghi kết quả vào changelog                          |
| AC-4 | Lỗi khi chạy ⇒ mã thoát ≠ 0                                                      | `redTeamScoring.test.ts` + chạy với URL sai                  |
| AC-5 | CI chạy harness trên Postgres có đủ migration, đỏ ⇒ `quality` đỏ                 | Job `sql-prepare` trên PR                                    |
| AC-6 | Từ chối `DATABASE_URL` không phải localhost/127.0.0.1/::1                        | `redTeamScoring.test.ts`                                     |

## ⑤ Bất biến không được phá

| Bất biến                                                          | Test nào canh nó                     |
| ----------------------------------------------------------------- | ------------------------------------ |
| Job tổng hợp `quality` gom đủ `needs` (thêm bước, không thêm job) | `scripts/ci-workflow-policy.test.ts` |
| Mọi câu SQL tĩnh PREPARE được                                     | `npm run check:sql`                  |

## ⑥ Quy ước dự án liên quan

- Import xuyên gói `@dhcb/<gói>/<file>` không đuôi `.js`; comment tiếng Việt chỗ quan trọng.
- Sửa `.github/workflows/ci.yml` đi qua `config-protection` (nêu lý do trước).
