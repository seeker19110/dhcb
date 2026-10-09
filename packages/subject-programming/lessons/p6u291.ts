// P6-U291 — mathforcode-s3-m3,m4 (bổ sung 2026-10-09): định thức, ma trận suy biến trong bài toán
// bảo toàn luồng, và ma trận chuyển trạng thái (chuỗi Markov). Bổ sung cho p6-u159 (khử Gauss,
// power iteration) — không lặp lại hai topic đó.
// Đặc tả: docs/specs/2026-10-09-mathforcode-s3-s4-bo-sung-unit.md.
import type { ProgrammingLesson } from '../lessonTypes.js'

export const P6U291_LESSONS: ProgrammingLesson[] = [
  {
    id: 'p6-u291-l1',
    unitId: 'p6-u291',
    language: 'python',
    title: 'Định thức và ma trận suy biến — cân bằng luồng nhiều nút',
    hook: 'Viết phương trình bảo toàn luồng cho MỌI nút của mạng ống nước nghe rất chặt chẽ, vậy mà hệ đó luôn suy biến. Thiếu một phép đo thật thì không bộ giải nào cho ra lưu lượng duy nhất.',
    theory:
      'Định thức det(A) cho biết ma trận vuông có khả nghịch không: det ≠ 0 thì hệ A·x = b có đúng một nghiệm; det = 0 (ma trận suy biến) thì các hàng phụ thuộc tuyến tính, hệ vô nghiệm hoặc vô số nghiệm và không được chia cho det. Ma trận 2×2 có det = ad − bc; ma trận 3×3 tính bằng khai triển cofactor theo hàng đầu. Trong mạng nhiều nút, mỗi nút cho một phương trình bảo toàn luồng: tổng luồng vào bằng tổng luồng ra. Cộng hết các phương trình đó lại chỉ ra "tổng nguồn bằng tổng tiêu thụ", nên luôn có một phương trình thừa: det = 0. Cách sửa là thay một phương trình thừa bằng một phép đo thật (cảm biến đo được một nhánh). Khi det ≠ 0, quy tắc Cramer cho x_i = det(A_i)/det(A), với A_i là A đã thay cột i bằng vế phải. Nghiệm âm nghĩa là luồng chạy ngược chiều ống đã giả định, cần được cảnh báo chứ không được im lặng chấp nhận. Đây là MÔ PHỎNG Python thuần cho hệ 2×2, 3×3, không phải bộ giải mạng lưới thật hay bằng chứng ổn định số cho production.',
    workedExample: {
      code: `# Định thức 2×2: ad - bc. Bằng 0 nghĩa là hai hàng tỉ lệ nhau.
def det2(M):
    return M[0][0] * M[1][1] - M[0][1] * M[1][0]

# Hai phương trình độc lập: x + y = 10 và x - y = 2.
print("det hệ độc lập =", det2([[1, 1], [1, -1]]))
# Hàng thứ hai chỉ là nửa hàng thứ nhất.
print("det hệ suy biến =", det2([[2, 4], [1, 2]]))`,
      stdinLines: [],
    },
    predict: {
      code: `# Hệ số của ba phương trình bảo toàn luồng tại ba nút A, B, C.
A = [1, 1, 0]
B = [1, 0, -1]
C = [0, 1, 1]
print([a - b - c for a, b, c in zip(A, B, C)])`,
      question: 'Lấy hàng A trừ hàng B rồi trừ hàng C, kết quả in ra là gì?',
      choices: ['[0, 0, 0]', '[1, 1, 1]', '[2, 0, -2]', '[0, 1, 0]'],
      answerIndex: 0,
      explain:
        'A = B + C, tức một phương trình là tổ hợp của hai phương trình kia. Các hàng phụ thuộc tuyến tính nên định thức của hệ bằng 0.',
    },
    parsons: {
      prompt: 'Xếp hàm tính định thức 3×3 bằng khai triển cofactor theo hàng đầu.',
      lines: [
        'def det3(M):',
        '    a, b, c = M[0]',
        '    d, e, f = M[1]',
        '    g, h, i = M[2]',
        '    return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)',
      ],
    },
    make: {
      prompt:
        'MÔ PHỎNG cân bằng luồng. Đọc `n` (2 hoặc 3), rồi n dòng ma trận mở rộng, mỗi dòng n hệ số và một vế phải cách nhau dấu phẩy. Tính định thức của phần hệ số bằng khai triển cofactor và in `det=<3 chữ số>`. Nếu |det| < 1e-9 in `suy-bien` và dừng, không chia. Ngược lại giải bằng quy tắc Cramer và in `flow=x1,x2,...` (3 chữ số). Dòng cuối là `canh-bao-luong-am=<chỉ số từ 1, nối bằng dấu phẩy>` nếu có nghiệm âm, ngược lại `luong-hop-le`. Đổi -0.000 thành 0.000. n khác 2/3, hàng sai độ dài, chữ thay số, NaN/inf in `input-khong-hop-le`. Không gọi thư viện đại số tuyến tính.',
      starterCode: `n = int(input())

# MÔ PHỎNG định thức và quy tắc Cramer cho hệ rất nhỏ.`,
      testCases: [
        {
          stdinLines: ['2', '1,1,10', '1,-1,2'],
          expected: 'det=-2.000\nflow=6.000,4.000\nluong-hop-le',
          match: 'contains',
          hidden: false,
          label: 'hệ 2 ẩn có nghiệm duy nhất',
        },
        {
          stdinLines: ['3', '1,1,0,10', '1,0,-1,0', '0,1,1,10'],
          expected: 'det=0.000\nsuy-bien',
          match: 'contains',
          hidden: true,
          label: 'bảo toàn luồng ở mọi nút thì suy biến',
        },
        {
          stdinLines: ['3', '1,1,0,10', '1,0,-1,0', '0,0,1,4'],
          expected: 'det=-1.000\nflow=4.000,6.000,4.000\nluong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'thêm một phép đo thì có nghiệm duy nhất',
        },
        {
          stdinLines: ['3', '1,1,0,10', '1,0,-1,0', '0,0,1,12'],
          expected: 'flow=12.000,-2.000,12.000\ncanh-bao-luong-am=2',
          match: 'contains',
          hidden: true,
          label: 'luồng âm phải được cảnh báo',
        },
        {
          stdinLines: ['2', '2,4,6', '1,2,3'],
          expected: 'suy-bien',
          match: 'contains',
          hidden: true,
          label: 'hai hàng tỉ lệ nhau',
        },
        {
          stdinLines: ['4', '1,1,1,1,1', '1,1,1,1,1', '1,1,1,1,1', '1,1,1,1,1'],
          expected: 'input-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'n ngoài phạm vi',
        },
        {
          stdinLines: ['2', '1,1,10', '1,1'],
          expected: 'input-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'hàng thiếu vế phải',
        },
        {
          stdinLines: ['2', '1,2,3', 'nan,1,1'],
          expected: 'input-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'NaN bị từ chối',
        },
      ],
      hints: [
        'Tách ma trận mở rộng thành phần hệ số A và vế phải b.',
        'Định thức cofactor: xoá hàng đầu và cột j, nhân với dấu (-1)^j.',
        'Kiểm |det| nhỏ hơn ngưỡng TRƯỚC khi chia.',
        'A_i là A đã thay cột i bằng b.',
      ],
      sampleSolution: `import math

def det(M):
    # Khai triển cofactor theo hàng đầu; đủ cho ma trận 2×2, 3×3.
    if len(M) == 1:
        return M[0][0]
    tong = 0.0
    for j in range(len(M)):
        con = [hang[:j] + hang[j + 1:] for hang in M[1:]]
        tong += (-1) ** j * M[0][j] * det(con)
    return tong

def f3(x):
    x = round(x, 3)
    return "0.000" if x == 0 else f"{x:.3f}"

try:
    n = int(input().strip())
    if n not in {2, 3}:
        raise ValueError
    mo_rong = []
    for _ in range(n):
        hang = [float(x.strip()) for x in input().split(",")]
        if len(hang) != n + 1 or not all(math.isfinite(x) for x in hang):
            raise ValueError
        mo_rong.append(hang)
except (ValueError, EOFError):
    print("input-khong-hop-le")
    raise SystemExit
A = [hang[:n] for hang in mo_rong]
b = [hang[n] for hang in mo_rong]
d = det(A)
print("det=" + f3(d))
if abs(d) < 1e-9:
    print("suy-bien")
else:
    # Quy tắc Cramer: thay cột i bằng vế phải rồi chia cho det(A).
    x = []
    for i in range(n):
        Ai = [hang[:i] + [b[r]] + hang[i + 1:] for r, hang in enumerate(A)]
        x.append(det(Ai) / d)
    print("flow=" + ",".join(f3(v) for v in x))
    am = [str(i + 1) for i, v in enumerate(x) if v < -1e-9]
    print("canh-bao-luong-am=" + ",".join(am) if am else "luong-hop-le")`,
    },
    homework:
      'Ngoài sandbox, lập hệ bảo toàn luồng cho một mạng 5 nút có thật quanh bạn (ống nước, băng chuyền, luồng đơn hàng giữa các kho), kiểm bằng numpy rằng hệ đầy đủ có rank thiếu 1, rồi chọn phép đo nào cần thêm để có nghiệm duy nhất. Ghi lại ma trận, rank và output.',
    srsCards: [
      {
        hoi: 'Định thức bằng 0 nói gì về hệ A·x = b?',
        dap: 'Các hàng của A phụ thuộc tuyến tính nên hệ không có nghiệm duy nhất: hoặc vô nghiệm, hoặc vô số nghiệm.',
      },
      {
        hoi: 'Vì sao hệ bảo toàn luồng viết cho mọi nút luôn suy biến?',
        dap: 'Cộng mọi phương trình nút lại chỉ ra tổng nguồn bằng tổng tiêu thụ, nên một phương trình là tổ hợp của các phương trình còn lại.',
      },
      {
        hoi: 'Quy tắc Cramer tính ẩn thứ i như thế nào?',
        dap: 'x_i = det(A_i)/det(A), trong đó A_i là A đã thay cột i bằng vế phải; chỉ dùng được khi det(A) khác 0.',
      },
    ],
  },
  {
    id: 'p6-u291-l2',
    unitId: 'p6-u291',
    language: 'python',
    title: 'Ma trận chuyển trạng thái — chuỗi Markov và trạng thái dừng',
    hook: 'Một ma trận chuyển trạng thái có hàng cộng ra 1,4 vẫn nhân được, vẫn in ra các con số trông như xác suất. Lỗi nằm ở quy ước hàng hay cột, và máy không tự báo.',
    theory:
      'Chuỗi Markov mô tả hệ nhảy giữa các trạng thái, xác suất bước tiếp chỉ phụ thuộc trạng thái hiện tại. Bài này dùng quy ước HÀNG: P[i][j] là xác suất đi từ trạng thái i sang j, nên mọi phần tử không âm và MỖI HÀNG cộng bằng 1. Phân bố hiện tại là vector hàng p, bước tiếp là p·P, tức p_mới[j] = Σ p[i]·P[i][j]; sau k bước là p·P^k. Có tài liệu dùng quy ước cột (mỗi cột cộng bằng 1, nhân P·p); đem ma trận của quy ước này dùng theo quy ước kia là sai im lặng, nên phải kiểm tổng từng hàng trước khi lặp. Trạng thái dừng π thoả π·P = π: lặp thêm một bước không đổi gì. Phần dư max|p·P − p| đo xem p đã gần trạng thái dừng chưa. Không phải chuỗi nào cũng hội tụ: chuỗi tuần hoàn A→B→A dao động mãi. Đây là MÔ PHỎNG Python thuần trên vài trạng thái, không phải mô hình dự báo thật hay bằng chứng hội tụ tổng quát.',
    workedExample: {
      code: `# Thời tiết MÔ PHỎNG: hàng 0 = Nắng, hàng 1 = Mưa; P[i][j] = xác suất từ i sang j.
P = [[0.9, 0.1], [0.5, 0.5]]
p = [1.0, 0.0]  # hôm nay chắc chắn nắng
for ngay in range(1, 4):
    # Vector hàng nhân ma trận: p_moi[j] = tổng p[i] * P[i][j].
    p = [p[0] * P[0][0] + p[1] * P[1][0], p[0] * P[0][1] + p[1] * P[1][1]]
    print(ngay, [round(x, 4) for x in p])`,
      stdinLines: [],
    },
    predict: {
      code: `P = [[0.9, 0.1], [0.5, 0.5]]
print([round(sum(hang), 6) for hang in P])
print([round(P[0][j] + P[1][j], 6) for j in range(2)])`,
      question: 'Dòng đầu in tổng từng hàng, dòng sau in tổng từng cột. Output là gì?',
      choices: [
        '[1.0, 1.0]\n[1.4, 0.6]',
        '[1.4, 0.6]\n[1.0, 1.0]',
        '[1.0, 1.0]\n[1.0, 1.0]',
        '[0.9, 0.5]\n[1.4, 0.6]',
      ],
      answerIndex: 0,
      explain:
        'Ma trận này theo quy ước hàng: mỗi hàng cộng bằng 1, còn tổng cột là 1,4 và 0,6. Dùng nó như ma trận quy ước cột sẽ cho "xác suất" không còn cộng bằng 1.',
    },
    parsons: {
      prompt: 'Xếp hàm kiểm một ma trận chuyển trạng thái theo quy ước hàng.',
      lines: [
        'def kiem_ma_tran(P):',
        '    for i, hang in enumerate(P):',
        '        if any(x < 0 for x in hang):',
        '            return f"xac-suat-am:{i + 1}"',
        '        if abs(sum(hang) - 1.0) > 1e-9:',
        '            return f"hang-khong-tong-1:{i + 1}"',
        '    return "hop-le"',
      ],
    },
    make: {
      prompt:
        'MÔ PHỎNG chuỗi Markov theo quy ước hàng. Đọc `n` (2 đến 4), n dòng ma trận P (mỗi dòng n xác suất cách nhau dấu phẩy), một dòng phân bố ban đầu p, rồi số bước k (0 đến 200). Kiểm từng hàng theo thứ tự: có phần tử âm in `xac-suat-am:<hàng từ 1>`; tổng hàng lệch 1 quá 1e-9 in `hang-khong-tong-1:<hàng từ 1>`. p âm hoặc tổng lệch 1 in `phan-bo-dau-khong-hop-le`. Hợp lệ thì lặp p = p·P đúng k lần, in `buoc=<k>;p=<4 chữ số, nối bằng dấu phẩy>`, rồi `phan-du=<6 chữ số>` là max|p·P − p| và `trang-thai-dung=yes` nếu phần dư ≤ 1e-6, ngược lại `trang-thai-dung=no`. Sai số lượng phần tử, chữ thay số, NaN/inf, n hoặc k ngoài phạm vi in `input-khong-hop-le`. Không phải mô hình dự báo thật.',
      starterCode: `n = int(input())

# MÔ PHỎNG chuỗi Markov; P[i][j] là xác suất từ i sang j.`,
      testCases: [
        {
          stdinLines: ['2', '0.9,0.1', '0.5,0.5', '1,0', '2'],
          expected: 'buoc=2;p=0.8600,0.1400\nphan-du=0.016000\ntrang-thai-dung=no',
          match: 'contains',
          hidden: false,
          label: 'hai ngày sau khi trời nắng',
        },
        {
          stdinLines: ['2', '0.9,0.1', '0.5,0.5', '1,0', '50'],
          expected: 'buoc=50;p=0.8333,0.1667\nphan-du=0.000000\ntrang-thai-dung=yes',
          match: 'contains',
          hidden: true,
          label: 'lặp đủ lâu thì tới trạng thái dừng',
        },
        {
          stdinLines: ['2', '0.9,0.1', '0.5,0.5', '0.833333333333,0.166666666667', '0'],
          expected: 'buoc=0;p=0.8333,0.1667\nphan-du=0.000000\ntrang-thai-dung=yes',
          match: 'contains',
          hidden: true,
          label: 'k bằng 0 vẫn kiểm trạng thái dừng',
        },
        {
          stdinLines: ['2', '0.9,0.5', '0.1,0.5', '1,0', '3'],
          expected: 'hang-khong-tong-1:1',
          match: 'contains',
          hidden: true,
          label: 'nhầm quy ước cột bị bắt',
        },
        {
          stdinLines: ['2', '1.2,-0.2', '0.5,0.5', '1,0', '3'],
          expected: 'xac-suat-am:1',
          match: 'contains',
          hidden: true,
          label: 'hàng cộng bằng 1 nhưng có xác suất âm',
        },
        {
          stdinLines: ['2', '0,1', '1,0', '1,0', '3'],
          expected: 'buoc=3;p=0.0000,1.0000\nphan-du=1.000000\ntrang-thai-dung=no',
          match: 'contains',
          hidden: true,
          label: 'chuỗi tuần hoàn không hội tụ',
        },
        {
          stdinLines: ['2', '0.9,0.1', '0.5,0.5', '0.7,0.7', '3'],
          expected: 'phan-bo-dau-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'phân bố ban đầu không cộng bằng 1',
        },
        {
          stdinLines: ['2', '0.9,0.1', '0.5,0.5', '1,0', '-1'],
          expected: 'input-khong-hop-le',
          match: 'contains',
          hidden: true,
          label: 'số bước âm bị từ chối',
        },
      ],
      hints: [
        'Viết hàm đọc một dòng thành đúng n số hữu hạn.',
        'Kiểm phần tử âm trước, tổng hàng sau, cho từng hàng theo thứ tự.',
        'p_moi[j] = tổng p[i] * P[i][j] với i chạy trên mọi trạng thái.',
        'Phần dư tính bằng một bước NỮA sau k bước, không đổi p đã in.',
      ],
      sampleSolution: `import math

def doc_hang(dong, n):
    v = [float(x.strip()) for x in dong.split(",")]
    if len(v) != n or not all(math.isfinite(x) for x in v):
        raise ValueError
    return v

try:
    n = int(input().strip())
    if not 2 <= n <= 4:
        raise ValueError
    P = [doc_hang(input(), n) for _ in range(n)]
    p = doc_hang(input(), n)
    k = int(input().strip())
    if not 0 <= k <= 200:
        raise ValueError
except (ValueError, EOFError):
    print("input-khong-hop-le")
    raise SystemExit
# Quy ước HÀNG: P[i][j] = xác suất đi từ trạng thái i sang j, nên mỗi HÀNG phải cộng bằng 1.
loi = None
for i, hang in enumerate(P):
    if any(x < 0 for x in hang):
        loi = f"xac-suat-am:{i + 1}"
        break
    if abs(sum(hang) - 1.0) > 1e-9:
        loi = f"hang-khong-tong-1:{i + 1}"
        break
if loi:
    print(loi)
elif any(x < 0 for x in p) or abs(sum(p) - 1.0) > 1e-9:
    print("phan-bo-dau-khong-hop-le")
else:
    def buoc(q):
        # Vector hàng nhân ma trận: q_moi[j] = tổng q[i] * P[i][j].
        return [sum(q[i] * P[i][j] for i in range(n)) for j in range(n)]
    for _ in range(k):
        p = buoc(p)
    tiep = buoc(p)
    phan_du = max(abs(tiep[j] - p[j]) for j in range(n))
    print(f"buoc={k};p=" + ",".join(f"{x:.4f}" for x in p))
    print(f"phan-du={phan_du:.6f}")
    print("trang-thai-dung=yes" if phan_du <= 1e-6 else "trang-thai-dung=no")`,
    },
    homework:
      'Ngoài sandbox, ước lượng ma trận chuyển trạng thái từ một nhật ký thật (ví dụ chuỗi màn hình người dùng đi qua trong app), tính trạng thái dừng bằng numpy (vector riêng ứng với giá trị riêng 1) và so với kết quả lặp tay. Ghi rõ quy ước hàng hay cột đã dùng.',
    srsCards: [
      {
        hoi: 'Theo quy ước hàng, ma trận chuyển trạng thái hợp lệ phải thoả điều kiện gì?',
        dap: 'Mọi phần tử không âm và mỗi hàng cộng bằng 1, vì P[i][j] là xác suất đi từ trạng thái i sang j.',
      },
      {
        hoi: 'Trạng thái dừng của chuỗi Markov là gì?',
        dap: 'Phân bố π thoả π·P = π: lặp thêm một bước chuyển trạng thái không làm phân bố thay đổi.',
      },
      {
        hoi: 'Có phải chuỗi Markov nào lặp đủ lâu cũng hội tụ không?',
        dap: 'Không; chuỗi tuần hoàn như A→B→A dao động mãi, phần dư không bao giờ về 0.',
      },
    ],
  },
]
