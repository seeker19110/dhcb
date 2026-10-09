// projectStepsT3P3 — DỰ ÁN TRỤC T3 "Sổ học tập của tôi", CHẶNG P3 "Trang chia sẻ tài liệu".
// Cùng nhịp với chặng P3 của T1 (projectStepsP3.ts): mỗi bước một ngôn ngữ — html → html/CSS →
// dom → sql → fetch — và mỗi bước dùng đúng bộ chạy của bài học tương ứng, không engine mới.
//
// Sổ học tập lên web theo đúng thứ học sinh – sinh viên dùng thật:
//   bước 1–2  trang chia sẻ tài liệu công khai (`tai_lieu.html`), làm đẹp mobile-first
//   bước 3    thẻ ôn tập lật mặt trong trình duyệt (`the_on.js`) — DOM + sự kiện + trạng thái
//   bước 4    báo cáo "môn cần ôn trước" bằng MỘT câu SQL (`bao_cao_diem.sql`)
//   bước 5    trang tài liệu lấy danh sách từ API `/api/tai-lieu`, lọc theo môn (`tai_lieu.js`)
//
// Bước SQL chấm trên BỘ DỮ LIỆU RIÊNG của dự án (testCase.datasetSql), không dùng CSDL quán cà
// phê mặc định của bài học; ca ẩn đổi sang bộ số khác để bắt lời giải gõ cứng kết quả. Trang dự
// án truyền datasetSql y như trang bài học (ProgrammingProjectPage.tsx).
//
// Code Python của P1/P2 KHÔNG bị đụng tới — dự án lớn thêm, không đập đi xây lại. Mọi dòng chấm
// điểm in KHÔNG DẤU như hai chặng trước.
import { TestCaseSchema, type ProgrammingTestCase } from './lessonTypes.js'
// Xuống projectStepTypes (KHÔNG phải projectSteps/projectStepsT3): file bảng chặng import ngược
// lên đây, nên import chéo sẽ tạo chu trình — cổng `codemap -- cycles` chặn CI.
import type { ProjectStep } from './projectStepTypes.js'

export const T3_P3_PAGE_FILE = 'tai_lieu.html'
export const T3_P3_CARD_FILE = 'the_on.js'
export const T3_P3_REPORT_FILE = 'bao_cao_diem.sql'
export const T3_P3_SHARE_FILE = 'tai_lieu.js'

const tc = (
  stdinLines: string[],
  expected: string,
  label: string,
  hidden = false,
  match: 'contains' | 'exact' = 'contains',
  datasetSql?: string,
): ProgrammingTestCase =>
  TestCaseSchema.parse({
    stdinLines,
    expected,
    label,
    hidden,
    match,
    ...(datasetSql ? { datasetSql } : {}),
  })

/** Trang thẻ ôn có sẵn của bước 3 — học viên KHÔNG sửa, chỉ viết JavaScript. */
const TRANG_THE_ON = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>On bang the</title>
  </head>
  <body>
    <h1>On bang the</h1>
    <p id="mat-truoc"></p>
    <p id="mat-sau"></p>
    <button id="nut-lat">Lat the</button>
    <button id="nut-nho">Da nho</button>
    <button id="nut-chua">Chua nho</button>
    <p id="tien-do"></p>
  </body>
</html>`

/** Trang tài liệu chia sẻ có sẵn của bước 5. Đoạn trạng thái đặt SAU danh sách có chủ đích: ca
 *  chấm so cả khối "danh sách + dòng ngay sau" nên bắt được danh sách lọc mà quên xoá mục cũ. */
const TRANG_TAI_LIEU = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>Tai lieu chia se</title>
  </head>
  <body>
    <h1>Tai lieu chia se</h1>
    <label for="o-mon">Loc theo mon</label>
    <input id="o-mon" type="text" />
    <button id="nut-loc">Loc</button>
    <ul id="ds-tai-lieu"></ul>
    <p id="trang-thai"></p>
  </body>
</html>`

