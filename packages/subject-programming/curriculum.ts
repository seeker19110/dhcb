// packages/subject-programming/curriculum.ts — Khung giáo trình môn LẬP TRÌNH.
// Nguồn đặc tả: docs/research/dac-ta-mon-lap-trinh-2026-08-24.md (thang P1–P6, đề cương unit)
// + docs/research/dac-ta-du-an-xuyen-suot-mon-lap-trinh-2026-08-24.md (dự án trục, mô hình 2 làn).
//
// PR-L1 chỉ chứa KHUNG (bậc + unit + bước dự án trục) — nội dung bài học chi tiết (khuôn 8
// bước: Predict/Parsons/Make…) sẽ vào ở PR-L3/L4. Dữ liệu ở đây là hằng biên dịch, không I/O.

/** Mã bậc P1–P6 (tương tự CEFR A1–C2 của môn English). */
export type ProgrammingLevelId = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6'

export const PROGRAMMING_LEVEL_IDS: ProgrammingLevelId[] = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']

/** Một unit trong bậc: kiến thức nạp ở làn LUYỆN + bước xây tiếp dự án trục ở làn DỰ ÁN. */
export interface ProgrammingUnit {
  /** id ổn định dạng `<bậc>-u<số>` — dùng làm khoá tiến độ trong Postgres. */
  id: string
  title: string
  /** Kiến thức chính của unit (làn LUYỆN). */
  topics: string
  /** Bước xây tiếp dự án trục T1 "Cửa hàng của tôi" (làn DỰ ÁN) — rỗng nếu unit thuần luyện. */
  projectStep?: string
  /**
   * Nhóm (track) chứa unit — chỉ dùng ở bậc P6, nơi 65 unit thuộc nhiều mạch khác hẳn nhau
   * (dẫn nhập · Kotlin · Paradigm · hướng chuyên sâu). Giá trị phải khớp `id` của một mục
   * trong `UNIT_TRACKS`.
   *
   * KHÔNG khai track thì unit rơi vào nhóm MẶC ĐỊNH (mục có `macDinh: true`) — nhóm đó được
   * KHAI RÕ trong `UNIT_TRACKS` chứ không phải quy ước ngầm, và nhờ vậy 55 unit hướng chuyên
   * sâu không phải sửa từng cái một.
   */
  track?: string
}

export interface ProgrammingLevel {
  id: ProgrammingLevelId
  /** Tên bậc, ví dụ "Nhập môn tư duy". */
  name: string
  /** Mục tiêu đầu ra đo được (can-do). */
  canDo: string
  /** Thời lượng ước tính, ví dụ "4–6 tuần". */
  duration: string
  /** Ngôn ngữ chính của bậc. */
  languages: string[]
  /** Tên chặng dự án trục + trạng thái sản phẩm khi hoàn thành bậc (milestone). */
  projectStage: string
  projectMilestone: string
  units: ProgrammingUnit[]
}

