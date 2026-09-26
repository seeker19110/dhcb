// lessons/ly11c4.ts — Vật lí 11, Chương 4: Dòng điện. Mạch điện (5 bài).
import type { PhysicsLesson } from '../lessonTypes.js'

export const LY11_C4_LESSONS: PhysicsLesson[] = [
  {
    id: 'ly11-c4-b22',
    // Tách bạch CHIỀU QUY ƯỚC của dòng điện với chiều chuyển động thật của electron —
    // chỗ gây rối cho gần như mọi học sinh khi mới học điện.
    animation: {
      title: 'Chiều dòng điện quy ước và chiều đi thật của electron',
      description:
        'Một mạch kín gồm pin và bóng đèn nối bằng dây dẫn. Mũi tên lớn phía trên dây chạy từ cực dương của pin qua đèn về cực âm: đó là CHIỀU QUY ƯỚC của dòng điện, được chọn từ thời chưa biết đến electron. Các chấm nhỏ nằm trên chính đoạn dây ấy là electron tự do trong kim loại: chúng trôi NGƯỢC lại, sang trái, vì mang điện tích âm — đi ra từ cực âm, qua đèn, về cực dương. Hai chiều ngược nhau nhưng không mâu thuẫn: điện tích âm đi sang trái gây hiệu ứng y hệt điện tích dương đi sang phải. Electron trôi rất chậm (cỡ 0,1 mm/s), còn đèn sáng gần như tức thì vì điện trường lan trong dây gần bằng tốc độ ánh sáng. I = q/t đo lượng điện tích qua tiết diện dây trong một giây.',
      viewBoxWidth: 420,
      viewBoxHeight: 240,
      durationMs: 4000,
      loop: true,
      shapes: [
        {
          kind: 'rect',
          id: 'day-dan',
          x: 60,
          y: 50,
          w: 300,
          h: 140,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        { kind: 'rect', id: 'pin', x: 40, y: 100, w: 40, h: 40, rx: 4, fill: 'muted' },
        { kind: 'circle', id: 'den', cx: 360, cy: 120, r: 20, stroke: 'warn', strokeWidth: 3 },
        {
          kind: 'label',
          id: 'nhan-cuc-duong',
          x: 60,
          y: 94,
          text: '+',
          size: 16,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-cuc-am',
          x: 60,
          y: 162,
          text: '−',
          size: 16,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-den',
          x: 360,
          y: 168,
          text: 'đèn',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'arrow',
          id: 'chieu-quy-uoc-tren',
          x1: 140,
          y1: 34,
          x2: 260,
          y2: 34,
          stroke: 'primary',
          strokeWidth: 4,
        },
        {
          kind: 'arrow',
          id: 'chieu-electron',
          x1: 260,
          y1: 68,
          x2: 140,
          y2: 68,
          stroke: 'accent',
          strokeWidth: 3,
        },
        {
          kind: 'circle',
          id: 'electron-330',
          cx: 330,
          cy: 50,
          r: 5,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 4000, dx: -60 },
          ],
        },
        {
          kind: 'circle',
          id: 'electron-270',
          cx: 270,
          cy: 50,
          r: 5,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 4000, dx: -60 },
          ],
        },
        {
          kind: 'circle',
          id: 'electron-210',
          cx: 210,
          cy: 50,
          r: 5,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 4000, dx: -60 },
          ],
        },
        {
          kind: 'circle',
          id: 'electron-150',
          cx: 150,
          cy: 50,
          r: 5,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 4000, dx: -60 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-i',
          x: 134,
          y: 38,
          text: 'I (chiều quy ước)',
          size: 13,
          anchor: 'end',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-e',
          x: 200,
          y: 88,
          text: 'electron trôi ngược chiều I',
          size: 13,
          anchor: 'middle',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-ct',
          x: 210,
          y: 232,
          text: 'I = q / t (ampe = culông mỗi giây)',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Đóng mạch: dòng điện quy ước chạy từ cực dương qua đèn về cực âm.' },
        { atMs: 2000, text: 'Trong dây kim loại, electron tự do lại trôi theo chiều ngược lại.' },
        { atMs: 4000, text: 'Hai cách mô tả cùng một hiện tượng — I = q/t vẫn tính như nhau.' },
      ],
    },
    grade: '11',
    chapterNumber: 4,
    chapterTitle: 'Dòng điện. Mạch điện',
    lessonNumber: 22,
    title: 'Cường độ dòng điện',
    hook:
      'Tại sao bóng đèn lại lập tức sáng lên ngay khi ta bật công tắc? ' +
      'Đó là nhờ dòng chảy của hàng tỉ tỉ electron tự do di chuyển có hướng dọc theo dây đồng. ' +
      'Độ mạnh của dòng chảy này chính là Cường độ dòng điện.',
    theory:
      'DÒNG ĐIỆN VÀ ĐIỀU KIỆN CÓ DÒNG ĐIỆN:\n' +
      '— Dòng điện là dòng dịch chuyển có hướng của các hạt mang điện tích.\n' +
      '— Điều kiện để có dòng điện: Phải có các hạt mang điện tự do và phải có một điện trường duy trì bên trong vật dẫn (do nguồn điện cung cấp).\n' +
      '— Chiều dòng điện: Được quy ước là chiều dịch chuyển có hướng của các điện tích dương (ngược chiều dịch chuyển của các electron tự do trong kim loại).\n\n' +
      'CƯỜNG ĐỘ DÒNG ĐIỆN (CURRENT INTENSITY):\n' +
      '— Cường độ dòng điện (I) là đại lượng đặc trưng cho tác dụng mạnh hay yếu của dòng điện. Đo bằng lượng điện tích dịch chuyển qua tiết diện thẳng của vật dẫn trong một đơn vị thời gian.\n' +
      '— Công thức cho dòng điện không đổi: I = q / t  ⇒  q = I * t.\n' +
      '  — I: Cường độ dòng điện. Đơn vị trong hệ SI: Ampere (A).\n' +
      '  — q: Điện tích chuyển qua tiết diện (C).\n' +
      '  — t: Thời gian dòng điện chạy qua (s).\n\n' +
      'MÔ HÌNH DÒNG ĐIỆN TRONG KIM LOẠI (DRIFT VELOCITY):\n' +
      '— I = n * S * v * e.\n' +
      '  — n: Mật độ electron tự do trong kim loại.\n' +
      '  — S: Diện tích tiết diện thẳng của dây dẫn.\n' +
      '  — v: Tốc độ trôi (tốc độ chuyển động có hướng của electron dưới tác dụng của điện trường).\n' +
      '  — e: Độ lớn điện tích của electron (e ≈ 1,6 * 10⁻¹⁹ C).',
    workedExample: {
      problem:
        'Một dây dẫn có dòng điện không đổi chạy qua. Trong thời gian t = 3 s, có một lượng điện tích q = 1,5 C ' +
        'dịch chuyển qua tiết diện thẳng của dây dẫn. Tính cường độ dòng điện chạy qua dây này.',
      steps: [
        'Xác định các thông số: điện tích q = 1,5 C, thời gian t = 3 s.',
        'Áp dụng công thức cường độ dòng điện không đổi: I = q / t.',
        'Thay số: I = 1,5 / 3 = 0,5 A.',
        'Kết luận: Cường độ dòng điện là 0,5 A (500 mA).',
      ],
      answer: 'I = 0,5 A.',
    },
    checkQuestions: [
      {
        prompt:
          'Viết công thức định nghĩa cường độ dòng điện không đổi I theo điện tích q và thời gian t.',
        choices: [
          { id: 'cur_1', label: 'I = q / t' },
          { id: 'cur_2', label: 'I = q * t' },
          { id: 'cur_3', label: 'q = I / t' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['cur_1'],
        },
        explain:
          'Cường độ dòng điện bằng lượng điện tích di chuyển qua tiết diện chia cho thời gian di chuyển: I = q/t.',
      },
      {
        prompt:
          'Một dòng điện không đổi có cường độ I = 0,2 A chạy qua một dây dẫn. Tính lượng điện tích dịch chuyển qua tiết diện dây dẫn trong thời gian 10 s.',
        answer: {
          kind: 'numeric',
          value: 2,
          unit: 'C',
        },
        explain:
          'Cường độ dòng điện không đổi chính là lượng điện tích qua tiết diện trong mỗi giây, nên q = I * t = 0,2 * 10 = 2 C. Công thức này chỉ dùng được khi dòng KHÔNG ĐỔI; dòng biến thiên thì phải tính theo diện tích dưới đồ thị i(t).',
      },
      {
        // Câu bẫy: lẫn chiều quy ước với chiều đi thật của electron.
        prompt:
          'Trong dây dẫn kim loại của một mạch điện kín đang hoạt động, các electron tự do chuyển động theo chiều nào so với chiều quy ước của dòng điện?',
        choices: [
          { id: 'cung_chieu', label: 'Cùng chiều, vì electron chính là hạt tạo ra dòng điện' },
          { id: 'nguoc_chieu', label: 'Ngược chiều, vì electron mang điện tích âm' },
          { id: 'khong_di', label: 'Electron đứng yên, chỉ có điện trường chạy trong dây' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['nguoc_chieu'],
        },
        explain:
          'Chiều quy ước của dòng điện được chọn là chiều chuyển động của các điện tích DƯƠNG (từ cực dương qua mạch ngoài về cực âm) — quy ước này có từ trước khi người ta phát hiện ra electron. ' +
          'Trong kim loại, hạt tải điện thật lại là electron mang điện tích âm, nên chúng trôi ngược chiều quy ước. Đây không phải mâu thuẫn: điện tích âm đi sang trái gây ra hiệu ứng y hệt điện tích dương đi sang phải, nên mọi công thức I = q/t, định luật Ohm… đều không đổi. ' +
          'Một điểm dễ nhầm nữa: electron trôi rất chậm (cỡ 0,1 mm/s), nhưng đèn sáng gần như tức thì vì điện trường lan trong dây với tốc độ gần bằng tốc độ ánh sáng và làm electron ở khắp nơi trong mạch cùng lúc chuyển động.',
      },
    ],
    srsCards: [
      {
        hoi: 'Đơn vị đo cường độ dòng điện trong hệ SI là gì?',
        dap: 'Ampere (A).',
      },
      {
        hoi: 'Chiều dòng điện được quy ước là chiều chuyển động của điện tích nào?',
        dap: 'Là chiều dịch chuyển có hướng của các điện tích dương.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly11-c4-b23',
    // Đặc tuyến vôn–ampe của vật dẫn kim loại là ĐƯỜNG THẲNG qua gốc; độ dốc chính là 1/R.
    animation: {
      title: 'Đặc tuyến vôn–ampe và ý nghĩa của điện trở',
      description:
        'Đồ thị cường độ dòng điện theo hiệu điện thế đặt vào một điện trở 10 Ω, vẽ dần lên khi ta tăng hiệu điện thế. Chấm sáng chạy dọc đường biểu diễn cho thấy: ở 3 V dòng là 0,3 A, ở 6 V dòng là 0,6 A, ở 9 V dòng là 0,9 A. Các điểm nằm đúng trên một ĐƯỜNG THẲNG ĐI QUA GỐC toạ độ, nghĩa là I tỉ lệ thuận với U — đó là định luật Ohm I = U/R. Mũi tên dòng điện dưới điện trở dài dần đúng theo cường độ dòng. Độ dốc của đường thẳng bằng 1/R: đường càng dốc thì điện trở càng nhỏ. R = U/I = 10 Ω là hằng số của vật dẫn ở nhiệt độ không đổi. Bóng đèn dây tóc thì KHÔNG cho đường thẳng: dây tóc nóng lên làm điện trở tăng.',
      viewBoxWidth: 380,
      viewBoxHeight: 230,
      durationMs: 4000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'truc-x',
          x1: 160,
          y1: 190,
          x2: 360,
          y2: 190,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'truc-y',
          x1: 160,
          y1: 190,
          x2: 160,
          y2: 40,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'polyline',
          id: 'dac-tuyen',
          points: [
            [160, 190],
            [340, 55],
          ],
          stroke: 'primary',
          strokeWidth: 3,
        },
        {
          kind: 'circle',
          id: 'con-tro-ua',
          cx: 160,
          cy: 190,
          r: 6,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 4000, dx: 180, dy: -135 },
          ],
        },
        {
          kind: 'line',
          id: 'day-trai',
          x1: 20,
          y1: 110,
          x2: 40,
          y2: 110,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'rect',
          id: 'dien-tro',
          x: 40,
          y: 98,
          w: 60,
          h: 24,
          rx: 2,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'day-phai',
          x1: 100,
          y1: 110,
          x2: 120,
          y2: 110,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'arrow',
          id: 'mui-ten-i',
          x1: 30,
          y1: 140,
          x2: 110,
          y2: 140,
          origin: [30, 140],
          stroke: 'primary',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, scale: 0.05 },
            { atMs: 4000, scale: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'moc-3v',
          x1: 220,
          y1: 186,
          x2: 220,
          y2: 194,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'moc-6v',
          x1: 280,
          y1: 186,
          x2: 280,
          y2: 194,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'nhan-3v',
          x: 220,
          y: 208,
          text: '3 V',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-6v',
          x: 280,
          y: 208,
          text: '6 V',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-i',
          x: 166,
          y: 52,
          text: 'I (A)',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-u',
          x: 362,
          y: 208,
          text: 'U (V)',
          size: 12,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-doc',
          x: 176,
          y: 78,
          text: 'độ dốc = 1/R',
          size: 12,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-ct',
          x: 12,
          y: 26,
          text: 'I = U/R — đường thẳng đi qua gốc toạ độ',
          size: 14,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-r',
          x: 70,
          y: 90,
          text: 'R = 10 Ω',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-dong',
          x: 70,
          y: 162,
          text: 'I tăng tỉ lệ với U',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-kl',
          x: 12,
          y: 222,
          text: 'R = U/I = 10 Ω là hằng số của vật dẫn, không đổi theo U',
          size: 11,
          anchor: 'start',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Bắt đầu từ U = 0: chưa có dòng điện.' },
        { atMs: 2000, text: 'U = 6 V cho I = 0,6 A — gấp đôi U thì gấp đôi I.' },
        { atMs: 4000, text: 'Các điểm đo nằm trên một đường thẳng qua gốc.' },
      ],
    },
    grade: '11',
    chapterNumber: 4,
    chapterTitle: 'Dòng điện. Mạch điện',
    lessonNumber: 23,
    title: 'Điện trở. Định luật Ohm',
    hook:
      'Đẩy nước qua một đường ống rộng thì rất dễ dàng, nhưng đẩy nước qua một đường ống hẹp nhét đầy cát thì cực kì khó khăn. ' +
      'Dây dẫn điện cũng cản trở dòng electron tương tự như vậy. Đại lượng này là Điện trở.',
    theory:
      'ĐIỆN TRỞ CỦA VẬT DẪN (RESISTANCE):\n' +
      '— Điện trở R đặc trưng cho mức độ cản trở dòng điện của vật dẫn. Đơn vị: Ohm (Ω).\n\n' +
      'ĐỊNH LUẬT OHM CHO ĐOẠN MẠCH CHỈ CÓ ĐIỆN TRỞ R:\n' +
      '— Phát biểu: Cường độ dòng điện chạy qua một vật dẫn tỉ lệ thuận với hiệu điện thế giữa hai đầu vật dẫn và tỉ lệ nghịch với điện trở của nó.\n' +
      '— Công thức: I = U / R  ⇒  R = U / I.\n\n' +
      'ĐIỆN TRỞ CỦA DÂY DẪN KIM LOẠI ĐỒNG TÍNH:\n' +
      '— R = ρ * L / S.\n' +
      '  — ρ: Điện trở suất của vật liệu dây dẫn (đơn vị: Ω.m). Điện trở suất phụ thuộc vào bản chất vật liệu và nhiệt độ (nhiệt độ tăng, ρ tăng).\n' +
      '  — L: Chiều dài dây dẫn (m).\n' +
      '  — S: Diện tích tiết diện ngang của dây dẫn (m²).',
    workedExample: {
      problem:
        'Một dây dẫn bằng đồng có chiều dài L = 10 m, diện tích tiết diện S = 0,1 mm² = 10⁻⁷ m². ' +
        'Biết điện trở suất của đồng là ρ = 1,6 * 10⁻⁸ Ω.m. Tính điện trở R của dây đồng này.',
      steps: [
        'Xác định các thông số ở đơn vị SI: L = 10 m, S = 10⁻⁷ m², ρ = 1,6 * 10⁻⁸ Ω.m.',
        'Áp dụng công thức tính điện trở dây dẫn: R = ρ * L / S.',
        'Thay số: R = 1,6 * 10⁻⁸ * 10 / 10⁻⁷.',
        'Tính toán: R = 1,6 * 10⁻⁷ / 10⁻⁷ = 1,6 Ω.',
      ],
      answer: 'R = 1,6 Ω.',
    },
    checkQuestions: [
      {
        prompt:
          'Viết công thức tính cường độ dòng điện I chạy qua một điện trở R dưới hiệu điện thế U theo Định luật Ohm.',
        choices: [
          { id: 'ohm_1', label: 'I = U / R' },
          { id: 'ohm_2', label: 'I = U * R' },
          { id: 'ohm_3', label: 'R = I / U' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['ohm_1'],
        },
        explain:
          'Cường độ dòng điện tỉ lệ thuận hiệu điện thế và tỉ lệ nghịch điện trở đoạn mạch: I = U/R.',
      },
      {
        prompt:
          'Đặt một hiệu điện thế U = 5 V vào hai đầu một điện trở R = 10 Ω. Hãy tính cường độ dòng điện chạy qua điện trở đó.',
        answer: {
          kind: 'numeric',
          value: 0.5,
          unit: 'A',
        },
        explain:
          'Định luật Ohm cho đoạn mạch chỉ có điện trở: I = U / R = 5 / 10 = 0,5 A. Điện trở càng lớn thì cùng một hiệu điện thế cho dòng càng nhỏ — quan hệ NGHỊCH, đừng nhân U với R.',
      },
    ],
    srsCards: [
      {
        hoi: 'Điện trở suất ρ của vật liệu thay đổi như thế nào khi nhiệt độ của vật dẫn kim loại tăng lên?',
        dap: 'Điện trở suất ρ của kim loại tăng lên khi nhiệt độ tăng.',
      },
      {
        hoi: 'Nêu công thức tính điện trở R của một sợi dây dẫn đồng tính dài L, tiết diện S và điện trở suất ρ.',
        dap: 'R = ρ * L / S.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly11-c4-b24',
    // Mạch kín: nguồn dùng lực lạ đẩy điện tích qua bên trong nó, nhờ vậy dòng chạy liên tục suốt vòng.
    animation: {
      title: 'Nguồn điện duy trì dòng chạy trong mạch kín',
      description:
        'Một mạch kín gồm nguồn điện ở cạnh trái và điện trở ở cạnh phải, bốn chấm điện tích chạy vòng quanh không nghỉ theo một chiều. Ở mạch ngoài, điện tích đi từ cực dương qua điện trở về cực âm, tức là đi từ nơi điện thế cao xuống nơi điện thế thấp — chúng "trôi xuống dốc" và nhả năng lượng ra cho điện trở. Nếu chỉ có vậy thì dòng sẽ tắt ngay khi hai cực cân bằng. Bên trong nguồn có LỰC LẠ — bản chất hoá học ở pin — làm việc ngược lại: nó đẩy điện tích từ cực âm trở về cực dương, tức là đẩy ngược lên dốc thế. Suất điện động đo chính công của lực lạ trên một đơn vị điện tích: ξ = A/q, với pin ξ = 1,5 V nghĩa là mỗi culông điện tích được nguồn cung cấp 1,5 J. Nhờ vòng tuần hoàn đó mà dòng điện chạy liên tục chứ không phải nguồn "chứa sẵn" dòng điện.',
      viewBoxWidth: 360,
      viewBoxHeight: 240,
      durationMs: 4000,
      loop: true,
      shapes: [
        {
          kind: 'polyline',
          id: 'mach',
          points: [
            [70, 70],
            [290, 70],
            [290, 180],
            [70, 180],
          ],
          closed: true,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        { kind: 'rect', id: 'nguon', x: 58, y: 100, w: 24, h: 50, rx: 3, fill: 'primary' },
        { kind: 'rect', id: 'dien-tro', x: 276, y: 100, w: 28, h: 50, rx: 3, fill: 'accent' },
        {
          kind: 'circle',
          id: 'hat-1',
          cx: 70,
          cy: 70,
          r: 6,
          fill: 'correct',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 1000, dx: 220, dy: 0 },
            { atMs: 2000, dx: 220, dy: 110 },
            { atMs: 3000, dx: 0, dy: 110 },
            { atMs: 4000, dx: 0, dy: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'hat-2',
          cx: 70,
          cy: 70,
          r: 6,
          fill: 'correct',
          keyframes: [
            { atMs: 0, dx: 220, dy: 0 },
            { atMs: 1000, dx: 220, dy: 110 },
            { atMs: 2000, dx: 0, dy: 110 },
            { atMs: 3000, dx: 0, dy: 0 },
            { atMs: 4000, dx: 220, dy: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'hat-3',
          cx: 70,
          cy: 70,
          r: 6,
          fill: 'correct',
          keyframes: [
            { atMs: 0, dx: 220, dy: 110 },
            { atMs: 1000, dx: 0, dy: 110 },
            { atMs: 2000, dx: 0, dy: 0 },
            { atMs: 3000, dx: 220, dy: 0 },
            { atMs: 4000, dx: 220, dy: 110 },
          ],
        },
        {
          kind: 'circle',
          id: 'hat-4',
          cx: 70,
          cy: 70,
          r: 6,
          fill: 'correct',
          keyframes: [
            { atMs: 0, dx: 0, dy: 110 },
            { atMs: 1000, dx: 0, dy: 0 },
            { atMs: 2000, dx: 220, dy: 0 },
            { atMs: 3000, dx: 220, dy: 110 },
            { atMs: 4000, dx: 0, dy: 110 },
          ],
        },
        {
          kind: 'arrow',
          id: 'chieu-dong',
          x1: 150,
          y1: 56,
          x2: 210,
          y2: 56,
          stroke: 'muted',
          strokeWidth: 3,
        },
        {
          kind: 'arrow',
          id: 'luc-la',
          x1: 70,
          y1: 146,
          x2: 70,
          y2: 104,
          stroke: 'muted',
          strokeWidth: 3,
        },
        {
          kind: 'label',
          id: 'nhan-nguon',
          x: 50,
          y: 128,
          text: 'nguồn',
          size: 11,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-cuc-duong',
          x: 50,
          y: 96,
          text: '+',
          size: 15,
          anchor: 'end',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-cuc-am',
          x: 50,
          y: 160,
          text: '−',
          size: 15,
          anchor: 'end',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-r',
          x: 268,
          y: 162,
          text: 'R (mạch ngoài)',
          size: 11,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-chieu',
          x: 180,
          y: 46,
          text: 'chiều dòng điện quy ước',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-luc-la',
          x: 92,
          y: 118,
          text: 'lực lạ đẩy điện tích',
          size: 11,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-luc-la-2',
          x: 92,
          y: 132,
          text: 'ngược lên dốc thế',
          size: 11,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-ct',
          x: 12,
          y: 26,
          text: 'ξ = A/q — pin 1,5 V cấp 1,5 J cho mỗi culông',
          size: 14,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-kl',
          x: 12,
          y: 212,
          text: 'Nguồn không chứa sẵn dòng điện —',
          size: 11,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-kl-2',
          x: 12,
          y: 228,
          text: 'nó duy trì hiệu điện thế cho dòng chạy',
          size: 11,
          anchor: 'start',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Điện tích rời cực dương, chạy trong mạch ngoài.' },
        { atMs: 2000, text: 'Qua điện trở, chúng nhả năng lượng và về tới cực âm.' },
        {
          atMs: 3000,
          text: 'Bên trong nguồn, lực lạ đẩy chúng trở lại cực dương — vòng khép kín.',
        },
      ],
    },
    grade: '11',
    chapterNumber: 4,
    chapterTitle: 'Dòng điện. Mạch điện',
    lessonNumber: 24,
    title: 'Nguồn điện',
    hook:
      'Để nước chảy tuần hoàn trong máng trượt nước, ta cần một máy bơm nước đẩy nước lên cao. ' +
      'Để dòng điện chạy tuần hoàn trong mạch, ta cũng cần một "máy bơm điện" để đẩy điện tích. Đó là Nguồn điện.',
    theory:
      'BẢN CHẤT CỦA NGUỒN ĐIỆN VÀ LỰC LẠ:\n' +
      '— Nguồn điện duy trì hiệu điện thế giữa hai cực của nó. Bên trong nguồn điện, các hạt mang điện chuyển động ngược chiều lực điện trường ' +
      'nhờ lực phi tĩnh điện gọi là lực lạ (lực hoá học trong pin, lực từ trong máy phát điện).\n\n' +
      'SUẤT ĐIỆN ĐỘNG CỦA NGUỒN ĐIỆN (ELECTROMOTIVE FORCE - EMF):\n' +
      '— Suất điện động (ξ, nhiều tài liệu kí hiệu là E) đặc trưng cho khả năng thực hiện công của nguồn điện (thực chất là của lực lạ) dịch chuyển điện tích dương từ cực âm sang cực dương bên trong nguồn.\n' +
      '— Công thức: ξ = A_lạ / q. Đơn vị: Volt (V).\n' +
      '— Điện trở trong (r): Nguồn điện được cấu tạo từ vật dẫn điện nên bản thân nó cũng có một điện trở cản trở dòng điện gọi là điện trở trong r.\n\n' +
      'ĐỊNH LUẬT OHM CHO TOÀN MẠCH (CLOSED CIRCUIT):\n' +
      '— Cường độ dòng điện chạy trong mạch điện kín tỉ lệ thuận với suất điện động của nguồn điện và tỉ lệ nghịch với điện trở toàn phần của mạch.\n' +
      '— Công thức: I = ξ / (R_ngoài + r)  ⇒  ξ = I * (R_ngoài + r) = U_ngoài + I * r.\n' +
      '  — R_ngoài: Tổng điện trở của các thiết bị tiêu thụ điện ngoài nguồn.\n' +
      '  — U_ngoài = I * R_ngoài: Hiệu điện thế mạch ngoài (độ sụt thế mạch ngoài).',
    workedExample: {
      problem:
        'Một nguồn điện có suất điện động ξ = 6 V, điện trở trong r = 1 Ω được mắc vào một bóng điện có điện trở R_ngoài = 5 Ω ' +
        'để tạo thành mạch kín. Tính cường độ dòng điện I chạy trong mạch và hiệu điện thế mạch ngoài U.',
      steps: [
        'Xác định các thông số: ξ = 6 V, r = 1 Ω, R_ngoài = 5 Ω.',
        'Áp dụng định luật Ohm cho toàn mạch: I = ξ / (R_ngoài + r).',
        'Thay số tính I: I = 6 / (5 + 1) = 6 / 6 = 1 A.',
        'Tính hiệu điện thế mạch ngoài: U = I * R_ngoài = 1 * 5 = 5 V.',
      ],
      answer: 'I = 1 A; U = 5 V.',
    },
    checkQuestions: [
      {
        prompt:
          'Viết công thức định luật Ohm cho toàn mạch kín gồm nguồn có suất điện động E, điện trở trong r và mạch ngoài có điện trở R.',
        choices: [
          { id: 'wh_1', label: 'I = E / (R + r)' },
          { id: 'wh_2', label: 'I = E / R + r' },
          { id: 'wh_3', label: 'I = (R + r) / E' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['wh_1'],
        },
        explain:
          'Cường độ dòng điện trong toàn mạch kín bằng suất điện động chia cho tổng điện trở mạch ngoài và điện trở trong: I = E/(R+r).',
      },
      {
        prompt:
          'Một nguồn điện có suất điện động E = 12 V, điện trở trong r = 2 Ω được mắc vào một điện trở ngoài R = 10 Ω tạo thành mạch kín. Tính cường độ dòng điện chạy qua mạch.',
        answer: {
          kind: 'numeric',
          value: 1,
          unit: 'A',
        },
        explain:
          'Với mạch KÍN phải cộng cả điện trở trong của nguồn vào mẫu số: I = E / (R + r) = 12 / (10 + 2) = 1 A. Bỏ quên r là lỗi phổ biến nhất của chương này — nó cho ra 1,2 A, cao hơn dòng thực tế.',
      },
    ],
    srsCards: [
      {
        hoi: 'Lực lạ bên trong nguồn điện có tác dụng gì?',
        dap: 'Tác dụng thắng lực điện trường để đẩy các hạt mang điện tích di chuyển ngược chiều tự nhiên (dương từ cực âm sang cực dương) nhằm duy trì hiệu điện thế.',
      },
      {
        hoi: 'Độ sụt thế trong nguồn điện được tính bằng công thức nào?',
        dap: 'U_trong = I * r (với I là cường độ dòng điện, r là điện trở trong của nguồn).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly11-c4-b25',
    // Điện trở toả nhiệt đều đặn: nhiệt lượng tích luỹ tăng TUYẾN TÍNH theo thời gian vì công suất không đổi.
    animation: {
      title: 'Nhiệt lượng toả ra tăng đều theo thời gian',
      description:
        'Dòng điện 2 A chạy qua một điện trở 6 Ω mắc vào hiệu điện thế 12 V. Bên trái, các chấm điện tích liên tục chạy qua điện trở và những vạch nhiệt loé lên quanh nó — mỗi lần điện tích đi qua là một phần năng lượng điện biến thành nhiệt. Bên phải, đồ thị nhiệt lượng tích luỹ theo thời gian là một ĐƯỜNG THẲNG dốc lên đi qua gốc: cứ mỗi giây điện trở lại nhận thêm đúng ngần ấy joule, không nhanh hơn cũng không chậm lại. Độ dốc của đường thẳng chính là công suất P = UI = 12 × 2 = 24 W, cũng bằng I²R = 2² × 6 = 24 W. Sau 60 giây nhiệt lượng toả ra là Q = Pt = 24 × 60 = 1440 J, đúng theo định luật Joule–Lenz Q = I²Rt. Công suất là tốc độ tiêu thụ năng lượng, còn nhiệt lượng là tổng đã tiêu thụ — hai đại lượng khác nhau, đừng lẫn.',
      viewBoxWidth: 380,
      viewBoxHeight: 230,
      durationMs: 4000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'day-trai',
          x1: 20,
          y1: 110,
          x2: 60,
          y2: 110,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'circle',
          id: 'hat-1',
          cx: 24,
          cy: 110,
          r: 5,
          fill: 'correct',
          keyframes: [
            { atMs: 0, dx: 0, opacity: 1 },
            { atMs: 2000, dx: 122, opacity: 1 },
            { atMs: 2001, dx: 122, opacity: 0 },
            { atMs: 2099, dx: 0, opacity: 0 },
            { atMs: 2100, dx: 0, opacity: 1 },
            { atMs: 4000, dx: 116, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'hat-2',
          cx: 24,
          cy: 110,
          r: 5,
          fill: 'correct',
          keyframes: [
            { atMs: 0, dx: 61, opacity: 1 },
            { atMs: 1000, dx: 122, opacity: 1 },
            { atMs: 1001, dx: 122, opacity: 0 },
            { atMs: 1099, dx: 0, opacity: 0 },
            { atMs: 1100, dx: 0, opacity: 1 },
            { atMs: 3000, dx: 116, opacity: 1 },
            { atMs: 3001, dx: 116, opacity: 0 },
            { atMs: 3099, dx: 0, opacity: 0 },
            { atMs: 3100, dx: 0, opacity: 1 },
            { atMs: 4000, dx: 55, opacity: 1 },
          ],
        },
        { kind: 'rect', id: 'dien-tro', x: 60, y: 92, w: 60, h: 36, rx: 3, fill: 'accent' },
        {
          kind: 'line',
          id: 'day-phai',
          x1: 120,
          y1: 110,
          x2: 150,
          y2: 110,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'arrow',
          id: 'nhiet-1',
          x1: 74,
          y1: 88,
          x2: 66,
          y2: 62,
          stroke: 'danger',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, opacity: 0.2 },
            { atMs: 600, opacity: 1 },
            { atMs: 1200, opacity: 0.2 },
            { atMs: 1800, opacity: 1 },
            { atMs: 2400, opacity: 0.2 },
            { atMs: 3000, opacity: 1 },
            { atMs: 3600, opacity: 0.2 },
            { atMs: 4000, opacity: 0.6 },
          ],
        },
        {
          kind: 'arrow',
          id: 'nhiet-2',
          x1: 106,
          y1: 88,
          x2: 114,
          y2: 62,
          stroke: 'danger',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 600, opacity: 0.2 },
            { atMs: 1200, opacity: 1 },
            { atMs: 1800, opacity: 0.2 },
            { atMs: 2400, opacity: 1 },
            { atMs: 3000, opacity: 0.2 },
            { atMs: 3600, opacity: 1 },
            { atMs: 4000, opacity: 0.6 },
          ],
        },
        {
          kind: 'line',
          id: 'truc-x',
          x1: 190,
          y1: 190,
          x2: 365,
          y2: 190,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'truc-y',
          x1: 190,
          y1: 190,
          x2: 190,
          y2: 40,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'polyline',
          id: 'do-thi-q',
          points: [
            [190, 190],
            [340, 55],
          ],
          stroke: 'primary',
          strokeWidth: 3,
        },
        {
          kind: 'circle',
          id: 'con-tro-q',
          cx: 190,
          cy: 190,
          r: 5,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 4000, dx: 150, dy: -135 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-r',
          x: 90,
          y: 114,
          text: 'R = 6 Ω',
          size: 12,
          anchor: 'middle',
          fill: 'surface',
        },
        {
          kind: 'label',
          id: 'nhan-ui',
          x: 20,
          y: 150,
          text: 'U = 12 V · I = 2 A',
          size: 12,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-p',
          x: 20,
          y: 170,
          text: 'P = UI = I²R = 24 W',
          size: 12,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-q',
          x: 196,
          y: 52,
          text: 'Q (J)',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-t',
          x: 367,
          y: 208,
          text: 't (s)',
          size: 12,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-doc',
          x: 196,
          y: 84,
          text: 'độ dốc = P = 24 W',
          size: 12,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-ket',
          x: 196,
          y: 222,
          text: 'Sau 60 s: Q = I²Rt = 1440 J',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-nhiet',
          x: 90,
          y: 52,
          text: 'toả nhiệt',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Dòng 2 A chạy qua điện trở 6 Ω, điện trở nóng lên.' },
        { atMs: 2000, text: 'Nhiệt lượng tích luỹ tăng đều — đồ thị là đường thẳng.' },
        { atMs: 4000, text: 'Độ dốc của đường thẳng chính là công suất 24 W.' },
      ],
    },
    grade: '11',
    chapterNumber: 4,
    chapterTitle: 'Dòng điện. Mạch điện',
    lessonNumber: 25,
    title: 'Năng lượng và công suất điện',
    hook:
      'Hằng tháng, gia đình chúng ta trả tiền điện dựa trên số "chữ" điện ghi trên công-tơ. ' +
      'Các "chữ" điện này thực chất là gì và chúng ta tính toán điện năng tiêu thụ của các thiết bị như thế nào?',
    theory:
      'CÔNG CỦA DÒNG ĐIỆN VÀ ĐIỆN NĂNG TIÊU THỤ (ELECTRICAL WORK):\n' +
      '— Khi dòng điện chạy qua một đoạn mạch dưới hiệu điện thế U, lực điện trường sinh công dịch chuyển điện tích q, công này bằng điện năng tiêu thụ của đoạn mạch.\n' +
      '— Công thức: A = U * q = U * I * t.\n' +
      '  — A: Điện năng tiêu thụ (J). Đơn vị thực tế: Kilowatt-giờ (kWh). 1 kWh = 3.600.000 J (3,6 MJ).\n\n' +
      'CÔNG SUẤT ĐIỆN (ELECTRICAL POWER):\n' +
      '— Công suất điện tiêu thụ của một đoạn mạch đặc trưng cho tốc độ tiêu thụ điện năng của đoạn mạch đó, đo bằng điện năng tiêu thụ trong một đơn vị thời gian.\n' +
      '— Công thức: P = A / t = U * I.\n  — P: Công suất điện. Đơn vị: Watt (W).\n\n' +
      'ĐỊNH LUẬT JOULE - LENZ (nhiệt lượng toả ra trên điện trở R):\n' +
      '— Khi dòng điện chạy qua một đoạn mạch chỉ có điện trở thuần R, toàn bộ điện năng biến đổi thành nhiệt năng toả ra môi trường.\n' +
      '— Công thức nhiệt lượng: Q = R * I² * t.\n' +
      '— Công suất toả nhiệt của vật dẫn: P = Q / t = R * I² = U² / R.',
    workedExample: {
      problem:
        'Một chiếc ấm đun nước điện chạy ở hiệu điện thế U = 220 V và cường độ dòng điện chạy qua ấm là I = 5 A. ' +
        'a) Tính công suất tiêu thụ điện P của chiếc ấm.\n' +
        'b) Tính điện năng tiêu thụ A của ấm khi hoạt động liên tục trong thời gian t = 10 phút.',
      steps: [
        'Tính công suất điện tiêu thụ P: P = U * I = 220 * 5 = 1100 W = 1,1 kW.',
        'Đổi thời gian đun nước sang đơn vị giây: t = 10 phút = 10 * 60 = 600 s.',
        'Tính điện năng tiêu thụ A: A = P * t = 1100 * 600 = 660000 J = 660 kJ.',
        'Kết luận: Công suất tiêu thụ là 1100 W, điện năng đun nước tiêu thụ trong 10 phút là 660 kJ.',
      ],
      answer: 'P = 1100 W; A = 660000 J.',
    },
    checkQuestions: [
      {
        prompt:
          'Viết công thức tính công suất điện tiêu thụ P của một đoạn mạch có hiệu điện thế U và dòng điện I.',
        choices: [
          { id: 'pw_1', label: 'P = U * I' },
          { id: 'pw_2', label: 'P = U / I' },
          { id: 'pw_3', label: 'P = I / U' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['pw_1'],
        },
        explain:
          'Công suất tiêu thụ bằng tích hiệu điện thế và cường độ dòng điện chạy qua đoạn mạch: P = UI.',
      },
      {
        prompt:
          'Một bóng đèn có điện trở R = 20 Ω chạy dòng điện cường độ I = 2 A. Tính công suất toả nhiệt của bóng đèn này.',
        answer: {
          kind: 'numeric',
          value: 80,
          unit: 'W',
        },
        explain:
          'Công suất toả nhiệt theo định luật Joule–Lenz: P = R * I² = 20 * 2² = 20 * 4 = 80 W. Chú ý I được BÌNH PHƯƠNG — dòng tăng gấp đôi thì nhiệt toả ra tăng gấp bốn, đó là lí do dây dẫn quá tải nóng lên rất nhanh.',
      },
    ],
    srsCards: [
      {
        hoi: 'Một số điện (1 kWh) tương đương bao nhiêu Joule (J)?',
        dap: 'Tương đương 3.600.000 J (hoặc 3,6 MJ).',
      },
      {
        hoi: 'Nêu công thức tính nhiệt lượng Q toả ra trên điện trở thuần R trong thời gian t theo định luật Joule-Lenz.',
        dap: 'Q = R * I² * t.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly11-c4-b26',
    // Bốn điểm đo U–I nằm trên một đường thẳng dốc xuống: giao với trục U cho ξ, độ dốc cho −r.
    animation: {
      title: 'Đọc suất điện động và điện trở trong từ đồ thị U–I',
      description:
        'Thí nghiệm đo pin: thay đổi điện trở mạch ngoài, mỗi lần ghi lại một cặp số đo của ampe kế và vôn kế, được bốn điểm lần lượt hiện lên trên đồ thị U theo I. Bốn điểm nằm gần như trên một ĐƯỜNG THẲNG DỐC XUỐNG chứ không phải nằm ngang: dòng càng lớn thì hiệu điện thế hai đầu pin càng tụt, vì một phần suất điện động bị tiêu hao ngay bên trong pin. Vẽ đường thẳng khớp nhất qua bốn điểm rồi kéo dài ra: chỗ nó cắt trục U ứng với I = 0 cho suất điện động ξ = 1,5 V — đó là hiệu điện thế khi pin chưa phải cấp dòng. Độ dốc của đường thẳng bằng −r, đo được −0,5 nên điện trở trong r = 0,5 Ω. Toàn bộ nội dung này gói trong công thức U = ξ − I·r, và cũng giải thích vì sao pin cũ (r lớn) tụt áp mạnh khi bật thiết bị ngốn dòng.',
      viewBoxWidth: 380,
      viewBoxHeight: 230,
      durationMs: 5000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'truc-x',
          x1: 60,
          y1: 190,
          x2: 340,
          y2: 190,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'truc-y',
          x1: 60,
          y1: 190,
          x2: 60,
          y2: 62,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'circle',
          id: 'diem-1',
          cx: 110,
          cy: 115,
          r: 5,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 600, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'diem-2',
          cx: 160,
          cy: 130,
          r: 5,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1200, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'diem-3',
          cx: 210,
          cy: 145,
          r: 5,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1800, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'diem-4',
          cx: 260,
          cy: 160,
          r: 5,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'polyline',
          id: 'duong-khop',
          points: [
            [60, 100],
            [300, 172],
          ],
          stroke: 'primary',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3000, opacity: 0 },
            { atMs: 3400, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'giao-truc-u',
          cx: 60,
          cy: 100,
          r: 7,
          stroke: 'correct',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4000, opacity: 0 },
            { atMs: 4300, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'canh-ngang',
          x1: 180,
          y1: 136,
          x2: 260,
          y2: 136,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '4 3',
        },
        {
          kind: 'line',
          id: 'canh-dung',
          x1: 260,
          y1: 136,
          x2: 260,
          y2: 160,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '4 3',
        },
        {
          kind: 'label',
          id: 'nhan-u',
          x: 66,
          y: 72,
          text: 'U (V)',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-i',
          x: 342,
          y: 208,
          text: 'I (A)',
          size: 12,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-xi',
          x: 54,
          y: 96,
          text: 'ξ = 1,5 V',
          size: 12,
          anchor: 'end',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-doc',
          x: 268,
          y: 132,
          text: 'độ dốc = −r = −0,5',
          size: 12,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-ct',
          x: 12,
          y: 26,
          text: 'U = ξ − I·r',
          size: 15,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-y-nghia',
          x: 12,
          y: 48,
          text: 'Cắt trục U (I = 0) cho ξ · độ dốc cho điện trở trong r',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-kl',
          x: 12,
          y: 222,
          text: 'Dòng càng lớn, U hai đầu pin càng tụt — pin cũ r lớn nên tụt mạnh',
          size: 11,
          anchor: 'start',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 600, text: 'Đổi điện trở mạch ngoài, ghi cặp số đo thứ nhất.' },
        { atMs: 2400, text: 'Bốn điểm đo nằm trên một đường thẳng dốc xuống.' },
        { atMs: 4300, text: 'Kéo dài tới I = 0 đọc được ξ = 1,5 V; độ dốc cho r = 0,5 Ω.' },
      ],
    },
    grade: '11',
    chapterNumber: 4,
    chapterTitle: 'Dòng điện. Mạch điện',
    lessonNumber: 26,
    title: 'Thực hành: Đo suất điện động và điện trở trong của pin điện hoá',
    hook:
      'Làm thế nào xác định chính xác các thông số ẩn của một viên pin tiểu như suất điện động ξ và điện trở trong r ' +
      'khi không thể bóc viên pin ra để đo? Ta sử dụng phương pháp đồ thị vôn-ampe.',
    theory:
      'SƠ ĐỒ THÍ NGHIỆM ĐO ξ VÀ r:\n' +
      '— Mạch điện gồm: Pin cần đo mắc nối tiếp với một ampe kế (đo I), một biến trở R để thay đổi tải và một khoá K.\n' +
      '— Mắc một vôn kế song song với hai cực của nguồn pin (đo hiệu điện thế mạch ngoài U).\n\n' +
      'PHƯƠNG PHÁP ĐỒ THỊ (PHƯƠNG PHÁP TOÀN MẠCH):\n' +
      '— Theo định luật Ohm toàn mạch: U = ξ - I * r.\n' +
      '— Tiến hành đo nhiều lần cặp giá trị (U, I) bằng cách thay đổi giá trị biến trở R. Vẽ đồ thị U = f(I) trên hệ trục toạ độ.\n' +
      '— Đặc điểm đồ thị U = f(I): Là một đoạn thẳng nghiêng xuống.\n' +
      '  — Điểm cắt trục tung (khi dòng điện I = 0): U_max = ξ (đọc được giá trị suất điện động).\n' +
      '  — Độ dốc của đường thẳng chính là giá trị điện trở trong r: r = |ΔU / ΔI|.',
    workedExample: {
      problem:
        'Trong một bài thực hành đo ξ và r của pin điện hoá, học sinh thu được đồ thị U = f(I) cắt trục tung tại điểm U = 1,5 V. ' +
        'Khi dòng điện trong mạch đạt I = 0,5 A thì vôn kế chỉ U = 1,3 V. Tính suất điện động ξ và điện trở trong r của pin.',
      steps: [
        'Xác định suất điện động từ giao điểm trục tung (I = 0): ξ = U_max = 1,5 V.',
        'Áp dụng phương trình đặc trưng nguồn điện: U = ξ - I * r.',
        'Thay số khi I = 0,5 A và U = 1,3 V: 1,3 = 1,5 - 0,5 * r.',
        'Giải phương trình tính r: 0,5 * r = 1,5 - 1,3 = 0,2 ⇔ r = 0,2 / 0,5 = 0,4 Ω.',
      ],
      answer: 'ξ = 1,5 V; r = 0,4 Ω.',
    },
    checkQuestions: [
      {
        prompt:
          'Trong sơ đồ mạch điện thực hành đo suất điện động và điện trở trong của pin, vôn kế được mắc như thế nào với pin?',
        choices: [
          { id: 'vm_1', label: 'Mắc song song với hai cực của pin' },
          { id: 'vm_2', label: 'Mắc nối tiếp với ampe kế' },
          { id: 'vm_3', label: 'Mắc song song với biến trở duy nhất' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['vm_1'],
        },
        explain:
          'Vôn kế đo hiệu điện thế mạch ngoài (giữa hai cực nguồn pin) nên cần mắc song song với hai cực của pin.',
      },
      {
        prompt:
          'Từ phương trình U = E - I * r, nếu kết quả đo thực nghiệm chỉ ra: khi dòng điện mạch hở (I = 0) vôn kế chỉ 1,5 V, và khi dòng điện I = 0,5 A vôn kế chỉ 1,3 V. Hãy tính điện trở trong r của pin.',
        answer: {
          kind: 'numeric',
          value: 0.4,
          unit: 'ohm',
        },
        explain:
          'U = E - I*r ⇔ 1,3 = 1,5 - 0,5*r ⇔ r = 0,4 Ω. Khi mạch hở (I = 0) thì U = E, đó là cách đo suất điện động E bằng vôn kế lí tưởng (gần như không lấy dòng của pin).',
      },
    ],
    srsCards: [
      {
        hoi: 'Tại sao khi dòng điện I tăng lên thì hiệu điện thế mạch ngoài U lại giảm đi?',
        dap: 'Vì sụt thế trong nguồn I*r tăng lên làm giảm hiệu điện thế đầu ra U = E - I*r.',
      },
      {
        hoi: 'Làm thế nào để tìm suất điện động E từ đồ thị U = f(I) của thực nghiệm?',
        dap: 'Tìm giao điểm của đoạn đồ thị kéo dài với trục tung U (ứng với I = 0).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
