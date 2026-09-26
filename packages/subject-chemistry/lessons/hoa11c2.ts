// lessons/hoa11c2.ts — Hoá học 11, Chương 2: Nitrogen - Sulfur (6 bài).
// Đối chiếu mục lục thật: tai-lieu-sgk/SGK-Hoa/11/page_0004.png (OCR 2026-08-31).
// reviewStatus='draft' — soạn từ docs/research/kho-kien-thuc-hoa-gdpt2018.md §3, chưa duyệt.
import type { ChemLesson } from '../lessonTypes.js'

export const HOA11_C2_LESSONS: ChemLesson[] = [
  {
    id: 'hoa11-c2-b4',
    grade: '11',
    chapterNumber: 2,
    chapterTitle: 'Nitrogen - Sulfur',
    lessonNumber: 4,
    title: 'Nitrogen',
    hook:
      'Khí nitrogen chiếm tới 78% thể tích không khí xung quanh ta, nhưng con người và thực vật ' +
      'không thể trực tiếp "hít thở" để lấy đạm. Lý do là liên kết ba siêu bền giữa hai nguyên tử.',
    theory:
      'TRẠNG THÁI TỰ NHIÊN VÀ CẤU TẠO:\n' +
      '— Nitrogen (N) thuộc nhóm VA, chu kì 2. Phân tử nitrogen gồm 2 nguyên tử (N₂).\n' +
      '— Công thức electron: :N⋮⋮N:; công thức cấu tạo: N≡N.\n' +
      '— Năng lượng liên kết rất lớn (946 kJ/mol) làm N₂ rất bền ở nhiệt độ thường (trơ về mặt hoá học).\n\n' +
      'TÍNH CHẤT HOÁ HỌC CƠ BẢN:\n' +
      'Nitrogen vừa có tính khử, vừa có tính oxi hoá (do số oxi hoá 0 là trung gian, có thể giảm xuống −3 hoặc tăng lên +1, +2, +3, +4, +5).\n' +
      '1. Tính oxi hoá (thể hiện khi tác dụng với chất khử mạnh hơn như kim loại, hydrogen):\n' +
      '   — Tác dụng với hydrogen ở nhiệt độ cao, áp suất cao, xúc tác: N₂ + 3H₂ ⇌ 2NH₃ (phản ứng thuận nghịch, toả nhiệt).\n' +
      '   — Tác dụng với kim loại ở nhiệt độ cao (riêng Lithium phản ứng ngay ở nhiệt độ thường): 3Mg + N₂ → Mg₃N₂.\n' +
      '2. Tính khử (thể hiện khi tác dụng với chất oxi hoá mạnh hơn như oxygen):\n' +
      '   — Ở nhiệt độ rất cao (khoảng 3000 °C hoặc tia lửa điện): N₂ + O₂ ⇌ 2NO (nitric oxide, khí không màu, hoá nâu ngoài không khí tạo NO₂).',
    workedExample: {
      problem:
        'Trong công nghiệp, người ta sản xuất NH₃ từ N₂ và H₂ ở nhiệt độ 450 °C, áp suất 200 bar, ' +
        'xúc tác Fe. Để tăng hiệu suất của phản ứng toả nhiệt này: N₂(g) + 3H₂(g) ⇌ 2NH₃(g) (ΔH < 0), ' +
        'ta nên tăng hay giảm áp suất của hệ phản ứng? Giải thích.',
      steps: [
        'Đếm số phân tử khí ở hai vế phương trình: vế trái có 1 (N₂) + 3 (H₂) = 4 phân tử khí; vế phải có 2 (NH₃) phân tử khí.',
        'Vì tổng số phân tử khí vế trái (4) lớn hơn vế phải (2) nên khi tăng áp suất, cân bằng dịch chuyển theo chiều làm giảm số phân tử khí.',
        'Chiều làm giảm số phân tử khí là chiều thuận (4 → 2) tạo ra NH₃.',
        'Kết luận: Cần TĂNG áp suất của hệ phản ứng để cân bằng dịch chuyển theo chiều thuận, làm tăng hiệu suất tạo NH₃.',
      ],
      answer: 'Tăng áp suất',
    },
    checkQuestions: [
      {
        prompt: 'Liên kết trong phân tử N₂ là loại liên kết nào?',
        choices: [
          { id: 'don', label: 'Liên kết đơn' },
          { id: 'doi', label: 'Liên kết đôi' },
          { id: 'ba', label: 'Liên kết ba' },
          { id: 'ion', label: 'Liên kết ion' },
        ],
        answer: { kind: 'choice', correctIds: ['ba'] },
        explain:
          'Phân tử N₂ có công thức cấu tạo N≡N, tức là có liên kết ba cộng hoá trị không cực bền vững.',
      },
      {
        prompt:
          'Khí NO (nitric oxide) sinh ra khi giông bão có sấm sét hoá nâu ngoài không khí tạo thành khí nào?',
        choices: [
          { id: 'no2', label: 'NO₂ (nitrogen dioxide, màu nâu đỏ)' },
          { id: 'n2o', label: 'N₂O (dinitrogen monoxide, khí cười)' },
          { id: 'n2o5', label: 'N₂O₅' },
          { id: 'nh3', label: 'NH₃ (ammonia)' },
        ],
        answer: { kind: 'choice', correctIds: ['no2'] },
        explain:
          'NO tác dụng ngay với oxygen trong không khí ở điều kiện thường tạo khí NO₂ màu nâu đỏ: 2NO + O₂ → 2NO₂.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tại sao nitrogen trơ ở nhiệt độ thường?',
        dap: 'Vì phân tử N₂ có liên kết ba N≡N siêu bền, năng lượng liên kết rất lớn (946 kJ/mol).',
      },
      {
        hoi: 'Nitrogen thể hiện tính chất gì khi tác dụng với hydrogen?',
        dap: 'Thể hiện tính oxi hoá (số oxi hoá giảm từ 0 xuống −3).',
      },
      { hoi: 'Khí NO hoá nâu ngoài không khí tạo chất gì?', dap: 'Khí NO₂ màu nâu đỏ.' },
    ],
    animation: {
      title: 'Liên kết ba N≡N và lý do nitrogen trơ ở nhiệt độ thường',
      description:
        'Hai nguyên tử nitrogen nối nhau bằng ba vạch — ba cặp electron dùng chung, tức liên kết ba. Thanh năng lượng bên phải cho thấy phải cấp 946 kJ cho mỗi mol mới bẻ được liên kết ấy, cao hơn hẳn liên kết đôi O=O (498 kJ/mol). Ở nhiệt độ thường, va chạm giữa các phân tử không đủ mạnh: hai nguyên tử N chỉ rung tại chỗ mà không rời nhau, nên nitrogen chiếm 78% không khí mà vẫn gần như không phản ứng với gì. Chỉ khi nhiệt độ lên tới khoảng 3000 °C trở lên — như trong tia sét (nóng tới hàng chục nghìn độ) hoặc hồ quang điện — liên kết mới đứt và N₂ mới chịu kết hợp với O₂ tạo NO.',
      viewBoxWidth: 440,
      viewBoxHeight: 220,
      durationMs: 7000,
      loop: true,
      shapes: [
        {
          kind: 'circle',
          id: 'n1',
          cx: 120,
          cy: 90,
          r: 30,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          keyframes: [
            {
              atMs: 0,
              dx: 0,
            },
            {
              atMs: 1200,
              dx: -3,
            },
            {
              atMs: 2400,
              dx: 3,
            },
            {
              atMs: 3600,
              dx: 0,
            },
            {
              atMs: 5200,
              dx: -34,
            },
            {
              atMs: 7000,
              dx: -34,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'n2',
          cx: 230,
          cy: 90,
          r: 30,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          keyframes: [
            {
              atMs: 0,
              dx: 0,
            },
            {
              atMs: 1200,
              dx: 3,
            },
            {
              atMs: 2400,
              dx: -3,
            },
            {
              atMs: 3600,
              dx: 0,
            },
            {
              atMs: 5200,
              dx: 34,
            },
            {
              atMs: 7000,
              dx: 34,
            },
          ],
        },
        {
          kind: 'label',
          id: 'n1t',
          x: 120,
          y: 96,
          text: 'N',
          size: 17,
          anchor: 'middle',
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 1200, dx: -3 },
            { atMs: 2400, dx: 3 },
            { atMs: 3600, dx: 0 },
            { atMs: 5200, dx: -34 },
            { atMs: 7000, dx: -34 },
          ],
        },
        {
          kind: 'label',
          id: 'n2t',
          x: 230,
          y: 96,
          text: 'N',
          size: 17,
          anchor: 'middle',
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 1200, dx: 3 },
            { atMs: 2400, dx: -3 },
            { atMs: 3600, dx: 0 },
            { atMs: 5200, dx: 34 },
            { atMs: 7000, dx: 34 },
          ],
        },
        {
          kind: 'line',
          id: 'lk1',
          x1: 152,
          y1: 78,
          x2: 198,
          y2: 78,
          stroke: 'accent',
          strokeWidth: 2.5,
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 3600, opacity: 1 },
            { atMs: 4400, opacity: 0 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'lk2',
          x1: 152,
          y1: 90,
          x2: 198,
          y2: 90,
          stroke: 'accent',
          strokeWidth: 2.5,
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 3600, opacity: 1 },
            { atMs: 4400, opacity: 0 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'lk3',
          x1: 152,
          y1: 102,
          x2: 198,
          y2: 102,
          stroke: 'accent',
          strokeWidth: 2.5,
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 3600, opacity: 1 },
            { atMs: 4400, opacity: 0 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'lkt',
          x: 175,
          y: 130,
          text: '3 cặp electron dùng chung',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 3600, opacity: 1 },
            { atMs: 4400, opacity: 0 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'rect',
          id: 'khung',
          x: 306,
          y: 40,
          w: 80,
          h: 140,
          fill: 'surface',
          stroke: 'muted',
          strokeWidth: 1.5,
          rx: 3,
        },
        { kind: 'rect', id: 'cotN', x: 314, y: 44, w: 24, h: 132, fill: 'primary', rx: 2 },
        { kind: 'rect', id: 'cotO', x: 350, y: 106.5, w: 24, h: 69.5, fill: 'muted', rx: 2 },
        {
          kind: 'label',
          id: 'gtN',
          x: 326,
          y: 62,
          text: '946',
          size: 11,
          anchor: 'middle',
          fill: 'surface',
        },
        {
          kind: 'label',
          id: 'gtO',
          x: 362,
          y: 124,
          text: '498',
          size: 11,
          anchor: 'middle',
          fill: 'surface',
        },
        {
          kind: 'label',
          id: 'tenN',
          x: 326,
          y: 196,
          text: 'N≡N',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'tenO',
          x: 362,
          y: 196,
          text: 'O=O',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'donvi',
          x: 346,
          y: 32,
          text: 'kJ/mol',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'sett',
          x: 175,
          y: 170,
          text: '≥ 3000 °C (tia sét, hồ quang): N₂ + O₂ → 2NO',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4600, opacity: 0 },
            { atMs: 5200, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'tro',
          x: 175,
          y: 212,
          text: 'Nhiệt độ thường: chỉ rung, không đứt — nitrogen trơ',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Hai nguyên tử N góp chung ba cặp electron: liên kết ba N≡N.' },
        { atMs: 2000, text: 'Năng lượng liên kết 946 kJ/mol, gần gấp đôi liên kết đôi O=O.' },
        {
          atMs: 4800,
          text: 'Phải từ khoảng 3000 °C trở lên — như trong tia sét, hồ quang điện — N₂ mới phản ứng với O₂ tạo NO.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c2-b5',
    grade: '11',
    chapterNumber: 2,
    chapterTitle: 'Nitrogen - Sulfur',
    lessonNumber: 5,
    title: 'Ammonia - Muối ammonium',
    hook:
      'Ammonia là một trong những hoá chất được sản xuất nhiều nhất thế giới, vì nó là nguyên liệu ' +
      'làm phân đạm nuôi sống khoảng một nửa dân số toàn cầu. Khí này có mùi khai đặc trưng.',
    theory:
      'AMMONIA (NH₃):\n' +
      '— Cấu tạo: Nguyên tử N liên kết với 3 nguyên tử H bằng liên kết cộng hoá trị phân cực. Phân tử có hình chóp tam giác. Nguyên tử N còn một cặp electron chưa tham gia liên kết.\n' +
      '— Tính chất vật lí: Khí không màu, mùi khai và xốc, nhẹ hơn không khí. NH₃ tan RẤT NHIỀU trong nước do tạo liên kết hydrogen mạnh với nước.\n' +
      '— Tính chất hoá học:\n' +
      '  1. Tính base yếu: Dung dịch NH₃ làm quỳ tím hoá xanh, phenolphthalein hoá hồng. Tác dụng với acid tạo muối ammonium: NH₃ + HCl → NH₄Cl.\n' +
      '  2. Tính khử (do N có số oxi hoá cực tiểu −3): Phản ứng cháy trong oxygen: 4NH₃ + 3O₂ → 2N₂ + 6H₂O (nhiệt độ cao).\n\n' +
      'MUỐI AMMONIUM (chứa ion NH₄⁺):\n' +
      '— Tính chất: Đều dễ tan trong nước, điện li mạnh thành ion: NH₄Cl → NH₄⁺ + Cl⁻.\n' +
      '— Phản ứng với dung dịch kiềm (dùng để nhận biết ion ammonium): NH₄⁺ + OH⁻ → NH₃↑ + H₂O (khí thoát ra mùi khai, làm quỳ tím ẩm hoá xanh).\n' +
      '— Kém bền nhiệt (bị phân huỷ khi đun nóng): NH₄Cl(r) → NH₃(k) + HCl(k).',
    workedExample: {
      problem:
        'Nhỏ dung dịch NaOH vào ống nghiệm đựng dung dịch muối ammonium chloride NH₄Cl, thấy có khí ' +
        'không màu thoát ra. Viết phương trình ion rút gọn của phản ứng này.',
      steps: [
        'NaOH phân li tạo Na⁺ và OH⁻; NH₄Cl phân li tạo NH₄⁺ và Cl⁻.',
        'Phản ứng xảy ra giữa ion NH₄⁺ và OH⁻: NH₄⁺ + OH⁻ → NH₃↑ + H₂O.',
        'Khí thoát ra là NH₃ có mùi khai đặc trưng.',
        'Phương trình ion rút gọn thu được là NH₄⁺ + OH⁻ → NH₃ + H₂O.',
      ],
      answer: 'NH4+ + OH- -> NH3 + H2O',
    },
    checkQuestions: [
      {
        prompt:
          'Khi hoà tan khí NH₃ vào nước, dung dịch thu được làm chỉ thị phenolphthalein chuyển sang màu gì?',
        choices: [
          { id: 'do', label: 'Đỏ' },
          { id: 'xanh', label: 'Xanh' },
          { id: 'hong', label: 'Hồng' },
          { id: 'khong', label: 'Không đổi màu' },
        ],
        answer: { kind: 'choice', correctIds: ['hong'] },
        explain:
          'Dung dịch NH₃ có tính base yếu, làm quỳ tím hoá xanh và phenolphthalein hoá hồng.',
      },
      {
        prompt:
          'Để nhận biết ion ammonium (NH₄⁺) trong dung dịch, người ta đun nóng dung dịch đó với dung dịch chất nào?',
        choices: [
          { id: 'hcl', label: 'HCl' },
          { id: 'naoh', label: 'NaOH' },
          { id: 'nacl', label: 'NaCl' },
          { id: 'h2so4', label: 'H₂SO₄' },
        ],
        answer: { kind: 'choice', correctIds: ['naoh'] },
        explain:
          'NaOH cung cấp ion OH⁻. Khi đun nóng, NH₄⁺ phản ứng với OH⁻ giải phóng khí NH₃ mùi khai, làm xanh giấy quỳ ẩm.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tại sao NH₃ tan rất nhiều trong nước?',
        dap: 'Vì NH₃ tạo được liên kết hydrogen liên phân tử mạnh với phân tử nước.',
      },
      {
        hoi: 'Hai tính chất hoá học đặc trưng của NH₃ là gì?',
        dap: 'Tính base yếu và tính khử (do số oxi hoá −3).',
      },
      {
        hoi: 'Hiện tượng nhận biết muối ammonium tác dụng với kiềm?',
        dap: 'Sinh khí mùi khai (NH₃) làm hoá xanh giấy quỳ ẩm.',
      },
    ],
    animation: {
      title: 'Cặp electron chưa liên kết của NH₃ nhận proton thành ion NH₄⁺',
      description:
        'Phân tử ammonia được vẽ hình chóp tam giác: nguyên tử N ở đỉnh, ba nguyên tử H ở ba góc đáy, và ngay trên đỉnh N là một cặp chấm — cặp electron chưa tham gia liên kết. Một ion H⁺ từ bên trái tiến tới; vì H⁺ hoàn toàn trống electron nên nó cắm thẳng vào cặp chấm đó, tạo liên kết cho–nhận. Kết quả là ion ammonium NH₄⁺ với bốn liên kết N–H hoàn toàn giống nhau và hình tứ diện đều: không còn phân biệt được liên kết nào là "cho–nhận". Đây là gốc rễ của tính base của ammonia: nó base không phải vì có nhóm OH, mà vì có cặp electron sẵn để cho.',
      viewBoxWidth: 440,
      viewBoxHeight: 220,
      durationMs: 7000,
      loop: true,
      shapes: [
        {
          kind: 'circle',
          id: 'n',
          cx: 150,
          cy: 100,
          r: 24,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'nt',
          x: 150,
          y: 106,
          text: 'N',
          size: 16,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'circle',
          id: 'h1',
          cx: 96,
          cy: 162,
          r: 16,
          fill: 'surface',
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'circle',
          id: 'h2',
          cx: 150,
          cy: 178,
          r: 16,
          fill: 'surface',
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'circle',
          id: 'h3',
          cx: 204,
          cy: 162,
          r: 16,
          fill: 'surface',
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'label',
          id: 'h1t',
          x: 96,
          y: 167,
          text: 'H',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'h2t',
          x: 150,
          y: 183,
          text: 'H',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'h3t',
          x: 204,
          y: 167,
          text: 'H',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'line',
          id: 'b1',
          x1: 136,
          y1: 120,
          x2: 104,
          y2: 148,
          stroke: 'primary',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'b2',
          x1: 150,
          y1: 124,
          x2: 150,
          y2: 162,
          stroke: 'primary',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'b3',
          x1: 164,
          y1: 120,
          x2: 196,
          y2: 148,
          stroke: 'primary',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'b4',
          x1: 150,
          y1: 76,
          x2: 150,
          y2: 43,
          stroke: 'accent',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3200, opacity: 0 },
            { atMs: 3700, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'e1',
          cx: 143,
          cy: 66,
          r: 4,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 1 },
            { atMs: 3000, dx: 0, dy: 0 },
            { atMs: 3400, dx: 4, dy: -7 },
            { atMs: 3600, opacity: 1 },
            { atMs: 4000, opacity: 0 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'e2',
          cx: 157,
          cy: 66,
          r: 4,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 1 },
            { atMs: 3000, dx: 0, dy: 0 },
            { atMs: 3400, dx: -4, dy: -7 },
            { atMs: 3600, opacity: 1 },
            { atMs: 4000, opacity: 0 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'et',
          x: 170,
          y: 70,
          text: 'cặp electron chưa liên kết',
          size: 10,
          anchor: 'start',
          fill: 'accent',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 3000, opacity: 1 },
            { atMs: 3400, opacity: 0 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'et2',
          x: 170,
          y: 62,
          text: 'liên kết cho–nhận',
          size: 10,
          anchor: 'start',
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3600, opacity: 0 },
            { atMs: 4000, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'hp',
          cx: 44,
          cy: 100,
          r: 13,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2,
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 1200, dx: 0, dy: 0 },
            { atMs: 3000, dx: 106, dy: -70 },
            { atMs: 7000, dx: 106, dy: -70 },
          ],
        },
        {
          kind: 'label',
          id: 'hpt',
          x: 44,
          y: 105,
          text: 'H⁺',
          size: 12,
          anchor: 'middle',
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 1 },
            { atMs: 1200, dx: 0, dy: 0 },
            { atMs: 3000, dx: 106, dy: -70 },
            { atMs: 3400, opacity: 1 },
            { atMs: 3800, opacity: 0 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'hpt2',
          x: 150,
          y: 35,
          text: 'H',
          size: 12,
          anchor: 'middle',
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3400, opacity: 0 },
            { atMs: 3800, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'kq',
          x: 340,
          y: 92,
          text: 'NH₄⁺',
          size: 20,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3400,
              opacity: 0,
            },
            {
              atMs: 4000,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'kq2',
          x: 340,
          y: 118,
          text: 'tứ diện, 4 liên kết N–H như nhau',
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
              atMs: 3400,
              opacity: 0,
            },
            {
              atMs: 4000,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'kq3',
          x: 340,
          y: 148,
          text: 'NH₃ + H⁺ → NH₄⁺',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4400,
              opacity: 0,
            },
            {
              atMs: 5000,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'NH₃ hình chóp tam giác, còn dư một cặp electron trên nguyên tử N.',
        },
        {
          atMs: 1600,
          text: 'Ion H⁺ không có electron nào, nó tới nhận cặp electron đó.',
        },
        {
          atMs: 3400,
          text: 'Tạo liên kết cho–nhận: NH₄⁺ có 4 liên kết N–H hoàn toàn tương đương.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c2-b6',
    grade: '11',
    chapterNumber: 2,
    chapterTitle: 'Nitrogen - Sulfur',
    lessonNumber: 6,
    title: 'Một số hợp chất của nitrogen với oxygen',
    hook:
      'Acid nitric (HNO₃) vừa là acid mạnh, vừa là chất oxi hoá cực mạnh. Nó hoà tan được cả đồng (Cu) ' +
      '— kim loại mà acid HCl trong dạ dày cũng phải "bó tay".',
    theory:
      'CÁC OXIDE CỦA NITROGEN (NOx):\n' +
      '— Gồm: N₂O (khí cười), NO (không màu, hoá nâu ngoài không khí), NO₂ (màu nâu đỏ, độc), N₂O₄ (không màu).\n' +
      '— Khí NOx phát thải từ động cơ đốt trong, nhà máy nhiệt điện là nguyên nhân chính gây mưa acid và khói mù quang hoá.\n\n' +
      'ACID NITRIC (HNO₃):\n' +
      '1. Tính acid mạnh: Là một trong các acid vô cơ mạnh nhất, điện li hoàn toàn: HNO₃ → H⁺ + NO₃⁻.\n' +
      '2. Tính oxi hoá mạnh (đặc trưng nhất):\n' +
      '   — Do N có số oxi hoá cực đại +5 trong HNO₃, nó luôn bị khử xuống số oxi hoá thấp hơn (NO₂, NO, N₂O, N₂, NH₄⁺).\n' +
      '   — Oxi hoá hầu hết kim loại (trừ vàng Au, bạch kim Pt) tạo muối nitrate của kim loại có số oxi hoá cao nhất, KHÔNG giải phóng khí H₂.\n' +
      '   — HNO₃ đặc tạo khí NO₂ màu nâu đỏ; HNO₃ loãng tạo khí NO không màu hoá nâu.\n\n' +
      'HIỆN TƯỢNG MƯA ACID:\n' +
      '— Mưa acid là nước mưa có pH < 5,6, hình thành do các khí thải độc hại như SO₂ và NOx tan trong nước mưa tạo thành acid mạnh tương ứng (H₂SO₄, HNO₃).' +
      ' Tác hại: tàn phá rừng, huỷ hoại sinh vật thuỷ sinh, ăn mòn công trình kiến trúc bằng đá và kim loại.',
    workedExample: {
      problem:
        'Cho kim loại Copper (đồng, Cu) phản ứng với dung dịch HNO₃ loãng dư, sinh ra khí nitric oxide (NO) ' +
        'không màu. Viết phương trình hoá học dạng phân tử đã cân bằng của phản ứng này.',
      steps: [
        'Xác định chất phản ứng và sản phẩm: Cu + HNO₃ → Cu(NO₃)₂ + NO + H₂O.',
        'Xác định số oxi hoá thay đổi: Cu (0 → +2); N (+5 → +2 trong NO).',
        'Viết quá trình oxi hoá và khử:\n  Cu → Cu²⁺ + 2e (nhường 2e)\n  N⁺⁵ + 3e → N⁺² (nhận 3e).',
        'Thăng bằng electron: nhân hệ số 3 vào Cu, nhân hệ số 2 vào N⁺².\n  3Cu + 8HNO₃ → 3Cu(NO₃)₂ + 2NO + 4H₂O.',
        'Kiểm tra lại H và O: vế trái có 8 H và 24 O; vế phải có 4×2 = 8 H và 18 + 2 + 4 = 24 O. Cân bằng hoàn tất.',
      ],
      answer: '3Cu + 8HNO3 -> 3Cu(NO3)2 + 2NO + 4H2O',
    },
    checkQuestions: [
      {
        prompt: 'Khí chính nào sau đây là nguyên nhân gây ra hiện tượng mưa acid?',
        choices: [
          { id: 'co2', label: 'CO₂ và CH₄' },
          { id: 'so2', label: 'SO₂ và các oxide của nitrogen (NOx)' },
          { id: 'o2', label: 'O₂ và N₂' },
          { id: 'cfc', label: 'CFC và O₃' },
        ],
        answer: { kind: 'choice', correctIds: ['so2'] },
        explain:
          'SO₂ và NOx (NO, NO₂) do con người thải ra gặp hơi nước và oxygen trong khí quyển, tạo thành acid H₂SO₄ và HNO₃; chúng theo nước mưa rơi xuống, gây mưa acid.',
      },
      {
        prompt:
          'Khi cho kim loại sắt (Fe) tác dụng với dung dịch HNO₃ loãng, dư thì thu được muối sắt có hoá trị mấy?',
        choices: [
          { id: 'ii', label: 'Sắt(II) (Fe²⁺)' },
          { id: 'iii', label: 'Sắt(III) (Fe³⁺)' },
          { id: 'ii_iii', label: 'Hỗn hợp sắt(II) và sắt(III)' },
          { id: 'khong', label: 'Không phản ứng' },
        ],
        answer: { kind: 'choice', correctIds: ['iii'] },
        explain:
          'Vì HNO₃ dư có tính oxi hoá rất mạnh nên sẽ oxi hoá kim loại sắt lên mức oxi hoá cao nhất là sắt(III) (+3), tạo muối Fe(NO₃)₃.',
      },
    ],
    srsCards: [
      {
        hoi: 'Khí NOx và SO₂ gây ra hiện tượng gì?',
        dap: 'Hiện tượng mưa acid (nước mưa có pH < 5,6).',
      },
      {
        hoi: 'Tính chất đặc trưng của HNO₃ khác acid thường thế nào?',
        dap: 'Tính oxi hoá rất mạnh, tác dụng kim loại tạo muối hoá trị cao nhất và khí (NO, NO₂...), không tạo H₂.',
      },
      { hoi: 'Khí sinh ra khi kim loại tác dụng với HNO₃ đặc?', dap: 'Khí NO₂ màu nâu đỏ.' },
    ],
    animation: {
      title: 'Chuỗi tia sét → NO → NO₂ → HNO₃: đường sinh ra mưa acid',
      description:
        'Bốn chặng hiện ra theo đúng thứ tự xảy ra trong khí quyển. Chặng 1: tia sét cấp nhiệt độ rất cao, N₂ trong không khí kết hợp với O₂ cho NO — một khí không màu. Chặng 2: NO vừa ra khỏi tia sét đã gặp O₂ của không khí và bị oxi hoá ngay ở nhiệt độ thường thành NO₂ có màu nâu đỏ; đây là lý do người ta nói "NO hoá nâu trong không khí". Chặng 3: NO₂ tan vào hơi nước cùng O₂ tạo HNO₃. Chặng 4: giọt nước mang HNO₃ rơi xuống đất thành mưa acid. Số oxi hoá của nitrogen tăng dần suốt chuỗi: 0 ở N₂, +2 ở NO, +4 ở NO₂, +5 ở HNO₃.',
      viewBoxWidth: 470,
      viewBoxHeight: 220,
      durationMs: 8000,
      loop: true,
      shapes: [
        {
          kind: 'polyline',
          id: 'set',
          points: [
            [52, 20],
            [40, 56],
            [58, 56],
            [44, 92],
          ],
          stroke: 'accent',
          strokeWidth: 3,
        },
        {
          kind: 'label',
          id: 'sett',
          x: 60,
          y: 110,
          text: 'tia sét: trên 3000 °C',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 's1',
          x: 130,
          y: 60,
          text: 'N₂ + O₂',
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'arrow',
          id: 'a1',
          x1: 130,
          y1: 78,
          x2: 130,
          y2: 104,
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 800,
              opacity: 0,
            },
            {
              atMs: 1200,
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
          id: 's2',
          x: 130,
          y: 124,
          text: '2NO',
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
          id: 's2b',
          x: 130,
          y: 144,
          text: 'không màu, N là +2',
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
          id: 'a2',
          x1: 168,
          y1: 124,
          x2: 224,
          y2: 124,
          stroke: 'primary',
          strokeWidth: 2,
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
              atMs: 2600,
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
          id: 'a2t',
          x: 196,
          y: 112,
          text: '+ O₂',
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
              atMs: 2200,
              opacity: 0,
            },
            {
              atMs: 2600,
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
          id: 's3',
          x: 268,
          y: 124,
          text: '2NO₂',
          size: 15,
          anchor: 'middle',
          fill: 'accent',
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
              atMs: 3100,
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
          id: 's3b',
          x: 268,
          y: 144,
          text: 'nâu đỏ, N là +4',
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
              atMs: 3100,
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
          id: 'a3',
          x1: 312,
          y1: 124,
          x2: 368,
          y2: 124,
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3800,
              opacity: 0,
            },
            {
              atMs: 4200,
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
          id: 'a3t',
          x: 340,
          y: 112,
          text: '+ O₂ + H₂O',
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
              atMs: 3800,
              opacity: 0,
            },
            {
              atMs: 4200,
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
          id: 's4',
          x: 414,
          y: 124,
          text: 'HNO₃',
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
              atMs: 4200,
              opacity: 0,
            },
            {
              atMs: 4700,
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
          id: 's4b',
          x: 414,
          y: 144,
          text: 'N là +5',
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
              atMs: 4200,
              opacity: 0,
            },
            {
              atMs: 4700,
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
          id: 'giot',
          cx: 414,
          cy: 162,
          r: 6,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
              dy: 0,
            },
            {
              atMs: 5200,
              opacity: 0,
              dy: 0,
            },
            {
              atMs: 5400,
              opacity: 1,
              dy: 0,
            },
            {
              atMs: 6600,
              opacity: 1,
              dy: 30,
            },
            {
              atMs: 8000,
              opacity: 1,
              dy: 30,
            },
          ],
        },
        {
          kind: 'line',
          id: 'dat',
          x1: 30,
          y1: 202,
          x2: 450,
          y2: 202,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'mua',
          x: 380,
          y: 218,
          text: 'mưa acid',
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
              atMs: 6600,
              opacity: 0,
            },
            {
              atMs: 7000,
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
          text: 'Tia sét đủ nóng để bẻ N≡N: N₂ + O₂ → 2NO.',
        },
        {
          atMs: 2200,
          text: 'NO gặp O₂ không khí, hoá nâu ngay: 2NO + O₂ → 2NO₂.',
        },
        {
          atMs: 3800,
          text: 'NO₂ tan trong nước có O₂: 4NO₂ + O₂ + 2H₂O → 4HNO₃.',
        },
        {
          atMs: 5400,
          text: 'Giọt nước mang HNO₃ rơi xuống — đó là mưa acid.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c2-b7',
    grade: '11',
    chapterNumber: 2,
    chapterTitle: 'Nitrogen - Sulfur',
    lessonNumber: 7,
    title: 'Sulfur và sulfur dioxide',
    hook:
      'Lưu huỳnh (Sulfur) là chất rắn màu vàng, gắn liền với núi lửa và là thành phần của thuốc súng đen.' +
      ' Khi đốt cháy lưu huỳnh, ta thu được khí SO₂ có mùi hắc nghẹt thở.',
    theory:
      'ĐƠN CHẤT SULFUR (S):\n' +
      '— Cấu tạo: Ở nhiệt độ thường gồm 8 nguyên tử liên kết vòng (S₈), thường viết đơn giản là S.\n' +
      '— Tính chất hoá học: Có số oxi hoá trung gian 0, nên vừa có tính oxi hoá vừa có tính khử.\n' +
      '  1. Tính oxi hoá: Tác dụng với kim loại tạo muối sulfide: Fe + S → FeS (t °C); tác dụng với thuỷ ngân ngay ở nhiệt độ thường (dùng để thu gom thuỷ ngân rơi vãi): Hg + S → HgS.\n' +
      '  2. Tính khử: Tác dụng với chất oxi hoá mạnh (như O₂): S + O₂ → SO₂ (t °C).\n\n' +
      'SULFUR DIOXIDE (SO₂):\n' +
      '— Tính chất vật lí: Khí không màu, mùi hắc, nặng hơn không khí, độc, tan nhiều trong nước, tạo dung dịch acid yếu là sulfurous acid (H₂SO₃).\n' +
      '— Tính chất hoá học:\n' +
      '  1. Là acidic oxide: Tác dụng với dung dịch base tạo muối sulfite/hydrogen sulfite.\n' +
      '  2. Tính khử (SO₂ phản ứng với chất oxi hoá mạnh): Làm mất màu nước Bromine: SO₂ + Br₂ + 2H₂O → H₂SO₄ + 2HBr (ứng dụng nhận biết SO₂).\n' +
      '  3. Tính oxi hoá (SO₂ phản ứng với chất khử mạnh): SO₂ + 2H₂S → 3S↓ + 2H₂O (tạo lưu huỳnh kết tủa màu vàng).',
    workedExample: {
      problem:
        'Viết phương trình hoá học thể hiện tính khử của khí sulfur dioxide (SO₂) khi sục khí này vào dung dịch nước bromine (Br₂).',
      steps: [
        'Xác định chất phản ứng: SO₂ (chất khử), Br₂ (chất oxi hoá), H₂O.',
        'Xác định sản phẩm: Sulfur bị oxi hoá từ +4 lên +6 (H₂SO₄); Bromine bị khử từ 0 xuống −1 (HBr).',
        'Viết phương trình phản ứng: SO₂ + Br₂ + 2H₂O → H₂SO₄ + 2HBr.',
        'Kiểm tra cân bằng nguyên tố: vế trái có 4 H, vế phải có 2 + 2 = 4 H. Đã cân bằng.',
      ],
      answer: 'SO2 + Br2 + 2H2O -> H2SO4 + 2HBr',
    },
    checkQuestions: [
      {
        prompt:
          'Khi nhiệt kế vỡ, người ta rắc bột sulfur lên thuỷ ngân (Hg) rơi vãi để thu gom. Cách làm này dựa vào phản ứng nào xảy ra ngay ở nhiệt độ thường?',
        choices: [
          { id: 'a', label: 'Hg + S → HgS' },
          { id: 'b', label: '2Hg + O₂ → 2HgO' },
          { id: 'c', label: 'Hg + Cl₂ → HgCl₂' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Sulfur phản ứng ngay với thuỷ ngân ở nhiệt độ thường tạo HgS — chất rắn không bay hơi nên hết nguy cơ hít phải hơi thuỷ ngân, lại dễ quét dọn. Hai phản ứng còn lại đều cần đốt nóng hoặc cần khí chlorine, không dùng được để xử lý sự cố.',
      },
      {
        prompt: 'Khí SO₂ làm mất màu dung dịch nào sau đây nhờ tính khử của nó?',
        choices: [
          { id: 'brom', label: 'Dung dịch nước Bromine (Br₂)' },
          { id: 'hcl', label: 'Dung dịch HCl' },
          { id: 'nacl', label: 'Dung dịch NaCl' },
        ],
        answer: { kind: 'choice', correctIds: ['brom'] },
        explain:
          'SO₂ có tính khử mạnh, phản ứng với nước bromine làm mất màu nâu đỏ của bromine: SO₂ + Br₂ + 2H₂O → H₂SO₄ + 2HBr.',
      },
    ],
    srsCards: [
      {
        hoi: 'Lưu huỳnh thể hiện tính oxi hoá khi phản ứng với chất nào?',
        dap: 'Khi phản ứng với kim loại (như Fe, Zn, Hg) và hydrogen.',
      },
      {
        hoi: 'Chất nào dùng để xử lý sự cố tràn thuỷ ngân?',
        dap: 'Bột lưu huỳnh (S) vì phản ứng xảy ra ngay ở nhiệt độ thường tạo muối HgS kết tủa.',
      },
      {
        hoi: 'Hiện tượng khi sục khí SO₂ vào nước bromine?',
        dap: 'Dung dịch bromine bị mất màu nâu đỏ.',
      },
    ],
    animation: {
      title: 'Số oxi hoá +4 của SO₂ nằm giữa: vừa là chất khử, vừa là chất oxi hoá',
      description:
        'Một trục ngang xếp các số oxi hoá của sulfur: −2 ở H₂S, 0 ở S đơn chất, +4 ở SO₂ và +6 ở H₂SO₄. Chấm sáng dừng ở vị trí +4 của SO₂ — nó không ở đầu trục cũng không ở cuối trục. Từ đó hai mũi tên toả ra hai phía. Mũi tên sang phải: SO₂ nhường thêm electron, lên +6, ví dụ SO₂ làm mất màu nước bromine tạo H₂SO₄ — lúc này SO₂ đóng vai chất khử. Mũi tên sang trái: SO₂ nhận electron, tụt về 0, ví dụ SO₂ tác dụng H₂S tạo S màu vàng — lúc này SO₂ là chất oxi hoá. Quy tắc rút ra: số oxi hoá trung gian thì đi được cả hai chiều, số oxi hoá cao nhất hoặc thấp nhất thì chỉ đi được một chiều.',
      viewBoxWidth: 460,
      viewBoxHeight: 210,
      durationMs: 8000,
      loop: true,
      shapes: [
        {
          kind: 'arrow',
          id: 'truc',
          x1: 40,
          y1: 110,
          x2: 430,
          y2: 110,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 't1',
          x1: 90,
          y1: 102,
          x2: 90,
          y2: 118,
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'line',
          id: 't2',
          x1: 190,
          y1: 102,
          x2: 190,
          y2: 118,
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'line',
          id: 't3',
          x1: 290,
          y1: 102,
          x2: 290,
          y2: 118,
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'line',
          id: 't4',
          x1: 390,
          y1: 102,
          x2: 390,
          y2: 118,
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'label',
          id: 'l1',
          x: 90,
          y: 134,
          text: '−2',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'l2',
          x: 190,
          y: 134,
          text: '0',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'l3',
          x: 290,
          y: 134,
          text: '+4',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'l4',
          x: 390,
          y: 134,
          text: '+6',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'c1',
          x: 90,
          y: 152,
          text: 'H₂S',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'c2',
          x: 190,
          y: 152,
          text: 'S',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'c3',
          x: 290,
          y: 152,
          text: 'SO₂',
          size: 11,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'c4',
          x: 390,
          y: 152,
          text: 'H₂SO₄',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'circle',
          id: 'cham',
          cx: 290,
          cy: 110,
          r: 8,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
            },
            {
              atMs: 2000,
              dx: 0,
            },
            {
              atMs: 3200,
              dx: 100,
            },
            {
              atMs: 4200,
              dx: 0,
            },
            {
              atMs: 5800,
              dx: -100,
            },
            {
              atMs: 7000,
              dx: 0,
            },
            {
              atMs: 8000,
              dx: 0,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'ph',
          x1: 300,
          y1: 78,
          x2: 384,
          y2: 78,
          stroke: 'accent',
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
          id: 'pht',
          x: 300,
          y: 66,
          text: 'SO₂ là chất khử',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2000, opacity: 0 },
            { atMs: 2400, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'phv',
          x: 342,
          y: 48,
          text: 'SO₂ + Br₂ + 2H₂O → H₂SO₄ + 2HBr',
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
          kind: 'arrow',
          id: 'tr',
          x1: 280,
          y1: 78,
          x2: 196,
          y2: 78,
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4600,
              opacity: 0,
            },
            {
              atMs: 5000,
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
          id: 'trt',
          x: 280,
          y: 66,
          text: 'SO₂ là chất oxi hoá',
          size: 11,
          anchor: 'end',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4600, opacity: 0 },
            { atMs: 5000, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'trv',
          x: 190,
          y: 30,
          text: 'SO₂ + 2H₂S → 3S↓ + 2H₂O',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5200, opacity: 0 },
            { atMs: 5600, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'kl',
          x: 235,
          y: 184,
          text: 'Số oxi hoá trung gian đi được cả hai chiều',
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
              atMs: 6600,
              opacity: 0,
            },
            {
              atMs: 7100,
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
          text: 'Sulfur trong SO₂ có số oxi hoá +4 — nằm giữa dãy −2, 0, +4, +6.',
        },
        {
          atMs: 2200,
          text: 'Lên +6: SO₂ nhường electron, làm mất màu nước bromine — SO₂ là chất khử.',
        },
        {
          atMs: 4800,
          text: 'Về 0: SO₂ nhận electron từ H₂S tạo sulfur vàng — SO₂ là chất oxi hoá.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c2-b8',
    grade: '11',
    chapterNumber: 2,
    chapterTitle: 'Nitrogen - Sulfur',
    lessonNumber: 8,
    title: 'Sulfuric acid và muối sulfate',
    hook:
      'Sulfuric acid (H₂SO₄) đậm đặc háo nước đến mức có thể "hút" nước từ phân tử đường ăn (sucrose), ' +
      'biến đống đường trắng tinh thành một cột than đen xì bốc khói nóng bỏng.',
    theory:
      'SULFURIC ACID (H₂SO₄):\n' +
      '— Dung dịch loãng: Mang đầy đủ tính chất chung của acid mạnh (đổi màu quỳ tím sang đỏ; tác dụng với kim loại đứng trước hydrogen, giải phóng H₂; tác dụng với base, basic oxide, muối).\n' +
      '— Dung dịch đặc (tính chất riêng):\n' +
      '  1. Tính oxi hoá cực mạnh (do S⁺⁶ ở số oxi hoá cao nhất): Tác dụng hầu hết kim loại (trừ Au, Pt) giải phóng sản phẩm khử như SO₂, S, H₂S; không tạo khí H₂. Thụ động hoá Al, Fe, Cr trong H₂SO₄ đặc, nguội.\n' +
      '  2. Tính háo nước mạnh: Chiếm nước từ chất hữu cơ (như tinh bột, đường...) làm chất đó hoá đen (hoá than). Khi pha loãng, phải rót TỪ TỪ acid đặc vào nước dọc theo đũa thuỷ tinh và khuấy đều; KHÔNG được làm ngược lại, vì nước sẽ sôi bùng và bắn acid ra ngoài gây bỏng nặng.\n\n' +
      'MUỐI SULFATE VÀ NHẬN BIẾT ION SULFATE (SO₄²⁻):\n' +
      '— Hầu hết muối sulfate đều dễ tan. Ngoại lệ: BaSO₄ và PbSO₄ không tan (BaSO₄ là kết tủa trắng, không tan cả trong acid mạnh); CaSO₄ và Ag₂SO₄ ít tan.\n' +
      '— Nhận biết ion SO₄²⁻: Dùng ion Ba²⁺ (từ dung dịch BaCl₂ hoặc Ba(OH)₂), phản ứng tạo kết tủa trắng BaSO₄ không tan trong acid mạnh: Ba²⁺ + SO₄²⁻ → BaSO₄↓.',
    workedExample: {
      problem: 'Trình bày cách pha loãng dung dịch H₂SO₄ đặc an toàn trong phòng thí nghiệm.',
      steps: [
        'Chuẩn bị một cốc nước cất.',
        'Rót từ từ, từng chút một, acid H₂SO₄ đặc dọc theo đũa thuỷ tinh vào cốc nước.',
        'Khuấy nhẹ đều dung dịch bằng đũa thuỷ tinh.',
        'Lưu ý tuyệt đối: KHÔNG được rót nước vào acid đặc. Quá trình hoà tan toả rất nhiều nhiệt, làm nước sôi đột ngột và bắn các giọt acid đặc ra ngoài, gây bỏng rất nguy hiểm.',
      ],
      answer: 'Rót từ từ acid đặc vào nước',
    },
    checkQuestions: [
      {
        prompt:
          'Để nhận biết ion sulfate (SO₄²⁻) trong dung dịch, người ta sử dụng dung dịch chứa ion nào sau đây?',
        choices: [
          { id: 'ba', label: 'Barium (Ba²⁺)' },
          { id: 'na', label: 'Sodium (Na⁺)' },
          { id: 'cl', label: 'Chloride (Cl⁻)' },
          { id: 'no3', label: 'Nitrate (NO₃⁻)' },
        ],
        answer: { kind: 'choice', correctIds: ['ba'] },
        explain:
          'Dùng Ba²⁺ (như dung dịch BaCl₂) để tạo kết tủa trắng BaSO₄ không tan trong acid mạnh: Ba²⁺ + SO₄²⁻ → BaSO₄↓. Na⁺, Cl⁻ và NO₃⁻ đều không tạo kết tủa với SO₄²⁻.',
      },
      {
        prompt:
          'Kim loại nào sau đây bị THỤ ĐỘNG HOÁ (không phản ứng) trong dung dịch H₂SO₄ đặc, nguội?',
        choices: [
          { id: 'cu', label: 'Copper (Cu)' },
          { id: 'zn', label: 'Zinc (Zn)' },
          { id: 'fe', label: 'Iron (Fe)' },
          { id: 'mg', label: 'Magnesium (Mg)' },
        ],
        answer: { kind: 'choice', correctIds: ['fe'] },
        explain:
          'Sắt (Fe), nhôm (Al) và chromium (Cr) bị thụ động hoá trong nitric acid đặc, nguội và sulfuric acid đặc, nguội: bề mặt kim loại phủ một lớp oxide bền, che kín không cho phản ứng tiếp. Cu, Zn, Mg không có lớp bảo vệ này.',
      },
    ],
    srsCards: [
      {
        hoi: 'Quy tắc pha loãng H₂SO₄ đặc an toàn?',
        dap: 'Rót từ từ acid đặc vào nước, tuyệt đối không làm ngược lại.',
      },
      {
        hoi: 'Tính chất đặc trưng của H₂SO₄ đặc là gì?',
        dap: 'Tính oxi hoá cực mạnh và tính háo nước mạnh.',
      },
      {
        hoi: 'Thuốc thử và hiện tượng nhận biết ion SO₄²⁻?',
        dap: 'Dung dịch chứa ion Ba²⁺ (như BaCl₂), tạo kết tủa trắng BaSO₄ không tan trong acid.',
      },
    ],
    animation: {
      title: 'Pha loãng sulfuric acid đặc: rót acid vào nước, không bao giờ làm ngược lại',
      description:
        'Hai cốc đặt cạnh nhau cho hai cách làm. Bên trái là cách đúng: cốc đã có sẵn nước, dòng H₂SO₄ đặc được rót từ từ theo đũa thuỷ tinh xuống; acid nặng hơn nên chìm xuống đáy, nhiệt toả ra phân tán vào cả khối nước lớn nên nhiệt độ chỉ tăng từ từ và an toàn. Bên phải là cách sai: cốc đã có sẵn acid đặc, nước nhẹ hơn nên nổi thành một lớp mỏng trên mặt acid; toàn bộ nhiệt hydrat hoá dồn vào lớp nước mỏng đó, nước sôi bùng ngay tại chỗ và bắn tung acid ra ngoài — các chấm bắn vọt lên trong hình. Quy tắc để nhớ: nước trước, acid sau, rót chậm và khuấy đều.',
      viewBoxWidth: 460,
      viewBoxHeight: 230,
      durationMs: 7000,
      loop: true,
      shapes: [
        {
          kind: 'polyline',
          id: 'coc1',
          points: [
            [50, 110],
            [50, 206],
            [50.5, 208],
            [52, 209.5],
            [54, 210],
            [166, 210],
            [168, 209.5],
            [169.5, 208],
            [170, 206],
            [170, 110],
          ],
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'rect',
          id: 'nuoc1',
          x: 54,
          y: 140,
          w: 112,
          h: 66,
          fill: 'primary',
          rx: 2,
          opacity: 0.35,
        },
        {
          kind: 'label',
          id: 'coc1t',
          x: 110,
          y: 226,
          text: 'ĐÚNG: rót acid vào nước',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nuoc1t',
          x: 110,
          y: 178,
          text: 'nước',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'circle',
          id: 'acid1',
          cx: 132,
          cy: 64,
          r: 6,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 0 },
            { atMs: 400, opacity: 1 },
            { atMs: 1800, dx: -11, dy: 82 },
            { atMs: 2800, dx: -14, dy: 132 },
            { atMs: 3000, opacity: 1 },
            { atMs: 3300, opacity: 0 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'acid1t',
          x: 110,
          y: 50,
          text: 'H₂SO₄ đặc, rót từ từ',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'line',
          id: 'dua',
          x1: 132,
          y1: 60,
          x2: 120,
          y2: 150,
          stroke: 'muted',
          strokeWidth: 3,
        },
        {
          kind: 'polyline',
          id: 'coc2',
          points: [
            [290, 110],
            [290, 206],
            [290.5, 208],
            [292, 209.5],
            [294, 210],
            [406, 210],
            [408, 209.5],
            [409.5, 208],
            [410, 206],
            [410, 110],
          ],
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'rect',
          id: 'acid2',
          x: 294,
          y: 140,
          w: 112,
          h: 66,
          fill: 'accent',
          rx: 2,
          opacity: 0.35,
        },
        {
          kind: 'rect',
          id: 'lop-nuoc',
          x: 294,
          y: 134,
          w: 112,
          h: 6,
          fill: 'primary',
          rx: 1,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2600, opacity: 0 },
            { atMs: 3000, opacity: 0.7 },
            { atMs: 7000, opacity: 0.7 },
          ],
        },
        {
          kind: 'label',
          id: 'coc2t',
          x: 350,
          y: 226,
          text: 'SAI: đổ nước vào acid đặc',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'acid2t',
          x: 350,
          y: 178,
          text: 'H₂SO₄ đặc',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'circle',
          id: 'nuoc2',
          cx: 350,
          cy: 76,
          r: 8,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dy: 0,
              opacity: 0,
            },
            {
              atMs: 600,
              dy: 0,
              opacity: 1,
            },
            {
              atMs: 2600,
              dy: 62,
              opacity: 1,
            },
            {
              atMs: 3000,
              dy: 62,
              opacity: 0,
            },
            {
              atMs: 7000,
              dy: 62,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'ban1',
          cx: 318,
          cy: 138,
          r: 5,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 0, dy: 0 },
            { atMs: 2900, opacity: 0 },
            { atMs: 3000, opacity: 1 },
            { atMs: 4400, dx: -30, dy: -50 },
            { atMs: 6400, opacity: 1 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'ban2',
          cx: 350,
          cy: 138,
          r: 5,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 0, dy: 0 },
            { atMs: 2900, opacity: 0 },
            { atMs: 3000, opacity: 1 },
            { atMs: 4400, dx: 6, dy: -62 },
            { atMs: 6400, opacity: 1 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'ban3',
          cx: 382,
          cy: 138,
          r: 5,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 0, dy: 0 },
            { atMs: 2900, opacity: 0 },
            { atMs: 3000, opacity: 1 },
            { atMs: 4400, dx: 36, dy: -46 },
            { atMs: 6400, opacity: 1 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'nong',
          x: 350,
          y: 60,
          text: 'nước sôi bùng, bắn acid ra ngoài',
          size: 10,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3400,
              opacity: 0,
            },
            {
              atMs: 3900,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'quy',
          x: 230,
          y: 26,
          text: 'Nước trước — acid sau — rót chậm — khuấy đều',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'H₂SO₄ đặc tan trong nước toả rất nhiều nhiệt.',
        },
        {
          atMs: 1400,
          text: 'Rót acid vào nước: acid chìm xuống, nhiệt phân tán trong cả khối nước.',
        },
        {
          atMs: 3400,
          text: 'Đổ nước vào acid: nhiệt dồn vào lớp nước mỏng trên mặt, sôi bùng và bắn acid.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c2-b9',
    grade: '11',
    chapterNumber: 2,
    chapterTitle: 'Nitrogen - Sulfur',
    lessonNumber: 9,
    title: 'Ôn tập chương 2 — Nitrogen - Sulfur',
    hook:
      'Chương 2 giới thiệu hai phi kim rất quan trọng: nitrogen và sulfur. ' +
      'Các hợp chất của chúng chi phối cả nông nghiệp và công nghiệp nặng.',
    theory:
      'HỆ THỐNG HOÁ KIẾN THỨC CHƯƠNG 2:\n' +
      '1. Nitrogen (N₂): trơ ở nhiệt độ thường do liên kết ba N≡N. Có cả tính khử và tính oxi hoá.\n' +
      '2. Ammonia (NH₃): phân tử phân cực, có tính base yếu và tính khử. Muối ammonium kém bền nhiệt, giải phóng NH₃ khi đun nóng với kiềm.\n' +
      '3. Nitric acid (HNO₃): acid mạnh, chất oxi hoá cực mạnh. Oxi hoá hầu hết kim loại lên hoá trị cao nhất mà không tạo H₂.\n' +
      '4. Mưa acid: do khí SO₂ và NOx tan trong nước mưa gây ra.\n' +
      '5. Sulfur (S): vừa có tính oxi hoá vừa có tính khử. SO₂ là acidic oxide, có tính khử (mất màu nước bromine) và tính oxi hoá (phản ứng với H₂S tạo S vàng).\n' +
      '6. Sulfuric acid (H₂SO₄): đặc có tính oxi hoá mạnh và háo nước mạnh. Nhận biết ion SO₄²⁻ bằng kết tủa trắng BaSO₄.',
    workedExample: {
      problem:
        'Sục khí SO₂ vào dung dịch Ba(OH)₂ dư. Cho biết hiện tượng xảy ra và viết phương trình ion rút gọn.',
      steps: [
        'Vì Ba(OH)₂ dư nên SO₂ tạo muối trung hoà là BaSO₃, không tạo muối hydrogen sulfite.',
        'Phương trình phản ứng: SO₂ + Ba(OH)₂ → BaSO₃↓ + H₂O.',
        'Hiện tượng: xuất hiện kết tủa trắng (Barium sulfite, BaSO₃).',
        'Phương trình ion rút gọn: SO₂ + Ba²⁺ + 2OH⁻ → BaSO₃↓ + H₂O.',
      ],
      answer: 'Ba2+ + 2OH- + SO2 -> BaSO3 + H2O',
    },
    checkQuestions: [
      {
        prompt: 'Hợp chất nào sau đây của nitrogen thể hiện tính base yếu?',
        choices: [
          { id: 'nh3', label: 'NH₃ (Ammonia)' },
          { id: 'hno3', label: 'HNO₃ (nitric acid)' },
          { id: 'nh4cl', label: 'NH₄Cl (Ammonium chloride)' },
          { id: 'no2', label: 'NO₂' },
        ],
        answer: { kind: 'choice', correctIds: ['nh3'] },
        explain:
          'NH₃ tan trong nước phân li ra ion OH⁻ thể hiện tính base yếu: NH₃ + H₂O ⇌ NH₄⁺ + OH⁻.',
      },
      {
        prompt: 'Để nhận biết muối chứa ion SO₄²⁻ trong các mẫu thử, ta nhỏ dung dịch nào sau đây?',
        choices: [
          { id: 'bacl2', label: 'BaCl₂' },
          { id: 'nacl', label: 'NaCl' },
          { id: 'hcl', label: 'HCl' },
          { id: 'nano3', label: 'NaNO₃' },
        ],
        answer: { kind: 'choice', correctIds: ['bacl2'] },
        explain:
          'BaCl₂ phân li ra ion Ba²⁺; ion này kết hợp với SO₄²⁻ tạo kết tủa trắng BaSO₄ không tan trong acid. NaCl, HCl và NaNO₃ đều không tạo kết tủa với SO₄²⁻.',
      },
    ],
    srsCards: [
      {
        hoi: 'Khí không màu hoá nâu ngoài không khí khi tác dụng với O₂?',
        dap: 'Khí nitric oxide (NO).',
      },
      { hoi: 'Khí có mùi hắc làm mất màu dung dịch bromine?', dap: 'Khí sulfur dioxide (SO₂).' },
      {
        hoi: 'Kim loại Fe phản ứng với H₂SO₄ đặc nóng tạo khí gì?',
        dap: 'Khí sulfur dioxide (SO₂).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
