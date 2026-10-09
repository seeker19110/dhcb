// projectStepsT2P5 — DỰ ÁN TRỤC T2 "Quỹ lớp / Chi tiêu nhà mình", CHẶNG P5 "Quỹ lên Internet".
// Đặc tả hạ tầng: docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md (hợp đồng nội dung).
//
// Cùng nhịp với chặng P5 của T1 — CSDL tử tế · bảo mật · đo và sửa điểm chậm · sẵn sàng deploy
// · milestone — và CÙNG RANH GIỚI (docs/research/dac-ta-bac-p5-deploy-va-lan-c-2026-08-26.md):
// - Đo hiệu năng chấm bằng PHÉP ĐẾM thao tác, không bằng số giây (bước 3).
// - Deploy KHÔNG mô phỏng: bước 4 chấm phần đo được (cấu hình đọc từ môi trường, bí mật không
//   lộ ra log); thao tác trên nền tảng và URL sống thuộc làn C, học viên tự nộp bằng chứng ở
//   bước milestone.
//
// Bốn bước đầu làn `python` thuần (sqlite3 + hashlib + html + os.environ đều có trong Pyodide),
// milestone làn `apisim`. Luật sổ quỹ giữ nguyên từ chặng P1 (mức đóng 50.000 · chi không vượt
// số dư · lớp 4 bạn an · binh · hoa · minh). Mọi dòng chấm điểm in KHÔNG DẤU.
import { TestCaseSchema, type ProgrammingTestCase } from './lessonTypes.js'
// Xuống projectStepTypes (KHÔNG phải projectSteps) — tránh chu trình import.
import type { ProjectStep } from './projectStepTypes.js'

export const T2_P5_MAIN_FILE = 'quy_lop.py'
export const T2_P5_API_FILE = 'api.py'

const tc = (
  stdinLines: string[],
  expected: string,
  label: string,
  hidden = false,
): ProgrammingTestCase => TestCaseSchema.parse({ stdinLines, expected, label, hidden })

/** Câu tính số dư một lượt bằng SQL — bước 1 và milestone dùng chung. */
const P5_HAM_SO_DU = `def so_du():
    return db.execute(
        "SELECT COALESCE(SUM(CASE WHEN loai = 'thu' THEN so_tien ELSE -so_tien END), 0)"
        " FROM giao_dich"
    ).fetchone()[0]`

const P5_S1_CODE = `import sqlite3

THANH_VIEN = [(1, "an"), (2, "binh"), (3, "hoa"), (4, "minh")]

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")          # thieu dong nay la khoa ngoai chi de trang tri
db.execute("""CREATE TABLE thanh_vien (
    id INTEGER PRIMARY KEY,
    ten TEXT NOT NULL UNIQUE)""")
db.execute("""CREATE TABLE giao_dich (
    id INTEGER PRIMARY KEY,
    loai TEXT NOT NULL CHECK (loai IN ('thu', 'chi')),
    thanh_vien_id INTEGER REFERENCES thanh_vien(id),
    hang_muc TEXT,
    so_tien INTEGER NOT NULL CHECK (so_tien > 0),
    CHECK ((loai = 'thu' AND thanh_vien_id IS NOT NULL)
        OR (loai = 'chi' AND hang_muc IS NOT NULL)))""")
db.execute("CREATE INDEX idx_giao_dich_thanh_vien ON giao_dich (thanh_vien_id)")
db.executemany("INSERT INTO thanh_vien (id, ten) VALUES (?, ?)", THANH_VIEN)
db.execute("INSERT INTO giao_dich (loai, thanh_vien_id, so_tien) VALUES ('thu', 1, 50000)")
db.execute("INSERT INTO giao_dich (loai, thanh_vien_id, so_tien) VALUES ('thu', 2, 50000)")
db.execute("INSERT INTO giao_dich (loai, hang_muc, so_tien) VALUES ('chi', 'photo', 30000)")
db.commit()


${P5_HAM_SO_DU}


ds_ten = [t.strip().lower() for t in input("Ca to dong (ten cach nhau dau phay): ").split(",")]
so_tien = int(input("Moi ban dong: "))

dang_ghi = ""
try:
    for ten in ds_ten:
        dang_ghi = ten
        # Ten la -> cau con tra NULL -> rang buoc CHECK cua CSDL chan ngay
        db.execute(
            "INSERT INTO giao_dich (loai, thanh_vien_id, so_tien)"
            " VALUES ('thu', (SELECT id FROM thanh_vien WHERE ten = ?), ?)",
            (ten, so_tien),
        )
    db.commit()                                  # CA DOT mot lan chot
    print(f"Da thu: {len(ds_ten)} ban, {len(ds_ten) * so_tien} dong")
except sqlite3.IntegrityError:
    db.rollback()                                # mot ban hong -> huy ca dot
    print(f"Huy ca dot: {dang_ghi} khong ghi duoc")

print(f"So du: {so_du()} dong")

try:
    db.execute("INSERT INTO giao_dich (loai, thanh_vien_id, so_tien) VALUES ('thu', 1, -50000)")
    db.commit()
    print("Chan so am: KHONG")
except sqlite3.IntegrityError:
    db.rollback()
    print("Chan so am: OK")`

