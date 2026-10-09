// P6-U292 — mathforcode-s4-m1,m2 (bổ sung 2026-10-09): gradient descent nhiều biến so sánh learning
// rate bằng bảng loss, và hàm không lồi (cực tiểu địa phương, điểm yên ngựa, cao nguyên).
// Bổ sung cho p6-u160 (một bước descent một biến, MSE/MAE) — không lặp lại hai topic đó.
// Đặc tả: docs/specs/2026-10-09-mathforcode-s3-s4-bo-sung-unit.md.
import type { ProgrammingLesson } from '../lessonTypes.js'

export const P6U292_LESSONS: ProgrammingLesson[] = [
  {
    id: 'p6-u292-l1',
    unitId: 'p6-u292',
    language: 'python',
    title: 'Gradient descent nhiều biến — bảng loss của ba learning rate',
    hook: 'Learning rate quá lớn có thể làm loss GIẢM ở vòng đầu rồi mới nổ tung ở vòng sau. Nhìn một con số cuối cùng không đủ, phải nhìn cả bảng loss từng vòng.',
    theory:
      'Với hàm nhiều biến, gradient là vector các đạo hàm riêng; mỗi vòng gradient descent cập nhật MỌI biến cùng lúc: w ← w − lr·∇f(w). Bài dùng hàm cố định f(w1, w2) = (w1 − 3)² + 5(w2 + 1)², cực tiểu tại (3, −1), gradient = (2(w1 − 3), 10(w2 + 1)). Hướng w2 cong gấp 5 lần hướng w1, nên learning rate an toàn bị hướng cong nhất quyết định: ở đây lr phải nhỏ hơn 0,2, nếu không w2 nhảy vọt qua cực tiểu, mỗi vòng xa hơn vòng trước. Ngược lại, lr quá nhỏ thì loss giảm đều nhưng rất chậm. Bảng loss từng vòng cho phép phân loại có hợp đồng: loss tăng ở bất kỳ vòng nào là phân kỳ (diverged), dừng ngay; loss cuối ≤ ngưỡng là hội tụ; còn lại là chậm. Đây là MÔ PHỎNG Python thuần trên một hàm bậc hai đã biết, không train model thật và không chứng minh learning rate nào là tốt nhất cho dữ liệu production.',
    workedExample: {
      code: `# f(w1, w2) = (w1 - 3)^2 + 5(w2 + 1)^2; gradient = (2(w1 - 3), 10(w2 + 1)).
w1, w2, lr = 0.0, 0.0, 0.15
for vong in range(1, 4):
    g1, g2 = 2 * (w1 - 3), 10 * (w2 + 1)
    # Cập nhật CẢ HAI biến cùng lúc bằng gradient của vòng hiện tại.
    w1, w2 = w1 - lr * g1, w2 - lr * g2
    loss = (w1 - 3) ** 2 + 5 * (w2 + 1) ** 2
    print(vong, round(w1, 4), round(w2, 4), round(loss, 4))`,
      stdinLines: [],
    },
    predict: {
      code: `w1, w2, lr = 0.0, 0.0, 0.25
w1, w2 = w1 - lr * 2 * (w1 - 3), w2 - lr * 10 * (w2 + 1)
print(w1, w2)`,
      question: 'Sau một bước với lr = 0.25 từ (0, 0), w1 và w2 in ra là gì?',
      choices: ['1.5 -2.5', '1.5 -1.0', '0.75 -2.5', '3.0 -1.0'],
      answerIndex: 0,
      explain:
        'w1 = 0 − 0,25·2·(−3) = 1,5 tiến về 3; w2 = 0 − 0,25·10·1 = −2,5 nhảy vượt cực tiểu −1 và nằm xa hơn lúc đầu. Đó là mầm của phân kỳ theo hướng w2.',
    },
    parsons: {
      prompt: 'Xếp vòng lặp descent dừng ngay khi loss tăng.',
      lines: [
        'for vong in range(1, so_vong + 1):',
        '    w1, w2 = w1 - lr * 2 * (w1 - 3), w2 - lr * 10 * (w2 + 1)',
        '    moi = (w1 - 3) ** 2 + 5 * (w2 + 1) ** 2',
        '    if moi > cu + 1e-12:',
        '        ket_luan = f"phan-ky@{vong}"',
        '        break',
        '    cu = moi',
      ],
    },
    make: {
      prompt:
        'MÔ PHỎNG gradient descent trên f(w1, w2) = (w1 − 3)² + 5(w2 + 1)². Đọc điểm xuất phát `w1,w2`, danh sách learning rate cách nhau dấu phẩy, số vòng N (1 đến 20) và ngưỡng tol. Với từng lr theo đúng thứ tự: chạy lại từ điểm xuất phát, ghi loss trước vòng 1 và sau mỗi vòng. Nếu loss vòng nào lớn hơn loss vòng trước (cộng 1e-12) hoặc không hữu hạn thì dừng, kết luận `phan-ky@<vòng>`; chạy hết N vòng thì `hoi-tu` nếu loss cuối ≤ tol, ngược lại `cham`. In hai dòng cho mỗi lr: `lr=<lr>|loss=<các loss 4 chữ số nối bằng dấu phẩy>` và `lr=<lr>-><kết luận>` (lr in theo định dạng `:g`). Dòng cuối `lr-tot-nhat=<lr>` là lr không phân kỳ có loss cuối nhỏ nhất, không có thì `khong-co`. Danh sách rỗng, lr không dương, tol không dương, N ngoài phạm vi, NaN/inf in `input-khong-hop-le`. Không phải training thật.',
      starterCode: `import math

dong_diem = input().strip()
dong_lr = input().strip()
so_vong = int(input())
tol = float(input())

# MÔ PHỎNG; không dùng autograd hay thư viện ML.`,
      testCases: [
        {
          stdinLines: ['0,0', '0.01,0.15,0.25', '10', '0.01'],
          expected:
            'lr=0.01->cham\nlr=0.15|loss=14.0000,5.6600,2.4734,1.1370,0.5384,0.2591,0.1258,0.0613,0.0300,0.0147,0.0072\nlr=0.15->hoi-tu\nlr=0.25|loss=14.0000,13.5000,25.8750\nlr=0.25->phan-ky@2\nlr-tot-nhat=0.15',
          match: 'contains',
          hidden: false,
          label: 'ba learning rate: chậm, vừa, phân kỳ',
        },
        {
          stdinLines: ['0,0', '0.01', '3', '0.01'],
          expected: 'lr=0.01|loss=14.0000,12.6936,11.5818,10.6298\nlr=0.01->cham',
          match: 'contains',
          hidden: true,
          label: 'lr nhỏ giảm đều nhưng chậm',
        },
        {
          stdinLines: ['0,0', '0.15', '4', '0.01'],
          expected: 'lr=0.15->cham',
          match: 'contains',
          hidden: true,
          label: 'lr tốt nhưng chưa đủ vòng thì chưa hội tụ',
        },
        {
          stdinLines: ['0,0', '0.25,0.3', '3', '0.01'],
          expected: 'lr=0.3|loss=14.0000,21.4400\nlr=0.3->phan-ky@1\nlr-tot-nhat=khong-co',
          match: 'contains',
          hidden: true,
          label: 'mọi lr đều phân kỳ',
        },
        {
          stdinLines: ['3,-1', '0.1', '2', '0.01'],
          expected: 'lr=0.1|loss=0.0000,0.0000,0.0000\nlr=0.1->hoi-tu',
          match: 'contains',
          hidden: true,
          label: 'xuất phát tại cực tiểu',
        },
        {
          stdinLines: ['0,0', '0,0.1', '3', '0.01'],
          expected: 'input-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'lr bằng 0 bị từ chối',
        },
        {
          stdinLines: ['0,0', '0.1', '25', '0.01'],
          expected: 'input-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'quá ngân sách vòng',
        },
        {
          stdinLines: ['nan,0', '0.1', '2', '0.01'],
          expected: 'input-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'NaN bị từ chối',
        },
      ],
      hints: [
        'Viết riêng hàm loss(w1, w2) và gradient(w1, w2).',
        'Mỗi lr chạy lại từ đúng điểm xuất phát, không nối tiếp lr trước.',
        'So loss mới với loss vòng trước NGAY sau mỗi bước.',
        'Chỉ lr không phân kỳ mới được xét cho lr-tot-nhat.',
      ],
      sampleSolution: `import math

def loss(w1, w2):
    return (w1 - 3) ** 2 + 5 * (w2 + 1) ** 2

def gradient(w1, w2):
    # Đạo hàm riêng theo từng biến, cài tay.
    return 2 * (w1 - 3), 10 * (w2 + 1)

try:
    w1_0, w2_0 = [float(x.strip()) for x in input().split(",")]
    lrs = [float(x.strip()) for x in input().split(",")]
    so_vong = int(input().strip())
    tol = float(input().strip())
    gia_tri = [w1_0, w2_0, tol] + lrs
    if not all(math.isfinite(x) for x in gia_tri) or not lrs:
        raise ValueError
    if any(lr <= 0 for lr in lrs) or not 1 <= so_vong <= 20 or tol <= 0:
        raise ValueError
except (ValueError, EOFError):
    print("input-khong-hop-le")
    raise SystemExit
tot_nhat = None
for lr in lrs:
    w1, w2 = w1_0, w2_0
    bang = [loss(w1, w2)]
    ket_luan = None
    for vong in range(1, so_vong + 1):
        g1, g2 = gradient(w1, w2)
        w1, w2 = w1 - lr * g1, w2 - lr * g2
        moi = loss(w1, w2)
        bang.append(moi)
        if not math.isfinite(moi) or moi > bang[-2] + 1e-12:
            ket_luan = f"phan-ky@{vong}"
            break
    if ket_luan is None:
        ket_luan = "hoi-tu" if bang[-1] <= tol else "cham"
        if tot_nhat is None or bang[-1] < tot_nhat[1]:
            tot_nhat = (lr, bang[-1])
    print(f"lr={lr:g}|loss=" + ",".join(f"{x:.4f}" for x in bang))
    print(f"lr={lr:g}->{ket_luan}")
print("lr-tot-nhat=" + (f"{tot_nhat[0]:g}" if tot_nhat else "khong-co"))`,
    },
    homework:
      'Ngoài sandbox, vẽ đường loss của ba learning rate trên cùng một đồ thị (matplotlib), rồi thử đổi hệ số 5 thành 50 và tìm lại ngưỡng lr phân kỳ. Giải thích bằng chữ vì sao hướng cong nhất quyết định lr an toàn. Bảng loss của simulator không thay đồ thị đó.',
    srsCards: [
      {
        hoi: 'Hướng nào của hàm quyết định learning rate an toàn khi descent nhiều biến?',
        dap: 'Hướng cong nhất (đạo hàm bậc hai lớn nhất): lr vượt ngưỡng của hướng đó thì biến tương ứng nhảy qua cực tiểu và phân kỳ.',
      },
      {
        hoi: 'Vì sao loss giảm ở vòng đầu chưa chứng minh learning rate an toàn?',
        dap: 'Một hướng có thể đang vượt quá cực tiểu trong khi hướng khác giảm mạnh; loss tổng chỉ nổ ở các vòng sau, nên phải xem cả bảng.',
      },
      {
        hoi: 'Learning rate quá nhỏ gây ra triệu chứng gì trên bảng loss?',
        dap: 'Loss giảm đều đặn nhưng rất chậm, hết ngân sách vòng lặp mà vẫn chưa xuống tới ngưỡng hội tụ.',
      },
    ],
  },
  {
    id: 'p6-u292-l2',
    unitId: 'p6-u292',
    language: 'python',
    title: 'Hàm không lồi — cực tiểu địa phương, điểm yên ngựa và cao nguyên',
    hook: 'Gradient bằng 0 không có nghĩa là đã tới đáy. Mô hình có thể đứng yên trên một yên ngựa hay một cao nguyên phẳng và ta tưởng nó đã học xong.',
    theory:
      'Hàm lồi chỉ có một cực tiểu, nên gradient descent từ đâu cũng về cùng một chỗ. Hàm không lồi có nhiều cực tiểu địa phương: f(x) = x⁴ − 3x² + x có một đáy sâu gần x = −1,30 và một đáy nông gần x = 1,13, điểm xuất phát quyết định rơi vào đáy nào. Gradient gần 0 chỉ nói "đứng yên", muốn biết loại điểm phải nhìn độ cong (đạo hàm bậc hai, hay các giá trị riêng của ma trận Hessian khi nhiều biến). Mọi độ cong dương là cực tiểu địa phương. Có độ cong dương lẫn âm là điểm yên ngựa, như gốc toạ độ của f(x, y) = x² − y²: đi từ (1, 0) descent hội tụ về đó và đứng yên dù hàm còn giảm mãi theo hướng y. Mọi độ cong gần 0 là cao nguyên: f(x) = 1 − e^(−x²) tại x = 5 có gradient cỡ 1e-10 nhưng f ≈ 1 trong khi đáy thật là 0. Bài phân loại theo hợp đồng ngưỡng 1e-6 trên ba hàm cố định. Đây là MÔ PHỎNG Python thuần, không phải công cụ phân tích mạng nơ-ron thật hay bằng chứng mô hình production đã hội tụ.',
    workedExample: {
      code: `# f(x) = x^4 - 3x^2 + x không lồi: hai cực tiểu địa phương.
def gd(x, lr=0.01, so_vong=300):
    for _ in range(so_vong):
        x = x - lr * (4 * x ** 3 - 6 * x + 1)
    return x

# Cùng một hàm, hai điểm xuất phát, hai đáy khác nhau.
for bat_dau in [-2.0, 2.0]:
    x = gd(bat_dau)
    print("xuất phát", bat_dau, "-> x =", round(x, 4), "f =", round(x ** 4 - 3 * x ** 2 + x, 4))`,
      stdinLines: [],
    },
    predict: {
      code: `# f(x, y) = x^2 - y^2 tại gốc toạ độ.
x, y = 0, 0
g = [2 * x, -2 * y]
cong = [2, -2]
print(g, cong[0] > 0 and cong[1] < 0)`,
      question: 'Gradient tại gốc và phép thử "một độ cong dương, một độ cong âm" in ra là gì?',
      choices: ['[0, 0] True', '[0, 0] False', '[2, -2] True', '[2, -2] False'],
      answerIndex: 0,
      explain:
        'Gradient bằng 0 nên descent đứng yên, nhưng độ cong theo x dương còn theo y âm: đó là điểm yên ngựa, không phải cực tiểu.',
    },
    parsons: {
      prompt: 'Xếp phần phân loại điểm dừng theo gradient và độ cong.',
      lines: [
        'if chuan_grad > 1e-6:',
        '    ket_luan = "chua-dung"',
        'elif all(c > 1e-6 for c in cong):',
        '    ket_luan = "cuc-tieu-dia-phuong"',
        'elif any(c > 1e-6 for c in cong) and any(c < -1e-6 for c in cong):',
        '    ket_luan = "diem-yen-ngua"',
        'else:',
        '    ket_luan = "cao-nguyen"',
      ],
    },
    make: {
      prompt:
        'MÔ PHỎNG descent trên ba hàm cố định: `song-cuc` f(x) = x⁴ − 3x² + x; `yen-ngua` f(x, y) = x² − y²; `cao-nguyen` f(x) = 1 − e^(−x²). Đọc tên hàm, điểm xuất phát (toạ độ cách nhau dấu phẩy, đúng số chiều của hàm), lr dương và số vòng (1 đến 1000). Chạy descent bằng gradient tính tay; nếu sau một bước có toạ độ |x| > 1e6 thì in `phan-ky` và dừng. Ngược lại in `diem=<toạ độ 4 chữ số>`, `f=<4 chữ số>` (đổi -0.0000 thành 0.0000) và `ket-luan=`: `chua-dung` nếu độ dài gradient > 1e-6; `cuc-tieu-dia-phuong` nếu mọi độ cong > 1e-6; `diem-yen-ngua` nếu có độ cong > 1e-6 và có độ cong < −1e-6; còn lại `cao-nguyen`. Độ cong là đạo hàm bậc hai (với `yen-ngua` là 2 và −2). Tên lạ, sai số chiều, lr không dương, số vòng ngoài phạm vi, NaN/inf in `input-khong-hop-le`. Không phải công cụ phân tích model thật.',
      starterCode: `import math

ten = input().strip()
dong_diem = input().strip()
lr = float(input())
so_vong = int(input())

# MÔ PHỎNG; gradient và độ cong tính tay cho ba hàm cố định.`,
      testCases: [
        {
          stdinLines: ['song-cuc', '-2', '0.01', '300'],
          expected: 'diem=-1.3008\nf=-3.5139\nket-luan=cuc-tieu-dia-phuong',
          match: 'contains',
          hidden: false,
          label: 'xuất phát bên trái rơi vào đáy sâu',
        },
        {
          stdinLines: ['song-cuc', '2', '0.01', '300'],
          expected: 'diem=1.1309\nf=-1.0702\nket-luan=cuc-tieu-dia-phuong',
          match: 'contains',
          hidden: true,
          label: 'xuất phát bên phải kẹt ở đáy nông',
        },
        {
          stdinLines: ['yen-ngua', '1,0', '0.1', '200'],
          expected: 'diem=0.0000,0.0000\nf=0.0000\nket-luan=diem-yen-ngua',
          match: 'contains',
          hidden: true,
          label: 'hội tụ về điểm yên ngựa',
        },
        {
          stdinLines: ['cao-nguyen', '5', '0.1', '100'],
          expected: 'diem=5.0000\nf=1.0000\nket-luan=cao-nguyen',
          match: 'contains',
          hidden: true,
          label: 'gradient gần 0 trên cao nguyên',
        },
        {
          stdinLines: ['cao-nguyen', '0.5', '0.1', '500'],
          expected: 'diem=0.0000\nf=0.0000\nket-luan=cuc-tieu-dia-phuong',
          match: 'contains',
          hidden: true,
          label: 'xuất phát gần đáy thì tới cực tiểu thật',
        },
        {
          stdinLines: ['song-cuc', '2', '0.01', '1'],
          expected: 'ket-luan=chua-dung',
          match: 'contains',
          hidden: true,
          label: 'một vòng chưa đủ để dừng',
        },
        {
          stdinLines: ['yen-ngua', '1,0.001', '0.1', '200'],
          expected: 'phan-ky',
          match: 'contains',
          hidden: true,
          label: 'lệch khỏi yên ngựa thì trôi mãi xuống',
        },
        {
          stdinLines: ['yen-ngua', '1', '0.1', '10'],
          expected: 'input-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'sai số chiều bị từ chối',
        },
        {
          stdinLines: ['xyz', '1', '0.1', '10'],
          expected: 'input-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'tên hàm lạ bị từ chối',
        },
      ],
      hints: [
        'Gom mỗi hàm thành bộ (số chiều, f, gradient, độ cong) trong một dict.',
        'Kiểm |x| > 1e6 ngay sau mỗi bước, trước khi tính tiếp.',
        'Phân loại theo đúng thứ tự: gradient trước, rồi độ cong.',
        'Đạo hàm bậc hai của 1 − e^(−x²) là (2 − 4x²)·e^(−x²).',
      ],
      sampleSolution: `import math

# Ba hàm cố định: (số chiều, f, gradient, các độ cong theo trục chính tại điểm).
HAM = {
    "song-cuc": (
        1,
        lambda v: v[0] ** 4 - 3 * v[0] ** 2 + v[0],
        lambda v: [4 * v[0] ** 3 - 6 * v[0] + 1],
        lambda v: [12 * v[0] ** 2 - 6],
    ),
    "yen-ngua": (
        2,
        lambda v: v[0] ** 2 - v[1] ** 2,
        lambda v: [2 * v[0], -2 * v[1]],
        lambda v: [2.0, -2.0],
    ),
    "cao-nguyen": (
        1,
        lambda v: 1 - math.exp(-v[0] ** 2),
        lambda v: [2 * v[0] * math.exp(-v[0] ** 2)],
        lambda v: [(2 - 4 * v[0] ** 2) * math.exp(-v[0] ** 2)],
    ),
}

def f4(x):
    x = round(x, 4)
    return "0.0000" if x == 0 else f"{x:.4f}"

try:
    ten = input().strip()
    diem = [float(x.strip()) for x in input().split(",")]
    lr = float(input().strip())
    so_vong = int(input().strip())
    if ten not in HAM or len(diem) != HAM[ten][0]:
        raise ValueError
    if not all(math.isfinite(x) for x in diem + [lr]) or lr <= 0 or not 1 <= so_vong <= 1000:
        raise ValueError
except (ValueError, EOFError):
    print("input-khong-hop-le")
    raise SystemExit
_, f, grad, do_cong = HAM[ten]
phan_ky = False
for _ in range(so_vong):
    g = grad(diem)
    diem = [x - lr * gx for x, gx in zip(diem, g)]
    if any(abs(x) > 1e6 for x in diem):
        phan_ky = True
        break
if phan_ky:
    print("phan-ky")
    raise SystemExit
print("diem=" + ",".join(f4(x) for x in diem))
print("f=" + f4(f(diem)))
chuan_grad = math.sqrt(sum(gx * gx for gx in grad(diem)))
cong = do_cong(diem)
if chuan_grad > 1e-6:
    print("ket-luan=chua-dung")
elif all(c > 1e-6 for c in cong):
    print("ket-luan=cuc-tieu-dia-phuong")
elif any(c > 1e-6 for c in cong) and any(c < -1e-6 for c in cong):
    print("ket-luan=diem-yen-ngua")
else:
    print("ket-luan=cao-nguyen")`,
    },
    homework:
      'Ngoài sandbox, chạy descent cho f(x) = x⁴ − 3x² + x từ 21 điểm xuất phát cách đều trong [−2, 2], ghi điểm nào rơi vào đáy nào và vẽ thành biểu đồ. Rồi thử thêm momentum và quan sát nó có giúp vượt đáy nông không. Simulator ba hàm không thay được thí nghiệm đó.',
    srsCards: [
      {
        hoi: 'Vì sao gradient descent trên hàm không lồi có thể cho kết quả khác nhau?',
        dap: 'Hàm có nhiều cực tiểu địa phương, mỗi điểm xuất phát rơi vào lưu vực của một đáy khác nhau và kẹt ở đó.',
      },
      {
        hoi: 'Làm sao phân biệt điểm yên ngựa với cực tiểu khi gradient bằng 0?',
        dap: 'Nhìn độ cong: cực tiểu có mọi độ cong dương, điểm yên ngựa có cả độ cong dương lẫn độ cong âm.',
      },
      {
        hoi: 'Cao nguyên phẳng làm quá trình học đứng lại theo cơ chế nào?',
        dap: 'Gradient và độ cong đều gần 0 nên mỗi bước gần như không dịch chuyển, dù giá trị hàm còn cách xa đáy thật.',
      },
    ],
  },
]
