---
description: Gỡ cổng đang ĐỎ (typecheck/lint/build/test:coverage ở máy hoặc job CI trên PR) với diff tối thiểu — tái hiện đúng lệnh CI, tra TRAPS.md, sửa từng lỗi, không nới cổng
argument-hint: '[lệnh đỏ | tên job CI | số PR]'
---

Gỡ một cổng đang đỏ về xanh theo quy trình của subagent `build-error-resolver`
(`.claude/agents/build-error-resolver.md` — đọc file đó, nó là nguồn sự thật của quy trình). Chuyển
thể từ `/build-fix` của ECC (affaan-m/ECC v2.2.2, MIT), xem ADR-0013.

Đầu vào: $ARGUMENTS (bỏ trống = chạy lần lượt `npm run typecheck`, `npm run lint`,
`npm run format:check`, `npm run test:coverage` và dừng ở cổng đỏ đầu tiên).

## Chọn cách chạy

- **Ít lỗi, cùng một nguyên nhân** (vd 1–5 lỗi kiểu trong 1–2 file) → làm ngay trong phiên này,
  đúng các bước 1–5 của agent.
- **Nhiều lỗi rải nhiều file, hoặc log CI dài** → giao subagent `build-error-resolver` (Sonnet,
  CLAUDE.md mục 3 "phân việc theo độ phức tạp"). Brief phải có: lệnh đỏ + output (hoặc tên job +
  link run CI), nhánh/PR, phạm vi được phép sửa, và nhắc "không nới cổng". Nhận kết quả xong thì
  TỰ chạy lại lệnh xác nhận — không tin báo cáo xanh của subagent khi chưa tự thấy exit code 0.

## Không được làm (dù đang vội cho CI xanh)

Nới cổng (ngưỡng coverage, luật ESLint, `.prettierignore`, test canh luật), `any`/`@ts-ignore`/
`eslint-disable`/`.skip`, `--no-verify`, xoá `package-lock.json`, push commit rỗng để chạy lại CI.
Lỗi không thuộc PR này → nêu rõ đang đỏ cái gì, vì sao không phải của PR, đề xuất bản vá.

## Xong khi

Lệnh đỏ ban đầu chạy lại ra exit code 0, `npm run typecheck` + `npm run lint` vẫn xanh, và báo
cáo có: lỗi đã sửa (`path:line` — nguyên nhân — cách sửa) + lệnh xác nhận kèm output. Nếu khuôn
lỗi đáng nhớ → `/learn` để đề xuất mục `TRAPS.md`.
