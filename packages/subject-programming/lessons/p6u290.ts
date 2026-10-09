// P6-U290 — mathforcode-s3-m1,m2 (bổ sung 2026-10-09): va chạm/phản xạ vector trong game 2D và
// nhân ma trận bằng tay theo quy ước hàng-cột. Hai bài này dạy các topic mà p6-u158 chưa phủ.
// Đặc tả: docs/specs/2026-10-09-mathforcode-s3-s4-bo-sung-unit.md.
import type { ProgrammingLesson } from '../lessonTypes.js'

export const P6U290_LESSONS: ProgrammingLesson[] = [
  {
    id: 'p6-u290-l1',
    unitId: 'p6-u290',
    language: 'python',
    title: 'Va chạm hai hình tròn và phản xạ vận tốc bằng vector',
    hook: 'Quả bóng xuyên qua tường hoặc rung giật dính vào vật cản là hai lỗi game kinh điển. Cả hai đều đến từ việc phản xạ sai hướng hoặc phản xạ hai lần liên tiếp.',
    theory:
      'Hướng di chuyển là vector vận tốc đã chuẩn hoá: muốn đi từ điểm P tới điểm Q thì lấy Q − P rồi chia cho độ dài, và phải chặn sớm khi độ dài bằng 0. Hai hình tròn tâm C1, C2 bán kính r1, r2 chạm nhau khi khoảng cách hai tâm nhỏ hơn hoặc bằng r1 + r2. Pháp tuyến va chạm là n = (C1 − C2) / |C1 − C2|, vector đơn vị chỉ từ vật cản về phía quả bóng. Công thức phản xạ là v′ = v − 2(v·n)n: phần vận tốc dọc theo pháp tuyến bị lật dấu, phần tiếp tuyến giữ nguyên, nên tốc độ không đổi. Chỉ phản xạ khi v·n < 0 (bóng đang lao vào vật cản); nếu v·n ≥ 0 thì bóng đã đang tách ra, phản xạ thêm lần nữa sẽ kéo nó ngược vào trong và gây rung giật. Hai tâm trùng nhau thì pháp tuyến không xác định, phải từ chối thay vì chia cho 0. Đây là MÔ PHỎNG Python thuần trên một khung hình, không phải physics engine thật hay bằng chứng game chạy đúng ở mọi tốc độ khung hình.',
    workedExample: {
      code: `# Bóng rơi xuống sàn ngang: pháp tuyến đơn vị của sàn hướng lên là (0, 1).
v = [3.0, -4.0]
n = [0.0, 1.0]
# Thành phần vận tốc dọc theo pháp tuyến (âm nghĩa là đang lao vào sàn).
dot = v[0] * n[0] + v[1] * n[1]
# Lật dấu phần pháp tuyến, giữ nguyên phần tiếp tuyến.
r = [v[0] - 2 * dot * n[0], v[1] - 2 * dot * n[1]]
print("dot =", dot)
print("phản xạ =", r)`,
      stdinLines: [],
    },
    predict: {
      code: `v = [2, -1]
n = [0, 1]
d = v[0] * n[0] + v[1] * n[1]
print([v[0] - 2 * d * n[0], v[1] - 2 * d * n[1]])`,
      question: 'Vận tốc (2, −1) phản xạ trên sàn có pháp tuyến (0, 1) thành vector nào?',
      choices: ['[2, 1]', '[2, -1]', '[-2, 1]', '[-2, -1]'],
      answerIndex: 0,
      explain:
        'v·n = −1, nên v′ = (2, −1) − 2·(−1)·(0, 1) = (2, 1): phần dọc pháp tuyến đổi dấu, phần nằm ngang giữ nguyên.',
    },
    parsons: {
      prompt: 'Xếp hàm phản xạ chỉ áp dụng khi bóng đang lao vào vật cản.',
      lines: [
        'def phan_xa(v, n):',
        '    dot = v[0] * n[0] + v[1] * n[1]',
        '    if dot >= 0:',
        '        return v',
        '    return [v[0] - 2 * dot * n[0], v[1] - 2 * dot * n[1]]',
      ],
    },
    make: {
      prompt:
        'MÔ PHỎNG một khung hình va chạm. Đọc ba dòng: bóng `x,y,r`, vận tốc `vx,vy`, vật cản tròn đứng yên `x,y,R`. In `distance=<3 chữ số>` là khoảng cách hai tâm. Nếu khoảng cách bằng 0 in thêm `tam-trung-nhau`. Nếu khoảng cách lớn hơn r + R in `collision=no`. Ngược lại in `collision=yes`, rồi `normal=nx,ny` (pháp tuyến đơn vị từ vật cản về bóng) và `reflect=vx,vy` theo v − 2(v·n)n; nếu v·n ≥ 0 (bóng đã đang tách ra) thì in `reflect=skip-separating`. Mọi số in 3 chữ số thập phân. Thiếu thành phần, chữ thay số, NaN/inf, bán kính không dương in `input-khong-hop-le`. Không phải physics engine thật.',
      starterCode: `import math

dong_bong = input().strip()
dong_van_toc = input().strip()
dong_vat_can = input().strip()

# MÔ PHỎNG một khung hình; không dùng thư viện vật lý.`,
      testCases: [
        {
          stdinLines: ['0,0,1', '1,0', '1.5,0,1'],
          expected: 'distance=1.500\ncollision=yes\nnormal=-1.000,0.000\nreflect=-1.000,0.000',
          match: 'contains',
          hidden: false,
          label: 'bóng lao thẳng vào vật cản thì bật ngược',
        },
        {
          stdinLines: ['0,0,1', '1,1', '1.2,0,0.5'],
          expected: 'reflect=-1.000,1.000',
          match: 'contains',
          hidden: true,
          label: 'đi chéo: chỉ phần dọc pháp tuyến đổi dấu',
        },
        {
          stdinLines: ['3,4,1', '0,-2', '0,0,4'],
          expected: 'normal=0.600,0.800\nreflect=1.920,0.560',
          match: 'contains',
          hidden: true,
          label: 'pháp tuyến xiên vẫn giữ nguyên tốc độ',
        },
        {
          stdinLines: ['0,0,1', '1,0', '5,0,1'],
          expected: 'distance=5.000\ncollision=no',
          match: 'contains',
          hidden: true,
          label: 'xa nhau thì không va chạm',
        },
        {
          stdinLines: ['0,0,1', '-1,0', '1.5,0,1'],
          expected: 'reflect=skip-separating',
          match: 'contains',
          hidden: true,
          label: 'đang tách ra thì không phản xạ lần nữa',
        },
        {
          stdinLines: ['1,1,1', '1,0', '1,1,1'],
          expected: 'tam-trung-nhau',
          match: 'contains',
          hidden: true,
          label: 'hai tâm trùng nhau không có pháp tuyến',
        },
        {
          stdinLines: ['0,0,0', '1,0', '1,0,1'],
          expected: 'input-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'bán kính 0 bị từ chối',
        },
        {
          stdinLines: ['0,0,1', 'nan,0', '1,0,1'],
          expected: 'input-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'NaN không được lan vào vận tốc',
        },
      ],
      hints: [
        'Viết hàm đọc một dòng thành đúng k số hữu hạn, sai thì trả None.',
        'Kiểm khoảng cách bằng 0 TRƯỚC khi chia để lấy pháp tuyến.',
        'Tính v·n trước; chỉ phản xạ khi nó âm.',
        'Làm tròn rồi đổi -0.000 thành 0.000 để output ổn định.',
      ],
      sampleSolution: `import math

def doc(dong, so_phan):
    try:
        v = [float(x.strip()) for x in dong.split(",")]
    except ValueError:
        return None
    if len(v) != so_phan or not all(math.isfinite(x) for x in v):
        return None
    return v

def f3(x):
    x = round(x, 3)
    return "0.000" if x == 0 else f"{x:.3f}"

bong = doc(input().strip(), 3)
van_toc = doc(input().strip(), 2)
vat_can = doc(input().strip(), 3)
if bong is None or van_toc is None or vat_can is None or bong[2] <= 0 or vat_can[2] <= 0:
    print("input-khong-hop-le")
else:
    dx = bong[0] - vat_can[0]
    dy = bong[1] - vat_can[1]
    khoang_cach = math.sqrt(dx * dx + dy * dy)
    print("distance=" + f3(khoang_cach))
    if khoang_cach == 0:
        print("tam-trung-nhau")
    elif khoang_cach > bong[2] + vat_can[2]:
        print("collision=no")
    else:
        print("collision=yes")
        nx, ny = dx / khoang_cach, dy / khoang_cach
        print("normal=" + f3(nx) + "," + f3(ny))
        dot = van_toc[0] * nx + van_toc[1] * ny
        if dot >= 0:
            print("reflect=skip-separating")
        else:
            rx = van_toc[0] - 2 * dot * nx
            ry = van_toc[1] - 2 * dot * ny
            print("reflect=" + f3(rx) + "," + f3(ry))`,
    },
    homework:
      'Ngoài sandbox, dựng một vòng lặp game nhỏ (pygame hoặc canvas) cho bóng nảy giữa ba vật cản tròn, ghi lại một trường hợp bóng xuyên vật cản khi bước thời gian quá lớn và giải thích vì sao kiểm va chạm theo từng khung hình bỏ sót nó. Simulator một khung hình không chứng minh được điều đó.',
    srsCards: [
      {
        hoi: 'Công thức phản xạ vận tốc v qua pháp tuyến đơn vị n là gì?',
        dap: 'v′ = v − 2(v·n)n: phần dọc pháp tuyến bị lật dấu, phần tiếp tuyến giữ nguyên nên tốc độ không đổi.',
      },
      {
        hoi: 'Vì sao chỉ phản xạ khi tích v·n âm?',
        dap: 'v·n ≥ 0 nghĩa là bóng đã đang tách khỏi vật cản; phản xạ thêm sẽ kéo nó ngược vào trong và gây rung giật.',
      },
      {
        hoi: 'Hai hình tròn chạm nhau khi nào?',
        dap: 'Khi khoảng cách giữa hai tâm nhỏ hơn hoặc bằng tổng hai bán kính r1 + r2.',
      },
    ],
  },
  {
    id: 'p6-u290-l2',
    unitId: 'p6-u290',
    language: 'python',
    title: 'Nhân ma trận bằng tay — quy ước hàng-cột và kiểm shape',
    hook: 'Nhân ma trận 2×3 với 2×2 không có nghĩa, nhưng code viết ẩu vẫn có thể in ra một con số. Đổi thứ tự xoay và co giãn cũng ra hình khác hẳn.',
    theory:
      'Tích C = A·B chỉ xác định khi số cột của A bằng số hàng của B: A cỡ m×n nhân B cỡ n×p ra C cỡ m×p, với C[i][j] = Σ A[i][k]·B[k][j] (hàng i của A gặp cột j của B). Vector hàng 1×3 nhân vector cột 3×1 ra một số (1×1), nhưng đổi thứ tự lại ra ma trận 3×3, nên quy ước hàng-cột là một phần của hợp đồng chứ không phải chi tiết trình bày. Trong mặt phẳng, ma trận xoay góc θ ngược chiều kim đồng hồ là [[cos θ, −sin θ], [sin θ, cos θ]]; co giãn là [[sx, 0], [0, sy]]; phản chiếu qua trục x là [[1, 0], [0, −1]], qua trục y là [[−1, 0], [0, 1]]. Với vector cột, R·S nghĩa là co giãn trước rồi xoay sau, và nói chung R·S khác S·R. Đây là MÔ PHỎNG Python thuần cho ma trận nhỏ, không phải thư viện đại số tuyến tính hay engine đồ hoạ thật.',
    workedExample: {
      code: `import math

# Nhân ma trận bằng tay: C[i][j] = tổng A[i][k] * B[k][j].
def nhan(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(len(B))) for j in range(len(B[0]))] for i in range(len(A))]

goc = math.radians(90)
# Làm tròn để cos 90° không in thành 6e-17.
R = [[round(math.cos(goc), 6), round(-math.sin(goc), 6)], [round(math.sin(goc), 6), round(math.cos(goc), 6)]]
S = [[2, 0], [0, 1]]
print("R·S =", nhan(R, S))
print("S·R =", nhan(S, R))`,
      stdinLines: [],
    },
    predict: {
      code: `A = [[1, 2, 3]]
B = [[4], [5], [6]]
C = [[sum(A[i][k] * B[k][j] for k in range(3)) for j in range(1)] for i in range(1)]
print(len(C), len(C[0]), C)`,
      question: 'Vector hàng 1×3 nhân vector cột 3×1: số hàng, số cột và kết quả in ra là gì?',
      choices: ['1 1 [[32]]', '3 3 [[32]]', '1 3 [[4, 10, 18]]', '3 1 [[32]]'],
      answerIndex: 0,
      explain:
        '1×3 nhân 3×1 ra 1×1, phần tử duy nhất là 1·4 + 2·5 + 3·6 = 32. Đổi thứ tự (3×1 nhân 1×3) mới ra ma trận 3×3.',
    },
    parsons: {
      prompt: 'Xếp hàm nhân ma trận có kiểm shape trước khi tính.',
      lines: [
        'def nhan(A, B):',
        '    if len(A[0]) != len(B):',
        '        return None',
        '    C = []',
        '    for i in range(len(A)):',
        '        C.append([sum(A[i][k] * B[k][j] for k in range(len(B))) for j in range(len(B[0]))])',
        '    return C',
      ],
    },
    make: {
      prompt:
        'MÔ PHỎNG nhân hai ma trận A·B. Đọc hai dòng, mỗi dòng là một ma trận: hoặc viết tay theo hàng (hàng cách nhau `;`, phần tử cách nhau `,`, ví dụ `1,2;3,4` và vector cột `1;0`), hoặc tên phép biến đổi 2×2: `rot:<độ>` (xoay ngược chiều kim đồng hồ), `scale:<sx>:<sy>`, `flip:x`, `flip:y`. Nếu số cột của A khác số hàng của B in `shape-khong-khop:<m>x<n>*<n2>x<p>`. Ngược lại in `shape=<m>x<p>` và `C=` các hàng nối bằng `;`, phần tử nối bằng `,`, mỗi số 3 chữ số thập phân (đổi -0.000 thành 0.000). Hàng lệch độ dài, ô trống, chữ thay số, NaN/inf in `input-khong-hop-le`. Không gọi thư viện đại số tuyến tính.',
      starterCode: `import math

dong_a = input().strip()
dong_b = input().strip()

# MÔ PHỎNG nhân ma trận bằng ba vòng lặp; không dùng thư viện ngoài.`,
      testCases: [
        {
          stdinLines: ['1,2;3,4', '5,6;7,8'],
          expected: 'shape=2x2\nC=19.000,22.000;43.000,50.000',
          match: 'contains',
          hidden: false,
          label: 'nhân hai ma trận 2×2',
        },
        {
          stdinLines: ['rot:30', '1;0'],
          expected: 'shape=2x1\nC=0.866;0.500',
          match: 'contains',
          hidden: true,
          label: 'xoay vector cột một góc bất kì',
        },
        {
          stdinLines: ['rot:90', 'scale:2:1'],
          expected: 'C=0.000,-1.000;2.000,0.000',
          match: 'contains',
          hidden: true,
          label: 'xoay sau khi co giãn',
        },
        {
          stdinLines: ['scale:2:1', 'rot:90'],
          expected: 'C=0.000,-2.000;1.000,0.000',
          match: 'contains',
          hidden: true,
          label: 'đổi thứ tự cho ma trận khác',
        },
        {
          stdinLines: ['flip:y', '3;4'],
          expected: 'shape=2x1\nC=-3.000;4.000',
          match: 'contains',
          hidden: true,
          label: 'phản chiếu qua trục y',
        },
        {
          stdinLines: ['1,2,3', '4;5;6'],
          expected: 'shape=1x1\nC=32.000',
          match: 'contains',
          hidden: true,
          label: 'hàng nhân cột ra một số',
        },
        {
          stdinLines: ['1,2,3;4,5,6', '1,2;3,4'],
          expected: 'shape-khong-khop:2x3*2x2',
          match: 'contains',
          hidden: true,
          label: 'shape không khớp bị từ chối',
        },
        {
          stdinLines: ['1,2;3', '1;1'],
          expected: 'input-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'hàng lệch độ dài',
        },
        {
          stdinLines: ['rot:abc', '1;0'],
          expected: 'input-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'góc phải là số',
        },
      ],
      hints: [
        'Đổi mọi dạng đầu vào về cùng một kiểu: danh sách các hàng.',
        'Kiểm mọi hàng cùng độ dài trước khi so shape.',
        'Shape hợp lệ khi len(A[0]) == len(B).',
        'Dùng math.radians để đổi độ sang radian.',
      ],
      sampleSolution: `import math

def doc_ma_tran(dong):
    # Phép biến đổi có tên trả về ma trận 2×2; còn lại đọc hàng ";" và phần tử ",".
    try:
        if dong.startswith("rot:"):
            goc = math.radians(float(dong[4:]))
            if not math.isfinite(goc):
                return None
            return [[math.cos(goc), -math.sin(goc)], [math.sin(goc), math.cos(goc)]]
        if dong.startswith("scale:"):
            phan = dong.split(":")
            if len(phan) != 3:
                return None
            sx, sy = float(phan[1]), float(phan[2])
            if not (math.isfinite(sx) and math.isfinite(sy)):
                return None
            return [[sx, 0.0], [0.0, sy]]
        if dong == "flip:x":
            return [[1.0, 0.0], [0.0, -1.0]]
        if dong == "flip:y":
            return [[-1.0, 0.0], [0.0, 1.0]]
        M = [[float(x.strip()) for x in hang.split(",")] for hang in dong.split(";")]
    except ValueError:
        return None
    if not M or not M[0] or any(len(hang) != len(M[0]) for hang in M):
        return None
    if not all(math.isfinite(x) for hang in M for x in hang):
        return None
    return M

def f3(x):
    x = round(x, 3)
    return "0.000" if x == 0 else f"{x:.3f}"

A = doc_ma_tran(input().strip())
B = doc_ma_tran(input().strip())
if A is None or B is None:
    print("input-khong-hop-le")
else:
    m, n = len(A), len(A[0])
    n2, p = len(B), len(B[0])
    if n != n2:
        print(f"shape-khong-khop:{m}x{n}*{n2}x{p}")
    else:
        # C[i][j] = tổng A[i][k] * B[k][j]: hàng i của A gặp cột j của B.
        C = [[sum(A[i][k] * B[k][j] for k in range(n)) for j in range(p)] for i in range(m)]
        print(f"shape={m}x{p}")
        print("C=" + ";".join(",".join(f3(x) for x in hang) for hang in C))`,
    },
    homework:
      'Ngoài sandbox, so bản nhân ma trận tự cài với numpy trên 20 cặp ma trận có hạt giống cố định, ghi sai số tuyệt đối lớn nhất; rồi vẽ một hình vuông trước và sau khi áp R·S và S·R. Simulator không thay phép đối chiếu đó.',
    srsCards: [
      {
        hoi: 'Khi nào tích ma trận A·B được xác định?',
        dap: 'Khi số cột của A bằng số hàng của B; A cỡ m×n nhân B cỡ n×p ra ma trận m×p.',
      },
      {
        hoi: 'Ma trận xoay góc θ ngược chiều kim đồng hồ trong mặt phẳng là gì?',
        dap: '[[cos θ, −sin θ], [sin θ, cos θ]], áp lên vector cột đặt bên phải ma trận.',
      },
      {
        hoi: 'Với vector cột, tích R·S áp phép biến đổi nào trước?',
        dap: 'S được áp trước vì nằm sát vector hơn, rồi mới tới R; đổi thành S·R nói chung ra kết quả khác.',
      },
    ],
  },
]
