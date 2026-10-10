// lessons/toan8c8.ts — Toán 8, Chương 8: Mở đầu về tính xác suất của biến cố.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN8_C8_LESSONS: MathLesson[] = [
  {
    id: 'toan8-c8-b1',
    grade: '8',
    chapterNumber: 8,
    chapterTitle: 'Mở đầu về tính xác suất của biến cố',
    lessonNumber: 1,
    title: 'Kết quả có thể và kết quả thuận lợi',
    hook:
      'Trong buổi liên hoan lớp 8A (40 bạn), cô giáo bỏ 40 phiếu đánh số từ 1 đến 40 vào một chiếc hộp rồi rút ngẫu nhiên một phiếu để chọn bạn nhận quà. ' +
      'Nam lẩm bẩm: "Mình có số 7, hi vọng rút trúng số lẻ!". Muốn nói chính xác về cơ hội của mình, trước hết ta phải biết có bao nhiêu phiếu có thể được rút, ' +
      'và trong đó có bao nhiêu phiếu "hợp ý" Nam. Bài này dạy em đếm đúng hai loại kết quả đó.',
    theory:
      'PHÉP THỬ VÀ KẾT QUẢ CÓ THỂ\n' +
      'Phép thử là một việc làm (hoặc thí nghiệm) mà ta biết các kết quả có thể xảy ra nhưng không chắc kết quả nào sẽ xảy ra, như gieo xúc xắc, rút thẻ, quay vòng quay. ' +
      'Mỗi điều có thể xảy ra gọi là một kết quả có thể. Cần liệt kê đủ mọi kết quả có thể và không để trùng. ' +
      'Ví dụ gieo một con xúc xắc có 6 kết quả có thể: 1; 2; 3; 4; 5; 6 chấm.\n\n' +
      'BIẾN CỐ VÀ KẾT QUẢ THUẬN LỢI\n' +
      'Biến cố là một sự kiện được mô tả bằng lời, có thể xảy ra hoặc không tuỳ kết quả của phép thử, như "số chấm là số chẵn". ' +
      'Kết quả thuận lợi cho biến cố là kết quả khiến biến cố đó xảy ra. Với biến cố "số chấm là số chẵn", có 3 kết quả thuận lợi: 2; 4; 6.\n' +
      'VÌ SAO phải đếm hai loại này? Cơ hội xảy ra của biến cố phụ thuộc vào việc kết quả thuận lợi chiếm bao nhiêu trong toàn bộ kết quả có thể. Bài sau sẽ dùng hai con số này để tính xác suất.\n\n' +
      'CÁCH LÀM\n' +
      '1) Liệt kê hoặc đếm toàn bộ kết quả có thể của phép thử.\n' +
      '2) Đọc kĩ biến cố, chọn trong số đó các kết quả thoả mãn điều kiện: đó là các kết quả thuận lợi.\n' +
      '3) Kiểm tra: số kết quả thuận lợi không vượt quá số kết quả có thể.\n\n' +
      'KẾT QUẢ ĐỒNG KHẢ NĂNG\n' +
      'Khi các kết quả có thể có cơ hội xảy ra như nhau (xúc xắc cân đối, đồng xu cân đối, rút thẻ ngẫu nhiên từ hộp các thẻ giống hệt nhau) ta nói chúng đồng khả năng. ' +
      'Đây là điều kiện để bài sau dùng được công thức tính bằng tỉ số.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Quên một số kết quả hoặc đếm trùng: rút thẻ từ 1 đến 20 mà "số nguyên tố" lại bỏ số 2 hoặc tính cả số 1.\n' +
      '— Nhầm kết quả thuận lợi với kết quả có thể (hai con số khác nhau!).\n' +
      '— Đếm theo màu thay vì theo từng vật: hộp có 5 bi xanh thì có 5 kết quả (5 viên bi khác nhau), không phải 1 kết quả "xanh".\n' +
      '— Đọc sai biến cố: "lớn hơn 10" không gồm số 10, còn "không nhỏ hơn 10" thì gồm số 10.',
    workedExample: {
      problem:
        'Một hộp có 20 chiếc thẻ giống hệt nhau, đánh số từ 1 đến 20. Rút ngẫu nhiên một thẻ. ' +
        'a) Có bao nhiêu kết quả có thể? b) Liệt kê các kết quả thuận lợi cho biến cố A: "số trên thẻ là số nguyên tố". ' +
        'c) Có bao nhiêu kết quả thuận lợi cho biến cố B: "số trên thẻ chia hết cho 5"?',
      steps: [
        'Mỗi thẻ rút ra là một kết quả có thể, các thẻ giống hệt nhau nên đồng khả năng. Có 20 kết quả có thể: 1; 2; ...; 20.',
        'Số nguyên tố từ 1 đến 20 là 2; 3; 5; 7; 11; 13; 17; 19 (số 1 không phải số nguyên tố).',
        'Vậy biến cố A có 8 kết quả thuận lợi: 2; 3; 5; 7; 11; 13; 17; 19.',
        'Các số chia hết cho 5 từ 1 đến 20 là 5; 10; 15; 20 nên biến cố B có 4 kết quả thuận lợi.',
        'Kiểm tra: 8 và 4 đều nhỏ hơn 20 (số kết quả có thể).',
      ],
      answer:
        'a) 20 kết quả; b) 8 kết quả: 2; 3; 5; 7; 11; 13; 17; 19; c) 4 kết quả: 5; 10; 15; 20.',
    },
    checkQuestions: [
      {
        prompt:
          'Gieo một con xúc xắc cân đối. Có bao nhiêu kết quả thuận lợi cho biến cố "số chấm xuất hiện là số nguyên tố"?',
        answer: { kind: 'numeric', value: 3 },
        explain:
          'Các mặt có số chấm nguyên tố là 2; 3; 5 nên có 3 kết quả thuận lợi. Số 1 không phải số nguyên tố và 4; 6 là hợp số. ' +
          'Lỗi hay gặp là tính cả mặt 1 (được 4 kết quả) hoặc quên mặt 2 vì nghĩ "số chẵn không nguyên tố".',
      },
      {
        prompt:
          'Một hộp có 5 viên bi xanh, 3 viên bi đỏ và 4 viên bi vàng, cùng kích thước. Lấy ngẫu nhiên một viên bi. Có bao nhiêu kết quả có thể?',
        answer: { kind: 'numeric', value: 12 },
        explain:
          'Mỗi viên bi có thể được lấy ra là một kết quả nên số kết quả có thể là 5 + 3 + 4 = 12. ' +
          'Lỗi hay gặp là chỉ đếm theo màu (3 kết quả), trong khi các viên bi cùng màu vẫn là các kết quả khác nhau.',
      },
      {
        prompt:
          'Rút ngẫu nhiên một thẻ từ hộp 20 thẻ đánh số từ 1 đến 20. Các kết quả thuận lợi cho biến cố "số trên thẻ là số lẻ lớn hơn 10" là:',
        choices: [
          { id: 'a', label: '11; 13; 15; 17; 19' },
          { id: 'b', label: '11; 12; 13; 14; 15; 16; 17; 18; 19; 20' },
          { id: 'c', label: '13; 15; 17; 19' },
          { id: 'd', label: '9; 11; 13; 15; 17; 19' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Số lẻ lớn hơn 10 và không quá 20 là 11; 13; 15; 17; 19. Phương án b chỉ cần "lớn hơn 10" mà quên điều kiện lẻ; phương án c bỏ sót 11; ' +
          'phương án d lấy cả 9 là số nhỏ hơn 10. Lỗi hay gặp là bỏ sót một trong hai điều kiện của biến cố.',
      },
      {
        prompt:
          'Lớp 8A có 40 bạn, trong đó 22 bạn nam. Cô giáo chọn ngẫu nhiên một bạn lên bảng. ' +
          'Có bao nhiêu kết quả thuận lợi cho biến cố "bạn được chọn là nữ"?',
        answer: { kind: 'numeric', value: 18 },
        explain:
          'Mỗi bạn là một kết quả có thể (40 kết quả). Số bạn nữ là 40 − 22 = 18 nên có 18 kết quả thuận lợi. ' +
          'Lỗi hay gặp là lấy ngay 22 (số bạn nam) hoặc nhầm số kết quả thuận lợi với số kết quả có thể (40).',
      },
    ],
    srsCards: [
      {
        hoi: 'Kết quả có thể của một phép thử là gì?',
        dap: 'Mỗi điều có thể xảy ra khi thực hiện phép thử. Gieo xúc xắc có 6 kết quả có thể.',
      },
      {
        hoi: 'Kết quả thuận lợi cho một biến cố là gì?',
        dap: 'Là kết quả làm cho biến cố đó xảy ra, nằm trong số các kết quả có thể.',
      },
      {
        hoi: 'Khi nào các kết quả được gọi là đồng khả năng?',
        dap: 'Khi chúng có cơ hội xảy ra như nhau, như xúc xắc cân đối hoặc các thẻ giống hệt nhau được rút ngẫu nhiên.',
      },
      {
        hoi: 'Có bao nhiêu số nguyên tố từ 1 đến 20 và đó là những số nào?',
        dap: '8 số: 2; 3; 5; 7; 11; 13; 17; 19 (số 1 không phải số nguyên tố).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan8-c8-b2',
    grade: '8',
    chapterNumber: 8,
    chapterTitle: 'Mở đầu về tính xác suất của biến cố',
    lessonNumber: 2,
    title: 'Tính xác suất của biến cố bằng tỉ số',
    hook:
      'Siêu thị tổ chức bốc thăm may mắn: có 80 phiếu trong thùng, trong đó 12 phiếu trúng thưởng. Hai người bạn cãi nhau: một người bảo "cơ hội trúng rất ít", ' +
      'người kia bảo "cũng kha khá đấy chứ". Thay vì cảm tính, toán học cho ta một con số chính xác gọi là xác suất để đo cơ hội xảy ra của một sự việc. ' +
      'Bài này dạy em tính xác suất bằng một tỉ số đơn giản.',
    theory:
      'XÁC SUẤT CỦA BIẾN CỐ\n' +
      'Giả sử phép thử có n kết quả có thể, đồng khả năng. Biến cố E có k kết quả thuận lợi. Xác suất của biến cố E, kí hiệu P(E), là:\n' +
      '   P(E) = k / n = (số kết quả thuận lợi cho E) / (số kết quả có thể).\n' +
      'Ví dụ gieo xúc xắc cân đối, biến cố "số chấm chia hết cho 3" có 2 kết quả thuận lợi (3 và 6) trên 6 kết quả có thể nên P = 2 / 6 = 1 / 3.\n' +
      'VÌ SAO là tỉ số? Các kết quả có cơ hội như nhau nên "phần" kết quả thuận lợi chiếm trong toàn bộ chính là cơ hội của biến cố.\n\n' +
      'MỘT SỐ NHẬN XÉT QUAN TRỌNG\n' +
      '— Vì k nằm giữa 0 và n nên xác suất luôn nằm giữa 0 và 1 (0 ≤ P ≤ 1). Có thể viết xác suất dưới dạng phân số, số thập phân hoặc phần trăm.\n' +
      '— Biến cố không thể xảy ra (k = 0) có xác suất 0. Ví dụ gieo xúc xắc được mặt 7 chấm: P = 0.\n' +
      '— Biến cố chắc chắn xảy ra (k = n) có xác suất 1. Ví dụ gieo xúc xắc được số chấm nhỏ hơn 7: P = 1.\n' +
      '— Xác suất càng gần 1 thì biến cố càng dễ xảy ra, càng gần 0 thì càng khó xảy ra.\n' +
      '— Muốn tính xác suất để biến cố "không xảy ra", đếm số kết quả còn lại: nếu có k thuận lợi trên n thì phần còn lại là n − k kết quả.\n\n' +
      'CÁCH LÀM\n' +
      '1) Kiểm tra các kết quả có đồng khả năng không.\n' +
      '2) Đếm n (số kết quả có thể) và k (số kết quả thuận lợi).\n' +
      '3) Lập tỉ số k / n rồi rút gọn.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Lập tỉ số ngược n / k, hoặc chia k cho số kết quả KHÔNG thuận lợi.\n' +
      '— Đếm sai k hoặc n (bỏ sót, tính trùng).\n' +
      '— Dùng công thức khi các kết quả KHÔNG đồng khả năng, như một đồng xu bị méo.\n' +
      '— Cho kết quả lớn hơn 1 hoặc là số âm: dấu hiệu chắc chắn đã sai.',
    workedExample: {
      problem:
        'Một hộp có 5 viên bi đỏ, 3 viên bi xanh và 2 viên bi vàng, cùng kích thước. Lấy ngẫu nhiên một viên bi. ' +
        'Tính xác suất của các biến cố: a) "lấy được bi đỏ"; b) "lấy được bi không phải màu vàng"; c) "lấy được bi trắng".',
      steps: [
        'Có 5 + 3 + 2 = 10 viên bi, các viên giống nhau về kích thước nên 10 kết quả có thể đồng khả năng.',
        'a) Có 5 viên bi đỏ nên 5 kết quả thuận lợi. P = 5 / 10 = 1 / 2.',
        'b) Bi không phải màu vàng gồm 5 + 3 = 8 viên nên có 8 kết quả thuận lợi. P = 8 / 10 = 4 / 5.',
        'c) Trong hộp không có bi trắng nên 0 kết quả thuận lợi. P = 0 / 10 = 0 (biến cố không thể xảy ra).',
        'Kiểm tra: cả ba xác suất đều nằm trong khoảng từ 0 đến 1.',
      ],
      answer: 'a) 1/2; b) 4/5; c) 0.',
    },
    checkQuestions: [
      {
        prompt:
          'Gieo một con xúc xắc cân đối. Xác suất của biến cố "số chấm xuất hiện chia hết cho 3", viết dưới dạng phân số tối giản, là bao nhiêu?',
        answer: { kind: 'fraction', num: 1, den: 3, requireSimplified: true },
        explain:
          'Có 6 kết quả có thể đồng khả năng, trong đó 2 kết quả thuận lợi là mặt 3 và mặt 6. Xác suất là 2 / 6 = 1 / 3. ' +
          'Lỗi hay gặp là quên rút gọn, hoặc bỏ sót mặt 6 nên tính ra 1 / 6.',
      },
      {
        prompt:
          'Rút ngẫu nhiên một thẻ từ hộp 20 thẻ đánh số từ 1 đến 20. Xác suất của biến cố "số trên thẻ là số nguyên tố", viết dưới dạng phân số tối giản, là bao nhiêu?',
        answer: { kind: 'fraction', num: 2, den: 5, requireSimplified: true },
        explain:
          'Có 20 kết quả có thể và 8 kết quả thuận lợi (2; 3; 5; 7; 11; 13; 17; 19). Xác suất là 8 / 20 = 2 / 5. ' +
          'Lỗi hay gặp là tính cả số 1 (được 9 / 20) hoặc quên rút gọn.',
      },
      {
        prompt:
          'Siêu thị bốc thăm trúng thưởng: có 80 phiếu, trong đó 12 phiếu trúng thưởng. An bốc ngẫu nhiên một phiếu. ' +
          'Xác suất An trúng thưởng bằng bao nhiêu (viết dưới dạng số thập phân)?',
        answer: { kind: 'numeric', value: 0.15 },
        explain:
          'Có 80 kết quả có thể và 12 kết quả thuận lợi nên xác suất là 12 / 80 = 0,15 (tức 15%). ' +
          'Lỗi hay gặp là chia 12 cho 68 (số phiếu không trúng) hoặc lấy 80 / 12.',
      },
      {
        prompt: 'Gieo một con xúc xắc cân đối. Biến cố nào sau đây có xác suất bằng 1?',
        choices: [
          { id: 'a', label: 'Số chấm xuất hiện lớn hơn 3' },
          { id: 'b', label: 'Số chấm xuất hiện nhỏ hơn 7' },
          { id: 'c', label: 'Số chấm xuất hiện bằng 7' },
          { id: 'd', label: 'Số chấm xuất hiện là số chẵn' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Mọi mặt xúc xắc (1 đến 6) đều nhỏ hơn 7 nên cả 6 kết quả đều thuận lợi, P = 6 / 6 = 1: biến cố chắc chắn xảy ra. ' +
          'Phương án a và d có xác suất 1 / 2, phương án c là biến cố không thể xảy ra (xác suất 0). Lỗi hay gặp là nhầm xác suất 1 với xác suất 0.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức tính xác suất của biến cố E khi các kết quả đồng khả năng?',
        dap: 'P(E) = (số kết quả thuận lợi cho E) / (số kết quả có thể).',
      },
      {
        hoi: 'Xác suất nằm trong khoảng nào?',
        dap: 'Từ 0 đến 1. Biến cố không thể xảy ra có xác suất 0; biến cố chắc chắn xảy ra có xác suất 1.',
      },
      {
        hoi: 'Xác suất bằng 0,15 nghĩa là bao nhiêu phần trăm?',
        dap: '15%. Xác suất đổi sang phần trăm bằng cách nhân với 100.',
      },
      {
        hoi: 'Điều kiện để dùng công thức k / n là gì?',
        dap: 'Các kết quả có thể phải đồng khả năng (có cơ hội xảy ra như nhau).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan8-c8-b3',
    grade: '8',
    chapterNumber: 8,
    chapterTitle: 'Mở đầu về tính xác suất của biến cố',
    lessonNumber: 3,
    title: 'Liên hệ giữa xác suất thực nghiệm và xác suất lí thuyết',
    hook:
      'Chú Ba nuôi cá trong một cái hồ lớn và muốn biết trong hồ có khoảng bao nhiêu con, nhưng chẳng thể tháo nước ra đếm từng con. ' +
      'Chú nghĩ ra cách: bắt 100 con, đánh dấu rồi thả lại, vài hôm sau bắt một mẻ khác xem có bao nhiêu con mang dấu. ' +
      'Cách làm này dựa trên một ý tưởng đẹp của xác suất: làm thử nhiều lần thì tần suất cho ta biết xác suất. Bài này dạy em ý tưởng đó.',
    theory:
      'XÁC SUẤT THỰC NGHIỆM\n' +
      'Thực hiện phép thử n lần, biến cố E xảy ra m lần. Xác suất thực nghiệm (tần suất) của E là m / n. ' +
      'Ví dụ tung đồng xu 500 lần được 255 lần ngửa: xác suất thực nghiệm của "mặt ngửa" là 255 / 500 = 0,51.\n\n' +
      'XÁC SUẤT LÍ THUYẾT\n' +
      'Là xác suất tính bằng tỉ số k / n khi các kết quả đồng khả năng (bài trước). Đồng xu cân đối có xác suất lí thuyết của mặt ngửa là 1 / 2 = 0,5.\n\n' +
      'LIÊN HỆ GIỮA HAI LOẠI XÁC SUẤT\n' +
      'Khi số lần thử càng lớn, xác suất thực nghiệm thường càng gần xác suất lí thuyết. Ví dụ tung 10 lần có thể được 7 ngửa (0,7), nhưng tung 1000 lần thì tần suất ngửa thường chỉ quanh 0,5. ' +
      'VÌ SAO? Với ít lần thử, may rủi ảnh hưởng mạnh; thử nhiều lần thì các may rủi bù trừ cho nhau.\n' +
      'Khi không thể tính xác suất lí thuyết (các kết quả không đồng khả năng, như chiếc đinh ghim rơi ngửa hay úp, hoặc cú sút phạt trúng lưới), ta dùng xác suất thực nghiệm từ nhiều lần thử để ước lượng.\n\n' +
      'ỨNG DỤNG: ƯỚC LƯỢNG SỐ LƯỢNG\n' +
      'Bài toán đánh dấu cá: gọi N là số cá trong hồ chưa biết. Bắt M con, đánh dấu, thả lại. Lần sau bắt n con thì thấy k con có dấu.\n' +
      'Tỉ lệ cá có dấu trong mẻ bắt (k / n) ước lượng tỉ lệ cá có dấu trong cả hồ (M / N). Vậy k / n ≈ M / N, suy ra N ≈ M · n / k.\n' +
      'Tương tự, kiểm tra ngẫu nhiên một số sản phẩm rồi ước lượng số sản phẩm lỗi của cả lô.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Cho rằng xác suất thực nghiệm phải bằng đúng xác suất lí thuyết. Thực tế chỉ gần nhau khi số lần thử lớn.\n' +
      '— Tin vào "luật bù": sau nhiều lần sấp liên tiếp, lần sau chắc chắn ngửa. Thực ra mỗi lần tung độc lập, xác suất vẫn là 0,5.\n' +
      '— Kết luận từ quá ít lần thử (10 lần).\n' +
      '— Đảo tỉ lệ khi ước lượng: viết N / M thay vì M / N.',
    workedExample: {
      problem:
        'Để ước lượng số cá trong hồ, người ta bắt 100 con, đánh dấu rồi thả lại. Vài hôm sau bắt ngẫu nhiên 150 con thì thấy 12 con có dấu. ' +
        'Hãy ước lượng số cá trong hồ.',
      steps: [
        'Xác suất thực nghiệm bắt được cá có dấu ở mẻ thứ hai là 12 / 150.',
        'Nếu cá đã trộn đều, tỉ lệ cá có dấu trong hồ là 100 / N (N là số cá trong hồ), và tỉ lệ này xấp xỉ 12 / 150.',
        'Vậy 100 / N ≈ 12 / 150, suy ra N ≈ 100 · 150 / 12.',
        'Tính: 100 · 150 = 15 000; 15 000 / 12 = 1250.',
        'Kết luận: trong hồ có khoảng 1250 con cá. Đây là số ước lượng, bắt mẻ khác có thể cho số hơi khác.',
      ],
      answer: 'Khoảng 1250 con cá.',
    },
    checkQuestions: [
      {
        prompt:
          'Tung một đồng xu 500 lần, mặt ngửa xuất hiện 255 lần. Xác suất thực nghiệm của biến cố "mặt ngửa" bằng bao nhiêu (viết dưới dạng số thập phân)?',
        answer: { kind: 'numeric', value: 0.51 },
        explain:
          'Xác suất thực nghiệm bằng số lần xảy ra chia tổng số lần thử: 255 / 500 = 0,51, gần với xác suất lí thuyết 0,5. ' +
          'Lỗi hay gặp là lấy 255 / 245 (số lần ngửa chia số lần sấp) hoặc 255 / 2.',
      },
      {
        prompt: 'Phát biểu nào sau đây đúng?',
        choices: [
          {
            id: 'a',
            label: 'Tung đồng xu 10 lần được 7 lần ngửa thì xác suất lí thuyết của mặt ngửa là 0,7',
          },
          {
            id: 'b',
            label:
              'Số lần thử càng lớn thì xác suất thực nghiệm thường càng gần xác suất lí thuyết',
          },
          { id: 'c', label: 'Sau 5 lần sấp liên tiếp, lần tung tiếp theo chắc chắn là ngửa' },
          { id: 'd', label: 'Xác suất thực nghiệm luôn bằng xác suất lí thuyết' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Khi làm thử nhiều lần, may rủi bù trừ nên tần suất thường gần xác suất lí thuyết. Phương án a sai vì 10 lần quá ít và xác suất lí thuyết của đồng xu cân đối là 0,5; ' +
          'phương án c sai vì các lần tung độc lập; phương án d sai vì hai loại xác suất chỉ gần nhau, không luôn bằng nhau.',
      },
      {
        prompt:
          'Để ước lượng số cá trong hồ, người ta bắt 80 con, đánh dấu rồi thả lại. Lần sau bắt ngẫu nhiên 120 con thì có 8 con mang dấu. ' +
          'Số cá trong hồ ước lượng khoảng bao nhiêu con?',
        answer: { kind: 'numeric', value: 1200 },
        explain:
          'Tỉ lệ cá có dấu ở mẻ sau là 8 / 120, ước lượng tỉ lệ trong hồ là 80 / N nên N ≈ 80 · 120 / 8 = 1200 con. ' +
          'Lỗi hay gặp là đảo tỉ lệ, tính 80 · 8 / 120 ≈ 5,3, một kết quả vô lí vì ít hơn số cá đã đánh dấu.',
      },
      {
        prompt:
          'Nhà máy kiểm tra ngẫu nhiên 400 bóng đèn thì thấy 6 bóng bị lỗi. Dựa vào đó, ước lượng trong một lô 12 000 bóng đèn cùng loại có khoảng bao nhiêu bóng bị lỗi?',
        answer: { kind: 'numeric', value: 180 },
        explain:
          'Xác suất thực nghiệm bóng lỗi là 6 / 400 = 0,015. Với 12 000 bóng, số bóng lỗi ước lượng là 0,015 · 12 000 = 180 bóng. ' +
          'Lỗi hay gặp là chỉ tính 12 000 / 400 = 30 mà quên nhân với 6, hoặc quên rằng đây chỉ là số ước lượng.',
      },
    ],
    srsCards: [
      {
        hoi: 'Xác suất thực nghiệm của biến cố E là gì?',
        dap: 'Là m / n, trong đó E xảy ra m lần trong tổng số n lần thực hiện phép thử.',
      },
      {
        hoi: 'Khi số lần thử lớn, xác suất thực nghiệm so với xác suất lí thuyết thế nào?',
        dap: 'Thường càng gần xác suất lí thuyết, nhưng không phải luôn bằng nhau.',
      },
      {
        hoi: 'Công thức ước lượng số cá trong hồ bằng cách đánh dấu?',
        dap: 'Đánh dấu M con, lần sau bắt n con có k con mang dấu thì N ≈ M · n / k.',
      },
      {
        hoi: 'Khi nào dùng xác suất thực nghiệm để ước lượng?',
        dap: 'Khi không tính được xác suất lí thuyết vì các kết quả không đồng khả năng, hoặc cần ước lượng số lượng lớn.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
