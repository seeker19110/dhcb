// lessons/hoa10c4.ts — Hoá học 10, Chương 4: Phản ứng oxi hoá - khử (1 bài).
// Mục lục thật: tai-lieu-sgk/SGK-Hoa/10/page_0005.png (OCR 2026-08-31).
import type { ChemLesson } from '../lessonTypes.js'

export const HOA10_C4_LESSONS: ChemLesson[] = [
  {
    id: 'hoa10-c4-b13',
    grade: '10',
    chapterNumber: 4,
    chapterTitle: 'Phản ứng oxi hoá - khử',
    lessonNumber: 13,
    title: 'Phản ứng oxi hoá - khử',
    hook:
      'Đinh sắt bị gỉ, pin điện thoại phóng điện, và ngọn lửa cháy — ba hiện tượng tưởng ' +
      'chẳng liên quan đều cùng một bản chất hoá học: SỰ CHUYỂN ELECTRON giữa các chất.',
    theory:
      'SỐ OXI HOÁ là điện tích giả định của một nguyên tử trong phân tử/ion, tính theo quy ' +
      'ước: nguyên tố tự do (đơn chất) có số oxi hoá 0; trong hợp chất, kim loại kiềm luôn +1, ' +
      'kiềm thổ luôn +2, F luôn −1; H thường +1 (trừ hydride kim loại như NaH thì −1); O thường ' +
      '−2 (ngoại lệ: peroxide H₂O₂ là −1, còn trong OF₂ thì O mang +2 vì F âm điện hơn O); ' +
      'tổng số oxi hoá trong phân tử trung hoà = 0, trong ion = điện tích ion.\n\n' +
      'VÌ SAO phải quy ước như vậy? Vì electron trong liên kết cộng hoá trị không thuộc hẳn về ' +
      'nguyên tử nào. Ta "giả vờ" gán cả cặp electron dùng chung cho nguyên tử có độ âm điện ' +
      'lớn hơn, rồi đếm điện tích còn lại — nhờ vậy mới theo dõi được electron đi đâu trong ' +
      'phản ứng. Số oxi hoá KHÔNG phải điện tích thật của nguyên tử.\n\n' +
      'CHẤT KHỬ (chất bị oxi hoá): chất NHƯỜNG electron, có số oxi hoá TĂNG sau phản ứng.\n' +
      'CHẤT OXI HOÁ (chất bị khử): chất NHẬN electron, có số oxi hoá GIẢM sau phản ứng.\n\n' +
      'PHẢN ỨNG OXI HOÁ – KHỬ là phản ứng có sự THAY ĐỔI SỐ OXI HOÁ của ít nhất một nguyên ' +
      'tố — luôn xảy ra ĐỒNG THỜI quá trình oxi hoá (nhường e) và quá trình khử (nhận e), số ' +
      'electron nhường = số electron nhận.\n\n' +
      'PHƯƠNG PHÁP THĂNG BẰNG ELECTRON để cân bằng PTHH oxi hoá-khử:\n' +
      '1. Xác định số oxi hoá của nguyên tố thay đổi.\n' +
      '2. Viết quá trình oxi hoá và quá trình khử.\n' +
      '3. Tìm hệ số sao cho số electron nhường = số electron nhận (nhân chéo bội số chung ' +
      'nhỏ nhất).\n' +
      '4. Đặt hệ số vào phương trình, kiểm tra cân bằng nguyên tố khác.',
    workedExample: {
      problem: 'Xác định chất khử, chất oxi hoá trong phản ứng: Zn + CuSO₄ → ZnSO₄ + Cu.',
      steps: [
        'Xác định số oxi hoá trước phản ứng: Zn (đơn chất) = 0; Cu trong CuSO₄ = +2.',
        'Xác định số oxi hoá sau phản ứng: Zn trong ZnSO₄ = +2; Cu (đơn chất) = 0.',
        'Zn: số oxi hoá tăng từ 0 lên +2 (nhường 2e) ⇒ Zn là CHẤT KHỬ (bị oxi hoá).',
        'Cu: số oxi hoá giảm từ +2 xuống 0 (nhận 2e) ⇒ Cu²⁺ là CHẤT OXI HOÁ (bị khử).',
      ],
      answer: 'Chất khử: Zn. Chất oxi hoá: Cu²⁺ (trong CuSO₄).',
    },
    checkQuestions: [
      {
        prompt: 'Chất khử là chất có đặc điểm gì trong phản ứng oxi hoá - khử?',
        choices: [
          { id: 'a', label: 'Nhường electron, số oxi hoá tăng' },
          { id: 'b', label: 'Nhận electron, số oxi hoá giảm' },
          { id: 'c', label: 'Không thay đổi số oxi hoá' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain: 'Chất khử = chất bị oxi hoá = chất NHƯỜNG electron ⇒ số oxi hoá TĂNG.',
      },
      {
        prompt:
          'Trong phản ứng Fe + 2HCl → FeCl₂ + H₂, số oxi hoá của Fe thay đổi từ 0 lên bao nhiêu?',
        answer: { kind: 'numeric', value: 2 },
        explain:
          'Fe (đơn chất, số oxi hoá 0) nhường 2e tạo Fe²⁺ trong FeCl₂ ⇒ số oxi hoá Fe tăng lên +2.',
      },
      {
        // Câu BẪY 1: học sinh hay lấy "1 Al nhường 3e" rồi quên nhân hệ số cân bằng.
        prompt:
          'Cân bằng phản ứng: Al + O₂ → Al₂O₃ bằng phương pháp thăng bằng electron. Hỏi hệ số ' +
          'của Al trong phương trình đã cân bằng là bao nhiêu? (chỉ nhập số)',
        answer: { kind: 'numeric', value: 4 },
        explain:
          'Nhiều bạn dừng ở "Al → Al³⁺ + 3e, O₂ + 4e → 2O²⁻" rồi ghi ngay hệ số 3 và 4 nhầm chỗ. ' +
          'Làm đúng: bội chung nhỏ nhất của 3 (e nhường) và 4 (e nhận) là 12 ⇒ cần 4 nguyên tử ' +
          'Al (4×3 = 12e nhường) và 3 phân tử O₂ (3×4 = 12e nhận). Phương trình cân bằng là ' +
          '4Al + 3O₂ → 2Al₂O₃. Hệ số của Al là 4. Luôn kiểm lại số nguyên tử hai vế sau khi đặt ' +
          'hệ số — quên bước này là lỗi mất điểm phổ biến nhất của dạng bài này.',
      },
      {
        // Câu BẪY 2: nhầm "số oxi hoá của O luôn bằng −2".
        prompt:
          'Số oxi hoá của nguyên tố oxygen trong hợp chất H₂O₂ (hydrogen peroxide) bằng bao ' +
          'nhiêu? (nhập số, kèm dấu nếu âm)',
        answer: { kind: 'numeric', value: -1 },
        explain:
          'Bẫy ở chỗ "O luôn là −2". Trong H₂O₂ mỗi H là +1, tổng số oxi hoá bằng 0 ⇒ 2(+1) + ' +
          '2x = 0 ⇒ x = −1. Lý do sâu xa: trong H₂O₂ có liên kết O–O giữa hai nguyên tử giống ' +
          'nhau, cặp electron đó chia đôi chứ không gán hết cho bên nào.',
      },
    ],
    srsCards: [
      { hoi: 'Chất khử là gì?', dap: 'Chất nhường electron, có số oxi hoá tăng sau phản ứng.' },
      { hoi: 'Chất oxi hoá là gì?', dap: 'Chất nhận electron, có số oxi hoá giảm sau phản ứng.' },
      {
        hoi: 'Nguyên tắc cân bằng phương trình bằng phương pháp thăng bằng electron?',
        dap: 'Số electron chất khử nhường = số electron chất oxi hoá nhận.',
      },
    ],
    animation: {
      title: 'Zn nhường 2 electron cho Cu²⁺ (Zn + CuSO₄ → ZnSO₄ + Cu)',
      description:
        'Hình phóng to bề mặt một lá kẽm nhúng trong dung dịch CuSO₄: bên trái là lớp nguyên tử Zn ngoài cùng của lá, bên phải là dung dịch. Một ion Cu²⁺ trôi tới chạm vào bề mặt kẽm. Một nguyên tử Zn nhường 2 electron; hai electron đi trong kim loại tới đúng chỗ ion Cu²⁺ đang chạm. Cu²⁺ nhận đủ 2 electron, thành nguyên tử Cu màu đỏ bám lại trên lá kẽm; nguyên tử Zn đã mất 2 electron thành ion Zn²⁺ rời bề mặt tan vào dung dịch. Zn: số oxi hoá 0 → +2, là chất khử, bị oxi hoá; Cu²⁺: +2 → 0, là chất oxi hoá, bị khử. Hai quá trình xảy ra đồng thời và số electron nhường luôn bằng số electron nhận — nguyên tắc của phương pháp thăng bằng electron.',
      viewBoxWidth: 420,
      viewBoxHeight: 244,
      durationMs: 6000,
      loop: true,
      shapes: [
        { kind: 'rect', id: 'dd', x: 90, y: 30, w: 320, h: 150, fill: 'accent', opacity: 0.2 },
        { kind: 'rect', id: 'la-zn', x: 20, y: 30, w: 80, h: 150, fill: 'muted', opacity: 0.25 },
        {
          kind: 'circle',
          id: 'zn0',
          cx: 100,
          cy: 41,
          r: 10,
          fill: 'muted',
          stroke: 'surface',
          strokeWidth: 1.5,
        },
        {
          kind: 'circle',
          id: 'zn1',
          cx: 100,
          cy: 63,
          r: 10,
          fill: 'muted',
          stroke: 'surface',
          strokeWidth: 1.5,
        },
        {
          kind: 'circle',
          id: 'zn2',
          cx: 100,
          cy: 85,
          r: 10,
          fill: 'muted',
          stroke: 'surface',
          strokeWidth: 1.5,
        },
        {
          kind: 'circle',
          id: 'zn3',
          cx: 100,
          cy: 107,
          r: 10,
          fill: 'muted',
          stroke: 'surface',
          strokeWidth: 1.5,
        },
        {
          kind: 'circle',
          id: 'zn5',
          cx: 100,
          cy: 151,
          r: 10,
          fill: 'muted',
          stroke: 'surface',
          strokeWidth: 1.5,
        },
        {
          kind: 'circle',
          id: 'zn6',
          cx: 100,
          cy: 172,
          r: 10,
          fill: 'muted',
          stroke: 'surface',
          strokeWidth: 1.5,
        },
        {
          kind: 'circle',
          id: 'zn-pu',
          cx: 100,
          cy: 129,
          r: 10,
          fill: 'muted',
          stroke: 'surface',
          strokeWidth: 1.5,
          keyframes: [
            { atMs: 2700, dx: 0, dy: 0 },
            { atMs: 4000, dx: 104, dy: 26 },
          ],
        },
        {
          kind: 'circle',
          id: 'cu-ion',
          cx: 330,
          cy: 63,
          r: 10,
          fill: 'accent',
          keyframes: [
            { atMs: 300, dx: 0 },
            { atMs: 1900, dx: -209, opacity: 1 },
            { atMs: 2600, opacity: 1 },
            { atMs: 2900, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'cu',
          cx: 121,
          cy: 63,
          r: 10,
          fill: 'warn',
          opacity: 0,
          keyframes: [
            { atMs: 2600, opacity: 0 },
            { atMs: 2900, opacity: 1 },
          ],
        },
        {
          kind: 'circle',
          id: 'e1',
          cx: 100,
          cy: 129,
          r: 3.5,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 2000, dx: 0, dy: 0, opacity: 0 },
            { atMs: 2080, opacity: 1 },
            { atMs: 2200, dx: 5, dy: -12 },
            { atMs: 2500, dx: 5, dy: -58 },
            { atMs: 2650, dx: 14, dy: -66 },
            { atMs: 2750, opacity: 0 },
          ],
        },
        {
          kind: 'circle',
          id: 'e2',
          cx: 100,
          cy: 129,
          r: 3.5,
          fill: 'correct',
          opacity: 0,
          keyframes: [
            { atMs: 2150, dx: 0, dy: 0, opacity: 0 },
            { atMs: 2230, opacity: 1 },
            { atMs: 2350, dx: 5, dy: -12 },
            { atMs: 2650, dx: 5, dy: -58 },
            { atMs: 2800, dx: 14, dy: -66 },
            { atMs: 2900, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'zn-pu-t',
          x: 100,
          y: 132,
          text: 'Zn',
          size: 8,
          anchor: 'middle',
          fill: 'surface',
          keyframes: [
            { atMs: 2500, opacity: 1 },
            { atMs: 2700, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'zn-ion-t',
          x: 100,
          y: 132,
          text: 'Zn²⁺',
          size: 8,
          anchor: 'middle',
          fill: 'surface',
          opacity: 0,
          keyframes: [
            { atMs: 2500, dx: 0, dy: 0, opacity: 0 },
            { atMs: 2700, opacity: 1 },
            { atMs: 4000, dx: 104, dy: 26 },
          ],
        },
        {
          kind: 'label',
          id: 'cu-ion-t',
          x: 334,
          y: 49,
          text: 'Cu²⁺',
          size: 9,
          anchor: 'middle',
          fill: 'neutral',
          keyframes: [
            { atMs: 300, dx: 0 },
            { atMs: 1900, dx: -209, opacity: 1 },
            { atMs: 2600, opacity: 1 },
            { atMs: 2900, opacity: 0 },
          ],
        },
        {
          kind: 'label',
          id: 'cu-t',
          x: 135,
          y: 67,
          text: 'Cu',
          size: 10,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 2600, opacity: 0 },
            { atMs: 2900, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'la-t',
          x: 60,
          y: 22,
          text: 'lá kẽm',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'dd-t',
          x: 400,
          y: 22,
          text: 'dung dịch CuSO₄ (phóng to bề mặt)',
          size: 11,
          anchor: 'end',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'pt',
          x: 300,
          y: 118,
          text: 'Zn + Cu²⁺ → Zn²⁺ + Cu',
          size: 12,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 3800, opacity: 0 },
            { atMs: 4200, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'zn-so',
          x: 20,
          y: 198,
          text: 'Zn: 0 → +2 — nhường 2e, bị oxi hoá (chất khử)',
          size: 10,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 2600, opacity: 0 },
            { atMs: 3000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'cu-so',
          x: 20,
          y: 214,
          text: 'Cu²⁺: +2 → 0 — nhận 2e, bị khử (chất oxi hoá)',
          size: 10,
          anchor: 'start',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 2600, opacity: 0 },
            { atMs: 3000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'kl',
          x: 210,
          y: 234,
          text: 'số e chất khử nhường = số e chất oxi hoá nhận',
          size: 11,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 4200, opacity: 0 },
            { atMs: 4600, opacity: 1 },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Phóng to bề mặt lá kẽm trong dung dịch CuSO₄: ion Cu²⁺ trôi tới sát bề mặt.',
        },
        {
          atMs: 2000,
          text: 'Một nguyên tử Zn nhường 2 electron; electron đi trong kim loại tới ion Cu²⁺ đang chạm bề mặt.',
        },
        {
          atMs: 2700,
          text: 'Cu²⁺ nhận đủ 2e thành nguyên tử Cu bám lên lá kẽm; Zn thành ion Zn²⁺ tan vào dung dịch.',
        },
        {
          atMs: 4200,
          text: 'Zn là chất khử (0 → +2), Cu²⁺ là chất oxi hoá (+2 → 0); số e nhường = số e nhận.',
        },
      ],
    },
    track: 'core',
    reviewStatus: 'draft',
  },
]
