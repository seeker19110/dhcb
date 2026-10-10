// lessons/toan8c7.ts — Toán 8, Chương 7: Phương trình bậc nhất và hàm số bậc nhất.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN8_C7_LESSONS: MathLesson[] = [
  {
    id: 'toan8-c7-b1',
    grade: '8',
    chapterNumber: 7,
    chapterTitle: 'Phương trình bậc nhất và hàm số bậc nhất',
    lessonNumber: 1,
    title: 'Phương trình bậc nhất một ẩn và cách giải',
    hook:
      'Gia đình An thuê một chiếc xe tải nhỏ chở đồ chuyển nhà. Phí mở máy là 20 nghìn đồng, mỗi ki-lô-mét tính thêm 8 nghìn đồng, và tổng hoá đơn là 100 nghìn đồng. ' +
      'Gọi x là số ki-lô-mét đã đi, ta có đẳng thức 20 + 8x = 100. Đây là một phương trình: ta phải tìm giá trị của x làm cho hai vế bằng nhau. ' +
      'Bài này dạy cách giải loại phương trình đơn giản và hay gặp nhất, phương trình bậc nhất một ẩn.',
    theory:
      'PHƯƠNG TRÌNH MỘT ẨN VÀ NGHIỆM\n' +
      'Phương trình một ẩn x có dạng A(x) = B(x), trong đó A(x) và B(x) là các biểu thức của x. Số a gọi là nghiệm của phương trình nếu thay x = a thì hai vế bằng nhau. ' +
      'Giải phương trình là tìm tất cả các nghiệm của nó.\n\n' +
      'PHƯƠNG TRÌNH BẬC NHẤT MỘT ẨN\n' +
      'Là phương trình có dạng ax + b = 0 với a, b là các số cho trước và a ≠ 0. Ví dụ 2x − 6 = 0; 5 − 3x = 0. ' +
      'Phương trình bậc nhất luôn có đúng một nghiệm x = −b/a.\n' +
      'VÌ SAO điều kiện a ≠ 0? Nếu a = 0 thì phương trình thành 0x + b = 0: khi b ≠ 0 nó vô nghiệm (không số nào thỏa), còn khi b = 0 mọi số đều là nghiệm. Cả hai trường hợp đều không còn "đúng một nghiệm".\n\n' +
      'HAI QUY TẮC BIẾN ĐỔI\n' +
      '— Quy tắc chuyển vế: chuyển một hạng tử từ vế này sang vế kia thì phải ĐỔI DẤU hạng tử đó.\n' +
      '— Quy tắc nhân (chia): nhân (hoặc chia) cả hai vế với cùng một số khác 0.\n' +
      'Mỗi lần biến đổi như vậy cho một phương trình tương đương (cùng tập nghiệm), nên nghiệm không bị mất hay thêm.\n\n' +
      'CÁC BƯỚC GIẢI\n' +
      '1) Có mẫu số thì quy đồng và khử mẫu: nhân cả hai vế với BCNN của các mẫu (nhớ nhân cả các hạng tử không có mẫu).\n' +
      '2) Bỏ ngoặc (chú ý dấu trừ đứng trước ngoặc).\n' +
      '3) Chuyển các hạng tử chứa ẩn sang một vế, hằng số sang vế kia.\n' +
      '4) Thu gọn rồi chia hai vế cho hệ số của ẩn.\n' +
      '5) Thử lại nghiệm vào phương trình ban đầu để chắc chắn.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Chuyển vế mà không đổi dấu: 3x = x + 4 thành 3x + x = 4 (sai).\n' +
      '— Khử mẫu mà chỉ nhân các hạng tử có mẫu, quên nhân hạng tử không có mẫu (như số 1 ở vế phải).\n' +
      '— Bỏ ngoặc có dấu − đứng trước mà chỉ đổi dấu hạng tử đầu.\n' +
      '— Chia sai hệ số âm: −2x = 10 thì x = −5 (không phải 5).',
    workedExample: {
      problem: 'Giải các phương trình: a) 3(x − 2) = 5x + 4. b) (2x − 1)/3 − (x + 2)/2 = 1.',
      steps: [
        'a) Bỏ ngoặc: 3x − 6 = 5x + 4.',
        'a) Chuyển vế, đổi dấu: 3x − 5x = 4 + 6, tức −2x = 10.',
        'a) Chia hai vế cho −2: x = −5. Thử lại: 3 · (−7) = −21 và 5 · (−5) + 4 = −21, hai vế bằng nhau.',
        'b) BCNN của 3 và 2 là 6. Nhân cả hai vế với 6: 2(2x − 1) − 3(x + 2) = 6 (nhớ nhân cả số 1 ở vế phải).',
        'b) Bỏ ngoặc: 4x − 2 − 3x − 6 = 6, thu gọn được x − 8 = 6.',
        'b) Chuyển vế: x = 6 + 8 = 14. Thử lại: (28 − 1)/3 − (14 + 2)/2 = 9 − 8 = 1, đúng.',
      ],
      answer: 'a) x = −5. b) x = 14.',
    },
    checkQuestions: [
      {
        prompt: 'Giải phương trình 4 − 3x = x + 12. Nghiệm x bằng bao nhiêu (nhập số âm nếu có)?',
        answer: { kind: 'numeric', value: -2 },
        explain:
          'Chuyển vế: 4 − 12 = x + 3x, tức −8 = 4x, nên x = −2. Thử lại: 4 − 3 · (−2) = 10 và −2 + 12 = 10. ' +
          'Lỗi hay gặp là chuyển −3x sang vế phải mà không đổi dấu, hoặc chia −8 cho 4 được 2.',
      },
      {
        prompt: 'Phương trình nào sau đây là phương trình bậc nhất một ẩn?',
        choices: [
          { id: 'a', label: '0x + 3 = 0' },
          { id: 'b', label: '2x − 5 = 0' },
          { id: 'c', label: 'x² − 4 = 0' },
          { id: 'd', label: '1/x + 1 = 0' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Phương trình bậc nhất có dạng ax + b = 0 với a ≠ 0, chỉ b thỏa mãn (a = 2). Đáp án a có a = 0 (vô nghiệm), ' +
          'c có x² nên là bậc hai, d có ẩn ở mẫu và không đưa được về dạng ax + b = 0.',
      },
      {
        prompt: 'Giải phương trình (x + 1)/2 − (x − 1)/3 = 2. Nghiệm x bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 7 },
        explain:
          'Nhân hai vế với 6: 3(x + 1) − 2(x − 1) = 12, tức 3x + 3 − 2x + 2 = 12 nên x + 5 = 12 và x = 7. ' +
          'Thử lại: 8/2 − 6/3 = 4 − 2 = 2. Lỗi hay gặp là quên nhân 6 cho vế phải (số 2) hoặc bỏ dấu − khi mở ngoặc −(x − 1).',
      },
      {
        prompt:
          'Gói cước điện thoại của mẹ có phí cố định 50 nghìn đồng và mỗi GB dữ liệu dùng thêm tính 2 nghìn đồng. ' +
          'Hoá đơn tháng này là 84 nghìn đồng. Mẹ đã dùng thêm bao nhiêu GB?',
        answer: { kind: 'numeric', value: 17 },
        explain:
          'Gọi x là số GB dùng thêm, ta có 50 + 2x = 84, suy ra 2x = 34 và x = 17 (GB). ' +
          'Lỗi hay gặp là lấy 84 chia cho 2 ngay (42) mà quên trừ phí cố định 50 nghìn đồng.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phương trình bậc nhất một ẩn có dạng nào? Nghiệm là gì?',
        dap: 'Dạng ax + b = 0 với a ≠ 0; có đúng một nghiệm x = −b/a.',
      },
      {
        hoi: 'Hai quy tắc biến đổi phương trình?',
        dap: 'Quy tắc chuyển vế (đổi dấu hạng tử khi chuyển vế) và quy tắc nhân (chia) cả hai vế với cùng một số khác 0.',
      },
      {
        hoi: 'Các bước giải phương trình có mẫu số?',
        dap: 'Nhân hai vế với BCNN các mẫu (nhân cả hạng tử không có mẫu), bỏ ngoặc, chuyển vế, thu gọn, chia hệ số của ẩn, thử lại.',
      },
      {
        hoi: 'Phương trình 0x + b = 0 có nghiệm không?',
        dap: 'Nếu b ≠ 0 thì vô nghiệm; nếu b = 0 thì mọi số đều là nghiệm.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan8-c7-b2',
    grade: '8',
    chapterNumber: 7,
    chapterTitle: 'Phương trình bậc nhất và hàm số bậc nhất',
    lessonNumber: 2,
    title: 'Giải bài toán bằng cách lập phương trình',
    hook:
      'Lớp 8A có 40 bạn, trong đó số bạn nữ ít hơn số bạn nam 4 bạn. Muốn biết lớp có bao nhiêu bạn nữ mà không phải đếm, ta gọi x là số bạn nữ, ' +
      'dùng đề bài để viết một phương trình rồi giải nó. Biết dịch câu chữ của đời sống thành phương trình là kỹ năng ' +
      'giúp em giải quyết nhiều bài toán thực tế. Bài này dạy ba bước làm có hệ thống.',
    theory:
      'BA BƯỚC GIẢI BÀI TOÁN BẰNG CÁCH LẬP PHƯƠNG TRÌNH\n' +
      'Bước 1. Lập phương trình: chọn ẩn (nêu rõ ẩn là gì, đơn vị và điều kiện), biểu diễn các đại lượng khác qua ẩn, tìm mối quan hệ để lập phương trình.\n' +
      'Bước 2. Giải phương trình vừa lập.\n' +
      'Bước 3. Kiểm tra nghiệm có thỏa điều kiện của ẩn và của bài toán không, rồi trả lời đúng điều đề hỏi.\n' +
      'VÌ SAO phải kiểm tra? Nghiệm của phương trình chưa chắc là đáp số của bài toán: số người không thể âm hay là số thập phân, vận tốc phải dương…\n\n' +
      'MỘT SỐ MỐI QUAN HỆ HAY GẶP\n' +
      '— Chuyển động: quãng đường = vận tốc · thời gian (s = v · t). Đổi phút ra giờ khi vận tốc tính theo km/h (30 phút = 1/2 giờ).\n' +
      '— Tuổi: mỗi người cùng tăng thêm một số năm như nhau sau cùng một khoảng thời gian.\n' +
      '— Phần trăm: giảm giá p% thì giá mới bằng (100 − p)% giá cũ.\n' +
      '— Năng suất: khối lượng công việc = năng suất · thời gian.\n\n' +
      'Ví dụ chuyển động: ô tô đi từ A đến B với vận tốc 50 km/h, lúc về đi 40 km/h nên thời gian về nhiều hơn thời gian đi 30 phút. Gọi x (km) là quãng đường AB (x > 0). ' +
      'Thời gian đi là x/50 giờ, thời gian về x/40 giờ, ta có x/40 − x/50 = 1/2.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Không ghi rõ ẩn đại diện cho gì, hoặc quên điều kiện của ẩn.\n' +
      '— Chọn ẩn rồi biểu diễn sai đại lượng khác: "nữ ít hơn nam 4" thì nam = x + 4 (không phải x − 4).\n' +
      '— Quên đổi đơn vị: lấy 30 (phút) trừ cho thời gian tính bằng giờ.\n' +
      '— Giải xong phương trình rồi trả lời luôn mà không đối chiếu điều kiện và không trả lời đúng câu hỏi (đề hỏi quãng đường nhưng lại trả lời thời gian).',
    workedExample: {
      problem:
        'Một ô tô đi từ A đến B với vận tốc 50 km/h. Lúc về, ô tô đi với vận tốc 40 km/h nên thời gian về nhiều hơn thời gian đi 30 phút. Tính quãng đường AB.',
      steps: [
        'Gọi x (km) là quãng đường AB, điều kiện x > 0.',
        'Thời gian đi là x/50 (giờ); thời gian về là x/40 (giờ).',
        'Đổi 30 phút = 1/2 giờ. Thời gian về nhiều hơn thời gian đi 1/2 giờ, nên ta có phương trình x/40 − x/50 = 1/2.',
        'Nhân cả hai vế với 200 (BCNN của 40, 50 và 2): 5x − 4x = 100.',
        'Suy ra x = 100, thỏa điều kiện x > 0.',
        'Kiểm tra: đi mất 100/50 = 2 giờ, về mất 100/40 = 2,5 giờ, hơn nhau 0,5 giờ = 30 phút. Đúng đề bài.',
      ],
      answer: 'Quãng đường AB dài 100 km.',
    },
    checkQuestions: [
      {
        prompt:
          'Lớp 8A có 40 bạn, số bạn nữ ít hơn số bạn nam 4 bạn. Gọi x là số bạn nữ. Phương trình nào dưới đây mô tả đúng đề bài?',
        choices: [
          { id: 'a', label: 'x + (x − 4) = 40' },
          { id: 'b', label: 'x + (x + 4) = 40' },
          { id: 'c', label: 'x + 4 = 40' },
          { id: 'd', label: 'x − 4 = 40' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Nữ ít hơn nam 4 bạn nên nam nhiều hơn nữ 4 bạn, tức nam = x + 4. Tổng là x + (x + 4) = 40, giải ra x = 18 bạn nữ. ' +
          'Đáp án a đảo ngược quan hệ "ít hơn", đáp án c và d bỏ sót một trong hai nhóm.',
      },
      {
        prompt:
          'Hiện nay mẹ 38 tuổi, con 10 tuổi. Sau bao nhiêu năm nữa thì tuổi mẹ gấp 3 lần tuổi con?',
        answer: { kind: 'numeric', value: 4 },
        explain:
          'Gọi x là số năm cần tìm: 38 + x = 3(10 + x), suy ra 38 + x = 30 + 3x, nên 8 = 2x và x = 4. Thử lại: mẹ 42 tuổi, con 14 tuổi và 42 = 3 · 14. ' +
          'Lỗi hay gặp là viết 3 lần tuổi con nhưng quên cộng thêm x vào tuổi con (3 · 10 + x).',
      },
      {
        prompt:
          'Một người đi xe máy từ A với vận tốc 40 km/h. Sau đó 1 giờ, một ô tô cũng xuất phát từ A, đi cùng đường và cùng chiều với vận tốc 60 km/h. ' +
          'Kể từ lúc ô tô xuất phát, sau bao nhiêu giờ ô tô đuổi kịp xe máy?',
        answer: { kind: 'numeric', value: 2 },
        explain:
          'Gọi x (giờ) là thời gian ô tô đi cho tới lúc đuổi kịp. Xe máy đã đi x + 1 giờ. Hai xe đi cùng quãng đường: 40(x + 1) = 60x, ' +
          'suy ra 40 = 20x và x = 2 (giờ). Lỗi hay gặp là quên rằng xe máy đã đi trước 1 giờ nên dùng 40x = 60x.',
      },
      {
        prompt:
          'Một chiếc áo được giảm giá 20%, sau khi giảm giá có giá 360 nghìn đồng. Giá niêm yết ban đầu của chiếc áo là bao nhiêu nghìn đồng?',
        answer: { kind: 'numeric', value: 450 },
        explain:
          'Gọi x (nghìn đồng) là giá ban đầu, giá sau giảm là 80% · x = 0,8x. Ta có 0,8x = 360 nên x = 450. ' +
          'Lỗi hay gặp là lấy 360 cộng 20% của 360 được 432: 20% là phần trăm của giá ban đầu, không phải của giá sau khi giảm.',
      },
    ],
    srsCards: [
      {
        hoi: 'Ba bước giải bài toán bằng cách lập phương trình?',
        dap: 'Lập phương trình (chọn ẩn, đặt điều kiện, biểu diễn đại lượng khác); giải phương trình; kiểm tra điều kiện rồi trả lời.',
      },
      {
        hoi: 'Vì sao phải kiểm tra nghiệm sau khi giải?',
        dap: 'Vì nghiệm của phương trình có thể không thỏa điều kiện thực tế của bài toán (âm, không nguyên…).',
      },
      {
        hoi: 'Công thức quãng đường, vận tốc, thời gian?',
        dap: 's = v · t; do đó t = s/v và v = s/t. Chú ý cùng đơn vị (km, km/h, giờ).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan8-c7-b3',
    grade: '8',
    chapterNumber: 7,
    chapterTitle: 'Phương trình bậc nhất và hàm số bậc nhất',
    lessonNumber: 3,
    title: 'Hàm số bậc nhất y = ax + b và hệ số góc của đường thẳng',
    hook:
      'Một bể nước đang có sẵn 20 lít, mở vòi chảy thêm 5 lít mỗi phút. Sau x phút, lượng nước trong bể là y = 5x + 20 (lít). ' +
      'Mỗi giá trị của x cho đúng một giá trị của y, và nếu đánh dấu các cặp (x; y) lên mặt phẳng tọa độ, các điểm nằm thẳng hàng trên một đường thẳng. ' +
      'Đó là hàm số bậc nhất. Bài này giúp em hiểu hàm số là gì, vẽ đồ thị và đọc "độ dốc" của đường thẳng qua hệ số góc.',
    theory:
      'HÀM SỐ\n' +
      'Nếu y phụ thuộc vào x sao cho mỗi giá trị của x ta xác định được đúng một giá trị của y, thì y là một hàm số của x, và x gọi là biến số. ' +
      'Hàm số có thể cho bằng bảng, bằng công thức hoặc bằng đồ thị. Với y = f(x), giá trị của hàm số tại x = a là f(a).\n' +
      'Ví dụ y = 5x + 20 thì f(12) = 5 · 12 + 20 = 80.\n\n' +
      'HÀM SỐ BẬC NHẤT\n' +
      'Là hàm số cho bởi công thức y = ax + b, trong đó a, b là các số cho trước và a ≠ 0. Ví dụ y = 2x − 4; y = −3x + 5.\n' +
      'VÌ SAO a ≠ 0? Nếu a = 0 thì y = b không phụ thuộc vào x nữa, đồ thị là đường nằm ngang, không còn là hàm số bậc nhất.\n\n' +
      'ĐỒ THỊ\n' +
      'Đồ thị của hàm số y = ax + b là một đường thẳng. Để vẽ chỉ cần hai điểm: thường là giao điểm với trục tung (cho x = 0 thì y = b, điểm (0; b)) ' +
      'và giao điểm với trục hoành (cho y = 0 thì x = −b/a, điểm (−b/a; 0)).\n' +
      'Ví dụ y = 2x − 4: cắt Oy tại (0; −4), cắt Ox tại (2; 0).\n\n' +
      'HỆ SỐ GÓC\n' +
      'Số a trong y = ax + b gọi là hệ số góc của đường thẳng. Nó cho biết "độ dốc": khi x tăng thêm 1 đơn vị thì y thay đổi a đơn vị. ' +
      'a > 0: đường thẳng đi lên từ trái sang phải (hàm số đồng biến); a < 0: đi xuống (hàm số nghịch biến).\n\n' +
      'VỊ TRÍ CỦA HAI ĐƯỜNG THẲNG\n' +
      "Cho d: y = ax + b và d': y = a'x + b' (a, a' khác 0):\n" +
      "— d song song d' khi a = a' và b ≠ b'.\n" +
      "— d trùng d' khi a = a' và b = b'.\n" +
      "— d cắt d' khi a ≠ a'.\n" +
      "VÌ SAO? Hai đường thẳng có cùng độ dốc thì hoặc song song hoặc trùng; chúng chỉ phân biệt nhau nếu cắt trục tung ở hai điểm khác nhau (b ≠ b').\n\n" +
      'LỖI HAY GẶP\n' +
      '— Nhầm hệ số góc với số b (hệ số góc là hệ số của x, không phải số hạng tự do).\n' +
      "— Kết luận hai đường thẳng song song chỉ vì a = a' mà quên kiểm tra b ≠ b' (có thể trùng nhau).\n" +
      '— Tìm giao với trục hoành mà quên cho y = 0, hoặc quên đổi dấu: giao Ox của y = −2x + 12 là x = 6, không phải −6.\n' +
      '— Thay giá trị âm vào mà không đặt trong ngoặc: f(−2) của y = −3x + 5 là −3 · (−2) + 5 = 11.',
    workedExample: {
      problem:
        "Cho đường thẳng d: y = 2x − 4. a) Tính giá trị của hàm số tại x = 3. b) Tìm giao điểm của d với hai trục tọa độ. c) Tìm m để đường thẳng d': y = (m − 1)x + 3 song song với d.",
      steps: [
        'a) Thay x = 3: y = 2 · 3 − 4 = 2.',
        'b) Giao với trục tung: cho x = 0 thì y = −4, được điểm (0; −4).',
        'b) Giao với trục hoành: cho y = 0, 2x − 4 = 0 nên x = 2, được điểm (2; 0).',
        'c) Hai đường thẳng song song khi hệ số góc bằng nhau và số hạng tự do khác nhau.',
        'c) Hệ số góc bằng nhau: m − 1 = 2, suy ra m = 3.',
        'c) Kiểm tra số hạng tự do: 3 khác −4, thỏa điều kiện. Vậy m = 3.',
      ],
      answer: 'a) y = 2. b) (0; −4) và (2; 0). c) m = 3.',
    },
    checkQuestions: [
      {
        prompt:
          'Cho hàm số y = −3x + 5. Giá trị của hàm số tại x = 4 bằng bao nhiêu (nhập số âm nếu có)?',
        answer: { kind: 'numeric', value: -7 },
        explain:
          'Thay x = 4: y = −3 · 4 + 5 = −12 + 5 = −7. ' +
          'Lỗi hay gặp là tính −3 · 4 + 5 = −3 · 9 = −27 (cộng trước nhân), hoặc bỏ dấu âm của hệ số góc.',
      },
      {
        prompt: 'Đường thẳng y = −2x + 12 cắt trục hoành tại điểm có hoành độ bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 6 },
        explain:
          'Giao điểm với trục hoành có y = 0: −2x + 12 = 0, suy ra 2x = 12 và x = 6. ' +
          'Lỗi hay gặp là đáp 12 (lấy luôn số hạng tự do, đó là tung độ giao điểm với trục tung) hoặc −6 vì sai dấu khi chuyển vế.',
      },
      {
        prompt: 'Cặp đường thẳng nào dưới đây có vị trí song song với nhau? (Chọn một đáp án.)',
        choices: [
          { id: 'a', label: 'y = 2x + 1 và y = 2x − 3' },
          { id: 'b', label: 'y = 2x + 1 và y = −2x + 1' },
          { id: 'c', label: 'y = 3x + 2 và y = 3x + 2' },
          { id: 'd', label: 'y = x + 1 và y = 2x + 1' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Song song cần hệ số góc bằng nhau và số hạng tự do khác nhau: cặp a (a = 2 = 2, b = 1 ≠ −3). ' +
          'Cặp c trùng nhau (b bằng nhau), cặp b và d có hệ số góc khác nhau nên cắt nhau (cùng cắt trục tung tại (0; 1)).',
      },
      {
        prompt:
          'Một bể đang có sẵn 20 lít nước, mở vòi chảy thêm 5 lít mỗi phút, nên sau x phút lượng nước trong bể là y = 5x + 20 (lít). ' +
          'Sau bao nhiêu phút thì bể có 95 lít nước?',
        answer: { kind: 'numeric', value: 15 },
        explain:
          'Cho y = 95: 5x + 20 = 95, suy ra 5x = 75 và x = 15 (phút). ' +
          'Lỗi hay gặp là chia thẳng 95 cho 5 được 19, quên rằng bể đã có sẵn 20 lít từ đầu.',
      },
    ],
    srsCards: [
      {
        hoi: 'Hàm số bậc nhất có dạng nào?',
        dap: 'y = ax + b với a ≠ 0. Đồ thị là một đường thẳng.',
      },
      {
        hoi: 'Hệ số góc của đường thẳng y = ax + b là gì và nói lên điều gì?',
        dap: 'Là a. a > 0: đường thẳng đi lên (đồng biến); a < 0: đi xuống (nghịch biến); |a| càng lớn thì càng dốc.',
      },
      {
        hoi: "Khi nào hai đường thẳng y = ax + b và y = a'x + b' song song, trùng, cắt nhau?",
        dap: "Song song: a = a' và b ≠ b'. Trùng: a = a' và b = b'. Cắt nhau: a ≠ a'.",
      },
      {
        hoi: 'Cách tìm giao điểm của y = ax + b với hai trục?',
        dap: 'Với trục tung: cho x = 0 được (0; b). Với trục hoành: cho y = 0 được (−b/a; 0).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
