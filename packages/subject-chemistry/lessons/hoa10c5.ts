// lessons/hoa10c5.ts — Hoá học 10, Chương 5: Năng lượng hoá học (1 bài).
import type { ChemLesson } from '../lessonTypes.js'

export const HOA10_C5_LESSONS: ChemLesson[] = [
  {
    id: 'hoa10-c5-b14',
    grade: '10',
    chapterNumber: 5,
    chapterTitle: 'Năng lượng hoá học',
    lessonNumber: 14,
    title: 'Biến thiên enthalpy trong các phản ứng hoá học',
    hook:
      'Túi chườm lạnh y tế "kích hoạt" bằng cách bóp vỡ một gói hoá chất bên trong — phản ứng ' +
      'xảy ra HẤP THỤ nhiệt từ môi trường, làm túi lạnh đi ngay lập tức.',
    theory:
      'ENTHALPY (kí hiệu H) là một dạng năng lượng đặc trưng cho một hệ ở áp suất không đổi. ' +
      'Ta không đo được H tuyệt đối, chỉ đo được sự THAY ĐỔI enthalpy khi phản ứng xảy ra — ' +
      'gọi là BIẾN THIÊN ENTHALPY, kí hiệu ΔᵣH°₂₉₈ (đo ở điều kiện chuẩn, 25°C, 1 bar).\n\n' +
      'PHẢN ỨNG TOẢ NHIỆT: giải phóng năng lượng ra môi trường, ΔH < 0 (âm). Ví dụ: đốt cháy ' +
      'nhiên liệu, phản ứng trung hoà acid-base.\n\n' +
      'PHẢN ỨNG THU NHIỆT: hấp thụ năng lượng từ môi trường, ΔH > 0 (dương). Ví dụ: phản ứng ' +
      'nhiệt phân CaCO₃, hoà tan một số muối như NH₄NO₃ trong nước (làm lạnh — dùng trong túi ' +
      'chườm lạnh).\n\n' +
      'Cách tính ΔᵣH theo NHIỆT TẠO THÀNH chuẩn (ΔfH°): ΔᵣH° = Σ ΔfH°(sản phẩm) − Σ ΔfH°(chất ' +
      'đầu), có nhân hệ số cân bằng của mỗi chất.\n\n' +
      'Cách tính ΔᵣH theo NĂNG LƯỢNG LIÊN KẾT (Eb): ΔᵣH° = Σ Eb(liên kết bị phá vỡ ở chất ' +
      'đầu) − Σ Eb(liên kết hình thành ở sản phẩm).',
    workedExample: {
      problem:
        'Phản ứng CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(l) có ΔfH°(CH₄) = −75 kJ/mol, ΔfH°(CO₂) = ' +
        '−394 kJ/mol, ΔfH°(H₂O) = −286 kJ/mol, ΔfH°(O₂) = 0 kJ/mol. Tính ΔᵣH° của phản ứng.',
      steps: [
        'Áp dụng công thức: ΔᵣH° = Σ ΔfH°(sản phẩm) − Σ ΔfH°(chất đầu), nhân đúng hệ số cân ' +
          'bằng.',
        'Sản phẩm: 1×ΔfH°(CO₂) + 2×ΔfH°(H₂O) = 1×(−394) + 2×(−286) = −394 − 572 = −966 kJ.',
        'Chất đầu: 1×ΔfH°(CH₄) + 2×ΔfH°(O₂) = 1×(−75) + 2×0 = −75 kJ.',
        'ΔᵣH° = −966 − (−75) = −891 kJ/mol.',
      ],
      answer: 'ΔᵣH° = −891 kJ/mol (phản ứng toả nhiệt mạnh — đúng bản chất phản ứng cháy).',
    },
    checkQuestions: [
      {
        prompt: 'Phản ứng toả nhiệt có giá trị ΔH như thế nào?',
        choices: [
          { id: 'am', label: 'ΔH âm (ΔH < 0)' },
          { id: 'duong', label: 'ΔH dương (ΔH > 0)' },
        ],
        answer: { kind: 'choice', correctIds: ['am'] },
        explain: 'Phản ứng toả nhiệt giải phóng năng lượng ra môi trường ⇒ ΔH < 0 theo quy ước.',
      },
      {
        prompt:
          'Phản ứng H₂(g) + Cl₂(g) → 2HCl(g) có ΔfH°(HCl) = −92 kJ/mol, ΔfH°(H₂) = ΔfH°(Cl₂) ' +
          '= 0. Tính ΔᵣH° của phản ứng (kJ/mol, chỉ nhập số).',
        answer: { kind: 'numeric', value: -184 },
        explain:
          'Biến thiên enthalpy của phản ứng bằng tổng ΔfH° các chất SẢN PHẨM trừ tổng của chất ĐẦU, mỗi chất nhân hệ số cân bằng: ΔᵣH° = 2×(−92) − (0+0) = −184 kJ/mol. Hai bẫy hay gặp: quên nhân hệ số 2 của HCl, và quên rằng đơn chất bền ở điều kiện chuẩn (H₂, Cl₂) có ΔfH° = 0. Dấu âm nghĩa là phản ứng TOẢ nhiệt.',
      },
      {
        // Câu BẪY: quên NHÂN HỆ SỐ cân bằng khi tính ΔᵣH — lỗi sai phổ biến nhất của dạng này.
        prompt:
          'Cho phản ứng 2H₂(g) + O₂(g) → 2H₂O(l) với ΔfH°(H₂O, l) = −286 kJ/mol; ΔfH°(H₂) = ' +
          'ΔfH°(O₂) = 0. Tính ΔᵣH° của phản ứng theo đúng phương trình đã cho (kJ, chỉ nhập số).',
        answer: { kind: 'numeric', value: -572 },
        explain:
          'Nếu bạn ra −286 thì đã quên nhân HỆ SỐ CÂN BẰNG: phương trình tạo ra 2 mol H₂O chứ ' +
          'không phải 1. ΔᵣH° = 2×(−286) − (2×0 + 1×0) = −572 kJ. Nhớ: ΔᵣH luôn gắn với đúng ' +
          'phương trình đã viết — viết lại phương trình với hệ số khác thì giá trị ΔᵣH cũng đổi ' +
          'theo đúng tỉ lệ đó.',
      },
    ],
    srsCards: [
      { hoi: 'Phản ứng toả nhiệt có dấu ΔH thế nào?', dap: 'ΔH < 0 (âm).' },
      { hoi: 'Phản ứng thu nhiệt có dấu ΔH thế nào?', dap: 'ΔH > 0 (dương).' },
      {
        hoi: 'Công thức tính ΔᵣH theo nhiệt tạo thành?',
        dap: 'ΔᵣH° = Σ ΔfH°(sản phẩm) − Σ ΔfH°(chất đầu), nhân hệ số cân bằng.',
      },
    ],
    animation: {
      title: 'Giản đồ năng lượng: phản ứng toả nhiệt và phản ứng thu nhiệt',
      description:
        'Trục dọc là enthalpy (năng lượng). Ở giản đồ bên trái, mức năng lượng của chất đầu cao ' +
        'hơn mức của sản phẩm: hệ "rơi" xuống mức thấp hơn và phần năng lượng dôi ra toả ra môi ' +
        'trường, nên ΔH mang dấu âm — phản ứng toả nhiệt. Ở giản đồ bên phải thì ngược lại: sản ' +
        'phẩm nằm cao hơn chất đầu, hệ phải hấp thụ năng lượng từ môi trường mới lên được, nên ' +
        'ΔH mang dấu dương — phản ứng thu nhiệt. Cả hai đường đều phải vượt qua một "ngọn đồi" ' +
        'năng lượng hoạt hoá ở giữa: đó là lý do một phản ứng toả nhiệt vẫn cần mồi lửa để bắt ' +
        'đầu. Dấu của ΔH chỉ phụ thuộc vị trí đầu–cuối, không phụ thuộc độ cao ngọn đồi đó.',
      viewBoxWidth: 420,
      viewBoxHeight: 220,
      durationMs: 6000,
      loop: true,
      shapes: [
        {
          kind: 'arrow',
          id: 'truc-y',
          x1: 24,
          y1: 200,
          x2: 24,
          y2: 24,
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'label',
          id: 'y-t',
          x: 30,
          y: 18,
          text: 'H (năng lượng)',
          size: 10,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'polyline',
          id: 'toa',
          points: [
            [40, 70],
            [80, 70],
            [105, 40],
            [130, 150],
            [185, 150],
          ],
          stroke: 'primary',
          strokeWidth: 2.5,
        },
        {
          kind: 'arrow',
          id: 'dh-toa',
          x1: 150,
          y1: 72,
          x2: 150,
          y2: 148,
          stroke: 'correct',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'dh-toa-t',
          x: 156,
          y: 108,
          text: 'ΔH < 0',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'dh-toa-t2',
          x: 156,
          y: 122,
          text: '(toả nhiệt)',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'cd1',
          x: 40,
          y: 62,
          text: 'chất đầu',
          size: 10,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'sp1',
          x: 185,
          y: 166,
          text: 'sản phẩm',
          size: 10,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'polyline',
          id: 'thu',
          points: [
            [235, 150],
            [270, 150],
            [295, 40],
            [325, 70],
            [380, 70],
          ],
          stroke: 'primary',
          strokeWidth: 2.5,
        },
        {
          kind: 'arrow',
          id: 'dh-thu',
          x1: 345,
          y1: 148,
          x2: 345,
          y2: 72,
          stroke: 'warn',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'dh-thu-t',
          x: 351,
          y: 108,
          text: 'ΔH > 0',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'dh-thu-t2',
          x: 351,
          y: 122,
          text: '(thu nhiệt)',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'cd2',
          x: 235,
          y: 166,
          text: 'chất đầu',
          size: 10,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'sp2',
          x: 380,
          y: 62,
          text: 'sản phẩm',
          size: 10,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'circle',
          id: 'he1',
          cx: 40,
          cy: 70,
          r: 6,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 800, dx: 40, dy: 0 },
            { atMs: 1400, dx: 65, dy: -30 },
            { atMs: 2200, dx: 90, dy: 80 },
            { atMs: 2800, dx: 145, dy: 80 },
            { atMs: 6000, dx: 145, dy: 80 },
          ],
        },
        {
          kind: 'circle',
          id: 'he2',
          cx: 235,
          cy: 150,
          r: 6,
          fill: 'accent',
          keyframes: [
            { atMs: 3000, dx: 0, dy: 0 },
            { atMs: 3600, dx: 35, dy: 0 },
            { atMs: 4400, dx: 60, dy: -110 },
            { atMs: 5000, dx: 90, dy: -80 },
            { atMs: 5600, dx: 145, dy: -80 },
            { atMs: 6000, dx: 145, dy: -80 },
          ],
        },
        {
          kind: 'label',
          id: 'ea',
          x: 105,
          y: 32,
          text: 'năng lượng hoạt hoá',
          size: 9,
          anchor: 'middle',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Toả nhiệt: sản phẩm ở mức năng lượng THẤP hơn chất đầu ⇒ ΔH âm.' },
        { atMs: 3000, text: 'Thu nhiệt: sản phẩm ở mức năng lượng CAO hơn chất đầu ⇒ ΔH dương.' },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
]
