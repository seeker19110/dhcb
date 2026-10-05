# 0492 — Đợt U8 audit UI/UX: thuật ngữ nội bộ, mã enum, chữ Viết Hoa Mỗi Chữ, nguồn truyện (2026-10-05)

- **Ngày:** 2026-10-05 · **PR:** #1235 · **Loại:** `fix(copy)`.
- **Phạm vi:** đợt U8 trong `docs/audit/2026-09-30-audit-ui-ux-chuan-2026.md` mục 12: **M16**. M15
  (tiêu đề lý thuyết STEM) đã xong ở changelog 0470 — kiểm nhanh, không làm lại.

## Đã làm

### 1. Mã enum không còn lộ ở Góc học tập

- File mới `apps/dhcb/src/lib/subjectLabels.ts`: MỘT bảng tra `categoryLabel` /
  `evaluationModeLabel`. Kiểu `Record` đủ khoá nên thêm giá trị enum mới ở contract mà quên nhãn
  thì typecheck đỏ. Test `subjectLabels.test.ts`.
- `pages/learning/Subjects.tsx`: "Chế độ chấm: rubric ielts, rubric ai…" thành "Chấm theo thang
  IELTS, AI chấm theo tiêu chí…"; huy hiệu `LANGUAGE`/`STEM` thành "Ngôn ngữ"/"Khoa học"/"Nhân
  văn" (bỏ luôn `uppercase`). Giữ hàng "Chế độ chấm" vì có nghĩa với người học: biết bài được chấm
  thế nào.

### 2. Hạ tầng không lộ ở Bạn Đồng Hành

- `MeshTelemetry/RealtimeTelemetryBar.tsx`: bỏ "Mesh: ap-southeast-1", hiện "Kết nối ổn định".

### 3. Thuật ngữ sang tiếng Việt (chỉ chuỗi hiển thị, không đổi tên biến/khoá)

| Trước                               | Sau                                        |
| ----------------------------------- | ------------------------------------------ |
| Elo / Xếp hạng Elo                  | điểm / Xếp hạng điểm                       |
| Ôn SRS (tab, huy hiệu, trang About) | Ôn lại                                     |
| Karaoke Text                        | Chữ sáng theo giọng đọc                    |
| Audio IPA                           | Có phiên âm                                |
| Streak (chia sẻ, Hồ sơ, Nhiệm vụ…)  | Chuỗi ngày học / Chuỗi học                 |
| Simulators                          | thí nghiệm mô phỏng                        |
| PoC (trang Avatar demo)             | Thử nghiệm                                 |
| Copy link                           | Chép liên kết (nhánh tiếng Anh giữ nguyên) |

Cập nhật theo: 2 spec E2E (`cefr-tab-touch-target`, `admin`) và các test có khẳng định chuỗi cũ.

### 4. Chữ hoa

- **Viết Hoa Mỗi Chữ:** khoảng 135 chuỗi (91 chuỗi một dòng + khoảng 44 chuỗi JSX nhiều dòng) ở `components/`, `pages/`, `lib/studios.ts` (heuristic: từ 3 từ viết
  hoa liền nhau, có từ 2 từ có dấu) chuyển sang viết hoa chữ đầu câu, giữ tên riêng (Bạn Đồng Hành,
  Kanban, Toulmin, Tết Nguyên Đán…). "Môn Tiếng Anh" thành "Môn tiếng Anh". Spec E2E có chuỗi cũ
  (`a11y-modals`, `modal-sticky-header`, `studio-modal-overlay`, `companion-catalog-states`,
  `practice-*`) và vài test đơn vị đã đổi theo.
- **`uppercase tracking-*`:** gỡ ở 58 nhãn đọc (tiêu đề mục, nhãn thống kê, chú thích). GIỮ 10 chỗ
  là huy hiệu nhỏ / ô nhập mã chuyến đi (`TripSetup`, mã luôn viết hoa) / nhãn kỹ thuật; liệt kê
  tường minh trong allowlist của test.

### 5. Nguồn truyện

- **Quyết định: nguồn truyện là bản do người dịch thật; chủ dự án xác nhận 2026-10-05.** 97 truyện
  ghi "Opus dịch tay 2026 từ bản public domain" đổi thành **"Biên dịch: Đồng Hành"**.
