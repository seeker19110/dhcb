// lessons/hoa10c3.ts — Hoá học 10, Chương 3: Liên kết hoá học (4 bài).
// Mục lục thật: tai-lieu-sgk/SGK-Hoa/10/page_0004.png (OCR 2026-08-31).
// reviewStatus='draft' — soạn từ docs/research/kho-kien-thuc-hoa-gdpt2018.md §3, chưa duyệt.
import type { ChemLesson } from '../lessonTypes.js'

export const HOA10_C3_LESSONS: ChemLesson[] = [
  {
    id: 'hoa10-c3-b9',
    grade: '10',
    chapterNumber: 3,
    chapterTitle: 'Liên kết hoá học',
    lessonNumber: 9,
    title: 'Quy tắc octet',
    hook:
      'Khí hiếm hầu như không chịu tạo hợp chất với chất khác — chúng "hài lòng" với lớp vỏ ' +
      'electron sẵn có. Mọi nguyên tử khác đều muốn bắt chước sự "hài lòng" đó.',
    theory:
      'QUY TẮC OCTET: trong quá trình hình thành liên kết hoá học, nguyên tử có xu hướng ' +
      'nhường, nhận hoặc góp chung electron để đạt cấu hình electron bền vững của khí hiếm ' +
      'gần nhất — thường là 8 electron ở lớp ngoài cùng (riêng Hydrogen và Helium chỉ cần 2 ' +
      'electron).\n\n' +
      'Đây là quy tắc GIẢI THÍCH vì sao các nguyên tử liên kết với nhau, không phải một định ' +
      'luật vật lí tuyệt đối — có ngoại lệ (một số hợp chất của Boron, các nguyên tố d), ' +
      'nhưng đúng với đa số hợp chất phổ biến của các nguyên tố nhóm A.\n\n' +
      'Ba cách đạt octet: (1) NHƯỜNG electron (kim loại điển hình, VD Na nhường 1e), (2) NHẬN ' +
      'electron (phi kim điển hình, VD Cl nhận 1e), (3) GÓP CHUNG electron (giữa hai phi kim, ' +
      'tạo liên kết cộng hoá trị).',
    workedExample: {
      problem:
        'Nguyên tử Chlorine (Cl, Z=17) cần nhường hay nhận bao nhiêu electron để đạt cấu ' +
        'hình bền của khí hiếm gần nhất?',
      steps: [
        'Cấu hình electron của Cl: 1s²2s²2p⁶3s²3p⁵ ⇒ có 7 electron lớp ngoài cùng.',
        'Khí hiếm gần nhất là Argon (Ar) có 8 electron lớp ngoài cùng (cấu hình ...3s²3p⁶).',
        'Cl có 7e, cần thêm 1e nữa để đủ 8e ⇒ Cl có xu hướng NHẬN 1 electron.',
        'Khi nhận 1e, Cl trở thành ion Cl⁻ (mang điện tích −1), đạt cấu hình bền như Ar.',
      ],
      answer: 'Cl nhận 1 electron để tạo ion Cl⁻.',
    },
    checkQuestions: [
      {
        prompt:
          'Theo quy tắc octet, đa số nguyên tử có xu hướng đạt bao nhiêu electron ở lớp ngoài cùng?',
        answer: { kind: 'numeric', value: 8 },
        explain: 'Quy tắc octet: xu hướng đạt 8 electron lớp ngoài cùng (trừ H, He chỉ cần 2e).',
      },
      {
        prompt: 'Nguyên tử Sodium (Na, Z=11, cấu hình 1s²2s²2p⁶3s¹) đạt octet bằng cách nào?',
        choices: [
          { id: 'nhuong', label: 'Nhường 1 electron' },
          { id: 'nhan', label: 'Nhận 7 electron' },
          { id: 'gop', label: 'Góp chung electron' },
        ],
        answer: { kind: 'choice', correctIds: ['nhuong'] },
        explain:
          'Na có 1e lớp ngoài cùng — nhường đi 1e (dễ hơn nhận 7e) để lớp thứ 2 (đã đủ 8e) trở thành lớp ngoài cùng mới.',
      },
    ],
    srsCards: [
      {
        hoi: 'Quy tắc octet phát biểu gì?',
        dap: 'Nguyên tử có xu hướng đạt 8 electron lớp ngoài cùng (H, He chỉ cần 2e) bằng cách nhường/nhận/góp chung electron.',
      },
      {
        hoi: 'Ba cách nguyên tử đạt octet?',
        dap: 'Nhường electron, nhận electron, hoặc góp chung electron.',
      },
    ],
    animation: {
      title: 'Quy tắc octet: hai con đường khác nhau để cùng đạt 8 electron lớp ngoài',
      description:
        'Bên trái là nguyên tử Na có cấu hình 2, 8, 1 — lớp ngoài cùng chỉ 1 electron. Bên phải là nguyên tử Cl có cấu hình 2, 8, 7 — lớp ngoài cùng đã 7 electron. Lớp ngoài của Cl còn đúng một chỗ trống. Chấm electron duy nhất của Na rời khỏi lớp ngoài và bay sang lấp chỗ trống đó. Kết quả đếm lại: Na bỏ hẳn lớp ngoài cũ, lớp 8 electron bên trong trở thành lớp ngoài cùng nên nó vẫn đạt octet; Cl có đủ 8 electron ở lớp ngoài. Điểm mấu chốt: Na đạt octet bằng cách NHƯỜNG chứ không phải nhận thêm 7 electron — nguyên tử luôn chọn con đường ngắn hơn, mất 1 rẻ hơn nhiều so với nhận 7.',
      viewBoxWidth: 440,
      viewBoxHeight: 220,
      durationMs: 7000,
      loop: true,
      shapes: [
        {
          kind: 'circle',
          id: 'nav',
          cx: 100,
          cy: 110,
          r: 62,
          fill: 'surface',
          stroke: 'muted',
          strokeWidth: 1.2,
          dash: '4 3',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 3600, opacity: 1 },
            { atMs: 4200, opacity: 0.2 },
            { atMs: 7000, opacity: 0.2 },
          ],
        },
        {
          kind: 'circle',
          id: 'nal',
          cx: 100,
          cy: 110,
          r: 42,
          fill: 'surface',
          stroke: 'muted',
          strokeWidth: 1.2,
          dash: '4 3',
        },
        {
          kind: 'circle',
          id: 'nan',
          cx: 100,
          cy: 110,
          r: 20,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'nat',
          x: 100,
          y: 115,
          text: 'Na',
          size: 15,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'nacf',
          x: 100,
          y: 192,
          text: '2, 8, 1',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 4000, opacity: 1 },
            { atMs: 4400, opacity: 0 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'nacf2',
          x: 100,
          y: 192,
          text: '2, 8',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4200, opacity: 0 },
            { atMs: 4600, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'clv',
          cx: 330,
          cy: 110,
          r: 62,
          fill: 'surface',
          stroke: 'muted',
          strokeWidth: 1.2,
          dash: '4 3',
        },
        {
          kind: 'circle',
          id: 'cll',
          cx: 330,
          cy: 110,
          r: 42,
          fill: 'surface',
          stroke: 'muted',
          strokeWidth: 1.2,
          dash: '4 3',
        },
        {
          kind: 'circle',
          id: 'cln',
          cx: 330,
          cy: 110,
          r: 20,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'clt',
          x: 330,
          y: 115,
          text: 'Cl',
          size: 15,
          anchor: 'middle',
          fill: 'accent',
        },
        { kind: 'circle', id: 'na-l0', cx: 142, cy: 110, r: 3.5, fill: 'accent' },
        { kind: 'circle', id: 'cl-l0', cx: 372, cy: 110, r: 3.5, fill: 'accent' },
        { kind: 'circle', id: 'na-l1', cx: 129.7, cy: 139.7, r: 3.5, fill: 'accent' },
        { kind: 'circle', id: 'cl-l1', cx: 359.7, cy: 139.7, r: 3.5, fill: 'accent' },
        { kind: 'circle', id: 'na-l2', cx: 100, cy: 152, r: 3.5, fill: 'accent' },
        { kind: 'circle', id: 'cl-l2', cx: 330, cy: 152, r: 3.5, fill: 'accent' },
        { kind: 'circle', id: 'na-l3', cx: 70.3, cy: 139.7, r: 3.5, fill: 'accent' },
        { kind: 'circle', id: 'cl-l3', cx: 300.3, cy: 139.7, r: 3.5, fill: 'accent' },
        { kind: 'circle', id: 'na-l4', cx: 58, cy: 110, r: 3.5, fill: 'accent' },
        { kind: 'circle', id: 'cl-l4', cx: 288, cy: 110, r: 3.5, fill: 'accent' },
        { kind: 'circle', id: 'na-l5', cx: 70.3, cy: 80.3, r: 3.5, fill: 'accent' },
        { kind: 'circle', id: 'cl-l5', cx: 300.3, cy: 80.3, r: 3.5, fill: 'accent' },
        { kind: 'circle', id: 'na-l6', cx: 100, cy: 68, r: 3.5, fill: 'accent' },
        { kind: 'circle', id: 'cl-l6', cx: 330, cy: 68, r: 3.5, fill: 'accent' },
        { kind: 'circle', id: 'na-l7', cx: 129.7, cy: 80.3, r: 3.5, fill: 'accent' },
        { kind: 'circle', id: 'cl-l7', cx: 359.7, cy: 80.3, r: 3.5, fill: 'accent' },
        { kind: 'circle', id: 'cl-m0', cx: 373.8, cy: 66.2, r: 4.5, fill: 'accent' },
        { kind: 'circle', id: 'cl-m1', cx: 392, cy: 110, r: 4.5, fill: 'accent' },
        { kind: 'circle', id: 'cl-m2', cx: 373.8, cy: 153.8, r: 4.5, fill: 'accent' },
        { kind: 'circle', id: 'cl-m3', cx: 330, cy: 172, r: 4.5, fill: 'accent' },
        { kind: 'circle', id: 'cl-m4', cx: 286.2, cy: 153.8, r: 4.5, fill: 'accent' },
        { kind: 'circle', id: 'cl-m5', cx: 268, cy: 110, r: 4.5, fill: 'accent' },
        { kind: 'circle', id: 'cl-m6', cx: 286.2, cy: 66.2, r: 4.5, fill: 'accent' },
        {
          kind: 'label',
          id: 'clcf',
          x: 330,
          y: 192,
          text: '2, 8, 7',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 4000, opacity: 1 },
            { atMs: 4400, opacity: 0 },
            { atMs: 7000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'clcf2',
          x: 330,
          y: 192,
          text: '2, 8, 8',
          size: 12,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4200, opacity: 0 },
            { atMs: 4600, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'e',
          cx: 100,
          cy: 48,
          r: 5,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 1600, dx: 0, dy: 0 },
            { atMs: 3600, dx: 230, dy: 0 },
            { atMs: 7000, dx: 230, dy: 0 },
          ],
        },
        {
          kind: 'arrow',
          id: 'bay',
          x1: 130,
          y1: 32,
          x2: 300,
          y2: 32,
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1400, opacity: 0 },
            { atMs: 1800, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'bayt',
          x: 215,
          y: 22,
          text: '1 electron chuyển hẳn',
          size: 11,
          anchor: 'middle',
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1400, opacity: 0 },
            { atMs: 1800, opacity: 1 },
            { atMs: 7000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'naion',
          x: 100,
          y: 212,
          text: 'Na⁺ — lớp ngoài mới có 8 e',
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
              atMs: 4200,
              opacity: 0,
            },
            {
              atMs: 4800,
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
          id: 'clion',
          x: 330,
          y: 212,
          text: 'Cl⁻ — lớp ngoài đủ 8 e',
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
              atMs: 4200,
              opacity: 0,
            },
            {
              atMs: 4800,
              opacity: 1,
            },
            {
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Na có 1 electron ngoài cùng, Cl có 7 — cả hai đều chưa đạt octet.',
        },
        {
          atMs: 1600,
          text: 'Na nhường 1 electron cho Cl: con đường ngắn nhất cho cả hai.',
        },
        {
          atMs: 4200,
          text: 'Na⁺ và Cl⁻ đều có lớp ngoài cùng 8 electron — đạt quy tắc octet.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa10-c3-b10',
    grade: '10',
    chapterNumber: 3,
    chapterTitle: 'Liên kết hoá học',
    lessonNumber: 10,
    title: 'Liên kết ion',
    hook:
      'Muối ăn (NaCl) là tinh thể rắn, nóng chảy ở 801°C — bền vững đến mức bạn có thể để ' +
      'hàng thế kỷ mà không phân huỷ. Bí mật nằm ở lực hút TĨNH ĐIỆN cực mạnh giữa các ion.',
    theory:
      'LIÊN KẾT ION là liên kết được hình thành bởi LỰC HÚT TĨNH ĐIỆN giữa các ion mang điện ' +
      'tích TRÁI DẤU.\n\n' +
      'Cơ chế: kim loại điển hình (độ âm điện nhỏ) NHƯỜNG electron cho phi kim điển hình (độ ' +
      'âm điện lớn) → tạo CATION (ion dương) và ANION (ion âm) → hai ion trái dấu hút nhau ' +
      'bằng lực tĩnh điện.\n\n' +
      'Ví dụ hình thành NaCl: Na → Na⁺ + 1e (Na nhường 1e); Cl + 1e → Cl⁻ (Cl nhận 1e); sau ' +
      'đó Na⁺ và Cl⁻ hút nhau tạo tinh thể NaCl.\n\n' +
      'Liên kết ion thường hình thành giữa nguyên tố có ĐỘ ÂM ĐIỆN CHÊNH LỆCH LỚN (thường ' +
      '≥1,7 theo thang Pauling) — điển hình giữa kim loại điển hình (nhóm IA, IIA) và phi kim ' +
      'điển hình (nhóm VIA, VIIA).\n\n' +
      'Tính chất chung của hợp chất ion: nhiệt độ nóng chảy/sôi CAO, thường ở thể RẮN ở nhiệt ' +
      'độ thường, dẫn điện khi nóng chảy hoặc hoà tan trong nước (do ion di chuyển tự do).',
    workedExample: {
      problem:
        'Giải thích quá trình hình thành liên kết ion trong phân tử MgO (Magnesium oxide), ' +
        'biết Mg có Z=12, O có Z=8.',
      steps: [
        'Mg (nhóm IIA) có 2 electron lớp ngoài cùng ⇒ nhường 2e để đạt octet: Mg → Mg²⁺ + 2e.',
        'O (nhóm VIA) có 6 electron lớp ngoài cùng, cần thêm 2e để đủ 8 ⇒ nhận 2e: O + 2e → O²⁻.',
        'Mg²⁺ mang điện tích +2, O²⁻ mang điện tích −2 — hai ion trái dấu hút nhau bằng lực ' +
          'tĩnh điện, tạo liên kết ion.',
        'Kết luận: MgO là hợp chất ion, công thức Mg²⁺O²⁻ (viết gọn MgO).',
      ],
      answer: 'Mg nhường 2e tạo Mg²⁺, O nhận 2e tạo O²⁻, hai ion hút nhau tạo liên kết ion MgO.',
    },
    checkQuestions: [
      {
        prompt: 'Liên kết ion được hình thành bởi lực nào?',
        choices: [
          { id: 'a', label: 'Lực hút tĩnh điện giữa các ion trái dấu' },
          { id: 'b', label: 'Lực hấp dẫn giữa các nguyên tử' },
          { id: 'c', label: 'Sự góp chung electron' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Liên kết ion = lực hút tĩnh điện giữa cation (+) và anion (−). Góp chung electron là đặc trưng của liên kết cộng hoá trị (bài sau).',
      },
      {
        prompt: 'Liên kết ion thường hình thành giữa loại nguyên tố nào với nhau?',
        choices: [
          { id: 'a', label: 'Kim loại điển hình và phi kim điển hình' },
          { id: 'b', label: 'Hai phi kim với nhau' },
          { id: 'c', label: 'Hai kim loại với nhau' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Cần độ âm điện chênh lệch lớn — kim loại điển hình (độ âm điện nhỏ) dễ nhường electron, phi kim điển hình (độ âm điện lớn) dễ nhận electron.',
      },
    ],
    srsCards: [
      {
        hoi: 'Liên kết ion là gì?',
        dap: 'Lực hút tĩnh điện giữa các ion mang điện tích trái dấu.',
      },
      {
        hoi: 'Liên kết ion thường hình thành giữa loại nguyên tố nào?',
        dap: 'Kim loại điển hình (nhóm IA, IIA) và phi kim điển hình (nhóm VIA, VIIA).',
      },
      {
        hoi: 'Tính chất chung của hợp chất ion?',
        dap: 'Nhiệt độ nóng chảy/sôi cao, thể rắn ở nhiệt độ thường, dẫn điện khi nóng chảy/hoà tan.',
      },
    ],
    // Hoạt ảnh: electron CHUYỂN HẲN từ Na sang Cl rồi hai ion hút nhau — khác hẳn "góp chung"
    // của liên kết cộng hoá trị ở bài sau.
    animation: {
      title: 'Hình thành liên kết ion trong NaCl',
      description:
        'Bên trái là nguyên tử Na với 1 electron lớp ngoài cùng, bên phải là nguyên tử Cl với 7 electron lớp ngoài cùng. Nguyên tử Na (186 pm) to hơn nguyên tử Cl (99 pm). Electron duy nhất của Na rời hẳn sang Cl: Na mất 1 electron thành ion Na⁺, Cl nhận thêm 1 electron thành ion Cl⁻ (đủ 8 electron). Kích thước đổi theo: Na⁺ mất cả lớp vỏ ngoài nên nhỏ hẳn lại, Cl⁻ thêm electron nên phình ra. Hai ion trái dấu sau đó bị kéo lại gần nhau bằng lực hút tĩnh điện — đó chính là liên kết ion. Electron không nằm chung giữa hai nguyên tử mà thuộc hẳn về Cl.',
      viewBoxWidth: 420,
      viewBoxHeight: 200,
      durationMs: 6000,
      loop: true,
      shapes: [
        {
          kind: 'circle',
          id: 'na',
          cx: 110,
          cy: 100,
          r: 40,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 3000, opacity: 1 },
            { atMs: 3300, opacity: 0 },
            { atMs: 6000, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'na-ion-vong',
          cx: 110,
          cy: 100,
          r: 22,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, opacity: 0 },
            { atMs: 3000, opacity: 0 },
            { atMs: 3300, opacity: 1 },
            { atMs: 3500, dx: 0 },
            { atMs: 5000, dx: 62 },
            { atMs: 6000, dx: 62 },
          ],
        },
        {
          kind: 'circle',
          id: 'cl',
          cx: 310,
          cy: 100,
          r: 22,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2,
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 3000, opacity: 1 },
            { atMs: 3300, opacity: 0 },
            { atMs: 6000, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'cl-ion-vong',
          cx: 310,
          cy: 100,
          r: 39,
          fill: 'surface',
          stroke: 'accent',
          strokeWidth: 2,
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, opacity: 0 },
            { atMs: 3000, opacity: 0 },
            { atMs: 3300, opacity: 1 },
            { atMs: 3500, dx: 0 },
            { atMs: 5000, dx: -62 },
            { atMs: 6000, dx: -62 },
          ],
        },
        {
          kind: 'label',
          id: 'na-t',
          x: 110,
          y: 105,
          text: 'Na',
          size: 18,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 3000, opacity: 1 },
            { atMs: 3200, opacity: 0 },
            { atMs: 6000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'na-ion',
          x: 110,
          y: 105,
          text: 'Na⁺',
          size: 18,
          anchor: 'middle',
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, opacity: 0 },
            { atMs: 3000, opacity: 0 },
            { atMs: 3300, opacity: 1 },
            { atMs: 3500, dx: 0 },
            { atMs: 5000, dx: 62 },
            { atMs: 6000, dx: 62 },
          ],
        },
        {
          kind: 'label',
          id: 'cl-t',
          x: 310,
          y: 105,
          text: 'Cl',
          size: 18,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 3000, opacity: 1 },
            { atMs: 3200, opacity: 0 },
            { atMs: 6000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'cl-ion',
          x: 310,
          y: 105,
          text: 'Cl⁻',
          size: 18,
          anchor: 'middle',
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, dx: 0, opacity: 0 },
            { atMs: 3000, opacity: 0 },
            { atMs: 3300, opacity: 1 },
            { atMs: 3500, dx: 0 },
            { atMs: 5000, dx: -62 },
            { atMs: 6000, dx: -62 },
          ],
        },
        {
          kind: 'circle',
          id: 'e-chuyen',
          cx: 150,
          cy: 100,
          r: 6,
          fill: 'correct',
          keyframes: [
            { atMs: 0, dx: 0, opacity: 1 },
            { atMs: 1000, dx: 0 },
            { atMs: 3000, dx: 138 },
            { atMs: 3200, opacity: 1 },
            { atMs: 3400, opacity: 0 },
            { atMs: 6000, opacity: 0 },
          ],
        },
        {
          kind: 'arrow',
          id: 'mui-ten-e',
          x1: 158,
          y1: 46,
          x2: 280,
          y2: 46,
          stroke: 'muted',
          strokeWidth: 1.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 700, opacity: 0 },
            { atMs: 900, opacity: 1 },
            { atMs: 3200, opacity: 1 },
            { atMs: 3400, opacity: 0 },
            { atMs: 6000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'chu-e',
          x: 219,
          y: 34,
          text: '1 electron chuyển hẳn sang Cl',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 700, opacity: 0 },
            { atMs: 900, opacity: 1 },
            { atMs: 3200, opacity: 1 },
            { atMs: 3400, opacity: 0 },
            { atMs: 6000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'hut',
          x: 210,
          y: 178,
          text: 'lực hút tĩnh điện giữa hai ion trái dấu',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4400, opacity: 0 },
            { atMs: 5000, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
      ],
      captions: [
        { atMs: 0, text: 'Na có 1 electron lớp ngoài cùng; Cl có 7, còn thiếu đúng 1.' },
        { atMs: 1000, text: 'Electron của Na rời hẳn sang Cl — không phải góp chung.' },
        { atMs: 3300, text: 'Na thành ion Na⁺, Cl thành ion Cl⁻, cả hai đều đạt cấu hình bền.' },
        { atMs: 5000, text: 'Hai ion trái dấu hút nhau bằng lực tĩnh điện: đó là liên kết ion.' },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa10-c3-b11',
    grade: '10',
    chapterNumber: 3,
    chapterTitle: 'Liên kết hoá học',
    lessonNumber: 11,
    title: 'Liên kết cộng hoá trị',
    hook:
      'Khí oxygen (O₂) mà bạn đang hít thở không hình thành từ việc nhường-nhận electron — ' +
      'hai nguyên tử oxygen GÓP CHUNG electron với nhau, tạo ra kiểu liên kết khác hẳn liên ' +
      'kết ion.',
    theory:
      'LIÊN KẾT CỘNG HOÁ TRỊ là liên kết được hình thành giữa hai nguyên tử bằng MỘT HAY ' +
      'NHIỀU CẶP ELECTRON DÙNG CHUNG.\n\n' +
      'Thường hình thành giữa các nguyên tử của CÙNG một nguyên tố phi kim, hoặc giữa các phi ' +
      'kim có độ âm điện GẦN NHAU (chênh lệch <1,7 theo Pauling).\n\n' +
      'Hai loại liên kết cộng hoá trị:\n' +
      '— LIÊN KẾT CỘNG HOÁ TRỊ KHÔNG CỰC: cặp electron dùng chung ở CHÍNH GIỮA hai nguyên tử ' +
      '(hai nguyên tử giống hệt nhau, độ âm điện bằng nhau). Ví dụ: H₂, O₂, N₂, Cl₂.\n' +
      '— LIÊN KẾT CỘNG HOÁ TRỊ CÓ CỰC: cặp electron dùng chung LỆCH về phía nguyên tử có độ ' +
      'âm điện lớn hơn (hai nguyên tử khác nhau). Ví dụ: HCl (cặp electron lệch về Cl).\n\n' +
      'CÔNG THỨC LEWIS (công thức electron) biểu diễn liên kết bằng dấu chấm (electron riêng) ' +
      'hoặc gạch nối (cặp electron dùng chung). Một gạch nối = liên kết đơn (1 cặp e), hai ' +
      'gạch nối = liên kết đôi (2 cặp e), ba gạch nối = liên kết ba (3 cặp e).',
    workedExample: {
      problem:
        'Phân tử N₂ có liên kết ba giữa hai nguyên tử N. Giải thích vì sao N₂ rất bền, ít ' +
        'tham gia phản ứng ở điều kiện thường.',
      steps: [
        'Nguyên tử N (Z=7) có 5 electron lớp ngoài cùng, cần thêm 3e để đạt octet.',
        'Hai nguyên tử N góp chung 3 cặp electron (6 electron) để mỗi N đều đủ 8 electron lớp ' +
          'ngoài cùng ⇒ tạo LIÊN KẾT BA (N≡N).',
        'Liên kết ba có NĂNG LƯỢNG LIÊN KẾT rất lớn (khoảng 946 kJ/mol) — cần rất nhiều năng ' +
          'lượng mới phá vỡ được.',
        'Kết luận: vì liên kết ba N≡N bền vững, N₂ trơ về mặt hoá học ở điều kiện thường.',
      ],
      answer: 'N₂ có liên kết ba (N≡N) rất bền, năng lượng liên kết lớn nên khó bị phá vỡ.',
    },
    checkQuestions: [
      {
        prompt: 'Liên kết cộng hoá trị KHÔNG CỰC hình thành khi nào?',
        choices: [
          { id: 'a', label: 'Giữa hai nguyên tử giống nhau (độ âm điện bằng nhau)' },
          { id: 'b', label: 'Giữa kim loại và phi kim' },
          { id: 'c', label: 'Giữa hai phi kim khác nhau có độ âm điện chênh lệch lớn' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Không cực = cặp electron dùng chung ở chính giữa, không lệch về bên nào — xảy ra khi hai nguyên tử có độ âm điện BẰNG NHAU (cùng nguyên tố).',
      },
      {
        prompt: 'Phân tử O₂ có bao nhiêu cặp electron dùng chung (liên kết đôi O=O)?',
        answer: { kind: 'numeric', value: 2 },
        explain:
          'Liên kết đôi O=O gồm 2 cặp electron dùng chung (4 electron), giúp mỗi O đạt đủ 8 electron lớp ngoài cùng.',
      },
    ],
    srsCards: [
      {
        hoi: 'Liên kết cộng hoá trị là gì?',
        dap: 'Liên kết hình thành bằng một hay nhiều cặp electron dùng chung giữa hai nguyên tử.',
      },
      {
        hoi: 'Khác biệt giữa liên kết cộng hoá trị có cực và không cực?',
        dap: 'Không cực: cặp e dùng chung ở giữa (cùng nguyên tố). Có cực: cặp e lệch về nguyên tử có độ âm điện lớn hơn (khác nguyên tố).',
      },
      {
        hoi: 'Một gạch nối trong công thức Lewis biểu diễn gì?',
        dap: 'Một cặp electron dùng chung (liên kết đơn).',
      },
    ],
    // Hoạt ảnh: hai electron KHÔNG rời hẳn sang bên nào mà về đứng giữa — đối lập trực tiếp
    // với hoạt ảnh liên kết ion ở bài trước, giúp học sinh phân biệt hai kiểu liên kết.
    animation: {
      title: 'Hai nguyên tử H góp chung electron tạo phân tử H₂',
      description:
        'Hai nguyên tử hydrogen, mỗi nguyên tử có 1 electron, tiến lại gần nhau tới khi hai lớp vỏ xen phủ. Hai electron không chuyển hẳn về bên nào mà cùng dồn về vùng GIỮA hai hạt nhân, tạo thành một cặp electron dùng chung. Cặp electron này bị cả hai hạt nhân hút nên giữ hai nguyên tử lại với nhau — đó là liên kết cộng hoá trị, viết gọn bằng một gạch nối H–H. Vì hai nguyên tử giống hệt nhau nên cặp electron nằm chính giữa: liên kết không cực.',
      viewBoxWidth: 400,
      viewBoxHeight: 180,
      durationMs: 5000,
      loop: true,
      shapes: [
        {
          kind: 'circle',
          id: 'h1',
          cx: 120,
          cy: 90,
          r: 30,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: 55 },
            { atMs: 5000, dx: 55 },
          ],
        },
        {
          kind: 'circle',
          id: 'h2',
          cx: 280,
          cy: 90,
          r: 30,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 2,
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: -55 },
            { atMs: 5000, dx: -55 },
          ],
        },
        {
          kind: 'label',
          id: 'h1t',
          x: 120,
          y: 95,
          text: 'H',
          size: 16,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: 55 },
            { atMs: 5000, dx: 55 },
          ],
        },
        {
          kind: 'label',
          id: 'h2t',
          x: 280,
          y: 95,
          text: 'H',
          size: 16,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2500, dx: -55 },
            { atMs: 5000, dx: -55 },
          ],
        },
        {
          kind: 'circle',
          id: 'e1',
          cx: 145,
          cy: 75,
          r: 5,
          fill: 'correct',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 2500, dx: 51, dy: 11 },
            { atMs: 5000, dx: 51, dy: 11 },
          ],
        },
        {
          kind: 'circle',
          id: 'e2',
          cx: 255,
          cy: 105,
          r: 5,
          fill: 'correct',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0 },
            { atMs: 2500, dx: -51, dy: -11 },
            { atMs: 5000, dx: -51, dy: -11 },
          ],
        },
        {
          kind: 'circle',
          id: 'vung-chung',
          cx: 200,
          cy: 90,
          r: 22,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2000, opacity: 0 },
            { atMs: 2600, opacity: 0.25 },
            { atMs: 5000, opacity: 0.25 },
          ],
        },
        {
          kind: 'label',
          id: 'ghi',
          x: 200,
          y: 160,
          text: 'cặp electron dùng chung ⇒ H–H (liên kết đơn, không cực)',
          size: 11,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2800, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
      ],
      captions: [
        { atMs: 0, text: 'Mỗi nguyên tử H có 1 electron, còn thiếu 1 để đạt cấu hình bền của He.' },
        {
          atMs: 2600,
          text: 'Hai electron về vùng giữa: cả hai hạt nhân cùng "dùng chung" một cặp electron.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa10-c3-b12',
    grade: '10',
    chapterNumber: 3,
    chapterTitle: 'Liên kết hoá học',
    lessonNumber: 12,
    title: 'Liên kết hydrogen và tương tác van der Waals',
    hook:
      'Nước sôi ở 100°C, trong khi H₂S (cấu trúc tương tự nhưng thay O bằng S) chỉ sôi ở ' +
      '−60°C. Chênh lệch khổng lồ này đến từ một loại "liên kết yếu" đặc biệt chỉ nước và vài ' +
      'chất mới có.',
    theory:
      'LIÊN KẾT HYDROGEN là liên kết YẾU hình thành giữa nguyên tử HYDROGEN (đã liên kết cộng ' +
      'hoá trị với nguyên tử có độ âm điện lớn như F, O, N) với một nguyên tử có độ âm điện ' +
      'lớn (F, O, N) khác — thường ở PHÂN TỬ KHÁC (liên kết hydrogen liên phân tử).\n\n' +
      'Ví dụ điển hình: liên kết hydrogen giữa các phân tử nước (H₂O), giữa các phân tử ' +
      'alcohol (R-OH), giữa các phân tử ammonia (NH₃).\n\n' +
      'Vai trò: liên kết hydrogen tuy YẾU HƠN NHIỀU liên kết cộng hoá trị/ion, nhưng đủ mạnh ' +
      'để làm TĂNG nhiệt độ sôi/nóng chảy đáng kể so với các chất có khối lượng phân tử tương ' +
      'đương nhưng không có liên kết hydrogen (như H₂S so với H₂O).\n\n' +
      'TƯƠNG TÁC VAN DER WAALS là lực hút RẤT YẾU giữa các phân tử (yếu hơn cả liên kết ' +
      'hydrogen), xuất hiện ở MỌI phân tử, tăng theo khối lượng phân tử và diện tích tiếp ' +
      'xúc bề mặt. Đây là lý do các khí hiếm (không có liên kết hoá học nào khác) vẫn hoá ' +
      'lỏng được ở nhiệt độ đủ thấp.',
    workedExample: {
      problem:
        'Vì sao nhiệt độ sôi của H₂O (100°C) cao hơn hẳn nhiệt độ sôi của H₂S (−60°C), dù cả ' +
        'hai đều có công thức dạng H₂X?',
      steps: [
        'Oxygen (trong H₂O) có độ âm điện lớn (3,44) và kích thước nhỏ, còn Sulfur (trong ' +
          'H₂S) có độ âm điện nhỏ hơn nhiều (2,58) và kích thước lớn hơn.',
        'Vì vậy các phân tử H₂O hình thành được LIÊN KẾT HYDROGEN liên phân tử mạnh (H liên ' +
          'kết với O của phân tử H₂O khác).',
        'H₂S KHÔNG hình thành liên kết hydrogen đáng kể (S có độ âm điện chưa đủ lớn) — các ' +
          'phân tử H₂S chỉ hút nhau bằng tương tác van der Waals yếu.',
        'Kết luận: liên kết hydrogen của H₂O cần nhiều năng lượng hơn để phá vỡ khi đun sôi ' +
          '⇒ H₂O có nhiệt độ sôi cao hơn hẳn H₂S.',
      ],
      answer:
        'Vì H₂O có liên kết hydrogen liên phân tử mạnh, còn H₂S chỉ có tương tác van der Waals yếu.',
    },
    checkQuestions: [
      {
        prompt:
          'Liên kết hydrogen hình thành khi nguyên tử H liên kết cộng hoá trị với nguyên tử có tính chất gì?',
        choices: [
          { id: 'a', label: 'Độ âm điện lớn (như F, O, N)' },
          { id: 'b', label: 'Độ âm điện nhỏ (kim loại kiềm)' },
          { id: 'c', label: 'Bất kỳ nguyên tử nào' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Liên kết hydrogen cần H liên kết với nguyên tử có độ âm điện LỚN (F, O, N) — tạo ra sự phân cực mạnh cần cho liên kết hydrogen.',
      },
      {
        prompt: 'Tương tác van der Waals so với liên kết hydrogen thì mạnh hay yếu hơn?',
        choices: [
          { id: 'yeu', label: 'Yếu hơn' },
          { id: 'manh', label: 'Mạnh hơn' },
        ],
        answer: { kind: 'choice', correctIds: ['yeu'] },
        explain:
          'Thứ tự độ mạnh: liên kết ion/cộng hoá trị > liên kết hydrogen > tương tác van der Waals.',
      },
    ],
    srsCards: [
      {
        hoi: 'Liên kết hydrogen hình thành khi nào?',
        dap: 'Khi H (đã liên kết với F/O/N) tương tác với một nguyên tử F/O/N khác — thường ở phân tử khác.',
      },
      {
        hoi: 'Vì sao nhiệt độ sôi của H₂O cao hơn H₂S dù cùng dạng H₂X?',
        dap: 'Vì H₂O có liên kết hydrogen liên phân tử mạnh, H₂S không có.',
      },
      {
        hoi: 'Tương tác van der Waals có ở đâu?',
        dap: 'Ở MỌI phân tử, tăng theo khối lượng phân tử và diện tích tiếp xúc.',
      },
    ],
    animation: {
      title: 'Liên kết hydrogen giữa hai phân tử nước',
      description:
        'Hai phân tử nước, mỗi phân tử gồm một nguyên tử O (lớn) nối với hai nguyên tử H (nhỏ), góc H–O–H khoảng 104,5°. Vì O hút electron mạnh nên phía O mang một phần điện tích âm (δ−), còn phía H mang một phần điện tích dương (δ+). Khi hai phân tử lại gần nhau, nguyên tử H mang δ+ của phân tử này bị hút về phía nguyên tử O mang δ− của phân tử kia, tạo thành một liên kết hydrogen — vẽ bằng đường nét đứt. Liên kết này yếu hơn liên kết cộng hoá trị bên trong phân tử, nhưng có rất nhiều nên phải tốn nhiều nhiệt mới tách rời được các phân tử nước: đó là lý do nước sôi ở 100 °C.',
      viewBoxWidth: 420,
      viewBoxHeight: 200,
      durationMs: 5000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'b1a',
          x1: 120,
          y1: 100,
          x2: 107.5,
          y2: 148.4,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'b1b',
          x1: 120,
          y1: 100,
          x2: 170,
          y2: 100,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'b2a',
          x1: 255,
          y1: 100,
          x2: 285.6,
          y2: 60.5,
          stroke: 'neutral',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, dx: 50 },
            { atMs: 2000, dx: 0 },
            { atMs: 5000, dx: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'b2b',
          x1: 255,
          y1: 100,
          x2: 285.6,
          y2: 139.5,
          stroke: 'neutral',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, dx: 50 },
            { atMs: 2000, dx: 0 },
            { atMs: 5000, dx: 0 },
          ],
        },
        { kind: 'circle', id: 'o1', cx: 120, cy: 100, r: 24, fill: 'primary' },
        { kind: 'circle', id: 'h1a', cx: 107.5, cy: 148.4, r: 12, fill: 'muted' },
        { kind: 'circle', id: 'h1b', cx: 170, cy: 100, r: 12, fill: 'muted' },
        {
          kind: 'circle',
          id: 'o2',
          cx: 255,
          cy: 100,
          r: 24,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 50 },
            { atMs: 2000, dx: 0 },
            { atMs: 5000, dx: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'h2a',
          cx: 285.6,
          cy: 60.5,
          r: 12,
          fill: 'muted',
          keyframes: [
            { atMs: 0, dx: 50 },
            { atMs: 2000, dx: 0 },
            { atMs: 5000, dx: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'h2b',
          cx: 285.6,
          cy: 139.5,
          r: 12,
          fill: 'muted',
          keyframes: [
            { atMs: 0, dx: 50 },
            { atMs: 2000, dx: 0 },
            { atMs: 5000, dx: 0 },
          ],
        },
        {
          kind: 'line',
          id: 'hbond',
          x1: 183,
          y1: 100,
          x2: 230,
          y2: 100,
          stroke: 'accent',
          strokeWidth: 2.5,
          dash: '6 5',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2000, opacity: 0 },
            { atMs: 2300, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'o1t',
          x: 120,
          y: 105,
          text: 'O',
          size: 14,
          anchor: 'middle',
          fill: 'surface',
        },
        {
          kind: 'label',
          id: 'o2t',
          x: 255,
          y: 105,
          text: 'O',
          size: 14,
          anchor: 'middle',
          fill: 'surface',
          keyframes: [
            { atMs: 0, dx: 50 },
            { atMs: 2000, dx: 0 },
            { atMs: 5000, dx: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'do1',
          x: 120,
          y: 68,
          text: 'δ−',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'label',
          id: 'dh1',
          x: 170,
          y: 82,
          text: 'δ+',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'do2',
          x: 255,
          y: 144,
          text: 'δ−',
          size: 13,
          anchor: 'middle',
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 50 },
            { atMs: 2000, dx: 0 },
            { atMs: 5000, dx: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'ghi-hb',
          x: 195,
          y: 70,
          text: 'liên kết hydrogen',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 2200, opacity: 0 },
            { atMs: 2500, opacity: 1 },
            { atMs: 5000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'ghi-cht',
          x: 210,
          y: 178,
          text: 'nét liền = liên kết cộng hoá trị (mạnh)',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'ghi-cht2',
          x: 210,
          y: 194,
          text: 'nét đứt = liên kết hydrogen (yếu hơn)',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
      ],
      captions: [
        { atMs: 0, text: 'Phía O mang δ−, phía H mang δ+ do O hút electron mạnh hơn.' },
        {
          atMs: 2100,
          text: 'H (δ+) của phân tử này bị hút về O (δ−) của phân tử kia: liên kết hydrogen.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
]