// Khung unit theo đề cương đặc tả gốc mục 4; bước dự án theo bản đồ đặc tả xuyên suốt mục 3.
export const PROGRAMMING_LEVELS: ProgrammingLevel[] = [
  {
    id: 'p1',
    name: 'Nhập môn tư duy',
    canDo:
      'Đọc-hiểu và viết chương trình tuần tự: biến, kiểu, nhập/xuất, rẽ nhánh, vòng lặp; trace được code trên giấy.',
    duration: '4–6 tuần',
    languages: ['Python'],
    projectStage: 'Chặng P1 — "Máy tính tiền" (console)',
    projectMilestone: 'Máy bán hàng console hoàn chỉnh: menu → chọn món → tính tiền → tiền thừa.',
    units: [
      {
        id: 'p1-u1',
        title: 'Chương trình đầu tiên',
        topics: 'Máy tính làm gì; chương trình là gì; chạy dòng lệnh đầu tiên',
      },
      {
        id: 'p1-u2',
        title: 'Biến và phép toán',
        topics: 'Biến, kiểu số/chuỗi, phép toán',
        projectStep: 'In menu quán cố định, chào theo tên chủ quán',
      },
      {
        id: 'p1-u3',
        title: 'Nhập / xuất dữ liệu',
        topics: 'Nhập/xuất, f-string, làm tròn',
        projectStep: 'Nhập món + số lượng → tính tiền, tiền thừa',
      },
      {
        id: 'p1-u4',
        title: 'Rẽ nhánh',
        topics: 'if/elif/else, so sánh, boolean — ví dụ tiền điện bậc thang EVN',
        projectStep: 'Giảm giá theo hoá đơn (if bậc thang)',
      },
      { id: 'p1-u5', title: 'Vòng lặp while', topics: 'while — trò đoán số, đếm lần đoán' },
      { id: 'p1-u6', title: 'Vòng lặp for', topics: 'for, range — bảng cửu chương, tiết kiệm' },
      {
        id: 'p1-u7',
        title: 'Lồng nhau',
        topics: 'if trong loop — lọc điểm đậu/rớt',
        projectStep: 'Vòng lặp bán nhiều đơn liên tiếp, tổng doanh thu phiên',
      },
      {
        id: 'p1-u8',
        title: 'Đọc code và tìm lỗi',
        topics: 'Trace code trên giấy, lỗi thường gặp',
      },
      {
        id: 'p1-u9',
        title: 'Số ngẫu nhiên & import',
        topics: 'random, import module đầu tiên — oẳn tù tì với máy',
      },
      {
        id: 'p1-u10',
        title: 'Milestone chặng P1',
        topics: 'Ráp toàn bộ kiến thức bậc',
        projectStep: 'Hoàn thiện máy bán hàng console (milestone P1)',
      },
    ],
  },
  {
    id: 'p2',
    name: 'Nền tảng vững',
    canDo:
      'Hàm, danh sách/chuỗi, dict, file; chia bài toán thành hàm nhỏ; debug bằng đọc lỗi + print.',
    duration: '6–8 tuần',
    languages: ['Python'],
    projectStage: 'Chặng P2 — "Sổ sách tử tế" (hàm, dữ liệu, file)',
    projectMilestone: 'Phần mềm quản lý bán hàng console dùng được thật, dữ liệu bền qua file CSV.',
    units: [
      {
        id: 'p2-u1',
        title: 'Hàm',
        topics: 'def, tham số, return, phạm vi biến',
        projectStep: 'Tách máy tính tiền thành hàm (tinh_tien, in_hoa_don)',
      },
      {
        id: 'p2-u2',
        title: 'Danh sách',
        topics: 'index, slice, thêm/xoá, duyệt',
        projectStep: 'Menu thành list sửa được (thêm/bớt món)',
      },
      {
        id: 'p2-u3',
        title: 'Chuỗi chuyên sâu',
        topics: 'split/join/strip/format — chuẩn hoá họ tên',
      },
      {
        id: 'p2-u4',
        title: 'Dict & tuple',
        topics: 'Sổ điểm: tên → list điểm, trung bình, xếp loại',
        projectStep: 'Món hàng thành dict (tên, giá, tồn kho)',
      },
      { id: 'p2-u5', title: 'Comprehension & sort', topics: 'List comprehension, sort có key' },
      {
        id: 'p2-u6',
        title: 'File & CSV',
        topics: 'Đọc/ghi file text + CSV',
        projectStep: 'Lưu đơn ra CSV, đọc lịch sử, báo cáo doanh thu theo ngày',
      },
      {
        id: 'p2-u7',
        title: 'Xử lý lỗi',
        topics: 'try/except, kiểm dữ liệu nhập',
        projectStep: 'Chống nhập bậy — sổ sách "không thể sập"',
      },
      { id: 'p2-u8', title: 'Module chuẩn', topics: 'datetime, math, random — đếm ngược, lãi kép' },
      {
        id: 'p2-u9',
        title: 'Chia nhiều file',
        topics: 'Nhiều file, hàm main()',
        projectStep: 'Tách 3 file: giao diện / logic / lưu trữ',
      },
      {
        id: 'p2-u10',
        title: 'Milestone chặng P2',
        topics: 'Ráp toàn bộ kiến thức bậc',
        projectStep: 'Hoàn thiện phần mềm quản lý bán hàng console (milestone P2)',
      },
    ],
  },
  {
    id: 'p3',
    name: 'Làm được việc thật',
    canDo:
      'Dự án nhỏ hoàn chỉnh; HTML/CSS/JS nhập môn; SQL cơ bản; Git; tự đọc tài liệu để dùng thư viện mới.',
    duration: '8–10 tuần',
    languages: ['Python', 'HTML/CSS/JS', 'SQL'],
    projectStage: 'Chặng P3 — "Lên web" (HTML/CSS/JS + SQL + Git)',
    projectMilestone: 'Web tĩnh của cửa hàng chạy được + kho dữ liệu SQL + repo GitHub công khai.',
    units: [
      {
        id: 'p3-u1',
        title: 'Thư viện ngoài',
        topics: 'pip, đọc tài liệu — requests lấy tỷ giá/thời tiết',
      },
      {
        id: 'p3-u2',
        title: 'JSON',
        topics: 'Đọc/ghi/lồng nhau',
        projectStep: 'Lưu dữ liệu quán bằng JSON',
      },
      { id: 'p3-u3', title: 'Dữ liệu bảng', topics: 'csv → pandas mức dùng được, vẽ 1 biểu đồ' },
      {
        id: 'p3-u4',
        title: 'HTML',
        topics: 'Cấu trúc trang, thẻ, form',
        projectStep: 'Trang giới thiệu cửa hàng',
      },
      {
        id: 'p3-u5',
        title: 'CSS',
        topics: 'Box model, flex, responsive mobile-first',
        projectStep: 'Làm đẹp trang cửa hàng, xem tốt trên điện thoại',
      },
      {
        id: 'p3-u6',
        title: 'JavaScript & DOM',
        topics: 'DOM, sự kiện, thao tác trang',
        projectStep: 'Trang đặt hàng chạy JS, giỏ hàng localStorage',
      },
      {
        id: 'p3-u7',
        title: 'Fetch API',
        topics: 'fetch, render danh sách — tra thời tiết 63 tỉnh',
      },
      {
        id: 'p3-u8',
        title: 'SQL cơ bản',
        topics: 'SELECT/WHERE/ORDER/LIMIT trên SQLite',
        projectStep: 'Chuyển kho dữ liệu CSV → SQLite',
      },
      {
        id: 'p3-u9',
        title: 'SQL nâng cao',
        topics: 'JOIN, GROUP BY, INSERT/UPDATE/DELETE',
        projectStep: 'Báo cáo doanh thu theo tháng/món từ nhiều bảng',
      },
      {
        id: 'p3-u10',
        title: 'Git & GitHub',
        topics: 'commit/branch/merge, README',
        projectStep: 'Đưa toàn bộ dự án lên GitHub',
      },
      { id: 'p3-u11', title: 'Công cụ dev', topics: 'Dòng lệnh, môi trường ảo, cấu trúc dự án' },
      {
        id: 'p3-u12',
        title: 'Milestone chặng P3',
        topics: 'Ráp toàn bộ kiến thức bậc',
        projectStep: 'Hoàn thiện web cửa hàng + kho SQL + repo GitHub (milestone P3)',
      },
    ],
  },
  {
    id: 'p4',
    name: 'Lập trình có cấu trúc lớn',
    canDo: 'OOP, module hoá, xử lý lỗi chuẩn, test tự động, gọi/dựng API HTTP, TypeScript cơ bản.',
    duration: '10–12 tuần',
    languages: ['Python', 'TypeScript'],
    projectStage: 'Chặng P4 — "Có xương sống" (OOP, API, test, TypeScript)',
    projectMilestone:
      'Full-stack mini chạy local: backend API + frontend + test + Git history sạch.',
    units: [
      {
        id: 'p4-u1',
        title: 'OOP căn bản',
        topics: 'class, thuộc tính/phương thức',
        projectStep: 'Mô hình hoá lại cửa hàng bằng class (Order, Menu)',
      },
      { id: 'p4-u2', title: 'OOP kế thừa', topics: 'Kế thừa, khi nào KHÔNG dùng OOP' },
      {
        id: 'p4-u3',
        title: 'Refactor có kỷ luật',
        topics: 'Refactor code cũ của chính mình theo lát nhỏ chạy được',
        projectStep: 'Refactor trọn phần lõi (Inventory, Report)',
      },
      {
        id: 'p4-u4',
        title: 'Lỗi & logging',
        topics: 'Exception tự định nghĩa, logging',
        projectStep: 'Thêm log + lỗi nghiệp vụ rõ ràng',
      },
      { id: 'p4-u5', title: 'Test tự động 1', topics: 'pytest, nghĩ ca biên trước' },
      {
        id: 'p4-u6',
        title: 'Test tự động 2',
        topics: 'Test logic tiền/kho',
        projectStep: 'Viết test cho tính tiền — bắt lỗi ca biên giảm giá, âm kho',
      },
      { id: 'p4-u7', title: 'HTTP & REST', topics: 'request/response, REST, JSON API' },
      {
        id: 'p4-u8',
        title: 'Backend nhỏ 1',
        topics: 'FastAPI mức khái niệm',
        projectStep: 'API CRUD cho món hàng + đơn (SQLite)',
      },
      {
        id: 'p4-u9',
        title: 'Backend nhỏ 2',
        topics: 'Nối frontend với backend',
        projectStep: 'Trang đặt hàng fetch API thay localStorage',
      },
      {
        id: 'p4-u10',
        title: 'TypeScript 1',
        topics: 'type, interface — vì sao type cứu dự án lớn',
      },
      {
        id: 'p4-u11',
        title: 'TypeScript 2',
        topics: 'generic cơ bản',
        projectStep: 'Port phần JS của cửa hàng sang TS, để type bắt lỗi thật',
      },
      {
        id: 'p4-u12',
        title: 'Milestone chặng P4',
        topics: 'Ráp toàn bộ kiến thức bậc',
        projectStep: 'Hoàn thiện full-stack mini chạy local (milestone P4)',
      },
    ],
  },
  {
    id: 'p5',
    name: 'Kỹ sư tập sự',
    canDo:
      'CTDL & giải thuật nền (big-O, tìm kiếm/sắp xếp, cây/đồ thị cơ bản), thiết kế schema CSDL, dự án full-stack có deploy.',
    duration: '12–16 tuần',
    languages: ['Python', 'TypeScript', 'SQL'],
    projectStage: 'Chặng P5 — "Ra Internet" (capstone)',
    projectMilestone:
      'HOÀN THÀNH MÔN: sản phẩm chạy thật trên Internet + repo GitHub đầy đủ lịch sử từ P1.',
    units: [
      { id: 'p5-u1', title: 'Big-O trực quan', topics: 'Đo thời gian thật, so độ phức tạp' },
      {
        id: 'p5-u2',
        title: 'Tìm kiếm & sắp xếp',
        topics: 'Tìm kiếm nhị phân, các thuật toán sort',
      },
      { id: 'p5-u3', title: 'CTDL nền', topics: 'stack/queue, hash, đệ quy' },
      { id: 'p5-u4', title: 'Cây & đồ thị', topics: 'Cây, đồ thị cơ bản' },
      {
        id: 'p5-u5',
        title: 'Thiết kế CSDL',
        topics: 'Chuẩn hoá, index, transaction',
        projectStep: 'Thiết kế lại schema tử tế, transaction cho đơn hàng',
      },
      {
        id: 'p5-u6',
        title: 'Bảo mật nhập môn',
        topics: 'OWASP top 3: injection/XSS/auth',
        projectStep: 'Đăng nhập chủ quán (hash mật khẩu, session)',
      },
      {
        id: 'p5-u7',
        title: 'Hiệu năng',
        topics: 'Tìm và sửa điểm chậm',
        projectStep: 'Đo và sửa 1 điểm chậm: báo cáo trên 10.000 đơn',
      },
      {
        id: 'p5-u8',
        title: 'Deploy',
        topics: 'Free-tier, biến môi trường, HTTPS',
        projectStep: 'Deploy cửa hàng lên Internet thật',
      },
      {
        id: 'p5-u9',
        title: 'Milestone chặng P5',
        topics: 'Hoàn thiện + kể lại hành trình',
        projectStep: 'Trang "Về dự án" + nộp URL sản phẩm sống (milestone P5 = hoàn thành môn)',
      },
    ],
  },
  {
    id: 'p6',
    name: 'Chuyên sâu',
    canDo:
      'Chọn MỘT trong 14 hướng chuyên sâu (web, di động, backend, dữ liệu, AI, DevOps, bảo mật, hệ thống, game, nhúng, desktop, kiến trúc, thuật toán, toán học cho lập trình) và đi hết 4 chặng của hướng đó tới mức chuyên gia.',
    duration: 'Mở — mỗi hướng 8–18 tháng',
    languages: ['Tuỳ hướng đã chọn'],
    projectStage: 'Hướng chuyên sâu tự chọn — xem `specializations/registry.ts`',
    projectMilestone: 'Sản phẩm tốt nghiệp (capstone) của hướng đã chọn, đủ làm bằng chứng nghề.',
    // 4 unit dưới đây là các unit DẪN NHẬP mở đầu bốn hướng phổ biến nhất. Nội dung đầy đủ của
    // cả 14 hướng nằm ở `specializations/` (mỗi hướng 4 chặng × module + 5 dự án) — đó mới là
    // nguồn thi hành, các unit này chỉ là cửa vào trong dòng bài học tuần tự.
    units: [
      {
        id: 'p6-u1',
        title: 'Dẫn nhập hướng AI',
        topics: 'Python: gọi LLM API, RAG cơ bản',
        track: 'dan-nhap',
      },
      {
        id: 'p6-u2',
        title: 'Dẫn nhập hướng backend/cloud',
        topics: 'Go: goroutine, Docker, CI/CD',
        track: 'dan-nhap',
      },
      {
        id: 'p6-u3',
        title: 'Dẫn nhập hướng hệ thống',
        topics: 'C nền tảng bộ nhớ → Rust ownership',
        track: 'dan-nhap',
      },
      {
        id: 'p6-u4',
        title: 'Dẫn nhập hướng thuật toán',
        topics: 'Luyện đề có Socratic hints',
        track: 'dan-nhap',
      },
      // u5–u7: track KOTLIN của CHƯƠNG TRÌNH M (PR-M8/M9). Sản phẩm trục nhỏ "Sổ chi tiêu"
      // tích luỹ qua ba unit: model dữ liệu → null safety + collections → sealed class.
      // Chạy trên bộ chạy rút gọn `kotlinSim` (không phải kotlinc) — xem luật tự khai §3.3.
      {
        id: 'p6-u5',
        title: 'Kotlin nhập môn — model dữ liệu',
        topics: 'val/var, kiểu suy ra, chuỗi mẫu; hàm, when; data class · Dự án: Sổ chi tiêu',
        track: 'kotlin',
      },
      {
        id: 'p6-u6',
        title: 'Kotlin — null safety và collections',
        topics: 'T?, ?., ?:, !!, smart cast, toIntOrNull; lambda, filter/sumOf/groupBy',
        track: 'kotlin',
      },
      {
        id: 'p6-u7',
        title: 'Kotlin — sealed class và trạng thái',
        topics: 'sealed class, object vs data class, when is · Dự án khép track: Sổ chi tiêu',
        track: 'kotlin',
      },
      // u13–u15: track PARADIGM của CHƯƠNG TRÌNH M (PR-M10/M11). Tầng 3 KHÔNG thêm ngôn ngữ —
      // dạy bằng Python đã có bộ chạy, mở theo CÁCH NGHĨ. Ba trụ F/C/S.
      {
        id: 'p6-u13',
        title: 'Paradigm F — Lập trình hàm',
        topics: 'Hàm thuần, bất biến, map/filter/reduce · Dự án: tách lõi thuần khỏi vỏ hiệu ứng',
        track: 'paradigm',
      },
      {
        id: 'p6-u14',
        title: 'Paradigm C — Đồng thời & phân tán',
        topics: 'Xen kẽ tất định, tranh chấp, khoá, deadlock; idempotency, at-least-once, backoff',
        track: 'paradigm',
      },
      {
        id: 'p6-u15',
        title: 'Paradigm S — Thiết kế hệ thống & tư duy kỹ sư',
        topics:
          'Ước lượng số lớn, cache/hàng đợi/phân mảnh, quan sát được · Dự án: phân tích sự cố thật + post-mortem',
        track: 'paradigm',
      },
      // Từ u16 trở đi là NỘI DUNG HỌC THẬT của các hướng chuyên sâu (bản đồ hướng ở
      // `specializations/`). Dải u5…u15 đã được CHƯƠNG TRÌNH M giữ chỗ (Kotlin · Swift ·
      // paradigm), nên nội dung hướng bắt đầu từ u16 để hai dòng việc không tranh mã unit.
      {
        id: 'p6-u16',
        title: 'Web S1 — trình duyệt làm gì & bố cục hiện đại',
        topics: 'Event loop, long task; Grid vs Flex, mobile-first, design token',
      },
      {
        id: 'p6-u17',
        title: 'Web S1 — UI là hàm của state, TypeScript cho giao diện',
        topics: 'State là nguồn sự thật; union phân biệt 4 trạng thái; không tin `as`',
      },
      {
        id: 'p6-u18',
        title: 'Web S1 — accessibility nhập môn',
        topics: 'Bàn phím đi hết luồng, focus thấy được; 4 trạng thái màn hình, aria-live',
      },
      {
        id: 'p6-u19',
        title: 'Kiến trúc S1 — module có ranh giới & luật phụ thuộc',
        topics: 'Trách nhiệm duy nhất đo được; phụ thuộc một chiều, đảo phụ thuộc, vòng',
      },
      {
        id: 'p6-u20',
        title: 'Kiến trúc S1 — vẽ bản đồ & đọc hệ thống người khác',
        topics: 'C4 bốn tầng, bản đồ kiểm được bằng máy; điểm nóng fan-in, dò vòng bóc lá',
      },
      {
        id: 'p6-u21',
        title: 'Kiến trúc S1 — đặc tả kín & sổ quyết định ADR',
        topics: 'Sáu ô bắt buộc, tiêu chí đo được; ADR có phương án bị loại, điều kiện xem lại',
      },
      // Từ u22 trở đi là chặng S4 (bậc chuyên gia) của các hướng — đặc tả:
      // `docs/specs/2026-08-27-chang-s4-13-huong.md` (dải u22…u60, 3 unit mỗi hướng).
      {
        id: 'p6-u22',
        title: 'Web S4 — thời gian thực: thứ tự, gửi lại, presence',
        topics: 'Hoà giải gói tin theo seq, lũy đẳng khi gửi lại; presence bằng dấu vết sống',
      },
      {
        id: 'p6-u23',
        title: 'Web S4 — offline: chọn chiến lược cache, đồng bộ khi có mạng lại',
        topics: 'Cache-first/network-first/SWR theo rủi ro; hàng đợi ghi, LWW tất định',
      },
      {
        id: 'p6-u24',
        title: 'Web S4 — vận hành: đọc p95, cảnh báo theo triệu chứng người dùng',
        topics: 'Log/metric/trace; phân vị nearest-rank; SLO, ngân sách lỗi, tốc độ tiêu',
      },
      // Từ u61 trở đi là chặng S1 của 11 hướng CÒN LẠI (web và architecture đã có ở u16…u21).
      // Đặc tả S4 chiếm trọn u22…u60 mà quên chừa chỗ cho S1 của 11 hướng này — vá ở
      // `docs/specs/2026-08-27-dai-ma-unit-s1-cac-huong-con-lai.md`.
      {
        id: 'p6-u61',
        title: 'Backend S1 — HTTP đúng nghĩa: mã trạng thái & phân trang',
        topics: 'Chọn mã theo ai-phải-sửa; 401≠403, 409/422; con trỏ thay offset',
      },
      {
        id: 'p6-u62',
        title: 'Backend S1 — đúng đắn dữ liệu: kiểm ở biên & lũy đẳng',
        topics: 'Kiểu tĩnh không cứu lúc chạy; bỏ trường lạ; khoá lũy đẳng, tiền số nguyên',
      },
      {
        id: 'p6-u63',
        title: 'Backend S1 — vận hành: ba nhóm lỗi, log lần ra được, tắt êm',
        topics: 'Ai bị đánh thức; log có cấu trúc + mã yêu cầu, che dữ liệu nhạy cảm; tắt êm',
      },
      // p6-u64/u65 khép nốt chặng S1 của hướng AI: p6-u1 (đã có từ trước, module gọi mô hình
      // + RAG) chỉ phủ 2/4 module của ai-s1 (specializations/ai.ts) — thiếu "Đánh giá tự động"
      // và "An toàn và chi phí". Đăng ký cầu nối ở `specializations/stageUnits.ts`.
      {
        id: 'p6-u64',
        title: 'AI S1 — đánh giá tự động: bộ vàng, recall@k, chặn hồi quy trong CI',
        topics: 'Bộ dữ liệu vàng, recall@k của khâu truy hồi; cổng so baseline, DAT/HONG',
      },
      {
        id: 'p6-u65',
        title: 'AI S1 — an toàn & chi phí: định tuyến model, tiêm lệnh',
        topics: 'Chọn model theo độ khó, đếm lượt theo gói; nhận diện tiêm lệnh (prompt injection)',
      },
      // u94…u101 là 4 CHẶNG RIÊNG CỦA LỘ TRÌNH "Kỹ Sư Trưởng AI" (principal-s1…s4, giai đoạn
      // P5 "Tầm trưởng") — không phải hướng chuyên sâu thứ 15, xem
      // `packages/subject-programming/learningPaths/pathStages.ts`. Đặc tả:
      // `docs/specs/2026-08-31-dot-4-p5-tam-truong.md`. Dải để dành cho S2/S3 của 11 hướng
      // (từng ghi `u94 trở đi` ở đặc tả `dai-ma-unit-s1-cac-huong-con-lai.md`) dời xuống u102+.
      {
        id: 'p6-u94',
        title: 'Tầm trưởng S1 — đặc tả giao việc cho AI',
        topics: '6 ô bắt buộc của đặc tả; tiêu chí chấp nhận đo được vs mơ hồ',
      },
      {
        id: 'p6-u95',
        title: 'Tầm trưởng S1 — eval & ngân sách chi phí',
        topics: 'Recall/precision trên bộ ca vàng; ước lượng token, cache prompt, điểm hoà vốn',
      },
      {
        id: 'p6-u96',
        title: 'Tầm trưởng S2 — vòng lặp agent tối giản',
        topics: 'Bảng tool + dispatch theo tên; vòng lặp nhiều bước có điều kiện dừng, log',
      },
      {
        id: 'p6-u97',
        title: 'Tầm trưởng S2 — tool-use an toàn & MCP',
        topics: 'Validate tham số, allowlist; MCP là hợp đồng liệt kê/gọi tool chuẩn hoá',
      },
      {
        id: 'p6-u98',
        title: 'Tầm trưởng S3 — ADR & build vs buy',
        topics: 'Khuôn 5 phần của ADR; điểm hoà vốn tự vận hành vs thuê API',
      },
      {
        id: 'p6-u99',
        title: 'Tầm trưởng S3 — RAG vs fine-tune, chọn model theo chi phí',
        topics: 'Chọn theo tần suất đổi dữ liệu; loại phương án bị áp đảo, đường biên hiệu quả',
      },
      {
        id: 'p6-u100',
        title: 'Tầm trưởng S4 — review công việc AI',
        topics: 'Checklist 5 điểm; đọc diff theo thứ tự rủi ro',
      },
      {
        id: 'p6-u101',
        title: 'Tầm trưởng S4 — post-mortem & trách nhiệm vận hành',
        topics: '5 whys không đổ lỗi; sự cố AI hỏng âm thầm, ngưỡng cảnh báo',
      },
      // p6-u102…u104: chặng S2 của hướng Backend (backend-s2, specializations/backend.ts,
      // 4 module). Dải p6-u94…u101 đã bị lộ trình "Kỹ Sư Trưởng AI" lấy trước cùng ngày, nên
      // S2 của backend dùng dải TIẾP THEO còn trống (p6-u102 trở đi) thay vì p6-u94 như kế
      // hoạch cũ đã ghi trong dac-ta-dai-ma-unit-s1-cac-huong-con-lai.md.
      {
        id: 'p6-u102',
        title: 'Backend S2 — CSDL quan hệ chuyên sâu: lost update & composite index',
        topics: 'Khoá lạc quan (version) chống lost update; quy tắc tiền tố của composite index',
      },
      {
        id: 'p6-u103',
        title: 'Backend S2 — cache: cache-aside, TTL, cache stampede',
        topics: 'Đọc/ghi cache-aside, làm mất hiệu lực đúng lúc; chặn stampede bằng khoá/jitter',
      },
      {
        id: 'p6-u104',
        title: 'Backend S2 — hàng đợi idempotent & race condition',
        topics: 'At-least-once buộc idempotent, dead letter queue; race condition tái hiện được',
      },
      // p6-u105…u107: chặng S3 "Hệ phân tán" của hướng Backend (backend-s3,
      // specializations/backend.ts, 4 module).
      {
        id: 'p6-u105',
        title: 'Backend S3 — nền tảng: sharding & gọi mạng khác gọi hàm',
        topics: 'Sharding modulo xáo trộn khi thêm máy; timeout là KHÔNG BIẾT, không phải lỗi',
      },
      {
        id: 'p6-u106',
        title: 'Backend S3 — giao tiếp giữa dịch vụ: outbox & saga',
        topics: 'Outbox pattern chống mất sự kiện; saga bù trừ cho giao dịch nhiều dịch vụ',
      },
      {
        id: 'p6-u107',
        title: 'Backend S3 — chịu lỗi & quan sát: circuit breaker, error budget',
        topics: 'Circuit breaker 3 trạng thái chặn dồn tải; SLO và ngân sách lỗi còn lại',
      },
      // p6-u108…u110: chặng S4 "Chuyên gia — quy mô lớn và trách nhiệm vận hành" của hướng
      // Backend (backend-s4, specializations/backend.ts, 4 module).
      {
        id: 'p6-u108',
        title: 'Backend S4 — thiết kế quy mô: ước lượng dung lượng, độ trễ đa vùng',
        topics: 'QPS trung bình/đỉnh, dung lượng lưu trữ; RTT theo tốc độ ánh sáng trong sợi quang',
      },
      {
        id: 'p6-u109',
        title: 'Backend S4 — lưu trữ chuyên biệt: chọn kho dữ liệu, LSM vs B-tree',
        topics: 'Chọn loại kho theo mẫu truy vấn; đánh đổi ghi nhanh (LSM) vs đọc nhanh (B-tree)',
      },
      {
        id: 'p6-u110',
        title: 'Backend S4 — bảo mật & vận hành: đặc quyền tối thiểu, phân loại sự cố',
        topics: 'Phân quyền deny-by-default; phân loại mức độ sự cố + quy trình leo thang',
      },
      // p6-u111…u113: chặng S2 "Full-stack — có backend của mình" của hướng Web
      // (web-s2, specializations/web.ts, 5 module).
      {
        id: 'p6-u111',
        title: 'Web S2 — API HTTP tử tế: mã trạng thái, phân trang, idempotency',
        topics: 'Chọn đúng mã trạng thái theo hành động/kết quả; phân trang; Idempotency-Key',
      },
      {
        id: 'p6-u112',
        title: 'Web S2 — CSDL & xác thực: toàn vẹn tham chiếu, session vs JWT',
        topics: 'Kiểm khoá ngoại trước khi ghi; so khớp mật khẩu đã băm; chọn session hay JWT',
      },
      {
        id: 'p6-u113',
        title: 'Web S2 — tải dữ liệu & deploy: race condition, biến môi trường',
        topics: 'Huỷ phản hồi cũ khi gõ tìm kiếm; kiểm biến môi trường & thứ tự migration',
      },
      // p6-u114…u116: chặng S3 "Nâng cao — hiệu năng, kiến trúc, chất lượng" của hướng Web
      // (web-s3, specializations/web.ts, 5 module).
      {
        id: 'p6-u114',
        title: 'Web S3 — hiệu năng đo bằng số: Core Web Vitals, ngân sách bundle',
        topics: 'Phân loại LCP/INP/CLS theo ba ngưỡng chuẩn; chặn CI khi bundle vượt ngân sách',
      },
      {
        id: 'p6-u115',
        title: 'Web S3 — kiến trúc & render: SSR/SSG/CSR, ranh giới module',
        topics: 'Chọn chiến lược render theo loại trang; kiểm vi phạm luật phụ thuộc module',
      },
      {
        id: 'p6-u116',
        title: 'Web S3 — kiểm thử & bảo mật: kim tự tháp test, XSS/CSRF/rate limit',
        topics: 'Tỉ lệ unit/integration/E2E khoẻ mạnh; phân loại lỗ hổng; giới hạn tốc độ gọi',
      },
      // p6-u117…u119: chặng S2 "Hợp đồng & mô hình miền" của hướng Kiến trúc
      // (architecture-s2, specializations/architecture.ts, 4 module — u119 gộp m3+m4).
      {
        id: 'p6-u117',
        title: 'Kiến trúc S2 — mô hình hoá miền: ngôn ngữ chung, ngữ cảnh giới hạn',
        topics: 'Cùng chữ "đơn hàng" hai nghĩa ở kho và kế toán; thực thể vs giá trị; bất biến',
      },
      {
        id: 'p6-u118',
        title: 'Kiến trúc S2 — hợp đồng kiểm được: schema lúc chạy, union phân biệt',
        topics: 'Kiểu bốc hơi lúc chạy nên phải kiểm ở biên; trạng thái sai bất khả biểu diễn',
      },
      {
        id: 'p6-u119',
        title: 'Kiến trúc S2 — tiến hoá & dữ liệu: mở rộng rồi thu hẹp, tiền/thời gian/mã',
        topics: 'Bốn bước đổi schema không downtime; nguồn sự thật duy nhất; ba chỗ sai đắt nhất',
      },
      // p6-u120…u122: chặng S2 "Kỹ sư dữ liệu — đường ống" của hướng Dữ liệu (data-s2,
      // specializations/data.ts, 4 module).
      {
        id: 'p6-u120',
        title: 'Dữ liệu S2 — ETL/ELT: nạp gia tăng theo mốc nước, ghi idempotent',
        topics: 'Mốc nước + chồng lấn chống mất bản ghi tới muộn; upsert/ghi lại phân vùng',
      },
      {
        id: 'p6-u121',
        title: 'Dữ liệu S2 — mô hình hoá kho: star schema và chiều biến đổi chậm',
        topics: 'Bảng sự kiện vs bảng chiều, hạt và khoá thay thế; SCD type 1 vs type 2',
      },
      {
        id: 'p6-u122',
        title: 'Dữ liệu S2 — điều phối & chất lượng: DAG, chạy lại một phần, kiểm chặn',
        topics: 'Sắp xếp tô-pô + phạm vi chạy lại xuôi dòng; 4 nhóm kiểm, khớp tổng, lineage',
      },
      // p6-u123…u125: chặng S3 "Đặc tả thi hành được & nghiệm thu code mình không tự gõ" của
      // hướng Kiến trúc (architecture-s3, specializations/architecture.ts, 4 module —
      // u125 gộp m3+m4).
      {
        id: 'p6-u123',
        title: 'Kiến trúc S3 — đặc tả kín: sáu ô bắt buộc, tiêu chí chấp nhận đo được',
        topics:
          'Đọc xong không phải hỏi lại câu nào; viết tiêu chí trước mô tả giải pháp; chia lát',
      },
      {
        id: 'p6-u124',
        title: 'Kiến trúc S3 — giao việc cho AI/người mới: brief tự chứa, chống ảo giác',
        topics:
          'Bên thi hành không thấy ngữ cảnh trước; chọn độ tự quyết; đòi dẫn nguồn, cấm phình',
      },
      {
        id: 'p6-u125',
        title: 'Kiến trúc S3 — nghiệm thu & sổ quyết định: test canh gác, review theo tầng, ADR',
        topics: 'Bất biến bị phá là CI đỏ; bốn tầng review; ADR ghi cả phương án bị loại',
      },
      // p6-u126…u128: chặng S3 "Quy mô và thời gian thực" của hướng Dữ liệu (data-s3,
      // specializations/data.ts, 4 module — u128 gộp m3+m4).
      {
        id: 'p6-u126',
        title: 'Dữ liệu S3 — lớn hơn RAM: xử lý theo khối và sắp xếp ngoài',
        topics: 'Đỉnh bộ nhớ hằng số, phép tổng hợp cộng dồn được; tạo run rồi trộn nhiều đường',
      },
      {
        id: 'p6-u127',
        title: 'Dữ liệu S3 — luồng gần thời gian thực: cửa sổ, mốc nước, sự kiện tới muộn',
        topics: 'Thời gian sự kiện vs thời gian xử lý; watermark chốt cửa sổ; khử trùng theo id',
      },
      {
        id: 'p6-u128',
        title: 'Dữ liệu S3 — chi phí & thực nghiệm: quét ít đi, đo cho đáng tin',
        topics: 'Cắt tỉa phân vùng, định dạng cột, vòng đời dữ liệu; cỡ mẫu và bẫy dừng sớm',
      },
      // p6-u131…u133: chặng S1 "App đầu tiên trên máy thật" của hướng DI ĐỘNG (mobile-s1,
      // specializations/mobile.ts, 4 module — u133 gộp m3+m4). Đây là chặng ĐẦU TIÊN của hướng
      // Di động có bài học thật. Dải u129/u130 bỏ trống có chủ đích: các đợt soạn bài chạy song
      // song nhau nên số unit được cấp cách quãng để không đụng nhau.
      {
        id: 'p6-u131',
        title: 'Di động S1 — vòng đời app: hệ điều hành giết app lúc nào cũng được',
        topics: 'Bốn trạng thái foreground/background/bị giết; hien→nen là cơ hội ghi cuối cùng',
      },
      {
        id: 'p6-u132',
        title: 'Di động S1 — giao diện khai báo: UI là hàm của state, danh sách phải ảo hoá',
        topics: 'Bốn trạng thái màn hình theo thứ tự ưu tiên; cửa sổ ảo hoá và kẹp biên hai đầu',
      },
      {
        id: 'p6-u133',
        title: 'Di động S1 — điều hướng & lưu trữ: ngăn xếp màn, deep link, migration',
        topics: 'push/pop/replace/popToRoot, deep link dựng lại cả ngăn xếp; migration từng bậc',
      },
      // p6-u134…u137: chặng S1 "Nền tảng rời rạc cho lập trình viên" của hướng Toán học
      // cho Lập trình (mathforcode-s1). Mỗi unit phủ đúng một module vì bốn cơ chế có ca biên
      // và bằng chứng độc lập; đặc tả: docs/specs/2026-09-16-mathforcode-s1-bai-hoc-that.md.
      {
        id: 'p6-u134',
        title: 'Toán cho Lập trình S1 — số trong máy: nhị phân, bù 2 và sai số dấu phẩy động',
        topics: 'Biểu diễn có số bit tường minh; miền số có dấu; epsilon và math.isclose',
      },
      {
        id: 'p6-u135',
        title: 'Toán cho Lập trình S1 — logic Boolean: De Morgan, ngắn mạch và bit mask',
        topics: 'Bảng chân trị chứng minh tương đương; bật/tắt/kiểm cờ không phá cờ khác',
      },
      {
        id: 'p6-u136',
        title: 'Toán cho Lập trình S1 — modulo: chỉ số vòng và mã kiểm tra',
        topics: 'Wrap-around với bước âm; buffer vòng; Luhn và phát hiện lỗi nhập liệu',
      },
      {
        id: 'p6-u137',
        title: 'Toán cho Lập trình S1 — đếm phép tính và Big-O bằng số đo',
        topics: 'Tổng tam giác, chia đôi logarit; đối chiếu công thức với bộ đếm thật',
      },
      // p6-u138…u141: chặng S2 "Tổ hợp và xác suất cho lập trình viên".
      {
        id: 'p6-u138',
        title: 'Toán cho Lập trình S2 — phép đếm, hoán vị và tổ hợp',
        topics: 'Quy tắc cộng/nhân; kích thước vét cạn; tổ hợp Pascal',
      },
      {
        id: 'p6-u139',
        title: 'Toán cho Lập trình S2 — xác suất, kỳ vọng và A/B',
        topics: 'Xác suất có điều kiện; va chạm; kỳ vọng và nhiễu lấy mẫu',
      },
      {
        id: 'p6-u140',
        title: 'Toán cho Lập trình S2 — giả ngẫu nhiên có thể tái hiện',
        topics: 'LCG, seed, chu kỳ và Fisher–Yates không thiên lệch',
      },
      {
        id: 'p6-u141',
        title: 'Toán cho Lập trình S2 — thống kê đo hiệu năng',
        topics: 'Trung bình, trung vị, phương sai và p50/p95/p99',
      },
      // p6-u142…u145: chặng S1 "Nền tảng và độ phức tạp" của hướng Thuật toán.
      {
        id: 'p6-u142',
        title: 'Thuật toán S1 — độ phức tạp và chi phí khấu hao',
        topics: 'Đọc ràng buộc; đếm phép tính; Big-O; mảng động tăng gấp đôi',
      },
      {
        id: 'p6-u143',
        title: 'Thuật toán S1 — cấu trúc dữ liệu tuyến tính và bảng băm',
        topics: 'Stack, queue, deque; chaining và va chạm bảng băm',
      },
      {
        id: 'p6-u144',
        title: 'Thuật toán S1 — hai con trỏ, cửa sổ, prefix và tìm kiếm nhị phân',
        topics: 'Vét cạn–tối ưu; tổng đoạn; hàm khả thi đơn điệu và lỗi biên',
      },
      {
        id: 'p6-u145',
        title: 'Thuật toán S1 — oracle, ca biên và differential test có seed',
        topics: 'Ca biên; oracle đơn giản; random.Random(seed); negative control',
      },
      // p6-u146…u149: chặng S1 "Bộ nhớ và C" của hướng Hệ thống. Các bài dùng Python để
      // mô phỏng minh bạch vì runtime chưa có lane C; artifact C thật vẫn ở rubric ngoài sandbox.
      {
        id: 'p6-u146',
        title: 'Hệ thống S1 — vùng nhớ, lifetime, byte và căn chỉnh',
        topics: 'Text/data/stack/heap; dangling pointer; endianness; ABI đồ chơi',
      },
      {
        id: 'p6-u147',
        title: 'Hệ thống S1 — ownership, cấp phát và chuỗi kết thúc NUL',
        topics: 'Alloc/free ledger; leak/double-free; bytearray và copy có giới hạn',
      },
      {
        id: 'p6-u148',
        title: 'Hệ thống S1 — debug và sanitizer qua mô phỏng có cấu trúc',
        topics: 'Call stack, breakpoint, backtrace; OOB, UAF, double-free và leak',
      },
      {
        id: 'p6-u149',
        title: 'Hệ thống S1 — build, link và assembly đồ chơi',
        topics: 'Pipeline biên dịch; symbol/dependency graph; ISA LOAD/ADD/MUL/RET',
      },
      // p6-u150…u153: chặng S2 "Hệ điều hành nhìn từ chương trình". Python chỉ mô phỏng
      // state machine; project shell, socket và Rust thật vẫn được nghiệm thu ngoài sandbox.
      {
        id: 'p6-u150',
        title: 'Hệ thống S2 — tiến trình, luồng và đồng bộ',
        topics: 'fork/exec/wait; zombie; race, mutex, condition và deadlock',
      },
      {
        id: 'p6-u151',
        title: 'Hệ thống S2 — file descriptor, pipe và độ bền dữ liệu',
        topics: 'Redirect, EOF, partial I/O; fsync, rename, mmap và page',
      },
      {
        id: 'p6-u152',
        title: 'Hệ thống S2 — đóng khung gói tin TCP và vòng lặp sự kiện',
        topics:
          'Tiền tố độ dài khung; đọc/ghi không chặn theo tín hiệu sẵn sàng, chia lượt công bằng và chống dồn tải',
      },
      {
        id: 'p6-u153',
        title: 'Hệ thống S2 — quyền sở hữu và hợp đồng an toàn của Rust',
        topics:
          'Chuyển quyền (move), mượn (borrow), vòng đời (lifetime); Option/Result và ranh giới unsafe',
      },
      // p6-u154…u157: DevOps S1. Python chỉ mô phỏng policy/state machine; Linux/VPS,
      // TLS và backup/restore thật vẫn là artifact có evidence ngoài sandbox.
      {
        id: 'p6-u154',
        title: 'DevOps S1 — dịch vụ Linux, nhật ký hệ thống và phân loại sự cố tài nguyên',
        topics:
          'Chính sách khởi động lại; đọc nhật ký journal; CPU/RAM/đĩa/file descriptor; đặc quyền tối thiểu',
      },
      {
        id: 'p6-u155',
        title: 'DevOps S1 — DNS, TLS, proxy và cổng mở ra Internet',
        topics:
          'Thang chẩn đoán từng bậc; tường lửa chỉ mở cổng cần; reverse proxy; hạn dùng của chứng chỉ',
      },
      {
        id: 'p6-u156',
        title: 'DevOps S1 — tự động hoá dừng sớm khi sai và trạng thái mong muốn',
        topics:
          'Bắt buộc khai đủ cấu hình; thoát khác 0 là hỏng; lũy đẳng; chính sách bí mật và bí mật lọt vào lịch sử Git',
      },
      {
        id: 'p6-u157',
        title: 'DevOps S1 — quy tắc 3-2-1, diễn tập khôi phục, RPO và RTO',
        topics:
          'Bản sao để xa; độ tươi của bản sao lưu; bằng chứng khôi phục được; thời gian phục hồi',
      },
      {
        id: 'p6-u158',
        title: 'Toán cho Lập trình S3 — vector và phép biến đổi',
        topics: 'Tích vô hướng, chuẩn hoá, biến đổi thuần nhất và thứ tự nhân ma trận',
      },
      {
        id: 'p6-u159',
        title: 'Toán cho Lập trình S3 — khử Gauss và lặp luỹ thừa',
        topics: 'Chọn trụ, ma trận suy biến, vector xác suất và sai khác giữa hai vòng lặp',
      },
      {
        id: 'p6-u160',
        title: 'Toán cho Lập trình S4 — gradient, hàm mất mát và hồi quy',
        topics: 'Sai phân hữu hạn, gradient descent, sai số MSE/MAE',
      },
      {
        id: 'p6-u161',
        title: 'Toán cho Lập trình S4 — quy tắc chuỗi và tối ưu có ràng buộc',
        topics: 'Kiểm gradient bằng sai phân; miền khả thi; điều kiện dừng',
      },
      // Bổ sung 2026-10-09 cho đủ 2 bài mỗi module của mathforcode S3/S4 (đặc tả
      // docs/specs/2026-10-09-mathforcode-s3-s4-bo-sung-unit.md). Đặt ngay sau p6-u161 để bốn
      // chặng S3/S4 đứng liền nhau trong danh sách bậc P6; id lấy dải trống p6-u290…u293.
      {
        id: 'p6-u290',
        title: 'Toán cho Lập trình S3 — va chạm, phản xạ và nhân ma trận',
        topics:
          'Phản xạ vận tốc qua pháp tuyến; va chạm hai hình tròn; quy ước hàng-cột; xoay, co giãn, phản chiếu; shape không khớp',
      },
      {
        id: 'p6-u291',
        title: 'Toán cho Lập trình S3 — định thức, cân bằng luồng và chuỗi Markov',
        topics:
          'Ma trận suy biến; quy tắc Cramer; bảo toàn luồng nhiều nút; ma trận chuyển trạng thái; trạng thái dừng',
      },
      {
        id: 'p6-u292',
        title: 'Toán cho Lập trình S4 — descent nhiều biến và hàm không lồi',
        topics:
          'So sánh learning rate bằng bảng loss; cực tiểu địa phương; điểm yên ngựa; cao nguyên',
      },
      {
        id: 'p6-u293',
        title: 'Toán cho Lập trình S4 — lan truyền ngược và tìm kiếm cục bộ',
        topics:
          'Backprop mạng 2 tầng; kiểm gradient từng tham số; hill climbing lập lịch; điều kiện dừng theo ngân sách và ngưỡng',
      },
      {
        id: 'p6-u162',
        title: 'Thuật toán S2 — đệ quy, chứng minh dừng và quay lui',
        topics:
          'Điều kiện cơ sở; đại lượng giảm dần bảo đảm dừng; tìm kiếm có chặn; cắt tỉa và bản giải đối chiếu',
      },
      {
        id: 'p6-u163',
        title: 'Thuật toán S2 — cây tìm kiếm nhị phân, cây tiền tố và hàng đợi ưu tiên',
        topics:
          'BST thoái hoá thành danh sách; tra tiền tố bằng trie; lấy top-k bằng heap; thứ tự tất định',
      },
      {
        id: 'p6-u164',
        title: 'Thuật toán S2 — đồ thị, topo và đường đi ngắn',
        topics: 'Topological sort; cycle; Dijkstra không âm; đường đi không tồn tại',
      },
      {
        id: 'p6-u165',
        title: 'Thuật toán S2 — tham lam, lập luận đổi chỗ và phản ví dụ',
        topics:
          'Xếp lịch đoạn thời gian; đối chiếu bằng vét cạn có chặn; đổi tiền kiểu tham lam; phản ví dụ',
      },
      {
        id: 'p6-u182',
        title: 'Bảo mật S1 — ranh giới tin cậy và đặc quyền tối thiểu',
        topics:
          'Chủ sở hữu tài sản; ranh giới tin cậy; rủi ro chưa biết thì khai là chưa biết; từ chối mặc định theo bộ ba chủ thể–tài nguyên–hành động',
      },
      {
        id: 'p6-u183',
        title: 'Bảo mật S1 — chọn thuật toán mật mã, salt và xoay khoá',
        topics:
          'Băm, mã hoá và chữ ký khác nhau ra sao; chính sách chọn thuật toán; salt cho mật khẩu; xoay vòng khoá',
      },
      {
        id: 'p6-u184',
        title: 'Bảo mật S1 — phân quyền phòng thủ cho API',
        topics:
          'Danh sách cho phép; mã hoá đầu ra theo ngữ cảnh; kiểm quyền trên từng đối tượng ở phía máy chủ',
      },
      {
        id: 'p6-u185',
        title: 'Bảo mật S1 — danh tính và vòng đời phiên đăng nhập',
        topics:
          'Xoay token; hết hạn; thu hồi; giới hạn tốc độ khôi phục tài khoản; xác thực khác phân quyền',
      },
      {
        id: 'p6-u190',
        title: 'Kiến trúc S4 — cổng chất lượng cho yêu cầu phi chức năng',
        topics: 'Độ trễ; độ sẵn sàng; tỉ lệ lỗi; chi phí; ngưỡng đo được, không đạt là chặn',
      },
      {
        id: 'p6-u191',
        title: 'Kiến trúc S4 — di trú kiểu cây bóp cổ',
        topics:
          'Cờ tính năng; chạy song song đối chiếu; ghi kép; tương thích ngược; đường quay lui',
      },
      {
        id: 'p6-u192',
        title: 'Kiến trúc S4 — sức khoẻ kiến trúc',
        topics:
          'Vòng phụ thuộc; điểm nóng; nợ kỹ thuật tính theo thiệt hại và lãi; vi phạm luật phụ thuộc',
      },
      {
        id: 'p6-u193',
        title: 'Kiến trúc S4 — bàn giao bằng ADR thi hành được',
        topics:
          'Bối cảnh; quyết định; phương án bị loại; người chịu trách nhiệm; nghiệm thu; điều kiện xem lại; ranh giới',
      },
      {
        id: 'p6-u194',
        title: 'DevOps S3 — hợp đồng tài nguyên của workload và lập lịch',
        topics:
          'Mức xin và mức trần tài nguyên; thăm dò sẵn sàng; kẹp biên khi tự co giãn; ngân sách gián đoạn',
      },
      {
        id: 'p6-u195',
        title: 'DevOps S3 — cấu hình, bí mật và GitOps',
        topics:
          'Trạng thái mong muốn; trôi cấu hình; hoà giải có chặn số vòng; lớp phủ theo môi trường; tham chiếu tới bí mật',
      },
      {
        id: 'p6-u196',
        title: 'DevOps S3 — metric, log, trace và cảnh báo',
        topics:
          'Bộ chỉ số RED/USE; bùng nổ số nhãn; che dữ liệu cá nhân; cảnh báo theo triệu chứng; span trong trace',
      },
      {
        id: 'p6-u197',
        title: 'DevOps S3 — SLI/SLO, ngân sách lỗi và chaos',
        topics:
          'SLI/SLO; tốc độ tiêu ngân sách lỗi; đóng băng phát hành; giới hạn bán kính ảnh hưởng; điều kiện dừng thí nghiệm',
      },
      {
        id: 'p6-u198',
        title: 'DevOps S4 — nền tảng cho lập trình viên và DORA',
        topics: 'Golden path; khuôn mẫu dịch vụ; cổng tự phục vụ; DORA; mẫu dưới ngưỡng',
      },
      {
        id: 'p6-u199',
        title: 'DevOps S4 — bảo mật chuỗi cung ứng',
        topics: 'SBOM; signature; provenance; digest; xoay vòng bí mật; ưu tiên luật',
      },
      {
        id: 'p6-u200',
        title: 'DevOps S4 — sức chứa và chi phí phục vụ mô hình',
        topics: 'KV cache; quantization; ngân sách GPU; cascade; fallback; cost-per-success',
      },
      {
        id: 'p6-u201',
        title: 'DevOps S4 — đo lường vận hành AI và văn hoá',
        topics: 'TTFT; thời gian giữa token; span; postmortem không đổ lỗi; toil',
      },
      {
        id: 'p6-u202',
        title: 'Dữ liệu S4 — kiến trúc nền tảng dữ liệu: danh mục, snapshot, tiến hoá schema',
        topics:
          'Chủ sở hữu; phân loại dữ liệu; cổng công bố; du hành thời gian; thời hạn lưu; thay đổi phá vỡ',
      },
      {
        id: 'p6-u203',
        title: 'Dữ liệu S4 — độ tin cậy dữ liệu: SLO độ tươi, đầy đủ và tốc độ đốt',
        topics:
          'Độ tươi; độ đầy đủ; 0 dòng khác NULL khác chưa chạy; tốc độ tiêu ngân sách; ngưỡng mẫu',
      },
      {
        id: 'p6-u204',
        title: 'Dữ liệu S4 — tầng chỉ số: một tên một định nghĩa',
        topics: 'Xung đột định nghĩa; phiên bản; hạt dữ liệu; múi giờ; hai con số không so được',
      },
      {
        id: 'p6-u205',
        title: 'Dữ liệu S4 — đạo đức và pháp lý của dữ liệu cá nhân',
        topics:
          'Cơ sở pháp lý; giới hạn mục đích; thời hạn lưu; ngưỡng k; thiên lệch theo nhóm; câu nói rõ giới hạn',
      },
      // p6-u226..u229 = chặng algo-s3, p6-u230..u233 = chặng algo-s4 (hướng Thuật toán, hướng
      // NỀN cắt ngang). Mỗi unit bám đúng một module của chặng. Đặc tả:
      // `docs/specs/2026-09-21-algo-s3-s4-bai-hoc-that.md`.
      {
        id: 'p6-u226',
        title: 'Thuật toán S3 — quy hoạch động: trạng thái, chuyển và giảm chiều bộ nhớ',
        topics: 'Ba lô 0/1 bottom-up; LIS một chiều; oracle vét cạn; off-by-one trạng thái',
      },
      {
        id: 'p6-u227',
        title: 'Thuật toán S3 — chuỗi: KMP, băm hai bộ và khoảng cách chỉnh sửa',
        topics: 'Bảng fail; khớp chồng nhau; băm đa thức tự viết; va chạm cố ý; edit distance',
      },
      {
        id: 'p6-u228',
        title: 'Thuật toán S3 — toán rời rạc: mô-đun, sàng và hình học số nguyên',
        topics: 'Luỹ thừa nhanh; nghịch đảo mô-đun; sàng nguyên tố; tích có hướng số nguyên',
      },
      {
        id: 'p6-u229',
        title: 'Thuật toán S3 — truy vấn khoảng: cây phân đoạn lười và sparse table',
        topics: 'Range-add/range-sum; push-down; RMQ tĩnh; từ chối cập nhật sau build',
      },
      {
        id: 'p6-u230',
        title: 'Thuật toán S4 — cấu trúc xác suất: Bloom filter và tỉ lệ báo nhầm',
        topics: 'Băm tự viết; không âm tính giả; đo nhiều hạt giống; k=1 so với k=3',
      },
      {
        id: 'p6-u231',
        title: 'Thuật toán S4 — NP-khó: heuristic, cận trên và cải thiện cục bộ',
        topics: 'Tham lam theo tỉ suất; cận trên phân số; khai chưa kiểm tối ưu; local search',
      },
      {
        id: 'p6-u232',
        title: 'Thuật toán S4 — bộ nhớ và song song mô phỏng bằng số học',
        topics: 'Đếm đổi khối row/column-major; chia tải k phần; không đồng hồ, không thread',
      },
      {
        id: 'p6-u233',
        title: 'Thuật toán S4 — phỏng vấn và truyền đạt: làm rõ đề, ước lượng, checklist',
        topics: 'Trường bắt buộc có thứ tự; ước lượng dung lượng; giả định/đánh đổi/ví dụ',
      },
      {
        id: 'p6-u242',
        title: 'Game S1 — vòng lặp game: delta time và máy trạng thái nhân vật',
        topics: 'Delta time; bước thời gian chết; bảng chuyển tiếp; nhập liệu trừu tượng',
      },
      {
        id: 'p6-u243',
        title: 'Game S1 — toán cho game: vector chuẩn hoá, AABB, camera',
        topics: 'Chuẩn hoá véc-tơ; AABB; va chạm hình tròn; hệ số nội suy clamp',
      },
      {
        id: 'p6-u244',
        title: 'Game S1 — cảm giác chơi: coyote time và jump buffer',
        topics: 'Coyote time; jump buffer; gia tốc; ma sát; cảm giác mô tả bằng số',
      },
      {
        id: 'p6-u245',
        title: 'Game S1 — tài nguyên và phát hành: atlas và bản lưu có phiên bản',
        topics: 'Ngân sách atlas; bộ rỗng là unknown; migrate bản lưu; phiên bản lạ deny',
      },
      {
        id: 'p6-u246',
        title: 'Game S2 — kiến trúc ECS: lọc theo thành phần và luật ghi',
        topics: 'Thành phần thay kế thừa; bỏ qua entity thiếu; tranh chấp ghi; thứ tự cố định',
      },
      {
        id: 'p6-u247',
        title: 'Game S2 — vật lý bước cố định và phát lại tất định',
        topics: 'Fixed timestep; bộ tích luỹ; trần số bước; hash trạng thái; replay',
      },
      {
        id: 'p6-u248',
        title: 'Game S2 — AI trong game: tầm quan sát và tìm đường A*',
        topics: 'Tầm quan sát; chống AI đọc trộm; A*; heuristic Manhattan; unreachable',
      },
      {
        id: 'p6-u249',
        title: 'Game S2 — nội dung và công cụ: validator màn chơi và hạt giống',
        topics: 'Validator lúc lưu; phiên bản định dạng; random.Random(seed); tái lập',
      },
      {
        id: 'p6-u250',
        title: 'Game S3 — đường ống dựng hình: gộp lô draw call và thứ tự vẽ',
        topics: 'Draw call; gộp lô giữ nguyên hình; đục trước trong suốt sau; xa tới gần',
      },
      {
        id: 'p6-u251',
        title: 'Game S3 — shader: ngân sách mili-giây và loại biến',
        topics: 'Ngân sách riêng; tổng vượt khung; uniform vs theo đỉnh; không viết shader thật',
      },
      {
        id: 'p6-u252',
        title: 'Game S3 — hiệu năng: cắt tỉa, LOD và ngân sách khung hình',
        topics: 'Cull trước LOD; ngưỡng tăng dần; 16,6ms; CPU hay GPU là nút thắt',
      },
      {
        id: 'p6-u253',
        title: 'Game S3 — 3D nền tảng: quaternion và hoà trộn hoạt ảnh',
        topics: 'Khoá trục; chuẩn quaternion; cùng hệ xương; hệ số trộn clamp',
      },
      {
        id: 'p6-u254',
        title: 'Game S4 — mạng: server quyết định, sequence và chống gian lận',
        topics: 'Ý định thay trạng thái; chống phát lại; giới hạn vật lý; không tin tạm',
      },
      {
        id: 'p6-u255',
        title: 'Game S4 — công cụ và quy trình đội: đường ống build và kho tệp lớn',
        topics: 'Bước gãy chặn bước sau; thứ tự bước; ngưỡng tệp lớn; kho tệp lớn',
      },
      {
        id: 'p6-u256',
        title: 'Game S4 — thiết kế có số liệu: bỏ cuộc theo màn và kinh tế',
        topics: 'Ngưỡng mẫu là unknown; ngưỡng báo động; tiêu chí bóc lột; trần lạm phát',
      },
      {
        id: 'p6-u257',
        title: 'Game S4 — phát hành thương mại: checklist và bản địa hoá',
        topics: 'Mục bắt buộc; trợ năng; overflow khung UI; chuỗi rỗng là lỗi dịch',
      },
      {
        id: 'p6-u214',
        title: 'Di động S2 — mạng ở môi trường xấu: hàng đợi offline và retry',
        topics: 'Khoá idempotent; dedup; backoff có trần; hàng đợi rỗng; fail sau N lần',
      },
      {
        id: 'p6-u215',
        title: 'Di động S2 — xác thực trên điện thoại: máy trạng thái token',
        topics: 'Access vs refresh; làm mới lặng lẽ; lỗi mạng khác bị từ chối; ca biên hết hạn',
      },
      {
        id: 'p6-u216',
        title: 'Di động S2 — quyền và cảm biến: xin đúng lúc, có đường lui',
        topics: 'Lý do trước khi xin; hết lượt hỏi; fallback; quyền chưa khai báo',
      },
      {
        id: 'p6-u217',
        title: 'Di động S2 — kiểm thử và phát hành thử: cổng chặn hay cảnh báo',
        topics: 'Chữ ký; versionCode; ngưỡng người thử; ghi chú thay đổi; gom vi phạm',
      },
      {
        id: 'p6-u218',
        title: 'Di động S3 — hiệu năng giao diện: ngân sách 16ms',
        topics: 'Build/layout/draw; ảo hoá danh sách; giải mã ảnh; nguyên nhân trước triệu chứng',
      },
      {
        id: 'p6-u219',
        title: 'Di động S3 — pin, bộ nhớ, dung lượng',
        topics: 'Công việc nền; đánh thức; rò tham chiếu; ngưỡng mẫu tối thiểu; dung lượng gói',
      },
      {
        id: 'p6-u220',
        title: 'Di động S3 — kiến trúc app lớn: ranh giới lớp',
        topics: 'Kho dữ liệu; tiêm interface; test lớp dữ liệu; chặn khác cảnh báo; 0 khác null',
      },
      {
        id: 'p6-u221',
        title: 'Di động S3 — trải nghiệm chuẩn nền tảng: trợ năng',
        topics: 'Nhãn trợ năng; cỡ chữ hệ thống; chiều cao cố định; chế độ tối; giới hạn rà tĩnh',
      },
      {
        id: 'p6-u222',
        title: 'Di động S4 — phát hành chuyên nghiệp: rollout theo tỉ lệ',
        topics: 'Cửa sổ theo dõi; ngưỡng dừng; halt-rollout; minSupportedVersion; buộc cập nhật',
      },
      {
        id: 'p6-u223',
        title: 'Di động S4 — quan sát từ xa: giải mã stack trace và cờ tính năng',
        topics: 'Bản đồ giải mã; unresolved; giá trị an toàn; tự tắt theo ngưỡng crash',
      },
      {
        id: 'p6-u224',
        title: 'Di động S4 — nền tảng và mã dùng chung',
        topics: 'Logic thuần; riêng nền tảng; semver; đổi phá vỡ; ghi chú thay đổi',
      },
      {
        id: 'p6-u225',
        title: 'Di động S4 — bảo mật ứng dụng di động',
        topics: 'Bí mật trong gói; định danh công khai; chống chụp màn; loại trừ khỏi backup',
      },
      {
        id: 'p6-u234',
        title: 'Hệ thống S3 — phần cứng quyết định tốc độ: dòng cache và chia sẻ giả',
        topics:
          'Dòng cache; bước nhảy truy cập; tỉ lệ trượt cache; chia sẻ giả; đệm tách biến nóng',
      },
      {
        id: 'p6-u235',
        title: 'Hệ thống S3 — đo trước khi sửa: nhiễu vi chuẩn và định luật Amdahl',
        topics: 'Trung vị; chưa đủ mẫu; phép đo nhiễu; tỉ trọng phần nóng; trần cải thiện',
      },
      {
        id: 'p6-u236',
        title: 'Hệ thống S3 — bên trong nhân: bộ nhớ ảo, cách ly và chi phí syscall',
        topics:
          'Tập làm việc; giật trang liên tục; lỗi trang; cách ly không gian địa chỉ; gom lời gọi hệ thống',
      },
      {
        id: 'p6-u237',
        title: 'Hệ thống S3 — đồng thời không khoá: hàng rào bộ nhớ và hàng đợi lock-free',
        topics: 'Hàng rào bộ nhớ; tranh chấp; tuyến tính hoá được; hàng đợi rỗng; tràn sức chứa',
      },
      {
        id: 'p6-u238',
        title: 'Hệ thống S4 — trình biên dịch: bảng ký hiệu và hệ thống kiểu',
        topics: 'Biến chưa khai báo; lỗi kiểu; báo đúng số dòng; sinh mã trung gian (IR)',
      },
      {
        id: 'p6-u239',
        title: 'Hệ thống S4 — môi trường chạy: thu gom rác mark-sweep và máy ảo ngăn xếp',
        topics: 'Đối tượng còn tới được; chu trình trên heap; lỗi ngăn xếp; khung lời gọi',
      },
      {
        id: 'p6-u240',
        title: 'Hệ thống S4 — hệ điều hành từ số 0: bảng trang và lập lịch vòng tròn',
        topics:
          'Bảng trang; cách ly tiến trình; chuyển ngữ cảnh; lượng tử thời gian; trạng thái rỗi',
      },
      {
        id: 'p6-u241',
        title: 'Hệ thống S4 — an toàn tầng thấp: canary, ASLR và fuzzing theo độ phủ',
        topics: 'Phát hiện tràn bộ đệm; canary trên ngăn xếp; W^X; độ phủ; độ phủ đi ngang',
      },
      {
        id: 'p6-u206',
        title: 'Bảo mật S4 — kiến trúc an toàn: ranh giới tin cậy, phân đoạn, vòng đời khoá',
        topics:
          'Ranh giới tin cậy; không tin mặc định (zero trust); phân đoạn; vòng đời khoá và xoay khoá; mô hình đe doạ',
      },
      {
        id: 'p6-u207',
        title: 'Bảo mật S4 — phát hiện và ứng cứu sự cố',
        topics: 'Luật phát hiện; khung ATT&CK; dương tính giả; ngăn chặn; diệt trừ; phục hồi',
      },
      {
        id: 'p6-u208',
        title: 'Bảo mật S4 — điều tra số: toàn vẹn chứng cứ và dòng thời gian',
        topics:
          'Toàn vẹn chứng cứ; chuỗi lưu giữ; lệch đồng hồ; quy về UTC; cờ bất định; che dữ liệu trong báo cáo',
      },
      {
        id: 'p6-u209',
        title: 'Bảo mật S4 — quản trị và tuân thủ',
        topics:
          'Khả năng × tác động; rủi ro còn lại; bên thứ ba; hợp đồng xử lý dữ liệu; kế hoạch rút lui; bằng chứng',
      },
      {
        id: 'p6-u210',
        title: 'Bảo mật S3 — đọc luồng điều khiển từ mã mức thấp (máy đồ chơi)',
        topics:
          'Khối cơ bản; luồng điều khiển; khối không tới được; trần số bước; vòng lặp không lối thoát',
      },
      {
        id: 'p6-u211',
        title: 'Bảo mật S3 — vì sao an toàn bộ nhớ là biện pháp gốc rễ',
        topics:
          'Kiểm biên; ghi ngoài biên; dùng sau khi giải phóng; giải phóng hai lần; rò bộ nhớ; ngăn từ gốc bằng ngôn ngữ an toàn bộ nhớ',
      },
      {
        id: 'p6-u212',
        title: 'Bảo mật S3 — tìm lỗi tự động: fuzzing theo độ phủ và thu nhỏ ca lỗi',
        topics:
          'Độ phủ; hạt giống; chạy lại tái hiện được; không tìm thấy khác với đã sạch; thu nhỏ ca lỗi bằng delta-debugging',
      },
      {
        id: 'p6-u213',
        title: 'Bảo mật S3 — bảo mật hệ thống hiện đại: chuỗi cung ứng, IAM, bảo mật AI',
        topics:
          'Xuất xứ tạo tác; chữ ký; đặc quyền tối thiểu; tiêm lệnh (prompt injection); đầu độc dữ liệu; danh sách cho phép',
      },
      {
        id: 'p6-u274',
        title: 'Desktop S1 — chọn nền tảng: ngân sách gói cài, RAM và phím tắt',
        topics: 'packageSizeMb; ramMb; khay hệ thống; phím tắt toàn cục; xung đột phím hệ',
      },
      {
        id: 'p6-u275',
        title: 'Desktop S1 — làm việc với tệp: ghi an toàn và đường dẫn đa nền',
        topics: 'Tệp tạm; đổi tên; kết quả không kết luận được; ký tự cấm theo hệ',
      },
      {
        id: 'p6-u276',
        title: 'Desktop S1 — lưu trữ cục bộ: phiên bản dữ liệu và sao lưu',
        topics: 'schemaVersion; dataVersion; bước migration; sao lưu; xuất dữ liệu',
      },
      {
        id: 'p6-u277',
        title: 'Desktop S1 — đóng gói, cài đặt và cập nhật tự động',
        topics: 'Ký mã; checksum; hệ đích hỗ trợ; hướng phiên bản; khoảng cách phiên bản',
      },
      {
        id: 'p6-u278',
        title: 'Desktop S2 — việc nền: không chặn luồng giao diện, huỷ và tiến độ',
        topics: 'Luồng giao diện; huỷ trong ngưỡng; hàng đợi; ước lượng đo được',
      },
      {
        id: 'p6-u279',
        title: 'Desktop S2 — trải nghiệm chuyên nghiệp: hoàn tác, phím tắt, trợ năng',
        topics: 'Ngăn xếp hoàn tác; nhánh redo bị cắt; bàn phím; tương phản; thao tác hàng loạt',
      },
      {
        id: 'p6-u280',
        title: 'Desktop S2 — đồng bộ tuỳ chọn: xung đột và offline-first',
        topics: 'Mã hoá trước khi gửi; giao tập trường; drift; fast-forward; hàng đợi chờ',
      },
      {
        id: 'p6-u281',
        title: 'Desktop S2 — chẩn đoán từ xa: đồng ý, che PII và gói báo lỗi',
        topics: 'Sự đồng ý; PII; chế độ an toàn; bảng ký hiệu; trần kích thước gói',
      },
      {
        id: 'p6-u282',
        title: 'Desktop S3 — dữ liệu lớn trên máy đơn: đọc theo luồng, ảo hoá, chỉ mục',
        topics: 'Ngân sách nạp tệp; ảo hoá danh sách; chỉ mục toàn văn; chỉ mục cũ hơn dữ liệu',
      },
      {
        id: 'p6-u283',
        title: 'Desktop S3 — tối ưu khởi động và bộ nhớ, và cách đo đáng tin',
        topics: 'Ngân sách startup; tải lười; RAM lúc nghỉ; trung vị; đủ mẫu; máy cấu hình thấp',
      },
      {
        id: 'p6-u284',
        title: 'Desktop S3 — hệ plugin: hộp cát, phiên bản API, quyền tối thiểu',
        topics: 'Sandbox ưu tiên tuyệt đối; khác major; plugin crash không giết host; tập quyền',
      },
      {
        id: 'p6-u285',
        title: 'Desktop S3 — kiểm thử desktop: ma trận nền tảng và test giao diện ổn định',
        topics: 'Ba nền mục tiêu; luồng cài đặt; luồng cập nhật; chờ theo điều kiện; ngưỡng flaky',
      },
      {
        id: 'p6-u286',
        title: 'Desktop S4 — phân phối và cấp phép: kích hoạt offline, chống lùi đồng hồ',
        topics: 'Clock rollback; license hợp lệ; kích hoạt offline; dùng thử; cửa sổ hoàn tiền',
      },
      {
        id: 'p6-u287',
        title: 'Desktop S4 — cập nhật an toàn: kênh, tỉ lệ, quay lui và di trú dữ liệu',
        topics: 'Health-check sau cập nhật; rolloutPercent; sao lưu; chuỗi bước; đường hạ cấp',
      },
      {
        id: 'p6-u288',
        title: 'Desktop S4 — bảo mật máy khách: chữ ký, quyền tối thiểu, dữ liệu ở lại máy',
        topics:
          'Signature; admin rights; phụ thuộc có lỗ hổng; cho phép; mã hoá; phạm vi tối thiểu',
      },
      {
        id: 'p6-u289',
        title: 'Desktop S4 — hỗ trợ người dùng: triage báo lỗi và lộ trình theo bằng chứng',
        topics: 'Che nội dung người dùng; gói chẩn đoán; affectedUserCount; mất dữ liệu; phạm vi',
      },
      {
        id: 'p6-u178',
        title: 'DevOps S2 — chính sách phát hành và kiểm soát thay đổi',
        topics: 'Phê duyệt; cửa sổ thay đổi; đường quay lui; nghi ngờ thì chặn',
      },
      {
        id: 'p6-u179',
        title: 'DevOps S2 — phân loại sự cố và bằng chứng',
        topics: 'Tín hiệu có giới hạn; mức nghiêm trọng; người chịu trách nhiệm; việc khắc phục',
      },
      {
        id: 'p6-u180',
        title: 'DevOps S2 — chính sách duyệt kế hoạch hạ tầng',
        topics: 'Đọc kế hoạch trước khi áp; phân loại trôi cấu hình; từ chối áp thay đổi phá huỷ',
      },
      {
        id: 'p6-u181',
        title: 'DevOps S2 — IAM và hàng rào chi phí',
        topics: 'Đặc quyền tối thiểu; ngưỡng ngân sách; chính sách lạ thì từ chối',
      },
      {
        id: 'p6-u186',
        title: 'Bảo mật S2 — phạm vi đánh giá đã được cho phép',
        topics: 'Sự đồng ý; phạm vi; cửa sổ thời gian; tài khoản thử; từ chối thao tác phá huỷ',
      },
      {
        id: 'p6-u187',
        title: 'Bảo mật S2 — phân loại phát hiện trên web/API',
        topics: 'Dữ liệu mẫu đã che; phân quyền; kiểm đầu vào; bằng chứng chưa đủ',
      },
      {
        id: 'p6-u188',
        title: 'Bảo mật S2 — phân loại lộ lọt và bí mật',
        topics: 'Kiểm kê có giới hạn; dương tính thật hay giả; khuyến nghị xoay hoặc thu hồi khoá',
      },
      {
        id: 'p6-u189',
        title: 'Bảo mật S2 — công bố lỗ hổng có trách nhiệm',
        topics: 'Mức nghiêm trọng; cách khắc phục; người nhận và hạn; giữ kín trước khi công bố',
      },
      {
        id: 'p6-u166',
        title: 'AI S2 — chia dữ liệu theo thời gian, mốc so sánh và rò rỉ dữ liệu',
        topics: 'Chỉ chia theo quá khứ; tập giữ riêng; phát hiện rò rỉ là chặn; so với mốc cơ sở',
      },
      {
        id: 'p6-u167',
        title: 'AI S2 — ma trận nhầm lẫn, ngưỡng và mất cân bằng lớp',
        topics: 'Precision/recall; mẫu số của từng thước đo; chọn ngưỡng; lớp hiếm',
      },
      {
        id: 'p6-u168',
        title: 'AI S2 — đóng góp của đặc trưng và sai số theo nhóm',
        topics: 'Đóng góp có giới hạn; sai số theo nhóm; ca biên nhóm rỗng và nhóm nhạy cảm',
      },
      {
        id: 'p6-u169',
        title: 'AI S2 — chọn mô hình theo chất lượng, độ trễ và chi phí',
        topics: 'Loại phương án bị áp đảo; phá hoà tất định; đánh đổi trong khung đã chặn',
      },
      {
        id: 'p6-u170',
        title: 'AI S3 — hàm mất mát, gradient và điểm lưu',
        topics: 'Sai phân hữu hạn; epsilon và tốc độ học; chặn khi số không hữu hạn hoặc phân kỳ',
      },
      {
        id: 'p6-u171',
        title: 'AI S3 — attention trong khung nhỏ và bất biến của mask',
        topics: 'Chuỗi ngắn; hình dạng và mask; mẫu số của softmax; ngữ cảnh',
      },
      {
        id: 'p6-u172',
        title: 'AI S3 — độ đồng thuận nhãn và dịch chuyển phân phối',
        topics: 'Độ đồng thuận; biểu đồ tần suất có chặn; nhóm rỗng; số đếm không hợp lệ',
      },
      {
        id: 'p6-u173',
        title: 'AI S3 — chọn giữa prompt, tinh chỉnh và lượng tử hoá',
        topics:
          'Bảng eval và độ trễ; nêu rõ đánh đổi; không khai kết quả đo như benchmark sản xuất',
      },
      {
        id: 'p6-u174',
        title: 'AI S4 — bộ ba phiên bản và cổng phát hành mô hình',
        topics: 'Phiên bản mã, dữ liệu và mô hình; phê duyệt; eval; không quay lui được là chặn',
      },
      {
        id: 'p6-u175',
        title: 'AI S4 — trôi dữ liệu, phản hồi trễ và cảnh báo',
        topics: 'Chất lượng chưa xác định; ngưỡng; phản hồi đo được; mở việc điều tra',
      },
      {
        id: 'p6-u176',
        title: 'AI S4 — vòng lặp gọi tool có ngân sách và huỷ giữa chừng',
        topics: 'Danh sách cho phép; schema tham số; lũy đẳng; trần số bước và chi phí',
      },
      {
        id: 'p6-u177',
        title: 'AI S4 — tác hại, quyền riêng tư và quyết định khi có sự cố',
        topics: 'Dữ liệu cá nhân; giấy phép; người duyệt; vết kiểm toán',
      },
      // p6-u66..u68: chặng S1 của hướng Dữ liệu (data-s1, specializations/data.ts, 4 module).
      // p3-u8/p3-u9 đã dạy SELECT/JOIN/GROUP BY/HAVING cơ bản — u66 đi XA HƠN (hàm cửa sổ, CTE)
      // để không dạy trùng. Đăng ký cầu nối ở `specializations/stageUnits.ts`.
      {
        id: 'p6-u66',
        title: 'Dữ liệu S1 — hàm cửa sổ & CTE: xếp hạng và luỹ kế không mất dòng',
        topics:
          'RANK/DENSE_RANK OVER PARTITION BY; CTE (WITH) chia truy vấn dài, SUM() OVER luỹ kế',
      },
      {
        id: 'p6-u67',
        title: 'Dữ liệu S1 — làm sạch dữ liệu: thiếu/trùng/sai kiểu, chuẩn hoá ngày giờ',
        topics:
          'Phát hiện thiếu/trùng/ngoại lệ; chuẩn hoá định dạng ngày; ghi lại giả định làm sạch',
      },
      {
        id: 'p6-u68',
        title: 'Dữ liệu S1 — thống kê đủ dùng & trực quan hoá trung thực',
        topics:
          'Trung bình vs trung vị, tương quan không phải nhân quả; chọn biểu đồ không đánh lừa mắt',
      },
      {
        id: 'p6-u258',
        title: 'Nhúng S1 — GPIO, chế độ chân và ngân sách log',
        topics: 'Pull-up; chân thả nổi unknown; ghi vào chân input; ngân sách thời gian log UART',
      },
      {
        id: 'p6-u259',
        title: 'Nhúng S1 — ngoại vi và datasheet',
        topics: 'Bảng địa chỉ I2C; NACK trả unknown; dải chu kỳ PWM khai báo',
      },
      {
        id: 'p6-u260',
        title: 'Nhúng S1 — ngắt và thời gian',
        topics: 'ISR ngắn; hàng đợi có trần; chống dội phím theo cửa sổ debounce',
      },
      {
        id: 'p6-u261',
        title: 'Nhúng S1 — gỡ lỗi phần cứng',
        topics: 'Cô lập phần cứng/phần mềm; quá dòng; sổ bằng chứng đo; máy phân tích logic',
      },
      {
        id: 'p6-u262',
        title: 'Nhúng S2 — RTOS và ngân sách ngăn xếp',
        topics: 'Stack budget; chia sẻ ISR/task; đảo ưu tiên; hàng đợi liên tác vụ',
      },
      {
        id: 'p6-u263',
        title: 'Nhúng S2 — kết nối và đệm cục bộ',
        topics: 'Checksum khung; chính sách rơi rụng tường minh; gửi bù chờ xác nhận',
      },
      {
        id: 'p6-u264',
        title: 'Nhúng S2 — cập nhật từ xa A/B',
        topics: 'Chữ ký gói; phân vùng đang chạy; quay lui sau nhiều lần khởi động thất bại',
      },
      {
        id: 'p6-u265',
        title: 'Nhúng S2 — ngân sách năng lượng',
        topics: 'Battery budget ra số ngày; ngủ sâu; ngoại vi chưa tắt gây rò dòng',
      },
      {
        id: 'p6-u266',
        title: 'Nhúng S3 — ghi bền qua mất điện và watchdog',
        topics: 'Đổi con trỏ ở bước cuối; torn write; watchdog timeout; ngân sách bộ nhớ tĩnh',
      },
      {
        id: 'p6-u267',
        title: 'Nhúng S3 — kiểm thử phần cứng qua HAL',
        topics: 'Bản giả lập HAL; chặn test bỏ qua HAL; test không xác định; dải môi trường thử',
      },
      {
        id: 'p6-u268',
        title: 'Nhúng S3 — Linux nhúng',
        topics: 'Hệ tệp chỉ-đọc; cây thiết bị thiếu nút; ngân sách thời gian khởi động',
      },
      {
        id: 'p6-u269',
        title: 'Nhúng S3 — an toàn bộ nhớ kiểu Rust',
        topics: 'Truy cập chia sẻ không đồng bộ; dùng vùng nhớ đã giải phóng; no_std và heap',
      },
      {
        id: 'p6-u270',
        title: 'Nhúng S4 — từ nguyên mẫu tới sản xuất',
        topics: 'Khớp đời phần cứng; calibration ghi đè; ngân sách thời gian trạm xưởng',
      },
      {
        id: 'p6-u271',
        title: 'Nhúng S4 — bảo mật và định danh thiết bị',
        topics: 'Khởi động an toàn; khoá riêng từng máy; duplicate identity; thu hồi đúng phạm vi',
      },
      {
        id: 'p6-u272',
        title: 'Nhúng S4 — vận hành đội thiết bị',
        topics: 'Cập nhật theo đợt nhỏ; ngưỡng dừng freeze; bản tin sức khoẻ; quay lui từng máy',
      },
      {
        id: 'p6-u273',
        title: 'Nhúng S4 — chuẩn và an toàn',
        topics: 'Safe state theo từng chế độ lỗi; tính đầy đủ của checklist quy trình',
      },
    ],
  },
]

