# 0690 — 2026-10-29 — Ảnh Tầng 8b cho trang cần dữ liệu thật; sửa hạn ISO thô và nhãn enum ở Ghi chú

Đợt 6 của "làm tiếp tất cả nợ". Trả nợ (4) của audit UI/UX sâu 2026-09-22: "chưa chụp các trang cần dữ liệu
thật (bảng giá, huy hiệu, Kanban)" — trước đây chỉ có ảnh bản RỖNG, nên lỗi của thẻ/cột có dữ liệu không lộ.

## Đã làm

- `scripts/shots-real-data.ts` + lệnh `npm run shots:real-data`: chụp 5 trang (Bảng giá `/nang-cap`, Nhiệm vụ,
  Hồ sơ có huy hiệu, Kanban, Ghi chú) × 3 theme × 1440/390 px vào thư mục NGOÀI repo (cùng quy ước 0 file PNG của
  `shots:learning-ux`). Mock dùng lại `e2e/helpers/realDataMocks.ts`; việc/dự án mẫu PARSE qua
  `WorkTaskSchema`/`WorkProjectSchema` thật; huy hiệu nạp qua khoá localStorage thật. Script báo lỗi nếu ảnh trắng,
  quá thấp hoặc rơi về màn đăng nhập. `PW_CHROMIUM_PATH` (tuỳ chọn) cho máy có Chromium cài sẵn khác bản
  Playwright của repo. Mặc định ghi vào thư mục tạm riêng tạo bằng `mkdtempSync` (CodeQL "insecure temporary
  file" bắt bản đầu dùng đường dẫn cố định `/tmp/shots/real-data`).
- **Lỗi tìm ra khi NHÌN ảnh và đã sửa:**
  1. Kanban in hạn dạng ISO thô "Hạn: 2026-11-05T10:00:00.000Z" → `formatDateVN` (dd/mm/yyyy theo giờ Việt Nam,
     hàm dùng chung sẵn có).
  2. Trang Ghi chú dùng `toLocaleDateString()` không chỉ định locale (trình duyệt tiếng Anh hiện tháng/ngày) →
     `formatDateVN`.
  3. Trang Ghi chú in thẳng giá trị enum ra giao diện: mức ưu tiên "high"/"urgent", trạng thái dự án
     "active"/"completed" → nhãn tiếng Việt dùng chung ở `apps/dhcb/src/lib/workTaskLabels.ts` (Kanban dùng cùng
     nguồn, trước tự khai riêng).
  4. Ô lọc Kanban "Tất cả dự án (5)" — số 5 là số VIỆC, không phải số dự án → bỏ số, khớp trang Ghi chú.
- Trang Bảng giá, Nhiệm vụ, Hồ sơ/huy hiệu: không thấy lỗi bố cục ở cả 3 theme × 2 bề rộng.

## Bằng chứng

- Test đỏ-trước: `NotesKanban.loadError.test.tsx` thêm ca hạn `2026-11-05T18:00Z` phải hiện "Hạn: 06/11/2026"
  (sang ngày theo giờ Việt Nam) — đỏ trước khi sửa, xanh sau.
- Ảnh trước/sau (24 + 12 ảnh, ngoài repo): Kanban 390 px theme Xanh đêm và Ghi chú 1440 px hiện "05/11/2026",
  "Cao/Khẩn cấp/Vừa/Thấp".
- `tsc` app + api ✅ · eslint ✅ · vitest trụ Ghi chú ✅.
