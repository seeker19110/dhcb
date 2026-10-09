// projectStepsT2P4 — DỰ ÁN TRỤC T2 "Quỹ lớp / Chi tiêu nhà mình", CHẶNG P4 "Lõi quỹ có test và
// API". Đặc tả hạ tầng: docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md (hợp đồng nội dung).
//
// Cùng nhịp với chặng P4 của T1: quay về MỘT engine — Python — chạy trên ba LÀN (pyLanes.ts):
//   bước 1–3 làn `python` thuần · bước 4 làn `pytest` · bước 5–6 làn `apisim`.
// Ranh giới mô phỏng của hai làn sau: docs/research/dac-ta-bac-p4-mo-phong-den-dau-2026-08-26.md
// (định tuyến/JSON/SQLite chạy THẬT, không có tiến trình server nào).
//
// LUẬT CỦA SỔ QUỸ giữ nguyên từ chặng P1 (một dòng chảy, không phải sáu bài rời): mức đóng
// 50.000 đồng/bạn · chi không bao giờ vượt số dư (chi đúng bằng số dư vẫn được) · tình trạng
// quỹ ≥ 500.000 "du dung", ≥ 100.000 "sap het", dưới đó "bao dong". Lớp 10A1 có 4 bạn: an ·
// binh · hoa · minh. Mọi dòng chấm điểm in KHÔNG DẤU.
import { TestCaseSchema, type ProgrammingTestCase } from './lessonTypes.js'
// Xuống projectStepTypes (KHÔNG phải projectSteps) — tránh chu trình import.
import type { ProjectStep } from './projectStepTypes.js'

export const T2_P4_MAIN_FILE = 'quy_lop.py'
export const T2_P4_TEST_FILE = 'test_quy_lop.py'
export const T2_P4_API_FILE = 'api.py'

const tc = (
  stdinLines: string[],
  expected: string,
  label: string,
  hidden = false,
): ProgrammingTestCase => TestCaseSchema.parse({ stdinLines, expected, label, hidden })

// ── Bước 1–3: lõi bằng class ────────────────────────────────────────────────────────────────

const P4_THANH_VIEN_LOP = `class ThanhVien:
    def __init__(self, ten):
        self.ten = ten
        self.da_dong = 0

    def dong(self, so_tien):
        self.da_dong = self.da_dong + so_tien

    def con_thieu(self):
        if self.da_dong >= MUC_DONG:
            return 0
        return MUC_DONG - self.da_dong


class Lop:
    def __init__(self, ten_lop):
        self.ten_lop = ten_lop
        self.ds = []

    def them(self, thanh_vien):
        self.ds.append(thanh_vien)

    def tim(self, ten):
        can = ten.strip().lower()
        for tv in self.ds:
            if tv.ten == can:
                return tv
        return None`

const P4_TAO_LOP = `lop = Lop("10A1")
for ten in ["an", "binh", "hoa", "minh"]:
    lop.them(ThanhVien(ten))
print(f"Lop {lop.ten_lop}: {len(lop.ds)} thanh vien")`

const P4_S1_CODE = `MUC_DONG = 50000


${P4_THANH_VIEN_LOP}


${P4_TAO_LOP}

ten = input("Ten ban: ")
so_tien = int(input("So tien: "))
tv = lop.tim(ten)
if tv is None:
    print("Khong co ban nay")
else:
    tv.dong(so_tien)
    print(f"{tv.ten} da dong {tv.da_dong}, con thieu {tv.con_thieu()}")`

/** Các phương thức đọc số của SoQuy — bước 2 và bước 3 dùng nguyên văn. */
const P4_SO_QUY_DOC = `    def tong(self, loai):
        return sum(tien for l, _ten, tien in self.giao_dich if l == loai)

    def so_du(self):
        return self.tong("thu") - self.tong("chi")

    def in_bao_cao(self):
        print(f"Tong thu: {self.tong('thu')}")
        print(f"Tong chi: {self.tong('chi')}")
        print(f"So du: {self.so_du()}")
        chua_du = [tv.ten for tv in self.lop.ds if tv.con_thieu() > 0]
        if len(chua_du) == 0:
            print("Chua dong du: khong ai")
        else:
            print("Chua dong du: " + ", ".join(chua_du))`

