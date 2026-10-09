// projectStepsT2 — DỰ ÁN TRỤC T2 "Quỹ lớp / Chi tiêu nhà mình" (nội dung 2026-10-09).
// Đặc tả hạ tầng: docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md (mục "Hợp đồng cho PR nội
// dung"). Bối cảnh dự án: docs/research/mon-lap-trinh.md §2.2 — thu chi · thành viên · hạng mục
// · kỳ báo cáo · trang minh bạch quỹ; đồng hình kỹ thuật với T1 (CRUD + báo cáo + trang public).
//
// Học viên làm THỦ QUỸ của lớp: sổ quỹ lớn dần qua năm chặng, cùng nhịp tiến hoá với T1 —
//   P1 console một file (quy_lop.py) → P2 nhiều file + sổ CSV không mất → P3 trang minh bạch
//   (HTML/CSS · DOM · SQL · fetch) → P4 lõi có class/test/API → P5 lên Internet.
// File này giữ chặng P1/P2 và bảng chặng; chặng P3–P5 nằm ở projectStepsT2P3/P4/P5.ts.
//
// LUẬT CHUNG CỦA SỔ QUỸ (giữ xuyên dự án để đây là MỘT sản phẩm, không phải năm đề rời):
//  - Mức đóng: 50.000 đồng mỗi bạn mỗi kỳ.
//  - Chi KHÔNG BAO GIỜ được vượt số dư — quỹ lớp không có "nợ" (ranh giới: chi đúng bằng số dư
//    vẫn được).
//  - Tình trạng quỹ theo số dư: ≥ 500.000 "du dung" · ≥ 100.000 "sap het" · dưới đó "bao dong".
//  - Mọi dòng chấm điểm in KHÔNG DẤU (so chuỗi khỏi lệch dấu tiếng Việt), như T1.
//
// LUẬT CHO PR NỘI DUNG (test `projectTracks.test.ts` canh, đỏ là sai hợp đồng):
//  - Mã bước `t2-p<n>-s<k>` (k đếm từ 1, liên tục trong chặng); `unitId` cùng bậc với chặng.
//  - MỌI bước phải khai `files` (phần tử đầu = file chạy chính): mặc định của schema là file
//    `cua_hang.py` của T1, để trống là chạy nhầm file dự án khác.
//  - Bước cuối mỗi chặng có `isMilestone: true`, các bước khác false.
//  - Chỉ import KIỂU từ projectStepTypes.ts (không import projectSteps.ts — chu trình import,
//    cổng `codemap -- cycles` chặn CI).
import { TestCaseSchema, type ProgrammingTestCase } from './lessonTypes.js'
import type { ProjectStage, ProjectStep } from './projectStepTypes.js'
// Chặng dài tách file riêng theo khuôn T1 — mỗi file chỉ import KIỂU xuống projectStepTypes.ts.
import { T2_P3_PROJECT_STEPS } from './projectStepsT2P3.js'
import { T2_P4_PROJECT_STEPS } from './projectStepsT2P4.js'

export { T2_P3_PROJECT_STEPS } from './projectStepsT2P3.js'
export { T2_P4_PROJECT_STEPS } from './projectStepsT2P4.js'

/** File làm việc chính của T2 từ chặng P1 (lưu ở server dưới tên `t2--quy_lop.py`). */
export const T2_PROJECT_MAIN_FILE = 'quy_lop.py'

/** Code khởi đầu khi mở T2 lần đầu. */
export const T2_PROJECT_STARTER_CODE = `# quy_lop.py — Quỹ lớp / Chi tiêu nhà mình (dự án xuyên suốt, chặng P1)
# Bạn sẽ xây file này lớn dần qua từng bước. Bắt đầu từ bước 1 nhé!
`

const tc = (
  stdinLines: string[],
  expected: string,
  label: string,
  hidden = false,
): ProgrammingTestCase => TestCaseSchema.parse({ stdinLines, expected, label, hidden })

const FILES_P1 = [T2_PROJECT_MAIN_FILE]

// ─────────────────────────────────────────────────────────────────────────────
// CHẶNG P1 — "Sổ thu chi chạy chữ". Một file quy_lop.py, chạy trong console.
//
// Hợp đồng nhập (cộng dồn qua các bước, bước sau THÊM ô nhập ở cuối, không đổi thứ tự cũ):
//   tên lớp · sĩ số · số bạn đã đóng · (bước 3) một khoản chi
//   · (bước 4–5) số khoản chi rồi từng cặp nội dung + số tiền
// Hợp đồng xuất: "Quy lop <ten>" · "Moi ban dong: 50000" · "Can thu: <t>" · "Da thu: <t>" ·
//   "Con thieu: <t>" · "Ti le da dong: <p>%" · "Chi <noi dung>: <t>" · "So du: <t>" ·
//   "Tinh trang quy: <muc>" · (bước 4) "Tong chi: <t>" · (bước 5) dòng đóng bù.
// ─────────────────────────────────────────────────────────────────────────────

const P1_S1_CODE = `MUC_DONG = 50000

ten_lop = input("Ten lop: ")
si_so = int(input("Si so: "))
print(f"Quy lop {ten_lop}")
print(f"Moi ban dong: {MUC_DONG}")
print(f"Can thu: {si_so * MUC_DONG}")`

const P1_S2_CODE = `${P1_S1_CODE}

da_dong = int(input("So ban da dong: "))
da_thu = da_dong * MUC_DONG
print(f"Da thu: {da_thu}")
print(f"Con thieu: {(si_so - da_dong) * MUC_DONG}")
print(f"Ti le da dong: {round(da_dong / si_so * 100)}%")`