- Sửa cả nguồn (`apps/dhcb/src/data/stories/raw/*.json`), đầu ra (`public/data/stories/*.json`,
  chạy lại `scripts/gen-stories-json.mjs`), chú thích kiểu dữ liệu `StorySource` và comment trong
  script sinh để lần sinh sau không quay lại.
- Phát hiện thêm cùng loại lộ tên mô hình ở 32 truyện: "English version written by Opus (2026)",
  "Opus kể lại bằng lời văn riêng", "Opus tự kể lại", "Opus soạn tay 2026" thay bằng "Đồng Hành"
  (không nêu tên mô hình). Không đổi nội dung bản dịch. Chủ dự án duyệt phần suy rộng này ngày
  2026-10-05 ("sửa luôn").

### 6. Cổng

`apps/dhcb/src/pages/core/UiNoise.design.test.ts` thêm 4 khối, đều có đối chứng âm:

- chuỗi hiển thị không chứa thuật ngữ cấm (`Mesh:`, `ap-southeast`, `Opus dịch tay`, `Ôn SRS`,
  `Karaoke Text`, `Audio IPA`, `Elo`, enum chấm điểm thô; `Streak`/`Simulators`/`PoC`/`Copy link`
  chỉ cấm trong chuỗi có dấu tiếng Việt). Chỉ quét chuỗi hiển thị, bỏ dòng comment;
- không file truyện (nguồn và đầu ra) chứa chữ "Opus";
- luật phát hiện Viết Hoa Mỗi Chữ (ngưỡng 3 từ, chuỗi dưới ngưỡng bị bỏ sót có chủ ý);
- `uppercase tracking-*` khớp đúng allowlist hai chiều như D2/D3.

## Không làm / để lại

- Chuỗi Viết Hoa Mỗi Chữ chỉ 2 từ, và chuỗi nằm trong `data/` (nội dung học) hoặc `prompts/`
  (golden snapshot): ngoài ngưỡng heuristic hoặc ngoài phạm vi.
- Nhãn `uppercase` không đi kèm `tracking-*` (vd mã cấp độ `font-mono`) và className viết nhiều dòng:
  mẫu quét theo từng dòng không thấy.
- Nội dung `MeshHealthMonitorModal` (admin) còn thuật ngữ hạ tầng ("node relay", "tokens"); modal này
  không mở được từ giao diện hiện tại (`setModalOpen(true)` không được gọi), nên chưa xử lý.

## Gộp `main`

- Lần gộp đầu xung đột ở `Landing.tsx` và `LandingEn.tsx` (U3 thêm màu `theme-light`). Giữ màu
  của `main`, bỏ `uppercase tracking`.
- Lần gộp sau xung đột ở `Subjects.tsx` (#1232 đổi `h3` thành `h2`). Giữ thẻ `h2` của `main`, lấy
  chữ hoa đầu câu của đợt này.

## Bằng chứng

- Chạy trên kết quả đã gộp `main`, sau `rm -rf packages/*/dist dist dist-server`:
  - typecheck ✅ · lint 0 cảnh báo ✅ · build ✅ · `audit:prose -- --ci` ✅;
  - `test:coverage`: 789 file, 18468 test ✅.
- E2E: 8 spec có sửa chuỗi, cùng `landmark-title`, `english-subject-home`, `a11y-modals`: 122 ca xanh.
- Golden snapshot prompt: không chạy, vì đợt này không đụng `src/prompts/*`.
- Tầng 8b, theme Blue sky, 1440px và 390px, trước và sau:
  - **Góc học tập:** chữ enum đổi thành câu tiếng Việt; huy hiệu "Ngôn ngữ"/"Khoa học"; tiêu đề viết
    hoa chữ đầu câu. Hàng "Chế độ chấm" từng bẻ dòng xấu, đã sửa bằng `items-start` + `shrink-0` +
    `min-w-0`. Ở 390px chữ không tràn.
  - **Bạn Đồng Hành:** "Mesh: ap-southeast-1" thành "Kết nối ổn định"; bố cục không đổi.
