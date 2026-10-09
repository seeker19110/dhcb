// lessons/toan12c5.ts — Toán 12, Chương 5: Phương pháp toạ độ trong không gian.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN12_C5_LESSONS: MathLesson[] = [
  {
    id: 'toan12-c5-b1',
    grade: '12',
    chapterNumber: 5,
    chapterTitle: 'Phương pháp toạ độ trong không gian',
    lessonNumber: 1,
    title: 'Hệ toạ độ Oxyz và tích có hướng của hai vectơ',
    hook:
      'Máy bay của Vietnam Airlines báo vị trí bằng ba con số: kinh độ, vĩ độ và độ cao. Đài kiểm soát không lưu ' +
      'phải tính khoảng cách giữa hai máy bay và biết chúng có nguy cơ cắt đường bay nhau không — tất cả bằng tính ' +
      'toán trên ba con số ấy, không vẽ hình nào cả. Đó chính là sức mạnh của phương pháp toạ độ trong không gian.',
    theory:
      'HỆ TRỤC Oxyz\n' +
      'Gồm ba trục đôi một vuông góc với các vectơ đơn vị i→ = (1;0;0), j→ = (0;1;0), k→ = (0;0;1). Mỗi điểm M ứng ' +
      'với bộ ba (x; y; z).\n\n' +
      'CÁC CÔNG THỨC MỞ RỘNG TỰ NHIÊN TỪ MẶT PHẲNG\n' +
      '— Vectơ AB→ = (x_B − x_A; y_B − y_A; z_B − z_A).\n' +
      '— Độ dài: |u→| = √(x² + y² + z²).\n' +
      '— Tích vô hướng: u→·v→ = x₁x₂ + y₁y₂ + z₁z₂; vẫn giữ nguyên tính chất u→ ⊥ v→ ⇔ u→·v→ = 0.\n' +
      '— Trung điểm, trọng tâm: lấy trung bình cộng từng toạ độ.\n' +
      'Tất cả chỉ là "thêm một thành phần z" vào công thức đã học ở lớp 10 — đó là vì hệ ba trục cũng vuông góc đôi ' +
      'một như hệ hai trục, nên định lí Pythagore vẫn áp dụng được y hệt.\n\n' +
      'TÍCH CÓ HƯỚNG — CÔNG CỤ MỚI CHỈ CÓ TRONG KHÔNG GIAN\n' +
      '[u→, v→] = (y₁z₂ − z₁y₂; z₁x₂ − x₁z₂; x₁y₂ − y₁x₂).\n' +
      'ĐIỂM KHÁC CĂN BẢN VỚI TÍCH VÔ HƯỚNG: kết quả là một VECTƠ, không phải một số. Và vectơ ấy VUÔNG GÓC với cả ' +
      'u→ lẫn v→.\n' +
      'VÌ SAO CẦN NÓ: trong mặt phẳng, từ một vectơ ta suy ngay ra vectơ vuông góc bằng mẹo "đổi chỗ đổi dấu". Trong ' +
      'không gian, có VÔ SỐ hướng vuông góc với một vectơ cho trước, nên phải có hai vectơ mới xác định được hướng ' +
      'vuông góc duy nhất. Tích có hướng làm đúng việc đó, và nó là chìa khoá để viết phương trình mặt phẳng.\n\n' +
      'BỐN ỨNG DỤNG PHẢI THUỘC\n' +
      '1. [u→, v→] = 0→ ⇔ u→ và v→ CÙNG PHƯƠNG. Đây là cách kiểm ba điểm thẳng hàng.\n' +
      '2. Diện tích tam giác ABC = (1/2)·|[AB→, AC→]|.\n' +
      '3. Thể tích khối hộp = |[AB→, AD→]·AA′→| (tích hỗn tạp).\n' +
      '4. Thể tích tứ diện ABCD = (1/6)·|[AB→, AC→]·AD→|. Hệ quả: bốn điểm ĐỒNG PHẲNG khi và chỉ khi tích hỗn tạp ' +
      'bằng 0 (thể tích bằng 0).\n\n' +
      'LƯU Ý VỀ THỨ TỰ: tích có hướng KHÔNG giao hoán — [u→, v→] = −[v→, u→]. Đổi thứ tự thì vectơ đảo chiều. Điều ' +
      'này không ảnh hưởng khi tính diện tích hay thể tích (vì đã lấy giá trị tuyệt đối) nhưng ảnh hưởng khi ta cần ' +
      'chọn hướng pháp tuyến cụ thể.',
    workedExample: {
      problem: 'Cho ba điểm A(1; 0; 0), B(0; 2; 0), C(0; 0; 3). Tính diện tích tam giác ABC.',
      steps: [
        'Bước 1 — Lập hai vectơ xuất phát từ cùng một đỉnh (bắt buộc phải cùng gốc thì công thức mới đúng): ' +
          'AB→ = (0−1; 2−0; 0−0) = (−1; 2; 0) và AC→ = (−1; 0; 3).',
        'Bước 2 — Chọn công cụ: diện tích tam giác trong không gian không tính được bằng công thức đáy nhân cao nếu ' +
          'chưa biết chân đường cao; tích có hướng cho ngay kết quả nên ưu tiên dùng.',
        'Bước 3 — Tính [AB→, AC→] theo công thức: thành phần x = 2·3 − 0·0 = 6; thành phần y = 0·(−1) − (−1)·3 = 3; ' +
          'thành phần z = (−1)·0 − 2·(−1) = 2. Vậy [AB→, AC→] = (6; 3; 2).',
        'Bước 4 — Kiểm chứng nhanh kết quả bằng tính vuông góc: (6;3;2)·(−1;2;0) = −6 + 6 + 0 = 0, đúng vuông góc ' +
          'với AB→. Đây là cách tự kiểm rất đáng làm vì công thức tích có hướng dễ nhầm dấu.',
        'Bước 5 — Tính độ dài rồi chia đôi: |[AB→, AC→]| = √(36 + 9 + 4) = √49 = 7, nên diện tích tam giác ' +
          'S = 7/2 = 3,5.',
      ],
      answer: 'Diện tích tam giác ABC bằng 3,5 (đơn vị diện tích).',
    },
    checkQuestions: [
      {
        prompt: 'Cho A(1; 2; 3) và B(4; 6; 15). Tính độ dài đoạn thẳng AB.',
        answer: { kind: 'numeric', value: 13 },
        explain:
          'AB→ = (3; 4; 12) nên AB = √(9 + 16 + 144) = √169 = 13. Lỗi hay gặp là quên bình phương một thành phần, ' +
          'hoặc cộng thẳng 3 + 4 + 12 = 19. Công thức trong không gian chỉ là Pythagore áp dụng hai lần, nên vẫn ' +
          'phải bình phương đủ cả ba thành phần rồi mới khai căn.',
      },
      {
        prompt: 'Kết quả của tích có hướng [u→, v→] là một số hay một vectơ?',
        choices: [
          { id: 'so', label: 'Một số thực' },
          { id: 'vecto', label: 'Một vectơ vuông góc với cả u→ và v→' },
          { id: 'vecto_cung', label: 'Một vectơ cùng phương với u→' },
        ],
        answer: { kind: 'choice', correctIds: ['vecto'] },
        explain:
          'Đây là nhầm lẫn hay gặp nhất khi mới học vì hai phép toán có tên gần giống nhau. Tích VÔ HƯỚNG cho một ' +
          'SỐ (dùng để xét góc và tính độ dài); tích CÓ HƯỚNG cho một VECTƠ vuông góc với cả hai vectơ ban đầu (dùng ' +
          'để tìm pháp tuyến mặt phẳng, tính diện tích, thể tích). Mẹo nhớ: "có hướng" nghĩa là kết quả CÓ hướng, ' +
          'tức là vectơ.',
      },
      {
        prompt:
          'Cho u→ = (1; 2; 3) và v→ = (2; 4; 6). Tích có hướng [u→, v→] bằng vectơ không. Điều đó cho biết hai vectơ ' +
          'này có quan hệ gì?',
        choices: [
          { id: 'vuong', label: 'Vuông góc với nhau' },
          { id: 'cung_phuong', label: 'Cùng phương với nhau' },
          { id: 'khong_lien_quan', label: 'Không có quan hệ đặc biệt' },
        ],
        answer: { kind: 'choice', correctIds: ['cung_phuong'] },
        explain:
          'Tích có hướng bằng vectơ không khi và chỉ khi hai vectơ CÙNG PHƯƠNG. Ở đây thấy ngay v→ = 2u→. Bẫy ở chỗ ' +
          'nhiều bạn nhớ nhầm sang quy tắc của tích VÔ HƯỚNG: tích vô hướng bằng 0 mới là vuông góc. Hai quy tắc ' +
          'ngược nhau về ý nghĩa nên rất dễ lẫn — hãy gắn với hình ảnh: hai vectơ cùng phương không "căng" ra được ' +
          'một mặt phẳng nào, nên không có hướng vuông góc để trả về.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tích có hướng của hai vectơ cho ra cái gì?',
        dap: 'Một VECTƠ vuông góc với cả hai vectơ ban đầu (khác tích vô hướng cho một số).',
      },
      {
        hoi: 'Diện tích tam giác ABC tính bằng tích có hướng thế nào?',
        dap: 'S = (1/2)·|[AB→, AC→]| với hai vectơ cùng xuất phát từ A.',
      },
      {
        hoi: '[u→, v→] = 0→ có nghĩa gì?',
        dap: 'Hai vectơ cùng phương. (Còn u→·v→ = 0 mới là vuông góc.)',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan12-c5-b2',
    grade: '12',
    chapterNumber: 5,
    chapterTitle: 'Phương pháp toạ độ trong không gian',
    lessonNumber: 2,
    title: 'Phương trình mặt phẳng và mặt cầu',
    hook:
      'Máy in 3D dựng một vật thể bằng cách cắt nó thành hàng nghìn lát mỏng song song. Mỗi lát là giao của vật thể ' +
      'với một MẶT PHẲNG, và phần mềm phải mô tả mỗi mặt phẳng ấy bằng đúng bốn con số. Bốn con số nào, và vì sao ' +
      'chỉ cần bốn?',
    theory:
      'PHƯƠNG TRÌNH TỔNG QUÁT CỦA MẶT PHẲNG\n' +
      'Ax + By + Cz + D = 0 với A, B, C không đồng thời bằng 0. Vectơ n→ = (A; B; C) là VECTƠ PHÁP TUYẾN, tức vectơ ' +
      'vuông góc với mặt phẳng.\n' +
      'VÌ SAO CHỈ CẦN BỐN SỐ: một mặt phẳng được xác định hoàn toàn bởi HAI thông tin — hướng (do pháp tuyến quyết ' +
      'định, ba số A, B, C) và vị trí (một số D cho biết mặt phẳng cách gốc bao xa theo hướng ấy). Đó chính là bốn ' +
      'số máy in 3D cần.\n\n' +
      'MẶT PHẲNG QUA ĐIỂM M₀(x₀; y₀; z₀) CÓ PHÁP TUYẾN n→ = (A; B; C):\n' +
      'A(x − x₀) + B(y − y₀) + C(z − z₀) = 0.\n' +
      'Cách dựng công thức: điểm M thuộc mặt phẳng khi M₀M→ vuông góc với n→, tức tích vô hướng bằng 0. Không cần ' +
      'học thuộc, chỉ cần nhớ điều kiện vuông góc.\n\n' +
      'CÁCH TÌM PHÁP TUYẾN TRONG BA TÌNH HUỐNG THƯỜNG GẶP\n' +
      '1. Mặt phẳng qua ba điểm A, B, C: lấy n→ = [AB→, AC→] (tích có hướng).\n' +
      '2. Mặt phẳng song song với mặt phẳng đã cho: dùng CHUNG pháp tuyến, chỉ đổi D.\n' +
      '3. Mặt phẳng vuông góc với một đường thẳng: lấy vectơ chỉ phương của đường thẳng ấy làm pháp tuyến.\n\n' +
      'KHOẢNG CÁCH TỪ ĐIỂM ĐẾN MẶT PHẲNG\n' +
      'd(M; (P)) = |Ax₀ + By₀ + Cz₀ + D| / √(A² + B² + C²).\n' +
      'Cấu trúc giống hệt công thức trong mặt phẳng, chỉ thêm thành phần z. Vẫn phải có dấu giá trị tuyệt đối, và ' +
      'phương trình phải ở dạng vế phải bằng 0.\n\n' +
      'MẶT CẦU\n' +
      'Tâm I(a; b; c), bán kính R: (x − a)² + (y − b)² + (z − c)² = R².\n' +
      'Dạng khai triển x² + y² + z² − 2ax − 2by − 2cz + d = 0 là mặt cầu khi và chỉ khi a² + b² + c² − d > 0, và khi ' +
      'đó R = √(a² + b² + c² − d). Điều kiện này bắt buộc phải kiểm, y như với đường tròn ở lớp 10.\n\n' +
      'VỊ TRÍ TƯƠNG ĐỐI GIỮA MẶT PHẲNG VÀ MẶT CẦU: so sánh d(I; (P)) với R. Lớn hơn thì không cắt; bằng thì TIẾP ' +
      'XÚC tại một điểm; nhỏ hơn thì cắt theo một ĐƯỜNG TRÒN có bán kính r = √(R² − d²) — công thức này chỉ là ' +
      'Pythagore trong tam giác vuông tạo bởi bán kính mặt cầu, khoảng cách d và bán kính đường tròn giao tuyến.',
    animation: {
      title: 'So d với R để biết mặt cầu cắt, tiếp xúc hay rời mặt phẳng',
      description:
        'Hình vẽ là lát cắt vuông góc: mặt phẳng (P) hiện ra thành một đường thẳng, mặt cầu tâm I bán kính R = 45 đơn vị hiện ra thành một đường tròn, còn vectơ pháp tuyến n dựng vuông góc với (P). Mặt cầu hạ dần xuống qua ba vị trí. Vị trí đầu, tâm I cách (P) 110 đơn vị, lớn hơn R, đường tròn không chạm đường thẳng: mặt cầu và mặt phẳng không có điểm chung. Vị trí giữa, khoảng cách đúng bằng 45 tức bằng R, đường tròn chạm đường thẳng tại đúng một điểm: tiếp xúc, và điểm chạm chính là hình chiếu của I trên (P). Vị trí cuối, khoảng cách còn 25 nhỏ hơn R, đường tròn cắt đường thẳng ở hai chỗ: giao tuyến là một đường tròn thật. Hình động cho thấy cả ba trường hợp là MỘT hiện tượng liên tục, chỉ phân biệt bằng phép so d với R.',
      viewBoxWidth: 320,
      viewBoxHeight: 240,
      durationMs: 7500,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'mat-phang',
          x1: 20,
          y1: 190,
          x2: 300,
          y2: 190,
          stroke: 'muted',
          strokeWidth: 3,
        },
        {
          kind: 'label',
          id: 'nhan-mp',
          x: 14,
          y: 208,
          text: '(P): Ax + By + Cz + D = 0',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'arrow',
          id: 'phap-tuyen',
          x1: 60,
          y1: 190,
          x2: 60,
          y2: 140,
          stroke: 'accent',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'nhan-n',
          x: 68,
          y: 146,
          text: 'n',
          size: 13,
          fill: 'accent',
        },
        {
          kind: 'circle',
          id: 'mat-cau',
          cx: 180,
          cy: 80,
          r: 45,
          stroke: 'primary',
          strokeWidth: 3,
          keyframes: [
            {
              atMs: 0,
              dy: 0,
            },
            {
              atMs: 2000,
              dy: 0,
            },
            {
              atMs: 3200,
              dy: 65,
            },
            {
              atMs: 5000,
              dy: 65,
            },
            {
              atMs: 6000,
              dy: 85,
            },
            {
              atMs: 7500,
              dy: 85,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'tam-i',
          cx: 180,
          cy: 80,
          r: 4,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dy: 0,
            },
            {
              atMs: 2000,
              dy: 0,
            },
            {
              atMs: 3200,
              dy: 65,
            },
            {
              atMs: 5000,
              dy: 65,
            },
            {
              atMs: 6000,
              dy: 85,
            },
            {
              atMs: 7500,
              dy: 85,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-i',
          x: 190,
          y: 76,
          text: 'I, R = 45',
          size: 13,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dy: 0,
            },
            {
              atMs: 2000,
              dy: 0,
            },
            {
              atMs: 3200,
              dy: 65,
            },
            {
              atMs: 5000,
              dy: 65,
            },
            {
              atMs: 6000,
              dy: 85,
            },
            {
              atMs: 7500,
              dy: 85,
            },
          ],
        },
        {
          kind: 'line',
          id: 'khoang-cach',
          x1: 180,
          y1: 35,
          x2: 180,
          y2: 190,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '5 4',
          keyframes: [
            {
              atMs: 0,
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
          id: 'th-1',
          x: 60,
          y: 22,
          text: 'd = 110 > R: không điểm chung',
          size: 13,
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 400,
              opacity: 1,
            },
            {
              atMs: 2000,
              opacity: 1,
            },
            {
              atMs: 2400,
              opacity: 0,
            },
            {
              atMs: 7500,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'th-2',
          x: 60,
          y: 22,
          text: 'd = 45 = R: tiếp xúc tại 1 điểm',
          size: 13,
          fill: 'accent',
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
              atMs: 5000,
              opacity: 1,
            },
            {
              atMs: 5400,
              opacity: 0,
            },
            {
              atMs: 7500,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'th-3',
          x: 60,
          y: 22,
          text: 'd = 25 < R: cắt theo một đường tròn',
          size: 13,
          fill: 'primary',
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
              atMs: 7500,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'diem-tiep',
          cx: 180,
          cy: 190,
          r: 5,
          fill: 'correct',
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
              atMs: 3600,
              opacity: 1,
            },
            {
              atMs: 5200,
              opacity: 1,
            },
            {
              atMs: 5400,
              opacity: 0,
            },
            {
              atMs: 7500,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'ct',
          x: 160,
          y: 232,
          text: 'd(I, (P)) = |Ax₀ + By₀ + Cz₀ + D| / √(A² + B² + C²)',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
        },
      ],
      captions: [
        {
          atMs: 400,
          text: 'Tâm I cách (P) 110 đơn vị, lớn hơn R = 45: mặt cầu treo hẳn phía trên.',
        },
        {
          atMs: 3600,
          text: 'Hạ xuống đến khi d = R = 45: chạm đúng một điểm, chính là hình chiếu của I.',
        },
        {
          atMs: 6400,
          text: 'Hạ tiếp, d = 25 < R: lát cắt cho hai giao điểm, tức mặt cầu cắt (P) theo một đường tròn.',
        },
        {
          atMs: 7200,
          text: 'Cả ba trường hợp chỉ khác nhau ở phép so d với R.',
        },
      ],
    },
    workedExample: {
      problem:
        'Viết phương trình mặt phẳng đi qua ba điểm A(1; 0; 0), B(0; 2; 0), C(0; 0; 3), rồi tính khoảng cách từ gốc ' +
        'toạ độ O đến mặt phẳng đó.',
      steps: [
        'Bước 1 — Lập hai vectơ chỉ phương nằm trong mặt phẳng: AB→ = (−1; 2; 0) và AC→ = (−1; 0; 3).',
        'Bước 2 — Tìm pháp tuyến bằng tích có hướng (chọn cách này vì pháp tuyến phải vuông góc với cả hai vectơ ' +
          'trên): n→ = [AB→, AC→] = (6; 3; 2), đã tính ở bài trước.',
        'Bước 3 — Viết phương trình qua điểm A(1; 0; 0) với pháp tuyến vừa tìm: 6(x − 1) + 3(y − 0) + 2(z − 0) = 0, ' +
          'rút gọn thành 6x + 3y + 2z − 6 = 0.',
        'Bước 4 — Kiểm chứng bằng cách thay hai điểm còn lại: với B(0;2;0) được 0 + 6 + 0 − 6 = 0, đúng; với ' +
          'C(0;0;3) được 0 + 0 + 6 − 6 = 0, đúng. Cả ba điểm đều thuộc mặt phẳng.',
        'Bước 5 — Tính khoảng cách từ O(0;0;0): d = |6·0 + 3·0 + 2·0 − 6| / √(36 + 9 + 4) = 6/7 ≈ 0,857.',
      ],
      answer: 'Mặt phẳng 6x + 3y + 2z − 6 = 0; khoảng cách từ O bằng 6/7.',
    },
    checkQuestions: [
      {
        prompt: 'Mặt phẳng 2x − 3y + z − 5 = 0 có một vectơ pháp tuyến là vectơ nào?',
        choices: [
          { id: 'a', label: '(2; −3; 1)' },
          { id: 'b', label: '(2; −3; 1; −5)' },
          { id: 'c', label: '(−5; 2; −3)' },
          { id: 'd', label: '(2; 3; 1)' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Pháp tuyến lấy đúng ba hệ số của x, y, z theo thứ tự, KHÔNG lấy hằng số tự do: n→ = (2; −3; 1). Hai lỗi ' +
          'hay gặp: kéo cả số −5 vào (vectơ trong không gian chỉ có ba thành phần, và D chỉ quyết định vị trí chứ ' +
          'không quyết định hướng); và bỏ mất dấu âm của hệ số y.',
      },
      {
        prompt:
          'Tính khoảng cách từ điểm M(1; 1; 1) đến mặt phẳng x + 2y + 2z − 12 = 0. ' +
          '(Nhập dạng phân số tối giản, ví dụ 5/3.)',
        answer: { kind: 'fraction', num: 7, den: 3 },
        explain:
          'd = |1 + 2 + 2 − 12| / √(1 + 4 + 4) = |−7|/3 = 7/3 ≈ 2,33. Hai lỗi kinh điển: quên giá trị tuyệt đối rồi ' +
          'ghi đáp số âm (khoảng cách không bao giờ âm), và quên khai căn ở mẫu (chia cho 9 ra 0,78).',
      },
      {
        prompt:
          'Phương trình x² + y² + z² − 2x + 4y − 6z + 20 = 0 có biểu diễn một mặt cầu không? ' +
          'Nhập 1 nếu CÓ, 0 nếu KHÔNG.',
        answer: { kind: 'numeric', value: 0 },
        explain:
          'Đối chiếu dạng chuẩn: a = 1, b = −2, c = 3, d = 20. Điều kiện tồn tại mặt cầu là a² + b² + c² − d > 0, ' +
          'nhưng ở đây 1 + 4 + 9 − 20 = −6 < 0. Không có điểm nào thoả mãn, nên đây KHÔNG phải mặt cầu. Bẫy là thấy ' +
          'phương trình "đúng dạng" liền kết luận ngay — luôn phải kiểm điều kiện, nhất là trong bài có tham số. ' +
          'Nếu biểu thức ấy bằng đúng 0 thì tập hợp chỉ còn một điểm duy nhất.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phương trình mặt phẳng qua M₀ với pháp tuyến (A;B;C)?',
        dap: 'A(x−x₀) + B(y−y₀) + C(z−z₀) = 0 — xuất phát từ điều kiện M₀M→ vuông góc pháp tuyến.',
      },
      {
        hoi: 'Cách tìm pháp tuyến của mặt phẳng qua ba điểm A, B, C?',
        dap: 'Lấy tích có hướng n→ = [AB→, AC→].',
      },
      {
        hoi: 'Khi mặt phẳng cắt mặt cầu, bán kính đường tròn giao tuyến bằng bao nhiêu?',
        dap: 'r = √(R² − d²) với d là khoảng cách từ tâm mặt cầu tới mặt phẳng.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan12-c5-b3',
    grade: '12',
    chapterNumber: 5,
    chapterTitle: 'Phương pháp toạ độ trong không gian',
    lessonNumber: 3,
    title: 'Phương trình đường thẳng trong không gian',
    hook:
      'Hai chiếc flycam của một đội quay phim cùng bay trên khu phố cổ Hà Nội, mỗi chiếc theo một đường thẳng. ' +
      'Người điều khiển phải biết hai đường bay có CẮT nhau (nguy cơ va chạm) hay chỉ lướt qua nhau ở hai độ cao ' +
      'khác nhau. Trên mặt phẳng, hai đường thẳng không song song thì chắc chắn cắt nhau; trong không gian điều ' +
      'đó không còn đúng nữa, và phần mềm kiểm tra bằng một phép tính rất gọn.',
    theory:
      'VECTƠ CHỈ PHƯƠNG\n' +
      'Vectơ u→ ≠ 0→ là vectơ chỉ phương (VTCP) của đường thẳng d nếu giá của nó song song hoặc trùng với d. Một ' +
      'đường thẳng có VÔ SỐ VTCP: nhân u→ với số khác 0 vẫn được VTCP mới, nên (1; 2; 3) và (2; 4; 6) cùng mô tả ' +
      'một hướng.\n' +
      'VÌ SAO chỉ cần một điểm và một vectơ: qua điểm M₀ có đúng một đường thẳng theo hướng u→. Điểm M thuộc ' +
      'đường đó khi M₀M→ cùng phương với u→, tức là M₀M→ = t·u→ với một số thực t nào đó.\n\n' +
      'PHƯƠNG TRÌNH THAM SỐ\n' +
      'd đi qua M₀(x₀; y₀; z₀), có VTCP u→ = (a; b; c):\n' +
      'x = x₀ + at, y = y₀ + bt, z = z₀ + ct (t ∈ ℝ).\n' +
      'Mỗi giá trị t cho đúng một điểm của d. Điểm M thuộc d khi và chỉ khi tồn tại MỘT giá trị t DÙNG CHUNG cho ' +
      'cả ba phương trình. Bẫy hay gặp: tìm t từ phương trình của x rồi quên thử lại với y và z.\n\n' +
      'PHƯƠNG TRÌNH CHÍNH TẮC\n' +
      '(x − x₀)/a = (y − y₀)/b = (z − z₀)/c.\n' +
      'CHỈ viết được khi cả ba thành phần a, b, c đều KHÁC 0, vì không được chia cho 0. Nếu một thành phần bằng 0, ' +
      'chẳng hạn b = 0, thì y luôn bằng y₀ và ta giữ dạng tham số (hoặc viết (x − x₀)/a = (z − z₀)/c kèm y = y₀).\n\n' +
      'ĐƯỜNG THẲNG QUA HAI ĐIỂM A, B: lấy u→ = AB→ làm VTCP, điểm đi qua là A (hoặc B).\n\n' +
      'VỊ TRÍ TƯƠNG ĐỐI CỦA HAI ĐƯỜNG THẲNG\n' +
      'Cho d₁ qua M₁ có VTCP u₁→ và d₂ qua M₂ có VTCP u₂→. Trong không gian có BỐN khả năng (nhiều hơn mặt phẳng ' +
      'một khả năng: chéo nhau).\n' +
      '— Nếu [u₁→, u₂→] = 0→ (hai VTCP cùng phương): d₁ song song hoặc trùng d₂. Lấy M₁ thử vào d₂: thuộc thì ' +
      'TRÙNG, không thuộc thì SONG SONG.\n' +
      '— Nếu [u₁→, u₂→] ≠ 0→ (không cùng phương): tính tích hỗn tạp [u₁→, u₂→]·M₁M₂→. Bằng 0 thì hai đường ' +
      'CẮT nhau; khác 0 thì CHÉO nhau.\n' +
      'VÌ SAO tích hỗn tạp quyết định được: giá trị tuyệt đối của nó là thể tích khối hộp dựng trên ba vectơ u₁→, ' +
      'u₂→, M₁M₂→. Thể tích bằng 0 nghĩa là ba vectơ đồng phẳng, tức hai đường nằm trong cùng một mặt phẳng; đã ' +
      'không song song mà cùng mặt phẳng thì phải cắt. Còn khác 0 thì không có mặt phẳng nào chứa cả hai: chéo nhau.\n' +
      'Bẫy: "không có điểm chung" CHƯA đủ để kết luận song song, vì chéo nhau cũng không có điểm chung. Phải xét ' +
      'hướng trước, rồi mới xét tích hỗn tạp.\n\n' +
      'ĐƯỜNG THẲNG VÀ MẶT PHẲNG\n' +
      'd có VTCP u→, mặt phẳng (P) có pháp tuyến n→.\n' +
      '— u→·n→ ≠ 0: d cắt (P) tại đúng một điểm. Thay x, y, z theo t vào phương trình (P) được phương trình bậc ' +
      'nhất ẩn t, giải ra t rồi thay ngược lại để có toạ độ giao điểm.\n' +
      '— u→·n→ = 0: d song song hoặc nằm trong (P). Lấy một điểm của d thử vào (P): thoả mãn thì d nằm trong (P), ' +
      'không thì d song song (P).\n' +
      'VÌ SAO u→·n→ = 0 lại là "song song": n→ vuông góc với mặt phẳng, nên u→ vuông góc với n→ nghĩa là d không ' +
      '"đâm xuyên" qua mặt phẳng mà chạy dọc theo nó.',
    workedExample: {
      problem:
        'Xét vị trí tương đối của hai đường thẳng d₁: x = 1 + 2t, y = −1 + t, z = 3 − t và d₂: x = s, y = 2 − s, ' +
        'z = 1 + 3s.',
      steps: [
        'Bước 1 — Đọc điểm và VTCP từ dạng tham số: d₁ qua M₁(1; −1; 3) có u₁→ = (2; 1; −1); d₂ qua M₂(0; 2; 1) có ' +
          'u₂→ = (1; −1; 3).',
        'Bước 2 — Xét hướng trước: (2; 1; −1) và (1; −1; 3) không tỉ lệ (2/1 ≠ 1/(−1)), nên d₁ không song song ' +
          'cũng không trùng d₂. Còn hai khả năng: cắt hoặc chéo nhau.',
        'Bước 3 — Tính [u₁→, u₂→] = (1·3 − (−1)(−1); (−1)·1 − 2·3; 2·(−1) − 1·1) = (2; −7; −3).',
        'Bước 4 — Lập M₁M₂→ = (0 − 1; 2 − (−1); 1 − 3) = (−1; 3; −2) rồi tính tích hỗn tạp: ' +
          '(2)(−1) + (−7)(3) + (−3)(−2) = −2 − 21 + 6 = −17 ≠ 0. Ba vectơ không đồng phẳng nên hai đường chéo nhau.',
        'Bước 5 — Tự kiểm bằng cách khác: nếu cắt nhau thì có t, s chung. Từ x và y: 1 + 2t = s và −1 + t = 2 − s ' +
          'suy ra t = 2/3 và s = 7/3. Thử vào z: vế trái 3 − 2/3 = 7/3, vế phải 1 + 3·(7/3) = 8. Hai số khác nhau ' +
          'nên không có giao điểm, khớp với kết luận chéo nhau.',
      ],
      answer: 'd₁ và d₂ chéo nhau (tích hỗn tạp bằng −17, khác 0).',
    },
    checkQuestions: [
      {
        prompt:
          'Đường thẳng d: x = 1 + 2t, y = −3 + t, z = 2 − 3t. Tìm số thực m để điểm M(5; m; −4) thuộc d.',
        answer: { kind: 'numeric', value: -1 },
        explain:
          'Từ x: 5 = 1 + 2t nên t = 2. Với t = 2: z = 2 − 6 = −4, khớp với toạ độ z của M (đây là bước thử lại ' +
          'bắt buộc, nếu không khớp thì M không thuộc d với mọi m). Cuối cùng m = y = −3 + 2 = −1. Lỗi hay gặp: ' +
          'lấy luôn t = 5 vì nhầm x của điểm với tham số t.',
      },
      {
        prompt: 'Đường thẳng nào sau đây KHÔNG viết được dưới dạng phương trình chính tắc?',
        choices: [
          { id: 'a', label: 'x = 1 + t, y = 2 + 2t, z = 3 + 3t' },
          { id: 'b', label: 'x = 2 + 2t, y = 3, z = −t' },
          { id: 'c', label: 'x = −t, y = 4 + 4t, z = 5 + 5t' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Ở đáp án B, VTCP là (2; 0; −1) có thành phần y bằng 0, mà dạng chính tắc cần chia cho từng thành phần ' +
          'nên không được phép chia cho 0. Hai đường còn lại có cả ba thành phần khác 0. Lưu ý đường B vẫn là ' +
          'đường thẳng bình thường, chỉ là dạng tham số mới biểu diễn được trọn vẹn (y luôn bằng 3).',
      },
      {
        prompt:
          'Cho d₁: x = 1 + t, y = 2 − t, z = 3 + 2t và d₂: x = 1 + s, y = s, z = 6 − s. Vị trí tương đối của ' +
          'hai đường thẳng này là gì?',
        choices: [
          { id: 'song_song', label: 'Song song' },
          { id: 'trung', label: 'Trùng nhau' },
          { id: 'cat', label: 'Cắt nhau' },
          { id: 'cheo', label: 'Chéo nhau' },
        ],
        answer: { kind: 'choice', correctIds: ['cat'] },
        explain:
          'u₁→ = (1; −1; 2) và u₂→ = (1; 1; −1) không tỉ lệ nên không song song/trùng. [u₁→, u₂→] = (−1; 3; 2), ' +
          'M₁M₂→ = (0; −2; 3), tích hỗn tạp = 0 − 6 + 6 = 0 nên đồng phẳng, vậy hai đường cắt nhau (tại ' +
          '(2; 1; 5), ứng với t = 1, s = 1). Bẫy: thấy hai VTCP không tỉ lệ rồi vội kết luận "chéo nhau", quên ' +
          'bước tích hỗn tạp.',
      },
      {
        prompt:
          'Đường thẳng d: x = 1 + t, y = 2 − t, z = 3 + 2t cắt mặt phẳng (P): 2x + y − z − 3 = 0 tại một điểm. ' +
          'Tìm tung độ y của giao điểm đó.',
        answer: { kind: 'numeric', value: 4 },
        explain:
          'Thay vào (P): 2(1 + t) + (2 − t) − (3 + 2t) − 3 = −2 − t = 0 nên t = −2. Giao điểm có y = 2 − (−2) = 4 ' +
          '(toạ độ đầy đủ (−1; 4; −1)). Bẫy: dừng ở t = −2 và nhầm đó là đáp số, trong khi t chỉ là tham số; phải ' +
          'thay ngược lại để lấy toạ độ. Điều kiện cắt tại một điểm được đảm bảo vì u→·n→ = 2 − 1 − 2 = −1 ≠ 0.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phương trình tham số của đường thẳng qua M₀(x₀;y₀;z₀) có VTCP (a;b;c)?',
        dap: 'x = x₀ + at, y = y₀ + bt, z = z₀ + ct. Điểm thuộc d khi có MỘT t chung cho cả ba phương trình.',
      },
      {
        hoi: 'Khi nào viết được phương trình chính tắc của đường thẳng?',
        dap: 'Chỉ khi cả ba thành phần của VTCP đều khác 0 (không chia cho 0).',
      },
      {
        hoi: 'Hai đường thẳng không song song: cắt hay chéo nhau, phân biệt bằng gì?',
        dap: 'Tích hỗn tạp [u₁, u₂]·M₁M₂: bằng 0 thì cắt nhau, khác 0 thì chéo nhau.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan12-c5-b4',
    grade: '12',
    chapterNumber: 5,
    chapterTitle: 'Phương pháp toạ độ trong không gian',
    lessonNumber: 4,
    title: 'Công thức tính góc trong không gian',
    hook:
      'Máy bay hạ cánh xuống Nội Bài lướt xuống theo một đường thẳng nghiêng khoảng 3° so với mặt đường băng. ' +
      'Nhưng khi đài kiểm soát tính trên máy, họ chỉ có hai vectơ: vectơ chỉ phương của đường bay và vectơ pháp ' +
      'tuyến của mặt đất. Hai vectơ ấy làm với nhau một góc gần 87°, không phải 3°. Chỗ lệch 90° này chính là ' +
      'cái bẫy khiến nhiều bạn tính sai góc giữa đường thẳng và mặt phẳng.',
    theory:
      'BA LOẠI GÓC, BA CÔNG THỨC\n' +
      'Ta dùng vectơ chỉ phương u→ cho đường thẳng và vectơ pháp tuyến n→ cho mặt phẳng. Mọi góc dưới đây đều ' +
      'nằm trong đoạn từ 0° đến 90°.\n\n' +
      '1. GÓC GIỮA HAI ĐƯỜNG THẲNG d₁, d₂ (VTCP u₁→, u₂→)\n' +
      'cos φ = |u₁→·u₂→| / (|u₁→|·|u₂→|).\n' +
      'VÌ SAO CÓ TRỊ TUYỆT ĐỐI: mỗi đường thẳng có hai VTCP ngược chiều nhau, u→ và −u→. Chọn chiều nào thì góc ' +
      'giữa hai vectơ là φ hoặc 180° − φ, trong khi đường thẳng thì không có chiều. Quy ước góc giữa hai đường ' +
      'thẳng là góc nhọn (hoặc vuông), nên phải lấy |u₁→·u₂→| để cos không âm. Hệ quả: d₁ ⟂ d₂ khi u₁→·u₂→ = 0.\n\n' +
      '2. GÓC GIỮA ĐƯỜNG THẲNG d VÀ MẶT PHẲNG (P) (VTCP u→, pháp tuyến n→)\n' +
      'sin θ = |u→·n→| / (|u→|·|n→|).\n' +
      'Góc θ là góc giữa d và HÌNH CHIẾU d′ của d lên (P). VÌ SAO LÀ SIN: n→ vuông góc với (P), nên khi d nghiêng ' +
      'θ so với mặt phẳng thì u→ và n→ lệch nhau 90° − θ (hoặc phần bù của nó). Mà cos(90° − θ) = sin θ, nên ' +
      'cos của góc giữa u→ và n→ chính là sin của góc cần tìm.\n' +
      'BẪY SỐ MỘT: dùng cos thay vì sin sẽ cho ra GÓC PHỤ 90° − θ, tức là góc giữa d và pháp tuyến. Trường hợp ' +
      'đặc biệt: u→·n→ = 0 thì θ = 0° (d song song hoặc nằm trong (P)); u→ cùng phương n→ thì θ = 90° (d ⟂ (P)).\n\n' +
      '3. GÓC GIỮA HAI MẶT PHẲNG (n₁→, n₂→)\n' +
      'cos φ = |n₁→·n₂→| / (|n₁→|·|n₂→|).\n' +
      'VÌ SAO: hai mặt phẳng cắt nhau tạo ra các góc nhị diện φ và 180° − φ, còn hai pháp tuyến hợp với nhau đúng ' +
      'một trong hai góc ấy. Lấy giá trị tuyệt đối để chọn góc nhọn.\n\n' +
      'MẸO NHỚ\n' +
      'Đường–đường và mặt–mặt dùng COS. Đường–mặt dùng SIN, vì lúc này một vectơ nằm DỌC theo đường thẳng còn ' +
      'vectơ kia lại VUÔNG GÓC với mặt phẳng, hai vai trò lệch nhau 90°.\n\n' +
      'TÍNH RA ĐỘ\n' +
      'Tính giá trị cos hoặc sin trước, rồi dùng máy tính ở chế độ độ (DEG) bấm cos⁻¹ hoặc sin⁻¹. Sau trị ' +
      'tuyệt đối, giá trị phải nằm trong đoạn [0; 1]; ra số âm là quên trị tuyệt đối, ra lớn hơn 1 là tính sai ' +
      'tích vô hướng hoặc độ dài.\n\n' +
      'ỨNG DỤNG: độ dốc của mái nhà là góc giữa mặt mái và mặt phẳng nằm ngang (n→ = (0; 0; 1) là một pháp tuyến ' +
      'của mặt phẳng ngang), tức góc giữa hai mặt phẳng nên dùng cos. Đường ống chạy xiên xuống sàn, đường bay ' +
      'hạ cánh là góc giữa đường thẳng và mặt phẳng nên dùng sin.',
    animation: {
      title: 'Góc giữa đường thẳng và mặt phẳng: sin θ chính là cos của góc (u, n)',
      description:
        'Hình vẽ là lát cắt đứng chứa đường thẳng d. Mặt phẳng (P) hiện ra thành đường nằm ngang, đường thẳng d cắt (P) tại điểm O và nghiêng 30° so với (P). Bước đầu, chiếu vuông góc d xuống (P) để được hình chiếu d′ nằm trên (P); góc θ giữa d và d′ chính là góc giữa đường thẳng và mặt phẳng, bằng 30°. Bước tiếp theo, dựng vectơ pháp tuyến n vuông góc với (P) tại O. Vì n đứng thẳng còn d nghiêng 30° so với mặt phẳng, góc giữa vectơ chỉ phương u của d và n là 90° − 30° = 60°. Cuối cùng công thức hiện ra: sin 30° = 0,5 = cos 60°, nên góc đường–mặt tính bằng SIN của |u·n|/(|u||n|), không phải cos. Dùng cos sẽ ra 60°, là góc phụ.',
      viewBoxWidth: 320,
      viewBoxHeight: 240,
      durationMs: 9000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'mat-phang',
          x1: 20,
          y1: 180,
          x2: 300,
          y2: 180,
          stroke: 'muted',
          strokeWidth: 3,
        },
        {
          kind: 'label',
          id: 'nhan-mp',
          x: 296,
          y: 172,
          text: '(P)',
          size: 13,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'line',
          id: 'duong-d',
          x1: 57,
          y1: 205,
          x2: 239,
          y2: 100,
          stroke: 'primary',
          strokeWidth: 3,
        },
        {
          kind: 'label',
          id: 'nhan-d',
          x: 246,
          y: 100,
          text: 'd',
          size: 14,
          fill: 'primary',
        },
        {
          kind: 'circle',
          id: 'diem-o',
          cx: 100,
          cy: 180,
          r: 4,
          fill: 'neutral',
        },
        {
          kind: 'line',
          id: 'duong-chieu',
          x1: 239,
          y1: 100,
          x2: 239,
          y2: 180,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '5 4',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1500, opacity: 0 },
            { atMs: 2100, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'hinh-chieu',
          x1: 100,
          y1: 180,
          x2: 239,
          y2: 180,
          stroke: 'accent',
          strokeWidth: 4,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2100, opacity: 0 },
            { atMs: 2700, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-d-chieu',
          x: 170,
          y: 200,
          text: 'd′ (hình chiếu của d)',
          size: 12,
          anchor: 'middle',
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2700, opacity: 0 },
            { atMs: 3300, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-theta',
          x: 142,
          y: 172,
          text: 'θ = 30°',
          size: 12,
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3300, opacity: 0 },
            { atMs: 3900, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'phap-tuyen',
          x1: 100,
          y1: 180,
          x2: 100,
          y2: 90,
          stroke: 'warn',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4800, opacity: 0 },
            { atMs: 5400, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-n',
          x: 92,
          y: 86,
          text: 'n',
          size: 14,
          anchor: 'end',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4800, opacity: 0 },
            { atMs: 5400, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-un',
          x: 108,
          y: 112,
          text: '(u, n) = 60°',
          size: 12,
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5400, opacity: 0 },
            { atMs: 6000, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'cong-thuc',
          x: 160,
          y: 228,
          text: 'sin 30° = cos 60°: góc đường–mặt dùng sin',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 6900, opacity: 0 },
            { atMs: 7500, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Lát cắt đứng: mặt phẳng (P) là đường ngang, đường thẳng d cắt (P) tại O.',
        },
        {
          atMs: 2100,
          text: 'Chiếu vuông góc d xuống (P) được hình chiếu d′ nằm trên (P).',
        },
        {
          atMs: 3900,
          text: 'Góc giữa d và (P) chính là góc θ giữa d và d′, ở đây bằng 30°.',
        },
        {
          atMs: 5400,
          text: 'Dựng pháp tuyến n vuông góc (P): n lệch d một góc 90° − 30° = 60°.',
        },
        {
          atMs: 7500,
          text: 'cos của góc (u, n) bằng sin θ, nên dùng cos sẽ ra 60° là góc phụ.',
        },
      ],
    },
    workedExample: {
      problem:
        'Đường thẳng d có vectơ chỉ phương u→ = (1; 2; 2). Mặt phẳng (P): 2x + 2y − z + 5 = 0. Tính góc θ giữa d ' +
        'và (P), làm tròn đến hàng phần mười của độ.',
      steps: [
        'Bước 1 — Đọc dữ kiện: VTCP của d là u→ = (1; 2; 2); từ phương trình (P) lấy ba hệ số của x, y, z được ' +
          'pháp tuyến n→ = (2; 2; −1) (không lấy hằng số +5).',
        'Bước 2 — Chọn công thức: đây là góc giữa ĐƯỜNG THẲNG và MẶT PHẲNG nên dùng SIN, vì n→ vuông góc với (P) ' +
          'chứ không nằm trong (P): sin θ = |u→·n→| / (|u→|·|n→|).',
        'Bước 3 — Tính tử số: u→·n→ = 1·2 + 2·2 + 2·(−1) = 4, giá trị tuyệt đối là 4.',
        'Bước 4 — Tính mẫu số: |u→| = √(1 + 4 + 4) = 3 và |n→| = √(4 + 4 + 1) = 3, nên mẫu bằng 9. Vậy sin θ = 4/9.',
        'Bước 5 — Đổi ra độ (máy tính ở chế độ DEG): θ = sin⁻¹(4/9) ≈ 26,4°. Tự kiểm: nếu lỡ dùng cos sẽ ra ' +
          'cos⁻¹(4/9) ≈ 63,6°, và 26,4° + 63,6° = 90°, đúng là hai góc phụ nhau. Góc giữa đường thẳng và mặt ' +
          'phẳng nhỏ hơn hẳn góc giữa đường thẳng và pháp tuyến, khớp với hình dung d khá "nằm" gần (P).',
      ],
      answer: 'sin θ = 4/9, nên θ ≈ 26,4°.',
    },
    checkQuestions: [
      {
        prompt:
          'Hai đường thẳng d₁, d₂ có vectơ chỉ phương lần lượt u₁→ = (2; 1; 2) và u₂→ = (−3; 0; −4). Tính cosin ' +
          'của góc giữa hai đường thẳng đó. (Nhập dạng phân số tối giản, ví dụ 5/7.)',
        answer: { kind: 'fraction', num: 14, den: 15 },
        explain:
          'u₁→·u₂→ = 2·(−3) + 1·0 + 2·(−4) = −14, |u₁→| = 3, |u₂→| = 5. Lấy giá trị tuyệt đối: cos φ = 14/15. ' +
          'Lỗi kinh điển là để nguyên −14/15: cos âm ứng với góc tù, mà góc giữa hai đường thẳng luôn nhọn hoặc ' +
          'vuông vì mỗi đường thẳng có hai VTCP ngược chiều, và ta chỉ chọn góc nhọn.',
      },
      {
        prompt:
          'Góc θ giữa đường thẳng d (VTCP u→) và mặt phẳng (P) (pháp tuyến n→) được tính bằng công thức nào?',
        choices: [
          { id: 'sin', label: 'sin θ = |u→·n→| / (|u→|·|n→|)' },
          { id: 'cos', label: 'cos θ = |u→·n→| / (|u→|·|n→|)' },
          { id: 'sin_khong_abs', label: 'sin θ = u→·n→ / (|u→|·|n→|), không cần trị tuyệt đối' },
          { id: 'tan', label: 'tan θ = |u→·n→| / (|u→|·|n→|)' },
        ],
        answer: { kind: 'choice', correctIds: ['sin'] },
        explain:
          'Pháp tuyến n→ vuông góc (P) nên góc giữa u→ và n→ là 90° − θ, và cos(90° − θ) = sin θ. Vì vậy phải là ' +
          'SIN. Dùng cos là bẫy phổ biến nhất, cho ra góc phụ. Bỏ trị tuyệt đối cũng sai: góc đường–mặt nằm trong ' +
          '[0°; 90°] nên sin θ không âm, và chiều của u→ hay n→ là tuỳ ý.',
      },
      {
        prompt:
          'Tính góc giữa mặt phẳng (P): x + 2y + 2z − 7 = 0 và mặt phẳng nằm ngang (Oxy): z = 0. Kết quả tính ' +
          'bằng độ, làm tròn đến hàng phần mười.',
        answer: { kind: 'numeric', value: 48.2, tolerance: { mode: 'absolute', eps: 0.05 } },
        explain:
          'n₁→ = (1; 2; 2) với |n₁→| = 3 và n₂→ = (0; 0; 1) với |n₂→| = 1; n₁→·n₂→ = 2. Hai mặt phẳng nên dùng ' +
          'cos: cos φ = 2/3, suy ra φ = cos⁻¹(2/3) ≈ 48,19° ≈ 48,2°. Đây cũng là cách tính độ dốc của một mái ' +
          'nhà. Lỗi hay gặp là bấm máy tính ở chế độ radian (ra 0,84) hoặc dùng sin cho cặp mặt–mặt.',
      },
      {
        prompt:
          'Đường thẳng d có VTCP u→ = (1; 1; 0) và mặt phẳng (P) có pháp tuyến n→ = (1; 0; 1). Tính góc giữa d và ' +
          '(P) theo đơn vị độ.',
        answer: { kind: 'numeric', value: 30 },
        explain:
          'u→·n→ = 1, |u→| = √2, |n→| = √2 nên sin θ = 1/(√2·√2) = 1/2, suy ra θ = 30°. Nếu dùng nhầm cos thì ' +
          'cos θ = 1/2 cho 60°, là góc giữa d và pháp tuyến chứ không phải góc giữa d và mặt phẳng. Hai đáp số ' +
          '30° và 60° cộng lại bằng 90°, nên luôn tự hỏi: góc mình tính có hợp lí với hình dung "d nghiêng nhiều ' +
          'hay ít so với mặt phẳng" không.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức góc giữa hai đường thẳng và vì sao có trị tuyệt đối?',
        dap: 'cos φ = |u₁·u₂| / (|u₁||u₂|). Mỗi đường có hai VTCP ngược chiều; góc giữa hai đường thẳng là góc nhọn nên lấy |·|.',
      },
      {
        hoi: 'Góc giữa đường thẳng d và mặt phẳng (P) dùng sin hay cos?',
        dap: 'SIN: sin θ = |u·n| / (|u||n|), vì n vuông góc (P) nên góc (u, n) = 90° − θ. Dùng cos ra góc phụ.',
      },
      {
        hoi: 'Công thức góc giữa hai mặt phẳng?',
        dap: 'cos φ = |n₁·n₂| / (|n₁||n₂|), 0° ≤ φ ≤ 90°.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
