// lessons/hoa-hsg-nhiet-dong-hoc.ts — NHÁNH NÂNG CAO (track 'advanced'): chuyên đề bồi dưỡng
// học sinh giỏi về NHIỆT HOÁ HỌC · ĐỘNG HOÁ HỌC · NHIỆT ĐỘNG HỌC.
//
// Ba bài đi tăng dần đúng ba cấp kì thi thật ở Việt Nam:
//   hsg-truong    — định luật Hess, chỉ cần cộng/trừ phương trình nhiệt hoá (với tới được từ
//                   chương trình chuẩn lớp 10, chương Năng lượng hoá học).
//   hsg-tinh      — động hoá học: bậc phản ứng, phương trình tốc độ, chu kì bán huỷ bậc nhất.
//   hsg-quoc-gia  — nhiệt động: ΔG = ΔH − TΔS, chiều tự diễn biến và quan hệ ΔG° = −RT·lnK.
//
// reviewStatus='draft' — nội dung tự soạn, chưa qua giáo viên Hoá duyệt.
// Mã chương 90/91/92 là mã DÀNH RIÊNG cho nhánh HSG, không trùng chương SGK (1..8).
import type { ChemLesson } from '../lessonTypes.js'

export const HOA_HSG_NHIET_DONG_LESSONS: ChemLesson[] = [
  {
    id: 'hoa10-c90-b1',
    grade: '10',
    chapterNumber: 90,
    chapterTitle: 'Chuyên đề HSG — Nhiệt hoá học',
    lessonNumber: 1,
    title: 'HSG cấp trường: Định luật Hess và các cách tính nhiệt phản ứng',
    hook:
      'Không ai đo được trực tiếp nhiệt của phản ứng C(s) + ½O₂(g) → CO(g), vì đốt than trong ' +
      'thiếu oxygen thì luôn thu được hỗn hợp CO và CO₂. Vậy mà con số −110,5 kJ/mol vẫn nằm ' +
      'trong mọi bảng tra. Người ta lấy nó ở đâu ra?',
    theory:
      'ĐỊNH LUẬT HESS: biến thiên enthalpy của một phản ứng chỉ phụ thuộc TRẠNG THÁI ĐẦU và ' +
      'TRẠNG THÁI CUỐI của hệ, không phụ thuộc đường đi.\n\n' +
      'VÌ SAO đúng? Vì enthalpy là một HÀM TRẠNG THÁI: giá trị của nó do trạng thái hiện tại ' +
      'của hệ quyết định, giống như độ cao của một điểm trên núi không phụ thuộc bạn leo đường ' +
      'nào. Nhờ vậy ta được phép cộng, trừ, nhân các phương trình nhiệt hoá như cộng trừ đại số.\n\n' +
      '## Hai hệ quả dùng liên tục khi giải đề\n' +
      '1. Đảo chiều phản ứng thì ΔH đổi dấu.\n' +
      '2. Nhân phương trình với hệ số k thì ΔH cũng nhân k (vì ΔH gắn với đúng phương trình đã ' +
      'viết, không phải với "một mol chất bất kì").\n\n' +
      '## Ba công thức tính ΔᵣH° và điều kiện dùng\n' +
      '— Theo nhiệt tạo thành: ΔᵣH° = Σn·ΔfH°(sản phẩm) − Σn·ΔfH°(chất đầu). Điều kiện: tra ' +
      'được ΔfH° của MỌI chất, và phải đúng TRẠNG THÁI (l, g, s) ghi trong bảng — cùng một ' +
      'chất ở trạng thái khác nhau có ΔfH° khác nhau (H₂O lỏng: −285,8; H₂O hơi: −241,8 kJ/mol).\n' +
      '— Theo năng lượng liên kết: ΔᵣH° = ΣEb(bị phá vỡ) − ΣEb(hình thành). Điều kiện: chỉ dùng ' +
      'cho phản ứng mà MỌI chất đều ở thể KHÍ, và kết quả chỉ là gần đúng vì Eb là giá trị ' +
      'trung bình.\n' +
      '— Theo nhiệt đốt cháy: ΔᵣH° = Σn·ΔcH°(chất đầu) − Σn·ΔcH°(sản phẩm) — chú ý thứ tự ' +
      'NGƯỢC với công thức nhiệt tạo thành. Rất hay dùng cho hợp chất hữu cơ.\n\n' +
      'GIỚI HẠN: mọi con số trên là ở điều kiện chuẩn (298 K, 1 bar). ΔᵣH cho biết phản ứng toả ' +
      'hay thu nhiệt, nhưng KHÔNG cho biết phản ứng có tự xảy ra hay không (việc đó cần ΔG — ' +
      'xem bài HSG cấp quốc gia) và cũng không nói gì về tốc độ.',
    workedExample: {
      problem:
        'Cho: (1) C(s) + O₂(g) → CO₂(g), ΔH₁ = −393,5 kJ; (2) CO(g) + ½O₂(g) → CO₂(g), ' +
        'ΔH₂ = −283,0 kJ. Tính nhiệt tạo thành chuẩn của CO(g), tức ΔH của phản ứng ' +
        'C(s) + ½O₂(g) → CO(g).',
      steps: [
        'Xác định phương trình ĐÍCH: C(s) + ½O₂(g) → CO(g). Chất C nằm ở vế trái, CO nằm ở vế phải.',
        'Phương trình (1) đã có C ở vế trái — giữ nguyên.',
        'Phương trình (2) có CO ở vế TRÁI, trong khi đích cần CO ở vế PHẢI ⇒ đảo chiều (2): ' +
          'CO₂(g) → CO(g) + ½O₂(g), khi đó ΔH đổi dấu thành +283,0 kJ.',
        'Cộng hai phương trình: C(s) + O₂ + CO₂ → CO₂ + CO + ½O₂. Giản ước CO₂ ở hai vế và bớt ' +
          '½O₂ hai vế, còn lại đúng phương trình đích C(s) + ½O₂(g) → CO(g).',
        'Cộng nhiệt tương ứng: ΔH = ΔH₁ + (−ΔH₂) = −393,5 + 283,0 = −110,5 kJ.',
      ],
      answer: 'ΔfH°(CO, g) = −110,5 kJ/mol',
    },
    checkQuestions: [
      {
        prompt:
          'Cho ΔfH°(CO₂, g) = −393,5 kJ/mol và ΔH của phản ứng CO(g) + ½O₂(g) → CO₂(g) bằng ' +
          '−283,0 kJ. Tính ΔfH°(CO, g), đơn vị kJ/mol (chỉ nhập số, kèm dấu).',
        answer: { kind: 'numeric', value: -110.5, tolerance: { mode: 'absolute', eps: 0.2 } },
        explain:
          'ΔfH°(CO) = ΔfH°(CO₂) − ΔH(đốt CO) = −393,5 − (−283,0) = −110,5 kJ/mol. Cách hiểu: ' +
          'đi từ C tới CO₂ theo hai chặng (C → CO rồi CO → CO₂) phải tốn đúng bằng đi thẳng.',
      },
      {
        // Câu BẪY: quên rằng đảo chiều thì đổi dấu VÀ nhân hệ số thì nhân luôn ΔH.
        prompt:
          'Biết CO(g) + ½O₂(g) → CO₂(g) có ΔH = −283,0 kJ. Tính ΔH của phản ứng ' +
          '2CO₂(g) → 2CO(g) + O₂(g), đơn vị kJ (chỉ nhập số, kèm dấu).',
        answer: { kind: 'numeric', value: 566, tolerance: { mode: 'absolute', eps: 0.5 } },
        explain:
          'Hai thao tác phải làm CẢ HAI, thiếu một là sai: (a) đảo chiều ⇒ ΔH đổi dấu thành ' +
          '+283,0 kJ; (b) nhân đôi hệ số ⇒ ΔH nhân đôi thành +566 kJ. Đáp án −283 là quên cả ' +
          'hai, +283 là quên nhân hệ số, −566 là quên đổi dấu. Nhớ: ΔH gắn với ĐÚNG phương ' +
          'trình như đã viết ra.',
      },
      {
        prompt:
          'Tính ΔᵣH° của phản ứng CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(g) — chú ý nước ở thể HƠI. ' +
          'Cho ΔfH°: CH₄(g) = −74,8; CO₂(g) = −393,5; H₂O(g) = −241,8 kJ/mol; O₂(g) = 0. ' +
          'Đơn vị kJ (chỉ nhập số, kèm dấu).',
        answer: { kind: 'numeric', value: -802.3, tolerance: { mode: 'absolute', eps: 1 } },
        explain:
          'ΔᵣH° = [(−393,5) + 2×(−241,8)] − [(−74,8) + 0] = (−877,1) + 74,8 = −802,3 kJ. Bẫy ' +
          'của câu này là dùng nhầm ΔfH° của H₂O LỎNG (−285,8) và ra −890,3 kJ. Đề ghi H₂O(g) ' +
          'thì phải lấy số của thể hơi: hai trạng thái chênh nhau đúng bằng nhiệt hoá hơi của ' +
          'nước, và đề HSG rất hay bẫy đúng chỗ này.',
      },
    ],
    srsCards: [
      {
        hoi: 'Định luật Hess phát biểu thế nào và dựa trên tính chất gì?',
        dap: 'ΔH chỉ phụ thuộc trạng thái đầu và cuối, không phụ thuộc đường đi — vì enthalpy là hàm trạng thái.',
      },
      {
        hoi: 'Hai hệ quả dùng khi tổ hợp phương trình nhiệt hoá?',
        dap: 'Đảo chiều thì ΔH đổi dấu; nhân phương trình với k thì ΔH nhân k.',
      },
      {
        hoi: 'Công thức nhiệt đốt cháy khác công thức nhiệt tạo thành ở điểm nào?',
        dap: 'Thứ tự ngược nhau: ΔᵣH° = Σ ΔcH°(chất đầu) − Σ ΔcH°(sản phẩm).',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-truong',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa10-c91-b1',
    grade: '10',
    chapterNumber: 91,
    chapterTitle: 'Chuyên đề HSG — Động hoá học',
    lessonNumber: 1,
    title: 'HSG cấp tỉnh: Bậc phản ứng, phương trình tốc độ và chu kì bán huỷ',
    hook:
      'Thuốc trong máu, chất phóng xạ trong mẫu vật khảo cổ và khí N₂O₅ trong bình phản ứng đều ' +
      'giảm theo cùng một quy luật toán học. Biết quy luật đó, chỉ cần hai số đo là đoán được ' +
      'lượng chất còn lại sau bất kì khoảng thời gian nào.',
    theory:
      'PHƯƠNG TRÌNH TỐC ĐỘ: với phản ứng aA + bB → sản phẩm, thực nghiệm cho v = k·[A]^m·[B]^n. ' +
      'm, n gọi là BẬC riêng theo A, theo B; m + n là bậc chung của phản ứng.\n\n' +
      'ĐIỂM MẤU CHỐT hay bị hiểu sai: m, n KHÔNG nhất thiết bằng hệ số a, b trong phương trình ' +
      'hoá học. Chúng chỉ bằng nhau khi phản ứng xảy ra qua ĐÚNG MỘT GIAI ĐOẠN (phản ứng đơn ' +
      'giản). Đa số phản ứng đi qua nhiều giai đoạn, và tốc độ chung do GIAI ĐOẠN CHẬM NHẤT ' +
      'quyết định, nên bậc phải xác định bằng THỰC NGHIỆM chứ không suy từ phương trình.\n\n' +
      'PHƯƠNG PHÁP TỐC ĐỘ ĐẦU (dạng bài ra nhiều nhất): làm nhiều thí nghiệm, mỗi lần chỉ đổi ' +
      'nồng độ MỘT chất rồi xem tốc độ đổi bao nhiêu lần. Nếu nồng độ tăng 2 lần mà tốc độ tăng ' +
      '2 lần ⇒ bậc 1; tăng 4 lần ⇒ bậc 2 (vì 2² = 4); tốc độ không đổi ⇒ bậc 0.\n\n' +
      'PHẢN ỨNG BẬC NHẤT — bộ công thức cần thuộc:\n' +
      '— Dạng tích phân: ln([A]₀/[A]) = k·t, hay [A] = [A]₀·e^(−kt).\n' +
      '— Chu kì bán huỷ: t½ = ln2/k ≈ 0,693/k. Đặc điểm RIÊNG của bậc nhất: t½ KHÔNG phụ thuộc ' +
      'nồng độ ban đầu — cứ sau mỗi t½ thì lượng chất còn lại một nửa. Sau n lần t½ còn ' +
      '(1/2)ⁿ phần.\n' +
      '— Đơn vị của k bậc nhất là (thời gian)⁻¹; bậc hai là L·mol⁻¹·(thời gian)⁻¹. Kiểm đơn vị ' +
      'của k là cách nhanh nhất để phát hiện mình xác định nhầm bậc.\n\n' +
      'ẢNH HƯỞNG CỦA NHIỆT ĐỘ (phương trình Arrhenius): k = A·e^(−Ea/RT). Nhiệt độ tăng làm ' +
      'PHẦN phân tử có năng lượng ≥ Ea tăng theo hàm mũ — đó là lý do sâu xa của quy tắc kinh ' +
      "nghiệm Van't Hoff (tăng 10 °C thì tốc độ tăng 2–4 lần), chứ không phải vì phân tử chạy " +
      'nhanh hơn một chút.',
    workedExample: {
      problem:
        'Phản ứng phân huỷ N₂O₅ là phản ứng bậc nhất, có chu kì bán huỷ t½ = 20 phút ở nhiệt độ ' +
        'khảo sát. Ban đầu có 0,80 mol/L N₂O₅. Tính hằng số tốc độ k và nồng độ N₂O₅ còn lại ' +
        'sau 60 phút.',
      steps: [
        'Với phản ứng bậc nhất: t½ = ln2/k ⇒ k = ln2/t½ = 0,693/20 ≈ 0,0347 phút⁻¹. Đơn vị ' +
          '(phút)⁻¹ đúng với phản ứng bậc nhất — một dấu hiệu kiểm tra nhanh.',
        'Đếm số chu kì bán huỷ trong 60 phút: n = 60/20 = 3.',
        'Sau mỗi t½ nồng độ còn một nửa ⇒ sau 3 chu kì còn (1/2)³ = 1/8 lượng ban đầu.',
        '[N₂O₅] = 0,80 × 1/8 = 0,10 mol/L.',
        'Kiểm lại bằng công thức tích phân: [A] = 0,80·e^(−0,0347×60) = 0,80·e^(−2,08) ≈ ' +
          '0,80 × 0,125 = 0,10 mol/L — khớp.',
      ],
      answer: 'k ≈ 0,0347 phút⁻¹; còn lại 0,10 mol/L (12,5% lượng ban đầu).',
    },
    checkQuestions: [
      {
        prompt:
          'Một phản ứng bậc nhất có chu kì bán huỷ 15 phút. Sau 45 phút, phần trăm lượng chất ' +
          'đầu CÒN LẠI là bao nhiêu (%, chỉ nhập số)?',
        answer: { kind: 'numeric', value: 12.5, tolerance: { mode: 'absolute', eps: 0.2 } },
        explain:
          '45/15 = 3 chu kì bán huỷ ⇒ còn (1/2)³ = 1/8 = 12,5%. Sai lầm thường gặp là trừ ' +
          'tuyến tính "mỗi chu kì mất 50%, ba chu kì mất 150% nên hết sạch". Phân huỷ bậc nhất ' +
          'giảm theo cấp số NHÂN, mỗi chu kì lấy đi một nửa của phần CÒN LẠI, nên về lý thuyết ' +
          'không bao giờ về đúng 0.',
      },
      {
        // Câu BẪY trọng tâm: lấy bậc phản ứng từ HỆ SỐ phương trình.
        prompt:
          'Cho phản ứng 2NO(g) + O₂(g) → 2NO₂(g). Thực nghiệm: giữ nguyên [O₂], tăng [NO] lên ' +
          '3 lần thì tốc độ đầu tăng 9 lần. Bậc riêng của phản ứng theo NO bằng bao nhiêu? ' +
          '(chỉ nhập số)',
        answer: { kind: 'numeric', value: 2 },
        explain:
          'Đáp số đúng là 2, nhưng lý do KHÔNG phải "vì hệ số của NO là 2". Ta suy từ số liệu: ' +
          'tốc độ tăng 9 = 3^m ⇒ m = 2. Bậc phản ứng luôn phải lấy từ THỰC NGHIỆM; nó chỉ tình ' +
          'cờ trùng hệ số khi phản ứng xảy ra một giai đoạn. Đề HSG thường cho một phản ứng mà ' +
          'bậc KHÁC hệ số để loại đúng những bạn suy từ phương trình.',
      },
      {
        prompt:
          'Một phản ứng bậc nhất có hằng số tốc độ k = 0,0231 phút⁻¹. Tính chu kì bán huỷ t½ ' +
          '(phút, chỉ nhập số, làm tròn đến hàng đơn vị).',
        answer: { kind: 'numeric', value: 30, tolerance: { mode: 'absolute', eps: 0.6 } },
        explain:
          't½ = ln2/k = 0,693/0,0231 = 30 phút. Với bậc nhất, t½ không phụ thuộc nồng độ đầu.',
      },
    ],
    srsCards: [
      {
        hoi: 'Bậc phản ứng có suy được từ hệ số phương trình không?',
        dap: 'Không — phải xác định bằng thực nghiệm; chỉ trùng hệ số khi phản ứng xảy ra một giai đoạn.',
      },
      {
        hoi: 'Công thức chu kì bán huỷ của phản ứng bậc nhất?',
        dap: 't½ = ln2/k ≈ 0,693/k, không phụ thuộc nồng độ ban đầu.',
      },
      {
        hoi: 'Cách xác định bậc riêng bằng phương pháp tốc độ đầu?',
        dap: 'Chỉ đổi nồng độ một chất; nồng độ tăng p lần mà tốc độ tăng p^m lần thì bậc riêng là m.',
      },
      {
        hoi: 'Đơn vị của k cho biết điều gì?',
        dap: 'Cho biết bậc: bậc nhất là (thời gian)⁻¹, bậc hai là L·mol⁻¹·(thời gian)⁻¹.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-tinh',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa10-c92-b1',
    grade: '10',
    chapterNumber: 92,
    chapterTitle: 'Chuyên đề HSG — Nhiệt động học',
    lessonNumber: 1,
    title: 'HSG cấp quốc gia: ΔG = ΔH − TΔS, chiều tự diễn biến và hằng số cân bằng',
    hook:
      'Nung đá vôi là phản ứng thu nhiệt mạnh — theo trực giác "toả nhiệt mới dễ xảy ra" thì nó ' +
      'không nên xảy ra chút nào. Vậy mà mọi lò vôi trên cả nước vẫn chạy. Cái gì đã lật ngược ' +
      'thế cờ ở nhiệt độ cao?',
    theory:
      'HAI ĐỘNG LỰC CỦA MỘT BIẾN ĐỔI: hệ vừa "muốn" hạ năng lượng (ΔH < 0) vừa "muốn" tăng độ ' +
      'hỗn loạn (ΔS > 0). Khi hai xu hướng này ngược nhau thì cái nào thắng phụ thuộc NHIỆT ĐỘ. ' +
      'Đại lượng gộp cả hai là NĂNG LƯỢNG GIBBS:\n\n' +
      '    ΔG = ΔH − T·ΔS\n\n' +
      '## Tiêu chuẩn tự diễn biến (ở áp suất và nhiệt độ không đổi)\n' +
      '— ΔG < 0: phản ứng tự xảy ra theo chiều thuận.\n' +
      '— ΔG > 0: không tự xảy ra (chiều nghịch mới tự xảy ra).\n' +
      '— ΔG = 0: hệ ở trạng thái cân bằng.\n\n' +
      'BỐN TRƯỜNG HỢP DẤU — nên thuộc vì đề hay hỏi "ở nhiệt độ nào thì...":\n' +
      '— ΔH < 0, ΔS > 0: tự xảy ra ở MỌI nhiệt độ.\n' +
      '— ΔH > 0, ΔS < 0: không bao giờ tự xảy ra.\n' +
      '— ΔH < 0, ΔS < 0: tự xảy ra ở nhiệt độ THẤP.\n' +
      '— ΔH > 0, ΔS > 0: tự xảy ra ở nhiệt độ CAO (đây chính là trường hợp nung vôi). Nhiệt độ ' +
      'ngưỡng tìm từ điều kiện ΔG = 0 ⇒ T = ΔH/ΔS.\n\n' +
      'BẪY ĐƠN VỊ KINH ĐIỂN: ΔH thường cho bằng kJ, còn ΔS bằng J·K⁻¹. Phải đổi về cùng đơn vị ' +
      'trước khi trừ — quên bước này thì kết quả lệch đúng 1000 lần.\n\n' +
      'LIÊN HỆ VỚI HẰNG SỐ CÂN BẰNG: ΔG° = −R·T·lnK, với R = 8,314 J·mol⁻¹·K⁻¹.\n' +
      '— ΔG° < 0 ⇒ K > 1: ở cân bằng sản phẩm chiếm ưu thế.\n' +
      '— ΔG° = 0 ⇒ K = 1.\n' +
      '— ΔG° > 0 ⇒ K < 1: chất đầu chiếm ưu thế.\n\n' +
      'GIỚI HẠN PHẢI NHỚ: ΔG chỉ nói phản ứng CÓ THỂ tự xảy ra hay không, hoàn toàn không nói ' +
      'gì về TỐC ĐỘ. Phản ứng C(kim cương) → C(than chì) có ΔG < 0 mà kim cương vẫn tồn tại ' +
      'hàng triệu năm, vì rào năng lượng hoạt hoá quá cao. Nhiệt động học trả lời "đi được ' +
      'không", động hoá học trả lời "đi nhanh cỡ nào" — hai câu hỏi khác nhau.',
    workedExample: {
      problem:
        'Phản ứng nung vôi CaCO₃(s) → CaO(s) + CO₂(g) có ΔH° = +178,3 kJ và ΔS° = ' +
        '+160,6 J·K⁻¹. Hỏi ở 298 K phản ứng có tự xảy ra không, và từ nhiệt độ nào trở lên thì ' +
        'nó bắt đầu tự xảy ra (coi ΔH°, ΔS° không đổi theo nhiệt độ)?',
      steps: [
        'Đưa về cùng đơn vị: ΔS° = 160,6 J·K⁻¹ = 0,1606 kJ·K⁻¹. Bỏ qua bước này là sai số 1000 lần.',
        'Tính ΔG° ở 298 K: ΔG° = 178,3 − 298 × 0,1606 = 178,3 − 47,9 = +130,4 kJ.',
        'ΔG° > 0 ⇒ ở nhiệt độ phòng phản ứng KHÔNG tự xảy ra — đúng thực tế: đá vôi để ngoài ' +
          'trời không tự phân huỷ.',
        'Vì ΔH > 0 và ΔS > 0 nên số hạng −T·ΔS ngày càng âm khi T tăng; tồn tại nhiệt độ ngưỡng ' +
          'mà ΔG đổi dấu. Đặt ΔG° = 0: T = ΔH°/ΔS° = 178,3/0,1606 ≈ 1110 K (khoảng 837 °C).',
        'Kết luận: trên khoảng 1110 K phản ứng tự xảy ra — khớp với thực tế lò nung vôi công ' +
          'nghiệp phải chạy ở 900–1000 °C.',
      ],
      answer: 'ΔG°(298 K) = +130,4 kJ (không tự xảy ra); tự xảy ra khi T ≳ 1110 K (~837 °C).',
    },
    checkQuestions: [
      {
        prompt:
          'Phản ứng có ΔH° = +178,3 kJ và ΔS° = +160,6 J·K⁻¹. Tính nhiệt độ tối thiểu (K) để ' +
          'phản ứng bắt đầu tự diễn biến (chỉ nhập số, làm tròn đến hàng đơn vị).',
        answer: { kind: 'numeric', value: 1110, tolerance: { mode: 'absolute', eps: 15 } },
        explain:
          'Ngưỡng là chỗ ΔG° = 0 ⇒ T = ΔH°/ΔS°. Phải đổi ΔS° = 0,1606 kJ·K⁻¹ trước: ' +
          'T = 178,3/0,1606 ≈ 1110 K. Nếu bạn ra 1,11 K thì đã quên đổi đơn vị — đây là lỗi ' +
          'mất điểm phổ biến nhất của cả chuyên đề này.',
      },
      {
        // Câu BẪY: "toả nhiệt thì luôn tự xảy ra".
        prompt:
          'Nhận định nào sau đây ĐÚNG về mối quan hệ giữa dấu của ΔH và khả năng tự diễn biến ' +
          'của một phản ứng?',
        choices: [
          { id: 'toa', label: 'Phản ứng toả nhiệt (ΔH < 0) thì luôn tự xảy ra' },
          { id: 'thu', label: 'Phản ứng thu nhiệt (ΔH > 0) thì không bao giờ tự xảy ra' },
          {
            id: 'gibbs',
            label:
              'Phải xét ΔG = ΔH − TΔS; phản ứng thu nhiệt vẫn tự xảy ra nếu ΔS > 0 và T đủ lớn',
          },
          { id: 'nhanh', label: 'Phản ứng có ΔG < 0 thì chắc chắn xảy ra nhanh' },
        ],
        answer: { kind: 'choice', correctIds: ['gibbs'] },
        explain:
          'Hai bẫy gộp trong một câu. Thứ nhất, dấu của ΔH một mình không quyết định: hoà tan ' +
          'NH₄NO₃ thu nhiệt mà vẫn tự xảy ra nhờ ΔS > 0, còn nung vôi thu nhiệt thì cần thêm ' +
          'nhiệt độ cao. Tiêu chuẩn duy nhất là dấu của ΔG. Thứ hai, lựa chọn cuối lẫn nhiệt ' +
          'động với động học: ΔG < 0 chỉ nói phản ứng CÓ THỂ xảy ra, tốc độ lại do năng lượng ' +
          'hoạt hoá quyết định — kim cương chuyển thành than chì có ΔG < 0 nhưng chậm tới mức ' +
          'không quan sát được.',
      },
      {
        prompt:
          'Một phản ứng ở 298 K có ΔG° = 0. Hằng số cân bằng K của phản ứng đó bằng bao nhiêu? ' +
          '(chỉ nhập số)',
        answer: { kind: 'numeric', value: 1 },
        explain:
          'Từ ΔG° = −R·T·lnK: ΔG° = 0 ⇒ lnK = 0 ⇒ K = 1 (không phải K = 0 — đây là chỗ nhầm ' +
          'hay gặp). K = 1 nghĩa là ở cân bằng, chất đầu và sản phẩm có mức "ưu thế" ngang nhau ' +
          'theo biểu thức hằng số cân bằng.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức năng lượng Gibbs và tiêu chuẩn tự diễn biến?',
        dap: 'ΔG = ΔH − TΔS; tự xảy ra khi ΔG < 0, cân bằng khi ΔG = 0.',
      },
      {
        hoi: 'Phản ứng ΔH > 0, ΔS > 0 tự xảy ra khi nào?',
        dap: 'Khi nhiệt độ đủ cao: T > ΔH/ΔS.',
      },
      { hoi: 'Quan hệ giữa ΔG° và hằng số cân bằng K?', dap: 'ΔG° = −RT·lnK; ΔG° < 0 ⇒ K > 1.' },
      {
        hoi: 'ΔG < 0 có nghĩa phản ứng xảy ra nhanh không?',
        dap: 'Không. ΔG nói về khả năng tự diễn biến, tốc độ do năng lượng hoạt hoá quyết định.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-quoc-gia',
    reviewStatus: 'draft',
  },
]
