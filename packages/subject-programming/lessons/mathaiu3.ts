// lessons/mathaiu3.ts — Chương C3 "Giải tích & tối ưu hoá" của khoá "Toán Thiết Yếu cho AI"
// (mathai) (docs/specs/2026-09-01-mathai-bai-hoc-chi-tiet.md).
import type { ProgrammingLesson } from '../lessonTypes.js'
import type {
  AnimationKeyframe,
  AnimationShape,
  LessonAnimation,
} from '@dhcb/core-contracts/lessonAnimation'

// Cùng một hàm f(x) = (x − 3)² cho hai lần chạy; chỉ tịnh tiến dấu trên các làn x.
// Điểm đánh giá trên parabol xuất hiện rời rạc, không trượt qua vị trí sai đồ thị.
const slowXs = [0, 0.6, 1.08, 1.464, 1.7712] as const
const fastXs = [0, 6, 0, 6, 0] as const
const stepMs = 2400
const xOnGraph = (x: number) => 60 + 60 * x
const yOnGraph = (x: number) => 240 - 20 * (x - 3) ** 2

function laneFrames(xs: readonly number[]): AnimationKeyframe[] {
  return xs.flatMap((x, index) => {
    if (index === 0) return [{ atMs: 0, dx: 0 }]
    return [
      { atMs: index * stepMs - 800, dx: 60 * (xs[index - 1] ?? 0) },
      { atMs: index * stepMs, dx: 60 * x },
    ]
  })
}

function sceneFrames(index: number): AnimationKeyframe[] {
  const arrival = index * stepMs
  const departure = arrival + 1600
  return [
    { atMs: 0, opacity: index === 0 ? 1 : 0 },
    ...(index > 0
      ? [
          { atMs: arrival - 1, opacity: 0 },
          { atMs: arrival, opacity: 1 },
        ]
      : []),
    ...(index < 4
      ? [
          { atMs: departure, opacity: 1 },
          { atMs: departure + 1, opacity: 0 },
        ]
      : []),
  ]
}

function revealFrames(arrival: number): AnimationKeyframe[] {
  return [
    { atMs: 0, opacity: 0 },
    { atMs: arrival - 1, opacity: 0 },
    { atMs: arrival, opacity: 1 },
  ]
}

function arrowFrames(index: number): AnimationKeyframe[] {
  const arrival = index * stepMs
  return [
    { atMs: 0, opacity: 0 },
    { atMs: arrival - 801, opacity: 0 },
    { atMs: arrival - 800, opacity: 1 },
    { atMs: arrival - 1, opacity: 1 },
    { atMs: arrival, opacity: 0 },
  ]
}

const slowStates = [
  'n=0 · x=0 · f=9',
  'n=1 · x=0,6 · f=5,76',
  'n=2 · x=1,08 · f=3,6864',
  'n=3 · x=1,464 · f≈2,3593',
  'n=4 · x=1,7712 · f≈1,5099',
] as const
const fastStates = [
  'n=0 · x=0 · f=9',
  'n=1 · x=6 · f=9',
  'n=2 · x=0 · f=9',
  'n=3 · x=6 · f=9',
  'n=4 · x=0 · f=9',
] as const

const gradientShapes: AnimationShape[] = [
  {
    kind: 'polyline',
    id: 'loss-curve',
    points: Array.from({ length: 31 }, (_, index): [number, number] => {
      const x = index / 5
      return [xOnGraph(x), yOnGraph(x)]
    }),
    stroke: 'neutral',
    strokeWidth: 3,
  },
  { kind: 'line', id: 'axis-x', x1: 60, y1: 240, x2: 420, y2: 240, stroke: 'muted' },
  { kind: 'line', id: 'axis-f', x1: 60, y1: 60, x2: 60, y2: 240, stroke: 'muted' },
  {
    kind: 'label',
    id: 'function-label',
    x: 240,
    y: 28,
    text: 'f(x) = (x−3)²',
    anchor: 'middle',
    size: 20,
    fill: 'neutral',
  },
  {
    kind: 'label',
    id: 'f-axis-label',
    x: 47,
    y: 43,
    text: 'f(x)',
    anchor: 'end',
    size: 20,
    fill: 'neutral',
  },
  {
    kind: 'label',
    id: 'f-nine-label',
    x: 47,
    y: 70,
    text: '9',
    anchor: 'end',
    size: 20,
    fill: 'neutral',
  },
  {
    kind: 'label',
    id: 'f-zero-label',
    x: 47,
    y: 240,
    text: '0',
    anchor: 'end',
    size: 20,
    fill: 'neutral',
  },
  {
    kind: 'label',
    id: 'x-axis-label',
    x: 448,
    y: 245,
    text: 'x',
    size: 20,
    fill: 'neutral',
  },
  {
    kind: 'label',
    id: 'zero-label',
    x: 60,
    y: 268,
    text: 'x=0',
    anchor: 'middle',
    size: 20,
    fill: 'neutral',
  },
  {
    kind: 'label',
    id: 'minimum-label',
    x: 240,
    y: 268,
    text: 'đáy x=3; f=0',
    anchor: 'middle',
    size: 20,
    fill: 'neutral',
  },
  {
    kind: 'label',
    id: 'six-label',
    x: 420,
    y: 268,
    text: 'x=6',
    anchor: 'middle',
    size: 20,
    fill: 'neutral',
  },
  { kind: 'circle', id: 'minimum', cx: 240, cy: 240, r: 5, fill: 'neutral' },
  { kind: 'circle', id: 'initial-loss', cx: 60, cy: 60, r: 5, fill: 'neutral' },
  ...slowXs.slice(1).map((x, index): AnimationShape => ({
    kind: 'circle',
    id: `slow-loss-n${index + 1}`,
    cx: xOnGraph(x),
    cy: yOnGraph(x),
    r: 5,
    fill: 'primary',
    keyframes: revealFrames((index + 1) * stepMs),
  })),
  {
    kind: 'rect',
    id: 'fast-loss-right',
    x: 416,
    y: 56,
    w: 8,
    h: 8,
    fill: 'accent',
    keyframes: revealFrames(stepMs),
  },
  {
    kind: 'line',
    id: 'slow-lane',
    x1: 60,
    y1: 366,
    x2: 420,
    y2: 366,
    stroke: 'muted',
    strokeWidth: 2,
  },
  {
    kind: 'line',
    id: 'fast-lane',
    x1: 60,
    y1: 477,
    x2: 420,
    y2: 477,
    stroke: 'muted',
    strokeWidth: 2,
  },
  {
    kind: 'label',
    id: 'slow-lane-label',
    x: 60,
    y: 310,
    text: 'lr=0,1 · hình tròn',
    size: 20,
    fill: 'neutral',
  },
  {
    kind: 'label',
    id: 'fast-lane-label',
    x: 60,
    y: 420,
    text: 'lr=1 · hình vuông',
    size: 20,
    fill: 'neutral',
  },
  {
    kind: 'circle',
    id: 'slow-x',
    cx: 60,
    cy: 366,
    r: 7,
    fill: 'primary',
    keyframes: laneFrames(slowXs),
  },
  {
    kind: 'rect',
    id: 'fast-x',
    x: 54,
    y: 471,
    w: 12,
    h: 12,
    fill: 'accent',
    keyframes: laneFrames(fastXs),
  },
  ...slowStates.map((text, index): AnimationShape => ({
    kind: 'label',
    id: `slow-state-n${index}`,
    x: 60,
    y: 340,
    text,
    size: 20,
    fill: 'neutral',
    keyframes: sceneFrames(index),
  })),
  ...fastStates.map((text, index): AnimationShape => ({
    kind: 'label',
    id: `fast-state-n${index}`,
    x: 60,
    y: 450,
    text,
    size: 20,
    fill: 'neutral',
    keyframes: sceneFrames(index),
  })),
  ...slowXs.slice(1).map((x, index): AnimationShape => ({
    kind: 'arrow',
    id: `update-slow-n${index + 1}`,
    x1: xOnGraph(slowXs[index] ?? 0),
    y1: 390,
    x2: xOnGraph(x),
    y2: 390,
    stroke: 'primary',
    strokeWidth: 2,
    keyframes: arrowFrames(index + 1),
  })),
  ...fastXs.slice(1).map((x, index): AnimationShape => ({
    kind: 'arrow',
    id: `update-fast-n${index + 1}`,
    x1: xOnGraph(fastXs[index] ?? 0),
    y1: 507,
    x2: xOnGraph(x),
    y2: 507,
    stroke: 'accent',
    strokeWidth: 2,
    keyframes: arrowFrames(index + 1),
  })),
]

