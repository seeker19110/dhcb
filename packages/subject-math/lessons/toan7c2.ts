// lessons/toan7c2.ts — Toán 7, Chương 2: Số thực.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN7_C2_LESSONS: MathLesson[] = [
  {
    id: 'toan7-c2-b1',
    grade: '7',
    chapterNumber: 2,
    chapterTitle: 'Số thực',
    lessonNumber: 1,
    title: 'Số thập phân vô hạn tuần hoàn và làm tròn số',
    hook:
      'Ba bạn chia nhau sợi dây dài 10 m, mỗi bạn được 10/3 mét. Bấm máy tính ra 3,3333333… và các chữ số 3 cứ nối đuôi nhau mãi. ' +
      'Khi cắt dây thật, em không thể cắt "vô hạn chữ số 3", mà phải làm tròn thành 3,3 m hoặc 3,33 m. ' +
      'Bài này giúp em hiểu vì sao có những số thập phân dài vô tận mà vẫn có quy luật, và làm tròn thế nào cho đúng.',
    theory:
      'VIẾT SỐ HỮU TỈ DƯỚI DẠNG SỐ THẬP PHÂN\n' +
      'Muốn đổi phân số a/b sang số thập phân, ta chia a cho b. Có hai khả năng:\n' +
      '— Số thập phân hữu hạn: phép chia dừng lại. Ví dụ 3/4 = 0,75; 7/20 = 0,35.\n' +
      '— Số thập phân vô hạn tuần hoàn: các chữ số lặp lại mãi theo một nhóm. Ví dụ 1/3 = 0,3333… = 0,(3); 5/6 = 0,8333… = 0,8(3); ' +
      '7/11 = 0,636363… = 0,(63). Nhóm chữ số lặp lại gọi là CHU KÌ, đặt trong ngoặc tròn.\n' +
      'Nhận biết nhanh: viết phân số ở dạng tối giản với mẫu dương. Nếu mẫu chỉ có ước nguyên tố 2 hoặc 5 thì được số thập phân hữu hạn; ' +
      'nếu mẫu còn ước nguyên tố khác (như 3, 7, 11) thì được số thập phân vô hạn tuần hoàn. Ví dụ 6/15 = 2/5 = 0,4 hữu hạn; 7/12 (12 = 2²·3) là vô hạn tuần hoàn.\n' +
      'VÌ SAO số thập phân lại tuần hoàn? Khi chia cho b, số dư chỉ có thể là 0, 1, …, b − 1. Nếu gặp dư 0 thì phép chia dừng. Nếu không, sau nhiều nhất ' +
      'b bước phải gặp lại một số dư đã có, và từ đó các chữ số lặp lại. Mỗi số hữu tỉ viết được thành số thập phân hữu hạn hoặc vô hạn tuần hoàn, ' +
      'và ngược lại mọi số thập phân hữu hạn hay vô hạn tuần hoàn đều là số hữu tỉ.\n\n' +
      'LÀM TRÒN SỐ\n' +
      'Để làm tròn số đến một hàng, ta nhìn chữ số ngay bên phải hàng đó:\n' +
      '— Nếu chữ số đó nhỏ hơn 5: giữ nguyên chữ số ở hàng làm tròn, bỏ các chữ số bên phải.\n' +
      '— Nếu chữ số đó lớn hơn hoặc bằng 5: cộng thêm 1 vào chữ số ở hàng làm tròn, bỏ các chữ số bên phải.\n' +
      'Ví dụ: 3,14159 làm tròn đến hàng phần trăm là 3,14; làm tròn đến hàng phần nghìn là 3,142; 0,(6) = 0,666… làm tròn đến hàng phần mười là 0,7.\n' +
      'VÌ SAO chữ số 5 là mốc? Chữ số bên phải từ 5 trở lên nghĩa là số thật gần mốc phía trên hơn; nhỏ hơn 5 thì gần mốc phía dưới hơn.\n' +
      'ĐỘ CHÍNH XÁC: làm tròn đến hàng nào thì sai số không vượt quá nửa đơn vị của hàng đó. Làm tròn đến hàng đơn vị có độ chính xác 0,5; ' +
      'đến hàng phần mười có độ chính xác 0,05; đến hàng phần trăm có độ chính xác 0,005.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Làm tròn dây chuyền: 17,2449 → 17,245 → 17,25. Sai! Chỉ nhìn chữ số ngay bên phải hàng cần làm tròn: chữ số đó là 4 nên được 17,24.\n' +
      '— Nhầm 0,(3) với 0,3: 0,(3) = 0,333… còn 0,3 chỉ có một chữ số.\n' +
      '— Đọc chu kì sai: 0,8(3) có chu kì là 3 (không phải 83), vì chữ số 8 chỉ xuất hiện một lần.\n' +
      '— Xem một phân số tối giản chưa kiểm tra mẫu mà đã kết luận: 6/15 chưa rút gọn nên trông có ước 3 nhưng thật ra bằng 0,4.',
    workedExample: {
      problem: 'Viết 5/12 dưới dạng số thập phân, chỉ ra chu kì, rồi làm tròn đến hàng phần trăm.',
      steps: [
        'Chia 5 cho 12: 5 = 0·12 + 5, lấy 50 : 12 được 4, dư 2.',
        'Lấy 20 : 12 được 1, dư 8. Lấy 80 : 12 được 6, dư 8.',
        'Số dư 8 xuất hiện lại, nên chữ số 6 sẽ lặp mãi: 5/12 = 0,41666… = 0,41(6), chu kì là 6.',
        'Kiểm tra bằng mẫu: 12 = 2²·3 có ước nguyên tố 3 nên đúng là số thập phân vô hạn tuần hoàn.',
        'Làm tròn đến hàng phần trăm (hai chữ số thập phân): chữ số thứ ba là 6 ≥ 5 nên cộng 1 vào chữ số 1, được 0,42.',
      ],
      answer: '5/12 = 0,41(6), chu kì 6; làm tròn đến hàng phần trăm được 0,42.',
    },
    checkQuestions: [
      {
        prompt: 'Phân số nào sau đây viết được dưới dạng số thập phân hữu hạn?',
        choices: [
          { id: 'a', label: '7/12' },
          { id: 'b', label: '5/9' },
          { id: 'c', label: '6/15' },
          { id: 'd', label: '4/11' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Rút gọn 6/15 = 2/5 = 0,4, mẫu 5 chỉ có ước nguyên tố 5 nên là số thập phân hữu hạn. Còn 12 = 2²·3, 9 = 3², 11 đều có ước ' +
          'nguyên tố khác 2 và 5 nên cho số thập phân vô hạn tuần hoàn. Lỗi hay gặp là nhìn mẫu 15 có ước 3 mà quên rút gọn trước.',
      },
      {
        prompt:
          'Làm tròn số 17,2449 đến hàng phần trăm (độ chính xác 0,005). Nhập kết quả dưới dạng số thập phân.',
        answer: { kind: 'numeric', value: 17.24, tolerance: { mode: 'absolute', eps: 0.006 } },
        explain:
          'Chữ số ngay sau hàng phần trăm là 4, nhỏ hơn 5, nên giữ nguyên chữ số 4 và bỏ phần sau: 17,24. Lỗi hay gặp là làm tròn dây chuyền ' +
          '17,2449 → 17,245 → 17,25: chữ số 4 cuối đã bị làm tròn lên thành 5 rồi lại làm tròn lần nữa, dẫn tới kết quả sai.',
      },
      {
        prompt: 'Số 2/11 = 0,181818… = 0,(18). Chữ số thập phân thứ 15 của số này là chữ số nào?',
        answer: { kind: 'numeric', value: 1 },
        explain:
          'Chu kì 18 có hai chữ số, lặp lại theo cặp: các vị trí lẻ (1, 3, 5, …) là chữ số 1, các vị trí chẵn là chữ số 8. ' +
          'Vị trí 15 là số lẻ nên chữ số là 1. Lỗi hay gặp là chọn 8 vì nhầm vị trí 15 với một vị trí chẵn, hoặc quên rằng chu kì có hai chữ số.',
      },
      {
        prompt:
          'Chia đều sợi dây dài 10 m cho 3 bạn, mỗi bạn được 10/3 m. Làm tròn độ dài này đến hàng phần mười (độ chính xác 0,05) ' +
          'để cắt dây, mỗi bạn nhận bao nhiêu mét? Nhập dưới dạng số thập phân.',
        answer: { kind: 'numeric', value: 3.3, tolerance: { mode: 'absolute', eps: 0.006 } },
        explain:
          '10/3 = 3,333… = 3,(3). Làm tròn đến hàng phần mười: chữ số bên phải là 3, nhỏ hơn 5 nên giữ nguyên, được 3,3 m. ' +
          'Lỗi hay gặp là viết 3,33 hoặc 3,4; 3,33 đã làm tròn đến hàng phần trăm chứ không phải hàng phần mười.',
      },
    ],
    srsCards: [
      {
        hoi: 'Khi nào phân số tối giản (mẫu dương) viết được thành số thập phân hữu hạn?',
        dap: 'Khi mẫu chỉ có ước nguyên tố 2 hoặc 5. Nếu còn ước nguyên tố khác thì là số thập phân vô hạn tuần hoàn.',
      },
      {
        hoi: 'Chu kì của số thập phân vô hạn tuần hoàn là gì? Ví dụ.',
        dap: 'Là nhóm chữ số lặp lại mãi, viết trong ngoặc tròn. Ví dụ 5/6 = 0,8(3) có chu kì 3.',
      },
      {
        hoi: 'Quy tắc làm tròn số?',
        dap: 'Nhìn chữ số ngay bên phải hàng làm tròn: nhỏ hơn 5 thì giữ nguyên hàng đó, từ 5 trở lên thì cộng thêm 1; rồi bỏ các chữ số bên phải.',
      },
      {
        hoi: 'Làm tròn đến hàng phần mười ứng với độ chính xác bao nhiêu?',
        dap: 'Độ chính xác 0,05 (nửa đơn vị của hàng phần mười).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan7-c2-b2',
    grade: '7',
    chapterNumber: 2,
    chapterTitle: 'Số thực',
    lessonNumber: 2,
    title: 'Số vô tỉ và căn bậc hai số học',
    hook:
      'Bác Ba có mảnh vườn hình vuông rộng 169 m² và muốn rào hết xung quanh. Cạnh vườn dài bao nhiêu? Em thử 13 m: ' +
      '13·13 = 169, đúng ngay. Nhưng nếu mảnh vườn rộng 2 m² thì sao? Không số nguyên, không phân số nào nhân với chính nó ra 2, ' +
      'và ta gặp một loại số mới. Bài này giới thiệu căn bậc hai và số vô tỉ.',
    theory:
      'CĂN BẬC HAI SỐ HỌC\n' +
      'Căn bậc hai số học của số a ≥ 0 là số x không âm sao cho x² = a. Kí hiệu √a. Ví dụ √25 = 5 vì 5 ≥ 0 và 5² = 25; √0 = 0; ' +
      '√(4/9) = 2/3; √0,81 = 0,9.\n' +
      'Số âm không có căn bậc hai số học: bình phương của mọi số đều không âm nên không có số nào bình phương bằng −4.\n' +
      'Chú ý: có hai số có bình phương bằng 9 là 3 và −3, nhưng căn bậc hai SỐ HỌC của 9 chỉ là số không âm: √9 = 3.\n' +
      'Tính chất cần nhớ: √a·√a = a (a ≥ 0) và √(a²) = a với a ≥ 0. Các số chính phương: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169…\n\n' +
      'SỐ VÔ TỈ\n' +
      'Số thập phân vô hạn KHÔNG tuần hoàn gọi là số vô tỉ; tập hợp số vô tỉ kí hiệu là I. Ví dụ √2 = 1,41421356…, ' +
      'π = 3,14159265… Người ta chứng minh được (em sẽ học ở các lớp sau) rằng √2 không viết được dưới dạng phân số, nên là số vô tỉ. ' +
      'Nói chung, nếu số tự nhiên a không phải số chính phương thì √a là số vô tỉ.\n' +
      'VÌ SAO có số vô tỉ? Hình vuông có diện tích 2 m² thì cạnh của nó có bình phương bằng 2. Cạnh đó có thật (ta đo được xấp xỉ 1,414 m), ' +
      'nhưng giá trị chính xác không viết được bằng số hữu tỉ.\n' +
      'Số vô tỉ khác số hữu tỉ ở chỗ: số hữu tỉ có số thập phân hữu hạn hoặc vô hạn tuần hoàn; số vô tỉ thì dài vô tận và không lặp.\n\n' +
      'TÍNH VÀ ƯỚC LƯỢNG CĂN BẬC HAI\n' +
      'Dùng máy tính cầm tay bấm phím √ rồi làm tròn kết quả. Ví dụ √2 ≈ 1,414 (làm tròn đến hàng phần nghìn); √5 ≈ 2,236.\n' +
      'Ước lượng không cần máy tính: kẹp giữa hai số chính phương. Vì 4 < 5 < 9 nên 2 < √5 < 3.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Viết √16 = ±4. Sai, căn bậc hai số học chỉ lấy giá trị không âm: √16 = 4.\n' +
      '— Cộng căn: √(9 + 16) = √9 + √16 = 7. Sai! √25 = 5. Căn của một tổng KHÔNG bằng tổng các căn.\n' +
      '— Nhầm 3,14 với π: 3,14 là số hữu tỉ, chỉ là giá trị gần đúng của π.\n' +
      '— Cho rằng số thập phân có nhiều chữ số là số vô tỉ: 0,(45) vô hạn nhưng tuần hoàn nên vẫn là số hữu tỉ.',
    workedExample: {
      problem:
        'Tính √49 + √(25/16) − √0,81. Sau đó ước lượng √20 rồi dùng máy tính làm tròn đến hàng phần trăm.',
      steps: [
        'Tính từng căn: √49 = 7 vì 7² = 49; √(25/16) = 5/4 vì (5/4)² = 25/16; √0,81 = 0,9 vì 0,9² = 0,81.',
        'Đưa về số thập phân: 5/4 = 1,25.',
        'Tính: 7 + 1,25 − 0,9 = 7,35.',
        'Ước lượng √20: vì 16 < 20 < 25 nên 4 < √20 < 5.',
        'Bấm máy tính: √20 = 4,4721… làm tròn đến hàng phần trăm (chữ số bên phải là 2, nhỏ hơn 5) được 4,47. Số này nằm giữa 4 và 5, khớp với ước lượng.',
      ],
      answer: '7,35; và √20 ≈ 4,47.',
    },
    checkQuestions: [
      {
        prompt: 'Trong các số sau, số nào là số vô tỉ?',
        choices: [
          { id: 'a', label: '√49' },
          { id: 'b', label: '0,(45)' },
          { id: 'c', label: '√5' },
          { id: 'd', label: '−2,75' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Vì 5 không phải số chính phương nên √5 = 2,2360… là số thập phân vô hạn không tuần hoàn, tức số vô tỉ. Còn √49 = 7, ' +
          '0,(45) là vô hạn tuần hoàn và −2,75 là hữu hạn nên đều là số hữu tỉ. Lỗi hay gặp là thấy dấu căn hoặc dấu ba chấm là kết luận số vô tỉ.',
      },
      {
        prompt: 'Tính giá trị của √(36 + 64).',
        answer: { kind: 'numeric', value: 10 },
        explain:
          'Cộng trong căn trước: 36 + 64 = 100 và √100 = 10. Lỗi hay gặp là tách thành √36 + √64 = 6 + 8 = 14; ' +
          'căn của một tổng không bằng tổng các căn, vì vậy 14 sai.',
      },
      {
        prompt:
          'Dùng máy tính cầm tay tính √7, rồi làm tròn kết quả đến hàng phần trăm. Nhập dưới dạng số thập phân.',
        answer: { kind: 'numeric', value: 2.65, tolerance: { mode: 'absolute', eps: 0.006 } },
        explain:
          '√7 = 2,6457… Chữ số thứ ba sau dấu phẩy là 5 nên làm tròn lên: 2,65. Có thể kiểm tra: vì 4 < 7 < 9 nên 2 < √7 < 3, ' +
          'và 2,65² ≈ 7,02 rất gần 7. Lỗi hay gặp là cắt cụt thành 2,64 mà không làm tròn.',
      },
      {
        prompt:
          'Bác Ba có mảnh vườn hình vuông diện tích 169 m². Bác rào kín xung quanh vườn thì hàng rào dài bao nhiêu mét?',
        answer: { kind: 'numeric', value: 52 },
        explain:
          'Cạnh vườn là √169 = 13 m, vì 13² = 169. Chu vi hình vuông bằng 4 cạnh: 4·13 = 52 m. Lỗi hay gặp là dừng ở 13 (chỉ tính một cạnh) ' +
          'hoặc lấy 169 : 4 mà quên rằng diện tích là bình phương của cạnh.',
      },
    ],
    srsCards: [
      {
        hoi: 'Căn bậc hai số học của số a ≥ 0 là gì?',
        dap: 'Là số x không âm sao cho x² = a, kí hiệu √a. Ví dụ √9 = 3 (không phải ±3).',
      },
      {
        hoi: 'Số vô tỉ là gì? Cho ví dụ.',
        dap: 'Là số thập phân vô hạn không tuần hoàn, ví dụ √2 = 1,41421356… và π = 3,14159265…',
      },
      {
        hoi: 'Vì sao √(9 + 16) khác √9 + √16?',
        dap: '√(9 + 16) = √25 = 5, còn √9 + √16 = 3 + 4 = 7. Căn của một tổng không bằng tổng các căn.',
      },
      {
        hoi: 'Cách ước lượng căn bậc hai không cần máy tính?',
        dap: 'Kẹp số dưới dấu căn giữa hai số chính phương liên tiếp: vì 16 < 20 < 25 nên 4 < √20 < 5.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan7-c2-b3',
    grade: '7',
    chapterNumber: 2,
    chapterTitle: 'Số thực',
    lessonNumber: 3,
    title: 'Tập hợp các số thực và giá trị tuyệt đối',
    hook:
      'Đêm qua nhiệt độ ở Sa Pa xuống −3,5 °C, còn trưa nay lên tới 8,5 °C. Muốn biết nhiệt độ đã chênh lệch bao nhiêu độ, ' +
      'em không quan tâm số nào lớn hơn, chỉ cần "khoảng cách" giữa hai số trên trục số. Khoảng cách luôn là số không âm, ' +
      'và đó chính là ý nghĩa của giá trị tuyệt đối. Bài này gom số hữu tỉ và số vô tỉ vào một tập hợp chung gọi là số thực.',
    theory:
      'TẬP HỢP CÁC SỐ THỰC\n' +
      'Số hữu tỉ và số vô tỉ gộp lại thành tập hợp các số thực, kí hiệu ℝ. Như vậy ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ và các số vô tỉ cũng thuộc ℝ. ' +
      'Mọi số thực đều viết được dưới dạng số thập phân: hữu hạn, vô hạn tuần hoàn, hoặc vô hạn không tuần hoàn.\n' +
      'TRỤC SỐ THỰC: mỗi số thực được biểu diễn bởi một điểm trên trục số, và mỗi điểm trên trục số biểu diễn một số thực. ' +
      'VÌ SAO phải có số vô tỉ? Nếu chỉ có số hữu tỉ thì trục số còn nhiều "lỗ hổng" (như điểm ứng với √2); số vô tỉ lấp đầy các lỗ hổng đó, ' +
      'nên ta gọi trục số là trục số thực. Điểm ứng với √2 nằm giữa 1,41 và 1,42.\n\n' +
      'SO SÁNH HAI SỐ THỰC\n' +
      '— Số dương > 0 > số âm.\n' +
      '— Hai số dương: so sánh phần nguyên, rồi lần lượt các chữ số thập phân từ trái sang phải; hoặc dùng căn: nếu 0 ≤ a < b thì √a < √b.\n' +
      '— Hai số âm: số nào có giá trị tuyệt đối lớn hơn thì nhỏ hơn.\n' +
      'Số đối của số thực x là −x; số đối của √2 là −√2; x + (−x) = 0.\n\n' +
      'GIÁ TRỊ TUYỆT ĐỐI\n' +
      'Giá trị tuyệt đối của số thực x, kí hiệu |x|, là khoảng cách từ điểm x đến gốc 0 trên trục số. Cụ thể: |x| = x nếu x ≥ 0 và |x| = −x nếu x < 0.\n' +
      'Ví dụ |3,5| = 3,5; |−3,5| = 3,5; |0| = 0; |−√2| = √2.\n' +
      'Tính chất: |x| ≥ 0 với mọi x; |x| = |−x|; |x| = 0 khi và chỉ khi x = 0. Nếu |x| = a với a > 0 thì x = a hoặc x = −a (có hai số cách gốc 0 một khoảng a). ' +
      'Khoảng cách giữa hai điểm x và y trên trục số là |x − y|.\n' +
      'VÌ SAO |x| không bao giờ âm? Vì nó là khoảng cách, mà khoảng cách không âm. Nếu x âm thì phải đổi dấu để được số dương.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Cho rằng |−5| = −5, hoặc |x| = x với mọi x. Sai: nếu x < 0 thì |x| = −x.\n' +
      '— Viết −|−3| = 3. Sai, |−3| = 3 trước rồi mới đổi dấu nên −|−3| = −3.\n' +
      '— Bỏ dấu giá trị tuyệt đối mà không xét dấu của biểu thức bên trong: |3 − 7| = |−4| = 4, không phải 3 − 7 = −4.\n' +
      '— Coi |a + b| = |a| + |b|: |2 + (−5)| = 3 còn |2| + |−5| = 7.\n' +
      '— Tìm x biết |x| = a mà chỉ ghi một nghiệm.',
    workedExample: {
      problem: 'Sắp xếp các số sau theo thứ tự tăng dần: √5; −2,3; |−2|; −√3; 0,(6).',
      steps: [
        'Tính giá trị tuyệt đối: |−2| = 2.',
        'Ước lượng các căn: √5 = 2,236… và √3 = 1,732…, suy ra −√3 = −1,732…',
        'Số âm: −2,3 và −√3 = −1,732… Hai số âm: |−2,3| = 2,3 > 1,732… nên −2,3 < −√3.',
        'Số dương: 0,(6) = 0,666…; |−2| = 2; √5 = 2,236… Sắp xếp 0,666… < 2 < 2,236…',
        'Gộp: số âm nhỏ hơn số dương, nên −2,3 < −√3 < 0,(6) < |−2| < √5.',
      ],
      answer: '−2,3 < −√3 < 0,(6) < |−2| < √5.',
    },
    checkQuestions: [
      {
        prompt: 'Khẳng định nào sau đây đúng?',
        choices: [
          { id: 'a', label: '|−7| = −7' },
          { id: 'b', label: '|x| ≥ 0 với mọi số thực x' },
          { id: 'c', label: '|x| = x với mọi số thực x' },
          { id: 'd', label: '−|−3| = 3' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          '|x| là khoảng cách từ x đến 0 nên luôn không âm, vậy chọn b. Câu a sai vì |−7| = 7; câu c sai khi x âm (|−2| = 2 ≠ −2); ' +
          'câu d sai vì |−3| = 3 rồi đổi dấu ra −3. Lỗi hay gặp là tưởng giá trị tuyệt đối chỉ "bỏ dấu" mà không xét dấu ở bên trong.',
      },
      {
        prompt: 'Tính giá trị của biểu thức |−5| − |3 − 7|.',
        answer: { kind: 'numeric', value: 1 },
        explain:
          '|−5| = 5; 3 − 7 = −4 nên |3 − 7| = 4; vậy 5 − 4 = 1. Lỗi hay gặp là viết |3 − 7| = 3 − 7 = −4 rồi tính 5 − (−4) = 9: ' +
          'quên rằng giá trị tuyệt đối của số âm phải đổi thành số dương.',
      },
      {
        prompt: 'Chọn cách so sánh đúng giữa −√3 và −1,7.',
        choices: [
          { id: 'a', label: '−√3 < −1,7' },
          { id: 'b', label: '−√3 > −1,7' },
          { id: 'c', label: '−√3 = −1,7' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          '√3 = 1,732… lớn hơn 1,7 nên |−√3| > |−1,7|. Với hai số âm, số có giá trị tuyệt đối lớn hơn thì nhỏ hơn, vậy −√3 < −1,7. ' +
          'Lỗi hay gặp là so sánh như số dương rồi kết luận −√3 > −1,7; hoặc cho rằng căn bậc hai làm tròn 1,7 là bằng nhau.',
      },
      {
        prompt:
          'Đêm qua nhiệt độ ở Sa Pa là −3,5 °C, trưa nay là 8,5 °C. Nhiệt độ đã chênh lệch bao nhiêu độ C? ' +
          '(Dùng |x − y|, nhập số không âm.)',
        answer: { kind: 'numeric', value: 12 },
        explain:
          'Chênh lệch bằng khoảng cách trên trục số: |8,5 − (−3,5)| = |12| = 12 độ. Lỗi hay gặp là tính 8,5 − 3,5 = 5, ' +
          'tức bỏ qua dấu âm của −3,5; nhiệt độ âm nằm ở phía bên kia gốc 0 nên phải cộng hai khoảng cách 3,5 và 8,5.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tập hợp số thực ℝ gồm những số nào?',
        dap: 'Gồm số hữu tỉ và số vô tỉ. ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ.',
      },
      {
        hoi: 'Giá trị tuyệt đối |x| định nghĩa thế nào?',
        dap: '|x| = x nếu x ≥ 0 và |x| = −x nếu x < 0; là khoảng cách từ x đến 0 trên trục số, luôn không âm.',
      },
      {
        hoi: 'Nếu |x| = a với a > 0 thì x bằng bao nhiêu?',
        dap: 'x = a hoặc x = −a (hai số cách gốc 0 một khoảng a).',
      },
      {
        hoi: 'Cách so sánh hai số thực âm?',
        dap: 'Số nào có giá trị tuyệt đối lớn hơn thì nhỏ hơn. Ví dụ −√3 < −1,7 vì √3 > 1,7.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
