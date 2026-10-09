// projectStepsT3P4 — DỰ ÁN TRỤC T3 "Sổ học tập của tôi", CHẶNG P4 "Lõi sổ học có test và API".
// Cùng nhịp với chặng P4 của T1 (projectStepsP4.ts): MỘT engine Python, ba LÀN (pyLanes.ts):
//   bước 1–3 làn `python` thuần · bước 4 làn `pytest` · bước 5–6 làn `apisim`.
// Ranh giới mô phỏng của hai làn sau: docs/research/dac-ta-bac-p4-mo-phong-den-dau-2026-08-26.md
// — định tuyến/JSON/SQLite chạy THẬT, nhưng không có tiến trình server nào.
//
// Sổ học tập mọc XƯƠNG SỐNG: môn học là đồ vật có điểm của riêng nó, bài tập CHỨA môn học (kết
// hợp, không kế thừa) và có hạn nộp thật (datetime), điểm sai luật là LỖI NGHIỆP VỤ có tên riêng,
// test canh luật điểm, rồi API mở sổ ra cho trang web gọi.
//
// LUẬT ĐIỂM giữ nguyên từ chặng P1 (projectStepsT3.ts): ĐTB = Σ(điểm × hệ số) / Σ(hệ số), làm
// tròn 1 chữ số; hệ số 1 thường xuyên · 2 giữa kỳ · 3 cuối kỳ; xếp loại ≥ 8.0 Tot · ≥ 6.5 Kha ·
// ≥ 5.0 Dat · còn lại Chua dat. Môn CHƯA có điểm thì ĐTB là None — KHÔNG phải 0 (điểm 0 là bị
// điểm liệt, còn chưa có điểm là chưa học; trộn hai thứ là báo sai học lực).
//
// Mọi dòng chấm điểm in KHÔNG DẤU, như ba chặng trước.
import { TestCaseSchema, type ProgrammingTestCase } from './lessonTypes.js'
// Xuống projectStepTypes (KHÔNG phải projectSteps/projectStepsT3) — tránh chu trình import.
import type { ProjectStep } from './projectStepTypes.js'

export const T3_P4_MAIN_FILE = 'so_hoc_tap.py'
export const T3_P4_TEST_FILE = 'test_so_hoc_tap.py'
export const T3_P4_API_FILE = 'api.py'

const tc = (
  stdinLines: string[],
  expected: string,
  label: string,
  hidden = false,
): ProgrammingTestCase => TestCaseSchema.parse({ stdinLines, expected, label, hidden })

/** Hai class lõi của bước 1, dùng lại nguyên văn ở đầu code mẫu bước 2–3. */
const LOP_MON_HOC_S1 = `class MonHoc:
    def __init__(self, ten):
        self.ten = ten
        self.diem = []           # moi phan tu: (diem, he_so)

    def them_diem(self, diem, he_so):
        self.diem.append((diem, he_so))

    def dtb(self):
        if len(self.diem) == 0:
            return None          # chua co diem -> None, KHONG phai 0
        tong_he_so = sum(h for _d, h in self.diem)
        return round(sum(d * h for d, h in self.diem) / tong_he_so, 1)`

const IN_DTB_TUNG_MON = `for mon in so.ds:
    d = mon.dtb()
    if d is None:
        print(f"{mon.ten}: chua co diem")
    else:
        print(f"{mon.ten}: {d}")`

/** Phần BaiTap + SoHocTap có bài tập của bước 2, dùng lại ở bước 3. */
const LOP_BAI_TAP_VA_SO = `class BaiTap:
    """CHUA mot MonHoc (ket hop) — bai tap khong 'la mot' mon hoc."""

    def __init__(self, ten, mon, han):
        self.ten = ten
        self.mon = mon
        self.han = date.fromisoformat(han)

    def con_lai(self, hom_nay):
        return (self.han - hom_nay).days


class SoHocTap:
    def __init__(self):
        self.ds = []
        self.bai_tap = []

    def them_mon(self, mon):
        self.ds.append(mon)

    def tim(self, ten):
        can = ten.strip().lower()
        for mon in self.ds:
            if mon.ten == can:
                return mon
        return None

    def giao_bai(self, bai):
        self.bai_tap.append(bai)

    def sap_den_han(self, hom_nay):
        gan = [b for b in self.bai_tap if 0 <= b.con_lai(hom_nay) <= SAP_DEN_HAN]
        return sorted(gan, key=lambda b: (b.han, b.ten))

    def qua_han(self, hom_nay):
        return [b for b in self.bai_tap if b.con_lai(hom_nay) < 0]`

const IN_HAN_NOP = `print("Sap den han:")
for bai in so.sap_den_han(hom_nay):
    print(f"{bai.han} {bai.mon.ten}: {bai.ten}")
print(f"Qua han: {len(so.qua_han(hom_nay))}")`