const gradientAnimation: LessonAnimation = {
  title: 'Cùng điểm xuất phát, hai learning rate: tiến về đáy hoặc dao động',
  description:
    'Hai lần chạy bắt đầu tại x=0, f(x)=9 trên cùng hàm f(x)=(x−3)². Với lr=0,1, x lần lượt là 0; 0,6; 1,08; 1,464; 1,7712, tiến về đáy x=3 nhưng sau bốn bước vẫn chưa tới. Với lr=1, x luân phiên 0 và 6, còn f(x) luôn bằng 9: dao động không tăng biên độ. Làn hình tròn và làn hình vuông bên dưới thể hiện thay đổi của tham số x; các dấu trên parabol là những lần đánh giá loss rời rạc, không phải đường di chuyển của tham số.',
  viewBoxWidth: 480,
  viewBoxHeight: 540,
  durationMs: 12000,
  loop: false,
  shapes: gradientShapes,
  captions: [
    { atMs: 0, text: 'Bước 0: cả hai bắt đầu tại x=0, f(x)=9; gradient bằng −6.' },
    {
      atMs: 2400,
      text: 'Bước 1: x mới = x − lr·gradient. lr=0,1 cho x=0,6, f=5,76; lr=1 cho x=6, f=9.',
    },
    {
      atMs: 4800,
      text: 'Bước 2: tính lại gradient tại vị trí mới. lr=0,1 cho x=1,08, f=3,6864; lr=1 trở về x=0, f=9.',
    },
    {
      atMs: 7200,
      text: 'Bước 3: lr=0,1 cho x=1,464, f≈2,3593; lr=1 lại sang x=6. Chỉ đường đi thứ nhất giảm mất mát.',
    },
    {
      atMs: 9600,
      text: 'Bước 4: lr=0,1 cho x=1,7712, f≈1,5099; khoảng cách tới 3 nhân 0,8 mỗi bước. lr=1 tiếp tục dao động 0↔6, mất mát luôn 9.',
    },
  ],
}

