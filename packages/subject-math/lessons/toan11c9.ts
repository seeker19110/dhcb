// lessons/toan11c9.ts — Toán 11, Chương 9: Đạo hàm.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN11_C9_LESSONS: MathLesson[] = [
  {
    id: 'toan11-c9-b1',
    grade: '11',
    chapterNumber: 9,
    chapterTitle: 'Đạo hàm',
    lessonNumber: 1,
    title: 'Khái niệm đạo hàm và ý nghĩa hình học',
    hook:
      'Đồng hồ tốc độ trên xe máy chỉ 40 km/h — nhưng đó là tốc độ TẠI KHOẢNH KHẮC NÀY, chứ không phải quãng đường ' +
      'chia thời gian của cả chuyến đi. Làm sao tính được tốc độ tại đúng một khoảnh khắc, khi mà trong một khoảnh ' +
      'khắc thì quãng đường bằng 0 và thời gian cũng bằng 0? Đạo hàm chính là lời giải cho nghịch lý ấy.',
    theory:
      'ĐỊNH NGHĨA\n' +
      "f'(x₀) = lim [f(x) − f(x₀)]/(x − x₀) khi x → x₀, nếu giới hạn này tồn tại và hữu hạn.\n" +
      'Đặt Δx = x − x₀ (số gia đối số) và Δy = f(x₀ + Δx) − f(x₀) (số gia hàm số), ta viết gọn ' +
      "f'(x₀) = lim (Δy/Δx) khi Δx → 0.\n\n" +
      'VÌ SAO PHẢI DÙNG GIỚI HẠN MÀ KHÔNG THAY THẲNG Δx = 0\n' +
      'Thay Δx = 0 cho 0/0 — vô nghĩa. Ý tưởng của đạo hàm là: thay vì hỏi "tốc độ tại đúng một điểm", ta hỏi "tốc ' +
      'độ trung bình trên một khoảng CỰC NGẮN", rồi cho khoảng ấy co lại dần về 0 và xem con số tiến tới đâu. Giới ' +
      'hạn ấy chính là tốc độ tức thời.\n\n' +
      'BA Ý NGHĨA PHẢI NẮM\n' +
      "1. HÌNH HỌC: f'(x₀) là HỆ SỐ GÓC của tiếp tuyến với đồ thị tại điểm M(x₀; f(x₀)). Tỉ số Δy/Δx là hệ số góc " +
      'của cát tuyến qua hai điểm; khi điểm thứ hai trượt về trùng điểm đầu, cát tuyến xoay dần thành tiếp tuyến.\n' +
      "2. VẬT LÍ: nếu s(t) là quãng đường thì s'(t) là vận tốc tức thời; v'(t) là gia tốc.\n" +
      '3. TỔNG QUÁT: đạo hàm đo TỐC ĐỘ THAY ĐỔI của một đại lượng theo đại lượng khác — tốc độ tăng dân số, tốc độ ' +
      'nguội của một vật, tốc độ lan của dịch bệnh.\n\n' +
      'PHƯƠNG TRÌNH TIẾP TUYẾN tại điểm M(x₀; y₀) thuộc đồ thị:\n' +
      "y = f'(x₀)(x − x₀) + y₀.\n" +
      'PHẠM VI ÁP DỤNG (rất hay bị bỏ qua): công thức này chỉ dùng khi x₀ là hoành độ TIẾP ĐIỂM. Nếu đề cho "tiếp tuyến đi qua điểm ' +
      'A" mà A không thuộc đồ thị thì phải đặt tiếp điểm làm ẩn rồi giải phương trình — đây là hai dạng bài khác hẳn ' +
      'nhau và bị nhầm rất nhiều.\n\n' +
      'BẢNG ĐẠO HÀM CƠ BẢN\n' +
      "(c)' = 0; (x)' = 1; (xⁿ)' = n·xⁿ⁻¹; (√x)' = 1/(2√x) với x > 0; (1/x)' = −1/x² với x ≠ 0;\n" +
      "(sin x)' = cos x; (cos x)' = −sin x (chú ý dấu trừ).\n\n" +
      'QUY TẮC TÍNH\n' +
      "(u ± v)' = u' ± v'; (u·v)' = u'v + uv'; (u/v)' = (u'v − uv')/v².\n" +
      "CẢNH BÁO: (u·v)' KHÔNG bằng u'·v'. Kiểm bằng ví dụ: với u = v = x thì (x·x)' = (x²)' = 2x, trong khi " +
      "u'·v' = 1·1 = 1. Khác hẳn nhau. Quy tắc đạo hàm tích có hai số hạng là vì cả hai thừa số đều đang thay đổi.\n" +
      "ĐẠO HÀM HÀM HỢP: [f(u(x))]' = f'(u)·u'(x) — đạo hàm lớp ngoài nhân đạo hàm lớp trong.",
    // Hoạt ảnh tính SẴN theo hình học thật: đường cong là y = 192 − 6u − 2u² (u = (x−70)/30) trên toạ độ
    // viewBox; tại MỖI mốc thời gian, điểm B nằm ĐÚNG trên đường cong và cát tuyến được xoay + tịnh tiến
    // để thực sự đi qua cả A và B. Mốc cuối khớp đúng tiếp tuyến tại A (hệ số góc −14/30 ≈ −0,467).
    animation: {
      title: 'Cát tuyến xoay dần thành tiếp tuyến',
      description:
        'Trên đồ thị một đường cong có điểm M cố định và điểm B nằm xa hơn về bên phải. Đường thẳng nối hai điểm ' +
        'là cát tuyến, hệ số góc của nó bằng Δy/Δx — độ dốc TRUNG BÌNH trên đoạn từ M tới B. Khi B trượt dọc ' +
        'đường cong về sát M, đường thẳng luôn đi qua đúng hai điểm ấy và xoay dần: độ dốc của nó đi từ −0,80 ' +
        'qua −0,73; −0,67; −0,60; −0,53; −0,50 rồi tiến tới −0,47. Lúc B trùng M, cát tuyến dừng lại ở đúng một ' +
        'vị trí giới hạn duy nhất — đó là tiếp tuyến, và hệ số góc giới hạn ấy chính là đạo hàm tại M.',
      viewBoxWidth: 380,
      viewBoxHeight: 240,
      durationMs: 7000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'ox',
          x1: 30,
          y1: 200,
          x2: 360,
          y2: 200,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'oy',
          x1: 60,
          y1: 200,
          x2: 60,
          y2: 20,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'polyline',
          id: 'duongCong',
          points: [
            [70, 192],
            [100, 184],
            [130, 172],
            [160, 156],
            [190, 136],
            [220, 112],
            [250, 84],
            [280, 52],
            [310, 16],
          ],
          stroke: 'primary',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'catTuyen',
          x1: 100,
          y1: 190,
          x2: 300,
          y2: 40,
          stroke: 'accent',
          strokeWidth: 3,
          // Đoạn gốc dài 250, tâm (200; 115), hướng −36,87°. Mỗi mốc: rotate = góc(B − A) − (−36,87°),
          // còn dx/dy đẩy tâm đoạn về vị trí A + 87,5·vector đơn vị AB để đường thẳng tựa đúng lên A và B.
          keyframes: [
            { atMs: 0, rotate: -1.79, dx: -1.67, dy: 2.34 },
            { atMs: 1000, rotate: 0.62, dx: 0.56, dy: 5.26 },
            { atMs: 2000, rotate: 3.18, dx: 2.8, dy: 8.46 },
            { atMs: 3000, rotate: 5.91, dx: 5.03, dy: 11.98 },
            { atMs: 4000, rotate: 8.8, dx: 7.21, dy: 15.82 },
            { atMs: 4700, rotate: 10.31, dx: 8.26, dy: 17.87 },
            { atMs: 5400, rotate: 11.85, dx: 9.29, dy: 20 },
            { atMs: 7000, rotate: 11.85, dx: 9.29, dy: 20 },
          ],
        },
        { kind: 'circle', id: 'diemCoDinh', cx: 130, cy: 172, r: 6, fill: 'primary' },
        {
          kind: 'circle',
          id: 'diemChay',
          cx: 280,
          cy: 52,
          r: 6,
          fill: 'warn',
          // B luôn nằm TRÊN đường cong: các mốc ứng với u = 7 · 6 · 5 · 4 · 3 · 2,5 · 2 (u = 2 là trùng A).
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 1000, dx: -30, dy: 32 },
            { atMs: 2000, dx: -60, dy: 60 },
            { atMs: 3000, dx: -90, dy: 84 },
            { atMs: 4000, dx: -120, dy: 104 },
            { atMs: 4700, dx: -135, dy: 112.5 },
            { atMs: 5400, dx: -150, dy: 120 },
            { atMs: 7000, dx: -150, dy: 120 },
          ],
        },
        {
          kind: 'label',
          id: 'nhanM',
          x: 122,
          y: 168,
          text: 'M',
          size: 15,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhanKetLuan',
          x: 200,
          y: 228,
          text: "hệ số góc tiến tới f'(x₀)",
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4600, opacity: 0 },
            { atMs: 5400, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
      ],
      captions: [
        { atMs: 0, text: 'Đường thẳng qua hai điểm của đồ thị là cát tuyến.' },
        { atMs: 2000, text: 'Hệ số góc cát tuyến chính là tỉ số Δy/Δx.' },
        { atMs: 4000, text: 'Cho điểm thứ hai trượt lại gần điểm M.' },
        { atMs: 5400, text: 'Cát tuyến tiến tới tiếp tuyến; hệ số góc của nó là đạo hàm.' },
      ],
    },
    workedExample: {
      problem:
        'Cho hàm số y = x² − 3x + 2. Viết phương trình tiếp tuyến của đồ thị tại điểm có hoành độ x₀ = 2.',
      steps: [
        'Bước 1 — Tìm tung độ tiếp điểm (cần cho công thức): y₀ = 2² − 3·2 + 2 = 4 − 6 + 2 = 0. Vậy tiếp điểm là ' +
          'M(2; 0).',
        "Bước 2 — Tính đạo hàm bằng bảng và quy tắc tổng: y' = 2x − 3. Chọn cách này thay vì dùng định nghĩa giới " +
          'hạn vì hàm đa thức đã có công thức sẵn, nhanh và không sai sót.',
        "Bước 3 — Tính hệ số góc tại tiếp điểm: y'(2) = 2·2 − 3 = 1. Con số 1 này chính là độ dốc của đồ thị ngay " +
          'tại điểm M.',
        'Bước 4 — Thay vào công thức tiếp tuyến y = k(x − x₀) + y₀: y = 1·(x − 2) + 0 = x − 2.',
        'Bước 5 — Kiểm chứng: thay x = 2 vào tiếp tuyến được y = 0, đúng đi qua M. Ngoài ra parabol có đỉnh tại ' +
          'x = 1,5; điểm x = 2 nằm bên phải đỉnh nên đồ thị đang đi lên, hệ số góc phải dương — kết quả k = 1 > 0 ' +
          'phù hợp.',
      ],
      answer: 'Tiếp tuyến có phương trình y = x − 2.',
    },
    checkQuestions: [
      {
        prompt: "Cho f(x) = x³ − 2x. Tính f'(1).",
        answer: { kind: 'numeric', value: 1 },
        explain:
          "f'(x) = 3x² − 2, nên f'(1) = 3 − 2 = 1. Lỗi hay gặp: quên hạ số mũ (viết 3x³) hoặc đạo hàm của −2x ra −2x " +
          'thay vì −2. Nhớ quy tắc: số mũ nhảy xuống làm hệ số rồi giảm đi 1 đơn vị.',
      },
      {
        prompt: 'Cho u(x) = x và v(x) = x. Giá trị đạo hàm của tích u·v tại x = 3 bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 6 },
        explain:
          "Đây là bẫy kiểm tra hiểu quy tắc tích. Nhiều bạn tính u'·v' = 1·1 = 1. SAI: đạo hàm của tích KHÔNG bằng " +
          "tích các đạo hàm. Quy tắc đúng: (uv)' = u'v + uv' = 1·x + x·1 = 2x, tại x = 3 cho 6. Kiểm độc lập: " +
          "u·v = x², mà (x²)' = 2x = 6 tại x = 3, khớp. Lý do có hai số hạng: cả hai thừa số đều đang biến thiên nên " +
          'mỗi cái đóng góp một phần vào sự thay đổi của tích.',
      },
      {
        prompt:
          'Tiếp tuyến của đồ thị hàm y = x² tại điểm có hoành độ x₀ = 3 có hệ số góc bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 6 },
        explain:
          "Hệ số góc của tiếp tuyến chính là giá trị đạo hàm tại tiếp điểm: y' = 2x, nên y'(3) = 6. Lỗi thường gặp " +
          'là trả lời 9, tức lấy TUNG ĐỘ của điểm (y = 3² = 9) thay vì độ dốc. Hãy phân biệt rõ: tung độ cho biết ' +
          'điểm đó CAO bao nhiêu, còn đạo hàm cho biết đồ thị tại đó DỐC bao nhiêu.',
      },
    ],
    srsCards: [
      {
        hoi: 'Ý nghĩa hình học của đạo hàm tại một điểm?',
        dap: 'Là hệ số góc của tiếp tuyến với đồ thị tại điểm đó.',
      },
      {
        hoi: 'Phương trình tiếp tuyến tại điểm có hoành độ x₀?',
        dap: "y = f'(x₀)(x − x₀) + f(x₀); chỉ dùng khi x₀ là hoành độ TIẾP ĐIỂM.",
      },
      {
        hoi: "Quy tắc đạo hàm của tích (u·v)'?",
        dap: "u'v + uv' — KHÔNG phải u'·v'.",
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan11-c9-b2',
    grade: '11',
    chapterNumber: 9,
    chapterTitle: 'Đạo hàm',
    lessonNumber: 2,
    title: 'Các quy tắc tính đạo hàm',
    hook:
      'Một ly cà phê nóng đặt trên bàn ở quán, nhiệt độ giảm theo hàm T(t) = 30 + 50e^(−0,1t) (độ C, t là phút). ' +
      'Sau 5 phút ly nguội đi nhanh cỡ nào? Dùng định nghĩa giới hạn cho một hàm như thế thì rất mệt, và mỗi ' +
      'hàm mới lại phải làm lại từ đầu. Bộ quy tắc tính đạo hàm cho phép đi thẳng tới đáp số bằng vài dòng.',
    theory:
      'BẢNG ĐẠO HÀM BỔ SUNG (đã biết: đa thức, √x, 1/x, sin, cos)\n' +
      "(eˣ)' = eˣ — hàm duy nhất giữ nguyên qua phép đạo hàm, vì tốc độ lớn lên của nó luôn bằng chính giá trị " +
      "của nó; (ln x)' = 1/x với x > 0. Chú ý: eˣ KHÔNG áp dụng quy tắc (xⁿ)' = n·xⁿ⁻¹ được, vì ở eˣ biến nằm " +
      'ở SỐ MŨ chứ không phải ở cơ số.\n\n' +
      'QUY TẮC TỔNG, TÍCH, THƯƠNG\n' +
      "(u ± v)' = u' ± v'  ·  (k·u)' = k·u'  ·  (u·v)' = u'v + uv'  ·  (u/v)' = (u'v − uv')/v² (v ≠ 0).\n" +
      'VÌ SAO TÍCH CÓ HAI SỐ HẠNG: hình dung uv là diện tích hình chữ nhật hai cạnh u và v. Khi cả hai cạnh cùng ' +
      'dãn ra một chút, diện tích tăng thêm hai dải mỏng: một dải u·Δv và một dải v·Δu, cộng một ô vuông nhỏ xíu ' +
      "Δu·Δv. Chia cho Δx rồi cho Δx → 0 thì ô nhỏ biến mất, còn lại u·v' + v·u'.\n" +
      "BẪY KINH ĐIỂN: (uv)' KHÔNG bằng u'·v'. Với u = x, v = sin x: (x sin x)' = sin x + x cos x, trong khi " +
      "u'·v' = cos x. Tương tự (u/v)' KHÔNG bằng u'/v'.\n" +
      "Quy tắc thương: tử là u'v − uv' (ĐÚNG thứ tự, đảo chỗ sẽ đổi dấu), mẫu là v² chứ không phải v'. Nhẩm: " +
      '"đạo hàm trên nhân dưới, trừ trên nhân đạo hàm dưới, chia dưới bình phương".\n\n' +
      'ĐẠO HÀM CỦA HÀM HỢP\n' +
      "[f(u(x))]' = f'(u)·u'(x). Hiểu theo tốc độ: nếu u thay đổi nhanh gấp 3 lần x, còn y thay đổi nhanh gấp 2 " +
      'lần u, thì y thay đổi nhanh gấp 2·3 = 6 lần x — tốc độ NHÂN với nhau. Cách làm: "bóc vỏ hành" từ ngoài vào ' +
      'trong: đạo hàm lớp ngoài (giữ nguyên ruột), rồi nhân với đạo hàm lớp trong. Các dạng hay gặp:\n' +
      "(sin u)' = u'·cos u  ·  (cos u)' = −u'·sin u  ·  (eᵘ)' = u'·eᵘ  ·  (ln u)' = u'/u.\n" +
      "Ví dụ (sin 3x)' = 3cos 3x; (e^(2x))' = 2e^(2x); (ln(x² + 1))' = 2x/(x² + 1).\n" +
      "LỖI HAY GẶP NHẤT: quên nhân với u' — viết (sin 3x)' = cos 3x hay (ln(x²+1))' = 1/(x²+1).\n\n" +
      'ÁP DỤNG VÀO LY CÀ PHÊ\n' +
      "T(t) = 30 + 50e^(−0,1t) nên T'(t) = 50·(−0,1)·e^(−0,1t) = −5e^(−0,1t). Tại t = 5 phút: " +
      "T'(5) = −5e^(−0,5) ≈ −3,03, nghĩa là lúc đó ly đang nguội khoảng 3,03 độ C mỗi phút. Dấu âm cho biết " +
      'nhiệt độ giảm. Càng về sau e^(−0,1t) càng nhỏ nên tốc độ nguội càng chậm — khớp với kinh nghiệm thực tế.',
    workedExample: {
      problem: "Cho f(x) = (x² + 1)·sin 2x. Tìm f'(x) và tính f'(π/4).",
      steps: [
        'Bước 1 — Nhận dạng cấu trúc (quyết định chọn quy tắc): f là TÍCH của u = x² + 1 và v = sin 2x, trong đó ' +
          'v lại là hàm HỢP (lớp ngoài sin, lớp trong 2x). Vậy dùng quy tắc tích và quy tắc hàm hợp.',
        "Bước 2 — Đạo hàm từng thừa số: u' = 2x. v' = cos 2x · (2x)' = 2cos 2x (đừng quên nhân với 2).",
        "Bước 3 — Ráp theo quy tắc tích: f'(x) = u'v + uv' = 2x·sin 2x + (x² + 1)·2cos 2x.",
        'Bước 4 — Thay x = π/4: khi đó 2x = π/2 nên sin 2x = 1 và cos 2x = 0. Số hạng thứ hai biến mất, còn ' +
          "f'(π/4) = 2·(π/4)·1 + 0 = π/2.",
        'Bước 5 — Tự kiểm: tính tỉ số số gia với bước rất nhỏ, [f(π/4 + h) − f(π/4 − h)]/(2h) với h = 10⁻⁶ cho ' +
          'khoảng 1,5708, đúng bằng π/2 ≈ 1,5708. Nếu quên nhân 2 ở bước 2 thì số hạng sau vẫn bị triệt tiêu ' +
          'bởi cos(π/2) = 0, nên điểm x = π/4 không bắt lỗi ấy — hãy thử thêm một điểm khác khi tự kiểm.',
      ],
      answer: "f'(x) = 2x·sin 2x + 2(x² + 1)·cos 2x; f'(π/4) = π/2.",
    },
    checkQuestions: [
      {
        prompt: 'Cho u(x) = x² và v(x) = x³. Tính giá trị đạo hàm của tích u·v tại x = 2.',
        answer: { kind: 'numeric', value: 80 },
        explain:
          "(uv)' = u'v + uv' = 2x·x³ + x²·3x² = 5x⁴, tại x = 2 cho 5·16 = 80. Kiểm bằng cách gộp trước: " +
          "u·v = x⁵ nên (x⁵)' = 5x⁴, khớp. Bẫy: nhân hai đạo hàm u'·v' = 2x·3x² = 6x³ = 48 là SAI, vì đạo hàm " +
          'của tích không bằng tích các đạo hàm.',
      },
      {
        prompt: "Cho g(x) = ln(x² + 1). Tính g'(1).",
        answer: { kind: 'numeric', value: 1 },
        explain:
          "Hàm hợp: (ln u)' = u'/u với u = x² + 1, u' = 2x, nên g'(x) = 2x/(x² + 1) và g'(1) = 2/2 = 1. Lỗi " +
          "phổ biến là chỉ lấy 1/u = 1/(x² + 1), cho 1/2 — tức quên nhân với đạo hàm lớp trong u' = 2x.",
      },
      {
        prompt: 'Đạo hàm của hàm số y = e^(−3x) là gì?',
        choices: [
          { id: 'a', label: "y' = e^(−3x)" },
          { id: 'b', label: "y' = −3e^(−3x)" },
          { id: 'c', label: "y' = 3e^(−3x)" },
          { id: 'd', label: "y' = −3x·e^(−3x − 1)" },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          "Hàm hợp (eᵘ)' = u'·eᵘ với u = −3x, u' = −3, nên y' = −3e^(−3x). Phương án a quên nhân với u'; " +
          "phương án c sai dấu của u'; phương án d áp quy tắc luỹ thừa (xⁿ)' = n·xⁿ⁻¹ cho hàm mũ, trong khi biến " +
          'nằm ở số mũ nên quy tắc đó không dùng được.',
      },
      {
        prompt: "Cho f(x) = x/(x + 1). Tính f'(1). (Nhập dạng phân số tối giản.)",
        answer: { kind: 'fraction', num: 1, den: 4 },
        explain:
          "Quy tắc thương: f' = [1·(x + 1) − x·1]/(x + 1)² = 1/(x + 1)², nên f'(1) = 1/4. Lỗi hay gặp là lấy u'/v' " +
          "= 1/1 = 1, hoặc quên bình phương ở mẫu, hoặc viết tử đảo thành uv' − u'v làm sai dấu.",
      },
    ],
    srsCards: [
      {
        hoi: 'Đạo hàm của tích, thương và hàm hợp?',
        dap: "(uv)' = u'v + uv'; (u/v)' = (u'v − uv')/v²; [f(u)]' = f'(u)·u'.",
      },
      {
        hoi: 'Đạo hàm của eˣ, ln x và các dạng hàm hợp eᵘ, ln u?',
        dap: "(eˣ)' = eˣ; (ln x)' = 1/x (x > 0); (eᵘ)' = u'eᵘ; (ln u)' = u'/u.",
      },
      {
        hoi: "Lỗi hay gặp nhất khi tính đạo hàm (sin 3x)'?",
        dap: 'Quên nhân với đạo hàm lớp trong: đúng là 3cos 3x, không phải cos 3x.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan11-c9-b3',
    grade: '11',
    chapterNumber: 9,
    chapterTitle: 'Đạo hàm',
    lessonNumber: 3,
    title: 'Đạo hàm cấp hai và gia tốc tức thời',
    hook:
      'Khi tàu điện Cát Linh – Hà Đông rời ga, bạn bị ép nhẹ vào lưng ghế. Khi tàu đã chạy đều ở tốc độ cao, bạn ' +
      'gần như không cảm thấy gì, dù đang nhanh hơn lúc khởi hành rất nhiều. Cảm giác bị "đẩy" ấy không đến từ ' +
      'vận tốc, mà từ việc vận tốc đang thay đổi nhanh đến đâu. Đó là gia tốc, và nó chính là đạo hàm của đạo hàm.',
    theory:
      'ĐẠO HÀM CẤP HAI\n' +
      "f''(x) = [f'(x)]' — lấy đạo hàm HAI lần liên tiếp. Ví dụ x⁴ → 4x³ → 12x²; sin x → cos x → −sin x; " +
      'eˣ → eˣ → eˣ. Với hàm hợp, đạo hàm lần đầu có thể là một tích, nên lần hai phải dùng quy tắc tích; ' +
      "y = sin 2x cho y' = 2cos 2x rồi y'' = −4sin 2x (mỗi lần đạo hàm lại nhân thêm một thừa số 2).\n" +
      "HAI BẪY: (1) f'' KHÔNG phải (f')² hay f'·f'. (2) Muốn tính f''(x₀) phải đạo hàm hai lần RỒI MỚI thay x₀; " +
      'nếu thay x₀ trước thì được một hằng số, và đạo hàm của hằng số bằng 0 — kết quả sai hoàn toàn.\n\n' +
      'Ý NGHĨA CƠ HỌC: GIA TỐC TỨC THỜI\n' +
      "Gọi s(t) là toạ độ của vật trên một trục tại thời điểm t. Vận tốc tức thời v(t) = s'(t); gia tốc tức " +
      "thời a(t) = v'(t) = s''(t), đơn vị m/s² nếu s tính bằng mét, t bằng giây. Gia tốc là TỐC ĐỘ THAY ĐỔI của " +
      'vận tốc, nên:\n' +
      '— Vật chuyển động đều có v không đổi, a = 0 (đứng yên cũng có a = 0, nhưng a = 0 không có nghĩa là đứng yên).\n' +
      '— Rơi tự do s = ½gt² cho v = gt và a = g ≈ 9,8 m/s²: vận tốc tăng đều 9,8 m/s sau mỗi giây.\n' +
      'NHANH DẦN, CHẬM DẦN: so sánh DẤU của v và a. Cùng dấu thì độ lớn vận tốc tăng (nhanh dần); trái dấu thì ' +
      'độ lớn vận tốc giảm (chậm dần). Bẫy: a > 0 KHÔNG đồng nghĩa "đang nhanh dần". Nếu v = −2 m/s và ' +
      'a = +3 m/s² thì vật đang đi lùi, vận tốc tăng dần về phía 0, tức là vật đang CHẬM lại.\n\n' +
      'Ý NGHĨA HÌNH HỌC\n' +
      "f' là hệ số góc của tiếp tuyến, nên f'' cho biết hệ số góc ấy đang tăng hay giảm khi ta đi sang phải. " +
      "f''(x) > 0: hệ số góc tăng, tiếp tuyến xoay ngược chiều kim đồng hồ, đồ thị cong lên như lòng chiếc bát " +
      "(parabol y = x²: f'' = 2 > 0 ở mọi điểm). f''(x) < 0: đồ thị cong xuống như mái vòm. Điểm đồ thị đổi chiều " +
      "cong gọi là điểm uốn, tại đó f'' đổi dấu. Cẩn thận: f''(x₀) = 0 CHƯA đủ để kết luận có điểm uốn — " +
      "y = x⁴ có y''(0) = 0 nhưng vẫn cong lên ở hai phía, cần f'' thật sự đổi dấu. (Sách dùng chữ \"lồi\", " +
      '"lõm" không thống nhất, nên hãy nhớ bằng hình ảnh "cong lên/cong xuống".)',
    animation: {
      title: 'Parabol cong lên: hệ số góc tiếp tuyến tăng dần',
      description:
        'Một điểm chạy dọc parabol y = x² từ trái sang phải, kèm tiếp tuyến tại điểm đó. Ở nhánh trái tiếp tuyến ' +
        'dốc xuống, hệ số góc âm. Càng gần đỉnh tiếp tuyến càng thoải, tới đỉnh thì nằm ngang với hệ số góc ' +
        'bằng 0. Qua đỉnh tiếp tuyến dốc lên, hệ số góc dương và tăng dần. Hệ số góc luôn tăng khi đi sang phải, ' +
        'nghĩa là đạo hàm cấp hai dương: f″(x) = 2 > 0.',
      viewBoxWidth: 380,
      viewBoxHeight: 240,
      durationMs: 7000,
      loop: true,
      shapes: [
        {
          kind: 'polyline',
          id: 'parabol',
          points: [
            [50, 46],
            [67.5, 79.75],
            [85, 109],
            [102.5, 133.75],
            [120, 154],
            [137.5, 169.75],
            [155, 181],
            [172.5, 187.75],
            [190, 190],
            [207.5, 187.75],
            [225, 181],
            [242.5, 169.75],
            [260, 154],
            [277.5, 133.75],
            [295, 109],
            [312.5, 79.75],
            [330, 46],
          ],
          stroke: 'primary',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'tiepTuyen',
          x1: 130,
          y1: 190,
          x2: 250,
          y2: 190,
          stroke: 'accent',
          strokeWidth: 3,
          // Đoạn gốc nằm ngang tâm (190; 190). Tại x (đơn vị toán) điểm tiếp xúc là (190 + 70x; 190 − 36x²),
          // hệ số góc trên màn hình = −72x/70, nên góc xoay = atan(−72x/70) (độ).
          keyframes: [
            { atMs: 0, dx: -105, dy: -81, rotate: 57.05 },
            { atMs: 500, dx: -105, dy: -81, rotate: 57.05 },
            { atMs: 1000, dx: -87.5, dy: -56.25, rotate: 52.13 },
            { atMs: 1500, dx: -70, dy: -36, rotate: 45.81 },
            { atMs: 2000, dx: -52.5, dy: -20.25, rotate: 37.65 },
            { atMs: 2500, dx: -35, dy: -9, rotate: 27.22 },
            { atMs: 3000, dx: -17.5, dy: -2.25, rotate: 14.42 },
            { atMs: 3500, dx: 0, dy: 0, rotate: 0 },
            { atMs: 4000, dx: 17.5, dy: -2.25, rotate: -14.42 },
            { atMs: 4500, dx: 35, dy: -9, rotate: -27.22 },
            { atMs: 5000, dx: 52.5, dy: -20.25, rotate: -37.65 },
            { atMs: 5500, dx: 70, dy: -36, rotate: -45.81 },
            { atMs: 6000, dx: 87.5, dy: -56.25, rotate: -52.13 },
            { atMs: 6500, dx: 105, dy: -81, rotate: -57.05 },
            { atMs: 7000, dx: 105, dy: -81, rotate: -57.05 },
          ],
        },
        {
          kind: 'circle',
          id: 'diemChay',
          cx: 190,
          cy: 190,
          r: 6,
          fill: 'warn',
          keyframes: [
            { atMs: 0, dx: -105, dy: -81 },
            { atMs: 500, dx: -105, dy: -81 },
            { atMs: 1000, dx: -87.5, dy: -56.25 },
            { atMs: 1500, dx: -70, dy: -36 },
            { atMs: 2000, dx: -52.5, dy: -20.25 },
            { atMs: 2500, dx: -35, dy: -9 },
            { atMs: 3000, dx: -17.5, dy: -2.25 },
            { atMs: 3500, dx: 0, dy: 0 },
            { atMs: 4000, dx: 17.5, dy: -2.25 },
            { atMs: 4500, dx: 35, dy: -9 },
            { atMs: 5000, dx: 52.5, dy: -20.25 },
            { atMs: 5500, dx: 70, dy: -36 },
            { atMs: 6000, dx: 87.5, dy: -56.25 },
            { atMs: 6500, dx: 105, dy: -81 },
            { atMs: 7000, dx: 105, dy: -81 },
          ],
        },
        {
          kind: 'label',
          id: 'nhanTren',
          x: 190,
          y: 24,
          text: 'f″(x) = 2 > 0: hệ số góc luôn tăng',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhanAm',
          x: 190,
          y: 228,
          text: 'Nhánh trái: hệ số góc âm',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 1,
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 2800, opacity: 1 },
            { atMs: 3000, opacity: 0 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'nhanKhong',
          x: 190,
          y: 228,
          text: 'Tại đỉnh: hệ số góc bằng 0',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3000, opacity: 0 },
            { atMs: 3200, opacity: 1 },
            { atMs: 3800, opacity: 1 },
            { atMs: 4000, opacity: 0 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'nhanDuong',
          x: 190,
          y: 228,
          text: 'Nhánh phải: hệ số góc dương',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4000, opacity: 0 },
            { atMs: 4200, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
      ],
      captions: [
        { atMs: 0, text: 'Bên trái đỉnh, tiếp tuyến dốc xuống: hệ số góc âm.' },
        { atMs: 2500, text: 'Đi sang phải, tiếp tuyến thoải dần: hệ số góc tăng.' },
        { atMs: 3500, text: 'Tại đỉnh tiếp tuyến nằm ngang: hệ số góc bằng 0.' },
        { atMs: 5000, text: 'Bên phải đỉnh hệ số góc dương và tiếp tục tăng: f″ > 0.' },
      ],
    },
    workedExample: {
      problem:
        'Một chất điểm chuyển động trên trục số theo phương trình s(t) = t³ − 6t² + 9t (s tính bằng mét, t bằng ' +
        'giây, t ≥ 0). Tìm gia tốc tại các thời điểm vận tốc bằng 0 và cho biết ngay sau mỗi thời điểm đó vật ' +
        'chuyển động nhanh dần hay chậm dần.',
      steps: [
        "Bước 1 — Đạo hàm lần một để có vận tốc: v(t) = s'(t) = 3t² − 12t + 9 = 3(t − 1)(t − 3). (Phân tích ra " +
          'nhân tử vì ta cần nghiệm của v = 0.)',
        'Bước 2 — Vận tốc bằng 0 tại t = 1 và t = 3.',
        "Bước 3 — Đạo hàm lần hai để có gia tốc: a(t) = v'(t) = 6t − 12. Khi đó a(1) = −6 m/s² và a(3) = 6 m/s². " +
          '(Đạo hàm hai lần rồi mới thay t, không thay trước.)',
        'Bước 4 — Xét dấu ngay sau t = 1: v(t) = 3(t−1)(t−3) âm khi 1 < t < 3 (vật đi lùi), và a < 0 khi t < 2. ' +
          'Cùng dấu âm nên vật NHANH dần theo chiều âm. Sau t = 2 thì a > 0 trái dấu với v < 0, vật CHẬM dần ' +
          'cho tới khi dừng ở t = 3. Ngay sau t = 3, v > 0 và a > 0 cùng dấu: nhanh dần theo chiều dương.',
        'Bước 5 — Tự kiểm: v(2) = 3·1·(−1) = −3, trong khi a(2) = 0 — đúng lúc vận tốc đạt giá trị nhỏ nhất ' +
          '(đi lùi nhanh nhất) thì tốc độ thay đổi của vận tốc bằng 0, hợp lý vì v là parabol có đỉnh ở t = 2.',
      ],
      answer:
        'a(1) = −6 m/s² và a(3) = 6 m/s²; vật đổi chiều ở cả hai thời điểm. Sau t = 1 nhanh dần (chiều âm) ' +
        'tới t = 2, rồi chậm dần tới t = 3; sau t = 3 nhanh dần theo chiều dương.',
    },
    checkQuestions: [
      {
        prompt:
          'Một vật chuyển động có s(t) = 2t³ − 5t (mét, giây). Tính gia tốc tại t = 3 giây (theo m/s²).',
        answer: { kind: 'numeric', value: 36 },
        explain:
          "v(t) = s'(t) = 6t² − 5, a(t) = v'(t) = 12t, nên a(3) = 36 m/s². Lỗi hay gặp là dừng ở đạo hàm lần " +
          'một và đọc v(3) = 49 là gia tốc, hoặc thay t = 3 trước rồi mới đạo hàm (được hằng số, đạo hàm bằng 0). ' +
          'Gia tốc là đạo hàm của VẬN TỐC, tức đạo hàm cấp hai của vị trí.',
      },
      {
        prompt: "Cho y = sin 2x. Tính y'' tại x = π/4.",
        answer: { kind: 'numeric', value: -4 },
        explain:
          "y' = 2cos 2x, y'' = −4sin 2x. Tại x = π/4: sin(π/2) = 1 nên y'' = −4. Hai lỗi thường gặp: quên " +
          "nhân thêm một thừa số 2 ở lần đạo hàm thứ hai (ra −2), hoặc sai dấu vì quên (cos x)' = −sin x (ra +4). " +
          'Mỗi lần đạo hàm của hàm hợp đều phải nhân với đạo hàm lớp trong.',
      },
      {
        prompt:
          'Tại thời điểm t₀, vật có vận tốc v = −2 m/s và gia tốc a = +3 m/s². Ngay lúc đó vật chuyển động như thế nào?',
        choices: [
          { id: 'a', label: 'Nhanh dần, vì gia tốc dương.' },
          { id: 'b', label: 'Chậm dần, vì v và a trái dấu.' },
          { id: 'c', label: 'Đứng yên, vì hai đại lượng triệt tiêu nhau.' },
          { id: 'd', label: 'Chuyển động đều.' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Vật đang đi theo chiều âm (v < 0), còn gia tốc dương làm vận tốc tăng dần về phía 0, nên độ lớn vận ' +
          'tốc giảm: chậm dần. Quy tắc đúng là so DẤU của v và a, không phải chỉ nhìn dấu của a. Phương án d ' +
          'sai vì chuyển động đều cần a = 0; phương án c sai vì v = −2 khác 0.',
      },
      {
        prompt: 'Cho f(x) = x³ − 6x² + 2. Tìm x để f″(x) = 0.',
        answer: { kind: 'numeric', value: 2 },
        explain:
          "f'(x) = 3x² − 12x, f''(x) = 6x − 12, bằng 0 khi x = 2. Tại đó f'' đổi dấu từ âm sang dương nên đồ thị " +
          "đổi từ cong xuống sang cong lên: x = 2 là hoành độ điểm uốn. Lỗi hay gặp là giải f'(x) = 0 (ra x = 0 " +
          "và x = 4, là các điểm cực trị) thay vì f''(x) = 0.",
      },
    ],
    srsCards: [
      {
        hoi: 'Ý nghĩa cơ học của đạo hàm cấp một và cấp hai của s(t)?',
        dap: "s'(t) = v(t) là vận tốc tức thời; s''(t) = v'(t) = a(t) là gia tốc tức thời.",
      },
      {
        hoi: 'Khi nào vật chuyển động nhanh dần, khi nào chậm dần?',
        dap: 'Nhanh dần khi v và a cùng dấu; chậm dần khi v và a trái dấu. Không chỉ nhìn dấu của a.',
      },
      {
        hoi: "Dấu của f'' cho biết điều gì về đồ thị?",
        dap: "f'' > 0: hệ số góc tiếp tuyến tăng, đồ thị cong lên; f'' < 0: cong xuống. Điểm uốn cần f'' đổi dấu.",
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
