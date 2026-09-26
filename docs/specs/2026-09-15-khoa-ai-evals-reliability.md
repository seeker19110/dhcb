# Đặc tả khóa AI Evals & Reliability Engineer

**Trạng thái:** Approved for implementation

**Ngày:** 2026-09-15

**PR:** [#936](https://github.com/seeker19110/dhcb/pull/936)

## Tóm tắt

Thêm một khóa ngắn trong môn Lập trình, tổng hợp 12 giai đoạn/24 tuần để đưa người học từ nền
tảng Python và kiểm thử tới năng lực đánh giá, quan sát và vận hành hệ thống LLM/RAG/Agent.

## Issue / outcome

Khung lộ trình đầu vào đã có trọng tâm, lab và deliverable nhưng chưa xuất hiện trong sản phẩm.
Sau thay đổi, người học mở khóa từ trang môn Lập trình, xem đủ 12 giai đoạn, học các bài code
liên quan và theo dõi tiến độ bằng cơ chế hiện có.

## Research / spec

- Đặc tả được phê duyệt: `docs/specs/2026-09-15-khoa-ai-evals-reliability.md` — Approved for
  implementation.
- Nguồn nội dung: lộ trình 12 giai đoạn do chủ dự án cung cấp trong phiên làm việc ngày
  2026-09-15.
- Cơ chế thi hành: tầng khóa ngắn tại `packages/subject-programming/courses/`, tái sử dụng bài
  bằng `lessonIds` để giữ một nguồn sự thật.
- Giao diện: mở rộng `ProgrammingCoursePage`, không thêm route hoặc hệ thống tiến độ mới.

## Phạm vi

- Thêm mã khóa `airel`, registry và metadata tùy chọn cho chương: tuần, trọng tâm, lab,
  deliverable.
- 12 giai đoạn phủ tuần 1–24; mỗi giai đoạn có ít nhất bốn trọng tâm và một bài thực hành thật.
- Hiển thị bản đồ tiến trình có hoạt ảnh; tắt hoạt ảnh theo `prefers-reduced-motion`.
- Thêm test bất biến cho cấu trúc khóa và mọi tham chiếu bài học.

### Không làm

- Không tạo bài học trùng với nội dung đã có.
- Không thêm endpoint, migration, dependency, quyền, thanh toán hoặc thao tác production.
- Không thay đổi cách hệ thống xác nhận hoàn thành bài.

## Validation

- Test registry phải chứng minh mọi `lessonIds` tồn tại.
- Test khóa phải chứng minh đúng 12 giai đoạn, phủ tuần đầu và tuần cuối, đủ focus/lab/
  deliverable.
- `npm run typecheck`, ESLint các file thay đổi, `npm run build` và `git diff --check` phải đạt.

## Rủi ro, rollout và rollback

Rủi ro thấp: metadata mới đều tùy chọn nên các khóa cũ không đổi. Rollout theo deployment bình
thường sau khi CI xanh. Rollback bằng revert PR; không có migration hoặc dữ liệu cần khôi phục.

## Definition of Done

- [x] Khóa xuất hiện trong danh sách khóa ngắn của môn Lập trình.
- [x] Có đủ 12 giai đoạn/24 tuần, lab và deliverable.
- [x] Mỗi nút học dẫn tới một bài có thật và giữ ngữ cảnh khóa.
- [x] Desktop có mục lục; mobile giữ bố cục một cột.
- [x] Hoạt ảnh tôn trọng chế độ giảm chuyển động.
- [x] Test, typecheck, lint, build và diff check đạt trên máy phát triển.
