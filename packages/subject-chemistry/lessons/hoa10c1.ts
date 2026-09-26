// lessons/hoa10c1.ts — Hoá học 10, Chương 1: Cấu tạo nguyên tử (4 bài + Ôn tập).
// Đối chiếu mục lục thật: tai-lieu-sgk/SGK-Hoa/10/page_0004.png (OCR 2026-08-31, xem
// docs/goals/2026-08-31-mon-hoc-toan-ly-hoa-sinh.md). reviewStatus='draft' cho MỌI bài —
// nội dung soạn từ docs/research/kho-kien-thuc-hoa-gdpt2018.md §3, CHƯA qua giáo viên Hoá duyệt.
import type { ChemLesson } from '../lessonTypes.js'

export const HOA10_C1_LESSONS: ChemLesson[] = [
  {
    id: 'hoa10-c1-b1',
    grade: '10',
    chapterNumber: 1,
    chapterTitle: 'Nhập môn Hoá học & Thành phần nguyên tử',
    lessonNumber: 1,
    title: 'Nhập môn Hoá học',
    hook:
      'Vì sao nước đá nổi trên nước lỏng, còn hầu hết chất rắn khác lại chìm trong chất lỏng ' +
      'của chính nó? Câu trả lời nằm ở cấu trúc phân tử — đúng thứ Hoá học nghiên cứu.',
    theory:
      'Hoá học là ngành khoa học nghiên cứu về THÀNH PHẦN, CẤU TRÚC, TÍNH CHẤT và SỰ BIẾN ĐỔI ' +
      'của các chất.\n\n' +
      'Đối tượng nghiên cứu: chất hữu cơ (hợp chất của carbon, trừ một số ít như CO₂, muối ' +
      'carbonate), chất vô cơ, vật liệu tự nhiên và nhân tạo.\n\n' +
      'Vai trò của Hoá học: cung cấp nguyên liệu, vật liệu, thuốc chữa bệnh, phân bón cho sản ' +
      'xuất và đời sống. Ngành công nghiệp hoá học sản xuất hàng triệu tấn hoá chất cơ bản mỗi ' +
      'năm (sulfuric acid, ammonia...).\n\n' +
      'Phương pháp học tốt Hoá học: quan sát hiện tượng → đặt câu hỏi → dự đoán (giả thuyết) → ' +
      'thực nghiệm kiểm chứng → rút ra kết luận. Đây chính là PHƯƠNG PHÁP NGHIÊN CỨU KHOA HỌC, ' +
      'không phải học thuộc lòng.',
    workedExample: {
      problem:
        'Khi cho một viên sủi vitamin C vào cốc nước, ta thấy có bọt khí thoát ra và viên sủi ' +
        'tan dần. Đây là hiện tượng vật lí hay hoá học? Vì sao?',
      steps: [
        'Quan sát: có bọt khí thoát ra — nghĩa là có CHẤT MỚI (khí) được sinh ra, khác với ' +
          'chất ban đầu (viên sủi rắn + nước).',
        'Đối chiếu định nghĩa: hiện tượng hoá học là hiện tượng có sự biến đổi tạo ra CHẤT ' +
          'MỚI. Hiện tượng vật lí chỉ đổi trạng thái hoặc hình dạng, không làm đổi bản chất của chất.',
        'Kết luận: đây là hiện tượng HOÁ HỌC — phản ứng giữa acid trong viên sủi và baking ' +
          'soda tạo khí carbon dioxide (CO₂).',
      ],
      answer: 'Hiện tượng hoá học, vì sinh ra chất mới (khí CO₂).',
    },
    checkQuestions: [
      {
        prompt: 'Hoá học là ngành khoa học nghiên cứu về những gì? (chọn ĐÚNG NHẤT)',
        choices: [
          { id: 'a', label: 'Chỉ nghiên cứu về các nguyên tố kim loại' },
          { id: 'b', label: 'Thành phần, cấu trúc, tính chất và sự biến đổi của các chất' },
          { id: 'c', label: 'Chỉ nghiên cứu phản ứng cháy' },
          { id: 'd', label: 'Chỉ nghiên cứu về nước và không khí' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Đây là định nghĩa chuẩn: Hoá học nghiên cứu THÀNH PHẦN, CẤU TRÚC, TÍNH CHẤT, và SỰ ' +
          'BIẾN ĐỔI của mọi loại chất — không giới hạn ở kim loại hay phản ứng cháy.',
      },
      {
        prompt:
          'Đun nóng chảy một cục nước đá thành nước lỏng. Đây là hiện tượng vật lí hay hoá ' +
          'học?',
        choices: [
          { id: 'vatly', label: 'Vật lí (chỉ đổi trạng thái, vẫn là H₂O)' },
          { id: 'hoahoc', label: 'Hoá học (sinh ra chất mới)' },
        ],
        answer: { kind: 'choice', correctIds: ['vatly'] },
        explain:
          'Nước đá tan chảy chỉ đổi từ thể rắn sang thể lỏng — vẫn là phân tử H₂O, KHÔNG sinh ' +
          'chất mới. Đây là hiện tượng vật lí, không phải hoá học.',
      },
    ],
    srsCards: [
      {
        hoi: 'Hoá học nghiên cứu về gì?',
        dap: 'Thành phần, cấu trúc, tính chất, sự biến đổi của các chất.',
      },
      {
        hoi: 'Hiện tượng hoá học khác hiện tượng vật lí ở điểm nào?',
        dap: 'Hiện tượng hoá học sinh ra CHẤT MỚI; vật lí chỉ đổi trạng thái/hình dạng.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa10-c1-b2',
    grade: '10',
    chapterNumber: 1,
    chapterTitle: 'Nhập môn Hoá học & Thành phần nguyên tử',
    lessonNumber: 2,
    title: 'Thành phần của nguyên tử',
    hook:
      'Nếu phóng to một nguyên tử lên bằng cả sân vận động, hạt nhân của nó chỉ bé bằng một ' +
      'hạt đậu ở giữa sân — phần còn lại gần như trống rỗng, chỉ có electron bay lượn.',
    theory:
      'Nguyên tử gồm HẠT NHÂN (ở giữa) và LỚP VỎ ELECTRON (bao quanh).\n\n' +
      'Hạt nhân gồm hai loại hạt: PROTON (kí hiệu p, điện tích +1, khối lượng ≈ 1 amu) và ' +
      'NEUTRON (kí hiệu n, không mang điện, khối lượng ≈ 1 amu).\n\n' +
      'Lớp vỏ gồm ELECTRON (kí hiệu e, điện tích −1, khối lượng rất nhỏ ≈ 1/1840 amu — coi ' +
      'gần như không đáng kể khi tính khối lượng nguyên tử).\n\n' +
      'Nguyên tử trung hoà về điện ⇒ SỐ PROTON = SỐ ELECTRON (p = e).\n\n' +
      'Khối lượng nguyên tử tập trung gần như hoàn toàn ở hạt nhân: A (số khối) = p + n ' +
      '(coi khối lượng electron không đáng kể).',
    workedExample: {
      problem:
        'Một nguyên tử X có 11 proton, 12 neutron và 11 electron. Tính số khối A của nguyên ' +
        'tử X.',
      steps: [
        'Xác định công thức: số khối A = số proton (p) + số neutron (n).',
        'Thay số: A = 11 + 12 = 23.',
        'Kết luận: nguyên tử X có số khối A = 23 (đây chính là nguyên tử Sodium — Na).',
      ],
      answer: 'A = 23',
    },
    checkQuestions: [
      {
        prompt: 'Hạt nào trong nguyên tử KHÔNG mang điện tích?',
        choices: [
          { id: 'p', label: 'Proton' },
          { id: 'n', label: 'Neutron' },
          { id: 'e', label: 'Electron' },
        ],
        answer: { kind: 'choice', correctIds: ['n'] },
        explain: 'Neutron trung hoà về điện. Proton mang điện tích +1, electron mang điện tích −1.',
      },
      {
        prompt:
          'Một nguyên tử có 17 proton và 18 neutron. Tính số khối A của nguyên tử này (chỉ ' +
          'nhập số, không cần đơn vị).',
        answer: { kind: 'numeric', value: 35 },
        explain: 'A = p + n = 17 + 18 = 35 (đây là nguyên tử Chlorine — Cl, đồng vị Cl-35).',
      },
      {
        prompt:
          'Nguyên tử Y có số electron là 20. Hỏi nguyên tử Y có bao nhiêu proton? (nguyên tử ' +
          'trung hoà điện)',
        answer: { kind: 'numeric', value: 20 },
        explain:
          'Nguyên tử trung hoà về điện ⇒ số proton = số electron = 20. Proton mang điện dương, electron mang điện âm, số điện tích bằng nhau nên tổng điện tích nguyên tử bằng 0.',
      },
    ],
    srsCards: [
      {
        hoi: 'Nguyên tử gồm những phần nào?',
        dap: 'Hạt nhân (proton + neutron) và lớp vỏ electron.',
      },
      {
        hoi: 'Vì sao nguyên tử trung hoà điện?',
        dap: 'Vì số proton (điện tích +) bằng số electron (điện tích −).',
      },
      { hoi: 'Công thức tính số khối A?', dap: 'A = p + n (số proton cộng số neutron).' },
    ],
    // Hoạt ảnh: cho thấy TỈ LỆ kích thước hạt nhân/nguyên tử — điều mà chữ nói mãi vẫn khó hình dung.
    animation: {
      title: 'Nguyên tử: hạt nhân bé xíu ở giữa, electron chuyển động ở lớp vỏ',
      description:
        'Vòng tròn lớn nét đứt là ranh giới lớp vỏ nguyên tử. Ở đúng tâm là một chấm rất nhỏ — ' +
        'hạt nhân, chứa proton (+) và neutron (không mang điện), nắm gần như toàn bộ khối lượng. ' +
        'Hai electron (−) chạy vòng quanh trên lớp vỏ, cho thấy phần lớn thể tích nguyên tử là ' +
        'khoảng trống. Vì số electron bằng số proton nên nguyên tử trung hoà về điện.',
      viewBoxWidth: 400,
      viewBoxHeight: 200,
      durationMs: 4000,
      loop: true,
      shapes: [
        {
          kind: 'circle',
          id: 'vo',
          cx: 200,
          cy: 100,
          r: 70,
          stroke: 'muted',
          strokeWidth: 1.5,
          dash: '5 4',
          fill: 'surface',
        },
        { kind: 'circle', id: 'hatnhan', cx: 200, cy: 100, r: 7, fill: 'primary' },
        {
          kind: 'circle',
          id: 'e1',
          cx: 270,
          cy: 100,
          r: 5,
          fill: 'accent',
          keyframes: [
            { atMs: 0, rotate: 0 },
            { atMs: 4000, rotate: 360 },
          ],
          origin: [200, 100],
        },
        {
          kind: 'circle',
          id: 'e2',
          cx: 130,
          cy: 100,
          r: 5,
          fill: 'accent',
          keyframes: [
            { atMs: 0, rotate: 0 },
            { atMs: 4000, rotate: 360 },
          ],
          origin: [200, 100],
        },
        {
          kind: 'label',
          id: 'nhan-text',
          x: 200,
          y: 88,
          text: 'hạt nhân (p⁺, n)',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'vo-text',
          x: 200,
          y: 190,
          text: 'lớp vỏ electron (e⁻) — gần như trống rỗng',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Hạt nhân nhỏ nhưng nặng: gần như toàn bộ khối lượng nguyên tử nằm ở đây.',
        },
        {
          atMs: 2000,
          text: 'Electron chuyển động quanh hạt nhân; số e⁻ = số p⁺ nên nguyên tử trung hoà điện.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa10-c1-b3',
    grade: '10',
    chapterNumber: 1,
    chapterTitle: 'Nhập môn Hoá học & Thành phần nguyên tử',
    lessonNumber: 3,
    title: 'Nguyên tố hoá học',
    hook:
      'Có bao giờ bạn thắc mắc vì sao vàng luôn là vàng, dù ở dạng nhẫn, dây chuyền hay bụi ' +
      'vàng li ti? Câu trả lời: mọi nguyên tử vàng đều có CHUNG một số proton — đó là "chứng ' +
      'minh thư" của nguyên tố.',
    theory:
      'NGUYÊN TỐ HOÁ HỌC là tập hợp các nguyên tử có CÙNG SỐ PROTON trong hạt nhân (cùng số ' +
      'hiệu nguyên tử Z).\n\n' +
      'SỐ HIỆU NGUYÊN TỬ (Z) = SỐ PROTON. Đây là đại lượng đặc trưng, quyết định nguyên tố ' +
      'đó là gì — đổi Z là đổi hẳn sang nguyên tố khác.\n\n' +
      'Kí hiệu nguyên tử: viết số khối A ở phía trên bên trái và số hiệu Z ở phía dưới bên ' +
      'trái kí hiệu hoá học X. Ví dụ ²³₁₁Na nghĩa là Sodium có Z = 11 và A = 23.\n\n' +
      'ĐỒNG VỊ: các nguyên tử của CÙNG một nguyên tố (cùng Z) nhưng khác số neutron (khác A). ' +
      'Ví dụ Carbon có 3 đồng vị chính: ¹²C, ¹³C, ¹⁴C (đều Z=6, nhưng A khác nhau).\n\n' +
      'NGUYÊN TỬ KHỐI TRUNG BÌNH của một nguyên tố (M̄) tính theo phần trăm số nguyên tử mỗi ' +
      'đồng vị: M̄ = Σ(Aᵢ×xᵢ)/100, với Aᵢ là số khối đồng vị i, xᵢ là % số nguyên tử đồng vị i.',
    workedExample: {
      problem:
        'Nguyên tố Chlorine có 2 đồng vị: ³⁵Cl chiếm 75,77% và ³⁷Cl chiếm 24,23%. Tính nguyên ' +
        'tử khối trung bình của Chlorine (làm tròn 1 chữ số thập phân).',
      steps: [
        'Áp dụng công thức: M̄ = (A₁×x₁ + A₂×x₂) / 100.',
        'Thay số: M̄ = (35×75,77 + 37×24,23) / 100.',
        'Tính tử số: 35×75,77 = 2651,95; 37×24,23 = 896,51. Tổng = 3548,46.',
        'M̄ = 3548,46 / 100 = 35,4846 ≈ 35,5.',
      ],
      answer: 'M̄ ≈ 35,5',
    },
    checkQuestions: [
      {
        prompt: 'Điều gì quyết định hai nguyên tử thuộc CÙNG một nguyên tố hoá học?',
        choices: [
          { id: 'a', label: 'Cùng số proton (cùng Z)' },
          { id: 'b', label: 'Cùng số neutron' },
          { id: 'c', label: 'Cùng số khối A' },
          { id: 'd', label: 'Cùng khối lượng nguyên tử' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Số proton (Z) là đại lượng đặc trưng cho nguyên tố. Hai nguyên tử cùng Z nhưng ' +
          'khác số neutron vẫn là CÙNG một nguyên tố — gọi là đồng vị của nhau.',
      },
      {
        prompt:
          'Nguyên tố Copper (Cu) có 2 đồng vị: ⁶³Cu chiếm 69% và ⁶⁵Cu chiếm 31%. Tính nguyên ' +
          'tử khối trung bình (làm tròn 1 chữ số thập phân, chỉ nhập số).',
        answer: { kind: 'numeric', value: 63.62, tolerance: { mode: 'absolute', eps: 0.1 } },
        explain:
          'M̄ = (63×69 + 65×31)/100 = (4347 + 2015)/100 = 63,62. Đây là nguyên tử khối trung bình theo phần trăm số nguyên tử mỗi đồng vị, không phải trung bình cộng đơn giản của các khối lượng.',
      },
    ],
    srsCards: [
      {
        hoi: 'Định nghĩa nguyên tố hoá học?',
        dap: 'Tập hợp nguyên tử có cùng số proton (cùng Z).',
      },
      {
        hoi: 'Đồng vị là gì?',
        dap: 'Các nguyên tử cùng nguyên tố (cùng Z) nhưng khác số neutron (khác A).',
      },
      {
        hoi: 'Công thức nguyên tử khối trung bình?',
        dap: 'M̄ = Σ(Aᵢ × xᵢ) / 100, với xᵢ là % số nguyên tử đồng vị i.',
      },
    ],
    animation: {
      title: 'Đồng vị của chlorine và nguyên tử khối trung bình 35,5',
      description:
        'Bên trái là hai hạt nhân chlorine: cả hai đều có đúng 17 proton — chính con số 17 đó, chứ không phải số neutron, quyết định đây là nguyên tố chlorine. Hạt nhân trên có 18 neutron (số khối 35), hạt nhân dưới có 20 neutron (số khối 37). Bên phải là thanh tỉ lệ: trong tự nhiên ³⁵Cl chiếm 75% còn ³⁷Cl chỉ 25%. Kim chỉ trượt trên trục số khối và dừng lại ở 35,5 — không phải ở giữa 35 và 37 (tức 36), mà lệch hẳn về phía 35 vì đồng vị 35 nhiều gấp ba. Đó là lý do nguyên tử khối trung bình là một số lẻ, dù không có nguyên tử nào nặng 35,5.',
      viewBoxWidth: 460,
      viewBoxHeight: 230,
      durationMs: 7000,
      loop: true,
      shapes: [
        {
          kind: 'circle',
          id: 'nhan35',
          cx: 80,
          cy: 60,
          r: 30,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 't35',
          x: 80,
          y: 56,
          text: 'Cl-35',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 't35b',
          x: 80,
          y: 72,
          text: '17p + 18n',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'circle',
          id: 'nhan37',
          cx: 80,
          cy: 160,
          r: 30,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 't37',
          x: 80,
          y: 156,
          text: 'Cl-37',
          size: 13,
          anchor: 'middle',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 't37b',
          x: 80,
          y: 172,
          text: '17p + 20n',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'rect',
          id: 'bar35',
          x: 140,
          y: 40,
          w: 165,
          h: 24,
          fill: 'primary',
          rx: 3,
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
              atMs: 1400,
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
          id: 'bar35t',
          x: 222,
          y: 57,
          text: '75%',
          size: 13,
          anchor: 'middle',
          fill: 'surface',
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
              atMs: 1400,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'rect',
          id: 'bar37',
          x: 140,
          y: 140,
          w: 55,
          h: 24,
          fill: 'accent',
          rx: 3,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1400,
              opacity: 0,
            },
            {
              atMs: 2200,
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
          id: 'bar37t',
          x: 167,
          y: 157,
          text: '25%',
          size: 13,
          anchor: 'middle',
          fill: 'surface',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1400,
              opacity: 0,
            },
            {
              atMs: 2200,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'truc',
          x1: 140,
          y1: 205,
          x2: 440,
          y2: 205,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'tk35',
          x: 140,
          y: 222,
          text: '35',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'tk36',
          x: 290,
          y: 222,
          text: '36',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'tk37',
          x: 440,
          y: 222,
          text: '37',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'circle',
          id: 'kim',
          cx: 140,
          cy: 205,
          r: 7,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              opacity: 0,
            },
            {
              atMs: 2600,
              dx: 0,
              opacity: 1,
            },
            {
              atMs: 4600,
              dx: 75,
              opacity: 1,
            },
            {
              atMs: 7000,
              dx: 75,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'kimt',
          x: 140,
          y: 192,
          text: '35,5',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              opacity: 0,
            },
            {
              atMs: 4600,
              dx: 75,
              opacity: 0,
            },
            {
              atMs: 5200,
              dx: 75,
              opacity: 1,
            },
            {
              atMs: 7000,
              dx: 75,
              opacity: 1,
            },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Hai đồng vị chlorine: cùng 17 proton, khác số neutron (18 và 20).',
        },
        {
          atMs: 2200,
          text: 'Trong tự nhiên Cl-35 chiếm 75%, Cl-37 chỉ 25%.',
        },
        {
          atMs: 4800,
          text: 'Trung bình có trọng số: 35·0,75 + 37·0,25 = 35,5 — lệch hẳn về phía 35.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa10-c1-b4',
    grade: '10',
    chapterNumber: 1,
    chapterTitle: 'Nhập môn Hoá học & Thành phần nguyên tử',
    lessonNumber: 4,
    title: 'Cấu trúc lớp vỏ electron nguyên tử',
    hook:
      'Vì sao khí hiếm (như Neon, Argon) gần như không phản ứng với bất kỳ chất nào? Bí mật ' +
      'nằm ở cách các electron "xếp hàng" quanh hạt nhân của chúng.',
    theory:
      'Electron trong nguyên tử được sắp xếp thành từng LỚP (kí hiệu K, L, M, N... hoặc số thứ ' +
      'tự n = 1, 2, 3...), mỗi lớp lại chia thành các PHÂN LỚP (s, p, d, f).\n\n' +
      'Số electron tối đa ở lớp thứ n là 2n²: lớp K (n=1) 2e, lớp L (n=2) 8e, lớp M (n=3) 18e.\n\n' +
      'VÌ SAO lớp M của K (Z=19) và Ca (Z=20) mới có 8e mà electron đã nhảy sang lớp N? Không ' +
      'phải vì "quy tắc bát tử", mà vì electron luôn điền vào PHÂN LỚP CÓ MỨC NĂNG LƯỢNG THẤP ' +
      'HƠN TRƯỚC — mà mức 4s lại THẤP HƠN mức 3d. Vì vậy sau 3p⁶ (8e ở lớp M) electron điền ' +
      'tiếp vào 4s, rồi mới quay lại lấp đầy 3d. Đây là lý do có hiện tượng "chèn mức năng ' +
      'lượng", và cũng là lý do dãy nguyên tố d bắt đầu từ Sc (Z=21).\n\n' +
      'CẤU HÌNH ELECTRON là cách viết electron phân bố vào các phân lớp theo thứ tự mức năng ' +
      'lượng tăng dần: 1s 2s 2p 3s 3p 4s 3d 4p...\n\n' +
      'Điều kiện áp dụng: thứ tự trên đúng cho hầu hết nguyên tố nhóm A của chương trình phổ ' +
      'thông; một số nguyên tố d (Cr, Cu) có cấu hình ngoại lệ vì phân lớp d bán bão hoà/bão ' +
      'hoà bền hơn.\n\n' +
      'Nguyên tố s, p, d, f: gọi theo phân lớp electron cuối cùng được điền — ví dụ Sodium ' +
      '(Na, Z=11) có cấu hình 1s²2s²2p⁶3s¹ → là nguyên tố s (electron cuối ở phân lớp s).\n\n' +
      'ELECTRON LỚP NGOÀI CÙNG quyết định phần lớn tính chất hoá học của nguyên tố — nguyên ' +
      'tử có xu hướng đạt cấu hình bền của khí hiếm (thường là 8 electron lớp ngoài cùng, ' +
      'quy tắc octet).',
    workedExample: {
      problem:
        'Nguyên tử Aluminium (Al) có Z = 13. Viết cấu hình electron và cho biết Al có bao ' +
        'nhiêu electron ở lớp ngoài cùng.',
      steps: [
        'Z = 13 ⇒ nguyên tử Al có 13 electron cần phân bố.',
        'Điền theo thứ tự mức năng lượng tăng dần: 1s² (2e) → 2s² (2e, tổng 4) → 2p⁶ (6e, ' +
          'tổng 10) → 3s² (2e, tổng 12) → 3p¹ (1e, tổng 13).',
        'Cấu hình đầy đủ: 1s²2s²2p⁶3s²3p¹.',
        'Lớp ngoài cùng là lớp n=3 (3s²3p¹) ⇒ có 2+1 = 3 electron lớp ngoài cùng.',
      ],
      answer: 'Cấu hình: 1s²2s²2p⁶3s²3p¹ — có 3 electron lớp ngoài cùng.',
    },
    checkQuestions: [
      {
        prompt: 'Số electron tối đa ở lớp K (n=1) là bao nhiêu?',
        answer: { kind: 'numeric', value: 2 },
        explain: 'Công thức 2n² với n=1 cho 2×1²=2. Lớp K chỉ có phân lớp 1s, tối đa 2 electron.',
      },
      {
        prompt: 'Nguyên tử Magnesium (Mg) có Z=12. Có bao nhiêu electron ở lớp ngoài cùng của Mg?',
        answer: { kind: 'numeric', value: 2 },
        explain:
          'Cấu hình Mg: 1s²2s²2p⁶3s². Lớp ngoài cùng (n=3) chỉ có phân lớp 3s² ⇒ 2 electron ' +
          'lớp ngoài cùng — đây là lý do Mg dễ nhường 2 electron để đạt cấu hình bền.',
      },
      {
        // Câu BẪY: lỗi phổ biến là "lớp M chứa tối đa 18e nên K (Z=19) có 9e ở lớp M".
        prompt:
          'Nguyên tử Potassium (K) có Z = 19. Hỏi K có bao nhiêu electron ở LỚP NGOÀI CÙNG? ' +
          '(chỉ nhập số)',
        answer: { kind: 'numeric', value: 1 },
        explain:
          'Rất nhiều bạn trả lời 9 vì nghĩ "lớp M chứa tối đa 18e nên cứ điền tiếp vào lớp M". ' +
          'Sai ở chỗ: electron điền theo MỨC NĂNG LƯỢNG, mà 4s thấp hơn 3d. Sau 1s²2s²2p⁶3s²3p⁶ ' +
          '(18e) thì electron thứ 19 vào 4s, cho cấu hình 1s²2s²2p⁶3s²3p⁶4s¹. Lớp ngoài cùng là ' +
          'lớp N (n=4) với đúng 1 electron — đó mới là lý do K là kim loại kiềm rất hoạt động.',
      },
    ],
    srsCards: [
      { hoi: 'Số electron tối đa ở lớp thứ n?', dap: '2n² (lớp K: 2e, lớp L: 8e...).' },
      {
        hoi: 'Nguyên tố s/p/d/f được gọi theo đâu?',
        dap: 'Theo phân lớp electron CUỐI CÙNG được điền vào.',
      },
      {
        hoi: 'Điều gì quyết định phần lớn tính chất hoá học của nguyên tố?',
        dap: 'Số electron ở lớp ngoài cùng.',
      },
    ],
    // Hoạt ảnh: electron được điền LẦN LƯỢT từ lớp trong ra lớp ngoài — thứ tự này là cái
    // học sinh hay làm sai khi viết cấu hình.
    animation: {
      title: 'Điền electron vào các lớp: nguyên tử Sodium (Na, Z = 11)',
      description:
        'Ba vòng tròn đồng tâm là ba lớp electron K (trong cùng), L (giữa), M (ngoài cùng). ' +
        'Electron xuất hiện lần lượt từ trong ra ngoài: 2 electron điền đầy lớp K, rồi 8 ' +
        'electron điền đầy lớp L, và electron thứ 11 nằm một mình ở lớp M. Cấu hình thu được ' +
        'là 1s²2s²2p⁶3s¹ — đúng một electron ở lớp ngoài cùng, nên Na rất dễ nhường 1 electron ' +
        'để thành ion Na⁺ có cấu hình bền như khí hiếm Neon.',
      viewBoxWidth: 400,
      viewBoxHeight: 220,
      durationMs: 5000,
      loop: true,
      shapes: [
        {
          kind: 'circle',
          id: 'lop-k',
          cx: 200,
          cy: 110,
          r: 28,
          stroke: 'muted',
          strokeWidth: 1,
          dash: '4 3',
        },
        {
          kind: 'circle',
          id: 'lop-l',
          cx: 200,
          cy: 110,
          r: 58,
          stroke: 'muted',
          strokeWidth: 1,
          dash: '4 3',
        },
        {
          kind: 'circle',
          id: 'lop-m',
          cx: 200,
          cy: 110,
          r: 88,
          stroke: 'muted',
          strokeWidth: 1,
          dash: '4 3',
        },
        { kind: 'circle', id: 'nhan', cx: 200, cy: 110, r: 10, fill: 'primary' },
        {
          kind: 'circle',
          id: 'k1',
          cx: 228,
          cy: 110,
          r: 4,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 400, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'k2',
          cx: 172,
          cy: 110,
          r: 4,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 800, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'l1',
          cx: 258,
          cy: 110,
          r: 4,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 1000, opacity: 0 },
            { atMs: 1300, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'l2',
          cx: 241,
          cy: 151,
          r: 4,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 1200, opacity: 0 },
            { atMs: 1500, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'l3',
          cx: 200,
          cy: 168,
          r: 4,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 1400, opacity: 0 },
            { atMs: 1700, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'l4',
          cx: 159,
          cy: 151,
          r: 4,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 1600, opacity: 0 },
            { atMs: 1900, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'l5',
          cx: 142,
          cy: 110,
          r: 4,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 1800, opacity: 0 },
            { atMs: 2100, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'l6',
          cx: 159,
          cy: 69,
          r: 4,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 2000, opacity: 0 },
            { atMs: 2300, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'l7',
          cx: 200,
          cy: 52,
          r: 4,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 2200, opacity: 0 },
            { atMs: 2500, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'l8',
          cx: 241,
          cy: 69,
          r: 4,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 2400, opacity: 0 },
            { atMs: 2700, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'm1',
          cx: 288,
          cy: 110,
          r: 5,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 3000, opacity: 0 },
            { atMs: 3400, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-t',
          x: 200,
          y: 114,
          text: 'Na',
          size: 10,
          anchor: 'middle',
          fill: 'surface',
        },
        {
          kind: 'label',
          id: 'ghi-k',
          x: 200,
          y: 212,
          text: 'K: 2e · L: 8e · M: 1e ⇒ 1s²2s²2p⁶3s¹',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Lớp K (gần hạt nhân nhất, năng lượng thấp nhất) được điền trước: 2 electron.',
        },
        { atMs: 1000, text: 'Lớp L điền tiếp cho đủ 8 electron.' },
        {
          atMs: 3000,
          text: 'Electron thứ 11 ra lớp M, đứng một mình — Na rất dễ nhường electron này.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
]
