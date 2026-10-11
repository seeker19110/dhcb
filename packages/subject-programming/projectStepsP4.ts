// projectStepsP4 — DỰ ÁN TRỤC T1 "Cửa hàng của tôi", CHẶNG P4 "Có xương sống" (PR-L17).
// Đặc tả: dac-ta-du-an-xuyen-suot-mon-lap-trinh-2026-08-24.md §3 chặng P4 — "mô hình hoá lại
// bằng class · refactor phần lõi · lỗi nghiệp vụ + log · test cho lõi tính tiền · API CRUD
// trên SQLite · milestone: full-stack mini chạy local (backend API + test + Git sạch)".
//
// KHÁC CHẶNG P3 Ở CHỖ: P3 mỗi bước một ngôn ngữ khác nhau (html/dom/sql/fetch), còn chặng này
// quay về MỘT engine duy nhất — Python — nhưng chạy trên ba LÀN khác nhau (pyLanes.ts):
//   bước 1–3 làn `python` thuần · bước 4 làn `pytest` · bước 5–6 làn `apisim`.
// Ranh giới mô phỏng của hai làn sau nói rõ ở docs/research/dac-ta-bac-p4-mo-phong-den-dau-
// 2026-08-26.md: định tuyến/JSON/SQLite chạy THẬT, nhưng không có tiến trình server nào.
//
// Mọi dòng chấm điểm in KHÔNG DẤU, như ba chặng trước.
//
// LUẬT TIỀN CỦA QUÁN (giữ nguyên từ chặng P1, để dự án là MỘT dòng chảy chứ không phải 4 bài
// rời): tổng ≥ 100.000 giảm 20% · tổng ≥ 50.000 giảm 10% · dưới đó giữ nguyên; luôn làm tròn
// xuống. Menu vẫn 3 món: tra da 5000 · nuoc cam 15000 · sua dau 10000.
import { TestCaseSchema, type ProgrammingTestCase } from './lessonTypes.js'
// Xuống projectStepTypes (KHÔNG phải projectSteps): file kia import ngược lên đây để gom
// PROJECT_STAGES, nên import chéo sẽ tạo chu trình — cổng `codemap -- cycles` chặn CI.
import type { ProjectStep } from './projectStepTypes.js'

export const P4_MAIN_FILE = 'cua_hang.py'
export const P4_TEST_FILE = 'test_cua_hang.py'
export const P4_API_FILE = 'api.py'

const tc = (
  stdinLines: string[],
  expected: string,
  label: string,
  hidden = false,
  match: 'contains' | 'exact' = 'contains',
): ProgrammingTestCase => TestCaseSchema.parse({ stdinLines, expected, label, hidden, match })

// ── Probe của BỘ CHẤM cho hai bước làn apisim (đặc tả 2026-10-11-apisim-ca-an-chong-go-cung) ──
// Chạy NGUYÊN api.py của học viên bằng runpy (run_name="__main__" để khối kiểm thử bọc trong
// `if __name__ == "__main__":` vẫn chạy → các ca cũ vẫn in), rồi TỰ gọi API bằng dữ liệu riêng.
// Mọi request TƯƠNG ĐỐI với trạng thái: khối kiểm thử của học viên đã thêm/xoá trước đó.
// Lời giải chỉ in sẵn đáp án không có biến `app` → KeyError → mọi ca của lượt đó trượt.
const P4_S5_PROBE = `import runpy
from fastapi.testclient import TestClient

g = runpy.run_path("api.py", run_name="__main__")
c = TestClient(g["app"])
n0 = len(c.get("/mon").json())
tao = c.post("/mon", json={"ten": "khoai lang say", "gia": 12345})
moi = tao.json()["id"]
u = "/mon/" + str(moi)
doc = c.get(u)
print("KT TAO DOC:", tao.status_code, doc.status_code, doc.json()["ten"], doc.json()["gia"])
ds = c.get("/mon").json()
print("KT DS THEM:", len(ds) - n0, any(m["id"] == moi for m in ds))
xoa = c.delete(u)
print("KT XOA:", xoa.status_code, xoa.json()["da_xoa"] == moi, c.get(u).status_code, c.get("/mon/987654").status_code)`

const P4_S6_PROBE = `import runpy
from fastapi.testclient import TestClient

g = runpy.run_path("api.py", run_name="__main__")
c = TestClient(g["app"])
# Gia/tong do nguoi goi gui len phai bi BO QUA — gia lay tu bang mon
tao = c.post("/don", json={"ban": 7, "tong": 1, "thanh_toan": 1, "dong": [
    {"mon_id": 3, "so_luong": 5, "gia": 1}, {"mon_id": 2, "so_luong": 4, "gia": 1}]})
t = tao.json()
print("KT DON MOI:", tao.status_code, t["ban"], t["tong"], t["thanh_toan"])
doc = c.get("/don/" + str(t["id"]))
d = doc.json()
ten = ",".join(sorted(x["ten"] for x in d["dong"]))
print("KT DOC LAI:", doc.status_code, d["ban"], len(d["dong"]), sum(x["thanh_tien"] for x in d["dong"]), ten)


def gui(du_lieu):
    return c.post("/don", json=du_lieu).status_code


sai_sl = gui({"ban": 2, "dong": [{"mon_id": 2, "so_luong": 0}]})
mon_la = gui({"ban": 2, "dong": [{"mon_id": 987654, "so_luong": 1}]})
print("KT LOI:", sai_sl, gui({"ban": 2}), mon_la, c.get("/don/987654").status_code)`

