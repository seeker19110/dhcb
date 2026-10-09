// projectStepsT2P3 — DỰ ÁN TRỤC T2 "Quỹ lớp / Chi tiêu nhà mình", CHẶNG P3 "Trang minh bạch
// quỹ". Đặc tả hạ tầng: docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md (hợp đồng nội dung).
//
// Cùng nhịp với chặng P3 của T1 — mỗi bước một ngôn ngữ (html → html/CSS → dom → sql → fetch),
// mỗi bước dùng đúng bộ chạy của bài học tương ứng, không có engine nào mới phải nuôi. Câu
// chuyện của chặng: sổ quỹ ra khỏi máy thủ quỹ để CẢ LỚP cùng thấy.
//   bước 1–2: trang minh bạch tĩnh (bảng thu chi gõ tay) — trang_quy.html
//   bước 3  : trang ghi sổ của thủ quỹ chạy JavaScript — ghi_so.js
//   bước 4  : báo cáo chi theo hạng mục của MỘT KỲ bằng SQL — bao_cao.sql
//   bước 5  : trang minh bạch tự lấy sổ từ API `/api/quy` (fundData.ts) — minh_bach.js
//
// Bước SQL chấm trên bộ dữ liệu RIÊNG của sổ quỹ (`datasetSql` của từng ca) chứ không dùng CSDL
// quán mẫu SQL_SEED của T1 — và có HAI bộ số khác nhau để lời giải gõ cứng kết quả không qua.
// Bước fetch gọi API giả 'quy-lop' (fetchGia.ts), trang dự án chọn API theo projectTracks.ts.
//
// Mọi dòng chấm điểm in KHÔNG DẤU, như các chặng trước.
import { TestCaseSchema, type ProgrammingTestCase } from './lessonTypes.js'
// Xuống projectStepTypes (KHÔNG phải projectSteps) — tránh chu trình import.
import type { ProjectStep } from './projectStepTypes.js'

export const T2_P3_PAGE_FILE = 'trang_quy.html'
export const T2_P3_ENTRY_FILE = 'ghi_so.js'
export const T2_P3_REPORT_FILE = 'bao_cao.sql'
export const T2_P3_PUBLIC_FILE = 'minh_bach.js'

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

// ── Bước 1–2: trang minh bạch tĩnh ──────────────────────────────────────────────────────────

const TRANG_QUY_THAN = `  <body>
    <h1>Quy lop 10A1</h1>
    <p class="so-du">So du: 1050000</p>
    <table class="bang-quy">
      <thead>
        <tr><th>Ngay</th><th>Noi dung</th><th>So tien</th></tr>
      </thead>
      <tbody>
        <tr><td>05/09</td><td>Thu quy thang 9</td><td>+2000000</td></tr>
        <tr><td>20/11</td><td>Mua hoa 20/11</td><td>-450000</td></tr>
        <tr><td>25/11</td><td>Photo de cuong</td><td>-500000</td></tr>
      </tbody>
    </table>
    <a href="bao_cao.html">Bao cao theo thang</a>
  </body>
</html>`

const P3_S1_CODE = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>Quy lop 10A1</title>
  </head>
${TRANG_QUY_THAN}`

const P3_S2_CODE = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>Quy lop 10A1</title>
    <style>
      body { font-family: sans-serif; line-height: 1.5; margin: 16px; }
      h1 { color: #1f4e8c; font-size: 24px; }
      .so-du { font-size: 20px; font-weight: bold; }
      .bang-quy { border-collapse: collapse; width: 100%; }
      .bang-quy td { border-bottom: 1px solid #ddd; padding: 8px; }
      a { display: inline-block; min-height: 44px; padding: 12px 0; }
    </style>
  </head>
${TRANG_QUY_THAN}`

// ── Bước 3: trang ghi sổ của thủ quỹ ────────────────────────────────────────────────────────

