// lessons/cv1u2.ts — Giai đoạn 2 "CNN" của khoá ngắn "Deep Learning for Computer Vision
// cơ bản" (docs/specs/2026-09-01-cv1-bai-hoc-chi-tiet.md §3).
//
// unitId 'cv1-u2' KHÔNG nằm trong curriculum.ts — là "unit ảo" của tầng khoá ngắn, được
// lessons.test.ts công nhận qua SHORT_COURSES (courses/registry.ts), đúng cơ chế 'git-u*'.
//
// Luật soạn riêng của khoá: convolution/pooling/vòng huấn luyện đều TỰ CÀI bằng Python thuần
// (không numpy/torch); ma trận in ra mỗi hàng một dòng, các số cách nhau MỘT dấu cách.
import type { ProgrammingLesson } from '../lessonTypes.js'

export const CV1_U2_LESSONS: ProgrammingLesson[] = [
  {
    id: 'cv1-u2-l1',
    unitId: 'cv1-u2',
    language: 'python',
    title: 'Convolution 2D — tự cài bộ dò cạnh',
    hook: 'Nếu duỗi ảnh 8x8 thành 64 số rồi ném vào MLP, mạng mất sạch thông tin "ô này nằm cạnh ô kia". Convolution giữ lại điều đó: nó trượt một khuôn nhỏ (kernel) khắp ảnh, mỗi lần chỉ nhìn một mẩu 3x3. Chạy đúng một kernel dò cạnh lên ảnh, bạn sẽ thấy đường viền hiện ra như phép thuật.',
    theory:
      'CONVOLUTION 2D (tích chập) = trượt một KERNEL (bộ lọc, ma trận nhỏ thường 3x3) khắp ảnh; ở mỗi vị trí, nhân từng ô kernel với ô ảnh tương ứng rồi cộng tất cả lại thành MỘT số của ma trận kết quả (gọi là FEATURE MAP — bản đồ đặc trưng).\n\nCông thức tại vị trí (i, j) với kernel 3x3:\n  out[i][j] = tổng_{u=0..2} tổng_{v=0..2} anh[i+u][j+v] * kernel[u][v]\n\nKÍCH THƯỚC đầu ra (chưa padding, bước nhảy 1): ảnh N x N với kernel K x K cho ra (N-K+1) x (N-K+1). Ảnh 5x5 với kernel 3x3 → 3x3. Ảnh bị "co lại" ở viền vì kernel không trượt ra ngoài mép được — bài sau chữa bằng padding.\n\nKERNEL DÒ CẠNH DỌC dùng trong bài này:\n  [[-1, 0, 1],\n   [-1, 0, 1],\n   [-1, 0, 1]]\nĐọc nó bằng lời: "lấy tổng cột phải TRỪ tổng cột trái". Vùng ảnh đồng màu → hai bên bằng nhau → kết quả 0. Vùng có cạnh tối-sang → chênh lệch lớn → kết quả dương to. Cạnh sáng-tối → âm to. Vậy dấu cho biết CHIỀU của cạnh, độ lớn cho biết cạnh MẠNH tới đâu.\n\nBA TÍNH CHẤT khiến convolution thống trị thị giác máy tính:\n1. CỤC BỘ — mỗi đầu ra chỉ phụ thuộc một mẩu ảnh nhỏ, đúng với thực tế "cạnh là hiện tượng địa phương".\n2. CHIA SẺ TRỌNG SỐ — cùng một kernel dùng cho mọi vị trí, nên số tham số bé tí và mẫu học được ở góc trên áp dụng luôn cho góc dưới.\n3. TƯƠNG ĐƯƠNG TỊNH TIẾN (translation equivariance) — vật dịch sang phải bao nhiêu thì bản đồ đặc trưng dịch sang phải bấy nhiêu, vì cùng một kernel tính ở mọi vị trí. Đây KHÔNG phải BẤT BIẾN (invariance — kết quả giữ nguyên dù vật dịch). Ảnh trong bài cho mỗi hàng "27 27 0"; dời cạnh sang phải một cột (0,0,0,9,9) cho "0 27 27" — cùng mẫu, dời theo.\n\nGIỚI HẠN Ở VIỀN: tính chất trên chỉ đúng trọn khi vật còn nằm trong vùng kernel quét được. Dời cạnh sang TRÁI một cột (0,9,9,9,9) cho "27 0 0": một số 27 rơi mất ở mép vì không padding. Muốn kết luận gần bất biến kiểu "có cạnh dọc ở đâu đó" cần thêm bước gom như pooling ở bài sau.\n\nGHI CHÚ THUẬT NGỮ: công thức trên không lật kernel, nên nói chặt chẽ là TƯƠNG QUAN CHÉO (cross-correlation). PyTorch, TensorFlow vẫn gọi phép này là convolution; kernel là trọng số được học nên lật hay không không đổi điều mạng học được.\n\nTrong CNN thật, kernel KHÔNG do người viết ra — chúng là trọng số được HỌC bằng gradient descent. Điều thú vị đã được kiểm chứng nhiều lần: lớp đầu tiên của mạng học ảnh, sau khi huấn luyện, gần như luôn tự mọc ra các kernel dò cạnh giống hệt cái bạn gõ tay hôm nay.',
    workedExample: {
      code: `# Convolution 2D: kernel do canh doc truot tren anh 5x5
anh = [[0, 0, 9, 9, 9],
       [0, 0, 9, 9, 9],
       [0, 0, 9, 9, 9],
       [0, 0, 9, 9, 9],
       [0, 0, 9, 9, 9]]

kernel = [[-1, 0, 1],
          [-1, 0, 1],
          [-1, 0, 1]]      # cot phai TRU cot trai

N = 5
K = 3
kich_thuoc_ra = N - K + 1   # 5 - 3 + 1 = 3

for i in range(kich_thuoc_ra):
    hang_ra = []
    for j in range(kich_thuoc_ra):
        tong = 0
        for u in range(K):
            for v in range(K):
                tong += anh[i + u][j + v] * kernel[u][v]
        hang_ra.append(tong)
    # in mot hang: cac so cach nhau MOT dau cach
    print(" ".join(str(v) for v in hang_ra))`,
      stdinLines: [],
    },
    predict: {
      code: `manh = [[5, 5, 5],\n        [5, 5, 5],\n        [5, 5, 5]]\nkernel = [[-1, 0, 1],\n          [-1, 0, 1],\n          [-1, 0, 1]]\ntong = 0\nfor u in range(3):\n    for v in range(3):\n        tong += manh[u][v] * kernel[u][v]\nprint(tong)`,
      question: 'Kernel dò cạnh chạy trên một mẩu ảnh ĐỒNG MÀU — in ra gì?',
      choices: ['0', '45', '15', '-15'],
      answerIndex: 0,
      explain:
        'Cột phải (5+5+5 = 15) trừ cột trái (15) = 0; cột giữa nhân 0 nên không đóng góp. Vùng phẳng cho 0 chính là điều ta muốn: bộ dò cạnh chỉ "kêu" ở chỗ có cạnh, im lặng ở chỗ đồng màu.',
    },
    parsons: {
      prompt:
        'Xếp đúng bốn vòng lặp lồng nhau của convolution: vị trí (i, j) ở ngoài, ô kernel (u, v) ở trong.',
      lines: [
        'for i in range(N - K + 1):',
        '    hang_ra = []',
        '    for j in range(N - K + 1):',
        '        tong = 0',
        '        for u in range(K):',
        '            for v in range(K):',
        '                tong += anh[i + u][j + v] * kernel[u][v]',
        '        hang_ra.append(tong)',
        '    print(" ".join(str(v) for v in hang_ra))',
      ],
    },
    make: {
      prompt:
        'Tự cài convolution 2D với kernel dò cạnh dọc CỐ ĐỊNH:\n  [[-1, 0, 1],\n   [-1, 0, 1],\n   [-1, 0, 1]]\n\nChương trình đọc MỘT dòng input(): 25 số nguyên cách nhau dấu phẩy — ảnh 5x5 lưu phẳng theo từng hàng (5 số đầu là hàng 0).\n\nTrượt kernel với bước nhảy 1, không padding → bản đồ đặc trưng 3x3. In ĐÚNG 3 dòng, mỗi dòng 3 số nguyên cách nhau MỘT dấu cách.\n\nVí dụ ảnh "0,0,9,9,9" lặp 5 hàng → mỗi dòng kết quả là "27 27 0".',
      starterCode: `phang = [int(v) for v in input("Anh 5x5 phang: ").split(",")]\nanh = [phang[i * 5:(i + 1) * 5] for i in range(5)]\nkernel = [[-1, 0, 1],\n          [-1, 0, 1],\n          [-1, 0, 1]]\n# Truot kernel: 3x3 vi tri, moi vi tri cong don 9 tich. In moi hang mot dong.\n`,
      testCases: [
        {
          stdinLines: ['0,0,9,9,9,0,0,9,9,9,0,0,9,9,9,0,0,9,9,9,0,0,9,9,9'],
          expected: '27 27 0\n27 27 0\n27 27 0',
          match: 'contains',
          hidden: false,
          label: 'Cạnh tối→sáng ở cột 1–2 → hai cột trái dương, cột phải phẳng nên 0',
        },
        {
          stdinLines: ['5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5'],
          expected: '0 0 0\n0 0 0\n0 0 0',
          match: 'contains',
          hidden: false,
          label: 'Ảnh đồng màu → không có cạnh nào → toàn 0',
        },
        {
          stdinLines: ['9,9,9,0,0,9,9,9,0,0,9,9,9,0,0,9,9,9,0,0,9,9,9,0,0'],
          expected: '0 -27 -27\n0 -27 -27\n0 -27 -27',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: cạnh SÁNG→TỐI cho giá trị ÂM — dấu cho biết chiều cạnh',
        },
      ],
      hints: [
        'Ảnh đã được reshape sẵn trong starter code: anh[i][j] là ô hàng i cột j.',
        'Bốn vòng lặp lồng: i và j chạy range(3) (vị trí kernel), u và v chạy range(3) (ô trong kernel). Cộng dồn anh[i+u][j+v] * kernel[u][v].',
        'In một hàng bằng " ".join(str(v) for v in hang_ra) — nhớ đưa hang_ra về rỗng ở đầu mỗi hàng i.',
      ],
      sampleSolution: `phang = [int(v) for v in input("Anh 5x5 phang: ").split(",")]\nanh = [phang[i * 5:(i + 1) * 5] for i in range(5)]\nkernel = [[-1, 0, 1],\n          [-1, 0, 1],\n          [-1, 0, 1]]\nfor i in range(3):\n    hang_ra = []\n    for j in range(3):\n        tong = 0\n        for u in range(3):\n            for v in range(3):\n                tong += anh[i + u][j + v] * kernel[u][v]\n        hang_ra.append(tong)\n    print(" ".join(str(v) for v in hang_ra))`,
    },
    homework:
      'Đổi kernel thành bộ dò cạnh NGANG: [[-1,-1,-1], [0,0,0], [1,1,1]] (hàng dưới trừ hàng trên). Chạy lại trên cả ba ảnh của bài Make và giải thích vì sao ảnh có cạnh DỌC giờ cho kết quả toàn 0. Sau đó thử kernel làm MỜ: [[1,1,1],[1,1,1],[1,1,1]] chia 9 — kết quả nói lên điều gì về vai trò của dấu trong kernel?',
    srsCards: [
      {
        hoi: 'Convolution 2D tính một ô đầu ra như thế nào?',
        dap: 'Đặt kernel lên một mẩu ảnh cùng kích thước, nhân từng ô tương ứng rồi cộng tất cả: out[i][j] = Σ_u Σ_v anh[i+u][j+v] · kernel[u][v]. Trượt khắp ảnh được bản đồ đặc trưng (feature map).',
      },
      {
        hoi: 'Ảnh N×N qua kernel K×K (bước 1, không padding) cho đầu ra kích thước bao nhiêu?',
        dap: '(N−K+1) × (N−K+1). Ảnh co lại ở viền vì kernel không trượt ra ngoài mép được — chữa bằng padding (thêm viền 0).',
      },
      {
        hoi: 'Ba tính chất khiến convolution hợp với ảnh là gì?',
        dap: 'Cục bộ (mỗi đầu ra chỉ nhìn một mẩu nhỏ) · chia sẻ trọng số (một kernel cho mọi vị trí → ít tham số, mẫu học ở góc này dùng được cho góc kia) · tương đương tịnh tiến (vật dịch đi bao nhiêu thì bản đồ đặc trưng dịch theo bấy nhiêu — khác với bất biến, nơi kết quả giữ nguyên).',
      },
      {
        hoi: 'Ảnh 5x5 không padding: dời cạnh dọc sang trái một cột thì hàng đặc trưng "27 27 0" thành "27 0 0". Vì sao mất một số 27?',
        dap: 'Kernel không quét ra ngoài mép, nên phần đặc trưng bị dời ra khỏi vùng 3x3 hợp lệ thì rơi mất. Tương đương tịnh tiến chỉ đúng trọn khi vật còn nằm trong vùng kernel quét được; padding giúp giữ lại viền.',
      },
    ],
  },
  {
    id: 'cv1-u2-l2',
    unitId: 'cv1-u2',
    language: 'python',
    title: 'Padding, stride & pooling — điều khiển kích thước bản đồ đặc trưng',
    hook: 'Mỗi lớp convolution ăn mất 2 hàng 2 cột ở viền. Chồng 10 lớp là ảnh 32x32 teo còn 12x12, mà toàn bộ thông tin ở mép thì bị nhìn ít hơn hẳn phần giữa. Ba nút vặn — padding, stride, pooling — cho bạn quyết định ảnh co lại bao nhiêu và co ở đâu.',
    theory:
      'PADDING (đệm viền) = thêm viền số 0 quanh ảnh trước khi tích chập. Với kernel 3x3, đệm 1 viền giữ nguyên kích thước đầu ra (gọi là "same padding"); không đệm gọi là "valid padding". Ngoài giữ kích thước, padding còn chữa được chuyện điểm ảnh ở mép bị kernel ghé thăm ít hơn điểm ở giữa.\n\nSTRIDE (bước nhảy) = kernel trượt mấy ô một lần. Stride 1 trượt sát; stride 2 nhảy cách ô, đầu ra nhỏ đi khoảng một nửa mỗi chiều. Công thức chung:\n  kích thước ra = (N + 2*P - K) // S + 1\nvới N cạnh ảnh, P số viền đệm, K cạnh kernel, S bước nhảy. Kiểm nhanh: N=5, P=0, K=3, S=1 → (5-3)//1 + 1 = 3, đúng bài trước.\n\nPOOLING (gộp) = thu nhỏ bản đồ đặc trưng bằng cách thay mỗi ô vuông nhỏ bằng MỘT số tóm tắt. Hai kiểu:\n- MAX POOLING lấy giá trị LỚN NHẤT trong ô. Đọc bằng lời: "trong vùng này, đặc trưng mạnh nhất mạnh bao nhiêu" — vị trí chính xác của nó không quan trọng bằng sự có mặt.\n- AVERAGE POOLING lấy trung bình — mượt hơn, ít dùng ở giữa mạng, hay dùng ở cuối (global average pooling).\n\nPooling 2x2 stride 2 là cấu hình kinh điển: chia đôi mỗi chiều, giữ nguyên số kênh. Ảnh 4x4 → 2x2. Ưu điểm: giảm tính toán, tăng vùng nhìn của lớp sau (mỗi ô sau pooling "thấy" vùng ảnh gốc rộng gấp đôi), và tạo BẤT BIẾN NHỎ với dịch chuyển — vật nhích 1 pixel thường không đổi kết quả max.\n\nĐáng chú ý: pooling KHÔNG có tham số học được — nó là phép cố định. Nhiều kiến trúc hiện đại đã bỏ pooling, thay bằng convolution stride 2 (để mạng tự học cách thu nhỏ). Biết cả hai đường là đủ cho khoá này.',
    workedExample: {
      code: `# Max pooling 2x2, buoc nhay 2: anh 4x4 -> ban do 2x2
anh = [[1,  2,  3,  4],
       [5,  6,  7,  8],
       [9,  10, 11, 12],
       [13, 14, 15, 16]]

for i in range(0, 4, 2):            # nhay 2 hang mot lan
    hang_ra = []
    for j in range(0, 4, 2):        # nhay 2 cot mot lan
        o = [anh[i][j], anh[i][j + 1],
             anh[i + 1][j], anh[i + 1][j + 1]]
        hang_ra.append(max(o))      # giu dac trung MANH NHAT
    print(" ".join(str(v) for v in hang_ra))

# Cong thuc kich thuoc ra cho convolution
N, P, K, S = 5, 0, 3, 1
print(f"Conv 5x5, kernel 3, stride 1: {(N + 2 * P - K) // S + 1}")
N, P, K, S = 5, 1, 3, 1
print(f"Them padding 1: {(N + 2 * P - K) // S + 1}")`,
      stdinLines: [],
    },
    predict: {
      code: `N, P, K, S = 8, 1, 3, 2\nprint((N + 2 * P - K) // S + 1)`,
      question: 'Ảnh 8x8, padding 1, kernel 3x3, stride 2 — cạnh đầu ra dài bao nhiêu?',
      choices: ['4', '3', '8', '6'],
      answerIndex: 0,
      explain:
        '(8 + 2 − 3) // 2 + 1 = 7 // 2 + 1 = 3 + 1 = 4. Stride 2 chia đôi kích thước, padding 1 bù lại phần hao ở viền. Thuộc công thức này là hết cảnh đoán mò khi xếp lớp trong PyTorch.',
    },
    parsons: {
      prompt:
        'Xếp đúng max pooling 2x2 stride 2: nhảy 2 hàng → nhảy 2 cột → gom 4 ô → lấy max → in hàng.',
      lines: [
        'for i in range(0, N, 2):',
        '    hang_ra = []',
        '    for j in range(0, N, 2):',
        '        o = [anh[i][j], anh[i][j + 1], anh[i + 1][j], anh[i + 1][j + 1]]',
        '        hang_ra.append(max(o))',
        '    print(" ".join(str(v) for v in hang_ra))',
      ],
    },
    make: {
      prompt:
        'Tự cài MAX POOLING 2x2 với bước nhảy 2.\n\nChương trình đọc MỘT dòng input(): 16 số nguyên cách nhau dấu phẩy — bản đồ đặc trưng 4x4 lưu phẳng theo từng hàng.\n\nChia thành 4 ô vuông 2x2 không chồng nhau, mỗi ô lấy giá trị LỚN NHẤT. In ĐÚNG 2 dòng, mỗi dòng 2 số nguyên cách nhau MỘT dấu cách.\n\nVí dụ "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16" → "6 8" rồi "14 16".',
      starterCode: `phang = [int(v) for v in input("Ban do 4x4 phang: ").split(",")]\nanh = [phang[i * 4:(i + 1) * 4] for i in range(4)]\n# Lap i, j theo buoc 2. Moi o gom 4 phan tu -> lay max. In 2 dong.\n`,
      testCases: [
        {
          stdinLines: ['1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16'],
          expected: '6 8\n14 16',
          match: 'contains',
          hidden: false,
          label: 'Mỗi ô 2x2 giữ số lớn nhất ở góc dưới phải',
        },
        {
          stdinLines: ['0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0'],
          expected: '0 0\n0 0',
          match: 'contains',
          hidden: false,
          label: 'Bản đồ trống → pooling vẫn cho toàn 0',
        },
        {
          stdinLines: ['0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,7'],
          expected: '9 0\n0 7',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: mỗi ô chỉ có một giá trị khác 0 — max giữ đúng nó',
        },
      ],
      hints: [
        'Nhảy hai bước: for i in range(0, 4, 2) và for j in range(0, 4, 2) — i, j là góc trên trái của mỗi ô.',
        'Bốn phần tử của ô: anh[i][j], anh[i][j+1], anh[i+1][j], anh[i+1][j+1]. Gom vào một list rồi gọi max().',
        'In mỗi hàng bằng " ".join(str(v) for v in hang_ra); nhớ tạo lại hang_ra rỗng ở đầu mỗi vòng i.',
      ],
      sampleSolution: `phang = [int(v) for v in input("Ban do 4x4 phang: ").split(",")]\nanh = [phang[i * 4:(i + 1) * 4] for i in range(4)]\nfor i in range(0, 4, 2):\n    hang_ra = []\n    for j in range(0, 4, 2):\n        o = [anh[i][j], anh[i][j + 1], anh[i + 1][j], anh[i + 1][j + 1]]\n        hang_ra.append(max(o))\n    print(" ".join(str(v) for v in hang_ra))`,
    },
    homework:
      'Sửa code thành AVERAGE POOLING (thay max(o) bằng sum(o) / 4) rồi chạy lại ca ẩn "0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,7". So hai kết quả và trả lời: nếu đặc trưng bạn đang tìm là "có một nét sáng mạnh ở đâu đó trong vùng", kiểu pooling nào giữ được tín hiệu đó, kiểu nào làm nó loãng đi? Sau đó tính bằng tay: ảnh 32x32 qua 3 lần pooling 2x2 còn bao nhiêu?',
    srsCards: [
      {
        hoi: 'Công thức kích thước đầu ra của convolution là gì?',
        dap: '(N + 2P − K) // S + 1, với N cạnh ảnh, P số viền đệm (padding), K cạnh kernel, S bước nhảy (stride). Ví dụ N=8, P=1, K=3, S=2 → (8+2−3)//2+1 = 4.',
      },
      {
        hoi: 'Padding "same" và "valid" khác nhau thế nào?',
        dap: 'Valid = không đệm, ảnh co lại còn (N−K+1). Same = đệm viền 0 (với kernel 3x3 thì đệm 1) để đầu ra GIỮ NGUYÊN kích thước; đồng thời chữa việc điểm ảnh ở mép bị kernel ghé thăm ít hơn điểm ở giữa.',
      },
      {
        hoi: 'Max pooling làm gì và được lợi gì?',
        dap: 'Thay mỗi ô vuông (thường 2x2, stride 2) bằng giá trị lớn nhất — giữ "đặc trưng mạnh nhất có mặt", bỏ vị trí chính xác. Lợi: giảm tính toán, tăng vùng nhìn của lớp sau, tạo bất biến nhỏ với dịch chuyển. Không có tham số học được.',
      },
    ],
  },
  {
    id: 'cv1-u2-l3',
    unitId: 'cv1-u2',
    language: 'python',
    title: 'Kiến trúc CNN — conv → pool → conv → pool → FC và phép đếm tham số',
    hook: 'Một MLP nối đủ cho ảnh 224x224 màu (150.528 điểm ảnh) nối sang 1.000 nơ-ron ẩn cần hơn 150 triệu tham số chỉ riêng lớp đầu. Cùng công việc đó, một lớp convolution 3x3 với 64 kênh dùng 1.792 tham số. Chênh nhau gần trăm nghìn lần — và đó là toàn bộ lý do CNN tồn tại. Hôm nay bạn đếm con số đó bằng tay.',
    theory:
      'KIẾN TRÚC CNN kinh điển là một dây chuyền lặp lại:\n  [Conv → kích hoạt → Pool] x nhiều lần → làm phẳng (flatten) → [Fully-Connected] → softmax\n\nÝ tưởng xuyên suốt: đi càng sâu thì bản đồ đặc trưng càng NHỎ về không gian nhưng càng NHIỀU KÊNH. Lớp đầu học nét cạnh; lớp giữa ghép cạnh thành góc, hoa văn; lớp sâu ghép tiếp thành bộ phận vật thể (bánh xe, mắt). Cuối cùng lớp fully-connected đọc bộ đặc trưng trừu tượng đó để ra quyết định.\n\nĐẾM THAM SỐ MỘT LỚP CONV — công thức phải thuộc:\n  tham số = C_vào * C_ra * K * K + C_ra\nGiải thích từng phần: mỗi kênh ra cần một bộ kernel K x K cho MỖI kênh vào (nên nhân C_vào * C_ra * K * K), cộng thêm mỗi kênh ra một bias (nên + C_ra). Ví dụ 3 kênh vào (ảnh màu), 64 kênh ra, kernel 3x3: 3*64*9 + 64 = 1.792.\n\nĐẾM THAM SỐ LỚP FULLY-CONNECTED:\n  tham số = số_đầu_vào * số_đầu_ra + số_đầu_ra\nĐây mới là chỗ tham số phình to. Bản đồ 7x7 với 512 kênh làm phẳng thành 25.088 đầu vào; nối sang 4.096 nơ-ron là hơn 102 triệu tham số cho MỘT lớp. Vì thế kiến trúc hiện đại thay lớp FC to bằng GLOBAL AVERAGE POOLING (lấy trung bình mỗi kênh, 512 kênh → 512 số) rồi mới nối.\n\nĐIỀU QUAN TRỌNG cần nhớ: số tham số của lớp conv KHÔNG phụ thuộc kích thước ảnh — cùng kernel dùng lại cho mọi vị trí. Ảnh to hơn chỉ tốn thêm TÍNH TOÁN, không tốn thêm tham số. Với lớp FC thì ngược lại: ảnh to hơn là số đầu vào phình lên theo.\n\nMột thói quen nghề: trước khi viết code, vẽ bảng "kích thước sau từng lớp" ra giấy. 90% lỗi khi dựng CNN lần đầu là lỗi kích thước, và bảng đó bắt được hết trước khi máy kịp báo lỗi.',
    workedExample: {
      code: `# Dem tham so cho mot CNN nho phan loai anh xam 28x28
def tham_so_conv(c_vao, c_ra, k):
    return c_vao * c_ra * k * k + c_ra    # kernel cho moi cap kenh + 1 bias/kenh ra

def tham_so_fc(vao, ra):
    return vao * ra + ra

# Conv1: 1 kenh (anh xam) -> 8 kenh, kernel 3x3
p1 = tham_so_conv(1, 8, 3)
print(f"Conv1: {p1}")

# Conv2: 8 kenh -> 16 kenh, kernel 3x3
p2 = tham_so_conv(8, 16, 3)
print(f"Conv2: {p2}")

# Sau 2 lan pool 2x2: 28 -> 14 -> 7. Lam phang: 7*7*16
phang = 7 * 7 * 16
p3 = tham_so_fc(phang, 10)              # 10 lop dau ra (chu so 0..9)
print(f"FC: {p3}")

print(f"Tong: {p1 + p2 + p3}")
print("Chu y: lop FC chiem phan lon tham so!")`,
      stdinLines: [],
    },
    predict: {
      code: `def tham_so_conv(c_vao, c_ra, k):\n    return c_vao * c_ra * k * k + c_ra\nprint(tham_so_conv(3, 64, 3))`,
      question:
        'Lớp conv đầu tiên của một mạng ảnh màu (3 kênh) với 64 kênh ra, kernel 3x3 — bao nhiêu tham số?',
      choices: ['1792', '1728', '576', '110656'],
      answerIndex: 0,
      explain:
        '3 × 64 × 3 × 3 = 1.728 trọng số, cộng 64 bias = 1.792. Con số này KHÔNG đổi dù ảnh 32x32 hay 4000x3000 — kernel dùng chung cho mọi vị trí. Đó là điều MLP nối đủ không làm được.',
    },
    parsons: {
      prompt:
        'Xếp đúng thứ tự một khối CNN và phép đếm: định nghĩa công thức conv → công thức FC → tính từng lớp → cộng tổng.',
      lines: [
        'def tham_so_conv(c_vao, c_ra, k):',
        '    return c_vao * c_ra * k * k + c_ra',
        'def tham_so_fc(vao, ra):',
        '    return vao * ra + ra',
        'p1 = tham_so_conv(1, 8, 3)',
        'p2 = tham_so_fc(7 * 7 * 8, 10)',
        'print(p1 + p2)',
      ],
    },
    make: {
      prompt:
        'Viết máy đếm tham số cho MỘT lớp convolution.\n\nChương trình đọc 3 dòng input():\n- Dòng 1: số kênh VÀO.\n- Dòng 2: số kênh RA.\n- Dòng 3: cạnh kernel k (kernel vuông k x k).\n\nCông thức: tham số = c_vao * c_ra * k * k + c_ra.\n\nIn ĐÚNG 1 dòng:\nTham so: <số nguyên>\n\nVí dụ 1, 8, 3 → "Tham so: 80".',
      starterCode: `c_vao = int(input("Kenh vao: "))\nc_ra = int(input("Kenh ra: "))\nk = int(input("Canh kernel: "))\n# Ap dung cong thuc roi in: Tham so: <so>\n`,
      testCases: [
        {
          stdinLines: ['1', '8', '3'],
          expected: 'Tham so: 80',
          match: 'contains',
          hidden: false,
          label: 'Ảnh xám → 8 kênh, kernel 3x3: 1*8*9 + 8 = 80',
        },
        {
          stdinLines: ['8', '16', '3'],
          expected: 'Tham so: 1168',
          match: 'contains',
          hidden: false,
          label: 'Lớp conv thứ hai: 8*16*9 + 16 = 1168',
        },
        {
          stdinLines: ['3', '1', '1'],
          expected: 'Tham so: 4',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: kernel 1x1 (trộn kênh) — chỉ 3*1*1 + 1 = 4 tham số',
        },
      ],
      hints: [
        'Đọc cả ba dòng bằng int(input(...)) — chúng đều là số nguyên.',
        'Công thức gồm HAI phần: phần trọng số c_vao * c_ra * k * k, cộng phần bias c_ra (mỗi kênh ra một bias).',
        'In đúng định dạng: print(f"Tham so: {tong}") — không thêm dấu chấm phân cách hàng nghìn.',
      ],
      sampleSolution: `c_vao = int(input("Kenh vao: "))\nc_ra = int(input("Kenh ra: "))\nk = int(input("Canh kernel: "))\ntong = c_vao * c_ra * k * k + c_ra\nprint(f"Tham so: {tong}")`,
    },
    homework:
      'Đếm bằng tay (rồi kiểm bằng code của bạn) toàn bộ mạng sau cho ảnh xám 32x32: Conv(1→16, 3x3, same padding) → Pool 2x2 → Conv(16→32, 3x3, same) → Pool 2x2 → Flatten → FC(→10). Ghi kích thước sau từng lớp và số tham số từng lớp. Câu hỏi chốt: lớp nào ngốn nhiều tham số nhất, và nếu thay lớp FC bằng global average pooling (32 kênh → 32 số) rồi FC(32→10) thì tổng giảm bao nhiêu lần?',
    srsCards: [
      {
        hoi: 'Công thức đếm tham số của một lớp convolution?',
        dap: 'C_vào × C_ra × K × K + C_ra: mỗi kênh ra cần một kernel K×K cho mỗi kênh vào, cộng một bias mỗi kênh ra. Ví dụ 3→64 kernel 3x3 = 3·64·9 + 64 = 1.792.',
      },
      {
        hoi: 'Vì sao số tham số lớp conv KHÔNG phụ thuộc kích thước ảnh, còn lớp FC thì có?',
        dap: 'Conv chia sẻ cùng một kernel cho mọi vị trí nên ảnh to hơn chỉ tốn thêm tính toán. Lớp FC nối tới TỪNG phần tử của bản đồ đã làm phẳng, nên ảnh to hơn làm số đầu vào (và số tham số) phình lên theo.',
      },
      {
        hoi: 'Dây chuyền kiến trúc CNN kinh điển gồm những gì, xu hướng kích thước ra sao?',
        dap: '[Conv → kích hoạt → Pool] lặp nhiều lần → flatten → fully-connected → softmax. Càng sâu thì bản đồ càng NHỎ về không gian nhưng càng NHIỀU KÊNH; lớp đầu học cạnh, lớp sâu học bộ phận vật thể.',
      },
    ],
  },
  {
    id: 'cv1-u2-l4',
    unitId: 'cv1-u2',
    language: 'python',
    title: 'Vòng huấn luyện đầy đủ — thấy loss giảm qua từng epoch',
    hook: 'Đến giờ bạn đã có đủ mảnh ghép: forward pass tính đầu ra, hàm mất mát đo độ sai, gradient chỉ hướng sửa. Ghép ba mảnh vào một vòng lặp là bạn có TOÀN BỘ cách mọi mô hình học sâu trên đời được huấn luyện. In loss từng epoch ra và nhìn nó tụt xuống — khoảnh khắc đó khó quên.',
    theory:
      'VÒNG HUẤN LUYỆN (training loop) lặp lại đúng bốn bước, mỗi vòng gọi là một EPOCH (một lượt đi qua toàn bộ dữ liệu):\n1. FORWARD — đưa dữ liệu qua mô hình, lấy dự đoán.\n2. LOSS — đo độ sai giữa dự đoán và nhãn thật.\n3. BACKWARD — tính gradient của loss theo từng tham số.\n4. UPDATE — nhích tham số ngược chiều gradient: w = w - lr * grad.\n\nMÔ HÌNH của bài này rút gọn tối đa để nhìn rõ cơ chế: một tham số w, dự đoán y_hat = w*x, dữ liệu x = [1, 2, 3], y = [2, 4, 6] (tức quy luật thật là y = 2x, nên đáp án đúng là w = 2). Mất mát MSE:\n  L = trung bình các (w*x_i - y_i)^2\n  dL/dw = trung bình các 2*(w*x_i - y_i)*x_i\n\nLEARNING RATE (lr, tốc độ học) là siêu tham số quan trọng nhất của học sâu:\n- lr quá NHỎ: loss giảm nhỏ giọt, huấn luyện lâu vô tận (thử lr = 0.001 ở bài tập về nhà).\n- lr VỪA: loss giảm nhanh và mượt, hội tụ về đáy.\n- lr quá LỚN: mỗi bước nhảy vọt qua đáy sang bên kia còn xa hơn — loss TĂNG dần rồi thành nan (không phải số). Với bài này, ngưỡng an toàn quanh lr < 0.21; thử 0.3 là thấy văng.\n\nGRADIENT DESCENT có ba biến thể theo lượng dữ liệu dùng mỗi bước: batch (cả tập — chính xác nhưng chậm, là cái bài này cài), stochastic (một mẫu — nhanh, nhiễu), mini-batch (một nhúm 32–256 mẫu — dung hoà, là cái mọi người thật sự dùng).\n\nĐỌC ĐƯỜNG LOSS là kỹ năng chẩn đoán: giảm rồi phẳng = hội tụ; giảm rồi tăng lại = lr to hoặc overfit; đứng ì từ đầu = lr quá nhỏ, dữ liệu chưa chuẩn hoá, hoặc code gradient sai (lúc đó quay lại phép kiểm gradient bài cv1-u1-l5).',
    workedExample: {
      code: `# Vong huan luyen day du cho mo hinh 1 tham so y_hat = w * x
x = [1.0, 2.0, 3.0]
y = [2.0, 4.0, 6.0]      # quy luat that: y = 2x
n = len(x)

w = 0.0                  # khoi tao
lr = 0.1                 # learning rate

for epoch in range(1, 6):            # 5 epoch co dinh
    # 1. FORWARD + 2. LOSS
    loss = 0.0
    for i in range(n):
        sai = w * x[i] - y[i]
        loss += sai * sai
    loss = loss / n
    print(f"Epoch {epoch}: loss={loss:.4f}")

    # 3. BACKWARD
    grad = 0.0
    for i in range(n):
        grad += 2 * (w * x[i] - y[i]) * x[i]
    grad = grad / n

    # 4. UPDATE: di NGUOC chieu gradient
    w = w - lr * grad

print(f"w: {w:.4f}")     # tien ve 2.0`,
      stdinLines: [],
    },
    predict: {
      code: `w = 5.0\ngrad = 2.0\nlr = 0.1\nw = w - lr * grad\nprint(f"{w:.4f}")`,
      question: 'Gradient dương 2.0, learning rate 0.1 — w sau một bước cập nhật là bao nhiêu?',
      choices: ['4.8000', '5.2000', '5.0000', '3.0000'],
      answerIndex: 0,
      explain:
        '5.0 − 0.1×2.0 = 4.8. Gradient DƯƠNG nghĩa là "tăng w thì loss tăng", nên ta đi NGƯỢC lại: giảm w. Dấu trừ trong w = w − lr·grad chính là chỗ "descent" (đi xuống) nằm trong tên gradient descent.',
    },
    parsons: {
      prompt:
        'Xếp đúng bốn bước trong một epoch: tính loss → in → tính gradient → cập nhật tham số.',
      lines: [
        'for epoch in range(1, 6):',
        '    loss = sum((w * x[i] - y[i]) ** 2 for i in range(n)) / n',
        '    print(f"Epoch {epoch}: loss={loss:.4f}")',
        '    grad = sum(2 * (w * x[i] - y[i]) * x[i] for i in range(n)) / n',
        '    w = w - lr * grad',
        'print(f"w: {w:.4f}")',
      ],
    },
    make: {
      prompt:
        'Chạy vòng huấn luyện đầy đủ cho mô hình một tham số y_hat = w*x.\n\nDữ liệu NHÚNG SẴN trong starter code: x = [1, 2, 3], y = [2, 4, 6]. Khởi tạo w = 0.0. Số epoch CỐ ĐỊNH là 5.\n\nChương trình đọc MỘT dòng input(): learning rate (số thực).\n\nMỗi epoch, theo ĐÚNG thứ tự: (1) tính loss MSE = trung bình (w*x_i − y_i)², (2) in dòng\nEpoch <số>: loss=<loss với 4 chữ số thập phân>\n(3) tính gradient = trung bình 2*(w*x_i − y_i)*x_i, (4) cập nhật w = w − lr*grad.\n\nSau 5 epoch, in thêm ĐÚNG một dòng:\nw: <w với 4 chữ số thập phân>\n\nEpoch đánh số từ 1 đến 5. Ví dụ với lr = 0.1, epoch 1 in "Epoch 1: loss=18.6667" và dòng cuối là "w: 2.0000".',
      starterCode: `x = [1.0, 2.0, 3.0]\ny = [2.0, 4.0, 6.0]\nn = len(x)\nw = 0.0\nlr = float(input("Learning rate: "))\n# 5 epoch: tinh loss -> in -> tinh grad -> cap nhat w. Cuoi cung in w.\n`,
      testCases: [
        {
          stdinLines: ['0.1'],
          expected: 'Epoch 1: loss=18.6667',
          match: 'contains',
          hidden: false,
          label: 'Epoch đầu luôn có loss 18.6667 (w khởi tạo bằng 0)',
        },
        {
          stdinLines: ['0.1'],
          expected: 'Epoch 5: loss=0.0000\nw: 2.0000',
          match: 'contains',
          hidden: false,
          label: 'lr = 0.1 hội tụ đẹp: sau 5 epoch w về đúng 2.0000',
        },
        {
          stdinLines: ['0'],
          expected: 'Epoch 5: loss=18.6667\nw: 0.0000',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: lr = 0 → không cập nhật gì, loss đứng ì và w giữ nguyên 0',
        },
      ],
      hints: [
        'Vòng ngoài: for epoch in range(1, 6) để epoch chạy từ 1 tới 5 (range(6) sẽ in số 0 — sai đề).',
        'Thứ tự quan trọng: IN loss TRƯỚC khi cập nhật w, nếu không epoch 1 sẽ không còn là 18.6667.',
        'Loss và gradient đều chia cho n = 3. Định dạng in: f"Epoch {epoch}: loss={loss:.4f}" và cuối cùng f"w: {w:.4f}".',
      ],
      sampleSolution: `x = [1.0, 2.0, 3.0]\ny = [2.0, 4.0, 6.0]\nn = len(x)\nw = 0.0\nlr = float(input("Learning rate: "))\nfor epoch in range(1, 6):\n    loss = 0.0\n    for i in range(n):\n        sai = w * x[i] - y[i]\n        loss += sai * sai\n    loss = loss / n\n    print(f"Epoch {epoch}: loss={loss:.4f}")\n    grad = 0.0\n    for i in range(n):\n        grad += 2 * (w * x[i] - y[i]) * x[i]\n    grad = grad / n\n    w = w - lr * grad\nprint(f"w: {w:.4f}")`,
    },
    homework:
      'Chạy code của bạn với bốn learning rate và ghi lại đường loss: 0.001 · 0.05 · 0.1 · 0.3. Với lr = 0.3 bạn sẽ thấy loss TĂNG vọt qua từng epoch — vẽ tay hình parabol mất mát và mũi tên nhảy qua đáy để giải thích vì sao. Sau đó tăng số epoch lên 50 với lr = 0.001 và trả lời: cuối cùng nó có tới được w = 2 không, và cái giá phải trả là gì?',
    srsCards: [
      {
        hoi: 'Vòng huấn luyện gồm bốn bước nào, lặp theo đơn vị gì?',
        dap: 'Forward (tính dự đoán) → Loss (đo độ sai) → Backward (tính gradient) → Update (w = w − lr·grad). Một lượt đi qua toàn bộ dữ liệu gọi là một epoch; vòng lặp chạy nhiều epoch.',
      },
      {
        hoi: 'Learning rate quá nhỏ và quá lớn gây ra hiện tượng gì?',
        dap: 'Quá nhỏ: loss giảm nhỏ giọt, huấn luyện lâu vô tận. Quá lớn: mỗi bước nhảy vọt qua đáy sang bên kia còn xa hơn, loss TĂNG dần rồi thành nan. Vừa: loss giảm nhanh, mượt, rồi phẳng.',
      },
      {
        hoi: 'Batch, stochastic và mini-batch gradient descent khác nhau ở đâu?',
        dap: 'Batch dùng CẢ tập dữ liệu mỗi bước (chính xác, chậm); stochastic dùng MỘT mẫu (nhanh, nhiễu); mini-batch dùng một nhúm 32–256 mẫu (dung hoà) — mini-batch là cái được dùng thực tế.',
      },
    ],
  },
  {
    id: 'cv1-u2-l5',
    unitId: 'cv1-u2',
    language: 'python',
    title: 'Augmentation & overfit — nhân dữ liệu bằng phép lật, dừng đúng lúc',
    hook: 'Bạn có 200 ảnh mèo, mạng thuộc lòng cả 200 sau vài phút rồi gặp con mèo thứ 201 là chịu thua. Không có tiền chụp thêm 2.000 ảnh? Lật ngang mỗi ảnh là bạn có ngay 400 — và con mèo soi gương vẫn là con mèo. Đó là augmentation: bịa thêm dữ liệu THẬT một cách hợp lệ.',
    theory:
      'AUGMENTATION (tăng cường dữ liệu) = sinh thêm mẫu huấn luyện bằng các phép biến đổi KHÔNG làm đổi nhãn. Trên ảnh, các phép phổ biến:\n- Lật ngang (horizontal flip) — đảo thứ tự các CỘT của mỗi hàng.\n- Dịch/cắt ngẫu nhiên (shift, random crop) — dạy mạng đừng phụ thuộc vị trí tuyệt đối.\n- Xoay nhẹ, đổi sáng/tương phản, thêm nhiễu.\n\nLUẬT VÀNG: phép biến đổi phải BẢO TOÀN NHÃN. Lật ngang ảnh mèo vẫn là mèo — hợp lệ. Nhưng lật ngang ảnh chữ số 2 thì thành một ký hiệu không phải chữ số, và lật ngang biển báo "rẽ trái" thì thành "rẽ phải" — sai nhãn, đầu độc dữ liệu. Chọn phép augmentation là quyết định NGHIỆP VỤ, không phải kỹ thuật thuần.\n\nAugmentation là một dạng REGULARIZATION: nó buộc mạng học đặc trưng BỀN VỮNG (mèo vẫn là mèo dù soi gương) thay vì học thuộc từng điểm ảnh. Hai công cụ chống overfit khác đi kèm trong học sâu:\n- DROPOUT: khi huấn luyện, ngẫu nhiên tắt một tỉ lệ nơ-ron mỗi bước, buộc mạng không dựa dẫm vào một nơ-ron duy nhất. Khi suy luận thì bật hết.\n- EARLY STOPPING (dừng sớm): theo dõi loss trên tập VALIDATION sau mỗi epoch; loss train vẫn giảm mà loss validation bắt đầu TĂNG là dấu hiệu mạng chuyển sang học vẹt — dừng ở đúng epoch tốt nhất và lấy lại bản trọng số của epoch đó.\n\nLƯU Ý quan trọng: augmentation CHỈ áp cho tập huấn luyện. Augment cả tập test là tự lừa mình, không còn đo được năng lực thật.\n\nPHÉP LẬT NGANG trong code: hàng [a, b, c] thành [c, b, a] — trong Python là hang[::-1]. Bài Make hôm nay bạn tự cài để thấy nó chỉ là một phép đảo chỉ số, không có gì huyền bí.',
    workedExample: {
      code: `# Augmentation: lat ngang mot anh 3x3 (dao thu tu cot moi hang)
anh = [[1, 2, 3],
       [4, 5, 6],
       [7, 8, 9]]

print("Goc:")
for hang in anh:
    print(" ".join(str(v) for v in hang))

print("Lat ngang:")
for hang in anh:
    dao = []
    for j in range(len(hang) - 1, -1, -1):   # duyet cot tu phai sang trai
        dao.append(hang[j])
    print(" ".join(str(v) for v in dao))

# Cach ngan gon cua Python (kiem lai ket qua tren)
print("Kiem bang lat cat:", anh[0][::-1])`,
      stdinLines: [],
    },
    predict: {
      code: `hang = [0, 0, 9]\nprint(hang[::-1])`,
      question: 'Lật ngang một hàng ảnh — in ra gì?',
      choices: ['[9, 0, 0]', '[0, 0, 9]', '[0, 9, 0]', '[9, 9, 0]'],
      answerIndex: 0,
      explain:
        'Lát cắt [::-1] duyệt list theo chiều ngược, cho [9, 0, 0] — điểm sáng chuyển từ mép phải sang mép trái. Lật cả ảnh chỉ là làm việc này cho MỌI hàng; số hàng và thứ tự hàng giữ nguyên.',
    },
    parsons: {
      prompt: 'Xếp đúng thứ tự: in ảnh gốc trước, rồi in ảnh đã lật ngang từng hàng.',
      lines: [
        'print("Goc:")',
        'for hang in anh:',
        '    print(" ".join(str(v) for v in hang))',
        'print("Lat ngang:")',
        'for hang in anh:',
        '    print(" ".join(str(v) for v in hang[::-1]))',
      ],
    },
    make: {
      prompt:
        'Tự cài phép augmentation lật ngang.\n\nChương trình đọc MỘT dòng input(): 9 số nguyên cách nhau dấu phẩy — ảnh 3x3 lưu phẳng theo từng hàng.\n\nIn ĐÚNG 8 dòng:\nGoc:\n<3 dòng ảnh gốc, mỗi dòng 3 số cách nhau MỘT dấu cách>\nLat ngang:\n<3 dòng ảnh đã đảo thứ tự cột trong mỗi hàng>\n\nVí dụ "1,2,3,4,5,6,7,8,9": phần gốc là "1 2 3" / "4 5 6" / "7 8 9", phần lật là "3 2 1" / "6 5 4" / "9 8 7". Số hàng và thứ tự hàng KHÔNG đổi — chỉ đảo cột.',
      starterCode: `phang = [int(v) for v in input("Anh 3x3 phang: ").split(",")]\nanh = [phang[i * 3:(i + 1) * 3] for i in range(3)]\n# In "Goc:" roi 3 hang; in "Lat ngang:" roi 3 hang da dao cot\n`,
      testCases: [
        {
          stdinLines: ['1,2,3,4,5,6,7,8,9'],
          expected: 'Goc:\n1 2 3\n4 5 6\n7 8 9\nLat ngang:\n3 2 1\n6 5 4\n9 8 7',
          match: 'contains',
          hidden: false,
          label: 'Ảnh đếm 1–9: lật ngang đảo từng hàng, giữ thứ tự hàng',
        },
        {
          stdinLines: ['1,2,1,3,4,3,5,6,5'],
          expected: 'Lat ngang:\n1 2 1\n3 4 3\n5 6 5',
          match: 'contains',
          hidden: false,
          label: 'Ảnh đối xứng trái–phải → lật xong y hệt bản gốc',
        },
        {
          stdinLines: ['0,0,9,0,0,0,0,0,0'],
          expected: 'Lat ngang:\n9 0 0\n0 0 0\n0 0 0',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: một điểm sáng duy nhất ở mép phải → sau khi lật nằm ở mép trái',
        },
      ],
      hints: [
        'Ảnh đã reshape sẵn trong starter: anh là list gồm 3 hàng, mỗi hàng là list 3 số.',
        'In một hàng: print(" ".join(str(v) for v in hang)). Nhớ in đúng hai dòng nhãn "Goc:" và "Lat ngang:".',
        'Lật ngang một hàng: hang[::-1] (hoặc vòng for j chạy từ 2 xuống 0). Chỉ đảo TRONG hàng, không đảo thứ tự các hàng.',
      ],
      sampleSolution: `phang = [int(v) for v in input("Anh 3x3 phang: ").split(",")]\nanh = [phang[i * 3:(i + 1) * 3] for i in range(3)]\nprint("Goc:")\nfor hang in anh:\n    print(" ".join(str(v) for v in hang))\nprint("Lat ngang:")\nfor hang in anh:\n    print(" ".join(str(v) for v in hang[::-1]))`,
    },
    homework:
      'Thêm hai phép augmentation nữa vào code: lật DỌC (đảo thứ tự các hàng — gợi ý anh[::-1]) và tăng sáng (cộng 1 vào mọi ô, chặn trần ở 9 bằng min(9, v + 1)). Sau đó lập danh sách 5 bài toán ảnh đời thật (nhận diện khuôn mặt, đọc biển số xe, phân loại ảnh chụp X-quang, đọc chữ số viết tay, nhận biển báo giao thông) và với MỖI bài toán ghi rõ: lật ngang có hợp lệ không, vì sao. Ít nhất hai bài phải trả lời "không" — tìm ra chúng là mục tiêu của bài tập này.',
    srsCards: [
      {
        hoi: 'Augmentation dữ liệu ảnh là gì và luật vàng khi chọn phép biến đổi?',
        dap: 'Sinh thêm mẫu huấn luyện bằng biến đổi ảnh (lật, dịch, xoay, đổi sáng, nhiễu). Luật vàng: phép biến đổi phải BẢO TOÀN NHÃN — lật ngang mèo vẫn là mèo, nhưng lật ngang biển "rẽ trái" thành "rẽ phải" là đầu độc dữ liệu.',
      },
      {
        hoi: 'Vì sao augmentation chỉ được áp cho tập HUẤN LUYỆN?',
        dap: 'Tập test dùng để đo năng lực thật trên dữ liệu chưa gặp; augment nó là tự lừa mình, con số đo được không còn phản ánh thực tế triển khai.',
      },
      {
        hoi: 'Dropout và early stopping chống overfit bằng cách nào?',
        dap: 'Dropout: khi huấn luyện ngẫu nhiên tắt một tỉ lệ nơ-ron mỗi bước, buộc mạng không dựa dẫm vào một nơ-ron duy nhất (khi suy luận bật hết). Early stopping: theo dõi loss validation, thấy nó bắt đầu TĂNG trong khi loss train vẫn giảm thì dừng và lấy lại trọng số của epoch tốt nhất.',
      },
    ],
  },
]
