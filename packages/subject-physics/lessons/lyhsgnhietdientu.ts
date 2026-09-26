// lyhsgnhietdientu.ts — Chuyên đề bồi dưỡng HỌC SINH GIỎI môn Vật lí, mảng NHIỆT ĐỘNG LỰC HỌC
// và ĐIỆN TỪ nâng cao (lớp 12). Chương 93, tách khỏi chương trình chuẩn c1..c4.
//   b1 (hsg-truong)   — đọc chu trình trên giản đồ p–V, công bằng diện tích.
//   b2 (hsg-tinh)     — định luật I cho từng quá trình và hiệu suất chu trình.
//   b3 (hsg-quoc-gia) — thanh dẫn trượt trên ray: động lực học có lực cản phụ thuộc vận tốc.
import type { PhysicsLesson } from '../lessonTypes.js'

export const LY_HSG_NHIET_DIEN_TU_LESSONS: PhysicsLesson[] = [
  {
    id: 'ly12-c93-b1',
    grade: '12',
    chapterNumber: 93,
    chapterTitle: 'Chuyên đề HSG: Nhiệt động lực học và điện từ',
    lessonNumber: 1,
    title: 'Đọc chu trình trên giản đồ p–V: công là diện tích',
    hook:
      'Một động cơ nhiệt chỉ là một khối khí được kéo đi vòng quanh trên giản đồ p–V, lặp đi lặp lại hàng nghìn lần mỗi phút. ' +
      'Điều kì lạ: dù đi vòng thế nào thì sau mỗi vòng khối khí cũng trở về đúng trạng thái ban đầu, vậy công mà nó sinh ra ' +
      'lấy từ đâu ra? Câu trả lời nằm gọn trong một hình vẽ.',
    theory:
      'CÔNG CỦA KHÍ VÀ DIỆN TÍCH TRÊN GIẢN ĐỒ p–V:\n' +
      '— Khi khí giãn nở một lượng rất nhỏ ΔV dưới áp suất p, nó sinh công ΔA′ = p·ΔV. Cộng dồn tất cả các mẩu đó chính là ' +
      'DIỆN TÍCH nằm dưới đường biểu diễn quá trình trên giản đồ p–V. Đây là lý do vật lí của việc "tính công bằng diện tích": ' +
      'không phải mẹo hình học, mà là phép cộng dồn p·ΔV.\n' +
      '— Dấu: khí GIÃN (V tăng) thì khí SINH công, A′ > 0. Khí bị NÉN (V giảm) thì khí NHẬN công, A′ < 0.\n\n' +
      'BỐN QUÁ TRÌNH CƠ BẢN — nhớ theo hình dạng đường:\n' +
      '— Đẳng tích (đường thẳng đứng): ΔV = 0 nên A′ = 0. Mọi nhiệt lượng đều đi vào nội năng.\n' +
      '— Đẳng áp (đường nằm ngang): A′ = p·ΔV, diện tích là một hình chữ nhật.\n' +
      '— Đẳng nhiệt (đường hypebol): ΔU = 0 nên Q = A′; ở phổ thông ta không tính diện tích này bằng công thức sơ cấp mà ' +
      'suy ra từ định luật I.\n' +
      '— Đoạn nhiệt: Q = 0 nên A′ = −ΔU; khí giãn đoạn nhiệt thì lạnh đi.\n\n' +
      'CHU TRÌNH — ba tính chất phải thuộc:\n' +
      '1. Sau một chu trình, khí trở về đúng trạng thái đầu nên ΔU = 0. Suy ra ngay: tổng công khí sinh ra bằng tổng nhiệt ' +
      'lượng trao đổi, A′ = Q_thu − |Q_toả|. Công không "từ đâu ra" cả — nó là phần nhiệt lượng không bị trả lại nguồn lạnh.\n' +
      '2. Công của cả chu trình bằng DIỆN TÍCH HÌNH KÍN trên giản đồ p–V. Đi theo chiều KIM ĐỒNG HỒ thì A′ > 0 (động cơ nhiệt, ' +
      'khí sinh công); đi NGƯỢC chiều kim đồng hồ thì A′ < 0 (máy lạnh, phải tốn công bên ngoài).\n' +
      '3. Diện tích ấy chỉ phụ thuộc HÌNH DẠNG đường đi, nên hai quá trình có cùng điểm đầu và cùng điểm cuối vẫn cho công khác nhau — ' +
      'công là hàm của QUÁ TRÌNH, khác hẳn nội năng vốn là hàm của TRẠNG THÁI.\n\n' +
      'GIỚI HẠN: mọi công thức ở đây dành cho khí lí tưởng và quá trình đủ chậm để mỗi thời điểm khí có một áp suất xác định ' +
      '(quá trình cân bằng). Quá trình nổ hoặc giãn tự do vào chân không không vẽ được thành đường liền trên giản đồ p–V.',
    workedExample: {
      problem:
        'Một khối khí lí tưởng thực hiện chu trình gồm bốn quá trình, nối lần lượt các trạng thái: ' +
        '1 (p₁ = 1·10⁵ Pa, V₁ = 2 L) → 2 (p₂ = 3·10⁵ Pa, V₁ = 2 L) → 3 (p₂ = 3·10⁵ Pa, V₂ = 5 L) → ' +
        '4 (p₁ = 1·10⁵ Pa, V₂ = 5 L) → về 1. Tính công mà khí sinh ra trong một chu trình.',
      steps: [
        'Nhận dạng chu trình: 1→2 đẳng tích (V không đổi), 2→3 đẳng áp giãn nở, 3→4 đẳng tích, 4→1 đẳng áp nén. Trên giản đồ p–V, bốn quá trình này khép thành một hình chữ nhật.',
        'Đổi đơn vị thể tích về SI trước khi tính — bỏ qua bước này là lỗi mất điểm phổ biến nhất của cả dạng bài: V₁ = 2 L = 2·10⁻³ m³, V₂ = 5 L = 5·10⁻³ m³.',
        'Quá trình 1→2 và 3→4 đẳng tích: ΔV = 0 nên khí không sinh công, A′ = 0.',
        'Quá trình 2→3 (đẳng áp, giãn nở): khí sinh công A′₂₃ = p₂·(V₂ − V₁) = 3·10⁵ × 3·10⁻³ = 900 (J), mang dấu dương.',
        'Quá trình 4→1 (đẳng áp, bị nén): A′₄₁ = p₁·(V₁ − V₂) = 1·10⁵ × (−3·10⁻³) = −300 (J), tức khí nhận công 300 J.',
        'Tổng công khí sinh ra trong một chu trình: A′ = 900 + (−300) = 600 (J).',
        'Kiểm tra bằng diện tích: hình chữ nhật có hai cạnh là Δp = (3 − 1)·10⁵ = 2·10⁵ Pa và ΔV = 3·10⁻³ m³, diện tích = 2·10⁵ × 3·10⁻³ = 600 J — khớp. Chu trình đi theo chiều kim đồng hồ nên công dương, đúng vai trò của một động cơ nhiệt.',
      ],
      answer: 'A′ = 600 J (khí sinh công, chu trình theo chiều kim đồng hồ).',
    },
    checkQuestions: [
      {
        prompt:
          'Khí lí tưởng giãn nở đẳng áp ở p = 2·10⁵ Pa, thể tích tăng từ 1 L lên 4 L. Tính công khí sinh ra (theo J).',
        answer: {
          kind: 'numeric',
          value: 600,
          unit: 'J',
        },
        explain:
          'Đổi đơn vị trước: ΔV = 3 L = 3·10⁻³ m³. A′ = p·ΔV = 2·10⁵ × 3·10⁻³ = 600 J. Nếu quên đổi lít sang m³, kết quả sẽ sai đúng 1000 lần — hãy tập thói quen đổi mọi đại lượng về SI ngay ở dòng đầu bài giải.',
      },
      {
        prompt:
          'Một chu trình có dạng hình chữ nhật trên giản đồ p–V với hai cạnh Δp = 1,5·10⁵ Pa và ΔV = 4·10⁻³ m³, đi theo chiều kim đồng hồ. Tính công khí sinh ra trong một chu trình (theo J).',
        answer: {
          kind: 'numeric',
          value: 600,
          unit: 'J',
        },
        explain:
          'Công của cả chu trình bằng diện tích hình kín: A′ = Δp·ΔV = 1,5·10⁵ × 4·10⁻³ = 600 J, mang dấu dương vì chu trình đi theo chiều kim đồng hồ (động cơ nhiệt).',
      },
      {
        // Câu bẫy: coi công là hàm trạng thái, hoặc quên rằng ΔU = 0 sau một chu trình.
        prompt:
          'Sau khi thực hiện trọn một chu trình, khối khí trở về đúng trạng thái ban đầu. Kết luận nào đúng?',
        choices: [
          {
            id: 'khong_sinh_cong',
            label: 'Khí không sinh công, vì mọi đại lượng đều trở về giá trị ban đầu',
          },
          {
            id: 'du_bang_khong',
            label:
              'Độ biến thiên nội năng ΔU = 0, nhưng khí vẫn sinh công A′ = Q_thu − |Q_toả| bằng diện tích hình kín',
          },
          {
            id: 'q_bang_khong',
            label: 'Tổng nhiệt lượng trao đổi bằng 0 vì nhiệt độ cuối bằng nhiệt độ đầu',
          },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['du_bang_khong'],
        },
        explain:
          'Cần tách bạch hai loại đại lượng. Nội năng U là HÀM TRẠNG THÁI: về đúng trạng thái cũ thì U về giá trị cũ, nên ΔU = 0 — điều này đúng. ' +
          'Nhưng công A′ và nhiệt Q là HÀM QUÁ TRÌNH: chúng phụ thuộc đường đi chứ không phụ thuộc điểm đầu và điểm cuối, nên chúng không hề "trở về 0". ' +
          'Áp định luật I cho cả chu trình: 0 = ΔU = Q − A′ → A′ = Q = Q_thu − |Q_toả|. Khí nhận nhiều nhiệt ở nhánh áp suất cao và trả bớt nhiệt ở nhánh áp suất thấp, phần chênh lệch biến thành công — đó chính là nguyên lý của mọi động cơ nhiệt. ' +
          'Nếu kết luận "không sinh công" là đúng thì đã không có ô tô nào chạy được.',
      },
    ],
    srsCards: [
      {
        hoi: 'Công của khí trong một quá trình đọc thế nào trên giản đồ p–V?',
        dap: 'Bằng diện tích nằm dưới đường biểu diễn quá trình (cộng dồn p·ΔV). Khí giãn thì A′ > 0, khí bị nén thì A′ < 0.',
      },
      {
        hoi: 'Chu trình đi theo chiều kim đồng hồ và ngược chiều kim đồng hồ khác nhau thế nào?',
        dap: 'Theo chiều kim đồng hồ: A′ > 0, khí sinh công — động cơ nhiệt. Ngược chiều: A′ < 0, phải tốn công bên ngoài — máy lạnh.',
      },
      {
        hoi: 'Vì sao sau một chu trình ΔU = 0 mà khí vẫn sinh công?',
        dap: 'Vì U là hàm trạng thái còn A′ và Q là hàm quá trình. Định luật I cho chu trình: A′ = Q_thu − |Q_toả|.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-truong',
    reviewStatus: 'draft',
  },
  {
    id: 'ly12-c93-b2',
    grade: '12',
    chapterNumber: 93,
    chapterTitle: 'Chuyên đề HSG: Nhiệt động lực học và điện từ',
    lessonNumber: 2,
    title: 'Định luật I cho từng quá trình và hiệu suất chu trình',
    hook:
      'Động cơ xăng của xe máy chỉ biến được khoảng một phần tư năng lượng của nhiên liệu thành chuyển động; ba phần tư ' +
      'còn lại thoát ra theo khí xả và nước làm mát. Con số "một phần tư" ấy không phải do thợ máy làm ẩu — nó tính ra được ' +
      'từ giản đồ p–V, và có một trần lý thuyết mà không động cơ nào vượt qua nổi.',
    theory:
      'ĐỊNH LUẬT I NHIỆT ĐỘNG LỰC HỌC — thống nhất quy ước dấu trước khi tính:\n' +
      '— Dạng dùng trong sách giáo khoa hiện hành: ΔU = Q + A, với Q là nhiệt lượng khí NHẬN, A là công khí NHẬN. ' +
      'Khi khí sinh công A′ thì A = −A′. Cách viết tương đương rất hay dùng khi giải chu trình: Q = ΔU + A′.\n' +
      '— Sai lầm nhiều nhất KHÔNG nằm ở công thức mà ở quy ước dấu. Hãy chọn MỘT quy ước và ghi rõ ở đầu bài giải, ' +
      'rồi lập bảng bốn cột (quá trình | ΔU | A′ | Q) cho từng nhánh — làm vậy thì không bao giờ lẫn.\n\n' +
      'NỘI NĂNG CỦA KHÍ LÍ TƯỞNG ĐƠN NGUYÊN TỬ:\n' +
      '— U = (3/2)·n·R·T = (3/2)·p·V. Dạng thứ hai cực tiện khi làm chu trình vì tránh phải tính nhiệt độ: ' +
      'ΔU = (3/2)·Δ(p·V), chỉ cần nhân hai con số ở mỗi đỉnh của chu trình.\n' +
      '— VÌ SAO nội năng chỉ phụ thuộc nhiệt độ: khí lí tưởng bỏ qua tương tác giữa các phân tử nên không có thế năng ' +
      'tương tác, toàn bộ nội năng là động năng chuyển động nhiệt, mà động năng đó tỉ lệ với T.\n' +
      '— GIỚI HẠN: hệ số 3/2 chỉ đúng cho khí ĐƠN NGUYÊN TỬ (He, Ar). Khí hai nguyên tử (O₂, N₂) ở nhiệt độ thường có ' +
      'thêm bậc tự do quay nên U = (5/2)·n·R·T. Đề thi luôn nói rõ loại khí; đọc sót là sai toàn bài.\n\n' +
      'HIỆU SUẤT CHU TRÌNH:\n' +
      '— H = A′/Q_thu, trong đó A′ là công khí sinh ra trong cả chu trình (diện tích hình kín) và Q_thu là TỔNG nhiệt lượng ' +
      'khí NHẬN VÀO, chỉ cộng các nhánh có Q > 0.\n' +
      '— Bẫy thường gặp: lấy Q_thu là tổng đại số của mọi Q. Sai, vì mẫu số phải là năng lượng ta phải TRẢ TIỀN để mua ' +
      '(nhiên liệu đốt), còn phần nhiệt trả ra nguồn lạnh là thứ mất đi chứ không phải thứ ta bỏ ra.\n' +
      '— Trần lý thuyết (chu trình Carnot): H_max = 1 − T_lạnh/T_nóng. Mọi chu trình thực tế đều thấp hơn trần này; ' +
      'nếu tính ra hiệu suất cao hơn thì chắc chắn bài giải đã sai ở đâu đó.',
    workedExample: {
      problem:
        'Một mol khí lí tưởng ĐƠN NGUYÊN TỬ thực hiện chu trình hình chữ nhật qua bốn trạng thái: ' +
        '1 (1·10⁵ Pa; 2·10⁻³ m³) → 2 (3·10⁵ Pa; 2·10⁻³ m³) → 3 (3·10⁵ Pa; 5·10⁻³ m³) → 4 (1·10⁵ Pa; 5·10⁻³ m³) → 1. ' +
        'Tính nhiệt lượng khí nhận vào trong cả chu trình và hiệu suất của chu trình.',
      steps: [
        'Lập bảng tích p·V tại bốn trạng thái (đơn vị J): trạng thái 1: 200; trạng thái 2: 600; trạng thái 3: 1500; trạng thái 4: 500. Dùng U = (3/2)·p·V nên chỉ cần các tích này.',
        'Quá trình 1→2 (đẳng tích, áp suất tăng): A′ = 0; ΔU = 1,5 × (600 − 200) = 600 J; theo Q = ΔU + A′ thì Q₁₂ = +600 J — khí NHẬN nhiệt.',
        'Quá trình 2→3 (đẳng áp, giãn nở): A′ = p·ΔV = 3·10⁵ × 3·10⁻³ = 900 J; ΔU = 1,5 × (1500 − 600) = 1350 J; Q₂₃ = 1350 + 900 = +2250 J — khí NHẬN nhiệt.',
        'Quá trình 3→4 (đẳng tích, áp suất giảm): A′ = 0; ΔU = 1,5 × (500 − 1500) = −1500 J; Q₃₄ = −1500 J — khí TOẢ nhiệt.',
        'Quá trình 4→1 (đẳng áp, bị nén): A′ = 1·10⁵ × (−3·10⁻³) = −300 J; ΔU = 1,5 × (200 − 500) = −450 J; Q₄₁ = −450 − 300 = −750 J — khí TOẢ nhiệt.',
        'Tổng nhiệt lượng khí NHẬN VÀO (chỉ cộng các nhánh Q dương): Q_thu = 600 + 2250 = 2850 (J).',
        'Công của cả chu trình: A′ = 900 − 300 = 600 J. Kiểm tra chéo bằng định luật I cho chu trình: Q_thu − |Q_toả| = 2850 − (1500 + 750) = 2850 − 2250 = 600 J — khớp, nên bảng tính không sai dấu chỗ nào.',
        'Hiệu suất: H = A′/Q_thu = 600/2850 ≈ 0,2105, tức khoảng 21,1%.',
      ],
      answer: 'Q_thu = 2850 J; A′ = 600 J; H ≈ 0,21 (21,1%).',
    },
    checkQuestions: [
      {
        prompt:
          'Khí lí tưởng đơn nguyên tử bị đun nóng đẳng tích, tích p·V tăng từ 400 J lên 1000 J. Tính nhiệt lượng khí nhận vào (theo J).',
        answer: {
          kind: 'numeric',
          value: 900,
          unit: 'J',
        },
        explain:
          'Đẳng tích nên A′ = 0, toàn bộ nhiệt lượng đi vào nội năng: Q = ΔU = 1,5 × Δ(p·V) = 1,5 × 600 = 900 J. Nếu khí là hai nguyên tử thì hệ số là 2,5 và đáp số thành 1500 J — luôn đọc kỹ đề cho loại khí nào.',
      },
      {
        prompt:
          'Một chu trình có công khí sinh ra A′ = 600 J, nhiệt lượng nhận vào Q_thu = 2850 J. Tính hiệu suất của chu trình (dạng số thập phân, không đơn vị).',
        answer: {
          kind: 'numeric',
          value: 0.2105,
          tolerance: { mode: 'relative', pct: 2 },
        },
        explain:
          'H = A′/Q_thu = 600/2850 ≈ 0,2105 (21,1%). Mẫu số phải là nhiệt lượng NHẬN VÀO, tức tổng các nhánh có Q > 0, chứ không phải tổng đại số của mọi Q — tổng đại số chính bằng A′ = 600 J, lấy nó làm mẫu sẽ ra hiệu suất 100%, một kết quả vô lý.',
      },
      {
        // Câu bẫy: hiểu sai mẫu số của hiệu suất, hoặc quên phân biệt khí đơn/hai nguyên tử.
        prompt: 'Khi tính hiệu suất một chu trình, mẫu số Q_thu phải lấy là đại lượng nào?',
        choices: [
          {
            id: 'tong_dai_so',
            label: 'Tổng đại số của nhiệt lượng ở tất cả các quá trình (cả dương lẫn âm)',
          },
          {
            id: 'chi_duong',
            label: 'Chỉ tổng các nhiệt lượng khí NHẬN VÀO, tức các quá trình có Q > 0',
          },
          { id: 'q_toa', label: 'Nhiệt lượng khí toả ra nguồn lạnh' },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['chi_duong'],
        },
        explain:
          'Hiệu suất luôn có dạng "cái được / cái phải bỏ ra". Cái ta phải bỏ ra là nhiệt lượng cấp cho khí từ nguồn nóng — tức chỉ các nhánh có Q > 0; phần nhiệt khí trả cho nguồn lạnh là thứ MẤT ĐI, không phải thứ ta bỏ ra. ' +
          'Nếu lấy tổng đại số làm mẫu số thì mẫu số đó đúng bằng A′ (vì ΔU của cả chu trình bằng 0), và hiệu suất sẽ luôn ra 100% — một kết quả trái với nguyên lý II nhiệt động lực học, vốn khẳng định không thể biến toàn bộ nhiệt thành công trong một chu trình. ' +
          'Hai mẹo tự kiểm: (1) H phải nhỏ hơn trần Carnot 1 − T_lạnh/T_nóng; (2) Q_thu − |Q_toả| phải đúng bằng A′ đọc từ diện tích hình kín — không khớp là bảng tính đã sai dấu.',
      },
    ],
    srsCards: [
      {
        hoi: 'Nội năng khí lí tưởng đơn nguyên tử tính theo p và V?',
        dap: 'U = (3/2)·p·V, nên ΔU = (3/2)·Δ(p·V). Khí hai nguyên tử dùng hệ số 5/2.',
      },
      {
        hoi: 'Công thức hiệu suất chu trình và mẫu số phải lấy là gì?',
        dap: 'H = A′/Q_thu, với Q_thu chỉ gồm các quá trình khí NHẬN nhiệt (Q > 0), không phải tổng đại số mọi Q.',
      },
      {
        hoi: 'Cách kiểm tra nhanh bảng tính định luật I của một chu trình?',
        dap: 'Q_thu − |Q_toả| phải đúng bằng công A′ đọc từ diện tích hình kín, và H phải nhỏ hơn trần Carnot 1 − T_lạnh/T_nóng.',
      },
    ],
    track: 'advanced',
    advancedTier: 'hsg-tinh',
    reviewStatus: 'draft',
  },
  {
    id: 'ly12-c93-b3',
    grade: '12',
    chapterNumber: 93,
    chapterTitle: 'Chuyên đề HSG: Nhiệt động lực học và điện từ',
    lessonNumber: 3,
    title: 'Thanh dẫn trượt trên ray: lực cản phụ thuộc vận tốc và vận tốc giới hạn',
    hook:
      'Tàu cao tốc và một số xe tải hạng nặng phanh bằng NAM CHÂM chứ không bằng má phanh: chỉ cần cho một đĩa kim loại ' +
      'quay giữa hai cực nam châm, tàu tự chậm lại mà không có gì mài mòn. Muốn hiểu cái phanh không tiếp xúc ấy, hãy giải ' +
      'bài toán kinh điển nhất của điện từ nâng cao: một thanh kim loại trượt trên hai thanh ray trong từ trường.',
    theory:
      'MÔ HÌNH: thanh dẫn dài l, khối lượng m, trượt không ma sát trên hai ray song song nằm ngang, cách nhau l, ' +
      'nối với nhau qua điện trở R. Toàn hệ đặt trong từ trường đều B vuông góc với mặt phẳng ray. Một lực kéo F không đổi ' +
      'tác dụng lên thanh theo phương trượt.\n\n' +
      'CHUỖI NHÂN QUẢ — phải nắm đúng thứ tự, đây là xương sống của bài:\n' +
      '1. Thanh chuyển động với vận tốc v → diện tích mạch biến thiên → suất điện động cảm ứng e = B·l·v (định luật Faraday).\n' +
      '2. Mạch kín nên có dòng điện cảm ứng i = e/R = B·l·v/R.\n' +
      '3. Dòng điện i nằm trong từ trường B nên chịu lực từ F_c = B·i·l = B²·l²·v/R.\n' +
      '4. Theo định luật Lenz, dòng cảm ứng luôn chống lại NGUYÊN NHÂN sinh ra nó — nguyên nhân ở đây là chuyển động, ' +
      'nên lực từ luôn NGƯỢC chiều vận tốc, đóng vai trò một lực cản.\n' +
      '— Điểm mấu chốt khiến bài này khác mọi bài động lực học lớp 10: lực cản TỈ LỆ THUẬN VỚI VẬN TỐC, ' +
      'nên gia tốc không phải hằng số và không được dùng các công thức chuyển động biến đổi đều.\n\n' +
      'PHƯƠNG TRÌNH CHUYỂN ĐỘNG VÀ VẬN TỐC GIỚI HẠN:\n' +
      '— Định luật 2 Newton: m·dv/dt = F − B²·l²·v/R.\n' +
      '— Lúc đầu v = 0 nên chưa có lực cản, gia tốc lớn nhất a₀ = F/m. Thanh càng nhanh thì lực cản càng lớn, gia tốc càng ' +
      'giảm dần. Đến khi lực cản cân bằng đúng lực kéo thì gia tốc bằng 0 và vận tốc ngừng tăng:\n' +
      '  v_gh = F·R / (B²·l²).\n' +
      '— Nghiệm đầy đủ có dạng v(t) = v_gh·(1 − e^(−t/τ)) với hằng số thời gian τ = m·R/(B²·l²). ' +
      'Ý nghĩa của τ: sau thời gian τ thanh đạt khoảng 63% vận tốc giới hạn, sau 3τ đạt khoảng 95%. ' +
      'Về lý thuyết thanh không bao giờ đạt đúng v_gh, chỉ tiến sát mãi mãi.\n\n' +
      'CÂN BẰNG NĂNG LƯỢNG (câu hỏi phụ hay gặp): ở trạng thái ổn định, toàn bộ công suất của lực kéo biến thành nhiệt ' +
      'trên điện trở: F·v_gh = i²·R. Không có phần nào thành động năng nữa vì vận tốc đã không đổi.\n\n' +
      'CÁC BIẾN THỂ THƯỜNG GẶP: (a) thay lực kéo F bằng thành phần trọng lực m·g·sin α khi ray đặt nghiêng — ' +
      'công thức giữ nguyên với F = m·g·sin α; (b) không có lực kéo, thanh có vận tốc đầu v₀ rồi tắt dần theo ' +
      'v = v₀·e^(−t/τ); (c) thay điện trở bằng tụ điện — khi đó lực cản tỉ lệ với GIA TỐC chứ không với vận tốc, ' +
      'và thanh chuyển động nhanh dần ĐỀU với a = F/(m + C·B²·l²). Nhận ra biến thể (c) là dấu hiệu của bài thi quốc gia.',
    workedExample: {
      problem:
        'Thanh dẫn dài l = 1 m, khối lượng m = 0,2 kg trượt không ma sát trên hai ray nằm ngang nối với điện trở ' +
        'R = 0,5 Ω, trong từ trường đều B = 1 T vuông góc mặt phẳng ray. Thanh được kéo bằng lực không đổi F = 2 N ' +
        'từ trạng thái nghỉ. Bỏ qua điện trở của thanh và ray. Tính gia tốc ban đầu, vận tốc giới hạn và hằng số thời gian.',
      steps: [
        'Lúc t = 0 thanh đứng yên nên v = 0, suất điện động cảm ứng e = B·l·v = 0, dòng điện bằng 0 và chưa có lực từ cản. Gia tốc ban đầu chỉ do lực kéo: a₀ = F/m = 2/0,2 = 10 (m/s²).',
        'Khi thanh đã có vận tốc v: e = B·l·v → i = B·l·v/R → lực cản F_c = B·i·l = B²·l²·v/R. Thay số: F_c = (1² × 1² / 0,5)·v = 2v (N, với v tính theo m/s).',
        'Viết định luật 2 Newton: m·dv/dt = F − B²·l²·v/R = 2 − 2v. Đây là phương trình có lực cản phụ thuộc vận tốc, KHÔNG được dùng công thức chuyển động biến đổi đều.',
        'Vận tốc giới hạn đạt được khi vế phải bằng 0, tức khi gia tốc bằng 0: F = B²·l²·v_gh/R → v_gh = F·R/(B²·l²) = (2 × 0,5)/(1 × 1) = 1 (m/s).',
        'Hằng số thời gian: τ = m·R/(B²·l²) = (0,2 × 0,5)/1 = 0,1 (s). Sau khoảng 0,1 s thanh đạt ≈ 63% của 1 m/s, sau 0,3 s đạt ≈ 95%.',
        'Kiểm tra bằng năng lượng ở trạng thái ổn định: dòng điện i = B·l·v_gh/R = (1 × 1 × 1)/0,5 = 2 A; công suất toả nhiệt i²·R = 4 × 0,5 = 2 W; công suất của lực kéo F·v_gh = 2 × 1 = 2 W — hai con số bằng nhau, đúng như phải thế vì động năng đã ngừng tăng.',
      ],
      answer: 'a₀ = 10 m/s²; v_gh = 1 m/s; τ = 0,1 s.',
    },
    checkQuestions: [
      {
        prompt:
          'Thanh dẫn l = 1 m trượt trên ray nối điện trở R = 0,5 Ω trong từ trường B = 1 T, kéo bằng lực không đổi F = 2 N. Tính vận tốc giới hạn của thanh (theo m/s).',
        answer: {
          kind: 'numeric',
          value: 1,
          unit: 'm/s',
        },
        explain:
          'Ở vận tốc giới hạn, lực từ cản cân bằng lực kéo: F = B²·l²·v/R → v_gh = F·R/(B²·l²) = (2 × 0,5)/1 = 1 m/s. Tăng B lên gấp đôi thì v_gh giảm 4 lần vì B nằm ở bình phương — đó là lý do phanh điện từ dùng nam châm rất mạnh.',
      },
      {
        prompt:
          'Vẫn hệ trên, thanh có khối lượng m = 0,2 kg. Tính hằng số thời gian τ = m·R/(B²·l²) của chuyển động (theo s).',
        answer: {
          kind: 'numeric',
          value: 0.1,
          unit: 's',
        },
        explain:
          'τ = (0,2 × 0,5)/(1² × 1²) = 0,1 s. Sau 1τ thanh đạt ≈ 63% vận tốc giới hạn, sau 3τ đạt ≈ 95%. Thanh không bao giờ đạt đúng v_gh mà chỉ tiến sát tới nó, giống hệt dáng điệu của đường cong nạp tụ điện.',
      },
      {
        // Câu bẫy: dùng công thức chuyển động biến đổi đều cho bài có lực cản phụ thuộc vận tốc.
        prompt:
          'Một bạn giải bài trên bằng cách lấy gia tốc ban đầu a₀ = F/m = 10 m/s² rồi kết luận "sau 1 s thanh đạt vận tốc 10 m/s". Sai lầm nằm ở đâu?',
        choices: [
          {
            id: 'dung',
            label: 'Không sai, vì lực kéo không đổi nên chuyển động là nhanh dần đều',
          },
          {
            id: 'sai_gia_toc',
            label:
              'Sai, vì lực từ cản tăng theo vận tốc nên gia tốc giảm dần về 0; vận tốc không vượt quá v_gh = 1 m/s',
          },
          {
            id: 'sai_don_vi',
            label: 'Sai đơn vị, đáp số đúng phải là 10 cm/s',
          },
        ],
        answer: {
          kind: 'choice',
          correctIds: ['sai_gia_toc'],
        },
        explain:
          'Công thức v = a·t chỉ dùng được khi gia tốc KHÔNG ĐỔI, mà điều kiện đó ở đây bị phá vỡ ngay từ khoảnh khắc thanh bắt đầu chuyển động: v tăng → e = Blv tăng → i tăng → lực cản B²l²v/R tăng → hợp lực giảm → gia tốc giảm. ' +
          'Giá trị 10 m/s² chỉ đúng tại đúng thời điểm t = 0 và giảm liên tục sau đó, về 0 khi v tiến tới v_gh = 1 m/s. Kết luận "10 m/s sau 1 s" vượt vận tốc giới hạn tới mười lần, tức vô lý về mặt vật lý. ' +
          'Dấu hiệu nhận biết dạng bài này trong phòng thi: hễ trong biểu thức hợp lực có chứa chính đại lượng v (hoặc a) đang cần tìm thì chuyển động KHÔNG đều, và câu hỏi hầu như luôn xoay quanh trạng thái giới hạn — nơi gia tốc bằng 0 và bài toán trở lại thành một phương trình cân bằng lực đơn giản.',
      },
    ],
    srsCards: [
      {
        hoi: 'Chuỗi nhân quả trong bài thanh dẫn trượt trên ray?',
        dap: 'v → e = B·l·v → i = e/R → lực từ cản F_c = B²·l²·v/R, luôn ngược chiều vận tốc theo định luật Lenz.',
      },
      {
        hoi: 'Công thức vận tốc giới hạn và hằng số thời gian?',
        dap: 'v_gh = F·R/(B²·l²) — đạt khi lực cản cân bằng lực kéo; τ = m·R/(B²·l²), sau 1τ đạt ≈ 63% v_gh.',
      },
      {
        hoi: 'Vì sao không được dùng công thức chuyển động biến đổi đều cho bài này?',
        dap: 'Vì lực cản tỉ lệ với vận tốc nên gia tốc giảm dần từ F/m về 0; gia tốc không phải hằng số.',
      },
    ],
    // Cảnh dựng lại đúng chuỗi nhân quả của bài: thanh chạy → từ thông biến thiên → dòng cảm ứng
    // → lực từ cản ngược chiều v (Lenz), lớn dần tới khi cân bằng lực kéo thì thanh chạy đều.
    animation: {
      title: 'Thanh trượt trên ray: dòng cảm ứng sinh lực cản lớn dần tới vận tốc giới hạn',
      description:
        'Hai ray nằm ngang nối với điện trở R ở đầu trái, đặt trong từ trường đều B hướng vào trong trang (dấu ⊗). Thanh dẫn trượt sang phải: diện tích mạch tăng nên từ thông biến thiên, sinh suất điện động e = B·l·v và dòng cảm ứng i = B·l·v/R chạy vòng kín qua điện trở — các mũi tên dòng điện hiện dần lên cùng lúc thanh chạy, vì khi v = 0 thì chưa có dòng nào. Dòng i trong từ trường chịu lực từ Fc = B²·l²·v/R, vẽ bằng mũi tên NGƯỢC chiều chuyển động đúng theo định luật Lenz: dòng cảm ứng chống lại nguyên nhân sinh ra nó. Mũi tên vận tốc và mũi tên lực cản cùng dài ra theo thời gian, còn mũi tên lực kéo F giữ nguyên độ dài; khi lực cản dài bằng lực kéo thì hợp lực và gia tốc bằng 0, thanh chạy đều với v giới hạn = F·R/(B²·l²).',
      viewBoxWidth: 460,
      viewBoxHeight: 240,
      durationMs: 6000,
      loop: true,
      shapes: [
        { kind: 'circle', id: 'b-1', cx: 220, cy: 120, r: 7, stroke: 'muted', strokeWidth: 1.5 },
        {
          kind: 'line',
          id: 'b-1-a',
          x1: 215.5,
          y1: 115.5,
          x2: 224.5,
          y2: 124.5,
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'line',
          id: 'b-1-b',
          x1: 215.5,
          y1: 124.5,
          x2: 224.5,
          y2: 115.5,
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        { kind: 'circle', id: 'b-2', cx: 290, cy: 120, r: 7, stroke: 'muted', strokeWidth: 1.5 },
        {
          kind: 'line',
          id: 'b-2-a',
          x1: 285.5,
          y1: 115.5,
          x2: 294.5,
          y2: 124.5,
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'line',
          id: 'b-2-b',
          x1: 285.5,
          y1: 124.5,
          x2: 294.5,
          y2: 115.5,
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        { kind: 'circle', id: 'b-3', cx: 360, cy: 120, r: 7, stroke: 'muted', strokeWidth: 1.5 },
        {
          kind: 'line',
          id: 'b-3-a',
          x1: 355.5,
          y1: 115.5,
          x2: 364.5,
          y2: 124.5,
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'line',
          id: 'b-3-b',
          x1: 355.5,
          y1: 124.5,
          x2: 364.5,
          y2: 115.5,
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        { kind: 'circle', id: 'b-4', cx: 420, cy: 120, r: 7, stroke: 'muted', strokeWidth: 1.5 },
        {
          kind: 'line',
          id: 'b-4-a',
          x1: 415.5,
          y1: 115.5,
          x2: 424.5,
          y2: 124.5,
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'line',
          id: 'b-4-b',
          x1: 415.5,
          y1: 124.5,
          x2: 424.5,
          y2: 115.5,
          stroke: 'muted',
          strokeWidth: 1.5,
        },
        {
          kind: 'line',
          id: 'ray-tren',
          x1: 60,
          y1: 70,
          x2: 430,
          y2: 70,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'ray-duoi',
          x1: 60,
          y1: 170,
          x2: 430,
          y2: 170,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'line',
          id: 'doan-noi-trai',
          x1: 60,
          y1: 70,
          x2: 60,
          y2: 170,
          stroke: 'neutral',
          strokeWidth: 3,
        },
        {
          kind: 'rect',
          id: 'dien-tro',
          x: 48,
          y: 100,
          w: 24,
          h: 40,
          rx: 3,
          fill: 'surface',
          stroke: 'primary',
          strokeWidth: 3,
        },
        {
          kind: 'label',
          id: 'nhan-r',
          x: 42,
          y: 124,
          text: 'R',
          size: 14,
          anchor: 'end',
          fill: 'primary',
        },
        // Từ trường đều hướng vào trong trang — ký hiệu ⊗ rải trong vùng mạch.
        {
          kind: 'label',
          id: 'nhan-b',
          x: 430,
          y: 210,
          text: 'B hướng vào trong trang (⊗)',
          size: 12,
          anchor: 'end',
          fill: 'muted',
        },
        // Dòng cảm ứng: chỉ hiện lên khi thanh đã chuyển động (v = 0 thì i = 0).
        {
          kind: 'arrow',
          id: 'dong-tren',
          x1: 280,
          y1: 70,
          x2: 180,
          y2: 70,
          stroke: 'correct',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1000, opacity: 0.35 },
            { atMs: 2000, opacity: 0.6 },
            { atMs: 3000, opacity: 0.8 },
            { atMs: 4000, opacity: 0.9 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'dong-duoi',
          x1: 180,
          y1: 170,
          x2: 280,
          y2: 170,
          stroke: 'correct',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1000, opacity: 0.35 },
            { atMs: 2000, opacity: 0.6 },
            { atMs: 3000, opacity: 0.8 },
            { atMs: 4000, opacity: 0.9 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'arrow',
          id: 'dong-qua-r',
          x1: 60,
          y1: 88,
          x2: 60,
          y2: 152,
          stroke: 'correct',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1000, opacity: 0.35 },
            { atMs: 2000, opacity: 0.6 },
            { atMs: 3000, opacity: 0.8 },
            { atMs: 4000, opacity: 0.9 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-i',
          x: 230,
          y: 190,
          text: 'i = B·l·v / R',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 1500, opacity: 0.7 },
            { atMs: 3000, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        // Thanh dẫn: quãng đi mỗi giây tăng dần rồi ổn định — đúng dáng v(t) = v giới hạn(1 − e^(−t/τ)).
        {
          kind: 'line',
          id: 'thanh-dan',
          x1: 140,
          y1: 70,
          x2: 140,
          y2: 170,
          stroke: 'accent',
          strokeWidth: 6,
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 1000, dx: 7.5 },
            { atMs: 2000, dx: 25.5 },
            { atMs: 3000, dx: 49.5 },
            { atMs: 4000, dx: 76.5 },
            { atMs: 5000, dx: 105 },
            { atMs: 6000, dx: 133.5 },
          ],
        },
        // Mũi tên vận tốc dài dần: v tăng từ 0 và tiến sát v giới hạn.
        {
          kind: 'arrow',
          id: 'mui-ten-v',
          origin: [140, 52],
          x1: 140,
          y1: 52,
          x2: 200,
          y2: 52,
          stroke: 'accent',
          strokeWidth: 3,
          keyframes: [
            { atMs: 0, dx: 0, scale: 0.05 },
            { atMs: 1000, dx: 7.5, scale: 0.3 },
            { atMs: 2000, dx: 25.5, scale: 0.55 },
            { atMs: 3000, dx: 49.5, scale: 0.75 },
            { atMs: 4000, dx: 76.5, scale: 0.88 },
            { atMs: 5000, dx: 105, scale: 0.95 },
            { atMs: 6000, dx: 133.5, scale: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-v',
          x: 208,
          y: 48,
          text: 'v',
          size: 14,
          anchor: 'start',
          fill: 'accent',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 1000, dx: 7.5 },
            { atMs: 2000, dx: 25.5 },
            { atMs: 3000, dx: 49.5 },
            { atMs: 4000, dx: 76.5 },
            { atMs: 5000, dx: 105 },
            { atMs: 6000, dx: 133.5 },
          ],
        },
        // Lực kéo F không đổi → mũi tên giữ nguyên độ dài, chỉ đi theo thanh.
        {
          kind: 'arrow',
          id: 'mui-ten-f-keo',
          x1: 140,
          y1: 145,
          x2: 200,
          y2: 145,
          stroke: 'primary',
          strokeWidth: 4,
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 1000, dx: 7.5 },
            { atMs: 2000, dx: 25.5 },
            { atMs: 3000, dx: 49.5 },
            { atMs: 4000, dx: 76.5 },
            { atMs: 5000, dx: 105 },
            { atMs: 6000, dx: 133.5 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-f-keo',
          x: 208,
          y: 149,
          text: 'F kéo (không đổi)',
          size: 12,
          anchor: 'start',
          fill: 'primary',
          keyframes: [
            { atMs: 0, dx: 0 },
            { atMs: 1000, dx: 7.5 },
            { atMs: 2000, dx: 25.5 },
            { atMs: 3000, dx: 49.5 },
            { atMs: 4000, dx: 76.5 },
            { atMs: 5000, dx: 105 },
            { atMs: 6000, dx: 133.5 },
          ],
        },
        // Lực từ cản: NGƯỢC chiều v (Lenz), dài dần tới khi bằng lực kéo → hợp lực và gia tốc về 0.
        {
          kind: 'arrow',
          id: 'mui-ten-f-can',
          origin: [140, 95],
          x1: 140,
          y1: 95,
          x2: 80,
          y2: 95,
          stroke: 'danger',
          strokeWidth: 4,
          keyframes: [
            { atMs: 0, dx: 0, scale: 0.05 },
            { atMs: 1000, dx: 7.5, scale: 0.3 },
            { atMs: 2000, dx: 25.5, scale: 0.55 },
            { atMs: 3000, dx: 49.5, scale: 0.75 },
            { atMs: 4000, dx: 76.5, scale: 0.88 },
            { atMs: 5000, dx: 105, scale: 0.95 },
            { atMs: 6000, dx: 133.5, scale: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhan-f-can',
          x: 136,
          y: 88,
          text: 'Fc = B²·l²·v / R',
          size: 12,
          anchor: 'end',
          fill: 'neutral',
          keyframes: [
            { atMs: 0, dx: 0, opacity: 0 },
            { atMs: 1000, dx: 7.5, opacity: 0.6 },
            { atMs: 2000, dx: 25.5, opacity: 1 },
            { atMs: 3000, dx: 49.5, opacity: 1 },
            { atMs: 4000, dx: 76.5, opacity: 1 },
            { atMs: 5000, dx: 105, opacity: 1 },
            { atMs: 6000, dx: 133.5, opacity: 1 },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Thanh dẫn bắt đầu trượt sang phải trên hai ray trong từ trường đều B. Diện tích mạch tăng nên từ thông qua mạch biến thiên.',
        },
        {
          atMs: 1200,
          text: 'Từ thông biến thiên sinh suất điện động cảm ứng e = B·l·v; mạch kín nên có dòng cảm ứng i = e/R chạy vòng qua điện trở R (mũi tên xanh).',
        },
        {
          atMs: 2600,
          text: 'Dòng i nằm trong từ trường nên chịu lực từ Fc = B²·l²·v/R. Theo định luật Lenz, dòng cảm ứng chống lại nguyên nhân sinh ra nó — lực từ luôn NGƯỢC chiều vận tốc.',
        },
        {
          atMs: 4200,
          text: 'v càng lớn thì lực cản càng lớn, hợp lực F − Fc càng nhỏ: gia tốc giảm dần từ F/m chứ không phải hằng số. Không dùng được công thức chuyển động biến đổi đều.',
        },
        {
          atMs: 5400,
          text: 'Khi mũi tên lực cản dài bằng mũi tên lực kéo thì gia tốc bằng 0: thanh chạy đều với v giới hạn = F·R/(B²·l²), toàn bộ công của lực kéo biến thành nhiệt trên R.',
        },
      ],
    },
    track: 'advanced',
    advancedTier: 'hsg-quoc-gia',
    reviewStatus: 'draft',
  },
]