const levelMap = new Map<string, ProgrammingLevel>(PROGRAMMING_LEVELS.map((l) => [l.id, l]))

/** Lấy bậc theo id ('p1'…'p6'), không phân biệt hoa thường; undefined nếu id lạ. */
/**
 * Các NHÓM (track) của danh sách unit, theo thứ tự hiển thị.
 *
 * Vì sao cần (đo 2026-09-03): bậc P6 có **65 unit** và tất cả đều đã có bài, nên trang bậc là
 * một dải 65 thẻ liền mạch — học viên không phân biệt nổi "dẫn nhập bốn hướng" với "track
 * Kotlin của chương trình M" với "55 unit hướng chuyên sâu", vì chúng nằm cạnh nhau y hệt.
 * Nhóm lại theo mạch là việc PR-M12 của chương trình M đặt ra.
 *
 * Nhóm MẶC ĐỊNH (`macDinh: true`) hứng mọi unit không khai `track`. Khai nó ra thành một mục
 * thật, thay vì để ngầm, vì hai lý do: nhóm đó có TÊN hiện trên giao diện, và 55 unit hướng
 * chuyên sâu không phải sửa từng cái.
 */
export interface UnitTrack {
  id: string
  title: string
  /** Một câu nói rõ nhóm này là gì — hiện dưới tiêu đề nhóm. */
  moTa: string
  /** Đúng MỘT mục được đánh dấu: nơi hứng unit không khai `track`. */
  macDinh?: boolean
}