const P5_S2_CODE = `import sqlite3
import hashlib
import html

MUOI = "quy-lop-minh-bach"
TAI_KHOAN = [("thu_quy", "tietkiem2026", "thu_quy"), ("an", "an12345", "thanh_vien")]


def bam(mat_khau):
    # Cham co chu dich: 100.000 vong de khong ai do hang loat duoc
    return hashlib.pbkdf2_hmac("sha256", mat_khau.encode(), MUOI.encode(), 100000).hex()


db = sqlite3.connect(":memory:")
db.execute("""CREATE TABLE nguoi_dung (
    ten TEXT PRIMARY KEY,
    bam TEXT NOT NULL,
    vai_tro TEXT NOT NULL CHECK (vai_tro IN ('thu_quy', 'thanh_vien')))""")
for ten_tk, mk, vai in TAI_KHOAN:
    db.execute("INSERT INTO nguoi_dung VALUES (?, ?, ?)", (ten_tk, bam(mk), vai))  # chi luu ma bam
db.commit()


def dang_nhap(ten, mat_khau):
    # Tham so ? -> cau lenh va du lieu di hai duong rieng
    d = db.execute(
        "SELECT vai_tro FROM nguoi_dung WHERE ten = ? AND bam = ?",
        (ten, bam(mat_khau)),
    ).fetchone()
    if d is None:
        return None
    return d[0]


ten = input("Ten dang nhap: ")
mat_khau = input("Mat khau: ")
noi_dung = input("Noi dung khoan chi: ")

print(f"Ma bam: {bam('tietkiem2026')[:16]}")
vai_tro = dang_nhap(ten, mat_khau)
if vai_tro is None:
    print("Dang nhap: TU CHOI")
else:
    print(f"Dang nhap: OK ({vai_tro})")
    if vai_tro == "thu_quy":
        print(f"Ghi: {html.escape(noi_dung)}")   # thoat HTML truoc khi len trang cong khai
    else:
        print("Ghi: KHONG DUOC PHEP")`

const P5_S3_CODE = `def chua_dong_cham(thanh_vien, giao_dich):
    dem = 0
    ds = []
    for ten in thanh_vien:
        da_dong = False
        for _ma, nguoi, _tien in giao_dich:     # quet lai CA so cho tung ban
            dem += 1
            if nguoi == ten:
                da_dong = True
        if not da_dong:
            ds.append(ten)
    return dem, ds


def chua_dong_nhanh(thanh_vien, giao_dich):
    dem = 0
    da_dong = set()
    for _ma, nguoi, _tien in giao_dich:         # dung MOT luot qua so
        dem += 1
        da_dong.add(nguoi)
    ds = []
    for ten in thanh_vien:                       # moi ban hoi set mot lan
        dem += 1
        if ten not in da_dong:
            ds.append(ten)
    return dem, ds


m = int(input("So thanh vien: "))
n = int(input("So giao dich: "))
THANH_VIEN = [f"tv{i:03d}" for i in range(m)]
GIAO_DICH = [(i, f"tv{i % (m - 3):03d}", 50000) for i in range(n)]

cham, ds_cham = chua_dong_cham(THANH_VIEN, GIAO_DICH)
nhanh, ds_nhanh = chua_dong_nhanh(THANH_VIEN, GIAO_DICH)

print(f"Cham: {cham} thao tac")
print(f"Nhanh: {nhanh} thao tac")
print(f"Giong nhau: {ds_cham == ds_nhanh}")
if len(ds_nhanh) == 0:
    print("Chua dong: 0 ban")
else:
    print(f"Chua dong: {len(ds_nhanh)} ban, dau tien {ds_nhanh[0]}")`