export const MATHAI_U3_LESSONS: ProgrammingLesson[] = [
  {
    id: 'mathai-u3-l1',
    unitId: 'mathai-u3',
    language: 'python',
    title: 'Đạo hàm = tốc độ đổi — tự cài đạo hàm số (finite difference)',
    hook: 'Đồng hồ tốc độ trên xe máy chính là một cái máy tính đạo hàm: nó không đo bạn đã đi bao xa, nó đo quãng đường đang ĐỔI nhanh cỡ nào. Học máy sống bằng đúng câu hỏi đó — "nhích trọng số một tí thì sai số đổi bao nhiêu?" — và câu trả lời tên là đạo hàm.',
    theory:
      "ĐẠO HÀM của hàm f tại điểm x là TỐC ĐỘ ĐỔI của f quanh x: nhích x lên một chút thì f nhích bao nhiêu, tính trên mỗi đơn vị nhích. Hình học: độ dốc của tiếp tuyến tại điểm đó.\n\nĐịnh nghĩa giới hạn: f'(x) = lim(h→0) [f(x+h) - f(x)] / h. Máy tính không làm được \"h tiến tới 0\", nên ta lấy h NHỎ và tính xấp xỉ — gọi là ĐẠO HÀM SỐ (numerical differentiation / finite difference):\n\n- Sai phân TIẾN: (f(x+h) - f(x)) / h — đơn giản, sai số cỡ h.\n- Sai phân TRUNG TÂM: (f(x+h) - f(x-h)) / (2h) — nhìn cả hai bên, sai số cỡ h², chính xác hơn hẳn với cùng h. Khoá này dùng bản trung tâm.\n\nBa đạo hàm phải thuộc (kiểm lại được bằng code): f(x) = x² → f'(x) = 2x; f(x) = x → f'(x) = 1; f(x) = hằng số → f'(x) = 0. Cộng lại thì đạo hàm cũng cộng, nên f(x) = x² + 3x → f'(x) = 2x + 3.\n\nBẪY CHỌN h: h quá lớn thì công thức xấp xỉ thô, sai; h quá nhỏ (vd 1e-15) thì f(x+h) và f(x-h) gần bằng nhau tới mức số thực máy tính làm tròn mất phần chênh — kết quả nhiễu loạn. Vùng an toàn thực hành: h khoảng 1e-4 đến 1e-6.\n\nVÌ SAO AI CẦN: huấn luyện mô hình = tìm bộ trọng số làm hàm mất mát nhỏ nhất, và cách đi tới đó là hỏi đạo hàm \"nghiêng về phía nào thì lỗi giảm\". Thư viện thật (PyTorch) dùng AUTOGRAD — tính đạo hàm chính xác bằng quy tắc chuỗi thay vì xấp xỉ số — nhưng đạo hàm số vẫn được dùng để KIỂM TRA cài đặt autograd có đúng không (gradient checking).",
    workedExample: {
      code: `def f(x):
    return x * x + 3 * x        # f(x) = x^2 + 3x, dao ham that la 2x + 3

def dao_ham_tien(x, h):
    return (f(x + h) - f(x)) / h              # sai phan tien

def dao_ham_trung_tam(x, h):
    return (f(x + h) - f(x - h)) / (2 * h)    # sai phan trung tam

x = 2.0                          # dao ham that tai day: 2*2 + 3 = 7
print(f"That: {2 * x + 3}")
print(f"Tien h=0.1: {round(dao_ham_tien(x, 0.1), 6)}")
print(f"Trung tam h=0.1: {round(dao_ham_trung_tam(x, 0.1), 6)}")
print(f"Tien h=0.001: {round(dao_ham_tien(x, 0.001), 6)}")`,
      stdinLines: [],
    },
    predict: {
      code: `def f(x):\n    return x * x\nh = 0.1\nprint(round((f(3 + h) - f(3)) / h, 2))`,
      question: 'Sai phân TIẾN của f(x) = x² tại x = 3 với h = 0.1 in ra bao nhiêu?',
      choices: ['6.1', '6.0', '9.61', '0.61'],
      answerIndex: 0,
      explain:
        '(3.1² − 3²)/0.1 = (9.61 − 9)/0.1 = 0.61/0.1 = 6.1. Đạo hàm THẬT là 2·3 = 6.0, nên xấp xỉ tiến lệch đúng 0.1 = h. Đó là lý do sai phân trung tâm được ưa hơn: cùng h nhưng sai số nhỏ hơn nhiều vì nó cân hai bên.',
    },
    parsons: {
      prompt: 'Xếp đúng thứ tự tính đạo hàm số bằng sai phân trung tâm.',
      lines: [
        'def f(x):',
        '    return x * x + 3 * x',
        'x = float(input("Diem x: "))',
        'h = float(input("Buoc h: "))',
        'dao_ham = (f(x + h) - f(x - h)) / (2 * h)',
        'print(f"Dao ham xap xi: {round(dao_ham, 4)}")',
      ],
    },
    make: {
      prompt:
        'Tự cài máy tính đạo hàm số bằng SAI PHÂN TRUNG TÂM.\n\nHàm cố định của bài: f(x) = x*x + 3*x (đạo hàm thật là 2x + 3 — dùng để tự kiểm).\n\nChương trình đọc 2 dòng input(): điểm x và bước h (đều là số thực).\n\nIn đúng 1 dòng:\nDao ham xap xi: <(f(x+h) - f(x-h)) / (2*h), làm tròn 4 chữ số bằng round()>\n\nVí dụ x = 2, h = 0.001 → "Dao ham xap xi: 7.0".',
      starterCode: `def f(x):\n    return x * x + 3 * x\n\nx = float(input("Diem x: "))\nh = float(input("Buoc h: "))\n# dao_ham = (f(x + h) - f(x - h)) / (2 * h)\n# In: Dao ham xap xi: <lam tron 4 chu so>\n`,
      testCases: [
        {
          stdinLines: ['2', '0.001'],
          expected: 'Dao ham xap xi: 7.0',
          match: 'contains',
          hidden: false,
          label: 'x = 2 → đạo hàm thật 2·2 + 3 = 7.0',
        },
        {
          stdinLines: ['0', '0.01'],
          expected: 'Dao ham xap xi: 3.0',
          match: 'contains',
          hidden: false,
          label: 'x = 0 → đạo hàm 3.0 (phần 2x biến mất)',
        },
        {
          stdinLines: ['2', '0.5'],
          expected: 'Dao ham xap xi: 7.0',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: h TO tận 0.5 mà sai phân trung tâm vẫn đúng với hàm bậc 2',
        },
      ],
      hints: [
        'Định nghĩa hàm f trước, rồi mới gọi f(x + h) và f(x - h) — đừng viết lại công thức x*x + 3*x hai lần.',
        'Mẫu số là 2 * h chứ không phải h: sai phân trung tâm đi từ x-h tới x+h nên quãng đường là 2h.',
        'In đúng định dạng: print(f"Dao ham xap xi: {round(dao_ham, 4)}").',
      ],
      sampleSolution: `def f(x):\n    return x * x + 3 * x\n\nx = float(input("Diem x: "))\nh = float(input("Buoc h: "))\ndao_ham = (f(x + h) - f(x - h)) / (2 * h)\nprint(f"Dao ham xap xi: {round(dao_ham, 4)}")`,
    },
    homework:
      'Chạy chương trình tại x = 2 với h = 0.1, 0.001, 1e-8, 1e-14 và ghi lại 4 kết quả (bỏ round để thấy đủ chữ số). Đạo hàm thật là 7. h nhỏ dần thì kết quả tốt lên tới một mức nào rồi bắt đầu TỆ ĐI — vì sao? (Gợi ý: số thực trong máy tính chỉ giữ được khoảng 16 chữ số có nghĩa, nên f(x+h) và f(x-h) quá gần nhau thì phần chênh bị làm tròn mất.) Viết 3 câu kết luận về vùng h an toàn.',
    srsCards: [
      {
        hoi: 'Đạo hàm của một hàm tại điểm x nói lên điều gì?',
        dap: 'Tốc độ đổi của hàm quanh điểm đó — nhích x một đơn vị thì f đổi bao nhiêu; hình học là độ dốc của tiếp tuyến. Dấu dương nghĩa là hàm đang tăng, âm là đang giảm, bằng 0 là điểm bằng phẳng (cực trị hoặc yên ngựa).',
      },
      {
        hoi: 'Công thức sai phân trung tâm và ưu điểm so với sai phân tiến?',
        dap: 'Trung tâm: (f(x+h) − f(x−h)) / (2h); tiến: (f(x+h) − f(x)) / h. Trung tâm nhìn cân cả hai bên nên sai số cỡ h² thay vì h — với cùng bước h thì chính xác hơn hẳn, thậm chí đúng tuyệt đối với hàm bậc hai.',
      },
      {
        hoi: 'Vì sao chọn h quá nhỏ lại làm đạo hàm số sai?',
        dap: 'Vì số thực máy tính chỉ giữ ~16 chữ số có nghĩa: h quá nhỏ thì f(x+h) và f(x−h) gần bằng nhau tới mức phần chênh bị làm tròn mất, chia cho 2h càng khuếch đại nhiễu. Vùng thực hành an toàn khoảng 1e-4 đến 1e-6.',
      },
    ],
  },
  {
    id: 'mathai-u3-l2',
    unitId: 'mathai-u3',
    language: 'python',
    title: 'Đạo hàm riêng & gradient — mũi tên chỉ hướng dốc nhất',
    hook: 'Đứng giữa sườn đồi trong sương mù dày, muốn xuống nhanh nhất thì làm gì? Dùng chân dò: bước sang đông dốc bao nhiêu, bước sang bắc dốc bao nhiêu. Ghép hai con số đó thành một mũi tên — đó chính là GRADIENT, và mọi mô hình AI trên đời đều được huấn luyện bằng đúng động tác dò chân này.',
    theory:
      'Hàm thật trong học máy có hàng triệu biến (mỗi trọng số là một biến). Với hàm nhiều biến, ĐẠO HÀM RIÊNG theo một biến = đạo hàm khi COI MỌI BIẾN KHÁC LÀ HẰNG SỐ. Ký hiệu ∂f/∂x đọc là "đạo hàm riêng của f theo x".\n\nVí dụ f(x, y) = x² + 3y²:\n- ∂f/∂x = 2x (coi y đứng yên, phần 3y² thành hằng số nên đạo hàm 0),\n- ∂f/∂y = 6y (coi x đứng yên).\n\nGRADIENT là VECTOR gom tất cả đạo hàm riêng lại: grad f = [∂f/∂x, ∂f/∂y]. Hai tính chất làm nên toàn bộ huấn luyện AI:\n1. Gradient chỉ hướng hàm TĂNG NHANH NHẤT tại điểm đó. Muốn GIẢM thì đi NGƯỢC gradient — đó là "gradient descent" của bài sau.\n2. Độ dài gradient cho biết dốc cỡ nào. Gradient bằng vector 0 nghĩa là đang ở chỗ bằng phẳng: đáy, đỉnh, hoặc điểm yên ngựa.\n\nHình dung MẶT LỖI (loss surface): với 2 biến, hàm mất mát là một mặt đồi trong không gian 3 chiều; huấn luyện là đi bộ trên mặt đồi đó tìm đáy. Với hàng triệu biến thì không vẽ được nữa, nhưng công thức vẫn y hệt — đây là lý do người ta luôn dạy bằng ví dụ 2 biến.\n\nTính gradient bằng đạo hàm số: làm sai phân trung tâm cho TỪNG biến, mỗi lần chỉ nhích đúng biến đó, các biến khác giữ nguyên. Với n biến thì tốn 2n lần gọi hàm — quá đắt cho mạng nơ-ron thật (hàng triệu biến), nên PyTorch dùng lan truyền ngược (backpropagation) tính toàn bộ gradient trong MỘT lượt. Nhưng bản số này vẫn là công cụ kiểm tra chuẩn khi nghi cài sai.',
    workedExample: {
      code: `def f(x, y):
    return x * x + 3 * y * y     # dao ham rieng that: 2x va 6y

h = 0.001
x, y = 1.0, 2.0

# Nhich RIENG x, giu y dung yen
gx = (f(x + h, y) - f(x - h, y)) / (2 * h)
# Nhich RIENG y, giu x dung yen
gy = (f(x, y + h) - f(x, y - h)) / (2 * h)

print(f"Dao ham rieng theo x: {round(gx, 4)} (that: {2 * x})")
print(f"Dao ham rieng theo y: {round(gy, 4)} (that: {6 * y})")
print(f"Gradient: [{round(gx, 4)}, {round(gy, 4)}]")
do_doc = (gx * gx + gy * gy) ** 0.5      # do dai gradient = do doc
print(f"Do doc tai day: {round(do_doc, 4)}")`,
      stdinLines: [],
    },
    predict: {
      code: `def f(x, y):\n    return x * x + 3 * y * y\nh = 0.001\nprint(round((f(1, 1 + h) - f(1, 1 - h)) / (2 * h), 2))`,
      question: 'Đạo hàm riêng theo y tại điểm (1, 1) in ra bao nhiêu?',
      choices: ['6.0', '2.0', '4.0', '8.0'],
      answerIndex: 0,
      explain:
        'Đạo hàm riêng theo y của x² + 3y² là 6y, tại y = 1 cho 6.0. Chú ý phần x² hoàn toàn biến mất vì khi nhích y ta GIỮ x = 1 đứng yên, nên nó là hằng số và không đóng góp gì vào độ chênh.',
    },
    parsons: {
      prompt: 'Xếp đúng thứ tự tính gradient 2 biến: nhích riêng x → nhích riêng y → in vector.',
      lines: [
        'def f(x, y):',
        '    return x * x + 3 * y * y',
        'gx = (f(x + h, y) - f(x - h, y)) / (2 * h)',
        'gy = (f(x, y + h) - f(x, y - h)) / (2 * h)',
        'print(f"Gradient: {round(gx, 4)},{round(gy, 4)}")',
      ],
    },
    make: {
      prompt:
        'Tự cài máy tính GRADIENT cho hàm 2 biến bằng sai phân trung tâm.\n\nHàm cố định của bài: f(x, y) = x*x + 3*y*y (gradient thật là [2x, 6y] — dùng để tự kiểm).\n\nChương trình đọc 3 dòng input(): x, y rồi h (đều là số thực).\n\nIn đúng 1 dòng:\nGradient: <đạo hàm riêng theo x>,<đạo hàm riêng theo y>\n\nHai thành phần cách nhau ĐÚNG một dấu phẩy, không dấu cách, mỗi thành phần làm tròn 4 chữ số bằng round().\n\nVí dụ x = 1, y = 1, h = 0.001 → "Gradient: 2.0,6.0".',
      starterCode: `def f(x, y):\n    return x * x + 3 * y * y\n\nx = float(input("x: "))\ny = float(input("y: "))\nh = float(input("h: "))\n# gx: nhich RIENG x, giu y nguyen. gy: nhich RIENG y, giu x nguyen.\n# In: Gradient: <gx>,<gy>\n`,
      testCases: [
        {
          stdinLines: ['1', '1', '0.001'],
          expected: 'Gradient: 2.0,6.0',
          match: 'contains',
          hidden: false,
          label: 'Tại (1,1) → [2·1, 6·1] = [2.0, 6.0]',
        },
        {
          stdinLines: ['0', '2', '0.001'],
          expected: 'Gradient: 0.0,12.0',
          match: 'contains',
          hidden: false,
          label: 'x = 0 → thành phần x bằng 0.0, y = 2 → 12.0',
        },
        {
          stdinLines: ['-2', '0', '0.01'],
          expected: 'Gradient: -4.0,0.0',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: x ÂM → gradient âm; y = 0 → đang ở đáy theo trục y',
        },
      ],
      hints: [
        'Mỗi đạo hàm riêng chỉ nhích ĐÚNG MỘT biến: f(x + h, y) và f(x - h, y) cho gx — y giữ nguyên ở cả hai lần gọi.',
        'Tương tự gy dùng f(x, y + h) và f(x, y - h); cả hai đều chia cho 2 * h.',
        'In một dòng duy nhất: print(f"Gradient: {round(gx, 4)},{round(gy, 4)}") — không thêm dấu cách sau dấu phẩy.',
      ],
      sampleSolution: `def f(x, y):\n    return x * x + 3 * y * y\n\nx = float(input("x: "))\ny = float(input("y: "))\nh = float(input("h: "))\ngx = (f(x + h, y) - f(x - h, y)) / (2 * h)\ngy = (f(x, y + h) - f(x, y - h)) / (2 * h)\nprint(f"Gradient: {round(gx, 4)},{round(gy, 4)}")`,
    },
    homework:
      'Chạy chương trình tại 5 điểm: (3,3), (1,1), (0.1,0.1), (0,0) và (-1,-1). Với mỗi điểm, ghi lại gradient và tính độ dài của nó. Bạn thấy quy luật gì khi tiến về gốc toạ độ (0,0)? Rồi trả lời bằng lời: nếu ta luôn bước NGƯỢC hướng gradient một đoạn tỷ lệ với chính gradient, thì càng gần đáy các bước sẽ càng thế nào — và vì sao đó là tính chất tuyệt vời cho một thuật toán huấn luyện?',
    srsCards: [
      {
        hoi: 'Đạo hàm riêng theo một biến nghĩa là gì?',
        dap: 'Là đạo hàm của hàm khi COI MỌI BIẾN KHÁC LÀ HẰNG SỐ — chỉ nhích đúng biến đang xét. Ví dụ f(x,y) = x² + 3y² có ∂f/∂x = 2x (phần 3y² thành hằng nên biến mất) và ∂f/∂y = 6y.',
      },
      {
        hoi: 'Gradient là gì và hai tính chất quan trọng nhất của nó?',
        dap: 'Gradient là vector gom mọi đạo hàm riêng: [∂f/∂x, ∂f/∂y, ...]. (1) Nó chỉ hướng hàm TĂNG nhanh nhất, nên muốn giảm thì đi ngược lại; (2) độ dài của nó cho biết độ dốc — gradient bằng 0 nghĩa là đang ở chỗ bằng phẳng (đáy, đỉnh hoặc yên ngựa).',
      },
      {
        hoi: 'Vì sao mạng nơ-ron thật không tính gradient bằng sai phân số?',
        dap: 'Vì sai phân số cần 2 lần gọi hàm cho MỖI biến, mà mô hình có hàng triệu tới hàng tỷ trọng số. Thay vào đó dùng lan truyền ngược (backpropagation) tính toàn bộ gradient chính xác trong một lượt; sai phân số chỉ dùng để kiểm tra cài đặt (gradient checking).',
      },
    ],
  },
  {
    id: 'mathai-u3-l3',
    unitId: 'mathai-u3',
    language: 'python',
    title: 'Gradient descent tự cài — learning rate đổi đường đi thế nào?',
    hook: 'Bịt mắt thả vào một cái bát khổng lồ, làm sao xuống đáy? Dò chân tìm hướng dốc, bước một bước, dò lại, bước tiếp. Bước quá bé có thể tiến rất chậm; bước quá to có thể vượt đáy rồi dao động hoặc văng xa hơn. Ví dụ một biến này giúp ta hiểu cách cập nhật tham số của mô hình khả vi.',
    theory:
      "GRADIENT DESCENT là một thuật toán nền tảng để tối ưu hàm mất mát khả vi. Mỗi vòng lặp:\n1. Tính gradient tại vị trí hiện tại.\n2. Cập nhật NGƯỢC hướng gradient: x_moi = x - lr * gradient.\n3. Tính lại gradient ở vị trí mới và lặp đến điều kiện dừng đã chọn.\n\nLEARNING RATE (lr, tốc độ học) nhân với gradient để quyết định độ dài bước. Giá trị phù hợp phụ thuộc vào hàm, điểm xuất phát và cách tối ưu; không có một lr tốt cho mọi bài toán. lr nhỏ có thể tiến chậm, còn lr lớn có thể vượt cực tiểu, dao động hoặc phân kỳ.\n\nXét RIÊNG f(x) = (x−3)² với x₀ = 0, đáy x = 3 và f'(x) = 2(x−3). Quy tắc x_moi = x − lr·2(x−3) cho sai lệch có dấu e_moi = (1−2lr)·e, với e = x−3:\n- lr = 0,1 → e nhân 0,8, nên khoảng cách tới 3 giảm 20% mỗi bước; sau bốn bước x=1,7712, CHƯA tới đáy.\n- lr = 0,5 → e thành 0 sau một bước với hàm và lr đang xét.\n- lr = 1 → e đổi dấu nhưng giữ độ lớn: x luân phiên 0 và 6, f(x) luôn 9; dao động KHÔNG tăng biên độ.\n- lr > 1 → |1−2lr| > 1, sai lệch tăng độ lớn nếu chưa ở đáy; loss có thể tăng rất lớn rồi gây tràn số.\n\nKhi loss tăng hoặc ra NaN, hãy kiểm cả dữ liệu, phép toán và learning rate; NaN không tự chứng minh lr quá lớn. Với hàm tổng quát, gradient descent có thể không hội tụ hoặc dừng ở điểm không phải cực tiểu; không có bảo đảm luôn tìm được một đáy. Momentum tích lũy hướng cập nhật, còn Adam dùng lịch sử gradient để điều chỉnh từng bước; cả hai vẫn dựa trên gradient nhưng không chỉ là thay một hằng số lr.",
    animation: gradientAnimation,
    workedExample: {
      code: `def f(x):
    return (x - 3) ** 2          # day nam tai x = 3

def grad(x):
    return 2 * (x - 3)           # dao ham cua f

x = 0.0                          # diem xuat phat
lr = 0.1                         # learning rate
for buoc in range(5):            # in 5 buoc dau cho thay xu huong
    g = grad(x)
    x = x - lr * g               # buoc NGUOC huong gradient
    print(f"Buoc {buoc + 1}: x = {round(x, 4)}, f(x) = {round(f(x), 4)}")

print(f"Con cach day: {round(abs(x - 3), 4)}")`,
      stdinLines: [],
    },
    predict: {
      code: `x = 0.0\nlr = 0.1\ngrad = 2 * (x - 3)\nx = x - lr * grad\nprint(round(x, 2))`,
      question: 'Sau ĐÚNG MỘT bước gradient descent từ x = 0 với lr = 0.1, x bằng bao nhiêu?',
      choices: ['0.6', '-0.6', '3.0', '0.0'],
      answerIndex: 0,
      explain:
        'gradient = 2(0−3) = −6; bước ngược hướng: x = 0 − 0.1·(−6) = 0.6. Gradient ÂM nghĩa là hàm đang giảm khi x tăng, nên đi ngược gradient chính là đi SANG PHẢI — về phía đáy x = 3. Dấu trừ trong công thức lo đúng chuyện đó.',
    },
    parsons: {
      prompt:
        'Xếp đúng vòng lặp gradient descent: định nghĩa gradient → lặp cố định số bước → cập nhật → in.',
      lines: [
        'def grad(x):',
        '    return 2 * (x - 3)',
        'for _ in range(20):',
        '    g = grad(x)',
        '    x = x - lr * g',
        'print(f"x cuoi: {round(x, 4)}")',
      ],
    },
    make: {
      prompt:
        'Tự cài gradient descent tìm đáy của f(x) = (x - 3)², với đạo hàm f\'(x) = 2*(x - 3).\n\nChương trình đọc 2 dòng input(): x ban đầu và learning rate (số thực).\n\nChạy ĐÚNG 20 bước lặp (dùng range(20)), mỗi bước cập nhật x = x - lr * 2 * (x - 3).\n\nSau 20 bước in đúng 2 dòng:\nx cuoi: <x làm tròn 4 chữ số bằng round()>\nf(x): <(x - 3) ** 2 làm tròn 4 chữ số>\n\nVí dụ x0 = 10, lr = 0.5 → nhảy thẳng vào đáy: "x cuoi: 3.0" và "f(x): 0.0".',
      starterCode: `x = float(input("x ban dau: "))\nlr = float(input("Learning rate: "))\nfor _ in range(20):\n    grad = 2 * (x - 3)\n    # Cap nhat x nguoc huong gradient\n# In 2 dong ket qua sau vong lap\n`,
      testCases: [
        {
          stdinLines: ['0', '0.1'],
          expected: 'x cuoi: 2.9654\nf(x): 0.0012',
          match: 'contains',
          hidden: false,
          label: 'lr vừa phải → sau 20 bước gần sát đáy 3',
        },
        {
          stdinLines: ['10', '0.5'],
          expected: 'x cuoi: 3.0\nf(x): 0.0',
          match: 'contains',
          hidden: false,
          label: 'lr = 0.5 → nhảy đúng vào đáy ngay bước đầu',
        },
        {
          stdinLines: ['0', '1.0'],
          expected: 'x cuoi: 0.0\nf(x): 9.0',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: lr = 1.0 → dao động 0 ↔ 6 mãi, KHÔNG hội tụ',
        },
      ],
      hints: [
        'Cập nhật phải là x = x - lr * grad (dấu TRỪ) — cộng vào là leo ngược lên đỉnh, sai số sẽ tăng.',
        'Tính grad = 2 * (x - 3) LẠI Ở MỖI VÒNG bằng x mới nhất; tính một lần ngoài vòng lặp là sai.',
        'Sau vòng lặp mới in: print(f"x cuoi: {round(x, 4)}") rồi print(f"f(x): {round((x - 3) ** 2, 4)}").',
      ],
      sampleSolution: `x = float(input("x ban dau: "))\nlr = float(input("Learning rate: "))\nfor _ in range(20):\n    grad = 2 * (x - 3)\n    x = x - lr * grad\nprint(f"x cuoi: {round(x, 4)}")\nprint(f"f(x): {round((x - 3) ** 2, 4)}")`,
    },
    homework:
      'Chạy chương trình với x0 = 0 và lr lần lượt 0.001, 0.01, 0.1, 0.5, 0.9, 1.0, 1.1 rồi lập bảng 7 dòng (lr, x cuối, f(x)). Đánh dấu trường hợp tiến chậm, tiến nhanh, dao động và phân kỳ trong ví dụ này. Viết 3 câu giải thích vì sao không thể lấy cùng kết luận về lr cho mọi hàm mất mát.',
    srsCards: [
      {
        hoi: 'Ba bước của một vòng lặp gradient descent?',
        dap: '(1) Tính gradient của hàm mất mát tại vị trí hiện tại; (2) bước NGƯỢC hướng gradient: x = x − lr·gradient; (3) lặp lại tới khi hết số bước hoặc gradient đủ nhỏ. Dấu trừ là thứ biến "leo lên" thành "đi xuống".',
      },
      {
        hoi: 'Learning rate quá lớn và quá nhỏ gây hậu quả gì?',
        dap: 'lr nhỏ có thể tiến rất chậm; lr lớn có thể vượt đáy, dao động hoặc phân kỳ. Riêng f(x)=(x−3)² từ x=0: lr=1 dao động 0↔6 với loss=9, còn lr>1 làm sai lệch tăng biên độ. NaN cũng có thể đến từ dữ liệu hoặc phép toán sai.',
      },
      {
        hoi: 'Gradient descent có hứa tìm được đáy sâu nhất không?',
        dap: 'Không. Với hàm tổng quát, thuật toán có thể không hội tụ hoặc dừng ở điểm không phải cực tiểu. Kết quả phụ thuộc hàm, điểm khởi tạo, learning rate và cách cập nhật; không có lời hứa luôn tới một đáy.',
      },
    ],
  },
  {
    id: 'mathai-u3-l4',
    unitId: 'mathai-u3',
    language: 'python',
    title: 'Tối ưu trong ML thật — MSE, mini-batch, local minimum & tổng kết khoá',
    hook: 'Bạn vừa có đủ bốn mảnh: xác suất để hiểu dữ liệu, vector/ma trận để biểu diễn nó, đạo hàm để biết nghiêng về đâu, gradient descent để đi. Bài cuối này ráp cả bốn lại thành đúng cái vòng lặp mà mọi mô hình AI trên đời đang chạy — rồi chỉ đường bạn đi tiếp.',
    theory:
      'HÀM MẤT MÁT (loss function) là con số đo "mô hình sai bao nhiêu" — thứ mà gradient descent đi tìm đáy. Cho bài đoán số, chuẩn mực là SAI SỐ BÌNH PHƯƠNG TRUNG BÌNH (MSE):\n\nMSE = trung bình của (dự đoán - thực tế)²\n\nBình phương để sai lệch âm/dương không triệt tiêu và để phạt nặng những cú sai lớn — chính là phương sai của sai số (bài mathai-u1-l3). MSE luôn >= 0, bằng 0 khi đoán đúng tuyệt đối. Họ hàng: MAE (trị tuyệt đối, ít nhạy ngoại lai hơn) cho hồi quy, cross-entropy cho phân loại.\n\nGHÉP TOÀN BỘ KHOÁ LẠI — vòng lặp huấn luyện thật:\n1. Lấy dữ liệu, biểu diễn thành ma trận (C2).\n2. Mô hình tính dự đoán bằng phép nhân ma trận (C2).\n3. Hàm mất mát MSE đo sai (C1 + bài này).\n4. Tính gradient của mất mát theo từng trọng số (C3 bài 1–2).\n5. Cập nhật trọng số ngược hướng gradient (C3 bài 3).\n6. Lặp lại vài nghìn lần.\n\nBA KHÁI NIỆM THỰC CHIẾN khép lại khoá:\n- MINI-BATCH: tính gradient trên TOÀN BỘ dữ liệu mỗi bước (batch gradient descent) thì quá chậm với triệu mẫu; tính trên đúng 1 mẫu (stochastic) thì nhiễu loạn. Thực tế lấy từng lô nhỏ 32–256 mẫu — nhanh, và chút nhiễu còn giúp thoát đáy nông. Một EPOCH là một lượt đi hết dữ liệu.\n- LOCAL MINIMUM & YÊN NGỰA: mặt lỗi thật gồ ghề, gradient descent chỉ tìm được một đáy gần nơi xuất phát. Trong không gian nhiều chiều, kẻ cản đường thường là điểm yên ngựa chứ không phải đáy địa phương; momentum/Adam sinh ra để lướt qua chúng.\n- HÀM LỒI (convex): hàm chỉ có ĐÚNG MỘT đáy (như parabol bài trước) — gradient descent luôn tìm ra. Hồi quy tuyến tính, hồi quy logistic thuộc loại này; mạng nơ-ron thì KHÔNG, nên huấn luyện mạng luôn có phần may rủi và phụ thuộc khởi tạo.\n\nĐI TIẾP TỪ ĐÂY: khoá `mlds` (Machine Learning & Data Science) dùng đúng bộ toán này cho pipeline dữ liệu thật; khoá `cv1` cài forward pass MLP/CNN bằng nhân ma trận bạn tự viết; khoá `llmagent` dùng cosine similarity cho RAG. Muốn đào sâu phần toán thuần, đi hướng nền `mathforcode` chặng S4 (giải tích & tối ưu cho AI/ML) của môn Lập trình.',
    workedExample: {
      code: `du_doan = [3.0, 5.0, 7.0]      # mo hinh doan
thuc_te = [3.0, 4.0, 9.0]      # dap an that

tong = 0.0
for i in range(len(thuc_te)):
    sai = du_doan[i] - thuc_te[i]      # sai lech tung mau
    print(f"Mau {i + 1}: sai {sai}, binh phuong {sai ** 2}")
    tong += sai ** 2                    # cong don binh phuong
mse = tong / len(thuc_te)               # trung binh
print(f"MSE: {round(mse, 4)}")

# So voi MAE (tri tuyet doi) de thay MSE phat nang cu sai lon
mae = sum(abs(du_doan[i] - thuc_te[i]) for i in range(3)) / 3
print(f"MAE: {round(mae, 4)}")`,
      stdinLines: [],
    },
    predict: {
      code: `du_doan = [1.0, 2.0]\nthuc_te = [2.0, 2.0]\nmse = sum((du_doan[i] - thuc_te[i]) ** 2 for i in range(2)) / 2\nprint(mse)`,
      question: 'MSE của hai mẫu này in ra là bao nhiêu?',
      choices: ['0.5', '1.0', '0.0', '2.0'],
      answerIndex: 0,
      explain:
        'Sai lệch là −1 và 0; bình phương thành 1 và 0; trung bình 1/2 = 0.5. Nhớ chia cho SỐ MẪU chứ không phải chỉ cộng lại — nếu không thì tập dữ liệu càng lớn mất mát càng to, so sánh giữa hai tập sẽ vô nghĩa.',
    },
    parsons: {
      prompt:
        'Xếp đúng thứ tự tính MSE: đọc hai dãy → cộng dồn bình phương sai lệch → chia số mẫu → in.',
      lines: [
        'du_doan = [float(v) for v in input("Du doan: ").split(",")]',
        'thuc_te = [float(v) for v in input("Thuc te: ").split(",")]',
        'n = len(thuc_te)',
        'tong = sum((du_doan[i] - thuc_te[i]) ** 2 for i in range(n))',
        'mse = tong / n',
        'print(f"MSE: {round(mse, 4)}")',
      ],
    },
    make: {
      prompt:
        'Cài hàm mất mát MSE — thước đo mà gradient descent đi tìm đáy.\n\nChương trình đọc 2 dòng input():\n- Dòng 1: các giá trị mô hình DỰ ĐOÁN, cách nhau dấu phẩy.\n- Dòng 2: các giá trị THỰC TẾ, cùng độ dài.\n\nIn đúng 1 dòng:\nMSE: <trung bình của bình phương sai lệch, làm tròn 4 chữ số bằng round()>\n\nVí dụ "1,2,3" và "1,2,4" → sai lệch 0, 0, -1 → MSE = 1/3 → "MSE: 0.3333".',
      starterCode: `du_doan = [float(v) for v in input("Du doan: ").split(",")]\nthuc_te = [float(v) for v in input("Thuc te: ").split(",")]\n# tong = sum((du_doan[i] - thuc_te[i]) ** 2 for i in range(len(thuc_te)))\n# In: MSE: <tong chia so mau, lam tron 4 chu so>\n`,
      testCases: [
        {
          stdinLines: ['1,2,3', '1,2,4'],
          expected: 'MSE: 0.3333',
          match: 'contains',
          hidden: false,
          label: 'Sai đúng 1 đơn vị ở 1 trên 3 mẫu → 0.3333',
        },
        {
          stdinLines: ['5,5', '5,5'],
          expected: 'MSE: 0.0',
          match: 'contains',
          hidden: false,
          label: 'Đoán đúng tuyệt đối → MSE bằng 0.0',
        },
        {
          stdinLines: ['0,0', '3,4'],
          expected: 'MSE: 12.5',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: sai 3 và 4 → (9 + 16)/2 = 12.5, cú sai lớn bị phạt nặng',
        },
      ],
      hints: [
        'Sai lệch từng mẫu là du_doan[i] - thuc_te[i]; bình phương bằng ** 2 để dấu âm không triệt tiêu dấu dương.',
        'Cộng dồn hết rồi mới chia cho SỐ MẪU len(thuc_te) — quên chia thì tập càng lớn mất mát càng to.',
        'In đúng định dạng: print(f"MSE: {round(mse, 4)}").',
      ],
      sampleSolution: `du_doan = [float(v) for v in input("Du doan: ").split(",")]\nthuc_te = [float(v) for v in input("Thuc te: ").split(",")]\nn = len(thuc_te)\ntong = sum((du_doan[i] - thuc_te[i]) ** 2 for i in range(n))\nprint(f"MSE: {round(tong / n, 4)}")`,
    },
    homework:
      'Ráp trọn khoá thành một chương trình duy nhất: dùng hồi quy tuyến tính đơn giản y = a*x (chỉ một tham số a) trên dữ liệu x = [1,2,3], y = [2,4,6]. Viết hàm mat_mat(a) trả về MSE của dự đoán a*x so với y; tính đạo hàm của nó theo a bằng sai phân trung tâm (bài mathai-u3-l1); rồi chạy gradient descent 50 bước từ a = 0 với lr = 0.05. a có tiến về 2.0 không? Đổi lr thành 0.5 xem chuyện gì xảy ra. Bạn vừa tự huấn luyện một mô hình từ đầu tới cuối bằng chính bốn mảnh toán của khoá này.',
    srsCards: [
      {
        hoi: 'MSE tính thế nào và vì sao bình phương?',
        dap: 'MSE = trung bình của (dự đoán − thực tế)². Bình phương để sai lệch âm và dương không triệt tiêu nhau, và để phạt nặng những cú sai lớn. MSE luôn >= 0, bằng 0 khi đoán đúng tuyệt đối; nhớ chia cho số mẫu để so sánh được giữa các tập dữ liệu.',
      },
      {
        hoi: 'Mini-batch gradient descent là gì và vì sao được dùng phổ biến nhất?',
        dap: 'Tính gradient trên từng lô nhỏ 32–256 mẫu thay vì toàn bộ dữ liệu (quá chậm) hay đúng một mẫu (quá nhiễu). Nó nhanh, dùng được GPU hiệu quả, và chút nhiễu còn giúp thoát khỏi đáy nông. Một lượt đi hết dữ liệu gọi là một epoch.',
      },
      {
        hoi: 'Hàm lồi (convex) khác mặt lỗi của mạng nơ-ron thế nào?',
        dap: 'Hàm lồi chỉ có đúng một đáy (parabol, hồi quy tuyến tính/logistic) nên gradient descent luôn tìm ra nghiệm tốt nhất. Mặt lỗi mạng nơ-ron gồ ghề, nhiều đáy địa phương và điểm yên ngựa, nên kết quả phụ thuộc điểm khởi tạo, learning rate và thuật toán tối ưu (momentum, Adam).',
      },
      {
        hoi: 'Vòng lặp huấn luyện một mô hình gồm những bước nào?',
        dap: 'Biểu diễn dữ liệu thành ma trận → mô hình tính dự đoán bằng nhân ma trận → hàm mất mát (MSE/cross-entropy) đo sai → tính gradient của mất mát theo từng trọng số → cập nhật trọng số ngược hướng gradient → lặp lại nhiều epoch.',
      },
    ],
  },
]
