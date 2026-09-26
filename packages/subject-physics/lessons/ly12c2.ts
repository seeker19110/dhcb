// lessons/ly12c2.ts — Vật lí 12, Chương 2: Khí lí tưởng (4 bài).
import type { PhysicsLesson } from '../lessonTypes.js'
import { donViHienThi } from '@dhcb/core-grading/units'

export const LY12_C2_LESSONS: PhysicsLesson[] = [
  {
    id: 'ly12-c2-b8',
    // Chỉ hình động mới sửa được lỗi vẽ đường đẳng nhiệt thành đoạn thẳng: chấm phải TRƯỢT trên
    // hypebol và tích p·V phải giữ nguyên ở mọi mốc.
    animation: {
      title: 'Nén khí đẳng nhiệt: chấm trượt dọc hypebol p·V = hằng số',
      description:
        'Đồ thị áp suất p theo thể tích V của một lượng khí giữ ở nhiệt độ không đổi. Chấm sáng xuất phát ở trạng thái V = 8 lít, p = 3 atm rồi trượt dần sang trái khi ta nén khí: qua V = 6 thì p lên 4 atm, qua V = 4 thì p lên 6 atm, tới V = 2 lít thì p đã là 12 atm. Tích p·V ở mọi điểm đều đúng bằng 24, nên đường biểu diễn là một HYPEBOL cong lõm về phía gốc chứ không phải đường thẳng dốc xuống — đây là chỗ vẽ sai nhiều nhất khi làm bài. Nhìn hai cặp đường gióng: thể tích giảm 4 lần thì áp suất tăng đúng 4 lần, quan hệ tỉ lệ NGHỊCH. Càng nén nhỏ, đường càng dựng đứng, tức là nén thêm một chút nữa thì áp suất vọt lên rất nhanh — lí do bơm xe càng về cuối càng nặng tay.',
      viewBoxWidth: 440,
      viewBoxHeight: 240,
      durationMs: 6000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'truc-x',
          x1: 62,
          y1: 210,
          x2: 425,
          y2: 210,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'truc-y',
          x1: 70,
          y1: 222,
          x2: 70,
          y2: 35,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'ten-x',
          x: 425,
          y: 228,
          text: 'V (lít)',
          size: 12,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'ten-y',
          x: 76,
          y: 32,
          text: 'p (atm)',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'polyline',
          id: 'dang-nhiet',
          points: [
            [114, 79],
            [125, 105],
            [143, 132],
            [162, 147],
            [180, 158],
            [198, 165],
            [217, 171],
            [254, 179],
            [290, 184],
            [327, 188],
            [364, 190],
            [386, 192],
          ],
          stroke: 'primary',
          strokeWidth: 3,
        },
        {
          kind: 'label',
          id: 'ten-duong',
          x: 330,
          y: 158,
          text: 'đường đẳng nhiệt (T không đổi)',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'line',
          id: 'gong-v8',
          x1: 364,
          y1: 210,
          x2: 364,
          y2: 190,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '4 3',
        },
        {
          kind: 'line',
          id: 'gong-p3',
          x1: 70,
          y1: 190,
          x2: 364,
          y2: 190,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '4 3',
        },
        {
          kind: 'label',
          id: 'nhan-dau',
          x: 370,
          y: 176,
          text: 'V = 8 · p = 3',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'line',
          id: 'gong-v2',
          x1: 143,
          y1: 210,
          x2: 143,
          y2: 132,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '4 3',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4599,
              opacity: 0,
            },
            {
              atMs: 4900,
              opacity: 1,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'gong-p12',
          x1: 70,
          y1: 132,
          x2: 143,
          y2: 132,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '4 3',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4599,
              opacity: 0,
            },
            {
              atMs: 4900,
              opacity: 1,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-cuoi',
          x: 151,
          y: 136,
          text: 'V = 2 · p = 12',
          size: 12,
          anchor: 'start',
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4599,
              opacity: 0,
            },
            {
              atMs: 4900,
              opacity: 1,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'cham',
          cx: 364,
          cy: 190,
          r: 7,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 800,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 1300,
              dx: -37,
              dy: -2,
            },
            {
              atMs: 1800,
              dx: -74,
              dy: -6,
            },
            {
              atMs: 2300,
              dx: -110,
              dy: -11,
            },
            {
              atMs: 2800,
              dx: -147,
              dy: -19,
            },
            {
              atMs: 3300,
              dx: -166,
              dy: -25,
            },
            {
              atMs: 3800,
              dx: -184,
              dy: -32,
            },
            {
              atMs: 4300,
              dx: -202,
              dy: -43,
            },
            {
              atMs: 4800,
              dx: -221,
              dy: -58,
            },
            {
              atMs: 6000,
              dx: -221,
              dy: -58,
            },
          ],
        },
        {
          kind: 'label',
          id: 'ct',
          x: 240,
          y: 62,
          text: 'p·V = 24 (không đổi khi T không đổi)',
          size: 14,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'kl',
          x: 240,
          y: 82,
          text: 'V giảm 4 lần → p tăng ĐÚNG 4 lần',
          size: 13,
          anchor: 'middle',
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4599,
              opacity: 0,
            },
            {
              atMs: 4900,
              opacity: 1,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'bay',
          x: 160,
          y: 104,
          text: 'Đường cong là hypebol,',
          size: 12,
          anchor: 'start',
          fill: 'muted',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2599,
              opacity: 0,
            },
            {
              atMs: 2900,
              opacity: 1,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'bay-2',
          x: 160,
          y: 120,
          text: 'KHÔNG phải đường thẳng dốc xuống',
          size: 12,
          anchor: 'start',
          fill: 'muted',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2599,
              opacity: 0,
            },
            {
              atMs: 2900,
              opacity: 1,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
          ],
        },
      ],
      captions: [
        {
          atMs: 800,
          text: 'Trạng thái đầu: V = 8 lít, p = 3 atm.',
        },
        {
          atMs: 2600,
          text: 'Nén lại, chấm trượt dọc hypebol — p·V vẫn luôn bằng 24.',
        },
        {
          atMs: 4600,
          text: 'V = 2 lít thì p = 12 atm: V giảm 4 lần, p tăng 4 lần.',
        },
      ],
    },
    grade: '12',
    chapterNumber: 2,
    chapterTitle: 'Khí lí tưởng',
    lessonNumber: 8,
    title: 'Định luật Boyle. Định luật Charles',
    hook:
      'Nếu bạn bóp một quả bóng bay đã bơm căng và buộc kín, bạn sẽ thấy quả bóng thu nhỏ lại nhưng vỏ bóng căng cứng hơn. ' +
      'Nếu bạn đun nóng một chai nhựa rỗng đậy kín, chai sẽ phồng lên. Những hiện tượng này tuân theo các định luật chất khí.',
    theory:
      'CÁC THÔNG SỐ TRẠNG THÁI CỦA MỘT LƯỢNG KHÍ:\n' +
      '— Áp suất (p): Đơn vị chuẩn là Pascal (1 Pa = 1 N/m²), ngoài ra còn dùng atm, mmHg, bar (1 atm ≈ 1.013 * 10⁵ Pa, 1 bar = 10⁵ Pa).\n' +
      '— Thể tích (V): Đơn vị chuẩn là mét khối (m³), ngoài ra còn dùng lít (l), mililít (ml), xentimét khối (cm³). (1 m³ = 1000 lít).\n' +
      '— Nhiệt độ tuyệt đối (T): Đơn vị Kelvin (K). Công thức: T = t + 273 (với t là nhiệt độ Celsius).\n\n' +
      'QUÁ TRÌNH ĐẲNG NHIỆT VÀ ĐỊNH LUẬT BOYLE:\n' +
      '— Quá trình đẳng nhiệt: Quá trình biến đổi trạng thái của một lượng khí khi nhiệt độ được giữ không đổi.\n' +
      '— Định luật Boyle: Trong quá trình đẳng nhiệt của một lượng khí xác định, áp suất tỉ lệ nghịch với thể tích:\n' +
      '  p.V = hằng số  (hay  p1.V1 = p2.V2)\n' +
      '— Đường đẳng nhiệt: Trong hệ toạ độ (p, V), đường đẳng nhiệt là một nhánh của đường hypebol.\n\n' +
      'QUÁ TRÌNH ĐẲNG ÁP VÀ ĐỊNH LUẬT CHARLES:\n' +
      '— Quá trình đẳng áp: Quá trình biến đổi trạng thái của một lượng khí khi áp suất được giữ không đổi.\n' +
      '— Định luật Charles: Trong quá trình đẳng áp của một lượng khí xác định, thể tích tỉ lệ thuận với nhiệt độ tuyệt đối:\n' +
      '  V / T = hằng số  (hay  V1 / T1 = V2 / T2)\n' +
      '— Đường đẳng áp: Trong hệ toạ độ (V, T), đường đẳng áp là đường thẳng đi qua gốc toạ độ (phần kéo dài).',
    workedExample: {
      problem:
        'Một lượng khí có thể tích 10 lít ở áp suất 1 bar và nhiệt độ 27 °C. ' +
        'Nếu nén đẳng nhiệt lượng khí này đến áp suất 2 bar thì thể tích mới của khối khí là bao nhiêu lít?',
      steps: [
        'Xác định các thông số trạng thái ban đầu: V1 = 10 lít, p1 = 1 bar.',
        'Xác định thông số trạng thái sau: p2 = 2 bar.',
        'Vì quá trình là đẳng nhiệt (T = const), áp dụng Định luật Boyle: p1*V1 = p2*V2.',
        'Suy ra thể tích mới: V2 = (p1 * V1) / p2 = (1 * 10) / 2 = 5 lít.',
      ],
      answer: 'V2 = 5 lít.',
    },
    checkQuestions: [
      {
        prompt:
          'Trong quá trình đẳng nhiệt của một lượng khí xác định, khi thể tích của khối khí giảm đi 3 lần thì áp suất của khối khí sẽ:',
        choices: [
          { id: 'da_1', label: 'Tăng lên 3 lần' },
          { id: 'da_2', label: 'Giảm đi 3 lần' },
          { id: 'da_3', label: 'Tăng lên 9 lần' },
          { id: 'da_4', label: 'Không đổi' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['da_1'],
        },
        explain:
          'Theo định luật Boyle, p và V tỉ lệ nghịch với nhau khi T không đổi. V giảm 3 lần thì p tăng 3 lần.',
      },
      {
        prompt:
          'Một khối khí lí tưởng có thể tích 3 lít ở nhiệt độ 300 K. ' +
          'Nhiệt độ của khối khí tăng lên đến bao nhiêu Kelvin nếu nó giãn nở đẳng áp đến thể tích 4.5 lít?',
        answer: {
          kind: 'numeric',
          value: 450,
          unit: 'K',
        },
        explain:
          'Áp dụng định luật Charles cho quá trình đẳng áp: V1/T1 = V2/T2 => T2 = T1 * V2 / V1 = 300 * 4.5 / 3 = 450 K.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phát biểu định luật Boyle dưới dạng công thức cho quá trình đẳng nhiệt?',
        dap: 'p * V = hằng số (hay p1 * V1 = p2 * V2).',
      },
      {
        hoi: 'Phát biểu định luật Charles dưới dạng công thức cho quá trình đẳng áp?',
        dap: 'V / T = hằng số (hay V1 / T1 = V2 / T2).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly12-c2-b9',
    // Hình động gộp ba định luật thành MỘT vòng kín — thứ mà ba công thức viết rời không cho thấy.
    animation: {
      title: 'Một chu trình khép kín và đại lượng không bao giờ đổi',
      description:
        'Trên đồ thị p–V, chấm sáng đi trọn một vòng kín qua ba trạng thái rồi quay đúng về chỗ xuất phát. Chặng 1→2 là đẳng nhiệt ở 300 K: chấm trượt trên hypebol từ (V = 2 lít, p = 12 atm) tới (V = 6 lít, p = 4 atm), tích p·V giữ nguyên 24. Chặng 2→3 là đẳng áp ở 4 atm: chấm đi thẳng sang trái, thể tích co từ 6 xuống 2 lít, mà V tỉ lệ thuận với T khi p cố định nên nhiệt độ tụt ba lần, từ 300 K xuống 100 K. Chặng 3→1 là đẳng tích ở 2 lít: chấm đi thẳng lên, áp suất tăng ba lần từ 4 lên 12 atm, kéo nhiệt độ trở lại 300 K. Điều hình động cho thấy mà công thức rời rạc không nói được: ba định luật Boyle, Charles và đẳng tích chỉ là ba lát cắt của cùng một phương trình p·V/T = hằng số — thương số ấy bằng 0,08 ở cả ba trạng thái, kể cả khi cả p, V lẫn T đều đã thay đổi.',
      viewBoxWidth: 440,
      viewBoxHeight: 240,
      durationMs: 7500,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'truc-x',
          x1: 62,
          y1: 210,
          x2: 425,
          y2: 210,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'truc-y',
          x1: 70,
          y1: 222,
          x2: 70,
          y2: 35,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'ten-x',
          x: 425,
          y: 228,
          text: 'V (lít)',
          size: 12,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'ten-y',
          x: 76,
          y: 32,
          text: 'p (atm)',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'polyline',
          id: 'qt1',
          points: [
            [143, 132],
            [162, 147],
            [180, 158],
            [198, 165],
            [217, 171],
            [235, 175],
            [254, 179],
            [272, 181],
            [290, 184],
          ],
          stroke: 'primary',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'qt2',
          x1: 290,
          y1: 184,
          x2: 143,
          y2: 184,
          stroke: 'accent',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'qt3',
          x1: 143,
          y1: 184,
          x2: 143,
          y2: 132,
          stroke: 'correct',
          strokeWidth: 3,
        },
        {
          kind: 'circle',
          id: 'tt1',
          cx: 143,
          cy: 132,
          r: 5,
          fill: 'neutral',
        },
        {
          kind: 'circle',
          id: 'tt2',
          cx: 290,
          cy: 184,
          r: 5,
          fill: 'neutral',
        },
        {
          kind: 'circle',
          id: 'tt3',
          cx: 143,
          cy: 184,
          r: 5,
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'n1',
          x: 135,
          y: 144,
          text: '1',
          size: 14,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'n2',
          x: 300,
          y: 178,
          text: '2',
          size: 14,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'n3',
          x: 135,
          y: 198,
          text: '3',
          size: 14,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'circle',
          id: 'cham',
          cx: 143,
          cy: 132,
          r: 7,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 600,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 900,
              dx: 19,
              dy: 15,
            },
            {
              atMs: 1200,
              dx: 37,
              dy: 26,
            },
            {
              atMs: 1500,
              dx: 55,
              dy: 33,
            },
            {
              atMs: 1800,
              dx: 74,
              dy: 39,
            },
            {
              atMs: 2100,
              dx: 92,
              dy: 43,
            },
            {
              atMs: 2400,
              dx: 111,
              dy: 47,
            },
            {
              atMs: 2700,
              dx: 129,
              dy: 49,
            },
            {
              atMs: 3000,
              dx: 147,
              dy: 52,
            },
            {
              atMs: 3600,
              dx: 147,
              dy: 52,
            },
            {
              atMs: 5200,
              dx: 0,
              dy: 52,
            },
            {
              atMs: 6800,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 7500,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'b1',
          x: 80,
          y: 55,
          text: '1→2 đẳng nhiệt: T = 300 K, p·V = 24 giữ nguyên',
          size: 12,
          anchor: 'start',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 699,
              opacity: 0,
            },
            {
              atMs: 1000,
              opacity: 1,
            },
            {
              atMs: 7500,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'b2',
          x: 80,
          y: 74,
          text: '2→3 đẳng áp (p = 4 atm): V giảm 3 lần, T từ 300 xuống 100 K',
          size: 12,
          anchor: 'start',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3699,
              opacity: 0,
            },
            {
              atMs: 4000,
              opacity: 1,
            },
            {
              atMs: 7500,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'b3',
          x: 80,
          y: 93,
          text: '3→1 đẳng tích (V = 2 lít): p tăng 3 lần, T trở lại 300 K',
          size: 12,
          anchor: 'start',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5299,
              opacity: 0,
            },
            {
              atMs: 5600,
              opacity: 1,
            },
            {
              atMs: 7500,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'bt',
          x: 250,
          y: 113,
          text: 'Trọn một vòng: p·V/T = 0,08 ở CẢ BA trạng thái',
          size: 13,
          anchor: 'middle',
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 6799,
              opacity: 0,
            },
            {
              atMs: 7100,
              opacity: 1,
            },
            {
              atMs: 7500,
              opacity: 1,
            },
          ],
        },
      ],
      captions: [
        {
          atMs: 600,
          text: 'Trạng thái 1: 2 lít · 12 atm · 300 K.',
        },
        {
          atMs: 1800,
          text: 'Chặng đẳng nhiệt 1→2: đi theo hypebol, T không đổi.',
        },
        {
          atMs: 3700,
          text: 'Chặng đẳng áp 2→3: V giảm 3 lần kéo T giảm 3 lần.',
        },
        {
          atMs: 5300,
          text: 'Chặng đẳng tích 3→1: p tăng 3 lần, T trở lại 300 K.',
        },
        {
          atMs: 6800,
          text: 'Khép vòng: p·V/T không đổi ở mọi trạng thái.',
        },
      ],
    },
    grade: '12',
    chapterNumber: 2,
    chapterTitle: 'Khí lí tưởng',
    lessonNumber: 9,
    title: 'Phương trình trạng thái của khí lí tưởng',
    hook:
      'Khi một khinh khí cầu bay lên cao, cả áp suất, thể tích và nhiệt độ của lượng khí bên trong đều thay đổi đồng thời. ' +
      'Để tìm mối liên hệ giữa cả 3 thông số này, chúng ta sử dụng một phương trình tổng quát gọi là phương trình trạng thái của khí lí tưởng.',
    theory:
      'KHÁI NIỆM KHÍ LÍ TƯỞNG VÀ KHÍ THỰC:\n' +
      '— Khí lí tưởng: Là chất khí trong đó các phân tử được coi là các chất điểm, chỉ tương tác với nhau khi va chạm đàn hồi.\n' +
      '— Khí thực: Các khí tồn tại trong thực tế (như oxi, nitơ, cacbonic). Ở nhiệt độ và áp suất thông thường, khí thực gần đúng coi là khí lí tưởng.\n\n' +
      'PHƯƠNG TRÌNH TRẠNG THÁI CỦA KHÍ LÍ TƯỞNG (PHƯƠNG TRÌNH CLAPEYRON):\n' +
      '— Với một lượng khí xác định chuyển từ trạng thái 1 (p1, V1, T1) sang trạng thái 2 (p2, V2, T2):\n' +
      '  p1.V1 / T1 = p2.V2 / T2 = hằng số\n\n' +
      'PHƯƠNG TRÌNH CLAPEYRON - MENDELEEV:\n' +
      '— Với một lượng khí bất kì có khối lượng m, số mol n = m / M:\n' +
      '  p.V = n.R.T = (m / M).R.T\n' +
      'Trong đó:\n' +
      '— p: Áp suất (Pa).\n' +
      '— V: Thể tích (m³).\n' +
      '— T: Nhiệt độ tuyệt đối (K).\n' +
      '— R ≈ 8.31 J/(mol.K) là hằng số khí lí tưởng.\n' +
      '— n: Số mol chất khí (mol).',
    workedExample: {
      problem:
        'Tính áp suất (theo đơn vị kPa) của 0.2 mol khí lí tưởng đựng trong bình kín có thể tích 8.31 lít (bằng 0.00831 m³) ở nhiệt độ 27 °C.',
      steps: [
        'Đổi nhiệt độ sang Kelvin: T = 27 + 273 = 300 K.',
        'Áp dụng phương trình Clapeyron - Mendeleev: p.V = n.R.T => p = (n.R.T) / V.',
        'Thay số với V = 0.00831 m³, n = 0.2 mol, R = 8.31 J/(mol.K) và T = 300 K.',
        'Tính toán: p = (0.2 * 8.31 * 300) / 0.00831 = 60000 Pa = 60 kPa.',
      ],
      answer: 'p = 60 kPa.',
    },
    checkQuestions: [
      {
        prompt: 'Hằng số khí lí tưởng R trong hệ SI có giá trị xấp xỉ bằng:',
        choices: [
          { id: 'r_1', label: '8.31 J/(mol.K)' },
          { id: 'r_2', label: '0.082 J/(mol.K)' },
          { id: 'r_3', label: '8.31 J/(kg.K)' },
          { id: 'r_4', label: '8310 J/(mol.K)' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['r_1'],
        },
        explain:
          'Trong hệ SI, hằng số khí R = 8.31 J/(mol.K). R xuất hiện trong phương trình trạng thái khí lí tưởng pV = nRT, với T phải lấy theo nhiệt độ tuyệt đối (Kelvin), không phải °C.',
      },
      {
        prompt:
          'Một khối khí lí tưởng ở trạng thái 1 có p1 = 1 atm, V1 = 4 lít, T1 = 300 K. ' +
          'Khối khí biến đổi sang trạng thái 2 có V2 = 2 lít và T2 = 600 K. Tính áp suất p2 (theo đơn vị atm) của khối khí ở trạng thái mới.',
        answer: {
          kind: 'numeric',
          value: donViHienThi(4, 'atm'),
          unit: 'atm',
        },
        explain:
          'Áp dụng phương trình trạng thái: p1*V1/T1 = p2*V2/T2 => p2 = p1 * (V1/V2) * (T2/T1) = 1 * (4/2) * (600/300) = 4 atm.',
      },
    ],
    srsCards: [
      {
        hoi: 'Viết phương trình trạng thái của khí lí tưởng cho một lượng khí xác định?',
        dap: 'p1 * V1 / T1 = p2 * V2 / T2 = hằng số.',
      },
      {
        hoi: 'Viết phương trình Clapeyron - Mendeleev biểu diễn mối liên hệ p, V, T qua số mol n?',
        dap: 'p * V = n * R * T (với R = 8.31 J/(mol.K)).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly12-c2-b10',
    // Áp suất khí là đại lượng THỐNG KÊ của va chạm — không câu văn nào thay được cảnh phân tử
    // chuyển từ chậm sang nhanh trong cùng một bình.
    animation: {
      title: 'Áp suất chất khí sinh ra từ hàng tỉ cú va vào thành bình',
      description:
        'Một bình kín chứa sáu phân tử khí (vẽ tượng trưng cho hàng tỉ tỉ phân tử thật). Nửa đầu cảnh là khí ở nhiệt độ thấp: mỗi phân tử đi những bước ngắn, thỉnh thoảng mới chạm thành bình, và bốn mũi tên áp suất ở thành phải ngắn. Nửa sau nhiệt độ tăng: vẫn đúng sáu phân tử đó, vẫn cùng bình ấy, nhưng chúng đi những quãng dài hơn hẳn trong cùng khoảng thời gian, va vào thành dày hơn và mạnh hơn, nên bốn mũi tên áp suất dài ra và đậm lên. Hình động trả lời câu hỏi cốt lõi của thuyết động học phân tử: áp suất KHÔNG phải một chất lỏng vô hình ép lên thành bình, nó là tổng lực của vô số cú va đập của phân tử trong mỗi giây. Vì động năng trung bình của phân tử tỉ lệ với nhiệt độ tuyệt đối T, cứ hâm nóng khí trong bình kín là áp suất tăng — đó là lí do lon nước ngọt hay bình xịt để gần lửa có thể nổ.',
      viewBoxWidth: 440,
      viewBoxHeight: 255,
      durationMs: 6400,
      loop: true,
      shapes: [
        {
          kind: 'rect',
          id: 'binh',
          x: 60,
          y: 50,
          w: 240,
          h: 170,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'circle',
          id: 'pt-0',
          cx: 100,
          cy: 90,
          r: 7,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 800,
              dx: 16,
              dy: 14,
            },
            {
              atMs: 1600,
              dx: -14,
              dy: -12,
            },
            {
              atMs: 2400,
              dx: 12,
              dy: 18,
            },
            {
              atMs: 3200,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 3700,
              dx: 40,
              dy: -36,
            },
            {
              atMs: 4200,
              dx: -38,
              dy: 30,
            },
            {
              atMs: 4700,
              dx: 34,
              dy: 44,
            },
            {
              atMs: 5200,
              dx: -42,
              dy: -28,
            },
            {
              atMs: 5700,
              dx: 36,
              dy: 24,
            },
            {
              atMs: 6400,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'pt-1',
          cx: 170,
          cy: 75,
          r: 7,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 800,
              dx: -16,
              dy: 14,
            },
            {
              atMs: 1600,
              dx: 14,
              dy: -12,
            },
            {
              atMs: 2400,
              dx: -12,
              dy: 18,
            },
            {
              atMs: 3200,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 3700,
              dx: -40,
              dy: -36,
            },
            {
              atMs: 4200,
              dx: 38,
              dy: 30,
            },
            {
              atMs: 4700,
              dx: -34,
              dy: 44,
            },
            {
              atMs: 5200,
              dx: 42,
              dy: -28,
            },
            {
              atMs: 5700,
              dx: -36,
              dy: 24,
            },
            {
              atMs: 6400,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'pt-2',
          cx: 250,
          cy: 110,
          r: 7,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 800,
              dx: 16,
              dy: 14,
            },
            {
              atMs: 1600,
              dx: -14,
              dy: -12,
            },
            {
              atMs: 2400,
              dx: 12,
              dy: 18,
            },
            {
              atMs: 3200,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 3700,
              dx: 40,
              dy: -36,
            },
            {
              atMs: 4200,
              dx: -38,
              dy: 30,
            },
            {
              atMs: 4700,
              dx: 34,
              dy: 44,
            },
            {
              atMs: 5200,
              dx: -42,
              dy: -28,
            },
            {
              atMs: 5700,
              dx: 36,
              dy: 24,
            },
            {
              atMs: 6400,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'pt-3',
          cx: 120,
          cy: 180,
          r: 7,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 800,
              dx: -16,
              dy: 14,
            },
            {
              atMs: 1600,
              dx: 14,
              dy: -12,
            },
            {
              atMs: 2400,
              dx: -12,
              dy: 18,
            },
            {
              atMs: 3200,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 3700,
              dx: -40,
              dy: -36,
            },
            {
              atMs: 4200,
              dx: 38,
              dy: 30,
            },
            {
              atMs: 4700,
              dx: -34,
              dy: 44,
            },
            {
              atMs: 5200,
              dx: 42,
              dy: -28,
            },
            {
              atMs: 5700,
              dx: -36,
              dy: 24,
            },
            {
              atMs: 6400,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'pt-4',
          cx: 220,
          cy: 190,
          r: 7,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 800,
              dx: 16,
              dy: 14,
            },
            {
              atMs: 1600,
              dx: -14,
              dy: -12,
            },
            {
              atMs: 2400,
              dx: 12,
              dy: 18,
            },
            {
              atMs: 3200,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 3700,
              dx: 40,
              dy: -36,
            },
            {
              atMs: 4200,
              dx: -38,
              dy: 30,
            },
            {
              atMs: 4700,
              dx: 34,
              dy: 44,
            },
            {
              atMs: 5200,
              dx: -42,
              dy: -28,
            },
            {
              atMs: 5700,
              dx: 36,
              dy: 24,
            },
            {
              atMs: 6400,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'pt-5',
          cx: 270,
          cy: 70,
          r: 7,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 800,
              dx: -16,
              dy: 14,
            },
            {
              atMs: 1600,
              dx: 14,
              dy: -12,
            },
            {
              atMs: 2400,
              dx: -12,
              dy: 18,
            },
            {
              atMs: 3200,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 3700,
              dx: -40,
              dy: -36,
            },
            {
              atMs: 4200,
              dx: 38,
              dy: 30,
            },
            {
              atMs: 4700,
              dx: -34,
              dy: 44,
            },
            {
              atMs: 5200,
              dx: 42,
              dy: -28,
            },
            {
              atMs: 5700,
              dx: -36,
              dy: 24,
            },
            {
              atMs: 6400,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'ap-thap-0',
          x1: 306,
          y1: 80,
          x2: 322,
          y2: 80,
          stroke: 'accent',
          strokeWidth: 2,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 599,
              opacity: 0,
            },
            {
              atMs: 900,
              opacity: 1,
            },
            {
              atMs: 3000,
              opacity: 1,
            },
            {
              atMs: 3300,
              opacity: 0,
            },
            {
              atMs: 6400,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'ap-cao-0',
          x1: 306,
          y1: 80,
          x2: 352,
          y2: 80,
          stroke: 'danger',
          strokeWidth: 4,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3599,
              opacity: 0,
            },
            {
              atMs: 3900,
              opacity: 1,
            },
            {
              atMs: 6400,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'ap-thap-1',
          x1: 306,
          y1: 120,
          x2: 322,
          y2: 120,
          stroke: 'accent',
          strokeWidth: 2,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 599,
              opacity: 0,
            },
            {
              atMs: 900,
              opacity: 1,
            },
            {
              atMs: 3000,
              opacity: 1,
            },
            {
              atMs: 3300,
              opacity: 0,
            },
            {
              atMs: 6400,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'ap-cao-1',
          x1: 306,
          y1: 120,
          x2: 352,
          y2: 120,
          stroke: 'danger',
          strokeWidth: 4,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3599,
              opacity: 0,
            },
            {
              atMs: 3900,
              opacity: 1,
            },
            {
              atMs: 6400,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'ap-thap-2',
          x1: 306,
          y1: 160,
          x2: 322,
          y2: 160,
          stroke: 'accent',
          strokeWidth: 2,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 599,
              opacity: 0,
            },
            {
              atMs: 900,
              opacity: 1,
            },
            {
              atMs: 3000,
              opacity: 1,
            },
            {
              atMs: 3300,
              opacity: 0,
            },
            {
              atMs: 6400,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'ap-cao-2',
          x1: 306,
          y1: 160,
          x2: 352,
          y2: 160,
          stroke: 'danger',
          strokeWidth: 4,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3599,
              opacity: 0,
            },
            {
              atMs: 3900,
              opacity: 1,
            },
            {
              atMs: 6400,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'ap-thap-3',
          x1: 306,
          y1: 200,
          x2: 322,
          y2: 200,
          stroke: 'accent',
          strokeWidth: 2,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 599,
              opacity: 0,
            },
            {
              atMs: 900,
              opacity: 1,
            },
            {
              atMs: 3000,
              opacity: 1,
            },
            {
              atMs: 3300,
              opacity: 0,
            },
            {
              atMs: 6400,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'ap-cao-3',
          x1: 306,
          y1: 200,
          x2: 352,
          y2: 200,
          stroke: 'danger',
          strokeWidth: 4,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3599,
              opacity: 0,
            },
            {
              atMs: 3900,
              opacity: 1,
            },
            {
              atMs: 6400,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'giai-doan-1',
          x: 180,
          y: 36,
          text: 'Nhiệt độ thấp: phân tử chậm, va vào thành thưa và nhẹ',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 299,
              opacity: 0,
            },
            {
              atMs: 600,
              opacity: 1,
            },
            {
              atMs: 3000,
              opacity: 1,
            },
            {
              atMs: 3300,
              opacity: 0,
            },
            {
              atMs: 6400,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'giai-doan-2',
          x: 180,
          y: 36,
          text: 'Nhiệt độ cao: phân tử nhanh, va dày hơn và mạnh hơn',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3599,
              opacity: 0,
            },
            {
              atMs: 3900,
              opacity: 1,
            },
            {
              atMs: 6400,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'kl1',
          x: 436,
          y: 112,
          text: 'Áp suất',
          size: 13,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'kl2',
          x: 436,
          y: 132,
          text: 'lên thành bình',
          size: 12,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'ct',
          x: 180,
          y: 240,
          text: 'Động năng trung bình của phân tử tỉ lệ với T (K)',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
      ],
      captions: [
        {
          atMs: 600,
          text: 'Khí lạnh: phân tử chậm, va vào thành thưa và nhẹ.',
        },
        {
          atMs: 3600,
          text: 'Tăng nhiệt độ: cùng số phân tử nhưng đi nhanh hơn nhiều.',
        },
        {
          atMs: 5000,
          text: 'Va nhiều hơn và mạnh hơn → áp suất lên thành bình tăng.',
        },
      ],
    },
    grade: '12',
    chapterNumber: 2,
    chapterTitle: 'Khí lí tưởng',
    lessonNumber: 10,
    title: 'Thuyết động học phân tử chất khí',
    hook:
      'Khi đứng trước gió hoặc bơm lốp xe, chúng ta cảm nhận được áp suất khí như một lực liên tục. ' +
      'Thực chất, áp suất này là kết quả của hàng tỉ tỉ hạt phân tử siêu nhỏ đang bắn phá và va đập liên tục vào da hay thành lốp xe.',
    theory:
      'NỘI DUNG CƠ BẢN CỦA THUYẾT ĐỘNG HỌC PHÂN TỬ CHẤT KHÍ:\n' +
      '— Các chất khí được cấu tạo từ các phân tử có kích thước rất nhỏ so với khoảng cách giữa chúng.\n' +
      '— Các phân tử khí chuyển động hỗn loạn không ngừng; chuyển động này càng nhanh thì nhiệt độ của chất khí càng cao.\n' +
      '— Khi chuyển động hỗn loạn, các phân tử khí va chạm vào nhau và va chạm vào thành bình gây ra áp suất lên thành bình.\n\n' +
      'CÔNG THỨC TÍNH ÁP SUẤT KHÍ THEO MÔ HÌNH ĐỘNG HỌC PHÂN TỬ:\n' +
      '  p = (1/3).ρ.v_rms²\n' +
      'Trong đó:\n' +
      '— ρ: Khối lượng riêng của chất khí (kg/m³).\n' +
      '— v_rms²: Trung bình bình phương tốc độ của các phân tử khí (m²/s²).\n\n' +
      'MỐI QUAN HỆ GIỮA ĐỘNG NĂNG PHÂN TỬ VÀ NHIỆT ĐỘ TUYỆT ĐỐI:\n' +
      '— Động năng tịnh tiến trung bình của phân tử khí tỉ lệ thuận với nhiệt độ tuyệt đối:\n' +
      '  E_d = (3/2).kB.T\n' +
      'Trong đó kB ≈ 1.38 * 10⁻²³ J/K là hằng số Boltzmann (kB = R / NA).\n' +
      '— Công thức này cho thấy nhiệt độ là số đo động năng trung bình của chuyển động nhiệt của phân tử.',
    workedExample: {
      problem:
        'Giải thích tại sao khi giữ nguyên thể tích của một lượng khí xác định trong bình kín và đun nóng, áp suất của khối khí lại tăng?',
      steps: [
        'Nhận xét ảnh hưởng của nhiệt độ: Khi nhiệt độ T tăng, động năng tịnh tiến trung bình và tốc độ của các phân tử khí tăng lên.',
        'Mô tả va chạm: Các phân tử chuyển động nhanh hơn, va đập mạnh hơn và thường xuyên hơn vào thành bình.',
        'Kết luận: Lực tác dụng trung bình của các phân tử lên mỗi đơn vị diện tích thành bình tăng lên, làm áp suất khí tăng lên.',
      ],
      answer:
        'Nhiệt độ tăng làm tốc độ và lực va đập của các phân tử lên thành bình tăng, dẫn đến áp suất tăng.',
    },
    checkQuestions: [
      {
        prompt:
          'Động năng tịnh tiến trung bình của các phân tử khí lí tưởng tỉ lệ thuận với thông số nào dưới đây?',
        choices: [
          { id: 't_1', label: 'Nhiệt độ tuyệt đối' },
          { id: 't_2', label: 'Áp suất khí' },
          { id: 't_3', label: 'Khối lượng riêng' },
          { id: 't_4', label: 'Thể tích bình chứa' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['t_1'],
        },
        explain:
          'Theo công thức Ed = 1.5 * kB * T, động năng tịnh tiến trung bình tỉ lệ thuận với nhiệt độ tuyệt đối T.',
      },
      {
        prompt:
          'Theo thuyết động học phân tử chất khí, nguyên nhân gây ra áp suất của chất khí lên thành bình là do:',
        choices: [
          { id: 'c_1', label: 'Các phân tử khí va chạm vào thành bình' },
          { id: 'c_2', label: 'Lực hút giữa các phân tử khí với nhau' },
          { id: 'c_3', label: 'Sự co dãn tự nhiên của các phân tử khí' },
          { id: 'c_4', label: 'Trọng lực của các phân tử đè lên đáy bình' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['c_1'],
        },
        explain:
          'Áp suất chất khí lên thành bình là do lực tác dụng từ các va chạm hỗn loạn của phân tử khí lên thành bình.',
      },
    ],
    srsCards: [
      {
        hoi: 'Mối quan hệ giữa động năng tịnh tiến trung bình của phân tử khí lí tưởng Ed và nhiệt độ tuyệt đối T?',
        dap: 'Ed = 1.5 * kB * T (với kB là hằng số Boltzmann).',
      },
      {
        hoi: 'Hằng số Boltzmann kB liên hệ thế nào với hằng số khí R và số Avogadro NA?',
        dap: 'kB = R / NA (xấp xỉ 1.38 * 10^-23 J/K).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly12-c2-b11',
    grade: '12',
    chapterNumber: 2,
    chapterTitle: 'Khí lí tưởng',
    lessonNumber: 11,
    title: 'Bài tập về khí lí tưởng',
    hook:
      'Luyện tập giải các bài tập vận dụng các định luật chất khí, phương trình trạng thái và ' +
      'công thức động học phân tử là cách tốt nhất để nắm vững các đặc tính của chất khí trong thực tế.',
    theory:
      'CÁC CÔNG THỨC TRỌNG TÂM CẦN NHỚ:\n' +
      '1. Định luật Boyle (Đẳng nhiệt): p1 * V1 = p2 * V2\n' +
      '2. Định luật Charles (Đẳng áp): V1 / T1 = V2 / T2\n' +
      '3. Phương trình trạng thái: p1 * V1 / T1 = p2 * V2 / T2\n' +
      '4. Phương trình Mendeleev-Clapeyron: p * V = n * R * T = (m/M) * R * T\n' +
      '5. Khối lượng riêng của khí: ρ = m / V = p * M / (R * T)',
    workedExample: {
      problem:
        'Một bình chứa khí oxi (M = 32 g/mol) có dung tích 10 lít ở áp suất 1.5 bar và nhiệt độ 27 °C. ' +
        'Tính khối lượng khí oxi trong bình (lấy R = 0.0831 bar.l/(mol.K), kết quả làm tròn đến 2 chữ số thập phân).',
      steps: [
        'Đổi nhiệt độ sang Kelvin: T = 27 + 273 = 300 K.',
        'Áp dụng phương trình Mendeleev-Clapeyron: p*V = n*R*T => n = (p*V) / (R*T).',
        'Thay số với p = 1.5 bar, V = 10 lít, R = 0.0831 bar.l/(mol.K), T = 300 K. Tính số mol: n = (1.5 * 10) / (0.0831 * 300) ≈ 0.6017 mol.',
        'Khối lượng oxi trong bình: m = n * M = 0.6017 * 32 ≈ 19.25 g.',
      ],
      answer: 'm = 19.25 g.',
    },
    checkQuestions: [
      {
        prompt:
          'Một khối khí lí tưởng có thể tích 6 lít ở nhiệt độ 27 °C và áp suất 1 atm. ' +
          'Khi nén khối khí này đến thể tích 3 lít và nung nóng đến nhiệt độ 327 °C, áp suất mới của khối khí là bao nhiêu atm?',
        answer: {
          kind: 'numeric',
          value: donViHienThi(4, 'atm'),
          unit: 'atm',
        },
        explain:
          'T1 = 27 + 273 = 300 K. T2 = 327 + 273 = 600 K. Áp dụng phương trình trạng thái: p1*V1/T1 = p2*V2/T2 => p2 = p1 * (V1/V2) * (T2/T1) = 1 * (6/3) * (600/300) = 4 atm.',
      },
      {
        prompt:
          'Ở điều kiện tiêu chuẩn (áp suất 1 atm, nhiệt độ 0 °C), 1 mol khí lí tưởng chiếm thể tích bao nhiêu lít?',
        answer: {
          kind: 'numeric',
          value: donViHienThi(22.4, 'lít'),
          unit: 'lít',
        },
        explain: 'Ở điều kiện tiêu chuẩn, thể tích của 1 mol chất khí bất kì là 22.4 lít.',
      },
    ],
    srsCards: [
      {
        hoi: 'Mối liên hệ giữa áp suất p, khối lượng riêng rho, nhiệt độ T và khối lượng mol M của chất khí?',
        dap: 'rho = p * M / (R * T).',
      },
      {
        hoi: 'Thể tích của 1 mol khí lí tưởng ở điều kiện tiêu chuẩn (0 độ C, 1 atm)?',
        dap: '22.4 lít.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