/** Trang ghi sổ có sẵn của bước 3 — học viên KHÔNG sửa, chỉ viết ghi_so.js. */
const TRANG_GHI_SO = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>Ghi so quy</title>
  </head>
  <body>
    <h1>Ghi so quy</h1>
    <label for="o-noi-dung">Noi dung</label>
    <input id="o-noi-dung" type="text" />
    <label for="o-so-tien">So tien</label>
    <input id="o-so-tien" type="number" />
    <button id="nut-thu">Ghi khoan thu</button>
    <button id="nut-chi">Ghi khoan chi</button>
    <ul id="so"></ul>
    <p id="so-du"></p>
  </body>
</html>`

const P3_S3_CODE = `const soEl = document.getElementById("so")
const soDuEl = document.getElementById("so-du")

let soDu = 0
soDuEl.textContent = "So du: 0"

// Đọc hai ô nhập — trả về null nếu nhập bậy (dùng chung cho cả thu lẫn chi)
function docKhoan() {
  const noiDung = document.getElementById("o-noi-dung").value.trim()
  const soTien = Number(document.getElementById("o-so-tien").value)
  if (noiDung === "" || !Number.isInteger(soTien) || soTien <= 0) {
    return null
  }
  return { noiDung, soTien }
}

function ghiDong(dau, khoan) {
  const li = document.createElement("li")
  li.textContent = dau + khoan.soTien + " " + khoan.noiDung
  soEl.appendChild(li)
  soDuEl.textContent = "So du: " + soDu
}

document.getElementById("nut-thu").addEventListener("click", () => {
  const khoan = docKhoan()
  if (khoan === null) {
    soDuEl.textContent = "Du lieu khong hop le"
    return
  }
  soDu = soDu + khoan.soTien
  ghiDong("+", khoan)
})

document.getElementById("nut-chi").addEventListener("click", () => {
  const khoan = docKhoan()
  if (khoan === null) {
    soDuEl.textContent = "Du lieu khong hop le"
    return
  }
  if (khoan.soTien > soDu) {
    soDuEl.textContent = "Khong du quy"
    return
  }
  soDu = soDu - khoan.soTien
  ghiDong("-", khoan)
})`

// ── Bước 4: báo cáo theo kỳ bằng SQL ────────────────────────────────────────────────────────

/** Khung bảng của CSDL sổ quỹ — hai bộ dữ liệu dưới đây dùng chung. */
const SQL_KHUNG_QUY = `CREATE TABLE hang_muc (
  id INTEGER PRIMARY KEY,
  ten TEXT NOT NULL
);
CREATE TABLE khoan_chi (
  id INTEGER PRIMARY KEY,
  hang_muc_id INTEGER NOT NULL,
  ngay TEXT NOT NULL,
  noi_dung TEXT NOT NULL,
  so_tien INTEGER NOT NULL
);
INSERT INTO hang_muc (id, ten) VALUES
  (1, 'Hoat dong'), (2, 'Hoc tap'), (3, 'Qua tang'), (4, 'Ve sinh'), (5, 'Du lich');`

/** Bộ dữ liệu học viên được xem (mô tả trong đề): kỳ tháng 11 có hai mục HOÀ 350.000, có khoản
 *  chi ĐÚNG ngày đầu kỳ (01/11) và ngày đầu kỳ sau (01/12) để bắt sai ranh giới. */
export const T2_SQL_SO_QUY = `${SQL_KHUNG_QUY}
INSERT INTO khoan_chi (id, hang_muc_id, ngay, noi_dung, so_tien) VALUES
  (1, 2, '2026-10-15', 'Photo de cuong giua ky', 120000),
  (2, 5, '2026-10-20', 'Coc xe da ngoai', 400000),
  (3, 4, '2026-11-01', 'Khau trang', 30000),
  (4, 3, '2026-11-18', 'Hoa 20/11', 300000),
  (5, 3, '2026-11-20', 'Thiep 20/11', 50000),
  (6, 1, '2026-11-22', 'Nuoc uong van nghe', 150000),
  (7, 2, '2026-11-25', 'Photo de cuong cuoi ky', 200000),
  (8, 1, '2026-11-30', 'Thue trang phuc', 200000),
  (9, 4, '2026-12-01', 'Choi lau nha', 80000);`

/** Bộ dữ liệu ẨN — số khác hẳn, để câu truy vấn gõ cứng kết quả của bộ trên không qua được. */
const SQL_SO_QUY_AN = `${SQL_KHUNG_QUY}
INSERT INTO khoan_chi (id, hang_muc_id, ngay, noi_dung, so_tien) VALUES
  (1, 1, '2026-11-05', 'Bong chuyen', 90000),
  (2, 2, '2026-11-06', 'Sach tham khao', 150000),
  (3, 1, '2026-11-28', 'Nuoc uong', 60000),
  (4, 2, '2026-10-31', 'Photo', 40000),
  (5, 3, '2026-12-02', 'Qua Noel', 200000);`

const P3_S4_CODE = `SELECT hm.ten AS hang_muc, SUM(kc.so_tien) AS tong_chi
FROM khoan_chi kc
JOIN hang_muc hm ON hm.id = kc.hang_muc_id
WHERE kc.ngay >= '2026-11-01' AND kc.ngay < '2026-12-01'
GROUP BY hm.ten
ORDER BY tong_chi DESC, hang_muc ASC;`

// ── Bước 5: trang minh bạch lấy sổ từ API ───────────────────────────────────────────────────

/** Trang minh bạch có sẵn của bước 5 — học viên KHÔNG sửa, chỉ viết minh_bach.js. */
const TRANG_MINH_BACH = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>Minh bach quy lop</title>
  </head>
  <body>
    <h1>Minh bach quy lop 10A1</h1>
    <p id="tong-thu"></p>
    <p id="tong-chi"></p>
    <p id="so-du"></p>
    <ul id="so"></ul>
    <label for="o-ma">Ma chung tu</label>
    <input id="o-ma" type="text" />
    <button id="nut-xem">Xem chung tu</button>
    <p id="chi-tiet"></p>
  </body>
</html>`