const P5_S4_CODE = `import os

KHOA = ["PORT", "DATABASE_URL", "TEN_LOP", "MUC_DONG", "KHOA_NGAN_HANG"]


def so_nguyen_duong(ten, gia_tri):
    if not gia_tri.isdigit() or int(gia_tri) <= 0:
        raise ValueError(f"{ten} khong hop le: {gia_tri}")
    return int(gia_tri)


def bat_buoc(ten):
    gia_tri = os.environ.get(ten)                # bat buoc -> KHONG co mac dinh
    if not gia_tri:
        raise ValueError(f"Thieu bien moi truong {ten}")
    return gia_tri


def doc_cau_hinh():
    cong = so_nguyen_duong("PORT", os.environ.get("PORT", "8000"))   # mac dinh la CHUOI
    if cong > 65535:
        raise ValueError(f"PORT khong hop le: {cong}")
    url = bat_buoc("DATABASE_URL")
    khoa = bat_buoc("KHOA_NGAN_HANG")
    return {
        "cong": cong,
        "url": url,
        "khoa": khoa,
        "ten_lop": os.environ.get("TEN_LOP", "Lop cua toi"),
        "muc_dong": so_nguyen_duong("MUC_DONG", os.environ.get("MUC_DONG", "50000")),
    }


def che_khoa(khoa):
    # Giu 4 ky tu dau de nhan ra DUNG khoa nao; khoa ngan thi che het cho chac
    if len(khoa) <= 8:
        return "****"
    return khoa[:4] + "****"


n = int(input("So bien: "))
for k in KHOA:
    os.environ.pop(k, None)
for _ in range(n):
    ten, _dau, gia_tri = input("Bien: ").partition("=")   # giu nguyen dau = trong gia tri
    os.environ[ten] = gia_tri

try:
    c = doc_cau_hinh()
except ValueError as loi:
    print(f"Loi cau hinh: {loi}")
else:
    print(f"Quy: {c['ten_lop']} | cong={c['cong']} | muc dong={c['muc_dong']}")
    print(f"Khoa ngan hang: {che_khoa(c['khoa'])}")`

/** Khối kiểm thử cuối file milestone — chép vào đề nguyên văn. */
const P5_S5_KIEM_THU = `client = TestClient(app)
def gui(duong_dan, du_lieu):
    return client.post(duong_dan, json=du_lieu).status_code
print("Thu hop le:", gui("/thu", {"ten": "an", "so_tien": 50000}))
print("Thu ten chuan hoa:", gui("/thu", {"ten": "  Hoa ", "so_tien": 50000}))
print("Thu sai ban:", gui("/thu", {"ten": "lan", "so_tien": 50000}))
print("Thu so am:", gui("/thu", {"ten": "binh", "so_tien": -50000}))
print("Thu kieu bool:", gui("/thu", {"ten": "minh", "so_tien": True}))
print("Chi hop le:", gui("/chi", {"hang_muc": "photo", "so_tien": 30000}))
print("Chi qua quy:", gui("/chi", {"hang_muc": "lien hoan", "so_tien": 500000}))
mb = client.get("/minh-bach").json()
print(f"Minh bach: thu {mb['tong_thu']} chi {mb['tong_chi']} du {mb['so_du']} | chua dong {mb['chua_dong']} ban")`