const P4_S2_CODE = `MUC_DONG = 50000


${P4_THANH_VIEN_LOP}


class SoQuy:
    """CHUA lop va danh sach giao dich (ket hop) — khong ke thua Lop."""

    def __init__(self, lop):
        self.lop = lop
        self.giao_dich = []

    def thu(self, thanh_vien, so_tien):
        thanh_vien.dong(so_tien)
        self.giao_dich.append(("thu", thanh_vien.ten, so_tien))

    def chi(self, hang_muc, so_tien):
        self.giao_dich.append(("chi", hang_muc, so_tien))

${P4_SO_QUY_DOC}


${P4_TAO_LOP}

so = SoQuy(lop)
while True:
    dong = input("Giao dich: ").strip()
    if dong.lower() == "xong":
        break
    loai, ten, so_tien = dong.split(",")
    loai = loai.strip().lower()
    so_tien = int(so_tien)
    if loai == "thu":
        tv = lop.tim(ten)
        if tv is None:
            print("Khong co ban nay")
            continue
        so.thu(tv, so_tien)
    else:
        so.chi(ten.strip().lower(), so_tien)

so.in_bao_cao()`

const P4_S3_CODE = `import logging
import sys

MUC_DONG = 50000


class QuyKhongDu(Exception):
    """Loi NGHIEP VU: khoan chi lon hon so du cua quy."""


${P4_THANH_VIEN_LOP}


class SoQuy:
    def __init__(self, lop):
        self.lop = lop
        self.giao_dich = []

    def thu(self, thanh_vien, so_tien):
        thanh_vien.dong(so_tien)
        self.giao_dich.append(("thu", thanh_vien.ten, so_tien))

    def chi(self, hang_muc, so_tien):
        con = self.so_du()
        if so_tien > con:
            raise QuyKhongDu(f"Quy chi con {con}, khong du {so_tien}")
        self.giao_dich.append(("chi", hang_muc, so_tien))

${P4_SO_QUY_DOC}


logging.basicConfig(
    level=logging.INFO, format="[%(levelname)s] %(message)s", stream=sys.stdout
)

${P4_TAO_LOP}

so = SoQuy(lop)
logging.info(f"Mo so quy lop {lop.ten_lop}")
while True:
    dong = input("Giao dich: ").strip()
    if dong.lower() == "xong":
        break
    loai, ten, so_tien = dong.split(",")
    loai = loai.strip().lower()
    so_tien = int(so_tien)
    if loai == "thu":
        tv = lop.tim(ten)
        if tv is None:
            print("Khong co ban nay")
            continue
        so.thu(tv, so_tien)
    else:
        try:
            so.chi(ten.strip().lower(), so_tien)
        except QuyKhongDu as e:
            print(f"Loi: {e}")
            logging.warning(f"Tu choi khoan chi: {e}")

so.in_bao_cao()
logging.info(f"Chot so, so du {so.so_du()}")`

// ── Bước 4: test cho lõi ────────────────────────────────────────────────────────────────────

/** Phần lõi đem ra kiểm — chép nguyên văn vào đề bước 4 (học viên không được sửa). */
const P4_LOI_DEM_KIEM = `class QuyKhongDu(Exception):
    pass


def tinh_trang(so_du):
    if so_du >= 500000:
        return "du dung"
    if so_du >= 100000:
        return "sap het"
    return "bao dong"


def chi(so_du, so_tien):
    if so_tien > so_du:
        raise QuyKhongDu(f"Quy chi con {so_du}, khong du {so_tien}")
    return so_du - so_tien`

const P4_S4_CODE = `import pytest


# ---- Loi cua du an dem ra kiem ----
${P4_LOI_DEM_KIEM}


# ---- Test cua ban ----
def test_duoi_moc_100k():
    assert tinh_trang(99999) == "bao dong"


def test_dung_moc_100k():
    assert tinh_trang(100000) == "sap het"


def test_dung_moc_500k():
    assert tinh_trang(500000) == "du dung"


def test_chi_binh_thuong():
    assert chi(200000, 50000) == 150000


def test_chi_vua_het_quy():
    assert chi(50000, 50000) == 0


def test_chi_qua_quy_thi_nem_loi():
    with pytest.raises(QuyKhongDu):
        chi(50000, 80000)`

// ── Bước 5–6: API ───────────────────────────────────────────────────────────────────────────

const P4_API_DAU = `import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

app = FastAPI()`