const P3_S5_CODE = `const soEl = document.getElementById("so")

// Một dòng sổ: "<ngay> <noi dung>: +<tien>" (thu) hoặc "-<tien>" (chi)
function dongGiaoDich(gd) {
  const dau = gd.loai === "thu" ? "+" : "-"
  return gd.ngay + " " + gd.noi_dung + ": " + dau + gd.so_tien
}

async function taiSo() {
  const res = await fetch("/api/quy")
  const ds = await res.json()
  let thu = 0
  let chi = 0
  for (const gd of ds) {
    if (gd.loai === "thu") {
      thu = thu + gd.so_tien
    } else {
      chi = chi + gd.so_tien
    }
    const li = document.createElement("li")
    li.textContent = dongGiaoDich(gd)
    soEl.appendChild(li)
  }
  document.getElementById("tong-thu").textContent = "Tong thu: " + thu
  document.getElementById("tong-chi").textContent = "Tong chi: " + chi
  document.getElementById("so-du").textContent = "So du: " + (thu - chi)
}

taiSo()

document.getElementById("nut-xem").addEventListener("click", async () => {
  const ma = document.getElementById("o-ma").value.trim()
  const chiTiet = document.getElementById("chi-tiet")
  const res = await fetch("/api/quy?ma=" + encodeURIComponent(ma))
  if (!res.ok) {
    chiTiet.textContent = "Khong tim thay chung tu " + ma
    return
  }
  const gd = await res.json()
  chiTiet.textContent = gd.ma + " | " + dongGiaoDich(gd)
})`

