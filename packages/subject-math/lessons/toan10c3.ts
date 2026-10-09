// lessons/toan10c3.ts — Toán 10, Chương 3: Hệ thức lượng trong tam giác.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN10_C3_LESSONS: MathLesson[] = [
  {
    id: 'toan10-c3-b1',
    grade: '10',
    chapterNumber: 3,
    chapterTitle: 'Hệ thức lượng trong tam giác',
    lessonNumber: 1,
    title: 'Định lí côsin và định lí sin',
    hook:
      'Muốn đo khoảng cách từ bờ bên này sông Hàn sang một cột mốc bên kia bờ, ta không thể kéo thước qua sông. ' +
      'Nhưng chỉ cần đứng ở hai điểm trên bờ, đo khoảng cách giữa chúng và hai góc ngắm, là tính ra được khoảng cách ' +
      'kia chính xác đến từng mét. Toàn bộ ngành trắc địa dựng trên hai định lí của bài học này.',
    theory:
      'HAI ĐỊNH LÍ NỀN TẢNG\n' +
      'Cho tam giác ABC có các cạnh a = BC, b = CA, c = AB.\n\n' +
      '1) ĐỊNH LÍ CÔSIN: a² = b² + c² − 2bc·cosA (và hai hệ thức tương tự cho b², c²).\n' +
      'VÌ SAO có số hạng −2bc·cosA? Hãy coi định lí Pythagore là trường hợp riêng: khi A = 90° thì cosA = 0, công ' +
      'thức thu về a² = b² + c². Số hạng −2bc·cosA chính là phần "sửa chữa" cho việc góc A không vuông: góc A nhọn ' +
      '(cosA > 0) làm cạnh đối a NGẮN đi so với Pythagore; góc A tù (cosA < 0) làm a DÀI ra. Nhớ được ý nghĩa này ' +
      'thì không bao giờ nhầm dấu.\n' +
      'Hệ quả tính góc: cosA = (b² + c² − a²) / (2bc).\n\n' +
      '2) ĐỊNH LÍ SIN: a/sinA = b/sinB = c/sinC = 2R, với R là bán kính đường tròn ngoại tiếp.\n' +
      'Ý nghĩa: trong một tam giác, cạnh lớn hơn luôn đối diện góc lớn hơn, và tỉ lệ ấy là hằng số bằng đúng đường ' +
      'kính đường tròn ngoại tiếp. Đây là cầu nối giữa tam giác và đường tròn.\n\n' +
      'DÙNG CÁI NÀO KHI NÀO — ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT\n' +
      '— Biết hai cạnh và góc XEN GIỮA chúng → dùng định lí CÔSIN để tìm cạnh thứ ba.\n' +
      '— Biết cả ba cạnh → dùng hệ quả côsin để tìm góc.\n' +
      '— Biết một cạnh và hai góc, hoặc hai cạnh và góc ĐỐI DIỆN một trong hai → dùng định lí SIN.\n\n' +
      'GIỚI HẠN PHẢI CẨN THẬN: khi dùng định lí sin để tìm GÓC, phương trình sinX = k có thể cho hai nghiệm bù nhau ' +
      '(ví dụ 30° và 150°) vì sin của hai góc bù bằng nhau. Phải đối chiếu thêm điều kiện (tổng ba góc bằng 180°, ' +
      'cạnh lớn đối góc lớn) để loại nghiệm. Ngược lại, hàm côsin đơn điệu trên (0°; 180°) nên tìm góc bằng định lí ' +
      'côsin luôn cho duy nhất một nghiệm — đó là lý do nên ưu tiên côsin khi tìm góc.\n\n' +
      'CÁC CÔNG THỨC DIỆN TÍCH\n' +
      'S = (1/2)ab·sinC = abc/(4R) = pr = √(p(p−a)(p−b)(p−c)) với p là nửa chu vi (công thức Heron). Chọn công thức ' +
      'theo dữ kiện đang có: biết ba cạnh thì dùng Heron, biết hai cạnh và góc xen giữa thì dùng (1/2)ab·sinC.',
    animation: {
      title: 'Cùng hai cạnh, đổi góc xen giữa thì cạnh thứ ba đổi theo',
      description:
        'Hai tam giác được dựng lần lượt từ cùng một đỉnh A với hai cạnh giữ nguyên: AB = 5 và AC = 8. Tam giác thứ nhất có góc A = 60 độ, cạnh đối diện tính theo định lí côsin là a bình phương bằng 25 cộng 64 trừ 2 nhân 5 nhân 8 nhân cos 60 độ, tức 89 trừ 40 bằng 49, nên a = 7. Sau đó cạnh AC quay lên vị trí vuông góc với AB: góc A = 90 độ, số hạng trừ biến mất vì cos 90 độ bằng 0, nên a bình phương bằng đúng 89 và a khoảng 9,43. Hình động phá bẫy quen thuộc là tưởng ba cạnh quyết định lẫn nhau một cách cố định: hai cạnh giữ nguyên mà cạnh thứ ba vẫn dài ra khi góc xen giữa mở rộng, và định lí Pythagore chỉ là trường hợp riêng khi góc đó bằng 90 độ.',
      viewBoxWidth: 360,
      viewBoxHeight: 260,
      durationMs: 7000,
      loop: true,
      shapes: [
        {
          kind: 'circle',
          id: 'dinh-a',
          cx: 60,
          cy: 200,
          r: 4,
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-a',
          x: 48,
          y: 218,
          text: 'A',
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'line',
          id: 'canh-ab',
          x1: 60,
          y1: 200,
          x2: 160,
          y2: 200,
          stroke: 'primary',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 500,
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
          id: 'nhan-b',
          x: 168,
          y: 214,
          text: 'B',
          size: 14,
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-c5',
          x: 105,
          y: 220,
          text: 'c = 5',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'line',
          id: 'canh-ac',
          x1: 60,
          y1: 200,
          x2: 140,
          y2: 61,
          stroke: 'accent',
          strokeWidth: 3,
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
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-c',
          x: 146,
          y: 54,
          text: 'C',
          size: 14,
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-b8',
          x: 98,
          y: 124,
          text: 'b = 8',
          size: 13,
          anchor: 'end',
          fill: 'accent',
        },
        {
          kind: 'line',
          id: 'canh-bc',
          x1: 160,
          y1: 200,
          x2: 140,
          y2: 61,
          stroke: 'correct',
          strokeWidth: 4,
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
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-a7',
          x: 176,
          y: 130,
          text: 'a = 7',
          size: 14,
          fill: 'primary',
          opacity: 0,
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
              atMs: 3400,
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
          id: 'goc-60',
          x: 92,
          y: 186,
          text: 'A = 60°',
          size: 12,
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1600,
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
          id: 'canh-ac2',
          x1: 60,
          y1: 200,
          x2: 60,
          y2: 40,
          stroke: 'accent',
          strokeWidth: 3,
          dash: '6 4',
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
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'canh-bc2',
          x1: 160,
          y1: 200,
          x2: 60,
          y2: 40,
          stroke: 'warn',
          strokeWidth: 4,
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
              atMs: 5500,
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
          id: 'nhan-c2',
          x: 52,
          y: 34,
          text: "C'",
          size: 14,
          anchor: 'end',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4700,
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
          id: 'nhan-a943',
          x: 70,
          y: 54,
          text: 'a ≈ 9,43',
          size: 14,
          anchor: 'start',
          fill: 'accent',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5800,
              opacity: 0,
            },
            {
              atMs: 6200,
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
          id: 'ct',
          x: 180,
          y: 244,
          text: 'a² = b² + c² − 2bc·cosA',
          size: 15,
          anchor: 'middle',
          fill: 'primary',
        },
      ],
      captions: [
        {
          atMs: 300,
          text: 'Từ đỉnh A dựng cạnh AB = 5.',
        },
        {
          atMs: 1600,
          text: 'Dựng tiếp AC = 8 hợp với AB một góc 60°.',
        },
        {
          atMs: 2700,
          text: 'Nối B với C: a² = 25 + 64 − 2·5·8·cos60° = 49, vậy a = 7.',
        },
        {
          atMs: 4700,
          text: 'Giữ nguyên hai cạnh, mở góc A lên 90°: điểm C trượt tới C′.',
        },
        {
          atMs: 6200,
          text: 'cos90° = 0 nên số hạng trừ biến mất: a² = 89, a ≈ 9,43. Pythagore chỉ là một trường hợp riêng.',
        },
      ],
    },
    workedExample: {
      problem:
        'Để đo khoảng cách AB qua một con sông, người ta chọn điểm C ở cùng bờ với A, đo được AC = 120 m, ' +
        'góc BAC = 60°, góc ACB = 45°. Tính khoảng cách AB (làm tròn đến mét).',
      steps: [
        'Bước 1 — Tìm góc còn lại vì định lí sin cần cặp cạnh–góc đối diện: góc ABC = 180° − 60° − 45° = 75°. ' +
          'Cạnh AC đối diện góc B, cạnh AB đối diện góc C, nên ta có đủ một cặp để lập tỉ lệ.',
        'Bước 2 — Chọn công cụ: bài cho MỘT cạnh và HAI góc, đây đúng là trường hợp của định lí sin (định lí côsin ' +
          'không dùng được vì chỉ biết một cạnh).',
        'Bước 3 — Lập tỉ lệ: AB / sin(ACB) = AC / sin(ABC), tức AB / sin45° = 120 / sin75°.',
        'Bước 4 — Tính: AB = 120 · sin45° / sin75° = 120 · 0,7071 / 0,9659 ≈ 87,85 m.',
        'Bước 5 — Kiểm tra tính hợp lý: góc C = 45° nhỏ hơn góc B = 75°, nên cạnh AB đối diện C phải NGẮN hơn cạnh ' +
          'AC = 120 m đối diện B. Kết quả 87,85 m nhỏ hơn 120 m, phù hợp.',
      ],
      answer: 'AB ≈ 88 m.',
    },
    checkQuestions: [
      {
        prompt: 'Tam giác ABC có b = 8, c = 5 và góc A = 60°. Tính độ dài cạnh a.',
        answer: { kind: 'numeric', value: 7 },
        explain:
          'Dùng định lí côsin vì đề cho hai cạnh và góc XEN GIỮA: a² = 8² + 5² − 2·8·5·cos60° = 64 + 25 − 80·0,5 = 49, ' +
          'suy ra a = 7. Lỗi thường gặp là cộng nhầm thành 64 + 25 + 40 = 129 (sai dấu) hoặc dùng thẳng Pythagore ra ' +
          '√89. Hãy nhớ: góc A = 60° là góc nhọn nên cạnh đối a phải NGẮN hơn √89 ≈ 9,43 — kết quả 7 phù hợp.',
      },
      {
        prompt: 'Tam giác ABC có a = 7, b = 8, c = 13. Số đo góc C bằng bao nhiêu độ?',
        answer: { kind: 'numeric', value: 120 },
        explain:
          'Biết cả ba cạnh nên dùng hệ quả côsin: cosC = (a² + b² − c²)/(2ab) = (49 + 64 − 169)/(2·7·8) = −56/112 = −0,5, ' +
          'suy ra C = 120°. Nhiều bạn thấy kết quả âm liền cho là tính sai và đổi dấu thành +0,5 để ra 60°. Giá trị ' +
          'cosin ÂM là hoàn toàn bình thường: nó báo rằng góc C tù. Dấu hiệu kiểm tra: c = 13 là cạnh lớn nhất và ' +
          'c² = 169 > a² + b² = 113, đúng là tam giác tù tại C.',
      },
      {
        prompt:
          'Tam giác ABC có góc A = 30° và bán kính đường tròn ngoại tiếp R = 6. Cạnh a bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 6 },
        explain:
          'Theo định lí sin, a = 2R·sinA = 2·6·sin30° = 12·0,5 = 6. Bẫy ở đây là công thức a/sinA = 2R chứ không ' +
          'phải a/sinA = R; ai nhớ thiếu hệ số 2 sẽ ra 3. Cách kiểm nhanh: khi A = 90° thì a phải là đường kính, ' +
          'tức a = 2R — chỉ công thức có hệ số 2 mới thoả điều đó.',
      },
    ],
    srsCards: [
      {
        hoi: 'Định lí côsin phát biểu thế nào và trở thành định lí nào khi góc A vuông?',
        dap: 'a² = b² + c² − 2bc·cosA; khi A = 90° thì cosA = 0, thu về định lí Pythagore.',
      },
      {
        hoi: 'Khi nào nên dùng định lí sin, khi nào dùng định lí côsin?',
        dap: 'Côsin khi biết hai cạnh và góc xen giữa, hoặc biết ba cạnh; sin khi có cặp cạnh – góc đối diện.',
      },
      {
        hoi: 'Vì sao tìm góc bằng định lí côsin an toàn hơn bằng định lí sin?',
        dap: 'Côsin đơn điệu trên (0°;180°) nên cho nghiệm duy nhất; sin cho hai góc bù nhau, dễ nhận nhầm nghiệm.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan10-c3-b2',
    grade: '10',
    chapterNumber: 3,
    chapterTitle: 'Hệ thức lượng trong tam giác',
    lessonNumber: 2,
    title: 'Giá trị lượng giác của góc từ 0° đến 180°',
    hook:
      'Cổng làng hình bán nguyệt, bán kính 1 đơn vị. Hai người đứng ở hai điểm trên vòm cổng, đối xứng nhau qua ' +
      'trục giữa: cùng độ cao, nhưng một người lệch sang phải, người kia lệch sang trái cùng một khoảng. Độ cao ' +
      'chính là sin, độ lệch ngang chính là cos của góc nhìn từ tâm. Vì sao góc 60° và 120° có sin bằng nhau mà ' +
      'cos đối nhau? Nhìn nửa đường tròn là thấy ngay, không cần học thuộc.',
    theory:
      'VÌ SAO PHẢI MỞ RỘNG KHỎI GÓC NHỌN\n' +
      'Sin và cos học ở tam giác vuông chỉ có nghĩa cho góc nhọn. Nhưng định lí côsin của bài trước đã gặp góc tù ' +
      '(cosA < 0), nên ta cần định nghĩa cho cả góc từ 0° đến 180°. Công cụ là NỬA ĐƯỜNG TRÒN ĐƠN VỊ: nửa đường ' +
      'tròn tâm O bán kính 1, nằm phía trên trục hoành.\n\n' +
      'ĐỊNH NGHĨA\n' +
      'Với mỗi góc α (0° ≤ α ≤ 180°) có đúng một điểm M(x₀; y₀) trên nửa đường tròn sao cho góc xOM = α. Khi đó\n' +
      'sinα = y₀, cosα = x₀, tanα = y₀/x₀ (α ≠ 90°), cotα = x₀/y₀ (α ≠ 0° và α ≠ 180°).\n' +
      'Với góc nhọn, hạ MH vuông góc Ox thì OM = 1 là cạnh huyền, MH/OM = y₀ và OH/OM = x₀: định nghĩa mới trùng ' +
      'hoàn toàn với định nghĩa cũ, chỉ cho phép thêm trường hợp x₀ ÂM.\n\n' +
      'DẤU CỦA CÁC GIÁ TRỊ\n' +
      '— Nửa đường tròn nằm trên trục hoành nên y₀ ≥ 0: sinα ≥ 0 với MỌI α từ 0° đến 180°.\n' +
      '— Góc nhọn (0° < α < 90°): M bên phải trục tung, cos > 0, tan > 0.\n' +
      '— Góc tù (90° < α < 180°): M bên trái trục tung, cos < 0, nên tan < 0 và cot < 0.\n\n' +
      'HAI GÓC BÙ NHAU\n' +
      'Điểm M′ ứng với 180° − α đối xứng với M qua trục tung: cùng tung độ, hoành độ đối nhau. Vì thế\n' +
      'sin(180° − α) = sinα, cos(180° − α) = −cosα, tan(180° − α) = −tanα, cot(180° − α) = −cotα.\n' +
      'Hai góc phụ nhau thì khác: sin(90° − α) = cosα.\n\n' +
      'HỆ THỨC CƠ BẢN\n' +
      'M nằm trên đường tròn bán kính 1 nên x₀² + y₀² = 1, tức sin²α + cos²α = 1. Chia hai vế cho cos²α được ' +
      '1 + tan²α = 1/cos²α (với cosα ≠ 0).\n\n' +
      'BẢNG GIÁ TRỊ ĐẶC BIỆT\n' +
      'α: 0°, 30°, 45°, 60°, 90°, 120°, 135°, 150°, 180°\n' +
      'sin: 0, 1/2, √2/2, √3/2, 1, √3/2, √2/2, 1/2, 0\n' +
      'cos: 1, √3/2, √2/2, 1/2, 0, −1/2, −√2/2, −√3/2, −1\n' +
      'tan: 0, √3/3, 1, √3, không xác định, −√3, −1, −√3/3, 0\n' +
      'Chỉ cần nhớ nửa đầu (0° đến 90°) rồi suy nửa sau bằng công thức góc bù.\n\n' +
      'BẪY HAY GẶP\n' +
      '— Cho sinα = 1/2 thì α có HAI giá trị là 30° và 150°. Phím sin⁻¹ trên máy tính chỉ trả góc nhọn, nên ai ' +
      'tin máy sẽ bỏ sót góc tù. Cho cosα thì chỉ có MỘT góc, vì cos giảm đều từ 1 xuống −1.\n' +
      '— tan 90° không tồn tại; cot 0° và cot 180° cũng vậy.\n' +
      '— Nhầm sin(180° − α) = −sinα. Sin của góc bù KHÔNG đổi dấu; chỉ cos và tan đổi dấu.',
    animation: {
      title: 'Hai góc bù 60° và 120° trên nửa đường tròn đơn vị',
      description:
        'Trên nửa đường tròn đơn vị tâm O, điểm M ứng với góc 60° có tung độ khoảng 0,87 và hoành độ 0,5. Sau đó điểm M′ ứng với góc 120° = 180° − 60° xuất hiện đối xứng với M qua trục tung. Hai điểm cùng độ cao nên sin 120° = sin 60° ≈ 0,87, còn hoành độ đối nhau nên cos 120° = −0,5. Hoạt ảnh cho thấy vì sao góc tù có côsin âm nhưng sin vẫn dương.',
      viewBoxWidth: 320,
      viewBoxHeight: 240,
      durationMs: 8000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'truc-x',
          x1: 40,
          y1: 190,
          x2: 280,
          y2: 190,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'truc-y',
          x1: 160,
          y1: 190,
          x2: 160,
          y2: 80,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'polyline',
          id: 'nua-tron',
          points: [
            [260, 190],
            [258.5, 172.6],
            [254, 155.8],
            [246.6, 140],
            [236.6, 125.7],
            [224.3, 113.4],
            [210, 103.4],
            [194.2, 96],
            [177.4, 91.5],
            [160, 90],
            [142.6, 91.5],
            [125.8, 96],
            [110, 103.4],
            [95.7, 113.4],
            [83.4, 125.7],
            [73.4, 140],
            [66, 155.8],
            [61.5, 172.6],
            [60, 190],
          ],
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'tia-om',
          x1: 160,
          y1: 190,
          x2: 210,
          y2: 103.4,
          stroke: 'primary',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 500,
              opacity: 0,
            },
            {
              atMs: 900,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'chieu-m',
          x1: 210,
          y1: 103.4,
          x2: 210,
          y2: 190,
          stroke: 'accent',
          strokeWidth: 2,
          dash: '5 4',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 900,
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
          kind: 'circle',
          id: 'diem-m',
          cx: 210,
          cy: 103.4,
          r: 5,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 500,
              opacity: 0,
            },
            {
              atMs: 900,
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
          id: 'nhan-m',
          x: 218,
          y: 100.4,
          text: 'M',
          size: 14,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 500,
              opacity: 0,
            },
            {
              atMs: 900,
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
          id: 'goc-60',
          x: 176,
          y: 182,
          text: '60°',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 700,
              opacity: 0,
            },
            {
              atMs: 1100,
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
          id: 'cos-60',
          x: 215,
          y: 208,
          text: 'cos 60° = 0,5',
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
              atMs: 1800,
              opacity: 0,
            },
            {
              atMs: 2200,
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
          id: 'sin-60',
          x: 160,
          y: 60,
          text: 'sin 60° ≈ 0,87',
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
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
              atMs: 4800,
              opacity: 1,
            },
            {
              atMs: 5200,
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
          id: 'ngang-mm',
          x1: 110,
          y1: 103.4,
          x2: 210,
          y2: 103.4,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '3 4',
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
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'tia-om2',
          x1: 160,
          y1: 190,
          x2: 110,
          y2: 103.4,
          stroke: 'warn',
          strokeWidth: 3,
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
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'chieu-m2',
          x1: 110,
          y1: 103.4,
          x2: 110,
          y2: 190,
          stroke: 'accent',
          strokeWidth: 2,
          dash: '5 4',
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
          kind: 'circle',
          id: 'diem-m2',
          cx: 110,
          cy: 103.4,
          r: 5,
          fill: 'warn',
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
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-m2',
          x: 102,
          y: 100.4,
          text: 'M′',
          size: 14,
          anchor: 'end',
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
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'goc-120',
          x: 142,
          y: 175,
          text: '120°',
          size: 12,
          anchor: 'end',
          fill: 'neutral',
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
          id: 'cos-120',
          x: 105,
          y: 208,
          text: 'cos 120° = −0,5',
          size: 13,
          anchor: 'end',
          fill: 'primary',
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
          kind: 'label',
          id: 'sin-120',
          x: 160,
          y: 60,
          text: 'sin 120° = sin 60° ≈ 0,87',
          size: 14,
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
              atMs: 5200,
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
          atMs: 500,
          text: 'Điểm M trên nửa đường tròn đơn vị ứng với góc 60°.',
        },
        {
          atMs: 1800,
          text: 'Hoành độ của M là cos 60° = 0,5; tung độ là sin 60° ≈ 0,87.',
        },
        {
          atMs: 3600,
          text: 'Lấy M′ đối xứng với M qua trục tung: đó là điểm của góc 180° − 60° = 120°.',
        },
        {
          atMs: 5200,
          text: 'Cùng độ cao nên sin bằng nhau; hoành độ đối nhau nên cos 120° = −cos 60° = −0,5.',
        },
      ],
    },
    workedExample: {
      problem:
        'Cho góc α tù (90° < α < 180°) với sinα = 5/13. Tính cosα, tanα, và giá trị sin(180° − α), cos(180° − α).',
      steps: [
        'Bước 1 — Dùng hệ thức sin²α + cos²α = 1: cos²α = 1 − 25/169 = 144/169, suy ra cosα = ±12/13.',
        'Bước 2 — Chọn dấu: α tù nên M nằm bên trái trục tung, cosα < 0. Vậy cosα = −12/13. Đây là bước quyết ' +
          'định; bỏ qua nó là ra hai đáp án mà không biết đáp án nào đúng.',
        'Bước 3 — Tính tanα = sinα / cosα = (5/13) / (−12/13) = −5/12. Âm là hợp lý vì góc tù có tan âm.',
        'Bước 4 — Góc bù 180° − α là góc nhọn: sin(180° − α) = sinα = 5/13 và cos(180° − α) = −cosα = 12/13.',
        'Bước 5 — Kiểm tra: (5/13)² + (12/13)² = 25/169 + 144/169 = 1, đúng cả với góc bù; cos của góc nhọn ' +
          'dương như mong đợi.',
      ],
      answer: 'cosα = −12/13; tanα = −5/12; sin(180° − α) = 5/13; cos(180° − α) = 12/13.',
    },
    checkQuestions: [
      {
        prompt: 'Tính cos 135° (làm tròn đến hai chữ số thập phân, nhập số âm nếu có).',
        answer: { kind: 'numeric', value: -0.71, tolerance: { mode: 'absolute', eps: 0.006 } },
        explain:
          'Góc bù của 135° là 45°, nên cos 135° = −cos 45° = −√2/2 ≈ −0,7071, làm tròn −0,71. Lỗi hay gặp là quên ' +
          'dấu âm và ghi 0,71, hoặc nhầm sang √3/2. Kiểm nhanh: 135° là góc tù nên M nằm bên trái trục tung, ' +
          'hoành độ phải âm.',
      },
      {
        prompt: 'Góc α thoả 0° ≤ α ≤ 180° và sinα = 1/2. Kết luận nào đúng?',
        choices: [
          { id: 'a', label: 'Chỉ có α = 30°' },
          { id: 'b', label: 'Chỉ có α = 150°' },
          { id: 'c', label: 'α = 30° hoặc α = 150°' },
          { id: 'd', label: 'α = 60° hoặc α = 120°' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Hai góc bù nhau có cùng sin: sin 150° = sin(180° − 30°) = sin 30° = 1/2, nên cả 30° và 150° đều thoả. ' +
          'Máy tính chỉ cho 30° nên rất dễ chọn nhầm đáp án a. Muốn chắc chắn một góc thì cần thêm thông tin, ví dụ ' +
          'dấu của cosα hoặc góc đó nhọn hay tù. Đáp án d là nhầm với sin 60° = √3/2.',
      },
      {
        prompt: 'Cho 90° < α < 180° và cosα = −3/5. Tính tanα (làm tròn đến hai chữ số thập phân).',
        answer: { kind: 'numeric', value: -1.33, tolerance: { mode: 'absolute', eps: 0.01 } },
        explain:
          'sin²α = 1 − 9/25 = 16/25 và sinα ≥ 0 nên sinα = 4/5. Vậy tanα = (4/5)/(−3/5) = −4/3 ≈ −1,33. Lỗi thường ' +
          'gặp là lấy sinα = −4/5 vì thấy cos âm; thực ra sin của góc từ 0° đến 180° không bao giờ âm. Tan âm ' +
          'là do cos âm chứ không phải do sin.',
      },
      {
        prompt: 'Tính giá trị biểu thức P = sin 150° + cos 120° + tan 135°.',
        answer: { kind: 'numeric', value: -1 },
        explain:
          'sin 150° = sin 30° = 1/2; cos 120° = −cos 60° = −1/2; tan 135° = −tan 45° = −1. Cộng lại: ' +
          '1/2 − 1/2 − 1 = −1. Sai lầm điển hình là cho tan 135° bằng +1 (quên đổi dấu) hoặc cho cos 120° ' +
          'bằng +1/2. Nhớ quy tắc: với góc bù, sin giữ nguyên, còn cos và tan đổi dấu.',
      },
    ],
    srsCards: [
      {
        hoi: 'Quan hệ sin, cos, tan của hai góc bù nhau α và 180° − α?',
        dap: 'sin giữ nguyên; cos và tan đổi dấu: sin(180° − α) = sinα, cos(180° − α) = −cosα, tan(180° − α) = −tanα.',
      },
      {
        hoi: 'Vì sao sinα ≥ 0 với mọi góc từ 0° đến 180°?',
        dap: 'Vì sinα là tung độ của điểm trên nửa đường tròn đơn vị phía trên trục hoành, nên không âm.',
      },
      {
        hoi: 'Khi biết sinα thì tìm được mấy góc trong [0°; 180°], còn khi biết cosα thì sao?',
        dap: 'Biết sin có thể ra hai góc bù nhau (30° và 150°); biết cos chỉ có đúng một góc vì cos giảm đều.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan10-c3-b3',
    grade: '10',
    chapterNumber: 3,
    chapterTitle: 'Hệ thức lượng trong tam giác',
    lessonNumber: 3,
    title: 'Diện tích tam giác và giải tam giác trong thực tế',
    hook:
      'Một gia đình ở Vĩnh Long có thửa vườn hình tam giác nằm giữa ba con mương. Họ chỉ đo được ba cạnh bằng ' +
      'thước dây, không đo được chiều cao vì phải lội bùn. Muốn biết cần bao nhiêu cây giống và đào được cái ao ' +
      'tròn lớn nhất là bao nhiêu, họ vẫn tính ra diện tích chính xác chỉ từ ba số đo ấy. Bài này giải thích vì sao ' +
      'các công thức diện tích đúng và dùng chúng như bộ dụng cụ đo đạc.',
    theory:
      'BỐN CÔNG THỨC DIỆN TÍCH VÀ VÌ SAO CHÚNG ĐÚNG\n' +
      'Cho tam giác ABC với a, b, c là ba cạnh, p = (a + b + c)/2 là nửa chu vi, R và r là bán kính đường tròn ' +
      'ngoại tiếp và nội tiếp.\n\n' +
      '1) S = (1/2)·ab·sinC. Hạ đường cao AH xuống BC thì AH = b·sinC, và S = (1/2)·a·AH. Khi C tù thì ' +
      'AH = b·sin(180° − C) = b·sinC, nhờ sin của hai góc bù bằng nhau, nên công thức đúng cho mọi tam giác.\n\n' +
      '2) S = abc/(4R). Định lí sin cho sinA = a/(2R); thế vào S = (1/2)·bc·sinA được S = abc/(4R).\n\n' +
      '3) S = p·r. Nối tâm đường tròn nội tiếp với ba đỉnh, tam giác chia thành ba tam giác nhỏ cùng có đường cao ' +
      'bằng r và đáy lần lượt a, b, c. Cộng lại S = (1/2)r·(a + b + c) = p·r.\n\n' +
      '4) CÔNG THỨC HERON: S = √(p(p − a)(p − b)(p − c)). Từ S = (1/2)bc·sinA suy ra ' +
      '16S² = 4b²c²·sin²A = 4b²c² − (b² + c² − a²)², vì cosA = (b² + c² − a²)/(2bc). Phân tích hiệu hai bình phương ' +
      'được (a + b + c)(b + c − a)(a + c − b)(a + b − c) = 16·p(p − a)(p − b)(p − c). Chia 16 rồi lấy căn.\n\n' +
      'CHỌN CÔNG THỨC THEO DỮ KIỆN\n' +
      '— Biết ba cạnh: Heron (cần thì tìm r = S/p, R = abc/(4S)).\n' +
      '— Biết hai cạnh và góc xen giữa: S = (1/2)ab·sinC.\n' +
      '— Biết bán kính nội tiếp hoặc ngoại tiếp kèm cạnh: S = pr hoặc S = abc/(4R).\n\n' +
      'GIẢI TAM GIÁC LÀ GÌ\n' +
      'Giải tam giác là tìm mọi cạnh và góc chưa biết từ ba yếu tố cho trước. Ba trường hợp cơ bản:\n' +
      '— Cạnh – góc – cạnh: định lí côsin tìm cạnh thứ ba, rồi hệ quả côsin tìm các góc.\n' +
      '— Góc – cạnh – góc: góc còn lại bằng 180° trừ hai góc đã biết, sau đó định lí sin tìm hai cạnh.\n' +
      '— Cạnh – cạnh – cạnh: hệ quả côsin tìm từng góc. Trước đó phải kiểm tra bất đẳng thức tam giác; nếu một ' +
      'số p − a, p − b, p − c không dương thì ba cạnh không lập được tam giác.\n' +
      'Trường hợp hai cạnh và góc ĐỐI DIỆN một cạnh (cạnh – cạnh – góc) có thể cho 0, 1 hoặc 2 tam giác, vì định lí ' +
      'sin cho hai góc bù nhau; phải đối chiếu tổng ba góc.\n\n' +
      'ĐO CHIỀU CAO HOẶC KHOẢNG CÁCH KHÔNG TỚI ĐƯỢC\n' +
      'Ví dụ đo tháp cao TH, chân H thẳng hàng với hai điểm đứng A, B (A xa hơn, AB = d). Đo góc nâng α tại A và β ' +
      'tại B. Góc ngoài của tam giác ATB cho góc ATB = β − α, định lí sin cho TB = d·sinα / sin(β − α), rồi ' +
      'h = TB·sinβ. Lưu ý: nếu hai điểm đứng quá gần nhau thì β − α rất nhỏ, sai số góc 1° đủ làm kết quả lệch ' +
      'nhiều; nên chọn đoạn đáy d cùng cỡ với khoảng cách tới tháp.',
    workedExample: {
      problem:
        'Thửa vườn hình tam giác có ba cạnh đo được 17 m, 25 m và 26 m. Tính diện tích thửa vườn, rồi tìm bán ' +
        'kính của ao tròn lớn nhất có thể đào trọn trong thửa vườn.',
      steps: [
        'Bước 1 — Chọn công cụ: chỉ biết ba cạnh, không có góc hay chiều cao, nên dùng công thức Heron. Nửa chu vi ' +
          'p = (17 + 25 + 26)/2 = 34.',
        'Bước 2 — Tính các hiệu và kiểm tra tam giác tồn tại: p − 17 = 17; p − 25 = 9; p − 26 = 8, cả ba đều ' +
          'dương nên ba cạnh lập được tam giác.',
        'Bước 3 — Áp dụng Heron: S = √(34·17·9·8) = √41616 = 204 m², vì 204² = 41616.',
        'Bước 4 — Ao tròn lớn nhất nằm trọn trong tam giác chính là hình tròn nội tiếp, tiếp xúc cả ba bờ. Dùng ' +
          'S = pr: r = S/p = 204/34 = 6 m.',
        'Bước 5 — Kiểm tra: đường cao hạ xuống cạnh 26 m là h = 2S/26 = 408/26 ≈ 15,7 m, nhỏ hơn hai cạnh kề ' +
          '(17 m và 25 m) như đường cao phải có; đường kính ao 12 m nhỏ hơn 15,7 m nên ao lọt trong vườn.',
      ],
      answer: 'Diện tích 204 m²; ao tròn lớn nhất có bán kính 6 m.',
    },
    checkQuestions: [
      {
        prompt: 'Tam giác ABC có ba cạnh 5, 5 và 6. Tính diện tích tam giác bằng công thức Heron.',
        answer: { kind: 'numeric', value: 12 },
        explain:
          'Nửa chu vi p = (5 + 5 + 6)/2 = 8, nên S = √(8·3·3·2) = √144 = 12. Lỗi hay gặp là dùng nguyên chu vi 16 ' +
          'thay cho p = 8, ra số lớn vô lý. Có thể tự kiểm: hạ đường cao xuống cạnh 6 thì h = √(25 − 9) = 4, ' +
          'S = (1/2)·6·4 = 12, trùng kết quả.',
      },
      {
        prompt:
          'Tam giác ABC có a = 6, b = 10 và góc C = 150° xen giữa hai cạnh đó. Tính diện tích.',
        answer: { kind: 'numeric', value: 15 },
        explain:
          'S = (1/2)·6·10·sin 150° = 30·(1/2) = 15. Điểm cần nhớ là sin 150° = sin 30° = 1/2 dương: sin của góc tù ' +
          'không âm. Ai nhầm sin 150° = −1/2 sẽ ra diện tích âm, một dấu hiệu sai ngay vì diện tích luôn dương. ' +
          'Công thức dùng thẳng góc tù, không cần đổi sang góc nhọn.',
      },
      {
        prompt:
          'Tam giác vuông có ba cạnh 6, 8, 10. Tính bán kính r của đường tròn nội tiếp (dùng S = pr).',
        answer: { kind: 'numeric', value: 2 },
        explain:
          'Diện tích S = (1/2)·6·8 = 24 (hai cạnh góc vuông), nửa chu vi p = 12, suy ra r = S/p = 24/12 = 2. Lỗi ' +
          'thường gặp là chia cho chu vi 24 thay vì nửa chu vi và ra r = 1. Kiểm tra bằng công thức riêng của tam ' +
          'giác vuông: r = (6 + 8 − 10)/2 = 2, khớp.',
      },
      {
        prompt:
          'Tháp cao TH có chân H thẳng hàng với hai điểm đứng A, B, với AB = 30 m (A xa tháp hơn). Góc nâng ' +
          'đỉnh tháp tại A là 30°, tại B là 60°. Tính chiều cao tháp (làm tròn đến phần mười, đơn vị mét).',
        answer: { kind: 'numeric', value: 26, tolerance: { mode: 'absolute', eps: 0.1 } },
        explain:
          'Góc ngoài của tam giác ATB tại B bằng 60°, nên ATB = 60° − 30° = 30°, bằng góc ở A: tam giác cân, ' +
          'TB = AB = 30 m. Chiều cao h = TB·sin60° = 30·(√3/2) ≈ 25,98 m, tức khoảng 26,0 m. Lỗi hay gặp là ' +
          'coi góc tại B của tam giác ATB là 60° thay vì 120° (bù với góc nâng) rồi áp định lí sin sai cặp.',
      },
    ],
    srsCards: [
      {
        hoi: 'Vì sao S = (1/2)ab·sinC vẫn đúng khi góc C tù?',
        dap: 'Vì đường cao hạ từ A bằng b·sin(180° − C) = b·sinC; sin của hai góc bù bằng nhau.',
      },
      {
        hoi: 'Công thức Heron là gì, p nghĩa là gì?',
        dap: 'S = √(p(p − a)(p − b)(p − c)), trong đó p = (a + b + c)/2 là NỬA chu vi.',
      },
      {
        hoi: 'Muốn đo chiều cao tháp không tới được, cần đo gì và dùng định lí nào?',
        dap: 'Đo đoạn đáy giữa hai điểm đứng thẳng hàng với chân tháp và hai góc nâng; dùng định lí sin trong tam giác có đáy là đoạn đo được.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