const P5_S5_CODE = `import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

THANH_VIEN = [(1, "an"), (2, "binh"), (3, "hoa"), (4, "minh")]

app = FastAPI()
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.execute("""CREATE TABLE thanh_vien (
    id INTEGER PRIMARY KEY,
    ten TEXT NOT NULL UNIQUE)""")
db.execute("""CREATE TABLE giao_dich (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loai TEXT NOT NULL CHECK (loai IN ('thu', 'chi')),
    thanh_vien_id INTEGER REFERENCES thanh_vien(id),
    hang_muc TEXT,
    so_tien INTEGER NOT NULL CHECK (so_tien > 0))""")
db.executemany("INSERT INTO thanh_vien (id, ten) VALUES (?, ?)", THANH_VIEN)
db.commit()


${P5_HAM_SO_DU}


def kiem_so_tien(so_tien):
    # Trong Python, True cung la int — phai chan rieng
    if isinstance(so_tien, bool) or not isinstance(so_tien, int) or so_tien <= 0:
        raise HTTPException(422, "so_tien phai la so nguyen duong")


@app.post("/thu")
def thu(du_lieu):
    ten = du_lieu.get("ten")
    so_tien = du_lieu.get("so_tien")
    if not isinstance(ten, str):
        raise HTTPException(422, "ten phai la chuoi")
    kiem_so_tien(so_tien)
    tv = db.execute(
        "SELECT id FROM thanh_vien WHERE ten = ?", (ten.strip().lower(),)
    ).fetchone()
    if tv is None:
        raise HTTPException(404, "Khong co ban nay")
    db.execute(
        "INSERT INTO giao_dich (loai, thanh_vien_id, so_tien) VALUES ('thu', ?, ?)",
        (tv[0], so_tien),
    )
    db.commit()
    return {"so_du": so_du()}


@app.post("/chi")
def chi(du_lieu):
    hang_muc = du_lieu.get("hang_muc")
    so_tien = du_lieu.get("so_tien")
    if not isinstance(hang_muc, str) or hang_muc.strip() == "":
        raise HTTPException(422, "hang_muc phai la chuoi khac rong")
    kiem_so_tien(so_tien)
    con = so_du()                                # so du doc TU CSDL
    if so_tien > con:
        raise HTTPException(409, f"Quy chi con {con} dong")
    db.execute(
        "INSERT INTO giao_dich (loai, hang_muc, so_tien) VALUES ('chi', ?, ?)",
        (hang_muc.strip().lower(), so_tien),
    )
    db.commit()
    return {"so_du": so_du()}


@app.get("/minh-bach")
def minh_bach():
    # Trang CONG KHAI: tong so va so ban chua dong — khong cong khai TEN ai no quy
    d = db.execute(
        "SELECT COALESCE(SUM(CASE WHEN loai = 'thu' THEN so_tien END), 0),"
        " COALESCE(SUM(CASE WHEN loai = 'chi' THEN so_tien END), 0) FROM giao_dich"
    ).fetchone()
    chua = db.execute(
        "SELECT COUNT(*) FROM thanh_vien tv WHERE NOT EXISTS"
        " (SELECT 1 FROM giao_dich gd WHERE gd.loai = 'thu' AND gd.thanh_vien_id = tv.id)"
    ).fetchone()[0]
    return {"tong_thu": d[0], "tong_chi": d[1], "so_du": d[0] - d[1], "chua_dong": chua}


${P5_S5_KIEM_THU}`

