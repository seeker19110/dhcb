// projectStepsP5 — DỰ ÁN TRỤC T1 "Cửa hàng của tôi", CHẶNG P5 "Ra Internet" (bậc P5).
// Đặc tả: dac-ta-du-an-xuyen-suot-mon-lap-trinh-2026-08-24.md §3 chặng P5 — "thiết kế lại
// schema tử tế (chuẩn hoá, index, transaction) · đăng nhập chủ quán (hash mật khẩu) · deploy
// free-tier + biến môi trường · đo và sửa một điểm chậm · milestone = hoàn thành môn".
//
// RANH GIỚI CỦA CHẶNG (docs/research/dac-ta-bac-p5-deploy-va-lan-c-2026-08-26.md):
// - Đo hiệu năng thì chấm bằng PHÉP ĐẾM, không bằng số giây — bước 3 đếm thao tác.
// - Deploy KHÔNG mô phỏng. Bước 4 chấm phần đo được của việc deploy (ứng dụng đọc cấu hình từ
//   môi trường, bí mật không nằm trong code); còn thao tác trên nền tảng và URL sống thuộc
//   làn C, nằm ở phần yêu cầu của bước milestone và do học viên tự khai + nộp bằng chứng.
//
// Bốn bước đầu chạy làn `python` thuần (sqlite3 + hashlib + os.environ đều có thật trong
// Pyodide), bước milestone chạy làn `apisim`. Mọi dòng chấm điểm in KHÔNG DẤU như các chặng
// trước, và LUẬT TIỀN CỦA QUÁN giữ nguyên từ chặng P1: tổng ≥ 100.000 giảm 20% · ≥ 50.000
// giảm 10% · dưới đó giữ nguyên, luôn làm tròn xuống. Menu vẫn 3 món: tra da 5000 ·
// nuoc cam 15000 · sua dau 10000.
import { TestCaseSchema, type ProgrammingTestCase } from './lessonTypes.js'
// Xuống projectStepTypes (KHÔNG phải projectSteps): file kia import ngược lên đây để gom
// PROJECT_STAGES, nên import chéo sẽ tạo chu trình — cổng `codemap -- cycles` chặn CI.
import type { ProjectStep } from './projectStepTypes.js'

export const P5_MAIN_FILE = 'cua_hang.py'
export const P5_API_FILE = 'api.py'

const tc = (
  stdinLines: string[],
  expected: string,
  label: string,
  hidden = false,
): ProgrammingTestCase => TestCaseSchema.parse({ stdinLines, expected, label, hidden })

// ── Probe của BỘ CHẤM cho bước làn apisim (đặc tả 2026-10-11-apisim-ca-an-chong-go-cung) ──
// Chạy NGUYÊN api.py (runpy, run_name="__main__" để khối kiểm thử bọc trong
// `if __name__ == "__main__":` vẫn chạy), rồi tự gọi API bằng dữ liệu riêng. Không có endpoint
// thêm món nên probe chỉ đi các nhánh KHÔNG đổi sổ, và đo sổ bằng HIỆU trước/sau (tương đối).
const P5_S5_PROBE = `import runpy
from fastapi.testclient import TestClient

g = runpy.run_path("api.py", run_name="__main__")
c = TestClient(g["app"])


def gui(du_lieu):
    return c.post("/don", json=du_lieu).status_code


bc0 = c.get("/bao-cao").json()
print("KT SAI KIEU:", gui({"mon": 123, "so_luong": 1}), gui({"mon": "tra da", "so_luong": 0}), gui({"mon": "tra da", "so_luong": "2"}))
lo = gui({"mon": "banh mi xyz", "so_luong": 0})
print("KT THU TU:", lo, gui({"mon": "banh mi xyz", "so_luong": 1}), gui({"mon": "  SUA DAU ", "so_luong": 1000000}))
bc1 = c.get("/bao-cao").json()
print("KT SO KHONG DOI:", bc1["so_don"] - bc0["so_don"], bc1["doanh_thu"] - bc0["doanh_thu"])`