export const UNIT_TRACKS: UnitTrack[] = [
  {
    id: 'dan-nhap',
    title: 'Dẫn nhập bốn hướng phổ biến',
    moTa: 'Cửa vào ngắn của bốn hướng nghề hay chọn nhất — đọc để biết mình hợp hướng nào.',
  },
  {
    id: 'kotlin',
    title: 'Track Kotlin — lập trình di động',
    moTa: 'Cú pháp Kotlin thật trên bộ chạy rút gọn; sản phẩm trục nhỏ "Sổ chi tiêu" đi xuyên ba unit.',
  },
  {
    id: 'paradigm',
    title: 'Track Paradigm — ba cách nghĩ',
    moTa: 'Không thêm ngôn ngữ mới: hàm thuần · đồng thời & phân tán · thiết kế hệ thống.',
  },
  {
    id: 'chuyen-sau',
    title: 'Hướng chuyên sâu',
    moTa: 'Nội dung học thật của 14 hướng nghề — chọn một hướng và đi hết bốn chặng của nó.',
    macDinh: true,
  },
]

export interface NhomUnit {
  track: UnitTrack
  units: ProgrammingUnit[]
}

/**
 * Gom unit của một bậc thành các nhóm theo `UNIT_TRACKS`, giữ đúng thứ tự khai báo.
 *
 * Nhóm RỖNG bị bỏ đi (bậc P1–P5 không unit nào khai `track` nên chỉ còn đúng MỘT nhóm) — nhờ
 * vậy giao diện tự biết khi nào cần chia nhóm và khi nào giữ nguyên danh sách phẳng như cũ,
 * không phải đặc biệt hoá riêng cho P6.
 */
