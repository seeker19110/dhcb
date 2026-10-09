// lessons/toan11c2.ts — Toán 11, Chương 2: Dãy số, cấp số cộng và cấp số nhân.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN11_C2_LESSONS: MathLesson[] = [
  {
    id: 'toan11-c2-b1',
    grade: '11',
    chapterNumber: 2,
    chapterTitle: 'Dãy số. Cấp số cộng và cấp số nhân',
    lessonNumber: 1,
    title: 'Cấp số cộng và cấp số nhân',
    hook:
      'Hai người bạn cùng gửi tiết kiệm 10 triệu đồng. Người thứ nhất mỗi năm được cộng thêm 1 triệu tiền lãi cố ' +
      'định. Người thứ hai gửi lãi kép 8% một năm, năm đầu chỉ được 800 nghìn — ít hơn hẳn. Sau 30 năm, ai nhiều ' +
      'tiền hơn? Đáp số chênh nhau tới hàng chục triệu, và lý do nằm ở sự khác biệt giữa CỘNG và NHÂN.',
    theory:
      'CẤP SỐ CỘNG (arithmetic progression)\n' +
      'Dãy (uₙ) là cấp số cộng khi mỗi số hạng bằng số hạng trước CỘNG thêm một hằng số d gọi là công sai: ' +
      'u₍ₙ₊₁₎ = uₙ + d.\n' +
      '— Số hạng tổng quát: uₙ = u₁ + (n − 1)d. Chú ý hệ số là (n − 1) chứ không phải n, vì từ u₁ đến uₙ ta chỉ cộng ' +
      'd đúng n − 1 lần.\n' +
      '— Tổng n số hạng đầu: Sₙ = n(u₁ + uₙ)/2 = n[2u₁ + (n−1)d]/2.\n' +
      'VÌ SAO CÓ CÔNG THỨC TỔNG ẤY: viết tổng hai lần, một lần xuôi một lần ngược rồi cộng lại theo cột. Mỗi cột đều ' +
      'cho u₁ + uₙ, có n cột, nên 2Sₙ = n(u₁ + uₙ). Đây chính là mẹo mà Gauss dùng khi còn bé để cộng 1 đến 100.\n' +
      '— Tính chất ba số liên tiếp: 2uₖ = u₍ₖ₋₁₎ + u₍ₖ₊₁₎ (mỗi số là trung bình CỘNG của hai số kề).\n\n' +
      'CẤP SỐ NHÂN (geometric progression)\n' +
      'Mỗi số hạng bằng số hạng trước NHÂN với hằng số q gọi là công bội: u₍ₙ₊₁₎ = uₙ · q, với u₁ ≠ 0 và q ≠ 0.\n' +
      '— Số hạng tổng quát: uₙ = u₁ · qⁿ⁻¹.\n' +
      '— Tổng n số hạng đầu: Sₙ = u₁(1 − qⁿ)/(1 − q) khi q ≠ 1; khi q = 1 thì Sₙ = n·u₁.\n' +
      'ĐIỀU KIỆN q ≠ 1 LÀ BẮT BUỘC — dùng công thức phân số khi q = 1 sẽ chia cho 0. Đây là chỗ mất điểm thường gặp ' +
      'trong bài có tham số.\n' +
      '— Tính chất ba số liên tiếp: uₖ² = u₍ₖ₋₁₎ · u₍ₖ₊₁₎.\n\n' +
      'SỰ KHÁC BIỆT CỐT LÕI GIỮA HAI LOẠI\n' +
      'Cấp số cộng tăng TUYẾN TÍNH (đồ thị là các điểm nằm trên một đường thẳng), cấp số nhân với q > 1 tăng theo ' +
      'HÀM MŨ (càng về sau càng dốc đứng). Trong ngắn hạn cấp số cộng có thể vượt lên, nhưng về dài hạn cấp số nhân ' +
      'luôn bỏ xa — đó là lý do lãi kép được gọi là "kỳ quan thứ tám".\n\n' +
      'CÁCH NHẬN BIẾT MỘT DÃY LÀ CẤP SỐ CỘNG HAY NHÂN\n' +
      'Xét hiệu u₍ₙ₊₁₎ − uₙ: nếu ra một HẰNG SỐ (không phụ thuộc n) thì là cấp số cộng. Xét thương u₍ₙ₊₁₎/uₙ: nếu ra ' +
      'hằng số thì là cấp số nhân. Phải chứng minh cho MỌI n, không được chỉ thử vài số hạng đầu rồi kết luận.',
    animation: {
      title: 'Cấp số cộng và cấp số nhân sau 30 chu kỳ',
      description:
        'Hai dãy điểm được vẽ trên cùng hệ trục. Dãy cấp số cộng nằm trên một đường thẳng, tăng đều mỗi bước một ' +
        'lượng như nhau. Dãy cấp số nhân ban đầu thấp hơn nhưng đường cong của nó mỗi lúc một dốc, cắt qua đường ' +
        'thẳng rồi vọt lên rất cao. Hình minh hoạ vì sao lãi kép thua trong ngắn hạn nhưng thắng áp đảo về dài hạn.',
      viewBoxWidth: 380,
      viewBoxHeight: 240,
      durationMs: 6000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'ox',
          x1: 40,
          y1: 200,
          x2: 360,
          y2: 200,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'oy',
          x1: 40,
          y1: 200,
          x2: 40,
          y2: 20,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'polyline',
          id: 'capSoCong',
          points: [
            [40, 186],
            [100, 164],
            [160, 142],
            [220, 120],
            [280, 98],
            [340, 76],
          ],
          stroke: 'primary',
          strokeWidth: 3,
        },
        {
          kind: 'polyline',
          id: 'capSoNhan',
          points: [
            [40, 190],
            [100, 182],
            [160, 166],
            [220, 136],
            [280, 84],
            [340, 26],
          ],
          stroke: 'accent',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1500, opacity: 0 },
            { atMs: 2600, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'diemCat',
          cx: 252,
          cy: 108,
          r: 6,
          fill: 'warn',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3600, opacity: 0 },
            { atMs: 4400, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhanCong',
          x: 346,
          y: 72,
          text: 'cấp số cộng',
          size: 13,
          anchor: 'end',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhanNhan',
          x: 346,
          y: 22,
          text: 'cấp số nhân',
          size: 13,
          anchor: 'end',
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2600, opacity: 0 },
            { atMs: 3200, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhanN',
          x: 200,
          y: 224,
          text: 'số năm gửi',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
        },
      ],
      captions: [
        { atMs: 0, text: 'Cấp số cộng: mỗi năm cộng thêm đúng một lượng, đồ thị là đường thẳng.' },
        { atMs: 2600, text: 'Cấp số nhân khởi đầu thấp hơn vì lãi năm đầu ít hơn.' },
        { atMs: 4400, text: 'Đến một lúc hai đường cắt nhau — từ đây lãi kép vượt lên.' },
        { atMs: 5200, text: 'Càng về sau khoảng cách càng giãn rộng rất nhanh.' },
      ],
    },
    workedExample: {
      problem:
        'Một cấp số cộng có u₃ = 7 và u₇ = 19. Tìm số hạng đầu u₁, công sai d và tổng 10 số hạng đầu tiên S₁₀.',
      steps: [
        'Bước 1 — Viết hai số hạng theo u₁ và d (chọn cách này vì mọi số hạng đều biểu diễn được qua hai đại lượng ' +
          'ấy): u₃ = u₁ + 2d = 7 và u₇ = u₁ + 6d = 19.',
        'Bước 2 — Trừ hai phương trình để khử u₁: (u₁ + 6d) − (u₁ + 2d) = 19 − 7 ⇔ 4d = 12 ⇔ d = 3. Nhận xét: từ u₃ ' +
          'đến u₇ cách nhau 4 bước nên chênh lệch là 4d, đây là mẹo tính nhanh không cần lập hệ.',
        'Bước 3 — Thay d = 3 vào phương trình đầu: u₁ + 6 = 7 ⇔ u₁ = 1.',
        'Bước 4 — Tính S₁₀ bằng công thức tổng: S₁₀ = 10·[2·1 + 9·3]/2 = 5·(2 + 27) = 5·29 = 145.',
        'Bước 5 — Kiểm tra độc lập: u₁₀ = 1 + 9·3 = 28, và S₁₀ = 10(u₁ + u₁₀)/2 = 10·29/2 = 145. Hai công thức cho ' +
          'cùng kết quả nên đáng tin.',
      ],
      answer: 'u₁ = 1, d = 3, S₁₀ = 145.',
    },
    checkQuestions: [
      {
        prompt: 'Cấp số cộng có u₁ = 5 và công sai d = 4. Số hạng u₁₀ bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 41 },
        explain:
          'u₁₀ = u₁ + (10 − 1)d = 5 + 9·4 = 41. Lỗi rất phổ biến là nhân với 10 thay vì 9, ra 45. Hãy hiểu vì sao là ' +
          '9: để đi từ số hạng thứ nhất tới số hạng thứ mười, ta bước 9 bước chứ không phải 10 bước — giống như từ ' +
          'cột điện số 1 tới cột số 10 chỉ có 9 khoảng cách.',
      },
      {
        prompt: 'Cấp số nhân có u₁ = 3 và công bội q = 2. Tổng 5 số hạng đầu S₅ bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 93 },
        explain:
          'S₅ = u₁(1 − q⁵)/(1 − q) = 3(1 − 32)/(1 − 2) = 3·(−31)/(−1) = 93. Kiểm bằng cách cộng tay: ' +
          '3 + 6 + 12 + 24 + 48 = 93, khớp. Lỗi hay gặp là dùng q⁴ thay vì q⁵ do nhầm với công thức số hạng tổng ' +
          'quát (ở đó mới là qⁿ⁻¹).',
      },
      {
        prompt: 'Dãy số uₙ = 2ⁿ + 3 có phải cấp số cộng không? Nhập 1 nếu CÓ, nhập 0 nếu KHÔNG.',
        answer: { kind: 'numeric', value: 0 },
        explain:
          'Đây là bẫy về sự "trông giống". Nhiều bạn thấy dãy 5; 7; 11; 19; ... rồi thấy các hiệu 2; 4; 8 đều là luỹ ' +
          'thừa của 2 và tưởng có quy luật đều. Nhưng để là cấp số cộng, HIỆU phải là một HẰNG SỐ: ' +
          'u₍ₙ₊₁₎ − uₙ = 2ⁿ⁺¹ − 2ⁿ = 2ⁿ, phụ thuộc n nên không phải hằng số. Dãy này cũng không phải cấp số nhân vì ' +
          'thương u₂/u₁ = 7/5 khác u₃/u₂ = 11/7. Bài học: luôn kiểm tra với n TỔNG QUÁT, không chỉ vài số hạng đầu.',
      },
    ],
    srsCards: [
      {
        hoi: 'Số hạng tổng quát của cấp số cộng và cấp số nhân?',
        dap: 'uₙ = u₁ + (n−1)d và uₙ = u₁·qⁿ⁻¹ — số mũ/hệ số đều là n−1, không phải n.',
      },
      {
        hoi: 'Công thức tổng n số hạng đầu của cấp số nhân và điều kiện của nó?',
        dap: 'Sₙ = u₁(1 − qⁿ)/(1 − q), chỉ dùng được khi q ≠ 1; nếu q = 1 thì Sₙ = n·u₁.',
      },
      {
        hoi: 'Cách chứng minh một dãy là cấp số cộng?',
        dap: 'Tính u₍ₙ₊₁₎ − uₙ với n tổng quát và chỉ ra kết quả là hằng số, không phụ thuộc n.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan11-c2-b2',
    grade: '11',
    chapterNumber: 2,
    chapterTitle: 'Dãy số. Cấp số cộng và cấp số nhân',
    lessonNumber: 2,
    title: 'Dãy số: cách cho dãy, tính tăng giảm và bị chặn',
    hook:
      'Một ao nuôi cá tra ở Cần Thơ có 1000 con. Mỗi tháng người nuôi bán bớt 10% số cá rồi thả thêm 200 con giống. ' +
      'Số cá cứ tăng mãi, hay sẽ chững lại ở một mức nào đó? Không cần đợi nhiều năm để biết: chỉ cần đọc được ' +
      'dãy số mô tả đàn cá — dãy được cho bằng quy tắc truy hồi, tăng hay giảm, và có bị chặn hay không.',
    theory:
      'CÁCH CHO MỘT DÃY SỐ\n' +
      'Dãy số là một hàm số xác định trên tập các số nguyên dương: mỗi n ứng với một số uₙ. Có ba cách cho dãy.\n' +
      '1. CÔNG THỨC TỔNG QUÁT uₙ = f(n): tra thẳng được số hạng bất kì. Ví dụ uₙ = 2n² − 1 cho u₁₀ = 199 ngay.\n' +
      '2. TRUY HỒI: cho số hạng đầu và quy tắc tính số hạng sau từ số hạng trước. Ví dụ u₁ = 1000, ' +
      'u₍ₙ₊₁₎ = 0,9uₙ + 200. Muốn tới u₁₀₀ phải đi qua 99 bước. Cách này tự nhiên với bài toán thực tế ("tháng ' +
      'này tính từ tháng trước") nhưng bất tiện khi cần số hạng xa. BẮT BUỘC phải cho đủ số hạng đầu: chỉ có quy ' +
      'tắc mà thiếu u₁ thì có vô số dãy thoả mãn. Dãy mà mỗi số hạng dựa vào HAI số hạng liền trước (kiểu ' +
      'Fibonacci) thì phải cho hai số hạng đầu.\n' +
      '3. MÔ TẢ BẰNG LỜI: "uₙ là số ước nguyên dương của n".\n' +
      'Hai cách đầu bổ sung cho nhau: truy hồi dễ viết ra từ đề bài, công thức tổng quát dễ dùng để tính và ' +
      'chứng minh. Chuyển từ truy hồi sang tổng quát thường là bước khó nhất của bài toán.\n\n' +
      'DÃY TĂNG, DÃY GIẢM\n' +
      'Dãy tăng khi u₍ₙ₊₁₎ > uₙ với MỌI n; dãy giảm khi u₍ₙ₊₁₎ < uₙ với mọi n. Hai cách xét:\n' +
      '— Xét HIỆU u₍ₙ₊₁₎ − uₙ rồi xét dấu theo n. Cách này dùng được cho mọi dãy.\n' +
      '— Xét THƯƠNG u₍ₙ₊₁₎/uₙ so với 1, nhưng CHỈ khi mọi số hạng đều DƯƠNG. Bẫy: dãy −8; −4; −2 có thương ' +
      'bằng 1/2 < 1 nhưng dãy lại TĂNG, vì nhân một số âm với số nhỏ hơn 1 làm nó tiến về 0, tức lớn lên.\n' +
      'Có dãy không tăng cũng không giảm, như uₙ = (−1)ⁿ hay uₙ = n² − 6n (giảm rồi mới tăng). Muốn kết luận ' +
      'phải lập hiệu với n tổng quát; thử vài số hạng đầu rồi kết luận là sai phương pháp.\n\n' +
      'DÃY BỊ CHẶN\n' +
      'Bị chặn trên: có số M để uₙ ≤ M với mọi n. Bị chặn dưới: có số m để uₙ ≥ m với mọi n. Bị chặn: có cả hai. ' +
      'Hiểu nôm na: dù đi xa tới đâu, các số hạng không vượt qua một "hàng rào". Số cá trong ao bị chặn trên vì ao ' +
      'chứa có hạn.\n' +
      'Những chỗ hay nhầm:\n' +
      '— Tăng không có nghĩa là không bị chặn trên: uₙ = 3 − 5/(n+1) tăng mãi nhưng không bao giờ vượt 3.\n' +
      '— Dãy tăng thì LUÔN bị chặn dưới bởi u₁ (số hạng nhỏ nhất); dãy giảm thì luôn bị chặn trên bởi u₁. Phía ' +
      'còn lại phải tự chứng minh.\n' +
      '— Bị chặn không kéo theo đơn điệu: (−1)ⁿ bị chặn bởi −1 và 1 nhưng nhảy lên xuống mãi.\n' +
      '— Số chặn không nhất thiết là giá trị dãy đạt tới: 3 là một chặn trên của dãy ở trên dù không số hạng nào ' +
      'bằng 3.\n\n' +
      'ĐÀN CÁ TRA — TỪ TRUY HỒI TỚI CÔNG THỨC\n' +
      'u₂ = 0,9·1000 + 200 = 1100; u₃ = 1190; u₄ = 1271: tăng nhưng mỗi lần tăng ít đi. Mẹo đổi biến: ' +
      'mức cân bằng là nghiệm của x = 0,9x + 200, tức x = 2000. Đặt vₙ = uₙ − 2000 thì ' +
      'v₍ₙ₊₁₎ = 0,9vₙ — một cấp số nhân công bội 0,9 với v₁ = −1000. Suy ra uₙ = 2000 − 1000·0,9ⁿ⁻¹: dãy tăng ' +
      'và bị chặn trên bởi 2000. Đàn cá tiến dần tới 2000 con mà không vượt qua.',
    workedExample: {
      problem:
        'Cho dãy (uₙ) có uₙ = (3n − 2)/(n + 1). Chứng minh dãy tăng và bị chặn, rồi tính u₁₀.',
      steps: [
        'Bước 1 — Viết lại cho lộ phần thay đổi (chia đa thức): 3n − 2 = 3(n + 1) − 5 nên uₙ = 3 − 5/(n + 1). ' +
          'Chọn cách này vì mọi biến thiên nằm gọn trong số hạng 5/(n + 1).',
        'Bước 2 — Xét HIỆU (dãy có số hạng âm hay dương đều dùng được): u₍ₙ₊₁₎ − uₙ = 5/(n+1) − 5/(n+2) = ' +
          '5/[(n+1)(n+2)] > 0 với mọi n ≥ 1. Vậy dãy tăng.',
        'Bước 3 — Chặn dưới: dãy tăng nên mọi số hạng ≥ u₁ = (3 − 2)/2 = 1/2. Chặn trên: 5/(n+1) > 0 nên ' +
          'uₙ = 3 − 5/(n+1) < 3. Vậy 1/2 ≤ uₙ < 3, dãy bị chặn.',
        'Bước 4 — Tính u₁₀ = (30 − 2)/11 = 28/11 ≈ 2,545.',
        'Bước 5 — Tự kiểm: theo dạng đã viết lại, u₁₀ = 3 − 5/11 = 28/11, khớp; và 1/2 ≤ 28/11 < 3, nằm đúng ' +
          'trong "hàng rào". Dãy tiến sát 3 khi n lớn nhưng không bao giờ bằng 3.',
      ],
      answer: 'Dãy tăng, 1/2 ≤ uₙ < 3 nên bị chặn; u₁₀ = 28/11.',
    },
    checkQuestions: [
      {
        prompt: 'Cho dãy u₁ = 3 và u₍ₙ₊₁₎ = 2uₙ − 1. Tính u₄.',
        answer: { kind: 'numeric', value: 17 },
        explain:
          'Đi từng bước theo truy hồi: u₂ = 2·3 − 1 = 5; u₃ = 2·5 − 1 = 9; u₄ = 2·9 − 1 = 17. Lỗi hay gặp là ' +
          'áp quy tắc một lần từ u₁ rồi dừng, hoặc nhầm u₍ₙ₊₁₎ thành 2u₍ₙ₊₁₎ − 1. Truy hồi buộc phải tính ' +
          'tuần tự vì mỗi số hạng chỉ biết được sau khi có số hạng liền trước.',
      },
      {
        prompt: 'Dãy uₙ = n² − 6n. Tìm số nguyên dương n NHỎ NHẤT sao cho u₍ₙ₊₁₎ > uₙ.',
        answer: { kind: 'numeric', value: 3 },
        explain:
          'Lập hiệu: u₍ₙ₊₁₎ − uₙ = (n+1)² − 6(n+1) − n² + 6n = 2n − 5. Hiệu dương khi n ≥ 3. Kiểm: u₂ = −8, ' +
          'u₃ = −9 (giảm), u₄ = −8 (tăng). Dãy này giảm trước rồi mới tăng nên KHÔNG đơn điệu — kết luận từ ' +
          'vài số hạng đầu sẽ sai; phải xét dấu hiệu với n tổng quát.',
      },
      {
        prompt: 'Phát biểu nào đúng về dãy uₙ = (−1)ⁿ ?',
        choices: [
          { id: 'a', label: 'Dãy tăng và bị chặn.' },
          { id: 'b', label: 'Dãy giảm và bị chặn.' },
          { id: 'c', label: 'Dãy bị chặn nhưng không tăng, không giảm.' },
          { id: 'd', label: 'Dãy không bị chặn.' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Các số hạng luân phiên −1; 1; −1; 1; ... nên mọi số hạng nằm trong [−1; 1] (bị chặn), nhưng u₂ > u₁ ' +
          'còn u₃ < u₂ nên không tăng cũng không giảm. Sai lầm hay gặp là nghĩ "bị chặn thì phải đơn điệu"; ' +
          'thực ra hai tính chất độc lập với nhau.',
      },
      {
        prompt: 'Dãy uₙ = (4n + 1)/(n + 2). Tìm số nguyên M NHỎ NHẤT sao cho uₙ ≤ M với mọi n.',
        answer: { kind: 'numeric', value: 4 },
        explain:
          'Viết uₙ = 4 − 7/(n+2) < 4, nên M = 4 là một chặn trên. Số 3 không đủ vì u₆ = 25/8 = 3,125 > 3. ' +
          'Lưu ý uₙ không bao giờ bằng 4 nhưng 4 vẫn là chặn trên nhỏ nhất trong các số nguyên: chặn trên ' +
          'không cần là giá trị mà dãy đạt được. Lỗi hay gặp là kết luận "dãy tăng nên không bị chặn".',
      },
    ],
    srsCards: [
      {
        hoi: 'Ba cách cho một dãy số, và điều kiện bắt buộc của cách truy hồi?',
        dap: 'Công thức tổng quát, truy hồi, mô tả bằng lời. Truy hồi phải cho đủ số hạng đầu (một hoặc hai tuỳ quy tắc).',
      },
      {
        hoi: 'Khi nào được xét thương u₍ₙ₊₁₎/uₙ để kết luận tăng giảm?',
        dap: 'Chỉ khi mọi số hạng đều dương. Với số hạng âm thì thương < 1 có thể ứng với dãy tăng; an toàn hơn là xét hiệu.',
      },
      {
        hoi: 'Dãy tăng có luôn không bị chặn trên không?',
        dap: 'Không. Dãy tăng luôn bị chặn dưới bởi u₁, còn chặn trên thì tuỳ dãy, ví dụ 3 − 5/(n+1) tăng nhưng < 3.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan11-c2-b3',
    grade: '11',
    chapterNumber: 2,
    chapterTitle: 'Dãy số. Cấp số cộng và cấp số nhân',
    lessonNumber: 3,
    title: 'Cấp số nhân trong bài toán lãi kép và tăng trưởng',
    hook:
      'Cửa hàng xe máy quảng cáo: "Vay 30 triệu, lãi chỉ 1% một tháng, trả đều 12 tháng." Bạn nhẩm: lãi 12 tháng ' +
      'là 12%, tức 3,6 triệu, vậy mỗi tháng trả (30 + 3,6) : 12 = 2,8 triệu. Nhưng ngân hàng tính ra khoảng ' +
      '2,665 triệu — ít hơn. Vì sao hai cách ra hai số khác nhau, và cách nào đúng khi lãi tính trên dư nợ ' +
      'giảm dần? Câu trả lời nằm ở tổng của một cấp số nhân.',
    theory:
      'TỪ CẤP SỐ NHÂN ĐẾN LÃI KÉP\n' +
      'LÃI ĐƠN: chỉ tính lãi trên số gốc ban đầu, mỗi kỳ cộng thêm P·r, nên số dư là một cấp số CỘNG. ' +
      'LÃI KÉP: lãi cuối kỳ được nhập vào gốc để kỳ sau sinh lãi tiếp, nên số dư kỳ sau = số dư kỳ trước × (1 + r), ' +
      'tức là cấp số NHÂN công bội q = 1 + r.\n' +
      'Gửi P đồng, lãi r mỗi kỳ: sau n kỳ có Aₙ = P(1 + r)ⁿ. Chú ý chỉ số: ở đây số dư lúc bắt đầu là P (kỳ 0) ' +
      'nên số mũ là n; nếu coi P(1+r) là số hạng đầu thì mới là uₙ = u₁·qⁿ⁻¹. Cùng một dãy, hai cách đánh số, ' +
      'đừng trộn lẫn.\n' +
      'ĐƠN VỊ PHẢI KHỚP: r và n phải cùng kỳ. Lãi 6%/năm mà tính theo tháng thì r = 0,5%/tháng và n đếm bằng ' +
      'tháng. Bẫy: lãi 1%/tháng KHÔNG bằng 12%/năm khi ghép lãi, vì 1,01¹² ≈ 1,1268, tức khoảng 12,68%/năm.\n' +
      'THỜI GIAN GẤP ĐÔI: cần n nhỏ nhất để (1 + r)ⁿ ≥ 2, tức n ≥ ln 2 / ln(1 + r). Quy tắc nhẩm "72 chia cho ' +
      'lãi suất phần trăm" chỉ cho giá trị ước lượng; vì lãi trả theo kỳ nên đáp số phải là số nguyên kỳ và cần ' +
      'kiểm lại. Với 8%/năm, 72 : 8 = 9, nhưng 1,08⁹ ≈ 1,999 < 2, phải đợi 10 năm.\n\n' +
      'GỬI GÓP ĐỀU — TỔNG CÁC SỐ HẠNG CỦA MỘT CẤP SỐ NHÂN\n' +
      'Mỗi kỳ gửi thêm a đồng, lãi kép r mỗi kỳ, gửi n kỳ. Mỗi khoản gửi ở một thời điểm khác nhau nên sinh ' +
      'lãi số kỳ khác nhau, và việc gửi ĐẦU hay CUỐI kỳ làm số kỳ chênh nhau đúng một.\n' +
      '— Gửi CUỐI mỗi kỳ: khoản cuối chưa sinh lãi, khoản đầu sinh lãi n − 1 kỳ. Tổng ' +
      'T = a[(1+r)ⁿ⁻¹ + ... + (1+r) + 1], là n số hạng của cấp số nhân có u₁ = a, q = 1 + r, nên ' +
      'T = a[(1+r)ⁿ − 1]/r.\n' +
      '— Gửi ĐẦU mỗi kỳ: mỗi khoản sinh lãi thêm một kỳ nữa, nhân thêm (1 + r): T = a(1+r)[(1+r)ⁿ − 1]/r.\n' +
      'Công thức chung S = u₁(qⁿ − 1)/(q − 1) dùng khi q > 1; đó chính là dạng u₁(1 − qⁿ)/(1 − q) quen thuộc, ' +
      'chỉ đổi dấu cả tử lẫn mẫu cho khỏi ra số âm.\n\n' +
      'VAY TRẢ GÓP\n' +
      'Vay P, lãi r mỗi kỳ tính trên DƯ NỢ, trả đều x cuối mỗi kỳ và hết nợ sau n kỳ. Lập luận: nếu không trả ' +
      'đồng nào thì nợ lớn lên thành P(1+r)ⁿ; các khoản trả x cũng sinh lãi như gửi góp, có giá trị ' +
      'x[(1+r)ⁿ − 1]/r. Hai số này phải bằng nhau lúc tất toán:\n' +
      'x = P·r·(1+r)ⁿ / [(1+r)ⁿ − 1].\n' +
      'Vì sao x lớn hơn P/n: vì ngoài gốc còn phải trả lãi. Vì sao x nhỏ hơn cách nhẩm "gốc cộng lãi trên gốc ' +
      'ban đầu rồi chia đều": lãi thật chỉ tính trên phần nợ CÒN LẠI, mà nợ giảm dần sau mỗi kỳ. Cách nhẩm ' +
      'tương ứng kiểu "lãi suất tính trên dư nợ ban đầu" của một số gói trả góp, đắt hơn nhiều; cần đọc kỹ ' +
      'điều khoản.',
    animation: {
      title: 'Lãi kép: cứ khoảng 9 năm số dư lại gấp đôi',
      description:
        'Đồ thị số dư của 100 triệu đồng gửi lãi kép 8% một năm trong 30 năm. Đường biểu diễn cong lên, ngày càng dốc. ' +
        'Ba chấm đánh dấu những lúc số dư gấp đôi: sau khoảng 9 năm đạt 200 triệu, sau khoảng 18 năm đạt 400 ' +
        'triệu, sau khoảng 27 năm đạt 800 triệu. Các khoảng thời gian gấp đôi bằng nhau, nhưng số tiền tăng ' +
        'thêm sau mỗi lần gấp đôi lại lớn hơn lần trước. Đó là đặc trưng của cấp số nhân.',
      viewBoxWidth: 380,
      viewBoxHeight: 240,
      durationMs: 7000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'ox',
          x1: 40,
          y1: 200,
          x2: 360,
          y2: 200,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'oy',
          x1: 40,
          y1: 200,
          x2: 40,
          y2: 30,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'polyline',
          id: 'duongSoDu',
          points: [
            [40, 183],
            [60, 180.2],
            [80, 176.9],
            [100, 173],
            [120, 168.5],
            [140, 163.3],
            [160, 157.2],
            [180, 150.1],
            [200, 141.8],
            [220, 132.1],
            [240, 120.8],
            [260, 107.6],
            [280, 92.2],
            [300, 74.3],
            [320, 53.3],
            [340, 28.9],
          ],
          stroke: 'primary',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1200, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhanTieuDe',
          x: 50,
          y: 22,
          text: 'Số dư (triệu đồng), gốc 100, lãi 8% một năm',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'line',
          id: 'gach1',
          x1: 130,
          y1: 200,
          x2: 130,
          y2: 166,
          stroke: 'accent',
          strokeWidth: 2,
          dash: '4 2',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1800, opacity: 0 },
            { atMs: 2400, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'diem1',
          cx: 130,
          cy: 166,
          r: 5,
          fill: 'warn',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1800, opacity: 0 },
            { atMs: 2400, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan200',
          x: 123,
          y: 158,
          text: '200',
          size: 12,
          anchor: 'end',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1800, opacity: 0 },
            { atMs: 2400, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'gach2',
          x1: 220,
          y1: 200,
          x2: 220,
          y2: 132,
          stroke: 'accent',
          strokeWidth: 2,
          dash: '4 2',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3000, opacity: 0 },
            { atMs: 3600, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'diem2',
          cx: 220,
          cy: 132,
          r: 5,
          fill: 'warn',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3000, opacity: 0 },
            { atMs: 3600, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan400',
          x: 213,
          y: 124,
          text: '400',
          size: 12,
          anchor: 'end',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3000, opacity: 0 },
            { atMs: 3600, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'gach3',
          x1: 310,
          y1: 200,
          x2: 310,
          y2: 64,
          stroke: 'accent',
          strokeWidth: 2,
          dash: '4 2',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4200, opacity: 0 },
            { atMs: 4800, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'diem3',
          cx: 310,
          cy: 64,
          r: 5,
          fill: 'warn',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4200, opacity: 0 },
            { atMs: 4800, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan800',
          x: 303,
          y: 56,
          text: '800',
          size: 12,
          anchor: 'end',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4200, opacity: 0 },
            { atMs: 4800, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nam9',
          x: 130,
          y: 216,
          text: '9',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nam18',
          x: 220,
          y: 216,
          text: '18',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nam27',
          x: 310,
          y: 216,
          text: '27',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhanNam',
          x: 358,
          y: 216,
          text: 'năm',
          size: 12,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhanKetLuan',
          x: 200,
          y: 236,
          text: 'Cứ khoảng 9 năm, số dư lại gấp đôi',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5400, opacity: 0 },
            { atMs: 6000, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
      ],
      captions: [
        { atMs: 0, text: 'Số dư lãi kép là cấp số nhân: đường cong ngày càng dốc.' },
        { atMs: 2400, text: 'Sau khoảng 9 năm, 100 triệu thành 200 triệu.' },
        { atMs: 3600, text: 'Thêm 9 năm nữa, số dư gấp đôi lần nữa: 400 triệu.' },
        {
          atMs: 4800,
          text: 'Khoảng 27 năm: 800 triệu. Thời gian gấp đôi không đổi, số tiền tăng thêm thì lớn dần.',
        },
      ],
    },
    workedExample: {
      problem:
        'Một học sinh vay 18 triệu đồng mua máy tính, lãi 1% mỗi tháng tính trên dư nợ, trả đều vào cuối mỗi ' +
        'tháng trong 6 tháng. Tính số tiền phải trả mỗi tháng (làm tròn đến nghìn đồng).',
      steps: [
        'Bước 1 — Xác định đại lượng (khớp đơn vị kỳ là tháng): P = 18 (triệu), r = 0,01, n = 6, trả cuối mỗi ' +
          'tháng nên dùng công thức cuối kỳ.',
        'Bước 2 — Lập phương trình tất toán: nợ lúc cuối là 18·1,01⁶, bằng giá trị các khoản trả: ' +
          'x(1 + 1,01 + ... + 1,01⁵) = x(1,01⁶ − 1)/0,01 (tổng 6 số hạng cấp số nhân, u₁ = 1, q = 1,01).',
        'Bước 3 — Tính 1,01⁶ ≈ 1,06152 nên x = 18·0,01·1,06152/0,06152 = 0,191074/0,06152 ≈ 3,1059 (triệu).',
        'Bước 4 — Tự kiểm bằng dư nợ từng tháng (đây là cách kiểm độc lập với công thức): sau tháng 1 còn ' +
          '18·1,01 − 3,10587 ≈ 15,0741; tháng 2 còn ≈ 12,1190; tháng 3 ≈ 9,1343; tháng 4 ≈ 6,1198; ' +
          'tháng 5 ≈ 3,0751; tháng 6 còn 3,0751·1,01 − 3,10587 ≈ 0. Hết nợ đúng lúc, công thức đúng.',
        'Bước 5 — Nhận xét: tổng phải trả 6·3,10587 ≈ 18,635 triệu, tức tiền lãi ≈ 0,635 triệu, ít hơn cách ' +
          'nhẩm lãi trên dư nợ ban đầu (18·0,01·6 = 1,08 triệu), vì nợ giảm dần sau mỗi kỳ.',
      ],
      answer: 'Mỗi tháng trả khoảng 3,106 triệu đồng (làm tròn đến nghìn đồng).',
    },
    checkQuestions: [
      {
        prompt:
          'Gửi 100 triệu đồng, lãi kép 6% một năm. Sau 5 năm số dư là bao nhiêu triệu đồng? ' +
          '(Làm tròn đến 2 chữ số thập phân.)',
        answer: { kind: 'numeric', value: 133.82, tolerance: { mode: 'absolute', eps: 0.01 } },
        explain:
          'Số dư lập thành cấp số nhân công bội 1,06 nên sau 5 năm: 100·1,06⁵ ≈ 100·1,33823 = 133,82 triệu. ' +
          'Lãi đơn chỉ cho 100 + 5·6 = 130 triệu; phần chênh 3,82 triệu chính là "lãi sinh lãi". Lỗi hay gặp ' +
          'là nhân 100 với 1,06 rồi nhân thêm 5 (ra 130), tức nhầm cấp số nhân thành cấp số cộng.',
      },
      {
        prompt:
          'Gửi lãi kép 8% một năm, lãi nhập gốc cuối mỗi năm. Sau ít nhất bao nhiêu NĂM thì số dư gấp đôi số gốc?',
        answer: { kind: 'numeric', value: 10 },
        explain:
          'Cần (1,08)ⁿ ≥ 2. Tính được 1,08⁹ ≈ 1,999 vẫn chưa đủ 2, còn 1,08¹⁰ ≈ 2,159 thì đủ, nên n = 10. ' +
          'Quy tắc nhẩm 72 : 8 = 9 cho kết quả gần đúng nhưng nếu chọn 9 là sai, vì số dư chỉ được cộng lãi ' +
          'theo kỳ nguyên và 9 năm còn thiếu một chút. Luôn kiểm lại bằng cách tính cả n và n − 1.',
      },
      {
        prompt: 'Một khoản tiền gửi lãi kép, chu kỳ một năm. Dãy số dư cuối các năm là gì?',
        choices: [
          { id: 'a', label: 'Cấp số cộng có công sai bằng số tiền gốc nhân với lãi suất.' },
          { id: 'b', label: 'Cấp số nhân có công bội 1 + r, với r là lãi suất năm.' },
          { id: 'c', label: 'Cấp số nhân có công bội r.' },
          { id: 'd', label: 'Không là cấp số cộng cũng không là cấp số nhân.' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Mỗi năm số dư được nhân với (1 + r) vì cả gốc lẫn lãi cũ đều sinh lãi mới, nên đó là cấp số nhân ' +
          'công bội 1 + r. Phương án a mô tả LÃI ĐƠN, nơi chỉ gốc sinh lãi. Phương án c sai vì công bội r ' +
          '(thường < 1) sẽ làm số dư co lại thay vì lớn lên.',
      },
      {
        prompt:
          'Mỗi CUỐI tháng gửi 1 triệu đồng vào tài khoản có lãi kép 1% một tháng. Sau 3 tháng (ngay sau lần ' +
          'gửi thứ ba) có tất cả bao nhiêu triệu đồng? (Làm tròn đến 4 chữ số thập phân.)',
        answer: { kind: 'numeric', value: 3.0301, tolerance: { mode: 'absolute', eps: 0.0001 } },
        explain:
          'Gửi cuối kỳ: khoản đầu sinh lãi 2 tháng (1,01² = 1,0201), khoản hai sinh lãi 1 tháng (1,01), khoản ' +
          'ba chưa sinh lãi (1). Tổng 1,0201 + 1,01 + 1 = 3,0301, trùng công thức [(1,01)³ − 1]/0,01. Lỗi ' +
          'hay gặp là dùng công thức gửi ĐẦU kỳ (nhân thêm 1,01, ra 3,0604) hoặc nhân cả ba khoản lên 1,01³.',
      },
    ],
    srsCards: [
      {
        hoi: 'Số dư sau n kỳ khi gửi P lãi kép r mỗi kỳ, và đây là loại cấp số nào?',
        dap: 'P(1+r)ⁿ — cấp số nhân công bội 1+r. Lãi đơn mới là cấp số cộng.',
      },
      {
        hoi: 'Tổng gửi góp đều a mỗi kỳ trong n kỳ, gửi cuối kỳ và gửi đầu kỳ?',
        dap: 'Cuối kỳ: a[(1+r)ⁿ − 1]/r. Đầu kỳ: nhân thêm (1+r). Cùng là tổng n số hạng cấp số nhân công bội 1+r.',
      },
      {
        hoi: 'Công thức số tiền trả đều mỗi kỳ khi vay P, lãi r mỗi kỳ trên dư nợ, trả n kỳ?',
        dap: 'x = P·r·(1+r)ⁿ / [(1+r)ⁿ − 1], suy từ P(1+r)ⁿ = x[(1+r)ⁿ − 1]/r.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
