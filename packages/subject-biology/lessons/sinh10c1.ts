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
        'Sáu ô hình hiện lần lượt theo hình chữ S, mũi tên nối ô trước với ô sau. Ô 1: một phân tử DNA hai mạch xoắn, tự nó chưa sống. Ô 2: một ti thể (bào quan) có màng trong gấp nếp, làm từ nhiều phân tử. Ô 3: một tế bào có màng, nhân và hai ti thể, vòng nét đứt khoanh một ti thể: bào quan nằm trong tế bào. Tế bào là cấp tổ chức sống cơ bản, có đủ dấu hiệu sống. Ô 4: mô gồm sáu tế bào cùng loại, khung nét đứt khoanh một tế bào. Ô 5: một cây; vòng nét đứt khoanh chiếc lá, một cơ quan làm từ nhiều mô. Ô 6: ba cây cùng loài là quần thể; thêm cây khác loài và con thỏ thành quần xã; thêm mặt trời và mặt đất (môi trường vô sinh) thành hệ sinh thái. Dòng cuối: mọi hệ sinh thái trên Trái Đất hợp thành sinh quyển. Mỗi cấp trên có đặc tính nổi trội mà cấp dưới không có.',
      viewBoxWidth: 600,
      viewBoxHeight: 328,
      durationMs: 14500,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'tieu-de',
          x: 300,
          y: 22,
          text: 'Từ phân tử đến sinh quyển: cấp dưới nằm trong cấp trên',
          size: 14,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'polyline',
          id: 'dna-bac',
          points: [
            [51, 115.52],
            [51, 94.48],
            [56.5, 92.16],
            [62, 92.64],
            [67.5, 95.81],
            [73, 100.98],
            [73, 109.02],
            [78.5, 102.97],
            [84, 97.36],
            [89.5, 93.42],
            [95, 92],
            [95, 118],
            [100.5, 116.58],
            [106, 112.64],
            [111.5, 107.03],
            [117, 100.98],
            [117, 109.02],
            [122.5, 114.19],
            [128, 117.36],
            [133.5, 117.84],
            [139, 115.52],
            [139, 94.48],
          ],
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'polyline',
          id: 'dna-a',
          points: [
            [40, 105],
            [45.5, 110.9],
            [51, 115.52],
            [56.5, 117.84],
            [62, 117.36],
            [67.5, 114.19],
            [73, 109.02],
            [78.5, 102.97],
            [84, 97.36],
            [89.5, 93.42],
            [95, 92],
            [100.5, 93.42],
            [106, 97.36],
            [111.5, 102.97],
            [117, 109.02],
            [122.5, 114.19],
            [128, 117.36],
            [133.5, 117.84],
            [139, 115.52],
            [144.5, 110.9],
            [150, 105],
          ],
          stroke: 'primary',
          strokeWidth: 2.5,
        },
        {
          kind: 'polyline',
          id: 'dna-b',
          points: [
            [40, 105],
            [45.5, 99.1],
            [51, 94.48],
            [56.5, 92.16],
            [62, 92.64],
            [67.5, 95.81],
            [73, 100.98],
            [78.5, 107.03],
            [84, 112.64],
            [89.5, 116.58],
            [95, 118],
            [100.5, 116.58],
            [106, 112.64],
            [111.5, 107.03],
            [117, 100.98],
            [122.5, 95.81],
            [128, 92.64],
            [133.5, 92.16],
            [139, 94.48],
            [144.5, 99.1],
            [150, 105],
          ],
          stroke: 'primary',
          strokeWidth: 2.5,
        },
        {
          kind: 'label',
          id: 'lb-1',
          x: 95,
          y: 160,
          text: '1. Phân tử',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'lb-1b',
          x: 95,
          y: 174,
          text: 'DNA, protein: chưa sống',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'arrow',
          id: 'mt-12',
          x1: 160,
          y1: 105,
          x2: 218,
          y2: 105,
          stroke: 'muted',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2000,
              opacity: 0,
            },
            {
              atMs: 2300,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'ti-the',
          points: [
            [353, 105],
            [351.55, 111.68],
            [347.26, 118.02],
            [340.35, 123.7],
            [331.16, 128.45],
            [320.17, 132.03],
            [307.91, 134.25],
            [295, 135],
            [282.09, 134.25],
            [269.83, 132.03],
            [258.84, 128.45],
            [249.65, 123.7],
            [242.74, 118.02],
            [238.45, 111.68],
            [237, 105],
            [238.45, 98.32],
            [242.74, 91.98],
            [249.65, 86.3],
            [258.84, 81.55],
            [269.83, 77.97],
            [282.09, 75.75],
            [295, 75],
            [307.91, 75.75],
            [320.17, 77.97],
            [331.16, 81.55],
            [340.35, 86.3],
            [347.26, 91.98],
            [351.55, 98.32],
          ],
          closed: true,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2000,
              opacity: 0,
            },
            {
              atMs: 2300,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'mang-trong',
          points: [
            [250, 91.12],
            [259, 122.25],
            [268, 85.53],
            [277, 125.91],
            [286, 83.27],
            [295, 127],
            [304, 83.27],
            [313, 125.91],
            [322, 85.53],
            [331, 122.25],
            [340, 91.12],
          ],
          stroke: 'primary',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2000,
              opacity: 0,
            },
            {
              atMs: 2300,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-2',
          x: 295,
          y: 160,
          text: '2. Bào quan',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2000,
              opacity: 0,
            },
            {
              atMs: 2300,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-2b',
          x: 295,
          y: 174,
          text: 'ti thể, ribosome…',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2000,
              opacity: 0,
            },
            {
              atMs: 2300,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt-23',
          x1: 360,
          y1: 105,
          x2: 425,
          y2: 105,
          stroke: 'muted',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3800,
              opacity: 0,
            },
            {
              atMs: 4100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'mang-tb',
          cx: 495,
          cy: 105,
          r: 44,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3800,
              opacity: 0,
            },
            {
              atMs: 4100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'nhan',
          cx: 480,
          cy: 108,
          r: 15,
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
              atMs: 3800,
              opacity: 0,
            },
            {
              atMs: 4100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'tt-1',
          points: [
            [525.34, 91.76],
            [523.76, 93.63],
            [520.86, 94.65],
            [517.06, 94.65],
            [512.95, 93.64],
            [509.15, 91.77],
            [506.24, 89.33],
            [504.66, 86.68],
            [504.66, 84.24],
            [506.24, 82.37],
            [509.14, 81.35],
            [512.94, 81.35],
            [517.05, 82.36],
            [520.85, 84.23],
            [523.76, 86.67],
            [525.34, 89.32],
          ],
          closed: true,
          stroke: 'primary',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3800,
              opacity: 0,
            },
            {
              atMs: 4100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'tt-2',
          points: [
            [522.63, 122.15],
            [522.41, 124.59],
            [520.61, 127.08],
            [517.5, 129.26],
            [513.55, 130.8],
            [509.37, 131.44],
            [505.58, 131.11],
            [502.78, 129.85],
            [501.37, 127.85],
            [501.59, 125.41],
            [503.39, 122.92],
            [506.5, 120.74],
            [510.45, 119.2],
            [514.63, 118.56],
            [518.42, 118.89],
            [521.22, 120.15],
          ],
          closed: true,
          stroke: 'primary',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3800,
              opacity: 0,
            },
            {
              atMs: 4100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'vong-3',
          cx: 515,
          cy: 88,
          r: 15,
          stroke: 'neutral',
          strokeWidth: 1.5,
          dash: '3 2',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4400,
              opacity: 0,
            },
            {
              atMs: 4700,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-3',
          x: 495,
          y: 166,
          text: '3. TẾ BÀO',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3800,
              opacity: 0,
            },
            {
              atMs: 4100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-3b',
          x: 495,
          y: 180,
          text: 'cấp cơ bản: có đủ dấu hiệu sống',
          size: 10,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3800,
              opacity: 0,
            },
            {
              atMs: 4100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt-34',
          x1: 585,
          y1: 118,
          x2: 585,
          y2: 236,
          stroke: 'muted',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5800,
              opacity: 0,
            },
            {
              atMs: 6100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'luoi-mo',
          points: [
            [441, 212],
            [549, 212],
            [549, 272],
            [441, 272],
            [441, 242],
            [549, 242],
            [513, 242],
            [513, 272],
            [513, 212],
            [477, 212],
            [477, 272],
            [441, 272],
            [441, 212],
          ],
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5800,
              opacity: 0,
            },
            {
              atMs: 6100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'nhan-mo-0',
          cx: 459,
          cy: 227,
          r: 4.5,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5800,
              opacity: 0,
            },
            {
              atMs: 6100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'nhan-mo-1',
          cx: 495,
          cy: 227,
          r: 4.5,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5800,
              opacity: 0,
            },
            {
              atMs: 6100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'nhan-mo-2',
          cx: 531,
          cy: 227,
          r: 4.5,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5800,
              opacity: 0,
            },
            {
              atMs: 6100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'nhan-mo-3',
          cx: 459,
          cy: 257,
          r: 4.5,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5800,
              opacity: 0,
            },
            {
              atMs: 6100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'nhan-mo-4',
          cx: 495,
          cy: 257,
          r: 4.5,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5800,
              opacity: 0,
            },
            {
              atMs: 6100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'nhan-mo-5',
          cx: 531,
          cy: 257,
          r: 4.5,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5800,
              opacity: 0,
            },
            {
              atMs: 6100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'rect',
          id: 'vong-4',
          x: 510,
          y: 209,
          w: 42,
          h: 36,
          stroke: 'neutral',
          strokeWidth: 1.5,
          dash: '3 2',
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
              atMs: 6700,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-4',
          x: 495,
          y: 296,
          text: '4. Mô',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5800,
              opacity: 0,
            },
            {
              atMs: 6100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-4b',
          x: 495,
          y: 310,
          text: 'nhiều tế bào cùng loại',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5800,
              opacity: 0,
            },
            {
              atMs: 6100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt-45',
          x1: 432,
          y1: 242,
          x2: 362,
          y2: 242,
          stroke: 'muted',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 7600,
              opacity: 0,
            },
            {
              atMs: 7900,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'than',
          x1: 295,
          y1: 280,
          x2: 295,
          y2: 208,
          stroke: 'correct',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 7600,
              opacity: 0,
            },
            {
              atMs: 7900,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'la-trai',
          points: [
            [291.32, 238],
            [291.71, 240.63],
            [290.36, 243.98],
            [287.42, 247.73],
            [283.16, 251.5],
            [278, 254.93],
            [272.45, 257.68],
            [267.06, 259.48],
            [262.34, 260.16],
            [258.76, 259.65],
            [256.68, 258],
            [256.29, 255.37],
            [257.64, 252.02],
            [260.58, 248.27],
            [264.84, 244.5],
            [270, 241.07],
            [275.55, 238.32],
            [280.94, 236.52],
            [285.66, 235.84],
            [289.24, 236.35],
          ],
          closed: true,
          fill: 'surface',
          stroke: 'correct',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 7600,
              opacity: 0,
            },
            {
              atMs: 7900,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'la-phai',
          points: [
            [333.32, 240],
            [331.24, 241.65],
            [327.66, 242.16],
            [322.94, 241.48],
            [317.55, 239.68],
            [312, 236.93],
            [306.84, 233.5],
            [302.58, 229.73],
            [299.64, 225.98],
            [298.29, 222.63],
            [298.68, 220],
            [300.76, 218.35],
            [304.34, 217.84],
            [309.06, 218.52],
            [314.45, 220.32],
            [320, 223.07],
            [325.16, 226.5],
            [329.42, 230.27],
            [332.36, 234.02],
            [333.71, 237.37],
          ],
          closed: true,
          fill: 'surface',
          stroke: 'correct',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 7600,
              opacity: 0,
            },
            {
              atMs: 7900,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'hoa',
          cx: 295,
          cy: 204,
          r: 7,
          fill: 'warn',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 7600,
              opacity: 0,
            },
            {
              atMs: 7900,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 're',
          points: [
            [283, 287],
            [295, 280],
            [307, 287],
            [295, 280],
            [295, 288],
          ],
          stroke: 'muted',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 7600,
              opacity: 0,
            },
            {
              atMs: 7900,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'vong-5',
          cx: 274,
          cy: 248,
          r: 25,
          stroke: 'neutral',
          strokeWidth: 1.5,
          dash: '3 2',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 8200,
              opacity: 0,
            },
            {
              atMs: 8500,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-5',
          x: 295,
          y: 304,
          text: '5. Cơ quan → cơ thể',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 7600,
              opacity: 0,
            },
            {
              atMs: 7900,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-5b',
          x: 295,
          y: 318,
          text: 'lá là cơ quan, gồm nhiều mô',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 7600,
              opacity: 0,
            },
            {
              atMs: 7900,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt-56',
          x1: 230,
          y1: 242,
          x2: 175,
          y2: 242,
          stroke: 'muted',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 9400,
              opacity: 0,
            },
            {
              atMs: 9700,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'mat-dat',
          x1: 22,
          y1: 282,
          x2: 168,
          y2: 282,
          stroke: 'muted',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 12000,
              opacity: 0,
            },
            {
              atMs: 12300,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'mat-troi',
          cx: 150,
          cy: 206,
          r: 10,
          fill: 'warn',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 12000,
              opacity: 0,
            },
            {
              atMs: 12300,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'cay-0',
          points: [
            [60, 280],
            [60, 264],
            [53, 255],
            [60, 264],
            [67, 255],
            [60, 264],
            [60, 272],
            [54, 267],
            [60, 272],
            [66, 267],
          ],
          stroke: 'correct',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 9400,
              opacity: 0,
            },
            {
              atMs: 9700,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'cay-1',
          points: [
            [85, 280],
            [85, 264],
            [78, 255],
            [85, 264],
            [92, 255],
            [85, 264],
            [85, 272],
            [79, 267],
            [85, 272],
            [91, 267],
          ],
          stroke: 'correct',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 9400,
              opacity: 0,
            },
            {
              atMs: 9700,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'cay-2',
          points: [
            [110, 280],
            [110, 264],
            [103, 255],
            [110, 264],
            [117, 255],
            [110, 264],
            [110, 272],
            [104, 267],
            [110, 272],
            [116, 267],
          ],
          stroke: 'correct',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 9400,
              opacity: 0,
            },
            {
              atMs: 9700,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'than-cay-khac',
          x1: 38,
          y1: 280,
          x2: 38,
          y2: 248,
          stroke: 'muted',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 10800,
              opacity: 0,
            },
            {
              atMs: 11100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'tan-cay-khac',
          cx: 38,
          cy: 236,
          r: 14,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 10800,
              opacity: 0,
            },
            {
              atMs: 11100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'than-tho',
          points: [
            [150, 272],
            [149.24, 274.3],
            [147.07, 276.24],
            [143.83, 277.54],
            [140, 278],
            [136.17, 277.54],
            [132.93, 276.24],
            [130.76, 274.3],
            [130, 272],
            [130.76, 269.7],
            [132.93, 267.76],
            [136.17, 266.46],
            [140, 266],
            [143.83, 266.46],
            [147.07, 267.76],
            [149.24, 269.7],
          ],
          closed: true,
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 10800,
              opacity: 0,
            },
            {
              atMs: 11100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'dau-tho',
          cx: 152,
          cy: 264,
          r: 4.5,
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 10800,
              opacity: 0,
            },
            {
              atMs: 11100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'tai-tho',
          x1: 150,
          y1: 261,
          x2: 145,
          y2: 252,
          stroke: 'neutral',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 10800,
              opacity: 0,
            },
            {
              atMs: 11100,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-6a',
          x: 95,
          y: 304,
          text: '6. Quần thể',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 9400,
              opacity: 0,
            },
            {
              atMs: 9700,
              opacity: 1,
            },
            {
              atMs: 10800,
              opacity: 1,
            },
            {
              atMs: 11100,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-6ab',
          x: 95,
          y: 318,
          text: 'cùng loài, cùng nơi',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 9400,
              opacity: 0,
            },
            {
              atMs: 9700,
              opacity: 1,
            },
            {
              atMs: 10800,
              opacity: 1,
            },
            {
              atMs: 11100,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-6b',
          x: 95,
          y: 304,
          text: '6. Quần xã',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 11100,
              opacity: 0,
            },
            {
              atMs: 11400,
              opacity: 1,
            },
            {
              atMs: 12000,
              opacity: 1,
            },
            {
              atMs: 12300,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-6bb',
          x: 95,
          y: 318,
          text: 'nhiều quần thể khác loài',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 11100,
              opacity: 0,
            },
            {
              atMs: 11400,
              opacity: 1,
            },
            {
              atMs: 12000,
              opacity: 1,
            },
            {
              atMs: 12300,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-6c',
          x: 95,
          y: 304,
          text: '6. Hệ sinh thái',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 12300,
              opacity: 0,
            },
            {
              atMs: 12600,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-6cb',
          x: 95,
          y: 318,
          text: 'quần xã + đất, nước, nắng',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 12300,
              opacity: 0,
            },
            {
              atMs: 12600,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'lb-sinh-quyen',
          x: 300,
          y: 44,
          text: 'Mọi hệ sinh thái trên Trái Đất hợp thành sinh quyển',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 13000,
              opacity: 0,
            },
            {
              atMs: 13300,
              opacity: 1,
            },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Phân tử sinh học như DNA, protein: tự nó chưa có dấu hiệu sống.',
        },
        {
          atMs: 2000,
          text: 'Nhiều phân tử hợp thành bào quan có chức năng riêng, ví dụ ti thể.',
        },
        {
          atMs: 3800,
          text: 'Bào quan nằm trong tế bào. Tế bào là cấp tổ chức sống cơ bản, có đủ dấu hiệu sống.',
        },
        {
          atMs: 5800,
          text: 'Nhiều tế bào cùng loại hợp thành mô.',
        },
        {
          atMs: 7600,
          text: 'Các mô hợp thành cơ quan (chiếc lá), các cơ quan và hệ cơ quan hợp thành cơ thể.',
        },
        {
          atMs: 9400,
          text: 'Các cá thể cùng loài sống cùng một nơi là quần thể; thêm các loài khác thành quần xã.',
        },
        {
          atMs: 12000,
          text: 'Quần xã cùng môi trường vô sinh là hệ sinh thái; mọi hệ sinh thái hợp thành sinh quyển.',
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
      title: 'Trùng ngưng: nối đơn phân thành chuỗi, mỗi liên kết loại một phân tử nước',
      description:
        'Ba ô "đơn phân" nằm rời nhau, mỗi ô có nhóm H− ở đầu trái và −OH ở đầu phải. Đơn phân thứ hai trượt tới sát đơn phân thứ nhất: nhóm −OH của phân tử này và H của phân tử kia tách ra, ghép thành một phân tử nước (một chấm đỏ là O, hai chấm nhỏ là H) bay về góc "nước bị loại ra", chỗ nối hiện một vạch xanh là liên kết cộng hoá trị. Đơn phân thứ ba nối tiếp đúng như vậy, thêm một phân tử nước nữa. Khung nét đứt gom lại: chuỗi 3 đơn phân có 2 liên kết thì mất đúng 2 H₂O, và chuỗi vẫn giữ H− ở một đầu, −OH ở đầu kia. Cuối cùng một phân tử nước từ ngoài đi vào liên kết thứ hai, liên kết đứt, nhóm H và OH trở lại hai đầu, đơn phân thứ ba rời ra: thuỷ phân chính là phản ứng ngược của trùng ngưng.',
      viewBoxWidth: 560,
      viewBoxHeight: 236,
      durationMs: 12000,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'tieu-de',
          x: 280,
          y: 22,
          text: 'Trùng ngưng: nối thêm mỗi đơn phân là loại ra một phân tử nước',
          size: 14,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'vi-du',
          x: 280,
          y: 42,
          text: 'glucose → tinh bột;  amino acid → protein;  nucleotide → acid nucleic',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'rect',
          id: 'don-phan-1',
          x: 40,
          y: 120,
          w: 90,
          h: 40,
          rx: 10,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 300, opacity: 0 },
            { atMs: 600, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-dp-1',
          x: 85,
          y: 144,
          text: 'đơn phân',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 300, opacity: 0 },
            { atMs: 600, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'don-phan-2',
          x: 230,
          y: 120,
          w: 90,
          h: 40,
          rx: 10,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, opacity: 0 },
            { atMs: 300, dx: 0, opacity: 0 },
            { atMs: 600, dx: 0, opacity: 1 },
            { atMs: 1500, dx: 0, opacity: 1 },
            { atMs: 2600, dx: -76, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-dp-2',
          x: 275,
          y: 144,
          text: 'đơn phân',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, opacity: 0 },
            { atMs: 300, dx: 0, opacity: 0 },
            { atMs: 600, dx: 0, opacity: 1 },
            { atMs: 1500, dx: 0, opacity: 1 },
            { atMs: 2600, dx: -76, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'don-phan-3',
          x: 420,
          y: 120,
          w: 90,
          h: 40,
          rx: 10,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, opacity: 0 },
            { atMs: 300, dx: 0, opacity: 0 },
            { atMs: 600, dx: 0, opacity: 1 },
            { atMs: 4000, dx: 0, opacity: 1 },
            { atMs: 5100, dx: -152, opacity: 1 },
            { atMs: 9600, dx: -152, opacity: 1 },
            { atMs: 10300, dx: -82, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-dp-3',
          x: 465,
          y: 144,
          text: 'đơn phân',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, opacity: 0 },
            { atMs: 300, dx: 0, opacity: 0 },
            { atMs: 600, dx: 0, opacity: 1 },
            { atMs: 4000, dx: 0, opacity: 1 },
            { atMs: 5100, dx: -152, opacity: 1 },
            { atMs: 9600, dx: -152, opacity: 1 },
            { atMs: 10300, dx: -82, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'h-1',
          x: 36,
          y: 144,
          text: 'H−',
          size: 12,
          anchor: 'end',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, dy: 0, opacity: 0 },
            { atMs: 300, dy: 0, opacity: 0 },
            { atMs: 600, dy: 0, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'oh-1',
          x: 134,
          y: 144,
          text: '−OH',
          size: 12,
          anchor: 'start',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, dy: 0, opacity: 0 },
            { atMs: 300, dy: 0, opacity: 0 },
            { atMs: 600, dy: 0, opacity: 1 },
            { atMs: 2400, dy: 0, opacity: 1 },
            { atMs: 2900, dy: -26, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'h-2',
          x: 226,
          y: 144,
          text: 'H−',
          size: 12,
          anchor: 'end',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 0 },
            { atMs: 300, dx: 0, dy: 0, opacity: 0 },
            { atMs: 600, dx: 0, dy: 0, opacity: 1 },
            { atMs: 1500, dx: 0, dy: 0, opacity: 1 },
            { atMs: 2400, dx: -62.2, dy: 0, opacity: 1 },
            { atMs: 2600, dx: -76, dy: -10.4, opacity: 0.6 },
            { atMs: 2900, dx: -76, dy: -26, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'oh-2',
          x: 324,
          y: 144,
          text: '−OH',
          size: 12,
          anchor: 'start',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 0 },
            { atMs: 300, dx: 0, dy: 0, opacity: 0 },
            { atMs: 600, dx: 0, dy: 0, opacity: 1 },
            { atMs: 1500, dx: 0, dy: 0, opacity: 1 },
            { atMs: 2600, dx: -76, dy: 0, opacity: 1 },
            { atMs: 4900, dx: -76, dy: 0, opacity: 1 },
            { atMs: 5400, dx: -76, dy: -26, opacity: 0 },
            { atMs: 9900, dx: -76, dy: -26, opacity: 0 },
            { atMs: 9901, dx: -76, dy: 0, opacity: 0 },
            { atMs: 10300, dx: -76, dy: 0, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'h-3',
          x: 416,
          y: 144,
          text: 'H−',
          size: 12,
          anchor: 'end',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 0 },
            { atMs: 300, dx: 0, dy: 0, opacity: 0 },
            { atMs: 600, dx: 0, dy: 0, opacity: 1 },
            { atMs: 4000, dx: 0, dy: 0, opacity: 1 },
            { atMs: 4900, dx: -124.4, dy: 0, opacity: 1 },
            { atMs: 5100, dx: -152, dy: -10.4, opacity: 0.6 },
            { atMs: 5400, dx: -152, dy: -26, opacity: 0 },
            { atMs: 9600, dx: -152, dy: -26, opacity: 0 },
            { atMs: 9900, dx: -122, dy: -26, opacity: 0 },
            { atMs: 9901, dx: -121.9, dy: 0, opacity: 0 },
            { atMs: 10300, dx: -82, dy: 0, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'oh-3',
          x: 514,
          y: 144,
          text: '−OH',
          size: 12,
          anchor: 'start',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 0 },
            { atMs: 300, dx: 0, dy: 0, opacity: 0 },
            { atMs: 600, dx: 0, dy: 0, opacity: 1 },
            { atMs: 4000, dx: 0, dy: 0, opacity: 1 },
            { atMs: 5100, dx: -152, dy: 0, opacity: 1 },
            { atMs: 9600, dx: -152, dy: 0, opacity: 1 },
            { atMs: 10300, dx: -82, dy: 0, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'lien-ket-1',
          x1: 130,
          y1: 140,
          x2: 154,
          y2: 140,
          stroke: 'correct',
          strokeWidth: 5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2800, opacity: 0 },
            { atMs: 3100, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-lk-1',
          x: 142,
          y: 178,
          text: 'liên kết',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2800, opacity: 0 },
            { atMs: 3100, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'lien-ket-2',
          x1: 244,
          y1: 140,
          x2: 268,
          y2: 140,
          stroke: 'correct',
          strokeWidth: 5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5300, opacity: 0 },
            { atMs: 5600, opacity: 1 },
            { atMs: 9600, opacity: 1 },
            { atMs: 9900, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-lk-2',
          x: 256,
          y: 178,
          text: 'liên kết',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5300, opacity: 0 },
            { atMs: 5600, opacity: 1 },
            { atMs: 9600, opacity: 1 },
            { atMs: 9900, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'nuoc-1-o',
          cx: 142,
          cy: 92,
          r: 8,
          fill: 'danger',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 0, dy: 0 },
            { atMs: 2700, opacity: 0, dx: 0, dy: 0 },
            { atMs: 3000, opacity: 1, dx: 0, dy: 0 },
            { atMs: 3500, opacity: 1, dx: 0, dy: 0 },
            { atMs: 4400, opacity: 1, dx: 352, dy: -18 },
          ],
        },
        {
          kind: 'circle',
          id: 'nuoc-1-h1',
          cx: 133,
          cy: 99,
          r: 5,
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 0, dy: 0 },
            { atMs: 2700, opacity: 0, dx: 0, dy: 0 },
            { atMs: 3000, opacity: 1, dx: 0, dy: 0 },
            { atMs: 3500, opacity: 1, dx: 0, dy: 0 },
            { atMs: 4400, opacity: 1, dx: 352, dy: -18 },
          ],
        },
        {
          kind: 'circle',
          id: 'nuoc-1-h2',
          cx: 151,
          cy: 99,
          r: 5,
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 0, dy: 0 },
            { atMs: 2700, opacity: 0, dx: 0, dy: 0 },
            { atMs: 3000, opacity: 1, dx: 0, dy: 0 },
            { atMs: 3500, opacity: 1, dx: 0, dy: 0 },
            { atMs: 4400, opacity: 1, dx: 352, dy: -18 },
          ],
        },
        {
          kind: 'label',
          id: 'nuoc-1-lb',
          x: 159,
          y: 97,
          text: 'H₂O',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 0, dy: 0 },
            { atMs: 2700, opacity: 0, dx: 0, dy: 0 },
            { atMs: 3000, opacity: 1, dx: 0, dy: 0 },
            { atMs: 3500, opacity: 1, dx: 0, dy: 0 },
            { atMs: 4400, opacity: 1, dx: 352, dy: -18 },
          ],
        },
        {
          kind: 'circle',
          id: 'nuoc-2-o',
          cx: 256,
          cy: 92,
          r: 8,
          fill: 'danger',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 0, dy: 0 },
            { atMs: 5200, opacity: 0, dx: 0, dy: 0 },
            { atMs: 5500, opacity: 1, dx: 0, dy: 0 },
            { atMs: 6000, opacity: 1, dx: 0, dy: 0 },
            { atMs: 6900, opacity: 1, dx: 174, dy: -18 },
          ],
        },
        {
          kind: 'circle',
          id: 'nuoc-2-h1',
          cx: 247,
          cy: 99,
          r: 5,
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 0, dy: 0 },
            { atMs: 5200, opacity: 0, dx: 0, dy: 0 },
            { atMs: 5500, opacity: 1, dx: 0, dy: 0 },
            { atMs: 6000, opacity: 1, dx: 0, dy: 0 },
            { atMs: 6900, opacity: 1, dx: 174, dy: -18 },
          ],
        },
        {
          kind: 'circle',
          id: 'nuoc-2-h2',
          cx: 265,
          cy: 99,
          r: 5,
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 0, dy: 0 },
            { atMs: 5200, opacity: 0, dx: 0, dy: 0 },
            { atMs: 5500, opacity: 1, dx: 0, dy: 0 },
            { atMs: 6000, opacity: 1, dx: 0, dy: 0 },
            { atMs: 6900, opacity: 1, dx: 174, dy: -18 },
          ],
        },
        {
          kind: 'label',
          id: 'nuoc-2-lb',
          x: 273,
          y: 97,
          text: 'H₂O',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dx: 0, dy: 0 },
            { atMs: 5200, opacity: 0, dx: 0, dy: 0 },
            { atMs: 5500, opacity: 1, dx: 0, dy: 0 },
            { atMs: 6000, opacity: 1, dx: 0, dy: 0 },
            { atMs: 6900, opacity: 1, dx: 174, dy: -18 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-kho',
          x: 470,
          y: 60,
          text: 'nước bị loại ra',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4200, opacity: 0 },
            { atMs: 4500, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'khung-chuoi',
          x: 8,
          y: 106,
          w: 394,
          h: 88,
          rx: 12,
          stroke: 'primary',
          strokeWidth: 1.5,
          dash: '5 4',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 6800, opacity: 0 },
            { atMs: 7100, opacity: 1 },
            { atMs: 8100, opacity: 1 },
            { atMs: 8400, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-chuoi',
          x: 200,
          y: 222,
          text: 'Chuỗi đa phân: 3 đơn phân, 2 liên kết, mất 2 H₂O',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 6800, opacity: 0 },
            { atMs: 7100, opacity: 1 },
            { atMs: 8100, opacity: 1 },
            { atMs: 8400, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'nuoc-3-o',
          cx: 256,
          cy: 64,
          r: 8,
          fill: 'danger',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dy: 0 },
            { atMs: 8400, opacity: 0, dy: 0 },
            { atMs: 8700, opacity: 1, dy: 0 },
            { atMs: 9400, opacity: 1, dy: 28 },
            { atMs: 9600, opacity: 1, dy: 28 },
            { atMs: 9900, opacity: 0, dy: 28 },
          ],
        },
        {
          kind: 'circle',
          id: 'nuoc-3-h1',
          cx: 247,
          cy: 71,
          r: 5,
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dy: 0 },
            { atMs: 8400, opacity: 0, dy: 0 },
            { atMs: 8700, opacity: 1, dy: 0 },
            { atMs: 9400, opacity: 1, dy: 28 },
            { atMs: 9600, opacity: 1, dy: 28 },
            { atMs: 9900, opacity: 0, dy: 28 },
          ],
        },
        {
          kind: 'circle',
          id: 'nuoc-3-h2',
          cx: 265,
          cy: 71,
          r: 5,
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dy: 0 },
            { atMs: 8400, opacity: 0, dy: 0 },
            { atMs: 8700, opacity: 1, dy: 0 },
            { atMs: 9400, opacity: 1, dy: 28 },
            { atMs: 9600, opacity: 1, dy: 28 },
            { atMs: 9900, opacity: 0, dy: 28 },
          ],
        },
        {
          kind: 'label',
          id: 'nuoc-3-lb',
          x: 273,
          y: 69,
          text: '+ H₂O',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0, dy: 0 },
            { atMs: 8400, opacity: 0, dy: 0 },
            { atMs: 8700, opacity: 1, dy: 0 },
            { atMs: 9400, opacity: 1, dy: 28 },
            { atMs: 9600, opacity: 1, dy: 28 },
            { atMs: 9900, opacity: 0, dy: 28 },
          ],
        },
        {
          kind: 'label',
          id: 'lb-thuy-phan',
          x: 200,
          y: 222,
          text: 'Thuỷ phân: cộng nước vào thì liên kết đứt',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 8400, opacity: 0 },
            { atMs: 8700, opacity: 1 },
          ],
        },
      ],
      captions: [
        { atMs: 300, text: 'Các đơn phân rời: mỗi phân tử có nhóm H− ở một đầu và −OH ở đầu kia.' },
        {
          atMs: 1500,
          text: 'Hai đơn phân ghép lại: −OH của phân tử này gặp H của phân tử kia, tách ra một phân tử nước.',
        },
        { atMs: 4000, text: 'Nối thêm đơn phân thứ ba, lại loại ra thêm đúng một phân tử nước.' },
        {
          atMs: 6800,
          text: 'Chuỗi đa phân: n đơn phân nối bằng n − 1 liên kết thì mất n − 1 phân tử nước.',
        },
        {
          atMs: 8400,
          text: 'Thuỷ phân là phản ứng ngược: cộng nước vào thì liên kết đứt, đơn phân tách ra.',
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