export function nhomUnitTheoTrack(units: ProgrammingUnit[]): NhomUnit[] {
  const macDinh = UNIT_TRACKS.find((t) => t.macDinh)
  return UNIT_TRACKS.map((track) => ({
    track,
    units: units.filter((u) =>
      u.track === undefined ? track.id === macDinh?.id : u.track === track.id,
    ),
  })).filter((n) => n.units.length > 0)
}

export function getProgrammingLevel(levelId: string): ProgrammingLevel | undefined {
  return levelMap.get(levelId.toLowerCase())
}

/**
 * Suy BẬC từ mã bài học: 'p3-u9-l1' → 'p3'. Trả undefined nếu mã không đúng khuôn hoặc
 * bậc không tồn tại.
 *
 * Có hàm này để giao diện không phải đoán bậc bằng cách ghi cứng — lỗi PR-UX1 vá chính là
 * `ProgrammingLessonPage` luôn quay lại '/lap-trinh/p1' kể cả khi đang học bài P5.
 */
export function getLevelIdOfLesson(lessonId: string): ProgrammingLevelId | undefined {
  const prefix = lessonId.toLowerCase().split('-')[0]
  return PROGRAMMING_LEVEL_IDS.find((id) => id === prefix)
}

// Ba phương án dự án trục T1/T2/T3 (`PROJECT_TRACKS`) đã chuyển sang `projectTracks.ts`
// (2026-10-09): cờ `available` nay suy từ dữ liệu bước dự án, mà file này không được import nội
// dung bước (curriculum.ts nằm trong bundle của rất nhiều trang).
