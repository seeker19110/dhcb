// lessons/toan9c10.ts — Toán 9, Chương 10: Một số hình khối trong thực tiễn.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN9_C10_LESSONS: MathLesson[] = [
  {
    id: 'toan9-c10-b1',
    grade: '9',
    chapterNumber: 10,
    chapterTitle: 'Một số hình khối trong thực tiễn',
    lessonNumber: 1,
    title: 'Hình trụ và hình nón',
    hook:
      'Chiếc xô nước nhà em gần giống hình trụ, còn chiếc nón lá bán ở chợ có dạng hình nón. ' +
      'Cô thợ làm nón cần biết diện tích lá phải lợp quanh nón, còn em muốn biết xô chứa được bao nhiêu lít nước. ' +
      'Bài này dạy em tính diện tích xung quanh và thể tích của hình trụ và hình nón, hai hình khối rất thường gặp trong đời sống.',
    theory:
      'HÌNH TRỤ\n' +
      'Quay một hình chữ nhật quanh một cạnh của nó ta được hình trụ. Hình trụ có hai đáy là hai hình tròn bằng nhau, bán kính r; chiều cao h là khoảng cách giữa hai đáy; mọi đường sinh đều bằng h.\n' +
      '— Diện tích xung quanh: Sxq = 2πrh.\n' +
      '— Diện tích toàn phần: Stp = Sxq + 2πr² (cộng thêm hai đáy).\n' +
      '— Thể tích: V = πr²h.\n' +
      'VÌ SAO Sxq = 2πrh? Cắt mặt xung quanh theo một đường sinh rồi trải phẳng được một hình chữ nhật có một cạnh là chu vi đáy 2πr, cạnh kia là chiều cao h.\n\n' +
      'HÌNH NÓN\n' +
      'Quay một tam giác vuông quanh một cạnh góc vuông ta được hình nón. Hình nón có đỉnh, đáy là hình tròn bán kính r, chiều cao h (từ đỉnh đến tâm đáy) và đường sinh l (từ đỉnh đến một điểm trên đường tròn đáy).\n' +
      '— Hệ thức giữa ba độ dài: l² = r² + h² (định lí Pythagore trong tam giác vuông có hai cạnh góc vuông là r, h và cạnh huyền là l).\n' +
      '— Diện tích xung quanh: Sxq = πrl.\n' +
      '— Diện tích toàn phần: Stp = πrl + πr².\n' +
      '— Thể tích: V = (1/3)πr²h.\n' +
      'VÌ SAO Sxq = πrl? Trải mặt xung quanh ra được một hình quạt tròn bán kính l, có cung dài bằng chu vi đáy 2πr. Diện tích hình quạt bằng (1/2) · l · 2πr = πrl.\n' +
      'VÌ SAO có hệ số 1/3 ở thể tích? Hình nón chứa đúng một phần ba thể tích hình trụ có cùng đáy và cùng chiều cao.\n\n' +
      'CÁCH TRÌNH BÀY ĐÁP SỐ\n' +
      'Có thể để kết quả theo π (ví dụ 120π cm²) hoặc lấy xấp xỉ π ≈ 3,14 khi đề yêu cầu. Đổi đơn vị: 1 lít = 1000 cm³ (tức 1 dm³).\n\n' +
      'LỖI HAY GẶP\n' +
      '— Dùng đường kính thay cho bán kính.\n' +
      '— Nhầm đường sinh l với chiều cao h của hình nón (l luôn lớn hơn h và r).\n' +
      '— Quên hệ số 1/3 khi tính thể tích hình nón.\n' +
      '— Tính Sxq của hình trụ mà cộng luôn hai đáy.\n' +
      '— Lẫn đơn vị: diện tích tính bằng cm², thể tích bằng cm³.',
    workedExample: {
      problem:
        'a) Hình trụ có bán kính đáy 5 cm và chiều cao 12 cm. Tính diện tích xung quanh và thể tích (theo π). ' +
        'b) Hình nón có bán kính đáy 3 cm và chiều cao 4 cm. Tính đường sinh, diện tích xung quanh và thể tích (theo π). ' +
        'c) Lấy π ≈ 3,14, tính thể tích hình trụ ở câu a.',
      steps: [
        'a) Diện tích xung quanh: Sxq = 2π · 5 · 12 = 120π cm².',
        'a) Thể tích: V = π · 5² · 12 = π · 25 · 12 = 300π cm³.',
        'b) Đường sinh: l² = r² + h² = 9 + 16 = 25, nên l = 5 cm.',
        'b) Diện tích xung quanh: Sxq = π · 3 · 5 = 15π cm². Thể tích: V = (1/3) · π · 9 · 4 = 12π cm³.',
        'c) Với π ≈ 3,14: V ≈ 300 · 3,14 = 942 cm³.',
      ],
      answer:
        'a) Sxq = 120π cm²; V = 300π cm³. b) l = 5 cm; Sxq = 15π cm²; V = 12π cm³. c) V ≈ 942 cm³.',
    },
    checkQuestions: [
      {
        prompt:
          'Hình trụ có bán kính đáy 4 cm và chiều cao 10 cm. Diện tích xung quanh của hình trụ bằng kπ cm². Nhập giá trị của k.',
        answer: { kind: 'numeric', value: 80 },
        explain:
          'Sxq = 2πrh = 2π · 4 · 10 = 80π cm², nên k = 80. ' +
          'Lỗi hay gặp là dùng công thức πrh (quên hệ số 2) được k = 40, hoặc cộng thêm diện tích hai đáy.',
      },
      {
        prompt:
          'Một hình nón và một hình trụ có cùng bán kính đáy và cùng chiều cao. Thể tích hình nón so với thể tích hình trụ là:',
        choices: [
          { id: 'a', label: 'Bằng thể tích hình trụ' },
          { id: 'b', label: 'Bằng một nửa thể tích hình trụ' },
          { id: 'c', label: 'Bằng một phần ba thể tích hình trụ' },
          { id: 'd', label: 'Gấp ba lần thể tích hình trụ' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Thể tích hình nón là (1/3)πr²h, thể tích hình trụ là πr²h, nên thể tích hình nón bằng một phần ba thể tích hình trụ. ' +
          'Lỗi hay gặp là quên hệ số 1/3 và cho rằng hai thể tích bằng nhau.',
      },
      {
        prompt:
          'Hình nón có bán kính đáy 6 cm và chiều cao 8 cm. Diện tích xung quanh của hình nón bằng kπ cm². Nhập giá trị của k.',
        answer: { kind: 'numeric', value: 60 },
        explain:
          'Đường sinh l² = 6² + 8² = 36 + 64 = 100, nên l = 10 cm. Sxq = πrl = π · 6 · 10 = 60π cm², suy ra k = 60. ' +
          'Lỗi hay gặp là dùng chiều cao 8 thay cho đường sinh 10 nên ra k = 48.',
      },
      {
        prompt:
          'Một chiếc xô hình trụ có bán kính đáy 10 cm và chiều cao 30 cm. Lấy π ≈ 3,14. Xô chứa được bao nhiêu lít nước (1 lít = 1000 cm³)?',
        answer: { kind: 'numeric', value: 9.42, tolerance: { mode: 'absolute', eps: 0.005 } },
        explain:
          'V = πr²h ≈ 3,14 · 10² · 30 = 3,14 · 3000 = 9420 cm³ = 9,42 lít. ' +
          'Lỗi hay gặp là quên đổi đơn vị (ra 9420 lít) hoặc lấy đường kính 20 cm thay cho bán kính 10 cm.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức diện tích xung quanh và thể tích hình trụ?',
        dap: 'Sxq = 2πrh; V = πr²h (r là bán kính đáy, h là chiều cao).',
      },
      {
        hoi: 'Công thức diện tích xung quanh và thể tích hình nón?',
        dap: 'Sxq = πrl; V = (1/3)πr²h (l là đường sinh).',
      },
      {
        hoi: 'Hệ thức giữa bán kính, chiều cao và đường sinh của hình nón?',
        dap: 'l² = r² + h² (Pythagore).',
      },
      {
        hoi: 'Hình nón có thể tích so với hình trụ cùng đáy và chiều cao?',
        dap: 'Bằng một phần ba thể tích hình trụ đó.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan9-c10-b2',
    grade: '9',
    chapterNumber: 10,
    chapterTitle: 'Một số hình khối trong thực tiễn',
    lessonNumber: 2,
    title: 'Hình cầu',
    hook:
      'Quả bóng đá, quả bóng rổ, quả địa cầu hay chiếc bồn chứa khí ở nhà máy đều có dạng hình cầu. ' +
      'Nhà sản xuất cần biết lượng da bọc quanh quả bóng và lượng khí bơm vào bên trong. ' +
      'Bài này dạy em nhận biết mặt cầu, hình cầu và tính diện tích mặt cầu, thể tích hình cầu.',
    theory:
      'MẶT CẦU VÀ HÌNH CẦU\n' +
      'Quay một nửa hình tròn quanh đường kính của nó ta được hình cầu. Điểm O là tâm, R là bán kính, đường kính bằng 2R.\n' +
      '— Mặt cầu là tập hợp các điểm cách O một khoảng bằng R (phần "vỏ").\n' +
      '— Hình cầu gồm mặt cầu cùng toàn bộ phần bên trong nó.\n' +
      'Cắt hình cầu bởi một mặt phẳng ta được một hình tròn. Nếu mặt phẳng đi qua tâm O thì hình tròn đó có bán kính R, gọi là hình tròn lớn.\n\n' +
      'CÔNG THỨC\n' +
      '— Diện tích mặt cầu: S = 4πR² (gấp 4 lần diện tích hình tròn lớn).\n' +
      '— Thể tích hình cầu: V = (4/3)πR³.\n' +
      'VÌ SAO có các hệ số này? Xét hình trụ bao quanh hình cầu, có bán kính đáy R và chiều cao 2R. Diện tích xung quanh của hình trụ là 2πR · 2R = 4πR², đúng bằng diện tích mặt cầu. ' +
      'Thể tích hình trụ là πR² · 2R = 2πR³, và thể tích hình cầu bằng 2/3 thể tích hình trụ đó: (2/3) · 2πR³ = (4/3)πR³.\n\n' +
      'KHI R THAY ĐỔI\n' +
      'Bán kính tăng gấp k lần thì diện tích mặt cầu tăng gấp k² lần, thể tích hình cầu tăng gấp k³ lần. Ví dụ bán kính gấp đôi thì diện tích gấp 4, thể tích gấp 8.\n\n' +
      'CÁCH TRÌNH BÀY ĐÁP SỐ\n' +
      'Có thể để kết quả theo π hoặc lấy xấp xỉ π ≈ 3,14 khi đề yêu cầu; đề thường nói rõ làm tròn đến hàng nào.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Dùng đường kính thay cho bán kính: quả bóng đường kính 22 cm có R = 11 cm.\n' +
      '— Nhầm bậc: diện tích có R² còn thể tích có R³.\n' +
      '— Quên hệ số 4/3 (hoặc quên chia 3) khi tính thể tích.\n' +
      '— Tưởng bán kính gấp đôi thì thể tích gấp đôi (thật ra gấp 8).',
    workedExample: {
      problem:
        'a) Quả bóng da có đường kính 22 cm. Tính diện tích da bọc quanh bóng theo π, rồi lấy π ≈ 3,14 làm tròn đến hàng đơn vị. ' +
        'b) Bồn chứa khí hình cầu có bán kính 3 m. Tính thể tích theo π, rồi lấy π ≈ 3,14. ' +
        'c) Bán kính tăng gấp đôi thì diện tích và thể tích thay đổi thế nào?',
      steps: [
        'a) Bán kính R = 22 : 2 = 11 cm. Diện tích S = 4π · 11² = 4π · 121 = 484π cm².',
        'a) Với π ≈ 3,14: S ≈ 484 · 3,14 = 1519,76, làm tròn được khoảng 1520 cm².',
        'b) Thể tích V = (4/3)π · 3³ = (4/3)π · 27 = 36π m³.',
        'b) Với π ≈ 3,14: V ≈ 36 · 3,14 = 113,04 m³.',
        'c) Bán kính gấp 2 thì diện tích gấp 2² = 4 lần, thể tích gấp 2³ = 8 lần.',
      ],
      answer:
        'a) S = 484π cm² ≈ 1520 cm². b) V = 36π m³ ≈ 113,04 m³. c) Diện tích gấp 4, thể tích gấp 8.',
    },
    checkQuestions: [
      {
        prompt: 'Mặt cầu có bán kính 5 cm. Diện tích mặt cầu bằng kπ cm². Nhập giá trị của k.',
        answer: { kind: 'numeric', value: 100 },
        explain:
          'S = 4πR² = 4π · 5² = 4π · 25 = 100π cm², nên k = 100. ' +
          'Lỗi hay gặp là tính 4π · 5 = 20π (quên bình phương R) hoặc dùng công thức của thể tích.',
      },
      {
        prompt: 'Hình cầu có bán kính 6 cm. Thể tích hình cầu bằng kπ cm³. Nhập giá trị của k.',
        answer: { kind: 'numeric', value: 288 },
        explain:
          'V = (4/3)πR³ = (4/3)π · 216 = 288π cm³ (vì 216 : 3 = 72 và 72 · 4 = 288), nên k = 288. ' +
          'Lỗi hay gặp là quên chia 3 và ra k = 864, hoặc lấy R² = 36 thay cho R³.',
      },
      {
        prompt: 'Nếu bán kính của một hình cầu tăng gấp đôi thì thể tích của nó thay đổi thế nào?',
        choices: [
          { id: 'a', label: 'Gấp 2 lần' },
          { id: 'b', label: 'Gấp 8 lần' },
          { id: 'c', label: 'Gấp 4 lần' },
          { id: 'd', label: 'Gấp 6 lần' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Thể tích V = (4/3)πR³ tỉ lệ với R³. Khi R gấp 2 thì V gấp 2³ = 8 lần. ' +
          'Lỗi hay gặp là chọn gấp 4 lần (đó là hệ số của diện tích mặt cầu, tỉ lệ với R²).',
      },
      {
        prompt:
          'Quả bóng rổ có đường kính 24 cm. Lấy π ≈ 3,14. Diện tích mặt ngoài của quả bóng là bao nhiêu xentimét vuông, làm tròn đến hàng đơn vị?',
        answer: { kind: 'numeric', value: 1809, tolerance: { mode: 'absolute', eps: 0.5 } },
        explain:
          'Bán kính R = 24 : 2 = 12 cm. S = 4πR² ≈ 4 · 3,14 · 144 = 1808,64 cm², làm tròn được 1809 cm². ' +
          'Lỗi hay gặp là dùng đường kính 24 cm thay cho bán kính, ra kết quả gấp 4 lần.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức diện tích mặt cầu và thể tích hình cầu bán kính R?',
        dap: 'S = 4πR²; V = (4/3)πR³.',
      },
      {
        hoi: 'Mặt cầu và hình cầu khác nhau thế nào?',
        dap: 'Mặt cầu chỉ gồm các điểm cách tâm một khoảng R; hình cầu gồm cả mặt cầu và phần bên trong.',
      },
      {
        hoi: 'Bán kính tăng gấp k lần thì diện tích mặt cầu và thể tích hình cầu thay đổi thế nào?',
        dap: 'Diện tích gấp k² lần, thể tích gấp k³ lần.',
      },
      {
        hoi: 'Quả bóng có đường kính d thì bán kính bao nhiêu?',
        dap: 'R = d : 2 (luôn đổi từ đường kính sang bán kính trước khi tính).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
