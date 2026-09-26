// lessons/ly10c2.ts — Vật lí 10, Chương 2: Động học (9 bài).
import type { PhysicsLesson } from '../lessonTypes.js'

export const LY10_C2_LESSONS: PhysicsLesson[] = [
  {
    id: 'ly10-c2-b4',
    // Đi 100 m rồi quay lại 40 m: quãng đường và độ dịch chuyển tách đôi ngay trên cùng một hình.
    animation: {
      title: 'Đi 100 m rồi quay lại 40 m',
      description:
        'Một bạn xuất phát ở A đi thẳng sang phải tới B cách 100 m, rồi quay đầu đi ngược lại 40 m và dừng ở C. Cuối cảnh hiện ba mũi tên: mũi tên lượt đi A→B dài 100 m, mũi tên lượt về B→C dài 40 m, và mũi tên độ dịch chuyển nối thẳng A→C chỉ dài 60 m. Quãng đường là tổng chiều dài đường đã đi: 100 + 40 = 140 m, luôn dương. Độ dịch chuyển chỉ nối điểm đầu với điểm cuối: 60 m theo chiều dương. Hai số khác nhau vì lượt về mang dấu âm, làm giảm độ dịch chuyển nhưng vẫn cộng thêm vào quãng đường.',
      viewBoxWidth: 360,
      viewBoxHeight: 210,
      durationMs: 6000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'duong',
          x1: 20,
          y1: 130,
          x2: 340,
          y2: 130,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'moc-a',
          x1: 40,
          y1: 120,
          x2: 40,
          y2: 140,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'moc-c',
          x1: 160,
          y1: 120,
          x2: 160,
          y2: 140,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'moc-b',
          x1: 240,
          y1: 120,
          x2: 240,
          y2: 140,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'circle',
          id: 'nguoi-di',
          cx: 40,
          cy: 112,
          r: 9,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2400, dx: 200 },
            { atMs: 2800, dx: 200 },
            { atMs: 4400, dx: 120 },
            { atMs: 6000, dx: 120 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-a',
          x: 40,
          y: 156,
          text: 'A',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-c',
          x: 160,
          y: 156,
          text: 'C',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-b',
          x: 240,
          y: 156,
          text: 'B',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'arrow',
          id: 'luot-di',
          x1: 40,
          y1: 172,
          x2: 240,
          y2: 172,
          stroke: 'primary',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'luot-ve',
          x1: 240,
          y1: 186,
          x2: 160,
          y2: 186,
          stroke: 'accent',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4400, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'do-dich-chuyen',
          x1: 40,
          y1: 202,
          x2: 160,
          y2: 202,
          stroke: 'correct',
          strokeWidth: 4,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5000, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-qd',
          x: 20,
          y: 40,
          text: 'Quãng đường = 100 + 40 = 140 m',
          size: 14,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-ddc',
          x: 20,
          y: 62,
          text: 'Độ dịch chuyển = 100 − 40 = 60 m',
          size: 14,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-chieu',
          x: 20,
          y: 84,
          text: 'Chiều dương: sang phải',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Xuất phát tại A, chiều dương quy ước là sang phải.' },
        { atMs: 2400, text: 'Đi 100 m tới B: quãng đường 100 m, độ dịch chuyển +100 m.' },
        {
          atMs: 4400,
          text: 'Quay lại 40 m tới C: quãng đường cộng thêm, độ dịch chuyển bị trừ đi.',
        },
        { atMs: 5000, text: 'Kết quả: quãng đường 140 m nhưng độ dịch chuyển chỉ 60 m.' },
      ],
    },
    grade: '10',
    chapterNumber: 2,
    chapterTitle: 'Động học',
    lessonNumber: 4,
    title: 'Độ dịch chuyển và quãng đường đi được',
    hook:
      'Nếu bạn đi bộ 3 km về phía Đông rồi quay lại 3 km về phía Tây, tổng quãng đường bạn đi là 6 km, nhưng độ dịch chuyển của bạn lại bằng 0. ' +
      'Tại sao lại có sự khác biệt thú vị này?',
    theory:
      'HỆ QUY CHIẾU VÀ TỌA ĐỘ:\n' +
      '— Để xác định vị trí của vật, ta cần chọn một vật làm mốc, hệ trục toạ độ gắn với vật mốc, mốc thời gian và một đồng hồ (hệ quy chiếu).\n' +
      '— Vị trí vật tại một thời điểm được xác định bởi toạ độ (x, y).\n\n' +
      'QUÃNG ĐƯỜNG VÀ ĐỘ DỊCH CHUYỂN:\n' +
      '— Quãng đường đi được (s): Độ dài tuyến đường vật đi qua. Là đại lượng vô hướng luôn không âm (s ≥ 0).\n' +
      '— Độ dịch chuyển (d): Là một đại lượng vectơ biểu diễn sự thay đổi vị trí của vật. Vectơ độ dịch chuyển bắt đầu từ vị trí đầu và hướng thẳng tới vị trí cuối.\n' +
      '  — Độ lớn của độ dịch chuyển bằng khoảng cách giữa vị trí đầu và vị trí cuối.\n' +
      '  — Hướng: Hướng từ vị trí đầu đến vị trí cuối.\n' +
      '— Mối liên hệ: Khi vật chuyển động thẳng và không đổi chiều, độ lớn độ dịch chuyển bằng quãng đường (d = s). Khi vật đổi chiều chuyển động, quãng đường luôn lớn hơn độ lớn độ dịch chuyển (s > d).',
    workedExample: {
      problem:
        'Một người đi xe đạp từ điểm A đến điểm B cách nhau 4 km về hướng Bắc, sau đó rẽ phải đi tiếp 3 km về hướng Đông đến điểm C. ' +
        'Tính quãng đường đi được và độ lớn độ dịch chuyển của người này.',
      steps: [
        'Bước 1: Tính quãng đường s = AB + BC = 4 + 3 = 7 (km).',
        'Bước 2: Vẽ sơ đồ chuyển động. Điểm A đến B (hướng Bắc), B đến C (hướng Đông) tạo thành tam giác vuông tại B.',
        'Bước 3: Độ dịch chuyển d là vectơ AC. Độ lớn d = AC = √(AB² + BC²) = √(4² + 3²) = √25 = 5 (km).',
      ],
      answer: 'Quãng đường: 7 km; Độ dịch chuyển: 5 km.',
    },
    checkQuestions: [
      {
        prompt:
          'Một vận động viên chạy 1 vòng quanh sân vận động hình tròn bán kính 50 m rồi trở về vạch xuất phát. Tính độ lớn độ dịch chuyển của vận động viên.',
        choices: [
          { id: 'zero', label: '0 m' },
          { id: 'tram', label: '100 m' },
          { id: 'chu_vi', label: '314 m' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['zero'],
        },
        explain:
          'Chạy hết một vòng thì điểm cuối trùng điểm đầu, khoảng cách giữa chúng bằng 0 nên độ dịch chuyển bằng 0. ' +
          'Số 314 m là chu vi đường chạy, tức quãng đường đi được, không phải độ dịch chuyển; 100 m chỉ là đường kính sân.',
      },
      {
        prompt:
          'Một chiếc ô tô di chuyển 10 km về phía Đông, sau đó quay lại đi 4 km về phía Tây. Tính độ lớn độ dịch chuyển của ô tô.',
        choices: [
          { id: 'sau', label: '6 km' },
          { id: 'muoi_bon', label: '14 km' },
          { id: 'tuy_y', label: '10 km' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['sau'],
        },
        explain:
          'Chọn chiều dương hướng Đông. Lượt đi là +10 km, lượt về là -4 km, nên độ dịch chuyển d = 10 - 4 = 6 km. ' +
          'Con số 14 km là quãng đường (cộng cả hai lượt), còn 10 km mới chỉ là lượt đi.',
      },
    ],
    srsCards: [
      {
        hoi: 'Độ dịch chuyển khác quãng đường đi được ở điểm cốt lõi nào?',
        dap: 'Độ dịch chuyển là vectơ có hướng, còn quãng đường là đại lượng vô hướng.',
      },
      {
        hoi: 'Khi nào độ lớn của độ dịch chuyển bằng quãng đường đi được?',
        dap: 'Khi vật chuyển động thẳng và không đổi chiều.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c2-b5',
    // Chạy một vòng sân về đúng chỗ cũ: tốc độ trung bình khác 0 nhưng vận tốc trung bình bằng 0.
    animation: {
      title: 'Chạy hết một vòng sân rồi về chỗ cũ',
      description:
        'Một vận động viên chạy hết một vòng quanh sân hình chữ nhật 100 m × 50 m rồi dừng lại đúng chỗ xuất phát. Chấm tròn đi lần lượt bốn cạnh và khép kín vòng. Đồng hồ đo được 60 giây. Quãng đường đi được là chu vi sân: 2 × (100 + 50) = 300 m, nên tốc độ trung bình là 300 : 60 = 5 m/s. Nhưng điểm cuối trùng điểm đầu nên độ dịch chuyển bằng 0, và vận tốc trung bình — tính bằng độ dịch chuyển chia thời gian — cũng bằng 0. Cùng một chuyển động, hai đại lượng cho hai kết quả khác hẳn nhau: tốc độ nói vật đi nhiều hay ít, vận tốc nói vật rời chỗ bao xa và theo hướng nào.',
      viewBoxWidth: 360,
      viewBoxHeight: 220,
      durationMs: 6000,
      loop: true,
      shapes: [
        {
          kind: 'polyline',
          id: 'duong-chay',
          points: [
            [80, 70],
            [280, 70],
            [280, 160],
            [80, 160],
          ],
          closed: true,
          stroke: 'muted',
          strokeWidth: 3,
          dash: '6 4',
        },
        {
          kind: 'circle',
          id: 'vdv',
          cx: 80,
          cy: 160,
          r: 9,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 1500, dx: 0, dy: -90 },
            { atMs: 3000, dx: 200, dy: -90 },
            { atMs: 4500, dx: 200, dy: 0 },
            { atMs: 6000, dx: 0, dy: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'vach-xuat-phat',
          cx: 80,
          cy: 160,
          r: 14,
          stroke: 'accent',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'nhan-dai',
          x: 180,
          y: 182,
          text: '100 m',
          size: 13,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-rong',
          x: 296,
          y: 118,
          text: '50 m',
          size: 13,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-xp',
          x: 80,
          y: 200,
          text: 'Xuất phát ≡ Đích',
          size: 12,
          anchor: 'middle',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-toc-do',
          x: 20,
          y: 30,
          text: 'Quãng đường 300 m trong 60 s → tốc độ TB = 5 m/s',
          size: 13,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-van-toc',
          x: 20,
          y: 50,
          text: 'Độ dịch chuyển = 0 → vận tốc TB = 0',
          size: 13,
          anchor: 'start',
          fill: 'accent',
        },
      ],
      captions: [
        { atMs: 0, text: 'Vận động viên xuất phát ở góc dưới bên trái.' },
        { atMs: 3000, text: 'Đã chạy được nửa vòng, đang ở góc đối diện.' },
        { atMs: 6000, text: 'Về đúng chỗ cũ: đi 300 m nhưng không rời chỗ mét nào.' },
      ],
    },
    grade: '10',
    chapterNumber: 2,
    chapterTitle: 'Động học',
    lessonNumber: 5,
    title: 'Tốc độ và vận tốc',
    hook:
      'Đồng hồ tốc độ trên xe máy chỉ cho bạn biết xe chạy nhanh hay chậm (tốc độ). Nhưng để lái máy bay an toàn, ' +
      'phi công cần biết thêm hướng chuyển động của gió và máy bay (vận tốc). Sự khác nhau giữa chúng là gì?',
    theory:
      'TỐC ĐỘ (SPEED):\n' +
      '— Tốc độ trung bình: v_tb = s / t. Đặc trưng cho mức độ nhanh hay chậm của chuyển động trên cả quãng đường.\n' +
      '— Tốc độ tức thời: Tốc độ tại một thời điểm xác định (chỉ số trên tốc kế).\n\n' +
      'VẬN TỐC (VELOCITY):\n' +
      '— Vận tốc trung bình (v): Là đại lượng vectơ xác định bằng thương số giữa độ dịch chuyển của vật và thời gian dịch chuyển.\n' +
      '  — Công thức: v = d / t (dạng độ lớn trên trục thẳng) hoặc vectơ v = vectơ d / t.\n' +
      '  — Hướng của vận tốc trùng với hướng của độ dịch chuyển.\n\n' +
      'CÔNG THỨC CỘNG VẬN TỐC (RELATIVE VELOCITY):\n' +
      '— Nếu một vật tham gia đồng thời hai chuyển động thì vận tốc tuyệt đối (vật so với hệ quy chiếu đứng yên 1-3) bằng tổng vectơ của vận tốc tương đối (vật so với hệ quy chiếu chuyển động 1-2) và vận tốc kéo theo (hệ quy chiếu chuyển động so với hệ quy chiếu đứng yên 2-3):\n' +
      '  — Vectơ v₁₃ = vectơ v₁₂ + vectơ v₂₃.\n' +
      '  — Cùng chiều: v₁₃ = v₁₂ + v₂₃. Ngược chiều: v₁₃ = |v₁₂ - v₂₃|.',
    workedExample: {
      problem:
        'Một con thuyền đi xuôi dòng với vận tốc 4 m/s so với dòng nước. Dòng nước chảy với vận tốc 1,5 m/s so với bờ. ' +
        'Tính vận tốc của con thuyền so với bờ khi thuyền đi xuôi dòng và ngược dòng.',
      steps: [
        'Gọi thuyền là vật (1), nước là hệ quy chiếu chuyển động (2), bờ là hệ quy chiếu đứng yên (3).',
        'Vận tốc của thuyền so với nước: v₁₂ = 4 m/s. Vận tốc của nước so với bờ: v₂₃ = 1,5 m/s.',
        'Khi thuyền đi xuôi dòng, vectơ v₁₂ cùng chiều với vectơ v₂₃: v₁₃ = v₁₂ + v₂₃ = 4 + 1,5 = 5,5 (m/s).',
        'Khi thuyền đi ngược dòng, vectơ v₁₂ ngược chiều với vectơ v₂₃: v₁₃ = v₁₂ - v₂₃ = 4 - 1,5 = 2,5 (m/s).',
      ],
      answer: 'Xuôi dòng: 5,5 m/s; Ngược dòng: 2,5 m/s.',
    },
    checkQuestions: [
      {
        prompt: 'Vận tốc khác tốc độ ở điểm đặc trưng nào?',
        choices: [
          { id: 'khong_khac', label: 'Không có điểm gì khác nhau' },
          { id: 'huong', label: 'Vận tốc là đại lượng vectơ có hướng, tốc độ là vô hướng' },
          { id: 'don_vi', label: 'Vận tốc đo bằng m/s, tốc độ đo bằng km/h' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['huong'],
        },
        explain:
          'Vận tốc mô tả cả độ nhanh chậm và hướng chuyển động của vật, trong khi tốc độ chỉ mô tả độ nhanh chậm.',
      },
      {
        prompt:
          'Một người bơi xuôi dòng sông với tốc độ 2 m/s so với dòng nước. Dòng sông chảy với tốc độ 0,5 m/s so với bờ. Tính tốc độ của người đó so với bờ.',
        answer: {
          kind: 'numeric',
          value: 2.5,
          unit: 'm/s',
        },
        explain:
          'Bơi xuôi dòng nên hai vận tốc cùng chiều, ta cộng lại: v = 2 + 0,5 = 2,5 m/s. Đây là công thức cộng vận tốc: ' +
          'vận tốc so với bờ bằng vận tốc so với nước cộng vận tốc của nước so với bờ. Cùng chiều thì cộng, ngược chiều thì trừ.',
      },
    ],
    srsCards: [
      {
        hoi: 'Đơn vị đo chuẩn của vận tốc trong hệ SI là gì?',
        dap: 'Mét trên giây (m/s).',
      },
      {
        hoi: 'Phát biểu công thức cộng vận tốc dạng vectơ?',
        dap: 'Vectơ v₁₃ = vectơ v₁₂ + vectơ v₂₃.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c2-b6',
    grade: '10',
    chapterNumber: 2,
    chapterTitle: 'Động học',
    lessonNumber: 6,
    title: 'Thực hành: Đo tốc độ của vật chuyển động',
    hook:
      'Làm thế nào các thiết bị bắn tốc độ của cảnh sát giao thông biết chính xác xe bạn đang chạy quá tốc độ? ' +
      'Hãy học cách tự thiết lập phép đo tốc độ chính xác trong phòng thực hành.',
    theory:
      'PHƯƠNG PHÁP ĐO TỐC ĐỘ THƯỜNG DÙNG:\n' +
      '— Sử dụng thước và đồng hồ bấm giây (đo thủ công): Sai số lớn do phản xạ bấm nút của con người (~0,1s đến 0,2s).\n' +
      '— Sử dụng cổng quang điện và đồng hồ đo thời gian hiện số (đo tự động):\n' +
      '  — Khi vật chắn cổng quang điện thứ nhất, đồng hồ bắt đầu chạy. Khi vật chắn cổng thứ hai, đồng hồ dừng.\n' +
      '  — Tốc độ trung bình: v = s / t với s là khoảng cách giữa 2 cổng quang, t là thời gian hiển thị trên đồng hồ.\n' +
      '— Sử dụng cảm biến chuyển động (sonar hoặc laser) nối với máy tính để ghi lại đồ thị độ dịch chuyển tự động.\n\n' +
      'SAI SỐ TRONG THỰC HÀNH:\n' +
      '— Sai số ngẫu nhiên: Do vị trí thả vật lệch, luồng gió nhẹ, hoặc bấm nút lệch thời gian.\n' +
      '— Sai số dụng cụ: Lấy theo độ chia nhỏ nhất của thước đo và độ nhạy của đồng hồ đo.',
    workedExample: {
      problem:
        'Trong thí nghiệm đo tốc độ của xe đồ chơi bằng cổng quang điện, khoảng cách giữa 2 cổng quang đo được là s = 0,80 m. ' +
        'Thời gian xe đi qua khoảng cách này hiển thị trên đồng hồ là t = 0,40s. Tính tốc độ trung bình của xe.',
      steps: [
        'Xác định quãng đường đi được s = 0,80 m.',
        'Xác định khoảng thời gian t = 0,40 s.',
        'Áp dụng công thức v = s / t = 0,80 / 0,40 = 2,0 (m/s).',
      ],
      answer: 'v = 2 m/s',
    },
    checkQuestions: [
      {
        prompt:
          'Thiết bị nào trong phòng thực hành giúp đo thời gian một chiếc xe đi qua một khoảng cách, vừa tự động vừa chính xác cao?',
        choices: [
          { id: 'stopwatch', label: 'Đồng hồ bấm giây cầm tay' },
          { id: 'gate', label: 'Cổng quang điện kết hợp đồng hồ đo hiện số' },
          { id: 'ruler', label: 'Thước cuộn tự động' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['gate'],
        },
        explain:
          'Cổng quang điện kích hoạt và ngắt bộ đếm thời gian bằng chùm sáng bị chặn, loại bỏ hoàn toàn sai số do phản xạ người bấm.',
      },
      {
        prompt:
          'Khoảng cách giữa hai cổng quang điện là 0,5 m. Đồng hồ đo được thời gian xe đi qua là 0,2 s. Tính tốc độ của xe.',
        answer: {
          kind: 'numeric',
          value: 2.5,
          unit: 'm/s',
        },
        explain:
          'Hai cổng quang điện cho biết quãng đường s giữa chúng và thời gian t xe đi hết quãng đó, ' +
          'nên tốc độ v = s / t = 0,5 / 0,2 = 2,5 m/s. Lưu ý đơn vị: mét chia giây mới ra m/s, ' +
          'nên nếu đề cho quãng đường bằng xăngtimét thì phải đổi sang mét trước khi chia.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tại sao đo tốc độ bằng đồng hồ bấm giây bằng tay lại có sai số lớn?',
        dap: 'Do sai số phản xạ thần kinh của người bấm nút khi bắt đầu và kết thúc phép đo.',
      },
      {
        hoi: 'Công thức tính tốc độ trung bình của xe chạy qua hai cổng quang là gì?',
        dap: 'v = s / t (s là khoảng cách giữa 2 cổng quang, t là thời gian chuyển động).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c2-b7',
    // Đồ thị d–t ba đoạn: độ dốc chính là vận tốc, đoạn nằm ngang là đứng yên, dốc xuống là đi ngược chiều dương.
    animation: {
      title: 'Đọc vận tốc từ độ dốc đồ thị d–t',
      description:
        'Đồ thị độ dịch chuyển theo thời gian gồm ba đoạn thẳng, một chấm sáng chạy dọc đồ thị theo thời gian. Đoạn 1 từ giây 0 đến giây 4: đường đi lên từ 0 đến 40 m, độ dốc 40 : 4 = 10 m/s, vật đi theo chiều dương. Đoạn 2 từ giây 4 đến giây 7: đường nằm ngang ở mức 40 m, độ dốc bằng 0, vật đứng yên tại chỗ chứ không phải đi đều. Đoạn 3 từ giây 7 đến giây 12: đường dốc xuống về 0, độ dốc âm (0 − 40) : 5 = −8 m/s, vật quay ngược về vị trí ban đầu. Đường càng dốc thì vật đi càng nhanh; dấu của độ dốc cho biết chiều chuyển động.',
      viewBoxWidth: 360,
      viewBoxHeight: 210,
      durationMs: 6000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'truc-x',
          x1: 50,
          y1: 170,
          x2: 330,
          y2: 170,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'truc-y',
          x1: 50,
          y1: 170,
          x2: 50,
          y2: 30,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'polyline',
          id: 'do-thi',
          points: [
            [50, 170],
            [130, 90],
            [190, 90],
            [290, 170],
          ],
          stroke: 'primary',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'guong-40',
          x1: 50,
          y1: 90,
          x2: 190,
          y2: 90,
          stroke: 'muted',
          strokeWidth: 1.5,
          dash: '4 4',
        },
        {
          kind: 'circle',
          id: 'con-tro',
          cx: 50,
          cy: 170,
          r: 6,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 2000, dx: 80, dy: -80 },
            { atMs: 3500, dx: 140, dy: -80 },
            { atMs: 6000, dx: 240, dy: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-d',
          x: 56,
          y: 44,
          text: 'd (m)',
          size: 13,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-t',
          x: 332,
          y: 188,
          text: 't (s)',
          size: 13,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-40',
          x: 44,
          y: 94,
          text: '40',
          size: 12,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-doan1',
          x: 60,
          y: 110,
          text: '+10 m/s',
          size: 12,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-doan2',
          x: 160,
          y: 80,
          text: 'đứng yên',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-doan3',
          x: 246,
          y: 118,
          text: '−8 m/s',
          size: 12,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-goc',
          x: 44,
          y: 186,
          text: 'O',
          size: 12,
          anchor: 'end',
          fill: 'neutral',
        },
      ],
      captions: [
        { atMs: 0, text: 'Đoạn dốc lên: vật đi theo chiều dương với vận tốc 10 m/s.' },
        { atMs: 2000, text: 'Đoạn nằm ngang: độ dịch chuyển không đổi — vật đứng yên.' },
        { atMs: 3500, text: 'Đoạn dốc xuống: vận tốc âm, vật quay về chỗ cũ.' },
      ],
    },
    grade: '10',
    chapterNumber: 2,
    chapterTitle: 'Động học',
    lessonNumber: 7,
    title: 'Đồ thị độ dịch chuyển – thời gian',
    hook:
      'Một đồ thị đơn giản có thể vẽ nên toàn bộ hành trình của một chiếc tàu hoả. Nhìn vào đồ thị độ dịch chuyển - thời gian, ' +
      'ta không chỉ biết tàu đang đi đâu, mà còn biết tàu chạy nhanh thế nào hay đang dừng nghỉ.',
    theory:
      'ĐỒ THỊ ĐỘ DỊCH CHUYỂN — THỜI GIAN (d-t):\n' +
      '— Trục đứng (tung độ) biểu diễn độ dịch chuyển d. Trục ngang (hoành độ) biểu diễn thời gian t.\n\n' +
      'Ý NGHĨA CỦA ĐỒ THỊ d-t:\n' +
      '— Đường thẳng nằm ngang (song song với trục t): Độ dịch chuyển không đổi theo thời gian → Vật đứng yên (v = 0).\n' +
      '— Đường thẳng dốc lên: Độ dịch chuyển tăng đều theo thời gian → Vật chuyển động thẳng đều theo chiều dương (v > 0).\n' +
      '— Đường thẳng dốc xuống: Độ dịch chuyển giảm đều theo thời gian → Vật chuyển động thẳng đều ngược chiều dương (v < 0).\n' +
      '— Độ dốc (slope / hệ số góc) của đồ thị d-t chính là vận tốc của chuyển động:\n' +
      '  — Hệ số góc: v = Δd / Δt = (d₂ - d₁) / (t₂ - t₁).',
    workedExample: {
      problem:
        'Một vật chuyển động thẳng đều có đồ thị d-t là một đường thẳng đi qua hai điểm: điểm đầu (t₁ = 0s; d₁ = 2 m) ' +
        'và điểm sau (t₂ = 4s; d₂ = 10 m). Tính vận tốc của vật.',
      steps: [
        'Xác định độ thay đổi độ dịch chuyển: Δd = d₂ - d₁ = 10 - 2 = 8 m.',
        'Xác định thời gian dịch chuyển tương ứng: Δt = t₂ - t₁ = 4 - 0 = 4 s.',
        'Tính hệ số góc của đồ thị d-t để tìm vận tốc: v = Δd / Δt = 8 / 4 = 2 (m/s).',
      ],
      answer: 'v = 2 m/s',
    },
    checkQuestions: [
      {
        prompt:
          'Độ dốc (slope) của đồ thị độ dịch chuyển — thời gian (d-t) của một chuyển động thẳng cho biết đại lượng nào?',
        choices: [
          { id: 'gia_toc', label: 'Gia tốc của chuyển động' },
          { id: 'van_toc', label: 'Vận tốc của chuyển động' },
          { id: 'quang_duong', label: 'Quãng đường đi được' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['van_toc'],
        },
        explain:
          'Hệ số góc của đồ thị d-t bằng Δd/Δt, đúng bằng định nghĩa của vận tốc. Gia tốc là độ dốc của đồ thị v-t ' +
          'chứ không phải d-t; còn quãng đường đọc trực tiếp trên trục đứng, không phải từ độ dốc.',
      },
      {
        prompt:
          'Đồ thị d-t của một vật là một đường thẳng nằm ngang song song với trục thời gian. Điều này cho biết vật đang ở trạng thái nào?',
        choices: [
          { id: 'dung_yen', label: 'Vật đứng yên' },
          { id: 'nhanh_dan', label: 'Vật chuyển động nhanh dần' },
          { id: 'cham_dan', label: 'Vật chuyển động chậm dần' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['dung_yen'],
        },
        explain:
          'Đường nằm ngang có nghĩa là độ dịch chuyển d không đổi khi t tăng lên, tức là vật đứng yên.',
      },
    ],
    srsCards: [
      {
        hoi: 'Độ dốc của đồ thị d-t âm (đường dốc xuống) nghĩa là gì?',
        dap: 'Vật đang chuyển động thẳng đều ngược chiều dương đã chọn.',
      },
      {
        hoi: 'Công thức tìm vận tốc dựa vào toạ độ hai điểm trên đồ thị d-t?',
        dap: 'v = (d₂ - d₁) / (t₂ - t₁).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c2-b8',
    // Đồ thị v–t của chuyển động biến đổi đều là ĐƯỜNG THẲNG; gia tốc là độ dốc của đường thẳng đó.
    animation: {
      title: 'Gia tốc là độ dốc của đồ thị v–t',
      description:
        'Đồ thị vận tốc theo thời gian của một ô tô tăng tốc đều. Đường biểu diễn là một đường THẲNG dốc lên, không phải đường cong: vận tốc tăng đều đặn mỗi giây như nhau. Chấm sáng chạy dọc đường thẳng cho thấy tại giây 0 vận tốc là 2 m/s, tại giây 5 là 12 m/s, tại giây 10 là 22 m/s. Hai đường nét đứt dựng thành một tam giác vuông từ giây 5 đến giây 10: cạnh ngang là khoảng thời gian Δt = 5 s, cạnh đứng là độ tăng vận tốc Δv = 10 m/s. Gia tốc a = Δv : Δt = 10 : 5 = 2 m/s², nghĩa là mỗi giây vận tốc tăng thêm 2 m/s. Lấy tam giác ở bất kì đoạn nào của đường thẳng cũng ra đúng con số đó.',
      viewBoxWidth: 360,
      viewBoxHeight: 210,
      durationMs: 5000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'truc-x',
          x1: 50,
          y1: 170,
          x2: 330,
          y2: 170,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'truc-y',
          x1: 50,
          y1: 170,
          x2: 50,
          y2: 30,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'polyline',
          id: 'do-thi-v',
          points: [
            [50, 160],
            [290, 60],
          ],
          stroke: 'primary',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'canh-ngang',
          x1: 170,
          y1: 110,
          x2: 290,
          y2: 110,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '5 4',
        },
        {
          kind: 'line',
          id: 'canh-dung',
          x1: 290,
          y1: 110,
          x2: 290,
          y2: 60,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '5 4',
        },
        {
          kind: 'circle',
          id: 'con-tro-v',
          cx: 50,
          cy: 160,
          r: 6,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 5000, dx: 240, dy: -100 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-v',
          x: 56,
          y: 44,
          text: 'v (m/s)',
          size: 13,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-t',
          x: 332,
          y: 188,
          text: 't (s)',
          size: 13,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-v0',
          x: 44,
          y: 164,
          text: '2',
          size: 12,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-v10',
          x: 44,
          y: 64,
          text: '22',
          size: 12,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-dt',
          x: 230,
          y: 128,
          text: 'Δt = 5 s',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-dv',
          x: 294,
          y: 88,
          text: 'Δv = 10 m/s',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-a',
          x: 20,
          y: 24,
          text: 'a = Δv / Δt = 2 m/s² — đường thẳng nên a không đổi',
          size: 13,
          anchor: 'start',
          fill: 'primary',
        },
      ],
      captions: [
        { atMs: 0, text: 'Vận tốc đầu 2 m/s, đường biểu diễn là đường thẳng dốc lên.' },
        { atMs: 2500, text: 'Sau 5 giây vận tốc đạt 12 m/s.' },
        { atMs: 5000, text: 'Sau 10 giây đạt 22 m/s: mỗi giây tăng đều 2 m/s.' },
      ],
    },
    grade: '10',
    chapterNumber: 2,
    chapterTitle: 'Động học',
    lessonNumber: 8,
    title: 'Chuyển động biến đổi. Gia tốc',
    hook:
      'Một chiếc siêu xe thể thao có thể tăng tốc từ 0 lên 100 km/h chỉ trong 2,5 giây. Đại lượng nào đo lường ' +
      'mức độ thay đổi vận tốc nhanh hay chậm của chiếc xe đó?',
    theory:
      'KHÁI NIỆM CHUYỂN ĐỘNG BIẾN ĐỔI:\n' +
      '— Chuyển động biến đổi là chuyển động có vận tốc thay đổi theo thời gian.\n\n' +
      'GIA TỐC (ACCELERATION):\n' +
      '— Gia tốc là đại lượng vectơ đặc trưng cho sự thay đổi nhanh hay chậm của vận tốc theo thời gian.\n' +
      '— Công thức tính gia tốc trung bình:\n' +
      '  — a = Δv / Δt = (v_t - v_o) / t (dạng đại số trên trục chuyển động thẳng).\n' +
      '  — Dạng vectơ: vectơ a = (vectơ v_t - vectơ v_o) / Δt.\n' +
      '— Đơn vị đo trong hệ SI: Mét trên giây bình phương (m/s²).\n\n' +
      'TÍNH CHẤT CHUYỂN ĐỘNG THẲNG BIẾN ĐỔI:\n' +
      '— Chuyển động thẳng nhanh dần: Vectơ vận tốc và vectơ gia tốc cùng chiều (a và v cùng dấu: a.v > 0).\n' +
      '— Chuyển động thẳng chậm dần: Vectơ vận tốc và vectơ gia tốc ngược chiều (a và v trái dấu: a.v < 0).',
    workedExample: {
      problem:
        'Một ô tô đang chạy thẳng đều với vận tốc 10 m/s thì tăng tốc đều, sau 5s đạt vận tốc 25 m/s. ' +
        'Tính gia tốc của xe.',
      steps: [
        'Xác định vận tốc ban đầu v_o = 10 m/s.',
        'Xác định vận tốc thời điểm t: v_t = 25 m/s.',
        'Xác định thời gian thay đổi vận tốc: Δt = 5 s.',
        'Áp dụng công thức a = (v_t - v_o) / Δt = (25 - 10) / 5 = 15 / 5 = 3 (m/s²).',
      ],
      answer: 'a = 3 m/s²',
    },
    checkQuestions: [
      {
        prompt:
          'Một đoàn tàu đang đi vào ga với vận tốc 20 m/s thì hãm phanh chuyển động chậm dần đều. Sau 3s vận tốc tàu còn 5 m/s. Tính gia tốc của tàu.',
        answer: {
          kind: 'numeric',
          value: -5,
          unit: 'm/s^2',
        },
        explain: 'Gia tốc a = (v_t - v_o) / t = (5 - 20) / 3 = -15 / 3 = -5 m/s².',
      },
      {
        prompt:
          'Trong chuyển động thẳng nhanh dần đều, mối quan hệ về chiều (hoặc dấu) giữa vectơ gia tốc (a) và vectơ vận tốc (v) là gì?',
        choices: [
          { id: 'cung_chieu', label: 'Vectơ gia tốc và vectơ vận tốc cùng chiều (a.v > 0)' },
          { id: 'nguoc_chieu', label: 'Vectơ gia tốc và vectơ vận tốc ngược chiều (a.v < 0)' },
          { id: 'vuong_goc', label: 'Vectơ gia tốc vuông góc với vectơ vận tốc' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['cung_chieu'],
        },
        explain:
          'Gia tốc cùng chiều vận tốc thì mỗi giây vận tốc lại được cộng thêm, nên độ lớn vận tốc tăng: đó là nhanh dần. ' +
          'Ngược chiều (a.v < 0) là chậm dần. Còn gia tốc vuông góc với vận tốc thì chỉ làm đổi hướng, không đổi tốc độ.',
      },
    ],
    srsCards: [
      {
        hoi: 'Đơn vị đo gia tốc trong hệ SI là gì?',
        dap: 'Mét trên giây bình phương (m/s²).',
      },
      {
        hoi: 'Khi nào chuyển động thẳng là chậm dần đều?',
        dap: 'Khi gia tốc ngược chiều với vận tốc (a.v < 0).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c2-b9',
    // Quãng đường trong các giây liên tiếp của chuyển động nhanh dần đều tỉ lệ 1 : 3 : 5 : 7 — nhìn thấy được, không cần chứng minh.
    animation: {
      title: 'Quãng đường mỗi giây theo tỉ lệ 1 : 3 : 5 : 7',
      description:
        'Một viên bi xuất phát từ trạng thái nghỉ, chuyển động thẳng nhanh dần đều. Cứ mỗi giây trôi qua, một vạch mốc lại hiện ra đúng chỗ viên bi đang tới. Sau giây thứ nhất bi đi được 1 ô, giây thứ hai thêm 3 ô, giây thứ ba thêm 5 ô, giây thứ tư thêm 7 ô — các vạch mốc thưa dần ra rất rõ. Tỉ lệ 1 : 3 : 5 : 7 chính là hệ quả của công thức s = ½at²: tổng quãng đường sau 1, 2, 3, 4 giây lần lượt là 1, 4, 9, 16 ô, hiệu của hai số liên tiếp cho ra dãy số lẻ. Chuyển động nhanh dần đều không phải là đi thêm quãng đường như nhau mỗi giây, mà là đi thêm vận tốc như nhau mỗi giây.',
      viewBoxWidth: 360,
      viewBoxHeight: 190,
      durationMs: 5000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'mang-truot',
          x1: 15,
          y1: 120,
          x2: 350,
          y2: 120,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'circle',
          id: 'vien-bi',
          cx: 20,
          cy: 110,
          r: 8,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 1000, dx: 20 },
            { atMs: 2000, dx: 80 },
            { atMs: 3000, dx: 180 },
            { atMs: 4000, dx: 320 },
            { atMs: 5000, dx: 320 },
          ],
        },
        {
          kind: 'line',
          id: 'moc-0',
          x1: 20,
          y1: 108,
          x2: 20,
          y2: 132,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'moc-1',
          x1: 40,
          y1: 108,
          x2: 40,
          y2: 132,
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1000, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'moc-2',
          x1: 100,
          y1: 108,
          x2: 100,
          y2: 132,
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2000, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'moc-3',
          x1: 200,
          y1: 108,
          x2: 200,
          y2: 132,
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3000, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'moc-4',
          x1: 340,
          y1: 108,
          x2: 340,
          y2: 132,
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4000, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'o-1',
          x: 30,
          y: 152,
          text: '1',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'o-3',
          x: 70,
          y: 152,
          text: '3',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'o-5',
          x: 150,
          y: 152,
          text: '5',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'o-7',
          x: 270,
          y: 152,
          text: '7',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'ghi-chu',
          x: 15,
          y: 40,
          text: 'Nhanh dần đều từ nghỉ: s = ½at²',
          size: 14,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'ghi-chu-2',
          x: 15,
          y: 62,
          text: 'Quãng đường từng giây: 1 : 3 : 5 : 7',
          size: 14,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'ghi-chu-3',
          x: 15,
          y: 176,
          text: 'Mỗi số là quãng đường đi trong một giây',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 1000, text: 'Hết giây 1: đi được 1 ô.' },
        { atMs: 2000, text: 'Hết giây 2: đi thêm 3 ô, tổng 4 ô.' },
        { atMs: 3000, text: 'Hết giây 3: đi thêm 5 ô, tổng 9 ô.' },
        { atMs: 4000, text: 'Hết giây 4: đi thêm 7 ô, tổng 16 ô — các vạch thưa dần.' },
      ],
    },
    grade: '10',
    chapterNumber: 2,
    chapterTitle: 'Động học',
    lessonNumber: 9,
    title: 'Chuyển động thẳng biến đổi đều',
    hook:
      'Khi một đoàn tàu phanh lại hoặc một chiếc máy bay cất cánh trên đường băng, vận tốc của chúng tăng hoặc giảm đều đặn. ' +
      'Đây là chuyển động thẳng biến đổi đều — nền tảng của mọi bài toán cơ học động lực.',
    theory:
      'ĐỊNH NGHĨA CHUYỂN ĐỘNG THẲNG BIẾN ĐỔI ĐỀU:\n' +
      '— Chuyển động thẳng có gia tốc không đổi theo thời gian (a = hằng số).\n\n' +
      'HỆ PHƯƠNG TRÌNH CHUYỂN ĐỘNG THẲNG BIẾN ĐỔI ĐỀU (Chọn gốc toạ độ trùng vị trí đầu, chiều dương là chiều chuyển động):\n' +
      '1. Phương trình vận tốc: v = v_o + a.t.\n' +
      '2. Phương trình độ dịch chuyển: d = v_o.t + 0,5.a.t².\n' +
      '3. Công thức liên hệ không phụ thuộc thời gian: v² - v_o² = 2.a.d.',
    workedExample: {
      problem:
        'Một người đi xe máy đang chạy với vận tốc 10 m/s thì tắt máy hãm phanh chuyển động chậm dần đều với gia tốc có độ lớn 2 m/s². ' +
        'Tính quãng đường xe đi được từ lúc phanh đến khi dừng hẳn.',
      steps: [
        'Chọn chiều dương là chiều chuyển động. Vận tốc ban đầu v_o = 10 m/s.',
        'Xe chuyển động chậm dần đều nên gia tốc ngược chiều vận tốc: a = -2 m/s².',
        'Vật dừng hẳn: v = 0.',
        'Sử dụng công thức liên hệ v² - v_o² = 2.a.d => 0² - 10² = 2 * (-2) * d.',
        '-100 = -4.d => d = 25 (m).',
        'Vì xe đi thẳng không đổi chiều nên quãng đường s = d = 25 m.',
      ],
      answer: 's = 25 m',
    },
    checkQuestions: [
      {
        prompt:
          'Viết công thức liên hệ giữa vận tốc ban đầu (v_o), vận tốc sau (v), gia tốc (a) và độ dịch chuyển (d) trong chuyển động thẳng biến đổi đều.',
        choices: [
          { id: 'ct_1', label: 'v² - v_o² = 2.a.d' },
          { id: 'ct_2', label: 'v - v_o = a.d' },
          { id: 'ct_3', label: 'v² + v_o² = 2.a.d' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['ct_1'],
        },
        explain:
          'Rút t = (v - v_o)/a từ phương trình vận tốc rồi thay vào d = v_o.t + 0,5.a.t², ta được v² - v_o² = 2.a.d. ' +
          'Đáp án v - v_o = a.d sai vì vế phải phải là a.t chứ không phải a.d; đáp án còn lại sai dấu, phải là hiệu hai bình phương.',
      },
      {
        prompt:
          'Một xe đạp bắt đầu chuyển động từ trạng thái nghỉ (v_o = 0) và tăng tốc đều với gia tốc 2 m/s². Tính độ dịch chuyển của xe sau khi đi được 5 s.',
        answer: {
          kind: 'numeric',
          value: 25,
          unit: 'm',
        },
        explain:
          'Xe xuất phát từ trạng thái nghỉ nên v_o = 0. Áp dụng d = v_o.t + 0,5.a.t² = 0 * 5 + 0,5 * 2 * 5² = 25 m.',
      },
    ],
    srsCards: [
      {
        hoi: 'Viết công thức tính vận tốc của vật tại thời điểm t trong chuyển động thẳng biến đổi đều?',
        dap: 'v = v_o + a.t.',
      },
      {
        hoi: 'Viết phương trình độ dịch chuyển d theo v_o, a và t?',
        dap: 'd = v_o.t + 0,5.a.t².',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c2-b10',
    // Hoạt ảnh phá hiểu lầm kinh điển "vật nặng rơi nhanh hơn": đặt cạnh nhau ống chân không
    // (bi và lông chim rơi trùng nhau) và ống có không khí (lông chim tụt lại).
    animation: {
      title: 'Trong chân không, bi sắt và lông chim rơi như nhau',
      description:
        'Bên trái là ống đã hút hết không khí: một viên bi sắt và một chiếc lông chim được thả cùng lúc từ miệng ống. Ở mọi thời điểm hai vật luôn ngang nhau và cùng chạm đáy. Quãng đường đi được trong từng giây liên tiếp tăng dần theo tỉ lệ 1 : 3 : 5 — đó chính là dấu hiệu của chuyển động nhanh dần đều với gia tốc g. Bên phải là ống còn không khí: viên bi vẫn rơi như cũ, nhưng chiếc lông chim tụt lại rất xa vì lực cản không khí lớn so với trọng lượng bé của nó. Kết luận: cái làm hai vật rơi khác nhau là lực cản không khí, không phải khối lượng.',
      viewBoxWidth: 420,
      viewBoxHeight: 260,
      durationMs: 3000,
      loop: true,
      shapes: [
        {
          kind: 'rect',
          id: 'ong-chan-khong',
          x: 20,
          y: 30,
          w: 160,
          h: 200,
          rx: 8,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'rect',
          id: 'ong-khong-khi',
          x: 240,
          y: 30,
          w: 160,
          h: 200,
          rx: 8,
          stroke: 'neutral',
          strokeWidth: 2,
          dash: '6 4',
        },
        {
          kind: 'circle',
          id: 'bi-chan-khong',
          cx: 60,
          cy: 50,
          r: 9,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 750, dy: 10 },
            { atMs: 1500, dy: 40 },
            { atMs: 2250, dy: 90 },
            { atMs: 3000, dy: 160 },
          ],
        },
        {
          kind: 'circle',
          id: 'long-chan-khong',
          cx: 140,
          cy: 50,
          r: 9,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 750, dy: 10 },
            { atMs: 1500, dy: 40 },
            { atMs: 2250, dy: 90 },
            { atMs: 3000, dy: 160 },
          ],
        },
        {
          kind: 'circle',
          id: 'bi-khong-khi',
          cx: 280,
          cy: 50,
          r: 9,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 750, dy: 10 },
            { atMs: 1500, dy: 40 },
            { atMs: 2250, dy: 90 },
            { atMs: 3000, dy: 160 },
          ],
        },
        {
          kind: 'circle',
          id: 'long-khong-khi',
          cx: 360,
          cy: 50,
          r: 9,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 750, dy: 12 },
            { atMs: 1500, dy: 30 },
            { atMs: 2250, dy: 52 },
            { atMs: 3000, dy: 76 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-chan-khong',
          x: 100,
          y: 22,
          text: 'Ống chân không',
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-khong-khi',
          x: 320,
          y: 22,
          text: 'Ống có không khí',
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-bi',
          x: 60,
          y: 248,
          text: 'bi sắt',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-long',
          x: 140,
          y: 248,
          text: 'lông chim',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Thả đồng thời bi sắt và lông chim ở cả hai ống.' },
        {
          atMs: 1500,
          text: 'Trong chân không hai vật luôn ngang nhau; bên ống có không khí lông chim đã tụt lại.',
        },
        {
          atMs: 3000,
          text: 'Chân không: chạm đáy cùng lúc. Khác biệt sinh ra từ lực cản, không phải khối lượng.',
        },
      ],
    },
    grade: '10',
    chapterNumber: 2,
    chapterTitle: 'Động học',
    lessonNumber: 10,
    title: 'Sự rơi tự do',
    hook:
      'Nếu thả rơi một chiếc lá và một quả cân trong không khí, quả cân sẽ chạm đất trước. Nhưng nếu hút hết không khí ra để tạo chân không, ' +
      'cả hai sẽ rơi nhanh như nhau và chạm đất cùng lúc. Chuyển động kì diệu đó gọi là sự rơi tự do.',
    theory:
      'ĐỊNH NGHĨA SỰ RƠI TỰ DO:\n' +
      '— Sự rơi tự do là sự rơi của các vật chỉ dưới tác dụng của trọng lực (bỏ qua sức cản của không khí).\n\n' +
      'ĐẶC ĐIỂM CỦA CHUYỂN ĐỘNG RƠI TỰ DO:\n' +
      '— Phương: Thẳng đứng. Chiều: Từ trên xuống dưới.\n' +
      '— Tính chất: Chuyển động thẳng nhanh dần đều không vận tốc đầu (v_o = 0).\n\n' +
      'GIA TỐC RƠI TỰ DO (g):\n' +
      '— Tại một nơi xác định trên Trái Đất và ở gần mặt đất, mọi vật đều rơi tự do với cùng một gia tốc g.\n' +
      '— VÌ SAO vật nặng và vật nhẹ lại rơi như nhau? Trọng lực tác dụng lên vật nặng đúng là lớn hơn (P = m.g), ' +
      'nhưng chính vật nặng cũng "ì" hơn: theo định luật 2 Newton a = F/m = m.g/m = g, khối lượng m bị triệt tiêu. ' +
      'Lực kéo lớn hơn bao nhiêu lần thì quán tính cũng lớn hơn đúng bấy nhiêu lần, nên gia tốc không đổi.\n' +
      '— ĐIỀU KIỆN ÁP DỤNG: chỉ đúng khi bỏ qua được lực cản không khí. Với chiếc lá, tờ giấy, quả bóng bay — ' +
      'lực cản so được với trọng lượng nên chúng KHÔNG rơi tự do và công thức dưới đây không dùng được.\n' +
      '— GIỚI HẠN: g còn thay đổi theo vĩ độ và độ cao (ở địa cực lớn hơn ở xích đạo, lên cao thì giảm), ' +
      'nên g là hằng số của MỘT NƠI chứ không phải hằng số của vũ trụ. Thường lấy g ≈ 9,8 m/s² hoặc g ≈ 10 m/s².\n\n' +
      'CÁC CÔNG THỨC RƠI TỰ DO (Chọn chiều dương hướng xuống, gốc tại điểm thả):\n' +
      '1. Vận tốc tại thời điểm t: v = g.t.\n' +
      '2. Quãng đường (độ cao rơi) sau thời gian t: h = 0,5.g.t².\n' +
      '3. Vận tốc liên hệ với quãng đường: v² = 2.g.h hay v = √(2.g.h).',
    workedExample: {
      problem:
        'Một vật được thả rơi tự do từ độ cao h = 45 m xuống đất. Lấy g = 10 m/s². Tính thời gian rơi ' +
        'và vận tốc của vật khi chạm đất.',
      steps: [
        'Xác định độ cao rơi h = 45 m, gia tốc g = 10 m/s².',
        'Áp dụng công thức h = 0,5.g.t² => 45 = 0,5 * 10 * t² => 45 = 5 * t².',
        't² = 9 => t = 3 (s).',
        'Tính vận tốc chạm đất: v = g.t = 10 * 3 = 30 (m/s) hoặc dùng v = √(2.g.h) = √(2 * 10 * 45) = √900 = 30 (m/s).',
      ],
      answer: 'Thời gian rơi: 3s; Vận tốc chạm đất: 30 m/s.',
    },
    checkQuestions: [
      {
        prompt: 'Thế nào là sự rơi tự do?',
        choices: [
          { id: 'dinh_nghia', label: 'Sự rơi của các vật chỉ chịu tác dụng của trọng lực' },
          { id: 'suc_can', label: 'Sự rơi của các vật trong bầu khí quyển chịu sức cản lớn' },
          { id: 'tuy_y', label: 'Mọi chuyển động hướng từ trên xuống dưới' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['dinh_nghia'],
        },
        explain:
          'Sự rơi tự do bỏ qua hoàn toàn sức cản không khí, vật chỉ chịu lực hút Trái Đất (trọng lực).',
      },
      {
        prompt:
          'Thả một vật rơi tự do không vận tốc đầu từ độ cao h. Sau 2s vật chạm đất. Lấy g = 10 m/s². Tính vận tốc chạm đất của vật.',
        answer: {
          kind: 'numeric',
          value: 20,
          unit: 'm/s',
        },
        explain:
          'Vận tốc chạm đất v = g.t = 10 * 2 = 20 m/s. Công thức này chỉ đúng khi vật rơi tự do không vận tốc đầu (v₀ = 0); nếu ném có vận tốc ban đầu phải cộng thêm v₀.',
      },
      {
        // Câu bẫy: hiểu lầm phổ biến nhất của chương này — "nặng thì rơi nhanh hơn".
        prompt:
          'Thả đồng thời từ cùng một độ cao trong ống đã hút hết không khí: viên bi sắt 2 kg và viên bi thuỷ tinh 20 g. Vật nào chạm đáy trước?',
        choices: [
          { id: 'sat', label: 'Bi sắt, vì nó nặng gấp 100 lần nên trọng lực kéo nó mạnh hơn' },
          { id: 'cung_luc', label: 'Cả hai chạm đáy cùng lúc' },
          { id: 'thuy_tinh', label: 'Bi thuỷ tinh, vì nhẹ hơn nên dễ chuyển động hơn' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['cung_luc'],
        },
        explain:
          'Trọng lực lên bi sắt đúng là lớn gấp 100 lần thật — nhưng khối lượng (tức mức quán tính) của nó cũng lớn gấp 100 lần. ' +
          'Gia tốc a = P/m = m.g/m = g, khối lượng bị triệt tiêu, nên cả hai cùng có gia tốc g và chạm đáy cùng lúc. ' +
          'Sở dĩ trong đời thường ta thấy hòn đá rơi nhanh hơn tờ giấy là do LỰC CẢN KHÔNG KHÍ, không phải do khối lượng: ' +
          'vò tờ giấy thành viên nhỏ rồi thả lại, nó sẽ rơi gần như cùng lúc với hòn đá.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phương và chiều của chuyển động rơi tự do là gì?',
        dap: 'Phương thẳng đứng, chiều từ trên xuống dưới.',
      },
      {
        hoi: 'Viết công thức liên hệ giữa vận tốc v và độ cao h của vật rơi tự do?',
        dap: 'v = √(2.g.h).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c2-b11',
    // Bố trí đo g bằng hai cổng quang: vật rơi qua cổng A rồi cổng B, đồng hồ đo thời gian, g suy ra từ s = ½gt².
    animation: {
      title: 'Đo gia tốc rơi tự do bằng cổng quang',
      description:
        'Bố trí thí nghiệm dựng đứng: nam châm điện giữ viên bi ở trên đỉnh, cổng quang A đặt SÁT ngay dưới viên bi, cổng quang B ở phía dưới. Ngắt nam châm, bi rời ra và cắt tia ở cổng A gần như tức thì, nên đồng hồ bắt đầu chạy đúng lúc bi bắt đầu rơi từ trạng thái nghỉ. Bi rơi tự do — các khoảng dịch chuyển trong những phần thời gian bằng nhau dài dần ra, dấu hiệu của chuyển động nhanh dần đều — rồi cắt tia ở cổng B làm đồng hồ dừng. Đo được khoảng cách hai cổng s = 0,55 m và thời gian t = 0,335 s, thay vào s = ½gt² được g = 2s : t² = 2 × 0,55 : 0,335² ≈ 9,8 m/s². Cổng A phải sát chỗ thả: đặt thấp thì bi qua A đã có vận tốc và s = ½gt² không còn đúng.',
      viewBoxWidth: 280,
      viewBoxHeight: 310,
      durationMs: 3000,
      loop: true,
      shapes: [
        { kind: 'rect', id: 'nam-cham', x: 110, y: 12, w: 60, h: 16, rx: 3, fill: 'neutral' },
        {
          kind: 'line',
          id: 'gia-do',
          x1: 40,
          y1: 20,
          x2: 40,
          y2: 290,
          stroke: 'muted',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'canh-tren',
          x1: 40,
          y1: 20,
          x2: 110,
          y2: 20,
          stroke: 'muted',
          strokeWidth: 3,
        },
        { kind: 'rect', id: 'cong-a-trai', x: 96, y: 40, w: 22, h: 16, rx: 2, fill: 'accent' },
        { kind: 'rect', id: 'cong-a-phai', x: 162, y: 40, w: 22, h: 16, rx: 2, fill: 'accent' },
        {
          kind: 'line',
          id: 'tia-a',
          x1: 118,
          y1: 48,
          x2: 162,
          y2: 48,
          stroke: 'warn',
          strokeWidth: 2,
          dash: '4 3',
        },
        { kind: 'rect', id: 'cong-b-trai', x: 96, y: 252, w: 22, h: 16, rx: 2, fill: 'accent' },
        { kind: 'rect', id: 'cong-b-phai', x: 162, y: 252, w: 22, h: 16, rx: 2, fill: 'accent' },
        {
          kind: 'line',
          id: 'tia-b',
          x1: 118,
          y1: 260,
          x2: 162,
          y2: 260,
          stroke: 'warn',
          strokeWidth: 2,
          dash: '4 3',
        },
        {
          kind: 'circle',
          id: 'vien-bi',
          cx: 140,
          cy: 37,
          r: 9,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 500, dy: 13.8 },
            { atMs: 1000, dy: 55 },
            { atMs: 1500, dy: 123.8 },
            { atMs: 2000, dy: 220 },
            { atMs: 3000, dy: 220 },
          ],
        },
        {
          kind: 'line',
          id: 'thuoc-s',
          x1: 76,
          y1: 48,
          x2: 76,
          y2: 260,
          stroke: 'muted',
          strokeWidth: 1.5,
          dash: '4 3',
        },
        {
          kind: 'line',
          id: 'vach-s-tren',
          x1: 70,
          y1: 48,
          x2: 82,
          y2: 48,
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'line',
          id: 'vach-s-duoi',
          x1: 70,
          y1: 260,
          x2: 82,
          y2: 260,
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'line',
          id: 'mat-san',
          x1: 40,
          y1: 290,
          x2: 250,
          y2: 290,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'label',
          id: 'nhan-nc',
          x: 190,
          y: 26,
          text: 'Nam châm điện',
          size: 11,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-a',
          x: 192,
          y: 52,
          text: 'Cổng quang A',
          size: 11,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-b',
          x: 192,
          y: 264,
          text: 'Cổng quang B',
          size: 11,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-s',
          x: 192,
          y: 140,
          text: 's = 0,55 m',
          size: 12,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-t',
          x: 192,
          y: 160,
          text: 't = 0,335 s',
          size: 12,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-g',
          x: 192,
          y: 188,
          text: 'g = 2s/t²',
          size: 12,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-g-so',
          x: 192,
          y: 206,
          text: '≈ 9,8 m/s²',
          size: 12,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-khoang-s',
          x: 70,
          y: 160,
          text: 's',
          size: 13,
          anchor: 'end',
          fill: 'primary',
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Ngắt nam châm: bi rời ra, cắt ngay tia ở cổng A đặt sát bên dưới — đồng hồ bắt đầu chạy.',
        },
        {
          atMs: 1000,
          text: 'Bi rơi nhanh dần: cùng một khoảng thời gian, quãng đi được dài dần ra.',
        },
        { atMs: 2000, text: 'Bi cắt tia ở cổng B — đồng hồ dừng, đọc t rồi tính g = 2s/t².' },
      ],
    },
    grade: '10',
    chapterNumber: 2,
    chapterTitle: 'Động học',
    lessonNumber: 11,
    title: 'Thực hành: Đo gia tốc rơi tự do',
    hook:
      'Giá trị g = 9,8 m/s² được ghi trong sách giáo khoa từ đâu mà có? Hãy tự mình thực hành và tính toán ' +
      'chính giá trị này ngay tại phòng thí nghiệm của trường.',
    theory:
      'NGUYÊN TẮC ĐO GIA TỐC RƠI TỰ DO:\n' +
      '— Một quả cầu kim loại được giữ trên cao bằng nam châm điện.\n' +
      '— Khi ngắt điện, nam châm nhả quả cầu rơi tự do, đồng hồ hiện số bắt đầu đo thời gian.\n' +
      '— Quả cầu đi qua cổng quang điện đặt ở khoảng cách h phía dưới, đồng hồ dừng đếm thời gian t.\n' +
      '— Từ công thức h = 0,5.g.t² ta suy ra gia tốc rơi tự do thực nghiệm: g = 2.h / t².\n\n' +
      'HẠN CHẾ SAI SỐ TRONG THÍ NGHIỆM:\n' +
      '— Dùng quả cầu sắt nhỏ, khối lượng riêng lớn để giảm thiểu tác dụng sức cản không khí.\n' +
      '— Đo thời gian t nhiều lần tại mỗi độ cao h để lấy giá trị trung bình, giảm sai số ngẫu nhiên.\n' +
      '— Vẽ đồ thị h theo t² để tìm g từ hệ số góc của đồ thị.',
    workedExample: {
      problem:
        'Trong thí nghiệm đo gia tốc rơi tự do, học sinh đo khoảng cách rơi h = 0,80 m. ' +
        'Thời gian rơi đo được trên đồng hồ hiện số là t = 0,40s. Tính gia tốc g thực nghiệm.',
      steps: [
        'Xác định độ cao rơi h = 0,80 m.',
        'Xác định thời gian rơi t = 0,40 s.',
        'Áp dụng công thức thực nghiệm g = 2.h / t² = (2 * 0,80) / 0,40².',
        'g = 1,60 / 0,16 = 10,0 (m/s²).',
      ],
      answer: 'g = 10 m/s²',
    },
    checkQuestions: [
      {
        prompt:
          'Để đo gia tốc rơi tự do g trực tiếp trong phòng thực hành, ta cần thu thập số liệu của hai đại lượng trực tiếp nào?',
        choices: [
          { id: 'khoang_thoi', label: 'Quãng đường rơi h và thời gian rơi t' },
          { id: 'khoi_luong', label: 'Khối lượng quả cầu m và thời gian t' },
          { id: 'chu_vi', label: 'Chu vi quả cầu và chiều dài máng đỡ' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['khoang_thoi'],
        },
        explain:
          'Sử dụng công thức g = 2h/t² nên bắt buộc phải đo trực tiếp quãng đường rơi h và thời gian rơi t.',
      },
      {
        prompt:
          'Tại sao trong thí nghiệm đo gia tốc rơi tự do g người ta dùng một quả cầu thép nhỏ mà không dùng một quả cầu nhựa có cùng kích thước?',
        choices: [
          { id: 'thep_nhua', label: 'Để giảm thiểu ảnh hưởng của sức cản không khí lên quả cầu' },
          { id: 'giat_dien', label: 'Quả cầu nhựa dễ bị giật điện hơn' },
          { id: 'mau_sac', label: 'Quả cầu thép có màu sắc sáng hơn giúp mắt nhìn rõ hơn' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['thep_nhua'],
        },
        explain:
          'Quả cầu thép có khối lượng riêng lớn hơn nhựa nhiều lần, do đó trọng lực lớn hơn sức cản không khí rất nhiều, giúp chuyển động sát với rơi tự do hơn.',
      },
    ],
    srsCards: [
      {
        hoi: 'Viết công thức tính gia tốc rơi tự do g từ phép đo thực hành h và t?',
        dap: 'g = 2.h / t².',
      },
      {
        hoi: 'Bộ phận nào nhả quả cầu kim loại đồng bộ với việc bật đồng hồ đo thời gian?',
        dap: 'Nam châm điện.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c2-b12',
    // Hoạt ảnh cho thấy hai chuyển động thành phần độc lập nhau: bi ném ngang và bi thả rơi
    // luôn ở CÙNG một độ cao tại mọi thời điểm, nên chạm đất cùng lúc.
    animation: {
      title: 'Ném ngang = rơi tự do cộng với chuyển động thẳng đều',
      description:
        'Hai viên bi rời mép bàn cùng một lúc: viên A được thả rơi thẳng đứng, viên B được ném ngang. Viên B vạch ra một nhánh parabol, còn viên A đi thẳng xuống. Điều đáng chú ý: ở mọi thời điểm hai viên luôn ở cùng một độ cao (các đoạn nét đứt nằm ngang nối chúng luôn song song với mặt đất), và chúng chạm đất cùng lúc. Theo phương ngang viên B đi được những đoạn bằng nhau trong những khoảng thời gian bằng nhau (thẳng đều, vì không có lực nào theo phương ngang); theo phương thẳng đứng nó rơi y hệt viên A (nhanh dần đều với gia tốc g). Tầm xa chỉ phụ thuộc tốc độ ném và độ cao, không ảnh hưởng tới thời gian rơi.',
      viewBoxWidth: 420,
      viewBoxHeight: 260,
      durationMs: 3000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'mat-dat',
          x1: 10,
          y1: 220,
          x2: 410,
          y2: 220,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        { kind: 'rect', id: 'ban', x: 10, y: 40, w: 34, h: 10, stroke: 'muted', strokeWidth: 2 },
        {
          kind: 'polyline',
          id: 'quy-dao',
          points: [
            [44, 40],
            [84, 43],
            [124, 51],
            [164, 65],
            [204, 85],
            [244, 110],
            [284, 141],
            [324, 178],
            [364, 220],
          ],
          stroke: 'muted',
          strokeWidth: 2,
          dash: '5 4',
        },
        {
          kind: 'circle',
          id: 'bi-tha-roi',
          cx: 44,
          cy: 40,
          r: 8,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 750, dy: 11 },
            { atMs: 1500, dy: 45 },
            { atMs: 2250, dy: 101 },
            { atMs: 3000, dy: 180 },
          ],
        },
        {
          kind: 'circle',
          id: 'bi-nem-ngang',
          cx: 44,
          cy: 40,
          r: 8,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 750, dx: 80, dy: 11 },
            { atMs: 1500, dx: 160, dy: 45 },
            { atMs: 2250, dx: 240, dy: 101 },
            { atMs: 3000, dx: 320, dy: 180 },
          ],
        },
        {
          kind: 'arrow',
          id: 'vec-v-ngang',
          x1: 44,
          y1: 40,
          x2: 104,
          y2: 40,
          stroke: 'primary',
          strokeWidth: 2,
        },
        {
          kind: 'arrow',
          id: 'vec-g',
          x1: 380,
          y1: 60,
          x2: 380,
          y2: 110,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'nhan-g',
          x: 388,
          y: 92,
          text: 'g',
          size: 14,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-vo',
          x: 108,
          y: 36,
          text: 'v₀ (không đổi)',
          size: 12,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-a',
          x: 30,
          y: 32,
          text: 'A: thả rơi',
          size: 12,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-tam-xa',
          x: 200,
          y: 240,
          text: 'tầm xa L = v₀·√(2h/g)',
          size: 13,
          anchor: 'middle',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Hai viên bi rời mép bàn cùng lúc: A thả rơi, B ném ngang.' },
        {
          atMs: 1500,
          text: 'Ở giữa đường, hai viên vẫn ở cùng độ cao — phương thẳng đứng của chúng giống hệt nhau.',
        },
        {
          atMs: 3000,
          text: 'Chạm đất cùng lúc. Vận tốc ném chỉ quyết định vật bay XA bao nhiêu, không quyết định rơi LÂU bao nhiêu.',
        },
      ],
    },
    grade: '10',
    chapterNumber: 2,
    chapterTitle: 'Động học',
    lessonNumber: 12,
    title: 'Chuyển động ném',
    hook:
      'Khi một cầu thủ sút bóng bổng hoặc một máy bay thả hàng cứu trợ, quỹ đạo bay của vật đều là một đường cong tuyệt đẹp. ' +
      'Làm thế nào để tính toán điểm rơi chính xác của vật ném?',
    theory:
      'CHUYỂN ĐỘNG NÉM NGANG (Chọn hệ trục Ox nằm ngang theo hướng ném, Oy thẳng đứng hướng xuống, gốc tại điểm ném):\n' +
      '— Phương trình chuyển động:\n' +
      '  — Theo trục Ox: Vật không chịu lực cản → Chuyển động thẳng đều: a_x = 0, v_x = v_o, x = v_o.t.\n' +
      '  — Theo trục Oy: Vật chỉ chịu trọng lực → Chuyển động rơi tự do: a_y = g, v_y = g.t, y = 0,5.g.t².\n' +
      '— Phương trình quỹ đạo (y theo x): y = (g / (2.v_o²)) * x² (quỹ đạo là một nhánh parabol).\n' +
      '— Thời gian bay (cho đến khi chạm đất từ độ cao h): t = √(2.h / g).\n' +
      '— Tầm xa (khoảng cách nằm ngang xa nhất): L = x_max = v_o * t = v_o * √(2.h / g).\n\n' +
      'CHUYỂN ĐỘNG NÉM XIÊN (Ném góc α so với phương ngang):\n' +
      '— Vận tốc ban đầu phân tích thành: v_ox = v_o.cos α, v_oy = v_o.sin α.\n' +
      '— Tầm xa đạt cực đại khi góc ném α = 45° (nếu bỏ qua sức cản không khí).',
    workedExample: {
      problem:
        'Một vật được ném ngang với vận tốc ban đầu v_o = 15 m/s từ độ cao h = 20 m xuống đất. ' +
        'Lấy g = 10 m/s². Tính thời gian rơi và tầm xa của vật.',
      steps: [
        'Xác định các thông số: v_o = 15 m/s, h = 20 m, g = 10 m/s².',
        'Tính thời gian chuyển động cho đến khi chạm đất: t = √(2.h / g) = √(2 * 20 / 10) = √4 = 2 (s).',
        'Tính tầm xa L của chuyển động ném ngang: L = v_o * t = 15 * 2 = 30 (m).',
      ],
      answer: 'Thời gian rơi: 2s; Tầm xa: 30 m.',
    },
    checkQuestions: [
      {
        prompt:
          'Trong chuyển động ném ngang, gia tốc của vật theo phương nằm ngang (trục Ox) bằng bao nhiêu (bỏ qua sức cản không khí)?',
        choices: [
          { id: 'zero', label: '0 m/s²' },
          { id: 'g', label: 'g (≈ 9,8 m/s²)' },
          { id: 'bien_thien', label: 'Biến thiên liên tục theo thời gian' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['zero'],
        },
        explain:
          'Theo phương ngang vật không chịu lực nào tác dụng (bỏ qua cản khí) nên gia tốc phương ngang bằng 0.',
      },
      {
        prompt:
          'Một máy bay bay ngang ở độ cao 80 m với tốc độ 50 m/s thì thả một thùng hàng cứu trợ xuống đất. Tính tầm xa của thùng hàng (lấy g = 10 m/s²).',
        answer: {
          kind: 'numeric',
          value: 200,
          unit: 'm',
        },
        explain:
          'Thời gian rơi t = √(2h/g) = √(160/10) = 4 s. Tầm xa L = v_o * t = 50 * 4 = 200 m.',
      },
      {
        // Câu bẫy: học sinh hay tưởng ném càng mạnh thì vật "bay lâu hơn" nên rơi chậm hơn.
        prompt:
          'Từ mép một chiếc bàn cao 1,25 m, viên bi A được thả rơi thẳng đứng còn viên bi B được ném ngang với tốc độ 4 m/s, cùng một lúc. Viên nào chạm sàn trước?',
        choices: [
          { id: 'a_truoc', label: 'Viên A, vì nó đi thẳng xuống theo đường ngắn nhất' },
          { id: 'b_truoc', label: 'Viên B, vì nó có thêm vận tốc ban đầu' },
          { id: 'cung_luc', label: 'Cả hai chạm sàn cùng lúc' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['cung_luc'],
        },
        explain:
          'Hai chuyển động thành phần ĐỘC LẬP với nhau. Vận tốc ném v₀ nằm ngang nên nó không đóng góp gì vào phương thẳng đứng: ' +
          'theo phương Oy cả hai vật đều rơi tự do không vận tốc đầu, t = √(2h/g) = √(2·1,25/10) = 0,5 s như nhau. ' +
          'Quãng đường viên B đi được đúng là dài hơn (đường parabol dài hơn đoạn thẳng), nhưng nó cũng đi nhanh hơn đúng phần chênh lệch đó theo phương ngang. ' +
          'Tốc độ ném chỉ quyết định vật rơi XA bao nhiêu (L = v₀·t = 2 m), không quyết định rơi LÂU bao nhiêu.',
      },
    ],
    srsCards: [
      {
        hoi: 'Quỹ đạo của chuyển động ném ngang có dạng hình học gì?',
        dap: 'Một đường parabol (nhánh parabol).',
      },
      {
        hoi: 'Viết công thức tính tầm xa L của vật ném ngang từ độ cao h?',
        dap: 'L = v_o * √(2.h / g).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
