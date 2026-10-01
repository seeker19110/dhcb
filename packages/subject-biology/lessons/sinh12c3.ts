// lessons/sinh12c3.ts — Sinh học 12, Chương 11: Sinh thái học phục hồi, bảo tồn
// và phát triển bền vững (Bài 31-32). Chương này của Chương trình GDPT 2018 trước đây
// còn thiếu trong registry — bổ sung 2026-09-13.
import type { BiologyLesson } from '../lessonTypes.js'

export const SINH12_C3_LESSONS: BiologyLesson[] = [
  {
    id: 'sinh12-c11-b31',
    grade: '12',
    chapterNumber: 11,
    chapterTitle: 'Sinh thái học phục hồi, bảo tồn và phát triển bền vững',
    lessonNumber: 31,
    title: 'Sinh thái học phục hồi và bảo tồn',
    hook: 'Rừng ngập mặn Cần Giờ từng bị chất diệt cỏ huỷ gần như trắng trong chiến tranh. Từ năm 1978, TP. Hồ Chí Minh trồng lại đước trên hàng chục nghìn hecta; tới năm 2000 nơi đây được UNESCO công nhận là khu dự trữ sinh quyển đầu tiên của Việt Nam. Câu hỏi đáng hỏi là: vì sao trồng lại đước thì cua, cá, chim cũng tự quay về, trong khi trồng lại bạch đàn trên đất trống thì không?',
    theory:
      '## Sinh thái học phục hồi là gì\n' +
      '— Là lĩnh vực ứng dụng hiểu biết sinh thái để giúp một hệ sinh thái đã bị suy thoái, hư hại hoặc phá huỷ quay trở lại trạng thái gần với trạng thái tự nhiên ban đầu về cấu trúc và chức năng.\n' +
      '— VÌ SAO phục hồi được: quần xã không phải tập hợp các loài rời rạc mà là một mạng lưới quan hệ dinh dưỡng và quan hệ hỗ trợ. Nếu khôi phục được NHÓM LOÀI NỀN TẢNG tạo ra môi trường sống (rừng đước tạo bãi bùn yếm khí, tán che, rễ chống sóng), thì các loài phụ thuộc sẽ tự tìm về theo con đường phát tán tự nhiên. Đây chính là lí do phục hồi Cần Giờ có hiệu quả — người ta không trồng cua, mà trồng lại thứ tạo ra nơi ở cho cua.\n' +
      '— ĐIỀU KIỆN để phục hồi thành công: (1) còn nguồn giống hoặc quần thể lân cận để phát tán tới; (2) nền đất/nước chưa bị biến đổi vượt ngưỡng không đảo ngược (nhiễm mặn nặng, xói trơ đá mẹ, kim loại nặng tồn dư); (3) loại bỏ hoặc giảm được tác nhân gây suy thoái ban đầu — phục hồi mà vẫn còn nguyên nguyên nhân thì chỉ tốn tiền.\n' +
      '— GIỚI HẠN quan trọng: hệ phục hồi hiếm khi giống hệt hệ gốc. Thành phần loài, tuổi cây, cấu trúc tầng, đất thường vẫn khác; nhiều chức năng (tích luỹ carbon trong đất, quần xã nấm rễ) cần hàng chục tới hàng trăm năm. Do đó BẢO VỆ hệ còn nguyên vẹn luôn rẻ và chắc chắn hơn phục hồi hệ đã mất.\n\n' +
      '## Các biện pháp phục hồi thường dùng\n' +
      '1. Phục hồi thụ động (khoanh nuôi tái sinh tự nhiên): loại bỏ tác nhân gây hại rồi để diễn thế thứ sinh tự chạy. Rẻ nhất, dùng khi nguồn giống tại chỗ còn tốt.\n' +
      '2. Phục hồi chủ động: trồng lại loài bản địa, cải tạo nền đất, tái thả loài đã biến mất tại chỗ. Dùng khi nguồn giống đã cạn hoặc đất đã biến đổi.\n' +
      '3. Kiểm soát loài ngoại lai xâm lấn (ốc bươu vàng, cây mai dương, tôm hùm đất) — nếu bỏ qua bước này, loài ngoại lai sẽ chiếm chỗ ngay khi hệ vừa mở ra.\n\n' +
      '## Bảo tồn đa dạng sinh học — hai hình thức\n' +
      '— Bảo tồn nguyên vị (in situ): giữ loài ngay trong môi trường sống tự nhiên của nó, qua vườn quốc gia, khu bảo tồn thiên nhiên, khu dự trữ sinh quyển. ƯU điểm quyết định: giữ được cả quần thể lẫn quan hệ sinh thái và áp lực chọn lọc tự nhiên, nên loài vẫn tiếp tục tiến hoá thích nghi. Đây là hình thức được ưu tiên.\n' +
      '— Bảo tồn chuyển vị (ex situ): đưa loài ra khỏi nơi sống tự nhiên — vườn thú, vườn thực vật, ngân hàng hạt giống, ngân hàng gene, nuôi cấy mô. Chỉ là giải pháp bổ trợ hoặc tình thế khi nơi ở tự nhiên không còn an toàn, vì quần thể nuôi nhốt thường nhỏ, dễ giao phối gần và mất dần các đặc điểm thích nghi hoang dã.\n\n' +
      'Ở Việt Nam: Luật Đa dạng sinh học, hệ thống hơn 30 vườn quốc gia (Cúc Phương, Cát Tiên, Ba Bể, Phong Nha - Kẻ Bàng…), Sách Đỏ Việt Nam xếp hạng mức đe doạ của các loài làm căn cứ ưu tiên bảo vệ.',
    workedExample: {
      problem:
        'Một đoạn rừng ngập mặn ven biển Sóc Trăng bị phá để làm đầm tôm, sau 5 năm đầm bị bỏ hoang do dịch bệnh. Nền đáy đầm vẫn là bùn mặn, còn một dải rừng đước tự nhiên cách đó khoảng 300 m. Hãy đề xuất phương án phục hồi và giải thích căn cứ sinh thái của từng bước.',
      steps: [
        'Bước 1 — Loại bỏ tác nhân gây suy thoái trước đã: phá bờ đầm, khơi lại kênh để thuỷ triều ra vào bình thường. Lí do: nếu nước không lên xuống được thì độ mặn và độ yếm khí của bùn sẽ lệch khỏi ngưỡng sống của đước, có trồng cũng chết.',
        'Bước 2 — Đánh giá khả năng tái sinh tự nhiên: dải rừng đước cách 300 m là nguồn giống, mà trụ mầm cây đước lại phát tán theo nước triều. Vậy trước hết ưu tiên phục hồi THỤ ĐỘNG (khoanh nuôi), vì rẻ hơn nhiều và cây con tự mọc sẽ có kiểu gen thích nghi sẵn với chính vùng này.',
        'Bước 3 — Chỉ trồng bổ sung ở chỗ sau 1–2 mùa vẫn không có cây con tái sinh, và chỉ dùng giống đước bản địa lấy từ dải rừng lân cận. Lí do: giữ vốn gene địa phương, tránh nhập giống ngoại lai làm nhiễu nguồn gene và có thể mang mầm bệnh.',
        'Bước 4 — KHÔNG cần thả cua, cá, chim. Lí do: chúng là loài phụ thuộc nơi ở; khi rừng đước tái lập được bãi bùn và tán che, chúng sẽ phát tán tới từ vùng lân cận. Đầu tư đúng vào loài nền tảng mới là cách rẻ và bền.',
        'Bước 5 — Giám sát và kiểm soát loài ngoại lai xâm lấn trong vài năm đầu, vì hệ mới mở là lúc dễ bị chiếm chỗ nhất.',
      ],
      answer:
        'Khôi phục chế độ thuỷ triều → ưu tiên khoanh nuôi tái sinh tự nhiên nhờ nguồn giống đước cách 300 m → chỉ trồng bổ sung bằng giống bản địa ở chỗ không tự tái sinh → để động vật tự quay về → giám sát loài ngoại lai.',
    },
    checkQuestions: [
      {
        prompt:
          'Vì sao bảo tồn nguyên vị (in situ) được coi là hình thức bảo tồn ưu tiên so với bảo tồn chuyển vị (ex situ)?',
        choices: [
          {
            id: 'bt_1',
            label:
              'Vì giữ được cả quần thể lẫn quan hệ sinh thái và áp lực chọn lọc tự nhiên, nên loài tiếp tục tiến hoá thích nghi',
          },
          { id: 'bt_2', label: 'Vì bảo tồn nguyên vị luôn tốn ít tiền hơn trong mọi trường hợp' },
          {
            id: 'bt_3',
            label: 'Vì bảo tồn chuyển vị làm thay đổi vật chất di truyền của loài được nuôi',
          },
          { id: 'bt_4', label: 'Vì chỉ bảo tồn nguyên vị mới cứu được loài đã tuyệt chủng' },
        ],
        answer: { kind: 'choice', correctIds: ['bt_1'] },
        explain:
          'Bảo tồn nguyên vị giữ loài trong chính môi trường sống của nó, nên giữ được luôn mạng lưới quan hệ và áp lực chọn lọc — quần thể vẫn thích nghi tiếp. Bảo tồn chuyển vị không hề làm biến đổi vật chất di truyền theo kiểu đột biến, nhưng quần thể nuôi nhốt nhỏ nên dễ giao phối gần và mất dần đặc điểm hoang dã. Chi phí thì tuỳ trường hợp, và không hình thức nào phục hồi được loài đã tuyệt chủng hoàn toàn.',
      },
      {
        prompt:
          'Một khu rừng bị chặt trắng được trồng lại toàn bộ bằng keo lai — một loài cây nhập nội mọc nhanh — và sau 8 năm đã phủ xanh kín đồi. Nhận định nào sau đây ĐÚNG?',
        choices: [
          {
            id: 'ph_1',
            label: 'Đồi đã phủ xanh nghĩa là hệ sinh thái rừng ban đầu đã được phục hồi hoàn toàn',
          },
          {
            id: 'ph_2',
            label:
              'Đây chưa phải phục hồi hệ sinh thái mà là trồng rừng sản xuất: độ che phủ tăng nhưng thành phần loài, cấu trúc tầng và mạng lưới dinh dưỡng vẫn rất nghèo so với rừng gốc',
          },
          {
            id: 'ph_3',
            label: 'Vì keo lai mọc nhanh nên đa dạng sinh học của đồi chắc chắn cao hơn rừng gốc',
          },
          { id: 'ph_4', label: 'Trồng cây ngoại lai luôn làm đất tốt lên nhanh hơn cây bản địa' },
        ],
        answer: { kind: 'choice', correctIds: ['ph_2'] },
        explain:
          'Đây là bẫy "xanh là đã phục hồi". Mục tiêu của sinh thái học phục hồi là khôi phục CẤU TRÚC và CHỨC NĂNG gần với hệ gốc, chứ không phải đạt độ che phủ. Rừng keo lai thuần loài chỉ có một tầng cây, ít loài cây bụi và thảm mục, mạng lưới thức ăn ngắn, nên đa dạng sinh học thấp hơn hẳn rừng tự nhiên nhiều tầng. Che phủ là một chỉ số, không phải bằng chứng phục hồi.',
      },
      {
        prompt:
          'Vì sao trong phục hồi hệ sinh thái, bước loại bỏ tác nhân gây suy thoái ban đầu phải làm TRƯỚC bước trồng lại cây?',
        choices: [
          { id: 'tt_1', label: 'Vì cây con không thể nảy mầm khi đất còn ẩm' },
          {
            id: 'tt_2',
            label:
              'Vì nếu tác nhân gây suy thoái vẫn còn, điều kiện môi trường vẫn nằm ngoài giới hạn sinh thái của loài trồng, cây sẽ tiếp tục chết và công sức trồng thành vô ích',
          },
          { id: 'tt_3', label: 'Vì luật bảo tồn quy định thứ tự các bước như vậy' },
          { id: 'tt_4', label: 'Vì trồng cây trước sẽ làm loài ngoại lai biến mất' },
        ],
        answer: { kind: 'choice', correctIds: ['tt_2'] },
        explain:
          'Phục hồi chỉ thành công khi các nhân tố sinh thái được kéo về trong giới hạn chịu đựng của loài mục tiêu. Còn nguyên nguyên nhân (nước không lên xuống được, nguồn thải, nạn chặt phá) thì cây trồng lại vẫn chết, tiền mất mà hệ không đổi.',
      },
    ],
    srsCards: [
      {
        hoi: 'Sinh thái học phục hồi nhằm khôi phục điều gì của hệ sinh thái?',
        dap: 'Khôi phục CẤU TRÚC (thành phần loài, tầng tán) và CHỨC NĂNG (dòng năng lượng, chu trình vật chất) gần với trạng thái tự nhiên ban đầu — không phải chỉ đạt độ che phủ.',
      },
      {
        hoi: 'Phân biệt bảo tồn nguyên vị và bảo tồn chuyển vị?',
        dap: 'Nguyên vị (in situ): giữ loài trong môi trường sống tự nhiên — vườn quốc gia, khu bảo tồn; giữ được cả quan hệ sinh thái và chọn lọc tự nhiên nên được ưu tiên. Chuyển vị (ex situ): đưa ra ngoài — vườn thú, ngân hàng gene; chỉ là giải pháp bổ trợ.',
      },
      {
        hoi: 'Ba điều kiện để một hệ sinh thái phục hồi được?',
        dap: '(1) Còn nguồn giống hoặc quần thể lân cận phát tán tới; (2) nền đất/nước chưa biến đổi vượt ngưỡng không đảo ngược; (3) đã loại bỏ được tác nhân gây suy thoái ban đầu.',
      },
    ],
    animation: {
      title: 'Phục hồi rừng ngập mặn: khôi phục loài nền tảng rồi để hệ tự đầy lại',
      description:
        'Ba khung nối tiếp nhau trên cùng một bãi ven biển. Khung một là đầm tôm bỏ hoang: bờ đầm chắn ngang làm nước triều không ra vào, nền bùn trơ, hầu như không có sinh vật. Khung hai là sau khi phá bờ đầm và khơi kênh: thuỷ triều ra vào trở lại, độ mặn và độ yếm khí của bùn quay về ngưỡng sống của cây đước, trụ mầm đước từ dải rừng lân cận theo nước triều trôi tới và bén rễ. Khung ba là sau vài năm: rừng đước khép tán, hệ rễ chống chằng chịt giữ bùn và chắn sóng, lúc này cua, cá con, chim nước tự tìm về vì đã có nơi trú và nguồn thức ăn. Thông điệp của hình: người ta không thả cua hay chim, mà chỉ khôi phục điều kiện sống và loài cây nền tảng; mạng lưới sinh vật phụ thuộc sẽ tự lấp đầy theo con đường phát tán tự nhiên.',
      viewBoxWidth: 460,
      viewBoxHeight: 220,
      durationMs: 10000,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'lb-tieude',
          x: 230,
          y: 22,
          text: 'Khôi phục ĐIỀU KIỆN SỐNG trước, loài phụ thuộc theo sau',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'line',
          id: 'day',
          x1: 10,
          y1: 160,
          x2: 450,
          y2: 160,
          stroke: 'muted',
          strokeWidth: 3,
        },
        { kind: 'rect', id: 'bun', x: 20, y: 150, w: 96, h: 10, rx: 3, fill: 'muted' },
        {
          kind: 'rect',
          id: 'bo',
          x: 124,
          y: 110,
          w: 12,
          h: 50,
          rx: 3,
          fill: 'danger',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 2500, opacity: 1 },
            { atMs: 3500, opacity: 0 },
            { atMs: 10000, opacity: 0 },
          ],
        },
        {
          kind: 'arrow',
          id: 'trieu',
          x1: 170,
          y1: 132,
          x2: 290,
          y2: 132,
          stroke: 'primary',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3500, opacity: 0 },
            { atMs: 4000, opacity: 1 },
            { atMs: 10000, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'trieu2',
          x1: 290,
          y1: 142,
          x2: 170,
          y2: 142,
          stroke: 'primary',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3500, opacity: 0 },
            { atMs: 4000, opacity: 1 },
            { atMs: 10000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-trieu',
          x: 230,
          y: 112,
          text: 'triều ra vào + trụ mầm đước trôi tới',
          size: 10,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3500, opacity: 0 },
            { atMs: 4000, opacity: 1 },
            { atMs: 10000, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'mam1',
          x: 200,
          y: 146,
          w: 6,
          h: 14,
          rx: 3,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5000, opacity: 0 },
            { atMs: 5400, opacity: 1 },
            { atMs: 10000, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'mam2',
          x: 226,
          y: 144,
          w: 6,
          h: 16,
          rx: 3,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5200, opacity: 0 },
            { atMs: 5600, opacity: 1 },
            { atMs: 10000, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'mam3',
          x: 252,
          y: 147,
          w: 6,
          h: 13,
          rx: 3,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5400, opacity: 0 },
            { atMs: 5800, opacity: 1 },
            { atMs: 10000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'than',
          x1: 366,
          y1: 118,
          x2: 366,
          y2: 146,
          stroke: 'muted',
          strokeWidth: 4,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 6000, opacity: 0 },
            { atMs: 7600, opacity: 1 },
            { atMs: 10000, opacity: 1 },
          ],
        },
        {
          kind: 'polyline',
          id: 're-chong',
          points: [
            [344, 160],
            [354, 146],
            [366, 140],
            [378, 146],
            [388, 160],
          ],
          stroke: 'muted',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 6000, opacity: 0 },
            { atMs: 7600, opacity: 1 },
            { atMs: 10000, opacity: 1 },
          ],
        },
        {
          kind: 'polyline',
          id: 're-chong2',
          points: [
            [354, 160],
            [366, 146],
            [378, 160],
          ],
          stroke: 'muted',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 6000, opacity: 0 },
            { atMs: 7600, opacity: 1 },
            { atMs: 10000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'tan-a',
          cx: 350,
          cy: 100,
          r: 26,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 6000, opacity: 0 },
            { atMs: 7500, opacity: 0.85 },
            { atMs: 10000, opacity: 0.85 },
          ],
        },
        {
          kind: 'circle',
          id: 'tan-b',
          cx: 386,
          cy: 94,
          r: 28,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 6000, opacity: 0 },
            { atMs: 7800, opacity: 0.85 },
            { atMs: 10000, opacity: 0.85 },
          ],
        },
        {
          kind: 'circle',
          id: 'cua',
          cx: 330,
          cy: 154,
          r: 6,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 8000, opacity: 0 },
            { atMs: 9000, opacity: 1 },
            { atMs: 10000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'ca',
          cx: 418,
          cy: 152,
          r: 5,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 8000, opacity: 0 },
            { atMs: 9300, opacity: 1 },
            { atMs: 10000, opacity: 1 },
          ],
        },
        {
          kind: 'polyline',
          id: 'chim',
          points: [
            [410, 52],
            [418, 58],
            [426, 52],
          ],
          stroke: 'neutral',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 8200, opacity: 0 },
            { atMs: 9300, opacity: 1 },
            { atMs: 10000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'k1',
          x: 76,
          y: 182,
          text: '1. Đầm bỏ hoang,',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'k1b',
          x: 76,
          y: 196,
          text: 'bờ chắn triều',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'k2',
          x: 230,
          y: 182,
          text: '2. Phá bờ,',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'k2b',
          x: 230,
          y: 196,
          text: 'triều ra vào lại',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'k3',
          x: 380,
          y: 182,
          text: '3. Rừng khép tán,',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'k3b',
          x: 380,
          y: 196,
          text: 'loài tự về',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb-tuve',
          x: 366,
          y: 214,
          text: 'cua, cá, chim tự về, không ai thả',
          size: 10,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 8000, opacity: 0 },
            { atMs: 8600, opacity: 1 },
            { atMs: 10000, opacity: 1 },
          ],
        },
      ],
      captions: [
        { atMs: 0, text: 'Bờ đầm chắn triều: nền bùn nằm ngoài giới hạn sinh thái của đước.' },
        { atMs: 3500, text: 'Phá bờ, khơi kênh — loại bỏ tác nhân gây suy thoái trước đã.' },
        { atMs: 5500, text: 'Trụ mầm đước từ rừng lân cận theo triều trôi tới và bén rễ.' },
        {
          atMs: 8000,
          text: 'Rừng khép tán tạo nơi ở; cua, cá, chim tự quay về theo phát tán tự nhiên.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh12-c11-b32',
    grade: '12',
    chapterNumber: 11,
    chapterTitle: 'Sinh thái học phục hồi, bảo tồn và phát triển bền vững',
    lessonNumber: 32,
    title: 'Phát triển bền vững và dấu chân sinh thái',
    hook: 'Đồng bằng sông Cửu Long từng được xem là vựa lúa vô tận. Nhưng khi tăng lên ba vụ lúa một năm nhờ đê bao khép kín, phù sa không còn vào ruộng, đất bạc màu dần, phải bón thêm phân, chi phí tăng mà lợi nhuận không tăng tương ứng. Sản lượng năm nay tăng, còn khả năng sản xuất của mười năm sau thì giảm — đó chính là câu hỏi trung tâm của phát triển bền vững.',
    theory:
      '## Phát triển bền vững\n' +
      '— Định nghĩa (Uỷ ban Brundtland, 1987): phát triển đáp ứng nhu cầu của thế hệ hiện tại mà KHÔNG làm tổn hại đến khả năng đáp ứng nhu cầu của các thế hệ tương lai.\n' +
      '— Ba trụ cột phải cân bằng đồng thời: KINH TẾ (hiệu quả, sinh kế), XÃ HỘI (công bằng, sức khoẻ, văn hoá) và MÔI TRƯỜNG (giữ được vốn tự nhiên). Thiếu bất kì trụ nào thì không gọi là bền vững: tăng trưởng mà huỷ môi trường chỉ là vay nợ tương lai; giữ môi trường mà dân không có sinh kế thì áp lực khai thác sẽ quay lại ngay.\n\n' +
      '## Cơ sở sinh thái học của tính bền vững\n' +
      '— Mỗi hệ sinh thái có SỨC CHỨA (khả năng cung cấp tài nguyên và hấp thụ chất thải) hữu hạn. Khai thác dưới mức tái tạo thì nguồn lợi tự bù lại; vượt mức tái tạo thì quần thể bị khai thác suy giảm và có thể không hồi phục.\n' +
      '— Ví dụ then chốt — khai thác cá: nếu chỉ đánh bắt cá lớn đã sinh sản ít nhất một lần, quần thể vẫn tự bù. Nhưng dùng lưới mắt nhỏ hoặc xung điện bắt cả cá con thì đàn bố mẹ tương lai bị lấy đi, sản lượng vài vụ đầu có thể cao rồi sụp hẳn — sản lượng cao NHẤT THỜI không phải bằng chứng của khai thác bền vững.\n' +
      '— DẤU CHÂN SINH THÁI (ecological footprint): diện tích đất và mặt nước có năng suất sinh học cần thiết để cung cấp tài nguyên và hấp thụ chất thải cho một người/một quốc gia. So sánh dấu chân sinh thái với năng lực sinh học sẵn có cho biết đang sống trong hay vượt "ngân sách" sinh thái.\n\n' +
      '## Các hướng hành động\n' +
      '1. Sử dụng tài nguyên tái tạo trong ngưỡng tái tạo (khai thác gỗ theo luân kì, đánh bắt theo hạn ngạch và mùa vụ, cấm lưới mắt nhỏ).\n' +
      '2. Giảm phát thải và chuyển sang năng lượng tái tạo, hạn chế nhiên liệu hoá thạch để giảm nóng lên toàn cầu — vấn đề đặc biệt sát sườn với Việt Nam vì nước biển dâng đe doạ trực tiếp Đồng bằng sông Cửu Long.\n' +
      '3. Kinh tế tuần hoàn: tái chế, tái sử dụng, giảm rác thải nhựa, biến phụ phẩm nông nghiệp (rơm rạ, trấu, vỏ cà phê) thành nguyên liệu thay vì đốt bỏ.\n' +
      '4. Nông nghiệp sinh thái: luân canh, xen canh, quản lí dịch hại tổng hợp (IPM), mô hình lúa – tôm, lúa – cá ở Đồng bằng sông Cửu Long; xả lũ vào ruộng theo chu kì để lấy lại phù sa.\n' +
      '5. Giáo dục môi trường và chính sách: Luật Bảo vệ môi trường, đánh giá tác động môi trường bắt buộc với dự án lớn, các mục tiêu phát triển bền vững (SDGs) của Liên hợp quốc.\n\n' +
      'GIỚI HẠN CẦN NÓI RÕ: bền vững không có nghĩa là ngừng khai thác hay "không đụng vào thiên nhiên". Nó là khai thác trong ngưỡng tái tạo và phân bổ lợi ích công bằng. Đồng thời, không có phương án nào tối ưu cho cả ba trụ cột cùng lúc; lựa chọn bền vững luôn là một sự đánh đổi được cân nhắc dựa trên số liệu, chứ không phải khẩu hiệu.',
    workedExample: {
      problem:
        'Một hồ tự nhiên có quần thể cá mè được khai thác. Ước tính mỗi năm quần thể tăng thêm khoảng 12 tấn nhờ sinh sản và sinh trưởng. Năm nay hợp tác xã đánh bắt 18 tấn và báo cáo "sản lượng cao kỉ lục, tăng 50% so với năm ngoái". Hãy đánh giá tính bền vững của hoạt động này và đề xuất mức khai thác hợp lí.',
      steps: [
        'So sánh lượng khai thác với lượng tái tạo: khai thác 18 tấn/năm trong khi quần thể chỉ bù lại được 12 tấn/năm. Mỗi năm hụt 18 − 12 = 6 tấn.',
        'Suy ra xu hướng: phần hụt này lấy trực tiếp vào sinh khối đàn cá bố mẹ, nên quần thể giảm dần. Quần thể càng nhỏ thì lượng tái tạo hằng năm cũng càng nhỏ đi, nghĩa là mức hụt sẽ ngày càng nặng — đây là vòng xoáy suy giảm.',
        'Giải thích vì sao sản lượng năm nay vẫn cao: đánh bắt mạnh hơn thì bắt được nhiều hơn trong ngắn hạn vì đang ăn vào "vốn" chứ không chỉ ăn "lãi". Sản lượng một năm KHÔNG phải chỉ số đánh giá tính bền vững.',
        'Đề xuất mức khai thác: giữ khai thác không vượt quá lượng tái tạo, tức tối đa khoảng 12 tấn/năm; nếu quần thể đã bị hụt nhiều năm thì cần hạ xuống dưới 12 tấn một thời gian để đàn phục hồi.',
        'Bổ sung biện pháp cấu trúc chứ không chỉ giảm khối lượng: quy định kích thước mắt lưới tối thiểu để cá chưa sinh sản lọt ra, cấm đánh bắt trong mùa sinh sản, cấm xung điện. Lí do: giữ được đàn bố mẹ mới giữ được lượng tái tạo cho các năm sau.',
      ],
      answer:
        'Không bền vững: khai thác 18 tấn/năm vượt lượng tái tạo 12 tấn/năm nên mỗi năm hụt 6 tấn vào vốn quần thể. Nên hạ xuống tối đa 12 tấn/năm (tạm thời thấp hơn để phục hồi), kèm quy định mắt lưới, mùa vụ và cấm xung điện.',
    },
    checkQuestions: [
      {
        prompt:
          'Quần thể cá trong một hồ mỗi năm tái tạo được 12 tấn. Nếu muốn khai thác bền vững lâu dài, sản lượng đánh bắt tối đa mỗi năm nên là bao nhiêu tấn?',
        // Không khai `unit` ở đây: engine `@dhcb/core-grading` quy đổi câu trả lời của học
        // sinh về đơn vị SI (tấn → kg) rồi mới so với `value`, nên nếu khai unit 'tấn' thì
        // `value` phải là 12000 — dễ gây hiểu nhầm. Đề đã ghi rõ "bao nhiêu tấn" nên chỉ
        // cần so con số là đủ và engine vẫn bỏ qua đơn vị thừa nếu học sinh có ghi.
        answer: { kind: 'numeric', value: 12 },
        explain:
          'Khai thác bền vững nghĩa là chỉ lấy phần quần thể tự bù lại được, tức tối đa bằng lượng tái tạo hằng năm: 12 tấn. Lấy nhiều hơn là ăn vào sinh khối đàn bố mẹ, làm lượng tái tạo các năm sau giảm theo.',
      },
      {
        prompt:
          'Một tỉnh ven biển báo cáo sản lượng hải sản năm nay tăng 40% nhờ tăng số tàu và dùng lưới mắt nhỏ. Kết luận nào sau đây ĐÚNG?',
        choices: [
          {
            id: 'sl_1',
            label: 'Sản lượng tăng chứng tỏ nguồn lợi hải sản của tỉnh đang dồi dào lên',
          },
          {
            id: 'sl_2',
            label:
              'Chưa thể kết luận nguồn lợi tăng: sản lượng tăng ở đây do tăng cường độ khai thác, mà lưới mắt nhỏ bắt cả cá chưa sinh sản nên đàn bố mẹ tương lai bị lấy đi, nguy cơ sụt giảm về sau',
          },
          { id: 'sl_3', label: 'Lưới mắt nhỏ không ảnh hưởng gì tới quần thể vì cá con rất nhiều' },
          {
            id: 'sl_4',
            label: 'Chỉ cần trồng thêm rừng ngập mặn là bù được, không cần đổi cách đánh bắt',
          },
        ],
        answer: { kind: 'choice', correctIds: ['sl_2'] },
        explain:
          'Đây là bẫy "sản lượng cao = bền vững". Sản lượng là kết quả của cả trữ lượng LẪN cường độ khai thác, nên tăng tàu và tăng cường độ vẫn cho sản lượng cao ngay cả khi trữ lượng đang cạn. Lưới mắt nhỏ bắt cá chưa kịp sinh sản sẽ cắt mất nguồn bổ sung, khiến quần thể sụt mạnh sau vài vụ.',
      },
      {
        prompt: 'Nhận định nào sau đây về phát triển bền vững là ĐÚNG?',
        choices: [
          {
            id: 'pt_1',
            label:
              'Phát triển bền vững là ngừng khai thác tài nguyên thiên nhiên để giữ nguyên môi trường',
          },
          {
            id: 'pt_2',
            label:
              'Phát triển bền vững phải cân bằng đồng thời ba trụ cột kinh tế – xã hội – môi trường, khai thác trong ngưỡng tái tạo chứ không phải ngừng khai thác',
          },
          {
            id: 'pt_3',
            label: 'Chỉ cần tăng trưởng kinh tế đủ nhanh thì các vấn đề môi trường sẽ tự hết',
          },
          {
            id: 'pt_4',
            label: 'Bền vững chỉ liên quan tới môi trường, không liên quan tới xã hội',
          },
        ],
        answer: { kind: 'choice', correctIds: ['pt_2'] },
        explain:
          'Bền vững không phải là "không đụng vào thiên nhiên" — con người vẫn phải sống và sản xuất. Nó là khai thác không vượt ngưỡng tái tạo, đồng thời giữ cân bằng cả ba trụ cột; bỏ trụ xã hội thì người dân thiếu sinh kế sẽ quay lại gây áp lực lên tài nguyên.',
      },
    ],
    srsCards: [
      {
        hoi: 'Định nghĩa phát triển bền vững?',
        dap: 'Phát triển đáp ứng nhu cầu của thế hệ hiện tại mà không làm tổn hại khả năng đáp ứng nhu cầu của các thế hệ tương lai, cân bằng ba trụ cột kinh tế – xã hội – môi trường.',
      },
      {
        hoi: 'Vì sao sản lượng khai thác cao trong một năm không chứng minh được là khai thác bền vững?',
        dap: 'Vì sản lượng phụ thuộc cả trữ lượng lẫn cường độ khai thác. Tăng cường độ vẫn cho sản lượng cao dù đang "ăn vào vốn" quần thể; bền vững đòi hỏi lượng khai thác ≤ lượng tái tạo hằng năm.',
      },
      {
        hoi: 'Dấu chân sinh thái là gì?',
        dap: 'Diện tích đất và mặt nước có năng suất sinh học cần thiết để cung cấp tài nguyên và hấp thụ chất thải cho một người hoặc một quốc gia; so với năng lực sinh học sẵn có để biết đang sống trong hay vượt ngân sách sinh thái.',
      },
    ],
    animation: {
      title: 'Khai thác trong ngưỡng tái tạo và khai thác quá mức',
      description:
        'Hình so sánh hai kịch bản khai thác cùng một hồ cá trên cùng một trục thời gian nhiều năm. Trục đứng là trữ lượng cá trong hồ, trục ngang là các năm. Quần thể mỗi năm tự tái tạo khoảng 12 tấn. Đường thứ nhất ứng với khai thác 12 tấn mỗi năm, đúng bằng lượng tái tạo: trữ lượng giữ gần như nằm ngang, nguồn lợi duy trì được lâu dài. Đường thứ hai ứng với khai thác 18 tấn mỗi năm: mỗi năm hụt 6 tấn lấy vào sinh khối đàn bố mẹ, nên trữ lượng đi xuống, và vì quần thể càng nhỏ thì lượng tái tạo hằng năm cũng càng nhỏ nên đường này dốc xuống ngày càng nhanh rồi sụp. Ở những năm đầu, cột sản lượng của kịch bản khai thác quá mức lại CAO hơn — minh hoạ đúng cái bẫy: sản lượng cao trong ngắn hạn không chứng minh nguồn lợi dồi dào, nó chỉ cho biết đang lấy cả phần vốn chứ không chỉ phần lãi.',
      viewBoxWidth: 440,
      viewBoxHeight: 240,
      durationMs: 9000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'ox',
          x1: 56,
          y1: 132,
          x2: 420,
          y2: 132,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'oy',
          x1: 56,
          y1: 30,
          x2: 56,
          y2: 132,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'lb-oy',
          x: 60,
          y: 24,
          text: 'Trữ lượng cá trong hồ',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb-ox',
          x: 420,
          y: 146,
          text: 'năm',
          size: 11,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'polyline',
          id: 'ben-vung',
          points: [
            [56, 50],
            [110, 52],
            [164, 51],
            [218, 53],
            [272, 52],
            [326, 54],
            [400, 53],
          ],
          stroke: 'correct',
          strokeWidth: 4,
          keyframes: [
            { atMs: 0, opacity: 0.2 },
            { atMs: 2500, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-bv',
          x: 410,
          y: 44,
          text: 'khai thác 12 tấn/năm = lượng tái tạo',
          size: 10,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'polyline',
          id: 'qua-muc',
          points: [
            [56, 50],
            [110, 56],
            [164, 66],
            [218, 82],
            [272, 102],
            [326, 122],
            [400, 128],
          ],
          stroke: 'danger',
          strokeWidth: 4,
          keyframes: [
            { atMs: 0, opacity: 0.2 },
            { atMs: 2500, opacity: 0.2 },
            { atMs: 5000, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-qm',
          x: 220,
          y: 118,
          text: '18 tấn/năm: hụt 6 tấn mỗi năm',
          size: 10,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb-sl',
          x: 60,
          y: 150,
          text: 'Sản lượng mỗi năm: 12 tấn (bền vững) và 18 tấn (quá mức)',
          size: 10,
          anchor: 'start',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5200, opacity: 0 },
            { atMs: 5600, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'bv0',
          x: 101,
          y: 176,
          w: 8,
          h: 24,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5400, opacity: 0 },
            { atMs: 5800, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'bv1',
          x: 155,
          y: 176,
          w: 8,
          h: 24,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5400, opacity: 0 },
            { atMs: 5800, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'bv2',
          x: 209,
          y: 176,
          w: 8,
          h: 24,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5400, opacity: 0 },
            { atMs: 5800, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'bv3',
          x: 263,
          y: 176,
          w: 8,
          h: 24,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5400, opacity: 0 },
            { atMs: 5800, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'bv4',
          x: 317,
          y: 176,
          w: 8,
          h: 24,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5400, opacity: 0 },
            { atMs: 5800, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'bv5',
          x: 371,
          y: 176,
          w: 8,
          h: 24,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5400, opacity: 0 },
            { atMs: 5800, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'qm0',
          x: 111,
          y: 164,
          w: 8,
          h: 36,
          fill: 'warn',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5600, opacity: 0 },
            { atMs: 6000, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'qm1',
          x: 165,
          y: 164,
          w: 8,
          h: 36,
          fill: 'warn',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5900, opacity: 0 },
            { atMs: 6300, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'qm2',
          x: 219,
          y: 164,
          w: 8,
          h: 36,
          fill: 'warn',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 6200, opacity: 0 },
            { atMs: 6600, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'qm3',
          x: 273,
          y: 170,
          w: 8,
          h: 30,
          fill: 'warn',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 6500, opacity: 0 },
            { atMs: 6900, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'qm4',
          x: 327,
          y: 182,
          w: 8,
          h: 18,
          fill: 'warn',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 6800, opacity: 0 },
            { atMs: 7200, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'qm5',
          x: 381,
          y: 192,
          w: 8,
          h: 8,
          fill: 'warn',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 7100, opacity: 0 },
            { atMs: 7500, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-san',
          x: 60,
          y: 214,
          text: 'Cột quá mức: vài năm đầu lấy nhiều hơn, rồi sụp',
          size: 10,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 7000, opacity: 0 },
            { atMs: 7400, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-bay',
          x: 220,
          y: 232,
          text: 'Sản lượng cao ngắn hạn ≠ nguồn lợi dồi dào: đang lấy cả phần vốn',
          size: 11,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 7600, opacity: 0 },
            { atMs: 8000, opacity: 1 },
            { atMs: 9000, opacity: 1 },
          ],
        },
      ],
      captions: [
        { atMs: 0, text: 'Quần thể cá mỗi năm tự tái tạo khoảng 12 tấn.' },
        { atMs: 2500, text: 'Lấy đúng 12 tấn/năm: trữ lượng đi ngang, khai thác được lâu dài.' },
        { atMs: 5000, text: 'Lấy 18 tấn/năm: mỗi năm hụt 6 tấn vào đàn bố mẹ, trữ lượng tụt dần.' },
        { atMs: 7000, text: 'Những năm đầu sản lượng lại cao hơn — đó chính là cái bẫy.' },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
]
