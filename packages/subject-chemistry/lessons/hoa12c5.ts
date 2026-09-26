// lessons/hoa12c5.ts — Hoá học 12, Chương 5: Pin điện và điện phân (3 bài).
// Đối chiếu mục lục thật: tai-lieu-sgk/SGK-Hoa/12/page_0005.png (OCR 2026-08-31).
// reviewStatus='draft' — soạn từ docs/research/kho-kien-thuc-hoa-gdpt2018.md §3, chưa duyệt.
import type { ChemLesson } from '../lessonTypes.js'

export const HOA12_C5_LESSONS: ChemLesson[] = [
  {
    id: 'hoa12-c5-b15',
    grade: '12',
    chapterNumber: 5,
    chapterTitle: 'Pin điện và điện phân',
    lessonNumber: 15,
    title: 'Thế điện cực và nguồn điện hoá học',
    hook:
      'Pin điện thoại và pin lithium-ion trên xe điện hoạt động dựa trên sự chuyển dịch tự phát của electron' +
      ' giữa hai điện cực. Làm thế nào để ta đo lường và tính toán được hiệu điện thế của nguồn điện này?',
    theory:
      'THẾ ĐIỆN CỰC CHUẨN (E°):\n' +
      '— Thế điện cực chuẩn của kim loại (E°_Mⁿ⁺/M) đặc trưng cho khả năng khử của kim loại ở trạng thái đơn chất và khả năng oxi hoá của ion kim loại đó trong dung dịch nước ở điều kiện chuẩn.\n' +
      '— Điện cực hydrogen chuẩn (viết tắt SHE, từ standard hydrogen electrode) được quy ước có thế điện cực bằng 0,00 V, lấy làm mốc so sánh cho mọi điện cực khác.\n' +
      '— Ý nghĩa: Trị số E° càng âm thì kim loại có tính khử càng mạnh, ion của nó có tính oxi hoá càng yếu; trị số E° càng dương thì kim loại có tính khử càng yếu, ion của nó có tính oxi hoá càng mạnh.\n\n' +
      'PIN ĐIỆN HOÁ (Galvanic Cell):\n' +
      '— Là thiết bị biến năng lượng của phản ứng oxi hoá - khử tự phát thành điện năng.\n' +
      '— Cấu tạo (ví dụ Pin Daniell Zn-Cu):\n' +
      '  1. Anode (cực âm): làm bằng kim loại có tính khử mạnh hơn (Zn), nơi xảy ra quá trình oxi hoá: Zn → Zn²⁺ + 2e.\n' +
      '  2. Cathode (cực dương): làm bằng kim loại có tính khử yếu hơn (Cu), nơi xảy ra quá trình khử: Cu²⁺ + 2e → Cu.\n' +
      '  3. Cầu muối: ngăn hai dung dịch điện li trộn lẫn nhau nhưng cho phép ion di chuyển qua để duy trì trung hoà điện tích.\n\n' +
      'SUẤT ĐIỆN ĐỘNG CHUẨN CỦA PIN (E°_pin):\n' +
      '— Suất điện động chuẩn là hiệu điện thế cực đại giữa hai điện cực của pin điện hoá ở điều kiện chuẩn.\n' +
      '— Công thức: E°_pin = E°_catot − E°_anot = E°_dương − E°_âm.\n' +
      '— Ví dụ pin Zn-Cu: E°_pin = E°_Cu²⁺/Cu − E°_Zn²⁺/Zn = 0,34 − (−0,76) = 1,10 V.',
    workedExample: {
      problem:
        'Một pin điện hoá cấu tạo bởi hai cặp oxi hoá - khử chuẩn Fe²⁺/Fe (E° = −0,44 V) và Ag⁺/Ag (E° = 0,80 V). ' +
        'Xác định anode, cathode và tính suất điện động chuẩn E°_pin của pin này.',
      steps: [
        'So sánh thế điện cực chuẩn: E°_Fe²⁺/Fe (−0,44 V) < E°_Ag⁺/Ag (0,80 V).',
        'Cặp có thế điện cực chuẩn nhỏ hơn đóng vai trò là cực âm (Anode): Fe. Quá trình oxi hoá xảy ra tại đây: Fe → Fe²⁺ + 2e.',
        'Cặp có thế điện cực chuẩn lớn hơn đóng vai trò là cực dương (Cathode): Ag. Quá trình khử xảy ra tại đây: Ag⁺ + 1e → Ag.',
        'Áp dụng công thức tính suất điện động chuẩn: E°_pin = E°_catot − E°_anot = E°_Ag⁺/Ag − E°_Fe²⁺/Fe.',
        'Tính toán: E°_pin = 0,80 − (−0,44) = 1,24 V.',
      ],
      answer: 'E°_pin = 1,24 V',
    },
    checkQuestions: [
      {
        prompt: 'Trong pin điện hoá, quá trình oxi hoá xảy ra ở điện cực nào?',
        choices: [
          { id: 'anode', label: 'Anode (cực âm)' },
          { id: 'cathode', label: 'Cathode (cực dương)' },
          { id: 'caumuoi', label: 'Cầu muối' },
        ],
        answer: { kind: 'choice', correctIds: ['anode'] },
        explain:
          'Bất kể trong pin điện hay bình điện phân, ANODE luôn là nơi xảy ra quá trình OXI HOÁ; trong pin điện hoá, anode chính là cực âm. Cathode ngược lại là nơi xảy ra quá trình khử. Cầu muối không phải điện cực nên không có phản ứng oxi hoá - khử xảy ra trên đó, nó chỉ dẫn ion để giữ hai dung dịch trung hoà điện.',
      },
      {
        prompt:
          'Tính suất điện động chuẩn E°_pin của pin điện hoá Cu - Ag, biết E°_Cu²⁺/Cu = 0,34 V và E°_Ag⁺/Ag = 0,80 V (V, chỉ nhập số).',
        answer: { kind: 'numeric', value: 0.46 },
        explain: 'Áp dụng công thức: E°_pin = E°_catot − E°_anot = 0,80 − 0,34 = 0,46 V.',
      },
      {
        // Câu BẪY: học thuộc "anode là cực dương" (đúng cho bình điện phân) rồi áp sang PIN.
        prompt: 'Trong PIN điện hoá Zn–Cu đang phóng điện, điện cực kẽm là cực gì và mang dấu gì?',
        choices: [
          { id: 'anode_am', label: 'Anode, mang dấu âm (−)' },
          { id: 'anode_duong', label: 'Anode, mang dấu dương (+)' },
          { id: 'cathode_am', label: 'Cathode, mang dấu âm (−)' },
        ],
        answer: { kind: 'choice', correctIds: ['anode_am'] },
        explain:
          'Đây là chỗ lẫn lộn kinh điển. Hãy bám vào ĐỊNH NGHĨA chứ đừng nhớ dấu: anode luôn là ' +
          'nơi xảy ra sự OXI HOÁ, cathode luôn là nơi xảy ra sự KHỬ — điều này đúng cho cả pin ' +
          'lẫn bình điện phân. Chỉ có DẤU là khác nhau: trong pin, anode là cực ÂM (electron bị ' +
          'đẩy ra từ đây); trong bình điện phân, anode lại nối với cực DƯƠNG của nguồn. Zn bị ' +
          'oxi hoá ⇒ Zn là anode, và trong pin thì đó là cực âm.',
      },
    ],
    srsCards: [
      {
        hoi: 'Suất điện động chuẩn của pin tính bằng công thức nào?',
        dap: 'E°_pin = E°_catot − E°_anot (E°_cực dương − E°_cực âm).',
      },
      {
        hoi: 'Cực dương (cathode) của pin xảy ra quá trình gì?',
        dap: 'Quá trình khử (ion kim loại nhận electron).',
      },
      {
        hoi: 'Vai trò của cầu muối trong pin điện hoá?',
        dap: 'Duy trì sự trung hoà điện tích giữa hai dung dịch điện cực bằng cách cho phép các ion di chuyển qua.',
      },
    ],
    animation: {
      title: 'Pin Daniell Zn–Cu: electron chạy từ anode sang cathode',
      description:
        'Hai cốc: cốc trái có lá kẽm nhúng trong dung dịch ZnSO₄, cốc phải có lá đồng nhúng trong dung dịch CuSO₄ màu xanh; dây dẫn nối hai lá kim loại qua bóng đèn, cầu muối KNO₃ hình chữ U nối hai dung dịch. Ở lá kẽm (anode, cực âm): Zn → Zn²⁺ + 2e — ion Zn²⁺ tan vào dung dịch, lá kẽm mỏng dần, còn 2 electron bị đẩy ra dây dẫn. Electron chạy qua bóng đèn sang lá đồng (cathode, cực dương), ở đó ion Cu²⁺ nhận đủ 2 electron: Cu²⁺ + 2e → Cu, đồng bám dày thêm lên lá. Trong cầu muối, ion NO₃⁻ đi về cốc kẽm và ion K⁺ đi về cốc đồng để hai dung dịch luôn trung hoà điện — thiếu cầu muối thì dòng điện tắt ngay. Suất điện động chuẩn: 0,34 − (−0,76) = 1,10 V.',
      viewBoxWidth: 440,
      viewBoxHeight: 270,
      durationMs: 6000,
      loop: true,
      shapes: [
        {
          kind: 'rect',
          id: 'dd-trai',
          x: 42,
          y: 120,
          w: 126,
          h: 100,
          fill: 'muted',
          opacity: 0.15,
        },
        {
          kind: 'rect',
          id: 'dd-phai',
          x: 272,
          y: 120,
          w: 126,
          h: 100,
          fill: 'accent',
          opacity: 0.3,
        },
        {
          kind: 'polyline',
          id: 'coc-trai',
          points: [
            [40, 88],
            [40, 222],
            [170, 222],
            [170, 88],
          ],
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'polyline',
          id: 'coc-phai',
          points: [
            [270, 88],
            [270, 222],
            [400, 222],
            [400, 88],
          ],
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'polyline',
          id: 'cau-muoi',
          points: [
            [152, 178],
            [152, 70],
            [288, 70],
            [288, 178],
          ],
          stroke: 'muted',
          strokeWidth: 14,
          opacity: 0.35,
        },
        {
          kind: 'rect',
          id: 'la-zn',
          x: 112,
          y: 56,
          w: 18,
          h: 150,
          rx: 2,
          fill: 'muted',
          keyframes: [
            { atMs: 0, scaleX: 1 },
            { atMs: 5400, scaleX: 0.8 },
          ],
        },
        { kind: 'rect', id: 'la-cu', x: 310, y: 56, w: 18, h: 150, rx: 2, fill: 'warn' },
        {
          kind: 'rect',
          id: 'lop-cu',
          x: 328,
          y: 112,
          w: 4,
          h: 94,
          fill: 'warn',
          opacity: 0,
          keyframes: [
            { atMs: 2350, opacity: 0 },
            { atMs: 2650, opacity: 0.55 },
            { atMs: 4750, opacity: 0.55 },
            { atMs: 5050, opacity: 1 },
          ],
        },
        {
          kind: 'polyline',
          id: 'day',
          points: [
            [121, 56],
            [121, 40],
            [319, 40],
            [319, 56],
          ],
          stroke: 'neutral',
          strokeWidth: 2.5,
        },
        {
          kind: 'circle',
          id: 'den',
          cx: 220,
          cy: 40,
          r: 10,
          fill: 'warn',
          stroke: 'neutral',
          strokeWidth: 1.5,
          opacity: 0.3,
          keyframes: [
            { atMs: 400, opacity: 0.3 },
            { atMs: 900, opacity: 0.95 },
          ],
        },
        {
          kind: 'arrow',
          id: 'huong',
          x1: 150,
          y1: 25,
          x2: 290,
          y2: 25,
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'circle',
          id: 'ea1',
          cx: 121,
          cy: 52,
          r: 4,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 200, dx: 0, dy: 0, opacity: 0 },
            { atMs: 280, opacity: 1 },
            { atMs: 480, dx: 0, dy: -12 },
            { atMs: 1980, dx: 198, dy: -12 },
            { atMs: 2180, dx: 198, dy: 0 },
            { atMs: 2380, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'ea2',
          cx: 121,
          cy: 52,
          r: 4,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 330, dx: 0, dy: 0, opacity: 0 },
            { atMs: 410, opacity: 1 },
            { atMs: 610, dx: 0, dy: -12 },
            { atMs: 2110, dx: 198, dy: -12 },
            { atMs: 2310, dx: 198, dy: 0 },
            { atMs: 2510, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'eb1',
          cx: 121,
          cy: 52,
          r: 4,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 2600, dx: 0, dy: 0, opacity: 0 },
            { atMs: 2680, opacity: 1 },
            { atMs: 2880, dx: 0, dy: -12 },
            { atMs: 4380, dx: 198, dy: -12 },
            { atMs: 4580, dx: 198, dy: 0 },
            { atMs: 4780, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'eb2',
          cx: 121,
          cy: 52,
          r: 4,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 2730, dx: 0, dy: 0, opacity: 0 },
            { atMs: 2810, opacity: 1 },
            { atMs: 3010, dx: 0, dy: -12 },
            { atMs: 4510, dx: 198, dy: -12 },
            { atMs: 4710, dx: 198, dy: 0 },
            { atMs: 4910, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'zn1',
          cx: 104,
          cy: 150,
          r: 6,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 200, dx: 0, opacity: 0 },
            { atMs: 450, opacity: 1 },
            { atMs: 1500, dx: -38 },
          ],
        },
        {
          kind: 'circle',
          id: 'zn2',
          cx: 104,
          cy: 186,
          r: 6,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 2600, dx: 0, opacity: 0 },
            { atMs: 2850, opacity: 1 },
            { atMs: 3900, dx: -38 },
          ],
        },
        {
          kind: 'circle',
          id: 'cu1',
          cx: 384,
          cy: 150,
          r: 6,
          fill: 'accent',
          keyframes: [
            { atMs: 1050, dx: 0 },
            { atMs: 2350, dx: -46, opacity: 1 },
            { atMs: 2650, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'cu2',
          cx: 384,
          cy: 186,
          r: 6,
          fill: 'accent',
          keyframes: [
            { atMs: 3450, dx: 0 },
            { atMs: 4750, dx: -46, opacity: 1 },
            { atMs: 5050, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'zn1-t',
          x: 104,
          y: 138,
          text: 'Zn²⁺',
          size: 9,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 200, dx: 0, opacity: 0 },
            { atMs: 450, opacity: 1 },
            { atMs: 1500, dx: -38 },
          ],
        },
        {
          kind: 'label',
          id: 'cu1-t',
          x: 384,
          y: 138,
          text: 'Cu²⁺',
          size: 9,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 1050, dx: 0 },
            { atMs: 2350, dx: -46, opacity: 1 },
            { atMs: 2650, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'no3',
          x: 200,
          y: 74,
          text: 'NO₃⁻',
          size: 9,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 2900, dx: 0, dy: 0, opacity: 0 },
            { atMs: 3100, opacity: 1 },
            { atMs: 3900, dx: -48 },
            { atMs: 5000, dy: 100 },
            { atMs: 5300, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'k',
          x: 240,
          y: 74,
          text: 'K⁺',
          size: 9,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 2900, dx: 0, dy: 0, opacity: 0 },
            { atMs: 3100, opacity: 1 },
            { atMs: 3900, dx: 48 },
            { atMs: 5000, dy: 100 },
            { atMs: 5300, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'cm-t',
          x: 220,
          y: 98,
          text: 'cầu muối KNO₃',
          size: 10,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'e-t',
          x: 220,
          y: 16,
          text: 'dòng electron',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'zn-t',
          x: 106,
          y: 78,
          text: 'Zn',
          size: 12,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'cu-t',
          x: 334,
          y: 78,
          text: 'Cu',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'znso4',
          x: 48,
          y: 214,
          text: 'ZnSO₄',
          size: 10,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'cuso4',
          x: 394,
          y: 214,
          text: 'CuSO₄',
          size: 10,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'anode-t',
          x: 105,
          y: 240,
          text: 'anode (−): Zn → Zn²⁺ + 2e',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'cathode-t',
          x: 335,
          y: 240,
          text: 'cathode (+): Cu²⁺ + 2e → Cu',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'epin',
          x: 220,
          y: 262,
          text: 'E°pin = 0,34 − (−0,76) = 1,10 V',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Zn có thế điện cực âm hơn nên là anode (cực âm): Zn → Zn²⁺ + 2e, ion Zn²⁺ tan vào dung dịch.',
        },
        { atMs: 700, text: 'Hai electron chạy theo dây dẫn sang lá Cu, thắp sáng bóng đèn.' },
        {
          atMs: 2350,
          text: 'Ở cathode (cực dương), ion Cu²⁺ nhận 2 electron thành Cu bám lên lá đồng.',
        },
        {
          atMs: 3100,
          text: 'Cầu muối: NO₃⁻ đi về cốc kẽm, K⁺ đi về cốc đồng — hai dung dịch không bị tích điện.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa12-c5-b16',
    grade: '12',
    chapterNumber: 5,
    chapterTitle: 'Pin điện và điện phân',
    lessonNumber: 16,
    title: 'Điện phân',
    hook:
      'Pin điện biến hoá năng thành điện năng. Điện phân đi theo chiều ngược lại: dùng dòng điện để ép một phản ứng ' +
      'vốn không tự xảy ra phải xảy ra. Nhờ nó, con người luyện được nhôm, sản xuất khí chlorine và mạ vàng đồ trang sức.',
    theory:
      'KHÁI NIỆM ĐIỆN PHÂN:\n' +
      '— Điện phân là quá trình oxi hoá - khử xảy ra trên bề mặt các điện cực dưới tác dụng của dòng điện một chiều đi qua chất điện li nóng chảy hoặc dung dịch chất điện li.\n\n' +
      'SỰ KHÁC BIỆT ĐIỆN CỰC TRONG ĐIỆN PHÂN:\n' +
      '— Anode (cực dương nối với cực dương nguồn điện): Xảy ra quá trình OXI HOÁ. Chất nhường electron là anion (như Cl⁻); với anion SO₄²⁻, NO₃⁻ thì chúng KHÔNG bị oxi hoá mà nước bị oxi hoá thay (2H₂O → O₂ + 4H⁺ + 4e); còn nếu anode không phải điện cực trơ thì chính kim loại anode bị oxi hoá, tan ra.\n' +
      '— Cathode (cực âm nối với cực âm nguồn điện): Xảy ra quá trình KHỬ (cation kim loại nhận electron; với cation rất khó bị khử như Na⁺, K⁺ thì nước bị khử thay, thoát khí H₂).\n\n' +
      'ĐIỆN PHÂN NÓNG CHẢY (Luyện kim mạnh):\n' +
      '— Dùng để điều chế các kim loại có tính khử mạnh (như Na, K, Ca, Mg, Al) từ muối halide hoặc oxide nóng chảy.\n' +
      '   Ví dụ điện phân Al₂O₃ nóng chảy, có thêm cryolite Na₃AlF₆ làm chất trợ chảy để hạ nhiệt độ nóng chảy (không phải chất xúc tác): 2Al₂O₃ → 4Al (ở cathode) + 3O₂ (ở anode).\n\n' +
      'ĐỊNH LUẬT FARADAY VỀ ĐIỆN PHÂN:\n' +
      '— Khối lượng chất giải phóng ở điện cực tỉ lệ thuận với điện lượng đi qua bình điện phân.\n' +
      '— Công thức Faraday: m = (A * I * t) / (n * F).\n' +
      '  Trong đó: m là khối lượng chất giải phóng (gam); A là khối lượng mol nguyên tử của chất (g/mol); I là cường độ dòng điện (Ampere, A); t là thời gian điện phân (giây, s); n là số electron trao đổi của nguyên tử/ion; F là hằng số Faraday (96500 C/mol).',
    workedExample: {
      problem:
        'Điện phân dung dịch CuSO₄ với dòng điện có cường độ I = 2,0 A trong thời gian t = 1930 giây. ' +
        'Tính khối lượng copper (đồng, Cu, M = 64) bám vào cathode.',
      steps: [
        'Xác định phản ứng xảy ra ở cathode (cực âm): ion Cu²⁺ nhận 2e để tạo thành kim loại Cu: Cu²⁺ + 2e → Cu. Số electron trao đổi n = 2.',
        'Áp dụng công thức Faraday: m = (A * I * t) / (n * F).',
        'Thay số vào công thức: m = (64 * 2,0 * 1930) / (2 * 96500).',
        'Tính toán: m = 247040 / 193000 = 1,28 gam.',
      ],
      answer: '1,28 gam',
    },
    checkQuestions: [
      {
        prompt: 'Trong bình điện phân, cực âm (cathode) xảy ra quá trình nào sau đây?',
        choices: [
          { id: 'khu', label: 'Quá trình khử (cation nhận electron)' },
          { id: 'oxi', label: 'Quá trình oxi hoá (anion nhường electron)' },
          { id: 'trunghoa', label: 'Sự trung hoà điện tích' },
        ],
        answer: { kind: 'choice', correctIds: ['khu'] },
        explain:
          'Trong mọi bình điện phân, cathode là cực âm nên hút các cation (+) về phía mình; tới nơi, cation nhận electron, tức là bị khử. Quá trình oxi hoá (của anion, hoặc của nước khi anion là SO₄²⁻, NO₃⁻) xảy ra ở phía anode. Còn trung hoà điện tích chỉ là hệ quả chung của cả bình, không phải phản ứng trên điện cực.',
      },
      {
        prompt: 'Hằng số Faraday (F) có giá trị chuẩn bằng bao nhiêu Coulomb/mol?',
        answer: { kind: 'numeric', value: 96500 },
        explain: 'Hằng số Faraday F = 96500 C/mol là điện tích của 1 mol electron.',
      },
      {
        // Câu BẪY: quên đổi PHÚT ra GIÂY trong công thức Faraday.
        prompt:
          'Điện phân dung dịch AgNO₃ với dòng điện I = 1,93 A trong 16 phút 40 giây. Tính khối ' +
          'lượng bạc (Ag, M = 108) bám vào cathode (gam, chỉ nhập số, làm tròn 2 chữ số thập phân).',
        answer: { kind: 'numeric', value: 2.16, tolerance: { mode: 'absolute', eps: 0.02 } },
        explain:
          'Bẫy số 1: để nguyên "16,67 phút" vào công thức — sai gấp 60 lần. Phải đổi ra giây: ' +
          't = 16×60 + 40 = 1000 s. Bẫy số 2: lấy n = 2 theo thói quen từ bài Cu; ion bạc là ' +
          'Ag⁺ nên Ag⁺ + 1e → Ag, tức n = 1. Thay số: m = (108 × 1,93 × 1000)/(1 × 96500) = ' +
          '208440/96500 ≈ 2,16 gam.',
      },
    ],
    srsCards: [
      {
        hoi: 'Nguyên tắc điều chế kim loại kiềm, kiềm thổ, nhôm?',
        dap: 'Điện phân nóng chảy hợp chất của chúng (muối chloride, oxide).',
      },
      {
        hoi: 'Anode trong bình điện phân nối với cực nào của nguồn điện?',
        dap: 'Nối với cực dương, xảy ra quá trình oxi hoá.',
      },
      { hoi: 'Công thức Faraday về điện phân?', dap: 'm = (A * I * t) / (n * F).' },
    ],
    animation: {
      title: 'Điện phân dung dịch CuSO₄: ion đi về đúng điện cực trái dấu',
      description:
        'Một bình đựng dung dịch CuSO₄ màu xanh với hai điện cực trơ bằng than chì, nối với nguồn điện một chiều: điện cực trái nối cực dương của nguồn (anode), điện cực phải nối cực âm (cathode). Nguồn điện hút electron khỏi anode và đẩy chúng sang cathode qua dây dẫn. Trong dung dịch, ion Cu²⁺ bị hút về cathode và nhận electron: Cu²⁺ + 2e → Cu, lớp đồng đỏ bám dần lên điện cực. Ion SO₄²⁻ bị hút về anode nhưng KHÔNG bị oxi hoá; chính nước bị oxi hoá: 2H₂O → O₂ + 4H⁺ + 4e, bọt khí oxygen sủi lên ở anode và dung dịch quanh đó có thêm H⁺ (tạo H₂SO₄). Khác căn bản với pin điện hoá: phản ứng không tự xảy ra mà bị dòng điện bên ngoài CƯỠNG BỨC, và anode là cực dương chứ không phải cực âm.',
      viewBoxWidth: 420,
      viewBoxHeight: 262,
      durationMs: 6000,
      loop: true,
      shapes: [
        { kind: 'rect', id: 'dd', x: 62, y: 110, w: 296, h: 98, fill: 'accent', opacity: 0.25 },
        {
          kind: 'polyline',
          id: 'binh',
          points: [
            [60, 80],
            [60, 210],
            [360, 210],
            [360, 80],
          ],
          stroke: 'neutral',
          strokeWidth: 2,
        },
        { kind: 'rect', id: 'anode', x: 118, y: 56, w: 16, h: 144, rx: 2, fill: 'muted' },
        { kind: 'rect', id: 'cathode', x: 286, y: 56, w: 16, h: 144, rx: 2, fill: 'muted' },
        {
          kind: 'rect',
          id: 'lop-cu',
          x: 282,
          y: 112,
          w: 4,
          h: 88,
          fill: 'warn',
          opacity: 0,
          keyframes: [
            { atMs: 2300, opacity: 0 },
            { atMs: 2600, opacity: 0.55 },
            { atMs: 3700, opacity: 0.55 },
            { atMs: 4000, opacity: 1 },
          ],
        },
        {
          kind: 'polyline',
          id: 'day',
          points: [
            [126, 56],
            [126, 32],
            [294, 32],
            [294, 56],
          ],
          stroke: 'neutral',
          strokeWidth: 2,
        },
        { kind: 'rect', id: 'nguon', x: 192, y: 20, w: 36, h: 24, rx: 3, fill: 'primary' },
        {
          kind: 'circle',
          id: 'e1',
          cx: 126,
          cy: 50,
          r: 4,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 150, dx: 0, dy: 0, opacity: 0 },
            { atMs: 230, opacity: 1 },
            { atMs: 430, dx: 0, dy: -18 },
            { atMs: 1730, dx: 168, dy: -18 },
            { atMs: 1930, dx: 168, dy: 0 },
            { atMs: 2130, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'e2',
          cx: 126,
          cy: 50,
          r: 4,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 280, dx: 0, dy: 0, opacity: 0 },
            { atMs: 360, opacity: 1 },
            { atMs: 560, dx: 0, dy: -18 },
            { atMs: 1860, dx: 168, dy: -18 },
            { atMs: 2060, dx: 168, dy: 0 },
            { atMs: 2260, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'e3',
          cx: 126,
          cy: 50,
          r: 4,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 1250, dx: 0, dy: 0, opacity: 0 },
            { atMs: 1330, opacity: 1 },
            { atMs: 1530, dx: 0, dy: -18 },
            { atMs: 2830, dx: 168, dy: -18 },
            { atMs: 3030, dx: 168, dy: 0 },
            { atMs: 3230, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'e4',
          cx: 126,
          cy: 50,
          r: 4,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 1380, dx: 0, dy: 0, opacity: 0 },
            { atMs: 1460, opacity: 1 },
            { atMs: 1660, dx: 0, dy: -18 },
            { atMs: 2960, dx: 168, dy: -18 },
            { atMs: 3160, dx: 168, dy: 0 },
            { atMs: 3360, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'cu1',
          cx: 222,
          cy: 158,
          r: 7,
          fill: 'accent',
          keyframes: [
            { atMs: 300, dx: 0 },
            { atMs: 2300, dx: 52, opacity: 1 },
            { atMs: 2600, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'cu2',
          cx: 196,
          cy: 192,
          r: 7,
          fill: 'accent',
          keyframes: [
            { atMs: 1700, dx: 0 },
            { atMs: 3700, dx: 78, opacity: 1 },
            { atMs: 4000, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'so1',
          cx: 238,
          cy: 176,
          r: 7,
          fill: 'primary',
          keyframes: [
            { atMs: 300, dx: 0 },
            { atMs: 3000, dx: -78 },
          ],
        },
        {
          kind: 'circle',
          id: 'so2',
          cx: 258,
          cy: 130,
          r: 7,
          fill: 'primary',
          keyframes: [
            { atMs: 300, dx: 0 },
            { atMs: 3000, dx: -98 },
          ],
        },
        {
          kind: 'circle',
          id: 'bot1',
          cx: 140,
          cy: 186,
          r: 3.5,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 1.2,
          opacity: 0,
          keyframes: [
            { atMs: 1100, dy: 0, opacity: 0 },
            { atMs: 1250, opacity: 1 },
            { atMs: 2400, dy: -74 },
            { atMs: 2550, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'bot2',
          cx: 140,
          cy: 170,
          r: 3.5,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 1.2,
          opacity: 0,
          keyframes: [
            { atMs: 1900, dy: 0, opacity: 0 },
            { atMs: 2050, opacity: 1 },
            { atMs: 3200, dy: -58 },
            { atMs: 3350, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'bot3',
          cx: 140,
          cy: 190,
          r: 3.5,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 1.2,
          opacity: 0,
          keyframes: [
            { atMs: 2700, dy: 0, opacity: 0 },
            { atMs: 2850, opacity: 1 },
            { atMs: 4000, dy: -78 },
            { atMs: 4150, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'bot4',
          cx: 140,
          cy: 176,
          r: 3.5,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 1.2,
          opacity: 0,
          keyframes: [
            { atMs: 3500, dy: 0, opacity: 0 },
            { atMs: 3650, opacity: 1 },
            { atMs: 4800, dy: -64 },
            { atMs: 4950, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'bot5',
          cx: 140,
          cy: 184,
          r: 3.5,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 1.2,
          opacity: 0,
          keyframes: [
            { atMs: 4300, dy: 0, opacity: 0 },
            { atMs: 4450, opacity: 1 },
            { atMs: 5600, dy: -72 },
            { atMs: 5750, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'nguon-t',
          x: 210,
          y: 37,
          text: 'DC',
          size: 11,
          anchor: 'middle',
          fill: 'surface',
        },
        {
          kind: 'label',
          id: 'cuc-duong',
          x: 126,
          y: 22,
          text: '+',
          size: 16,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'cuc-am',
          x: 294,
          y: 22,
          text: '−',
          size: 16,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'dien-cuc',
          x: 210,
          y: 70,
          text: 'hai điện cực trơ (than chì)',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'cu-t',
          x: 222,
          y: 148,
          text: 'Cu²⁺',
          size: 9,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 300, dx: 0 },
            { atMs: 2300, dx: 52, opacity: 1 },
            { atMs: 2600, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'so-t',
          x: 258,
          y: 120,
          text: 'SO₄²⁻',
          size: 9,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 300, dx: 0 },
            { atMs: 3000, dx: -98 },
          ],
        },
        {
          kind: 'label',
          id: 'o2-t',
          x: 152,
          y: 104,
          text: 'O₂↑',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 2200, opacity: 0 },
            { atMs: 2400, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'anode-t',
          x: 16,
          y: 228,
          text: 'anode (+): 2H₂O → O₂ + 4H⁺ + 4e',
          size: 10,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'cat-t',
          x: 404,
          y: 228,
          text: 'cathode (−): Cu²⁺ + 2e → Cu',
          size: 10,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'ion-t',
          x: 210,
          y: 250,
          text: 'SO₄²⁻ về anode nhưng không bị oxi hoá — nước bị oxi hoá thay',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 2800, opacity: 0 },
            { atMs: 3000, opacity: 1 },
          ],
        },
      ],
      captions: [
        { atMs: 0, text: 'Dòng điện một chiều bên ngoài cưỡng bức phản ứng không tự xảy ra.' },
        {
          atMs: 1100,
          text: 'Ở anode (cực dương), nước bị oxi hoá: 2H₂O → O₂ + 4H⁺ + 4e — bọt khí oxygen sủi lên.',
        },
        {
          atMs: 2300,
          text: 'Ion Cu²⁺ về cathode (cực âm), nhận electron thành lớp đồng bám lên điện cực.',
        },
        {
          atMs: 3000,
          text: 'Ion SO₄²⁻ dồn về anode nhưng không bị oxi hoá; dung dịch dần có thêm H₂SO₄.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa12-c5-b17',
    grade: '12',
    chapterNumber: 5,
    chapterTitle: 'Pin điện và điện phân',
    lessonNumber: 17,
    title: 'Ôn tập chương 5 — Pin điện và điện phân',
    hook:
      'Chương 5 nối hai chiều giữa điện năng và hoá năng: pin đi từ phản ứng ra dòng điện, điện phân đi từ dòng điện ra phản ứng. ' +
      'Bài này gom lại các công thức dùng để tính toán cho cả hai chiều.',
    theory:
      'TỔNG KẾT KIẾN THỨC CHƯƠNG 5:\n' +
      '1. Thế điện cực chuẩn (E°): Chỉ số so sánh độ mạnh/yếu của cặp oxi hoá - khử so với SHE (0,00 V). E° âm hơn → kim loại tính khử mạnh hơn. E° dương hơn → ion tính oxi hoá mạnh hơn.\n' +
      '2. Pin điện hoá: Phản ứng tự phát phát ra dòng điện. E°_pin = E°_catot − E°_anot (luôn dương). Cực âm (anode) xảy ra oxi hoá, cực dương (cathode) xảy ra khử.\n' +
      '3. Điện phân: Cưỡng bức bằng dòng điện. Cực dương (anode) xảy ra oxi hoá, cực âm (cathode) xảy ra khử. Điện phân dung dịch NaCl có màng ngăn tạo NaOH, Cl₂ (ở anode) và H₂ (ở cathode).\n' +
      '4. Định luật Faraday: m = A·I·t / (n·F). Tính khối lượng chất thoát ra ở các điện cực.',
    workedExample: {
      problem:
        'Tính suất điện động chuẩn E°_pin của pin điện hoá tạo bởi cặp Fe²⁺/Fe (E° = −0,44 V) và Cu²⁺/Cu (E° = 0,34 V).',
      steps: [
        'Cực âm (anode) của pin có thế điện cực nhỏ hơn: Fe (E° = −0,44 V).',
        'Cực dương (cathode) của pin có thế điện cực lớn hơn: Cu (E° = 0,34 V).',
        'Áp dụng công thức suất điện động chuẩn của pin: E°_pin = E°_catot − E°_anot.',
        'Tính toán: E°_pin = 0,34 − (−0,44) = 0,78 V.',
      ],
      answer: 'E°_pin = 0,78 V',
    },
    checkQuestions: [
      {
        prompt:
          'Khi điện phân dung dịch NaCl bão hoà có màng ngăn điện cực, sản phẩm thu được ở cực dương (anode) là khí nào?',
        choices: [
          { id: 'h2', label: 'Khí hydrogen (H₂)' },
          { id: 'cl2', label: 'Khí chlorine (Cl₂)' },
          { id: 'o2', label: 'Khí oxygen (O₂)' },
        ],
        answer: { kind: 'choice', correctIds: ['cl2'] },
        explain:
          'Ở cực dương (anode), ion Cl⁻ bị oxi hoá giải phóng khí Cl₂. Ở cực âm (cathode), nước bị khử giải phóng khí H₂ và tạo OH⁻.',
      },
      {
        prompt: 'Kim loại nào sau đây chỉ có thể điều chế bằng phương pháp điện phân nóng chảy?',
        choices: [
          { id: 'cu', label: 'Copper (Cu)' },
          { id: 'fe', label: 'Iron (Fe)' },
          { id: 'al', label: 'Aluminium (Al)' },
          { id: 'ag', label: 'Silver (Ag)' },
        ],
        answer: { kind: 'choice', correctIds: ['al'] },
        explain:
          'Aluminium (Al) có tính khử mạnh, các phương pháp thuỷ luyện hoặc nhiệt luyện không khử được ion Al³⁺. Phải dùng điện phân nóng chảy oxide Al₂O₃. Copper, iron và silver có tính khử yếu hơn nên vẫn điều chế được bằng nhiệt luyện hoặc thuỷ luyện.',
      },
    ],
    srsCards: [
      {
        hoi: 'Suất điện động của pin điện hoá có bao giờ âm không?',
        dap: 'Không. Vì ta luôn lấy điện cực có E° lớn hơn làm cathode, nên hiệu E°_catot − E°_anot luôn dương. Nếu tính ra số âm thì đã gán nhầm anode với cathode.',
      },
      {
        hoi: 'Tại sao điện phân dung dịch muối ăn cần màng ngăn giữa hai điện cực?',
        dap: 'Để ngăn khí Cl₂ ở cực dương phản ứng với NaOH sinh ra ở cực âm (nếu không có màng ngăn sẽ tạo ra nước Javel).',
      },
      {
        hoi: 'Đơn vị đo cường độ dòng điện I và thời gian t trong công thức Faraday?',
        dap: 'Cường độ dòng điện I tính bằng Ampere (A); thời gian t tính bằng giây (s).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
