// projectSteps — DỰ ÁN TRỤC T1 "Cửa hàng của tôi": các bước chặng P1 (PR-L3b).
// Đặc tả: dac-ta-du-an-xuyen-suot-mon-lap-trinh-2026-08-24.md §3 (bản đồ chặng P1) + §4
// (workspace + milestone check chấm HÀNH VI, không chấm giống code mẫu).
//
// Học viên xây MỘT file `cua_hang.py` lớn dần qua 5 bước; mỗi bước có hợp đồng I/O rõ
// (in KHÔNG DẤU các dòng chấm điểm — tránh lệch dấu tiếng Việt khi so chuỗi) và bộ check
// tái dùng TestCaseSchema + engine grading.ts. Bước sau GIỮ nguyên các dòng in của bước
// trước để code tiến hoá chứ không đập đi viết lại.
import { TestCaseSchema, type ProgrammingTestCase } from './lessonTypes.js'
// Schema/kiểu/helper của MỘT BƯỚC nằm ở projectStepTypes.ts — file này và projectStepsP3.ts
// cùng import xuống đó, nên không có chu trình import (cổng `codemap -- cycles` chặn CI).
import type { ProjectStage, ProjectStep } from './projectStepTypes.js'
import type { ProjectTrackId } from './projectTrackIds.js'
import { P3_PROJECT_STEPS } from './projectStepsP3.js'
import { P4_PROJECT_STEPS } from './projectStepsP4.js'
import { P5_PROJECT_STEPS } from './projectStepsP5.js'
// Dự án T2/T3 (hạ tầng 2026-10-09): file riêng, chỉ import KIỂU xuống projectStepTypes.ts.
import { T2_PROJECT_STAGES } from './projectStepsT2.js'
import { T3_PROJECT_STAGES } from './projectStepsT3.js'

export {
  PROJECT_MAIN_FILE,
  ProjectStepSchema,
  getStepLanguage,
  getStepFiles,
  getStepMainFile,
  type ProjectStep,
  type ProjectStage,
} from './projectStepTypes.js'
export { P3_PROJECT_STEPS } from './projectStepsP3.js'
export { P4_PROJECT_STEPS } from './projectStepsP4.js'
export { P5_PROJECT_STEPS } from './projectStepsP5.js'

/** Code khởi đầu khi mở dự án lần đầu. */
export const PROJECT_STARTER_CODE = `# cua_hang.py — Cửa hàng của tôi (dự án xuyên suốt, chặng P1)
# Bạn sẽ xây file này lớn dần qua 5 bước. Bắt đầu từ bước 1 nhé!
`

const tc = (
  stdinLines: string[],
  expected: string,
  label: string,
  hidden = false,
): ProgrammingTestCase => TestCaseSchema.parse({ stdinLines, expected, label, hidden })

// Menu cố định của chặng P1 (đề bài quy ước — học viên có thể đổi TÊN QUÁN thoải mái,
// nhưng 3 món + giá giữ nguyên để chấm được):
//   1. Tra da  - 5000   ·  2. Nuoc cam - 15000  ·  3. Sua dau - 10000

