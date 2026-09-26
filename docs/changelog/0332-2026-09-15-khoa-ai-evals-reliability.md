# 0332 — 2026-09-15 — Khoá AI Evals & Reliability Engineer

**PR:** [#936](https://github.com/seeker19110/dhcb/pull/936)

**Đặc tả:** `docs/specs/2026-09-15-khoa-ai-evals-reliability.md` (Approved for implementation).

## Đã làm

- Thêm khoá ngắn `airel` vào môn Lập trình: 12 giai đoạn trong 24 tuần, đi từ Python/pytest,
  LLM sampling, judge, RAG và Agent eval tới CI/CD, observability, production monitoring,
  resilience, chaos engineering, tối ưu chi phí và SRE/portfolio.
- Mỗi giai đoạn có bốn nhóm kiến thức trọng tâm, một Hands-on Lab, một deliverable đo được và
  tham chiếu tới các bài thực hành chạy code đã có — không chép nội dung bài học thành bản thứ hai.
- Mở rộng kiểu `CourseChapter` bằng metadata tuỳ chọn; 11 khoá cũ giữ nguyên hành vi.
- Trang khoá học hiển thị bản đồ 12 giai đoạn có hoạt ảnh, chi tiết lab/đầu ra và tự tắt chuyển
  động khi người học bật `prefers-reduced-motion`.
- Thêm test canh đủ 12 giai đoạn, phủ tuần 1–24 và bắt buộc mỗi giai đoạn có trọng tâm, lab,
  deliverable và ít nhất một bài thật.

## Bất biến giữ nguyên

- Không migration, endpoint, dependency hay thay đổi dữ liệu người học/thanh toán/quyền.
- Tiến độ tiếp tục dùng `programming.lesson_progress`; các bài tham chiếu giữ nguyên ID.
- URL khoá dùng cơ chế canonical sẵn có: `/lap-trinh/khoa-hoc/airel--...`.

## Bằng chứng

- `npx vitest run packages/subject-programming/courses/courses.test.ts` ✅ 9/9 test.
- `npm run typecheck` ✅.
- ESLint trên toàn bộ file TypeScript/TSX thay đổi ✅ 0 cảnh báo.
- `npm run build` ✅ (ứng dụng chính, server/packages và Hub).
- `git diff --check` ✅.

## Rollback

Revert PR. Không có migration hoặc dữ liệu cần khôi phục.