/** Đoạn in tình trạng quỹ — dùng lại nguyên văn từ bước 3 tới milestone. */
const P1_TINH_TRANG = `if so_du >= 500000:
    print("Tinh trang quy: du dung")
elif so_du >= 100000:
    print("Tinh trang quy: sap het")
else:
    print("Tinh trang quy: bao dong")`

const P1_S3_CODE = `${P1_S2_CODE}

noi_dung = input("Noi dung chi: ")
so_tien = int(input("So tien chi: "))
if so_tien <= da_thu:
    print(f"Chi {noi_dung}: {so_tien}")
    so_du = da_thu - so_tien
else:
    print("Khong du quy")
    so_du = da_thu
print(f"So du: {so_du}")
${P1_TINH_TRANG}`

const P1_S4_CODE = `${P1_S2_CODE}

so_khoan = int(input("So khoan chi: "))
so_du = da_thu
tong_chi = 0
for _ in range(so_khoan):
    noi_dung = input("Noi dung chi: ")
    so_tien = int(input("So tien chi: "))
    if so_tien <= so_du:
        print(f"Chi {noi_dung}: {so_tien}")
        so_du = so_du - so_tien
        tong_chi = tong_chi + so_tien
    else:
        print(f"Khong du quy: {noi_dung}")
print(f"Tong chi: {tong_chi}")
print(f"So du: {so_du}")
${P1_TINH_TRANG}`

const P1_S5_CODE = `import math

${P1_S4_CODE}

if so_du < 100000:
    can_them = 500000 - so_du
    # Lam tron LEN hang nghin: thieu 1 dong cung phai thu them ca nghin
    moi_ban = math.ceil(can_them / (si_so * 1000)) * 1000
    print(f"Moi ban dong them: {moi_ban}")
else:
    print("Chua can dong them")`