export const P4_PROJECT_STEPS: ProjectStep[] = [
  {
    id: 'p4-s1',
    isMilestone: false,
    files: [P4_MAIN_FILE],
    title: 'Mô hình hoá cửa hàng bằng class — Mon và Menu',
    unitId: 'p4-u1',
    requirement:
      'Từ bậc này, cửa hàng có XƯƠNG SỐNG: dữ liệu và việc làm được của nó đi chung một chỗ.\n\nViết lại cua_hang.py bằng hai class:\n\n1. class Mon — __init__(self, ten, gia); phương thức thanh_tien(self, so_luong) trả về gia × so_luong.\n2. class Menu — __init__(self) tạo danh sách rỗng; them(self, mon) thêm một Mon; tim(self, ten) trả về Mon khớp tên hoặc None nếu không có. tim() phải bỏ khoảng trắng thừa và KHÔNG phân biệt hoa/thường (như chặng P2).\n\nChương trình chính:\n- Tạo Menu với đúng 3 món: tra da 5000 · nuoc cam 15000 · sua dau 10000 (tên viết thường, không dấu).\n- In "Menu: <so mon> mon".\n- Đọc input() tên món rồi input() số lượng.\n- Tìm thấy → in "<ten mon trong menu> x<so luong> = <thanh tien>"; không thấy → in "Khong co mon nay".',
    hint: 'Trong class, self là chính đồ vật đang thao tác: self.gia lấy giá của riêng món đó. Menu chỉ cần self.ds = [] rồi tim() duyệt qua: for mon in self.ds: if mon.ten == ten.strip().lower(): return mon — hết vòng lặp mà không thấy thì return None.',
    referenceCode: `class Mon:
    def __init__(self, ten, gia):
        self.ten = ten
        self.gia = gia

    def thanh_tien(self, so_luong):
        return self.gia * so_luong


class Menu:
    def __init__(self):
        self.ds = []

    def them(self, mon):
        self.ds.append(mon)

    def tim(self, ten):
        can = ten.strip().lower()
        for mon in self.ds:
            if mon.ten == can:
                return mon
        return None


menu = Menu()
menu.them(Mon("tra da", 5000))
menu.them(Mon("nuoc cam", 15000))
menu.them(Mon("sua dau", 10000))
print(f"Menu: {len(menu.ds)} mon")

ten = input("Ten mon: ")
so_luong = int(input("So luong: "))
mon = menu.tim(ten)
if mon is None:
    print("Khong co mon nay")
else:
    print(f"{mon.ten} x{so_luong} = {mon.thanh_tien(so_luong)}")`,
    checks: [
      tc(['tra da', '2'], 'Menu: 3 mon', 'Menu giữ đủ 3 món của quán'),
      tc(['tra da', '2'], 'tra da x2 = 10000', 'Mon.thanh_tien tính đúng'),
      tc(['nuoc cam', '3'], 'nuoc cam x3 = 45000', 'Tra được món khác trong menu'),
      tc(
        ['  Sua Dau ', '4'],
        'sua dau x4 = 40000',
        'Ca ẩn: tên gõ hoa hoặc thừa khoảng trắng vẫn tìm ra',
        true,
      ),
      tc(['ca phe', '1'], 'Khong co mon nay', 'Ca ẩn: món lạ báo rõ, không vỡ chương trình', true),
    ],
  },
  {
    id: 'p4-s2',
    isMilestone: false,
    language: 'python',
    files: [P4_MAIN_FILE],
    title: 'Refactor phần lõi — thêm HoaDon bằng KẾT HỢP, không kế thừa',
    unitId: 'p4-u3',
    requirement:
      'Giữ NGUYÊN Mon và Menu của bước 1, thêm class HoaDon. Chú ý: hoá đơn KHÔNG kế thừa Mon — một hoá đơn không "là một món", nó CHỨA các dòng món. Đó là kết hợp (composition), và nó là lựa chọn đúng ở đây.\n\n1. class HoaDon — __init__(self) giữ danh sách dòng rỗng; them(self, mon, so_luong) thêm một dòng; tong(self) trả về tổng thành tiền các dòng; thanh_toan(self) áp luật giảm giá của quán lên tong(): ≥ 100000 giảm 20%, ≥ 50000 giảm 10%, dưới đó giữ nguyên (làm tròn XUỐNG); in_hoa_don(self) in mỗi dòng "<ten> x<so luong> = <thanh tien>", rồi "Tong cong: <tong>", rồi "Thanh toan: <thanh toan>".\n\n2. Chương trình chính: lặp đọc input() mỗi lần một dòng dạng "<ten mon>,<so luong>"; gõ "xong" thì dừng và gọi in_hoa_don(). Món không có trong menu → in "Khong co mon nay" và bỏ qua dòng đó (KHÔNG tính vào hoá đơn).',
    hint: 'HoaDon giữ self.dong = [] và mỗi dòng là một cặp (mon, so_luong) — nhờ giữ chính đối tượng Mon nên tong() chỉ cần sum(mon.thanh_tien(sl) for mon, sl in self.dong), không phải chép lại giá. Làm tròn xuống dùng phép chia lấy nguyên: tien * 90 // 100.',
    referenceCode: `class Mon:
    def __init__(self, ten, gia):
        self.ten = ten
        self.gia = gia

    def thanh_tien(self, so_luong):
        return self.gia * so_luong


class Menu:
    def __init__(self):
        self.ds = []

    def them(self, mon):
        self.ds.append(mon)

    def tim(self, ten):
        can = ten.strip().lower()
        for mon in self.ds:
            if mon.ten == can:
                return mon
        return None


class HoaDon:
    """CHUA cac dong mon (ket hop) — khong ke thua Mon."""

    def __init__(self):
        self.dong = []

    def them(self, mon, so_luong):
        self.dong.append((mon, so_luong))

    def tong(self):
        return sum(mon.thanh_tien(sl) for mon, sl in self.dong)

    def thanh_toan(self):
        tien = self.tong()
        if tien >= 100000:
            return tien * 80 // 100
        if tien >= 50000:
            return tien * 90 // 100
        return tien

    def in_hoa_don(self):
        for mon, sl in self.dong:
            print(f"{mon.ten} x{sl} = {mon.thanh_tien(sl)}")
        print(f"Tong cong: {self.tong()}")
        print(f"Thanh toan: {self.thanh_toan()}")


menu = Menu()
menu.them(Mon("tra da", 5000))
menu.them(Mon("nuoc cam", 15000))
menu.them(Mon("sua dau", 10000))

hoa_don = HoaDon()
while True:
    dong = input("Dong hang: ").strip()
    if dong.lower() == "xong":
        break
    ten, so_luong = dong.split(",")
    mon = menu.tim(ten)
    if mon is None:
        print("Khong co mon nay")
        continue
    hoa_don.them(mon, int(so_luong))

hoa_don.in_hoa_don()`,
    checks: [
      tc(['tra da,2', 'nuoc cam,3', 'xong'], 'tra da x2 = 10000', 'In từng dòng hoá đơn'),
      tc(['tra da,2', 'nuoc cam,3', 'xong'], 'Tong cong: 55000', 'Tổng cộng dồn nhiều dòng'),
      tc(['tra da,2', 'nuoc cam,3', 'xong'], 'Thanh toan: 49500', 'Giảm 10% ở mốc 50.000'),
      tc(['nuoc cam,10', 'xong'], 'Thanh toan: 120000', 'Giảm 20% ở mốc 100.000'),
      tc(['tra da,3', 'xong'], 'Thanh toan: 15000', 'Ca ẩn: dưới mốc thì KHÔNG giảm', true),
      tc(
        ['ca phe,2', 'tra da,2', 'xong'],
        'Tong cong: 10000',
        'Ca ẩn: món lạ bị bỏ qua, không lọt vào hoá đơn',
        true,
      ),
    ],
  },
  {
    id: 'p4-s3',
    isMilestone: false,
    language: 'python',
    files: [P4_MAIN_FILE],
    title: 'Lỗi nghiệp vụ riêng + nhật ký chạy (logging)',
    unitId: 'p4-u4',
    requirement:
      'Quán bắt đầu có tồn kho, và "bán quá tồn" là một QUY TẮC KINH DOANH bị vi phạm — không phải lỗi lập trình. Nó phải có tên riêng.\n\nGiữ nguyên bước 2, thêm:\n\n1. class KhoKhongDu(Exception) — lớp lỗi riêng của quán.\n2. Mon nhận thêm tồn kho: Mon(ten, gia, ton). Menu của quán: tra da 5000 ton 10 · nuoc cam 15000 ton 5 · sua dau 10000 ton 8.\n3. HoaDon.them(mon, so_luong): so_luong > mon.ton thì raise KhoKhongDu(f"Kho chi con {mon.ton}, khong du {so_luong}"); ngược lại trừ tồn kho rồi thêm dòng.\n4. Ném ở chỗ PHÁT HIỆN, bắt ở chỗ NÓI CHUYỆN với người dùng: vòng lặp nhập bọc try/except KhoKhongDu, in "Loi: <thong diep>" và ghi logging.warning(f"Tu choi don hang: {e}").\n5. Nhật ký: cấu hình logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s", stream=sys.stdout) — mặc định logging ghi ra stderr, phải chuyển sang stdout thì bạn (và bộ chấm) mới đọc được cùng một dòng chảy. Ghi logging.info("Bat dau ca ban hang") trước vòng lặp và logging.info(f"Ket thuc ca, doanh thu {hoa_don.thanh_toan()}") sau khi in hoá đơn.',
    hint: 'Đơn bị từ chối thì KHÔNG được trừ tồn kho — muốn chắc điều đó, cứ kiểm tra và raise TRƯỚC, mọi lệnh thay đổi dữ liệu đặt SAU câu raise. except KhoKhongDu as e rồi dùng f"{e}" để lấy lại thông điệp đã ném.',
    referenceCode: `import logging
import sys


class KhoKhongDu(Exception):
    """Loi NGHIEP VU: khach mua nhieu hon ton kho."""


class Mon:
    def __init__(self, ten, gia, ton):
        self.ten = ten
        self.gia = gia
        self.ton = ton

    def thanh_tien(self, so_luong):
        return self.gia * so_luong


class Menu:
    def __init__(self):
        self.ds = []

    def them(self, mon):
        self.ds.append(mon)

    def tim(self, ten):
        can = ten.strip().lower()
        for mon in self.ds:
            if mon.ten == can:
                return mon
        return None


class HoaDon:
    def __init__(self):
        self.dong = []

    def them(self, mon, so_luong):
        if so_luong > mon.ton:
            raise KhoKhongDu(f"Kho chi con {mon.ton}, khong du {so_luong}")
        mon.ton = mon.ton - so_luong
        self.dong.append((mon, so_luong))

    def tong(self):
        return sum(mon.thanh_tien(sl) for mon, sl in self.dong)

    def thanh_toan(self):
        tien = self.tong()
        if tien >= 100000:
            return tien * 80 // 100
        if tien >= 50000:
            return tien * 90 // 100
        return tien

    def in_hoa_don(self):
        for mon, sl in self.dong:
            print(f"{mon.ten} x{sl} = {mon.thanh_tien(sl)}")
        print(f"Tong cong: {self.tong()}")
        print(f"Thanh toan: {self.thanh_toan()}")


logging.basicConfig(
    level=logging.INFO, format="[%(levelname)s] %(message)s", stream=sys.stdout
)

menu = Menu()
menu.them(Mon("tra da", 5000, 10))
menu.them(Mon("nuoc cam", 15000, 5))
menu.them(Mon("sua dau", 10000, 8))

hoa_don = HoaDon()
logging.info("Bat dau ca ban hang")
while True:
    dong = input("Dong hang: ").strip()
    if dong.lower() == "xong":
        break
    ten, so_luong = dong.split(",")
    mon = menu.tim(ten)
    if mon is None:
        print("Khong co mon nay")
        continue
    try:
        hoa_don.them(mon, int(so_luong))
    except KhoKhongDu as e:
        print(f"Loi: {e}")
        logging.warning(f"Tu choi don hang: {e}")

hoa_don.in_hoa_don()
logging.info(f"Ket thuc ca, doanh thu {hoa_don.thanh_toan()}")`,
    checks: [
      tc(['tra da,2', 'xong'], '[INFO] Bat dau ca ban hang', 'Nhật ký ghi mốc mở ca (ra stdout)'),
      tc(
        ['nuoc cam,9', 'xong'],
        'Loi: Kho chi con 5, khong du 9',
        'Bán quá tồn báo lỗi nghiệp vụ cho người dùng',
      ),
      tc(
        ['nuoc cam,9', 'xong'],
        '[WARNING] Tu choi don hang: Kho chi con 5, khong du 9',
        'Đơn bị từ chối được ghi lại cho người quản lý',
      ),
      tc(
        ['tra da,2', 'nuoc cam,3', 'xong'],
        '[INFO] Ket thuc ca, doanh thu 49500',
        'Nhật ký chốt ca kèm doanh thu đã giảm giá',
      ),
      tc(
        ['nuoc cam,9', 'nuoc cam,5', 'xong'],
        'nuoc cam x5 = 75000',
        'Ca ẩn: đơn bị từ chối KHÔNG được trừ tồn kho',
        true,
      ),
      tc(
        ['tra da,4', 'tra da,7', 'xong'],
        'Loi: Kho chi con 6, khong du 7',
        'Ca ẩn: tồn kho trừ dần qua các đơn đã bán',
        true,
      ),
    ],
  },
  {
    id: 'p4-s4',
    isMilestone: false,
    language: 'pytest',
    files: [P4_TEST_FILE],
    title: 'Viết test cho lõi tính tiền của chính dự án',
    unitId: 'p4-u6',
    requirement:
      'Tới đây dự án đã đủ lớn để bạn KHÔNG còn nhớ hết luật của nó. Đó là lúc test thay bạn nhớ.\n\nFile test_cua_hang.py có hai phần:\n\nPHẦN 1 — lõi đem ra kiểm (chép đúng như dưới, đừng sửa):\n\nclass KhoKhongDu(Exception):\n    pass\n\ndef thanh_toan(tong):\n    if tong >= 100000:\n        return tong * 80 // 100\n    if tong >= 50000:\n        return tong * 90 // 100\n    return tong\n\ndef ban(ton, mua):\n    if mua > ton:\n        raise KhoKhongDu(f"Kho chi con {ton}, khong du {mua}")\n    return ton - mua\n\nPHẦN 2 — test của bạn. Viết ĐÚNG 6 hàm test_* (bộ chạy tự gọi chúng, bạn không tự gọi):\n1. test_duoi_moc_50k — 49999 giữ nguyên 49999\n2. test_dung_moc_50k — 50000 giảm còn 45000\n3. test_dung_moc_100k — 100000 giảm còn 80000\n4. test_tren_moc_100k — 120000 giảm còn 96000\n5. test_ban_du_kho — ban(10, 4) còn 6\n6. test_ban_qua_kho_thi_nem_loi — with pytest.raises(KhoKhongDu): ban(5, 9)\n\nHAI CA BIÊN LÀ LINH HỒN CỦA BƯỚC NÀY: ĐÚNG mốc giảm giá (49999 vs 50000 — chỗ dễ viết nhầm > thành >=) và kho âm (bán 9 khi còn 5 phải NÉM LỖI, tuyệt đối không được trả về −4 rồi đi tiếp lặng lẽ).',
    hint: 'import pytest ở đầu file. Ca "phải ném lỗi" viết bằng khối with: with pytest.raises(KhoKhongDu): ban(5, 9) — test đạt khi khối đó THẬT SỰ ném đúng loại lỗi, và trượt nếu nó chạy êm.',
    referenceCode: `import pytest


# ---- Loi cua du an dem ra kiem ----
class KhoKhongDu(Exception):
    pass


def thanh_toan(tong):
    if tong >= 100000:
        return tong * 80 // 100
    if tong >= 50000:
        return tong * 90 // 100
    return tong


def ban(ton, mua):
    if mua > ton:
        raise KhoKhongDu(f"Kho chi con {ton}, khong du {mua}")
    return ton - mua


# ---- Test cua ban ----
def test_duoi_moc_50k():
    assert thanh_toan(49999) == 49999


def test_dung_moc_50k():
    assert thanh_toan(50000) == 45000


def test_dung_moc_100k():
    assert thanh_toan(100000) == 80000


def test_tren_moc_100k():
    assert thanh_toan(120000) == 96000


def test_ban_du_kho():
    assert ban(10, 4) == 6


def test_ban_qua_kho_thi_nem_loi():
    with pytest.raises(KhoKhongDu):
        ban(5, 9)`,
    checks: [
      tc([], '=== 6 passed, 0 failed ===', 'Đủ 6 test và tất cả đều xanh'),
      tc([], 'test_dung_moc_50k PASSED', 'Ca biên ĐÚNG mốc giảm giá được phủ'),
      tc([], 'test_duoi_moc_50k PASSED', 'Ca ngay dưới mốc được phủ (bắt lỗi > vs >=)'),
      tc([], 'test_ban_qua_kho_thi_nem_loi PASSED', 'Ca kho âm được phủ bằng pytest.raises'),
      tc([], 'test_dung_moc_100k PASSED', 'Ca ẩn: mốc giảm giá thứ hai cũng được phủ', true),
      tc([], '0 failed', 'Ca ẩn: không còn test nào đỏ', true),
    ],
  },
  {
    id: 'p4-s5',
    isMilestone: false,
    language: 'apisim',
    files: [P4_API_FILE],
    title: 'API CRUD cho món — dữ liệu quán rời khỏi máy cá nhân',
    unitId: 'p4-u8',
    requirement:
      'Viết api.py: một API kiểu REST cho bảng món, dữ liệu nằm trong SQLite.\n\nDựng sẵn CSDL trong bộ nhớ: bảng mon(id INTEGER PRIMARY KEY, ten TEXT, gia INTEGER) với đúng 3 món của quán — tra da 5000 · nuoc cam 15000 · sua dau 10000.\n\nBốn cửa:\n1. GET /mon — trả DANH SÁCH mọi món, mỗi món là dict {id, ten, gia}.\n2. GET /mon/{mon_id} (mon_id: int) — trả một món; không có thì raise HTTPException(404, f"Khong tim thay mon {mon_id}").\n3. POST /mon — nhận thân JSON qua tham số tên du_lieu (dict có "ten" và "gia"), ghi vào CSDL, trả {id, ten, gia} với id vừa sinh (mã 201 là mặc định của @app.post).\n4. DELETE /mon/{mon_id} — xoá món, trả {"da_xoa": mon_id}.\n\nCuối file, dán khối kiểm thử sau (in GIÁ TRỊ ĐƠN LẺ, không in cả dict — thứ tự khoá trong dict không đáng tin để chấm):\n\nclient = TestClient(app)\nds = client.get("/mon")\nprint("DS:", ds.status_code, len(ds.json()))\nmot = client.get("/mon/2")\nprint("MOT:", mot.status_code, mot.json()["ten"])\nprint("THIEU:", client.get("/mon/99").status_code)\ntao = client.post("/mon", json={"ten": "ca phe", "gia": 20000})\nprint("TAO:", tao.status_code, tao.json()["id"])\nprint("GIA MOI:", client.get("/mon/4").json()["gia"])\nprint("XOA:", client.delete("/mon/1").status_code)\nprint("CON LAI:", len(client.get("/mon").json()))',
    hint: 'Ghi chú kiểu mon_id: int là bắt buộc — URL vốn là chuỗi, thiếu nó thì "2" đem so với số trong CSDL sẽ không khớp và bạn nhận 404 ở chỗ lẽ ra 200. Với POST: cur = db.execute("INSERT ...") rồi cur.lastrowid cho id mới, và nhớ db.commit() sau mọi INSERT/DELETE.',
    referenceCode: `import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

app = FastAPI()

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE mon (id INTEGER PRIMARY KEY, ten TEXT, gia INTEGER)")
db.execute("INSERT INTO mon (ten, gia) VALUES ('tra da', 5000)")
db.execute("INSERT INTO mon (ten, gia) VALUES ('nuoc cam', 15000)")
db.execute("INSERT INTO mon (ten, gia) VALUES ('sua dau', 10000)")
db.commit()


@app.get("/mon")
def danh_sach():
    dong = db.execute("SELECT id, ten, gia FROM mon ORDER BY id").fetchall()
    return [{"id": d[0], "ten": d[1], "gia": d[2]} for d in dong]


@app.get("/mon/{mon_id}")
def mot_mon(mon_id: int):
    d = db.execute("SELECT id, ten, gia FROM mon WHERE id = ?", (mon_id,)).fetchone()
    if d is None:
        raise HTTPException(404, f"Khong tim thay mon {mon_id}")
    return {"id": d[0], "ten": d[1], "gia": d[2]}


@app.post("/mon")
def them_mon(du_lieu):
    cur = db.execute(
        "INSERT INTO mon (ten, gia) VALUES (?, ?)", (du_lieu["ten"], du_lieu["gia"])
    )
    db.commit()
    return {"id": cur.lastrowid, "ten": du_lieu["ten"], "gia": du_lieu["gia"]}


@app.delete("/mon/{mon_id}")
def xoa_mon(mon_id: int):
    db.execute("DELETE FROM mon WHERE id = ?", (mon_id,))
    db.commit()
    return {"da_xoa": mon_id}


client = TestClient(app)
ds = client.get("/mon")
print("DS:", ds.status_code, len(ds.json()))
mot = client.get("/mon/2")
print("MOT:", mot.status_code, mot.json()["ten"])
print("THIEU:", client.get("/mon/99").status_code)
tao = client.post("/mon", json={"ten": "ca phe", "gia": 20000})
print("TAO:", tao.status_code, tao.json()["id"])
print("GIA MOI:", client.get("/mon/4").json()["gia"])
print("XOA:", client.delete("/mon/1").status_code)
print("CON LAI:", len(client.get("/mon").json()))`,
    // Bộ chấm chạy probe THAY api.py (api.py vẫn nằm trong thư mục làm việc).
    probeCode: P4_S5_PROBE,
    checks: [
      tc([], 'DS: 200 3', 'GET /mon trả 200 và đủ 3 món của quán'),
      tc([], 'MOT: 200 nuoc cam', 'GET /mon/2 lấy đúng món (tham số đường dẫn đổi sang số)'),
      tc([], 'THIEU: 404', 'Món không tồn tại trả 404, không phải 200 kèm dữ liệu rỗng'),
      tc([], 'TAO: 201 4', 'POST /mon trả 201 và id vừa sinh'),
      tc([], 'GIA MOI: 20000', 'Món vừa tạo đọc lại được từ CSDL'),
      tc([], 'XOA: 200', 'Ca ẩn: DELETE trả 200', true),
      tc([], 'CON LAI: 3', 'Ca ẩn: thêm 1 xoá 1 thì còn đúng 3 món (có commit thật)', true),
      // Đề cửa 3 + 2: "POST /mon … ghi vào CSDL, trả {id, ten, gia} với id vừa sinh (mã 201)" và
      // "GET /mon/{mon_id} — trả một món" — đọc lại đúng id vừa nhận, dữ liệu KHÁC đề.
      tc(
        [],
        'KT TAO DOC: 201 200 khoai lang say 12345',
        'Ca ẩn: món mới (dữ liệu của bộ chấm) tạo xong đọc lại đúng theo id',
        true,
      ),
      // Đề cửa 1: "GET /mon — trả DANH SÁCH mọi món" — danh sách tăng đúng 1 và có món vừa tạo.
      tc([], 'KT DS THEM: 1 True', 'Ca ẩn: danh sách có thêm đúng món vừa tạo', true),
      // Đề cửa 4 + 2: "DELETE … xoá món, trả {"da_xoa": mon_id}"; "không có thì … 404".
      tc(
        [],
        'KT XOA: 200 True 404 404',
        'Ca ẩn: xoá món vừa tạo, đọc lại và hỏi id rất lớn đều 404',
        true,
      ),
    ],
  },
  {
    id: 'p4-s6',
    isMilestone: true,
    language: 'apisim',
    files: [P4_API_FILE],
    title: 'Milestone P4 — API đơn hàng, giá lấy từ CSDL',
    unitId: 'p4-u12',
    requirement:
      'Bước chốt chặng: nối phần đơn hàng vào API để frontend gọi được. LUẬT SỐNG CÒN — giá TUYỆT ĐỐI lấy từ CSDL, không bao giờ nhận giá do người gọi gửi lên. Ai cũng có thể sửa dữ liệu gửi từ trình duyệt; tin nó là mở cửa cho khách tự đặt giá 0 đồng.\n\nGiữ nguyên 4 cửa của bước 5, thêm bảng don(id, ban, tong, thanh_toan) và chi_tiet(don_id, mon_id, so_luong), rồi:\n\n1. POST /don — thân JSON: {"ban": <so ban>, "dong": [{"mon_id": .., "so_luong": ..}, ...]}.\n   - "dong" rỗng hoặc thiếu → raise HTTPException(422, "Don hang phai co it nhat mot dong")\n   - so_luong <= 0 → raise HTTPException(422, "So luong phai lon hon 0")\n   - mon_id không có trong bảng mon → raise HTTPException(404, f"Khong tim thay mon {mon_id}")\n   - hợp lệ → tra giá TỪ BẢNG mon, tính tong và thanh_toan theo luật quán (≥100000 giảm 20%, ≥50000 giảm 10%, làm tròn xuống), ghi don + chi_tiet, trả {id, ban, tong, thanh_toan} (mã 201).\n2. GET /don/{don_id} (don_id: int) — trả {id, ban, tong, thanh_toan, dong} với "dong" là danh sách {ten, so_luong, thanh_tien}; không có đơn thì 404.\n\nCuối file dán khối kiểm thử sau (in giá trị đơn lẻ):\n\nclient = TestClient(app)\ntao = client.post("/don", json={"ban": 3, "dong": [{"mon_id": 1, "so_luong": 2}, {"mon_id": 2, "so_luong": 3}]})\nprint("TAO:", tao.status_code, tao.json()["id"])\nprint("TONG:", tao.json()["tong"])\nprint("THANH TOAN:", tao.json()["thanh_toan"])\ndoc = client.get("/don/1")\nprint("DOC:", doc.status_code, doc.json()["ban"])\nprint("SO DONG:", len(doc.json()["dong"]))\nprint("DONG DAU:", doc.json()["dong"][0]["ten"], doc.json()["dong"][0]["thanh_tien"])\nprint("RONG:", client.post("/don", json={"ban": 1, "dong": []}).status_code)\nprint("SL AM:", client.post("/don", json={"ban": 1, "dong": [{"mon_id": 1, "so_luong": -2}]}).status_code)\nprint("MON LA:", client.post("/don", json={"ban": 1, "dong": [{"mon_id": 99, "so_luong": 1}]}).status_code)\nprint("DON LA:", client.get("/don/99").status_code)',
    hint: 'Kiểm dữ liệu TRƯỚC, ghi CSDL SAU — đơn sai mà đã kịp ghi một nửa vào bảng thì sổ sách hỏng. Duyệt lượt một để tra giá và cộng tổng (raise ngay khi gặp dòng sai), duyệt lượt hai để INSERT chi_tiet sau khi đã có don_id từ cur.lastrowid.',
    referenceCode: `import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

app = FastAPI()

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE mon (id INTEGER PRIMARY KEY, ten TEXT, gia INTEGER)")
db.execute(
    "CREATE TABLE don (id INTEGER PRIMARY KEY, ban INTEGER, tong INTEGER, thanh_toan INTEGER)"
)
db.execute("CREATE TABLE chi_tiet (don_id INTEGER, mon_id INTEGER, so_luong INTEGER)")
db.execute("INSERT INTO mon (ten, gia) VALUES ('tra da', 5000)")
db.execute("INSERT INTO mon (ten, gia) VALUES ('nuoc cam', 15000)")
db.execute("INSERT INTO mon (ten, gia) VALUES ('sua dau', 10000)")
db.commit()


def tinh_thanh_toan(tong):
    if tong >= 100000:
        return tong * 80 // 100
    if tong >= 50000:
        return tong * 90 // 100
    return tong


@app.get("/mon")
def danh_sach():
    dong = db.execute("SELECT id, ten, gia FROM mon ORDER BY id").fetchall()
    return [{"id": d[0], "ten": d[1], "gia": d[2]} for d in dong]


@app.get("/mon/{mon_id}")
def mot_mon(mon_id: int):
    d = db.execute("SELECT id, ten, gia FROM mon WHERE id = ?", (mon_id,)).fetchone()
    if d is None:
        raise HTTPException(404, f"Khong tim thay mon {mon_id}")
    return {"id": d[0], "ten": d[1], "gia": d[2]}


@app.post("/don")
def tao_don(du_lieu):
    cac_dong = du_lieu.get("dong") or []
    if len(cac_dong) == 0:
        raise HTTPException(422, "Don hang phai co it nhat mot dong")
    tong = 0
    for dong in cac_dong:
        so_luong = int(dong["so_luong"])
        if so_luong <= 0:
            raise HTTPException(422, "So luong phai lon hon 0")
        mon = db.execute(
            "SELECT gia FROM mon WHERE id = ?", (dong["mon_id"],)
        ).fetchone()
        if mon is None:
            raise HTTPException(404, f"Khong tim thay mon {dong['mon_id']}")
        tong = tong + mon[0] * so_luong          # gia LAY TU CSDL, khong tin nguoi goi
    thanh_toan = tinh_thanh_toan(tong)
    cur = db.execute(
        "INSERT INTO don (ban, tong, thanh_toan) VALUES (?, ?, ?)",
        (du_lieu.get("ban"), tong, thanh_toan),
    )
    don_id = cur.lastrowid
    for dong in cac_dong:
        db.execute(
            "INSERT INTO chi_tiet (don_id, mon_id, so_luong) VALUES (?, ?, ?)",
            (don_id, dong["mon_id"], int(dong["so_luong"])),
        )
    db.commit()
    return {"id": don_id, "ban": du_lieu.get("ban"), "tong": tong, "thanh_toan": thanh_toan}


@app.get("/don/{don_id}")
def mot_don(don_id: int):
    d = db.execute(
        "SELECT id, ban, tong, thanh_toan FROM don WHERE id = ?", (don_id,)
    ).fetchone()
    if d is None:
        raise HTTPException(404, f"Khong tim thay don {don_id}")
    dong = db.execute(
        "SELECT m.ten, ct.so_luong, m.gia * ct.so_luong"
        " FROM chi_tiet ct JOIN mon m ON m.id = ct.mon_id"
        " WHERE ct.don_id = ? ORDER BY ct.rowid",
        (don_id,),
    ).fetchall()
    return {
        "id": d[0],
        "ban": d[1],
        "tong": d[2],
        "thanh_toan": d[3],
        "dong": [{"ten": r[0], "so_luong": r[1], "thanh_tien": r[2]} for r in dong],
    }


client = TestClient(app)
tao = client.post(
    "/don",
    json={"ban": 3, "dong": [{"mon_id": 1, "so_luong": 2}, {"mon_id": 2, "so_luong": 3}]},
)
print("TAO:", tao.status_code, tao.json()["id"])
print("TONG:", tao.json()["tong"])
print("THANH TOAN:", tao.json()["thanh_toan"])
doc = client.get("/don/1")
print("DOC:", doc.status_code, doc.json()["ban"])
print("SO DONG:", len(doc.json()["dong"]))
print("DONG DAU:", doc.json()["dong"][0]["ten"], doc.json()["dong"][0]["thanh_tien"])
print("RONG:", client.post("/don", json={"ban": 1, "dong": []}).status_code)
print(
    "SL AM:",
    client.post("/don", json={"ban": 1, "dong": [{"mon_id": 1, "so_luong": -2}]}).status_code,
)
print(
    "MON LA:",
    client.post("/don", json={"ban": 1, "dong": [{"mon_id": 99, "so_luong": 1}]}).status_code,
)
print("DON LA:", client.get("/don/99").status_code)`,
    // Bộ chấm chạy probe THAY api.py (api.py vẫn nằm trong thư mục làm việc).
    probeCode: P4_S6_PROBE,
    checks: [
      tc([], 'TAO: 201 1', 'POST /don tạo đơn, trả 201 kèm id'),
      tc([], 'TONG: 55000', 'Tổng tính bằng giá LẤY TỪ CSDL'),
      tc([], 'THANH TOAN: 49500', 'Áp đúng luật giảm giá của quán'),
      tc([], 'DOC: 200 3', 'GET /don/{id} đọc lại đơn vừa ghi'),
      tc([], 'DONG DAU: tra da 10000', 'Chi tiết đơn đủ tên món và thành tiền cho frontend'),
      tc([], 'RONG: 422', 'Đơn không có dòng nào bị từ chối'),
      tc([], 'SL AM: 422', 'Ca ẩn: số lượng âm bị chặn ngay ở cửa API', true),
      tc([], 'MON LA: 404', 'Ca ẩn: món không có trong CSDL trả 404, không ghi đơn hỏng', true),
      // Đề: "giá TUYỆT ĐỐI lấy từ CSDL, không bao giờ nhận giá do người gọi gửi lên" + "tính tong và
      // thanh_toan theo luật quán (≥100000 giảm 20% …)" + "trả {id, ban, tong, thanh_toan} (mã 201)".
      tc(
        [],
        'KT DON MOI: 201 7 110000 88000',
        'Ca ẩn: đơn của bộ chấm (kèm giá giả) tính từ CSDL, mốc giảm 20%',
        true,
      ),
      // Đề mục 2: "GET /don/{don_id} — trả {id, ban, tong, thanh_toan, dong} với "dong" là danh sách
      // {ten, so_luong, thanh_tien}" — đọc lại theo id vừa nhận (không phụ thuộc thứ tự dòng).
      tc(
        [],
        'KT DOC LAI: 200 7 2 110000 nuoc cam,sua dau',
        'Ca ẩn: đọc lại đơn vừa tạo đủ dòng và thành tiền',
        true,
      ),
      // Đề mục 1: "so_luong <= 0 → 422", ""dong" rỗng hoặc thiếu → 422", "mon_id không có … → 404";
      // mục 2: "không có đơn thì 404".
      tc([], 'KT LOI: 422 422 404 404', 'Ca ẩn: các nhánh lỗi với dữ liệu khác đề', true),
    ],
  },
]
