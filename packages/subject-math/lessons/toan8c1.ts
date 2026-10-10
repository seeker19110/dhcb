// lessons/toan8c1.ts — Toán 8, Chương 1: Đa thức.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN8_C1_LESSONS: MathLesson[] = [
  {
    id: 'toan8-c1-b1',
    grade: '8',
    chapterNumber: 1,
    chapterTitle: 'Đa thức',
    lessonNumber: 1,
    title: 'Đơn thức và đa thức nhiều biến',
    hook:
      'Nam gấp một chiếc hộp quà hình hộp chữ nhật có ba kích thước x, y, z (cm). Thể tích hộp là x · y · z, còn diện tích giấy bọc là ' +
      '2xy + 2yz + 2zx. Một chiếc hộp mà cần tới ba chữ cái thì không còn là "đa thức một biến" như năm lớp 7 nữa. ' +
      'Bài này giúp em gọi tên và tính toán với những biểu thức có nhiều biến như vậy: đơn thức, đa thức, bậc và cách thu gọn.',
    theory:
      'ĐƠN THỨC\n' +
      'Đơn thức là biểu thức đại số chỉ gồm một số, hoặc một biến, hoặc một tích của các số và các biến (mỗi biến có số mũ là số tự nhiên). ' +
      'Ví dụ: 5; x; −3x²y; 2xy²z³ đều là đơn thức. Còn x + y hay 1/x thì không phải đơn thức.\n' +
      'Đơn thức thu gọn là đơn thức mà mỗi biến chỉ xuất hiện một lần (kèm số mũ) và hệ số (một số) viết đứng đầu. ' +
      'Ví dụ −3x²y có hệ số −3 và phần biến x²y. Đơn thức 2x · 4x²y chưa thu gọn; thu gọn thành 8x³y.\n\n' +
      'BẬC CỦA ĐƠN THỨC\n' +
      'Bậc của đơn thức (có hệ số khác 0) là tổng các số mũ của tất cả các biến trong dạng thu gọn. ' +
      'Ví dụ 2xy²z³ có bậc 1 + 2 + 3 = 6. Số khác 0 là đơn thức bậc 0. Số 0 là đơn thức không, không có bậc.\n' +
      'VÌ SAO cộng số mũ của MỌI biến? Vì x²y³ = x · x · y · y · y là tích của 5 thừa số chữ, và bậc đếm tổng số thừa số chữ đó.\n\n' +
      'ĐƠN THỨC ĐỒNG DẠNG\n' +
      'Hai đơn thức đồng dạng nếu chúng có hệ số khác 0 và có cùng phần biến. Ví dụ 3x²y và −7x²y đồng dạng; 3x²y và 3xy² không đồng dạng ' +
      '(cùng chữ nhưng số mũ khác nhau). Muốn cộng, trừ các đơn thức đồng dạng, ta cộng, trừ các hệ số và giữ nguyên phần biến: ' +
      '3x²y − 7x²y = (3 − 7)x²y = −4x²y.\n\n' +
      'ĐA THỨC\n' +
      'Đa thức là tổng của những đơn thức; mỗi đơn thức trong tổng gọi là một hạng tử của đa thức. Ví dụ P = 4x²y − xy² − 7 có ba hạng tử.\n' +
      'Thu gọn đa thức là gộp các đơn thức đồng dạng. Bậc của đa thức là bậc của hạng tử có bậc cao nhất trong dạng thu gọn.\n' +
      'VÌ SAO phải thu gọn trước khi tìm bậc? Vì khi gộp, hạng tử bậc cao có thể triệt tiêu (5x²y³ − 5x²y³ = 0), nên bậc ghi trên đề chưa chắc là bậc thật.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Quên cộng số mũ ngầm định: biến x không ghi số mũ thì mũ là 1 (xy²z có bậc 1 + 2 + 1 = 4, không phải 3).\n' +
      '— Coi 3x²y và 3xy² là đồng dạng vì có "cùng chữ" và cộng được thành 6x²y.\n' +
      '— Tìm bậc của đa thức khi chưa thu gọn.\n' +
      '— Lẫn lộn bậc của đơn thức (cộng số mũ) với bậc của đa thức (lấy bậc lớn nhất của các hạng tử).',
    workedExample: {
      problem:
        'Thu gọn đa thức P = 3x²y − 5xy² + x²y + 4xy² − 7. Tìm bậc của P và tính giá trị của P tại x = 1, y = −2.',
      steps: [
        'Nhóm các đơn thức đồng dạng: (3x²y + x²y) + (−5xy² + 4xy²) − 7.',
        'Cộng hệ số: 3x²y + x²y = 4x²y; −5xy² + 4xy² = −xy².',
        'Dạng thu gọn: P = 4x²y − xy² − 7.',
        'Bậc của từng hạng tử: 4x²y có bậc 2 + 1 = 3; −xy² có bậc 1 + 2 = 3; −7 có bậc 0. Vậy P có bậc 3.',
        'Thay x = 1, y = −2: 4 · 1² · (−2) − 1 · (−2)² − 7 = −8 − 4 − 7 = −19.',
      ],
      answer: 'P = 4x²y − xy² − 7, bậc 3; giá trị của P tại x = 1, y = −2 là −19.',
    },
    checkQuestions: [
      {
        prompt: 'Bậc của đơn thức −5x²y³z bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 6 },
        explain:
          'Cộng số mũ của mọi biến: 2 + 3 + 1 = 6 (biến z không ghi mũ nghĩa là mũ 1). ' +
          'Lỗi hay gặp là quên mũ 1 của z và đáp 5, hoặc cộng cả hệ số −5 vào bậc.',
      },
      {
        prompt: 'Cặp đơn thức nào sau đây đồng dạng?',
        choices: [
          { id: 'a', label: '3x²y và 3xy²' },
          { id: 'b', label: '2x²y và −5x²y' },
          { id: 'c', label: '4xy và 4xyz' },
          { id: 'd', label: '5x²y và 5x²y²' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Hai đơn thức đồng dạng phải có CÙNG phần biến (cùng chữ, cùng số mũ). Chỉ cặp 2x²y và −5x²y thoả mãn. ' +
          'Cặp a có chữ giống nhau nhưng số mũ đổi chỗ (x²y khác xy²), cặp c và d khác chữ hoặc khác số mũ.',
      },
      {
        prompt:
          'Cho Q = 5x²y³ − 2xy + x³ − 5x²y³ + 6x³y. Sau khi thu gọn, bậc của Q bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 4 },
        explain:
          'Gộp 5x²y³ − 5x²y³ = 0 nên Q = 6x³y + x³ − 2xy. Bậc các hạng tử: 6x³y có bậc 4, x³ bậc 3, −2xy bậc 2, vậy Q có bậc 4. ' +
          'Lỗi hay gặp là đáp 5 vì thấy x²y³ bậc 5 trong khi chưa thu gọn, mà hạng tử đó đã triệt tiêu.',
      },
      {
        prompt:
          'Một chiếc hộp có đáy là hình vuông cạnh x (cm) và chiều cao y (cm). Diện tích toàn phần là 2x² + 4xy (cm²). ' +
          'Tính diện tích toàn phần khi x = 5 và y = 10.',
        answer: { kind: 'numeric', value: 250 },
        explain:
          'Thay số: 2 · 5² + 4 · 5 · 10 = 2 · 25 + 200 = 50 + 200 = 250 (cm²). ' +
          'Lỗi hay gặp là tính 2x² thành (2x)² = 100 hoặc cộng 2 + 4 trước khi nhân.',
      },
    ],
    srsCards: [
      {
        hoi: 'Bậc của một đơn thức nhiều biến là gì?',
        dap: 'Là tổng các số mũ của tất cả các biến trong dạng thu gọn (hệ số khác 0). Ví dụ 2xy²z có bậc 1 + 2 + 1 = 4.',
      },
      {
        hoi: 'Hai đơn thức đồng dạng khi nào?',
        dap: 'Khi chúng có hệ số khác 0 và cùng phần biến (cùng chữ, cùng số mũ từng chữ). Chỉ các đơn thức đồng dạng mới cộng, trừ được thành một đơn thức.',
      },
      {
        hoi: 'Bậc của một đa thức được tìm thế nào?',
        dap: 'Thu gọn đa thức trước, rồi lấy bậc lớn nhất trong các hạng tử.',
      },
      {
        hoi: 'Biến không ghi số mũ thì số mũ bằng bao nhiêu?',
        dap: 'Bằng 1. Ví dụ x²yz có bậc 2 + 1 + 1 = 4.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan8-c1-b2',
    grade: '8',
    chapterNumber: 1,
    chapterTitle: 'Đa thức',
    lessonNumber: 2,
    title: 'Phép cộng và phép trừ đa thức nhiều biến',
    hook:
      'Lớp 8A gấp giấy làm đồ trang trí: x ngôi sao và y con hạc, số tờ giấy cần dùng là 2x + 3y. Lớp 8B dùng x + 5y − 2 tờ. ' +
      'Muốn biết cả hai lớp dùng bao nhiêu tờ, hay lớp nào dùng nhiều hơn bao nhiêu tờ, ta cộng hoặc trừ hai biểu thức đó. ' +
      'Bài này dạy cách cộng, trừ đa thức nhiều biến cho gọn và không sai dấu.',
    theory:
      'CỘNG HAI ĐA THỨC\n' +
      'Muốn cộng hai đa thức A và B, ta viết A + B, bỏ ngoặc rồi gộp các đơn thức đồng dạng (cộng các hệ số, giữ nguyên phần biến).\n' +
      'Ví dụ: A = 2x² − 3xy + y² và B = x² + 5xy − 4y². Khi đó A + B = 2x² − 3xy + y² + x² + 5xy − 4y² = 3x² + 2xy − 3y².\n\n' +
      'TRỪ HAI ĐA THỨC\n' +
      'A − B chính là A + (−B), trong đó −B là đa thức B đổi dấu TẤT CẢ các hạng tử.\n' +
      'Quy tắc bỏ ngoặc: ngoặc có dấu + đứng trước thì giữ nguyên dấu các hạng tử bên trong; ngoặc có dấu − đứng trước thì đổi dấu mọi hạng tử bên trong.\n' +
      'Ví dụ: A − B = (2x² − 3xy + y²) − (x² + 5xy − 4y²) = 2x² − 3xy + y² − x² − 5xy + 4y² = x² − 8xy + 5y².\n' +
      'VÌ SAO đổi dấu cả ngoặc? Vì dấu − trước ngoặc nghĩa là nhân cả đa thức trong ngoặc với −1, và phép nhân này phải áp dụng cho từng hạng tử.\n\n' +
      'CÁCH TRÌNH BÀY GỌN\n' +
      'Sau khi bỏ ngoặc, nên sắp các đơn thức đồng dạng cạnh nhau, đánh dấu từng nhóm, cộng hệ số, rồi viết kết quả theo thứ tự quen thuộc ' +
      '(giảm dần bậc của một biến nào đó). Nếu một nhóm có hệ số bằng 0 thì hạng tử đó biến mất.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Bỏ ngoặc có dấu − chỉ đổi dấu hạng tử đầu tiên. Đây là lỗi gây sai nhiều nhất ở bài này.\n' +
      '— Cộng các đơn thức không đồng dạng, ví dụ x²y + xy² = 2x²y (sai).\n' +
      '— Quên hạng tử chỉ có ở một trong hai đa thức (nó vẫn có mặt trong kết quả).\n' +
      '— Cộng cả phần biến: 3x² + 2x² = 5x⁴ (sai); phần biến giữ nguyên, chỉ cộng hệ số: 5x².',
    workedExample: {
      problem:
        'Cho A = 3x²y − 2xy² + 5 và B = x²y + 4xy² − 3xy. Tính A − B, rồi tính giá trị của A − B tại x = 1, y = 2.',
      steps: [
        'Viết A − B = (3x²y − 2xy² + 5) − (x²y + 4xy² − 3xy).',
        'Bỏ ngoặc, đổi dấu mọi hạng tử trong ngoặc thứ hai: 3x²y − 2xy² + 5 − x²y − 4xy² + 3xy.',
        'Nhóm đơn thức đồng dạng: (3x²y − x²y) + (−2xy² − 4xy²) + 3xy + 5.',
        'Cộng hệ số: 2x²y − 6xy² + 3xy + 5.',
        'Thay x = 1, y = 2: 2 · 1 · 2 − 6 · 1 · 4 + 3 · 1 · 2 + 5 = 4 − 24 + 6 + 5 = −9.',
      ],
      answer: 'A − B = 2x²y − 6xy² + 3xy + 5; giá trị tại x = 1, y = 2 là −9.',
    },
    checkQuestions: [
      {
        prompt:
          'Cho A = 2x² − 3xy + y² và B = x² + 5xy − 4y². Trong đa thức A − B, hệ số của xy bằng bao nhiêu (nhập số âm nếu có)?',
        answer: { kind: 'numeric', value: -8 },
        explain:
          'A − B = 2x² − 3xy + y² − x² − 5xy + 4y² = x² − 8xy + 5y², nên hệ số của xy là −3 − 5 = −8. ' +
          'Lỗi hay gặp là chỉ đổi dấu hạng tử đầu của B, hoặc tính −3 + 5 = 2 vì quên rằng trừ B nghĩa là đổi dấu 5xy.',
      },
      {
        prompt: 'Cho M = 4x²y − 3xy² và N = x²y − 2xy². Kết quả của M − N là:',
        choices: [
          { id: 'a', label: '3x²y − xy²' },
          { id: 'b', label: '3x²y − 5xy²' },
          { id: 'c', label: '5x²y − 5xy²' },
          { id: 'd', label: '5x²y − xy²' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'M − N = 4x²y − 3xy² − x²y + 2xy² = 3x²y − xy² (chú ý −(−2xy²) = +2xy²). ' +
          'Đáp án b là kết quả khi quên đổi dấu hạng tử thứ hai của N; c và d cộng nhầm thay vì trừ.',
      },
      {
        prompt:
          'Cho A = 5x³y − 2x² + y và B = −5x³y + 2x² + 3xy. Sau khi cộng, bậc của đa thức A + B bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 2 },
        explain:
          'A + B = (5x³y − 5x³y) + (−2x² + 2x²) + y + 3xy = y + 3xy. Hạng tử 3xy có bậc 2 nên A + B có bậc 2. ' +
          'Lỗi hay gặp là kết luận bậc 4 theo hạng tử 5x³y của đề, quên rằng nó đã triệt tiêu khi cộng.',
      },
      {
        prompt:
          'Quán trà của cô Lan bán x ly trà sữa và y ly cà phê trong một ngày. Doanh thu là 25x + 20y (nghìn đồng), chi phí là 15x + 12y + 300 (nghìn đồng). ' +
          'Hôm nay quán bán 40 ly trà sữa và 30 ly cà phê. Tiền lãi (doanh thu trừ chi phí) là bao nhiêu nghìn đồng?',
        answer: { kind: 'numeric', value: 340 },
        explain:
          'Lãi = (25x + 20y) − (15x + 12y + 300) = 10x + 8y − 300. Thay x = 40, y = 30: 400 + 240 − 300 = 340 (nghìn đồng). ' +
          'Lỗi hay gặp là quên đổi dấu số 300 trong ngoặc khi trừ, thành 10x + 8y + 300.',
      },
    ],
    srsCards: [
      {
        hoi: 'Muốn cộng hai đa thức ta làm thế nào?',
        dap: 'Bỏ ngoặc, gộp các đơn thức đồng dạng bằng cách cộng hệ số và giữ nguyên phần biến.',
      },
      {
        hoi: 'Quy tắc bỏ ngoặc khi trước ngoặc có dấu trừ?',
        dap: 'Đổi dấu TẤT CẢ các hạng tử trong ngoặc: A − (B + C − D) = A − B − C + D.',
      },
      {
        hoi: 'A − B được viết lại thành phép cộng thế nào?',
        dap: 'A − B = A + (−B), trong đó −B là đa thức B với mọi hạng tử đổi dấu.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan8-c1-b3',
    grade: '8',
    chapterNumber: 1,
    chapterTitle: 'Đa thức',
    lessonNumber: 3,
    title: 'Phép nhân và phép chia đa thức nhiều biến',
    hook:
      'Mảnh vườn nhà bác Tư hình chữ nhật, chiều dài (x + 5) m và chiều rộng (x + 2) m. Muốn biết diện tích, ta phải nhân hai đa thức ' +
      '(x + 5)(x + 2). Ngược lại, nếu biết diện tích một tấm bìa và một cạnh, muốn tìm cạnh còn lại ta phải chia. ' +
      'Bài này dạy cách nhân đa thức với đa thức và chia đa thức cho đơn thức.',
    theory:
      'NHÂN ĐƠN THỨC VỚI ĐƠN THỨC\n' +
      'Nhân các hệ số với nhau, nhân các phần biến với nhau theo quy tắc xᵐ · xⁿ = xᵐ⁺ⁿ. Ví dụ (3x²y) · (−2xy³) = −6x³y⁴.\n\n' +
      'NHÂN ĐƠN THỨC VỚI ĐA THỨC\n' +
      'Nhân đơn thức với từng hạng tử của đa thức rồi cộng các tích lại: A(B + C) = AB + AC. ' +
      'Ví dụ 2x(x² − 3x + 1) = 2x³ − 6x² + 2x.\n\n' +
      'NHÂN ĐA THỨC VỚI ĐA THỨC\n' +
      'Nhân mỗi hạng tử của đa thức này với từng hạng tử của đa thức kia, rồi cộng các tích và thu gọn: (A + B)(C + D) = AC + AD + BC + BD.\n' +
      'Ví dụ (x + 5)(x + 2) = x² + 2x + 5x + 10 = x² + 7x + 10.\n' +
      'VÌ SAO đúng? Đó là phép nhân phân phối hai lần, và cũng là cách chia hình chữ nhật dài (x + 5), rộng (x + 2) thành 4 hình nhỏ có diện tích x², 2x, 5x, 10.\n\n' +
      'CHIA ĐƠN THỨC CHO ĐƠN THỨC\n' +
      'Đơn thức A chia hết cho đơn thức B (B ≠ 0) khi mỗi biến của B đều có trong A với số mũ không lớn hơn số mũ trong A. ' +
      'Khi đó chia hệ số cho hệ số, chia các luỹ thừa cùng cơ số theo xᵐ : xⁿ = xᵐ⁻ⁿ. Ví dụ 6x³y² : 3x²y = 2xy.\n\n' +
      'CHIA ĐA THỨC CHO ĐƠN THỨC\n' +
      'Nếu mỗi hạng tử của đa thức A đều chia hết cho đơn thức B thì A chia hết cho B: chia từng hạng tử rồi cộng các thương. ' +
      'Ví dụ (6x³y² − 9x²y³) : 3x²y = 2xy − 3y².\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhân hai nhị thức mà chỉ nhân các hạng tử cùng vị trí: (x + 5)(x + 2) = x² + 10 (thiếu hai tích chéo 2x và 5x).\n' +
      '— Nhân luỹ thừa thì nhân số mũ: x² · x³ = x⁶ (sai). Đúng là x²⁺³ = x⁵.\n' +
      '— Chia luỹ thừa thì chia số mũ, hoặc chia hệ số bằng cách trừ.\n' +
      '— Sai dấu khi nhân với hạng tử âm, ví dụ (−3) · (−4x) = −12x (sai, phải là +12x).',
    workedExample: {
      problem: 'a) Nhân (2x − 3)(x² + x − 4). b) Chia (6x³y² − 9x²y³) cho 3x²y.',
      steps: [
        'a) Nhân 2x với từng hạng tử của đa thức thứ hai: 2x · x² + 2x · x + 2x · (−4) = 2x³ + 2x² − 8x.',
        'a) Nhân −3 với từng hạng tử: −3 · x² + (−3) · x + (−3) · (−4) = −3x² − 3x + 12.',
        'a) Cộng hai kết quả: 2x³ + 2x² − 8x − 3x² − 3x + 12, gộp hạng tử đồng dạng được 2x³ − x² − 11x + 12.',
        'a) Kiểm tra bằng cách thay x = 2: (2 · 2 − 3)(4 + 2 − 4) = 1 · 2 = 2 và 2 · 8 − 4 − 22 + 12 = 2, hai vế bằng nhau.',
        'b) Cả hai hạng tử đều chia hết cho 3x²y nên chia từng hạng tử: 6x³y² : 3x²y = 2xy; 9x²y³ : 3x²y = 3y².',
        'b) Thương là 2xy − 3y².',
      ],
      answer: 'a) 2x³ − x² − 11x + 12. b) 2xy − 3y².',
    },
    checkQuestions: [
      {
        prompt: 'Kết quả của phép chia (12x⁴y³ − 8x³y²) : (4x²y) là:',
        choices: [
          { id: 'a', label: '3x²y² − 2xy' },
          { id: 'b', label: '3x²y² − 2x²y' },
          { id: 'c', label: '8x²y² − 4xy' },
          { id: 'd', label: '3x⁶y⁴ − 2x⁵y³' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Chia từng hạng tử: 12x⁴y³ : 4x²y = 3x²y² và 8x³y² : 4x²y = 2xy, nên kết quả là 3x²y² − 2xy. ' +
          'Đáp án c là lỗi lấy hệ số trừ cho nhau, đáp án d là lỗi cộng số mũ thay vì trừ.',
      },
      {
        prompt:
          'Một sân hình vuông có cạnh x (m). Người ta mở rộng chiều dài thêm 3 m và chiều rộng thêm 2 m. ' +
          'Diện tích tăng thêm là (x + 3)(x + 2) − x² (m²). Tính phần diện tích tăng thêm khi x = 12.',
        answer: { kind: 'numeric', value: 66 },
        explain:
          '(x + 3)(x + 2) = x² + 2x + 3x + 6 = x² + 5x + 6, trừ x² còn 5x + 6. Với x = 12 được 60 + 6 = 66 (m²). ' +
          'Lỗi hay gặp là nhân thiếu hai tích chéo, thành x² + 6, rồi đáp 6.',
      },
      {
        prompt: 'Rút gọn A = (x + 2)(x − 2) − x(x − 5) rồi tính giá trị của A tại x = 3.',
        answer: { kind: 'numeric', value: 11 },
        explain:
          '(x + 2)(x − 2) = x² − 4 và x(x − 5) = x² − 5x, nên A = x² − 4 − x² + 5x = 5x − 4. Với x = 3 được 15 − 4 = 11. ' +
          'Lỗi hay gặp là bỏ ngoặc không đổi dấu −x(x − 5), thành x² − 4 + x² − 5x, rồi ra kết quả sai.',
      },
      {
        prompt:
          'Khai triển (2x − 1)(x² − 3x + 2). Hệ số của x² trong kết quả bằng bao nhiêu (nhập số âm nếu có)?',
        answer: { kind: 'numeric', value: -7 },
        explain:
          '(2x − 1)(x² − 3x + 2) = 2x³ − 6x² + 4x − x² + 3x − 2 = 2x³ − 7x² + 7x − 2. Hệ số của x² là −6 − 1 = −7 ' +
          '(hai hạng tử đồng dạng −6x² và −x² phải được gộp). Lỗi hay gặp là chỉ lấy −6, quên gộp.',
      },
    ],
    srsCards: [
      {
        hoi: 'Quy tắc nhân đa thức với đa thức?',
        dap: 'Nhân mỗi hạng tử của đa thức này với từng hạng tử của đa thức kia, rồi cộng các tích và thu gọn: (A + B)(C + D) = AC + AD + BC + BD.',
      },
      {
        hoi: 'Quy tắc nhân, chia luỹ thừa cùng cơ số?',
        dap: 'xᵐ · xⁿ = xᵐ⁺ⁿ và xᵐ : xⁿ = xᵐ⁻ⁿ (m ≥ n). Cộng hoặc trừ số mũ, không nhân hay chia số mũ.',
      },
      {
        hoi: 'Khi nào đơn thức A chia hết cho đơn thức B?',
        dap: 'Khi mỗi biến của B đều có trong A với số mũ không lớn hơn số mũ trong A.',
      },
      {
        hoi: 'Làm sao chia một đa thức cho một đơn thức?',
        dap: 'Nếu mọi hạng tử chia hết cho đơn thức đó thì chia từng hạng tử rồi cộng các thương.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
