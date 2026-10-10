// lessons/toan6c3.ts — Toán 6, Chương 3: Số nguyên.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN6_C3_LESSONS: MathLesson[] = [
  {
    id: 'toan6-c3-b1',
    grade: '6',
    chapterNumber: 3,
    chapterTitle: 'Số nguyên',
    lessonNumber: 1,
    title: 'Tập hợp các số nguyên và thứ tự trên trục số',
    hook:
      'Mùa đông ở Sa Pa, bản tin thời tiết báo nhiệt độ buổi sáng là −2°C, nghĩa là lạnh hơn 0°C tới 2 độ và nước có thể đóng băng. ' +
      'Trong chung cư, thang máy có nút B1, B2 cho tầng hầm để xe, nằm dưới mặt đất. ' +
      'Những con số "dưới không" như thế không có trong tập hợp các số tự nhiên mà em đã học. ' +
      'Muốn viết và so sánh chúng, ta cần mở rộng sang tập hợp các số nguyên.',
    theory:
      'SỐ NGUYÊN ÂM VÀ TẬP HỢP SỐ NGUYÊN\n' +
      'Số nguyên âm dùng để chỉ những đại lượng "ngược chiều" với số tự nhiên: nhiệt độ dưới 0°C, độ sâu dưới mực nước biển, ' +
      'tầng hầm, số tiền đang nợ… Kí hiệu −1, −2, −3, … đọc là "âm một", "âm hai", "âm ba".\n' +
      'Tập hợp số nguyên là ℤ = {…; −3; −2; −1; 0; 1; 2; 3; …}. Nó gồm các số nguyên âm, số 0 và các số nguyên dương ' +
      '(1, 2, 3, … chính là các số tự nhiên khác 0). Vậy mọi số tự nhiên đều là số nguyên. Số 0 không âm, cũng không dương.\n\n' +
      'TRỤC SỐ\n' +
      'Vẽ một đường thẳng, chọn điểm gốc 0, chiều từ trái sang phải là chiều dương. Các số nguyên dương nằm bên phải điểm 0, ' +
      'các số nguyên âm nằm bên trái điểm 0, mỗi số nguyên ứng với một điểm, các điểm cách đều nhau. ' +
      'Đi sang trái nghĩa là "lùi lại" so với gốc 0, nên số càng đi về bên trái càng nhỏ.\n\n' +
      'SỐ ĐỐI VÀ PHẦN SỐ TỰ NHIÊN\n' +
      '— Hai số nguyên nằm ở hai phía của điểm 0 và cách đều 0 gọi là hai số đối nhau, ví dụ 5 và −5. ' +
      'Số đối của a viết là −a; số đối của 0 là 0; số đối của −a là a.\n' +
      '— Mỗi số nguyên khác 0 gồm DẤU và PHẦN SỐ TỰ NHIÊN. Ví dụ −5 có dấu "−" và phần số tự nhiên là 5; số 5 có phần số tự nhiên là 5. ' +
      'Phần số tự nhiên cho biết số đó cách điểm 0 bao nhiêu đơn vị trên trục số.\n\n' +
      'SO SÁNH HAI SỐ NGUYÊN\n' +
      '— Trên trục số, số nằm bên trái bé hơn số nằm bên phải.\n' +
      '— Mọi số nguyên âm bé hơn 0, và 0 bé hơn mọi số nguyên dương. Vậy số âm luôn bé hơn số dương.\n' +
      '— Hai số nguyên âm: nếu a > b (a, b là số tự nhiên) thì −a < −b. Nói cách khác, số nào nằm xa điểm 0 hơn về bên trái thì BÉ HƠN. Ví dụ −7 < −3 vì 7 > 3.\n' +
      'VÌ SAO? −7 nằm xa 0 hơn về phía bên trái so với −3. Cũng như nợ 7 nghìn thì "nghèo hơn" nợ 3 nghìn, ' +
      'và nhiệt độ −7°C lạnh hơn −3°C.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Viết −7 > −3 vì thấy 7 > 3. Với số âm, thứ tự bị đảo ngược.\n' +
      '— Cho rằng số đối của một số âm vẫn là số âm. Số đối của −5 là 5, một số dương.\n' +
      '— Nghĩ −0 khác 0. Chỉ có một số 0.\n' +
      '— Nhầm số đối của −5 là −5. Đúng là số đối của −5 bằng 5.',
    workedExample: {
      problem:
        'Nhiệt độ lúc 5 giờ sáng của bốn ngày liên tiếp ở Sa Pa lần lượt là −2°C, 3°C, −5°C và 0°C. ' +
        'a) Sắp xếp các nhiệt độ theo thứ tự tăng dần. b) Ngày nào lạnh nhất? c) Tìm số đối của −5.',
      steps: [
        'Chia các số thành ba nhóm: số âm là −2 và −5, số 0, số dương là 3.',
        'Số âm bé hơn 0, 0 bé hơn số dương. So sánh hai số âm: vì 5 > 2 nên −5 < −2 (−5 nằm bên trái −2 trên trục số).',
        'Sắp xếp tăng dần: −5 < −2 < 0 < 3.',
        'Ngày lạnh nhất là ngày có nhiệt độ bé nhất, tức −5°C.',
        'Số đối của −5 là 5, nằm đối xứng với −5 qua điểm 0 trên trục số.',
      ],
      answer: 'a) −5; −2; 0; 3. b) Ngày −5°C. c) Số đối của −5 là 5.',
    },
    checkQuestions: [
      {
        prompt: 'Khẳng định nào sau đây đúng?',
        choices: [
          { id: 'a', label: '−8 > −3' },
          { id: 'b', label: '−2 < −9' },
          { id: 'c', label: '−10 < −1' },
          { id: 'd', label: '0 < −4' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          '−10 nằm bên trái −1 trên trục số nên −10 < −1. Các khẳng định khác sai: −8 < −3, −2 > −9 và 0 > −4. Lỗi hay gặp là so sánh như số tự nhiên (10 > 1) rồi quên đảo chiều khi cả hai số đều âm.',
      },
      {
        prompt:
          'Sắp xếp bốn số −6; 2; −9; 0 theo thứ tự tăng dần. Số đứng ở vị trí thứ hai là số nào? (Nhập số âm nếu có.)',
        answer: { kind: 'numeric', value: -6 },
        explain:
          'Số âm bé hơn 0 và bé hơn số dương. Trong hai số âm, −9 nằm bên trái −6 nên −9 < −6. Thứ tự tăng dần là −9 < −6 < 0 < 2 nên số thứ hai là −6. Lỗi hay gặp là xếp −6 trước −9 vì thấy 6 < 9.',
      },
      {
        prompt:
          'Lúc 4 giờ sáng, nhiệt độ ở bốn nơi lần lượt là −7°C, −1°C, −12°C và −4°C. Nơi ấm nhất có nhiệt độ bao nhiêu độ C? (Nhập số âm nếu có.)',
        answer: { kind: 'numeric', value: -1 },
        explain:
          'Nơi ấm nhất có nhiệt độ lớn nhất. Trong các số âm, số nằm gần 0 nhất (phần số tự nhiên nhỏ nhất) thì lớn nhất, nên −1 > −4 > −7 > −12. Lỗi hay gặp là chọn −12 vì "số lớn nhất nhìn thấy".',
      },
      {
        prompt: 'Có bao nhiêu số nguyên x thoả mãn −3 < x ≤ 2?',
        answer: { kind: 'numeric', value: 5 },
        explain:
          'Các số đó là −2, −1, 0, 1, 2, tức 5 số. Không lấy −3 vì −3 < x là bất đẳng thức chặt, còn lấy 2 vì có dấu bằng. Lỗi hay gặp là quên số 0 hoặc lấy cả −3.',
      },
    ],
    srsCards: [
      {
        hoi: 'So sánh hai số nguyên âm thế nào?',
        dap: 'Nếu a > b thì −a < −b: số nằm bên trái trên trục số thì bé hơn. Ví dụ −7 < −3 vì 7 > 3.',
      },
      {
        hoi: 'Tập hợp số nguyên ℤ gồm những số nào?',
        dap: 'ℤ = {…; −2; −1; 0; 1; 2; …}: các số nguyên âm, số 0 và các số nguyên dương.',
      },
      {
        hoi: 'Số đối của một số nguyên là gì? Số đối của −5 là số nào?',
        dap: 'Hai số đối nhau nằm ở hai phía của điểm 0 và cách đều 0. Số đối của −5 là 5, của 5 là −5, của 0 là 0.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan6-c3-b2',
    grade: '6',
    chapterNumber: 3,
    chapterTitle: 'Số nguyên',
    lessonNumber: 2,
    title: 'Phép cộng, phép trừ số nguyên và quy tắc dấu ngoặc',
    hook:
      'Sáng sớm ở Sa Pa nhiệt độ là −3°C. Đến trưa trời ấm lên 5°C, rồi chiều tối lại giảm 7°C. ' +
      'Nhiệt độ lúc tối là bao nhiêu? Em có thể đoán ra bằng cách đếm từng độ trên nhiệt kế, ' +
      'nhưng làm sao để tính nhanh và chắc chắn mà không phải vẽ nhiệt kế mỗi lần? ' +
      'Bài này đưa ra các quy tắc cộng, trừ số nguyên và cách bỏ dấu ngoặc.',
    theory:
      'CỘNG HAI SỐ NGUYÊN ÂM\n' +
      'Muốn cộng hai số nguyên âm, ta cộng phần số tự nhiên của chúng rồi đặt dấu "−" trước kết quả. Ví dụ (−3) + (−5) = −(3 + 5) = −8; hiểu như "nợ 3 nghìn, nợ thêm 5 nghìn, ' +
      'tổng nợ 8 nghìn".\n\n' +
      'CỘNG HAI SỐ NGUYÊN KHÁC DẤU\n' +
      '— Hai số đối nhau thì tổng bằng 0: 7 + (−7) = 0.\n' +
      '— Nếu không đối nhau: lấy phần số tự nhiên lớn trừ phần số tự nhiên nhỏ, rồi đặt trước kết quả dấu của số có phần số tự nhiên lớn hơn.\n' +
      'Ví dụ (−3) + 5 = +(5 − 3) = 2 và (−9) + 4 = −(9 − 4) = −5.\n' +
      'VÌ SAO? Hãy nghĩ tới tiền: có 5 nghìn mà nợ 3 nghìn, trả nợ xong còn 2 nghìn. Có 4 nghìn mà nợ 9 nghìn thì trả xong vẫn còn ' +
      'nợ 5 nghìn. Trên trục số, cộng số dương là đi sang phải, cộng số âm là đi sang trái.\n' +
      'Phép cộng số nguyên có tính chất giao hoán, kết hợp, a + 0 = a và a + (−a) = 0.\n\n' +
      'PHÉP TRỪ SỐ NGUYÊN\n' +
      'Muốn trừ số nguyên a cho số nguyên b, ta cộng a với số đối của b: a − b = a + (−b). ' +
      'Ví dụ 5 − 8 = 5 + (−8) = −3 và 3 − (−4) = 3 + 4 = 7.\n' +
      'VÌ SAO có điều này? Trong ℕ, phép trừ 5 − 8 không làm được. Sang ℤ thì phép trừ LUÔN thực hiện được, ' +
      'vì nó chỉ là phép cộng với số đối. Trừ đi một khoản nợ cũng như được tặng thêm khoản đó: 3 − (−4) = 7.\n\n' +
      'QUY TẮC DẤU NGOẶC\n' +
      '— Trước ngoặc có dấu +: bỏ ngoặc, giữ nguyên dấu các số hạng trong ngoặc. a + (b − c) = a + b − c.\n' +
      '— Trước ngoặc có dấu −: bỏ ngoặc và ĐỔI DẤU tất cả các số hạng trong ngoặc. a − (b − c) = a − b + c.\n' +
      'VÌ SAO? Dấu − trước ngoặc nghĩa là trừ cả cụm, tức cộng với số đối của cả cụm, mà số đối của b − c là −b + c. ' +
      'Ví dụ 10 − (3 − 8) = 10 − 3 + 8 = 15. Kiểm tra: 3 − 8 = −5 và 10 − (−5) = 15.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Viết (−3) + (−5) = −2 (trừ thay vì cộng hai phần số tự nhiên).\n' +
      '— Viết 3 − (−4) = −1. Hai dấu trừ liền nhau thành dấu cộng: 3 + 4 = 7.\n' +
      '— Bỏ ngoặc có dấu trừ phía trước mà chỉ đổi dấu số hạng đầu: 25 − (10 − 4) = 25 − 10 − 4 là SAI, đúng là 25 − 10 + 4.\n' +
      '— Quên đặt dấu âm cho kết quả khi số âm có phần số tự nhiên lớn hơn.',
    workedExample: {
      problem:
        'a) Buổi sáng ở Sa Pa là −3°C, buổi trưa tăng 5°C, buổi tối giảm 7°C. Nhiệt độ buổi tối là bao nhiêu? ' +
        'b) Tính (−24) + 9 − (15 − 20).',
      steps: [
        'Phần a): nhiệt độ buổi tối là (−3) + 5 − 7. Cộng từ trái sang phải: (−3) + 5 = 2.',
        'Tiếp đó 2 − 7 = 2 + (−7) = −5. Nhiệt độ buổi tối là −5°C.',
        'Phần b): trước ngoặc có dấu trừ nên bỏ ngoặc và đổi dấu từng số hạng trong ngoặc: (−24) + 9 − 15 + 20.',
        'Cộng lần lượt: (−24) + 9 = −15; −15 − 15 = −30; −30 + 20 = −10.',
        'Kiểm tra bằng cách tính trong ngoặc trước: 15 − 20 = −5, rồi (−15) − (−5) = −15 + 5 = −10. Kết quả khớp.',
      ],
      answer: 'a) −5°C. b) −10.',
    },
    checkQuestions: [
      {
        prompt: 'Tính (−15) + (−27). (Nhập số âm nếu có.)',
        answer: { kind: 'numeric', value: -42 },
        explain:
          'Hai số cùng dấu âm nên cộng hai phần số tự nhiên 15 + 27 = 42 rồi đặt dấu âm, được −42. Lỗi hay gặp là lấy 27 − 15 = 12 như khi cộng hai số khác dấu.',
      },
      {
        prompt:
          'Nhiệt độ buổi sáng ở một thị trấn miền núi là −4°C, buổi trưa tăng thêm 9°C, buổi tối giảm 8°C. Nhiệt độ buổi tối là bao nhiêu độ C? (Nhập số âm nếu có.)',
        answer: { kind: 'numeric', value: -3 },
        explain:
          'Ta có (−4) + 9 = 5 rồi 5 − 8 = 5 + (−8) = −3. Lỗi hay gặp là tính 4 + 9 − 8 = 5 (bỏ qua dấu âm của −4) hoặc quên rằng giảm 8 độ là trừ 8.',
      },
      {
        prompt: 'Tính 7 − (−13).',
        answer: { kind: 'numeric', value: 20 },
        explain:
          'Trừ một số bằng cộng với số đối của nó: 7 − (−13) = 7 + 13 = 20. Lỗi hay gặp là nghĩ hai dấu trừ "triệt tiêu nhau" thành 7 − 13 = −6.',
      },
      {
        prompt: 'Bỏ dấu ngoặc trong biểu thức 25 − (10 − 4 + 3) ta được biểu thức nào?',
        choices: [
          { id: 'a', label: '25 − 10 − 4 + 3' },
          { id: 'b', label: '25 − 10 + 4 − 3' },
          { id: 'c', label: '25 − 10 + 4 + 3' },
          { id: 'd', label: '25 + 10 − 4 + 3' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Trước ngoặc là dấu trừ nên phải đổi dấu TẤT CẢ các số hạng trong ngoặc: +10 thành −10, −4 thành +4, +3 thành −3. Lỗi hay gặp là chỉ đổi dấu số hạng đầu tiên hoặc không đổi dấu số hạng cuối.',
      },
    ],
    srsCards: [
      {
        hoi: 'Quy tắc cộng hai số nguyên khác dấu?',
        dap: 'Lấy phần số tự nhiên lớn trừ phần số tự nhiên nhỏ, kết quả mang dấu của số có phần số tự nhiên lớn hơn. Ví dụ (−9) + 4 = −5.',
      },
      {
        hoi: 'Trừ một số nguyên làm thế nào?',
        dap: 'a − b = a + (−b): cộng với số đối của số trừ. Ví dụ 3 − (−4) = 3 + 4 = 7.',
      },
      {
        hoi: 'Quy tắc dấu ngoặc là gì?',
        dap: 'Trước ngoặc là dấu +: bỏ ngoặc, giữ dấu. Trước ngoặc là dấu −: bỏ ngoặc và đổi dấu mọi số hạng trong ngoặc.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan6-c3-b3',
    grade: '6',
    chapterNumber: 3,
    chapterTitle: 'Số nguyên',
    lessonNumber: 3,
    title: 'Phép nhân, phép chia hết, ước và bội của số nguyên',
    hook:
      'Bạn An tiêu vặt quá tay nên mỗi ngày nợ bạn thêm 5 nghìn đồng. Sau 3 ngày liên tiếp như thế, An nợ tổng cộng 15 nghìn. ' +
      'Nếu viết nợ 5 nghìn là −5 thì tình huống này là 3 · (−5) = −15. ' +
      'Còn nếu hôm nay bạn Bình "xoá" 3 lần khoản nợ 5 nghìn đó, thì tiền của An thay đổi thế nào? ' +
      'Đó là lúc cần quy tắc nhân hai số âm, thứ khiến nhiều bạn lớp 6 băn khoăn nhất.',
    theory:
      'NHÂN HAI SỐ NGUYÊN\n' +
      '— Cùng dấu: nhân hai phần số tự nhiên của chúng, kết quả là số DƯƠNG. Ví dụ (−4) · (−3) = 12.\n' +
      '— Khác dấu: nhân hai phần số tự nhiên của chúng rồi đặt dấu TRỪ trước kết quả. Ví dụ (−5) · 3 = −15 và 6 · (−2) = −12.\n' +
      '— Nhân với 0 thì bằng 0.\n' +
      'Tóm tắt dấu: (+)·(+) = +, (−)·(−) = +, (+)·(−) = −, (−)·(+) = −.\n' +
      'VÌ SAO (−)·(−) = (+)? Nhìn dãy 3 · (−2) = −6; 2 · (−2) = −4; 1 · (−2) = −2; 0 · (−2) = 0. ' +
      'Mỗi lần giảm thừa số thứ nhất đi 1 thì tích tăng thêm 2. Tiếp tục: (−1) · (−2) = 2 và (−2) · (−2) = 4. ' +
      'Vậy nhân hai số âm bắt buộc ra số dương thì quy luật mới không bị gãy.\n' +
      'Tính chất: giao hoán, kết hợp, a · 1 = a, a · (−1) = −a và phân phối a · (b + c) = a · b + a · c. ' +
      'Với nhiều thừa số khác 0: số thừa số âm là SỐ CHẴN thì tích dương, là SỐ LẺ thì tích âm.\n\n' +
      'PHÉP CHIA HẾT\n' +
      'Cho a, b ∈ ℤ, b ≠ 0. Nếu có q ∈ ℤ sao cho a = b · q thì ta có phép chia hết a : b = q. ' +
      'Quy tắc dấu giống phép nhân: (−12) : 4 = −3; 12 : (−4) = −3; (−12) : (−4) = 3. ' +
      'Số 0 chia cho số khác 0 thì bằng 0. Không chia cho 0.\n\n' +
      'ƯỚC VÀ BỘI CỦA SỐ NGUYÊN\n' +
      'Nếu a = b · q (q ∈ ℤ) thì b là ước của a và a là bội của b. Khác với số tự nhiên, ước và bội của số nguyên có cả số ÂM: ' +
      'Ư(6) = {−6; −3; −2; −1; 1; 2; 3; 6} vì 6 = 2 · 3 = (−2) · (−3). Bội của 3 là {…; −6; −3; 0; 3; 6; …}. ' +
      'Số 0 là bội của mọi số nguyên khác 0, còn 1 và −1 là ước của mọi số nguyên.\n' +
      'Tính chất: nếu a ⋮ b và b ⋮ c thì a ⋮ c; nếu a ⋮ c và b ⋮ c thì (a + b) ⋮ c và (a − b) ⋮ c.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Viết (−4) · (−3) = −12. Hai số âm nhân nhau ra số dương.\n' +
      '— Khi chia hai số khác dấu mà quên dấu trừ: (−12) : 4 = 3 là sai, đúng là −3.\n' +
      '— Chỉ liệt kê các ước dương của một số nguyên và bỏ sót ước âm.\n' +
      '— Nhầm 0 · (−5) = −5. Nhân với 0 luôn bằng 0.',
    workedExample: {
      problem:
        'a) Tính nhanh (−25) · 37 · (−4). b) Tìm tất cả các ước của 10 trong tập hợp số nguyên.',
      steps: [
        'Phần a): dùng giao hoán và kết hợp để gom hai thừa số "đẹp": (−25) · 37 · (−4) = [(−25) · (−4)] · 37.',
        'Hai số âm nhân nhau được số dương: (−25) · (−4) = 100.',
        'Vậy tích bằng 100 · 37 = 3 700.',
        'Phần b): các ước dương của 10 là 1, 2, 5, 10. Mỗi ước dương có một số đối cũng là ước vì 10 = (−2) · (−5).',
        'Do đó Ư(10) = {−10; −5; −2; −1; 1; 2; 5; 10}, gồm 8 số.',
      ],
      answer: 'a) 3 700. b) Ư(10) = {−10; −5; −2; −1; 1; 2; 5; 10}.',
    },
    checkQuestions: [
      {
        prompt: 'Tính (−72) : 8. (Nhập số âm nếu có.)',
        answer: { kind: 'numeric', value: -9 },
        explain:
          'Hai số khác dấu nên thương là số âm: 72 : 8 = 9, vậy (−72) : 8 = −9. Lỗi hay gặp là chia hai phần số tự nhiên rồi quên đặt dấu trừ cho kết quả.',
      },
      {
        prompt: 'Tích nào sau đây có giá trị DƯƠNG?',
        choices: [
          { id: 'a', label: '(−2) · (−3) · (−4)' },
          { id: 'b', label: '(−2) · 3 · (−4)' },
          { id: 'c', label: '2 · (−3) · 4' },
          { id: 'd', label: '(−2) · 3 · 4' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Tích có hai thừa số âm (số chẵn) nên dương: (−2) · 3 · (−4) = 24. Các tích còn lại có một hoặc ba thừa số âm (số lẻ) nên đều âm. Lỗi hay gặp là thấy "có hai số dương" rồi kết luận ngay thay vì đếm số thừa số âm.',
      },
      {
        prompt: 'Có bao nhiêu số nguyên (kể cả số âm) là ước của 12?',
        answer: { kind: 'numeric', value: 12 },
        explain:
          'Các ước dương của 12 là 1, 2, 3, 4, 6, 12 (6 số) và mỗi số có một số đối cũng là ước, nên có 12 ước nguyên. Lỗi hay gặp là chỉ đếm 6 ước dương như trong tập số tự nhiên.',
      },
      {
        prompt:
          'Một đợt không khí lạnh làm nhiệt độ ở Sa Pa giảm đều 3°C mỗi giờ. Sau 5 giờ, nhiệt độ đã thay đổi bao nhiêu độ C? (Nhập số âm nếu nhiệt độ giảm.)',
        answer: { kind: 'numeric', value: -15 },
        explain:
          'Mỗi giờ thay đổi −3°C, nên sau 5 giờ thay đổi là 5 · (−3) = −15°C. Lỗi hay gặp là bỏ dấu âm (đáp số 15 sẽ nghĩa là tăng chứ không phải giảm).',
      },
    ],
    srsCards: [
      {
        hoi: 'Quy tắc dấu của phép nhân hai số nguyên?',
        dap: 'Cùng dấu thì tích dương, khác dấu thì tích âm, nhân với 0 bằng 0. Ví dụ (−4) · (−3) = 12 và (−5) · 3 = −15.',
      },
      {
        hoi: 'Chia hai số nguyên khác dấu thì được số nào?',
        dap: 'Chia hai phần số tự nhiên rồi đặt dấu trừ. Ví dụ (−12) : 4 = −3. Hai số cùng dấu thì thương dương.',
      },
      {
        hoi: 'Ước của số nguyên khác ước của số tự nhiên ở điểm nào?',
        dap: 'Có cả ước âm: Ư(6) = {±1; ±2; ±3; ±6}. Số 0 là bội của mọi số nguyên khác 0.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