// ── Dữ liệu SQL riêng của dự án ─────────────────────────────────────────────────────────────
// Hai bảng: mon_hoc(id, ten) · diem(mon_id, loai, he_so, diem). Hệ số theo loại điểm như chặng
// P1: thuong xuyen 1 · giua ky 2 · cuoi ky 3. Một môn có thể có NHIỀU bài thường xuyên.
const SCHEMA_DIEM = `
CREATE TABLE mon_hoc (id INTEGER PRIMARY KEY, ten TEXT NOT NULL);
CREATE TABLE diem (
  mon_id INTEGER NOT NULL,
  loai TEXT NOT NULL,
  he_so INTEGER NOT NULL,
  diem REAL NOT NULL
);
`

/** Bộ số HIỆN: Lý và Địa bằng điểm nhau (38/6), Hoá chưa có điểm nào. */
export const T3_SQL_DIEM_A = `${SCHEMA_DIEM}
INSERT INTO mon_hoc (id, ten) VALUES
  (1, 'Toan'), (2, 'Van'), (3, 'Anh'), (4, 'Ly'), (5, 'Dia'), (6, 'Hoa');
INSERT INTO diem (mon_id, loai, he_so, diem) VALUES
  (1, 'thuong xuyen', 1, 8), (1, 'thuong xuyen', 1, 9), (1, 'giua ky', 2, 7), (1, 'cuoi ky', 3, 9),
  (2, 'thuong xuyen', 1, 6), (2, 'giua ky', 2, 6.5), (2, 'cuoi ky', 3, 7),
  (3, 'thuong xuyen', 1, 7), (3, 'giua ky', 2, 5), (3, 'cuoi ky', 3, 6),
  (4, 'thuong xuyen', 1, 5), (4, 'giua ky', 2, 6), (4, 'cuoi ky', 3, 7),
  (5, 'thuong xuyen', 1, 8), (5, 'giua ky', 2, 6), (5, 'cuoi ky', 3, 6);
`

/** Bộ số ẨN: số liệu khác hẳn, có cặp bằng điểm khác (Địa – Toán), Sử chưa có điểm. */
export const T3_SQL_DIEM_B = `${SCHEMA_DIEM}
INSERT INTO mon_hoc (id, ten) VALUES
  (1, 'Toan'), (2, 'Van'), (3, 'Anh'), (4, 'Tin'), (5, 'Su'), (6, 'Dia');
INSERT INTO diem (mon_id, loai, he_so, diem) VALUES
  (1, 'thuong xuyen', 1, 4), (1, 'giua ky', 2, 5), (1, 'cuoi ky', 3, 5),
  (2, 'thuong xuyen', 1, 9), (2, 'giua ky', 2, 8), (2, 'cuoi ky', 3, 8),
  (3, 'thuong xuyen', 1, 6), (3, 'thuong xuyen', 1, 7), (3, 'giua ky', 2, 6), (3, 'cuoi ky', 3, 5),
  (4, 'thuong xuyen', 1, 10), (4, 'giua ky', 2, 9), (4, 'cuoi ky', 3, 9),
  (6, 'thuong xuyen', 1, 4), (6, 'giua ky', 2, 5), (6, 'cuoi ky', 3, 5);
`