export const T2_P5_PROJECT_STEPS: ProjectStep[] = [
  {
    id: 't2-p5-s1',
    isMilestone: false,
    files: [T2_P5_MAIN_FILE],
    title: 'Dựng lại CSDL sổ quỹ cho tử tế — ràng buộc và giao dịch',
    unitId: 'p5-u5',
    requirement:
      'Lên Internet rồi thì sổ quỹ không chỉ phải chạy đúng — nó phải KHÔNG CHO dữ liệu sai vào.\n\nViết lại quy_lop.py dùng sqlite3 trong bộ nhớ, bật PRAGMA foreign_keys = ON, dựng hai bảng:\n1. thanh_vien — id INTEGER PRIMARY KEY, ten TEXT NOT NULL UNIQUE. Nạp (1, an) · (2, binh) · (3, hoa) · (4, minh).\n2. giao_dich — id, loai CHECK IN (\'thu\', \'chi\'), thanh_vien_id trỏ tới thanh_vien(id), hang_muc, so_tien INTEGER NOT NULL CHECK (so_tien > 0), và một ràng buộc CHECK cấp bảng: khoản thu PHẢI có thanh_vien_id, khoản chi PHẢI có hang_muc. Thêm một INDEX trên thanh_vien_id (câu "ai đã đóng" sẽ tra cột này liên tục).\nNạp sẵn: thu an 50000 · thu binh 50000 · chi photo 30000 (số dư 70000).\n\nChương trình đọc input() một dòng tên cả tổ cách nhau dấu phẩy (chuẩn hoá từng tên như các chặng trước), rồi số tiền MỖI bạn đóng. Ghi cả đợt trong MỘT giao dịch:\n- mọi bạn ghi được → commit, in "Da thu: <so ban> ban, <tong> dong";\n- một bạn hỏng (không có trong lớp, số tiền không hợp lệ…) → rollback CẢ ĐỢT, in "Huy ca dot: <ten ban hong> khong ghi duoc".\nRồi in "So du: <so du> dong" đọc lại từ CSDL.\n\nCuối chương trình, thử ghi thẳng một khoản thu -50000. Bắt sqlite3.IntegrityError, rollback, in "Chan so am: OK"; ghi lọt thì in "Chan so am: KHONG".',
    hint: "Ràng buộc cấp bảng viết thành một dòng riêng cuối phần khai cột: CHECK ((loai = 'thu' AND thanh_vien_id IS NOT NULL) OR (loai = 'chi' AND hang_muc IS NOT NULL)). Mẹo: ghi thanh_vien_id bằng câu con (SELECT id FROM thanh_vien WHERE ten = ?) — tên lạ cho NULL và chính ràng buộc trên chặn lại. Bọc cả vòng ghi trong MỘT try, commit sau vòng lặp, except sqlite3.IntegrityError thì db.rollback().",
    referenceCode: P5_S1_CODE,
    checks: [
      tc(['hoa, minh', '50000'], 'Da thu: 2 ban, 100000 dong', 'Cả tổ hợp lệ: ghi trọn đợt'),
      tc(['hoa, minh', '50000'], 'So du: 170000 dong', 'Số dư đọc lại từ CSDL'),
      tc(
        ['hoa, lan', '50000'],
        'Huy ca dot: lan khong ghi duoc',
        'Một bạn không có trong lớp: huỷ cả đợt, báo đúng tên',
      ),
      tc(
        ['  HOA ', '50000'],
        'Da thu: 1 ban, 50000 dong',
        'Tên viết hoa, thừa khoảng trắng vẫn ghi',
      ),
      tc(
        ['hoa, lan', '50000'],
        'So du: 70000 dong',
        'Ca ẩn: huỷ đợt thì bạn hoa cũng KHÔNG được ghi lẻ',
        true,
      ),
      tc(
        ['minh', '-50000'],
        'Huy ca dot: minh khong ghi duoc',
        'Ca ẩn: số tiền âm bị chính CSDL chặn',
        true,
      ),
      tc(['hoa', '50000'], 'Chan so am: OK', 'Ca ẩn: ràng buộc CHECK chặn khoản thu âm', true),
    ],
  },
  {
    id: 't2-p5-s2',
    isMilestone: false,
    files: [T2_P5_MAIN_FILE],
    title: 'Đăng nhập thủ quỹ — băm mật khẩu, phân quyền, thoát HTML',
    unitId: 'p5-u6',
    requirement:
      'Trang quỹ sắp có người lạ gõ cửa. Ba lỗ hổng hay gặp nhất cùng có mặt ở đây — chặn cả ba.\n\n1. MUOI = "quy-lop-minh-bach". Hàm bam(mat_khau) dùng hashlib.pbkdf2_hmac("sha256", mat_khau, MUOI, 100000) rồi .hex().\n2. Bảng nguoi_dung(ten TEXT PRIMARY KEY, bam TEXT NOT NULL, vai_tro) trong SQLite bộ nhớ, vai_tro chỉ nhận \'thu_quy\' hoặc \'thanh_vien\'. Nạp hai tài khoản: thu_quy / tietkiem2026 (vai trò thu_quy) và an / an12345 (vai trò thanh_vien). CSDL chỉ chứa MÃ BĂM.\n3. dang_nhap(ten, mat_khau) — MỘT câu truy vấn kiểm cả tên lẫn mã băm, bắt buộc dùng tham số ?, trả vai trò hoặc None.\n\nChương trình đọc input() tên đăng nhập, mật khẩu, rồi nội dung một khoản chi, và in:\nMa bam: <16 ky tu dau cua ma bam mat khau tietkiem2026>\nDang nhap: OK (<vai tro>)     hoặc     Dang nhap: TU CHOI\nNếu đăng nhập được thì thêm một dòng:\n- thủ quỹ → "Ghi: <noi dung DA THOAT HTML bang html.escape>"\n- thành viên → "Ghi: KHONG DUOC PHEP" (đăng nhập được KHÔNG có nghĩa là được ghi sổ)\n\nVì sao thoát HTML: nội dung khoản chi sẽ hiện trên trang minh bạch công khai. Ai đó gõ <script> vào ô nội dung mà bạn in thẳng ra trang là mọi phụ huynh mở trang đều chạy mã của kẻ đó.',
    hint: 'pbkdf2_hmac nhận bytes: .encode() cả mật khẩu lẫn muối, rồi .hex(). Truy vấn "SELECT vai_tro FROM nguoi_dung WHERE ten = ? AND bam = ?" với tuple (ten, bam(mat_khau)). import html rồi html.escape(chuoi) đổi < > & thành &lt; &gt; &amp; — trình duyệt hiện đúng chữ nhưng không chạy.',
    referenceCode: P5_S2_CODE,
    checks: [
      tc(
        ['thu_quy', 'tietkiem2026', 'Mua hoa 20/11'],
        'Dang nhap: OK (thu_quy)',
        'Thủ quỹ đúng mật khẩu vào được',
      ),
      tc(
        ['thu_quy', 'tietkiem2026', 'Mua hoa 20/11'],
        'Ma bam: 3b8cc69eae335146',
        'Băm đúng muối và đúng 100.000 vòng',
      ),
      tc(
        ['thu_quy', 'tietkiem2025', 'Mua hoa'],
        'Dang nhap: TU CHOI',
        'Sai một ký tự mật khẩu → từ chối',
      ),
      tc(
        ["thu_quy' --", 'khong-biet', 'Rut quy'],
        'Dang nhap: TU CHOI',
        'TẤN CÔNG THẬT: ghép chuỗi SQL thì kẻ lạ vào được',
      ),
      tc(
        ['an', 'an12345', 'Lien hoan'],
        'Ghi: KHONG DUOC PHEP',
        'Thành viên đăng nhập được nhưng không được ghi sổ',
      ),
      tc(
        ['thu_quy', 'tietkiem2026', '<script>alert(1)</script>'],
        'Ghi: &lt;script&gt;alert(1)&lt;/script&gt;',
        'Ca ẩn: nội dung có mã độc được thoát HTML',
        true,
      ),
      tc(
        ['an', 'an12345', 'Lien hoan'],
        'Dang nhap: OK (thanh_vien)',
        'Ca ẩn: tài khoản thứ hai vào được (không gõ cứng một tên)',
        true,
      ),
      tc(
        ['nguoi_la', 'gi cung duoc', 'x'],
        'Dang nhap: TU CHOI',
        'Ca ẩn: tài khoản không tồn tại — từ chối êm, không nổ lỗi',
        true,
      ),
    ],
  },
  {
    id: 't2-p5-s3',
    isMilestone: false,
    files: [T2_P5_MAIN_FILE],
    title: 'Đo và sửa một điểm chậm — "ai chưa đóng" trên sổ lớn',
    unitId: 'p5-u7',
    requirement:
      'Trường dùng chung app cho cả khối: sổ có hàng nghìn giao dịch, và trang "ai chưa đóng" bắt đầu ì ạch. Đo trước, sửa một chỗ, đo lại.\n\nDữ liệu sinh bằng công thức từ hai số đọc bằng input(): m (số thành viên, lớn hơn 3) rồi n (số giao dịch):\nTHANH_VIEN = [f"tv{i:03d}" for i in range(m)]\nGIAO_DICH = [(i, f"tv{i % (m - 3):03d}", 50000) for i in range(n)]\n\nViết hai hàm, mỗi hàm trả về (so_thao_tac, ds_chua_dong) — ds theo đúng thứ tự THANH_VIEN:\n1. chua_dong_cham(thanh_vien, giao_dich) — với MỖI bạn, quét lại TOÀN BỘ sổ (không dừng sớm); cộng 1 vào biến đếm mỗi lần xét một giao dịch.\n2. chua_dong_nhanh(thanh_vien, giao_dich) — duyệt sổ ĐÚNG MỘT LƯỢT gom tên người đã đóng vào một set (cộng 1 mỗi giao dịch), rồi hỏi set cho từng bạn (cộng 1 mỗi bạn).\n\nIn đúng bốn dòng:\nCham: <so thao tac> thao tac\nNhanh: <so thao tac> thao tac\nGiong nhau: True\nChua dong: <so ban> ban, dau tien <ten ban dau tien>      (không ai thì "Chua dong: 0 ban")\n\nDòng "Giong nhau" là điều kiện của mọi việc tối ưu: đổi cái giá, KHÔNG đổi kết quả.',
    hint: 'Cách chậm tốn m × n thao tác, cách nhanh chỉ n + m — với 60 bạn và 5.000 giao dịch là 300.000 so với 5.060. "x in set" tra gần như tức thì bất kể set lớn cỡ nào; "x in list" thì phải dò từ đầu. Dựng set TRƯỚC, ngoài vòng lặp thành viên.',
    referenceCode: P5_S3_CODE,
    checks: [
      tc(['60', '5000'], 'Cham: 300000 thao tac', 'Quét lại sổ cho từng bạn: 60 × 5.000 thao tác'),
      tc(['60', '5000'], 'Nhanh: 5060 thao tac', 'Gom bằng set: một lượt sổ + một lượt lớp'),
      tc(['60', '5000'], 'Giong nhau: True', 'Tối ưu KHÔNG được làm đổi kết quả'),
      tc(['60', '5000'], 'Chua dong: 3 ban, dau tien tv057', 'Đúng những bạn chưa đóng'),
      tc(
        ['50', '20'],
        'Nhanh: 70 thao tac',
        'Ca ẩn: sổ ít giao dịch — số đếm vẫn đúng n + m',
        true,
      ),
      tc(
        ['50', '20'],
        'Chua dong: 30 ban, dau tien tv020',
        'Ca ẩn: nhiều bạn chưa đóng, thứ tự theo danh sách lớp',
        true,
      ),
      tc(['50', '20'], 'Cham: 1000 thao tac', 'Ca ẩn: cách chậm luôn đúng m × n', true),
    ],
  },
  {
    id: 't2-p5-s4',
    isMilestone: false,
    files: [T2_P5_MAIN_FILE],
    title: 'Sẵn sàng deploy — cấu hình ra khỏi code, khoá ngân hàng không lộ',
    unitId: 'p5-u8',
    requirement:
      'Quỹ lên Internet sẽ nối với ngân hàng để tự đối soát tiền chuyển khoản — nghĩa là app giữ một KHOÁ BÍ MẬT. Mọi thứ khác nhau giữa "máy bạn" và "máy chủ" phải ra khỏi code.\n\nChương trình đọc input() số biến môi trường n, rồi n dòng dạng TEN=gia tri. Trước khi nạp, xoá sạch năm khoá PORT, DATABASE_URL, TEN_LOP, MUC_DONG, KHOA_NGAN_HANG khỏi os.environ; tách mỗi dòng bằng partition("=") rồi gán vào os.environ.\n\nViết doc_cau_hinh() đọc theo thứ tự:\n- PORT: mặc định "8000"; phải là số nguyên 1..65535, không thì raise ValueError(f"PORT khong hop le: {gia tri}").\n- DATABASE_URL rồi KHOA_NGAN_HANG: BẮT BUỘC, không mặc định; thiếu thì raise ValueError(f"Thieu bien moi truong {TEN}").\n- TEN_LOP: mặc định "Lop cua toi".\n- MUC_DONG: mặc định "50000"; phải là số nguyên dương, không thì raise ValueError(f"MUC_DONG khong hop le: {gia tri}").\n\nViết che_khoa(khoa): dài hơn 8 ký tự thì giữ 4 ký tự đầu rồi "****"; ngắn hơn thì trả "****".\n\nGọi doc_cau_hinh() trong try. Lỗi → in đúng một dòng "Loi cau hinh: <thong diep>". Không lỗi → in:\nQuy: <ten lop> | cong=<so> | muc dong=<so>\nKhoa ngan hang: <khoa da che>',
    hint: 'Giá trị từ os.environ LUÔN là chuỗi, nên mặc định cũng là chuỗi ("8000", "50000"). Kiểm số nguyên dương: gia_tri.isdigit() and int(gia_tri) > 0 — "-5".isdigit() là False. Khoá bí mật không bao giờ có mặc định: app thiếu khoá mà vẫn khởi động là sẽ hỏng muộn hơn, ở chỗ khó tìm hơn.',
    referenceCode: P5_S4_CODE,
    checks: [
      tc(
        ['2', 'DATABASE_URL=postgres://quy:mk@db.lop.vn/quy', 'KHOA_NGAN_HANG=sk_live_9f8e7d6c'],
        'Quy: Lop cua toi | cong=8000 | muc dong=50000',
        'Chỉ có biến bắt buộc — các biến khác dùng mặc định',
      ),
      tc(
        ['2', 'DATABASE_URL=postgres://quy:mk@db.lop.vn/quy', 'KHOA_NGAN_HANG=sk_live_9f8e7d6c'],
        'Khoa ngan hang: sk_l****',
        'Khoá bị che, chỉ còn đủ để nhận ra',
      ),
      tc(
        [
          '5',
          'PORT=3001',
          'DATABASE_URL=postgres://a:b@h/q',
          'KHOA_NGAN_HANG=abcdefghijkl',
          'TEN_LOP=12C3',
          'MUC_DONG=30000',
        ],
        'Quy: 12C3 | cong=3001 | muc dong=30000',
        'Môi trường máy chủ đặt cổng, tên lớp và mức đóng',
      ),
      tc(
        ['1', 'KHOA_NGAN_HANG=abcdefghijkl'],
        'Loi cau hinh: Thieu bien moi truong DATABASE_URL',
        'Thiếu CSDL → chết ngay lúc khởi động',
      ),
      tc(
        ['1', 'DATABASE_URL=postgres://a:b@h/q'],
        'Loi cau hinh: Thieu bien moi truong KHOA_NGAN_HANG',
        'Thiếu khoá bí mật → chết ngay lúc khởi động',
      ),
      tc(
        ['3', 'DATABASE_URL=x', 'KHOA_NGAN_HANG=abcdefghijkl', 'MUC_DONG=-5'],
        'Loi cau hinh: MUC_DONG khong hop le: -5',
        'Ca ẩn: mức đóng âm bị chặn',
        true,
      ),
      tc(
        ['3', 'PORT=70000', 'DATABASE_URL=x', 'KHOA_NGAN_HANG=abcdefghijkl'],
        'Loi cau hinh: PORT khong hop le: 70000',
        'Ca ẩn: kiểm KHOẢNG cổng, không chỉ kiểm kiểu',
        true,
      ),
      tc(
        ['2', 'DATABASE_URL=x', 'KHOA_NGAN_HANG=12345678'],
        'Khoa ngan hang: ****',
        'Ca ẩn: khoá ngắn thì che toàn bộ',
        true,
      ),
    ],
  },
  {
    id: 't2-p5-s5',
    isMilestone: true,
    files: [T2_P5_API_FILE],
    language: 'apisim',
    title: 'MILESTONE P5 — API quỹ lớp: thu, chi, trang minh bạch',
    unitId: 'p5-u9',
    requirement: `Bước cuối của dự án: ráp lại thành API cho trang minh bạch thật gọi.\n\nTrong api.py, SQLite bộ nhớ (PRAGMA foreign_keys = ON): thanh_vien(id, ten UNIQUE) với 4 bạn an · binh · hoa · minh; giao_dich(id AUTOINCREMENT, loai CHECK IN ('thu','chi'), thanh_vien_id trỏ tới thanh_vien(id), hang_muc, so_tien CHECK (so_tien > 0)).\n\n① POST /thu {"ten", "so_tien"}: ten không phải chuỗi hoặc so_tien không phải số nguyên dương → 422; không có bạn này (chuẩn hoá tên, tra bằng tham số ?) → 404; hợp lệ → 201 {"so_du"}.\n② POST /chi {"hang_muc", "so_tien"}: hang_muc rỗng hoặc so_tien sai → 422; so_tien lớn hơn số dư TÍNH TỪ CSDL → 409; hợp lệ → 201 {"so_du"}.\n③ GET /minh-bach → {"tong_thu", "tong_chi", "so_du", "chua_dong"} — chua_dong là SỐ bạn chưa có khoản thu nào. Trang công khai KHÔNG nêu tên ai nợ quỹ.\n\nCuối file dán khối kiểm thử:\n\n${P5_S5_KIEM_THU}\n\nLÀN C — KHÔNG chấm tự động được: chạy file này bằng FastAPI + uvicorn trên máy thật, đổi CSDL sang file thật, cấu hình qua biến môi trường như bước 4, rồi deploy lên nền tảng free-tier. Nộp bằng chứng: URL https chạy thật, bảng biến môi trường (che giá trị), log khởi động. Không có URL sống thì không có dấu HOÀN THÀNH MÔN — hệ thống không tự đánh dấu "đạt" khi không có gì để kiểm chứng.`,
    hint: 'Thứ tự kiểm quyết định mã lỗi: 422 (dữ liệu vào) → 404 (tồn tại) → 409 (trạng thái quỹ). Trong Python True cũng là int, nên kiểm isinstance(so_tien, bool) trước. Số dư luôn hỏi CSDL bằng SUM(CASE …) bọc COALESCE — không giữ biến số dư trong bộ nhớ.',
    referenceCode: P5_S5_CODE,
    checks: [
      tc([], 'Thu hop le: 201', 'Khoản thu hợp lệ được nhận'),
      tc([], 'Thu sai ban: 404', 'Thu tiền người ngoài lớp → 404'),
      tc([], 'Thu so am: 422', 'Số tiền âm bị chặn TRƯỚC khi đụng CSDL'),
      tc([], 'Chi hop le: 201', 'Khoản chi trong số dư được nhận'),
      tc([], 'Chi qua quy: 409', 'Chi quá số dư → 409, số dư đọc từ CSDL'),
      tc([], 'Thu ten chuan hoa: 201', 'Ca ẩn: tên viết hoa, thừa khoảng trắng vẫn nhận', true),
      tc([], 'Thu kieu bool: 422', 'Ca ẩn: True không được tính là 1 đồng', true),
      tc(
        [],
        'Minh bach: thu 100000 chi 30000 du 70000 | chua dong 2 ban',
        'Ca ẩn: trang minh bạch khớp sổ — chỉ các lượt hợp lệ được ghi',
        true,
      ),
    ],
  },
]
