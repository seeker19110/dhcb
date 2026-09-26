# 0236 — 2026-09-02 — Breadcrumb: phủ nốt môn Lập trình và các trụ

PR: [#819](https://github.com/seeker19110/dhcb/pull/819) · Nhánh: `claude/breadcrumb-lap-trinh-tru-701l36`

## Việc đã làm

Breadcrumb desktop (thêm ở đợt thiết kế lại desktop) mới phủ studio + môn học + luyện tập +
tiếng Anh. Còn hai vùng trắng, nay bịt nốt:

1. **Môn Lập trình.** Mọi trang dưới `/lap-trinh/...` trước đây gộp chung về đúng một đốt
   "Lập trình", nên đứng ở một chặng của hướng chuyên sâu không biết mình thuộc hướng nào.
   - Thêm tầng TĨNH vào cây route: `/lap-trinh/huong` · `/lap-trinh/du-an` · `/lap-trinh/on-tap`
     · `/lap-trinh/chay-thu` · `/lap-trinh/gioi-thieu`. Chỉ đặt nút cho nhánh có TRANG THẬT để
     bấm về — nhánh id động (`khoa-hoc/:id`, `lo-trinh/:id`, `bai-hoc/:id`) không có trang danh
     sách nên không đặt nút giả.
   - Tầng có tên ĐỘNG (tên hướng, tên lộ trình, tên bậc) thì cây route tĩnh không thể biết:
     thêm tham số thứ ba `extra` cho `buildCrumbs`, prop `crumbs` cho `Breadcrumb` và `Layout`,
     rồi 4 trang tự cấp đốt cha của mình: `ProgrammingSpecStagePage` (tên hướng),
     `ProgrammingPathStagePage` + `ProgrammingPathDiagnostic` (tên lộ trình),
     `ProgrammingLessonPage` (tên bậc, URL dựng qua `duongDanBac` cho đúng dạng `<mã>--<tiêu đề>`).
     Đốt động trùng tầng tĩnh liền trước thì bị bỏ, không nhân đôi.

2. **Các trụ.** Trang công cụ của trụ trước đây KHÔNG có tầng cha nào nên `Breadcrumb` tự ẩn
   hẳn — đứng ở "Phòng Luyện Phỏng Vấn AI" không có gì cho biết nó thuộc trụ Sự nghiệp. Thêm:
   `/career/interview` · `/startup/canvas` (dưới _Sự Nghiệp & Khởi Nghiệp_), `/work/kanban` ·
   `/life/wheel` (dưới _Công Việc & Đời Sống_), `/action-canvas` (dưới _Bạn Đồng Hành_),
   `/life-graph` (dưới _Hồ sơ_), `/ung-dung-thuc-te` (dưới _Phòng Học & STEM_). Đốt tab của hai
   studio gộp giữ nguyên tham số `?muc=` như nút Back của chính trang đó, nên bấm vào rơi đúng
   tab chứ không rơi về tab đầu.

## Quyết định kèm theo

- **Không đưa các trụ vào `navTree.ts`.** Sidebar hiện không có nhóm con cho hai studio trụ;
  thêm dữ liệu vào đó chỉ để breadcrumb dùng là dựng sẵn một nguồn dễ lệch. Khi nào sidebar
  thật sự cần nhóm con thì tách ra một lượt.
- **Không đặt nút breadcrumb cho đường dẫn không có trang.** Một đốt bấm vào rơi vào route
  `*` (về Trang chủ) còn tệ hơn là không có đốt.

## Bằng chứng kiểm chứng

- `npm run typecheck` ✅ · `npm run lint` ✅ (0 cảnh báo) · `npm run format` ✅
- `npm test` ✅ — 536 file / 10.930 test, trong đó `apps/dhcb/src/lib/breadcrumb.test.ts` từ
  9 lên 14 test (thêm ca: nhánh tĩnh Lập trình, đốt cha động, chống nhân đôi đốt động, công cụ
  trụ Sự nghiệp giữ `?muc=`, công cụ trụ Công việc & Đời sống).
- `npm run build` ✅ — 214,09 kB JS / 37,73 kB CSS (gzip 65,41 / 7,20).