const P4_S5_CODE = `${P4_API_DAU}

db = sqlite3.connect(":memory:")
db.execute(
    "CREATE TABLE thanh_vien (id INTEGER PRIMARY KEY, ten TEXT, da_dong INTEGER DEFAULT 0)"
)
for ten in ["an", "binh", "hoa", "minh"]:
    db.execute("INSERT INTO thanh_vien (ten) VALUES (?)", (ten,))
db.commit()


def thanh_dict(d):
    return {"id": d[0], "ten": d[1], "da_dong": d[2]}


@app.get("/thanh-vien")
def danh_sach():
    dong = db.execute("SELECT id, ten, da_dong FROM thanh_vien ORDER BY id").fetchall()
    return [thanh_dict(d) for d in dong]


@app.get("/thanh-vien/{tv_id}")
def mot_ban(tv_id: int):
    d = db.execute(
        "SELECT id, ten, da_dong FROM thanh_vien WHERE id = ?", (tv_id,)
    ).fetchone()
    if d is None:
        raise HTTPException(404, f"Khong tim thay thanh vien {tv_id}")
    return thanh_dict(d)


@app.post("/thanh-vien")
def them_ban(du_lieu):
    ten = str(du_lieu.get("ten", "")).strip().lower()
    if ten == "":
        raise HTTPException(422, "Ten khong duoc de trong")
    cur = db.execute("INSERT INTO thanh_vien (ten) VALUES (?)", (ten,))
    db.commit()
    return {"id": cur.lastrowid, "ten": ten, "da_dong": 0}


@app.delete("/thanh-vien/{tv_id}")
def xoa_ban(tv_id: int):
    cur = db.execute("DELETE FROM thanh_vien WHERE id = ?", (tv_id,))
    db.commit()
    if cur.rowcount == 0:
        raise HTTPException(404, f"Khong tim thay thanh vien {tv_id}")
    return {"da_xoa": tv_id}


client = TestClient(app)
ds = client.get("/thanh-vien")
print("DS:", ds.status_code, len(ds.json()))
mot = client.get("/thanh-vien/3")
print("MOT:", mot.status_code, mot.json()["ten"])
print("THIEU:", client.get("/thanh-vien/99").status_code)
tao = client.post("/thanh-vien", json={"ten": "  Lan "})
print("TAO:", tao.status_code, tao.json()["id"], tao.json()["ten"])
print("TEN RONG:", client.post("/thanh-vien", json={"ten": "   "}).status_code)
print("XOA:", client.delete("/thanh-vien/1").status_code)
print("XOA LAI:", client.delete("/thanh-vien/1").status_code)
print("CON LAI:", len(client.get("/thanh-vien").json()))`

/** Khối kiểm thử cuối file milestone — chép vào đề nguyên văn. */
const P4_S6_KIEM_THU = `client = TestClient(app)
def gui(du_lieu):
    return client.post("/giao-dich", json=du_lieu)
t1 = gui({"loai": "thu", "thanh_vien_id": 1, "so_tien": 50000})
print("THU:", t1.status_code, t1.json()["so_du"])
gui({"loai": "thu", "thanh_vien_id": 2, "so_tien": 50000})
c1 = gui({"loai": "chi", "hang_muc": "photo", "so_tien": 30000})
print("CHI:", c1.status_code, c1.json()["so_du"])
gian = gui({"loai": "chi", "hang_muc": "lien hoan", "so_tien": 500000, "so_du": 9999999})
print("CHI QUA QUY:", gian.status_code, gian.json()["detail"])
print("LOAI LA:", gui({"loai": "muon", "so_tien": 1000}).status_code)
print("SO AM:", gui({"loai": "thu", "thanh_vien_id": 3, "so_tien": -50000}).status_code)
print("BAN LA:", gui({"loai": "thu", "thanh_vien_id": 99, "so_tien": 50000}).status_code)
bc = client.get("/bao-cao").json()
print("BAO CAO:", bc["tong_thu"], bc["tong_chi"], bc["so_du"])
print("CHUA DONG:", ", ".join(bc["chua_dong"]))`

