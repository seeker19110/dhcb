// lessons/toan9c6.ts — Toán 9, Chương 6: Hàm số y = ax² (a ≠ 0). Phương trình bậc hai một ẩn.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN9_C6_LESSONS: MathLesson[] = [
  {
    id: 'toan9-c6-b1',
    grade: '9',
    chapterNumber: 6,
    chapterTitle: 'Hàm số y = ax² (a ≠ 0). Phương trình bậc hai một ẩn',
    lessonNumber: 1,
    title: 'Hàm số y = ax² (a ≠ 0) và đồ thị',
    hook:
      'Em thả một viên đá xuống giếng làng. Sau 1 giây viên đá rơi được khoảng 5 mét, sau 2 giây rơi được 20 mét, sau 3 giây rơi được 45 mét. ' +
      'Thời gian tăng gấp đôi mà quãng đường không tăng gấp đôi: quãng đường s liên hệ với thời gian t bởi công thức s = 5t², không phải dạng bậc nhất quen thuộc. ' +
      'Bài này dạy em hàm số y = ax² và hình dạng đặc biệt của đồ thị của nó.',
    theory:
      'HÀM SỐ y = ax² (a ≠ 0)\n' +
      'Là hàm số cho bởi công thức y = ax², trong đó a là số khác 0. Hàm số xác định với mọi số thực x. Ví dụ y = x²; y = 2x²; y = −x²/2.\n' +
      'Bảng giá trị của y = 2x²: x = −2, −1, 0, 1, 2 thì y = 8, 2, 0, 2, 8. Chú ý các giá trị của y ở hai cột x và −x giống nhau.\n' +
      'VÌ SAO hai giá trị đối nhau của x cho cùng một giá trị y? Vì (−x)² = x².\n\n' +
      'TÍNH CHẤT\n' +
      '— Nếu a > 0: y ≥ 0 với mọi x; giá trị nhỏ nhất của y bằng 0 khi x = 0.\n' +
      '— Nếu a < 0: y ≤ 0 với mọi x; giá trị lớn nhất của y bằng 0 khi x = 0.\n\n' +
      'ĐỒ THỊ\n' +
      'Đồ thị của hàm số y = ax² là một đường cong gọi là parabol, có:\n' +
      '— Đỉnh là gốc tọa độ O(0; 0).\n' +
      '— Trục đối xứng là trục tung Oy: hai điểm (x; y) và (−x; y) của đồ thị đối xứng với nhau qua Oy.\n' +
      '— Nếu a > 0: đồ thị nằm phía trên trục hoành, bề lõm hướng lên (O là điểm thấp nhất). Nếu a < 0: đồ thị nằm phía dưới trục hoành, bề lõm hướng xuống (O là điểm cao nhất).\n' +
      'Cách vẽ: lập bảng giá trị với vài giá trị x đối nhau, vẽ các điểm trong mặt phẳng tọa độ rồi nối bằng một đường cong trơn qua O.\n\n' +
      'ĐIỂM THUỘC ĐỒ THỊ, TÌM a\n' +
      'Điểm (x₀; y₀) thuộc đồ thị y = ax² khi y₀ = a · x₀². Nếu biết một điểm (x₀; y₀) với x₀ ≠ 0 của đồ thị thì a = y₀ : x₀².\n\n' +
      'ỨNG DỤNG: RƠI TỰ DO\n' +
      'Khi bỏ qua sức cản của không khí, quãng đường rơi s (mét) sau t giây tính gần đúng bởi s = 5t². Đây là hàm số y = ax² với a = 5, và chỉ lấy t ≥ 0.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Tính (−3)² = −9 (sai, đúng là 9). Riêng −3² mới bằng −9.\n' +
      '— Với y = 2x² và x = −3: viết (2 · (−3))² = 36 (sai); phải bình phương x trước rồi mới nhân a: 2 · 9 = 18.\n' +
      '— Nhầm bề lõm: a > 0 thì bề lõm hướng LÊN, a < 0 thì hướng XUỐNG.\n' +
      '— Quên là đồ thị luôn đi qua gốc O và đối xứng qua Oy.',
    workedExample: {
      problem:
        'Cho hàm số y = ax² có đồ thị đi qua điểm A(−3; −18). a) Tìm a. b) Điểm B(2; −8) có thuộc đồ thị không? ' +
        'c) Viên đá thả xuống một cái giếng chạm mặt nước sau 3 giây. Biết s = 5t², giếng sâu bao nhiêu mét?',
      steps: [
        'a) Điểm A thuộc đồ thị nên −18 = a · (−3)². Vì (−3)² = 9 nên 9a = −18, suy ra a = −2. Hàm số là y = −2x².',
        'a) Vì a = −2 < 0 nên đồ thị có bề lõm hướng xuống, nằm phía dưới trục hoành. Điểm A có tung độ âm, phù hợp.',
        'b) Thay x = 2 vào y = −2x²: y = −2 · 4 = −8, đúng bằng tung độ của B. Vậy B thuộc đồ thị.',
        'c) Thay t = 3 vào s = 5t²: s = 5 · 9 = 45. Giếng sâu khoảng 45 mét.',
      ],
      answer: 'a) a = −2. b) B thuộc đồ thị. c) Giếng sâu khoảng 45 m.',
    },
    checkQuestions: [
      {
        prompt: 'Cho hàm số y = −3x². Giá trị của y khi x = −4 là bao nhiêu (nhập số âm nếu có)?',
        answer: { kind: 'numeric', value: -48 },
        explain:
          'Thay x = −4: y = −3 · (−4)² = −3 · 16 = −48. ' +
          'Lỗi hay gặp là tính (−4)² = −16 rồi ra y = 48, hoặc bình phương cả tích −3 · (−4) được 144.',
      },
      {
        prompt: 'Phát biểu nào sau đây về đồ thị hàm số y = −x²/4 là đúng?',
        choices: [
          { id: 'a', label: 'Parabol có bề lõm hướng lên' },
          { id: 'b', label: 'Parabol nằm phía trên trục hoành' },
          { id: 'c', label: 'Parabol có đỉnh O và nhận trục tung Oy làm trục đối xứng' },
          { id: 'd', label: 'Parabol đi qua điểm (2; 1)' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Đồ thị y = ax² luôn có đỉnh O và nhận Oy làm trục đối xứng, nên c đúng. Vì a = −1/4 < 0 nên bề lõm hướng xuống và đồ thị nằm phía dưới trục hoành (a, b sai). ' +
          'Với x = 2 thì y = −4/4 = −1 chứ không phải 1 (d sai).',
      },
      {
        prompt:
          'Đồ thị hàm số y = ax² đi qua điểm M(−4; 8). Hệ số a bằng bao nhiêu (viết dưới dạng số thập phân)?',
        answer: { kind: 'numeric', value: 0.5 },
        explain:
          'Thay tọa độ M: 8 = a · (−4)² = 16a, nên a = 8 : 16 = 0,5. ' +
          'Lỗi hay gặp là tính (−4)² = −16 rồi ra a = −0,5, hoặc lấy a = 8 : (−4) = −2 (không bình phương x).',
      },
      {
        prompt:
          'Một vật rơi tự do từ độ cao 125 mét, quãng đường rơi sau t giây là s = 5t² (mét). Sau bao nhiêu giây vật chạm đất?',
        answer: { kind: 'numeric', value: 5 },
        explain:
          'Vật chạm đất khi s = 125: 5t² = 125, nên t² = 25 và t = 5 (giây, lấy t > 0). ' +
          'Lỗi hay gặp là lấy t = 125 : 5 = 25 mà quên lấy căn bậc hai của t², hoặc nhận cả nghiệm t = −5 trong khi thời gian không thể âm.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tính chất của hàm số y = ax² khi a > 0 và khi a < 0?',
        dap: 'a > 0: y ≥ 0, nhỏ nhất bằng 0 tại x = 0, đồ thị nằm phía trên trục hoành. a < 0: y ≤ 0, lớn nhất bằng 0 tại x = 0, đồ thị nằm phía dưới trục hoành.',
      },
      {
        hoi: 'Đồ thị hàm số y = ax² có hình dạng và đặc điểm gì?',
        dap: 'Là parabol có đỉnh O, trục đối xứng Oy; a > 0 bề lõm hướng lên, a < 0 bề lõm hướng xuống.',
      },
      {
        hoi: 'Biết đồ thị y = ax² đi qua (x₀; y₀) với x₀ ≠ 0, tìm a thế nào?',
        dap: 'Thay tọa độ vào: y₀ = a · x₀², nên a = y₀ : x₀² (bình phương x₀ trước khi chia).',
      },
      {
        hoi: 'Công thức quãng đường rơi tự do (bỏ qua sức cản không khí)?',
        dap: 's = 5t² (s mét, t giây), là hàm số y = ax² với a = 5.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan9-c6-b2',
    grade: '9',
    chapterNumber: 6,
    chapterTitle: 'Hàm số y = ax² (a ≠ 0). Phương trình bậc hai một ẩn',
    lessonNumber: 2,
    title: 'Phương trình bậc hai một ẩn',
    hook:
      'Bác Hai muốn rào một mảnh vườn hình chữ nhật có chiều dài hơn chiều rộng 3 mét và diện tích 70 mét vuông. ' +
      'Gọi x là chiều rộng, ta được x(x + 3) = 70, tức x² + 3x − 70 = 0. Phương trình này có x² nên không còn là phương trình bậc nhất, ta không giải được bằng chuyển vế. ' +
      'Bài này dạy cách giải loại phương trình mới đó: phương trình bậc hai một ẩn.',
    theory:
      'PHƯƠNG TRÌNH BẬC HAI MỘT ẨN\n' +
      'Là phương trình có dạng ax² + bx + c = 0, trong đó x là ẩn, a, b, c là các số cho trước và a ≠ 0. Ví dụ x² − 5x + 6 = 0; 2x² − 18 = 0; 3x² − 12x = 0.\n' +
      'VÌ SAO điều kiện a ≠ 0? Nếu a = 0 thì phương trình thành bx + c = 0, là phương trình bậc nhất, không còn là bậc hai.\n' +
      'Muốn xác định a, b, c phải đưa phương trình về dạng chuẩn trước. Ví dụ x² = 3x + 4 đưa về x² − 3x − 4 = 0, được a = 1, b = −3, c = −4.\n\n' +
      'TRƯỜNG HỢP KHUYẾT\n' +
      '— Khuyết b (ax² + c = 0): chuyển vế được x² = −c/a. Nếu −c/a > 0 thì có hai nghiệm đối nhau; nếu −c/a < 0 thì vô nghiệm; nếu c = 0 thì ax² = 0 cho x = 0. Ví dụ 2x² − 18 = 0 cho x² = 9 nên x = 3 hoặc x = −3.\n' +
      '— Khuyết c (ax² + bx = 0): đặt nhân tử chung x(ax + b) = 0, nên x = 0 hoặc x = −b/a. Ví dụ 3x² − 12x = 0 cho 3x(x − 4) = 0 nên x = 0 hoặc x = 4.\n\n' +
      'CÔNG THỨC NGHIỆM\n' +
      'Với ax² + bx + c = 0 (a ≠ 0), đặt biệt thức Δ = b² − 4ac.\n' +
      '— Δ < 0: phương trình vô nghiệm.\n' +
      '— Δ = 0: có nghiệm kép x₁ = x₂ = −b/(2a).\n' +
      '— Δ > 0: có hai nghiệm phân biệt x = (−b ± √Δ)/(2a).\n' +
      'Ví dụ 2x² − 5x + 3 = 0: Δ = 25 − 24 = 1 > 0, nên x = (5 ± 1)/4, tức x = 3/2 hoặc x = 1.\n' +
      'VÌ SAO có Δ? Nhân hai vế với 4a rồi gộp được (2ax + b)² = b² − 4ac = Δ. Một bình phương không thể âm, nên Δ < 0 thì không có x nào thỏa; Δ = 0 thì 2ax + b = 0; Δ > 0 thì 2ax + b = ±√Δ.\n\n' +
      'CÔNG THỨC NGHIỆM THU GỌN\n' +
      'Khi b chẵn, b = 2b′, đặt Δ′ = b′² − ac (Δ = 4Δ′ nên cùng dấu với Δ).\n' +
      '— Δ′ < 0: vô nghiệm. Δ′ = 0: nghiệm kép x = −b′/a. Δ′ > 0: hai nghiệm x = (−b′ ± √Δ′)/a.\n' +
      'Ví dụ x² − 4x + 3 = 0 có b′ = −2, Δ′ = 4 − 3 = 1 nên x = (2 ± 1)/1, tức x = 3 hoặc x = 1.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Quên đổi dấu của b: nếu b = −5 thì −b = 5.\n' +
      '— Tính sai Δ khi c âm: với c = −3 thì −4ac = +12a, không phải −12a.\n' +
      '— Chia thiếu: dưới mẫu phải là 2a (hay a với công thức thu gọn), không phải 2 hay a.\n' +
      '— Với ax² + bx = 0 mà chia cả hai vế cho x thì làm mất nghiệm x = 0.\n' +
      '— Dùng công thức khi chưa đưa phương trình về dạng ax² + bx + c = 0.',
    workedExample: {
      problem: 'Giải các phương trình: a) 2x² − 18 = 0. b) 2x² − 5x − 3 = 0. c) x² − 2x + 5 = 0.',
      steps: [
        'a) Phương trình khuyết b: 2x² = 18, nên x² = 9 và x = 3 hoặc x = −3.',
        'b) Có a = 2, b = −5, c = −3. Δ = (−5)² − 4 · 2 · (−3) = 25 + 24 = 49 > 0, √Δ = 7.',
        'b) x = (5 + 7)/4 = 3 hoặc x = (5 − 7)/4 = −1/2. Thử lại với x = 3: 2 · 9 − 15 − 3 = 0, đúng.',
        'c) Có a = 1, b = −2 (chẵn) nên b′ = −1, c = 5. Δ′ = (−1)² − 1 · 5 = 1 − 5 = −4 < 0.',
        'c) Δ′ < 0 nên phương trình vô nghiệm.',
      ],
      answer: 'a) x = ±3. b) x = 3 hoặc x = −1/2. c) Vô nghiệm.',
    },
    checkQuestions: [
      {
        prompt: 'Biệt thức Δ của phương trình 3x² − 2x + 5 = 0 bằng bao nhiêu (nhập số âm nếu có)?',
        answer: { kind: 'numeric', value: -56 },
        explain:
          'Có a = 3, b = −2, c = 5: Δ = (−2)² − 4 · 3 · 5 = 4 − 60 = −56. Vì Δ < 0 nên phương trình vô nghiệm. ' +
          'Lỗi hay gặp là quên bình phương b (lấy b² = −4) hoặc tính −4ac = +60 thay vì −60.',
      },
      {
        prompt: 'Tập nghiệm của phương trình 3x² − 12x = 0 là gì?',
        choices: [
          { id: 'a', label: '{0; 4}' },
          { id: 'b', label: '{4}' },
          { id: 'c', label: '{0; −4}' },
          { id: 'd', label: '{2; −2}' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Đặt nhân tử chung: 3x(x − 4) = 0, nên x = 0 hoặc x = 4, tập nghiệm {0; 4}. ' +
          'Lỗi hay gặp là chia cả hai vế cho x, mất nghiệm x = 0 và chỉ còn {4} (đáp án b).',
      },
      {
        prompt:
          'Giải phương trình 4x² − 12x + 5 = 0 bằng công thức nghiệm thu gọn. Nghiệm lớn hơn bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 2.5 },
        explain:
          'Có b = −12 nên b′ = −6, Δ′ = 36 − 4 · 5 = 16, √Δ′ = 4. Hai nghiệm x = (6 ± 4)/4, tức x = 2,5 hoặc x = 0,5; nghiệm lớn hơn là 2,5. ' +
          'Lỗi hay gặp là chia cho 2 thay vì chia cho a = 4, hoặc lấy b′ = 6 (quên dấu) nên được hai nghiệm âm.',
      },
      {
        prompt:
          'Khung ảnh hình chữ nhật có chiều dài hơn chiều rộng 2 cm và diện tích 120 cm². Gọi x (cm) là chiều rộng, ta có x² + 2x − 120 = 0. Chiều rộng của khung bằng bao nhiêu xentimét?',
        answer: { kind: 'numeric', value: 10 },
        explain:
          'Có a = 1, b′ = 1, c = −120: Δ′ = 1 + 120 = 121, √Δ′ = 11. Hai nghiệm x = −1 + 11 = 10 hoặc x = −1 − 11 = −12. Chiều rộng phải dương nên chọn x = 10 (cm), khi đó chiều dài 12 cm và 10 · 12 = 120. ' +
          'Lỗi hay gặp là nhận luôn nghiệm âm −12 hoặc nhầm chiều rộng với chiều dài.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phương trình bậc hai một ẩn có dạng nào?',
        dap: 'ax² + bx + c = 0 với a, b, c là số cho trước và a ≠ 0.',
      },
      {
        hoi: 'Công thức nghiệm của phương trình bậc hai?',
        dap: 'Δ = b² − 4ac. Δ < 0: vô nghiệm; Δ = 0: nghiệm kép −b/(2a); Δ > 0: hai nghiệm (−b ± √Δ)/(2a).',
      },
      {
        hoi: 'Công thức nghiệm thu gọn dùng khi nào và có dạng gì?',
        dap: 'Khi b = 2b′: Δ′ = b′² − ac. Δ′ > 0 thì x = (−b′ ± √Δ′)/a; Δ′ = 0 thì nghiệm kép −b′/a; Δ′ < 0 thì vô nghiệm.',
      },
      {
        hoi: 'Cách giải nhanh phương trình khuyết b và khuyết c?',
        dap: 'Khuyết b: x² = −c/a. Khuyết c: đặt nhân tử chung x(ax + b) = 0, nên x = 0 hoặc x = −b/a.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan9-c6-b3',
    grade: '9',
    chapterNumber: 6,
    chapterTitle: 'Hàm số y = ax² (a ≠ 0). Phương trình bậc hai một ẩn',
    lessonNumber: 3,
    title: 'Định lí Viète và giải bài toán bằng cách lập phương trình',
    hook:
      'Một tấm bìa hình chữ nhật có nửa chu vi 14 cm và diện tích 48 cm². Em có thể thử từng cặp số có tổng bằng 14 cho đến khi tích bằng 48, nhưng như vậy rất lâu. ' +
      'Nhà toán học Pháp Viète phát hiện mối liên hệ giữa hai nghiệm của phương trình bậc hai và các hệ số của nó. ' +
      'Nhờ đó, biết tổng và tích của hai số là tìm được hai số đó ngay.',
    theory:
      'ĐỊNH LÍ VIÈTE\n' +
      'Nếu x₁, x₂ là hai nghiệm của phương trình ax² + bx + c = 0 (a ≠ 0) thì\n' +
      '   x₁ + x₂ = −b/a   và   x₁ · x₂ = c/a.\n' +
      'VÌ SAO? Với x₁,₂ = (−b ± √Δ)/(2a), cộng hai nghiệm được −2b/(2a) = −b/a. Nhân hai nghiệm được (b² − Δ)/(4a²) = 4ac/(4a²) = c/a.\n' +
      'Ví dụ 2x² − 5x + 3 = 0 có hai nghiệm 1 và 3/2: tổng 5/2 = −(−5)/2, tích 3/2 = 3/2. Định lí chỉ dùng khi phương trình có nghiệm (Δ ≥ 0).\n\n' +
      'NHẨM NGHIỆM\n' +
      '— Nếu a + b + c = 0 thì phương trình có một nghiệm x₁ = 1, nghiệm kia là x₂ = c/a.\n' +
      '— Nếu a − b + c = 0 thì phương trình có một nghiệm x₁ = −1, nghiệm kia là x₂ = −c/a.\n' +
      'Ví dụ 5x² − 7x + 2 = 0 có 5 − 7 + 2 = 0 nên x = 1 và x = 2/5. Ví dụ 3x² + 8x + 5 = 0 có 3 − 8 + 5 = 0 nên x = −1 và x = −5/3.\n\n' +
      'TÌM HAI SỐ BIẾT TỔNG VÀ TÍCH\n' +
      'Nếu hai số u, v có u + v = S và u · v = P thì u, v là hai nghiệm của phương trình x² − Sx + P = 0 (có nghiệm khi S² − 4P ≥ 0).\n' +
      'Ví dụ S = 14, P = 48: giải x² − 14x + 48 = 0, Δ′ = 49 − 48 = 1 nên x = 7 ± 1, tức hai số là 6 và 8.\n\n' +
      'GIẢI BÀI TOÁN BẰNG CÁCH LẬP PHƯƠNG TRÌNH BẬC HAI\n' +
      'Làm như ở lớp 8: chọn ẩn kèm đơn vị và điều kiện, biểu diễn các đại lượng khác qua ẩn, lập phương trình rồi giải. Phương trình bậc hai có thể có hai nghiệm.\n' +
      'VÌ SAO phải kiểm tra điều kiện? Phương trình là mô hình toán học, còn bài toán thực tế có thể chỉ chấp nhận một nghiệm: độ dài, số người, tuổi phải dương (số người còn phải nguyên). Nghiệm không thỏa điều kiện thì loại và nói rõ lí do.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Viết x₁ + x₂ = b/a (quên dấu trừ).\n' +
      '— Lập phương trình x² + Sx + P = 0, phải là x² − Sx + P = 0.\n' +
      '— Nhầm hai điều kiện nhẩm nghiệm: a + b + c = 0 cho nghiệm 1, a − b + c = 0 cho nghiệm −1.\n' +
      '— Giải xong mà nhận cả nghiệm âm của độ dài, hoặc trả lời không đúng điều đề hỏi.',
    workedExample: {
      problem:
        'a) Không giải phương trình, tính tổng và tích hai nghiệm của 2x² − 5x − 3 = 0. b) Nhẩm nghiệm 4x² − 9x + 5 = 0. ' +
        'c) Mảnh vườn hình chữ nhật có chiều dài hơn chiều rộng 5 m và diện tích 150 m². Tính chiều rộng và chiều dài.',
      steps: [
        'a) Δ = 25 + 24 = 49 > 0 nên phương trình có hai nghiệm. Theo Viète: x₁ + x₂ = −(−5)/2 = 5/2 và x₁ · x₂ = −3/2.',
        'b) Có a + b + c = 4 − 9 + 5 = 0 nên x₁ = 1 và x₂ = c/a = 5/4.',
        'c) Gọi x (m) là chiều rộng, x > 0. Chiều dài là x + 5. Diện tích: x(x + 5) = 150, tức x² + 5x − 150 = 0.',
        'c) Δ = 25 + 600 = 625, √Δ = 25. Nghiệm x = (−5 + 25)/2 = 10 hoặc x = (−5 − 25)/2 = −15.',
        'c) x = −15 không thỏa x > 0 nên bị loại. Chiều rộng 10 m, chiều dài 15 m. Kiểm tra 10 · 15 = 150.',
      ],
      answer: 'a) Tổng 5/2, tích −3/2. b) x = 1 và x = 5/4. c) Rộng 10 m, dài 15 m.',
    },
    checkQuestions: [
      {
        prompt:
          'Phương trình 4x² + 3x − 10 = 0 có hai nghiệm x₁, x₂. Tích x₁ · x₂ bằng bao nhiêu (viết dạng số thập phân, nhập số âm nếu có)?',
        answer: { kind: 'numeric', value: -2.5 },
        explain:
          'Có Δ = 9 + 160 = 169 > 0 nên có hai nghiệm. Theo Viète, tích hai nghiệm là c/a = −10/4 = −2,5. ' +
          'Lỗi hay gặp là nhầm với tổng −b/a = −3/4, hoặc quên dấu âm của c.',
      },
      {
        prompt: 'Nhẩm nghiệm của phương trình 2x² + 7x + 5 = 0. Hai nghiệm là:',
        choices: [
          { id: 'a', label: 'x = 1 và x = 5/2' },
          { id: 'b', label: 'x = −1 và x = 5/2' },
          { id: 'c', label: 'x = 1 và x = −5/2' },
          { id: 'd', label: 'x = −1 và x = −5/2' },
        ],
        answer: { kind: 'choice', correctIds: ['d'] },
        explain:
          'Có a − b + c = 2 − 7 + 5 = 0 nên x₁ = −1 và x₂ = −c/a = −5/2. Kiểm tra x = −5/2: 2 · 6,25 − 17,5 + 5 = 0. ' +
          'Lỗi hay gặp là dùng a + b + c = 14 ≠ 0 để kết luận x = 1 là nghiệm.',
      },
      {
        prompt:
          'Hai số có tổng bằng 11 và tích bằng 28. Số lớn hơn trong hai số đó bằng bao nhiêu?',
        answer: { kind: 'numeric', value: 7 },
        explain:
          'Hai số là nghiệm của x² − 11x + 28 = 0. Có Δ = 121 − 112 = 9 nên x = (11 ± 3)/2, tức x = 7 hoặc x = 4. Số lớn hơn là 7 (7 + 4 = 11 và 7 · 4 = 28). ' +
          'Lỗi hay gặp là lập phương trình x² + 11x + 28 = 0 (sai dấu của S) nên ra hai nghiệm âm.',
      },
      {
        prompt:
          'Sân trường có dạng hình chữ nhật với chiều dài hơn chiều rộng 6 m và diện tích 135 m². Chiều dài của sân bằng bao nhiêu mét?',
        answer: { kind: 'numeric', value: 15 },
        explain:
          'Gọi x (m) là chiều rộng, x > 0, ta có x(x + 6) = 135 hay x² + 6x − 135 = 0. Δ′ = 9 + 135 = 144 nên x = −3 ± 12, tức x = 9 hoặc x = −15 (loại vì âm). Chiều rộng 9 m nên chiều dài 9 + 6 = 15 m. ' +
          'Lỗi hay gặp là dừng ở chiều rộng 9 m hoặc nhận nghiệm âm.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phát biểu định lí Viète cho ax² + bx + c = 0 (a ≠ 0)?',
        dap: 'Nếu x₁, x₂ là hai nghiệm thì x₁ + x₂ = −b/a và x₁ · x₂ = c/a.',
      },
      {
        hoi: 'Khi nào nhẩm được nghiệm x = 1 và nghiệm x = −1?',
        dap: 'a + b + c = 0 thì x₁ = 1, x₂ = c/a. a − b + c = 0 thì x₁ = −1, x₂ = −c/a.',
      },
      {
        hoi: 'Tìm hai số biết tổng S và tích P thế nào?',
        dap: 'Hai số là nghiệm của x² − Sx + P = 0 (cần S² − 4P ≥ 0).',
      },
      {
        hoi: 'Sau khi giải phương trình lập từ bài toán thực tế phải làm gì?',
        dap: 'Đối chiếu nghiệm với điều kiện của ẩn (dương, nguyên…), loại nghiệm không thỏa, rồi trả lời đúng điều đề hỏi.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
