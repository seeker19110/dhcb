// lessons/ly10c7.ts — Vật lí 10, Chương 7: Biến dạng của vật rắn. Áp suất chất lỏng (2 bài).
import type { PhysicsLesson } from '../lessonTypes.js'

export const LY10_C7_LESSONS: PhysicsLesson[] = [
  {
    id: 'ly10-c7-b33',
    // Treo thêm quả nặng, lò xo dãn thêm đúng tỉ lệ; đồ thị F–Δl là đường thẳng qua gốc toạ độ.
    animation: {
      title: 'Lò xo dãn tỉ lệ với lực kéo',
      description:
        'Bên trái là một lò xo treo thẳng đứng, bên phải là đồ thị lực kéo F theo độ dãn Δl được vẽ đồng thời. Khi treo quả nặng 1 N, đầu dưới lò xo tụt xuống 2 cm và điểm thứ nhất hiện lên trên đồ thị tại toạ độ (2 cm; 1 N). Treo thêm một quả nữa thành 2 N, lò xo dãn tiếp thành 4 cm và điểm thứ hai hiện tại (4 cm; 2 N). Nối hai điểm với gốc toạ độ được một ĐƯỜNG THẲNG đi qua O: lực gấp đôi thì độ dãn gấp đôi, đúng định luật Hooke F = k·Δl với độ cứng k = 1 : 0,02 = 50 N/m chính là độ dốc của đường thẳng. Quan hệ thẳng này chỉ đúng trong giới hạn đàn hồi; kéo quá mức thì đồ thị cong đi và lò xo không co lại như cũ nữa.',
      viewBoxWidth: 380,
      viewBoxHeight: 230,
      durationMs: 5000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'gia-treo',
          x1: 30,
          y1: 30,
          x2: 130,
          y2: 30,
          stroke: 'neutral',
          strokeWidth: 4,
        },
        {
          kind: 'polyline',
          id: 'lo-xo',
          points: [
            [80, 30],
            [94, 40],
            [66, 52],
            [94, 64],
            [66, 76],
            [94, 88],
            [66, 100],
            [80, 110],
          ],
          stroke: 'primary',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, scale: 1, dy: 0 },
            { atMs: 1000, scale: 1, dy: 0 },
            { atMs: 1800, scale: 1.375, dy: 15 },
            { atMs: 3000, scale: 1.375, dy: 15 },
            { atMs: 3800, scale: 1.75, dy: 30 },
            { atMs: 5000, scale: 1.75, dy: 30 },
          ],
        },
        {
          kind: 'rect',
          id: 'qua-nang',
          x: 62,
          y: 110,
          w: 36,
          h: 26,
          rx: 3,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 1000, dy: 0 },
            { atMs: 1800, dy: 30 },
            { atMs: 3000, dy: 30 },
            { atMs: 3800, dy: 60 },
            { atMs: 5000, dy: 60 },
          ],
        },
        {
          kind: 'line',
          id: 'moc-0',
          x1: 106,
          y1: 110,
          x2: 130,
          y2: 110,
          stroke: 'muted',
          strokeWidth: 1.5,
          dash: '3 3',
        },
        {
          kind: 'line',
          id: 'moc-2',
          x1: 106,
          y1: 140,
          x2: 130,
          y2: 140,
          stroke: 'muted',
          strokeWidth: 1.5,
          dash: '3 3',
        },
        {
          kind: 'line',
          id: 'moc-4',
          x1: 106,
          y1: 170,
          x2: 130,
          y2: 170,
          stroke: 'muted',
          strokeWidth: 1.5,
          dash: '3 3',
        },
        {
          kind: 'line',
          id: 'truc-x',
          x1: 220,
          y1: 190,
          x2: 360,
          y2: 190,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'truc-y',
          x1: 220,
          y1: 190,
          x2: 220,
          y2: 50,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'polyline',
          id: 'duong-hooke',
          points: [
            [220, 190],
            [320, 90],
          ],
          stroke: 'primary',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4200, opacity: 0 },
            { atMs: 4400, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'diem-1',
          cx: 270,
          cy: 140,
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
          id: 'diem-2',
          cx: 320,
          cy: 90,
          r: 5,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3800, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-f',
          x: 226,
          y: 62,
          text: 'F (N)',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-dl',
          x: 362,
          y: 206,
          text: 'Δl (cm)',
          size: 12,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-1n',
          x: 136,
          y: 144,
          text: '1 N → 2 cm',
          size: 11,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-2n',
          x: 136,
          y: 174,
          text: '2 N → 4 cm',
          size: 11,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-hooke',
          x: 14,
          y: 218,
          text: 'F = k·Δl với k = 50 N/m — đường thẳng qua gốc',
          size: 13,
          anchor: 'start',
          fill: 'primary',
        },
      ],
      captions: [
        { atMs: 1800, text: 'Treo 1 N: lò xo dãn 2 cm, điểm thứ nhất trên đồ thị.' },
        { atMs: 3800, text: 'Treo 2 N: dãn 4 cm, điểm thứ hai.' },
        { atMs: 4400, text: 'Hai điểm và gốc O nằm trên một đường thẳng: F tỉ lệ với Δl.' },
      ],
    },
    grade: '10',
    chapterNumber: 7,
    chapterTitle: 'Biến dạng của vật rắn. Áp suất chất lỏng',
    lessonNumber: 33,
    title: 'Biến dạng của vật rắn',
    hook:
      'Dây cung bắn tên hay tấm đệm nhún (trampoline) đều biến dạng rất nhiều rồi tự lấy lại hình dạng cũ. ' +
      'Nhưng nếu kéo quá mạnh, chúng sẽ bị méo mó vĩnh viễn. Đâu là ranh giới khoa học cho sự đàn hồi?',
    theory:
      'PHÂN LOẠI BIẾN DẠNG:\n' +
      '— Biến dạng đàn hồi: Vật lấy lại được hình dạng và kích thước ban đầu sau khi ngừng tác dụng lực.\n' +
      '— Biến dạng dẻo (không đàn hồi): Vật giữ nguyên hình dạng biến đổi sau khi lực ngừng tác dụng.\n' +
      '— Giới hạn đàn hồi: Lực tác dụng tối đa mà vật vẫn có thể phục hồi lại hình dạng cũ.\n\n' +
      'ĐẶC ĐIỂM BIẾN DẠNG KÉO VÀ NÉN:\n' +
      '— Biến dạng kéo: Chiều dài vật tăng lên (Δl > 0), các phân tử kéo ra xa nhau, lực đàn hồi xuất hiện hướng vào trong chống lại lực kéo.\n' +
      '— Biến dạng nén: Chiều dài vật giảm đi (Δl < 0), các phân tử ép sát nhau, lực đàn hồi hướng ra ngoài chống lại lực nén.\n\n' +
      'ĐỊNH LUẬT HOOKE (ĐỊNH LUẬT ĐÀN HỒI LÒ XO):\n' +
      '— Phát biểu: Trong giới hạn đàn hồi, độ lớn lực đàn hồi của lò xo tỉ lệ thuận với độ biến dạng của lò xo.\n' +
      '— Công thức: F_đh = k.|Δl|.\n' +
      '  — k: Độ cứng của lò xo, còn gọi là hệ số đàn hồi; k càng lớn thì lò xo càng khó biến dạng. ' +
      'Đơn vị: Newton trên mét (N/m).\n' +
      '  — Δl = l - l_o: Độ biến dạng của lò xo (l độ dài sau biến dạng, l_o độ dài tự nhiên ban đầu). Đơn vị: mét (m).',
    workedExample: {
      problem:
        'Một lò xo có độ cứng k = 100 N/m có chiều dài tự nhiên l_o = 15 cm. Treo thẳng đứng lò xo và móc vào đầu dưới ' +
        'một vật nặng để lò xo giãn ra đạt chiều dài l = 18 cm. Tính độ lớn lực đàn hồi xuất hiện và trọng lượng của vật treo (coi lò xo đứng yên).',
      steps: [
        'Đổi chiều dài tự nhiên l_o = 15 cm = 0,15 m. Chiều dài lúc sau l = 18 cm = 0,18 m.',
        'Tính độ biến dạng kéo của lò xo: |Δl| = l - l_o = 0,18 - 0,15 = 0,03 m.',
        'Áp dụng định luật Hooke để tính lực đàn hồi: F_đh = k.|Δl| = 100 * 0,03 = 3 (N).',
        'Vì vật treo đứng yên cân bằng nên trọng lượng P của vật bằng đúng độ lớn lực đàn hồi: P = F_đh = 3 N.',
      ],
      answer: 'Lực đàn hồi: 3 N; Trọng lượng vật: 3 N.',
    },
    checkQuestions: [
      {
        prompt:
          'Viết công thức tính độ lớn lực đàn hồi F_đh của lò xo có độ cứng k và độ biến dạng |Δl| theo Định luật Hooke.',
        choices: [
          { id: 'ct_1', label: 'F_đh = k * |Δl|' },
          { id: 'ct_2', label: 'F_đh = k / |Δl|' },
          { id: 'ct_3', label: 'F_đh = |Δl| / k' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['ct_1'],
        },
        explain:
          'Lực đàn hồi tỉ lệ THUẬN với độ biến dạng qua hệ số độ cứng k: kéo giãn gấp đôi thì lực đàn hồi gấp đôi. ' +
          'Hai phương án chia cho nhau đều cho điều vô lí: lò xo chưa biến dạng (Δl = 0) lại sinh ra lực vô cùng lớn.',
      },
      {
        prompt:
          'Một lò xo có độ cứng 200 N/m bị nén một đoạn 0,02 m. Tính độ lớn lực đàn hồi của lò xo xuất hiện lúc này.',
        answer: {
          kind: 'numeric',
          value: 4,
          unit: 'N',
        },
        explain:
          'Định luật Hooke: độ lớn lực đàn hồi tỉ lệ với ĐỘ BIẾN DẠNG, nén hay giãn đều tính như nhau nên lấy trị tuyệt đối: F_đh = k * |Δl| = 200 * 0,02 = 4 N. Lực này luôn hướng ngược chiều biến dạng — lò xo bị nén thì nó đẩy ra.',
      },
    ],
    srsCards: [
      {
        hoi: 'Độ cứng k của lò xo đo bằng đơn vị gì trong hệ SI?',
        dap: 'Newton trên mét (N/m).',
      },
      {
        hoi: 'Giới hạn đàn hồi là gì?',
        dap: 'Là giá trị lực tác dụng tối đa lên vật mà khi ngừng tác dụng lực vật vẫn có thể lấy lại hình dạng cũ.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c7-b34',
    // Ba lỗ ở ba độ sâu trên bình đặt cao: tia sâu hơn phun ra nhanh hơn và bay xa hơn vì p = ρgh.
    animation: {
      title: 'Lỗ càng sâu, nước phun ra càng mạnh',
      description:
        'Một bình nước đặt trên giá cao, thành bình có ba lỗ nhỏ như nhau ở độ sâu 10 cm, 20 cm và 30 cm kể từ mặt thoáng. Mở cùng lúc, ba tia nước vọt ngang ra rồi cong xuống vì trọng lực. Tia từ lỗ nông nhất yếu nhất và chạm sàn gần bình nhất; tia từ lỗ giữa mạnh hơn; tia từ lỗ sâu nhất vọt ra nhanh nhất, bay xa nhất và cũng chạm sàn sớm nhất vì nó xuất phát thấp hơn. Ba lỗ cùng kích thước, nước trong bình đứng yên, nên thứ duy nhất khác nhau là ĐỘ SÂU. Áp suất do cột chất lỏng gây ra là p = ρgh, chỉ phụ thuộc độ sâu chứ không phụ thuộc bề rộng hay hình dạng bình: ở 30 cm nó bằng 1000 × 10 × 0,3 = 3000 Pa, gấp ba lần ở 10 cm. Áp suất lớn hơn đẩy nước ra với tốc độ lớn hơn, đúng theo v = căn bậc hai của 2gh.',
      viewBoxWidth: 380,
      viewBoxHeight: 270,
      durationMs: 3000,
      loop: true,
      shapes: [
        {
          kind: 'rect',
          id: 'thanh-binh',
          x: 40,
          y: 44,
          w: 90,
          h: 106,
          rx: 2,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        { kind: 'rect', id: 'nuoc', x: 42, y: 50, w: 86, h: 98, fill: 'primary', opacity: 0.35 },
        {
          kind: 'line',
          id: 'mat-thoang',
          x1: 42,
          y1: 50,
          x2: 128,
          y2: 50,
          stroke: 'accent',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'chan-trai',
          x1: 58,
          y1: 150,
          x2: 58,
          y2: 250,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'chan-phai',
          x1: 112,
          y1: 150,
          x2: 112,
          y2: 250,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'san',
          x1: 20,
          y1: 250,
          x2: 370,
          y2: 250,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'circle',
          id: 'tia-nong',
          cx: 132,
          cy: 80,
          r: 5,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 1 },
            { atMs: 650, dx: 35.7, dy: 10.6 },
            { atMs: 1300, dx: 71.4, dy: 42.5 },
            { atMs: 1950, dx: 107.1, dy: 95.6 },
            { atMs: 2600, dx: 142.8, dy: 170, opacity: 1 },
            { atMs: 2700, dx: 142.8, dy: 170, opacity: 0 },
            { atMs: 3000, dx: 142.8, dy: 170, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'tia-giua',
          cx: 132,
          cy: 110,
          r: 5,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 1 },
            { atMs: 590, dx: 45.8, dy: 8.8 },
            { atMs: 1180, dx: 91.7, dy: 35 },
            { atMs: 1769, dx: 137.5, dy: 78.8 },
            { atMs: 2359, dx: 183.3, dy: 140, opacity: 1 },
            { atMs: 2459, dx: 183.3, dy: 140, opacity: 0 },
            { atMs: 3000, dx: 183.3, dy: 140, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'tia-sau',
          cx: 132,
          cy: 140,
          r: 5,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 1 },
            { atMs: 523, dx: 49.7, dy: 6.9 },
            { atMs: 1046, dx: 99.5, dy: 27.5 },
            { atMs: 1569, dx: 149.2, dy: 61.9 },
            { atMs: 2092, dx: 198.9, dy: 110, opacity: 1 },
            { atMs: 2192, dx: 198.9, dy: 110, opacity: 0 },
            { atMs: 3000, dx: 198.9, dy: 110, opacity: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'sau-1',
          x1: 34,
          y1: 50,
          x2: 34,
          y2: 80,
          stroke: 'muted',
          strokeWidth: 1.5,
          dash: '3 3',
        },
        {
          kind: 'line',
          id: 'sau-3',
          x1: 24,
          y1: 50,
          x2: 24,
          y2: 140,
          stroke: 'muted',
          strokeWidth: 1.5,
          dash: '3 3',
        },
        {
          kind: 'label',
          id: 'nhan-h1',
          x: 124,
          y: 84,
          text: '10 cm',
          size: 11,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-h2',
          x: 124,
          y: 114,
          text: '20 cm',
          size: 11,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-h3',
          x: 124,
          y: 144,
          text: '30 cm',
          size: 11,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-p3',
          x: 140,
          y: 64,
          text: 'Lỗ sâu 30 cm: p = ρgh = 3000 Pa',
          size: 11,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-ct',
          x: 14,
          y: 24,
          text: 'p = ρgh — chỉ phụ thuộc độ sâu, không phụ thuộc bề rộng bình',
          size: 12,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-kl',
          x: 14,
          y: 266,
          text: 'Càng sâu áp suất càng lớn, nước vọt ra càng nhanh: v = √(2gh)',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Mở cùng lúc ba lỗ ở độ sâu 10, 20 và 30 cm.' },
        {
          atMs: 1200,
          text: 'Tia ở lỗ sâu nhất vọt ra ngang xa nhất trong cùng một khoảng thời gian.',
        },
        { atMs: 2600, text: 'Ba tia chạm sàn ở ba khoảng cách khác hẳn nhau.' },
      ],
    },
    grade: '10',
    chapterNumber: 7,
    chapterTitle: 'Biến dạng của vật rắn. Áp suất chất lỏng',
    lessonNumber: 34,
    title: 'Khối lượng riêng. Áp suất chất lỏng',
    hook:
      'Tại sao một chiếc tàu sân bay bằng thép khổng lồ có thể nổi ung dung trên mặt biển, trong khi một cây kim khâu nhỏ bằng sắt ' +
      'lại chìm nghỉm ngay lập tức? Câu trả lời nằm ở khái niệm khối lượng riêng và áp suất.',
    theory:
      'KHỐI LƯỢNG RIÊNG (DENSITY):\n' +
      '— Khối lượng riêng (ρ) của một chất là khối lượng của một đơn vị thể tích chất đó.\n' +
      '— Công thức: ρ = m / V (m là khối lượng, V là thể tích). Đơn vị trong hệ SI: kg/m³.\n\n' +
      'ÁP SUẤT (PRESSURE):\n' +
      '— Áp suất là độ lớn của áp lực (lực nén vuông góc) tác dụng lên một đơn vị diện tích bị ép.\n' +
      '— Công thức: p = F / S. Đơn vị trong hệ SI: Pascal (Pa), với 1 Pa = 1 N/m².\n\n' +
      'ÁP SUẤT CHẤT LỎNG (HYDROSTATIC PRESSURE):\n' +
      '— Chất lỏng tác dụng áp suất lên đáy bình, thành bình và mọi điểm trong lòng chất lỏng.\n' +
      '— Công thức tính áp suất chất lỏng ở độ sâu h tính từ mặt thoáng chất lỏng:\n' +
      '  — p = p_o + ρ.g.h (p_o là áp suất khí quyển bề mặt thoáng, ρ là khối lượng riêng chất lỏng).\n' +
      '  — Áp suất tĩnh của riêng cột chất lỏng: p_tĩnh = ρ.g.h.\n\n' +
      'LỰC ĐẨY ARCHIMEDES (BUOYANT FORCE):\n' +
      '— Lực đẩy tác dụng lên một vật chìm trong chất lưu hướng thẳng đứng từ dưới lên có độ lớn bằng trọng lượng phần chất lưu bị vật chiếm chỗ:\n' +
      '  — F_A = ρ_cl.g.V (V là thể tích phần vật chìm trong chất lưu, ρ_cl là khối lượng riêng chất lưu).',
    workedExample: {
      problem:
        'Một người thợ lặn ở độ sâu h = 10 m dưới mặt nước. Biết khối lượng riêng của nước là ρ = 1000 kg/m³, ' +
        'gia tốc trọng trường g = 10 m/s². Tính áp suất do cột nước tác dụng lên người thợ lặn (bỏ qua áp suất khí quyển).',
      steps: [
        'Xác định độ sâu h = 10 m, khối lượng riêng của nước ρ = 1000 kg/m³, gia tốc g = 10 m/s².',
        'Tính áp suất tĩnh của cột nước ở độ sâu h: p_tĩnh = ρ.g.h.',
        'Thay số: p_tĩnh = 1000 * 10 * 10 = 100000 (Pa) = 100 kPa.',
      ],
      answer: 'p = 100000 Pa',
    },
    checkQuestions: [
      {
        prompt:
          'Viết công thức tính áp suất cột chất lỏng p ở độ sâu h dưới mặt chất lỏng có khối lượng riêng ρ (bỏ qua áp suất khí quyển).',
        choices: [
          { id: 'ct_1', label: 'p = ρ * g * h' },
          { id: 'ct_2', label: 'p = ρ * g / h' },
          { id: 'ct_3', label: 'p = F / S' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['ct_1'],
        },
        explain:
          'Áp suất của cột chất lỏng tỉ lệ THUẬN với độ sâu h và khối lượng riêng ρ: p = ρgh, càng lặn sâu áp suất càng lớn. ' +
          'Phương án chia cho h làm ngược lại điều đó. Còn p = F / S đúng là định nghĩa chung của áp suất, ' +
          'nhưng không cho biết áp suất thay đổi theo độ sâu như thế nào.',
      },
      {
        prompt:
          'Một khối gỗ có thể tích 0,002 m³ chìm hoàn toàn trong nước có khối lượng riêng 1000 kg/m³. Tính độ lớn lực đẩy Archimedes tác dụng lên khối gỗ (lấy g = 10 m/s²).',
        answer: {
          kind: 'numeric',
          value: 20,
          unit: 'N',
        },
        explain:
          'F_A = ρ * g * V = 1000 * 10 * 0,002 = 20 N. Lưu ý ρ ở đây là khối lượng riêng của CHẤT LỎNG (nước), không phải của vật; V là thể tích phần vật chìm trong chất lỏng.',
      },
    ],
    srsCards: [
      {
        hoi: 'Đơn vị đo áp suất Pascal (Pa) tương đương với những đơn vị cơ bản nào?',
        dap: 'Newton trên mét vuông (N/m²).',
      },
      {
        hoi: 'Lực đẩy Archimedes phụ thuộc vào hai yếu tố nào?',
        dap: 'Thể tích phần chất lưu bị vật chiếm chỗ và khối lượng riêng của chất lưu đó.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