const P4_S6_CODE = `${P4_API_DAU}

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE thanh_vien (id INTEGER PRIMARY KEY, ten TEXT)")
db.execute(
    "CREATE TABLE giao_dich (id INTEGER PRIMARY KEY, loai TEXT, thanh_vien_id INTEGER,"
    " hang_muc TEXT, so_tien INTEGER)"
)
for ten in ["an", "binh", "hoa", "minh"]:
    db.execute("INSERT INTO thanh_vien (ten) VALUES (?)", (ten,))
db.commit()


def so_du_hien_tai():
    # So du LUON tinh tu CSDL — khong bao gio tin con so nguoi goi gui len
    d = db.execute(
        "SELECT COALESCE(SUM(CASE WHEN loai = 'thu' THEN so_tien ELSE -so_tien END), 0)"
        " FROM giao_dich"
    ).fetchone()
    return d[0]


@app.post("/giao-dich")
def tao_giao_dich(du_lieu):
    loai = du_lieu.get("loai")
    so_tien = du_lieu.get("so_tien")
    if loai not in ("thu", "chi"):
        raise HTTPException(422, "Loai phai la thu hoac chi")
    if isinstance(so_tien, bool) or not isinstance(so_tien, int) or so_tien <= 0:
        raise HTTPException(422, "So tien phai la so nguyen duong")

    if loai == "thu":
        tv_id = du_lieu.get("thanh_vien_id")
        tv = db.execute("SELECT id FROM thanh_vien WHERE id = ?", (tv_id,)).fetchone()
        if tv is None:
            raise HTTPException(404, f"Khong tim thay thanh vien {tv_id}")
        hang_muc = None
    else:
        tv_id = None
        hang_muc = str(du_lieu.get("hang_muc", "")).strip().lower()
        if hang_muc == "":
            raise HTTPException(422, "Khoan chi phai co hang muc")
        con = so_du_hien_tai()
        if so_tien > con:
            raise HTTPException(409, f"Quy chi con {con}, khong du {so_tien}")

    cur = db.execute(
        "INSERT INTO giao_dich (loai, thanh_vien_id, hang_muc, so_tien) VALUES (?, ?, ?, ?)",
        (loai, tv_id, hang_muc, so_tien),
    )
    db.commit()
    return {"id": cur.lastrowid, "loai": loai, "so_tien": so_tien, "so_du": so_du_hien_tai()}


@app.get("/bao-cao")
def bao_cao():
    d = db.execute(
        "SELECT"
        " COALESCE(SUM(CASE WHEN loai = 'thu' THEN so_tien END), 0),"
        " COALESCE(SUM(CASE WHEN loai = 'chi' THEN so_tien END), 0)"
        " FROM giao_dich"
    ).fetchone()
    chua = db.execute(
        "SELECT ten FROM thanh_vien tv WHERE NOT EXISTS"
        " (SELECT 1 FROM giao_dich gd WHERE gd.loai = 'thu' AND gd.thanh_vien_id = tv.id)"
        " ORDER BY tv.id"
    ).fetchall()
    return {
        "tong_thu": d[0],
        "tong_chi": d[1],
        "so_du": d[0] - d[1],
        "chua_dong": [r[0] for r in chua],
    }


${P4_S6_KIEM_THU}`

