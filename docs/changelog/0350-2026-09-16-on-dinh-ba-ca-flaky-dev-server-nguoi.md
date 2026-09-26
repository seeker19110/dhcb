# 0350 — 2026-09-16 — Ổn định ba ca E2E flaky khi dev server nguội

- **PR:** [#982](https://github.com/seeker19110/dhcb/pull/982)
- **Nhánh:** `claude/laughing-babbage-o25bls-fix-flaky-e2e`
- **Loại:** trả nợ kỹ thuật (không đổi hành vi sản phẩm)

## Việc đã làm

Ba ca E2E đỏ ngẫu nhiên khi dev server chạy NGUỘI (mới khởi, chưa transform module nào), do ba
agent khác nhau ghi lại làm nợ trong lúc làm việc khác. Cả ba cùng khuôn lỗi timeout-5s (đã ghi
ở `TRAPS.md` mục 7) nhưng khác tầng: đây là Playwright/E2E, không phải Vitest.

1. **`e2e/comeback.spec.ts`** — ca "vắng 5 ngày → hiện banner chào mừng". S12-1 đã cô lập biến
   trước đó (đổi riêng `Home.tsx` về bản `main` rồi chạy lại, vẫn đỏ) để chứng minh đây là flaky
   sẵn có, không do slice nào của S12-1 gây ra.
2. **`e2e/listening.spec.ts`** — cả ba ca ở tab "Nghe" trang cấp CEFR.
3. **`e2e/programming-lesson.spec.ts`** — ca "quay lại từ bài học về ĐÚNG bậc" (dòng ~621).

**Nguyên nhân THẬT (đo trước khi sửa, không nới mò):** cả ba ca đều gọi `page.goto()` rồi ngay
lập tức `expect(...).toBeVisible()` mà không có timeout riêng (dùng mặc định 5000ms của
Playwright). Khi dev server còn nguội, lượt gọi đầu tiên buộc Vite phải transform lần đầu toàn
bộ chunk của trang (React mount + fetch dữ liệu tĩnh lớn qua `/public/data/*.json` —
`cefr.json` 228KB, `curriculum.json` 3,6MB) NGAY trong cửa sổ chờ của `expect()` đó. Đây là chi
phí THẬT của lần tải đầu (không phải việc test làm thừa), nên sửa bằng cách nới `timeout` của
ĐÚNG assertion đầu tiên sau mỗi `goto` (không nới cả file/cả suite/timeout toàn cục).

**Cách đo:** dựng file `playwright.config.ts` tạm (không commit) đổi `PORT` sang cổng riêng +
`reuseExistingServer: false` để chắc chắn dev server là MỚI KHỞI, không nối nhầm vào server ấm
của worktree khác qua cổng 5179 dùng chung.

| Ca                                               | 1 worker, một mình | 2 worker, chạy chung spec khác |
| ------------------------------------------------ | ------------------ | ------------------------------ |
| `comeback.spec.ts` "vắng 5 ngày"                 | 4,3–7,4s (4 lượt)  | tới 6,5s                       |
| `listening.spec.ts` expect đầu sau `goto`        | 2,6s               | 3,3s                           |
| `programming-lesson.spec.ts` "quay lại đúng bậc" | 3,0s               | —                              |

Cả ba đều đã ở mức 55–65% ngưỡng mặc định 5000ms khi đo đơn lẻ, và một số lượt tổng thời gian ca
(gồm nhiều `expect` nối tiếp) đã vượt 5–6s khi chạy song song 2 worker — đúng khuôn "chạy riêng
xanh, chạy song song/dưới tải thì đỏ".

## Xác nhận hết flaky

5 lượt liên tiếp trên dev server NGUỘI (khởi lại mỗi lượt), 2 worker, chạy chung nhiều spec:

- `comeback.spec.ts` + `listening.spec.ts` cùng lúc: **5/5 lượt xanh** (tổng thời gian ca có lượt
  lên 6,8s — vượt ngưỡng mặc định cũ nếu chưa sửa).
- `listening.spec.ts` + `programming-lesson.spec.ts` cùng lúc: **5/5 lượt xanh** (có lượt tổng
  7,1s).

Tổng 25/25 lượt xanh trên 2 tổ hợp — không dừng lại ở một lượt xanh.

## Rà thêm

Quét proxy nhanh (`grep` các file E2E gọi `toBeVisible()` không kèm `timeout` tường minh) cho ra
danh sách DÀI (~19+ file: `a11y*.spec.ts`, `authenticated.spec.ts`, `bottomnav.spec.ts`,
`calendar-keyboard.spec.ts`, `chat.spec.ts`, `companion-history.spec.ts`,
`continue-viewing.spec.ts`, `english-subject-home.spec.ts`, `english-tools-context.spec.ts`,
`home-quick-ask.spec.ts`, `learning-session-resume*.spec.ts`, `login-redirect.spec.ts`,
`modal-sticky-header.spec.ts`, `onboarding-by-subject.spec.ts`, …). Đây chỉ là chỉ báo THÔ (có
`toBeVisible()` không kèm timeout) — CHƯA đo thời gian thật từng ca như quy trình `TRAPS.md` mục
7 yêu cầu. Vì danh sách dài, PR này KHÔNG mở rộng phạm vi để đo/sửa hết — cần một đợt audit riêng
(đo `--reporter=verbose` trên server nguội cho từng file, ưu tiên các trang tải dữ liệu tĩnh lớn
tương tự `cefr.json`/`curriculum.json` như `english-subject-home.spec.ts`,
`continue-viewing.spec.ts`, `onboarding-by-subject.spec.ts`) rồi mới áp quy trình hai bước (đo →
phân loại nguyên nhân → sửa nhanh hay nới ngưỡng).

## Cập nhật tài liệu

- `TRAPS.md` mục 7 — thêm đoạn "Biến thể E2E — dev server NGUỘI" mô tả khuôn lỗi riêng ở tầng
  Playwright (khác nguyên nhân CPU-tranh-chấp của biến thể Vitest gốc) + cách đo bằng config tạm
  đổi cổng.
