# 0550 — "Tổng hợp 30 ngày" của Bạn Đồng Hành dựng từ dữ liệu thật (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** #1298
  · **Loại:** `feat(companion)`
- **Đặc tả:** `docs/specs/2026-10-09-tong-hop-da-mien-du-lieu-that.md` (Approved for implementation
  — chủ dự án duyệt hướng "chất lượng cao nhất" 2026-10-09).
- **Nguồn:** nợ 🟡 `PROGRESS.md` "Tổng hợp đa miền (Life Synthesis) chờ dữ liệu thật" (sau `0475`)
  — nay **ĐÓNG**, khối nợ dời sang `docs/legacy/no-ky-thuat-da-dong.md`.

## Vấn đề

Từ `0475`: `/api/life-synthesis` trả 501, tab "Tổng kết" đã gỡ; `lifeSynthesisService.ts` vẫn là số
hoạt động gán cứng, điểm 88/92/85, mục tiêu mẫu, câu soạn sẵn, chấm cả 3 trụ đã xoá. Ảnh "trước"
(Tầng 8b): studio "Kế hoạch" không có gì tổng hợp hoạt động thật của người học.

## Đã làm

- **Hợp đồng v2** `packages/core-contracts/lifeSynthesis.ts` — `.strict()` mọi tầng, KHÔNG trường
  điểm; chỉ số đếm (ngày có học, chuỗi ngày, ngày gần nhất, bài hoàn thành lần đầu — `null` với
  Tiếng Anh vì môn này không ghi "hoàn thành bài" ở server —, việc mở/quá hạn/đến hạn 7 ngày/chưa
  hạn/bị vướng, ghi chú mới). Câu chữ mang `ruleId` (12 luật nhận xét, 5 luật khuyến nghị ≤ 3).
- **Service viết lại** `packages/core-personal/lifeSynthesisService.ts`:
  - 1 câu SQL `union all` trên 8 nguồn thật (Tiếng Anh: `daily_usage.learn_count`, phiên chat/nói,
    bài viết · Lập trình: `lesson_progress.updated_at/completed_at` · STEM: `completion_evidence`,
    `completion_state.completed_at`), gộp môn × ngày giờ VN trong Postgres; 1 câu đếm `worklife.*`
    nối qua `personal.persons.user_id` (không tạo Person khi đọc). Tham số hoá, `$1` = userId token.
  - Phần tính thuần: `computeStreak` (kết thúc hôm nay hoặc hôm qua; trần 30 → câu nói "ít nhất"),
    `summarizeLearning`, `composeObservations`, `composeRecommendations` (ưu tiên cố định, mỗi đích
    một lần). Ngưỡng là hằng có tên (`LAPSE_DAYS` 7, `MIN_STREAK_TO_MENTION` 2,
    `UNDATED_RECOMMEND_THRESHOLD` 3, `DUE_SOON_DAYS` 7). Không AI, không ngẫu nhiên.
  - Báo cáo `LifeSynthesisReportSchema.parse` trước khi trả; lỗi CSDL ném ra (không bịa).
- **Handler** `apps/server/src/api/personal/life-synthesis.ts`: 501 → GET thật (rate limit 30/phút,
  `validateAuth`, 500 an toàn); POST của bản cũ (số liệu client tự khai) → 405.
