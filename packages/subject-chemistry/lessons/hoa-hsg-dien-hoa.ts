// lessons/hoa-hsg-dien-hoa.ts — NHÁNH NÂNG CAO (track 'advanced'): chuyên đề bồi dưỡng học
// sinh giỏi về ĐIỆN HOÁ HỌC, gắn vào chương 5 (Pin điện và điện phân) + 6 (Đại cương kim loại)
// của Hoá 12.
//
// Ba cấp tăng dần:
//   hsg-truong    — thế điện cực chuẩn, sức điện động E°pin, dự đoán chiều phản ứng.
//   hsg-tinh      — điện phân: định luật Faraday, thứ tự phóng điện ở hai điện cực.
//   hsg-quoc-gia  — phương trình Nernst, quan hệ ΔG° = −nFE° và E° ↔ K, ăn mòn điện hoá.
//
// Vì sao lớp 12 mới có chuyên đề này (đặc tả docs/specs/2026-09-14-chuyen-de-hsg-hoa-12.md):
// audit 2026-09-14 phát hiện Hoá 12 có 0 chuyên đề HSG trong khi lớp 10 có 1 và lớp 11 có 2.
// Bài quốc gia ở đây cố ý nối với HSG quốc gia lớp 10 (`hoa10-c92-b1`, ΔG° = −RT·lnK) để khép
// vòng nhiệt động — điện hoá qua cả ba lớp.
//
// reviewStatus='draft' — nội dung tự soạn, chưa qua giáo viên Hoá duyệt.
import type { ChemLesson } from '../lessonTypes.js'

