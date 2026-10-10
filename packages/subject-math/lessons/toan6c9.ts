// lessons/toan6c9.ts — Toán 6, Chương 9: Dữ liệu và xác suất thực nghiệm.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN6_C9_LESSONS: MathLesson[] = [
  {
    id: 'toan6-c9-b1',
    grade: '6',
    chapterNumber: 9,
    chapterTitle: 'Dữ liệu và xác suất thực nghiệm',
    lessonNumber: 1,
    title: 'Thu thập, phân loại dữ liệu và bảng thống kê',
    hook:
      'Cô giáo chủ nhiệm muốn tổ chức một giải thể thao cho lớp 6A (40 bạn) nhưng chưa biết nên chọn môn nào. ' +
      'Cô nhờ lớp trưởng đi hỏi từng bạn "môn thể thao yêu thích của bạn là gì?" rồi ghi lại. ' +
      'Danh sách dài 40 dòng rất khó đọc, nên các bạn lập bảng thống kê để nhìn ra ngay môn nào được thích nhất. ' +
      'Bài này dạy cách thu thập, phân loại và tổng hợp dữ liệu như vậy.',
    theory:
      'DỮ LIỆU VÀ CÁC LOẠI DỮ LIỆU\n' +
      'Thông tin thu thập được về các đối tượng gọi là dữ liệu. Có hai loại hay gặp:\n' +
      '— Dữ liệu là số (số liệu): có thể đếm hoặc đo, như số anh chị em ruột, chiều cao, điểm kiểm tra.\n' +
      '— Dữ liệu không phải là số: thể hiện bằng chữ, như màu sắc yêu thích, môn thể thao, tên món ăn.\n\n' +
      'THU THẬP DỮ LIỆU\n' +
      'Ta có thể thu thập dữ liệu bằng nhiều cách: quan sát trực tiếp, phỏng vấn, lập phiếu hỏi, hoặc tra từ ' +
      'sách báo và internet. Cần ghi rõ tiêu chí (đối tượng nào, hỏi điều gì) để dữ liệu thống nhất.\n\n' +
      'TÍNH HỢP LÍ CỦA DỮ LIỆU\n' +
      'Dữ liệu phải đúng với tiêu chí khảo sát và có ý nghĩa thực tế. Ví dụ khi hỏi tuổi của học sinh lớp 6, ' +
      'các giá trị 11, 12, 11, 12 hợp lí; nhưng giá trị 120 là không hợp lí (có thể ghi nhầm), cần kiểm tra lại. ' +
      'VÌ SAO phải kiểm tra? Một giá trị sai sẽ làm cả bảng thống kê và kết luận bị lệch.\n\n' +
      'BẢNG THỐNG KÊ\n' +
      'Sau khi thu thập, ta phân loại dữ liệu theo từng giá trị và đếm số lần xuất hiện của mỗi giá trị. ' +
      'Số lần đó gọi là tần số. Có thể kiểm đếm bằng cách vạch gạch: cứ 4 gạch đứng thì gạch chéo thành một nhóm 5 để đếm cho nhanh.\n' +
      'Bảng thống kê gồm một cột là các giá trị (loại dữ liệu) và một cột là tần số tương ứng. Ví dụ: Bóng đá: 15 bạn; ' +
      'Cầu lông: 10 bạn; Bơi: 8 bạn; Cờ vua: 7 bạn.\n' +
      'Kiểm tra quan trọng: tổng các tần số phải bằng tổng số đối tượng đã điều tra (15 + 10 + 8 + 7 = 40 bạn).\n\n' +
      'LỖI HAY GẶP\n' +
      '— Đếm sót hoặc đếm trùng nên tổng tần số khác số đối tượng điều tra.\n' +
      '— Quên gạch chéo khi kiểm đếm nên đếm nhầm 4 thành 5.\n' +
      '— Không kiểm tra tính hợp lí: để lọt giá trị vô lí như tuổi 120 vào bảng.\n' +
      '— Nhầm dữ liệu số với không phải số: "màu yêu thích" là chữ, còn "số anh chị em ruột" là số.',
    workedExample: {
      problem:
        'Hỏi 20 bạn về màu yêu thích (X: xanh, Đ: đỏ, V: vàng), kết quả ghi lần lượt: ' +
        'X, Đ, X, V, Đ, X, X, V, Đ, X, Đ, X, V, X, Đ, X, X, Đ, V, X. Hãy lập bảng thống kê và cho biết màu nào được thích nhất.',
      steps: [
        'Đây là dữ liệu không phải là số (màu sắc), nên ta phân loại theo từng màu: xanh, đỏ, vàng.',
        'Đếm màu xanh (X): có 10 lần.',
        'Đếm màu đỏ (Đ): có 6 lần.',
        'Đếm màu vàng (V): có 4 lần.',
        'Kiểm tra: 10 + 6 + 4 = 20, đúng bằng số bạn được hỏi nên không đếm sót hay trùng.',
        'Nhận xét: màu xanh có tần số lớn nhất (10 bạn) nên được thích nhất.',
      ],
      answer: 'Xanh: 10 bạn, Đỏ: 6 bạn, Vàng: 4 bạn (tổng 20). Màu xanh được thích nhất.',
    },
    checkQuestions: [
      {
        prompt: 'Dữ liệu nào sau đây là dữ liệu là số?',
        choices: [
          { id: 'a', label: 'Màu sắc yêu thích của bạn' },
          { id: 'b', label: 'Môn thể thao yêu thích của bạn' },
          { id: 'c', label: 'Số anh chị em ruột của bạn' },
          { id: 'd', label: 'Tên món ăn bạn thích nhất' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Số anh chị em ruột là kết quả đếm, thể hiện bằng số nên là dữ liệu là số. Màu sắc, môn thể thao và tên món ăn đều thể hiện bằng chữ ' +
          'nên là dữ liệu không phải là số. Lỗi hay gặp là thấy bài khảo sát có "con số" ở đâu đó là gọi nhầm cả khảo sát là dữ liệu số.',
      },
      {
        prompt:
          'Khảo sát 40 bạn về loại quả thích nhất, thu được: Cam 7 bạn, Xoài 12 bạn, Ổi 9 bạn, Bưởi 5 bạn, ' +
          'còn lại là Chuối. Có bao nhiêu bạn thích Chuối?',
        answer: { kind: 'numeric', value: 7 },
        explain:
          'Tổng các tần số phải bằng 40. Bốn loại quả đầu có 7 + 12 + 9 + 5 = 33 bạn, nên số bạn thích Chuối là 40 − 33 = 7. ' +
          'Lỗi hay gặp là cộng sai, hoặc quên rằng tổng tần số phải bằng đúng số đối tượng điều tra.',
      },
      {
        prompt:
          'Tuổi của 5 bạn lớp 6 được ghi lại như sau: 11, 12, 11, 120, 12. Giá trị nào KHÔNG hợp lí?',
        choices: [
          { id: 'a', label: '11' },
          { id: 'b', label: '12' },
          { id: 'c', label: '120' },
          { id: 'd', label: 'Cả ba giá trị đều hợp lí' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Học sinh lớp 6 thường 11 đến 12 tuổi nên 120 là vô lí, có thể do ghi nhầm (ví dụ gõ thừa chữ số 0 vào số 12). ' +
          'Cần kiểm tra lại giá trị này trước khi lập bảng. Lỗi hay gặp là bỏ qua việc kiểm tra tính hợp lí của dữ liệu.',
      },
      {
        prompt:
          'Kết quả khảo sát 40 bạn lớp 6A về môn thể thao yêu thích: Bóng đá 15 bạn, Cầu lông 10 bạn, Bơi 8 bạn, ' +
          'Cờ vua 7 bạn. Có bao nhiêu bạn KHÔNG thích bóng đá nhất?',
        answer: { kind: 'numeric', value: 25 },
        explain:
          'Tổng số bạn là 40, trong đó 15 bạn thích bóng đá nhất nên số bạn còn lại là 40 − 15 = 25 (bạn). Cách khác: 10 + 8 + 7 = 25. ' +
          'Lỗi hay gặp là chỉ lấy số của một môn khác (ví dụ 10) hoặc quên các môn còn lại.',
      },
    ],
    srsCards: [
      {
        hoi: 'Hai loại dữ liệu hay gặp là gì?',
        dap: 'Dữ liệu là số (đếm hoặc đo được, như chiều cao) và dữ liệu không phải là số (như màu sắc, tên môn học).',
      },
      {
        hoi: 'Tần số của một giá trị là gì?',
        dap: 'Là số lần giá trị đó xuất hiện trong dữ liệu thu thập được.',
      },
      {
        hoi: 'Kiểm tra bảng thống kê có đếm đúng hay không bằng cách nào?',
        dap: 'Tổng các tần số phải bằng tổng số đối tượng đã điều tra.',
      },
      {
        hoi: 'Khi nào dữ liệu không hợp lí?',
        dap: 'Khi giá trị vô lí so với thực tế hoặc không đúng tiêu chí, như tuổi học sinh lớp 6 là 120. Cần kiểm tra lại.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan6-c9-b2',
    grade: '6',
    chapterNumber: 9,
    chapterTitle: 'Dữ liệu và xác suất thực nghiệm',
    lessonNumber: 2,
    title: 'Biểu đồ tranh, biểu đồ cột và biểu đồ cột kép',
    hook:
      'Thư viện trường dán một tờ giấy lớn: mỗi hình quyển sách nhỏ ứng với 20 cuốn sách cho mượn trong ngày. ' +
      'Chỉ cần liếc nhìn xem hàng nào nhiều hình hơn, em biết ngay thứ mấy có nhiều bạn mượn sách. ' +
      'Biểu đồ giúp ta so sánh số liệu nhanh hơn bảng số. Bài này dạy em đọc và tính toán từ ba loại biểu đồ: tranh, cột và cột kép.',
    theory:
      'BIỂU ĐỒ TRANH\n' +
      'Biểu đồ tranh dùng các hình (biểu tượng) để thể hiện số liệu. Mỗi hình ứng với một số đơn vị cố định, ghi ở chú giải. ' +
      'Nửa hình ứng với nửa số đơn vị đó. Ví dụ mỗi hình quyển sách là 20 cuốn: 3 hình rưỡi là 3 · 20 + 10 = 70 cuốn.\n\n' +
      'BIỂU ĐỒ CỘT\n' +
      'Biểu đồ cột có hai trục: trục ngang ghi các đối tượng (lớp, tháng, môn thể thao), trục dọc có các vạch chia ghi số liệu. ' +
      'Chiều cao mỗi cột cho biết số liệu của đối tượng đó: dóng từ đỉnh cột sang trục dọc để đọc giá trị. ' +
      'Cột càng cao thì số liệu càng lớn.\n' +
      'Hai bước đọc quan trọng: (1) xem mỗi khoảng chia trên trục dọc ứng với bao nhiêu đơn vị; (2) lấy số khoảng nhân với giá trị mỗi khoảng. ' +
      'Ví dụ cột cao 4 khoảng, mỗi khoảng 5 bạn thì có 4 · 5 = 20 bạn.\n\n' +
      'BIỂU ĐỒ CỘT KÉP\n' +
      'Biểu đồ cột kép đặt hai cột cạnh nhau cho mỗi đối tượng, thường tô hai màu khác nhau, để so sánh hai nhóm hoặc hai thời điểm ' +
      '(ví dụ số bạn nam và số bạn nữ mỗi lớp). Phần chú giải cho biết cột màu nào ứng với nhóm nào. ' +
      'VÌ SAO dùng cột kép? Hai cột đứng sát nhau nên mắt so sánh được ngay hai nhóm trong cùng một đối tượng.\n\n' +
      'CÁCH MÔ TẢ BIỂU ĐỒ BẰNG LỜI\n' +
      'Khi nhận xét, nêu rõ biểu đồ nói về điều gì, đối tượng nào có số liệu lớn nhất (nhỏ nhất), hai nhóm hơn kém nhau bao nhiêu, ' +
      'và tính thêm tổng hoặc hiệu nếu đề hỏi.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Đọc nhầm vạch chia: coi mỗi vạch là 1 đơn vị trong khi thực tế mỗi vạch là 5 hoặc 10 đơn vị.\n' +
      '— Quên chú giải: không biết mỗi hình ứng với bao nhiêu, hoặc nhầm màu cột của hai nhóm.\n' +
      '— Quên đếm nửa hình trong biểu đồ tranh.\n' +
      '— Chỉ so sánh chiều cao một cột thay vì so hai cột cùng đối tượng.',
    workedExample: {
      problem:
        'Biểu đồ cột kép cho số học sinh nam và nữ của bốn lớp khối 6: Lớp 6A: nam 18, nữ 22; Lớp 6B: nam 20, nữ 19; ' +
        'Lớp 6C: nam 17, nữ 24; Lớp 6D: nam 21, nữ 17. a) Lớp nào có nhiều học sinh nhất? b) Cả khối có bao nhiêu học sinh nữ?',
      steps: [
        'Tính sĩ số từng lớp bằng cách cộng hai cột: 6A: 18 + 22 = 40; 6B: 20 + 19 = 39; 6C: 17 + 24 = 41; 6D: 21 + 17 = 38.',
        'So sánh bốn sĩ số 40, 39, 41, 38: lớn nhất là 41 nên lớp 6C đông nhất.',
        'Số học sinh nữ của cả khối: 22 + 19 + 24 + 17 = 82 (học sinh).',
        'Kiểm tra bằng số nam: 18 + 20 + 17 + 21 = 76; 82 + 76 = 158 = 40 + 39 + 41 + 38, khớp.',
      ],
      answer: 'a) Lớp 6C (41 học sinh); b) 82 học sinh nữ.',
    },
    checkQuestions: [
      {
        prompt:
          'Biểu đồ tranh thể hiện số sách thư viện cho mượn, mỗi hình quyển sách ứng với 20 cuốn. ' +
          'Thứ Hai có 3 hình rưỡi (tức 3 hình đầy và nửa hình), thứ Ba có 5 hình đầy. ' +
          'Tổng số sách cho mượn trong hai ngày này là bao nhiêu cuốn?',
        answer: { kind: 'numeric', value: 170 },
        explain:
          'Thứ Hai: 3 hình đầy là 3 · 20 = 60 cuốn, nửa hình là 10 cuốn nên được 70 cuốn. Thứ Ba: 5 · 20 = 100 cuốn. Tổng 70 + 100 = 170 cuốn. ' +
          'Lỗi hay gặp là quên tính nửa hình (được 160) hoặc coi mỗi hình là 1 cuốn (được 9).',
      },
      {
        prompt:
          'Biểu đồ cột cho số bạn tham gia câu lạc bộ. Trục dọc chia khoảng, mỗi khoảng ứng với 5 bạn. ' +
          'Cột của câu lạc bộ Cờ vua cao 4 khoảng, cột của câu lạc bộ Bóng đá cao 6 khoảng. ' +
          'Bóng đá nhiều hơn Cờ vua bao nhiêu bạn?',
        answer: { kind: 'numeric', value: 10 },
        explain:
          'Cờ vua có 4 · 5 = 20 bạn, Bóng đá có 6 · 5 = 30 bạn, nên hơn nhau 30 − 20 = 10 bạn. ' +
          'Lỗi hay gặp là chỉ lấy hiệu số khoảng (6 − 4 = 2) mà quên nhân với 5.',
      },
      {
        prompt:
          'Biểu đồ cột kép về số bạn nam (cột xanh) và nữ (cột cam) của ba câu lạc bộ: ' +
          'Bóng đá: nam 20, nữ 6; Cầu lông: nam 12, nữ 14; Cờ vua: nam 7, nữ 10. ' +
          'Ở câu lạc bộ nào số bạn nữ nhiều hơn số bạn nam nhiều nhất?',
        choices: [
          { id: 'a', label: 'Bóng đá' },
          { id: 'b', label: 'Cầu lông' },
          { id: 'c', label: 'Cờ vua' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Hiệu nữ trừ nam: Bóng đá 6 − 20 = −14 (nữ ít hơn), Cầu lông 14 − 12 = 2, Cờ vua 10 − 7 = 3. Cờ vua có nữ hơn nam nhiều nhất (3 bạn). ' +
          'Lỗi hay gặp là chọn câu lạc bộ có cột nữ cao nhất (Cầu lông, 14) chứ không so sánh hai cột trong cùng một nhóm.',
      },
      {
        prompt:
          'Dùng số liệu ba câu lạc bộ ở câu trên (Bóng đá: nam 20, nữ 6; Cầu lông: nam 12, nữ 14; Cờ vua: nam 7, nữ 10). ' +
          'Tổng số bạn tham gia cả ba câu lạc bộ là bao nhiêu?',
        answer: { kind: 'numeric', value: 69 },
        explain:
          'Số bạn mỗi câu lạc bộ: Bóng đá 20 + 6 = 26, Cầu lông 12 + 14 = 26, Cờ vua 7 + 10 = 17. Tổng 26 + 26 + 17 = 69 bạn. ' +
          'Lỗi hay gặp là chỉ cộng các cột của một nhóm (nam hoặc nữ) hoặc bỏ sót một câu lạc bộ.',
      },
    ],
    srsCards: [
      {
        hoi: 'Khi đọc biểu đồ cột, hai điều đầu tiên cần xem là gì?',
        dap: 'Mỗi khoảng chia trên trục dọc ứng với bao nhiêu đơn vị, và chú giải (tên trục, màu cột).',
      },
      {
        hoi: 'Biểu đồ tranh: nửa hình ứng với bao nhiêu?',
        dap: 'Một nửa số đơn vị mà một hình đầy biểu thị.',
      },
      {
        hoi: 'Biểu đồ cột kép dùng để làm gì?',
        dap: 'So sánh hai nhóm (hoặc hai thời điểm) trong cùng mỗi đối tượng, bằng hai cột đặt cạnh nhau.',
      },
      {
        hoi: 'Lỗi nào hay gặp nhất khi đọc biểu đồ cột?',
        dap: 'Coi mỗi vạch chia là 1 đơn vị trong khi nó có thể là 5 hay 10 đơn vị; luôn nhân số khoảng với giá trị mỗi khoảng.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan6-c9-b3',
    grade: '6',
    chapterNumber: 9,
    chapterTitle: 'Dữ liệu và xác suất thực nghiệm',
    lessonNumber: 3,
    title: 'Kết quả có thể, sự kiện và xác suất thực nghiệm',
    hook:
      'Trước trận bóng giao hữu, hai đội tung đồng xu để chọn đội giao bóng: ngửa thì đội An giao, sấp thì đội Bình giao. ' +
      'Không ai đoán trước được mặt nào sẽ xuất hiện. Nhưng nếu tung đồng xu 40 lần và ghi lại, ta sẽ thấy mặt ngửa xuất hiện ' +
      'bao nhiêu lần, và từ đó nói được "khả năng" ra ngửa lớn hay nhỏ. Bài này dạy cách tính khả năng đó từ kết quả thực nghiệm.',
    theory:
      'KẾT QUẢ CÓ THỂ CỦA MỘT PHÉP THỬ\n' +
      'Khi ta thực hiện một hành động mà không đoán chắc trước được kết quả (tung đồng xu, gieo xúc xắc, rút một thẻ từ hộp), ' +
      'mỗi kết quả có thể xảy ra gọi là một kết quả có thể. Ví dụ: tung đồng xu có 2 kết quả có thể là mặt sấp (S) hoặc mặt ngửa (N); ' +
      'gieo một con xúc xắc có 6 kết quả có thể là các mặt 1, 2, 3, 4, 5, 6 chấm; rút một thẻ từ hộp 10 thẻ đánh số từ 1 đến 10 có 10 kết quả có thể.\n\n' +
      'SỰ KIỆN\n' +
      'Sự kiện là một điều xảy ra ứng với một hoặc nhiều kết quả có thể. Ví dụ khi gieo xúc xắc, "mặt xuất hiện là số chẵn" gồm ba kết quả: ' +
      '2, 4, 6. Khi rút thẻ từ hộp 10 thẻ, "thẻ rút được ghi số chẵn" gồm 5 kết quả: 2, 4, 6, 8, 10.\n\n' +
      'XÁC SUẤT THỰC NGHIỆM\n' +
      'Thực hiện phép thử nhiều lần và ghi lại kết quả. Xác suất thực nghiệm của một sự kiện E là:\n' +
      '   (số lần sự kiện E xảy ra) / (tổng số lần thực hiện phép thử).\n' +
      'Ví dụ: tung đồng xu 40 lần, được mặt ngửa 22 lần. Xác suất thực nghiệm của sự kiện "mặt ngửa" là 22/40 = 11/20 = 0,55.\n' +
      'VÌ SAO gọi là "thực nghiệm"? Vì con số này tính từ lần thử THỰC TẾ em đã làm. Nếu em làm lại đợt khác, số lần ngửa có thể khác, ' +
      'nên xác suất thực nghiệm cũng có thể thay đổi một chút. Thử càng nhiều lần thì con số thường càng ổn định.\n' +
      'Xác suất thực nghiệm luôn là số từ 0 đến 1 (hoặc từ 0% đến 100%): bằng 0 nếu sự kiện chưa lần nào xảy ra, bằng 1 nếu lần nào cũng xảy ra.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Chia cho số kết quả có thể (2 hay 6) thay vì chia cho TỔNG SỐ LẦN thực hiện phép thử.\n' +
      '— Chia số lần xảy ra cho số lần KHÔNG xảy ra.\n' +
      '— Cho rằng đã tung 40 lần được 22 lần ngửa thì tung 100 lần chắc chắn được đúng 55 lần ngửa. Kết quả mỗi đợt vẫn có thể khác.\n' +
      '— Quên rút gọn hoặc viết xác suất lớn hơn 1 (số lần xảy ra không thể nhiều hơn tổng số lần thử).',
    workedExample: {
      problem:
        'Gieo một con xúc xắc 60 lần, số lần xuất hiện của từng mặt như sau: mặt 1: 9 lần, mặt 2: 11 lần, mặt 3: 10 lần, ' +
        'mặt 4: 8 lần, mặt 5: 14 lần, mặt 6: 8 lần. Tính xác suất thực nghiệm của các sự kiện: ' +
        'a) "xuất hiện mặt chẵn"; b) "xuất hiện mặt 5 chấm".',
      steps: [
        'Kiểm tra tổng số lần thực hiện: 9 + 11 + 10 + 8 + 14 + 8 = 60, đúng như đề bài.',
        'Sự kiện "mặt chẵn" gồm các mặt 2, 4, 6. Số lần xảy ra: 11 + 8 + 8 = 27.',
        'Xác suất thực nghiệm: 27/60 = 9/20 (rút gọn cho 3).',
        'Sự kiện "mặt 5 chấm" xảy ra 14 lần nên xác suất thực nghiệm là 14/60 = 7/30 (rút gọn cho 2).',
        'Lưu ý: mẫu số luôn là 60 (tổng số lần gieo), không phải 6 (số mặt xúc xắc).',
      ],
      answer: 'a) 9/20; b) 7/30.',
    },
    checkQuestions: [
      {
        prompt:
          'Một hộp có 10 thẻ đánh số từ 1 đến 10, rút một thẻ. Sự kiện nào sau đây gồm đúng 5 kết quả có thể?',
        choices: [
          { id: 'a', label: 'Thẻ rút được ghi số chẵn' },
          { id: 'b', label: 'Thẻ rút được ghi số chia hết cho 3' },
          { id: 'c', label: 'Thẻ rút được ghi số lớn hơn 7' },
          { id: 'd', label: 'Thẻ rút được ghi số nguyên tố' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Số chẵn từ 1 đến 10 là 2, 4, 6, 8, 10 gồm 5 kết quả. Số chia hết cho 3 chỉ có 3, 6, 9 (3 kết quả); số lớn hơn 7 có 8, 9, 10 (3 kết quả); ' +
          'số nguyên tố có 2, 3, 5, 7 (4 kết quả). Lỗi hay gặp là bỏ sót số 10 hoặc tính cả số 1 vào số nguyên tố.',
      },
      {
        prompt:
          'Tung một đồng xu 40 lần, được mặt ngửa 22 lần. Xác suất thực nghiệm của sự kiện "mặt ngửa", ' +
          'viết dưới dạng phân số tối giản, là bao nhiêu?',
        answer: { kind: 'fraction', num: 11, den: 20, requireSimplified: true },
        explain:
          'Xác suất thực nghiệm bằng số lần xảy ra chia tổng số lần thử: 22/40 = 11/20. Lỗi hay gặp là chia cho 2 (số mặt của đồng xu) ' +
          'được 22/2 = 11, kết quả vô lí vì lớn hơn 1.',
      },
      {
        prompt:
          'Nam gieo một con xúc xắc 50 lần, mặt 6 chấm xuất hiện 8 lần. Xác suất thực nghiệm của sự kiện ' +
          '"xuất hiện mặt 6 chấm" bằng bao nhiêu (viết dưới dạng số thập phân)?',
        answer: { kind: 'numeric', value: 0.16 },
        explain:
          'Xác suất thực nghiệm là 8/50 = 16/100 = 0,16. Mẫu số là tổng số lần gieo (50), không phải 6 mặt xúc xắc. ' +
          'Lỗi hay gặp là tính 8/6 hoặc 1/6, vì nhầm với số kết quả có thể.',
      },
      {
        prompt:
          'Tung một đồng xu 30 lần, biết xác suất thực nghiệm của sự kiện "mặt sấp" là 0,4. ' +
          'Mặt sấp xuất hiện bao nhiêu lần?',
        answer: { kind: 'numeric', value: 12 },
        explain:
          'Số lần mặt sấp bằng xác suất nhân tổng số lần thử: 0,4 · 30 = 12 lần. Kiểm tra lại: 12/30 = 0,4 đúng. ' +
          'Lỗi hay gặp là lấy 30 : 0,4 = 75, vô lí vì số lần xảy ra không thể nhiều hơn tổng số lần thử.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức xác suất thực nghiệm của sự kiện E?',
        dap: '(số lần E xảy ra) / (tổng số lần thực hiện phép thử).',
      },
      {
        hoi: 'Gieo một con xúc xắc có bao nhiêu kết quả có thể?',
        dap: '6 kết quả: các mặt 1, 2, 3, 4, 5, 6 chấm.',
      },
      {
        hoi: 'Xác suất thực nghiệm nằm trong khoảng nào?',
        dap: 'Từ 0 đến 1 (tức 0% đến 100%).',
      },
      {
        hoi: 'Vì sao nói đây là xác suất "thực nghiệm"?',
        dap: 'Vì tính từ kết quả các lần thử thực tế; làm lại đợt khác thì số liệu có thể khác nhau chút ít.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
