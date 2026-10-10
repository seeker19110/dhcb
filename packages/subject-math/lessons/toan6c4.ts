// lessons/toan6c4.ts — Toán 6, Chương 4: Một số hình phẳng trong thực tiễn.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN6_C4_LESSONS: MathLesson[] = [
  {
    id: 'toan6-c4-b1',
    grade: '6',
    chapterNumber: 4,
    chapterTitle: 'Một số hình phẳng trong thực tiễn',
    lessonNumber: 1,
    title: 'Tam giác đều, hình vuông và lục giác đều',
    hook:
      'Nhìn vào tổ ong, bạn thấy những ngăn nhỏ xếp khít vào nhau, không hở một khe nào. Mỗi ngăn là một hình lục giác đều. ' +
      'Sân nhà bạn có thể lát bằng gạch vuông, còn vỉa hè nhiều nơi lát gạch lục giác. Vì sao ong chọn đúng hình ấy, và ' +
      'làm sao nhận ra một hình là “đều” hay “vuông” mà không cần đo hết mọi thứ? Bài này giúp bạn đọc đặc điểm của ba hình quen thuộc.',
    theory:
      'BA HÌNH “ĐỀU” VÀ “VUÔNG”\n' +
      'Mỗi hình có những đặc điểm về cạnh, góc và đường chéo. Biết đặc điểm là nhận ra hình mà không phải đoán theo mắt.\n\n' +
      '1) TAM GIÁC ĐỀU ABC\n' +
      '— Ba cạnh bằng nhau: AB = BC = CA.\n' +
      '— Ba góc bằng nhau, mỗi góc bằng 60°.\n' +
      'Vì sao mỗi góc là 60°? Nhìn sang lục giác đều ở dưới: sáu tam giác đều ghép quanh một điểm thì vừa đủ một vòng 360°, ' +
      'nên mỗi góc của tam giác ở điểm giữa là 360° : 6 = 60°.\n\n' +
      '2) HÌNH VUÔNG ABCD\n' +
      '— Bốn cạnh bằng nhau: AB = BC = CD = DA.\n' +
      '— Bốn góc đều là góc vuông (90°).\n' +
      '— Hai cạnh đối diện song song.\n' +
      '— Hai đường chéo AC và BD bằng nhau. Gấp giấy theo đường chéo ta còn thấy hai đường chéo cắt nhau thành góc vuông.\n' +
      'Chú ý: “bốn cạnh bằng nhau” chưa đủ để kết luận là hình vuông, vì còn có hình thoi (học ở bài sau). Phải có thêm bốn góc vuông.\n\n' +
      '3) LỤC GIÁC ĐỀU ABCDEF\n' +
      '— Sáu cạnh bằng nhau, sáu góc bằng nhau (mỗi góc 120°).\n' +
      '— Có ba đường chéo chính AD, BE, CF nối hai đỉnh đối diện. Ba đường này bằng nhau và cắt nhau tại một điểm O.\n' +
      '— Điểm O cách đều cả sáu đỉnh. Ba đường chéo chính chia lục giác thành 6 tam giác đều bằng nhau.\n' +
      'Hệ quả hay dùng: mỗi đường chéo chính gồm hai cạnh của tam giác đều nên dài gấp đôi cạnh lục giác. Ví dụ cạnh 5 cm thì đường chéo chính dài 10 cm.\n\n' +
      'VÌ SAO ONG LÀM TỔ HÌNH LỤC GIÁC ĐỀU\n' +
      'Muốn lát kín mặt phẳng, các góc gặp nhau tại một điểm phải cộng đủ 360°. Ba góc 120° cho 360°, nên ba ô lục giác gặp nhau khít. ' +
      'Tam giác đều (6 góc 60°) và hình vuông (4 góc 90°) cũng lát kín được.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhầm đường chéo với cạnh: đường chéo nối hai đỉnh KHÔNG kề nhau.\n' +
      '— Tưởng lục giác nào có sáu cạnh cũng là lục giác đều. Phải có cả sáu cạnh bằng nhau và sáu góc bằng nhau.\n' +
      '— Cho rằng đường chéo của lục giác đều dài bằng cạnh. Thật ra đường chéo chính dài gấp đôi cạnh.',
    workedExample: {
      problem:
        'Lục giác đều ABCDEF có cạnh 6 cm, tâm O. a) Tam giác OAB là tam giác gì? b) Đường chéo chính AD dài bao nhiêu? c) Chu vi lục giác là bao nhiêu?',
      steps: [
        'Lục giác đều được chia thành 6 tam giác đều bằng nhau bởi ba đường chéo chính, nên tam giác OAB là tam giác đều.',
        'Do đó OA = OB = AB = 6 cm.',
        'Đường chéo chính AD đi qua tâm O, gồm hai đoạn AO và OD. Điểm O cách đều các đỉnh nên OD = OA = 6 cm, suy ra AD = 6 + 6 = 12 cm.',
        'Lục giác đều có 6 cạnh bằng nhau nên chu vi = 6 · 6 = 36 cm.',
      ],
      answer: 'a) Tam giác đều. b) AD = 12 cm. c) Chu vi 36 cm.',
    },
    checkQuestions: [
      {
        prompt: 'Phát biểu nào sau đây ĐÚNG về hình vuông ABCD?',
        choices: [
          { id: 'a', label: 'Hai đường chéo AC và BD bằng nhau' },
          { id: 'b', label: 'Hai đường chéo có độ dài khác nhau' },
          { id: 'c', label: 'Chỉ có hai góc vuông' },
          { id: 'd', label: 'Bốn cạnh có độ dài đôi một khác nhau' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Hình vuông có bốn cạnh bằng nhau, bốn góc vuông và hai đường chéo bằng nhau. Lỗi hay gặp là tưởng hình vuông chỉ có hai góc vuông hoặc đường chéo ngắn dài khác nhau.',
      },
      {
        prompt:
          'Lục giác đều có cạnh dài 5 cm. Đường chéo chính (nối hai đỉnh đối diện) dài bao nhiêu cm?',
        answer: { kind: 'numeric', value: 10 },
        explain:
          'Đường chéo chính đi qua tâm và gồm hai cạnh của hai tam giác đều, nên dài 5 + 5 = 10 cm. Lỗi hay gặp là cho rằng đường chéo dài bằng cạnh, tức 5 cm.',
      },
      {
        prompt:
          'Một khăn trải bàn hình vuông có cạnh 1,2 m, mẹ khâu viền ren xung quanh. Cần bao nhiêu mét ren (bỏ qua chỗ nối)?',
        answer: { kind: 'numeric', value: 4.8 },
        explain:
          'Hình vuông có bốn cạnh bằng nhau nên chu vi là 4 · 1,2 = 4,8 m. Lỗi hay gặp là chỉ lấy 1,2 m (một cạnh) hoặc nhân đôi thành 2,4 m.',
      },
      {
        prompt:
          'Sáu tam giác đều ghép quanh một điểm tạo thành một lục giác đều. Tổng các góc quanh điểm đó là 360°. Mỗi góc của một tam giác đều bằng bao nhiêu độ (tại điểm giữa)?',
        answer: { kind: 'numeric', value: 60 },
        explain:
          'Sáu góc bằng nhau tạo thành một vòng đầy 360°, nên mỗi góc là 360 : 6 = 60 độ. Lỗi hay gặp là nhầm với 120° là góc của cả lục giác đều.',
      },
    ],
    srsCards: [
      {
        hoi: 'Nêu đặc điểm của tam giác đều.',
        dap: 'Ba cạnh bằng nhau và ba góc bằng nhau, mỗi góc bằng 60°.',
      },
      {
        hoi: 'Hình vuông có những đặc điểm gì về cạnh, góc, đường chéo?',
        dap: 'Bốn cạnh bằng nhau, bốn góc vuông, hai đường chéo bằng nhau (và cắt nhau thành góc vuông).',
      },
      {
        hoi: 'Lục giác đều ghép từ bao nhiêu tam giác đều? Đường chéo chính dài bao nhiêu so với cạnh?',
        dap: 'Ghép từ 6 tam giác đều có chung đỉnh O; đường chéo chính dài gấp đôi cạnh.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan6-c4-b2',
    grade: '6',
    chapterNumber: 4,
    chapterTitle: 'Một số hình phẳng trong thực tiễn',
    lessonNumber: 2,
    title: 'Hình chữ nhật, hình thoi, hình bình hành và hình thang cân',
    hook:
      'Cánh diều của bạn có thể là hình thoi, tấm bảng lớp là hình chữ nhật, mặt cầu thang gấp là hình bình hành, ' +
      'còn mặt bên của chiếc rổ nhựa thường là hình thang cân. Bốn hình trông na ná nhau vì đều có bốn cạnh, ' +
      'nhưng mỗi hình có “dấu hiệu nhận dạng” riêng về cạnh, góc và đường chéo. Biết dấu hiệu, bạn phân biệt chúng ngay mà không cần thước.',
    theory:
      'BỐN HÌNH TỨ GIÁC THƯỜNG GẶP\n' +
      'Cách học dễ nhất: với mỗi hình, hỏi ba câu — cạnh thế nào, góc thế nào, đường chéo thế nào.\n\n' +
      '1) HÌNH CHỮ NHẬT ABCD\n' +
      '— Hai cặp cạnh đối bằng nhau (AB = CD, AD = BC).\n' +
      '— Bốn góc vuông.\n' +
      '— Hai đường chéo AC và BD bằng nhau.\n\n' +
      '2) HÌNH THOI ABCD\n' +
      '— Bốn cạnh bằng nhau; các cạnh đối song song.\n' +
      '— Các góc đối bằng nhau (góc A = góc C, góc B = góc D).\n' +
      '— Hai đường chéo vuông góc với nhau và cắt nhau tại trung điểm của mỗi đường. Hai đường chéo thường KHÔNG bằng nhau.\n\n' +
      '3) HÌNH BÌNH HÀNH ABCD\n' +
      '— Các cặp cạnh đối song song và bằng nhau.\n' +
      '— Các góc đối bằng nhau.\n' +
      '— Hai đường chéo cắt nhau tại trung điểm của mỗi đường. Hai đường chéo thường không bằng nhau và không vuông góc.\n\n' +
      '4) HÌNH THANG CÂN ABCD (đáy AB song song với CD)\n' +
      '— Hai cạnh đáy song song.\n' +
      '— Hai cạnh bên bằng nhau (AD = BC).\n' +
      '— Hai góc kề một đáy bằng nhau (góc C = góc D, góc A = góc B).\n' +
      '— Hai đường chéo bằng nhau (AC = BD).\n\n' +
      'VÌ SAO NÊN SO SÁNH CÁC HÌNH VỚI NHAU\n' +
      'Hình chữ nhật và hình thoi đều là trường hợp đặc biệt của hình bình hành: chữ nhật là bình hành có bốn góc vuông, ' +
      'còn hình thoi là bình hành có bốn cạnh bằng nhau. Hình vuông vừa là chữ nhật vừa là hình thoi nên có đủ mọi tính chất của cả hai.\n\n' +
      'BẢNG NHỚ NHANH\n' +
      '— Đường chéo bằng nhau: chữ nhật, hình thang cân (và hình vuông).\n' +
      '— Đường chéo vuông góc: hình thoi (và hình vuông).\n' +
      '— Đường chéo cắt nhau tại trung điểm: chữ nhật, thoi, bình hành.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Cho rằng hình bình hành có bốn góc vuông. Chỉ hình chữ nhật mới có.\n' +
      '— Nhầm hình thoi với hình vuông: hình thoi chưa chắc có góc vuông.\n' +
      '— Cho rằng hai đường chéo hình bình hành bằng nhau. Chỉ khi nó là hình chữ nhật mới đúng.',
    workedExample: {
      problem:
        'Hình bình hành ABCD có AB = 8 cm, AD = 5 cm và góc A = 65°. Hãy cho biết độ dài CD, BC và số đo góc C.',
      steps: [
        'Hình bình hành có các cạnh đối bằng nhau, nên CD = AB = 8 cm.',
        'Tương tự BC = AD = 5 cm.',
        'Hình bình hành có các góc đối bằng nhau; góc C đối diện với góc A nên góc C = góc A = 65°.',
      ],
      answer: 'CD = 8 cm, BC = 5 cm, góc C = 65°.',
    },
    checkQuestions: [
      {
        prompt:
          'Trong các hình sau, hình nào có hai đường chéo vuông góc với nhau (và hai đường chéo thường không bằng nhau)?',
        choices: [
          { id: 'a', label: 'Hình chữ nhật (không phải hình vuông)' },
          { id: 'b', label: 'Hình thoi' },
          { id: 'c', label: 'Hình bình hành (không phải hình thoi)' },
          { id: 'd', label: 'Hình thang cân' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Hình thoi có hai đường chéo vuông góc và cắt nhau tại trung điểm. Hình chữ nhật có hai đường chéo bằng nhau nhưng không vuông góc. Lỗi hay gặp là nhầm hình thoi với hình chữ nhật.',
      },
      {
        prompt: 'Hình bình hành ABCD có góc A bằng 70°. Số đo góc C bằng bao nhiêu độ?',
        answer: { kind: 'numeric', value: 70 },
        explain:
          'Trong hình bình hành, hai góc đối bằng nhau, mà C đối diện với A nên góc C = 70°. Lỗi hay gặp là lấy 180 − 70 = 110° vì nhầm góc đối với góc kề.',
      },
      {
        prompt:
          'Hình thang cân MNPQ có đáy MN song song với PQ, cạnh bên MQ = 5 cm. Đường chéo MP = 9 cm. Hỏi đường chéo NQ dài bao nhiêu cm?',
        answer: { kind: 'numeric', value: 9 },
        explain:
          'Hình thang cân có hai đường chéo bằng nhau nên NQ = MP = 9 cm. Lỗi hay gặp là lấy cạnh bên 5 cm làm đáp án vì lẫn đường chéo với cạnh.',
      },
      {
        prompt:
          'Cánh diều hình thoi có mỗi cạnh dài 45 cm. Bố viền dây xung quanh khung diều. Cần bao nhiêu xăng-ti-mét dây (đơn vị cm)?',
        answer: { kind: 'numeric', value: 180 },
        explain:
          'Hình thoi có bốn cạnh bằng nhau nên chu vi là 4 · 45 = 180 cm. Lỗi hay gặp là chỉ cộng hai cạnh (90 cm) vì tưởng hình thoi giống hình chữ nhật có hai cặp cạnh khác nhau.',
      },
    ],
    srsCards: [
      {
        hoi: 'Hai đường chéo của hình thoi có đặc điểm gì?',
        dap: 'Vuông góc với nhau và cắt nhau tại trung điểm của mỗi đường.',
      },
      {
        hoi: 'Hình bình hành có các đặc điểm nào về cạnh và góc?',
        dap: 'Các cặp cạnh đối song song và bằng nhau; các góc đối bằng nhau.',
      },
      {
        hoi: 'Hình thang cân khác hình thang thường ở điểm nào?',
        dap: 'Hai cạnh bên bằng nhau, hai góc kề một đáy bằng nhau và hai đường chéo bằng nhau.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan6-c4-b3',
    grade: '6',
    chapterNumber: 4,
    chapterTitle: 'Một số hình phẳng trong thực tiễn',
    lessonNumber: 3,
    title: 'Chu vi và diện tích của một số hình trong thực tiễn',
    hook:
      'Bố muốn lát lại nền phòng khách bằng gạch vuông 50 cm, mẹ muốn rào mảnh vườn nhỏ phía sau nhà, ' +
      'còn bạn thì tò mò cần mua mấy lít sơn để sơn bức tường lớp học. Cả ba việc đều cần hai con số: ' +
      'chu vi (đi vòng quanh dài bao nhiêu) và diện tích (phủ kín mặt cần bao nhiêu). Bài này cho bạn công thức và cách dùng chúng đúng chỗ.',
    theory:
      'CHU VI VÀ DIỆN TÍCH — HAI ĐẠI LƯỢNG KHÁC NHAU\n' +
      'Chu vi là tổng độ dài các cạnh (đo bằng cm, m…), dùng khi rào, viền, khâu ren. ' +
      'Diện tích là phần mặt phẳng hình chiếm chỗ (đo bằng cm², m²…), dùng khi lát, sơn, trồng cỏ.\n\n' +
      'CÔNG THỨC\n' +
      '— Hình vuông cạnh a: chu vi P = 4a; diện tích S = a · a.\n' +
      '— Hình chữ nhật dài a, rộng b: P = 2(a + b); S = a · b.\n' +
      '— Hình bình hành đáy a, chiều cao h: S = a · h. Chu vi P = 2(a + b) với b là cạnh bên.\n' +
      '— Hình thoi có hai đường chéo d₁, d₂: S = d₁ · d₂ / 2. Chu vi P = 4a với a là cạnh.\n' +
      '— Hình thang có hai đáy a, b và chiều cao h: S = (a + b) · h / 2.\n\n' +
      'VÌ SAO CÁC CÔNG THỨC ĐÚNG\n' +
      '— Hình bình hành: cắt một tam giác ở đầu bên trái rồi dán sang đầu bên phải, ta được hình chữ nhật có cạnh a và h. Diện tích không đổi nên S = a · h.\n' +
      '— Hình thoi: nó nằm vừa trong hình chữ nhật có hai cạnh d₁ và d₂ và chiếm đúng một nửa hình chữ nhật ấy, nên S = d₁ · d₂ / 2.\n' +
      '— Hình thang: ghép hai hình thang bằng nhau (lật một hình) thành hình bình hành có đáy a + b, chiều cao h. Một hình thang là nửa ấy, nên S = (a + b) · h / 2.\n\n' +
      'CHIỀU CAO LÀ GÌ?\n' +
      'Chiều cao là khoảng cách vuông góc giữa hai đáy (hai cạnh song song), KHÔNG phải độ dài cạnh bên nghiêng.\n\n' +
      'MẸO GIẢI BÀI TOÁN THỰC TẾ\n' +
      '1) Xác định cần chu vi hay diện tích. Rào, viền → chu vi. Lát, sơn, phủ → diện tích.\n' +
      '2) Đổi cùng đơn vị trước khi tính (1 m = 100 cm; 1 m² = 10 000 cm²).\n' +
      '3) Bài lát gạch: số viên = diện tích nền : diện tích một viên (thường phải làm tròn lên).\n' +
      '4) Có phần không cần phủ (cửa, cổng) thì trừ đi.\n' +
      'Ví dụ rào vườn: vườn chữ nhật 25 m × 18 m rào kín, chừa cổng 3 m. Chu vi 2 · (25 + 18) = 86 m, trừ cổng còn 86 − 3 = 83 m hàng rào.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Quên chia 2 khi tính diện tích hình thoi và hình thang.\n' +
      '— Lấy cạnh bên nhân với đáy khi tính diện tích hình bình hành, thay vì chiều cao.\n' +
      '— Lẫn chu vi và diện tích, hoặc viết sai đơn vị (m thay cho m²).',
    workedExample: {
      problem:
        'Một bức tường hình chữ nhật dài 5 m, cao 3 m có một cửa ra vào hình chữ nhật rộng 1 m, cao 2 m. Cứ 6,5 m² sơn được bằng 1 lít sơn (một lớp). Cần ít nhất bao nhiêu lít sơn?',
      steps: [
        'Diện tích cả bức tường: 5 · 3 = 15 m².',
        'Diện tích cửa không cần sơn: 1 · 2 = 2 m².',
        'Diện tích cần sơn: 15 − 2 = 13 m².',
        'Số lít sơn: 13 : 6,5 = 2 lít.',
      ],
      answer: 'Cần 2 lít sơn.',
    },
    checkQuestions: [
      {
        prompt:
          'Hình bình hành có cạnh đáy 10 cm, cạnh bên nghiêng 6 cm và chiều cao tương ứng với cạnh đáy là 5 cm. Diện tích hình bình hành là bao nhiêu?',
        choices: [
          { id: 'a', label: '60 cm²' },
          { id: 'b', label: '50 cm²' },
          { id: 'c', label: '30 cm²' },
          { id: 'd', label: '16 cm²' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Diện tích hình bình hành là đáy nhân chiều cao: 10 · 5 = 50 cm². Lỗi hay gặp là nhân đáy với cạnh bên (10 · 6 = 60) vì tưởng cạnh bên là chiều cao.',
      },
      {
        prompt:
          'Cánh diều hình thoi có hai thanh tre làm đường chéo dài 60 cm và 40 cm. Tính diện tích giấy dán kín cánh diều (đơn vị cm²).',
        answer: { kind: 'numeric', value: 1200 },
        explain:
          'Diện tích hình thoi là d₁ · d₂ / 2 = 60 · 40 / 2 = 1200 cm². Lỗi hay gặp là quên chia 2 và ra 2400 cm².',
      },
      {
        prompt:
          'Một thửa ruộng hình thang có hai đáy dài 30 m và 50 m, chiều cao 20 m. Tính diện tích thửa ruộng (đơn vị m²).',
        answer: { kind: 'numeric', value: 800 },
        explain:
          'Diện tích hình thang là (a + b) · h / 2 = (30 + 50) · 20 / 2 = 800 m². Lỗi hay gặp là quên chia 2 và ra 1600 m².',
      },
      {
        prompt:
          'Nền phòng hình chữ nhật dài 6 m, rộng 4 m, lát bằng gạch vuông cạnh 50 cm (0,5 m), không hao hụt. Cần bao nhiêu viên gạch?',
        answer: { kind: 'numeric', value: 96 },
        explain:
          'Diện tích nền 6 · 4 = 24 m², mỗi viên 0,5 · 0,5 = 0,25 m², nên cần 24 : 0,25 = 96 viên. Lỗi hay gặp là chia cho 0,5 (cạnh) thay vì diện tích 0,25, ra 48 viên.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức diện tích hình thoi theo hai đường chéo?',
        dap: 'S = d₁ · d₂ / 2 (tích hai đường chéo chia 2).',
      },
      {
        hoi: 'Công thức diện tích hình thang?',
        dap: 'S = (a + b) · h / 2, với a, b là hai đáy, h là chiều cao.',
      },
      {
        hoi: 'Bài toán rào vườn dùng chu vi hay diện tích? Lát gạch thì sao?',
        dap: 'Rào, viền dùng chu vi; lát gạch, sơn tường dùng diện tích.',
      },
      {
        hoi: 'Diện tích hình bình hành tính thế nào?',
        dap: 'S = đáy · chiều cao tương ứng (chiều cao vuông góc với đáy, không phải cạnh bên).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
