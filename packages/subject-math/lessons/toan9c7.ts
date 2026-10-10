// lessons/toan9c7.ts — Toán 9, Chương 7: Tần số và tần số tương đối.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN9_C7_LESSONS: MathLesson[] = [
  {
    id: 'toan9-c7-b1',
    grade: '9',
    chapterNumber: 7,
    chapterTitle: 'Tần số và tần số tương đối',
    lessonNumber: 1,
    title: 'Bảng tần số, tần số tương đối và biểu đồ',
    hook:
      'Cô chủ nhiệm lớp 9A vừa trả bài kiểm tra Toán và ghi điểm của cả 40 bạn lên bảng. Nhìn một dãy 40 con điểm lộn xộn, khó biết điểm nào nhiều bạn đạt nhất, ' +
      'hay có bao nhiêu phần trăm lớp đạt từ 8 điểm trở lên. Bảng tần số, tần số tương đối và các biểu đồ giúp em gom dữ liệu cho gọn và đọc ra điều đó chỉ trong vài giây.',
    theory:
      'TẦN SỐ\n' +
      'Khi thu thập dữ liệu (điểm kiểm tra, số quyển sách đã đọc, phương tiện đến trường…), ta thường gặp các giá trị lặp lại. Số lần một giá trị xuất hiện trong mẫu dữ liệu gọi là tần số của giá trị đó. ' +
      'Bảng liệt kê từng giá trị cùng tần số gọi là bảng tần số. Tổng các tần số bằng N, là tổng số lượng số liệu của cả mẫu.\n' +
      'Ví dụ điểm kiểm tra của 40 bạn lớp 9A: điểm 5: 3 bạn; điểm 6: 7 bạn; điểm 7: 12 bạn; điểm 8: 10 bạn; điểm 9: 6 bạn; điểm 10: 2 bạn. ' +
      'Kiểm tra: 3 + 7 + 12 + 10 + 6 + 2 = 40.\n\n' +
      'TẦN SỐ TƯƠNG ĐỐI\n' +
      'Tần số tương đối của một giá trị là tỉ số f = n/N, trong đó n là tần số của giá trị đó và N là tổng số lượng số liệu. Ta thường viết f dưới dạng phần trăm. Tổng các tần số tương đối bằng 100%.\n' +
      'Ví dụ: điểm 7 có f = 12/40 = 0,3 = 30%; điểm 5 có f = 3/40 = 7,5%. Cả bảng: điểm 5: 7,5%; điểm 6: 17,5%; điểm 7: 30%; điểm 8: 25%; điểm 9: 15%; điểm 10: 5%. Cộng lại đúng 100%.\n' +
      'VÌ SAO cần tần số tương đối? Tần số cho biết "có bao nhiêu bạn", còn tần số tương đối cho biết "chiếm bao nhiêu phần của cả mẫu". Nhờ vậy ta so sánh được hai mẫu có cỡ khác nhau: ' +
      '12 bạn trong 40 bạn (30%) khác hẳn 12 bạn trong 120 bạn (10%).\n\n' +
      'BIỂU ĐỒ\n' +
      '— Biểu đồ cột: trục ngang ghi các giá trị, mỗi giá trị một cột có chiều cao bằng tần số (hoặc tần số tương đối). Cột càng cao thì giá trị đó càng hay gặp.\n' +
      '— Biểu đồ hình quạt tròn: cả hình tròn là 100% mẫu, mỗi giá trị ứng với một hình quạt có góc ở tâm bằng f · 360°. ' +
      'Ví dụ điểm 7 chiếm 30% nên góc ở tâm là 0,3 · 360° = 108°. Tổng các góc ở tâm bằng 360°.\n' +
      'Biểu đồ cột hợp để so sánh các giá trị với nhau; biểu đồ hình quạt hợp để thấy mỗi giá trị chiếm bao nhiêu phần của cả mẫu (như phương tiện đến trường).\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhầm tần số n với tần số tương đối f: 12 bạn khác với 30%.\n' +
      '— Chia cho số giá trị khác nhau (6 loại điểm) thay vì chia cho tổng số lượng số liệu N (40 bạn).\n' +
      '— Tính góc ở tâm mà quên đổi phần trăm ra số thập phân: 30% · 360° phải tính là 0,3 · 360°.\n' +
      '— Cộng các tần số tương đối không được 100% mà không kiểm tra lại số liệu.',
    workedExample: {
      problem:
        'Hỏi 20 bạn lớp 9B về số quyển sách đã đọc trong tháng qua, được: 2; 1; 3; 2; 2; 4; 1; 2; 3; 2; 3; 1; 2; 4; 2; 3; 2; 1; 2; 3. ' +
        'a) Lập bảng tần số và bảng tần số tương đối. b) Tính góc ở tâm của mỗi hình quạt trong biểu đồ hình quạt tròn.',
      steps: [
        'Mẫu có N = 20 số liệu, các giá trị khác nhau là 1; 2; 3; 4 (quyển). Đếm lần lượt từng giá trị và gạch từng số đã đếm để khỏi sót.',
        'Tần số: 1 quyển có 4 bạn; 2 quyển có 9 bạn; 3 quyển có 5 bạn; 4 quyển có 2 bạn. Kiểm tra: 4 + 9 + 5 + 2 = 20 = N.',
        'Tần số tương đối f = n/20: 4/20 = 20%; 9/20 = 45%; 5/20 = 25%; 2/20 = 10%. Tổng 20% + 45% + 25% + 10% = 100%.',
        'Góc ở tâm bằng f · 360°: 0,2 · 360° = 72°; 0,45 · 360° = 162°; 0,25 · 360° = 90°; 0,1 · 360° = 36°.',
        'Kiểm tra: 72° + 162° + 90° + 36° = 360°, đúng một vòng tròn.',
      ],
      answer:
        'Tần số: 4; 9; 5; 2. Tần số tương đối: 20%; 45%; 25%; 10%. Góc ở tâm: 72°; 162°; 90°; 36°.',
    },
    checkQuestions: [
      {
        prompt:
          'Trong bài kiểm tra của 40 bạn, có 12 bạn được điểm 7. Tần số tương đối của điểm 7, tính theo phần trăm, bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 30 },
        explain:
          'Tần số tương đối f = 12/40 = 0,3 = 30%. ' +
          'Lỗi hay gặp là chia 12 cho 6 (số loại điểm) thay vì chia cho 40 bạn, hoặc dừng ở 0,3 mà không đổi sang phần trăm.',
      },
      {
        prompt:
          'Điểm kiểm tra của 40 bạn: điểm 5: 3 bạn; điểm 6: 7 bạn; điểm 7: 12 bạn; điểm 8: 10 bạn; điểm 9: 6 bạn; điểm 10: 2 bạn. Phát biểu nào sau đây đúng?',
        choices: [
          { id: 'a', label: 'Điểm 7 có tần số tương đối là 12%' },
          { id: 'b', label: 'Tổng các tần số bằng 100' },
          { id: 'c', label: 'Có 18 bạn đạt từ 8 điểm trở lên' },
          { id: 'd', label: 'Điểm 5 có tần số lớn nhất' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Số bạn đạt từ 8 điểm trở lên là 10 + 6 + 2 = 18 bạn (chiếm 45%), nên c đúng. ' +
          'Lỗi hay gặp là đáp án a, nhầm tần số 12 với tần số tương đối (đúng là 30%). Đáp án b sai vì tổng các tần số bằng 40 (tổng tần số tương đối mới bằng 100%); d sai vì điểm 7 (12 bạn) mới có tần số lớn nhất.',
      },
      {
        prompt:
          'Khảo sát phương tiện đến trường của 50 học sinh: xe đạp 22 bạn, đi bộ 14 bạn, xe buýt 9 bạn, số còn lại được phụ huynh đưa đón. Có bao nhiêu bạn được phụ huynh đưa đón?',
        answer: { kind: 'numeric', value: 5 },
        explain:
          'Tổng các tần số bằng N = 50. Ba nhóm đầu có 22 + 14 + 9 = 45 bạn, nên số bạn được đưa đón là 50 − 45 = 5. ' +
          'Lỗi hay gặp là quên rằng tổng tần số phải bằng 50 rồi tự đoán số còn lại.',
      },
      {
        prompt:
          'Trong 40 bạn của lớp, có 9 bạn thích môn bơi. Khi vẽ biểu đồ hình quạt tròn, hình quạt biểu diễn môn bơi có góc ở tâm bao nhiêu độ?',
        answer: { kind: 'numeric', value: 81 },
        explain:
          'Tần số tương đối là 9/40 = 22,5% = 0,225, nên góc ở tâm là 0,225 · 360° = 81°. ' +
          'Lỗi hay gặp là tính 22,5 · 360 (quên đổi phần trăm ra số thập phân) hoặc lấy 9 · 360 mà không chia cho 40.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tần số của một giá trị là gì? Tổng các tần số bằng bao nhiêu?',
        dap: 'Là số lần giá trị đó xuất hiện trong mẫu. Tổng các tần số bằng N, tổng số lượng số liệu của mẫu.',
      },
      {
        hoi: 'Công thức tần số tương đối? Tổng các tần số tương đối bằng bao nhiêu?',
        dap: 'f = n/N (thường viết thành phần trăm). Tổng các tần số tương đối bằng 100%.',
      },
      {
        hoi: 'Góc ở tâm của hình quạt trong biểu đồ hình quạt tròn tính thế nào?',
        dap: 'Bằng tần số tương đối nhân 360° (f · 360°). Tổng các góc ở tâm bằng 360°.',
      },
      {
        hoi: 'Vì sao dùng tần số tương đối để so sánh hai mẫu?',
        dap: 'Vì nó cho biết giá trị chiếm bao nhiêu phần của cả mẫu, nên so sánh được khi hai mẫu có cỡ N khác nhau.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan9-c7-b2',
    grade: '9',
    chapterNumber: 7,
    chapterTitle: 'Tần số và tần số tương đối',
    lessonNumber: 2,
    title: 'Bảng tần số, tần số tương đối ghép nhóm và biểu đồ',
    hook:
      'Đo chiều cao của 40 bạn nữ khối 9, ta được cả chục giá trị khác nhau như 148 cm, 151 cm, 153 cm, 157 cm… Nếu mỗi giá trị một dòng thì bảng rất dài và gần như dòng nào cũng chỉ có 1 hoặc 2 bạn. ' +
      'Khi đó ta gộp các giá trị gần nhau vào từng nhóm (từ 145 cm đến dưới 150 cm, từ 150 cm đến dưới 155 cm…) để bảng gọn lại mà vẫn thấy được xu hướng chung. Bài này dạy cách ghép nhóm và vẽ biểu đồ.',
    theory:
      'NHÓM VÀ QUY ƯỚC\n' +
      'Với dữ liệu nhận rất nhiều giá trị khác nhau (chiều cao, thời gian đi học, số giờ dùng điện thoại, nhiệt độ…), ta chia các giá trị thành các nhóm có dạng [a; b), gồm các giá trị x thỏa a ≤ x < b: lấy đầu mút trái a, KHÔNG lấy đầu mút phải b. ' +
      'Hiệu b − a gọi là độ rộng của nhóm. Các nhóm nối liền nhau, không chồng lấn và thường có độ rộng bằng nhau.\n' +
      'Quy ước: giá trị bằng đầu mút phải của một nhóm thì thuộc nhóm đứng sau. Ví dụ 160 cm thuộc nhóm [160; 165), không thuộc nhóm [155; 160).\n' +
      'VÌ SAO có quy ước này? Để mỗi số liệu rơi vào đúng MỘT nhóm. Nếu 160 thuộc cả hai nhóm thì bị đếm hai lần, còn nếu không thuộc nhóm nào thì bị bỏ sót.\n\n' +
      'CÁCH LẬP BẢNG GHÉP NHÓM\n' +
      '1) Tìm giá trị nhỏ nhất và giá trị lớn nhất của mẫu.\n' +
      '2) Chọn độ rộng và các đầu mút sao cho các nhóm phủ hết số liệu (giá trị lớn nhất phải nằm trong nhóm cuối cùng).\n' +
      '3) Đếm số lượng số liệu rơi vào mỗi nhóm, đó là tần số n của nhóm.\n' +
      '4) Tính tần số tương đối của nhóm f = n/N. Kiểm tra: tổng các n bằng N, tổng các f bằng 100%.\n' +
      'Ví dụ chiều cao 40 bạn nữ: [145; 150): 4 bạn; [150; 155): 10 bạn; [155; 160): 14 bạn; [160; 165): 8 bạn; [165; 170): 4 bạn (4 + 10 + 14 + 8 + 4 = 40). ' +
      'Tần số tương đối lần lượt là 10%; 25%; 35%; 20%; 10%.\n\n' +
      'BIỂU ĐỒ CỦA MẪU GHÉP NHÓM\n' +
      '— Biểu đồ cột: mỗi nhóm một cột, chiều cao bằng tần số (hoặc tần số tương đối) của nhóm. Cột cao nhất là nhóm có nhiều số liệu nhất, ở ví dụ trên là [155; 160).\n' +
      '— Biểu đồ đoạn thẳng: lấy giá trị đại diện của mỗi nhóm là trung điểm của nhóm (nhóm [155; 160) có giá trị đại diện 157,5), đánh dấu điểm có hoành độ là giá trị đại diện và tung độ là tần số (hoặc tần số tương đối), rồi nối các điểm liên tiếp bằng đoạn thẳng.\n' +
      'Đổi lại cho việc gọn là ta mất thông tin chi tiết: nhìn bảng ghép nhóm không biết bạn nào cao đúng bao nhiêu.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Xếp giá trị bằng đầu mút phải vào nhóm trước (xếp 160 vào [155; 160)).\n' +
      '— Chia nhóm chồng lấn, như [150; 156) và [155; 160), hoặc để hở, như [150; 154) và [155; 160).\n' +
      '— Tính tần số tương đối bằng cách chia cho số nhóm thay vì chia cho N.\n' +
      '— Bỏ sót số liệu nên tổng các tần số không bằng N.',
    workedExample: {
      problem:
        'Thời gian đi từ nhà đến trường (phút) của 20 bạn: 5; 12; 8; 15; 20; 10; 7; 18; 25; 14; 9; 11; 30; 6; 16; 22; 13; 10; 19; 24. ' +
        'Ghép vào các nhóm [0; 10), [10; 20), [20; 30), [30; 40) rồi lập bảng tần số và tần số tương đối ghép nhóm.',
      steps: [
        'Giá trị nhỏ nhất là 5, lớn nhất là 30. Vì 30 thuộc [30; 40) nên bốn nhóm đã phủ hết số liệu; N = 20.',
        'Nhóm [0; 10): các số 5; 8; 7; 9; 6, tức 5 bạn.',
        'Nhóm [10; 20): các số 12; 15; 10; 18; 14; 11; 16; 13; 10; 19, tức 10 bạn. Hai số 10 thuộc nhóm này vì bằng đầu mút trái.',
        'Nhóm [20; 30): các số 20; 25; 22; 24, tức 4 bạn. Số 20 thuộc nhóm này theo quy ước, không thuộc [10; 20).',
        'Nhóm [30; 40): chỉ có số 30, tức 1 bạn.',
        'Kiểm tra: 5 + 10 + 4 + 1 = 20 = N.',
        'Tần số tương đối: 5/20 = 25%; 10/20 = 50%; 4/20 = 20%; 1/20 = 5%. Tổng bằng 100%.',
      ],
      answer:
        '[0; 10): 5 bạn (25%); [10; 20): 10 bạn (50%); [20; 30): 4 bạn (20%); [30; 40): 1 bạn (5%).',
    },
    checkQuestions: [
      {
        prompt: 'Theo quy ước ghép nhóm, giá trị 160 (cm) thuộc nhóm nào?',
        choices: [
          { id: 'a', label: '[160; 165)' },
          { id: 'b', label: '[155; 160)' },
          { id: 'c', label: 'Thuộc cả hai nhóm [155; 160) và [160; 165)' },
          { id: 'd', label: 'Không thuộc nhóm nào trong hai nhóm trên' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Nhóm [a; b) lấy a mà không lấy b, giá trị bằng đầu mút phải thì thuộc nhóm sau, nên 160 thuộc [160; 165). ' +
          'Đáp án b là lỗi hay gặp khi xếp giá trị vào nhóm trước; c làm số liệu bị đếm hai lần.',
      },
      {
        prompt:
          'Chiều cao 40 bạn nữ được ghép nhóm: [145; 150): 4 bạn; [150; 155): 10 bạn; [155; 160): 14 bạn; [160; 165): 8 bạn; [165; 170): 4 bạn. Có bao nhiêu bạn cao từ 155 cm trở lên?',
        answer: { kind: 'numeric', value: 26 },
        explain:
          'Từ 155 cm trở lên gồm ba nhóm [155; 160), [160; 165), [165; 170): 14 + 8 + 4 = 26 bạn. ' +
          'Lỗi hay gặp là cộng cả nhóm [150; 155) (được 36 bạn) vì tưởng 155 thuộc nhóm đó.',
      },
      {
        prompt:
          'Với bảng chiều cao ở câu trên (cỡ mẫu 40), tần số tương đối của nhóm [155; 160), tính theo phần trăm, bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 35 },
        explain:
          'Nhóm [155; 160) có 14 bạn nên f = 14/40 = 0,35 = 35%. ' +
          'Lỗi hay gặp là chia 14 cho 5 (số nhóm) thay vì chia cho tổng số lượng số liệu 40.',
      },
      {
        prompt:
          'Khảo sát 50 học sinh về số giờ dùng điện thoại mỗi ngày, ghép nhóm có độ rộng 1 giờ. Nhóm [2; 3) có tần số tương đối 28%. Có bao nhiêu học sinh thuộc nhóm đó?',
        answer: { kind: 'numeric', value: 14 },
        explain:
          'Tần số của nhóm là n = f · N = 0,28 · 50 = 14 học sinh. ' +
          'Lỗi hay gặp là lấy 28 làm số học sinh, hoặc lấy 28% của 100 thay vì của cỡ mẫu 50.',
      },
    ],
    srsCards: [
      {
        hoi: 'Nhóm [a; b) gồm những giá trị nào? Độ rộng của nhóm là gì?',
        dap: 'Gồm các giá trị x với a ≤ x < b (lấy a, không lấy b). Độ rộng là b − a.',
      },
      {
        hoi: 'Quy ước khi một giá trị bằng đầu mút phải của nhóm?',
        dap: 'Giá trị đó thuộc nhóm đứng sau, để mỗi số liệu rơi vào đúng một nhóm.',
      },
      {
        hoi: 'Tần số và tần số tương đối của một nhóm?',
        dap: 'Tần số n là số lượng số liệu thuộc nhóm; tần số tương đối f = n/N. Tổng n bằng N, tổng f bằng 100%.',
      },
      {
        hoi: 'Hai loại biểu đồ của mẫu số liệu ghép nhóm?',
        dap: 'Biểu đồ cột (mỗi nhóm một cột) và biểu đồ đoạn thẳng (nối các điểm có hoành độ là giá trị đại diện của nhóm).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
