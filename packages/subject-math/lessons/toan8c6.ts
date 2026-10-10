// lessons/toan8c6.ts — Toán 8, Chương 6: Phân thức đại số.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN8_C6_LESSONS: MathLesson[] = [
  {
    id: 'toan8-c6-b1',
    grade: '8',
    chapterNumber: 6,
    chapterTitle: 'Phân thức đại số',
    lessonNumber: 1,
    title: 'Phân thức đại số và tính chất cơ bản của phân thức',
    hook:
      'Lan đạp xe 15 km tới nhà ngoại với vận tốc x (km/h), nên thời gian đi là 15/x giờ. Chạy chậm hay nhanh thì x đổi, và con số 15/x đổi theo. ' +
      'Biểu thức có chữ ở mẫu như 15/x gọi là phân thức đại số. Nó giống phân số, nhưng có một điều nguy hiểm: nếu x = 0 thì phép chia vô nghĩa. ' +
      'Bài này dạy em khi nào phân thức có nghĩa, và cách rút gọn, quy đồng giống như với phân số.',
    theory:
      'PHÂN THỨC ĐẠI SỐ\n' +
      'Phân thức đại số là biểu thức có dạng A/B, trong đó A và B là các đa thức và B khác đa thức 0. A là tử thức, B là mẫu thức. ' +
      'Mỗi đa thức cũng là một phân thức với mẫu thức bằng 1. Ví dụ 15/x; (x − 2)/(x² + 1); 3x + 1.\n\n' +
      'ĐIỀU KIỆN XÁC ĐỊNH\n' +
      'Phân thức A/B chỉ có nghĩa khi mẫu B ≠ 0. Tập các giá trị của biến làm cho B ≠ 0 gọi là điều kiện xác định (ĐKXĐ). ' +
      'Ví dụ 5/(x − 3) có ĐKXĐ là x ≠ 3, vì tại x = 3 mẫu bằng 0.\n' +
      'VÌ SAO phải quan tâm ĐKXĐ? Vì phép chia cho 0 không có nghĩa, nên mọi giá trị làm mẫu bằng 0 đều bị loại ngay từ đầu.\n\n' +
      'HAI PHÂN THỨC BẰNG NHAU\n' +
      'A/B = C/D khi A · D = B · C (tích chéo bằng nhau). Ví dụ (x + 1)/(x² − 1) = 1/(x − 1) vì (x + 1)(x − 1) = 1 · (x² − 1).\n\n' +
      'TÍNH CHẤT CƠ BẢN\n' +
      '— Nhân cả tử và mẫu với cùng một đa thức khác 0 thì được phân thức bằng phân thức đã cho: A/B = (A · M)/(B · M).\n' +
      '— Chia cả tử và mẫu cho một nhân tử chung thì được phân thức bằng phân thức đã cho: A/B = (A : N)/(B : N).\n' +
      'Hai tính chất này giống hệt tính chất của phân số, chỉ khác là "số" nay là đa thức.\n\n' +
      'RÚT GỌN PHÂN THỨC\n' +
      'Rút gọn là chia cả tử và mẫu cho nhân tử chung. Cách làm: (1) phân tích tử và mẫu thành nhân tử; (2) gạch các nhân tử chung; (3) viết phần còn lại. ' +
      'Ví dụ (x² − 9)/(x² + 3x) = (x − 3)(x + 3)/(x(x + 3)) = (x − 3)/x. Lưu ý: nhân tử đổi dấu, chẳng hạn (2 − x) = −(x − 2).\n\n' +
      'QUY ĐỒNG MẪU THỨC\n' +
      'Là biến đổi các phân thức thành những phân thức bằng chúng và có cùng mẫu thức. Mẫu thức chung (MTC) nên chọn đơn giản nhất: ' +
      'phân tích các mẫu thành nhân tử, lấy tích các nhân tử với số mũ lớn nhất. Ví dụ 1/(x² − x) và 2/(x − 1): ' +
      'x² − x = x(x − 1), nên MTC = x(x − 1); 1/(x(x − 1)) giữ nguyên, còn 2/(x − 1) = 2x/(x(x − 1)).\n\n' +
      'LỖI HAY GẶP\n' +
      '— Rút gọn hạng tử thay vì nhân tử: (x + 3)/x = 3 là sai; chỉ gạch được thừa số của cả tử và cả mẫu sau khi đã phân tích.\n' +
      '— Quên ĐKXĐ, hoặc chỉ xét ĐKXĐ của phân thức đã rút gọn: ĐKXĐ phải xét ở phân thức ban đầu.\n' +
      '— Quên đổi dấu: (x − 2)/(2 − x) = −1, không phải 1.\n' +
      '— Nhân tử nhưng quên nhân cho cả tử và mẫu khi quy đồng.',
    workedExample: {
      problem:
        'Cho P = (x² − 4)/(x² − 2x). a) Tìm ĐKXĐ của P. b) Rút gọn P. c) Tính giá trị của P tại x = 4.',
      steps: [
        'a) Mẫu x² − 2x = x(x − 2). Mẫu khác 0 khi x ≠ 0 và x ≠ 2. Vậy ĐKXĐ: x ≠ 0 và x ≠ 2.',
        'b) Phân tích tử: x² − 4 = (x − 2)(x + 2).',
        'b) Viết P = (x − 2)(x + 2)/(x(x − 2)). Chia cả tử và mẫu cho nhân tử chung (x − 2).',
        'b) Được P = (x + 2)/x.',
        'c) x = 4 thỏa ĐKXĐ (khác 0 và khác 2). Thay vào: P = (4 + 2)/4 = 6/4 = 3/2.',
      ],
      answer: 'ĐKXĐ: x ≠ 0 và x ≠ 2; P = (x + 2)/x; giá trị tại x = 4 là 3/2.',
    },
    checkQuestions: [
      {
        prompt: 'Phân thức 7/(2x − 6) không có nghĩa tại giá trị nào của x?',
        answer: { kind: 'numeric', value: 3 },
        explain:
          'Phân thức không có nghĩa khi mẫu bằng 0: 2x − 6 = 0, suy ra 2x = 6 và x = 3. ' +
          'Lỗi hay gặp là đáp x = 6 (quên chia cho hệ số 2) hoặc x = −3 (sai dấu khi chuyển vế).',
      },
      {
        prompt:
          'Rút gọn P = (x² − 9)/(x² + 3x) rồi tính giá trị của P tại x = 6 (nhập dưới dạng phân số tối giản).',
        answer: { kind: 'fraction', num: 1, den: 2, requireSimplified: true },
        explain:
          'Phân tích: P = (x − 3)(x + 3)/(x(x + 3)) = (x − 3)/x. Tại x = 6: P = 3/6 = 1/2. ' +
          'Lỗi hay gặp là bỏ qua nhân tử chung (x + 3) mà thay thẳng số (27/54 vẫn đúng nhưng chưa tối giản), hoặc rút nhầm x² ở tử và mẫu.',
      },
      {
        prompt: 'Với x ≠ 2 và x ≠ −2, phân thức (x − 2)/(x² − 4) bằng phân thức nào sau đây?',
        choices: [
          { id: 'a', label: '1/(x + 2)' },
          { id: 'b', label: '1/(x − 2)' },
          { id: 'c', label: '1/(x² − 2)' },
          { id: 'd', label: '−1/(x + 2)' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Mẫu x² − 4 = (x − 2)(x + 2), chia cả tử và mẫu cho (x − 2) được 1/(x + 2). ' +
          'Kiểm tra tích chéo: (x − 2)(x + 2) = 1 · (x² − 4). Đáp án c là lỗi rút gọn nửa chừng (chỉ gạch số 2 chứ không gạch nhân tử), ' +
          'đáp án d tự thêm dấu trừ.',
      },
      {
        prompt:
          'Lan đạp xe 15 km với vận tốc x km/h thì mất 15/x giờ. Với x = 12, Lan đi hết bao nhiêu phút?',
        answer: { kind: 'numeric', value: 75 },
        explain:
          '15/12 = 1,25 giờ, đổi ra phút: 1,25 · 60 = 75 phút. ' +
          'Lỗi hay gặp là đọc 1,25 giờ thành "1 giờ 25 phút" (85 phút); phần thập phân 0,25 giờ là 0,25 · 60 = 15 phút, không phải 25 phút.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phân thức đại số là gì? Điều kiện để có nghĩa?',
        dap: 'Là biểu thức A/B với A, B là đa thức và B khác đa thức 0. Chỉ có nghĩa khi B ≠ 0 (điều kiện xác định).',
      },
      {
        hoi: 'Hai phân thức A/B và C/D bằng nhau khi nào?',
        dap: 'Khi A · D = B · C (tích chéo bằng nhau).',
      },
      {
        hoi: 'Các bước rút gọn một phân thức?',
        dap: 'Phân tích tử và mẫu thành nhân tử, rồi chia cả tử và mẫu cho nhân tử chung. Không được gạch hạng tử.',
      },
      {
        hoi: 'Mẫu thức chung (MTC) của các phân thức chọn thế nào?',
        dap: 'Phân tích các mẫu thành nhân tử, lấy tích các nhân tử với số mũ lớn nhất rồi nhân tử và mẫu mỗi phân thức với nhân tử phụ.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan8-c6-b2',
    grade: '8',
    chapterNumber: 6,
    chapterTitle: 'Phân thức đại số',
    lessonNumber: 2,
    title: 'Phép cộng và phép trừ phân thức đại số',
    hook:
      'Một bể nước được làm đầy bằng hai vòi: vòi I chảy đầy bể trong x giờ, vòi II chảy đầy trong 6 giờ. Mỗi giờ vòi I chảy được 1/x bể, ' +
      'vòi II chảy được 1/6 bể. Mở cả hai vòi thì mỗi giờ được 1/x + 1/6 bể. Để biết con số đó, em phải cộng hai phân thức khác mẫu. ' +
      'Bài này dạy cách cộng, trừ phân thức, bắt đầu từ cùng mẫu rồi đến khác mẫu.',
    theory:
      'CỘNG, TRỪ PHÂN THỨC CÙNG MẪU\n' +
      'A/C + B/C = (A + B)/C và A/C − B/C = (A − B)/C. Ta cộng (trừ) các tử và GIỮ NGUYÊN mẫu.\n' +
      'Ví dụ (x + 3)/(x − 2) + (x − 7)/(x − 2) = (2x − 4)/(x − 2) = 2(x − 2)/(x − 2) = 2 (với x ≠ 2).\n' +
      'VÌ SAO giữ nguyên mẫu? Giống phân số: cộng hai phần có cùng kích thước thì chỉ đếm tổng số phần, kích thước mỗi phần không đổi.\n\n' +
      'CỘNG, TRỪ PHÂN THỨC KHÁC MẪU\n' +
      'Quy đồng mẫu thức rồi cộng (trừ) như cùng mẫu: A/B + C/D = (A · D + C · B)/(B · D), còn khi mẫu có nhân tử chung thì dùng MTC cho gọn. ' +
      'Các bước: (1) phân tích mẫu thành nhân tử, tìm MTC; (2) nhân tử và mẫu mỗi phân thức với nhân tử phụ; (3) cộng, trừ các tử; (4) rút gọn nếu được.\n' +
      'Ví dụ 1/(x − 1) − 1/(x + 1): MTC = (x − 1)(x + 1). Tử: (x + 1) − (x − 1) = 2. Vậy kết quả là 2/(x² − 1).\n\n' +
      'PHÂN THỨC ĐỐI\n' +
      'Phân thức đối của A/B là −A/B. Phép trừ là cộng với phân thức đối: A/B − C/D = A/B + (−C)/D. ' +
      'Phép cộng phân thức có tính chất giao hoán và kết hợp, nên được phép đổi chỗ, nhóm các phân thức để tính cho gọn.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Cộng cả tử lẫn mẫu: 1/2 + 1/3 = 2/5 (sai). Mẫu chỉ được cộng khi nó đã được quy đồng thành mẫu chung, và khi đó vẫn giữ nguyên.\n' +
      '— Khi trừ, quên đổi dấu MỌI hạng tử của tử thứ hai: (3x + 4) − (x − 2) = 2x + 6 (không phải 2x + 2). Nên đặt tử thứ hai trong ngoặc.\n' +
      '— Quy đồng mà chỉ nhân tử cho nhân tử phụ, quên nhân mẫu, hoặc ngược lại.\n' +
      '— Không rút gọn kết quả khi tử và mẫu còn nhân tử chung.',
    workedExample: {
      problem:
        'a) Tính (5x + 1)/(x − 2) − (2x − 5)/(x − 2). b) Tính 1/(x − 1) − 1/(x + 1), rồi tính giá trị tại x = 3.',
      steps: [
        'a) Cùng mẫu x − 2, trừ các tử và đặt tử thứ hai trong ngoặc: (5x + 1 − (2x − 5))/(x − 2).',
        'a) Bỏ ngoặc, đổi dấu: 5x + 1 − 2x + 5 = 3x + 6. Kết quả (3x + 6)/(x − 2) = 3(x + 2)/(x − 2), không rút gọn thêm được.',
        'b) MTC = (x − 1)(x + 1), chính là x² − 1. Quy đồng: (x + 1)/((x − 1)(x + 1)) − (x − 1)/((x − 1)(x + 1)).',
        'b) Trừ các tử: (x + 1) − (x − 1) = 2, nên kết quả là 2/(x² − 1).',
        'b) Thay x = 3: 2/(9 − 1) = 2/8 = 1/4.',
      ],
      answer: 'a) (3x + 6)/(x − 2). b) 2/(x² − 1); tại x = 3 bằng 1/4.',
    },
    checkQuestions: [
      {
        prompt:
          'Rút gọn (x + 5)/(x + 1) + (3x − 1)/(x + 1) (với x ≠ −1). Kết quả là một số; số đó bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 4 },
        explain:
          'Cùng mẫu nên cộng tử: (x + 5) + (3x − 1) = 4x + 4 = 4(x + 1). Chia cho mẫu x + 1 được 4. ' +
          'Lỗi hay gặp là cộng luôn cả mẫu thành 2x + 2 hoặc quên rút gọn nên không nhận ra kết quả là hằng số.',
      },
      {
        prompt:
          'Tính 1/x − 1/(x + 3) = 3/(x(x + 3)) rồi tính giá trị của biểu thức tại x = 3 (nhập phân số tối giản).',
        answer: { kind: 'fraction', num: 1, den: 6, requireSimplified: true },
        explain:
          'Tại x = 3: 3/(3 · 6) = 3/18 = 1/6. Hoặc tính trực tiếp 1/3 − 1/6 = 2/6 − 1/6 = 1/6, hai cách khớp nhau. ' +
          'Lỗi hay gặp là dừng ở 3/18 mà không rút gọn về tối giản.',
      },
      {
        prompt: 'Kết quả của (3x + 4)/(x + 2) − (x − 2)/(x + 2) là:',
        choices: [
          { id: 'a', label: '(2x + 6)/(x + 2)' },
          { id: 'b', label: '(2x + 2)/(x + 2)' },
          { id: 'c', label: '(4x + 2)/(x + 2)' },
          { id: 'd', label: '2' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Cùng mẫu nên trừ tử: (3x + 4) − (x − 2) = 3x + 4 − x + 2 = 2x + 6. Tử 2x + 6 = 2(x + 3) không có nhân tử chung với x + 2 nên giữ nguyên. ' +
          'Đáp án b là lỗi quên đổi dấu −2 thành +2; đáp án c là lỗi cộng thay vì trừ.',
      },
      {
        prompt:
          'Vòi I chảy đầy một bể trong 4 giờ, vòi II chảy đầy bể đó trong 6 giờ. Khi mở cả hai vòi, mỗi giờ chảy được bao nhiêu phần bể ' +
          '(nhập phân số tối giản)?',
        answer: { kind: 'fraction', num: 5, den: 12, requireSimplified: true },
        explain:
          'Mỗi giờ vòi I được 1/4 bể và vòi II được 1/6 bể. Quy đồng mẫu 12: 3/12 + 2/12 = 5/12 (bể). ' +
          'Lỗi hay gặp là cộng mẫu 1/(4 + 6) = 1/10, hoặc đáp thời gian 4 + 6 = 10 giờ trong khi hai vòi cùng chảy phải nhanh hơn mỗi vòi riêng lẻ.',
      },
    ],
    srsCards: [
      {
        hoi: 'Cộng, trừ hai phân thức cùng mẫu thế nào?',
        dap: 'Cộng (trừ) các tử và giữ nguyên mẫu: A/C ± B/C = (A ± B)/C.',
      },
      {
        hoi: 'Các bước cộng, trừ phân thức khác mẫu?',
        dap: 'Tìm MTC, quy đồng mẫu thức, cộng (trừ) các tử với mẫu chung, rồi rút gọn nếu được.',
      },
      {
        hoi: 'Phân thức đối của A/B là gì?',
        dap: 'Là −A/B. Phép trừ A/B − C/D bằng A/B + (−C)/D.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan8-c6-b3',
    grade: '8',
    chapterNumber: 6,
    chapterTitle: 'Phân thức đại số',
    lessonNumber: 3,
    title: 'Phép nhân và phép chia phân thức đại số',
    hook:
      'Một tấm vải hình chữ nhật có chiều dài 6/x mét và chiều rộng x/2 mét (x > 0). Diện tích là 6/x · x/2. Thử với x = 3: dài 2 m, rộng 1,5 m, diện tích 3 m². ' +
      'Thử với x = 4: dài 1,5 m, rộng 2 m, diện tích vẫn 3 m². Đúng vậy: x ở tử triệt tiêu x ở mẫu và diện tích luôn bằng 3. ' +
      'Bài này dạy cách nhân, chia phân thức và nhận ra những "triệt tiêu" như vậy.',
    theory:
      'PHÉP NHÂN\n' +
      'A/B · C/D = (A · C)/(B · D). Nhân tử với tử, mẫu với mẫu, rồi rút gọn kết quả.\n' +
      'Mẹo: phân tích tử và mẫu thành nhân tử TRƯỚC khi nhân để gạch nhân tử chung cho nhẹ số.\n' +
      'Ví dụ (x² − 4)/(3x) · 6x²/(x + 2) = (x − 2)(x + 2) · 6x²/(3x(x + 2)) = 2x(x − 2).\n\n' +
      'PHÂN THỨC NGHỊCH ĐẢO\n' +
      'Nếu A/B khác 0 (nghĩa là A ≠ 0) thì phân thức nghịch đảo của nó là B/A, vì A/B · B/A = 1. Ví dụ nghịch đảo của (x + 1)/x là x/(x + 1).\n\n' +
      'PHÉP CHIA\n' +
      'A/B : C/D = A/B · D/C (với C/D ≠ 0, tức C ≠ 0). Chia cho một phân thức là nhân với phân thức nghịch đảo của nó.\n' +
      'VÌ SAO đảo ngược? Giống phân số: chia cho 1/2 nghĩa là hỏi "trong số này có bao nhiêu nửa", bằng cách nhân với 2.\n' +
      'Ví dụ (x − 1)/(x + 2) : (x² − 1)/(x + 2) = (x − 1)/(x + 2) · (x + 2)/((x − 1)(x + 1)) = 1/(x + 1).\n\n' +
      'ĐIỀU KIỆN\n' +
      'Mọi mẫu thức xuất hiện trong bài đều phải khác 0, và khi chia thì phân thức đứng sau dấu chia cũng phải khác 0. ' +
      'Điều kiện được xét trên biểu thức ban đầu, trước khi rút gọn.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Khi chia, đảo nhầm phân thức thứ nhất, hoặc quên đảo, hoặc đảo cả hai.\n' +
      '— Nhân tử với mẫu thay vì tử với tử (chéo nhầm).\n' +
      '— Gạch hạng tử thay vì nhân tử: ở (x + 2)/(x · 2) không được gạch x hay số 2.\n' +
      '— Quên đổi dấu khi nhân tử đối nhau: (x − 3)/(3 − x) = −1.',
    workedExample: {
      problem:
        'a) Tính (x² − 4)/(3x) · 6x²/(x + 2), rồi tính giá trị tại x = 5. b) Tính (x − 1)/(x + 2) : (x² − 1)/(x + 2), rồi tính giá trị tại x = 3.',
      steps: [
        'a) Phân tích x² − 4 = (x − 2)(x + 2) rồi viết tích: (x − 2)(x + 2) · 6x²/(3x · (x + 2)).',
        'a) Rút gọn: 6x²/(3x) = 2x và (x + 2) triệt tiêu. Kết quả: 2x(x − 2).',
        'a) Tại x = 5: 2 · 5 · 3 = 30.',
        'b) Chuyển phép chia thành nhân với nghịch đảo: (x − 1)/(x + 2) · (x + 2)/(x² − 1).',
        'b) Phân tích x² − 1 = (x − 1)(x + 1), rồi gạch (x − 1) và (x + 2): được 1/(x + 1).',
        'b) Tại x = 3: 1/4.',
      ],
      answer: 'a) 2x(x − 2); tại x = 5 bằng 30. b) 1/(x + 1); tại x = 3 bằng 1/4.',
    },
    checkQuestions: [
      {
        prompt: 'Rút gọn (4x²/y) · (y²/(2x)) (x ≠ 0, y ≠ 0) rồi tính giá trị tại x = 3 và y = 5.',
        answer: { kind: 'numeric', value: 30 },
        explain:
          'Nhân tử với tử, mẫu với mẫu: 4x²y²/(2xy) = 2xy. Tại x = 3, y = 5: 2 · 3 · 5 = 30. ' +
          'Lỗi hay gặp là gạch sai thành 2x/y rồi thay số, hoặc quên nhân đủ 4 với y².',
      },
      {
        prompt:
          'Kết quả của phép chia (x + 2)/(x − 1) : (x + 2)/(x² − 1), với x ≠ ±1 và x ≠ −2, là:',
        choices: [
          { id: 'a', label: 'x + 1' },
          { id: 'b', label: '1/(x + 1)' },
          { id: 'c', label: 'x − 1' },
          { id: 'd', label: '1' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Nhân với nghịch đảo: (x + 2)/(x − 1) · (x² − 1)/(x + 2) = (x² − 1)/(x − 1) = (x − 1)(x + 1)/(x − 1) = x + 1. ' +
          'Đáp án b là lỗi đảo nhầm phân thức thứ nhất thay vì phân thức thứ hai.',
      },
      {
        prompt:
          'Tính A = (x² − 25)/(x² + 2x) : (x − 5)/x rồi tìm giá trị của A tại x = 4 (nhập phân số tối giản).',
        answer: { kind: 'fraction', num: 3, den: 2, requireSimplified: true },
        explain:
          'A = (x − 5)(x + 5)/(x(x + 2)) · x/(x − 5) = (x + 5)/(x + 2). Tại x = 4: 9/6 = 3/2. ' +
          'Lỗi hay gặp là tính tử và mẫu riêng rồi chia, hoặc quên rút gọn 9/6 về phân số tối giản.',
      },
      {
        prompt:
          'Một hình chữ nhật có diện tích 6x²/(x + 1) (m²) và chiều rộng 2x/(x + 1) (m). ' +
          'Chiều dài = diện tích : chiều rộng. Khi x = 4, chiều dài bằng bao nhiêu mét?',
        answer: { kind: 'numeric', value: 12 },
        explain:
          'Chiều dài = 6x²/(x + 1) : 2x/(x + 1) = 6x²/(x + 1) · (x + 1)/(2x) = 3x. Với x = 4 được 12 (m). ' +
          'Kiểm tra: diện tích 96/5 = 19,2, chiều rộng 8/5 = 1,6 và 19,2 : 1,6 = 12. Lỗi hay gặp là quên đảo ngược nên nhân thành 12x³/(x + 1)².',
      },
    ],
    srsCards: [
      {
        hoi: 'Quy tắc nhân hai phân thức?',
        dap: 'A/B · C/D = (A · C)/(B · D). Nên phân tích thành nhân tử trước để gạch nhân tử chung.',
      },
      {
        hoi: 'Phân thức nghịch đảo của A/B (A ≠ 0) là gì?',
        dap: 'Là B/A, vì A/B · B/A = 1.',
      },
      {
        hoi: 'Quy tắc chia hai phân thức?',
        dap: 'A/B : C/D = A/B · D/C (C ≠ 0): nhân với nghịch đảo của phân thức đứng sau dấu chia.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
