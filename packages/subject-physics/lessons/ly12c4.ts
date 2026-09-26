// lessons/ly12c4.ts — Vật lí 12, Chương 4: Vật lí hạt nhân (6 bài).
import type { PhysicsLesson } from '../lessonTypes.js'
import { donViHienThi } from '@dhcb/core-grading/units'

export const LY12_C4_LESSONS: PhysicsLesson[] = [
  {
    id: 'ly12-c4-b20',
    // Tỉ lệ 1 : 100 000 giữa hạt nhân và nguyên tử là thứ KHÔNG cảm được bằng con số; cảnh phóng
    // to dần từ chấm mờ thành cụm nuclêôn mới làm nó hiện ra.
    animation: {
      title: 'Phóng to vào tâm nguyên tử để thấy hạt nhân',
      description:
        'Cảnh mở ra với một nguyên tử: vòng nét đứt rộng là vùng đám mây electron, ba chấm nhỏ chạy trên đó là các electron, còn ở chính giữa chỉ có một chấm bé xíu gần như không nhìn thấy — đó là hạt nhân. Rồi chấm ấy được phóng to dần lên 20 lần, và bên trong hiện ra từng hạt: ba prôtôn mang điện dương, rồi bốn nơtron không mang điện, cộng lại thành bảy nuclêôn — đúng hạt nhân liti ⁷₃Li với Z = 3, N = 4, A = 7. Con số mà hình động muốn người học cảm được: bán kính nguyên tử cỡ 10⁻¹⁰ m còn bán kính hạt nhân chỉ cỡ 10⁻¹⁴ m, nhỏ hơn khoảng một trăm nghìn lần, nên nguyên tử gần như rỗng. Vậy mà hầu hết khối lượng lại dồn vào đúng chấm tí hon ấy, vì electron nhẹ hơn nuclêôn gần 2000 lần. Cần nói rõ: tỉ lệ trong hình không thể vẽ đúng thật, hạt nhân đã được cố ý phóng to lên rất nhiều.',
      viewBoxWidth: 560,
      viewBoxHeight: 320,
      durationMs: 7000,
      loop: true,
      shapes: [
        {
          kind: 'circle',
          id: 'may-electron',
          cx: 200,
          cy: 150,
          r: 108,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '6 5',
        },
        {
          kind: 'label',
          id: 'nhan-nguyen-tu',
          x: 200,
          y: 32,
          text: 'NGUYÊN TỬ — bán kính cỡ 10⁻¹⁰ m',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'circle',
          id: 'e-1',
          cx: 308,
          cy: 150,
          r: 6,
          fill: 'accent',
        },
        {
          kind: 'circle',
          id: 'e-2',
          cx: 124,
          cy: 74,
          r: 6,
          fill: 'accent',
        },
        {
          kind: 'circle',
          id: 'e-3',
          cx: 124,
          cy: 226,
          r: 6,
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'nhan-e',
          x: 114,
          y: 70,
          text: 'electron',
          size: 12,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'circle',
          id: 'hat-nhan',
          cx: 200,
          cy: 150,
          r: 2.4,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              scale: 1,
            },
            {
              atMs: 900,
              scale: 1,
            },
            {
              atMs: 2600,
              scale: 20,
            },
            {
              atMs: 7000,
              scale: 20,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-hn',
          x: 200,
          y: 212,
          text: 'hạt nhân',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2599,
              opacity: 0,
            },
            {
              atMs: 2900,
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
          id: 'nhan-hn-2',
          x: 200,
          y: 228,
          text: 'bán kính cỡ 10⁻¹⁴ m',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2599,
              opacity: 0,
            },
            {
              atMs: 2900,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'proton-0',
          cx: 184,
          cy: 140,
          r: 9,
          fill: 'danger',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3199,
              opacity: 0,
            },
            {
              atMs: 3500,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'proton-1',
          cx: 214,
          cy: 134,
          r: 9,
          fill: 'danger',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3399,
              opacity: 0,
            },
            {
              atMs: 3700,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'proton-2',
          cx: 202,
          cy: 166,
          r: 9,
          fill: 'danger',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3599,
              opacity: 0,
            },
            {
              atMs: 3900,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'notron-0',
          cx: 196,
          cy: 128,
          r: 9,
          fill: 'neutral',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3999,
              opacity: 0,
            },
            {
              atMs: 4300,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'notron-1',
          cx: 180,
          cy: 162,
          r: 9,
          fill: 'neutral',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4199,
              opacity: 0,
            },
            {
              atMs: 4500,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'notron-2',
          cx: 220,
          cy: 158,
          r: 9,
          fill: 'neutral',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4399,
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
          kind: 'circle',
          id: 'notron-3',
          cx: 216,
          cy: 174,
          r: 9,
          fill: 'neutral',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4599,
              opacity: 0,
            },
            {
              atMs: 4900,
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
          id: 'chu-thich-p',
          x: 340,
          y: 96,
          text: 'prôtôn: mang điện +e, có Z hạt',
          size: 12,
          anchor: 'start',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3199,
              opacity: 0,
            },
            {
              atMs: 3500,
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
          id: 'chu-thich-n',
          x: 340,
          y: 118,
          text: 'nơtron: không mang điện',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3999,
              opacity: 0,
            },
            {
              atMs: 4300,
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
          id: 'ky-hieu',
          x: 340,
          y: 152,
          text: 'Ký hiệu ᴬ𝗓X: A = Z + N',
          size: 13,
          anchor: 'start',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4999,
              opacity: 0,
            },
            {
              atMs: 5300,
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
          id: 'vi-du',
          x: 340,
          y: 176,
          text: 'Ví dụ ⁷₃Li: 3 prôtôn + 4 nơtron',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4999,
              opacity: 0,
            },
            {
              atMs: 5300,
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
          id: 'vi-du-2',
          x: 340,
          y: 193,
          text: '= 7 nuclêôn',
          size: 12,
          anchor: 'start',
          fill: 'neutral',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4999,
              opacity: 0,
            },
            {
              atMs: 5300,
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
          id: 'ti-le',
          x: 280,
          y: 288,
          text: 'Hình đã PHÓNG TO hạt nhân 20 lần cho dễ nhìn. Thật ra bán kính hạt nhân',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'ti-le-2',
          x: 280,
          y: 304,
          text: 'nhỏ hơn nguyên tử khoảng 100 000 lần — nguyên tử gần như rỗng hoàn toàn',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
      ],
      captions: [
        {
          atMs: 200,
          text: 'Nguyên tử: đám mây electron rộng, giữa là một chấm rất nhỏ.',
        },
        {
          atMs: 1400,
          text: 'Phóng to chấm ở giữa — đó là hạt nhân.',
        },
        {
          atMs: 3200,
          text: 'Bên trong có các prôtôn mang điện dương…',
        },
        {
          atMs: 4000,
          text: '…và các nơtron không mang điện. Cả hai gọi chung là nuclêôn.',
        },
        {
          atMs: 5000,
          text: 'Ví dụ ⁷₃Li: Z = 3 prôtôn, N = 4 nơtron, A = 7.',
        },
      ],
    },
    grade: '12',
    chapterNumber: 4,
    chapterTitle: 'Vật lí hạt nhân',
    lessonNumber: 20,
    title: 'Khái niệm sơ lược về hạt nhân. Cấu trúc hạt nhân',
    hook: 'Tại tâm của mỗi nguyên tử có một hạt nhân vô cùng nhỏ bé và đậm đặc, chiếm tới hơn 99.9% khối lượng nguyên tử nhưng kích thước chỉ bằng một phần một trăm nghìn kích thước nguyên tử.',
    theory:
      'KÍCH THƯỚC HẠT NHÂN:\n' +
      '— Hạt nhân nguyên tử có kích thước rất nhỏ so với kích thước nguyên tử (nhỏ hơn khoảng 10⁵ lần).\n' +
      '— Bán kính hạt nhân R được ước lượng phụ thuộc vào số khối A theo công thức: R ≈ 1.2 * 10⁻¹⁵ * A^(1/3) (m).\n\n' +
      'CẤU TẠO HẠT NHÂN:\n' +
      '— Hạt nhân được cấu tạo từ các hạt nucleon, gồm hai loại:\n' +
      '  1. Proton (ký hiệu là p): mang điện tích dương +e (e ≈ 1.6 * 10⁻¹⁹ C), khối lượng mp ≈ 1.00728 amu.\n' +
      '  2. Neutron (ký hiệu là n): không mang điện, khối lượng mn ≈ 1.00866 amu.\n' +
      '— Kí hiệu hạt nhân: _Z^A X\n' +
      '  + X: tên nguyên tố.\n' +
      '  + Z: số hiệu nguyên tử (số proton, số điện tích hạt nhân, số thứ tự trong bảng tuần hoàn).\n' +
      '  + A: số khối (tổng số nucleon).\n' +
      '— Số neutron trong hạt nhân là N = A - Z.\n\n' +
      'ĐỒNG VỊ:\n' +
      '— Các hạt nhân của cùng một nguyên tố có cùng số proton Z nhưng khác nhau số neutron N (dẫn đến số khối A khác nhau) gọi là các đồng vị.\n' +
      '— Ví dụ: Hiđrô có 3 đồng vị là Hiđrô thường _1^1 H, Đơteri _1^2 H (kí hiệu là D) và Triti _1^3 H (kí hiệu là T).',
    workedExample: {
      problem:
        'Xác định số proton và số neutron của các hạt nhân sau: hạt nhân Cacbon _6^{14}C và hạt nhân Urani _{92}^{235}U.',
      steps: [
        'Dùng kí hiệu chuẩn _Z^A X để đọc các chỉ số.',
        'Với Cacbon _6^{14}C: chỉ số dưới Z = 6 => số proton = 6; chỉ số trên A = 14 => số neutron N = 14 - 6 = 8.',
        'Với Urani _{92}^{235}U: chỉ số dưới Z = 92 => số proton = 92; chỉ số trên A = 235 => số neutron N = 235 - 92 = 143.',
      ],
      answer: 'Cacbon-14: 6p, 8n. Urani-235: 92p, 143n.',
    },
    checkQuestions: [
      {
        prompt: 'Trong kí hiệu hạt nhân _Z^A X, số neutron được xác định bằng công thức:',
        choices: [
          { id: 'n_1', label: 'A - Z' },
          { id: 'n_2', label: 'A + Z' },
          { id: 'n_3', label: 'Z' },
          { id: 'n_4', label: 'A' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['n_1'],
        },
        explain: 'Số khối A bằng tổng số proton Z và số neutron N. Do đó N = A - Z.',
      },
      {
        prompt: 'Hạt nhân nguyên tử Urani _92^238 U có số proton là bao nhiêu?',
        answer: {
          kind: 'numeric',
          value: 92,
        },
        explain:
          'Chỉ số dưới Z = 92 đại diện cho số proton của hạt nhân. Ký hiệu chuẩn là ᴬ_Z X: chỉ số trên A là số khối (proton + neutron), chỉ số dưới Z là số proton — đừng nhầm hai số này.',
      },
    ],
    srsCards: [
      {
        hoi: 'Nucleon gồm những hạt nào?',
        dap: 'Gồm proton (mang điện +e) và neutron (không mang điện).',
      },
      {
        hoi: 'Đồng vị là gì?',
        dap: 'Các hạt nhân của cùng một nguyên tố có cùng số proton Z nhưng khác nhau số neutron N.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly12-c4-b21',
    // Vì sao CẢ HAI chiều đều toả năng lượng chỉ sáng tỏ khi nhìn hai mũi tên cùng chỉ vào một
    // đỉnh trên đồ thị Wlk/A — công thức ΔE = Δm·c² không cho thấy điều đó.
    animation: {
      title: 'Đường cong năng lượng liên kết riêng và cái đỉnh ở sắt',
      description:
        'Trục ngang là số khối A, trục đứng là năng lượng liên kết riêng Wlk/A tính bằng MeV cho mỗi nuclêôn — con số đo độ bền vững của hạt nhân. Chấm sáng chạy dọc đường cong từ trái sang phải: khởi đầu rất thấp ở đơteri (A = 2, chỉ 1,1 MeV), vọt lên ở heli-4 (7,07 MeV), leo tiếp qua cacbon và oxi, đạt ĐỈNH khoảng 8,8 MeV quanh vùng sắt Fe-56, rồi thoai thoải đi xuống còn 7,6 MeV ở urani-238. Hai mũi tên xuất hiện sau đó chỉ vào cùng một đỉnh từ hai phía: bên trái là nhiệt hạch (hạt nhẹ ghép lại), bên phải là phân hạch (hạt nặng vỡ ra). Đây là kết luận lớn của cả chương mà một câu văn khó làm người học tin: hai quá trình NGƯỢC NHAU lại cùng toả năng lượng, vì cả hai đều đưa hệ tiến về phía đỉnh — nơi mỗi nuclêôn liên kết chặt hơn — và phần chênh lệch ấy được giải phóng.',
      viewBoxWidth: 450,
      viewBoxHeight: 280,
      durationMs: 7000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'truc-x',
          x1: 55,
          y1: 210,
          x2: 425,
          y2: 210,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'truc-y',
          x1: 60,
          y1: 222,
          x2: 60,
          y2: 35,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'ten-x',
          x: 425,
          y: 228,
          text: 'số khối A',
          size: 12,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'ten-y',
          x: 66,
          y: 32,
          text: 'Wlk/A (MeV/nuclêôn)',
          size: 12,
          anchor: 'start',
          fill: 'muted',
        },
        {
          kind: 'polyline',
          id: 'duong-cong',
          points: [
            [63, 191],
            [64, 161],
            [66, 87],
            [69, 117],
            [70, 113],
            [73, 98],
            [77, 77],
            [83, 71],
            [94, 69],
            [118, 61],
            [142, 57],
            [177, 59],
            [235, 62],
            [293, 68],
            [352, 73],
            [407, 79],
          ],
          stroke: 'primary',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'dinh',
          x1: 142,
          y1: 210,
          x2: 142,
          y2: 57,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '4 3',
        },
        {
          kind: 'label',
          id: 'nhan-fe',
          x: 142,
          y: 226,
          text: 'Fe-56',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-dinh',
          x: 148,
          y: 45,
          text: 'đỉnh ≈ 8,8 MeV — bền vững nhất',
          size: 12,
          anchor: 'start',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2599,
              opacity: 0,
            },
            {
              atMs: 2900,
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
          id: 'nhan-he',
          x: 82,
          y: 100,
          text: 'He-4',
          size: 11,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-u',
          x: 401,
          y: 69,
          text: 'U-238',
          size: 11,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'circle',
          id: 'cham',
          cx: 63,
          cy: 191,
          r: 6,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 400,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 600,
              dx: 1,
              dy: -30,
            },
            {
              atMs: 800,
              dx: 3,
              dy: -104,
            },
            {
              atMs: 1000,
              dx: 6,
              dy: -74,
            },
            {
              atMs: 1200,
              dx: 7,
              dy: -78,
            },
            {
              atMs: 1400,
              dx: 10,
              dy: -93,
            },
            {
              atMs: 1600,
              dx: 14,
              dy: -114,
            },
            {
              atMs: 1800,
              dx: 20,
              dy: -120,
            },
            {
              atMs: 2000,
              dx: 31,
              dy: -122,
            },
            {
              atMs: 2200,
              dx: 55,
              dy: -130,
            },
            {
              atMs: 2400,
              dx: 79,
              dy: -134,
            },
            {
              atMs: 2600,
              dx: 114,
              dy: -132,
            },
            {
              atMs: 2800,
              dx: 172,
              dy: -129,
            },
            {
              atMs: 3000,
              dx: 230,
              dy: -123,
            },
            {
              atMs: 3200,
              dx: 289,
              dy: -118,
            },
            {
              atMs: 3400,
              dx: 344,
              dy: -112,
            },
            {
              atMs: 7000,
              dx: 344,
              dy: -112,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt-nhiet-hach',
          x1: 80,
          y1: 170,
          x2: 125,
          y2: 78,
          stroke: 'correct',
          strokeWidth: 3,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4199,
              opacity: 0,
            },
            {
              atMs: 4500,
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
          id: 'nhan-nhiet-hach',
          x: 150,
          y: 138,
          text: 'NHIỆT HẠCH: hạt nhẹ ghép lại, leo lên đỉnh',
          size: 12,
          anchor: 'start',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4199,
              opacity: 0,
            },
            {
              atMs: 4500,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt-phan-hach',
          x1: 395,
          y1: 90,
          x2: 235,
          y2: 68,
          stroke: 'correct',
          strokeWidth: 3,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5399,
              opacity: 0,
            },
            {
              atMs: 5700,
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
          id: 'nhan-phan-hach',
          x: 150,
          y: 116,
          text: 'PHÂN HẠCH: hạt nặng vỡ ra, cũng leo lên đỉnh',
          size: 12,
          anchor: 'start',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5399,
              opacity: 0,
            },
            {
              atMs: 5700,
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
          id: 'kl',
          x: 240,
          y: 250,
          text: 'Đi về phía đỉnh theo hướng nào cũng làm năng lượng liên kết riêng TĂNG,',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'kl2',
          x: 240,
          y: 266,
          text: 'phần chênh lệch được toả ra — đó là năng lượng hạt nhân',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
      ],
      captions: [
        {
          atMs: 400,
          text: 'Chấm chạy theo đường cong Wlk/A từ hạt nhẹ sang hạt nặng.',
        },
        {
          atMs: 2600,
          text: 'Đỉnh nằm quanh Fe-56 với khoảng 8,8 MeV mỗi nuclêôn.',
        },
        {
          atMs: 4200,
          text: 'Hạt nhẹ ghép lại (nhiệt hạch) thì leo lên đỉnh → toả năng lượng.',
        },
        {
          atMs: 5400,
          text: 'Hạt nặng vỡ ra (phân hạch) cũng leo lên đỉnh → cũng toả năng lượng.',
        },
      ],
    },
    grade: '12',
    chapterNumber: 4,
    chapterTitle: 'Vật lí hạt nhân',
    lessonNumber: 21,
    title: 'Lực hạt nhân. Năng lượng liên kết hạt nhân',
    hook: 'Các hạt proton trong hạt nhân đều mang điện tích dương và đẩy nhau bằng một lực tĩnh điện cực mạnh. Lực nào đã thắng lực đẩy này để giữ chúng liên kết chặt chẽ trong hạt nhân? Đó là lực hạt nhân.',
    theory:
      'LỰC HẠT NHÂN (LỰC TƯƠNG TÁC MẠNH):\n' +
      '— Lực hạt nhân: Là lực hút gắn kết các nucleon trong hạt nhân để tạo thành một cấu trúc bền vững.\n' +
      '— Đặc điểm:\n' +
      '  + Không có cùng bản chất với lực tĩnh điện hay lực hấp dẫn.\n  + Là lực tầm ngắn: chỉ có tác dụng trong phạm vi cỡ kích thước hạt nhân (khoảng 10⁻¹⁵ m), ra xa hơn là gần như không còn.\n  + Không phụ thuộc vào điện tích của nucleon (lực hút giữa p-p, n-n, p-n có độ lớn như nhau).\n\n' +
      'ĐỘ HỤT KHỐI (delta m):\n' +
      '— Khối lượng của một hạt nhân luôn nhỏ hơn tổng khối lượng của các nucleon cấu tạo nên nó một lượng là delta m:\n' +
      '  dm = [Z * mp + (A - Z) * mn] - m_hn > 0\n\n' +
      'NĂNG LƯỢNG LIÊN KẾT (Elk):\n' +
      '— Năng lượng liên kết: Là năng lượng toả ra khi các nucleon liên kết lại với nhau tạo thành hạt nhân, hoặc năng lượng tối thiểu cần cung cấp để tách hạt nhân thành các nucleon riêng rẽ.\n' +
      '  Elk = dm * c²\n' +
      '— Nếu dm tính bằng đơn vị amu thì Elk = dm * 931.5 (MeV) (với 1 amu * c² ≈ 931.5 MeV).\n\n' +
      'NĂNG LƯỢNG LIÊN KẾT RIÊNG (Elkr):\n' +
      '— Năng lượng liên kết riêng: Là năng lượng liên kết tính trên một nucleon:\n' +
      '  Elkr = Elk / A\n' +
      '— Năng lượng liên kết riêng đặc trưng cho mức độ bền vững của hạt nhân. Hạt nhân có năng lượng liên kết riêng càng lớn thì càng bền vững (các hạt nhân bền vững nhất ở giữa bảng tuần hoàn có 50 < A < 80, ví dụ Fe-56).',
    workedExample: {
      problem:
        'Tính năng lượng liên kết của hạt nhân Heli _2^4 He. Biết khối lượng hạt nhân Heli là 4.0015 amu, khối lượng proton là 1.00728 amu, khối lượng neutron là 1.00866 amu và 1 amu.c² = 931.5 MeV.',
      steps: [
        'Tính độ hụt khối delta m: dm = [2 * mp + 2 * mn] - m_He = [2 * 1.00728 + 2 * 1.00866] - 4.0015.',
        'Tính toán độ hụt khối: dm = 2.01456 + 2.01732 - 4.0015 = 0.03038 amu.',
        'Tính năng lượng liên kết Elk: Elk = dm * 931.5 = 0.03038 * 931.5.',
        'Kết quả: Elk ≈ 28.3 MeV.',
      ],
      answer: 'Elk = 28.3 MeV.',
    },
    checkQuestions: [
      {
        prompt: 'Đại lượng nào sau đây quyết định mức độ bền vững của một hạt nhân nguyên tử?',
        choices: [
          { id: 'bv_1', label: 'Năng lượng liên kết riêng' },
          { id: 'bv_2', label: 'Năng lượng liên kết' },
          { id: 'bv_3', label: 'Độ hụt khối' },
          { id: 'bv_4', label: 'Số lượng neutron trong hạt nhân' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['bv_1'],
        },
        explain:
          'Hạt nhân có năng lượng liên kết riêng (năng lượng liên kết chia cho số khối A) càng lớn thì hạt nhân đó càng bền vững.',
      },
      {
        prompt:
          'Tính độ hụt khối (theo đơn vị amu) của hạt nhân Heli _2^4He biết khối lượng hạt nhân Heli là 4.0015 amu, ' +
          'khối lượng proton mp = 1.00728 amu, khối lượng neutron mn = 1.00866 amu.',
        answer: {
          kind: 'numeric',
          value: donViHienThi(0.03038, 'amu'),
          unit: 'amu',
        },
        explain: 'dm = 2 * mp + 2 * mn - m_He = 2 * 1.00728 + 2 * 1.00866 - 4.0015 = 0.03038 amu.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phạm vi tác dụng của lực hạt nhân?',
        dap: 'Ngắn, chỉ khoảng kích thước hạt nhân (10^-15 m).',
      },
      {
        hoi: 'Năng lượng liên kết riêng đặc trưng cho điều gì của hạt nhân?',
        dap: 'Mức độ bền vững của hạt nhân.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly12-c4-b22',
    // Phản ứng hạt nhân là quá trình NHIỀU BƯỚC CÓ THỨ TỰ (bắn → hợp phần → vỡ); hai phép đếm
    // A và Z chỉ có nghĩa khi gắn với từng bước đó.
    animation: {
      title: 'Phản ứng hạt nhân: đếm lại A và Z ở hai vế',
      description:
        'Một hạt anpha ⁴₂He bay từ trái sang, đâm vào hạt nhân nitơ ¹⁴₇N đứng yên. Hai hạt nhập lại thành một hạt nhân hợp phần rất kém bền (khối đỏ ở giữa), tồn tại chớp nhoáng rồi vỡ ra: hạt nhân oxi ¹⁷₈O bay chếch lên và một prôtôn ¹₁H bay chếch xuống — đúng thí nghiệm Rutherford năm 1919. Sau đó bốn dòng kiểm tra hiện lần lượt: số khối 4 + 14 = 18 = 17 + 1; điện tích 2 + 7 = 9 = 8 + 1 — công cụ để tìm hạt còn thiếu trong mọi phương trình phản ứng hạt nhân. Phản ứng bảo toàn A và Z nhưng KHÔNG bảo toàn khối lượng nghỉ: ΔE = (m trước − m sau)·c². Riêng phản ứng này, tổng khối lượng sau LỚN hơn trước khoảng 0,0013 u nên nó THU khoảng 1,2 MeV, lấy từ động năng của hạt anpha.',
      viewBoxWidth: 460,
      viewBoxHeight: 302,
      durationMs: 7000,
      loop: true,
      shapes: [
        {
          kind: 'circle',
          id: 'alpha',
          cx: 70,
          cy: 130,
          r: 16,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
            },
            {
              atMs: 400,
              dx: 0,
            },
            {
              atMs: 2000,
              dx: 96,
            },
            {
              atMs: 2400,
              opacity: 0,
            },
            {
              atMs: 7000,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-alpha',
          x: 70,
          y: 100,
          text: '⁴₂He',
          size: 14,
          anchor: 'middle',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
            },
            {
              atMs: 400,
              dx: 0,
            },
            {
              atMs: 2000,
              dx: 96,
            },
            {
              atMs: 2400,
              opacity: 0,
            },
            {
              atMs: 7000,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'nito',
          cx: 200,
          cy: 130,
          r: 26,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 1,
            },
            {
              atMs: 2200,
              opacity: 1,
            },
            {
              atMs: 2500,
              opacity: 0,
            },
            {
              atMs: 7000,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-nito',
          x: 200,
          y: 92,
          text: '¹⁴₇N',
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            {
              atMs: 0,
              opacity: 1,
            },
            {
              atMs: 2200,
              opacity: 1,
            },
            {
              atMs: 2500,
              opacity: 0,
            },
            {
              atMs: 7000,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'hop-nhan',
          cx: 200,
          cy: 130,
          r: 30,
          fill: 'danger',
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
              atMs: 2500,
              opacity: 1,
            },
            {
              atMs: 3200,
              opacity: 1,
            },
            {
              atMs: 3400,
              opacity: 0,
            },
            {
              atMs: 7000,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-hop',
          x: 200,
          y: 174,
          text: 'hạt nhân hợp phần (rất kém bền)',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
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
              atMs: 2600,
              opacity: 1,
            },
            {
              atMs: 3200,
              opacity: 1,
            },
            {
              atMs: 3400,
              opacity: 0,
            },
            {
              atMs: 7000,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'oxi',
          cx: 200,
          cy: 130,
          r: 28,
          fill: 'correct',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3400,
              opacity: 0,
            },
            {
              atMs: 3600,
              opacity: 1,
            },
            {
              atMs: 3600,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 5000,
              dx: 100,
              dy: -34,
            },
            {
              atMs: 7000,
              dx: 100,
              dy: -34,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-oxi',
          x: 200,
          y: 130,
          text: '¹⁷₈O',
          size: 14,
          anchor: 'middle',
          fill: 'surface',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3400,
              opacity: 0,
            },
            {
              atMs: 3600,
              opacity: 1,
            },
            {
              atMs: 3600,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 5000,
              dx: 100,
              dy: -34,
            },
            {
              atMs: 7000,
              dx: 100,
              dy: -34,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'proton',
          cx: 200,
          cy: 130,
          r: 11,
          fill: 'accent',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3400, opacity: 0 },
            { atMs: 3600, opacity: 1, dx: 0, dy: 0 },
            { atMs: 5000, dx: 150, dy: 30 },
            { atMs: 7000, dx: 150, dy: 30 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-proton',
          x: 200,
          y: 162,
          text: '¹₁H',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3400, opacity: 0 },
            { atMs: 3600, opacity: 1, dx: 0, dy: 0 },
            { atMs: 5000, dx: 150, dy: 30 },
            { atMs: 7000, dx: 150, dy: 30 },
          ],
        },
        {
          kind: 'label',
          id: 'pt',
          x: 230,
          y: 40,
          text: '⁴₂He + ¹⁴₇N → ¹⁷₈O + ¹₁H',
          size: 17,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'bt-a-trai',
          x: 150,
          y: 224,
          text: 'Số khối A: 4 + 14 = 18',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5199,
              opacity: 0,
            },
            {
              atMs: 5500,
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
          id: 'bt-a-phai',
          x: 340,
          y: 224,
          text: '17 + 1 = 18  ✓',
          size: 13,
          anchor: 'middle',
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5599,
              opacity: 0,
            },
            {
              atMs: 5900,
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
          id: 'bt-z-trai',
          x: 150,
          y: 246,
          text: 'Điện tích Z: 2 + 7 = 9',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5999,
              opacity: 0,
            },
            {
              atMs: 6300,
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
          id: 'bt-z-phai',
          x: 340,
          y: 246,
          text: '8 + 1 = 9  ✓',
          size: 13,
          anchor: 'middle',
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 6399,
              opacity: 0,
            },
            {
              atMs: 6700,
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
          id: 'luu-y',
          x: 230,
          y: 272,
          text: 'Bảo toàn A và Z, KHÔNG bảo toàn khối lượng nghỉ:',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'luu-y-2',
          x: 230,
          y: 290,
          text: 'phản ứng này sản phẩm nặng hơn → THU ≈ 1,2 MeV từ động năng hạt anpha',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
      ],
      captions: [
        {
          atMs: 400,
          text: 'Hạt anpha ⁴₂He bắn vào hạt nhân nitơ ¹⁴₇N đứng yên.',
        },
        {
          atMs: 2500,
          text: 'Hai hạt nhập thành hạt nhân hợp phần kém bền.',
        },
        {
          atMs: 3600,
          text: 'Nó vỡ ra: hạt nhân oxi ¹⁷₈O và một prôtôn ¹₁H bay đi.',
        },
        {
          atMs: 5200,
          text: 'Đếm số khối: 4 + 14 = 18 = 17 + 1.',
        },
        {
          atMs: 6000,
          text: 'Đếm điện tích: 2 + 7 = 9 = 8 + 1. Cả hai đều bảo toàn.',
        },
      ],
    },
    grade: '12',
    chapterNumber: 4,
    chapterTitle: 'Vật lí hạt nhân',
    lessonNumber: 22,
    title: 'Phản ứng hạt nhân. Định luật bảo toàn trong phản ứng hạt nhân',
    hook:
      'Trong các phản ứng hoá học, các nguyên tử chỉ sắp xếp lại liên kết và giữ nguyên bản chất. ' +
      'Nhưng trong phản ứng hạt nhân, các nguyên tố có thể biến đổi hoàn toàn thành các nguyên tố khác, giải phóng nguồn năng lượng khổng lồ.',
    theory:
      'PHÂN LOẠI PHẢN ỨNG HẠT NHÂN:\n' +
      '— Phản ứng tự phát: Quá trình phân rã của một hạt nhân không bền vững tự động biến đổi thành hạt nhân khác (phóng xạ).\n' +
      '— Phản ứng kích thích: Quá trình các hạt nhân tương tác với nhau để biến đổi thành các hạt nhân khác.\n\n' +
      'CÁC ĐỊNH LUẬT BẢO TOÀN TRONG PHẢN ỨNG HẠT NHÂN:\n' +
      'Xét phản ứng: _Z1^A1 A + _Z2^A2 B -> _Z3^A3 C + _Z4^A4 D\n' +
      '— Định luật bảo toàn số khối (số nucleon): A1 + A2 = A3 + A4\n' +
      '— Định luật bảo toàn điện tích (số hiệu Z): Z1 + Z2 = Z3 + Z4\n' +
      '— Định luật bảo toàn động lượng: p_A + p_B = p_C + p_D\n' +
      '— Định luật bảo toàn năng lượng toàn phần.\n' +
      '— Chú ý: Không có định luật bảo toàn khối lượng nghỉ, không bảo toàn số hạt proton hay neutron riêng rẽ.\n\n' +
      'NĂNG LƯỢNG PHẢN ỨNG HẠT NHÂN (delta E):\n' +
      '  dE = (m_truoc - m_sau) * c²\n' +
      '— dE > 0: Phản ứng toả năng lượng.\n' +
      '— dE < 0: Phản ứng thu năng lượng.',
    workedExample: {
      problem:
        'Hoàn thành phương trình phản ứng hạt nhân sau và xác định số proton Z, số khối A của hạt nhân X:\n' +
        '_2^4 He + _7^{14} N -> _1^1 H + _Z^A X',
      steps: [
        'Áp dụng định luật bảo toàn số khối A: 4 + 14 = 1 + A => A = 17.',
        'Áp dụng định luật bảo toàn điện tích Z: 2 + 7 = 1 + Z => Z = 8.',
        'Xác định nguyên tố: Z = 8 tương ứng với Oxi (O).',
        'Kết quả: Hạt nhân X là đồng vị Oxi-17 (_8^{17}O).',
      ],
      answer: 'Z = 8, A = 17, X là Oxi (O).',
    },
    checkQuestions: [
      {
        prompt: 'Đại lượng nào sau đây KHÔNG được bảo toàn trong các phản ứng hạt nhân?',
        choices: [
          { id: 'bt_1', label: 'Tổng khối lượng nghỉ của hệ' },
          { id: 'bt_2', label: 'Tổng điện tích của hệ' },
          { id: 'bt_3', label: 'Tổng số nucleon (số khối)' },
          { id: 'bt_4', label: 'Tổng động lượng của hệ' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['bt_1'],
        },
        explain:
          'Khối lượng nghỉ không được bảo toàn. Hiệu số khối lượng nghỉ trước và sau phản ứng quyết định năng lượng toả ra hay thu vào.',
      },
      {
        prompt:
          'Trong phản ứng hạt nhân: _0^1 n + _92^235 U -> _38^94 Sr + _Z^A Xe + 2 _0^1 n, ' +
          'số khối A của hạt nhân Xenon (Xe) bằng bao nhiêu?',
        answer: {
          kind: 'numeric',
          value: 140,
        },
        explain:
          'Bảo toàn số khối: 1 + 235 = 94 + A + 2 * 1 => 236 = 96 + A => A = 236 - 96 = 140.',
      },
    ],
    srsCards: [
      {
        hoi: 'Nêu 4 định luật bảo toàn trong phản ứng hạt nhân?',
        dap: 'Bảo toàn số khối, điện tích, động lượng và năng lượng toàn phần.',
      },
      {
        hoi: 'Phản ứng hạt nhân có bảo toàn khối lượng nghỉ không?',
        dap: 'Không bảo toàn khối lượng nghỉ.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly12-c4-b23',
    // Đồ thị phân rã + đám hạt nhân tắt dần: cho thấy chu kì bán rã là "cứ mỗi T thì còn một nửa",
    // chứ không phải "sau 2T thì hết sạch".
    animation: {
      title: 'Chu kì bán rã: cứ sau mỗi T lại còn đúng một nửa',
      description:
        'Đường cong bên phải là số hạt nhân phóng xạ còn lại N theo thời gian t, với các mốc thời gian cách nhau đúng một chu kì bán rã T. Sau T đầu tiên số hạt nhân còn N₀/2; sau 2T còn N₀/4; sau 3T còn N₀/8; sau 4T còn N₀/16. Đường cong tụt rất nhanh lúc đầu rồi thoải dần, mãi tiến sát trục hoành mà không bao giờ chạm — nghĩa là mẫu chất KHÔNG bao giờ hết sạch sau một số chu kì hữu hạn, đây là điểm hay bị hiểu sai. Bên trái là đám 16 hạt nhân: sau mỗi chu kì lại có một nửa số hạt còn lại tắt đi, nhưng không thể đoán trước hạt NÀO sẽ tắt — phân rã là quá trình ngẫu nhiên với từng hạt nhân, chỉ có quy luật thống kê của cả đám mới chắc chắn. Công thức tương ứng: N = N₀·2^(−t/T) = N₀·e^(−λt), với hằng số phóng xạ λ = ln2 / T.',
      viewBoxWidth: 420,
      viewBoxHeight: 240,
      durationMs: 4000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'truc-t',
          x1: 50,
          y1: 200,
          x2: 400,
          y2: 200,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'truc-n',
          x1: 60,
          y1: 210,
          x2: 60,
          y2: 40,
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'polyline',
          id: 'duong-phan-ra',
          points: [
            [60, 60],
            [100, 101],
            [140, 130],
            [180, 150.5],
            [220, 165],
            [260, 175],
            [300, 182.5],
            [340, 187.6],
            [380, 191.3],
          ],
          stroke: 'primary',
          strokeWidth: 3,
        },
        {
          kind: 'circle',
          id: 'cham-thoi-gian',
          cx: 60,
          cy: 60,
          r: 5,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0.0, dy: 0.0 },
            { atMs: 500, dx: 40.0, dy: 41.0 },
            { atMs: 1000, dx: 80.0, dy: 70.0 },
            { atMs: 1500, dx: 120.0, dy: 90.5 },
            { atMs: 2000, dx: 160.0, dy: 105.0 },
            { atMs: 2500, dx: 200.0, dy: 115.0 },
            { atMs: 3000, dx: 240.0, dy: 122.5 },
            { atMs: 3500, dx: 280.0, dy: 127.6 },
            { atMs: 4000, dx: 320.0, dy: 131.3 },
            { atMs: 4000, dx: 320, dy: 131.3 },
          ],
        },
        {
          kind: 'line',
          id: 'muc-mot-nua',
          x1: 60,
          y1: 130,
          x2: 140,
          y2: 130,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '4 4',
        },
        {
          kind: 'line',
          id: 'moc-t1',
          x1: 140,
          y1: 130,
          x2: 140,
          y2: 200,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '4 4',
        },
        {
          kind: 'line',
          id: 'muc-mot-phan-tu',
          x1: 60,
          y1: 165,
          x2: 220,
          y2: 165,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '4 4',
        },
        {
          kind: 'line',
          id: 'moc-t2',
          x1: 220,
          y1: 165,
          x2: 220,
          y2: 200,
          stroke: 'muted',
          strokeWidth: 2,
          dash: '4 4',
        },
        {
          kind: 'circle',
          id: 'hat-con-1',
          cx: 290,
          cy: 100,
          r: 6,
          fill: 'accent',
          keyframes: [
            { atMs: 900, opacity: 1 },
            { atMs: 1000, opacity: 0.15 },
          ],
        },
        {
          kind: 'circle',
          id: 'hat-con-2',
          cx: 312,
          cy: 100,
          r: 6,
          fill: 'accent',
          keyframes: [
            { atMs: 1900, opacity: 1 },
            { atMs: 2000, opacity: 0.15 },
          ],
        },
        {
          kind: 'circle',
          id: 'hat-con-3',
          cx: 334,
          cy: 100,
          r: 6,
          fill: 'accent',
          keyframes: [
            { atMs: 900, opacity: 1 },
            { atMs: 1000, opacity: 0.15 },
          ],
        },
        {
          kind: 'circle',
          id: 'hat-con-4',
          cx: 356,
          cy: 100,
          r: 6,
          fill: 'accent',
          keyframes: [
            { atMs: 2900, opacity: 1 },
            { atMs: 3000, opacity: 0.15 },
          ],
        },
        {
          kind: 'circle',
          id: 'hat-con-5',
          cx: 290,
          cy: 122,
          r: 6,
          fill: 'accent',
          keyframes: [
            { atMs: 900, opacity: 1 },
            { atMs: 1000, opacity: 0.15 },
          ],
        },
        {
          kind: 'circle',
          id: 'hat-con-6',
          cx: 312,
          cy: 122,
          r: 6,
          fill: 'accent',
          keyframes: [
            { atMs: 1900, opacity: 1 },
            { atMs: 2000, opacity: 0.15 },
          ],
        },
        {
          kind: 'circle',
          id: 'hat-con-7',
          cx: 334,
          cy: 122,
          r: 6,
          fill: 'accent',
          keyframes: [
            { atMs: 900, opacity: 1 },
            { atMs: 1000, opacity: 0.15 },
          ],
        },
        { kind: 'circle', id: 'hat-con-8', cx: 356, cy: 122, r: 6, fill: 'accent' },
        {
          kind: 'label',
          id: 'nhan-n0',
          x: 54,
          y: 62,
          text: 'N₀',
          size: 13,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-n2',
          x: 54,
          y: 134,
          text: 'N₀/2',
          size: 12,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-n4',
          x: 54,
          y: 169,
          text: 'N₀/4',
          size: 12,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-t1',
          x: 140,
          y: 216,
          text: 'T',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-t2',
          x: 220,
          y: 216,
          text: '2T',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-t3',
          x: 300,
          y: 216,
          text: '3T',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-ct',
          x: 320,
          y: 70,
          text: 'N = N₀ / 2ⁿ với n = t/T',
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-hat',
          x: 323,
          y: 146,
          text: 'hạt nhân chưa phân rã',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Ban đầu có N₀ hạt nhân phóng xạ.' },
        { atMs: 1100, text: 'Sau một chu kì bán rã T: còn đúng một nửa.' },
        { atMs: 2100, text: 'Sau 2T: còn N₀/4 — không phải hết sạch.' },
        { atMs: 4000, text: 'Đường cong mãi mãi tiến sát trục hoành mà không chạm tới.' },
      ],
    },
    grade: '12',
    chapterNumber: 4,
    chapterTitle: 'Vật lí hạt nhân',
    lessonNumber: 23,
    title: 'Hiện tượng phóng xạ',
    hook: 'Vào cuối thế kỷ 19, Marie Curie và các nhà khoa học phát hiện ra rằng một số nguyên tố nặng có thể tự phát ra các tia bức xạ mắt thường không nhìn thấy được và biến đổi thành nguyên tố khác. Hiện tượng tự phát này được gọi là phóng xạ.',
    theory:
      'ĐỊNH NGHĨA HIỆN TƯỢNG PHÓNG XẠ:\n' +
      '— Phóng xạ: Là quá trình phân rã tự phát của một hạt nhân không bền vững thành hạt nhân khác, đồng thời phát ra các tia phóng xạ.\n\n' +
      'CÁC DẠNG TIA PHÓNG XẠ CHÍNH:\n' +
      '— Phóng xạ Alpha (alpha): Phát ra hạt nhân Heli _2^4 He. Phương trình: _Z^A X -> _(Z-2)^(A-4) Y + _2^4 He. Đâm xuyên yếu, bị lệch trong điện trường.\n' +
      '— Phóng xạ Beta (beta):\n' +
      '  + Beta trừ: phát ra hạt electron e-. _Z^A X -> _(Z+1)^A Y + e-.\n  + Beta cộng: phát ra hạt positron e+. _Z^A X -> _(Z-1)^A Y + e+.\n  + Đâm xuyên trung bình, bị lệch mạnh trong điện trường.\n' +
      '— Phóng xạ Gamma (gamma): Bức xạ điện từ bước sóng cực ngắn (photon năng lượng cao). Không làm thay đổi cấu trúc hạt nhân, không bị lệch trong điện trường, đâm xuyên rất mạnh.\n\n' +
      'ĐỊNH LUẬT PHÓNG XẠ:\n' +
      'Số hạt nhân (hoặc khối lượng) còn lại sau thời gian t:\n' +
      '  N(t) = N0 * 2^(-t/T) = N0 * e^(-lambda * t)\n' +
      '  m(t) = m0 * 2^(-t/T) = m0 * e^(-lambda * t)\n' +
      'Trong đó T là chu kì bán rã, lambda = ln 2 / T ≈ 0.693 / T là hằng số phóng xạ.',
    workedExample: {
      problem:
        'Chất phóng xạ Iốt _{53}^{131}I có chu kì bán rã T = 8 ngày. ' +
        'Nếu ban đầu có 100 g chất này thì sau 24 ngày khối lượng Iốt còn lại là bao nhiêu gam?',
      steps: [
        'Xác định thông số ban đầu: m0 = 100 g, T = 8 ngày, thời gian phân rã t = 24 ngày.',
        'Tính số chu kì bán rã đã trôi qua: k = t / T = 24 / 8 = 3.',
        'Áp dụng công thức định luật phóng xạ: m = m0 * 2^(-k).',
        'Tính toán: m = 100 * 2^(-3) = 100 / 8 = 12.5 g.',
      ],
      answer: 'm = 12.5 g.',
    },
    checkQuestions: [
      {
        prompt: 'Dạng bức xạ phóng xạ nào không mang điện tích và có khả năng đâm xuyên mạnh nhất?',
        choices: [
          { id: 'px_1', label: 'Phóng xạ Gamma' },
          { id: 'px_2', label: 'Phóng xạ Alpha' },
          { id: 'px_3', label: 'Phóng xạ Beta trừ' },
          { id: 'px_4', label: 'Phóng xạ Beta cộng' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['px_1'],
        },
        explain:
          'Phóng xạ Gamma (gamma) là sóng điện từ bước sóng cực ngắn (photon năng lượng cao), không mang điện và có sức đâm xuyên rất mạnh.',
      },
      {
        prompt:
          'Một đồng vị phóng xạ có chu kì bán rã là 5 ngày. ' +
          'Sau 15 ngày, lượng chất phóng xạ còn lại chiếm bao nhiêu phần trăm so với ban đầu?',
        answer: {
          kind: 'numeric',
          value: donViHienThi(12.5, '%'),
          unit: '%',
        },
        explain:
          't/T = 15/5 = 3 chu kì. Tỉ lệ còn lại = 2^-3 = 1/8 = 12.5%. Công thức tổng quát N/N₀ = 2^(-t/T): mỗi chu kì bán rã, lượng chất phóng xạ giảm đi đúng một nửa, không phải giảm đều theo thời gian.',
      },
      {
        // Câu bẫy: hiểu "bán rã" theo kiểu tuyến tính — nửa sau T, nốt nửa còn lại sau T nữa.
        prompt:
          'Một mẫu chất phóng xạ có chu kì bán rã T = 4 ngày. Sau 8 ngày, mẫu chất đó còn lại bao nhiêu phần so với ban đầu?',
        choices: [
          { id: 'het', label: 'Không còn gì, vì 8 ngày = 2 lần chu kì bán rã nên đã rã hết' },
          { id: 'mot_phan_tu', label: 'Còn 1/4 số hạt nhân ban đầu' },
          { id: 'mot_nua', label: 'Còn 1/2 số hạt nhân ban đầu' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['mot_phan_tu'],
        },
        explain:
          'Sau mỗi chu kì bán rã, một nửa số hạt nhân CÒN LẠI ở thời điểm đó bị phân rã — chứ không phải một nửa số ban đầu. ' +
          'Sau T thứ nhất còn N₀/2; T thứ hai lấy đi một nửa của N₀/2, nên còn N₀/4 = 25%. Công thức: N = N₀·2^(−t/T) = N₀·2^(−2) = N₀/4. ' +
          'Cách hiểu "hai lần chu kì bán rã là hết" là kiểu suy nghĩ tuyến tính, và nó dẫn tới kết luận nguy hiểm trong thực tế: chất thải phóng xạ có T hàng nghìn năm thì sau vài chu kì vẫn còn hoạt độ đáng kể. ' +
          'Về mặt toán học, hàm 2^(−t/T) luôn dương nên mẫu chất không bao giờ về đúng 0; chỉ khi số hạt nhân còn lại nhỏ tới mức đếm được thì bài toán mới hết ý nghĩa thống kê.',
      },
    ],
    srsCards: [
      {
        hoi: 'Bản chất tia phóng xạ Alpha là gì?',
        dap: 'Là dòng hạt nhân nguyên tử Heli (_2^4 He).',
      },
      {
        hoi: 'Bản chất tia phóng xạ Gamma là gì?',
        dap: 'Sóng điện từ có bước sóng cực ngắn (các photon năng lượng cao).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly12-c4-b24',
    // "Dây chuyền" là khái niệm về THỨ TỰ và SỐ NHÂN theo thế hệ — đọc chữ không thấy được nhịp
    // 1 → 2 → 4, mà đó lại chính là chỗ phân biệt lò phản ứng với bom.
    animation: {
      title: 'Một nơtron khởi đầu, số phân hạch nhân đôi sau mỗi thế hệ',
      description:
        'Bên trái, một nơtron chậm bay vào hạt nhân urani-235. Hạt nhân này vỡ ra: hai mảnh trung bình văng ngược chiều nhau mang theo khoảng 200 MeV, và hai nơtron mới được phóng ra (thực tế trung bình 2,5 nơtron mỗi phân hạch; hình lấy 2 cho dễ nhìn). Hai nơtron ấy lại gây hai phân hạch nữa, sinh ra bốn nơtron. Ba cột thế hệ đếm rõ 1 rồi 2 rồi 4, mỗi thế hệ chỉ dài cỡ một phần triệu giây. Đây chính là ý nghĩa của hệ số nhân nơtron k mà hình động làm cho sờ được: k lớn hơn 1 thì chuỗi bùng lên không kiểm soát, đó là bom nguyên tử; muốn lò phản ứng chạy ổn định phải dùng thanh điều khiển hấp thụ bớt nơtron sao cho k đúng bằng 1, tức là mỗi phân hạch chỉ gây ra đúng một phân hạch kế tiếp. Nhiệt hạch đi theo hướng ngược lại: ghép hạt nhân rất nhẹ, khó nhất là nhiệt độ hàng chục triệu độ.',
      viewBoxWidth: 500,
      viewBoxHeight: 388,
      durationMs: 7500,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'tieu-de',
          x: 250,
          y: 28,
          text: 'PHÂN HẠCH DÂY CHUYỀN',
          size: 14,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'circle',
          id: 'u0',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 1350, opacity: 1 },
            { atMs: 1450, opacity: 0 },
            { atMs: 7500, opacity: 0 },
          ],
          cx: 120,
          cy: 150,
          r: 22,
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nhan-u0',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 1350, opacity: 1 },
            { atMs: 1450, opacity: 0 },
            { atMs: 7500, opacity: 0 },
          ],
          x: 120,
          y: 115,
          text: '²³⁵U',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'circle',
          id: 'n0',
          cx: 40,
          cy: 150,
          r: 7,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
            },
            {
              atMs: 300,
              dx: 0,
            },
            {
              atMs: 1200,
              dx: 58,
            },
            {
              atMs: 1400,
              opacity: 0,
            },
            {
              atMs: 7500,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-n0',
          x: 40,
          y: 132,
          text: 'n',
          size: 12,
          anchor: 'middle',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              dx: 0,
            },
            {
              atMs: 300,
              dx: 0,
            },
            {
              atMs: 1200,
              dx: 58,
            },
            {
              atMs: 1400,
              opacity: 0,
            },
            {
              atMs: 7500,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'manh-a',
          cx: 120,
          cy: 150,
          r: 13,
          fill: 'correct',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1400,
              dx: 0,
              dy: 0,
              opacity: 0,
            },
            {
              atMs: 1600,
              opacity: 1,
            },
            {
              atMs: 2600,
              dx: 18,
              dy: -52,
            },
            {
              atMs: 7500,
              dx: 18,
              dy: -52,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'manh-b',
          cx: 120,
          cy: 150,
          r: 13,
          fill: 'correct',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1400,
              dx: 0,
              dy: 0,
              opacity: 0,
            },
            {
              atMs: 1600,
              opacity: 1,
            },
            {
              atMs: 2600,
              dx: 18,
              dy: 52,
            },
            {
              atMs: 7500,
              dx: 18,
              dy: 52,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-manh',
          x: 148,
          y: 150,
          text: 'hai mảnh trung bình + ≈ 200 MeV',
          size: 12,
          anchor: 'start',
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1799,
              opacity: 0,
            },
            {
              atMs: 2100,
              opacity: 1,
            },
            {
              atMs: 3000,
              opacity: 1,
            },
            {
              atMs: 3300,
              opacity: 0,
            },
            {
              atMs: 7500,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'n1a',
          cx: 120,
          cy: 150,
          r: 7,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1500,
              dx: 0,
              dy: 0,
              opacity: 0,
            },
            {
              atMs: 1700,
              opacity: 1,
            },
            {
              atMs: 3000,
              dx: 120,
              dy: -70,
            },
            {
              atMs: 7500,
              dx: 120,
              dy: -70,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'n1b',
          cx: 120,
          cy: 150,
          r: 7,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1500,
              dx: 0,
              dy: 0,
              opacity: 0,
            },
            {
              atMs: 1700,
              opacity: 1,
            },
            {
              atMs: 3000,
              dx: 120,
              dy: 70,
            },
            {
              atMs: 7500,
              dx: 120,
              dy: 70,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'u1a',
          cx: 250,
          cy: 80,
          r: 20,
          fill: 'primary',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2399, opacity: 0 },
            { atMs: 2700, opacity: 1 },
            { atMs: 3350, opacity: 1 },
            { atMs: 3450, opacity: 0 },
            { atMs: 7500, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'u1b',
          cx: 250,
          cy: 220,
          r: 20,
          fill: 'primary',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2399, opacity: 0 },
            { atMs: 2700, opacity: 1 },
            { atMs: 3350, opacity: 1 },
            { atMs: 3450, opacity: 0 },
            { atMs: 7500, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'manh-2a-tren',
          cx: 250,
          cy: 80,
          r: 10,
          fill: 'correct',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3400, dx: 0, dy: 0, opacity: 0 },
            { atMs: 3550, opacity: 1 },
            { atMs: 4300, dx: -14, dy: -22, opacity: 1 },
            { atMs: 7500, dx: -14, dy: -22, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'manh-2a-duoi',
          cx: 250,
          cy: 80,
          r: 10,
          fill: 'correct',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3400, dx: 0, dy: 0, opacity: 0 },
            { atMs: 3550, opacity: 1 },
            { atMs: 4300, dx: -14, dy: 22, opacity: 1 },
            { atMs: 7500, dx: -14, dy: 22, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'manh-2b-tren',
          cx: 250,
          cy: 220,
          r: 10,
          fill: 'correct',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3400, dx: 0, dy: 0, opacity: 0 },
            { atMs: 3550, opacity: 1 },
            { atMs: 4300, dx: -14, dy: -22, opacity: 1 },
            { atMs: 7500, dx: -14, dy: -22, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'manh-2b-duoi',
          cx: 250,
          cy: 220,
          r: 10,
          fill: 'correct',
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3400, dx: 0, dy: 0, opacity: 0 },
            { atMs: 3550, opacity: 1 },
            { atMs: 4300, dx: -14, dy: 22, opacity: 1 },
            { atMs: 7500, dx: -14, dy: 22, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'n2-0',
          cx: 250,
          cy: 80,
          r: 7,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3400,
              dx: 0,
              dy: 0,
              opacity: 0,
            },
            {
              atMs: 3700,
              opacity: 1,
            },
            {
              atMs: 5000,
              dx: 120,
              dy: -40,
            },
            {
              atMs: 7500,
              dx: 120,
              dy: -40,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'u2-0',
          cx: 370,
          cy: 40,
          r: 18,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4399,
              opacity: 0,
            },
            {
              atMs: 4700,
              opacity: 1,
            },
            {
              atMs: 7500,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'n2-1',
          cx: 250,
          cy: 80,
          r: 7,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3400,
              dx: 0,
              dy: 0,
              opacity: 0,
            },
            {
              atMs: 3700,
              opacity: 1,
            },
            {
              atMs: 5000,
              dx: 120,
              dy: 30,
            },
            {
              atMs: 7500,
              dx: 120,
              dy: 30,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'u2-1',
          cx: 370,
          cy: 110,
          r: 18,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4399,
              opacity: 0,
            },
            {
              atMs: 4700,
              opacity: 1,
            },
            {
              atMs: 7500,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'n2-2',
          cx: 250,
          cy: 220,
          r: 7,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3400,
              dx: 0,
              dy: 0,
              opacity: 0,
            },
            {
              atMs: 3700,
              opacity: 1,
            },
            {
              atMs: 5000,
              dx: 120,
              dy: -30,
            },
            {
              atMs: 7500,
              dx: 120,
              dy: -30,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'u2-2',
          cx: 370,
          cy: 190,
          r: 18,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4399,
              opacity: 0,
            },
            {
              atMs: 4700,
              opacity: 1,
            },
            {
              atMs: 7500,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'n2-3',
          cx: 250,
          cy: 220,
          r: 7,
          fill: 'accent',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 3400,
              dx: 0,
              dy: 0,
              opacity: 0,
            },
            {
              atMs: 3700,
              opacity: 1,
            },
            {
              atMs: 5000,
              dx: 120,
              dy: 40,
            },
            {
              atMs: 7500,
              dx: 120,
              dy: 40,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'u2-3',
          cx: 370,
          cy: 260,
          r: 18,
          fill: 'primary',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4399,
              opacity: 0,
            },
            {
              atMs: 4700,
              opacity: 1,
            },
            {
              atMs: 7500,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'the-he-0',
          x: 120,
          y: 300,
          text: 'thế hệ 1: 1 phân hạch',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'the-he-1',
          x: 250,
          y: 300,
          text: 'thế hệ 2: 2',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2399,
              opacity: 0,
            },
            {
              atMs: 2700,
              opacity: 1,
            },
            {
              atMs: 7500,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'the-he-2',
          x: 375,
          y: 300,
          text: 'thế hệ 3: 4 …',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4399,
              opacity: 0,
            },
            {
              atMs: 4700,
              opacity: 1,
            },
            {
              atMs: 7500,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'he-so-k',
          x: 250,
          y: 324,
          text: 'k > 1: số phân hạch nhân đôi mỗi thế hệ → dây chuyền vượt hạn, đây là bom',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5399,
              opacity: 0,
            },
            {
              atMs: 5700,
              opacity: 1,
            },
            {
              atMs: 7500,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'he-so-k2',
          x: 250,
          y: 340,
          text: 'k = 1: giữ đúng một phân hạch mỗi thế hệ → lò phản ứng chạy ổn định',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 6199,
              opacity: 0,
            },
            {
              atMs: 6500,
              opacity: 1,
            },
            {
              atMs: 7500,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'nhiet-hach',
          x: 250,
          y: 364,
          text: 'Nhiệt hạch thì ngược lại: các hạt nhân rất nhẹ (²H, ³H) ghép lại,',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhiet-hach-2',
          x: 250,
          y: 380,
          text: 'cần hàng chục triệu độ để thắng lực đẩy Coulomb giữa hai hạt nhân',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
        },
      ],
      captions: [
        {
          atMs: 300,
          text: 'Một nơtron bay vào hạt nhân urani-235.',
        },
        {
          atMs: 1600,
          text: 'Hạt nhân vỡ: hai mảnh + khoảng 200 MeV + hai nơtron mới.',
        },
        {
          atMs: 3400,
          text: 'Hai nơtron gây tiếp hai phân hạch ở thế hệ sau.',
        },
        {
          atMs: 4400,
          text: 'Thế hệ ba đã có bốn phân hạch: 1 → 2 → 4.',
        },
        {
          atMs: 6200,
          text: 'k = 1 thì lò chạy ổn định; k > 1 thì chuỗi bùng lên mất kiểm soát.',
        },
      ],
    },
    grade: '12',
    chapterNumber: 4,
    chapterTitle: 'Vật lí hạt nhân',
    lessonNumber: 24,
    title: 'Phân hạch và nhiệt hạch',
    hook:
      'Năng lượng hạt nhân có hai nguồn khai thác chính: phân tách các hạt nhân rất nặng (phân hạch - dùng trong lò phản ứng hạt nhân) và ' +
      'hợp nhất các hạt nhân rất nhẹ ở nhiệt độ cực cao (nhiệt hạch - phản ứng đang thắp sáng Mặt Trời).',
    theory:
      'PHẢN ỨNG PHÂN HẠCH:\n' +
      '— Định nghĩa: Phản ứng phân hạch là hiện tượng một hạt nhân rất nặng (như U-235, Pu-239) hấp thụ một neutron chậm rồi vỡ thành hai hạt nhân trung bình, giải phóng 2-3 neutron và toả ra năng lượng rất lớn (~200 MeV/hạt nhân).\n\n' +
      'PHẢN ỨNG DÂY CHUYỀN (CHAIN REACTION):\n' +
      '— Gọi k là hệ số nhân neutron trung bình:\n' +
      '  + k < 1: Phản ứng tắt ngay.\n  + k = 1: Phản ứng tự duy trì ổn định (nhà máy điện hạt nhân).\n  + k > 1: Phản ứng tăng bùng nổ mất kiểm soát (bom nguyên tử).\n\n' +
      'PHẢN ỨNG NHIỆT HẠCH:\n' +
      '— Định nghĩa: Phản ứng nhiệt hạch là phản ứng kết hợp hai hạt nhân rất nhẹ (đồng vị H) thành hạt nhân nặng hơn ở nhiệt độ cực kì cao (hàng chục đến hàng trăm triệu độ C).\n' +
      '— Phương trình tiêu biểu: _1^2 H + _1^3 H -> _2^4 He + _0^1 n + 17.6 MeV.\n' +
      '— Ưu điểm: Năng lượng toả ra cực lớn, nguồn nhiên liệu gần như vô tận (đồng vị hiđrô lấy từ nước biển), sạch và ít phế thải phóng xạ hơn phân hạch.',
    workedExample: {
      problem:
        'Trình bày điều kiện để thực hiện phản ứng nhiệt hạch trên Trái Đất và nêu khó khăn lớn nhất hiện nay.',
      steps: [
        'Nêu điều kiện nhiệt độ: Cần nhiệt độ cực cao (~100 triệu độ) để vượt qua lực đẩy tĩnh điện Coulomb.',
        'Nêu điều kiện mật độ và thời gian: Mật độ hạt nhân đủ lớn và thời gian giữ đủ lâu để xảy ra va chạm tổng hợp.',
        'Nêu khó khăn công nghệ: Chưa chế tạo được vật liệu làm thành bình chứa chịu được nhiệt độ cao như vậy. Hiện đang dùng bẫy từ trường (Tokamak) hoặc bẫy laser.',
      ],
      answer:
        'Cần nhiệt độ cực cao khoảng 100 triệu độ; khó khăn lớn nhất là công nghệ giữ khối khí nóng cô lập.',
    },
    checkQuestions: [
      {
        prompt:
          'Phản ứng hạt nhân nào sau đây đóng vai trò là nguồn năng lượng của Mặt Trời và các ngôi sao?',
        choices: [
          { id: 'nh_1', label: 'Phản ứng nhiệt hạch' },
          { id: 'nh_2', label: 'Phản ứng phân hạch' },
          { id: 'nh_3', label: 'Phóng xạ Alpha' },
          { id: 'nh_4', label: 'Phóng xạ Beta' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['nh_1'],
        },
        explain:
          'Mặt Trời và các ngôi sao toả nhiệt và sáng liên tục nhờ phản ứng nhiệt hạch (tổng hợp hạt nhân hiđrô thành heli) ở lõi nóng bỏng.',
      },
      {
        prompt:
          'Để duy trì phản ứng dây chuyền có kiểm soát ổn định trong các lò phản ứng của nhà máy điện hạt nhân, ' +
          'hệ số nhân neutron k phải thoả mãn điều kiện nào?',
        choices: [
          { id: 'k_1', label: 'k = 1' },
          { id: 'k_2', label: 'k > 1' },
          { id: 'k_3', label: 'k < 1' },
          { id: 'k_4', label: 'k tùy ý' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['k_1'],
        },
        explain:
          'Khi k = 1, số neutron gây phân hạch được duy trì ổn định, nên công suất của lò không đổi và luôn trong tầm kiểm soát.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phân hạch là gì?',
        dap: 'Hiện tượng một hạt nhân nặng hấp thụ neutron vỡ thành hai hạt nhân trung bình.',
      },
      {
        hoi: 'Nhiệt hạch là gì?',
        dap: 'Phản ứng kết hợp các hạt nhân nhẹ thành hạt nhân nặng hơn ở nhiệt độ cực cao.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'ly12-c4-b25',
    grade: '12',
    chapterNumber: 4,
    chapterTitle: 'Vật lí hạt nhân',
    lessonNumber: 25,
    title: 'Bài tập về vật lí hạt nhân',
    hook: 'Luyện tập giải các bài tập tính toán độ hụt khối, năng lượng liên kết, năng lượng phản ứng hạt nhân và ứng dụng định luật phóng xạ.',
    theory:
      'CÁC CÔNG THỨC TRỌNG TÂM CẦN NHỚ:\n' +
      '1. Độ hụt khối: dm = Z.mp + (A-Z).mn - m_hn\n' +
      '2. Năng lượng liên kết: Elk = dm * c² = dm * 931.5 MeV (với dm tính bằng amu)\n' +
      '3. Năng lượng liên kết riêng: Elkr = Elk / A\n' +
      '4. Số hạt còn lại: N(t) = N0 * 2^(-t/T) = N0 * e^(-lambda * t)\n' +
      '5. Năng lượng phản ứng: dE = (m_truoc - m_sau) * c² = Elk_sau - Elk_truoc',
    workedExample: {
      problem:
        'Một phản ứng hạt nhân có tổng khối lượng của các hạt trước phản ứng là 236.002 amu và ' +
        'tổng khối lượng các hạt sau phản ứng là 235.802 amu. Hãy xác định phản ứng này toả hay thu bao nhiêu năng lượng (theo đơn vị MeV)? ' +
        'Biết 1 amu.c² = 931.5 MeV.',
      steps: [
        'Tính hiệu số khối lượng trước và sau phản ứng: dm = m_truoc - m_sau = 236.002 - 235.802 = 0.2 amu.',
        'Áp dụng công thức dE = dm * 931.5 MeV.',
        'Tính toán: dE = 0.2 * 931.5 = 186.3 MeV.',
        'Vì dE > 0 nên phản ứng toả năng lượng với độ lớn 186.3 MeV.',
      ],
      answer: 'Phản ứng toả năng lượng 186.3 MeV.',
    },
    checkQuestions: [
      {
        prompt:
          'Một đồng vị phóng xạ có chu kì bán rã T = 10 ngày. ' +
          'Hằng số phóng xạ lambda của chất phóng xạ này xấp xỉ bằng bao nhiêu ngày^-1?',
        answer: {
          kind: 'numeric',
          value: donViHienThi(0.0693, 'ngày^-1'),
          unit: 'ngày^-1',
        },
        explain:
          'lambda = ln(2) / T = 0.693 / 10 = 0.0693 ngày^-1. Hằng số phóng xạ λ và chu kì bán rã T tỉ lệ nghịch: chất phân rã càng nhanh (T nhỏ) thì λ càng lớn.',
      },
      {
        prompt:
          'Một phản ứng hạt nhân có tổng khối lượng các hạt trước phản ứng nhỏ hơn tổng khối lượng các hạt sau phản ứng là 0.005 amu. ' +
          'Tính năng lượng thu vào của phản ứng này theo đơn vị MeV (lấy 1 amu.c² = 931.5 MeV).',
        answer: {
          kind: 'numeric',
          value: donViHienThi(4.6575, 'MeV'),
          unit: 'MeV',
        },
        explain: 'E_thu = (m_sau - m_truoc) * c^2 = 0.005 * 931.5 = 4.6575 MeV.',
      },
    ],
    srsCards: [
      {
        hoi: 'Hằng số phóng xạ lambda liên hệ thế nào với chu kì bán rã T?',
        dap: 'lambda = ln 2 / T ≈ 0.693 / T.',
      },
      {
        hoi: 'Công thức tính năng lượng phản ứng hạt nhân theo khối lượng nghỉ trước và sau?',
        dap: 'dE = (mtruoc - msau) * c².',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
