// lessons/hoa11c6.ts — Hoá học 11, Chương 6: Hợp chất carbonyl - Carboxylic acid (3 bài).
// Đối chiếu mục lục thật: tai-lieu-sgk/SGK-Hoa/11/page_0005.png (OCR 2026-08-31).
// reviewStatus='draft' — soạn từ docs/research/kho-kien-thuc-hoa-gdpt2018.md §3, chưa duyệt.
import type { ChemLesson } from '../lessonTypes.js'

export const HOA11_C6_LESSONS: ChemLesson[] = [
  {
    id: 'hoa11-c6-b23',
    grade: '11',
    chapterNumber: 6,
    chapterTitle: 'Hợp chất carbonyl - Carboxylic acid',
    lessonNumber: 23,
    title: 'Hợp chất carbonyl',
    hook:
      'Dung dịch formalin dùng bảo quản mẫu sinh vật chứa formaldehyde. Nước rửa sơn móng tay có mùi ' +
      'hăng đặc trưng chứa acetone. Cả hai chất đều mang nhóm chức carbonyl.',
    theory:
      'KHÁI NIỆM VÀ PHÂN LOẠI:\n' +
      '— Hợp chất carbonyl là hợp chất hữu cơ trong phân tử có chứa nhóm carbonyl (C=O).\n' +
      '— Aldehyde: nhóm carbonyl liên kết với ít nhất một nguyên tử hydrogen (R−CHO, với chất đơn giản nhất là HCHO).\n' +
      "— Ketone: nhóm carbonyl liên kết với hai gốc hydrocarbon (R−CO−R').\n\n" +
      'TÍNH CHẤT HOÁ HỌC:\n' +
      '1. Phản ứng khử (cộng H₂):\n' +
      '   — Aldehyde bị khử bởi H₂ (Ni, t°) tạo alcohol bậc I: R−CHO + H₂ → R−CH₂OH.\n' +
      "   — Ketone bị khử bởi H₂ (Ni, t°) tạo alcohol bậc II: R−CO−R' + H₂ → R−CH(OH)−R'.\n" +
      '2. Phản ứng oxi hoá (chỉ có ở aldehyde, ketone bền vững với chất oxi hoá yếu):\n' +
      '   — Phản ứng tráng bạc: Aldehyde tác dụng với thuốc thử Tollens [Ag(NH₃)₂]OH tạo ra lớp kim loại bạc sáng bóng như gương bám vào thành ống nghiệm (tráng gương):\n' +
      '     R−CHO + 2[Ag(NH₃)₂]OH → R−COONH₄ + 2Ag↓ + 3NH₃ + H₂O (t°).\n' +
      '     (Riêng HCHO cho tới 4Ag từ 1 mol, vì nó bị oxi hoá qua hai nấc: trước thành muối của formic acid, muối này vẫn còn một nguyên tử H đính vào nhóm carbonyl nên tiếp tục tráng bạc lần nữa.)\n' +
      '   — Phản ứng với Cu(OH)₂ trong môi trường kiềm nóng: Aldehyde tạo kết tủa đỏ gạch Cu₂O:\n' +
      '     R−CHO + 2Cu(OH)₂ + NaOH → R−COONa + Cu₂O↓ + 3H₂O (t°).',
    workedExample: {
      problem:
        'Cho 4,4 gam acetaldehyde (CH₃CHO, M=44) phản ứng hoàn toàn với lượng dư thuốc thử Tollens ' +
        'trong dung dịch NH₃ đun nóng. Tính khối lượng bạc (Ag, M=108) tạo thành.',
      steps: [
        'Tính số mol acetaldehyde: n = 4,4 / 44 = 0,1 mol.',
        'Viết phương trình phản ứng tráng bạc của mono-aldehyde: CH₃CHO + 2[Ag(NH₃)₂]OH → CH₃COONH₄ + 2Ag↓ + 3NH₃ + H₂O.',
        'Từ phương trình, tỉ lệ phản ứng là: 1 mol aldehyde tạo ra 2 mol Ag.',
        'Tính số mol Ag thu được: nAg = 2 * n(acetaldehyde) = 2 * 0,1 = 0,2 mol.',
        'Tính khối lượng bạc tạo thành: mAg = 0,2 * 108 = 21,6 gam.',
      ],
      answer: '21,6 gam',
    },
    checkQuestions: [
      {
        prompt: 'Nhóm chức carbonyl có cấu tạo như thế nào?',
        choices: [
          { id: 'co', label: 'C=O (carbon liên kết đôi với oxygen)' },
          { id: 'oh', label: 'C−O−H (hydroxyl)' },
          { id: 'cho', label: 'C=O và đính thêm H (formyl)' },
        ],
        answer: { kind: 'choice', correctIds: ['co'] },
        explain:
          'Hợp chất carbonyl đặc trưng bởi nhóm C=O. Nhóm −OH là của alcohol, còn −CHO (C=O có thêm H) mới là nhóm riêng của aldehyde — chỉ là một trường hợp của nhóm carbonyl, không phải định nghĩa chung.',
      },
      {
        prompt:
          'Khi cho 1 mol acetaldehyde (CH₃CHO) tham gia phản ứng tráng bạc hoàn toàn với thuốc thử Tollens dư, số mol Ag kết tủa tối đa thu được là bao nhiêu?',
        answer: { kind: 'numeric', value: 2 },
        explain:
          'Mỗi nhóm −CHO của mono-aldehyde thông thường (như CH₃CHO) khi bị oxi hoá sẽ nhường electron khử 2 ion Ag⁺ thành 2 nguyên tử Ag kết tủa.',
      },
    ],
    srsCards: [
      { hoi: 'Carbonyl gồm những lớp chất nào?', dap: "Aldehyde (R−CHO) và ketone (R−CO−R')." },
      {
        hoi: 'Hiện tượng phản ứng tráng bạc của aldehyde?',
        dap: 'Có lớp kim loại bạc (Ag) sáng bóng bám vào thành ống nghiệm.',
      },
      {
        hoi: 'Sự khác biệt khi oxi hoá aldehyde và ketone bằng thuốc thử nhẹ?',
        dap: 'Aldehyde dễ bị oxi hoá, tạo Ag hoặc Cu₂O đỏ gạch; ketone không phản ứng.',
      },
    ],
    animation: {
      title: 'Nhóm C=O phân cực và phản ứng cộng hydrogen của aldehyde, ketone',
      description:
        'Nhóm carbonyl được vẽ phóng to: hai vạch nối carbon với oxygen. Vì oxygen có độ âm điện lớn hơn nhiều, cặp electron của nối đôi bị kéo lệch về phía oxygen — dấu δ− hiện ở oxygen và dấu δ+ hiện ở carbon. Chính carbon mang điện tích dương một phần đó là nơi tác nhân mang electron tìm đến. Sau đó là phản ứng cộng tiêu biểu vào nối đôi C=O: cộng hydrogen với xúc tác Ni và đun nóng, một vạch của nối đôi biến mất, một nguyên tử H gắn vào carbon còn H kia gắn vào oxygen thành nhóm OH. Aldehyde CH₃CHO cho alcohol bậc một CH₃CH₂OH, còn ketone CH₃COCH₃ cho alcohol bậc hai CH₃CH(OH)CH₃ — khác nhau ở chỗ carbon mang OH nối với mấy carbon khác.',
      viewBoxWidth: 460,
      viewBoxHeight: 240,
      durationMs: 8000,
      loop: true,
      shapes: [
        {
          kind: 'circle',
          id: 'cc',
          cx: 150,
          cy: 66,
          r: 24,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
        },
        {
          kind: 'circle',
          id: 'oo',
          cx: 250,
          cy: 66,
          r: 24,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'cct',
          x: 150,
          y: 72,
          text: 'C',
          size: 17,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'oot',
          x: 250,
          y: 72,
          text: 'O',
          size: 17,
          anchor: 'middle',
          fill: 'accent',
        },
        {
          kind: 'line',
          id: 'nd1',
          x1: 174,
          y1: 60,
          x2: 226,
          y2: 60,
          stroke: 'primary',
          strokeWidth: 2.5,
        },
        {
          kind: 'line',
          id: 'nd2',
          x1: 174,
          y1: 72,
          x2: 226,
          y2: 72,
          stroke: 'primary',
          strokeWidth: 2.5,
          keyframes: [
            { atMs: 3900, opacity: 1 },
            { atMs: 4400, opacity: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'lk-ch',
          x1: 126,
          y1: 66,
          x2: 110,
          y2: 66,
          stroke: 'muted',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 4200, opacity: 0 },
            { atMs: 4600, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'lk-oh',
          x1: 274,
          y1: 66,
          x2: 290,
          y2: 66,
          stroke: 'muted',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 4200, opacity: 0 },
            { atMs: 4600, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'keo',
          x1: 196,
          y1: 40,
          x2: 232,
          y2: 40,
          stroke: 'accent',
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
              atMs: 1400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'keot',
          x: 196,
          y: 28,
          text: 'electron bị kéo về oxygen',
          size: 10,
          anchor: 'end',
          fill: 'muted',
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
              atMs: 1400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'dp',
          x: 150,
          y: 108,
          text: 'δ+',
          size: 14,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1600,
              opacity: 0,
            },
            {
              atMs: 2100,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'dm',
          x: 250,
          y: 108,
          text: 'δ−',
          size: 14,
          anchor: 'middle',
          fill: 'accent',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 1600,
              opacity: 0,
            },
            {
              atMs: 2100,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'tancong',
          x: 200,
          y: 130,
          text: 'carbon δ+ là nơi bị tấn công',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2200,
              opacity: 0,
            },
            {
              atMs: 2700,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'pu1',
          x: 40,
          y: 172,
          text: 'CH₃CHO + H₂',
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
              atMs: 3400,
              opacity: 0,
            },
            {
              atMs: 3800,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt1',
          x1: 160,
          y1: 168,
          x2: 216,
          y2: 168,
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
              atMs: 4200,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'mt1t',
          x: 188,
          y: 158,
          text: 'Ni, t°',
          size: 9,
          anchor: 'middle',
          fill: 'muted',
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
              atMs: 4200,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'kq1',
          x: 226,
          y: 172,
          text: 'CH₃CH₂OH',
          size: 13,
          anchor: 'start',
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
              atMs: 4600,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'kq1b',
          x: 400,
          y: 172,
          text: 'alcohol bậc I',
          size: 10,
          anchor: 'end',
          fill: 'muted',
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
              atMs: 4600,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'pu2',
          x: 40,
          y: 210,
          text: 'CH₃COCH₃ + H₂',
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
              atMs: 5200,
              opacity: 0,
            },
            {
              atMs: 5600,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'arrow',
          id: 'mt2',
          x1: 160,
          y1: 206,
          x2: 216,
          y2: 206,
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5600,
              opacity: 0,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'mt2t',
          x: 188,
          y: 196,
          text: 'Ni, t°',
          size: 9,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 5600,
              opacity: 0,
            },
            {
              atMs: 6000,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'kq2',
          x: 226,
          y: 210,
          text: 'CH₃CH(OH)CH₃',
          size: 13,
          anchor: 'start',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 6000,
              opacity: 0,
            },
            {
              atMs: 6400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'kq2b',
          x: 420,
          y: 210,
          text: 'alcohol bậc II',
          size: 10,
          anchor: 'end',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 6000,
              opacity: 0,
            },
            {
              atMs: 6400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'label',
          id: 'h-c',
          x: 101,
          y: 72,
          text: 'H',
          size: 16,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 3800, opacity: 0, dx: -18 },
            { atMs: 4200, opacity: 1 },
            { atMs: 4600, dx: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'h-o',
          x: 299,
          y: 72,
          text: 'H',
          size: 16,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 3800, opacity: 0, dx: 18 },
            { atMs: 4200, opacity: 1 },
            { atMs: 4600, dx: 0 },
          ],
        },
      ],
      captions: [
        { atMs: 0, text: 'Nối đôi C=O: oxygen âm điện mạnh hơn nên kéo lệch electron về phía nó.' },
        { atMs: 1800, text: 'Carbon mang δ+, oxygen mang δ− — đó là chỗ phản ứng xảy ra.' },
        {
          atMs: 3600,
          text: 'Cộng H₂ (Ni, t°): nối đôi C=O mở ra, một H gắn vào C, một H gắn vào O — aldehyde CH₃CHO thành alcohol bậc I.',
        },
        { atMs: 5600, text: 'Cũng phản ứng đó, ketone CH₃COCH₃ cho alcohol bậc II.' },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c6-b24',
    grade: '11',
    chapterNumber: 6,
    chapterTitle: 'Hợp chất carbonyl - Carboxylic acid',
    lessonNumber: 24,
    title: 'Carboxylic acid',
    hook:
      'Giấm ăn có vị chua thanh nhẹ nhờ chứa acetic acid. Kiến đốt truyền nọc độc formic acid gây sưng rát. ' +
      'Cả hai đều là acid hữu cơ, thuộc nhóm carboxylic acid.',
    theory:
      'KHÁI NIỆM:\n' +
      '— Carboxylic acid là hợp chất hữu cơ trong phân tử có nhóm carboxyl (−COOH) liên kết trực tiếp với nguyên tử carbon hoặc hydrogen.\n' +
      '— Công thức chung của acid no, đơn chức, mạch hở: CₙH₂ₙ₊₁COOH (n ≥ 0).\n\n' +
      'TÍNH CHẤT VẬT LÍ (Nhiệt độ sôi rất cao):\n' +
      '— Nhiệt độ sôi của carboxylic acid cao hơn alcohol có cùng phân tử khối vì các phân tử acid tạo được LIÊN KẾT HYDROGEN liên phân tử dạng vòng (dimer) hoặc dạng mạch bền vững hơn nhiều.\n\n' +
      'TÍNH CHẤT HOÁ HỌC:\n' +
      '1. Tính acid yếu (đầy đủ tính chất acid):\n' +
      '   — Làm quỳ tím hoá đỏ. Tác dụng với kim loại giải phóng H₂: 2CH₃COOH + Zn → (CH₃COO)₂Zn + H₂.\n' +
      '   — Tác dụng với muối carbonate giải phóng khí CO₂ (dùng nhận biết acid): 2CH₃COOH + CaCO₃ → (CH₃COO)₂Ca + CO₂↑ + H₂O.\n' +
      '2. Phản ứng ester hoá (phản ứng với alcohol):\n' +
      '   — Phản ứng xảy ra thuận nghịch dưới tác dụng của xúc tác H₂SO₄ đặc và đun nóng:\n' +
      "     R−COOH + R'−OH ⇌ R−COOR' (ester) + H₂O.\n" +
      '     Ví dụ: CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ (ethyl acetate, mùi chuối chín) + H₂O.',
    workedExample: {
      problem:
        'Đun nóng hỗn hợp gồm 6,0 gam acetic acid (CH₃COOH, M=60) và lượng dư ethanol (C₂H₅OH) ' +
        'với xúc tác H₂SO₄ đặc. Biết hiệu suất phản ứng ester hoá đạt 80%. Tính khối lượng ' +
        'ethyl acetate (CH₃COOC₂H₅, M=88) thu được.',
      steps: [
        'Tính số mol acetic acid ban đầu: n = 6,0 / 60 = 0,1 mol.',
        'Viết phương trình phản ứng ester hoá: CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O.',
        'Theo lý thuyết (hiệu suất 100%), số mol ester thu được bằng số mol acid phản ứng = 0,1 mol.',
        'Vì hiệu suất phản ứng chỉ đạt 80% nên số mol ester thực tế thu được là: n_thucte = 0,1 * 80% = 0,08 mol.',
        'Tính khối lượng ester thực tế thu được: m = 0,08 * 88 = 7,04 gam.',
      ],
      answer: '7,04 gam',
    },
    checkQuestions: [
      {
        prompt: 'Vì sao carboxylic acid có nhiệt độ sôi cao hơn alcohol có cùng phân tử khối?',
        choices: [
          {
            id: 'a',
            label:
              'Do phân tử phân cực hơn và tạo liên kết hydrogen bền hơn dưới dạng dimer/polymer',
          },
          { id: 'b', label: 'Do liên kết C−C của acid khó bị bẻ gãy hơn' },
          { id: 'c', label: 'Do khối lượng của nguyên tố oxygen trong acid lớn hơn' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Carboxylic acid tạo được liên kết hydrogen bền vững dạng dimer vòng kép hoặc polymer chuỗi dài, đòi hỏi nhiều nhiệt lượng để phá vỡ hơn alcohol.',
      },
      {
        prompt:
          'Phản ứng ester hoá giữa acetic acid và cồn ethanol (xúc tác H₂SO₄ đặc, nóng) tạo ra ester nào sau đây?',
        choices: [
          { id: 'methyl', label: 'Methyl acetate' },
          { id: 'ethyl', label: 'Ethyl acetate' },
          { id: 'propyl', label: 'Propyl acetate' },
        ],
        answer: { kind: 'choice', correctIds: ['ethyl'] },
        explain:
          'Acetic acid cho gốc acetate CH₃COO−, ethanol cho gốc ethyl −C₂H₅; ghép lại được ethyl acetate CH₃COOC₂H₅. Methyl acetate là ester của methanol, còn propyl acetate là ester của propan-1-ol.',
      },
    ],
    srsCards: [
      {
        hoi: 'Carboxylic acid là gì?',
        dap: 'Hợp chất hữu cơ có chứa nhóm carboxyl (−COOH) liên kết với carbon hoặc hydrogen.',
      },
      {
        hoi: 'Lớp chất hữu cơ nào có nhiệt độ sôi cao nhất trong các chất có cùng phân tử khối?',
        dap: 'Carboxylic acid (do liên kết hydrogen siêu bền dạng dimer).',
      },
      {
        hoi: 'Phản ứng ester hoá là gì?',
        dap: 'Là phản ứng thuận nghịch giữa acid và alcohol (xúc tác H₂SO₄ đặc) tạo ra ester và nước.',
      },
    ],
    animation: {
      title: 'Hai liên kết hydrogen khoá acetic acid thành dimer, đẩy nhiệt độ sôi lên 118 °C',
      description:
        'Hai phân tử acetic acid tiến lại gần nhau và quay ngược đầu: nhóm O–H của phân tử này chìa về phía oxygen của nhóm C=O ở phân tử kia, và ngược lại. Hai đường nét đứt hiện ra — hai liên kết hydrogen cùng lúc, khoá hai phân tử thành một dimer vòng tám cạnh. Muốn hoá hơi thì phải phá cả hai liên kết ấy, nên acetic acid sôi tới 118 °C. Biểu đồ bên dưới lấy mốc 0 °C: ethanol cũng có liên kết hydrogen nhưng yếu hơn và không khép thành vòng, sôi ở 78 °C; propane có phân tử khối gần bằng nhưng không có liên kết hydrogen, sôi ở −42 °C nên cột đi xuống dưới mốc. Nhiệt độ sôi không do phân tử khối một mình quyết định.',
      viewBoxWidth: 460,
      viewBoxHeight: 240,
      durationMs: 8000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'm1-d1',
          x1: 147.6,
          y1: 84.5,
          x2: 163.9,
          y2: 69.3,
          stroke: 'neutral',
          strokeWidth: 2,
          keyframes: [
            { atMs: 0, dx: -40 },
            { atMs: 2400, dx: 0 },
            { atMs: 8000, dx: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'm1-d2',
          x1: 144.1,
          y1: 80.7,
          x2: 160.4,
          y2: 65.5,
          stroke: 'neutral',
          strokeWidth: 2,
          keyframes: [
            { atMs: 0, dx: -40 },
            { atMs: 2400, dx: 0 },
            { atMs: 8000, dx: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'm1-s',
          x1: 145.9,
          y1: 93.4,
          x2: 162.1,
          y2: 108.6,
          stroke: 'neutral',
          strokeWidth: 2,
          keyframes: [
            { atMs: 0, dx: -40 },
            { atMs: 2400, dx: 0 },
            { atMs: 8000, dx: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'm1-oh',
          x1: 176,
          y1: 114,
          x2: 187,
          y2: 114,
          stroke: 'neutral',
          strokeWidth: 2,
          keyframes: [
            { atMs: 0, dx: -40 },
            { atMs: 2400, dx: 0 },
            { atMs: 8000, dx: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'm1-me',
          x1: 133,
          y1: 88,
          x2: 126,
          y2: 88,
          stroke: 'neutral',
          strokeWidth: 2,
          keyframes: [
            { atMs: 0, dx: -40 },
            { atMs: 2400, dx: 0 },
            { atMs: 8000, dx: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'm1-c',
          x: 140,
          y: 93,
          text: 'C',
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, dx: -40 },
            { atMs: 2400, dx: 0 },
            { atMs: 8000, dx: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'm1-od',
          x: 168,
          y: 67,
          text: 'O',
          size: 14,
          anchor: 'middle',
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: -40 },
            { atMs: 2400, dx: 0 },
            { atMs: 8000, dx: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'm1-os',
          x: 168,
          y: 119,
          text: 'O',
          size: 14,
          anchor: 'middle',
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: -40 },
            { atMs: 2400, dx: 0 },
            { atMs: 8000, dx: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'm1-h',
          x: 194,
          y: 119,
          text: 'H',
          size: 14,
          anchor: 'middle',
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: -40 },
            { atMs: 2400, dx: 0 },
            { atMs: 8000, dx: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'm1-me-t',
          x: 124,
          y: 93,
          text: 'H₃C',
          size: 14,
          anchor: 'end',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, dx: -40 },
            { atMs: 2400, dx: 0 },
            { atMs: 8000, dx: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'm2-d1',
          x1: 312.4,
          y1: 91.5,
          x2: 296.1,
          y2: 106.7,
          stroke: 'neutral',
          strokeWidth: 2,
          keyframes: [
            { atMs: 0, dx: 40 },
            { atMs: 2400, dx: 0 },
            { atMs: 8000, dx: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'm2-d2',
          x1: 315.9,
          y1: 95.3,
          x2: 299.6,
          y2: 110.5,
          stroke: 'neutral',
          strokeWidth: 2,
          keyframes: [
            { atMs: 0, dx: 40 },
            { atMs: 2400, dx: 0 },
            { atMs: 8000, dx: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'm2-s',
          x1: 314.1,
          y1: 82.6,
          x2: 297.9,
          y2: 67.4,
          stroke: 'neutral',
          strokeWidth: 2,
          keyframes: [
            { atMs: 0, dx: 40 },
            { atMs: 2400, dx: 0 },
            { atMs: 8000, dx: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'm2-oh',
          x1: 284,
          y1: 62,
          x2: 273,
          y2: 62,
          stroke: 'neutral',
          strokeWidth: 2,
          keyframes: [
            { atMs: 0, dx: 40 },
            { atMs: 2400, dx: 0 },
            { atMs: 8000, dx: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'm2-me',
          x1: 327,
          y1: 88,
          x2: 334,
          y2: 88,
          stroke: 'neutral',
          strokeWidth: 2,
          keyframes: [
            { atMs: 0, dx: 40 },
            { atMs: 2400, dx: 0 },
            { atMs: 8000, dx: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'm2-c',
          x: 320,
          y: 93,
          text: 'C',
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, dx: 40 },
            { atMs: 2400, dx: 0 },
            { atMs: 8000, dx: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'm2-od',
          x: 292,
          y: 119,
          text: 'O',
          size: 14,
          anchor: 'middle',
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 40 },
            { atMs: 2400, dx: 0 },
            { atMs: 8000, dx: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'm2-os',
          x: 292,
          y: 67,
          text: 'O',
          size: 14,
          anchor: 'middle',
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 40 },
            { atMs: 2400, dx: 0 },
            { atMs: 8000, dx: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'm2-h',
          x: 266,
          y: 67,
          text: 'H',
          size: 14,
          anchor: 'middle',
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 40 },
            { atMs: 2400, dx: 0 },
            { atMs: 8000, dx: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'm2-me-t',
          x: 336,
          y: 93,
          text: 'CH₃',
          size: 14,
          anchor: 'start',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, dx: 40 },
            { atMs: 2400, dx: 0 },
            { atMs: 8000, dx: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'hb1',
          x1: 176,
          y1: 62,
          x2: 259,
          y2: 62,
          stroke: 'accent',
          strokeWidth: 2,
          dash: '4 3',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 3000, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'hb2',
          x1: 201,
          y1: 114,
          x2: 284,
          y2: 114,
          stroke: 'accent',
          strokeWidth: 2,
          dash: '4 3',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 3000, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'kl',
          x: 230,
          y: 26,
          text: 'Liên kết hydrogen càng bền, càng khó bay hơi',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'hbt',
          x: 230,
          y: 140,
          text: '2 liên kết hydrogen — dimer vòng',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3000, opacity: 0 },
            { atMs: 3500, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'tx',
          x1: 60,
          y1: 200,
          x2: 420,
          y2: 200,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'moc0',
          x: 56,
          y: 204,
          text: '0 °C',
          size: 9,
          anchor: 'end',
          fill: 'muted',
        },
        {
          kind: 'rect',
          id: 'c1',
          x: 100,
          y: 200,
          w: 40,
          h: 21,
          fill: 'muted',
          rx: 2,
          origin: [120, 200],
          keyframes: [
            { atMs: 0, scaleY: 0.01, opacity: 0 },
            { atMs: 4000, scaleY: 0.01, opacity: 0 },
            { atMs: 4100, opacity: 1 },
            { atMs: 4600, scaleY: 1 },
            { atMs: 8000, scaleY: 1, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'c2',
          x: 220,
          y: 161,
          w: 40,
          h: 39,
          fill: 'primary',
          rx: 2,
          origin: [240, 200],
          keyframes: [
            { atMs: 0, scaleY: 0.01, opacity: 0 },
            { atMs: 4800, scaleY: 0.01, opacity: 0 },
            { atMs: 4900, opacity: 1 },
            { atMs: 5400, scaleY: 1 },
            { atMs: 8000, scaleY: 1, opacity: 1 },
          ],
        },
        {
          kind: 'rect',
          id: 'c3',
          x: 340,
          y: 141,
          w: 40,
          h: 59,
          fill: 'primary',
          rx: 2,
          origin: [360, 200],
          keyframes: [
            { atMs: 0, scaleY: 0.01, opacity: 0 },
            { atMs: 5600, scaleY: 0.01, opacity: 0 },
            { atMs: 5700, opacity: 1 },
            { atMs: 6200, scaleY: 1 },
            { atMs: 8000, scaleY: 1, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'c1v',
          x: 148,
          y: 216,
          text: '−42 °C',
          size: 10,
          anchor: 'start',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4400, opacity: 0 },
            { atMs: 4700, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'c2v',
          x: 240,
          y: 155,
          text: '78 °C',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5200, opacity: 0 },
            { atMs: 5500, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'c3v',
          x: 360,
          y: 135,
          text: '118 °C',
          size: 10,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 6000, opacity: 0 },
            { atMs: 6300, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'c1t',
          x: 120,
          y: 236,
          text: 'propane (M 44)',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'c2t',
          x: 240,
          y: 236,
          text: 'ethanol (M 46)',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'c3t',
          x: 360,
          y: 236,
          text: 'acetic acid (M 60)',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Hai phân tử acetic acid quay ngược đầu, ghép lại với nhau.' },
        { atMs: 2600, text: 'Chúng bị khoá bởi HAI liên kết hydrogen, thành một dimer vòng.' },
        { atMs: 4200, text: 'Propane không có liên kết hydrogen: sôi −42 °C.' },
        { atMs: 5800, text: 'Acetic acid phải phá hai liên kết mới bay hơi: sôi tới 118 °C.' },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c6-b25',
    grade: '11',
    chapterNumber: 6,
    chapterTitle: 'Hợp chất carbonyl - Carboxylic acid',
    lessonNumber: 25,
    title: 'Ôn tập chương 6 — Hợp chất carbonyl - Carboxylic acid',
    hook:
      'Ôn tập và nối lại hai lớp dẫn xuất chứa oxygen quan trọng nhất: hợp chất carbonyl và carboxylic ' +
      'acid — chặng cuối của phần hoá học hữu cơ lớp 11.',
    theory:
      'TỔNG KẾT KIẾN THỨC CHƯƠNG 6:\n' +
      "1. Hợp chất carbonyl: Có nhóm C=O. Gồm aldehyde (R−CHO) và ketone (R−CO−R').\n" +
      '   — Khử bởi H₂ tạo alcohol tương ứng.\n' +
      '   — Aldehyde có tính khử: tráng gương (tạo Ag), phản ứng Cu(OH)₂/NaOH nóng (tạo Cu₂O đỏ gạch). Ketone trơ với các phản ứng này.\n' +
      '2. Carboxylic acid (R−COOH): Có nhóm −COOH. Nhiệt độ sôi rất cao nhờ dimer liên kết hydrogen. Thể hiện đầy đủ tính acid (làm đỏ quỳ, tác dụng kim loại trước H, phản ứng giải phóng khí CO₂ từ muối carbonate). Phản ứng ester hoá với alcohol là phản ứng thuận nghịch.',
    workedExample: {
      problem:
        'Nhận biết 3 chất lỏng đựng trong các lọ mất nhãn: acetaldehyde, acetone, và acetic acid bằng ' +
        'các thuốc thử đơn giản.',
      steps: [
        'Lấy một ít mỗi chất ra ba ống nghiệm làm mẫu thử.',
        'Nhỏ dung dịch NaHCO₃ (hoặc Na₂CO₃) vào 3 mẫu thử ⇒ Mẫu sủi bọt khí CO₂ thoát ra là acetic acid.',
        'Với 2 mẫu còn lại (acetaldehyde, acetone), cho tác dụng với thuốc thử Tollens đun nóng nhẹ.',
        'Mẫu tạo lớp bạc sáng bóng tráng gương bám thành ống nghiệm là acetaldehyde.',
        'Mẫu không có hiện tượng gì là acetone.',
      ],
      answer: 'Dùng NaHCO₃ và thuốc thử Tollens',
    },
    checkQuestions: [
      {
        prompt:
          'Thuốc thử nào thích hợp nhất để phân biệt nhanh dung dịch acetic acid với dung dịch acetaldehyde và dung dịch acetone?',
        choices: [
          { id: 'quỳ', label: 'Quỳ tím hoặc dung dịch muối Na₂CO₃ (sủi bọt khí)' },
          { id: 'tollens', label: 'Thuốc thử Tollens' },
          { id: 'h2', label: 'Khí hydrogen (Ni, t°)' },
        ],
        answer: { kind: 'choice', correctIds: ['quỳ'] },
        explain:
          'Acetic acid là một acid nên làm đỏ quỳ tím và giải phóng khí CO₂ khi gặp muối carbonate; acetaldehyde và acetone không có tính acid nên không cho hiện tượng đó. Thuốc thử Tollens chỉ tách riêng được acetaldehyde, còn H₂/Ni thì cả ba chất đều không cho dấu hiệu quan sát được.',
      },
      {
        prompt: 'Chất nào sau đây tham gia phản ứng tráng bạc tạo gương sáng bóng?',
        choices: [
          { id: 'ace', label: 'Acetaldehyde (CH₃CHO)' },
          { id: 'act', label: 'Acetone (CH₃COCH₃)' },
          { id: 'aca', label: 'Acetic acid (CH₃COOH)' },
        ],
        answer: { kind: 'choice', correctIds: ['ace'] },
        explain:
          'Chỉ có aldehyde (có nhóm −CHO) mới tham gia phản ứng tráng bạc với thuốc thử Tollens. Ketone và carboxylic acid không phản ứng.',
      },
    ],
    srsCards: [
      {
        hoi: 'Sản phẩm khử aldehyde và ketone bằng H₂?',
        dap: 'Aldehyde tạo alcohol bậc I; ketone tạo alcohol bậc II.',
      },
      {
        hoi: 'Phản ứng dùng để nhận biết tính khử của aldehyde?',
        dap: 'Phản ứng tráng gương (thuốc thử Tollens) hoặc Cu(OH)₂ đun nóng.',
      },
      {
        hoi: 'Tại sao acid tác dụng với muối carbonate giải phóng khí?',
        dap: 'Vì carboxylic acid mạnh hơn carbonic acid (H₂CO₃), đẩy H₂CO₃ ra ngoài tự phân huỷ thành CO₂ và H₂O.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
