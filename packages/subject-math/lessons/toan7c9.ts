// lessons/toan7c9.ts — Toán 7, Chương 9: Quan hệ giữa các yếu tố trong một tam giác.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN7_C9_LESSONS: MathLesson[] = [
  {
    id: 'toan7-c9-b1',
    grade: '7',
    chapterNumber: 9,
    chapterTitle: 'Quan hệ giữa các yếu tố trong một tam giác',
    lessonNumber: 1,
    title: 'Quan hệ giữa góc và cạnh đối diện, bất đẳng thức tam giác',
    hook:
      'Bạn có ba thanh nẹp dài 2 dm, 3 dm và 6 dm. Thử ghép chúng thành một khung tam giác: hai thanh ngắn dù xoay thế nào cũng không với tới nhau qua thanh dài nhất. ' +
      'Ngược lại, khi khung đã ghép được, thanh nằm đối diện góc lớn nhất cũng là thanh dài nhất. ' +
      'Bài này nêu hai quy tắc giúp bạn biết ba đoạn thẳng có ghép được tam giác không và so sánh cạnh qua góc.',
    theory:
      'QUAN HỆ GIỮA GÓC VÀ CẠNH ĐỐI DIỆN\n' +
      'Trong một tam giác:\n' +
      '— Đối diện với góc lớn hơn là cạnh lớn hơn.\n' +
      '— Đối diện với cạnh lớn hơn là góc lớn hơn.\n' +
      'Nói gọn: góc càng lớn thì cạnh đối diện càng dài, và ngược lại. Hệ quả: tam giác vuông có cạnh huyền (đối diện góc vuông) là cạnh dài nhất; tam giác tù có cạnh đối diện góc tù là cạnh dài nhất; ' +
      'tam giác có hai góc bằng nhau thì hai cạnh đối diện bằng nhau (tam giác cân).\n' +
      'Vì sao? Cạnh là “khẩu độ” của góc đối diện: góc mở càng rộng thì hai đầu mút của cạnh càng xa nhau.\n\n' +
      'BẤT ĐẲNG THỨC TAM GIÁC\n' +
      'Trong một tam giác, tổng độ dài hai cạnh bất kỳ luôn lớn hơn độ dài cạnh còn lại: AB + AC > BC, AB + BC > AC, AC + BC > AB. ' +
      'Suy ra hiệu hai cạnh nhỏ hơn cạnh thứ ba. Với hai cạnh b và c, cạnh thứ ba a phải thoả mãn |b − c| < a < b + c.\n' +
      'Vì sao? Đi thẳng từ B đến C luôn ngắn hơn đi vòng qua A (B đến A rồi A đến C), trừ khi A nằm trên đoạn BC.\n\n' +
      'CÁCH KIỂM TRA BA ĐỘ DÀI CÓ TẠO THÀNH TAM GIÁC\n' +
      'Chỉ cần kiểm tra: tổng hai số NHỎ hơn có lớn hơn số lớn nhất không. Nếu lớn hơn thì ghép được tam giác, nếu bằng hoặc nhỏ hơn thì không.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Dùng dấu ≥ thay vì >: nếu tổng hai cạnh bằng cạnh thứ ba thì ba điểm thẳng hàng, không tạo thành tam giác.\n' +
      '— So sánh cạnh với góc KỀ nó thay vì góc ĐỐI DIỆN.\n' +
      '— Khi bài cho tam giác cân với hai cạnh khác nhau, quên thử cả hai khả năng rồi kiểm tra bất đẳng thức tam giác.',
    workedExample: {
      problem:
        'a) Tam giác ABC có ∠A = 70° và ∠B = 50°. Hãy so sánh ba cạnh. b) Tam giác có hai cạnh dài 3 cm và 8 cm, cạnh thứ ba x (cm) là số nguyên. Tìm các giá trị có thể của x.',
      steps: [
        'a) ∠C = 180° − 70° − 50° = 60°. Ba góc theo thứ tự tăng dần: ∠B = 50° < ∠C = 60° < ∠A = 70°.',
        'Cạnh đối diện ∠B là AC, đối diện ∠C là AB, đối diện ∠A là BC. Vì góc lớn hơn thì cạnh đối diện lớn hơn nên AC < AB < BC.',
        'b) Theo bất đẳng thức tam giác: 8 − 3 < x < 8 + 3, tức là 5 < x < 11.',
        'x là số nguyên nên x ∈ {6; 7; 8; 9; 10}.',
      ],
      answer: 'a) AC < AB < BC. b) x ∈ {6; 7; 8; 9; 10}.',
    },
    checkQuestions: [
      {
        prompt:
          'Bác thợ có hai thanh gỗ dài 5 dm và 7 dm, muốn ghép thanh thứ ba có độ dài là số nguyên dm để được khung tam giác. Thanh thứ ba dài nhất có thể là bao nhiêu dm?',
        answer: { kind: 'numeric', value: 11 },
        explain:
          'Thanh thứ ba phải nhỏ hơn tổng hai thanh: x < 5 + 7 = 12, mà x nguyên nên lớn nhất là 11 dm. Lỗi hay gặp là chọn 12 dm vì dùng dấu ≤; khi đó ba thanh thẳng hàng, không tạo khung tam giác.',
      },
      {
        prompt: 'Bộ ba độ dài nào có thể là ba cạnh của một tam giác?',
        choices: [
          { id: 'a', label: '2 cm, 3 cm, 5 cm' },
          { id: 'b', label: '4 cm, 5 cm, 10 cm' },
          { id: 'c', label: '6 cm, 8 cm, 9 cm' },
          { id: 'd', label: '1 cm, 2 cm, 4 cm' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Chỉ bộ 6; 8; 9 thoả 6 + 8 = 14 > 9. Các bộ còn lại có tổng hai cạnh nhỏ không lớn hơn cạnh lớn nhất (2 + 3 = 5, 4 + 5 = 9 < 10, 1 + 2 = 3 < 4). Lỗi hay gặp là chọn bộ có tổng hai cạnh bằng cạnh thứ ba.',
      },
      {
        prompt: 'Tam giác ABC có ∠A = 80° và ∠B = 60°. Cạnh nào là cạnh ngắn nhất?',
        choices: [
          { id: 'a', label: 'Cạnh AB' },
          { id: 'b', label: 'Cạnh BC' },
          { id: 'c', label: 'Cạnh AC' },
          { id: 'd', label: 'Ba cạnh bằng nhau' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Ta có ∠C = 180° − 80° − 60° = 40° là góc nhỏ nhất, nên cạnh đối diện nó là AB ngắn nhất. Lỗi hay gặp là chọn cạnh kề góc nhỏ nhất thay vì cạnh đối diện.',
      },
      {
        prompt:
          'Khung kèo hình tam giác cân có hai cạnh dài 4 dm và 9 dm. Tính chu vi khung (đơn vị dm).',
        answer: { kind: 'numeric', value: 22 },
        explain:
          'Tam giác cân có hai cạnh bằng nhau: nếu cạnh bên 4 thì 4 + 4 = 8 < 9 vi phạm bất đẳng thức tam giác, nên cạnh bên là 9, ba cạnh 9; 9; 4 và chu vi 22 dm. Lỗi hay gặp là đáp 17 dm vì không thử khả năng cạnh bên bằng 9.',
      },
    ],
    srsCards: [
      {
        hoi: 'Quan hệ giữa góc và cạnh đối diện trong một tam giác?',
        dap: 'Góc lớn hơn thì cạnh đối diện lớn hơn, và ngược lại.',
      },
      {
        hoi: 'Bất đẳng thức tam giác?',
        dap: 'Tổng hai cạnh bất kỳ lớn hơn cạnh thứ ba; hiệu hai cạnh nhỏ hơn cạnh thứ ba: |b − c| < a < b + c.',
      },
      {
        hoi: 'Cạnh nào dài nhất trong tam giác vuông?',
        dap: 'Cạnh huyền, vì nó đối diện góc vuông là góc lớn nhất.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan7-c9-b2',
    grade: '7',
    chapterNumber: 9,
    chapterTitle: 'Quan hệ giữa các yếu tố trong một tam giác',
    lessonNumber: 2,
    title: 'Quan hệ giữa đường vuông góc và đường xiên',
    hook:
      'Bạn đứng bên bờ sông thẳng và muốn bơi sang bờ bên kia thật nhanh. Bơi chéo hay bơi thẳng vuông góc với bờ thì quãng đường ngắn hơn? ' +
      'Người đi bộ cắt qua bãi cỏ cũng hay đi thẳng ngang để đỡ mất công. ' +
      'Bài này chứng minh điều đó: đường vuông góc là đường ngắn nhất, và dùng nó để định nghĩa “khoảng cách” từ một điểm đến một đường thẳng.',
    theory:
      'ĐƯỜNG VUÔNG GÓC VÀ ĐƯỜNG XIÊN\n' +
      'Cho đường thẳng d và điểm A không nằm trên d. Kẻ AH vuông góc với d tại H (H thuộc d). Đoạn AH gọi là đường vuông góc kẻ từ A đến d, điểm H là chân đường vuông góc. ' +
      'Lấy B là điểm bất kỳ trên d (B khác H); đoạn AB gọi là một đường xiên kẻ từ A đến d, còn đoạn HB là hình chiếu của đường xiên AB trên d.\n\n' +
      'ĐỊNH LÍ: ĐƯỜNG VUÔNG GÓC NGẮN HƠN MỌI ĐƯỜNG XIÊN\n' +
      'Trong tất cả các đoạn thẳng kẻ từ A đến d, đường vuông góc AH là ngắn nhất: AH < AB với mọi B thuộc d, B khác H.\n' +
      'Chứng minh: tam giác AHB có ∠H = 90°. Hai góc còn lại cộng lại bằng 90° nên ∠B nhọn, tức ∠B < 90° = ∠H. ' +
      'Trong tam giác, góc lớn hơn thì cạnh đối diện lớn hơn; cạnh đối diện ∠H là AB, cạnh đối diện ∠B là AH, nên AB > AH.\n\n' +
      'KHOẢNG CÁCH\n' +
      '— Độ dài đường vuông góc AH gọi là khoảng cách từ điểm A đến đường thẳng d. Khoảng cách này là số đo của đường đi ngắn nhất từ A đến d.\n' +
      '— Khoảng cách giữa hai đường thẳng song song a và b là khoảng cách từ một điểm bất kỳ trên đường này đến đường kia. Với hai đường song song, khoảng cách này không đổi: mọi điểm trên a đều cách b một độ dài bằng nhau. ' +
      'Đó là lý do hai ray tàu luôn cách nhau một khoảng cố định.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Đo khoảng cách bằng đoạn xiên. Khoảng cách phải đo theo đường VUÔNG GÓC.\n' +
      '— Nhầm đường xiên với hình chiếu của nó. AB là đường xiên, HB là hình chiếu; hai đoạn khác nhau.\n' +
      '— Cho rằng chỉ có một đường xiên từ A đến d. Có vô số đường xiên nhưng chỉ có một đường vuông góc.',
    workedExample: {
      problem:
        'Một người ở điểm A cách bờ sông thẳng d một khoảng AH = 12 m (AH vuông góc với d tại H). Người đó định đi thẳng đến điểm B khác H trên bờ. a) Chứng minh AB > 12 m. b) Có thể đi đến một điểm khác của bờ bằng đoạn thẳng dài 11,5 m không?',
      steps: [
        'Tam giác AHB vuông tại H nên ∠H = 90°, còn ∠B nhọn vì ∠B + ∠HAB = 90°. Suy ra ∠B < ∠H.',
        'Trong tam giác AHB, cạnh đối diện góc lớn hơn thì lớn hơn. AB đối diện ∠H, AH đối diện ∠B, mà ∠H > ∠B nên AB > AH = 12 m.',
        'Vậy mọi đường xiên từ A đến bờ đều dài hơn 12 m, nên không có đoạn thẳng nào dài 11,5 m (nhỏ hơn 12 m) nối A với bờ sông.',
      ],
      answer: 'a) AB > AH = 12 m. b) Không, vì đường vuông góc 12 m đã là đường ngắn nhất.',
    },
    checkQuestions: [
      {
        prompt:
          'Nhà An ở điểm A, bờ kè là đường thẳng d. Đường vuông góc AH dài 150 m, còn đường xiên AB dài 170 m. Khoảng cách từ nhà An đến bờ kè là bao nhiêu mét?',
        answer: { kind: 'numeric', value: 150 },
        explain:
          'Khoảng cách từ một điểm đến đường thẳng là độ dài đường vuông góc, tức AH = 150 m. Lỗi hay gặp là lấy độ dài đường xiên 170 m, hoặc lấy hiệu 170 − 150 = 20.',
      },
      {
        prompt:
          'Từ điểm A ngoài đường thẳng d, đoạn thẳng nào nối A với một điểm của d là ngắn nhất?',
        choices: [
          { id: 'a', label: 'Một đường xiên bất kỳ.' },
          { id: 'b', label: 'Đường vuông góc kẻ từ A đến d.' },
          { id: 'c', label: 'Đường xiên có hình chiếu dài nhất.' },
          { id: 'd', label: 'Không có đoạn nào ngắn nhất.' },
        ],
        answer: { kind: 'choice', correctIds: ['b'] },
        explain:
          'Đường vuông góc ngắn hơn mọi đường xiên (do trong tam giác vuông, cạnh đối diện góc vuông là lớn nhất). Lỗi hay gặp là nghĩ đường xiên “gần” nào đó ngắn nhất.',
      },
      {
        prompt:
          'Hai ray tàu là hai đường thẳng song song a và b. Từ điểm M trên ray a, đoạn MH vuông góc với ray b dài 1,4 m. Khoảng cách từ một điểm N khác trên ray a đến ray b là bao nhiêu mét?',
        answer: { kind: 'numeric', value: 1.4 },
        explain:
          'Khoảng cách giữa hai đường thẳng song song không đổi: mọi điểm trên a đều cách b một đoạn bằng nhau, nên khoảng cách từ N cũng là 1,4 m. Lỗi hay gặp là cho rằng khoảng cách thay đổi theo vị trí điểm.',
      },
      {
        prompt: 'Tam giác ABC vuông tại A. So sánh nào sau đây ĐÚNG?',
        choices: [
          { id: 'a', label: 'BC > AB' },
          { id: 'b', label: 'BC < AB' },
          { id: 'c', label: 'BC = AB' },
          { id: 'd', label: 'AB > BC và AB > AC' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'BC đối diện góc vuông A (góc lớn nhất của tam giác) nên BC lớn hơn AB và AC. Cũng có thể nhìn AB là đường vuông góc từ B đến AC còn BC là đường xiên. Lỗi hay gặp là chọn cạnh dài nhất theo vẻ ngoài của hình vẽ.',
      },
    ],
    srsCards: [
      {
        hoi: 'Đường vuông góc và đường xiên: cái nào ngắn hơn?',
        dap: 'Đường vuông góc kẻ từ một điểm đến đường thẳng ngắn hơn mọi đường xiên.',
      },
      {
        hoi: 'Khoảng cách từ điểm A đến đường thẳng d là gì?',
        dap: 'Độ dài đường vuông góc AH kẻ từ A đến d (H thuộc d).',
      },
      {
        hoi: 'Khoảng cách giữa hai đường thẳng song song có đổi không?',
        dap: 'Không đổi: mọi điểm trên đường này cách đường kia một độ dài bằng nhau.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan7-c9-b3',
    grade: '7',
    chapterNumber: 9,
    chapterTitle: 'Quan hệ giữa các yếu tố trong một tam giác',
    lessonNumber: 3,
    title: 'Sự đồng quy của các đường đặc biệt trong tam giác',
    hook:
      'Cắt một miếng bìa hình tam giác, chống đầu bút chì vào một điểm đặc biệt là miếng bìa nằm thăng bằng. Điểm ấy có gì khác thường? ' +
      'Người ta còn thấy ba đường đặc biệt của tam giác luôn gặp nhau tại một điểm duy nhất, dù tam giác nhọn, tù hay bất kỳ hình dạng nào. ' +
      'Bài này giới thiệu bốn bộ ba đường như vậy: trung tuyến, phân giác, trung trực, đường cao.',
    theory:
      'BA ĐƯỜNG TRUNG TUYẾN — TRỌNG TÂM\n' +
      'Trung tuyến là đoạn nối đỉnh với trung điểm cạnh đối diện. Ba đường trung tuyến của một tam giác cùng đi qua một điểm G gọi là trọng tâm. G luôn nằm bên trong tam giác. ' +
      'Tính chất: trọng tâm cách mỗi đỉnh bằng 2/3 độ dài trung tuyến đi qua đỉnh đó. Với trung tuyến AM: AG = 2/3 · AM, GM = 1/3 · AM, tức AG = 2 · GM. ' +
      'Đây là điểm cân bằng của tấm bìa tam giác mỏng đồng chất.\n\n' +
      'BA ĐƯỜNG PHÂN GIÁC\n' +
      'Ba đường phân giác của ba góc trong tam giác cùng đi qua một điểm. Điểm đó cách đều ba cạnh của tam giác và nằm bên trong tam giác.\n\n' +
      'BA ĐƯỜNG TRUNG TRỰC\n' +
      'Ba đường trung trực của ba cạnh của tam giác cùng đi qua một điểm. Điểm đó cách đều ba đỉnh của tam giác (vì điểm trên trung trực của một cạnh cách đều hai đầu cạnh đó). ' +
      'Điểm này ở bên trong tam giác nhọn, ở trên cạnh huyền nếu tam giác vuông, ở bên ngoài nếu tam giác tù.\n\n' +
      'BA ĐƯỜNG CAO — TRỰC TÂM\n' +
      'Đường cao là đoạn vuông góc kẻ từ một đỉnh đến đường thẳng chứa cạnh đối diện. Ba đường cao (hoặc đường thẳng chứa chúng) cùng đi qua một điểm gọi là trực tâm. ' +
      'Với tam giác vuông, trực tâm là đỉnh góc vuông; tam giác tù thì trực tâm nằm bên ngoài tam giác.\n\n' +
      'TAM GIÁC CÂN VÀ TAM GIÁC ĐỀU\n' +
      'Trong tam giác cân tại A, trung tuyến, phân giác, đường cao xuất phát từ A và trung trực của đáy BC trùng nhau. Trong tam giác đều, cả bốn điểm (trọng tâm, giao ba phân giác, giao ba trung trực, trực tâm) trùng nhau.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhầm tỉ số: AG = 2/3 AM (tính từ ĐỈNH), không phải 2/3 tính từ trung điểm M. Từ trung điểm M chỉ còn 1/3.\n' +
      '— Nhầm trung tuyến với đường cao hoặc trung trực. Trung tuyến đi qua trung điểm nhưng không nhất thiết vuông góc.\n' +
      '— Cho rằng trực tâm và tâm cách đều ba đỉnh luôn nằm trong tam giác; điều này chỉ đúng với tam giác nhọn.',
    workedExample: {
      problem:
        'Tam giác ABC có hai đường trung tuyến AM và BN cắt nhau tại G, AM = 12 cm, BG = 8 cm. Tính AG, GM và độ dài trung tuyến BN.',
      steps: [
        'G là giao điểm hai đường trung tuyến nên G là trọng tâm của tam giác ABC.',
        'Trọng tâm cách đỉnh bằng 2/3 độ dài trung tuyến: AG = 2/3 · AM = 2/3 · 12 = 8 cm.',
        'GM = AM − AG = 12 − 8 = 4 cm (đúng bằng 1/3 · AM, và AG = 2 · GM).',
        'Với trung tuyến BN: BG = 2/3 · BN nên BN = BG : 2/3 = 8 · 3/2 = 12 cm.',
      ],
      answer: 'AG = 8 cm, GM = 4 cm, BN = 12 cm.',
    },
    checkQuestions: [
      {
        prompt:
          'Gọi G là trọng tâm của tam giác ABC và AM là đường trung tuyến kẻ từ A. Độ dài AG bằng phân số nào của độ dài AM?',
        answer: { kind: 'fraction', num: 2, den: 3 },
        explain:
          'Trọng tâm cách đỉnh bằng 2/3 độ dài trung tuyến đi qua đỉnh đó, nên AG : AM = 2/3. Lỗi hay gặp là đáp 1/3, đó là tỉ số GM : AM tính từ trung điểm.',
      },
      {
        prompt:
          'Gọi G là trọng tâm của tam giác ABC, M là trung điểm của BC và GM = 5 cm. Tính độ dài trung tuyến AM (đơn vị cm).',
        answer: { kind: 'numeric', value: 15 },
        explain:
          'GM = 1/3 · AM nên AM = 3 · GM = 15 cm (cũng là AG = 2 · GM = 10 cm rồi cộng GM). Lỗi hay gặp là tính AM = 2 · GM = 10 cm vì nhầm đó là độ dài AG.',
      },
      {
        prompt:
          'Ba ngôi nhà A, B, C không thẳng hàng. Người ta muốn đào một giếng cách đều cả ba nhà. Giếng phải đặt tại giao điểm của ba đường nào của tam giác ABC?',
        choices: [
          { id: 'a', label: 'Ba đường trung tuyến' },
          { id: 'b', label: 'Ba đường phân giác' },
          { id: 'c', label: 'Ba đường trung trực' },
          { id: 'd', label: 'Ba đường cao' },
        ],
        answer: { kind: 'choice', correctIds: ['c'] },
        explain:
          'Điểm cách đều hai đầu mút của một đoạn thẳng nằm trên trung trực của đoạn đó; điểm cách đều cả A, B, C là giao của ba đường trung trực. Lỗi hay gặp là chọn phân giác (điểm đó cách đều ba CẠNH, không phải ba đỉnh).',
      },
      {
        prompt:
          'Tấm bìa tam giác mỏng đồng chất được treo thăng bằng nhờ một sợi chỉ buộc ở trọng tâm G. Đường trung tuyến kẻ từ đỉnh A dài 18 cm. Điểm treo G cách đỉnh A bao nhiêu cm?',
        answer: { kind: 'numeric', value: 12 },
        explain:
          'Trọng tâm cách đỉnh 2/3 độ dài trung tuyến: 2/3 · 18 = 12 cm. Lỗi hay gặp là đáp 6 cm (1/3 của 18) vì tính khoảng cách từ trung điểm cạnh đối diện.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tính chất của trọng tâm tam giác?',
        dap: 'Trọng tâm là giao ba trung tuyến, cách mỗi đỉnh bằng 2/3 độ dài trung tuyến đi qua đỉnh đó.',
      },
      {
        hoi: 'Giao điểm ba đường phân giác cách đều gì? Giao ba trung trực cách đều gì?',
        dap: 'Giao ba phân giác cách đều ba cạnh; giao ba trung trực cách đều ba đỉnh.',
      },
      {
        hoi: 'Trực tâm là gì?',
        dap: 'Giao điểm của ba đường cao của tam giác.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
