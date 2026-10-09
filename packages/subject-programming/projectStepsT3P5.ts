// projectStepsT3P5 — DỰ ÁN TRỤC T3 "Sổ học tập của tôi", CHẶNG P5 "Sổ học tập lên Internet".
// Cùng nhịp và cùng RANH GIỚI với chặng P5 của T1 (projectStepsP5.ts,
// docs/research/dac-ta-bac-p5-deploy-va-lan-c-2026-08-26.md):
// - Đo hiệu năng chấm bằng PHÉP ĐẾM, không bằng số giây — bước 3 đếm phép so.
// - Deploy KHÔNG mô phỏng. Bước 4 chấm phần đo được (cấu hình đọc từ môi trường, bí mật không lộ,
//   địa chỉ công khai phải là https); thao tác trên nền tảng và URL sống thuộc làn C, nằm ở phần
//   yêu cầu của bước milestone, do học viên tự khai + nộp bằng chứng.
//
// Khác T1 ở CHỦ ĐỀ bảo mật/hiệu năng cho đúng sản phẩm: sổ học tập có trang tài liệu CÔNG KHAI,
// nên bước bảo mật dạy chống chèn mã (XSS) và kiểm quyền xem tài liệu riêng (hai mục OWASP còn
// lại sau SQL injection mà T1 đã dạy); bước hiệu năng là lọc thẻ ôn trùng trong bộ 1.000 thẻ.
//
// Bốn bước đầu chạy làn `python` thuần (sqlite3, html, os.environ đều có thật trong Pyodide),
// bước milestone chạy làn `apisim`. Mọi dòng chấm điểm in KHÔNG DẤU; LUẬT ĐIỂM giữ nguyên từ chặng
// P1 (hệ số 1/2/3, làm tròn 1 chữ số).
import { TestCaseSchema, type ProgrammingTestCase } from './lessonTypes.js'
// Xuống projectStepTypes (KHÔNG phải projectSteps/projectStepsT3) — tránh chu trình import.
import type { ProjectStep } from './projectStepTypes.js'

export const T3_P5_MAIN_FILE = 'so_hoc_tap.py'
export const T3_P5_API_FILE = 'api.py'

const tc = (
  stdinLines: string[],
  expected: string,
  label: string,
  hidden = false,
): ProgrammingTestCase => TestCaseSchema.parse({ stdinLines, expected, label, hidden })

