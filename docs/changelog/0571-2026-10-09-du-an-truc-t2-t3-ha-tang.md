# 0571 — Hạ tầng dự án trục T2/T3: chọn dự án, mã bước theo dự án

- **Ngày:** 2026-10-09 · **PR:** (xem mô tả PR) · **Loại:** `feat(programming)`
- **Đặc tả:** `docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md` (Approved for implementation —
  chủ dự án chốt trong phiên 2026-10-09: làm đủ T2/T3 P1→P5, giữ tiến độ riêng từng dự án).

## Vấn đề

Môn Lập trình chỉ có dự án trục T1 "Cửa hàng của tôi". `PROJECT_TRACKS` khai T2/T3 với
`available: false` ghi cứng. Không có cách nào chọn dự án: cột `learner_state.project_track` đã
có nhưng không có đường ghi. Toàn bộ trang dự án, mã bước (`p<n>-s<k>`), workspace và snapshot
đều ngầm hiểu chỉ có một dự án.

## Đã làm

- **Mã theo dự án** (`packages/subject-programming/projectTrackIds.ts`, file không import gì):
  bước T1 GIỮ `p<n>-s<k>`, T2/T3 `t2-p<n>-s<k>`/`t3-p<n>-s<k>`; file workspace T2/T3 lưu dưới
  tiền tố `t2--`/`t3--` (tên khi chạy giữ nguyên); mốc snapshot `t2-p<n>`/`t3-p<n>`.
- **Dữ liệu:** `getProjectStages(track)` (T1 trả đúng `PROJECT_STAGES` cũ); khung 5 chặng rỗng ở
  `projectStepsT2.ts`/`projectStepsT3.ts`; `getProjectStep` tra cả 3 dự án. `PROJECT_TRACKS` dời
  sang `projectTracks.ts`, `available` SUY từ dữ liệu (có ≥ 1 bước là mở), kèm
  `normalizeProjectTrack` (mã lạ/dự án chưa mở → T1).
- **Server:** `POST /api/programming/progress` nhận body `{ projectTrack }` (Zod `.strict()`,
  `validateAuth`, upsert `learner_state`, chặn dự án chưa có bước bằng 400
  `PROJECT_TRACK_NOT_AVAILABLE`); regex khoá tiến độ nhận `t[23]-p<n>-s<k>`.
  `/api/programming/project` nhận mốc snapshot theo dự án và chỉ chốt file của dự án đó.
- **Client:** `programmingProjectTrack.ts` (bộ đệm + ghi lựa chọn; khách chỉ localStorage);
  `fetchProgress` ghi `state.projectTrack` từ server vào bộ đệm; `programmingProject.ts`
  nạp/lưu/snapshot theo dự án.
- **Giao diện:** bộ chọn `ProjectTrackPicker` (radio gốc trong fieldset/legend, dự án chưa mở bị
  `disabled` thật + "Sắp mở") ở đầu trang dự án; trang dựng chặng/bước, tiêu đề, câu chúc mừng
  theo dự án đang chọn; đổi dự án thì lưu file đang sửa của dự án cũ trước. Trang môn hiện tên
  chặng theo dự án đang chọn.
- **Cổng nội dung:** `lessonsPython.test.ts` quét bước Python của cả 3 dự án;
  `projectTracks.test.ts` có khối "hợp đồng nội dung T2/T3" (mã, unit, `files`, milestone) tự áp
  khi PR nội dung điền bước.

## Quyết định

- Ghi lựa chọn qua endpoint progress sẵn có (GET đã trả `projectTrack` từ cùng dòng) thay vì
  endpoint mới.
- Tách workspace bằng tiền tố đường dẫn (không migration) — nếu không, `logic.py` của T2 sẽ đè
  `logic.py` của T1 khi đổi dự án.
- `programmingProjectTrack.ts` chỉ import `projectTrackIds.ts`: `programmingProgress.ts` (bundle
  của ~50 file) import nó, không được kéo dữ liệu bước dự án theo. Cũng vì thế kiểm
  `state.projectTrack` bằng type guard một-giá-trị thay vì nạp Zod vào chunk đó.
- `ProgrammingAbout` giữ nguyên: mọi dự án cùng 5 chặng.

## Kiểm chứng

- `npm run typecheck` · `npm run lint` · `npm run format:check`: exit 0.
- `npx vitest run packages/subject-programming apps/server apps/dhcb/src/pages/subjects/programming
packages/core-personal apps/dhcb/src/lib/programmingProject apps/dhcb/src/lib/programmingProgress
apps/dhcb/src/components/programming`: 273 file xanh (4 bỏ qua có sẵn), 10921 test xanh.
- `npm test` toàn bộ: 882 file xanh (4 bỏ qua có sẵn), 20093 test xanh.
- `npm run codemap -- cycles`: "Không có chu trình import." · `npm run check:specs`: OK.
- `npx tsx scripts/audit-prose.ts --ci`: 0 lỗi. `npm run build`: exit 0. `npm run size`: Initial
  JS 149,36 kB / 160 kB; chunk entry không chứa dữ liệu bước dự án (chỉ thêm `projectTrackIds`).
- Playwright `e2e/a11y.spec.ts` + `e2e/a11y-aaa.spec.ts` lọc `du-an`: 9/9 xanh (3 theme, cả bản
  390px). Tầng 8b: chụp 1440px + 390px theme Blue sky/Xanh đêm, sửa một lỗi chỉ thấy trên ảnh
  (thẻ "Sắp mở" giãn khoảng trống giữa tên và mô tả do hàng lưới kéo giãn → `content-start`).
- `npm run check:sql`: CHƯA chạy ở máy (không có Postgres chạy sẵn); câu upsert mới là SQL tĩnh,
  CI job `sql-prepare` sẽ PREPARE nó.

## Không làm

- Nội dung bước T2/T3 (4 PR sau), API giả cho bước `fetch` của T2/T3 (PR nội dung bổ sung).
