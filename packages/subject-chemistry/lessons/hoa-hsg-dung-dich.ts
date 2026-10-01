// lessons/hoa-hsg-dung-dich.ts — NHÁNH NÂNG CAO (track 'advanced'): chuyên đề bồi dưỡng học
// sinh giỏi về CÂN BẰNG ION TRONG DUNG DỊCH.
//
// Ba cấp tăng dần:
//   hsg-truong    — acid yếu, hằng số Ka, độ điện li (mở rộng trực tiếp từ bài pH lớp 11).
//   hsg-tinh      — dung dịch đệm, phương trình Henderson–Hasselbalch, đường chuẩn độ.
//   hsg-quoc-gia  — tích số tan Ksp, điều kiện kết tủa và kết tủa phân đoạn.
//
// reviewStatus='draft' — nội dung tự soạn, chưa qua giáo viên Hoá duyệt.
import type { ChemLesson } from '../lessonTypes.js'

export const HOA_HSG_DUNG_DICH_LESSONS: ChemLesson[] = [
  {
    id: 'hoa11-c90-b1',
    grade: '11',
    chapterNumber: 90,
    chapterTitle: 'Chuyên đề HSG — Cân bằng ion trong dung dịch',
    lessonNumber: 1,
    title: 'HSG cấp trường: Acid yếu, hằng số Ka và độ điện li',
    hook:
      'Giấm ăn có nồng độ acetic acid khoảng 0,8 M — cao hơn nhiều so với dung dịch HCl 0,01 M ' +
      'trong phòng thí nghiệm. Vậy mà bạn rưới giấm lên rau mà không sao, còn HCl 0,01 M thì ' +
      'không ai dám nếm. Nồng độ không phải là tất cả.',
    theory:
      'ACID MẠNH so với ACID YẾU khác nhau ở CHỖ NÀO? Không phải ở nồng độ, mà ở MỨC ĐỘ ĐIỆN ' +
      'LI. Acid mạnh (HCl, HNO₃, HClO₄) phân li gần như hoàn toàn nên [H⁺] ≈ C. Acid yếu chỉ ' +
      'phân li một phần và cân bằng phân li ấy có hằng số riêng:\n\n' +
      '    HA ⇌ H⁺ + A⁻ ,   Ka = [H⁺][A⁻]/[HA]\n\n' +
      'Ka càng lớn thì acid càng mạnh. Thay vì viết số mũ âm, người ta hay dùng pKa = −logKa: ' +
      'pKa càng NHỎ thì acid càng MẠNH (CH₃COOH có Ka = 1,8·10⁻⁵ ⇒ pKa ≈ 4,74).\n\n' +
      'CÔNG THỨC GẦN ĐÚNG TÍNH [H⁺] CỦA ACID YẾU ĐƠN NẤC nồng độ C:\n' +
      'Gọi x = [H⁺] đã phân li, ta có Ka = x²/(C − x). Khi acid phân li ít (x rất nhỏ so với C) ' +
      'thì C − x ≈ C, suy ra:\n\n' +
      '    [H⁺] ≈ √(Ka·C)   và   pH ≈ ½(pKa − logC)\n\n' +
      'ĐIỀU KIỆN DÙNG gần đúng này — đây chính là chỗ đề HSG hay siết: chỉ dùng khi độ điện li ' +
      'nhỏ, thực hành thường lấy mốc C/Ka > 400 (tương đương x < 5% C). Nếu acid khá mạnh hoặc ' +
      'dung dịch quá loãng thì phải giải trọn phương trình bậc hai x² + Ka·x − Ka·C = 0. Ngoài ' +
      'ra công thức bỏ qua phần H⁺ do nước tự phân li, chỉ hợp lệ khi [H⁺] tính được ≫ 10⁻⁷ M.\n\n' +
      'ĐỘ ĐIỆN LI α = (số phân tử đã phân li)/(số phân tử ban đầu) = x/C, thường ghi theo %. ' +
      'Hệ quả quan trọng (định luật pha loãng Ostwald): PHA LOÃNG làm α TĂNG nhưng [H⁺] GIẢM — ' +
      'hai đại lượng này biến thiên ngược nhau, và đây là bẫy thường trực trong đề.',
    workedExample: {
      problem: 'Tính pH và độ điện li α của dung dịch CH₃COOH 0,10 M, biết Ka = 1,8·10⁻⁵.',
      steps: [
        'Kiểm điều kiện dùng công thức gần đúng: C/Ka = 0,10/1,8·10⁻⁵ ≈ 5,6·10³ > 400 ⇒ được ' +
          'phép bỏ qua x ở mẫu.',
        'Lập biểu thức: Ka = x²/(C − x) ≈ x²/C ⇒ x = √(Ka·C) = √(1,8·10⁻⁵ × 0,10) = √(1,8·10⁻⁶).',
        'Tính: x = [H⁺] ≈ 1,34·10⁻³ M.',
        'pH = −log(1,34·10⁻³) ≈ 2,87.',
        'Độ điện li: α = x/C = 1,34·10⁻³/0,10 = 1,34·10⁻² = 1,34%.',
        'Đối chiếu ý nghĩa: chỉ hơn 1% số phân tử acid phân li — vì thế giấm tuy đặc vẫn ăn ' +
          'được, trong khi HCl loãng hơn nhiều lại cho [H⁺] lớn hơn.',
      ],
      answer: 'pH ≈ 2,87; α ≈ 1,34%.',
    },
    checkQuestions: [
      {
        prompt:
          'Tính pH của dung dịch CH₃COOH 0,10 M, biết Ka = 1,8·10⁻⁵ (làm tròn 2 chữ số thập ' +
          'phân, chỉ nhập số).',
        answer: { kind: 'numeric', value: 2.87, tolerance: { mode: 'absolute', eps: 0.05 } },
        explain:
          '[H⁺] = √(Ka·C) = √(1,8·10⁻⁶) = 1,34·10⁻³ M ⇒ pH = 2,87. Công thức này là xấp xỉ cho acid yếu phân li ít, chỉ dùng khi C đủ lớn so với Ka (không áp dụng cho dung dịch quá loãng).',
      },
      {
        // Câu BẪY trọng tâm: coi acid yếu điện li hoàn toàn như acid mạnh.
        prompt:
          'Hai dung dịch cùng nồng độ 0,10 M: HCl và CH₃COOH (Ka = 1,8·10⁻⁵). Hiệu số pH giữa ' +
          'dung dịch CH₃COOH và dung dịch HCl (pH(CH₃COOH) − pH(HCl)) bằng bao nhiêu? (làm ' +
          'tròn 2 chữ số thập phân, chỉ nhập số)',
        answer: { kind: 'numeric', value: 1.87, tolerance: { mode: 'absolute', eps: 0.06 } },
        explain:
          'Bẫy là lấy luôn [H⁺] = 0,10 M cho CẢ HAI rồi kết luận hiệu số bằng 0. HCl là acid ' +
          'mạnh, phân li hoàn toàn: [H⁺] = 0,10 M ⇒ pH = 1,00. CH₃COOH là acid yếu, ' +
          '[H⁺] = √(Ka·C) = 1,34·10⁻³ M ⇒ pH = 2,87. Hiệu số = 2,87 − 1,00 = 1,87. Ghi nhớ ' +
          'bản chất: cùng nồng độ MOL không có nghĩa là cùng nồng độ H⁺ — phải đi qua Ka.',
      },
      {
        // Câu BẪY 2: pha loãng thì α tăng hay giảm.
        prompt:
          'Pha loãng dung dịch CH₃COOH bằng nước (nhiệt độ không đổi). Độ điện li α và nồng độ ' +
          'H⁺ của dung dịch thay đổi thế nào?',
        choices: [
          { id: 'ca_tang', label: 'Cả α và [H⁺] đều tăng' },
          { id: 'ca_giam', label: 'Cả α và [H⁺] đều giảm' },
          { id: 'alpha_tang', label: 'α tăng nhưng [H⁺] giảm' },
          { id: 'alpha_giam', label: 'α giảm nhưng [H⁺] tăng' },
        ],
        answer: { kind: 'choice', correctIds: ['alpha_tang'] },
        explain:
          'Hai đại lượng này đi ngược nhau nên rất dễ nhầm. Pha loãng làm giảm nồng độ mọi ' +
          'tiểu phân, cân bằng HA ⇌ H⁺ + A⁻ chuyển dịch theo chiều làm TĂNG số tiểu phân, tức ' +
          'chiều phân li ⇒ PHẦN TRĂM phân li α tăng (định luật pha loãng Ostwald: α ≈ √(Ka/C)). ' +
          'Nhưng tổng lượng acid bị pha loãng nhiều hơn phần tăng thêm đó, nên nồng độ H⁺ tuyệt ' +
          'đối vẫn giảm ([H⁺] = √(Ka·C) giảm theo C) — vì vậy pH tăng.',
      },
    ],
    srsCards: [
      {
        hoi: 'Biểu thức Ka của acid yếu HA?',
        dap: 'Ka = [H⁺][A⁻]/[HA]; Ka càng lớn (pKa càng nhỏ) thì acid càng mạnh.',
      },
      {
        hoi: 'Công thức gần đúng tính [H⁺] của acid yếu và điều kiện dùng?',
        dap: '[H⁺] ≈ √(Ka·C), dùng khi acid phân li ít (thường lấy mốc C/Ka > 400).',
      },
      {
        hoi: 'Pha loãng acid yếu thì α và [H⁺] biến đổi ra sao?',
        dap: 'α tăng, [H⁺] giảm (pH tăng) — định luật pha loãng Ostwald.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-truong',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c91-b1',
    grade: '11',
    chapterNumber: 91,
    chapterTitle: 'Chuyên đề HSG — Cân bằng ion trong dung dịch',
    lessonNumber: 1,
    title: 'HSG cấp tỉnh: Dung dịch đệm và bước nhảy pH khi chuẩn độ',
    hook:
      'pH máu người luôn nằm trong khoảng 7,35–7,45; lệch ra ngoài 0,3 đơn vị là nguy kịch. Mỗi ' +
      'ngày cơ thể vẫn thải ra hàng chục mmol acid. Thứ giữ cho con số đó không nhúc nhích là ' +
      'một hệ đệm — và bạn hoàn toàn tính được sức chịu của nó bằng giấy bút.',
    theory:
      'DUNG DỊCH ĐỆM là dung dịch chứa đồng thời một acid yếu và base liên hợp của nó (ví dụ ' +
      'CH₃COOH + CH₃COONa), có khả năng giữ pH gần như không đổi khi thêm một lượng nhỏ acid ' +
      'mạnh hoặc base mạnh, hoặc khi pha loãng vừa phải.\n\n' +
      'CƠ CHẾ: hệ có sẵn hai "kho dự trữ". Thêm H⁺ vào thì base liên hợp A⁻ nuốt lấy: ' +
      'A⁻ + H⁺ → HA. Thêm OH⁻ vào thì acid HA trung hoà: HA + OH⁻ → A⁻ + H₂O. Trong cả hai ' +
      'trường hợp, cái thay đổi chỉ là TỈ LỆ [A⁻]/[HA] chứ không phải [H⁺] — mà pH lại phụ ' +
      'thuộc tỉ lệ đó theo hàm logarit nên biến động rất ít.\n\n' +
      '## Phương trình Henderson–Hasselbalch\n\n' +
      '    pH = pKa + log([A⁻]/[HA])\n\n' +
      'Ba hệ quả nên thuộc:\n' +
      '— Khi [A⁻] = [HA] thì pH = pKa. Đây là điểm đệm tốt nhất.\n' +
      '— Vùng đệm hiệu quả là pH = pKa ± 1, tức tỉ lệ [A⁻]/[HA] nằm giữa 1/10 và 10/1. Ra ngoài ' +
      'khoảng đó thì một trong hai kho gần cạn, đệm mất tác dụng.\n' +
      '— Vì công thức chỉ chứa TỈ LỆ, pha loãng đệm (loãng vừa phải) gần như không đổi pH — ' +
      'khác hẳn dung dịch acid thường.\n\n' +
      'ĐIỀU KIỆN ÁP DỤNG: công thức trên là gần đúng, dựa trên giả thiết lượng HA và A⁻ pha vào ' +
      'lớn hơn hẳn lượng phân li/thuỷ phân của chúng. Với dung dịch quá loãng (~10⁻³ M trở ' +
      'xuống) hoặc tỉ lệ quá lệch, phải giải hệ cân bằng đầy đủ.\n\n' +
      'CHỌN HỆ ĐỆM: muốn đệm ở pH mục tiêu nào thì chọn cặp acid/base liên hợp có pKa GẦN pH ' +
      'đó nhất — đây là câu hỏi lí thuyết quen thuộc của đề cấp tỉnh.\n\n' +
      'BƯỚC NHẢY pH KHI CHUẨN ĐỘ: đường chuẩn độ acid mạnh bằng base mạnh có đoạn gần như thẳng ' +
      'đứng quanh điểm tương đương (pH nhảy vài đơn vị chỉ với một giọt). Chuẩn độ acid YẾU ' +
      'bằng base mạnh thì bước nhảy ngắn hơn và điểm tương đương nằm ở pH > 7 (vì muối tạo ' +
      'thành bị thuỷ phân cho môi trường base) — vì vậy phải chọn phenolphthalein chứ không ' +
      'dùng methyl da cam.',
    workedExample: {
      problem:
        'Có 1,00 L dung dịch đệm chứa CH₃COOH 0,100 M và CH₃COONa 0,100 M (Ka = 1,8·10⁻⁵, ' +
        'pKa = 4,74). Tính pH của đệm, rồi tính pH sau khi thêm 0,010 mol HCl (coi thể tích ' +
        'không đổi). So sánh với việc thêm chừng ấy HCl vào 1,00 L nước cất.',
      steps: [
        'pH ban đầu: [A⁻] = [HA] = 0,100 M ⇒ log(1) = 0 ⇒ pH = pKa = 4,74.',
        'Thêm 0,010 mol H⁺: phản ứng CH₃COO⁻ + H⁺ → CH₃COOH tiêu thụ hết 0,010 mol H⁺ (vì kho ' +
          'A⁻ còn 0,100 mol, dư sức).',
        'Kiểm kê lại: n(A⁻) = 0,100 − 0,010 = 0,090 mol; n(HA) = 0,100 + 0,010 = 0,110 mol.',
        'Áp dụng Henderson–Hasselbalch: pH = 4,74 + log(0,090/0,110) = 4,74 + log(0,818) = ' +
          '4,74 − 0,087 ≈ 4,65.',
        'So sánh: cùng lượng HCl đó cho vào 1,00 L nước cất sẽ tạo [H⁺] = 0,010 M ⇒ pH = 2,00, ' +
          'tức pH tụt 5 đơn vị. Trong đệm, pH chỉ giảm 0,09 đơn vị.',
      ],
      answer: 'pH đệm = 4,74 → 4,65 (giảm 0,09); trong nước cất pH tụt từ 7 xuống 2.',
    },
    checkQuestions: [
      {
        prompt:
          'Dung dịch đệm chứa CH₃COOH 0,100 M và CH₃COONa 0,100 M, pKa = 4,74. Tính pH của ' +
          'dung dịch (làm tròn 2 chữ số thập phân, chỉ nhập số).',
        answer: { kind: 'numeric', value: 4.74, tolerance: { mode: 'absolute', eps: 0.03 } },
        explain:
          'pH = pKa + log([A⁻]/[HA]) = 4,74 + log(1) = 4,74. Khi nồng độ acid và base liên hợp ' +
          'bằng nhau, pH đúng bằng pKa — đó cũng là điểm hệ đệm khoẻ nhất.',
      },
      {
        prompt:
          'Thêm 0,010 mol HCl vào 1,00 L dung dịch đệm CH₃COOH 0,100 M / CH₃COONa 0,100 M ' +
          '(pKa = 4,74; coi thể tích không đổi). Tính pH sau khi thêm (làm tròn 2 chữ số thập ' +
          'phân, chỉ nhập số).',
        answer: { kind: 'numeric', value: 4.65, tolerance: { mode: 'absolute', eps: 0.04 } },
        explain:
          'H⁺ thêm vào bị A⁻ nuốt: n(A⁻) = 0,090 mol, n(HA) = 0,110 mol ⇒ pH = 4,74 + ' +
          'log(0,090/0,110) ≈ 4,65. Lỗi hay gặp là cộng/trừ nhầm chiều (tăng A⁻, giảm HA) rồi ' +
          'ra 4,83: nhớ rằng thêm ACID thì kho base A⁻ phải vơi đi.',
      },
      {
        // Câu BẪY: "đệm giữ pH trong mọi trường hợp" — quên DUNG LƯỢNG đệm.
        prompt:
          'Thêm 0,150 mol HCl vào 1,00 L dung dịch đệm chứa 0,100 mol CH₃COOH và 0,100 mol ' +
          'CH₃COONa. Dung dịch thu được có tính chất gì?',
        choices: [
          { id: 'van_dem', label: 'Vẫn là đệm, pH vẫn xấp xỉ 4,7' },
          {
            id: 'vo_dem',
            label: 'Vỡ đệm: A⁻ bị dùng hết, dung dịch còn dư H⁺ mạnh nên pH rất thấp (khoảng 1,3)',
          },
          { id: 'trung_tinh', label: 'Trung tính, pH ≈ 7 vì acid đã phản ứng hết với muối' },
        ],
        answer: { kind: 'choice', correctIds: ['vo_dem'] },
        explain:
          'Bẫy ở chỗ coi đệm là "vô địch". Đệm chỉ chống đỡ được trong DUNG LƯỢNG của nó: kho ' +
          'base ở đây chỉ có 0,100 mol A⁻, mà ta đổ vào 0,150 mol H⁺. Sau khi A⁻ cạn sạch, còn ' +
          'dư 0,050 mol H⁺ mạnh trong 1,00 L ⇒ [H⁺] ≈ 0,050 M ⇒ pH ≈ 1,3. Nguyên tắc làm bài: ' +
          'luôn KIỂM KÊ số mol hai cấu tử đệm trước, chỉ khi cả hai còn dư mới được dùng ' +
          'Henderson–Hasselbalch.',
      },
    ],
    srsCards: [
      { hoi: 'Phương trình Henderson–Hasselbalch?', dap: 'pH = pKa + log([A⁻]/[HA]).' },
      {
        hoi: 'Vùng đệm hiệu quả nằm ở đâu?',
        dap: 'pH = pKa ± 1, tức tỉ lệ [A⁻]/[HA] từ 1/10 đến 10/1.',
      },
      {
        hoi: 'Vì sao chuẩn độ acid yếu bằng base mạnh phải dùng phenolphthalein?',
        dap: 'Vì điểm tương đương có pH > 7 (muối bị thuỷ phân), nằm trong khoảng đổi màu của phenolphthalein.',
      },
      {
        hoi: 'Điều gì giới hạn khả năng giữ pH của dung dịch đệm?',
        dap: 'Dung lượng đệm — số mol của acid yếu và base liên hợp; dùng hết một cấu tử là vỡ đệm.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-tinh',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c92-b1',
    grade: '11',
    chapterNumber: 92,
    chapterTitle: 'Chuyên đề HSG — Cân bằng ion trong dung dịch',
    lessonNumber: 1,
    title: 'HSG cấp quốc gia: Tích số tan và kết tủa phân đoạn',
    hook:
      'Trong một cốc nước chứa lẫn ion Cl⁻ và I⁻, chỉ cần nhỏ dung dịch AgNO₃ thật chậm là tách ' +
      'được gần như trọn vẹn iodide ra khỏi chloride — không cần máy móc gì, chỉ cần hai con số ' +
      'tích số tan.',
    theory:
      'TÍCH SỐ TAN (Ksp): với chất ít tan MₘXₙ, cân bằng dị thể MₘXₙ(s) ⇌ mMⁿ⁺ + nXᵐ⁻ có hằng ' +
      'số Ksp = [Mⁿ⁺]^m·[Xᵐ⁻]^n. Chất rắn KHÔNG xuất hiện trong biểu thức vì hoạt độ của pha ' +
      'rắn nguyên chất bằng 1.\n\n' +
      'ĐỘ TAN s (mol/L) suy ra từ Ksp — chú ý mỗi dạng hợp thức cho một liên hệ khác nhau:\n' +
      '— Dạng MX (AgCl): Ksp = s² ⇒ s = √Ksp.\n' +
      '— Dạng MX₂ hoặc M₂X (CaF₂, Ag₂CrO₄): Ksp = 4s³ ⇒ s = ∛(Ksp/4).\n' +
      'Hệ quả quan trọng: KHÔNG được so sánh độ tan của hai chất khác hợp thức bằng cách so ' +
      'trực tiếp Ksp — phải quy về s. Đây là bẫy kinh điển giữa AgCl và Ag₂CrO₄.\n\n' +
      'ĐIỀU KIỆN CÓ KẾT TỦA — so tích số ion Q với Ksp:\n' +
      '— Q < Ksp: chưa bão hoà, không có kết tủa (kết tủa nếu có sẽ tan thêm).\n' +
      '— Q = Ksp: dung dịch bão hoà, đúng ngưỡng bắt đầu kết tủa.\n' +
      '— Q > Ksp: quá bão hoà, kết tủa xuất hiện cho đến khi Q trở về đúng Ksp.\n\n' +
      'HIỆU ỨNG ION CHUNG: thêm một ion đã có sẵn trong kết tủa (ví dụ thêm NaCl vào hệ AgCl) ' +
      'làm cân bằng dịch chuyển theo chiều tạo kết tủa ⇒ độ tan GIẢM. Ngược lại, nếu anion là ' +
      'base yếu (như S²⁻, CO₃²⁻, F⁻) thì hạ pH sẽ làm độ tan TĂNG, vì H⁺ lấy bớt anion ra khỏi ' +
      'cân bằng.\n\n' +
      'KẾT TỦA PHÂN ĐOẠN: khi dung dịch chứa hai anion cùng tạo kết tủa với một cation, chất ' +
      'nào cần nồng độ cation NHỎ hơn để đạt Q = Ksp thì kết tủa TRƯỚC. Việc tách coi là hoàn ' +
      'toàn khi ion tách trước còn lại dưới 10⁻⁶ M vào đúng thời điểm ion thứ hai bắt đầu kết ' +
      'tủa.\n\n' +
      'GIỚI HẠN: mọi tính toán trên bỏ qua lực ion (dùng nồng độ thay hoạt độ) và bỏ qua sự tạo ' +
      'phức của cation với các phối tử có trong dung dịch — ví dụ với NH₃ dư thì AgCl tan ra do ' +
      'tạo phức [Ag(NH₃)₂]⁺, lúc đó tính theo Ksp đơn thuần sẽ sai hẳn.',
    workedExample: {
      problem:
        'Dung dịch chứa đồng thời Cl⁻ 0,010 M và I⁻ 0,010 M. Nhỏ từ từ dung dịch AgNO₃ vào ' +
        '(coi thể tích không đổi). Cho Ksp(AgCl) = 1,8·10⁻¹⁰; Ksp(AgI) = 8,5·10⁻¹⁷. Hỏi kết ' +
        'tủa nào xuất hiện trước, và khi kết tủa thứ hai bắt đầu hình thành thì nồng độ ion thứ ' +
        'nhất còn lại bao nhiêu?',
      steps: [
        'Tính nồng độ Ag⁺ tối thiểu để bắt đầu kết tủa từng chất: với AgI cần ' +
          '[Ag⁺] = Ksp/[I⁻] = 8,5·10⁻¹⁷/0,010 = 8,5·10⁻¹⁵ M.',
        'Với AgCl cần [Ag⁺] = 1,8·10⁻¹⁰/0,010 = 1,8·10⁻⁸ M.',
        'So sánh: AgI cần nồng độ Ag⁺ nhỏ hơn rất nhiều ⇒ AgI kết tủa TRƯỚC (đúng dự đoán từ ' +
          'Ksp bé hơn, vì hai chất cùng hợp thức MX nên được phép so trực tiếp).',
        'Khi AgCl vừa bắt đầu kết tủa, [Ag⁺] trong dung dịch đúng bằng 1,8·10⁻⁸ M.',
        'Lúc đó iodide còn lại: [I⁻] = Ksp(AgI)/[Ag⁺] = 8,5·10⁻¹⁷/1,8·10⁻⁸ ≈ 4,7·10⁻⁹ M.',
        'So với mốc 10⁻⁶ M: 4,7·10⁻⁹ nhỏ hơn hàng trăm lần ⇒ iodide đã bị tách hoàn toàn trước ' +
          'khi chloride kịp kết tủa. Đó là cơ sở của phương pháp kết tủa phân đoạn.',
      ],
      answer:
        'AgI kết tủa trước; khi AgCl bắt đầu kết tủa thì [I⁻] ≈ 4,7·10⁻⁹ M — coi như tách hoàn toàn.',
    },
    checkQuestions: [
      {
        prompt:
          'Dung dịch chứa Cl⁻ 0,010 M, cho Ksp(AgCl) = 1,8·10⁻¹⁰. Tính pAg = −log[Ag⁺] tại ' +
          'thời điểm AgCl BẮT ĐẦU kết tủa (làm tròn 2 chữ số thập phân, chỉ nhập số).',
        answer: { kind: 'numeric', value: 7.74, tolerance: { mode: 'absolute', eps: 0.05 } },
        explain:
          'Ngưỡng kết tủa là lúc Q = Ksp ⇒ [Ag⁺] = Ksp/[Cl⁻] = 1,8·10⁻¹⁰/0,010 = 1,8·10⁻⁸ M. ' +
          'pAg = −log(1,8·10⁻⁸) = 8 − log1,8 = 8 − 0,26 = 7,74.',
      },
      {
        // Câu BẪY trọng tâm: so sánh độ tan bằng cách so thẳng Ksp của hai chất khác hợp thức.
        prompt:
          'Cho Ksp(AgCl) = 1,8·10⁻¹⁰ và Ksp(Ag₂CrO₄) = 1,1·10⁻¹². Chất nào có ĐỘ TAN (mol/L) ' +
          'trong nước lớn hơn?',
        choices: [
          { id: 'agcl', label: 'AgCl, vì Ksp của nó lớn hơn' },
          { id: 'ag2cro4', label: 'Ag₂CrO₄, dù Ksp của nó nhỏ hơn' },
          { id: 'bang', label: 'Hai chất tan như nhau' },
        ],
        answer: { kind: 'choice', correctIds: ['ag2cro4'] },
        explain:
          'Đây là bẫy nổi tiếng nhất của chuyên đề tích số tan: Ksp của hai chất KHÁC hợp thức ' +
          'không so trực tiếp được, vì số mũ trong biểu thức khác nhau. Phải quy về độ tan s. ' +
          'AgCl dạng MX: s = √(1,8·10⁻¹⁰) ≈ 1,3·10⁻⁵ M. Ag₂CrO₄ dạng M₂X: Ksp = (2s)²·s = 4s³ ' +
          '⇒ s = ∛(1,1·10⁻¹²/4) = ∛(2,75·10⁻¹³) ≈ 6,5·10⁻⁵ M. Vậy Ag₂CrO₄ tan GẤP KHOẢNG 5 ' +
          'LẦN AgCl mặc dù Ksp nhỏ hơn tới hai bậc.',
      },
      {
        prompt:
          'Thêm một ít NaCl rắn vào dung dịch bão hoà AgCl (có kết tủa AgCl dư, nhiệt độ không ' +
          'đổi). Độ tan của AgCl thay đổi thế nào?',
        choices: [
          { id: 'tang', label: 'Tăng, vì dung dịch có thêm ion' },
          { id: 'giam', label: 'Giảm, do hiệu ứng ion chung' },
          { id: 'khong', label: 'Không đổi, vì Ksp là hằng số' },
        ],
        answer: { kind: 'choice', correctIds: ['giam'] },
        explain:
          'Lựa chọn "không đổi vì Ksp là hằng số" nghe rất thuyết phục nhưng lẫn hai khái niệm: ' +
          'Ksp quả thật không đổi (chỉ phụ thuộc nhiệt độ), nhưng ĐỘ TAN thì đổi. Thêm Cl⁻ làm ' +
          '[Cl⁻] tăng, mà tích [Ag⁺][Cl⁻] phải giữ nguyên bằng Ksp, nên [Ag⁺] — chính là độ tan ' +
          'của AgCl — buộc phải giảm. Nói theo Le Chatelier: cân bằng AgCl(s) ⇌ Ag⁺ + Cl⁻ dịch ' +
          'về phía tạo thêm kết tủa.',
      },
    ],
    srsCards: [
      {
        hoi: 'Điều kiện xuất hiện kết tủa theo tích số ion Q?',
        dap: 'Q > Ksp thì có kết tủa; Q = Ksp là bão hoà; Q < Ksp thì chưa kết tủa.',
      },
      {
        hoi: 'Vì sao không so được độ tan của AgCl và Ag₂CrO₄ bằng cách so Ksp?',
        dap: 'Vì khác hợp thức: MX cho Ksp = s², M₂X cho Ksp = 4s³ — phải quy về độ tan s.',
      },
      {
        hoi: 'Hiệu ứng ion chung ảnh hưởng thế nào tới độ tan?',
        dap: 'Thêm ion chung làm cân bằng dịch về phía kết tủa ⇒ độ tan giảm (Ksp vẫn không đổi).',
      },
      {
        hoi: 'Khi nào coi kết tủa phân đoạn là tách hoàn toàn?',
        dap: 'Khi ion tách trước còn dưới 10⁻⁶ M vào lúc ion thứ hai bắt đầu kết tủa.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-quoc-gia',
    reviewStatus: 'draft',
  },
]
