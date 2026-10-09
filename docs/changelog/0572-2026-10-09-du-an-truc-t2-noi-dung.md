# 0572 — Nội dung dự án trục T2 "Quỹ lớp / Chi tiêu nhà mình" đủ P1→P5

- **Ngày:** 2026-10-09 · **PR:** #1321 · **Loại:** `feat(programming)`
- **Đặc tả:** `docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md` (Approved for implementation —
  hợp đồng nội dung T2/T3: mã `t2-p<n>-s<k>`, unit theo chặng, `files`, bước milestone).
- **Số changelog:** dùng 0572 vì `main` đã có tới 0571 lúc soạn; trùng số với PR song song cũng
  được phép (`docs/changelog/README.md`).

## Vấn đề

Hạ tầng (changelog hạ tầng T2/T3) đã có bộ chọn dự án và khung 5 chặng rỗng cho T2, nên T2 vẫn
"Sắp mở". Bước `fetch` của trang dự án chỉ có API giả của T1 (`/api/san-pham`) và trang dự án
không chuyển `datasetSql` của từng ca kiểm tra cho bộ chấm SQL — một dự án mới không thể có bước
SQL với dữ liệu riêng hay bước fetch với API riêng.

## Đã làm

- **26 bước, 5 chặng** (số bước bám T1 thật: 5 · 5 · 5 · 6 · 5):
  - **P1** (`projectStepsT2.ts`, file `quy_lop.py`): mở sổ quỹ → đã thu/còn thiếu/tỉ lệ → một
    khoản chi + tình trạng quỹ → vòng lặp nhiều khoản chi (chặn chi quá số dư) → milestone đóng
    bù làm tròn lên nghìn đồng.
  - **P2**: danh sách thành viên + ai chưa đóng → chi theo hạng mục → lưu sổ ra CSV
    `so_quy.csv` → đọc số tiền an toàn (`try/except`, chặn số ≤ 0) → milestone tách 3 file
    `quy_lop.py` · `tinh_quy.py` · `luu_so.py` (chấm cả hàm bằng `probeCode`).
  - **P3** (`projectStepsT2P3.ts`): bảng sổ quỹ HTML → CSS đọc được trên điện thoại (vùng chạm
    44px) → trang ghi sổ thu/chi bằng DOM → báo cáo kỳ bằng SQL (dữ liệu riêng qua
    `datasetSql`, có bộ dữ liệu ẩn) → milestone trang minh bạch quỹ `minh_bach.js` lấy sổ từ
    API giả `/api/quy` + tra chứng từ `?ma=` (404 có thông báo).
  - **P4** (`projectStepsT2P4.ts`): lớp `ThanhVien`/`Lop` → `SoQuy` ghép lớp → ngoại lệ
    `QuyKhongDu` + logging → 6 test pytest → API CRUD `/thanh-vien` (422/404) → milestone API
    `/giao-dich` + `/bao-cao` lấy số dư từ CSDL.
  - **P5** (`projectStepsT2P5.ts`): schema có CHECK/FK/INDEX + đợt thu trong một giao dịch (hỏng
    một dòng là huỷ cả đợt) → đăng nhập băm pbkdf2 + phân quyền thủ quỹ/thành viên + chống XSS
    → đo hiệu năng O(m×n) với O(n+m) → cấu hình qua biến môi trường, che khoá ngân hàng →
    milestone API công khai `/minh-bach` (chỉ trả SỐ bạn chưa đóng, không nêu tên).
- **API giả `quy-lop`** cho bước fetch: `fundData.ts` (sổ 5 giao dịch), `taoFetchQuyLop` +
  `FETCH_SHIM_QUY_LOP_JS` trong `fetchGia.ts`, hàm điều phối duy nhất `taoFetchTheoApi` dùng
  chung cho bộ chấm trình duyệt (`fetchPrelude.ts`) và bộ chấm máy chủ
  (`domFetchServerPrelude.ts`).
