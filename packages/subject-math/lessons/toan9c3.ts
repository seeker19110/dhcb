// lessons/toan9c3.ts — Toán 9, Chương 3: Căn bậc hai và căn bậc ba.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN9_C3_LESSONS: MathLesson[] = [
  {
    id: 'toan9-c3-b1',
    grade: '9',
    chapterNumber: 3,
    chapterTitle: 'Căn bậc hai và căn bậc ba',
    lessonNumber: 1,
    title: 'Căn bậc hai và căn thức bậc hai',
    hook:
      'Bác Hai có một mảnh vườn hình vuông rộng 169 m² và muốn rào kín xung quanh. Muốn biết cần bao nhiêu mét hàng rào, bác phải tìm độ dài một cạnh, tức là tìm số dương mà bình phương lên bằng 169. ' +
      'Phép tìm số đó gọi là khai căn bậc hai. Bài này dạy em cách viết, cách tính căn bậc hai và biết khi nào một biểu thức chứa dấu căn có nghĩa.',
    theory:
      'CĂN BẬC HAI\n' +
      'Căn bậc hai của số a là số x sao cho x² = a. Số dương a có đúng hai căn bậc hai đối nhau, là √a và −√a. Số 0 chỉ có một căn bậc hai là 0. ' +
      'Số âm không có căn bậc hai, vì bình phương của mọi số đều không âm.\n\n' +
      'CĂN BẬC HAI SỐ HỌC\n' +
      'Với a ≥ 0, ký hiệu √a chỉ số KHÔNG ÂM mà bình phương bằng a; số này gọi là căn bậc hai số học của a. Ví dụ √81 = 9 (không phải ±9). ' +
      'Căn bậc hai của 81 thì có hai số là 9 và −9.\n' +
      'Hai tính chất cần nhớ: (√a)² = a với a ≥ 0; và với a ≥ 0, b ≥ 0 thì a < b khi và chỉ khi √a < √b. ' +
      'Ví dụ 5 < 7 nên √5 < √7; từ 3 = √9 và 9 > 7 suy ra √7 < 3.\n' +
      'VÌ SAO phải quy ước √a là số không âm? Để mỗi số a ≥ 0 chỉ có MỘT giá trị √a, biểu thức chứa căn mới có kết quả duy nhất.\n\n' +
      'CĂN THỨC BẬC HAI VÀ ĐIỀU KIỆN XÁC ĐỊNH\n' +
      'Nếu A là một biểu thức đại số thì √A gọi là căn thức bậc hai của A, còn A là biểu thức dưới dấu căn. ' +
      'Căn thức √A xác định (có nghĩa) khi và chỉ khi A ≥ 0.\n' +
      'Ví dụ √(x − 3) xác định khi x − 3 ≥ 0, tức x ≥ 3. Còn 1/√(x − 1) cần x − 1 > 0 (dấu > vì căn nằm ở mẫu, mẫu phải khác 0).\n\n' +
      'HẰNG ĐẲNG THỨC √(A²) = |A|\n' +
      'Với mọi biểu thức A, √(A²) = |A|; tức là bằng A khi A ≥ 0 và bằng −A khi A < 0.\n' +
      'Ví dụ √((−5)²) = √25 = 5 = |−5|. Còn √((x − 2)²) = |x − 2|, bằng x − 2 nếu x ≥ 2 và bằng 2 − x nếu x < 2.\n' +
      'VÌ SAO? |A| ≥ 0 và (|A|)² = A², nên |A| chính là căn bậc hai số học của A².\n\n' +
      'LỖI HAY GẶP\n' +
      '— Viết √81 = ±9 (căn bậc hai SỐ HỌC chỉ là 9).\n' +
      '— Viết √((−5)²) = −5; kết quả phải không âm, đúng là 5.\n' +
      '— Viết √(a²) = a mà không xét dấu của a.\n' +
      '— Tìm điều kiện xác định chỉ ghi A > 0 (bỏ sót A = 0), hoặc quên rằng căn ở mẫu thì phải là A > 0.\n' +
      '— Viết √(a + b) = √a + √b: ví dụ √(9 + 16) = 5 chứ không phải 3 + 4 = 7.',
    workedExample: {
      problem:
        'a) Tính √169 − √(0,04). b) Tìm điều kiện của x để √(2x − 6) xác định. c) Rút gọn √((x − 3)²) khi x < 3, rồi tính giá trị tại x = −1.',
      steps: [
        'a) √169 = 13 vì 13² = 169; √(0,04) = 0,2 vì 0,2² = 0,04.',
        'a) Vậy √169 − √(0,04) = 13 − 0,2 = 12,8.',
        'b) Căn thức xác định khi biểu thức dưới dấu căn không âm: 2x − 6 ≥ 0.',
        'b) Chuyển vế: 2x ≥ 6, nên x ≥ 3.',
        'c) Theo hằng đẳng thức, √((x − 3)²) = |x − 3|.',
        'c) Khi x < 3 thì x − 3 < 0 nên |x − 3| = −(x − 3) = 3 − x.',
        'c) Tại x = −1: 3 − (−1) = 4. Kiểm tra: √((−1 − 3)²) = √16 = 4.',
      ],
      answer: 'a) 12,8. b) x ≥ 3. c) 3 − x; tại x = −1 giá trị bằng 4.',
    },
    checkQuestions: [
      {
        prompt:
          'Tính giá trị của biểu thức √(1,44) + √(2,25). Nhập kết quả dưới dạng số thập phân.',
        answer: { kind: 'numeric', value: 2.7 },
        explain:
          'Vì 1,2² = 1,44 nên √(1,44) = 1,2; vì 1,5² = 2,25 nên √(2,25) = 1,5. Tổng là 1,2 + 1,5 = 2,7. ' +
          'Lỗi hay gặp là gộp √(1,44 + 2,25) = √3,69 thay vì khai căn từng số rồi mới cộng.',
      },
      {
        prompt: 'Số nguyên x nhỏ nhất để căn thức √(3x − 7) xác định là bao nhiêu?',
        answer: { kind: 'numeric', value: 3 },
        explain:
          'Căn thức xác định khi 3x − 7 ≥ 0, tức x ≥ 7/3 (khoảng 2,33). Số nguyên nhỏ nhất thỏa mãn là x = 3. ' +
          'Lỗi hay gặp là làm tròn xuống thành 2: với x = 2 thì 3 · 2 − 7 = −1 < 0 nên căn không có nghĩa.',
      },
      {
        prompt: 'Giá trị của √((−6)²) là số nào dưới đây?',
        choices: [
          { id: 'a', label: '−6' },
          { id: 'b', label: '±6' },
          { id: 'c', label: '6' },
          { id: 'd', label: '36' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Theo hằng đẳng thức √(A²) = |A| nên √((−6)²) = |−6| = 6. ' +
          'Đáp án a sai vì căn bậc hai số học không âm; b sai vì √ chỉ cho một giá trị; d là bình phương chứ chưa khai căn.',
      },
      {
        prompt:
          'Một mảnh vườn hình vuông khác của bác Hai có diện tích 225 m². Bác cần rào kín xung quanh vườn, hàng rào dài bao nhiêu mét?',
        answer: { kind: 'numeric', value: 60 },
        explain:
          'Cạnh hình vuông là √225 = 15 (m) vì 15² = 225. Chu vi là 4 · 15 = 60 (m). ' +
          'Lỗi hay gặp là dừng lại ở cạnh 15 m, hoặc lấy 225 chia 4 được 56,25 vì nhầm diện tích với chu vi.',
      },
    ],
    srsCards: [
      {
        hoi: 'Căn bậc hai số học của số a ≥ 0 là gì?',
        dap: 'Là số không âm √a mà (√a)² = a. Ví dụ √81 = 9; số 81 có hai căn bậc hai là 9 và −9.',
      },
      {
        hoi: 'Khi nào căn thức √A xác định?',
        dap: 'Khi A ≥ 0. Nếu căn nằm ở mẫu (1/√A) thì cần A > 0.',
      },
      {
        hoi: '√(A²) bằng gì?',
        dap: '|A|: bằng A khi A ≥ 0 và bằng −A khi A < 0. Ví dụ √((−5)²) = 5.',
      },
      {
        hoi: 'Số âm có căn bậc hai không? Vì sao?',
        dap: 'Không, vì bình phương của mọi số đều không âm.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan9-c3-b2',
    grade: '9',
    chapterNumber: 3,
    chapterTitle: 'Căn bậc hai và căn bậc ba',
    lessonNumber: 2,
    title: 'Biến đổi và rút gọn biểu thức chứa căn thức bậc hai',
    hook:
      'Tấm thảm phòng khách nhà Lan là hình chữ nhật dài √18 m và rộng √8 m. Nhìn hai số này khó biết diện tích tấm thảm bằng bao nhiêu, nhưng nếu biết cách nhân hai căn với nhau thì kết quả hiện ra ngay là một số rất gọn. ' +
      'Bài này dạy các phép biến đổi giúp em viết biểu thức chứa căn gọn hơn: khai căn một tích và một thương, đưa thừa số ra ngoài dấu căn, khử mẫu và trục căn thức ở mẫu.',
    theory:
      'KHAI CĂN VÀ PHÉP NHÂN, PHÉP CHIA\n' +
      'Với A ≥ 0 và B ≥ 0: √(AB) = √A · √B. Với A ≥ 0 và B > 0: √(A/B) = √A / √B.\n' +
      'Ví dụ √(4 · 9) = √4 · √9 = 2 · 3 = 6; √18 · √8 = √(18 · 8) = √144 = 12; √(25/9) = 5/3.\n' +
      'VÌ SAO √(AB) = √A · √B? Vì √A · √B không âm và bình phương của nó là (√A)² · (√B)² = A · B, nên nó chính là căn bậc hai số học của AB.\n\n' +
      'ĐƯA THỪA SỐ RA NGOÀI HOẶC VÀO TRONG DẤU CĂN\n' +
      'Với B ≥ 0: √(A²B) = |A| · √B. Ví dụ √72 = √(36 · 2) = 6√2; √48 = √(16 · 3) = 4√3.\n' +
      'Ngược lại, với A ≥ 0 và B ≥ 0: A√B = √(A²B). Ví dụ 3√5 = √(9 · 5) = √45.\n\n' +
      'KHỬ MẪU CỦA BIỂU THỨC LẤY CĂN\n' +
      'Nhân cả tử và mẫu với một số để mẫu thành bình phương: √(A/B) = √(AB) / B (với AB ≥ 0 và B > 0).\n' +
      'Ví dụ √(2/3) = √(2 · 3)/3 = √6/3.\n\n' +
      'TRỤC CĂN THỨC Ở MẪU\n' +
      '— Mẫu có dạng √B (B > 0): A/√B = A√B / B. Ví dụ 12/√3 = 12√3/3 = 4√3.\n' +
      '— Mẫu có dạng √A − √B (A, B ≥ 0, A ≠ B): nhân cả tử và mẫu với biểu thức liên hợp √A + √B, để mẫu thành A − B (nhờ hằng đẳng thức hiệu hai bình phương). ' +
      'Ví dụ 1/(√3 − 1) = (√3 + 1)/((√3 − 1)(√3 + 1)) = (√3 + 1)/2.\n\n' +
      'RÚT GỌN BIỂU THỨC\n' +
      'Đưa thừa số ra ngoài dấu căn để các căn có cùng phần căn (căn đồng dạng), rồi cộng trừ hệ số như cộng trừ các hạng tử đồng dạng.\n' +
      'Ví dụ √12 + √27 = 2√3 + 3√3 = 5√3.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Viết √(a + b) = √a + √b hoặc √(a − b) = √a − √b (sai: √(25 − 9) = 4, còn √25 − √9 = 2).\n' +
      '— Cộng hai căn không đồng dạng: 2√2 + 3√3 không bằng 5√5.\n' +
      '— Đưa thừa số ra ngoài mà quên dấu giá trị tuyệt đối, hoặc đưa số âm vào trong căn mà không tách dấu.\n' +
      '— Trục căn thức mà chỉ nhân mẫu, quên nhân tử (kết quả thay đổi).\n' +
      '— Dùng biểu thức liên hợp sai dấu: liên hợp của √5 − 2 là √5 + 2 (đổi dấu giữa hai số hạng), tích là 5 − 4 = 1.',
    workedExample: {
      problem:
        'a) Rút gọn 3√8 − √50 + √18. b) Trục căn thức ở mẫu: 4/(√7 − √3). c) Tính (3 + √2)² − 6√2.',
      steps: [
        'a) Đưa thừa số ra ngoài: 3√8 = 3 · 2√2 = 6√2; √50 = 5√2; √18 = 3√2.',
        'a) Cộng trừ các căn đồng dạng: 6√2 − 5√2 + 3√2 = 4√2.',
        'b) Nhân cả tử và mẫu với biểu thức liên hợp √7 + √3.',
        'b) Mẫu: (√7 − √3)(√7 + √3) = 7 − 3 = 4.',
        'b) Tử: 4(√7 + √3). Rút gọn cho 4: kết quả là √7 + √3.',
        'c) Khai triển hằng đẳng thức: (3 + √2)² = 9 + 6√2 + 2 = 11 + 6√2.',
        'c) Trừ đi 6√2: 11 + 6√2 − 6√2 = 11.',
      ],
      answer: 'a) 4√2. b) √7 + √3. c) 11.',
    },
    checkQuestions: [
      {
        prompt: 'Rút gọn √50 + √18 − √8. Kết quả có dạng k√2, hãy nhập hệ số k.',
        answer: { kind: 'numeric', value: 6 },
        explain:
          'Đưa thừa số ra ngoài: √50 = 5√2, √18 = 3√2, √8 = 2√2. Do đó 5√2 + 3√2 − 2√2 = 6√2, nên k = 6. ' +
          'Lỗi hay gặp là bỏ sót việc đưa thừa số ra ngoài và cộng thẳng 50 + 18 − 8 = 60.',
      },
      {
        prompt: 'Tính giá trị của biểu thức 1/(2 − √3) + 1/(2 + √3).',
        answer: { kind: 'numeric', value: 4 },
        explain:
          'Trục căn thức: 1/(2 − √3) = 2 + √3 và 1/(2 + √3) = 2 − √3, vì (2 − √3)(2 + √3) = 4 − 3 = 1. Tổng là (2 + √3) + (2 − √3) = 4. ' +
          'Lỗi hay gặp là tính tích liên hợp thành 4 + 3 = 7 (quên dấu trừ của hiệu hai bình phương).',
      },
      {
        prompt: 'Phép biến đổi nào dưới đây là ĐÚNG?',
        choices: [
          { id: 'a', label: '√48 = 4√3' },
          { id: 'b', label: '√(9 + 16) = √9 + √16' },
          { id: 'c', label: '2√3 = √6' },
          { id: 'd', label: '√(x²) = x với mọi số thực x' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Đáp án a đúng: √48 = √(16 · 3) = 4√3. Đáp án b sai vì √25 = 5 còn 3 + 4 = 7; c sai vì 2√3 = √(4 · 3) = √12; ' +
          'd sai vì √(x²) = |x|, với x âm thì không bằng x.',
      },
      {
        prompt:
          'Tấm thảm phòng khách nhà Lan là hình chữ nhật có chiều dài √18 m và chiều rộng √8 m. Diện tích tấm thảm bằng bao nhiêu mét vuông?',
        answer: { kind: 'numeric', value: 12 },
        explain:
          'Diện tích là √18 · √8 = √(18 · 8) = √144 = 12 (m²). Cách khác: √18 = 3√2 và √8 = 2√2 nên tích là 6 · 2 = 12. ' +
          'Lỗi hay gặp là cộng 18 + 8 thay vì nhân, hoặc làm tròn từng căn rồi nhân nên ra số lẻ.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức khai căn một tích và một thương?',
        dap: '√(AB) = √A · √B (A, B ≥ 0); √(A/B) = √A / √B (A ≥ 0, B > 0).',
      },
      {
        hoi: 'Đưa thừa số ra ngoài dấu căn: √(A²B) bằng gì?',
        dap: '|A|√B (B ≥ 0). Ví dụ √72 = √(36 · 2) = 6√2.',
      },
      {
        hoi: 'Cách trục căn thức ở mẫu A/√B và 1/(√A − √B)?',
        dap: 'A/√B = A√B/B. Với mẫu √A − √B: nhân cả tử và mẫu với liên hợp √A + √B, mẫu thành A − B.',
      },
      {
        hoi: '√(a + b) có bằng √a + √b không?',
        dap: 'Không. Ví dụ √(9 + 16) = 5 nhưng √9 + √16 = 7.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan9-c3-b3',
    grade: '9',
    chapterNumber: 3,
    chapterTitle: 'Căn bậc hai và căn bậc ba',
    lessonNumber: 3,
    title: 'Căn bậc ba và căn thức bậc ba',
    hook:
      'Nhà Nam cần mua một chiếc thùng nhựa hình lập phương chứa được đúng 50 lít nước. Muốn biết mỗi cạnh thùng dài bao nhiêu, ta phải tìm số mà lập phương của nó bằng thể tích. ' +
      'Đó là phép khai căn bậc ba. Bài này dạy em khái niệm căn bậc ba, cách tính và điểm khác với căn bậc hai.',
    theory:
      'CĂN BẬC BA\n' +
      'Căn bậc ba của số a là số x sao cho x³ = a, ký hiệu ∛a. Ví dụ ∛8 = 2 vì 2³ = 8; ∛(−27) = −3 vì (−3)³ = −27; ∛0 = 0.\n' +
      'Mọi số thực a đều có đúng MỘT căn bậc ba, kể cả khi a âm.\n' +
      'VÌ SAO số âm có căn bậc ba mà không có căn bậc hai? Bình phương luôn không âm, nên không số nào bình phương ra số âm. ' +
      'Còn lập phương giữ nguyên dấu: số âm lập phương lên vẫn âm, số dương lập phương lên vẫn dương.\n\n' +
      'MỘT SỐ LẬP PHƯƠNG QUEN THUỘC\n' +
      '1³ = 1; 2³ = 8; 3³ = 27; 4³ = 64; 5³ = 125; 6³ = 216; 7³ = 343; 8³ = 512; 9³ = 729; 10³ = 1000.\n\n' +
      'TÍNH CHẤT\n' +
      '— ∛(a³) = a và (∛a)³ = a với mọi số thực a. Ví dụ ∛(−125) = ∛((−5)³) = −5.\n' +
      '— Với a < b thì ∛a < ∛b.\n' +
      'Tính chất thứ nhất cũng đúng với biểu thức: ∛(A³) = A. Ví dụ ∛(27x³) = ∛((3x)³) = 3x; ∛(−8x³) = ∛((−2x)³) = −2x.\n\n' +
      'CĂN THỨC BẬC BA\n' +
      'Nếu A là một biểu thức đại số thì ∛A gọi là căn thức bậc ba của A. Khác với căn bậc hai, ∛A có nghĩa với MỌI giá trị của A, nên không cần đặt điều kiện xác định.\n\n' +
      'DÙNG MÁY TÍNH CẦM TAY\n' +
      'Máy tính có phím căn bậc ba (∛). Khi đề yêu cầu làm tròn, hãy bấm máy lấy nhiều chữ số thập phân rồi mới làm tròn đến hàng được yêu cầu. Ví dụ ∛20 = 2,7144… ≈ 2,71 (đến hàng phần trăm).\n\n' +
      'LỖI HAY GẶP\n' +
      '— Cho rằng ∛(−8) không có nghĩa; thực ra ∛(−8) = −2.\n' +
      '— Lấy ∛27 = 27 : 3 = 9; đúng là 3 vì 3³ = 27.\n' +
      '— Viết ∛(a + b) = ∛a + ∛b: ví dụ ∛(1 + 7) = 2 còn ∛1 + ∛7 không bằng 2.\n' +
      '— Nhầm căn bậc ba với căn bậc hai: ∛64 = 4 (vì 4³ = 64), không phải 8 (8² = 64).',
    workedExample: {
      problem:
        'a) Tính ∛(−64) + ∛(0,125). b) Rút gọn ∛(27x³) + ∛(−8x³). c) Một bể nước hình lập phương chứa được 343 lít. Tính độ dài cạnh trong của bể theo đề-xi-mét (1 lít = 1 dm³).',
      steps: [
        'a) ∛(−64) = −4 vì (−4)³ = −64; ∛(0,125) = 0,5 vì 0,5³ = 0,125.',
        'a) Vậy tổng bằng −4 + 0,5 = −3,5.',
        'b) Viết 27x³ = (3x)³ nên ∛(27x³) = 3x; viết −8x³ = (−2x)³ nên ∛(−8x³) = −2x.',
        'b) Cộng lại: 3x + (−2x) = x.',
        'c) Thể tích hình lập phương cạnh a là a³ = 343 dm³.',
        'c) Suy ra a = ∛343 = 7 (dm) vì 7³ = 343.',
      ],
      answer: 'a) −3,5. b) x. c) Cạnh bể dài 7 dm.',
    },
    checkQuestions: [
      {
        prompt: 'Tính ∛(−125) − 2 · ∛27 (nhập số âm nếu có).',
        answer: { kind: 'numeric', value: -11 },
        explain:
          '∛(−125) = −5 vì (−5)³ = −125 và ∛27 = 3 nên 2 · ∛27 = 6. Do đó −5 − 6 = −11. ' +
          'Lỗi hay gặp là cho rằng số âm không có căn bậc ba, hoặc quên nhân đôi: −5 − 3 = −8.',
      },
      {
        prompt: 'Khẳng định nào dưới đây là ĐÚNG?',
        choices: [
          { id: 'a', label: '∛(−8) không có nghĩa vì −8 là số âm' },
          { id: 'b', label: '∛27 = 9' },
          { id: 'c', label: '∛64 = 8' },
          { id: 'd', label: '∛(−1) = −1' },
        ],
        answer: { kind: 'choice', correctIds: ['d'] },
        explain:
          'Đáp án d đúng vì (−1)³ = −1. Đáp án a sai: căn bậc ba có nghĩa với mọi số; b sai vì 3³ = 27 (không phải 9³); ' +
          'c sai vì 4³ = 64 (còn 8 là căn bậc hai của 64).',
      },
      {
        prompt: 'Rút gọn ∛(64x³) − ∛(−27x³). Kết quả có dạng kx, nhập k.',
        answer: { kind: 'numeric', value: 7 },
        explain:
          'Vì 64x³ = (4x)³ nên ∛(64x³) = 4x; vì −27x³ = (−3x)³ nên ∛(−27x³) = −3x. Do đó 4x − (−3x) = 7x, nên k = 7. ' +
          'Lỗi hay gặp là quên dấu âm của −3x và tính 4x − 3x = x (ra k = 1).',
      },
      {
        prompt:
          'Nhà Nam cần một chiếc thùng nhựa hình lập phương chứa được 50 lít nước (1 lít = 1 dm³). Dùng máy tính cầm tay, tính độ dài cạnh trong của thùng theo đề-xi-mét, ' +
          'làm tròn đến hàng phần trăm. Nhập kết quả dưới dạng số thập phân.',
        answer: { kind: 'numeric', value: 3.68, tolerance: { mode: 'absolute', eps: 0.005 } },
        explain:
          'Cạnh a thỏa a³ = 50 nên a = ∛50 = 3,684… ≈ 3,68 (dm). ' +
          'Lỗi hay gặp là lấy √50 ≈ 7,07 (căn bậc hai) hoặc lấy 50 : 3 ≈ 16,67 thay vì dùng căn bậc ba.',
      },
    ],
    srsCards: [
      {
        hoi: 'Căn bậc ba của a là gì? Số âm có căn bậc ba không?',
        dap: 'Là số x sao cho x³ = a, ký hiệu ∛a. Mọi số thực đều có đúng một căn bậc ba; ví dụ ∛(−27) = −3.',
      },
      {
        hoi: 'Căn thức ∛A xác định khi nào?',
        dap: 'Với mọi giá trị của A (khác căn bậc hai, không cần điều kiện A ≥ 0).',
      },
      {
        hoi: 'Căn bậc ba của một lập phương bằng gì?',
        dap: '∛(a³) = a với mọi số thực a; với biểu thức cũng vậy: ∛(A³) = A. Ví dụ ∛(27x³) = 3x và ∛(−8) = −2.',
      },
      {
        hoi: 'Các lập phương quen thuộc từ 1³ đến 6³?',
        dap: '1, 8, 27, 64, 125, 216. Nhớ thêm 7³ = 343 và 10³ = 1000.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
