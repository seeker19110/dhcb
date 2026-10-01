// lessons/hoa-hsg-huu-co-va-hon-hop.ts — NHÁNH NÂNG CAO (track 'advanced'): chuyên đề bồi
// dưỡng HSG về XÁC ĐỊNH CÔNG THỨC HỢP CHẤT HỮU CƠ, BÀI TOÁN HỖN HỢP NHIỀU PHẢN ỨNG và
// CƠ CHẾ PHẢN ỨNG HỮU CƠ.
//
// Ba cấp tăng dần:
//   hsg-truong    — lập công thức phân tử từ dữ kiện đốt cháy + phân tử khối.
//   hsg-tinh      — hỗn hợp kim loại tác dụng HNO₃: ba định luật bảo toàn dùng phối hợp.
//   hsg-quoc-gia  — cơ chế SN1/SN2/E1/E2 và hệ quả về hoá lập thể.
//
// reviewStatus='draft' — nội dung tự soạn, chưa qua giáo viên Hoá duyệt.
import type { ChemLesson } from '../lessonTypes.js'

export const HOA_HSG_HUU_CO_LESSONS: ChemLesson[] = [
  {
    id: 'hoa11-c93-b1',
    grade: '11',
    chapterNumber: 93,
    chapterTitle: 'Chuyên đề HSG — Xác định công thức hợp chất hữu cơ',
    lessonNumber: 1,
    title: 'HSG cấp trường: Lập công thức phân tử từ dữ kiện đốt cháy',
    hook:
      'Một chất lỏng không nhãn trong phòng thí nghiệm. Đốt cháy hết 6 gam của nó, cân lượng ' +
      'CO₂ và H₂O sinh ra, đo thêm phân tử khối bằng phổ khối — chỉ ba số liệu ấy đã đủ để gọi ' +
      'đúng tên chất, không cần thử một phản ứng nhận biết nào.',
    theory:
      'NGUYÊN TẮC GỐC: đốt cháy hoàn toàn hợp chất hữu cơ thì mọi nguyên tử carbon đi hết vào ' +
      'CO₂ và mọi nguyên tử hydrogen đi hết vào H₂O. Đó là ĐỊNH LUẬT BẢO TOÀN NGUYÊN TỐ, và ' +
      'toàn bộ dạng bài này chỉ là hệ quả của nó:\n\n' +
      '    n(C trong X) = n(CO₂)     ·     n(H trong X) = 2·n(H₂O)\n\n' +
      'Hệ số 2 ở vế H là chỗ mất điểm nhiều nhất: một phân tử H₂O chứa HAI nguyên tử H.\n\n' +
      'TÌM OXYGEN — không đo trực tiếp được, phải suy ra bằng bảo toàn khối lượng:\n' +
      '    m(O trong X) = m(X) − m(C) − m(H) = m(X) − 12·n(C) − 1·n(H)\n' +
      'rồi n(O) = m(O)/16. Nếu ra n(O) = 0 (hoặc âm một chút do làm tròn) thì X chỉ gồm C và H.\n' +
      'Cách thứ hai, thường nhanh hơn khi đề cho số mol O₂: bảo toàn nguyên tố O ⇒ ' +
      'n(O trong X) + 2·n(O₂) = 2·n(CO₂) + n(H₂O).\n\n' +
      '## Hai bước cuối\n' +
      '1. Lập công thức ĐƠN GIẢN NHẤT từ tỉ lệ nguyên tối giản n(C) : n(H) : n(O).\n' +
      '2. Dùng phân tử khối M để nhân lên thành công thức PHÂN TỬ. Không có M thì chỉ dừng ' +
      'được ở công thức đơn giản nhất — đây là giới hạn phải nêu rõ khi trình bày lời giải.\n\n' +
      '## Kiểm tra tính hợp lí (bước mà học sinh hay bỏ, giám khảo lại hay trừ điểm)\n' +
      '— Độ bất bão hoà k = (2C + 2 + N − H)/2 phải là số nguyên không âm. k = 0 là mạch hở no; ' +
      'k = 1 có một liên kết đôi hoặc một vòng; k = 4 thường báo hiệu vòng benzene.\n' +
      '— Số H phải cùng tính chẵn lẻ với quy tắc hoá trị (hợp chất chỉ chứa C, H, O thì số H ' +
      'luôn chẵn).\n\n' +
      'DẤU HIỆU NHANH TỪ TỈ LỆ CO₂/H₂O: n(H₂O) > n(CO₂) ⇒ hợp chất no, mạch hở (ví dụ alkane, ' +
      'alcohol no đơn chức mạch hở); n(H₂O) = n(CO₂) ⇒ có một liên kết pi hoặc một vòng; ' +
      'n(H₂O) < n(CO₂) ⇒ nhiều liên kết pi hoặc có vòng thơm.',
    workedExample: {
      problem:
        'Đốt cháy hoàn toàn 0,10 mol hợp chất hữu cơ X (chỉ chứa C, H, O) thu được 0,30 mol CO₂ ' +
        'và 0,40 mol H₂O. Biết phân tử khối của X bằng 60. Xác định công thức phân tử của X và ' +
        'cho biết X có thể là chất nào.',
      steps: [
        'Số nguyên tử C trong một phân tử X: n(C) = n(CO₂)/n(X) = 0,30/0,10 = 3.',
        'Số nguyên tử H: n(H) = 2·n(H₂O)/n(X) = 2×0,40/0,10 = 8. (Quên nhân 2 sẽ ra 4 và hỏng ' +
          'toàn bài.)',
        'Khối lượng C và H trong một mol X: 12×3 + 1×8 = 44 g. Vì M = 60 nên phần còn lại ' +
          '60 − 44 = 16 g thuộc về oxygen ⇒ n(O) = 16/16 = 1.',
        'Công thức phân tử: C₃H₈O.',
        'Kiểm tra độ bất bão hoà: k = (2×3 + 2 − 8)/2 = 0 ⇒ hợp chất no, mạch hở — nhất quán ' +
          'với dấu hiệu n(H₂O) = 0,40 > n(CO₂) = 0,30.',
        'C₃H₈O có các đồng phân: propan-1-ol, propan-2-ol (alcohol) và ethyl methyl ether. Chỉ ' +
          'với dữ kiện đã cho thì chưa phân biệt được — cần thêm dữ kiện hoá tính (ví dụ phản ' +
          'ứng với Na).',
      ],
      answer: 'X có công thức phân tử C₃H₈O (k = 0, no mạch hở).',
    },
    checkQuestions: [
      {
        prompt:
          'Đốt cháy hoàn toàn 0,10 mol hợp chất hữu cơ X (chứa C, H, O) thu được 0,30 mol CO₂ ' +
          'và 0,40 mol H₂O; phân tử khối của X bằng 60. Viết công thức phân tử của X (ví dụ ' +
          'cách ghi: C2H6O).',
        answer: { kind: 'chemFormula', formula: 'C3H8O' },
        explain:
          'n(C) = 0,30/0,10 = 3; n(H) = 2×0,40/0,10 = 8; phần khối lượng còn lại 60 − (36 + 8) ' +
          '= 16 ⇒ 1 nguyên tử O. Công thức phân tử là C₃H₈O.',
      },
      {
        // Câu BẪY chủ đạo: quên hệ số 2 khi đổi n(H₂O) sang n(H).
        prompt:
          'Đốt cháy hoàn toàn 0,20 mol hydrocarbon Y thu được 0,60 mol CO₂ và 0,60 mol H₂O. ' +
          'Số nguyên tử hydrogen trong một phân tử Y bằng bao nhiêu? (chỉ nhập số)',
        answer: { kind: 'numeric', value: 6 },
        explain:
          'Nếu bạn ra 3 thì đã lấy thẳng n(H₂O)/n(Y) = 0,60/0,20 — quên rằng mỗi phân tử H₂O ' +
          'mang HAI nguyên tử H. Đúng: n(H) = 2×0,60/0,20 = 6. Kèm n(C) = 0,60/0,20 = 3, ta ' +
          'được C₃H₆ (k = 1: propene hoặc cyclopropane). Ngoài ra "3 nguyên tử H" còn vô lí về ' +
          'hoá trị: hydrocarbon chỉ chứa C và H luôn có số H chẵn.',
      },
      {
        prompt:
          'Đốt cháy hoàn toàn một hydrocarbon Z thu được n(H₂O) = 0,50 mol và n(CO₂) = 0,50 ' +
          'mol. Độ bất bão hoà k của Z bằng bao nhiêu? (chỉ nhập số)',
        answer: { kind: 'numeric', value: 1 },
        explain:
          'n(H₂O) = n(CO₂) ⇒ tỉ lệ H : C = 2 : 1 ⇒ công thức dạng CₙH₂ₙ. Thay vào ' +
          'k = (2n + 2 − 2n)/2 = 1: phân tử có đúng một liên kết pi HOẶC một vòng no. Lưu ý ' +
          'k = 1 chưa đủ để kết luận là alkene — cycloalkane cũng cho k = 1, muốn tách hai khả ' +
          'năng phải thử nước bromine.',
      },
    ],
    srsCards: [
      {
        hoi: 'Hai hệ thức bảo toàn nguyên tố khi đốt cháy hợp chất hữu cơ?',
        dap: 'n(C) = n(CO₂) và n(H) = 2·n(H₂O).',
      },
      {
        hoi: 'Cách tìm số nguyên tử oxygen trong hợp chất?',
        dap: 'm(O) = m(X) − 12·n(C) − n(H), rồi n(O) = m(O)/16 (hoặc bảo toàn O qua lượng O₂ đã dùng).',
      },
      {
        hoi: 'Công thức độ bất bão hoà và ý nghĩa?',
        dap: 'k = (2C + 2 + N − H)/2; k = 0 no mạch hở, k = 1 có 1 pi hoặc 1 vòng, k = 4 thường là vòng benzene.',
      },
      {
        hoi: 'Không có phân tử khối M thì xác định được tới đâu?',
        dap: 'Chỉ tới công thức đơn giản nhất, chưa ra được công thức phân tử.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-truong',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c94-b1',
    grade: '11',
    chapterNumber: 94,
    chapterTitle: 'Chuyên đề HSG — Bài toán hỗn hợp nhiều phản ứng',
    lessonNumber: 1,
    title: 'HSG cấp tỉnh: Hỗn hợp kim loại tác dụng HNO₃ và ba định luật bảo toàn',
    hook:
      'Đề cho một hỗn hợp hai kim loại, một dung dịch HNO₃, một khí thoát ra — và hỏi khối lượng ' +
      'muối. Viết đủ phương trình rồi đặt ẩn giải hệ cũng ra, nhưng mất 15 phút. Dân chuyên giải ' +
      'trong hai dòng, vì họ không thèm viết phương trình nào.',
    theory:
      'Ý TƯỞNG CỐT LÕI: trong bài toán oxi hoá – khử phức tạp, ta không cần biết phản ứng đi qua ' +
      'những bước nào, chỉ cần đếm đúng ELECTRON và đếm đúng NGUYÊN TỬ ở đầu và cuối. Ba định ' +
      'luật bảo toàn dưới đây dùng phối hợp sẽ thay cho cả hệ phương trình.\n\n' +
      '1. BẢO TOÀN ELECTRON: Σn(e nhường) = Σn(e nhận). Với kim loại M hoá trị n thì mỗi mol M ' +
      'nhường n mol electron. Số mol electron mà HNO₃ nhận phụ thuộc SẢN PHẨM KHỬ:\n' +
      '   — NO₂: N⁺⁵ + 1e → N⁺⁴, mỗi mol nhận 1 mol e.\n' +
      '   — NO: N⁺⁵ + 3e → N⁺², mỗi mol nhận 3 mol e.\n' +
      '   — N₂O: mỗi mol nhận 8 mol e.\n' +
      '   — N₂: mỗi mol nhận 10 mol e.\n' +
      '   — NH₄NO₃: mỗi mol nhận 8 mol e (sản phẩm khử KHÔNG phải khí, rất hay bị bỏ sót).\n\n' +
      '2. BẢO TOÀN NGUYÊN TỐ (nitrogen): n(HNO₃ phản ứng) = n(N trong muối) + n(N trong sản ' +
      'phẩm khử). Với muối nitrate của kim loại thì n(NO₃⁻ trong muối) = n(e trao đổi).\n\n' +
      '3. BẢO TOÀN KHỐI LƯỢNG, cho công thức tính nhanh khối lượng muối nitrate:\n' +
      '    m(muối) = m(kim loại) + 62·n(e trao đổi)     [khi KHÔNG tạo NH₄NO₃]\n' +
      '    m(muối) = m(kim loại) + 62·n(e trao đổi) + 80·n(NH₄NO₃)   [khi CÓ tạo NH₄NO₃]\n' +
      'Con số 62 chính là khối lượng mol của ion NO₃⁻, và nó đi kèm n(e) chứ không phải n(HNO₃) ' +
      '— vì mỗi đơn vị điện tích dương của kim loại cần đúng một ion NO₃⁻ để trung hoà.\n\n' +
      'ĐIỀU KIỆN VÀ GIỚI HẠN phải nhớ:\n' +
      '— Các công thức trên giả thiết kim loại TAN HẾT. Nếu kim loại còn dư thì phần dư không ' +
      'tham gia nhường electron, phải trừ ra.\n' +
      '— Al, Fe, Cr bị THỤ ĐỘNG HOÁ trong HNO₃ đặc nguội và H₂SO₄ đặc nguội — đề rất hay gài ' +
      'chi tiết "đặc, nguội" để loại thí sinh đọc lướt.\n' +
      '— Nếu sau phản ứng dung dịch còn HNO₃ dư thì Fe lên Fe³⁺; nếu HNO₃ hết và còn Fe dư thì ' +
      'Fe³⁺ bị Fe khử tiếp về Fe²⁺. Đây là chỗ phân loại của dạng bài.\n' +
      '— Dấu hiệu có NH₄NO₃: tính ra n(e) theo khí rồi thấy không khớp với dữ kiện khối lượng ' +
      'muối, hoặc đề nói "dung dịch chứa m gam muối" lớn hơn dự tính.',
    workedExample: {
      problem:
        'Hoà tan hoàn toàn 9,00 gam hỗn hợp gồm Mg và Al (số mol lần lượt 0,15 mol và 0,20 mol) ' +
        'trong dung dịch HNO₃ loãng dư, thu được khí NO là sản phẩm khử duy nhất. Tính số mol ' +
        'NO và khối lượng muối nitrate khan thu được.',
      steps: [
        'Kiểm dữ kiện khối lượng cho khớp: 24×0,15 + 27×0,20 = 3,60 + 5,40 = 9,00 gam — đúng đề.',
        'Đếm electron nhường: Mg → Mg²⁺ + 2e cho 2×0,15 = 0,30 mol; Al → Al³⁺ + 3e cho ' +
          '3×0,20 = 0,60 mol. Tổng n(e) = 0,90 mol.',
        'Sản phẩm khử duy nhất là NO, mỗi mol NO nhận 3 mol electron ⇒ ' +
          'n(NO) = 0,90/3 = 0,30 mol.',
        'Khối lượng muối: đề nói kim loại tan hoàn toàn và chỉ có NO (không có NH₄NO₃) nên ' +
          'm(muối) = m(kim loại) + 62·n(e) = 9,00 + 62×0,90 = 9,00 + 55,80 = 64,80 gam.',
        'Kiểm chéo bằng cách cộng công thức muối: Mg(NO₃)₂ 0,15 mol (148×0,15 = 22,20 g) và ' +
          'Al(NO₃)₃ 0,20 mol (213×0,20 = 42,60 g); tổng = 64,80 gam — khớp, nên lời giải đáng ' +
          'tin cậy.',
      ],
      answer: 'n(NO) = 0,30 mol; m(muối) = 64,80 gam.',
    },
    checkQuestions: [
      {
        prompt:
          'Hoà tan hết 9,00 gam hỗn hợp Mg (0,15 mol) và Al (0,20 mol) bằng HNO₃ loãng dư, sản ' +
          'phẩm khử duy nhất là NO. Tính số mol khí NO thu được (mol, chỉ nhập số).',
        answer: { kind: 'numeric', value: 0.3, tolerance: { mode: 'absolute', eps: 0.005 } },
        explain:
          'n(e nhường) = 2×0,15 + 3×0,20 = 0,90 mol. Mỗi mol NO nhận 3 mol e ⇒ n(NO) = 0,30 ' +
          'mol. Ra 0,90 là quên chia 3 (coi NO nhận 1e như NO₂) — kiểm lại số oxi hoá của N: từ ' +
          '+5 xuống +2 là 3 electron.',
        // Ghi chú: dung sai tuyệt đối 0,005 để học sinh ghi 0,3 hay 0,30 đều được chấp nhận.
      },
      {
        prompt:
          'Cùng dữ kiện trên (m kim loại = 9,00 gam; n(e) = 0,90 mol; không tạo NH₄NO₃). Tính ' +
          'khối lượng muối nitrate khan thu được (gam, chỉ nhập số).',
        answer: { kind: 'numeric', value: 64.8, tolerance: { mode: 'absolute', eps: 0.1 } },
        explain:
          'm(muối) = m(kim loại) + 62·n(e) = 9,00 + 62×0,90 = 64,80 gam. Nhớ rằng hệ số 62 đi ' +
          'kèm số mol ELECTRON (bằng số mol NO₃⁻ trung hoà điện tích kim loại), không phải số ' +
          'mol HNO₃ đã phản ứng — HNO₃ còn bị tiêu tốn để tạo sản phẩm khử.',
      },
      {
        // Câu BẪY: bỏ sót sản phẩm khử NH₄NO₃ vì "không thấy khí nào khác".
        prompt:
          'Hoà tan hết 0,26 mol Zn bằng HNO₃ loãng, thu được 0,02 mol khí N₂ là khí DUY NHẤT ' +
          'thoát ra; dung dịch sau phản ứng còn chứa một muối ammonium. Tính số mol NH₄NO₃ tạo ' +
          'thành (mol, chỉ nhập số).',
        answer: { kind: 'numeric', value: 0.04, tolerance: { mode: 'absolute', eps: 0.002 } },
        explain:
          'Bẫy nằm ở chữ "khí duy nhất" — nó KHÔNG có nghĩa là "sản phẩm khử duy nhất", vì ' +
          'NH₄NO₃ tan trong dung dịch chứ không bay ra. Cân electron đầy đủ: Zn nhường ' +
          '2×0,26 = 0,52 mol e. N₂ nhận 10×0,02 = 0,20 mol e. Phần electron còn thiếu ' +
          '0,52 − 0,20 = 0,32 mol phải do NH₄⁺ nhận, mà mỗi mol NH₄NO₃ nhận 8 mol e ⇒ ' +
          'n(NH₄NO₃) = 0,32/8 = 0,04 mol. Quy tắc thực chiến: hễ cân electron theo khí mà ' +
          '"thiếu" thì phải nghĩ ngay tới NH₄NO₃.',
      },
    ],
    srsCards: [
      {
        hoi: 'Số electron mà mỗi mol sản phẩm khử của HNO₃ nhận?',
        dap: 'NO₂: 1e · NO: 3e · N₂O: 8e · N₂: 10e · NH₄NO₃: 8e.',
      },
      {
        hoi: 'Công thức tính nhanh khối lượng muối nitrate?',
        dap: 'm(muối) = m(kim loại) + 62·n(e trao đổi) (+ 80·n(NH₄NO₃) nếu có).',
      },
      {
        hoi: 'Dấu hiệu bài toán có tạo NH₄NO₃?',
        dap: 'Cân electron theo khí thấy thiếu so với electron kim loại nhường, hoặc khối lượng muối lớn hơn dự tính.',
      },
      {
        hoi: 'Kim loại nào bị thụ động hoá trong HNO₃ đặc nguội?',
        dap: 'Al, Fe, Cr — chi tiết "đặc, nguội" trong đề luôn là điểm phân loại.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-tinh',
    reviewStatus: 'draft',
  },
  {
    id: 'hoa11-c95-b1',
    grade: '11',
    chapterNumber: 95,
    chapterTitle: 'Chuyên đề HSG — Cơ chế phản ứng hữu cơ',
    lessonNumber: 1,
    title: 'HSG cấp quốc gia: Cơ chế SN1, SN2, E1, E2 và hệ quả hoá lập thể',
    hook:
      'Cùng là dẫn xuất bromide, cùng gặp dung dịch kiềm: chất này cho một sản phẩm quay mặt ' +
      'phẳng ánh sáng theo đúng một chiều, chất kia cho hỗn hợp hai đồng phân đối quang bằng ' +
      'nhau. Sự khác biệt ấy tiết lộ phản ứng đã đi qua đường nào.',
    theory:
      'Phản ứng của dẫn xuất halogen với tác nhân nucleophile/base có thể đi theo bốn đường. ' +
      'Phân biệt chúng không phải để học thuộc tên, mà để DỰ ĐOÁN sản phẩm và hoá lập thể.\n\n' +
      'SN2 — thế lưỡng phân tử, MỘT giai đoạn:\n' +
      '— Nucleophile tấn công từ phía ĐỐI DIỆN nhóm đi ra, đi qua trạng thái chuyển tiếp có 5 ' +
      'nhóm quanh carbon. v = k·[R–X]·[Nu⁻] (bậc hai).\n' +
      '— Hệ quả lập thể: cấu hình bị NGHỊCH ĐẢO (nghịch đảo Walden) — như chiếc ô lộn ngược ' +
      'trong gió. Chất đầu quang hoạt cho sản phẩm quang hoạt với cấu hình ngược lại.\n' +
      '— Ưu thế khi: dẫn xuất bậc I, nucleophile mạnh và đặc (OH⁻, CN⁻, RO⁻), dung môi phân cực ' +
      'KHÔNG proton (aceton, DMSO). Dẫn xuất bậc III gần như không đi SN2 vì ba nhóm thế chắn ' +
      'mất đường vào.\n\n' +
      'SN1 — thế đơn phân tử, HAI giai đoạn:\n' +
      '— Giai đoạn chậm: R–X tự ion hoá tạo CARBOCATION. Giai đoạn nhanh: nucleophile tấn công. ' +
      'v = k·[R–X] (bậc một), KHÔNG phụ thuộc nồng độ nucleophile.\n' +
      '— Hệ quả lập thể: carbocation phẳng, nucleophile tấn công được cả HAI phía như nhau ⇒ ' +
      'sản phẩm là hỗn hợp RAXEMIC (hai đồng phân đối quang xấp xỉ bằng nhau), mất tính quang ' +
      'hoạt.\n' +
      '— Ưu thế khi: dẫn xuất bậc III (carbocation bậc III bền nhờ hiệu ứng cảm ứng đẩy electron ' +
      'của ba nhóm alkyl), nucleophile yếu (H₂O, ROH), dung môi phân cực CÓ proton.\n' +
      '— Dấu hiệu nhận ra trong đề: có sản phẩm chuyển vị (do carbocation kém bền chuyển thành ' +
      'carbocation bền hơn) — bằng chứng trực tiếp cho sự tồn tại của carbocation trung gian.\n\n' +
      'E2 và E1 — tách:\n' +
      '— E2 một giai đoạn, base mạnh cồng kềnh và đun nóng; cần H ở carbon β nằm ANTI (đối ' +
      'diện) với nhóm đi ra trên cùng một mặt phẳng. Yêu cầu hình học này giải thích vì sao có ' +
      'chất chỉ cho một alkene duy nhất dù về lí thuyết có hai hướng tách.\n' +
      '— E1 đi qua cùng carbocation như SN1, nên SN1 và E1 luôn xảy ra song song và cho hỗn hợp ' +
      'sản phẩm.\n' +
      '— Định hướng: theo Zaitsev (tạo alkene nhiều nhóm thế, bền hơn); riêng với base rất cồng ' +
      'kềnh như tert-butoxide thì lại theo Hofmann (tạo alkene ít nhóm thế) vì base không chen ' +
      'nổi vào vị trí bị chắn.\n\n' +
      'ĐIỀU KIỆN CẠNH TRANH thế–tách, ghi nhớ theo cặp: nucleophile mạnh + base yếu + nhiệt độ ' +
      'thấp ⇒ ưu thế THẾ; base mạnh + nhiệt độ cao + dung môi ethanol ⇒ ưu thế TÁCH. Đó chính ' +
      'là lí do chương trình phổ thông quy ước "NaOH/H₂O, t° thường → alcohol" còn ' +
      '"KOH/ethanol, t° cao → alkene".',
    workedExample: {
      problem:
        'Cho hai thí nghiệm: (a) (R)-2-bromobutane tác dụng với NaOH đặc trong aceton; ' +
        '(b) 2-bromo-2-methylpropane [(CH₃)₃C–Br] tác dụng với nước. Hãy xác định cơ chế của ' +
        'mỗi phản ứng và dự đoán hoá lập thể của sản phẩm thế.',
      steps: [
        'Thí nghiệm (a): dẫn xuất bậc II, nucleophile OH⁻ mạnh và đặc, dung môi phân cực không ' +
          'proton ⇒ điều kiện điển hình của SN2.',
        'Với SN2, OH⁻ tấn công từ phía sau, ngược hướng Br đi ra ⇒ cấu hình ở carbon bất đối bị ' +
          'nghịch đảo. Sản phẩm là (S)-butan-2-ol, vẫn quang hoạt.',
        'Thí nghiệm (b): dẫn xuất bậc III, nucleophile là nước (yếu), dung môi có proton ⇒ điều ' +
          'kiện điển hình của SN1.',
        'Bước chậm tạo carbocation (CH₃)₃C⁺ có cấu trúc phẳng. Nước tấn công đều hai phía của ' +
          'mặt phẳng đó.',
        'Nếu carbon trung tâm là carbon bất đối thì sản phẩm sẽ là hỗn hợp raxemic; ở chất cụ ' +
          'thể này sản phẩm là 2-methylpropan-2-ol, không có carbon bất đối nên không xét quang ' +
          'hoạt. Thêm dấu hiệu nhận biết SN1: tốc độ phản ứng không đổi khi tăng nồng độ nước.',
      ],
      answer:
        '(a) SN2 — nghịch đảo cấu hình, cho (S)-butan-2-ol. (b) SN1 — qua carbocation phẳng, ' +
        'sản phẩm thế mất tính quang hoạt (raxemic khi carbon là bất đối).',
    },
    checkQuestions: [
      {
        prompt:
          'Một dẫn xuất halogen quang hoạt phản ứng với nucleophile và thu được sản phẩm thế là ' +
          'hỗn hợp raxemic (mất tính quang hoạt). Kết luận nào đúng về cơ chế?',
        choices: [
          { id: 'sn2', label: 'SN2, vì nucleophile tấn công từ phía đối diện' },
          { id: 'sn1', label: 'SN1, vì đi qua carbocation trung gian có cấu trúc phẳng' },
          { id: 'e2', label: 'E2, vì cần H ở vị trí anti' },
        ],
        answer: { kind: 'choice', correctIds: ['sn1'] },
        explain:
          'Raxemic hoá là "vân tay" của carbocation phẳng: nucleophile tấn công hai phía với xác ' +
          'suất gần bằng nhau nên hai đồng phân đối quang sinh ra xấp xỉ bằng nhau, triệt tiêu ' +
          'độ quay cực. Nếu là SN2 thì sản phẩm phải quang hoạt với cấu hình NGHỊCH ĐẢO, chứ ' +
          'không phải hỗn hợp raxemic — đây đúng là chỗ hai cơ chế phân biệt nhau rõ nhất.',
      },
      {
        // Câu BẪY: nghĩ "tăng nồng độ tác nhân thì phản ứng nào cũng nhanh lên".
        prompt:
          'Với phản ứng thuỷ phân (CH₃)₃C–Br trong nước (cơ chế SN1), tăng gấp đôi nồng độ ' +
          'nucleophile mà giữ nguyên mọi điều kiện khác thì tốc độ phản ứng thay đổi thế nào?',
        choices: [
          { id: 'gap2', label: 'Tăng gấp đôi' },
          { id: 'gap4', label: 'Tăng gấp bốn' },
          { id: 'khong', label: 'Gần như không đổi' },
        ],
        answer: { kind: 'choice', correctIds: ['khong'] },
        explain:
          'Bẫy là áp phản xạ "nồng độ tăng thì tốc độ tăng" cho mọi chất tham gia. Tốc độ chung ' +
          'do GIAI ĐOẠN CHẬM quyết định, mà giai đoạn chậm của SN1 là sự ion hoá R–X — trong đó ' +
          'không có mặt nucleophile. Vì vậy v = k·[R–X], bậc một, không phụ thuộc nồng độ ' +
          'nucleophile. Chính phép đo động học này là bằng chứng thực nghiệm phân biệt SN1 với ' +
          'SN2 (SN2 có v = k·[R–X]·[Nu⁻], tăng gấp đôi Nu⁻ thì tốc độ gấp đôi).',
      },
      {
        prompt:
          'Muốn chuyển 2-bromobutane thành alkene (ưu tiên phản ứng TÁCH thay vì THẾ), nên chọn ' +
          'điều kiện nào?',
        choices: [
          { id: 'naoh_h2o', label: 'NaOH trong nước, nhiệt độ thường' },
          { id: 'koh_etoh', label: 'KOH trong ethanol, đun nóng' },
          { id: 'h2o', label: 'Chỉ dùng nước, đun nhẹ' },
        ],
        answer: { kind: 'choice', correctIds: ['koh_etoh'] },
        explain:
          'Cùng một chất đầu, chỉ đổi DUNG MÔI và nhiệt độ là đổi hẳn sản phẩm — đây là điểm ' +
          'tinh tế mà đề hay khai thác. Trong nước, OH⁻ được solvat hoá mạnh, thể hiện vai trò ' +
          'nucleophile ⇒ cho phản ứng thế tạo alcohol. Trong ethanol và đun nóng, tính base nổi ' +
          'trội hơn, ion alkoxide lấy H ở carbon β ⇒ phản ứng tách E2 tạo alkene, sản phẩm chính ' +
          'theo Zaitsev là but-2-ene.',
      },
    ],
    srsCards: [
      {
        hoi: 'Hệ quả hoá lập thể của SN2 và SN1?',
        dap: 'SN2 nghịch đảo cấu hình (Walden); SN1 qua carbocation phẳng nên cho hỗn hợp raxemic.',
      },
      {
        hoi: 'Biểu thức tốc độ của SN1 và SN2?',
        dap: 'SN1: v = k[R–X] (bậc một). SN2: v = k[R–X][Nu⁻] (bậc hai).',
      },
      {
        hoi: 'Bậc của dẫn xuất halogen ảnh hưởng thế nào tới cơ chế thế?',
        dap: 'Bậc I ưu tiên SN2; bậc III ưu tiên SN1 (carbocation bền, đồng thời bị chắn không gian).',
      },
      {
        hoi: 'Khi nào phản ứng tách theo Hofmann thay vì Zaitsev?',
        dap: 'Khi dùng base rất cồng kềnh (như tert-butoxide) — cho alkene ít nhóm thế hơn.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-quoc-gia',
    reviewStatus: 'draft',
  },
]
