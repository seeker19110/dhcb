// lessons/toan6c1.ts — Toán 6, Chương 1: Tập hợp các số tự nhiên.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN6_C1_LESSONS: MathLesson[] = [
  {
    id: 'toan6-c1-b1',
    grade: '6',
    chapterNumber: 1,
    chapterTitle: 'Tập hợp các số tự nhiên',
    lessonNumber: 1,
    title: 'Tập hợp và cách ghi số tự nhiên',
    hook:
      'Sáng thứ Hai, cả trường xếp hàng chào cờ. Cô tổng phụ trách gọi: "Các bạn lớp 6A ra sân trước!" ' +
      'Nghe vậy, đúng những bạn lớp 6A bước ra, không ai thắc mắc bạn nào thuộc nhóm, bạn nào không. ' +
      'Một nhóm đối tượng được xác định rõ như thế chính là một "tập hợp". Hôm nay em sẽ học cách viết tập hợp bằng kí hiệu ' +
      'và cách ghi các số tự nhiên, từ số 7 nhỏ xíu đến số 1 250 000 đồng của một chuyến xe đi du lịch.',
    theory:
      'TẬP HỢP VÀ PHẦN TỬ\n' +
      'Tập hợp là một nhóm đối tượng xác định rõ: nhìn vào một đối tượng, ta luôn biết nó có thuộc nhóm hay không. ' +
      'Mỗi đối tượng trong tập hợp gọi là một phần tử. Ta đặt tên tập hợp bằng chữ in hoa: A, B, C…\n' +
      '— Kí hiệu a ∈ A đọc là "a thuộc A" (a là phần tử của A).\n' +
      '— Kí hiệu b ∉ A đọc là "b không thuộc A".\n' +
      'Ví dụ: A = {2; 4; 6; 8} thì 4 ∈ A còn 5 ∉ A.\n\n' +
      'HAI CÁCH CHO MỘT TẬP HỢP\n' +
      '1) Liệt kê các phần tử: viết trong dấu ngoặc nhọn, ngăn cách bằng dấu chấm phẩy. Dùng dấu chấm phẩy ' +
      'để không lẫn với dấu phẩy thập phân (ví dụ 2,5). Mỗi phần tử chỉ viết một lần, thứ tự tuỳ ý.\n' +
      '2) Nêu tính chất đặc trưng: B = {x ∈ ℕ | x chẵn, x < 10} (đọc là "x thuộc ℕ sao cho ...") nghĩa là B gồm các số tự nhiên x có tính chất "x chẵn và ' +
      'nhỏ hơn 10". Khi đó B = {0; 2; 4; 6; 8}.\n\n' +
      'TẬP HỢP CÁC SỐ TỰ NHIÊN\n' +
      'ℕ = {0; 1; 2; 3; …} là tập hợp các số tự nhiên. ℕ* = {1; 2; 3; …} là tập hợp các số tự nhiên khác 0. ' +
      'Điểm khác nhau duy nhất là số 0: có trong ℕ, không có trong ℕ*.\n\n' +
      'THỨ TỰ TRONG TẬP HỢP ℕ\n' +
      'Trên tia số, số nằm bên trái bé hơn số nằm bên phải. Viết a < b (hoặc b > a); a ≤ b nghĩa là a < b hoặc a = b. ' +
      'Mỗi số tự nhiên có đúng một số liền sau (hơn nó 1 đơn vị). Số 0 là số nhỏ nhất và không có số liền trước. ' +
      'Không có số tự nhiên lớn nhất vì thêm 1 vào số nào cũng được số lớn hơn.\n\n' +
      'HỆ THẬP PHÂN\n' +
      'Ta dùng 10 chữ số 0, 1, 2, …, 9 để ghi mọi số tự nhiên. Giá trị của chữ số phụ thuộc VỊ TRÍ của nó: cùng chữ số 5 ' +
      'nhưng trong 5 là năm đơn vị, trong 50 là năm chục. Mười đơn vị ở một hàng bằng một đơn vị ở hàng liền trước nó. ' +
      'Ví dụ 4 072 = 4·1 000 + 0·100 + 7·10 + 2. Số có nhiều chữ số thường viết tách nhóm ba chữ số cho dễ đọc: 1 250 000. ' +
      'Chú ý phân biệt "chữ số" (một kí hiệu) với "số" (có thể gồm nhiều chữ số): số 4 072 có bốn chữ số.\n\n' +
      'SỐ LA MÃ\n' +
      'Dùng các kí hiệu I = 1, V = 5, X = 10. Chữ số nhỏ viết bên PHẢI chữ số lớn thì CỘNG: VI = 5 + 1 = 6, XI = 11. ' +
      'Chữ số nhỏ viết bên TRÁI chữ số lớn thì TRỪ: IV = 5 − 1 = 4, IX = 10 − 1 = 9. Không viết một kí hiệu quá ba lần liền ' +
      'nhau: 3 viết là III, còn 4 phải viết là IV. Ví dụ XXIV = 20 + 4 = 24, XXIX = 20 + 9 = 29.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Quên rằng số 0 thuộc ℕ nhưng không thuộc ℕ*.\n' +
      '— Đếm sai số phần tử của "các số lớn hơn 5 và nhỏ hơn 12": phải loại cả hai đầu mút, được 6, 7, 8, 9, 10, 11 (6 số).\n' +
      '— Đọc IX là 11. Đúng ra chữ I đứng TRƯỚC X nên trừ, IX = 9.\n' +
      '— Nhầm "chữ số" với "số" khi đếm số chữ số của một số.',
    workedExample: {
      problem:
        'Cho tập hợp A gồm các số tự nhiên lớn hơn 3 và không vượt quá 8. ' +
        'a) Viết A bằng cách liệt kê các phần tử và cho biết A có bao nhiêu phần tử. ' +
        'b) Điền kí hiệu ∈ hoặc ∉ vào chỗ trống: 3 … A; 8 … A. ' +
        'c) Viết số 4 072 thành tổng giá trị các chữ số của nó.',
      steps: [
        '"Lớn hơn 3" nghĩa là bắt đầu từ 4 (không lấy 3). "Không vượt quá 8" nghĩa là được lấy cả 8. Vậy A = {4; 5; 6; 7; 8}.',
        'Đếm các phần tử: 4, 5, 6, 7, 8 là 5 phần tử.',
        'Số 3 không lớn hơn 3 nên không phải phần tử của A, viết 3 ∉ A. Số 8 thoả "không vượt quá 8" nên 8 ∈ A.',
        'Số 4 072 có chữ số hàng nghìn là 4, hàng trăm là 0, hàng chục là 7, hàng đơn vị là 2.',
        'Do đó 4 072 = 4·1 000 + 0·100 + 7·10 + 2.',
      ],
      answer:
        'a) A = {4; 5; 6; 7; 8}, có 5 phần tử. b) 3 ∉ A; 8 ∈ A. c) 4 072 = 4·1 000 + 0·100 + 7·10 + 2.',
    },
    checkQuestions: [
      {
        prompt: 'Cho tập hợp M = {2; 4; 6; 8}. Khẳng định nào sau đây đúng?',
        choices: [
          { id: 'a', label: '4 ∉ M' },
          { id: 'b', label: '6 ∈ M' },
          { id: 'c', label: '5 ∈ M' },
          { id: 'd', label: '8 ∉ M' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Số 6 nằm trong danh sách các phần tử của M nên 6 ∈ M. Các lựa chọn còn lại sai vì 4 và 8 đều là phần tử của M, còn 5 thì không có. Lỗi hay gặp là đọc nhầm ∈ (thuộc) thành ∉ (không thuộc).',
      },
      {
        prompt: 'Tập hợp các số tự nhiên lớn hơn 5 và nhỏ hơn 12 có bao nhiêu phần tử?',
        answer: { kind: 'numeric', value: 6 },
        explain:
          'Các số đó là 6, 7, 8, 9, 10, 11, tức 6 số. Không được lấy 5 và 12 vì đề bài nói "lớn hơn" và "nhỏ hơn", không có dấu bằng. Lỗi hay gặp là tính 12 − 5 = 7 mà quên loại bớt đầu mút.',
      },
      {
        prompt:
          'Bạn Lan ghi lại tiền tiêu vặt trong tuần gồm: 3 chục nghìn, 4 nghìn, 0 trăm, 5 chục và 0 đơn vị (đơn vị đồng). Số tiền đó là bao nhiêu đồng? (Nhập số không có dấu cách.)',
        answer: { kind: 'numeric', value: 34050 },
        explain:
          'Ta có 30 000 + 4 000 + 0 + 50 + 0 = 34 050. Giá trị mỗi chữ số phụ thuộc vị trí hàng của nó, nên hàng trăm là 0 vẫn phải được giữ chỗ. Lỗi hay gặp là bỏ chữ số 0 và viết thành 3 4 5 (hoặc 345).',
      },
      {
        prompt: 'Số La Mã XXIV có giá trị bằng bao nhiêu?',
        choices: [
          { id: 'a', label: '14' },
          { id: 'b', label: '24' },
          { id: 'c', label: '26' },
          { id: 'd', label: '16' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'XX = 20 và IV = 4 (chữ I đứng trước V nên trừ: 5 − 1), vậy XXIV = 20 + 4 = 24. Lỗi hay gặp là đọc IV như 5 + 1 = 6 nên ra 26.',
      },
    ],
    srsCards: [
      {
        hoi: 'Kí hiệu ∈ và ∉ đọc và dùng thế nào?',
        dap: '∈ đọc là "thuộc", ∉ đọc là "không thuộc". Ví dụ 3 ∈ {1; 2; 3} còn 5 ∉ {1; 2; 3}.',
      },
      {
        hoi: 'ℕ và ℕ* khác nhau ở đâu?',
        dap: 'ℕ = {0; 1; 2; 3; …} có số 0. ℕ* = {1; 2; 3; …} là các số tự nhiên khác 0.',
      },
      {
        hoi: 'Quy tắc đọc số La Mã IV, IX, VI, XI?',
        dap: 'Chữ nhỏ đứng trước chữ lớn thì trừ: IV = 4, IX = 9. Chữ nhỏ đứng sau thì cộng: VI = 6, XI = 11.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan6-c1-b2',
    grade: '6',
    chapterNumber: 1,
    chapterTitle: 'Tập hợp các số tự nhiên',
    lessonNumber: 2,
    title: 'Phép cộng, phép trừ, phép nhân và phép chia số tự nhiên',
    hook:
      'Mẹ nhờ em ra tạp hoá mua 4 gói bánh, mỗi gói 15 000 đồng. Thay vì nhân 4 với 15 000, em nhẩm: ' +
      '4 gói, mỗi gói 10 nghìn là 40 nghìn, mỗi gói thêm 5 nghìn là 20 nghìn, cộng lại 60 nghìn đồng. ' +
      'Em vừa dùng tính chất phân phối của phép nhân mà không hề biết tên của nó. ' +
      'Bài này giúp em biết vì sao cách nhẩm đó luôn đúng và dùng nó để tính nhanh.',
    theory:
      'BỐN PHÉP TÍNH TRONG ℕ\n' +
      '— Phép cộng: a + b = c (a, b là số hạng, c là tổng).\n' +
      '— Phép trừ: a − b = c (a là số bị trừ, b là số trừ, c là hiệu). Trong ℕ chỉ trừ được khi a ≥ b, vì ℕ chưa có số âm.\n' +
      '— Phép nhân: a · b = c (a, b là thừa số, c là tích).\n' +
      '— Phép chia: a : b = q khi a = b · q, với b ≠ 0.\n\n' +
      'TÍNH CHẤT CỦA PHÉP CỘNG VÀ PHÉP NHÂN\n' +
      '— Giao hoán: a + b = b + a; a · b = b · a (đổi chỗ không đổi kết quả).\n' +
      '— Kết hợp: (a + b) + c = a + (b + c); (a · b) · c = a · (b · c) (nhóm lại tuỳ ý).\n' +
      '— Cộng với 0: a + 0 = a. Nhân với 1: a · 1 = a. Nhân với 0: a · 0 = 0.\n' +
      '— Phân phối của phép nhân đối với phép cộng: a · (b + c) = a · b + a · c. ' +
      'Với phép trừ cũng đúng khi b ≥ c: a · (b − c) = a · b − a · c.\n' +
      'VÌ SAO phân phối đúng? a · (b + c) là a nhóm, mỗi nhóm có b + c vật. Tách mỗi nhóm thành hai phần thì có a · b vật ở ' +
      'phần đầu và a · c vật ở phần sau. Dùng tính chất này theo CẢ HAI chiều để tính nhanh: ' +
      '87 · 36 + 87 · 64 = 87 · (36 + 64) = 87 · 100 = 8 700.\n' +
      'Mẹo tính nhanh: gom các số "đẹp" lại bằng giao hoán và kết hợp, ví dụ 25 · 37 · 4 = (25 · 4) · 37 = 100 · 37 = 3 700.\n\n' +
      'PHÉP CHIA HẾT VÀ PHÉP CHIA CÓ DƯ\n' +
      'Cho a, b ∈ ℕ, b ≠ 0. Luôn tìm được duy nhất hai số q, r sao cho a = b · q + r với 0 ≤ r < b. ' +
      'Gọi q là thương, r là số dư. Nếu r = 0 thì đó là phép chia hết. ' +
      'Ví dụ 47 : 5 = 9 dư 2, vì 47 = 5 · 9 + 2.\n' +
      'VÌ SAO phải có r < b? Nếu số dư còn lớn hơn hoặc bằng số chia thì vẫn chia thêm được một nhóm nữa, ' +
      'nên phép chia chưa xong. Với số chia là 7, số dư chỉ có thể là 0, 1, 2, 3, 4, 5 hoặc 6.\n' +
      'Không có phép chia cho 0, vì không có số q nào để 0 · q bằng một số khác 0.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Phân phối thiếu: viết a · (b + c) = a · b + c (quên nhân a với c).\n' +
      '— Cho số dư lớn hơn hoặc bằng số chia, ví dụ 47 : 5 = 8 dư 7.\n' +
      '— Thực hiện 5 − 8 trong ℕ, trong khi số bị trừ nhỏ hơn số trừ.\n' +
      '— Tưởng phép trừ cũng có tính chất kết hợp: 10 − 5 − 2 = 3 nhưng 10 − (5 − 2) = 7.',
    workedExample: {
      problem:
        'a) Tính nhanh 87 · 36 + 87 · 64. ' +
        'b) Lớp 6A có 43 học sinh, mỗi bàn ngồi được 4 bạn. Cần ít nhất bao nhiêu bàn để tất cả đều có chỗ ngồi?',
      steps: [
        'Phần a): hai số hạng đều có thừa số chung 87 nên dùng tính chất phân phối theo chiều ngược lại.',
        '87 · 36 + 87 · 64 = 87 · (36 + 64) = 87 · 100 = 8 700.',
        'Phần b): chia 43 cho 4. Ta có 43 = 4 · 10 + 3, nghĩa là xếp được 10 bàn đầy và còn dư 3 bạn.',
        'Số dư là 3 bạn nên phải thêm 1 bàn nữa cho các bạn đó. Tổng số bàn là 10 + 1 = 11.',
      ],
      answer: 'a) 8 700. b) 11 bàn.',
    },
    checkQuestions: [
      {
        prompt: 'Tính nhanh: 25 · 13 · 4.',
        answer: { kind: 'numeric', value: 1300 },
        explain:
          'Dùng giao hoán và kết hợp để gom 25 · 4 = 100, rồi 100 · 13 = 1 300. Nhân lần lượt từ trái sang phải cũng ra kết quả đúng nhưng dễ sai hơn; lỗi hay gặp là không nhận ra cặp số "đẹp" 25 và 4.',
      },
      {
        prompt: 'Chia 158 cho 12 được thương là 13. Số dư của phép chia này là bao nhiêu?',
        answer: { kind: 'numeric', value: 2 },
        explain:
          'Ta có 12 · 13 = 156 nên 158 = 12 · 13 + 2, số dư là 2 (nhỏ hơn số chia 12, hợp lệ). Lỗi hay gặp là lấy 158 − 12 = 146 thay vì trừ đi tích 12 · 13.',
      },
      {
        prompt: 'Trong phép chia một số tự nhiên cho 7, số dư nào sau đây KHÔNG thể xảy ra?',
        choices: [
          { id: 'a', label: '0' },
          { id: 'b', label: '3' },
          { id: 'c', label: '6' },
          { id: 'd', label: '7' },
        ],
        answer: { kind: 'choice', correctIds: ['d'] },
        explain:
          'Số dư luôn nhỏ hơn số chia, nên chia cho 7 thì dư chỉ từ 0 đến 6. Nếu dư 7 thì còn chia thêm được một nhóm 7 nữa. Lỗi hay gặp là cho phép số dư bằng số chia.',
      },
      {
        prompt:
          'Em mua 6 quyển vở, mỗi quyển 8 500 đồng và 6 cây bút, mỗi cây 3 500 đồng. Dùng tính chất phân phối 6 · (8 500 + 3 500), tổng số tiền em phải trả là bao nhiêu đồng?',
        answer: { kind: 'numeric', value: 72000 },
        explain:
          'Mỗi bộ gồm một vở và một bút giá 8 500 + 3 500 = 12 000 đồng, nên 6 bộ giá 6 · 12 000 = 72 000 đồng. Lỗi hay gặp là chỉ nhân 6 với một số hạng và quên số hạng còn lại.',
      },
    ],
    srsCards: [
      {
        hoi: 'Viết công thức của phép chia có dư.',
        dap: 'a = b · q + r, với 0 ≤ r < b và b ≠ 0. Nếu r = 0 thì là phép chia hết.',
      },
      {
        hoi: 'Tính chất phân phối của phép nhân đối với phép cộng là gì?',
        dap: 'a · (b + c) = a · b + a · c. Dùng cả hai chiều để tính nhanh, ví dụ 87 · 36 + 87 · 64 = 87 · 100.',
      },
      {
        hoi: 'Khi nào thực hiện được phép trừ a − b trong ℕ?',
        dap: 'Khi a ≥ b, vì tập số tự nhiên không có số âm.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan6-c1-b3',
    grade: '6',
    chapterNumber: 1,
    chapterTitle: 'Tập hợp các số tự nhiên',
    lessonNumber: 3,
    title: 'Luỹ thừa với số mũ tự nhiên và thứ tự thực hiện phép tính',
    hook:
      'Cô giáo thử tài cả lớp: "Một tờ giấy gấp đôi liên tiếp, mỗi lần gấp số lớp giấy tăng gấp đôi. ' +
      'Gấp 10 lần thì có bao nhiêu lớp?" Sau lần 1 có 2 lớp, lần 2 có 4 lớp, lần 3 có 8 lớp… và lần thứ 10 là 1 024 lớp, ' +
      'dày hơn cả một quyển sách! Viết 2 · 2 · 2 · … mười lần rất dài, nên người ta có cách viết gọn gọi là luỹ thừa.',
    theory:
      'LUỸ THỪA VỚI SỐ MŨ TỰ NHIÊN\n' +
      'aⁿ = a · a · … · a (n thừa số a), với n ∈ ℕ*. Ta gọi a là cơ số, n là số mũ. Quy ước a¹ = a. ' +
      'Đọc a² là "a bình phương", a³ là "a lập phương". Ví dụ 2⁵ = 2 · 2 · 2 · 2 · 2 = 32; 10³ = 1 000 ' +
      '(số mũ chính là số chữ số 0 đứng sau chữ số 1).\n' +
      'VÌ SAO cần luỹ thừa? Nhân là cách viết gọn của cộng lặp (5 + 5 + 5 = 3 · 5), còn luỹ thừa là cách viết gọn của NHÂN lặp.\n\n' +
      'NHÂN VÀ CHIA HAI LUỸ THỪA CÙNG CƠ SỐ\n' +
      '— Nhân: aᵐ · aⁿ = aᵐ⁺ⁿ (giữ cơ số, cộng số mũ).\n' +
      '— Chia: aᵐ : aⁿ = aᵐ⁻ⁿ (a ≠ 0, m ≥ n; giữ cơ số, trừ số mũ).\n' +
      'VÌ SAO? Cứ đếm số thừa số: 2³ · 2² = (2 · 2 · 2) · (2 · 2) = 2⁵ và 3 + 2 = 5. ' +
      'Phép chia thì rút gọn bớt thừa số ở cả hai phía: 2⁵ : 2² = (2 · 2 · 2 · 2 · 2) : (2 · 2) = 2³.\n' +
      'Quy ước a⁰ = 1 (a ≠ 0). Lý do: aᵐ : aᵐ = 1 (số nào chia cho chính nó cũng bằng 1) và theo quy tắc chia thì ' +
      'aᵐ : aᵐ = aᵐ⁻ᵐ = a⁰. Vậy a⁰ phải bằng 1.\n\n' +
      'THỨ TỰ THỰC HIỆN CÁC PHÉP TÍNH\n' +
      '— Biểu thức không có dấu ngoặc: luỹ thừa trước, rồi nhân và chia (từ trái sang phải), cuối cùng cộng và trừ ' +
      '(từ trái sang phải).\n' +
      '— Biểu thức có dấu ngoặc: làm trong ngoặc tròn ( ) trước, rồi đến ngoặc vuông [ ], cuối cùng là ngoặc nhọn { }.\n' +
      'Ví dụ: 2 + 3 · 4² = 2 + 3 · 16 = 2 + 48 = 50. Nhân đứng trước cộng vì nhân là cộng lặp, "mạnh" hơn cộng; ' +
      'luỹ thừa là nhân lặp nên còn "mạnh" hơn nữa.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Hiểu 2³ = 2 · 3 = 6. Đúng là 2³ = 2 · 2 · 2 = 8.\n' +
      '— Nhân hai luỹ thừa mà nhân luôn số mũ: 3² · 3³ = 3⁶ (sai). Phải CỘNG số mũ: 3² · 3³ = 3⁵.\n' +
      '— Nhân cả cơ số: 3² · 3³ = 9⁵ (sai). Cơ số được GIỮ NGUYÊN.\n' +
      '— Cho rằng 5⁰ = 0. Đúng là 5⁰ = 1.\n' +
      '— Tính 2 + 3 · 4 = 20 vì cộng trước. Phải nhân trước: 2 + 12 = 14.\n' +
      '— Chia trước nhân sau một cách tuỳ tiện: 24 : 4 · 3 phải làm từ trái sang phải, 24 : 4 = 6 rồi 6 · 3 = 18.',
    workedExample: {
      problem: 'Tính giá trị biểu thức 3 · (5² − 2³) + 20 : 2².',
      steps: [
        'Có dấu ngoặc, nên tính trong ngoặc trước. Trong ngoặc, làm luỹ thừa trước: 5² = 25 và 2³ = 8.',
        'Trong ngoặc: 25 − 8 = 17.',
        'Ngoài ngoặc, tính luỹ thừa 2² = 4.',
        'Nhân và chia: 3 · 17 = 51 và 20 : 4 = 5.',
        'Cuối cùng cộng: 51 + 5 = 56.',
      ],
      answer: '56',
    },
    checkQuestions: [
      {
        prompt: 'Tính 2⁴ · 2³ : 2⁵ (nhập kết quả là một số).',
        answer: { kind: 'numeric', value: 4 },
        explain:
          'Nhân hai luỹ thừa cùng cơ số thì cộng số mũ: 2⁴ · 2³ = 2⁷. Rồi chia cho 2⁵ thì trừ số mũ: 2⁷ : 2⁵ = 2² = 4. Lỗi hay gặp là nhân các số mũ (4 · 3) thay vì cộng.',
      },
      {
        prompt: 'Giá trị của 3⁴ là bao nhiêu?',
        choices: [
          { id: 'a', label: '12' },
          { id: 'b', label: '64' },
          { id: 'c', label: '81' },
          { id: 'd', label: '7' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          '3⁴ = 3 · 3 · 3 · 3 = 9 · 9 = 81. Lỗi hay gặp là nhân cơ số với số mũ (3 · 4 = 12) hoặc nhầm với 4³ = 64.',
      },
      {
        prompt: 'Tính giá trị biểu thức 48 : 6 + 2 · 3².',
        answer: { kind: 'numeric', value: 26 },
        explain:
          'Làm luỹ thừa trước: 3² = 9. Rồi nhân và chia: 48 : 6 = 8 và 2 · 9 = 18. Cuối cùng cộng: 8 + 18 = 26. Lỗi hay gặp là tính 2 · 3 = 6 trước rồi mới bình phương.',
      },
      {
        prompt:
          'Một tờ giấy được gấp đôi 6 lần liên tiếp, mỗi lần gấp số lớp giấy tăng gấp đôi. Sau 6 lần gấp, tờ giấy có bao nhiêu lớp?',
        answer: { kind: 'numeric', value: 64 },
        explain:
          'Mỗi lần gấp nhân số lớp với 2, nên sau 6 lần có 2⁶ = 2 · 2 · 2 · 2 · 2 · 2 = 64 lớp. Lỗi hay gặp là tính 2 · 6 = 12 (coi như cộng lặp, không phải nhân lặp).',
      },
    ],
    srsCards: [
      {
        hoi: 'Công thức nhân và chia hai luỹ thừa cùng cơ số?',
        dap: 'aᵐ · aⁿ = aᵐ⁺ⁿ và aᵐ : aⁿ = aᵐ⁻ⁿ (a ≠ 0, m ≥ n). Giữ nguyên cơ số, cộng hoặc trừ số mũ.',
      },
      {
        hoi: 'a⁰ bằng bao nhiêu và vì sao?',
        dap: 'a⁰ = 1 với a ≠ 0, vì aᵐ : aᵐ = 1 và theo quy tắc chia cũng bằng aᵐ⁻ᵐ = a⁰.',
      },
      {
        hoi: 'Thứ tự thực hiện phép tính trong biểu thức không có ngoặc?',
        dap: 'Luỹ thừa, rồi nhân và chia (từ trái sang phải), rồi cộng và trừ (từ trái sang phải).',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
