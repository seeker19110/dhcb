// lessons/ly10c6.ts — Vật lí 10, Chương 6: Chuyển động tròn đều (2 bài).
import type { PhysicsLesson } from '../lessonTypes.js'

export const LY10_C6_LESSONS: PhysicsLesson[] = [
  {
    id: 'ly10-c6-b31',
    // Chạy đều trên đường tròn: độ lớn vận tốc không đổi nhưng HƯỚNG đổi liên tục — bốn mũi tên tiếp tuyến chỉ ra điều đó.
    animation: {
      title: 'Tốc độ không đổi nhưng vận tốc luôn đổi hướng',
      description:
        'Một vật chạy đều trên đường tròn bán kính 0,5 m, mỗi vòng hết 2 giây. Chấm sáng đi hết vòng tròn với nhịp đều tăm tắp: những cung tròn quét được trong các khoảng thời gian bằng nhau đều dài như nhau, nghĩa là TỐC ĐỘ không đổi. Nhưng lần lượt bốn mũi tên vận tốc sáng lên ở bốn vị trí: ở bên phải mũi tên chỉ lên, ở trên đỉnh chỉ sang trái, ở bên trái chỉ xuống, ở dưới đáy chỉ sang phải. Mũi tên luôn nằm theo phương tiếp tuyến và đổi hướng liên tục, nên VẬN TỐC — vốn là đại lượng vectơ — luôn thay đổi. Vận tốc thay đổi thì phải có gia tốc, đó chính là gia tốc hướng tâm luôn chỉ vào tâm. Chu kì T = 2 s cho tốc độ góc ω = 2π/T ≈ 3,14 rad/s và tốc độ dài v = ωr ≈ 1,57 m/s.',
      viewBoxWidth: 340,
      viewBoxHeight: 250,
      durationMs: 4000,
      loop: true,
      shapes: [
        {
          kind: 'circle',
          id: 'quy-dao',
          cx: 150,
          cy: 120,
          r: 80,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '6 5',
        },
        { kind: 'circle', id: 'tam', cx: 150, cy: 120, r: 4, fill: 'neutral' },
        {
          kind: 'line',
          id: 'ban-kinh',
          x1: 150,
          y1: 120,
          x2: 230,
          y2: 120,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'circle',
          id: 'vat',
          cx: 230,
          cy: 120,
          r: 10,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 500, dx: -23.4, dy: -56.6 },
            { atMs: 1000, dx: -80, dy: -80 },
            { atMs: 1500, dx: -136.6, dy: -56.6 },
            { atMs: 2000, dx: -160, dy: 0 },
            { atMs: 2500, dx: -136.6, dy: 56.6 },
            { atMs: 3000, dx: -80, dy: 80 },
            { atMs: 3500, dx: -23.4, dy: 56.6 },
            { atMs: 4000, dx: 0, dy: 0 },
          ],
        },
        {
          kind: 'arrow',
          id: 'v-phai',
          x1: 230,
          y1: 120,
          x2: 230,
          y2: 66,
          stroke: 'correct',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 300, opacity: 1 },
            { atMs: 500, opacity: 0 },
            { atMs: 3800, opacity: 0 },
            { atMs: 4000, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'v-tren',
          x1: 150,
          y1: 40,
          x2: 96,
          y2: 40,
          stroke: 'correct',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 900, opacity: 0 },
            { atMs: 1000, opacity: 1 },
            { atMs: 1300, opacity: 1 },
            { atMs: 1500, opacity: 0 },
            { atMs: 4000, opacity: 0 },
          ],
        },
        {
          kind: 'arrow',
          id: 'v-trai',
          x1: 70,
          y1: 120,
          x2: 70,
          y2: 174,
          stroke: 'correct',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1900, opacity: 0 },
            { atMs: 2000, opacity: 1 },
            { atMs: 2300, opacity: 1 },
            { atMs: 2500, opacity: 0 },
            { atMs: 4000, opacity: 0 },
          ],
        },
        {
          kind: 'arrow',
          id: 'v-duoi',
          x1: 150,
          y1: 200,
          x2: 204,
          y2: 200,
          stroke: 'correct',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2900, opacity: 0 },
            { atMs: 3000, opacity: 1 },
            { atMs: 3300, opacity: 1 },
            { atMs: 3500, opacity: 0 },
            { atMs: 4000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-r',
          x: 190,
          y: 114,
          text: 'r = 0,5 m',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-t',
          x: 10,
          y: 26,
          text: 'T = 2 s · ω = 2π/T ≈ 3,14 rad/s · v = ωr ≈ 1,57 m/s',
          size: 13,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-kl',
          x: 10,
          y: 226,
          text: 'Mũi tên vận tốc luôn tiếp tuyến và luôn đổi hướng',
          size: 12,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-kl-2',
          x: 10,
          y: 243,
          text: '→ vận tốc thay đổi nên có gia tốc',
          size: 12,
          anchor: 'start',
          fill: 'accent',
        },
      ],
      captions: [
        { atMs: 0, text: 'Ở bên phải quỹ đạo, vận tốc hướng thẳng lên.' },
        { atMs: 1000, text: 'Lên tới đỉnh, vận tốc đã quay sang trái.' },
        { atMs: 3000, text: 'Xuống đáy, vận tốc hướng sang phải: tốc độ như cũ, hướng thì khác.' },
      ],
    },
    grade: '10',
    chapterNumber: 6,
    chapterTitle: 'Chuyển động tròn đều',
    lessonNumber: 31,
    title: 'Động học của chuyển động tròn đều',
    hook:
      'Cánh quạt tua bin điện gió quay đều đặn, hay Mặt Trăng quay quanh Trái Đất, đều vạch nên những đường tròn. ' +
      'Làm thế nào để tính toán quãng đường và tốc độ quay của chúng?',
    theory:
      'ĐỊNH NGHĨA CHUYỂN ĐỘNG TRÒN ĐỀU:\n' +
      '— Chuyển động tròn là chuyển động có quỹ đạo là một đường tròn.\n' +
      '— Chuyển động tròn đều là chuyển động tròn có tốc độ dài không đổi (đi được những cung tròn có độ dài bằng nhau trong những khoảng thời gian bằng nhau).\n\n' +
      'CÁC ĐẠI LƯỢNG ĐẶC TRƯNG:\n' +
      '1. Độ dịch chuyển góc (Δθ): Góc quét bởi bán kính nối từ tâm đến vật trong thời gian Δt. Đơn vị: Radian (rad). Hệ thức: π rad = 180°.\n' +
      '2. Tốc độ góc (ω): Đại lượng đo bằng độ dịch chuyển góc chia cho thời gian dịch chuyển góc tương ứng.\n' +
      '   — Công thức: ω = Δθ / Δt. Đơn vị: Radian trên giây (rad/s).\n' +
      '3. Chu kì (T): Khoảng thời gian vật đi hết một vòng tròn quỹ đạo. Đơn vị: Giây (s). Công thức: T = 2π / ω.\n' +
      '4. Tần số (f): Số vòng vật đi được trong một giây. Đơn vị: Hertz (Hz) hoặc 1/s. Công thức: f = 1 / T = ω / 2π.\n' +
      '5. Tốc độ dài (v): Tốc độ đi dọc theo cung tròn của quỹ đạo. Công thức: v = s / t = ω.r (với r là bán kính đường tròn).\n' +
      '  — Chú ý: Vectơ vận tốc dài luôn có phương tiếp tuyến với đường tròn quỹ đạo, hướng thay đổi liên tục dù độ lớn v không đổi.',
    workedExample: {
      problem:
        'Một cánh quạt trần quay đều với tốc độ góc ω = 20 rad/s. Bán kính từ tâm đến đầu cánh quạt là r = 0,5 m. ' +
        'Tính tốc độ dài của đầu cánh quạt, chu kì và tần số quay của quạt.',
      steps: [
        'Xác định tốc độ góc ω = 20 rad/s, bán kính r = 0,5 m.',
        'Tính tốc độ dài của đầu cánh quạt: v = ω.r = 20 * 0,5 = 10 (m/s).',
        'Tính chu kì quay T: T = 2π / ω = 2 * 3,1416 / 20 ≈ 0,314 (s).',
        'Tính tần số quay f: f = 1 / T = 20 / (2π) ≈ 3,18 (Hz) (tức quạt quay hơn 3 vòng trong 1 giây).',
      ],
      answer: 'v = 10 m/s; T ≈ 0,314 s; f ≈ 3,18 Hz.',
    },
    checkQuestions: [
      {
        prompt:
          'Viết công thức liên hệ giữa tốc độ dài (v), tốc độ góc (ω) và bán kính quỹ đạo (r) trong chuyển động tròn đều.',
        choices: [
          { id: 'ct_1', label: 'v = ω * r' },
          { id: 'ct_2', label: 'v = ω / r' },
          { id: 'ct_3', label: 'ω = v * r' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['ct_1'],
        },
        explain:
          'Tốc độ dài bằng tốc độ góc nhân bán kính: v = ωr. Bán kính càng lớn thì cùng một góc quét ứng với cung ' +
          'càng dài, nên v phải TỈ LỆ THUẬN với r — hai phương án kia đều làm sai quan hệ đó.',
      },
      {
        prompt:
          'Một bánh xe quay đều với tốc độ góc 20 rad/s. Một điểm nằm cách trục quay 0,5 m có tốc độ dài bằng bao nhiêu?',
        answer: {
          kind: 'numeric',
          value: 10,
          unit: 'm/s',
        },
        explain:
          'Tốc độ dài v = ω * r = 20 * 0,5 = 10 m/s. Cùng tốc độ góc ω nhưng điểm càng xa trục quay (r lớn) thì tốc độ dài càng lớn — mọi điểm trên bánh xe có ω như nhau, v khác nhau.',
      },
    ],
    srsCards: [
      {
        hoi: 'Đơn vị đo chuẩn của tốc độ góc trong hệ SI là gì?',
        dap: 'Radian trên giây (rad/s).',
      },
      {
        hoi: 'Tại sao vectơ vận tốc trong chuyển động tròn đều không phải là vectơ không đổi?',
        dap: 'Vì tuy độ lớn của vận tốc không đổi, hướng của vectơ vận tốc luôn thay đổi (luôn có phương tiếp tuyến quỹ đạo).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c6-b32',
    // Cảnh trả lời đúng một câu hỏi: đứt dây thì vật bay theo hướng nào? Theo TIẾP TUYẾN,
    // không phải văng ra xa theo phương bán kính — đó là chỗ "lực ly tâm" hay đánh lừa học sinh.
    animation: {
      title: 'Quay tròn rồi buông dây: vật bay theo tiếp tuyến',
      description:
        'Một hòn đá buộc vào đầu dây được quay tròn đều quanh tâm O trên mặt bàn nhẵn. Sợi dây luôn kéo hòn đá HƯỚNG VÀO TÂM — đó là lực hướng tâm, và nó chỉ làm đổi hướng vận tốc chứ không làm đá chạy nhanh lên. Vận tốc của đá luôn vuông góc với dây, tức là theo phương tiếp tuyến với đường tròn. Đường nét đứt thẳng vẽ sẵn cho thấy hướng tiếp tuyến tại điểm đang xét. Khi dây đứt, lực hướng tâm biến mất, không còn lực nào theo phương ngang nữa, nên theo định luật 1 Newton hòn đá đi THẲNG theo đúng phương tiếp tuyến đó — chứ không bay ra xa theo phương nối dài bán kính như nhiều người tưởng.',
      viewBoxWidth: 420,
      viewBoxHeight: 280,
      durationMs: 4000,
      loop: true,
      shapes: [
        {
          kind: 'circle',
          id: 'quy-dao',
          cx: 170,
          cy: 150,
          r: 70,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '5 5',
        },
        { kind: 'circle', id: 'tam-o', cx: 170, cy: 150, r: 4, fill: 'neutral' },
        {
          kind: 'label',
          id: 'nhan-o',
          x: 160,
          y: 172,
          text: 'O',
          size: 13,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'line',
          id: 'day',
          x1: 170,
          y1: 150,
          x2: 230,
          y2: 150,
          stroke: 'neutral',
          strokeWidth: 2,
          origin: [170, 150],
          keyframes: [
            { atMs: 0, rotate: 0, opacity: 1 },
            { atMs: 2800, rotate: -360, opacity: 1 },
            { atMs: 2850, rotate: -360, opacity: 0 },
            { atMs: 4000, rotate: -360, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'hon-da',
          cx: 240,
          cy: 150,
          r: 10,
          fill: 'primary',
          origin: [170, 150],
          keyframes: [
            { atMs: 0, rotate: 0 },
            { atMs: 2800, rotate: -360 },
            { atMs: 3350, rotate: -360, dy: -86 },
            { atMs: 4000, rotate: -360, dy: -86 },
          ],
        },
        {
          kind: 'arrow',
          id: 'luc-huong-tam',
          x1: 226,
          y1: 150,
          x2: 186,
          y2: 150,
          stroke: 'accent',
          strokeWidth: 3,
          origin: [170, 150],
          keyframes: [
            { atMs: 0, rotate: 0, opacity: 1 },
            { atMs: 2800, rotate: -360, opacity: 1 },
            { atMs: 2850, rotate: -360, opacity: 0 },
            { atMs: 4000, rotate: -360, opacity: 0 },
          ],
        },
        {
          kind: 'arrow',
          id: 'van-toc',
          x1: 240,
          y1: 138,
          x2: 240,
          y2: 108,
          stroke: 'primary',
          strokeWidth: 3,
          origin: [170, 150],
          keyframes: [
            { atMs: 0, rotate: 0 },
            { atMs: 2800, rotate: -360 },
            { atMs: 3350, rotate: -360, dy: -86 },
            { atMs: 4000, rotate: -360, dy: -86 },
          ],
        },
        {
          kind: 'line',
          id: 'tiep-tuyen',
          x1: 240,
          y1: 232,
          x2: 240,
          y2: 40,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '3 5',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2600, opacity: 0 },
            { atMs: 2800, opacity: 1 },
            { atMs: 4000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'huong-sai',
          x1: 250,
          y1: 150,
          x2: 400,
          y2: 150,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '2 6',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2600, opacity: 0 },
            { atMs: 2800, opacity: 0.5 },
            { atMs: 4000, opacity: 0.5 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-fht',
          x: 14,
          y: 256,
          text: 'Mũi tên vào tâm: lực hướng tâm do dây kéo',
          size: 12,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-v',
          x: 14,
          y: 273,
          text: 'Mũi tên tiếp tuyến: vận tốc v',
          size: 12,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-sai',
          x: 330,
          y: 168,
          text: 'KHÔNG bay theo hướng này',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2600, opacity: 0 },
            { atMs: 2800, opacity: 1 },
            { atMs: 4000, opacity: 1 },
          ],
        },
      ],
      captions: [
        { atMs: 0, text: 'Dây luôn kéo hòn đá vào tâm O; vận tốc luôn vuông góc với dây.' },
        {
          atMs: 1400,
          text: 'Tốc độ không đổi, chỉ có hướng vận tốc thay đổi — đó là gia tốc hướng tâm.',
        },
        { atMs: 2800, text: 'Dây đứt: lực hướng tâm biến mất.' },
        { atMs: 3350, text: 'Hòn đá đi thẳng theo tiếp tuyến, không văng ra dọc theo bán kính.' },
      ],
    },
    grade: '10',
    chapterNumber: 6,
    chapterTitle: 'Chuyển động tròn đều',
    lessonNumber: 32,
    title: 'Lực hướng tâm và gia tốc hướng tâm',
    hook:
      'Khi ô tô đi qua khúc cua tròn, bánh xe bám chặt mặt đường nhờ lực ma sát hướng vào tâm cua. ' +
      'Nếu đường trơn trượt mất đi lực này, xe sẽ văng ra ngoài theo quán tính. Lực hướng vào tâm này là gì?',
    theory:
      'GIA TỐC HƯỚNG TÂM (CENTRIPETAL ACCELERATION):\n' +
      '— Trong chuyển động tròn đều, tuy tốc độ dài không đổi nhưng hướng vận tốc thay đổi liên tục, sinh ra gia tốc hướng tâm (vectơ a_ht).\n' +
      '— Hướng: Vectơ gia tốc hướng tâm luôn hướng vào tâm của đường tròn quỹ đạo.\n' +
      '— Độ lớn: a_ht = v² / r = ω².r.\n\n' +
      'LỰC HƯỚNG TÂM (CENTRIPETAL FORCE):\n' +
      '— Lực (hoặc hợp lực) tác dụng lên vật chuyển động tròn đều gây ra gia tốc hướng tâm gọi là lực hướng tâm.\n' +
      '— Hướng: Luôn hướng vào tâm quỹ đạo tròn.\n' +
      '— Độ lớn: F_ht = m.a_ht = m.v² / r = m.ω².r.\n' +
      '— Bản chất: Lực hướng tâm không phải lực mới trong tự nhiên, nó chỉ là một trong các lực cơ học đã biết (ma sát nghỉ, lực hấp dẫn, lực căng dây...) đóng vai trò hướng vào tâm để giữ vật chuyển động tròn.',
    workedExample: {
      problem:
        'Một ô tô khối lượng m = 1000 kg đi vào khúc cua tròn bán kính r = 50 m với tốc độ không đổi v = 10 m/s. ' +
        'Tính gia tốc hướng tâm và lực hướng tâm do lực ma sát giữa bánh xe và mặt đường cung cấp.',
      steps: [
        'Xác định khối lượng m = 1000 kg, bán kính r = 50 m, tốc độ v = 10 m/s.',
        'Tính gia tốc hướng tâm: a_ht = v² / r = 10² / 50 = 100 / 50 = 2 (m/s²).',
        'Tính lực hướng tâm tác dụng lên xe: F_ht = m.a_ht = 1000 * 2 = 2000 (N).',
        'Kết luận: Lực ma sát nghỉ giữa bánh xe và mặt đường đóng vai trò lực hướng tâm có độ lớn tối thiểu 2000 N để xe không bị trượt văng.',
      ],
      answer: 'a_ht = 2 m/s²; F_ht = 2000 N.',
    },
    checkQuestions: [
      {
        prompt:
          'Viết công thức tính độ lớn gia tốc hướng tâm a_ht của vật chuyển động tròn đều theo tốc độ dài v và bán kính r.',
        choices: [
          { id: 'ct_1', label: 'a_ht = v² / r' },
          { id: 'ct_2', label: 'a_ht = v / r' },
          { id: 'ct_3', label: 'a_ht = v * r' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['ct_1'],
        },
        explain:
          'Gia tốc hướng tâm tỉ lệ thuận với bình phương tốc độ dài và tỉ lệ nghịch bán kính quỹ đạo.',
      },
      {
        prompt:
          'Một sợi dây treo vật nặng 2 kg quay tròn đều trong mặt phẳng nằm ngang với bán kính quỹ đạo r = 0,5 m. Tốc độ dài của vật là v = 5 m/s. Tính lực căng dây đóng vai trò lực hướng tâm.',
        answer: {
          kind: 'numeric',
          value: 100,
          unit: 'N',
        },
        explain:
          'F_ht = m * v² / r = 2 * 5² / 0,5 = 2 * 25 / 0,5 = 100 N. Lực hướng tâm không phải một loại lực mới mà là hợp lực (ở đây là lực căng dây) hướng vào tâm quỹ đạo, gây ra chuyển động tròn.',
      },
      {
        // Câu bẫy: "lực ly tâm" kéo vật văng ra — và hướng bay sau khi đứt dây.
        prompt:
          'Quay tròn đều một hòn đá buộc ở đầu dây trên mặt bàn nhẵn nằm ngang. Đúng lúc dây đứt, hòn đá sẽ chuyển động thế nào?',
        choices: [
          { id: 'ban_kinh', label: 'Bay ra xa tâm theo phương bán kính, vì lực ly tâm đẩy nó ra' },
          {
            id: 'tiep_tuyen',
            label: 'Đi thẳng đều theo phương tiếp tuyến với quỹ đạo tại điểm dây đứt',
          },
          { id: 'cong_tiep', label: 'Tiếp tục đi theo đường cong một lúc nữa rồi mới đi thẳng' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['tiep_tuyen'],
        },
        explain:
          'Trước khi đứt, lực duy nhất theo phương ngang là lực căng dây HƯỚNG VÀO TÂM; không hề có lực nào đẩy hòn đá ra xa. ' +
          'Cái mà ta quen gọi "lực ly tâm" chỉ là cảm giác của người ngồi trong hệ quay (hệ quy chiếu phi quán tính), không phải lực do vật nào tác dụng. ' +
          'Khi dây đứt, hợp lực theo phương ngang bằng 0, nên theo định luật 1 Newton hòn đá giữ nguyên vectơ vận tốc mà nó đang có — mà vận tốc trong chuyển động tròn luôn nằm theo phương TIẾP TUYẾN. ' +
          'Vì thế nó đi thẳng đều theo tiếp tuyến; càng đi thì càng xa tâm, và chính điều này khiến ta lầm tưởng có lực đẩy ra. Đây cũng là lí do bùn văng khỏi bánh xe theo phương tiếp tuyến.',
      },
    ],
    srsCards: [
      {
        hoi: 'Vectơ gia tốc hướng tâm trong chuyển động tròn đều có hướng như thế nào?',
        dap: 'Luôn hướng vào tâm của quỹ đạo tròn.',
      },
      {
        hoi: 'Lực hướng tâm có phải một lực độc lập mới xuất hiện không?',
        dap: 'Không, nó chỉ là tên gọi vai trò của các lực có sẵn (như ma sát, hấp dẫn, căng dây) khi hướng vào tâm quỹ đạo tròn.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
