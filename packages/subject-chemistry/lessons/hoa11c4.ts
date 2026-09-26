// lessons/hoa11c4.ts — Hoá học 11, Chương 4: Hydrocarbon (4 bài).
// Đối chiếu mục lục thật: tai-lieu-sgk/SGK-Hoa/11/page_0005.png (OCR 2026-08-31).
// reviewStatus='draft' — soạn từ docs/research/kho-kien-thuc-hoa-gdpt2018.md §3, chưa duyệt.
import type { ChemLesson } from '../lessonTypes.js'

export const HOA11_C4_LESSONS: ChemLesson[] = [
  {
    id: 'hoa11-c4-b15',
    grade: '11',
    chapterNumber: 4,
    chapterTitle: 'Hydrocarbon',
    lessonNumber: 15,
    title: 'Alkane',
    hook:
      'Khí gas nấu ăn hằng ngày chứa propane và butane. Xăng chạy xe máy chứa chủ yếu hexane và octane. ' +
      'Tất cả chúng đều thuộc dòng hydrocarbon no được gọi là alkane.',
    theory:
      'KHÁI NIỆM VÀ ĐỒNG PHÂN:\n' +
      '— Alkane là các hydrocarbon no, mạch hở, chỉ có liên kết đơn C−C và C−H trong phân tử.\n' +
      '— Công thức chung: CₙH₂ₙ₊₂ (n ≥ 1).\n' +
      '— Đồng phân: Từ C₄H₁₀ trở đi có đồng phân mạch carbon (mạch thẳng và mạch phân nhánh).\n\n' +
      'DANH PHÁP (Tên thay thế theo IUPAC):\n' +
      '— Tên 10 alkane mạch thẳng đầu tiên: Methane (C1), Ethane (C2), Propane (C3), Butane (C4), Pentane (C5), Hexane (C6), Heptane (C7), Octane (C8), Nonane (C9), Decane (C10).\n' +
      '— Nguyên tắc gọi tên alkane mạch nhánh: Chọn mạch dài nhất làm mạch chính → Đánh số C mạch chính từ đầu gần nhánh hơn → Đọc tên: [Vị trí nhánh]-[Tên nhánh][Tên alkane mạch chính].\n\n' +
      'TÍNH CHẤT HOÁ HỌC:\n' +
      'Alkane khá trơ về mặt hoá học, phản ứng đặc trưng là phản ứng thế.\n' +
      '1. Phản ứng thế halogen (clo hoá, brom hoá): Nguyên tử H ở carbon bậc cao hơn dễ bị thế hơn nguyên tử H ở carbon bậc thấp.\n' +
      '   Ví dụ: CH₄ + Cl₂ → CH₃Cl + HCl (chiếu sáng).\n' +
      '2. Phản ứng tách (cracking và reforming): Cracking bẻ gãy liên kết C−C tạo alkane và alkene ngắn hơn; reforming chuyển alkane mạch thẳng thành mạch nhánh hoặc vòng.\n' +
      '3. Phản ứng oxi hoá (đốt cháy): Phản ứng toả nhiều nhiệt, luôn sinh ra nCO₂ < nH₂O: CₙH₂ₙ₊₂ + (3n+1)/2 O₂ → n CO₂ + (n+1) H₂O.',
    workedExample: {
      problem:
        'Khi cho propane (CH₃-CH₂-CH₃) tác dụng với chlorine (tỉ lệ mol 1:1, chiếu sáng) thu được sản phẩm thế ' +
        'monochlorine chính là chất nào? Giải thích.',
      steps: [
        'Propane có 2 loại nguyên tử Carbon khác nhau: 2 nhóm −CH₃ ở hai đầu (C bậc I) và 1 nhóm −CH₂− ở giữa (C bậc II).',
        'Phản ứng thế halogen ưu tiên xảy ra ở carbon có bậc cao hơn (nơi liên kết C−H yếu hơn, dễ bị bẻ gãy hơn).',
        'Vì vậy, nguyên tử Cl sẽ ưu tiên thế vào nguyên tử H của carbon bậc II ở giữa mạch.',
        'Sản phẩm chính thu được là 2-chloropropane (CH₃-CHCl-CH₃).',
      ],
      answer: '2-chloropropane',
    },
    checkQuestions: [
      {
        prompt: 'Công thức chung của dãy đồng đẳng alkane là gì?',
        choices: [
          { id: 'cnh2n', label: 'CₙH₂ₙ (n ≥ 2)' },
          { id: 'cnh2n_2', label: 'CₙH₂ₙ₋₂ (n ≥ 2)' },
          { id: 'cnh2n_2_plus', label: 'CₙH₂ₙ₊₂ (n ≥ 1)' },
          { id: 'cnh2n_6', label: 'CₙH₂ₙ₋₆ (n ≥ 6)' },
        ],
        answer: { kind: 'choice', correctIds: ['cnh2n_2_plus'] },
        explain: 'Alkane là hydrocarbon no mạch hở có công thức chung CₙH₂ₙ₊₂ với n ≥ 1.',
      },
      {
        prompt: 'Alkane mạch thẳng có 4 nguyên tử Carbon trong phân tử (C₄H₁₀) có tên gọi là gì?',
        choices: [
          { id: 'propane', label: 'Propane' },
          { id: 'butane', label: 'Butane' },
          { id: 'pentane', label: 'Pentane' },
          { id: 'ethane', label: 'Ethane' },
        ],
        answer: { kind: 'choice', correctIds: ['butane'] },
        explain:
          'Theo danh pháp thay thế, alkane mạch thẳng 1C là methane, 2C là ethane, 3C là propane, 4C là butane.',
      },
    ],
    srsCards: [
      { hoi: 'Alkane là gì?', dap: 'Hydrocarbon no, mạch hở, chỉ có liên kết đơn C−C và C−H.' },
      {
        hoi: 'Phản ứng hoá học đặc trưng của alkane là gì?',
        dap: 'Phản ứng thế halogen (chlorine, bromine) dưới ánh sáng.',
      },
      {
        hoi: 'Quy luật thế halogen vào alkane?',
        dap: 'Ưu tiên thế nguyên tử H ở carbon bậc cao hơn (tạo sản phẩm chính).',
      },
    ],
    animation: {
      title: 'Cơ chế thế gốc tự do: methane phản ứng với chlorine theo ba giai đoạn',
      description:
        'Giai đoạn 1 — khơi mào: ánh sáng chiếu vào phân tử Cl₂ làm liên kết Cl–Cl đứt đối xứng, sinh ra hai gốc tự do Cl• mỗi gốc mang một electron độc thân. Giai đoạn 2 — phát triển mạch, gồm hai bước nối đuôi nhau: gốc Cl• giật một nguyên tử H khỏi CH₄ tạo HCl và gốc CH₃•; rồi gốc CH₃• lao vào phân tử Cl₂ tạo CH₃Cl và sinh lại một gốc Cl• mới. Chính gốc Cl• tái sinh đó quay về đầu giai đoạn 2 và lặp lại vòng, nên một gốc ban đầu có thể tạo hàng nghìn phân tử sản phẩm. Giai đoạn 3 — tắt mạch: hai gốc tự do gặp nhau và kết hợp, chuỗi dừng lại. Điểm dễ nhầm mà hình làm rõ: chlorine THẾ chỗ hydrogen chứ không cộng vào methane, vì methane đã bão hoà.',
      viewBoxWidth: 470,
      viewBoxHeight: 250,
      durationMs: 9000,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'g1',
          x: 30,
          y: 30,
          text: '1. Khơi mào',
          size: 12,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'cl2',
          x: 120,
          y: 58,
          text: 'Cl–Cl',
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'arrow',
          id: 'as',
          x1: 50,
          y1: 58,
          x2: 92,
          y2: 58,
          stroke: 'accent',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'ast',
          x: 66,
          y: 46,
          text: 'ánh sáng',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'arrow',
          id: 'm1',
          x1: 156,
          y1: 58,
          x2: 206,
          y2: 58,
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
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'r1',
          x: 250,
          y: 58,
          text: '2 Cl•',
          size: 14,
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
              atMs: 1600,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'g2',
          x: 30,
          y: 100,
          text: '2. Phát triển mạch',
          size: 12,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'b1',
          x: 40,
          y: 130,
          text: 'Cl• + CH₄',
          size: 13,
          anchor: 'start',
          fill: 'neutral',
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
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'm2',
          x1: 130,
          y1: 126,
          x2: 176,
          y2: 126,
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2400,
              opacity: 0,
            },
            {
              atMs: 2800,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'b1k',
          x: 186,
          y: 130,
          text: 'HCl + CH₃•',
          size: 13,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2800,
              opacity: 0,
            },
            {
              atMs: 3200,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'b2',
          x: 40,
          y: 164,
          text: 'CH₃• + Cl₂',
          size: 13,
          anchor: 'start',
          fill: 'neutral',
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
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'm3',
          x1: 130,
          y1: 160,
          x2: 176,
          y2: 160,
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
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'b2k',
          x: 186,
          y: 164,
          text: 'CH₃Cl + Cl•',
          size: 13,
          anchor: 'start',
          fill: 'primary',
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
              atMs: 4800,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'vong',
          points: [
            [255, 170],
            [255, 180],
            [22, 180],
            [22, 125],
          ],
          stroke: 'accent',
          strokeWidth: 2,
          dash: '4 3',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5000, opacity: 0 },
            { atMs: 5400, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'vong-mui',
          x1: 22,
          y1: 125,
          x2: 36,
          y2: 125,
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5000, opacity: 0 },
            { atMs: 5400, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'vongt',
          x: 285,
          y: 146,
          text: 'gốc Cl• tái sinh quay về đầu bước 2',
          size: 10,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5000, opacity: 0 },
            { atMs: 5400, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'goc',
          cx: 255,
          cy: 170,
          r: 6,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 0, dy: 0 },
            { atMs: 5000, opacity: 0 },
            { atMs: 5200, opacity: 1 },
            { atMs: 5500, dy: 10 },
            { atMs: 6400, dx: -233 },
            { atMs: 6900, dy: -55 },
            { atMs: 7200, dx: -219 },
            { atMs: 7400, opacity: 0 },
            { atMs: 9000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'g3',
          x: 30,
          y: 206,
          text: '3. Tắt mạch',
          size: 12,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'b3',
          x: 40,
          y: 234,
          text: 'CH₃• + Cl• → CH₃Cl',
          size: 13,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 7400,
              opacity: 0,
            },
            {
              atMs: 7900,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'luu',
          x: 300,
          y: 234,
          text: 'CH₄ bão hoà nên chlorine THẾ H, không cộng',
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
              atMs: 7900,
              opacity: 0,
            },
            {
              atMs: 8400,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
      ],
      captions: [
        { atMs: 0, text: 'Ánh sáng bẻ Cl₂ thành hai gốc tự do Cl• — giai đoạn khơi mào.' },
        { atMs: 2000, text: 'Cl• giật H khỏi CH₄ tạo HCl và gốc CH₃•.' },
        { atMs: 3600, text: 'CH₃• lấy một Cl từ Cl₂ tạo CH₃Cl và sinh lại Cl•.' },
        {
          atMs: 5400,
          text: 'Gốc Cl• tái sinh quay về đầu giai đoạn 2: một gốc tạo ra hàng nghìn phân tử.',
        },
        { atMs: 7400, text: 'Hai gốc gặp nhau thì chuỗi tắt. Cả quá trình là phản ứng THẾ.' },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c4-b16',
    grade: '11',
    chapterNumber: 4,
    chapterTitle: 'Hydrocarbon',
    lessonNumber: 16,
    title: 'Hydrocarbon không no',
    hook:
      'Khí ethylene là một hormone thực vật tự nhiên giúp thúc quả chín nhanh. Trái cây xanh xếp cùng ' +
      'vài quả chín sẽ chín nhanh hơn nhờ khí ethylene giải phóng ra.',
    theory:
      'KHÁI NIỆM PHÂN LOẠI:\n' +
      '— Alkene: hydrocarbon không no, mạch hở, có 1 liên kết đôi C=C. Công thức chung: CₙH₂ₙ (n ≥ 2).\n' +
      '— Alkyne: hydrocarbon không no, mạch hở, có 1 liên kết ba C≡C. Công thức chung: CₙH₂ₙ₋₂ (n ≥ 2).\n\n' +
      'TÍNH CHẤT HOÁ HỌC (Đặc trưng là phản ứng cộng):\n' +
      'Do có liên kết pi (π) kém bền trong liên kết đôi hoặc liên kết ba, chúng dễ tham gia phản ứng cộng để đạt trạng thái no bền vững hơn.\n' +
      '1. Phản ứng cộng H₂, X₂ (nước Bromine):\n' +
      '   — Alkene và alkyne làm MẤT MÀU nước bromine ngay ở điều kiện thường (dùng để nhận biết hydrocarbon không no).\n' +
      '2. Phản ứng cộng HX, H₂O (quy tắc Markovnikov):\n' +
      '   — Phát biểu: Khi cộng tác nhân bất đối xứng (như HCl, H₂O) vào alkene bất đối xứng, phần mang điện dương (như H⁺) ưu tiên cộng vào carbon mang liên kết đôi có nhiều H hơn (bậc thấp hơn), phần mang điện âm (như Cl⁻, OH⁻) ưu tiên cộng vào carbon có ít H hơn (bậc cao hơn).\n' +
      '3. Phản ứng trùng hợp (đối với alkene):\n' +
      '   — Nhiều phân tử alkene nhỏ (monomer) kết hợp với nhau tạo phân tử polymer mạch rất dài dưới tác dụng của t°, p, xt.\n' +
      '   — Ví dụ trùng hợp ethylene: n CH₂=CH₂ → −(CH₂−CH₂)−ₙ (Polyethylene - nhựa PE).\n' +
      '4. Phản ứng oxi hoá bởi dung dịch KMnO₄:\n' +
      '   — Alkene và alkyne làm MẤT MÀU dung dịch thuốc tím KMnO₄ và tạo kết tủa đen MnO₂ (dùng nhận biết alkene/alkyne).\n' +
      '5. Phản ứng thế kim loại của alk-1-yne:\n' +
      '   — Các alkyne có liên kết ba đầu mạch (alk-1-yne như CH≡CH) phản ứng được với dung dịch AgNO₃ trong NH₃ tạo kết tủa màu vàng nhạt (bạc acetylide): CH≡CH + 2AgNO₃ + 2NH₃ → AgC≡CAg↓ + 2NH₄NO₃ (dùng nhận biết alk-1-yne).',
    workedExample: {
      problem:
        'Áp dụng quy tắc Markovnikov để xác định công thức cấu tạo của sản phẩm chính khi cho ' +
        'propene (CH₃-CH=CH₂) phản ứng cộng với hydrogen chloride (HCl).',
      steps: [
        'Propene là alkene bất đối xứng. Hai carbon mang liên kết đôi là C số 1 (CH₂ có 2 H) và C số 2 (CH có 1 H).',
        'Theo quy tắc Markovnikov, H⁺ của tác nhân HCl ưu tiên cộng vào C có nhiều H hơn (C số 1: CH₂), biến CH₂ thành CH₃.',
        'Nguyên tử Cl⁻ sẽ cộng vào C mang liên kết đôi có ít H hơn (C số 2: CH), biến CH thành CH-Cl.',
        'Kết quả thu được sản phẩm chính là: CH₃-CH(Cl)-CH₃ (2-chloropropane).',
      ],
      answer: 'CH3-CH(Cl)-CH3',
    },
    checkQuestions: [
      {
        prompt: 'Alkene và alkyne làm mất màu dung dịch chất nào sau đây ngay ở điều kiện thường?',
        choices: [
          { id: 'nacl', label: 'Dung dịch NaCl' },
          { id: 'brom', label: 'Dung dịch nước Bromine (Br₂)' },
          { id: 'hcl', label: 'Dung dịch HCl' },
          { id: 'naoh', label: 'Dung dịch NaOH' },
        ],
        answer: { kind: 'choice', correctIds: ['brom'] },
        explain:
          'Liên kết pi kém bền của alkene và alkyne dễ dàng cộng với bromine làm mất màu nâu đỏ của dung dịch bromine ở điều kiện thường.',
      },
      {
        prompt:
          'Chất nào sau đây tác dụng với dung dịch AgNO₃ trong NH₃ tạo ra kết tủa màu vàng nhạt?',
        choices: [
          { id: 'ch4', label: 'Methane (CH₄)' },
          { id: 'c2h4', label: 'Ethylene (C₂H₄)' },
          { id: 'c2h2', label: 'Acetylene (CH≡CH)' },
          { id: 'c2h6', label: 'Ethane (C₂H₆)' },
        ],
        answer: { kind: 'choice', correctIds: ['c2h2'] },
        explain:
          'Acetylene là alk-1-yne, nguyên tử H linh động đính ở carbon mang liên kết ba đầu mạch bị thế bởi ion bạc tạo kết tủa vàng nhạt AgC≡CAg.',
      },
      {
        // Câu BẪY: áp dụng NGƯỢC quy tắc Markovnikov (nhớ máy móc "nhóm lớn vào chỗ nào").
        prompt:
          'Cho but-1-ene (CH₂=CH–CH₂–CH₃) hợp nước (H₂O, xúc tác acid). Sản phẩm chính thu được ' +
          'là chất nào?',
        choices: [
          { id: 'butan1ol', label: 'Butan-1-ol: CH₂(OH)–CH₂–CH₂–CH₃' },
          { id: 'butan2ol', label: 'Butan-2-ol: CH₃–CH(OH)–CH₂–CH₃' },
          { id: 'ete', label: 'Diethyl ether: C₂H₅–O–C₂H₅' },
        ],
        answer: { kind: 'choice', correctIds: ['butan2ol'] },
        explain:
          'Bẫy là áp dụng ngược quy tắc Markovnikov. Hai carbon của liên kết đôi: C1 (CH₂, có 2 ' +
          'H) và C2 (CH, có 1 H). Phần mang điện dương H⁺ cộng vào C NHIỀU H hơn (C1), phần OH⁻ ' +
          'cộng vào C ÍT H hơn (C2) ⇒ nhóm −OH nằm ở C2, sản phẩm chính là butan-2-ol. Mẹo nhớ ' +
          'theo bản chất chứ đừng học vẹt: H⁺ vào trước tạo carbocation, mà carbocation ở C2 ' +
          '(bậc II) bền hơn ở C1 (bậc I) nên hướng đó chiếm ưu thế.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức chung của Alkene và Alkyne?',
        dap: 'Alkene: CₙH₂ₙ (n ≥ 2); Alkyne: CₙH₂ₙ₋₂ (n ≥ 2).',
      },
      {
        hoi: 'Quy tắc Markovnikov áp dụng khi nào?',
        dap: 'Cộng tác nhân bất đối xứng (HX, H₂O) vào alkene bất đối xứng: H vào C nhiều H hơn, X vào C ít H hơn.',
      },
      {
        hoi: 'Phản ứng dùng để nhận biết alk-1-yne?',
        dap: 'Tác dụng với AgNO₃/NH₃ tạo kết tủa màu vàng nhạt.',
      },
    ],
    animation: {
      title: 'Phản ứng cộng HCl vào propene theo quy tắc Markovnikov',
      description:
        'Bên trái là phân tử propene CH₃–CH=CH₂: hai vạch song song ở giữa là liên kết đôi, ' +
        'trong đó vạch phía trên là liên kết pi kém bền. Phân tử HCl tiến lại gần. Liên kết pi ' +
        'đứt ra (vạch trên biến mất), giải phóng hai vị trí liên kết mới: nguyên tử H gắn vào ' +
        'carbon ĐẦU MẠCH (carbon đang có nhiều hydrogen hơn), còn nguyên tử Cl gắn vào carbon ' +
        'giữa (carbon ít hydrogen hơn). Sản phẩm chính thu được là CH₃–CHCl–CH₃ ' +
        '(2-chloropropane). Lý do sâu xa của quy tắc Markovnikov: H⁺ cộng vào trước tạo ra ' +
        'carbocation, và carbocation bậc II ở carbon giữa bền hơn carbocation bậc I ở đầu mạch, ' +
        'nên hướng này chiếm ưu thế.',
      viewBoxWidth: 440,
      viewBoxHeight: 200,
      durationMs: 6000,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'c1',
          x: 90,
          y: 105,
          text: 'CH₃',
          size: 16,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'c2',
          x: 175,
          y: 105,
          text: 'CH',
          size: 16,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'c3',
          x: 260,
          y: 105,
          text: 'CH₂',
          size: 16,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'line',
          id: 'noi-12',
          x1: 112,
          y1: 100,
          x2: 155,
          y2: 100,
          stroke: 'neutral',
          strokeWidth: 2.5,
        },
        {
          kind: 'line',
          id: 'sigma',
          x1: 196,
          y1: 100,
          x2: 238,
          y2: 100,
          stroke: 'neutral',
          strokeWidth: 2.5,
        },
        {
          kind: 'line',
          id: 'pi',
          x1: 196,
          y1: 92,
          x2: 238,
          y2: 92,
          stroke: 'accent',
          strokeWidth: 2.5,
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 2200, opacity: 1 },
            { atMs: 2600, opacity: 0 },
            { atMs: 6000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'pi-t',
          x: 217,
          y: 80,
          text: 'liên kết pi kém bền',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 2400, opacity: 0 },
            { atMs: 6000, opacity: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'lk-h',
          x1: 262,
          y1: 110,
          x2: 262,
          y2: 129,
          stroke: 'neutral',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3200, opacity: 0 },
            { atMs: 3500, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'lk-cl',
          x1: 175,
          y1: 110,
          x2: 177,
          y2: 132,
          stroke: 'neutral',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3200, opacity: 0 },
            { atMs: 3500, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'h-cong',
          cx: 390,
          cy: 40,
          r: 11,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 2200, dx: -90, dy: 105 },
            { atMs: 3200, dx: -128, dy: 100 },
            { atMs: 6000, dx: -128, dy: 100 },
          ],
        },
        {
          kind: 'label',
          id: 'h-t',
          x: 390,
          y: 45,
          text: 'H',
          size: 13,
          anchor: 'middle',
          fill: 'surface',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 2200, dx: -90, dy: 105 },
            { atMs: 3200, dx: -128, dy: 100 },
            { atMs: 6000, dx: -128, dy: 100 },
          ],
        },
        {
          kind: 'circle',
          id: 'cl-cong',
          cx: 390,
          cy: 160,
          r: 13,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 2200, dx: -150, dy: -10 },
            { atMs: 3200, dx: -212, dy: -15 },
            { atMs: 6000, dx: -212, dy: -15 },
          ],
        },
        {
          kind: 'label',
          id: 'cl-t',
          x: 390,
          y: 165,
          text: 'Cl',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 2200, dx: -150, dy: -10 },
            { atMs: 3200, dx: -212, dy: -15 },
            { atMs: 6000, dx: -212, dy: -15 },
          ],
        },
        {
          kind: 'label',
          id: 'hcl-t',
          x: 390,
          y: 105,
          text: 'HCl',
          size: 13,
          anchor: 'middle',
          fill: 'muted',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 2000, opacity: 0 },
            { atMs: 6000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'quy-tac',
          x: 220,
          y: 30,
          text: 'H vào C nhiều H hơn · Cl vào C ít H hơn',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2800, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'sp',
          x: 220,
          y: 185,
          text: 'sản phẩm chính: CH₃–CHCl–CH₃ (2-chloropropane)',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3200, opacity: 0 },
            { atMs: 3600, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Liên kết đôi C=C gồm một liên kết sigma bền và một liên kết pi kém bền.',
        },
        { atMs: 2200, text: 'Liên kết pi đứt, mở ra hai vị trí để HCl cộng vào.' },
        {
          atMs: 3400,
          text: 'H vào carbon nhiều H hơn, Cl vào carbon ít H hơn — quy tắc Markovnikov.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c4-b17',
    grade: '11',
    chapterNumber: 4,
    chapterTitle: 'Hydrocarbon',
    lessonNumber: 17,
    title: 'Arene (Hydrocarbon thơm)',
    hook:
      'Benzene có cấu trúc vòng lục giác hoàn hảo với hệ liên kết bền vững khác thường. Nhờ độ bền này, ' +
      'nó là dung môi công nghiệp cực tốt, nhưng lại cực độc đối với con người.',
    theory:
      'CẤU TẠO PHÂN TỬ BENZENE (C₆H₆):\n' +
      '— Phân tử benzene gồm 6 nguyên tử C tạo thành một vòng sáu cạnh đều nằm trên một mặt phẳng. Hệ liên kết pi (π) liên hợp khép kín tạo nên cấu trúc vòng siêu bền (nhân thơm).\n\n' +
      'DANH PHÁP ARENE:\n' +
      '— Dãy đồng đẳng arene gồm benzene (C₆H₆) và các alkylbenzene (toluene C₆H₅-CH₃, xylene C₆H₄(CH₃)₂...).\n\n' +
      'TÍNH CHẤT HOÁ HỌC (Tính thơm: dễ thế, khó cộng, bền với chất oxi hoá):\n' +
      '1. Phản ứng thế ở nhân thơm (tính chất đặc trưng):\n' +
      '   — Thế halogen (brom hoá): Benzene phản ứng với Br₂ khan khi có xúc tác FeBr₃ tạo bromobenzene: C₆H₆ + Br₂ → C₆H₅Br + HBr.\n' +
      '   — Phản ứng nitro hoá: Phản ứng với hỗn hợp HNO₃ đặc / H₂SO₄ đặc tạo nitrobenzene.\n' +
      '   — Đối với toluene: Nhóm alkyl (−CH₃) hoạt hoá nhân thơm, làm phản ứng thế xảy ra dễ dàng hơn benzene và ưu tiên thế vào vị trí ortho (o-) và para (p-).\n' +
      '2. Phản ứng cộng vào nhân thơm (chỉ xảy ra ở điều kiện khắc nghiệt):\n' +
      '   — Cộng H₂ (t°, Ni) tạo cyclohexane.\n' +
      '   — Cộng Cl₂ (chiếu sáng) tạo thuốc trừ sâu 666 (hexachlorocyclohexane C₆H₆Cl₆).\n' +
      '3. Phản ứng oxi hoá mạch nhánh của alkylbenzene:\n' +
      '   — Toluene phản ứng với dung dịch KMnO₄ khi đun nóng, làm mất màu thuốc tím tạo potassium benzoate (C₆H₅COOK) và kết tủa đen MnO₂. Benzene không phản ứng.',
    workedExample: {
      problem:
        'Trình bày phương pháp hoá học đơn giản để phân biệt hai chất lỏng không màu đựng riêng biệt: ' +
        'benzene và toluene.',
      steps: [
        'Lấy một ít mỗi chất lỏng ra hai ống nghiệm làm mẫu thử.',
        'Nhỏ dung dịch thuốc tím KMnO₄ vào từng mẫu thử ở nhiệt độ thường ⇒ cả hai đều không phản ứng, không mất màu thuốc tím.',
        'Đun nóng nhẹ cả hai ống nghiệm.',
        'Ống nghiệm chứa toluene bị mất màu tím của KMnO₄ và xuất hiện kết tủa đen MnO₂ (do nhóm −CH₃ bị oxi hoá thành −COOK).',
        'Ống nghiệm chứa benzene vẫn giữ nguyên màu tím của KMnO₄, vì nhân benzene bền, không bị KMnO₄ oxi hoá kể cả khi đun nóng.',
      ],
      answer: 'Dùng dung dịch KMnO₄ đun nóng',
    },
    checkQuestions: [
      {
        prompt: 'Tính chất hoá học đặc trưng của nhân benzene là gì (quy tắc tính thơm)?',
        choices: [
          { id: 'a', label: 'Dễ cộng, khó thế, dễ bị oxi hoá' },
          { id: 'b', label: 'Dễ thế, khó cộng, bền vững với các chất oxi hoá' },
          { id: 'c', label: 'Chỉ tham gia phản ứng cháy' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Cấu trúc vòng liên hợp bền vững của benzene làm cho nó có tính thơm: dễ tham gia phản ứng thế, khó tham gia phản ứng cộng và bền với các chất oxi hoá thông thường.',
      },
      {
        prompt:
          'Khi cho toluene tác dụng với dung dịch KMnO₄ và đun nóng, nhóm methyl (−CH₃) bị oxi hoá thành nhóm chức nào?',
        choices: [
          { id: 'ald', label: 'Aldehyde (−CHO)' },
          { id: 'alk', label: 'Alcohol (−CH₂OH)' },
          { id: 'car', label: 'Carboxylate (−COOK / −COOH)' },
          { id: 'ket', label: 'Ketone (−CO−)' },
        ],
        answer: { kind: 'choice', correctIds: ['car'] },
        explain:
          'Toluene bị KMnO₄ nóng oxi hoá nhóm −CH₃ thành muối potassium benzoate C₆H₅COOK; acid hoá muối này thì thu được benzoic acid C₆H₅COOH. Phản ứng đi thẳng tới nhóm carboxyl, không dừng lại ở aldehyde hay alcohol.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tại sao benzene bền với chất oxi hoá?',
        dap: 'Vì có cấu trúc vòng phẳng sáu cạnh đều với hệ electron pi liên hợp khép kín siêu bền.',
      },
      {
        hoi: 'Hiện tượng phân biệt benzene và toluene bằng KMnO₄?',
        dap: 'Toluene làm mất màu KMnO₄ khi đun nóng, còn benzene thì không.',
      },
      {
        hoi: 'Quy tắc thế vào toluene khác benzene thế nào?',
        dap: 'Nhóm methyl giúp thế dễ dàng hơn và định hướng vào vị trí ortho và para.',
      },
    ],
    animation: {
      title: 'Vòng benzene: từ ba nối đôi luân phiên tới hệ electron π giải toả',
      description:
        'Sáu nguyên tử carbon xếp thành lục giác đều phẳng, mỗi góc 120°. Ba nối đôi luân phiên được vẽ trước, rồi chúng chuyển vị trí sang ba cạnh còn lại — hai công thức này thay nhau chớp qua lại để cho thấy không công thức nào là thật. Sau đó chúng nhập lại thành một vòng tròn nằm trong lục giác: sáu electron π không thuộc riêng cặp carbon nào mà trải đều quanh vòng. Hệ quả kiểm chứng được hiện ở dưới: cho benzene vào nước bromine thì màu nâu của nước bromine không mất, trong khi ethylene có nối đôi thật thì làm mất màu ngay. Benzene bền hơn alkene nên nó thiên về phản ứng thế hơn phản ứng cộng.',
      viewBoxWidth: 460,
      viewBoxHeight: 240,
      durationMs: 8000,
      loop: true,
      shapes: [
        {
          kind: 'polyline',
          id: 'vong',
          points: [
            [130, 50],
            [176, 77],
            [176, 131],
            [130, 158],
            [84, 131],
            [84, 77],
          ],
          stroke: 'primary',
          strokeWidth: 2.5,
          closed: true,
        },
        {
          kind: 'line',
          id: 'd1',
          x1: 136,
          y1: 58,
          x2: 172,
          y2: 79,
          stroke: 'accent',
          strokeWidth: 2,
          keyframes: [
            {
              atMs: 0,
              opacity: 1,
            },
            {
              atMs: 1800,
              opacity: 1,
            },
            {
              atMs: 2200,
              opacity: 0,
            },
            {
              atMs: 8000,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'line',
          id: 'd2',
          x1: 170,
          y1: 129,
          x2: 136,
          y2: 150,
          stroke: 'accent',
          strokeWidth: 2,
          keyframes: [
            {
              atMs: 0,
              opacity: 1,
            },
            {
              atMs: 1800,
              opacity: 1,
            },
            {
              atMs: 2200,
              opacity: 0,
            },
            {
              atMs: 8000,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'line',
          id: 'd3',
          x1: 90,
          y1: 85,
          x2: 90,
          y2: 123,
          stroke: 'accent',
          strokeWidth: 2,
          keyframes: [
            {
              atMs: 0,
              opacity: 1,
            },
            {
              atMs: 1800,
              opacity: 1,
            },
            {
              atMs: 2200,
              opacity: 0,
            },
            {
              atMs: 8000,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'line',
          id: 'e1',
          x1: 124,
          y1: 58,
          x2: 90,
          y2: 79,
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2200,
              opacity: 1,
            },
            {
              atMs: 3400,
              opacity: 1,
            },
            {
              atMs: 3800,
              opacity: 0,
            },
            {
              atMs: 8000,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'line',
          id: 'e2',
          x1: 170,
          y1: 85,
          x2: 170,
          y2: 123,
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2200,
              opacity: 1,
            },
            {
              atMs: 3400,
              opacity: 1,
            },
            {
              atMs: 3800,
              opacity: 0,
            },
            {
              atMs: 8000,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'line',
          id: 'e3',
          x1: 124,
          y1: 150,
          x2: 90,
          y2: 129,
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2200,
              opacity: 1,
            },
            {
              atMs: 3400,
              opacity: 1,
            },
            {
              atMs: 3800,
              opacity: 0,
            },
            {
              atMs: 8000,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'giaitoa',
          cx: 130,
          cy: 104,
          r: 30,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2.5,
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
          id: 'gtt',
          x: 130,
          y: 182,
          text: '6 electron π giải toả đều quanh vòng',
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
              atMs: 4400,
              opacity: 0,
            },
            {
              atMs: 4900,
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
          id: 'goc',
          x: 130,
          y: 202,
          text: 'vòng phẳng, đều, mỗi góc 120°',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'polyline',
          id: 'ong1',
          points: [
            [280, 60],
            [280, 146],
            [280.5, 148],
            [282, 149.5],
            [284, 150],
            [326, 150],
            [328, 149.5],
            [329.5, 148],
            [330, 146],
            [330, 60],
          ],
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'rect',
          id: 'mau1',
          x: 284,
          y: 96,
          w: 42,
          h: 50,
          fill: 'warn',
          rx: 2,
          opacity: 0.45,
        },
        {
          kind: 'label',
          id: 'ong1t',
          x: 305,
          y: 168,
          text: 'benzene + nước Br₂',
          size: 10,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'ong1k',
          x: 305,
          y: 186,
          text: 'màu nâu KHÔNG mất',
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
              atMs: 5400,
              opacity: 0,
            },
            {
              atMs: 5900,
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
          id: 'ong2',
          points: [
            [380, 60],
            [380, 146],
            [380.5, 148],
            [382, 149.5],
            [384, 150],
            [426, 150],
            [428, 149.5],
            [429.5, 148],
            [430, 146],
            [430, 60],
          ],
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'rect',
          id: 'mau2',
          x: 384,
          y: 96,
          w: 42,
          h: 50,
          fill: 'warn',
          rx: 2,
          opacity: 0.45,
          keyframes: [
            { atMs: 0, opacity: 0.45 },
            { atMs: 5400, opacity: 0.45 },
            { atMs: 6600, opacity: 0.05 },
            { atMs: 8000, opacity: 0.05 },
          ],
        },
        {
          kind: 'label',
          id: 'ong2t',
          x: 405,
          y: 168,
          text: 'ethylene + nước Br₂',
          size: 10,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'ong2k',
          x: 405,
          y: 186,
          text: 'mất màu ngay',
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
        {
          kind: 'label',
          id: 'kl',
          x: 305,
          y: 216,
          text: 'Benzene bền: ưu tiên phản ứng thế, khó cộng',
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
              atMs: 7000,
              opacity: 0,
            },
            {
              atMs: 7500,
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
          text: 'Sáu carbon xếp lục giác đều phẳng, ba nối đôi luân phiên.',
        },
        {
          atMs: 2200,
          text: 'Ba nối đôi đổi chỗ sang ba cạnh kia — không công thức nào là thật.',
        },
        {
          atMs: 4400,
          text: 'Thực chất sáu electron π giải toả đều thành một vòng.',
        },
        {
          atMs: 5600,
          text: 'Vì vậy benzene không làm mất màu nước bromine, còn ethylene thì có.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c4-b18',
    grade: '11',
    chapterNumber: 4,
    chapterTitle: 'Hydrocarbon',
    lessonNumber: 18,
    title: 'Ôn tập chương 4 — Hydrocarbon',
    hook:
      'Ôn tập và đối chiếu bốn dãy hydrocarbon quan trọng nhất: alkane (no), alkene và alkyne (không no), ' +
      'arene (thơm). Khác biệt về cấu tạo tạo nên tính chất hoá học đặc trưng của từng dãy.',
    theory:
      'TỔNG KẾT SO SÁNH CÁC LỚP HYDROCARBON:\n' +
      '1. Alkane (CₙH₂ₙ₊₂): Chỉ chứa liên kết đơn C−C, C−H. Phản ứng thế halogen (chiếu sáng) đặc trưng. Đốt cháy cho nCO₂ < nH₂O.\n' +
      '2. Alkene (CₙH₂ₙ): Có 1 liên kết đôi C=C (chứa 1 liên kết pi kém bền). Phản ứng cộng (H₂, Br₂, HX, H₂O) đặc trưng, phản ứng trùng hợp. Làm mất màu nước Bromine và dung dịch KMnO₄.\n' +
      '3. Alkyne (CₙH₂ₙ₋₂): Có 1 liên kết ba C≡C (chứa 2 liên kết pi kém bền). Phản ứng cộng tương tự alkene. Riêng alk-1-yne thế AgNO₃/NH₃ tạo kết tủa vàng nhạt.\n' +
      '4. Arene (CₙH₂ₙ₋₆): Có nhân benzene bền vững. Phản ứng thế nhân đặc trưng, khó cộng. Alkylbenzene bị oxi hoá nhánh bởi KMnO₄ nóng.',
    workedExample: {
      problem:
        'Một hydrocarbon X có công thức phân tử C₂H₂. Khi sục X vào dung dịch AgNO₃ trong NH₃ dư ' +
        'thấy xuất hiện kết tủa màu vàng nhạt. Xác định tên gọi của X.',
      steps: [
        'Công thức phân tử C₂H₂ ứng với chất duy nhất là Acetylene (CH≡CH).',
        'Phân tử có liên kết ba đầu mạch (alk-1-yne) nên các nguyên tử H liên kết với carbon không no mang tính linh động cao.',
        'Ag⁺ trong phức bạc thế nguyên tử H đầu mạch tạo kết tủa màu vàng nhạt bạc acetylide (AgC≡CAg).',
        'Tên gọi của X là Acetylene (hoặc ethyne).',
      ],
      answer: 'Acetylene',
    },
    checkQuestions: [
      {
        prompt:
          'Đốt cháy hoàn toàn một hydrocarbon thu được số mol CO₂ nhỏ hơn số mol H₂O (nCO₂ < nH₂O). Hydrocarbon đó thuộc dãy đồng đẳng nào?',
        choices: [
          { id: 'alkane', label: 'Alkane' },
          { id: 'alkene', label: 'Alkene' },
          { id: 'alkyne', label: 'Alkyne' },
          { id: 'arene', label: 'Arene' },
        ],
        answer: { kind: 'choice', correctIds: ['alkane'] },
        explain:
          'Chỉ có đốt cháy alkane (CₙH₂ₙ₊₂) mới tạo ra tỉ lệ nước nhiều hơn CO₂ (nH₂O / nCO₂ = (n+1)/n > 1).',
      },
      {
        prompt:
          'Để phân biệt nhanh alkene (như ethylene) và alkane (như ethane) đựng trong 2 bình mất nhãn, thuốc thử tối ưu là gì?',
        choices: [
          { id: 'na', label: 'Kim loại Sodium (Na)' },
          { id: 'hcl', label: 'Dung dịch HCl' },
          { id: 'brom', label: 'Dung dịch nước Bromine' },
        ],
        answer: { kind: 'choice', correctIds: ['brom'] },
        explain:
          'Ethylene có liên kết đôi nên cộng ngay với bromine, làm mất màu nước bromine; ethane chỉ có liên kết đơn nên không phản ứng ở điều kiện thường. Na và HCl đều không phản ứng với cả hai khí này.',
      },
    ],
    srsCards: [
      { hoi: 'Hydrocarbon làm mất màu nước bromine?', dap: 'Alkene và alkyne.' },
      {
        hoi: 'Chất dùng phân biệt alk-1-yne với các alkyne khác?',
        dap: 'Dung dịch AgNO₃ trong NH₃ (tạo kết tủa vàng nhạt).',
      },
      {
        hoi: 'Dấu hiệu nhận biết Arene có nhánh alkyl?',
        dap: 'Làm mất màu dung dịch KMnO₄ khi đun nóng.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
