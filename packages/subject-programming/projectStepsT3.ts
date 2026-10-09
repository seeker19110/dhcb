// projectStepsT3 — DỰ ÁN TRỤC T3 "Sổ học tập của tôi": chặng P1 + P2 và bảng năm chặng.
// Đặc tả hạ tầng: docs/specs/2026-10-09-du-an-truc-t2-t3-ha-tang.md (mục "Hợp đồng cho PR nội
// dung"). Bối cảnh dự án: docs/research/mon-lap-trinh.md §2.2 — môn · nhiệm vụ/deadline · điểm ·
// thẻ ôn · trang chia sẻ tài liệu; đồng hình kỹ thuật với T1 (CRUD + báo cáo + trang public).
//
// Học viên (học sinh – sinh viên) xây MỘT cuốn sổ học tập lớn dần: P1 tính điểm trung bình có
// trọng số chạy chữ · P2 sổ điểm theo môn ghi ra file · P3 trang chia sẻ tài liệu + thẻ ôn +
// báo cáo SQL · P4 lõi class có test và API bài tập/điểm · P5 lên Internet (projectStepsT3P3/4/5).
//
// LUẬT ĐIỂM CỦA DỰ ÁN (giữ nguyên xuyên chặng, để dự án là MỘT dòng chảy chứ không phải 5 đề rời):
//   ĐTB môn = (thường xuyên × 1 + giữa kỳ × 2 + cuối kỳ × 3) / 6, làm tròn 1 chữ số thập phân.
//   Xếp loại theo ĐTB ĐÃ LÀM TRÒN: ≥ 8.0 Tot · ≥ 6.5 Kha · ≥ 5.0 Dat · dưới đó Chua dat.
// Đây là cách tính quen thuộc ở trường phổ thông Việt Nam (điểm giữa kỳ hệ số 2, cuối kỳ hệ số 3)
// — học viên tự nhẩm lại được bằng điểm của chính mình.
//
// Mọi dòng chấm điểm in KHÔNG DẤU (so chuỗi khỏi lệch dấu tiếng Việt) như T1. Bước sau GIỮ
// nguyên các dòng in của bước trước trong cùng chặng.
//
// LUẬT CHO PR NỘI DUNG (test `projectTracks.test.ts` canh):
//  - Mã bước `t3-p<n>-s<k>` (k đếm từ 1, liên tục trong chặng); `unitId` cùng bậc với chặng.
//  - MỌI bước phải khai `files` (phần tử đầu = file chạy chính).
//  - Bước cuối mỗi chặng có `isMilestone: true`, các bước khác false.
//  - Chỉ import KIỂU từ projectStepTypes.ts (không import projectSteps.ts — chu trình import).
import { TestCaseSchema, type ProgrammingTestCase } from './lessonTypes.js'
import type { ProjectStage, ProjectStep } from './projectStepTypes.js'
import { T3_P3_PROJECT_STEPS } from './projectStepsT3P3.js'
import { T3_P4_PROJECT_STEPS } from './projectStepsT3P4.js'
import { T3_P5_PROJECT_STEPS } from './projectStepsT3P5.js'

export { T3_P3_PROJECT_STEPS } from './projectStepsT3P3.js'
export { T3_P4_PROJECT_STEPS } from './projectStepsT3P4.js'
export { T3_P5_PROJECT_STEPS } from './projectStepsT3P5.js'

/** File làm việc chính của T3 từ chặng P1 (lưu ở server dưới tên `t3--so_hoc_tap.py`). */
export const T3_PROJECT_MAIN_FILE = 'so_hoc_tap.py'

/** Code khởi đầu khi mở T3 lần đầu. */
export const T3_PROJECT_STARTER_CODE = `# so_hoc_tap.py — Sổ học tập của tôi (dự án xuyên suốt, chặng P1)
# Bạn sẽ xây file này lớn dần qua từng bước. Bắt đầu từ bước 1 nhé!
`

const tc = (
  stdinLines: string[],
  expected: string,
  label: string,
  hidden = false,
): ProgrammingTestCase => TestCaseSchema.parse({ stdinLines, expected, label, hidden })

const F1 = [T3_PROJECT_MAIN_FILE]

// ─────────────────────────────────────────────────────────────────────────────
// CHẶNG P1 — "Sổ điểm chạy chữ" (console, một file so_hoc_tap.py).
// Hợp đồng in chung: "So hoc tap cua <ten>" · bảng hệ số 3 dòng · "DTB <mon>: <dtb>" ·
// "Xep loai: <loai>" · cuối phiên "So mon dat: <k>/<n>" (+ mục tiêu ở milestone).

