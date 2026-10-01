// lessons/sinh10c1.ts — Sinh học 10, Phần mở đầu & Chương 1 (Bài 1-6).
import type { BiologyLesson } from '../lessonTypes.js'

export const SINH10_C1_LESSONS: BiologyLesson[] = [
  {
    id: 'sinh10-c1-b1',
    grade: '10',
    chapterNumber: 1,
    chapterTitle: 'Phần mở đầu',
    lessonNumber: 1,
    title: 'Giới thiệu khái quát môn Sinh học',
    hook: 'Từ thức ăn chúng ta ăn hằng ngày, các loại thuốc chữa bệnh, cho đến việc hiểu chính cơ thể mình, Sinh học là môn khoa học về sự sống.',
    theory:
      '## Khái niệm và đối tượng của sinh học\n' +
      '— Sinh học (Biology) là môn khoa học nghiên cứu về sự sống, cụ thể là các sinh vật và mối quan hệ giữa chúng với nhau cũng như với môi trường.\n' +
      '— Đối tượng nghiên cứu: Các sinh vật sống (thực vật, động vật, nấm, vi sinh vật) và các cấp độ tổ chức sống từ phân tử đến sinh quyển.\n\n' +
      '## Các phân ngành và lĩnh vực nghiên cứu chính\n' +
      '— Thực vật học (Botany), Động vật học (Zoology), Vi sinh vật học (Microbiology), Di truyền học (Genetics), Sinh học tế bào (Cell Biology), Sinh học phân tử (Molecular Biology), Sinh thái học (Ecology).\n\n' +
      '## Vai trò của sinh học trong cuộc sống\n' +
      '— Y học: Sản xuất thuốc, vaccine, liệu pháp gene, chẩn đoán bệnh.\n' +
      '— Nông nghiệp: Tạo giống cây trồng, vật nuôi năng suất cao, kháng bệnh.\n' +
      '— Công nghệ thực phẩm: Lên men sữa chua, bia, rượu, bảo quản thực phẩm.\n' +
      '— Bảo vệ môi trường: Xử lí ô nhiễm sinh học (bioremediation), bảo tồn đa dạng sinh học.\n\n' +
      '## Phát triển bền vững và đạo đức sinh học\n' +
      '— Phát triển bền vững là sự phát triển nhằm thoả mãn nhu cầu của thế hệ hiện tại mà không làm tổn hại đến khả năng thoả mãn nhu cầu của các thế hệ tương lai. Sinh học đóng góp bằng cách bảo tồn tài nguyên, năng lượng sạch và đa dạng sinh học.\n' +
      '— Đạo đức sinh học (Bioethics) là những nguyên tắc, chuẩn mực đạo đức áp dụng trong các nghiên cứu và ứng dụng sinh học (ví dụ: nhân bản vô tính người, chỉnh sửa gene phôi thai).',
    workedExample: {
      problem:
        'Trình bày vai trò của Sinh học trong việc bảo vệ môi trường và phát triển bền vững.',
      steps: [
        'Nhận diện các thách thức môi trường hiện nay: ô nhiễm nước, đất, rác thải nhựa, biến đổi khí hậu.',
        'Trình bày giải pháp sinh học: Sử dụng vi sinh vật phân huỷ chất độc hại, ứng dụng thực vật hấp thụ kim loại nặng trong đất.',
        'Liên hệ với phát triển bền vững: Bảo tồn các hệ sinh thái rừng, biển giúp duy trì sự cân bằng carbon, bảo vệ đa dạng sinh học cho thế hệ tương lai.',
      ],
      answer:
        'Sinh học cung cấp giải pháp xử lí ô nhiễm bằng tác nhân sinh học, bảo tồn đa dạng sinh học và tài nguyên thiên nhiên.',
    },
    checkQuestions: [
      {
        prompt:
          'Phân ngành nào của Sinh học nghiên cứu về mối quan hệ giữa sinh vật với môi trường sống của chúng?',
        choices: [
          { id: 'da_1', label: 'Sinh thái học' },
          { id: 'da_2', label: 'Di truyền học' },
          { id: 'da_3', label: 'Vi sinh vật học' },
          { id: 'da_4', label: 'Sinh học tế bào' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['da_1'],
        },
        explain:
          'Sinh thái học (Ecology) nghiên cứu về mối quan hệ giữa các sinh vật với nhau và với môi trường sống.',
      },
      {
        prompt:
          'Sự phát triển đáp ứng nhu cầu của thế hệ hiện tại mà không làm tổn hại đến khả năng đáp ứng nhu cầu của các thế hệ tương lai được gọi là:',
        choices: [
          { id: 'bn_1', label: 'Phát triển bền vững' },
          { id: 'bn_2', label: 'Tăng trưởng kinh tế nóng' },
          { id: 'bn_3', label: 'Công nghiệp hoá hiện đại hoá' },
          { id: 'bn_4', label: 'Đô thị hoá tự phát' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['bn_1'],
        },
        explain:
          'Đây đúng là định nghĩa chuẩn về phát triển bền vững (Sustainable Development): vừa đáp ứng nhu cầu hôm nay, vừa giữ lại tài nguyên cho mai sau. Ba phương án còn lại đều chỉ nói tới tăng trưởng trước mắt và thường phải đánh đổi bằng tài nguyên, môi trường của thế hệ sau.',
      },
    ],
    srsCards: [
      {
        hoi: 'Đối tượng nghiên cứu của Sinh học là gì?',
        dap: 'Các sinh vật sống và các cấp độ tổ chức của thế giới sống.',
      },
      {
        hoi: 'Đạo đức sinh học (Bioethics) là gì?',
        dap: 'Là những nguyên tắc, chuẩn mực đạo đức áp dụng trong các nghiên cứu và ứng dụng sinh học.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh10-c1-b2',
    grade: '10',
    chapterNumber: 1,
    chapterTitle: 'Phần mở đầu',
    lessonNumber: 2,
    title: 'Phương pháp nghiên cứu và học tập môn Sinh học',
    hook:
      'Làm thế nào các nhà khoa học tìm ra vaccine phòng ngừa dịch bệnh hay giải mã được bộ gene người? ' +
      'Họ đều sử dụng một quy trình nghiên cứu khoa học nghiêm ngặt.',
    theory:
      '## Các phương pháp nghiên cứu và học tập sinh học\n' +
      '1. Phương pháp quan sát: Sử dụng các giác quan hoặc dụng cụ hỗ trợ (kính hiển vi, kính lúp) để thu thập thông tin về hình thái, hành vi sinh vật.\n' +
      '2. Phương pháp làm việc phòng thí nghiệm: Thực hiện các phản ứng hoá sinh, nuôi cấy vi sinh vật, quan sát lát cắt tế bào trong môi trường kiểm soát.\n' +
      '3. Phương pháp thực nghiệm khoa học: Thiết kế và tiến hành thí nghiệm so sánh giữa lô đối chứng (control) và lô thí nghiệm để kiểm chứng giả thuyết.\n\n' +
      '## Tiến trình nghiên cứu khoa học (scientific method)\n' +
      '— Bước 1: Quan sát và đặt câu hỏi nghiên cứu.\n' +
      '— Bước 2: Xây dựng giả thuyết khoa học (một lời giải thích có thể kiểm chứng).\n' +
      '— Bước 3: Thiết kế và tiến hành thí nghiệm để kiểm chứng.\n' +
      '— Bước 4: Thu thập số liệu, phân tích kết quả và thảo luận.\n' +
      '— Bước 5: Báo cáo kết quả nghiên cứu và rút ra kết luận.\n\n' +
      '## Các thiết bị và an toàn trong phòng thí nghiệm\n' +
      '— Kính hiển vi quang học, máy li tâm, micropipette, tủ cấy vô trùng.\n' +
      '— Quy tắc an toàn: Mặc áo bảo hộ (lab coat), đeo găng tay và kính bảo hộ; không ăn uống trong phòng thí nghiệm; tuân thủ quy trình xử lí hoá chất và sinh phẩm thải bỏ.',
    workedExample: {
      problem:
        'Nêu các bước trong tiến trình nghiên cứu ảnh hưởng của ánh sáng đến sự nảy mầm của hạt đậu.',
      steps: [
        'Bước 1: Quan sát thấy hạt đậu ở chỗ sáng nảy mầm khác chỗ tối. Đặt câu hỏi: Ánh sáng có ảnh hưởng đến tỉ lệ nảy mầm không?',
        'Bước 2: Đưa ra giả thuyết phát biểu rõ ràng để kiểm chứng được, ví dụ: ánh sáng làm tăng tỉ lệ nảy mầm của hạt đậu.',
        'Bước 3: Thiết kế thí nghiệm: Chia hạt đậu làm 2 lô (Lô thí nghiệm: đặt ngoài sáng; Lô đối chứng: đặt trong bóng tối). Giữ nguyên các yếu tố khác như nước, nhiệt độ.',
        'Bước 4: Theo dõi sau 3 ngày, đếm số hạt nảy mầm ở cả hai lô và tính tỉ lệ phần trăm.',
        'Bước 5: Rút ra kết luận và viết báo cáo.',
      ],
      answer:
        'Tiến trình gồm: Đặt câu hỏi -> Giả thuyết -> Thí nghiệm kiểm chứng -> Phân tích kết quả -> Kết luận.',
    },
    checkQuestions: [
      {
        prompt: 'Giả thuyết khoa học được định nghĩa là:',
        choices: [
          {
            id: 'gt_1',
            label: 'Một câu trả lời giả định, có thể kiểm chứng được bằng thực nghiệm',
          },
          { id: 'gt_2', label: 'Một sự thật hiển nhiên không cần chứng minh' },
          { id: 'gt_3', label: 'Một kết luận chắc chắn sau khi hoàn thành thí nghiệm' },
          { id: 'gt_4', label: 'Một phương pháp quan sát sinh vật trong tự nhiên' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['gt_1'],
        },
        explain:
          'Giả thuyết khoa học phải là một câu trả lời giả định có khả năng kiểm chứng bằng thực nghiệm hoặc quan sát bổ sung.',
      },
      {
        prompt:
          'Để loại bỏ yếu tố ngẫu nhiên và khẳng định sự khác biệt là do nhân tố thí nghiệm tác động, các thí nghiệm sinh học luôn cần có:',
        choices: [
          { id: 'dc_1', label: 'Lô đối chứng (Control)' },
          { id: 'dc_2', label: 'Nhiều loại hoá chất khác nhau' },
          { id: 'dc_3', label: 'Kính hiển vi điện tử độ phân giải cao' },
          { id: 'dc_4', label: 'Sự giám sát của nhiều nhà khoa học' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['dc_1'],
        },
        explain:
          'Lô đối chứng (control group) giúp so sánh và khẳng định kết quả thí nghiệm thực sự do biến độc lập gây ra.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phương pháp thực nghiệm khoa học có điểm gì khác phương pháp quan sát thông thường?',
        dap: 'Thực nghiệm chủ động tác động và kiểm soát các biến số (có lô thí nghiệm và lô đối chứng), còn quan sát chỉ ghi nhận hiện tượng tự nhiên.',
      },
      {
        hoi: 'Bước đầu tiên trong tiến trình nghiên cứu khoa học là gì?',
        dap: 'Quan sát và đặt câu hỏi nghiên cứu.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh10-c1-b3',
    animation: {
      title: 'Các cấp độ tổ chức sống lồng vào nhau',
      description:
        'Sáu ô sáng lên lần lượt theo đúng thứ tự lồng nhau của thế giới sống. Phân tử (protein, DNA) tự nó chưa sống; ghép lại thành bào quan, nhiều bào quan hợp thành TẾ BÀO — cấp độ tổ chức sống CƠ BẢN nhất, vì từ đây trở lên mới có đủ dấu hiệu của sự sống. Tế bào cùng loại họp thành mô, các mô họp thành cơ quan rồi cơ thể; nhiều cơ thể cùng loài sống chung một vùng thành quần thể, nhiều quần thể thành quần xã, quần xã cùng môi trường vô sinh thành hệ sinh thái, tất cả hệ sinh thái trên Trái Đất là sinh quyển. Điểm mà một câu văn khó truyền: mỗi cấp trên KHÔNG chỉ là phép cộng của cấp dưới mà xuất hiện đặc tính mới, ví dụ tế bào biết trao đổi chất còn phân tử thì không.',
      viewBoxWidth: 538,
      viewBoxHeight: 234,
      durationMs: 7800,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'tieu-de',
          x: 269,
          y: 24,
          text: 'Từ phân tử đến sinh quyển',
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
            { atMs: 7800, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n0',
          x: 91,
          y: 66,
          text: 'Phân tử',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 200, opacity: 0 },
            { atMs: 500, opacity: 1 },
            { atMs: 7800, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p0',
          x: 91,
          y: 84,
          text: 'DNA, protein',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 200, opacity: 0 },
            { atMs: 500, opacity: 1 },
            { atMs: 7800, opacity: 1 },
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
            { atMs: 7800, opacity: 1 },
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
            { atMs: 7800, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n1',
          x: 269,
          y: 66,
          text: 'Bào quan',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1300, opacity: 0 },
            { atMs: 1600, opacity: 1 },
            { atMs: 7800, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p1',
          x: 269,
          y: 84,
          text: 'ti thể, ribosome',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1300, opacity: 0 },
            { atMs: 1600, opacity: 1 },
            { atMs: 7800, opacity: 1 },
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
            { atMs: 7800, opacity: 1 },
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
            { atMs: 7800, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n2',
          x: 447,
          y: 66,
          text: 'TẾ BÀO',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2700, opacity: 1 },
            { atMs: 7800, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p2',
          x: 447,
          y: 84,
          text: 'cấp cơ bản',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2700, opacity: 1 },
            { atMs: 7800, opacity: 1 },
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
            { atMs: 7800, opacity: 1 },
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
            { atMs: 7800, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n3',
          x: 91,
          y: 182,
          text: 'Mô → cơ quan',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3500, opacity: 0 },
            { atMs: 3800, opacity: 1 },
            { atMs: 7800, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p3',
          x: 91,
          y: 200,
          text: 'rồi cơ thể',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3500, opacity: 0 },
            { atMs: 3800, opacity: 1 },
            { atMs: 7800, opacity: 1 },
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
            { atMs: 7800, opacity: 1 },
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
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4600, opacity: 0 },
            { atMs: 4900, opacity: 1 },
            { atMs: 7800, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n4',
          x: 269,
          y: 182,
          text: 'Quần thể',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4600, opacity: 0 },
            { atMs: 4900, opacity: 1 },
            { atMs: 7800, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p4',
          x: 269,
          y: 200,
          text: 'rồi quần xã',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4600, opacity: 0 },
            { atMs: 4900, opacity: 1 },
            { atMs: 7800, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt4',
          x1: 344,
          y1: 186,
          x2: 367,
          y2: 186,
          stroke: 'accent',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5250, opacity: 0 },
            { atMs: 5550, opacity: 1 },
            { atMs: 7800, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'o5',
          x: 372,
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
            { atMs: 5700, opacity: 0 },
            { atMs: 6000, opacity: 1 },
            { atMs: 7800, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'n5',
          x: 447,
          y: 182,
          text: 'Hệ sinh thái',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5700, opacity: 0 },
            { atMs: 6000, opacity: 1 },
            { atMs: 7800, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'p5',
          x: 447,
          y: 200,
          text: 'đến sinh quyển',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5700, opacity: 0 },
            { atMs: 6000, opacity: 1 },
            { atMs: 7800, opacity: 1 },
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
            { atMs: 5750, dx: 178, dy: 116, opacity: 1 },
            { atMs: 6000, dx: 356, dy: 116, opacity: 1 },
            { atMs: 7800, dx: 356, dy: 116, opacity: 1 },
          ],
        },
      ],
      captions: [
        { atMs: 500, text: 'Phân tử sinh học: chưa có dấu hiệu sống.' },
        { atMs: 1600, text: 'Nhiều phân tử hợp thành bào quan có chức năng riêng.' },
        { atMs: 2700, text: 'Tế bào — cấp độ tổ chức sống cơ bản nhất, có đủ dấu hiệu sống.' },
        { atMs: 3800, text: 'Tế bào cùng loại thành mô, mô thành cơ quan, rồi thành cơ thể.' },
        { atMs: 4900, text: 'Các cơ thể cùng loài thành quần thể; nhiều quần thể thành quần xã.' },
        {
          atMs: 6000,
          text: 'Quần xã cộng môi trường vô sinh thành hệ sinh thái; tất cả là sinh quyển.',
        },
      ],
    },
    grade: '10',
    chapterNumber: 1,
    chapterTitle: 'Phần mở đầu',
    lessonNumber: 3,
    title: 'Các cấp độ tổ chức của thế giới sống',
    hook:
      'Cơ thể chúng ta được cấu tạo từ hàng nghìn tỉ tế bào liên kết chặt chẽ. ' +
      'Các tế bào lại được cấu tạo từ các bào quan, phân tử và nguyên tử. Hãy cùng tìm hiểu cấu trúc phân tầng kì diệu của sự sống.',
    theory:
      '## Khái niệm cấp độ tổ chức sống\n' +
      '— Cấp độ tổ chức sống là vị trí phân cấp của các hệ thống sống từ nhỏ đến lớn trong thế giới sống.\n\n' +
      '## Sơ đồ các cấp độ tổ chức sống\n' +
      '— Nguyên tử -> Phân tử -> Bào quan -> Tế bào -> Mô -> Cơ quan -> Hệ cơ quan -> Cơ thể -> Quần thể -> Quần xã -> Hệ sinh thái -> Sinh quyển.\n' +
      '— Các cấp độ tổ chức sống cơ bản (có thể hoạt động độc lập và thể hiện đầy đủ đặc tính của sự sống):\n' +
      '  1. Tế bào (Cell - cấp độ tổ chức cơ bản nhất).\n' +
      '  2. Cơ thể (Organism).\n' +
      '  3. Quần thể (Population).\n' +
      '  4. Quần xã (Community).\n' +
      '  5. Hệ sinh thái (Ecosystem).\n\n' +
      '## Đặc điểm chung của các cấp độ tổ chức sống\n' +
      '1. Tổ chức theo nguyên tắc thứ bậc (Hierarchical organization): Cấp dưới làm nền tảng xây dựng nên cấp trên. Cấp trên có những **đặc tính nổi trội** (emergent properties) mà cấp dưới không có.\n' +
      '2. Hệ thống mở và tự điều chỉnh (Open and self-regulating system): Thường xuyên trao đổi vật chất và năng lượng với môi trường; có khả năng tự điều chỉnh để duy trì trạng thái cân bằng động (homeostasis).\n' +
      '3. Liên tục tiến hoá: Mọi sinh vật đều có chung nguồn gốc nhưng không ngừng tiến hoá để thích nghi với môi trường sống.',
    workedExample: {
      problem: 'Thế nào là đặc tính nổi trội của thế giới sống? Cho ví dụ minh hoạ.',
      steps: [
        'Định nghĩa đặc tính nổi trội: Là đặc tính xuất hiện ở cấp độ tổ chức cao hơn nhờ sự tương tác của các bộ phận cấu thành ở cấp độ thấp hơn.',
        'Ví dụ ở cấp độ tế bào: Tế bào thần kinh đơn lẻ chỉ truyền xung thần kinh, nhưng hàng tỉ tế bào thần kinh liên kết tạo nên bộ não có khả năng tư duy, ghi nhớ, cảm xúc.',
        'Ví dụ ở cấp độ cơ thể: Các cơ quan tiêu hoá riêng lẻ không tự nuôi sống sinh vật, nhưng kết hợp lại tạo thành hệ tiêu hoá và cơ thể hoạt động sống hoàn chỉnh.',
      ],
      answer:
        'Đặc tính nổi trội là đặc tính mới xuất hiện ở cấp độ cao hơn nhờ sự tương tác của các thành phần ở cấp độ thấp hơn.',
    },
    checkQuestions: [
      {
        prompt: 'Cấp độ tổ chức sống nào sau đây là cấp độ tổ chức cơ bản nhất của thế giới sống?',
        choices: [
          { id: 'cd_1', label: 'Tế bào' },
          { id: 'cd_2', label: 'Cơ quan' },
          { id: 'cd_3', label: 'Cơ thể' },
          { id: 'cd_4', label: 'Phân tử' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['cd_1'],
        },
        explain:
          'Tế bào là đơn vị cấu trúc và chức năng cơ bản nhất của mọi sinh vật sống. Mọi hoạt động sống đều diễn ra ở cấp độ tế bào.',
      },
      {
        prompt: 'Đặc tính nào sau đây KHÔNG phải là đặc điểm chung của các cấp độ tổ chức sống?',
        choices: [
          {
            id: 'dd_1',
            label: 'Là hệ thống kín, không trao đổi vật chất với môi trường bên ngoài',
          },
          { id: 'dd_2', label: 'Tổ chức theo nguyên tắc thứ bậc' },
          { id: 'dd_3', label: 'Hệ thống mở và tự điều chỉnh' },
          { id: 'dd_4', label: 'Liên tục tiến hoá' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['dd_1'],
        },
        explain:
          'Các cấp độ tổ chức sống là những hệ thống mở (open systems), liên tục trao đổi chất và năng lượng với môi trường.',
      },
    ],
    srsCards: [
      {
        hoi: 'Nêu 5 cấp độ tổ chức sống cơ bản?',
        dap: 'Tế bào, cơ thể, quần thể, quần xã, hệ sinh thái.',
      },
      {
        hoi: 'Giải thích nguyên tắc thứ bậc trong thế giới sống?',
        dap: 'Là nguyên tắc tổ chức từ thấp đến cao, trong đó tổ chức cấp dưới làm nền tảng cấu tạo nên tổ chức cấp trên.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh10-c2-b4',
    animation: {
      title: 'Phân tử nước phân cực và liên kết hydrogen',
      description:
        'Một phân tử nước vẽ thành nguyên tử oxygen lớn ở giữa với hai nguyên tử hydrogen nhỏ chếch hai bên, góc khoảng 104,5 độ. Oxygen kéo electron về phía mình nên mang phần điện tích âm, hai đầu hydrogen mang phần điện tích dương — phân tử bị PHÂN CỰC. Khi phân tử thứ hai trôi tới, đầu hydrogen dương của nó bị hút về phía oxygen âm của phân tử thứ nhất và hình thành liên kết hydrogen, vẽ bằng nét đứt. Liên kết này rất yếu nên liên tục đứt rồi nối lại, thấy rõ qua đoạn nét đứt mờ đi rồi hiện lại. Chính hàng tỉ liên kết yếu nhưng đông đảo này giải thích vì sao nước có sức căng bề mặt, dẫn nhiệt tốt và giữ nhiệt cho cơ thể sống.',
      viewBoxWidth: 420,
      viewBoxHeight: 240,
      durationMs: 8000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'lk1',
          x1: 130,
          y1: 120,
          x2: 82,
          y2: 78,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'lk2',
          x1: 130,
          y1: 120,
          x2: 178,
          y2: 78,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        { kind: 'circle', id: 'o1', cx: 130, cy: 120, r: 34, fill: 'primary' },
        {
          kind: 'label',
          id: 'lo1',
          x: 130,
          y: 126,
          text: 'O',
          size: 20,
          anchor: 'middle',
          fill: 'surface',
        },
        { kind: 'circle', id: 'h1', cx: 82, cy: 78, r: 18, fill: 'accent' },
        { kind: 'circle', id: 'h2', cx: 178, cy: 78, r: 18, fill: 'accent' },
        {
          kind: 'label',
          id: 'lh1',
          x: 82,
          y: 84,
          text: 'H',
          size: 14,
          anchor: 'middle',
          fill: 'surface',
        },
        {
          kind: 'label',
          id: 'lh2',
          x: 178,
          y: 84,
          text: 'H',
          size: 14,
          anchor: 'middle',
          fill: 'surface',
        },
        {
          kind: 'label',
          id: 'am',
          x: 130,
          y: 168,
          text: 'δ− (âm một phần)',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'duong',
          x: 62,
          y: 52,
          text: 'δ+',
          size: 13,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'circle',
          id: 'o2',
          cx: 330,
          cy: 170,
          r: 34,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 30 },
            { atMs: 1500, opacity: 0.2, dx: 30 },
            { atMs: 3200, opacity: 1, dx: 0 },
            { atMs: 8000, opacity: 1, dx: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'h3',
          cx: 282,
          cy: 128,
          r: 18,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 30 },
            { atMs: 1500, opacity: 0.2, dx: 30 },
            { atMs: 3200, opacity: 1, dx: 0 },
            { atMs: 8000, opacity: 1, dx: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'h4',
          cx: 378,
          cy: 128,
          r: 18,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 30 },
            { atMs: 1500, opacity: 0.2, dx: 30 },
            { atMs: 3200, opacity: 1, dx: 0 },
            { atMs: 8000, opacity: 1, dx: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'lo2',
          x: 330,
          y: 176,
          text: 'O',
          size: 20,
          anchor: 'middle',
          fill: 'surface',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 30 },
            { atMs: 1500, opacity: 0.2, dx: 30 },
            { atMs: 3200, opacity: 1, dx: 0 },
            { atMs: 8000, opacity: 1, dx: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'lh3',
          x: 282,
          y: 134,
          text: 'H',
          size: 14,
          anchor: 'middle',
          fill: 'surface',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 30 },
            { atMs: 1500, opacity: 0.2, dx: 30 },
            { atMs: 3200, opacity: 1, dx: 0 },
            { atMs: 8000, opacity: 1, dx: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'lh4',
          x: 378,
          y: 134,
          text: 'H',
          size: 14,
          anchor: 'middle',
          fill: 'surface',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 30 },
            { atMs: 1500, opacity: 0.2, dx: 30 },
            { atMs: 3200, opacity: 1, dx: 0 },
            { atMs: 8000, opacity: 1, dx: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'hydro',
          x1: 164,
          y1: 134,
          x2: 268,
          y2: 124,
          stroke: 'accent',
          strokeWidth: 3,
          dash: '6 5',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3400, opacity: 0 },
            { atMs: 4000, opacity: 1 },
            { atMs: 5600, opacity: 0.15 },
            { atMs: 6400, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'lhydro',
          x: 226,
          y: 156,
          text: 'liên kết hydrogen (yếu)',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3700, opacity: 0 },
            { atMs: 4200, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
      ],
      captions: [
        {
          atMs: 300,
          text: 'Oxygen kéo electron mạnh hơn nên mang điện tích âm một phần, hai đầu H mang điện dương một phần.',
        },
        { atMs: 3200, text: 'Phân tử nước thứ hai trôi tới, đầu H dương hướng về đầu O âm.' },
        {
          atMs: 4200,
          text: 'Liên kết hydrogen hình thành — nét đứt nối H của phân tử này với O của phân tử kia.',
        },
        {
          atMs: 5800,
          text: 'Liên kết này rất yếu: nó đứt rồi nối lại liên tục, nhưng số lượng cực lớn nên nước vẫn kết dính.',
        },
      ],
    },
    grade: '10',
    chapterNumber: 2,
    chapterTitle: 'Thành phần hoá học của tế bào',
    lessonNumber: 4,
    title: 'Các nguyên tố hoá học và nước',
    hook:
      'Hơn 70% khối lượng cơ thể chúng ta là nước, và phần còn lại chủ yếu là các nguyên tố Carbon, Hydrogen, Oxygen, Nitrogen. ' +
      'Tại sao những nguyên tố này lại quan trọng đến thế?',
    theory:
      '## Các nguyên tố hoá học trong tế bào\n' +
      'Trong khoảng 25 nguyên tố cấu tạo nên sự sống, chúng được chia làm 2 nhóm chính:\n' +
      '1. Nguyên tố đa lượng (Macroelements): Chiếm tỉ lệ lớn (>= 0,01% khối lượng khô cơ thể). Ví dụ: C, H, O, N, P, S, Ca, K...\n' +
      '   — Vai trò: Cấu tạo nên các đại phân tử sinh học (carbohydrate, lipid, protein, nucleic acid), cấu trúc nên tế bào và bào quan.\n' +
      '   — Carbon (C) là nguyên tố quan trọng nhất vì có 4 electron hoá trị, dễ dàng hình thành liên kết cộng hoá trị bền vững với các nguyên tố khác, tạo nên mạch carbon vô cùng đa dạng.\n' +
      '2. Nguyên tố vi lượng (Microelements): Chiếm tỉ lệ nhỏ (< 0,01% khối lượng khô cơ thể). Ví dụ: Fe, Cu, Zn, Mn, I, F...\n' +
      '   — Vai trò: Tham gia cấu tạo hoặc hoạt hoá enzyme, hormone, sắc tố (ví dụ: Fe cấu tạo hemoglobin trong hồng cầu, I cấu tạo hormone tuyến giáp).\n\n' +
      '## Nước và vai trò của nước đối với tế bào\n' +
      '— Cấu trúc phân cực: Nguyên tử Oxygen có độ âm điện lớn hơn nguyên tử Hydrogen, hút electron lệch về phía mình, làm đầu Oxygen mang điện tích âm nhẹ, đầu Hydrogen mang điện tích dương nhẹ.\n' +
      '— Liên kết hydrogen: Nhờ tính phân cực, các phân tử nước hút nhau tạo thành các liên kết hydrogen linh động.\n' +
      '— Vai trò của nước:\n' +
      '  + Là dung môi hoà tan nhiều chất cần thiết cho tế bào.\n' +
      '  + Là môi trường diễn ra và trực tiếp tham gia các phản ứng hoá sinh.\n' +
      '  + Tham gia điều hoà nhiệt độ cơ thể nhờ nhiệt bay hơi và nhiệt dung riêng lớn.',
    workedExample: {
      problem:
        'Tại sao khi ta làm lạnh nước dưới 0 °C, nước đá lại nổi lên trên mặt nước lỏng? Điều này có ý nghĩa gì đối với sinh vật?',
      steps: [
        'Mô tả cấu trúc nước đá: Nước lỏng đặc nhất ở 4 °C. Khi hạ xuống 0 °C và nước đóng băng, mỗi phân tử nước giữ 4 liên kết hydrogen bền vững, khoá các phân tử ở khoảng cách xa nhau thành mạng tinh thể rỗng nên mật độ phân tử giảm.',
        'Kết luận về khối lượng riêng: Khối lượng riêng của nước đá nhỏ hơn nước lỏng, khiến nước đá nổi lên.',
        'Ý nghĩa sinh thái: Vào mùa đông ở vùng cực, lớp băng nổi lên trên mặt hồ tạo thành một tấm cách nhiệt ngăn nước bên dưới tiếp tục đóng băng, bảo vệ các sinh vật thuỷ sinh sống dưới nước.',
      ],
      answer:
        'Nước đá nổi do có cấu trúc tinh thể rỗng làm khối lượng riêng nhỏ hơn nước lỏng, giúp giữ ấm cho sinh vật dưới nước vào mùa đông.',
    },
    checkQuestions: [
      {
        prompt:
          'Nguyên tố hoá học nào sau đây được coi là cốt lõi cấu tạo nên mọi hợp chất hữu cơ trong tế bào?',
        choices: [
          { id: 'el_1', label: 'Carbon (C)' },
          { id: 'el_2', label: 'Oxygen (O)' },
          { id: 'el_3', label: 'Nitrogen (N)' },
          { id: 'el_4', label: 'Hydrogen (H)' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['el_1'],
        },
        explain:
          'Carbon có 4 electron hoá trị, có khả năng hình thành các mạch carbon thẳng, nhánh hoặc vòng, liên kết với nhiều nguyên tố tạo nên sự đa dạng của chất hữu cơ.',
      },
      {
        prompt: 'Các phân tử nước liên kết với nhau chủ yếu bằng liên kết nào sau đây?',
        choices: [
          { id: 'lk_1', label: 'Liên kết hydrogen' },
          { id: 'lk_2', label: 'Liên kết cộng hoá trị không phân cực' },
          { id: 'lk_3', label: 'Liên kết ion' },
          { id: 'lk_4', label: 'Liên kết peptide' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['lk_1'],
        },
        explain:
          'Nhờ tính phân cực, nguyên tử H mang điện dương nhẹ của phân tử nước này hút nguyên tử O mang điện âm nhẹ của phân tử nước kia tạo liên kết hydrogen.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phân biệt nguyên tố đa lượng và vi lượng dựa trên tỉ lệ khối lượng?',
        dap: 'Đa lượng chiếm >= 0,01% khối lượng khô; vi lượng chiếm < 0,01% khối lượng khô cơ thể.',
      },
      {
        hoi: 'Tại sao nước có tính chất phân cực?',
        dap: 'Vì nguyên tử Oxygen có độ âm điện lớn hơn Hydrogen, hút cặp electron dùng chung lệch về phía mình.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh10-c2-b5',
    animation: {
      title: 'Đơn phân nối thành đa phân, loại một phân tử nước',
      description:
        'Bốn ô mô tả cách mọi đại phân tử sinh học được lắp ráp theo cùng MỘT nguyên tắc. Đầu tiên là các đơn phân rời: glucose với tinh bột, amino acid với protein, nucleotide với acid nucleic. Hai đơn phân ghép lại, nhóm −OH của phân tử này và nguyên tử H của phân tử kia tách ra tạo thành một phân tử nước bị loại đi, chỗ trống còn lại chính là liên kết cộng hoá trị nối hai đơn phân. Lặp lại hàng nghìn lần thì được chuỗi đa phân. Ý mà câu chữ khó truyền: nối thêm mỗi đơn phân đều mất đúng một phân tử nước, nên khi tiêu hoá muốn tách chuỗi ra thì phải cộng nước vào — thuỷ phân chính là phản ứng ngược của trùng ngưng.',
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
          text: 'Phản ứng trùng ngưng tạo phân tử sinh học',
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
          text: 'Các đơn phân rời',
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
          text: 'glucose, amino acid',
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
          text: 'Ghép hai đơn phân',
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
          text: '−OH gặp −H',
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
          text: 'Loại 1 phân tử H₂O',
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
          text: 'tạo liên kết',
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
          text: 'Chuỗi đa phân',
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
          text: 'tinh bột, protein',
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
        { atMs: 500, text: 'Bắt đầu từ đơn phân: glucose, amino acid, nucleotide.' },
        {
          atMs: 1600,
          text: 'Hai đơn phân ghép lại, nhóm −OH của phân tử này gặp H của phân tử kia.',
        },
        { atMs: 2700, text: 'Tách ra đúng một phân tử nước, chỗ đó thành liên kết cộng hoá trị.' },
        {
          atMs: 3800,
          text: 'Lặp lại nhiều lần thành đa phân; thuỷ phân là phản ứng ngược, phải cộng nước vào.',
        },
      ],
    },
    grade: '10',
    chapterNumber: 2,
    chapterTitle: 'Thành phần hoá học của tế bào',
    lessonNumber: 5,
    title: 'Các phân tử sinh học',
    hook:
      'Carbohydrate, lipid, protein, nucleic acid là những khối lắp ghép tạo nên sự sống. ' +
      'Mỗi nhóm chất thực hiện những nhiệm vụ độc đáo và tối quan trọng trong từng tế bào.',
    theory:
      '## Các phân tử sinh học chính trong tế bào\n' +
      'Có 4 nhóm đại phân tử hữu cơ cấu tạo nên tế bào:\n' +
      '1. Carbohydrate (đường, chất bột đường): Cấu tạo từ C, H, O theo tỉ lệ khoảng 1:2:1.\n' +
      '   — Đường đơn (Monosaccharide): Glucose, Fructose, Galactose. Dùng làm nguồn năng lượng tức thời.\n' +
      '   — Đường đôi (Disaccharide): Sucrose, Lactose, Maltose. Sucrose là dạng đường vận chuyển trong cây, lactose có trong sữa động vật.\n' +
      '   — Đường đa (Polysaccharide): Tinh bột (dự trữ ở thực vật), Glycogen (dự trữ ở động vật), Cellulose (cấu tạo thành tế bào thực vật), Chitin (thành tế bào nấm, vỏ giáp xác).\n' +
      '2. Lipid (Chất béo): Không tan trong nước (kị nước), cấu tạo chủ yếu từ C, H, O.\n' +
      '   — Triglyceride (mỡ và dầu): Cấu tạo từ 1 glycerol và 3 acid béo. Dự trữ năng lượng lâu dài.\n' +
      '   — Phospholipid: Cấu tạo từ 1 glycerol liên kết với 2 acid béo kị nước và 1 nhóm phosphate ưa nước. Là thành phần chính cấu tạo nên màng sinh chất.\n' +
      '   — Steroid (ví dụ cholesterol, estrogen, testosterone): Điều hoà sinh lí, làm vững màng sinh chất.\n' +
      '3. Protein (Chất đạm): Đại phân tử cấu tạo theo nguyên tắc đa phân, monomer là **amino acid** (có khoảng 20 loại khác nhau).\n' +
      '   — Có 4 bậc cấu trúc: Bậc 1 (trình tự các amino acid trên chuỗi polypeptide), Bậc 2 (xoắn alpha hoặc nếp gấp beta), Bậc 3 (cấu trúc không gian 3 chiều đặc trưng), Bậc 4 (sự liên kết của nhiều chuỗi polypeptide).\n' +
      '   — Chức năng: Xúc tác (enzyme), cấu trúc (collagen, keratin), vận chuyển (hemoglobin), bảo vệ (kháng thể), truyền tín hiệu (hormone).\n' +
      '4. Nucleic acid: Gồm DNA (A, T, G, C - mạch kép xoắn, lưu trữ thông tin di truyền) và RNA (A, U, G, C - mạch đơn, truyền đạt thông tin di truyền và dịch mã). Cấu tạo từ các monomer là **nucleotide**.',
    workedExample: {
      problem: 'Nêu sự khác biệt cơ bản giữa cấu trúc và chức năng của DNA và RNA.',
      steps: [
        'Về số mạch: DNA cấu tạo từ 2 mạch polynucleotide xoắn kép, ngược chiều nhau. RNA chỉ gồm 1 mạch polynucleotide.',
        'Về loại đường và base: Đường của DNA là deoxyribose, base chứa T (Thymine). Đường của RNA là ribose, base chứa U (Uracil) thay cho T.',
        'Về chức năng: DNA có tính bền vững cao, lưu trữ bảo quản thông tin di truyền. RNA linh động hơn, tham gia truyền đạt thông tin di truyền và dịch mã tổng hợp protein.',
      ],
      answer:
        'DNA mạch kép, chứa đường deoxyribose và base T; RNA mạch đơn, chứa đường ribose và base U.',
    },
    checkQuestions: [
      {
        prompt: 'Đường polysaccharide đóng vai trò cấu trúc cấu tạo nên thành tế bào thực vật là:',
        choices: [
          { id: 'cb_1', label: 'Cellulose' },
          { id: 'cb_2', label: 'Tinh bột' },
          { id: 'cb_3', label: 'Glycogen' },
          { id: 'cb_4', label: 'Chitin' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['cb_1'],
        },
        explain:
          'Cellulose là chuỗi dài các phân tử glucose nối nhau bằng liên kết glycosidic bền vững; nhiều chuỗi lại bị liên kết hydrogen bó chặt thành vi sợi (microfibril) làm nên thành tế bào thực vật. Tinh bột và glycogen cũng là polymer của glucose nhưng dùng để dự trữ, còn chitin cấu tạo thành tế bào nấm chứ không phải của thực vật.',
      },
      {
        prompt:
          'Đại phân tử hữu cơ nào sau đây là thành phần chính cấu tạo nên lớp kép màng sinh chất của tế bào?',
        choices: [
          { id: 'lp_1', label: 'Phospholipid' },
          { id: 'lp_2', label: 'Triglyceride' },
          { id: 'lp_3', label: 'Sáp (Wax)' },
          { id: 'lp_4', label: 'Steroid' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['lp_1'],
        },
        explain:
          'Phospholipid có cấu trúc lưỡng cực gồm đầu ưa nước và hai đuôi kị nước, tự động sắp xếp thành lớp kép phospholipid trong nước tạo màng sinh chất.',
      },
    ],
    srsCards: [
      {
        hoi: 'Đơn phân của Protein là gì?',
        dap: 'Các amino acid (axit amin).',
      },
      {
        hoi: 'Nêu sự khác biệt giữa base của DNA và RNA?',
        dap: 'DNA chứa A, T, G, C. RNA chứa A, U, G, C (thay Thymine bằng Uracil).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'sinh10-c2-b6',
    grade: '10',
    chapterNumber: 2,
    chapterTitle: 'Thành phần hoá học của tế bào',
    lessonNumber: 6,
    title: 'Thực hành: Nhận biết một số phân tử sinh học',
    hook:
      'Làm thế nào để chứng minh củ khoai tây có chứa tinh bột, quả nho có đường khử hay lòng trắng trứng chứa protein? ' +
      'Chúng ta sử dụng các thuốc thử màu hoá học đặc trưng.',
    theory:
      '## Nguyên tắc các phản ứng thử màu sinh học\n' +
      '1. Nhận biết đường khử (glucose, fructose...):\n' +
      '   — Thuốc thử: Dung dịch Benedict (hoặc thuốc thử Fehling chứa ion Cu²⁺).\n' +
      '   — Hiện tượng: Khi đun nóng nhẹ hỗn hợp đường khử với thuốc thử Benedict, xuất hiện kết tủa đỏ gạch (Cu₂O) do đường khử đã khử ion Cu²⁺ xuống Cu⁺.\n' +
      '2. Nhận biết tinh bột:\n' +
      '   — Thuốc thử: Dung dịch Iốt (I₂ / KI).\n' +
      '   — Hiện tượng: Dung dịch Iốt len lỏi vào cấu trúc xoắn của tinh bột tạo thành phức chất có màu xanh tím đặc trưng. Khi đun nóng màu xanh tím biến mất, làm nguội màu xuất hiện trở lại.\n' +
      '3. Nhận biết protein (Phản ứng Biuret):\n' +
      '   — Thuốc thử: NaOH + CuSO₄ (phản ứng tạo môi trường kiềm cho ion Cu²⁺ liên kết với peptide).\n' +
      '   — Hiện tượng: Xuất hiện màu tím đặc trưng do ion Cu²⁺ tạo phức với các liên kết peptide của protein.\n' +
      '4. Nhận biết lipid:\n' +
      '   — Nguyên tắc: Lipid không tan trong nước nhưng tan trong dung môi hữu cơ (ethanol). Khi cho nước vào dung dịch lipid đã hoà tan trong cồn, sẽ xuất hiện nhũ dịch trắng đục (emulsion).',
    workedExample: {
      problem:
        'Mô tả thí nghiệm nhận biết sự hiện diện của protein trong dung dịch lòng trắng trứng gà.',
      steps: [
        'Chuẩn bị ống nghiệm đựng 2 ml dung dịch lòng trắng trứng pha loãng.',
        'Thêm vào ống nghiệm 1 ml dung dịch NaOH 10% để tạo môi trường kiềm mạnh.',
        'Nhỏ tiếp vài giọt dung dịch CuSO₄ 1% vào ống nghiệm và lắc đều nhẹ nhàng.',
        'Quan sát hiện tượng: Dung dịch chuyển sang màu tím đặc trưng (phản ứng Biuret dương tính).',
      ],
      answer: 'Nhỏ NaOH và CuSO₄ vào dung dịch lòng trắng trứng thấy xuất hiện phức chất màu tím.',
    },
    checkQuestions: [
      {
        prompt:
          'Để nhận biết sự có mặt của tinh bột trong mẫu thử thực phẩm, ta sử dụng dung dịch nào sau đây làm thuốc thử?',
        choices: [
          { id: 'th_1', label: 'Dung dịch Iốt' },
          { id: 'th_2', label: 'Dung dịch Benedict' },
          { id: 'th_3', label: 'Dung dịch NaOH 10%' },
          { id: 'th_4', label: 'Cồn ethanol 96%' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['th_1'],
        },
        explain:
          'Phân tử iốt chui vào lòng chuỗi xoắn của tinh bột tạo phức chất màu xanh tím đặc trưng. Benedict dùng cho đường khử, NaOH kết hợp CuSO₄ mới là phép thử protein, còn ethanol chỉ dùng để thử lipid.',
      },
      {
        prompt:
          'Khi đun nóng nhẹ dung dịch glucose với thuốc thử Benedict, hiện tượng màu sắc đặc trưng xuất hiện là:',
        choices: [
          { id: 'ms_1', label: 'Xuất hiện kết tủa đỏ gạch' },
          { id: 'ms_2', label: 'Xuất hiện dung dịch màu tím hoa cà' },
          { id: 'ms_3', label: 'Xuất hiện kết tủa màu đen nhánh' },
          { id: 'ms_4', label: 'Không có hiện tượng đổi màu' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['ms_1'],
        },
        explain:
          'Đường khử (như glucose) khử Cu²⁺ trong thuốc thử Benedict thành Cu₂O kết tủa màu đỏ gạch khi đun nóng.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phản ứng Biuret dùng để nhận biết nhóm chất nào và cho màu gì?',
        dap: 'Nhận biết protein, cho màu tím đặc trưng.',
      },
      {
        hoi: 'Tại sao màu xanh tím của tinh bột và iốt biến mất khi đun nóng?',
        dap: 'Vì nhiệt độ cao làm chuỗi tinh bột duỗi thẳng, iốt thoát khỏi lòng chuỗi xoắn; khi nguội tinh bột xoắn lại, giữ iốt vào trong nên màu xanh tím xuất hiện trở lại.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