export const T2_P1_PROJECT_STEPS: ProjectStep[] = [
  {
    id: 't2-p1-s1',
    isMilestone: false,
    files: FILES_P1,
    title: 'Mở sổ quỹ — tên lớp, sĩ số, số tiền cần thu',
    unitId: 'p1-u2',
    requirement:
      'Bạn vừa được cả lớp bầu làm thủ quỹ. Việc đầu tiên: biết lớp cần thu bao nhiêu.\n\nMỗi bạn đóng 50000 đồng một kỳ — lưu con số này vào biến MUC_DONG ở đầu file.\n\nChương trình hỏi tên lớp bằng input(), rồi hỏi sĩ số (số nguyên), và in ba dòng (không dấu):\nQuy lop <ten lop>\nMoi ban dong: 50000\nCan thu: <si so × muc dong>',
    hint: 'Sĩ số gõ vào là CHUỖI — phải đổi sang số bằng int(input(...)) thì mới nhân được. Dùng f-string để ghép: print(f"Can thu: {si_so * MUC_DONG}").',
    referenceCode: P1_S1_CODE,
    checks: [
      tc(['10A1', '40'], 'Quy lop 10A1', 'In đúng tên lớp vừa nhập'),
      tc(['10A1', '40'], 'Can thu: 2000000', 'Lớp 40 bạn cần thu 2.000.000 đồng'),
      tc(['12C3', '35'], 'Can thu: 1750000', 'Ca ẩn: lớp khác, sĩ số khác vẫn đúng', true),
      tc(['12C3', '35'], 'Quy lop 12C3', 'Ca ẩn: không gõ cứng tên lớp', true),
    ],
  },
  {
    id: 't2-p1-s2',
    isMilestone: false,
    files: FILES_P1,
    title: 'Đã thu bao nhiêu, còn thiếu bao nhiêu',
    unitId: 'p1-u3',
    requirement:
      'Giữ nguyên ba dòng của bước 1, hỏi thêm số bạn ĐÃ đóng, rồi in tiếp:\nDa thu: <so ban da dong × 50000>\nCon thieu: <so ban chua dong × 50000>\nTi le da dong: <phan tram>%\n\nTỉ lệ là số bạn đã đóng chia sĩ số nhân 100, LÀM TRÒN tới số nguyên gần nhất (24/36 bạn là 66,67% → in 67%, không phải 66%).',
    hint: 'Số bạn chưa đóng = si_so - da_dong. Làm tròn bằng round(...): round(66.67) cho 67, còn int(66.67) chỉ cắt bỏ phần lẻ thành 66 — sai với cách lớp bạn đọc số.',
    referenceCode: P1_S2_CODE,
    checks: [
      tc(['10A1', '40', '30'], 'Da thu: 1500000', '30 bạn đã đóng = 1.500.000 đồng'),
      tc(['10A1', '40', '30'], 'Con thieu: 500000', '10 bạn còn thiếu = 500.000 đồng'),
      tc(['10A1', '40', '30'], 'Ti le da dong: 75%', 'Tỉ lệ 30/40 = 75%'),
      tc(['10A1', '40', '30'], 'Can thu: 2000000', 'Vẫn giữ dòng "Can thu" của bước 1'),
      tc(
        ['12C3', '36', '24'],
        'Ti le da dong: 67%',
        'Ca ẩn: 66,67% phải làm tròn thành 67%, không cắt thành 66%',
        true,
      ),
    ],
  },
  {
    id: 't2-p1-s3',
    isMilestone: false,
    files: FILES_P1,
    title: 'Một khoản chi — đủ quỹ mới chi, rồi báo tình trạng quỹ',
    unitId: 'p1-u4',
    requirement:
      'Giữ nguyên các dòng của bước 2, hỏi thêm nội dung một khoản chi rồi số tiền chi.\n\n1. Số tiền chi KHÔNG vượt quá số đã thu → in "Chi <noi dung>: <so tien>", số dư = đã thu − số tiền chi.\n   Vượt → in "Khong du quy", không chi gì, số dư = đã thu.\n   Chi vừa đúng bằng số đã thu vẫn được (quỹ về 0 chứ không âm).\n2. In "So du: <so du>".\n3. In tình trạng quỹ theo bậc:\n   số dư từ 500000 trở lên → "Tinh trang quy: du dung"\n   từ 100000 trở lên → "Tinh trang quy: sap het"\n   dưới 100000 → "Tinh trang quy: bao dong"',
    hint: 'So sánh "không vượt quá" là <= chứ không phải <. Khi xét bậc, kiểm bậc CAO trước: if so_du >= 500000 … elif so_du >= 100000 … else … — đảo thứ tự là số dư 600.000 cũng rơi vào "sap het".',
    referenceCode: P1_S3_CODE,
    checks: [
      tc(
        ['10A1', '40', '30', 'Mua hoa 20/11', '300000'],
        'Chi Mua hoa 20/11: 300000',
        'Khoản chi trong khả năng quỹ được ghi',
      ),
      tc(
        ['10A1', '40', '30', 'Mua hoa 20/11', '300000'],
        'So du: 1200000',
        'Số dư = 1.500.000 − 300.000',
      ),
      tc(['10A1', '40', '10', 'Lien hoan', '600000'], 'Khong du quy', 'Chi vượt số đã thu bị chặn'),
      tc(
        ['10A1', '40', '10', 'Photo de cuong', '100000'],
        'Tinh trang quy: sap het',
        'Còn 400.000 → quỹ sắp hết',
      ),
      tc(
        ['10A1', '40', '10', 'Lien hoan', '500000'],
        'So du: 0',
        'Ca ẩn: chi vừa đúng bằng quỹ vẫn được (ranh giới <=)',
        true,
      ),
      tc(
        ['10A1', '40', '20', 'Mua bong', '500000'],
        'Tinh trang quy: du dung',
        'Ca ẩn: còn đúng 500.000 vẫn là "du dung" (ranh giới >=)',
        true,
      ),
    ],
  },
  {
    id: 't2-p1-s4',
    isMilestone: false,
    files: FILES_P1,
    title: 'Nhiều khoản chi liên tiếp (vòng lặp)',
    unitId: 'p1-u7',
    requirement:
      'Đổi luồng phần chi: sau các dòng của bước 2, hỏi "So khoan chi" rồi LẶP — mỗi khoản hỏi nội dung và số tiền:\n- số tiền không vượt số dư HIỆN TẠI → in "Chi <noi dung>: <so tien>", trừ vào số dư;\n- vượt → in "Khong du quy: <noi dung>" và bỏ qua khoản đó (không trừ, không tính vào tổng chi).\n\nHết vòng lặp, in:\nTong chi: <tong cac khoan da chi>\nSo du: <so du cuoi>\nrồi dòng tình trạng quỹ như bước 3.',
    hint: 'Trước vòng lặp đặt so_du = da_thu và tong_chi = 0. Trong for _ in range(so_khoan): mỗi khoản so với so_du (đã bị trừ dần), KHÔNG phải với da_thu ban đầu.',
    referenceCode: P1_S4_CODE,
    checks: [
      tc(
        ['10A1', '40', '30', '2', 'Mua hoa', '300000', 'Photo', '200000'],
        'Tong chi: 500000',
        'Hai khoản chi cộng dồn đúng',
      ),
      tc(
        ['10A1', '40', '10', '2', 'Lien hoan', '420000', 'Photo', '100000'],
        'Khong du quy: Photo',
        'Khoản thứ hai vượt số dư còn lại thì bị từ chối',
      ),
      tc(
        ['10A1', '40', '10', '2', 'Lien hoan', '420000', 'Photo', '100000'],
        'So du: 80000',
        'Số dư bị trừ dần qua các khoản',
      ),
      tc(
        ['10A1', '40', '10', '2', 'Lien hoan', '420000', 'Photo', '100000'],
        'Tong chi: 420000',
        'Ca ẩn: khoản bị từ chối KHÔNG tính vào tổng chi',
        true,
      ),
      tc(
        ['10A1', '40', '30', '0'],
        'So du: 1500000',
        'Ca ẩn: không có khoản chi nào — vòng lặp không chạy',
        true,
      ),
    ],
  },
  {
    id: 't2-p1-s5',
    isMilestone: true,
    files: FILES_P1,
    title: 'Milestone P1 — chốt sổ và tính tiền đóng bù',
    unitId: 'p1-u10',
    requirement:
      'Hoàn thiện sổ quỹ chạy chữ: sau dòng tình trạng quỹ của bước 4, thêm phần ĐÓNG BÙ.\n\n- Số dư dưới 100000 (quỹ "bao dong") → lớp phải góp thêm cho quỹ về lại 500000. Chia đều số còn thiếu cho cả lớp, LÀM TRÒN LÊN tới hàng nghìn (không ai muốn cầm tiền lẻ, và làm tròn xuống thì quỹ vẫn hụt), rồi in "Moi ban dong them: <so tien>".\n- Ngược lại → in "Chua can dong them".\n\nVí dụ: số dư 80000, lớp 40 bạn → cần thêm 420000 → mỗi bạn 10500 → làm tròn lên thành 11000.',
    hint: 'import math ở đầu file. math.ceil(x) làm tròn LÊN. Để làm tròn lên hàng nghìn: chia cho 1000 trước, ceil, rồi nhân lại 1000 — math.ceil(can_them / (si_so * 1000)) * 1000.',
    referenceCode: P1_S5_CODE,
    checks: [
      tc(
        ['10A1', '40', '10', '2', 'Lien hoan', '420000', 'Photo', '100000'],
        'Moi ban dong them: 11000',
        'Còn 80.000: mỗi bạn 10.500 → làm tròn lên 11.000',
      ),
      tc(
        ['10A1', '40', '30', '1', 'Mua hoa', '300000'],
        'Chua can dong them',
        'Quỹ còn dồi dào thì không bắt đóng thêm',
      ),
      tc(
        ['10A1', '40', '30', '1', 'Mua hoa', '300000'],
        'Tinh trang quy: du dung',
        'Vẫn giữ dòng tình trạng quỹ của các bước trước',
      ),
      tc(
        ['10A1', '40', '10', '1', 'Lien hoan', '480000'],
        'Moi ban dong them: 12000',
        'Ca ẩn: chia vừa chẵn nghìn thì KHÔNG làm tròn thêm',
        true,
      ),
      tc(
        ['10A1', '40', '10', '1', 'Lien hoan', '400000'],
        'Chua can dong them',
        'Ca ẩn: còn đúng 100.000 là "sap het", chưa phải đóng bù',
        true,
      ),
      tc(
        ['12C3', '36', '12', '1', 'Qua thay co', '560000'],
        'Moi ban dong them: 13000',
        'Ca ẩn: lớp 36 bạn, còn thiếu 460.000',
        true,
      ),
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// CHẶNG P2 — "Sổ quỹ không mất". Sổ quỹ chạy chữ của P1 thành SỔ SÁCH: thu theo TÊN từng
// bạn (dict thay cho một con số "số bạn đã đóng"), chi theo HẠNG MỤC, ghi ra CSV nên tắt máy
// không mất, nhập bậy không sập, và cuối chặng tách 3 file đúng vai trò.
//
// Hợp đồng I/O chung của cả chặng (mỗi bước THÊM khả năng, không đổi dòng cũ):
//   input  : "Ten lop" → lặp lệnh: tên một bạn (thu tiền bạn đó) · "chi" (bước 2+) · "xong"
//   output : "Quy lop <ten>" · "Thanh vien: 4" · "Da thu <ban>: <t>" · "Da chi <hang muc>: <t>"
//            · kết phiên "Tong thu" · "Tong chi" · "So du" · "- <hang muc>: <t>" · "Chua dong: …"
// Lớp có 4 bạn cố định (tên không dấu, viết thường): an · binh · hoa · minh.
// ─────────────────────────────────────────────────────────────────────────────

/** File vai trò của milestone chặng P2 (tên khác T1 cho dễ nhận; workspace vốn đã tách). */
export const T2_P2_LOGIC_FILE = 'tinh_quy.py'
export const T2_P2_STORAGE_FILE = 'luu_so.py'

const FILES_P2 = [T2_PROJECT_MAIN_FILE]

const P2_DANH_SACH = `DANH_SACH = {"an": 0, "binh": 0, "hoa": 0, "minh": 0}`

const P2_CHUA_DONG = `def chua_dong(so_quy):
    ds = []
    for ten, tien in so_quy.items():
        if tien == 0:
            ds.append(ten)
    return ds`

/** Đoạn kết phiên in danh sách chưa đóng — giữ nguyên văn từ bước 1 tới milestone. */
const P2_IN_CHUA_DONG = `ds = chua_dong(DANH_SACH)
if len(ds) == 0:
    print("Chua dong: khong ai")
else:
    print("Chua dong: " + ", ".join(ds))`

const P2_S1_CODE = `${P2_DANH_SACH}


def tong_thu(so_quy):
    tong = 0
    for tien in so_quy.values():
        tong = tong + tien
    return tong


${P2_CHUA_DONG}


ten_lop = input("Ten lop: ")
print(f"Quy lop {ten_lop}")
print(f"Thanh vien: {len(DANH_SACH)}")

while True:
    lenh = input("Ten ban (xong de ket thuc): ").strip().lower()
    if lenh == "xong":
        break
    if lenh not in DANH_SACH:
        print("Khong co ban nay")
        continue
    tien = int(input("So tien: "))
    DANH_SACH[lenh] = DANH_SACH[lenh] + tien
    print(f"Da thu {lenh}: {tien}")

print(f"Tong thu: {tong_thu(DANH_SACH)}")
${P2_IN_CHUA_DONG}`

const P2_S2_CODE = `${P2_DANH_SACH}
CHI = {}


def tong_thu(so_quy):
    tong = 0
    for tien in so_quy.values():
        tong = tong + tien
    return tong


def tong_chi(chi):
    tong = 0
    for tien in chi.values():
        tong = tong + tien
    return tong


def so_du(so_quy, chi):
    return tong_thu(so_quy) - tong_chi(chi)


${P2_CHUA_DONG}


ten_lop = input("Ten lop: ")
print(f"Quy lop {ten_lop}")
print(f"Thanh vien: {len(DANH_SACH)}")

while True:
    lenh = input("Lenh (ten ban/chi/xong): ").strip().lower()
    if lenh == "xong":
        break
    if lenh == "chi":
        hang_muc = input("Hang muc: ").strip().lower()
        tien = int(input("So tien: "))
        if tien > so_du(DANH_SACH, CHI):
            print("Khong du quy")
            continue
        CHI[hang_muc] = CHI.get(hang_muc, 0) + tien
        print(f"Da chi {hang_muc}: {tien}")
        continue
    if lenh not in DANH_SACH:
        print("Khong co ban nay")
        continue
    tien = int(input("So tien: "))
    DANH_SACH[lenh] = DANH_SACH[lenh] + tien
    print(f"Da thu {lenh}: {tien}")

print(f"Tong thu: {tong_thu(DANH_SACH)}")
print(f"Tong chi: {tong_chi(CHI)}")
print(f"So du: {so_du(DANH_SACH, CHI)}")
for hang_muc, tien in CHI.items():
    print(f"- {hang_muc}: {tien}")
${P2_IN_CHUA_DONG}`

/** Phần LƯU TRỮ của sổ (bước 3 trở đi): ghi thêm từng giao dịch, đọc lại để chốt số. */
const P2_LUU_TRU = `SO_FILE = "so_quy.csv"


def ghi_giao_dich(loai, ten, tien):
    with open(SO_FILE, "a", encoding="utf-8") as f:
        f.write(f"{loai},{ten},{tien}\\n")


def doc_so():
    thu = 0
    chi = 0
    theo_hang_muc = {}
    with open(SO_FILE, "r", encoding="utf-8") as f:
        for dong in f:
            dong = dong.strip()
            if dong == "":
                continue
            loai, ten, tien = dong.split(",")
            tien = int(tien)
            if loai == "thu":
                thu = thu + tien
            else:
                chi = chi + tien
                theo_hang_muc[ten] = theo_hang_muc.get(ten, 0) + tien
    return thu, chi, theo_hang_muc`

/** Đoạn kết phiên chốt số TỪ FILE — giữ nguyên văn từ bước 3 tới milestone. */
const P2_KET_PHIEN = `thu, chi, theo_hang_muc = doc_so()
print(f"Tong thu: {thu}")
print(f"Tong chi: {chi}")
print(f"So du: {thu - chi}")
for hang_muc, tien in theo_hang_muc.items():
    print(f"- {hang_muc}: {tien}")
${P2_IN_CHUA_DONG}`

const P2_S3_CODE = `${P2_DANH_SACH}
${P2_LUU_TRU}


${P2_CHUA_DONG}


open(SO_FILE, "w", encoding="utf-8").close()

ten_lop = input("Ten lop: ")
print(f"Quy lop {ten_lop}")
print(f"Thanh vien: {len(DANH_SACH)}")

while True:
    lenh = input("Lenh (ten ban/chi/xong): ").strip().lower()
    if lenh == "xong":
        break
    if lenh == "chi":
        hang_muc = input("Hang muc: ").strip().lower()
        tien = int(input("So tien: "))
        thu, chi, _ = doc_so()
        if tien > thu - chi:
            print("Khong du quy")
            continue
        ghi_giao_dich("chi", hang_muc, tien)
        print(f"Da chi {hang_muc}: {tien}")
        continue
    if lenh not in DANH_SACH:
        print("Khong co ban nay")
        continue
    tien = int(input("So tien: "))
    DANH_SACH[lenh] = DANH_SACH[lenh] + tien
    ghi_giao_dich("thu", lenh, tien)
    print(f"Da thu {lenh}: {tien}")

${P2_KET_PHIEN}`

const P2_DOC_SO_TIEN = `def doc_so_tien(chuoi):
    """Tra ve so tien la so nguyen DUONG, hoac None neu nhap bay."""
    try:
        tien = int(chuoi)
    except ValueError:
        return None
    if tien <= 0:
        return None
    return tien`

/** Vòng lặp lệnh đã chống nhập bậy — bước 4 và hàm main() của milestone dùng chung. */
const P2_VONG_LAP_AN_TOAN = `while True:
    lenh = input("Lenh (ten ban/chi/xong): ").strip().lower()
    if lenh == "xong":
        break
    if lenh == "chi":
        hang_muc = input("Hang muc: ").strip().lower()
        tien = doc_so_tien(input("So tien: "))
        if tien is None:
            print("Du lieu khong hop le")
            continue
        thu, chi, _ = doc_so()
        if tien > thu - chi:
            print("Khong du quy")
            continue
        ghi_giao_dich("chi", hang_muc, tien)
        print(f"Da chi {hang_muc}: {tien}")
        continue
    if lenh not in DANH_SACH:
        print("Khong co ban nay")
        continue
    tien = doc_so_tien(input("So tien: "))
    if tien is None:
        print("Du lieu khong hop le")
        continue
    DANH_SACH[lenh] = DANH_SACH[lenh] + tien
    ghi_giao_dich("thu", lenh, tien)
    print(f"Da thu {lenh}: {tien}")`

const P2_S4_CODE = `${P2_DANH_SACH}
${P2_LUU_TRU}


${P2_CHUA_DONG}


${P2_DOC_SO_TIEN}


open(SO_FILE, "w", encoding="utf-8").close()

ten_lop = input("Ten lop: ")
print(f"Quy lop {ten_lop}")
print(f"Thanh vien: {len(DANH_SACH)}")

${P2_VONG_LAP_AN_TOAN}

${P2_KET_PHIEN}`

/** Thụt mỗi dòng 4 dấu cách — để đặt đoạn code dùng chung vào thân hàm main(). */
const thut = (code: string) =>
  code
    .split('\n')
    .map((d) => (d === '' ? d : `    ${d}`))
    .join('\n')

const P2_S5_CODE = `from tinh_quy import DANH_SACH, chua_dong, doc_so_tien
from luu_so import mo_so_moi, ghi_giao_dich, doc_so


def main():
    mo_so_moi()

    ten_lop = input("Ten lop: ")
    print(f"Quy lop {ten_lop}")
    print(f"Thanh vien: {len(DANH_SACH)}")

${thut(P2_VONG_LAP_AN_TOAN)}

${thut(P2_KET_PHIEN)}


main()`

const P2_S5_LOGIC = `# tinh_quy.py — chỉ TÍNH, không input/print
${P2_DANH_SACH}


${P2_CHUA_DONG}


${P2_DOC_SO_TIEN}
`

const P2_S5_STORAGE = `# luu_so.py — chỉ LƯU TRỮ, không input/print
${P2_LUU_TRU}


def mo_so_moi():
    open(SO_FILE, "w", encoding="utf-8").close()
`

export const T2_P2_PROJECT_STEPS: ProjectStep[] = [
  {
    id: 't2-p2-s1',
    isMilestone: false,
    files: FILES_P2,
    title: 'Thu theo TÊN từng bạn — sổ là dict, tính tổng bằng hàm',
    unitId: 'p2-u1',
    requirement:
      'Sổ P1 chỉ biết "bao nhiêu bạn đã đóng", không biết AI đóng — cuối kỳ có bạn bảo "mình đóng rồi mà" là bạn hết đường đối chiếu. Từ chặng này sổ ghi theo TÊN.\n\nDANH_SACH là dict tên → số tiền đã đóng, lớp có 4 bạn: {"an": 0, "binh": 0, "hoa": 0, "minh": 0}.\n\nLuồng chương trình:\n1. Hỏi tên lớp → in "Quy lop <ten>", rồi "Thanh vien: <so ban trong DANH_SACH>".\n2. Lặp: hỏi tên một bạn.\n   - Gõ "xong" → kết thúc phiên.\n   - Tên có trong DANH_SACH (bỏ khoảng trắng thừa, không phân biệt hoa/thường) → hỏi số tiền, cộng vào sổ của bạn đó, in "Da thu <ten>: <tien>".\n   - Tên lạ → in "Khong co ban nay", KHÔNG hỏi số tiền.\n3. Kết phiên in "Tong thu: <tong>", rồi "Chua dong: <ten, ten>" (các bạn còn 0 đồng, đúng thứ tự trong DANH_SACH, cách nhau dấu phẩy và một khoảng trắng). Ai cũng đã đóng → "Chua dong: khong ai".\n\nBẮT BUỘC có hai hàm không print bên trong: tong_thu(so_quy) trả tổng tiền, chua_dong(so_quy) trả DANH SÁCH tên còn 0 đồng.',
    hint: 'Duyệt dict bằng for ten, tien in so_quy.items(). Chuẩn hoá tên ngay khi đọc: input(...).strip().lower(). Ghép danh sách thành một dòng bằng ", ".join(ds).',
    referenceCode: P2_S1_CODE,
    checks: [
      tc(
        ['10A1', 'an', '50000', 'binh', '50000', 'xong'],
        'Tong thu: 100000',
        'Hai bạn đóng, tổng cộng đúng',
      ),
      tc(
        ['10A1', 'an', '50000', 'binh', '50000', 'xong'],
        'Chua dong: hoa, minh',
        'Liệt kê đúng những bạn chưa đóng, đúng thứ tự',
      ),
      tc(['10A1', 'lan', 'xong'], 'Khong co ban nay', 'Tên lạ: báo và KHÔNG hỏi số tiền'),
      tc(
        ['10A1', '  Hoa ', '50000', 'xong'],
        'Da thu hoa: 50000',
        'Ca ẩn: tên gõ hoa hoặc thừa khoảng trắng vẫn nhận',
        true,
      ),
      tc(
        ['10A1', 'an', '50000', 'binh', '50000', 'hoa', '20000', 'minh', '50000', 'xong'],
        'Chua dong: khong ai',
        'Ca ẩn: cả lớp đã đóng (kể cả đóng thiếu) thì không còn ai trong danh sách',
        true,
      ),
      tc(
        ['10A1', 'an', '30000', 'an', '20000', 'xong'],
        'Tong thu: 50000',
        'Ca ẩn: một bạn đóng hai lần thì cộng dồn',
        true,
      ),
    ],
  },
  {
    id: 't2-p2-s2',
    isMilestone: false,
    files: FILES_P2,
    title: 'Chi theo HẠNG MỤC — dict thứ hai cộng dồn từng mục',
    unitId: 'p2-u4',
    requirement:
      'Giữ nguyên mọi hành vi bước 1, thêm lệnh "chi" trong vòng lặp:\n\nGõ "chi" → hỏi "Hang muc:" (chuẩn hoá như tên bạn) rồi "So tien:".\n- Số tiền vượt số dư (tổng thu − tổng chi) → in "Khong du quy", không ghi gì.\n- Ngược lại → cộng vào dict CHI theo hạng mục và in "Da chi <hang muc>: <tien>". Chi nhiều lần cùng một hạng mục thì CỘNG DỒN vào đúng mục đó.\n\nKết phiên, sau "Tong thu", in thêm:\nTong chi: <tong>\nSo du: <tong thu − tong chi>\nmỗi hạng mục một dòng "- <hang muc>: <tien>" (thứ tự lần đầu xuất hiện)\nrồi mới tới dòng "Chua dong" như bước 1.',
    hint: 'CHI = {} ở đầu file. Cộng dồn một mục bằng CHI[hang_muc] = CHI.get(hang_muc, 0) + tien — .get(…, 0) cho 0 khi mục chưa có, khỏi phải if. Kiểm "chi" TRƯỚC khi kiểm tên bạn, nếu không "chi" sẽ rơi vào nhánh "Khong co ban nay".',
    referenceCode: P2_S2_CODE,
    checks: [
      tc(
        ['10A1', 'an', '50000', 'binh', '50000', 'chi', 'photo', '30000', 'xong'],
        'So du: 70000',
        'Số dư = tổng thu − tổng chi',
      ),
      tc(
        ['10A1', 'an', '50000', 'chi', 'photo', '20000', 'chi', ' Photo ', '10000', 'xong'],
        '- photo: 30000',
        'Chi hai lần cùng hạng mục thì cộng dồn vào một dòng',
      ),
      tc(
        ['10A1', 'an', '50000', 'chi', 'lien hoan', '80000', 'xong'],
        'Khong du quy',
        'Chi vượt số dư bị chặn',
      ),
      tc(
        ['10A1', 'an', '50000', 'xong'],
        'Chua dong: binh, hoa, minh',
        'Hành vi bước 1 không được vỡ',
      ),
      tc(
        ['10A1', 'an', '50000', 'chi', 'lien hoan', '80000', 'xong'],
        'Tong chi: 0',
        'Ca ẩn: khoản bị chặn KHÔNG được ghi vào sổ chi',
        true,
      ),
      tc(
        ['10A1', 'an', '50000', 'chi', 'qua', '50000', 'xong'],
        'So du: 0',
        'Ca ẩn: chi vừa đúng bằng số dư vẫn được',
        true,
      ),
    ],
  },
  {
    id: 't2-p2-s3',
    isMilestone: false,
    files: FILES_P2,
    title: 'Sổ không mất — ghi từng giao dịch ra CSV, chốt số từ file',
    unitId: 'p2-u6',
    requirement:
      'Tắt máy là mất sổ thì không ai tin thủ quỹ. Giữ nguyên hành vi bước 2, thêm phần LƯU TRỮ:\n\n1. Đầu phiên, mở file "so_quy.csv" bằng chế độ "w" để bắt đầu SỔ MỚI (nhờ vậy chạy lại không cộng dồn nhầm sổ phiên trước).\n2. Mỗi giao dịch thành công, ghi THÊM một dòng: <loai>,<ten ban hoac hang muc>,<so tien> — loai là thu hoặc chi. Ví dụ:\n   thu,an,50000\n   chi,photo,30000\n3. Viết hàm doc_so() đọc lại file, trả về (tong_thu, tong_chi, dict hạng mục → tổng chi).\n4. Kết phiên: "Tong thu", "Tong chi", "So du" và các dòng hạng mục phải tính TỪ FILE qua doc_so(), không phải từ biến trong bộ nhớ. Lệnh "chi" cũng hỏi doc_so() để biết số dư hiện tại.',
    hint: 'Đầu chương trình: open("so_quy.csv", "w", encoding="utf-8").close() tạo sổ rỗng. Ghi mỗi dòng bằng chế độ "a" và f.write(f"{loai},{ten},{tien}\\n"). Khi đọc: dong.strip().split(",") rồi int(...) cột thứ ba — mọi thứ đọc từ file đều là chuỗi.',
    referenceCode: P2_S3_CODE,
    checks: [
      tc(
        ['10A1', 'an', '50000', 'binh', '50000', 'chi', 'photo', '30000', 'xong'],
        'So du: 70000',
        'Số dư chốt từ file khớp các giao dịch',
      ),
      tc(['10A1', 'xong'], 'Tong thu: 0', 'Phiên rỗng: sổ mới phải trống'),
      tc(
        ['10A1', 'an', '50000', 'chi', 'lien hoan', '80000', 'xong'],
        'Khong du quy',
        'Vẫn chặn chi vượt số dư (số dư hỏi từ sổ)',
      ),
      tc(
        ['10A1', 'hoa', '50000', 'xong'],
        'Tong thu: 50000',
        'Ca ẩn: chạy lại KHÔNG cộng dồn sổ phiên trước (mở "w" đầu phiên)',
        true,
      ),
      tc(
        ['10A1', 'an', '50000', 'chi', 'photo', '20000', 'chi', 'photo', '10000', 'xong'],
        '- photo: 30000',
        'Ca ẩn: dòng hạng mục cộng dồn đúng khi đọc lại từ file',
        true,
      ),
    ],
  },
  {
    id: 't2-p2-s4',
    isMilestone: false,
    files: FILES_P2,
    title: 'Sổ không thể sập — chống nhập bậy bằng try/except',
    unitId: 'p2-u7',
    requirement:
      'Giữ nguyên hành vi bước 3, thêm lớp chống nhập bậy cho MỌI ô số tiền (cả thu lẫn chi):\n\n- Không phải số nguyên, hoặc không lớn hơn 0 → in "Du lieu khong hop le", KHÔNG ghi gì vào sổ, và phiên VẪN TIẾP TỤC.\n\nVì sao chặn cả số âm: một khoản "chi −20000" lọt vào sổ sẽ làm quỹ TĂNG lên 20.000 mà không ai đóng đồng nào — đúng loại lỗi khiến sổ quỹ mất uy tín.\n\nViết hàm doc_so_tien(chuoi) trả về số tiền hợp lệ, hoặc None khi nhập bậy. Chương trình tuyệt đối không được văng traceback.',
    hint: 'Trong doc_so_tien: try: tien = int(chuoi) / except ValueError: return None, rồi kiểm thêm if tien <= 0: return None. Chỗ gọi chỉ cần: if tien is None: print("Du lieu khong hop le") rồi continue.',
    referenceCode: P2_S4_CODE,
    checks: [
      tc(
        ['10A1', 'an', 'nam muoi', 'xong'],
        'Du lieu khong hop le',
        'Số tiền gõ chữ: báo lỗi, không sập',
      ),
      tc(
        ['10A1', 'an', 'abc', 'an', '50000', 'xong'],
        'Tong thu: 50000',
        'Sau lần nhập hỏng, phiên vẫn chạy tiếp bình thường',
      ),
      tc(
        ['10A1', 'an', '50000', 'chi', 'photo', '-20000', 'xong'],
        'Du lieu khong hop le',
        'Khoản chi âm bị chặn',
      ),
      tc(
        ['10A1', 'an', '50000', 'chi', 'photo', '-20000', 'xong'],
        'So du: 50000',
        'Ca ẩn: khoản chi âm KHÔNG được làm quỹ tăng lên',
        true,
      ),
      tc(
        ['10A1', 'an', '-50000', 'xong'],
        'Chua dong: an, binh, hoa, minh',
        'Ca ẩn: khoản thu âm không được tính là đã đóng',
        true,
      ),
    ],
  },
  {
    id: 't2-p2-s5',
    isMilestone: true,
    files: [T2_PROJECT_MAIN_FILE, T2_P2_LOGIC_FILE, T2_P2_STORAGE_FILE],
    title: 'Milestone P2 — tách 3 file đúng vai trò',
    unitId: 'p2-u9',
    requirement:
      'Bước cuối chặng: tách chương trình thành BA file, hành vi giữ nguyên như bước 4.\n\n- tinh_quy.py: DANH_SACH và hai hàm chua_dong(so_quy), doc_so_tien(chuoi) — chỉ tính, KHÔNG input/print.\n- luu_so.py: hằng SO_FILE và ba hàm mo_so_moi(), ghi_giao_dich(loai, ten, tien), doc_so() → trả về (tong_thu, tong_chi, dict hạng mục).\n- quy_lop.py: phần giao diện trong hàm main(), import hai file kia rồi gọi main().\n\nBộ chấm sẽ import THẲNG tinh_quy.py và luu_so.py để gọi hàm của bạn — gộp tất cả vào một file là không qua được bước này.',
    hint: 'Trong quy_lop.py: from tinh_quy import DANH_SACH, chua_dong, doc_so_tien và from luu_so import mo_so_moi, ghi_giao_dich, doc_so. Ba file nằm cùng thư mục nên import thẳng bằng tên file (không có đuôi .py). Dòng open(..., "w") đầu phiên nay chính là mo_so_moi().',
    referenceCode: P2_S5_CODE,
    referenceFiles: {
      [T2_P2_LOGIC_FILE]: P2_S5_LOGIC,
      [T2_P2_STORAGE_FILE]: P2_S5_STORAGE,
    },
    // Bộ chấm KHÔNG chạy quy_lop.py mà import thẳng hai module vai trò — cách duy nhất ép tách
    // file thật, vì code gộp một file vẫn in ra output y hệt (cùng lý do với milestone P2 T1).
    probeCode: `from tinh_quy import chua_dong, doc_so_tien
from luu_so import mo_so_moi, ghi_giao_dich, doc_so

so = {"an": 50000, "binh": 0, "hoa": 20000, "minh": 0}
print("Chua dong: " + ", ".join(chua_dong(so)))
print(f"So tien: {doc_so_tien('30000')} {doc_so_tien('ba muoi')} {doc_so_tien('-5')}")

mo_so_moi()
ghi_giao_dich("thu", "an", 50000)
ghi_giao_dich("thu", "hoa", 50000)
ghi_giao_dich("chi", "photo", 30000)
ghi_giao_dich("chi", "photo", 10000)
thu, chi, theo = doc_so()
print(f"So: thu {thu} chi {chi} du {thu - chi}")
print(f"Photo: {theo.get('photo', 0)}")

mo_so_moi()
thu, chi, theo = doc_so()
print(f"So moi: {thu} {chi} {len(theo)}")`,
    checks: [
      tc([], 'Chua dong: binh, minh', 'tinh_quy.chua_dong gọi được từ ngoài và đúng thứ tự'),
      tc([], 'So tien: 30000 None None', 'doc_so_tien nhận số hợp lệ, trả None khi nhập bậy'),
      tc([], 'So: thu 100000 chi 40000 du 60000', 'luu_so ghi rồi đọc lại đúng tổng thu/chi'),
      tc([], 'Photo: 40000', 'doc_so gom đúng tiền theo hạng mục'),
      tc([], 'So moi: 0 0 0', 'Ca ẩn: mo_so_moi() phải XOÁ sổ cũ', true),
    ],
  },
]
export const T2_P5_PROJECT_STEPS: ProjectStep[] = []

/** Năm chặng của T2 — cùng nhịp tiến hoá với T1: console → nhiều file + lưu tệp → web →
 *  lõi có class/test/API → chạy thật trên Internet. */
export const T2_PROJECT_STAGES: ProjectStage[] = [
  { level: 'p1', title: 'Chặng P1 — Sổ thu chi chạy chữ', steps: T2_P1_PROJECT_STEPS },
  { level: 'p2', title: 'Chặng P2 — Sổ quỹ không mất', steps: T2_P2_PROJECT_STEPS },
  { level: 'p3', title: 'Chặng P3 — Trang minh bạch quỹ', steps: T2_P3_PROJECT_STEPS },
  { level: 'p4', title: 'Chặng P4 — Lõi quỹ có test và API', steps: T2_P4_PROJECT_STEPS },
  { level: 'p5', title: 'Chặng P5 — Quỹ lên Internet', steps: T2_P5_PROJECT_STEPS },
]
