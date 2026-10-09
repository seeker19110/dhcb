// lessons/toan10c9.ts — Toán 10, Chương 9: Tính xác suất theo định nghĩa cổ điển.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN10_C9_LESSONS: MathLesson[] = [
  {
    id: 'toan10-c9-b1',
    grade: '10',
    chapterNumber: 9,
    chapterTitle: 'Tính xác suất theo định nghĩa cổ điển',
    lessonNumber: 1,
    title: 'Không gian mẫu, biến cố và xác suất cổ điển',
    hook:
      'Trong một trò chơi hội chợ Tết, người ta úp 3 chiếc bát, dưới một chiếc có đồng xu. Bạn chọn một bát, người ' +
      'chủ trò lật một bát TRỐNG trong hai bát còn lại rồi hỏi: "Có muốn đổi không?" Trực giác bảo đổi hay không ' +
      'chẳng khác gì nhau. Trực giác sai. Bài học này trao cho bạn công cụ đầu tiên để không tin trực giác nữa: ' +
      'mô tả thật rõ mọi kết quả có thể xảy ra, rồi mới đếm.',
    theory:
      'BA KHÁI NIỆM NỀN\n' +
      '— Phép thử ngẫu nhiên: hành động mà ta biết trước tập các kết quả có thể, nhưng không biết trước kết quả nào ' +
      'sẽ xảy ra.\n' +
      '— Không gian mẫu Ω: tập TẤT CẢ các kết quả có thể.\n' +
      '— Biến cố A: một tập con của Ω, gồm những kết quả mà ta quan tâm.\n\n' +
      'ĐỊNH NGHĨA CỔ ĐIỂN\n' +
      'P(A) = n(A) / n(Ω).\n' +
      'ĐIỀU KIỆN ÁP DỤNG CỰC KỲ QUAN TRỌNG: công thức này chỉ đúng khi các kết quả trong Ω ĐỒNG KHẢ NĂNG, tức khả ' +
      'năng xảy ra như nhau. Nếu không, đếm số phần tử rồi chia là sai hoàn toàn. Ví dụ tung hai đồng xu, nếu lấy ' +
      'Ω = {hai mặt ngửa, hai mặt sấp, một ngửa một sấp} thì BA kết quả này KHÔNG đồng khả năng (lần lượt là 1/4, ' +
      '1/4 và 1/2). Cách an toàn: luôn mô tả Ω ở mức chi tiết nhất, ' +
      'phân biệt cả các vật giống hệt nhau.\n\n' +
      'TÍNH CHẤT\n' +
      '— 0 ≤ P(A) ≤ 1; P(∅) = 0; P(Ω) = 1.\n' +
      '— Biến cố đối: P(Ā) = 1 − P(A). Đây là công cụ mạnh nhất của chương: những bài có cụm "ít nhất một" thường ' +
      'nên tính qua biến cố đối "không có cái nào", vì biến cố đối chỉ có một trường hợp trong khi biến cố gốc có ' +
      'rất nhiều trường hợp.\n\n' +
      'QUY TRÌNH BỐN BƯỚC LÀM BÀI\n' +
      '1. Mô tả rõ phép thử và tính n(Ω) — thường bằng tổ hợp hoặc quy tắc nhân.\n' +
      '2. Phát biểu biến cố A bằng lời thật chính xác.\n' +
      '3. Đếm n(A), chú ý dùng đúng công cụ đếm ở chương 8.\n' +
      '4. Chia và kiểm tra kết quả có nằm trong [0; 1] không.\n\n' +
      'LỖI TƯ DUY PHỔ BIẾN NHẤT: nghĩ rằng "có hai khả năng nên mỗi khả năng xác suất 1/2". Trúng số có hai khả ' +
      'năng (trúng/không trúng) nhưng xác suất trúng chắc chắn không phải 1/2. Số khả năng không quyết định xác ' +
      'suất; tính ĐỒNG KHẢ NĂNG mới quyết định.',
    workedExample: {
      problem:
        'Một hộp có 5 bi đỏ và 3 bi xanh. Lấy ngẫu nhiên đồng thời 3 bi. Tính xác suất để (a) cả 3 bi đều đỏ; ' +
        '(b) có ít nhất 1 bi xanh.',
      steps: [
        'Bước 1 — Tính n(Ω): lấy 3 bi trong 8 bi, lấy đồng thời nên không kể thứ tự, dùng tổ hợp: ' +
          'n(Ω) = C³₈ = (8·7·6)/6 = 56. Ta coi 8 viên bi là ĐÔI MỘT KHÁC NHAU (dù cùng màu) để đảm bảo các kết quả ' +
          'đồng khả năng — đây là bước quan trọng nhất.',
        'Bước 2 — Câu (a): gọi A là biến cố "cả 3 bi đều đỏ". Số cách chọn 3 bi từ 5 bi đỏ là C³₅ = 10. ' +
          'Vậy P(A) = 10/56 = 5/28 ≈ 0,179.',
        'Bước 3 — Câu (b): gọi B là biến cố "có ít nhất 1 bi xanh". Nếu đếm trực tiếp phải cộng ba trường hợp ' +
          '(1 xanh, 2 xanh, 3 xanh) — dài và dễ sót. Nhận xét: biến cố đối của B chính là "không có bi xanh nào", ' +
          'tức là A ở câu trên.',
        'Bước 4 — Dùng biến cố đối: P(B) = 1 − P(A) = 1 − 5/28 = 23/28 ≈ 0,821.',
        'Bước 5 — Kiểm tra tính hợp lý: số bi đỏ nhiều hơn nhưng vẫn chỉ có 5 trong 8, nên việc bốc 3 viên mà không ' +
          'dính viên xanh nào là khá khó — xác suất 0,179 nhỏ, phù hợp trực giác. Cả hai kết quả đều nằm trong [0;1].',
      ],
      answer: '(a) P = 5/28 ≈ 0,179; (b) P = 23/28 ≈ 0,821.',
    },
    checkQuestions: [
      {
        prompt:
          'Gieo một con xúc xắc cân đối 1 lần. Tính xác suất để số chấm xuất hiện là số nguyên tố. ' +
          '(Nhập dưới dạng phân số tối giản, ví dụ 1/3.)',
        answer: { kind: 'fraction', num: 1, den: 2 },
        explain:
          'Không gian mẫu Ω = {1;2;3;4;5;6} có 6 phần tử đồng khả năng. Các số nguyên tố trong đó là 2, 3, 5 — ba ' +
          'phần tử. Vậy P = 3/6 = 1/2. Bẫy nằm ở số 1: rất nhiều bạn tính cả số 1 là số nguyên tố và ra 4/6 = 2/3. ' +
          'Số 1 KHÔNG phải số nguyên tố vì nó chỉ có đúng một ước dương, trong khi số nguyên tố phải có đúng hai ước ' +
          'là 1 và chính nó.',
      },
      {
        prompt:
          'Gieo hai đồng xu cân đối. Xác suất để cả hai đồng đều xuất hiện mặt ngửa là bao nhiêu? ' +
          '(Nhập dạng phân số, ví dụ 1/2.)',
        answer: { kind: 'fraction', num: 1, den: 4 },
        explain:
          'Đây là bẫy về tính ĐỒNG KHẢ NĂNG. Nhiều bạn mô tả Ω = {hai ngửa, hai sấp, một ngửa một sấp} rồi kết luận ' +
          'P = 1/3. Sai, vì ba kết quả đó không đồng khả năng: trường hợp "một ngửa một sấp" xảy ra theo HAI cách ' +
          '(NS và SN). Mô tả đúng phải phân biệt từng đồng xu: Ω = {NN, NS, SN, SS} với 4 kết quả đồng khả năng, nên ' +
          'P(NN) = 1/4. Bài học: luôn mô tả không gian mẫu ở mức chi tiết nhất.',
      },
      {
        prompt:
          'Một lớp có 20 bạn, trong đó 12 bạn biết bơi. Chọn ngẫu nhiên 1 bạn. Xác suất bạn đó KHÔNG biết bơi bằng ' +
          'bao nhiêu? (Nhập dạng phân số tối giản.)',
        answer: { kind: 'fraction', num: 2, den: 5 },
        explain:
          'Dùng biến cố đối: P(không biết bơi) = 1 − 12/20 = 8/20 = 2/5. Có thể đếm trực tiếp: 20 − 12 = 8 bạn không ' +
          'biết bơi, cho 8/20 = 2/5. Hai cách cho cùng kết quả, đó là kiểm chứng tốt. Lưu ý phải rút gọn phân số ' +
          'trước khi ghi đáp án cuối.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức xác suất cổ điển và điều kiện áp dụng?',
        dap: 'P(A) = n(A)/n(Ω), chỉ đúng khi các kết quả trong không gian mẫu đồng khả năng.',
      },
      {
        hoi: 'Khi nào nên dùng biến cố đối?',
        dap: 'Khi đề có cụm "ít nhất một" — biến cố đối "không có cái nào" thường chỉ một trường hợp, đếm nhanh hơn.',
      },
      {
        hoi: 'Vì sao xác suất hai đồng xu cùng ngửa là 1/4 chứ không phải 1/3?',
        dap: 'Vì phải phân biệt từng đồng xu: Ω = {NN, NS, SN, SS} mới gồm 4 kết quả đồng khả năng.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan10-c9-b2',
    grade: '10',
    chapterNumber: 9,
    chapterTitle: 'Tính xác suất theo định nghĩa cổ điển',
    lessonNumber: 2,
    title: 'Biến cố đối và sơ đồ cây trong tính xác suất',
    hook:
      'Hộp bốc thăm của một cửa hàng ở Đà Nẵng có 10 phiếu, trong đó 3 phiếu trúng thưởng. Khách rút lần lượt 2 ' +
      'phiếu, không trả lại. Cô thu ngân hỏi: "Xác suất khách trúng ÍT NHẤT một phiếu là bao nhiêu?" Đếm thẳng ' +
      'phải xét "trúng đúng 1" và "trúng đúng 2", rất dễ sót. Tính qua điều ngược lại, "không trúng phiếu nào", ' +
      'thì chỉ cần một lần đếm. Sơ đồ cây giúp ta liệt kê gọn cả hai cách nhìn mà không sót, không trùng.',
    theory:
      'BIẾN CỐ ĐỐI\n' +
      'Biến cố đối của A, kí hiệu Ā, là "A không xảy ra". Mỗi kết quả của phép thử hoặc thuộc A hoặc thuộc Ā, và ' +
      'không thể thuộc cả hai. Vì vậy n(A) + n(Ā) = n(Ω); chia hai vế cho n(Ω) được P(A) + P(Ā) = 1, tức\n' +
      'P(Ā) = 1 − P(A).\n\n' +
      'KHI NÀO NÊN DÙNG\n' +
      'Khi đề có cụm "ít nhất một", "có ít nhất", "không phải tất cả": biến cố gốc gồm nhiều trường hợp (1, 2, 3, ... ' +
      'cái thoả), còn biến cố đối thường chỉ có MỘT trường hợp ("không cái nào thoả"). Đếm một trường hợp rồi lấy ' +
      '1 trừ đi nhanh và ít sót hơn.\n\n' +
      'TÌM BIẾN CỐ ĐỐI CHO ĐÚNG\n' +
      'Phải phủ định đúng, không phủ định theo cảm giác:\n' +
      '— "ít nhất một lần ngửa" ↔ "không lần nào ngửa" (tức toàn sấp).\n' +
      '— "ít nhất hai bạn nữ" ↔ "nhiều nhất một bạn nữ" (0 hoặc 1 bạn nữ), KHÔNG phải "không có bạn nữ nào".\n' +
      '— "cả ba đều đúng" ↔ "có ít nhất một câu sai", KHÔNG phải "cả ba đều sai".\n\n' +
      'SƠ ĐỒ CÂY VÀ QUY TẮC NHÂN\n' +
      'Khi phép thử gồm nhiều giai đoạn nối tiếp (gieo nhiều lần, rút nhiều bi), ta vẽ mỗi giai đoạn thành một ' +
      'tầng nhánh. Mỗi đường đi từ gốc đến lá là một kết quả; nên ghi trên nhánh số cách chọn. Quy tắc nhân: nếu ' +
      'giai đoạn 1 có m cách và sau MỖI cách đó giai đoạn 2 có n cách thì có m·n kết quả. Gieo con xúc xắc 3 lần có ' +
      '6·6·6 = 216 kết quả. Rút 2 bi không hoàn lại từ 5 bi có 5·4 = 20 kết quả, vì sau lần rút đầu chỉ còn 4 bi: ' +
      'số nhánh ở tầng hai phụ thuộc nhánh tầng một khi không hoàn lại.\n' +
      'Sơ đồ cây có ích vì buộc ta phân biệt THỨ TỰ các giai đoạn, nhờ đó không sót và không đếm trùng.\n\n' +
      'BẪY: ĐẾM LÁ MÀ KHÔNG KIỂM TRA ĐỒNG KHẢ NĂNG\n' +
      'Công thức n(A)/n(Ω) chỉ đúng khi các kết quả đồng khả năng. Hai ví dụ điển hình:\n' +
      '— Tổng hai xúc xắc nhận 11 giá trị từ 2 đến 12, nhưng 11 giá trị đó KHÔNG đồng khả năng: tổng 2 chỉ có 1 ' +
      'cặp (1;1), tổng 7 có tới 6 cặp. Không gian mẫu đúng gồm 36 cặp có thứ tự; "tổng" chỉ là nhãn gán cho cặp.\n' +
      '— Hộp 3 bi đỏ 2 bi xanh: hai nhánh "đỏ" và "xanh" ở tầng một không đồng khả năng. Hoặc phân biệt từng viên ' +
      'bi, hoặc ghi số cách trên nhánh (3 cách và 2 cách) rồi nhân dọc đường đi.\n\n' +
      'KHÔNG CỘNG XÁC SUẤT BỪA\n' +
      'Gieo xúc xắc 3 lần, "mỗi lần 1/6 nên có ít nhất một mặt 6 với xác suất 3/6" là SAI: các biến cố có thể ' +
      'xảy ra cùng lúc, nên phép cộng đếm trùng. Công thức cộng chỉ dùng cho biến cố xung khắc. Dùng biến cố đối ' +
      'sẽ tránh được lỗi này.',
    animation: {
      title: 'Sơ đồ cây đếm lấy hai bi không hoàn lại rồi dùng biến cố đối',
      description:
        'Hộp có 3 bi đỏ và 2 bi xanh, lấy lần lượt hai bi không hoàn lại. Sơ đồ cây có hai tầng: tầng một có 3 cách lấy bi đỏ hoặc 2 cách lấy bi xanh; tầng hai còn 4 bi nên số cách thay đổi theo nhánh. Nhân dọc theo từng nhánh được 6 cách cho đỏ-đỏ, 6 cho đỏ-xanh, 6 cho xanh-đỏ và 2 cho xanh-xanh, tổng 20 cách đồng khả năng. Biến cố đối của ít nhất một bi đỏ là cả hai bi xanh, nên xác suất bằng 1 − 2/20 = 9/10.',
      viewBoxWidth: 360,
      viewBoxHeight: 260,
      durationMs: 9000,
      loop: true,
      shapes: [
        {
          kind: 'circle',
          id: 'goc',
          cx: 30,
          cy: 130,
          r: 6,
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'tieu-de',
          x: 330,
          y: 14,
          text: 'Số cách',
          size: 12,
          anchor: 'end',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 400,
              opacity: 0,
            },
            {
              atMs: 800,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'e-d',
          x1: 30,
          y1: 130,
          x2: 150,
          y2: 70,
          stroke: 'muted',
          strokeWidth: 2,
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
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'e-x',
          x1: 30,
          y1: 130,
          x2: 150,
          y2: 190,
          stroke: 'muted',
          strokeWidth: 2,
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
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'l-d',
          x: 62,
          y: 92,
          text: '3 cách',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
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
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'l-x',
          x: 62,
          y: 178,
          text: '2 cách',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
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
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'n-d',
          cx: 150,
          cy: 70,
          r: 14,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1100,
              opacity: 0,
            },
            {
              atMs: 1500,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'n-x',
          cx: 150,
          cy: 190,
          r: 14,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1100,
              opacity: 0,
            },
            {
              atMs: 1500,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 't-d',
          x: 150,
          y: 75,
          text: 'Đ',
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
              atMs: 1100,
              opacity: 0,
            },
            {
              atMs: 1500,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 't-x',
          x: 150,
          y: 195,
          text: 'X',
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
              atMs: 1100,
              opacity: 0,
            },
            {
              atMs: 1500,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'e-l0',
          x1: 150,
          y1: 70,
          x2: 290,
          y2: 35,
          stroke: 'muted',
          strokeWidth: 2,
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
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'e-l1',
          x1: 150,
          y1: 70,
          x2: 290,
          y2: 95,
          stroke: 'muted',
          strokeWidth: 2,
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
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'e-l2',
          x1: 150,
          y1: 190,
          x2: 290,
          y2: 165,
          stroke: 'muted',
          strokeWidth: 2,
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
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'e-l3',
          x1: 150,
          y1: 190,
          x2: 290,
          y2: 220,
          stroke: 'muted',
          strokeWidth: 2,
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
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'll-0',
          x: 212,
          y: 40,
          text: '2 cách',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2300,
              opacity: 0,
            },
            {
              atMs: 2700,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'll-1',
          x: 214,
          y: 106,
          text: '2 cách',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2300,
              opacity: 0,
            },
            {
              atMs: 2700,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'll-2',
          x: 212,
          y: 162,
          text: '3 cách',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2300,
              opacity: 0,
            },
            {
              atMs: 2700,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'll-3',
          x: 214,
          y: 228,
          text: '1 cách',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2300,
              opacity: 0,
            },
            {
              atMs: 2700,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'lc-0',
          cx: 290,
          cy: 35,
          r: 4,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2800,
              opacity: 0,
            },
            {
              atMs: 3200,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lt-0',
          x: 300,
          y: 39,
          text: 'ĐĐ → 6',
          size: 13,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2800,
              opacity: 0,
            },
            {
              atMs: 3200,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'lc-1',
          cx: 290,
          cy: 95,
          r: 4,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2800,
              opacity: 0,
            },
            {
              atMs: 3200,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lt-1',
          x: 300,
          y: 99,
          text: 'ĐX → 6',
          size: 13,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2800,
              opacity: 0,
            },
            {
              atMs: 3200,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'lc-2',
          cx: 290,
          cy: 165,
          r: 4,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2800,
              opacity: 0,
            },
            {
              atMs: 3200,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lt-2',
          x: 300,
          y: 169,
          text: 'XĐ → 6',
          size: 13,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2800,
              opacity: 0,
            },
            {
              atMs: 3200,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'lc-3',
          cx: 290,
          cy: 220,
          r: 6,
          fill: 'warn',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2800,
              opacity: 0,
            },
            {
              atMs: 3200,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lt-3',
          x: 300,
          y: 224,
          text: 'XX → 2',
          size: 13,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2800,
              opacity: 0,
            },
            {
              atMs: 3200,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'tong',
          x: 180,
          y: 250,
          text: 'Tổng: 6 + 6 + 6 + 2 = 20 cách',
          size: 13,
          anchor: 'middle',
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
              atMs: 6000,
              opacity: 1,
            },
            {
              atMs: 6400,
              opacity: 0,
            },
            {
              atMs: 9000,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'ket-qua',
          x: 180,
          y: 250,
          text: 'P(ít nhất 1 đỏ) = 1 − 2/20 = 9/10',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 6400,
              opacity: 0,
            },
            {
              atMs: 6800,
              opacity: 1,
            },
            {
              atMs: 9000,
              opacity: 1,
            },
          ],
        },
      ],
      captions: [
        {
          atMs: 500,
          text: 'Tầng 1: bi đầu là đỏ (3 cách) hoặc xanh (2 cách) — hai nhánh KHÔNG đồng khả năng.',
        },
        {
          atMs: 1800,
          text: 'Tầng 2: số cách phụ thuộc nhánh vì không hoàn lại — sau đỏ còn 2 đỏ 2 xanh, sau xanh còn 3 đỏ 1 xanh.',
        },
        {
          atMs: 2800,
          text: 'Nhân dọc mỗi đường đi: 3×2, 3×2, 2×3, 2×1 — các cách đó mới đồng khả năng.',
        },
        {
          atMs: 4000,
          text: 'Cộng lại: n(Ω) = 6 + 6 + 6 + 2 = 20.',
        },
        {
          atMs: 6400,
          text: 'Chỉ nhánh xanh–xanh (2 cách) không có bi đỏ: P = 1 − 2/20 = 9/10.',
        },
      ],
    },
    workedExample: {
      problem:
        'Gieo một con xúc xắc cân đối 3 lần liên tiếp. Tính xác suất để mặt 6 chấm xuất hiện ít nhất một lần.',
      steps: [
        'Bước 1 — Dựng sơ đồ cây: mỗi lần gieo có 6 nhánh, ba tầng. Kết quả là bộ ba có thứ tự (lần 1; lần 2; ' +
          'lần 3), tất cả đồng khả năng. Quy tắc nhân cho n(Ω) = 6·6·6 = 216.',
        'Bước 2 — Gọi A là biến cố "ít nhất một lần được mặt 6". Đếm trực tiếp phải chia ba trường hợp (đúng ' +
          '1, 2 hoặc 3 lần được 6), dài và dễ sót, nên chọn biến cố đối.',
        'Bước 3 — Ā là "không lần nào được mặt 6": mỗi lần chỉ được chọn trong 5 mặt còn lại, nên ' +
          'n(Ā) = 5·5·5 = 125 và P(Ā) = 125/216.',
        'Bước 4 — P(A) = 1 − 125/216 = 91/216 ≈ 0,421.',
        'Bước 5 — Kiểm tra: xác suất phải lớn hơn 1/6 (đã có thể trúng ngay ở lần gieo đầu) và nhỏ hơn 1; 0,421 ' +
          'thoả. Cách cộng bừa 3·(1/6) = 0,5 cho số lớn hơn 0,421, báo hiệu đã đếm trùng các trường hợp ' +
          'trúng nhiều lần.',
      ],
      answer: 'P = 91/216 ≈ 0,421.',
    },
    checkQuestions: [
      {
        prompt:
          'Một bạn đoán mò cả 3 câu trắc nghiệm, mỗi câu có 4 đáp án và đúng một đáp án. Xác suất để bạn đúng ' +
          'ít nhất một câu là bao nhiêu? (Nhập phân số, ví dụ 3/8.)',
        answer: { kind: 'fraction', num: 37, den: 64 },
        explain:
          'Không gian mẫu có 4·4·4 = 64 cách chọn đáp án, đồng khả năng. Biến cố đối "sai cả ba câu" có 3·3·3 = 27 ' +
          'cách, nên P = 1 − 27/64 = 37/64. Lỗi hay gặp là cộng 3·(1/4) = 3/4 vì coi các biến cố xung khắc; ' +
          'thực tế một bạn có thể đúng nhiều câu cùng lúc nên phép cộng đếm trùng.',
      },
      {
        prompt:
          'Một hộp có 3 bi đỏ và 2 bi xanh, lấy lần lượt 2 bi không hoàn lại. Tính xác suất để có ít nhất một bi đỏ. ' +
          '(Nhập phân số tối giản.)',
        answer: { kind: 'fraction', num: 9, den: 10 },
        explain:
          'Sơ đồ cây cho 5·4 = 20 kết quả đồng khả năng. Biến cố đối "không có bi đỏ" nghĩa là cả hai bi xanh: ' +
          '2·1 = 2 kết quả. Vậy P = 1 − 2/20 = 9/10. Bẫy là quên rằng sau lần đầu chỉ còn 4 bi: nhân 2·2 = 4 ' +
          'sẽ ra 1 − 4/25, sai vì đã coi như có hoàn lại.',
      },
      {
        prompt:
          'Gieo hai con xúc xắc cân đối. Tính xác suất để tổng số chấm bằng 7. (Nhập phân số tối giản.)',
        answer: { kind: 'fraction', num: 1, den: 6 },
        explain:
          'Không gian mẫu gồm 36 cặp có thứ tự đồng khả năng. Tổng bằng 7 có 6 cặp: (1;6), (2;5), (3;4), (4;3), ' +
          '(5;2), (6;1). Vậy P = 6/36 = 1/6. Sai lầm kinh điển là lấy không gian mẫu {2, 3, ..., 12} gồm 11 giá ' +
          'trị rồi ra 1/11; 11 giá trị ấy không đồng khả năng nên không được dùng công thức cổ điển trên chúng.',
      },
      {
        prompt:
          'Chọn 3 bạn từ một nhóm. Biến cố đối của biến cố "có ít nhất hai bạn nữ" là biến cố nào?',
        choices: [
          { id: 'a', label: 'Không có bạn nữ nào' },
          { id: 'b', label: 'Có đúng một bạn nữ' },
          { id: 'c', label: 'Có nhiều nhất một bạn nữ' },
          { id: 'd', label: 'Cả ba bạn đều là nữ' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          '"Ít nhất hai bạn nữ" gồm 2 hoặc 3 nữ. Phần còn lại của không gian mẫu là 0 hoặc 1 nữ, tức "nhiều nhất ' +
          'một bạn nữ". Đáp án a chỉ là một phần của biến cố đối (thiếu trường hợp đúng một bạn nữ), còn d lại ' +
          'là một phần của chính biến cố gốc. Biến cố đối phải cùng A lấp đầy toàn bộ Ω mà không chồng nhau.',
      },
    ],
    srsCards: [
      {
        hoi: 'Vì sao P(Ā) = 1 − P(A)?',
        dap: 'Mỗi kết quả thuộc đúng một trong hai biến cố A và Ā nên n(A) + n(Ā) = n(Ω); chia cho n(Ω).',
      },
      {
        hoi: 'Biến cố đối của "ít nhất hai" là gì?',
        dap: '"Nhiều nhất một" (0 hoặc 1), không phải "không có cái nào".',
      },
      {
        hoi: 'Quy tắc nhân trên sơ đồ cây phát biểu thế nào, và khi rút không hoàn lại thì số nhánh thay đổi ra sao?',
        dap: 'Giai đoạn 1 có m cách, sau mỗi cách có n cách ở giai đoạn 2 thì có m·n kết quả; không hoàn lại thì n giảm đi.',
      },
      {
        hoi: 'Vì sao không được lấy 11 tổng {2,...,12} làm không gian mẫu khi gieo hai xúc xắc?',
        dap: 'Vì 11 giá trị tổng không đồng khả năng; phải dùng 36 cặp có thứ tự mới đồng khả năng.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