export const T2_P4_PROJECT_STEPS: ProjectStep[] = [
  {
    id: 't2-p4-s1',
    isMilestone: false,
    files: [T2_P4_MAIN_FILE],
    title: 'Mô hình hoá lớp bằng class — ThanhVien và Lop',
    unitId: 'p4-u1',
    requirement:
      'Từ bậc này, sổ quỹ có XƯƠNG SỐNG: dữ liệu và việc làm được của nó đi chung một chỗ.\n\nViết lại quy_lop.py, giữ MUC_DONG = 50000 ở đầu file, với hai class:\n\n1. class ThanhVien — __init__(self, ten) đặt self.ten và self.da_dong = 0; dong(self, so_tien) cộng thêm vào da_dong; con_thieu(self) trả về số còn thiếu so với MUC_DONG — đóng đủ hoặc đóng DƯ đều là 0, không bao giờ âm.\n2. class Lop — __init__(self, ten_lop) giữ tên lớp và danh sách rỗng; them(self, thanh_vien); tim(self, ten) trả về ThanhVien khớp tên hoặc None. tim() bỏ khoảng trắng thừa và KHÔNG phân biệt hoa/thường (như chặng P2).\n\nChương trình chính:\n- Tạo Lop("10A1") với 4 bạn: an · binh · hoa · minh.\n- In "Lop 10A1: 4 thanh vien" (số bạn lấy từ danh sách, không gõ cứng).\n- Đọc input() tên bạn rồi số tiền. Tìm thấy → bạn đó đóng số tiền ấy, in "<ten> da dong <da dong>, con thieu <con thieu>"; không thấy → in "Khong co ban nay".',
    hint: 'Trong class, self là chính đồ vật đang thao tác: self.da_dong là tiền của riêng bạn đó. con_thieu chỉ cần: if self.da_dong >= MUC_DONG: return 0, còn lại return MUC_DONG - self.da_dong. tim() duyệt self.ds, hết vòng mà không thấy thì return None.',
    referenceCode: P4_S1_CODE,
    checks: [
      tc(['an', '30000'], 'Lop 10A1: 4 thanh vien', 'Lớp giữ đủ 4 bạn'),
      tc(['an', '30000'], 'an da dong 30000, con thieu 20000', 'Đóng thiếu: còn thiếu đúng'),
      tc(['binh', '50000'], 'binh da dong 50000, con thieu 0', 'Đóng đủ: không còn thiếu'),
      tc(
        ['  Hoa ', '60000'],
        'hoa da dong 60000, con thieu 0',
        'Ca ẩn: tên bẩn vẫn tìm ra; đóng dư thì còn thiếu là 0, không âm',
        true,
      ),
      tc(['lan', '50000'], 'Khong co ban nay', 'Ca ẩn: bạn không có trong lớp báo rõ', true),
    ],
  },
  {
    id: 't2-p4-s2',
    isMilestone: false,
    files: [T2_P4_MAIN_FILE],
    title: 'Refactor phần lõi — SoQuy CHỨA lớp và giao dịch, không kế thừa',
    unitId: 'p4-u3',
    requirement:
      'Giữ NGUYÊN ThanhVien và Lop của bước 1, thêm class SoQuy. Chú ý: sổ quỹ KHÔNG kế thừa Lop — một cuốn sổ không "là một lớp học", nó CHỨA danh sách lớp và các giao dịch. Đó là kết hợp (composition).\n\n1. class SoQuy — __init__(self, lop) giữ lớp và danh sách giao dịch rỗng; thu(self, thanh_vien, so_tien) cho bạn đó đóng tiền và ghi giao dịch ("thu", ten, so_tien); chi(self, hang_muc, so_tien) ghi ("chi", hang_muc, so_tien); tong(self, loai) trả tổng tiền theo loại; so_du(self); in_bao_cao(self) in "Tong thu: <t>", "Tong chi: <t>", "So du: <t>", rồi "Chua dong du: <ten, ten>" (các bạn còn thiếu tiền, theo thứ tự trong lớp) hoặc "Chua dong du: khong ai".\n\n2. Chương trình chính: tạo lớp như bước 1 (vẫn in "Lop 10A1: 4 thanh vien"), rồi lặp đọc input() mỗi lần một giao dịch dạng "thu,<ten ban>,<so tien>" hoặc "chi,<hang muc>,<so tien>"; gõ "xong" thì dừng và gọi in_bao_cao(). Khoản thu của bạn không có trong lớp → in "Khong co ban nay" và bỏ qua.',
    hint: 'Mỗi giao dịch là một tuple (loai, ten, so_tien). tong() chỉ cần sum(tien for l, _ten, tien in self.giao_dich if l == loai). "Chưa đóng đủ" hỏi thẳng từng ThanhVien: tv.con_thieu() > 0 — SoQuy không phải tự tính lại tiền của ai.',
    referenceCode: P4_S2_CODE,
    checks: [
      tc(
        ['thu,an,50000', 'thu,binh,30000', 'chi,photo,20000', 'xong'],
        'Tong thu: 80000',
        'Cộng đúng các khoản thu',
      ),
      tc(
        ['thu,an,50000', 'thu,binh,30000', 'chi,photo,20000', 'xong'],
        'So du: 60000',
        'Số dư = thu − chi',
      ),
      tc(
        ['thu,an,50000', 'thu,binh,30000', 'chi,photo,20000', 'xong'],
        'Chua dong du: binh, hoa, minh',
        'Bạn đóng thiếu vẫn nằm trong danh sách chưa đủ',
      ),
      tc(
        ['thu,an,50000', 'thu,binh,30000', 'chi,photo,20000', 'xong'],
        'Lop 10A1: 4 thanh vien',
        'Vẫn giữ dòng của bước 1',
      ),
      tc(
        ['thu,lan,50000', 'xong'],
        'Tong thu: 0',
        'Ca ẩn: khoản thu của người ngoài lớp bị bỏ qua',
        true,
      ),
      tc(
        ['thu,an,50000', 'thu,binh,50000', 'thu,Hoa,50000', 'thu,minh,50000', 'xong'],
        'Chua dong du: khong ai',
        'Ca ẩn: cả lớp đóng đủ',
        true,
      ),
    ],
  },
  {
    id: 't2-p4-s3',
    isMilestone: false,
    files: [T2_P4_MAIN_FILE],
    title: 'Lỗi nghiệp vụ riêng + nhật ký chạy (logging)',
    unitId: 'p4-u4',
    requirement:
      '"Chi quá số dư" là một QUY TẮC CỦA QUỸ bị vi phạm — không phải lỗi lập trình. Nó phải có tên riêng.\n\nGiữ nguyên bước 2, thêm:\n\n1. class QuyKhongDu(Exception) — lớp lỗi riêng của sổ quỹ.\n2. SoQuy.chi(hang_muc, so_tien): so_tien lớn hơn số dư hiện tại thì raise QuyKhongDu(f"Quy chi con {so du}, khong du {so_tien}"); ngược lại mới ghi giao dịch. Chi đúng bằng số dư vẫn được.\n3. Ném ở chỗ PHÁT HIỆN, bắt ở chỗ NÓI CHUYỆN với người dùng: vòng lặp bọc lệnh chi trong try/except QuyKhongDu, in "Loi: <thong diep>" và ghi logging.warning(f"Tu choi khoan chi: {e}").\n4. Nhật ký: logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s", stream=sys.stdout) — mặc định logging ghi ra stderr, phải chuyển sang stdout thì bạn (và bộ chấm) mới đọc được cùng một dòng chảy. Ghi logging.info(f"Mo so quy lop {ten lop}") trước vòng lặp và logging.info(f"Chot so, so du {so du}") sau khi in báo cáo.',
    hint: 'Khoản bị từ chối thì KHÔNG được ghi vào sổ — cứ kiểm tra và raise TRƯỚC, lệnh append đặt SAU câu raise. except QuyKhongDu as e rồi f"{e}" để lấy lại đúng thông điệp đã ném.',
    referenceCode: P4_S3_CODE,
    checks: [
      tc(
        ['thu,an,50000', 'xong'],
        '[INFO] Mo so quy lop 10A1',
        'Nhật ký ghi mốc mở sổ (ra stdout)',
      ),
      tc(
        ['thu,an,50000', 'chi,lien hoan,80000', 'xong'],
        'Loi: Quy chi con 50000, khong du 80000',
        'Chi quá số dư báo lỗi nghiệp vụ cho người dùng',
      ),
      tc(
        ['thu,an,50000', 'chi,lien hoan,80000', 'xong'],
        '[WARNING] Tu choi khoan chi: Quy chi con 50000, khong du 80000',
        'Khoản bị từ chối được ghi lại cho lớp trưởng xem',
      ),
      tc(
        ['thu,an,50000', 'thu,binh,50000', 'chi,photo,30000', 'xong'],
        '[INFO] Chot so, so du 70000',
        'Nhật ký chốt sổ kèm số dư',
      ),
      tc(
        ['thu,an,50000', 'chi,lien hoan,80000', 'chi,photo,50000', 'xong'],
        'So du: 0',
        'Ca ẩn: khoản bị từ chối KHÔNG được ghi; chi vừa đúng số dư vẫn được',
        true,
      ),
      tc(
        ['thu,an,50000', 'chi,photo,30000', 'chi,qua,30000', 'xong'],
        'Loi: Quy chi con 20000, khong du 30000',
        'Ca ẩn: số dư trừ dần qua các khoản đã chi',
        true,
      ),
    ],
  },
  {
    id: 't2-p4-s4',
    isMilestone: false,
    language: 'pytest',
    files: [T2_P4_TEST_FILE],
    title: 'Viết test cho lõi quỹ của chính dự án',
    unitId: 'p4-u6',
    requirement: `Sổ quỹ đã có ba luật dễ viết nhầm: hai mốc tình trạng quỹ và "chi không vượt số dư". Nhầm một dấu so sánh là cả lớp đọc sai tình hình quỹ — đó là lúc test thay bạn nhớ.\n\nFile test_quy_lop.py có hai phần:\n\nPHẦN 1 — lõi đem ra kiểm (chép đúng như dưới, đừng sửa):\n\n${P4_LOI_DEM_KIEM}\n\nPHẦN 2 — test của bạn. Viết ĐÚNG 6 hàm test_* (bộ chạy tự gọi chúng, bạn không tự gọi):\n1. test_duoi_moc_100k — 99999 là "bao dong"\n2. test_dung_moc_100k — 100000 là "sap het"\n3. test_dung_moc_500k — 500000 là "du dung"\n4. test_chi_binh_thuong — chi(200000, 50000) còn 150000\n5. test_chi_vua_het_quy — chi(50000, 50000) còn 0\n6. test_chi_qua_quy_thi_nem_loi — with pytest.raises(QuyKhongDu): chi(50000, 80000)\n\nCA BIÊN LÀ LINH HỒN CỦA BƯỚC NÀY: ĐÚNG mốc (99999 vs 100000 — chỗ dễ viết nhầm > thành >=), chi VỪA HẾT quỹ (phải được, quỹ về 0), và chi QUÁ quỹ (phải NÉM LỖI, tuyệt đối không được trả về số âm rồi đi tiếp lặng lẽ).`,
    hint: 'import pytest ở đầu file. Ca "phải ném lỗi" viết bằng khối with: with pytest.raises(QuyKhongDu): chi(50000, 80000) — test đạt khi khối đó THẬT SỰ ném đúng loại lỗi, và trượt nếu nó chạy êm.',
    referenceCode: P4_S4_CODE,
    checks: [
      tc([], '=== 6 passed, 0 failed ===', 'Đủ 6 test và tất cả đều xanh'),
      tc([], 'test_dung_moc_100k PASSED', 'Ca biên ĐÚNG mốc 100.000 được phủ'),
      tc([], 'test_duoi_moc_100k PASSED', 'Ca ngay dưới mốc được phủ (bắt lỗi > vs >=)'),
      tc([], 'test_chi_vua_het_quy PASSED', 'Ca chi vừa hết quỹ được phủ'),
      tc(
        [],
        'test_chi_qua_quy_thi_nem_loi PASSED',
        'Ca ẩn: chi quá quỹ phủ bằng pytest.raises',
        true,
      ),
      tc([], 'test_dung_moc_500k PASSED', 'Ca ẩn: mốc "du dung" cũng được phủ', true),
    ],
  },
  {
    id: 't2-p4-s5',
    isMilestone: false,
    language: 'apisim',
    files: [T2_P4_API_FILE],
    title: 'API CRUD cho thành viên — danh sách lớp rời khỏi máy thủ quỹ',
    unitId: 'p4-u8',
    requirement:
      'Viết api.py: một API kiểu REST cho danh sách thành viên, dữ liệu nằm trong SQLite.\n\nDựng sẵn CSDL trong bộ nhớ: bảng thanh_vien(id INTEGER PRIMARY KEY, ten TEXT, da_dong INTEGER DEFAULT 0) với 4 bạn theo thứ tự an · binh · hoa · minh.\n\nBốn cửa:\n1. GET /thanh-vien — trả DANH SÁCH mọi bạn, mỗi bạn là dict {id, ten, da_dong}.\n2. GET /thanh-vien/{tv_id} (tv_id: int) — trả một bạn; không có thì raise HTTPException(404, f"Khong tim thay thanh vien {tv_id}").\n3. POST /thanh-vien — nhận thân JSON qua tham số tên du_lieu (dict có "ten"). Tên chuẩn hoá (bỏ khoảng trắng thừa, viết thường); rỗng thì raise HTTPException(422, "Ten khong duoc de trong"). Hợp lệ thì ghi vào CSDL, trả {id, ten, da_dong} với id vừa sinh (mã 201 là mặc định của @app.post).\n4. DELETE /thanh-vien/{tv_id} — xoá bạn đó, trả {"da_xoa": tv_id}; không có ai để xoá thì 404 (xoá hai lần thì lần sau phải biết là không còn).\n\nCuối file, dán khối kiểm thử sau (in GIÁ TRỊ ĐƠN LẺ, không in cả dict):\n\nclient = TestClient(app)\nds = client.get("/thanh-vien")\nprint("DS:", ds.status_code, len(ds.json()))\nmot = client.get("/thanh-vien/3")\nprint("MOT:", mot.status_code, mot.json()["ten"])\nprint("THIEU:", client.get("/thanh-vien/99").status_code)\ntao = client.post("/thanh-vien", json={"ten": "  Lan "})\nprint("TAO:", tao.status_code, tao.json()["id"], tao.json()["ten"])\nprint("TEN RONG:", client.post("/thanh-vien", json={"ten": "   "}).status_code)\nprint("XOA:", client.delete("/thanh-vien/1").status_code)\nprint("XOA LAI:", client.delete("/thanh-vien/1").status_code)\nprint("CON LAI:", len(client.get("/thanh-vien").json()))',
    hint: 'Ghi chú kiểu tv_id: int là bắt buộc — URL vốn là chuỗi, thiếu nó thì "3" đem so với số trong CSDL sẽ không khớp. Biết DELETE có xoá được dòng nào không: cur = db.execute("DELETE ...") rồi cur.rowcount (0 nghĩa là không có gì để xoá). Nhớ db.commit() sau mọi INSERT/DELETE.',
    referenceCode: P4_S5_CODE,
    checks: [
      tc([], 'DS: 200 4', 'GET /thanh-vien trả 200 và đủ 4 bạn'),
      tc([], 'MOT: 200 hoa', 'GET /thanh-vien/3 lấy đúng bạn (tham số đường dẫn đổi sang số)'),
      tc([], 'THIEU: 404', 'Bạn không tồn tại trả 404'),
      tc([], 'TAO: 201 5 lan', 'POST tạo bạn mới, tên đã chuẩn hoá, trả 201 kèm id'),
      tc([], 'TEN RONG: 422', 'Tên toàn khoảng trắng bị từ chối'),
      tc([], 'XOA: 200', 'DELETE trả 200'),
      tc([], 'XOA LAI: 404', 'Ca ẩn: xoá lần hai báo 404 chứ không giả vờ thành công', true),
      tc([], 'CON LAI: 4', 'Ca ẩn: thêm 1 xoá 1 thì còn đúng 4 bạn (có commit thật)', true),
    ],
  },
  {
    id: 't2-p4-s6',
    isMilestone: true,
    language: 'apisim',
    files: [T2_P4_API_FILE],
    title: 'Milestone P4 — API giao dịch, số dư tính từ CSDL',
    unitId: 'p4-u12',
    requirement: `Bước chốt chặng: nối sổ quỹ vào API. LUẬT SỐNG CÒN — số dư TUYỆT ĐỐI tính từ CSDL, không bao giờ nhận số dư người gọi gửi lên: dữ liệu từ trình duyệt ai cũng sửa được, tin nó là mở cửa cho một khoản chi rút sạch quỹ.\n\nTrong api.py: bảng thanh_vien(id, ten) với 4 bạn an · binh · hoa · minh, và bảng giao_dich(id, loai, thanh_vien_id, hang_muc, so_tien).\n\n1. POST /giao-dich — thân JSON {"loai", "so_tien", "thanh_vien_id" (khoản thu) hoặc "hang_muc" (khoản chi)}. Kiểm theo thứ tự:\n   - loai không phải "thu"/"chi" → 422\n   - so_tien không phải số nguyên lớn hơn 0 → 422\n   - khoản thu: thanh_vien_id không có → 404\n   - khoản chi: hang_muc trống → 422; so_tien lớn hơn số dư → 409 f"Quy chi con {so du}, khong du {so_tien}"\n   - hợp lệ → ghi, trả {id, loai, so_tien, so_du} với so_du SAU khi ghi (mã 201).\n2. GET /bao-cao — trả {tong_thu, tong_chi, so_du, chua_dong}; chua_dong là tên các bạn CHƯA có khoản thu nào, theo id tăng dần.\n\nCuối file dán khối kiểm thử:\n\n${P4_S6_KIEM_THU}`,
    hint: 'Số dư một câu SQL: SUM(CASE WHEN loai = \'thu\' THEN so_tien ELSE -so_tien END), bọc COALESCE(…, 0) để sổ trống ra 0 chứ không ra None. "Chưa đóng" = thành viên mà NOT EXISTS một giao dịch thu của bạn đó. Kiểm dữ liệu TRƯỚC, ghi CSDL SAU — khoản sai mà đã kịp ghi là sổ hỏng.',
    referenceCode: P4_S6_CODE,
    checks: [
      tc([], 'THU: 201 50000', 'Ghi khoản thu, trả 201 kèm số dư mới'),
      tc([], 'CHI: 201 70000', 'Ghi khoản chi, số dư tính lại từ CSDL'),
      tc(
        [],
        'CHI QUA QUY: 409 Quy chi con 70000, khong du 500000',
        'Số dư người gọi tự khai bị phớt lờ — chi quá quỹ trả 409',
      ),
      tc([], 'LOAI LA: 422', 'Loại giao dịch lạ bị từ chối'),
      tc([], 'BAO CAO: 100000 30000 70000', 'Báo cáo tổng thu, tổng chi, số dư khớp sổ'),
      tc([], 'SO AM: 422', 'Ca ẩn: khoản thu âm bị chặn ngay ở cửa API', true),
      tc([], 'BAN LA: 404', 'Ca ẩn: thu tiền của người không có trong lớp trả 404', true),
      tc([], 'CHUA DONG: hoa, minh', 'Ca ẩn: danh sách chưa đóng đúng thứ tự', true),
    ],
  },
]
