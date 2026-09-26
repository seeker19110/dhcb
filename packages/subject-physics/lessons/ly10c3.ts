// lessons/ly10c3.ts — Vật lí 10, Chương 3: Động lực học (10 bài).
import type { PhysicsLesson } from '../lessonTypes.js'

export const LY10_C3_LESSONS: PhysicsLesson[] = [
  {
    id: 'ly10-c3-b13',
    // Hoạt ảnh dựng hình bình hành theo ĐÚNG thứ tự thao tác học sinh phải làm khi giải bài.
    animation: {
      title: 'Dựng hình bình hành để tìm hợp lực',
      description:
        'Cảnh dựng hình theo bốn bước, đúng thứ tự khi giải bài. Bước 1: từ điểm đặt O vẽ lực F₁ = 6 N nằm ngang sang phải (mũi tên dài 6 ô). Bước 2: cũng từ O vẽ lực F₂ = 8 N thẳng đứng hướng lên (mũi tên dài 8 ô). Bước 3: từ ngọn mỗi mũi tên kẻ một đường nét đứt song song với mũi tên kia, hai đường cắt nhau tại một điểm. Bước 4: nối O với điểm cắt đó, được đường chéo hình bình hành — chính là hợp lực F. Vì F₁ vuông góc F₂ nên hình bình hành thành hình chữ nhật và F = √(6² + 8²) = 10 N. Chú ý: hợp lực 10 N nhỏ hơn tổng số học 6 + 8 = 14 N, vì lực là vectơ chứ không phải con số cộng thẳng.',
      viewBoxWidth: 320,
      viewBoxHeight: 220,
      durationMs: 4000,
      loop: true,
      shapes: [
        { kind: 'circle', id: 'diem-dat', cx: 60, cy: 190, r: 5, fill: 'neutral' },
        {
          kind: 'label',
          id: 'nhan-o',
          x: 48,
          y: 208,
          text: 'O',
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'arrow',
          id: 'luc-f1',
          x1: 60,
          y1: 190,
          x2: 180,
          y2: 190,
          stroke: 'primary',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 400, opacity: 1 },
            { atMs: 4000, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'luc-f2',
          x1: 60,
          y1: 190,
          x2: 60,
          y2: 30,
          stroke: 'accent',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1000, opacity: 0 },
            { atMs: 1400, opacity: 1 },
            { atMs: 4000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'phu-tro-1',
          x1: 180,
          y1: 190,
          x2: 180,
          y2: 30,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '5 4',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2000, opacity: 0 },
            { atMs: 2400, opacity: 1 },
            { atMs: 4000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'phu-tro-2',
          x1: 60,
          y1: 30,
          x2: 180,
          y2: 30,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '5 4',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2000, opacity: 0 },
            { atMs: 2400, opacity: 1 },
            { atMs: 4000, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'hop-luc',
          x1: 60,
          y1: 190,
          x2: 180,
          y2: 30,
          stroke: 'correct',
          strokeWidth: 4,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3000, opacity: 0 },
            { atMs: 3400, opacity: 1 },
            { atMs: 4000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-f1',
          x: 120,
          y: 208,
          text: 'F₁ = 6 N',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-f2',
          x: 52,
          y: 110,
          text: 'F₂ = 8 N',
          size: 13,
          anchor: 'end',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-f',
          x: 196,
          y: 96,
          text: 'F = 10 N',
          size: 14,
          anchor: 'start',
          fill: 'neutral',
        },
      ],
      captions: [
        { atMs: 0, text: 'Bước 1: vẽ F₁ = 6 N từ điểm đặt O.' },
        { atMs: 1400, text: 'Bước 2: vẽ F₂ = 8 N cũng từ O, theo đúng phương chiều của nó.' },
        { atMs: 2400, text: 'Bước 3: kẻ hai đường song song để khép kín hình bình hành.' },
        { atMs: 3400, text: 'Bước 4: đường chéo từ O là hợp lực F = 10 N — không phải 14 N.' },
      ],
    },
    grade: '10',
    chapterNumber: 3,
    chapterTitle: 'Động lực học',
    lessonNumber: 13,
    title: 'Tổng hợp và phân tích lực. Cân bằng lực',
    hook:
      'Tại sao một cây cầu treo mỏng manh lại có thể đỡ được đoàn xe tải nặng hàng chục tấn? ' +
      'Bí quyết nằm ở sự phối hợp của các lực căng dây cáp để tổng hợp thành một lực cân bằng hoàn hảo.',
    theory:
      'KHÁI NIỆM VỀ LỰC VÀ ĐIỀU KIỆN CÂN BẰNG:\n' +
      '— Lực (F) là đại lượng vectơ đặc trưng cho tác dụng của vật này lên vật khác, kết quả gây ra gia tốc hoặc làm vật biến dạng. Đơn vị: Newton (N).\n' +
      '— Giá của lực: Đường thẳng mang vectơ lực.\n' +
      '— Hệ lực cân bằng: Các lực cùng tác dụng lên một vật và không gây gia tốc cho vật (vật đứng yên hoặc thẳng đều).\n\n' +
      'TỔNG HỢP LỰC (Quy tắc hình bình hành):\n' +
      '— Tổng hợp lực là thay thế nhiều lực tác dụng đồng thời vào một vật bằng một lực duy nhất có tác dụng giống hệt.\n' +
      '— Quy tắc hình bình hành: Vectơ F = vectơ F₁ + vectơ F₂. Độ lớn tổng hợp:\n' +
      '  — Khi cùng chiều: F = F₁ + F₂.\n' +
      '  — Khi ngược chiều: F = |F₁ - F₂|.\n' +
      '  — Khi vuông góc: F = √(F₁² + F₂²).\n' +
      '  — Tổng quát: F = √(F₁² + F₂² + 2.F₁.F₂.cos α) (α là góc giữa hai lực).\n\n' +
      'PHÂN TÍCH LỰC:\n' +
      '— Phân tích lực là thay thế một lực bằng hai hoặc nhiều lực thành phần có tác dụng giống hệt lực đó. Thường phân tích theo hai phương vuông góc Ox và Oy để giải toán: F_x = F.cos α, F_y = F.sin α.',
    workedExample: {
      problem:
        'Một vật chịu tác dụng của hai lực vuông góc nhau có độ lớn lần lượt là F₁ = 6 N và F₂ = 8 N. ' +
        'Tính độ lớn của lực tổng hợp tác dụng lên vật.',
      steps: [
        'Xác định hai lực thành phần: F₁ = 6 N, F₂ = 8 N.',
        'Vì hai lực vuông góc nhau nên góc giữa chúng α = 90° (cos 90° = 0).',
        'Áp dụng công thức tổng hợp lực cho trường hợp vuông góc: F = √(F₁² + F₂²).',
        'Thay số: F = √(6² + 8²) = √(36 + 64) = √100 = 10 (N).',
      ],
      answer: 'F = 10 N',
    },
    checkQuestions: [
      {
        prompt:
          'Nếu hai lực đồng quy có độ lớn F₁ = 3 N và F₂ = 4 N tác dụng vuông góc lên một vật, lực tổng hợp có độ lớn bằng bao nhiêu?',
        answer: {
          kind: 'numeric',
          value: 5,
          unit: 'N',
        },
        explain:
          'Hai lực vuông góc nên F = √(3² + 4²) = √25 = 5 N. Đây là quy tắc hình bình hành: khi hai lực thành phần vuông góc, hợp lực tính theo Pythagoras thay vì cộng đại số trực tiếp.',
      },
      {
        prompt:
          'Một chất điểm đứng yên cân bằng dưới tác dụng của 3 lực F₁, F₂, F₃. Hệ thức nào sau đây biểu diễn đúng điều kiện cân bằng này?',
        choices: [
          { id: 'dung', label: 'Vectơ F₁ + Vectơ F₂ + Vectơ F₃ = Vectơ 0' },
          { id: 'sai_1', label: 'F₁ + F₂ + F₃ = 0 (dạng đại số)' },
          { id: 'sai_2', label: 'Vectơ F₁ + Vectơ F₂ = Vectơ F₃' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['dung'],
        },
        explain:
          'Điều kiện cân bằng là tổng VECTƠ của mọi lực tác dụng lên vật bằng vectơ không. Cộng ba độ lớn như ba con số ' +
          '(dạng đại số) thì không bao giờ ra 0 vì độ lớn luôn dương. Còn F₁ + F₂ = F₃ sai dấu: hợp lực của F₁ và F₂ ' +
          'phải TRỰC ĐỐI với F₃, tức bằng -F₃.',
      },
      {
        // Câu bẫy: cộng độ lớn hai lực như cộng hai con số, quên rằng lực là VECTƠ.
        prompt:
          'Hai lực đồng quy có độ lớn F₁ = 5 N và F₂ = 12 N, góc giữa chúng thay đổi được. Giá trị nào sau đây KHÔNG thể là độ lớn hợp lực của chúng?',
        choices: [
          { id: 'bay', label: '7 N' },
          { id: 'muoi_ba', label: '13 N' },
          { id: 'hai_muoi', label: '20 N' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['hai_muoi'],
        },
        explain:
          'Lực là VECTƠ nên hợp lực không phải là phép cộng số học. Khi góc giữa hai lực chạy từ 0° đến 180°, độ lớn hợp lực chỉ chạy trong khoảng |F₁ − F₂| ≤ F ≤ F₁ + F₂, tức 7 N ≤ F ≤ 17 N. ' +
          'Vậy 7 N đạt được khi hai lực ngược chiều, 13 N đạt được khi hai lực vuông góc (√(5² + 12²) = 13), còn 20 N thì vượt cả trường hợp thuận lợi nhất là hai lực cùng chiều (17 N) nên không thể xảy ra. ' +
          'Sai lầm thường gặp là cứ thấy hai lực là cộng 5 + 12 = 17 rồi tưởng hợp lực muốn lớn bao nhiêu cũng được.',
      },
    ],
    srsCards: [
      {
        hoi: 'Đơn vị đo của lực trong hệ SI là gì?',
        dap: 'Newton (kí hiệu là N).',
      },
      {
        hoi: 'Phát biểu quy tắc hình bình hành dùng để tổng hợp lực?',
        dap: 'Vectơ lực tổng hợp được biểu diễn bằng đường chéo của hình bình hành mà hai cạnh là hai vectơ lực thành phần.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c3-b14',
    // Hai máng song song: có ma sát thì hộp dừng, mặt nhẵn lí tưởng thì trượt thẳng đều mãi — quán tính hiện ra bằng cách so sánh.
    animation: {
      title: 'Vì sao vật đang trượt lại dừng lại',
      description:
        'Hai chiếc hộp giống hệt nhau được đẩy đi với cùng vận tốc đầu trên hai mặt sàn khác nhau. Hộp phía trên trượt trên sàn có ma sát: các khoảng dịch chuyển của nó ngắn dần lại rồi hộp dừng hẳn, vì lực ma sát hướng ngược chiều chuyển động. Hộp phía dưới trượt trên mặt nhẵn lí tưởng không ma sát: nó giữ nguyên vận tốc, đi những quãng bằng nhau trong những khoảng thời gian bằng nhau và không bao giờ dừng. So sánh hai máng cho thấy vật dừng lại KHÔNG phải vì hết lực đẩy, mà vì có lực ma sát tác dụng. Khi hợp lực bằng không, vật đứng yên cứ đứng yên và vật đang chuyển động cứ chuyển động thẳng đều — đó là định luật 1 Newton.',
      viewBoxWidth: 380,
      viewBoxHeight: 220,
      durationMs: 5000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'san-nham',
          x1: 20,
          y1: 96,
          x2: 370,
          y2: 96,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'san-nhan',
          x1: 20,
          y1: 196,
          x2: 370,
          y2: 196,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'rect',
          id: 'hop-nham',
          x: 26,
          y: 68,
          w: 34,
          h: 28,
          rx: 3,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 1000, dx: 100 },
            { atMs: 2000, dx: 170 },
            { atMs: 3000, dx: 210 },
            { atMs: 4000, dx: 220 },
            { atMs: 5000, dx: 220 },
          ],
        },
        {
          kind: 'arrow',
          id: 'ma-sat',
          x1: 26,
          y1: 82,
          x2: 2,
          y2: 82,
          stroke: 'danger',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, dx: 0, opacity: 1 },
            { atMs: 1000, dx: 100, opacity: 1 },
            { atMs: 2000, dx: 170, opacity: 1 },
            { atMs: 3000, dx: 210, opacity: 1 },
            { atMs: 4000, dx: 220, opacity: 0 },
            { atMs: 5000, dx: 220, opacity: 0 },
          ],
        },
        {
          kind: 'rect',
          id: 'hop-nhan',
          x: 26,
          y: 168,
          w: 34,
          h: 28,
          rx: 3,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 5000, dx: 320 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-nham',
          x: 20,
          y: 60,
          text: 'Sàn có ma sát → chậm dần rồi dừng',
          size: 13,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-nhan',
          x: 20,
          y: 160,
          text: 'Mặt nhẵn lí tưởng → thẳng đều mãi mãi',
          size: 13,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-kl',
          x: 20,
          y: 30,
          text: 'Hợp lực bằng 0 thì vận tốc không đổi',
          size: 14,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-fms',
          x: 20,
          y: 214,
          text: 'Vật dừng vì có lực ma sát, không phải vì "hết lực đẩy"',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Hai hộp được đẩy đi với cùng vận tốc đầu.' },
        { atMs: 2000, text: 'Hộp trên chậm dần vì lực ma sát ngược chiều chuyển động.' },
        { atMs: 4000, text: 'Hộp trên dừng hẳn; hộp dưới không có ma sát nên vẫn đi đều.' },
      ],
    },
    grade: '10',
    chapterNumber: 3,
    chapterTitle: 'Động lực học',
    lessonNumber: 14,
    title: 'Định luật 1 Newton',
    hook:
      'Nếu bạn phóng một con tàu vũ trụ vào không gian sâu thẳm, nó sẽ bay mãi mãi theo một đường thẳng mà không cần bất kì động cơ nào chạy. ' +
      'Tại sao trên Trái Đất, mọi vật di chuyển lại dừng lại nếu ta ngừng đẩy?',
    theory:
      'QUÁN TÍNH (INERTIA):\n' +
      '— Quán tính là xu hướng bảo toàn trạng thái đứng yên hoặc chuyển động thẳng đều ban đầu của vật.\n\n' +
      'ĐỊNH LUẬT 1 NEWTON (ĐỊNH LUẬT QUÁN TÍNH):\n' +
      '— Phát biểu: Nếu một vật không chịu tác dụng của lực nào hoặc chịu tác dụng của các lực có hợp lực bằng không, thì vật đang đứng yên sẽ tiếp tục đứng yên, vật đang chuyển động sẽ tiếp tục chuyển động thẳng đều.\n\n' +
      'Ý NGHĨA CỦA ĐỊNH LUẬT:\n' +
      '— Lực không phải là nguyên nhân duy trì chuyển động, mà lực là nguyên nhân làm thay đổi vận tốc (gây ra gia tốc) của vật.\n' +
      '— Khối lượng của vật là đại lượng đặc trưng cho mức độ quán tính của vật (khối lượng càng lớn, quán tính càng lớn, vật càng khó thay đổi vận tốc).',
    workedExample: {
      problem:
        'Giải thích tại sao khi xe buýt đang chạy thẳng đều đột ngột hãm phanh gấp, hành khách trên xe có xu hướng bị chúi người về phía trước.',
      steps: [
        'Khi xe đang chạy, cả xe và người hành khách đều chuyển động về phía trước với cùng vận tốc.',
        'Khi phanh gấp, lực ma sát hãm bánh xe lại khiến xe dừng lại nhanh chóng.',
        'Tuy nhiên, do quán tính, cơ thể hành khách có xu hướng duy trì vận tốc và hướng chuyển động cũ về phía trước.',
        'Kết quả là chân hành khách dừng lại cùng sàn xe, nhưng phần thân trên vẫn lao đi, khiến họ bị chúi về phía trước.',
      ],
      answer: 'Hành khách bị chúi về phía trước do quán tính duy trì vận tốc cũ.',
    },
    checkQuestions: [
      {
        prompt: 'Định luật 1 Newton còn được gọi với tên gọi phổ biến nào?',
        choices: [
          { id: 'quan_tinh', label: 'Định luật quán tính' },
          { id: 'van_toc', label: 'Định luật vận tốc hằng số' },
          { id: 'luc_day', label: 'Định luật lực đẩy tối thiểu' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['quan_tinh'],
        },
        explain:
          'Vì định luật khẳng định xu hướng bảo toàn trạng thái chuyển động (quán tính) khi không có lực tác dụng.',
      },
      {
        prompt: 'Đại lượng vật lí nào đặc trưng cho mức độ quán tính của một vật?',
        choices: [
          { id: 'khoi_luong', label: 'Khối lượng' },
          { id: 'the_tich', label: 'Thể tích' },
          { id: 'van_toc', label: 'Vận tốc ban đầu' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['khoi_luong'],
        },
        explain:
          'Khối lượng càng lớn thì vật càng có quán tính lớn, khó thay đổi vận tốc hơn (ví dụ xe tải khó dừng hơn xe đạp).',
      },
    ],
    srsCards: [
      {
        hoi: 'Lực có vai trò gì đối với trạng thái chuyển động của vật?',
        dap: 'Lực làm thay đổi trạng thái chuyển động (gây ra gia tốc), không phải để duy trì chuyển động.',
      },
      {
        hoi: 'Phát biểu định luật 1 Newton?',
        dap: 'Vật không chịu lực hoặc chịu hợp lực bằng không thì đứng yên tiếp tục đứng yên, chuyển động tiếp tục chuyển động thẳng đều.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c3-b15',
    // Cùng một lực kéo, khối lượng gấp đôi thì gia tốc chỉ còn một nửa — đo bằng quãng đường sau cùng một khoảng thời gian.
    animation: {
      title: 'Cùng lực, khác khối lượng',
      description:
        'Hai xe được kéo bằng hai lực kéo BẰNG NHAU, cùng 4 N — hai mũi tên vẽ dài bằng nhau. Xe trên nặng 1 kg, xe dưới nặng 2 kg. Cả hai cùng xuất phát từ nghỉ và cùng chuyển động nhanh dần đều, nhưng sau 2 giây xe nhẹ đã đi được quãng đường gấp đôi xe nặng. Theo định luật 2 Newton a = F/m: xe 1 kg có a = 4 m/s², xe 2 kg chỉ có a = 2 m/s². Vì s = ½at² nên khi gia tốc giảm một nửa thì quãng đường trong cùng thời gian cũng giảm một nửa. Lực không quyết định vận tốc, lực quyết định GIA TỐC; khối lượng là đại lượng đo mức quán tính, càng lớn thì càng khó làm đổi vận tốc.',
      viewBoxWidth: 380,
      viewBoxHeight: 220,
      durationMs: 5000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'ray-tren',
          x1: 20,
          y1: 96,
          x2: 370,
          y2: 96,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'ray-duoi',
          x1: 20,
          y1: 196,
          x2: 370,
          y2: 196,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'rect',
          id: 'xe-nhe',
          x: 30,
          y: 72,
          w: 30,
          h: 24,
          rx: 3,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 1000, dx: 15 },
            { atMs: 2000, dx: 60 },
            { atMs: 3000, dx: 135 },
            { atMs: 4000, dx: 240 },
            { atMs: 5000, dx: 240 },
          ],
        },
        {
          kind: 'arrow',
          id: 'luc-tren',
          x1: 60,
          y1: 84,
          x2: 120,
          y2: 84,
          stroke: 'correct',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 1000, dx: 15 },
            { atMs: 2000, dx: 60 },
            { atMs: 3000, dx: 135 },
            { atMs: 4000, dx: 240 },
            { atMs: 5000, dx: 240 },
          ],
        },
        {
          kind: 'rect',
          id: 'xe-nang',
          x: 30,
          y: 164,
          w: 30,
          h: 32,
          rx: 3,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 1000, dx: 7.5 },
            { atMs: 2000, dx: 30 },
            { atMs: 3000, dx: 67.5 },
            { atMs: 4000, dx: 120 },
            { atMs: 5000, dx: 120 },
          ],
        },
        {
          kind: 'arrow',
          id: 'luc-duoi',
          x1: 60,
          y1: 180,
          x2: 120,
          y2: 180,
          stroke: 'correct',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 1000, dx: 7.5 },
            { atMs: 2000, dx: 30 },
            { atMs: 3000, dx: 67.5 },
            { atMs: 4000, dx: 120 },
            { atMs: 5000, dx: 120 },
          ],
        },
        {
          kind: 'line',
          id: 'dich-nhe',
          x1: 300,
          y1: 86,
          x2: 300,
          y2: 106,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '4 3',
        },
        {
          kind: 'line',
          id: 'dich-nang',
          x1: 180,
          y1: 186,
          x2: 180,
          y2: 200,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '4 3',
        },
        {
          kind: 'label',
          id: 'nhan-nhe',
          x: 20,
          y: 64,
          text: 'm = 1 kg · F = 4 N → a = 4 m/s²',
          size: 13,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-nang',
          x: 20,
          y: 154,
          text: 'm = 2 kg · F = 4 N → a = 2 m/s²',
          size: 13,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-kl',
          x: 20,
          y: 30,
          text: 'Hai mũi tên lực dài bằng nhau: cùng F = 4 N',
          size: 14,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-s',
          x: 20,
          y: 214,
          text: 'Sau 2 s: xe nhẹ đi 8 m, xe nặng chỉ 4 m',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Hai xe cùng xuất phát từ nghỉ, cùng chịu lực kéo 4 N.' },
        { atMs: 2500, text: 'Xe nhẹ đã vượt lên rõ rệt: gia tốc của nó gấp đôi.' },
        { atMs: 4000, text: 'Sau 2 giây: 8 m so với 4 m — đúng tỉ lệ a = F/m.' },
      ],
    },
    grade: '10',
    chapterNumber: 3,
    chapterTitle: 'Động lực học',
    lessonNumber: 15,
    title: 'Định luật 2 Newton',
    hook:
      'Đẩy một chiếc xe đẩy siêu thị trống không rất dễ dàng. Nhưng nếu chiếc xe chất đầy hàng hoá nặng nề, bạn cần dùng một lực lớn hơn nhiều ' +
      'chỉ để làm nó bắt đầu chuyển động. Định luật 2 Newton sẽ giải thích mối liên hệ này bằng toán học.',
    theory:
      'ĐỊNH LUẬT 2 NEWTON:\n' +
      '— Phát biểu: Gia tốc của một vật cùng hướng với lực tác dụng lên vật. Độ lớn của gia tốc tỉ lệ thuận với độ lớn của lực tác dụng và tỉ lệ nghịch với khối lượng của vật.\n' +
      '— Công thức vectơ: vectơ a = vectơ F / m hay vectơ F = m.vectơ a.\n' +
      '— Trong trường hợp vật chịu tác dụng của nhiều lực: vectơ F_hl = m.vectơ a (với F_hl là hợp lực của tất cả các lực tác dụng).\n\n' +
      'MỐI QUAN HỆ GIỮA KHỐI LƯỢNG VÀ GIA TỐC:\n' +
      '— Khối lượng (m) là đại lượng vô hướng dương đặc trưng cho mức độ quán tính (sức ì) của vật. Với cùng một lực tác dụng, vật có khối lượng lớn hơn sẽ nhận gia tốc nhỏ hơn (tỉ lệ nghịch).',
    workedExample: {
      problem:
        'Một lực F có độ lớn không đổi 20 N tác dụng lên một vật có khối lượng m = 4 kg đang đứng yên trên mặt sàn nằm ngang không ma sát. ' +
        'Tính gia tốc và vận tốc của vật sau khi lực tác dụng được 3 giây.',
      steps: [
        'Xác định các đại lượng: F = 20 N, m = 4 kg, v_o = 0, t = 3s.',
        'Áp dụng định luật 2 Newton để tính gia tốc: a = F / m = 20 / 4 = 5 (m/s²).',
        'Tính vận tốc của vật sau 3s chuyển động nhanh dần đều: v = v_o + a.t = 0 + 5 * 3 = 15 (m/s).',
      ],
      answer: 'Gia tốc: 5 m/s²; Vận tốc sau 3s: 15 m/s.',
    },
    checkQuestions: [
      {
        prompt:
          'Viết công thức toán học của Định luật 2 Newton dưới dạng liên hệ giữa hợp lực F, khối lượng m và gia tốc a.',
        choices: [
          { id: 'cong_1', label: 'F = m * a' },
          { id: 'cong_2', label: 'F = m / a' },
          { id: 'cong_3', label: 'a = F * m' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['cong_1'],
        },
        explain:
          'Hợp lực bằng khối lượng nhân gia tốc: F = m*a. Hai phương án kia sai vì cùng một lực thì khối lượng càng lớn ' +
          'gia tốc phải càng NHỎ (a = F/m), chứ không phải càng lớn.',
      },
      {
        prompt:
          'Một ô tô khối lượng 1000 kg bắt đầu tăng tốc chuyển động thẳng nhanh dần đều với gia tốc 2,5 m/s². Tính lực kéo của động cơ ô tô (bỏ qua ma sát).',
        answer: {
          kind: 'numeric',
          value: 2500,
          unit: 'N',
        },
        explain:
          'Định luật 2 Newton: hợp lực bằng khối lượng nhân gia tốc. Đề nói bỏ qua ma sát nên lực kéo của động cơ CHÍNH LÀ hợp lực: F = m * a = 1000 * 2,5 = 2500 N. Có ma sát thì lực kéo phải lớn hơn con số này, vì còn phải thắng thêm lực ma sát.',
      },
    ],
    srsCards: [
      {
        hoi: 'Gia tốc của một vật tỉ lệ thuận và tỉ lệ nghịch với những đại lượng nào?',
        dap: 'Tỉ lệ thuận với lực tác dụng và tỉ lệ nghịch với khối lượng của vật.',
      },
      {
        hoi: 'Hướng của gia tốc có mối quan hệ gì với hướng của lực tác dụng?',
        dap: 'Gia tốc luôn cùng hướng với lực tác dụng (hoặc hợp lực).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c3-b16',
    // Hai người trượt patin đẩy nhau: lực bằng nhau nhưng gia tốc khác nhau — cảnh này tách bạch
    // được "lực bằng nhau" (định luật 3) với "chuyển động giống nhau" (không hề suy ra được).
    animation: {
      title: 'Hai người trượt patin đẩy nhau',
      description:
        'Hai bạn đứng yên trên giày trượt, tay chạm tay. Bạn A nặng 60 kg (hình tròn lớn), bạn B nặng 30 kg (hình tròn nhỏ). A dùng tay đẩy B. Trong lúc hai bàn tay còn chạm nhau xuất hiện ĐỒNG THỜI hai mũi tên dài bằng nhau nhưng ngược chiều: lực A đẩy B hướng sang phải, lực B đẩy lại A hướng sang trái — chỉ một cú đẩy của A mà sinh ra cả hai. Rời tay là hết lực, hai bạn trôi đều ra xa nhau, nhưng B đi được quãng đường gấp đôi A trong cùng thời gian. Hai lực bằng nhau, còn gia tốc thì không: a = F/m, ai nhẹ hơn thì bị đẩy đi nhanh hơn. Hai lực này cũng không triệt tiêu nhau vì chúng đặt lên hai người khác nhau.',
      viewBoxWidth: 420,
      viewBoxHeight: 200,
      durationMs: 4000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'san-bang',
          x1: 10,
          y1: 150,
          x2: 410,
          y2: 150,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'circle',
          id: 'nguoi-a',
          cx: 186,
          cy: 120,
          r: 28,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 800, dx: 0 },
            { atMs: 1200, dx: -2.5 },
            { atMs: 1600, dx: -10 },
            { atMs: 4000, dx: -70 },
          ],
        },
        {
          kind: 'circle',
          id: 'nguoi-b',
          cx: 234,
          cy: 130,
          r: 18,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 800, dx: 0 },
            { atMs: 1200, dx: 5 },
            { atMs: 1600, dx: 20 },
            { atMs: 4000, dx: 140 },
          ],
        },
        {
          kind: 'arrow',
          id: 'luc-a-day-b',
          x1: 220,
          y1: 86,
          x2: 300,
          y2: 86,
          stroke: 'primary',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, opacity: 0 },
            { atMs: 700, dx: 0, opacity: 0 },
            { atMs: 800, dx: 0, opacity: 1 },
            { atMs: 1200, dx: 5, opacity: 1 },
            { atMs: 1600, dx: 20, opacity: 1 },
            { atMs: 1700, dx: 20, opacity: 0 },
            { atMs: 4000, dx: 20, opacity: 0 },
          ],
        },
        {
          kind: 'arrow',
          id: 'luc-b-day-a',
          x1: 200,
          y1: 86,
          x2: 120,
          y2: 86,
          stroke: 'accent',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, opacity: 0 },
            { atMs: 700, dx: 0, opacity: 0 },
            { atMs: 800, dx: 0, opacity: 1 },
            { atMs: 1200, dx: -2.5, opacity: 1 },
            { atMs: 1600, dx: -10, opacity: 1 },
            { atMs: 1700, dx: -10, opacity: 0 },
            { atMs: 4000, dx: -10, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-a',
          x: 186,
          y: 125,
          text: 'A',
          size: 15,
          anchor: 'middle',
          fill: 'surface',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 800, dx: 0 },
            { atMs: 1200, dx: -2.5 },
            { atMs: 1600, dx: -10 },
            { atMs: 4000, dx: -70 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-b',
          x: 234,
          y: 135,
          text: 'B',
          size: 13,
          anchor: 'middle',
          fill: 'surface',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 800, dx: 0 },
            { atMs: 1200, dx: 5 },
            { atMs: 1600, dx: 20 },
            { atMs: 4000, dx: 140 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-kl-a',
          x: 186,
          y: 167,
          text: '60 kg',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 800, dx: 0 },
            { atMs: 1200, dx: -2.5 },
            { atMs: 1600, dx: -10 },
            { atMs: 4000, dx: -70 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-kl-b',
          x: 234,
          y: 167,
          text: '30 kg',
          size: 12,
          anchor: 'middle',
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 800, dx: 0 },
            { atMs: 1200, dx: 5 },
            { atMs: 1600, dx: 20 },
            { atMs: 4000, dx: 140 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-luc-1',
          keyframes: [
            { atMs: 0, dx: 0, opacity: 0 },
            { atMs: 700, dx: 0, opacity: 0 },
            { atMs: 800, dx: 0, opacity: 1 },
            { atMs: 1200, dx: 5, opacity: 1 },
            { atMs: 1600, dx: 20, opacity: 1 },
            { atMs: 1700, dx: 20, opacity: 0 },
            { atMs: 4000, dx: 20, opacity: 0 },
          ],
          x: 310,
          y: 82,
          text: 'F (A đẩy B)',
          size: 12,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-luc-2',
          keyframes: [
            { atMs: 0, dx: 0, opacity: 0 },
            { atMs: 700, dx: 0, opacity: 0 },
            { atMs: 800, dx: 0, opacity: 1 },
            { atMs: 1200, dx: -2.5, opacity: 1 },
            { atMs: 1600, dx: -10, opacity: 1 },
            { atMs: 1700, dx: -10, opacity: 0 },
            { atMs: 4000, dx: -10, opacity: 0 },
          ],
          x: 112,
          y: 82,
          text: 'F′ (B đẩy A)',
          size: 12,
          anchor: 'end',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-ket',
          x: 210,
          y: 184,
          text: 'F = F′ nhưng gia tốc của B gấp đôi của A',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
        },
      ],
      captions: [
        { atMs: 0, text: 'Hai bạn đứng yên, tay chạm tay.' },
        { atMs: 800, text: 'A đẩy B — hai lực trực đối xuất hiện cùng lúc, dài bằng nhau.' },
        {
          atMs: 1700,
          text: 'Rời tay là hết lực: hai bạn trôi đều ra xa, B nhẹ hơn nên nhanh gấp đôi.',
        },
        { atMs: 4000, text: 'Lực bằng nhau không có nghĩa là chuyển động giống nhau.' },
      ],
    },
    grade: '10',
    chapterNumber: 3,
    chapterTitle: 'Động lực học',
    lessonNumber: 16,
    title: 'Định luật 3 Newton',
    hook:
      'Khi một chú chim đập cánh xuống không khí, không khí đẩy chú chim bay lên cao. Khi một tên lửa phụt luồng khí nóng ' +
      'xuống phía dưới, nó vọt thẳng lên trời. Tại sao lực luôn xuất hiện theo từng cặp như vậy?',
    theory:
      'SỰ TƯƠNG TÁC GIỮA CÁC VẬT:\n' +
      '— Lực không bao giờ xuất hiện đơn lẻ mà luôn xuất hiện theo cặp tương tác hai chiều giữa hai vật.\n\n' +
      'ĐỊNH LUẬT 3 NEWTON (ĐỊNH LUẬT TƯƠNG TÁC):\n' +
      '— Phát biểu: Trong mọi trường hợp, khi vật A tác dụng lên vật B một lực, thì vật B cũng tác dụng lại vật A một lực. Hai lực này là hai lực trực đối (cùng giá, cùng độ lớn nhưng ngược chiều).\n' +
      '— Công thức: vectơ F_AB = - vectơ F_BA (vectơ lực A tác dụng lên B bằng trừ vectơ lực B tác dụng lên A).\n\n' +
      'LỰC VÀ PHẢN LỰC (ACTION & REACTION):\n' +
      '— Đặc điểm của cặp lực và phản lực:\n' +
      '  1. Xuất hiện và mất đi đồng thời.\n' +
      '  2. Cùng giá, cùng độ lớn nhưng ngược chiều (trực đối).\n' +
      '  3. Không cân bằng nhau vì chúng tác dụng lên hai vật khác nhau (lực tác dụng lên B, phản lực tác dụng lên A).',
    workedExample: {
      problem:
        'Một quả bóng tennis khối lượng 100g bay đập vào tường theo phương vuông góc với vận tốc 20 m/s rồi nảy ngược lại với vận tốc 15 m/s. ' +
        'Giải thích lực tương tác giữa bóng và tường.',
      steps: [
        'Khi bóng chạm tường, bóng tác dụng lên tường một lực ép F_bt (hướng vào tường).',
        'Theo Định luật 3 Newton, tường tác dụng lại bóng một phản lực F_tb (hướng ngược ra ngoài).',
        'Phản lực F_tb của tường tác dụng lên bóng làm bóng thay đổi vận tốc đột ngột từ hướng vào sang hướng ra ngoài, nảy ngược lại.',
        'Lực F_bt làm tường rung nhẹ (hoặc biến dạng vi mô), hai lực này bằng nhau về độ lớn nhưng đặt vào hai vật khác nhau.',
      ],
      answer: 'Bóng tác dụng lực vào tường; tường tác dụng phản lực ngược chiều làm bóng nảy ra.',
    },
    checkQuestions: [
      {
        prompt: 'Cặp lực và phản lực trong Định luật 3 Newton có đặc điểm nào sau đây?',
        choices: [
          { id: 'khac_vat', label: 'Tác dụng lên hai vật khác nhau' },
          { id: 'can_bang', label: 'Tác dụng lên cùng một vật nên triệt tiêu nhau' },
          { id: 'khac_do_lon', label: 'Lực tác dụng luôn mạnh hơn phản lực' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['khac_vat'],
        },
        explain:
          'Lực và phản lực đặt vào hai vật khác nhau nên không bao giờ tự cân bằng hay triệt tiêu lẫn nhau.',
      },
      {
        prompt:
          'Viết công thức toán học mô tả mối quan hệ vectơ giữa lực tác dụng (F_12) và phản lực (F_21).',
        choices: [
          { id: 'dung', label: 'F_12 = -F_21' },
          { id: 'sai_1', label: 'F_12 = F_21' },
          { id: 'sai_2', label: 'F_12 + F_21 = 0 (đại số)' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['dung'],
        },
        explain:
          'Hai lực trực đối nên viết dạng vectơ phải có dấu trừ: F_12 = -F_21. Viết F_12 = F_21 là bỏ mất chiều ngược nhau. ' +
          'Còn F_12 + F_21 = 0 hiểu theo nghĩa ĐẠI SỐ (cộng hai độ lớn) cũng sai, vì hai độ lớn đều dương, tổng không thể bằng 0.',
      },
      {
        // Câu bẫy kinh điển "nghịch lý con ngựa kéo xe": trực đối nhưng KHÔNG cân bằng.
        prompt: 'Con ngựa kéo xe chuyển động nhanh dần về phía trước. Nhận định nào đúng?',
        choices: [
          {
            id: 'ngua_manh_hon',
            label: 'Lực ngựa kéo xe lớn hơn lực xe kéo lại ngựa, nhờ vậy hệ mới đi tới được',
          },
          {
            id: 'bang_nhau',
            label:
              'Hai lực đó luôn bằng nhau; xe đi tới được là nhờ lực ma sát của mặt đường đẩy ngựa về phía trước lớn hơn lực xe kéo lại ngựa',
          },
          {
            id: 'khong_the_di',
            label:
              'Hai lực bằng nhau và ngược chiều nên chúng triệt tiêu, hệ không thể chuyển động',
          },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['bang_nhau'],
        },
        explain:
          'Lực ngựa kéo xe và lực xe kéo lại ngựa LUÔN bằng nhau, dù xe đứng yên, đi đều hay tăng tốc — định luật 3 không có ngoại lệ. ' +
          'Chúng không triệt tiêu vì đặt lên HAI vật khác nhau: lực thứ nhất đặt lên xe, lực thứ hai đặt lên ngựa, nên không được viết chung vào một phương trình định luật 2. ' +
          'Muốn biết ngựa có tăng tốc không thì chỉ xét các lực đặt LÊN NGỰA: lực ma sát của mặt đường đẩy ngựa tới trước và lực xe kéo lại ngựa. ' +
          'Ngựa đạp mạnh xuống đất, đất đạp lại lớn hơn lực xe níu, nên cả hệ tăng tốc. Nếu ngựa đứng trên mặt băng trơn thì đúng là không đi được — không phải vì định luật 3 sai, mà vì thiếu ma sát.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tại sao lực và phản lực không triệt tiêu nhau dù chúng cùng độ lớn và ngược chiều?',
        dap: 'Vì chúng tác dụng lên hai vật khác nhau.',
      },
      {
        hoi: 'Nêu 3 đặc điểm của cặp lực và phản lực?',
        dap: 'Xuất hiện/mất đi đồng thời, trực đối (cùng độ lớn, ngược chiều), đặt vào hai vật khác nhau.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c3-b17',
    // Vật treo đứng yên vì lực căng cân bằng trọng lực; cắt dây thì chỉ còn trọng lực và vật rơi nhanh dần.
    animation: {
      title: 'Cắt dây: trọng lực còn, lực căng mất',
      description:
        'Một quả nặng 4 kg treo đứng yên trên sợi dây. Hai mũi tên vẽ trên nó dài bằng nhau và ngược chiều: lực căng dây T hướng lên và trọng lực P = mg = 4 × 10 = 40 N hướng xuống. Hợp lực bằng không nên vật đứng yên. Đến giữa cảnh, sợi dây bị cắt: mũi tên lực căng biến mất ngay lập tức, còn mũi tên trọng lực vẫn nguyên độ dài và tiếp tục hướng xuống cùng vật. Chỉ còn một lực nên hợp lực bằng P, vật rơi nhanh dần đều với gia tốc g — các khoảng dịch chuyển dài dần ra. Điểm mấu chốt: trọng lực luôn tồn tại kể cả khi vật đứng yên, và lực căng dây không phải một tính chất của vật mà chỉ xuất hiện khi có dây kéo.',
      viewBoxWidth: 260,
      viewBoxHeight: 300,
      durationMs: 4000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'tran-nha',
          x1: 50,
          y1: 24,
          x2: 210,
          y2: 24,
          stroke: 'neutral',
          strokeWidth: 4,
        },
        {
          kind: 'line',
          id: 'day-treo',
          x1: 130,
          y1: 24,
          x2: 130,
          y2: 120,
          stroke: 'neutral',
          strokeWidth: 2,
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 1800, opacity: 1 },
            { atMs: 2000, opacity: 0 },
            { atMs: 4000, opacity: 0 },
          ],
        },
        {
          kind: 'arrow',
          id: 'luc-cang',
          x1: 130,
          y1: 118,
          x2: 130,
          y2: 66,
          stroke: 'accent',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 1800, opacity: 1 },
            { atMs: 2000, opacity: 0 },
            { atMs: 4000, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'qua-nang',
          cx: 130,
          cy: 140,
          r: 20,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 2000, dy: 0 },
            { atMs: 2500, dy: 4.5 },
            { atMs: 3000, dy: 18 },
            { atMs: 3500, dy: 40.5 },
            { atMs: 4000, dy: 72 },
          ],
        },
        {
          kind: 'arrow',
          id: 'trong-luc',
          x1: 130,
          y1: 162,
          x2: 130,
          y2: 214,
          stroke: 'danger',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 2000, dy: 0 },
            { atMs: 2500, dy: 4.5 },
            { atMs: 3000, dy: 18 },
            { atMs: 3500, dy: 40.5 },
            { atMs: 4000, dy: 72 },
          ],
        },
        {
          kind: 'line',
          id: 'mat-dat',
          x1: 20,
          y1: 292,
          x2: 240,
          y2: 292,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'label',
          id: 'nhan-t',
          x: 146,
          y: 96,
          text: 'T = 40 N',
          size: 13,
          anchor: 'start',
          fill: 'accent',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 1800, opacity: 1 },
            { atMs: 2000, opacity: 0 },
            { atMs: 4000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-p',
          x: 146,
          y: 194,
          text: 'P = mg = 40 N',
          size: 13,
          anchor: 'start',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 2000, dy: 0 },
            { atMs: 2500, dy: 4.5 },
            { atMs: 3000, dy: 18 },
            { atMs: 3500, dy: 40.5 },
            { atMs: 4000, dy: 72 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-m',
          x: 104,
          y: 145,
          text: '4 kg',
          size: 12,
          anchor: 'end',
          fill: 'muted',
          keyframes: [
            { atMs: 0, dy: 0 },
            { atMs: 2000, dy: 0 },
            { atMs: 2500, dy: 4.5 },
            { atMs: 3000, dy: 18 },
            { atMs: 3500, dy: 40.5 },
            { atMs: 4000, dy: 72 },
          ],
        },
      ],
      captions: [
        { atMs: 0, text: 'Vật treo đứng yên: T hướng lên bằng đúng P hướng xuống.' },
        { atMs: 2000, text: 'Cắt dây — lực căng biến mất ngay, trọng lực thì không đổi.' },
        { atMs: 3000, text: 'Chỉ còn trọng lực: vật rơi nhanh dần đều với gia tốc g.' },
      ],
    },
    grade: '10',
    chapterNumber: 3,
    chapterTitle: 'Động lực học',
    lessonNumber: 17,
    title: 'Trọng lực và lực căng',
    hook:
      'Tại sao mọi thứ trên Trái Đất luôn rơi xuống mặt đất mà không bay lên trời? Và điều gì giữ cho một người leo núi ' +
      'lửng lơ trên vách đá nhờ một sợi dây thừng?',
    theory:
      'TRỌNG LỰC (GRAVITY) VÀ TRỌNG LƯỢNG (WEIGHT):\n' +
      '— Trọng lực (vectơ P) là lực hút của Trái Đất tác dụng lên vật, gây ra gia tốc rơi tự do cho vật.\n' +
      '  — Điểm đặt: Tại trọng tâm (center of gravity) của vật.\n' +
      '  — Phương: Thẳng đứng. Chiều: Từ trên xuống dưới (hướng về tâm Trái Đất).\n' +
      '  — Độ lớn (Trọng lượng P): P = m.g (g là gia tốc rơi tự do tại nơi đo).\n' +
      '— PHÂN BIỆT KHỐI LƯỢNG VỚI TRỌNG LƯỢNG — hai đại lượng khác hẳn nhau, hay bị gọi lẫn trong đời thường:\n' +
      '  — Khối lượng m là lượng chất của vật, đo bằng kilôgam (kg), là đại lượng VÔ HƯỚNG và KHÔNG đổi ' +
      'dù mang vật đi đâu. Nó đo mức quán tính: vật càng nặng càng khó thay đổi vận tốc.\n' +
      '  — Trọng lượng P là một LỰC, đo bằng Newton (N), là đại lượng VECTƠ và THAY ĐỔI theo nơi đặt vật ' +
      'vì g thay đổi. Bạn 50 kg trên Trái Đất có P = 500 N; lên Mặt Trăng (g ≈ 1,6 m/s²) vẫn 50 kg nhưng P chỉ còn 80 N.\n' +
      '  — VÌ SAO hay nhầm: cái cân trong nhà thực ra đo LỰC ép lên mặt cân rồi tự chia cho g để hiện ra số kg. ' +
      'Đưa đúng cái cân đó lên Mặt Trăng thì nó sẽ hiện sai, vì nó vẫn chia cho g của Trái Đất.\n\n' +
      'LỰC CĂNG DÂY (TENSION FORCE):\n' +
      '— Khi một sợi dây bị kéo căng, nó tác dụng lên các vật gắn với hai đầu dây các lực căng dây (vectơ T).\n' +
      '— Đặc điểm lực căng dây:\n' +
      '  — Điểm đặt: Tại điểm dây tiếp xúc với vật.\n' +
      '  — Phương: Dọc theo sợi dây.\n' +
      '  — Chiều: Hướng từ hai đầu dây vào phía trong sợi dây (chống lại sự kéo giãn).',
    workedExample: {
      problem:
        'Một quả cầu có khối lượng m = 2 kg được treo đứng yên vào đầu một sợi dây mảnh không dãn gắn cố định trên trần nhà. ' +
        'Lấy g = 10 m/s². Xác định các lực tác dụng lên quả cầu và tính độ lớn lực căng của sợi dây.',
      steps: [
        'Xác định các lực tác dụng lên quả cầu gồm: Trọng lực vectơ P (hướng thẳng đứng xuống) và Lực căng dây vectơ T (dọc theo dây hướng lên).',
        'Vì quả cầu đứng yên cân bằng nên hợp lực tác dụng lên nó bằng không: vectơ P + vectơ T = vectơ 0.',
        'Suy ra hai lực này đối nhau: T cùng độ lớn và ngược chiều với P.',
        'Tính độ lớn trọng lượng của quả cầu: P = m.g = 2 * 10 = 20 (N).',
        'Vậy độ lớn lực căng dây là T = P = 20 N.',
      ],
      answer: 'Lực căng dây T = 20 N',
    },
    checkQuestions: [
      {
        prompt:
          'Viết công thức tính độ lớn trọng lượng P của một vật khối lượng m ở nơi có gia tốc rơi tự do g.',
        choices: [
          { id: 'ct_1', label: 'P = m * g' },
          { id: 'ct_2', label: 'P = m / g' },
          { id: 'ct_3', label: 'P = g / m' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['ct_1'],
        },
        explain:
          'Trọng lượng P bằng khối lượng m nhân với gia tốc g: P = mg. P là lực (đơn vị N), khác khối lượng m (đơn vị kg) — nhầm hai đại lượng này là lỗi rất phổ biến.',
      },
      {
        prompt: 'Chiều của lực căng dây tác dụng lên vật có đặc điểm gì?',
        choices: [
          { id: 'huong_vao', label: 'Hướng dọc theo dây vào phía trong sợi dây' },
          { id: 'huong_ra', label: 'Hướng vuông góc với sợi dây' },
          { id: 'tuy_y', label: 'Hướng ngẫu nhiên' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['huong_vao'],
        },
        explain:
          'Lực căng dây luôn hướng dọc theo sợi dây và hướng vào trong để co kéo chống lại lực kéo dãn.',
      },
      {
        // Câu bẫy: nhầm khối lượng với trọng lượng — lỗi sai phổ biến nhất của cả chương.
        prompt:
          'Một nhà du hành có khối lượng 60 kg trên Trái Đất (g = 10 m/s²) bay lên Mặt Trăng, nơi g_MT = 1,6 m/s². Trên Mặt Trăng, khối lượng và trọng lượng của người đó lần lượt là bao nhiêu?',
        choices: [
          { id: 'ca_hai_giam', label: 'Khối lượng còn 9,6 kg và trọng lượng còn 96 N' },
          { id: 'dung', label: 'Khối lượng vẫn 60 kg, trọng lượng còn 96 N' },
          { id: 'khong_doi', label: 'Khối lượng vẫn 60 kg, trọng lượng vẫn 600 N' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['dung'],
        },
        explain:
          'Khối lượng là lượng chất của cơ thể — bay lên Mặt Trăng người đó không mất đi tế bào nào, nên vẫn 60 kg. ' +
          'Trọng lượng là LỰC hút, phụ thuộc nơi đặt vật: P = m·g_MT = 60 × 1,6 = 96 N (trên Trái Đất là 600 N). ' +
          'Nhầm lẫn xuất phát từ thói quen đời thường gọi "vật nặng 60 kg" — kg là đơn vị của khối lượng, không phải của lực; ' +
          'còn cái "nhẹ bẫng" khi đi trên Mặt Trăng là do trọng lượng giảm, chứ quán tính thì không đổi: đẩy một thùng hàng 60 kg trên Mặt Trăng vẫn khó y như trên Trái Đất.',
      },
    ],
    srsCards: [
      {
        hoi: 'Điểm đặt của trọng lực tác dụng lên vật gọi là gì?',
        dap: 'Trọng tâm của vật.',
      },
      {
        hoi: 'Lực căng dây xuất hiện khi nào và hướng ra sao?',
        dap: 'Xuất hiện khi sợi dây bị kéo căng, hướng dọc theo dây hướng vào phía trong sợi dây.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c3-b18',
    // Ma sát nghỉ tự tăng theo lực kéo cho tới ngưỡng, rồi tụt xuống thành ma sát trượt khi vật bắt đầu đi.
    animation: {
      title: 'Ma sát nghỉ tăng theo lực kéo rồi nhường chỗ cho ma sát trượt',
      description:
        'Một thùng hàng nằm yên trên sàn, người ta kéo nó bằng lực tăng dần. Mũi tên lực kéo dài dần ra, và mũi tên lực ma sát nghỉ ở phía sau cũng dài đúng bằng nó: hai lực triệt tiêu nhau nên thùng vẫn đứng im dù đang bị kéo. Ma sát nghỉ không có một giá trị cố định, nó tự điều chỉnh để cân bằng với lực kéo. Đến khi lực kéo vượt ngưỡng 12 N, ma sát nghỉ không giữ nổi nữa: thùng bắt đầu trượt, mũi tên ma sát tụt ngắn lại còn 10 N và giữ nguyên độ dài đó. Từ lúc này lực kéo lớn hơn ma sát trượt nên hợp lực khác không và thùng chuyển động nhanh dần. Đây là lí do đẩy một vật nặng lúc đầu thấy nặng hơn hẳn so với lúc nó đã trôi.',
      viewBoxWidth: 380,
      viewBoxHeight: 200,
      durationMs: 5000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'san',
          x1: 10,
          y1: 150,
          x2: 370,
          y2: 150,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'rect',
          id: 'thung',
          x: 100,
          y: 116,
          w: 52,
          h: 34,
          rx: 3,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: 0 },
            { atMs: 3000, dx: 5.2 },
            { atMs: 3500, dx: 20.8 },
            { atMs: 4000, dx: 46.8 },
            { atMs: 4500, dx: 83.2 },
            { atMs: 5000, dx: 130 },
          ],
        },
        {
          kind: 'arrow',
          id: 'luc-keo',
          x1: 152,
          y1: 132,
          x2: 192,
          y2: 132,
          origin: [152, 132],
          stroke: 'correct',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, scale: 0.5, dx: 0 },
            { atMs: 2500, scale: 2, dx: 0 },
            { atMs: 3000, scale: 2, dx: 5.2 },
            { atMs: 3500, scale: 2, dx: 20.8 },
            { atMs: 4000, scale: 2, dx: 46.8 },
            { atMs: 4500, scale: 2, dx: 83.2 },
            { atMs: 5000, scale: 2, dx: 130 },
          ],
        },
        {
          kind: 'arrow',
          id: 'luc-ma-sat',
          x1: 100,
          y1: 132,
          x2: 60,
          y2: 132,
          origin: [100, 132],
          stroke: 'danger',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, scale: 0.5, dx: 0 },
            { atMs: 2500, scale: 2, dx: 0 },
            { atMs: 2700, scale: 1.667, dx: 2.08 },
            { atMs: 3000, scale: 1.667, dx: 5.2 },
            { atMs: 3500, scale: 1.667, dx: 20.8 },
            { atMs: 4000, scale: 1.667, dx: 46.8 },
            { atMs: 4500, scale: 1.667, dx: 83.2 },
            { atMs: 5000, scale: 1.667, dx: 130 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-keo',
          x: 158,
          y: 110,
          text: 'Lực kéo F',
          size: 12,
          anchor: 'start',
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: 0 },
            { atMs: 3000, dx: 5.2 },
            { atMs: 3500, dx: 20.8 },
            { atMs: 4000, dx: 46.8 },
            { atMs: 4500, dx: 83.2 },
            { atMs: 5000, dx: 130 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-msn',
          x: 94,
          y: 110,
          text: 'Ma sát',
          size: 12,
          anchor: 'end',
          fill: 'muted',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: 0 },
            { atMs: 3000, dx: 5.2 },
            { atMs: 3500, dx: 20.8 },
            { atMs: 4000, dx: 46.8 },
            { atMs: 4500, dx: 83.2 },
            { atMs: 5000, dx: 130 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-1',
          x: 10,
          y: 30,
          text: 'Giai đoạn 1: ma sát nghỉ luôn bằng lực kéo → thùng đứng im',
          size: 13,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-2',
          x: 10,
          y: 52,
          text: 'Vượt ngưỡng 12 N: thùng trượt, ma sát trượt 10 N không đổi',
          size: 13,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-3',
          x: 10,
          y: 180,
          text: 'Vì thế lúc đầu đẩy thấy nặng, khi vật đã trôi thì nhẹ hơn',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Bắt đầu kéo nhẹ: ma sát nghỉ cũng nhỏ, thùng đứng yên.' },
        { atMs: 1500, text: 'Kéo mạnh hơn: ma sát nghỉ tăng theo đúng bằng lực kéo.' },
        { atMs: 2700, text: 'Vượt ngưỡng: ma sát tụt xuống còn 10 N, thùng bắt đầu trượt.' },
      ],
    },
    grade: '10',
    chapterNumber: 3,
    chapterTitle: 'Động lực học',
    lessonNumber: 18,
    title: 'Lực ma sát',
    hook:
      'Nếu không có lực ma sát, bạn sẽ không thể bước đi mà sẽ trượt ngã ngay lập tức, lốp xe ô tô sẽ quay tít tại chỗ và ' +
      'mọi đinh vít sẽ tuột khỏi tường. Lực ma sát xuất hiện như thế nào?',
    theory:
      'KHÁI NIỆM LỰC MA SÁT TRƯỢT:\n' +
      '— Xuất hiện ở mặt tiếp xúc khi một vật trượt trên bề mặt của vật khác, có hướng ngược hướng chuyển động trượt.\n\n' +
      'CÔNG THỨC LỰC MA SÁT TRƯỢT:\n' +
      '— F_mst = μ_t.N (μ_t là hệ số ma sát trượt; N là độ lớn áp lực / phản lực vuông góc của bề mặt tác dụng lên vật).\n' +
      '  — Hệ số ma sát trượt μ_t: Không có đơn vị, phụ thuộc vào bản chất và tình trạng của hai bề mặt tiếp xúc (độ nhám, chất liệu).\n\n' +
      'LỰC MA SÁT NGHỈ (STATIC FRICTION):\n' +
      '— Xuất hiện ở mặt tiếp xúc khi vật chịu lực tác dụng song song mặt tiếp xúc nhưng chưa chuyển động. Có xu hướng giữ vật đứng yên.\n' +
      '— Độ lớn lực ma sát nghỉ bằng độ lớn của lực kéo song song mặt tiếp xúc (F_msn = F_keo). Ma sát nghỉ cực đại lớn hơn ma sát trượt một chút.',
    workedExample: {
      problem:
        'Một thùng hàng khối lượng 20 kg được đẩy trượt đều trên sàn nhà nằm ngang bởi một lực kéo nằm ngang. ' +
        'Biết hệ số ma sát trượt giữa thùng và sàn là μ_t = 0,25. Lấy g = 10 m/s². Tính lực kéo của người đẩy.',
      steps: [
        'Xác định các lực tác dụng lên thùng hàng: Lực kéo F_k, Lực ma sát trượt F_mst, Trọng lực P, Phản lực vuông góc N của sàn.',
        'Vì sàn nằm ngang và chuyển động theo phương ngang nên theo phương thẳng đứng vật cân bằng: N = P = m.g = 20 * 10 = 200 (N).',
        'Tính lực ma sát trượt: F_mst = μ_t.N = 0,25 * 200 = 50 (N).',
        'Vì thùng hàng trượt đều (gia tốc a = 0) nên theo phương ngang lực kéo cân bằng với lực ma sát: F_k = F_mst = 50 (N).',
      ],
      answer: 'F_keo = 50 N',
    },
    checkQuestions: [
      {
        prompt:
          'Viết công thức tính độ lớn lực ma sát trượt F_mst phụ thuộc vào hệ số ma sát μ_t và áp lực N.',
        choices: [
          { id: 'ct_1', label: 'F_mst = μ_t * N' },
          { id: 'ct_2', label: 'F_mst = μ_t / N' },
          { id: 'ct_3', label: 'F_mst = N / μ_t' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['ct_1'],
        },
        explain:
          'Lực ma sát trượt tỉ lệ thuận với độ lớn của áp lực N thông qua hệ số ma sát trượt μ_t.',
      },
      {
        prompt:
          'Một khúc gỗ khối lượng 10 kg bị đẩy trên sàn ngang dưới áp lực vuông góc lên sàn là N = 100 N. Hệ số ma sát trượt giữa gỗ và sàn là 0,3. Tính lực ma sát trượt tác dụng lên khúc gỗ.',
        answer: {
          kind: 'numeric',
          value: 30,
          unit: 'N',
        },
        explain:
          'Lực ma sát trượt tỉ lệ với ÁP LỰC vuông góc lên mặt tiếp xúc, không phụ thuộc diện tích tiếp xúc hay tốc độ trượt: F_mst = μ_t * N = 0,3 * 100 = 30 N. Đề đã cho sẵn N = 100 N nên dùng thẳng; nếu đề không cho thì mới tính N = m * g.',
      },
    ],
    srsCards: [
      {
        hoi: 'Hướng của lực ma sát trượt như thế nào so với hướng chuyển động trượt của vật?',
        dap: 'Ngược hướng với hướng chuyển động trượt của vật.',
      },
      {
        hoi: 'Hệ số ma sát trượt phụ thuộc vào yếu tố nào?',
        dap: 'Phụ thuộc vào vật liệu cấu tạo và tình trạng nhẵn hay nhám của hai bề mặt tiếp xúc.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c3-b19',
    // Rơi trong không khí: lực cản lớn dần tới khi bằng trọng lực thì vật rơi ĐỀU — tốc độ giới hạn.
    animation: {
      title: 'Lực cản lớn dần và tốc độ giới hạn',
      description:
        'Một vật rơi trong không khí. Mũi tên trọng lực hướng xuống giữ nguyên độ dài suốt cảnh vì trọng lực không phụ thuộc tốc độ. Mũi tên lực cản hướng lên lúc đầu rất ngắn, rồi dài dần ra theo tốc độ rơi. Nhìn các khoảng dịch chuyển của vật: lúc đầu chúng dài ra nhanh (rơi nhanh dần), sau đó dài ra chậm lại và cuối cùng bằng nhau. Đó là thời điểm lực cản đã tăng tới bằng đúng trọng lực: hợp lực bằng không, gia tốc bằng không, vật rơi THẲNG ĐỀU với một tốc độ không đổi gọi là tốc độ giới hạn. Vật vẫn đang đi xuống dù hợp lực bằng không — hợp lực bằng không chỉ có nghĩa là vận tốc không đổi, chứ không có nghĩa là đứng yên. Đây là lí do người nhảy dù rơi với tốc độ an toàn gần như không đổi.',
      viewBoxWidth: 260,
      viewBoxHeight: 380,
      durationMs: 5000,
      loop: true,
      shapes: [
        {
          kind: 'circle',
          id: 'vat-roi',
          cx: 90,
          cy: 80,
          r: 14,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dy: 0.0 },
            { atMs: 500, dy: 6.3 },
            { atMs: 1000, dy: 21.7 },
            { atMs: 1500, dy: 41.2 },
            { atMs: 2000, dy: 62.0 },
            { atMs: 2500, dy: 83.2 },
            { atMs: 3000, dy: 104.5 },
            { atMs: 3500, dy: 125.9 },
            { atMs: 4000, dy: 147.3 },
            { atMs: 4500, dy: 168.6 },
            { atMs: 5000, dy: 190.0 },
          ],
        },
        {
          kind: 'arrow',
          id: 'trong-luc',
          x1: 90,
          y1: 96,
          x2: 90,
          y2: 144,
          stroke: 'danger',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, dy: 0.0 },
            { atMs: 500, dy: 6.3 },
            { atMs: 1000, dy: 21.7 },
            { atMs: 1500, dy: 41.2 },
            { atMs: 2000, dy: 62.0 },
            { atMs: 2500, dy: 83.2 },
            { atMs: 3000, dy: 104.5 },
            { atMs: 3500, dy: 125.9 },
            { atMs: 4000, dy: 147.3 },
            { atMs: 4500, dy: 168.6 },
            { atMs: 5000, dy: 190.0 },
          ],
        },
        {
          kind: 'arrow',
          id: 'luc-can',
          x1: 90,
          y1: 64,
          x2: 90,
          y2: 16,
          origin: [90, 64],
          stroke: 'accent',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, dy: 0.0, scale: 0.02 },
            { atMs: 500, dy: 6.3, scale: 0.308 },
            { atMs: 1000, dy: 21.7, scale: 0.72 },
            { atMs: 1500, dy: 41.2, scale: 0.91 },
            { atMs: 2000, dy: 62.0, scale: 0.973 },
            { atMs: 2500, dy: 83.2, scale: 0.992 },
            { atMs: 3000, dy: 104.5, scale: 0.998 },
            { atMs: 3500, dy: 125.9, scale: 0.999 },
            { atMs: 4000, dy: 147.3, scale: 1.0 },
            { atMs: 4500, dy: 168.6, scale: 1.0 },
            { atMs: 5000, dy: 190.0, scale: 1.0 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-p',
          x: 100,
          y: 124,
          text: 'P',
          size: 13,
          anchor: 'start',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, dy: 0.0 },
            { atMs: 500, dy: 6.3 },
            { atMs: 1000, dy: 21.7 },
            { atMs: 1500, dy: 41.2 },
            { atMs: 2000, dy: 62.0 },
            { atMs: 2500, dy: 83.2 },
            { atMs: 3000, dy: 104.5 },
            { atMs: 3500, dy: 125.9 },
            { atMs: 4000, dy: 147.3 },
            { atMs: 4500, dy: 168.6 },
            { atMs: 5000, dy: 190.0 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-fc',
          x: 100,
          y: 60,
          text: 'F cản',
          size: 13,
          anchor: 'start',
          fill: 'accent',
          keyframes: [
            { atMs: 0, dy: 0.0 },
            { atMs: 500, dy: 6.3 },
            { atMs: 1000, dy: 21.7 },
            { atMs: 1500, dy: 41.2 },
            { atMs: 2000, dy: 62.0 },
            { atMs: 2500, dy: 83.2 },
            { atMs: 3000, dy: 104.5 },
            { atMs: 3500, dy: 125.9 },
            { atMs: 4000, dy: 147.3 },
            { atMs: 4500, dy: 168.6 },
            { atMs: 5000, dy: 190.0 },
          ],
        },
        {
          kind: 'label',
          id: 'chu-giai-fc',
          x: 124,
          y: 22,
          text: 'F cản tăng theo tốc độ',
          size: 12,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'chu-giai-p',
          x: 124,
          y: 40,
          text: 'P không đổi',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-gd1',
          x: 150,
          y: 150,
          text: 'rơi nhanh dần',
          size: 12,
          anchor: 'start',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-gd2',
          x: 150,
          y: 290,
          text: 'rơi đều: F cản = P',
          size: 12,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-kl',
          x: 14,
          y: 352,
          text: 'Hợp lực bằng 0 nghĩa là vận tốc không đổi,',
          size: 11,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-kl-2',
          x: 14,
          y: 368,
          text: 'không có nghĩa là đứng yên',
          size: 11,
          anchor: 'start',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Vừa thả: tốc độ nhỏ nên lực cản gần như chưa có.' },
        { atMs: 1000, text: 'Tốc độ tăng, lực cản dài dần ra và gia tốc nhỏ lại.' },
        { atMs: 2500, text: 'Lực cản bằng trọng lực: vật rơi đều ở tốc độ giới hạn.' },
      ],
    },
    grade: '10',
    chapterNumber: 3,
    chapterTitle: 'Động lực học',
    lessonNumber: 19,
    title: 'Lực cản và lực nâng',
    hook:
      'Tại sao khi nhảy dù, dù mở ra lại giúp người nhảy rơi xuống rất chậm và an toàn thay vì lao thẳng xuống đất? ' +
      'Đó là nhờ lực cản của không khí — một dạng lực cản chất lưu bảo vệ chúng ta.',
    theory:
      'LỰC CẢN CỦA CHẤT LƯU (FLUID RESISTANCE):\n' +
      '— Khi một vật chuyển động trong chất lưu (chất khí hoặc chất lỏng), nó luôn chịu một lực cản ngược hướng chuyển động.\n' +
      '— Lực cản phụ thuộc vào: Vận tốc của vật (tốc độ càng nhanh lực cản càng lớn), hình dạng vật (thân thuôn dài, mũi vuốt nhọn thì lực cản nhỏ), kích thước diện tích cản, và độ nhớt của chất lưu.\n\n' +
      'VẬN TỐC GIỚI HẠN (TERMINAL VELOCITY):\n' +
      '— Khi vật rơi trong chất lưu, vận tốc tăng dần làm lực cản tăng dần. Đến khi lực cản bằng trọng lực, hợp lực bằng 0 → Vật chuyển động thẳng đều với vận tốc không đổi gọi là vận tốc giới hạn.\n\n' +
      'LỰC NÂNG CỦA CHẤT LƯU (LIFT FORCE):\n' +
      '— Khi vật chuyển động trong chất lưu, có thể xuất hiện lực vuông góc với hướng chuyển động, có tác dụng nâng vật lên ' +
      '(ví dụ: lực nâng của không khí lên cánh máy bay, lực nâng của nước lên cánh lái tàu ngầm).\n' +
      '— Chú ý phân biệt: lực nâng này chỉ có khi vật CHUYỂN ĐỘNG trong chất lưu, khác hẳn lực đẩy Archimedes — ' +
      'lực đẩy Archimedes có cả khi vật nằm yên và do chênh lệch áp suất theo độ sâu gây ra.',
    workedExample: {
      problem:
        'Giải thích tại sao các dòng xe ô tô hiện đại hoặc máy bay siêu thanh luôn được thiết kế có mũi vuốt nhọn, ' +
        'thân thuôn dài về phía sau (kiểu dáng khí động học).',
      steps: [
        'Khi di chuyển ở vận tốc cao, lực cản không khí tác dụng lên xe tăng rất nhanh theo bình phương vận tốc.',
        'Thân thuôn dài, mũi vuốt nhọn giúp luồng không khí lướt nhẹ quanh thân vật mà không bị chặn lại đột ngột.',
        'Thiết kế này giúp giảm thiểu lực cản chất lưu, tiết kiệm nhiên liệu và tăng tốc độ tối đa cho phương tiện.',
      ],
      answer: 'Thiết kế khí động học thuôn nhọn để giảm thiểu tối đa lực cản của không khí.',
    },
    checkQuestions: [
      {
        prompt:
          'Lực cản của chất lưu tác dụng lên vật chuyển động sẽ thay đổi thế nào khi tốc độ của vật tăng lên?',
        choices: [
          { id: 'tang', label: 'Lực cản tăng lên' },
          { id: 'giam', label: 'Lực cản giảm đi' },
          { id: 'khong_doi', label: 'Lực cản giữ nguyên không đổi' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['tang'],
        },
        explain:
          'Tốc độ càng nhanh vật va đập với phân tử chất lưu càng mạnh làm lực cản chất lưu tăng lên.',
      },
      {
        prompt:
          'Lực hướng thẳng đứng từ dưới lên giúp nâng cánh máy bay khi chuyển động trong không khí gọi là lực gì?',
        choices: [
          { id: 'luc_nang', label: 'Lực nâng của chất lưu' },
          { id: 'luc_ma_sat', label: 'Lực ma sát trượt' },
          { id: 'luc_dan_hoi', label: 'Lực đàn hồi của cánh' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['luc_nang'],
        },
        explain:
          'Sự chênh lệch áp suất không khí giữa mặt trên và dưới cánh tạo ra lực nâng hướng thẳng đứng lên.',
      },
    ],
    srsCards: [
      {
        hoi: 'Chất lưu là gì trong Vật lí?',
        dap: 'Là thuật ngữ chung chỉ chất khí và chất lỏng (những chất có thể chảy).',
      },
      {
        hoi: 'Hiện tượng vận tốc giới hạn xảy ra khi nào?',
        dap: 'Khi lực cản của chất lưu tăng lên đúng bằng trọng lực, hợp lực bằng 0 nên vật rơi thẳng đều.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c3-b20',
    grade: '10',
    chapterNumber: 3,
    chapterTitle: 'Động lực học',
    lessonNumber: 20,
    title: 'Một số ví dụ về cách giải các bài toán thuộc phần động lực học',
    hook:
      'Làm thế nào để tìm gia tốc của một chiếc hộp gỗ đang trượt xuống một dốc nghiêng có ma sát? ' +
      'Hãy học phương pháp sơ đồ phân tích lực — công cụ mạnh mẽ nhất để giải mọi bài toán cơ học.',
    theory:
      'PHƯƠNG PHÁP ĐỘNG LỰC HỌC (free-body diagram):\n' +
      '1. Chọn vật nghiên cứu, vẽ hệ trục toạ độ Đề-các thích hợp (thường Ox trùng hướng chuyển động, Oy vuông góc).\n' +
      '2. Xác định và vẽ tất cả các lực tác dụng lên vật (Trọng lực P, Phản lực N, Ma sát F_ms, Lực kéo F_k).\n' +
      '3. Viết phương trình Định luật 2 Newton dạng vectơ: vectơ F_hl = m.vectơ a.\n' +
      '4. Chiếu phương trình vectơ lên hai trục toạ độ Ox và Oy để thu được hệ phương trình đại số:\n' +
      '   — Trục Ox (Chuyển động): F_x = m.a.\n' +
      '   — Trục Oy (Cân bằng dọc): F_y = 0.\n' +
      '5. Giải hệ phương trình để tìm các đại lượng cần thiết.',
    workedExample: {
      problem:
        'Một vật khối lượng m = 2 kg trượt từ trạng thái nghỉ xuống một mặt phẳng nghiêng góc α = 30° so với phương ngang. ' +
        'Bỏ qua ma sát. Lấy g = 10 m/s². Tính gia tốc của vật.',
      steps: [
        'Vật chịu tác dụng của Trọng lực vectơ P và Phản lực vectơ N vuông góc mặt nghiêng.',
        'Chọn trục Ox dọc theo mặt nghiêng hướng xuống, Oy vuông góc mặt nghiêng hướng lên.',
        'Viết phương trình định luật 2 Newton: vectơ P + vectơ N = m.vectơ a.',
        'Chiếu lên Oy: N - P_y = 0 => N = P.cos α = m.g.cos α.',
        'Chiếu lên Ox: P_x = m.a => P.sin α = m.a => m.g.sin α = m.a.',
        'Rút gọn m ở hai vế, ta được gia tốc: a = g.sin α = 10 * sin 30° = 10 * 0,5 = 5 (m/s²).',
      ],
      answer: 'a = 5 m/s²',
    },
    checkQuestions: [
      {
        prompt:
          'Một vật khối lượng 5 kg trượt xuống mặt phẳng nghiêng góc 30 độ không ma sát. Tính gia tốc trượt của vật (lấy g = 10 m/s²).',
        answer: {
          kind: 'numeric',
          value: 5,
          unit: 'm/s^2',
        },
        explain:
          'Chiếu định luật 2 Newton lên phương mặt nghiêng: thành phần trọng lực dọc mặt nghiêng là m * g * sinα, chia cho m thì m triệt tiêu, còn a = g * sin(30°) = 10 * 0,5 = 5 m/s². Khối lượng 5 kg KHÔNG có mặt trong kết quả — khi không ma sát, mọi vật đều trượt với cùng gia tốc.',
      },
      {
        prompt:
          'Khi một vật nằm yên trên mặt phẳng nghiêng góc α, độ lớn phản lực N của mặt phẳng nghiêng tác dụng lên vật bằng bao nhiêu?',
        choices: [
          { id: 'cos', label: 'N = m * g * cos α' },
          { id: 'sin', label: 'N = m * g * sin α' },
          { id: 'mg', label: 'N = m * g' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['cos'],
        },
        explain:
          'Chiếu các lực lên phương vuông góc mặt nghiêng: N cân bằng với thành phần P_y = mg*cos α, nên N = mg*cos α. ' +
          'Thành phần mg*sin α nằm DỌC mặt nghiêng (nó gây trượt), còn N = mg chỉ đúng khi mặt nằm ngang (α = 0°).',
      },
    ],
    srsCards: [
      {
        hoi: 'Nêu hai bước chiếu lực quan trọng nhất khi giải bài toán động lực học phẳng?',
        dap: 'Chiếu lên Oy để tìm phản lực N (từ đó tính ma sát), chiếu lên Ox để tìm gia tốc a.',
      },
      {
        hoi: 'Gia tốc của một vật trượt xuống dốc nghiêng góc α không ma sát phụ thuộc vào những đại lượng nào?',
        dap: 'Chỉ phụ thuộc vào góc nghiêng α và gia tốc g (a = g.sin α), không phụ thuộc khối lượng vật.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c3-b21',
    // Bập bênh: lực nhỏ ở cánh tay dài cân bằng được lực lớn ở cánh tay ngắn — moment mới là thứ phải bằng nhau.
    animation: {
      title: 'Cân bằng bập bênh: cái phải bằng nhau là moment',
      description:
        'Một thanh cứng đặt trên trục quay ở giữa. Lúc đầu chỉ có vật 200 N treo ở bên trái, cách trục 0,5 m, nên thanh nghiêng hẳn xuống bên trái. Sau đó đặt thêm một vật chỉ 100 N ở bên phải nhưng xa trục hơn, cách trục 1 m — thanh từ từ quay trở lại nằm ngang và đứng cân bằng, dù hai lực chênh nhau gấp đôi. Lí do: tác dụng làm quay không đo bằng độ lớn lực mà bằng moment lực M = F × d, tích của lực với cánh tay đòn. Bên trái có M = 200 × 0,5 = 100 N·m, bên phải có M = 100 × 1 = 100 N·m. Hai moment ngược chiều và bằng nhau nên thanh không quay. Muốn nâng vật nặng bằng lực nhỏ thì kéo dài cánh tay đòn ra — đó cũng là nguyên lí của đòn bẩy, cờ lê và kìm.',
      viewBoxWidth: 360,
      viewBoxHeight: 210,
      durationMs: 4500,
      loop: true,
      shapes: [
        {
          kind: 'polyline',
          id: 'tru-do',
          points: [
            [180, 140],
            [158, 178],
            [202, 178],
          ],
          closed: true,
          fill: 'neutral',
        },
        {
          kind: 'line',
          id: 'mat-dat',
          x1: 30,
          y1: 178,
          x2: 330,
          y2: 178,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'rect',
          id: 'thanh',
          x: 60,
          y: 132,
          w: 240,
          h: 9,
          rx: 4,
          fill: 'primary',
          keyframes: [
            { atMs: 0, rotate: -11 },
            { atMs: 1200, rotate: -11 },
            { atMs: 2600, rotate: 0 },
            { atMs: 4500, rotate: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'vat-trai',
          cx: 120,
          cy: 116,
          r: 17,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dy: 12 },
            { atMs: 1200, dy: 12 },
            { atMs: 2600, dy: 0 },
            { atMs: 4500, dy: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'vat-phai',
          cx: 300,
          cy: 122,
          r: 12,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dy: -23 },
            { atMs: 1200, opacity: 1, dy: -23 },
            { atMs: 2600, opacity: 1, dy: 0 },
            { atMs: 4500, opacity: 1, dy: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'canh-trai',
          x1: 120,
          y1: 156,
          x2: 180,
          y2: 156,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '4 3',
        },
        {
          kind: 'line',
          id: 'canh-phai',
          x1: 180,
          y1: 166,
          x2: 300,
          y2: 166,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '4 3',
        },
        {
          kind: 'label',
          id: 'nhan-d1',
          x: 145,
          y: 170,
          text: '0,5 m',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-d2',
          x: 240,
          y: 162,
          text: '1 m',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-f1',
          x: 120,
          y: 92,
          text: '200 N',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
          keyframes: [
            { atMs: 0, dy: 12 },
            { atMs: 1200, dy: 12 },
            { atMs: 2600, dy: 0 },
            { atMs: 4500, dy: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-f2',
          x: 300,
          y: 102,
          text: '100 N',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
          keyframes: [
            { atMs: 0, opacity: 0, dy: -23 },
            { atMs: 1200, opacity: 1, dy: -23 },
            { atMs: 2600, opacity: 1, dy: 0 },
            { atMs: 4500, opacity: 1, dy: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-m',
          x: 18,
          y: 30,
          text: 'M = F × d : 200 × 0,5 = 100 × 1 = 100 N·m',
          size: 14,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-kl',
          x: 18,
          y: 52,
          text: 'Cân bằng khi hai moment ngược chiều bằng nhau',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Chỉ có vật 200 N bên trái: thanh nghiêng xuống bên trái.' },
        { atMs: 1200, text: 'Đặt vật 100 N ở bên phải, xa trục gấp đôi.' },
        { atMs: 2600, text: 'Thanh nằm ngang: lực nhỏ hơn nhưng moment bằng nhau.' },
      ],
    },
    grade: '10',
    chapterNumber: 3,
    chapterTitle: 'Động lực học',
    lessonNumber: 21,
    title: 'Moment lực. Cân bằng của vật rắn',
    hook:
      'Tại sao khi mở cửa, ta luôn đẩy ở tay nắm sát mép ngoài cánh cửa thay vì đẩy ở gần bản lề? ' +
      'Hiệu quả làm quay của lực không chỉ phụ thuộc vào độ mạnh của lực mà còn phụ thuộc vào một khoảng cách đặc biệt.',
    theory:
      'MOMENT LỰC (TORQUE):\n' +
      '— Moment lực là đại lượng đặc trưng cho tác dụng làm quay của lực và được đo bằng tích của lực với cánh tay đòn của nó.\n' +
      '— Công thức: M = F.d.\n' +
      '  — F: Độ lớn lực tác dụng (N).\n' +
      '  — d (Cánh tay đòn): Khoảng cách từ trục quay đến giá của lực (m).\n' +
      '— Đơn vị trong hệ SI: Newton mét (N.m).\n\n' +
      'QUY TẮC MOMENT LỰC (ĐIỀU KIỆN CÂN BẰNG CỦA VẬT CÓ TRỤC QUAY CỐ ĐỊNH):\n' +
      '— Một vật có trục quay cố định ở trạng thái cân bằng khi tổng các moment lực có xu hướng làm vật quay theo chiều kim đồng hồ bằng tổng các moment lực có xu hướng làm vật quay ngược chiều kim đồng hồ:\n' +
      '  — Σ M_thuan = Σ M_nguoc.\n' +
      '— Quy tắc này còn áp dụng cho cả vật không có trục quay cố định nếu xuất hiện trục quay tạm thời.',
    workedExample: {
      problem:
        'Một thanh chắn đường dài 2 m có trục quay nằm ngang đi qua một đầu thanh. Đầu kia chịu tác dụng của một lực kéo vuông góc F = 15 N. ' +
        'Tính moment lực làm quay thanh chắn này.',
      steps: [
        'Xác định lực tác dụng F = 15 N.',
        'Vì lực kéo vuông góc với thanh chắn tại đầu tự do, nên cánh tay đòn d chính bằng chiều dài thanh chắn: d = 2 m.',
        'Áp dụng công thức tính moment lực: M = F.d = 15 * 2 = 30 (N.m).',
      ],
      answer: 'M = 30 N.m',
    },
    checkQuestions: [
      {
        prompt: 'Viết công thức tính moment lực M phụ thuộc vào lực F và cánh tay đòn d.',
        choices: [
          { id: 'ct_1', label: 'M = F * d' },
          { id: 'ct_2', label: 'M = F / d' },
          { id: 'ct_3', label: 'M = d / F' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['ct_1'],
        },
        explain:
          'Moment lực bằng tích lực nhân cánh tay đòn: M = F*d. Cánh tay đòn d là khoảng cách VUÔNG GÓC từ trục quay đến giá của lực, không phải khoảng cách bất kì đến điểm đặt lực.',
      },
      {
        prompt: 'Đơn vị đo chuẩn của moment lực trong hệ SI là gì?',
        choices: [
          { id: 'don_vi', label: 'N.m' },
          { id: 'don_vi_sai', label: 'N/m' },
          { id: 'don_vi_j', label: 'J/s' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['don_vi'],
        },
        explain: 'Lực đo bằng N, cánh tay đòn đo bằng m nên đơn vị của tích là N.m.',
      },
    ],
    srsCards: [
      {
        hoi: 'Cánh tay đòn d của lực là gì?',
        dap: 'Là khoảng cách vuông góc từ trục quay đến giá của lực.',
      },
      {
        hoi: 'Phát biểu quy tắc moment lực cho vật có trục quay cố định?',
        dap: 'Vật cân bằng khi tổng moment lực làm quay cùng chiều kim đồng hồ bằng tổng moment làm quay ngược chiều kim đồng hồ.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly10-c3-b22',
    grade: '10',
    chapterNumber: 3,
    chapterTitle: 'Động lực học',
    lessonNumber: 22,
    title: 'Thực hành: Tổng hợp lực',
    hook:
      'Làm thế nào để chứng minh quy tắc hình bình hành lực không chỉ là lí thuyết trên giấy? ' +
      'Hãy dùng các lực kế thực tế và vẽ bản đồ lực để tự mình kiểm chứng định luật Vật lí cơ bản này.',
    theory:
      'NGUYÊN TẮC THỰC HÀNH TỔNG HỢP LỰC:\n' +
      '— Mắc hai lực kế đo hai lực thành phần vectơ F₁ và vectơ F₂ đồng quy tác dụng lên một chiếc vòng nhỏ đặt phẳng làm điểm đồng quy.\n' +
      '— Mắc lực kế thứ ba đo lực đối cân bằng vectơ F₃ sao cho vòng nhẫn đứng yên hoàn toàn ở tâm.\n' +
      '— Khi vòng nhẫn cân bằng: vectơ F₁ + vectơ F₂ + vectơ F₃ = vectơ 0 => vectơ F₁ + vectơ F₂ = - vectơ F₃.\n' +
      '— Vẽ các vectơ lực lên giấy theo đúng tỉ lệ độ lớn và hướng thực tế, dựng hình bình hành để đối chiếu đường chéo hợp lực vectơ F_hl của F₁ và F₂ với vectơ đối của F₃.\n\n' +
      'ĐIỀU KIỆN ĐẠT ĐỘ CHÍNH XÁC CAO:\n' +
      '— Đặt các lực kế nằm phẳng trên mặt bảng để tránh sai số trọng lượng bản thân lực kế.\n' +
      '— Đọc số chỉ lực kế theo hướng nhìn vuông góc với mặt số.',
    workedExample: {
      problem:
        'Trong thí nghiệm tổng hợp hai lực đồng quy, học sinh thu được độ lớn hai lực thành phần F₁ = 3 N và F₂ = 4 N. ' +
        'Góc giữa hai dây treo đo bằng thước đo góc là 90°. Lực kế thứ ba chỉ giá trị lực cân bằng đối là 5 N. ' +
        'Hãy nhận xét kết quả thực nghiệm.',
      steps: [
        'Theo lí thuyết quy tắc hình bình hành, hai lực vuông góc thì hợp lực F_hl = √(3² + 4²) = 5 N.',
        'Kết quả đo từ lực kế thứ ba chỉ 5 N (hướng ngược lại để cân bằng).',
        'So sánh thấy F_hl lí thuyết bằng đúng F₃ thực tế đo được, chứng tỏ quy tắc hình bình hành hoàn toàn chính xác trong phạm vi sai số cho phép.',
      ],
      answer: 'Quy tắc hình bình hành lực được thực nghiệm kiểm chứng chính xác.',
    },
    checkQuestions: [
      {
        prompt:
          'Dụng cụ thí nghiệm nào dùng để đo độ lớn của lực trực tiếp trong bài thực hành tổng hợp lực?',
        choices: [
          { id: 'luc_ke', label: 'Lực kế (Dynamometer)' },
          { id: 'nhiet_ke', label: 'Nhiệt kế' },
          { id: 'ampe_ke', label: 'Ampe kế' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['luc_ke'],
        },
        explain: 'Lực kế lò xo là dụng cụ chuyên dụng đo độ lớn của lực trực tiếp.',
      },
      {
        prompt:
          'Khi thực hiện thí nghiệm tổng hợp lực trên mặt phẳng nằm ngang, hợp lực tối đa có thể thu được của hai lực kế chỉ 3 N và 4 N bằng bao nhiêu?',
        answer: {
          kind: 'numeric',
          value: 7,
          unit: 'N',
        },
        explain: 'Hợp lực đạt cực đại khi hai lực cùng chiều: F_max = F_1 + F_2 = 3 + 4 = 7 N.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tại sao cần đặt các lực kế nằm ngang sát mặt bảng khi làm thí nghiệm?',
        dap: 'Để loại bỏ ảnh hưởng trọng lượng bản thân của lực kế lên kết quả đo.',
      },
      {
        hoi: 'Khi vòng nhẫn cân bằng dưới tác dụng của 3 lực kế, mối quan hệ vectơ giữa chúng là gì?',
        dap: 'Tổng vectơ F₁ + F₂ + F₃ = vectơ 0.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