export const T2_P3_PROJECT_STEPS: ProjectStep[] = [
  {
    id: 't2-p3-s1',
    isMilestone: false,
    language: 'html',
    files: [T2_P3_PAGE_FILE],
    title: 'Trang minh bạch quỹ — bảng thu chi bằng HTML',
    unitId: 'p3-u4',
    requirement:
      'Quỹ lớp minh bạch nghĩa là ai cũng XEM được, không phải xin thủ quỹ mở sổ. Viết trang_quy.html:\n\n1. Khung trang chuẩn: <html lang="vi">, trong <head> có <meta charset="utf-8" /> và <title>Quy lop 10A1</title>.\n2. <h1>Quy lop 10A1</h1>\n3. Một đoạn <p class="so-du"> ghi: So du: 1050000\n4. Một bảng <table class="bang-quy"> gồm:\n   - <thead> có một hàng tiêu đề ba ô <th>: Ngay · Noi dung · So tien\n   - <tbody> có ba hàng <td>, mỗi hàng một giao dịch (KHÔNG DẤU):\n     05/09 · Thu quy thang 9 · +2000000\n     20/11 · Mua hoa 20/11 · -450000\n     25/11 · Photo de cuong · -500000\n5. Một liên kết <a> tới trang báo cáo: href="bao_cao.html", chữ "Bao cao theo thang".\n\nVì sao dùng <th> chứ không tô đậm <td>: trình đọc màn hình của bạn khiếm thị đọc tiêu đề cột kèm mỗi ô — bảng tiền mà thiếu tiêu đề thì nghe chỉ là một dãy số rời rạc.',
    hint: 'Bảng HTML: <table> chứa <thead> và <tbody>; mỗi hàng là <tr>, ô tiêu đề là <th>, ô dữ liệu là <td>. Số dư 1050000 = 2000000 − 450000 − 500000 — tự nhẩm lại cho quen tay của thủ quỹ.',
    referenceCode: P3_S1_CODE,
    checks: [
      tc([], 'html lang="vi"', 'Thẻ html khai báo ngôn ngữ tiếng Việt'),
      tc([], 'meta charset="utf-8"', 'Có khai báo bảng mã (tiếng Việt không lỗi phông)'),
      tc([], 'title "Quy lop 10A1"', 'Tiêu đề trang đúng'),
      tc([], 'h1 "Quy lop 10A1"', 'Tên quỹ là tiêu đề lớn nhất trang'),
      tc([], 'p class="so-du" "So du: 1050000"', 'Số dư hiện rõ, có class để làm đẹp ở bước sau'),
      tc([], 'th "Noi dung"', 'Bảng có hàng tiêu đề dùng thẻ th'),
      tc([], 'td "-450000"', 'Bảng có đủ các giao dịch'),
      tc(
        [],
        'a href="bao_cao.html" "Bao cao theo thang"',
        'Ca ẩn: liên kết sang trang báo cáo',
        true,
      ),
    ],
  },
  {
    id: 't2-p3-s2',
    isMilestone: false,
    language: 'html',
    files: [T2_P3_PAGE_FILE],
    title: 'Làm đẹp bằng CSS — bảng tiền đọc được trên điện thoại',
    unitId: 'p3-u5',
    requirement:
      'Phụ huynh và các bạn sẽ mở trang này bằng điện thoại. Giữ NGUYÊN nội dung bước 1, thêm thẻ <style> trong <head> với các luật sau:\n\n1. body: font-family: sans-serif; line-height: 1.5; margin: 16px\n2. h1: color: #1f4e8c; font-size: 24px\n3. .so-du: font-size: 20px; font-weight: bold\n4. .bang-quy: border-collapse: collapse; width: 100%\n5. .bang-quy td: border-bottom: 1px solid #ddd; padding: 8px\n6. a: display: inline-block; min-height: 44px; padding: 12px 0\n\nLuật 4 là phần "mobile-first" của bước này: bảng rộng đúng 100% khung màn hình thay vì tràn ngang bắt người xem phải kéo. Luật 6 cho liên kết vùng chạm ít nhất 44px để ngón tay bấm trúng.',
    hint: 'Đặt <style> ... </style> trong <head>, sau <title>. Bộ chọn ".bang-quy td" nghĩa là "mọi ô td nằm trong phần tử có class bang-quy". Thứ tự các khai báo trong một luật không quan trọng — bộ chấm tự sắp lại.',
    referenceCode: P3_S2_CODE,
    checks: [
      tc(
        [],
        'body { font-family: sans-serif; line-height: 1.5; margin: 16px }',
        'Nền trang có phông, giãn dòng và lề',
      ),
      tc([], 'h1 { color: #1f4e8c; font-size: 24px }', 'Tiêu đề có màu và cỡ chữ riêng'),
      tc([], '.so-du { font-size: 20px; font-weight: bold }', 'Số dư nổi bật nhất trang'),
      tc(
        [],
        '.bang-quy { border-collapse: collapse; width: 100% }',
        'Bảng vừa khít màn hình điện thoại',
      ),
      tc(
        [],
        '.bang-quy td { border-bottom: 1px solid #ddd; padding: 8px }',
        'Mỗi hàng giao dịch có đường kẻ và khoảng thở',
      ),
      tc(
        [],
        'a { display: inline-block; min-height: 44px; padding: 12px 0 }',
        'Liên kết đủ 44px cho ngón tay',
      ),
      tc([], 'td "Mua hoa 20/11"', 'Ca ẩn: nội dung bước 1 KHÔNG được mất khi thêm CSS', true),
      tc([], 'table class="bang-quy"', 'Ca ẩn: bảng vẫn mang class mà CSS nhắm tới', true),
    ],
  },
  {
    id: 't2-p3-s3',
    isMilestone: false,
    language: 'dom',
    files: [T2_P3_ENTRY_FILE],
    domHtml: TRANG_GHI_SO,
    title: 'Trang ghi sổ của thủ quỹ — JavaScript giữ số dư',
    unitId: 'p3-u6',
    requirement:
      'Trang ghi sổ đã dựng sẵn (bạn KHÔNG sửa HTML, chỉ viết ghi_so.js):\n- ô #o-noi-dung, ô #o-so-tien\n- nút #nut-thu (ghi khoản thu), nút #nut-chi (ghi khoản chi)\n- danh sách #so, đoạn #so-du\n\nYêu cầu:\n1. NGAY khi script chạy: #so-du hiện "So du: 0".\n2. Khoản nhập bậy — nội dung trống, hoặc số tiền không phải số nguyên lớn hơn 0 → #so-du hiện "Du lieu khong hop le", không ghi gì.\n3. Bấm #nut-thu với khoản hợp lệ → thêm một <li> vào #so dạng "+<so tien> <noi dung>", cộng vào số dư, #so-du hiện "So du: <so du>".\n4. Bấm #nut-chi với khoản hợp lệ:\n   - số tiền vượt số dư → #so-du hiện "Khong du quy", không ghi gì (chi đúng bằng số dư vẫn được);\n   - ngược lại → thêm <li> dạng "-<so tien> <noi dung>", trừ số dư, cập nhật #so-du.\n\nĐây chính là luật của sổ P1/P2, nay chạy trong trình duyệt.',
    hint: 'Giữ let soDu = 0 BÊN NGOÀI hai hàm xử lý nút để nó sống qua các lần bấm. Viết một hàm docKhoan() đọc hai ô và trả null khi nhập bậy — hai nút cùng gọi, khỏi chép đoạn kiểm hai lần. Number.isInteger(x) cho biết x có phải số nguyên không.',
    referenceCode: P3_S3_CODE,
    checks: [
      tc([], 'p id="so-du" "So du: 0"', 'Trang vừa mở đã hiện số dư 0'),
      tc(
        ['dien #o-noi-dung = Thu quy thang 9', 'dien #o-so-tien = 2000000', 'click #nut-thu'],
        'li "+2000000 Thu quy thang 9"',
        'Ghi một khoản thu vào sổ',
      ),
      tc(
        [
          'dien #o-noi-dung = Thu quy thang 9',
          'dien #o-so-tien = 2000000',
          'click #nut-thu',
          'dien #o-noi-dung = Mua hoa 20/11',
          'dien #o-so-tien = 450000',
          'click #nut-chi',
        ],
        'p id="so-du" "So du: 1550000"',
        'Thu rồi chi: số dư trừ đúng',
      ),
      tc(
        [
          'dien #o-noi-dung = Thu quy thang 9',
          'dien #o-so-tien = 2000000',
          'click #nut-thu',
          'dien #o-noi-dung = Mua hoa 20/11',
          'dien #o-so-tien = 450000',
          'click #nut-chi',
        ],
        'li "-450000 Mua hoa 20/11"',
        'Khoản chi hiện trong sổ với dấu trừ',
      ),
      tc(
        ['dien #o-noi-dung = Lien hoan', 'dien #o-so-tien = 300000', 'click #nut-chi'],
        'p id="so-du" "Khong du quy"',
        'Ca ẩn: quỹ đang 0 đồng thì không chi được',
        true,
      ),
      tc(
        ['dien #o-noi-dung = Thu quy', 'dien #o-so-tien = -5000', 'click #nut-thu'],
        'p id="so-du" "Du lieu khong hop le"',
        'Ca ẩn: số tiền âm bị chặn',
        true,
      ),
      tc(
        ['dien #o-so-tien = 50000', 'click #nut-thu'],
        'p id="so-du" "Du lieu khong hop le"',
        'Ca ẩn: khoản thu không ghi nội dung bị chặn',
        true,
      ),
      tc(
        [
          'dien #o-noi-dung = Thu quy',
          'dien #o-so-tien = 300000',
          'click #nut-thu',
          'dien #o-noi-dung = Lien hoan',
          'click #nut-chi',
        ],
        'li "-300000 Lien hoan"',
        'Ca ẩn: chi vừa đúng bằng số dư vẫn được',
        true,
      ),
    ],
  },
  {
    id: 't2-p3-s4',
    isMilestone: false,
    language: 'sql',
    files: [T2_P3_REPORT_FILE],
    title: 'Báo cáo theo kỳ bằng SQL — tháng này chi vào đâu',
    unitId: 'p3-u9',
    requirement:
      'Cuối tháng, cô chủ nhiệm hỏi: "Tháng 11 lớp mình chi vào những việc gì, mỗi việc bao nhiêu?" Sổ CSV của chặng P2 phải viết vòng lặp mới trả lời được; SQL trả lời bằng MỘT câu.\n\nCSDL sổ quỹ có hai bảng:\n- hang_muc(id, ten) — Hoat dong · Hoc tap · Qua tang · Ve sinh · Du lich\n- khoan_chi(id, hang_muc_id, ngay, noi_dung, so_tien) — ngày dạng YYYY-MM-DD, có cả khoản của tháng 10 và tháng 12.\n\nViết vào bao_cao.sql MỘT câu truy vấn báo cáo chi theo hạng mục của KỲ THÁNG 11/2026:\n- cột 1 tên "hang_muc": tên hạng mục\n- cột 2 tên "tong_chi": tổng tiền đã chi cho mục đó trong kỳ\n- CHỈ tính khoản chi có ngày từ 2026-11-01 đến hết 2026-11-30\n- sắp xếp tong_chi giảm dần; hai mục bằng tiền thì mục có tên đứng trước bảng chữ cái xếp trên.\n\nBẪY CỦA BÁO CÁO THEO KỲ là hai ngày ranh giới: khoản chi ngày 01/11 PHẢI có mặt, khoản ngày 01/12 thì KHÔNG. Bộ chấm còn chạy câu của bạn trên một sổ quỹ thứ hai với số liệu khác — câu nào gõ cứng con số sẽ không qua.',
    hint: "Nối bảng: FROM khoan_chi kc JOIN hang_muc hm ON hm.id = kc.hang_muc_id. Lọc kỳ TRƯỚC khi gom: WHERE kc.ngay >= '2026-11-01' AND kc.ngay < '2026-12-01' — ngày dạng năm-tháng-ngày nên so chuỗi cũng đúng thứ tự thời gian. Rồi GROUP BY hm.ten và ORDER BY tong_chi DESC, hang_muc ASC.",
    referenceCode: P3_S4_CODE,
    checks: [
      tc(
        [],
        'hang_muc | tong_chi',
        'Đặt đúng tên hai cột báo cáo',
        false,
        'contains',
        T2_SQL_SO_QUY,
      ),
      tc(
        [],
        'Qua tang | 350000',
        'Cộng đúng các khoản cùng hạng mục',
        false,
        'contains',
        T2_SQL_SO_QUY,
      ),
      tc(
        [],
        'Ve sinh | 30000',
        'Khoản chi ngày đầu kỳ 01/11 được tính, ngày 01/12 thì không',
        false,
        'contains',
        T2_SQL_SO_QUY,
      ),
      tc(
        [],
        'hang_muc | tong_chi\nHoat dong | 350000\nQua tang | 350000\nHoc tap | 200000\nVe sinh | 30000',
        'Ca ẩn: đúng 4 mục, đúng thứ tự, hoà tiền thì xếp theo tên',
        true,
        'exact',
        T2_SQL_SO_QUY,
      ),
      tc(
        [],
        'hang_muc | tong_chi\nHoat dong | 150000\nHoc tap | 150000',
        'Ca ẩn: sổ quỹ thứ hai, số liệu khác — câu truy vấn không gõ cứng kết quả',
        true,
        'exact',
        SQL_SO_QUY_AN,
      ),
    ],
  },
  {
    id: 't2-p3-s5',
    isMilestone: true,
    language: 'fetch',
    files: [T2_P3_PUBLIC_FILE],
    domHtml: TRANG_MINH_BACH,
    title: 'Milestone P3 — trang minh bạch tự lấy sổ quỹ từ API',
    unitId: 'p3-u7',
    requirement:
      'Bước chốt chặng: bảng thu chi của bước 1 là gõ tay — thủ quỹ ghi thêm một khoản là phải sửa trang. Giờ trang minh bạch LẤY SỔ TỪ API: thủ quỹ ghi một chỗ, cả lớp thấy ngay.\n\nAPI mẫu của quỹ lớp:\n- /api/quy → mảng giao dịch {ma, ngay, loai, noi_dung, so_tien}, loai là "thu" hoặc "chi".\n- /api/quy?ma=<ma chung tu> → MỘT giao dịch; mã không có thì trả mã lỗi 404.\n\nTrang đã dựng sẵn (bạn chỉ viết minh_bach.js): #tong-thu, #tong-chi, #so-du, danh sách #so, ô #o-ma, nút #nut-xem, đoạn #chi-tiet.\n\nYêu cầu:\n1. Khi script chạy: gọi /api/quy, với MỖI giao dịch thêm một <li> vào #so dạng "<ngay> <noi dung>: +<so tien>" (khoản thu) hoặc "-<so tien>" (khoản chi). Rồi đặt #tong-thu "Tong thu: <t>", #tong-chi "Tong chi: <t>", #so-du "So du: <thu − chi>".\n2. Bấm #nut-xem: gọi /api/quy?ma=<mã đã gõ>.\n   - tìm thấy → #chi-tiet hiện "<ma> | <dong giao dich nhu muc 1>"\n   - 404 → #chi-tiet hiện "Khong tim thay chung tu <ma da go>"\n\nKHÔNG gõ cứng con số nào: sổ trên API có giao dịch không hề có trong bảng bước 1.',
    hint: 'Trong hàm async taiSo(): const ds = await (await fetch("/api/quy")).json(), rồi duyệt ds vừa cộng dồn thu/chi vừa thêm <li>. Viết riêng một hàm dongGiaoDich(gd) dựng chuỗi một dòng — danh sách và ô chi tiết cùng dùng. Phân biệt 404 bằng res.ok (false khi mã lỗi), và nhớ encodeURIComponent(ma) khi ghép vào địa chỉ.',
    referenceCode: P3_S5_CODE,
    checks: [
      tc([], 'p id="so-du" "So du: 3380000"', 'Số dư tính từ toàn bộ sổ trên API'),
      tc([], 'p id="tong-chi" "Tong chi: 570000"', 'Tổng chi cộng đúng các khoản chi'),
      tc([], 'li "2026-11-18 Hoa 20/11: -300000"', 'Mỗi giao dịch thành một dòng sổ có dấu'),
      tc(
        ['dien #o-ma = C02', 'click #nut-xem'],
        'p id="chi-tiet" "C02 | 2026-11-18 Hoa 20/11: -300000"',
        'Tra một chứng từ theo mã',
      ),
      tc(
        [],
        'li "2026-10-05 Thu quy thang 10: +1950000"',
        'Ca ẩn: giao dịch CHỈ có trên API cũng hiện ra (không gõ cứng bảng cũ)',
        true,
      ),
      tc(
        ['dien #o-ma = X99', 'click #nut-xem'],
        'p id="chi-tiet" "Khong tim thay chung tu X99"',
        'Ca ẩn: mã không có thì báo rõ, không vỡ trang',
        true,
      ),
      tc(
        [],
        'p id="tong-thu" "Tong thu: 3950000"',
        'Ca ẩn: tổng thu cộng đủ hai đợt đóng quỹ',
        true,
      ),
    ],
  },
]