- **`ProjectTrack.fetchApi`** (`projectTracks.ts`): mỗi dự án khai API giả của mình (T1
  `cua-hang`, T2 `quy-lop`); `ProgrammingProjectPage.tsx` đọc trường này cho cả chấm lẫn xem
  trước, và nay chuyển `datasetSql` của từng ca cho bộ chấm SQL.
- **Cổng** `projectStepsT2.test.ts` (61 test): chạy `referenceCode` thật qua mọi bộ máy (Python,
  happy-dom, sql.js, DOM, fetch cả trình duyệt lẫn máy chủ), đối chiếu số học bằng TS, thử đột
  biến (sửa một hằng/dòng của code mẫu là phải trượt ít nhất một ca), kiểm ca ẩn chống gõ cứng,
  khối test trong đề trùng nguyên văn với code mẫu. `projectTracks.test.ts` thêm luật: dự án có
  bước fetch phải khai `fetchApi`.

## Quyết định

- Dòng chấm in KHÔNG DẤU, bước sau giữ các dòng của bước trước (người học sửa tiếp, không viết
  lại); mọi bước có ít nhất một ca ẩn đổi số liệu.
- `fetchApi` khai theo dự án thay vì nhánh `track === 'T1'` trong trang: thêm dự án T3 chỉ cần
  một dòng khai, và một dự án có bước fetch mà quên khai bị test chặn — không âm thầm rơi về API
  thời tiết.
- Tách P3/P4/P5 ra file riêng để mỗi file dưới ngưỡng dễ đọc; `T2_PROJECT_STAGES` vẫn ở
  `projectStepsT2.ts`.
- Bước fetch là trang/file riêng (`minh_bach.js`) — trang ghi sổ của thủ quỹ và trang công khai
  cho phụ huynh là hai đối tượng khác nhau.
- Trang công khai chỉ đưa số lượng bạn chưa đóng: minh bạch tiền quỹ nhưng không bêu tên học
  sinh.

## Kiểm chứng

Chạy trong worktree ngày 2026-10-09 sau khi soạn xong cả 5 chặng:

- `npx vitest run packages/subject-programming apps/dhcb/src/pages/subjects/programming
apps/dhcb/src/components/programming apps/dhcb/src/lib`: exit 0, 295 file xanh, 12140 test xanh
  (riêng `projectStepsT2.test.ts`: 61/61). Có 8 dòng stderr `ECONNREFUSED 127.0.0.1:3000` đến từ
  test khác của bộ này, không từ file T2 (chạy riêng file T2 không có dòng đó).
- `npx vitest run apps/server` phần lập trình (sau P3): 8 file, 106 test xanh.
- `npm run typecheck` · `npm run lint` · `npm run format:check` · `npm run build`: exit 0.
- `npm run codemap -- cycles`: "Không có chu trình import."
- `npx tsx scripts/audit-prose.ts --ci` (phạm vi mặc định): exit 0, 0 lỗi. Chạy riêng trên 5 file
  nội dung T2: 0 lỗi, 4 cảnh báo đều là dữ liệu chấm chứ không phải câu chữ (`None None` là đầu
  ra Python cố ý; dòng CSV trong `stdinLines` không có khoảng trắng sau dấu phẩy).

## Không làm

- Tầng 8b ĐÃ LÀM ở phiên chính trước khi mở PR: chụp `/lap-trinh/du-an` chọn T2 ở 1440px +
  390px, theme Blue sky + Xanh đêm. Bộ chọn: T2 mở, T3 còn "Sắp mở" (disabled thật); 5 chặng, bước
  1 mở, không tràn/đè. Chữ có dấu trong ô code hiện vỡ dấu ở Chromium headless — nguồn là NFC
  (đã kiểm), câu comment giống hệt T1, nên là do font monospace của container, không phải lỗi T2.
- `projectStepsT2*.ts` không nằm trong phạm vi mặc định của `audit-prose`; đã chạy riêng.
