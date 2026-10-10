// lessons/toan8c5.ts — Toán 8, Chương 5: Dữ liệu và biểu đồ.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN8_C5_LESSONS: MathLesson[] = [
  {
    id: 'toan8-c5-b1',
    grade: '8',
    chapterNumber: 5,
    chapterTitle: 'Dữ liệu và biểu đồ',
    lessonNumber: 1,
    title: 'Thu thập, phân loại và tổ chức dữ liệu theo tiêu chí',
    hook:
      'Hội đồng học sinh muốn biết các bạn trong trường (1200 em) thường đi học bằng phương tiện gì để xin nhà trường mở thêm bãi gửi xe đạp. ' +
      'Một bạn đề nghị: "Chỉ cần hỏi 30 bạn đứng ở cổng trường sáng nay là đủ". Bạn khác phản đối: "Lỡ toàn các bạn đi xe máy điện thì sao?". ' +
      'Muốn kết luận đáng tin thì phải biết thu thập dữ liệu đúng cách, rồi phân loại, tổ chức dữ liệu theo tiêu chí rõ ràng. Bài này giúp em làm điều đó.',
    theory:
      'CÁC LOẠI DỮ LIỆU\n' +
      'Dữ liệu là thông tin thu thập được về các đối tượng. Ta phân loại theo bản chất:\n' +
      '— Dữ liệu định tính (không phải là số): thể hiện bằng chữ hoặc tên gọi, như màu mắt, môn học yêu thích, xếp loại học lực.\n' +
      '— Dữ liệu định lượng (là số): đếm hoặc đo được. Dữ liệu định lượng lại chia hai kiểu:\n' +
      '   + Rời rạc: chỉ nhận một số giá trị riêng lẻ, thường do ĐẾM, như số anh chị em ruột (0; 1; 2; 3), số học sinh của lớp.\n' +
      '   + Liên tục: có thể nhận mọi giá trị trong một khoảng, thường do ĐO, như chiều cao (cm), cân nặng (kg), thời gian chạy 100 m (giây).\n' +
      'VÌ SAO cần phân loại? Mỗi loại dữ liệu hợp với một cách tổ chức và một dạng biểu đồ riêng. Dữ liệu liên tục thường phải gộp thành các nhóm (khoảng) mới đếm được.\n\n' +
      'CÁCH THU THẬP DỮ LIỆU\n' +
      '— Trực tiếp: tự quan sát, đo đạc, phỏng vấn, lập phiếu hỏi.\n' +
      '— Gián tiếp: lấy từ nguồn có sẵn như sổ điểm, báo cáo của nhà trường, sách báo, internet.\n' +
      'Chọn cách nào tuỳ mục đích: muốn biết thành tích năm năm qua của trường thì tra hồ sơ có sẵn; muốn biết sở thích của lớp thì phát phiếu hỏi.\n\n' +
      'TÍNH ĐẠI DIỆN CỦA DỮ LIỆU\n' +
      'Khi không thể hỏi hết mọi đối tượng, ta chọn một nhóm nhỏ (mẫu). Mẫu phải đại diện: có đủ các nhóm của toàn thể (đủ khối lớp, nam và nữ, gần và xa trường) và chọn ngẫu nhiên, không thiên về một nhóm. ' +
      'VÌ SAO? Nếu chỉ hỏi bạn đứng ở cổng trường, ta bỏ sót các bạn đến sớm hoặc đến muộn nên kết luận có thể lệch.\n\n' +
      'TỔ CHỨC DỮ LIỆU THEO TIÊU CHÍ\n' +
      'Ta phân loại dữ liệu theo từng giá trị (hoặc từng nhóm) rồi đếm số lần xuất hiện, gọi là tần số, và ghi vào bảng thống kê. ' +
      'Với dữ liệu liên tục, chia các khoảng liền nhau, không chồng lên nhau, ví dụ "từ 1 đến dưới 2 giờ". ' +
      'Kiểm tra: tổng các tần số bằng tổng số đối tượng điều tra.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhầm "xếp loại" với số đo: học lực giỏi, khá, trung bình vẫn là dữ liệu định tính.\n' +
      '— Coi mọi dữ liệu có chữ số là định lượng liên tục: số anh chị em là dữ liệu rời rạc vì chỉ đếm được 0; 1; 2; ...\n' +
      '— Chọn mẫu thuận tiện (bạn thân, bạn cùng lớp) rồi kết luận cho cả trường.\n' +
      '— Chia nhóm chồng nhau hoặc hở, làm một số đối tượng bị đếm hai lần hoặc không được đếm.',
    workedExample: {
      problem:
        'Hỏi 25 bạn lớp 8B về số anh chị em ruột, kết quả: 1, 2, 1, 0, 1, 3, 2, 1, 1, 2, 0, 1, 2, 1, 1, 3, 1, 2, 1, 0, 2, 1, 1, 2, 1. ' +
        'a) Đây là dữ liệu loại nào? b) Lập bảng tần số. c) Có bao nhiêu phần trăm số bạn có từ 2 anh chị em ruột trở lên?',
      steps: [
        'Số anh chị em ruột là số do đếm được, chỉ nhận các giá trị 0; 1; 2; 3 nên là dữ liệu định lượng rời rạc.',
        'Đếm từng giá trị: giá trị 0 có 3 lần; giá trị 1 có 13 lần; giá trị 2 có 7 lần; giá trị 3 có 2 lần.',
        'Kiểm tra: 3 + 13 + 7 + 2 = 25, đúng bằng số bạn được hỏi nên không đếm sót hay trùng.',
        'Số bạn có từ 2 anh chị em ruột trở lên là 7 + 2 = 9 bạn.',
        'Tỉ lệ: 9 / 25 = 36 / 100 = 36%.',
      ],
      answer: 'a) Định lượng rời rạc; b) tần số lần lượt 3; 13; 7; 2 (tổng 25); c) 36%.',
    },
    checkQuestions: [
      {
        prompt: 'Dữ liệu nào sau đây là dữ liệu định lượng liên tục?',
        choices: [
          { id: 'a', label: 'Chiều cao của mỗi học sinh (đo bằng cm)' },
          { id: 'b', label: 'Số học sinh của mỗi lớp' },
          { id: 'c', label: 'Màu mắt của mỗi học sinh' },
          { id: 'd', label: 'Xếp loại học lực (giỏi, khá, trung bình)' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Chiều cao do ĐO và có thể nhận mọi giá trị trong một khoảng (như 152,3 cm) nên là dữ liệu liên tục. Số học sinh của lớp là dữ liệu rời rạc (do đếm); ' +
          'màu mắt và xếp loại học lực là dữ liệu định tính. Lỗi hay gặp là thấy có chữ số là nghĩ ngay dữ liệu liên tục.',
      },
      {
        prompt:
          'Nhà trường muốn biết môn học yêu thích của học sinh cả bốn khối 6, 7, 8, 9. Cách chọn 30 bạn nào dưới đây cho mẫu có tính đại diện nhất?',
        choices: [
          { id: 'a', label: '30 bạn trong đội tuyển Toán' },
          { id: 'b', label: '30 bạn chọn ngẫu nhiên, có đủ cả bốn khối, cả nam lẫn nữ' },
          { id: 'c', label: '30 bạn của lớp 8A' },
          { id: 'd', label: '30 bạn đứng gần cổng trường sáng nay' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Mẫu đại diện phải có mặt đủ các nhóm của toàn trường và chọn ngẫu nhiên. Đội tuyển Toán, một lớp hay các bạn đứng ở cổng đều chỉ là một nhóm nhỏ, ' +
          'có thể thiên về một sở thích nên kết luận bị lệch. Lỗi hay gặp là chọn mẫu thuận tiện rồi kết luận cho cả trường.',
      },
      {
        prompt:
          'Khảo sát 40 bạn về thời gian tự học mỗi ngày: dưới 1 giờ có 7 bạn; từ 1 đến dưới 2 giờ có 15 bạn; từ 2 đến dưới 3 giờ có 12 bạn; ' +
          'còn lại là từ 3 giờ trở lên. Có bao nhiêu bạn tự học từ 2 giờ trở lên?',
        answer: { kind: 'numeric', value: 18 },
        explain:
          'Số bạn tự học từ 3 giờ trở lên là 40 − (7 + 15 + 12) = 6 bạn. Từ 2 giờ trở lên gồm nhóm 2 đến dưới 3 giờ và nhóm từ 3 giờ trở lên: 12 + 6 = 18 bạn. ' +
          'Lỗi hay gặp là quên rằng tổng các tần số phải bằng 40 nên bỏ sót nhóm "còn lại", chỉ lấy 12.',
      },
      {
        prompt:
          'Trong 80 bạn được hỏi về môn thể thao yêu thích có 28 bạn chọn bóng đá. ' +
          'Tỉ lệ số bạn chọn bóng đá trong số bạn được hỏi, viết dưới dạng phân số tối giản, là bao nhiêu?',
        answer: { kind: 'fraction', num: 7, den: 20, requireSimplified: true },
        explain:
          'Tỉ lệ bằng số bạn chọn bóng đá chia tổng số bạn được hỏi: 28 / 80 = 7 / 20 (rút gọn cho 4), tức 35%. ' +
          'Lỗi hay gặp là chia cho số bạn không chọn bóng đá (28 / 52) hoặc quên rút gọn phân số.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phân biệt dữ liệu định tính và định lượng?',
        dap: 'Định tính: không phải là số (màu sắc, xếp loại). Định lượng: là số do đếm hoặc đo được (số anh chị em, chiều cao).',
      },
      {
        hoi: 'Dữ liệu định lượng rời rạc và liên tục khác nhau thế nào?',
        dap: 'Rời rạc: chỉ có các giá trị riêng lẻ, thường do đếm. Liên tục: nhận mọi giá trị trong một khoảng, thường do đo.',
      },
      {
        hoi: 'Mẫu như thế nào thì có tính đại diện?',
        dap: 'Được chọn ngẫu nhiên và có đủ các nhóm của toàn thể (khối lớp, nam và nữ, gần và xa...).',
      },
      {
        hoi: 'Kiểm tra bảng thống kê đã đếm đúng chưa bằng cách nào?',
        dap: 'Tổng các tần số phải bằng tổng số đối tượng điều tra.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan8-c5-b2',
    grade: '8',
    chapterNumber: 5,
    chapterTitle: 'Dữ liệu và biểu đồ',
    lessonNumber: 2,
    title: 'Lựa chọn và chuyển đổi giữa các dạng biểu diễn dữ liệu',
    hook:
      'Quán trà sữa của cô Hoa ghi lại số ly bán được mỗi ngày trong tuần vào một bảng dài. Con gái cô muốn làm một tờ áp phích để khách nhìn là thấy ngay ngày nào đông nhất, ' +
      'còn cô muốn xem doanh thu cả năm tăng hay giảm theo từng tháng. Cùng một bảng số liệu nhưng mỗi mục đích cần một loại biểu đồ khác nhau. ' +
      'Bài này giúp em chọn đúng loại biểu đồ và chuyển từ bảng sang biểu đồ.',
    theory:
      'CÁC DẠNG BIỂU DIỄN DỮ LIỆU VÀ KHI NÀO DÙNG\n' +
      '— Bảng số liệu: ghi giá trị chính xác, dễ tra cứu, nhưng khó thấy xu hướng.\n' +
      '— Biểu đồ tranh: dùng hình ảnh, mỗi hình ứng với một số đơn vị; hợp với số liệu nhỏ, cần trực quan (nửa hình là nửa số đơn vị).\n' +
      '— Biểu đồ cột: so sánh số liệu của các đối tượng riêng biệt (các lớp, các môn).\n' +
      '— Biểu đồ cột kép: so sánh hai nhóm hoặc hai thời điểm trên cùng một đối tượng (nam và nữ của mỗi lớp).\n' +
      '— Biểu đồ hình quạt tròn: cho thấy mỗi phần chiếm bao nhiêu phần trăm trong TỔNG. Cả hình tròn là 100%, ứng với 360 độ.\n' +
      '— Biểu đồ đoạn thẳng: thể hiện sự thay đổi theo thời gian (nhiệt độ từng tháng, doanh thu từng năm); đường nối các điểm cho thấy tăng hay giảm.\n' +
      'VÌ SAO phải chọn đúng loại? Biểu đồ phù hợp làm người xem thấy ngay điều ta muốn nói, biểu đồ không phù hợp làm họ hiểu sai hoặc không thấy gì.\n\n' +
      'CHUYỂN TỪ BẢNG SANG BIỂU ĐỒ\n' +
      'Biểu đồ cột: chọn trục ngang ghi đối tượng, trục dọc ghi số liệu với các vạch chia đều nhau; vẽ mỗi cột cao theo số liệu; ghi tên biểu đồ và chú giải.\n' +
      'Biểu đồ quạt tròn: tính tỉ lệ của từng phần trên tổng, rồi góc ở tâm = tỉ lệ · 360 độ. Tổng các góc phải bằng 360 độ, tổng các tỉ lệ bằng 100%.\n' +
      'Biểu đồ đoạn thẳng: chấm điểm theo từng mốc thời gian rồi nối các điểm liên tiếp.\n\n' +
      'MÔ TẢ BIỂU ĐỒ BẰNG LỜI\n' +
      'Nêu biểu đồ nói về điều gì, giá trị lớn nhất, nhỏ nhất, xu hướng chung (tăng, giảm, ổn định) và so sánh nếu có hai nhóm.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Dùng biểu đồ quạt tròn khi các số liệu không cộng thành một tổng có nghĩa, hoặc có quá nhiều phần nhỏ.\n' +
      '— Dùng biểu đồ cột cho số liệu theo thời gian dài, trong khi đoạn thẳng cho thấy xu hướng rõ hơn.\n' +
      '— Vẽ vạch chia trục dọc không đều nhau.\n' +
      '— Tính góc quạt mà quên nhân 360 độ, hoặc quên kiểm tra tổng các góc.',
    workedExample: {
      problem:
        'Bảng thống kê phương tiện đến trường của 200 học sinh: đi bộ 50 em; xe đạp 80 em; xe buýt 40 em; phương tiện khác 30 em. ' +
        'a) Nên chọn loại biểu đồ nào để thể hiện tỉ lệ từng phương tiện trong tổng số? b) Tính số đo góc ở tâm của mỗi hình quạt.',
      steps: [
        'Mục đích là thấy mỗi phương tiện chiếm bao nhiêu phần của tổng 200 em nên chọn biểu đồ hình quạt tròn.',
        'Kiểm tra tổng: 50 + 80 + 40 + 30 = 200 em.',
        'Đi bộ: 50 / 200 = 25% nên góc là 25% · 360 độ = 90 độ.',
        'Xe đạp: 80 / 200 = 40% nên góc là 144 độ. Xe buýt: 40 / 200 = 20% nên góc là 72 độ. Phương tiện khác: 30 / 200 = 15% nên góc là 54 độ.',
        'Kiểm tra: 90 + 144 + 72 + 54 = 360 độ, đúng một vòng tròn đầy.',
      ],
      answer: 'a) Biểu đồ hình quạt tròn; b) 90 độ, 144 độ, 72 độ, 54 độ (tổng 360 độ).',
    },
    checkQuestions: [
      {
        prompt:
          'Để thể hiện nhiệt độ trung bình của thành phố trong từng tháng của một năm, loại biểu đồ nào phù hợp nhất?',
        choices: [
          { id: 'a', label: 'Biểu đồ hình quạt tròn' },
          { id: 'b', label: 'Biểu đồ đoạn thẳng' },
          { id: 'c', label: 'Biểu đồ tranh' },
          { id: 'd', label: 'Bảng thống kê tần số' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Số liệu thay đổi theo thời gian nên biểu đồ đoạn thẳng cho thấy rõ xu hướng nóng lên hay lạnh đi. Biểu đồ quạt tròn chỉ hợp khi các phần cộng thành một tổng, ' +
          'nhiệt độ các tháng thì không. Lỗi hay gặp là dùng biểu đồ quạt tròn cho mọi loại số liệu.',
      },
      {
        prompt:
          'Muốn so sánh số học sinh nam và số học sinh nữ của từng lớp trong khối 8 trên cùng một biểu đồ, nên chọn loại biểu đồ nào?',
        choices: [
          { id: 'a', label: 'Biểu đồ cột kép' },
          { id: 'b', label: 'Biểu đồ đoạn thẳng' },
          { id: 'c', label: 'Biểu đồ hình quạt tròn' },
          { id: 'd', label: 'Biểu đồ tranh' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Mỗi lớp có hai số liệu (nam và nữ) cần đặt cạnh nhau để so sánh, nên dùng biểu đồ cột kép với hai màu khác nhau. ' +
          'Biểu đồ đoạn thẳng dành cho dữ liệu theo thời gian, còn quạt tròn chỉ thể hiện một tổng. Lỗi hay gặp là vẽ hai biểu đồ cột tách rời nên khó so sánh.',
      },
      {
        prompt:
          'Lớp 8A có 40 học sinh, trong đó 14 bạn xếp loại học lực Giỏi. Khi vẽ biểu đồ hình quạt tròn, hình quạt ứng với loại Giỏi có góc ở tâm bằng bao nhiêu độ?',
        answer: { kind: 'numeric', value: 126 },
        explain:
          'Tỉ lệ loại Giỏi là 14 / 40 = 0,35 = 35%, nên góc ở tâm là 0,35 · 360 = 126 độ. ' +
          'Lỗi hay gặp là lấy 14 · 360 mà quên chia cho tổng 40, hoặc nhầm 35% ứng với 35 độ.',
      },
      {
        prompt:
          'Quán trà sữa vẽ biểu đồ tranh, mỗi hình ly ứng với 10 ly bán ra, nửa hình ly ứng với 5 ly. Thứ Bảy bán được 85 ly. ' +
          'Cần vẽ bao nhiêu hình ly cho thứ Bảy (nửa hình ly tính là 0,5)?',
        answer: { kind: 'numeric', value: 8.5 },
        explain:
          'Số hình ly là 85 : 10 = 8,5, tức 8 hình đầy và một nửa hình. Kiểm tra: 8 · 10 + 5 = 85 ly. ' +
          'Lỗi hay gặp là bỏ nửa hình ly (chỉ vẽ 8 hình, ứng với 80 ly) hoặc coi mỗi hình ứng với 1 ly nên vẽ tới 85 hình.',
      },
    ],
    srsCards: [
      {
        hoi: 'Biểu đồ đoạn thẳng dùng để thể hiện điều gì?',
        dap: 'Sự thay đổi của số liệu theo thời gian (tăng, giảm, ổn định).',
      },
      {
        hoi: 'Khi nào dùng biểu đồ cột kép?',
        dap: 'Khi cần so sánh hai nhóm hoặc hai thời điểm cho cùng một đối tượng, như nam và nữ của mỗi lớp.',
      },
      {
        hoi: 'Cách tính góc ở tâm của một hình quạt trong biểu đồ quạt tròn?',
        dap: 'Góc = (số liệu của phần đó / tổng số liệu) · 360 độ. Tổng các góc bằng 360 độ.',
      },
      {
        hoi: 'Biểu đồ hình quạt tròn thích hợp khi nào?',
        dap: 'Khi muốn cho thấy mỗi phần chiếm bao nhiêu phần trăm trong một tổng có nghĩa.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan8-c5-b3',
    grade: '8',
    chapterNumber: 5,
    chapterTitle: 'Dữ liệu và biểu đồ',
    lessonNumber: 3,
    title: 'Phân tích số liệu và phát hiện vấn đề từ biểu đồ',
    hook:
      'Một cửa hàng đăng quảng cáo: "Doanh thu của chúng tôi cao gấp 3 lần đối thủ!" kèm biểu đồ cột, cột của cửa hàng cao vút còn cột đối thủ thấp tè. ' +
      'Nhưng khi nhìn kĩ, Minh thấy trục dọc không bắt đầu từ 0 mà bắt đầu từ 50, nên chênh lệch nhỏ cũng trông rất lớn. ' +
      'Biểu đồ không "nói dối" nhưng cách vẽ có thể khiến ta hiểu lầm. Bài này giúp em đọc biểu đồ tỉnh táo và tính đúng mức tăng giảm.',
    theory:
      'ĐỌC BIỂU ĐỒ CÓ PHÊ PHÁN\n' +
      'Trước khi rút kết luận, hãy kiểm tra: tên biểu đồ, đơn vị, mỗi vạch chia trên trục là bao nhiêu, trục dọc bắt đầu từ đâu, nguồn số liệu.\n\n' +
      'TÍNH MỨC TĂNG GIẢM\n' +
      'Mức thay đổi tuyệt đối = giá trị mới trừ giá trị cũ. Mức thay đổi tương đối (tỉ lệ phần trăm tăng, giảm) tính so với giá trị CŨ:\n' +
      '   tỉ lệ thay đổi = (giá trị mới − giá trị cũ) / giá trị cũ · 100%.\n' +
      'Ví dụ từ 800 lên 920: (920 − 800) / 800 = 0,15 = 15%, tức tăng 15%. Kết quả dương là tăng, âm là giảm.\n' +
      'VÌ SAO lấy giá trị cũ làm gốc? Vì ta hỏi "so với lúc đầu thì thay đổi bao nhiêu phần".\n\n' +
      'NHỮNG CÁCH VẼ DỄ GÂY HIỂU LẦM\n' +
      '— Trục dọc không bắt đầu từ 0: chiều cao cột không còn tỉ lệ với số liệu. Ví dụ hai giá trị 52 và 56, trục bắt đầu từ 50: cột thấp cao 2 đơn vị, cột cao 6 đơn vị, trông gấp 3 lần, nhưng thực tế chỉ hơn khoảng 7,7%.\n' +
      '— Vạch chia không đều hoặc cắt ngang trục mà không ghi chú.\n' +
      '— Biểu đồ tranh phóng to cả chiều rộng lẫn chiều cao: hình gấp đôi mỗi chiều có diện tích gấp 4 lần, mắt người thấy chênh lệch lớn hơn thực tế.\n' +
      '— Chỉ vẽ một đoạn thời gian ngắn, chọn mốc có lợi cho kết luận.\n\n' +
      'RÚT KẾT LUẬN HỢP LÍ\n' +
      'Kết luận phải dựa trên số liệu thật đọc được, không suy diễn quá mức: hai đại lượng cùng tăng (số que kem bán ra và số người đi bơi) chưa chắc cái này gây ra cái kia, có thể cả hai cùng do trời nóng.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Tính tỉ lệ tăng giảm so với giá trị mới thay vì giá trị cũ.\n' +
      '— Đánh giá độ chênh lệch bằng chiều cao cột khi trục không bắt đầu từ 0.\n' +
      '— Nhầm "tăng 20%" rồi "giảm 20%" là về lại như cũ (thực ra không bằng nhau vì gốc khác nhau).',
    workedExample: {
      problem:
        'Biểu đồ cột quảng cáo doanh thu tháng này của hai cửa hàng: cửa hàng A là 52 triệu đồng, cửa hàng B là 56 triệu đồng. ' +
        'Trục dọc bắt đầu từ 50 triệu đồng, cột B trông cao gấp 3 lần cột A. Hỏi: a) vì sao trông gấp 3? b) doanh thu của B thực tế hơn A bao nhiêu phần trăm (làm tròn đến hàng phần mười)?',
      steps: [
        'Vì trục dọc bắt đầu từ 50 nên chiều cao hiển thị của mỗi cột chỉ ứng với phần vượt quá 50 triệu.',
        'Cột A hiển thị 52 − 50 = 2 đơn vị; cột B hiển thị 56 − 50 = 6 đơn vị. Tỉ số hiển thị là 6 : 2 = 3, nên mắt ta thấy gấp 3 lần.',
        'Chênh lệch thực tế: 56 − 52 = 4 triệu đồng.',
        'So với doanh thu của A (giá trị làm gốc): 4 / 52 = 1 / 13, xấp xỉ 0,0769 nên khoảng 7,7%.',
        'Kết luận: B hơn A khoảng 7,7%, không phải gấp 3 lần; biểu đồ trục không bắt đầu từ 0 làm sai lệch cảm nhận.',
      ],
      answer:
        'a) Do trục dọc bắt đầu từ 50, phần hiển thị chỉ là 2 và 6 đơn vị; b) B hơn A khoảng 7,7%.',
    },
    checkQuestions: [
      {
        prompt:
          'Dấu hiệu nào sau đây dễ làm người xem hiểu sai chênh lệch giữa các cột của một biểu đồ cột?',
        choices: [
          { id: 'a', label: 'Trục dọc bắt đầu từ 0 và các vạch chia đều nhau' },
          { id: 'b', label: 'Trục dọc bắt đầu từ một số khác 0 mà không ghi chú' },
          { id: 'c', label: 'Có ghi tên biểu đồ và đơn vị' },
          { id: 'd', label: 'Các cột có cùng độ rộng' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Khi trục dọc bắt đầu từ số khác 0, chiều cao cột không còn tỉ lệ với số liệu nên chênh lệch nhỏ cũng trông rất lớn. ' +
          'Trục bắt đầu từ 0, vạch chia đều, có tên và đơn vị, cột cùng độ rộng đều là cách vẽ đúng. Lỗi hay gặp là so sánh bằng mắt mà quên nhìn số ở đầu trục.',
      },
      {
        prompt:
          'Số lượt khách của một quán cà phê là 800 lượt trong tháng 5 và 920 lượt trong tháng 6. Số lượt khách tháng 6 tăng bao nhiêu phần trăm so với tháng 5?',
        answer: { kind: 'numeric', value: 15 },
        explain:
          'Mức tăng là 920 − 800 = 120 lượt. Tỉ lệ tăng so với tháng 5 (giá trị cũ) là 120 / 800 = 0,15 = 15%. ' +
          'Lỗi hay gặp là chia cho 920 (giá trị mới) được khoảng 13%, hoặc lấy luôn 120 làm số phần trăm.',
      },
      {
        prompt:
          'Một biểu đồ tranh biểu diễn dân số thành phố B gấp đôi thành phố A bằng cách vẽ hình vuông của B có cạnh dài gấp đôi cạnh hình vuông của A. ' +
          'Diện tích hình vuông của B gấp bao nhiêu lần diện tích hình vuông của A?',
        answer: { kind: 'numeric', value: 4 },
        explain:
          'Cạnh gấp đôi thì diện tích gấp 2 · 2 = 4 lần. Mắt người thường so sánh diện tích nên thấy B lớn gấp 4 lần, trong khi dân số thật chỉ gấp 2 lần: biểu đồ gây hiểu lầm. ' +
          'Cách vẽ đúng là giữ nguyên kích thước hình và vẽ số hình nhiều gấp đôi. Lỗi hay gặp là nghĩ diện tích cũng chỉ gấp 2 lần.',
      },
      {
        prompt:
          'Doanh thu của một cửa hàng là 120 tỉ đồng năm trước và 150 tỉ đồng năm nay. ' +
          'Mức tăng so với năm trước chiếm bao nhiêu phần của doanh thu năm trước (viết dưới dạng phân số tối giản)?',
        answer: { kind: 'fraction', num: 1, den: 4, requireSimplified: true },
        explain:
          'Mức tăng là 150 − 120 = 30 tỉ đồng. So với giá trị cũ 120: 30 / 120 = 1 / 4 (tức tăng 25%). ' +
          'Lỗi hay gặp là lấy 30 / 150 = 1 / 5, vì chia cho giá trị mới thay vì giá trị cũ.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức tính tỉ lệ phần trăm tăng hoặc giảm?',
        dap: '(giá trị mới − giá trị cũ) / giá trị cũ · 100%. Dương là tăng, âm là giảm.',
      },
      {
        hoi: 'Vì sao trục dọc không bắt đầu từ 0 gây hiểu lầm?',
        dap: 'Chiều cao cột không còn tỉ lệ với số liệu, nên chênh lệch nhỏ trông rất lớn.',
      },
      {
        hoi: 'Hình có cạnh gấp đôi thì diện tích gấp mấy lần, và điều đó liên quan gì đến biểu đồ tranh?',
        dap: 'Gấp 4 lần. Phóng to cả hai chiều làm mắt thấy chênh lệch lớn hơn thực tế.',
      },
      {
        hoi: 'Nên kiểm tra những gì trước khi rút kết luận từ biểu đồ?',
        dap: 'Tên và đơn vị, vạch chia, trục có bắt đầu từ 0 không, nguồn và khoảng thời gian của số liệu.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