export const P1_PROJECT_STEPS: ProjectStep[] = [
  {
    id: 'p1-s1',
    isMilestone: false,
    title: 'In menu + chào theo tên chủ quán',
    unitId: 'p1-u2',
    requirement:
      'Chương trình hỏi tên chủ quán bằng input(), rồi in dòng "Quan cua <ten>" và in menu 3 món (mỗi món một dòng, không dấu):\n1. Tra da - 5000\n2. Nuoc cam - 15000\n3. Sua dau - 10000',
    hint: 'Dùng input() lấy tên vào biến, f-string để ghép "Quan cua {ten}", rồi 3 lệnh print cho 3 món.',
    referenceCode: `ten = input("Ten chu quan: ")
print(f"Quan cua {ten}")
print("1. Tra da - 5000")
print("2. Nuoc cam - 15000")
print("3. Sua dau - 10000")`,
    checks: [
      tc(['Lan'], 'Quan cua Lan', 'Chào đúng tên chủ quán nhập vào'),
      tc(['Lan'], 'Nuoc cam - 15000', 'Menu có đủ món và giá'),
      tc(['Minh'], 'Quan cua Minh', 'Ca ẩn: đổi tên khác vẫn đúng (không hardcode)', true),
    ],
  },
  {
    id: 'p1-s2',
    isMilestone: false,
    title: 'Chọn món + số lượng → tính tiền',
    unitId: 'p1-u3',
    requirement:
      'Sau khi in menu, hỏi tiếp: số món (1-3) và số lượng. Tính tiền = giá món × số lượng, in dòng "Tong: <tien>" (giữ nguyên phần chào + menu của bước 1).',
    hint: 'Giá 3 món lần lượt 5000/15000/10000. Đọc số bằng int(input(...)). Chọn giá theo món bằng if/elif.',
    referenceCode: `ten = input("Ten chu quan: ")
print(f"Quan cua {ten}")
print("1. Tra da - 5000")
print("2. Nuoc cam - 15000")
print("3. Sua dau - 10000")

mon = int(input("Chon mon (1-3): "))
so_luong = int(input("So luong: "))
if mon == 1:
    gia = 5000
elif mon == 2:
    gia = 15000
else:
    gia = 10000
tong = gia * so_luong
print(f"Tong: {tong}")`,
    checks: [
      tc(['Lan', '2', '3'], 'Tong: 45000', 'Nước cam × 3 = 45.000'),
      tc(['Lan', '1', '2'], 'Tong: 10000', 'Trà đá × 2 = 10.000'),
      tc(['Lan', '3', '1'], 'Tong: 10000', 'Ca ẩn: sữa đậu × 1', true),
    ],
  },
  {
    id: 'p1-s3',
    isMilestone: false,
    title: 'Giảm giá bậc thang cho hoá đơn',
    unitId: 'p1-u4',
    requirement:
      'Áp giảm giá theo bậc (tư duy tiền điện EVN đảo chiều): đơn từ 100.000 giảm 20%, từ 50.000 giảm 10%, dưới 50.000 không giảm. Sau dòng "Tong: <tien>", in thêm "Thanh toan: <tien sau giam>" (số nguyên).',
    hint: 'Kiểm bậc CAO trước: if tong >= 100000 → 20%, elif tong >= 50000 → 10%, else giữ nguyên. Dùng int() để ra số nguyên: int(tong * 0.9).',
    referenceCode: `ten = input("Ten chu quan: ")
print(f"Quan cua {ten}")
print("1. Tra da - 5000")
print("2. Nuoc cam - 15000")
print("3. Sua dau - 10000")

mon = int(input("Chon mon (1-3): "))
so_luong = int(input("So luong: "))
if mon == 1:
    gia = 5000
elif mon == 2:
    gia = 15000
else:
    gia = 10000
tong = gia * so_luong
print(f"Tong: {tong}")

if tong >= 100000:
    thanh_toan = int(tong * 0.8)
elif tong >= 50000:
    thanh_toan = int(tong * 0.9)
else:
    thanh_toan = tong
print(f"Thanh toan: {thanh_toan}")`,
    checks: [
      tc(['Lan', '2', '4'], 'Thanh toan: 54000', 'Đơn 60.000 → giảm 10% còn 54.000'),
      tc(['Lan', '2', '8'], 'Thanh toan: 96000', 'Đơn 120.000 → giảm 20% còn 96.000'),
      tc(['Lan', '1', '2'], 'Thanh toan: 10000', 'Đơn nhỏ không giảm'),
      tc(['Lan', '2', '4'], 'Tong: 60000', 'Vẫn giữ dòng Tong của bước 2'),
      // Ca biên RANH GIỚI bậc — đúng chỗ người mới hay sai >= vs >.
      tc(['Lan', '3', '5'], 'Thanh toan: 45000', 'Ca ẩn: đúng 50.000 phải được giảm 10%', true),
    ],
  },
  {
    id: 'p1-s4',
    isMilestone: false,
    title: 'Bán nhiều đơn liên tiếp (vòng lặp)',
    unitId: 'p1-u7',
    requirement:
      'Đổi luồng: sau phần chào + menu, hỏi "So don" rồi LẶP: mỗi đơn hỏi món + số lượng, in "Tong: <tien>" và "Thanh toan: <tien>" cho từng đơn như bước 3. Kết thúc in "Doanh thu: <tong cac thanh toan>".',
    hint: 'Dùng for _ in range(so_don): và một biến doanh_thu cộng dồn thanh_toan sau mỗi đơn.',
    referenceCode: `ten = input("Ten chu quan: ")
print(f"Quan cua {ten}")
print("1. Tra da - 5000")
print("2. Nuoc cam - 15000")
print("3. Sua dau - 10000")

so_don = int(input("So don: "))
doanh_thu = 0
for _ in range(so_don):
    mon = int(input("Chon mon (1-3): "))
    so_luong = int(input("So luong: "))
    if mon == 1:
        gia = 5000
    elif mon == 2:
        gia = 15000
    else:
        gia = 10000
    tong = gia * so_luong
    print(f"Tong: {tong}")
    if tong >= 100000:
        thanh_toan = int(tong * 0.8)
    elif tong >= 50000:
        thanh_toan = int(tong * 0.9)
    else:
        thanh_toan = tong
    print(f"Thanh toan: {thanh_toan}")
    doanh_thu = doanh_thu + thanh_toan
print(f"Doanh thu: {doanh_thu}")`,
    checks: [
      tc(['Lan', '2', '2', '3', '1', '2'], 'Doanh thu: 55000', '2 đơn: cam×3 + trà×2 = 55.000'),
      tc(['Lan', '1', '2', '4'], 'Doanh thu: 54000', '1 đơn có giảm giá: 60.000 → 54.000'),
      tc(['Lan', '0'], 'Doanh thu: 0', 'Ca ẩn: 0 đơn — vòng lặp không chạy', true),
    ],
  },
  {
    id: 'p1-s5',
    title: 'Milestone P1 — tiền khách đưa & tiền thừa',
    unitId: 'p1-u10',
    requirement:
      'Hoàn thiện máy tính tiền: trong mỗi đơn, sau khi in "Thanh toan", hỏi thêm tiền khách đưa. Đủ tiền → in "Thoi lai: <thua>" và cộng doanh thu; thiếu → in "Khong du tien" và KHÔNG cộng. Cuối vẫn in "Doanh thu: <t>".',
    hint: 'So sánh tien_dua với thanh_toan: đủ thì in thối lại (tien_dua - thanh_toan) và cộng doanh thu; thiếu thì chỉ in "Khong du tien".',
    referenceCode: `ten = input("Ten chu quan: ")
print(f"Quan cua {ten}")
print("1. Tra da - 5000")
print("2. Nuoc cam - 15000")
print("3. Sua dau - 10000")

so_don = int(input("So don: "))
doanh_thu = 0
for _ in range(so_don):
    mon = int(input("Chon mon (1-3): "))
    so_luong = int(input("So luong: "))
    if mon == 1:
        gia = 5000
    elif mon == 2:
        gia = 15000
    else:
        gia = 10000
    tong = gia * so_luong
    print(f"Tong: {tong}")
    if tong >= 100000:
        thanh_toan = int(tong * 0.8)
    elif tong >= 50000:
        thanh_toan = int(tong * 0.9)
    else:
        thanh_toan = tong
    print(f"Thanh toan: {thanh_toan}")
    tien_dua = int(input("Khach dua: "))
    if tien_dua >= thanh_toan:
        print(f"Thoi lai: {tien_dua - thanh_toan}")
        doanh_thu = doanh_thu + thanh_toan
    else:
        print("Khong du tien")
print(f"Doanh thu: {doanh_thu}")`,
    checks: [
      tc(
        ['Lan', '1', '2', '3', '50000'],
        'Thoi lai: 5000',
        'Cam×3 = 45.000, đưa 50.000 → thối 5.000',
      ),
      tc(['Lan', '1', '2', '3', '50000'], 'Doanh thu: 45000', 'Doanh thu cộng đúng đơn đã trả'),
      tc(['Lan', '1', '2', '3', '20000'], 'Khong du tien', 'Thiếu tiền phải báo'),
      tc(
        ['Lan', '1', '2', '3', '20000'],
        'Doanh thu: 0',
        'Ca ẩn: đơn thiếu tiền KHÔNG cộng doanh thu',
        true,
      ),
      tc(['Lan', '1', '2', '3', '45000'], 'Thoi lai: 0', 'Ca ẩn: đưa vừa đủ — ranh giới >=', true),
    ],
    isMilestone: true,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// CHẶNG P2 — "Sổ sách tử tế" (PR-L6b). Đặc tả xuyên suốt §3 chặng P2.
//
// Cửa hàng tiến hoá từ máy tính tiền P1 thành SỔ SÁCH: gọi món bằng TÊN (dict thay
// dãy if), menu sửa được lúc đang bán, đơn ghi ra CSV nên tắt máy không mất, nhập bậy
// không sập, và cuối chặng tách 3 file đúng vai trò.
//
// Hợp đồng I/O chung của cả chặng (giữ nguyên qua các bước, mỗi bước THÊM khả năng):
//   input  : "Ten chu quan" → rồi lặp lệnh: tên món để bán · "them" để thêm món · "xong"
//   output : "Quan cua <ten>" · menu mỗi món một dòng "<ten> - <gia>" · mỗi đơn
//            "Thanh tien: <tien>" · kết phiên "So don: <n>" và "Doanh thu: <t>"
// Mọi dòng chấm điểm in KHÔNG DẤU (so chuỗi khỏi lệch dấu tiếng Việt), như chặng P1.

/** File làm việc của chặng P2 khi tách vai trò ở bước cuối. */
export const P2_LOGIC_FILE = 'logic.py'
export const P2_STORAGE_FILE = 'luu_tru.py'

export const P2_PROJECT_STEPS: ProjectStep[] = [
  {
    id: 'p2-s1',
    isMilestone: false,
    title: 'Gọi món bằng TÊN — menu là dict, tính tiền bằng hàm',
    unitId: 'p2-u1',
    requirement:
      'Nâng cấp máy tính tiền P1 thành sổ bán hàng gọi món bằng TÊN.\n\nMENU là dict: {"tra da": 5000, "nuoc cam": 15000, "sua dau": 10000}.\n\nLuồng chương trình:\n1. Hỏi tên chủ quán → in "Quan cua <ten>", rồi in menu, MỖI MÓN MỘT DÒNG dạng "<ten> - <gia>" (đúng thứ tự trong MENU).\n2. Lặp: hỏi tên món.\n   - Gõ "xong" → kết thúc phiên.\n   - Món có trong MENU (bỏ qua khoảng trắng thừa và hoa/thường) → hỏi số lượng, in "Thanh tien: <tien>", cộng doanh thu và đếm đơn.\n   - Món lạ → in "Khong co mon nay", KHÔNG hỏi số lượng, không tính.\n3. Kết phiên in 2 dòng: "So don: <n>" rồi "Doanh thu: <t>".\n\nBẮT BUỘC có hàm tinh_tien(ten, so_luong) trả về số tiền (không print bên trong).',
    hint: 'MENU.get(ten, 0) * so_luong là toàn bộ phần tính tiền. In menu bằng for ten, gia in MENU.items(). Nhớ .strip().lower() tên món TRƯỚC khi tra.',
    referenceCode: `MENU = {"tra da": 5000, "nuoc cam": 15000, "sua dau": 10000}


def tinh_tien(ten, so_luong):
    return MENU.get(ten, 0) * so_luong


chu_quan = input("Ten chu quan: ")
print(f"Quan cua {chu_quan}")
for ten, gia in MENU.items():
    print(f"{ten} - {gia}")

so_don = 0
doanh_thu = 0
while True:
    mon = input("Mon (xong de ket thuc): ").strip().lower()
    if mon == "xong":
        break
    if mon not in MENU:
        print("Khong co mon nay")
        continue
    so_luong = int(input("So luong: "))
    tien = tinh_tien(mon, so_luong)
    print(f"Thanh tien: {tien}")
    so_don = so_don + 1
    doanh_thu = doanh_thu + tien

print(f"So don: {so_don}")
print(f"Doanh thu: {doanh_thu}")`,
    checks: [
      tc(['Lan', 'tra da', '2', 'nuoc cam', '1', 'xong'], 'Doanh thu: 25000', '2 đơn gọi bằng tên'),
      tc(['Lan', 'tra da', '2', 'xong'], 'Thanh tien: 10000', 'Hoá đơn từng đơn in đúng'),
      tc(['Lan', 'ca phe', 'xong'], 'Khong co mon nay', 'Món lạ: báo và KHÔNG hỏi số lượng'),
      tc(['Lan', 'xong'], 'So don: 0', 'Ca ẩn: đóng phiên ngay', true),
      tc(['Lan', '  Sua Dau ', '3', 'xong'], 'Doanh thu: 30000', 'Ca ẩn: tên bẩn vẫn nhận', true),
    ],
  },
  {
    id: 'p2-s2',
    isMilestone: false,
    title: 'Menu sửa được — thêm món ngay lúc đang bán',
    unitId: 'p2-u4',
    requirement:
      'Giữ nguyên mọi hành vi bước 1, thêm MỘT lệnh mới trong vòng lặp:\n\nGõ "them" → hỏi "Ten mon moi:" rồi "Gia:" → thêm vào MENU và in "Da them <ten> - <gia>".\n\nMón vừa thêm phải bán được ngay ở các vòng sau (dict sửa được lúc đang chạy — đó là điểm khác biệt so với dãy if cứng của P1).',
    hint: 'Thêm một nhánh if mon == "them": trước phần kiểm món lạ. Thêm vào dict bằng MENU[ten_moi] = gia rồi continue để quay lại vòng lặp.',
    referenceCode: `MENU = {"tra da": 5000, "nuoc cam": 15000, "sua dau": 10000}


def tinh_tien(ten, so_luong):
    return MENU.get(ten, 0) * so_luong


chu_quan = input("Ten chu quan: ")
print(f"Quan cua {chu_quan}")
for ten, gia in MENU.items():
    print(f"{ten} - {gia}")

so_don = 0
doanh_thu = 0
while True:
    mon = input("Mon (them/xong): ").strip().lower()
    if mon == "xong":
        break
    if mon == "them":
        ten_moi = input("Ten mon moi: ").strip().lower()
        gia_moi = int(input("Gia: "))
        MENU[ten_moi] = gia_moi
        print(f"Da them {ten_moi} - {gia_moi}")
        continue
    if mon not in MENU:
        print("Khong co mon nay")
        continue
    so_luong = int(input("So luong: "))
    tien = tinh_tien(mon, so_luong)
    print(f"Thanh tien: {tien}")
    so_don = so_don + 1
    doanh_thu = doanh_thu + tien

print(f"So don: {so_don}")
print(f"Doanh thu: {doanh_thu}")`,
    checks: [
      tc(
        ['Lan', 'them', 'ca phe', '20000', 'xong'],
        'Da them ca phe - 20000',
        'Thêm món mới vào menu',
      ),
      tc(
        ['Lan', 'them', 'ca phe', '20000', 'ca phe', '2', 'xong'],
        'Doanh thu: 40000',
        'Món vừa thêm BÁN ĐƯỢC NGAY',
      ),
      tc(['Lan', 'tra da', '2', 'xong'], 'Doanh thu: 10000', 'Hành vi bước 1 không được vỡ'),
      tc(
        ['Lan', 'them', 'ca phe', '20000', 'tra da', '1', 'xong'],
        'So don: 1',
        'Ca ẩn: lệnh "them" KHÔNG phải một đơn hàng',
        true,
      ),
    ],
  },
  {
    id: 'p2-s3',
    isMilestone: false,
    title: 'Sổ không mất — ghi đơn ra CSV rồi đọc lại để chốt doanh thu',
    unitId: 'p2-u6',
    requirement:
      'Giữ nguyên hành vi bước 2, thêm phần LƯU TRỮ:\n\n1. Ngay đầu phiên, mở file "don_hang.csv" bằng chế độ "w" để bắt đầu SỔ MỚI (xoá sổ phiên trước — nhờ vậy chạy lại không cộng dồn nhầm).\n2. Mỗi đơn bán thành công, ghi THÊM một dòng dạng: <ten mon>,<so luong>,<thanh tien>\n3. Kết phiên, ĐỌC LẠI chính file đó rồi mới in "So don" và "Doanh thu" — hai con số này phải tính từ FILE, không phải từ biến đếm trong bộ nhớ.',
    hint: 'Đầu chương trình: open("don_hang.csv", "w", encoding="utf-8").close() để tạo sổ rỗng. Mỗi đơn mở lại bằng chế độ "a" và f.write(f"{mon},{so_luong},{tien}\\n"). Cuối phiên mở "r", duyệt từng dòng, .strip().split(",") rồi cộng cột thứ 3.',
    referenceCode: `MENU = {"tra da": 5000, "nuoc cam": 15000, "sua dau": 10000}
SO_FILE = "don_hang.csv"


def tinh_tien(ten, so_luong):
    return MENU.get(ten, 0) * so_luong


def ghi_don(ten, so_luong, tien):
    with open(SO_FILE, "a", encoding="utf-8") as f:
        f.write(f"{ten},{so_luong},{tien}\\n")


def doc_so():
    so_don = 0
    doanh_thu = 0
    with open(SO_FILE, "r", encoding="utf-8") as f:
        for dong in f:
            dong = dong.strip()
            if dong == "":
                continue
            ten, so_luong, tien = dong.split(",")
            so_don = so_don + 1
            doanh_thu = doanh_thu + int(tien)
    return so_don, doanh_thu


open(SO_FILE, "w", encoding="utf-8").close()

chu_quan = input("Ten chu quan: ")
print(f"Quan cua {chu_quan}")
for ten, gia in MENU.items():
    print(f"{ten} - {gia}")

while True:
    mon = input("Mon (them/xong): ").strip().lower()
    if mon == "xong":
        break
    if mon == "them":
        ten_moi = input("Ten mon moi: ").strip().lower()
        gia_moi = int(input("Gia: "))
        MENU[ten_moi] = gia_moi
        print(f"Da them {ten_moi} - {gia_moi}")
        continue
    if mon not in MENU:
        print("Khong co mon nay")
        continue
    so_luong = int(input("So luong: "))
    tien = tinh_tien(mon, so_luong)
    print(f"Thanh tien: {tien}")
    ghi_don(mon, so_luong, tien)

so_don, doanh_thu = doc_so()
print(f"So don: {so_don}")
print(f"Doanh thu: {doanh_thu}")`,
    checks: [
      tc(
        ['Lan', 'tra da', '2', 'nuoc cam', '1', 'xong'],
        'Doanh thu: 25000',
        'Doanh thu chốt từ file, không phải từ biến nhớ',
      ),
      tc(['Lan', 'xong'], 'Doanh thu: 0', 'Phiên rỗng: sổ mới phải trống'),
      tc(
        ['Lan', 'sua dau', '3', 'xong'],
        'So don: 1',
        'Ca ẩn: chạy lại KHÔNG cộng dồn sổ phiên trước (mở "w" đầu phiên)',
        true,
      ),
    ],
  },
  {
    id: 'p2-s4',
    isMilestone: false,
    title: 'Sổ không thể sập — chống nhập bậy bằng try/except',
    unitId: 'p2-u7',
    requirement:
      'Giữ nguyên hành vi bước 3, thêm lớp chống nhập bậy:\n\n- Số lượng không phải số nguyên → in "Du lieu khong hop le", KHÔNG ghi đơn, và phiên bán VẪN TIẾP TỤC.\n- Giá món mới (lệnh "them") không phải số nguyên → in "Du lieu khong hop le" và KHÔNG thêm món.\n\nChương trình tuyệt đối không được văng traceback.',
    hint: 'Bọc int(...) trong try/except ValueError, trong phần except thì print báo lỗi rồi continue để quay lại vòng lặp thay vì để lỗi thoát chương trình.',
    referenceCode: `MENU = {"tra da": 5000, "nuoc cam": 15000, "sua dau": 10000}
SO_FILE = "don_hang.csv"


def tinh_tien(ten, so_luong):
    return MENU.get(ten, 0) * so_luong


def ghi_don(ten, so_luong, tien):
    with open(SO_FILE, "a", encoding="utf-8") as f:
        f.write(f"{ten},{so_luong},{tien}\\n")


def doc_so():
    so_don = 0
    doanh_thu = 0
    with open(SO_FILE, "r", encoding="utf-8") as f:
        for dong in f:
            dong = dong.strip()
            if dong == "":
                continue
            ten, so_luong, tien = dong.split(",")
            so_don = so_don + 1
            doanh_thu = doanh_thu + int(tien)
    return so_don, doanh_thu


open(SO_FILE, "w", encoding="utf-8").close()

chu_quan = input("Ten chu quan: ")
print(f"Quan cua {chu_quan}")
for ten, gia in MENU.items():
    print(f"{ten} - {gia}")

while True:
    mon = input("Mon (them/xong): ").strip().lower()
    if mon == "xong":
        break
    if mon == "them":
        ten_moi = input("Ten mon moi: ").strip().lower()
        tho_gia = input("Gia: ")
        try:
            gia_moi = int(tho_gia)
        except ValueError:
            print("Du lieu khong hop le")
            continue
        MENU[ten_moi] = gia_moi
        print(f"Da them {ten_moi} - {gia_moi}")
        continue
    if mon not in MENU:
        print("Khong co mon nay")
        continue
    tho = input("So luong: ")
    try:
        so_luong = int(tho)
    except ValueError:
        print("Du lieu khong hop le")
        continue
    tien = tinh_tien(mon, so_luong)
    print(f"Thanh tien: {tien}")
    ghi_don(mon, so_luong, tien)

so_don, doanh_thu = doc_so()
print(f"So don: {so_don}")
print(f"Doanh thu: {doanh_thu}")`,
    checks: [
      tc(
        ['Lan', 'tra da', 'hai', 'xong'],
        'Du lieu khong hop le',
        'Số lượng gõ chữ — báo lỗi, không sập',
      ),
      tc(
        ['Lan', 'tra da', 'hai', 'tra da', '2', 'xong'],
        'Doanh thu: 10000',
        'Sau đơn hỏng, phiên bán vẫn chạy tiếp bình thường',
      ),
      tc(
        ['Lan', 'them', 'ca phe', 'hai muoi', 'xong'],
        'Du lieu khong hop le',
        'Giá món mới gõ chữ cũng phải chặn',
      ),
      tc(
        ['Lan', 'tra da', 'hai', 'xong'],
        'So don: 0',
        'Ca ẩn: đơn hỏng KHÔNG được ghi vào sổ',
        true,
      ),
    ],
  },
  {
    id: 'p2-s5',
    isMilestone: true,
    title: 'Milestone P2 — tách 3 file đúng vai trò',
    unitId: 'p2-u9',
    requirement:
      'Bước cuối chặng: tách chương trình thành BA file đúng vai trò, hành vi giữ nguyên như bước 4.\n\n- logic.py: MENU và hàm tinh_tien(ten, so_luong) — chỉ tính, KHÔNG input/print.\n- luu_tru.py: hằng SO_FILE và ba hàm mo_so_moi(), ghi_don(ten, so_luong, tien), doc_so() → trả về (so_don, doanh_thu).\n- cua_hang.py: phần giao diện + hàm main(), import hai file kia rồi gọi main().\n\nBộ chấm sẽ import THẲNG logic.py và luu_tru.py để gọi hàm của bạn — gộp tất cả vào một file là không qua được bước này.',
    hint: 'Trong cua_hang.py viết: from logic import MENU, tinh_tien và from luu_tru import mo_so_moi, ghi_don, doc_so. Ba file nằm cùng thư mục nên import thẳng bằng tên file (không có đuôi .py).',
    files: ['cua_hang.py', 'logic.py', 'luu_tru.py'],
    referenceCode: `from logic import MENU, tinh_tien
from luu_tru import mo_so_moi, ghi_don, doc_so


def main():
    mo_so_moi()

    chu_quan = input("Ten chu quan: ")
    print(f"Quan cua {chu_quan}")
    for ten, gia in MENU.items():
        print(f"{ten} - {gia}")

    while True:
        mon = input("Mon (them/xong): ").strip().lower()
        if mon == "xong":
            break
        if mon == "them":
            ten_moi = input("Ten mon moi: ").strip().lower()
            tho_gia = input("Gia: ")
            try:
                gia_moi = int(tho_gia)
            except ValueError:
                print("Du lieu khong hop le")
                continue
            MENU[ten_moi] = gia_moi
            print(f"Da them {ten_moi} - {gia_moi}")
            continue
        if mon not in MENU:
            print("Khong co mon nay")
            continue
        tho = input("So luong: ")
        try:
            so_luong = int(tho)
        except ValueError:
            print("Du lieu khong hop le")
            continue
        tien = tinh_tien(mon, so_luong)
        print(f"Thanh tien: {tien}")
        ghi_don(mon, so_luong, tien)

    so_don, doanh_thu = doc_so()
    print(f"So don: {so_don}")
    print(f"Doanh thu: {doanh_thu}")


main()`,
    referenceFiles: {
      'logic.py': `# logic.py — chỉ TÍNH, không input/print
MENU = {"tra da": 5000, "nuoc cam": 15000, "sua dau": 10000}


def tinh_tien(ten, so_luong):
    return MENU.get(ten, 0) * so_luong
`,
      'luu_tru.py': `# luu_tru.py — chỉ LƯU TRỮ, không input/print
SO_FILE = "don_hang.csv"


def mo_so_moi():
    open(SO_FILE, "w", encoding="utf-8").close()


def ghi_don(ten, so_luong, tien):
    with open(SO_FILE, "a", encoding="utf-8") as f:
        f.write(f"{ten},{so_luong},{tien}\\n")


def doc_so():
    so_don = 0
    doanh_thu = 0
    with open(SO_FILE, "r", encoding="utf-8") as f:
        for dong in f:
            dong = dong.strip()
            if dong == "":
                continue
            ten, so_luong, tien = dong.split(",")
            so_don = so_don + 1
            doanh_thu = doanh_thu + int(tien)
    return so_don, doanh_thu
`,
    },
    // Bộ chấm KHÔNG chạy cua_hang.py mà import thẳng hai module vai trò — đây là cách duy
    // nhất ép tách file thật, vì code gộp một file vẫn in ra output y hệt.
    probeCode: `from logic import tinh_tien
from luu_tru import mo_so_moi, ghi_don, doc_so

print(f"Thanh tien: {tinh_tien('nuoc cam', 3)}")
print(f"Mon la: {tinh_tien('ca phe', 3)}")

mo_so_moi()
ghi_don("tra da", 2, 10000)
ghi_don("sua dau", 1, 10000)
so_don, doanh_thu = doc_so()
print(f"So don: {so_don}")
print(f"Doanh thu: {doanh_thu}")

mo_so_moi()
so_don, doanh_thu = doc_so()
print(f"So moi: {so_don} {doanh_thu}")`,
    checks: [
      tc([], 'Thanh tien: 45000', 'logic.tinh_tien gọi được từ ngoài và tính đúng'),
      tc([], 'Mon la: 0', 'Món ngoài menu cho 0 (không vỡ)'),
      tc([], 'So don: 2', 'luu_tru ghi rồi đọc lại đúng số đơn'),
      tc([], 'Doanh thu: 20000', 'Doanh thu đọc từ sổ đúng'),
      tc([], 'So moi: 0 0', 'Ca ẩn: mo_so_moi() phải XOÁ sổ cũ', true),
    ],
  },
]

/** Các chặng của dự án T1 "Cửa hàng của tôi" (theo bậc) — giữ tên export cũ vì nhiều nơi
 *  đang dùng; nơi cần đúng dự án học viên đã chọn thì gọi `getProjectStages(track)`. */
export const PROJECT_STAGES: ProjectStage[] = [
  { level: 'p1', title: 'Chặng P1 — Máy tính tiền', steps: P1_PROJECT_STEPS },
  { level: 'p2', title: 'Chặng P2 — Sổ sách tử tế', steps: P2_PROJECT_STEPS },
  { level: 'p3', title: 'Chặng P3 — Lên web', steps: P3_PROJECT_STEPS },
  { level: 'p4', title: 'Chặng P4 — Có xương sống', steps: P4_PROJECT_STEPS },
  { level: 'p5', title: 'Chặng P5 — Ra Internet', steps: P5_PROJECT_STEPS },
]

const STAGES_BY_TRACK: Readonly<Record<ProjectTrackId, readonly ProjectStage[]>> = {
  T1: PROJECT_STAGES,
  T2: T2_PROJECT_STAGES,
  T3: T3_PROJECT_STAGES,
}

/** Các chặng P1–P5 của một dự án trục. T1 trả ĐÚNG mảng `PROJECT_STAGES` (cùng tham chiếu). */
export function getProjectStages(track: ProjectTrackId): readonly ProjectStage[] {
  return STAGES_BY_TRACK[track]
}

// Tra bước theo mã trên CẢ BA dự án — mã đã mang tiền tố dự án (T1 không tiền tố, T2 `t2-`,
// T3 `t3-`) nên không thể trùng nhau giữa các dự án.
const stepMap = new Map(
  Object.values(STAGES_BY_TRACK)
    .flatMap((stages) => stages.flatMap((stage) => stage.steps))
    .map((s) => [s.id, s]),
)

export function getProjectStep(stepId: string): ProjectStep | undefined {
  return stepMap.get(stepId)
}