export const T3_P4_PROJECT_STEPS: ProjectStep[] = [
  {
    id: 't3-p4-s1',
    isMilestone: false,
    files: [T3_P4_MAIN_FILE],
    title: 'Mô hình hoá sổ học tập bằng class — MonHoc và SoHocTap',
    unitId: 'p4-u1',
    requirement:
      'Từ bậc này, sổ học tập có XƯƠNG SỐNG: mỗi môn giữ điểm của riêng nó và tự tính được ĐTB của mình.\n\nViết lại so_hoc_tap.py bằng hai class:\n\n1. class MonHoc — __init__(self, ten) tạo danh sách điểm rỗng; them_diem(self, diem, he_so) thêm một con điểm; dtb(self) trả về Σ(diem × he_so) / Σ(he_so) làm tròn 1 chữ số — môn CHƯA có điểm nào thì trả về None (không phải 0: điểm 0 là bị điểm liệt, còn chưa có điểm là chưa học).\n2. class SoHocTap — __init__(self) tạo danh sách môn rỗng (thuộc tính ds); them_mon(self, mon) thêm một MonHoc; tim(self, ten) trả về MonHoc khớp tên hoặc None. tim() bỏ khoảng trắng thừa và KHÔNG phân biệt hoa/thường (như chặng P2).\n\nChương trình chính:\n- Tạo SoHocTap với đúng 3 môn: toan · van · anh (viết thường, không dấu). In "So mon: <so mon>".\n- Lặp đọc input() mỗi lần một dòng "<mon>,<diem>,<he so>"; gõ "xong" thì dừng. Môn không có trong sổ → in "Khong co mon nay" và bỏ qua dòng đó.\n- Cuối cùng in mỗi môn MỘT DÒNG theo thứ tự trong sổ: "<mon>: <dtb>", hoặc "<mon>: chua co diem" nếu dtb() là None.',
    hint: 'self là chính đồ vật đang thao tác: self.diem là danh sách điểm của RIÊNG môn đó. Mỗi phần tử lưu một cặp (diem, he_so), nên dtb() chỉ cần sum(d * h for d, h in self.diem) chia sum(h for _d, h in self.diem). Kiểm "is None" trước khi in, đừng so == 0.',
    referenceCode: `${LOP_MON_HOC_S1}


class SoHocTap:
    def __init__(self):
        self.ds = []

    def them_mon(self, mon):
        self.ds.append(mon)

    def tim(self, ten):
        can = ten.strip().lower()
        for mon in self.ds:
            if mon.ten == can:
                return mon
        return None


so = SoHocTap()
for ten in ["toan", "van", "anh"]:
    so.them_mon(MonHoc(ten))
print(f"So mon: {len(so.ds)}")

while True:
    dong = input("Dong diem: ").strip()
    if dong.lower() == "xong":
        break
    ten, diem, he_so = dong.split(",")
    mon = so.tim(ten)
    if mon is None:
        print("Khong co mon nay")
        continue
    mon.them_diem(float(diem), int(he_so))

${IN_DTB_TUNG_MON}`,
    checks: [
      tc(['toan,8,1', 'xong'], 'So mon: 3', 'Sổ giữ đủ 3 môn'),
      tc(
        ['toan,8,1', 'toan,7,2', 'toan,9,3', 'xong'],
        'toan: 8.2',
        'MonHoc.dtb tính đúng hệ số (49/6)',
      ),
      tc(
        ['toan,8,1', 'toan,7,2', 'toan,9,3', 'xong'],
        'van: chua co diem',
        'Môn chưa có điểm in "chua co diem", không in 0',
      ),
      tc(['van,6,1', 'van,7.5,2', 'van,7,3', 'xong'], 'van: 7.0', 'Môn khác giữ điểm riêng'),
      tc(
        ['  ANH ,7,2', 'xong'],
        'anh: 7.0',
        'Ca ẩn: tên môn gõ hoa hoặc thừa khoảng trắng vẫn tìm ra',
        true,
      ),
      tc(['hoa,9,1', 'xong'], 'Khong co mon nay', 'Ca ẩn: môn lạ báo rõ, không vỡ', true),
    ],
  },
  {
    id: 't3-p4-s2',
    isMilestone: false,
    files: [T3_P4_MAIN_FILE],
    title: 'Refactor — thêm BaiTap có hạn nộp bằng KẾT HỢP, không kế thừa',
    unitId: 'p4-u3',
    requirement:
      'Giữ NGUYÊN MonHoc và mọi dòng in của bước 1, thêm bài tập có HẠN NỘP. Chú ý: bài tập KHÔNG kế thừa MonHoc — một bài tập không "là một" môn học, nó THUỘC về một môn. Đó là kết hợp (composition).\n\n1. class BaiTap — __init__(self, ten, mon, han): mon là CHÍNH đối tượng MonHoc (không phải chuỗi tên), han là chuỗi "YYYY-MM-DD" đổi sang date bằng date.fromisoformat; con_lai(self, hom_nay) trả về số ngày còn lại (âm = đã quá hạn).\n2. SoHocTap thêm danh sách bai_tap và ba phương thức: giao_bai(self, bai); sap_den_han(self, hom_nay) trả về các bài còn từ 0 đến 3 ngày (hằng SAP_DEN_HAN = 3), sắp theo hạn tăng dần; qua_han(self, hom_nay) trả về các bài đã quá hạn.\n\n3. Chương trình chính: dòng nhập có thêm dạng "bai,<mon>,<ten bai>,<han>" để giao bài (môn lạ → "Khong co mon nay"); dòng điểm giữ như bước 1. Sau "xong", đọc thêm MỘT dòng ngày hôm nay "YYYY-MM-DD". In phần điểm như bước 1, rồi:\nSap den han:\n<han> <mon>: <ten bai>     (mỗi bài một dòng, theo hạn tăng dần)\nQua han: <so bai>\n\nTên môn in ra lấy từ đối tượng MonHoc mà bài tập chứa (bai.mon.ten).',
    hint: 'from datetime import date. Hiệu hai date là một khoảng thời gian, lấy số ngày bằng .days: (self.han - hom_nay).days. Đừng so chuỗi ngày để đếm số ngày còn lại — qua tháng là sai ngay. Sắp xếp: sorted(ds, key=lambda b: (b.han, b.ten)).',
    referenceCode: `from datetime import date

SAP_DEN_HAN = 3      # so ngay coi la "sap den han"


${LOP_MON_HOC_S1}


${LOP_BAI_TAP_VA_SO}


so = SoHocTap()
for ten in ["toan", "van", "anh"]:
    so.them_mon(MonHoc(ten))
print(f"So mon: {len(so.ds)}")

while True:
    dong = input("Dong: ").strip()
    if dong.lower() == "xong":
        break
    phan = dong.split(",")
    if phan[0].strip().lower() == "bai":
        mon = so.tim(phan[1])
        if mon is None:
            print("Khong co mon nay")
            continue
        so.giao_bai(BaiTap(phan[2].strip(), mon, phan[3].strip()))
        continue
    mon = so.tim(phan[0])
    if mon is None:
        print("Khong co mon nay")
        continue
    mon.them_diem(float(phan[1]), int(phan[2]))

hom_nay = date.fromisoformat(input("Hom nay: ").strip())

${IN_DTB_TUNG_MON}

${IN_HAN_NOP}`,
    checks: [
      tc(
        [
          'bai,toan,Bai tap dao ham,2026-10-12',
          'bai,van,Nghi luan xa hoi,2026-10-11',
          'xong',
          '2026-10-10',
        ],
        'Sap den han:\n2026-10-11 van: Nghi luan xa hoi\n2026-10-12 toan: Bai tap dao ham',
        'Bài sắp đến hạn xếp theo hạn tăng dần',
      ),
      tc(
        ['bai,van,Doc hieu,2026-10-09', 'xong', '2026-10-10'],
        'Qua han: 1',
        'Bài quá hạn được đếm riêng',
      ),
      tc(
        ['toan,8,1', 'toan,7,2', 'toan,9,3', 'xong', '2026-10-10'],
        'toan: 8.2',
        'Phần điểm của bước 1 không được vỡ',
      ),
      tc(
        ['bai,toan,On chuong 2,2026-11-02', 'xong', '2026-10-30'],
        '2026-11-02 toan: On chuong 2',
        'Qua tháng vẫn đếm đúng số ngày (dùng date, không so chuỗi)',
      ),
      tc(
        [
          'bai,anh,Unit 3 writing,2026-10-13',
          'bai,anh,Unit 4 speaking,2026-10-14',
          'bai, Van ,Thuyet trinh,2026-10-10',
          'xong',
          '2026-10-10',
        ],
        'Sap den han:\n2026-10-10 van: Thuyet trinh\n2026-10-13 anh: Unit 3 writing\nQua han: 0',
        'Ca ẩn: hạn hôm nay và đúng 3 ngày được tính, 4 ngày thì chưa; tên môn lấy từ MonHoc',
        true,
      ),
      tc(
        ['bai,hoa,Can bang phuong trinh,2026-10-11', 'xong', '2026-10-10'],
        'Khong co mon nay',
        'Ca ẩn: giao bài cho môn không có trong sổ',
        true,
      ),
    ],
  },
  {
    id: 't3-p4-s3',
    isMilestone: false,
    files: [T3_P4_MAIN_FILE],
    title: 'Lỗi nghiệp vụ riêng + nhật ký chạy (logging)',
    unitId: 'p4-u4',
    requirement:
      'Điểm 11 hay hệ số 4 không phải lỗi lập trình — đó là dữ liệu vi phạm LUẬT của sổ điểm. Nó phải có tên riêng.\n\nGiữ nguyên bước 2, thêm:\n\n1. class DiemKhongHopLe(Exception) — lớp lỗi riêng của sổ.\n2. MonHoc.them_diem kiểm TRƯỚC khi thêm, theo thứ tự:\n   - điểm ngoài thang 0..10 → raise DiemKhongHopLe(f"Diem {diem} nam ngoai thang 0-10")\n   - hệ số không phải 1, 2 hoặc 3 → raise DiemKhongHopLe(f"He so {he_so} khong hop le")\n3. Ném ở chỗ PHÁT HIỆN, bắt ở chỗ NÓI CHUYỆN với người dùng: vòng lặp nhập bọc try/except DiemKhongHopLe, in "Loi: <thong diep>" và ghi logging.warning(f"Bo qua dong diem: {e}"). Điểm bị từ chối KHÔNG được ghi vào môn.\n4. Nhật ký: logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s", stream=sys.stdout) — mặc định logging ghi ra stderr, phải chuyển sang stdout thì bạn (và bộ chấm) mới đọc được cùng một dòng chảy. Ghi logging.info("Mo so hoc tap") trước vòng lặp, và logging.info(f"Dong so: {n} mon co diem") ở cuối chương trình (n = số môn có dtb() khác None).',
    hint: 'Đặt hai câu raise ở ĐẦU them_diem, câu append ở SAU — nhờ vậy điểm sai không bao giờ kịp lọt vào danh sách. except DiemKhongHopLe as e rồi dùng f"{e}" để lấy lại thông điệp đã ném. Đếm môn có điểm: len([m for m in so.ds if m.dtb() is not None]).',
    referenceCode: `import logging
import sys
from datetime import date

SAP_DEN_HAN = 3      # so ngay coi la "sap den han"


class DiemKhongHopLe(Exception):
    """Loi NGHIEP VU: diem hoac he so sai luat cua so."""


class MonHoc:
    def __init__(self, ten):
        self.ten = ten
        self.diem = []           # moi phan tu: (diem, he_so)

    def them_diem(self, diem, he_so):
        if not 0 <= diem <= 10:
            raise DiemKhongHopLe(f"Diem {diem} nam ngoai thang 0-10")
        if he_so not in (1, 2, 3):
            raise DiemKhongHopLe(f"He so {he_so} khong hop le")
        self.diem.append((diem, he_so))

    def dtb(self):
        if len(self.diem) == 0:
            return None          # chua co diem -> None, KHONG phai 0
        tong_he_so = sum(h for _d, h in self.diem)
        return round(sum(d * h for d, h in self.diem) / tong_he_so, 1)


${LOP_BAI_TAP_VA_SO}


logging.basicConfig(
    level=logging.INFO, format="[%(levelname)s] %(message)s", stream=sys.stdout
)

so = SoHocTap()
for ten in ["toan", "van", "anh"]:
    so.them_mon(MonHoc(ten))
print(f"So mon: {len(so.ds)}")

logging.info("Mo so hoc tap")
while True:
    dong = input("Dong: ").strip()
    if dong.lower() == "xong":
        break
    phan = dong.split(",")
    if phan[0].strip().lower() == "bai":
        mon = so.tim(phan[1])
        if mon is None:
            print("Khong co mon nay")
            continue
        so.giao_bai(BaiTap(phan[2].strip(), mon, phan[3].strip()))
        continue
    mon = so.tim(phan[0])
    if mon is None:
        print("Khong co mon nay")
        continue
    try:
        mon.them_diem(float(phan[1]), int(phan[2]))
    except DiemKhongHopLe as e:
        print(f"Loi: {e}")
        logging.warning(f"Bo qua dong diem: {e}")

hom_nay = date.fromisoformat(input("Hom nay: ").strip())

${IN_DTB_TUNG_MON}

${IN_HAN_NOP}

so_mon_co_diem = len([m for m in so.ds if m.dtb() is not None])
logging.info(f"Dong so: {so_mon_co_diem} mon co diem")`,
    checks: [
      tc(
        ['toan,8,1', 'xong', '2026-10-10'],
        '[INFO] Mo so hoc tap',
        'Nhật ký ghi mốc mở sổ (ra stdout)',
      ),
      tc(
        ['toan,11,1', 'xong', '2026-10-10'],
        'Loi: Diem 11.0 nam ngoai thang 0-10',
        'Điểm ngoài thang báo lỗi nghiệp vụ cho người dùng',
      ),
      tc(
        ['toan,11,1', 'xong', '2026-10-10'],
        '[WARNING] Bo qua dong diem: Diem 11.0 nam ngoai thang 0-10',
        'Dòng bị từ chối được ghi lại vào nhật ký',
      ),
      tc(
        ['toan,8,4', 'xong', '2026-10-10'],
        'Loi: He so 4 khong hop le',
        'Hệ số ngoài 1/2/3 cũng là lỗi nghiệp vụ',
      ),
      tc(
        ['toan,8,1', 'van,7,2', 'xong', '2026-10-10'],
        '[INFO] Dong so: 2 mon co diem',
        'Nhật ký chốt sổ đếm đúng số môn có điểm',
      ),
      tc(
        ['toan,11,1', 'toan,9,1', 'xong', '2026-10-10'],
        'toan: 9.0',
        'Ca ẩn: điểm bị từ chối KHÔNG được ghi vào môn',
        true,
      ),
      tc(
        ['van,-1,3', 'xong', '2026-10-10'],
        'van: chua co diem',
        'Ca ẩn: điểm âm cũng bị chặn',
        true,
      ),
    ],
  },
  {
    id: 't3-p4-s4',
    isMilestone: false,
    language: 'pytest',
    files: [T3_P4_TEST_FILE],
    title: 'Viết test cho luật điểm của chính sổ học tập',
    unitId: 'p4-u6',
    requirement:
      'Sổ đã đủ luật để bạn KHÔNG còn nhớ hết: mốc xếp loại, làm tròn, None khác 0, điểm ngoài thang. Đó là lúc test thay bạn nhớ.\n\nFile test_so_hoc_tap.py có hai phần:\n\nPHẦN 1 — lõi đem ra kiểm (chép đúng như dưới, đừng sửa):\n\nclass DiemKhongHopLe(Exception):\n    pass\n\ndef dtb(ds):\n    if len(ds) == 0:\n        return None\n    tong_he_so = sum(h for _d, h in ds)\n    return round(sum(d * h for d, h in ds) / tong_he_so, 1)\n\ndef xep_loai(d):\n    if d >= 8.0:\n        return "Tot"\n    if d >= 6.5:\n        return "Kha"\n    if d >= 5.0:\n        return "Dat"\n    return "Chua dat"\n\ndef kiem_diem(diem):\n    if not 0 <= diem <= 10:\n        raise DiemKhongHopLe(f"Diem {diem} nam ngoai thang 0-10")\n    return diem\n\nPHẦN 2 — test của bạn. Viết ĐÚNG 6 hàm test_* (bộ chạy tự gọi chúng, bạn không tự gọi):\n1. test_dtb_co_trong_so — dtb([(8, 1), (7, 2), (9, 3)]) bằng 8.2\n2. test_mon_chua_co_diem_la_none — dtb([]) is None\n3. test_dung_moc_kha — xep_loai(6.5) là "Kha"\n4. test_duoi_moc_kha — xep_loai(6.4) là "Dat"\n5. test_dung_moc_tot — xep_loai(8.0) là "Tot"\n6. test_diem_ngoai_thang_thi_nem_loi — with pytest.raises(DiemKhongHopLe): kiem_diem(10.5)\n\nHAI CA BIÊN LÀ LINH HỒN CỦA BƯỚC NÀY: ĐÚNG mốc xếp loại (6.4 và 6.5 — chỗ dễ viết nhầm > thành >=) và "chưa có điểm" (phải ra None, tuyệt đối không được ra 0 — ra 0 là học sinh bị xếp Chưa đạt oan).',
    hint: 'import pytest ở đầu file. So None bằng "is None", không phải "== 0". Ca "phải ném lỗi" viết bằng khối with: with pytest.raises(DiemKhongHopLe): kiem_diem(10.5) — test đạt khi khối đó THẬT SỰ ném đúng loại lỗi.',
    referenceCode: `import pytest


# ---- Loi cua so hoc tap dem ra kiem ----
class DiemKhongHopLe(Exception):
    pass


def dtb(ds):
    if len(ds) == 0:
        return None
    tong_he_so = sum(h for _d, h in ds)
    return round(sum(d * h for d, h in ds) / tong_he_so, 1)


def xep_loai(d):
    if d >= 8.0:
        return "Tot"
    if d >= 6.5:
        return "Kha"
    if d >= 5.0:
        return "Dat"
    return "Chua dat"


def kiem_diem(diem):
    if not 0 <= diem <= 10:
        raise DiemKhongHopLe(f"Diem {diem} nam ngoai thang 0-10")
    return diem


# ---- Test cua ban ----
def test_dtb_co_trong_so():
    assert dtb([(8, 1), (7, 2), (9, 3)]) == 8.2


def test_mon_chua_co_diem_la_none():
    assert dtb([]) is None


def test_dung_moc_kha():
    assert xep_loai(6.5) == "Kha"


def test_duoi_moc_kha():
    assert xep_loai(6.4) == "Dat"


def test_dung_moc_tot():
    assert xep_loai(8.0) == "Tot"


def test_diem_ngoai_thang_thi_nem_loi():
    with pytest.raises(DiemKhongHopLe):
        kiem_diem(10.5)`,
    checks: [
      tc([], '=== 6 passed, 0 failed ===', 'Đủ 6 test và tất cả đều xanh'),
      tc([], 'test_dung_moc_kha PASSED', 'Ca biên ĐÚNG mốc xếp loại được phủ'),
      tc([], 'test_duoi_moc_kha PASSED', 'Ca ngay dưới mốc được phủ (bắt lỗi > vs >=)'),
      tc([], 'test_mon_chua_co_diem_la_none PASSED', 'Ca "chưa có điểm là None" được phủ'),
      tc(
        [],
        'test_diem_ngoai_thang_thi_nem_loi PASSED',
        'Ca ẩn: điểm ngoài thang được phủ bằng pytest.raises',
        true,
      ),
      tc([], '0 failed', 'Ca ẩn: không còn test nào đỏ', true),
    ],
  },
  {
    id: 't3-p4-s5',
    isMilestone: false,
    language: 'apisim',
    files: [T3_P4_API_FILE],
    title: 'API CRUD cho bài tập — sổ rời khỏi máy cá nhân',
    unitId: 'p4-u8',
    requirement:
      'Viết api.py: một API kiểu REST cho bảng bài tập, dữ liệu nằm trong SQLite.\n\nDựng sẵn CSDL trong bộ nhớ: bảng bai_tap(id INTEGER PRIMARY KEY, mon TEXT, ten TEXT, han TEXT, xong INTEGER DEFAULT 0) với đúng 3 bài, theo thứ tự:\n(toan, Bai tap dao ham, 2026-10-15) · (van, Nghi luan xa hoi, 2026-10-12) · (anh, Unit 3 writing, 2026-10-20).\n\nMỗi bài trả ra ngoài là dict {id, mon, ten, han, xong} với xong là True/False (không phải 0/1).\n\nNăm cửa:\n1. GET /bai-tap — danh sách mọi bài, sắp theo hạn tăng dần (bài gấp nhất lên đầu), cùng hạn thì theo id.\n2. GET /bai-tap/{bai_id} (bai_id: int) — một bài; không có thì raise HTTPException(404, f"Khong tim thay bai tap {bai_id}").\n3. POST /bai-tap — nhận thân JSON qua tham số tên du_lieu (dict có "mon", "ten", "han"), ghi vào CSDL, trả bài vừa tạo (mã 201 là mặc định của @app.post).\n4. PUT /bai-tap/{bai_id} — đánh dấu đã làm xong (xong = 1), trả lại bài đó; không có thì 404.\n5. DELETE /bai-tap/{bai_id} — xoá bài, trả {"da_xoa": bai_id}.\n\nCuối file, dán khối kiểm thử sau (in GIÁ TRỊ ĐƠN LẺ, không in cả dict):\n\nclient = TestClient(app)\nds = client.get("/bai-tap")\nprint("DS:", ds.status_code, len(ds.json()))\nprint("GAP NHAT:", ds.json()[0]["ten"])\nmot = client.get("/bai-tap/3")\nprint("MOT:", mot.status_code, mot.json()["mon"])\nprint("THIEU:", client.get("/bai-tap/99").status_code)\ntao = client.post("/bai-tap", json={"mon": "ly", "ten": "On tap chuong 2", "han": "2026-10-11"})\nprint("TAO:", tao.status_code, tao.json()["id"])\nprint("GAP NHAT MOI:", client.get("/bai-tap").json()[0]["ten"])\nprint("XONG:", client.put("/bai-tap/1").json()["xong"])\nprint("XONG LA:", client.put("/bai-tap/99").status_code)\nprint("XOA:", client.delete("/bai-tap/2").status_code)\nprint("CON LAI:", len(client.get("/bai-tap").json()))',
    hint: 'Ghi chú kiểu bai_id: int là bắt buộc — URL vốn là chuỗi, thiếu nó thì "3" đem so với số trong CSDL sẽ không khớp. Sắp theo hạn ngay trong SQL: ORDER BY han, id (chuỗi "YYYY-MM-DD" sắp theo chữ cũng đúng thứ tự ngày). Viết một hàm nhỏ đổi một dòng CSDL thành dict để năm cửa dùng chung, và nhớ db.commit() sau mọi INSERT/UPDATE/DELETE.',
    referenceCode: `import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

app = FastAPI()

db = sqlite3.connect(":memory:")
db.execute(
    "CREATE TABLE bai_tap (id INTEGER PRIMARY KEY, mon TEXT, ten TEXT, han TEXT,"
    " xong INTEGER DEFAULT 0)"
)
db.execute("INSERT INTO bai_tap (mon, ten, han) VALUES ('toan', 'Bai tap dao ham', '2026-10-15')")
db.execute("INSERT INTO bai_tap (mon, ten, han) VALUES ('van', 'Nghi luan xa hoi', '2026-10-12')")
db.execute("INSERT INTO bai_tap (mon, ten, han) VALUES ('anh', 'Unit 3 writing', '2026-10-20')")
db.commit()

COT = "SELECT id, mon, ten, han, xong FROM bai_tap"


def thanh_dict(d):
    return {"id": d[0], "mon": d[1], "ten": d[2], "han": d[3], "xong": d[4] == 1}


def lay_bai(bai_id):
    d = db.execute(COT + " WHERE id = ?", (bai_id,)).fetchone()
    if d is None:
        raise HTTPException(404, f"Khong tim thay bai tap {bai_id}")
    return thanh_dict(d)


@app.get("/bai-tap")
def danh_sach():
    return [thanh_dict(d) for d in db.execute(COT + " ORDER BY han, id").fetchall()]


@app.get("/bai-tap/{bai_id}")
def mot_bai(bai_id: int):
    return lay_bai(bai_id)


@app.post("/bai-tap")
def them_bai(du_lieu):
    cur = db.execute(
        "INSERT INTO bai_tap (mon, ten, han) VALUES (?, ?, ?)",
        (du_lieu["mon"], du_lieu["ten"], du_lieu["han"]),
    )
    db.commit()
    return lay_bai(cur.lastrowid)


@app.put("/bai-tap/{bai_id}")
def danh_dau_xong(bai_id: int):
    lay_bai(bai_id)                      # khong co bai -> 404 truoc khi sua gi
    db.execute("UPDATE bai_tap SET xong = 1 WHERE id = ?", (bai_id,))
    db.commit()
    return lay_bai(bai_id)


@app.delete("/bai-tap/{bai_id}")
def xoa_bai(bai_id: int):
    db.execute("DELETE FROM bai_tap WHERE id = ?", (bai_id,))
    db.commit()
    return {"da_xoa": bai_id}


client = TestClient(app)
ds = client.get("/bai-tap")
print("DS:", ds.status_code, len(ds.json()))
print("GAP NHAT:", ds.json()[0]["ten"])
mot = client.get("/bai-tap/3")
print("MOT:", mot.status_code, mot.json()["mon"])
print("THIEU:", client.get("/bai-tap/99").status_code)
tao = client.post("/bai-tap", json={"mon": "ly", "ten": "On tap chuong 2", "han": "2026-10-11"})
print("TAO:", tao.status_code, tao.json()["id"])
print("GAP NHAT MOI:", client.get("/bai-tap").json()[0]["ten"])
print("XONG:", client.put("/bai-tap/1").json()["xong"])
print("XONG LA:", client.put("/bai-tap/99").status_code)
print("XOA:", client.delete("/bai-tap/2").status_code)
print("CON LAI:", len(client.get("/bai-tap").json()))`,
    checks: [
      tc([], 'DS: 200 3', 'GET /bai-tap trả 200 và đủ 3 bài'),
      tc([], 'GAP NHAT: Nghi luan xa hoi', 'Danh sách sắp theo hạn — bài gấp nhất lên đầu'),
      tc([], 'MOT: 200 anh', 'GET /bai-tap/3 lấy đúng bài (tham số đường dẫn đổi sang số)'),
      tc([], 'THIEU: 404', 'Bài không tồn tại trả 404, không phải 200 kèm dữ liệu rỗng'),
      tc([], 'TAO: 201 4', 'POST /bai-tap trả 201 và id vừa sinh'),
      tc([], 'GAP NHAT MOI: On tap chuong 2', 'Bài vừa tạo có hạn sớm hơn → nhảy lên đầu'),
      tc([], 'XONG: True', 'Ca ẩn: PUT đánh dấu xong, trả về True chứ không phải 1', true),
      tc([], 'CON LAI: 3', 'Ca ẩn: thêm 1 xoá 1 thì còn đúng 3 bài (có commit thật)', true),
    ],
  },
  {
    id: 't3-p4-s6',
    isMilestone: true,
    language: 'apisim',
    files: [T3_P4_API_FILE],
    title: 'Milestone P4 — API điểm, ĐTB tính ở máy chủ',
    unitId: 'p4-u12',
    requirement:
      'Bước chốt chặng: nối phần ĐIỂM vào API. LUẬT SỐNG CÒN — ĐTB và xếp loại do MÁY CHỦ tính từ CSDL, không bao giờ nhận con số người gọi gửi lên (dữ liệu từ trình duyệt ai cũng sửa được).\n\nGiữ cửa GET /bai-tap và 3 bài mẫu của bước 5, thêm hai bảng:\n- mon_hoc(id INTEGER PRIMARY KEY, ten TEXT) với đúng 3 môn theo thứ tự: toan · van · anh\n- diem(id INTEGER PRIMARY KEY, mon_id INTEGER, diem REAL, he_so INTEGER)\n\n1. POST /diem — thân JSON {"mon_id": .., "diem": .., "he_so": ..}. Kiểm theo đúng thứ tự:\n   - he_so không phải 1, 2 hoặc 3 → raise HTTPException(422, "He so phai la 1, 2 hoac 3")\n   - diem không phải số, hoặc ngoài 0..10 → raise HTTPException(422, "Diem phai tu 0 den 10")\n   - mon_id không có trong bảng mon_hoc → raise HTTPException(404, f"Khong tim thay mon {mon_id}")\n   - hợp lệ → ghi, trả {id, mon_id, diem, he_so} (mã 201); trường lạ (như "dtb") bị BỎ QUA.\n2. GET /mon/{mon_id}/tong-ket (mon_id: int) → {ten, so_diem, dtb, xep_loai}, tính từ bảng diem theo luật của sổ (như MonHoc.dtb và xếp loại ở chặng P1). Môn chưa có điểm: dtb và xep_loai là None. Không có môn: 404.\n\nCuối file dán khối kiểm thử sau:\n\nclient = TestClient(app)\nprint("BAI TAP:", len(client.get("/bai-tap").json()))\nclient.post("/diem", json={"mon_id": 1, "diem": 8, "he_so": 1})\nclient.post("/diem", json={"mon_id": 1, "diem": 7, "he_so": 2})\ntao = client.post("/diem", json={"mon_id": 1, "diem": 9, "he_so": 3, "dtb": 10})\nprint("TAO:", tao.status_code, tao.json()["id"])\ntk = client.get("/mon/1/tong-ket").json()\nprint("TONG KET:", tk["ten"], tk["so_diem"], tk["dtb"], tk["xep_loai"])\nprint("CHUA CO:", client.get("/mon/2/tong-ket").json()["dtb"])\nprint("DIEM 11:", client.post("/diem", json={"mon_id": 1, "diem": 11, "he_so": 1}).status_code)\nprint("HE SO 5:", client.post("/diem", json={"mon_id": 1, "diem": 8, "he_so": 5}).status_code)\nprint("MON LA:", client.post("/diem", json={"mon_id": 99, "diem": 8, "he_so": 1}).status_code)\nprint("SAU LOI:", client.get("/mon/1/tong-ket").json()["so_diem"])',
    hint: 'Kiểm dữ liệu TRƯỚC, ghi CSDL SAU — mọi câu raise đặt trước câu INSERT. Kiểm kiểu số: isinstance(diem, (int, float)) and not isinstance(diem, bool) (trong Python True cũng là int). Lấy điểm của môn bằng SELECT diem, he_so FROM diem WHERE mon_id = ? rồi tính như MonHoc.dtb() ở bước 1 — danh sách rỗng thì trả None.',
    referenceCode: `import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

app = FastAPI()

db = sqlite3.connect(":memory:")
db.execute(
    "CREATE TABLE bai_tap (id INTEGER PRIMARY KEY, mon TEXT, ten TEXT, han TEXT,"
    " xong INTEGER DEFAULT 0)"
)
db.execute("CREATE TABLE mon_hoc (id INTEGER PRIMARY KEY, ten TEXT)")
db.execute("CREATE TABLE diem (id INTEGER PRIMARY KEY, mon_id INTEGER, diem REAL, he_so INTEGER)")
db.execute("INSERT INTO bai_tap (mon, ten, han) VALUES ('toan', 'Bai tap dao ham', '2026-10-15')")
db.execute("INSERT INTO bai_tap (mon, ten, han) VALUES ('van', 'Nghi luan xa hoi', '2026-10-12')")
db.execute("INSERT INTO bai_tap (mon, ten, han) VALUES ('anh', 'Unit 3 writing', '2026-10-20')")
for ten in ["toan", "van", "anh"]:
    db.execute("INSERT INTO mon_hoc (ten) VALUES (?)", (ten,))
db.commit()


def xep_loai(d):
    if d >= 8.0:
        return "Tot"
    if d >= 6.5:
        return "Kha"
    if d >= 5.0:
        return "Dat"
    return "Chua dat"


@app.get("/bai-tap")
def danh_sach_bai():
    dong = db.execute("SELECT id, mon, ten, han, xong FROM bai_tap ORDER BY han, id").fetchall()
    return [
        {"id": d[0], "mon": d[1], "ten": d[2], "han": d[3], "xong": d[4] == 1} for d in dong
    ]


@app.post("/diem")
def them_diem(du_lieu):
    he_so = du_lieu.get("he_so")
    diem = du_lieu.get("diem")
    mon_id = du_lieu.get("mon_id")
    if he_so not in (1, 2, 3):
        raise HTTPException(422, "He so phai la 1, 2 hoac 3")
    la_so = isinstance(diem, (int, float)) and not isinstance(diem, bool)
    if not la_so or not 0 <= diem <= 10:
        raise HTTPException(422, "Diem phai tu 0 den 10")
    if db.execute("SELECT id FROM mon_hoc WHERE id = ?", (mon_id,)).fetchone() is None:
        raise HTTPException(404, f"Khong tim thay mon {mon_id}")
    cur = db.execute(
        "INSERT INTO diem (mon_id, diem, he_so) VALUES (?, ?, ?)", (mon_id, diem, he_so)
    )
    db.commit()
    # Chi tra lai dung cac truong da ghi — truong la nhu "dtb" bi bo qua
    return {"id": cur.lastrowid, "mon_id": mon_id, "diem": diem, "he_so": he_so}


@app.get("/mon/{mon_id}/tong-ket")
def tong_ket(mon_id: int):
    mon = db.execute("SELECT ten FROM mon_hoc WHERE id = ?", (mon_id,)).fetchone()
    if mon is None:
        raise HTTPException(404, f"Khong tim thay mon {mon_id}")
    ds = db.execute("SELECT diem, he_so FROM diem WHERE mon_id = ?", (mon_id,)).fetchall()
    if len(ds) == 0:
        return {"ten": mon[0], "so_diem": 0, "dtb": None, "xep_loai": None}
    dtb = round(sum(d * h for d, h in ds) / sum(h for _d, h in ds), 1)   # tinh O MAY CHU
    return {"ten": mon[0], "so_diem": len(ds), "dtb": dtb, "xep_loai": xep_loai(dtb)}


client = TestClient(app)
print("BAI TAP:", len(client.get("/bai-tap").json()))
client.post("/diem", json={"mon_id": 1, "diem": 8, "he_so": 1})
client.post("/diem", json={"mon_id": 1, "diem": 7, "he_so": 2})
tao = client.post("/diem", json={"mon_id": 1, "diem": 9, "he_so": 3, "dtb": 10})
print("TAO:", tao.status_code, tao.json()["id"])
tk = client.get("/mon/1/tong-ket").json()
print("TONG KET:", tk["ten"], tk["so_diem"], tk["dtb"], tk["xep_loai"])
print("CHUA CO:", client.get("/mon/2/tong-ket").json()["dtb"])
print("DIEM 11:", client.post("/diem", json={"mon_id": 1, "diem": 11, "he_so": 1}).status_code)
print("HE SO 5:", client.post("/diem", json={"mon_id": 1, "diem": 8, "he_so": 5}).status_code)
print("MON LA:", client.post("/diem", json={"mon_id": 99, "diem": 8, "he_so": 1}).status_code)
print("SAU LOI:", client.get("/mon/1/tong-ket").json()["so_diem"])`,
    checks: [
      tc([], 'BAI TAP: 3', 'Vẫn giữ cửa GET /bai-tap của bước 5'),
      tc([], 'TAO: 201 3', 'POST /diem ghi điểm, trả 201 kèm id'),
      tc(
        [],
        'TONG KET: toan 3 8.2 Tot',
        'Máy chủ tự tính ĐTB 8.2 từ CSDL, bỏ qua "dtb": 10 người gọi gửi lên',
      ),
      tc([], 'CHUA CO: None', 'Môn chưa có điểm: dtb là None, không phải 0'),
      tc([], 'DIEM 11: 422', 'Điểm ngoài thang bị chặn ở cửa API'),
      tc([], 'HE SO 5: 422', 'Hệ số sai luật bị chặn'),
      tc([], 'MON LA: 404', 'Ca ẩn: môn không có trong CSDL trả 404', true),
      tc([], 'SAU LOI: 3', 'Ca ẩn: ba lượt bị từ chối KHÔNG ghi gì vào CSDL', true),
    ],
  },
]