export const T3_P5_PROJECT_STEPS: ProjectStep[] = [
  {
    id: 't3-p5-s1',
    isMilestone: false,
    files: [T3_P5_MAIN_FILE],
    title: 'Dựng lại CSDL sổ điểm cho tử tế — ràng buộc và giao dịch',
    unitId: 'p5-u5',
    requirement:
      'Tới bậc này, sổ học tập không chỉ tính đúng — nó phải KHÔNG CHO dữ liệu sai vào, kể cả khi code giao diện lỡ quên kiểm.\n\nViết lại so_hoc_tap.py dùng sqlite3 trong bộ nhớ, bật PRAGMA foreign_keys = ON, và dựng:\n\n1. mon_hoc — id INTEGER PRIMARY KEY, ten TEXT NOT NULL UNIQUE. Nạp đúng 3 môn: (1, toan) · (2, van) · (3, anh).\n2. diem — id INTEGER PRIMARY KEY, mon_id trỏ tới mon_hoc(id), he_so INTEGER NOT NULL CHECK (he_so IN (1, 2, 3)), diem REAL NOT NULL CHECK (diem BETWEEN 0 AND 10).\n3. Một index trên diem(mon_id) — mọi báo cáo đều lọc theo môn.\n\nChương trình đọc input() tên môn (bỏ khoảng trắng thừa, không phân biệt hoa/thường), rồi điểm thường xuyên, giữa kỳ, cuối kỳ. Tra môn bằng tham số ?, KHÔNG ghép chuỗi.\n- Không có môn → in "Khong co mon nay".\n- Có môn → ghi BA dòng điểm (hệ số 1, 2, 3) trong MỘT giao dịch: đủ cả ba thì commit và in "Da ghi bang diem"; một dòng bị CHECK từ chối thì rollback cả ba và in "Khong ghi: diem khong hop le". Sau đó đọc lại TỪ CSDL bằng một câu SELECT và in:\n  So dong diem: <so dong cua mon>\n  DTB: <ROUND(SUM(diem * he_so) / SUM(he_so), 1)>   (chưa có dòng nào thì in "DTB: chua co")\n\nCuối chương trình, dù có môn hay không, thử ghi một dòng điểm rác cho môn 99 (không tồn tại). Bắt sqlite3.IntegrityError, rollback, in "Chan rac: OK"; nếu ghi vào được thì in "Chan rac: KHONG".',
    hint: 'Đừng kiểm thang điểm bằng if trong Python ở bước này — để CHECK của CSDL làm, đó chính là điều cần học. Ghi ba dòng rồi mới db.commit() MỘT lần; bọc cả khối trong try/except sqlite3.IntegrityError và db.rollback() — dòng đầu đã ghi cũng bị hoàn tác. SUM trên 0 dòng ra None, nên kiểm "is None" trước khi in.',
    referenceCode: `import sqlite3

MON = [(1, "toan"), (2, "van"), (3, "anh")]

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")          # thiếu dòng này là khoá ngoại chỉ để trang trí
db.execute("""CREATE TABLE mon_hoc (
    id INTEGER PRIMARY KEY,
    ten TEXT NOT NULL UNIQUE)""")
db.execute("""CREATE TABLE diem (
    id INTEGER PRIMARY KEY,
    mon_id INTEGER NOT NULL REFERENCES mon_hoc(id),
    he_so INTEGER NOT NULL CHECK (he_so IN (1, 2, 3)),
    diem REAL NOT NULL CHECK (diem BETWEEN 0 AND 10))""")
db.execute("CREATE INDEX idx_diem_mon ON diem(mon_id)")
db.executemany("INSERT INTO mon_hoc (id, ten) VALUES (?, ?)", MON)
db.commit()

ten = input("Mon: ").strip().lower()
tx = float(input("Thuong xuyen: "))
gk = float(input("Giua ky: "))
ck = float(input("Cuoi ky: "))

mon = db.execute("SELECT id FROM mon_hoc WHERE ten = ?", (ten,)).fetchone()
if mon is None:
    print("Khong co mon nay")
else:
    try:
        for d, he_so in [(tx, 1), (gk, 2), (ck, 3)]:
            db.execute(
                "INSERT INTO diem (mon_id, he_so, diem) VALUES (?, ?, ?)", (mon[0], he_so, d)
            )
        db.commit()                              # BA dòng ghi, MỘT lần chốt
        print("Da ghi bang diem")
    except sqlite3.IntegrityError:
        db.rollback()                            # dòng đã ghi trước đó cũng bị hoàn tác
        print("Khong ghi: diem khong hop le")
    so_dong, dtb = db.execute(
        "SELECT COUNT(*), ROUND(SUM(diem * he_so) / SUM(he_so), 1) FROM diem WHERE mon_id = ?",
        (mon[0],),
    ).fetchone()
    print(f"So dong diem: {so_dong}")
    print(f"DTB: {'chua co' if dtb is None else dtb}")

try:
    db.execute("INSERT INTO diem (mon_id, he_so, diem) VALUES (99, 1, 5)")
    db.commit()
    print("Chan rac: KHONG")
except sqlite3.IntegrityError:
    db.rollback()
    print("Chan rac: OK")`,
    checks: [
      tc(['toan', '8', '7', '9'], 'DTB: 8.2', 'CSDL tự tính ĐTB đúng hệ số (49/6)'),
      tc(['toan', '8', '7', '9'], 'So dong diem: 3', 'Ghi đủ ba dòng điểm'),
      tc(['  VAN ', '6', '7.5', '7'], 'DTB: 7.0', 'Tên môn bẩn vẫn tra ra'),
      tc(['ly', '8', '8', '8'], 'Khong co mon nay', 'Môn ngoài sổ — trả lời êm, không nổ lỗi'),
      tc(['toan', '8', '11', '9'], 'Khong ghi: diem khong hop le', 'CHECK của CSDL chặn điểm 11'),
      tc(
        ['toan', '8', '11', '9'],
        'So dong diem: 0',
        'Ca ẩn: TẤT CẢ hoặc KHÔNG — dòng điểm 8 ghi trước đó cũng phải bị hoàn tác',
        true,
      ),
      tc(
        ['anh', '7', '7', '7'],
        'Chan rac: OK',
        'Ca ẩn: khoá ngoại chặn dòng điểm trỏ tới môn không có thật',
        true,
      ),
    ],
  },
  {
    id: 't3-p5-s2',
    isMilestone: false,
    files: [T3_P5_MAIN_FILE],
    title: 'Trang tài liệu công khai — không cho chèn mã, không lộ tài liệu riêng',
    unitId: 'p5-u6',
    requirement:
      'Trang tài liệu của bạn sắp mở cho cả trường xem. Hai lỗ hổng phổ biến nhất của một trang công khai: kẻ lạ CHÈN MÃ vào tên tài liệu (XSS), và người lạ XEM ĐƯỢC tài liệu riêng (kiểm quyền hỏng).\n\nTrong so_hoc_tap.py:\n1. TAI_LIEU là danh sách dict {ten, mon, chu, cong_khai}, nạp sẵn đúng 3 mục theo thứ tự:\n   (De cuong Toan HK1, toan, lan, công khai) · (Bai giai de thi thu, toan, lan, RIÊNG) · (Tu vung Anh Unit 1-5, anh, minh, công khai)\n2. duoc_xem(tl, nguoi_xem) — True nếu tài liệu công khai HOẶC người xem chính là chủ.\n3. trang_tai_lieu(ds, nguoi_xem) — trả về MỘT chuỗi HTML "<ul>" + mỗi tài liệu xem được một "<li><ten> (<mon>)</li>" + "</ul>", giữ thứ tự danh sách. Tên và môn PHẢI qua html.escape trước khi ghép.\n\nChương trình đọc input() lần lượt: người xem (bỏ khoảng trắng thừa, viết thường), tên một tài liệu mới của lan (môn van), và "co"/"khong" cho công khai. Thêm tài liệu đó vào CUỐI danh sách rồi in đúng hai dòng:\nTrang: <chuoi HTML>\nSo muc xem duoc: <so the li>\n\nCó ca kiểm gõ vào tên tài liệu một đoạn <script> thật. Không escape thì trình duyệt của MỌI người mở trang sẽ chạy mã đó.',
    hint: 'import html rồi html.escape(chuoi) đổi < > & " thành &lt; &gt; &amp; &quot; — trình duyệt hiện đúng chữ nhưng không coi là thẻ. Lọc quyền bằng list comprehension: [tl for tl in ds if duoc_xem(tl, nguoi_xem)]. Đếm mục: chuỗi.count("<li>").',
    referenceCode: `import html

TAI_LIEU = [
    {"ten": "De cuong Toan HK1", "mon": "toan", "chu": "lan", "cong_khai": True},
    {"ten": "Bai giai de thi thu", "mon": "toan", "chu": "lan", "cong_khai": False},
    {"ten": "Tu vung Anh Unit 1-5", "mon": "anh", "chu": "minh", "cong_khai": True},
]


def duoc_xem(tl, nguoi_xem):
    # Kiểm quyền ở MỘT chỗ: công khai, hoặc chính chủ
    return tl["cong_khai"] or tl["chu"] == nguoi_xem


def trang_tai_lieu(ds, nguoi_xem):
    dong = [
        f"<li>{html.escape(tl['ten'])} ({html.escape(tl['mon'])})</li>"   # escape TRƯỚC khi ghép
        for tl in ds
        if duoc_xem(tl, nguoi_xem)
    ]
    return "<ul>" + "".join(dong) + "</ul>"


nguoi_xem = input("Nguoi xem: ").strip().lower()
ten_moi = input("Tai lieu moi cua lan: ")
cong_khai = input("Cong khai (co/khong): ").strip().lower() == "co"
TAI_LIEU.append({"ten": ten_moi, "mon": "van", "chu": "lan", "cong_khai": cong_khai})

trang = trang_tai_lieu(TAI_LIEU, nguoi_xem)
print(f"Trang: {trang}")
print(f"So muc xem duoc: {trang.count('<li>')}")`,
    checks: [
      tc(
        ['minh', 'Tom tat Van 11', 'co'],
        'Trang: <ul><li>De cuong Toan HK1 (toan)</li><li>Tu vung Anh Unit 1-5 (anh)</li><li>Tom tat Van 11 (van)</li></ul>',
        'Người khác chỉ thấy tài liệu công khai, đúng thứ tự',
      ),
      tc(['lan', 'Tom tat Van 11', 'khong'], 'So muc xem duoc: 4', 'Chủ thấy cả tài liệu riêng'),
      tc(
        ['minh', '<script>alert(1)</script>', 'co'],
        '<li>&lt;script&gt;alert(1)&lt;/script&gt; (van)</li>',
        'TẤN CÔNG THẬT: thẻ script bị vô hiệu hoá thành chữ',
      ),
      tc(
        ['khach', 'Ghi chu rieng', 'khong'],
        'So muc xem duoc: 2',
        'Ca ẩn: người lạ không thấy tài liệu riêng nào',
        true,
      ),
      tc(
        ['  LAN ', 'Ghi chu rieng', 'khong'],
        'So muc xem duoc: 4',
        'Ca ẩn: tên người xem gõ hoa/thừa khoảng trắng vẫn nhận đúng chủ',
        true,
      ),
      tc(
        ['minh', 'Meo "hoc nhanh" & nho lau', 'co'],
        '<li>Meo &quot;hoc nhanh&quot; &amp; nho lau (van)</li>',
        'Ca ẩn: dấu nháy và & cũng được escape',
        true,
      ),
    ],
  },
  {
    id: 't3-p5-s3',
    isMilestone: false,
    files: [T3_P5_MAIN_FILE],
    title: 'Đo và sửa một điểm chậm — lọc thẻ ôn trùng trong 1.000 thẻ',
    unitId: 'p5-u7',
    requirement:
      'Bạn gộp thẻ ôn từ vở của cả nhóm, bộ thẻ đã 1.000 tấm và nút "lọc thẻ trùng" bắt đầu ì ạch. Bước này: đo trước, sửa một chỗ, đo lại.\n\nBộ thẻ sinh bằng công thức (để thử được ở quy mô thật):\nTHE = [f"tu-{(i * 37) % 250}" for i in range(n)]\n\nViết hai hàm, mỗi hàm trả về (so_phep_so, so_the_trung):\n\n1. dem_trung_cham(the) — với MỖI thẻ i, so với MỌI thẻ đứng trước nó (j < i), không dừng sớm; cộng 1 vào biến đếm mỗi lần so. Thẻ i tính là trùng nếu có ít nhất một thẻ trước bằng nó.\n2. dem_trung_nhanh(the) — dùng một set các thẻ đã gặp, duyệt bộ thẻ ĐÚNG MỘT LƯỢT; cộng 1 vào biến đếm mỗi thẻ.\n\nChương trình đọc input() một dòng là n, dựng bộ thẻ, chạy cả hai hàm rồi in đúng bốn dòng:\nCham: <so phep so> phep so\nNhanh: <so phep so> phep so\nGiong nhau: True\nSo the trung: <so the trung>\n\nDòng "Giong nhau" là điều kiện của mọi việc tối ưu: đổi cái giá, KHÔNG đổi kết quả.',
    hint: 'Cách chậm là hai vòng lồng nhau: for i in range(len(the)) rồi for j in range(i) — tổng số lần so là n × (n − 1) / 2, tăng theo BÌNH PHƯƠNG. Cách nhanh: "t in da_gap" với da_gap là set mất thời gian gần như không đổi, nên tổng chỉ tỉ lệ với n. Tạo set TRƯỚC vòng lặp.',
    referenceCode: `def dem_trung_cham(the):
    dem = 0
    trung = 0
    for i in range(len(the)):
        da_co = False
        for j in range(i):                 # so voi MOI the dung truoc, khong dung som
            dem += 1
            if the[j] == the[i]:
                da_co = True
        if da_co:
            trung += 1
    return dem, trung


def dem_trung_nhanh(the):
    da_gap = set()                         # dung MOT lan, ngoai vong lap
    dem = 0
    trung = 0
    for t in the:                          # dung MOT luot qua bo the
        dem += 1
        if t in da_gap:
            trung += 1
        else:
            da_gap.add(t)
    return dem, trung


n = int(input("So the: "))
THE = [f"tu-{(i * 37) % 250}" for i in range(n)]

cham, trung_cham = dem_trung_cham(THE)
nhanh, trung_nhanh = dem_trung_nhanh(THE)

print(f"Cham: {cham} phep so")
print(f"Nhanh: {nhanh} phep so")
print(f"Giong nhau: {trung_cham == trung_nhanh}")
print(f"So the trung: {trung_nhanh}")`,
    checks: [
      tc(
        ['1000'],
        'Cham: 499500 phep so',
        'Quy mô thật: so từng cặp = 1000 × 999 / 2 = 499.500 phép so',
      ),
      tc(['1000'], 'Nhanh: 1000 phep so', 'Dùng set: đúng một lượt qua bộ thẻ — ít hơn ~500 lần'),
      tc(['1000'], 'Giong nhau: True', 'Tối ưu KHÔNG được làm đổi kết quả'),
      tc(['1000'], 'So the trung: 750', '1.000 thẻ chỉ có 250 thẻ khác nhau'),
      tc(['300'], 'Cham: 44850 phep so', 'Ca ẩn: quy mô nhỏ hơn — số phép so theo n²', true),
      tc(['300'], 'So the trung: 50', 'Ca ẩn: số thẻ trùng đúng ở quy mô khác', true),
    ],
  },
  {
    id: 't3-p5-s4',
    isMilestone: false,
    files: [T3_P5_MAIN_FILE],
    title: 'Sẵn sàng deploy — cấu hình từ môi trường, khoá bí mật không lộ, chỉ https',
    unitId: 'p5-u8',
    requirement:
      'Trước khi đưa sổ học tập lên Internet, mọi thứ khác nhau giữa "máy bạn" và "máy chủ" phải ra khỏi code — nhất là khoá bí mật dùng để ký phiên đăng nhập.\n\nChương trình đọc dòng đầu bằng input() là số biến môi trường n, rồi n dòng dạng TEN=gia tri. Trước khi nạp, xoá sạch ba khoá PORT, SECRET_KEY, PUBLIC_URL khỏi os.environ. Tách mỗi dòng bằng partition("=") rồi gán vào os.environ.\n\nViết doc_cau_hinh() đọc từ os.environ, kiểm theo đúng thứ tự:\n- PORT: mặc định "8000"; phải là số nguyên 1..65535, không thì raise ValueError(f"PORT khong hop le: {gia tri}").\n- SECRET_KEY: BẮT BUỘC; thiếu → raise ValueError("Thieu bien moi truong SECRET_KEY"); ngắn hơn 16 ký tự → raise ValueError("SECRET_KEY qua ngan (can it nhat 16 ky tu)").\n- PUBLIC_URL: mặc định "http://localhost:<PORT>"; ngoài đúng địa chỉ máy mình đó ra, chỉ chấp nhận địa chỉ bắt đầu bằng "https://", không thì raise ValueError(f"PUBLIC_URL phai dung https: {gia tri}").\n\nGọi doc_cau_hinh() trong try. Lỗi thì in đúng một dòng "Loi cau hinh: <thong diep>". Không lỗi thì in hai dòng:\nTrang cong khai: <PUBLIC_URL> | cong=<so>\nSECRET_KEY: da dat (<do dai> ky tu)\n\nTuyệt đối KHÔNG in giá trị của SECRET_KEY — log là thứ nhiều người đọc được nhất trong một hệ thống.',
    hint: 'Giá trị lấy từ os.environ LUÔN là chuỗi, nên mặc định của PORT cũng phải là chuỗi "8000". Mặc định của PUBLIC_URL phụ thuộc cổng: f"http://localhost:{cong}". https là bắt buộc vì phiên đăng nhập đi qua mạng — http thường thì ai cùng mạng wifi cũng đọc được.',
    referenceCode: `import os

KHOA = ["PORT", "SECRET_KEY", "PUBLIC_URL"]


def doc_cau_hinh():
    cong = os.environ.get("PORT", "8000")            # mặc định phải là CHUỖI
    if not cong.isdigit() or not (1 <= int(cong) <= 65535):
        raise ValueError(f"PORT khong hop le: {cong}")

    khoa = os.environ.get("SECRET_KEY")              # bắt buộc -> không mặc định
    if not khoa:
        raise ValueError("Thieu bien moi truong SECRET_KEY")
    if len(khoa) < 16:
        raise ValueError("SECRET_KEY qua ngan (can it nhat 16 ky tu)")

    may_minh = f"http://localhost:{cong}"
    url = os.environ.get("PUBLIC_URL", may_minh)
    if url != may_minh and not url.startswith("https://"):
        raise ValueError(f"PUBLIC_URL phai dung https: {url}")

    return {"cong": int(cong), "khoa": khoa, "url": url}


n = int(input("So bien: "))
for k in KHOA:
    os.environ.pop(k, None)
for _ in range(n):
    ten, _dau, gia_tri = input("Bien: ").partition("=")   # giữ nguyên dấu = trong giá trị
    os.environ[ten] = gia_tri

try:
    c = doc_cau_hinh()
except ValueError as loi:
    print(f"Loi cau hinh: {loi}")
else:
    print(f"Trang cong khai: {c['url']} | cong={c['cong']}")
    print(f"SECRET_KEY: da dat ({len(c['khoa'])} ky tu)")     # chỉ in ĐỘ DÀI, không in khoá`,
    checks: [
      tc(
        ['1', 'SECRET_KEY=so-hoc-tap-bi-mat-2026'],
        'Trang cong khai: http://localhost:8000 | cong=8000',
        'Chỉ có biến bắt buộc — cổng và địa chỉ dùng mặc định máy mình',
      ),
      tc(
        ['1', 'SECRET_KEY=so-hoc-tap-bi-mat-2026'],
        'SECRET_KEY: da dat (22 ky tu)',
        'Báo đã đặt khoá bằng ĐỘ DÀI, không in khoá',
      ),
      tc(
        [
          '3',
          'PORT=10000',
          'SECRET_KEY=so-hoc-tap-bi-mat-2026',
          'PUBLIC_URL=https://so-hoc-tap.vn',
        ],
        'Trang cong khai: https://so-hoc-tap.vn | cong=10000',
        'Môi trường máy chủ: cổng và địa chỉ do nền tảng đặt',
      ),
      tc(
        ['2', 'SECRET_KEY=so-hoc-tap-bi-mat-2026', 'PUBLIC_URL=http://so-hoc-tap.vn'],
        'Loi cau hinh: PUBLIC_URL phai dung https: http://so-hoc-tap.vn',
        'Địa chỉ công khai không https → dừng ngay lúc khởi động',
      ),
      tc(
        ['1', 'PORT=3000'],
        'Loi cau hinh: Thieu bien moi truong SECRET_KEY',
        'Thiếu khoá bí mật → không khởi động',
      ),
      tc(
        ['1', 'SECRET_KEY=ngan-qua'],
        'Loi cau hinh: SECRET_KEY qua ngan (can it nhat 16 ky tu)',
        'Ca ẩn: khoá quá ngắn bị từ chối',
        true,
      ),
      tc(
        ['2', 'PORT=70000', 'SECRET_KEY=so-hoc-tap-bi-mat-2026'],
        'Loi cau hinh: PORT khong hop le: 70000',
        'Ca ẩn: kiểm KHOẢNG cổng chứ không chỉ kiểm kiểu',
        true,
      ),
    ],
  },
  {
    id: 't3-p5-s5',
    isMilestone: true,
    files: [T3_P5_API_FILE],
    language: 'apisim',
    title: 'MILESTONE P5 — API nộp bài: đúng hạn, trễ hạn, tổng kết',
    unitId: 'p5-u9',
    requirement:
      'Bước cuối cùng của dự án trục. Ráp tất cả thành một API mà trang web sổ học tập gọi được.\n\nTrong api.py, dựng SQLite bộ nhớ (bật PRAGMA foreign_keys = ON):\n- bai_tap: id INTEGER PRIMARY KEY, mon, ten, han TEXT NOT NULL, da_nop INTEGER NOT NULL DEFAULT 0. Nạp: (1, toan, Bai tap dao ham, 2026-10-15) · (2, van, Nghi luan xa hoi, 2026-10-12) · (3, anh, Unit 3 writing, 2026-10-20).\n- nop_bai: id, bai_id trỏ tới bai_tap(id) và UNIQUE (một bài chỉ nộp một lần), ngay TEXT, tre_han INTEGER.\n\n① POST /bai-tap/{bai_id}/nop nhận {"ngay": "YYYY-MM-DD"} — kiểm theo đúng thứ tự:\n- ngay không phải chuỗi ngày hợp lệ (date.fromisoformat báo lỗi) → 422.\n- Không có bài → 404. Bài đã nộp → 409 "Bai nay da nop roi".\n- Hợp lệ → 201, trả {"tre_han": <True nếu ngày nộp SAU hạn>} (nộp đúng ngày hạn vẫn là đúng hạn). Ghi nop_bai và đặt da_nop = 1 trong MỘT giao dịch.\n\n② GET /tong-ket → {"da_nop", "tre_han", "chua_nop"}, đếm bằng COUNT/SUM từ CSDL (COALESCE cho sổ rỗng).\n\nCuối file, dựng client = TestClient(app) rồi gọi lần lượt và in:\nDung han: <status> <tre_han>      ← nộp bài 1 ngày 2026-10-15\nTre han: <status> <tre_han>       ← nộp bài 2 ngày 2026-10-13\nNop lai: <status>                 ← nộp bài 1 lần nữa\nBai la: <status>                  ← nộp bài 99, ngày hợp lệ\nNgay sai: <status>                ← nộp bài 3 ngày "2026-02-30"\nSai ca hai: <status>              ← nộp bài 99 ngày "hom qua"\nTong ket: <a> da nop, <b> tre han, <c> chua nop\n\nLÀN C — phần KHÔNG chấm tự động được: đem file này ra máy thật, chạy bằng FastAPI + uvicorn, đổi CSDL sang file thật, đọc cấu hình theo bước 4, deploy lên nền tảng free-tier, rồi gắn trang tài liệu của chặng P3 vào. Bằng chứng cần nộp: URL https chạy thật, bảng biến môi trường (che giá trị) và log khởi động. Không có URL sống thì không có dấu HOÀN THÀNH MÔN — hệ thống không đánh dấu "đạt" thay bạn.',
    hint: 'Thứ tự kiểm quyết định mã lỗi: 422 (dữ liệu vào) → 404 (tồn tại) → 409 (trạng thái). So ngày bằng đối tượng date, không so chuỗi. Ghi nop_bai và UPDATE bai_tap rồi mới commit một lần — commit sau từng câu là mở cửa cho cảnh "đã có bản nộp mà bài vẫn ghi chưa nộp".',
    referenceCode: `import sqlite3
from datetime import date
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

BAI_TAP = [
    (1, "toan", "Bai tap dao ham", "2026-10-15"),
    (2, "van", "Nghi luan xa hoi", "2026-10-12"),
    (3, "anh", "Unit 3 writing", "2026-10-20"),
]

app = FastAPI()
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.execute("""CREATE TABLE bai_tap (
    id INTEGER PRIMARY KEY,
    mon TEXT NOT NULL,
    ten TEXT NOT NULL,
    han TEXT NOT NULL,
    da_nop INTEGER NOT NULL DEFAULT 0)""")
db.execute("""CREATE TABLE nop_bai (
    id INTEGER PRIMARY KEY,
    bai_id INTEGER NOT NULL UNIQUE REFERENCES bai_tap(id),
    ngay TEXT NOT NULL,
    tre_han INTEGER NOT NULL)""")
db.executemany("INSERT INTO bai_tap (id, mon, ten, han) VALUES (?, ?, ?, ?)", BAI_TAP)
db.commit()


def doc_ngay(gia_tri):
    if not isinstance(gia_tri, str):
        return None
    try:
        return date.fromisoformat(gia_tri)
    except ValueError:
        return None


@app.post("/bai-tap/{bai_id}/nop")
def nop_bai(bai_id: int, du_lieu):
    ngay = doc_ngay(du_lieu.get("ngay"))
    if ngay is None:
        raise HTTPException(422, "ngay phai co dang YYYY-MM-DD")

    bai = db.execute("SELECT han, da_nop FROM bai_tap WHERE id = ?", (bai_id,)).fetchone()
    if bai is None:
        raise HTTPException(404, "Khong co bai tap nay")
    if bai[1] == 1:
        raise HTTPException(409, "Bai nay da nop roi")

    tre = ngay > date.fromisoformat(bai[0])          # đúng ngày hạn vẫn là đúng hạn
    try:
        db.execute(
            "INSERT INTO nop_bai (bai_id, ngay, tre_han) VALUES (?, ?, ?)",
            (bai_id, ngay.isoformat(), int(tre)),
        )
        db.execute("UPDATE bai_tap SET da_nop = 1 WHERE id = ?", (bai_id,))
        db.commit()                                  # ghi bản nộp + đánh dấu, MỘT lần chốt
    except sqlite3.IntegrityError:
        db.rollback()
        raise HTTPException(409, "Bai nay da nop roi")
    return {"tre_han": tre}


@app.get("/tong-ket")
def tong_ket():
    da_nop, tre = db.execute("SELECT COUNT(*), COALESCE(SUM(tre_han), 0) FROM nop_bai").fetchone()
    tong = db.execute("SELECT COUNT(*) FROM bai_tap").fetchone()[0]
    return {"da_nop": da_nop, "tre_han": tre, "chua_nop": tong - da_nop}


client = TestClient(app)
r = client.post("/bai-tap/1/nop", json={"ngay": "2026-10-15"})
print("Dung han:", r.status_code, r.json()["tre_han"])
r = client.post("/bai-tap/2/nop", json={"ngay": "2026-10-13"})
print("Tre han:", r.status_code, r.json()["tre_han"])
print("Nop lai:", client.post("/bai-tap/1/nop", json={"ngay": "2026-10-16"}).status_code)
print("Bai la:", client.post("/bai-tap/99/nop", json={"ngay": "2026-10-15"}).status_code)
print("Ngay sai:", client.post("/bai-tap/3/nop", json={"ngay": "2026-02-30"}).status_code)
print("Sai ca hai:", client.post("/bai-tap/99/nop", json={"ngay": "hom qua"}).status_code)
tk = client.get("/tong-ket").json()
print(f"Tong ket: {tk['da_nop']} da nop, {tk['tre_han']} tre han, {tk['chua_nop']} chua nop")`,
    checks: [
      tc([], 'Dung han: 201 False', 'Nộp đúng ngày hạn vẫn là đúng hạn'),
      tc([], 'Tre han: 201 True', 'Nộp sau hạn bị đánh dấu trễ'),
      tc([], 'Nop lai: 409', 'Bài đã nộp → 409, không ghi đè bản nộp cũ'),
      tc([], 'Bai la: 404', 'Bài không tồn tại → 404'),
      tc([], 'Ngay sai: 422', 'Ngày không có thật (30/02) bị chặn ở cửa API'),
      tc(
        [],
        'Sai ca hai: 422',
        'Ca ẩn: dữ liệu vào sai được báo TRƯỚC khi tra bài (422 trước 404)',
        true,
      ),
      tc(
        [],
        'Tong ket: 2 da nop, 1 tre han, 1 chua nop',
        'Ca ẩn: sổ không lệch — chỉ hai lượt nộp hợp lệ được ghi',
        true,
      ),
    ],
  },
]
