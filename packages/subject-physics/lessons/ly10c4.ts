// lessons/ly10c4.ts — Vật lí 10, Chương 4: Năng lượng, công, công suất (5 bài).
import type { PhysicsLesson } from '../lessonTypes.js'
import { donViHienThi } from '@dhcb/core-grading/units'

export const LY10_C4_LESSONS: PhysicsLesson[] = [
  {
    id: 'ly10-c4-b23',
    // Kéo hộp bằng lực nghiêng 60°: chỉ thành phần cùng phương chuyển động mới sinh công.
    animation: {
      title: 'Chỉ thành phần theo phương dịch chuyển mới sinh công',
      description:
        'Một người kéo thùng hàng bằng dây nghiêng 60° so với phương ngang, lực kéo 50 N, thùng đi được 4 m. Mũi tên lực kéo được tách thành hai mũi tên nét đứt: thành phần nằm ngang dài 50 × cos60° = 25 N và thành phần thẳng đứng 50 × sin60° ≈ 43 N. Khi thùng trượt sang phải, chỉ thành phần nằm ngang đi cùng hướng dịch chuyển nên sinh công: A = F·s·cosα = 50 × 4 × 0,5 = 100 J. Thành phần thẳng đứng vuông góc với đường đi, quãng đường theo phương của nó bằng 0 nên nó không sinh công một chút nào, dù độ lớn của nó còn lớn hơn thành phần ngang. Đó là lí do công thức công có thừa số cosα, và vì sao lực vuông góc với chuyển động luôn cho công bằng không.',
      viewBoxWidth: 380,
      viewBoxHeight: 200,
      durationMs: 4000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'san',
          x1: 20,
          y1: 150,
          x2: 370,
          y2: 150,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'rect',
          id: 'thung',
          x: 40,
          y: 118,
          w: 50,
          h: 32,
          rx: 3,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 1000, dx: 0 },
            { atMs: 4000, dx: 110 },
          ],
        },
        {
          kind: 'arrow',
          id: 'luc-keo',
          x1: 90,
          y1: 134,
          x2: 125,
          y2: 73.4,
          stroke: 'correct',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 1000, dx: 0 },
            { atMs: 4000, dx: 110 },
          ],
        },
        {
          kind: 'arrow',
          id: 'thanh-phan-ngang',
          x1: 90,
          y1: 134,
          x2: 125,
          y2: 134,
          stroke: 'accent',
          strokeWidth: 3,
          dash: '5 3',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 1000, dx: 0 },
            { atMs: 4000, dx: 110 },
          ],
        },
        {
          kind: 'arrow',
          id: 'thanh-phan-dung',
          x1: 90,
          y1: 134,
          x2: 90,
          y2: 73.4,
          stroke: 'muted',
          strokeWidth: 3,
          dash: '5 3',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 1000, dx: 0 },
            { atMs: 4000, dx: 110 },
          ],
        },
        {
          kind: 'line',
          id: 'moc-dau',
          x1: 90,
          y1: 150,
          x2: 90,
          y2: 168,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'moc-cuoi',
          x1: 200,
          y1: 150,
          x2: 200,
          y2: 168,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'nhan-s',
          x: 145,
          y: 182,
          text: 's = 4 m',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-f',
          x: 131,
          y: 80,
          text: 'F = 50 N',
          size: 12,
          anchor: 'start',
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 1000, dx: 0 },
            { atMs: 4000, dx: 110 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-fx',
          x: 131,
          y: 139,
          text: 'F·cosα',
          size: 12,
          anchor: 'start',
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 1000, dx: 0 },
            { atMs: 4000, dx: 110 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-fy-ngan',
          x: 84,
          y: 104,
          text: 'F·sinα',
          size: 12,
          anchor: 'end',
          fill: 'muted',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 1000, dx: 0 },
            { atMs: 4000, dx: 110 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-fx-giai',
          x: 20,
          y: 44,
          text: 'F·cosα = 25 N cùng hướng đi → sinh công (α = 60°)',
          size: 12,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-fy',
          x: 20,
          y: 62,
          text: 'F·sinα ≈ 43 N vuông góc đường đi → công = 0',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-a',
          x: 20,
          y: 24,
          text: 'A = F·s·cosα = 50 × 4 × 0,5 = 100 J',
          size: 14,
          anchor: 'start',
          fill: 'primary',
        },
      ],
      captions: [
        { atMs: 0, text: 'Lực kéo 50 N nghiêng 60° được tách thành hai thành phần vuông góc.' },
        { atMs: 1000, text: 'Thùng trượt 4 m sang phải.' },
        { atMs: 4000, text: 'Chỉ 25 N nằm ngang sinh công: A = 100 J.' },
      ],
    },
    grade: '10',
    chapterNumber: 4,
    chapterTitle: 'Năng lượng, công, công suất',
    lessonNumber: 23,
    title: 'Năng lượng. Công cơ học',
    hook:
      'Gắng sức đẩy một bức tường đá nặng suốt một tiếng đồng hồ khiến bạn mệt lử, nhưng dưới góc nhìn Vật lí, bạn lại chưa thực hiện một "công" nào. ' +
      'Tại sao định nghĩa về công trong Vật lí lại nghiêm ngặt đến vậy?',
    theory:
      'NĂNG LƯỢNG (ENERGY):\n' +
      '— Năng lượng là một đại lượng đặc trưng cho khả năng thực hiện công của hệ.\n' +
      '— Định luật bảo toàn năng lượng: Năng lượng không tự sinh ra cũng không tự mất đi, nó chỉ truyền từ vật này sang vật khác hoặc chuyển hoá từ dạng này sang dạng khác.\n\n' +
      'CÔNG CƠ HỌC (WORK):\n' +
      '— Công cơ học là số đo phần năng lượng được truyền từ vật này sang vật khác trong tương tác lực cơ học.\n' +
      '— Công thức tính công của lực F không đổi làm vật dịch chuyển quãng đường s thẳng (góc α giữa lực vectơ F và hướng chuyển động):\n' +
      '  — A = F.s.cos α.\n' +
      '  — Đơn vị đo trong hệ SI: Joule (J), với 1 J = 1 N.m.\n\n' +
      'PHÂN LOẠI CÔNG THEO GÓC α:\n' +
      '— Góc α nhọn (0 ≤ α < 90°): cos α > 0 => A > 0. Lực thực hiện công phát động (đẩy nhanh chuyển động).\n' +
      '— Góc α vuông (α = 90°): cos α = 0 => A = 0. Lực không thực hiện công (vd lực căng dây của con lắc, trọng lực khi vật đi ngang).\n' +
      '— Góc α tù (90° < α ≤ 180°): cos α < 0 => A < 0. Lực thực hiện công cản (cản trở chuyển động, vd lực ma sát).',
    workedExample: {
      problem:
        'Một người dùng dây kéo một chiếc hòm gỗ trượt trên sàn nhà nằm ngang bằng một lực F = 100 N theo phương hợp với sàn một góc α = 60°. ' +
        'Tính công của người đó thực hiện khi kéo hòm đi được một quãng đường s = 20 m.',
      steps: [
        'Xác định các thông số: Lực kéo F = 100 N, quãng đường s = 20 m, góc α = 60°.',
        'Áp dụng công thức tính công cơ học: A = F.s.cos α.',
        'Thay số: A = 100 * 20 * cos 60° = 2000 * 0,5 = 1000 (J).',
        'Vì A > 0 nên đây là công phát động giúp hòm gỗ di chuyển.',
      ],
      answer: 'A = 1000 J',
    },
    checkQuestions: [
      {
        prompt:
          'Viết công thức tính công cơ học A của một lực F không đổi tác dụng làm vật dịch chuyển quãng đường s, với góc hợp bởi lực và hướng dịch chuyển là α.',
        choices: [
          { id: 'ct_1', label: 'A = F * s * cos α' },
          { id: 'ct_2', label: 'A = F * s * sin α' },
          { id: 'ct_3', label: 'A = F * s' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['ct_1'],
        },
        explain:
          'Công bằng tích của độ lớn lực, quãng đường dịch chuyển và cos của góc giữa lực với hướng dịch chuyển. ' +
          'Phải là cos vì chỉ THÀNH PHẦN lực cùng phương chuyển động mới sinh công; dùng sin thì lực vuông góc ' +
          '(α = 90°) lại cho công cực đại, trái với thực tế. Công thức A = F * s chỉ là trường hợp riêng khi α = 0°.',
      },
      {
        prompt:
          'Một lực ma sát trượt có độ lớn 20 N tác dụng lên một hộp gỗ trượt thẳng trên sàn, hướng lực ma sát luôn ngược hướng chuyển động (α = 180°). Tính công của lực ma sát khi hộp gỗ dịch chuyển được 5 m.',
        answer: {
          kind: 'numeric',
          value: -100,
          unit: 'J',
        },
        explain:
          'Lực ma sát ngược hướng chuyển động nên α = 180°, cos 180° = -1. Vậy A = F_ms * s * cos(180°) = 20 * 5 * (-1) = -100 J. ' +
          'Dấu âm cho biết đây là công cản: lực ma sát lấy bớt năng lượng của vật chứ không cấp thêm.',
      },
    ],
    srsCards: [
      {
        hoi: 'Đơn vị Joule (J) của công cơ học tương đương với tích các đơn vị cơ bản nào?',
        dap: 'Newton nhân mét (N.m).',
      },
      {
        hoi: 'Khi hướng của lực tác dụng vuông góc với hướng chuyển động, công của lực đó bằng bao nhiêu?',
        dap: 'Bằng 0 (lực không sinh công).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c4-b24',
    // Cùng một công 400 J nhưng làm xong trong 4 s và 2 s: công suất khác nhau gấp đôi.
    animation: {
      title: 'Cùng một công, khác thời gian',
      description:
        'Hai người cùng nâng một thùng 20 kg lên độ cao 2 m, hai thùng đi lên song song trong cùng một cảnh. Người bên trái nâng chậm, mất 4 giây; người bên phải nâng nhanh, chỉ mất 2 giây rồi đứng chờ. Công mà hai người thực hiện HOÀN TOÀN BẰNG NHAU: A = P·h = 200 × 2 = 400 J, vì công chỉ phụ thuộc lực và độ cao, không phụ thuộc nhanh chậm. Cái khác nhau là công suất — tốc độ thực hiện công: người chậm có P = 400 : 4 = 100 W, người nhanh có P = 400 : 2 = 200 W, gấp đôi. Công suất trả lời câu hỏi "làm xong việc đó nhanh đến mức nào", còn công trả lời câu hỏi "đã tốn bao nhiêu năng lượng".',
      viewBoxWidth: 340,
      viewBoxHeight: 250,
      durationMs: 5000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'san',
          x1: 20,
          y1: 220,
          x2: 320,
          y2: 220,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'moc-cao',
          x1: 30,
          y1: 100,
          x2: 310,
          y2: 100,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '5 4',
        },
        {
          kind: 'rect',
          id: 'thung-cham',
          x: 60,
          y: 184,
          w: 44,
          h: 36,
          rx: 3,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 4000, dy: -84 },
            { atMs: 5000, dy: -84 },
          ],
        },
        {
          kind: 'rect',
          id: 'thung-nhanh',
          x: 240,
          y: 184,
          w: 44,
          h: 36,
          rx: 3,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 2000, dy: -84 },
            { atMs: 5000, dy: -84 },
          ],
        },
        {
          kind: 'arrow',
          id: 'keo-cham',
          x1: 82,
          y1: 184,
          x2: 82,
          y2: 152,
          stroke: 'correct',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 4000, dy: -84 },
            { atMs: 5000, dy: -84 },
          ],
        },
        {
          kind: 'arrow',
          id: 'keo-nhanh',
          x1: 262,
          y1: 184,
          x2: 262,
          y2: 152,
          stroke: 'correct',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 2000, dy: -84 },
            { atMs: 5000, dy: -84 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-h',
          x: 320,
          y: 94,
          text: 'h = 2 m',
          size: 12,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-cham',
          x: 82,
          y: 240,
          text: '4 s → 100 W',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-nhanh',
          x: 262,
          y: 240,
          text: '2 s → 200 W',
          size: 13,
          anchor: 'middle',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-cong',
          x: 20,
          y: 30,
          text: 'Công như nhau: A = P·h = 200 × 2 = 400 J',
          size: 14,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-cs',
          x: 20,
          y: 52,
          text: 'Công suất = A / t — khác nhau vì thời gian khác nhau',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Hai thùng 20 kg cùng được nâng lên cao 2 m.' },
        { atMs: 2000, text: 'Thùng bên phải đã lên tới nơi sau 2 giây.' },
        {
          atMs: 4000,
          text: 'Thùng bên trái mất 4 giây: cùng công 400 J, công suất chỉ bằng một nửa.',
        },
      ],
    },
    grade: '10',
    chapterNumber: 4,
    chapterTitle: 'Năng lượng, công, công suất',
    lessonNumber: 24,
    title: 'Công suất',
    hook:
      'Một người thợ cần cả ngày để cuốc xong mảnh vườn, trong khi chiếc máy cày chỉ mất 15 phút. ' +
      'Cả hai đều thực hiện cùng một lượng công như nhau, nhưng máy cày có một đại lượng vượt trội hơn hẳn: Công suất.',
    theory:
      'ĐỊNH NGHĨA CÔNG SUẤT (POWER):\n' +
      '— Công suất là đại lượng đặc trưng cho tốc độ thực hiện công của lực, đo bằng công thực hiện được trong một đơn vị thời gian.\n' +
      '— Công thức tính công suất trung bình: 𝒫 = A / t.\n' +
      '— Đơn vị đo trong hệ SI: Watt (kí hiệu là W), với 1 W = 1 J/s.\n' +
      '  — Đơn vị ngoài hệ SI thường gặp là mã lực: mã lực Anh (horsepower, HP) có 1 HP ≈ 746 W, ' +
      'còn mã lực Pháp (cheval-vapeur, CV) có 1 CV ≈ 736 W.\n\n' +
      'MỐI LIÊN HỆ GIỮA CÔNG SUẤT, LỰC VÀ VẬN TỐC:\n' +
      '— Khi lực F cùng hướng với vận tốc v của vật, ta có: 𝒫 = A / t = (F.s) / t = F.v.\n' +
      '— Công thức này giải thích tại sao khi xe lên dốc, để tăng lực kéo F giúp xe leo dốc khỏe hơn, người lái xe phải về số thấp để giảm vận tốc v của xe (giữ công suất 𝒫 động cơ tối đa không đổi).',
    workedExample: {
      problem:
        'Một cần cẩu nâng đều một thùng hàng khối lượng m = 500 kg lên độ cao h = 10 m trong thời gian t = 20 giây. ' +
        'Lấy g = 10 m/s². Tính công suất trung bình của động cơ cần cẩu.',
      steps: [
        'Tính lực nâng tối thiểu của cần cẩu để nâng đều vật: F = P = m.g = 500 * 10 = 5000 (N).',
        'Tính công cơ học thực hiện để nâng vật lên độ cao h: A = F.h = 5000 * 10 = 50000 (J).',
        'Tính công suất trung bình của động cơ cần cẩu: 𝒫 = A / t = 50000 / 20 = 2500 (W) = 2,5 kW.',
      ],
      answer: '𝒫 = 2500 W',
    },
    checkQuestions: [
      {
        prompt:
          'Viết công thức tính công suất 𝒫 của một động cơ thực hiện công A trong khoảng thời gian t.',
        choices: [
          { id: 'ct_1', label: '𝒫 = A / t' },
          { id: 'ct_2', label: '𝒫 = A * t' },
          { id: 'ct_3', label: '𝒫 = t / A' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['ct_1'],
        },
        explain:
          'Công suất được định nghĩa bằng công thực hiện chia cho khoảng thời gian thực hiện công đó.',
      },
      {
        prompt:
          'Động cơ của một xe máy sinh ra công suất kéo 3 kW khi xe chạy đều trên đường phẳng. Tính công kéo của động cơ xe máy trong thời gian 10 giây.',
        answer: {
          kind: 'numeric',
          value: 30000,
          unit: 'J',
        },
        explain:
          'Đổi 3 kW = 3000 W. Công A = 𝒫 * t = 3000 * 10 = 30000 J. Luôn đổi công suất về đơn vị W (không phải kW) trước khi nhân với thời gian tính bằng giây để ra công đúng đơn vị J.',
      },
    ],
    srsCards: [
      {
        hoi: 'Đơn vị Watt (W) của công suất tương đương với những đơn vị cơ bản nào?',
        dap: 'Joule trên giây (J/s).',
      },
      {
        hoi: 'Viết công thức liên hệ giữa công suất 𝒫, lực kéo F và vận tốc chuyển động đều v?',
        dap: '𝒫 = F.v.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c4-b25',
    // Vật rơi: cột thế năng ngắn lại đúng bằng mức cột động năng dài ra — hai dạng năng lượng đổi chỗ cho nhau.
    animation: {
      title: 'Thế năng đổi thành động năng khi vật rơi',
      description:
        'Một vật 1 kg được thả rơi từ độ cao 5 m. Bên trái là vật đang rơi nhanh dần; bên phải là hai cột năng lượng. Lúc mới thả, vật đứng yên nên động năng bằng 0, còn thế năng đạt cực đại Wt = mgh = 1 × 10 × 5 = 50 J — cột thế năng cao nhất, cột động năng gần như không có. Trong khi vật rơi, cột thế năng thấp dần vì độ cao giảm, đúng lúc đó cột động năng cao dần lên vì vận tốc tăng. Ngay trước khi chạm đất, thế năng bằng 0 còn động năng đạt 50 J, ứng với v = 10 m/s. Ở mọi thời điểm, phần thế năng mất đi bằng đúng phần động năng nhận thêm: năng lượng không tự sinh ra cũng không mất đi, nó chỉ chuyển từ dạng này sang dạng khác.',
      viewBoxWidth: 360,
      viewBoxHeight: 260,
      durationMs: 4000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'mat-dat',
          x1: 20,
          y1: 230,
          x2: 340,
          y2: 230,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'moc-cao',
          x1: 30,
          y1: 70,
          x2: 150,
          y2: 70,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '5 4',
        },
        {
          kind: 'circle',
          id: 'vat-roi',
          cx: 90,
          cy: 70,
          r: 14,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dy: 0.0 },
            { atMs: 500, dy: 2.28 },
            { atMs: 1000, dy: 9.12 },
            { atMs: 1500, dy: 20.53 },
            { atMs: 2000, dy: 36.5 },
            { atMs: 2500, dy: 57.03 },
            { atMs: 3000, dy: 82.12 },
            { atMs: 3500, dy: 111.78 },
            { atMs: 4000, dy: 146.0 },
          ],
        },
        {
          kind: 'line',
          id: 'cot-the-nang',
          x1: 230,
          y1: 220,
          x2: 230,
          y2: 80,
          origin: [230, 220],
          stroke: 'accent',
          strokeWidth: 14,
          keyframes: [
            { atMs: 0, scale: 1.0 },
            { atMs: 500, scale: 0.984 },
            { atMs: 1000, scale: 0.938 },
            { atMs: 1500, scale: 0.859 },
            { atMs: 2000, scale: 0.75 },
            { atMs: 2500, scale: 0.609 },
            { atMs: 3000, scale: 0.438 },
            { atMs: 3500, scale: 0.234 },
            { atMs: 4000, scale: 0.02 },
          ],
        },
        {
          kind: 'line',
          id: 'cot-dong-nang',
          x1: 300,
          y1: 220,
          x2: 300,
          y2: 80,
          origin: [300, 220],
          stroke: 'primary',
          strokeWidth: 14,
          keyframes: [
            { atMs: 0, scale: 0.02 },
            { atMs: 500, scale: 0.02 },
            { atMs: 1000, scale: 0.062 },
            { atMs: 1500, scale: 0.141 },
            { atMs: 2000, scale: 0.25 },
            { atMs: 2500, scale: 0.391 },
            { atMs: 3000, scale: 0.562 },
            { atMs: 3500, scale: 0.766 },
            { atMs: 4000, scale: 1.0 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-h',
          x: 30,
          y: 64,
          text: 'h = 5 m',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-wt',
          x: 230,
          y: 248,
          text: 'Thế năng',
          size: 12,
          anchor: 'middle',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-wd',
          x: 300,
          y: 248,
          text: 'Động năng',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-ct',
          x: 20,
          y: 24,
          text: 'Wt = mgh = 50 J · Wđ = ½mv²',
          size: 14,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-tong',
          x: 20,
          y: 44,
          text: 'Mất bao nhiêu thế năng thì được bấy nhiêu động năng',
          size: 11,
          anchor: 'start',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Vừa thả: thế năng 50 J, động năng 0.' },
        { atMs: 2000, text: 'Đang rơi: cột thế năng thấp đi, cột động năng cao lên.' },
        { atMs: 4000, text: 'Sắp chạm đất: thế năng 0, động năng 50 J, v = 10 m/s.' },
      ],
    },
    grade: '10',
    chapterNumber: 4,
    chapterTitle: 'Năng lượng, công, công suất',
    lessonNumber: 25,
    title: 'Động năng, thế năng',
    hook:
      'Một viên đạn nhỏ đang bay có thể xuyên thủng tấm thép dày nhờ mang động năng lớn. ' +
      'Một hồ chứa nước trên đỉnh núi cao lại chứa đựng một lượng thế năng khổng lồ sẵn sàng chạy máy phát điện. Hai dạng năng lượng này tích luỹ thế nào?',
    theory:
      'ĐỘNG NĂNG (KINETIC ENERGY):\n' +
      '— Động năng (W_đ) là dạng năng lượng mà một vật có được do nó đang chuyển động.\n' +
      '— Công thức tính động năng: W_đ = 0,5.m.v².\n' +
      '— Định lí động năng: Độ biến thiên động năng của một vật bằng công của các ngoại lực tác dụng lên vật: A = W_đ2 - W_đ1.\n\n' +
      'THẾ NĂNG TRỌNG TRƯỜNG (GRAVITATIONAL POTENTIAL ENERGY):\n' +
      '— Thế năng trọng trường (W_t) là dạng năng lượng tương tác giữa Trái Đất và vật, phụ thuộc vào vị trí của vật trong trọng trường.\n' +
      '— Công thức tính thế năng trọng trường ở độ cao h so với mốc thế năng đã chọn: W_t = m.g.h.\n' +
      '  — h: Độ cao của vật so với mốc chọn làm thế năng bằng 0 (hướng lên trên h dương, hướng xuống dưới h âm).',
    workedExample: {
      problem:
        'Một con chim bồ câu khối lượng m = 0,5 kg đang bay với vận tốc v = 10 m/s ở độ cao h = 20 m so với mặt đất. ' +
        'Lấy g = 10 m/s² và chọn mặt đất làm mốc thế năng. Tính động năng và thế năng trọng trường của con chim.',
      steps: [
        'Tính động năng của con chim: W_đ = 0,5.m.v² = 0,5 * 0,5 * 10² = 0,25 * 100 = 25 (J).',
        'Xác định độ cao h = 20 m so với mốc thế năng mặt đất.',
        'Tính thế năng trọng trường của con chim: W_t = m.g.h = 0,5 * 10 * 20 = 100 (J).',
      ],
      answer: 'Động năng: 25 J; Thế năng: 100 J.',
    },
    checkQuestions: [
      {
        prompt:
          'Viết công thức tính động năng W_đ của một vật khối lượng m đang chuyển động với vận tốc v.',
        choices: [
          { id: 'ct_1', label: 'W_đ = 0,5 * m * v²' },
          { id: 'ct_2', label: 'W_đ = m * v' },
          { id: 'ct_3', label: 'W_đ = 0,5 * m * v' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['ct_1'],
        },
        explain:
          'Động năng tỉ lệ thuận với khối lượng m và với BÌNH PHƯƠNG vận tốc: W_đ = 0,5.m.v². Vì thế vận tốc tăng gấp đôi ' +
          'thì động năng tăng gấp bốn — hai phương án chỉ có v bậc nhất đều không mô tả được điều đó.',
      },
      {
        prompt:
          'Một vật có khối lượng 2 kg được đặt ở độ cao 5 m so với mặt đất (mốc thế năng). Lấy gia tốc trọng trường g = 10 m/s². Tính thế năng trọng trường của vật.',
        answer: {
          kind: 'numeric',
          value: 100,
          unit: 'J',
        },
        explain:
          'Thế năng W_t = m.g.h = 2 * 10 * 5 = 100 J. Giá trị này phụ thuộc vào mốc thế năng chọn trước (thường là mặt đất) — đổi mốc thì h và W_t đổi theo dù vật không di chuyển.',
      },
    ],
    srsCards: [
      {
        hoi: 'Động năng của một vật thay đổi thế nào khi vận tốc của nó tăng lên gấp đôi?',
        dap: 'Tăng lên gấp 4 lần (vì tỉ lệ thuận với bình phương vận tốc).',
      },
      {
        hoi: 'Giá trị thế năng trọng trường phụ thuộc vào việc chọn đại lượng nào làm chuẩn?',
        dap: 'Phụ thuộc vào mốc thế năng đã chọn, tức vị trí quy ước có thế năng bằng 0.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c4-b26',
    // Vật trượt trong máng cong: lên đúng độ cao ban đầu ở phía bên kia — cơ năng bảo toàn.
    animation: {
      title: 'Trượt máng cong: lên lại đúng độ cao cũ',
      description:
        'Một viên bi được thả không vận tốc đầu từ mép trái của một máng cong nhẵn. Bi trượt xuống, chạy qua đáy máng rất nhanh, rồi leo lên phía bên phải và dừng lại đúng ở độ cao ban đầu — đường nét đứt nằm ngang cho thấy hai mép cao bằng nhau. Sau đó bi quay ngược trở lại và lặp mãi. Ở trên cao bi đi chậm vì phần lớn cơ năng đang nằm ở dạng thế năng; xuống tới đáy bi đi nhanh nhất vì toàn bộ phần thế năng đã mất được đổi thành động năng. Tổng W = Wđ + Wt giữ nguyên suốt hành trình khi bỏ qua ma sát. Với h = 2 m, tốc độ ở đáy là v = căn bậc hai của 2gh ≈ 6,3 m/s, và con số này không phụ thuộc khối lượng viên bi.',
      viewBoxWidth: 360,
      viewBoxHeight: 230,
      durationMs: 6000,
      loop: true,
      shapes: [
        {
          kind: 'polyline',
          id: 'mang-cong',
          points: [
            [40, 70],
            [75, 118.8],
            [110, 153.6],
            [145, 174.4],
            [180, 181.2],
            [215, 174.4],
            [250, 153.6],
            [285, 118.8],
            [320, 70],
          ],
          stroke: 'neutral',
          strokeWidth: 4,
        },
        {
          kind: 'line',
          id: 'muc-cao',
          x1: 30,
          y1: 70,
          x2: 330,
          y2: 70,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '6 4',
        },
        {
          kind: 'line',
          id: 'day-mang',
          x1: 30,
          y1: 181,
          x2: 330,
          y2: 181,
          stroke: 'muted',
          strokeWidth: 1.5,
          dash: '3 4',
        },
        {
          kind: 'circle',
          id: 'vien-bi',
          cx: 40,
          cy: 60,
          r: 10,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 900, dx: 70, dy: 83.6 },
            { atMs: 1500, dx: 140, dy: 111.2 },
            { atMs: 2100, dx: 210, dy: 83.6 },
            { atMs: 3000, dx: 280, dy: 0 },
            { atMs: 3900, dx: 210, dy: 83.6 },
            { atMs: 4500, dx: 140, dy: 111.2 },
            { atMs: 5100, dx: 70, dy: 83.6 },
            { atMs: 6000, dx: 0, dy: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-h',
          x: 336,
          y: 130,
          text: 'h = 2 m',
          size: 12,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-day',
          x: 180,
          y: 204,
          text: 'Ở đáy: nhanh nhất, v ≈ 6,3 m/s',
          size: 12,
          anchor: 'middle',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-mep',
          x: 40,
          y: 54,
          text: 'Thả từ nghỉ',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-w',
          x: 20,
          y: 28,
          text: 'W = Wđ + Wt không đổi (bỏ qua ma sát)',
          size: 14,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-kl',
          x: 20,
          y: 222,
          text: 'Lên lại đúng độ cao cũ — không phụ thuộc khối lượng',
          size: 11,
          anchor: 'start',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Thả bi từ mép trái, vận tốc đầu bằng 0.' },
        { atMs: 1500, text: 'Qua đáy máng: thế năng nhỏ nhất, tốc độ lớn nhất.' },
        { atMs: 3000, text: 'Leo lên mép phải đúng độ cao ban đầu rồi quay lại.' },
      ],
    },
    grade: '10',
    chapterNumber: 4,
    chapterTitle: 'Năng lượng, công, công suất',
    lessonNumber: 26,
    title: 'Cơ năng và định luật bảo toàn cơ năng',
    hook:
      'Khi tàu lượn siêu tốc lao dốc từ đỉnh cao nhất, nó chạy nhanh dần lên. Thế năng tích tụ ở đỉnh đã biến đi đâu? ' +
      'Nó đã chuyển hoá thành động năng, đúng theo định luật bảo toàn cơ năng.',
    theory:
      'KHÁI NIỆM CƠ NĂNG (MECHANICAL ENERGY):\n' +
      '— Cơ năng (W) là tổng động năng và thế năng của vật: W = W_đ + W_t = 0,5.m.v² + m.g.h.\n\n' +
      'ĐỊNH LUẬT BẢO TOÀN CƠ NĂNG:\n' +
      '— Phát biểu: Khi một vật chuyển động trong trọng trường chỉ chịu tác dụng của trọng lực (không có lực cản, lực ma sát), thì cơ năng của vật là một đại lượng bảo toàn (không đổi theo thời gian).\n' +
      '— Biểu thức: W = W_đ + W_t = hằng số.\n' +
      '  — Hệ quả: Động năng cực đại tại vị trí thế năng cực tiểu (mặt đất), thế năng cực đại tại vị trí động năng cực tiểu (đỉnh cao nhất).\n\n' +
      'ẢNH HƯỞNG CỦA LỰC MA SÁT (LỰC KHÔNG THẾ):\n' +
      '— Nếu vật chịu thêm lực cản, ma sát, cơ năng không bảo toàn. Độ biến thiên cơ năng bằng công của lực ma sát: A_ms = W₂ - W₁ (cơ năng hao hụt chuyển thành nhiệt năng).',
    workedExample: {
      problem:
        'Một vật được thả rơi tự do không vận tốc đầu từ độ cao h = 20 m xuống mặt đất. Lấy g = 10 m/s². ' +
        'Dùng định luật bảo toàn cơ năng để tính vận tốc của vật ngay trước khi chạm đất.',
      steps: [
        'Chọn mốc thế năng tại mặt đất (h = 0).',
        'Cơ năng tại vị trí thả ở đỉnh cao h: W₁ = W_đ1 + W_t1 = 0 + m.g.h = m.g.h.',
        'Cơ năng tại vị trí chạm đất (h = 0): W₂ = W_đ2 + W_t2 = 0,5.m.v² + 0 = 0,5.m.v².',
        'Vì bỏ qua sức cản không khí, cơ năng bảo toàn: W₁ = W₂ => m.g.h = 0,5.m.v².',
        'Rút gọn m hai vế: g.h = 0,5.v² => v² = 2.g.h = 2 * 10 * 20 = 400.',
        'Suy ra v = √400 = 20 (m/s).',
      ],
      answer: 'v = 20 m/s',
    },
    checkQuestions: [
      {
        prompt:
          'Định luật bảo toàn cơ năng chỉ nghiệm đúng khi vật chuyển động dưới tác dụng của lực nào sau đây (bỏ qua các lực khác)?',
        choices: [
          { id: 'trong_luc', label: 'Chỉ chịu tác dụng của trọng lực (hoặc lực thế)' },
          { id: 'ma_sat', label: 'Chịu tác dụng chủ yếu của lực ma sát' },
          { id: 'khi_dong', label: 'Chịu tác dụng của lực cản không khí rất lớn' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['trong_luc'],
        },
        explain:
          'Bảo toàn cơ năng yêu cầu hệ không chịu lực cản, ma sát tiêu hao năng lượng, chỉ chịu tác dụng của lực thế như trọng lực.',
      },
      {
        prompt:
          'Một vật có cơ năng tổng cộng là 100 J chuyển động trong trọng trường. Tại một vị trí, thế năng trọng trường của vật đo được là 40 J. Tính động năng của vật tại vị trí đó.',
        answer: {
          kind: 'numeric',
          value: 60,
          unit: 'J',
        },
        explain:
          'Động năng W_đ = W - W_t = 100 - 40 = 60 J. Dựa trên định luật bảo toàn cơ năng (bỏ qua ma sát): cơ năng W = W_đ + W_t luôn không đổi tại mọi vị trí trên quỹ đạo.',
      },
    ],
    srsCards: [
      {
        hoi: 'Cơ năng của một vật gồm các thành phần nào?',
        dap: 'Gồm động năng (năng lượng chuyển động) và thế năng (năng lượng vị trí).',
      },
      {
        hoi: 'Khi một vật rơi tự do xuống dưới, sự chuyển hoá năng lượng diễn ra như thế nào?',
        dap: 'Thế năng giảm dần và chuyển hoá hoàn toàn thành động năng tăng dần.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c4-b27',
    // Sơ đồ dòng năng lượng qua động cơ: 1000 J vào, 400 J có ích, 600 J hao phí — hiệu suất 40%.
    animation: {
      title: 'Dòng năng lượng qua một động cơ',
      description:
        'Sơ đồ theo dõi năng lượng đi qua một động cơ điện. Từ trái, một dòng năng lượng 1000 J chạy vào máy — chấm sáng lớn di chuyển dọc mũi tên vào. Bên phải máy, dòng năng lượng tách làm hai nhánh và hai chấm sáng đi ra cùng lúc: nhánh trên là phần CÓ ÍCH 400 J dùng để nâng vật, nhánh dưới là phần HAO PHÍ 600 J toả ra thành nhiệt do ma sát và điện trở dây quấn. Cộng lại vẫn đúng 1000 J: năng lượng không mất đi, nó chỉ chuyển sang dạng mà ta không dùng được. Hiệu suất là tỉ số phần có ích trên phần đưa vào: H = 400 : 1000 = 0,4 = 40%. Vì nhánh hao phí không bao giờ bằng 0 nên hiệu suất của mọi máy thực luôn nhỏ hơn 100%.',
      viewBoxWidth: 380,
      viewBoxHeight: 220,
      durationMs: 4000,
      loop: true,
      shapes: [
        { kind: 'rect', id: 'dong-co', x: 140, y: 70, w: 96, h: 74, rx: 6, fill: 'neutral' },
        {
          kind: 'arrow',
          id: 'dong-vao',
          x1: 20,
          y1: 106,
          x2: 136,
          y2: 106,
          stroke: 'primary',
          strokeWidth: 9,
        },
        {
          kind: 'arrow',
          id: 'dong-co-ich',
          x1: 240,
          y1: 88,
          x2: 358,
          y2: 60,
          stroke: 'correct',
          strokeWidth: 6,
        },
        {
          kind: 'arrow',
          id: 'dong-hao-phi',
          x1: 240,
          y1: 126,
          x2: 358,
          y2: 176,
          stroke: 'danger',
          strokeWidth: 8,
        },
        {
          kind: 'circle',
          id: 'hat-vao',
          cx: 24,
          cy: 106,
          r: 7,
          fill: 'surface',
          keyframes: [
            { atMs: 0, dx: 0, opacity: 1 },
            { atMs: 1600, dx: 112, opacity: 1 },
            { atMs: 1700, dx: 112, opacity: 0 },
            { atMs: 4000, dx: 112, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'hat-co-ich',
          cx: 244,
          cy: 88,
          r: 5,
          fill: 'surface',
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 0 },
            { atMs: 2000, dx: 0, dy: 0, opacity: 1 },
            { atMs: 3600, dx: 108, dy: -26, opacity: 1 },
            { atMs: 4000, dx: 108, dy: -26, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'hat-hao-phi',
          cx: 244,
          cy: 126,
          r: 7,
          fill: 'surface',
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 0 },
            { atMs: 2000, dx: 0, dy: 0, opacity: 1 },
            { atMs: 3600, dx: 108, dy: 46, opacity: 1 },
            { atMs: 4000, dx: 108, dy: 46, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-may',
          x: 188,
          y: 112,
          text: 'ĐỘNG CƠ',
          size: 13,
          anchor: 'middle',
          fill: 'surface',
        },
        {
          kind: 'label',
          id: 'nhan-vao',
          x: 20,
          y: 92,
          text: 'Vào: 1000 J',
          size: 13,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-ich',
          x: 276,
          y: 46,
          text: 'Có ích: 400 J',
          size: 13,
          anchor: 'middle',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-hao',
          x: 300,
          y: 196,
          text: 'Hao phí: 600 J (nhiệt)',
          size: 13,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-h',
          x: 20,
          y: 30,
          text: 'H = A có ích / A toàn phần = 400/1000 = 40%',
          size: 14,
          anchor: 'start',
          fill: 'primary',
        },
      ],
      captions: [
        { atMs: 0, text: 'Năng lượng 1000 J đi vào động cơ.' },
        { atMs: 2000, text: 'Ra khỏi máy, dòng năng lượng tách thành hai nhánh.' },
        { atMs: 3600, text: 'Có ích 400 J, hao phí 600 J — hiệu suất chỉ 40%.' },
      ],
    },
    grade: '10',
    chapterNumber: 4,
    chapterTitle: 'Năng lượng, công, công suất',
    lessonNumber: 27,
    title: 'Hiệu suất',
    hook:
      'Không một động cơ nào trong thực tế có hiệu suất 100%. Phần lớn điện năng cung cấp cho bóng đèn sợi đốt bị biến thành nhiệt nóng vô ích thay vì phát sáng. ' +
      'Làm thế nào để đo lường mức độ hữu ích của máy móc?',
    theory:
      'KHÁI NIỆM HIỆU SUẤT (EFFICIENCY):\n' +
      '— Hiệu suất (H) là tỉ số giữa năng lượng có ích (hoặc công có ích) tạo ra và năng lượng toàn phần (hoặc công toàn phần) cung cấp cho thiết bị.\n' +
      '— Công thức tính hiệu suất:\n' +
      '  — Theo công cơ học: H = (A_ich / A_tp) * 100%.\n' +
      '  — Theo công suất: H = (𝒫_ich / 𝒫_tp) * 100%.\n' +
      '— Do luôn có hao phí năng lượng (toả nhiệt do ma sát, điện trở hao phí), công có ích luôn nhỏ hơn công toàn phần nên hiệu suất luôn nhỏ hơn 100% (H < 100%).',
    workedExample: {
      problem:
        'Một động cơ điện tiêu thụ công suất toàn phần là 𝒫_tp = 1000 W để kéo một thang nâng. ' +
        'Công suất có ích dùng để nâng thang lên là 𝒫_ich = 800 W. Tính hiệu suất của động cơ điện này.',
      steps: [
        'Xác định công suất toàn phần cung cấp cho động cơ: 𝒫_tp = 1000 W.',
        'Xác định công suất có ích tạo ra lực kéo nâng thang: 𝒫_ich = 800 W.',
        'Áp dụng công thức tính hiệu suất theo công suất: H = (𝒫_ich / 𝒫_tp) * 100%.',
        'Thay số: H = (800 / 1000) * 100% = 0,8 * 100% = 80%.',
      ],
      answer: 'H = 80%',
    },
    checkQuestions: [
      {
        prompt:
          'Viết công thức tính hiệu suất H của một máy biến đổi năng lượng dựa trên công có ích (A_ich) và công toàn phần tiêu thụ (A_tp).',
        choices: [
          { id: 'ct_1', label: 'H = (A_ich / A_tp) * 100%' },
          { id: 'ct_2', label: 'H = (A_tp / A_ich) * 100%' },
          { id: 'ct_3', label: 'H = A_ich * A_tp' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['ct_1'],
        },
        explain:
          'Hiệu suất bằng phần CÓ ÍCH chia cho phần TOÀN PHẦN rồi nhân 100%. Đảo ngược tỉ số sẽ luôn cho kết quả ' +
          'lớn hơn 100%, điều không thể xảy ra; còn nhân hai đại lượng với nhau thì không ra một tỉ số phần trăm nào cả.',
      },
      {
        prompt:
          'Một máy bơm nước tiêu thụ năng lượng toàn phần là 500 J, trong đó phần năng lượng có ích dùng để bơm nước lên bồn chứa là 400 J. Tính hiệu suất của máy bơm.',
        answer: {
          kind: 'numeric',
          value: donViHienThi(80, '%'),
          unit: '%',
        },
        explain:
          'Hiệu suất là tỉ số năng lượng CÓ ÍCH trên năng lượng TOÀN PHẦN: H = (400 / 500) * 100% = 80%. Phần 100 J còn lại biến thành nhiệt do ma sát và điện trở — không mất đi, chỉ chuyển sang dạng không dùng được cho việc bơm nước.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tại sao trong thực tế hiệu suất của máy móc luôn nhỏ hơn 100%?',
        dap: 'Vì luôn có một phần năng lượng bị hao phí (chuyển hoá thành nhiệt năng vô ích do ma sát hoặc điện trở).',
      },
      {
        hoi: 'Năng lượng hao phí thường biến đổi thành dạng năng lượng nào?',
        dap: 'Thường biến đổi thành nhiệt năng toả ra môi trường xung quanh.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
