// lessons/hoa12c3.ts — Hoá học 12, Chương 3: Hợp chất chứa nitrogen (4 bài).
// Đối chiếu mục lục thật: tai-lieu-sgk/SGK-Hoa/12/page_0004.png (OCR 2026-08-31).
// reviewStatus='draft' — soạn từ docs/research/kho-kien-thuc-hoa-gdpt2018.md §3, chưa duyệt.
import type { ChemLesson } from '../lessonTypes.js'

export const HOA12_C3_LESSONS: ChemLesson[] = [
  {
    id: 'hoa12-c3-b8',
    grade: '12',
    chapterNumber: 3,
    chapterTitle: 'Hợp chất chứa nitrogen',
    lessonNumber: 8,
    title: 'Amine',
    hook:
      'Mùi tanh đặc trưng của cá là do các phân tử amine gây ra (như trimethylamine). ' +
      'Để giảm bớt mùi tanh này khi kho cá, ta thường nấu chung với các chất có vị chua như giấm hoặc nước khế.',
    theory:
      'KHÁI NIỆM VÀ PHÂN LOẠI:\n' +
      '— Amine là hợp chất hữu cơ thu được khi thay thế một hoặc nhiều nguyên tử hydrogen trong phân tử NH₃ bằng một hoặc nhiều gốc hydrocarbon.\n' +
      "— Phân loại theo bậc amine (bằng số gốc hydrocarbon liên kết với nguyên tử N): Amine bậc I (R−NH₂), Amine bậc II (R−NH−R'), Amine bậc III (R−N(R')−R\").\n" +
      '— Phân loại theo gốc hydrocarbon: Aliphatic amine (amine béo, vd: methylamine, ethylamine) và Aromatic amine (amine thơm, vd: aniline C₆H₅NH₂).\n\n' +
      'TÍNH CHẤT HOÁ HỌC CỦA AMINE:\n' +
      '1. Tính base yếu (do nguyên tử N còn một cặp electron chưa liên kết, sẵn sàng nhận proton):\n' +
      '   — Aliphatic amine có tính base mạnh hơn NH₃, làm quỳ tím hoá xanh, phenolphthalein hoá hồng, phản ứng dễ dàng với acid tạo muối.\n' +
      '   — Aniline (amine thơm) có tính base rất yếu (yếu hơn NH₃) do vòng benzene hút electron, không làm đổi màu quỳ tím hay phenolphthalein. Aniline phản ứng được với acid mạnh (như HCl) tạo muối tan: C₆H₅NH₂ + HCl → C₆H₅NH₃Cl (phenylammonium chloride).\n' +
      '2. Phản ứng thế ở nhân thơm của aniline:\n' +
      '   — Aniline phản ứng cực kì dễ dàng với nước Bromine ở nhiệt độ thường tạo KẾT TỦA TRẮNG 2,4,6-tribromoaniline (nhận biết aniline): C₆H₅NH₂ + 3Br₂ → C₆H₂NH₂Br₃↓ + 3HBr.',
    workedExample: {
      problem:
        'Cho 9,3 gam aniline (C₆H₅NH₂, M=93) tác dụng hoàn toàn với dung dịch HCl dư. ' +
        'Tính khối lượng muối phenylammonium chloride (C₆H₅NH₃Cl, M=129,5) thu được.',
      steps: [
        'Tính số mol aniline phản ứng: n = 9,3 / 93 = 0,1 mol.',
        'Viết phương trình phản ứng tạo muối: C₆H₅NH₂ + HCl → C₆H₅NH₃Cl.',
        'Theo tỉ lệ phản ứng 1:1, số mol muối thu được là 0,1 mol.',
        'Tính khối lượng muối: m = 0,1 * 129,5 = 12,95 gam.',
      ],
      answer: '12,95 gam',
    },
    checkQuestions: [
      {
        prompt: 'Trimethylamine (CH₃)₃N thuộc loại amine bậc mấy?',
        choices: [
          { id: 'i', label: 'Amine bậc I' },
          { id: 'ii', label: 'Amine bậc II' },
          { id: 'iii', label: 'Amine bậc III' },
        ],
        answer: { kind: 'choice', correctIds: ['iii'] },
        explain:
          'Trong trimethylamine, nguyên tử N liên kết với 3 gốc methyl (−CH₃) nên đây là amine bậc III.',
      },
      {
        prompt:
          'Nhỏ nước bromine vào ống nghiệm chứa aniline ở nhiệt độ thường thì quan sát thấy hiện tượng gì?',
        choices: [
          { id: 'khi', label: 'Có bọt khí thoát ra' },
          { id: 'tua_trang', label: 'Xuất hiện kết tủa màu trắng' },
          { id: 'khong', label: 'Không có hiện tượng gì' },
        ],
        answer: { kind: 'choice', correctIds: ['tua_trang'] },
        explain:
          'Nhóm −NH₂ đẩy electron vào vòng, hoạt hoá nhân thơm rất mạnh, nên aniline phản ứng ngay với nước bromine ở nhiệt độ thường, cho kết tủa trắng 2,4,6-tribromoaniline. Phản ứng này là phản ứng thế, sản phẩm phụ là HBr tan trong nước nên không thấy bọt khí.',
      },
    ],
    srsCards: [
      {
        hoi: 'Bậc của amine được xác định thế nào?',
        dap: 'Bằng số nguyên tử hydrogen của NH₃ bị thế bởi gốc hydrocarbon.',
      },
      {
        hoi: 'Tại sao aniline có tính base yếu hơn methylamine?',
        dap: 'Vì nhân benzene hút electron làm giảm mật độ electron tự do trên nguyên tử N.',
      },
      {
        hoi: 'Phản ứng đặc trưng dùng nhận biết aniline?',
        dap: 'Tác dụng nước bromine tạo kết tủa trắng 2,4,6-tribromoaniline.',
      },
    ],
    animation: {
      title: 'Cặp electron trên nitrogen quyết định tính base mạnh yếu của amine',
      description:
        'Ba chất được đặt cạnh nhau, mỗi chất đều có một cặp chấm trên nguyên tử nitrogen — chính cặp electron đó nhận proton và làm nên tính base. Ở methylamine CH₃NH₂, mũi tên từ nhóm CH₃ chỉ về phía nitrogen: nhóm alkyl đẩy electron vào, cặp electron dày lên nên nhận proton dễ hơn, base mạnh hơn ammonia. Ở ammonia NH₃ không có gì đẩy cũng không có gì hút, lấy làm mốc. Ở aniline C₆H₅NH₂, mũi tên chỉ ngược lại — từ nitrogen vào vòng benzene: cặp electron bị vòng thơm hút bớt đi, loãng ra, nên khó nhận proton hơn hẳn, base rất yếu và không làm đổi màu quỳ tím. Thanh đo phía dưới xếp đúng thứ tự aniline < ammonia < methylamine.',
      viewBoxWidth: 470,
      viewBoxHeight: 230,
      durationMs: 8000,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 't1',
          x: 93,
          y: 60,
          text: 'CH₃–',
          size: 15,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 't1n',
          x: 94,
          y: 60,
          text: 'NH₂',
          size: 15,
          anchor: 'start',
          fill: 'neutral',
        },
        { kind: 'circle', id: 'e1a', cx: 94.5, cy: 34, r: 4, fill: 'accent' },
        { kind: 'circle', id: 'e1b', cx: 104.5, cy: 34, r: 4, fill: 'accent' },
        {
          kind: 'arrow',
          id: 'day',
          x1: 62,
          y1: 46,
          x2: 92,
          y2: 42,
          stroke: 'accent',
          strokeWidth: 1.8,
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
              atMs: 1300,
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
          id: 'dayt',
          x: 90,
          y: 84,
          text: 'nhóm CH₃ đẩy electron vào',
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
              atMs: 800,
              opacity: 0,
            },
            {
              atMs: 1300,
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
          id: 't2',
          x: 222,
          y: 60,
          text: 'NH₃',
          size: 15,
          anchor: 'start',
          fill: 'neutral',
        },
        { kind: 'circle', id: 'e2a', cx: 222.5, cy: 34, r: 4, fill: 'accent' },
        { kind: 'circle', id: 'e2b', cx: 232.5, cy: 34, r: 4, fill: 'accent' },
        {
          kind: 'label',
          id: 't2b',
          x: 235,
          y: 84,
          text: 'mốc so sánh',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'polyline',
          id: 'vg',
          points: [
            [380, 78],
            [404, 92],
            [404, 120],
            [380, 134],
            [356, 120],
            [356, 92],
          ],
          stroke: 'primary',
          strokeWidth: 2,
          closed: true,
        },
        {
          kind: 'line',
          id: 'vgn',
          x1: 380,
          y1: 78,
          x2: 380,
          y2: 58,
          stroke: 'primary',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 't3',
          x: 374,
          y: 50,
          text: 'NH₂',
          size: 14,
          anchor: 'start',
          fill: 'neutral',
        },
        { kind: 'circle', id: 'e3a', cx: 374.5, cy: 26, r: 4, fill: 'accent' },
        { kind: 'circle', id: 'e3b', cx: 384.5, cy: 26, r: 4, fill: 'accent' },
        {
          kind: 'arrow',
          id: 'hut',
          x1: 390,
          y1: 58,
          x2: 390,
          y2: 86,
          stroke: 'accent',
          strokeWidth: 1.8,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2900, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'hutt',
          x: 380,
          y: 168,
          text: 'vòng benzene hút electron ra',
          size: 10,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2900, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 't3b',
          x: 380,
          y: 152,
          text: 'aniline',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'arrow',
          id: 'thang',
          x1: 60,
          y1: 190,
          x2: 420,
          y2: 190,
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
              atMs: 4500,
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
          id: 'th1',
          x: 80,
          y: 210,
          text: 'C₆H₅NH₂',
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
              atMs: 4500,
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
          id: 'th2',
          x: 235,
          y: 210,
          text: 'NH₃',
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
          id: 'th3',
          x: 390,
          y: 210,
          text: 'CH₃NH₂',
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
              atMs: 4800,
              opacity: 0,
            },
            {
              atMs: 5300,
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
          id: 'tht',
          x: 235,
          y: 176,
          text: 'tính base tăng dần',
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
              atMs: 4500,
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
          id: 'quy',
          x: 80,
          y: 228,
          text: 'không đổi màu quỳ tím',
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
              atMs: 6100,
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
          id: 'quy2',
          x: 390,
          y: 228,
          text: 'làm quỳ tím hoá xanh',
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
              atMs: 6100,
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
          text: 'Tính base của amine đến từ cặp electron chưa liên kết trên nitrogen.',
        },
        {
          atMs: 1000,
          text: 'Nhóm alkyl đẩy electron vào N: methylamine base mạnh hơn ammonia.',
        },
        {
          atMs: 2600,
          text: 'Vòng benzene hút electron ra khỏi N: aniline base rất yếu.',
        },
        {
          atMs: 4200,
          text: 'Thứ tự: aniline < ammonia < methylamine.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa12-c3-b9',
    grade: '12',
    chapterNumber: 3,
    chapterTitle: 'Hợp chất chứa nitrogen',
    lessonNumber: 9,
    title: 'Amino acid và peptide',
    hook:
      'Bột ngọt (mì chính) chính là muối sodium của glutamic acid — một amino acid rất phổ biến. ' +
      'Các amino acid nối với nhau bằng liên kết peptide để tạo nên protein của cơ thể.',
    theory:
      'AMINO ACID:\n' +
      '— Khái niệm: Là hợp chất hữu cơ tạp chức, phân tử chứa đồng thời nhóm amino (−NH₂) và nhóm carboxyl (−COOH).\n' +
      '— Trạng thái: Chất rắn kết tinh, vị hơi ngọt, nhiệt độ nóng chảy cao (do tồn tại ở dạng ion lưỡng cực H₃N⁺−CH(R)−COO⁻).\n' +
      '— Các amino acid thường gặp (bắt buộc nhớ cấu trúc và phân tử khối):\n' +
      '  1. Glycine (Gly): H₂N−CH₂−COOH (M = 75).\n' +
      '  2. Alanine (Ala): CH₃−CH(NH₂)−COOH (M = 89).\n' +
      '  3. Valine (Val): (CH₃)₂CH−CH(NH₂)−COOH (M = 117).\n' +
      '  4. Glutamic acid (Glu): HOOC−(CH₂)₂−CH(NH₂)−COOH (2 nhóm −COOH, 1 nhóm −NH₂, M = 147).\n' +
      '  5. Lysine (Lys): H₂N−(CH₂)₄−CH(NH₂)−COOH (1 nhóm −COOH, 2 nhóm −NH₂, M = 146).\n' +
      '— Tính chất hoá học: Có tính lưỡng tính (phản ứng với cả acid và base mạnh). Dung dịch Gly, Ala, Val trung tính; Glu có tính acid (quỳ hoá đỏ); Lys có tính base (quỳ hoá xanh).\n\n' +
      'PEPTIDE:\n' +
      '— Khái niệm: Là hợp chất chứa từ 2 đến 50 mắt xích α-amino acid liên kết với nhau bằng các liên kết peptide −CO−NH−.\n' +
      '— Phản ứng màu biuret (nhận biết peptide): Các peptide chứa từ 3 mắt xích trở lên (tripeptide trở lên) phản ứng với Cu(OH)₂ trong môi trường kiềm tạo dung dịch màu TÍM đặc trưng. Dipeptide không có phản ứng này.',
    workedExample: {
      problem:
        'Tính phân tử khối của dipeptide Gly-Ala được tạo thành từ 1 phân tử Glycine và 1 phân tử Alanine.',
      steps: [
        'Glycine có phân tử khối M = 75. Alanine có phân tử khối M = 89.',
        'Khi 2 amino acid liên kết với nhau tạo dipeptide, chúng phản ứng tách đi 1 phân tử nước H₂O (M=18) để hình thành liên kết peptide −CO−NH−.',
        'Công thức tính phân tử khối dipeptide: M = M(Gly) + M(Ala) − M(H₂O).',
        'Tính toán: M = 75 + 89 − 18 = 146 g/mol.',
      ],
      answer: '146',
    },
    checkQuestions: [
      {
        prompt:
          'Chất nào sau đây có tính chất lưỡng tính (tác dụng với cả dung dịch acid mạnh và base mạnh)?',
        choices: [
          { id: 'amine', label: 'Methylamine' },
          { id: 'aminoacid', label: 'Glycine' },
          { id: 'ester', label: 'Ethyl acetate' },
        ],
        answer: { kind: 'choice', correctIds: ['aminoacid'] },
        explain:
          'Glycine có cả nhóm carboxyl −COOH (tính acid) lẫn nhóm amino −NH₂ (tính base) trong cùng một phân tử nên lưỡng tính. Methylamine chỉ có tính base, còn ethyl acetate là ester trung tính — nó bị NaOH thuỷ phân chứ không phải phản ứng acid–base.',
      },
      {
        prompt:
          'Phản ứng màu biuret (tạo phức màu tím với Cu(OH)₂/NaOH) KHÔNG xảy ra với chất nào sau đây?',
        choices: [
          { id: 'di', label: 'Dipeptide (như Gly-Ala)' },
          { id: 'tri', label: 'Tripeptide (như Gly-Ala-Gly)' },
          { id: 'tetra', label: 'Tetrapeptide' },
        ],
        answer: { kind: 'choice', correctIds: ['di'] },
        explain:
          'Phản ứng biuret cần ít nhất 2 liên kết peptide, nghĩa là từ tripeptide (3 mắt xích) trở lên. Dipeptide chỉ có 1 liên kết peptide nên không cho màu tím; tripeptide và tetrapeptide thì có.',
      },
    ],
    srsCards: [
      { hoi: 'Mảnh mắt xích cấu tạo nên peptide tự nhiên là gì?', dap: 'Các gốc α-amino acid.' },
      {
        hoi: 'Phân tử khối của Glycine và Alanine bằng bao nhiêu?',
        dap: 'Glycine M = 75; Alanine M = 89.',
      },
      {
        hoi: 'Amino acid nào làm quỳ tím chuyển sang màu xanh?',
        dap: 'Lysine (vì chứa 2 nhóm −NH₂ và chỉ có 1 nhóm −COOH).',
      },
      {
        hoi: 'Liên kết peptide có cấu tạo thế nào?',
        dap: 'Nhóm liên kết −CO−NH− giữa hai đơn vị α-amino acid.',
      },
    ],
    animation: {
      title: 'Amino acid: ion lưỡng cực và cách hai phân tử nối thành peptide',
      description:
        'Phần trên: glycine viết dạng phân tử H₂N–CH₂–COOH. Nhóm COOH có tính acid, nhóm NH₂ có tính base, nên proton của nhóm COOH nhảy thẳng sang nhóm NH₂ ngay trong cùng phân tử. Kết quả là dạng thực tế tồn tại: ion lưỡng cực ⁺H₃N–CH₂–COO⁻, một phân tử vừa mang điện dương vừa mang điện âm mà tổng điện tích bằng không. Chính điều này giải thích vì sao amino acid là chất rắn kết tinh, nóng chảy ở nhiệt độ cao và tan tốt trong nước, chứ không giống các acid hữu cơ thường. Phần dưới: hai phân tử amino acid tiến lại, nhóm COOH của phân tử bên trái nhường OH và nhóm NH₂ của phân tử bên phải nhường H, hai mảnh đó thành H₂O tách ra, còn lại liên kết CO–NH nối hai gốc — đó là liên kết peptide.',
      viewBoxWidth: 470,
      viewBoxHeight: 240,
      durationMs: 9000,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'd1',
          x: 130,
          y: 48,
          text: 'H₂N–CH₂–COOH',
          size: 15,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            {
              atMs: 0,
              opacity: 1,
            },
            {
              atMs: 1600,
              opacity: 1,
            },
            {
              atMs: 2200,
              opacity: 0,
            },
            {
              atMs: 9000,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'nhay',
          x1: 178,
          y1: 28,
          x2: 82,
          y2: 28,
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 800, opacity: 0 },
            { atMs: 1300, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhayt',
          x: 300,
          y: 40,
          text: 'H⁺ nhảy từ COOH sang NH₂',
          size: 10,
          anchor: 'start',
          fill: 'neutral',
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
              atMs: 1300,
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
          id: 'd2',
          x: 130,
          y: 48,
          text: '⁺H₃N–CH₂–COO⁻',
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
              atMs: 2200,
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
          id: 'd2t',
          x: 130,
          y: 72,
          text: 'ion lưỡng cực — dạng thực tế tồn tại',
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
              atMs: 2200,
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
          id: 'd2b',
          x: 300,
          y: 66,
          text: 'rắn kết tinh, nóng chảy cao,',
          size: 10,
          anchor: 'start',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3000, opacity: 0 },
            { atMs: 3600, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'd2c',
          x: 300,
          y: 80,
          text: 'tan tốt trong nước',
          size: 10,
          anchor: 'start',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3000, opacity: 0 },
            { atMs: 3600, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'ngan',
          x1: 30,
          y1: 100,
          x2: 440,
          y2: 100,
          stroke: 'muted',
          strokeWidth: 1.5,
          dash: '5 4',
        },
        {
          kind: 'label',
          id: 'p1',
          x: 24,
          y: 146,
          text: 'H₂N–CH₂–CO–',
          size: 14,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'p1oh',
          x: 122,
          y: 146,
          text: 'OH',
          size: 14,
          anchor: 'start',
          fill: 'accent',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 5600, opacity: 1 },
            { atMs: 6000, opacity: 0 },
            { atMs: 9000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'p2h',
          x: 262,
          y: 146,
          text: 'H',
          size: 14,
          anchor: 'end',
          fill: 'accent',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 5600, opacity: 1 },
            { atMs: 6000, opacity: 0 },
            { atMs: 9000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'p2',
          x: 264,
          y: 146,
          text: '–NH–CH₂–COOH',
          size: 14,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'circle',
          id: 'vo1',
          cx: 132,
          cy: 140,
          r: 20,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4400, opacity: 0.9 },
            { atMs: 5600, opacity: 0.9 },
            { atMs: 6000, opacity: 0 },
            { atMs: 9000, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'vo2',
          cx: 257,
          cy: 140,
          r: 14,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4400, opacity: 0.9 },
            { atMs: 5600, opacity: 0.9 },
            { atMs: 6000, opacity: 0 },
            { atMs: 9000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'nuoc',
          x: 120,
          y: 200,
          text: 'H₂O',
          size: 14,
          anchor: 'middle',
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 70, dy: -60 },
            { atMs: 5600, opacity: 0 },
            { atMs: 6200, opacity: 1 },
            { atMs: 7000, dx: 0, dy: 0 },
            { atMs: 9000, dx: 0, dy: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'kqa',
          x: 246,
          y: 180,
          text: 'H₂N–CH₂–',
          size: 13,
          anchor: 'end',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 7000, opacity: 0 },
            { atMs: 7600, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'kqb',
          x: 272,
          y: 180,
          text: 'CO–NH',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 7000, opacity: 0 },
            { atMs: 7600, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'kqc',
          x: 298,
          y: 180,
          text: '–CH₂–COOH',
          size: 13,
          anchor: 'start',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 7000, opacity: 0 },
            { atMs: 7600, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'kqt',
          x: 272,
          y: 204,
          text: 'liên kết peptide CO–NH',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 7000, opacity: 0 },
            { atMs: 7600, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'nhan',
          x: 248,
          y: 165,
          w: 48,
          h: 22,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          rx: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 7600, opacity: 0 },
            { atMs: 8100, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Glycine có cả nhóm acid COOH và nhóm base NH₂ trong một phân tử.',
        },
        {
          atMs: 2200,
          text: 'Proton nhảy nội bộ: dạng thật là ion lưỡng cực ⁺H₃N–CH₂–COO⁻.',
        },
        {
          atMs: 4400,
          text: 'Hai phân tử amino acid: một bên nhường OH, một bên nhường H.',
        },
        {
          atMs: 6200,
          text: 'Tách ra một phân tử H₂O, còn lại liên kết peptide CO–NH.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa12-c3-b10',
    grade: '12',
    chapterNumber: 3,
    chapterTitle: 'Hợp chất chứa nitrogen',
    lessonNumber: 10,
    title: 'Protein và enzyme',
    hook:
      'Lòng trắng trứng đông tụ thành thể rắn màu trắng khi chiên nóng. Tóc và tơ nhện dẻo dai ' +
      'đều là protein. Enzyme là các xúc tác sinh học giúp cơ thể ta tiêu hoá thức ăn chỉ trong vài giờ.',
    theory:
      'PROTEIN (Chất đạm):\n' +
      '— Khái niệm: Là những polypeptide cao phân tử, khối lượng phân tử từ vài chục nghìn đến hàng triệu g/mol.\n' +
      '— Phân loại: Protein đơn giản (chỉ chứa các gốc α-amino acid, vd: albumin của lòng trắng trứng) và Protein phức tạp (có thêm thành phần phi protein như nucleic acid, lipid, carbohydrate...).\n\n' +
      'TÍNH CHẤT CỦA PROTEIN:\n' +
      '1. Sự đông tụ (denaturation): Dưới tác dụng của nhiệt độ, acid, base hoặc muối kim loại nặng, protein bị mất cấu trúc không gian ba chiều tự nhiên và đông tụ lại thành chất rắn vô định hình (vd: trứng chín, sữa chua đông tụ).\n' +
      '2. Phản ứng thuỷ phân: Phân huỷ nhờ acid, base hoặc enzyme tạo thành các chuỗi peptide ngắn và cuối cùng là hỗn hợp các α-amino acid.\n' +
      '3. Phản ứng màu biuret: Tạo phức màu tím đặc trưng với Cu(OH)₂ trong môi trường kiềm.\n\n' +
      'ENZYME VÀ VAI TRÒ SINH HỌC:\n' +
      '— Enzyme là những chất hầu hết có bản chất protein, xúc tác cho các phản ứng hoá sinh trong cơ thể sinh vật với hiệu quả cực cao và tính chọn lọc tuyệt đối (hoạt động theo cơ chế khớp khít "chìa khoá - ổ khoá" tại trung tâm hoạt động).',
    workedExample: {
      problem:
        'Trình bày hiện tượng xảy ra khi nhỏ vài giọt dung dịch acid nitric (HNO₃) đặc vào dung dịch lòng trắng trứng.',
      steps: [
        'Lòng trắng trứng chứa thành phần chính là protein albumin tan trong nước.',
        'HNO₃ đặc vừa là acid mạnh vừa là tác nhân gây đông tụ protein.',
        'Khi nhỏ vào dung dịch lòng trắng trứng, protein vừa đông tụ vừa cho kết tủa màu vàng đặc trưng: nhóm nitro −NO₂ đã thế vào vòng benzene của những amino acid có nhân thơm như tyrosine.',
      ],
      answer: 'Xuất hiện kết tủa màu vàng',
    },
    checkQuestions: [
      {
        prompt: 'Hiện tượng lòng trắng trứng đông tụ lại khi đun nóng được gọi là hiện tượng gì?',
        choices: [
          { id: 'thuỷphan', label: 'Thuỷ phân' },
          { id: 'đôngtụ', label: 'Sự đông tụ (biến tính)' },
          { id: 'trungngung', label: 'Trùng ngưng' },
        ],
        answer: { kind: 'choice', correctIds: ['đôngtụ'] },
        explain:
          'Nhiệt độ cao phá vỡ cấu trúc không gian của protein, làm nó biến tính và đông tụ thành chất rắn. Các liên kết peptide không bị cắt nên đây không phải thuỷ phân; trùng ngưng thì ngược lại, là phản ứng nối các phân tử nhỏ thành phân tử lớn.',
      },
      {
        prompt: 'Enzyme có đặc điểm xúc tác nổi bật nào so với các xúc tác hoá học thông thường?',
        choices: [
          {
            id: 'a',
            label:
              'Hiệu quả xúc tác cực cao và tính chọn lọc (chỉ xúc tác cho một phản ứng nhất định)',
          },
          { id: 'b', label: 'Có thể hoạt động tốt ở nhiệt độ hàng nghìn độ C' },
          { id: 'c', label: 'Không có bản chất hoá học xác định' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Enzyme là chất xúc tác sinh học có hoạt tính cao hơn chất xúc tác hoá học hàng triệu lần, hoạt động ở điều kiện ôn hoà và có tính chọn lọc rất cao.',
      },
    ],
    srsCards: [
      {
        hoi: 'Protein là gì?',
        dap: 'Polypeptide cao phân tử có khối lượng phân tử lớn, được tạo nên từ các gốc α-amino acid.',
      },
      {
        hoi: 'Các tác nhân gây đông tụ protein?',
        dap: 'Nhiệt độ cao, acid, base, hoặc ion kim loại nặng.',
      },
      { hoi: 'Bản chất của enzyme hầu hết là gì?', dap: 'Protein.' },
    ],
    animation: {
      title: 'Bốn bậc cấu trúc của protein và sự biến tính không hồi lại',
      description:
        'Bậc một là trình tự các amino acid nối nhau bằng liên kết peptide, vẽ như một chuỗi hạt. Bậc hai: chuỗi cuộn thành xoắn α nhờ các liên kết hydrogen giữa nhóm C=O và nhóm N–H cách nhau vài mắt xích — các nét đứt trong hình. Bậc ba: cả đoạn xoắn gấp lại thành một khối cầu gọn nhờ cầu disulfide và tương tác giữa các mạch nhánh. Bậc bốn: nhiều chuỗi đã cuộn ghép lại với nhau, như bốn chuỗi của hemoglobin. Rồi nguồn nhiệt xuất hiện: liên kết hydrogen đứt dần, xoắn duỗi ra, khối cầu bung thành sợi rối, các chuỗi rời nhau. Trình tự amino acid vẫn nguyên, liên kết peptide không đứt; chỉ hình dạng không gian bị phá — nhưng mất hình dạng là mất chức năng: lòng trắng trứng đã chín không sống lại được.',
      viewBoxWidth: 470,
      viewBoxHeight: 240,
      durationMs: 9000,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'b1',
          x: 100,
          y: 36,
          text: 'Bậc 1: chuỗi amino acid',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'circle',
          id: 'h1',
          cx: 42,
          cy: 62,
          r: 7,
          fill: 'primary',
        },
        {
          kind: 'circle',
          id: 'h2',
          cx: 66,
          cy: 62,
          r: 7,
          fill: 'primary',
        },
        {
          kind: 'circle',
          id: 'h3',
          cx: 90,
          cy: 62,
          r: 7,
          fill: 'primary',
        },
        {
          kind: 'circle',
          id: 'h4',
          cx: 114,
          cy: 62,
          r: 7,
          fill: 'primary',
        },
        {
          kind: 'circle',
          id: 'h5',
          cx: 138,
          cy: 62,
          r: 7,
          fill: 'primary',
        },
        {
          kind: 'circle',
          id: 'h6',
          cx: 162,
          cy: 62,
          r: 7,
          fill: 'primary',
        },
        {
          kind: 'line',
          id: 'n1',
          x1: 49,
          y1: 62,
          x2: 59,
          y2: 62,
          stroke: 'primary',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'n2',
          x1: 73,
          y1: 62,
          x2: 83,
          y2: 62,
          stroke: 'primary',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'n3',
          x1: 97,
          y1: 62,
          x2: 107,
          y2: 62,
          stroke: 'primary',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'n4',
          x1: 121,
          y1: 62,
          x2: 131,
          y2: 62,
          stroke: 'primary',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'n5',
          x1: 145,
          y1: 62,
          x2: 155,
          y2: 62,
          stroke: 'primary',
          strokeWidth: 2,
        },
        {
          kind: 'circle',
          id: 'q0',
          cx: 94,
          cy: 128,
          r: 15,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 0, dy: 0 },
            { atMs: 4400, opacity: 0 },
            { atMs: 5000, opacity: 1 },
            { atMs: 5800, dx: 0, dy: 0 },
            { atMs: 6800, dx: -10, dy: -8, opacity: 0.35 },
            { atMs: 9000, dx: -10, dy: -8, opacity: 0.35 },
          ],
        },
        {
          kind: 'circle',
          id: 'q1',
          cx: 126,
          cy: 128,
          r: 15,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 0, dy: 0 },
            { atMs: 4400, opacity: 0 },
            { atMs: 5000, opacity: 1 },
            { atMs: 5800, dx: 0, dy: 0 },
            { atMs: 6800, dx: 10, dy: -8, opacity: 0.35 },
            { atMs: 9000, dx: 10, dy: -8, opacity: 0.35 },
          ],
        },
        {
          kind: 'circle',
          id: 'q2',
          cx: 94,
          cy: 160,
          r: 15,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 0, dy: 0 },
            { atMs: 4400, opacity: 0 },
            { atMs: 5000, opacity: 1 },
            { atMs: 5800, dx: 0, dy: 0 },
            { atMs: 6800, dx: -10, dy: 8, opacity: 0.35 },
            { atMs: 9000, dx: -10, dy: 8, opacity: 0.35 },
          ],
        },
        {
          kind: 'circle',
          id: 'q3',
          cx: 126,
          cy: 160,
          r: 15,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 0, dy: 0 },
            { atMs: 4400, opacity: 0 },
            { atMs: 5000, opacity: 1 },
            { atMs: 5800, dx: 0, dy: 0 },
            { atMs: 6800, dx: 10, dy: 8, opacity: 0.35 },
            { atMs: 9000, dx: 10, dy: 8, opacity: 0.35 },
          ],
        },
        {
          kind: 'label',
          id: 'b4',
          x: 110,
          y: 102,
          text: 'Bậc 4: nhiều chuỗi ghép lại',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4400, opacity: 0 },
            { atMs: 5000, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'b4t',
          x: 110,
          y: 192,
          text: '(vd hemoglobin: 4 chuỗi)',
          size: 9,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4400, opacity: 0 },
            { atMs: 5000, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'b2',
          x: 300,
          y: 36,
          text: 'Bậc 2: xoắn α giữ bằng liên kết hydrogen',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'polyline',
          id: 'xoan',
          points: [
            [240, 60],
            [272, 74],
            [240, 88],
            [272, 102],
            [240, 116],
            [272, 130],
            [240, 144],
            [272, 158],
          ],
          stroke: 'primary',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1200, opacity: 0 },
            { atMs: 1800, opacity: 1 },
            { atMs: 6400, opacity: 1 },
            { atMs: 7000, opacity: 0.3 },
            { atMs: 9000, opacity: 0.3 },
          ],
        },
        {
          kind: 'line',
          id: 'hb1',
          x1: 244,
          y1: 62,
          x2: 244,
          y2: 86,
          stroke: 'accent',
          strokeWidth: 1.8,
          dash: '3 3',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1600, opacity: 0 },
            { atMs: 1900, opacity: 1 },
            { atMs: 5400, opacity: 1 },
            { atMs: 6000, opacity: 0 },
            { atMs: 9000, opacity: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'hb2',
          x1: 244,
          y1: 90,
          x2: 244,
          y2: 114,
          stroke: 'accent',
          strokeWidth: 1.8,
          dash: '3 3',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1600, opacity: 0 },
            { atMs: 1900, opacity: 1 },
            { atMs: 5800, opacity: 1 },
            { atMs: 6400, opacity: 0 },
            { atMs: 9000, opacity: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'hb3',
          x1: 244,
          y1: 118,
          x2: 244,
          y2: 142,
          stroke: 'accent',
          strokeWidth: 1.8,
          dash: '3 3',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1600, opacity: 0 },
            { atMs: 1900, opacity: 1 },
            { atMs: 6200, opacity: 1 },
            { atMs: 6800, opacity: 0 },
            { atMs: 9000, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'cau',
          cx: 370,
          cy: 108,
          r: 44,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2.5,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3000,
              opacity: 0,
            },
            {
              atMs: 3600,
              opacity: 1,
            },
            {
              atMs: 6400,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 0,
            },
            {
              atMs: 9000,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'b3',
          x: 370,
          y: 112,
          text: 'bậc 3',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3000, opacity: 0 },
            { atMs: 3600, opacity: 1 },
            { atMs: 6400, opacity: 1 },
            { atMs: 7000, opacity: 0 },
            { atMs: 9000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'b3t',
          x: 370,
          y: 168,
          text: 'cuộn gọn — có chức năng sinh học',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3000, opacity: 0 },
            { atMs: 3600, opacity: 1 },
            { atMs: 6400, opacity: 1 },
            { atMs: 7000, opacity: 0 },
            { atMs: 9000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'nhiet',
          x: 370,
          y: 62,
          text: 'đun nóng / acid / kim loại nặng',
          size: 10,
          anchor: 'middle',
          fill: 'accent',
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
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'roi',
          points: [
            [320, 96],
            [346, 130],
            [376, 92],
            [402, 136],
            [428, 100],
            [444, 128],
          ],
          stroke: 'primary',
          strokeWidth: 2.5,
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
              atMs: 7400,
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
          id: 'bt',
          x: 370,
          y: 168,
          text: 'biến tính: bung ra, mất chức năng',
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
          id: 'kl',
          x: 235,
          y: 214,
          text: 'Liên kết peptide KHÔNG đứt — chỉ hình dạng không gian bị phá',
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
        {
          kind: 'label',
          id: 'kl2',
          x: 235,
          y: 234,
          text: 'và protein không tự gấp lại được',
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
        { atMs: 0, text: 'Bậc 1: trình tự amino acid nối bằng liên kết peptide.' },
        { atMs: 1800, text: 'Bậc 2: chuỗi cuộn thành xoắn α nhờ liên kết hydrogen (nét đứt).' },
        { atMs: 3600, text: 'Bậc 3: cả đoạn xoắn gấp lại thành khối cầu có chức năng.' },
        { atMs: 4400, text: 'Bậc 4: nhiều chuỗi polypeptide ghép lại, như hemoglobin.' },
        {
          atMs: 6400,
          text: 'Đun nóng: liên kết hydrogen đứt, xoắn duỗi ra, khối cầu bung, các chuỗi rời nhau.',
        },
        {
          atMs: 7900,
          text: 'Liên kết peptide vẫn nguyên; nhưng mất hình dạng là mất chức năng vĩnh viễn.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa12-c3-b11',
    grade: '12',
    chapterNumber: 3,
    chapterTitle: 'Hợp chất chứa nitrogen',
    lessonNumber: 11,
    title: 'Ôn tập chương 3 — Hợp chất chứa nitrogen',
    hook:
      'Hệ thống hoá thế giới hợp chất hữu cơ chứa nitrogen — cầu nối trực tiếp giữa hoá học hữu cơ thuần tuý ' +
      'với thế giới sinh học sống động.',
    theory:
      'HỆ THỐNG HOÁ KIẾN THỨC CHƯƠNG 3:\n' +
      '1. Amine (R−NH₂): Có tính base (béo > NH₃ > thơm). Aniline có tính base yếu không đổi màu quỳ, tạo kết tủa trắng với nước bromine.\n' +
      '2. Amino acid: Có nhóm −NH₂ và −COOH. Tính chất lưỡng tính. Trạng thái ion lưỡng cực rắn. Gly (75), Ala (89), Val (117), Glu (147, quỳ hoá đỏ), Lys (146, quỳ hoá xanh).\n' +
      '3. Peptide: Liên kết −CO−NH− giữa các α-amino acid. Phản ứng màu biuret tạo dung dịch màu tím (tripeptide trở lên). Thuỷ phân cắt liên kết peptide.\n' +
      '4. Protein: Polypeptide khổng lồ. Có phản ứng đông tụ do nhiệt, acid, kiềm. Có phản ứng màu biuret.',
    workedExample: {
      problem: 'Lập sơ đồ phân biệt 3 dung dịch mất nhãn: alanine, lysine, và aniline.',
      steps: [
        'Lấy một ít mỗi dung dịch ra ba ống nghiệm làm mẫu thử.',
        'Nhỏ nước bromine vào các mẫu thử: mẫu xuất hiện kết tủa trắng là aniline.',
        'Dùng giấy quỳ tím nhúng vào 2 mẫu còn lại (alanine, lysine).',
        'Mẫu làm quỳ tím hoá xanh là lysine (chứa 2 nhóm base −NH₂ và 1 nhóm acid −COOH).',
        'Mẫu không làm quỳ tím đổi màu (vẫn màu tím hoặc trung tính) là alanine (chứa 1 nhóm −NH₂ và 1 nhóm −COOH).',
      ],
      answer: 'Dùng nước bromine và quỳ tím',
    },
    checkQuestions: [
      {
        prompt: 'Dung dịch chất nào sau đây làm quỳ tím chuyển sang màu xanh?',
        choices: [
          { id: 'alanine', label: 'Alanine' },
          { id: 'lysine', label: 'Lysine' },
          { id: 'glutamic', label: 'Glutamic acid' },
          { id: 'aniline', label: 'Aniline' },
        ],
        answer: { kind: 'choice', correctIds: ['lysine'] },
        explain:
          'Lysine có 2 nhóm −NH₂ mà chỉ 1 nhóm −COOH nên dung dịch có tính base, làm quỳ tím hoá xanh. Alanine cân bằng 1−1 nên trung tính; glutamic acid dư một nhóm −COOH nên làm quỳ hoá đỏ; aniline có tính base quá yếu, không đủ để đổi màu quỳ tím.',
      },
      {
        prompt: 'Dipeptide Gly-Ala phản ứng được với chất nào sau đây nhờ tính lưỡng tính?',
        choices: [
          { id: 'a', label: 'Cả dung dịch HCl và dung dịch NaOH' },
          { id: 'b', label: 'Chỉ dung dịch HCl' },
          { id: 'c', label: 'Chỉ dung dịch NaOH' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Peptide cấu tạo từ các amino acid còn dư nhóm −NH₂ ở đầu N và −COOH ở đầu C nên vẫn giữ tính chất lưỡng tính, phản ứng với cả acid và base.',
      },
    ],
    srsCards: [
      {
        hoi: 'Chất hữu cơ vừa tác dụng với HCl vừa tác dụng với NaOH là chất có tính chất gì?',
        dap: 'Tính lưỡng tính.',
      },
      { hoi: 'Peptide nào không tạo phức màu tím với Cu(OH)₂/NaOH?', dap: 'Dipeptide.' },
      {
        hoi: 'Muối phenylammonium chloride tan tốt trong nước không?',
        dap: 'Có (vì là muối ion).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
