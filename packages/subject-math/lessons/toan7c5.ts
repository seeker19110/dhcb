// lessons/toan7c5.ts — Toán 7, Chương 5: Thu thập và biểu diễn dữ liệu.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN7_C5_LESSONS: MathLesson[] = [
  {
    id: 'toan7-c5-b1',
    grade: '7',
    chapterNumber: 5,
    chapterTitle: 'Thu thập và biểu diễn dữ liệu',
    lessonNumber: 1,
    title: 'Thu thập, phân loại và đánh giá tính hợp lí của dữ liệu',
    hook:
      'Câu lạc bộ bóng đá của trường muốn biết "môn thể thao nào được học sinh cả trường yêu thích nhất" để xin kinh phí mua dụng cụ. ' +
      'Bạn Nam hỏi 30 thành viên ngay trong câu lạc bộ và báo cáo: "100% các bạn thích bóng đá!". ' +
      'Bạn Lan nghi ngờ con số này. Theo em, Lan nghi ngờ có đúng không, và nên thu thập dữ liệu thế nào cho đáng tin? ' +
      'Bài này giúp em phân loại dữ liệu và đánh giá xem dữ liệu có hợp lí hay không.',
    theory:
      'DỮ LIỆU ĐỊNH TÍNH VÀ DỮ LIỆU ĐỊNH LƯỢNG\n' +
      'Dữ liệu là thông tin thu thập được về các đối tượng. Có hai loại chính:\n' +
      '— Dữ liệu định tính: không phải là số, thường là tên gọi hay tính chất. Ví dụ: màu sắc yêu thích, môn thể thao, quê quán.\n' +
      '— Dữ liệu định lượng: là số, có thể đếm hoặc đo. Ví dụ: số anh chị em ruột, chiều cao, điểm kiểm tra. ' +
      'Dữ liệu định lượng đếm được (1; 2; 3…) gọi là dữ liệu rời rạc; dữ liệu đo được (như chiều cao 1,52 m) gọi là dữ liệu liên tục.\n' +
      'VÌ SAO phải phân loại? Mỗi loại dữ liệu hợp với một cách biểu diễn khác nhau (cột, quạt tròn, đoạn thẳng…), chọn sai thì biểu đồ khó đọc.\n\n' +
      'CÁCH THU THẬP DỮ LIỆU\n' +
      '— Thu thập trực tiếp: tự quan sát, đo đạc, phỏng vấn, phát phiếu hỏi.\n' +
      '— Thu thập gián tiếp: lấy từ sách báo, cổng thông tin thống kê, internet, cơ sở dữ liệu có sẵn.\n' +
      'Trước khi thu thập cần xác định rõ: khảo sát đối tượng nào, hỏi điều gì (tiêu chí).\n\n' +
      'ĐÁNH GIÁ TÍNH HỢP LÍ CỦA DỮ LIỆU\n' +
      'Một bộ dữ liệu hợp lí khi thoả mãn các điều kiện sau:\n' +
      '1) Đúng tiêu chí và có ý nghĩa thực tế: số giờ ngủ một đêm không thể là 25 giờ, chiều cao học sinh không thể là −3 cm.\n' +
      '2) Có tính đại diện: nhóm được hỏi phải đại diện cho cả đối tượng cần khảo sát. Muốn biết sở thích của cả trường thì phải hỏi đủ các khối, cả nam lẫn nữ, không chỉ hỏi người trong câu lạc bộ.\n' +
      '3) Số liệu khớp với nhau: các tần số cộng lại đúng bằng tổng số đối tượng; các tỉ lệ phần trăm cộng lại đúng 100%.\n' +
      'VÌ SAO cần kiểm tra? Một số liệu sai hay một mẫu lệch sẽ kéo theo kết luận sai cho cả cuộc khảo sát.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Hỏi nhóm bạn thân hoặc một nhóm quá nhỏ rồi kết luận cho cả trường (mất tính đại diện).\n' +
      '— Bỏ qua giá trị vô lí như tuổi 120, số giờ ngủ 25 giờ.\n' +
      '— Các tỉ lệ phần trăm cộng lại lớn hơn hoặc nhỏ hơn 100% mà không phát hiện ra.\n' +
      '— Nhầm "số nhà", "số điện thoại" là dữ liệu định lượng: dù ghi bằng chữ số, ta không cộng trừ chúng nên đây là dữ liệu định tính.',
    workedExample: {
      problem:
        'Lớp 7A muốn biết loại nước uống nào được học sinh toàn trường (khối 6 đến khối 9) ưa thích. ' +
        'Bạn Minh phát phiếu cho 30 bạn trong lớp 7A. Bạn Hoa chọn ngẫu nhiên mỗi khối 10 bạn, cả nam lẫn nữ, tổng 40 bạn. ' +
        'Hãy phân loại dữ liệu "loại nước uống yêu thích" và cho biết cách của bạn nào hợp lí hơn.',
      steps: [
        'Loại nước uống (trà sữa, nước cam, nước lọc…) thể hiện bằng chữ nên là dữ liệu định tính.',
        'Đối tượng cần khảo sát là học sinh toàn trường gồm bốn khối.',
        'Cách của Minh: chỉ hỏi bạn trong lớp 7A, tức chỉ có khối 7, nên không đại diện cho các khối còn lại.',
        'Cách của Hoa: lấy đủ cả bốn khối, mỗi khối 10 bạn, có cả nam và nữ nên có tính đại diện cao hơn.',
        'Kiểm tra số liệu: tổng các tần số thu được phải bằng 40 (với Hoa) hoặc 30 (với Minh).',
        'Kết luận: cách của Hoa hợp lí hơn.',
      ],
      answer:
        'Dữ liệu định tính. Cách của Hoa hợp lí hơn vì mẫu khảo sát có đủ cả bốn khối nên có tính đại diện.',
    },
    checkQuestions: [
      {
        prompt: 'Dữ liệu nào sau đây là dữ liệu định lượng?',
        choices: [
          { id: 'a', label: 'Môn học yêu thích của các bạn trong lớp' },
          { id: 'b', label: 'Chiều cao (cm) của các bạn trong lớp' },
          { id: 'c', label: 'Màu áo của các bạn trong lớp' },
          { id: 'd', label: 'Quê quán của các bạn trong lớp' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Chiều cao là số đo được nên là dữ liệu định lượng. Môn học, màu áo, quê quán thể hiện bằng chữ nên là dữ liệu định tính. ' +
          'Lỗi hay gặp là nhầm vì thấy chữ "cm" hay chữ số xuất hiện ở đâu đó rồi gọi cả bộ dữ liệu là số.',
      },
      {
        prompt:
          'Để biết môn học yêu thích của toàn bộ học sinh khối 7 (gồm 8 lớp), cách thu thập nào có tính đại diện nhất?',
        choices: [
          { id: 'a', label: 'Chỉ hỏi 5 bạn ngồi cùng bàn với em' },
          { id: 'b', label: 'Chỉ hỏi các bạn trong câu lạc bộ Toán' },
          { id: 'c', label: 'Chọn ngẫu nhiên một số bạn ở cả 8 lớp, có cả nam và nữ' },
          { id: 'd', label: 'Chỉ hỏi các bạn lớp trưởng' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Muốn kết luận cho cả khối thì nhóm được hỏi phải có mặt ở mọi lớp và cả nam lẫn nữ. Hỏi bạn cùng bàn, câu lạc bộ Toán hay các lớp trưởng ' +
          'đều chỉ phản ánh một nhóm nhỏ, dễ lệch. Lỗi hay gặp là chỉ hỏi những người tiện nhất rồi kết luận cho tất cả.',
      },
      {
        prompt:
          'Một bảng khảo sát về món ăn sáng yêu thích cho biết tỉ lệ phần trăm: phở 35%, bún 28%, xôi 12%, bánh mì còn lại. ' +
          'Để tổng các tỉ lệ bằng 100%, bánh mì chiếm bao nhiêu phần trăm?',
        answer: { kind: 'numeric', value: 25 },
        explain:
          'Tổng các tỉ lệ phải bằng 100%. Ba món đầu chiếm 35 + 28 + 12 = 75 (%), nên bánh mì chiếm 100 − 75 = 25 (%). ' +
          'Lỗi hay gặp là cộng nhầm hoặc quên rằng toàn bộ các phần trong khảo sát phải cộng đủ 100%.',
      },
      {
        prompt:
          'Số giờ ngủ mỗi đêm của 7 bạn được ghi lại: 8; 9; 7; 25; 8; −2; 9 (đơn vị giờ). ' +
          'Có bao nhiêu giá trị KHÔNG hợp lí?',
        answer: { kind: 'numeric', value: 2 },
        explain:
          'Một đêm chỉ có 24 giờ nên 25 giờ là vô lí; số giờ ngủ không thể âm nên −2 cũng vô lí. Vậy có 2 giá trị không hợp lí, cần kiểm tra lại trước khi thống kê. ' +
          'Lỗi hay gặp là chỉ để ý một giá trị bất thường mà bỏ sót giá trị còn lại.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phân biệt dữ liệu định tính và dữ liệu định lượng.',
        dap: 'Định tính: không phải là số (màu sắc, môn học). Định lượng: là số đếm hoặc đo được (chiều cao, điểm số).',
      },
      {
        hoi: 'Thu thập trực tiếp và thu thập gián tiếp khác nhau thế nào?',
        dap: 'Trực tiếp: tự quan sát, đo đạc, phỏng vấn, phát phiếu. Gián tiếp: lấy từ sách báo, internet, cơ sở dữ liệu có sẵn.',
      },
      {
        hoi: 'Một bộ dữ liệu hợp lí cần đạt những điều kiện nào?',
        dap: 'Đúng tiêu chí và có ý nghĩa thực tế; có tính đại diện; số liệu khớp nhau (tổng tần số bằng số đối tượng, tổng phần trăm bằng 100%).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan7-c5-b2',
    grade: '7',
    chapterNumber: 5,
    chapterTitle: 'Thu thập và biểu diễn dữ liệu',
    lessonNumber: 2,
    title: 'Biểu đồ hình quạt tròn',
    hook:
      'Mẹ bạn Hà ghi chi tiêu cả tháng 6 triệu đồng vào một hình tròn: nửa hình tròn là tiền ăn uống, một phần năm là tiền học, ' +
      'phần còn lại chia cho đi lại và các khoản khác. Chỉ cần nhìn kích thước từng "miếng bánh", Hà biết ngay khoản nào tốn nhất. ' +
      'Đó là biểu đồ hình quạt tròn. Bài này dạy em đọc biểu đồ này, tính số lượng từ tỉ lệ phần trăm và ngược lại.',
    theory:
      'BIỂU ĐỒ HÌNH QUẠT TRÒN LÀ GÌ?\n' +
      'Biểu đồ hình quạt tròn biểu diễn tỉ lệ của các phần so với toàn thể. Cả hình tròn là toàn thể, ứng với 100% (hay 360°). ' +
      'Mỗi phần là một hình quạt: hình quạt càng lớn thì phần đó càng chiếm tỉ lệ cao. Mỗi hình quạt thường được ghi tỉ lệ phần trăm và chú thích tên loại.\n' +
      'VÌ SAO dùng biểu đồ này? Khi muốn so sánh "mỗi phần chiếm bao nhiêu trong cả khối", nhìn các miếng của hình tròn nhanh hơn đọc cả bảng số.\n\n' +
      'ĐỌC BIỂU ĐỒ\n' +
      'Ví dụ biểu đồ ghi lại cách 200 học sinh đi đến trường, mô tả bằng lời: xe đạp 25% (một phần tư hình tròn), đi bộ 15%, xe buýt 20%, ' +
      'được đưa đón bằng xe máy hoặc ô tô 40% (phần lớn nhất). Từ đó ta kết luận cách được lựa chọn nhiều nhất là phần có hình quạt lớn nhất.\n' +
      'Điều kiện kiểm tra: tổng các tỉ lệ phần trăm trên biểu đồ phải bằng 100% (25 + 15 + 20 + 40 = 100).\n\n' +
      'TÍNH TOÁN VỚI TỈ LỆ PHẦN TRĂM\n' +
      '— Số lượng của một phần = tổng số · tỉ lệ phần trăm : 100. Ví dụ 200 học sinh, xe đạp 25% thì có 200 · 25 : 100 = 50 học sinh.\n' +
      '— Tỉ lệ phần trăm của một phần = số lượng của phần đó : tổng số · 100%.\n' +
      '— Góc ở tâm của hình quạt = tỉ lệ phần trăm · 3,6° (vì 360° ứng với 100%). Ví dụ 25% ứng với góc 90°.\n' +
      'Muốn vẽ biểu đồ: tính tỉ lệ từng phần, đổi ra góc ở tâm, dùng compa vẽ hình tròn và thước đo góc để chia các hình quạt.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Quên rằng tổng các phần là 100% nên đọc thiếu hoặc thừa một phần.\n' +
      '— Lấy tỉ lệ phần trăm làm số lượng (hiểu "25%" là 25 người), trong khi phải nhân với tổng số rồi chia 100.\n' +
      '— So sánh số lượng của hai khảo sát chỉ dựa vào tỉ lệ: 25% của 200 học sinh là 50 bạn, nhưng 25% của 1000 học sinh là 250 bạn.',
    workedExample: {
      problem:
        'Khảo sát 400 học sinh về thể loại phim yêu thích. Biểu đồ hình quạt tròn cho biết: hoạt hình 35%, hành động 25%, hài 22%, ' +
        'khoa học viễn tưởng chiếm phần còn lại. Hãy tính tỉ lệ của khoa học viễn tưởng, số học sinh mỗi loại và góc ở tâm của hình quạt "hành động".',
      steps: [
        'Tổng các tỉ lệ phải bằng 100%: 35 + 25 + 22 = 82 (%), nên khoa học viễn tưởng chiếm 100 − 82 = 18 (%).',
        'Hoạt hình: 400 · 35 : 100 = 140 học sinh.',
        'Hành động: 400 · 25 : 100 = 100 học sinh.',
        'Hài: 400 · 22 : 100 = 88 học sinh.',
        'Khoa học viễn tưởng: 400 · 18 : 100 = 72 học sinh.',
        'Kiểm tra: 140 + 100 + 88 + 72 = 400, đúng bằng tổng số học sinh được hỏi.',
        'Góc ở tâm của hình quạt "hành động" là 25 · 3,6° = 90°.',
      ],
      answer:
        'Khoa học viễn tưởng 18%. Số học sinh: hoạt hình 140, hành động 100, hài 88, khoa học viễn tưởng 72. Góc hình quạt "hành động" là 90°.',
    },
    checkQuestions: [
      {
        prompt:
          'Biểu đồ hình quạt tròn biểu diễn 240 học sinh khối 7 chọn câu lạc bộ: bóng đá 30%, cờ vua 25%, văn nghệ 20%, ' +
          'mĩ thuật là phần còn lại. Hình quạt "mĩ thuật" chiếm bao nhiêu phần trăm?',
        answer: { kind: 'numeric', value: 25 },
        explain:
          'Cả biểu đồ là 100%. Ba phần đã biết chiếm 30 + 25 + 20 = 75 (%), nên mĩ thuật chiếm 100 − 75 = 25 (%). ' +
          'Lỗi hay gặp là quên rằng tổng các hình quạt phải đúng 100% nên cộng nhầm hoặc bỏ sót một phần.',
      },
      {
        prompt:
          'Cũng với biểu đồ trên (240 học sinh, bóng đá 30%), có bao nhiêu học sinh chọn câu lạc bộ bóng đá?',
        answer: { kind: 'numeric', value: 72 },
        explain:
          'Số học sinh = 240 · 30 : 100 = 72. Lỗi hay gặp là lấy luôn 30 làm số học sinh vì thấy "30%", ' +
          'trong khi phải nhân tỉ lệ với tổng số học sinh rồi chia cho 100.',
      },
      {
        prompt:
          'Một hình quạt của biểu đồ hình quạt tròn có góc ở tâm 90°. Hình quạt đó chiếm bao nhiêu phần trăm cả hình tròn?',
        answer: { kind: 'numeric', value: 25 },
        explain:
          'Cả hình tròn ứng với 360° tức 100%. Do đó 90° chiếm 90 : 360 · 100% = 25% (một phần tư hình tròn). ' +
          'Lỗi hay gặp là nhầm 90° với 90%, quên rằng hình tròn có 360° chứ không phải 100°.',
      },
      {
        prompt:
          'Bộ ba tỉ lệ nào có thể là tỉ lệ các hình quạt của MỘT biểu đồ hình quạt tròn đầy đủ?',
        choices: [
          { id: 'a', label: '40%; 35%; 30%' },
          { id: 'b', label: '50%; 30%; 20%' },
          { id: 'c', label: '45%; 25%; 20%' },
          { id: 'd', label: '60%; 30%; 20%' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Tổng các tỉ lệ của một biểu đồ hình quạt tròn đầy đủ phải bằng 100%. Chỉ có 50 + 30 + 20 = 100. ' +
          'Các bộ còn lại cho tổng 105%, 90% và 110% nên không hợp lí. Lỗi hay gặp là chỉ nhìn từng số mà không cộng kiểm tra.',
      },
    ],
    srsCards: [
      {
        hoi: 'Biểu đồ hình quạt tròn dùng để làm gì?',
        dap: 'Biểu diễn tỉ lệ các phần so với toàn thể. Cả hình tròn ứng với 100% (360°); hình quạt càng lớn thì tỉ lệ càng cao.',
      },
      {
        hoi: 'Cách tính số lượng của một phần khi biết tổng số và tỉ lệ phần trăm?',
        dap: 'Số lượng = tổng số · tỉ lệ phần trăm : 100.',
      },
      {
        hoi: 'Góc ở tâm của hình quạt ứng với p% là bao nhiêu độ?',
        dap: 'Bằng p · 3,6 độ vì cả hình tròn 360° ứng với 100%. Ví dụ 25% ứng với 90°.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan7-c5-b3',
    grade: '7',
    chapterNumber: 5,
    chapterTitle: 'Thu thập và biểu diễn dữ liệu',
    lessonNumber: 3,
    title: 'Biểu đồ đoạn thẳng',
    hook:
      'Nhiệt độ trung bình ở Hà Nội thay đổi theo từng tháng: tháng Giêng lạnh, tháng Sáu tháng Bảy nóng nhất rồi lại dịu dần. ' +
      'Nếu chấm mỗi tháng một điểm ứng với nhiệt độ rồi nối các điểm bằng các đoạn thẳng, ta có một đường "lên xuống" cho thấy cả năm nóng lạnh ra sao. ' +
      'Đó là biểu đồ đoạn thẳng. Bài này dạy em đọc biểu đồ này để nhận ra xu hướng tăng, giảm của dữ liệu theo thời gian.',
    theory:
      'BIỂU ĐỒ ĐOẠN THẲNG LÀ GÌ?\n' +
      'Biểu đồ đoạn thẳng dùng để biểu diễn sự thay đổi của một đại lượng theo thời gian. Trục ngang ghi mốc thời gian (ngày, tháng, năm); ' +
      'trục dọc ghi giá trị của đại lượng (nhiệt độ, cân nặng, số ly bán được…). Mỗi mốc thời gian ứng với một điểm; các điểm liên tiếp nối với nhau bằng các đoạn thẳng.\n' +
      'VÌ SAO dùng đoạn thẳng nối các điểm? Để mắt ta thấy ngay giá trị đang đi lên, đi xuống hay giữ nguyên.\n\n' +
      'CÁCH ĐỌC BIỂU ĐỒ\n' +
      '— Đọc giá trị: từ điểm trên biểu đồ gióng sang trục dọc để đọc giá trị, gióng xuống trục ngang để biết mốc thời gian.\n' +
      '— Đoạn thẳng đi lên (từ trái sang phải): giá trị tăng. Đoạn đi xuống: giá trị giảm. Đoạn nằm ngang: giá trị không đổi.\n' +
      '— Đoạn càng dốc thì giá trị thay đổi càng nhanh.\n' +
      '— Mức tăng (giảm) giữa hai mốc liền nhau = giá trị sau − giá trị trước (số dương là tăng, số âm là giảm).\n\n' +
      'MÔ TẢ MỘT BIỂU ĐỒ BẰNG LỜI\n' +
      'Nhiệt độ trung bình theo tháng của một thành phố (làm tròn, đơn vị °C), từ tháng 1 đến tháng 12: 17; 18; 21; 25; 28; 30; 30; 29; 28; 25; 21; 18. ' +
      'Nhìn vào biểu đồ: từ tháng 1 đến tháng 6, các đoạn thẳng đi lên (nóng dần); từ tháng 6 sang tháng 7 đoạn nằm ngang (không đổi, cùng 30 °C); ' +
      'từ tháng 7 đến tháng 12 đoạn đi xuống (mát dần). Tháng 6 và tháng 7 nóng nhất.\n\n' +
      'KHI NÀO DÙNG BIỂU ĐỒ ĐOẠN THẲNG?\n' +
      'Dùng khi dữ liệu thay đổi theo thời gian (chiều cao của một bạn qua các năm, doanh thu theo tháng). ' +
      'Nếu chỉ so sánh các loại với nhau (món ăn yêu thích) thì dùng biểu đồ cột; nếu muốn xem tỉ lệ các phần trong cả khối thì dùng biểu đồ hình quạt tròn.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Đọc ngược chiều: quên rằng thời gian chạy từ trái sang phải.\n' +
      '— Tính mức thay đổi bằng cách lấy giá trị lớn trừ giá trị nhỏ mà không để ý đó là tăng hay giảm.\n' +
      '— Nhầm đoạn nằm ngang là "bằng 0" trong khi nó nghĩa là giá trị giữ nguyên (không đổi) tại mức nào đó.',
    workedExample: {
      problem:
        'Cân nặng của bé Mai theo tháng tuổi (kg): lúc sinh 3,2; 1 tháng 4,2; 2 tháng 5,1; 3 tháng 5,9; 4 tháng 6,5; 5 tháng 6,9. ' +
        'Hãy mô tả xu hướng trên biểu đồ đoạn thẳng và cho biết bé tăng cân nhiều nhất trong tháng nào.',
      steps: [
        'Trục ngang là tháng tuổi (0 đến 5), trục dọc là cân nặng (kg). Các điểm liên tiếp nối với nhau bằng đoạn thẳng.',
        'Mức tăng từng tháng: 4,2 − 3,2 = 1,0; 5,1 − 4,2 = 0,9; 5,9 − 5,1 = 0,8; 6,5 − 5,9 = 0,6; 6,9 − 6,5 = 0,4 (kg).',
        'Tất cả các mức đều dương nên các đoạn thẳng đều đi lên: cân nặng của bé tăng liên tục.',
        'Mức tăng lớn nhất là 1,0 kg ở tháng đầu tiên, ứng với đoạn dốc nhất.',
        'Các mức tăng nhỏ dần nên các đoạn thẳng thoải dần: bé vẫn tăng cân nhưng chậm lại.',
      ],
      answer:
        'Cân nặng tăng liên tục nhưng chậm dần; tháng đầu tiên (từ 0 đến 1 tháng tuổi) tăng nhiều nhất, 1,0 kg.',
    },
    checkQuestions: [
      {
        prompt:
          'Nhiệt độ trung bình của một thành phố là 25 °C ở tháng 4 và 30 °C ở tháng 6. Từ tháng 4 đến tháng 6, nhiệt độ tăng bao nhiêu độ C?',
        answer: { kind: 'numeric', value: 5 },
        explain:
          'Mức thay đổi = giá trị sau − giá trị trước = 30 − 25 = 5 (°C), là số dương nên nhiệt độ tăng. ' +
          'Lỗi hay gặp là lấy nhầm giá trị trước trừ giá trị sau hoặc đọc nhầm hai mốc thời gian.',
      },
      {
        prompt:
          'Theo dãy nhiệt độ các tháng 1 đến 12 (°C): 17; 18; 21; 25; 28; 30; 30; 29; 28; 25; 21; 18, ' +
          'nhiệt độ giảm liên tục trong khoảng thời gian nào?',
        choices: [
          { id: 'a', label: 'Từ tháng 1 đến tháng 6' },
          { id: 'b', label: 'Từ tháng 6 đến tháng 7' },
          { id: 'c', label: 'Từ tháng 7 đến tháng 12' },
          { id: 'd', label: 'Từ tháng 3 đến tháng 5' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Từ tháng 7 (30 °C) đến tháng 12 (18 °C), mỗi tháng nhiệt độ đều thấp hơn tháng trước nên các đoạn thẳng đi xuống. ' +
          'Từ tháng 1 đến 6 nhiệt độ tăng; từ tháng 6 sang 7 giữ nguyên 30 °C. Lỗi hay gặp là nhầm đoạn nằm ngang với đoạn đi xuống.',
      },
      {
        prompt:
          'Số ly trà sữa quán bán được từ thứ Hai đến thứ Sáu là: 80; 95; 70; 110; 125. ' +
          'Giữa hai ngày liên tiếp, mức TĂNG lớn nhất là bao nhiêu ly?',
        answer: { kind: 'numeric', value: 40 },
        explain:
          'Các thay đổi liên tiếp: +15, −25, +40, +15. Mức tăng lớn nhất là +40 ly, từ thứ Tư (70 ly) sang thứ Năm (110 ly), ứng với đoạn dốc lên nhất. ' +
          'Lỗi hay gặp là lấy 125 − 70 = 55, trong khi hai ngày đó không liên tiếp.',
      },
      {
        prompt:
          'Muốn thể hiện sự thay đổi chiều cao của một bạn qua từng năm từ lớp 1 đến lớp 7, nên dùng loại biểu đồ nào?',
        choices: [
          { id: 'a', label: 'Biểu đồ hình quạt tròn' },
          { id: 'b', label: 'Biểu đồ đoạn thẳng' },
          { id: 'c', label: 'Chỉ cần liệt kê tên các môn học' },
          { id: 'd', label: 'Biểu đồ nào cũng thể hiện được xu hướng theo thời gian như nhau' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Dữ liệu thay đổi theo thời gian thì biểu đồ đoạn thẳng cho thấy rõ xu hướng tăng, giảm. Biểu đồ hình quạt tròn chỉ cho tỉ lệ các phần ở một thời điểm. ' +
          'Lỗi hay gặp là chọn loại biểu đồ chỉ vì quen thuộc, không xem dữ liệu có gắn với thời gian hay không.',
      },
    ],
    srsCards: [
      {
        hoi: 'Biểu đồ đoạn thẳng dùng để làm gì?',
        dap: 'Biểu diễn sự thay đổi của một đại lượng theo thời gian; trục ngang là thời gian, trục dọc là giá trị.',
      },
      {
        hoi: 'Đoạn thẳng đi lên, đi xuống, nằm ngang cho biết điều gì?',
        dap: 'Đi lên: giá trị tăng. Đi xuống: giá trị giảm. Nằm ngang: giá trị không đổi.',
      },
      {
        hoi: 'Cách tính mức tăng, giảm giữa hai mốc liền nhau?',
        dap: 'Lấy giá trị sau trừ giá trị trước; dương là tăng, âm là giảm.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
