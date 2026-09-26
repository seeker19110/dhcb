// lessons/hoa11c5.ts — Hoá học 11, Chương 5: Dẫn xuất halogen - Alcohol - Phenol (4 bài).
// Đối chiếu mục lục thật: tai-lieu-sgk/SGK-Hoa/11/page_0005.png (OCR 2026-08-31).
// reviewStatus='draft' — soạn từ docs/research/kho-kien-thuc-hoa-gdpt2018.md §3, chưa duyệt.
import type { ChemLesson } from '../lessonTypes.js'

export const HOA11_C5_LESSONS: ChemLesson[] = [
  {
    id: 'hoa11-c5-b19',
    grade: '11',
    chapterNumber: 5,
    chapterTitle: 'Dẫn xuất halogen - Alcohol - Phenol',
    lessonNumber: 19,
    title: 'Dẫn xuất halogen',
    hook:
      'Chảo chống dính Teflon bền bỉ và ống nhựa PVC dẻo dai đều là polymer được tổng hợp từ dẫn xuất halogen. ' +
      'Các hợp chất này mang nhiều ứng dụng quan trọng lẫn thách thức môi trường.',
    theory:
      'KHÁI NIỆM:\n' +
      '— Dẫn xuất halogen là hợp chất thu được khi thay thế một hay nhiều nguyên tử hydrogen trong phân tử hydrocarbon bằng một hay nhiều nguyên tử halogen (F, Cl, Br, I).\n\n' +
      'TÍNH CHẤT HOÁ HỌC (Hai phản ứng quan trọng):\n' +
      '1. Phản ứng thế nhóm halogen bằng nhóm OH (phản ứng thuỷ phân):\n' +
      '   — Dẫn xuất halogen đun nóng với dung dịch kiềm (NaOH, KOH) tạo thành alcohol và muối halide.\n' +
      '   — Phương trình tổng quát: R−X + NaOH → R−OH + NaX (t°).\n' +
      '2. Phản ứng tách hydrogen halide (HX):\n' +
      '   — Dẫn xuất halogen có nguyên tử H ở carbon bên cạnh (Cβ) khi đun nóng với dung dịch kiềm trong ethanol (KOH/C₂H₅OH) sẽ bị tách HX tạo ra alkene.\n' +
      '   — Quy tắc Zaitsev (định hướng tách): Trong phản ứng tách HX, nguyên tử halogen (X) ưu tiên tách ra cùng với nguyên tử hydrogen (H) ở carbon bên cạnh có bậc cao hơn (có ít hydrogen hơn) để tạo ra sản phẩm chính có liên kết đôi bền vững hơn.',
    workedExample: {
      problem:
        'Xác định công thức cấu tạo của sản phẩm chính khi thực hiện phản ứng tách HBr từ chất ' +
        '2-bromobutane (CH₃-CH(Br)-CH₂-CH₃) bằng dung dịch KOH trong ethanol đun nóng.',
      steps: [
        '2-bromobutane có nguyên tử Br gắn ở C số 2.',
        'Hai carbon bên cạnh C số 2 là C số 1 (nhóm −CH₃ có 3 H) và C số 3 (nhóm −CH₂− có 2 H).',
        'Theo quy tắc Zaitsev, Br sẽ ưu tiên tách cùng H ở carbon bên cạnh có ít H hơn (C số 3 có 2 H, ít hơn C số 1 có 3 H).',
        'Sự tách Br ở C số 2 và H ở C số 3 tạo liên kết đôi giữa C số 2 và C số 3.',
        'Sản phẩm chính thu được là: CH₃-CH=CH-CH₃ (but-2-ene).',
      ],
      answer: 'but-2-ene',
    },
    checkQuestions: [
      {
        prompt:
          'Đun nóng ethyl chloride (CH₃-CH₂-Cl) với dung dịch NaOH, thu được sản phẩm hữu cơ thuộc lớp chất nào?',
        choices: [
          { id: 'alkene', label: 'Alkene' },
          { id: 'alcohol', label: 'Alcohol' },
          { id: 'ether', label: 'Ether' },
          { id: 'aldehyde', label: 'Aldehyde' },
        ],
        answer: { kind: 'choice', correctIds: ['alcohol'] },
        explain:
          'Đun với dung dịch NaOH, nguyên tử Cl bị thay bằng nhóm −OH (phản ứng thuỷ phân), tạo ethanol CH₃-CH₂-OH — một alcohol. Muốn tách HCl để được alkene thì phải dùng KOH trong ethanol, không phải NaOH trong nước.',
      },
      {
        prompt:
          'Theo quy tắc tách Zaitsev, nguyên tử halogen ưu tiên tách ra cùng với nguyên tử hydrogen ở carbon bên cạnh có đặc điểm gì?',
        choices: [
          { id: 'it_h', label: 'Có ít hydrogen hơn (carbon bậc cao hơn)' },
          { id: 'nhieu_h', label: 'Có nhiều hydrogen hơn (carbon bậc thấp hơn)' },
          { id: 'bat_ky', label: 'Carbon nào cũng được' },
        ],
        answer: { kind: 'choice', correctIds: ['it_h'] },
        explain:
          'Quy tắc Zaitsev: tách H ở carbon bên cạnh có ít H hơn (C bậc cao hơn) để tạo alkene nhiều nhóm thế hơn (bền hơn).',
      },
    ],
    srsCards: [
      {
        hoi: 'Dẫn xuất halogen là gì?',
        dap: 'Hydrocarbon bị thế một hoặc nhiều nguyên tử H bằng nguyên tử halogen (F, Cl, Br, I).',
      },
      {
        hoi: 'Hai phản ứng hoá học chính của dẫn xuất halogen?',
        dap: 'Phản ứng thế nhóm halogen (tạo alcohol) và phản ứng tách HX (tạo alkene).',
      },
      {
        hoi: 'Quy tắc Zaitsev định hướng điều gì?',
        dap: 'Định hướng phản ứng tách HX: H ưu tiên tách ở carbon bên cạnh có ít H hơn.',
      },
    ],
    animation: {
      title: 'Tách HBr khỏi 2-bromobutane (quy tắc Zaitsev)',
      description:
        'Mạch bốn carbon của 2-bromobutane được vẽ thành hàng: C1 (CH₃) – C2 (CH mang Br) – C3 (CH₂) – C4 (CH₃). Base OH⁻ trong ethanol lấy đi một nguyên tử hydrogen ở carbon BÊN CẠNH carbon mang Br, đồng thời Br rời khỏi C2 mang theo cặp electron. H cùng OH⁻ thành H₂O, Br ra đi dưới dạng ion Br⁻. Hai vị trí vừa trống ghép thành liên kết đôi, và C3 từ CH₂ còn lại CH. Hoạt ảnh cho thấy hướng ưu tiên: tách H ở C3 (carbon có ít hydrogen hơn) tạo but-2-ene, là alkene có nhiều nhóm thế quanh liên kết đôi nên bền hơn. Nếu tách H ở C1 thì chỉ thu được but-1-ene — sản phẩm phụ.',
      viewBoxWidth: 440,
      viewBoxHeight: 210,
      durationMs: 6000,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'c1',
          x: 70,
          y: 115,
          text: 'CH₃',
          size: 15,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'c2',
          x: 160,
          y: 115,
          text: 'CH',
          size: 15,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'c3',
          x: 250,
          y: 115,
          text: 'CH₂',
          size: 15,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 3600, opacity: 1 },
            { atMs: 4000, opacity: 0 },
            { atMs: 6000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'c3b',
          x: 250,
          y: 115,
          text: 'CH',
          size: 15,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3600, opacity: 0 },
            { atMs: 4000, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'c4',
          x: 345,
          y: 115,
          text: 'CH₃',
          size: 15,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'so1',
          x: 52,
          y: 98,
          text: 'C1',
          size: 9,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'so2',
          x: 142,
          y: 98,
          text: 'C2',
          size: 9,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'so3',
          x: 232,
          y: 98,
          text: 'C3',
          size: 9,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'so4',
          x: 327,
          y: 98,
          text: 'C4',
          size: 9,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'line',
          id: 'n12',
          x1: 94,
          y1: 110,
          x2: 140,
          y2: 110,
          stroke: 'neutral',
          strokeWidth: 2.5,
        },
        {
          kind: 'line',
          id: 'n23',
          x1: 180,
          y1: 110,
          x2: 226,
          y2: 110,
          stroke: 'neutral',
          strokeWidth: 2.5,
        },
        {
          kind: 'line',
          id: 'n23b',
          x1: 180,
          y1: 101,
          x2: 226,
          y2: 101,
          stroke: 'correct',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3600, opacity: 0 },
            { atMs: 4200, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'n34',
          x1: 274,
          y1: 110,
          x2: 322,
          y2: 110,
          stroke: 'neutral',
          strokeWidth: 2.5,
        },
        {
          kind: 'line',
          id: 'noi-br',
          x1: 160,
          y1: 128,
          x2: 160,
          y2: 162,
          stroke: 'neutral',
          strokeWidth: 2,
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 2600, opacity: 1 },
            { atMs: 3000, opacity: 0 },
            { atMs: 6000, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'br',
          cx: 160,
          cy: 176,
          r: 14,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 2600, dx: 0, dy: 0 },
            { atMs: 3800, dx: -100, dy: -16 },
            { atMs: 6000, dx: -100, dy: -16 },
          ],
        },
        {
          kind: 'label',
          id: 'br-t',
          x: 160,
          y: 181,
          text: 'Br',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 2600, dx: 0, dy: 0 },
            { atMs: 3800, dx: -100, dy: -16, opacity: 1 },
            { atMs: 4000, opacity: 0 },
            { atMs: 6000, dx: -100, dy: -16, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'br-t2',
          x: 60,
          y: 165,
          text: 'Br⁻',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3800, opacity: 0 },
            { atMs: 4100, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'h3',
          cx: 250,
          cy: 72,
          r: 11,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 1 },
            { atMs: 1800, dx: 0, dy: 0 },
            { atMs: 3200, dx: 122, dy: -8 },
            { atMs: 3500, opacity: 1 },
            { atMs: 3900, opacity: 0 },
            { atMs: 6000, dx: 122, dy: -8, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'h3-t',
          x: 250,
          y: 77,
          text: 'H',
          size: 12,
          anchor: 'middle',
          fill: 'surface',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 1 },
            { atMs: 1800, dx: 0, dy: 0 },
            { atMs: 3200, dx: 122, dy: -8 },
            { atMs: 3500, opacity: 1 },
            { atMs: 3900, opacity: 0 },
            { atMs: 6000, dx: 122, dy: -8, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'oh',
          cx: 398,
          cy: 62,
          r: 16,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'oh-t',
          x: 398,
          y: 66,
          text: 'OH⁻',
          size: 10,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 3500, opacity: 1 },
            { atMs: 3900, opacity: 0 },
            { atMs: 6000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'oh-t2',
          x: 398,
          y: 66,
          text: 'H₂O',
          size: 10,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3500, opacity: 0 },
            { atMs: 3900, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'oh-dk',
          x: 398,
          y: 92,
          text: '(KOH/ethanol)',
          size: 9,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'line',
          id: 'noi-h3',
          x1: 250,
          y1: 100,
          x2: 250,
          y2: 84,
          stroke: 'neutral',
          strokeWidth: 2,
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 2600, opacity: 1 },
            { atMs: 3000, opacity: 0 },
            { atMs: 6000, opacity: 0 },
          ],
        },
        {
          kind: 'arrow',
          id: 'base-mui',
          x1: 380,
          y1: 66,
          x2: 264,
          y2: 72,
          stroke: 'muted',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1000, opacity: 0 },
            { atMs: 1300, opacity: 1 },
            { atMs: 1900, opacity: 1 },
            { atMs: 2200, opacity: 0 },
            { atMs: 6000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'sp',
          x: 220,
          y: 200,
          text: 'sản phẩm chính: CH₃–CH=CH–CH₃ (but-2-ene)',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4200, opacity: 0 },
            { atMs: 4600, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
      ],
      captions: [
        { atMs: 0, text: 'Br nằm ở C2; hai carbon bên cạnh là C1 (3 H) và C3 (2 H).' },
        { atMs: 1800, text: 'Base lấy H ở C3 — carbon có ÍT hydrogen hơn (quy tắc Zaitsev).' },
        {
          atMs: 4200,
          text: 'Br rời đi, hai vị trí trống ghép thành liên kết đôi C2=C3: but-2-ene.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c5-b20',
    grade: '11',
    chapterNumber: 5,
    chapterTitle: 'Dẫn xuất halogen - Alcohol - Phenol',
    lessonNumber: 20,
    title: 'Alcohol',
    hook:
      'Ethanol có trong bia rượu là chất lỏng quen thuộc, nhưng methanol (cồn công nghiệp) chỉ hơn kém ' +
      'một nhóm CH₂ lại là chất độc chết người gây mù loà. Sự hiểu biết về alcohol giúp bảo vệ mạng sống của chúng ta.',
    theory:
      'KHÁI NIỆM VÀ PHÂN LOẠI:\n' +
      '— Alcohol là hợp chất hữu cơ có nhóm hydroxyl (−OH) liên kết trực tiếp với nguyên tử carbon no.\n' +
      '— Công thức chung của alcohol no, đơn chức, mạch hở: CₙH₂ₙ₊₁OH (n ≥ 1).\n' +
      '— Polyalcohol là alcohol có nhiều nhóm −OH (ví dụ: ethylene glycol C₂H₄(OH)₂, glycerol C₃H₅(OH)₃).\n\n' +
      'TÍNH CHẤT VẬT LÍ (Liên kết hydrogen):\n' +
      '— Ở điều kiện thường, các alcohol là chất lỏng hoặc rắn. Nhiệt độ sôi và độ tan trong nước của alcohol cao hơn nhiều so với hydrocarbon có cùng phân tử khối vì các phân tử alcohol tạo được LIÊN KẾT HYDROGEN liên phân tử với nhau và với nước.\n\n' +
      'TÍNH CHẤT HOÁ HỌC:\n' +
      '1. Phản ứng thế nguyên tử H của nhóm −OH: Tác dụng với kim loại kiềm giải phóng H₂: R−OH + Na → R−ONa + 1/2 H₂.\n' +
      '2. Phản ứng oxi hoá không hoàn toàn bởi CuO (t°):\n' +
      '   — Alcohol bậc I tạo aldehyde: R−CH₂OH + CuO → R−CHO + Cu + H₂O.\n' +
      "   — Alcohol bậc II tạo ketone: R−CH(OH)−R' + CuO → R−CO−R' + Cu + H₂O.\n" +
      '   — Alcohol bậc III bền vững, không bị CuO oxi hoá ở điều kiện này.\n' +
      '3. Phản ứng tách nước (dehydration):\n' +
      '   — Tách nước tạo alkene (tại 170 °C, xúc tác H₂SO₄ đặc): C₂H₅OH → C₂H₄ + H₂O.\n' +
      '   — Tách nước tạo ether (tại 140 °C, xúc tác H₂SO₄ đặc): 2C₂H₅OH → C₂H₅−O−C₂H₅ + H₂O.',
    workedExample: {
      problem:
        'Cho 4,6 gam kim loại Sodium (Na, M=23) phản ứng hoàn toàn với lượng dư cồn ethanol nguyên chất. ' +
        'Tính thể tích khí H₂ sinh ra ở điều kiện chuẩn (25 °C, 1 bar, thể tích mol là 24,79 L/mol).',
      steps: [
        'Tính số mol Na: nNa = 4,6 / 23 = 0,2 mol.',
        'Viết phương trình phản ứng: C₂H₅OH + Na → C₂H₅ONa + 1/2 H₂.',
        'Tính số mol H₂ sinh ra theo tỉ lệ phản ứng: nH₂ = 1/2 * nNa = 0,2 / 2 = 0,1 mol.',
        'Tính thể tích khí H₂ ở điều kiện chuẩn: V = nH₂ * 24,79 = 0,1 * 24,79 = 2,479 L.',
      ],
      answer: '2,479 L',
    },
    checkQuestions: [
      {
        prompt:
          'Vì sao alcohol có nhiệt độ sôi cao hơn nhiều so với các hydrocarbon có khối lượng phân tử tương đương?',
        choices: [
          { id: 'lienket', label: 'Do phân tử tạo được liên kết hydrogen liên phân tử' },
          { id: 'hoatri', label: 'Do có liên kết cộng hoá trị bền hơn' },
          { id: 'khoiluong', label: 'Do khối lượng riêng của alcohol lớn hơn' },
        ],
        answer: { kind: 'choice', correctIds: ['lienket'] },
        explain:
          'Nhóm −OH phân cực mạnh của alcohol cho phép hình thành liên kết hydrogen liên phân tử, cần nhiều năng lượng hơn để phá vỡ khi đun sôi.',
      },
      {
        prompt:
          'Khi oxi hoá alcohol bậc II bằng copper(II) oxide (CuO) ở nhiệt độ cao, sản phẩm hữu cơ thu được thuộc lớp chất nào?',
        choices: [
          { id: 'ald', label: 'Aldehyde' },
          { id: 'ket', label: 'Ketone' },
          { id: 'acid', label: 'Carboxylic acid' },
          { id: 'alk', label: 'Alkene' },
        ],
        answer: { kind: 'choice', correctIds: ['ket'] },
        explain:
          'Nguyên tử carbon mang nhóm −OH của alcohol bậc II còn đúng một H, nên khi bị CuO lấy đi sẽ thành nhóm C=O nằm giữa mạch, tức ketone. Aldehyde là sản phẩm của alcohol bậc I; CuO không oxi hoá tiếp tới carboxylic acid và cũng không tách nước tạo alkene.',
      },
    ],
    srsCards: [
      {
        hoi: 'Alcohol là gì?',
        dap: 'Hợp chất hữu cơ có nhóm −OH liên kết trực tiếp với nguyên tử carbon no.',
      },
      {
        hoi: 'Nhiệt độ sôi của alcohol cao nhờ yếu tố nào?',
        dap: 'Liên kết hydrogen liên phân tử giữa các nhóm −OH.',
      },
      {
        hoi: 'Sản phẩm oxi hoá alcohol bậc I và II bằng CuO nóng?',
        dap: 'Alcohol bậc I tạo Aldehyde; bậc II tạo Ketone.',
      },
      {
        hoi: 'Hai điều kiện tách nước của ethanol (H₂SO₄ đặc)?',
        dap: '170 °C tạo alkene (ethylene); 140 °C tạo ether (diethyl ether).',
      },
    ],
    animation: {
      title: 'Tách nước từ ethanol: 140 °C cho ether, 170 °C cho ethylene',
      description:
        'Ở giữa là ethanol cùng H₂SO₄ đặc. Từ đó rẽ ra hai nhánh và nhiệt độ là thứ duy nhất quyết định đi nhánh nào. Cột nhiệt độ dâng lên: khi dừng ở khoảng 140 °C, hai phân tử ethanol tách chung một phân tử nước và nối lại với nhau qua oxygen, cho diethyl ether C₂H₅–O–C₂H₅ — đây là tách nước giữa hai phân tử. Khi cột dâng tiếp lên 170 °C, một phân tử ethanol tự tách nước ngay trong lòng nó: nhóm OH ở carbon này và nguyên tử H ở carbon bên cạnh cùng ra đi, hai carbon còn lại hình thành nối đôi, cho ethylene CH₂=CH₂ — đây là tách nước trong một phân tử. Cùng chất đầu, cùng xúc tác, chỉ khác nhiệt độ mà ra hai sản phẩm khác loại.',
      viewBoxWidth: 470,
      viewBoxHeight: 240,
      durationMs: 8000,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'start',
          x: 100,
          y: 116,
          text: 'C₂H₅OH',
          size: 16,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'xt',
          x: 100,
          y: 138,
          text: 'H₂SO₄ đặc',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'rect',
          id: 'ong-nk',
          x: 30,
          y: 40,
          w: 14,
          h: 156,
          rx: 7,
          fill: 'surface',
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'rect',
          id: 'thuy',
          x: 33.5,
          y: 48,
          w: 7,
          h: 146,
          fill: 'accent',
          origin: [37, 194],
          keyframes: [
            { atMs: 0, scaleY: 0.028 },
            { atMs: 2000, scaleY: 0.667 },
            { atMs: 4200, scaleY: 0.667 },
            { atMs: 6000, scaleY: 0.833 },
            { atMs: 8000, scaleY: 0.833 },
          ],
        },
        {
          kind: 'circle',
          id: 'bau-nk',
          cx: 37,
          cy: 202,
          r: 9,
          fill: 'accent',
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'line',
          id: 'vach140',
          x1: 44,
          y1: 96.7,
          x2: 50,
          y2: 96.7,
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'line',
          id: 'vach170',
          x1: 44,
          y1: 72.3,
          x2: 50,
          y2: 72.3,
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'label',
          id: 'so140',
          x: 53,
          y: 99.7,
          text: '140',
          size: 9,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'so170',
          x: 53,
          y: 75.3,
          text: '170',
          size: 9,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'cott',
          x: 37,
          y: 226,
          text: 'nhiệt độ (°C)',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'arrow',
          id: 'nh1',
          x1: 160,
          y1: 106,
          x2: 226,
          y2: 74,
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2000,
              opacity: 0,
            },
            {
              atMs: 2400,
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
          id: 'nh1t',
          x: 190,
          y: 62,
          text: '140 °C',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2000,
              opacity: 0,
            },
            {
              atMs: 2400,
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
          id: 'sp1',
          x: 330,
          y: 62,
          text: 'C₂H₅–O–C₂H₅',
          size: 15,
          anchor: 'middle',
          fill: 'primary',
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
          kind: 'label',
          id: 'sp1b',
          x: 330,
          y: 82,
          text: 'diethyl ether — tách nước giữa 2 phân tử',
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
          kind: 'label',
          id: 'sp1c',
          x: 330,
          y: 100,
          text: '2C₂H₅OH → C₂H₅OC₂H₅ + H₂O',
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
              atMs: 3200,
              opacity: 0,
            },
            {
              atMs: 3600,
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
          id: 'nh2',
          x1: 160,
          y1: 130,
          x2: 226,
          y2: 164,
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 6000,
              opacity: 0,
            },
            {
              atMs: 6400,
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
          id: 'nh2t',
          x: 190,
          y: 180,
          text: '170 °C',
          size: 12,
          anchor: 'middle',
          fill: 'accent',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 6000,
              opacity: 0,
            },
            {
              atMs: 6400,
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
          id: 'sp2',
          x: 330,
          y: 164,
          text: 'CH₂=CH₂',
          size: 15,
          anchor: 'middle',
          fill: 'primary',
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
              atMs: 6800,
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
          id: 'sp2b',
          x: 330,
          y: 184,
          text: 'ethylene — tách nước trong 1 phân tử',
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
              atMs: 6400,
              opacity: 0,
            },
            {
              atMs: 6800,
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
          id: 'sp2c',
          x: 330,
          y: 202,
          text: 'C₂H₅OH → CH₂=CH₂ + H₂O',
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
              atMs: 6800,
              opacity: 0,
            },
            {
              atMs: 7200,
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
          x: 235,
          y: 228,
          text: 'Cùng chất đầu và xúc tác — nhiệt độ chọn sản phẩm',
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
              atMs: 7200,
              opacity: 0,
            },
            {
              atMs: 7600,
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
          text: 'Ethanol với H₂SO₄ đặc có thể đi theo hai hướng tách nước.',
        },
        {
          atMs: 2200,
          text: 'Ở 140 °C: hai phân tử ethanol tách chung một H₂O, cho diethyl ether.',
        },
        {
          atMs: 6200,
          text: 'Ở 170 °C: một phân tử tự tách H₂O, tạo nối đôi — ethylene.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c5-b21',
    grade: '11',
    chapterNumber: 5,
    chapterTitle: 'Dẫn xuất halogen - Alcohol - Phenol',
    lessonNumber: 21,
    title: 'Phenol',
    hook:
      'Phenol là chất sát trùng lâu đời nhất loài người tìm ra, nhưng nó có thể gây bỏng da nghiêm trọng. ' +
      'Khác với alcohol, phenol có tính acid yếu do ảnh hưởng qua lại giữa vòng benzene và nhóm −OH.',
    theory:
      'KHÁI NIỆM:\n' +
      '— Phenol là những hợp chất hữu cơ trong phân tử có nhóm hydroxyl (−OH) liên kết trực tiếp với nguyên tử carbon của vòng benzene. Chất đơn giản nhất là C₆H₅OH (phenol).\n\n' +
      'ẢNH HƯỞNG QUA LẠI GIỮA VÒNG BENZENE VÀ NHÓM −OH:\n' +
      '— Nhóm −OH đẩy electron vào vòng benzene làm tăng mật độ electron trong vòng, đặc biệt ở các vị trí o- và p-, làm phản ứng thế vào vòng dễ hơn benzene.\n' +
      '— Vòng benzene hút electron làm liên kết O−H của nhóm −OH phân cực mạnh hơn so với alcohol, khiến nguyên tử H trở nên linh động hơn (thể hiện tính acid yếu).\n\n' +
      'TÍNH CHẤT HOÁ HỌC:\n' +
      '1. Tính acid yếu (mạnh hơn alcohol nhưng yếu hơn carbonic acid H₂CO₃):\n' +
      '   — Phenol phản ứng với dung dịch kiềm tạo muối phenolate: C₆H₅OH + NaOH → C₆H₅ONa + H₂O.\n' +
      '   — Muối sodium phenolate dễ bị khí CO₂ và nước đẩy ngược lại tạo phenol (dung dịch đục): C₆H₅ONa + CO₂ + H₂O → C₆H₅OH↓ (vẩn đục) + NaHCO₃.\n' +
      '2. Phản ứng thế ở vòng thơm:\n' +
      '   — Tác dụng với nước Bromine tạo kết tủa TRẮNG (2,4,6-tribromophenol) ngay ở nhiệt độ thường (phản ứng nhạy dùng nhận biết phenol): C₆H₅OH + 3Br₂ → C₆H₂(OH)Br₃↓ + 3HBr.\n' +
      '   — Tác dụng với HNO₃ đặc (xúc tác H₂SO₄ đặc) tạo kết tủa VÀNG picric acid (2,4,6-trinitrophenol).',
    workedExample: {
      problem:
        'Sục khí carbon dioxide (CO₂) vào dung dịch muối sodium phenolate (C₆H₅ONa) không màu. ' +
        'Nêu hiện tượng xảy ra và viết phương trình hoá học của phản ứng.',
      steps: [
        'Phenol là một acid rất yếu, yếu hơn cả carbonic acid H₂CO₃.',
        'Khi sục khí CO₂ vào dung dịch muối sodium phenolate, carbonic acid sinh ra từ CO₂ và H₂O sẽ đẩy phenol ra khỏi muối.',
        'Phản ứng: C₆H₅ONa + CO₂ + H₂O → C₆H₅OH + NaHCO₃.',
        'Phenol sinh ra ít tan trong nước lạnh ở điều kiện thường nên dung dịch không màu ban đầu trở nên vẩn đục.',
      ],
      answer: 'Dung dịch vẩn đục',
    },
    checkQuestions: [
      {
        prompt:
          'Nhỏ nước bromine vào dung dịch phenol thì quan sát thấy hiện tượng gì ngay ở nhiệt độ thường?',
        choices: [
          { id: 'khi', label: 'Có khí mùi hắc thoát ra' },
          { id: 'tua_trang', label: 'Xuất hiện kết tủa màu trắng' },
          { id: 'tua_vang', label: 'Xuất hiện kết tủa màu vàng' },
          { id: 'khong', label: 'Không có hiện tượng gì' },
        ],
        answer: { kind: 'choice', correctIds: ['tua_trang'] },
        explain:
          'Nhóm −OH hoạt hoá vòng benzene mạnh nên phenol phản ứng ngay với nước bromine ở nhiệt độ thường, cho kết tủa trắng 2,4,6-tribromophenol. Kết tủa vàng là dấu hiệu của phản ứng với HNO₃ đặc, còn phản ứng này không sinh khí nào.',
      },
      {
        prompt:
          'Phenol tác dụng được với chất nào sau đây mà các alcohol thông thường như ethanol không phản ứng?',
        choices: [
          { id: 'na', label: 'Kim loại Sodium (Na)' },
          { id: 'naoh', label: 'Dung dịch NaOH' },
          { id: 'o2', label: 'Khí Oxygen' },
        ],
        answer: { kind: 'choice', correctIds: ['naoh'] },
        explain:
          'Phenol có tính acid yếu, đủ để phản ứng với kiềm NaOH tạo muối sodium phenolate tan. Ethanol trung tính nên không phản ứng với NaOH — dù cả hai đều tác dụng được với Na và đều cháy được trong oxygen.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phenol là gì?',
        dap: 'Hợp chất hữu cơ có nhóm −OH đính trực tiếp vào nguyên tử carbon của vòng benzene.',
      },
      {
        hoi: 'Vì sao phenol có tính acid mạnh hơn alcohol?',
        dap: 'Do vòng benzene hút electron làm liên kết O−H phân cực mạnh hơn.',
      },
      {
        hoi: 'Hai phản ứng nhận biết nhanh phenol?',
        dap: 'Tác dụng nước bromine tạo kết tủa trắng; tác dụng HNO₃ đặc tạo kết tủa vàng.',
      },
    ],
    animation: {
      title: 'Vì sao phenol phản ứng ngay với nước bromine còn benzene thì không',
      description:
        'Bên trái là phân tử phenol: vòng benzene gắn nhóm OH. Hai mũi tên cong hiện ra từ nguyên tử oxygen chỉ vào trong vòng — cặp electron chưa liên kết của oxygen bị hút vào hệ π của vòng, làm mật độ electron ở các vị trí 2, 4, 6 (hai vị trí ortho và một vị trí para) tăng lên. Vòng giàu electron hơn thì dễ bị tác nhân bromine tấn công hơn. Bên phải là ống nghiệm: nhỏ nước bromine vào dung dịch phenol, ngay ở nhiệt độ thường mà không cần xúc tác đã xuất hiện kết tủa trắng 2,4,6-tribromophenol và màu nâu của nước bromine biến mất. Còn benzene thì nước bromine không đủ: phải dùng bromine khan với bột sắt xúc tác, và cũng chỉ thế được một nguyên tử bromine. Nhóm OH không chỉ ngồi đó — nó làm thay đổi hẳn phản ứng của vòng.',
      viewBoxWidth: 460,
      viewBoxHeight: 240,
      durationMs: 8000,
      loop: true,
      shapes: [
        {
          kind: 'polyline',
          id: 'vong',
          points: [
            [110, 74],
            [152, 98],
            [152, 146],
            [110, 170],
            [68, 146],
            [68, 98],
          ],
          stroke: 'primary',
          strokeWidth: 2.5,
          closed: true,
        },
        {
          kind: 'circle',
          id: 'pi',
          cx: 110,
          cy: 122,
          r: 26,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'co',
          x1: 110,
          y1: 74,
          x2: 110,
          y2: 50,
          stroke: 'primary',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'oh',
          x: 110,
          y: 42,
          text: 'OH',
          size: 14,
          anchor: 'middle',
          fill: 'accent',
        },
        {
          kind: 'arrow',
          id: 'day1',
          x1: 104,
          y1: 58,
          x2: 84,
          y2: 92,
          stroke: 'accent',
          strokeWidth: 1.8,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1200,
              opacity: 0,
            },
            {
              atMs: 1700,
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
          id: 'day2',
          x1: 116,
          y1: 58,
          x2: 136,
          y2: 92,
          stroke: 'accent',
          strokeWidth: 1.8,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1200,
              opacity: 0,
            },
            {
              atMs: 1700,
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
          id: 'vt2',
          x: 44,
          y: 96,
          text: '2',
          size: 11,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2200,
              opacity: 0,
            },
            {
              atMs: 2700,
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
          id: 'vt6',
          x: 176,
          y: 96,
          text: '6',
          size: 11,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2200,
              opacity: 0,
            },
            {
              atMs: 2700,
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
          id: 'vt4',
          x: 110,
          y: 190,
          text: '4',
          size: 11,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2200,
              opacity: 0,
            },
            {
              atMs: 2700,
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
          id: 'giau',
          x: 110,
          y: 214,
          text: 'vòng giàu electron ở vị trí 2, 4, 6',
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
              atMs: 2700,
              opacity: 0,
            },
            {
              atMs: 3200,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'ong',
          points: [
            [280, 50],
            [280, 162],
            [280.5, 164],
            [282, 165.5],
            [284, 166],
            [332, 166],
            [334, 165.5],
            [335.5, 164],
            [336, 162],
            [336, 50],
          ],
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'rect',
          id: 'dd',
          x: 284,
          y: 96,
          w: 48,
          h: 66,
          fill: 'warn',
          rx: 2,
          opacity: 0.45,
          keyframes: [
            { atMs: 0, opacity: 0.45 },
            { atMs: 4000, opacity: 0.45 },
            { atMs: 5400, opacity: 0.06 },
            { atMs: 8000, opacity: 0.06 },
          ],
        },
        {
          kind: 'label',
          id: 'ongt',
          x: 308,
          y: 36,
          text: 'phenol + nước Br₂',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'circle',
          id: 'kt1',
          cx: 296,
          cy: 148,
          r: 5,
          fill: 'surface',
          stroke: 'muted',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5000,
              opacity: 0,
            },
            {
              atMs: 5600,
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
          id: 'kt2',
          cx: 310,
          cy: 156,
          r: 5,
          fill: 'surface',
          stroke: 'muted',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5200,
              opacity: 0,
            },
            {
              atMs: 5800,
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
          id: 'kt3',
          cx: 322,
          cy: 148,
          r: 5,
          fill: 'surface',
          stroke: 'muted',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5400,
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
          id: 'ktt',
          x: 308,
          y: 184,
          text: 'kết tủa trắng',
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
          id: 'ktt2',
          x: 308,
          y: 202,
          text: '2,4,6-tribromophenol',
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
          id: 'ss1',
          x: 346,
          y: 98,
          text: 'Benzene: cần Br₂ khan',
          size: 10,
          anchor: 'start',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 6400, opacity: 0 },
            { atMs: 6900, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'ss2',
          x: 346,
          y: 112,
          text: '+ bột Fe xúc tác,',
          size: 10,
          anchor: 'start',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 6400, opacity: 0 },
            { atMs: 6900, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'ss3',
          x: 346,
          y: 126,
          text: 'chỉ thế 1 nguyên tử Br',
          size: 10,
          anchor: 'start',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 6400, opacity: 0 },
            { atMs: 6900, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Phenol là vòng benzene gắn nhóm OH.',
        },
        {
          atMs: 1400,
          text: 'Cặp electron của oxygen đẩy vào vòng, làm giàu electron ở vị trí 2, 4, 6.',
        },
        {
          atMs: 4200,
          text: 'Nhỏ nước bromine: mất màu nâu ngay, không cần xúc tác.',
        },
        {
          atMs: 5600,
          text: 'Kết tủa trắng 2,4,6-tribromophenol — dấu hiệu nhận biết phenol.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c5-b22',
    grade: '11',
    chapterNumber: 5,
    chapterTitle: 'Dẫn xuất halogen - Alcohol - Phenol',
    lessonNumber: 22,
    title: 'Ôn tập chương 5 — Dẫn xuất halogen - Alcohol - Phenol',
    hook:
      'Chương 5 hệ thống hoá các dẫn xuất chứa oxygen và halogen — cầu nối từ hydrocarbon sang các ' +
      'hợp chất carbonyl sẽ học tiếp ở chương sau.',
    theory:
      'TỔNG KẾT SO SÁNH DẪN XUẤT HALOGEN, ALCOHOL, PHENOL:\n' +
      '1. Dẫn xuất halogen (R−X): Có phản ứng thế halogen bằng −OH (NaOH loãng, t°) và phản ứng tách HX (KOH/ethanol, t° - tuân theo quy tắc Zaitsev).\n' +
      '2. Alcohol (R−OH): Có nhóm −OH gắn carbon no. Nhiệt độ sôi cao nhờ liên kết hydrogen. Tác dụng với Na. Oxi hoá bởi CuO tạo aldehyde (bậc I) hoặc ketone (bậc II). Tách nước tạo alkene (170 °C) hoặc ether (140 °C).\n' +
      '3. Phenol (C₆H₅OH): Có nhóm −OH gắn trực tiếp vòng benzene. Có tính acid yếu (tác dụng với NaOH, bị CO₂ đẩy ra khỏi muối). Dễ thế vòng thơm (phản ứng nước bromine tạo kết tủa trắng, phản ứng HNO₃ đặc tạo kết tủa vàng).\n' +
      '4. Polyalcohol kề nhau (như glycerol): Tác dụng được với Cu(OH)₂ ở nhiệt độ thường tạo dung dịch xanh lam thẫm (phản ứng đặc trưng nhận biết polyalcohol có nhóm −OH kề nhau).',
    workedExample: {
      problem:
        'Nhận biết 3 chất lỏng không màu đựng trong 3 lọ mất nhãn: ethanol, glycerol và phenol bằng ' +
        'thuốc thử phù hợp.',
      steps: [
        'Lấy một ít mỗi chất lỏng ra ba ống nghiệm làm mẫu thử.',
        'Nhỏ dung dịch nước bromine vào các mẫu thử ⇒ Mẫu tạo kết tủa trắng là phenol.',
        'Với 2 mẫu còn lại (ethanol, glycerol), nhỏ dung dịch Cu(OH)₂ ở nhiệt độ thường vào.',
        'Mẫu hoà tan Cu(OH)₂ tạo dung dịch màu xanh lam thẫm là glycerol (polyalcohol có các nhóm −OH kề nhau).',
        'Mẫu không có hiện tượng gì (không hoà tan Cu(OH)₂) là ethanol.',
      ],
      answer: 'Dùng nước bromine và Cu(OH)₂',
    },
    checkQuestions: [
      {
        prompt:
          'Thuốc thử nào dùng để phân biệt nhanh glycerol (C₃H₅(OH)₃) và ethanol (C₂H₅OH) ở nhiệt độ thường?',
        choices: [
          { id: 'na', label: 'Kim loại Sodium (Na)' },
          { id: 'cuoh2', label: 'Dung dịch / kết tủa Cu(OH)₂' },
          { id: 'hcl', label: 'Dung dịch HCl' },
        ],
        answer: { kind: 'choice', correctIds: ['cuoh2'] },
        explain:
          'Glycerol là polyalcohol có các nhóm −OH kề nhau, hoà tan Cu(OH)₂ tạo phức xanh lam thẫm. Ethanol không có tính chất này.',
      },
      {
        prompt: 'Chất nào sau đây phản ứng được với cả dung dịch NaOH và nước bromine?',
        choices: [
          { id: 'eth', label: 'Ethanol' },
          { id: 'phe', label: 'Phenol' },
          { id: 'gly', label: 'Glycerol' },
        ],
        answer: { kind: 'choice', correctIds: ['phe'] },
        explain:
          'Phenol có tính acid yếu nên phản ứng được với NaOH; nhóm −OH lại hoạt hoá vòng thơm nên phenol còn phản ứng ngay với nước bromine, cho kết tủa trắng. Ethanol và glycerol đều trung tính, không tác dụng với NaOH.',
      },
    ],
    srsCards: [
      {
        hoi: 'Hiện tượng khi glycerol tác dụng với Cu(OH)₂?',
        dap: 'Hoà tan kết tủa tạo dung dịch xanh lam thẫm.',
      },
      {
        hoi: 'Chất nào phản ứng được với dung dịch kiềm NaOH?',
        dap: 'Phenol (acid yếu), còn alcohol thì không.',
      },
      {
        hoi: 'Sản phẩm của phản ứng tách nước alcohol ở 170 °C và 140 °C?',
        dap: '170 °C tạo alkene; 140 °C tạo ether.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
