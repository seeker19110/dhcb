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

export const T2_P2_PROJECT_STEPS: ProjectStep[] = []
export const T2_P3_PROJECT_STEPS: ProjectStep[] = []
export const T2_P4_PROJECT_STEPS: ProjectStep[] = []
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
