// lessons/toan7c8.ts — Toán 7, Chương 8: Làm quen với biến cố và xác suất của biến cố.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN7_C8_LESSONS: MathLesson[] = [
  {
    id: 'toan7-c8-b1',
    grade: '7',
    chapterNumber: 8,
    chapterTitle: 'Làm quen với biến cố và xác suất của biến cố',
    lessonNumber: 1,
    title: 'Làm quen với biến cố ngẫu nhiên',
    hook:
      'Trong giờ ra chơi, cả nhóm chơi trò bốc thăm: trong túi có 5 viên bi đỏ và 3 viên bi xanh, không nhìn mà lấy ra một viên. ' +
      'Bạn Nam nói: "Chắc chắn mình lấy được bi đỏ!". Bạn Lan cãi: "Chưa chắc, có thể là bi xanh". Bạn Hùng lại hỏi: "Vậy lấy được bi vàng thì sao?". ' +
      'Ba câu nói thể hiện ba mức độ khác nhau của "khả năng xảy ra". Bài này dạy em phân biệt biến cố chắc chắn, không thể và ngẫu nhiên.',
    theory:
      'PHÉP THỬ NGẪU NHIÊN\n' +
      'Phép thử ngẫu nhiên là hành động mà ta không thể đoán trước kết quả, nhưng liệt kê được tất cả các kết quả có thể xảy ra. ' +
      'Ví dụ: gieo một con xúc xắc (6 kết quả có thể: 1, 2, 3, 4, 5, 6); tung một đồng xu (2 kết quả: sấp, ngửa); lấy một viên bi từ túi đã biết các màu bi.\n\n' +
      'BIẾN CỐ\n' +
      'Biến cố là một sự kiện có thể xảy ra hoặc không xảy ra liên quan tới phép thử, được mô tả bằng một câu. ' +
      'Ví dụ khi gieo xúc xắc: "số chấm xuất hiện là số chẵn" là một biến cố.\n\n' +
      'BA LOẠI BIẾN CỐ\n' +
      '— Biến cố chắc chắn: luôn xảy ra mỗi khi thực hiện phép thử. Ví dụ gieo xúc xắc: "số chấm nhỏ hơn 7".\n' +
      '— Biến cố không thể: không bao giờ xảy ra. Ví dụ gieo xúc xắc: "số chấm bằng 8".\n' +
      '— Biến cố ngẫu nhiên: có thể xảy ra, cũng có thể không xảy ra, không chắc chắn trước khi làm. Ví dụ: "số chấm bằng 5".\n' +
      'VÌ SAO phân loại như vậy? Vì việc biết một biến cố là chắc chắn, không thể hay ngẫu nhiên cho ta mức độ "tin chắc" về nó trước khi thử, và là nền tảng để học xác suất ở bài sau.\n\n' +
      'CÁCH PHÂN LOẠI\n' +
      '1) Liệt kê tất cả các kết quả có thể của phép thử.\n' +
      '2) Xem trong các kết quả đó, biến cố được nêu xảy ra ở mấy kết quả: tất cả (chắc chắn), không kết quả nào (không thể), hoặc một số (ngẫu nhiên).\n' +
      'Ví dụ: túi chứa 5 bi đỏ và 3 bi xanh, lấy ngẫu nhiên một viên. "Lấy được bi đỏ" là biến cố ngẫu nhiên; "lấy được bi vàng" là biến cố không thể; ' +
      '"lấy được bi đỏ hoặc bi xanh" là biến cố chắc chắn.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Coi biến cố có nhiều khả năng xảy ra là chắc chắn. Chỉ khi luôn xảy ra mới là chắc chắn: túi có 9 bi đỏ và 1 bi xanh thì "lấy được bi đỏ" vẫn là ngẫu nhiên.\n' +
      '— Coi biến cố rất ít khả năng xảy ra là không thể. Nếu vẫn có thể xảy ra, dù hiếm, nó vẫn là biến cố ngẫu nhiên.\n' +
      '— Quên xem hết các kết quả có thể của phép thử trước khi kết luận (túi không có bi vàng thì "bi vàng" là không thể).',
    workedExample: {
      problem:
        'Một hộp chứa 3 thẻ đỏ và 2 thẻ xanh (không có thẻ nào khác). Rút ngẫu nhiên một thẻ. Hãy phân loại các biến cố: ' +
        'A: "Rút được thẻ đỏ"; B: "Rút được thẻ vàng"; C: "Rút được thẻ đỏ hoặc thẻ xanh"; D: "Rút được thẻ xanh".',
      steps: [
        'Các kết quả có thể: rút được thẻ đỏ (3 thẻ) hoặc thẻ xanh (2 thẻ). Trong hộp không có thẻ vàng.',
        'A: có thể rút thẻ đỏ nhưng cũng có thể rút thẻ xanh nên A là biến cố ngẫu nhiên.',
        'B: trong hộp không có thẻ vàng nên không bao giờ xảy ra, B là biến cố không thể.',
        'C: mọi thẻ trong hộp đều đỏ hoặc xanh nên luôn xảy ra, C là biến cố chắc chắn.',
        'D: có thể rút thẻ xanh nhưng cũng có thể rút thẻ đỏ nên D là biến cố ngẫu nhiên.',
      ],
      answer: 'A và D là biến cố ngẫu nhiên; B là biến cố không thể; C là biến cố chắc chắn.',
    },
    checkQuestions: [
      {
        prompt: 'Gieo một con xúc xắc sáu mặt. Biến cố nào sau đây là biến cố chắc chắn?',
        choices: [
          { id: 'a', label: 'Số chấm xuất hiện là 6' },
          { id: 'b', label: 'Số chấm xuất hiện là số chẵn' },
          { id: 'c', label: 'Số chấm xuất hiện nhỏ hơn hoặc bằng 6' },
          { id: 'd', label: 'Số chấm xuất hiện lớn hơn 3' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Mọi kết quả 1, 2, 3, 4, 5, 6 đều nhỏ hơn hoặc bằng 6 nên biến cố ở đáp án c luôn xảy ra, tức chắc chắn. ' +
          'Các biến cố còn lại chỉ xảy ra với một số mặt nên là ngẫu nhiên. Lỗi hay gặp là chọn biến cố "có nhiều khả năng" thay vì biến cố luôn xảy ra.',
      },
      {
        prompt:
          'Một túi chỉ có 5 viên bi đỏ. Lấy ngẫu nhiên một viên. Biến cố "lấy được viên bi xanh" thuộc loại nào?',
        choices: [
          { id: 'a', label: 'Biến cố chắc chắn' },
          { id: 'b', label: 'Biến cố không thể' },
          { id: 'c', label: 'Biến cố ngẫu nhiên' },
          { id: 'd', label: 'Không xác định được' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Trong túi không có bi xanh nên không bao giờ lấy được viên bi xanh, đây là biến cố không thể. ' +
          'Lỗi hay gặp là gọi là biến cố ngẫu nhiên chỉ vì có hành động "lấy ngẫu nhiên", trong khi phải xem các kết quả có thể của phép thử.',
      },
      {
        prompt:
          'Tung một đồng xu hai lần liên tiếp, mỗi lần ra mặt sấp (S) hoặc mặt ngửa (N). Có bao nhiêu kết quả có thể xảy ra?',
        answer: { kind: 'numeric', value: 4 },
        explain:
          'Liệt kê theo thứ tự hai lần tung: SS, SN, NS, NN, tổng cộng 4 kết quả. ' +
          'Lỗi hay gặp là coi SN và NS là một kết quả (hoặc chỉ đếm 2 kết quả), trong khi thứ tự hai lần tung khác nhau thì là hai kết quả khác nhau.',
      },
      {
        prompt: 'Biến cố nào sau đây là biến cố ngẫu nhiên?',
        choices: [
          { id: 'a', label: 'Sau ngày thứ Hai là ngày thứ Ba' },
          { id: 'b', label: 'Một tháng dương lịch có 45 ngày' },
          { id: 'c', label: 'Ngày mai lớp em có bạn xin nghỉ học' },
          { id: 'd', label: 'Một tuần lễ có bảy ngày' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Ngày mai có bạn nghỉ học hay không thì ta không đoán trước được, có thể xảy ra, có thể không nên là biến cố ngẫu nhiên. ' +
          'Đáp án a và d luôn đúng (chắc chắn), đáp án b không bao giờ đúng (không thể). Lỗi hay gặp là nhầm sự kiện "quen thuộc" với "ngẫu nhiên".',
      },
    ],
    srsCards: [
      {
        hoi: 'Ba loại biến cố là gì?',
        dap: 'Biến cố chắc chắn (luôn xảy ra), biến cố không thể (không bao giờ xảy ra), biến cố ngẫu nhiên (có thể xảy ra hoặc không).',
      },
      {
        hoi: 'Phép thử ngẫu nhiên là gì?',
        dap: 'Là hành động không đoán trước được kết quả nhưng liệt kê được các kết quả có thể xảy ra, như gieo xúc xắc, tung đồng xu.',
      },
      {
        hoi: 'Cách phân loại một biến cố?',
        dap: 'Liệt kê các kết quả có thể; biến cố xảy ra ở mọi kết quả là chắc chắn, không kết quả nào là không thể, một số kết quả là ngẫu nhiên.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan7-c8-b2',
    grade: '7',
    chapterNumber: 8,
    chapterTitle: 'Làm quen với biến cố và xác suất của biến cố',
    lessonNumber: 2,
    title: 'Làm quen với xác suất của biến cố',
    hook:
      'Ở hội chợ, quầy trò chơi có vòng quay may mắn chia thành 8 ô bằng nhau: 3 ô có phần thưởng và 5 ô không có. ' +
      'Bạn Minh hỏi: "Quay một lần thì có bao nhiêu phần trăm cơ hội trúng thưởng?". Nhìn 3 ô trúng trên tổng 8 ô, ta dùng một phân số để đo cơ hội đó: ' +
      '3/8. Con số này gọi là xác suất. Bài này dạy em tính xác suất của biến cố khi các kết quả có khả năng như nhau.',
    theory:
      'KẾT QUẢ ĐỒNG KHẢ NĂNG\n' +
      'Khi một phép thử có các kết quả mà mỗi kết quả có cùng khả năng xảy ra, ta gọi chúng là đồng khả năng. ' +
      'Ví dụ: gieo một con xúc xắc cân đối (6 mặt như nhau), rút ngẫu nhiên một thẻ trong các thẻ giống hệt nhau, quay vòng quay có các ô bằng nhau.\n\n' +
      'XÁC SUẤT CỦA BIẾN CỐ\n' +
      'Giả sử phép thử có n kết quả có thể, đồng khả năng. Nếu có k kết quả làm biến cố A xảy ra (gọi là các kết quả thuận lợi cho A) thì xác suất của biến cố A, kí hiệu P(A), là\n' +
      'P(A) = k : n (tức phân số k/n).\n' +
      'Ví dụ: gieo xúc xắc, biến cố A: "số chấm là số lẻ". Có 6 kết quả có thể; các kết quả thuận lợi là 1, 3, 5 (k = 3). Vậy P(A) = 3/6 = 1/2.\n' +
      'VÌ SAO có công thức này? Các kết quả có khả năng như nhau, nên khả năng của A bằng phần các kết quả thuận lợi trong tất cả các kết quả.\n\n' +
      'TÍNH CHẤT CỦA XÁC SUẤT\n' +
      '— Xác suất luôn từ 0 đến 1: 0 ≤ P(A) ≤ 1 (vì số kết quả thuận lợi k không vượt quá n).\n' +
      '— Biến cố chắc chắn luôn xảy ra, k = n nên xác suất bằng 1.\n' +
      '— Biến cố không thể không bao giờ xảy ra, k = 0 nên xác suất bằng 0.\n' +
      '— Xác suất càng gần 1 thì biến cố càng dễ xảy ra; càng gần 0 thì càng khó xảy ra.\n\n' +
      'CÁC BƯỚC TÍNH\n' +
      '1) Kiểm tra các kết quả có đồng khả năng không.\n' +
      '2) Đếm n, tổng số kết quả có thể.\n' +
      '3) Đếm k, số kết quả thuận lợi cho biến cố.\n' +
      '4) Viết P = k/n và rút gọn phân số.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Đếm "màu" thay vì đếm "viên": túi có 3 bi đỏ và 2 bi xanh có 5 kết quả (5 viên) chứ không phải 2 kết quả (2 màu), nên P(đỏ) = 3/5 chứ không phải 1/2.\n' +
      '— Lấy số kết quả thuận lợi chia cho số kết quả không thuận lợi thay vì chia cho tổng số kết quả.\n' +
      '— Kết luận xác suất lớn hơn 1 hoặc là số âm: đó chắc chắn là sai.\n' +
      '— Quên rút gọn phân số.',
    workedExample: {
      problem:
        'Một hộp có 12 viên bi cùng kích cỡ: 5 viên đỏ, 4 viên xanh, 3 viên vàng. Lấy ngẫu nhiên một viên. ' +
        'Tính xác suất của các biến cố: A: "lấy được bi đỏ"; B: "lấy được bi không phải màu vàng"; C: "lấy được bi trắng"; D: "lấy được bi đỏ, xanh hoặc vàng".',
      steps: [
        'Các viên bi cùng kích cỡ nên 12 kết quả có thể (mỗi viên một kết quả) là đồng khả năng. Vậy n = 12.',
        'A: có 5 viên bi đỏ, k = 5 nên P(A) = 5/12.',
        'B: viên không vàng gồm 5 đỏ + 4 xanh = 9 viên, k = 9 nên P(B) = 9/12 = 3/4.',
        'C: không có bi trắng, k = 0 nên P(C) = 0 (biến cố không thể).',
        'D: mọi viên bi đều có một trong ba màu đó, k = 12 nên P(D) = 12/12 = 1 (biến cố chắc chắn).',
      ],
      answer: 'P(A) = 5/12; P(B) = 3/4; P(C) = 0; P(D) = 1.',
    },
    checkQuestions: [
      {
        prompt:
          'Gieo một con xúc xắc cân đối. Xác suất của biến cố "số chấm là số lẻ" là bao nhiêu? (Viết dưới dạng phân số tối giản.)',
        answer: { kind: 'fraction', num: 1, den: 2, requireSimplified: true },
        explain:
          'Có 6 kết quả có thể, trong đó 3 kết quả thuận lợi (1, 3, 5), nên xác suất là 3/6 = 1/2. ' +
          'Lỗi hay gặp là quên rút gọn phân số hoặc đếm nhầm số kết quả thuận lợi.',
      },
      {
        prompt:
          'Rút ngẫu nhiên một thẻ từ 20 thẻ giống nhau được đánh số từ 1 đến 20. Xác suất của biến cố "rút được thẻ số 25" bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 0 },
        explain:
          'Không có thẻ nào đánh số 25 nên không có kết quả thuận lợi (k = 0), đây là biến cố không thể và xác suất là 0/20 = 0. ' +
          'Lỗi hay gặp là cho rằng xác suất là một số bé nào đó khác 0 chỉ vì có 20 thẻ để chọn.',
      },
      {
        prompt: 'Giá trị nào sau đây KHÔNG thể là xác suất của một biến cố?',
        choices: [
          { id: 'a', label: '0' },
          { id: 'b', label: '3/4' },
          { id: 'c', label: '1' },
          { id: 'd', label: '5/4' },
        ],
        answer: { kind: 'choice', correctIds: ['d'] },
        explain:
          'Xác suất luôn nằm trong khoảng từ 0 đến 1. Phân số 5/4 lớn hơn 1 nên không thể là xác suất. 0 là xác suất của biến cố không thể, ' +
          '1 là xác suất của biến cố chắc chắn, 3/4 nằm giữa 0 và 1. Lỗi hay gặp là tưởng xác suất có thể lớn hơn 1.',
      },
      {
        prompt:
          'Lớp 7A có 40 học sinh, trong đó 22 bạn nữ. Cô giáo gọi ngẫu nhiên một bạn lên bảng. ' +
          'Xác suất để bạn được gọi là nam bằng bao nhiêu? (Viết dưới dạng phân số tối giản.)',
        answer: { kind: 'fraction', num: 9, den: 20, requireSimplified: true },
        explain:
          'Số bạn nam là 40 − 22 = 18. Mỗi bạn có cùng khả năng được gọi, nên xác suất là 18/40 = 9/20. ' +
          'Lỗi hay gặp là lấy 22/40 (xác suất của bạn nữ) hoặc chia 18 cho 22 thay vì chia cho tổng số học sinh.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức tính xác suất khi các kết quả đồng khả năng?',
        dap: 'P(A) = số kết quả thuận lợi cho A : tổng số kết quả có thể.',
      },
      {
        hoi: 'Xác suất của biến cố chắc chắn và biến cố không thể là bao nhiêu?',
        dap: 'Chắc chắn: bằng 1. Không thể: bằng 0. Xác suất luôn nằm từ 0 đến 1.',
      },
      {
        hoi: 'Vì sao túi có 3 bi đỏ, 2 bi xanh thì P(đỏ) = 3/5 chứ không phải 1/2?',
        dap: 'Phải đếm số viên bi (5 kết quả đồng khả năng), không đếm số màu.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
