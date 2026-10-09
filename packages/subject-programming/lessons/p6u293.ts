// P6-U293 — mathforcode-s4-m3,m4 (bổ sung 2026-10-09): lan truyền ngược trên mạng nhỏ 2 tầng có
// kiểm gradient bằng sai phân, và lập lịch hai máy bằng hill climbing có điều kiện dừng.
// Bổ sung cho p6-u161 (một neuron tuyến tính, tối ưu giá vét cạn) — không lặp lại hai topic đó.
// Đặc tả: docs/specs/2026-10-09-mathforcode-s3-s4-bo-sung-unit.md.
import type { ProgrammingLesson } from '../lessonTypes.js'

export const P6U293_LESSONS: ProgrammingLesson[] = [
  {
    id: 'p6-u293-l1',
    unitId: 'p6-u293',
    language: 'python',
    title: 'Lan truyền ngược qua mạng 2 tầng và bắt lỗi bằng sai phân',
    hook: 'Quên một đạo hàm kích hoạt trong backprop không làm code đỏ: mô hình vẫn chạy, chỉ học sai. Kiểm gradient bằng sai phân hữu hạn là cách duy nhất để lỗi đó lộ ra.',
    theory:
      'Mạng nhỏ hai tầng có 4 tham số: tầng ẩn z = w·x + b, h = tanh(z); tầng ra y = v·h + c; loss L = (y − t)². Lan truyền ngược đi từ cuối về đầu theo quy tắc chuỗi: dL/dy = 2(y − t); dL/dv = dL/dy·h; dL/dc = dL/dy; dL/dh = dL/dy·v; đi qua tanh nhân thêm 1 − h², được dL/dz; cuối cùng dL/dw = dL/dz·x và dL/db = dL/dz. Mỗi tham số nhận đúng phần lỗi đi qua nó. Kiểm gradient từng tham số: tăng rồi giảm riêng tham số đó một lượng epsilon, tính (L₊ − L₋)/(2·epsilon), so với gradient giải tích bằng sai lệch tương đối |a − n|/max(1, |a|, |n|). Một bản cài cố tình quên nhân 1 − h² sẽ lệch ở w và b nhưng vẫn khớp ở v và c, nên phép kiểm chỉ đúng tham số bị lỗi. Cẩn thận: tại z = 0 thì 1 − h² = 1, lỗi đó bị che hoàn toàn, nên kiểm ở MỘT điểm là chưa đủ. Đây là MÔ PHỎNG Python thuần, không phải autograd hay framework học sâu thật.',
    workedExample: {
      code: `import math

# Mạng 2 tầng MÔ PHỎNG: z = w*x + b, h = tanh(z), y = v*h + c, L = (y - t)^2.
x, t = 2.0, 1.0
w, b, v, c = 0.5, 0.0, 2.0, 0.0
z = w * x + b
h = math.tanh(z)
y = v * h + c
dy = 2 * (y - t)            # dL/dy
dz = dy * v * (1 - h * h)   # đi ngược qua v rồi qua tanh
print("L =", round((y - t) ** 2, 6))
print("dL/dv =", round(dy * h, 4), "dL/dw =", round(dz * x, 4))`,
      stdinLines: [],
    },
    predict: {
      code: `import math
h = math.tanh(0.0)
print(1 - h * h)`,
      question: 'Đạo hàm của tanh tại z = 0 (tức 1 − h²) in ra là bao nhiêu?',
      choices: ['1.0', '0.0', '0.5', '-1.0'],
      answerIndex: 0,
      explain:
        'tanh(0) = 0 nên 1 − h² = 1. Vì vậy bản cài quên nhân đạo hàm tanh vẫn cho đúng gradient tại z = 0, và kiểm ở điểm đó không bắt được lỗi.',
    },
    parsons: {
      prompt: 'Xếp các bước lan truyền ngược từ tầng ra về tầng ẩn.',
      lines: [
        'dy = 2 * (y - t)',
        'dv, dc = dy * h, dy',
        'dh = dy * v',
        'dz = dh * (1 - h * h)',
        'dw, db = dz * x, dz',
      ],
    },
    make: {
      prompt:
        'MÔ PHỎNG kiểm gradient cho mạng z = w·x + b, h = tanh(z), y = v·h + c, L = (y − t)². Dòng 1: `x t w b v c`; dòng 2: `epsilon tolerance`; dòng 3: chế độ `dung` (backprop đầy đủ) hoặc `quen-dao-ham-tanh` (bản lỗi, bỏ nhân 1 − h²). In `loss=<6 chữ số>`. Với từng tham số theo thứ tự w, b, v, c: tính gradient giải tích theo chế độ, gradient số bằng sai phân trung tâm, sai lệch tương đối |a − n|/max(1, |a|, |n|), rồi in `grad-<tên>=<giải tích 4 chữ số>|kiem=khop` nếu sai lệch ≤ tolerance, ngược lại `|kiem=lech`. Đổi -0.0000 thành 0.0000. Dòng cuối `tong-ket=khop-het` hoặc `tong-ket=lech:<các tên nối bằng dấu phẩy>`. Thiếu số, NaN/inf, epsilon hay tolerance không dương, chế độ lạ in `input-khong-hop-le`. Không dùng autograd.',
      starterCode: `import math

# MÔ PHỎNG lan truyền ngược cho 4 tham số; không dùng autograd.`,
      testCases: [
        {
          stdinLines: ['2 1 0.5 0 2 0', '0.00001 0.000001', 'dung'],
          expected:
            'loss=0.273726\ngrad-w=1.7578|kiem=khop\ngrad-b=0.8789|kiem=khop\ngrad-v=0.7969|kiem=khop\ngrad-c=1.0464|kiem=khop\ntong-ket=khop-het',
          match: 'contains',
          hidden: false,
          label: 'backprop đầy đủ khớp sai phân',
        },
        {
          stdinLines: ['2 1 0.5 0 2 0', '0.00001 0.000001', 'quen-dao-ham-tanh'],
          expected:
            'grad-w=4.1855|kiem=lech\ngrad-b=2.0928|kiem=lech\ngrad-v=0.7969|kiem=khop\ngrad-c=1.0464|kiem=khop\ntong-ket=lech:w,b',
          match: 'contains',
          hidden: true,
          label: 'quên đạo hàm tanh chỉ lệch ở w và b',
        },
        {
          stdinLines: ['1 0.5 0 0 1 0', '0.00001 0.000001', 'quen-dao-ham-tanh'],
          expected: 'grad-v=0.0000|kiem=khop\ngrad-c=-1.0000|kiem=khop\ntong-ket=khop-het',
          match: 'contains',
          hidden: true,
          label: 'tại z = 0 lỗi bị che',
        },
        {
          stdinLines: ['2 1 0.5 0 2 0', '0 0.000001', 'dung'],
          expected: 'input-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'epsilon bằng 0 bị từ chối',
        },
        {
          stdinLines: ['2 1 0.5 0 2 0', '0.00001 0.000001', 'autograd'],
          expected: 'input-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'chế độ lạ bị từ chối',
        },
        {
          stdinLines: ['nan 1 0.5 0 2 0', '0.00001 0.000001', 'dung'],
          expected: 'input-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'NaN không được lan vào gradient',
        },
      ],
      hints: [
        'Viết một hàm lan truyền xuôi trả về (h, y, loss) cho một bộ tham số.',
        'Gradient số: sao chép bộ tham số, chỉ cộng/trừ epsilon ở đúng một vị trí.',
        'Bản lỗi chỉ khác bản đúng ở bước đi qua tanh.',
        'Dùng max(1, |a|, |n|) ở mẫu số để ổn định khi gradient gần 0.',
      ],
      sampleSolution: `import math

TEN = ["w", "b", "v", "c"]

def f4(so):
    so = round(so, 4)
    return "0.0000" if so == 0 else f"{so:.4f}"

def lan_truyen_xuoi(x, t, p):
    w, b, v, c = p
    z = w * x + b          # tầng ẩn: tổ hợp tuyến tính
    h = math.tanh(z)       # tầng ẩn: hàm kích hoạt
    y = v * h + c          # tầng ra
    return h, y, (y - t) ** 2

def lan_truyen_nguoc(x, t, p, che_do):
    w, b, v, c = p
    h, y, _ = lan_truyen_xuoi(x, t, p)
    dy = 2 * (y - t)
    dh = dy * v
    # Cài đúng phải nhân thêm đạo hàm tanh là 1 - h^2; bản lỗi cố tình quên bước này.
    dz = dh * (1 - h * h) if che_do == "dung" else dh
    return [dz * x, dz, dy * h, dy]

try:
    x, t, w, b, v, c = map(float, input().split())
    epsilon, tolerance = map(float, input().split())
    che_do = input().strip()
    so = [x, t, w, b, v, c, epsilon, tolerance]
    if not all(map(math.isfinite, so)) or epsilon <= 0 or tolerance <= 0:
        raise ValueError
    if che_do not in {"dung", "quen-dao-ham-tanh"}:
        raise ValueError
except (ValueError, EOFError):
    print("input-khong-hop-le")
    raise SystemExit
p = [w, b, v, c]
print(f"loss={lan_truyen_xuoi(x, t, p)[2]:.6f}")
giai_tich = lan_truyen_nguoc(x, t, p, che_do)
lech = []
for i, ten in enumerate(TEN):
    cong, tru = p[:], p[:]
    cong[i] += epsilon
    tru[i] -= epsilon
    so_hoc = (lan_truyen_xuoi(x, t, cong)[2] - lan_truyen_xuoi(x, t, tru)[2]) / (2 * epsilon)
    a = giai_tich[i]
    tuong_doi = abs(a - so_hoc) / max(1.0, abs(a), abs(so_hoc))
    trang_thai = "khop" if tuong_doi <= tolerance else "lech"
    if trang_thai == "lech":
        lech.append(ten)
    print(f"grad-{ten}={f4(a)}|kiem={trang_thai}")
print("tong-ket=" + ("khop-het" if not lech else "lech:" + ",".join(lech)))`,
    },
    homework:
      'Ngoài sandbox, mở rộng mạng lên 2 nơ-ron ẩn rồi kiểm gradient của cả 7 tham số tại 10 điểm dữ liệu khác nhau, ghi sai lệch tương đối lớn nhất và đối chiếu với autograd của một framework thật. Ghi rõ điểm nào làm lỗi bị che.',
    srsCards: [
      {
        hoi: 'Trong mạng z = w·x + b, h = tanh(z), y = v·h + c, gradient dL/dw tính thế nào?',
        dap: 'dL/dw = 2(y − t)·v·(1 − h²)·x: nhân lần lượt các đạo hàm từ loss ngược về w theo quy tắc chuỗi.',
      },
      {
        hoi: 'Vì sao kiểm gradient chỉ ở một điểm dữ liệu là chưa đủ?',
        dap: 'Có điểm làm lỗi biến mất, ví dụ tại z = 0 thì 1 − h² = 1 nên bản quên đạo hàm tanh vẫn khớp sai phân.',
      },
      {
        hoi: 'Quên nhân đạo hàm kích hoạt ở tầng ẩn làm lệch gradient của tham số nào?',
        dap: 'Chỉ các tham số đứng trước hàm kích hoạt (w và b); tham số tầng ra v và c vẫn đúng vì không đi qua bước đó.',
      },
    ],
  },
  {
    id: 'p6-u293-l2',
    unitId: 'p6-u293',
    language: 'python',
    title: 'Lập lịch hai máy bằng hill climbing — dừng theo ngân sách và ngưỡng',
    hook: 'Tìm kiếm cục bộ luôn dừng ở đâu đó, câu hỏi là dừng vì đã tốt, vì hết ngân sách, hay vì bước tiếp theo không đáng công. Báo sai lý do dừng là báo sai chất lượng lời giải.',
    theory:
      'Bài toán: chia n việc có thời lượng cho hai máy A và B sao cho makespan, tức tải của máy bận nhất, nhỏ nhất. Hill climbing bắt đầu từ một phân công, xét mọi lân cận "chuyển đúng một việc sang máy kia", chọn bước giảm makespan nhiều nhất (hoà thì chọn việc có chỉ số nhỏ nhất) rồi lặp. Có ba điều kiện dừng và phải báo đúng lý do: hết ngân sách vòng lặp (`het-ngan-sach`, kiểm TRƯỚC khi tìm bước mới); không còn bước nào giảm makespan (`cuc-bo`, cực trị cục bộ của lân cận này); bước tốt nhất giảm ít hơn ngưỡng đã chọn (`cai-thien-nho`, chi phí tính tiếp vượt giá trị mang lại). Cực trị cục bộ không phải tối ưu toàn cục: với thời lượng 3,3,2,2,2 và phân công ABABB, makespan 7 nhưng không chuyển một việc nào giảm được, trong khi đổi chỗ hai việc cho makespan 6. Đây là MÔ PHỎNG Python thuần, tất định, không phải bộ lập lịch production.',
    workedExample: {
      code: `# Hai máy A, B; makespan = tải của máy bận nhất.
thoi_luong = [4, 3, 3, 2]
phan_cong = "AAAA"

def makespan(pc):
    tai_a = sum(d for d, m in zip(thoi_luong, pc) if m == "A")
    return max(tai_a, sum(thoi_luong) - tai_a)

# Duyệt mọi lân cận "chuyển một việc sang máy B".
for i in range(len(thoi_luong)):
    thu = phan_cong[:i] + "B" + phan_cong[i + 1:]
    print("chuyển việc", i + 1, "sang B ->", makespan(thu))`,
      stdinLines: [],
    },
    predict: {
      code: `thoi_luong = [3, 3, 2, 2, 2]
pc = "ABABB"
tai_a = sum(d for d, m in zip(thoi_luong, pc) if m == "A")
print(tai_a, sum(thoi_luong) - tai_a)`,
      question: 'Tải của máy A và máy B với phân công ABABB in ra là gì?',
      choices: ['5 7', '6 6', '7 5', '3 9'],
      answerIndex: 0,
      explain:
        'A nhận việc 1 và 3 (3 + 2 = 5), B nhận phần còn lại (7), makespan là 7. Chuyển một việc 2 từ B sang A chỉ đảo thành 7 và 5, nên đây là cực trị cục bộ dù tối ưu là 6.',
    },
    parsons: {
      prompt: 'Xếp các điều kiện dừng theo đúng thứ tự ưu tiên.',
      lines: [
        'if vong == ngan_sach:',
        '    ly_do = "het-ngan-sach"',
        'elif loi <= 0:',
        '    ly_do = "cuc-bo"',
        'elif loi < nguong:',
        '    ly_do = "cai-thien-nho"',
        'else:',
        '    ly_do = None',
      ],
    },
    make: {
      prompt:
        'MÔ PHỎNG lập lịch hai máy. Đọc thời lượng các việc (số nguyên dương cách nhau dấu phẩy), phân công ban đầu (chuỗi chữ A/B, mỗi việc một chữ), ngân sách vòng lặp (số nguyên ≥ 0) và ngưỡng cải thiện (số ≥ 0). In `bat-dau:makespan=<m>`. Mỗi vòng: nếu đã dùng hết ngân sách thì dừng `het-ngan-sach`; xét mọi cách chuyển ĐÚNG MỘT việc sang máy kia, lấy bước giảm makespan nhiều nhất (hoà thì việc có chỉ số nhỏ nhất); mức giảm ≤ 0 thì dừng `cuc-bo`; mức giảm < ngưỡng thì dừng `cai-thien-nho` và không áp bước đó; còn lại áp bước và in `vong=<k>;chuyen=viec<i>-><máy mới>;makespan=<m>` (i đếm từ 1). Dòng cuối `dung=<lý do>;makespan=<m>;phan-cong=<chuỗi>`. Danh sách rỗng, thời lượng không dương hay không nguyên, phân công sai độ dài hoặc có chữ khác A/B, ngân sách âm, ngưỡng âm hoặc NaN/inf in `input-khong-hop-le`. Không phải bộ lập lịch thật.',
      starterCode: `import math

dong_thoi_luong = input().strip()
dong_phan_cong = input().strip()
ngan_sach = int(input())
nguong = float(input())

# MÔ PHỎNG hill climbing tất định; không dùng random.`,
      testCases: [
        {
          stdinLines: ['4,3,3,2', 'AAAA', '10', '0'],
          expected:
            'bat-dau:makespan=12\nvong=1;chuyen=viec1->B;makespan=8\nvong=2;chuyen=viec4->B;makespan=6\ndung=cuc-bo;makespan=6;phan-cong=BAAB',
          match: 'contains',
          hidden: false,
          label: 'leo tới cực trị cục bộ',
        },
        {
          stdinLines: ['3,3,2,2,2', 'ABABB', '10', '0'],
          expected: 'bat-dau:makespan=7\ndung=cuc-bo;makespan=7;phan-cong=ABABB',
          match: 'contains',
          hidden: true,
          label: 'cực trị cục bộ không phải tối ưu toàn cục',
        },
        {
          stdinLines: ['4,3,3,2', 'AAAA', '1', '0'],
          expected: 'dung=het-ngan-sach;makespan=8;phan-cong=BAAA',
          match: 'contains',
          hidden: true,
          label: 'hết ngân sách sau một vòng',
        },
        {
          stdinLines: ['4,3,3,2', 'AAAA', '0', '0'],
          expected: 'dung=het-ngan-sach;makespan=12;phan-cong=AAAA',
          match: 'contains',
          hidden: true,
          label: 'ngân sách 0 thì không bước nào',
        },
        {
          stdinLines: ['4,3,3,2', 'AAAA', '10', '3'],
          expected: 'dung=cai-thien-nho;makespan=8;phan-cong=BAAA',
          match: 'contains',
          hidden: true,
          label: 'cải thiện nhỏ hơn ngưỡng thì dừng',
        },
        {
          stdinLines: ['4,0,3', 'AAA', '10', '0'],
          expected: 'input-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'thời lượng 0 bị từ chối',
        },
        {
          stdinLines: ['4,3', 'AAB', '10', '0'],
          expected: 'input-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'phân công sai độ dài',
        },
        {
          stdinLines: ['4,3,3,2', 'AAXA', '10', '0'],
          expected: 'input-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'máy lạ bị từ chối',
        },
        {
          stdinLines: ['4,3,3,2', 'AAAA', '-1', '0'],
          expected: 'input-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'ngân sách âm bị từ chối',
        },
      ],
      hints: [
        'Viết hàm makespan(thoi_luong, phan_cong) dùng chung cho mọi lân cận.',
        'Kiểm ngân sách ở ĐẦU mỗi vòng, trước khi tìm bước mới.',
        'Chỉ thay bước tốt nhất khi mức giảm lớn hơn hẳn, để hoà giữ việc có chỉ số nhỏ.',
        'Ngưỡng chặn bước đó lại: đừng áp bước rồi mới dừng.',
      ],
      sampleSolution: `import math

def makespan(thoi_luong, phan_cong):
    tai_a = sum(d for d, m in zip(thoi_luong, phan_cong) if m == "A")
    return max(tai_a, sum(thoi_luong) - tai_a)

try:
    thoi_luong = [int(x.strip()) for x in input().split(",")]
    phan_cong = list(input().strip())
    ngan_sach = int(input().strip())
    nguong = float(input().strip())
    if not thoi_luong or any(d <= 0 for d in thoi_luong) or len(phan_cong) != len(thoi_luong):
        raise ValueError
    if any(m not in "AB" for m in phan_cong) or ngan_sach < 0:
        raise ValueError
    if not math.isfinite(nguong) or nguong < 0:
        raise ValueError
except (ValueError, EOFError):
    print("input-khong-hop-le")
    raise SystemExit
hien_tai = makespan(thoi_luong, phan_cong)
print(f"bat-dau:makespan={hien_tai}")
vong = 0
while True:
    if vong == ngan_sach:
        ly_do = "het-ngan-sach"
        break
    # Lân cận: chuyển ĐÚNG MỘT việc sang máy kia; chọn bước giảm nhiều nhất, hoà thì chỉ số nhỏ nhất.
    tot = None
    for i in range(len(thoi_luong)):
        thu = phan_cong[:]
        thu[i] = "B" if thu[i] == "A" else "A"
        loi = hien_tai - makespan(thoi_luong, thu)
        if tot is None or loi > tot[0]:
            tot = (loi, i, thu)
    loi, i, thu = tot
    if loi <= 0:
        ly_do = "cuc-bo"
        break
    if loi < nguong:
        ly_do = "cai-thien-nho"
        break
    vong += 1
    phan_cong = thu
    hien_tai -= loi
    print(f"vong={vong};chuyen=viec{i + 1}->{thu[i]};makespan={hien_tai}")
print(f"dung={ly_do};makespan={hien_tai};phan-cong={''.join(phan_cong)}")`,
    },
    homework:
      'Ngoài sandbox, thêm lân cận "đổi chỗ hai việc giữa hai máy" và chạy lại trên 3,3,2,2,2 với phân công ABABB để thấy nó thoát được cực trị cục bộ. Đo số lần gọi makespan của hai loại lân cận và viết một đoạn ngắn: khi nào lân cận lớn hơn là đáng chi phí.',
    srsCards: [
      {
        hoi: 'Hill climbing dừng ở lý do cuc-bo nghĩa là gì?',
        dap: 'Không còn bước nào trong lân cận đang dùng làm mục tiêu tốt hơn; đó chỉ là cực trị cục bộ, chưa chắc tối ưu toàn cục.',
      },
      {
        hoi: 'Vì sao kiểm ngân sách vòng lặp trước khi tìm bước mới?',
        dap: 'Để không tốn thêm một lượt duyệt cả lân cận khi đã hết ngân sách, và để lý do dừng báo ra là đúng sự thật.',
      },
      {
        hoi: 'Ngưỡng cải thiện tối thiểu trong tìm kiếm cục bộ dùng để làm gì?',
        dap: 'Dừng khi bước tốt nhất mang lại quá ít so với chi phí tính toán thêm, thay vì chạy đến khi cạn ngân sách.',
      },
    ],
  },
]
