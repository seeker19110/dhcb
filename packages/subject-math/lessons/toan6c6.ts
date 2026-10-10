// lessons/toan6c6.ts — Toán 6, Chương 6: Phân số.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN6_C6_LESSONS: MathLesson[] = [
  {
    id: 'toan6-c6-b1',
    grade: '6',
    chapterNumber: 6,
    chapterTitle: 'Phân số',
    lessonNumber: 1,
    title: 'Mở rộng phân số và phân số bằng nhau',
    hook:
      'Mẹ cắt một chiếc bánh chưng thành 6 phần bằng nhau. An ăn 2 phần, còn Bình bảo mình chỉ ăn "một phần ba cái bánh". ' +
      'Hai bạn cãi nhau xem ai ăn nhiều hơn. Thật ra cả hai ăn đúng bằng nhau, vì 2/6 và 1/3 chỉ là hai cách viết ' +
      'của cùng một lượng bánh. Bài này giúp em nhìn ra khi nào hai phân số trông khác nhau mà vẫn bằng nhau.',
    theory:
      'PHÂN SỐ VỚI TỬ VÀ MẪU LÀ SỐ NGUYÊN\n' +
      'Ở tiểu học, em đã gặp phân số a/b với a, b là số tự nhiên. Bây giờ ta mở rộng: phân số là cách viết a/b, ' +
      'trong đó a và b là các số nguyên và b ≠ 0. Số a gọi là tử số, số b gọi là mẫu số. Ví dụ: −3/4, 5/(−7), 0/9.\n' +
      'VÌ SAO b phải khác 0? Phân số a/b chính là kết quả phép chia a : b. Mà ta không thể chia cho 0, nên mẫu số ' +
      'không bao giờ bằng 0.\n' +
      'Quy ước hay dùng: nếu mẫu số âm thì nhân cả tử và mẫu với −1 để mẫu số dương, chẳng hạn 5/(−7) = −5/7.\n\n' +
      'HAI PHÂN SỐ BẰNG NHAU\n' +
      'Hai phân số a/b và c/d bằng nhau khi a·d = b·c. Ví dụ 2/6 = 1/3 vì 2·3 = 6 = 6·1.\n\n' +
      'TÍNH CHẤT CƠ BẢN CỦA PHÂN SỐ\n' +
      '— Nhân cả tử và mẫu với cùng một số nguyên khác 0 thì được phân số bằng phân số đã cho.\n' +
      '— Chia cả tử và mẫu cho một ước chung của chúng thì được phân số bằng phân số đã cho.\n' +
      'VÌ SAO đúng? Nhân (hoặc chia) tử và mẫu cho cùng một số m giống như chia mỗi phần của chiếc bánh thành m phần ' +
      'nhỏ hơn rồi lấy m lần số phần cũ: lượng bánh không hề đổi, chỉ cách chia đổi.\n\n' +
      'RÚT GỌN PHÂN SỐ\n' +
      'Rút gọn là chia cả tử và mẫu cho một ước chung lớn hơn 1. Phân số tối giản là phân số mà tử và mẫu ' +
      'chỉ có ước chung là 1 và −1. Muốn rút gọn một lần là xong, hãy chia cho ƯCLN của |tử| và mẫu.\n' +
      'Ví dụ: −18/24: ƯCLN(18, 24) = 6 nên −18/24 = (−18 : 6)/(24 : 6) = −3/4, và −3/4 là phân số tối giản.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Cộng (hoặc trừ) cùng một số vào cả tử và mẫu rồi tưởng phân số không đổi. Sai: 3/5 ≠ (3+2)/(5+2) = 5/7. ' +
      'Chỉ có NHÂN hoặc CHIA mới giữ nguyên giá trị.\n' +
      '— Chia tử và mẫu cho một số không phải ước chung của cả hai (chia tử cho 3, chia mẫu cho 4).\n' +
      '— Quên đổi dấu cả hai khi chuyển mẫu âm về mẫu dương.\n' +
      '— Dừng rút gọn quá sớm: 36/60 chia cho 6 được 6/10, vẫn còn rút gọn được tiếp thành 3/5.',
    workedExample: {
      problem:
        'Rút gọn phân số −18/24 về phân số tối giản. Sau đó kiểm tra xem −18/24 có bằng 9/(−12) hay không.',
      steps: [
        'Tìm ƯCLN của 18 và 24. Các ước của 18: 1, 2, 3, 6, 9, 18; các ước của 24: 1, 2, 3, 4, 6, 8, 12, 24. ƯCLN(18, 24) = 6.',
        'Chia cả tử và mẫu cho 6: −18/24 = (−18 : 6)/(24 : 6) = −3/4.',
        'Vì ƯCLN(3, 4) = 1 nên −3/4 đã tối giản.',
        'Đưa 9/(−12) về mẫu dương: nhân tử và mẫu với −1 được −9/12, rút gọn cho 3 được −3/4.',
        'Hai phân số cùng bằng −3/4 nên bằng nhau. Cách thử nhanh: (−18)·(−12) = 216 và 24·9 = 216, hai tích bằng nhau.',
      ],
      answer: '−18/24 = −3/4 (tối giản); và −18/24 = 9/(−12).',
    },
    checkQuestions: [
      {
        prompt: 'Phân số nào sau đây bằng phân số 3/5?',
        choices: [
          { id: 'a', label: '6/15' },
          { id: 'b', label: '9/15' },
          { id: 'c', label: '5/3' },
          { id: 'd', label: '5/7' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Nhân cả tử và mẫu của 3/5 với 3 được 9/15 nên chọn b. Phân số 5/7 là kết quả của lỗi hay gặp: cộng 2 vào cả tử và mẫu, ' +
          'việc đó làm giá trị đổi. Còn 6/15 = 2/5 và 5/3 là phân số nghịch đảo, đều khác 3/5.',
      },
      {
        prompt: 'Rút gọn phân số 36/60 về phân số tối giản (nhập dưới dạng phân số tối giản).',
        answer: { kind: 'fraction', num: 3, den: 5, requireSimplified: true },
        explain:
          'ƯCLN(36, 60) = 12 nên 36/60 = (36 : 12)/(60 : 12) = 3/5. Nếu chỉ chia cho 6 em được 6/10, ' +
          'phân số này vẫn chưa tối giản vì còn chia được cho 2; chia cho ƯCLN sẽ xong trong một bước.',
      },
      {
        prompt: 'Tìm số nguyên x biết −4/7 = x/21 (nhập số âm nếu có).',
        answer: { kind: 'numeric', value: -12 },
        explain:
          'Mẫu 21 = 7·3 nên phải nhân cả tử lẫn mẫu với 3: −4·3 = −12, vậy x = −12. Kiểm tra bằng tích chéo: ' +
          '(−4)·21 = −84 và 7·(−12) = −84. Lỗi hay gặp là chỉ nhân mẫu với 3 mà quên nhân tử, hoặc làm rơi dấu âm.',
      },
      {
        prompt:
          'Lớp 6A có 40 bạn, trong đó 24 bạn thích bóng đá. Phân số chỉ số bạn thích bóng đá so với cả lớp, ' +
          'viết dưới dạng phân số tối giản, là bao nhiêu?',
        answer: { kind: 'fraction', num: 3, den: 5, requireSimplified: true },
        explain:
          'Phân số chỉ phần là 24/40. ƯCLN(24, 40) = 8 nên 24/40 = 3/5, nghĩa là cứ 5 bạn thì có 3 bạn thích bóng đá. ' +
          'Lỗi hay gặp là dừng ở 12/20 hoặc 6/10 vì rút gọn chưa hết.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phân số a/b với a, b nguyên cần điều kiện gì?',
        dap: 'Mẫu số b phải khác 0, vì a/b là kết quả phép chia a : b.',
      },
      {
        hoi: 'Hai phân số a/b và c/d bằng nhau khi nào?',
        dap: 'Khi a·d = b·c (tích chéo bằng nhau).',
      },
      {
        hoi: 'Tính chất cơ bản của phân số nói gì?',
        dap: 'Nhân hoặc chia cả tử và mẫu cho cùng một số (khác 0, chia thì phải là ước chung) thì giá trị không đổi. Cộng hay trừ thì KHÔNG được.',
      },
      {
        hoi: 'Làm sao rút gọn một phân số về tối giản trong một bước?',
        dap: 'Chia cả tử và mẫu cho ƯCLN của |tử| và mẫu.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan6-c6-b2',
    grade: '6',
    chapterNumber: 6,
    chapterTitle: 'Phân số',
    lessonNumber: 2,
    title: 'So sánh phân số và hỗn số dương',
    hook:
      'Nam đọc được 5/12 quyển truyện, còn Hà đọc được 3/8 quyển truyện cùng cỡ. Hai phân số có mẫu khác nhau nên ' +
      'nhìn bằng mắt rất khó biết ai đọc nhiều hơn. Muốn so sánh công bằng, ta phải đưa hai phân số về "cùng một loại phần", ' +
      'tức là cùng mẫu số. Bài này dạy cách làm đó, cùng cách viết số lớn hơn 1 dưới dạng hỗn số.',
    theory:
      'QUY ĐỒNG MẪU SỐ\n' +
      'Quy đồng mẫu số nhiều phân số là đưa chúng về cùng một mẫu số dương bằng cách nhân tử và mẫu với số thích hợp. ' +
      'Mẫu chung thuận tiện nhất là BCNN của các mẫu.\n' +
      'Ví dụ: 5/6 và 7/9. BCNN(6, 9) = 18. Ta có 5/6 = 15/18 và 7/9 = 14/18.\n\n' +
      'SO SÁNH HAI PHÂN SỐ\n' +
      '— Cùng mẫu dương: phân số nào có tử lớn hơn thì lớn hơn. Ví dụ 15/18 > 14/18 nên 5/6 > 7/9.\n' +
      '— Khác mẫu: quy đồng về cùng mẫu dương rồi so sánh tử.\n' +
      'VÌ SAO chỉ cần so tử? Khi cùng mẫu, mỗi phần có kích thước như nhau, nên bên nào có nhiều phần hơn thì lớn hơn.\n\n' +
      'SO SÁNH VỚI 0 VÀ VỚI 1 (CÁCH NHANH)\n' +
      '— Phân số có tử và mẫu cùng dấu thì dương (lớn hơn 0); khác dấu thì âm (nhỏ hơn 0). Phân số dương > 0 > phân số âm.\n' +
      '— Với mẫu dương: tử > mẫu thì phân số lớn hơn 1, tử < mẫu thì nhỏ hơn 1 (với phân số dương), tử = mẫu thì bằng 1.\n' +
      'Ví dụ: 7/5 > 1 còn 4/9 < 1, nên 7/5 > 4/9 mà không cần quy đồng.\n\n' +
      'HỖN SỐ DƯƠNG\n' +
      'Hỗn số gồm phần nguyên và phần phân số nhỏ hơn 1. Ví dụ hỗn số 2 3/5 đọc là "hai và ba phần năm", nghĩa là 2 + 3/5.\n' +
      '— Đổi hỗn số ra phân số: 2 3/5 = (2·5 + 3)/5 = 13/5. (Lấy phần nguyên nhân mẫu, cộng tử, giữ nguyên mẫu.)\n' +
      '— Đổi phân số ra hỗn số: chia tử cho mẫu. 17/5: 17 = 3·5 + 2 nên 17/5 = 3 2/5 (thương là phần nguyên, số dư là tử).\n\n' +
      'LỖI HAY GẶP\n' +
      '— So sánh theo tử mà bỏ qua mẫu: 3/5 và 3/7 cùng tử, nhưng mẫu lớn hơn nghĩa là phần nhỏ hơn nên 3/5 > 3/7.\n' +
      '— Quy đồng sai: chỉ nhân mẫu mà không nhân tử.\n' +
      '— Đổi hỗn số quên cộng phần nguyên đã nhân mẫu: 2 3/5 không bằng 3/5 hay 5/5.\n' +
      '— Không đưa mẫu âm về mẫu dương trước khi so sánh.',
    workedExample: {
      problem: 'So sánh 5/6 và 7/9. Sau đó đổi hỗn số 2 3/5 ra phân số.',
      steps: [
        'Hai mẫu là 6 và 9. BCNN(6, 9) = 18, nên chọn 18 làm mẫu chung.',
        'Quy đồng: 5/6 = (5·3)/(6·3) = 15/18; 7/9 = (7·2)/(9·2) = 14/18.',
        'Cùng mẫu 18 và 15 > 14 nên 15/18 > 14/18, tức là 5/6 > 7/9.',
        'Đổi hỗn số 2 3/5: lấy phần nguyên 2 nhân mẫu 5 được 10, cộng tử 3 được 13, giữ nguyên mẫu: 2 3/5 = 13/5.',
      ],
      answer: '5/6 > 7/9; 2 3/5 = 13/5.',
    },
    checkQuestions: [
      {
        prompt: 'Trong các phân số 3/4, 5/8, 7/12 và 2/3, phân số nào lớn nhất?',
        choices: [
          { id: 'a', label: '3/4' },
          { id: 'b', label: '5/8' },
          { id: 'c', label: '7/12' },
          { id: 'd', label: '2/3' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'BCNN(4, 8, 12, 3) = 24. Quy đồng: 3/4 = 18/24, 5/8 = 15/24, 7/12 = 14/24, 2/3 = 16/24. Tử lớn nhất là 18 nên 3/4 lớn nhất. ' +
          'Lỗi hay gặp là chỉ nhìn mẫu hay chỉ nhìn tử mà không quy đồng.',
      },
      {
        prompt:
          'Đổi hỗn số 3 2/7 (ba và hai phần bảy) thành phân số. Nhập dưới dạng phân số tối giản.',
        answer: { kind: 'fraction', num: 23, den: 7, requireSimplified: true },
        explain:
          '3 2/7 = (3·7 + 2)/7 = 23/7. Phải nhân phần nguyên 3 với mẫu 7 rồi mới cộng tử 2. Lỗi hay gặp là viết 5/7 (lấy 3 + 2) ' +
          'hoặc 6/7, đều quên rằng 3 đơn vị chứa 21 phần bảy.',
      },
      {
        prompt: 'Viết phân số 17/5 dưới dạng hỗn số. Phần nguyên của hỗn số đó bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 3 },
        explain:
          'Chia 17 cho 5 được thương 3, dư 2 nên 17/5 = 3 2/5 và phần nguyên là 3. Lỗi hay gặp là lấy số dư 2 làm phần nguyên ' +
          'hoặc làm tròn lên 4.',
      },
      {
        prompt:
          'Nam đọc được 5/12 quyển truyện, Hà đọc được 3/8 quyển truyện cùng cỡ. Ai đọc được nhiều hơn?',
        choices: [
          { id: 'a', label: 'Nam' },
          { id: 'b', label: 'Hà' },
          { id: 'c', label: 'Hai bạn đọc bằng nhau' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Quy đồng với mẫu chung 24: 5/12 = 10/24 và 3/8 = 9/24. Vì 10 > 9 nên Nam đọc nhiều hơn. ' +
          'Không thể kết luận từ việc 3/8 có mẫu nhỏ hơn hay tử nhỏ hơn mà không quy đồng.',
      },
    ],
    srsCards: [
      {
        hoi: 'Quy đồng mẫu số hai phân số làm thế nào?',
        dap: 'Tìm BCNN của hai mẫu (đã dương), rồi nhân cả tử và mẫu của mỗi phân số với số thích hợp để mẫu bằng BCNN đó.',
      },
      {
        hoi: 'Cùng mẫu dương thì so sánh hai phân số thế nào?',
        dap: 'Phân số nào có tử lớn hơn thì lớn hơn.',
      },
      {
        hoi: 'Đổi hỗn số a b/c ra phân số?',
        dap: 'a b/c = (a·c + b)/c.',
      },
      {
        hoi: 'Khi nào phân số dương lớn hơn 1?',
        dap: 'Khi tử lớn hơn mẫu (mẫu dương).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan6-c6-b3',
    grade: '6',
    chapterNumber: 6,
    chapterTitle: 'Phân số',
    lessonNumber: 3,
    title: 'Phép tính với phân số và hai bài toán về phân số',
    hook:
      'Lớp 6A có 40 bạn, cô giáo nói "3/8 số bạn trong lớp thích bóng đá". Muốn biết có bao nhiêu bạn thích bóng đá, ' +
      'ta cần nhân phân số với một số. Ngược lại, nếu biết 3/5 số bi của Nam là 18 viên mà muốn biết Nam có tất cả bao nhiêu viên, ' +
      'ta cần làm phép chia. Hai tình huống này rất hay gặp khi chia tiền, chia quà hay tính khẩu phần.',
    theory:
      'CỘNG, TRỪ PHÂN SỐ\n' +
      '— Cùng mẫu: cộng (trừ) các tử, giữ nguyên mẫu. a/m + b/m = (a + b)/m.\n' +
      '— Khác mẫu: quy đồng mẫu rồi cộng (trừ). Ví dụ 2/3 + 3/4 = 8/12 + 9/12 = 17/12.\n' +
      'VÌ SAO phải quy đồng? Chỉ khi các phần có cùng kích thước ta mới cộng số phần với nhau được.\n\n' +
      'NHÂN PHÂN SỐ\n' +
      'a/b · c/d = (a·c)/(b·d). Nhân tử với tử, mẫu với mẫu, nhớ rút gọn trước khi nhân nếu được. Ví dụ 3/4 · 8/9 = 24/36 = 2/3.\n\n' +
      'SỐ NGHỊCH ĐẢO VÀ PHÉP CHIA\n' +
      'Hai số có tích bằng 1 gọi là hai số nghịch đảo của nhau. Số nghịch đảo của a/b (a ≠ 0) là b/a. ' +
      'Ví dụ số nghịch đảo của −5/7 là −7/5 (giữ nguyên dấu, chỉ đảo tử và mẫu).\n' +
      'Chia cho một phân số là nhân với số nghịch đảo của nó: a/b : c/d = a/b · d/c (c ≠ 0).\n' +
      'VÌ SAO? Chia cho 1/2 hỏi "trong một đơn vị có bao nhiêu nửa", đáp án 2 chính là nhân với 2/1, nghịch đảo của 1/2.\n\n' +
      'TÍNH CHẤT\n' +
      'Phép cộng và phép nhân phân số có tính chất giao hoán, kết hợp; nhân phân phối với phép cộng: ' +
      'a/b · (c/d + e/f) = a/b · c/d + a/b · e/f. Dùng tính chất để tính nhanh, tránh quy đồng nhiều lần.\n\n' +
      'HAI BÀI TOÁN VỀ PHÂN SỐ\n' +
      '1) Tìm giá trị phân số m/n của một số a: lấy a nhân m/n, tức là a · m/n.\n' +
      'Ví dụ: 3/8 của 40 là 40 · 3/8 = 15.\n' +
      '2) Tìm một số biết m/n của nó bằng b: lấy b chia cho m/n, tức là b : m/n = b · n/m.\n' +
      'Ví dụ: 3/5 của một số bằng 18 thì số đó là 18 : 3/5 = 18 · 5/3 = 30.\n' +
      'Mẹo phân biệt: đề cho SỐ GỐC và hỏi "bằng một phần của nó" thì NHÂN; đề cho PHẦN và hỏi số gốc thì CHIA.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Cộng cả tử với tử và mẫu với mẫu: 1/2 + 1/3 ≠ 2/5.\n' +
      '— Chia hai phân số mà đảo nhầm phân số bị chia (phải đảo phân số đứng sau dấu chia).\n' +
      '— Nhầm hai dạng bài toán: nhân khi cần chia hoặc ngược lại.\n' +
      '— Quên giữ dấu âm khi tìm số nghịch đảo.',
    workedExample: {
      problem:
        'a) Lớp 6A có 40 bạn, trong đó 3/8 số bạn thích bóng đá. Có bao nhiêu bạn thích bóng đá? ' +
        'b) Nam có một số viên bi, biết 3/5 số bi của Nam là 18 viên. Nam có tất cả bao nhiêu viên bi?',
      steps: [
        'Câu a cho SỐ GỐC (40 bạn) và hỏi một phần của nó nên ta NHÂN.',
        'Số bạn thích bóng đá: 40 · 3/8 = (40 : 8) · 3 = 5 · 3 = 15 (bạn).',
        'Câu b cho PHẦN (18 viên ứng với 3/5) và hỏi số gốc nên ta CHIA.',
        'Số bi của Nam: 18 : 3/5 = 18 · 5/3 = (18 : 3) · 5 = 6 · 5 = 30 (viên).',
        'Kiểm tra: 3/5 của 30 là 30 · 3/5 = 18 đúng với đề bài.',
      ],
      answer: 'a) 15 bạn; b) 30 viên bi.',
    },
    checkQuestions: [
      {
        prompt: 'Số nghịch đảo của −5/7 là số nào?',
        choices: [
          { id: 'a', label: '5/7' },
          { id: 'b', label: '−7/5' },
          { id: 'c', label: '7/5' },
          { id: 'd', label: '−5/7' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Tích của −5/7 và −7/5 bằng (−5)(−7)/(7·5) = 35/35 = 1 nên −7/5 là số nghịch đảo. Đáp án 5/7 là số đối chứ không phải số nghịch đảo, ' +
          'còn 7/5 có tích với −5/7 bằng −1, lỗi do đảo mà quên giữ dấu âm.',
      },
      {
        prompt: 'Tính 5/6 : 10/9 và viết kết quả dưới dạng phân số tối giản.',
        answer: { kind: 'fraction', num: 3, den: 4, requireSimplified: true },
        explain:
          'Chia cho 10/9 là nhân với 9/10: 5/6 · 9/10 = 45/60 = 3/4. Lỗi hay gặp là đảo nhầm phân số đứng trước ' +
          '(6/5 · 10/9) hoặc chia tử cho tử, mẫu cho mẫu mà không rút gọn đúng.',
      },
      {
        prompt:
          'Một mảnh vườn hình chữ nhật có chiều dài 45 m, chiều rộng bằng 3/5 chiều dài. ' +
          'Chiều rộng mảnh vườn là bao nhiêu mét?',
        answer: { kind: 'numeric', value: 27 },
        explain:
          'Đề cho số gốc 45 m và hỏi một phần của nó nên nhân: 45 · 3/5 = 9 · 3 = 27 (m). ' +
          'Nếu em lấy 45 : 3/5 = 75 thì đã nhầm sang dạng bài toán tìm số gốc, và chiều rộng không thể dài hơn chiều dài.',
      },
      {
        prompt:
          'Hà có một số tiền tiết kiệm. Biết 3/7 số tiền đó là 45 000 đồng. ' +
          'Hà có tất cả bao nhiêu đồng?',
        answer: { kind: 'numeric', value: 105000 },
        explain:
          'Đề cho phần (45 000 đồng ứng với 3/7) và hỏi số gốc nên chia: 45 000 : 3/7 = 45 000 · 7/3 = 15 000 · 7 = 105 000 (đồng). ' +
          'Nếu nhân 45 000 · 3/7 thì sẽ ra số nhỏ hơn 45 000, vô lý vì cả số tiền phải lớn hơn một phần của nó.',
      },
    ],
    srsCards: [
      {
        hoi: 'Số nghịch đảo của a/b (a ≠ 0) là gì?',
        dap: 'Là b/a, vì a/b · b/a = 1. Dấu âm giữ nguyên.',
      },
      {
        hoi: 'Chia phân số a/b cho c/d thực hiện thế nào?',
        dap: 'a/b : c/d = a/b · d/c (nhân với nghịch đảo của số chia).',
      },
      {
        hoi: 'Tìm m/n của số a?',
        dap: 'Lấy a · m/n. Có số gốc, tìm một phần: NHÂN.',
      },
      {
        hoi: 'Tìm một số biết m/n của nó bằng b?',
        dap: 'Lấy b : m/n = b · n/m. Có phần, tìm số gốc: CHIA.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
