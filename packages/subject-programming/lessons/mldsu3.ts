// lessons/mldsu3.ts — Ba project cuối của chương C4 "7 project thực chiến" (khoá ngắn
// "Machine Learning & Data Science", docs/specs/2026-09-01-mlds-bai-hoc-chi-tiet.md §3.5–3.7):
// ảnh, chuỗi thời gian, hệ gợi ý + tổng kết khoá.
//
// unitId 'mlds-u3' là "unit ảo" của tầng khoá ngắn (xem lessons/mldsu1.ts). Toàn bộ code được
// chấm viết bằng Python THUẦN — không numpy/sklearn/pandas.
import type { ProgrammingLesson } from '../lessonTypes.js'

export const MLDS_U3_LESSONS: ProgrammingLesson[] = [
  {
    id: 'mlds-u3-l1',
    unitId: 'mlds-u3',
    language: 'python',
    title: 'Project 5 — nhận chữ số trên ảnh 5×5 bằng k-NN pixel',
    hook: 'Máy tính không "nhìn thấy" chữ số 0. Nó thấy 25 con số 0 và 1 xếp thành lưới 5×5. Nếu bạn chấp nhận sự thật đó thì việc nhận dạng ảnh trở thành một phép đếm: lưới này khác lưới mẫu ở bao nhiêu ô?',
    theory:
      'Project 5 mở cánh cửa THỊ GIÁC MÁY TÍNH (computer vision) và là bài chuẩn bị trực tiếp cho khoá cv1.\n\nẢNH LÀ MA TRẬN SỐ. Ảnh xám 5×5 là 25 con số cường độ sáng (0–255). Bài này đơn giản hoá thành ảnh NHỊ PHÂN: mỗi ô chỉ 0 (nền) hoặc 1 (nét mực). Ảnh màu thì nhân ba (kênh R, G, B). Toàn bộ ngành thị giác máy tính đứng trên nhận thức này.\n\nĐẶC TRƯNG PIXEL THÔ (raw pixel features): coi thẳng 25 ô là 25 feature rồi ném vào k-NN. Cách thô sơ nhất mà vẫn chạy được — chính là baseline mà mọi bài báo phải vượt qua.\n\nKHOẢNG CÁCH HAMMING: với ảnh nhị phân, khoảng cách = số ô KHÁC NHAU giữa hai ảnh. Ở đây nó trùng với bình phương khoảng cách Euclid (vì (0−1)² = 1), nên hai cách đo cho cùng thứ tự — dùng cách nào cũng được, đếm ô khác nhau thì dễ hiểu hơn.\n\nk = 1 (nearest neighbor): lấy thẳng nhãn của mẫu gần nhất. Với 4 mẫu huấn luyện thì k = 1 là lựa chọn hợp lý; nó cũng làm kết quả tất định và dễ giải thích ("ảnh của bạn giống mẫu này nhất, lệch 1 ô").\n\nĐIỂM YẾU CHÍ TỬ của cách này — và chính là lý do CNN ra đời: k-NN pixel không chịu nổi DỊCH CHUYỂN. Lấy đúng ảnh số 1 rồi dịch sang phải một cột, mắt người vẫn thấy số 1, nhưng gần như MỌI ô đều đổi giá trị nên khoảng cách vọt lên rất lớn và mô hình đoán sai. Nó cũng không chịu được xoay, phóng to, hay đổi độ dày nét.\n\nCNN (mạng tích chập) giải quyết bằng bộ lọc TRƯỢT KHẮP ẢNH: cùng một bộ lọc dò cạnh được áp ở mọi vị trí, nên nét ngang nằm ở góc nào cũng được cùng bộ lọc phát hiện, và chỗ báo "có nét" dời theo đúng vị trí nét — tính chất gọi là tương đương tịnh tiến (translation equivariance). Đó là nội dung chính của khoá cv1; hôm nay bạn cần cảm nhận được VÌ SAO cần tới nó, bằng cách tự tay chạm vào giới hạn của cách làm ngây thơ.',
    workedExample: {
      code: `# Anh nhi phan 5x5 = 5 chuoi 5 ky tu "0"/"1"; khoang cach = so o khac nhau
MAU = [(["11111", "10001", "10001", "10001", "11111"], 0),
       (["00100", "01100", "00100", "00100", "01110"], 1)]

anh = ["01110", "10001", "10001", "10001", "01110"]   # mot chu so 0 kieu khac

for mau, nhan in MAU:
    d = 0
    for r in range(5):            # duyet tung hang
        for c in range(5):        # duyet tung cot
            if mau[r][c] != anh[r][c]:
                d += 1            # dem o khac nhau (khoang cach Hamming)
    print(f"Giong mau chu so {nhan}? khoang cach {d}")`,
      stdinLines: [],
    },
    predict: {
      code: `a = ["00100", "00100"]\nb = ["01000", "00100"]\nd = 0\nfor r in range(2):\n    for c in range(5):\n        if a[r][c] != b[r][c]:\n            d += 1\nprint(d)`,
      question: 'Khoảng cách Hamming giữa hai lưới này là bao nhiêu?',
      choices: ['2', '1', '0', '10'],
      answerIndex: 0,
      explain:
        'Hàng 2 giống hệt nhau (0 ô khác). Hàng 1: nét mực dịch từ cột 2 sang cột 1, nên có HAI ô đổi — ô cũ từ 1 thành 0 và ô mới từ 0 thành 1. Đây chính là điểm yếu của k-NN pixel: dịch một pixel mà mắt người thấy là "cùng một hình" đã làm khoảng cách tăng gấp đôi số nét bị dịch.',
    },
    parsons: {
      prompt: 'Xếp đúng thứ tự tìm mẫu gần nhất (k-NN với k = 1) trên ảnh.',
      lines: [
        'tot_nhat = None',
        'for mau, nhan in MAU:',
        '    d = sum(1 for r in range(5) for c in range(5) if mau[r][c] != anh[r][c])',
        '    if tot_nhat is None or d < tot_nhat:',
        '        tot_nhat = d',
        '        nhan_tot = nhan',
        'print(nhan_tot, tot_nhat)',
      ],
    },
    make: {
      prompt:
        'Làm trọn project nhận chữ số. Bốn ảnh mẫu 5×5 đã nhúng sẵn: hai kiểu viết chữ số 0 và hai kiểu viết chữ số 1, mỗi ảnh là danh sách 5 chuỗi, mỗi chuỗi 5 ký tự "0"/"1".\n\nChương trình đọc 5 dòng input(), mỗi dòng 5 ký tự — đó là ảnh cần nhận dạng.\n\nDùng k-NN với k = 1, khoảng cách = số ô khác nhau (Hamming). Khi nhiều mẫu cùng khoảng cách nhỏ nhất thì lấy mẫu ĐỨNG TRƯỚC trong danh sách.\n\nIn đúng 1 dòng:\nDu doan: chu so <nhãn> (khoang cach <d>)',
      starterCode: `MAU = [\n    (["11111", "10001", "10001", "10001", "11111"], 0),\n    (["01110", "10001", "10001", "10001", "01110"], 0),\n    (["00100", "01100", "00100", "00100", "01110"], 1),\n    (["00100", "00100", "00100", "00100", "00100"], 1),\n]\nanh = [input() for _ in range(5)]\n# Voi tung mau: dem so o khac nhau, giu lai mau co khoang cach nho nhat\n`,
      testCases: [
        {
          stdinLines: ['01110', '10001', '10001', '10001', '01100'],
          expected: 'Du doan: chu so 0 (khoang cach 1)',
          match: 'contains',
          hidden: false,
          label: 'Chữ số 0 bị mờ mất 1 pixel ở hàng cuối',
        },
        {
          stdinLines: ['00100', '01100', '00100', '00100', '01110'],
          expected: 'Du doan: chu so 1 (khoang cach 0)',
          match: 'contains',
          hidden: false,
          label: 'Trùng khít một mẫu → khoảng cách 0',
        },
        {
          stdinLines: ['00100', '00100', '00100', '00100', '01110'],
          expected: 'Du doan: chu so 1 (khoang cach 1)',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: chữ số 1 thiếu nét chân, gần mẫu thứ ba nhất',
        },
      ],
      hints: [
        'Đọc ảnh: anh = [input() for _ in range(5)] — năm lần gọi input(), mỗi lần một hàng.',
        'Truy cập ô: mau[r][c] lấy ký tự cột c của hàng r. Chuỗi Python đánh chỉ số như list nên không cần tách gì thêm.',
        'So sánh KÝ TỰ với ký tự ("0" != "1"), đừng đổi sang int — không cần, và đổi nửa vời sẽ so chuỗi với số rồi luôn ra "khác nhau".',
        'Giữ mẫu tốt nhất bằng "d < tot_nhat" (dấu < chứ không phải <=) để ca hoà giữ được mẫu ĐỨNG TRƯỚC, đúng như đề yêu cầu.',
      ],
      sampleSolution: `MAU = [\n    (["11111", "10001", "10001", "10001", "11111"], 0),\n    (["01110", "10001", "10001", "10001", "01110"], 0),\n    (["00100", "01100", "00100", "00100", "01110"], 1),\n    (["00100", "00100", "00100", "00100", "00100"], 1),\n]\nanh = [input() for _ in range(5)]\n\ntot_nhat = None\nnhan_tot = None\nfor mau, nhan in MAU:\n    d = 0\n    for r in range(5):\n        for c in range(5):\n            if mau[r][c] != anh[r][c]:\n                d += 1\n    if tot_nhat is None or d < tot_nhat:\n        tot_nhat = d\n        nhan_tot = nhan\nprint(f"Du doan: chu so {nhan_tot} (khoang cach {tot_nhat})")`,
    },
    homework:
      'Lấy đúng ảnh mẫu chữ số 1 rồi DỊCH toàn bộ nét sang phải một cột, đưa vào chương trình. Ghi lại khoảng cách tới từng mẫu và xem mô hình có còn đoán đúng không. Rồi tự vẽ 5 ảnh 5×5 của riêng bạn (chữ thập, dấu trừ, hình vuông) và nghĩ xem cần thêm bao nhiêu mẫu để mô hình nhận được chúng. Con số bạn ước lượng chính là lý do bộ dữ liệu MNIST có 60.000 ảnh, và lý do CNN được phát minh.',
    srsCards: [
      {
        hoi: 'Máy tính "nhìn" một tấm ảnh dưới dạng gì?',
        dap: 'Một ma trận số. Ảnh xám là lưới cường độ sáng 0–255; ảnh màu là ba lưới (R, G, B). Ảnh nhị phân 5×5 trong bài là 25 số 0/1.',
      },
      {
        hoi: 'Khoảng cách Hamming giữa hai ảnh nhị phân là gì?',
        dap: 'Số ô có giá trị khác nhau giữa hai ảnh. Với ảnh 0/1 nó trùng với bình phương khoảng cách Euclid nên cho cùng thứ tự hàng xóm.',
      },
      {
        hoi: 'Điểm yếu chí tử của k-NN trên pixel thô là gì?',
        dap: 'Không chịu được dịch chuyển/xoay/phóng to: dịch một hình sang phải một cột làm gần như mọi ô đổi giá trị, khoảng cách vọt lên dù mắt người thấy vẫn là hình cũ.',
      },
      {
        hoi: 'CNN khắc phục điểm yếu đó bằng cách nào?',
        dap: 'Dùng bộ lọc TRƯỢT khắp ảnh — cùng một bộ lọc dò cạnh được áp ở mọi vị trí, nên đặc trưng được nhận ra dù nằm ở đâu, và bản đồ đặc trưng dời theo vật (tương đương tịnh tiến).',
      },
    ],
  },
  {
    id: 'mlds-u3-l2',
    unitId: 'mlds-u3',
    language: 'python',
    title: 'Project 6 — dự báo doanh thu bằng trung bình trượt và đo bằng MAPE',
    hook: 'Doanh thu tháng này 165 triệu. Tháng sau bao nhiêu? Trước khi nghĩ tới bất kỳ mô hình nào, hãy trả lời bằng câu đơn giản nhất: "bằng tháng trước". Nghe ngớ ngẩn, nhưng dự báo naive đó là ĐỐI THỦ mà mọi mô hình phức tạp phải đánh bại — và rất nhiều mô hình đắt tiền đã thua nó.',
    theory:
      'Project 6 chạm vào loại dữ liệu mà THỨ TỰ chính là thông tin.\n\nCHUỖI THỜI GIAN (time series) khác mọi dữ liệu trước đó ở một điểm quyết định: các quan sát KHÔNG độc lập, và không được xáo trộn. Hệ quả trực tiếp lên cách chia train/test: bạn TUYỆT ĐỐI không được chia ngẫu nhiên. Train phải là quá khứ, test phải là tương lai — chia ngẫu nhiên nghĩa là dùng tháng 12 để dự báo tháng 6, tức rò rỉ dữ liệu ở dạng thô bạo nhất.\n\nBA THÀNH PHẦN của một chuỗi: XU HƯỚNG (trend — đi lên/xuống dài hạn), MÙA VỤ (seasonality — chu kỳ lặp: Tết, cuối tuần, giờ cao điểm), NHIỄU (noise — phần còn lại).\n\nTRUNG BÌNH TRƯỢT (moving average) cửa sổ k: mỗi điểm được thay bằng trung bình k điểm gần nhất. Tác dụng: LÀM MƯỢT — xoá bớt nhiễu để nhìn rõ xu hướng. Đánh đổi: k càng lớn càng mượt nhưng càng CHẬM phản ứng với thay đổi thật, và bạn mất k−1 điểm đầu chuỗi (chưa đủ dữ liệu để tính). Dự báo đơn giản nhất từ nó: điểm kế tiếp = trung bình k điểm cuối.\n\nHAI ĐƯỜNG CƠ SỞ (baseline) bắt buộc phải tính trước khi khoe mô hình:\n- NAIVE: dự báo tháng t = giá trị tháng t−1.\n- NAIVE THEO MÙA: dự báo tháng t = giá trị cùng kỳ chu kỳ trước (t−12 với dữ liệu tháng). Với dữ liệu có mùa vụ mạnh, baseline này rất khó đánh bại.\nLuật nghề: một mô hình không thắng nổi baseline là một mô hình chưa dùng được, dù nó phức tạp tới đâu.\n\nMAPE (Mean Absolute Percentage Error) = trung bình của |thật − dự báo| / |thật|, nhân 100 để ra phần trăm. Vì sao dùng nó thay MAE ở đây: doanh thu có thể là 100 triệu hay 100 tỉ, sai 10 triệu mang ý nghĩa hoàn toàn khác nhau ở hai quy mô; phần trăm so sánh được giữa các chuỗi khác quy mô. Nhược điểm phải nhớ: MAPE VỠ khi giá trị thật bằng 0 (chia cho 0) và phạt lệch-lên nặng hơn lệch-xuống.\n\nMô hình thật của ngành đi tiếp từ đây: ARIMA, ETS/Holt-Winters (làm mượt có mùa vụ), Prophet, và các mô hình học sâu cho chuỗi. Tất cả đều phải báo cáo kèm baseline naive.',
    workedExample: {
      code: `# Trung binh truot k=3 va MAPE cua du bao naive
DOANH_THU = [100, 110, 105, 120, 130, 125]
k = 3

truot = []
for i in range(k - 1, len(DOANH_THU)):        # bat dau tu diem thu k
    cua_so = DOANH_THU[i - k + 1 : i + 1]      # k diem gan nhat, ke ca diem hien tai
    truot.append(round(sum(cua_so) / k, 2))
print("Trung binh truot:", truot)
print("Du bao ky sau:", truot[-1])             # trung binh k ky cuoi

tong_sai = 0.0
for t in range(1, len(DOANH_THU)):             # naive: du bao ky t = gia tri ky t-1
    tong_sai += abs(DOANH_THU[t] - DOANH_THU[t - 1]) / DOANH_THU[t]
mape = tong_sai / (len(DOANH_THU) - 1) * 100   # chia cho SO LAN du bao, khong phai do dai chuoi
print(f"MAPE naive: {round(mape, 2)}%")`,
      stdinLines: [],
    },
    predict: {
      code: `chuoi = [10, 20, 30, 40]\nk = 2\ntruot = []\nfor i in range(k - 1, len(chuoi)):\n    truot.append(sum(chuoi[i - k + 1 : i + 1]) / k)\nprint(len(truot), truot[0])`,
      question: 'Chuỗi 4 điểm với cửa sổ k = 2 cho bao nhiêu giá trị trượt, và giá trị đầu là gì?',
      choices: ['3 15.0', '4 10.0', '3 20.0', '2 15.0'],
      answerIndex: 0,
      explain:
        'Vòng lặp chạy từ i = 1 tới i = 3 nên có 3 giá trị; giá trị đầu là (10 + 20) / 2 = 15.0. Quy tắc chung: cửa sổ k trên chuỗi n điểm cho n − k + 1 giá trị — bạn LUÔN mất k − 1 điểm đầu vì chưa đủ dữ liệu để lấp đầy cửa sổ.',
    },
    parsons: {
      prompt: 'Xếp đúng thứ tự tính trung bình trượt rồi dự báo kỳ kế tiếp.',
      lines: [
        'truot = []',
        'for i in range(k - 1, len(DOANH_THU)):',
        '    cua_so = DOANH_THU[i - k + 1 : i + 1]',
        '    truot.append(round(sum(cua_so) / k, 2))',
        'du_bao = truot[-1]',
        'print(du_bao)',
      ],
    },
    make: {
      prompt:
        'Làm trọn project dự báo doanh thu. Chuỗi 12 tháng đã nhúng sẵn trong starterCode.\n\nChương trình đọc MỘT dòng input(): cửa sổ k (số nguyên ≥ 1).\n\nIn đúng 3 dòng:\nTrung binh truot k=<k>: <các giá trị cách nhau bởi dấu cách>\nDu bao thang 13: <giá trị trượt cuối cùng>\nMAPE du bao naive: <x>%\n\nQuy tắc:\n- Trung bình trượt cửa sổ k, mỗi giá trị làm tròn 2 chữ số; chuỗi 12 điểm cho 12 − k + 1 giá trị.\n- Dự báo tháng 13 = giá trị trượt cuối cùng.\n- MAPE của dự báo NAIVE (dự báo tháng t = giá trị tháng t−1), tính trên 11 lần dự báo, công thức trung bình của |thật − dự báo| / thật, nhân 100, làm tròn 2 chữ số.\n\nVí dụ k = 3 → dự báo tháng 13 là 165.0 và MAPE 7.01%.',
      starterCode: `DOANH_THU = [100, 110, 105, 120, 130, 125, 140, 150, 145, 160, 170, 165]\nk = int(input("Cua so k: "))\ntruot = []\n# Tinh trung binh truot cua so k (nho lam tron 2 chu so moi gia tri)\n# In chuoi truot, du bao thang 13, roi MAPE cua du bao naive\n`,
      testCases: [
        {
          stdinLines: ['3'],
          expected:
            'Trung binh truot k=3: 105.0 111.67 118.33 125.0 131.67 138.33 145.0 151.67 158.33 165.0\nDu bao thang 13: 165.0\nMAPE du bao naive: 7.01%',
          match: 'contains',
          hidden: false,
          label: 'Cửa sổ 3 → 10 giá trị trượt, dự báo 165.0',
        },
        {
          stdinLines: ['4'],
          expected: 'Du bao thang 13: 160.0',
          match: 'contains',
          hidden: false,
          label: 'Cửa sổ rộng hơn → dự báo bị kéo về quá khứ nhiều hơn',
        },
        {
          stdinLines: ['2'],
          expected: 'Du bao thang 13: 167.5',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: cửa sổ hẹp bám sát dữ liệu mới nhất',
        },
      ],
      hints: [
        'Vòng lặp bắt đầu từ i = k − 1, không phải 0 — trước đó chưa đủ k điểm để lấp đầy cửa sổ.',
        'Cắt cửa sổ: DOANH_THU[i - k + 1 : i + 1] — nhớ Python cắt tới trước chỉ số cuối, nên phải viết i + 1 mới lấy được điểm thứ i.',
        'Nối chuỗi kết quả: " ".join(str(x) for x in truot). Vì bạn đã round() từng giá trị khi thêm vào list, str() sẽ in đúng dạng 111.67 và 105.0.',
        'MAPE chia cho SỐ LẦN dự báo (len − 1 = 11), không phải cho độ dài chuỗi (12). Mẫu số của mỗi số hạng là giá trị THẬT của tháng t, không phải tháng t−1.',
      ],
      sampleSolution: `DOANH_THU = [100, 110, 105, 120, 130, 125, 140, 150, 145, 160, 170, 165]\nk = int(input("Cua so k: "))\n\ntruot = []\nfor i in range(k - 1, len(DOANH_THU)):\n    cua_so = DOANH_THU[i - k + 1 : i + 1]\n    truot.append(round(sum(cua_so) / k, 2))\nprint(f"Trung binh truot k={k}: " + " ".join(str(x) for x in truot))\nprint(f"Du bao thang 13: {truot[-1]}")\n\ntong_sai = 0.0\nfor t in range(1, len(DOANH_THU)):\n    tong_sai += abs(DOANH_THU[t] - DOANH_THU[t - 1]) / DOANH_THU[t]\nmape = tong_sai / (len(DOANH_THU) - 1) * 100\nprint(f"MAPE du bao naive: {round(mape, 2)}%")`,
    },
    homework:
      'Chạy chương trình với k = 2, 3, 4, 6 và ghi lại bốn con số dự báo tháng 13. Chúng khác nhau — hãy giải thích vì sao k lớn lại cho dự báo THẤP hơn với chuỗi đang đi lên. Rồi lấy doanh thu (hoặc số bước chân, số giờ học) 12 kỳ thật của bạn, tính MAPE naive và trả lời: chuỗi của bạn dễ hay khó dự báo? MAPE naive dưới 5% nghĩa là chuỗi rất ổn định; trên 30% nghĩa là đừng tin bất kỳ dự báo nào cho tới khi tìm được thêm biến giải thích.',
    srsCards: [
      {
        hoi: 'Vì sao không được chia train/test NGẪU NHIÊN với chuỗi thời gian?',
        dap: 'Vì thứ tự là thông tin và các quan sát không độc lập. Chia ngẫu nhiên nghĩa là dùng tương lai để dự báo quá khứ — rò rỉ dữ liệu ở dạng thô bạo nhất. Train phải là quá khứ, test là tương lai.',
      },
      {
        hoi: 'Trung bình trượt cửa sổ k đánh đổi điều gì?',
        dap: 'k lớn → mượt hơn, ít nhiễu hơn, nhưng CHẬM phản ứng với thay đổi thật và mất k − 1 điểm đầu chuỗi.',
      },
      {
        hoi: 'Hai baseline bắt buộc phải tính cho bài dự báo là gì?',
        dap: 'Naive (dự báo kỳ t = giá trị kỳ t−1) và naive theo mùa (= giá trị cùng kỳ chu kỳ trước). Mô hình không thắng nổi baseline là mô hình chưa dùng được.',
      },
      {
        hoi: 'MAPE là gì và nhược điểm của nó?',
        dap: 'Trung bình của |thật − dự báo| / |thật| × 100, so sánh được giữa các chuỗi khác quy mô. Nhược: vỡ khi giá trị thật bằng 0, và phạt lệch-lên nặng hơn lệch-xuống.',
      },
    ],
  },
  {
    id: 'mlds-u3-l3',
    unitId: 'mlds-u3',
    language: 'python',
    title: 'Project 7 — "người giống bạn cũng thích" và tổng kết khoá',
    hook: 'Netflix không hiểu bộ phim bạn vừa xem nói về cái gì. Nó chỉ biết một điều: có 4.000 người chấm điểm giống hệt bạn, và 3.900 người trong số đó đã xem tiếp bộ này. Lọc cộng tác là thuật toán kiếm ra nhiều tiền bậc nhất ngành, và ruột của nó là một phép đo góc giữa hai vector.',
    theory:
      'Project cuối: hệ gợi ý, rồi tổng kết cả khoá.\n\nHAI TRƯỜNG PHÁI GỢI Ý:\n- Content-based: gợi ý thứ GIỐNG món bạn đã thích (cùng thể loại, cùng đạo diễn). Cần mô tả nội dung.\n- Collaborative filtering (LỌC CỘNG TÁC): gợi ý thứ mà NGƯỜI GIỐNG BẠN đã thích. Không cần biết gì về nội dung món hàng — chỉ cần ma trận đánh giá. Đây là thứ ta cài hôm nay.\n\nMA TRẬN ĐÁNH GIÁ: hàng là người, cột là phim, ô là điểm chấm; 0 nghĩa là CHƯA XEM (không phải "chấm 0 điểm" — hai thứ khác hẳn nhau và lẫn lộn chúng là lỗi thiết kế kinh điển). Ma trận thật THƯA khủng khiếp: mỗi người chỉ xem vài chục trong hàng triệu món.\n\nCOSINE SIMILARITY đo GÓC giữa hai vector đánh giá:\n  cos(u, v) = (u · v) / (|u| × |v|)\nBằng 1 khi hai người cùng hướng sở thích, bằng 0 khi không liên quan. Vì sao dùng cosine chứ không phải khoảng cách Euclid: cosine bỏ qua ĐỘ LỚN. Người hào phóng chấm toàn 4–5 và người khó tính chấm toàn 1–2 nhưng cùng thứ tự ưu tiên sẽ có cosine rất cao, dù khoảng cách Euclid giữa họ rất xa. Ta muốn bắt GU, không phải bắt thói quen chấm điểm.\n\nQUY TRÌNH user-based, đúng bốn bước:\n1. Tính cosine giữa người cần gợi ý và mọi người khác.\n2. Lấy N người giống nhất (ở đây N = 2).\n3. Với mỗi món người đó CHƯA xem: điểm = tổng (cosine × điểm người hàng xóm chấm). Nhân với cosine để hàng xóm giống hơn có tiếng nói nặng hơn.\n4. Gợi ý món điểm cao nhất.\n\nHAI VẤN ĐỀ CỦA NGÀNH phải biết tên: KHỞI ĐẦU LẠNH (cold start) — người mới chưa chấm gì thì không có hàng xóm, phải chữa bằng gợi ý phổ biến hoặc hỏi vài câu lúc đăng ký. VÒNG PHẢN HỒI (filter bubble) — hệ chỉ gợi ý thứ giống cái đã xem, dần bịt kín tầm nhìn người dùng; các hệ tốt cố ý chèn thêm yếu tố đa dạng. Đây là quyết định đạo đức, không phải quyết định kỹ thuật.\n\n=== TỔNG KẾT KHOÁ mlds ===\nBạn đã đi trọn một vòng nghề dữ liệu: LÀM SẠCH (thiếu/trùng/ngoại lai) → KHÁM PHÁ (group-by) → TẠO ĐẶC TRƯNG (one-hot, binning, chuẩn hoá, chống rò rỉ) → ĐÁNH GIÁ ĐÚNG (precision/recall/F1) → BẢY PROJECT phủ hồi quy, phân loại, gom cụm, văn bản, ảnh, chuỗi thời gian, hệ gợi ý.\n\nBa điều đáng mang theo hơn cả code:\n1. Chất lượng DỮ LIỆU quyết định nhiều hơn lựa chọn thuật toán.\n2. Mọi con số phải đi kèm cách đo và đường cơ sở để so.\n3. Mô hình học từ quá khứ nên nó kế thừa cả thiên kiến của quá khứ.\n\nLỐI ĐI TIẾP: khoá cv1 (deep learning cho thị giác — bạn đã chạm giới hạn của k-NN pixel ở project 5), khoá llmagent (LLM và tác tử — nối tiếp bag-of-words của project 4), hoặc hướng chuyên sâu `data` / `ai` để đi theo bản đồ nghề dài hạn.',
    workedExample: {
      code: `import math
DANH_GIA = {"an": [5, 4, 0, 1, 0],       # 0 = CHUA XEM, khong phai cham 0 diem
            "binh": [4, 5, 3, 1, 0],
            "chi": [1, 0, 4, 5, 4]}

def cosine(u, v):
    tich = sum(u[i] * v[i] for i in range(len(u)))          # tich vo huong
    do_dai_u = math.sqrt(sum(x * x for x in u))             # do dai vector u
    do_dai_v = math.sqrt(sum(x * x for x in v))
    if do_dai_u == 0 or do_dai_v == 0:
        return 0.0                                          # nguoi chua cham gi
    return tich / (do_dai_u * do_dai_v)

print("an vs binh:", round(cosine(DANH_GIA["an"], DANH_GIA["binh"]), 2))
print("an vs chi:", round(cosine(DANH_GIA["an"], DANH_GIA["chi"]), 2))`,
      stdinLines: [],
    },
    predict: {
      code: `import math\nu = [1, 2, 3]\nv = [2, 4, 6]\ntich = sum(u[i] * v[i] for i in range(3))\nprint(round(tich / (math.sqrt(14) * math.sqrt(56)), 2))`,
      question:
        'Hai người có gu y hệt nhau nhưng một người chấm điểm gấp đôi. Cosine bằng bao nhiêu?',
      choices: ['1.0', '0.5', '2.0', '0.0'],
      answerIndex: 0,
      explain:
        'v = 2u nên hai vector cùng HƯỚNG, góc bằng 0 và cosine bằng 1.0 — đúng điều ta muốn: hai người cùng gu, chỉ khác thói quen chấm điểm rộng tay. Khoảng cách Euclid giữa hai vector này lại khá lớn, nên nếu dùng Euclid ta sẽ kết luận sai rằng họ không giống nhau.',
    },
    parsons: {
      prompt: 'Xếp đúng bốn bước lọc cộng tác user-based.',
      lines: [
        'hang_xom = [(cosine(toi, vec), nguoi) for nguoi, vec in DANH_GIA.items() if nguoi != ten]',
        'hang_xom.sort(reverse=True)',
        'top2 = hang_xom[:2]',
        'diem = {PHIM[i]: sum(c * DANH_GIA[n][i] for c, n in top2) for i in range(len(PHIM)) if toi[i] == 0}',
        'tot = max(diem, key=lambda p: diem[p])',
      ],
    },
    make: {
      prompt:
        'Làm trọn project hệ gợi ý phim. Ma trận đánh giá 4 người × 5 phim đã nhúng sẵn, điểm 1–5 và 0 nghĩa là chưa xem.\n\nChương trình đọc MỘT dòng input(): tên người cần gợi ý ("an", "binh", "chi" hoặc "dung").\n\nQuy trình: tính cosine giữa người đó và 3 người còn lại → lấy 2 người giống nhất → với mỗi phim người đó CHƯA xem, điểm gợi ý = tổng (cosine × điểm mà hàng xóm đó chấm) → chọn phim điểm cao nhất.\n\nIn đúng 2 dòng:\nNguoi giong nhat: <tên> (cosine <x>)\nGoi y cho <tên>: <tên phim> (diem <y>)\n\nCả hai con số làm tròn 2 chữ số.',
      starterCode: `import math\n\nPHIM = ["Bo Gia", "Mat Biec", "Rom", "De Men", "Trang Ti"]\nDANH_GIA = {\n    "an": [5, 4, 0, 1, 0],\n    "binh": [4, 5, 3, 1, 0],\n    "chi": [1, 0, 4, 5, 4],\n    "dung": [0, 1, 5, 4, 5],\n}\n# Viet ham cosine(u, v), tinh do giong voi 3 nguoi con lai\n# Lay 2 nguoi giong nhat, cham diem cac phim CHUA xem (o bang 0), chon phim cao nhat\n`,
      testCases: [
        {
          stdinLines: ['an'],
          expected: 'Nguoi giong nhat: binh (cosine 0.89)\nGoi y cho an: Rom (diem 3.47)',
          match: 'contains',
          hidden: false,
          label: 'An giống Binh nhất; phim Rom được Binh chấm 3 điểm',
        },
        {
          stdinLines: ['chi'],
          expected: 'Goi y cho chi: Mat Biec (diem 2.89)',
          match: 'contains',
          hidden: false,
          label: 'Chi chỉ còn đúng một phim chưa xem',
        },
        {
          stdinLines: ['dung'],
          expected: 'Goi y cho dung: Bo Gia (diem 2.6)',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: hàng xóm giống nhất chấm phim đó thấp, người kia chấm cao',
        },
      ],
      hints: [
        'Hàm cosine cần ba đại lượng: tích vô hướng, độ dài u, độ dài v. Nhớ nhánh trả về 0.0 khi một vector toàn 0, nếu không sẽ chia cho 0.',
        'Xây danh sách hàng xóm dạng (cosine, tên) rồi hang_xom.sort(reverse=True) — Python sắp xếp theo phần tử đầu nên tự động ra giảm dần theo độ giống.',
        'Chỉ chấm điểm những phim mà toi[i] == 0 (chưa xem). Gợi ý một phim người ta đã xem là lỗi nghiệp vụ, dù điểm có cao tới đâu.',
        'Chọn phim tốt nhất: max(diem, key=lambda p: diem[p]) — max trên dict duyệt các KHOÁ, tham số key nói cho nó so sánh bằng giá trị nào.',
      ],
      sampleSolution: `import math\n\nPHIM = ["Bo Gia", "Mat Biec", "Rom", "De Men", "Trang Ti"]\nDANH_GIA = {\n    "an": [5, 4, 0, 1, 0],\n    "binh": [4, 5, 3, 1, 0],\n    "chi": [1, 0, 4, 5, 4],\n    "dung": [0, 1, 5, 4, 5],\n}\n\n\ndef cosine(u, v):\n    tich = sum(u[i] * v[i] for i in range(len(u)))\n    do_dai_u = math.sqrt(sum(x * x for x in u))\n    do_dai_v = math.sqrt(sum(x * x for x in v))\n    if do_dai_u == 0 or do_dai_v == 0:\n        return 0.0\n    return tich / (do_dai_u * do_dai_v)\n\n\nten = input("Ban la ai: ").strip()\ntoi = DANH_GIA[ten]\n\nhang_xom = []\nfor nguoi, vec in DANH_GIA.items():\n    if nguoi != ten:\n        hang_xom.append((cosine(toi, vec), nguoi))\nhang_xom.sort(reverse=True)\nprint(f"Nguoi giong nhat: {hang_xom[0][1]} (cosine {round(hang_xom[0][0], 2)})")\n\ntop2 = hang_xom[:2]\ndiem = {}\nfor i in range(len(PHIM)):\n    if toi[i] == 0:\n        s = 0.0\n        for cos_val, nguoi in top2:\n            s += cos_val * DANH_GIA[nguoi][i]\n        diem[PHIM[i]] = s\ntot = max(diem, key=lambda p: diem[p])\nprint(f"Goi y cho {ten}: {tot} (diem {round(diem[tot], 2)})")`,
    },
    homework:
      'Hai việc chốt khoá. (1) Thêm một người thứ năm chưa chấm phim nào (toàn số 0) rồi chạy chương trình cho người đó — bạn sẽ tự tay chạm vào bài toán khởi đầu lạnh; viết ra cách bạn sẽ chữa. (2) Nhìn lại 7 project và chọn MỘT cái bạn muốn làm nghiêm túc với dữ liệu thật của mình, rồi viết nửa trang: câu hỏi cần trả lời, dữ liệu lấy ở đâu, feature nào (đã rà rò rỉ chưa), thước đo nào và baseline là gì. Nửa trang đó chính là bản đặc tả một dự án dữ liệu — thứ mà người đi làm viết trước khi gõ dòng code đầu tiên.',
    srsCards: [
      {
        hoi: 'Lọc cộng tác khác gợi ý theo nội dung ở chỗ nào?',
        dap: 'Content-based gợi ý thứ GIỐNG món bạn đã thích (cần mô tả nội dung). Lọc cộng tác gợi ý thứ mà NGƯỜI GIỐNG BẠN đã thích — chỉ cần ma trận đánh giá, không cần biết gì về món hàng.',
      },
      {
        hoi: 'Vì sao dùng cosine chứ không phải khoảng cách Euclid để đo độ giống người dùng?',
        dap: 'Cosine đo GÓC nên bỏ qua độ lớn: người chấm rộng tay (toàn 4–5) và người khó tính (toàn 1–2) cùng gu vẫn có cosine cao. Ta muốn bắt gu, không bắt thói quen chấm điểm.',
      },
      {
        hoi: 'Trong ma trận đánh giá, số 0 nghĩa là gì?',
        dap: 'CHƯA XEM, không phải "chấm 0 điểm". Lẫn lộn hai thứ này là lỗi thiết kế kinh điển — nó biến sự vắng mặt của dữ liệu thành một đánh giá tiêu cực.',
      },
      {
        hoi: 'Hai vấn đề kinh điển của hệ gợi ý là gì?',
        dap: 'Khởi đầu lạnh (người/món mới chưa có dữ liệu để tìm hàng xóm) và vòng phản hồi/bong bóng lọc (chỉ gợi ý thứ giống cái đã xem, bịt kín tầm nhìn người dùng).',
      },
    ],
  },
]
