// lessons/toan9c8.ts — Toán 9, Chương 8: Xác suất của biến cố trong một số mô hình xác suất đơn giản.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN9_C8_LESSONS: MathLesson[] = [
  {
    id: 'toan9-c8-b1',
    grade: '9',
    chapterNumber: 8,
    chapterTitle: 'Xác suất của biến cố trong một số mô hình xác suất đơn giản',
    lessonNumber: 1,
    title: 'Phép thử ngẫu nhiên và không gian mẫu',
    hook:
      'Trong trò chơi ở lớp, cô giáo tung một đồng xu hai lần liên tiếp. Hùng đoán "sấp rồi ngửa", Lan đoán "ngửa rồi sấp". Hai bạn đoán giống nhau hay khác nhau? ' +
      'Muốn trả lời, và sau này muốn tính cơ hội trúng thưởng của từng bạn, trước hết ta phải liệt kê đủ, không sót không trùng, mọi kết quả có thể xảy ra. Bài này dạy cách làm đó.',
    theory:
      'PHÉP THỬ NGẪU NHIÊN\n' +
      'Là phép thử (một việc làm) mà ta không đoán trước chắc chắn kết quả, nhưng biết được mọi kết quả có thể xảy ra. Ví dụ: tung đồng xu, gieo xúc xắc, rút thẻ trong hộp, quay vòng quay.\n\n' +
      'KHÔNG GIAN MẪU\n' +
      'Tập hợp tất cả các kết quả có thể xảy ra của phép thử gọi là không gian mẫu, kí hiệu Ω. Số phần tử của Ω viết là n(Ω).\n' +
      'Ví dụ: tung một đồng xu hai lần liên tiếp. Gọi S là mặt sấp, N là mặt ngửa; mỗi kết quả ghi thành cặp theo thứ tự (lần 1, lần 2). ' +
      'Ta có Ω = {SS; SN; NS; NN} và n(Ω) = 4.\n' +
      'VÌ SAO SN và NS là hai kết quả khác nhau? Vì thứ tự các lần tung khác nhau: SN là lần 1 sấp, lần 2 ngửa; NS thì ngược lại. Không được gộp chúng làm một. ' +
      'Vậy Hùng và Lan đoán khác nhau.\n\n' +
      'CÁCH LIỆT KÊ KHÔNG SÓT\n' +
      '— Sơ đồ cây: mỗi lần thực hiện là một tầng; từ mỗi nhánh vẽ tiếp các nhánh con, rồi đếm số nhánh ở tầng cuối. ' +
      'Tung đồng xu ba lần: 2 nhánh ở tầng một, mỗi nhánh lại chia 2, rồi mỗi nhánh chia 2 nữa, được 8 kết quả: SSS; SSN; SNS; SNN; NSS; NSN; NNS; NNN.\n' +
      '— Bảng: gieo xúc xắc hai lần thì lập bảng 6 hàng (lần 1) và 6 cột (lần 2). Mỗi ô là một cặp (i; j), nên có 6 · 6 = 36 kết quả. Cặp (1; 2) và (2; 1) nằm ở hai ô khác nhau.\n' +
      '— Liệt kê có hệ thống: sắp xếp theo lần 1 tăng dần, trong mỗi nhóm lại theo lần 2 tăng dần, để không sót, không trùng.\n\n' +
      'LẤY LẦN LƯỢT: CÓ HOÀN LẠI VÀ KHÔNG HOÀN LẠI\n' +
      'Hộp có 3 thẻ ghi 1; 2; 3, rút lần lượt hai thẻ, kết quả là cặp (thẻ lần 1; thẻ lần 2).\n' +
      '— Có hoàn lại (rút xong trả thẻ vào hộp): sơ đồ cây có 3 nhánh ở lần 1, mỗi nhánh lại có đủ 3 nhánh con, nên đếm được 3 · 3 = 9 kết quả, trong đó có cả (1; 1), (2; 2), (3; 3).\n' +
      '— Không hoàn lại (thẻ đã rút không trả lại): sơ đồ cây có 3 nhánh ở lần 1, mỗi nhánh chỉ còn 2 nhánh con, nên đếm được 3 · 2 = 6 kết quả và không có cặp hai số giống nhau.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Gộp SN và NS (hay (1; 2) và (2; 1)) thành một kết quả.\n' +
      '— Quên các kết quả có hai lần giống nhau như SS, (3; 3); hoặc ngược lại, ở trường hợp không hoàn lại mà vẫn ghi (2; 2).\n' +
      '— Nhầm số lần thực hiện: tung 3 lần mà chỉ liệt kê 4 kết quả của 2 lần.\n' +
      '— Liệt kê tuỳ hứng nên sót hoặc trùng. Hãy luôn dùng bảng hoặc sơ đồ cây.',
    workedExample: {
      problem:
        'Hộp có 3 viên bi cùng kích thước: 1 viên xanh (X), 1 viên đỏ (Đ), 1 viên vàng (V). Lấy ngẫu nhiên lần lượt hai viên bi. ' +
        'Liệt kê không gian mẫu và cho biết số phần tử trong hai trường hợp: a) lấy có hoàn lại; b) lấy không hoàn lại.',
      steps: [
        'Mỗi kết quả ghi thành cặp (màu lần 1; màu lần 2). Sơ đồ cây có 3 nhánh ở lần 1: X, Đ, V.',
        'a) Có hoàn lại: bi lấy ra được trả vào hộp nên từ mỗi nhánh lần 1 lại có đủ 3 nhánh con X, Đ, V.',
        'a) Ω = {XX; XĐ; XV; ĐX; ĐĐ; ĐV; VX; VĐ; VV}, n(Ω) = 3 · 3 = 9.',
        'b) Không hoàn lại: lấy xong một viên thì hộp còn 2 viên, nên mỗi nhánh lần 1 chỉ có 2 nhánh con.',
        'b) Ω = {XĐ; XV; ĐX; ĐV; VX; VĐ}, n(Ω) = 3 · 2 = 6.',
        'Kiểm tra: ở câu b không có cặp hai bi cùng màu (XX, ĐĐ, VV) vì mỗi màu chỉ có một viên.',
      ],
      answer: 'a) 9 kết quả. b) 6 kết quả.',
    },
    checkQuestions: [
      {
        prompt:
          'Gieo một con xúc xắc cân đối hai lần liên tiếp. Không gian mẫu của phép thử có bao nhiêu phần tử?',
        answer: { kind: 'numeric', value: 36 },
        explain:
          'Lập bảng 6 hàng (lần 1) và 6 cột (lần 2), mỗi ô là một cặp (i; j), nên n(Ω) = 6 · 6 = 36. ' +
          'Lỗi hay gặp là cộng 6 + 6 = 12, hoặc gộp (1; 2) và (2; 1) thành một kết quả rồi đếm được 21.',
      },
      {
        prompt:
          'Không gian mẫu của phép thử "Tung một đồng xu hai lần liên tiếp" là tập nào sau đây?',
        choices: [
          { id: 'a', label: '{S; N}' },
          { id: 'b', label: '{SS; SN; NS; NN}' },
          { id: 'c', label: '{SS; SN; NN}' },
          { id: 'd', label: '{SS; NN}' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Mỗi kết quả là một cặp theo thứ tự (lần 1, lần 2), nên có 4 kết quả: SS; SN; NS; NN. ' +
          'Lỗi hay gặp là gộp SN và NS thành một (đáp án c). Đáp án a chỉ là kết quả của một lần tung, còn d bỏ sót hai kết quả.',
      },
      {
        prompt:
          'Một hộp có 5 thẻ giống hệt nhau đánh số từ 1 đến 5. Bạn An rút lần lượt hai thẻ, thẻ rút trước không trả lại hộp. Không gian mẫu có bao nhiêu phần tử?',
        answer: { kind: 'numeric', value: 20 },
        explain:
          'Vẽ sơ đồ cây: lần 1 có 5 nhánh (5 thẻ); thẻ đã rút không trả lại nên mỗi nhánh lần 1 chỉ có 4 nhánh con. Đếm số nhánh ở tầng cuối: 5 nhóm, mỗi nhóm 4 nhánh, tổng 5 · 4 = 20, nên n(Ω) = 20. ' +
          'Lỗi hay gặp là tính 5 · 5 = 25, tức coi như thẻ được trả lại (rút có hoàn lại).',
      },
      {
        prompt:
          'Tung một đồng xu cân đối ba lần liên tiếp. Không gian mẫu của phép thử có bao nhiêu phần tử?',
        answer: { kind: 'numeric', value: 8 },
        explain:
          'Sơ đồ cây có 2 nhánh ở lần 1, mỗi nhánh chia 2 ở lần 2, mỗi nhánh lại chia 2 ở lần 3, nên có 2 · 2 · 2 = 8 kết quả (SSS, SSN, SNS, SNN, NSS, NSN, NNS, NNN). ' +
          'Lỗi hay gặp là chỉ đếm 4 kết quả của hai lần tung hoặc tính 2 · 3 = 6.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phép thử ngẫu nhiên và không gian mẫu là gì?',
        dap: 'Phép thử ngẫu nhiên: không đoán trước chắc chắn kết quả nhưng biết mọi kết quả có thể. Không gian mẫu Ω là tập hợp tất cả các kết quả có thể.',
      },
      {
        hoi: 'Có những cách nào để liệt kê không gian mẫu không sót, không trùng?',
        dap: 'Dùng bảng (hai lần thực hiện) hoặc sơ đồ cây (nhiều lần), hoặc liệt kê có hệ thống theo thứ tự.',
      },
      {
        hoi: 'Gieo xúc xắc hai lần và tung đồng xu hai lần có bao nhiêu kết quả?',
        dap: 'Xúc xắc hai lần: 6 · 6 = 36 kết quả. Đồng xu hai lần: 2 · 2 = 4 kết quả. Thứ tự các lần có ý nghĩa: SN khác NS.',
      },
      {
        hoi: 'Khác nhau giữa lấy có hoàn lại và không hoàn lại?',
        dap: 'Có hoàn lại: vật lấy ra được trả lại nên lần sau vẫn đủ như ban đầu. Không hoàn lại: lần sau còn ít hơn một vật nên số kết quả ít hơn.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan9-c8-b2',
    grade: '9',
    chapterNumber: 8,
    chapterTitle: 'Xác suất của biến cố trong một số mô hình xác suất đơn giản',
    lessonNumber: 2,
    title: 'Xác suất của biến cố liên quan tới phép thử',
    hook:
      'Trong trò chơi gieo hai con xúc xắc, Nam cược rằng tổng hai mặt bằng 7, còn Mai cược tổng bằng 12. Ai có cơ hội thắng cao hơn? ' +
      'Chỉ cần liệt kê không gian mẫu rồi đếm kết quả thuận lợi của mỗi bạn, ta tính được cơ hội đó bằng một con số cụ thể gọi là xác suất. Bài này dạy cách tính.',
    theory:
      'XÁC SUẤT CỦA BIẾN CỐ\n' +
      'Biến cố là một sự kiện mô tả bằng lời, có xảy ra hay không tuỳ kết quả của phép thử. Các kết quả làm biến cố A xảy ra gọi là kết quả thuận lợi cho A; chúng thuộc không gian mẫu Ω.\n' +
      'Khi các kết quả của Ω là đồng khả năng (đồng xu, xúc xắc cân đối, thẻ giống hệt nhau và rút ngẫu nhiên), xác suất của A là\n' +
      'P(A) = n(A) / n(Ω)\n' +
      'trong đó n(A) là số kết quả thuận lợi cho A và n(Ω) là số phần tử của Ω.\n' +
      'Xác suất luôn thỏa 0 ≤ P(A) ≤ 1. Biến cố không thể xảy ra có xác suất 0; biến cố chắc chắn xảy ra có xác suất 1.\n' +
      'VÌ SAO công thức đúng? Có n(Ω) kết quả cơ hội như nhau thì mỗi kết quả chiếm 1/n(Ω) cơ hội. Biến cố A có n(A) kết quả thuận lợi nên chiếm n(A) phần như thế.\n\n' +
      'VÌ SAO PHẢI ĐỒNG KHẢ NĂNG?\n' +
      'Tung đồng xu hai lần. Nếu chỉ liệt kê ba kết quả "hai sấp", "hai ngửa", "một sấp một ngửa" rồi cho mỗi kết quả xác suất 1/3 là sai: "một sấp một ngửa" gồm hai kết quả SN và NS nên xảy ra nhiều gấp đôi. ' +
      'Phải liệt kê Ω = {SS; SN; NS; NN} gồm 4 kết quả đồng khả năng.\n\n' +
      'CÁCH LÀM\n' +
      '1) Xác định phép thử và liệt kê không gian mẫu (bảng hoặc sơ đồ cây), tìm n(Ω).\n' +
      '2) Liệt kê các kết quả thuận lợi cho biến cố, tìm n(A).\n' +
      '3) Tính P(A) = n(A) / n(Ω) rồi rút gọn thành phân số tối giản.\n' +
      'Ví dụ 1: gieo xúc xắc hai lần, A là "tổng số chấm bằng 8". Các kết quả thuận lợi: (2; 6), (3; 5), (4; 4), (5; 3), (6; 2), tức n(A) = 5; n(Ω) = 36 nên P(A) = 5/36.\n' +
      'Ví dụ 2: cũng phép thử đó, B là "hai lần ra cùng số chấm": (1; 1), (2; 2), …, (6; 6), tức n(B) = 6, nên P(B) = 6/36 = 1/6.\n' +
      'Ví dụ 3: tung đồng xu hai lần, C là "có ít nhất một lần sấp": SS, SN, NS, tức n(C) = 3 nên P(C) = 3/4.\n' +
      'Với hai bạn ở đầu bài: tổng bằng 7 có 6 kết quả thuận lợi nên xác suất 6/36 = 1/6, còn tổng bằng 12 chỉ có (6; 6) nên xác suất 1/36. Nam có cơ hội cao hơn.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Quên rút gọn phân số, hoặc rút gọn sai.\n' +
      '— Đếm thiếu n(Ω) (gộp SN và NS) hoặc đếm thiếu n(A) (quên (4; 4) hay các cặp đảo thứ tự như (2; 6) và (6; 2)).\n' +
      '— Dùng công thức khi các kết quả không đồng khả năng.\n' +
      '— Ra xác suất lớn hơn 1 hoặc âm: đó là dấu hiệu đã nhầm n(A) với n(Ω).',
    workedExample: {
      problem:
        'Hộp có 3 thẻ giống hệt nhau ghi số 1; 2; 3. Rút ngẫu nhiên lần lượt hai thẻ, thẻ rút ra không trả lại hộp. ' +
        'Tính xác suất của biến cố A: "tổng hai số bằng 4" và biến cố B: "số ở lần rút thứ nhất lớn hơn số ở lần rút thứ hai".',
      steps: [
        'Phép thử là rút lần lượt hai thẻ không hoàn lại; kết quả ghi thành cặp (lần 1; lần 2).',
        'Ω = {(1; 2); (1; 3); (2; 1); (2; 3); (3; 1); (3; 2)}, n(Ω) = 6. Các kết quả đồng khả năng vì thẻ giống hệt nhau và rút ngẫu nhiên.',
        'A: tổng bằng 4. Có (1; 3) và (3; 1); cặp (2; 2) không có vì không hoàn lại. Vậy n(A) = 2.',
        'P(A) = 2/6 = 1/3.',
        'B: lần 1 lớn hơn lần 2. Có (2; 1), (3; 1), (3; 2), vậy n(B) = 3.',
        'P(B) = 3/6 = 1/2.',
      ],
      answer: 'P(A) = 1/3 và P(B) = 1/2.',
    },
    checkQuestions: [
      {
        prompt:
          'Gieo một con xúc xắc cân đối hai lần liên tiếp. Xác suất của biến cố "tổng số chấm bằng 5", viết dưới dạng phân số tối giản, là bao nhiêu?',
        answer: { kind: 'fraction', num: 1, den: 9, requireSimplified: true },
        explain:
          'Có n(Ω) = 36 kết quả. Kết quả thuận lợi: (1; 4), (2; 3), (3; 2), (4; 1), tức 4 kết quả. Vậy P = 4/36 = 1/9. ' +
          'Lỗi hay gặp là coi (1; 4) và (4; 1) là một kết quả (được 2/36 = 1/18) hoặc quên rút gọn.',
      },
      {
        prompt:
          'Tung một đồng xu cân đối hai lần liên tiếp. Xác suất của biến cố "có ít nhất một lần xuất hiện mặt sấp" là bao nhiêu?',
        choices: [
          { id: 'a', label: '1/4' },
          { id: 'b', label: '1/2' },
          { id: 'c', label: '3/4' },
          { id: 'd', label: '2/3' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Ω = {SS; SN; NS; NN} có 4 kết quả đồng khả năng; kết quả thuận lợi là SS, SN, NS, tức 3 kết quả. Vậy P = 3/4. ' +
          'Lỗi hay gặp là đáp án d: coi chỉ có 3 kết quả "hai sấp", "một sấp một ngửa", "hai ngửa" và tưởng chúng đồng khả năng.',
      },
      {
        prompt:
          'Tung một đồng xu cân đối ba lần liên tiếp. Xác suất của biến cố "đúng hai lần xuất hiện mặt sấp" bằng bao nhiêu phần trăm?',
        answer: { kind: 'numeric', value: 37.5 },
        explain:
          'Có n(Ω) = 8 kết quả. Kết quả thuận lợi: SSN, SNS, NSS, tức 3 kết quả. Vậy P = 3/8 = 0,375 = 37,5%. ' +
          'Lỗi hay gặp là bỏ sót một trong ba kết quả vì quên rằng mặt ngửa có thể ở lần tung thứ nhất, thứ hai hoặc thứ ba.',
      },
      {
        prompt:
          'Một túi có 12 viên bi cùng kích thước, trong đó có một số viên bi đỏ. Lấy ngẫu nhiên một viên, xác suất lấy được bi đỏ là 1/4. Trong túi có bao nhiêu viên bi đỏ?',
        answer: { kind: 'numeric', value: 3 },
        explain:
          'Gọi k là số bi đỏ thì P = k/12 = 1/4, suy ra k = 12 · 1/4 = 3 viên. ' +
          'Lỗi hay gặp là nhầm "1/4" thành 4 viên, hoặc tính 12 · 4 = 48.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức tính xác suất của biến cố A khi các kết quả đồng khả năng?',
        dap: 'P(A) = n(A) / n(Ω): số kết quả thuận lợi cho A chia cho số phần tử của không gian mẫu.',
      },
      {
        hoi: 'Xác suất nhận giá trị trong khoảng nào? Khi nào bằng 0, bằng 1?',
        dap: 'Luôn từ 0 đến 1. Bằng 0 nếu biến cố không thể xảy ra, bằng 1 nếu biến cố chắc chắn xảy ra.',
      },
      {
        hoi: 'Các bước tính xác suất của một biến cố?',
        dap: 'Liệt kê không gian mẫu và đếm n(Ω); đếm kết quả thuận lợi n(A); tính n(A)/n(Ω) rồi rút gọn.',
      },
      {
        hoi: 'Vì sao khi tung đồng xu hai lần phải coi SN và NS là hai kết quả?',
        dap: 'Vì có 4 kết quả đồng khả năng SS, SN, NS, NN. Gộp SN và NS thì các kết quả không còn đồng khả năng và công thức sai.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
