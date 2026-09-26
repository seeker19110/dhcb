// lessons/hoa10c6.ts — Hoá học 10, Chương 6: Tốc độ phản ứng hoá học (1 bài).
import type { ChemLesson } from '../lessonTypes.js'

export const HOA10_C6_LESSONS: ChemLesson[] = [
  {
    id: 'hoa10-c6-b15',
    grade: '10',
    chapterNumber: 6,
    chapterTitle: 'Tốc độ phản ứng hoá học',
    lessonNumber: 15,
    title: 'Tốc độ phản ứng',
    hook:
      'Que diêm cháy trong tích tắc, nhưng sắt gỉ mất hàng tháng, thậm chí hàng năm. Cùng là ' +
      'phản ứng oxi hoá, vì sao tốc độ khác biệt đến vậy?',
    theory:
      'TỐC ĐỘ PHẢN ỨNG đo mức độ biến thiên nồng độ của chất phản ứng hoặc sản phẩm trong ' +
      'một đơn vị thời gian.\n\n' +
      'BIỂU THỨC TỐC ĐỘ TỨC THỜI cho phản ứng đơn giản aA + bB → sản phẩm: v = k·[A]^a·[B]^b, ' +
      'trong đó k là hằng số tốc độ (phụ thuộc nhiệt độ, bản chất chất phản ứng, không phụ ' +
      'thuộc nồng độ), [A], [B] là nồng độ mol/L.\n\n' +
      'CÁC YẾU TỐ ẢNH HƯỞNG ĐẾN TỐC ĐỘ PHẢN ỨNG:\n' +
      '— NỒNG ĐỘ: nồng độ chất phản ứng càng lớn, tốc độ càng nhanh (va chạm hiệu quả nhiều ' +
      'hơn).\n' +
      "— NHIỆT ĐỘ: nhiệt độ tăng, tốc độ phản ứng tăng — theo HỆ SỐ NHIỆT ĐỘ VAN'T HOFF (γ), " +
      'thường γ = 2÷4: cứ tăng 10°C, tốc độ tăng γ lần.\n' +
      '— DIỆN TÍCH BỀ MẶT: chất rắn nghiền nhỏ có diện tích tiếp xúc lớn hơn ⇒ phản ứng nhanh ' +
      'hơn.\n' +
      '— CHẤT XÚC TÁC: làm tăng tốc độ phản ứng nhưng KHÔNG bị tiêu hao sau phản ứng (khối ' +
      'lượng và bản chất không đổi).\n' +
      '— ÁP SUẤT (với phản ứng có chất khí): áp suất tăng ⇒ nồng độ khí tăng ⇒ tốc độ tăng.',
    workedExample: {
      problem:
        'Một phản ứng có hệ số nhiệt độ γ = 2. Ở 20°C, tốc độ phản ứng là v₀. Hỏi khi tăng ' +
        'nhiệt độ lên 50°C, tốc độ phản ứng tăng bao nhiêu lần?',
      steps: [
        'Xác định số lần tăng 10°C: (50−20)/10 = 3 lần.',
        "Áp dụng công thức Van't Hoff: v(t2)/v(t1) = γ^n, với n là số lần tăng 10°C.",
        'v(50°C)/v(20°C) = 2³ = 8.',
        'Kết luận: tốc độ phản ứng ở 50°C tăng gấp 8 lần so với ở 20°C.',
      ],
      answer: 'Tăng 8 lần.',
    },
    checkQuestions: [
      {
        prompt: 'Chất xúc tác có đặc điểm gì sau khi phản ứng kết thúc?',
        choices: [
          { id: 'a', label: 'Không bị tiêu hao, khối lượng và bản chất không đổi' },
          { id: 'b', label: 'Bị tiêu hao hoàn toàn' },
          { id: 'c', label: 'Chuyển thành sản phẩm chính' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Đặc điểm cốt lõi của chất xúc tác: làm tăng tốc độ phản ứng nhưng KHÔNG bị tiêu hao — có thể tái sử dụng.',
      },
      {
        prompt:
          'Một phản ứng có hệ số nhiệt độ γ = 3. Nếu tăng nhiệt độ thêm 20°C, tốc độ phản ' +
          'ứng tăng bao nhiêu lần? (chỉ nhập số)',
        answer: { kind: 'numeric', value: 9 },
        explain:
          "Số lần tăng 10°C = 20/10 = 2. Tốc độ tăng γ^n = 3² = 9 lần. Đây là quy tắc Van't Hoff: cứ tăng thêm 10°C, tốc độ phản ứng tăng γ lần (γ thường 2-4 tuỳ phản ứng).",
      },
      {
        // Câu BẪY: nhầm "xúc tác làm phản ứng xảy ra nhiều hơn / tạo nhiều sản phẩm hơn".
        prompt:
          'Thêm chất xúc tác vào một phản ứng thuận nghịch đang xảy ra thì LƯỢNG sản phẩm thu ' +
          'được lúc hệ đạt cân bằng thay đổi thế nào?',
        choices: [
          { id: 'nhieu', label: 'Nhiều hơn, vì xúc tác làm phản ứng mạnh hơn' },
          { id: 'khong', label: 'Không đổi — chỉ đạt tới lượng đó NHANH hơn' },
          { id: 'it', label: 'Ít hơn, vì xúc tác giữ lại một phần chất phản ứng' },
        ],
        answer: { kind: 'choice', correctIds: ['khong'] },
        explain:
          'Rất nhiều bạn chọn "nhiều hơn" vì gộp chung hai khái niệm khác hẳn nhau: TỐC ĐỘ (đi ' +
          'nhanh cỡ nào) và CÂN BẰNG (đi tới đâu thì dừng). Xúc tác hạ thấp năng lượng hoạt hoá ' +
          'của cả chiều thuận lẫn chiều nghịch nên làm cả hai nhanh lên như nhau — hệ tới trạng ' +
          'thái cân bằng sớm hơn, nhưng vị trí cân bằng (và do đó lượng sản phẩm cuối cùng) ' +
          'không hề đổi. Muốn đổi lượng sản phẩm thì phải đổi nhiệt độ, nồng độ hoặc áp suất.',
      },
    ],
    srsCards: [
      {
        hoi: "Công thức Van't Hoff về ảnh hưởng nhiệt độ?",
        dap: 'v(t2)/v(t1) = γ^n, với n = số lần tăng 10°C.',
      },
      {
        hoi: 'Chất xúc tác thay đổi thế nào sau phản ứng?',
        dap: 'Không thay đổi khối lượng và bản chất hoá học.',
      },
      {
        hoi: '5 yếu tố ảnh hưởng tốc độ phản ứng?',
        dap: 'Nồng độ, nhiệt độ, diện tích bề mặt, chất xúc tác, áp suất (với khí).',
      },
    ],
    animation: {
      title: 'Va chạm hiệu quả và va chạm không hiệu quả',
      description:
        'Hàng trên: hai phân tử lao vào nhau với năng lượng đủ lớn và đúng hướng — liên kết cũ ' +
        'đứt, liên kết mới hình thành, sinh ra sản phẩm. Đó là VA CHẠM HIỆU QUẢ. Hàng dưới: hai ' +
        'phân tử cũng gặp nhau nhưng đi chậm (năng lượng nhỏ hơn năng lượng hoạt hoá) nên chỉ ' +
        'nảy ra, không sinh sản phẩm — va chạm không hiệu quả. Nhờ hình này mà hiểu được vì sao ' +
        'các yếu tố lại làm phản ứng nhanh lên: tăng nồng độ hay áp suất làm SỐ va chạm nhiều ' +
        'hơn, còn tăng nhiệt độ làm TỈ LỆ va chạm đủ mạnh cao hơn — đó là lý do nhiệt độ có ảnh ' +
        'hưởng mạnh hơn hẳn.',
      viewBoxWidth: 420,
      viewBoxHeight: 220,
      durationMs: 6000,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'tieu-1',
          x: 10,
          y: 20,
          text: 'Va chạm HIỆU QUẢ (đủ năng lượng, đúng hướng)',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'circle',
          id: 'a1',
          cx: 60,
          cy: 60,
          r: 16,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0, opacity: 1 },
            { atMs: 900, dx: 120 },
            { atMs: 1100, opacity: 0 },
            { atMs: 6000, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'b1',
          cx: 260,
          cy: 60,
          r: 16,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0, opacity: 1 },
            { atMs: 900, dx: -48 },
            { atMs: 1100, opacity: 0 },
            { atMs: 6000, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'sp1',
          cx: 196,
          cy: 60,
          r: 14,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 0 },
            { atMs: 900, opacity: 0 },
            { atMs: 1100, opacity: 1 },
            { atMs: 2000, dx: 60 },
            { atMs: 6000, dx: 60 },
          ],
        },
        {
          kind: 'circle',
          id: 'sp2',
          cx: 196,
          cy: 60,
          r: 14,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 0 },
            { atMs: 900, opacity: 0 },
            { atMs: 1100, opacity: 1 },
            { atMs: 2000, dx: -60 },
            { atMs: 6000, dx: -60 },
          ],
        },
        {
          kind: 'label',
          id: 'kq1',
          x: 300,
          y: 64,
          text: '⇒ sinh sản phẩm',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1100, opacity: 0 },
            { atMs: 1400, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'toc1',
          x: 10,
          y: 98,
          text: 'chạy nhanh → va chạm mạnh',
          size: 10,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'line',
          id: 'ngan',
          x1: 10,
          y1: 110,
          x2: 410,
          y2: 110,
          stroke: 'muted',
          strokeWidth: 1,
          dash: '4 4',
        },
        {
          kind: 'label',
          id: 'tieu-2',
          x: 10,
          y: 134,
          text: 'Va chạm KHÔNG hiệu quả (năng lượng nhỏ hơn năng lượng hoạt hoá)',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'circle',
          id: 'a2',
          cx: 60,
          cy: 175,
          r: 16,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 3000, dx: 0 },
            { atMs: 4800, dx: 116 },
            { atMs: 6000, dx: 60 },
          ],
        },
        {
          kind: 'circle',
          id: 'b2',
          cx: 260,
          cy: 175,
          r: 16,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 3000, dx: 0 },
            { atMs: 4800, dx: -52 },
            { atMs: 6000, dx: -10 },
          ],
        },
        {
          kind: 'label',
          id: 'kq2',
          x: 284,
          y: 179,
          text: '⇒ nảy ra, không phản ứng',
          size: 10,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4800, opacity: 0 },
            { atMs: 5100, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'toc2',
          x: 10,
          y: 212,
          text: 'chạy chậm → va chạm yếu',
          size: 10,
          anchor: 'start',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Chỉ va chạm đủ mạnh và đúng hướng mới bẻ được liên kết cũ.' },
        { atMs: 3000, text: 'Va chạm yếu chỉ làm hai phân tử nảy ra — phản ứng không xảy ra.' },
        {
          atMs: 5000,
          text: 'Tăng nồng độ ⇒ nhiều va chạm hơn. Tăng nhiệt độ ⇒ tỉ lệ va chạm đủ mạnh cao hơn.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
]