export const T3_P1_PROJECT_STEPS: ProjectStep[] = [
  {
    id: 't3-p1-s1',
    isMilestone: false,
    files: F1,
    title: 'Mở sổ — chào theo tên và in bảng hệ số điểm',
    unitId: 'p1-u2',
    requirement:
      'Cuốn sổ học tập của bạn bắt đầu từ đây. Chương trình hỏi tên học sinh bằng input(), rồi in dòng "So hoc tap cua <ten>" và in bảng hệ số của ba loại điểm (mỗi loại một dòng, không dấu):\nThuong xuyen - he so 1\nGiua ky - he so 2\nCuoi ky - he so 3\n\nĐây đúng là cách trường phổ thông tính điểm môn: bài cuối kỳ "nặng" gấp ba bài thường xuyên.',
    hint: 'Dùng input() lấy tên vào một biến, f-string để ghép "So hoc tap cua {ten}", rồi ba lệnh print cho ba dòng hệ số.',
    referenceCode: `ten = input("Ten hoc sinh: ")
print(f"So hoc tap cua {ten}")
print("Thuong xuyen - he so 1")
print("Giua ky - he so 2")
print("Cuoi ky - he so 3")`,
    checks: [
      tc(['Lan'], 'So hoc tap cua Lan', 'Chào đúng tên học sinh nhập vào'),
      tc(['Lan'], 'Cuoi ky - he so 3', 'Bảng hệ số có đủ ba loại điểm'),
      tc(['Minh'], 'So hoc tap cua Minh', 'Ca ẩn: đổi tên khác vẫn đúng (không gõ cứng)', true),
    ],
  },
  {
    id: 't3-p1-s2',
    isMilestone: false,
    files: F1,
    title: 'Nhập ba con điểm → tính điểm trung bình có trọng số',
    unitId: 'p1-u3',
    requirement:
      'Giữ nguyên phần chào + bảng hệ số của bước 1, hỏi tiếp: tên môn, rồi lần lượt điểm thường xuyên, điểm giữa kỳ, điểm cuối kỳ (điểm có thể lẻ như 7.5).\n\nTính điểm trung bình môn theo hệ số:\nDTB = (thuong xuyen × 1 + giua ky × 2 + cuoi ky × 3) / 6\nlàm tròn 1 chữ số thập phân bằng round(..., 1), rồi in dòng "DTB <mon>: <dtb>".\n\nVí dụ: 8, 7, 9 → (8 + 14 + 27) / 6 = 8.1666… → in "DTB Toan: 8.2".',
    hint: 'Điểm có phần lẻ nên đọc bằng float(input(...)), không phải int(). Nhớ ngoặc: (tx + 2 * gk + 3 * ck) / 6 — thiếu ngoặc thì chỉ ck bị chia cho 6.',
    referenceCode: `ten = input("Ten hoc sinh: ")
print(f"So hoc tap cua {ten}")
print("Thuong xuyen - he so 1")
print("Giua ky - he so 2")
print("Cuoi ky - he so 3")

mon = input("Ten mon: ")
tx = float(input("Diem thuong xuyen: "))
gk = float(input("Diem giua ky: "))
ck = float(input("Diem cuoi ky: "))
dtb = round((tx + 2 * gk + 3 * ck) / 6, 1)
print(f"DTB {mon}: {dtb}")`,
    checks: [
      tc(['Lan', 'Toan', '8', '7', '9'], 'DTB Toan: 8.2', 'Toán 8 · 7 · 9 → 49/6 ≈ 8.2'),
      tc(['Lan', 'Van', '6', '7.5', '7'], 'DTB Van: 7.0', 'Điểm lẻ 7.5 vẫn đọc được'),
      tc(['Lan', 'Anh', '9', '8.5', '6'], 'DTB Anh: 7.3', 'Ca ẩn: môn khác, bộ điểm khác', true),
    ],
  },
  {
    id: 't3-p1-s3',
    isMilestone: false,
    files: F1,
    title: 'Xếp loại học lực theo bậc điểm',
    unitId: 'p1-u4',
    requirement:
      'Sau dòng "DTB <mon>: <dtb>", in thêm "Xep loai: <loai>" theo bậc:\n- DTB từ 8.0 trở lên → Tot\n- từ 6.5 → Kha\n- từ 5.0 → Dat\n- dưới 5.0 → Chua dat\n\nXếp loại dựa trên DTB ĐÃ LÀM TRÒN (đúng cách nhà trường làm: điểm in trên học bạ thế nào thì xếp loại theo đúng con số đó).',
    hint: 'Kiểm bậc CAO trước: if dtb >= 8.0 → Tot, elif dtb >= 6.5 → Kha, elif dtb >= 5.0 → Dat, else Chua dat. Dùng >= chứ không phải > — đúng 6.5 là Khá.',
    referenceCode: `ten = input("Ten hoc sinh: ")
print(f"So hoc tap cua {ten}")
print("Thuong xuyen - he so 1")
print("Giua ky - he so 2")
print("Cuoi ky - he so 3")

mon = input("Ten mon: ")
tx = float(input("Diem thuong xuyen: "))
gk = float(input("Diem giua ky: "))
ck = float(input("Diem cuoi ky: "))
dtb = round((tx + 2 * gk + 3 * ck) / 6, 1)
print(f"DTB {mon}: {dtb}")

if dtb >= 8.0:
    loai = "Tot"
elif dtb >= 6.5:
    loai = "Kha"
elif dtb >= 5.0:
    loai = "Dat"
else:
    loai = "Chua dat"
print(f"Xep loai: {loai}")`,
    checks: [
      tc(['Lan', 'Toan', '8', '7', '9'], 'Xep loai: Tot', 'ĐTB 8.2 → Tốt'),
      tc(['Lan', 'Su', '4', '5', '5'], 'Xep loai: Chua dat', 'ĐTB 4.8 → Chưa đạt'),
      tc(['Lan', 'Dia', '5', '5', '5'], 'Xep loai: Dat', 'Đúng 5.0 là Đạt'),
      tc(['Lan', 'Toan', '8', '7', '9'], 'DTB Toan: 8.2', 'Vẫn giữ dòng DTB của bước 2'),
      // Ca biên RANH GIỚI bậc — đúng chỗ người mới hay viết > thay cho >=.
      tc(['Lan', 'Van', '6.5', '6.5', '6.5'], 'Xep loai: Kha', 'Ca ẩn: đúng 6.5 là Khá', true),
      // ĐTB thật 7.97 nhưng in ra 8.0 → phải xếp theo con số đã làm tròn.
      tc(
        ['Lan', 'Anh', '7.8', '8', '8'],
        'Xep loai: Tot',
        'Ca ẩn: xếp loại theo điểm ĐÃ làm tròn (7.97 → 8.0)',
        true,
      ),
    ],
  },
  {
    id: 't3-p1-s4',
    isMilestone: false,
    files: F1,
    title: 'Cả học kỳ — lặp qua nhiều môn, đếm môn đạt',
    unitId: 'p1-u7',
    requirement:
      'Đổi luồng: sau phần chào + bảng hệ số, hỏi "So mon" rồi LẶP: mỗi môn hỏi tên môn và ba con điểm, in "DTB <mon>: <dtb>" và "Xep loai: <loai>" như bước 3.\n\nKết thúc in "So mon dat: <k>/<n>" — k là số môn có DTB từ 5.0 trở lên, n là tổng số môn.',
    hint: 'Dùng for _ in range(so_mon): và một biến so_mon_dat = 0 đặt TRƯỚC vòng lặp; trong vòng lặp, if dtb >= 5.0 thì cộng thêm 1.',
    referenceCode: `ten = input("Ten hoc sinh: ")
print(f"So hoc tap cua {ten}")
print("Thuong xuyen - he so 1")
print("Giua ky - he so 2")
print("Cuoi ky - he so 3")

so_mon = int(input("So mon: "))
so_mon_dat = 0
for _ in range(so_mon):
    mon = input("Ten mon: ")
    tx = float(input("Diem thuong xuyen: "))
    gk = float(input("Diem giua ky: "))
    ck = float(input("Diem cuoi ky: "))
    dtb = round((tx + 2 * gk + 3 * ck) / 6, 1)
    print(f"DTB {mon}: {dtb}")
    if dtb >= 8.0:
        loai = "Tot"
    elif dtb >= 6.5:
        loai = "Kha"
    elif dtb >= 5.0:
        loai = "Dat"
    else:
        loai = "Chua dat"
    print(f"Xep loai: {loai}")
    if dtb >= 5.0:
        so_mon_dat = so_mon_dat + 1
print(f"So mon dat: {so_mon_dat}/{so_mon}")`,
    checks: [
      tc(
        ['Lan', '2', 'Toan', '8', '7', '9', 'Su', '4', '5', '5'],
        'So mon dat: 1/2',
        'Hai môn: Toán đạt, Sử chưa đạt',
      ),
      tc(
        ['Lan', '2', 'Toan', '8', '7', '9', 'Su', '4', '5', '5'],
        'DTB Su: 4.8',
        'Mỗi môn vẫn in ĐTB riêng',
      ),
      tc(['Lan', '1', 'Dia', '5', '5', '5'], 'So mon dat: 1/1', 'Đúng 5.0 vẫn tính là đạt'),
      tc(['Lan', '0'], 'So mon dat: 0/0', 'Ca ẩn: 0 môn — vòng lặp không chạy', true),
    ],
  },
  {
    id: 't3-p1-s5',
    isMilestone: true,
    files: F1,
    title: 'Milestone P1 — đặt mục tiêu cho từng môn',
    unitId: 'p1-u10',
    requirement:
      'Hoàn thiện sổ điểm: trong mỗi môn, sau dòng "Xep loai", hỏi thêm điểm mục tiêu của môn đó.\n- DTB đạt mục tiêu (lớn hơn HOẶC BẰNG) → in "Dat muc tieu" và đếm.\n- Chưa đạt → in "Con thieu <so diem> diem", với số điểm = mục tiêu − DTB, làm tròn 1 chữ số.\n\nCuối vẫn in "So mon dat: <k>/<n>", rồi in thêm "So mon dat muc tieu: <m>/<n>".',
    hint: 'So sánh dtb (đã làm tròn) với muc_tieu. Phép trừ số thực có thể ra 0.8000000000000007 — bọc round(muc_tieu - dtb, 1) để in gọn.',
    referenceCode: `ten = input("Ten hoc sinh: ")
print(f"So hoc tap cua {ten}")
print("Thuong xuyen - he so 1")
print("Giua ky - he so 2")
print("Cuoi ky - he so 3")

so_mon = int(input("So mon: "))
so_mon_dat = 0
so_dat_muc_tieu = 0
for _ in range(so_mon):
    mon = input("Ten mon: ")
    tx = float(input("Diem thuong xuyen: "))
    gk = float(input("Diem giua ky: "))
    ck = float(input("Diem cuoi ky: "))
    dtb = round((tx + 2 * gk + 3 * ck) / 6, 1)
    print(f"DTB {mon}: {dtb}")
    if dtb >= 8.0:
        loai = "Tot"
    elif dtb >= 6.5:
        loai = "Kha"
    elif dtb >= 5.0:
        loai = "Dat"
    else:
        loai = "Chua dat"
    print(f"Xep loai: {loai}")
    if dtb >= 5.0:
        so_mon_dat = so_mon_dat + 1
    muc_tieu = float(input("Muc tieu: "))
    if dtb >= muc_tieu:
        print("Dat muc tieu")
        so_dat_muc_tieu = so_dat_muc_tieu + 1
    else:
        print(f"Con thieu {round(muc_tieu - dtb, 1)} diem")
print(f"So mon dat: {so_mon_dat}/{so_mon}")
print(f"So mon dat muc tieu: {so_dat_muc_tieu}/{so_mon}")`,
    checks: [
      tc(['Lan', '1', 'Toan', '8', '7', '9', '8'], 'Dat muc tieu', 'ĐTB 8.2, mục tiêu 8 → đạt'),
      tc(
        ['Lan', '1', 'Van', '6', '7.5', '7', '8'],
        'Con thieu 1.0 diem',
        'ĐTB 7.0, mục tiêu 8 → còn thiếu 1.0',
      ),
      tc(
        ['Lan', '2', 'Toan', '8', '7', '9', '9', 'Van', '6', '7.5', '7', '6.5'],
        'So mon dat muc tieu: 1/2',
        'Đếm đúng số môn đạt mục tiêu',
      ),
      tc(
        ['Lan', '2', 'Toan', '8', '7', '9', '9', 'Van', '6', '7.5', '7', '6.5'],
        'So mon dat: 2/2',
        'Vẫn giữ dòng đếm môn đạt của bước 4',
      ),
      tc(
        ['Lan', '1', 'Toan', '8', '7', '9', '8.2'],
        'Dat muc tieu',
        'Ca ẩn: vừa đúng bằng mục tiêu — ranh giới >=',
        true,
      ),
      tc(
        ['Lan', '1', 'Toan', '8', '7', '9', '9'],
        'Con thieu 0.8 diem',
        'Ca ẩn: số điểm còn thiếu được làm tròn gọn',
        true,
      ),
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// CHẶNG P2 — "Sổ môn học không mất" (hàm, dict, file CSV, try/except, chia nhiều file).
//
// Sổ điểm tiến hoá từ máy tính một lần chạy thành SỔ THEO MÔN: môn là dict (môn → hệ số môn),
// điểm ghi ra CSV nên tắt máy không mất, nhập bậy không sập, cuối chặng tách 3 file đúng vai trò.
//
// Hợp đồng I/O chung của cả chặng (giữ nguyên qua các bước, mỗi bước THÊM khả năng):
//   input  : "Ten hoc sinh" → rồi lặp lệnh: tên môn để ghi điểm · "them" thêm môn · "xong"
//   output : "So hoc tap cua <ten>" · mỗi môn "<mon> - he so <hs>" · mỗi lần ghi
//            "Da ghi <mon>: <diem>" · kết phiên "So mon co diem: <n>" và "DTB co trong so: <x>"
// ĐTB có trọng số = Σ(điểm môn × hệ số môn) / Σ(hệ số môn) — cách tính điểm xét tuyển quen thuộc
// (môn chính nhân đôi). Ghi lại điểm một môn thì điểm MỚI thay điểm cũ (sửa điểm, không cộng dồn).

/** File làm việc của chặng P2 khi tách vai trò ở bước cuối. */
export const T3_P2_LOGIC_FILE = 'tinh_diem.py'
export const T3_P2_STORAGE_FILE = 'luu_tru.py'

export const T3_P2_PROJECT_STEPS: ProjectStep[] = [
  {
    id: 't3-p2-s1',
    isMilestone: false,
    files: F1,
    title: 'Sổ theo môn — hệ số môn là dict, ĐTB tính bằng hàm',
    unitId: 'p2-u1',
    requirement:
      'Nâng cấp sổ điểm P1 thành sổ ghi điểm theo MÔN.\n\nHE_SO là dict hệ số từng môn: {"toan": 2, "van": 2, "anh": 1} (môn chính nhân đôi, như điểm xét tuyển).\n\nLuồng chương trình:\n1. Hỏi tên học sinh → in "So hoc tap cua <ten>", rồi in mỗi môn MỘT DÒNG dạng "<mon> - he so <hs>" (đúng thứ tự trong HE_SO).\n2. Lặp: hỏi tên môn.\n   - Gõ "xong" → kết thúc phiên.\n   - Môn có trong HE_SO (bỏ khoảng trắng thừa, không phân biệt hoa/thường) → hỏi điểm (số thực), lưu vào dict DIEM[mon] = diem (ghi lại thì điểm mới THAY điểm cũ), in "Da ghi <mon>: <diem>".\n   - Môn lạ → in "Khong co mon nay", KHÔNG hỏi điểm.\n3. Kết phiên in 2 dòng: "So mon co diem: <n>" rồi "DTB co trong so: <x>".\n\nBẮT BUỘC có hàm tinh_dtb(diem) nhận dict môn → điểm, trả về Σ(điểm × hệ số) / Σ(hệ số) làm tròn 1 chữ số (không print bên trong). Chưa có môn nào thì trả về 0.0 — đừng để chia cho 0 làm sập chương trình.',
    hint: 'Trong tinh_dtb: hai biến tong và tong_he_so bắt đầu từ 0, duyệt for mon, d in diem.items() rồi cộng d * HE_SO[mon] vào tong và HE_SO[mon] vào tong_he_so. Trước khi chia, kiểm tong_he_so == 0 thì return 0.0.',
    referenceCode: `HE_SO = {"toan": 2, "van": 2, "anh": 1}


def tinh_dtb(diem):
    tong = 0
    tong_he_so = 0
    for mon, d in diem.items():
        tong = tong + d * HE_SO[mon]
        tong_he_so = tong_he_so + HE_SO[mon]
    if tong_he_so == 0:
        return 0.0
    return round(tong / tong_he_so, 1)


ten = input("Ten hoc sinh: ")
print(f"So hoc tap cua {ten}")
for mon, he_so in HE_SO.items():
    print(f"{mon} - he so {he_so}")

DIEM = {}
while True:
    mon = input("Mon (xong de ket thuc): ").strip().lower()
    if mon == "xong":
        break
    if mon not in HE_SO:
        print("Khong co mon nay")
        continue
    d = float(input("Diem: "))
    DIEM[mon] = d
    print(f"Da ghi {mon}: {d}")

print(f"So mon co diem: {len(DIEM)}")
print(f"DTB co trong so: {tinh_dtb(DIEM)}")`,
    checks: [
      tc(
        ['Lan', 'toan', '8', 'anh', '6.5', 'xong'],
        'DTB co trong so: 7.5',
        'Toán 8 (hệ số 2) + Anh 6.5 (hệ số 1) → 22.5/3 = 7.5',
      ),
      tc(['Lan', 'toan', '8', 'xong'], 'Da ghi toan: 8.0', 'Mỗi lần ghi in xác nhận'),
      tc(['Lan', 'hoa', 'xong'], 'Khong co mon nay', 'Môn lạ: báo và KHÔNG hỏi điểm'),
      tc(
        ['Lan', 'van', '7', 'van', '9', 'xong'],
        'So mon co diem: 1',
        'Ghi lại một môn thì sửa điểm, không thêm môn',
      ),
      tc(['Lan', 'xong'], 'DTB co trong so: 0.0', 'Ca ẩn: chưa có điểm — không chia cho 0', true),
      tc(
        ['Lan', '  Toan ', '9', 'xong'],
        'DTB co trong so: 9.0',
        'Ca ẩn: tên môn gõ hoa/thừa khoảng trắng vẫn nhận',
        true,
      ),
    ],
  },
  {
    id: 't3-p2-s2',
    isMilestone: false,
    files: F1,
    title: 'Thêm môn ngay lúc đang ghi — dict sửa được khi chạy',
    unitId: 'p2-u4',
    requirement:
      'Giữ nguyên mọi hành vi bước 1, thêm MỘT lệnh mới trong vòng lặp:\n\nGõ "them" → hỏi "Ten mon moi:" rồi "He so:" (số nguyên) → thêm vào HE_SO và in "Da them <mon> - he so <hs>".\n\nMôn vừa thêm phải ghi điểm được ngay ở các vòng sau, và được tính vào DTB co trong so với đúng hệ số vừa khai.',
    hint: 'Thêm nhánh if mon == "them": TRƯỚC phần kiểm môn lạ. Thêm vào dict bằng HE_SO[mon_moi] = he_so_moi rồi continue để quay lại đầu vòng lặp.',
    referenceCode: `HE_SO = {"toan": 2, "van": 2, "anh": 1}


def tinh_dtb(diem):
    tong = 0
    tong_he_so = 0
    for mon, d in diem.items():
        tong = tong + d * HE_SO[mon]
        tong_he_so = tong_he_so + HE_SO[mon]
    if tong_he_so == 0:
        return 0.0
    return round(tong / tong_he_so, 1)


ten = input("Ten hoc sinh: ")
print(f"So hoc tap cua {ten}")
for mon, he_so in HE_SO.items():
    print(f"{mon} - he so {he_so}")

DIEM = {}
while True:
    mon = input("Mon (them/xong): ").strip().lower()
    if mon == "xong":
        break
    if mon == "them":
        mon_moi = input("Ten mon moi: ").strip().lower()
        he_so_moi = int(input("He so: "))
        HE_SO[mon_moi] = he_so_moi
        print(f"Da them {mon_moi} - he so {he_so_moi}")
        continue
    if mon not in HE_SO:
        print("Khong co mon nay")
        continue
    d = float(input("Diem: "))
    DIEM[mon] = d
    print(f"Da ghi {mon}: {d}")

print(f"So mon co diem: {len(DIEM)}")
print(f"DTB co trong so: {tinh_dtb(DIEM)}")`,
    checks: [
      tc(['Lan', 'them', 'tin', '1', 'xong'], 'Da them tin - he so 1', 'Thêm môn mới vào sổ'),
      tc(
        ['Lan', 'them', 'ly', '2', 'ly', '6', 'toan', '9', 'xong'],
        'DTB co trong so: 7.5',
        'Môn vừa thêm GHI ĐIỂM ĐƯỢC NGAY, tính đúng hệ số (12 + 18) / 4',
      ),
      tc(
        ['Lan', 'toan', '8', 'anh', '6.5', 'xong'],
        'DTB co trong so: 7.5',
        'Hành vi bước 1 không được vỡ',
      ),
      tc(
        ['Lan', 'them', 'tin', '1', 'xong'],
        'So mon co diem: 0',
        'Ca ẩn: lệnh "them" KHÔNG phải một lần ghi điểm',
        true,
      ),
    ],
  },
  {
    id: 't3-p2-s3',
    isMilestone: false,
    files: F1,
    title: 'Sổ không mất — ghi điểm ra CSV rồi đọc lại để tổng kết',
    unitId: 'p2-u6',
    requirement:
      'Giữ nguyên hành vi bước 2, thêm phần LƯU TRỮ:\n\n1. Ngay đầu phiên, mở file "diem.csv" bằng chế độ "w" để bắt đầu SỔ MỚI (chạy lại không cộng dồn nhầm sổ phiên trước).\n2. Mỗi lần ghi điểm thành công, ghi THÊM một dòng dạng: <mon>,<diem>\n3. Kết phiên, ĐỌC LẠI chính file đó vào một dict môn → điểm rồi mới in "So mon co diem" và "DTB co trong so". Môn nào xuất hiện nhiều dòng thì dòng SAU ghi đè dòng trước (đúng nghĩa "sửa điểm").\n\nHai con số tổng kết phải tính từ FILE, không phải từ dict trong bộ nhớ.',
    hint: 'Đầu chương trình: open("diem.csv", "w", encoding="utf-8").close(). Mỗi lần ghi mở lại bằng "a" và f.write(f"{mon},{d}\\n"). Cuối phiên mở "r", mỗi dòng .strip().split(",") rồi diem[mon] = float(d) — gán vào dict nên dòng sau tự ghi đè dòng trước.',
    referenceCode: `HE_SO = {"toan": 2, "van": 2, "anh": 1}
SO_FILE = "diem.csv"


def tinh_dtb(diem):
    tong = 0
    tong_he_so = 0
    for mon, d in diem.items():
        tong = tong + d * HE_SO[mon]
        tong_he_so = tong_he_so + HE_SO[mon]
    if tong_he_so == 0:
        return 0.0
    return round(tong / tong_he_so, 1)


def ghi_diem(mon, d):
    with open(SO_FILE, "a", encoding="utf-8") as f:
        f.write(f"{mon},{d}\\n")


def doc_so():
    diem = {}
    with open(SO_FILE, "r", encoding="utf-8") as f:
        for dong in f:
            dong = dong.strip()
            if dong == "":
                continue
            mon, d = dong.split(",")
            diem[mon] = float(d)
    return diem


open(SO_FILE, "w", encoding="utf-8").close()

ten = input("Ten hoc sinh: ")
print(f"So hoc tap cua {ten}")
for mon, he_so in HE_SO.items():
    print(f"{mon} - he so {he_so}")

while True:
    mon = input("Mon (them/xong): ").strip().lower()
    if mon == "xong":
        break
    if mon == "them":
        mon_moi = input("Ten mon moi: ").strip().lower()
        he_so_moi = int(input("He so: "))
        HE_SO[mon_moi] = he_so_moi
        print(f"Da them {mon_moi} - he so {he_so_moi}")
        continue
    if mon not in HE_SO:
        print("Khong co mon nay")
        continue
    d = float(input("Diem: "))
    print(f"Da ghi {mon}: {d}")
    ghi_diem(mon, d)

diem = doc_so()
print(f"So mon co diem: {len(diem)}")
print(f"DTB co trong so: {tinh_dtb(diem)}")`,
    checks: [
      tc(
        ['Lan', 'toan', '8', 'van', '7', 'toan', '9', 'xong'],
        'DTB co trong so: 8.0',
        'Đọc lại từ file: Toán 9 ghi đè Toán 8 → (18 + 14) / 4 = 8.0',
      ),
      tc(
        ['Lan', 'toan', '8', 'van', '7', 'toan', '9', 'xong'],
        'So mon co diem: 2',
        'Ba dòng trong sổ nhưng chỉ hai môn',
      ),
      tc(['Lan', 'xong'], 'DTB co trong so: 0.0', 'Phiên rỗng: sổ mới phải trống'),
      tc(
        ['Lan', 'anh', '5', 'xong'],
        'So mon co diem: 1',
        'Ca ẩn: chạy lại KHÔNG cộng dồn sổ phiên trước (mở "w" đầu phiên)',
        true,
      ),
    ],
  },
  {
    id: 't3-p2-s4',
    isMilestone: false,
    files: F1,
    title: 'Sổ không thể sập — chặn điểm nhập bậy',
    unitId: 'p2-u7',
    requirement:
      'Giữ nguyên hành vi bước 3, thêm lớp chống nhập bậy:\n\n- Điểm không phải số → in "Du lieu khong hop le", KHÔNG ghi, phiên VẪN TIẾP TỤC.\n- Điểm là số nhưng nằm ngoài thang 0 đến 10 → in "Diem phai tu 0 den 10", KHÔNG ghi. (Đúng 0 và đúng 10 là hợp lệ.)\n- Hệ số môn mới (lệnh "them") không phải số nguyên → in "Du lieu khong hop le" và KHÔNG thêm môn.\n\nChương trình tuyệt đối không được văng traceback.',
    hint: 'Bọc float(...) và int(...) trong try/except ValueError, phần except in báo lỗi rồi continue. Kiểm thang điểm bằng if not 0 <= d <= 10: — viết kiểu "không nằm trong khoảng" chặn được cả những giá trị lạ như nan.',
    referenceCode: `HE_SO = {"toan": 2, "van": 2, "anh": 1}
SO_FILE = "diem.csv"


def tinh_dtb(diem):
    tong = 0
    tong_he_so = 0
    for mon, d in diem.items():
        tong = tong + d * HE_SO[mon]
        tong_he_so = tong_he_so + HE_SO[mon]
    if tong_he_so == 0:
        return 0.0
    return round(tong / tong_he_so, 1)


def ghi_diem(mon, d):
    with open(SO_FILE, "a", encoding="utf-8") as f:
        f.write(f"{mon},{d}\\n")


def doc_so():
    diem = {}
    with open(SO_FILE, "r", encoding="utf-8") as f:
        for dong in f:
            dong = dong.strip()
            if dong == "":
                continue
            mon, d = dong.split(",")
            diem[mon] = float(d)
    return diem


open(SO_FILE, "w", encoding="utf-8").close()

ten = input("Ten hoc sinh: ")
print(f"So hoc tap cua {ten}")
for mon, he_so in HE_SO.items():
    print(f"{mon} - he so {he_so}")

while True:
    mon = input("Mon (them/xong): ").strip().lower()
    if mon == "xong":
        break
    if mon == "them":
        mon_moi = input("Ten mon moi: ").strip().lower()
        tho_he_so = input("He so: ")
        try:
            he_so_moi = int(tho_he_so)
        except ValueError:
            print("Du lieu khong hop le")
            continue
        HE_SO[mon_moi] = he_so_moi
        print(f"Da them {mon_moi} - he so {he_so_moi}")
        continue
    if mon not in HE_SO:
        print("Khong co mon nay")
        continue
    tho = input("Diem: ")
    try:
        d = float(tho)
    except ValueError:
        print("Du lieu khong hop le")
        continue
    if not 0 <= d <= 10:
        print("Diem phai tu 0 den 10")
        continue
    print(f"Da ghi {mon}: {d}")
    ghi_diem(mon, d)

diem = doc_so()
print(f"So mon co diem: {len(diem)}")
print(f"DTB co trong so: {tinh_dtb(diem)}")`,
    checks: [
      tc(
        ['Lan', 'toan', 'tam', 'xong'],
        'Du lieu khong hop le',
        'Điểm gõ chữ — báo lỗi, không sập',
      ),
      tc(
        ['Lan', 'toan', '11', 'toan', '9', 'xong'],
        'Diem phai tu 0 den 10',
        'Điểm ngoài thang 0–10 bị chặn',
      ),
      tc(
        ['Lan', 'toan', '11', 'toan', '9', 'xong'],
        'DTB co trong so: 9.0',
        'Sau lần nhập hỏng, phiên vẫn chạy tiếp bình thường',
      ),
      tc(
        ['Lan', 'them', 'tin', 'mot', 'xong'],
        'Du lieu khong hop le',
        'Hệ số môn mới gõ chữ cũng phải chặn',
      ),
      tc(['Lan', 'toan', '10', 'xong'], 'Da ghi toan: 10.0', 'Ca ẩn: đúng 10 điểm là hợp lệ', true),
      tc(
        ['Lan', 'toan', 'tam', 'van', '-1', 'xong'],
        'So mon co diem: 0',
        'Ca ẩn: điểm hỏng KHÔNG được ghi vào sổ',
        true,
      ),
    ],
  },
  {
    id: 't3-p2-s5',
    isMilestone: true,
    title: 'Milestone P2 — tách 3 file đúng vai trò',
    unitId: 'p2-u9',
    requirement:
      'Bước cuối chặng: tách chương trình thành BA file đúng vai trò, hành vi giữ nguyên như bước 4.\n\n- tinh_diem.py: HE_SO và hàm tinh_dtb(diem) — chỉ tính, KHÔNG input/print. Môn không có trong HE_SO thì bỏ qua (hệ số 0), không làm vỡ hàm.\n- luu_tru.py: hằng SO_FILE và ba hàm mo_so_moi(), ghi_diem(mon, diem), doc_so() → trả về dict môn → điểm (số thực), dòng sau ghi đè dòng trước.\n- so_hoc_tap.py: phần giao diện + hàm main(), import hai file kia rồi gọi main().\n\nBộ chấm sẽ import THẲNG tinh_diem.py và luu_tru.py để gọi hàm của bạn — gộp tất cả vào một file là không qua được bước này.',
    hint: 'Trong so_hoc_tap.py: from tinh_diem import HE_SO, tinh_dtb và from luu_tru import mo_so_moi, ghi_diem, doc_so. Lệnh "them" sửa thẳng dict HE_SO đã import — đó là CÙNG một dict với dict trong tinh_diem.py, nên tinh_dtb thấy ngay môn mới. Dùng HE_SO.get(mon, 0) để môn lạ có hệ số 0.',
    files: [T3_PROJECT_MAIN_FILE, T3_P2_LOGIC_FILE, T3_P2_STORAGE_FILE],
    referenceCode: `from tinh_diem import HE_SO, tinh_dtb
from luu_tru import mo_so_moi, ghi_diem, doc_so


def main():
    mo_so_moi()

    ten = input("Ten hoc sinh: ")
    print(f"So hoc tap cua {ten}")
    for mon, he_so in HE_SO.items():
        print(f"{mon} - he so {he_so}")

    while True:
        mon = input("Mon (them/xong): ").strip().lower()
        if mon == "xong":
            break
        if mon == "them":
            mon_moi = input("Ten mon moi: ").strip().lower()
            tho_he_so = input("He so: ")
            try:
                he_so_moi = int(tho_he_so)
            except ValueError:
                print("Du lieu khong hop le")
                continue
            HE_SO[mon_moi] = he_so_moi
            print(f"Da them {mon_moi} - he so {he_so_moi}")
            continue
        if mon not in HE_SO:
            print("Khong co mon nay")
            continue
        tho = input("Diem: ")
        try:
            d = float(tho)
        except ValueError:
            print("Du lieu khong hop le")
            continue
        if not 0 <= d <= 10:
            print("Diem phai tu 0 den 10")
            continue
        print(f"Da ghi {mon}: {d}")
        ghi_diem(mon, d)

    diem = doc_so()
    print(f"So mon co diem: {len(diem)}")
    print(f"DTB co trong so: {tinh_dtb(diem)}")


main()`,
    referenceFiles: {
      'tinh_diem.py': `# tinh_diem.py — chỉ TÍNH, không input/print
HE_SO = {"toan": 2, "van": 2, "anh": 1}


def tinh_dtb(diem):
    tong = 0
    tong_he_so = 0
    for mon, d in diem.items():
        he_so = HE_SO.get(mon, 0)
        tong = tong + d * he_so
        tong_he_so = tong_he_so + he_so
    if tong_he_so == 0:
        return 0.0
    return round(tong / tong_he_so, 1)
`,
      'luu_tru.py': `# luu_tru.py — chỉ LƯU TRỮ, không input/print
SO_FILE = "diem.csv"


def mo_so_moi():
    open(SO_FILE, "w", encoding="utf-8").close()


def ghi_diem(mon, d):
    with open(SO_FILE, "a", encoding="utf-8") as f:
        f.write(f"{mon},{d}\\n")


def doc_so():
    diem = {}
    with open(SO_FILE, "r", encoding="utf-8") as f:
        for dong in f:
            dong = dong.strip()
            if dong == "":
                continue
            mon, d = dong.split(",")
            diem[mon] = float(d)
    return diem
`,
    },
    // Bộ chấm KHÔNG chạy so_hoc_tap.py mà import thẳng hai module vai trò — cách duy nhất ép
    // tách file thật, vì code gộp một file vẫn in ra output y hệt.
    probeCode: `from tinh_diem import tinh_dtb
from luu_tru import mo_so_moi, ghi_diem, doc_so

print(f"DTB mau: {tinh_dtb({'toan': 8.0, 'anh': 6.5})}")
print(f"Mon ngoai bang: {tinh_dtb({'toan': 8.0, 'hoa': 2.0})}")
print(f"DTB rong: {tinh_dtb({})}")

mo_so_moi()
ghi_diem("toan", 8.0)
ghi_diem("van", 7.0)
ghi_diem("toan", 9.0)
so = doc_so()
print(f"So mon: {len(so)}")
print(f"DTB so: {tinh_dtb(so)}")

mo_so_moi()
print(f"So moi: {len(doc_so())}")`,
    checks: [
      tc([], 'DTB mau: 7.5', 'tinh_diem.tinh_dtb gọi được từ ngoài và tính đúng hệ số'),
      tc([], 'DTB rong: 0.0', 'Sổ rỗng cho 0.0, không chia cho 0'),
      tc([], 'So mon: 2', 'luu_tru ghi rồi đọc lại đúng số môn'),
      tc([], 'DTB so: 8.0', 'Đọc lại từ sổ: dòng sau ghi đè dòng trước'),
      tc([], 'Mon ngoai bang: 8.0', 'Ca ẩn: môn ngoài bảng hệ số bị bỏ qua, không vỡ', true),
      tc([], 'So moi: 0', 'Ca ẩn: mo_so_moi() phải XOÁ sổ cũ', true),
    ],
  },
]

/** Năm chặng của T3 — cùng nhịp tiến hoá với T1. */
export const T3_PROJECT_STAGES: ProjectStage[] = [
  { level: 'p1', title: 'Chặng P1 — Sổ điểm chạy chữ', steps: T3_P1_PROJECT_STEPS },
  { level: 'p2', title: 'Chặng P2 — Sổ môn học không mất', steps: T3_P2_PROJECT_STEPS },
  { level: 'p3', title: 'Chặng P3 — Trang chia sẻ tài liệu', steps: T3_P3_PROJECT_STEPS },
  { level: 'p4', title: 'Chặng P4 — Lõi sổ học có test và API', steps: T3_P4_PROJECT_STEPS },
  { level: 'p5', title: 'Chặng P5 — Sổ học tập lên Internet', steps: T3_P5_PROJECT_STEPS },
]
