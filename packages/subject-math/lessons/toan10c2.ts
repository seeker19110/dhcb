// lessons/toan10c2.ts — Toán 10, Chương 2: Bất phương trình và hệ bất phương trình bậc nhất hai ẩn.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN10_C2_LESSONS: MathLesson[] = [
  {
    id: 'toan10-c2-b1',
    grade: '10',
    chapterNumber: 2,
    chapterTitle: 'Bất phương trình và hệ bất phương trình bậc nhất hai ẩn',
    lessonNumber: 1,
    title: 'Miền nghiệm của bất phương trình bậc nhất hai ẩn',
    hook:
      'Một quán bún bò ở Huế mỗi sáng chỉ có 6 giờ để nấu. Một nồi bún nhỏ tốn 2 giờ, một nồi lớn tốn 3 giờ. Chủ ' +
      'quán muốn biết tất cả các cách phân chia số nồi nhỏ và nồi lớn sao cho vẫn kịp giờ mở cửa. Câu hỏi ấy không ' +
      'có MỘT đáp số — nó có cả một MIỀN đáp số, và ta vẽ được miền ấy ra giấy.',
    theory:
      'DẠNG TỔNG QUÁT\n' +
      'Bất phương trình bậc nhất hai ẩn có dạng ax + by + c < 0 (hoặc ≤, >, ≥) với a, b không đồng thời bằng 0. ' +
      'Mỗi cặp số (x₀; y₀) làm bất phương trình đúng gọi là một nghiệm; tập tất cả nghiệm gọi là MIỀN NGHIỆM.\n\n' +
      'VÌ SAO MIỀN NGHIỆM LUÔN LÀ MỘT NỬA MẶT PHẲNG\n' +
      'Đường thẳng d: ax + by + c = 0 chia mặt phẳng thành hai nửa. Xét biểu thức f(x; y) = ax + by + c. Khi điểm ' +
      'chạy liên tục từ nửa này sang nửa kia, f phải đi qua giá trị 0, tức là phải cắt d. Vậy trong mỗi nửa mặt ' +
      'phẳng (không kể d) dấu của f KHÔNG ĐỔI. Đó là lý do chỉ cần thử MỘT điểm đại diện là biết cả nửa mặt phẳng ' +
      'đó có thuộc miền nghiệm hay không.\n\n' +
      'QUY TRÌNH BA BƯỚC\n' +
      '1. Vẽ đường thẳng d: ax + by + c = 0 (nét liền nếu bất phương trình có dấu bằng, nét đứt nếu không — vì khi ' +
      'không có dấu bằng thì các điểm trên d KHÔNG phải nghiệm).\n' +
      '2. Chọn một điểm thử không nằm trên d. Gốc O(0; 0) là lựa chọn tốt nhất vì thay số cực nhanh; chỉ khi d đi ' +
      'qua gốc mới phải chọn điểm khác, ví dụ (1; 0).\n' +
      '3. Thay toạ độ điểm thử vào bất phương trình. Nếu đúng thì nửa mặt phẳng CHỨA điểm thử là miền nghiệm; nếu ' +
      'sai thì nửa còn lại là miền nghiệm.\n\n' +
      'HỆ BẤT PHƯƠNG TRÌNH\n' +
      'Miền nghiệm của hệ là GIAO của các miền nghiệm thành phần — vì một điểm phải thoả đồng thời mọi bất phương ' +
      'trình. Trong bài toán thực tế thường có thêm ràng buộc x ≥ 0, y ≥ 0 (số nồi bún không thể âm), nên miền ' +
      'nghiệm nằm gọn trong góc phần tư thứ nhất và thường là một đa giác.\n\n' +
      'ỨNG DỤNG — BÀI TOÁN TỐI ƯU\n' +
      'Khi miền nghiệm là một MIỀN ĐA GIÁC LỒI, giá trị lớn nhất và nhỏ nhất của biểu thức F = mx + ny đạt được tại ' +
      'một ĐỈNH của đa giác. Lý do: đường mức F = const là một họ đường thẳng song song; trượt đường thẳng ấy qua ' +
      'miền, vị trí cực trị luôn chạm miền ở một đỉnh (hoặc cả một cạnh, khi đường mức song song cạnh đó). Nhờ vậy ' +
      'chỉ cần tính F tại vài đỉnh thay vì thử vô hạn điểm.\n\n' +
      'GIỚI HẠN: kết luận "cực trị tại đỉnh" chỉ đúng khi miền nghiệm ĐÓNG và BỊ CHẶN. Miền không bị chặn có thể ' +
      'không có giá trị lớn nhất.',
    animation: {
      title: 'Thử điểm gốc toạ độ để xác định nửa mặt phẳng nghiệm',
      description:
        'Đường thẳng 2x + 3y = 6 được vẽ trên hệ trục. Một chấm tròn đại diện cho điểm thử O(0; 0) nhấp nháy, ' +
        'sau đó nửa mặt phẳng chứa gốc toạ độ được tô sáng lên để cho thấy đó chính là miền nghiệm của bất phương ' +
        'trình 2x + 3y ≤ 6 cùng với hai ràng buộc x ≥ 0 và y ≥ 0.',
      viewBoxWidth: 320,
      viewBoxHeight: 260,
      durationMs: 6000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'ox',
          x1: 40,
          y1: 210,
          x2: 300,
          y2: 210,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'oy',
          x1: 40,
          y1: 210,
          x2: 40,
          y2: 20,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'polyline',
          id: 'mienNghiem',
          points: [
            [40, 210],
            [220, 210],
            [40, 90],
          ],
          closed: true,
          fill: 'primary',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 3200, opacity: 0 },
            { atMs: 4200, opacity: 0.35 },
            { atMs: 6000, opacity: 0.35 },
          ],
        },
        {
          kind: 'line',
          id: 'duongD',
          x1: 220,
          y1: 210,
          x2: 40,
          y2: 90,
          stroke: 'accent',
          strokeWidth: 3,
        },
        {
          kind: 'circle',
          id: 'diemThu',
          cx: 40,
          cy: 210,
          r: 7,
          fill: 'warn',
          keyframes: [
            { atMs: 0, opacity: 0.2 },
            { atMs: 800, opacity: 1 },
            { atMs: 1600, opacity: 0.2 },
            { atMs: 2400, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
        {
          kind: 'label',
          id: 'nhanO',
          x: 28,
          y: 228,
          text: 'O(0;0)',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhanD',
          x: 232,
          y: 120,
          text: '2x + 3y = 6',
          size: 13,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'ketLuan',
          x: 110,
          y: 178,
          text: '0 ≤ 6 → nhận nửa này',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
          opacity: 0,
          keyframes: [
            { atMs: 0, opacity: 0 },
            { atMs: 4200, opacity: 0 },
            { atMs: 4800, opacity: 1 },
            { atMs: 6000, opacity: 1 },
          ],
        },
      ],
      captions: [
        { atMs: 0, text: 'Vẽ đường thẳng biên 2x + 3y = 6.' },
        { atMs: 1600, text: 'Chọn điểm thử O(0; 0) vì thay số nhanh nhất.' },
        { atMs: 3200, text: 'Thay vào: 2·0 + 3·0 = 0 ≤ 6 — đúng.' },
        { atMs: 4200, text: 'Vậy nửa mặt phẳng chứa O là miền nghiệm.' },
      ],
    },
    workedExample: {
      problem:
        'Quán bún có 6 giờ nấu mỗi sáng. Mỗi nồi nhỏ tốn 2 giờ và lãi 300 nghìn đồng; mỗi nồi lớn tốn 3 giờ và lãi ' +
        '400 nghìn đồng. Gọi x, y lần lượt là số nồi nhỏ và nồi lớn. Hãy lập hệ ràng buộc và tìm cách nấu cho lãi ' +
        'cao nhất (x, y là số nguyên không âm).',
      steps: [
        'Bước 1 — Chuyển lời văn thành ràng buộc: tổng thời gian nấu không vượt quá 6 giờ, cho 2x + 3y ≤ 6. Số nồi ' +
          'không âm nên thêm x ≥ 0, y ≥ 0. Đây là hệ bất phương trình bậc nhất hai ẩn.',
        'Bước 2 — Viết hàm mục tiêu: tiền lãi F(x; y) = 300x + 400y (nghìn đồng). Ta cần giá trị lớn nhất của F trên ' +
          'miền nghiệm.',
        'Bước 3 — Xác định miền nghiệm: đó là tam giác với ba đỉnh O(0; 0), A(3; 0) và B(0; 2). Chọn cách vẽ này vì ' +
          'miền bị chặn nên chắc chắn tồn tại giá trị lớn nhất, và cực trị đạt tại đỉnh.',
        'Bước 4 — Tính F tại từng đỉnh: F(O) = 0; F(A) = 300·3 = 900; F(B) = 400·2 = 800. Lớn nhất là 900 tại A(3; 0).',
        'Bước 5 — Kiểm tra điều kiện nguyên: x = 3, y = 0 đều là số nguyên không âm nên phương án này thực hiện được. ' +
          '(Nếu đỉnh tối ưu có toạ độ lẻ thì phải dò thêm các điểm nguyên lân cận trong miền.)',
      ],
      answer: 'Nấu 3 nồi nhỏ, 0 nồi lớn; lãi lớn nhất 900 nghìn đồng.',
    },
    checkQuestions: [
      {
        prompt: 'Cặp số nào sau đây KHÔNG phải nghiệm của bất phương trình 2x − y > 3?',
        choices: [
          { id: 'a', label: '(3; 1)' },
          { id: 'b', label: '(2; 1)' },
          { id: 'c', label: '(0; −4)' },
          { id: 'd', label: '(5; 0)' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Thay lần lượt: (3;1) cho 5 > 3 đúng; (2;1) cho 2·2 − 1 = 3, mà 3 > 3 là SAI vì bất phương trình không có ' +
          'dấu bằng; (0;−4) cho 4 > 3 đúng; (5;0) cho 10 > 3 đúng. Bẫy nằm ở chỗ nhiều bạn thấy đẳng thức xảy ra ' +
          'liền coi là "thoả". Dấu > nghiêm ngặt loại bỏ chính các điểm nằm TRÊN đường biên — đó cũng là lý do đường ' +
          'biên phải vẽ nét đứt.',
      },
      {
        prompt:
          'Miền nghiệm của hệ x ≥ 0, y ≥ 0, x + y ≤ 4 là một tam giác. Giá trị lớn nhất của F = 2x + 5y trên miền ' +
          'đó bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 20 },
        explain:
          'Ba đỉnh của miền là (0;0), (4;0), (0;4). Tính F tại từng đỉnh: 0; 8; 20. Vậy giá trị lớn nhất là 20 tại ' +
          '(0; 4). Lỗi hay gặp là cứ chọn đỉnh có x lớn nhất vì tưởng "đi xa gốc thì F lớn"; thực ra F phụ thuộc hệ ' +
          'số, ở đây hệ số của y lớn hơn nên ưu tiên dồn vào y. Luôn TÍNH F tại mọi đỉnh thay vì đoán.',
      },
      {
        prompt:
          'Khi vẽ miền nghiệm của bất phương trình 3x + y < 6, đường thẳng 3x + y = 6 phải được vẽ bằng nét liền hay ' +
          'nét đứt? Nhập 1 nếu nét liền, nhập 2 nếu nét đứt.',
        answer: { kind: 'numeric', value: 2 },
        explain:
          'Bất phương trình dùng dấu < nghiêm ngặt nên các điểm nằm ngay trên đường thẳng không thoả mãn, do đó phải ' +
          'vẽ nét ĐỨT để thể hiện biên bị loại. Nét liền chỉ dùng cho dấu ≤ hoặc ≥. Đây là chi tiết nhỏ nhưng bị trừ ' +
          'điểm trình bày rất thường xuyên.',
      },
    ],
    srsCards: [
      {
        hoi: 'Vì sao chỉ cần thử MỘT điểm là biết được cả nửa mặt phẳng có phải miền nghiệm không?',
        dap: 'Vì biểu thức ax + by + c giữ nguyên dấu trên toàn bộ mỗi nửa mặt phẳng do đường thẳng chia ra.',
      },
      {
        hoi: 'Giá trị lớn nhất/nhỏ nhất của F = mx + ny trên miền đa giác lồi bị chặn đạt ở đâu?',
        dap: 'Tại một đỉnh của đa giác — nên chỉ cần tính F tại các đỉnh.',
      },
      {
        hoi: 'Khi nào vẽ đường biên bằng nét đứt?',
        dap: 'Khi bất phương trình dùng dấu < hoặc > (không có dấu bằng), tức biên bị loại khỏi miền nghiệm.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan10-c2-b2',
    grade: '10',
    chapterNumber: 2,
    chapterTitle: 'Bất phương trình và hệ bất phương trình bậc nhất hai ẩn',
    lessonNumber: 2,
    title: 'Hệ bất phương trình bậc nhất hai ẩn và bài toán tối ưu',
    hook:
      'Một xưởng may nhỏ ở Bình Dương mỗi ngày chỉ có 24 mét vải và 16 giờ công. Áo sơ mi tốn nhiều vải, quần ' +
      'tốn nhiều giờ công. Chủ xưởng không hỏi "làm được bao nhiêu áo" mà hỏi "làm bao nhiêu áo và bao nhiêu quần ' +
      'thì lãi nhiều nhất". Mỗi ràng buộc là một đường thẳng cắt mặt phẳng; chỗ giao của chúng vẽ ra một đa giác, ' +
      'và lời giải luôn nằm ở một góc của đa giác ấy. Vì sao lại ở góc? Bài học này chứng minh điều đó.',
    theory:
      'TỪ NHIỀU RÀNG BUỘC ĐẾN MỘT ĐA GIÁC LỒI\n' +
      'Mỗi bất phương trình bậc nhất hai ẩn cho một nửa mặt phẳng; cả hệ cho GIAO của các nửa mặt phẳng ấy. Giao ' +
      'này luôn LỒI: nếu hai điểm P, Q cùng thuộc miền thì cả đoạn PQ cũng thuộc miền, vì mỗi nửa mặt phẳng đã ' +
      'có tính chất đó và một điểm của đoạn PQ nằm trong mọi nửa mặt phẳng chứa P và Q.\n' +
      'ĐỈNH của miền là giao điểm của hai đường biên mà vẫn thoả MỌI bất phương trình còn lại. Cách tìm: giải hệ ' +
      'hai phương trình biên, rồi THỬ nghiệm vào các bất phương trình khác. Bước thử hay bị bỏ qua, và một giao ' +
      'điểm không qua được bước thử thì không phải đỉnh.\n\n' +
      'BÀI TOÁN TỐI ƯU\n' +
      'Ta cần tìm giá trị lớn nhất (hoặc nhỏ nhất) của hàm mục tiêu F(x; y) = ax + by trên miền nghiệm. Một miền ' +
      'có vô số điểm, nên không thể thử từng điểm; điều cứu ta là định lí sau.\n\n' +
      'VÌ SAO CỰC TRỊ ĐẠT TẠI ĐỈNH\n' +
      '1) Trên một đoạn PQ: điểm M = P + t(Q − P) với 0 ≤ t ≤ 1 có F(M) = (1 − t)·F(P) + t·F(Q), vì F bậc nhất. ' +
      'Đó là một số nằm GIỮA F(P) và F(Q), nên không điểm nào của đoạn vượt quá hai đầu mút.\n' +
      '2) Mỗi điểm của đa giác lồi nằm trên một đoạn nối hai điểm ở biên, và mỗi điểm ở biên nằm trên một cạnh. ' +
      'Áp dụng ý 1) hai lần, F tại điểm bất kì không vượt quá giá trị lớn nhất của F tại các đỉnh.\n' +
      'Cách nhìn bằng hình: các đường mức F = c là họ đường thẳng song song. Tăng c thì đường thẳng trượt về một ' +
      'phía; vị trí cuối cùng còn chạm miền luôn là một đỉnh (hoặc cả một cạnh nếu đường mức song song với cạnh đó).\n\n' +
      'QUY TRÌNH NĂM BƯỚC\n' +
      '1. Đặt ẩn, ghi rõ đơn vị. 2. Lập hệ bất phương trình, đừng quên x ≥ 0, y ≥ 0. 3. Vẽ miền và tìm các đỉnh ' +
      '(giải hệ hai đường biên rồi thử). 4. Tính F tại từng đỉnh, so sánh. 5. Đối chiếu điều kiện thực tế ' +
      '(số nguyên, đơn vị) trước khi kết luận.\n\n' +
      'BA TÌNH HUỐNG PHẢI PHÂN BIỆT\n' +
      '— Miền bị chặn: có cả giá trị lớn nhất lẫn nhỏ nhất, đều tại đỉnh.\n' +
      '— Miền không bị chặn (hay gặp ở bài khẩu phần dùng dấu ≥): nếu hệ số của F đều dương thì F có giá trị nhỏ ' +
      'nhất tại một đỉnh nhưng KHÔNG có giá trị lớn nhất, vì F tăng mãi khi đi ra xa.\n' +
      '— Đường mức cùng phương với một cạnh: cực trị đạt tại mọi điểm của cạnh đó, trong đó có hai đỉnh.\n\n' +
      'BẪY: khi đề đòi nghiệm nguyên mà đỉnh tối ưu có toạ độ lẻ, KHÔNG làm tròn bừa. Điểm làm tròn có thể nằm ' +
      'ngoài miền hoặc không phải phương án tốt nhất; phải xét các điểm nguyên gần đỉnh và còn thuộc miền.',
    animation: {
      title: 'Trượt đường mức F lên cho tới khi chạm đỉnh cuối cùng của miền nghiệm',
      description:
        'Miền nghiệm của hệ 3x + 2y ≤ 24, x + 2y ≤ 16, x ≥ 0, y ≥ 0 là tứ giác OABC với các đỉnh O(0; 0), A(8; 0), B(4; 6), C(0; 8). Một đường thẳng F = 120x + 150y bắt đầu ở giá trị 450 rồi trượt song song với chính nó về phía F tăng: 900, rồi 1380. Đường này rời miền ở đúng đỉnh B(4; 6), nơi F đạt lớn nhất bằng 1380. Các đỉnh còn lại cho F nhỏ hơn: 0, 960 và 1200.',
      viewBoxWidth: 320,
      viewBoxHeight: 260,
      durationMs: 7000,
      loop: true,
      shapes: [
        {
          kind: 'line',
          id: 'truc-x',
          x1: 40,
          y1: 220,
          x2: 300,
          y2: 220,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'line',
          id: 'truc-y',
          x1: 40,
          y1: 220,
          x2: 40,
          y2: 20,
          stroke: 'muted',
          strokeWidth: 2,
        },
        {
          kind: 'polyline',
          id: 'mien',
          points: [
            [40, 220],
            [216, 220],
            [128, 88],
            [40, 44],
          ],
          closed: true,
          fill: 'primary',
          stroke: 'primary',
          strokeWidth: 2,
          opacity: 0.3,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 900,
              opacity: 0.3,
            },
            {
              atMs: 7000,
              opacity: 0.3,
            },
          ],
        },
        {
          kind: 'line',
          id: 'duong-muc',
          x1: 88,
          y1: 56,
          x2: 168,
          y2: 120,
          stroke: 'accent',
          strokeWidth: 3,
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
              dx: -66.5,
              dy: 83.2,
            },
            {
              atMs: 1200,
              opacity: 1,
              dx: -66.5,
              dy: 83.2,
            },
            {
              atMs: 4400,
              dx: 0,
              dy: 0,
            },
            {
              atMs: 7000,
              dx: 0,
              dy: 0,
            },
          ],
        },
        {
          kind: 'circle',
          id: 'dinh-o',
          cx: 40,
          cy: 220,
          r: 3,
          fill: 'neutral',
        },
        {
          kind: 'circle',
          id: 'dinh-a',
          cx: 216,
          cy: 220,
          r: 3,
          fill: 'neutral',
        },
        {
          kind: 'circle',
          id: 'dinh-c',
          cx: 40,
          cy: 44,
          r: 3,
          fill: 'neutral',
        },
        {
          kind: 'circle',
          id: 'dinh-b',
          cx: 128,
          cy: 88,
          r: 6,
          fill: 'warn',
          opacity: 0,
          keyframes: [
            {
              atMs: 0,
              opacity: 0,
            },
            {
              atMs: 4400,
              opacity: 0,
            },
            {
              atMs: 4700,
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
          id: 'nhan-o',
          x: 30,
          y: 236,
          text: 'O',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-a',
          x: 216,
          y: 238,
          text: 'A(8;0)',
          size: 13,
          anchor: 'middle',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-b',
          x: 138,
          y: 78,
          text: 'B(4;6)',
          size: 13,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'nhan-c',
          x: 48,
          y: 40,
          text: 'C(0;8)',
          size: 13,
          anchor: 'start',
          fill: 'neutral',
        },
        {
          kind: 'label',
          id: 'cong-thuc',
          x: 190,
          y: 140,
          text: 'F = 120x + 150y',
          size: 13,
          anchor: 'start',
          fill: 'accent',
        },
        {
          kind: 'label',
          id: 'f-450',
          x: 190,
          y: 160,
          text: 'F = 450',
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
              atMs: 1200,
              opacity: 0,
            },
            {
              atMs: 1500,
              opacity: 1,
            },
            {
              atMs: 2450,
              opacity: 1,
            },
            {
              atMs: 2750,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'f-900',
          x: 190,
          y: 160,
          text: 'F = 900',
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
              atMs: 2750,
              opacity: 0,
            },
            {
              atMs: 3050,
              opacity: 1,
            },
            {
              atMs: 3950,
              opacity: 1,
            },
            {
              atMs: 4250,
              opacity: 0,
            },
          ],
        },
        {
          kind: 'label',
          id: 'f-1380',
          x: 190,
          y: 160,
          text: 'F = 1380',
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
              atMs: 4400,
              opacity: 0,
            },
            {
              atMs: 4700,
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
          id: 'ket-luan',
          x: 312,
          y: 36,
          text: 'F lớn nhất = 1380 tại B(4;6)',
          size: 13,
          anchor: 'end',
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
              atMs: 7000,
              opacity: 1,
            },
          ],
        },
      ],
      captions: [
        {
          atMs: 0,
          text: 'Hệ ràng buộc cho miền nghiệm là tứ giác OABC.',
        },
        {
          atMs: 1200,
          text: 'Đường mức F = 450 đã cắt miền: có điểm của miền cho F = 450.',
        },
        {
          atMs: 2750,
          text: 'Đẩy đường mức về phía F tăng nhưng giữ nguyên phương: 900, rồi cao hơn nữa.',
        },
        {
          atMs: 4400,
          text: 'Điểm cuối cùng còn thuộc miền là đỉnh B(4; 6): F = 120·4 + 150·6 = 1380.',
        },
        {
          atMs: 5500,
          text: 'Các đỉnh khác đều thấp hơn: F(O) = 0, F(A) = 960, F(C) = 1200.',
        },
      ],
    },
    workedExample: {
      problem:
        'Mỗi ngày xưởng may có 24 m vải và 16 giờ công. Một áo cần 3 m vải và 1 giờ công, lãi 120 nghìn đồng; ' +
        'một quần cần 2 m vải và 2 giờ công, lãi 150 nghìn đồng. Gọi x, y là số áo, số quần làm trong ngày. ' +
        'Tìm x, y để tổng lãi lớn nhất.',
      steps: [
        'Bước 1 — Lập hệ ràng buộc: vải cho 3x + 2y ≤ 24; giờ công cho x + 2y ≤ 16; số lượng không âm cho x ≥ 0, ' +
          'y ≥ 0. Hàm mục tiêu là F = 120x + 150y (nghìn đồng).',
        'Bước 2 — Tìm đỉnh của miền: hai đỉnh nằm trên trục là O(0; 0) và A(8; 0) (từ 3x = 24), C(0; 8) (từ 2y = 16). ' +
          'Đỉnh còn lại là giao của hai đường biên: trừ hai phương trình 3x + 2y = 24 và x + 2y = 16 được 2x = 8, ' +
          'suy ra x = 4, y = 6, tức B(4; 6).',
        'Bước 3 — Thử các đỉnh vào mọi bất phương trình: C(0; 8) cho 3·0 + 16 = 16 ≤ 24 đúng; A(8; 0) cho 8 + 0 = 8 ' +
          '≤ 16 đúng; B thoả cả hai ở dấu bằng. Vậy miền là tứ giác OABC.',
        'Bước 4 — Chọn tính F tại đỉnh vì miền bị chặn và F bậc nhất: F(O) = 0; F(A) = 120·8 = 960; ' +
          'F(B) = 120·4 + 150·6 = 480 + 900 = 1380; F(C) = 150·8 = 1200.',
        'Bước 5 — Kết luận và kiểm tra: lớn nhất là 1380 tại B(4; 6), đều là số nguyên nên làm được. B dùng hết ' +
          'cả 24 m vải lẫn 16 giờ công, hợp lý vì không còn nguồn lực nào bị bỏ phí. Đỉnh C chỉ dùng 16 m vải nên ' +
          'còn dư vải mà vẫn lãi kém hơn.',
      ],
      answer: 'Làm 4 áo và 6 quần mỗi ngày; lãi lớn nhất 1380 nghìn đồng.',
    },
    checkQuestions: [
      {
        prompt:
          'Miền nghiệm của hệ x ≥ 0, y ≥ 0, x + y ≤ 6, x + 3y ≤ 12 là một tứ giác. Giá trị lớn nhất của ' +
          'F = 2x + 3y trên miền đó bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 15 },
        explain:
          'Các đỉnh là (0;0), (6;0), (0;4) và giao của hai đường biên x + y = 6, x + 3y = 12, tức (3;3). Tính F: ' +
          '0; 12; 12; 15. Vậy lớn nhất là 15 tại (3;3). Lỗi hay gặp là chỉ thử các đỉnh nằm trên trục toạ độ ' +
          'và quên đỉnh giao của hai đường biên; chính đỉnh ấy lại cho đáp số ở bài này.',
      },
      {
        prompt:
          'Điểm nào sau đây KHÔNG thuộc miền nghiệm của hệ x ≥ 0, y ≥ 0, 2x + y ≤ 8, x + y ≥ 2?',
        choices: [
          { id: 'a', label: '(1; 1)' },
          { id: 'b', label: '(3; 2)' },
          { id: 'c', label: '(0; 1)' },
          { id: 'd', label: '(2; 4)' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Điểm thuộc miền phải thoả ĐỒNG THỜI mọi bất phương trình. (0;1) đúng với x ≥ 0, y ≥ 0 và 2x + y = 1 ≤ 8, ' +
          'nhưng x + y = 1 không đạt ≥ 2, nên bị loại. Ba điểm (1;1), (3;2), (2;4) đều nằm đúng trên một đường ' +
          'biên nhưng vẫn thuộc miền vì các bất phương trình có dấu bằng. Chỉ cần MỘT điều kiện sai là loại.',
      },
      {
        prompt:
          'Một nhà bếp trộn x phần đậu và y phần trứng, thoả 2x + y ≥ 6, x + 2y ≥ 6, x ≥ 0, y ≥ 0. Chi phí là ' +
          'C = 4x + 5y (nghìn đồng). Chi phí nhỏ nhất bằng bao nhiêu nghìn đồng?',
        answer: { kind: 'numeric', value: 18 },
        explain:
          'Miền không bị chặn, có ba đỉnh: (0;6), (6;0) và giao của hai đường biên, (2;2). Tính C: 30; 24; 18. ' +
          'Nhỏ nhất là 18 tại (2;2). Vì hệ số của C đều dương nên C chắc chắn có giá trị nhỏ nhất ở một đỉnh, ' +
          'còn giá trị lớn nhất thì không tồn tại do miền kéo dài vô hạn. Đừng áp máy móc "tính F ở mọi đỉnh" ' +
          'cho giá trị lớn nhất của miền không bị chặn.',
      },
      {
        prompt:
          'Miền nghiệm là tam giác O(0; 0), A(5; 0), B(0; 5). Hàm F = 2x + 2y đạt giá trị lớn nhất tại đâu?',
        choices: [
          { id: 'a', label: 'Chỉ tại A' },
          { id: 'b', label: 'Chỉ tại B' },
          { id: 'c', label: 'Tại mọi điểm trên đoạn AB' },
          { id: 'd', label: 'Tại O' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'F(O) = 0, F(A) = 10 và F(B) = 10. Đường mức 2x + 2y = 10 trùng với cạnh AB (cùng phương trình ' +
          'x + y = 5), nên mọi điểm của cạnh AB đều cho F = 10. Đây là trường hợp đường mức song song với một ' +
          'cạnh: cực đại đạt tại cả đoạn thẳng chứ không riêng một đỉnh. Chọn "chỉ tại A" là nhầm vì bỏ sót B.',
      },
    ],
    srsCards: [
      {
        hoi: 'Vì sao giá trị lớn nhất của F = ax + by trên đa giác lồi bị chặn đạt tại đỉnh?',
        dap: 'F bậc nhất nên trên đoạn PQ, F nằm giữa F(P) và F(Q); mọi điểm của đa giác nằm trên đoạn nối các điểm biên, nên không vượt các đỉnh.',
      },
      {
        hoi: 'Giao điểm hai đường biên có luôn là đỉnh của miền nghiệm không?',
        dap: 'Không. Phải thử nó vào mọi bất phương trình còn lại; chỉ khi thoả hết mới là đỉnh.',
      },
      {
        hoi: 'Miền nghiệm không bị chặn thì F = ax + by (a, b > 0) có những giá trị cực trị nào?',
        dap: 'Có giá trị nhỏ nhất tại một đỉnh nhưng không có giá trị lớn nhất, vì F tăng vô hạn khi đi ra xa.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
