// lessons/toan11c7.ts — Toán 11, Chương 7: Quan hệ vuông góc trong không gian.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN11_C7_LESSONS: MathLesson[] = [
  {
    id: 'toan11-c7-b1',
    grade: '11',
    chapterNumber: 7,
    chapterTitle: 'Quan hệ vuông góc trong không gian',
    lessonNumber: 1,
    title: 'Đường thẳng vuông góc với mặt phẳng',
    hook:
      'Vì sao cột cờ giữa sân trường đứng thẳng tắp mà không cần chống đỡ, trong khi một cây gậy dựng nghiêng thì đổ ' +
      'ngay? Người thợ dựng cột chỉ kiểm tra hai hướng vuông góc là yên tâm — họ không đo hết 360 hướng. Cơ sở toán ' +
      'học cho việc "chỉ cần hai" ấy là định lí quan trọng nhất của chương này.',
    theory:
      'ĐỊNH NGHĨA\n' +
      'Đường thẳng d vuông góc với mặt phẳng (P) khi d vuông góc với MỌI đường thẳng nằm trong (P). Ký hiệu d ⊥ (P).\n' +
      'Định nghĩa này đẹp nhưng không dùng để chứng minh được — không ai kiểm tra nổi vô hạn đường thẳng. Vì thế cần ' +
      'một tiêu chuẩn thực dụng.\n\n' +
      'ĐỊNH LÍ ĐIỀU KIỆN ĐỦ (dùng nhiều nhất cả chương)\n' +
      'Nếu d vuông góc với HAI đường thẳng CẮT NHAU cùng nằm trong (P) thì d ⊥ (P).\n' +
      'HAI CHỮ "CẮT NHAU" LÀ SINH TỬ. Nếu hai đường ấy song song thì kết luận SAI hoàn toàn: một cây gậy có thể ' +
      'vuông góc với hai thanh ray song song mà vẫn nằm nghiêng, thậm chí nằm sát mặt đất. Chỉ khi hai đường cắt ' +
      'nhau, chúng mới "khoá" đủ hai chiều để xác định mặt phẳng. Đây là lý do người thợ chỉ cần kiểm hai hướng — ' +
      'nhưng phải là hai hướng KHÁC nhau, không song song.\n\n' +
      'CÁC HỆ QUẢ HAY DÙNG\n' +
      '— Nếu d ⊥ (P) thì d vuông góc với mọi đường thẳng trong (P), kể cả đường không đi qua chân đường vuông góc.\n' +
      '— Hai đường thẳng PHÂN BIỆT cùng vuông góc với một mặt phẳng thì song song với nhau.\n' +
      '— Hai mặt phẳng PHÂN BIỆT cùng vuông góc với một đường thẳng thì song song với nhau.\n\n' +
      'ĐỊNH LÍ BA ĐƯỜNG VUÔNG GÓC\n' +
      'Cho đường thẳng a KHÔNG vuông góc với (P), gọi a′ là hình chiếu vuông góc của a lên (P), và b là đường ' +
      'thẳng nằm trong (P). Khi đó b ⊥ a ⇔ b ⊥ a′.\n' +
      'Công dụng: chuyển một bài toán vuông góc trong KHÔNG GIAN (khó hình dung) về bài toán vuông góc trong MẶT ' +
      'PHẲNG (dễ vẽ, dễ tính). Đây là chìa khoá của hầu hết bài tập tính khoảng cách và góc.\n\n' +
      'GÓC GIỮA ĐƯỜNG THẲNG VÀ MẶT PHẲNG\n' +
      'Là góc giữa đường thẳng đó và HÌNH CHIẾU của nó trên mặt phẳng. Góc này luôn thuộc [0°; 90°]. Nếu đường thẳng ' +
      'vuông góc với mặt phẳng thì quy ước góc bằng 90°.\n\n' +
      'CHIẾN LƯỢC LÀM BÀI: muốn chứng minh d ⊥ (P), hãy đi tìm hai đường thẳng cắt nhau trong (P) cùng vuông góc với ' +
      'd. Thường một đường lấy từ giả thiết hình chóp (cạnh bên vuông góc đáy), đường còn lại lấy từ tính chất của ' +
      'đa giác đáy (đường chéo hình vuông, đường cao tam giác cân).',
    animation: {
      title: 'Vuông góc với hai đường cắt nhau thì vuông góc với cả mặt phẳng',
      description:
        'Mặt phẳng (P) được vẽ dưới dạng hình bình hành, điểm I nằm trong mặt phẳng. Đường thẳng d dựng thẳng đứng từ I lên. Trước hết d được chứng tỏ vuông góc với đường a đi qua I, rồi vuông góc với đường b cũng đi qua I, hai đường a và b CẮT NHAU tại I chứ không song song. Từ đó một đường c thứ ba nằm trong mặt phẳng bắt đầu quay quanh I, quét qua mọi phương có thể; ở mọi vị trí, kí hiệu góc vuông giữa d và c vẫn còn nguyên. Hình động phá đúng chỗ học sinh mất điểm nhiều nhất: điều kiện d vuông góc với HAI đường CẮT NHAU là không thể bỏ bớt. Vuông góc với một đường thôi thì chưa đủ, và vuông góc với hai đường song song cũng chỉ ngang bằng vuông góc với một đường mà thôi.',
      viewBoxWidth: 320,
      viewBoxHeight: 250,
      durationMs: 7000,
      loop: true,
      shapes: [
        {
          kind: 'polyline',
          id: 'mat-phang',
          points: [
            [40, 150],
            [230, 150],
            [280, 210],
            [90, 210],
          ],
          closed: true,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'nhan-mp',
          x: 288,
          y: 208,
          text: '(P)',
          size: 13,
          fill: 'muted',
        },
        {
          kind: 'circle',
          id: 'diem-i',
          cx: 160,
          cy: 180,
          r: 5,
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-i',
          x: 150,
          y: 196,
          text: 'I',
          size: 14,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'arrow',
          id: 'duong-d',
          x1: 160,
          y1: 180,
          x2: 160,
          y2: 40,
          stroke: 'primary',
          strokeWidth: 4,
        },
        {
          kind: 'label',
          id: 'nhan-d',
          x: 168,
          y: 46,
          text: 'd',
          size: 15,
          fill: 'primary',
        },
        {
          kind: 'line',
          id: 'duong-a',
          x1: 70,
          y1: 165,
          x2: 250,
          y2: 195,
          stroke: 'accent',
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
          id: 'nhan-a',
          x: 258,
          y: 200,
          text: 'a',
          size: 14,
          fill: 'accent',
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
          kind: 'rect',
          id: 'vuong-a',
          x: 148,
          y: 166,
          w: 12,
          h: 12,
          stroke: 'correct',
          strokeWidth: 2,
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
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'duong-b',
          x1: 100,
          y1: 205,
          x2: 220,
          y2: 155,
          stroke: 'accent',
          strokeWidth: 3,
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
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-b',
          x: 228,
          y: 152,
          text: 'b',
          size: 14,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2200,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'rect',
          id: 'vuong-b',
          x: 162,
          y: 166,
          w: 12,
          h: 12,
          stroke: 'correct',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2600,
              opacity: 0,
            },
            {
              atMs: 3000,
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
          id: 'duong-c',
          x1: 95,
          y1: 180,
          x2: 225,
          y2: 180,
          stroke: 'warn',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
              rotate: 0,
            },
            {
              atMs: 3600,
              opacity: 0,
              rotate: 0,
            },
            {
              atMs: 4000,
              opacity: 1,
              rotate: 0,
            },
            {
              atMs: 5000,
              opacity: 1,
              rotate: 38,
            },
            {
              atMs: 6000,
              opacity: 1,
              rotate: -30,
            },
            {
              atMs: 7000,
              opacity: 1,
              rotate: 8,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-c',
          x: 160,
          y: 232,
          text: 'c quay quanh I: d ⊥ c ở MỌI vị trí',
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
          kind: 'label',
          id: 'ket',
          x: 160,
          y: 248,
          text: 'd ⊥ a, d ⊥ b, a ∩ b = I  ⇒  d ⊥ (P)',
          size: 13,
          anchor: 'middle',
          fill: 'accent',
        },
      ],
      captions: [
        {
          atMs: 500,
          text: 'Đường a nằm trong (P) và đi qua I.',
        },
        {
          atMs: 1300,
          text: 'Kiểm được d ⊥ a.',
        },
        {
          atMs: 2200,
          text: 'Đường b cũng nằm trong (P), CẮT a tại I chứ không song song.',
        },
        {
          atMs: 3000,
          text: 'Kiểm tiếp d ⊥ b. Hai điều kiện đã đủ.',
        },
        {
          atMs: 4700,
          text: 'Cho c quay quanh I quét hết mọi phương trong (P): d vẫn vuông góc với c.',
        },
        {
          atMs: 6600,
          text: 'Đó chính là nghĩa của d ⊥ (P). Bỏ chữ "cắt nhau" là kết luận sai ngay.',
        },
      ],
    },
    workedExample: {
      problem:
        'Cho hình chóp S.ABCD có đáy ABCD là hình vuông và SA vuông góc với mặt phẳng đáy. Chứng minh BD vuông góc ' +
        'với mặt phẳng (SAC).',
      steps: [
        'Bước 1 — Xác định mục tiêu và công cụ: muốn chứng minh BD ⊥ (SAC), theo định lí điều kiện đủ ta cần tìm HAI ' +
          'đường thẳng CẮT NHAU nằm trong (SAC) mà BD vuông góc với cả hai. Hai ứng viên hiển nhiên là AC và SA.',
        'Bước 2 — Chứng minh BD ⊥ AC: ABCD là hình vuông nên hai đường chéo vuông góc với nhau. Đây là tính chất của ' +
          'đáy, lấy được ngay từ giả thiết.',
        'Bước 3 — Chứng minh BD ⊥ SA: theo giả thiết SA ⊥ (ABCD), mà BD là một đường thẳng NẰM TRONG mặt phẳng ' +
          '(ABCD), nên SA vuông góc với BD. Đây là áp dụng trực tiếp định nghĩa đường vuông góc mặt phẳng.',
        'Bước 4 — Kiểm điều kiện "cắt nhau", bước không được bỏ qua: AC và SA cùng nằm trong mặt phẳng (SAC) và ' +
          'chúng cắt nhau tại điểm A. Nếu hai đường này song song thì lập luận sẽ sụp đổ.',
        'Bước 5 — Kết luận: BD vuông góc với hai đường thẳng cắt nhau AC và SA thuộc (SAC), nên BD ⊥ (SAC). ' +
          'Hệ quả tiện dùng về sau: BD vuông góc với MỌI đường thẳng trong (SAC), chẳng hạn BD ⊥ SC.',
      ],
      answer: 'BD ⊥ (SAC) vì BD vuông góc với hai đường cắt nhau AC và SA nằm trong mặt phẳng đó.',
    },
    checkQuestions: [
      {
        prompt:
          'Đường thẳng d vuông góc với hai đường thẳng a và b cùng nằm trong mặt phẳng (P). Có thể kết luận ' +
          'd ⊥ (P) hay không?',
        choices: [
          { id: 'luon', label: 'Luôn kết luận được' },
          { id: 'cat_nhau', label: 'Chỉ khi a và b cắt nhau' },
          { id: 'song_song', label: 'Chỉ khi a và b song song' },
          { id: 'khong', label: 'Không bao giờ kết luận được' },
        ],
        answer: { kind: 'choice', correctIds: ['cat_nhau'] },
        explain:
          'Điều kiện "hai đường CẮT NHAU" là bắt buộc và là chỗ sai nhiều nhất. Phản ví dụ khi a song song b: hãy ' +
          'tưởng tượng hai thanh ray song song trên mặt đất; một cây gậy đặt nằm ngang vuông góc với cả hai thanh ' +
          'ray vẫn nằm sát mặt đất chứ không hề dựng đứng. Hai đường song song chỉ "khoá" được một chiều; phải cắt ' +
          'nhau mới khoá đủ hai chiều để xác định mặt phẳng.',
      },
      {
        prompt:
          'Hình chóp S.ABC có SA ⊥ (ABC). Góc giữa cạnh SA và mặt phẳng đáy (ABC) bằng bao nhiêu độ?',
        answer: { kind: 'numeric', value: 90 },
        explain:
          'Khi đường thẳng vuông góc với mặt phẳng thì theo quy ước góc giữa chúng bằng 90°. Có thể hiểu qua định ' +
          'nghĩa: hình chiếu của SA lên đáy co lại thành một ĐIỂM (điểm A), không tạo ra được đường thẳng để đo góc, ' +
          'nên ta quy ước lấy giá trị lớn nhất có thể là 90°. Lưu ý góc giữa đường thẳng và mặt phẳng luôn nằm trong ' +
          'đoạn từ 0° đến 90°, không bao giờ tù.',
      },
      {
        prompt:
          'Hai đường thẳng a và b cùng vuông góc với mặt phẳng (P). Quan hệ giữa a và b là gì?',
        choices: [
          { id: 'song_song', label: 'Song song hoặc trùng nhau' },
          { id: 'vuong_goc', label: 'Vuông góc với nhau' },
          { id: 'cheo_nhau', label: 'Chéo nhau' },
          { id: 'bat_ky', label: 'Có thể ở vị trí bất kỳ' },
        ],
        answer: { kind: 'choice', correctIds: ['song_song'] },
        explain:
          'Hai đường thẳng cùng vuông góc với một mặt phẳng thì song song (hoặc trùng nhau). Hình dung: hai cột điện ' +
          'cùng dựng thẳng đứng trên một mặt sân phẳng thì luôn song song. Nhiều bạn chọn "vuông góc với nhau" vì bị ' +
          'từ "vuông góc" trong đề dẫn dắt — nhưng cùng vuông góc với một vật thể thứ ba thì hai vật kia lại song ' +
          'song với nhau, không phải vuông góc với nhau.',
      },
    ],
    srsCards: [
      {
        hoi: 'Điều kiện đủ để d ⊥ (P)?',
        dap: 'd vuông góc với hai đường thẳng CẮT NHAU nằm trong (P); nếu hai đường song song thì kết luận sai.',
      },
      {
        hoi: 'Định lí ba đường vuông góc dùng để làm gì?',
        dap: 'Chuyển bài toán vuông góc trong không gian về bài toán vuông góc với hình chiếu trong mặt phẳng.',
      },
      {
        hoi: 'Góc giữa đường thẳng và mặt phẳng được định nghĩa thế nào?',
        dap: 'Là góc giữa đường thẳng và hình chiếu vuông góc của nó lên mặt phẳng, luôn thuộc [0°; 90°].',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan11-c7-b2',
    grade: '11',
    chapterNumber: 7,
    chapterTitle: 'Quan hệ vuông góc trong không gian',
    lessonNumber: 2,
    title: 'Hai đường thẳng vuông góc và góc giữa đường thẳng với mặt phẳng',
    hook:
      'Người thợ xây khuyên: dựng thang tựa tường sao cho thang hợp với mặt sân một góc khoảng 75° thì vừa chắc vừa ' +
      'dễ leo. Nhưng thang là một đường thẳng trong không gian, còn mặt sân là cả một mặt phẳng — "góc" ở đây đo ' +
      'thế nào? Thợ nhìn bóng của thang in xuống sân lúc nắng đứng bóng rồi đo góc giữa thang và cái bóng ấy. Cái ' +
      'bóng đó chính là khái niệm hình chiếu vuông góc.',
    theory:
      'GÓC GIỮA HAI ĐƯỜNG THẲNG BẤT KÌ\n' +
      'Hai đường thẳng a và b cắt nhau thì có góc sẵn. Còn hai đường CHÉO NHAU thì không có điểm chung để mà đo. ' +
      'Cách làm: lấy một điểm O tuỳ ý, dựng a′ đi qua O song song với a, b′ đi qua O song song với b. Góc giữa a ' +
      'và b được định nghĩa là góc giữa a′ và b′, luôn thuộc [0°; 90°].\n' +
      'Vì sao định nghĩa này hợp lí: phép tịnh tiến một đường thẳng không đổi HƯỚNG của nó, mà góc giữa hai đường ' +
      'chỉ phụ thuộc hướng. Vì thế kết quả không phụ thuộc vào việc ta chọn điểm O ở đâu.\n' +
      'Hai đường thẳng vuông góc khi góc giữa chúng bằng 90°. BẪY: hai đường vuông góc có thể CẮT NHAU hoặc CHÉO ' +
      'NHAU. Hai cạnh AB và CC′ của hình lập phương vuông góc nhau nhưng không có điểm chung.\n' +
      'BẪY THỨ HAI: nếu tam giác cho góc tù 135° thì góc giữa hai đường là 45°, không phải 135°, vì góc giữa hai ' +
      'đường thẳng không bao giờ tù.\n' +
      'MẸO: chọn O là một đỉnh của hình, rồi tìm cạnh hoặc đường chéo SẴN CÓ song song với a (hoặc b). Trong lập ' +
      'phương, lăng trụ, hình hộp có rất nhiều cặp cạnh song song để tịnh tiến.\n\n' +
      'PHÉP CHIẾU VUÔNG GÓC\n' +
      'Cho mặt phẳng (P). Từ điểm M kẻ MH ⊥ (P) (H thuộc (P)); H là hình chiếu vuông góc của M. Hình chiếu của ' +
      'đường thẳng d (không vuông góc với (P)) là một đường thẳng d′ nằm trong (P), gồm hình chiếu của mọi điểm ' +
      'thuộc d. Vì sao là đường thẳng: các đường vuông góc hạ từ d xuống (P) song song với nhau nên chúng cùng nằm ' +
      'trong một mặt phẳng chứa d; mặt phẳng ấy cắt (P) theo d′. Nếu d ⊥ (P) thì hình chiếu của d co lại thành ' +
      'MỘT ĐIỂM.\n\n' +
      'GÓC GIỮA ĐƯỜNG THẲNG VÀ MẶT PHẲNG\n' +
      'Là góc φ giữa d và hình chiếu d′ của nó. Quy ước: d ∥ (P) hoặc d ⊂ (P) thì φ = 0°; d ⊥ (P) thì φ = 90°.\n' +
      'Vì sao chọn góc với hình chiếu: đó là góc NHỎ NHẤT trong mọi góc giữa d và các đường nằm trong (P), nên nó ' +
      'đo đúng "độ nghiêng" của d so với mặt phẳng.\n\n' +
      'QUY TRÌNH 3 BƯỚC TÍNH φ\n' +
      '1) Tìm giao điểm C của d với (P).\n' +
      '2) Lấy điểm S ≠ C trên d, dựng SH ⊥ (P). Thường đã có sẵn đường vuông góc với mặt: cạnh bên vuông góc đáy, ' +
      'chiều cao hình chóp.\n' +
      '3) Khi đó φ = góc SCH trong tam giác SHC vuông tại H: sin φ = SH/SC, cos φ = HC/SC, tan φ = SH/HC.\n' +
      'BẪY: lấy nhầm hình chiếu (kẻ đường xiên thay vì đường vuông góc), hoặc dùng sai tam giác — góc cần tính ' +
      'luôn nằm giữa đường thẳng đang xét và hình chiếu của nó, không phải giữa hai cạnh bất kì.',
    animation: {
      title: 'Hình chiếu vuông góc và góc giữa đường xiên với mặt phẳng',
      description:
        'Mặt phẳng (P) được vẽ dưới dạng hình bình hành. Điểm S nằm phía trên mặt phẳng; đoạn SH hạ vuông góc xuống (P) tại H, kèm kí hiệu góc vuông. Tiếp theo đường xiên SC xuất hiện, cắt (P) tại C. Hình chiếu của đường SC lên (P) là đoạn HC, được tô riêng. Cuối cùng góc φ tại C giữa SC và HC được đánh dấu: đây chính là góc giữa đường thẳng SC và mặt phẳng (P), tính trong tam giác SHC vuông tại H. Hình động nhấn mạnh rằng phải hạ đường vuông góc trước rồi mới tìm hình chiếu, và góc cần đo nằm giữa đường xiên với chính hình chiếu của nó.',
      viewBoxWidth: 320,
      viewBoxHeight: 250,
      durationMs: 7000,
      loop: true,
      shapes: [
        {
          kind: 'polyline',
          id: 'mat-phang',
          points: [
            [40, 170],
            [230, 170],
            [285, 225],
            [95, 225],
          ],
          closed: true,
          stroke: 'muted',
          strokeWidth: 2,
        },
        { kind: 'label', id: 'nhan-mp', x: 292, y: 232, text: '(P)', size: 13, fill: 'muted' },
        { kind: 'circle', id: 'diem-s', cx: 120, cy: 60, r: 5, fill: 'neutral' },
        {
          kind: 'label',
          id: 'nhan-s',
          x: 112,
          y: 56,
          text: 'S',
          size: 14,
          anchor: 'end',
          fill: 'neutral',
        },
        { kind: 'circle', id: 'diem-h', cx: 120, cy: 200, r: 5, fill: 'neutral' },
        {
          kind: 'label',
          id: 'nhan-h',
          x: 112,
          y: 216,
          text: 'H',
          size: 14,
          anchor: 'end',
          fill: 'neutral',
        },
        { kind: 'circle', id: 'diem-c', cx: 225, cy: 200, r: 5, fill: 'neutral' },
        { kind: 'label', id: 'nhan-c', x: 234, y: 216, text: 'C', size: 14, fill: 'neutral' },
        {
          kind: 'line',
          id: 'duong-sh',
          x1: 120,
          y1: 60,
          x2: 120,
          y2: 200,
          stroke: 'accent',
          strokeWidth: 3,
          dash: '5 3',
          origin: [120, 200],
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, scaleY: 0.01 },
            { atMs: 600, opacity: 1, scaleY: 0.01 },
            { atMs: 2000, opacity: 1, scaleY: 1 },
            { atMs: 7000, opacity: 1, scaleY: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-sh',
          x: 112,
          y: 130,
          text: 'SH ⊥ (P)',
          size: 12,
          anchor: 'end',
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2000, opacity: 0 },
            { atMs: 2300, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'vuong-h',
          x: 120,
          y: 188,
          w: 12,
          h: 12,
          stroke: 'correct',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2200, opacity: 0 },
            { atMs: 2600, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'duong-sc',
          x1: 120,
          y1: 60,
          x2: 225,
          y2: 200,
          stroke: 'primary',
          strokeWidth: 4,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3000, opacity: 0 },
            { atMs: 3400, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-sc',
          x: 182,
          y: 116,
          text: 'SC',
          size: 13,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3400, opacity: 0 },
            { atMs: 3800, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'duong-hc',
          x1: 120,
          y1: 200,
          x2: 225,
          y2: 200,
          stroke: 'warn',
          strokeWidth: 4,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4400, opacity: 0 },
            { atMs: 4800, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-hc',
          x: 172,
          y: 218,
          text: 'hình chiếu HC',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4800, opacity: 0 },
            { atMs: 5200, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-phi',
          x: 198,
          y: 192,
          text: 'φ',
          size: 14,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5400, opacity: 0 },
            { atMs: 5800, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'ket',
          x: 160,
          y: 244,
          text: 'Góc giữa SC và (P) = góc SCH = φ',
          size: 12,
          anchor: 'middle',
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5800, opacity: 0 },
            { atMs: 6200, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
      ],
      captions: [
        {
          atMs: 600,
          text: 'Điểm S nằm ngoài (P). Hạ SH vuông góc với (P): H là hình chiếu của S.',
        },
        { atMs: 2300, text: 'SH vuông góc với mọi đường nằm trong (P) — đó là đường vuông góc.' },
        { atMs: 3400, text: 'Đường xiên SC cắt mặt phẳng (P) tại C.' },
        { atMs: 4800, text: 'Hình chiếu của SC lên (P) là đoạn HC.' },
        {
          atMs: 5800,
          text: 'Góc giữa SC và (P) là góc SCH, tính trong tam giác SHC vuông tại H.',
        },
      ],
    },
    workedExample: {
      problem:
        'Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh a, SA vuông góc với mặt phẳng đáy và SA = a√2. ' +
        '(a) Tính góc giữa đường thẳng SC và mặt phẳng (ABCD). (b) Tính góc giữa hai đường thẳng SB và CD.',
      steps: [
        'Bước 1 — Câu (a), tìm hình chiếu: vì SA ⊥ (ABCD) nên hình chiếu của S lên đáy là A. Đường SC cắt đáy tại ' +
          'C, vậy hình chiếu của SC lên đáy là AC và góc cần tìm là góc SCA. Ta không phải dựng thêm gì vì đường ' +
          'vuông góc SA đã có sẵn.',
        'Bước 2 — Câu (a), tính trong tam giác vuông SAC (vuông tại A): AC là đường chéo hình vuông cạnh a nên ' +
          'AC = a√2. Khi đó tan SCA = SA/AC = a√2/(a√2) = 1, suy ra góc SCA = 45°.',
        'Bước 3 — Câu (b), chọn cách tịnh tiến: SB và CD chéo nhau (không cùng nằm trong một mặt phẳng). Ta để ý ' +
          'CD ∥ AB, nên góc giữa SB và CD bằng góc giữa SB và AB, tức là góc SBA (hai đường này cắt nhau tại B). ' +
          'Chọn AB vì nó nằm cùng tam giác SAB với SB.',
        'Bước 4 — Câu (b), tính góc SBA: SA ⊥ (ABCD) nên SA ⊥ AB, tam giác SAB vuông tại A với SA = a√2, AB = a. ' +
          'Suy ra SB = √(2a² + a²) = a√3 và cos SBA = AB/SB = 1/√3.',
        'Bước 5 — Kiểm tra: tan SBA = SA/AB = √2 > 0 và cos = 1/√3 ≈ 0,577 cho góc khoảng 54,7°, nhỏ hơn 90° nên ' +
          'đúng là góc nhọn như định nghĩa góc giữa hai đường thẳng đòi hỏi. Kiểm lại bằng sin: sin² + cos² = ' +
          '2/3 + 1/3 = 1.',
      ],
      answer: '(a) 45°. (b) cos φ = 1/√3, tức φ ≈ 54,7°.',
    },
    checkQuestions: [
      {
        prompt: 'Hai đường thẳng a và b chéo nhau. Góc giữa a và b được xác định bằng cách nào?',
        choices: [
          {
            id: 'tinh_tien',
            label: 'Lấy điểm O bất kì, dựng a′ ∥ a và b′ ∥ b qua O, rồi đo góc giữa a′ và b′',
          },
          { id: 'ngan_nhat', label: 'Đo khoảng cách ngắn nhất giữa a và b' },
          { id: 'khong_co', label: 'Không xác định được vì a và b không cắt nhau' },
          { id: 'tu', label: 'Lấy góc tù giữa a′ và b′' },
        ],
        answer: { kind: 'choice', correctIds: ['tinh_tien'] },
        explain:
          'Hai đường chéo nhau không có điểm chung nên phải kéo về cùng một điểm bằng cách dựng đường song song; ' +
          'phép tịnh tiến không đổi hướng nên kết quả không phụ thuộc điểm O. Nhầm lẫn thường gặp là nghĩ chéo ' +
          'nhau thì không có góc, hoặc lẫn "góc" với "khoảng cách"; góc giữa hai đường còn không bao giờ tù.',
      },
      {
        prompt:
          'Cho hình lập phương ABCD.A′B′C′D′. Tính số đo (độ) của góc giữa hai đường thẳng A′C′ và AB′.',
        answer: { kind: 'numeric', value: 60 },
        explain:
          'A′C′ ∥ AC nên góc giữa A′C′ và AB′ bằng góc giữa AC và AB′, tức góc B′AC. Ba đoạn AB′, B′C, AC đều là ' +
          'đường chéo của các mặt hình vuông bằng nhau, nên tam giác AB′C đều và góc bằng 60°. Lỗi hay gặp là tính ' +
          'trực tiếp trên hình vẽ mà không tịnh tiến, rồi kết luận nhầm là 90° hoặc 45°.',
      },
      {
        prompt:
          'Hình lập phương ABCD.A′B′C′D′. Tính góc (độ) giữa đường chéo AC′ và mặt phẳng đáy (ABCD). Làm tròn ' +
          'đến hai chữ số thập phân.',
        answer: { kind: 'numeric', value: 35.26, tolerance: { mode: 'absolute', eps: 0.05 } },
        explain:
          'Hình chiếu của C′ lên đáy là C nên hình chiếu của AC′ là AC, góc cần tìm là góc C′AC trong tam giác ' +
          'vuông ACC′. Với cạnh a: CC′ = a, AC = a√2 nên tan = 1/√2 ≈ 0,7071 và góc ≈ 35,26°. Lỗi hay gặp là ' +
          'lấy tan = a/a = 1 vì quên rằng AC là đường chéo của hình vuông chứ không phải một cạnh.',
      },
      {
        prompt: 'Hai đường thẳng a và b vuông góc với nhau. Khẳng định nào sau đây đúng?',
        choices: [
          { id: 'cat', label: 'a và b nhất định phải cắt nhau' },
          { id: 'cheo_hoac_cat', label: 'a và b có thể cắt nhau hoặc chéo nhau' },
          { id: 'song', label: 'a và b có thể song song' },
          { id: 'dong_phang', label: 'a và b nhất định cùng nằm trong một mặt phẳng' },
        ],
        answer: { kind: 'choice', correctIds: ['cheo_hoac_cat'] },
        explain:
          'Vuông góc chỉ nói về góc giữa hai hướng bằng 90°, không đòi hỏi có điểm chung. Trong hình lập phương, ' +
          'AB và CC′ vuông góc nhau nhưng chéo nhau; AB và AD vuông góc và cắt nhau. Hai đường song song thì góc ' +
          'giữa chúng bằng 0°, nên không thể vuông góc.',
      },
    ],
    srsCards: [
      {
        hoi: 'Góc giữa hai đường thẳng chéo nhau a và b là gì?',
        dap: 'Là góc giữa hai đường a′ ∥ a và b′ ∥ b cùng đi qua một điểm O tuỳ ý; luôn thuộc [0°; 90°].',
      },
      {
        hoi: 'Các bước tính góc giữa đường thẳng d và mặt phẳng (P)?',
        dap: 'Tìm giao điểm C, lấy S trên d, hạ SH ⊥ (P); góc cần tìm là góc SCH trong tam giác SHC vuông tại H.',
      },
      {
        hoi: 'Hai đường thẳng vuông góc có nhất thiết cắt nhau không?',
        dap: 'Không. Chúng có thể chéo nhau, ví dụ AB và CC′ trong hình lập phương.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan11-c7-b3',
    grade: '11',
    chapterNumber: 7,
    chapterTitle: 'Quan hệ vuông góc trong không gian',
    lessonNumber: 3,
    title: 'Hai mặt phẳng vuông góc và góc nhị diện',
    hook:
      'Cánh cửa tủ quần áo mở dần: lúc đầu khép sát thân tủ, rồi hé ra, rồi mở thẳng góc, rồi mở toang quá mức. ' +
      'Mỗi lúc như vậy cánh cửa và thân tủ cho một "độ mở" khác nhau. Độ mở ấy chính là góc nhị diện, còn lúc cánh ' +
      'cửa mở đúng 90° thì hai mặt phẳng vuông góc. Mái nhà dốc bao nhiêu độ so với sàn cũng đo bằng đúng loại ' +
      'góc này.',
    theory:
      'GÓC NHỊ DIỆN VÀ GÓC PHẲNG NHỊ DIỆN\n' +
      'Hai nửa mặt phẳng có chung bờ d tạo nên một góc nhị diện, giống cuốn sách mở ra với gáy sách là bờ d. ' +
      'Để đo nó, lấy điểm O trên d, kẻ tia Ox nằm trong nửa mặt phẳng thứ nhất và tia Oy nằm trong nửa mặt phẳng ' +
      'thứ hai, cả hai cùng vuông góc với d. Góc xOy gọi là góc phẳng nhị diện; số đo nó chính là số đo của góc ' +
      'nhị diện và không phụ thuộc vào vị trí O.\n' +
      'Vì sao phải kẻ cả hai tia vuông góc với bờ: mặt phẳng (xOy) khi đó vuông góc với d, như một nhát cắt ngang ' +
      'cuốn sách cho thấy hình dạng thật của độ mở. Kẻ tia xiên thì góc đo được sẽ lớn hơn thực tế.\n' +
      'Số đo góc nhị diện thuộc [0°; 180°].\n\n' +
      'GÓC GIỮA HAI MẶT PHẲNG CẮT NHAU\n' +
      'Hai mặt phẳng cắt nhau tạo ra bốn góc nhị diện, chúng bù nhau từng cặp (φ và 180° − φ). Góc giữa hai mặt ' +
      'phẳng là góc nhỏ hơn hoặc bằng 90° trong số đó. Hai mặt phẳng song song hoặc trùng nhau thì góc giữa ' +
      'chúng bằng 0°.\n' +
      'BẪY: nếu góc nhị diện là 120° thì góc giữa hai mặt phẳng là 60°, không phải 120°.\n\n' +
      'HAI MẶT PHẲNG VUÔNG GÓC\n' +
      '(P) ⊥ (Q) khi góc giữa chúng bằng 90° (góc nhị diện vuông).\n' +
      'ĐIỀU KIỆN ĐỦ: nếu (P) chứa một đường thẳng vuông góc với (Q) thì (P) ⊥ (Q). Điều này quy về bài trước: ' +
      'chỉ cần TÌM MỘT đường thẳng. Cánh cửa vuông góc với sàn vì bản lề dựng đứng, tức là một đường nằm trong ' +
      'mặt phẳng cánh cửa và vuông góc với sàn.\n' +
      'CÁC TÍNH CHẤT HAY DÙNG\n' +
      '— Nếu (P) ⊥ (Q) và giao tuyến là c, đường thẳng a nằm trong (P) vuông góc với c thì a ⊥ (Q). Đây là cách ' +
      '"tạo" ra đường vuông góc mặt phẳng, rất hay dùng để dựng chiều cao. Chú ý a phải nằm TRONG (P) và vuông ' +
      'góc với đúng GIAO TUYẾN.\n' +
      '— Nếu (P) ⊥ (R), (Q) ⊥ (R) và (P) cắt (Q) theo giao tuyến c thì c ⊥ (R). Hình dung: hai bức tường cùng ' +
      'vuông góc với nền nhà thì mép góc tường vuông góc với nền.\n' +
      '— Nếu d ⊥ (Q) thì mọi mặt phẳng chứa d đều vuông góc với (Q).\n\n' +
      'CÁCH TÍNH GÓC NHỊ DIỆN TRONG HÌNH CHÓP\n' +
      '1) Xác định giao tuyến của hai mặt phẳng.\n' +
      '2) Trong mỗi mặt phẳng, kẻ đường thẳng vuông góc với giao tuyến tại CÙNG một điểm (thường là trung điểm ' +
      'cạnh đáy).\n' +
      '3) Tính góc giữa hai đường vừa kẻ bằng tam giác vuông.\n' +
      'Ví dụ hình chóp tứ giác đều S.ABCD có cạnh đáy a, chiều cao SO (O là tâm đáy): gọi M là trung điểm AB thì ' +
      'OM ⊥ AB (trong đáy) và SM ⊥ AB (tam giác SAB cân tại S). Góc giữa mặt bên (SAB) và đáy là góc SMO, ' +
      'với tan SMO = SO/OM = SO/(a/2).',
    animation: {
      title: 'Góc nhị diện mở dần: góc phẳng, góc vuông và góc tù',
      description:
        'Hình vẽ nhìn dọc theo giao tuyến của hai nửa mặt phẳng, nên giao tuyến chỉ còn là điểm O, và mỗi nửa mặt phẳng chỉ còn là một tia xuất phát từ O. Tia (P) nằm ngang cố định. Tia thứ hai, thuộc nửa mặt phẳng còn lại, quay quanh O từ 30° lên 90° rồi lên 135°. Số đo góc giữa hai tia chính là góc phẳng nhị diện, được ghi ở góc trên bên trái. Khi mở đúng 90° hiện kí hiệu góc vuông: hai mặt phẳng vuông góc. Khi mở đến 135° là góc tù, và góc giữa hai mặt phẳng lúc đó là phần bù nhọn 45°.',
      viewBoxWidth: 320,
      viewBoxHeight: 250,
      durationMs: 8000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'tia-p',
          x1: 170,
          y1: 190,
          x2: 290,
          y2: 190,
          stroke: 'primary',
          strokeWidth: 4,
        },
        {
          kind: 'label',
          id: 'nhan-p',
          x: 286,
          y: 208,
          text: '(P)',
          size: 13,
          anchor: 'end',
          fill: 'primary',
        },
        {
          kind: 'line',
          id: 'tia-q',
          x1: 170,
          y1: 190,
          x2: 290,
          y2: 190,
          stroke: 'accent',
          strokeWidth: 4,
          origin: [170, 190],
          keyframes: [
            { atMs: 0, rotate: -30 },
            { atMs: 1500, rotate: -30 },
            { atMs: 3000, rotate: -90 },
            { atMs: 4500, rotate: -90 },
            { atMs: 6000, rotate: -135 },
            { atMs: 8000, rotate: -135 },
          ],
        },
        {
          kind: 'circle',
          id: 'dau-q',
          cx: 290,
          cy: 190,
          r: 4,
          fill: 'accent',
          origin: [170, 190],
          keyframes: [
            { atMs: 0, rotate: -30 },
            { atMs: 1500, rotate: -30 },
            { atMs: 3000, rotate: -90 },
            { atMs: 4500, rotate: -90 },
            { atMs: 6000, rotate: -135 },
            { atMs: 8000, rotate: -135 },
          ],
        },
        { kind: 'circle', id: 'diem-o', cx: 170, cy: 190, r: 5, fill: 'neutral' },
        {
          kind: 'label',
          id: 'nhan-o',
          x: 162,
          y: 208,
          text: 'O',
          size: 14,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'rect',
          id: 'vuong',
          x: 170,
          y: 178,
          w: 12,
          h: 12,
          stroke: 'correct',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2800, opacity: 0 },
            { atMs: 3200, opacity: 1 },
            { atMs: 4400, opacity: 1 },
            { atMs: 4800, opacity: 0 },
            { atMs: 8000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'do-1',
          x: 14,
          y: 30,
          text: 'φ = 30° (góc nhọn)',
          size: 13,
          fill: 'neutral',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 1900, opacity: 1 },
            { atMs: 2200, opacity: 0 },
            { atMs: 8000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'do-2',
          x: 14,
          y: 30,
          text: 'φ = 90°  ⇒  (P) ⊥ (Q)',
          size: 13,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2800, opacity: 0 },
            { atMs: 3200, opacity: 1 },
            { atMs: 4400, opacity: 1 },
            { atMs: 4700, opacity: 0 },
            { atMs: 8000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'do-3',
          x: 14,
          y: 30,
          text: 'φ = 135° (tù): góc giữa hai mp là 45°',
          size: 13,
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5800, opacity: 0 },
            { atMs: 6200, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'ket',
          x: 160,
          y: 240,
          text: 'Nhìn dọc theo giao tuyến: chỉ còn thấy điểm O',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Nhìn dọc theo giao tuyến, mỗi nửa mặt phẳng chỉ còn là một tia xuất phát từ O.',
        },
        { atMs: 1500, text: 'Mở dần tia thứ hai quanh O: góc phẳng nhị diện tăng lên.' },
        { atMs: 3200, text: 'Đến 90°: góc nhị diện vuông, hai mặt phẳng vuông góc với nhau.' },
        {
          atMs: 6200,
          text: 'Quá 90° là nhị diện tù; góc giữa hai mặt phẳng lấy phần bù nhọn là 45°.',
        },
      ],
    },
    workedExample: {
      problem:
        'Cho hình chóp tứ giác đều S.ABCD có cạnh đáy bằng a và chiều cao SO = a√3/2 (O là tâm của đáy). Tính ' +
        'góc giữa mặt bên (SAB) và mặt đáy (ABCD).',
      steps: [
        'Bước 1 — Xác định giao tuyến: hai mặt phẳng (SAB) và (ABCD) cắt nhau theo đường thẳng AB. Mục tiêu là ' +
          'dựng hai đường, mỗi đường nằm trong một mặt phẳng và cùng vuông góc với AB tại một điểm.',
        'Bước 2 — Chọn điểm: gọi M là trung điểm của AB. Chọn trung điểm vì tam giác SAB cân tại S (hình chóp ' +
          'đều có các cạnh bên bằng nhau) nên đường trung tuyến SM đồng thời là đường cao: SM ⊥ AB.',
        'Bước 3 — Đường thứ hai: O và M lần lượt là trung điểm của BD và AB nên OM là đường trung bình của tam ' +
          'giác ABD, suy ra OM ∥ AD và OM = a/2. Mà AD ⊥ AB nên OM ⊥ AB. Vậy SM và OM cùng vuông góc với AB tại ' +
          'M, nên góc giữa hai mặt phẳng là góc SMO.',
        'Bước 4 — Tính: SO ⊥ (ABCD) nên SO ⊥ OM, tam giác SOM vuông tại O. Khi đó tan SMO = SO/OM = ' +
          '(a√3/2)/(a/2) = √3, suy ra góc SMO = 60°.',
        'Bước 5 — Kiểm tra: góc 60° là góc nhọn, đúng với yêu cầu góc giữa hai mặt phẳng nằm trong [0°; 90°]. ' +
          'Kiểm bằng cạnh huyền: SM = √(SO² + OM²) = √(3a²/4 + a²/4) = a, và cos SMO = OM/SM = 1/2, ' +
          'cho cùng góc 60°.',
      ],
      answer: 'Góc giữa mặt bên (SAB) và đáy bằng 60° (góc SMO với M là trung điểm AB).',
    },
    checkQuestions: [
      {
        prompt: 'Điều kiện nào sau đây đủ để kết luận mặt phẳng (P) vuông góc với mặt phẳng (Q)?',
        choices: [
          { id: 'chua_vuong', label: '(P) chứa một đường thẳng vuông góc với (Q)' },
          { id: 'chua_song_song', label: '(P) chứa một đường thẳng song song với (Q)' },
          {
            id: 'chua_hai_vuong',
            label: '(P) chứa hai đường thẳng cùng vuông góc với một đường nào đó của (Q)',
          },
          { id: 'cat_nhau', label: '(P) và (Q) có điểm chung' },
        ],
        answer: { kind: 'choice', correctIds: ['chua_vuong'] },
        explain:
          'Điều kiện đủ là "(P) chứa một đường thẳng vuông góc với (Q)": khi đó cả mặt phẳng (P) được dựng từ một ' +
          'đường vuông góc với (Q) nên góc nhị diện vuông. Chứa đường song song với (Q) thì chỉ cho (P) cắt hoặc ' +
          'song song (Q) mà không rõ góc; có điểm chung chỉ nói hai mặt phẳng cắt nhau, chưa nói góc bằng bao nhiêu.',
      },
      {
        prompt:
          'Hình lập phương ABCD.A′B′C′D′. Tính góc (độ) giữa hai mặt phẳng (A′BCD′) và (ABCD).',
        answer: { kind: 'numeric', value: 45 },
        explain:
          'Giao tuyến của hai mặt phẳng là BC. Trong (ABCD) có AB ⊥ BC; trong (A′BCD′) có A′B ⊥ BC (vì BC ⊥ mặt ' +
          '(ABB′A′)). Vậy góc phẳng nhị diện là góc A′BA, tam giác vuông cân AA′B nên bằng 45°. Lỗi hay gặp là ' +
          'tưởng góc là 90° vì nhầm với góc A′BC giữa hai đường BA′ và BC, trong khi góc nhị diện là góc A′BA.',
      },
      {
        prompt:
          'Hình chóp tứ giác đều có cạnh đáy bằng 8 và chiều cao bằng 3. Tính tan của góc giữa mặt bên và mặt ' +
          'đáy, viết dưới dạng phân số tối giản.',
        answer: { kind: 'fraction', num: 3, den: 4, requireSimplified: true },
        explain:
          'Gọi M là trung điểm một cạnh đáy thì OM bằng nửa cạnh đáy, tức là 4, và góc giữa mặt bên với đáy là ' +
          'góc SMO nên tan = SO/OM = 3/4. Lỗi hay gặp là chia cho cả cạnh đáy 8 (cho 3/8) vì quên rằng khoảng cách ' +
          'từ tâm đến cạnh chỉ bằng một nửa cạnh đáy.',
      },
      {
        prompt:
          'Hai mặt phẳng cắt nhau tạo ra một góc nhị diện có số đo 120°. Góc giữa hai mặt phẳng đó bằng bao nhiêu?',
        choices: [
          { id: 'g30', label: '30°' },
          { id: 'g60', label: '60°' },
          { id: 'g90', label: '90°' },
          { id: 'g120', label: '120°' },
        ],
        answer: { kind: 'choice', correctIds: ['g60'] },
        explain:
          'Hai mặt phẳng cắt nhau tạo ra các góc nhị diện bù nhau: 120° và 180° − 120° = 60°. Góc giữa hai mặt ' +
          'phẳng luôn lấy góc nhỏ hơn hoặc bằng 90°, nên bằng 60°. Chọn 120° là lẫn "góc nhị diện" với "góc giữa ' +
          'hai mặt phẳng".',
      },
    ],
    srsCards: [
      {
        hoi: 'Góc phẳng nhị diện được dựng thế nào?',
        dap: 'Lấy O trên bờ chung, kẻ trong mỗi nửa mặt phẳng một tia vuông góc với bờ; góc giữa hai tia là số đo nhị diện.',
      },
      {
        hoi: 'Điều kiện đủ để (P) ⊥ (Q)?',
        dap: '(P) chứa một đường thẳng vuông góc với (Q).',
      },
      {
        hoi: 'Hai mặt phẳng vuông góc, đường a trong (P) cần điều kiện gì để a ⊥ (Q)?',
        dap: 'a vuông góc với giao tuyến của (P) và (Q).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan11-c7-b4',
    grade: '11',
    chapterNumber: 7,
    chapterTitle: 'Quan hệ vuông góc trong không gian',
    lessonNumber: 4,
    title: 'Khoảng cách trong không gian',
    hook:
      'Muốn biết bóng đèn treo trần cách sàn bao nhiêu mét, thợ điện thả dây dọi thẳng đứng xuống sàn chứ không ' +
      'kéo thước xiên tới một góc phòng. Còn hai đường ống nước chạy ở hai tầng khác nhau, không song song cũng ' +
      'không cắt nhau thì khoảng cách giữa chúng đo thế nào? Mọi câu hỏi kiểu ấy trong không gian đều quy về một ' +
      'việc: đo đoạn thẳng vuông góc với mặt phẳng.',
    theory:
      'KHOẢNG CÁCH TỪ ĐIỂM TỚI MẶT PHẲNG\n' +
      'Cho điểm M và mặt phẳng (P). Hạ MH ⊥ (P) (H thuộc (P)), khi đó d(M,(P)) = MH. Vì sao là đoạn vuông góc: ' +
      'với mọi điểm K khác H trên (P), tam giác MHK vuông tại H nên MK > MH — đoạn vuông góc là ngắn nhất, và ' +
      'khoảng cách luôn được hiểu là khoảng ngắn nhất.\n\n' +
      'KHOẢNG CÁCH GIỮA ĐƯỜNG THẲNG VÀ MẶT PHẲNG SONG SONG, GIỮA HAI MẶT PHẲNG SONG SONG\n' +
      'Nếu đường thẳng a ∥ (P) thì mọi điểm của a cách (P) một khoảng như nhau (vì a và (P) "cách đều"), nên ' +
      'd(a,(P)) = d(M,(P)) với M là điểm BẤT KÌ trên a. Ta tha hồ chọn M sao cho dễ tính nhất.\n' +
      'Tương tự, hai mặt phẳng song song (P) ∥ (Q): d((P),(Q)) = d(M,(Q)) với M là điểm bất kì của (P).\n' +
      'BẪY: công thức này chỉ đúng khi a ∥ (P). Nếu a cắt (P) thì khoảng cách bằng 0.\n\n' +
      'KHOẢNG CÁCH GIỮA HAI ĐƯỜNG THẲNG CHÉO NHAU\n' +
      'Hai đường a, b chéo nhau có duy nhất một đường vuông góc chung, và đoạn nối hai chân của nó là khoảng ' +
      'cách d(a,b). Trong bài tập ta hầu như không đi dựng đoạn đó mà QUY VỀ ĐIỂM–MẶT:\n' +
      '1) Dựng mặt phẳng (P) chứa b và song song với a (lấy đường thẳng qua một điểm của b song song với a).\n' +
      '2) Khi đó d(a,b) = d(a,(P)) = d(M,(P)) với M ∈ a bất kì.\n' +
      'Nếu a và b nằm trong hai mặt phẳng song song thì d(a,b) bằng khoảng cách giữa hai mặt phẳng ấy.\n\n' +
      'BA CÔNG CỤ TÍNH d(M,(P))\n' +
      '1) Dựng hình chiếu. Nếu có sẵn một mặt phẳng (R) chứa M và vuông góc với (P), gọi c = (R) ∩ (P), ' +
      'chỉ cần kẻ MH ⊥ c trong (R): theo bài trước, MH ⊥ (P). Đây là cách dựng nhanh nhất.\n' +
      '2) Đổi điểm bằng tỉ lệ. Nếu đường thẳng MN cắt (P) tại I thì d(M,(P))/d(N,(P)) = IM/IN (hai tam giác ' +
      'vuông đồng dạng). Dùng khi điểm đề cho khó, còn điểm kế bên dễ.\n' +
      '3) Dùng thể tích. Vì V = ⅓·S·h nên h = 3V/S: lấy khối chóp có đỉnh M và đáy là một miền trong (P), tính V ' +
      'bằng cách khác (đáy và đường cao dễ), rồi chia cho diện tích S của miền ấy. Dùng khi hình chiếu khó dựng.\n' +
      'BẪY: nhầm đường cao của mặt bên (hạ từ đỉnh xuống cạnh đáy) với khoảng cách tới mặt phẳng; hoặc dùng tỉ ' +
      'lệ IM/IN mà lấy nhầm I (I phải là giao điểm của đường thẳng MN với (P), không phải điểm tuỳ ý).',
    animation: {
      title: 'Đường thẳng song song với mặt phẳng: mọi điểm cách đều mặt phẳng',
      description:
        'Mặt phẳng (P) được vẽ dưới dạng hình bình hành nằm ngang, phía trên có đường thẳng a song song với (P). Điểm M ở trên a, đoạn thẳng MH hạ vuông góc xuống (P) tại H, có kí hiệu góc vuông. Sau đó M trượt dọc theo a sang phải, đoạn MH trượt theo nhưng chiều dài không đổi, rồi trượt trở lại. Hình động cho thấy khoảng cách từ một điểm của a đến (P) giống nhau ở mọi vị trí của M, vì vậy d(a,(P)) bằng khoảng cách từ một điểm bất kì của a tới (P) và ta chọn điểm nào dễ tính nhất.',
      viewBoxWidth: 320,
      viewBoxHeight: 250,
      durationMs: 6000,
      loop: true,
      shapes: [
        {
          kind: 'polyline',
          id: 'mat-phang',
          points: [
            [40, 170],
            [230, 170],
            [285, 225],
            [95, 225],
          ],
          closed: true,
          stroke: 'muted',
          strokeWidth: 2,
        },
        { kind: 'label', id: 'nhan-mp', x: 292, y: 232, text: '(P)', size: 13, fill: 'muted' },
        {
          kind: 'line',
          id: 'duong-a',
          x1: 60,
          y1: 80,
          x2: 260,
          y2: 80,
          stroke: 'primary',
          strokeWidth: 4,
        },
        { kind: 'label', id: 'nhan-a', x: 268, y: 84, text: 'a', size: 14, fill: 'primary' },
        {
          kind: 'circle',
          id: 'diem-m',
          cx: 100,
          cy: 80,
          r: 5,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: 120 },
            { atMs: 3500, dx: 120 },
            { atMs: 5500, dx: 0 },
            { atMs: 6000, dx: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-m',
          x: 100,
          y: 68,
          text: 'M',
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: 120 },
            { atMs: 3500, dx: 120 },
            { atMs: 5500, dx: 0 },
            { atMs: 6000, dx: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'doan-mh',
          x1: 100,
          y1: 80,
          x2: 100,
          y2: 200,
          stroke: 'accent',
          strokeWidth: 3,
          dash: '5 3',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: 120 },
            { atMs: 3500, dx: 120 },
            { atMs: 5500, dx: 0 },
            { atMs: 6000, dx: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-d',
          x: 108,
          y: 145,
          text: 'd',
          size: 14,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: 120 },
            { atMs: 3500, dx: 120 },
            { atMs: 5500, dx: 0 },
            { atMs: 6000, dx: 0 },
          ],
        },
        {
          kind: 'rect',
          id: 'vuong-h',
          x: 100,
          y: 188,
          w: 12,
          h: 12,
          stroke: 'correct',
          strokeWidth: 2,
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: 120 },
            { atMs: 3500, dx: 120 },
            { atMs: 5500, dx: 0 },
            { atMs: 6000, dx: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'diem-h',
          cx: 100,
          cy: 200,
          r: 4,
          fill: 'neutral',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: 120 },
            { atMs: 3500, dx: 120 },
            { atMs: 5500, dx: 0 },
            { atMs: 6000, dx: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-h',
          x: 94,
          y: 216,
          text: 'H',
          size: 14,
          anchor: 'end',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: 120 },
            { atMs: 3500, dx: 120 },
            { atMs: 5500, dx: 0 },
            { atMs: 6000, dx: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'ket',
          x: 160,
          y: 246,
          text: 'M trượt trên a: d(M,(P)) vẫn không đổi',
          size: 12,
          anchor: 'middle',
          fill: 'accent',
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Đường thẳng a song song với (P). Lấy M trên a, hạ MH vuông góc với (P).',
        },
        { atMs: 800, text: 'Cho M trượt dọc theo a: đoạn MH trượt theo nhưng độ dài không đổi.' },
        { atMs: 3200, text: 'Vì a ∥ (P) nên mọi điểm của a cách (P) một khoảng như nhau.' },
        {
          atMs: 4600,
          text: 'Vậy d(a,(P)) = d(M,(P)) với M bất kì trên a: chọn điểm nào dễ tính nhất.',
        },
      ],
    },
    workedExample: {
      problem:
        'Cho hình chóp S.ABC có SA vuông góc với mặt phẳng (ABC), tam giác ABC vuông tại B, SA = 3, AB = 4 và ' +
        'BC = 5. Tính khoảng cách từ A đến mặt phẳng (SBC), và kiểm lại bằng cách dùng thể tích.',
      steps: [
        'Bước 1 — Chọn công cụ: A cách (SBC) mà ta chưa thấy đường vuông góc nào sẵn. Ta thử tạo ra mặt phẳng ' +
          'chứa A và vuông góc (SBC) rồi kẻ đường cao trong đó.',
        'Bước 2 — Chứng minh BC ⊥ (SAB): BC ⊥ AB (tam giác ABC vuông tại B) và BC ⊥ SA (vì SA ⊥ (ABC)), hai ' +
          'đường AB, SA cắt nhau tại A trong (SAB). Suy ra (SBC) chứa BC mà BC ⊥ (SAB), nên (SBC) ⊥ (SAB), ' +
          'giao tuyến là SB.',
        'Bước 3 — Dựng đường vuông góc: trong (SAB) kẻ AH ⊥ SB (H thuộc SB). Vì AH nằm trong mặt phẳng vuông ' +
          'góc với (SBC) và vuông góc với giao tuyến SB, nên AH ⊥ (SBC). Vậy d(A,(SBC)) = AH.',
        'Bước 4 — Tính: tam giác SAB vuông tại A có SA = 3, AB = 4 nên SB = 5. Dùng hai cách tính diện tích: ' +
          'AH·SB = SA·AB, suy ra AH = 3·4/5 = 12/5 = 2,4.',
        'Bước 5 — Tự kiểm bằng thể tích: V(S.ABC) = ⅓·(½·4·5)·3 = 10. Tam giác SBC vuông tại B (vì BC ⊥ (SAB) ' +
          'nên BC ⊥ SB) với SB = 5, BC = 5 nên diện tích bằng 12,5. Khoảng cách từ A đến (SBC) là 3V/S = 30/12,5 ' +
          '= 2,4, trùng khớp.',
      ],
      answer: 'd(A,(SBC)) = 12/5 = 2,4.',
    },
    checkQuestions: [
      {
        prompt:
          'Đường thẳng a song song với mặt phẳng (P). Lấy hai điểm A và B bất kì trên a. Khẳng định nào đúng?',
        choices: [
          { id: 'bang', label: 'd(A,(P)) = d(B,(P))' },
          { id: 'lon', label: 'Điểm nào gần chân đường vuông góc hơn thì cách (P) xa hơn' },
          { id: 'khac', label: 'Hai khoảng cách khác nhau tuỳ vị trí A, B' },
          { id: 'khong', label: 'Cả hai khoảng cách đều bằng 0' },
        ],
        answer: { kind: 'choice', correctIds: ['bang'] },
        explain:
          'Hạ AH, BK vuông góc với (P): AH ∥ BK cùng vuông góc với (P), và AB ∥ HK vì a ∥ (P), nên ABKH là hình ' +
          'chữ nhật và AH = BK. Do đó mọi điểm trên a cách (P) như nhau. Lỗi hay gặp là nhầm với trường hợp a cắt ' +
          '(P): khi đó khoảng cách các điểm khác nhau và đường thẳng có một điểm cách bằng 0.',
      },
      {
        prompt:
          'Hình lập phương ABCD.A′B′C′D′ có cạnh bằng 6. Tính khoảng cách giữa hai đường thẳng chéo nhau A′B và ' +
          'B′C. Làm tròn đến hai chữ số thập phân.',
        answer: { kind: 'numeric', value: 3.4641, tolerance: { mode: 'absolute', eps: 0.005 } },
        explain:
          'Vì A′B ∥ D′C nên A′B song song với mặt phẳng (B′CD′), và d(A′B, B′C) = d(A′,(B′CD′)). Khối A′.B′CD′ có ' +
          'V = ⅓·(½·6·6)·6 = 36, còn đáy B′CD′ là tam giác đều cạnh 6√2 nên S = (√3/4)·72 = 18√3. ' +
          'Do đó khoảng cách = 3·36/(18√3) = 6/√3 = 2√3 ≈ 3,46. Lỗi hay gặp là lấy luôn độ dài cạnh 6 vì tưởng ' +
          'hai đường vuông góc với nhau thì khoảng cách bằng cạnh.',
      },
      {
        prompt:
          'Đoạn thẳng AB cắt mặt phẳng (P) tại I, với IA = 3·IB. Biết khoảng cách từ A đến (P) bằng 12. Tính ' +
          'khoảng cách từ B đến (P).',
        answer: { kind: 'numeric', value: 4 },
        explain:
          'Hạ AH và BK vuông góc với (P): AH ∥ BK nên hai tam giác vuông IAH và IBK đồng dạng, suy ra AH/BK = ' +
          'IA/IB = 3. Vậy BK = 12/3 = 4. Lỗi hay gặp là cho hai khoảng cách bằng nhau hoặc lấy 12 − 3 = 9; ' +
          'khoảng cách tỉ lệ với khoảng cách tới giao điểm I, không phải cộng hay trừ.',
      },
      {
        prompt: 'Khoảng cách giữa hai đường thẳng chéo nhau a và b bằng đại lượng nào sau đây?',
        choices: [
          {
            id: 'mat_song_song',
            label: 'Khoảng cách từ a đến mặt phẳng chứa b và song song với a',
          },
          {
            id: 'hai_diem',
            label: 'Khoảng cách giữa hai điểm bất kì, một điểm trên a, một điểm trên b',
          },
          {
            id: 'trung_diem',
            label: 'Khoảng cách giữa hai trung điểm của hai đoạn thẳng thuộc a và b',
          },
          { id: 'bang_khong', label: 'Luôn bằng 0 vì chúng không song song' },
        ],
        answer: { kind: 'choice', correctIds: ['mat_song_song'] },
        explain:
          'Dựng mặt phẳng (P) chứa b và song song với a thì d(a,b) = d(a,(P)) và quy về khoảng cách từ một điểm ' +
          'đến mặt phẳng. Khoảng cách hai điểm bất kì thay đổi theo vị trí điểm; hai trung điểm cũng vậy. Hai ' +
          'đường chéo nhau không có điểm chung nên khoảng cách luôn dương, không bao giờ bằng 0.',
      },
    ],
    srsCards: [
      {
        hoi: 'Khoảng cách từ điểm M đến mặt phẳng (P) là gì?',
        dap: 'Là độ dài đoạn MH với H là hình chiếu vuông góc của M lên (P); đó là khoảng ngắn nhất từ M đến (P).',
      },
      {
        hoi: 'Cách tính khoảng cách giữa hai đường chéo nhau a và b?',
        dap: 'Dựng mặt phẳng (P) chứa b và song song với a, khi đó d(a,b) = d(a,(P)) = d(M,(P)) với M ∈ a.',
      },
      {
        hoi: 'Tính khoảng cách điểm–mặt bằng thể tích thế nào?',
        dap: 'Từ V = ⅓·S·h suy ra h = 3V/S, với S là diện tích miền nằm trong mặt phẳng.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan11-c7-b5',
    grade: '11',
    chapterNumber: 7,
    chapterTitle: 'Quan hệ vuông góc trong không gian',
    lessonNumber: 5,
    title: 'Thể tích khối chóp, khối lăng trụ và khối chóp cụt đều',
    hook:
      'Một chiếc xô nhựa hình chóp cụt, một khối rubik hình lập phương, một mái lều hình chóp: người bán vật liệu ' +
      'cần biết thể tích để tính lượng bê tông hay nước chứa. Ba hình khác nhau nhưng cùng chung một ý tưởng: thể ' +
      'tích bằng diện tích đáy nhân chiều cao, nhân thêm một hệ số. Hệ số ấy là 1, là ⅓, hay một biểu thức hơi lạ ' +
      'với chóp cụt — vì sao lại thế?',
    theory:
      'KHỐI LĂNG TRỤ: V = B·h\n' +
      'B là diện tích đáy, h là chiều cao — khoảng cách giữa hai mặt phẳng chứa hai đáy. Vì sao nhân thẳng: mọi ' +
      'lát cắt song song với đáy đều bằng đáy, nên xếp chồng các lát diện tích B cao h thì được B·h. Ví dụ đặc ' +
      'biệt: hình hộp chữ nhật V = abc, hình lập phương V = a³.\n' +
      'BẪY: với lăng trụ ĐỨNG, h bằng cạnh bên; với lăng trụ XIÊN, h KHÔNG phải cạnh bên mà là đoạn vuông góc ' +
      'giữa hai đáy, ngắn hơn cạnh bên.\n\n' +
      'KHỐI CHÓP: V = ⅓·B·h\n' +
      'h là khoảng cách từ đỉnh đến mặt phẳng đáy. Vì sao có hệ số ⅓: một khối lăng trụ tam giác có thể cắt ' +
      'thành ba khối chóp tam giác, mỗi khối có diện tích đáy bằng nhau và chiều cao bằng nhau, nên thể tích mỗi ' +
      'khối bằng một phần ba lăng trụ.\n' +
      'BẪY: h không phải chiều cao của mặt bên (trung đoạn) và không phải cạnh bên. Với hình chóp đều, đường cao ' +
      'SO nối đỉnh với TÂM đáy O, nên tính qua tam giác vuông SOA: SO² = SA² − OA². Đáy hình vuông cạnh a có ' +
      'OA = a√2/2.\n\n' +
      'KHỐI CHÓP CỤT ĐỀU: V = (h/3)·(B + √(BB′) + B′)\n' +
      'Cắt hình chóp đều bằng mặt phẳng song song với đáy, phần nằm giữa mặt cắt và đáy là chóp cụt đều. Hai đáy ' +
      'đồng dạng, diện tích B (đáy lớn) và B′ (đáy nhỏ), h là khoảng cách hai đáy.\n' +
      'Vì sao có công thức ấy: V = V(chóp lớn) − V(chóp nhỏ). Gọi k = √(B′/B) là tỉ số đồng dạng, H là chiều cao ' +
      'chóp lớn thì chóp nhỏ cao kH và h = H(1 − k). Khi đó V = ⅓BH − ⅓B′·kH = ⅓BH(1 − k³) = ⅓·h·B(1 + k + k²). ' +
      'Mà Bk = √(BB′) và Bk² = B′, ta được công thức trên.\n' +
      'KIỂM NHANH: cho B′ = B thì V = Bh (như lăng trụ); cho B′ = 0 thì V = ⅓Bh (như chóp). Nếu công thức nhớ ' +
      'sai thì hai kiểm tra này lộ ra ngay. BẪY: viết V = (h/3)(B + B′) là sai, thiếu số hạng √(BB′).\n\n' +
      'TỈ SỐ THỂ TÍCH\n' +
      'Cho chóp tam giác S.ABC. Lấy A′ ∈ SA, B′ ∈ SB, C′ ∈ SC thì V(S.A′B′C′)/V(S.ABC) = ' +
      '(SA′/SA)·(SB′/SB)·(SC′/SC). Vì sao nhân: hai khối cùng đỉnh S, đáy và chiều cao đều thu nhỏ theo tỉ lệ ' +
      'các cạnh. Công thức chỉ dùng cho chóp TAM GIÁC và các điểm nằm trên ba cạnh chung đỉnh. BẪY: cộng các tỉ ' +
      'lệ thay vì nhân; chóp đáy tứ giác phải chia thành hai chóp tam giác trước.',
    workedExample: {
      problem:
        'Một khối bê tông chân cột có dạng hình chóp cụt tứ giác đều, đáy lớn là hình vuông cạnh 6 dm, đáy nhỏ ' +
        'là hình vuông cạnh 2 dm và chiều cao 3 dm. Tính thể tích khối bê tông, rồi kiểm lại bằng cách lấy hiệu ' +
        'hai khối chóp.',
      steps: [
        'Bước 1 — Xác định các đại lượng: B = 6² = 36 dm², B′ = 2² = 4 dm², h = 3 dm. Ta dùng công thức chóp cụt ' +
          'vì đề cho hai đáy đồng dạng và khoảng cách giữa chúng.',
        'Bước 2 — Tính √(BB′) = √(36·4) = 12 (cũng bằng 6·2, tích hai cạnh đáy, vì hai đáy là hình vuông đồng ' +
          'dạng).',
        'Bước 3 — Thay vào V = (h/3)(B + √(BB′) + B′) = (3/3)(36 + 12 + 4) = 52 dm³.',
        'Bước 4 — Tự kiểm bằng hiệu hai khối chóp: tỉ số đồng dạng k = 2/6 = 1/3. Chiều cao chóp lớn H thoả ' +
          'H − H/3 = 3 nên H = 4,5 dm; chóp nhỏ cao 1,5 dm.',
        'Bước 5 — V(chóp lớn) = ⅓·36·4,5 = 54, V(chóp nhỏ) = ⅓·4·1,5 = 2, hiệu là 54 − 2 = 52 dm³, trùng với ' +
          'công thức. Hai cách khớp nhau nên kết quả đáng tin.',
      ],
      answer: 'V = 52 dm³.',
    },
    checkQuestions: [
      {
        prompt:
          'Lăng trụ đứng có đáy là tam giác vuông với hai cạnh góc vuông bằng 3 và 4, chiều cao lăng trụ bằng ' +
          '10. Tính thể tích khối lăng trụ.',
        answer: { kind: 'numeric', value: 60 },
        explain:
          'Diện tích đáy là ½·3·4 = 6, chiều cao 10 nên V = B·h = 60. Lỗi hay gặp là quên nhân ½ ở diện tích ' +
          'tam giác (cho 120), hoặc dùng nhầm hệ số ⅓ của khối chóp (cho 20) trong khi lăng trụ không có hệ số ⅓.',
      },
      {
        prompt:
          'Hình chóp tứ giác đều có cạnh đáy bằng 4√2 và cạnh bên bằng 5. Tính thể tích khối chóp.',
        answer: { kind: 'numeric', value: 32 },
        explain:
          'Đáy là hình vuông cạnh 4√2 nên B = 32 và nửa đường chéo OA = 4√2·√2/2 = 4. Tam giác SOA vuông tại O ' +
          'cho SO = √(5² − 4²) = 3. Vậy V = ⅓·32·3 = 32. Lỗi hay gặp là lấy cạnh bên 5 làm chiều cao, hoặc tính ' +
          'OA bằng nửa cạnh đáy thay vì nửa đường chéo.',
      },
      {
        prompt:
          'Cho hình chóp tam giác S.ABC. Lấy M, N, P lần lượt trên SA, SB, SC sao cho SM = ½SA, SN = ⅓SB, ' +
          'SP = ¼SC. Tính tỉ số V(S.MNP)/V(S.ABC), viết dưới dạng phân số tối giản.',
        answer: { kind: 'fraction', num: 1, den: 24, requireSimplified: true },
        explain:
          'Ba điểm nằm trên ba cạnh chung đỉnh S nên tỉ số thể tích bằng tích các tỉ lệ: ½·⅓·¼ = 1/24. Lỗi hay ' +
          'gặp là cộng các tỉ lệ (ra 13/12, lớn hơn 1 là vô lí vì khối nhỏ nằm trong khối lớn), hoặc lấy tỉ số ' +
          'đáy mà quên chiều cao cũng thu nhỏ theo.',
      },
      {
        prompt:
          'Công thức nào đúng cho thể tích khối chóp cụt đều có hai đáy diện tích B, B′ và chiều cao h?',
        choices: [
          { id: 'tong', label: 'V = (h/3)·(B + B′)' },
          { id: 'dung', label: 'V = (h/3)·(B + √(BB′) + B′)' },
          { id: 'nua', label: 'V = (h/2)·(B + B′)' },
          { id: 'tich', label: 'V = (h/3)·√(BB′)' },
        ],
        answer: { kind: 'choice', correctIds: ['dung'] },
        explain:
          'Công thức đúng là (h/3)(B + √(BB′) + B′). Kiểm nhanh: cho B′ = B ta được Bh như lăng trụ, cho B′ = 0 ta ' +
          'được ⅓Bh như chóp. Dạng (h/3)(B + B′) cho chóp (B′ = 0) đúng nhưng cho lăng trụ (B′ = B) lại ra ⅔Bh, ' +
          'sai; dạng (h/2)(B + B′) giống công thức hình thang nên cũng không khớp khi B′ = 0.',
      },
    ],
    srsCards: [
      {
        hoi: 'Thể tích khối lăng trụ và khối chóp?',
        dap: 'Lăng trụ V = B·h; chóp V = ⅓·B·h; h là khoảng cách giữa hai đáy (chóp: từ đỉnh đến đáy).',
      },
      {
        hoi: 'Thể tích khối chóp cụt đều và cách kiểm nhanh?',
        dap: 'V = (h/3)(B + √(BB′) + B′). Kiểm: B′ = B cho Bh; B′ = 0 cho ⅓Bh.',
      },
      {
        hoi: 'Tỉ số thể tích S.A′B′C′ so với S.ABC?',
        dap: 'Bằng tích (SA′/SA)(SB′/SB)(SC′/SC), chỉ cho chóp tam giác với điểm trên ba cạnh chung đỉnh.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