- **Client**: `lifeSynthesisApi.ts` parse qua Zod (lệch hợp đồng = lỗi, không báo cáo nửa vời);
  `lifeSynthesisRoutes.ts` dựng URL đích qua `subjectsPath`/`duongDanGhiChu`; `LifeSynthesisDashboard`
  viết lại — "30 ngày qua của bạn": khung chờ (Skeleton, `aria-busy`) · LoadError + Thử lại · hai khu
  Học tập / Ghi chú + "Gợi ý cho hôm nay" (Link `tap-44`); token `content`/`surface`/`line`/`accent`.
  Gắn trong studio **Kế hoạch**, ngay SAU thẻ Workplace Harvester — không tab riêng, không lên
  Trang chủ. (Bản đầu đặt ở đầu studio làm đỏ cổng E2E [S06d] `e2e/a11y.spec.ts` ở CI: tab "Thẻ
  SRS" của Harvester bị đẩy xuống dưới nếp gấp 390 px; cổng này không sửa, đổi vị trí khối.)
- **Xoá mã chết** của bản cũ: `LifeSynthesisDetailModal.tsx` (POST số tự khai, "xác suất đạt"),
  `lifeSynthesisFormat.ts` (chuẩn hoá điểm 0–100). `UiNoise.design.test.ts` gỡ mục allowlist chữ HOA
  của huy hiệu "V5.4 Flagship" đã bỏ.
- **E2E**: `e2e/helpers/lifeSynthesisMock.ts` (parse qua hợp đồng) + `mockLogin` mock
  `/api/life-synthesis` → cổng a11y AA/AAA hiện có quét studio "Kế hoạch" thấy NỘI DUNG khối, không
  chỉ khối lỗi. Không sửa `e2e/a11y*.spec.ts`.
- Skill `life-career-strategic-advisor` + `ui-ux` (cả `.claude/` và `.agents/`, trùng byte) cập nhật
  theo mã.

## Quyết định tự chọn (trong ranh giới đặc tả)

- **Đặt khối trong "Kế hoạch", không tab riêng** — Luật số 1: kết quả tổng hợp không là màn hình
  chính; studio này đã là nơi "chọn việc tiếp theo".
- **Không dùng `daily_usage.chat_count…`** — `DEFAULT_SUBJECT='english'` cho mọi lượt AI nên cột đó
  không phân biệt môn; chỉ `learn_count` là tín hiệu học Tiếng Anh thật.
- **Lập trình đếm cả `updated_at`** dù nó bị ghi đè — cho ra CẬN DƯỚI số ngày học (không bao giờ thổi
  phồng); ghi rõ ở đặc tả "Còn để ngỏ".
- **Nhận xét Ghi chú thay cho bảng số** — tránh lặp cùng con số hai lần (bảng + câu).
- **Môn xếp dọc** ở danh sách — ảnh 390px lần đầu cho thấy "Tiếng Anh" xuống dòng còn "Lập trình"
  nằm ngang (ngắt không đều); đã sửa và chụp lại.

## Bằng chứng

- Service chạy trên Postgres 16 local đã áp 92 migration (cụm `ls0550`, đã xoá sau khi xong): PREPARE
  được cả 2 câu; chèn user thật (learn_count hôm nay, 1 phiên chat hôm qua, 1 bài Lập trình hoàn
  thành 9 ngày trước, 2 việc — 1 quá hạn, 1 chưa hạn) → báo cáo đúng: Tiếng Anh 2 ngày, chuỗi 2;
  Lập trình 1 bài, "Đã 9 ngày chưa quay lại Lập trình (lần gần nhất 30/09)"; gợi ý quá hạn + quay
  lại Lập trình. `npm run check:sql` → "Không có câu SQL lỗi ngoài allowlist (PREPARE 605 câu…)", exit 0.
- **Tầng 8b** (ảnh ở scratchpad phiên `shots-0550/`): trước = "Kế hoạch" không có khối; sau = đủ
  dữ liệu / rỗng / lỗi × blue-sky + dark-blue × 1440 + 390. Quét vùng khối bằng
  `scanScopedAa` + `scanScopedAaa` (cùng luật cổng): **0 vi phạm ở cả 12 tổ hợp**.
- Cổng: xem báo cáo trong mô tả PR / báo cáo bàn giao của đợt.

## Còn mở

- Nút "nhờ AI gợi ý thêm" (có đếm lượt) — cố ý ngoài phạm vi (đặc tả mục KHÔNG LÀM).
- Chuỗi ngày chỉ đếm trong cửa sổ 30 ngày.