export const P5_PROJECT_STEPS: ProjectStep[] = [
  {
    id: 'p5-s1',
    isMilestone: false,
    files: [P5_MAIN_FILE],
    title: 'Dựng lại CSDL của quán cho tử tế — ràng buộc và giao dịch',
    unitId: 'p5-u5',
    requirement:
      'Tới bậc này, cửa hàng không chỉ chạy đúng — nó phải KHÔNG CHO dữ liệu sai vào.\n\nViết lại cua_hang.py dùng sqlite3 trong bộ nhớ, bật PRAGMA foreign_keys = ON, và dựng ba bảng:\n\n1. mon — id INTEGER PRIMARY KEY, ten TEXT NOT NULL UNIQUE, gia INTEGER NOT NULL CHECK (gia > 0).\n2. don — id INTEGER PRIMARY KEY, ngay TEXT NOT NULL, tong INTEGER NOT NULL DEFAULT 0.\n3. chi_tiet — don_id trỏ tới don(id), mon_id trỏ tới mon(id), so_luong INTEGER NOT NULL CHECK (so_luong > 0), KHOÁ CHÍNH GHÉP (don_id, mon_id).\n\nNạp đúng 3 món: (1, tra da, 5000) · (2, nuoc cam, 15000) · (3, sua dau, 10000).\n\nChương trình đọc input() tên món rồi số lượng (tên bỏ khoảng trắng thừa, không phân biệt hoa/thường như các chặng trước). Tra món bằng tham số ?, KHÔNG ghép chuỗi.\n- Không có món → in "Khong co mon nay".\n- Có món → tính tiền theo luật giảm giá của quán, rồi trong MỘT giao dịch: ghi đơn số 1 (ngay "2026-08-26") và ghi dòng chi tiết, rồi commit. In: "Tong don: <tien> dong" (đọc lại từ CSDL, không in biến trong bộ nhớ).\n\nCuối chương trình, dù có món hay không, hãy thử ghi một dòng chi tiết rác: (1, 99, 1) — món 99 không tồn tại. Bắt sqlite3.IntegrityError, rollback, rồi in "Chan rac: OK". Nếu ghi vào được thì in "Chan rac: KHONG".',
    hint: 'Khoá chính ghép viết thành một dòng riêng cuối phần khai cột: PRIMARY KEY (don_id, mon_id). Ràng buộc khoá ngoại chỉ có hiệu lực khi đã chạy PRAGMA foreign_keys = ON. Bọc phần ghi trong try/except sqlite3.IntegrityError rồi db.rollback() — đó chính là cách bạn biến một lỗi CSDL thành một thông điệp tử tế.',
    referenceCode: `import sqlite3

MENU = [(1, "tra da", 5000), (2, "nuoc cam", 15000), (3, "sua dau", 10000)]


def giam_gia(tong):
    # Luật tiền của quán, giữ nguyên từ chặng P1 — luôn làm tròn xuống
    if tong >= 100000:
        return tong * 80 // 100
    if tong >= 50000:
        return tong * 90 // 100
    return tong


db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")          # thiếu dòng này là khoá ngoại chỉ để trang trí
db.execute("""CREATE TABLE mon (
    id INTEGER PRIMARY KEY,
    ten TEXT NOT NULL UNIQUE,
    gia INTEGER NOT NULL CHECK (gia > 0))""")
db.execute("""CREATE TABLE don (
    id INTEGER PRIMARY KEY,
    ngay TEXT NOT NULL,
    tong INTEGER NOT NULL DEFAULT 0)""")
db.execute("""CREATE TABLE chi_tiet (
    don_id INTEGER NOT NULL REFERENCES don(id),
    mon_id INTEGER NOT NULL REFERENCES mon(id),
    so_luong INTEGER NOT NULL CHECK (so_luong > 0),
    PRIMARY KEY (don_id, mon_id))""")
db.executemany("INSERT INTO mon (id, ten, gia) VALUES (?, ?, ?)", MENU)
db.commit()

ten = input("Ten mon: ").strip().lower()
so_luong = int(input("So luong: "))

mon = db.execute("SELECT id, gia FROM mon WHERE ten = ?", (ten,)).fetchone()
if mon is None:
    print("Khong co mon nay")
else:
    tong = giam_gia(mon[1] * so_luong)
    try:
        db.execute("INSERT INTO don (id, ngay, tong) VALUES (1, '2026-08-26', ?)", (tong,))
        db.execute(
            "INSERT INTO chi_tiet (don_id, mon_id, so_luong) VALUES (1, ?, ?)",
            (mon[0], so_luong),
        )
        db.commit()                              # HAI việc ghi, một lần chốt
    except sqlite3.IntegrityError:
        db.rollback()
    doc_lai = db.execute("SELECT tong FROM don WHERE id = 1").fetchone()[0]
    print(f"Tong don: {doc_lai} dong")

try:
    db.execute("INSERT INTO chi_tiet (don_id, mon_id, so_luong) VALUES (1, 99, 1)")
    db.commit()
    print("Chan rac: KHONG")
except sqlite3.IntegrityError:
    db.rollback()
    print("Chan rac: OK")`,
    checks: [
      tc(['nuoc cam', '8'], 'Tong don: 96000 dong', '8 nước cam = 120.000 → giảm 20% → 96.000'),
      tc(['tra da', '3'], 'Tong don: 15000 dong', '3 trà đá = 15.000 → chưa tới mốc giảm'),
      tc(['sua dau', '6'], 'Tong don: 54000 dong', '6 sữa đậu = 60.000 → giảm 10% → 54.000'),
      tc(
        ['  NUOC CAM  ', '8'],
        'Tong don: 96000 dong',
        'Tên thừa khoảng trắng và viết hoa vẫn tra ra',
      ),
      tc(['ca phe', '1'], 'Khong co mon nay', 'Món ngoài menu — trả lời êm, không nổ lỗi'),
      tc(
        ['tra da', '3'],
        'Chan rac: OK',
        'Khoá ngoại chặn được dòng chi tiết trỏ tới món không có thật',
        true,
      ),
    ],
  },
  {
    id: 'p5-s2',
    isMilestone: false,
    files: [P5_MAIN_FILE],
    title: 'Đăng nhập chủ quán — mật khẩu không bao giờ nằm trong CSDL',
    unitId: 'p5-u6',
    requirement:
      'Quán sắp lên Internet, nghĩa là trang quản trị sắp có người lạ gõ cửa. Thêm phần đăng nhập vào cua_hang.py.\n\n1. MUOI = "cua-hang-cua-toi". Hàm bam(mat_khau) dùng hashlib.pbkdf2_hmac("sha256", mat_khau, MUOI, 100000) rồi .hex().\n2. Bảng nguoi_dung (ten TEXT PRIMARY KEY, bam TEXT NOT NULL) trong SQLite bộ nhớ, nạp sẵn hai tài khoản: chu_quan / caphe123 và thu_ngan / tradasua. CSDL chỉ được chứa MÃ BĂM.\n3. dang_nhap(ten, mat_khau) — MỘT câu truy vấn kiểm cả tên lẫn mã băm, bắt buộc dùng tham số ?.\n\nChương trình đọc input() tên đăng nhập rồi mật khẩu, và in đúng hai dòng:\nMa bam: <16 ky tu dau cua ma bam mat khau caphe123>\nDang nhap: OK        (hoặc "Dang nhap: TU CHOI")\n\nCó ca kiểm gõ vào ô tên một chuỗi tấn công thật. Ghép chuỗi để dựng câu SQL thì ca đó cho kẻ lạ vào thẳng trang quản trị của bạn.',
    hint: 'pbkdf2_hmac nhận bytes: phải .encode() cả mật khẩu lẫn muối, rồi .hex() kết quả. Truy vấn dạng "SELECT ten FROM nguoi_dung WHERE ten = ? AND bam = ?" với tuple (ten, bam(mat_khau)) — nhớ dấu phẩy trong tuple. fetchone() trả None khi không có dòng nào, nên kiểm bằng "is not None".',
    referenceCode: `import sqlite3
import hashlib

MUOI = "cua-hang-cua-toi"
TAI_KHOAN = [("chu_quan", "caphe123"), ("thu_ngan", "tradasua")]


def bam(mat_khau):
    # Chậm có chủ đích: 100.000 vòng để không ai dò hàng loạt được
    return hashlib.pbkdf2_hmac("sha256", mat_khau.encode(), MUOI.encode(), 100000).hex()


db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE nguoi_dung (ten TEXT PRIMARY KEY, bam TEXT NOT NULL)")
for ten_tk, mk in TAI_KHOAN:
    db.execute("INSERT INTO nguoi_dung VALUES (?, ?)", (ten_tk, bam(mk)))   # chỉ lưu mã băm
db.commit()


def dang_nhap(ten, mat_khau):
    # Tham số ? -> câu lệnh và dữ liệu đi hai đường riêng, chuỗi người dùng gõ
    # không bao giờ được đọc như lệnh.
    d = db.execute(
        "SELECT ten FROM nguoi_dung WHERE ten = ? AND bam = ?",
        (ten, bam(mat_khau)),
    ).fetchone()
    return d is not None


ten = input("Ten dang nhap: ")
mat_khau = input("Mat khau: ")

print(f"Ma bam: {bam('caphe123')[:16]}")
print("Dang nhap:", "OK" if dang_nhap(ten, mat_khau) else "TU CHOI")`,
    checks: [
      tc(['chu_quan', 'caphe123'], 'Dang nhap: OK', 'Chủ quán với mật khẩu đúng vào được'),
      tc(
        ['chu_quan', 'caphe123'],
        'Ma bam: 114eaa6eba7a4653',
        'Băm đúng muối và đúng 100.000 vòng',
      ),
      tc(['chu_quan', 'caphe124'], 'Dang nhap: TU CHOI', 'Sai một ký tự mật khẩu → từ chối'),
      tc(
        ["chu_quan' --", 'khong-biet'],
        'Dang nhap: TU CHOI',
        'TẤN CÔNG THẬT: ghép chuỗi thì kẻ lạ vào được',
      ),
      tc(
        ['thu_ngan', 'tradasua'],
        'Dang nhap: OK',
        'Tài khoản thứ hai cũng vào được (không hardcode một tên)',
        true,
      ),
      tc(
        ['nguoi_la', 'gi cung duoc'],
        'Dang nhap: TU CHOI',
        'Tài khoản không tồn tại — từ chối êm, không nổ TypeError',
        true,
      ),
    ],
  },
  {
    id: 'p5-s3',
    isMilestone: false,
    files: [P5_MAIN_FILE],
    title: 'Đo và sửa một điểm chậm — báo cáo trên 10.000 đơn',
    unitId: 'p5-u7',
    requirement:
      'Quán đông lên, sổ đơn đã 10.000 dòng, và trang báo cáo doanh thu theo ngày bắt đầu ì ạch. Đây là bước bạn đo trước, sửa một chỗ, rồi đo lại.\n\nDữ liệu sinh bằng công thức (để thử được ở quy mô thật):\nDON = [(i, f"2026-08-{(i % 30) + 1:02d}", 5000 * ((i % 7) + 1)) for i in range(n)]\nNGAY = [f"2026-08-{d:02d}" for d in range(1, 31)]\n\nViết hai hàm, mỗi hàm trả về (so_thao_tac, bang) với bang là danh sách (ngay, tong) sắp theo ngày tăng dần:\n\n1. bao_cao_cham(don, ngay_ds) — với MỖI ngày, quét lại toàn bộ danh sách đơn; cộng 1 vào biến đếm mỗi lần xét một đơn.\n2. bao_cao_nhanh(don, ngay_ds) — dựng một dict ngày → tổng, duyệt danh sách đơn ĐÚNG MỘT LƯỢT; cộng 1 vào biến đếm mỗi đơn.\n\nChương trình đọc input() một dòng là n, dựng dữ liệu, chạy cả hai hàm rồi in đúng bốn dòng:\nCham: <so thao tac> thao tac\nNhanh: <so thao tac> thao tac\nGiong nhau: True\nNgay cao nhat: <ngay> <tong> dong\n\nDòng "Giong nhau" là điều kiện của mọi việc tối ưu: đổi cái giá, KHÔNG đổi kết quả. Ngày cao nhất lấy theo tổng lớn nhất; nếu hoà thì lấy ngày sớm hơn.',
    hint: 'Dựng dict TRƯỚC vòng lặp, không phải bên trong — đặt nhầm vào trong thì kết quả vẫn đúng nhưng số đếm ra n × 30 và ca kiểm sẽ đỏ. Khởi tạo sẵn mọi ngày bằng {ngay: 0 for ngay in ngay_ds} để bảng luôn đủ 30 dòng. Dòng cao nhất: max(bang, key=lambda x: (x[1], x[0])) không đúng khi hoà — muốn ngày sớm hơn thắng thì duyệt bảng đã sắp và chỉ thay khi tổng LỚN HƠN hẳn.',
    referenceCode: `def bao_cao_cham(don, ngay_ds):
    dem = 0
    bang = []
    for ngay in ngay_ds:
        tong = 0
        for _ma, n, t in don:          # quét lại CẢ sổ đơn cho từng ngày
            dem += 1
            if n == ngay:
                tong += t
        bang.append((ngay, tong))
    return dem, bang


def bao_cao_nhanh(don, ngay_ds):
    tong_theo_ngay = {ngay: 0 for ngay in ngay_ds}   # dựng MỘT lần, ngoài vòng lặp
    dem = 0
    for _ma, n, t in don:              # đúng MỘT lượt qua sổ đơn
        dem += 1
        tong_theo_ngay[n] += t
    return dem, sorted(tong_theo_ngay.items())


n = int(input("So don: "))
DON = [(i, f"2026-08-{(i % 30) + 1:02d}", 5000 * ((i % 7) + 1)) for i in range(n)]
NGAY = [f"2026-08-{d:02d}" for d in range(1, 31)]

cham, bang_cham = bao_cao_cham(DON, NGAY)
nhanh, bang_nhanh = bao_cao_nhanh(DON, NGAY)

cao_ngay, cao_tong = bang_nhanh[0]
for ngay, tong in bang_nhanh:          # hoà thì giữ ngày sớm hơn
    if tong > cao_tong:
        cao_ngay, cao_tong = ngay, tong

print(f"Cham: {cham} thao tac")
print(f"Nhanh: {nhanh} thao tac")
print(f"Giong nhau: {bang_cham == bang_nhanh}")
print(f"Ngay cao nhat: {cao_ngay} {cao_tong} dong")`,
    checks: [
      tc(
        ['10000'],
        'Cham: 300000 thao tac',
        'Quy mô thật: quét lại sổ cho từng ngày = 300.000 thao tác',
      ),
      tc(
        ['10000'],
        'Nhanh: 10000 thao tac',
        'Gom bằng dict: đúng một lượt qua sổ — nhanh gấp 30 lần',
      ),
      tc(['10000'], 'Giong nhau: True', 'Tối ưu KHÔNG được làm đổi kết quả'),
      tc(
        ['10000'],
        'Ngay cao nhat: 2026-08-05 6700000 dong',
        'Ngày doanh thu cao nhất của sổ 10.000 đơn',
      ),
      tc(['600'], 'Cham: 18000 thao tac', 'Quy mô nhỏ hơn — số đếm tỉ lệ với số đơn', true),
      tc(['600'], 'Nhanh: 600 thao tac', 'Cách gom bằng dict luôn đúng bằng số đơn', true),
    ],
  },
  {
    id: 'p5-s4',
    isMilestone: false,
    files: [P5_MAIN_FILE],
    title: 'Sẵn sàng deploy — cấu hình ra khỏi code, bí mật ra khỏi log',
    unitId: 'p5-u8',
    requirement:
      'Trước khi đưa quán lên Internet, mọi thứ khác nhau giữa "máy bạn" và "máy chủ" phải ra khỏi code.\n\nChương trình đọc dòng đầu bằng input() là số biến môi trường n, rồi n dòng dạng TEN=gia tri. Trước khi nạp, xoá sạch ba khoá PORT, DATABASE_URL, TEN_QUAN khỏi os.environ (để lượt chạy này không lẫn biến của máy). Tách mỗi dòng bằng partition("=") rồi gán vào os.environ.\n\nViết doc_cau_hinh() đọc từ os.environ:\n- PORT: mặc định "8000"; phải là số nguyên 1..65535, không thì raise ValueError(f"PORT khong hop le: {gia tri}").\n- DATABASE_URL: BẮT BUỘC, không mặc định; thiếu thì raise ValueError("Thieu bien moi truong DATABASE_URL").\n- TEN_QUAN: mặc định "Quan cua toi".\n\nViết che_bi_mat(url): có cả "://" và "@" thì trả về "<giao thuc>://***@<phan sau dau @>", ngược lại trả về "***".\n\nGọi doc_cau_hinh() trong try. Lỗi thì in đúng một dòng "Loi cau hinh: <thong diep>". Không lỗi thì in hai dòng:\nQuan: <ten quan> | cong=<so>\nKet noi CSDL: <chuoi da che>',
    hint: 'Giá trị lấy từ os.environ LUÔN là chuỗi, nên giá trị mặc định của PORT cũng phải là chuỗi "8000" — để số thì kiểu dữ liệu đổi theo môi trường. Kiểm PORT cần cả đúng kiểu (isdigit) lẫn đúng khoảng (1..65535). DATABASE_URL tuyệt đối không được có mặc định: ứng dụng thiếu CSDL mà vẫn khởi động là ứng dụng sẽ hỏng muộn hơn, ở chỗ khó tìm hơn.',
    referenceCode: `import os

KHOA = ["PORT", "DATABASE_URL", "TEN_QUAN"]


def doc_cau_hinh():
    cong = os.environ.get("PORT", "8000")            # mặc định phải là CHUỖI
    if not cong.isdigit() or not (1 <= int(cong) <= 65535):
        raise ValueError(f"PORT khong hop le: {cong}")

    url = os.environ.get("DATABASE_URL")             # bắt buộc -> không mặc định
    if not url:
        raise ValueError("Thieu bien moi truong DATABASE_URL")

    return {
        "cong": int(cong),
        "url": url,
        "ten_quan": os.environ.get("TEN_QUAN", "Quan cua toi"),
    }


def che_bi_mat(url):
    # Giữ đủ để chẩn đoán, giấu phần tên/mật khẩu — dòng này an toàn để nằm trong log
    if "://" in url and "@" in url:
        return f"{url.split('://', 1)[0]}://***@{url.split('@', 1)[1]}"
    return "***"


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
    print(f"Quan: {c['ten_quan']} | cong={c['cong']}")
    print(f"Ket noi CSDL: {che_bi_mat(c['url'])}")`,
    checks: [
      tc(
        ['1', 'DATABASE_URL=postgres://chu:matkhau@db.quan.vn:5432/quan'],
        'Quan: Quan cua toi | cong=8000',
        'Chỉ có biến bắt buộc — hai biến còn lại dùng mặc định',
      ),
      tc(
        ['1', 'DATABASE_URL=postgres://chu:matkhau@db.quan.vn:5432/quan'],
        'Ket noi CSDL: postgres://***@db.quan.vn:5432/quan',
        'Mật khẩu bị che, phần chẩn đoán được thì giữ',
      ),
      tc(
        ['3', 'PORT=3001', 'DATABASE_URL=postgres://a:b@h/q', 'TEN_QUAN=Ca phe Goc Pho'],
        'Quan: Ca phe Goc Pho | cong=3001',
        'Môi trường máy chủ: cổng và tên quán do nền tảng đặt',
      ),
      tc(
        ['1', 'PORT=8080'],
        'Loi cau hinh: Thieu bien moi truong DATABASE_URL',
        'Thiếu cấu hình bắt buộc → chết ngay lúc khởi động',
      ),
      tc(
        ['2', 'PORT=0', 'DATABASE_URL=postgres://a:b@h/q'],
        'Loi cau hinh: PORT khong hop le: 0',
        'Kiểm KHOẢNG chứ không chỉ kiểm kiểu',
        true,
      ),
      tc(
        ['1', 'DATABASE_URL=sqlite:///quan.db'],
        'Ket noi CSDL: ***',
        'Chuỗi kết nối không có phần đăng nhập → che toàn bộ cho chắc',
        true,
      ),
    ],
  },
  {
    id: 'p5-s5',
    isMilestone: true,
    files: [P5_API_FILE],
    language: 'apisim',
    title: 'MILESTONE P5 — API cửa hàng: đặt món, trừ kho, báo cáo',
    unitId: 'p5-u9',
    requirement:
      'Bước cuối cùng của dự án trục. Ráp tất cả lại thành một API mà một trang web thật gọi được.\n\nTrong api.py, dựng SQLite bộ nhớ (bật PRAGMA foreign_keys = ON) với hai bảng:\n- mon: id INTEGER PRIMARY KEY, ten TEXT NOT NULL UNIQUE, gia INTEGER NOT NULL CHECK (gia > 0), ton_kho INTEGER NOT NULL CHECK (ton_kho >= 0). Nạp: (1, tra da, 5000, kho 20) · (2, nuoc cam, 15000, kho 5) · (3, sua dau, 10000, kho 0).\n- don: id INTEGER PRIMARY KEY AUTOINCREMENT, mon_id trỏ tới mon(id), so_luong INTEGER NOT NULL CHECK (so_luong > 0), tong INTEGER NOT NULL.\n\nHai endpoint:\n\n① POST /don nhận {"mon": <ten>, "so_luong": <so nguyen>} — kiểm theo đúng thứ tự:\n- mon không phải chuỗi, hoặc so_luong không phải số nguyên dương → 422.\n- Không có món (tra bằng tham số ?, bỏ khoảng trắng thừa, không phân biệt hoa thường) → 404 "Khong co mon nay".\n- Tồn kho ít hơn số lượng đặt → 409 "Chi con <ton kho> phan". Tồn kho lấy TỪ CSDL, không bao giờ lấy theo con số client gửi lên.\n- Hợp lệ → 201, trả {"tong": <tien sau giam gia>, "ton_kho_con": <con lai>}. Ghi đơn và trừ kho phải nằm trong MỘT giao dịch (commit một lần, hỏng thì rollback).\n\n② GET /bao-cao → 200 với {"so_don": <so don>, "doanh_thu": <tong tien>}, đọc bằng COUNT/SUM (dùng COALESCE để sổ rỗng ra 0 chứ không ra None).\n\nLuật giảm giá giữ nguyên từ chặng P1: tổng ≥ 100.000 giảm 20% · ≥ 50.000 giảm 10% · làm tròn xuống.\n\nCuối file, dựng client = TestClient(app) và in đúng bảy dòng:\nDon hop le: <status>\nTong don: <tong cua don "Tra da" x20>\nHet hang: <status>\nMon la: <status>\nSo luong am: <status>\nVuot ton kho: <status>\nBao cao: <so don> don <doanh thu> dong\n\nTương ứng với: đặt "nuoc cam" x4 · đặt "Tra da" x20 (viết hoa có chủ đích) · đặt "sua dau" x1 (kho 0) · đặt "ca phe" x1 · đặt "tra da" x-2 · đặt "nuoc cam" x99 · rồi GET /bao-cao.\n\nLÀN C — phần này KHÔNG chấm tự động được và môn học không giả vờ ngược lại: đem chính file này ra máy thật, chạy bằng FastAPI + uvicorn, đổi CSDL sang file thật, chuyển cấu hình sang biến môi trường theo bước 4, rồi deploy lên nền tảng free-tier. Bằng chứng cần nộp: URL https chạy thật, bảng biến môi trường trên nền tảng (che giá trị), và log khởi động. Không có URL sống thì không có dấu HOÀN THÀNH MÔN — hệ thống không đánh dấu "đạt" thay bạn vì nó không có gì để kiểm chứng.',
    hint: 'Thứ tự kiểm quyết định mã lỗi người dùng nhận: 422 (dữ liệu vào) → 404 (tồn tại) → 409 (trạng thái). Ghi đơn và trừ kho phải cùng một commit — commit sau từng câu là mở cửa cho cảnh đơn đã ghi mà kho chưa trừ. Chú ý isinstance(so_luong, int) một mình chưa đủ: phải kèm so_luong > 0, và trong Python thì True cũng là int nên kiểm kiểu chặt tay vẫn đáng.',
    referenceCode: `import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

MENU = [(1, "tra da", 5000, 20), (2, "nuoc cam", 15000, 5), (3, "sua dau", 10000, 0)]

app = FastAPI()
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.execute("""CREATE TABLE mon (
    id INTEGER PRIMARY KEY,
    ten TEXT NOT NULL UNIQUE,
    gia INTEGER NOT NULL CHECK (gia > 0),
    ton_kho INTEGER NOT NULL CHECK (ton_kho >= 0))""")
db.execute("""CREATE TABLE don (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mon_id INTEGER NOT NULL REFERENCES mon(id),
    so_luong INTEGER NOT NULL CHECK (so_luong > 0),
    tong INTEGER NOT NULL)""")
db.executemany("INSERT INTO mon (id, ten, gia, ton_kho) VALUES (?, ?, ?, ?)", MENU)
db.commit()


def giam_gia(tong):
    # Luật tiền của quán, giữ nguyên từ chặng P1
    if tong >= 100000:
        return tong * 80 // 100
    if tong >= 50000:
        return tong * 90 // 100
    return tong


@app.post("/don")
def tao_don(du_lieu):
    ten = du_lieu.get("mon")
    so_luong = du_lieu.get("so_luong")
    if not isinstance(ten, str) or not isinstance(so_luong, int) or so_luong <= 0:
        raise HTTPException(422, "mon phai la chuoi va so_luong phai la so nguyen duong")

    mon = db.execute(
        "SELECT id, gia, ton_kho FROM mon WHERE ten = ?", (ten.strip().lower(),)
    ).fetchone()
    if mon is None:
        raise HTTPException(404, "Khong co mon nay")

    if mon[2] < so_luong:                          # tồn kho đọc TỪ CSDL
        raise HTTPException(409, f"Chi con {mon[2]} phan")

    tong = giam_gia(mon[1] * so_luong)
    try:
        db.execute(
            "INSERT INTO don (mon_id, so_luong, tong) VALUES (?, ?, ?)",
            (mon[0], so_luong, tong),
        )
        db.execute("UPDATE mon SET ton_kho = ton_kho - ? WHERE id = ?", (so_luong, mon[0]))
        db.commit()                                # ghi đơn + trừ kho, MỘT lần chốt
    except sqlite3.IntegrityError:
        db.rollback()
        raise HTTPException(409, "Ghi khong thanh cong")

    return {"tong": tong, "ton_kho_con": mon[2] - so_luong}


@app.get("/bao-cao")
def bao_cao():
    d = db.execute("SELECT COUNT(*), COALESCE(SUM(tong), 0) FROM don").fetchone()
    return {"so_don": d[0], "doanh_thu": d[1]}


client = TestClient(app)
print("Don hop le:", client.post("/don", json={"mon": "nuoc cam", "so_luong": 4}).status_code)
print("Tong don:", client.post("/don", json={"mon": "Tra da", "so_luong": 20}).json()["tong"])
print("Het hang:", client.post("/don", json={"mon": "sua dau", "so_luong": 1}).status_code)
print("Mon la:", client.post("/don", json={"mon": "ca phe", "so_luong": 1}).status_code)
print("So luong am:", client.post("/don", json={"mon": "tra da", "so_luong": -2}).status_code)
print("Vuot ton kho:", client.post("/don", json={"mon": "nuoc cam", "so_luong": 99}).status_code)
bc = client.get("/bao-cao").json()
print(f"Bao cao: {bc['so_don']} don {bc['doanh_thu']} dong")`,
    // Bộ chấm chạy probe THAY api.py (api.py vẫn nằm trong thư mục làm việc).
    probeCode: P5_S5_PROBE,
    checks: [
      tc([], 'Don hop le: 201', 'Đơn hợp lệ đầu tiên được nhận'),
      tc(
        [],
        'Tong don: 80000',
        '20 trà đá = 100.000 → giảm 20% → 80.000 (luật tiền giữ từ chặng P1)',
      ),
      tc([], 'Het hang: 409', 'Món tồn kho 0 → 409, không phải 404'),
      tc([], 'Mon la: 404', 'Món ngoài menu → 404, không phải 409'),
      tc([], 'So luong am: 422', 'Số lượng âm bị chặn TRƯỚC khi đụng CSDL'),
      tc([], 'Vuot ton kho: 409', 'Đặt quá tồn kho → 409, tồn kho lấy từ CSDL'),
      tc(
        [],
        'Bao cao: 2 don 134000 dong',
        'Sổ đơn không lệch: chỉ 2 lượt thành công được ghi',
        true,
      ),
      // Đề ①: "mon không phải chuỗi, hoặc so_luong không phải số nguyên dương → 422".
      tc([], 'KT SAI KIEU: 422 422 422', 'Ca ẩn: sai kiểu dữ liệu (dữ liệu khác đề) → 422', true),
      // Đề ①: "kiểm theo đúng thứ tự" 422 → 404 → 409; "bỏ khoảng trắng thừa, không phân biệt hoa
      // thường"; "Tồn kho ít hơn số lượng đặt → 409" (số lượng cực lớn → luôn quá kho).
      tc([], 'KT THU TU: 422 404 409', 'Ca ẩn: đúng thứ tự kiểm, tên chuẩn hoá tìm ra món', true),
      // Đề ①: chỉ "Hợp lệ → 201 … Ghi đơn" + ② báo cáo "đọc bằng COUNT/SUM" — lượt bị từ chối
      // không làm sổ đổi (đo bằng hiệu trước/sau).
      tc([], 'KT SO KHONG DOI: 0 0', 'Ca ẩn: lượt bị từ chối không ghi gì vào sổ', true),
    ],
  },
]