export const HOA_HSG_DIEN_HOA_LESSONS: ChemLesson[] = [
  {
    id: 'hoa12-c90-b1',
    grade: '12',
    chapterNumber: 90,
    chapterTitle: 'Chuyên đề HSG — Điện hoá học',
    lessonNumber: 1,
    title: 'HSG cấp trường: Thế điện cực chuẩn và sức điện động của pin',
    hook:
      'Cắm một thanh kẽm và một thanh đồng vào quả chanh rồi nối vào đồng hồ đo, kim nhích lên ' +
      'khoảng 1,1 V. Đổi thanh kẽm sang thanh bạc thì số đo tụt xuống. Không có gì thần bí ở ' +
      'đây cả: con số ấy đọc thẳng ra được từ một bảng tra, và bài này dạy bạn cách đọc.',
    theory:
      'THẾ ĐIỆN CỰC CHUẨN E° là gì? Mỗi cặp oxi hoá – khử (dạng Mⁿ⁺/M) có một "độ thèm ' +
      'electron" riêng, đo bằng vôn và quy chiếu về điện cực hydrogen chuẩn được gán E° = 0,00 V. ' +
      'Điều kiện chuẩn: nồng độ ion 1 M, áp suất khí 1 bar, nhiệt độ 25 °C.\n\n' +
      'E° càng DƯƠNG thì dạng oxi hoá càng dễ nhận electron (tính oxi hoá càng mạnh). E° càng ÂM ' +
      'thì dạng khử càng dễ nhường electron (kim loại càng hoạt động). Vài giá trị cần thuộc:\n\n' +
      '    E°(K⁺/K) = −2,92 V   E°(Zn²⁺/Zn) = −0,76 V   E°(Fe²⁺/Fe) = −0,44 V\n' +
      '    E°(2H⁺/H₂) = 0,00 V  E°(Cu²⁺/Cu) = +0,34 V   E°(Ag⁺/Ag) = +0,80 V\n\n' +
      'Dãy hoạt động hoá học của kim loại mà bạn học ở lớp dưới chính là dãy E° sắp tăng dần — ' +
      'nay có thêm CON SỐ chứ không chỉ là thứ tự.\n\n' +
      'SỨC ĐIỆN ĐỘNG CỦA PIN. Ghép hai cặp lại thành pin Galvani: cực có E° lớn hơn làm CATOT ' +
      '(xảy ra sự khử, cực dương), cực có E° nhỏ hơn làm ANOT (xảy ra sự oxi hoá, cực âm):\n\n' +
      '    E°pin = E°(catot) − E°(anot)\n\n' +
      'Vì đã chọn catot là cực có E° lớn hơn nên E°pin LUÔN DƯƠNG. Nếu bạn tính ra số âm thì ' +
      'không phải "pin âm" — mà là bạn gán nhầm hai cực.\n\n' +
      'BA ĐIỀU ĐỀ HSG HAY SIẾT, thuộc kỹ kẻo mất điểm oan:\n\n' +
      '1. E° KHÔNG nhân theo hệ số. Nhân đôi cả phương trình thì ΔG° nhân đôi nhưng E° giữ ' +
      'nguyên, vì E° là đại lượng cường tính (tính trên mỗi electron trao đổi), giống như nhiệt ' +
      'độ không cộng lại khi đổ chung hai cốc nước.\n' +
      '2. Đảo chiều phản ứng thì E đổi dấu.\n' +
      '3. Dự đoán chiều: phản ứng oxi hoá – khử tự xảy ra ở điều kiện chuẩn khi E°pin > 0, tức ' +
      'là chất oxi hoá của cặp có E° LỚN sẽ phản ứng với chất khử của cặp có E° NHỎ. Quy tắc ' +
      'alpha (α) mà bạn hay vẽ chéo chính là câu này viết gọn.',
    workedExample: {
      problem:
        'Lập pin từ hai cặp Zn²⁺/Zn (E° = −0,76 V) và Cu²⁺/Cu (E° = +0,34 V). Xác định cực ' +
        'dương, cực âm, viết phản ứng tổng và tính E°pin.',
      steps: [
        'So sánh E°: +0,34 V > −0,76 V nên cặp Cu²⁺/Cu có tính oxi hoá mạnh hơn.',
        'Gán cực: Cu là CATOT (cực dương, xảy ra sự khử); Zn là ANOT (cực âm, xảy ra sự oxi hoá).',
        'Viết hai nửa phản ứng: anot Zn → Zn²⁺ + 2e; catot Cu²⁺ + 2e → Cu.',
        'Cộng lại, electron triệt tiêu: Zn + Cu²⁺ → Zn²⁺ + Cu.',
        'Tính: E°pin = E°(catot) − E°(anot) = 0,34 − (−0,76) = 1,10 V.',
        'Kiểm lại ý nghĩa: E°pin > 0 nên phản ứng tự xảy ra — đúng thực tế, nhúng thanh kẽm vào ' +
          'dung dịch CuSO₄ thì đồng bám lên kẽm.',
      ],
      answer:
        'Cực âm (anot) là Zn, cực dương (catot) là Cu; Zn + Cu²⁺ → Zn²⁺ + Cu; E°pin = 1,10 V.',
    },
    checkQuestions: [
      {
        prompt:
          'Tính sức điện động chuẩn của pin Zn–Ag, biết E°(Zn²⁺/Zn) = −0,76 V và ' +
          'E°(Ag⁺/Ag) = +0,80 V (đơn vị vôn, chỉ nhập số).',
        answer: { kind: 'numeric', value: 1.56, tolerance: { mode: 'absolute', eps: 0.02 } },
        explain:
          'Cặp Ag⁺/Ag có E° lớn hơn nên bạc là catot, kẽm là anot. E°pin = E°(catot) − E°(anot) ' +
          '= 0,80 − (−0,76) = 1,56 V. Chú ý dấu trừ trước số âm: trừ đi −0,76 là CỘNG 0,76, đây ' +
          'là chỗ mất điểm phổ biến nhất của dạng bài này.',
      },
      {
        // Câu BẪY trọng tâm: nhân hệ số vào E°.
        prompt:
          'Phản ứng Cu²⁺ + 2e → Cu có E° = +0,34 V. Nếu nhân đôi cả phương trình thành ' +
          '2Cu²⁺ + 4e → 2Cu thì giá trị E° mới bằng bao nhiêu?',
        choices: [
          { id: 'gap_doi', label: '+0,68 V (gấp đôi)' },
          { id: 'giu_nguyen', label: '+0,34 V (không đổi)' },
          { id: 'mot_nua', label: '+0,17 V (một nửa)' },
          { id: 'doi_dau', label: '−0,34 V (đổi dấu)' },
        ],
        answer: { kind: 'choice', correctIds: ['giu_nguyen'] },
        explain:
          'Bẫy là nhân E° theo hệ số như nhân ΔH. E° là đại lượng CƯỜNG TÍNH — nó đo hiệu điện ' +
          'thế trên mỗi electron trao đổi, không phải tổng năng lượng, nên nhân đôi phương trình ' +
          'thì E° giữ nguyên +0,34 V. Cái nhân đôi theo hệ số là ΔG° = −nFE° (vì n tăng gấp đôi). ' +
          'So sánh cho dễ nhớ: đổ chung hai cốc nước 40 °C thì được nước 40 °C chứ không phải 80 °C.',
      },
      {
        prompt:
          'Cho E°(Cu²⁺/Cu) = +0,34 V và E°(Ag⁺/Ag) = +0,80 V. Ở điều kiện chuẩn, phản ứng nào ' +
          'sau đây TỰ XẢY RA?',
        choices: [
          { id: 'cu_ag', label: 'Cu + 2Ag⁺ → Cu²⁺ + 2Ag' },
          { id: 'ag_cu', label: '2Ag + Cu²⁺ → 2Ag⁺ + Cu' },
          { id: 'ca_hai', label: 'Cả hai đều tự xảy ra' },
          { id: 'khong', label: 'Không phản ứng nào tự xảy ra' },
        ],
        answer: { kind: 'choice', correctIds: ['cu_ag'] },
        explain:
          'Chất oxi hoá của cặp có E° LỚN (Ag⁺) phản ứng với chất khử của cặp có E° NHỎ (Cu). ' +
          'Kiểm bằng số: chiều Cu + 2Ag⁺ có E°pin = 0,80 − 0,34 = +0,46 V > 0 nên tự xảy ra; ' +
          'chiều ngược lại cho −0,46 V < 0 nên không. Lưu ý hệ số 2 trước Ag⁺ không hề ảnh hưởng ' +
          'tới E°pin — nó chỉ để cân bằng electron.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức tính sức điện động chuẩn của pin?',
        dap: 'E°pin = E°(catot) − E°(anot); catot là cực có E° lớn hơn nên E°pin luôn dương.',
      },
      {
        hoi: 'Nhân đôi phương trình thì E° thay đổi thế nào?',
        dap: 'Không đổi — E° là đại lượng cường tính. Chỉ ΔG° = −nFE° mới nhân đôi theo n.',
      },
      {
        hoi: 'Điều kiện để phản ứng oxi hoá – khử tự xảy ra ở điều kiện chuẩn?',
        dap: 'E°pin > 0: chất oxi hoá của cặp có E° lớn phản ứng với chất khử của cặp có E° nhỏ.',
      },
    ],
    // Cảnh trả lời câu hỏi "electron đi đường nào": chúng chạy trong DÂY DẪN NGOÀI từ anot Zn
    // sang catot Cu, còn trong dung dịch chỉ có ion di chuyển qua cầu muối — hiểu chỗ này thì
    // không còn nhầm chiều electron với chiều dòng điện quy ước nữa.
    animation: {
      title: 'Pin Galvani Zn–Cu: electron chạy trong dây ngoài từ anot sang catot',
      description:
        'Bên trái là thanh kẽm nhúng trong dung dịch ZnSO₄, bên phải là thanh đồng trong dung dịch CuSO₄; hai cốc nối với nhau bằng cầu muối, hai thanh kim loại nối qua dây dẫn có vôn kế. Vì E°(Zn²⁺/Zn) = −0,76 V nhỏ hơn E°(Cu²⁺/Cu) = +0,34 V nên kẽm nhường electron: Zn → Zn²⁺ + 2e, thanh kẽm mòn dần và ion Zn²⁺ tan vào dung dịch — đó là anot, cực âm. Các hạt electron trong hoạt ảnh chạy dọc dây dẫn PHÍA NGOÀI, từ thanh kẽm lên qua vôn kế rồi xuống thanh đồng, chứ không hề đi xuyên qua dung dịch. Tới catot, chúng được ion Cu²⁺ nhận: Cu²⁺ + 2e → Cu, đồng bám thêm vào điện cực. Mũi tên màu khác chỉ chiều dòng điện quy ước, ngược chiều electron. Trong cầu muối KCl, ion Cl⁻ đi về cốc kẽm và ion K⁺ đi về cốc đồng để hai dung dịch luôn trung hoà điện. Vôn kế chỉ E°pin = 0,34 − (−0,76) = 1,10 V.',
      viewBoxWidth: 440,
      viewBoxHeight: 268,
      durationMs: 4500,
      loop: true,
      shapes: [
        // ── Khung cốc + dung dịch ──
        {
          kind: 'polyline',
          id: 'coc-trai',
          points: [
            [40, 110],
            [40, 220],
            [160, 220],
            [160, 110],
          ],
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'polyline',
          id: 'coc-phai',
          points: [
            [280, 110],
            [280, 220],
            [400, 220],
            [400, 110],
          ],
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'rect',
          id: 'dung-dich-trai',
          x: 42,
          y: 125,
          w: 116,
          h: 93,
          fill: 'muted',
          opacity: 0.15,
        },
        {
          kind: 'rect',
          id: 'dung-dich-phai',
          x: 282,
          y: 125,
          w: 116,
          h: 93,
          fill: 'accent',
          opacity: 0.3,
        },
        // ── Hai điện cực ──
        { kind: 'rect', id: 'dien-cuc-zn', x: 90, y: 60, w: 14, h: 110, fill: 'muted' },
        { kind: 'rect', id: 'dien-cuc-cu', x: 336, y: 60, w: 14, h: 110, fill: 'warn' },
        // ── Mạch ngoài: dây dẫn + vôn kế ──
        {
          kind: 'polyline',
          id: 'day-dan',
          points: [
            [97, 60],
            [97, 30],
            [343, 30],
            [343, 60],
          ],
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'circle',
          id: 'von-ke',
          cx: 220,
          cy: 30,
          r: 18,
          fill: 'surface',
          stroke: 'neutral',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'nhan-von-ke',
          x: 220,
          y: 36,
          text: 'V',
          size: 15,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-epin',
          x: 220,
          y: 62,
          text: 'E°pin = 1,10 V',
          size: 11,
          anchor: 'middle',
          fill: 'primary',
        },
        // ── Chiều electron (dây ngoài) và chiều dòng điện quy ước (ngược lại) ──
        {
          kind: 'arrow',
          id: 'mui-ten-electron',
          x1: 120,
          y1: 18,
          x2: 190,
          y2: 18,
          stroke: 'primary',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'nhan-electron',
          x: 155,
          y: 11,
          text: 'e⁻',
          size: 11,
          anchor: 'middle',
          fill: 'primary',
        },
        {
          kind: 'arrow',
          id: 'mui-ten-dong-dien',
          x1: 320,
          y1: 18,
          x2: 250,
          y2: 18,
          stroke: 'accent',
          strokeWidth: 2,
        },
        {
          kind: 'label',
          id: 'nhan-dong-dien',
          x: 285,
          y: 11,
          text: 'I (quy ước)',
          size: 10,
          anchor: 'middle',
          fill: 'accent',
        },
        // ── Ba hạt electron chạy nối tiếp nhau dọc dây dẫn ngoài ──
        {
          kind: 'circle',
          id: 'electron-1',
          cx: 97,
          cy: 52,
          r: 5,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 1 },
            { atMs: 800, dx: 0, dy: -22 },
            { atMs: 2400, dx: 246, dy: -22 },
            { atMs: 3200, dx: 246, dy: 0, opacity: 1 },
            { atMs: 3600, dx: 246, dy: 0, opacity: 0 },
            { atMs: 4500, dx: 0, dy: 0, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'electron-2',
          cx: 97,
          cy: 52,
          r: 5,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 0 },
            { atMs: 600, dx: 0, dy: 0, opacity: 1 },
            { atMs: 1400, dx: 0, dy: -22 },
            { atMs: 3000, dx: 246, dy: -22 },
            { atMs: 3800, dx: 246, dy: 0, opacity: 1 },
            { atMs: 4200, dx: 246, dy: 0, opacity: 0 },
            { atMs: 4500, dx: 246, dy: 0, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'electron-3',
          cx: 97,
          cy: 52,
          r: 5,
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 0 },
            { atMs: 1200, dx: 0, dy: 0, opacity: 1 },
            { atMs: 2000, dx: 0, dy: -22 },
            { atMs: 3600, dx: 246, dy: -22 },
            { atMs: 4400, dx: 246, dy: 0, opacity: 1 },
            { atMs: 4500, dx: 246, dy: 0, opacity: 1 },
          ],
        },
        // ── Trong dung dịch: Zn²⁺ tan ra khỏi anot, Cu²⁺ bám vào catot ──
        {
          kind: 'circle',
          id: 'ion-zn',
          cx: 110,
          cy: 150,
          r: 6,
          fill: 'neutral',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 0 },
            { atMs: 900, dx: 0, dy: 0, opacity: 1 },
            { atMs: 3000, dx: 28, dy: 30, opacity: 1 },
            { atMs: 4500, dx: 40, dy: 45, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'ion-cu',
          cx: 312,
          cy: 168,
          r: 6,
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0, dy: 0, opacity: 1 },
            { atMs: 3000, dx: 22, dy: -40, opacity: 1 },
            { atMs: 3600, dx: 24, dy: -45, opacity: 0 },
            { atMs: 4500, dx: 0, dy: 0, opacity: 0 },
          ],
        },
        // ── Cầu muối ──
        {
          kind: 'polyline',
          id: 'cau-muoi',
          points: [
            [140, 150],
            [140, 92],
            [300, 92],
            [300, 150],
          ],
          stroke: 'muted',
          strokeWidth: 12,
          opacity: 0.35,
        },
        {
          kind: 'label',
          id: 'nhan-cau-muoi',
          x: 220,
          y: 82,
          text: 'Cầu muối (KCl)',
          size: 10,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'ion-cl',
          x: 200,
          y: 96,
          text: 'Cl⁻',
          size: 9,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 1500, dx: 0, dy: 0, opacity: 0 },
            { atMs: 1700, opacity: 1 },
            { atMs: 2500, dx: -60 },
            { atMs: 3500, dy: 52 },
            { atMs: 3800, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'ion-k',
          x: 240,
          y: 96,
          text: 'K⁺',
          size: 9,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 1500, dx: 0, dy: 0, opacity: 0 },
            { atMs: 1700, opacity: 1 },
            { atMs: 2500, dx: 60 },
            { atMs: 3500, dy: 52 },
            { atMs: 3800, opacity: 0 },
          ],
        },
        // ── Nhãn điện cực và dung dịch ──
        {
          kind: 'label',
          id: 'nhan-zn',
          x: 72,
          y: 76,
          text: 'Zn',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-cu',
          x: 368,
          y: 76,
          text: 'Cu',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-dd-trai',
          x: 100,
          y: 212,
          text: 'dd ZnSO₄',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-dd-phai',
          x: 340,
          y: 212,
          text: 'dd CuSO₄',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
        {
          kind: 'label',
          id: 'nhan-anot',
          x: 100,
          y: 242,
          text: 'Anot (−): Zn → Zn²⁺ + 2e',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-catot',
          x: 340,
          y: 242,
          text: 'Catot (+): Cu²⁺ + 2e → Cu',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-cau-muoi-y',
          x: 220,
          y: 258,
          text: 'Cầu muối: Cl⁻ về cốc kẽm, K⁺ về cốc đồng — giữ hai dung dịch trung hoà điện',
          size: 10,
          anchor: 'middle',
          fill: 'muted',
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Pin Galvani Zn–Cu: thanh kẽm trong dung dịch ZnSO₄, thanh đồng trong CuSO₄, nối nhau bằng dây dẫn có vôn kế và một cầu muối.',
        },
        {
          atMs: 700,
          text: 'E°(Zn²⁺/Zn) = −0,76 V nhỏ hơn E°(Cu²⁺/Cu) = +0,34 V nên kẽm nhường electron: Zn → Zn²⁺ + 2e. Đó là anot, cực âm, và thanh kẽm mòn dần.',
        },
        {
          atMs: 1800,
          text: 'Electron KHÔNG đi xuyên qua dung dịch — chúng chạy trong dây dẫn ngoài, từ anot Zn qua vôn kế sang catot Cu.',
        },
        {
          atMs: 2700,
          text: 'Tới catot, electron được ion Cu²⁺ trong dung dịch nhận: Cu²⁺ + 2e → Cu, đồng bám thêm vào thanh đồng nên điện cực này nặng lên.',
        },
        {
          atMs: 3400,
          text: 'Chiều dòng điện quy ước ngược chiều electron: trong dây ngoài nó đi từ cực dương (Cu) sang cực âm (Zn).',
        },
        {
          atMs: 4100,
          text: 'Cầu muối cho ion di chuyển (Cl⁻ về cốc kẽm, K⁺ về cốc đồng) để hai dung dịch luôn trung hoà điện — thiếu nó điện tích dồn lại và pin tắt. Vôn kế chỉ E°pin = 0,34 − (−0,76) = 1,10 V.',
        },
      ],
    },
    track: 'advanced',
    advancedTier: 'hsg-truong',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa12-c91-b1',
    grade: '12',
    chapterNumber: 91,
    chapterTitle: 'Chuyên đề HSG — Điện hoá học',
    lessonNumber: 1,
    title: 'HSG cấp tỉnh: Điện phân, định luật Faraday và thứ tự phóng điện',
    hook:
      'Một chiếc vòi sen mạ chrome và một tấm nhôm anod hoá đều ra đời trong bể điện phân, tính ' +
      'tiền điện theo đúng một công thức. Nhưng đề thi cấp tỉnh hiếm khi hỏi thẳng công thức ' +
      'ấy — nó hỏi ở điện cực đó chất nào phóng điện trước, và đấy mới là chỗ phân loại.',
    theory:
      'ĐIỆN PHÂN là dùng dòng điện một chiều ép phản ứng oxi hoá – khử xảy ra theo chiều KHÔNG ' +
      'tự diễn ra. Ngược hẳn với pin: pin biến hoá năng thành điện năng, điện phân thì ngược lại. ' +
      'Quy ước điện cực cũng đảo so với trực giác của nhiều bạn:\n\n' +
      '    CATOT (cực âm, nối cực âm nguồn) — xảy ra sự KHỬ\n' +
      '    ANOT  (cực dương)                — xảy ra sự OXI HOÁ\n\n' +
      'Mẹo nhớ chung cho cả pin lẫn điện phân: "catot – khử, anot – oxi hoá" luôn đúng; chỉ có ' +
      'DẤU của điện cực là đổi giữa hai loại thiết bị.\n\n' +
      'ĐỊNH LUẬT FARADAY. Khối lượng chất thoát ra ở điện cực:\n\n' +
      '    m = (A·I·t)/(n·F)    với F = 96 500 C/mol\n\n' +
      'A là khối lượng mol nguyên tử (g/mol), I cường độ dòng (ampe), t thời gian (giây), n số ' +
      'electron trao đổi. Dạng hay dùng hơn khi bài có nhiều điện cực: tính TỔNG SỐ MOL ELECTRON ' +
      'đã đi qua mạch\n\n' +
      '    nₑ = I·t/F\n\n' +
      'rồi chia cho số electron mỗi chất cần. Vì mạch nối tiếp nên nₑ ở hai điện cực BẰNG NHAU — ' +
      'đây là "bảo toàn electron" phiên bản điện phân, và là chìa khoá của mọi bài nhiều bình ' +
      'điện phân mắc nối tiếp.\n\n' +
      'THỨ TỰ PHÓNG ĐIỆN — phần làm rụng thí sinh. Trong dung dịch nước, nước cũng tham gia ' +
      'tranh phóng điện:\n\n' +
      'Ở CATOT, ion kim loại từ Al³⁺ trở về trước trong dãy hoạt động (K⁺, Na⁺, Ca²⁺, Mg²⁺, ' +
      'Al³⁺) KHÔNG bị khử trong dung dịch nước — nước bị khử thay: 2H₂O + 2e → H₂ + 2OH⁻. Chỉ ' +
      'ion kim loại sau Al³⁺ mới bị khử thành kim loại.\n\n' +
      'Ở ANOT, nếu anot trơ (than chì, Pt): các anion đơn giản Cl⁻, Br⁻, I⁻ bị oxi hoá trước; ' +
      'còn các anion có oxygen như SO₄²⁻, NO₃⁻ thì KHÔNG bị oxi hoá — nước bị oxi hoá thay: ' +
      '2H₂O → O₂ + 4H⁺ + 4e. Nếu anot TAN (bằng chính kim loại cần mạ) thì chính anot bị oxi ' +
      'hoá và tan ra — đó là nguyên lý mạ điện và tinh luyện đồng.\n\n' +
      'Hệ quả về pH mà đề hay hỏi kèm: điện phân dung dịch NaCl sinh OH⁻ ở catot nên dung dịch ' +
      'hoá base; điện phân dung dịch CuSO₄ sinh H⁺ ở anot nên dung dịch hoá acid.',
    workedExample: {
      problem:
        'Điện phân 200 mL dung dịch CuSO₄ với điện cực trơ, cường độ dòng 2,00 A trong 1 930 ' +
        'giây. Tính khối lượng đồng bám ở catot và số mol khí thoát ra ở anot (Cu = 64).',
      steps: [
        'Tính tổng số mol electron: nₑ = I·t/F = (2,00 × 1 930)/96 500 = 0,0400 mol.',
        'Xác định phản ứng ở catot: Cu²⁺ đứng sau Al³⁺ nên bị khử thật: Cu²⁺ + 2e → Cu.',
        'Số mol Cu = nₑ/2 = 0,0400/2 = 0,0200 mol ⇒ m(Cu) = 0,0200 × 64 = 1,28 g.',
        'Xác định phản ứng ở anot: SO₄²⁻ có oxygen nên KHÔNG bị oxi hoá; nước bị oxi hoá: ' +
          '2H₂O → O₂ + 4H⁺ + 4e.',
        'Số mol O₂ = nₑ/4 = 0,0400/4 = 0,0100 mol.',
        'Nhận xét thêm: anot sinh H⁺ nên dung dịch sau điện phân có tính acid.',
      ],
      answer: 'm(Cu) = 1,28 g ở catot; n(O₂) = 0,0100 mol ở anot; dung dịch hoá acid.',
    },
    checkQuestions: [
      {
        prompt:
          'Điện phân dung dịch AgNO₃ với điện cực trơ, cường độ dòng 5,00 A trong 1 930 giây. ' +
          'Tính khối lượng bạc bám ở catot (Ag = 108; đơn vị gam, chỉ nhập số).',
        answer: { kind: 'numeric', value: 10.8, tolerance: { mode: 'absolute', eps: 0.1 } },
        explain:
          'nₑ = I·t/F = (5,00 × 1 930)/96 500 = 0,100 mol. Ag⁺ + 1e → Ag nên n(Ag) = nₑ = 0,100 ' +
          'mol (KHÔNG chia 2 — bạc chỉ trao đổi một electron), suy ra m = 0,100 × 108 = 10,8 g. ' +
          'Sai phổ biến là quen tay chia cho 2 như với Cu²⁺.',
      },
      {
        // Câu BẪY trọng tâm: quên nước cạnh tranh phóng điện ở catot.
        prompt: 'Điện phân dung dịch NaCl (điện cực trơ, có màng ngăn). Chất nào thoát ra ở CATOT?',
        choices: [
          { id: 'na', label: 'Kim loại Na bám vào catot' },
          { id: 'h2', label: 'Khí H₂, đồng thời sinh OH⁻ làm dung dịch hoá base' },
          { id: 'cl2', label: 'Khí Cl₂' },
          { id: 'o2', label: 'Khí O₂' },
        ],
        answer: { kind: 'choice', correctIds: ['h2'] },
        explain:
          'Bẫy là áp máy móc "catot khử cation kim loại" rồi chọn Na. Na⁺ đứng TRƯỚC Al³⁺ trong ' +
          'dãy hoạt động nên trong dung dịch nước nó không bị khử — nước bị khử thay: ' +
          '2H₂O + 2e → H₂ + 2OH⁻. Vì vậy sản phẩm catot là khí H₂ và dung dịch quanh catot hoá ' +
          'base (đây chính là cách công nghiệp sản xuất NaOH). Cl₂ có thoát ra thật nhưng ở ANOT, ' +
          'không phải catot.',
      },
      {
        prompt:
          'Điện phân dung dịch CuSO₄ với điện cực trơ, cường độ dòng 2,00 A trong 9 650 giây. ' +
          'Tính số mol khí O₂ thoát ra ở anot (đơn vị mol, chỉ nhập số).',
        answer: { kind: 'numeric', value: 0.05, tolerance: { mode: 'absolute', eps: 0.002 } },
        explain:
          'nₑ = I·t/F = (2,00 × 9 650)/96 500 = 0,200 mol. Ở anot trơ, SO₄²⁻ không bị oxi hoá nên ' +
          'nước bị oxi hoá: 2H₂O → O₂ + 4H⁺ + 4e, tức mỗi mol O₂ ứng với 4 mol electron. Vậy ' +
          'n(O₂) = 0,200/4 = 0,0500 mol. Nhớ hệ số 4 này: dùng nhầm hệ số 2 sẽ ra 0,1 mol.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức Faraday và cách tính số mol electron qua mạch?',
        dap: 'm = A·I·t/(n·F) với F = 96 500 C/mol; nₑ = I·t/F, bằng nhau ở cả hai điện cực.',
      },
      {
        hoi: 'Điện phân dung dịch: ion kim loại nào KHÔNG bị khử ở catot?',
        dap: 'Từ Al³⁺ trở về trước (K⁺, Na⁺, Ca²⁺, Mg²⁺, Al³⁺) — nước bị khử thay, sinh H₂ và OH⁻.',
      },
      {
        hoi: 'Ở anot trơ, anion nào không bị oxi hoá?',
        dap: 'Anion chứa oxygen (SO₄²⁻, NO₃⁻) — nước bị oxi hoá thay: 2H₂O → O₂ + 4H⁺ + 4e.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-tinh',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa12-c92-b1',
    grade: '12',
    chapterNumber: 92,
    chapterTitle: 'Chuyên đề HSG — Điện hoá học',
    lessonNumber: 1,
    title: 'HSG cấp quốc gia: Phương trình Nernst, ΔG° = −nFE° và ăn mòn điện hoá',
    hook:
      'Pin trong điều khiển TV yếu dần rồi chết hẳn, nhưng bảng tra E° thì chỉ có đúng một con ' +
      'số không đổi. Mâu thuẫn ấy tan biến khi bạn nhận ra E° chỉ là giá trị ở điều kiện chuẩn, ' +
      'còn thế thật thay đổi theo nồng độ — và có một phương trình mô tả đúng sự thay đổi đó.',
    theory:
      'BA ĐẠI LƯỢNG, MỘT BẢN CHẤT. Ở cấp quốc gia, điện hoá không còn là chuyện tra bảng mà là ' +
      'chuyện nối điện hoá với nhiệt động học. Cầu nối là công thức:\n\n' +
      '    ΔG° = −n·F·E°pin\n\n' +
      'n là số mol electron trao đổi theo phương trình đã cân bằng, F = 96 500 C/mol. Đơn vị ra ' +
      'là jun, nhớ đổi sang kJ khi so sánh với số liệu nhiệt động thường gặp.\n\n' +
      'Hệ quả đọc thẳng ra được: E°pin > 0 ⟺ ΔG° < 0 ⟺ phản ứng tự xảy ra ở điều kiện chuẩn. ' +
      'Ba cách nói, cùng một nội dung.\n\n' +
      'Ghép tiếp với ΔG° = −R·T·lnK (đã gặp ở chuyên đề HSG quốc gia lớp 10) thì được cầu nối ' +
      'thứ hai, ở 25 °C:\n\n' +
      '    lgK = n·E°pin/0,0592\n\n' +
      'Nghĩa là chỉ cần hai số trong bảng E° là tính được hằng số cân bằng của một phản ứng oxi ' +
      'hoá – khử, không cần đo đạc gì thêm. Đây là dạng câu ăn điểm ở vòng quốc gia.\n\n' +
      'PHƯƠNG TRÌNH NERNST — khi rời điều kiện chuẩn:\n\n' +
      '    E = E° − (0,0592/n)·lgQ   (ở 25 °C)\n\n' +
      'Q là biểu thức tỉ số nồng độ giống hệt K nhưng lấy ở thời điểm đang xét (chất rắn và dung ' +
      'môi không xuất hiện trong Q). Đọc ý nghĩa cho khỏi phải học vẹt: tăng nồng độ chất tham ' +
      'gia thì Q giảm, lgQ âm đi, E TĂNG — pin khoẻ hơn. Khi phản ứng chạy dần tới cân bằng thì ' +
      'Q → K, lúc đó E = 0 và pin hết điện. Pin "chết" không phải vì hết chất, mà vì đã tới cân ' +
      'bằng.\n\n' +
      'ĂN MÒN ĐIỆN HOÁ nhìn qua lăng kính pin. Hai kim loại khác nhau tiếp xúc trong môi trường ' +
      'chất điện li tạo thành vô số pin nhỏ: kim loại có E° NHỎ HƠN đóng vai anot và bị ăn mòn ' +
      'trước, kim loại có E° lớn hơn được bảo vệ. Hai ứng dụng trái ngược mà đề hay đặt cạnh ' +
      'nhau để bẫy:\n\n' +
      '• Tôn (thép tráng kẽm): E°(Zn²⁺/Zn) = −0,76 < E°(Fe²⁺/Fe) = −0,44 nên KẼM bị ăn mòn, sắt ' +
      'được bảo vệ — vết xước không làm hỏng tấm tôn. Đây là "anot hi sinh".\n' +
      '• Sắt tây (thép tráng thiếc): E°(Sn²⁺/Sn) = −0,14 > E°(Fe²⁺/Fe) nên khi lớp thiếc bị ' +
      'xước, chính SẮT làm anot và bị ăn mòn NHANH HƠN so với khi để trần. Lớp phủ có E° lớn hơn ' +
      'chỉ bảo vệ được khi còn nguyên vẹn.',
    workedExample: {
      problem:
        'Cho pin Zn–Cu có E°pin = 1,10 V, phản ứng Zn + Cu²⁺ → Zn²⁺ + Cu. (a) Tính ΔG° của phản ' +
        'ứng. (b) Tính sức điện động của pin khi [Zn²⁺] = 1,00 M và [Cu²⁺] = 0,010 M ở 25 °C.',
      steps: [
        'Xác định n: phương trình trao đổi 2 electron ⇒ n = 2.',
        '(a) ΔG° = −n·F·E°pin = −2 × 96 500 × 1,10 = −212 300 J ≈ −212,3 kJ.',
        'Đọc kết quả: ΔG° âm đậm nên phản ứng tự xảy ra mạnh ở điều kiện chuẩn — khớp với ' +
          'E°pin > 0.',
        '(b) Lập Q: chất rắn Zn, Cu không vào biểu thức ⇒ Q = [Zn²⁺]/[Cu²⁺] = 1,00/0,010 = 100.',
        'Áp Nernst: E = E° − (0,0592/n)·lgQ = 1,10 − (0,0592/2) × lg100 = 1,10 − 0,0296 × 2.',
        'Tính: E = 1,10 − 0,0592 = 1,0408 ≈ 1,04 V.',
        'Kiểm tính hợp lý: giảm nồng độ chất tham gia Cu²⁺ thì pin yếu đi — đúng như dự đoán ' +
          'định tính, và mức giảm chỉ khoảng 0,06 V vì hệ số 0,0592/n rất nhỏ.',
      ],
      answer: 'ΔG° ≈ −212,3 kJ; E ≈ 1,04 V.',
    },
    checkQuestions: [
      {
        prompt:
          'Phản ứng Cu + 2Ag⁺ → Cu²⁺ + 2Ag có E°pin = 0,46 V. Tính ΔG° của phản ứng ' +
          '(đơn vị kJ, chỉ nhập số, giữ dấu).',
        answer: { kind: 'numeric', value: -88.8, tolerance: { mode: 'absolute', eps: 0.5 } },
        explain:
          'Phương trình trao đổi 2 electron (Cu → Cu²⁺ + 2e) nên n = 2, KHÔNG phải 1 dù hệ số ' +
          'trước Ag⁺ là 2. ΔG° = −n·F·E° = −2 × 96 500 × 0,46 = −88 780 J ≈ −88,8 kJ. Dấu âm cho ' +
          'biết phản ứng tự xảy ra, khớp với E° > 0. Quên đổi J sang kJ là lỗi hay gặp nhất ở câu này.',
      },
      {
        prompt:
          'Pin Zn–Cu có E°pin = 1,10 V (n = 2). Tính sức điện động của pin ở 25 °C khi ' +
          '[Zn²⁺] = 1,00 M và [Cu²⁺] = 0,0100 M (đơn vị vôn, chỉ nhập số).',
        answer: { kind: 'numeric', value: 1.04, tolerance: { mode: 'absolute', eps: 0.02 } },
        explain:
          'Q = [Zn²⁺]/[Cu²⁺] = 1,00/0,0100 = 100 (kim loại rắn không có mặt trong Q). Nernst: ' +
          'E = 1,10 − (0,0592/2)·lg100 = 1,10 − 0,0296 × 2 = 1,04 V. Hai lỗi thường gặp: viết Q ' +
          'lộn ngược thành [Cu²⁺]/[Zn²⁺] (ra 1,16 V, tức pin mạnh lên khi loãng chất tham gia — ' +
          'vô lý), và quên chia 0,0592 cho n.',
      },
      {
        // Câu BẪY trọng tâm: lớp phủ nào bảo vệ được sắt khi bị xước.
        prompt:
          'Cho E°(Zn²⁺/Zn) = −0,76 V; E°(Fe²⁺/Fe) = −0,44 V; E°(Sn²⁺/Sn) = −0,14 V. Một tấm ' +
          'thép tráng kẽm và một tấm thép tráng thiếc cùng bị xước sâu tới lớp sắt rồi để trong ' +
          'không khí ẩm. Điều gì xảy ra?',
        choices: [
          {
            id: 'kem_hi_sinh',
            label:
              'Tấm tráng kẽm: kẽm bị ăn mòn, sắt được bảo vệ. Tấm tráng thiếc: sắt bị ăn mòn nhanh hơn',
          },
          {
            id: 'nguoc_lai',
            label: 'Tấm tráng kẽm: sắt bị ăn mòn. Tấm tráng thiếc: thiếc bị ăn mòn',
          },
          { id: 'deu_bao_ve', label: 'Cả hai lớp phủ đều tiếp tục bảo vệ sắt như khi chưa xước' },
          { id: 'deu_an_mon', label: 'Cả hai trường hợp sắt đều bị ăn mòn với tốc độ như nhau' },
        ],
        answer: { kind: 'choice', correctIds: ['kem_hi_sinh'] },
        explain:
          'Bẫy là nghĩ "có lớp phủ thì luôn được bảo vệ". Trong pin ăn mòn, kim loại có E° NHỎ ' +
          'HƠN làm anot và bị ăn mòn. Kẽm (−0,76) nhỏ hơn sắt (−0,44) nên kẽm hi sinh, sắt an ' +
          'toàn — vết xước không hại tấm tôn. Thiếc (−0,14) LỚN hơn sắt nên khi lộ sắt ra, chính ' +
          'sắt làm anot và bị ăn mòn nhanh hơn cả khi để trần, vì nay có thêm catot thiếc kề bên ' +
          'khép mạch. Đó là lý do hộp sắt tây móp xước rất nhanh gỉ.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức nối sức điện động với biến thiên năng lượng tự do?',
        dap: 'ΔG° = −n·F·E°pin (F = 96 500 C/mol). E°pin > 0 ⟺ ΔG° < 0 ⟺ tự xảy ra.',
      },
      {
        hoi: 'Phương trình Nernst ở 25 °C?',
        dap: 'E = E° − (0,0592/n)·lgQ. Khi Q → K thì E → 0: pin hết điện vì đã tới cân bằng.',
      },
      {
        hoi: 'Vì sao thép tráng kẽm bị xước vẫn bền, còn thép tráng thiếc thì không?',
        dap: 'Kẽm có E° nhỏ hơn sắt nên làm anot hi sinh; thiếc có E° lớn hơn nên khi xước, sắt làm anot và gỉ nhanh hơn.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-quoc-gia',
    reviewStatus: 'draft',
  },
]
