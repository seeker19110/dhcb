// lessons/hoa11c3.ts — Hoá học 11, Chương 3: Đại cương hoá học hữu cơ (5 bài).
// Đối chiếu mục lục thật: tai-lieu-sgk/SGK-Hoa/11/page_0004.png (OCR 2026-08-31).
// reviewStatus='draft' — soạn từ docs/research/kho-kien-thuc-hoa-gdpt2018.md §3, chưa duyệt.
import type { ChemLesson } from '../lessonTypes.js'

export const HOA11_C3_LESSONS: ChemLesson[] = [
  {
    id: 'hoa11-c3-b10',
    grade: '11',
    chapterNumber: 3,
    chapterTitle: 'Đại cương hoá học hữu cơ',
    lessonNumber: 10,
    title: 'Hợp chất hữu cơ và hoá học hữu cơ',
    hook:
      'Từ thức ăn chúng ta ăn, quần áo chúng ta mặc, cho đến DNA quy định sự sống — tất cả đều cấu tạo ' +
      'từ hợp chất hữu cơ. Hoá học hữu cơ chính là hoá học của nguyên tố Carbon.',
    theory:
      'KHÁI NIỆM HỢP CHẤT HỮU CƠ VÀ HOÁ HỌC HỮU CƠ:\n' +
      '— Hợp chất hữu cơ là hợp chất của carbon (trừ một số chất vô cơ đơn giản như CO, CO₂, muối carbonate, muối cyanide, carbide...).\n' +
      '— Hoá học hữu cơ là ngành hoá học nghiên cứu các hợp chất hữu cơ.\n\n' +
      'PHÂN LOẠI HỢP CHẤT HỮU CƠ:\n' +
      '— Hydrocarbon: chỉ chứa hai nguyên tố Carbon (C) và Hydrogen (H) trong phân tử (ví dụ: CH₄, C₂H₄, C₆H₆).\n' +
      '— Dẫn xuất của hydrocarbon: ngoài C và H, trong phân tử còn có các nguyên tố khác như O, N, S, Halogen... (ví dụ: C₂H₅OH, CH₃COOH, C₆H₅NH₂).\n\n' +
      'ĐẶC ĐIỂM CHUNG CỦA HỢP CHẤT HỮU CƠ:\n' +
      '— Cấu tạo: Liên kết hoá học chủ yếu là liên kết cộng hoá trị.\n' +
      '— Tính chất vật lí: Nhiệt độ nóng chảy và nhiệt độ sôi thấp (dễ bay hơi), hầu hết không tan hoặc ít tan trong nước, tan nhiều trong dung môi hữu cơ.\n' +
      '— Tính chất hoá học: Thường kém bền nhiệt (dễ cháy); phản ứng hoá học xảy ra chậm, theo nhiều hướng khác nhau tạo ra hỗn hợp sản phẩm (hiệu suất không cao).',
    workedExample: {
      problem:
        'Phân tích định tính một chất hữu cơ X thấy khi đốt cháy X tạo ra CO₂ và H₂O. ' +
        'Xác định xem phân tử chất X bắt buộc phải chứa những nguyên tố nào, và có thể chứa nguyên tố nào.',
      steps: [
        'Đốt cháy X sinh ra CO₂ ⇒ sản phẩm có nguyên tố C ⇒ C phải lấy từ chất hữu cơ X (vì đốt trong oxygen O₂ không chứa C). Do đó X bắt buộc phải chứa Carbon (C).',
        'Đốt cháy X sinh ra H₂O ⇒ sản phẩm có nguyên tố H ⇒ H phải lấy từ chất hữu cơ X (vì oxygen O₂ không chứa H). Do đó X bắt buộc phải chứa Hydrogen (H).',
        'Sản phẩm cháy chứa Oxygen (O) nhưng Oxygen này có thể lấy từ O₂ dùng để đốt cháy hoặc từ chính phân tử X. Do đó X có thể chứa Oxygen (O) hoặc không.',
        'Kết luận: X bắt buộc chứa C, H và có thể chứa O.',
      ],
      answer: 'Bắt buộc chứa C, H; có thể chứa O',
    },
    checkQuestions: [
      {
        prompt: 'Hợp chất nào sau đây là hợp chất hữu cơ?',
        choices: [
          { id: 'co2', label: 'CO₂ (carbon dioxide)' },
          { id: 'c2h5oh', label: 'C₂H₅OH (ethanol)' },
          { id: 'caco3', label: 'CaCO₃ (calcium carbonate)' },
          { id: 'nacn', label: 'NaCN (sodium cyanide)' },
        ],
        answer: { kind: 'choice', correctIds: ['c2h5oh'] },
        explain:
          'C₂H₅OH là hợp chất của carbon không thuộc nhóm chất vô cơ ngoại lệ (như CO₂, muối carbonate, muối cyanide). Do đó C₂H₅OH là hợp chất hữu cơ.',
      },
      {
        prompt: 'Hợp chất hữu cơ nào sau đây thuộc loại dẫn xuất của hydrocarbon?',
        choices: [
          { id: 'ch4', label: 'CH₄ (methane)' },
          { id: 'c2h4', label: 'C₂H₄ (ethylene)' },
          { id: 'ch3cl', label: 'CH₃Cl (chloromethane)' },
          { id: 'c6h6', label: 'C₆H₆ (benzene)' },
        ],
        answer: { kind: 'choice', correctIds: ['ch3cl'] },
        explain:
          'CH₃Cl có chứa nguyên tố Cl ngoài C và H, nên thuộc loại dẫn xuất của hydrocarbon. Các chất CH₄, C₂H₄, C₆H₆ chỉ chứa C và H nên là hydrocarbon.',
      },
    ],
    srsCards: [
      {
        hoi: 'Định nghĩa hợp chất hữu cơ?',
        dap: 'Là hợp chất của carbon (trừ một số ít như CO, CO₂, muối carbonate, muối cyanide...).',
      },
      {
        hoi: 'Phân loại hợp chất hữu cơ gồm hai nhóm lớn nào?',
        dap: 'Hydrocarbon (chỉ chứa C, H) và Dẫn xuất của hydrocarbon (chứa C, H và nguyên tố khác như O, N, Cl...).',
      },
      {
        hoi: 'Liên kết hoá học chủ yếu trong hợp chất hữu cơ là gì?',
        dap: 'Liên kết cộng hoá trị.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c3-b11',
    grade: '11',
    chapterNumber: 3,
    chapterTitle: 'Đại cương hoá học hữu cơ',
    lessonNumber: 11,
    title: 'Phương pháp tách biệt và tinh chế hợp chất hữu cơ',
    hook:
      'Làm thế nào để lấy tinh dầu nguyên chất từ hoa bưởi tươi, hay tách cồn ra khỏi hỗn hợp cồn và ' +
      'nước? Nhà hoá học dùng các phương pháp vật lí dựa trên khác biệt về tính chất giữa các chất.',
    theory:
      'PHƯƠNG PHÁP CHƯNG CẤT (Distillation):\n' +
      '— Nguyên lí: Dựa trên sự khác biệt về NHIỆT ĐỘ SÔI của các chất trong hỗn hợp lỏng.\n' +
      '— Cách làm: Đun sôi hỗn hợp lỏng, chất có nhiệt độ sôi thấp hơn sẽ bay hơi trước, dẫn hơi qua ống sinh hàn để ngưng tụ thành chất lỏng tinh khiết (chưng cất phân đoạn dùng cho các chất có nhiệt độ sôi gần nhau, chưng cất lôi cuốn hơi nước dùng cho tinh dầu).\n\n' +
      'PHƯƠNG PHÁP CHIẾT (Extraction):\n' +
      '— Nguyên lí: Dựa trên sự khác biệt về ĐỘ TAN của các chất trong hai dung môi không trộn lẫn vào nhau (thường là nước và dung môi hữu cơ như ether, chloroform).\n' +
      '— Thiết bị: Dùng phễu chiết để tách riêng lớp dung dịch phía trên và lớp dung dịch phía dưới.\n\n' +
      'PHƯƠNG PHÁP KẾT TINH (Crystallization):\n' +
      '— Nguyên lí: Dựa trên sự khác biệt về ĐỘ TAN của chất rắn theo NHIỆT ĐỘ.\n' +
      '— Cách làm: Hoà tan chất rắn bẩn vào dung môi nóng tạo dung dịch bão hoà, lọc nóng để bỏ tạp chất không tan, để nguội cho chất cần tinh chế kết tinh lại dưới dạng tinh thể sạch, lọc lấy tinh thể.\n\n' +
      'PHƯƠNG PHÁP SẮC KÍ CỘT (Column Chromatography):\n' +
      '— Nguyên lí: Dựa trên sự khác biệt về khả năng HẤP PHỤ của pha tĩnh (như silica gel) và khả năng hoà tan trong pha động (dung môi) của các chất cần tách.',
    workedExample: {
      problem:
        'Để tách tinh dầu xả ra khỏi hỗn hợp chưng cất lôi cuốn hơi nước (gồm tinh dầu xả và nước lỏng, ' +
        'không tan vào nhau), ta nên dùng phương pháp tách biệt nào?',
      steps: [
        'Hỗn hợp cần tách gồm hai chất lỏng không tan vào nhau: tinh dầu xả (nhẹ hơn, nổi ở trên) và nước (ở dưới).',
        'Hai chất lỏng không tan vào nhau nên tách thành hai lớp riêng — đúng điều kiện để dùng phương pháp chiết lỏng - lỏng.',
        'Ta cho hỗn hợp vào phễu chiết, để yên cho phân lớp rõ rệt.',
        'Mở khoá phễu chiết để nước chảy hết ra ngoài, thu lấy lớp tinh dầu xả còn lại trong phễu.',
      ],
      answer: 'Phương pháp chiết',
    },
    checkQuestions: [
      {
        prompt:
          'Phương pháp chưng cất được sử dụng dựa trên sự khác biệt về tính chất vật lí nào của các chất?',
        choices: [
          { id: 'tan', label: 'Độ tan trong các dung môi' },
          { id: 'soi', label: 'Nhiệt độ sôi' },
          { id: 'khoi', label: 'Khối lượng riêng' },
          { id: 'kich', label: 'Kích thước hạt tinh thể' },
        ],
        answer: { kind: 'choice', correctIds: ['soi'] },
        explain:
          'Chưng cất dựa trên khác biệt về nhiệt độ sôi: chất sôi ở nhiệt độ thấp hơn bay hơi trước rồi được ngưng tụ lại. Khác biệt về độ tan là cơ sở của phương pháp chiết và kết tinh, còn khối lượng riêng hay kích thước hạt không quyết định thứ tự bay hơi.',
      },
      {
        prompt:
          'Để làm sạch muối ăn NaCl rắn có lẫn ít cát và tạp chất hữu cơ, ta hoà tan vào nước nóng, lọc bỏ cát, rồi cô bớt nước để muối kết tinh ra. Đây là phương pháp gì?',
        choices: [
          { id: 'chungcat', label: 'Chưng cất' },
          { id: 'chiet', label: 'Chiết' },
          { id: 'kettinh', label: 'Kết tinh' },
          { id: 'sacki', label: 'Sắc kí' },
        ],
        answer: { kind: 'choice', correctIds: ['kettinh'] },
        explain:
          'Quá trình hoà tan tạo dung dịch nóng, để nguội hoặc cô bớt dung môi để chất rắn tách ra dạng tinh thể gọi là phương pháp kết tinh.',
      },
    ],
    srsCards: [
      { hoi: 'Chưng cất dựa trên sự khác biệt gì?', dap: 'Nhiệt độ sôi của các chất lỏng.' },
      { hoi: 'Thiết bị dùng để thực hiện phương pháp chiết lỏng - lỏng?', dap: 'Phễu chiết.' },
      { hoi: 'Kết tinh dùng để tinh chế chất ở trạng thái nào?', dap: 'Chất rắn.' },
    ],
    animation: {
      title: 'Chưng cất: tách hai chất lỏng bằng chênh lệch nhiệt độ sôi',
      description:
        'Bình cầu bên trái chứa hỗn hợp ethanol và nước, bên dưới có ngọn lửa đun. Bầu nhiệt kế đặt ngang chỗ nhánh ra của cổ bình để đo đúng nhiệt độ của hơi đang đi sang ống sinh hàn: nó dừng quanh 78 °C — nhiệt độ sôi của ethanol, chất dễ bay hơi hơn. Các chấm rỗng là hơi bốc lên cổ bình, sang ống sinh hàn đặt dốc xuống; nước lạnh chạy trong vỏ ống theo chiều ngược lại (vào ở đầu thấp, ra ở đầu cao) nên hơi bị làm lạnh, ngưng tụ thành giọt (chấm đặc) và chảy xuống bình hứng bên phải. Bình hứng đầy dần phần cất giàu ethanol, còn nước (sôi 100 °C) phần lớn ở lại bình đun. Chất tách ra trước là chất có nhiệt độ sôi thấp hơn, và nó được thu ở phía bên kia ống sinh hàn chứ không phải trong bình đun.',
      viewBoxWidth: 470,
      viewBoxHeight: 266,
      durationMs: 8000,
      loop: true,
      shapes: [
        {
          kind: 'polyline',
          id: 'long-binh',
          points: [
            [114.7, 169.5],
            [112, 176.5],
            [107.9, 182.8],
            [102.5, 188.1],
            [96.2, 192.1],
            [89.2, 194.8],
            [81.7, 196],
            [74.2, 195.5],
            [66.9, 193.6],
            [60.3, 190.1],
            [54.4, 185.3],
            [49.7, 179.5],
            [46.3, 172.8],
          ],
          closed: true,
          fill: 'primary',
          opacity: 0.35,
        },
        {
          kind: 'polyline',
          id: 'binh',
          points: [
            [88, 122.9],
            [94.3, 124.8],
            [100.2, 127.8],
            [105.5, 131.8],
            [110, 136.7],
            [113.6, 142.2],
            [116.2, 148.4],
            [117.6, 154.8],
            [118, 161.4],
            [117.1, 168],
            [115.2, 174.3],
            [112.2, 180.2],
            [108.2, 185.5],
            [103.3, 190],
            [97.8, 193.6],
            [91.6, 196.2],
            [85.2, 197.6],
            [78.6, 198],
            [72, 197.1],
            [65.7, 195.2],
            [59.8, 192.2],
            [54.5, 188.2],
            [50, 183.3],
            [46.4, 177.8],
            [43.8, 171.6],
            [42.4, 165.2],
            [42, 158.6],
            [42.9, 152],
            [44.8, 145.7],
            [47.8, 139.8],
            [51.8, 134.5],
            [56.7, 130],
            [62.2, 126.4],
            [68.4, 123.8],
            [72, 122.9],
          ],
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'co-trai',
          x1: 72,
          y1: 122.9,
          x2: 72,
          y2: 56,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'co-phai',
          x1: 88,
          y1: 122.9,
          x2: 88,
          y2: 56,
          stroke: 'muted',
          strokeWidth: 2,
        },
        { kind: 'rect', id: 'nut', x: 69, y: 50, w: 22, h: 7, rx: 1, fill: 'muted' },
        {
          kind: 'polyline',
          id: 'ao-lanh',
          points: [
            [170, 81.7],
            [310, 128.3],
            [310, 150.3],
            [170, 103.7],
          ],
          closed: true,
          fill: 'accent',
          opacity: 0.25,
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'polyline',
          id: 'ong',
          points: [
            [88, 66],
            [150, 86],
            [330, 146],
            [344, 160],
          ],
          stroke: 'muted',
          strokeWidth: 5,
        },
        {
          kind: 'line',
          id: 'nhiet-ke',
          x1: 80,
          y1: 28,
          x2: 80,
          y2: 68,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        { kind: 'circle', id: 'bau-nk', cx: 80, cy: 69, r: 3, fill: 'danger' },
        {
          kind: 'arrow',
          id: 'nuoc-vao',
          x1: 300,
          y1: 176,
          x2: 300,
          y2: 149,
          stroke: 'accent',
          strokeWidth: 2,
        },
        {
          kind: 'arrow',
          id: 'nuoc-ra',
          x1: 180,
          y1: 83,
          x2: 180,
          y2: 60,
          stroke: 'accent',
          strokeWidth: 2,
        },
        {
          kind: 'polyline',
          id: 'lua',
          points: [
            [70, 222],
            [80, 202],
            [90, 222],
          ],
          closed: true,
          fill: 'warn',
          opacity: 0.9,
          origin: [80, 222],
          keyframes: [
            { atMs: 0, scaleY: 1 },
            { atMs: 500, scaleY: 0.8 },
            { atMs: 1000, scaleY: 1 },
            { atMs: 1500, scaleY: 0.8 },
            { atMs: 2000, scaleY: 1 },
            { atMs: 2500, scaleY: 0.8 },
            { atMs: 3000, scaleY: 1 },
            { atMs: 3500, scaleY: 0.8 },
            { atMs: 4000, scaleY: 1 },
            { atMs: 4500, scaleY: 0.8 },
            { atMs: 5000, scaleY: 1 },
            { atMs: 5500, scaleY: 0.8 },
            { atMs: 6000, scaleY: 1 },
            { atMs: 6500, scaleY: 0.8 },
            { atMs: 7000, scaleY: 1 },
            { atMs: 7500, scaleY: 0.8 },
            { atMs: 8000, scaleY: 1 },
          ],
        },
        {
          kind: 'polyline',
          id: 'binh-hung',
          points: [
            [318, 176],
            [318, 224],
            [378, 224],
            [378, 176],
          ],
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'rect',
          id: 'thu',
          x: 320,
          y: 204,
          w: 56,
          h: 18,
          fill: 'accent',
          opacity: 0.55,
          origin: [348, 222],
          keyframes: [
            { atMs: 1500, scaleY: 0.01 },
            { atMs: 7500, scaleY: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'hoi1',
          cx: 80,
          cy: 172,
          r: 4,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 1.8,
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 0 },
            { atMs: 150, opacity: 1 },
            { atMs: 1000, dx: 0, dy: -100 },
            { atMs: 1500, dx: 70, dy: -86 },
            { atMs: 2200, dx: 160, dy: -56, opacity: 1 },
            { atMs: 2350, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'giot1',
          cx: 240,
          cy: 116,
          r: 3.5,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 2200, dx: 0, dy: 0, opacity: 0 },
            { atMs: 2350, opacity: 1 },
            { atMs: 2800, dx: 90, dy: 30 },
            { atMs: 3000, dx: 104, dy: 46 },
            { atMs: 3500, dx: 104, dy: 90, opacity: 1 },
            { atMs: 3650, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'hoi2',
          cx: 80,
          cy: 172,
          r: 4,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 1.8,
          opacity: 0,
          keyframes: [
            { atMs: 1300, dx: 0, dy: 0, opacity: 0 },
            { atMs: 1450, opacity: 1 },
            { atMs: 2300, dx: 0, dy: -100 },
            { atMs: 2800, dx: 70, dy: -86 },
            { atMs: 3500, dx: 160, dy: -56, opacity: 1 },
            { atMs: 3650, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'giot2',
          cx: 240,
          cy: 116,
          r: 3.5,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 3500, dx: 0, dy: 0, opacity: 0 },
            { atMs: 3650, opacity: 1 },
            { atMs: 4100, dx: 90, dy: 30 },
            { atMs: 4300, dx: 104, dy: 46 },
            { atMs: 4800, dx: 104, dy: 90, opacity: 1 },
            { atMs: 4950, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'hoi3',
          cx: 80,
          cy: 172,
          r: 4,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 1.8,
          opacity: 0,
          keyframes: [
            { atMs: 2600, dx: 0, dy: 0, opacity: 0 },
            { atMs: 2750, opacity: 1 },
            { atMs: 3600, dx: 0, dy: -100 },
            { atMs: 4100, dx: 70, dy: -86 },
            { atMs: 4800, dx: 160, dy: -56, opacity: 1 },
            { atMs: 4950, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'giot3',
          cx: 240,
          cy: 116,
          r: 3.5,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 4800, dx: 0, dy: 0, opacity: 0 },
            { atMs: 4950, opacity: 1 },
            { atMs: 5400, dx: 90, dy: 30 },
            { atMs: 5600, dx: 104, dy: 46 },
            { atMs: 6100, dx: 104, dy: 90, opacity: 1 },
            { atMs: 6250, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'hoi4',
          cx: 80,
          cy: 172,
          r: 4,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 1.8,
          opacity: 0,
          keyframes: [
            { atMs: 3900, dx: 0, dy: 0, opacity: 0 },
            { atMs: 4050, opacity: 1 },
            { atMs: 4900, dx: 0, dy: -100 },
            { atMs: 5400, dx: 70, dy: -86 },
            { atMs: 6100, dx: 160, dy: -56, opacity: 1 },
            { atMs: 6250, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'giot4',
          cx: 240,
          cy: 116,
          r: 3.5,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 6100, dx: 0, dy: 0, opacity: 0 },
            { atMs: 6250, opacity: 1 },
            { atMs: 6700, dx: 90, dy: 30 },
            { atMs: 6900, dx: 104, dy: 46 },
            { atMs: 7400, dx: 104, dy: 90, opacity: 1 },
            { atMs: 7550, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'nkt',
          x: 92,
          y: 40,
          text: '78 °C',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'sht',
          x: 250,
          y: 80,
          text: 'ống sinh hàn',
          size: 10,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'ra-t',
          x: 186,
          y: 60,
          text: 'nước ra',
          size: 9,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'vao-t',
          x: 294,
          y: 184,
          text: 'nước lạnh vào',
          size: 9,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'lua-t',
          x: 98,
          y: 218,
          text: 'đun nóng',
          size: 10,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'hht',
          x: 20,
          y: 244,
          text: 'bình đun: ethanol + nước',
          size: 10,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'thut',
          x: 348,
          y: 244,
          text: 'bình hứng: phần cất giàu ethanol',
          size: 10,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'conlai',
          x: 20,
          y: 260,
          text: 'nước (sôi 100 °C) phần lớn ở lại bình đun',
          size: 10,
          anchor: 'start',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 5800, opacity: 0 },
            { atMs: 6200, opacity: 1 },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Đun hỗn hợp: ethanol sôi ở 78 °C nên bay hơi trước nước; nhiệt kế đo nhiệt độ của hơi ở chỗ nhánh ra.',
        },
        {
          atMs: 1500,
          text: 'Hơi đi vào ống sinh hàn; nước lạnh chạy ngược chiều trong vỏ làm hơi ngưng tụ thành giọt.',
        },
        { atMs: 3000, text: 'Giọt lỏng chảy xuống bình hứng: phần cất giàu ethanol.' },
        {
          atMs: 6200,
          text: 'Nước (sôi 100 °C) phần lớn ở lại bình đun — hai chất đã được tách ra.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c3-b12',
    grade: '11',
    chapterNumber: 3,
    chapterTitle: 'Đại cương hoá học hữu cơ',
    lessonNumber: 12,
    title: 'Công thức phân tử hợp chất hữu cơ',
    hook:
      'Làm thế nào nhà hoá học biết một phân tử chứa chính xác bao nhiêu nguyên tử C, H, O? ' +
      'Bằng cách đốt cháy chất đó để định lượng, kết hợp phân tích phổ khối lượng (MS) hiện đại.',
    theory:
      'CÔNG THỨC ĐƠN GIẢN NHẤT (Empirical Formula):\n' +
      '— Công thức đơn giản nhất cho biết tỉ lệ số nguyên tử của các nguyên tố trong phân tử (ở dạng số nguyên tối giản).\n' +
      '— Cách thiết lập cho chất CxHyOz: x : y : z = nC : nH : nO = (%C / 12) : (%H / 1) : (%O / 16).\n\n' +
      'CÔNG THỨC PHÂN TỬ (Molecular Formula):\n' +
      '— Công thức phân tử cho biết số lượng nguyên tử thực tế của mỗi nguyên tố trong một phân tử chất.\n' +
      '— Công thức phân tử là bội số nguyên của công thức đơn giản nhất: (Công thức đơn giản nhất)n.\n\n' +
      'XÁC ĐỊNH KHỐI LƯỢNG PHÂN TỬ BẰNG PHỔ KHỐI LƯỢNG (MS):\n' +
      '— Phương pháp phổ khối lượng (Mass Spectrometry - MS) được dùng để xác định phân tử khối của chất hữu cơ.\n' +
      '— Trên giản đồ phổ MS, mảnh ion phân tử [M⁺] có giá trị m/z lớn nhất (thường ở ngoài cùng bên phải) tương ứng với khối lượng phân tử của chất đó.',
    workedExample: {
      problem:
        'Một chất hữu cơ X có phần trăm khối lượng các nguyên tố là 85,7% C và 14,3% H. ' +
        'Tìm công thức đơn giản nhất của X.',
      steps: [
        'Đặt công thức tổng quát của X là CxHy.',
        'Lập tỉ lệ số mol các nguyên tố: x : y = (%C / 12) : (%H / 1).',
        'Thay số: x : y = (85,7 / 12) : (14,3 / 1) = 7,14 : 14,3.',
        'Chia cả hai số cho số nhỏ nhất (7,14) để tối giản: x : y = 1 : 2.',
        'Kết luận: Công thức đơn giản nhất của X là CH₂.',
      ],
      answer: 'CH2',
    },
    checkQuestions: [
      {
        prompt:
          'Phương pháp phân tích hiện đại nào được sử dụng phổ biến nhất để xác định trực tiếp khối lượng phân tử của một chất hữu cơ?',
        choices: [
          { id: 'ms', label: 'Phổ khối lượng (MS)' },
          { id: 'ir', label: 'Phổ hồng ngoại (IR)' },
          { id: 'uv', label: 'Phổ tử ngoại (UV-Vis)' },
          { id: 'nmr', label: 'Phổ cộng hưởng từ hạt nhân (NMR)' },
        ],
        answer: { kind: 'choice', correctIds: ['ms'] },
        explain:
          'Phổ khối lượng (MS) cho biết giá trị m/z của ion phân tử, từ đó xác định chính xác khối lượng phân tử.',
      },
      {
        prompt:
          'Một chất hữu cơ Y có công thức đơn giản nhất là CH₂O và phân tử khối bằng 60 g/mol. Hãy tìm công thức phân tử của Y.',
        choices: [
          { id: 'ch2o', label: 'CH₂O' },
          { id: 'c2h4o2', label: 'C₂H₄O₂' },
          { id: 'c3h6o3', label: 'C₃H₆O₃' },
          { id: 'c4h8o4', label: 'C₄H₈O₄' },
        ],
        answer: { kind: 'choice', correctIds: ['c2h4o2'] },
        explain:
          'Công thức phân tử có dạng (CH₂O)n. Ta có phân tử khối = (12 + 2 + 16) * n = 30 * n = 60 ⇒ n = 2. Vậy công thức phân tử là C₂H₄O₂.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức đơn giản nhất cho biết điều gì?',
        dap: 'Tỉ lệ số nguyên tử của các nguyên tố trong phân tử ở dạng tối giản.',
      },
      {
        hoi: 'Mảnh ion nào trên phổ MS cho biết khối lượng phân tử?',
        dap: 'Mảnh ion phân tử [M⁺] có giá trị m/z lớn nhất.',
      },
      {
        hoi: 'Mối quan hệ giữa công thức phân tử và công thức đơn giản nhất?',
        dap: 'Công thức phân tử = (Công thức đơn giản nhất)n với n là số nguyên dương.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c3-b13',
    grade: '11',
    chapterNumber: 3,
    chapterTitle: 'Đại cương hoá học hữu cơ',
    lessonNumber: 13,
    title: 'Cấu tạo hoá học hợp chất hữu cơ',
    hook:
      'Ethanol (cồn) và dimethyl ether có cùng công thức phân tử C₂H₆O. Nhưng ethanol là chất lỏng, còn ' +
      'dimethyl ether là chất khí dùng làm nhiên liệu. Khác biệt nằm ở trật tự liên kết giữa các nguyên tử.',
    theory:
      'THUYẾT CẤU TẠO HOÁ HỌC (Butlerov):\n' +
      '1. Trong phân tử hợp chất hữu cơ, các nguyên tử liên kết với nhau theo ĐÚNG THỨ TỰ và bằng hoá trị của chúng. Carbon luôn có hoá trị IV, Hydrogen hoá trị I, Oxygen hoá trị II, Nitrogen hoá trị III.\n' +
      '2. Nguyên tử Carbon không chỉ liên kết với nguyên tử của nguyên tố khác mà còn có thể liên kết trực tiếp với nhau tạo thành MẠCH CARBON (mạch hở không phân nhánh, mạch hở phân nhánh, mạch vòng).\n' +
      '3. Tính chất của chất phụ thuộc vào THÀNH PHẦN phân tử và CẤU TẠO hoá học (thứ tự liên kết).\n\n' +
      'ĐỒNG PHÂN (Isomerism):\n' +
      '— Đồng phân là các chất khác nhau có cùng công thức phân tử nhưng khác nhau về cấu tạo hoá học (nên tính chất khác nhau).\n' +
      '— Ví dụ: CH₃-CH₂-OH (ethanol) và CH₃-O-CH₃ (dimethyl ether) là đồng phân của nhau.\n\n' +
      'ĐỒNG ĐẲNG (Homology):\n' +
      '— Đồng đẳng là các chất có cấu tạo và tính chất hoá học tương tự nhau, nhưng thành phần phân tử hơn kém nhau một hay nhiều nhóm −CH₂−.\n' +
      '— Ví dụ: CH₄, C₂H₆, C₃H₈... lập thành dãy đồng đẳng alkane.\n\n' +
      'PHỔ HỒNG NGOẠI (IR):\n' +
      '— Phổ hồng ngoại (Infrared Spectroscopy - IR) được dùng để xác định các nhóm chức đặc trưng trong phân tử (ví dụ: nhóm −OH có tín hiệu đặc trưng ở vùng 3200 - 3600 cm⁻¹; nhóm C=O ở vùng 1600 - 1850 cm⁻¹).',
    workedExample: {
      problem:
        'Viết công thức cấu tạo thu gọn của các đồng phân cấu tạo có công thức phân tử C₃H₈O.',
      steps: [
        'Carbon có hoá trị IV, Oxygen hoá trị II, Hydrogen hoá trị I.',
        'Mạch carbon có 3 C: C-C-C. Nhóm chức chứa oxygen có thể là nhóm alcohol (−OH) hoặc ether (−O−).',
        'Đồng phân alcohol: đính nhóm −OH vào vị trí carbon số 1 hoặc số 2:\n  (1) CH₃-CH₂-CH₂-OH\n  (2) CH₃-CH(OH)-CH₃',
        'Đồng phân ether: chen nguyên tử O vào giữa mạch carbon:\n  (3) CH₃-CH₂-O-CH₃',
        'Kết luận: C₃H₈O có 3 đồng phân cấu tạo.',
      ],
      answer: '3 đồng phân',
    },
    checkQuestions: [
      {
        prompt: 'Trong hợp chất hữu cơ, nguyên tử Carbon luôn có hoá trị bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 4 },
        explain:
          'Theo thuyết cấu tạo hoá học, carbon luôn thể hiện hoá trị IV trong mọi hợp chất hữu cơ, tức luôn tạo đúng 4 liên kết.',
      },
      {
        prompt:
          'Các chất có cùng công thức phân tử nhưng có cấu tạo hoá học khác nhau được gọi là gì?',
        choices: [
          { id: 'dongdang', label: 'Đồng đẳng' },
          { id: 'dongphan', label: 'Đồng phân' },
          { id: 'dongvi', label: 'Đồng vị' },
          { id: 'donghinh', label: 'Đồng hình' },
        ],
        answer: { kind: 'choice', correctIds: ['dongphan'] },
        explain:
          'Đồng phân là những chất khác nhau có cùng công thức phân tử nhưng khác cấu tạo hoá học. Đồng đẳng thì khác công thức phân tử (hơn kém nhau nhóm −CH₂−); đồng vị nói về nguyên tử cùng số proton khác số neutron, không phải hợp chất.',
      },
    ],
    srsCards: [
      {
        hoi: 'Hoá trị của C, H, O trong hợp chất hữu cơ?',
        dap: 'Carbon hoá trị IV, Hydrogen hoá trị I, Oxygen hoá trị II.',
      },
      {
        hoi: 'Đồng phân là gì?',
        dap: 'Các chất khác nhau có cùng công thức phân tử nhưng cấu tạo hoá học khác nhau.',
      },
      {
        hoi: 'Đồng đẳng là gì?',
        dap: 'Các chất có cấu tạo/tính chất tương tự nhau nhưng thành phần phân tử hơn kém nhau một hay nhiều nhóm −CH₂−.',
      },
      {
        hoi: 'Phổ hồng ngoại (IR) dùng để xác định cái gì?',
        dap: 'Các nhóm chức hoá học đặc trưng có trong phân tử.',
      },
    ],
    animation: {
      title: 'Cùng công thức phân tử C₂H₆O, hai cấu tạo cho hai chất khác hẳn nhau',
      description:
        'Bắt đầu bằng đúng một bộ nguyên tử: 2 carbon, 6 hydrogen, 1 oxygen. Các nguyên tử tự xếp lại theo cách thứ nhất — oxygen nằm ở đầu mạch, nối với một hydrogen — cho ethanol CH₃–CH₂–OH: chất lỏng, sôi ở 78 °C, tan vô hạn trong nước, tác dụng với natri sinh khí hydrogen. Rồi chúng xếp lại theo cách thứ hai — oxygen chen vào giữa hai carbon — cho dimethyl ether CH₃–O–CH₃: chất khí, sôi ở −24 °C, tan trong nước có giới hạn, không phản ứng với natri. Cùng số nguyên tử mà tính chất chênh nhau cả trăm độ, vì tính chất do TRẬT TỰ liên kết quyết định chứ không do công thức phân tử.',
      viewBoxWidth: 460,
      viewBoxHeight: 230,
      durationMs: 8000,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'ctpt',
          x: 230,
          y: 30,
          text: 'C₂H₆O',
          size: 20,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'ctptb',
          x: 230,
          y: 50,
          text: '2 C · 6 H · 1 O',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'arrow',
          id: 'nhanh1',
          x1: 200,
          y1: 62,
          x2: 120,
          y2: 92,
          stroke: 'muted',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 600,
              opacity: 0,
            },
            {
              atMs: 1000,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'nhanh2',
          x1: 260,
          y1: 62,
          x2: 340,
          y2: 92,
          stroke: 'muted',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3600,
              opacity: 0,
            },
            {
              atMs: 4000,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'c1a',
          cx: 70,
          cy: 120,
          r: 18,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1000,
              opacity: 0,
            },
            {
              atMs: 1400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'c2a',
          cx: 120,
          cy: 120,
          r: 18,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1000,
              opacity: 0,
            },
            {
              atMs: 1400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'oa',
          cx: 170,
          cy: 120,
          r: 18,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1000,
              opacity: 0,
            },
            {
              atMs: 1400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'c1at',
          x: 70,
          y: 125,
          text: 'CH₃',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1000,
              opacity: 0,
            },
            {
              atMs: 1400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'c2at',
          x: 120,
          y: 125,
          text: 'CH₂',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1000,
              opacity: 0,
            },
            {
              atMs: 1400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'oat',
          x: 170,
          y: 125,
          text: 'OH',
          size: 11,
          anchor: 'middle',
          fill: 'accent',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1000,
              opacity: 0,
            },
            {
              atMs: 1400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'ba1',
          x1: 88,
          y1: 120,
          x2: 102,
          y2: 120,
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1000,
              opacity: 0,
            },
            {
              atMs: 1400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'ba2',
          x1: 138,
          y1: 120,
          x2: 152,
          y2: 120,
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1000,
              opacity: 0,
            },
            {
              atMs: 1400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'na',
          x: 120,
          y: 162,
          text: 'ethanol',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1800,
              opacity: 0,
            },
            {
              atMs: 2200,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'na2',
          x: 120,
          y: 182,
          text: 'lỏng · sôi 78 °C · tan vô hạn',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1800,
              opacity: 0,
            },
            {
              atMs: 2200,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'na3',
          x: 120,
          y: 200,
          text: 'tác dụng Na sinh H₂',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2600,
              opacity: 0,
            },
            {
              atMs: 3000,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'c1b',
          cx: 290,
          cy: 120,
          r: 18,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4000,
              opacity: 0,
            },
            {
              atMs: 4400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'ob',
          cx: 340,
          cy: 120,
          r: 18,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4000,
              opacity: 0,
            },
            {
              atMs: 4400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'c2b',
          cx: 390,
          cy: 120,
          r: 18,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4000,
              opacity: 0,
            },
            {
              atMs: 4400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'c1bt',
          x: 290,
          y: 125,
          text: 'CH₃',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4000,
              opacity: 0,
            },
            {
              atMs: 4400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'obt',
          x: 340,
          y: 125,
          text: 'O',
          size: 11,
          anchor: 'middle',
          fill: 'accent',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4000,
              opacity: 0,
            },
            {
              atMs: 4400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'c2bt',
          x: 390,
          y: 125,
          text: 'CH₃',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4000,
              opacity: 0,
            },
            {
              atMs: 4400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'bb1',
          x1: 308,
          y1: 120,
          x2: 322,
          y2: 120,
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4000,
              opacity: 0,
            },
            {
              atMs: 4400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'bb2',
          x1: 358,
          y1: 120,
          x2: 372,
          y2: 120,
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4000,
              opacity: 0,
            },
            {
              atMs: 4400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nb',
          x: 340,
          y: 162,
          text: 'dimethyl ether',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4800,
              opacity: 0,
            },
            {
              atMs: 5200,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nb2',
          x: 340,
          y: 182,
          text: 'khí · sôi −24 °C · tan hạn chế',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4800, opacity: 0 },
            { atMs: 5200, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nb3',
          x: 340,
          y: 200,
          text: 'không phản ứng với Na',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5600,
              opacity: 0,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'kl',
          x: 230,
          y: 222,
          text: 'Trật tự liên kết quyết định tính chất, không phải số nguyên tử',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 6400,
              opacity: 0,
            },
            {
              atMs: 6900,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Cùng một bộ nguyên tử C₂H₆O có thể lắp theo hai trật tự khác nhau.',
        },
        {
          atMs: 1800,
          text: 'Cách 1 — oxygen ở đầu mạch: ethanol, lỏng, sôi 78 °C, tan vô hạn.',
        },
        {
          atMs: 4800,
          text: 'Cách 2 — oxygen chen giữa: dimethyl ether, khí, sôi −24 °C.',
        },
        {
          atMs: 6400,
          text: 'Hai đồng phân cấu tạo: khác trật tự liên kết nên khác hẳn tính chất.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c3-b14',
    grade: '11',
    chapterNumber: 3,
    chapterTitle: 'Đại cương hoá học hữu cơ',
    lessonNumber: 14,
    title: 'Ôn tập chương 3 — Đại cương hoá học hữu cơ',
    hook:
      'Chương 3 mở ra cánh cổng vào thế giới Hoá học hữu cơ rộng lớn, trang bị các công cụ định lượng ' +
      'và tư duy cấu trúc phân tử để ta bước tiếp vào các nhóm hydrocarbon cụ thể.',
    theory:
      'TÓM TẮT NỘI DUNG CHƯƠNG 3:\n' +
      '1. Hợp chất hữu cơ là hợp chất của Carbon. Chia làm Hydrocarbon (C, H) và Dẫn xuất (chứa O, N, S, halogen...).\n' +
      '2. Bốn phương pháp tinh chế: Chưng cất (nhiệt độ sôi), Chiết (độ tan trong dung môi), Kết tinh (độ tan rắn theo nhiệt độ), Sắc kí cột (khả năng hấp phụ).\n' +
      '3. Công thức phân tử CxHyOz tính từ tỉ lệ phần trăm khối lượng: x : y : z = %C/12 : %H/1 : %O/16. Phân tử khối xác định bằng phổ khối lượng (MS) từ đỉnh ion phân tử [M⁺].\n' +
      '4. Thuyết cấu tạo hoá học: trật tự liên kết nguyên tử xác định tính chất; Carbon hoá trị IV, tạo được mạch C.\n' +
      '5. Đồng phân: cùng CTPT, khác cấu tạo. Đồng đẳng: cấu tạo tương tự, hơn kém nhóm −CH₂−. Phổ IR dùng để nhận biết nhóm chức.',
    workedExample: {
      problem:
        'Một hydrocarbon mạch hở Y có công thức đơn giản nhất là CH₃. Biết phân tử khối của Y là 30 g/mol. ' +
        'Xác định công thức phân tử của Y.',
      steps: [
        'Công thức phân tử của Y có dạng (CH₃)n với n là số nguyên dương.',
        'Phân tử khối của Y là M = (12 + 1*3) * n = 15n = 30.',
        'Giải ra n: n = 30 / 15 = 2.',
        'Vậy công thức phân tử của Y là C₂H₆.',
      ],
      answer: 'C2H6',
    },
    checkQuestions: [
      {
        prompt: 'Chất nào sau đây là đồng đẳng của methane (CH₄)?',
        choices: [
          { id: 'c2h4', label: 'C₂H₄ (ethylene)' },
          { id: 'c2h6', label: 'C₂H₆ (ethane)' },
          { id: 'c2h2', label: 'C₂H₂ (acetylene)' },
          { id: 'c6h6', label: 'C₆H₆ (benzene)' },
        ],
        answer: { kind: 'choice', correctIds: ['c2h6'] },
        explain:
          'C₂H₆ hơn CH₄ một nhóm −CH₂− và có cùng công thức tổng quát của alkane (CₙH₂ₙ₊₂), cấu tạo tương tự nhau nên là đồng đẳng của nhau.',
      },
      {
        prompt:
          'Đỉnh ion phân tử [M⁺] có m/z bằng 46 trên phổ khối lượng MS của một alcohol. Phân tử khối của alcohol này bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 46 },
        explain:
          'Trị số m/z của đỉnh ion phân tử [M⁺] chính bằng phân tử khối của chất đó. Ở đây m/z = 46 tương ứng phân tử khối bằng 46 g/mol.',
      },
    ],
    srsCards: [
      {
        hoi: 'Hai nhóm lớn của hợp chất hữu cơ là gì?',
        dap: 'Hydrocarbon và Dẫn xuất của hydrocarbon.',
      },
      {
        hoi: 'Đỉnh [M⁺] trên phổ MS giúp xác định điều gì?',
        dap: 'Khối lượng phân tử của chất hữu cơ.',
      },
      { hoi: 'Tín hiệu hấp thụ nhóm −OH trên phổ IR nằm ở đâu?', dap: 'Vùng 3200 - 3600 cm⁻¹.' },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
