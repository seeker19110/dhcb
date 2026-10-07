// lessons/cv2u1.ts — Chương 1 của khoá ngắn "Deep Learning for CV nâng cao"
// (docs/specs/2026-09-01-cv2-bai-hoc-chi-tiet.md). Nội dung chép nguyên văn từ đặc tả.
//
// unitId 'cv2-u1' KHÔNG nằm trong curriculum.ts — là "unit ảo" của tầng khoá ngắn, được
// lessons.test.ts công nhận qua SHORT_COURSES (courses/registry.ts), đúng cơ chế 'git-u*'.
//
// Luật soạn riêng của khoá: mọi bài đều language 'python' và code được chấm là Python THUẦN
// (chỉ math chuẩn, không numpy/torch) để Pyodide trình duyệt và python3 CI chấm y hệt nhau.
import type { ProgrammingLesson } from '../lessonTypes.js'

export const CV2_U1_LESSONS: ProgrammingLesson[] = [
  {
    id: 'cv2-u1-l1',
    unitId: 'cv2-u1',
    language: 'python',
    title: 'Vì sao cần attention — chỗ CNN và RNN đuối sức',
    hook: 'Câu "Con mèo mà bà ngoại tôi nuôi từ hồi tôi còn bé xíu ĐÃ CHẾT" — chữ "mèo" và chữ "chết" cách nhau 12 từ. RNN phải truyền tin qua đủ 12 bước mới nối được hai chữ đó, tam sao thất bản. Attention nối thẳng: mọi từ nhìn thấy mọi từ trong ĐÚNG MỘT bước.',
    theory:
      'Trước 2017, hai kiến trúc thống trị đều có cùng một vết nứt: THÔNG TIN Ở XA THÌ KHÓ NỐI.\n\nRNN/LSTM đọc tuần tự trái sang phải, trạng thái ẩn mang ký ức đi theo. Muốn nối từ vị trí 1 với vị trí n, tín hiệu phải đi qua n−1 bước — mỗi bước nhân thêm một ma trận, gradient teo dần (vanishing gradient). Tệ hơn: tuần tự nghĩa là KHÔNG song song hoá được, GPU nằm chơi.\n\nCNN nối cục bộ: kernel 3×3 chỉ thấy hàng xóm sát bên. Muốn hai điểm cách nhau n bước "thấy nhau", phải chồng khoảng n/2 lớp — kiến trúc phình ra chỉ để mở rộng tầm nhìn (receptive field).\n\nATTENTION đổi luật chơi: với chuỗi n phần tử, nó tính TRỰC TIẾP điểm liên quan của mọi cặp (i, j) — n(n−1)/2 cặp, tất cả trong một bước, tất cả song song. Không còn khoảng cách xa hay gần: từ đầu câu và từ cuối câu cách nhau đúng MỘT phép nhân.\n\nCái giá phải trả, phải biết ngay từ bài đầu: chi phí là O(n²). Chuỗi 1.000 phần tử → 1 triệu cặp; 10.000 phần tử → 100 triệu. Vì vậy ảnh KHÔNG đưa từng pixel vào attention (ảnh 224×224 là 50.176 pixel!) mà cắt thành PATCH (bài 4). Toàn bộ ngành nghiên cứu "attention hiệu quả" (Linformer, Performer, FlashAttention) sinh ra chỉ để gặm con số n² này.',
    workedExample: {
      code: `# Do "khoang cach truyen tin" cua 3 kien truc tren cung mot cau
n = 12                       # cau dai 12 tu

# RNN: tin phai di tuan tu tu tu dau toi tu cuoi
print(f"RNN can: {n - 1} buoc")

# CNN kernel 3: moi lop mo rong tam nhin them 1 ve moi ben
print(f"CNN kernel 3 can: {(n - 1 + 1) // 2} lop")

# Attention: moi cap noi truc tiep, mot buoc duy nhat
print("Attention can: 1 buoc")
print(f"Nhung phai tinh: {n * (n - 1) // 2} cap (chi phi O(n^2))")`,
      stdinLines: [],
    },
    predict: {
      code: `n = 100\nprint(n * (n - 1) // 2)`,
      question: 'Chuỗi 100 phần tử, attention phải tính bao nhiêu cặp liên quan?',
      choices: ['4950', '100', '10000', '99'],
      answerIndex: 0,
      explain:
        'Mỗi cặp (i, j) không trùng nhau: 100 × 99 / 2 = 4.950. Gấp đôi độ dài chuỗi là chi phí gấp BỐN — đó chính là O(n²), lý do ảnh phải cắt thành patch chứ không đưa từng pixel vào attention.',
    },
    parsons: {
      prompt: 'Xếp đúng thứ tự so sánh chi phí ba kiến trúc trên chuỗi dài n.',
      lines: [
        'n = int(input("So tu: "))',
        'print(f"RNN can: {n - 1} buoc")',
        'print(f"CNN kernel 3 can: {(n - 1 + 1) // 2} lop")',
        'print("Attention can: 1 buoc")',
        'print(f"Chi phi attention: {n * (n - 1) // 2} cap")',
      ],
    },
    make: {
      prompt:
        'Viết máy so sánh ba kiến trúc trên một chuỗi dài n.\n\nChương trình đọc 1 dòng input(): số từ n (số nguyên ≥ 2).\n\nIn đúng 3 dòng:\nAttention noi truc tiep: <n*(n-1)//2> cap\nRNN can: <n-1> buoc de tu dau toi cuoi\nCNN kernel 3 can: <(n-1+1)//2> lop de phu het cau\n\nVí dụ n = 4 → 6 cặp, 3 bước, 2 lớp.',
      starterCode: `n = int(input("So tu: "))\n# So cap attention = n*(n-1)//2 (chia lay nguyen // de ra so nguyen)\n# So buoc RNN = n-1 ; so lop CNN kernel 3 = (n-1+1)//2\n`,
      testCases: [
        {
          stdinLines: ['4'],
          expected:
            'Attention noi truc tiep: 6 cap\nRNN can: 3 buoc de tu dau toi cuoi\nCNN kernel 3 can: 2 lop de phu het cau',
          match: 'contains',
          hidden: false,
          label: 'n = 4 → 6 cặp · 3 bước · 2 lớp',
        },
        {
          stdinLines: ['8'],
          expected:
            'Attention noi truc tiep: 28 cap\nRNN can: 7 buoc de tu dau toi cuoi\nCNN kernel 3 can: 4 lop de phu het cau',
          match: 'contains',
          hidden: false,
          label: 'n = 8 → 28 cặp (gấp đôi n, cặp gấp gần 5 lần)',
        },
        {
          stdinLines: ['2'],
          expected:
            'Attention noi truc tiep: 1 cap\nRNN can: 1 buoc de tu dau toi cuoi\nCNN kernel 3 can: 1 lop de phu het cau',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: n = 2 — biên nhỏ nhất, đúng 1 cặp',
        },
      ],
      hints: [
        'Dùng phép chia lấy nguyên // chứ không phải / — đề yêu cầu số nguyên (6 chứ không phải 6.0).',
        'Số cặp không trùng của n phần tử là n*(n-1)//2 (công thức tổ hợp chập 2).',
        'Ba dòng print f-string, chép đúng từng chữ nhãn trong đề — máy chấm so chuỗi.',
      ],
      sampleSolution: `n = int(input("So tu: "))\ncap = n * (n - 1) // 2\nprint(f"Attention noi truc tiep: {cap} cap")\nprint(f"RNN can: {n - 1} buoc de tu dau toi cuoi")\nprint(f"CNN kernel 3 can: {(n - 1 + 1) // 2} lop de phu het cau")`,
    },
    homework:
      'Chạy code của bạn với n = 10, 100, 1000, 10000 rồi ghi lại 4 con số chi phí attention. Chuỗi dài gấp 10 thì chi phí gấp mấy? Từ đó tự trả lời: ảnh 224×224 = 50.176 pixel, nếu đưa TỪNG PIXEL vào attention thì phải tính bao nhiêu cặp — và vì sao ViT (bài 4) buộc phải cắt ảnh thành patch trước.',
    srsCards: [
      {
        hoi: 'Vết nứt chung của RNN và CNN mà attention vá được là gì?',
        dap: 'Thông tin ở XA thì khó nối: RNN phải truyền qua n−1 bước tuần tự (gradient teo, không song song hoá được), CNN phải chồng ~n/2 lớp vì kernel chỉ thấy hàng xóm. Attention nối MỌI cặp trực tiếp trong một bước, song song hoàn toàn.',
      },
      {
        hoi: 'Cái giá của attention là gì và nó dẫn tới hệ quả gì cho ảnh?',
        dap: 'Chi phí O(n²) — chuỗi n phần tử phải tính n(n−1)/2 cặp, gấp đôi độ dài là chi phí gấp bốn. Vì thế ảnh không đưa từng pixel vào attention (224×224 = 50.176 pixel) mà cắt thành patch làm "từ" (ViT).',
      },
      {
        hoi: 'Vì sao RNN không tận dụng được GPU tốt như Transformer?',
        dap: 'RNN đọc TUẦN TỰ: muốn tính trạng thái bước t phải có xong bước t−1, nên không song song hoá theo chiều thời gian. Attention tính mọi cặp độc lập nhau nên đưa hết lên GPU cùng lúc được.',
      },
    ],
  },
  {
    id: 'cv2-u1-l2',
    unitId: 'cv2-u1',
    language: 'python',
    title: 'Self-attention một đầu — tự cài Q·K → softmax → V',
    hook: 'Đọc câu "Con mèo đuổi con chuột vì NÓ đói", bạn tự động biết "nó" trỏ về con mèo. Não bạn vừa phân bổ SỰ CHÚ Ý: 80% vào "mèo", 15% vào "chuột", 5% vào phần còn lại. Bài này bạn cài đúng cơ chế đó bằng 15 dòng Python — và in ra được bảng phần trăm chú ý ấy.',
    theory:
      'Self-attention biến mỗi phần tử thành ba vector, đây là chỗ hay lẫn nhất nên nhớ bằng hình ảnh thư viện:\n- Q (Query, truy vấn) — "tôi đang tìm gì".\n- K (Key, khoá) — "tôi có gì để người khác tìm thấy".\n- V (Value, giá trị) — "nội dung tôi đưa ra nếu được chọn".\n\nCông thức đủ: Attention(Q,K,V) = softmax(Q·Kᵀ / √d) · V. Bốn bước, cài lần lượt:\n\n1. CHẤM ĐIỂM: điểm[i][j] = tích vô hướng Q[i]·K[j] = tổng của Q[i][t]*K[j][t]. Hai vector cùng hướng → điểm cao → "liên quan".\n2. CHIA THANG (scale): chia cho √d với d là số chiều. Vì sao? Tích vô hướng của d chiều lớn dần theo d; điểm quá lớn làm softmax bão hoà thành gần như 1 và 0 hết, gradient chết. Chia √d giữ điểm trong vùng lành.\n3. SOFTMAX: đổi dãy điểm thành TRỌNG SỐ dương cộng lại bằng 1. Tự cài: w[j] = exp(diem[j]) / tổng exp(diem). Mẹo ổn định số học của dân nghề: trừ đi max trước khi lấy exp — exp(diem[j] − max) — kết quả toán học y hệt (tử và mẫu cùng chia một hằng) nhưng không bao giờ tràn số.\n4. TRỘN: kết quả[t] = tổng w[j] * V[j][t] — trung bình có trọng số các vector V.\n\nHàng thứ i của bảng trọng số chính là "phần trăm chú ý" mà từ i dành cho từng từ trong câu. Đây là thứ các bài báo hay vẽ thành bản đồ nhiệt (attention map), và với ViT nó cho biết mô hình đang nhìn vào vùng nào của ảnh.',
    workedExample: {
      code: `import math

# 3 "tu", moi tu la vector 2 chieu. Bai nay cho Q = K = V (self-attention).
Q = [[1, 0], [0, 1], [1, 1]]
K = [[1, 0], [0, 1], [1, 1]]
V = [[1, 0], [0, 1], [1, 1]]
d = 2                                   # so chieu

i = 0                                   # tinh chu y CUA tu so 0
diem = []
for j in range(len(K)):                 # (1) cham diem Q[i] . K[j]
    s = sum(Q[i][t] * K[j][t] for t in range(d))
    diem.append(s / math.sqrt(d))       # (2) chia thang sqrt(d)
print("Diem sau scale:", [round(x, 3) for x in diem])

lon_nhat = max(diem)                    # (3) softmax tu cai, tru max cho on dinh
mu = [math.exp(s - lon_nhat) for s in diem]
tong = sum(mu)
w = [m / tong for m in mu]
print("Trong so chu y:", [round(x, 3) for x in w])
print("Tong trong so:", round(sum(w), 3))   # luon bang 1.0

ket = [sum(w[j] * V[j][t] for j in range(len(V))) for t in range(d)]
print("Vector ket qua:", [round(x, 3) for x in ket])   # (4) tron V`,
      stdinLines: [],
    },
    predict: {
      code: `import math\ndiem = [2.0, 0.0, 2.0]\nmu = [math.exp(s) for s in diem]\ntong = sum(mu)\nprint(round(sum(m / tong for m in mu), 3))`,
      question: 'Tổng các trọng số softmax in ra là bao nhiêu?',
      choices: ['1.0', '3.0', '0.0', '2.0'],
      answerIndex: 0,
      explain:
        'Softmax chia mỗi exp cho TỔNG các exp, nên cộng lại luôn bằng đúng 1.0 dù dãy điểm là gì. Đó là lý do gọi nó là "phân bổ chú ý": bạn có 100% sự chú ý và phải chia hết cho các từ, ưu ái từ này là phải bớt từ khác.',
    },
    parsons: {
      prompt: 'Xếp đúng 4 bước self-attention: chấm điểm → chia thang → softmax → trộn V.',
      lines: [
        'diem = [sum(Q[i][t] * K[j][t] for t in range(d)) / math.sqrt(d) for j in range(n)]',
        'lon_nhat = max(diem)',
        'mu = [math.exp(s - lon_nhat) for s in diem]',
        'w = [m / sum(mu) for m in mu]',
        'ket = [sum(w[j] * V[j][t] for j in range(n)) for t in range(d)]',
      ],
    },
    make: {
      prompt:
        'Tự cài self-attention MỘT ĐẦU cho 3 "từ" đã nhúng sẵn trong starter code (Q = K = V, mỗi vector 2 chiều).\n\nChương trình đọc 1 dòng input(): chỉ số từ truy vấn (0, 1 hoặc 2).\n\nLàm đủ 4 bước: chấm điểm Q·K → chia √d → softmax TỰ CÀI bằng math.exp → trộn V. In đúng 2 dòng, mỗi số làm tròn 3 chữ số thập phân, ngăn nhau bằng dấu phẩy + khoảng trắng:\nTrong so: <w0>, <w1>, <w2>\nKet qua: <y0>, <y1>\n\nVí dụ với chỉ số 0 → "Trong so: 0.401, 0.198, 0.401" và "Ket qua: 0.802, 0.599".',
      starterCode: `import math\n\nQ = [[1, 0], [0, 1], [1, 1]]\nK = [[1, 0], [0, 1], [1, 1]]\nV = [[1, 0], [0, 1], [1, 1]]\nd = 2\n\ni = int(input("Chi so tu truy van: "))\n# (1) diem[j] = tich vo huong Q[i].K[j] roi chia math.sqrt(d)\n# (2) softmax tu cai: exp(diem - max) chia tong\n# (3) ket qua[t] = tong w[j] * V[j][t]\n# In: "Trong so: ..." va "Ket qua: ..." (round 3, noi bang ", ")\n`,
      testCases: [
        {
          stdinLines: ['0'],
          expected: 'Trong so: 0.401, 0.198, 0.401\nKet qua: 0.802, 0.599',
          match: 'contains',
          hidden: false,
          label: 'Từ 0 = [1,0]: chú ý nhiều vào từ 0 và từ 2 (cùng có chiều thứ nhất)',
        },
        {
          stdinLines: ['1'],
          expected: 'Trong so: 0.198, 0.401, 0.401\nKet qua: 0.599, 0.802',
          match: 'contains',
          hidden: false,
          label: 'Từ 1 = [0,1]: đối xứng với ca trên',
        },
        {
          stdinLines: ['2'],
          expected: 'Trong so: 0.248, 0.248, 0.503\nKet qua: 0.752, 0.752',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: từ 2 = [1,1] tự chú ý mình nhiều nhất (0.503)',
        },
      ],
      hints: [
        'Tích vô hướng hai vector 2 chiều: sum(Q[i][t] * K[j][t] for t in range(d)) — đúng công thức bài học.',
        'Softmax tự cài: lon_nhat = max(diem); mu = [math.exp(s - lon_nhat) for s in diem]; w = [m / sum(mu) for m in mu]. Trừ max không đổi kết quả nhưng chống tràn số.',
        'In đúng định dạng: print("Trong so: " + ", ".join(str(round(x, 3)) for x in w)) — join bằng ", " chứ không phải ",".',
      ],
      sampleSolution: `import math\n\nQ = [[1, 0], [0, 1], [1, 1]]\nK = [[1, 0], [0, 1], [1, 1]]\nV = [[1, 0], [0, 1], [1, 1]]\nd = 2\n\ni = int(input("Chi so tu truy van: "))\ndiem = []\nfor j in range(len(K)):\n    s = sum(Q[i][t] * K[j][t] for t in range(d))\n    diem.append(s / math.sqrt(d))\nlon_nhat = max(diem)\nmu = [math.exp(s - lon_nhat) for s in diem]\ntong = sum(mu)\nw = [m / tong for m in mu]\nprint("Trong so: " + ", ".join(str(round(x, 3)) for x in w))\nket = [sum(w[j] * V[j][t] for j in range(len(V))) for t in range(d)]\nprint("Ket qua: " + ", ".join(str(round(x, 3)) for x in ket))`,
    },
    homework:
      'Sửa code để in CẢ BẢNG trọng số 3×3 (vòng lặp i từ 0 đến 2) — đó chính là "attention map" mà các bài báo hay vẽ. Rồi thử đổi V thành [[10,0],[0,10],[5,5]] và quan sát: bảng trọng số có đổi không, vector kết quả có đổi không? Từ đó tự giải thích vì sao K và V phải là hai vector KHÁC nhau trong Transformer thật (K quyết định CHỌN AI, V quyết định LẤY GÌ).',
    srsCards: [
      {
        hoi: 'Q, K, V trong attention lần lượt đóng vai gì?',
        dap: 'Q (query) = "tôi đang tìm gì"; K (key) = "tôi có gì để được tìm thấy"; V (value) = "nội dung tôi đưa ra nếu được chọn". Điểm chú ý tính từ Q·K, còn thứ được trộn ra kết quả là V.',
      },
      {
        hoi: 'Vì sao phải chia điểm attention cho √d trước khi softmax?',
        dap: 'Tích vô hướng lớn dần theo số chiều d; điểm quá lớn làm softmax bão hoà (một trọng số ≈ 1, còn lại ≈ 0), gradient gần như bằng 0 nên mô hình không học được. Chia √d giữ điểm trong vùng softmax còn nhạy.',
      },
      {
        hoi: 'Softmax tự cài gồm những phép nào, và mẹo ổn định số học là gì?',
        dap: 'w[j] = exp(diem[j]) / tổng exp(diem) — kết quả dương và cộng lại bằng 1. Mẹo: trừ max(diem) trước khi lấy exp; kết quả toán học không đổi (tử mẫu cùng chia một hằng) nhưng tránh tràn số với điểm lớn.',
      },
    ],
  },
  {
    id: 'cv2-u1-l3',
    unitId: 'cv2-u1',
    language: 'python',
    title: 'Multi-head & positional encoding — nhiều góc nhìn và ý niệm thứ tự',
    hook: 'Attention bài trước có hai lỗ hổng chết người. Một: nó là phép tính trên TẬP HỢP — đảo "chó cắn người" thành "người cắn chó" ra kết quả y hệt. Hai: một đầu chú ý chỉ nhìn được một kiểu quan hệ. Transformer vá cả hai bằng hai mẹo đơn giản đến bất ngờ.',
    theory:
      'MULTI-HEAD ATTENTION (chú ý nhiều đầu). Thay vì một bộ Q/K/V chiều d, chia thành h bộ nhỏ chiều d/h, chạy attention ĐỘC LẬP song song, rồi nối kết quả lại và cho qua một lớp tuyến tính. Vì sao lợi: mỗi đầu tự do học một KIỂU quan hệ khác nhau — trong câu, đầu này chuyên nối đại từ với danh từ nó trỏ tới, đầu kia chuyên nối động từ với tân ngữ; trong ảnh, đầu này bám cạnh, đầu kia bám màu. Chi phí gần như không đổi vì mỗi đầu làm việc trên không gian nhỏ hơn h lần. Một đầu là "một ý kiến", nhiều đầu là "một hội đồng".\n\nPOSITIONAL ENCODING (mã hoá vị trí). Attention không có khái niệm thứ tự: nó nhìn chuỗi như một cái túi. Cách vá của Transformer gốc: CỘNG thẳng vào vector mỗi phần tử một "dấu vân tay vị trí" tính bằng sin/cos:\n  PE(pos, 2i)   = sin(pos / 10000^(2i/d))\n  PE(pos, 2i+1) = cos(pos / 10000^(2i/d))\nTức là chiều chẵn dùng sin, chiều lẻ dùng cos, và mỗi CẶP chiều có một bước sóng riêng — cặp đầu quay rất nhanh (phân biệt vị trí sát nhau), cặp sau quay rất chậm (phân biệt vị trí xa nhau). Giống kim giây/kim phút/kim giờ của đồng hồ: ba kim tốc độ khác nhau, đọc chung là biết chính xác thời điểm.\n\nHai tính chất khiến người ta chọn sin/cos: (a) không cần học tham số, chạy được với chuỗi DÀI HƠN mọi chuỗi từng thấy lúc huấn luyện; (b) vị trí pos+k biểu diễn được bằng phép quay tuyến tính từ pos, nên mô hình dễ học quan hệ "cách nhau k bước". Bản hiện đại (ViT, LLM 2026) hay dùng biến thể học được hoặc RoPE (quay vector Q/K theo vị trí), nhưng ý niệm cốt lõi vẫn đúng như trên: THỨ TỰ PHẢI ĐƯỢC BƠM VÀO, attention không tự có.',
    workedExample: {
      code: `import math

d = 4                       # so chieu cua vector nhung
for pos in range(3):        # 3 vi tri dau tien
    pe = []
    for i in range(d):
        # cap chieu thu (i//2) co buoc song rieng
        goc = pos / (10000 ** ((2 * (i // 2)) / d))
        # chieu chan dung sin, chieu le dung cos
        pe.append(math.sin(goc) if i % 2 == 0 else math.cos(goc))
    print(f"Vi tri {pos}: " + ", ".join(str(round(x, 4)) for x in pe))`,
      stdinLines: [],
    },
    predict: {
      code: `import math\npos = 0\nprint(round(math.sin(pos), 4), round(math.cos(pos), 4))`,
      question: 'Positional encoding của vị trí 0 với d = 2 in ra gì?',
      choices: ['0.0 1.0', '1.0 0.0', '0.0 0.0', '1.0 1.0'],
      answerIndex: 0,
      explain:
        'sin(0) = 0.0 và cos(0) = 1.0 — vị trí đầu tiên luôn có "vân tay" cố định (0, 1, 0, 1, …). Đó là mốc gốc: mọi vị trí sau được so với nó, và vì sin/cos tuần hoàn nên khoảng cách giữa hai vị trí đọc được bằng phép quay.',
    },
    parsons: {
      prompt: 'Xếp đúng thứ tự tính positional encoding cho một vị trí pos.',
      lines: [
        'pe = []',
        'for i in range(d):',
        '    goc = pos / (10000 ** ((2 * (i // 2)) / d))',
        '    pe.append(math.sin(goc) if i % 2 == 0 else math.cos(goc))',
        'print("PE: " + ", ".join(str(round(x, 4)) for x in pe))',
      ],
    },
    make: {
      prompt:
        'Tự cài positional encoding kiểu Transformer gốc cho d = 4 chiều.\n\nChương trình đọc 1 dòng input(): vị trí pos (số nguyên ≥ 0).\n\nVới i chạy từ 0 đến 3: goc = pos / (10000 ** ((2 * (i // 2)) / 4)); chiều CHẴN dùng math.sin(goc), chiều LẺ dùng math.cos(goc). In đúng 1 dòng, mỗi số làm tròn 4 chữ số, ngăn nhau bằng ", ":\nPE: <p0>, <p1>, <p2>, <p3>\n\nVí dụ pos = 0 → "PE: 0.0, 1.0, 0.0, 1.0".',
      starterCode: `import math\n\npos = int(input("Vi tri: "))\nd = 4\n# Vong for i in range(d): tinh goc, chon sin (i chan) hay cos (i le)\n# In: PE: ... (round 4, noi bang ", ")\n`,
      testCases: [
        {
          stdinLines: ['0'],
          expected: 'PE: 0.0, 1.0, 0.0, 1.0',
          match: 'contains',
          hidden: false,
          label: 'pos = 0 → mốc gốc sin/cos: 0, 1, 0, 1',
        },
        {
          stdinLines: ['1'],
          expected: 'PE: 0.8415, 0.5403, 0.01, 1.0',
          match: 'contains',
          hidden: false,
          label: 'pos = 1 → cặp chiều đầu quay nhanh, cặp sau gần như đứng yên',
        },
        {
          stdinLines: ['2'],
          expected: 'PE: 0.9093, -0.4161, 0.02, 0.9998',
          match: 'contains',
          hidden: false,
          label: 'pos = 2 → chiều 1 đã âm, chiều 2 mới nhích lên 0.02',
        },
        {
          stdinLines: ['5'],
          expected: 'PE: -0.9589, 0.2837, 0.05, 0.9988',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: pos = 5 — sin đã quay quá nửa vòng',
        },
      ],
      hints: [
        'Chỉ số CẶP chiều là i // 2 (chia lấy nguyên): i = 0,1 cùng cặp 0; i = 2,3 cùng cặp 1.',
        'Chọn sin/cos bằng i % 2: chẵn → math.sin(goc), lẻ → math.cos(goc). Viết gọn bằng biểu thức điều kiện.',
        'In: print("PE: " + ", ".join(str(round(x, 4)) for x in pe)).',
      ],
      sampleSolution: `import math\n\npos = int(input("Vi tri: "))\nd = 4\npe = []\nfor i in range(d):\n    goc = pos / (10000 ** ((2 * (i // 2)) / d))\n    pe.append(math.sin(goc) if i % 2 == 0 else math.cos(goc))\nprint("PE: " + ", ".join(str(round(x, 4)) for x in pe))`,
    },
    homework:
      'In positional encoding cho pos từ 0 đến 9 rồi nhìn theo CỘT: cột 0 (sin, bước sóng ngắn) đổi nhanh cỡ nào, cột 2 (bước sóng dài) đổi chậm cỡ nào? Sau đó trả lời bằng lời: nếu Transformer KHÔNG cộng positional encoding thì câu "chó cắn người" và "người cắn chó" cho ra cùng một kết quả — vì sao? (Gợi ý: attention là tổng có trọng số trên một TẬP HỢP.)',
    srsCards: [
      {
        hoi: 'Multi-head attention lợi hơn một đầu ở chỗ nào?',
        dap: 'Chia Q/K/V thành h bộ nhỏ chạy song song, mỗi đầu tự do học MỘT KIỂU quan hệ khác nhau (đại từ↔danh từ, động từ↔tân ngữ; cạnh↔màu trong ảnh), rồi nối lại. Chi phí gần như không đổi vì mỗi đầu làm trên không gian nhỏ hơn h lần.',
      },
      {
        hoi: 'Vì sao Transformer cần positional encoding?',
        dap: 'Attention là tổng có trọng số trên một TẬP HỢP nên không có khái niệm thứ tự — đảo từ vẫn ra kết quả y hệt. Phải bơm thứ tự vào bằng cách cộng "vân tay vị trí" (sin/cos nhiều bước sóng, hoặc RoPE/học được ở bản hiện đại) vào vector mỗi phần tử.',
      },
      {
        hoi: 'Vì sao positional encoding dùng sin/cos nhiều bước sóng khác nhau?',
        dap: 'Giống kim giây/phút/giờ: cặp chiều đầu quay nhanh phân biệt vị trí sát nhau, cặp sau quay chậm phân biệt vị trí xa nhau. Lợi thêm: không cần học tham số nên dùng được với chuỗi dài hơn lúc huấn luyện, và vị trí pos+k suy ra từ pos bằng phép quay tuyến tính.',
      },
    ],
  },
  {
    id: 'cv2-u1-l4',
    unitId: 'cv2-u1',
    language: 'python',
    title: 'ViT — cắt ảnh thành patch, coi mỗi patch là một "từ"',
    hook: 'Năm 2020 một nhóm ở Google thử điều gần như xấc xược: bỏ hết convolution, cắt ảnh thành 196 ô vuông, xếp thành một câu 196 "từ", rồi ném vào đúng Transformer của dịch máy. Tên bài báo nói hết: "An Image is Worth 16×16 Words". Nó thắng CNN — nhưng chỉ khi có đủ dữ liệu.',
    theory:
      'VISION TRANSFORMER (ViT) làm đúng 5 bước, không có bước nào bí ẩn:\n1. CẮT PATCH: ảnh 224×224 chia thành các ô 16×16 → 14×14 = 196 patch.\n2. LÀM PHẲNG + CHIẾU: mỗi patch 16×16×3 duỗi thành vector 768 số, nhân một ma trận để ra vector nhúng chiều d. Đây là "từ điển" của ViT.\n3. CỘNG POSITIONAL ENCODING (bài 3) — không có nó, xáo trộn các patch cho ra cùng kết quả, ảnh thành trò xếp hình vô nghĩa.\n4. QUA CÁC KHỐI TRANSFORMER: multi-head attention + mạng feed-forward, lặp 12 lớp (ViT-Base).\n5. ĐẦU PHÂN LOẠI: thêm một token đặc biệt [CLS] đứng đầu, sau các lớp thì vector của nó được coi là "tóm tắt cả ảnh", cho qua một lớp tuyến tính ra nhãn.\n\nCNN vs ViT — khác nhau ở ĐỊNH KIẾN CÀI SẴN (inductive bias). CNN được cài sẵn ba giả định về ảnh: cục bộ (pixel gần nhau liên quan), tương đương tịnh tiến (cùng một bộ lọc quét mọi vị trí: mèo dời sang góc phải thì đặc trưng của nó dời theo; pooling và lớp cuối gom lại nên mèo ở góc nào vẫn ra nhãn mèo), phân cấp (cạnh → hình → vật). Ba giả định này ĐÚNG với ảnh, nên CNN học nhanh, ít dữ liệu vẫn tốt. ViT gần như không có định kiến nào — nó phải HỌC cả những điều đó từ dữ liệu. Hệ quả đo được: dữ liệu nhỏ (ImageNet-1k) thì CNN thắng; dữ liệu rất lớn (JFT-300M) thì ViT vượt lên, vì không bị định kiến giới hạn trần.\n\nBức tranh 2026: ranh giới đã mờ. ConvNeXt là CNN vay mượn thiết kế của Transformer; Swin Transformer là ViT vay mượn tính cục bộ và phân cấp của CNN (attention trong cửa sổ trượt). Bài học nghề: KHÔNG có kiến trúc thắng tuyệt đối — chọn theo lượng dữ liệu, ngân sách tính toán và bài toán, đúng như chọn mô hình detection ở bài `cv2-u2-l4`.',
    workedExample: {
      code: `# Cat anh 4x4 thanh 4 patch 2x2, moi patch thanh mot "tu"
anh = [
    [1, 1, 2, 2],
    [1, 1, 2, 2],
    [3, 3, 4, 4],
    [3, 3, 4, 4],
]
kich_thuoc = 2                    # canh moi patch

chuoi = []
for r in range(0, 4, kich_thuoc):         # duyet theo hang patch
    for c in range(0, 4, kich_thuoc):     # roi theo cot patch
        o = [anh[r][c], anh[r][c + 1], anh[r + 1][c], anh[r + 1][c + 1]]
        print(f"Patch tai ({r},{c}) = {o}")
        chuoi.append(round(sum(o) / 4, 2))    # "nhung" tam thoi: lay trung binh
print(f"So patch: {len(chuoi)}")
print(f"Chuoi dua vao Transformer: {chuoi}")`,
      stdinLines: [],
    },
    predict: {
      code: `print((224 // 16) ** 2)`,
      question: 'Ảnh 224×224 cắt patch 16×16 thì Transformer nhận chuỗi dài bao nhiêu?',
      choices: ['196', '14', '256', '50176'],
      answerIndex: 0,
      explain:
        '224 / 16 = 14 patch mỗi chiều → 14 × 14 = 196 patch. So với 224 × 224 = 50.176 pixel: cắt patch giảm độ dài chuỗi 256 lần, tức giảm chi phí attention O(n²) khoảng 65.000 lần. Đó chính là mẹo khiến ViT khả thi.',
    },
    parsons: {
      prompt: 'Xếp đúng thứ tự cắt ảnh thành chuỗi patch.',
      lines: [
        'chuoi = []',
        'for r in range(0, 4, 2):',
        '    for c in range(0, 4, 2):',
        '        tong = anh[r][c] + anh[r][c + 1] + anh[r + 1][c] + anh[r + 1][c + 1]',
        '        chuoi.append(round(tong / 4, 2))',
        'print(f"So patch: {len(chuoi)}")',
      ],
    },
    make: {
      prompt:
        'Viết bước tiền xử lý của ViT: cắt ảnh 4×4 thành patch 2×2 và "nhúng" mỗi patch bằng giá trị trung bình của nó.\n\nChương trình đọc 4 dòng input(), mỗi dòng là 4 số cách nhau dấu phẩy (một hàng của ảnh).\n\nDuyệt theo thứ tự: patch trên-trái, trên-phải, dưới-trái, dưới-phải. In đúng 2 dòng:\nSo patch: 4\nChuoi patch: <tb0>, <tb1>, <tb2>, <tb3>\n\nMỗi trung bình làm tròn 2 chữ số, ngăn nhau bằng ", ".',
      starterCode: `anh = [[float(v) for v in input().split(",")] for _ in range(4)]\n# Hai vong for buoc 2: r in range(0, 4, 2), c in range(0, 4, 2)\n# Moi patch = 4 o: anh[r][c], anh[r][c+1], anh[r+1][c], anh[r+1][c+1]\n`,
      testCases: [
        {
          stdinLines: ['1,1,2,2', '1,1,2,2', '3,3,4,4', '3,3,4,4'],
          expected: 'So patch: 4\nChuoi patch: 1.0, 2.0, 3.0, 4.0',
          match: 'contains',
          hidden: false,
          label: '4 vùng đồng nhất → 4 patch đúng bằng giá trị vùng',
        },
        {
          stdinLines: ['1,2,3,4', '5,6,7,8', '9,10,11,12', '13,14,15,16'],
          expected: 'Chuoi patch: 3.5, 5.5, 11.5, 13.5',
          match: 'contains',
          hidden: false,
          label: 'Ảnh tăng dần → 4 trung bình patch',
        },
        {
          stdinLines: ['0,0,0,0', '0,0,0,0', '0,0,0,0', '0,0,0,0'],
          expected: 'Chuoi patch: 0.0, 0.0, 0.0, 0.0',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: ảnh đen tuyền — mọi patch bằng 0.0',
        },
      ],
      hints: [
        'Đọc ảnh: anh = [[float(v) for v in input().split(",")] for _ in range(4)] — starter code đã cho sẵn.',
        'Bước nhảy 2 trong range: range(0, 4, 2) cho r = 0 rồi r = 2 — đúng góc trên-trái của từng patch.',
        'In: print(f"So patch: {len(patch)}") rồi print("Chuoi patch: " + ", ".join(str(v) for v in patch)).',
      ],
      sampleSolution: `anh = [[float(v) for v in input().split(",")] for _ in range(4)]\npatch = []\nfor r in range(0, 4, 2):\n    for c in range(0, 4, 2):\n        tong = anh[r][c] + anh[r][c + 1] + anh[r + 1][c] + anh[r + 1][c + 1]\n        patch.append(round(tong / 4, 2))\nprint(f"So patch: {len(patch)}")\nprint("Chuoi patch: " + ", ".join(str(v) for v in patch))`,
    },
    homework:
      'Tính bằng tay cho ảnh 224×224: nếu patch là 32×32 thì chuỗi dài bao nhiêu, chi phí attention (n²) bằng bao nhiêu phần so với patch 16×16? Patch to thì rẻ hơn nhưng mất gì? Viết 3 câu về đánh đổi này. Sau đó tự trả lời: dự án của bạn chỉ có 2.000 ảnh gán nhãn — chọn CNN hay ViT, vì sao?',
    srsCards: [
      {
        hoi: 'ViT xử lý một tấm ảnh qua 5 bước nào?',
        dap: 'Cắt ảnh thành patch (16×16) → làm phẳng + chiếu tuyến tính thành vector nhúng → cộng positional encoding → qua các khối Transformer (multi-head attention + feed-forward) → token [CLS] đưa qua đầu phân loại ra nhãn.',
      },
      {
        hoi: 'Vì sao ViT cần rất nhiều dữ liệu hơn CNN?',
        dap: 'CNN được cài sẵn định kiến đúng về ảnh (cục bộ, tương đương tịnh tiến, phân cấp) nên ít dữ liệu vẫn học tốt. ViT gần như không có định kiến nào, phải HỌC cả những điều đó từ dữ liệu — nên thua ở dữ liệu nhỏ, vượt lên ở dữ liệu rất lớn vì không bị định kiến giới hạn trần.',
      },
      {
        hoi: 'Vì sao ViT cắt patch thay vì đưa từng pixel vào attention?',
        dap: 'Attention tốn O(n²): ảnh 224×224 có 50.176 pixel là bất khả thi. Cắt patch 16×16 rút chuỗi còn 196 phần tử — ngắn hơn 256 lần, chi phí attention giảm khoảng 65.000 lần.',
      },
    ],
  },
]