export const T3_P3_PROJECT_STEPS: ProjectStep[] = [
  {
    id: 't3-p3-s1',
    isMilestone: false,
    language: 'html',
    files: [T3_P3_PAGE_FILE],
    title: 'Trang chia sẻ tài liệu — HTML đúng chuẩn',
    unitId: 'p3-u4',
    requirement:
      'Sổ học tập của bạn lên web! Viết file tai_lieu.html — trang công khai để bạn bè tải tài liệu ôn thi bạn đã soạn:\n\n1. Khung trang chuẩn: <html lang="vi">, trong <head> có <meta charset="utf-8" /> (thiếu là tiếng Việt hiện thành ký tự lạ) và <title>So hoc tap cua toi</title>.\n2. <h1>: Tai lieu on thi\n3. Một đoạn <p> giới thiệu ngắn, có class="gioi-thieu".\n4. Danh sách <ul class="tai-lieu"> với 3 thẻ <li>, MỖI <li> chứa một liên kết <a> tới file tài liệu (chữ KHÔNG DẤU):\n   href="de-cuong-toan.pdf" — chữ "De cuong Toan HK1"\n   href="tom-tat-van.pdf" — chữ "Tom tat Van 11"\n   href="tu-vung-anh.pdf" — chữ "Tu vung Anh Unit 1-5"\n5. Một liên kết riêng (ngoài danh sách) tới trang ôn bài: href="the_on.html", chữ "On bang the".',
    hint: 'Khung trang: <!doctype html> rồi <html lang="vi"> chứa <head> (meta charset + title) và <body>. Liên kết lồng TRONG thẻ li: <li><a href="de-cuong-toan.pdf">De cuong Toan HK1</a></li>.',
    referenceCode: `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>So hoc tap cua toi</title>
  </head>
  <body>
    <h1>Tai lieu on thi</h1>
    <p class="gioi-thieu">Tai lieu minh tu soan trong hoc ky, ban nao can cu tai ve doc nhe.</p>
    <ul class="tai-lieu">
      <li><a href="de-cuong-toan.pdf">De cuong Toan HK1</a></li>
      <li><a href="tom-tat-van.pdf">Tom tat Van 11</a></li>
      <li><a href="tu-vung-anh.pdf">Tu vung Anh Unit 1-5</a></li>
    </ul>
    <a href="the_on.html">On bang the</a>
  </body>
</html>`,
    checks: [
      tc([], 'html lang="vi"', 'Thẻ html khai báo ngôn ngữ tiếng Việt'),
      tc([], 'meta charset="utf-8"', 'Có khai báo bảng mã (tiếng Việt không bị lỗi phông)'),
      tc([], 'title "So hoc tap cua toi"', 'Tiêu đề trang đúng'),
      tc([], 'h1 "Tai lieu on thi"', 'Tiêu đề lớn nhất trang'),
      tc([], 'p class="gioi-thieu"', 'Đoạn giới thiệu có class đúng'),
      tc([], 'ul class="tai-lieu"', 'Danh sách tài liệu có class'),
      tc(
        [],
        'li\n        a href="tom-tat-van.pdf" "Tom tat Van 11"',
        'Mỗi tài liệu là một liên kết nằm TRONG thẻ li',
      ),
      tc([], 'a href="the_on.html" "On bang the"', 'Ca ẩn: liên kết sang trang ôn bài', true),
    ],
  },
  {
    id: 't3-p3-s2',
    isMilestone: false,
    language: 'html',
    files: [T3_P3_PAGE_FILE],
    title: 'Làm đẹp bằng CSS — dễ bấm trên điện thoại',
    unitId: 'p3-u5',
    requirement:
      'Giữ NGUYÊN toàn bộ nội dung bước 1, thêm một thẻ <style> trong <head> với các luật sau (bạn bè sẽ mở link bằng điện thoại — viết cho màn nhỏ trước):\n\n1. body: font-family: sans-serif; margin: 16px; line-height: 1.5\n2. h1: color: #1d4ed8; font-size: 24px\n3. .tai-lieu: display: flex; flex-direction: column; gap: 8px; list-style: none; padding: 0\n4. .tai-lieu a: display: block; min-height: 44px; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px\n\nLuật số 4 biến MỖI tài liệu thành một ô bấm to bằng cả hàng, cao ít nhất 44px — vùng chạm tối thiểu để ngón tay bấm trúng. Chữ liên kết nhỏ xíu trên điện thoại là thứ khiến người ta bấm nhầm tài liệu.',
    hint: 'Đặt <style> ... </style> bên trong <head>, sau <title>. Bộ chọn ".tai-lieu a" nghĩa là "mọi thẻ a nằm trong phần tử có class tai-lieu" — nên liên kết "On bang the" ở ngoài danh sách không bị ảnh hưởng.',
    referenceCode: `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>So hoc tap cua toi</title>
    <style>
      body { font-family: sans-serif; margin: 16px; line-height: 1.5; }
      h1 { color: #1d4ed8; font-size: 24px; }
      .tai-lieu { display: flex; flex-direction: column; gap: 8px; list-style: none; padding: 0; }
      .tai-lieu a {
        display: block;
        min-height: 44px;
        padding: 12px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
      }
    </style>
  </head>
  <body>
    <h1>Tai lieu on thi</h1>
    <p class="gioi-thieu">Tai lieu minh tu soan trong hoc ky, ban nao can cu tai ve doc nhe.</p>
    <ul class="tai-lieu">
      <li><a href="de-cuong-toan.pdf">De cuong Toan HK1</a></li>
      <li><a href="tom-tat-van.pdf">Tom tat Van 11</a></li>
      <li><a href="tu-vung-anh.pdf">Tu vung Anh Unit 1-5</a></li>
    </ul>
    <a href="the_on.html">On bang the</a>
  </body>
</html>`,
    checks: [
      tc(
        [],
        'body { font-family: sans-serif; line-height: 1.5; margin: 16px }',
        'Nền trang có phông, lề và giãn dòng',
      ),
      tc([], 'h1 { color: #1d4ed8; font-size: 24px }', 'Tiêu đề màu xanh của sổ'),
      tc(
        [],
        '.tai-lieu { display: flex; flex-direction: column; gap: 8px; list-style: none; padding: 0 }',
        'Danh sách xếp dọc bằng flex, bỏ dấu chấm đầu dòng',
      ),
      tc(
        [],
        '.tai-lieu a { border-radius: 8px; border: 1px solid #cbd5e1; display: block; min-height: 44px; padding: 12px }',
        'Mỗi tài liệu thành một ô bấm cao ít nhất 44px',
      ),
      tc(
        [],
        'a href="de-cuong-toan.pdf" "De cuong Toan HK1"',
        'Ca ẩn: nội dung bước 1 KHÔNG được mất khi thêm CSS',
        true,
      ),
    ],
  },
  {
    id: 't3-p3-s3',
    isMilestone: false,
    language: 'dom',
    files: [T3_P3_CARD_FILE],
    domHtml: TRANG_THE_ON,
    title: 'Thẻ ôn tập lật mặt — JavaScript nhớ mình đang ở thẻ nào',
    unitId: 'p3-u6',
    requirement:
      'Trang ôn bài đã dựng sẵn (bạn KHÔNG sửa HTML, chỉ viết the_on.js):\n- đoạn #mat-truoc (câu hỏi), đoạn #mat-sau (đáp án), đoạn #tien-do\n- nút #nut-lat, nút #nut-nho ("Đã nhớ"), nút #nut-chua ("Chưa nhớ")\n\nBộ thẻ gồm đúng 3 thẻ, theo thứ tự (chữ không dấu):\n1. "Cong thuc dien tich hinh tron" → "S = pi x r x r"\n2. "Nam Bac Ho doc Tuyen ngon Doc lap" → "1945"\n3. "Goodbye nghia la gi" → "Tam biet"\n\nYêu cầu:\n1. NGAY khi script chạy: #mat-truoc hiện câu hỏi thẻ 1, #mat-sau trống, #tien-do là "The 1/3".\n2. Bấm #nut-lat: #mat-sau hiện đáp án của thẻ đang xem.\n3. Bấm #nut-nho: đếm thêm một thẻ đã nhớ rồi sang thẻ kế. Bấm #nut-chua: sang thẻ kế, KHÔNG đếm. Sang thẻ mới thì #mat-sau phải trống lại (úp thẻ) và #tien-do cập nhật "The <k>/3".\n4. Qua hết thẻ cuối: #mat-truoc trống, #tien-do là "Xong: nho <so the da nho>/3 the". Bấm thêm nút nào cũng không đếm thêm và không lỗi.',
    hint: 'Giữ hai biến bên ngoài các hàm xử lý: viTri (đang ở thẻ thứ mấy, bắt đầu 0) và soNho. Viết một hàm hienThe() vẽ lại cả ba đoạn theo viTri — mọi nút chỉ việc đổi biến rồi gọi hienThe(). Nhớ chặn khi viTri đã bằng số thẻ.',
    referenceCode: `const THE = [
  { hoi: "Cong thuc dien tich hinh tron", dap: "S = pi x r x r" },
  { hoi: "Nam Bac Ho doc Tuyen ngon Doc lap", dap: "1945" },
  { hoi: "Goodbye nghia la gi", dap: "Tam biet" },
]

const matTruoc = document.getElementById("mat-truoc")
const matSau = document.getElementById("mat-sau")
const tienDo = document.getElementById("tien-do")

let viTri = 0
let soNho = 0

// Vẽ lại cả ba đoạn theo trạng thái hiện tại — mọi nút chỉ đổi biến rồi gọi hàm này
function hienThe() {
  matSau.textContent = ""
  if (viTri >= THE.length) {
    matTruoc.textContent = ""
    tienDo.textContent = "Xong: nho " + soNho + "/" + THE.length + " the"
    return
  }
  matTruoc.textContent = THE[viTri].hoi
  tienDo.textContent = "The " + (viTri + 1) + "/" + THE.length
}

function sangTheKe(daNho) {
  if (viTri >= THE.length) return
  if (daNho) soNho = soNho + 1
  viTri = viTri + 1
  hienThe()
}

document.getElementById("nut-lat").addEventListener("click", () => {
  if (viTri < THE.length) matSau.textContent = THE[viTri].dap
})
document.getElementById("nut-nho").addEventListener("click", () => sangTheKe(true))
document.getElementById("nut-chua").addEventListener("click", () => sangTheKe(false))

hienThe()`,
    checks: [
      tc([], 'p id="mat-truoc" "Cong thuc dien tich hinh tron"', 'Thẻ đầu hiện ngay khi mở trang'),
      tc([], 'p id="tien-do" "The 1/3"', 'Tiến độ bắt đầu ở thẻ 1'),
      tc(['click #nut-lat'], 'p id="mat-sau" "S = pi x r x r"', 'Lật thẻ thấy đáp án'),
      tc(
        ['click #nut-nho'],
        'p id="mat-truoc" "Nam Bac Ho doc Tuyen ngon Doc lap"',
        'Đã nhớ → sang thẻ kế',
      ),
      tc(
        ['click #nut-nho', 'click #nut-chua', 'click #nut-nho'],
        'p id="tien-do" "Xong: nho 2/3 the"',
        'Hết bộ thẻ: đếm đúng số thẻ đã nhớ (chưa nhớ không đếm)',
      ),
      tc(
        ['click #nut-lat', 'click #nut-nho'],
        'p id="mat-sau"\n    button id="nut-lat"',
        'Ca ẩn: sang thẻ mới thì úp thẻ (xoá đáp án cũ)',
        true,
      ),
      tc(
        ['click #nut-nho', 'click #nut-lat'],
        'p id="mat-sau" "1945"',
        'Ca ẩn: lật đúng đáp án của thẻ ĐANG xem',
        true,
      ),
      tc(
        ['click #nut-nho', 'click #nut-nho', 'click #nut-nho', 'click #nut-nho', 'click #nut-lat'],
        'p id="tien-do" "Xong: nho 3/3 the"',
        'Ca ẩn: bấm thừa sau thẻ cuối không đếm thêm, không lỗi',
        true,
      ),
    ],
  },
  {
    id: 't3-p3-s4',
    isMilestone: false,
    language: 'sql',
    files: [T3_P3_REPORT_FILE],
    title: 'Báo cáo SQL — ba môn cần ôn trước',
    unitId: 'p3-u9',
    requirement:
      'Sổ CSV của chặng P2 trả lời được "ĐTB là bao nhiêu", nhưng muốn hỏi "môn nào yếu nhất, cần ôn trước" thì lại phải viết thêm vòng lặp. Kho dữ liệu SQL trả lời bằng MỘT câu.\n\nCSDL sổ học tập có sẵn 2 bảng:\n- mon_hoc(id, ten)\n- diem(mon_id, loai, he_so, diem) — mỗi dòng một bài kiểm tra; he_so là 1 (thường xuyên), 2 (giữa kỳ) hoặc 3 (cuối kỳ). Một môn có thể có NHIỀU bài thường xuyên.\n\nViết vào bao_cao_diem.sql MỘT câu truy vấn:\n- cột 1 tên "ten": tên môn\n- cột 2 tên "dtb": điểm trung bình có trọng số = tổng (diem × he_so) chia tổng he_so, làm tròn 1 chữ số bằng ROUND(..., 1)\n- CHỈ các môn đã có điểm (môn chưa có bài nào không phải "môn yếu", nó là môn chưa học)\n- sắp xếp ĐTB TĂNG dần (môn yếu nhất lên đầu); hai môn bằng điểm thì tên đứng trước bảng chữ cái xếp trên\n- chỉ lấy 3 dòng đầu.\n\nBộ chấm chạy câu của bạn trên NHIỀU bộ số liệu khác nhau — câu đúng thì đúng với mọi bộ, còn kết quả chép tay chỉ đúng với một bộ.',
    hint: 'Nối bảng: FROM diem d JOIN mon_hoc m ON m.id = d.mon_id — JOIN tự loại môn chưa có điểm (đi từ mon_hoc rồi LEFT JOIN diem thì môn đó lọt vào với dtb NULL và đứng đầu danh sách). Gộp theo môn bằng GROUP BY m.id, m.ten; ĐTB: ROUND(SUM(d.diem * d.he_so) / SUM(d.he_so), 1) AS dtb; rồi ORDER BY dtb ASC, ten ASC LIMIT 3.',
    referenceCode: `SELECT m.ten AS ten, ROUND(SUM(d.diem * d.he_so) / SUM(d.he_so), 1) AS dtb
FROM diem d
JOIN mon_hoc m ON m.id = d.mon_id
GROUP BY m.id, m.ten
ORDER BY dtb ASC, ten ASC
LIMIT 3;`,
    checks: [
      tc([], 'ten | dtb', 'Đặt đúng tên hai cột báo cáo', false, 'contains', T3_SQL_DIEM_A),
      tc(
        [],
        'ten | dtb\nAnh | 5.8',
        'Môn yếu nhất đứng đầu, ĐTB tính đúng hệ số',
        false,
        'contains',
        T3_SQL_DIEM_A,
      ),
      tc(
        [],
        'Dia | 6.3\nLy | 6.3',
        'Hai môn bằng điểm xếp theo tên (Dia trước Ly)',
        false,
        'contains',
        T3_SQL_DIEM_A,
      ),
      tc(
        [],
        'ten | dtb\nAnh | 5.8\nDia | 6.3\nLy | 6.3',
        'Đúng 3 dòng, không lọt môn chưa có điểm',
        false,
        'exact',
        T3_SQL_DIEM_A,
      ),
      tc(
        [],
        'ten | dtb\nDia | 4.8\nToan | 4.8\nAnh | 5.7',
        'Ca ẩn: bộ số liệu khác vẫn đúng (không chép tay kết quả)',
        true,
        'exact',
        T3_SQL_DIEM_B,
      ),
    ],
  },
  {
    id: 't3-p3-s5',
    isMilestone: true,
    language: 'fetch',
    files: [T3_P3_SHARE_FILE],
    domHtml: TRANG_TAI_LIEU,
    title: 'Milestone P3 — trang tài liệu lấy danh sách từ API, lọc theo môn',
    unitId: 'p3-u7',
    requirement:
      'Bước chốt chặng: danh sách tài liệu không còn gõ cứng trong trang nữa mà LẤY TỪ API — bạn chia sẻ thêm tài liệu thì chỉ thêm ở máy chủ, ai mở trang cũng thấy ngay.\n\nAPI mẫu của sổ học tập: /api/tai-lieu → mảng các tài liệu {ten, mon, luot_tai} (mon viết thường không dấu, ví dụ "toan").\n\nTrang đã dựng sẵn (chỉ viết tai_lieu.js): ô #o-mon, nút #nut-loc, danh sách #ds-tai-lieu, đoạn #trang-thai.\n\n1. Khi script chạy: gọi /api/tai-lieu MỘT lần, render mỗi tài liệu một <li> vào #ds-tai-lieu dạng "<ten> (<mon>)", rồi đặt #trang-thai thành "Co <n> tai lieu".\n2. Bấm #nut-loc: đọc môn trong #o-mon (bỏ khoảng trắng thừa, không phân biệt hoa/thường), vẽ LẠI danh sách chỉ gồm tài liệu của môn đó (xoá các mục cũ trước), và đặt #trang-thai thành "Co <k> tai lieu mon <mon>".\n   - Không có tài liệu nào của môn đó → danh sách trống, #trang-thai là "Chua co tai lieu mon <mon>".\n   - Ô môn để trống → hiện lại toàn bộ, #trang-thai về "Co <n> tai lieu".\n\nLƯU Ý: API có 6 tài liệu — nhiều hơn 3 tài liệu gõ tay ở bước 1, nên còn sót danh sách cũ trong code là các ca kiểm tra lộ ra ngay.',
    hint: 'Khai báo let TAT_CA = [] ở ngoài, trong hàm async tải: TAT_CA = await (await fetch("/api/tai-lieu")).json(). Viết một hàm hienDanhSach(ds) xoá sạch danh sách (dsEl.innerHTML = "") rồi thêm từng <li> — dùng chung cho lúc tải và lúc lọc. Lọc bằng TAT_CA.filter((tl) => tl.mon === mon).',
    referenceCode: `const dsEl = document.getElementById("ds-tai-lieu")
const trangThai = document.getElementById("trang-thai")

let TAT_CA = []

// Vẽ lại danh sách từ đầu: xoá mục cũ rồi thêm từng tài liệu
function hienDanhSach(ds) {
  dsEl.innerHTML = ""
  for (const tl of ds) {
    const li = document.createElement("li")
    li.textContent = tl.ten + " (" + tl.mon + ")"
    dsEl.appendChild(li)
  }
}

async function taiTaiLieu() {
  const res = await fetch("/api/tai-lieu")
  TAT_CA = await res.json()
  hienDanhSach(TAT_CA)
  trangThai.textContent = "Co " + TAT_CA.length + " tai lieu"
}

taiTaiLieu()

document.getElementById("nut-loc").addEventListener("click", () => {
  const mon = document.getElementById("o-mon").value.trim().toLowerCase()
  if (mon === "") {
    hienDanhSach(TAT_CA)
    trangThai.textContent = "Co " + TAT_CA.length + " tai lieu"
    return
  }
  const loc = TAT_CA.filter((tl) => tl.mon === mon)
  hienDanhSach(loc)
  trangThai.textContent =
    loc.length === 0
      ? "Chua co tai lieu mon " + mon
      : "Co " + loc.length + " tai lieu mon " + mon
})`,
    checks: [
      tc([], 'p id="trang-thai" "Co 6 tai lieu"', 'Tải danh sách từ API xong thì báo số tài liệu'),
      tc(
        [],
        'li "Cong thuc Vat ly 11 (ly)"',
        'Tài liệu CHỈ có trong API cũng hiện ra (danh sách thật từ máy chủ)',
      ),
      tc(
        ['dien #o-mon = toan', 'click #nut-loc'],
        'p id="trang-thai" "Co 2 tai lieu mon toan"',
        'Lọc theo môn đếm đúng',
      ),
      tc(
        ['dien #o-mon = toan', 'click #nut-loc'],
        'ul id="ds-tai-lieu"\n      li "De cuong Toan HK1 (toan)"\n      li "50 bai tap Dao ham (toan)"\n    p id="trang-thai"',
        'Lọc xong danh sách CHỈ còn tài liệu của môn đó (mục cũ đã xoá)',
      ),
      tc(
        ['dien #o-mon =  Van ', 'click #nut-loc'],
        'p id="trang-thai" "Co 1 tai lieu mon van"',
        'Ca ẩn: môn gõ hoa/thừa khoảng trắng vẫn lọc đúng',
        true,
      ),
      tc(
        ['dien #o-mon = hoa', 'click #nut-loc'],
        'p id="trang-thai" "Chua co tai lieu mon hoa"',
        'Ca ẩn: môn chưa có tài liệu báo rõ',
        true,
      ),
      tc(
        ['dien #o-mon = toan', 'click #nut-loc', 'dien #o-mon = ', 'click #nut-loc'],
        'li "Tu vung Anh Unit 1-5 (anh)"',
        'Ca ẩn: xoá ô môn rồi lọc thì hiện lại toàn bộ',
        true,
      ),
    ],
  },
]
