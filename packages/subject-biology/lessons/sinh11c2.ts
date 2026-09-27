// lessons/sinh11c2.ts — Sinh học 11, Chương 2, 3, 4 & 5 (Bài 13-26).
import type { BiologyLesson } from '../lessonTypes.js'

export const SINH11_C2_LESSONS: BiologyLesson[] = [
  {
    id: 'sinh11-c2-b13',
    animation: {
      title: 'Hướng sáng của thân cây do auxin phân bố lệch',
      description:
        'Một cây non mọc thẳng trong hộp tối, ánh sáng chỉ chiếu từ một phía bên phải. Các chấm auxin ban đầu phân bố đều ở ngọn, nhưng ánh sáng làm auxin chuyển dồn sang phía KHUẤT SÁNG, tức phía bên trái. Auxin kích thích tế bào dãn dài, nên các tế bào ở phía tối dãn nhiều hơn phía sáng; hai bên dài không bằng nhau khiến thân cong dần về phía có ánh sáng. Thân uốn đúng một góc rồi giữ nguyên khi hai phía cân bằng trở lại. Điều hình động sửa được ngay: cây không hề bị ánh sáng kéo về phía nó, cũng không phải phía sáng co lại — chính phía TỐI lớn nhanh hơn đã đẩy ngọn cây nghiêng sang phía sáng. Ở rễ thì cùng nồng độ auxin ấy lại gây ức chế, nên rễ cong theo chiều ngược lại.',
      viewBoxWidth: 420,
      viewBoxHeight: 260,
      durationMs: 9000,
      loop: true,
      shapes: [
        { kind: 'rect', id: 'dat', x: 20, y: 216, w: 380, h: 22, rx: 6, fill: 'muted' },
        { kind: 'rect', id: 'than-duoi', x: 140, y: 140, w: 22, h: 78, rx: 6, fill: 'primary' },
        { kind: 'circle', id: 'khop', cx: 151, cy: 142, r: 11, fill: 'primary' },
        {
          kind: 'rect',
          id: 'than',
          x: 140,
          y: 76,
          w: 22,
          h: 70,
          rx: 6,
          fill: 'primary',
          origin: [151, 142],
          keyframes: [
            { atMs: 0, rotate: 0 },
            { atMs: 1200, rotate: 0 },
            { atMs: 3000, rotate: 0 },
            { atMs: 3200, rotate: 0 },
            { atMs: 6400, rotate: 28 },
            { atMs: 9000, rotate: 28 },
          ],
        },
        {
          kind: 'circle',
          id: 'ngon',
          cx: 151,
          cy: 74,
          r: 14,
          fill: 'primary',
          origin: [151, 142],
          keyframes: [
            { atMs: 0, rotate: 0 },
            { atMs: 1200, rotate: 0 },
            { atMs: 3000, rotate: 0 },
            { atMs: 3200, rotate: 0 },
            { atMs: 6400, rotate: 28 },
            { atMs: 9000, rotate: 28 },
          ],
        },
        {
          kind: 'circle',
          id: 'ax1',
          cx: 145,
          cy: 92,
          r: 4,
          fill: 'accent',
          origin: [151, 142],
          opacity: 1,
          keyframes: [
            { atMs: 0, rotate: 0, opacity: 1 },
            { atMs: 1200, rotate: 0 },
            { atMs: 3000, rotate: 0, opacity: 1 },
            { atMs: 3200, rotate: 0 },
            { atMs: 6400, rotate: 28 },
            { atMs: 9000, rotate: 28 },
          ],
        },
        {
          kind: 'circle',
          id: 'ax2',
          cx: 145,
          cy: 116,
          r: 4,
          fill: 'accent',
          origin: [151, 142],
          opacity: 1,
          keyframes: [
            { atMs: 0, rotate: 0, opacity: 1 },
            { atMs: 1200, rotate: 0 },
            { atMs: 3000, rotate: 0, opacity: 1 },
            { atMs: 3200, rotate: 0 },
            { atMs: 6400, rotate: 28 },
            { atMs: 9000, rotate: 28 },
          ],
        },
        {
          kind: 'circle',
          id: 'ax3',
          cx: 145,
          cy: 104,
          r: 4,
          fill: 'accent',
          origin: [151, 142],
          opacity: 0,
          keyframes: [
            { atMs: 0, rotate: 0, opacity: 0 },
            { atMs: 1200, rotate: 0 },
            { atMs: 3000, rotate: 0, opacity: 1 },
            { atMs: 3200, rotate: 0 },
            { atMs: 6400, rotate: 28 },
            { atMs: 9000, rotate: 28 },
          ],
        },
        {
          kind: 'circle',
          id: 'ax4',
          cx: 145,
          cy: 128,
          r: 4,
          fill: 'accent',
          origin: [151, 142],
          opacity: 0,
          keyframes: [
            { atMs: 0, rotate: 0, opacity: 0 },
            { atMs: 1200, rotate: 0 },
            { atMs: 3000, rotate: 0, opacity: 1 },
            { atMs: 3200, rotate: 0 },
            { atMs: 6400, rotate: 28 },
            { atMs: 9000, rotate: 28 },
          ],
        },
        {
          kind: 'circle',
          id: 'ax5',
          cx: 157,
          cy: 92,
          r: 4,
          fill: 'accent',
          origin: [151, 142],
          opacity: 1,
          keyframes: [
            { atMs: 0, rotate: 0, opacity: 1 },
            { atMs: 1200, rotate: 0 },
            { atMs: 3000, rotate: 0, opacity: 0.15 },
            { atMs: 3200, rotate: 0 },
            { atMs: 6400, rotate: 28 },
            { atMs: 9000, rotate: 28 },
          ],
        },
        {
          kind: 'circle',
          id: 'ax6',
          cx: 157,
          cy: 116,
          r: 4,
          fill: 'accent',
          origin: [151, 142],
          opacity: 1,
          keyframes: [
            { atMs: 0, rotate: 0, opacity: 1 },
            { atMs: 1200, rotate: 0 },
            { atMs: 3000, rotate: 0, opacity: 0.15 },
            { atMs: 3200, rotate: 0 },
            { atMs: 6400, rotate: 28 },
            { atMs: 9000, rotate: 28 },
          ],
        },
        {
          kind: 'label',
          id: 'l-sang',
          x: 396,
          y: 60,
          text: 'Ánh sáng',
          size: 13,
          anchor: 'end',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1700, opacity: 0 },
            { atMs: 2100, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'tia1',
          x1: 392,
          y1: 76,
          x2: 300,
          y2: 86,
          stroke: 'accent',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1700, opacity: 0 },
            { atMs: 2100, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'tia2',
          x1: 392,
          y1: 114,
          x2: 300,
          y2: 124,
          stroke: 'accent',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1700, opacity: 0 },
            { atMs: 2100, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'l-auxin',
          x: 128,
          y: 100,
          text: 'Auxin dồn về',
          size: 12,
          anchor: 'end',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3000, opacity: 0 },
            { atMs: 3400, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'l-auxin2',
          x: 128,
          y: 116,
          text: 'phía khuất sáng',
          size: 12,
          anchor: 'end',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3000, opacity: 0 },
            { atMs: 3400, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'l-dan',
          x: 210,
          y: 254,
          text: 'Phía tối dãn dài nhiều hơn → ngọn cong về phía sáng',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4800, opacity: 0 },
            { atMs: 5200, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
      ],
      captions: [
        { atMs: 600, text: 'Cây non mọc thẳng, auxin phân bố đều hai bên ngọn.' },
        { atMs: 2000, text: 'Ánh sáng chiếu từ bên phải.' },
        { atMs: 3200, text: 'Auxin chuyển dồn sang phía khuất sáng, tức phía bên trái.' },
        {
          atMs: 5200,
          text: 'Auxin kích thích tế bào dãn dài, nên phía tối dài nhanh hơn phía sáng.',
        },
        {
          atMs: 6400,
          text: 'Hai bên dài không bằng nhau đẩy ngọn nghiêng về phía sáng — không phải ánh sáng kéo cây về phía nó.',
        },
      ],
    },
    grade: '11',
    chapterNumber: 2,
    chapterTitle: 'Cảm ứng ở sinh vật',
    lessonNumber: 13,
    title: 'Cảm ứng ở thực vật',
    hook: 'Tại sao ngọn cây luôn hướng về phía cửa sổ có ánh sáng, còn rễ cây lại đâm sâu xuống đất? Đó là nhờ hướng động — kiểu cảm ứng giúp cây sinh trưởng về phía có lợi cho mình.',
    theory:
      'KHÁI NIỆM CẢM ỨNG Ở THỰC VẬT:\n' +
      '— Cảm ứng ở thực vật là khả năng tiếp nhận và phản ứng lại các kích thích của môi trường (ánh sáng, trọng lực, nước, hóa chất, cơ học) để tồn tại và phát triển.\n\n' +
      'HƯỚNG ĐỘNG (Phản ứng có hướng của cây đối với kích thích):\n' +
      '1. Hướng sáng (Phototropism): Thân uốn cong về nguồn sáng (hướng sáng dương) do hormone auxin di chuyển sang phía tối làm tế bào phía tối kéo dài nhanh hơn. Rễ cây hướng sáng âm.\n' +
      '2. Hướng trọng lực / Hướng đất (Gravitropism): Rễ mọc hướng xuống đất (hướng trọng lực dương) để bám giữ và hút nước. Thân mọc hướng ngược lên (hướng trọng lực âm).\n' +
      '3. Hướng hóa (Chemotropism): Rễ cây hướng tới nguồn dinh dưỡng (phân bón, chất hữu cơ - hướng hóa dương) và tránh xa nguồn chất độc hại (hướng hóa âm).\n' +
      '4. Hướng nước (Hydrotropism): Rễ cây uốn cong sinh trưởng về phía có nguồn nước.\n' +
      '5. Hướng tiếp xúc (Thigmotropism): Phản ứng sinh trưởng đối với sự tiếp xúc cơ học (ví dụ tua cuốn của cây leo như mướp, bầu, bí quấn quanh giá thể).\n\n' +
      'ỨNG ĐỘNG (Phản ứng không có hướng của cây đối với kích thích):\n' +
      '1. Ứng động sinh trưởng: Liên quan đến sự kéo dài tế bào không đều ở mặt trên và mặt dưới của cơ quan (ví dụ hiện tượng nở hoa và khép hoa của hoa mười giờ, bồ công anh theo chu kỳ ngày đêm).\n' +
      '2. Ứng động không sinh trưởng: Không liên quan đến sự phân chia tế bào mà do sự thay đổi sức trương nước đột ngột ở các tế bào chuyên hóa (ví dụ hiện tượng khép lá của cây trinh nữ khi va chạm, hiện tượng bắt mồi ở cây gọng vó).',
    workedExample: {
      problem:
        'Giải thích cơ chế hướng sáng dương của thân cây khi được chiếu sáng một phía dưới góc độ hormone thực vật.',
      steps: [
        'Xác định loại hormone liên quan: Auxin (indole-3-acetic acid - IAA) là hormone kích thích sự giãn dài tế bào ở thân cây.',
        'Sự phân bố auxin dưới tác động của ánh sáng đơn hướng: Ánh sáng chiếu một phía làm phân hủy auxin ở phía sáng hoặc kích thích auxin di chuyển từ phía sáng sang phía tối của thân cây.',
        'Kết quả sinh trưởng: Tế bào ở phía tối nhận được nhiều auxin hơn sẽ kéo dài nhanh hơn tế bào ở phía sáng, làm cho thân cây bị uốn cong về phía nguồn sáng.',
      ],
      answer:
        'Ánh sáng chiếu một phía làm auxin tập trung nhiều hơn ở phía tối, kích thích tế bào phía tối giãn dài nhanh hơn và uốn cong thân về phía ánh sáng.',
    },
    checkQuestions: [
      {
        prompt:
          'Hiện tượng lá cây trinh nữ (mắc cỡ) khép lại lập tức khi bị tay chạm vào là ví dụ điển hình của hình thức cảm ứng nào?',
        choices: [
          { id: 'hd_1', label: 'Ứng động không sinh trưởng (ứng động sức trương)' },
          { id: 'hd_2', label: 'Ứng động sinh trưởng' },
          { id: 'hd_3', label: 'Hướng tiếp xúc dương' },
          { id: 'hd_4', label: 'Hướng hóa âm' },
        ],
        answer: { kind: 'choice', correctIds: ['hd_1'] },
        explain:
          'Sự va chạm cơ học làm các tế bào thể khớp ở gốc cuống lá trinh nữ đột ngột mất nước thoát ra ngoài làm giảm sức trương nước, khiến lá lập tức rủ xuống khép lại mà không liên quan đến sự phân chia sinh trưởng tế bào.',
      },
      {
        prompt: 'Tua cuốn của cây họ Bầu bí mọc quấn quanh giá thể là nhờ kiểu hướng động nào?',
        choices: [
          { id: 'tc_1', label: 'Hướng tiếp xúc' },
          { id: 'tc_2', label: 'Hướng sáng' },
          { id: 'tc_3', label: 'Hướng nước' },
          { id: 'tc_4', label: 'Hướng trọng lực' },
        ],
        answer: { kind: 'choice', correctIds: ['tc_1'] },
        explain:
          'Khi tua cuốn tiếp xúc với vật cứng (giá thể), các tế bào ở phía không tiếp xúc sinh trưởng nhanh hơn tế bào tiếp xúc, làm tua cuốn uốn cong quấn chặt quanh vật tiếp xúc.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phân biệt hướng động và ứng động ở thực vật?',
        dap: 'Hướng động là phản ứng sinh trưởng có hướng đối với tác nhân kích thích có hướng. Ứng động là phản ứng không có hướng đối với kích thích không định hướng.',
      },
      {
        hoi: 'Auxin phân bố thế nào ở ngọn thân khi được chiếu sáng một phía?',
        dap: 'Auxin tập trung nhiều ở phía tối (phía không được chiếu sáng trực tiếp).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh11-c2-b14',
    grade: '11',
    chapterNumber: 2,
    chapterTitle: 'Cảm ứng ở sinh vật',
    lessonNumber: 14,
    title: 'Thực hành: Một số thí nghiệm về cảm ứng ở thực vật',
    hook: 'Hãy tự tay gieo những hạt đậu và quan sát phản ứng uốn cong tìm ánh sáng hay cắm rễ xuống đất của chúng thông qua các thí nghiệm trực quan sinh động.',
    theory:
      'THÍ NGHIỆM CHỨNG MINH HƯỚNG SÁNG CỦA THÂN CÂY:\n' +
      '— Chuẩn bị: Gieo hạt đậu xanh trong hai hộp bìa các-tông: Hộp A bịt kín hoàn toàn; Hộp B khoét một lỗ tròn đường kính 2 cm ở thành bên. Đặt cả hai hộp ở cùng một chỗ có nắng, xoay hộp B sao cho ánh sáng chiếu thẳng vào lỗ khoét.\n' +
      '— Tiến hành: Tưới ẩm đất hàng ngày. Sau 3-5 ngày, mở hộp quan sát.\n' +
      '— Hiện tượng: Cây trong hộp A mọc vống thẳng lên, thân yếu, lá có màu nhạt (vàng úa). Cây trong hộp B mọc nghiêng và ngọn uốn cong hướng ra ngoài qua lỗ khoét.\n\n' +
      'THÍ NGHIỆM CHỨNG MINH HƯỚNG TRỌNG LỰC CỦA RỄ CÂY:\n' +
      '— Chuẩn bị: Gieo hạt ngô hoặc đậu xanh trên đĩa Petri lót bông ẩm cho đến khi rễ mọc dài 1-2 cm.\n' +
      '— Tiến hành: Đặt đĩa Petri thẳng đứng trên giá đỡ sao cho rễ hướng xuống đất. Sau đó, xoay đĩa Petri 90 độ để các rễ nằm ngang, giữ ẩm bông và quan sát sau 24-48 giờ.\n' +
      '— Hiện tượng: Các đỉnh rễ uốn cong 90 độ đâm thẳng xuống đất theo hướng trọng lực; thân mầm uốn cong hướng lên trên ngược chiều trọng lực.\n\n' +
      'THÍ NGHIỆM QUAN SÁT ỨNG ĐỘNG KHÔNG SINH TRƯỞNG (CÂY TRINH NỮ):\n' +
      '— Dùng đầu ngón tay hoặc que kích thích nhẹ lên đầu lá chét của cây trinh nữ (Mimosa pudica). Quan sát tốc độ khép lá chét và rủ cuống lá. Đo thời gian để lá mở lại bình thường (thường sau 10-15 phút).',
    workedExample: {
      problem:
        'Giải thích tại sao cây đậu xanh trồng trong hộp A (bịt kín hoàn toàn không có ánh sáng) lại bị hiện tượng mọc vống, thân dài và yếu mảnh.',
      steps: [
        'Nhận diện tác nhân kích thích: Hộp A hoàn toàn tối, không có ánh sáng.',
        'Tác dụng của auxin trong tối: Nồng độ hormone auxin ở đỉnh ngọn cây rất cao do không bị ánh sáng phân hủy hay di chuyển.',
        'Kết quả: Auxin cao kích thích tế bào thân giãn dài tối đa, làm cây mọc vống lên rất nhanh để tìm kiếm ánh sáng (thích nghi tìm sáng), nhưng do thiếu ánh sáng để tổng hợp diệp lục nên thân mảnh yếu và có màu vàng.',
      ],
      answer:
        'Không có ánh sáng làm auxin không bị phân hủy, kích thích thân sinh trưởng giãn dài quá mức (mọc vống) tìm sáng, đồng thời thiếu diệp lục làm cây vàng úa.',
    },
    checkQuestions: [
      {
        prompt:
          'Trong thí nghiệm hướng trọng lực, khi ta xoay ngang một hạt đậu đã mọc rễ thẳng đứng, sau 24 giờ đỉnh rễ sẽ uốn cong đi xuống dưới là do tác động của:',
        choices: [
          { id: 'tl_1', label: 'Trọng lực trái đất' },
          { id: 'tl_2', label: 'Nồng độ nước trong bông ẩm' },
          { id: 'tl_3', label: 'Nhiệt độ phòng thí nghiệm' },
          { id: 'tl_4', label: 'Ánh sáng phản chiếu từ gương kính' },
        ],
        answer: { kind: 'choice', correctIds: ['tl_1'] },
        explain:
          'Rễ cây chịu kích thích của trọng lực trái đất (hướng trọng lực dương), điều khiển auxin phân bố nhiều ở mặt dưới của rễ, ức chế sinh trưởng mặt dưới làm rễ uốn cong đi xuống.',
      },
      {
        prompt:
          'Tại sao ngọn cây đậu xanh trồng trong hộp bìa các-tông khoét một lỗ ở thành bên lại uốn cong hướng ra ngoài lỗ?',
        choices: [
          {
            id: 'lk_1',
            label: 'Do ngọn cây sinh trưởng hướng về nguồn ánh sáng đơn hướng chiếu qua lỗ khoét',
          },
          { id: 'lk_2', label: 'Do không khí ngoài lỗ khoét mát mẻ hơn' },
          { id: 'lk_3', label: 'Do rễ cây đẩy nước ra ngoài lỗ khoét' },
          { id: 'lk_4', label: 'Do trọng lực kéo ngọn cây ngã ra ngoài' },
        ],
        answer: { kind: 'choice', correctIds: ['lk_1'] },
        explain:
          'Ngọn cây đậu hướng sáng dương, sự chiếu sáng không đều qua lỗ khoét làm ngọn sinh trưởng lệch và uốn cong về phía có ánh sáng lọt vào.',
      },
    ],
    srsCards: [
      {
        hoi: 'Hiện tượng mọc vống (etiolation) ở thực vật xảy ra trong điều kiện nào?',
        dap: 'Xảy ra trong điều kiện tối hoàn toàn (thiếu ánh sáng), cây tập trung năng lượng kéo dài thân tìm sáng.',
      },
      {
        hoi: 'Vì sao rễ cây bị xoay nằm ngang lại uốn cong đâm trở xuống đất?',
        dap: 'Vì rễ có tính hướng trọng lực dương: auxin dồn xuống mặt dưới của rễ, ở nồng độ cao lại ức chế mặt dưới sinh trưởng nên mặt trên dài nhanh hơn, làm rễ cong xuống.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh11-c2-b15',
    grade: '11',
    chapterNumber: 2,
    chapterTitle: 'Cảm ứng ở sinh vật',
    lessonNumber: 15,
    title: 'Cảm ứng ở động vật',
    hook: 'Khi bạn vô tình chạm tay vào vật nóng, ngay lập tức tay bạn rụt lại một cách vô thức. Đó là một cung phản xạ cảm ứng bảo vệ cơ thể khỏi tổn thương.',
    theory:
      'TIẾN HÓA CỦA HỆ THẦN KINH Ở ĐỘNG VẬT:\n' +
      '1. Chưa có hệ thần kinh (Động vật đơn bào): Phản ứng bằng chuyển động cả tế bào hướng tới hoặc tránh xa kích thích.\n' +
      '2. Hệ thần kinh dạng lưới (Ruột khoang - Thủy tức): Các tế bào thần kinh phân bố rải rác khắp cơ thể tạo mạng lưới liên kết. Kích thích tại một điểm làm toàn bộ cơ thể co rút lại (độ chính xác thấp, tiêu tốn năng lượng).\n' +
      '3. Hệ thần kinh dạng chuỗi hạch (Giun, Thân mềm, Chân khớp): Tế bào thần kinh tập trung thành các hạch thần kinh dọc cơ thể. Phản ứng cục bộ theo từng vùng (tiết kiệm năng lượng và chính xác hơn).\n' +
      '4. Hệ thần kinh dạng ống (Động vật có xương sống): Gồm thần kinh trung ương (não bộ, tủy sống) và thần kinh ngoại biên. Phản ứng vô cùng nhanh chóng, chính xác nhờ các phản xạ.\n\n' +
      'CUNG PHẢN XẠ (Hành trình của cảm ứng thần kinh):\n' +
      'Cơ chế cảm ứng ở động vật có hệ thần kinh là phản xạ. Phản xạ được thực hiện qua một cung phản xạ gồm 5 bộ phận:\n' +
      '1. Bộ phận tiếp nhận kích thích (Thụ thể ở da, mắt, tai...).\n' +
      '2. Đường dẫn truyền hướng tâm (Sợi thần kinh cảm giác mang thông tin về trung ương).\n' +
      '3. Bộ phận phân tích và tổng hợp (Não bộ và tủy sống xử lý thông tin, quyết định hành động).\n' +
      '4. Đường dẫn truyền li tâm (Sợi thần kinh vận động mang lệnh đi).\n' +
      '5. Bộ phận thực hiện (Cơ co bóp hoặc Tuyến tiết dịch).\n\n' +
      'PHÂN LOẠI PHẢN XẠ:\n' +
      '— Phản xạ không điều kiện: Phản xạ bẩm sinh, di truyền, bền vững, mang tính chủng loại, do tủy sống hoặc trụ não điều khiển (ví dụ: rụt tay khi nóng, tiết nước bọt khi thức ăn chạm lưỡi).\n' +
      '— Phản xạ có điều kiện: Phản xạ học tập được, hình thành trong đời sống cá thể, không bền vững (dễ mất nếu không củng cố), do vỏ não điều khiển (ví dụ: nghe tiếng còi xe biết tránh đường, tiết nước bọt khi nghe nhắc đến chanh chua).',
    workedExample: {
      problem:
        'Hãy phân tích đường đi của luồng thông tin thần kinh trong cung phản xạ rụt tay khi ngón tay vô tình chạm vào một cái gai nhọn.',
      steps: [
        'Tiếp nhận kích thích: Gai nhọn đâm vào da kích thích các thụ thể đau ở da đầu ngón tay.',
        'Dẫn truyền hướng tâm: Xung thần kinh xuất hiện truyền theo sợi cảm giác của dây thần kinh tủy đi vào tủy sống (trung ương thần kinh).',
        'Xử lý thông tin: Tủy sống phân tích xung động, qua tế bào thần kinh trung gian chuyển tín hiệu sang sợi vận động.',
        'Dẫn truyền li tâm và thực hiện: Xung thần kinh truyền theo sợi vận động đến nhóm cơ cánh tay (bộ phận thực hiện), kích thích cơ co kéo tay rụt lại ngay lập tức.',
      ],
      answer:
        'Thụ thể đau ở da -> Sợi cảm giác -> Tủy sống -> Sợi vận động -> Cơ cánh tay co rụt tay lại.',
    },
    checkQuestions: [
      {
        prompt: 'Nhóm động vật nào sau đây có hệ thần kinh dạng lưới?',
        choices: [
          { id: 'htk_1', label: 'Thủy tức (ngành Ruột khoang)' },
          { id: 'htk_2', label: 'Giun đất' },
          { id: 'htk_3', label: 'Châu chấu' },
          { id: 'htk_4', label: 'Cá chép' },
        ],
        answer: { kind: 'choice', correctIds: ['htk_1'] },
        explain:
          'Thủy tức thuộc ngành Ruột khoang chưa có hệ thần kinh tập trung, các tế bào thần kinh liên kết với nhau thành mạng lưới rải rác dưới da.',
      },
      {
        prompt:
          'Phản xạ nào sau đây là phản xạ có điều kiện được hình thành trong đời sống cá thể?',
        choices: [
          { id: 'px_1', label: 'Tiết nước bọt khi nhìn thấy một quả chanh chua' },
          { id: 'px_2', label: 'Co con ngươi (đồng tử) mắt khi chiếu ánh sáng mạnh vào' },
          { id: 'px_3', label: 'Rụt tay lại khi vô tình chạm vào phích nước nóng' },
          { id: 'px_4', label: 'Khóc khi chào đời ở trẻ sơ sinh' },
        ],
        answer: { kind: 'choice', correctIds: ['px_1'] },
        explain:
          'Tiết nước bọt khi nhìn thấy quả chanh là phản xạ có điều kiện, được hình thành qua trải nghiệm ăn chanh chua trong quá khứ của cá nhân. Các phản xạ còn lại là phản xạ không điều kiện bẩm sinh.',
      },
    ],
    srsCards: [
      {
        hoi: 'Nêu thứ tự 5 bộ phận cấu thành một cung phản xạ?',
        dap: '1. Bộ phận tiếp nhận -> 2. Đường hướng tâm -> 3. Trung ương thần kinh -> 4. Đường li tâm -> 5. Bộ phận thực hiện.',
      },
      {
        hoi: 'Tại sao hệ thần kinh chuỗi hạch tiến hóa hơn hệ thần kinh dạng lưới?',
        dap: 'Vì hệ chuỗi hạch có tế bào thần kinh tập trung hơn, giúp phản ứng cục bộ chính xác ở từng vùng bị kích thích thay vì co rút toàn bộ cơ thể như dạng lưới.',
      },
    ],
    animation: {
      title: 'Điện thế hoạt động và sự lan truyền xung thần kinh',
      description:
        'Phần trên là sợi trục thần kinh, phần dưới là đồ thị điện thế màng theo thời gian. Khi chưa bị kích thích, mặt trong màng âm hơn mặt ngoài khoảng −70 mV, đó là điện thế nghỉ do bơm natri–kali đẩy 3 Na⁺ ra và lấy 2 K⁺ vào. Kích thích đủ ngưỡng làm cổng Na⁺ mở, Na⁺ ào vào trong khiến điện thế vọt lên khoảng +30 mV — giai đoạn khử cực rồi đảo cực. Ngay sau đó cổng Na⁺ đóng, cổng K⁺ mở cho K⁺ đi ra, điện thế tụt về giá trị nghỉ — giai đoạn tái phân cực. Vùng vừa khử cực làm vùng kế bên khử cực theo, nên xung lan đi một chiều dọc sợi trục; vùng phía sau đang ở giai đoạn trơ nên xung không quay ngược lại. Xung thần kinh không mạnh lên khi kích thích mạnh hơn — kích thích mạnh chỉ làm TẦN SỐ xung tăng, còn biên độ mỗi xung luôn như nhau.',
      viewBoxWidth: 440,
      viewBoxHeight: 250,
      durationMs: 8000,
      loop: true,
      shapes: [
        {
          kind: 'rect',
          id: 'soitruc',
          x: 20,
          y: 34,
          w: 400,
          h: 44,
          rx: 22,
          fill: 'surface',
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'lb-soi',
          x: 20,
          y: 26,
          text: 'sợi trục — xung lan một chiều',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'rect',
          id: 'vungkc',
          x: 30,
          y: 36,
          w: 54,
          h: 40,
          rx: 18,
          fill: 'warn',
          opacity: 0.85,
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 7000, dx: 326 },
            { atMs: 8000, dx: 326, opacity: 0.2 },
          ],
        },
        {
          kind: 'arrow',
          id: 'kichthich',
          x1: 20,
          y1: 108,
          x2: 46,
          y2: 82,
          stroke: 'primary',
          strokeWidth: 3,
        },
        {
          kind: 'label',
          id: 'lb-kt',
          x: 16,
          y: 122,
          text: 'kích thích tới ngưỡng',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'line',
          id: 'truc-x',
          x1: 40,
          y1: 200,
          x2: 420,
          y2: 200,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'truc-y',
          x1: 40,
          y1: 140,
          x2: 40,
          y2: 240,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'nghi',
          x1: 40,
          y1: 228,
          x2: 420,
          y2: 228,
          stroke: 'muted',
          strokeWidth: 1,
          dash: '5 4',
        },
        {
          kind: 'polyline',
          id: 'dothi',
          points: [
            [40, 228],
            [110, 228],
            [130, 224],
            [150, 150],
            [170, 146],
            [196, 214],
            [214, 238],
            [240, 230],
            [270, 228],
            [420, 228],
          ],
          stroke: 'primary',
          strokeWidth: 3,
        },
        {
          kind: 'label',
          id: 'lb-30',
          x: 34,
          y: 150,
          text: '+30 mV',
          size: 10,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb-70',
          x: 34,
          y: 232,
          text: '−70 mV',
          size: 10,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb-0',
          x: 34,
          y: 204,
          text: '0',
          size: 10,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb-khuc',
          x: 146,
          y: 138,
          text: 'khử cực: Na⁺ vào',
          size: 10,
          anchor: 'middle',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'lb-tai',
          x: 262,
          y: 246,
          text: 'tái phân cực: K⁺ ra',
          size: 10,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'lb-tro',
          x: 430,
          y: 190,
          text: 'giai đoạn trơ — xung không quay ngược',
          size: 10,
          anchor: 'end',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Điện thế nghỉ −70 mV: trong màng âm hơn ngoài màng.' },
        {
          atMs: 2000,
          text: 'Kích thích tới ngưỡng → cổng Na⁺ mở, Na⁺ ào vào, điện thế vọt lên +30 mV.',
        },
        { atMs: 4500, text: 'Cổng K⁺ mở, K⁺ ra ngoài, điện thế trở về mức nghỉ.' },
        {
          atMs: 6500,
          text: 'Kích thích mạnh hơn chỉ làm tăng TẦN SỐ xung, không làm xung mạnh hơn.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh11-c2-b16',
    grade: '11',
    chapterNumber: 2,
    chapterTitle: 'Cảm ứng ở sinh vật',
    lessonNumber: 16,
    title: 'Thực hành: Một số thí nghiệm về cảm ứng ở động vật',
    hook: 'Làm thế nào để đo thời gian phản xạ của mắt, kiểm tra phản xạ xương bánh chè hay quan sát hành vi học tập đơn giản ở động vật nuôi?',
    theory:
      'THÍ NGHIỆM PHẢN XẠ XƯƠNG BÁNH CHÈ (ĐẦU GỐI) Ở NGƯỜI:\n' +
      '— Nguyên tắc: Kích thích cơ học vào gân cơ tứ đầu đùi kích hoạt phản xạ tủy làm co cơ kéo cẳng chân đá lên.\n' +
      '— Tiến trình: Người được đo ngồi thả lỏng hoàn toàn trên ghế cao, hai chân buông thõng tự do. Người làm thí nghiệm dùng búa y tế gõ nhẹ và chính xác vào dây chằng dưới xương bánh chè.\n' +
      '— Hiện tượng: Cẳng chân người được đo tự động đá nhẹ về phía trước một cách vô thức. Đây là phản xạ không điều kiện tủy sống.\n\n' +
      'THÍ NGHIỆM PHẢN XẠ ĐỒNG TỬ MẮT VỚI ÁNH SÁNG:\n' +
      '— Nguyên tắc: Đồng tử co hoặc dãn để điều hòa lượng ánh sáng đi vào mắt nhằm bảo vệ võng mạc.\n' +
      '— Tiến trình: Cho người được đo ngồi trong phòng tối nhẹ. Dùng đèn pin chiếu nhẹ từ bên cạnh vào mắt họ trong vài giây rồi tắt.\n' +
      '— Hiện tượng: Khi chiếu đèn, đồng tử (con ngươi) co nhỏ lại rõ rệt; khi tắt đèn, đồng tử dãn to ra.\n\n' +
      'KHẢO SÁT TẬP TÍNH HỌC TẬP (PHẢN XẠ CÓ ĐIỀU KIỆN) Ở ĐỘNG VẬT:\n' +
      '— Quan sát cách huấn luyện cá cảnh (cá vàng) nổi lên ăn khi gõ vào thành bể. Âm thanh gõ (kích thích có điều kiện) kết hợp lặp lại nhiều lần với việc cho ăn (kích thích không điều kiện) giúp cá hình thành phản xạ nổi lên ngay khi nghe tiếng gõ mà chưa có thức ăn.',
    workedExample: {
      problem:
        'Hãy giải thích cơ chế của phản xạ co đồng tử mắt khi bị ánh sáng mạnh chiếu thẳng vào dưới góc độ các bộ phận của cung phản xạ.',
      steps: [
        'Bộ phận tiếp nhận: Thụ thể ánh sáng (tế bào que và tế bào nón) trên võng mạc mắt nhận kích thích ánh sáng mạnh.',
        'Đường hướng tâm: Xung thần kinh truyền theo sợi cảm giác của dây thần kinh thị giác (dây số II) về não bộ (não trung gian - củ não sinh tư).',
        'Bộ phận điều khiển: Não bộ phân tích xử lý và phát tín hiệu theo đường li tâm (dây thần kinh vận nhãn chung - dây số III) đến mắt.',
        'Bộ phận thực hiện: Cơ vòng của mống mắt (đồng tử) nhận tín hiệu co lại, làm thu nhỏ đường kính con ngươi để giảm lượng ánh sáng lọt vào.',
      ],
      answer:
        'Võng mạc mắt -> Dây thần kinh thị giác -> Não bộ -> Dây vận nhãn -> Cơ vòng mống mắt co thu nhỏ đồng tử.',
    },
    checkQuestions: [
      {
        prompt:
          'Khi gõ nhẹ búa cao su vào dây chằng dưới xương bánh chè ở đầu gối, cẳng chân tự động đá lên phía trước. Trung ương thần kinh điều khiển phản xạ này nằm ở đâu?',
        choices: [
          { id: 'bg_1', label: 'Tủy sống' },
          { id: 'bg_2', label: 'Vỏ đại não' },
          { id: 'bg_3', label: 'Tiểu não' },
          { id: 'bg_4', label: 'Hành não' },
        ],
        answer: { kind: 'choice', correctIds: ['bg_1'] },
        explain:
          'Phản xạ gân đầu gối là phản xạ tủy đơn giản, trung khu phân tích tổng hợp nằm ngay ở đoạn tủy sống thắt lưng mà không cần sự can thiệp của vỏ não.',
      },
      {
        prompt: 'Đồng tử mắt dãn rộng ra trong điều kiện nào dưới đây?',
        choices: [
          { id: 'dt_1', label: 'Khi đi vào phòng tối hoặc ban đêm' },
          { id: 'dt_2', label: 'Khi bị đèn pin chiếu trực tiếp vào mắt' },
          { id: 'dt_3', label: 'Khi nhìn gần các vật thể nhỏ bé' },
          { id: 'dt_4', label: 'Khi cơ thể đang ở trạng thái ngủ sâu' },
        ],
        answer: { kind: 'choice', correctIds: ['dt_1'] },
        explain:
          'Đồng tử dãn to ra khi ánh sáng yếu (phòng tối, ban đêm) để tối đa hóa lượng ánh sáng đi vào mắt giúp nhìn rõ vật hơn.',
      },
    ],
    srsCards: [
      {
        hoi: 'Chỉ ra bộ phận thực hiện của phản xạ xương bánh chè?',
        dap: 'Cơ tứ đầu đùi co làm cẳng chân đá về phía trước.',
      },
      {
        hoi: 'Ý nghĩa của phản xạ co đồng tử mắt đối với cơ thể?',
        dap: 'Bảo vệ tế bào võng mạc không bị kích thích quá mức gây tổn thương dưới tác động của cường độ ánh sáng quá mạnh.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh11-c3-b17',
    animation: {
      title: 'Sinh trưởng sơ cấp và thứ cấp ở thực vật',
      description:
        'Bốn ô phân biệt hai kiểu sinh trưởng mà học sinh hay gộp làm một. MÔ PHÂN SINH ĐỈNH nằm ở chóp thân và chóp rễ; tế bào ở đó phân chia rồi dãn dài, làm cây CAO LÊN và rễ ĂN SÂU — đó là sinh trưởng sơ cấp, có ở cả cây Một lá mầm lẫn Hai lá mầm. MÔ PHÂN SINH BÊN, gồm tầng sinh mạch và tầng sinh bần, nằm thành vòng quanh thân; nó phân chia theo hướng vào trong và ra ngoài làm thân TO RA về đường kính — đó là sinh trưởng thứ cấp, chủ yếu ở cây Hai lá mầm thân gỗ, và chính nó tạo ra gỗ cùng các vòng năm. Điều hình động chỉ rõ: một cành nằm cách gốc một mét thì mãi mãi ở độ cao đó, vì thân chỉ dài thêm ở phần ngọn chứ không dài ra ở giữa.',
      viewBoxWidth: 716,
      viewBoxHeight: 118,
      durationMs: 5600,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'tieu-de',
          x: 358,
          y: 24,
          text: 'Cây cao lên và to ra bằng hai loại mô phân sinh khác nhau',
          size: 15,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'rect',
          id: 'o0',
          x: 16,
          y: 40,
          w: 150,
          h: 60,
          rx: 9,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 200, opacity: 0 },
            { atMs: 500, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n0',
          x: 91,
          y: 66,
          text: 'Mô phân sinh đỉnh',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 200, opacity: 0 },
            { atMs: 500, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p0',
          x: 91,
          y: 84,
          text: 'ở chóp thân, chóp rễ',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 200, opacity: 0 },
            { atMs: 500, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt0',
          x1: 166,
          y1: 70,
          x2: 189,
          y2: 70,
          stroke: 'accent',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 850, opacity: 0 },
            { atMs: 1150, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'o1',
          x: 194,
          y: 40,
          w: 150,
          h: 60,
          rx: 9,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1300, opacity: 0 },
            { atMs: 1600, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n1',
          x: 269,
          y: 66,
          text: 'Sinh trưởng sơ cấp',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1300, opacity: 0 },
            { atMs: 1600, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p1',
          x: 269,
          y: 84,
          text: 'cây cao lên, rễ sâu',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1300, opacity: 0 },
            { atMs: 1600, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt1',
          x1: 344,
          y1: 70,
          x2: 367,
          y2: 70,
          stroke: 'accent',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1950, opacity: 0 },
            { atMs: 2250, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'o2',
          x: 372,
          y: 40,
          w: 150,
          h: 60,
          rx: 9,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2700, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n2',
          x: 447,
          y: 66,
          text: 'Mô phân sinh bên',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2700, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p2',
          x: 447,
          y: 84,
          text: 'tầng sinh mạch, bần',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2700, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt2',
          x1: 522,
          y1: 70,
          x2: 545,
          y2: 70,
          stroke: 'accent',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3050, opacity: 0 },
            { atMs: 3350, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'o3',
          x: 550,
          y: 40,
          w: 150,
          h: 60,
          rx: 9,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3500, opacity: 0 },
            { atMs: 3800, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n3',
          x: 625,
          y: 66,
          text: 'Sinh trưởng thứ cấp',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3500, opacity: 0 },
            { atMs: 3800, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p3',
          x: 625,
          y: 84,
          text: 'thân to ra, có gỗ',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3500, opacity: 0 },
            { atMs: 3800, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'con-chay',
          cx: 26,
          cy: 50,
          r: 6,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 0 },
            { atMs: 500, dx: 0, dy: 0, opacity: 1 },
            { atMs: 1350, dx: 0, dy: 0, opacity: 1 },
            { atMs: 1600, dx: 178, dy: 0, opacity: 1 },
            { atMs: 2450, dx: 178, dy: 0, opacity: 1 },
            { atMs: 2700, dx: 356, dy: 0, opacity: 1 },
            { atMs: 3550, dx: 356, dy: 0, opacity: 1 },
            { atMs: 3800, dx: 534, dy: 0, opacity: 1 },
            { atMs: 5600, dx: 534, dy: 0, opacity: 1 },
          ],
        },
      ],
      captions: [
        { atMs: 500, text: 'Mô phân sinh đỉnh nằm ở chóp thân và chóp rễ.' },
        {
          atMs: 1600,
          text: 'Tế bào phân chia rồi dãn dài làm cây cao lên, rễ ăn sâu — có ở cả cây Một và Hai lá mầm.',
        },
        {
          atMs: 2700,
          text: 'Mô phân sinh bên là vòng tầng sinh mạch và tầng sinh bần quanh thân.',
        },
        {
          atMs: 3800,
          text: 'Thân to ra về đường kính, tạo gỗ và vòng năm — chủ yếu ở cây Hai lá mầm thân gỗ.',
        },
      ],
    },
    grade: '11',
    chapterNumber: 3,
    chapterTitle: 'Sinh trưởng và phát triển ở sinh vật',
    lessonNumber: 17,
    title: 'Sinh trưởng và phát triển ở thực vật',
    hook: 'Một hạt sồi nhỏ có thể lớn lên thành một cây cổ thụ khổng lồ thọ hàng trăm tuổi nhờ hoạt động phân chia của các tế bào mô phân sinh và hormone thực vật.',
    theory:
      'ĐỊNH NGHĨA SINH TRƯỞNG VÀ PHÁT TRIỂN:\n' +
      '— Sinh trưởng: Sự tăng lên về kích thước, thể tích và khối lượng của cơ thể thực vật do sự tăng số lượng và kích thước tế bào.\n' +
      '— Phát triển: Quá trình biến đổi về chất bao gồm sự phân hóa tế bào, phát sinh hình thái cơ quan mới và sự ra hoa, tạo quả.\n\n' +
      'MÔ PHÂN SINH (Meristems):\n' +
      'Là nhóm các tế bào thực vật chưa phân hóa, luôn duy trì khả năng phân chia nguyên phân tạo tế bào mới. Gồm các nhóm chính:\n' +
      '1. Mô phân sinh đỉnh (nằm ở đỉnh rễ, đỉnh ngọn thân): Giúp cây sinh trưởng sơ cấp (kéo dài chiều dài của thân, rễ). Có ở cả cây Một lá mầm và Hai lá mầm.\n' +
      '2. Mô phân sinh bên (tầng phát sinh mạch dẫn, tầng phát sinh vỏ): Giúp cây sinh trưởng thứ cấp (làm thân, rễ to ngang ra). Chủ yếu có ở cây Hai lá mầm thân gỗ lâu năm, hình thành các vòng năm gỗ.\n' +
      '3. Mô phân sinh lóng: Giúp kéo dài các lóng của thân (chỉ có ở cây Một lá mầm như tre, mía, lúa).\n\n' +
      'HORMONE THỰC VẬT (Phytohormones):\n' +
      '— Nhóm kích thích sinh trưởng:\n  + Auxin (IAA): Kích thích giãn dài tế bào thân, tạo rễ phụ, gây hiện tượng ưu thế đỉnh (ức chế chồi bên).\n  + Gibberellin (GA): Kích thích kéo dài thân lóng, phá ngủ hạt, kích nảy mầm.\n  + Cytokinin: Kích thích phân chia tế bào mạnh mẽ, kích thích tạo chồi, làm chậm lão hóa lá.\n— Nhóm ức chế sinh trưởng:\n  + Abscisic acid (ABA): Kích thích rụng lá, gây ngủ của hạt, điều khiển đóng khí khổng khi cây thiếu nước.\n  + Ethylene (dạng khí): Thúc đẩy quá trình chín của quả, gây rụng lá, hoa.\n\n' +
      'NHÂN TỐ ĐIỀU HÒA SỰ RA HOA:\n' +
      '— Quang chu kỳ: Sự ra hoa của cây phụ thuộc vào độ dài ngày và đêm tương đối (gồm cây ngày ngắn, cây ngày dài, cây trung tính).\n' +
      '— Phytochrom: Sắc tố cảm nhận quang chu kỳ ở lá cây (tồn tại ở dạng hấp thụ ánh sáng đỏ P_R và đỏ xa P_FR).\n' +
      '— Xuân hóa (Vernalization): Hiện tượng một số loài cây chỉ ra hoa sau khi trải qua giai đoạn nhiệt độ thấp kéo dài (ví dụ lúa mì mùa đông).',
    workedExample: {
      problem:
        'Làm thế nào để đếm tuổi của một cây gỗ cổ thụ đã bị đốn hạ và xác định khí hậu các năm đó thông qua các vòng năm gỗ?',
      steps: [
        'Nhận diện vòng năm gỗ: Mặt cắt ngang của thân cây gỗ có các vòng sáng và vòng tối xen kẽ. Mỗi năm, tầng phát sinh bên tạo ra một vòng sáng (mọc vào mùa xuân/hè ấm áp, tế bào mạch lớn thành mỏng) và một vòng tối (mọc vào mùa thu/đông khô lạnh, tế bào mạch nhỏ thành dày).',
        'Đếm số vòng năm: Đếm tổng số vòng tối (hoặc vòng sáng) từ tâm gỗ ra ngoài vỏ cây. Số vòng đếm được chính là số tuổi của cây tính bằng năm.',
        'Xác định khí hậu: Vòng năm rộng chứng tỏ năm đó mưa thuận gió hòa, cây sinh trưởng mạnh; vòng năm hẹp chứng tỏ năm đó khô hạn, khí hậu khắc nghiệt cây chậm phát triển.',
      ],
      answer:
        'Đếm số vòng năm trên mặt cắt thân cây gỗ để biết tuổi; độ rộng của vòng phản ánh điều kiện khí hậu của năm đó.',
    },
    checkQuestions: [
      {
        prompt: 'Mô phân sinh bên ở thực vật Hai lá mầm có vai trò nào sau đây?',
        choices: [
          { id: 'mps_1', label: 'Giúp thân và rễ của cây sinh trưởng thứ cấp làm to ngang ra' },
          { id: 'mps_2', label: 'Giúp ngọn cây vươn cao lên' },
          { id: 'mps_3', label: 'Giúp các lóng cây tre, mía kéo dài ra' },
          { id: 'mps_4', label: 'Kích thích sự ra hoa của cây gỗ' },
        ],
        answer: { kind: 'choice', correctIds: ['mps_1'] },
        explain:
          'Mô phân sinh bên hoạt động tạo ra mạch gỗ thứ cấp và mạch rây thứ cấp giúp thân và rễ dày lên theo chiều ngang ở cây Hai lá mầm.',
      },
      {
        prompt: 'Hormone thực vật nào dưới đây đóng vai trò kích thích sự chín của quả và rụng lá?',
        choices: [
          { id: 'hm_2', label: 'Ethylene' },
          { id: 'hm_3', label: 'Auxin' },
          { id: 'hm_4', label: 'Gibberellin' },
          { id: 'hm_5', label: 'Cytokinin' },
        ],
        answer: { kind: 'choice', correctIds: ['hm_2'] },
        explain:
          'Ethylene là phytohormone dạng khí duy nhất, được sinh ra nhiều trong các mô quả chín, kích thích quá trình phân hủy diệp lục, làm mềm thành tế bào quả và gây rụng lá.',
      },
    ],
    srsCards: [
      {
        hoi: 'Xuân hóa (vernalization) là gì?',
        dap: 'Là hiện tượng ra hoa của thực vật phụ thuộc vào nhiệt độ thấp (lạnh) kéo dài vào mùa đông.',
      },
      {
        hoi: 'Hormone nào kích thích nảy mầm của hạt bị ngủ nghỉ?',
        dap: 'Gibberellin (GA), nhờ kích hoạt các enzyme phân giải tinh bột thành đường cung cấp cho phôi.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh11-c3-b18',
    grade: '11',
    chapterNumber: 3,
    chapterTitle: 'Sinh trưởng và phát triển ở sinh vật',
    lessonNumber: 18,
    title: 'Thực hành: Một số thí nghiệm về sinh trưởng và phát triển ở thực vật',
    hook: 'Làm thế nào để đo đạc và vẽ biểu đồ đường cong sinh trưởng của cây đậu, hay chứng minh hormone ethylene có khả năng thúc đẩy quả chín siêu tốc?',
    theory:
      'THÍ NGHIỆM ĐO TỐC ĐỘ SINH TRƯỞNG CHIỀU CAO THÂN CÂY:\n' +
      '— Nguyên tắc: Sinh trưởng của thân cây diễn ra liên tục theo thời gian, đo đạc chiều cao định kỳ để vẽ biểu đồ biểu diễn quy luật sinh trưởng.\n' +
      '— Tiến trình:\n  1. Gieo hạt đậu xanh vào 2 chậu đất ẩm. Sau khi hạt nảy mầm và mọc cây con cao khoảng 2 cm, chọn các cây đồng đều để theo dõi.\n  2. Dùng thước dây mềm đo chiều cao cây (từ gốc sát mặt đất đến đỉnh sinh trưởng) hàng ngày vào một giờ cố định (ví dụ 8 giờ sáng) liên tục trong 10 ngày.\n  3. Ghi số liệu vào bảng và vẽ đồ thị tăng trưởng theo ngày.\n— Kết quả: Đường cong đồ thị có dạng hình chữ S (Sigmoid): Giai đoạn đầu sinh trưởng chậm, sau đó tăng tốc cực nhanh ở giai đoạn giữa, và chậm dần lại khi cây trưởng thành.\n\n' +
      'THÍ NGHIỆM TÁC ĐỘNG CỦA ETHYLENE ĐỐI VỚI SỰ CHÍN CỦA QUẢ:\n' +
      '— Nguyên tắc: Quả chín giải phóng khí ethylene tự nhiên ra xung quanh. Khí này khuếch tán kích thích các quả xanh khác chín nhanh hơn.\n' +
      '— Tiến trình:\n  1. Chuẩn bị 2 túi nilon trong suốt kín. Túi A cho vào 1 quả chuối xanh + 1 quả táo đã chín vàng (hoặc quả chuối đã chín trứng cuốc). Túi B chỉ cho 1 quả chuối xanh đơn lẻ.\n  2. Buộc chặt miệng cả hai túi, đặt ở nhiệt độ phòng.\n  3. Quan sát trạng thái vỏ chuối sau 24 giờ, 48 giờ.\n— Kết quả: Quả chuối xanh ở túi A (có quả chín) chuyển sang màu vàng chín nhanh hơn rõ rệt so với quả chuối xanh ở túi B.',
    workedExample: {
      problem:
        'Tại sao quả táo chín hoặc quả chuối chín lại có khả năng kích thích quả chuối xanh để gần nó nhanh chín hơn?',
      steps: [
        'Tìm hiểu hormone chín quả: Quả chín giải phóng ra môi trường một lượng lớn khí ethylene (phytohormone dạng khí thúc đẩy chín quả).',
        'Khuếch tán khí: Trong túi kín, khí ethylene từ quả chín tích tụ và dễ dàng thấm qua biểu bì của quả chuối xanh kế bên.',
        'Kết quả: Ethylene kích hoạt các gene tổng hợp enzyme làm chín (như amylase chuyển tinh bột thành đường, pectinase làm mềm vách tế bào quả), khiến quả xanh chín nhanh chóng.',
      ],
      answer:
        'Quả chín giải phóng khí ethylene khuếch tán sang quả xanh bên cạnh, kích hoạt các enzyme chín quả diễn ra nhanh hơn.',
    },
    checkQuestions: [
      {
        prompt:
          'Đồ thị biểu diễn sự sinh trưởng kích thước của cây đậu theo thời gian thường có đường cong hình chữ gì?',
        choices: [
          { id: 'dc_1', label: 'Hình chữ S (Sigmoid)' },
          { id: 'dc_2', label: 'Đường thẳng tuyến tính hướng lên' },
          { id: 'dc_3', label: 'Hình parabol úp ngược' },
          { id: 'dc_4', label: 'Đường hình sin dao động' },
        ],
        answer: { kind: 'choice', correctIds: ['dc_1'] },
        explain:
          'Đường cong sinh trưởng của cơ thể thực vật tuân theo đồ thị hình chữ S đặc trưng cho các giai đoạn: pha khởi đầu chậm, pha lũy thừa nhanh, pha chậm dần và pha bão hòa.',
      },
      {
        prompt: 'Trong thí nghiệm thúc đẩy chín quả, tại sao phải bọc kín nilon túi thí nghiệm?',
        choices: [
          { id: 'bq_1', label: 'Để giữ nồng độ khí ethylene không bị khuếch tán thoát ra ngoài' },
          { id: 'bq_2', label: 'Để ngăn cản ánh sáng mặt trời chiếu vào làm hỏng quả' },
          { id: 'bq_3', label: 'Để giữ nhiệt độ trong túi luôn ấm hơn bên ngoài' },
          { id: 'bq_4', label: 'Để ngăn oxy đi vào túi gây thối quả' },
        ],
        answer: { kind: 'choice', correctIds: ['bq_1'] },
        explain:
          'Bọc kín nilon giúp giữ lại toàn bộ khí ethylene dạng hơi do quả chín thoát ra bên trong túi, tăng nồng độ tác động lên quả xanh để cho kết quả nhanh và rõ nhất.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tại sao trong thực tế vận chuyển chuối đi xa người ta lại vận chuyển chuối xanh?',
        dap: 'Để hạn chế chuối tự giải phóng khí ethylene gây chín đồng loạt, mềm nhũn dễ dập nát trên đường đi; khi đến nơi tiêu thụ mới dùng ethylene để thúc chín.',
      },
      {
        hoi: 'Nêu 4 pha của đường cong sinh trưởng hình chữ S ở thực vật?',
        dap: 'Pha chậm đầu -> Pha nhanh lũy thừa -> Pha chậm lại -> Pha bão hòa/ngừng tăng trưởng.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh11-c3-b19',
    animation: {
      title: 'Biến thái hoàn toàn ở bướm và biến thái không hoàn toàn ở châu chấu',
      description:
        'Bốn ô chạy theo đúng trình tự vòng đời của bướm — kiểu BIẾN THÁI HOÀN TOÀN. Trứng nở ra SÂU BƯỚM, hình thái khác hẳn con trưởng thành, chuyên ăn lá để tích luỹ chất. Sâu hoá NHỘNG, bên trong lớp kén phần lớn cơ quan cũ bị phân giải rồi tái tổ chức lại hoàn toàn. Nhộng vũ hoá thành BƯỚM có cánh, ăn mật hoa và đẻ trứng, khép kín vòng đời. So sánh kèm theo: châu chấu thuộc kiểu không hoàn toàn, con non đã giống con trưởng thành, chỉ thiếu cánh và cơ quan sinh sản, lớn lên qua nhiều lần lột xác chứ không có giai đoạn nhộng. Điều hình động cho thấy rõ: ấu trùng và con trưởng thành của bướm ăn thức ăn khác nhau nên không tranh giành nguồn sống của nhau.',
      viewBoxWidth: 716,
      viewBoxHeight: 118,
      durationMs: 5600,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'tieu-de',
          x: 358,
          y: 24,
          text: 'Vòng đời qua các giai đoạn',
          size: 15,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'rect',
          id: 'o0',
          x: 16,
          y: 40,
          w: 150,
          h: 60,
          rx: 9,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 200, opacity: 0 },
            { atMs: 500, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n0',
          x: 91,
          y: 66,
          text: '1. Trứng',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 200, opacity: 0 },
            { atMs: 500, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p0',
          x: 91,
          y: 84,
          text: 'đẻ trên lá',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 200, opacity: 0 },
            { atMs: 500, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt0',
          x1: 166,
          y1: 70,
          x2: 189,
          y2: 70,
          stroke: 'accent',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 850, opacity: 0 },
            { atMs: 1150, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'o1',
          x: 194,
          y: 40,
          w: 150,
          h: 60,
          rx: 9,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1300, opacity: 0 },
            { atMs: 1600, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n1',
          x: 269,
          y: 66,
          text: '2. Sâu bướm',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1300, opacity: 0 },
            { atMs: 1600, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p1',
          x: 269,
          y: 84,
          text: 'ăn lá, lớn nhanh',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1300, opacity: 0 },
            { atMs: 1600, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt1',
          x1: 344,
          y1: 70,
          x2: 367,
          y2: 70,
          stroke: 'accent',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1950, opacity: 0 },
            { atMs: 2250, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'o2',
          x: 372,
          y: 40,
          w: 150,
          h: 60,
          rx: 9,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2700, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n2',
          x: 447,
          y: 66,
          text: '3. Nhộng',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2700, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p2',
          x: 447,
          y: 84,
          text: 'tái tổ chức cơ thể',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2700, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt2',
          x1: 522,
          y1: 70,
          x2: 545,
          y2: 70,
          stroke: 'accent',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3050, opacity: 0 },
            { atMs: 3350, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'o3',
          x: 550,
          y: 40,
          w: 150,
          h: 60,
          rx: 9,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3500, opacity: 0 },
            { atMs: 3800, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n3',
          x: 625,
          y: 66,
          text: '4. Bướm trưởng thành',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3500, opacity: 0 },
            { atMs: 3800, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p3',
          x: 625,
          y: 84,
          text: 'ăn mật, đẻ trứng',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3500, opacity: 0 },
            { atMs: 3800, opacity: 1 },
            { atMs: 5600, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'con-chay',
          cx: 26,
          cy: 50,
          r: 6,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 0 },
            { atMs: 500, dx: 0, dy: 0, opacity: 1 },
            { atMs: 1350, dx: 0, dy: 0, opacity: 1 },
            { atMs: 1600, dx: 178, dy: 0, opacity: 1 },
            { atMs: 2450, dx: 178, dy: 0, opacity: 1 },
            { atMs: 2700, dx: 356, dy: 0, opacity: 1 },
            { atMs: 3550, dx: 356, dy: 0, opacity: 1 },
            { atMs: 3800, dx: 534, dy: 0, opacity: 1 },
            { atMs: 5600, dx: 534, dy: 0, opacity: 1 },
          ],
        },
      ],
      captions: [
        { atMs: 500, text: 'Bướm đẻ trứng trên lá.' },
        {
          atMs: 1600,
          text: 'Trứng nở ra sâu bướm, hình thái khác hẳn con trưởng thành, chuyên ăn lá.',
        },
        {
          atMs: 2700,
          text: 'Sâu hoá nhộng: trong kén, cơ quan cũ bị phân giải rồi tái tổ chức lại hoàn toàn.',
        },
        {
          atMs: 3800,
          text: 'Vũ hoá thành bướm ăn mật hoa — ấu trùng và con trưởng thành không tranh nhau nguồn thức ăn.',
        },
      ],
    },
    grade: '11',
    chapterNumber: 3,
    chapterTitle: 'Sinh trưởng và phát triển ở sinh vật',
    lessonNumber: 19,
    title: 'Sinh trưởng và phát triển ở động vật',
    hook: 'Một chú nòng nọc tiêu biến dần cái đuôi, mọc chân rồi nhảy lên cạn thành chú ếch xanh, hay sâu bướm lột xác hóa nhộng thành bướm xinh đẹp. Đó là những quá trình phát triển biến thái đầy kỳ diệu.',
    theory:
      'CÁC KIỂU PHÁT TRIỂN Ở ĐỘNG VẬT:\n' +
      '1. Phát triển không qua biến thái:\n' +
      '   — Đặc điểm: Con non sinh ra có hình dạng, cấu tạo cơ thể tương tự như con trưởng thành (chỉ khác về kích thước và sự hoàn thiện cơ quan sinh dục).\n' +
      '   — Đại diện: Đa số động vật có xương sống (thú, người, chim, bò sát) và nhiều loài không xương sống.\n' +
      '2. Phát triển qua biến thái hoàn toàn:\n' +
      '   — Đặc điểm: Ấu trùng (sâu bướm, nòng nọc) có hình dạng, cấu tạo và sinh lý hoàn toàn khác biệt với con trưởng thành. Ấu trùng phải qua giai đoạn trung gian (như nhộng ở côn trùng) để biến đổi thành con trưởng thành.\n' +
      '   — Đại diện: Bướm, tằm, ruồi, muỗi, lưỡng cư (ếch, nhái).\n' +
      '3. Phát triển qua biến thái không hoàn toàn:\n' +
      '   — Đặc điểm: Con non (ấu trùng) có hình dạng cấu tạo gần giống con trưởng thành nhưng chưa hoàn thiện (ví dụ chưa có cánh, chưa chín sinh dục). Trải qua nhiều lần lột xác mới biến đổi thành con trưởng thành.\n' +
      '   — Đại diện: Châu chấu, gián, chuồn chuồn, tôm, cua.\n\n' +
      'HORMONE ĐIỀU HÒA SINH TRƯỞNG PHÁT TRIỂN Ở ĐỘNG VẬT:\n' +
      '1. Động vật có xương sống:\n' +
      '   — Hormone sinh trưởng (GH - từ tuyến yên): Kích thích phân chia tế bào, tăng trưởng xương và cơ bắp.\n' +
      '   — Thyroxine (từ tuyến giáp): Kích thích chuyển hóa tế bào; ở lưỡng cư, kích thích nòng nọc biến thái thành ếch.\n' +
      '   — Estrogen (nữ/cái) và Testosterone (nam/đực): Kích thích phát triển đặc điểm sinh dục phụ và chín hệ sinh dục.\n' +
      '2. Động vật không xương sống (Côn trùng): Phối hợp 2 hormone chính:\n' +
      '   — Ecdysone: Kích thích lột xác vỏ chitin của sâu non, hóa nhộng và biến thái thành bướm.\n' +
      '   — Juvenile: Ức chế quá trình biến thái hóa nhộng, giữ sâu non ở trạng thái sâu non không biến đổi thành bướm.',
    workedExample: {
      problem:
        'Hãy phân tích vai trò quyết định của hormone thyroxine đối với sự biến thái của nòng nọc thành ếch đồng.',
      steps: [
        'Nguồn gốc thyroxine: Được tiết ra từ tuyến giáp của nòng nọc.',
        'Tác dụng sinh lý: Kích thích các quá trình biến đổi giải phẫu và sinh lý mạnh mẽ: gây tiêu biến đuôi nòng nọc (chết tế bào theo lập trình), kích thích phát triển chi (mọc chân sau, chân trước), thay đổi cấu trúc mang thành phổi và thay đổi hệ tiêu hóa ăn thực vật thành ăn thịt của ếch.',
        'Hệ quả nếu thiếu hụt: Nếu cắt bỏ tuyến giáp của nòng nọc hoặc nuôi trong môi trường thiếu iốt (nguyên liệu tạo thyroxine), nòng nọc sẽ không bao giờ biến thái thành ếch được mà chỉ sinh trưởng to lên thành con nòng nọc khổng lồ.',
      ],
      answer:
        'Thyroxine kích thích quá trình tiêu đuôi, mọc chân và biến đổi mang thành phổi; thiếu thyroxine nòng nọc không thể biến thái thành ếch.',
    },
    checkQuestions: [
      {
        prompt: 'Động vật nào sau đây có kiểu phát triển qua biến thái hoàn toàn?',
        choices: [
          { id: 'bt_1', label: 'Bướm tằm' },
          { id: 'bt_2', label: 'Châu chấu' },
          { id: 'bt_3', label: 'Thằn lằn bóng' },
          { id: 'bt_4', label: 'Mèo nhà' },
        ],
        answer: { kind: 'choice', correctIds: ['bt_1'] },
        explain:
          'Bướm tằm có ấu trùng là sâu tằm ăn lá dâu khác hoàn toàn bướm trưởng thành bay hút mật, phải trải qua giai đoạn kén nhộng trung gian để biến đổi cơ thể hoàn toàn.',
      },
      {
        prompt:
          'Hormone nào ở côn trùng có tác dụng ức chế sự biến đổi sâu non thành nhộng và bướm, giúp duy trì trạng thái sâu non?',
        choices: [
          { id: 'hc_1', label: 'Juvenile' },
          { id: 'hc_2', label: 'Ecdysone' },
          { id: 'hc_3', label: 'Thyroxine' },
          { id: 'hc_4', label: 'Hormone sinh trưởng (GH)' },
        ],
        answer: { kind: 'choice', correctIds: ['hc_1'] },
        explain:
          'Juvenile (hormone trẻ hóa) ức chế sự biến thái. Khi nồng độ Juvenile giảm xuống thấp, hormone Ecdysone mới phát huy tác dụng kích thích hóa nhộng và biến đổi thành bướm trưởng thành.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phát triển của động vật không qua biến thái là gì?',
        dap: 'Là kiểu phát triển mà con non sinh ra có hình dạng, cấu tạo tương tự con trưởng thành, không trải qua giai đoạn lột xác biến đổi hình thái đột ngột.',
      },
      {
        hoi: 'Tại sao thiếu iốt trong thức ăn và nước uống lại làm nòng nọc không biến thành ếch được?',
        dap: 'Vì iốt là thành phần bắt buộc để tuyến giáp tổng hợp hormone thyroxine (hormone kích thích biến thái của nòng nọc).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh11-c3-b20',
    animation: {
      title: 'Vòng đời khép kín của ếch',
      description:
        'Năm giai đoạn xếp thành một vòng tròn, chấm sáng chạy vòng quanh không dừng lại ở đâu. Ếch cái đẻ TRỨNG thành đám trong nước; trứng nở ra NÒNG NỌC sống hoàn toàn dưới nước, thở bằng mang, có đuôi để bơi và ăn thực vật thuỷ sinh. Nòng nọc mọc HAI CHÂN SAU trước, rồi mọc thêm hai chân trước, phổi phát triển thay dần mang. Giai đoạn ẾCH CON đuôi tiêu biến dần, con vật bắt đầu lên cạn và chuyển sang ăn động vật nhỏ. ẾCH TRƯỞNG THÀNH sống lưỡng cư rồi quay lại nước đẻ trứng, khép kín vòng. Cái mà chỉ vòng tròn nói được: đây không phải một chuỗi có điểm cuối mà là chu trình lặp lại, và trong cùng một đời, con vật đổi cả nơi ở, cách thở lẫn loại thức ăn.',
      viewBoxWidth: 440,
      viewBoxHeight: 300,
      durationMs: 10000,
      loop: true,
      shapes: [
        {
          kind: 'circle',
          id: 'vong',
          cx: 220,
          cy: 155,
          r: 104,
          fill: 'surface',
          stroke: 'muted',
          strokeWidth: 2,
          dash: '8 6',
        },
        {
          kind: 'label',
          id: 'tieu-de',
          x: 220,
          y: 22,
          text: 'Vòng đời của ếch (biến thái hoàn toàn)',
          size: 14,
          anchor: 'middle',
          fill: 'primary',
        },
        { kind: 'circle', id: 'g0', cx: 220, cy: 51, r: 22, fill: 'primary' },
        {
          kind: 'label',
          id: 'lg0',
          x: 250,
          y: 46,
          text: 'Trứng',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
        },
        { kind: 'circle', id: 'g1', cx: 319, cy: 123, r: 22, fill: 'primary' },
        {
          kind: 'label',
          id: 'lg1',
          x: 347,
          y: 120,
          text: 'Nòng nọc',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lg1b',
          x: 347,
          y: 136,
          text: '(mang, đuôi)',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
        },
        { kind: 'circle', id: 'g2', cx: 281, cy: 239, r: 22, fill: 'primary' },
        {
          kind: 'label',
          id: 'lg2',
          x: 281,
          y: 280,
          text: 'Mọc 2 chân sau',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        { kind: 'circle', id: 'g3', cx: 159, cy: 239, r: 22, fill: 'primary' },
        {
          kind: 'label',
          id: 'lg3',
          x: 159,
          y: 280,
          text: 'Ếch con,',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lg3b',
          x: 159,
          y: 294,
          text: 'đuôi tiêu biến',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        { kind: 'circle', id: 'g4', cx: 121, cy: 123, r: 22, fill: 'primary' },
        {
          kind: 'label',
          id: 'lg4',
          x: 93,
          y: 120,
          text: 'Ếch',
          size: 12,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lg4b',
          x: 93,
          y: 136,
          text: 'trưởng thành',
          size: 12,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'circle',
          id: 'chay',
          cx: 220,
          cy: 51,
          r: 9,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 1000, dx: 61.1, dy: 19.9 },
            { atMs: 2000, dx: 98.9, dy: 71.9 },
            { atMs: 3000, dx: 98.9, dy: 136.1 },
            { atMs: 4000, dx: 61.1, dy: 188.1 },
            { atMs: 5000, dx: 0, dy: 208 },
            { atMs: 6000, dx: -61.1, dy: 188.1 },
            { atMs: 7000, dx: -98.9, dy: 136.1 },
            { atMs: 8000, dx: -98.9, dy: 71.9 },
            { atMs: 9000, dx: -61.1, dy: 19.9 },
            { atMs: 10000, dx: 0, dy: 0 },
          ],
        },
      ],
      captions: [
        { atMs: 200, text: 'Ếch cái đẻ trứng thành đám trong nước.' },
        {
          atMs: 2000,
          text: 'Trứng nở ra nòng nọc sống dưới nước, thở bằng mang, có đuôi, ăn thực vật thuỷ sinh.',
        },
        {
          atMs: 4000,
          text: 'Nòng nọc mọc hai chân sau trước, rồi mọc hai chân trước; phổi phát triển thay dần mang.',
        },
        { atMs: 6000, text: 'Ếch con đuôi tiêu biến, lên cạn, chuyển sang ăn động vật nhỏ.' },
        {
          atMs: 8000,
          text: 'Ếch trưởng thành quay lại nước đẻ trứng — chu trình khép kín, lặp lại.',
        },
      ],
    },
    grade: '11',
    chapterNumber: 3,
    chapterTitle: 'Sinh trưởng và phát triển ở sinh vật',
    lessonNumber: 20,
    title: 'Thực hành: Quan sát các giai đoạn sinh trưởng, phát triển ở động vật và vẽ vòng đời',
    hook: 'Làm thế nào để phân biệt sâu bướm, nhộng, bướm trưởng thành và phác họa sơ đồ vòng đời sinh động của chúng phục vụ học tập?',
    theory:
      'VÒNG ĐỜI BIẾN THÁI HOÀN TOÀN Ở CÔN TRÙNG (BƯỚM CẢI):\n' +
      'Trải qua 4 giai đoạn rõ rệt:\n' +
      '1. Trứng bướm: Được đẻ ở mặt dưới lá rau cải.\n' +
      '2. Sâu non (Ấu trùng): Hình dạng sâu bò, ăn lá cây liên tục để tích lũy dinh dưỡng, lột xác 4-5 lần để tăng kích thước. Đây là giai đoạn phá hoại mùa màng nặng nề nhất.\n' +
      '3. Nhộng: Sâu non hóa nhộng trong kén tĩnh lặng, không ăn uống nhưng bên trong diễn ra sự tái cấu trúc toàn diện cơ thể.\n' +
      '4. Bướm trưởng thành: Có cánh bay lượn, chuyển sang ăn mật hoa, thụ phấn cho cây và sinh sản đẻ trứng kết thúc vòng đời.\n\n' +
      'VÒNG ĐỜI BIẾN THÁI HOÀN TOÀN Ở LƯỠNG CƯ (ẾCH ĐỒNG):\n' +
      'Trứng thụ tinh (dưới nước) → Nòng nọc (sống dưới nước, thở mang, có đuôi bơi) → Nòng nọc mọc chân sau → Mọc chân trước và tiêu biến đuôi → Ếch con nhảy lên cạn (thở phổi và da) → Ếch trưởng thành sinh sản.\n\n' +
      'VÒNG ĐỜI BIẾN THÁI KHÔNG HOÀN TOÀN Ở CÔN TRÙNG (CHÂU CHẤU):\n' +
      'Trứng → Ấu trùng (châu chấu non chưa có cánh, cấu tạo gần giống mẹ) → Lột xác 5-6 lần (mỗi lần cánh dài ra một ít) → Châu chấu trưởng thành có cánh dài và cơ quan sinh dục hoàn chỉnh.',
    workedExample: {
      problem:
        'Tại sao trong nông nghiệp, người ta thường tìm cách tiêu diệt sâu bướm hại rau ở giai đoạn sâu non (sâu bò) chứ không đợi đến khi chúng biến đổi thành bướm mới diệt?',
      steps: [
        'Phân tích chế độ ăn giai đoạn sâu non: Sâu non có cơ quan miệng nhai gặm cực mạnh, ăn liên tục lá cây để tích lũy năng lượng cho pha nhộng, gây hại tàn phá rau xanh.',
        'Phân tích chế độ ăn giai đoạn bướm: Bướm trưởng thành có vòi hút chỉ hút mật hoa, không ăn lá rau, không phá hoại trực tiếp (chỉ đẻ trứng).',
        'Kết luận: Diệt sâu ở giai đoạn sâu non là biện pháp ngăn chặn trực tiếp và kịp thời sự phá hoại mùa màng.',
      ],
      answer:
        'Sâu non ăn gặm lá rau phá hoại mùa màng trực tiếp; bướm trưởng thành chỉ hút mật hoa nên cần tiêu diệt ở giai đoạn sâu non.',
    },
    checkQuestions: [
      {
        prompt:
          'Giai đoạn nào trong vòng đời của bướm cải đóng vai trò phá hoại các cây rau họ Cải nghiêm trọng nhất?',
        choices: [
          { id: 'vd_1', label: 'Sâu non (Ấu trùng)' },
          { id: 'vd_2', label: 'Nhộng trong kén' },
          { id: 'vd_3', label: 'Bướm trưởng thành' },
          { id: 'vd_4', label: 'Trứng bướm' },
        ],
        answer: { kind: 'choice', correctIds: ['vd_1'] },
        explain:
          'Sâu non của bướm có hàm nhai khỏe, ăn lá rau liên tục để lớn lên làm rách nát lá rau, gây thiệt hại kinh tế lớn cho nông dân.',
      },
      {
        prompt:
          'Vòng đời của ếch đồng trải qua giai đoạn con non sống hoàn toàn dưới nước và hô hấp bằng mang được gọi là:',
        choices: [
          { id: 'ec_1', label: 'Nòng nọc' },
          { id: 'ec_2', label: 'Nhộng nước' },
          { id: 'ec_3', label: 'Ếch con' },
          { id: 'ec_4', label: 'Ấu trùng có cánh' },
        ],
        answer: { kind: 'choice', correctIds: ['ec_1'] },
        explain:
          'Nòng nọc là giai đoạn ấu trùng của ếch, có đuôi để bơi và thở bằng mang, ăn các loài tảo nhỏ dưới nước trước khi biến thái thành ếch.',
      },
    ],
    srsCards: [
      {
        hoi: 'Nêu 3 giai đoạn của vòng đời biến thái không hoàn toàn ở châu chấu?',
        dap: 'Trứng -> Ấu trùng (châu chấu non lột xác nhiều lần) -> Châu chấu trưởng thành.',
      },
      {
        hoi: 'Giai đoạn nhộng ở bướm có đặc điểm sinh lý gì nổi bật?',
        dap: 'Là giai đoạn tĩnh, nhộng không di chuyển và không ăn uống; các tế bào ấu trùng tiêu biến nhường chỗ cho sự hình thành cấu trúc cơ thể bướm.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh11-c4-b21',
    animation: {
      title: 'Thụ phấn, ống phấn và thụ tinh kép ở thực vật có hoa',
      description:
        'Năm ô kể lại chặng đường của hạt phấn. THỤ PHẤN: hạt phấn rơi lên đầu nhuỵ, nhờ gió, côn trùng hoặc con người. NẢY MẦM: hạt phấn hút nước, mọc ra ống phấn xuyên dọc vòi nhuỵ đi xuống bầu nhuỵ, mang theo hai giao tử đực. THỤ TINH KÉP, chỉ có ở thực vật hạt kín: một giao tử đực kết hợp với trứng tạo HỢP TỬ 2n sẽ phát triển thành phôi, giao tử đực còn lại kết hợp với nhân lưỡng bội của tế bào trung tâm tạo nội nhũ 3n làm kho thức ăn nuôi phôi. Sau đó noãn biến thành HẠT, bầu nhuỵ phát triển thành QUẢ bao lấy hạt. Điểm hình động làm rõ: gọi là thụ tinh kép vì có hai lần kết hợp diễn ra gần như cùng lúc, và nội nhũ mới là phần con người ăn ở hạt gạo, hạt ngô.',
      viewBoxWidth: 538,
      viewBoxHeight: 234,
      durationMs: 6700,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'tieu-de',
          x: 269,
          y: 24,
          text: 'Từ hạt phấn tới hạt và quả',
          size: 15,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'rect',
          id: 'o0',
          x: 16,
          y: 40,
          w: 150,
          h: 60,
          rx: 9,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 200, opacity: 0 },
            { atMs: 500, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n0',
          x: 91,
          y: 66,
          text: '1. Thụ phấn',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 200, opacity: 0 },
            { atMs: 500, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p0',
          x: 91,
          y: 84,
          text: 'phấn lên đầu nhuỵ',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 200, opacity: 0 },
            { atMs: 500, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt0',
          x1: 166,
          y1: 70,
          x2: 189,
          y2: 70,
          stroke: 'accent',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 850, opacity: 0 },
            { atMs: 1150, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'o1',
          x: 194,
          y: 40,
          w: 150,
          h: 60,
          rx: 9,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1300, opacity: 0 },
            { atMs: 1600, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n1',
          x: 269,
          y: 66,
          text: '2. Mọc ống phấn',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1300, opacity: 0 },
            { atMs: 1600, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p1',
          x: 269,
          y: 84,
          text: 'xuyên vòi nhuỵ',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1300, opacity: 0 },
            { atMs: 1600, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt1',
          x1: 344,
          y1: 70,
          x2: 367,
          y2: 70,
          stroke: 'accent',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1950, opacity: 0 },
            { atMs: 2250, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'o2',
          x: 372,
          y: 40,
          w: 150,
          h: 60,
          rx: 9,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2700, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n2',
          x: 447,
          y: 66,
          text: '3. Thụ tinh kép',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2700, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p2',
          x: 447,
          y: 84,
          text: 'hai lần kết hợp',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2700, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt2',
          x1: 447,
          y1: 100,
          x2: 91,
          y2: 151,
          stroke: 'accent',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3050, opacity: 0 },
            { atMs: 3350, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'o3',
          x: 16,
          y: 156,
          w: 150,
          h: 60,
          rx: 9,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3500, opacity: 0 },
            { atMs: 3800, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n3',
          x: 91,
          y: 182,
          text: '4. Hợp tử 2n + nội nhũ 3n',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3500, opacity: 0 },
            { atMs: 3800, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p3',
          x: 91,
          y: 200,
          text: 'phôi và kho thức ăn',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3500, opacity: 0 },
            { atMs: 3800, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt3',
          x1: 166,
          y1: 186,
          x2: 189,
          y2: 186,
          stroke: 'accent',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4150, opacity: 0 },
            { atMs: 4450, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'o4',
          x: 194,
          y: 156,
          w: 150,
          h: 60,
          rx: 9,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4600, opacity: 0 },
            { atMs: 4900, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n4',
          x: 269,
          y: 182,
          text: '5. Hạt và quả',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4600, opacity: 0 },
            { atMs: 4900, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p4',
          x: 269,
          y: 200,
          text: 'noãn → hạt, bầu → quả',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4600, opacity: 0 },
            { atMs: 4900, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'con-chay',
          cx: 26,
          cy: 50,
          r: 6,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 0 },
            { atMs: 500, dx: 0, dy: 0, opacity: 1 },
            { atMs: 1350, dx: 0, dy: 0, opacity: 1 },
            { atMs: 1600, dx: 178, dy: 0, opacity: 1 },
            { atMs: 2450, dx: 178, dy: 0, opacity: 1 },
            { atMs: 2700, dx: 356, dy: 0, opacity: 1 },
            { atMs: 3550, dx: 356, dy: 0, opacity: 1 },
            { atMs: 3800, dx: 0, dy: 116, opacity: 1 },
            { atMs: 4650, dx: 0, dy: 116, opacity: 1 },
            { atMs: 4900, dx: 178, dy: 116, opacity: 1 },
            { atMs: 6700, dx: 178, dy: 116, opacity: 1 },
          ],
        },
      ],
      captions: [
        { atMs: 500, text: 'Hạt phấn rơi lên đầu nhuỵ nhờ gió, côn trùng hoặc con người.' },
        {
          atMs: 1600,
          text: 'Hạt phấn nảy mầm, ống phấn xuyên vòi nhuỵ xuống bầu, mang theo hai giao tử đực.',
        },
        {
          atMs: 2700,
          text: 'Thụ tinh kép — nét riêng của thực vật hạt kín: hai giao tử đực kết hợp gần như cùng lúc.',
        },
        {
          atMs: 3800,
          text: 'Một giao tử tạo hợp tử 2n thành phôi; giao tử kia tạo nội nhũ 3n nuôi phôi.',
        },
        {
          atMs: 4900,
          text: 'Noãn thành hạt, bầu nhuỵ thành quả — nội nhũ chính là phần ta ăn ở hạt gạo, hạt ngô.',
        },
      ],
    },
    grade: '11',
    chapterNumber: 4,
    chapterTitle: 'Sinh sản ở sinh vật',
    lessonNumber: 21,
    title: 'Sinh sản ở thực vật',
    hook: 'Hạt phấn nhỏ bé cuốn theo chiều gió tiếp xúc đầu nhụy, thực hiện quá trình thụ tinh kép độc đáo để kết trái ngọt chứa đầy chất dinh dưỡng nuôi phôi.',
    theory:
      'SINH SẢN VÔ TÍNH Ở THỰC VẬT (không có sự kết hợp giao tử):\n' +
      '— Hình thức tự nhiên (sinh sản sinh dưỡng): Sinh sản bằng bào tử (rêu, dương xỉ) hoặc bằng các cơ quan sinh dưỡng như rễ củ (khoai lang), thân bò (dâu tây), thân rễ (gừng), lá (thuốc bỏng).\n' +
      '— Hình thức nhân tạo (ứng dụng): Giâm cành, chiết cành, ghép cành, ghép mắt và nuôi cấy mô tế bào thực vật.\n\n' +
      'SINH SẢN HỮU TÍNH Ở THỰC VẬT HẠT KÍN (có thụ tinh):\n' +
      '1. Cấu tạo hoa: Nhị hoa gồm chỉ nhị và bao phấn; trong bao phấn có các hạt phấn, nơi sinh ra giao tử đực. Nhụy hoa gồm đầu nhụy, vòi nhụy và bầu nhụy; trong bầu nhụy có noãn, bên trong noãn là túi phôi chứa tế bào trứng (giao tử cái).\n' +
      '2. Thụ phấn (Pollination): Sự phát tán hạt phấn từ bao phấn tiếp xúc với đầu nhụy (tự thụ phấn hoặc thụ phấn chéo nhờ gió, nước, côn trùng).\n' +
      '3. Thụ tinh kép (Double Fertilization - đặc trưng của thực vật hạt kín):\n' +
      '   Hạt phấn nảy mầm trên đầu nhụy mọc ra ống phấn đi vào noãn qua lỗ noãn. Tế bào sinh sản trong ống phấn nguyên phân tạo 2 giao tử đực (tinh trùng):\n' +
      '   — Giao tử đực 1 (n) + Tế bào trứng (n) → Hợp tử (2n) → phát triển thành Phôi của hạt.\n' +
      '   — Giao tử đực 2 (n) + Nhân cực (2n) ở trung tâm túi phôi → Tế bào tam bội (3n) → phát triển thành Nội nhũ (phôi nhũ) cung cấp chất dinh dưỡng nuôi phôi sinh trưởng.\n' +
      '4. Tạo hạt và quả: Noãn đã thụ tinh phát triển thành Hạt (vỏ noãn hóa thành vỏ hạt). Bầu nhụy sinh trưởng dày lên hóa thành Quả chứa hạt bên trong.',
    workedExample: {
      problem: 'Tại sao quá trình thụ tinh ở thực vật hạt kín lại được gọi là thụ tinh kép?',
      steps: [
        'Nhận diện số lượng giao tử tham gia: Hạt phấn giải phóng ra hai giao tử đực (tinh trùng) đi vào túi phôi.',
        'Phân tích sự thụ tinh thứ nhất: Giao tử đực thứ nhất kết hợp với tế bào trứng tạo thành hợp tử 2n (sau này phát triển thành phôi).',
        'Phân tích sự thụ tinh thứ hai: Đồng thời, giao tử đực thứ hai kết hợp với nhân cực 2n ở giữa túi phôi tạo thành nhân tam bội 3n (sau này phát triển thành nội nhũ nuôi phôi).',
        'Kết luận: Gọi là thụ tinh kép vì cả hai giao tử đực đều tham gia vào hai quá trình thụ tinh diễn ra cùng một lúc trong túi phôi.',
      ],
      answer:
        'Gọi là thụ tinh kép vì cả 2 giao tử đực cùng tham gia thụ tinh: một tạo hợp tử (2n), một tạo nội nhũ (3n).',
    },
    checkQuestions: [
      {
        prompt:
          'Trong thụ tinh kép ở thực vật hạt kín, tế bào tam bội (3n) được hình thành do sự kết hợp của:',
        choices: [
          { id: 'tk_1', label: 'Giao tử đực thứ hai kết hợp với nhân cực (2n)' },
          { id: 'tk_2', label: 'Giao tử đực thứ nhất kết hợp với tế bào trứng (n)' },
          { id: 'tk_3', label: 'Tế bào trứng (n) kết hợp với nhân cực (2n)' },
          { id: 'tk_4', label: 'Hai giao tử đực kết hợp với nhau' },
        ],
        answer: { kind: 'choice', correctIds: ['tk_1'] },
        explain:
          'Tế bào tam bội 3n hình thành từ sự kết hợp của giao tử đực đơn bội (n) thứ hai với nhân cực lưỡng bội (2n) nằm ở trung tâm túi phôi.',
      },
      {
        prompt:
          'Bộ phận nào của hoa biến đổi phát triển thành quả sau khi quá trình thụ tinh hoàn tất?',
        choices: [
          { id: 'lh_1', label: 'Bầu nhụy' },
          { id: 'lh_2', label: 'Noãn' },
          { id: 'lh_3', label: 'Cánh hoa' },
          { id: 'lh_4', label: 'Đầu nhụy' },
        ],
        answer: { kind: 'choice', correctIds: ['lh_1'] },
        explain:
          'Noãn phát triển thành hạt chứa phôi, còn bầu nhụy phình to biến đổi thành quả bao bọc bảo vệ hạt và giúp phát tán hạt.',
      },
    ],
    srsCards: [
      {
        hoi: 'Nội nhũ (phôi nhũ) ở hạt thực vật hạt kín có bộ nhiễm sắc thể là bao nhiêu?',
        dap: 'Tam bội (3n).',
      },
      {
        hoi: 'Liệt kê 3 phương pháp nhân giống vô tính nhân tạo phổ biến ở thực vật?',
        dap: 'Giâm cành, chiết cành và ghép (ghép cành hoặc ghép mắt).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh11-c4-b22',
    grade: '11',
    chapterNumber: 4,
    chapterTitle: 'Sinh sản ở sinh vật',
    lessonNumber: 22,
    title: 'Thực hành: Nhân giống vô tính ở thực vật và thụ phấn nhân tạo',
    hook: 'Đem kiến thức về sinh sản ra làm thật: cắm cành giâm cho ra rễ, quấn bầu đất chiết cành bưởi, hay tự tay thụ phấn chéo cho hoa bí.',
    theory:
      'KỸ THUẬT GIÂM CÀNH thực tế:\n' +
      '— Chọn cành bánh tẻ (khỏe mạnh, không quá non hay già). Cắt đoạn dài 15-20 cm nghiêng góc 45 độ ngay dưới mắt chồi (giúp tăng diện tích tiếp xúc hút nước).\n' +
      '— Nhúng phần gốc cành vào dung dịch kích thích ra rễ (auxin nhân tạo như NAA, IBA) trong 5-10 giây rồi cắm nghiêng vào luống đất tơi xốp ẩm. Giữ ẩm mát tốt.\n\n' +
      'KỸ THUẬT CHIẾT CÀNH thực tế:\n' +
      '— Chọn cành bưởi/cam to bằng ngón tay cái. Dùng dao sắc khoanh vỏ hai vòng cách nhau bằng 1.5 - 2 lần đường kính cành, bóc lớp vỏ ra.\n' +
      '— Cạo sạch lớp chất nhầy bám quanh lõi gỗ (lớp tượng tầng cambium) để ngăn cành liền vỏ lại.\n' +
      '— Đắp bùn ao phơi khô trộn rơm băm nhỏ hoặc mụn xơ dừa ẩm bao quanh vết cạo thành bầu đất tròn. Bọc nilon bảo vệ bầu, buộc chặt dây hai đầu. Khi rễ đâm ra ngoài bầu đất có màu vàng nâu, cắt cành chiết đem trồng.\n\n' +
      'KỸ THUẬT THỰC HÀNH GHÉP MẮT (GHÉP CHỮ T):\n' +
      '— Trên gốc ghép, rạch vỏ hình chữ T, dùng mũi dao cạy nhẹ vỏ hai bên chữ T.\n' +
      '— Cắt lấy mắt ghép (có kèm một mảnh vỏ nhỏ và chồi ngủ) từ cây giống tốt. Luồn mắt ghép vào khe chữ T trên gốc ghép sao cho các lớp cambium áp sát nhau. Buộc chặt nilon giữ ẩm.\n\n' +
      'THỤ PHẤN NHÂN TẠO:\n' +
      '— Hái hoa đực mới nở của cây bí/bầu, ngắt bỏ cánh hoa phơi bao phấn. Quét nhẹ bao phấn đực lên đầu nhụy của hoa cái đã nở chín vào buổi sáng sớm (khi đầu nhụy còn dịch nhầy bám dính tốt).',
    workedExample: {
      problem:
        'Tại sao khi thực hiện chiết cành cây ăn quả, ta bắt buộc phải cạo thật sạch lớp chất nhầy (tượng tầng) bám trên lõi gỗ tại vị trí khoanh vỏ?',
      steps: [
        'Nhận diện cấu tạo vỏ thân: Lớp vỏ chứa mạch rây (vận chuyển chất hữu cơ đi xuống) và lớp tượng tầng (tế bào cambium có khả năng phân chia tạo vỏ mới).',
        'Phân tích nếu không cạo sạch: Lớp tế bào tượng tầng còn sót lại sẽ nhanh chóng phân chia, nối liền lớp vỏ trên và lớp vỏ dưới vết cắt (liền da). Mạch rây được khôi phục và chất dinh dưỡng trôi tuột xuống rễ mà không tích lũy lại.',
        'Kết quả khi cạo sạch: Mạch rây bị gián đoạn hoàn toàn, chất hữu cơ và hormone auxin từ lá vận chuyển xuống bị ứ đọng tại mép vỏ phía trên vết khoanh, kích thích tế bào tại đó biệt hóa hình thành rễ phụ.',
      ],
      answer:
        'Cạo sạch tượng tầng ngăn cành liền vỏ khôi phục mạch rây, ép chất hữu cơ ứ đọng ở mép vỏ phía trên kích thích ra rễ phụ.',
    },
    checkQuestions: [
      {
        prompt:
          'Trong kỹ thuật ghép cành hoặc ghép mắt, điều kiện tiên quyết để mối ghép sống được và liền sẹo là:',
        choices: [
          {
            id: 'gp_1',
            label: 'Áp sát và khớp khít lớp tượng tầng (cambium) của cành ghép và gốc ghép',
          },
          { id: 'gp_2', label: 'Bôi thật nhiều phân bón hóa học vào vị trí mối ghép' },
          { id: 'gp_3', label: 'Buộc dây nilon lỏng lẻo để thông thoáng khí' },
          { id: 'gp_4', label: 'Chọn cành ghép to gấp ba lần gốc ghép' },
        ],
        answer: { kind: 'choice', correctIds: ['gp_1'] },
        explain:
          'Lớp tượng tầng chứa tế bào phân sinh phân chia tạo mạch dẫn mới kết nối liền sẹo giữa gốc ghép và mắt/cành ghép. Nếu hai lớp này không tiếp xúc, mối ghép sẽ chết khô.',
      },
      {
        prompt:
          'Thao tác giâm cành thực tế thường cắt xéo gốc cành góc 45 độ nhằm mục đích chủ yếu gì?',
        choices: [
          {
            id: 'gc_1',
            label:
              'Tăng diện tích tiếp xúc của gốc cành với đất ẩm giúp hấp thụ nước và khoáng tốt hơn',
          },
          { id: 'gc_2', label: 'Hạn chế cành cây bị thối do đọng nước ở vết cắt' },
          { id: 'gc_3', label: 'Làm giảm trọng lượng của cành giâm' },
          { id: 'gc_4', label: 'Đánh dấu đầu gốc để tránh cắm ngược đầu cành' },
        ],
        answer: { kind: 'choice', correctIds: ['gc_1'] },
        explain:
          'Cắt vát góc 45 độ làm tăng diện tích mặt cắt ngang của gốc cành tiếp xúc với đất và dung dịch kích rễ, giúp cành hút nước tốt hơn và kích thích ra nhiều rễ phụ hơn.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tại sao phải chọn cành bánh tẻ để tiến hành giâm cành hoặc chiết cành?',
        dap: 'Cành bánh tẻ có sức sống cao, lượng dinh dưỡng dự trữ dồi dào và tế bào mô phân sinh dễ kích hoạt phân chia tạo rễ hơn cành non hay già.',
      },
      {
        hoi: 'Thụ phấn nhân tạo bằng tay ở cây bầu bí thường được thực hiện vào thời điểm nào trong ngày?',
        dap: 'Thực hiện vào sáng sớm (khoảng 7-9 giờ sáng), khi hoa cái nở to nhất và đầu nhụy tiết nhiều dịch bám phấn nhất.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh11-c4-b23',
    animation: {
      title: 'Từ thụ tinh đến làm tổ ở động vật có vú',
      description:
        'Năm ô nối tiếp theo đúng trình tự. Trứng chín và rụng khỏi buồng trứng, được loa vòi hứng vào ống dẫn trứng. THỤ TINH xảy ra ở một phần ba đầu ống dẫn trứng: một tinh trùng n kết hợp với trứng n tạo hợp tử 2n, ngay lúc đó màng trứng biến đổi ngăn không cho tinh trùng thứ hai vào. PHÂN CẮT: hợp tử nguyên phân liên tiếp thành 2, 4, 8 tế bào trong khi vẫn trôi dần về tử cung; số tế bào tăng nhưng kích thước cả khối gần như không đổi. PHÔI NANG: khối tế bào tạo khoang rỗng bên trong. LÀM TỔ: phôi nang bám và vùi vào lớp niêm mạc tử cung dày lên, hình thành nhau thai để nhận chất dinh dưỡng từ mẹ. Điều hình động nói rõ: thụ tinh không xảy ra ở tử cung mà ở ống dẫn trứng.',
      viewBoxWidth: 538,
      viewBoxHeight: 234,
      durationMs: 6700,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'tieu-de',
          x: 269,
          y: 24,
          text: 'Sinh sản hữu tính: các chặng đầu của phôi',
          size: 15,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'rect',
          id: 'o0',
          x: 16,
          y: 40,
          w: 150,
          h: 60,
          rx: 9,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 200, opacity: 0 },
            { atMs: 500, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n0',
          x: 91,
          y: 66,
          text: '1. Trứng rụng',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 200, opacity: 0 },
            { atMs: 500, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p0',
          x: 91,
          y: 84,
          text: 'vào ống dẫn trứng',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 200, opacity: 0 },
            { atMs: 500, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt0',
          x1: 166,
          y1: 70,
          x2: 189,
          y2: 70,
          stroke: 'accent',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 850, opacity: 0 },
            { atMs: 1150, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'o1',
          x: 194,
          y: 40,
          w: 150,
          h: 60,
          rx: 9,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1300, opacity: 0 },
            { atMs: 1600, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n1',
          x: 269,
          y: 66,
          text: '2. Thụ tinh',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1300, opacity: 0 },
            { atMs: 1600, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p1',
          x: 269,
          y: 84,
          text: '1/3 ngoài ống dẫn',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1300, opacity: 0 },
            { atMs: 1600, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt1',
          x1: 344,
          y1: 70,
          x2: 367,
          y2: 70,
          stroke: 'accent',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1950, opacity: 0 },
            { atMs: 2250, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'o2',
          x: 372,
          y: 40,
          w: 150,
          h: 60,
          rx: 9,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2700, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n2',
          x: 447,
          y: 66,
          text: '3. Phân cắt',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2700, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p2',
          x: 447,
          y: 84,
          text: '2 → 4 → 8 tế bào',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2700, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt2',
          x1: 447,
          y1: 100,
          x2: 91,
          y2: 151,
          stroke: 'accent',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3050, opacity: 0 },
            { atMs: 3350, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'o3',
          x: 16,
          y: 156,
          w: 150,
          h: 60,
          rx: 9,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3500, opacity: 0 },
            { atMs: 3800, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n3',
          x: 91,
          y: 182,
          text: '4. Phôi nang',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3500, opacity: 0 },
            { atMs: 3800, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p3',
          x: 91,
          y: 200,
          text: 'có khoang rỗng',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3500, opacity: 0 },
            { atMs: 3800, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt3',
          x1: 166,
          y1: 186,
          x2: 189,
          y2: 186,
          stroke: 'accent',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4150, opacity: 0 },
            { atMs: 4450, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'o4',
          x: 194,
          y: 156,
          w: 150,
          h: 60,
          rx: 9,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4600, opacity: 0 },
            { atMs: 4900, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n4',
          x: 269,
          y: 182,
          text: '5. Làm tổ',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4600, opacity: 0 },
            { atMs: 4900, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p4',
          x: 269,
          y: 200,
          text: 'vùi vào niêm mạc',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4600, opacity: 0 },
            { atMs: 4900, opacity: 1 },
            { atMs: 6700, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'con-chay',
          cx: 26,
          cy: 50,
          r: 6,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 0 },
            { atMs: 500, dx: 0, dy: 0, opacity: 1 },
            { atMs: 1350, dx: 0, dy: 0, opacity: 1 },
            { atMs: 1600, dx: 178, dy: 0, opacity: 1 },
            { atMs: 2450, dx: 178, dy: 0, opacity: 1 },
            { atMs: 2700, dx: 356, dy: 0, opacity: 1 },
            { atMs: 3550, dx: 356, dy: 0, opacity: 1 },
            { atMs: 3800, dx: 0, dy: 116, opacity: 1 },
            { atMs: 4650, dx: 0, dy: 116, opacity: 1 },
            { atMs: 4900, dx: 178, dy: 116, opacity: 1 },
            { atMs: 6700, dx: 178, dy: 116, opacity: 1 },
          ],
        },
      ],
      captions: [
        {
          atMs: 500,
          text: 'Trứng chín rụng khỏi buồng trứng, được loa vòi hứng vào ống dẫn trứng.',
        },
        {
          atMs: 1600,
          text: 'Thụ tinh ở một phần ba đầu ống dẫn trứng: tinh trùng n + trứng n → hợp tử 2n.',
        },
        {
          atMs: 2700,
          text: 'Hợp tử nguyên phân liên tiếp; số tế bào tăng nhưng cả khối gần như không to thêm.',
        },
        {
          atMs: 3800,
          text: 'Khối tế bào tạo khoang rỗng bên trong, thành phôi nang, vẫn trôi về tử cung.',
        },
        {
          atMs: 4900,
          text: 'Phôi nang vùi vào niêm mạc tử cung và hình thành nhau thai nhận dinh dưỡng từ mẹ.',
        },
      ],
    },
    grade: '11',
    chapterNumber: 4,
    chapterTitle: 'Sinh sản ở sinh vật',
    lessonNumber: 23,
    title: 'Sinh sản ở động vật',
    hook: 'Từ những quả trứng thụ tinh ngoài nước đến sự bảo vệ phôi thai tuyệt đối trong tử cung mẹ qua nhau thai, động vật đã tiến hóa những cơ chế sinh sản vô cùng kỳ diệu.',
    theory:
      'SINH SẢN VÔ TÍNH Ở ĐỘNG VẬT (không có sự kết hợp giao tử):\n' +
      '— Phân đôi (Fission): Tế bào mẹ co thắt phân chia thành 2 cá thể con bằng nhau (ở trùng biến hình, trùng đế giày, trùng roi).\n' +
      '— Nảy chồi (Budding): Một phần cơ thể mẹ phát triển lồi ra thành chồi, lớn lên tách ra thành cá thể độc lập (ở thủy tức, san hô).\n' +
      '— Phân mảnh (Fragmentation): Cơ thể mẹ tách ra thành nhiều mảnh, mỗi mảnh tái sinh thành một cơ thể mới (ở bọt biển, sao biển, giun dẹp).\n' +
      '— Trinh sản (Parthenogenesis): Trứng không qua thụ tinh vẫn phát triển thành cá thể mới (ở ong và kiến, cá thể đó là con đực đơn bội n; ngoài ra còn gặp ở một số loài rệp và thằn lằn).\n\n' +
      'SINH SẢN HỮU TÍNH Ở ĐỘNG VẬT (có kết hợp giao tử đực n và cái n):\n' +
      '1. Các hình thức thụ tinh:\n' +
      '   — Thụ tinh ngoài: Trứng và tinh trùng gặp nhau ngoài cơ thể con cái (trong nước, gặp ở cá, lưỡng cư). Hiệu suất thấp, cần nhiều giao tử.\n' +
      '   — Thụ tinh trong: Tinh trùng gặp trứng trong đường sinh dục con cái (ở thú, chim, bò sát, côn trùng). Hiệu suất thụ tinh cao, tiết kiệm tinh trùng.\n' +
      '2. Các hình thức sinh con/đẻ trứng:\n' +
      '   — Đẻ trứng (Oviparous): Phôi phát triển trong trứng ngoài cơ thể mẹ nhờ chất dinh dưỡng lòng đỏ (bò sát, chim, lưỡng cư, cá).\n' +
      '   — Đẻ trứng thai (Ovoviviparous): Trứng thụ tinh giữ lại trong ống sinh sản của mẹ tự nở thành con rồi chui ra ngoài, không trao đổi chất với mẹ (một số loài cá mập, rắn).\n' +
      '   — Đẻ con (Viviparous): Phôi phát triển trong tử cung mẹ, trao đổi chất và nhận dinh dưỡng trực tiếp qua nhau thai (thú có nhau).\n\n' +
      'CƠ CHẾ ĐIỀU HÒA SINH SẢN (ở người):\n' +
      '— Ở Nam: Vùng dưới đồi tiết GnRH kích thích tuyến yên tiết FSH (kích thích tế bào Sertoli sinh tinh) và LH (kích thích tế bào kẽ Leydig tiết Testosterone kích hoạt sinh tinh và đặc điểm sinh dục nam).\n' +
      '— Ở Nữ: Tuyến yên tiết FSH (kích thích nang trứng chín tiết Estrogen) và LH (gây chín, rụng trứng và tạo thể vàng tiết Progesterone). Nồng độ Estrogen/Progesterone cao sẽ ức chế ngược tuyến yên giảm tiết FSH/LH (đây là cơ sở của thuốc tránh thai hằng ngày).',
    workedExample: {
      problem:
        'Hãy giải thích tại sao trinh sản ở loài ong lại tạo ra ong đực mang bộ NST đơn bội (n), trong khi ong thợ và ong chúa lại là lưỡng bội (2n).',
      steps: [
        'Phân tích sinh sản của ong chúa: Ong chúa giảm phân tạo ra các tế bào trứng đơn bội (n).',
        'Hình thành ong đực: Những quả trứng đơn bội (n) không được thụ tinh với tinh trùng sẽ phát triển tự phát bằng trinh sản thành ong đực (n).',
        'Hình thành ong chúa và ong thợ: Những quả trứng đơn bội (n) được thụ tinh với tinh trùng đơn bội (n) của ong đực tạo hợp tử lưỡng bội (2n), phát triển thành ong chúa hoặc ong thợ tùy thuộc vào chế độ dinh dưỡng sữa ong chúa.',
      ],
      answer:
        'Trứng (n) không thụ tinh phát triển thành ong đực (n) bằng trinh sản; trứng (n) thụ tinh tinh trùng (n) tạo ong thợ/chúa (2n).',
    },
    checkQuestions: [
      {
        prompt:
          'Hình thức sinh sản vô tính nào ở động vật xảy ra khi cơ thể mẹ phân rã thành các phần riêng biệt, mỗi phần sau đó tái sinh thành một cơ thể hoàn chỉnh?',
        choices: [
          { id: 'ss_1', label: 'Phân mảnh (Fragmentation)' },
          { id: 'ss_2', label: 'Nảy chồi' },
          { id: 'ss_3', label: 'Phân đôi' },
          { id: 'ss_4', label: 'Trinh sản' },
        ],
        answer: { kind: 'choice', correctIds: ['ss_1'] },
        explain:
          'Phân mảnh là hình thức cơ thể mẹ bị đứt đoạn thành các mảnh, mỗi mảnh phân chia nguyên phân để tái sinh đầy đủ các cơ quan bị thiếu tạo cơ thể mới (như ở sao biển).',
      },
      {
        prompt:
          'Hormone LH do thùy trước tuyến yên tiết ra ở nữ giới có vai trò chủ yếu nào trong chu kỳ sinh sản?',
        choices: [
          { id: 'lh_1', label: 'Kích thích chín rụng trứng và hình thành thể vàng' },
          { id: 'lh_2', label: 'Kích thích cơ tử cung co bóp mạnh khi sinh con' },
          { id: 'lh_3', label: 'Nuôi dưỡng các nang trứng non phát triển' },
          { id: 'lh_4', label: 'Kích thích tuyến vú tiết sữa nuôi con' },
        ],
        answer: { kind: 'choice', correctIds: ['lh_1'] },
        explain:
          'Sự tăng vọt nồng độ LH (LH surge) ở giữa chu kỳ kinh nguyệt kích thích nang trứng chín vỡ ra phóng thích trứng (sự rụng trứng) và biến đổi vỏ nang trứng còn lại thành thể vàng.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phân biệt thụ tinh ngoài và thụ tinh trong ở động vật?',
        dap: 'Thụ tinh ngoài xảy ra trong môi trường nước ngoài cơ thể; thụ tinh trong xảy ra bên trong đường sinh dục của con cái.',
      },
      {
        hoi: 'Tại sao đẻ con tiến hóa hơn đẻ trứng?',
        dap: 'Vì phôi thai phát triển trong cơ thể mẹ được bảo vệ an toàn khỏi các yếu tố môi trường và kẻ thù, được nuôi dưỡng liên tục qua nhau thai.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh11-c4-b24',
    grade: '11',
    chapterNumber: 4,
    chapterTitle: 'Sinh sản ở sinh vật',
    lessonNumber: 24,
    title:
      'Thực hành: Khảo sát hiện tượng thụ tinh ở động vật và tìm hiểu các biện pháp tránh thai',
    hook: 'Tìm hiểu các biện pháp tránh thai khoa học hiện đại, cơ chế hoạt động của bao cao su, thuốc nội tiết hay vòng tránh thai để bảo vệ sức khỏe sinh sản.',
    theory:
      'CƠ CHẾ CỦA CÁC BIỆN PHÁP TRÁNH THAI HIỆN ĐẠI:\n' +
      '1. Bao cao su (Condom):\n' +
      '   — Cơ chế: Ngăn chặn cơ học không cho tinh trùng tiếp xúc với trứng.\n' +
      '   — Ưu điểm nổi bật: Là biện pháp duy nhất ngăn ngừa hiệu quả các bệnh lây truyền qua đường tình dục (STDs/STIs như HIV, lậu, giang mai, sùi mào gà).\n' +
      '2. Viên uống tránh thai hàng ngày (nội tiết):\n' +
      '   — Cơ chế: Chứa progesterone và estrogen phối hợp nồng độ thấp. Duy trì lượng hormone này ổn định trong máu gây phản hồi ngược âm tính lên tuyến yên và vùng dưới đồi, ức chế tiết FSH và LH, ngăn cản sự chín rụng trứng.\n' +
      '3. Dụng cụ tử cung (Vòng tránh thai - IUD):\n' +
      '   — Cơ chế: Đặt vào buồng tử cung gây phản ứng viêm nhẹ vô trùng tại chỗ, làm thay đổi niêm mạc tử cung khiến phôi không thể bám vào để làm tổ.\n' +
      '4. Thắt ống dẫn tinh (ở nam) / Thắt ống dẫn trứng (ở nữ):\n' +
      '   — Cơ chế: Cắt và cột hai đầu ống dẫn để chặn đường di chuyển của giao tử (tinh trùng/trứng). Biện pháp đình sản vĩnh viễn có hiệu quả tránh thai gần như 100%.\n' +
      '5. Tính chu kỳ kinh nguyệt (tránh ngày rụng trứng): Tránh quan hệ tình dục vào giai đoạn quanh ngày rụng trứng (ngày 14 đối với chu kỳ 28 ngày). Tuy nhiên hiệu quả thấp do chu kỳ dễ bị dao động bởi stress, sức khỏe.',
    workedExample: {
      problem:
        'Giải thích tại sao việc sử dụng thuốc tránh thai hằng ngày chứa estrogen và progesterone nhân tạo lại có thể ngăn chặn hiệu quả sự mang thai.',
      steps: [
        'Nhận diện thành phần thuốc: Thuốc chứa hàm lượng nhỏ estrogen và progesterone.',
        'Phân tích cơ chế sinh lý: Khi uống thuốc hàng ngày, nồng độ các hormone này trong máu được duy trì ổn định ở mức tương đối cao.',
        'Liên hệ ngược âm tính: Nồng độ hormone cao phát tín hiệu ngược ức chế vùng dưới đồi giảm tiết GnRH và thùy trước tuyến yên giảm tiết FSH, LH.',
        'Kết quả: Thiếu FSH nang trứng không lớn lên được; thiếu LH trứng không chín rụng, không có hiện tượng rụng trứng thì không thể thụ thai.',
      ],
      answer:
        'Thuốc tránh thai duy trì Estrogen/Progesterone cao trong máu để ức chế ngược tuyến yên ngừng tiết FSH và LH, ngăn cản hoàn toàn sự rụng trứng.',
    },
    checkQuestions: [
      {
        prompt:
          'Biện pháp tránh thai nào sau đây có khả năng ngăn ngừa đồng thời cả mang thai ngoài ý muốn và các bệnh lây truyền qua đường tình dục (STDs)?',
        choices: [
          { id: 'ct_1', label: 'Bao cao su' },
          { id: 'ct_2', label: 'Viên uống tránh thai hàng ngày' },
          { id: 'ct_3', label: 'Dụng cụ tử cung (vòng tránh thai)' },
          { id: 'ct_4', label: 'Thắt ống dẫn trứng' },
        ],
        answer: { kind: 'choice', correctIds: ['ct_1'] },
        explain:
          'Bao cao su tạo màng ngăn vật lý ngăn cản sự tiếp xúc dịch sinh dục và máu giữa hai cơ thể, phòng tránh lây nhiễm tác nhân bệnh như virus HIV, vi khuẩn lậu, giang mai.',
      },
      {
        prompt: 'Thắt ống dẫn tinh ở nam giới ngăn cản sự mang thai bằng cách nào?',
        choices: [
          {
            id: 'to_1',
            label:
              'Chặn đường di chuyển của tinh trùng từ tinh hoàn ra túi tinh, khiến tinh dịch xuất ra không chứa tinh trùng',
          },
          { id: 'to_2', label: 'Ngăn chặn tinh hoàn sản sinh ra tinh trùng và testosterone' },
          { id: 'to_3', label: 'Làm tinh trùng bị tiêu hủy ngay khi vừa sinh ra' },
          { id: 'to_4', label: 'Làm mất đi khả năng cương cứng của dương vật' },
        ],
        answer: { kind: 'choice', correctIds: ['to_1'] },
        explain:
          'Thắt ống dẫn tinh chỉ cắt đứt đường đi của tinh trùng từ tinh hoàn lên niệu đạo để xuất ra ngoài. Tinh hoàn vẫn sinh tinh bình thường (tinh trùng tự tiêu hủy trong ống dẫn) và vẫn tiết testosterone bình thường, không ảnh hưởng sinh lý nam.',
      },
    ],
    srsCards: [
      {
        hoi: 'Viên thuốc tránh thai hàng ngày ức chế rụng trứng bằng cách nào?',
        dap: 'Duy trì nồng độ estrogen và progesterone trong máu để ức chế ngược tuyến yên tiết FSH và LH (các hormone kích thích chín rụng trứng).',
      },
      {
        hoi: 'Cơ chế tránh thai của vòng tránh thai (IUD) là gì?',
        dap: 'Ngăn cản phôi thai làm tổ ở niêm mạc tử cung bằng cách gây phản ứng viêm nhẹ vô trùng tại chỗ.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh11-c5-b25',
    animation: {
      title: 'Bốn hệ cơ quan nối với nhau qua dòng máu',
      description:
        'Bốn hệ cơ quan đặt quanh một vòng tròn trung tâm là HỆ TUẦN HOÀN, chấm sáng chạy vòng để cho thấy chúng không làm việc rời rạc. Hệ TIÊU HOÁ đưa chất dinh dưỡng đã hấp thụ vào máu. Hệ HÔ HẤP nạp oxygen vào máu và nhận lại CO₂ để thải ra. Máu mang oxygen cùng chất dinh dưỡng tới mọi TẾ BÀO để hô hấp tế bào tạo ATP, đồng thời nhận về chất thải. Hệ BÀI TIẾT lọc máu, loại urea và điều chỉnh lượng nước, muối, pH để giữ cân bằng nội môi. Vòng chạy không có điểm bắt đầu cố định: hỏng một khâu thì cả vòng rối. Điều hình động nói được mà danh sách bốn hệ thì không: máu là sợi dây nối chung, và bốn hệ này phục vụ cùng một việc duy nhất là giữ cho tế bào đủ nguyên liệu và sạch chất thải.',
      viewBoxWidth: 440,
      viewBoxHeight: 300,
      durationMs: 9000,
      loop: true,
      shapes: [
        {
          kind: 'circle',
          id: 'tuan-hoan',
          cx: 220,
          cy: 152,
          r: 56,
          fill: 'primary',
          opacity: 0.85,
        },
        {
          kind: 'label',
          id: 'l-th',
          x: 220,
          y: 148,
          text: 'Hệ tuần hoàn',
          size: 13,
          anchor: 'middle',
          fill: 'surface',
        },
        {
          kind: 'label',
          id: 'l-th2',
          x: 220,
          y: 168,
          text: '(máu)',
          size: 12,
          anchor: 'middle',
          fill: 'surface',
        },
        {
          kind: 'rect',
          id: 'o-tieu-hoa',
          x: 20,
          y: 44,
          w: 132,
          h: 48,
          rx: 10,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'l-tieu-hoa',
          x: 86,
          y: 74,
          text: 'Tiêu hoá',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'rect',
          id: 'o-ho-hap',
          x: 288,
          y: 44,
          w: 132,
          h: 48,
          rx: 10,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'l-ho-hap',
          x: 354,
          y: 74,
          text: 'Hô hấp',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'rect',
          id: 'o-bai-tiet',
          x: 288,
          y: 216,
          w: 132,
          h: 48,
          rx: 10,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'l-bai-tiet',
          x: 354,
          y: 246,
          text: 'Bài tiết',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'rect',
          id: 'o-te-bao',
          x: 20,
          y: 216,
          w: 132,
          h: 48,
          rx: 10,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'l-te-bao',
          x: 86,
          y: 246,
          text: 'Tế bào toàn thân',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'arrow',
          id: 'a1',
          x1: 152,
          y1: 78,
          x2: 180,
          y2: 116,
          stroke: 'accent',
          strokeWidth: 2.5,
          keyframes: [
            { atMs: 0, opacity: 0.4 },
            { atMs: 100, opacity: 0.4 },
            { atMs: 300, opacity: 1 },
            { atMs: 2200, opacity: 1 },
            { atMs: 2400, opacity: 0.4 },
            { atMs: 9000, opacity: 0.4 },
          ],
        },
        {
          kind: 'arrow',
          id: 'a2',
          x1: 292,
          y1: 78,
          x2: 262,
          y2: 116,
          stroke: 'accent',
          strokeWidth: 2.5,
          keyframes: [
            { atMs: 0, opacity: 0.4 },
            { atMs: 2000, opacity: 0.4 },
            { atMs: 2200, opacity: 1 },
            { atMs: 4400, opacity: 1 },
            { atMs: 4600, opacity: 0.4 },
            { atMs: 9000, opacity: 0.4 },
          ],
        },
        {
          kind: 'arrow',
          id: 'a3',
          x1: 260,
          y1: 190,
          x2: 288,
          y2: 224,
          stroke: 'accent',
          strokeWidth: 2.5,
          keyframes: [
            { atMs: 0, opacity: 0.4 },
            { atMs: 4200, opacity: 0.4 },
            { atMs: 4400, opacity: 1 },
            { atMs: 6600, opacity: 1 },
            { atMs: 6800, opacity: 0.4 },
            { atMs: 9000, opacity: 0.4 },
          ],
        },
        {
          kind: 'arrow',
          id: 'a4',
          x1: 180,
          y1: 190,
          x2: 152,
          y2: 224,
          stroke: 'accent',
          strokeWidth: 2.5,
          keyframes: [
            { atMs: 0, opacity: 0.4 },
            { atMs: 6400, opacity: 0.4 },
            { atMs: 6600, opacity: 1 },
            { atMs: 8400, opacity: 1 },
            { atMs: 8600, opacity: 0.4 },
            { atMs: 9000, opacity: 0.4 },
          ],
        },
        {
          kind: 'arrow',
          id: 'a2b',
          x1: 250,
          y1: 108,
          x2: 280,
          y2: 70,
          stroke: 'accent',
          strokeWidth: 2.5,
          keyframes: [
            { atMs: 0, opacity: 0.4 },
            { atMs: 2000, opacity: 0.4 },
            { atMs: 2200, opacity: 1 },
            { atMs: 4400, opacity: 1 },
            { atMs: 4600, opacity: 0.4 },
            { atMs: 9000, opacity: 0.4 },
          ],
        },
        {
          kind: 'label',
          id: 'l-o2',
          x: 298,
          y: 108,
          text: 'O₂ vào',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'l-co2',
          x: 246,
          y: 58,
          text: 'CO₂ ra',
          size: 11,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'arrow',
          id: 'a4b',
          x1: 160,
          y1: 230,
          x2: 190,
          y2: 194,
          stroke: 'accent',
          strokeWidth: 2.5,
          keyframes: [
            { atMs: 0, opacity: 0.4 },
            { atMs: 6400, opacity: 0.4 },
            { atMs: 6600, opacity: 1 },
            { atMs: 8400, opacity: 1 },
            { atMs: 8600, opacity: 0.4 },
            { atMs: 9000, opacity: 0.4 },
          ],
        },
        {
          kind: 'circle',
          id: 'chay',
          cx: 220,
          cy: 82,
          r: 8,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 1125, dx: 49.5, dy: 20.5 },
            { atMs: 2250, dx: 70, dy: 70 },
            { atMs: 3375, dx: 49.5, dy: 119.5 },
            { atMs: 4500, dx: 0, dy: 140 },
            { atMs: 5625, dx: -49.5, dy: 119.5 },
            { atMs: 6750, dx: -70, dy: 70 },
            { atMs: 7875, dx: -49.5, dy: 20.5 },
            { atMs: 9000, dx: 0, dy: 0 },
          ],
        },
      ],
      captions: [
        { atMs: 300, text: 'Hệ tiêu hoá đưa chất dinh dưỡng đã hấp thụ vào máu.' },
        { atMs: 2200, text: 'Hệ hô hấp nạp oxygen vào máu và nhận lại CO₂ để thải ra.' },
        {
          atMs: 4400,
          text: 'Hệ bài tiết lọc máu, loại urea, điều chỉnh nước, muối và pH — giữ cân bằng nội môi.',
        },
        {
          atMs: 6600,
          text: 'Máu mang oxygen và chất dinh dưỡng tới mọi tế bào, nhận về chất thải.',
        },
        {
          atMs: 8400,
          text: 'Vòng không có điểm bắt đầu cố định: hỏng một khâu thì cả bốn hệ cùng rối.',
        },
      ],
    },
    grade: '11',
    chapterNumber: 5,
    chapterTitle:
      'Mối quan hệ giữa các quá trình sinh lý trong cơ thể sinh vật và ngành nghề liên quan',
    lessonNumber: 25,
    title: 'Mối quan hệ giữa các quá trình sinh lý trong cơ thể sinh vật',
    hook: 'Khi bạn chạy bộ, tim đập dồn dập, phổi thở gấp, tuyến mồ hôi hoạt động mạnh để làm mát. Tất cả các hệ cơ quan đang phối hợp nhịp nhàng dưới sự chỉ huy của hệ thần kinh và nội tiết.',
    theory:
      'CƠ THỂ THỰC VẬT LÀ MỘT THỂ THỐNG NHẤT:\n' +
      'Mọi hoạt động sinh lý của thực vật đều có mối liên quan mật thiết và phụ thuộc lẫn nhau:\n' +
      '— Hệ rễ hấp thụ nước và ion khoáng cung cấp nguyên liệu cho lá quang hợp ở trên.\n' +
      '— Lá quang hợp tổng hợp chất hữu cơ (đường sucrose) vận chuyển qua mạch rây đi xuống nuôi dưỡng tế bào rễ sinh trưởng.\n' +
      '— Hoạt động hô hấp tế bào ở rễ phân giải chất hữu cơ tạo ATP cung cấp năng lượng cho rễ chủ động hút khoáng.\n  + Nếu lá ngừng quang hợp hoặc rễ ngừng hút nước, toàn bộ cây sẽ ngừng sinh trưởng và chết.\n\n' +
      'CƠ THỂ ĐỘNG VẬT LÀ MỘT THỂ THỐNG NHẤT:\n' +
      'Sự phối hợp nhịp nhàng giữa các hệ cơ quan đảm bảo duy trì cân bằng nội môi dưới sự điều khiển của hệ thần kinh và hệ nội tiết:\n' +
      '— Hệ tiêu hóa lấy chất dinh dưỡng, hệ hô hấp lấy khí O₂ cung cấp cho hệ tuần hoàn.\n' +
      '— Hệ tuần hoàn vận chuyển O₂ và dinh dưỡng đến từng tế bào phục vụ hô hấp tế bào tạo năng lượng ATP.\n' +
      '— Hô hấp tế bào thải ra chất thải và CO₂. Hệ tuần hoàn vận chuyển khí CO₂ đến phổi đào thải ra ngoài, mang chất cặn bã đến thận bài tiết.\n' +
      '— Khi cơ thể hoạt động mạnh (chạy): Hệ thần kinh giao cảm kích thích tăng nhịp tim, tăng nhịp thở để đáp ứng nhu cầu O₂ của cơ bắp, giãn mạch da để tỏa nhiệt.',
    workedExample: {
      problem:
        'Phân tích mối quan hệ phụ thuộc lẫn nhau giữa quá trình quang hợp ở lá và quá trình hấp thụ nước, muối khoáng ở rễ thực vật.',
      steps: [
        'Mối quan hệ từ rễ đến lá: Quá trình quang hợp cần nước làm nguyên liệu quang phân li và cần các nguyên tố khoáng (như Mg để cấu tạo diệp lục, N cấu tạo protein enzym quang hợp). Nước và khoáng này bắt buộc phải do rễ cây hấp thụ và vận chuyển lên lá.',
        'Mối quan hệ từ lá đến rễ: Rễ cây là cơ quan dưới lòng đất không thể quang hợp. Để sinh trưởng và thực hiện hút khoáng chủ động (cần ATP), tế bào rễ phải nhận chất hữu cơ (sản phẩm quang hợp của lá) vận chuyển xuống qua mạch rây để làm nguyên liệu cho hô hấp rễ tạo ATP.',
        'Tổng hợp: Hai quá trình này phụ thuộc qua lại chặt chẽ tạo thành vòng tuần hoàn vật chất thống nhất trong cây.',
      ],
      answer:
        'Rễ cung cấp nước, khoáng làm nguyên liệu quang hợp cho lá; lá cung cấp chất hữu cơ từ quang hợp làm nguyên liệu hô hấp tạo ATP cho rễ hút khoáng.',
    },
    checkQuestions: [
      {
        prompt:
          'Quá trình hô hấp ở rễ thực vật có vai trò trực tiếp nào đối với hoạt động hút khoáng của cây?',
        choices: [
          {
            id: 'qh_1',
            label: 'Giải phóng năng lượng ATP cung cấp cho quá trình hút khoáng chủ động',
          },
          { id: 'qh_2', label: 'Tự tổng hợp chất hữu cơ đưa lên lá' },
          { id: 'qh_3', label: 'Làm tăng thế nước trong đất xung quanh rễ' },
          { id: 'qh_4', label: 'Tiêu biến các ion khoáng dư thừa trong tế bào rễ' },
        ],
        answer: { kind: 'choice', correctIds: ['qh_1'] },
        explain:
          'Rễ hấp thụ phần lớn ion khoáng ngược građien nồng độ (hút chủ động), quá trình này cần năng lượng ATP sinh ra từ hô hấp hiếu khí của tế bào rễ.',
      },
      {
        prompt:
          'Khi cơ thể động vật hoạt động mạnh (chạy bộ), hệ cơ quan nào phối hợp tăng hoạt động để cung cấp đủ O₂ và đào thải kịp thời CO₂ cho cơ bắp?',
        choices: [
          { id: 'ch_1', label: 'Hệ tuần hoàn và hệ hô hấp' },
          { id: 'ch_2', label: 'Hệ tiêu hóa và hệ bài tiết' },
          { id: 'ch_3', label: 'Hệ vận động và hệ sinh sản' },
          { id: 'ch_4', label: 'Hệ nội tiết và hệ tiêu hóa' },
        ],
        answer: { kind: 'choice', correctIds: ['ch_1'] },
        explain:
          'Hệ hô hấp tăng nhịp thở để lấy O₂ và thải CO₂; hệ tuần hoàn tăng nhịp tim và tốc độ tuần hoàn máu để vận chuyển nhanh lượng khí O₂ đến cơ bắp và mang CO₂ về phổi thải đi.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tại sao khi một hệ cơ quan bị suy giảm chức năng thì toàn bộ cơ thể động vật bị ảnh hưởng?',
        dap: 'Vì cơ thể là một thể thống nhất, các hệ cơ quan hoạt động phụ thuộc lẫn nhau; sự ngưng trệ của một khâu sẽ làm mất cân bằng nội môi toàn cơ thể.',
      },
      {
        hoi: 'Ở thực vật và ở động vật, cái gì giữ vai trò chủ đạo điều hòa mọi hoạt động sống?',
        dap: 'Ở thực vật: Hệ hormone thực vật. Ở động vật: Hệ thần kinh và hệ nội tiết.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh11-c5-b26',
    grade: '11',
    chapterNumber: 5,
    chapterTitle:
      'Mối quan hệ giữa các quá trình sinh lý trong cơ thể sinh vật và ngành nghề liên quan',
    lessonNumber: 26,
    title: 'Một số ngành nghề liên quan đến sinh học cơ thể',
    hook: 'Hiểu biết sâu sắc về sinh học cơ thể mở ra cánh cửa dẫn đến những ngành nghề đầy hứa hẹn: bác sĩ cứu người, kỹ sư nông nghiệp xanh, hay nhà nghiên cứu công nghệ sinh học.',
    theory:
      'CÁC LĨNH VỰC NGÀNH NGHỀ LIÊN QUAN ĐẾN SINH HỌC CƠ THỂ:\n' +
      '1. Nhóm ngành Y - Dược học (Medicine & Pharmacy):\n' +
      '   — Nội dung: Bác sĩ, dược sĩ, điều dưỡng viên sử dụng kiến thức giải phẫu sinh lý người để chẩn đoán bệnh, điều trị, bào chế thuốc và chăm sóc sức khỏe cộng đồng.\n' +
      '2. Nhóm ngành Nông - Lâm - Thủy sản (Agriculture & Forestry):\n' +
      '   — Trồng trọt: Kỹ sư ứng dụng sinh lý thực vật (bón phân đúng cách, tưới tiêu khoa học, quang chu kỳ trong nhà màng) để tối ưu hóa năng suất rau quả.\n' +
      '   — Chăn nuôi và Thú y: Bác sĩ thú y ứng dụng sinh lý động vật (dinh dưỡng thức ăn, sinh sản nhân tạo) để nhân giống nuôi dưỡng vật nuôi tốt nhất.\n' +
      '   — Lâm nghiệp: Trồng rừng, bảo tồn đa dạng sinh học rừng.\n' +
      '3. Nhóm ngành Công nghệ sinh học và Nghiên cứu (Biotechnology):\n' +
      '   — Sản xuất các chế phẩm sinh học (phân bón vi sinh, thuốc trừ sâu sinh học Bt, hormone tăng trưởng thực vật).\n' +
      '   — Kỹ thuật nuôi cấy mô tế bào thực vật để nhân giống vô tính lan, sâm ngọc linh quy mô công nghiệp.\n' +
      '   — Nghiên cứu phát triển thuốc y học cá thể hóa, liệu pháp gene tế bào gốc.',
    workedExample: {
      problem:
        'Hãy mô tả công việc cụ thể của một kỹ sư nông nghiệp công nghệ cao ứng dụng kiến thức sinh lý thực vật để trồng cà chua trong nhà màng.',
      steps: [
        'Ứng dụng quang hợp: Thiết kế hệ thống đèn LED chiếu sáng nhân tạo điều chỉnh bước sóng tối ưu cho diệp lục hấp thụ, kéo dài thời gian quang hợp của cây.',
        'Ứng dụng dinh dưỡng khoáng: Thiết kế hệ thống tưới nhỏ giọt tự động, pha loãng nồng độ các ion khoáng (N, P, K, Ca...) chính xác theo từng giai đoạn sinh trưởng (ra lá, ra hoa, tạo quả) tránh gây ưu trương rễ.',
        'Ứng dụng hormone: Sử dụng các hormone kích thích tạo quả không hạt hoặc thúc chín quả đồng loạt.',
      ],
      answer:
        'Điều chỉnh cường độ ánh sáng, thành phần dinh dưỡng tưới nhỏ giọt và điều hòa hormone thực vật để tối ưu hóa năng suất cây trồng.',
    },
    checkQuestions: [
      {
        prompt:
          'Ngành nghề nào dưới đây ứng dụng trực tiếp kiến thức về sinh lý động vật và dinh dưỡng để chăm sóc sức khỏe, điều trị bệnh cho vật nuôi?',
        choices: [
          { id: 'nn_1', label: 'Thú y và Chăn nuôi' },
          { id: 'nn_2', label: 'Lâm nghiệp' },
          { id: 'nn_3', label: 'Bào chế dược phẩm y khoa' },
          { id: 'nn_4', label: 'Trồng trọt công nghệ cao' },
        ],
        answer: { kind: 'choice', correctIds: ['nn_1'] },
        explain:
          'Bác sĩ thú y và kỹ sư chăn nuôi cần hiểu sâu sắc sinh lý tiêu hóa, sinh sản và miễn dịch của vật nuôi để phòng bệnh và nâng cao sản lượng thịt sữa.',
      },
      {
        prompt:
          'Kỹ thuật nhân giống lan đột biến quý hiếm bằng phương pháp nuôi cấy mô tế bào thực vật thuộc lĩnh vực ngành nghề nào?',
        choices: [
          { id: 'ln_1', label: 'Công nghệ sinh học (Biotechnology)' },
          { id: 'ln_2', label: 'Dược học lâm sàng' },
          { id: 'ln_3', label: 'Y học cổ truyền' },
          { id: 'ln_4', label: 'Khai thác tài nguyên rừng' },
        ],
        answer: { kind: 'choice', correctIds: ['ln_1'] },
        explain:
          'Nuôi cấy mô tế bào in vitro là một nhánh quan trọng của công nghệ sinh học thực vật, ứng dụng tính toàn năng của tế bào để nhân bản sinh khối lớn giống cây.',
      },
    ],
    srsCards: [
      {
        hoi: 'Kể tên 3 ngành nghề truyền thống ứng dụng kiến thức sinh học cơ thể?',
        dap: 'Y học, Nông nghiệp (trồng trọt, chăn nuôi) và Lâm nghiệp.',
      },
      {
        hoi: 'Một kỹ sư nông nghiệp ứng dụng sinh lý thực vật thế nào khi bón phân?',
        dap: 'Xác định đúng loại phân, đúng liều lượng, đúng thời điểm nhu cầu của cây và bón đúng cách tránh làm ngộ độc rễ.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
