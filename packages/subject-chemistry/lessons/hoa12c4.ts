// lessons/hoa12c4.ts — Hoá học 12, Chương 4: Polymer (3 bài).
// Đối chiếu mục lục thật: tai-lieu-sgk/SGK-Hoa/12/page_0004.png (OCR 2026-08-31).
// reviewStatus='draft' — soạn từ docs/research/kho-kien-thuc-hoa-gdpt2018.md §3, chưa duyệt.
import type { ChemLesson } from '../lessonTypes.js'

export const HOA12_C4_LESSONS: ChemLesson[] = [
  {
    id: 'hoa12-c4-b12',
    grade: '12',
    chapterNumber: 4,
    chapterTitle: 'Polymer',
    lessonNumber: 12,
    title: 'Đại cương về polymer',
    hook:
      'Túi nilon, sợi vải nhân tạo và lốp xe cao su đều cấu tạo từ các phân tử khổng lồ có hàng vạn nguyên tử liên kết với nhau.' +
      ' Chúng được các nhà hoá học gọi chung là polymer.',
    theory:
      'KHÁI NIỆM VÀ PHÂN LOẠI:\n' +
      '— Polymer là những hợp chất có khối lượng phân tử rất lớn do nhiều đơn vị cơ bản (gọi là mắt xích) liên kết với nhau tạo nên. Monomer là những phân tử nhỏ phản ứng tạo nên polymer.\n' +
      '— Phân loại theo nguồn gốc:\n' +
      '  1. Polymer thiên nhiên: Có sẵn trong tự nhiên (như tinh bột, cellulose, bông, tơ tằm, cao su thiên nhiên).\n' +
      '  2. Polymer tổng hợp: Do con người tự tổng hợp từ các chất hoá học (như PE, PVC, nylon-6,6, cao su Buna).\n' +
      '  3. Polymer bán tổng hợp (nhân tạo): Lấy polymer thiên nhiên chế hoá hoá học một phần (như tơ viscose, tơ acetate).\n\n' +
      'ĐẶC ĐIỂM CẤU TRÚC:\n' +
      '— Mạch không phân nhánh: như PE, PVC, amylose, cellulose.\n' +
      '— Mạch phân nhánh: như amylopectin, glycogen.\n' +
      '— Mạch mạng không gian (khâu mạch): như cao su lưu hoá, nhựa bakelite.\n\n' +
      'PHƯƠNG PHÁP TỔNG HỢP:\n' +
      '1. Phản ứng trùng hợp: Là quá trình kết hợp nhiều phân tử nhỏ giống nhau hoặc tương tự nhau (monomer) thành phân tử lớn (polymer), không tách ra phân tử nhỏ nào.\n' +
      '   — Điều kiện monomer: Phân tử phải có liên kết bội kém bền (C=C, C≡C) hoặc vòng kém bền (như ethylene, vinyl chloride, styrene).\n' +
      '2. Phản ứng trùng ngưng: Là quá trình kết hợp nhiều phân tử monomer thành phân tử polymer đồng thời giải phóng các phân tử nhỏ khác (thường là H₂O).\n' +
      '   — Điều kiện monomer: Phân tử phải chứa ít nhất hai nhóm chức có khả năng phản ứng với nhau (ví dụ: acid adipic và hexamethylenediamine).',
    workedExample: {
      problem:
        'Một phân tử polyethylene (PE) có hệ số trùng hợp (số mắt xích n) là 10000. ' +
        'Tính khối lượng phân tử của phân tử polymer này.',
      steps: [
        'Mắt xích cấu tạo của PE là −CH₂−CH₂−.',
        'Tính khối lượng của một mắt xích (monomer ethylene C₂H₄): M = 12 * 2 + 1 * 4 = 28 g/mol.',
        'Hệ số trùng hợp n = 10000, nghĩa là phân tử gồm 10000 mắt xích nối với nhau.',
        'Tính khối lượng phân tử polymer: M_polymer = n * M_matxich = 10000 * 28 = 280000 g/mol.',
      ],
      answer: '280000 g/mol',
    },
    checkQuestions: [
      {
        prompt: 'Tơ viscose và tơ acetate thuộc loại polymer nào sau đây?',
        choices: [
          { id: 'thiennhien', label: 'Polymer thiên nhiên' },
          { id: 'tonghop', label: 'Polymer tổng hợp' },
          { id: 'bantonghop', label: 'Polymer bán tổng hợp (nhân tạo)' },
        ],
        answer: { kind: 'choice', correctIds: ['bantonghop'] },
        explain:
          'Tơ viscose và tơ acetate đi từ polymer thiên nhiên là cellulose, rồi được chế hoá thêm bằng hoá chất (CS₂ hoặc anhydride acetic). Vì mạch polymer có sẵn trong tự nhiên nên chúng không phải polymer tổng hợp; vì đã bị biến đổi hoá học nên cũng không còn là polymer thiên nhiên. Loại nằm giữa hai nhóm đó gọi là polymer bán tổng hợp.',
      },
      {
        prompt: 'Phản ứng trùng ngưng khác phản ứng trùng hợp ở điểm cốt lõi nào?',
        choices: [
          { id: 'a', label: 'Trùng ngưng giải phóng thêm các phân tử nhỏ khác (như nước)' },
          { id: 'b', label: 'Trùng ngưng cần áp suất cao hơn' },
          { id: 'c', label: 'Trùng ngưng tạo ra polymer có khối lượng phân tử nhỏ hơn nhiều' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Phản ứng trùng ngưng luôn tách ra thêm phân tử nhỏ (thường là H₂O) bên cạnh polymer, còn trùng hợp thì không. Áp suất cao chỉ là điều kiện của một số phản ứng cụ thể, không phải dấu hiệu phân biệt; khối lượng phân tử polymer thì cả hai cách đều rất lớn.',
      },
    ],
    srsCards: [
      { hoi: 'Đơn vị nhỏ phản ứng tạo nên polymer gọi là gì?', dap: 'Monomer.' },
      {
        hoi: 'Ba dạng cấu trúc mạch polymer?',
        dap: 'Mạch không phân nhánh, mạch phân nhánh, và mạch mạng không gian.',
      },
      {
        hoi: 'Điều kiện phân tử monomer tham gia phản ứng trùng hợp?',
        dap: 'Có chứa liên kết bội kém bền (như C=C) hoặc vòng kém bền dễ mở.',
      },
    ],
    animation: {
      title: 'Phản ứng trùng hợp: nối đôi mở ra và các mắt xích nối thành mạch dài',
      description:
        'Hàng trên là bốn phân tử ethylene CH₂=CH₂ rời rạc, mỗi phân tử có một nối đôi vẽ bằng hai vạch. Khi có xúc tác và nhiệt độ, một vạch của mỗi nối đôi biến mất — cặp electron π mở ra, để lại ở mỗi đầu một mối nối còn trống. Các phân tử lập tức xích lại và các mối nối trống bắt tay nhau tạo thành một mạch liên tục, kéo dài mãi: đó là polyethylene (–CH₂–CH₂–)ₙ. Chú ý hai điều: không có nguyên tử nào bị tách ra khỏi hệ nên công thức của mắt xích trùng với công thức monomer, và hệ số n là số mắt xích chứ không phải hệ số cân bằng thông thường. Điều kiện để trùng hợp được là monomer phải có nối đôi hoặc vòng kém bền — chỉ chất có sẵn liên kết mở được mới nối chuỗi.',
      viewBoxWidth: 470,
      viewBoxHeight: 230,
      durationMs: 8000,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'm1',
          x: 80,
          y: 60,
          text: 'CH₂=CH₂',
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 2200, opacity: 1 },
            { atMs: 2600, opacity: 0 },
            { atMs: 8000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'm2',
          x: 180,
          y: 60,
          text: 'CH₂=CH₂',
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 2200, opacity: 1 },
            { atMs: 2600, opacity: 0 },
            { atMs: 8000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'm3',
          x: 280,
          y: 60,
          text: 'CH₂=CH₂',
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 2200, opacity: 1 },
            { atMs: 2600, opacity: 0 },
            { atMs: 8000, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'm4',
          x: 380,
          y: 60,
          text: 'CH₂=CH₂',
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, opacity: 1 },
            { atMs: 2200, opacity: 1 },
            { atMs: 2600, opacity: 0 },
            { atMs: 8000, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'd1t',
          cx: 46,
          cy: 55,
          r: 4,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, dy: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2600, opacity: 1, dy: 0 },
            { atMs: 4600, dy: 80 },
            { atMs: 5000, opacity: 1 },
            { atMs: 5400, opacity: 0 },
            { atMs: 8000, dy: 80, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'd1p',
          cx: 114,
          cy: 55,
          r: 4,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, dy: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2600, opacity: 1, dy: 0 },
            { atMs: 4600, dy: 80 },
            { atMs: 5000, opacity: 1 },
            { atMs: 5400, opacity: 0 },
            { atMs: 8000, dy: 80, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'd2t',
          cx: 146,
          cy: 55,
          r: 4,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, dy: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2600, opacity: 1, dy: 0 },
            { atMs: 4600, dy: 80 },
            { atMs: 5000, opacity: 1 },
            { atMs: 5400, opacity: 0 },
            { atMs: 8000, dy: 80, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'd2p',
          cx: 214,
          cy: 55,
          r: 4,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, dy: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2600, opacity: 1, dy: 0 },
            { atMs: 4600, dy: 80 },
            { atMs: 5000, opacity: 1 },
            { atMs: 5400, opacity: 0 },
            { atMs: 8000, dy: 80, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'd3t',
          cx: 246,
          cy: 55,
          r: 4,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, dy: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2600, opacity: 1, dy: 0 },
            { atMs: 4600, dy: 80 },
            { atMs: 5000, opacity: 1 },
            { atMs: 5400, opacity: 0 },
            { atMs: 8000, dy: 80, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'd3p',
          cx: 314,
          cy: 55,
          r: 4,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, dy: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2600, opacity: 1, dy: 0 },
            { atMs: 4600, dy: 80 },
            { atMs: 5000, opacity: 1 },
            { atMs: 5400, opacity: 0 },
            { atMs: 8000, dy: 80, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'd4t',
          cx: 346,
          cy: 55,
          r: 4,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, dy: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2600, opacity: 1, dy: 0 },
            { atMs: 4600, dy: 80 },
            { atMs: 5000, opacity: 1 },
            { atMs: 5400, opacity: 0 },
            { atMs: 8000, dy: 80, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'd4p',
          cx: 414,
          cy: 55,
          r: 4,
          fill: 'accent',
          opacity: 0,
          keyframes: [
            { atMs: 0, dy: 0, opacity: 0 },
            { atMs: 2400, opacity: 0 },
            { atMs: 2600, opacity: 1, dy: 0 },
            { atMs: 4600, dy: 80 },
            { atMs: 5000, opacity: 1 },
            { atMs: 5400, opacity: 0 },
            { atMs: 8000, dy: 80, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'u1',
          x: 80,
          y: 60,
          text: 'CH₂–CH₂',
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, dy: 0, opacity: 0 },
            { atMs: 2200, opacity: 0 },
            { atMs: 2600, opacity: 1, dy: 0 },
            { atMs: 4600, dy: 80 },
            { atMs: 8000, dy: 80 },
          ],
        },
        {
          kind: 'label',
          id: 'u2',
          x: 180,
          y: 60,
          text: 'CH₂–CH₂',
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, dy: 0, opacity: 0 },
            { atMs: 2200, opacity: 0 },
            { atMs: 2600, opacity: 1, dy: 0 },
            { atMs: 4600, dy: 80 },
            { atMs: 8000, dy: 80 },
          ],
        },
        {
          kind: 'label',
          id: 'u3',
          x: 280,
          y: 60,
          text: 'CH₂–CH₂',
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, dy: 0, opacity: 0 },
            { atMs: 2200, opacity: 0 },
            { atMs: 2600, opacity: 1, dy: 0 },
            { atMs: 4600, dy: 80 },
            { atMs: 8000, dy: 80 },
          ],
        },
        {
          kind: 'label',
          id: 'u4',
          x: 380,
          y: 60,
          text: 'CH₂–CH₂',
          size: 14,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, dy: 0, opacity: 0 },
            { atMs: 2200, opacity: 0 },
            { atMs: 2600, opacity: 1, dy: 0 },
            { atMs: 4600, dy: 80 },
            { atMs: 8000, dy: 80 },
          ],
        },
        {
          kind: 'label',
          id: 'mo',
          x: 235,
          y: 26,
          text: 'xúc tác, t°, p: nối đôi mở ra',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1600, opacity: 0 },
            { atMs: 2200, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'l1',
          x1: 112,
          y1: 135,
          x2: 148,
          y2: 135,
          stroke: 'primary',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5000, opacity: 0 },
            { atMs: 5500, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'l2',
          x1: 212,
          y1: 135,
          x2: 248,
          y2: 135,
          stroke: 'primary',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5000, opacity: 0 },
            { atMs: 5500, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'l3',
          x1: 312,
          y1: 135,
          x2: 348,
          y2: 135,
          stroke: 'primary',
          strokeWidth: 2.5,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5000, opacity: 0 },
            { atMs: 5500, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'l0',
          x1: 24,
          y1: 135,
          x2: 46,
          y2: 135,
          stroke: 'primary',
          strokeWidth: 2.5,
          dash: '4 3',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5000, opacity: 0 },
            { atMs: 5500, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'line',
          id: 'l4',
          x1: 414,
          y1: 135,
          x2: 446,
          y2: 135,
          stroke: 'primary',
          strokeWidth: 2.5,
          dash: '4 3',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 5000, opacity: 0 },
            { atMs: 5500, opacity: 1 },
            { atMs: 8000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'kq',
          x: 235,
          y: 180,
          text: '(–CH₂–CH₂–)ₙ  polyethylene',
          size: 15,
          anchor: 'middle',
          fill: 'primary',
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
              atMs: 6100,
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
          x: 235,
          y: 204,
          text: 'mắt xích có cùng công thức với monomer, không mất nguyên tử nào',
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
              atMs: 6400,
              opacity: 0,
            },
            {
              atMs: 6900,
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
          id: 'dk',
          x: 235,
          y: 226,
          text: 'Điều kiện: monomer phải có nối đôi hoặc vòng kém bền',
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
              atMs: 6900,
              opacity: 0,
            },
            {
              atMs: 7400,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Bốn phân tử ethylene rời rạc, mỗi phân tử một nối đôi.',
        },
        {
          atMs: 2200,
          text: 'Xúc tác và nhiệt mở nối đôi, mỗi đầu để lại một mối nối trống.',
        },
        {
          atMs: 5000,
          text: 'Các mối nối trống bắt tay nhau thành mạch dài polyethylene.',
        },
        {
          atMs: 6400,
          text: 'Không nguyên tử nào bị tách ra: mắt xích trùng công thức monomer.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa12-c4-b13',
    grade: '12',
    chapterNumber: 4,
    chapterTitle: 'Polymer',
    lessonNumber: 13,
    title: 'Vật liệu polymer',
    hook:
      'Chất dẻo làm đồ gia dụng, tơ sợi dệt quần áo ấm, cao su làm lốp xe chịu lực, keo dán gắn kết vật liệu. ' +
      'Mọi vật liệu hiện đại này đều được làm từ polymer chế hoá phù hợp.',
    theory:
      'CHẤT DẺO (Plastics):\n' +
      '— Là những vật liệu polymer có tính dẻo (bị biến dạng khi chịu tác dụng của nhiệt, áp lực bên ngoài và vẫn giữ nguyên sự biến dạng đó khi thôi tác dụng).\n' +
      '— Các chất dẻo phổ biến: Polyethylene (PE), Poly(vinyl chloride) (PVC), Poly(methyl methacrylate) (PMMA — thuỷ tinh hữu cơ, tên thương mại Plexiglas), Poly(tetrafluoroethylene) (Teflon - chảo chống dính).\n\n' +
      'TƠ (Fibers):\n' +
      '— Là những vật liệu polymer hình sợi dài, mảnh, độ bền kéo cao.\n' +
      '— Tơ polyamide (chứa nhóm −CO−NH−): tơ nylon-6, nylon-6,6. Kém bền với nhiệt, acid, base do nhóm amide bị thuỷ phân.\n' +
      '   * Nylon-6,6 trùng ngưng từ acid adipic HOOC−(CH₂)₄−COOH và hexamethylenediamine H₂N−(CH₂)₆−NH₂.\n' +
      '— Tơ vinylic: tơ nitron (hay olon), dai, ấm, giữ nhiệt tốt, dùng dệt len nhân tạo, trùng hợp từ acrylonitrile CH₂=CH−CN.\n\n' +
      'CAO SU (Rubbers):\n' +
      '— Là vật liệu polymer có tính đàn hồi (khả năng khôi phục hình dạng ban đầu sau khi chịu tác dụng lực).\n' +
      '— Cao su thiên nhiên: polymer của isoprene (cis-polyisoprene).\n' +
      '— Cao su tổng hợp: Cao su Buna (trùng hợp butadiene), cao su Buna-S (đồng trùng hợp butadiene và styrene), cao su Buna-N (đồng trùng hợp butadiene và acrylonitrile).\n' +
      '— Lưu hoá cao su: Trộn cao su với lưu huỳnh và đun nóng, tạo cầu nối disulfide (−S−S−) giữa các mạch polymer, chuyển cấu trúc mạch thẳng thành cấu trúc mạng không gian bền vững, đàn hồi hơn, chịu nhiệt tốt hơn, khó tan hơn.',
    workedExample: {
      problem:
        'Viết phương trình phản ứng hoá học trùng hợp vinyl chloride (CH₂=CHCl) tạo thành polymer polyvinyl chloride (PVC).',
      steps: [
        'Xác định monomer: vinyl chloride (CH₂=CHCl).',
        'Phản ứng trùng hợp mở liên kết đôi C=C thành liên kết đơn và nối các mắt xích lại với nhau dưới tác dụng của nhiệt độ (t°), áp suất (p), xúc tác (xt).',
        'Viết phương trình phản ứng: n CH₂=CHCl → −(CH₂−CHCl)−ₙ.',
      ],
      answer: 'n CH₂=CHCl → −(CH₂−CHCl)−ₙ',
    },
    checkQuestions: [
      {
        prompt: 'Tơ nylon-6,6 thuộc loại tơ nào sau đây?',
        choices: [
          { id: 'polyester', label: 'Tơ polyester' },
          { id: 'polyamide', label: 'Tơ polyamide' },
          { id: 'acetate', label: 'Tơ acetate' },
        ],
        answer: { kind: 'choice', correctIds: ['polyamide'] },
        explain:
          'Nylon-6,6 được điều chế bằng cách trùng ngưng diamine và diacid, hình thành các nhóm amide −CO−NH− trên mạch nên thuộc loại tơ polyamide.',
      },
      {
        prompt: 'Monomer dùng để trùng hợp sản xuất cao su Buna là chất nào?',
        choices: [
          { id: 'isoprene', label: 'Isoprene' },
          { id: 'butadiene', label: 'Buta-1,3-diene (butadiene)' },
          { id: 'chloroprene', label: 'Chloroprene' },
        ],
        answer: { kind: 'choice', correctIds: ['butadiene'] },
        explain:
          'Tên Buna ghép từ Butadiene và Na (natri, chất xúc tác), nên monomer của nó là buta-1,3-diene CH₂=CH−CH=CH₂. Isoprene trùng hợp cho cao su isoprene (giống cao su thiên nhiên), còn chloroprene cho cao su chloroprene.',
      },
    ],
    srsCards: [
      { hoi: 'Mắt xích cấu tạo của tơ nitron (olon)?', dap: '−(CH₂−CH(CN))−.' },
      {
        hoi: 'Mục đích của việc lưu hoá cao su là gì?',
        dap: 'Tạo cầu nối disulfide chuyển cấu trúc mạch thẳng sang mạng không gian, giúp tăng tính đàn hồi, chịu nhiệt, chịu mài mòn.',
      },
      {
        hoi: 'Tại sao quần áo dệt từ tơ nylon không nên giặt bằng xà phòng có tính kiềm mạnh hoặc ủi ở nhiệt độ cao?',
        dap: 'Vì tơ polyamide dễ bị thuỷ phân trong môi trường kiềm và kém bền nhiệt.',
      },
    ],
    animation: {
      title: 'Mạch thẳng hay mạng không gian quyết định polymer chảy được hay không',
      description:
        'Bên trái là polymer mạch thẳng như polyethylene: các mạch nằm cạnh nhau, chỉ giữ nhau bằng lực yếu giữa các phân tử. Khi đun nóng, các mạch trượt qua nhau và cả khối mềm ra rồi chảy, để nguội lại đông cứng — đó là polymer nhiệt dẻo, tái chế được bằng cách nấu chảy rồi đúc lại. Bên phải là cao su đã lưu hoá: giữa các mạch có những cầu nối lưu huỳnh –S–S– khoá chặt mạch này vào mạch kia thành một mạng không gian. Khi đun nóng, các mạch chỉ rung tại chỗ mà không trượt đi đâu được, khối vật liệu không chảy mà cháy phân huỷ — đó là polymer nhiệt rắn, không tái chế bằng nấu chảy được. Cùng một loại mạch carbon, thêm vài cầu nối là đổi hẳn tính chất sử dụng.',
      viewBoxWidth: 470,
      viewBoxHeight: 240,
      durationMs: 8000,
      loop: true,
      shapes: [
        {
          kind: 'label',
          id: 'tt1',
          x: 118,
          y: 32,
          text: 'Mạch thẳng — nhiệt dẻo',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'polyline',
          id: 'a1',
          points: [
            [36, 70],
            [76, 62],
            [116, 70],
            [156, 62],
            [196, 70],
          ],
          stroke: 'primary',
          strokeWidth: 2.5,
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2600, dx: 0 },
            { atMs: 5000, dx: 24 },
            { atMs: 8000, dx: 24 },
          ],
        },
        {
          kind: 'polyline',
          id: 'a2',
          points: [
            [36, 102],
            [76, 94],
            [116, 102],
            [156, 94],
            [196, 102],
          ],
          stroke: 'primary',
          strokeWidth: 2.5,
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2600, dx: 0 },
            { atMs: 5000, dx: -24 },
            { atMs: 8000, dx: -24 },
          ],
        },
        {
          kind: 'polyline',
          id: 'a3',
          points: [
            [36, 134],
            [76, 126],
            [116, 134],
            [156, 126],
            [196, 134],
          ],
          stroke: 'primary',
          strokeWidth: 2.5,
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 2600, dx: 0 },
            { atMs: 5000, dx: 28 },
            { atMs: 8000, dx: 28 },
          ],
        },
        {
          kind: 'label',
          id: 'at',
          x: 118,
          y: 166,
          text: 'các mạch trượt qua nhau',
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
              atMs: 5000,
              opacity: 0,
            },
            {
              atMs: 5500,
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
          id: 'at2',
          x: 118,
          y: 186,
          text: 'nóng thì chảy, nguội thì cứng lại',
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
              atMs: 5000,
              opacity: 0,
            },
            {
              atMs: 5500,
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
          id: 'at3',
          x: 118,
          y: 210,
          text: 'tái chế được bằng cách nấu chảy',
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
              atMs: 6000,
              opacity: 0,
            },
            {
              atMs: 6500,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 'chia',
          x1: 236,
          y1: 40,
          x2: 236,
          y2: 224,
          stroke: 'muted',
          strokeWidth: 1.5,
          dash: '5 5',
        },
        {
          kind: 'label',
          id: 'tt2',
          x: 352,
          y: 32,
          text: 'Mạng không gian — nhiệt rắn',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'polyline',
          id: 'b1',
          points: [
            [272, 70],
            [312, 62],
            [352, 70],
            [392, 62],
            [432, 70],
          ],
          stroke: 'primary',
          strokeWidth: 2.5,
          keyframes: [
            {
              atMs: 0,
              dx: 0,
            },
            {
              atMs: 5000,
              dx: 0,
            },
            {
              atMs: 5600,
              dx: 3,
            },
            {
              atMs: 6200,
              dx: -3,
            },
            {
              atMs: 6800,
              dx: 0,
            },
            {
              atMs: 8000,
              dx: 0,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'b2',
          points: [
            [272, 102],
            [312, 94],
            [352, 102],
            [392, 94],
            [432, 102],
          ],
          stroke: 'primary',
          strokeWidth: 2.5,
          keyframes: [
            {
              atMs: 0,
              dx: 0,
            },
            {
              atMs: 5000,
              dx: 0,
            },
            {
              atMs: 5600,
              dx: -3,
            },
            {
              atMs: 6200,
              dx: 3,
            },
            {
              atMs: 6800,
              dx: 0,
            },
            {
              atMs: 8000,
              dx: 0,
            },
          ],
        },
        {
          kind: 'polyline',
          id: 'b3',
          points: [
            [272, 134],
            [312, 126],
            [352, 134],
            [392, 126],
            [432, 134],
          ],
          stroke: 'primary',
          strokeWidth: 2.5,
          keyframes: [
            {
              atMs: 0,
              dx: 0,
            },
            {
              atMs: 5000,
              dx: 0,
            },
            {
              atMs: 5600,
              dx: 3,
            },
            {
              atMs: 6200,
              dx: -3,
            },
            {
              atMs: 6800,
              dx: 0,
            },
            {
              atMs: 8000,
              dx: 0,
            },
          ],
        },
        {
          kind: 'line',
          id: 's1',
          x1: 312,
          y1: 64,
          x2: 312,
          y2: 92,
          stroke: 'accent',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2400,
              opacity: 0,
            },
            {
              atMs: 2900,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 's2',
          x1: 392,
          y1: 64,
          x2: 392,
          y2: 92,
          stroke: 'accent',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2400,
              opacity: 0,
            },
            {
              atMs: 2900,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 's3',
          x1: 312,
          y1: 96,
          x2: 312,
          y2: 124,
          stroke: 'accent',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2400,
              opacity: 0,
            },
            {
              atMs: 2900,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
        {
          kind: 'line',
          id: 's4',
          x1: 392,
          y1: 96,
          x2: 392,
          y2: 124,
          stroke: 'accent',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 2400,
              opacity: 0,
            },
            {
              atMs: 2900,
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
          id: 'st',
          x: 352,
          y: 166,
          text: 'cầu nối lưu huỳnh –S–S– khoá mạch',
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
              atMs: 2400,
              opacity: 0,
            },
            {
              atMs: 2900,
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
          id: 'st2',
          x: 352,
          y: 186,
          text: 'đun nóng chỉ rung, không trượt được',
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
              atMs: 5600,
              opacity: 0,
            },
            {
              atMs: 6100,
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
          id: 'st3',
          x: 352,
          y: 210,
          text: 'không nấu chảy tái chế được',
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
              atMs: 6400,
              opacity: 0,
            },
            {
              atMs: 6900,
              opacity: 1,
            },
            {
              atMs: 8000,
              opacity: 1,
            },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Polymer mạch thẳng: các mạch chỉ nằm cạnh nhau, giữ nhau bằng lực yếu.',
        },
        {
          atMs: 2400,
          text: 'Cao su lưu hoá: cầu nối –S–S– khoá các mạch thành mạng không gian.',
        },
        {
          atMs: 5000,
          text: 'Đun nóng mạch thẳng: các mạch trượt qua nhau, vật liệu chảy ra.',
        },
        {
          atMs: 5800,
          text: 'Đun nóng mạng không gian: mạch chỉ rung tại chỗ, không chảy.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa12-c4-b14',
    grade: '12',
    chapterNumber: 4,
    chapterTitle: 'Polymer',
    lessonNumber: 14,
    title: 'Ôn tập chương 4 — Polymer',
    hook:
      'Chương 4 đi một mạch từ những phân tử nhỏ là monomer đến các vật liệu quen thuộc quanh ta: chất dẻo, tơ sợi và cao su. ' +
      'Bài này hệ thống lại toàn bộ chặng đường đó.',
    theory:
      'HỆ THỐNG HOÁ KIẾN THỨC CHƯƠNG 4:\n' +
      '1. Khái niệm polymer: phân tử rất lớn gồm n mắt xích giống nhau nối lại. Có 3 nguồn gốc: thiên nhiên, tổng hợp, bán tổng hợp (viscose, acetate). Có 3 dạng mạch: mạch thẳng, mạch phân nhánh (amylopectin), mạng không gian (cao su lưu hoá, bakelite).\n' +
      '2. Phương pháp tổng hợp: Trùng hợp (mở liên kết bội của monomer rồi nối lại, không tách phân tử nhỏ nào); Trùng ngưng (nối các monomer có ít nhất hai nhóm chức, đồng thời tách ra phân tử nhỏ, thường là H₂O).\n' +
      '3. Vật liệu polymer: Chất dẻo (PE, PVC, PMMA, Teflon); Cao su (thiên nhiên isoprene, tổng hợp Buna, Buna-S, Buna-N); Tơ (thiên nhiên bông/tơ tằm, bán tổng hợp viscose/acetate, tổng hợp nylon-6, nylon-6,6, tơ nitron).',
    workedExample: {
      problem:
        'Để tổng hợp được 125 kg polyvinyl chloride (PVC, mắt xích M = 62,5) từ vinyl chloride (CH₂=CHCl, M = 62,5) ' +
        'với hiệu suất phản ứng trùng hợp đạt 90%, ta cần bao nhiêu kg monomer vinyl chloride?',
      steps: [
        'Viết phương trình trùng hợp: n CH₂=CHCl → −(CH₂−CHCl)−ₙ. Khối lượng mắt xích bằng khối lượng monomer.',
        'Về mặt lý thuyết (hiệu suất 100%), khối lượng monomer cần dùng bằng khối lượng polymer tạo thành = 125 kg.',
        'Vì hiệu suất phản ứng đạt 90%, lượng monomer thực tế cần dùng phải lớn hơn để bù vào hao hụt.',
        'Tính khối lượng monomer thực tế cần dùng: m = 125 / 90% = 125 / 0,9 ≈ 138,89 kg.',
      ],
      answer: '138,89 kg',
    },
    checkQuestions: [
      {
        prompt: 'Mắt xích của polymer polyvinyl chloride (PVC) có công thức là gì?',
        choices: [
          { id: 'pe', label: '−CH₂−CH₂−' },
          { id: 'pvc', label: '−CH₂−CHCl−' },
          { id: 'ps', label: '−CH₂−CH(C₆H₅)−' },
        ],
        answer: { kind: 'choice', correctIds: ['pvc'] },
        explain:
          'PVC trùng hợp từ vinyl chloride CH₂=CHCl tạo mạch polymer có mắt xích lặp lại là −CH₂−CHCl−.',
      },
      {
        prompt: 'Polymer nào sau đây có cấu trúc mạch phân nhánh?',
        choices: [
          { id: 'cellulose', label: 'Cellulose' },
          { id: 'amylopectin', label: 'Amylopectin (trong tinh bột)' },
          { id: 'caosu', label: 'Cao su lưu hoá' },
        ],
        answer: { kind: 'choice', correctIds: ['amylopectin'] },
        explain:
          'Cellulose mạch thẳng, cao su lưu hoá cấu trúc mạng không gian khâu mạch, chỉ có amylopectin (và glycogen) cấu trúc mạch phân nhánh.',
      },
    ],
    srsCards: [
      { hoi: 'Monomer của nhựa PE?', dap: 'Ethylene (CH₂=CH₂).' },
      {
        hoi: 'Tơ nitron dệt len nhân tạo được điều chế bằng phản ứng nào?',
        dap: 'Phản ứng trùng hợp acrylonitrile (CH₂=CH−CN).',
      },
      {
        hoi: 'Tơ polyamide kém bền trong môi trường nào? Vì sao?',
        dap: 'Kém bền trong acid và kiềm nóng, vì liên kết amide −CO−NH− trên mạch bị thuỷ phân làm đứt mạch polymer.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
