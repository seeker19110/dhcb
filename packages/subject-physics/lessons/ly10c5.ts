// lessons/ly10c5.ts — Vật lí 10, Chương 5: Động lượng (3 bài).
import type { PhysicsLesson } from '../lessonTypes.js'

export const LY10_C5_LESSONS: PhysicsLesson[] = [
  {
    id: 'ly10-c5-b28',
    // Cùng vận tốc nhưng khác khối lượng: mũi tên động lượng dài ngắn khác hẳn nhau.
    animation: {
      title: 'Cùng vận tốc, động lượng vẫn rất khác nhau',
      description:
        'Hai xe chạy song song với CÙNG một vận tốc 10 m/s — trong suốt cảnh chúng luôn ngang hàng nhau, không xe nào vượt lên. Xe tải nặng 1000 kg, xe con chỉ 250 kg. Ngay trên mỗi xe là mũi tên động lượng: mũi tên của xe tải dài gấp bốn lần mũi tên của xe con, vì p = m·v cho ra 1000 × 10 = 10 000 kg·m/s so với 250 × 10 = 2500 kg·m/s. Hai xe chuyển động y hệt nhau nhưng "đà" của chúng chênh nhau bốn lần, nên muốn hãm xe tải lại trong cùng một khoảng thời gian thì phải dùng lực lớn gấp bốn. Động lượng là đại lượng VECTƠ cùng hướng với vận tốc, và độ lớn của nó phụ thuộc cả khối lượng lẫn vận tốc chứ không riêng vận tốc.',
      viewBoxWidth: 380,
      viewBoxHeight: 220,
      durationMs: 4000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'lan-tren',
          x1: 10,
          y1: 104,
          x2: 370,
          y2: 104,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'lan-duoi',
          x1: 10,
          y1: 194,
          x2: 370,
          y2: 194,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'rect',
          id: 'xe-tai',
          x: 20,
          y: 72,
          w: 56,
          h: 32,
          rx: 3,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 4000, dx: 200 },
          ],
        },
        {
          kind: 'arrow',
          id: 'p-tai',
          x1: 20,
          y1: 60,
          x2: 180,
          y2: 60,
          stroke: 'accent',
          strokeWidth: 4,
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 4000, dx: 200 },
          ],
        },
        {
          kind: 'rect',
          id: 'xe-con',
          x: 20,
          y: 170,
          w: 40,
          h: 24,
          rx: 3,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 4000, dx: 200 },
          ],
        },
        {
          kind: 'arrow',
          id: 'p-con',
          x1: 20,
          y1: 156,
          x2: 60,
          y2: 156,
          stroke: 'accent',
          strokeWidth: 4,
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 4000, dx: 200 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-tai',
          x: 10,
          y: 130,
          text: 'Xe tải 1000 kg · v = 10 m/s · p = 10 000 kg·m/s',
          size: 12,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-con',
          x: 10,
          y: 216,
          text: 'Xe con 250 kg · v = 10 m/s · p = 2500 kg·m/s',
          size: 12,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-ct',
          x: 10,
          y: 30,
          text: 'p = m·v — vectơ cùng hướng vận tốc',
          size: 14,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-kl',
          x: 10,
          y: 48,
          text: 'Cùng vận tốc mà động lượng chênh 4 lần vì khối lượng chênh 4 lần',
          size: 11,
          anchor: 'start',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Hai xe cùng vận tốc 10 m/s, luôn ngang hàng nhau.' },
        { atMs: 2000, text: 'Mũi tên động lượng của xe tải dài gấp bốn lần.' },
        { atMs: 4000, text: 'Muốn hãm xe tải trong cùng thời gian phải dùng lực gấp bốn.' },
      ],
    },
    grade: '10',
    chapterNumber: 5,
    chapterTitle: 'Động lượng',
    lessonNumber: 28,
    title: 'Động lượng',
    hook:
      'Một chiếc tàu thuỷ siêu trọng di chuyển rất chậm vẫn có thể tông sập cầu cảng, và một viên đạn súng nhỏ xíu bay tốc độ cao ' +
      'mang sức phá huỷ cực lớn. Cả hai đều mang một đại lượng cơ học đặc trưng gọi là Động lượng.',
    theory:
      'ĐỊNH NGHĨA ĐỘNG LƯỢNG (MOMENTUM):\n' +
      '— Động lượng của một vật có khối lượng m đang chuyển động với vận tốc vectơ v là đại lượng đo bằng tích của khối lượng và vectơ vận tốc của vật.\n' +
      '— Công thức vectơ: vectơ p = m.vectơ v.\n' +
      '— Đặc điểm: Động lượng là đại lượng vectơ có cùng hướng với vận tốc. Đơn vị trong hệ SI: kilôgam mét trên giây (kg.m/s) hoặc Newton giây (N.s).\n\n' +
      'XUNG LƯỢNG CỦA LỰC (IMPULSE OF FORCE):\n' +
      '— Khi một lực vectơ F tác dụng lên vật trong khoảng thời gian ngắn Δt, tích vectơ F.Δt gọi là xung lượng của lực trong khoảng thời gian đó. Đơn vị: N.s.\n' +
      '— Dạng khác của Định luật 2 Newton: vectơ F = Δvectơ p / Δt.\n' +
      '— Ý nghĩa: Độ biến thiên động lượng của vật bằng xung lượng của lực tác dụng lên vật: Δvectơ p = vectơ F.Δt.',
    workedExample: {
      problem:
        'Một quả bóng đá có khối lượng m = 400g bay thẳng vào tường theo phương ngang với vận tốc v₁ = 10 m/s ' +
        'rồi nảy ngược trở lại với tốc độ v₂ = 10 m/s. Tính độ lớn độ biến thiên động lượng của quả bóng.',
      steps: [
        'Đổi khối lượng quả bóng sang kg: m = 400g = 0,4 kg.',
        'Chọn chiều dương là chiều chuyển động ban đầu của quả bóng hướng vào tường. Vận tốc đầu v₁ = 10 m/s.',
        'Vì bóng nảy ngược lại nên vận tốc sau trái dấu: v₂ = -10 m/s.',
        'Tính động lượng ban đầu: p₁ = m.v₁ = 0,4 * 10 = 4 (kg.m/s).',
        'Tính động lượng lúc sau: p₂ = m.v₂ = 0,4 * (-10) = -4 (kg.m/s).',
        'Tính độ biến thiên động lượng: Δp = p₂ - p₁ = -4 - 4 = -8 (kg.m/s).',
        'Độ lớn độ biến thiên động lượng là |Δp| = 8 kg.m/s.',
      ],
      answer: '|Δp| = 8 kg.m/s',
    },
    checkQuestions: [
      {
        prompt:
          'Viết công thức tính vectơ động lượng p của một vật dựa vào khối lượng m và vectơ vận tốc v.',
        choices: [
          { id: 'ct_1', label: 'vectơ p = m * vectơ v' },
          { id: 'ct_2', label: 'vectơ p = m / vectơ v' },
          { id: 'ct_3', label: 'vectơ p = 0,5 * m * vectơ v²' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['ct_1'],
        },
        explain:
          'Động lượng bằng khối lượng (một số dương) nhân vectơ vận tốc: p = mv, nên p luôn cùng hướng với v. ' +
          'Không thể chia cho một vectơ, cũng không có bình phương vectơ ở đây — công thức 0,5.m.v² là ĐỘNG NĂNG, ' +
          'một đại lượng vô hướng khác hẳn.',
      },
      {
        prompt:
          'Một lực kéo 50 N tác dụng lên một chiếc xe đẩy trong khoảng thời gian 0,2s. Tính độ biến thiên động lượng của chiếc xe đẩy (bỏ qua các lực khác).',
        answer: {
          kind: 'numeric',
          value: 10,
          unit: 'kg*m/s',
        },
        explain:
          'Δp = F * Δt = 50 * 0,2 = 10 kg.m/s (cũng viết là 10 N.s). Đây là dạng khác của định luật 2 Newton: ' +
          'xung lượng của lực F.Δt bằng đúng độ biến thiên động lượng của vật.',
      },
    ],
    srsCards: [
      {
        hoi: 'Động lượng của vật thay đổi như thế nào nếu khối lượng tăng gấp đôi và vận tốc giảm đi một nửa?',
        dap: 'Động lượng không đổi (vì p tỉ lệ với tích m.v).',
      },
      {
        hoi: 'Xung lượng của lực đo bằng đơn vị gì và bằng đại lượng biến thiên nào của vật?',
        dap: 'Đo bằng N.s, bằng độ biến thiên động lượng của vật.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c5-b29',
    // Va chạm mềm trên đệm khí: tổng động lượng trước = sau, còn động năng thì KHÔNG.
    animation: {
      title: 'Va chạm mềm: động lượng được bảo toàn, động năng thì không',
      description:
        'Trên đệm khí gần như không ma sát, xe A khối lượng 1 kg chạy sang phải với tốc độ 4 m/s, xe B khối lượng 3 kg đứng yên. Hai xe có gắn miếng dính nên sau va chạm chúng móc vào nhau thành một khối 4 kg. Mũi tên động lượng của A (dài 4 đơn vị) là tất cả động lượng của hệ trước va chạm. Sau va chạm, khối chung vẫn mang đúng mũi tên dài 4 đơn vị đó, nhưng vì khối lượng đã gấp 4 lần nên tốc độ chỉ còn 1 m/s: chúng bò đi chậm hẳn. Kiểm tra bằng số: p = 1×4 = 4 kg·m/s trước và 4×1 = 4 kg·m/s sau — bảo toàn. Trong khi đó động năng giảm từ ½·1·4² = 8 J xuống ½·4·1² = 2 J; 6 J còn lại biến thành nhiệt và tiếng động khi hai xe dính vào nhau. Đây là lí do va chạm mềm không được dùng bảo toàn động năng.',
      viewBoxWidth: 420,
      viewBoxHeight: 200,
      durationMs: 4000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'dem-khi',
          x1: 10,
          y1: 140,
          x2: 410,
          y2: 140,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'rect',
          id: 'xe-a',
          x: 40,
          y: 110,
          w: 30,
          h: 30,
          rx: 4,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2000, dx: 120 },
            { atMs: 4000, dx: 150 },
          ],
        },
        {
          kind: 'rect',
          id: 'xe-b',
          x: 190,
          y: 100,
          w: 40,
          h: 40,
          rx: 4,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2000, dx: 0 },
            { atMs: 4000, dx: 30 },
          ],
        },
        {
          kind: 'arrow',
          id: 'dong-luong-truoc',
          x1: 40,
          y1: 80,
          x2: 120,
          y2: 80,
          stroke: 'primary',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, dx: 0, opacity: 1 },
            { atMs: 2000, dx: 120, opacity: 1 },
            { atMs: 2100, dx: 120, opacity: 0 },
          ],
        },
        {
          kind: 'arrow',
          id: 'dong-luong-sau',
          x1: 190,
          y1: 80,
          x2: 270,
          y2: 80,
          stroke: 'correct',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 2000, opacity: 0, dx: 0 },
            { atMs: 2100, opacity: 1 },
            { atMs: 4000, dx: 30 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-xe-a',
          x: 55,
          y: 160,
          text: 'A: 1 kg, 4 m/s',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-xe-b',
          x: 210,
          y: 170,
          text: 'B: 3 kg, đứng yên',
          size: 12,
          anchor: 'middle',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-p',
          x: 210,
          y: 60,
          text: 'p = 4 kg·m/s (không đổi)',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-wd',
          x: 210,
          y: 192,
          text: 'động năng: 8 J → 2 J',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Trước va chạm: chỉ A có động lượng, p = 1 × 4 = 4 kg·m/s.' },
        { atMs: 2000, text: 'Hai xe dính vào nhau thành khối 4 kg.' },
        {
          atMs: 4000,
          text: 'Sau va chạm: v = p/m = 4/4 = 1 m/s. Động lượng giữ nguyên, động năng mất 6 J thành nhiệt.',
        },
      ],
    },
    grade: '10',
    chapterNumber: 5,
    chapterTitle: 'Động lượng',
    lessonNumber: 29,
    title: 'Định luật bảo toàn động lượng',
    hook:
      'Khi một khẩu đại bác khổng lồ bắn một quả đạn nặng đi thẳng về phía trước, cả khẩu đại bác sẽ bị giật mạnh lùi lại phía sau. ' +
      'Định luật bảo toàn động lượng chính là chìa khóa giải thích hiện tượng giật lùi và nguyên lí bay của tên lửa.',
    theory:
      'HỆ KÍN (HỆ CÔ LẬP):\n' +
      '— Hệ gồm nhiều vật tương tác với nhau mà không chịu tác dụng của ngoại lực, hoặc các ngoại lực cân bằng nhau (hợp ngoại lực bằng 0).\n\n' +
      'ĐỊNH LUẬT BẢO TOÀN ĐỘNG LƯỢNG:\n' +
      '— Phát biểu: Tổng động lượng của một hệ kín là một đại lượng bảo toàn (không đổi theo thời gian).\n' +
      "— Biểu thức cho hệ 2 vật: vectơ p₁ + vectơ p₂ = vectơ p₁'" +
      " + vectơ p₂' hay m₁.vectơ v₁ + m₂.vectơ v₂ = m₁.vectơ v₁' + m₂.vectơ v₂'.\n\n" +
      'ỨNG DỤNG CỦA ĐỊNH LUẬT:\n' +
      "1. Va chạm mềm: Hai vật va chạm rồi dính vào nhau chuyển động cùng vận tốc v'.\n" +
      "   — Công thức: v' = (m₁.v₁ + m₂.v₂) / (m₁ + m₂) (dạng đại số trên trục thẳng).\n" +
      '2. Chuyển động bằng phản lực: Một phần của hệ tách ra và phóng đi về một hướng, làm phần còn lại chuyển động về hướng ngược lại (ví dụ: súng giật khi bắn, tên lửa phụt luồng khí nóng về phía sau).',
    workedExample: {
      problem:
        'Một khẩu súng trường có khối lượng M = 4 kg bắn một viên đạn có khối lượng m = 20g với vận tốc v = 600 m/s thoát ra khỏi nòng súng. ' +
        'Tính vận tốc giật lùi của khẩu súng (coi hệ súng và đạn là hệ kín trước và sau khi bắn).',
      steps: [
        'Đổi khối lượng viên đạn sang kg: m = 20g = 0,02 kg.',
        'Trước khi bắn, cả súng và đạn đều đứng yên: Tổng động lượng hệ ban đầu p_đầu = 0.',
        'Sau khi bắn, viên đạn bay đi với vận tốc v, súng giật lùi với vận tốc V. Tổng động lượng hệ: p_sau = m.v + M.V.',
        'Vì hệ súng đạn là hệ kín lúc phát hoả, áp dụng ĐLBT động lượng: p_đầu = p_sau => 0 = m.v + M.V.',
        'M.V = -m.v => V = -(m.v) / M.',
        'Thay số: V = -(0,02 * 600) / 4 = -12 / 4 = -3 (m/s).',
        'Dấu trừ chứng tỏ súng giật lùi ngược hướng bay của viên đạn với tốc độ 3 m/s.',
      ],
      answer: 'V = -3 m/s',
    },
    checkQuestions: [
      {
        prompt: 'Định luật bảo toàn động lượng chỉ áp dụng đúng cho hệ vật có tính chất nào?',
        choices: [
          { id: 'he_kin', label: 'Hệ kín (hệ cô lập)' },
          { id: 'he_mo', label: 'Hệ mở chịu nhiều ma sát lớn từ môi trường' },
          { id: 'he_quay', label: 'Hệ vật đang chuyển động quay liên tục' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['he_kin'],
        },
        explain:
          'Bảo toàn động lượng đòi hỏi hợp ngoại lực bằng không, tức là hệ phải cô lập (hệ kín).',
      },
      {
        prompt:
          'Một xe lăn A khối lượng 1 kg chuyển động với tốc độ 2 m/s va chạm và dính vào một xe lăn B khối lượng 1 kg đang đứng yên. Tính tốc độ của hai xe sau va chạm.',
        answer: {
          kind: 'numeric',
          value: 1,
          unit: 'm/s',
        },
        explain: "Va chạm mềm: v' = (m_A * v_A) / (m_A + m_B) = (1 * 2) / (1 + 1) = 1 m/s.",
      },
      {
        // Câu bẫy: động lượng là VECTƠ — hai vật đi ngược chiều thì phải trừ, không phải cộng.
        prompt:
          'Xe A nặng 2 kg chạy sang phải với tốc độ 3 m/s, xe B nặng 1 kg chạy sang trái với tốc độ 2 m/s trên cùng một đường thẳng. Chọn chiều dương là chiều sang phải. Tổng động lượng của hệ hai xe bằng bao nhiêu (theo kg·m/s)?',
        answer: {
          kind: 'numeric',
          value: 4,
          unit: 'kg.m/s',
        },
        explain:
          'Động lượng là đại lượng VECTƠ, nên trước khi cộng phải gắn dấu theo chiều dương đã chọn. Xe A đi theo chiều dương: p_A = +2 × 3 = +6 kg·m/s. Xe B đi ngược chiều dương: p_B = 1 × (−2) = −2 kg·m/s. ' +
          'Tổng p = 6 + (−2) = +4 kg·m/s, dấu dương cho biết động lượng của hệ hướng sang phải. ' +
          'Sai lầm phổ biến là cộng thẳng hai độ lớn thành 6 + 2 = 8 kg·m/s vì "cộng cho nhanh". ' +
          'Quy tắc an toàn: luôn viết rõ "chọn chiều dương là…" ở dòng đầu bài giải, rồi mọi vận tốc ngược chiều đó đều mang dấu trừ — làm vậy thì bài va chạm ngược chiều không bao giờ sai dấu nữa.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phát biểu định luật bảo toàn động lượng?',
        dap: 'Tổng động lượng của một hệ kín là một đại lượng bảo toàn.',
      },
      {
        hoi: 'Nguyên tắc chuyển động bằng phản lực là gì?',
        dap: 'Một phần vật chất phóng ra theo một hướng, phần còn lại sẽ chuyển động ngược hướng do bảo toàn động lượng.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c5-b30',
    // Hai xe đệm khí va chạm mềm: đo v trước và sau bằng cổng quang, tổng động lượng giữ nguyên 0,2 kg·m/s.
    animation: {
      title: 'Đo động lượng trước và sau va chạm mềm',
      description:
        'Bố trí thí nghiệm trên đệm khí để triệt tiêu ma sát. Xe A nặng 0,5 kg chạy sang phải với vận tốc 0,4 m/s đo được nhờ cổng quang thứ nhất; xe B cũng 0,5 kg đứng yên chờ ở giữa máng. Hai xe va vào nhau, dính lại bằng miếng nhám rồi cùng chạy tiếp — nhìn rõ là chúng đi chậm hẳn so với lúc trước va chạm, và cổng quang thứ hai đo được vận tốc chung chỉ còn 0,2 m/s. Kiểm tra bằng số: động lượng trước va chạm là 0,5 × 0,4 + 0,5 × 0 = 0,2 kg·m/s; sau va chạm là (0,5 + 0,5) × 0,2 = 0,2 kg·m/s. Hai giá trị bằng nhau nên động lượng của hệ được bảo toàn. Trong khi đó động năng giảm từ 0,04 J xuống 0,02 J vì một phần đã biến thành nhiệt và tiếng động lúc va chạm.',
      viewBoxWidth: 380,
      viewBoxHeight: 200,
      durationMs: 5000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'dem-khi',
          x1: 10,
          y1: 140,
          x2: 370,
          y2: 140,
          stroke: 'neutral',
          strokeWidth: 4,
        },
        {
          kind: 'line',
          id: 'cong-1',
          x1: 110,
          y1: 86,
          x2: 110,
          y2: 140,
          stroke: 'warn',
          strokeWidth: 2,
          dash: '4 3',
        },
        {
          kind: 'line',
          id: 'cong-2',
          x1: 320,
          y1: 86,
          x2: 320,
          y2: 140,
          stroke: 'warn',
          strokeWidth: 2,
          dash: '4 3',
        },
        {
          kind: 'rect',
          id: 'xe-a',
          x: 30,
          y: 110,
          w: 44,
          h: 30,
          rx: 3,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2000, dx: 130 },
            { atMs: 5000, dx: 227.5 },
          ],
        },
        {
          kind: 'rect',
          id: 'xe-b',
          x: 204,
          y: 110,
          w: 44,
          h: 30,
          rx: 3,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2000, dx: 0 },
            { atMs: 5000, dx: 97.5 },
          ],
        },
        {
          kind: 'arrow',
          id: 'v-truoc',
          x1: 30,
          y1: 96,
          x2: 90,
          y2: 96,
          stroke: 'correct',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, dx: 0, opacity: 1 },
            { atMs: 2000, dx: 130, opacity: 1 },
            { atMs: 2100, dx: 130, opacity: 0 },
            { atMs: 5000, dx: 130, opacity: 0 },
          ],
        },
        {
          kind: 'arrow',
          id: 'v-sau',
          x1: 204,
          y1: 96,
          x2: 234,
          y2: 96,
          stroke: 'correct',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, opacity: 0 },
            { atMs: 2000, dx: 0, opacity: 0 },
            { atMs: 2200, dx: 6.5, opacity: 1 },
            { atMs: 5000, dx: 97.5, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-a',
          x: 52,
          y: 130,
          text: 'A',
          size: 13,
          anchor: 'middle',
          fill: 'surface',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2000, dx: 130 },
            { atMs: 5000, dx: 227.5 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-b',
          x: 226,
          y: 130,
          text: 'B',
          size: 13,
          anchor: 'middle',
          fill: 'surface',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2000, dx: 0 },
            { atMs: 5000, dx: 97.5 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-cong1',
          x: 108,
          y: 80,
          text: 'cổng 1',
          size: 11,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-cong2',
          x: 322,
          y: 80,
          text: 'cổng 2',
          size: 11,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-truoc',
          x: 10,
          y: 30,
          text: 'Trước: 0,5 × 0,4 + 0,5 × 0 = 0,2 kg·m/s',
          size: 13,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-sau',
          x: 10,
          y: 50,
          text: 'Sau: (0,5 + 0,5) × 0,2 = 0,2 kg·m/s',
          size: 13,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-kl',
          x: 10,
          y: 186,
          text: 'Động lượng bảo toàn; động năng giảm 0,04 J → 0,02 J',
          size: 11,
          anchor: 'start',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Xe A 0,5 kg chạy 0,4 m/s, xe B 0,5 kg đứng yên.' },
        { atMs: 2000, text: 'Va chạm mềm: hai xe dính vào nhau.' },
        { atMs: 3500, text: 'Cùng chạy với 0,2 m/s — tổng động lượng vẫn là 0,2 kg·m/s.' },
      ],
    },
    grade: '10',
    chapterNumber: 5,
    chapterTitle: 'Động lượng',
    lessonNumber: 30,
    title: 'Thực hành: Xác định động lượng của vật trước và sau va chạm',
    hook:
      'Làm thế nào để đo đạc và kiểm chứng định luật bảo toàn động lượng trong phòng thí nghiệm khi thời gian va chạm xảy ra chỉ trong tích tắc? ' +
      'Sử dụng băng đệm khí và cổng quang điện chính là lời giải.',
    theory:
      'NGUYÊN TẮC THỰC HÀNH VA CHẠM ĐỆM KHÍ:\n' +
      '— Băng đệm khí thổi luồng hơi nâng các xe trượt lên, triệt tiêu ma sát trượt giúp hệ hai xe trượt gần như là hệ kín hoàn hảo.\n' +
      '— Sử dụng hai cổng quang điện kết nối đồng hồ hiện số.\n' +
      '  — Tốc độ xe trượt: v = d / t (d là độ rộng tấm bản nhựa chắn sáng gắn trên xe, t là thời gian chắn cổng quang).\n\n' +
      'PHÉP ĐO VA CHẠM MỀM (Hai xe dính nhau):\n' +
      '— Mắc miếng dính velcro lên mặt tiếp xúc hai xe để chúng dính nhau sau va chạm.\n' +
      "— Đo tốc độ xe 1 trước va chạm v₁ và tốc độ hai xe dính nhau v' sau va chạm.\n" +
      "— Kiểm tra: m₁.v₁ ≈ (m₁ + m₂).v'.\n\n" +
      'PHÉP ĐO VA CHẠM ĐÀN HỒI (Hai xe nảy nhau):\n' +
      '— Mắc lò xo hoặc đệm cao su lên mặt tiếp xúc.\n' +
      "— Đo tốc độ v₁, v₂ trước va chạm và v₁', v₂' sau va chạm.\n" +
      "— Kiểm tra: m₁.v₁ + m₂.v₂ ≈ m₁.v₁' + m₂.v₂'.",
    workedExample: {
      problem:
        'Trong thí nghiệm va chạm mềm, xe 1 khối lượng m₁ = 0,3 kg chuyển động qua cổng quang 1 đo được tốc độ v₁ = 2,0 m/s, ' +
        "đến va chạm dính vào xe 2 khối lượng m₂ = 0,2 kg đang đứng yên. Cả hai xe đi qua cổng quang 2 đo được tốc độ v' = 1,2 m/s. " +
        'So sánh tổng động lượng trước và sau va chạm.',
      steps: [
        'Tính tổng động lượng trước va chạm: p_trước = m₁.v₁ + m₂.v₂ = 0,3 * 2,0 + 0 = 0,6 (kg.m/s).',
        "Tính tổng động lượng sau va chạm: p_sau = (m₁ + m₂).v' = (0,3 + 0,2) * 1,2 = 0,5 * 1,2 = 0,6 (kg.m/s).",
        'So sánh: p_trước = p_sau = 0,6 kg.m/s. Kết quả thực nghiệm trùng khớp với lí thuyết bảo toàn động lượng.',
      ],
      answer: 'Tổng động lượng trước và sau va chạm đều bằng 0,6 kg.m/s.',
    },
    checkQuestions: [
      {
        prompt: 'Thiết bị nào giúp loại bỏ tối đa lực ma sát trượt trong bài thực hành va chạm?',
        choices: [
          { id: 'dem_khi', label: 'Băng đệm khí (Air track)' },
          { id: 'thuoc_day', label: 'Thước dây cuộn' },
          { id: 'dynamo', label: 'Lực kế lò xo' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['dem_khi'],
        },
        explain:
          'Băng đệm khí phun không khí nâng xe trượt lửng lơ trên đệm khí, giảm thiểu ma sát về gần bằng 0.',
      },
      {
        prompt:
          'Một xe trượt khối lượng 0,2 kg chuyển động với tốc độ 1,5 m/s va chạm mềm với xe trượt thứ hai khối lượng 0,1 kg đang đứng yên. Tính động lượng tổng cộng của hệ sau va chạm.',
        answer: {
          kind: 'numeric',
          value: 0.3,
          unit: 'kg*m/s',
        },
        explain:
          'Theo ĐLBT động lượng, tổng động lượng sau va chạm bằng tổng động lượng trước va chạm: p = m_1 * v_1 = 0,2 * 1,5 = 0,3 kg.m/s.',
      },
    ],
    srsCards: [
      {
        hoi: 'Làm thế nào để xác định vận tốc của xe trượt đi qua cổng quang điện trong phòng thực hành?',
        dap: 'Bằng tỉ số v = d / t (d là độ rộng bản chắn sáng, t là thời gian chắn chùm sáng cổng quang).',
      },
      {
        hoi: 'Tại sao cần dán miếng dính velcro vào hai đầu xe trượt?',
        dap: 'Để thực hiện phép đo thí nghiệm va chạm mềm (hai xe dính chặt vào nhau sau va chạm).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
